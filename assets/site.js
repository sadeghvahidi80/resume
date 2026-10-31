/* Shared site behavior — sadeghvahidi.ir */
(function () {
  'use strict';

  var burger = document.getElementById('burger');
  var navMobile = document.getElementById('navMobile');
  var toggle = document.getElementById('langToggle');
  var nav = document.getElementById('nav');

  if (burger && navMobile) {
    burger.addEventListener('click', function () {
      var open = navMobile.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    navMobile.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        navMobile.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  function applyLang(lang) {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
    if (toggle) toggle.textContent = lang === 'fa' ? 'EN' : 'FA';
    try { localStorage.setItem('site-lang', lang); } catch (e) {}
  }

  if (toggle) {
    var saved = 'fa';
    try { saved = localStorage.getItem('site-lang') || 'fa'; } catch (e) {}
    applyLang(saved);
    toggle.addEventListener('click', function () {
      applyLang(document.documentElement.lang === 'fa' ? 'en' : 'fa');
    });
  }

  if (nav) {
    window.addEventListener('scroll', function () {
      nav.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });
  }

  // Highlight current page in nav
  var path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  if (!path || path === '') path = 'index.html';
  document.querySelectorAll('.nav-links a, .nav-mobile a').forEach(function (a) {
    var href = (a.getAttribute('href') || '').toLowerCase();
    if (href === path || (path === 'index.html' && (href === '/' || href === 'index.html'))) {
      a.classList.add('active');
    }
  });
})();
