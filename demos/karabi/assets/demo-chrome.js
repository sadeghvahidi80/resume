/* Demo chrome: ribbon + demo styles, mounted after hydration. */
(function () {
  var CSS = "\n  .demo-ribbon{position:relative;z-index:99999;display:flex;flex-wrap:wrap;align-items:center;\n    justify-content:center;gap:10px;padding:10px 18px;background:#0b1b33;color:#f6ecd2;\n    font-family:system-ui,-apple-system,\"Segoe UI\",Tahoma,sans-serif;font-size:13px;line-height:1.8;text-align:center;\n    border-bottom:2px solid #d9b45b;direction:rtl}\n  .demo-ribbon b{background:#d9b45b;color:#0b1b33;border-radius:999px;padding:1px 10px;font-size:12px;font-weight:700}\n  .demo-ribbon a{color:#d9b45b;text-decoration:none;border-bottom:1px solid rgba(217,180,91,.45)}\n  .demo-ribbon a:hover{border-bottom-color:#d9b45b}\n  .demo-toast{position:fixed;inset-inline:0;bottom:24px;margin-inline:auto;max-width:min(92vw,420px);\n    z-index:100000;background:#0b1b33;color:#f6ecd2;border:1px solid #d9b45b;border-radius:14px;\n    padding:12px 16px;font:13px/1.8 system-ui,-apple-system,\"Segoe UI\",Tahoma,sans-serif;direction:rtl;\n    box-shadow:0 12px 30px rgba(0,0,0,.28);opacity:0;transform:translateY(8px);\n    transition:opacity .18s ease,transform .18s ease;pointer-events:none}\n  .demo-toast.on{opacity:1;transform:translateY(0)}\n  @media (max-width:640px){.demo-ribbon{font-size:12px;padding:8px 12px}}\n";

  function siteRoot() {
    var s = location.pathname.split('/').filter(Boolean);
    if (s.length && /\.[a-z0-9]+$/i.test(s[s.length - 1])) s.pop();
    var i = s.lastIndexOf('demos');
    if (i > 0) return '/' + s.slice(0, i).join('/') + '/';
    return '/';
  }

  function mount() {
    if (document.getElementById('demo-chrome')) return;
    var style = document.createElement('style');
    style.id = 'demo-chrome-style';
    style.textContent = CSS;
    document.head.appendChild(style);

    var bar = document.createElement('div');
    bar.id = 'demo-chrome';
    bar.className = 'demo-ribbon';
    bar.setAttribute('role', 'note');

    var badge = document.createElement('b');
    badge.textContent = '\u062f\u0645\u0648';

    var text = document.createElement('span');
    text.textContent = '\u0646\u0633\u062e\u0647\u0654 \u0646\u0645\u0627\u06cc\u0634\u06cc \u0631\u0627\u0628\u0637 \u06a9\u0627\u0631\u0628\u0631\u06cc\u061b \u062f\u0627\u062f\u0647\u200c\u0647\u0627 \u0646\u0645\u0648\u0646\u0647\u200c\u0627\u0646\u062f \u0648 \u062f\u0631\u062e\u0648\u0627\u0633\u062a \u0648\u0627\u0642\u0639\u06cc \u062b\u0628\u062a \u0646\u0645\u06cc\u200c\u0634\u0648\u062f.';

    var back = document.createElement('a');
    back.href = siteRoot() + 'projects.html#karabi';
    back.textContent = '\u0628\u0627\u0632\u06af\u0634\u062a \u0628\u0647 \u0646\u0645\u0648\u0646\u0647\u200c\u06a9\u0627\u0631 \u067e\u0631\u0648\u0698\u0647 \u0645\u0647\u0646\u062f\u0633 \u06a9\u0631\u0627\u0628\u06cc \u2190';

    bar.appendChild(badge);
    bar.appendChild(text);
    bar.appendChild(back);
    document.body.insertBefore(bar, document.body.firstChild);
  }

  function later() { setTimeout(mount, 80); }
  if (document.readyState === 'complete') later();
  else window.addEventListener('load', later);
})();
