-- Read the first-party counter with:
--   cd shop-worker
--   npx wrangler d1 execute sadeghvahidi-shop --remote --file=scripts/stats.sql
-- Times are Unix seconds; the window is computed at query time.

-- 1) Last 7 days: pageviews and distinct paths.
SELECT COUNT(*) AS pageviews, COUNT(DISTINCT path) AS paths
FROM pageviews
WHERE ts >= CAST(strftime('%s', 'now') AS INTEGER) - 7 * 86400;

-- 2) Last 7 days: top paths.
SELECT path, COUNT(*) AS views
FROM pageviews
WHERE ts >= CAST(strftime('%s', 'now') AS INTEGER) - 7 * 86400
GROUP BY path
ORDER BY views DESC
LIMIT 20;

-- 3) Last 30 days: referrers ("direct" and "internal" included on purpose).
SELECT referrer, COUNT(*) AS views
FROM pageviews
WHERE ts >= CAST(strftime('%s', 'now') AS INTEGER) - 30 * 86400
GROUP BY referrer
ORDER BY views DESC
LIMIT 20;

-- 4) Last 30 days: daily pageviews.
SELECT date(ts, 'unixepoch') AS day, COUNT(*) AS views
FROM pageviews
WHERE ts >= CAST(strftime('%s', 'now') AS INTEGER) - 30 * 86400
GROUP BY day
ORDER BY day;

-- 5) Last 30 days: country and device mix.
SELECT country, device, COUNT(*) AS views
FROM pageviews
WHERE ts >= CAST(strftime('%s', 'now') AS INTEGER) - 30 * 86400
GROUP BY country, device
ORDER BY views DESC
LIMIT 20;
