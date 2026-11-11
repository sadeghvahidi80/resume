# سند اصلاحات متحد — بازبینی دوستانهٔ ۱۱ نوامبر ۲۰۲۶ (دوره ۱ و ۲)

> منبع اعمال: `review_fix.py` (۴۷ جایگزینی اثبات‌شده با تعداد + ۲ درج + sitemap)
> راستی‌آزمایی: `run_checks.py` → **10/10 PASS**؛ `PASS1` (count assertions) و `PASS4` (post-conditions) هر دو سبز.
> قرارداد صداقت: هر متن جایگزین از منبع معتبر (متن زندهٔ مقاله، تاریخ تقویمی، یا واقعیت قابل‌تأیید داخلی) استخراج شده؛ هیچ عدد/تاریخ جدیدی اختراع نشده است.

## ۱. راهنمای شماره‌گذاری

- **دوره ۱** = گزارش اول دوست، `C01–C20` (بازیابی‌شده از `verify_review.py`).
- **دوره ۲** = گزارش دوم دوست، `C01–C34` (بازیابی‌شده از `verify_new.py`).
- ستون «شماره» هر دو طرح را کنار هم می‌آورد؛ جایی که نگاشت قطعی نیست «—» خورده است.

## ۲. اصلاحات اعمال‌شده (فاز ۱ — ۲۰۲۶-۱۱-۱۱)

