"""Post-apply verification of the second-audit batch."""

import io
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FAIL = []


def read(rel):
    return io.open(
        os.path.join(ROOT, rel.replace("\\", "/")), encoding="utf-8", newline=""
    ).read()


def check(cond, label):
    print(("PASS " if cond else "FAIL ") + label)
    if not cond:
        FAIL.append(label)


ix = read("index.html")
pr = read("projects.html")
sv = read("services.html")
ab = read("about.html")
ct = read("contact.html")
rfa = read(r"resume\fa\index.html")
ren = read(r"resume\en\index.html")

print("### home")
check(ix.count("پروژه‌های <em>منتخب</em>") == 1, "home: selected projects label FA")
check(ix.count("Selected <em>projects</em>") == 1, "home: selected projects label EN")
check(ix.count("چهار نمونهٔ منتخب برای تنوع حوزه") == 1, "home: selection note FA")
check(
    ix.count("Four selected pieces for range of field") == 1, "home: selection note EN"
)
check(
    ix.count("سبزوار (کرابی)") == 1 and ix.count("(Karabi)") == 1, "home: Karabi named"
)
check(
    "پنل مدیریت امن" not in ix and "secure admin panel" not in ix,
    "home: no 'secure panel' claim",
)
check(
    ix.count("خروجی‌های حرفه‌ای و <em>دستاوردها</em>") == 1, "home: evidence heading FA"
)
check(
    ix.count("Professional outputs &amp; <em>achievements</em>") == 1,
    "home: evidence heading EN",
)
check(
    "محصولات و سامانه‌های توسعه‌یافته: ماتن · روان‌یار · کرابی" in ix,
    "home: products label FA",
)
check(
    "Products and systems built: MATEN · Ravan Yar · Karabi" in ix,
    "home: products label EN",
)

print("\n### projects")
check("شش نمونه‌کار <em>منتخب</em>" in pr, "projects: heading FA")
check("Six <em>selected</em> case studies" in pr, "projects: heading EN")
check(
    pr.count("سبزوار (کرابی)") == 1 and pr.count("(Karabi)") == 1,
    "projects: Karabi named",
)
check(
    "۲۲۴ مهارت ثبت‌شده" in pr and "224 registered skills" in pr,
    "MATEN: registry skills",
)
check("2 base platforms" not in pr, "MATEN: EN parity (no 2 platforms)")
check("نمونهٔ عمومی این سامانه منتشر نشده است." in pr, "MATEN: no public release FA")
check("This system has no public release." in pr, "MATEN: no public release EN")
check("بدون وابستگی به APIهای تجاری شخص ثالث" in pr, "Ravan: dependency wording FA")
check(
    "does not depend on third-party commercial APIs" in pr,
    "Ravan: dependency wording EN",
)
check(
    "همان ابتکار مستقل و غیرانتفاعی" in pr
    and "same independent nonprofit initiative" in pr,
    "Ravan: resume cross-reference",
)
check("ronix.ir</a>" not in pr, "project 2: no Ronix homepage link")
check("poolaki.app</a>" not in pr, "project 2: no Poolaki homepage link")
check(
    "difference-between-tig-and-mma-welding-machine" in pr,
    "project 2: direct Ronix article",
)
check(pr.count("poolaki.app/blog/") == 4, "project 2: two direct Poolaki articles")

print("\n### services")
check("۳ تا ۶ ماه، یا همراهی ماهانه" in sv, "services: engagement model FA")
check(
    "estimated 3–6 months, or a monthly retainer" in sv, "services: engagement model EN"
)
check(
    "دو سطح: مشاوره و طراحی سیستم؛ یا طراحی، مستندسازی و پیاده‌سازی." in sv,
    "services: two levels FA",
)
check("Two levels: consulting and system design" in sv, "services: two levels EN")
check(
    "پنل اجرای dev" not in sv and "dev execution panel" not in sv,
    "services: panel renamed",
)
check(
    "داشبورد مدیریت و پیگیری توسعه" in sv and "development tracking dashboard" in sv,
    "services: new panel label",
)
check("پژوهش ثانویه، تحلیل رقبا، تحلیل مشتری" in sv, "services: research methods FA")
check(
    "secondary research, competitor analysis, customer analysis" in sv,
    "services: research methods EN",
)
check("تعداد صفحه‌ها، نسخهٔ فارسی/انگلیسی" in sv, "services: web scope options FA")
check("page count, Farsi/English versions" in sv, "services: web scope options EN")

print("\n### about")
check(
    "مسیر حرفه‌ای <em>منتخب</em>" in ab and "Selected <em>career path</em>" in ab,
    "about: career heading",
)
check(
    "باور من به سیستم‌سازی" in ab and "My belief about systems" in ab,
    "about: quote label",
)
check("همکاری حرفه‌ای با بیش از ۷ سازمان و برند" in ab, "about: 7+ wording FA")
check(
    "Professional collaboration with 7+ organizations and brands" in ab,
    "about: 7+ wording EN",
)
check("مدیرعامل" not in ab and "CEO" not in ab, "about: no CEO wording")

print("\n### contact")
check("Formspree" in ct, "contact: service named")
check("بودجه تقریبی (تومان، اختیاری)" in ct, "contact: budget unit FA")
check("Approximate budget (USD or EUR, optional)" in ct, "contact: budget unit EN")
ct_plain = ct.replace("&nbsp;", " ")
check("شمارهٔ اصلی" in ct_plain and "شمارهٔ دوم" in ct_plain, "contact: phone labels FA")
check("— primary" in ct_plain and "— secondary" in ct_plain, "contact: phone labels EN")

print("\n### resumes")
check("همه با لینک مستقیم" not in rfa, "resume FA: direct-link claim removed")
check(
    "all with direct, verifiable links" not in ren,
    "resume EN: direct-link claim removed",
)
check("مهر ۱۴۰۴ — شهریور ۱۴۰۵، بدون تأخیر" in rfa, "resume FA: Poolaki period")
check("throughout Oct 2025 — Sep 2026" in ren, "resume EN: Poolaki period")
check("مؤسس و مدیرعامل" not in rfa, "resume FA: no founder/CEO")
check("مؤسس و مدیرعامل" not in ab, "about: no founder/CEO (2)")
check("CEO" not in ren, "resume EN: no CEO")
check(rfa.count("چهار پروژهٔ منتخب") >= 1, "resume FA: selected projects heading")
check("Four <em>selected</em> projects" in ren, "resume EN: selected projects heading")
check("چهار حوزهٔ تمرکز، دسته‌بندی اصلی کار" in rfa, "resume FA: focus vs capabilities")
check(
    "The four focus areas are the main categories" in ren,
    "resume EN: focus vs capabilities",
)

print("\nFAILURES:", len(FAIL))
