import { findProduct, priceRial, visibleProducts } from "./catalog.js";
import { isSandbox, requestPayment, verifyPayment } from "./zarinpal.js";

const MAX_NAME = 80;
const MAX_CONTACT = 120;
const MAX_NOTE = 600;
const MAX_HIT_BYTES = 4096;
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 12;
const HIT_RATE_LIMIT = 40;

// Best-effort per-isolate throttle. Cloudflare may run several isolates, so
// this only blunts accidental double submits and naive scripts.
const buckets = new Map();
const hitBuckets = new Map();

// Crawlers that execute JavaScript would otherwise inflate the counter.
const BOT_UA =
  /(googlebot|bingbot|yandexbot|duckduckbot|baiduspider|applebot|petalbot|semrushbot|ahrefsbot|mj12bot|dotbot|facebookexternalhit|twitterbot|linkedinbot|headlesschrome|python-requests|curl\/|wget\/|go-http-client|uptime|monitor|crawler|spider|slurp)/i;

function json(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extraHeaders,
    },
  });
}

function allowedOrigins(env) {
  const list = [
    env && env.SITE_ORIGIN,
    "https://sadeghvahidi.ir",
    "https://www.sadeghvahidi.ir",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:8080",
  ];
  return list
    .filter(Boolean)
    .map((value) => String(value).replace(/\/+$/, ""));
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  if (!origin) return {};
  if (allowedOrigins(env).indexOf(origin) === -1) return {};
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
    vary: "Origin",
  };
}

function originAllowed(request, env) {
  const origin = request.headers.get("Origin");
  if (!origin) return true; // same-origin navigations and curl
  return allowedOrigins(env).indexOf(origin) !== -1;
}

function text(value, limit) {
  return String(value == null ? "" : value)
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, limit);
}

function clientIp(request) {
  return request.headers.get("CF-Connecting-IP") || "local";
}

function throttled(request) {
  const key = clientIp(request);
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || now - entry.start > RATE_WINDOW_MS) {
    buckets.set(key, { start: now, count: 1 });
    return false;
  }
  entry.count += 1;
  if (buckets.size > 5000) buckets.clear();
  return entry.count > RATE_LIMIT;
}

function hitThrottled(request) {
  const key = clientIp(request);
  const now = Date.now();
  const entry = hitBuckets.get(key);
  if (!entry || now - entry.start > RATE_WINDOW_MS) {
    hitBuckets.set(key, { start: now, count: 1 });
    return false;
  }
  entry.count += 1;
  if (hitBuckets.size > 5000) hitBuckets.clear();
  return entry.count > HIT_RATE_LIMIT;
}

