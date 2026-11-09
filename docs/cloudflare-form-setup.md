# راه‌اندازی فرم تماس (Worker → تلگرام) — حدود ۱۰ دقیقه

> این راهنما برای **شما (صاحب سایت)** است. عامل فقط کد را داده؛ سه قدم اول را شما انجام می‌دهید.
> کد Worker در ریپو: [`workers/contact-form/worker.js`](https://github.com/sadeghvahidi80/resume/blob/main/workers/contact-form/worker.js)

## ۱) ساخت BotFather و گرفتن توکن (~۲ دقیقه)

1. در تلگرام، به [@BotFather](https://t.me/BotFather) پیام بدهید.
2. دستور `/newbot` را بفرستید → یک **نام نمایشی** بدهید (مثلاً `Sadegh Vahidi Contact`) و یک **username** که به `bot` ختم شود (مثلاً `sadegh_site_bot`).
3. BotFather یک **توکن** شبیه `1234567890:AA...xyz` می‌دهد — کپی و در جای امن ذخیره کنید (= `TG_TOKEN`).

## ۲) گرفتن `TG_CHAT_ID` (~۳ دقیقه)

1. در تلگرام بات تازه را باز کنید، **Start** بزنید و یک پیام دلخواه (مثلاً `سلام`) بفرستید.
2. در مرورگر آدرس زیر را باز کنید (توکن خودتان را جایگزین کنید):

   ```
   https://api.telegram.org/bot<TOKEN>/getUpdates
   ```

3. در JSON برگشتی، `"chat":{"id": ۱۲۳۴۵۶۷۸۹, ...}` را پیدا کنید — آن عدد = `TG_CHAT_ID`.
   (اگر خالی بود یک پیام دیگر به بات بفرستید و صفحه را دوباره باز کنید.)

## ۳) ساخت Worker در Cloudflare (~۵ دقیقه)

1. وارد [dash.cloudflare.com](https://dash.cloudflare.com) شوید.
2. **Workers & Pages → Create application → Worker** → نام: `contact-form` → **Deploy**.
3. **Edit code** → کل محتوای `workers/contact-form/worker.js` را paste کنید → **Deploy**.
4. در صفحه Worker → **Settings → Variables and Secrets → Add**:
   - نوع **Secret**، نام `TG_TOKEN`، مقدار توکن BotFather
   - نوع **Secret**، نام `TG_CHAT_ID`، مقدار عدد chat id
5. صفحه Worker را رفرش کنید — endpoint چیزی شبیه این است:

   ```
   https://contact-form.<YOUR-SUBDOMAIN>.workers.dev
   ```

یادداشت‌ها:
- secretها فقط از دش ست می‌شوند؛ نیازی به `wrangler` نیست.
- دامنه مجاز در کد فقط `https://sadeghvahidi.ir` است (CORS بسته).
- هزینه در حجم فعلی صفر است (حد free کلاودفلیر).

## ۴) تست مستقیم endpoint

در PowerShell:

```powershell
curl.exe -s -X POST <YOUR-ENDPOINT-URL> -H "content-type: application/json" -d '{"name":"تست سایت","contact":"@you","type":"سیستم‌سازی","message":"پیام تستی","open_ts":"0","lang":"fa","page":"https://sadeghvahidi.ir/"}'
```

**انتظار:** خروجی `OK` + رسیدن همین پیام به تلگرام شخصی شما.

## ۵) وصل کردن endpoint به سایت (توسط عامل)

.endpoint را در `contact.html` (`window.CONTACT_CONFIG.endpoint`) ست می‌کنیم، commit + push و بعد تست **E2E زنده**: فرم خود سایت را پر می‌کنیم و پیام باید به تلگرام شما برسد.

---

**وقتی مراحل ۱–۳ تمام شد، این را به عامل بدهید: URL کامل endpoint (`https://contact-form.<YOUR-SUBDOMAIN>.workers.dev`).**