| شماره (دوره ۲ / دوره ۱) | فایل | متن قبل | متن بعد | معیار پذیرش |
|---|---|---|---|---|
| C01 / C13 | projects.html | «پنج کار شاخص»، «پنج پروژهٔ شاخص»، «۵ پروژهٔ شاخص»×۶، «Five flagship projects»×۳ + ۲ مورد EN دیگر | «شش …» / «۶ …» / «Six …» در همهٔ ۱۳ مورد | `projects.html`: شمارندهٔ پنج/Five == 0 و شش/Six == 13؛ تعداد case-detail زبان فارسی == ۶ |
| C03+C06 / — | index.html (fa) | `<div class="evi-label">سامانه فعال: ماتن · سبزوار · پلتفرم فروشگاهی</div>` | `محصول و سامانه توسعه‌یافته در حوزه سیستم‌سازی و توسعه دیجیتال` | ادعای «۳ سامانه فعال»ِ قابل‌شناسایی حذف شد؛ evi-card بدون ادعای نام‌محصول |
| C03+C06 / — | index.html (en) | `Live systems: MATEN · Sabzevar · e-commerce platform` | `Products and systems developed in systems-building and digital development` | هم‌ارز EN؛ `Live systems` == 0 |
| C04 / C16 | projects.html + resume/fa | «نیاز به پرداختن به موضوع **جمع‌سپاری**…» + «گزارش جمع‌سپاری با تکیه بر نمونه‌های ملموس (مادام مرگ، ساخت ایران)» | «نیاز به پرداختن به **مسئله عاملیت و احساس بی‌اثری**…» + «تحلیل مسئله عاملیت اجتماعی با تکیه بر نمونه‌های تاریخی و چارچوب نظری مشخص» | `جمع‌سپاری` == 0 در هر دو فایل؛ متن با مقالهٔ زندهٔ ensafnews.com/647785 (یادداشت «مسئله عاملیت…»، ۲۶ خرداد ۱۴۰۵) منطبق است — نه مصاحبه، نه جمع‌سپاری |
| C04 / C16 | projects.html + resume/fa | «پژوهش موضوعی، **مصاحبه** و تنظیم روایت.» | «پژوهش موضوعی و تنظیم روایت.» | مقاله مصاحبه‌ای نبود؛ `مصاحبه` در بلوک انصاف == 0 |
| C04 / C16 | projects.html | `The topic of crowdsourcing needed…` / `A crowdsourcing report built on concrete cases (Mamargh, Sakht-e Iran).` / `Topic research, interviews, narrative editing.` | `The problem of social agency needed…` / `An analysis of social agency with historical examples and a defined theoretical framework.` / `Topic research and narrative editing.` | `crowdsourc` == 0 در projects.html |
| C05 / C01 | resume/fa + resume/en (×2 هر کدام) | «پلتفرمی در حال توسعه برای ساده‌تر شدن ثبت…» / `A platform in development to simplify…` | «نسخهٔ عملیاتی سامانه در حال استفاده است و توسعه نسخهٔ جامع‌تر… ادامه دارد.» / `An operational version of the system is in use, while development of a more comprehensive version… continues.` | تضاد «فعال در عملیات» vs «در حال توسعه» رفع شد؛ هر دو زبان یک روایت |
| C08 / C02 | resume/fa | `<span class="proj-upd-date">آخرین به‌روزرسانی: [در انتظار تاریخ]</span>` ×3 | (حذف کامل) | `[در انتظار تاریخ]` == 0 — گیت `check_task10` به ×0 به‌روزرسانی شد |
| C08 / C02 | resume/en | `Current status: update pending.` ×6 | `Current status: In development — active.` ×6 | `update pending` == 0؛ با متن وضعیت فارسی («در حال توسعه — فعال») هم‌ارز |
| C10 / C11 | resume/en | `<strong>Esel</strong>` + `<h3>Esel</h3>` | `<strong>Ecell</strong>` + `<h3>Ecell</h3>` | `Esel` == 0 در resume/en (اسپلینگ نام برند داخلی Ecell) |
| C10 / — | about.html | `Eisell` ×2 | `Ecell` ×2 | `Eisell` == 0 — غلط املایی رایجِ همان برند |
| C11 / — | resume/en | `B.A. in Financial Management` ×2 | `BSc in Financial Management` ×2 | `B.A.` == 0 — **⚠ نیازمند تأیید نهایی کاربر: BSc vs B.A.** |
| C12 / C09 | resume/en | `01 Jun 2026` ×2 | `16 Jun 2026` ×2 | `01 Jun 2026` == 0 — ۲۶ خرداد ۱۴۰۵ = ۱۶ ژوئن ۲۰۲۶ (تقویم دقیق)، نه اول ژوئن |
| C13+C15 / C10 | resume/fa + resume/en | «گواهینامه‌ها»×۳ / `Certifications`×۳ | «دوره‌ها و آموزش‌ها»×۳ / `Courses &amp; Training`×۳ | محتوا آموزشی است نه گواهینامهٔ رسمی؛ هر دو زبان هم‌نام |
| C14 / — | index.html (fa+en) | «نتایج قابل اندازه‌گیری» / `Measurable results` | «خروجی‌ها و **شواهد عملکرد**» / `Outputs &amp; performance evidence` | عنوان بخش با محتوای واقعی (شواهد، نه ارقام سنجیده) هم‌خوان شد |
| C16 / C05 | resume/fa (hero-eye) | «مدیر پروژه‌های دیجیتال، **پژوهشگر بازار** و سیستم‌ساز عملیاتی» | «مدیر پروژه‌های دیجیتال و طراح سیستم‌های عملیاتی» | حذف «پژوهشگر بازار» از جایگاه‌سازی صفحه (یکی از دو ادعای نام‌بردارِ بازار) |
| C16 / C05 | resume/en (hero-eye + p-eyebrow) | `Digital project manager, market researcher and operational systems designer` ×2 | `Digital project manager and operational systems designer` ×2 | هم‌ارز EN در هر دو نسخه (صفحه + چاپ) |
| C16 / C05 | about.html (fa+en intro) | «مدیر پروژه‌های دیجیتال، پژوهشگر بازار و سیستم‌ساز عملیاتی…» / `…market researcher, and operational systems designer…` | نسخهٔ بدون «پژوهشگر بازار» | about فقط با C10 (Ecell) و C16 (مقدمه) تغییر کرد — طبق دامنهٔ مجاز |
| C19 / C19 | resume/fa | `>پژوهش‌های تخصصی</div>` ×4 (div) | `>نمونه: پژوهش بازاریابی فرش ایرانی</div>` ×4 | برچسب عمومی/تکراری با نمونهٔ مشخص جایگزین شد؛ دو نسخهٔ `<li>` عمداً باقی‌ماند |
| C19 / C19 | resume/en | `>specialist research</div>` ×4 | `>Sample: Iranian carpet-market study</div>` ×4 | هم‌ارز EN |
| C27 / C15 | resume/fa | (آیتم پژوهش «خروج تارابی» در بخش پژوهش‌ها غایب بود) | درج آیتم: «خروج تارابی با نظریه واکنش خواننده» — بهار ۱۴۰۲ — با همکاری محمد سنگ‌سفیدی | `بهار ۱۴۰۲`: 1→2؛ آیتم با نسخهٔ canonical پروژه (case-6) یکسان است |
| C27 / C15 | resume/en | (غایب) | `The exit of Tarabi through reader-response theory` — `Spring 2023 · With Mohammad Sang-Sefidi` | `Tarabi`: 0→2 (title+desc)؛ تاریخ بهار ۱۴۰۲ = Spring 2023 (تصمیم ثبت‌شده) |
| C29 / C18 | resume/fa + resume/en | «نمونه اثرگذاری — در پولکی» / `Impact example — Poolaki` | «نمونه بهبود فرآیند — در پولکی» / `Process improvement example — Poolaki` | ادعای «اثرگذاری» (کمّی) به «بهبود فرآیند» (کیفیِ قابل‌تأیید) محو شد |
| — / C03 | resume/fa + resume/en (×2 هر کدام) | «پیوند؛ پورتال جامع کاریابی **رایگان کشوری**» / `Peyvand: nationwide free job portal` | «پیوند؛ پلتفرم ارتباط کارجو و کارفرما» / `Peyvand: platform connecting job seekers and employers` | ادعای «رایگان کشوری» (قابل‌راستی‌آزمایی نبود) حذف شد |
| — / C04 | resume/en | `professional therapy` ×2 | `professional psychotherapy` ×2 | ترجمهٔ دقیقِ «روان‌درمانی حرفه‌ای» |
| — / — | index.html (fa) | `<h3>پلتفرم رزرو اتاق فرار EscapeZoom</h3>` | `<h3>محتوای سئوی EscapeZoom</h3>` | عنوان کارت با نقش واقعی (محتوا/سئو، نه پلتفرم رزرو) منطبق شد |
| — / — | index.html (en) | `<h3>EscapeZoom escape-room platform</h3>` | `<h3>EscapeZoom SEO content</h3>` | هم‌ارز EN |
| — / — | index.html (fa+en) | `مدرک:` ×3 | `شاهد:` ×3 | «مدرک» (degrees) برای شواهد کاری گمراه‌کننده بود؛ `مدرک` در home == 0 |
| — / — | projects.html | `(Dec 2023)` (جن‌زدگی EscapeZoom) | `(Mar 2024)` | ۱۴۰۲٫۱۲٫۲۱ = ۲۱ مارس ۲۰۲۴ (تبدیل تقویمی تأییدشده) |
| — / C07 | projects.html | `Co-founder &amp; operations lead (Founder &amp; CEO) with Mohammad Sangsfidi…` | `Founding and operations management (Founder &amp; CEO) alongside Mohammad Sangsfidi…` | رابطهٔ «هم‌بنیان‌گذار» که با «Founder &amp; CEO» داخل پرانتز تناقض داشت، به «همراهِ» ملایم شد — **⚠ تأیید نهایی عنوان بنیان‌گذار با کاربر است** |
| — / — | index.html (fa+en) | `<img alt="" aria-hidden="true" class="signature-img"` ×2 | alt فارسی/انگلیسی امضا (اولی fa، دومی en) | `alt=""` روی امضای صادق وحیدی == 0؛ دسترس‌پذیری تصویر امضا |
| — / — | sitemap.xml | ۵ URL با `2026-11-04`/`2026-11-10` | `/`، `/resume/fa/`، `/resume/en/`، `/about.html`، `/projects.html` → `<lastmod>2026-11-11</lastmod>` | ۱۵ `<url>` بدون magazine؛ `2026-11-10` (services.html) باقی‌ماند — گیت `check_about` |

