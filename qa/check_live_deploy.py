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


def fetch_bytes(path):
    return _fetch(path)


def check(name, ok):
    RESULTS.append((name, ok))


status, home = get("")
check("home 200", status == 200)
check("home: Ravan Yar 2.0 ready (fa)", home.count("نسخهٔ ۲٫۰ آمادهٔ انتشار") == 1)
check("home: old in-development wording gone", "در حال توسعه" not in home)
check("home: works nav fa x4", home.count('<a href="works.html">آثار</a>') == 4)
check("home: works nav en x4", home.count('<a href="works.html">Works</a>') == 4)
check("home: body font preload", "vazirmatn-arabic.woff2" in home)
check("home: exactly one h1", len(re.findall(r"<h1[ >]", home)) == 1)
check("home: no /index.html links", 'href="index.html"' not in home)

status, works = get("works.html")
title = re.search(r"<title[^>]*>(.*?)</title>", works, re.S)
check("works 200", status == 200)
check(
    "works: title",
    bool(title) and title.group(1).strip() == "آثار و شواهد — صادق وحیدی",
)
check("works: one h1", len(re.findall(r"<h1[ >]", works)) == 1)
check("works: 8 self links", works.count('href="works.html"') == 8)
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
check("sitemap: 20 urls", len(locs) == 20)
check("sitemap: works listed", any("works.html" in u for u in locs))
check("sitemap: gallery listed", any(u.endswith("/gallery.html") for u in locs))

status, rfa = get("resume/fa/")
check("resume fa 200", status == 200)
check("resume fa: 2.0 ready x4", rfa.count("نسخهٔ ۲٫۰ آمادهٔ انتشار") == 4)
check("resume fa: not released x4", rfa.count("نسخهٔ عمومی هنوز منتشر نشده") == 4)
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

_ensaf_live = {
    "ar": "16 يونيو 2026",
    "de": "16. Juni 2026",
    "es": "16 jun 2026",
    "fr": "16 juin 2026",
    "it": "16 giu 2026",
    "ru": "16 июн. 2026",
    "zh": "2026 年 6 月 16 日",
}
_bad = []
for _loc, _want in _ensaf_live.items():
    _st, _body = get("resume/%s/" % _loc)
    if _st != 200 or _want not in _body:
        _bad.append(_loc)
check(
    "resume locales: Ensaf date is 16 June 2026 live (bad: %s)" % (_bad,),
    not _bad,
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
check("gallery: one h1", len(re.findall(r"<h1[ >]", gallery)) == 1)
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
    "بخشی از شناسهٔ داخلی محصول محو شده است" in works
    and "Part of the internal product name is masked" in works,
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
check("services: 8 FAQ summaries", svc.count("<summary>") == 8)
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
    "sitemap: 15 edited pages at 2026-11-22",
    _new
    == [
        "https://sadeghvahidi.ir/magazine.html",
        "https://sadeghvahidi.ir/magazine/agency-mongol-narrative.html",
        "https://sadeghvahidi.ir/magazine/content-system-customers.html",
        "https://sadeghvahidi.ir/projects.html",
        "https://sadeghvahidi.ir/resume/ar/",
        "https://sadeghvahidi.ir/resume/de/",
        "https://sadeghvahidi.ir/resume/en/",
        "https://sadeghvahidi.ir/resume/es/",
        "https://sadeghvahidi.ir/resume/fa/",
        "https://sadeghvahidi.ir/resume/fr/",
        "https://sadeghvahidi.ir/resume/it/",
        "https://sadeghvahidi.ir/resume/ru/",
        "https://sadeghvahidi.ir/resume/zh/",
        "https://sadeghvahidi.ir/services.html",
        "https://sadeghvahidi.ir/works.html",
    ],
)

fails = 0
for name, ok in RESULTS:
    print(("PASS " if ok else "FAIL ") + name)
    fails += 0 if ok else 1
print()
print("FAILURES:", fails)
