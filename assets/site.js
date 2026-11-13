/* Shared behavior for the bilingual public site. */
(function () {
  'use strict';

  var root = document.documentElement;
  var burger = document.getElementById('burger');
  var mobile = document.getElementById('navMobile');
  var toggle = document.getElementById('langToggle');
  var nav = document.getElementById('nav');
  var valid = ['fa', 'en'];
  var isOpen = false;

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
      toggle.setAttribute('aria-label', lang === 'fa' ? 'تغییر زبان به انگلیسی' : 'Switch language to Persian');
      toggle.setAttribute('title', lang === 'fa' ? 'English' : 'فارسی');
    }

    if (burger) burger.setAttribute('aria-label', menuLabel(isOpen));

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

  function menuLabel(next) {
    var fa = root.lang !== 'en';
    if (fa) return next ? 'بستن منو' : 'باز کردن منو';
    return next ? 'Close menu' : 'Open menu';
  }

  function menuLinks() {
    if (!mobile) return [];
    return Array.prototype.filter.call(mobile.querySelectorAll('a'), function (a) {
      return a.offsetParent !== null;
    });
  }

  function setMenu(next) {
    if (!mobile || !burger) return;
    isOpen = !!next;
    mobile.classList.toggle('open', isOpen);
    burger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    burger.setAttribute('aria-label', menuLabel(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
    void mobile.offsetHeight; // flush layout so the panel is measurable before focusing
  }

  function closeMenu(restoreFocus) {
    if (!isOpen) return;
    setMenu(false);
    if (restoreFocus && burger) burger.focus();
  }

  if (burger && mobile) {
    burger.addEventListener('click', function () {
      if (isOpen) { closeMenu(true); return; }
      setMenu(true);
      var links = menuLinks();
      if (links.length) links[0].focus();
    });
    mobile.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { closeMenu(false); }); });
    mobile.addEventListener('click', function (event) {
      if (event.target === mobile) closeMenu(false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && isOpen) { event.preventDefault(); closeMenu(true); return; }
      if (event.key !== 'Tab' || !isOpen) return;
      var focusables = [burger].concat(menuLinks());
      if (!focusables.length) return;
      event.preventDefault();
      var index = focusables.indexOf(document.activeElement);
      if (index === -1) index = event.shiftKey ? 0 : -1;
      var next = (index + (event.shiftKey ? -1 : 1) + focusables.length) % focusables.length;
      focusables[next].focus();
    });
    document.addEventListener('click', function (event) {
      if (isOpen && !mobile.contains(event.target) && !burger.contains(event.target)) closeMenu(false);
    });
    var mobileQuery = window.matchMedia('(max-width: 820px)');
    var onViewportChange = function (event) { if (!event.matches) closeMenu(false); };
    if (mobileQuery.addEventListener) mobileQuery.addEventListener('change', onViewportChange);
    else if (mobileQuery.addListener) mobileQuery.addListener(onViewportChange);
    window.addEventListener('resize', function () {
      if (window.innerWidth > 820) closeMenu(false);
    }, { passive: true });
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
  document.querySelectorAll('.nav-links a, .nav-mobile a').forEach(function (a) {
    var href = (a.getAttribute('href') || '').split('?')[0].toLowerCase();
    if (href === current || (current === 'index.html' && (href === '/' || href === 'index.html'))) {
      a.classList.add('active');
      a.setAttribute('aria-current', 'page');
    }
  });
})();
