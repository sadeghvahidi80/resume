# -*- coding: utf-8 -*-
"""Verify the deployed site against the facts changed in this round."""

import os
import re
import shutil
import subprocess
import tempfile
import time

# This machine sits behind a local proxy (127.0.0.1:18089) that intermittently
# stalls TLS handshakes from urllib. curl with "--noproxy *" is reliable here,
# so every request goes through it instead.
CURL = shutil.which("curl") or "curl"
BASE = "https://sadeghvahidi.ir/"
RESULTS = []


def _fetch(path):
    url = BASE + path
    last = (0, b"")
    # The local link occasionally drops a connection mid-body; a couple of
    # retries keeps the guard honest without hiding real 404s.
    for attempt in range(3):
        fd, tmp = tempfile.mkstemp(prefix="livecheck-")
        os.close(fd)
        try:
            proc = subprocess.run(
                [
                    CURL,
                    "-s",
                    "-L",
                    "--noproxy",
                    "*",
                    "--max-time",
                    "45",
                    "-A",
                    "Mozilla/5.0 site-check",
                    # Cloudflare only injects the Web Analytics beacon into
                    # responses that look like a browser navigation, so ask for
                    # HTML explicitly; without this the beacon check is a lie.
                    "-H",
                    "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    # Fastly serves HTML gzipped (~5x smaller). The local link
                    # truncates large identity downloads around 64KB, so ask for
                    # compression and let curl decode it.
                    "--compressed",
                    "-o",
                    tmp,
                    "-w",
                    "%{http_code}",
                    url,
                ],
                capture_output=True,
                text=True,
                timeout=60,
            )
            code = proc.stdout.strip()
            status = int(code) if code.isdigit() else 0
            with open(tmp, "rb") as fh:
                body = fh.read()
            if status == 200 and body:
                return status, body
            last = (status, body)
        finally:
            try:
                os.remove(tmp)
            except OSError:
                pass
        if attempt < 2:
            time.sleep(2)
    return last


def get(path):
    status, body = _fetch(path)
    return status, body.decode("utf-8", "replace")


def head(path, base=BASE):
    """Return (status, headers) for one request; the last header block wins."""
    proc = subprocess.run(
        [
            CURL,
            "-sS",
            "-D",
            "-",
            "-o",
            os.devnull,
            "--noproxy",
            "*",
            "--max-time",
            "45",
            "-A",
            "Mozilla/5.0 site-check",
            base + path,
        ],
        capture_output=True,
        text=True,
        timeout=60,
    )
    headers = {}
    status = 0
    for line in proc.stdout.splitlines():
        line = line.strip()
        if line.lower().startswith("http/"):
            headers = {}
            parts = line.split()
            if len(parts) > 1 and parts[1].isdigit():
                status = int(parts[1])
        elif ":" in line:
            key, _, value = line.partition(":")
            headers[key.strip().lower()] = value.strip()
    return status, headers


def post(path, data, base=BASE, headers=None, ua="Mozilla/5.0 site-check"):
    """POST one small text body and return (status, headers)."""
    cmd = [
        CURL,
        "-sS",
        "-D",
        "-",
        "-o",
        os.devnull,
        "-X",
        "POST",
        "--noproxy",
        "*",
        "--max-time",
        "45",
        "-A",
        ua,
        "-H",
        "content-type: text/plain",
    ]
    for key, value in (headers or {}).items():
        cmd += ["-H", "%s: %s" % (key, value)]
    cmd += ["--data-binary", data, base + path]
    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
    out = {}
    status = 0
    for line in proc.stdout.splitlines():
        line = line.strip()
        if line.lower().startswith("http/"):
            out = {}
            parts = line.split()
            if len(parts) > 1 and parts[1].isdigit():
                status = int(parts[1])
        elif ":" in line:
            key, _, value = line.partition(":")
            out[key.strip().lower()] = value.strip()
    return status, out


def csp_directives(value):
    """Split a CSP header into {directive: [sources]} for precise assertions."""
    out = {}
    for part in value.split(";"):
        bits = part.strip().split()
        if bits:
            out[bits[0]] = bits[1:]
    return out


