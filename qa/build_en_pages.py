# -*- coding: utf-8 -*-
"""Build the real English pages under /en/ from the .lang-en blocks (ISS-08).

The bilingual root pages carry both languages in one document, so a shared
``?lang=en`` link still previews as Persian: the server sends the Persian
head and only JavaScript swaps the title. These pages are the static English
counterpart — same body, English head, self-canonical and a real hreflang
pair — so a link sent from Telegram or LinkedIn previews in English.

Run from the repository root::

    python qa/build_en_pages.py           # write the pages
    python qa/build_en_pages.py --check   # fail if a page is stale
"""

import argparse
import html as htmllib
import io
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

# source page, output page, Persian path, English path
PAGES = [
    ("index.html", "en/index.html", "/", "/en/"),
    ("about.html", "en/about.html", "/about.html", "/en/about.html"),
    ("projects.html", "en/projects.html", "/projects.html", "/en/projects.html"),
    ("works.html", "en/works.html", "/works.html", "/en/works.html"),
    ("services.html", "en/services.html", "/services.html", "/en/services.html"),
    ("shop.html", "en/shop.html", "/shop.html", "/en/shop.html"),
    ("magazine.html", "en/magazine.html", "/magazine.html", "/en/magazine.html"),
    ("gallery.html", "en/gallery.html", "/gallery.html", "/en/gallery.html"),
    ("contact.html", "en/contact.html", "/contact.html", "/en/contact.html"),
    (
        "lead-harvest.html",
        "en/lead-harvest.html",
        "/lead-harvest.html",
        "/en/lead-harvest.html",
    ),
]

ATTR = re.compile(r'([a-zA-Z:_-]+)="([^"]*)"')
PAGE_FILE = r"(index|about|contact|gallery|lead-harvest|magazine|projects|services|shop|works|resume)\.html"

# The gallery lightbox sits outside <main> and carries Persian-only labels.
LIGHTBOX_LABELS = {
    "بستن": "Close",
    "تصویر قبلی": "Previous image",
    "تصویر بعدی": "Next image",
}


def read(rel):
    with io.open(os.path.join(ROOT, rel), encoding="utf-8") as fh:
        return fh.read()


def attrs(tag):
    return dict(ATTR.findall(tag))


def head_values(src):
    head = src[: src.find("</head>")]
    title = re.search(r"<title\b([^>]*)>(.*?)</title>", head, re.S)
    ta = attrs(title.group(1)) if title else {}
    desc = {}
    og_type = "website"
    for meta in re.finditer(r"<meta\b[^>]*>", head):
        a = attrs(meta.group(0))
        if a.get("name") == "description":
            desc = a
        if a.get("property") == "og:type" and a.get("content"):
            og_type = a["content"]
    title_en = ta.get("data-en") or (title.group(2).strip() if title else "")
    desc_en = desc.get("data-en") or desc.get("content") or ""
    return title_en, desc_en, og_type


def wrapper_span(src):
    """(start, end) of the .lang-en block, end pointing at its closing </div>."""
    start = src.find('<div class="lang-en">')
    if start == -1:
        raise SystemExit("no .lang-en block")
    depth = 0
    for m in re.finditer(r"<div\b|</div>", src[start:]):
        if m.group(0) == "</div>":
            depth -= 1
            if depth == 0:
                return start, start + m.start()
        else:
            depth += 1
    raise SystemExit("unbalanced .lang-en block")


def rewrite(html):
    """Make every URL in an extracted block absolute for the /en/ location."""
    html = re.sub(
        r'srcset="[^"]*"', lambda m: m.group(0).replace("assets/", "/assets/"), html
    )
    html = re.sub(r'\b(src|poster)="assets/', r'\1="/assets/', html)
    html = html.replace('href="assets/', 'href="/assets/')
    # The two magazine essays have no English edition: keep them on the
    # Persian path instead of pointing at a 404 under /en/.
    html = re.sub(r'href="/en/magazine/([^"]+)"', r'href="/magazine/\1"', html)
    html = re.sub(r'href="magazine/([^"]+)"', r'href="/magazine/\1"', html)
    html = re.sub(r'href="/' + PAGE_FILE, r'href="/en/\1.html', html)
    html = re.sub(r'href="' + PAGE_FILE, r'href="/en/\1.html', html)
    html = html.replace('href="/"', 'href="/en/"')
    for fa, en in LIGHTBOX_LABELS.items():
        html = html.replace('aria-label="%s"' % fa, 'aria-label="%s"' % en)
    return html


def build_nav(src, en_path, fa_path):
    nav = src[src.find("<nav") : src.find("</nav>") + 6]
    nav = re.sub(
        r'<span class="lang-fa"><a href="/".*?</span>\n?', "", nav, count=1, flags=re.S
    )
    nav = nav.replace(' aria-current="page"', "")
    nav = nav.replace(
        'aria-label="ناوبری اصلی / Main navigation"', 'aria-label="Main navigation"'
    )
    nav = rewrite(nav)
    switch = (
        '<a class="lang-switch" href="%s?lang=fa" hreflang="fa" lang="fa" '
        'aria-label="فا — نسخهٔ فارسی" title="فارسی">فا</a>' % fa_path
    )
    nav = re.sub(r'<a class="lang-switch"[^>]*>.*?</a>', switch, nav, flags=re.S)
    nav = re.sub(
        r'<button[^>]*id="langToggle"[^>]*>.*?</button>', switch, nav, flags=re.S
    )
    # aria-current on the page the visitor is actually reading, inside the
    # English menu panel only (the wordmark also links to /en/).
    panel = nav.find('<span class="lang-en">')
    head_part, panel = nav[:panel], nav[panel:]
    panel = panel.replace(
        'href="%s"' % en_path, 'href="%s" aria-current="page"' % en_path, 1
    )
    return head_part + panel


