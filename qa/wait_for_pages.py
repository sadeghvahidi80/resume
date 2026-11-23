# -*- coding: utf-8 -*-
"""Wait until GitHub Pages serves the current essay, magazine and sitemap."""

import re
import shutil
import subprocess
import sys
import time

CURL = shutil.which("curl") or "curl"
BASE = "https://sadeghvahidi.ir/"
ESSAY = BASE + "magazine/agency-mongol-narrative.html"
MAGAZINE = BASE + "magazine.html"
SITEMAP = BASE + "sitemap.xml"
NEEDLE = "مسئله عاملیت"
ATTEMPTS = 12
DELAY = 15


def fetch(url):
    proc = subprocess.run(
        [
            CURL,
            "-s",
            "-L",
            "--noproxy",
            "*",
            "--compressed",
            "--max-time",
            "30",
            "-A",
            "Mozilla/5.0 site-check",
            "-w",
            "\n%{http_code}",
            url,
        ],
        capture_output=True,
    )
    raw = proc.stdout
    cut = raw.rfind(b"\n")
    if cut < 0:
        return 0, ""
    code = raw[cut + 1 :].strip()
    return (int(code) if code.isdigit() else 0), raw[:cut].decode("utf-8", "replace")


for attempt in range(1, ATTEMPTS + 1):
    s1, essay = fetch(ESSAY)
    s2, magazine = fetch(MAGAZINE)
    s3, sitemap = fetch(SITEMAP)
    urls = re.findall(r"<loc>(.*?)</loc>", sitemap)
    ok = (
        s1 == 200
        and NEEDLE in essay
        and s2 == 200
        and "agency-mongol-narrative.html" in magazine
        and s3 == 200
        and any("agency-mongol-narrative" in u for u in urls)
    )
    print(
        "try %d: essay=%s magazine=%s sitemap=%s urls=%d %s"
        % (attempt, s1, s2, s3, len(urls), "READY" if ok else "pending")
    )
    if ok:
        sys.exit(0)
    if attempt < ATTEMPTS:
        time.sleep(DELAY)

sys.exit("Pages did not serve the new pages within %d seconds" % (ATTEMPTS * DELAY))
