import assert from "node:assert/strict";
import test from "node:test";

import worker from "../src/index.js";
import { FakeDB } from "./fake-db.js";

const ORIGIN = "https://sadeghvahidi.ir";
const BASE = "https://pay.sadeghvahidi.ir";

function makeEnv(overrides = {}) {
  return { DB: new FakeDB(), SITE_ORIGIN: ORIGIN, ZARINPAL_SANDBOX: "1", ...overrides };
}

// The worker answers JSON only, so the policy can be maximally strict.
const REQUIRED = {
  "strict-transport-security": /^max-age=\d{6,}(; includeSubDomains)?$/,
  "x-content-type-options": /^nosniff$/,
  "x-frame-options": /^(DENY|SAMEORIGIN)$/,
  "referrer-policy": /^no-referrer$/,
  "permissions-policy": /geolocation=\(\)/,
  "content-security-policy": /default-src 'none'/,
};

function assertSecure(label, response) {
  for (const [header, pattern] of Object.entries(REQUIRED)) {
    const value = response.headers.get(header);
    assert.ok(value, `${label}: ${header} is missing`);
    assert.match(value, pattern, `${label}: ${header} = ${JSON.stringify(value)}`);
  }
}

const CASES = [
  ["health", new Request(`${BASE}/api/health`), 200],
  ["root", new Request(`${BASE}/`), 200],
  ["unknown path", new Request(`${BASE}/nope`), 404],
  ["wrong method", new Request(`${BASE}/api/checkout`), 405],
];

for (const [name, request, status] of CASES) {
  test(`security headers on ${name}`, async () => {
    const response = await worker.fetch(request, makeEnv());
    assert.equal(response.status, status);
    assertSecure(name, response);
  });
}

test("preflight keeps CORS and gains security headers", async () => {
  const request = new Request(`${BASE}/api/checkout`, {
    method: "OPTIONS",
    headers: { origin: ORIGIN },
  });
  const response = await worker.fetch(request, makeEnv());
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), ORIGIN);
  assertSecure("preflight", response);
});

test("a rejected cross-origin preflight carries headers but no CORS grant", async () => {
  const request = new Request(`${BASE}/api/checkout`, {
    method: "OPTIONS",
    headers: { origin: "https://evil.example" },
  });
  const response = await worker.fetch(request, makeEnv());
  assert.equal(response.status, 403);
  assert.equal(response.headers.get("access-control-allow-origin"), null);
  assertSecure("rejected preflight", response);
});

test("error responses carry the headers too", async () => {
  const request = new Request(`${BASE}/api/checkout`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: ORIGIN },
    body: JSON.stringify({ productId: "sandbox-demo", name: "x", contact: "y" }),
  });
  const response = await worker.fetch(request, makeEnv({ DB: null }));
  assert.equal(response.status, 500);
  assertSecure("db_not_configured", response);
});

test("the callback redirect keeps its Location and gains the headers", async () => {
  const response = await worker.fetch(new Request(`${BASE}/api/callback`), makeEnv());
  assert.equal(response.status, 302);
  assert.match(response.headers.get("location"), /^https:\/\/sadeghvahidi\.ir\/shop\.html\?/);
  assertSecure("callback redirect", response);
});
