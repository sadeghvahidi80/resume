# sadeghvahidi.ir — public release package

نسخه استاتیک وب‌سایت شخصی صادق وحیدی؛ مناسب GitHub Pages، Cloudflare Pages و Netlify.

- راهنمای انتشار: `DEPLOY.md`
- گزارش کنترل کیفیت: `QA-REPORT.md`
- مجله منتشر شده است: دو مقاله در `magazine/` قرار دارد، هر دو ایندکس‌شده و در `sitemap.xml` هستند.
- فروشگاه سرویس‌ها: صفحهٔ استاتیک `shop.html` (تعرفه‌ها بدون جاوااسکریپت خوانده می‌شوند) و بک‌اند `shop-worker/` روی Cloudflare Workers + D1 + زرین‌پال. فهرست قیمت‌ها تنها منبع حقیقت `shop/products.json` است و با `npm run sync` به ورکر کپی می‌شود.
- پنل مدیریت و فایل‌های خصوصی در خروجی عمومی قرار ندارند.
