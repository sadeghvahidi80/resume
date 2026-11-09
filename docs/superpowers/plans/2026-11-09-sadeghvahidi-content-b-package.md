# بسته «ب» — بازنویسی محتوایی/استراتژیک sadeghvahidi.ir — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** تبدیل سایت از «رزومه آنلاین» به «وب‌سایت جذب مشتری» — جایگاه یک‌جمله‌ای، ۷ صفحه/نوبار فارسی، رزومه سه‌سطحی با ۵ پروژه شاخص، CTA + فرم Worker→تلگرام، سئوی ساختاری، مجله با هویت.

**Architecture:** سایت استاتیک موجود (HTML تک‌فایل دوزبانه با سوییچ درون‌صفحه‌ای `lang-fa/lang-en`، CSS مشترک `assets/style.css`، JS مشترک `assets/site.js`) — بدون فریمورک/بیلد. صفحات جدید همان الگو را دنبال می‌کنند. فرم تماس → Cloudflare Worker (فایل در `workers/contact-form/worker.js`) → Telegram Bot sendMessage، با fallback `mailto:`.

**Tech Stack:** Static HTML + vanilla JS + CSS · GitHub Pages (repo `sadeghvahidi80/resume`, branch `main`) · Cloudflare Worker + Telegram Bot API · pytest N/A — «تست» این پروژه = چک‌های ساختاری grep + راستی‌آزمایی Chrome DevTools در 360/390px. (pytest/N/A)

**Spec:** `docs/superpowers/specs/2026-11-09-sadeghvahidi-content-strategy-design.md` (مسافر با پلن — هر تسک به آن استناد می‌کند؛ facts پروژه‌های شاخص در بند ۶ spec است، اینجا تکرار نمی‌شود جز جایی که لازم است)

**Repo local clone:** `C:\Users\pro\AppData\Local\Temp\opencode\resume-site` (شاخه `main`) — همه دستورات با این workdir.

---

## Global Constraints

- فقط محتوای **fa + en** بازنویسی/ساخته می‌شود؛ ۷ زبان دیگر رزومه دست‌نخورده.
- قرارداد صداقت (spec §۱۰): جعل ممنوع؛ جای‌خالی مجاز فقط با همین نشان‌ها: `[در انتظار آمار]`، `[در انتظار مدرک]`، `[در انتظار تاریخ]` — فقط در اسلات‌های مصوب (شواهد، نتیجه case، تاریخ وضعیت) + معادل EN: `[Results pending]` / `[Evidence pending]` / `[Date pending]`.
- **یک H1** در هر صفحه منتشرشده (رفع دو-H1 فعلی رزومه fa وقتی ب۲ اجرا می‌شود).
- ترتیب نوبار ثابت ۷ آیتم: خانه • درباره • پروژه‌ها • خدمات • مجله • تماس • رزومه — در `lang-fa` برچسب‌ها فقط فارسی، در `lang-en` فقط انگلیسی (رفع نقد ۴.۱).
- آیتم‌های نوباری که صفحه‌شان هنوز ساخته نشده: لینک با `class="nav-soon" title="به‌زودی" aria-disabled="true"` و غیرقابل کلیک؛ در تسکِ ساخت صفحه فعال می‌شوند (حذف کلاس/خصلت) در **همه** ریشه‌صفحه‌ها.
- `/resume.html` هرگز ریدایرکت به خانه نمی‌شود؛ رفتار انتخاب‌گر حفظ.
- `magazine.html` تا انتشار اولین مقاله `noindex,follow` می‌ماند و به sitemap اضافه نمی‌شود.
- فیکس موبایل بسته الف (کامیت `b7ba59b`) بدون رگرسیون: منوی موبایل در 360/390 کل ویوپورت را می‌پوشاند؛ burger 44px؛ بدون هورفلو.
- هر تسک: کامیت conventional + push به `origin main`؛ تسک‌های release + چک Pages build (`gh api repos/sadeghvahidi80/resume/pages/builds/latest`).
- منبع حقیقت متن: spec §۳/§۵/§۶ + داده واقعی رزومه فعلی. هیچ عددی بدون منبع واقعی روی صفحه زنده نمی‌رود.
- زمان مرجع: Asia/Tehran. روزهای sitemap: `YYYY-MM-DD` همان روز اجرا.

## Shared Verification Protocol (همه تسک‌ها)

1. سرور محلی: `py -m http.server 8770` در ریشه repo (قبل شروع بیلد بالا بیا؛ در پایان kill کن — در پس‌زمینه shell، نه foreground).
2. چک ساختاری (بدون مرورگر): PowerShell `Select-String`/`[regex]` روی فایل — هر تسک دستور و خروجی موردانتظار دقیق دارد.
3. چک مرورگر (chrome-devtools): هر صفحه `index.html`/صفحات جدید در دو پهنای 390 و 360، بروی `file://` یا `http://127.0.0.1:8770`:
   - `document.documentElement.scrollWidth <= document.documentElement.clientWidth` (بدون هورفلو)
   - کلیک `#langToggle` → محتوا عوض می‌شود و `location.pathname` تغییر نمی‌کند.
   - کلیک `#burger` در موبایل → `#navMobile` کلاس `open` می‌گیرد و کل صفحه را می‌پوشاند.
4. Release: `git push` → poll نه؛ فقط یک بار بعد از حداقل ۶۰ ثانیه `gh api repos/sadeghvahidi80/resume/pages/builds/latest --jq '.status,.error.message'` → `built"` و صفر eror → سپس verify زنده (fetch HTML زنده، چک عنوان/برچسب).

---

## File Structure (تصمیم تفکیک فایل‌ها)

| فایل | مسئولیت | تغییر |
|---|---|---|
| `index.html` | خانه دوزبانه (single-file, fa default) | بازنویسی کامل بدنه (Tasks 2–3) |
| `about.html` | درباره من — story + Person schema | **جدید** (Task 12) |
| `projects.html` | ۵ case شاخص + نمونه تخصصی + آرشیو | **جدید** (Tasks 8–9) |
| `services.html` | ۴ خدمت + حالت همکاری + CTA | **جدید** (Task 5) |
| `contact.html` | کانال‌ها + فرم (Worker→TG + mailto fallback) | بازنویسی (Task 6) |
| `magazine.html` | ۶ دسته + قالب مقاله + CTA | بازطراحی (Task 15) |
| `magazine/post-template.html` | قالب مقاله آماده (noindex) | **جدید** (Task 15) |
| `resume.html` | انتخاب‌گر زبان (7 آیتم نوباری) | nav-only (Task 1) |
| `resume/{fa,en}/index.html` | رزومه ۳سطحی fa/en | بازسازی (Tasks 10–11) |
| `workers/contact-form/worker.js` | Cloudflare Worker (TG relay) | **جدید** (Task 7) |
| `docs/cloudflare-form-setup.md` | راهنمای قدم‌به‌قدم BotFather+Worker | **جدید** (Task 7) |
| `assets/style.css` | قراردادهای مشترک: wordmark, nav-soon, case-card, cta, form | افزودن (Tasks 1, 5, 6, 8) |
| `sitemap.xml` · `robots.txt` | فهرست خزنده | Task 13 |
| `404.html` | nav update | Task 1 (اگر nav دارد) |

**Interfaces مشترک (همه تسک‌ها به این‌ها متصل هستند):**

- نوبار: `<nav id="nav">` با `.nav-logo > a.wordmark > span.lang-fa/span.lang-en`؛ لینک‌های زبان در `span.lang-fa` و `span.lang-en` (لیست همزمان دوزبانه).
- آیتم soon: `<a class="nav-soon" href="X.html" title="به‌زودی" aria-disabled="true">LABEL</a>` — activation = eliminar `nav-soon`/`aria-disabled`/`title` در تنظیم فعال‌سازی.
- CTA اصلی: `<a href="contact.html#form" class="btn-primary">درخواست بررسی پروژه</a>` — IDs فرم: `#contact-form`, `cf-name`, `cf-contact`, `cf-type`, `cf-message`, `cf-honeypot`, `cf-open-ts`; JS: `buildTelegramPayload()`, `sendToWorker()` در `<script>` انتهای contact.html.
- Worker config: `window.CONTACT_CONFIG = { endpoint: "" }` — خالی → fallback فقط.
- بلاک‌های محتوایی home IDs: `#hero`, `#problem`, `#capabilities`, `#flagships`, `#evidence`, `#contact`; EN معادل: `#en-hero`, `#en-problem`, …