function hitPath(value) {
  const raw = text(value, 200);
  if (!raw || raw[0] !== "/") return null;
  const path = raw.split(/[?#]/)[0].slice(0, 200);
  return path || "/";
}

function referrerHost(value) {
  const raw = text(value, 500);
  if (!raw) return "direct";
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "direct";
    const host = url.hostname.toLowerCase();
    if (host === "sadeghvahidi.ir" || host.endsWith(".sadeghvahidi.ir")) return "internal";
    return host.slice(0, 120) || "direct";
  } catch (error) {
    return "direct";
  }
}

function deviceClass(userAgent) {
  return /Mobi|Android|iPhone|iPad|iPod|Mobile/i.test(userAgent) ? "mobile" : "desktop";
}

function hitLang(value) {
  const raw = text(value, 8).toLowerCase();
  if (raw.slice(0, 2) === "fa") return "fa";
  if (raw.slice(0, 2) === "en") return "en";
  return "other";
}

function siteBase(env) {
  return String((env && env.SITE_ORIGIN) || "https://sadeghvahidi.ir").replace(/\/+$/, "");
}

function siteRedirect(env, params) {
  const query = new URLSearchParams(params).toString();
  return Response.redirect(`${siteBase(env)}/shop.html?${query}`, 302);
}

async function health(env) {
  return json({
    ok: true,
    service: "sadeghvahidi-shop",
    sandbox: isSandbox(env),
    merchantConfigured: Boolean((env && env.ZARINPAL_MERCHANT_ID) || isSandbox(env)),
    db: Boolean(env && env.DB),
    telegram: Boolean(env && env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID),
  });
}

function products(env) {
  const sandbox = isSandbox(env);
  const items = visibleProducts().map((item) => ({
    id: item.id,
    title: item.title,
    summary: item.summary,
    deliverables: item.deliverables,
    duration: item.duration,
    badge: item.badge,
    priceToman: item.priceToman === null || item.priceToman === undefined ? null : item.priceToman,
    priceFrom: Boolean(item.priceFrom),
    purchasable: priceRial(item) !== null,
  }));
  return json({ ok: true, sandbox, products: items });
}

// Cookieless, first-party pageview counter. The row holds no IP and no user
// agent: only the path, the referrer host, the Cloudflare country, a coarse
// device class, the page language and the viewport width.
async function hit(request, env) {
  if (!request.headers.get("Origin") || !originAllowed(request, env)) {
    return json({ ok: false, error: "origin_not_allowed" }, 403);
  }
  const userAgent = request.headers.get("User-Agent") || "";
  if (BOT_UA.test(userAgent)) {
    return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
  }
  if (hitThrottled(request)) {
    return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
  }
  const declared = Number(request.headers.get("Content-Length") || 0);
  if (declared > MAX_HIT_BYTES) {
    return json({ ok: false, error: "too_large" }, 413);
  }
  if (!env || !env.DB) {
    return json({ ok: false, error: "db_not_configured" }, 500);
  }

  let body;
  try {
    const raw = await request.text();
    if (raw.length > MAX_HIT_BYTES) {
      return json({ ok: false, error: "too_large" }, 413);
    }
    body = JSON.parse(raw);
  } catch (error) {
    return json({ ok: false, error: "bad_json" }, 400);
  }
  if (!body || typeof body !== "object") {
    return json({ ok: false, error: "bad_json" }, 400);
  }

  const path = hitPath(body.path);
  if (!path) {
    return json({ ok: false, error: "bad_path" }, 400);
  }

  const viewport = Math.max(0, Math.min(9999, Math.round(Number(body.viewport) || 0)));
  const country =
    request.cf && request.cf.country ? String(request.cf.country).toUpperCase().slice(0, 2) : "";

  try {
    await env.DB.prepare(
      "INSERT INTO pageviews (ts, path, referrer, country, device, lang, viewport) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
      .bind(
        Math.floor(Date.now() / 1000),
        path,
        referrerHost(body.referrer),
        country,
        deviceClass(userAgent),
        hitLang(body.lang),
        viewport
      )
      .run();
  } catch (error) {
    return json({ ok: false, error: "db_write_failed" }, 500);
  }

  return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
}

async function checkout(request, env) {
  if (!originAllowed(request, env)) {
    return json({ ok: false, error: "origin_not_allowed" }, 403);
  }
  if (throttled(request)) {
    return json({ ok: false, error: "rate_limited" }, 429);
  }
  if (!env || !env.DB) {
    return json({ ok: false, error: "db_not_configured" }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return json({ ok: false, error: "bad_json" }, 400);
  }

  if (body.honeypot) {
    return json({ ok: false, error: "rejected" }, 400);
  }

  const elapsed = Date.now() / 1000 - Number(body.open_ts || 0);
  if (!(elapsed >= 2 && elapsed < 86400)) {
    return json({ ok: false, error: "too_fast" }, 400);
  }

  const sandbox = isSandbox(env);
  const product = findProduct(body.productId, { sandbox });
  if (!product) {
    return json({ ok: false, error: "unknown_product" }, 404);
  }

  const amountRial = priceRial(product);
  if (!amountRial) {
    return json({ ok: false, error: "price_not_set" }, 409);
  }

  const name = text(body.name, MAX_NAME);
  const contact = text(body.contact, MAX_CONTACT);
  const note = text(body.note, MAX_NOTE);
  const locale = body.locale === "en" ? "en" : "fa";
  if (!name || !contact) {
    return json({ ok: false, error: "missing_fields" }, 400);
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  try {
    await env.DB.prepare(
      "INSERT INTO orders (id, product_id, amount_rial, status, name, contact, note, locale, created_at) " +
        "VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?)"
    )
      .bind(id, product.id, amountRial, name, contact, note, locale, createdAt)
      .run();
  } catch (error) {
    return json({ ok: false, error: "db_write_failed" }, 500);
  }

  const callbackUrl = new URL("/api/callback", request.url).toString();
  const payment = await requestPayment(env, {
    amountRial,
    callbackUrl,
    description: `خرید ${product.title.fa} — sadeghvahidi.ir`,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) ? contact : undefined,
  });

  if (!payment.ok) {
    console.error("zarinpal_request_failed", payment.code, payment.message);
    await env.DB.prepare("UPDATE orders SET status = 'failed' WHERE id = ?").bind(id).run();
    return json({ ok: false, error: "gateway_error", code: payment.code }, 502);
  }

  await env.DB.prepare("UPDATE orders SET authority = ? WHERE id = ?")
    .bind(payment.authority, id)
    .run();

  return json({ ok: true, orderId: id, paymentUrl: payment.url });
}

async function orderStatus(request, env) {
  if (!originAllowed(request, env)) {
    return json({ ok: false, error: "origin_not_allowed" }, 403);
  }
  if (!env || !env.DB) {
    return json({ ok: false, error: "db_not_configured" }, 500);
  }
  const id = String(new URL(request.url).searchParams.get("id") || "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return json({ ok: false, error: "bad_order" }, 400);
  }
  const row = await env.DB.prepare(
    "SELECT id, product_id, amount_rial, status, ref_id, created_at, paid_at FROM orders WHERE id = ?"
  )
    .bind(id)
    .first();
  if (!row) {
    return json({ ok: false, error: "not_found" }, 404);
  }
  return json({
    ok: true,
    order: {
      id: row.id,
      productId: row.product_id,
      amountToman: row.amount_rial / 10,
      status: row.status,
      refId: row.ref_id || null,
      createdAt: row.created_at,
      paidAt: row.paid_at || null,
    },
  });
}

async function notify(env, order, refId) {
  if (!env || !env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return;
  const amountToman = Number(order.amount_rial) / 10;
  const message = [
    "پرداخت موفق — فروشگاه sadeghvahidi.ir",
    `محصول: ${order.product_id}`,
    `مبلغ: ${amountToman.toLocaleString("fa-IR")} تومان`,
    `خریدار: ${order.name}`,
    `تماس: ${order.contact}`,
    order.note ? `یادداشت: ${order.note}` : null,
    `کد رهگیری: ${refId}`,
    `شناسهٔ سفارش: ${order.id}`,
  ]
    .filter(Boolean)
    .join("\n");
  try {
    await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: message }),
      signal: AbortSignal.timeout(5000),
    });
  } catch (error) {
    // Notification failure must never break the payment confirmation.
  }
}

