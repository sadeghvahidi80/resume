/* Shared behavior for the bilingual public site. */
(function () {
  'use strict';

  var root = document.documentElement;
  var menu = document.getElementById('navMenu');
  var menuSummary = menu ? menu.querySelector('summary') : null;
  var toggle = document.getElementById('langToggle');
  var nav = document.getElementById('nav');
  var valid = ['fa', 'en'];

  function safeStorageGet(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }
  function safeStorageSet(key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) {}
  }

  function updateMeta(selector, attribute, lang) {
    var node = document.querySelector(selector);
    if (!node) return;
    var value = node.getAttribute(lang === 'en' ? 'data-en' : 'data-fa');
    if (value) node.setAttribute(attribute, value);
  }

  // SEO-002: the static canonical cannot see ?lang=en, so keep it
  // self-referential for the language actually rendered. Guarded to the
  // bilingual root pages (they declare hreflang="en" with ?lang=en).
  function syncCanonical(lang) {
    var canon = document.querySelector('link[rel="canonical"]');
    var altEn = document.querySelector('link[rel="alternate"][hreflang="en"]');
    if (!canon || !altEn) return;
    if ((altEn.getAttribute('href') || '').indexOf('lang=en') === -1) return;
    var base = canon.getAttribute('data-canonical-base');
    if (!base) {
      base = (canon.getAttribute('href') || '').split('?')[0];
      canon.setAttribute('data-canonical-base', base);
    }
    canon.setAttribute('href', lang === 'en' ? base + '?lang=en' : base);
  }

  function applyLang(lang, updateUrl) {
    if (valid.indexOf(lang) === -1) lang = 'fa';
    root.lang = lang;
    root.dir = lang === 'fa' ? 'rtl' : 'ltr';

    if (toggle) {
      toggle.textContent = lang === 'fa' ? 'EN' : 'FA';
      toggle.setAttribute('aria-label', lang === 'fa' ? 'EN — تغییر زبان به انگلیسی' : 'FA — Switch language to Persian');
      toggle.setAttribute('title', lang === 'fa' ? 'English' : 'فارسی');
    }

    var title = document.querySelector('title[data-fa][data-en]');
    if (title) title.textContent = title.getAttribute(lang === 'en' ? 'data-en' : 'data-fa');
    updateMeta('meta[name="description"][data-fa][data-en]', 'content', lang);
    updateMeta('meta[property="og:title"][data-fa][data-en]', 'content', lang);
    updateMeta('meta[property="og:description"][data-fa][data-en]', 'content', lang);
    updateMeta('meta[name="twitter:title"][data-fa][data-en]', 'content', lang);
    updateMeta('meta[name="twitter:description"][data-fa][data-en]', 'content', lang);
    var ogLocale = document.querySelector('meta[property="og:locale"]');
    if (ogLocale) ogLocale.setAttribute('content', lang === 'fa' ? 'fa_IR' : 'en_US');

    syncCanonical(lang);

    safeStorageSet('site-lang', lang);
    if (updateUrl && window.history && window.history.replaceState) {
      try {
        var url = new URL(window.location.href);
        url.searchParams.set('lang', lang);
        window.history.replaceState({}, '', url.pathname + url.search + url.hash);
      } catch (e) {}
    }
  }

  // The menu is a native <details>, so it opens without JavaScript. These
  // listeners only add the expected conveniences: Escape closes and returns
  // focus to the trigger, an outside click closes it, and following a link
  // closes it so the next page never shows a stale open panel.
  if (menu && menuSummary) {
    var syncMenu = function () {
      menuSummary.setAttribute('aria-expanded', menu.open ? 'true' : 'false');
    };
    menu.addEventListener('toggle', syncMenu);
    syncMenu();
    menu.querySelectorAll('.nav-menu-panel a').forEach(function (a) {
      a.addEventListener('click', function () { menu.open = false; });
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && menu.open) {
        event.preventDefault();
        menu.open = false;
        menuSummary.focus();
      }
    });
    document.addEventListener('click', function (event) {
      if (menu.open && !menu.contains(event.target)) menu.open = false;
    });
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      applyLang(root.lang === 'fa' ? 'en' : 'fa', true);
    });
  }

  var requested = null;
  try { requested = new URLSearchParams(window.location.search).get('lang'); } catch (e) {}
  var initial = valid.indexOf(requested) !== -1 ? requested : (safeStorageGet('site-lang') || root.getAttribute('data-default-locale') || root.lang || 'fa');
  applyLang(initial, false);

  if (nav) {
    var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 40); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  var current = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.nav-menu-panel a').forEach(function (a) {
    var path = (a.getAttribute('href') || '').split('?')[0].split('#')[0];
    var file = (path.split('/').pop() || '').toLowerCase();
    if (!file) file = path === '/' ? 'index.html' : '';
    if (file && file === current) {
      a.classList.add('active');
      a.setAttribute('aria-current', 'page');
    }
  });
})();
