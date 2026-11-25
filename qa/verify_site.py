import io
import json
import os
import re

S = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
fails = []


def check(cond, msg):
    print(("PASS " if cond else "FAIL ") + msg)
    if not cond:
        fails.append(msg)


def read(name):
    return io.open(os.path.join(S, name.replace("\\", "/")), encoding="utf-8").read()


def h1_ok(text):
    """Exactly one h1 per language view (bilingual pages keep two views)."""
    marker = re.search(r'<(?:div|section) class="lang-en">', text)
    if marker is None:
        return text.count("<h1") == 1
    return (
        text[: marker.start()].count("<h1") == 1
        and text[marker.start() :].count("<h1") == 1
    )


def ld_blocks(text):
    """Parsed JSON-LD blocks in document order."""
    return [
        json.loads(m.group(1))
        for m in re.finditer(
            r'<script type="application/ld\+json">(.*?)</script>', text, re.S
        )
    ]


pages = [f for f in sorted(os.listdir(S)) if f.endswith(".html")]
for name in pages:
    t = read(name)
    check(h1_ok(t), "%s: one h1 per language view (%d total)" % (name, t.count("<h1")))
    check("پروۚه" not in t, "%s: no broken glyph" % name)
    nav_blk = re.search(r'<div class="nav-links">(.*?)</div>', t, re.S)
    check(
        nav_blk is not None and "gallery.html" not in nav_blk.group(1),
        "%s: no gallery link in the desktop nav (950px width budget)" % name,
    )
    for m in re.finditer(
        r'<script type="application/ld\+json">(.*?)</script>', t, re.S
    ):
        try:
            json.loads(m.group(1))
        except Exception as e:
            fails.append("%s: JSON-LD invalid: %s" % (name, e))
    print("PASS %s: JSON-LD parsed" % name)

pr = read("projects.html")
check(pr.count("پنج‌ایجنتی") == 0, "projects: no پنج‌ایجنتی")
check("۲ پلتفرم" not in pr, "projects: no ۲ پلتفرم")
check("لینک‌های قابل بررسی" not in pr, "projects: no checkable-links claim (fa)")
check("checkable links" not in pr, "projects: no checkable-links claim (en)")
check("پروجه" not in pr, "projects: breadcrumb fixed")
check(pr.count("۵ ایجنتی") == 1, "projects: ۵ ایجنتی present")
check(pr.count('href="/demos/karabi/"') == 2, "projects: 2 Karabi demo links")
check(pr.count('href="/demos/ravanyar/"') == 2, "projects: 2 Ravan Yar demo links")

ix = read("index.html")
check(
    "محصولات و سامانه‌های توسعه‌یافته: ماتن · روان‌یار · کرابی" in ix,
    "index: products named (fa)",
)
check(
    "Products and systems built: MATEN · Ravan Yar · Karabi" in ix,
    "index: products named (en)",
)
check("آمادهٔ انتشار" in ix, "index: Ravan Yar release-ready (fa)")
check("ready for release" in ix, "index: Ravan Yar release-ready (en)")
check("در حال توسعه" not in ix, "index: old in-development chip gone (fa)")
check("in development" not in ix, "index: old in-development chip gone (en)")

sv = read("services.html")
check(sv.count("شش حوزهٔ مشخص") == 1, "services: six areas hero (fa)")
check(sv.count("شش <em>حوزه</em>") == 1, "services: six areas title (fa)")
check(sv.count("Six defined areas") == 1, "services: six areas hero (en)")
check(sv.count("Six <em>areas</em>") == 1, "services: six areas title (en)")
fa_sec = sv[sv.find('<section id="services">') : sv.find('<section id="modes">')]
en_sec = sv[sv.find('<section id="en-services">') : sv.find('<section id="en-modes">')]
check(
    fa_sec.count('class="case-card"') == 6,
    "services: 6 cards (fa) got %d" % fa_sec.count('class="case-card"'),
)
check(
    en_sec.count('class="case-card"') == 6,
    "services: 6 cards (en) got %d" % en_sec.count('class="case-card"'),
)
check("طراحی و ساخت وب‌سایت" in fa_sec, "services: web design card (fa)")
check("Website Design &amp; Build" in en_sec, "services: web design card (en)")
check("مدیریت و تولید محتوا" in fa_sec, "services: content production card (fa)")
check(
    "Content Management &amp; Production" in en_sec,
    "services: content production card (en)",
)