def doh(name, rtype):
    """Resolve through Cloudflare's DNS-over-HTTPS so the check is OS-agnostic."""
    proc = subprocess.run(
        [
            CURL,
            "-sS",
            "--noproxy",
            "*",
            "--max-time",
            "30",
            "-H",
            "accept: application/dns-json",
            "https://cloudflare-dns.com/dns-query?name=%s&type=%s" % (name, rtype),
        ],
        capture_output=True,
        text=True,
        timeout=45,
    )
    return proc.stdout


def fetch_bytes(path):
    return _fetch(path)


def check(name, ok):
    RESULTS.append((name, ok))


def h1_ok(text):
    """Exactly one h1 per language view (bilingual pages render two views)."""
    marker = re.search(r'<(?:div|section) class="lang-en">', text)
    if marker is None:
        return len(re.findall(r"<h1[ >]", text)) == 1
    return (
        len(re.findall(r"<h1[ >]", text[: marker.start()])) == 1
        and len(re.findall(r"<h1[ >]", text[marker.start() :])) == 1
    )


status, home = get("")
check("home 200", status == 200)
check("home: Ravan Yar 2.0 ready (fa)", home.count("نسخهٔ ۲٫۰ آمادهٔ انتشار") == 1)
check("home: old in-development wording gone", "در حال توسعه" not in home)
check(
    "home: menu label visible (fa)",
    '<span class="nav-menu-label"><span class="lang-fa">منو</span>' in home,
)
check("home: menu has shop link", '<a href="/shop.html">فروشگاه</a>' in home)
check("home: menu has gallery link", '<a href="/gallery.html">گالری</a>' in home)
check("home: works links fa", home.count('<a href="works.html">آثار</a>') == 2)
check("home: works links en", home.count('<a href="works.html">Works</a>') == 2)
check("home: body font preload", "vazirmatn-arabic.woff2" in home)
check("home: one h1 per language view", h1_ok(home))
check("home: no /index.html links", 'href="index.html"' not in home)

status, works = get("works.html")
title = re.search(r"<title[^>]*>(.*?)</title>", works, re.S)
check("works 200", status == 200)
check(
    "works: title",
    bool(title) and title.group(1).strip() == "آثار و شواهد — صادق وحیدی",
)
check("works: one h1 per language view", h1_ok(works))
check("works: self links", works.count('href="works.html"') == 4)
check("works: menu self links", works.count('href="/works.html"') == 2)
check("works: 2 JSON-LD blocks", works.count("application/ld+json") == 2)
check("works: Ravan Yar 2.0 (fa)", "نسخهٔ ۲٫۰ آمادهٔ انتشار است" in works)
check("works: Ravan Yar 2.0 (en)", "version 2.0 is ready for release" in works)
check("works: not released (en)", "public build is not out yet" in works)
check("works: Ensaf link", "ensafnews.com/647785/" in works)
check("works: both demos", "/demos/ravanyar/" in works and "/demos/karabi/" in works)
check(
    "works: Ronix link",
    "ronix.ir/mag/difference-between-tig-and-mma-welding-machine" in works,
)
check("works: Poolaki link", "poolaki.app/blog/" in works)
check("works: Maktabkhooneh link", "maktabkhooneh.org/mag/sln-in-excel/" in works)
check("works: 43 works stated (fa)", "۴۳ اثر" in works)
check("works: 43 works stated (en)", "43 works" in works)
check(
    "works: inclusion rule (fa)",
    "هر مدخل یا لینک عمومی دارد یا در صفحهٔ پروژه‌ها و آرشیو رزومه به آن ارجاع شده است"
    in works,
)
check(
    "works: inclusion rule (en)",
    "each entry either carries a public link or is referenced on the projects page"
    in works,
)
check("works: no /index.html links", 'href="index.html"' not in works)
check(
    "works: note13 slug matches resume",
    "gsn-33753/%d9%85%d9%82%d8%a7%db%8c%d8%b3%d9%87-%da%af%d9%88%d8%b4%db%8c" in works,
)

status, works_en = get("works.html?lang=en")
check("works?lang=en 200", status == 200)
check("works?lang=en: same document (JS switch)", works_en == works)
check(
    "works?lang=en: both language blocks present",
    "Works &amp; evidence" in works_en and "آثار و شواهد" in works_en,
)

