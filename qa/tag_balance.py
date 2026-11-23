# -*- coding: utf-8 -*-
"""Quick tag-balance sanity check for pages edited in the second-audit batch."""

import io
import os
import sys
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILES = [
    "404.html",
    "about.html",
    "contact.html",
    "gallery.html",
    "index.html",
    "magazine.html",
    "magazine/agency-mongol-narrative.html",
    "magazine/content-system-customers.html",
    "projects.html",
    "resume.html",
    "services.html",
    "works.html",
] + [
    "resume/%s/index.html" % loc
    for loc in ("fa", "en", "de", "fr", "it", "es", "ru", "ar", "zh")
]
VOID = {
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
}


class Balance(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.errors = []

    def handle_starttag(self, tag, attrs):
        if tag in VOID:
            return
        self.stack.append((tag, self.getpos()))

    def handle_startendtag(self, tag, attrs):
        return

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        if not self.stack:
            self.errors.append("stray </%s> at %s" % (tag, self.getpos()))
            return
        top, pos = self.stack[-1]
        if top == tag:
            self.stack.pop()
            return
        # tolerate implicit closes for common cases
        implicit = {"li", "p", "tr", "td", "th", "dt", "dd", "option"}
        if top in implicit:
            self.stack.pop()
            self.handle_endtag(tag)
            return
        self.errors.append(
            "mismatch: </%s> at %s closes <%s> opened at %s"
            % (tag, self.getpos(), top, pos)
        )
        self.stack.pop()


bad = 0
for rel in FILES:
    path = os.path.join(ROOT, rel.replace("/", os.sep))
    p = Balance()
    p.feed(io.open(path, encoding="utf-8").read())
    p.close()
    leftover = [(t, pos) for t, pos in p.stack]
    status = "OK" if not p.errors and not leftover else "PROBLEM"
    if status == "PROBLEM":
        bad += 1
    print(
        "%-22s %s  unclosed=%d errors=%d" % (rel, status, len(leftover), len(p.errors))
    )
    for e in p.errors[:5]:
        print("   !", e)
    for t, pos in leftover[:5]:
        print("   ~ unclosed <%s> at %s" % (t, pos))

sys.exit(1 if bad else 0)