rfa = read("resume/fa/index.html")
ren = read("resume/en/index.html")

# --- audit 2026-11-15: Ravan Yar status unified, unaudited security claims gone
check(
    "CSRF" not in pr and "HttpOnly" not in pr, "projects: no unaudited security claims"
)
check(
    "محدودیت نرخ" not in pr and "rate limiting" not in pr,
    "projects: no rate-limit claim",
)
check(
    pr.count("نسخهٔ ۲٫۰ آمادهٔ انتشار است") == 1,
    "projects: Ravan Yar 2.0 release-ready (fa)",
)
check(
    pr.count("Version 2.0 is ready for release") == 1,
    "projects: Ravan Yar 2.0 release-ready (en)",
)
check(
    pr.count("نسخهٔ عمومی هنوز منتشر نشده") == 1,
    "projects: public build not released (fa)",
)
check(
    pr.count("public build has not been published yet") == 1,
    "projects: public build not released (en)",
)
check(pr.count("(داده نمونه)") == 2, "projects: demos labelled sample data (fa)")
check(pr.count("(sample data)") == 2, "projects: demos labelled sample data (en)")
check(
    rfa.count("نسخهٔ عمومی هنوز منتشر نشده") == 4,
    "resume fa: public build not released x4",
)
check(
    ren.count("not publicly released yet") == 2,
    "resume en: public build not released x2",
)
check("روان‌یار — بهبود دسترسی" in rfa, "resume fa: Ravan Yar named")
check("Ravan Yar — improving" in ren, "resume en: Ravan Yar named")

# --- audit 2026-11-15: Ensaf title and topic unified
check("روایت روزنامه انصاف نیوز" not in pr, "projects: old Ensaf summary gone (fa)")
check("روایت روزنامه انصاف نیوز" not in rfa, "resume fa: old Ensaf summary gone")
check(
    "Ensaf News feature (narrative)" not in pr, "projects: old Ensaf summary gone (en)"
)
check("Ensaf News feature (narrative)" not in ren, "resume en: old Ensaf summary gone")
check("تحلیل مسئله عاملیت اجتماعی" not in pr, "projects: old Ensaf topic gone (fa)")
check("تحلیل مسئله عاملیت اجتماعی" not in rfa, "resume fa: old Ensaf topic gone")
check(
    "An analysis of social agency with historical examples" not in pr,
    "projects: old Ensaf topic gone (en)",
)
check("مسئله عاملیت، روایتی مه‌آلود از مغول" in pr, "projects: Ensaf title unified (fa)")
check(
    "The Problem of Agency: A Hazy Narrative of the Mongols" in pr,
    "projects: Ensaf title unified (en)",
)

# --- audit 2026-11-15: no false direct-link claim, founder wording, typos
check("همه با لینک مستقیم" not in pr, "projects: no 'all direct links' claim (fa)")
check(
    "direct, verifiable links" not in pr, "projects: no 'all direct links' claim (en)"
)
check("مؤسس و مدیرعامل" not in pr, "projects: founder wording aligned (fa)")
check("Founder &amp; CEO" not in pr, "projects: founder wording aligned (en)")
check(
    "تفویض" not in pr and "تفویض" not in rfa,
    "projects/resume: Tafrihat typo fixed (fa)",
)
check("Tafviz" not in ren, "resume en: Tafrihat typo fixed (en)")
check(
    "روای به خطیب" not in pr and "روای به خطیب" not in rfa,
    "projects/resume: ravi typo fixed",
)

# --- audit 2026-11-15: one response-time sentence, real links on home evidence
REPLY_FA = "پاسخ در اولین فرصت کاری — تلگرام سریع‌ترین مسیر است."
REPLY_EN = "A reply at the first working opportunity — Telegram is the fastest route."
for name in ("about.html", "services.html", "projects.html"):
    body = read(name)
    check(body.count(REPLY_FA) == 1, "%s: unified reply line (fa)" % name)
    check(body.count(REPLY_EN) == 1, "%s: unified reply line (en)" % name)
check(
    "چند روز کاری" not in sv and "business day" not in sv,
    "services: no stray reply wording",
)
ct_early = read("contact.html")
check(
    "چند ساعت" not in ct_early and "within hours" not in ct_early,
    "contact: no stray reply wording",
)
check(
    "first opportunity — Telegram is faster" not in pr,
    "projects: old reply wording gone",
)
check('href="https://ronix.ir"' in ix, "index: Ronix evidence linked")
check('href="https://poolaki.app"' in ix, "index: Poolaki evidence linked")
check('href="/demos/karabi/"' in ix, "index: Karabi demo linked")
check('href="/demos/ravanyar/"' in ix, "index: Ravan Yar demo linked")
check(".evi-label a{" in read("assets/style.css"), "style: evidence links styled")

