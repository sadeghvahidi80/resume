/* Locale-specific resume navigation, printing and accessibility. */
(function () {
  'use strict';
  var locale = document.documentElement.lang || 'en';
  var rtl = locale === 'fa' || locale === 'ar';
  var root = document.querySelector('.resume-language[data-resume-locale="' + locale + '"]');
  var select = document.getElementById('languageToggle');
  var burger = document.getElementById('burger');
  var mobile = document.getElementById('navMobile');
  var nav = document.getElementById('nav');
  var open = false;

  document.documentElement.dir = rtl ? 'rtl' : 'ltr';
  document.body.dir = rtl ? 'rtl' : 'ltr';
  document.body.classList.toggle('is-en', !rtl);
  try { window.localStorage.setItem('site-lang', locale === 'fa' ? 'fa' : 'en'); } catch (e) {}
  if (root) { root.classList.add('is-active'); root.setAttribute('aria-hidden', 'false'); }

  var pages = Array.prototype.slice.call(document.querySelectorAll('#print-resume .print-page[data-print-locale="' + locale + '"]'));
  pages.forEach(function (page, index) {
    page.classList.add('is-print-active');
    page.setAttribute('aria-hidden', 'false');
    if (index === pages.length - 1) page.classList.add('last-active');
  });

  var labels = {
    en: ['About','MATEN','Experience','Contact'], it: ['Profilo','MATEN','Esperienza','Contatti'],
    de: ['Profil','MATEN','Berufserfahrung','Kontakt'], fr: ['Profil','MATEN','Expérience','Contact'],
    zh: ['个人简介','MATEN','工作经历','联系'], ru: ['Обо мне','MATEN','Опыт','Контакты'],
    es: ['Perfil','MATEN','Experiencia','Contacto'], ar: ['نبذة عني','ماتن','الخبرة','التواصل'],
    fa: ['درباره من','ماتن','سوابق شغلی','ارتباط با من']
  };
  var navLabels = labels[locale] || labels.en;
  document.querySelectorAll('#nav .nav-links a, #navMobile a').forEach(function (a, i) {
    if (navLabels[i % 4]) a.textContent = navLabels[i % 4];
  });

  var person = document.getElementById('navPersonName');
  var names = {fa:'صادق وحیدی',ar:'صادق وحيدي',zh:'萨迪格·瓦希迪',ru:'Садег Вахиди',en:'Sadegh Vahidi',it:'Sadegh Vahidi',de:'Sadegh Vahidi',fr:'Sadegh Vahidi',es:'Sadegh Vahidi'};
  if (person) { person.textContent = names[locale] || names.en; person.lang = locale; person.dir = 'auto'; }

  var ui = {
    en:{select:'Choose language',label:'Change language',print:'View and print PDF',open:'Open menu',close:'Close menu'},
    it:{select:'Scegli la lingua',label:'Cambia lingua',print:'Visualizza e stampa PDF',open:'Apri il menu',close:'Chiudi il menu'},
    de:{select:'Sprache auswählen',label:'Sprache wechseln',print:'PDF ansehen und drucken',open:'Menü öffnen',close:'Menü schließen'},
    fr:{select:'Choisir la langue',label:'Changer la langue',print:'Voir et imprimer le PDF',open:'Ouvrir le menu',close:'Fermer le menu'},
    zh:{select:'选择语言',label:'切换语言',print:'查看并打印 PDF',open:'打开菜单',close:'关闭菜单'},
    ru:{select:'Выбрать язык',label:'Сменить язык',print:'Открыть и распечатать PDF',open:'Открыть меню',close:'Закрыть меню'},
    es:{select:'Elegir idioma',label:'Cambiar idioma',print:'Ver e imprimir PDF',open:'Abrir menú',close:'Cerrar menú'},
    ar:{select:'اختر اللغة',label:'تغيير اللغة',print:'عرض ملف PDF وطباعته',open:'فتح القائمة',close:'إغلاق القائمة'},
    fa:{select:'انتخاب زبان',label:'تغییر زبان',print:'چاپ و مشاهدهٔ PDF',open:'باز کردن منو',close:'بستن منو'}
  };
  var text = ui[locale] || ui.en;
  var switcher = document.getElementById('languageSwitcher');
  var switcherLabel = document.getElementById('languageSwitcherLabel');
  var printLabel = document.getElementById('printButtonLabel');
  var printButton = document.querySelector('.btn-print');
  if (switcher) { switcher.dir = rtl ? 'rtl' : 'ltr'; switcher.setAttribute('aria-label', text.select); }
  if (switcherLabel) { switcherLabel.textContent = text.label; switcherLabel.lang = locale; }
  if (select) {
    select.value = locale;
    select.lang = locale;
    select.dir = rtl ? 'rtl' : 'ltr';
    select.setAttribute('aria-label', text.select);
    select.addEventListener('change', function () {
      var next = this.value;
      if (/^(fa|en|it|de|fr|zh|ru|es|ar)$/.test(next)) window.location.href = '/resume/' + next + '/';
    });
  }
  if (printLabel) printLabel.textContent = text.print;
  if (printButton) {
    printButton.setAttribute('aria-label', text.print);
    printButton.addEventListener('click', function () { window.print(); });
  }

  function setMenu(next) {
    if (!burger || !mobile) return;
    open = !!next;
    mobile.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? text.close : text.open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  if (burger && mobile) {
    burger.setAttribute('aria-label', text.open);
    burger.addEventListener('click', function () { setMenu(!open); });
    mobile.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) { setMenu(false); burger.focus(); } });
  }
  document.querySelectorAll('.nav-links a[href^="#"], #navMobile a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({behavior:'smooth',block:'start'}); }
    });
  });
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) { if (entry.isIntersecting) { entry.target.classList.add('visible'); obs.unobserve(entry.target); } });
    }, {threshold:0.1, rootMargin:'0px 0px -40px 0px'});
    document.querySelectorAll('.rv').forEach(function (el) { el.classList.add('rv-animated'); observer.observe(el); });
  }
  var btt = document.querySelector('.back-to-top');
  if (btt) {
    window.addEventListener('scroll', function () { btt.classList.toggle('show', window.scrollY > 600); }, {passive:true});
    btt.addEventListener('click', function (e) { e.preventDefault(); window.scrollTo({top:0,behavior:'smooth'}); });
  }
  if (nav) window.addEventListener('scroll', function () { nav.classList.toggle('scrolled', window.scrollY > 80); }, {passive:true});
})();