status, css = get("assets/style.css")
check("css 200", status == 200)
check("css: mobile query 949.98", "@media (max-width:949.98px)" in css)
check("css: desktop query 950", "@media (min-width:950px)" in css)
check("css: no stale 820 query", "max-width:820px" not in css)

status, sitemap = get("sitemap.xml")
locs = re.findall(r"<loc>(.*?)</loc>", sitemap)
check("sitemap 200", status == 200)
check("sitemap: 25 urls", len(locs) == 25)
check("sitemap: works listed", any("works.html" in u for u in locs))
check("sitemap: gallery listed", any(u.endswith("/gallery.html") for u in locs))
check("sitemap: shop listed", "https://sadeghvahidi.ir/shop.html" in locs)
check(
    "sitemap: standalone data page listed",
    "https://sadeghvahidi.ir/lead-harvest.html" in locs,
)

status, shop = get("shop.html")
check("shop 200", status == 200)
check(
    "shop: public tariff in both languages",
    'id="shop-tariff"' in shop and 'id="en-shop-tariff"' in shop,
)
check(
    "shop: five buyable products",
    all(
        ('data-product="%s"' % pid) in shop
        for pid in (
            "consult-45",
            "process-audit",
            "sop-sprint",
            "site-build",
            "research-report",
        )
    )
    and 'data-product="lead-harvest"' not in shop,
)
check(
    "shop: links the standalone data page",
    shop.count('href="lead-harvest.html"') == 2,
)
check(
    "shop: prices are static html, no js needed",
    'data-price-toman="1500000"' in shop
    and 'data-price-toman="15000000"' in shop
    and 'data-price-toman="5000000"' in shop,
)

status, lh = get("lead-harvest.html")
check("lead-harvest 200", status == 200)
check(
    "lead-harvest: both languages present",
    "داده و لید، با" in lh and "Data and leads, with" in lh,
)
check(
    "lead-harvest: public-source boundary",
    "فقط منبع عمومی" in lh and "Public sources only" in lh,
)
check(
    "lead-harvest: no per-1,000 sale language",
    "هر ۱٬۰۰۰ شماره" not in lh and "Per 1,000" not in lh,
)

status, rfa = get("resume/fa/")
check("resume fa 200", status == 200)
check("resume fa: 2.0 ready x6", rfa.count("نسخهٔ ۲٫۰ آمادهٔ انتشار") == 6)
check("resume fa: not released x6", rfa.count("نسخهٔ عمومی هنوز منتشر نشده") == 6)
check(
    "resume fa: Sabzevar claim softened",
    "سامانه فعال — در حال استفاده" not in rfa
    and "سامانه طراحی و توسعه داده شد." in rfa,
)
check("resume fa: military tag clarified", "پایان خدمت سربازی" in rfa)
check(
    "resume fa: both military tags clarified",
    rfa.count("پایان خدمت سربازی") == 2
    and not re.search(r"پایان خدمت(?![ ]سربازی)", rfa),
)
check("resume fa: no /index.html links", 'href="index.html"' not in rfa)

status, ren = get("resume/en/")
check("resume en 200", status == 200)
check(
    "resume en: Sabzevar claim softened",
    "Live system — in use" not in ren
    and "The system was designed and developed." in ren,
)
check(
    "resume en: Sangsfidi only",
    ren.count("Sangsfidi") >= 4 and "Sang-Sefidi" not in ren,
)
check(
    "resume en: Jenzadegi transliteration matches projects",
    "Jenzadegi" in ren and "Jen-zedegi" not in ren,
)

_retired_bad = []
for _loc in ("ar", "de", "es", "fr", "it", "ru", "zh"):
    _st, _body = get("resume/%s/" % _loc)
    if _st != 200 or 'content="noindex, follow"' not in _body:
        _retired_bad.append(_loc)
check(
    "resume locales: seven retired editions answer with a noindex stub (bad: %s)"
    % (_retired_bad,),
    not _retired_bad,
)

