import assert from "node:assert/strict";
import test from "node:test";

import worker from "../src/index.js";
import { FakeDB } from "./fake-db.js";

const ORIGIN = "https://sadeghvahidi.ir";
const BASE = "https://pay.sadeghvahidi.ir";
const DESKTOP_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const MOBILE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

function makeEnv(overrides = {}) {
  return { DB: new FakeDB(), SITE_ORIGIN: ORIGIN, ZARINPAL_SANDBOX: "1", ...overrides };
}

function hitRequest(
  body,
  {
    origin = ORIGIN,
    ip = "10.2.0.1",
    ua = DESKTOP_UA,
    headers = {},
    method = "POST",
  } = {}
) {
  return new Request(`${BASE}/api/hit`, {
    method,
    headers: {
      "content-type": "text/plain",
      origin,
      "cf-connecting-ip": ip,
      "user-agent": ua,
      ...headers,
    },
    body: method === "POST" ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
  });
}

const VALID = {
  path: "/shop.html?lang=en#top",
  referrer: "https://www.google.com/search?q=consulting",
  lang: "fa",
  viewport: 1440,
};

test("records one hit, strips the query, and keeps only the referrer host", async () => {
  const env = makeEnv();
  const response = await worker.fetch(hitRequest(VALID), env);
  assert.equal(response.status, 204);
  assert.equal(env.DB.hits.length, 1);

  const row = env.DB.hits[0];
  assert.equal(row.path, "/shop.html");
  assert.equal(row.referrer, "www.google.com");
  assert.equal(row.device, "desktop");
  assert.equal(row.lang, "fa");
  assert.equal(row.viewport, 1440);
  assert.equal(typeof row.ts, "number");
  assert.ok(row.ts > 1_700_000_000, "ts must be Unix seconds");
});

test("same-site referrers are labelled internal", async () => {
  const env = makeEnv();
  const response = await worker.fetch(
    hitRequest({ ...VALID, referrer: "https://sadeghvahidi.ir/about.html" }, { ip: "10.2.0.2" }),
    env
  );
  assert.equal(response.status, 204);
  assert.equal(env.DB.hits[0].referrer, "internal");
});

test("missing or unparseable referrers become direct", async () => {
  for (const [index, referrer] of ["", "not a url", "javascript:alert(1)"].entries()) {
    const env = makeEnv();
    const response = await worker.fetch(
      hitRequest({ ...VALID, referrer }, { ip: `10.2.1.${index}` }),
      env
    );
    assert.equal(response.status, 204);
    assert.equal(env.DB.hits[0].referrer, "direct");
  }
});

test("mobile user agents are classified as mobile", async () => {
  const env = makeEnv();
  const response = await worker.fetch(hitRequest(VALID, { ip: "10.2.2.1", ua: MOBILE_UA }), env);
  assert.equal(response.status, 204);
  assert.equal(env.DB.hits[0].device, "mobile");
});

test("unknown languages collapse to other", async () => {
  const env = makeEnv();
  const response = await worker.fetch(hitRequest({ ...VALID, lang: "de" }, { ip: "10.2.2.2" }), env);
  assert.equal(response.status, 204);
  assert.equal(env.DB.hits[0].lang, "other");
});

test("a foreign origin is rejected and nothing is stored", async () => {
  const env = makeEnv();
  const response = await worker.fetch(
    hitRequest(VALID, { ip: "10.2.3.1", origin: "https://evil.example" }),
    env
  );
  assert.equal(response.status, 403);
  assert.equal(env.DB.hits.length, 0);
});

test("a missing origin is rejected and nothing is stored", async () => {
  const env = makeEnv();
  const request = new Request(`${BASE}/api/hit`, {
    method: "POST",
    headers: { "content-type": "text/plain", "cf-connecting-ip": "10.2.3.2", "user-agent": DESKTOP_UA },
    body: JSON.stringify(VALID),
  });
  const response = await worker.fetch(request, env);
  assert.equal(response.status, 403);
  assert.equal(env.DB.hits.length, 0);
});

test("crawlers get a quiet 204 without a stored row", async () => {
  const env = makeEnv();
  const response = await worker.fetch(
    hitRequest(VALID, { ip: "10.2.4.1", ua: "Mozilla/5.0 (compatible; Googlebot/2.1)" }),
    env
  );
  assert.equal(response.status, 204);
  assert.equal(env.DB.hits.length, 0);
});

test("bad JSON is a 400", async () => {
  const env = makeEnv();
  const response = await worker.fetch(hitRequest("{not json", { ip: "10.2.5.1" }), env);
  assert.equal(response.status, 400);
  assert.equal(env.DB.hits.length, 0);
});

test("oversized bodies are a 413", async () => {
  const env = makeEnv();
  const response = await worker.fetch(
    hitRequest(JSON.stringify({ ...VALID, pad: "x".repeat(5000) }), { ip: "10.2.5.2" }),
    env
  );
  assert.equal(response.status, 413);
  assert.equal(env.DB.hits.length, 0);
});

test("a path without a leading slash is a 400", async () => {
  const env = makeEnv();
  const response = await worker.fetch(hitRequest({ ...VALID, path: "shop.html" }, { ip: "10.2.5.3" }), env);
  assert.equal(response.status, 400);
  assert.equal(env.DB.hits.length, 0);
});

test("a missing DB is a 500", async () => {
  const env = makeEnv({ DB: null });
  const response = await worker.fetch(hitRequest(VALID, { ip: "10.2.5.4" }), env);
  assert.equal(response.status, 500);
});

test("GET is a 405", async () => {
  const env = makeEnv();
  const response = await worker.fetch(hitRequest(null, { ip: "10.2.6.1", method: "GET" }), env);
  assert.equal(response.status, 405);
});

test("preflight keeps CORS on the hit endpoint", async () => {
  const request = new Request(`${BASE}/api/hit`, {
    method: "OPTIONS",
    headers: { origin: ORIGIN },
  });
  const response = await worker.fetch(request, makeEnv());
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), ORIGIN);
});

test("the 204 carries the worker security headers", async () => {
  const response = await worker.fetch(hitRequest(VALID, { ip: "10.2.7.1" }), makeEnv());
  assert.equal(response.status, 204);
  assert.match(response.headers.get("content-security-policy") || "", /default-src 'none'/);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
});

test("the per-IP cap stops writes after the limit", async () => {
  const env = makeEnv();
  const ip = "10.2.8.1";
  for (let index = 0; index < 41; index += 1) {
    const response = await worker.fetch(
      hitRequest({ ...VALID, path: `/page-${index}.html` }, { ip }),
      env
    );
    assert.equal(response.status, 204);
  }
  assert.equal(env.DB.hits.length, 40);
});