---

### Task 1: نوبار فارسی + وردمارک شخصی (رفع نقد ۴.۱ و ۴.۳) — همه ریشه‌صفحه‌ها

**Files:**
- Modify: `index.html`, `contact.html`, `magazine.html`, `resume.html` (nav + nav-mobile), `404.html` (اگر nav دارد)
- Modify: `assets/style.css` (پس از بلوک `.nav-links a:hover`، خط ~37)

**Interfaces:**
- Produces: الگوی نوبار ۷آیتمی که تسک‌های 5/8/9/12 در همان الگو آیتم‌های soon را فعال می‌کنند؛ وردمارک متنی.

- [ ] **Step 1: چک فیل به‌عنوان مبنا (تست قرمز)**

```powershell
Select-String -Path index.html -Pattern 'lang-fa"><a href="index.html">Home</a>'
```
Expected: MATCH فعلی (برچسب انگلیسی در lang-fa = ایراد) — بعد از فیکس باید صفر باشد.

- [ ] **Step 2: افزودن CSS بعد از خط `.nav-links a:hover{color:var(--gold)}` در `assets/style.css`:**

```css
.nav-logo .wordmark{text-decoration:none;white-space:nowrap;color:var(--gold)}
.nav-logo .wordmark span{font-size:1.05rem;font-weight:500;letter-spacing:.02em;color:var(--gold)}
.nav-logo .wordmark .lang-fa{letter-spacing:0}
.nav-logo .wordmark .lang-en{letter-spacing:.09em;font-size:1rem}
.nav-soon{opacity:.4;cursor:not-allowed;pointer-events:none}
```

- [ ] **Step 3: در هر ۴ فایل، جایگزینی nav**: (a) بلاک `.nav-logo` را با (b) `img` حذف و وردمارک جایگزین:

```html
<div class="nav-logo"><a class="wordmark" href="index.html" aria-label="صادق وحیدی"><span class="lang-fa">صادق وحیدی</span><span class="lang-en">Sadegh Vahidi</span></a></div>
```

سپس داخل `.nav-links` و `.nav-mobile`، هر ۹ زبان `span.lang-fa` و `span.lang-en` را با نسخه ۷آیتمی جایگزین کن (aria-current صفحه خودش را حفظ کن):

```html
<span class="lang-fa">
<a href="index.html">خانه</a>
<a class="nav-soon" href="about.html" title="به‌زودی" aria-disabled="true">درباره</a>
<a class="nav-soon" href="projects.html" title="به‌زودی" aria-disabled="true">پروژه‌ها</a>
<a class="nav-soon" href="services.html" title="به‌زودی" aria-disabled="true">خدمات</a>
<a href="magazine.html">مجله</a>
<a href="contact.html">تماس</a>
<a href="/resume/fa/">رزومه</a>
</span>
```

```html
<span class="lang-en">
<a href="index.html">Home</a>
<a class="nav-soon" href="about.html" title="به‌زودی" aria-disabled="true">About</a>
<a class="nav-soon" href="projects.html" title="به‌زودی" aria-disabled="true">Projects</a>
<a class="nav-soon" href="services.html" title="به‌زودی" aria-disabled="true">Services</a>
<a href="magazine.html">Magazine</a>
<a href="contact.html">Contact</a>
<a href="/resume/en/">Resume</a>
</span>
```

(در resume.html آیتم رزومه `href="resume.html"` و `aria-current="page"` نگه داشته می‌شود.)

- [ ] **Step 4: چک ساختاری سبز**

```powershell
Select-String -Path index.html -Pattern 'lang-fa"><a href="index.html">Home</a>'; Select-String -Path index.html,contact.html,magazine.html,resume.html -Pattern 'nav-soon' | Measure-Object | Select-Object -ExpandProperty Count
```
Expected: اولِ خروجی = بدون نتیجه؛ دومی = ۱۶ خط matching (هر فایل ۴ خط: ۲ بلاک × ۲ زبان)؛ تعداد لینک‌های nav-soon = ۴۸ (هر فایل ۱۲: ۳ آیتم × ۲ زبان × ۲ بلاک).

- [ ] **Step 5: chrome-devtools (390 و 360):** نوبار فارسی/انگلیسی با toggle سواچ می‌شود؛ وردمارک در nav فشرده نمی‌شود؛ overflow صفر؛ burger باز/بسته سالم؛ کلیک آیتم‌های soon هیچ فاکت منفی ندارد (pointer-events none).

- [ ] **Step 6: Commit + Push**

```bash
git add index.html contact.html magazine.html resume.html assets/style.css
git commit -m "feat(nav): Persian-first bilingual nav (7 items), text wordmark, soon-state for new pages"
git push origin main
```

انتظار: Pages build بدون خطا؛ صفحه زنده checkbox بعدی.

---

### Task 2: خانه — Hero + «مسئله → روش کار» (ب۱ FA+EN)

**Files:**
- Modify: `index.html` (بلاک‌های `<section id="hero">` و `#about` → تبدیل به `#problem` balance fa؛ mirان `#en-hero`, `#en-about`→`#en-problem`)
- Modify: `assets/style.css` (الگوی `.step-row`)

**Interfaces:**
- Produces: CTA اصلی `<a href="contact.html#form" class="btn-primary">…` در hero (fa+en) — تسک‌های بعدی به همین مسیر لینک می‌دهند؛ بخش‌های جدید `#problem`/`#en-problem`.

- [ ] **Step 1: چک قرمز** — `Select-String -Path index.html -Pattern 'درخواست بررسی پروژه'` → 0 match (بعد از این تسک = ۴: fa hero+CTA نهایی، en hero+CTA).

- [ ] **Step 2: CSS `assets/style.css` (پیوست بعد `.hero-stats`):**

```css
.step-row{display:grid;grid-template-columns:repeat(3,1fr);gap:1.2rem;margin-top:2.2rem}
.step-card{border:1px solid rgba(200,164,74,.18);border-radius:var(--r);padding:1.4rem;background:rgba(255,255,255,.02)}
.step-num{font-size:.72rem;letter-spacing:.18em;color:var(--gold);margin-bottom:.7rem}
.step-title{font-size:1rem;color:var(--off-white);margin-bottom:.5rem}
.step-card p{font-size:.85rem;color:var(--muted);line-height:1.9}
.value-chips{display:grid;grid-template-columns:repeat(3,1fr);gap:.7rem;margin-top:1.6rem;list-style:none;padding:0}
.value-chips li{font-size:.82rem;color:var(--pale);border:1px solid rgba(200,164,74,.14);border-radius:var(--r-sm);padding:.6rem .8rem;text-align:center}
@media(max-width:760px){.value-chips{grid-template-columns:1fr}}
@media(max-width:760px){.step-row{grid-template-columns:1fr}}
.btn-primary{display:inline-block;padding:.9rem 1.6rem;border-radius:2px;background:var(--gold);color:#090909;font-weight:500;font-size:.95rem;text-decoration:none;letter-spacing:.03em;transition:transform var(--t),box-shadow var(--t)}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(200,164,74,.25)}
.btn-secondary{display:inline-block;padding:.9rem 1.6rem;border-radius:2px;border:1px solid rgba(200,164,74,.4);color:var(--gold);font-size:.95rem;text-decoration:none;letter-spacing:.03em}
.btn-row{display:flex;gap:1rem;flex-wrap:wrap}
```

- [ ] **Step 3: جایگزینی کامل `<section id="hero">` (fa):**