# --- audit 2026-11-22: internal home links point at / (canonical), not /index.html
for name in (
    "404.html",
    "about.html",
    "contact.html",
    "gallery.html",
    "index.html",
    "magazine.html",
    "projects.html",
    "resume.html",
    "services.html",
    "works.html",
    "magazine/content-system-customers.html",
    "magazine/agency-mongol-narrative.html",
):
    check('href="index.html"' not in read(name), "%s: no /index.html links" % name)

# --- audit 2026-11-15: meta keywords removed
for name in (
    "index.html",
    "about.html",
    "projects.html",
    "services.html",
    "contact.html",
    "gallery.html",
    "resume.html",
    "resume/fa/index.html",
    "resume/en/index.html",
):
    check('name="keywords"' not in read(name), "%s: no meta keywords" % name)

ct = read("contact.html")
check("تلگرام صاحب سایت" not in ct, "contact: privacy no Telegram (fa)")
check("email and Telegram" not in ct, "contact: privacy no Telegram (en)")
check(
    ct.count('href="mailto:contact@sadeghvahidi.ir"') >= 2,
    "contact: real mailto fallbacks",
)
check("<option>طراحی سایت</option>" in ct, "contact: web design option (fa)")
check("<option>Web design</option>" in ct, "contact: web design option (en)")

wk = read("works.html")
check("آثار و شواهد" in wk, "works: page title present (fa)")
check(
    "Works &amp; evidence" in wk or "Works & evidence" in wk,
    "works: page title present (en)",
)
check(
    wk.count('href="works.html"') == 8,
    "works: 8 self links (nav/mobile/footer x2 langs x2 blocks)",
)
check('href="https://ensafnews.com/647785/"' in wk, "works: Ensaf article linked")
check('href="/demos/ravanyar/"' in wk, "works: Ravan Yar demo linked")
check('href="/demos/karabi/"' in wk, "works: Karabi demo linked")
check("نسخهٔ ۲٫۰ آمادهٔ انتشار است" in wk, "works: Ravan Yar 2.0 status (fa)")
check("version 2.0 is ready for release" in wk, "works: Ravan Yar 2.0 status (en)")
check("۴۳ اثر" in wk, "works: archive count reference (fa)")
check("43 works" in wk, "works: archive count reference (en)")
check(
    "آنچه مدرک ندارد، اینجا نیست" not in wk,
    "works: absolute no-evidence claim removed (fa)",
)
check(
    "Anything without evidence is not listed here" not in wk,
    "works: absolute no-evidence claim removed (en)",
)
check(
    "هر مدخل یا لینک عمومی دارد یا در صفحهٔ پروژه‌ها و آرشیو رزومه به آن ارجاع شده است"
    in wk,
    "works: inclusion rule matches note (fa)",
)
check(
    "each entry either carries a public link or is referenced on the projects page"
    in wk,
    "works: inclusion rule matches note (en)",
)
check(
    wk.count('href="index.html"') == 0,
    "works: home links use / not index.html",
)
check(h1_ok(wk), "works: one h1 per language view (%d total)" % wk.count("<h1"))
check(
    wk.count('src="assets/maten-console.webp"') == 2,
    "works: MATEN console image in both locales",
)
check(
    wk.count("بخشی از شناسهٔ داخلی محصول محو شده است") == 1
    and wk.count("Part of the internal product name is masked") == 1,
    "works: console redaction disclosed in both captions",
)
_console = os.path.join(S, "assets", "maten-console.webp")
check(
    os.path.isfile(_console) and os.path.getsize(_console) > 20000,
    "assets: MATEN console webp present (>20KB)",
)
check("Sabzevar24" not in wk, "works: internal product name not in HTML")

for name in pages:
    t = read(name)
    nav = re.search(r'<div class="nav-links">(.*?)</div>', t, re.S)
    check(
        nav is not None and nav.group(1).count("works.html") == 2,
        "%s: works link in desktop nav" % name,
    )