status, projects = get("projects.html")
check("projects 200", status == 200)
check("projects: Tafviz typo gone", "Tafviz" not in projects)
check(
    "projects: Jenzadegi transliteration",
    "Jenzadegi" in projects and "Jen-zedegi" not in projects,
)
check("projects: no /index.html links", 'href="index.html"' not in projects)
check(
    "projects: no operational-use claim",
    "سامانه فعال — در حال استفاده" not in projects
    and "Live system — in use" not in projects,
)
check(
    "works: no operational-use claim",
    "سامانه فعال است و در عملیات تعمیرات استفاده می‌شود" not in works
    and "is live and used in repair operations" not in works,
)
check(
    "works: softened Karabi wording",
    "سامانه طراحی و توسعه داده شد" in works
    and "The system was designed and developed" in works,
)

status, contact = get("contact.html")
check("contact 200", status == 200)
check(
    "contact: domain email mailto x2",
    contact.count('href="mailto:contact@sadeghvahidi.ir"') >= 2,
)
check("contact: no personal gmail", "sadeghvahidi80@gmail.com" not in contact)
check(
    "home: domain email present",
    home.count("contact@sadeghvahidi.ir") >= 2,
)

status, gallery = get("gallery.html")
check("gallery 200", status == 200)
check("gallery: indexable", "noindex" not in gallery)
gtitle = re.search(r"<title[^>]*>(.*?)</title>", gallery, re.S)
check(
    "gallery: title",
    bool(gtitle) and gtitle.group(1).strip() == "گزیدهٔ تصاویر — صادق وحیدی",
)
check("gallery: one h1 per language view", h1_ok(gallery))
check("gallery: grid container", "data-gallery" in gallery)
check("gallery: footer self link x4", gallery.count('href="gallery.html"') == 4)
check("home: gallery footer link x4", home.count('href="gallery.html"') == 4)
check(
    "home: gallery label in both locales",
    ">گالری</a>" in home and ">Gallery</a>" in home,
)

status, gdata = get("assets/gallery-data.js")
check("gallery data 200", status == 200)
check("gallery data: 11 entries", gdata.count('"src": "assets/gallery/') == 11)
check("gallery data: webp only", "/gallery/" in gdata and ".jpg" not in gdata)

status, _console = fetch_bytes("assets/maten-console.webp")
check("MATEN console image 200", status == 200 and len(_console) > 20000)
check(
    "works: MATEN console image x2",
    works.count('src="assets/maten-console.webp"') == 2,
)
check(
    "works: console redaction disclosed",
    "نام داخلی محصول و شناسه‌های مشتری برای حفظ محرمانگی محو شده‌اند" in works
    and "The internal product name and customer identifiers are masked for confidentiality"
    in works,
)

for i in (1, 5, 11):
    status, body = fetch_bytes("assets/gallery/gallery-%02d.webp" % i)
    check("gallery-%02d.webp 200" % i, status == 200 and len(body) > 5000)

# --- 2026-11-22 SEO/GEO: Service + FAQPage schema, visible FAQ, webp signature
status, svc = get("services.html")
svc_types = re.findall(
    r'<script type="application/ld\+json">\{"@context":"https://schema.org","@type":"([A-Za-z]+)"',
    svc,
)
check("services 200", status == 200)
check(
    "services: schema types in order",
    svc_types == ["BreadcrumbList", "Service", "FAQPage", "FAQPage"],
)
check("services: 6 offers in Service catalog", svc.count('"@type":"Offer"') == 6)
check("services: 8 FAQ items", svc.count('<details class="faq-item"') == 8)
check(
    "services: 12 service detail toggles", svc.count('<details class="svc-more"') == 12
)
check("services: 20 summaries", svc.count("<summary>") == 20)
check(
    "services: FAQ sections in both locales",
    '<section id="faq">' in svc and '<section id="en-faq">' in svc,
)
check("services: FAQ styled", ".faq-item>summary::after" in css)

status, mgz = get("magazine.html")
check("magazine 200", status == 200)
check("magazine: CollectionPage schema", '"@type":"CollectionPage"' in mgz)
check(
    "magazine: ItemList points at the article",
    'content-system-customers.html","name"' in mgz,
)
check(
    "magazine: ItemList carries both articles",
    mgz.count('"@type":"ListItem"') == 2
    and "magazine/agency-mongol-narrative.html" in mgz,
)
check("magazine: 4 article cards", mgz.count('class="mag-card"') == 4)