```html
<section id="hero">
<div aria-hidden="true" class="hero-bg">سیستم‌های عملیاتی</div>
<div class="hero-layout">
<div class="hero-portrait">
<div aria-hidden="true" class="hero-portrait-ring"></div>
<img alt="صادق وحیدی — مدیر پروژه دیجیتال و طراح سیستم‌های عملیاتی" decoding="async" fetchpriority="high" height="300" loading="eager" src="assets/resume-img-e499f4171516.webp" width="300"/>
</div>
<div class="hero-content">
<div class="hero-eye">مدیر پروژه دیجیتال · طراح سیستم‌های عملیاتی</div>
<h1 class="hero-h1">صادق <em>وحیدی</em></h1>
<p class="hero-sub">من به کسب‌وکارها کمک می‌کنم پروژه‌های دیجیتال و فرآیندهای پراکنده‌شان را به <strong>سیستم‌های عملیاتی قابل اندازه‌گیری و توسعه</strong> تبدیل کنند.</p>
<p class="btn-row">
<a class="btn-primary" href="contact.html#form">درخواست بررسی پروژه</a>
<a class="btn-secondary nav-soon" href="projects.html" title="به‌زودی" aria-disabled="true">پروژه‌های شاخص</a>
</p>
</div>
</div>
</section>
```

- [ ] **Step 4: جایگزینی کامل `<section id="about">` (fa) با `#problem`:**

```html
<section id="problem">
<div class="wrap">
<div class="sec-label">روش کار</div>
<h2 class="sec-title">اگر فرآیندها پراکنده است، <em>مشکل سیستم است</em> — نه افراد</h2>
<div class="sec-line"></div>
<p class="about-body">اطلاعات در چت‌ها و کاغذها گم می‌شود؛ پروژه‌ها بدون شاخص جلو می‌روند؛ وابستگی به فرد بالا می‌رود و کیفیت خروجی نوسان دارد. من این حلقه را می‌بندم: از تحلیل وضعیت، تا طراحی سیستم و اجرای کنار تیم شما.</p>
<div class="step-row">
<div class="step-card"><div class="step-num">۰۱</div><div class="step-title">تحلیل</div><p>شناخت وضعیت موجود: فرآیندها، داده‌ها، ابزارهای در حال استفاده و گلوگاه‌های واقعی عملیات.</p></div>
<div class="step-card"><div class="step-num">۰۲</div><div class="step-title">طراحی سیستم</div><p>استانداردسازی فرآیند، تعریف شاخص‌های اندازه‌گیری، انتخاب و پیکربندی ابزار.</p></div>
<div class="step-card"><div class="step-num">۰۳</div><div class="step-title">اجرای همراه</div><p>پیاده‌سازی کنار تیم، آموزش، پیگیری شاخص‌ها و بهبود مستمر تا سیستم خودش بایستد.</p></div>
</div>
<h3 class="value-h" style="font-size:1rem;color:var(--off-white);margin-top:1.8rem">نتیجه برای شما</h3>
<ul class="value-chips">
<li>کاهش اتلاف زمان در عملیات</li>
<li>استانداردسازی فرآیندها</li>
<li>پیگیری‌پذیری پروژه‌ها</li>
<li>کاهش وابستگی به افراد</li>
<li>بهبود کیفیت خروجی تیم</li>
<li>گردش‌کارهای قابل توسعه</li>
</ul>
</div>
</section>
```

- [ ] **Step 5: معادل EN** — `#en-hero` و `#en-about`→`#en-problem` با همان ساختار و متن انگلیسی:

```html
<section id="en-hero">…(hero-layout همان fa, h1: Sadegh <em>Vahidi</em>)…
<p class="hero-sub">I help businesses turn scattered digital projects and processes into <strong>measurable, scalable operational systems</strong>.</p>
<a class="btn-primary" href="contact.html#form">Request a project review</a>
<a class="btn-secondary nav-soon" href="projects.html" title="به‌زودی" aria-disabled="true">Flagship projects</a>…
```
```html
<section id="en-problem">… h2: "When processes are scattered, the <em>missing piece is a system</em> — not people" … 3 steps: Analysis / System design / Hands-on execution با معادل انگلیسیِ همان متن …
```
(متن کامل EN در فایل نوشته شود: sub-paragraph معادل + سه کارت «Analysis / System design / Hands-on execution» از spec §۵ + بخش «What you get» با ۶ value chip معادل: less wasted time · standardized processes · trackable projects · less person-dependency · steadier team output · extensible workflows.)

- [ ] **Step 6: چک سبز** — `Select-String -Path index.html -Pattern 'درخواست بررسی پروژه','Request a project review','id="problem"','id="en-problem"' | Measure-Object -Line` → ≥ 4 lines match; hero fa/en هر ۹ زبان H1 دارند (در DOM دو H1 — fa و en — مجاز است؛ در هر لحظه فقط یکی visible).
  نکته: کنترل نهایی H1 روی صفحه زنده در Task 13.

- [ ] **Step 7: chrome-devtools 390/360:** btn-row در fa/en زیر هم (flex-wrap)؛ متن hero بدون هورفلو؛ toggle سواچ.

- [ ] **Step 8: Commit** — `git commit -am "feat(home): position statement hero + problem-to-approach (fa/en)" && git push origin main`

---

### Task 3: خانه — Capabilities + Flagships + Evidence + CTA نهایی (ب۱)

**Files:**
- Modify: `index.html` (بخش‌های `#deliverables`→`#capabilities`, `#paths`→حذف/جایگزین با `#flagships`+`#evidence`؛ `#contact` محتوا کوتاه CTA)
- Modify: `assets/style.css` (`.cap-badge`، بازاستفاده `.case-grid`/`.proj`-like `.mini-case`)

**Interfaces:** Produces: `<section id="evidence">` با کلاس `evidence-grid`؛ CTA نهایی به `contact.html#form`.

- [ ] **Step 1: چک قرمز** — `Select-String -Path index.html -Pattern 'id="evidence"'` → 0.

- [ ] **Step 2: CSS:**

```css
.cap-badge{display:inline-block;font-size:.68rem;letter-spacing:.14em;color:var(--gold);border:1px solid rgba(200,164,74,.3);border-radius:var(--r-sm);padding:.2rem .6rem}
.evidence-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.2rem;margin-top:2rem}
.evi-card{border:1px solid rgba(200,164,74,.18);border-radius:var(--r);padding:1.4rem;text-align:center}
.evi-num{font-size:2rem;font-weight:300;color:var(--gold)}
.evi-label{font-size:.82rem;color:var(--muted);margin-top:.5rem;line-height:1.7}
@media(max-width:760px){.evidence-grid{grid-template-columns:1fr}}
```

- [ ] **Step 3: جایگزین `#deliverables` (fa) با `#capabilities` — ۴ کارت (ترتیب وزن ۴۰/۲۵/۲۰/۱۵، بدون توانمندی‌های اننغلو):**

```html
<section id="capabilities">
<div class="wrap">
<div class="sec-label">حوزه‌های تخصص</div>
<h2 class="sec-title">چه کاری در <em>جایگاه اصلی</em> انجام می‌دهم</h2>
<div class="sec-line"></div>
<div class="case-grid">
<div class="case-card"><span class="cap-badge">۴۰٪ — محور</span><h3>مدیریت پروژه و سیستم‌سازی</h3><p>برنامه‌ریزی، ساختار تیم، صف کار، کنترل کیفیت و شاخص‌های عملیاتی — از بریف تا تحویل.</p><p class="evi-label">مدرک: سامانه تعمیرات سبزوار · پلتفرم فروشگاه قطعات تویوتا</p></div>
<div class="case-card"><span class="cap-badge">۲۵٪</span><h3>پژوهش بازار و مدل کسب‌وکار</h3><p>پژوهش بازار و رقبا، تحلیل داده، مدل کسب‌وکار و چارچوب تصمیم‌گیری.</p><p class="evi-label">مدرک: پژوهش بازار خوراک دام خراسان (۴ افق زمانی)</p></div>
<div class="case-card"><span class="cap-badge">۲۰٪</span><h3>طراحی پلتفرم و مدیریت توسعه</h3><p>تعریف نیازمندی، معماری فرآیند و هماهنگی تیم توسعه برای سامانه‌ای که از روز اول استفاده‌پذیر باشد.</p><p class="evi-label">مدرک: founder گروه فناوری ماتن (پلتفرم فروشگاهی)</p></div>
<div class="case-card"><span class="cap-badge">۱۵٪ — پشتیبان</span><h3>نظام محتوا</h3><p>استاندارد تولید، بریف‌نویسی و کنترل کیفی محتوا به‌عنوان زیرساخت ارتباطی سیستم شما.</p><p class="evi-label">مدرک: ۳۰+ مقاله رونیکس · ۱۲+ مقاله پولکی</p></div>
</div>
</div>
</section>
```