## ۳. ادعاهای ردشده (با شاهد)

| ادعا | رأی | شاهد |
|---|---|---|
| منوی «به‌زودی» در صفحات هست | رد | `به‌زودی` == 0 در همهٔ صفحات root |
| sitemap قدیمی است (۲۰۲۶-۱۱-۰۴) | رد (بخشی) | قبلاً ۱۱-۱۰ به‌روز شده بود؛ فقط ۵ URL واقعاً stale بودند |
| `alt=""` در امضا وجود ندارد | رد | وجود داشت (ارتقا داده شد، نه ایجاد از صفر) |
| عنوان hero خانه فارسی «پژوهشگر بازار» دارد | رد | hero-eye خانه از قبل پاک بود؛ فقط resume/about اصلاح شد |
| مقالهٔ انصاف «مصاحبه»/«جمع‌سپاری» است | رد | متن زنده ensafnews.com/647785: یادداشت تحلیلی عاملیت (سلیگمن، گرامشی، سارتر)، بدون مصاحبه |
| EscapeZoom «جن‌زدگی دی ۲۰۲۳» | رد | ۱۴۰۲٫۱۲٫۲۱ = مارس ۲۰۲۴ |

## ۴. اقلام باز — تصمیم کاربر یا فاز بعد

**تصمیم کاربر (بلوکهای باز):**
1. **Ecell** — تأیید اسپلینگ نهایی برند + بازهٔ زمانی واقعی (الان Sep 2021 — Sep 2023 اعمال شده).
2. **BSc vs B.A.** — الان BSc اعمال شده؛ اگر B.A. درست است برگردانده شود.
3. **عنوان بنیان‌گذار** (Founder & CEO vs Co-founder) — متن EN ملایم شد، تأیید نهایی با کاربر.
4. **وضعیت تک‌تک محصولات «۳ سامانه فعال»** — متن میان‌روی موقت اعمال شد.
5. **مجله** — ۱–۲ مقاله یا حذف از منو.
6. **دو اسپلینگ Sangsfidi / Sang-Sefidi** — فقط پرچم، تغییر خاموش ممنوع.
7. **C28** — برچسب ۲۰۴ در مقابل ۲۲۴ مهارت.
8. **C30** — ماهیت پروژهٔ روان‌درمانی (روان‌درمانی واقعی؟).
9. **پژوهشگر بازار fa ×1 باقی‌مانده** (احتمالاً متا) — محل دقیق اعلام شود.
10. **Shara Ghasemi** — رضایت نام کارفرما.
11. **ایمیل دامنهٔ MX**، **DNS کلادفلر**، **قیمت‌گذاری**.