status, art = get("magazine/content-system-customers.html")
check("article 200", status == 200)
check("article: publisher in schema", re.search(r'"publisher":\s*\{', art) is not None)
check(
    "article: dateModified live",
    re.search(r'"dateModified":\s*"2026-11-22"', art) is not None,
)
check("article: modified-time meta live", "article:modified_time" in art)
check(
    "article: signature webp referenced",
    'src="/assets/signature-sadegh-vahidi.webp"' in art,
)

status, sig = fetch_bytes("assets/signature-sadegh-vahidi.webp")
check(
    "signature.webp 200",
    status == 200 and sig[:4] == b"RIFF" and sig[8:12] == b"WEBP" and len(sig) > 5000,
)

# --- 2026-11-22: the Ensaf News essay republished as the second magazine piece
status, essay = get("magazine/agency-mongol-narrative.html")
check("ensaf essay 200", status == 200)
check(
    "ensaf essay: canonical",
    '<link href="https://sadeghvahidi.ir/magazine/agency-mongol-narrative.html" rel="canonical"/>'
    in essay,
)
check("ensaf essay: title", "مسئله عاملیت، روایتی مه‌آلود از مغول" in essay)
check("ensaf essay: one h1", len(re.findall(r"<h1[ >]", essay)) == 1)
check("ensaf essay: 24 paragraphs", essay.count("<p>") == 24)
check("ensaf essay: 6 section headings", essay.count("<h2>") == 6)
check("ensaf essay: publisher date", '"datePublished": "2026-06-16"' in essay)
check("ensaf essay: attribution", "ensafnews.com/647785/" in essay)
check("ensaf essay: back to magazine", 'href="/magazine.html"' in essay)

_new = sorted(
    u
    for u, d in re.findall(r"<loc>(.*?)</loc><lastmod>(.*?)</lastmod>", sitemap)
    if d == "2026-11-22"
)
check(
    "sitemap: 6 edited pages at 2026-11-22",
    _new
    == [
        "https://sadeghvahidi.ir/magazine.html",
        "https://sadeghvahidi.ir/magazine/agency-mongol-narrative.html",
        "https://sadeghvahidi.ir/magazine/content-system-customers.html",
        "https://sadeghvahidi.ir/projects.html",
        "https://sadeghvahidi.ir/services.html",
        "https://sadeghvahidi.ir/works.html",
    ],
)
_retired = sorted(
    u
    for u, d in re.findall(r"<loc>(.*?)</loc><lastmod>(.*?)</lastmod>", sitemap)
    if d == "2026-11-28"
)
check(
    "sitemap: 13 edited pages at 2026-11-28",
    _retired
    == sorted(
        [
            "https://sadeghvahidi.ir/resume.html",
            "https://sadeghvahidi.ir/resume/en/",
            "https://sadeghvahidi.ir/resume/fa/",
            "https://sadeghvahidi.ir/en/",
            "https://sadeghvahidi.ir/en/about.html",
            "https://sadeghvahidi.ir/en/contact.html",
            "https://sadeghvahidi.ir/en/gallery.html",
            "https://sadeghvahidi.ir/en/lead-harvest.html",
            "https://sadeghvahidi.ir/en/magazine.html",
            "https://sadeghvahidi.ir/en/projects.html",
            "https://sadeghvahidi.ir/en/services.html",
            "https://sadeghvahidi.ir/en/shop.html",
            "https://sadeghvahidi.ir/en/works.html",
        ]
    ),
)

# --- 2026-11-25: the edge must send the baseline headers to every visitor.
# These live in a Cloudflare response-header rule, not in the repository, so a
# silent deletion there is exactly the regression this check exists to catch.
EDGE_HEADERS = {
    "strict-transport-security": "max-age=31536000",
    "x-content-type-options": "nosniff",
    "x-frame-options": "SAMEORIGIN",
    "referrer-policy": "strict-origin-when-cross-origin",
}
for _page in ("", "shop.html", "resume/fa/"):
    _label = _page or "/"
    _st, _h = head(_page)
    check("edge %s: 200" % _label, _st == 200)
    for _name, _want in EDGE_HEADERS.items():
        check(
            "edge %s: %s" % (_label, _name),
            _h.get(_name, "").startswith(_want),
        )
    check(
        "edge %s: permissions-policy" % _label,
        "geolocation=()" in _h.get("permissions-policy", ""),
    )