- [ ] **Step 4: جایگزین `#paths` (fa) با دو بخش — `#flagships` (۳ teaser) + `#evidence`:**

```html
<section id="flagships">
<div class="wrap">
<div class="sec-label">کار منتخب</div>
<h2 class="sec-title">پروژه‌های <em>شاخص</em></h2>
<div class="sec-line"></div>
<div class="case-grid">
<div class="case-card"><h3>پلتفرم فروشگاه قطعات تویوتا</h3><p>از پژوهش بازار و رقبا تا تعریف نیازمندی و هماهنگی تیم توسعه — پلتفرم مستقل (بدون همکاری مستقیم با تویوتا).</p></div>
<div class="case-card"><h3>سامانه تعمیرات سبزوار</h3><p>سامانه درخواست و پیگیری تعمیر برای اتومبیل؛ تعریف نیازمندی و مدیریت فرآیند توسعه.</p></div>
<div class="case-card"><h3>فرآیند محتوای پولکی و رونیکس</h3><p>مدیریت تیم ۳–۴ نفره و طراحی فرآیند تحقیق تا انتشار: ۳۰+ مقاله رونیکس، ۱۲+ مقاله پولکی.</p></div>
</div>
<p><a class="btn-secondary nav-soon" href="projects.html" title="به‌زودی" aria-disabled="true">همه پروژه‌ها و مطالعات موردی</a></p>
</div>
</section>
<section id="evidence" style="background:var(--charcoal)">
<div class="wrap">
<div class="sec-label">شواهد و اعداد</div>
<h2 class="sec-title">نتایج قابل <em>اندازه‌گیری</em></h2>
<div class="sec-line"></div>
<div class="evidence-grid">
<div class="evi-card"><div class="evi-num">۳۰+</div><div class="evi-label">مقاله تخصصی ابزارآلات (رونیکس) منتشرشده</div></div>
<div class="evi-card"><div class="evi-num">۱۲+</div><div class="evi-label">مقاله حسابداری و مالی (پولکی) با مالکیت فرآیند انتشار</div></div>
<div class="evi-card"><div class="evi-num">۵+</div><div class="evi-label">عنوان کتاب با نقش تولید، ویراستاری و کنترل کیفیت</div></div>
<div class="evi-card"><div class="evi-num">۴۰٪</div><div class="evi-label">نظم و کاهش اتلاف زمان عملیات [در انتظار آمار]</div></div>
<div class="evi-card"><div class="evi-num">۳</div><div class="evi-label">سامانه فعال: ماتن · سبزوار · پلتفرم فروشگاهی</div></div>
<div class="evi-card"><div class="evi-num">۴</div><div class="evi-label">افق زمانی تحلیل‌شده در پژوهش بازار خوراک دام</div></div>
</div>
</div>
</section>
```

- [ ] **Step 5: `#contact` (fa) کوتاه به CTA مستقیم:**

```html
<section id="contact">
<div class="wrap" style="text-align:center">
<div class="sec-label">گام بعدی</div>
<h2 class="contact-h">بیایید وضعیت فعلی و ایده سیستم را <em>گفتگو</em> کنیم</h2>
<p class="about-body">یک بازبینی اولیه از پروژه یا فرآیند شما — بدون تعهد.</p>
<p><a class="btn-primary" href="contact.html#form">درخواست بررسی پروژه</a></p>
</div>
</section>
```

- [ ] **Step 6: معادل EN برای `#en-capabilities`، `#en-flagships`، `#en-evidence`، `#en-contact`** — همان ساختار با ترجمه: Core capabilities / Flagship projects / Measurable results / Let's talk. اعداد یکسان — واقعیتها همان فارسی: 30+ poolaki/Ronix و «Request a project review» و «All case studies» (لینک soon).

- [ ] **Step 7: چک سبز** — `Select-String -Path index.html -Pattern 'id="evidence"','id="en-evidence"','nav-soon' | Measure-Object -Line` → ≥ 4؛ `[در انتظار آمار]` فقط ۱ بار در هر زبان (.fa + en برابر). `Select-String -Path index.html -Pattern 'در انتظار'|Measure-Object` → 1.

- [ ] **Step 8: chrome-devtools 390/360** — gridها به یک ستون فروری jezند؛ hexagon opacity کارت‌ها؛ toggle سواچ؛ overflow صفر.

- [ ] **Step 9: Commit + Push** — `git commit -am "feat(home): capabilities 40/25/20/15, flagship teasers, honest evidence grid (fa/en)" && git push origin main` — Release ب۱ کامل → چک Pages + verify زنده (عنوان، hero، nav fa).

---

### Task 4: RELEASE ب۱ — راستی‌آزمایی زنده + فوتر ماتن + گزارش تغییرات

**Files:**
- Modify: `index.html`, `contact.html`, `magazine.html` (فوتر)
- بدون تغییر کد (بیشتر verify)

**Interfaces:** Produces: فوتر خط «مؤسس گروه فناوری MATEN» / "Founder, MATEN Technology Group" — الگو برای پایین‌همه صفحات جدید.

- [ ] **Step 1: فوتر fa/en** در پایین هر ۳ صفحه (قبل `</body>`) — اگر فوتر موجود است، یک خط append؛ else بلاک:

```html
<footer style="text-align:center;padding:2rem 0;color:var(--mid);font-size:.8rem;letter-spacing:.05em">
<span class="lang-fa">صادق وحیدی — مؤسس گروه فناوری MATEN</span>
<span class="lang-en">Sadegh Vahidi — Founder, MATEN Technology Group</span>
</footer>
```

- [ ] **Step 2: push + Pages check** — `gh api repos/sadeghvahidi80/resume/pages/builds/latest --jq '.status'` → `"built"`؛ سپس `curl.exe -s https://sadeghvahidi.ir/ | Select-String -Pattern 'درخواست بررسی پروژه' -Encoding utf8` → match.
- [ ] **Step 3: زنده موبایل drill** — chrome-devtools روی `https://sadeghvahidi.ir/` در 360: hero بدون هورفلو، نوبار فا، burger، lang toggle؛ کنسول صفر خطا.
- [ ] **Step 4: Commit** — `git commit -am "feat(footer): personal brand + MATEN founder line (fa/en)" && git push origin main`
- [ ] **Step 5: گزارش تغییرات بسته ب۱** (controlled-execution template) — به کاربر تحویل، شامل ۳ فاز باقی‌مانده و وابستگی فرم (ب۳).

---

### Task 5: services.html — ۴ خدمت + حالت همکاری + CTA (ب۳-1)

**Files:**
- Create: `services.html` (الگوی کامل از contact/magazine: head data-default-locale, canonical, og, nav ۷آیتمی از Task 1, footer از Task 4)
- Modify: ۴ ریشه‌صفحه (فعال‌سازی نوبار «خدمات»: حذف `nav-soon`/`aria-disabled`/`title` از لینک services)

**Interfaces:** Produces: page URL `/services.html`؛ CTA مؤخر به `contact.html#channel` (channel: بلاک تماس صفحه تماس؛ ID در Task 6 قفل می‌شود).

- [ ] **Step 1: چک قرمز** — `Test-Path services.html` → False.

- [ ] **Step 2: ساخت صفحه** — head: `<title data-fa="خدمات مدیریت پروژه و سیستم‌سازی — صادق وحیدی" data-en="Digital PM & operational systems services — Sadegh Vahidi">`; description انطباق؛ `<link rel="canonical" href="https://sadeghvahidi.ir/services.html">`; nav کامل Task 1 با langToggle؛ footer.

بدنه fa (`lang-fa` wrapper) — sec-label «همکاری»، H1 `«services-h»: خدمات و <em>همکاری</em>`، سپس ۴ service block:

