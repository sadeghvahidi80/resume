import assert from "node:assert/strict";
import test from "node:test";

import worker from "../src/index.js";
import { FakeDB } from "./fake-db.js";

const ORIGIN = "https://sadeghvahidi.ir";
const realFetch = globalThis.fetch;
let gatewayCalls = [];

function makeEnv() {
  return {
    DB: new FakeDB(),
    SITE_ORIGIN: ORIGIN,
    ZARINPAL_SANDBOX: "1",
  };
}

function checkoutBody(overrides = {}) {
  return {
    productId: "sandbox-demo",
    name: "خریدار تست",
    contact: "buyer@example.com",
    note: "",
    locale: "fa",
    open_ts: Math.floor(Date.now() / 1000) - 5,
    honeypot: "",
    ...overrides,
  };
}

function checkoutRequest(payload, origin = ORIGIN, ip = "10.0.0.1") {
  return new Request("https://pay.sadeghvahidi.ir/api/checkout", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin,
      "cf-connecting-ip": ip,
    },
    body: typeof payload === "string" ? payload : JSON.stringify(payload),
  });
}

function installGateway({ requestCode = 100, verifyCode = 100, refId = 123456 } = {}) {
  gatewayCalls = [];
  globalThis.fetch = async (url, init) => {
    gatewayCalls.push({ url: String(url), body: init && init.body ? JSON.parse(init.body) : null });
    if (String(url).includes("/payment/request.json")) {
      return new Response(
        JSON.stringify({ data: { code: requestCode, authority: "A0000000000000000000000000000099999" } }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }
    if (String(url).includes("/payment/verify.json")) {
      return new Response(JSON.stringify({ data: { code: verifyCode, ref_id: refId } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    return new Response("unexpected", { status: 500 });
  };
}

function restore() {
  globalThis.fetch = realFetch;
}

test("health reports sandbox, db and merchant state", async () => {
  const response = await worker.fetch(new Request("https://pay.sadeghvahidi.ir/api/health"), makeEnv(), {});
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.sandbox, true);
  assert.equal(body.db, true);
  assert.equal(body.merchantConfigured, true);
});

test("checkout refuses a product whose price is not set", async () => {
  const response = await worker.fetch(
    checkoutRequest(checkoutBody({ productId: "unpriced-demo" })),
    makeEnv(),
    {}
  );
  const body = await response.json();
  assert.equal(response.status, 409);
  assert.equal(body.error, "price_not_set");
});

test("checkout rejects a disallowed origin", async () => {
  const response = await worker.fetch(
    checkoutRequest(checkoutBody(), "https://evil.example"),
    makeEnv(),
    {}
  );
  assert.equal(response.status, 403);
});

test("checkout rejects broken json and honeypot hits", async () => {
  const env = makeEnv();
  const broken = await worker.fetch(checkoutRequest("{not json"), env, {});
  assert.equal(broken.status, 400);

  const honey = await worker.fetch(checkoutRequest(checkoutBody({ honeypot: "bot" })), env, {});
  assert.equal(honey.status, 400);
});

test("a full sandbox payment is stored, verified and reported", async (t) => {
  t.after(restore);
  installGateway({ verifyCode: 101, refId: 555777 });
  const env = makeEnv();

  const created = await worker.fetch(checkoutRequest(checkoutBody()), env, {});
  const createdBody = await created.json();
  assert.equal(created.status, 200);
  assert.equal(createdBody.ok, true);
  assert.match(createdBody.paymentUrl, /^https:\/\/sandbox\.zarinpal\.com\/pg\/StartPay\//);
  assert.match(createdBody.orderId, /^[0-9a-f-]{36}$/);

  const requestCall = gatewayCalls.find((call) => call.url.includes("/payment/request.json"));
  assert.equal(requestCall.body.amount, 100000, "10000 Toman becomes 100000 Rial");

  const pending = await worker.fetch(
    new Request(`https://pay.sadeghvahidi.ir/api/order?id=${createdBody.orderId}`),
    env,
    {}
  );
  const pendingBody = await pending.json();
  assert.equal(pendingBody.order.status, "pending");
  assert.equal(pendingBody.order.amountToman, 10000);

  const callback = await worker.fetch(
    new Request(
      "https://pay.sadeghvahidi.ir/api/callback?Authority=A0000000000000000000000000000099999&Status=OK"
    ),
    env,
    {}
  );
  assert.equal(callback.status, 302);
  assert.match(
    callback.headers.get("location"),
    new RegExp(`/shop\\.html\\?status=paid&order=${createdBody.orderId}$`)
  );

  const paid = await worker.fetch(
    new Request(`https://pay.sadeghvahidi.ir/api/order?id=${createdBody.orderId}`),
    env,
    {}
  );
  const paidBody = await paid.json();
  assert.equal(paidBody.order.status, "paid");
  assert.equal(paidBody.order.refId, "555777");
  assert.ok(paidBody.order.paidAt);

  const before = gatewayCalls.filter((call) => call.url.includes("/payment/verify.json")).length;
  const duplicate = await worker.fetch(
    new Request(
      "https://pay.sadeghvahidi.ir/api/callback?Authority=A0000000000000000000000000000099999&Status=OK"
    ),
    env,
    {}
  );
  assert.equal(duplicate.status, 302);
  const after = gatewayCalls.filter((call) => call.url.includes("/payment/verify.json")).length;
  assert.equal(after, before, "a paid order is never verified twice");
});

test("a canceled payment is marked canceled without calling verify", async (t) => {
  t.after(restore);
  installGateway();
  const env = makeEnv();

  const created = await worker.fetch(checkoutRequest(checkoutBody(), ORIGIN, "10.0.0.2"), env, {});
  const { orderId } = await created.json();

  const callback = await worker.fetch(
    new Request(
      "https://pay.sadeghvahidi.ir/api/callback?Authority=A0000000000000000000000000000099999&Status=NOK"
    ),
    env,
    {}
  );
  assert.equal(callback.status, 302);
  assert.match(callback.headers.get("location"), /status=canceled/);
  assert.equal(gatewayCalls.some((call) => call.url.includes("/payment/verify.json")), false);

  const status = await worker.fetch(
    new Request(`https://pay.sadeghvahidi.ir/api/order?id=${orderId}`),
    env,
    {}
  );
  assert.equal((await status.json()).order.status, "canceled");
});

test("a failed request marks the order failed and returns 502", async (t) => {
  t.after(restore);
  installGateway({ requestCode: -9 });
  const env = makeEnv();
  const response = await worker.fetch(checkoutRequest(checkoutBody(), ORIGIN, "10.0.0.3"), env, {});
  const body = await response.json();
  assert.equal(response.status, 502);
  assert.equal(body.error, "gateway_error");
});

test("the public product list hides the sandbox product", async () => {
  const response = await worker.fetch(
    new Request("https://pay.sadeghvahidi.ir/api/products"),
    makeEnv(),
    {}
  );
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.products.some((item) => item.id === "sandbox-demo"), false);
  assert.ok(body.products.every((item) => item.purchasable === (item.priceToman !== null)));
});