ga = read("gallery.html")
check("noindex" not in ga, "gallery: indexable")
check(ga.count('href="gallery.html"') == 4, "gallery: footer self link in both locales")
check("data-gallery" in ga, "gallery: grid container present")
for _n in (
    "index.html",
    "about.html",
    "projects.html",
    "works.html",
    "services.html",
    "magazine.html",
    "contact.html",
):
    check('href="gallery.html"' in read(_n), "%s: gallery footer link" % _n)

rb = read("robots.txt")
check("Disallow: /demos/" in rb, "robots: demos disallowed")

sm = read("sitemap.xml")
urls = re.findall(r"<loc>([^<]+)</loc>", sm)
check(len(urls) == 21, "sitemap: 21 urls (got %d)" % len(urls))
check(any(u.endswith("/gallery.html") for u in urls), "sitemap: gallery listed")
check("https://sadeghvahidi.ir/shop.html" in urls, "sitemap: shop listed")
check(not any("/demos/" in u for u in urls), "sitemap: no demos")
check(
    "https://sadeghvahidi.ir/magazine.html" in urls,
    "sitemap: magazine listed",
)
check(
    "https://sadeghvahidi.ir/magazine/content-system-customers.html" in urls,
    "sitemap: article listed",
)
check(
    "https://sadeghvahidi.ir/magazine/agency-mongol-narrative.html" in urls,
    "sitemap: ensaf essay listed",
)
lastmods = re.findall(r"<lastmod>([^<]+)</lastmod>", sm)
check(len(lastmods) == 21, "sitemap: 21 lastmod values (got %d)" % len(lastmods))
check(
    all(len(d) == 10 and d[4] == "-" for d in lastmods),
    "sitemap: lastmod is ISO date",
)
check(
    set(lastmods) <= {"2026-11-15", "2026-11-22", "2026-11-25"}
    and min(lastmods) >= "2026-11-15",
    "sitemap: lastmod values current, not stale (got %s)" % sorted(set(lastmods)),
)
_shop_mod = re.findall(r"<loc>([^<]+)</loc><lastmod>2026-11-25</lastmod>", sm)
check(
    _shop_mod == ["https://sadeghvahidi.ir/shop.html"],
    "sitemap: only the shop carries the 2026-11-25 lastmod (got %s)" % (_shop_mod,),
)
_changed = re.findall(r"<loc>([^<]+)</loc><lastmod>2026-11-22</lastmod>", sm)
check(
    sorted(_changed)
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
    "sitemap: only the edited pages carry the 2026-11-22 lastmod (got %s)"
    % (_changed,),
)

_fa = read("resume/fa/index.html")
check(
    _fa.count("پایان خدمت سربازی") == 2
    and not re.search(r"پایان خدمت(?![ ]سربازی)", _fa),
    "resume/fa: both military tags clarified",
)
check(
    "Jen-zedegi" not in read("resume/en/index.html")
    and "Jenzadegi" in read("resume/en/index.html"),
    "resume/en: Jenzadegi transliteration matches projects",
)
_ensaf = {
    "ar": "16 يونيو 2026",
    "de": "16. Juni 2026",
    "es": "16 jun 2026",
    "fr": "16 juin 2026",
    "it": "16 giu 2026",
    "ru": "16 июн. 2026",
    "zh": "2026 年 6 月 16 日",
}
_stale = {
    "ar": "1 يونيو 2026",
    "de": "01. Juni 2026",
    "es": "01 jun 2026",
    "fr": "01 juin 2026",
    "it": "01 giu 2026",
    "ru": "01 июн. 2026",
    "zh": "2026 年 6 月 1 日",
}
_bad = [
    loc
    for loc in _ensaf
    if _ensaf[loc] not in read("resume/%s/index.html" % loc)
    or _stale[loc] in read("resume/%s/index.html" % loc)
]
check(
    not _bad,
    "resume locales: Ensaf date is 16 June 2026 as published (bad: %s)" % (_bad,),
)

for loc in ("fa", "en", "de", "fr", "it", "es", "ru", "ar", "zh"):
    t = read("resume/%s/index.html" % loc)
    check("Shara Ghasemi" not in t, "resume/%s: name removed" % loc)
    check("شارا" not in t, "resume/%s: fa name removed" % loc)
    check("usp=sharing" not in t, "resume/%s: no sharing query" % loc)
    check(
        t.count("/preview") == 10,
        "resume/%s: 10 preview links (got %d)" % (loc, t.count("/preview")),
    )