1. **مدیریت پروژه‌های دیجیتال** — توضیح: برنامه‌ریزی، اجرا و کنترل از تحلیل تا تحویل؛ ساختار تیم و صف کار؛ گزارش‌دهی دوره‌ای. «تحویل می‌گیرید»: نقشه راه پروژه · ساختار اجرا · گزارش پیشرفت ماهانه. حالت: پروژه‌ای (۳–۶ ماه) / ماهانه.
2. **طراحی و مستندسازی سیستم عملیاتی** — توضیح: استانداردسازی فرآیند، SOP، شاخص؛ رفع وابستگی به فرد. «تحویل می‌گیرید»: دیاگرام فرآیند · SOP مستند · داشبورد شاخص. حالت: مشاوره‌ای.
3. **پژوهش بازار و مدل کسب‌وکار** — تحلیل رقبا و بازار با افق چندساله. «تحویل می‌گیرید»: گزارش پژوهش · تحلیل رقبا · توصیه مسیر. حالت: پروژه‌ای.
4. **طراحی پلتفرم و راه‌اندازی توسعه** — تعریف نیازمندی، معیارها و برنامه ابزار، هماهنگی تیم. «تحویل می‌گیرید»: سند نیازمندی · معماری فرآیند · پنل اجرای dev. حالت: پروژه‌ای/قرارداد همراهی.
+ پاراگراف استخدامی: «اگر هدف استخدام است، در فرم «نوع درخواست = استخدام» را انتخاب کنید — بخش رزومه یا صفحه درباره ما مسیر شغلی را نشان می‌دهد.»
CTA نهایی: `<a class="btn-primary" href="contact.html#form">درخواست بررسی پروژه</a>` + زیرش «چند روز کاری برای پاسخ — تلگرام بیشتر.»
EN معادل با عناوین: Digital Project Management / Operational Systems Design & SOP / Market & Business Research / Platform Design & Dev Enablement.

- [ ] **Step 3: فعال‌سازی نوبار خدمات** در ۴ ریشه‌صفحه + services خودش:
پیش‌رشته فعلی: `<a class="nav-soon" href="services.html" title="به‌زودی" aria-disabled="true">خدمات</a>` → `href="services.html"` plain + EN equivalent. فرمان کمک:

```powershell
$files='index.html','about.html','projects.html','contact.html','magazine.html','services.html';
foreach($f in $files){ if(Test-Path $f){ (Get-Content $f -Raw -Encoding UTF8) -replace '<a class="nav-soon" href="services\.html" title="به‌زودی" aria-disabled="true">خدمات</a>','<a href="services.html">خدمات</a>' -replace '<a class="nav-soon" href="services\.html" title="به‌زودی" aria-disabled="true">Services</a>','<a href="services.html">Services</a>' | Set-Content $f -Encoding UTF8 -NoNewline } }
```
(توجه: about/projects در این نقطه هنوز وجود ندارند → فایل حاضر (index/contact/magazine/services) اعمال می‌شود؛ در تسک‌های صفحه‌ساخت هم صفت این لینک از همان ابتدا plain نوشته می‌شود.)

- [ ] **Step 4: چک سبز** — `Select-String -Path services.html -Pattern '<h1','canonical','btn-primary'` → هر ۳ پترن match (توجه: `<h1` دو خط match می‌کند — fa و en — در هر لحظه فقط یکی visible)؛ `Select-String -Path index.html -Pattern 'nav-soon" href="services'` → 0.
- [ ] **Step 5: chrome-devtools** 390/360 (toggle + overflow + منو).
- [ ] **Step 6: Commit + Push** — `git add services.html index.html contact.html magazine.html && git commit -m "feat(services): new services & collaboration page (fa/en) + nav activation" && git push origin main` — Pages check + زنده verify.

---

### Task 6: contact.html بازطراحی — کانال‌ها + فرم (ب۳-2)

**Files:**
- Modify: `contact.html` (بدنه + `<script>`)
- Modify: `assets/style.css` (form CSS)

**Interfaces:**
- Produces: `#contact-form` + فیلدهای `cf-*` (قرارداد در header بالایی)؛ `window.CONTACT_CONFIG = {endpoint:""}`؛ خروجی JS: POST JSON به endpoint؛ فیل بک → `mailto:` fallback با متن حفظ‌شده.

- [ ] **Step 1: چک قرمز** — `Select-String -Path contact.html -Pattern 'id="contact-form"'` → 0.

- [ ] **Step 2: CSS فرم (پیوست در style.css):**

```css
.cf-field{display:flex;flex-direction:column;gap:.4rem;margin-bottom:1.1rem}
.cf-field label{font-size:.8rem;color:var(--pale);letter-spacing:.06em}
.cf-field input,.cf-field select,.cf-field textarea{background:rgba(255,255,255,.04);border:1px solid rgba(200,164,74,.25);border-radius:var(--r-sm);color:var(--off-white);padding:.8rem 1rem;font:inherit;min-height:44px}
.cf-field input:focus,.cf-field select:focus,.cf-field textarea:focus{outline:none;border-color:var(--gold)}
.cf-msg{margin-top:.8rem;font-size:.85rem;color:var(--gold);min-height:1.4em}
.cf-fallback{display:none;margin-top:.6rem}
```

- [ ] **Step 3: بازنویسی بدنه `contact.html`** — کانال‌ها: main دو کارت (`#channel`):

```html
<section id="channel">
<div class="wrap">
<div class="sec-label">ارتباط</div>
<h1 class="contact-h">بیایید <em>گفتگو</em> کنیم</h1>
<div class="sec-line"></div>
<div class="case-grid">
<div class="case-card"><h3>تلگرام — مسیر سریع</h3><p><a href="https://t.me/SadeghVahidi" target="_blank" rel="noopener">@SadeghVahidi</a> — معمولاً در چند ساعت پاسخ می‌دهم.</p></div>
<div class="case-card"><h3>ایمیل — مسیر رسمی</h3><p><a href="mailto:sadeghvahidi80@gmail.com">sadeghvahidi80@gmail.com</a> — مناسب گزارش و سند.</p></div>
</div>
</div>
</section>
```
سپس خط «مسیرهای جایگزین» تک‌ردیفه: لینکدین · اینستاگرام · دو تلفن؛ سپس فرم:

```html
<section id="form" style="background:var(--charcoal)">
<div class="wrap">
<div class="sec-label">درخواست همکاری</div>
<h2>فرم بررسی <em>پروژه</em></h2>
<form id="contact-form" novalidate>
<div class="cf-field"><label for="cf-name">نام / سازمان</label><input id="cf-name" name="name" required autocomplete="name"></div>
<div class="cf-field"><label for="cf-contact">ایمیل یا آیدی تلگرام (برای پاسخ)</label><input id="cf-contact" name="contact" required></div>
<div class="cf-field"><label for="cf-type">نوع درخواست</label>
<select id="cf-type" name="type" required>
<option value="">— انتخاب کنید —</option>
<option>مدیریت پروژه</option><option>سیستم‌سازی</option><option>پژوهش بازار</option><option>محتوا</option><option>استخدام</option>
</select></div>
<div class="cf-field"><label for="cf-message">شرح کوتاه وضعیت و انتظار شما</label><textarea id="cf-message" name="message" rows="6" required></textarea></div>
<input type="text" id="cf-honeypot" name="honeypot" style="position:absolute;opacity:0;pointer-events:none" tabindex="-1" aria-hidden="true">
<input type="hidden" id="cf-open-ts" name="open_ts">
<input id="cf-cf-type-x" type="text" style="display:none">
<button class="btn-primary" type="submit">ارسال درخواست</button>
<p class="cf-msg" id="cf-msg" aria-live="polite"></p>
<p class="cf-fallback" id="cf-fallback">اگر ارسال خودکار ممکن نشد، <a id="cf-mailto" href="#">کلیک کنید</a> تا پیش‌فرض ایمیل‌تان متن را حفظ کند.</p>
</form>
</div>
</section>
```

- [ ] **Step 4: JS انتهای صفحه (بدون ادیت `site.js`):**

