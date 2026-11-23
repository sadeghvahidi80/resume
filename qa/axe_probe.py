# -*- coding: utf-8 -*-
"""Accessibility gate: run axe-core on the build and compare with a baseline.

Usage:
    python qa/axe_probe.py                    # fail on regressions
    python qa/axe_probe.py --update-baseline  # record the current state
"""

import argparse
import functools
import http.server
import io
import json
import sys
import threading
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
AXE = HERE / "node_modules" / "axe-core" / "axe.min.js"
BASELINE = HERE / "a11y-baseline.json"
PORT = 8098

PAGES = [
    "/index.html",
    "/magazine.html",
    "/magazine/agency-mongol-narrative.html",
    "/magazine/content-system-customers.html",
    "/resume/fa/index.html",
    "/resume/en/index.html",
    "/works.html",
    "/contact.html",
]


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


def measure(axe_src):
    from playwright.sync_api import sync_playwright

    out = {}
    critical = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 900})
        page.emulate_media(reduced_motion="reduce")
        for path in PAGES:
            page.goto("http://127.0.0.1:%d%s" % (PORT, path), wait_until="load")
            page.add_style_tag(
                content="*,*::before,*::after{animation:none!important;"
                "transition:none!important}"
            )
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            page.wait_for_timeout(350)
            page.evaluate("window.scrollTo(0, 0)")
            page.add_script_tag(content=axe_src)
            res = page.evaluate("() => axe.run(document, {resultTypes:['violations']})")
            counts = {}
            for violation in res["violations"]:
                rule = violation["id"]
                counts[rule] = counts.get(rule, 0) + len(violation["nodes"])
                if violation.get("impact") == "critical":
                    critical.append("%s: %s" % (path, rule))
            out[path] = dict(sorted(counts.items()))
        browser.close()
    return out, critical


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--update-baseline", action="store_true")
    args = parser.parse_args()

    if not AXE.exists():
        sys.exit("axe-core is missing; run: npm ci --prefix qa")
    axe_src = io.open(AXE, encoding="utf-8").read()

    httpd = serve()
    try:
        current, critical = measure(axe_src)
    finally:
        httpd.shutdown()

    for path in PAGES:
        rules = current[path]
        detail = " ".join("%s=%d" % (k, v) for k, v in rules.items()) or "clean"
        print("%-44s %s" % (path, detail))

    if args.update_baseline:
        payload = {
            "note": "Node counts per page/rule. A higher count fails the gate.",
            "pages": current,
        }
        with io.open(BASELINE, "w", encoding="utf-8", newline="\n") as fh:
            json.dump(payload, fh, ensure_ascii=False, indent=2, sort_keys=True)
            fh.write("\n")
        print("\nbaseline written to %s" % BASELINE)
        return 0

    baseline = json.load(io.open(BASELINE, encoding="utf-8"))
    regressions = []
    for path in PAGES:
        allowed = baseline["pages"].get(path)
        if allowed is None:
            regressions.append("%s: page missing from baseline" % path)
            continue
        for rule, count in current[path].items():
            if count > allowed.get(rule, 0):
                regressions.append(
                    "%s: %s %d > %d" % (path, rule, count, allowed.get(rule, 0))
                )

    if critical:
        print("\nCRITICAL:")
        for item in critical:
            print("  " + item)
    if regressions:
        print("\nREGRESSIONS:")
        for item in regressions:
            print("  " + item)
        sys.exit(1)
    if critical:
        sys.exit(1)
    print("\nOK: no accessibility regressions")
    return 0


if __name__ == "__main__":
    sys.exit(main())
