// Copies the public catalog into the worker so the bundle has a single,
// verified source of truth. `npm test` re-runs this and compares the copies.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const source = path.resolve(here, "..", "..", "shop", "products.json");
const target = path.resolve(here, "..", "src", "products.json");

const raw = fs.readFileSync(source, "utf8");
JSON.parse(raw); // fail fast on invalid JSON
fs.writeFileSync(target, raw, "utf8");
console.log("catalog synced:", path.relative(process.cwd(), target));