# magazine + first article
mg = read("magazine.html")
check("noindex" not in mg, "magazine: indexable")
check("magazine/content-system-customers.html" in mg, "magazine: article card linked")
check("magazine-empty-state" not in mg, "magazine: empty state removed")
check("پۚوهش" not in mg, "magazine: no broken glyph")
_mg_ld = ld_blocks(mg)
check(
    len(_mg_ld) == 1 and _mg_ld[0].get("@type") == "CollectionPage",
    "magazine: one CollectionPage JSON-LD block",
)
check(
    bool(_mg_ld)
    and _mg_ld[0].get("mainEntity", {}).get("@type") == "ItemList"
    and [
        (i.get("position"), i.get("url"))
        for i in _mg_ld[0]["mainEntity"].get("itemListElement", [])
    ]
    == [
        (1, "https://sadeghvahidi.ir/magazine/content-system-customers.html"),
        (2, "https://sadeghvahidi.ir/magazine/agency-mongol-narrative.html"),
    ],
    "magazine: ItemList carries both articles in date order",
)
check(
    mg.count('class="mag-card"') == 4,
    "magazine: 2 cards per locale (got %d)" % mg.count('class="mag-card"'),
)

art_path = os.path.join(S, "magazine", "content-system-customers.html")
check(os.path.exists(art_path), "article: file exists")
if os.path.exists(art_path):
    art = io.open(art_path, encoding="utf-8").read()
    check(art.count("<h1") == 1, "article: one h1")
    check('content="index, follow"' in art, "article: indexable")
    check(
        "https://sadeghvahidi.ir/magazine/content-system-customers.html" in art,
        "article: canonical/og url present",
    )
    check(art.count("application/ld+json") == 1, "article: one JSON-LD block")
    m = re.search(r'<script type="application/ld\+json">(.*?)</script>', art, re.S)
    try:
        data = json.loads(m.group(1)) if m else {}
        check(data.get("@type") == "Article", "article: JSON-LD is Article")
        check(data.get("datePublished") == "2026-11-15", "article: datePublished")
        check(data.get("dateModified") == "2026-11-22", "article: dateModified bumped")
        check(
            data.get("publisher", {}).get("@type") == "Person"
            and data.get("publisher", {}).get("url") == "https://sadeghvahidi.ir/",
            "article: publisher present",
        )
        check(data.get("inLanguage") == "fa-IR", "article: language fa-IR")
    except Exception as e:
        check(False, "article: JSON-LD parses (%s)" % e)
    check("og-content-system-customers.png" in art, "article: OG image referenced")
    check(
        'property="article:modified_time"' in art
        and 'content="2026-11-22" property="og:updated_time"' in art,
        "article: modified-time meta present",
    )
    for href in ("/magazine.html", "/projects.html", "/contact.html", "/services.html"):
        check(
            os.path.exists(os.path.join(S, href.lstrip("/"))),
            "article: link target %s" % href,
        )
    _sig = os.path.join(S, "assets", "signature-sadegh-vahidi.webp")
    check(
        os.path.exists(_sig) and os.path.getsize(_sig) > 5000,
        "article: signature webp exists (>5KB)",
    )
    check(
        "signature-sadegh-vahidi.webp" in art
        and "signature-sadegh-vahidi.jpg" not in art,
        "article: signature references the webp only",
    )
    check(
        'decoding="async" height="541" loading="lazy"' in art,
        "article: signature keeps dimensions and lazy loading",
    )
    check("09153753859" in art, "article: phone number present")

og = os.path.join(S, "assets", "og-content-system-customers.png")
check(os.path.exists(og), "article: OG image file exists")
if os.path.exists(og):
    with open(og, "rb") as f:
        head = f.read(24)
    w = int.from_bytes(head[16:20], "big")
    h = int.from_bytes(head[20:24], "big")
    check((w, h) == (1200, 630), "article: OG image is 1200x630 (got %dx%d)" % (w, h))