# The CSP comes from the same edge rule, but it is scoped to skip /demos/,
# where the demo apps rely on their own inline scripts.
_csp_status, _csp_headers = head("")
_csp_value = _csp_headers.get("content-security-policy", "")
_csp_map = csp_directives(_csp_value)
check("edge /: CSP present", _csp_status == 200 and bool(_csp_value))
for _directive in (
    "default-src 'none'",
    "script-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'self'",
):
    check("edge /: CSP has %s" % _directive, _directive in _csp_value)
check(
    "edge /: CSP script-src allows the RUM script",
    "https://static.cloudflareinsights.com" in _csp_map.get("script-src", []),
)
check(
    "edge /: CSP connect-src allows the RUM endpoint",
    "https://cloudflareinsights.com" in _csp_map.get("connect-src", []),
)

_demo_status, _demo_headers = head("demos/karabi/")
check("demos: reachable", _demo_status == 200)
check(
    "demos: site CSP not applied",
    "content-security-policy" not in _demo_headers,
)

# pay. is served by the worker; the zone rule is scoped to the two site hosts so
# it must not downgrade the worker's stricter values.
_st, _pay = head("api/health", base="https://pay.sadeghvahidi.ir/")
check("pay: reachable", _st == 200)
check("pay: frame denied", _pay.get("x-frame-options") == "DENY")
check("pay: no-referrer", _pay.get("referrer-policy") == "no-referrer")
check(
    "pay: CSP locked",
    "default-src 'none'" in _pay.get("content-security-policy", ""),
)

# --- 2026-11-26: analytics. Cloudflare RUM supplies visits and Core Web
# Vitals; the first-party counter stores only paths and referrer hosts. The
# live checks below prove the endpoint is up and that it refuses anything that
# is not a real pageview, without writing a row from CI.
check("home: first-party counter loaded", "/assets/analytics.js" in home)
check("resume fa: first-party counter loaded", "/assets/analytics.js" in rfa)
check("home: Cloudflare RUM beacon injected", "cloudflareinsights.com" in home)

_analytics_status, _analytics_js = get("assets/analytics.js")
check("analytics.js 200", _analytics_status == 200)
check(
    "analytics.js: posts to the worker",
    "pay.sadeghvahidi.ir/api/hit" in _analytics_js,
)
check(
    "analytics.js: honours DNT and GPC",
    "doNotTrack" in _analytics_js and "globalPrivacyControl" in _analytics_js,
)

_hit_get, _ = head("api/hit", base="https://pay.sadeghvahidi.ir/")
check("hit: GET is 405", _hit_get == 405)

_hit_bad, _ = post(
    "api/hit",
    '{"path":"shop.html"}',
    base="https://pay.sadeghvahidi.ir/",
    headers={"origin": "https://sadeghvahidi.ir"},
)
check("hit: invalid path is 400", _hit_bad == 400)

_hit_foreign, _ = post(
    "api/hit",
    '{"path":"/shop.html"}',
    base="https://pay.sadeghvahidi.ir/",
    headers={"origin": "https://evil.example"},
)
check("hit: foreign origin is 403", _hit_foreign == 403)

_hit_anon, _ = post(
    "api/hit",
    '{"path":"/shop.html"}',
    base="https://pay.sadeghvahidi.ir/",
)
check("hit: missing origin is 403", _hit_anon == 403)

# Mail authentication: SPF must exist and DMARC must stay published, otherwise
# mail from the domain can be spoofed without any signal.
_spf = doh("sadeghvahidi.ir", "TXT")
check("mail: SPF published", "v=spf1 include:_spf.mx.cloudflare.net" in _spf)
_dmarc = doh("_dmarc.sadeghvahidi.ir", "TXT")
check("mail: DMARC published", "v=DMARC1" in _dmarc)
check("mail: DMARC policy is p=none", "p=none" in _dmarc)
check("mail: DMARC reports to the domain address", "contact@sadeghvahidi.ir" in _dmarc)

fails = 0
for name, ok in RESULTS:
    print(("PASS " if ok else "FAIL ") + name)
    fails += 0 if ok else 1
print()
print("FAILURES:", fails)
