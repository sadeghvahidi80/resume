/* GALLERY-001: lightbox for gallery.html.
   External file on purpose: CSP script-src 'self' forbids inline script.
   Handles both language grids by only indexing visible .gal-item elements. */
(function () {
  "use strict";
  var lb = document.getElementById("galLb");
  if (!lb) return;
  var view = document.getElementById("galLbView");
  var ico = document.getElementById("galLbIco");
  var txt = document.getElementById("galLbTxt");
  var cap = document.getElementById("galLbCap");
  var closeBtn = document.getElementById("galLbClose");
  var prevBtn = document.getElementById("galLbPrev");
  var nextBtn = document.getElementById("galLbNext");
  var items = Array.prototype.slice.call(document.querySelectorAll(".gal-item"));
  var current = -1;
  var trigger = null;

  function isRtl() {
    return document.documentElement.dir === "rtl";
  }
  function visible() {
    return items.filter(function (it) {
      return it.offsetParent !== null;
    });
  }
  function glyphs() {
    // direction-aware arrows: "previous" points to the reading-start side
    prevBtn.textContent = isRtl() ? "\u203A" : "\u2039";
    nextBtn.textContent = isRtl() ? "\u2039" : "\u203A";
  }
  function labels() {
    // localized control labels: site.js has no language event, and the
    // toggle sits under the overlay, so refresh them on every open
    var en = document.documentElement.lang === "en";
    closeBtn.setAttribute("aria-label", en ? "Close" : "\u0628\u0633\u062A\u0646");
    prevBtn.setAttribute(
      "aria-label",
      en ? "Previous image" : "\u062A\u0635\u0648\u06CC\u0631 \u0642\u0628\u0644\u06CC"
    );
    nextBtn.setAttribute(
      "aria-label",
      en ? "Next image" : "\u062A\u0635\u0648\u06CC\u0631 \u0628\u0639\u062F\u06CC"
    );
  }
  function fill(i) {
    var list = visible();
    if (!list.length) return;
    current = (i + list.length) % list.length;
    var item = list[current];
    var ph = item.querySelector(".gal-ph");
    if (!ph) return;
    var m = ph.className.match(/gal-r[0-9]+/);
    view.className = "gal-lb-view " + (m ? m[0] : "gal-r11");
    var svg = ph.querySelector("svg");
    ico.innerHTML = svg ? svg.outerHTML : "";
    var t = ph.querySelector(".gal-ph-t");
    txt.textContent = t ? t.textContent : "";
    var c = item.querySelector("figcaption");
    cap.textContent =
      (c ? c.textContent : "") + " \u00B7 " + (current + 1) + "/" + list.length;
    glyphs();
  }
  function open(item) {
    var list = visible();
    var i = list.indexOf(item);
    if (i < 0) return;
    trigger = document.activeElement;
    labels();
    fill(i);
    lb.classList.add("open");
    lb.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }
  function close() {
    lb.classList.remove("open");
    lb.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (trigger && trigger.focus) trigger.focus();
    trigger = null;
  }

  document.addEventListener("click", function (e) {
    var item = e.target.closest ? e.target.closest(".gal-item") : null;
    if (item) {
      open(item);
      return;
    }
    if (e.target === lb || e.target === closeBtn) close();
    else if (e.target === prevBtn) fill(current - 1);
    else if (e.target === nextBtn) fill(current + 1);
  });
  document.addEventListener("keydown", function (e) {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") fill(current + (isRtl() ? 1 : -1));
    else if (e.key === "ArrowRight") fill(current + (isRtl() ? -1 : 1));
  });
})();