# --- 2026-11-22: the Ensaf News essay republished as the second magazine piece
ENS = os.path.join(S, "magazine", "agency-mongol-narrative.html")
check(os.path.exists(ENS), "ensaf essay: file exists")
if os.path.exists(ENS):
    ens = io.open(ENS, encoding="utf-8").read()
    check(ens.count("<h1") == 1, "ensaf essay: one h1")
    check(
        ens.count(
            '<link href="https://sadeghvahidi.ir/magazine/agency-mongol-narrative.html" rel="canonical"/>'
        )
        == 1,
        "ensaf essay: canonical is the local page",
    )
    check('content="index, follow"' in ens, "ensaf essay: indexable")
    check(ens.count("application/ld+json") == 1, "ensaf essay: one JSON-LD block")
    _e = ld_blocks(ens)
    try:
        _ed = _e[0] if _e else {}
        check(_ed.get("@type") == "Article", "ensaf essay: JSON-LD is Article")
        check(_ed.get("datePublished") == "2026-06-16", "ensaf essay: publisher date")
        check(
            _ed.get("dateModified") == "2026-11-22", "ensaf essay: dateModified bumped"
        )
        check(
            _ed.get("isBasedOn") == "https://ensafnews.com/647785/",
            "ensaf essay: isBasedOn points at Ensaf",
        )
        check(
            _ed.get("author", {}).get("@type") == "Person"
            and _ed.get("author", {}).get("name") == "صادق وحیدی",
            "ensaf essay: author is Sadegh",
        )
        check(_ed.get("inLanguage") == "fa-IR", "ensaf essay: language fa-IR")
    except Exception as e:
        check(False, "ensaf essay: JSON-LD parses (%s)" % e)
    check(
        '<time datetime="2026-06-16">۲۶ خرداد ۱۴۰۵</time>' in ens,
        "ensaf essay: visible Persian date matches datePublished",
    )
    check(
        ens.count("ensafnews.com/647785/") >= 2,
        "ensaf essay: attribution link to the publisher",
    )
    check("نخست در" in ens and "انصاف‌نیوز" in ens, "ensaf essay: first-published note")
    check(
        ens.count("wp-content") == 0 and "ensafnews.com/wp-content" not in ens,
        "ensaf essay: no publisher assets copied",
    )
    check(
        ens.count("<h2>") == 6,
        "ensaf essay: 6 section headings (%d)" % ens.count("<h2>"),
    )
    check(
        ens.count("<p>") == 24,
        "ensaf essay: 24 body paragraphs (%d)" % ens.count("<p>"),
    )
    check(
        ens.count("signature-sadegh-vahidi.webp") == 1
        and "signature-sadegh-vahidi.jpg" not in ens,
        "ensaf essay: signature webp only",
    )
    check(
        'class="article-sign"' in ens and "09153753859" in ens,
        "ensaf essay: signature block with phone",
    )
    check(
        ens.count('class="article"') == 1 and 'dir="rtl" lang="fa"' in ens,
        "ensaf essay: RTL article container",
    )
    check(".article .note{" in read("assets/style.css"), "style: article note styled")
    # the shared chrome must be absolute and complete on a nested page
    check(
        ens.count('href="/works.html"') == 6,
        "ensaf essay: works link x2 per block",
    )
    check(
        ens.count('href="gallery.html"') == 0
        and ens.count('href="/gallery.html"') == 2,
        "ensaf essay: gallery link absolute",
    )
    check(
        ens.count('href="http://sadeghvahidi.ir') == 0,
        "ensaf essay: no http:// absolute URLs",
    )

# leadership truth: Delshad Music is the only people-leadership role
LEAD_BAD = (
    "مدیریت تیم ۳–۴ نفره",
    "هماهنگی تیم ۳–۴ نفره",
    "Led a 3–4 person team",
    "Led the 3–4 person team",
    "Coordinated a team of 3–4",
    # Ecell / Isell: production coordination only, no people leadership
    "هماهنگی تیم تولید محتوا و نظارت بر خروجی نهایی",
    "کنترل کیفیت و هماهنگی تیم.",
    "Coordinated the content-production team",
    "quality control, and team coordination.",
)
for name in (
    "about.html",
    "index.html",
    "projects.html",
    "resume/fa/index.html",
    "resume/en/index.html",
    "resume/de/index.html",
    "resume/fr/index.html",
    "resume/it/index.html",
    "resume/es/index.html",
    "resume/ru/index.html",
    "resume/ar/index.html",
    "resume/zh/index.html",
):
    body = read(name)
    hits = [p for p in LEAD_BAD if p in body]
    check(not hits, "%s: no unverified team-lead wording (%s)" % (name, hits))
check("سرپرست محتوا" in read("resume/fa/index.html"), "resume fa: Delshad lead kept")
check("Content Lead" in read("resume/en/index.html"), "resume en: Delshad lead kept")
check(
    "هماهنگی تولید محتوا و نظارت بر خروجی نهایی" in read("resume/fa/index.html"),
    "resume fa: Ecell production-only wording",
)
check(
    "Coordinated content production and reviewed final outputs"
    in read("resume/en/index.html"),
    "resume en: Ecell production-only wording",
)
check(
    "کنترل کیفیت و هماهنگی تولید محتوا" in read("about.html"),
    "about fa: Ecell production-only wording",
)
check(
    "quality control, and content production coordination" in read("about.html"),
    "about en: Ecell production-only wording",
)