async function callback(request, env) {
  if (!env || !env.DB) {
    return siteRedirect(env, { status: "error", reason: "db" });
  }
  const url = new URL(request.url);
  const authority = url.searchParams.get("Authority") || "";
  const status = url.searchParams.get("Status") || "";
  if (!authority) {
    return siteRedirect(env, { status: "error", reason: "authority" });
  }

  const order = await env.DB.prepare("SELECT * FROM orders WHERE authority = ?")
    .bind(authority)
    .first();
  if (!order) {
    return siteRedirect(env, { status: "error", reason: "unknown" });
  }
  if (order.status === "paid") {
    return siteRedirect(env, { status: "paid", order: order.id });
  }
  if (status !== "OK") {
    await env.DB.prepare("UPDATE orders SET status = 'canceled' WHERE id = ?").bind(order.id).run();
    return siteRedirect(env, { status: "canceled", order: order.id });
  }

  const result = await verifyPayment(env, {
    amountRial: order.amount_rial,
    authority,
  });

  if (!result.ok) {
    await env.DB.prepare("UPDATE orders SET status = 'failed' WHERE id = ?").bind(order.id).run();
    return siteRedirect(env, { status: "failed", order: order.id });
  }

  const paidAt = new Date().toISOString();
  await env.DB.prepare("UPDATE orders SET status = 'paid', ref_id = ?, paid_at = ? WHERE id = ?")
    .bind(result.refId, paidAt, order.id)
    .run();
  await notify(env, order, result.refId);

  return siteRedirect(env, { status: "paid", order: order.id });
}

// This worker only speaks JSON, so the policy can forbid everything the API
// does not need. It is applied to every response — success, error, preflight
// and the redirect back to the site — so no code path can forget it.
const SECURITY_HEADERS = {
  "strict-transport-security": "max-age=31536000; includeSubDomains",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "no-referrer",
  "permissions-policy": "geolocation=(), microphone=(), camera=(), payment=(), usb=()",
  "content-security-policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
};

function withSecurityHeaders(response) {
  const headers = new Headers(response.headers);
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => headers.set(key, value));
  return new Response(response.body, { status: response.status, headers });
}

const worker = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const cors = corsHeaders(request, env);

    if (request.method === "OPTIONS") {
      if (request.headers.get("Origin") && !originAllowed(request, env)) {
        return new Response(null, { status: 403 });
      }
      return new Response(null, { status: 204, headers: { ...cors, "cache-control": "no-store" } });
    }

    try {
      let response;
      if (url.pathname === "/api/checkout") {
        if (request.method !== "POST") {
          response = json({ ok: false, error: "method_not_allowed" }, 405);
        } else {
          response = await checkout(request, env);
        }
      } else if (url.pathname === "/api/callback") {
        response = await callback(request, env);
      } else if (url.pathname === "/api/order") {
        response = await orderStatus(request, env);
      } else if (url.pathname === "/api/health") {
        response = await health(env);
      } else if (url.pathname === "/api/products") {
        response = products(env);
      } else if (url.pathname === "/api/hit") {
        if (request.method !== "POST") {
          response = json({ ok: false, error: "method_not_allowed" }, 405);
        } else {
          response = await hit(request, env);
        }
      } else if (url.pathname === "/") {
        response = json({ ok: true, service: "sadeghvahidi-shop" });
      } else {
        response = json({ ok: false, error: "not_found" }, 404);
      }

      const headers = new Headers(response.headers);
      Object.entries(cors).forEach(([key, value]) => headers.set(key, value));
      return new Response(response.body, { status: response.status, headers });
    } catch (error) {
      console.error("shop_worker_error", error && error.stack ? error.stack : String(error));
      return json({ ok: false, error: "server_error" }, 500, cors);
    }
  },
};

export default {
  async fetch(request, env) {
    return withSecurityHeaders(await worker.fetch(request, env));
  },
};
