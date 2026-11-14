/* Published demo build: payment values intentionally cleared. */
/* Ravanyar payment config — FILL IN real values before launch.
   Empty string = method shown as "coming soon" (pay_pending). */
var RAVANYAR_PAY = {
  // Layer 1 — Rial (inside Iran)
  zarinpal: "",   // e.g. https://zarinp.al/ravanyar
  zibal: "",      // e.g. https://zibal.ir/...
  card: "",       // بانک شهر — زهره رجبی
  sheba: "",      // بانک شهر — زهره رجبی
  enamad: "",     // Enamad legal-charity code, e.g. "کد ۱۲۳۴۵" (empty = "در حال اخذ")
  hamibash: "",   // campaign link
  behesht: "",    // campaign link
  // Layer 2 — FX (diaspora)
  donorbox: "",
  stripe: "",
  paypal: "",
  paypal_email: "",
  transparency: "transparency.html",
  // Layer 3 — Crypto bridge
  btc: "",
  usdt: "",
  btcpay: "",
  report: ""
};

(function () {
  function pendingText() {
    try {
      var S = window.psyStrings || {};
      if (S.pay_pending) return S.pay_pending;
    } catch (e) {}
    return document.documentElement.lang === "en"
      ? "Activating soon — coordination in progress."
      : "به‌زودی فعال می‌شود — در حال تکمیل هماهنگی.";
  }
  function copiedText() {
    try {
      var S = window.psyStrings || {};
      if (S.pay_copied) return S.pay_copied;
    } catch (e) {}
    return document.documentElement.lang === "en" ? "Copied ✓" : "کپی شد ✓";
  }
  function applyLang() {
    var isEn = document.documentElement.lang === "en";
    document.querySelectorAll("[data-pay-link]").forEach(function (a) {
      var v = RAVANYAR_PAY[a.getAttribute("data-pay-link")];
      if (v) { a.href = v; a.classList.remove("pay-pending"); }
      else {
        a.href = "#payments-section";
        if (!a.querySelector(".pay-pending-note")) {
          var s = document.createElement("div");
          s.className = "pay-pending-note";
          s.textContent = pendingText();
          a.appendChild(s);
        }
        a.classList.add("pay-pending");
      }
    });
    document.querySelectorAll("[data-pay-copy]").forEach(function (code) {
      var v = RAVANYAR_PAY[code.getAttribute("data-pay-copy")];
      code.textContent = v || (isEn ? "Announced soon" : "به‌زودی اعلام می‌شود");
    });
    var en = document.querySelector('[data-pay-text="enamad"]');
    if (en) en.textContent = RAVANYAR_PAY.enamad || (isEn ? "Being obtained" : "در حال اخذ");
  }
  function copyOf(key, btn) {
    var v = RAVANYAR_PAY[key];
    if (!v) return;
    function done() {
      var old = btn.textContent;
      btn.textContent = copiedText();
      setTimeout(function () { btn.textContent = old; }, 1600);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(v).then(done, done);
    } else {
      var ta = document.createElement("textarea");
      ta.value = v;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(ta);
      done();
    }
  }
  document.querySelectorAll("[data-copy-of]").forEach(function (btn) {
    btn.addEventListener("click", function () { copyOf(btn.getAttribute("data-copy-of"), btn); });
  });
  window.RavanyarPayRefresh = applyLang;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyLang);
  } else { applyLang(); }
  // re-apply after language toggle swaps strings
  var _t = window.psyToggleLang;
  window.psyToggleLang = function () {
    if (_t) _t();
    setTimeout(applyLang, 0);
  };
})();
