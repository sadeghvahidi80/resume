/* Shop page behavior — catalog hydration, checkout dialog, return-status banner.
   Loaded with defer after site.js so the language is already applied. */
window.SHOP_CONFIG = { apiBase: "https://pay.sadeghvahidi.ir" };

(function () {
  'use strict';

  var root = document.documentElement;
  var cfg = window.SHOP_CONFIG || {};
  var apiBase = String(cfg.apiBase || "").replace(/\/+$/, "");
  var dialog = document.getElementById("checkoutDialog");
  var form = document.getElementById("checkoutForm");
  var statusEl = document.getElementById("shopStatus");
  var sandboxFa = document.getElementById("shopSandboxNoteFa");
  var sandboxEn = document.getElementById("shopSandboxNoteEn");
  var titleEl = document.getElementById("checkoutProduct");
  var priceEl = document.getElementById("checkoutPrice");
  var errorEl = document.getElementById("checkoutError");
  var submitEl = document.getElementById("checkoutSubmit");
  var cancelEl = document.getElementById("checkoutCancel");
  var nameEl = document.getElementById("co-name");
  var contactEl = document.getElementById("co-contact");
  var noteEl = document.getElementById("co-note");
  var honeyEl = document.getElementById("co-honeypot");
  var openTsEl = document.getElementById("co-open-ts");

  var products = {};
  var active = null;
  var submitting = false;
  var lastFocus = null;

  var L = {
    fa: {
      byAgreement: "قیمت توافقی",
      selectFirst: "ابتدا یک خدمت را انتخاب کنید.",
      missing: "نام و راه ارتباطی را کامل کنید.",
      sending: "در حال انتقال به درگاه…",
      pay: "پرداخت",
      priceNotSet: "قیمت این خدمت هنوز ثبت نشده است. از فرم تماس درخواست بدهید.",
      unknown: "این خدمت در دسترس نیست.",
      limited: "درخواست‌های پیاپی زیاد بود؛ یک دقیقه بعد دوباره تلاش کنید.",
      gateway: "درگاه پرداخت پاسخ نداد. چند دقیقه بعد دوباره تلاش کنید.",
      offline: "ارتباط با درگاه برقرار نشد. اتصال اینترنت را بررسی کنید.",
      generic: "ثبت سفارش انجام نشد. از فرم تماس استفاده کنید.",
      paid: "پرداخت با موفقیت ثبت شد.",
      paidRef: "کد رهگیری: ",
      paidOrder: "شناسهٔ سفارش: ",
      paidNoRef: "سفارش ثبت شد؛ کد رهگیری از درگاه دریافت نشد. برای پیگیری پیام بدهید.",
      canceled: "پرداخت لغو شد و مبلغی کسر نشد.",
      failed: "پرداخت تأیید نشد. اگر مبلغی کسر شده، طی ۷۲ ساعت بازمی‌گردد.",
      error: "بازگشت از درگاه کامل نبود. وضعیت سفارش را از فرم تماس پیگیری کنید.",
      retry: " برای تلاش دوباره، خدمت را از فهرست انتخاب کنید."
    },
    en: {
      byAgreement: "By agreement",
      selectFirst: "Choose a service first.",
      missing: "Please fill in your name and a way to reach you.",
      sending: "Redirecting to the gateway…",
      pay: "Pay",
      priceNotSet: "This service has no published price yet. Please use the contact form.",
      unknown: "This service is not available.",
      limited: "Too many attempts; please try again in a minute.",
      gateway: "The payment gateway did not respond. Please try again shortly.",
      offline: "Could not reach the payment service. Check your connection.",
      generic: "The order could not be created. Please use the contact form.",
      paid: "Payment recorded successfully.",
      paidRef: "Reference ID: ",
      paidOrder: "Order ID: ",
      paidNoRef: "The order is recorded, but the gateway did not return a reference ID. Message me to follow up.",
      canceled: "The payment was canceled and nothing was charged.",
      failed: "The payment was not confirmed. If you were charged, it is refunded within 72 hours.",
      error: "The gateway return was incomplete. Follow up on the order through the contact form.",
      retry: " To try again, pick the service from the list."
    }
  };

  function lang() {
    return root.lang === "en" ? "en" : "fa";
  }

  function t(key) {
    return (L[lang()] || L.fa)[key];
  }

  function applyDialogStrings() {
    var code = lang();
    var nodes = dialog ? dialog.querySelectorAll("[data-fa][data-en]") : [];
    Array.prototype.forEach.call(nodes, function (node) {
      var value = node.getAttribute(code === "en" ? "data-en" : "data-fa");
      if (value) node.textContent = value;
    });
    var placeholders = dialog ? dialog.querySelectorAll("[data-ph-fa][data-ph-en]") : [];
    Array.prototype.forEach.call(placeholders, function (node) {
      var value = node.getAttribute(code === "en" ? "data-ph-en" : "data-ph-fa");
      if (value) node.setAttribute("placeholder", value);
    });
    if (submitEl && !submitting) submitEl.textContent = t("pay");
    if (active) fillDialog(active);
    renderStatus();
  }

  function money(toman, code, from) {
    var value = Number(toman);
    if (!isFinite(value) || value <= 0) return null;
    var digits = value.toLocaleString(code === "en" ? "en-US" : "fa-IR");
    if (code === "en") return (from ? "from " : "") + digits + " Toman";
    return (from ? "از " : "") + digits + " تومان";
  }

  function eachCard(id, fn) {
    var cards = document.querySelectorAll('.shop-card[data-product="' + id + '"]');
    Array.prototype.forEach.call(cards, fn);
  }

  function paintCard(product) {
    eachCard(product.id, function (card) {
      var block = card.closest(".lang-en") ? "en" : "fa";
      var valueEl = card.querySelector("[data-price]");
      var buy = card.querySelector("[data-buy]");
      var price = money(product.priceToman, block, product.priceFrom);
      if (valueEl) {
        if (price) {
          valueEl.textContent = price;
          valueEl.removeAttribute("data-empty");
        } else {
          valueEl.textContent = L[block].byAgreement;
          valueEl.setAttribute("data-empty", "1");
        }
      }
      if (buy) {
        if (price && product.purchasable !== false) {
          buy.removeAttribute("hidden");
          buy.removeAttribute("aria-disabled");
        } else {
          buy.setAttribute("hidden", "hidden");
        }
      }
    });
  }

  function fillDialog(product) {
    var code = lang();
    if (titleEl) titleEl.textContent = (product.title && product.title[code]) || product.id;
    if (priceEl) priceEl.textContent = money(product.priceToman, code, product.priceFrom) || t("byAgreement");
  }

  function clearError() {
    if (errorEl) errorEl.textContent = "";
    [nameEl, contactEl].forEach(function (el) {
      if (el) el.removeAttribute("aria-invalid");
    });
  }

  function showError(message) {
    if (errorEl) errorEl.textContent = message;
  }

  function openDialog(product) {
    active = product;
    clearError();
    fillDialog(product);
    if (openTsEl) openTsEl.value = String(Math.floor(Date.now() / 1000));
    lastFocus = document.activeElement;
    if (!dialog) return;
    if (typeof dialog.showModal === "function") {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute("open", "open");
    }
    if (nameEl) nameEl.focus();
  }

  function closeDialog() {
    if (!dialog) return;
    if (typeof dialog.close === "function" && dialog.open) dialog.close();
    else dialog.removeAttribute("open");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function errorFor(code) {
    switch (code) {
      case "price_not_set":
        return t("priceNotSet");
      case "unknown_product":
        return t("unknown");
      case "rate_limited":
        return t("limited");
      case "gateway_error":
        return t("gateway");
      case "missing_fields":
        return t("missing");
      default:
        return t("generic");
    }
  }

  function checkout() {
    if (!active || submitting) return;
    clearError();
    var name = nameEl ? nameEl.value.trim() : "";
    var contact = contactEl ? contactEl.value.trim() : "";
    if (!name || !contact) {
      if (!name && nameEl) nameEl.setAttribute("aria-invalid", "true");
      if (!contact && contactEl) contactEl.setAttribute("aria-invalid", "true");
      showError(t("missing"));
      if (!name && nameEl) nameEl.focus();
      else if (contactEl) contactEl.focus();
      return;
    }
    if (!apiBase) {
      showError(t("offline"));
      return;
    }

    submitting = true;
    if (submitEl) {
      submitEl.setAttribute("disabled", "disabled");
      submitEl.textContent = t("sending");
    }

    var payload = {
      productId: active.id,
      name: name,
      contact: contact,
      note: noteEl ? noteEl.value.trim() : "",
      locale: lang(),
      open_ts: Number(openTsEl && openTsEl.value ? openTsEl.value : 0),
      honeypot: honeyEl ? honeyEl.value : ""
    };

    fetch(apiBase + "/api/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function (response) {
        return response.json().then(function (data) {
          return { status: response.status, data: data };
        });
      })
      .then(function (result) {
        var data = result.data || {};
        if (data.ok && data.paymentUrl) {
          window.location.assign(data.paymentUrl);
          return;
        }
        submitting = false;
        if (submitEl) {
          submitEl.removeAttribute("disabled");
          submitEl.textContent = t("pay");
        }
        showError(errorFor(data.error));
      })
      .catch(function () {
        submitting = false;
        if (submitEl) {
          submitEl.removeAttribute("disabled");
          submitEl.textContent = t("pay");
        }
        showError(t("offline"));
      });
  }

  var statusState = { state: "", orderId: "", refId: "" };

  function renderStatus() {
    if (!statusEl || !statusState.state) return;
    var message;
    if (statusState.state === "paid") {
      message = t("paid");
      if (statusState.refId) {
        message += " " + t("paidRef") + statusState.refId + ".";
        if (statusState.orderId) message += " " + t("paidOrder") + statusState.orderId;
      } else {
        message += " " + t("paidNoRef");
      }
    } else if (statusState.state === "canceled") {
      message = t("canceled") + t("retry");
    } else if (statusState.state === "failed") {
      message = t("failed") + t("retry");
    } else {
      message = t("error");
    }
    statusEl.textContent = message;
    statusEl.hidden = false;
    statusEl.setAttribute("data-state", statusState.state);
  }

  function readReturnStatus() {
    var query;
    try {
      query = new URLSearchParams(window.location.search);
    } catch (e) {
      return;
    }
    var state = query.get("status");
    if (!state) return;
    var orderId = query.get("order") || "";
    statusState = { state: state, orderId: orderId, refId: "" };
    renderStatus();

    if (state === "paid" && orderId && apiBase) {
      fetch(apiBase + "/api/order?id=" + encodeURIComponent(orderId), {
        headers: { accept: "application/json" }
      })
        .then(function (response) {
          return response.json();
        })
        .then(function (data) {
          if (data && data.ok && data.order && data.order.refId) {
            statusState.refId = String(data.order.refId);
            renderStatus();
          }
        })
        .catch(function () {});
    }
  }

  function hydrateCatalog() {
    if (!apiBase) return;
    fetch(apiBase + "/api/products", { headers: { accept: "application/json" } })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        if (!data || !data.ok) return;
        if (data.sandbox) {
          if (sandboxFa) sandboxFa.hidden = false;
          if (sandboxEn) sandboxEn.hidden = false;
        }
        (data.products || []).forEach(function (item) {
          products[item.id] = item;
          paintCard(item);
        });
      })
      .catch(function () {
        /* Keep the static tariff and its checkout buttons; the dialog reports
           the failure if the worker is unreachable at submit time. */
      });
  }

  Array.prototype.forEach.call(document.querySelectorAll("[data-buy]"), function (button) {
    button.addEventListener("click", function () {
      var id = button.getAttribute("data-buy");
      var fallback = document.querySelector('.shop-card[data-product="' + id + '"]');
      var product = products[id];
      if (!product && fallback) {
        var priceNode = fallback.querySelector("[data-price]");
        var amount = priceNode ? Number(priceNode.getAttribute("data-price-toman")) : NaN;
        product = {
          id: id,
          priceToman: isFinite(amount) && amount > 0 ? amount : null,
          priceFrom: priceNode ? priceNode.getAttribute("data-price-from") === "1" : false,
          purchasable: isFinite(amount) && amount > 0,
          title: {}
        };
      }
      if (!product) {
        showError(t("selectFirst"));
        return;
      }
      if (!product.purchasable) {
        showError(t("priceNotSet"));
        return;
      }
      openDialog(product);
    });
  });

  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      checkout();
    });
  }

  if (cancelEl) cancelEl.addEventListener("click", closeDialog);

  if (dialog) {
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) closeDialog();
    });
  }

  if (window.MutationObserver) {
    var observer = new MutationObserver(applyDialogStrings);
    observer.observe(root, { attributes: true, attributeFilter: ["lang", "dir"] });
  }

  applyDialogStrings();
  hydrateCatalog();
  readReturnStatus();
})();
