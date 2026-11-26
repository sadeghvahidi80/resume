-- Adds the first-party pageview counter to an existing database.
-- Safe to re-run: every statement is IF NOT EXISTS.
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