# demos
for slug in ("karabi", "ravanyar"):
    p = os.path.join(S, "demos", slug, "index.html")
    t = io.open(p, encoding="utf-8").read()
    check("noindex" in t, "%s demo: noindex" % slug)
    has_ribbon = (
        'id="demo-chrome"' in t or "demo-chrome.js" in t or 'class="demo-ribbon"' in t
    )
    check(has_ribbon, "%s demo: ribbon wired" % slug)
    check("sabzevartamir" not in t, "%s demo: no real domain in index" % slug)

check(
    not os.path.exists(os.path.join(S, "demos", "karabi", "security.txt")),
    "karabi: security.txt removed",
)
check(
    not os.path.exists(os.path.join(S, "demos", "karabi", "llms.txt")),
    "karabi: llms.txt removed",
)
pay = io.open(
    os.path.join(S, "demos", "ravanyar", "assets", "payconfig.js"), encoding="utf-8"
).read()
check("5047-0610" not in pay and "IR160610" not in pay, "ravanyar: no card/IBAN")

# --- second audit 2026-11-15: selection labels, Karabi identity, MATEN parity
ct = read("contact.html")
ab = read("about.html")
check(
    "چهار نمونهٔ منتخب برای تنوع حوزه" in ix,
    "index: selection criteria note (fa)",
)
check(
    "Four selected pieces for range of field" in ix,
    "index: selection criteria note (en)",
)
check("سبزوار (کرابی)" in ix, "index: Karabi tied to Sabzevar (fa)")
check("سبزوار (کرابی)" in pr, "projects: Karabi tied to Sabzevar (fa)")
check("(Karabi)" in pr, "projects: Karabi tied to Sabzevar (en)")
check("پنل مدیریت امن" not in ix, "index: no unaudited 'secure panel' claim (fa)")
check("secure admin panel" not in ix, "index: no unaudited 'secure panel' claim (en)")
check("شش نمونه‌کار <em>منتخب</em>" in pr, "projects: selected-case heading (fa)")
check(
    "Six <em>selected</em> case studies" in pr, "projects: selected-case heading (en)"
)
check("۲۲۴ اسکیل ثبت‌شده در رجیستری" in pr, "projects: registry skills (fa)")
check("224 registry skills" in pr, "projects: registry skills (en)")
check("2 base platforms" not in pr, "projects: MATEN EN parity")
check(
    "نمونهٔ عمومی این سامانه منتشر نشده است." in pr,
    "projects: MATEN no public release (fa)",
)
check(
    "This system has no public release." in pr, "projects: MATEN no public release (en)"
)
check(
    "بدون وابستگی به APIهای تجاری شخص ثالث" in pr,
    "projects: Ravan dependency wording (fa)",
)
check(
    "does not depend on third-party commercial APIs" in pr,
    "projects: Ravan dependency wording (en)",
)
check(
    "همان ابتکار مستقل و غیرانتفاعی" in pr,
    "projects: Ravan linked to resume initiative (fa)",
)
check(
    "ronix.ir</a>" not in pr and "poolaki.app</a>" not in pr,
    "projects: no brand homepage links",
)
check("Tafviz" not in pr, "projects: Tafrihat typo fixed (en)")
check("Jen-zedegi" not in pr, "projects: Jenzadegi transliteration fixed (en)")
check(
    "difference-between-tig-and-mma-welding-machine" in pr,
    "projects: direct Ronix article link",
)
check(
    pr.count("poolaki.app/blog/") == 4,
    "projects: two direct Poolaki article links per locale",
)
check(
    "۳ تا ۶ ماه، یا همراهی ماهانه" in sv,
    "services: engagement model clarified (fa)",
)
check(
    "دو سطح: مشاوره و طراحی سیستم" in sv,
    "services: systems service two levels (fa)",
)
check(
    "Two levels: consulting and system design" in sv,
    "services: systems service two levels (en)",
)
check(
    "پنل اجرای dev" not in sv and "dev execution panel" not in sv,
    "services: dev panel renamed",
)
check(
    "داشبورد مدیریت و پیگیری توسعه" in sv and "development tracking dashboard" in sv,
    "services: new development dashboard label",
)
check("پژوهش ثانویه، تحلیل رقبا" in sv, "services: research methods (fa)")
check(
    "secondary research, competitor analysis" in sv, "services: research methods (en)"
)
check("تعداد صفحه‌ها، نسخهٔ فارسی/انگلیسی" in sv, "services: web scope options (fa)")
check("page count, Farsi/English versions" in sv, "services: web scope options (en)")
# --- 2026-11-22 SEO/GEO: Service + FAQPage schema, visible FAQ in both locales
_sv_ld = ld_blocks(sv)
check(
    [d.get("@type") for d in _sv_ld]
    == ["BreadcrumbList", "Service", "FAQPage", "FAQPage"],
    "services: JSON-LD blocks in order (got %s)" % [d.get("@type") for d in _sv_ld],
)
_service = next((d for d in _sv_ld if d.get("@type") == "Service"), {})
check(
    _service.get("url") == "https://sadeghvahidi.ir/services.html"
    and _service.get("provider", {}).get("@type") == "Person",
    "services: Service schema url/provider",
)
check(
    len(_service.get("hasOfferCatalog", {}).get("itemListElement", [])) == 6,
    "services: Service catalog lists 6 offers",
)
_faqs = [d for d in _sv_ld if d.get("@type") == "FAQPage"]
check(
    [d.get("inLanguage") for d in _faqs] == ["fa-IR", "en"],
    "services: FAQPage per locale",
)
check(
    all(len(d.get("mainEntity", [])) == 4 for d in _faqs),
    "services: 4 questions per locale in schema",
)
_summ = re.findall(r"<summary>(.*?)</summary>", sv, re.S)
_schema_q = [q["name"] for d in _faqs for q in d["mainEntity"]]
check(len(_summ) == 8, "services: 8 visible FAQ summaries (got %d)" % len(_summ))
check(_summ == _schema_q, "services: visible FAQ questions match the schema")
check(
    all(q["acceptedAnswer"]["text"] in sv for d in _faqs for q in d["mainEntity"]),
    "services: FAQ answers are visible, not schema-only",
)
check(
    '<section id="faq">' in sv and '<section id="en-faq">' in sv,
    "services: FAQ section in both locales",
)
check(".faq-item>summary" in read("assets/style.css"), "style: FAQ accordion styled")

