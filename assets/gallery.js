/* GALLERY-001: data-driven gallery + lightbox for gallery.html.
   Photos are defined in assets/gallery-data.js (window.GALLERY_DATA).
   To add unlimited photos: append entries to that array — no HTML edit needed.
   External file on purpose: CSP script-src 'self' forbids inline script. */
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
  var current = -1;
  var trigger = null;

  function isEn() {
    return document.documentElement.lang === "en";
  }
  function isRtl() {
    return document.documentElement.dir === "rtl";
  }

  // --- render tiles from data --------------------------------------------
  function makeTile(p) {
    var fig = document.createElement("figure");
    fig.className = "gal-item";
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "gal-ph " + (p.ratio || "gal-r11");
    btn.setAttribute(
      "aria-label",
      isEn()
        ? "Enlarge placeholder image " + p.id
        : "\u0628\u0632\u0631\u06af\u200c\u0646\u0645\u0627\u06cc\u06cc \u062a\u0635\u0648\u06cc\u0631 \u0646\u0645\u0627\u062f\u06cc\u0646 " + p.id
    );
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.5");
    svg.setAttribute("viewBox", "0 0 24 24");
    var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("height", "14");
    rect.setAttribute("rx", "2");
    rect.setAttribute("width", "18");
    rect.setAttribute("x", "3");
    rect.setAttribute("y", "5");
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M3 7l9 6 9-6");
    svg.appendChild(rect);
    svg.appendChild(path);
    btn.appendChild(svg);
    var span = document.createElement("span");
    span.className = "gal-ph-t";
    span.textContent = isEn() ? p.label_en : p.label_fa;
    btn.appendChild(span);
    fig.appendChild(btn);
    var fc = document.createElement("figcaption");
    fc.textContent = isEn() ? p.caption_en : p.caption_fa;
    fig.appendChild(fc);
    return fig;
  }

  function renderGrids() {
    var grids = document.querySelectorAll("[data-gallery]");
    var data = window.GALLERY_DATA || [];
    grids.forEach(function (grid) {
      grid.innerHTML = "";
      data.forEach(function (p) {
        grid.appendChild(makeTile(p));
      });
    });
  }

  renderGrids();

  var items = Array.prototype.slice.call(document.querySelectorAll(".gal-item"));

  function visible() {
    return items.filter(function (it) {
      return it.offsetParent !== null;
    });
  }
  function glyphs() {
    prevBtn.textContent = isRtl() ? "\u203A" : "\u2039";
    nextBtn.textContent = isRtl() ? "\u2039" : "\u203A";
  }
  function labels() {
    var en = isEn();
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
