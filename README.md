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

CSP هم از همین قاعده می‌آید: `default-src 'none'` با اجازهٔ صریح برای اسکریپت‌های خودی، استایل درون‌خطی، تصویر مهر اینماد، فونت خودی و مقاصد شبکه (`pay.`، Formspree و endpoint آمار کلادفلر). برای آنالیتیکس دو هاست حداقلی اضافه شده‌اند: `static.cloudflareinsights.com` فقط در `script-src` و `cloudflareinsights.com` فقط در `connect-src`. مسیر `demos/` عمداً مستثناست چون دموها اسکریپت درون‌خطی خودشان را دارند؛ همین استثنا هم در گیت زنده بررسی می‌شود.

ایمیل: SPF و MX روی Cloudflare Email Routing هستند و `_dmarc` با `p=none` و `rua=mailto:contact@sadeghvahidi.ir` منتشر شده است — فقط پایش، بدون ریسک رد شدن ایمیل.

## آمار بازدید

دو لایهٔ مستقل، هر دو بدون کوکی و بدون شناسهٔ شخصی:

| لایه | چه می‌دهد | کجا |
|---|---|---|
| Cloudflare Web Analytics | بازدید، مسیر، ارجاع‌دهنده، کشور، مرورگر و Core Web Vitals | داشبورد Cloudflare → Analytics → Web Analytics |
| شمارندهٔ شخصی | هر pageview خام: مسیر، هاست ارجاع‌دهنده، کشور، دستگاه، زبان، عرض دید | جدول `pageviews` در D1 |

اسکریپت شمارنده `assets/analytics.js` است و در همهٔ صفحات سایت (به‌جز `demos/`) بار می‌شود. اگر `Do-Not-Track` یا `Global Privacy Control` روشن باشد چیزی ارسال نمی‌کند. ورکر هیچ IP و هیچ User-Agent ذخیره نمی‌کند؛ فقط مسیر، هاست ارجاع‌دهنده، کشور کلادفلر، کلاس دستگاه (موبایل/دسکتاپ)، زبان صفحه و عرض دید. نرخ درخواست هر IP به ۴۰ در دقیقه محدود است و ربات‌های شناخته‌شده بی‌صدا نادیده گرفته می‌شوند.

خواندن آمار:

```powershell
cd shop-worker
npx wrangler d1 execute sadeghvahidi-shop --remote --file=scripts/stats.sql
```

مهاجرت جدول روی دیتابیس موجود (یک‌بار، idempotent):

```powershell
npx wrangler d1 execute sadeghvahidi-shop --remote --file=migrations/0002_pageviews.sql
```

پاک‌سازی اختیاری ردیف‌های قدیمی:

```sql
DELETE FROM pageviews WHERE ts < CAST(strftime('%s','now') AS INTEGER) - 400 * 86400;
```
