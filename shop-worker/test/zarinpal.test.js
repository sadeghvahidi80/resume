import assert from "node:assert/strict";
import test from "node:test";

import {
  gatewayUrls,
  isSandbox,
  requestPayment,
  resolveMerchantId,
  verifyPayment,
} from "../src/zarinpal.js";

const SANDBOX_ENV = { ZARINPAL_SANDBOX: "1" };
const PROD_ENV = { ZARINPAL_SANDBOX: "0", ZARINPAL_MERCHANT_ID: "prod-merchant-uuid" };

function fakeFetch(handler) {
  return async (url, init) => handler(url, init);
}

test("sandbox detection accepts 1/true and rejects the rest", () => {
  assert.equal(isSandbox({ ZARINPAL_SANDBOX: "1" }), true);
  assert.equal(isSandbox({ ZARINPAL_SANDBOX: "true" }), true);
  assert.equal(isSandbox({ ZARINPAL_SANDBOX: "0" }), false);
  assert.equal(isSandbox({}), false);
});

test("gateway hosts switch between sandbox and production", () => {
  assert.equal(gatewayUrls(SANDBOX_ENV).startPay, "https://sandbox.zarinpal.com/pg/StartPay");
  assert.equal(gatewayUrls(PROD_ENV).api, "https://api.zarinpal.com/pg/v4");
});

test("production refuses to run without a merchant id", async () => {
  const result = await requestPayment({ ZARINPAL_SANDBOX: "0" }, { amountRial: 1000 });
  assert.equal(result.ok, false);
  assert.equal(result.message, "merchant_id_missing");
});

test("sandbox supplies a public test merchant id", () => {
  assert.match(resolveMerchantId(SANDBOX_ENV), /^[0-9a-f-]{36}$/);
});

test("a successful request returns the StartPay URL and Rial amount", async () => {
  let captured = null;
  const result = await requestPayment(
    SANDBOX_ENV,
    {
      amountRial: 2500000,
      callbackUrl: "https://pay.example/api/callback",
      description: "test",
      email: "buyer@example.com",
    },
    fakeFetch(async (url, init) => {
      captured = { url, body: JSON.parse(init.body) };
      return new Response(
        JSON.stringify({ data: { code: 100, authority: "A0000000000000000000000000000012345" }, errors: [] }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    })
  );

  assert.equal(captured.url, "https://sandbox.zarinpal.com/pg/v4/payment/request.json");
  assert.equal(captured.body.amount, 2500000);
  assert.equal(captured.body.callback_url, "https://pay.example/api/callback");
  assert.equal(captured.body.metadata.email, "buyer@example.com");
  assert.equal(result.ok, true);
  assert.equal(
    result.url,
    "https://sandbox.zarinpal.com/pg/StartPay/A0000000000000000000000000000012345"
  );
});

test("a failed request surfaces the gateway code", async () => {
  const result = await requestPayment(
    SANDBOX_ENV,
    { amountRial: 1000, callbackUrl: "https://pay.example/api/callback", description: "x" },
    fakeFetch(async () =>
      new Response(JSON.stringify({ data: [], errors: { code: -9, message: "validation" } }), {
        status: 422,
        headers: { "content-type": "application/json" },
      })
    )
  );
  assert.equal(result.ok, false);
  assert.equal(result.message, "validation");
});

test("verify accepts 100 and 101 and returns the reference id", async () => {
  for (const code of [100, 101]) {
    const result = await verifyPayment(
      SANDBOX_ENV,
      { amountRial: 5000, authority: "A1" },
      fakeFetch(async (url, init) => {
        assert.equal(url, "https://sandbox.zarinpal.com/pg/v4/payment/verify.json");
        assert.equal(JSON.parse(init.body).amount, 5000);
        return new Response(JSON.stringify({ data: { code, ref_id: 987654 } }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      })
    );
    assert.equal(result.ok, true);
    assert.equal(result.refId, "987654");
  }
});

test("verify rejects other codes", async () => {
  const result = await verifyPayment(
    SANDBOX_ENV,
    { amountRial: 5000, authority: "A1" },
    fakeFetch(async () =>
      new Response(JSON.stringify({ data: [], errors: { code: -51, message: "failed" } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    )
  );
  assert.equal(result.ok, false);
  assert.equal(result.code, -51);
});

test("network errors do not throw", async () => {
  const result = await verifyPayment(
    SANDBOX_ENV,
    { amountRial: 5000, authority: "A1" },
    fakeFetch(async () => {
      throw new Error("offline");
    })
  );
  assert.equal(result.ok, false);
  assert.equal(result.message, "network_error");
});
