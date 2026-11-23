# -*- coding: utf-8 -*-
"""Crawl the local build and fail on any broken internal link."""

import functools
import http.server
import json
import os
import subprocess
import sys
import threading
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PORT = 8097
MIN_LINKS = 40


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


class Server(http.server.ThreadingHTTPServer):
    daemon_threads = True

    def handle_error(self, request, client_address):
        pass


def serve():
    handler = functools.partial(Quiet, directory=str(ROOT))
    httpd = Server(("127.0.0.1", PORT), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


def binary():
    node = os.environ.get("NODE_BIN") or "node"
    cli = (
        Path(__file__).resolve().parent
        / "node_modules"
        / "linkinator"
        / "build"
        / "src"
        / "cli.js"
    )
    if not cli.exists():
        sys.exit("linkinator is missing; run: npm ci --prefix qa")
    return [node, str(cli)]


httpd = serve()
try:
    proc = subprocess.run(
        binary()
        + [
            "http://127.0.0.1:%d/" % PORT,
            "--recurse",
            # Stay on this origin, and keep out of the self-contained demo apps.
            # They are Next.js exports built for a domain root (their hrefs are
            # "/about", "/repair-request", ...), are marked noindex and are
            # disallowed in robots.txt; their entry pages are covered by
            # qa/verify_site.py. Crawling them here only produces false 404s.
            "--skip",
            r"^(?!http://127\.0\.0\.1:%d)|^http://127\.0\.0\.1:%d/demos/"
            % (PORT, PORT),
            "--format",
            "json",
        ],
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    raw = proc.stdout.strip()
    if not raw:
        sys.stderr.write(proc.stderr[-2000:])
        sys.exit("linkinator produced no JSON")
    data = json.loads(raw)
finally:
    httpd.shutdown()

links = data.get("links", [])
broken = [item for item in links if (item.get("status") or 0) >= 400]

print("links checked: %d" % len(links))
for item in broken:
    print("  %s %s" % (item.get("status"), item.get("url")))

if len(links) < MIN_LINKS:
    sys.exit("FAIL: only %d links crawled (expected >= %d)" % (len(links), MIN_LINKS))
if broken:
    sys.exit("FAIL: %d broken link(s)" % len(broken))
print("OK: no broken internal links")
