-- Orders created before a ZarinPal payment is requested.
-- amount_rial is always computed server-side from shop/products.json.
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  amount_rial INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  authority TEXT,
  ref_id TEXT,
  name TEXT NOT NULL,
  contact TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  locale TEXT NOT NULL DEFAULT 'fa',
  created_at TEXT NOT NULL,
  paid_at TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_authority ON orders (authority);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at);

-- Cookieless, first-party pageview counter. No IP and no user agent are stored:
-- ts is Unix seconds, referrer holds only a host name (or "direct"/"internal").
CREATE TABLE IF NOT EXISTS pageviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  path TEXT NOT NULL,
  referrer TEXT NOT NULL DEFAULT 'direct',
  country TEXT NOT NULL DEFAULT '',
  device TEXT NOT NULL DEFAULT 'desktop',
  lang TEXT NOT NULL DEFAULT 'other',
  viewport INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_pageviews_ts ON pageviews (ts);
CREATE INDEX IF NOT EXISTS idx_pageviews_path ON pageviews (path);
