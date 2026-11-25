import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { visibleProducts } from "../src/catalog.js";

const html = fs.readFileSync(new URL("../../shop.html", import.meta.url), "utf8");

const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

function faNumber(value) {
  return Number(value)
    .toLocaleString("en-US")
    .replace(/\d/g, (digit) => FA_DIGITS[Number(digit)])
    .replace(/,/g, "٬");
}

function cardsFor(id) {
  const pattern = new RegExp(
    '<article class="case-card shop-card" data-product="' + id + '">([\\s\\S]*?)</article>',
    "g"
  );
  return Array.from(html.matchAll(pattern), (match) => match[1]);
}

test("every visible product has a published Toman price", () => {
  for (const product of visibleProducts()) {
    assert.ok(
      Number.isInteger(product.priceToman) && product.priceToman >= 1000,
      `${product.id}: priceToman must be a positive integer`
    );
    assert.equal(product.priceFrom, false, `${product.id}: fixed price, not a range`);
  }
});

test("shop.html shows the same price as the catalog, in both languages", () => {
  for (const product of visibleProducts()) {
    const cards = cardsFor(product.id);
    assert.equal(cards.length, 2, `${product.id}: one card per language`);
    for (const card of cards) {
      const match = card.match(/data-price-toman="(\d+)"/);
      assert.ok(match, `${product.id}: data-price-toman is present`);
      assert.equal(Number(match[1]), product.priceToman, `${product.id}: price matches catalog`);
      assert.ok(!/data-buy="[^"]+" hidden/.test(card), `${product.id}: buy button is visible`);
      assert.ok(!card.includes("قیمت توافقی"), `${product.id}: no placeholder price left`);
      assert.ok(!card.includes("By agreement"), `${product.id}: no placeholder price left (en)`);
    }
  }
});

test("the published tariff lists every visible product with its amount", () => {
  const tables = html.match(/<table class="shop-tariff">[\s\S]*?<\/table>/g) || [];
  assert.equal(tables.length, 2, "one tariff table per language");

  for (const product of visibleProducts()) {
    const rows = tables[0].match(/<tr>/g) || [];
    assert.ok(rows.length === visibleProducts().length + 1, "header plus one row per product");
    const english = product.priceToman.toLocaleString("en-US");
    assert.ok(tables[0].includes(faNumber(String(product.priceToman))), `${product.id}: fa amount`);
    assert.ok(tables[1].includes(english), `${product.id}: en amount`);
  }
});
