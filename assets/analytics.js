/* Cookieless, first-party pageview counter.
 * No cookies, no fingerprint, no IP, no user agent: the worker stores only the
 * path, the referrer host, the Cloudflare country, a coarse device class, the
 * page language and the viewport width. DNT and GPC are honoured.
 * Analytics must never break the page, so every failure is swallowed. */
(function () {
  "use strict";

  var host = location.hostname;
  if (host !== "sadeghvahidi.ir" && host !== "www.sadeghvahidi.ir") return;
  if (navigator.doNotTrack === "1" || navigator.globalPrivacyControl === true) return;

  var payload = JSON.stringify({
    path: location.pathname,
    referrer: document.referrer || "",
    lang: document.documentElement.lang || "",
    viewport: window.innerWidth || 0
  });
  var endpoint = "https://pay.sadeghvahidi.ir/api/hit";

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, new Blob([payload], { type: "text/plain" }));
    } else if (window.fetch) {
      fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "text/plain" },
        body: payload,
        keepalive: true
      });
    }
  } catch (error) {
    /* swallowed on purpose */
  }
})();