**فاز ۳ (تجاری):** services/contact/about بقیه، C17/C18-new/C19-new.
**فاز ۴ (کنترل):** C23/C24/C26/C32/C33/C34 + فهرست فنی دوستان (OG 800×800، meta keywords، hreflang، JSON-LD، Core Web Vitals، تست mailto، Google Fonts Great Vibes → کامیت جداگانه، tel: links).
**C02** — Master Portfolio Registry (تک‌منبع حقیقت) بعد از تأیید.
**C09** — Task 11 (آینهٔ سه‌لایهٔ EN).

## ۵. راستی‌آزمایی

```
PASS1 OK: 47 replacements, all counts match
signature alts set (fa first, en second)
fa Tarabi item inserted (بهار ۱۴۰۲: 1 -> 2)
en Tarabi item inserted (Tarabi: 0 -> 2)
sitemap: 5 changed pages -> 2026-11-11, 15 urls, 2026-11-10 retained
PASS4 OK: all post-conditions hold
WROTE 6 files.

run_checks.py: check_task10 / task2 / task3 / task5 / task8 / task9 /
footer / strip / about / seps → 10/10 PASS
```

باقی‌ماندهٔ اطلاع‌رسانی (عمدی، خارج از دامنهٔ فاز ۱): `پژوهشگر بازار` fa×1، `پژوهش‌های تخصصی` (دو نسخهٔ `<li>`)، `گواهینامه` about×1.
