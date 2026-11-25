import catalog from "./products.json" with { type: "json" };

export const CATALOG_VERSION = catalog.version;
export const CURRENCY = catalog.currency || "IRT";

/** Products safe to show on the public page. */
export function visibleProducts() {
  return catalog.products.filter((item) => item.visible && !item.sandboxOnly);
}

/**
 * Resolve a product by id.
 * Hidden and sandbox-only products are reachable only when the sandbox is on,
 * so a test product can never be charged for in production.
 */
export function findProduct(id, options = {}) {
  const sandbox = Boolean(options.sandbox);
  const product = catalog.products.find((item) => item.id === id);
  if (!product) return null;
  if (product.sandboxOnly && !sandbox) return null;
  if (!product.visible && !sandbox) return null;
  return product;
}

/**
 * ZarinPal accepts Rial. The catalog stores Toman.
 * Returns null when the product has no real price yet.
 */
export function priceRial(product) {
  if (!product) return null;
  const toman = product.priceToman;
  if (!Number.isInteger(toman) || toman < 1000) return null;
  return toman * 10;
}

export function priceToman(product) {
  const rial = priceRial(product);
  return rial === null ? null : rial / 10;
}