def build_page(source, out, fa_path, en_path):
    src = read(source)
    head = src[: src.find("</head>")]
    title, desc, og_type = head_values(src)
    start, end = wrapper_span(src)
    block = rewrite(src[start:end])

    main_close = src.find("</main>")
    after_wrapper = rewrite(src[end + len("</div>") : main_close])
    tail = rewrite(src[main_close + len("</main>") : src.find("</body>")])

    nav = build_nav(src, en_path, fa_path)
    icon = re.search(r'<link href="data:image/svg[^>]*rel="icon"[^>]*>', head)
    icon = icon.group(0) if icon else ""
    styles = "\n".join(re.findall(r"<style>.*?</style>", head, re.S))
    # Page-specific stylesheets (contact.css, shop.css) live in the source
    # head next to style.css; carry them over in order instead of guessing.
    sheets = "\n".join(
        re.sub(r'href="assets/', 'href="/assets/', tag)
        for tag in re.findall(r'<link\b[^>]*rel="stylesheet"[^>]*>', head)
    )

    fa_url = "https://sadeghvahidi.ir" + fa_path
    en_url = "https://sadeghvahidi.ir" + en_path
    plain = htmllib.unescape(re.sub(r"<[^>]+>", "", title))
    plain_desc = htmllib.unescape(desc)

    blocks = [
        {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": plain,
            "url": en_url,
            "description": plain_desc,
            "inLanguage": "en",
            "isPartOf": {
                "@type": "WebSite",
                "name": "Sadegh Vahidi",
                "url": "https://sadeghvahidi.ir/",
            },
        }
    ]
    if source == "index.html":
        for body in re.findall(
            r'<script type="application/ld\+json">\s*(.*?)\s*</script>', head, re.S
        ):
            if '"@type":"Person"' in body or '"@type": "Person"' in body:
                blocks.insert(0, json.loads(body))
                break
    jsonld = "\n".join(
        '<script type="application/ld+json">\n%s\n</script>'
        % json.dumps(b, ensure_ascii=False, separators=(",", ":"))
        for b in blocks
    )

    return """<!DOCTYPE html>
<html data-default-locale="en" data-lang-locked="en" dir="ltr" lang="en">
<head>
<meta charset="utf-8"/>
<link href="/assets/fonts/vazirmatn-arabic.woff2" rel="preload" as="font" type="font/woff2" crossorigin/>
<meta content="width=device-width, initial-scale=1.0, maximum-scale=5.0" name="viewport"/>
<title>{title}</title>
<meta content="{desc}" name="description"/>
<meta content="Sadegh Vahidi" name="author"/>
<meta content="index, follow, max-image-preview:large" name="robots"/>
<link href="{en_url}" rel="canonical"/>
<link href="{fa_url}" hreflang="fa" rel="alternate"/>
<link href="{en_url}" hreflang="en" rel="alternate"/>
<link href="{fa_url}" hreflang="x-default" rel="alternate"/>
<meta content="{og_type}" property="og:type"/>
<meta content="en_US" property="og:locale"/>
<meta content="fa_IR" property="og:locale:alternate"/>
<meta content="Sadegh Vahidi" property="og:site_name"/>
<meta content="{en_url}" property="og:url"/>
<meta content="{title}" property="og:title"/>
<meta content="{desc}" property="og:description"/>
<meta content="https://sadeghvahidi.ir/assets/og-1200x630.jpg" property="og:image"/>
<meta content="1200" property="og:image:width"/>
<meta content="630" property="og:image:height"/>
<meta content="summary_large_image" name="twitter:card"/>
<meta content="{title}" name="twitter:title"/>
<meta content="{desc}" name="twitter:description"/>
<meta content="https://sadeghvahidi.ir/assets/og-1200x630.jpg" name="twitter:image"/>
{icon}
{sheets}
{jsonld}
{styles}
</head>
<body><a class="skip-link" href="#main">Skip to main content</a>
{nav}
<main id="main">{block}</div>{after}</main>{tail}
</body>
</html>
""".format(
        title=title,
        desc=desc,
        en_url=en_url,
        fa_url=fa_url,
        og_type=og_type,
        icon=icon,
        sheets=sheets,
        jsonld=jsonld,
        styles=styles,
        nav=nav,
        block=block,
        after=after_wrapper,
        tail=tail,
    )


def build():
    return {out: build_page(src, out, fa, en) for src, out, fa, en in PAGES}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()
    stale = []
    for rel, text in build().items():
        path = os.path.join(ROOT, rel.replace("/", os.sep))
        current = read(rel) if os.path.exists(path) else None
        if args.check:
            if current != text:
                stale.append(rel)
            continue
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with io.open(path, "w", encoding="utf-8", newline="\n") as fh:
            fh.write(text)
        print("wrote", rel)
    if args.check:
        for rel in stale:
            print("STALE", rel)
        print("checked %d English pages, %d stale" % (len(PAGES), len(stale)))
        return 1 if stale else 0
    return 0


if __name__ == "__main__":
    sys.exit(main())