```js
<script>
window.CONTACT_CONFIG = { endpoint: "" };
(function(){
var f=document.getElementById('contact-form');if(!f)return;
var msgEl=document.getElementById('cf-msg'), fb=document.getElementById('cf-fallback'), mail=document.getElementById('cf-mailto');
document.getElementById('cf-open-ts').value=String(Math.floor(Date.now()/1000));
mail.addEventListener('click',function(){ fb.style.display='none'; });
function buildTelegramPayload(d){
  return {name:d.name, contact:d.contact, type:d.type, message:d.message, open_ts:d.open_ts, page:location.href, lang:document.documentElement.lang};
}
async function sendToWorker(payload){
  var ep=(window.CONTACT_CONFIG&&window.CONTACT_CONFIG.endpoint)||"";
  if(!ep){return {ok:false,reason:"no-endpoint"};}
  var r=await fetch(ep,{method:"POST",headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
  return {ok:r.ok};
}
f.addEventListener('submit',async function(ev){
  ev.preventDefault();
  var honey=document.getElementById('cf-honeypot');
  if(honey.value){msgEl.textContent='';return;}
  var t0=parseInt(document.getElementById('cf-open-ts').value,10)||0;
  if(Math.floor(Date.now()/1000)-t0<3){msgEl.textContent='لطفاً چند لحظه صبر کنید یا از تلگرام/ایمیل استفاده کنید.';return;}
  var d={
    name:      document.getElementById('cf-name').value.trim(),
    contact:   document.getElementById('cf-contact').value.trim(),
    type:      document.getElementById('cf-type').value,
    message:   document.getElementById('cf-message').value,
    open_ts:   document.getElementById('cf-open-ts').value
  };
  if(!d.name||!d.contact||!d.type||!d.message){msgEl.textContent='فیلدهای ستاره‌دار را کامل کنید.';return;}
  msgEl.textContent='در حال ارسال…';
  var res=await sendToWorker(buildTelegramPayload(d));
  if(res.ok){msgEl.textContent='دریافت شد — در تلگرام و ایمیل پاسخ می‌دهم.';f.reset();return;}
  msgEl.textContent='';
  var body='درخواست همکاری — '+d.type+'\nنام: '+d.name+'\nارتباط: '+d.contact+'\n\n'+d.message;
  mail.href='mailto:sadeghvahidi80@gmail.com?subject='+encodeURIComponent('درخواست همکاری — '+d.type)+'&body='+encodeURIComponent(body);
  fb.style.display='block';mail.focus();
});
})();
</script>
```
(نسخه تمیز: فقط `document.getElementById(...)` — بدون هیچ ارجاع `f.cf_name`.)

- [ ] **Step 5: چک سبز ساختاری** — `Select-String -Path contact.html -Pattern 'id="contact-form"','CONTACT_CONFIG','mailto:sadeghvahidi80'` → ≥3؛ H1 فرم صفحه = `contact-h` بی‌تغییر (یک H1 کل صفحه).
- [ ] **Step 6: chrome-devtools:** submit بدون endpoint → پیام fallback و لینک mailto فعال با متن؛ honeypot/تایم‌چک؛ 390/360؛ keyboard Tab order.
- [ ] **Step 7: Commit + Push** — `git commit -am "feat(contact): primary channels + collaboration form (Worker→TG, mailto fallback) fa/en" && git push origin main`.

---

### Task 7: Worker کلاودفلیر + راهنمای راه‌اندازی (ب۳-3 — «وابستگی کاربر» )

**Files:**
- Create: `workers/contact-form/worker.js`
- Create: `docs/cloudflare-form-setup.md`
- Modify: `contact.html` (فقط مقدار `endpoint:` بعد از setup)

**Interfaces:** Consumes: payload ساختار Task 6 (`buildTelegramPayload`). Produces: endpoint URL — در `docs/cloudflare-form-setup.md` مستند، در `contact.html` ثابت.

- [ ] **Step 1: کد Worker (`workers/contact-form/worker.js`):**

```js
export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: { allow: "POST" } });
    }
    const origin = request.headers.get("origin") || "";
    const allowed = ["https://sadeghvahidi.ir"];
    const cors = origin && allowed.includes(origin)
      ? { "access-control-allow-origin": origin, "access-control-allow-headers": "content-type", "access-control-allow-methods": "POST" }
      : {};
    if (request.method === "OPTIONS") return new Response(null, { headers: { ...cors, access_control_max_age: "86400" } });
    let d;
    try { d = await request.json(); } catch { return new Response("Bad JSON", { status: 400, headers: cors }); }
    if (!d || !d.name || !d.contact || !d.message || !d.type) return new Response("Missing fields", { status: 422, headers: cors });
    const text = `📨 درخواست همکاری از سایت\n\nنام: ${d.name}\nارتباط: ${d.contact}\nنوع: ${d.type}\nزبان صفحه: ${d.lang||"-"}\nصفحه: ${d.page||"-"}\n\nپیام:\n${d.message}`;
    const tg = await fetch(`https://api.telegram.org/bot${env.TG_TOKEN}/sendMessage`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: env.TG_CHAT_ID, text })
    });
    return new Response(tg.ok ? "OK" : "Telegram failed", { status: tg.ok ? 200 : 502, headers: cors });
  }
}
```

- [ ] **Step 2: `docs/cloudflare-form-setup.md`** — راهنمای قدم‌به‌قدم برای کاربر (~۱۰ دقیقه): ۱) BotFather: `/newbot` → نام+username → token ذخیره؛ ۲) ارسال پیام به خودت در تلگرام و بردن chat_id از `https://api.telegram.org/bot<TOKEN>/getUpdates`؛ ۳) Cloudflare dashboard → Workers → Create Worker (نام `contact-form`) → paste کد → در Settings/Variables دو secret: `TG_TOKEN`, `TG_CHAT_ID`؛ ۴) Deploy → endpoint URL را کپی؛ ۵) محدودسازی: کافی است خود worker را در `wrangler` نکنی — secretها از دش؛ ۶) تست:

```powershell
curl.exe -s -X POST <YOUR-ENDPOINT-URL> -H "content-type: application/json" -d '{"name":"تست سایت","contact":"@you","type":"سیستم‌سازی","message":"پیام تستی","open_ts":"0","lang":"fa","page":"https://sadeghvahidi.ir/"}'
```
Expected: `OK` + پیام در تلگرام شخصی شما.

- [ ] **Step 3: بعد از setup کاربر** — در `contact.html`: `endpoint: "https://contact-form.<subdomain>.workers.dev"` + commit.
- [ ] **Step 4: تست live** — فرم زنده را خودت submit کن → پیام تلگرام شخصی کاربر برسد (تست E2E).
- [ ] **Step 5: Commit + Push وسط تسک هم مجاز** — `git commit -m "feat(worker): telegram relay for contact form + setup guide" workers/contact-form/worker.js docs/cloudflare-form-setup.md`
**BLOCKED-ON-USER:** setup BotFather+Worker با کاربر (راهنمای قدم به قدم) — تنها تسک با وابستگی.

---

### Task 8: projects.html — ۵ case شاخص (ب۲-1)

**Files:**
- Create: `projects.html` (چندبخشی)
- Modify: `assets/style.css` (`.case-detail` accordion)

**Interfaces:** Produces: `#flagship` بلاک ۵ case، کلاس `case-detail/details/summary` — Task 9 همین ساختار را با نمونه‌های تخصصی و آرشیو ادامه می‌دهد.

- [ ] **Step 1: چک قرمز** — `Test-Path projects.html` → False.

- [ ] **Step 2: CSS:**

```css
.case-detail{border:1px solid rgba(200,164,74,.2);border-radius:var(--r);padding:1.2rem 1.4rem;margin-top:1.2rem;background:rgba(255,255,255,.02)}
.case-detail summary{cursor:pointer;font-size:1rem;color:var(--off-white)}
.case-detail summary::marker{color:var(--gold)}
.case-detail dl{display:grid;grid-template-columns:110px 1fr;gap:.35rem .8rem;margin-top:1rem}
.case-detail dt{font-size:.78rem;color:var(--gold);letter-spacing:.08em}
.case-detail dd{font-size:.88rem;color:var(--muted);line-height:1.9}
@media(max-width:560px){.case-detail dl{grid-template-columns:1fr}}
```

- [ ] **Step 3: صفحه** — head/canonical/og/nav/footer مطابق الگوی؛ body fa: H1 `پروژه‌ها و مطالعات <em>موردی</em>`؟ نه: `پروژه‌ها و مطالعات <em>موردی</em>` بر مبنای spec: عنوان H1 «پروژه‌ها و مطالعات موردی». سپس ۵ `<details class="case-detail">` — محتوای dt/dd از جدول spec §۶ (مسئله/مسئولیت/راهکار/ابزار/نتیجه/مستندات). «نتیجه» فقط واقعی، مدارک جای خالی. مثال full کارت ۱:

```html
<details class="case-detail" open><summary>۱ — پلتفرم فروشگاه قطعات تویوتا (ماتن)</summary>
<dl>
<dt>مسئله</dt><dd>اطلاعات خرید و خدمات قطعات تویوتا در بازار چندمنبعه و بدون شاخص است.</dd>
<dt>مسئولیت</dt><dd>پژوهش بازار و رقبا؛ تعریف نیازمندی‌ها؛ هماهنگی تیم توسعه.</dd>
<dt>راهکار</dt><dd>مسیر تحقیق → مدل کسب‌وکار → نیازمندی → فرآیند dev تا انتشار.</dd>
<dt>ابزار</dt><dd>مستندات نیازمندی، مدیریت صف dev، ابزارهای تحقیق بازار.</dd>
<dt>نتیجه</dt><dd>پلتفرم مستقل فروشگاهی فعال [در انتظار آمار]</dd>
<dt>مستندات</dt><dd>[در انتظار مدرک]</dd>
</dl></details>
```
+ یادداشت پایین بخش: «بدون همکاری مستقیم با تویوتا — محصول مستقل ماتن.» (رد نقد ۴.۳ برند)

کارت ۲ (سبزوار)، ۳ (پولکی/رونیکس با واقعی‌ها: تیم ۳–۴، ۳۰+، ۱۲+)، ۴ (خوراک دام، ۴ افق)، ۵ (کنترل کیفی کتاب، ۵+ عنوان) — full در فایل.

- [ ] **Step 4: EN mirror** (`lang-en` wrapper) — همان محتوا با ترجمه انگلیسی؛ نشان‌های EN جای‌خالی: `[Results pending]` / `[Evidence pending]` / `[Date pending]` (به Global Constraints و چک Task 16 افزوده شود).
- [ ] **Step 5: چک سبز** — تعداد `<h1` در هر wrapper زبانی = 1 (صفحه دوزبانه در DOM دو H1 دارد — fa و en — ولی در هر لحظه فقط یکی visible؛ قید: H1 visible per locale = 1، چک در chrome).
- [ ] **Step 6: chrome-devtools 390/360** — `<details>` باز/بسته؛ nav-soon «پروژه‌ها» هنوز آیتم منو فعال می‌شود در تسک ۹ (اینجا صفحه هست اما منو فعال‌سازی Task 9).
- [ ] **Step 7: Commit** — `git add projects.html assets/style.css && git commit -m "feat(projects): 5 flagship case cards with honest evidence slots (fa/en)" && git push origin main`

---

### Task 9: projects.html — نمونه تخصصی + آرشیو + فعال‌سازی منو (ب۲-2)

**Files:**
- Modify: `projects.html` (پایین flagship: ۸ نمونه تخصصی + آرشیو)
- Modify: nav ۴ ریشه + خودش

**Interfaces:** Consumes: الگوی صفحه Task 8. Produces: `#specialist`, `#archive`؛ منوی «پروژه‌ها» فعال.

- [ ] **Step 1: `#specialist` — ۸ کارت کوتاه** (از ۴۲ واقعی): عناوین دقیق از `resume/fa/index.html` — «حسابداری شخصی با اکسل» (پولکی)، «تفاوت جوشکاری TIG و MMA» (رونیکس)، «ثبت خودکار تراکنش از پیامک بانک» (پولکی) و موارد مشابه؛ فقط لینک واقعی: poolaki.app و ronix.ir؛ بقیه بدون لینک.: هر کارت = نام+نتیجه کوتاه+لینک (لینک فقط موجودهای واقعی: poolaki blog, ronix.ir؛ else بدون لینک).
- [ ] **Step 2: `#archive` — فهرست فشرده** `<details>` جدا با liهای متن واقعی از بلوک فعلی `#projects` رزومه (خوانده از `resume/fa/index.html` — لیست فعلی). «مشاهده کامل ۴۲ مورد در رزومه» ← لینک به `/resume/fa/` — کپی لیست بزرگ نمی‌شود؛ آرشیو کامل روی رزومه می‌ماند.. **تصمیم:** آرشیو page = فهرست ۱۲ ماده منتخب + دکمه «آرشیو کامل در رزومه» بحث کم‌ریسک؛ مسیر نقد (فهرست کامل بدون قیم) روی صفحه رزومه در Task 10 حمل می‌شود.
- [ ] **Step 3: فعال‌سازی منوی پروژه‌ها** — `-replace '<a class="nav-soon" href="projects\.html" title="به‌زودی" aria-disabled="true">پروژه‌ها</a>','<a href="projects.html">پروژه‌ها</a>'` × ۴ فایل + معادل EN — و همین برای لینک soon در hero/فظات home (btn-secondary nav-soon → plain) در index.
- [ ] **Step 4: چک سبز** — `Select-String` pattern `nav-soon" href="projects` روی index/contact/magazine/services/projects → 0؛ `id="archive"`,`id="specialist"` → match.
- [ ] **Step 5: DevTools 390/360 — links real», then `git commit -m "feat(projects): specialist samples + archive pointer + nav activation (#9)" && git push origin main` + Pages.

---

### Task 10: resume/fa — سه‌سطحی + relabel + dual-H1 fix (ب۲-3)

**Files:**
- Modify: `resume/fa/index.html` (ساختار بخش‌ها)
- Modify: `assets/style.css` (اگر کلاس جدید لازم)

**Interfaces:** Consumes: الگوی case-detail Task 8. Produces: ساختار مرجع برای Task 11 (EN mirror).

- [ ] **Step 1: نقشه فعلی** — Read `resume/fa/index.html`: شناسه بخش‌ها و خط شروع/پایان، ثبت در کامنت کار. (H1 hero در خط 55؛ #projects در خط 191 با ۴۲ نمونه؛ «سه پروژه در حال توسعه» خط 242؛ print H1 تکراری در خط 356.)
- [ ] **Step 2: تغییرات ریز** —
  a) hero-sub → جمله جایگاه از spec (fa)؛
  b) بعد از توانمندی‌ها: بلاک ۵ `<details class="case-detail">` (مطابق Task 8) با عنوان بخش «پروژه‌های <em>شاخص</em>» — جایگاه: بعد از توانمندی‌ها و قبل از سوابق شغلی؛
  c) بخش `#projects` (۴۲) → `<details class="archive-full">` با H3 «آرشیو کامل آثار» (بسته default closed؛ برای چاپ: `@media print{.archive-full details,.archive-full details>*{display:block}}` تا هیچ آیتمی در نسخه چاپی حذف نشود.); خروجی: هیچ آیتمی حذف نمی‌شود؛ فقط گروه‌بندی.
  d) «سه پروژه در حال توسعه»: هر سه برچسب «نیازمند به‌روزرسانی» → «در حال توسعه — فعال» + خط «آخرین به‌روزرسانی: [در انتظار تاریخ]»؛ شرح صادقانه مسئله/هدف/نقش باقی می‌ماند.
  e) Dual H1: تبدیل `<h1>صادق وحیدی</h1>` چاپ (line ~356) → `<h2 class="print-h1">صادق وحیدی</h2>` + CSS `.print-h1{font-size:2.2rem;font-weight:300;color:var(--off-white);margin-bottom:.6rem}`.
  f) انتهای رزومه: CTA `[درخواست بررسی پروژه]` → `contact.html#form` (بجای mail-only کنونی — محافظت mail حفظ در صفحه تماسی).
- [ ] **Step 3: چک سبز** — `Select-String -Path resume/fa/index.html -Pattern '<h1'` → 2→ **1**؛ «نیازمند به‌روزرسانی» → 0؛ `case-detail` → 5; `[در انتظار تاریخ]` → 3.
- [ ] **Step 4: chrome-devtools 390/360** + چاپ preview (chrome print preview → صحت display)؛ toggle درون‌صفحه‌ای رزومه (اگر has).
- [ ] **Step 5: Commit** — `git add resume/fa/index.html assets/style.css && git commit -m "feat(resume-fa): three-tier structure, honest status labels, single H1" && git push origin main`

