import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  findProduct,
  priceRial,
  priceToman,
  visibleProducts,
} from "../src/catalog.js";

test("the synced catalog matches shop/products.json", () => {
  const source = JSON.parse(
    fs.readFileSync(new URL("../../shop/products.json", import.meta.url), "utf8")
  );
  const copy = JSON.parse(fs.readFileSync(new URL("../src/products.json", import.meta.url), "utf8"));
  assert.deepEqual(copy, source, "run npm run sync before committing");
});

test("visible products are complete enough to render", () => {
  const items = visibleProducts();
  assert.ok(items.length >= 4);
  for (const item of items) {
    assert.match(item.id, /^[a-z0-9-]+$/);
    assert.ok(item.title.fa && item.title.en, `${item.id}: bilingual title`);
    assert.ok(item.summary.fa && item.summary.en, `${item.id}: bilingual summary`);
    assert.ok(item.duration.fa && item.duration.en, `${item.id}: bilingual duration`);
  }
});

test("hidden sandbox product never resolves outside the sandbox", () => {
  assert.equal(findProduct("sandbox-demo", { sandbox: false }), null);
  assert.ok(findProduct("sandbox-demo", { sandbox: true }));
});

test("unknown products resolve to null", () => {
  assert.equal(findProduct("does-not-exist", { sandbox: true }), null);
  assert.equal(findProduct(undefined, { sandbox: true }), null);
});

test("prices convert Toman to Rial and reject missing values", () => {
  assert.equal(priceRial({ priceToman: 250000 }), 2500000);
  assert.equal(priceToman({ priceToman: 250000 }), 250000);
  assert.equal(priceRial({ priceToman: null }), null);
  assert.equal(priceRial({ priceToman: 0 }), null);
  assert.equal(priceRial({ priceToman: 999 }), null);
  assert.equal(priceRial({ priceToman: 1500.5 }), null);
  assert.equal(priceRial(null), null);
});