check("مسیر حرفه‌ای <em>منتخب</em>" in ab, "about: selected career heading (fa)")
check("باور من به سیستم‌سازی" in ab, "about: quote labelled as personal view (fa)")
check("My belief about systems" in ab, "about: quote labelled as personal view (en)")
check(
    "همکاری حرفه‌ای با بیش از ۷ سازمان و برند" in ab,
    "about: 7+ collaboration wording (fa)",
)
check("Founder & CEO" not in ab and "founder & CEO" not in ab, "about: no CEO title")
check("Formspree" in ct, "contact: form service named")
check("بودجه تقریبی (تومان، اختیاری)" in ct, "contact: budget unit (fa)")
check("Approximate budget (USD or EUR, optional)" in ct, "contact: budget unit (en)")
ct_plain = ct.replace("&nbsp;", " ")
check(
    "شمارهٔ اصلی" in ct_plain and "شمارهٔ دوم" in ct_plain, "contact: phone labels (fa)"
)
check(
    "— primary" in ct_plain and "— secondary" in ct_plain, "contact: phone labels (en)"
)
check("همه با لینک مستقیم" not in rfa, "resume fa: no direct-link claim")
check("all with direct, verifiable links" not in ren, "resume en: no direct-link claim")
check("مهر ۱۴۰۴ — شهریور ۱۴۰۵، بدون تأخیر" in rfa, "resume fa: Poolaki period bounded")
check("throughout Oct 2025 — Sep 2026" in ren, "resume en: Poolaki period bounded")
check(
    "مؤسس و مدیرعامل" not in rfa and "CEO" not in ren, "resumes: founder role unified"
)
check("چهار پروژهٔ منتخب" in rfa, "resume fa: four selected projects")
check("Four <em>selected</em> projects" in ren, "resume en: four selected projects")
check(
    "چهار حوزهٔ تمرکز، دسته‌بندی اصلی کار" in rfa,
    "resume fa: focus areas vs capabilities",
)
check(
    "The four focus areas are the main categories" in ren,
    "resume en: focus areas vs capabilities",
)

print("\nFAILURES:", len(fails))
for f in fails:
    print("  -", f)