---

### Task 11: resume/en — mirror restructure (ب۲-4)

**Files:** Modify: `resume/en/index.html` — همان قدم‌های Task 10 با متن EN؛
**Steps:** mirror Step a–f با ترجمه (Archive of works [42] → `<details>`؛ "Pending update" → "In development — active" + `[Date pending]`؛ CTA → `contact.html#form`).
- [ ] چک: '<h1' → 1؛ 5 case-detail؛ 'In development — active' → 3؛
- [ ] DevTools؛ `git commit -am "feat(resume-en): three-tier structure mirrors fa + single H1" && git push` + Pages check (این release تمام ب۲).

---

### Task 12: about.html — قصه حرفه‌ای + Person schema (ب۴-1)

**Files:**
- Create: `about.html` — همان الگوی صفحه services (Task 5).
- Modify: nav ریشه‌ها (فعال‌سازی درباره)

**Steps:**
- [ ] head: title «درباره صادق وحیدی — روایت حرفه‌ای» + description انطباق؛ canonical `https://sadeghvahidi.ir/about.html`؛ JSON-LD Person (همان بلوک موجود index، با `url` صفحه درباره).
- [ ] بدنه fa: H1 «درباره من»؛ story (از resume واقعی: کارشناسی حسابداری، دانشگاه تهران، ۱۳۹۸–۱۴۰۱؛ مسیر: از تحلیل داده و محتوا تا سیستم‌سازی؛ founder گروه فناوری ماتن)؛ فلسفه (عبارت: «سیستم، جایگزین حافظه فردی است»)؛ بخش سوابق مختصر + مؤسس گروه فناوری ماتن؛ EN معادل؛
- [ ] فعال‌سازی منو درباره در ۵ صفحه (پیش از این ۴ صفحه + سایر).
- [ ] چک/DevTools؛ `git commit -am "feat(about): career story + Person schema (fa/en) + nav activation" && git push`.

---

### Task 13: سئوی ساختاری — titles/desc/canonical/hreflang/sitemap/robots/JSON-LD/hidden (ب۴-2)

**Files:** Modify: همه ریشه‌صفحه‌ها + `resume/{fa,en}/index.html` + `sitemap.xml` + `robots.txt` + رزومه‌های دیگر (فقط hreflang)

**Steps:**
- [ ] ۱) جدول اعمال — برای هر صفحه title/description هدف از spec §۸ (exact strings)؛(objective هر صفحه مشخص).
- [ ] ۲) canonical اضافه/بازبینی همه.
- [ ] ۳) hreflang: در `resume/<lang>/index.html` هر ۹ زبان، block ۹ `<link rel="alternate" hreflang="xx" href="…">` ؛ x-default → fa.
- [ ] ۴) sitemap.xml — append: `/about.html`, `/projects.html`, `/services.html`, `/resume.html` با lastmod امروز؛ لیست کامل read اولاً (12 از قبل + 4 = 16).
- [ ] ۵) robots.txt بازبینی (custom Allows، sitemap خط).
- [ ] ۶) JSON-LD: about Person (از Task 12)، projects/services BreadcrumbList، contact ContactPage، resume ProfilePage.
- [ ] ۷) محتوای مخفی چاپی — مطمئن شو بلاک چاپ فاقد H1 تکراری یا canonical تکراری است: grep `id="print"` + `data-print`؛ چک: بخش چاپ در sitemap/hreflang نباشد.
- [ ] ۸) جمع‌بندی: در هر صفحه H1 visible per locale = 1؛ تعداد canonical = تعداد صفحات.
- [ ] `git commit -am "feat(seo): structured titles, canonical/hreflang, sitemap+4, schema, hidden-content hygiene" && git push` + verify live (search engine snippets via curl).

---

### Task 14: CWV + دسترس‌پذیری (ب۴-3)

**Steps:**
- [ ] فونت preload fa (`IranNastaliq` from محلی assets/fonts — بسته الف سلف‌هوست شد)؛ `<link rel="preload" as="font" type="font/woff2" crossorigin>` فقط صفحات تیتر-سبک؛
- [ ] lazy: `loading="lazy"` روی تصاویر پایین صفحه (تصویر hero eager می‌ماند؛ بقیه lazy)؛ OG تنظیم؛
- [ ] دسترس‌پذیری: برچسب‌های aria نوبار؛ focus outline؛ `aria-hidden` ها؛ عیب focus outline استاندارد؛
- [ ] DevTools network: فایک CSS/JS خروجی حجم، تعداد requests؛ لاگ در گزارش.
- [ ] `git commit -am "perf(cwv): font preload, lazy images, a11y pass" && git push`.

---

### Task 15: magazine.html هویت + قالب مقاله (ب۵)

**Files:** Modify: `magazine.html`; Create: `magazine/post-template.html` (با `noindex,follow`).

**Steps:**
- [ ] بدنه: sec-label «مجله» + H1 «یادداشت‌های مدیر پروژه و <em>سیستم‌ساز</em>» + ۶ دسته ثابت (chips نمایشی): مدیریت پروژه دیجیتال • طراحی سیستم‌های عملیاتی • مدیریت دانش • اتوماسیون کسب‌وکار • پژوهش بازار • تجربه‌های واقعی.
- [ ] Empty-state: کارت «اولین مقاله — در راه» + CTA خدمات/فرم؛
- [ ] `magazine/post-template.html`: الگوی مقاله — H1 تکی + دسته + تاریخ + چهار بخش متنی + CTA پایان؛ `<meta name="robots" content="noindex,follow">` حفظ.
- [ ] چک: magazine صفحه `<meta name="robots" content="noindex,follow">` intact؛ ۶ دسته؛ `git commit -am "feat(magazine): identity, 6 fixed categories, article template (still noindex)" && git push`.

---

### Task 16: ACCEPTANCE — معیارهای پذیرش + Release نهایی + گزارش و لاگ

**Files:** read-only بررسی + لاگ ماتن

**Steps:**
- [ ] ۱) از spec §۱۳ چک‌لیست ۸ ماده با تیک؛ هورفلو/one-H1/canonical/sitemap content/CTAها؛
- [ ] ۲) چک جای‌خالی: اسکن `[در انتظار` (fa) و `[Results pending]`/`[Evidence pending]`/`[Date pending]` (en) در همه ریشه‌صفحه‌ها + رزومه fa/en — هر تطبیق باید در اسلات مصوب (شواهد/نتیجه case/تاریخ وضعیت) باشد؛ شمارش و فهرست در گزارش ثبت شود.
- [ ] ۳) Push؛ Pages built؛ live verify هر ۶ صفحه + فرم تلگرام (اگر Task 7 انجام شده)؛
- [ ] ۴) گزارش تغییرات (controlled-execution) — فاز/فایل/تست/مدارک؛
- [ ] ۵) لاگ: `py E:\maten\memory-bank\feedback.py log --topic "sadeghvahidi-ir package B" --result ok --notes "…"` + append سشن `2026-11-07_141500-sadeghvahidi-ir-day3.md` خط «بسته ب …» + `py E:\maten\memory-bank\open_items.py` cleanup.

---

## Review Focus

1. **نوبار فارسی اول** — در lang-fa برچسب انگلیسی نباید بماند (رفع نقد ۴.۱): کلیک روی lang-fa باید خانه/درباره/پروژه‌ها/خدمات/مجله/تماس/رزومه فارسی نشان دهد. Test: Task 1 Step 4 + DevTools toggle.
2. **ریسک ۴۰۴** — نوبار به صفحه‌های ساخته‌نشده: soon-state disabled. Test: Task 1/Step 5 + Task 5/9 activation greps.
3. **هورفلو موبایل در بخش‌های جدید** (gridها، step-row، فرم): هر نسخه در 360/390 چک scrollWidth==clientWidth.
4. **شکست مسیر فرم** — Worker down / endpoint خالی: کاربر باید همیشه mailto fallback با متن حفظ‌شده ببیند. Test: Task 6 Step 6 (local no-endpoint) + Task 7 Step 4 (زنده).
5. **آلودگی جای‌خالی** — هیچ نشان `[در انتظار …]` خارج از اسلات‌های مصوب زنده نرود. Test: Task 16 Step 2 scan دقیق.
