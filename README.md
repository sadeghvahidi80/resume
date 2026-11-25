# sadeghvahidi.ir — public release package

نسخه استاتیک وب‌سایت شخصی صادق وحیدی؛ مناسب GitHub Pages، Cloudflare Pages و Netlify.

- انتشار روی GitHub Pages با گردش‌کار `.github/workflows/site-qa.yml` انجام می‌شود؛ همان فایل فهرست گیت‌های کیفیت (HTML، لینک‌ها، axe، تست‌های ورکر، قرارداد زنده) است.
- مجله منتشر شده است: دو مقاله در `magazine/` قرار دارد، هر دو ایندکس‌شده و در `sitemap.xml` هستند.
- فروشگاه سرویس‌ها: صفحهٔ استاتیک `shop.html` (تعرفه‌ها بدون جاوااسکریپت خوانده می‌شوند) و بک‌اند `shop-worker/` روی Cloudflare Workers + D1 + زرین‌پال. فهرست قیمت‌ها تنها منبع حقیقت `shop/products.json` است و با `npm run sync` به ورکر کپی می‌شود.
- پنل مدیریت و فایل‌های خصوصی در خروجی عمومی قرار ندارند.

## امنیت لبه

هدرهای امنیتی از دو منبع می‌آیند و هر دو با یک گیت زنده در `qa/check_live_deploy.py` تأیید می‌شوند:

| دامنه | منبع |
|---|---|
| `sadeghvahidi.ir` و `www` | قاعدهٔ Response Header Transform در Cloudflare (خارج از این مخزن) |
| `pay.sadeghvahidi.ir` | `shop-worker/src/index.js` → `withSecurityHeaders` |

قاعدهٔ زون عمداً فقط روی همان دو هاست سایت اعمال می‌شود تا مقادیر سخت‌گیرانه‌تر ورکر (سیاست `DENY` و `no-referrer` و CSP) بازنویسی نشود. اگر قاعده حذف شود، کار `Live deploy` قرمز می‌شود.

ایمیل: SPF و MX روی Cloudflare Email Routing هستند و `_dmarc` با `p=none` و `rua=mailto:contact@sadeghvahidi.ir` منتشر شده است — فقط پایش، بدون ریسک رد شدن ایمیل.
