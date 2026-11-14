/* Demo-only fetch shim: the published demo has no backend. */
(function () {
  var nativeFetch = window.fetch ? window.fetch.bind(window) : null;
  function json(payload, status) {
    return Promise.resolve(new Response(JSON.stringify(payload), {
      status: status || 200,
      headers: { 'Content-Type': 'application/json' }
    }));
  }
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    var path = url.replace(/^https?:\/\/[^/]+/, '');
    if (path.indexOf('/api/submit') === 0) {
      return json({ ok: true, id: 'DEMO-' + Date.now().toString(36).toUpperCase(), demo: true });
    }
    if (path.indexOf('/api/') === 0) {
      return json({ ok: true, demo: true });
    }
    return nativeFetch ? nativeFetch(input, init) : Promise.reject(new Error('offline'));
  };

  /* Mark every success box so visitors never mistake the demo for a real submission. */
  var NOTE_FA = ' (نسخهٔ نمایشی — ارسالی انجام نشد)';
  var NOTE_EN = ' (demo only — nothing was sent)';
  function mark() {
    document.querySelectorAll('.form-feedback.success').forEach(function (el) {
      if (el.textContent.indexOf('نسخهٔ نمایشی') !== -1 || el.textContent.indexOf('demo only') !== -1) return;
      var en = document.documentElement.lang === 'en';
      el.insertAdjacentHTML('beforeend', '<span style="display:block;margin-top:6px;font-size:12px;opacity:.75">' + (en ? NOTE_EN : NOTE_FA) + '</span>');
    });
  }
  var observer = new MutationObserver(mark);
  document.addEventListener('DOMContentLoaded', function () {
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
    mark();
  });
})();
