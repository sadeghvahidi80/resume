/* Locale-specific resume navigation, printing and accessibility. */
(function () {
  'use strict';
  var locale = document.documentElement.lang || 'en';
  var rtl = locale === 'fa' || locale === 'ar';
  var root = document.querySelector('.resume-language[data-resume-locale="' + locale + '"]');
  var select = document.getElementById('languageToggle');
  var menu = document.getElementById('navMenu');
  var menuSummary = menu ? menu.querySelector('summary') : null;
  var nav = document.getElementById('nav');

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
    en: {home:'Home',about:'About',maten:'MATEN',experience:'Experience',contact:'Contact'},
    it: {home:'Home',about:'Profilo',maten:'MATEN',experience:'Esperienza',contact:'Contatti'},
    de: {home:'Start',about:'Profil',maten:'MATEN',experience:'Berufserfahrung',contact:'Kontakt'},
    fr: {home:'Accueil',about:'Profil',maten:'MATEN',experience:'Expérience',contact:'Contact'},
    zh: {home:'首页',about:'个人简介',maten:'MATEN',experience:'工作经历',contact:'联系'},
    ru: {home:'Главная',about:'Обо мне',maten:'MATEN',experience:'Опыт',contact:'Контакты'},
    es: {home:'Inicio',about:'Perfil',maten:'MATEN',experience:'Experiencia',contact:'Contacto'},
    ar: {home:'الرئيسية',about:'نبذة عني',maten:'ماتن',experience:'الخبرة',contact:'التواصل'},
    fa: {home:'خانه',about:'درباره من',maten:'ماتن',experience:'سوابق شغلی',contact:'ارتباط با من'}
  };
  var navLabels = labels[locale] || labels.en;
  document.querySelectorAll('.nav-menu-panel a[data-nav]').forEach(function (a) {
    var key = a.getAttribute('data-nav');
    if (navLabels[key]) a.textContent = navLabels[key];
  });

  var person = document.getElementById('navPersonName');
  var names = {fa:'صادق وحیدی',ar:'صادق وحيدي',zh:'萨迪格·瓦希迪',ru:'Садег Вахиди',en:'Sadegh Vahidi',it:'Sadegh Vahidi',de:'Sadegh Vahidi',fr:'Sadegh Vahidi',es:'Sadegh Vahidi'};
  if (person) { person.textContent = names[locale] || names.en; person.lang = locale; person.dir = 'auto'; }

  var ui = {
    en:{select:'Choose language',label:'Change language',print:'View and print PDF',menu:'Menu'},
    it:{select:'Scegli la lingua',label:'Cambia lingua',print:'Visualizza e stampa PDF',menu:'Menu'},
    de:{select:'Sprache auswählen',label:'Sprache wechseln',print:'PDF ansehen und drucken',menu:'Menü'},
    fr:{select:'Choisir la langue',label:'Changer la langue',print:'Voir et imprimer le PDF',menu:'Menu'},
    zh:{select:'选择语言',label:'切换语言',print:'查看并打印 PDF',menu:'菜单'},
    ru:{select:'Выбрать язык',label:'Сменить язык',print:'Открыть и распечатать PDF',menu:'Меню'},
    es:{select:'Elegir idioma',label:'Cambiar idioma',print:'Ver e imprimir PDF',menu:'Menú'},
    ar:{select:'اختر اللغة',label:'تغيير اللغة',print:'عرض ملف PDF وطباعته',menu:'القائمة'},
    fa:{select:'انتخاب زبان',label:'تغییر زبان',print:'چاپ و مشاهدهٔ PDF',menu:'منو'}
  };
  var text = ui[locale] || ui.en;
  var menuLabel = document.getElementById('navMenuLabel');
  if (menuLabel) { menuLabel.textContent = text.menu; menuLabel.lang = locale; }
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

  // Native <details> opens without JavaScript; add Escape, outside-click and
  // close-on-link so the panel behaves like a conventional dropdown.
  if (menu && menuSummary) {
    var syncMenu = function () {
      menuSummary.setAttribute('aria-expanded', menu.open ? 'true' : 'false');
    };
    menu.addEventListener('toggle', syncMenu);
    syncMenu();
    menu.querySelectorAll('.nav-menu-panel a').forEach(function (a) {
      a.addEventListener('click', function () { menu.open = false; });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.open) {
        e.preventDefault();
        menu.open = false;
        menuSummary.focus();
      }
    });
    document.addEventListener('click', function (e) {
      if (menu.open && !menu.contains(e.target)) menu.open = false;
    });
  }
  document.querySelectorAll('.nav-menu-panel a[href^="#"]').forEach(function (a) {
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
