/* Demo router: map captured app routes onto static folders. */
(function () {
  /* The captured app registers a service worker that would fetch RSC routes
     this static demo does not publish. Retire it and drop its caches. */
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function (regs) {
      regs.forEach(function (r) { r.unregister(); });
    }).catch(function () {});
  }
  if (window.caches && caches.keys) {
    caches.keys().then(function (keys) {
      keys.forEach(function (k) { caches.delete(k); });
    }).catch(function () {});
  }

  var MAP = {
    '/': 'index.html',
    '/repair-request': 'repair-request/index.html',
    '/services': 'repair-request/index.html',
    '/about': 'about/index.html',
    '/contact': 'contact/index.html',
    '/magazine': 'magazine/index.html',
    '/process': 'process/index.html',
    '/privacy': 'privacy/index.html',
    '/repair-request/success': 'repair-request/success/index.html'
  };
  var ROOT_HINTS = /\/(repair-request|about|contact|magazine|process|privacy)\//;

  function prefix() {
    // depth below the demo root, using this page's own location
    var p = location.pathname.replace(/\/[^/]*\.[a-z0-9]+$/i, '');
    var segs = p.split('/').filter(Boolean);
    var idx = segs.lastIndexOf('karabi');
    var depth = idx === -1 ? Math.max(segs.length - 1, 0) : segs.length - idx - 1;
    if (depth < 0) depth = 0;
    return new Array(depth + 1).join('../');
  }

  var PREFIX = prefix();

  function toast(text) {
    var el = document.createElement('div');
    el.className = 'demo-toast';
    el.textContent = text;
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('on'); });
    setTimeout(function () {
      el.classList.remove('on');
      setTimeout(function () { el.remove(); }, 300);
    }, 2600);
  }

  function target(href) {
    if (!href || href.charAt(0) !== '/') return null;
    var clean = href.split('#')[0];
    var q = clean.indexOf('?');
    var path = q === -1 ? clean : clean.slice(0, q);
    var query = q === -1 ? '' : clean.slice(q);
    path = path.replace(/\/+$/, '') || '/';
    // tolerate a /demos/karabi prefix if the page was opened through it
    path = path.replace(/^.*\/demos\/karabi(?=\/|$)/, '') || '/';
    if (MAP[path]) return PREFIX + MAP[path] + query;
    return null;
  }

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) !== '/') return;
    var dest = target(href);
    e.preventDefault();
    e.stopPropagation();
    if (dest) {
      location.href = dest;
    } else {
      toast('این صفحه در نسخهٔ نمایشی موجود نیست؛ فقط خانه، ثبت درخواست، درباره، تماس، مجله و فرایند قابل مشاهده‌اند.');
    }
  }, true);

  window.__demoRouter = { target: target, toast: toast };

  /* The wizard reads ?service= through the router, which keeps the build-time
     search params on a static page; apply the selection after hydration. */
  function applyPreselect() {
    if (location.pathname.indexOf('repair-request') === -1) return;
    var params = new URLSearchParams(location.search);
    var sid = params.get('service');
    if (!sid) return;
    var tries = 0;
    var timer = setInterval(function () {
      var sel = document.getElementById('rr-serviceId');
      var has = sel && Array.prototype.some.call(sel.options, function (o) {
        return o.value === sid;
      });
      if (sel && has && sel.value !== sid) {
        sel.value = sid;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
        clearInterval(timer);
        return;
      }
      if ((sel && has) || ++tries > 40) clearInterval(timer);
    }, 150);
  }

  if (document.readyState === 'complete') applyPreselect();
  else window.addEventListener('load', applyPreselect);
})();
