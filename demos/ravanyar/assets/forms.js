/* Ravanyar forms — server-first, privacy-conscious submission engine. */
(function () {
  function revealAll() { document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible')); }
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('visible'); io.unobserve(en.target); }
    }), { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
    setTimeout(revealAll, 3000);
  } else revealAll();

  function T(key, fb) { try { return window.psyStrings?.[key] ?? fb; } catch (_) { return fb; } }
  function lang() { try { return localStorage.getItem('psy_lang') || 'fa'; } catch (_) { return 'fa'; } }
  function fieldLabel(el) {
    const g = el.closest('.form-group');
    const l = g && g.querySelector(':scope > label');
    return (l?.textContent || el.getAttribute('placeholder') || el.name || 'field').trim();
  }
  function controlValue(el) {
    if (el.tagName === 'SELECT') return el.options[el.selectedIndex]?.textContent.trim() || '';
    return String(el.value || '').trim();
  }
  function capture(scope) {
    const items = [];
    scope.querySelectorAll('.form-group').forEach(g => {
      const lab = g.querySelector(':scope > label');
      const ctrls = g.querySelectorAll('input:not([type="hidden"]), textarea, select');
      if (!ctrls.length) {
        const tags = Array.from(g.querySelectorAll('.tag-btn.active')).map(b => b.textContent.trim());
        const radio = g.querySelector('.radio-option.active');
        const vals = tags.length ? tags : (radio ? [radio.textContent.trim().replace(/\s+/g, ' ')] : []);
        if (vals.length) items.push({ f: lab?.textContent.trim() || '', v: vals.join('، ') });
        return;
      }
      ctrls.forEach(el => {
        if (el.type === 'checkbox') return;
        items.push({ f: lab?.textContent.trim() || fieldLabel(el), v: controlValue(el) });
      });
    });
    scope.querySelectorAll('.checkbox-group .checkbox-item').forEach(label => {
      const box = label.querySelector('input[type="checkbox"]');
      const sp = label.querySelector('span');
      if (box && sp) items.push({ f: sp.textContent.trim(), v: box.checked ? '✓' : '—' });
    });
    return items;
  }
  function showMessage(scope, id, message, kind) {
    let box = document.getElementById(id);
    if (!box) {
      box = document.createElement('div'); box.id = id; box.className = 'form-success';
      const submit = scope.querySelector('.form-submit');
      submit?.insertAdjacentElement('afterend', box);
    }
    box.className = `form-feedback ${kind || 'success'}`;
    box.setAttribute('role', kind === 'error' ? 'alert' : 'status');
    box.textContent = message;
    box.style.display = 'block';
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function needVal(scope, sel) { return (scope.querySelector(sel)?.value || '').trim(); }

  document.querySelectorAll('.tag-group').forEach(group => group.addEventListener('click', e => {
    const btn = e.target.closest('.tag-btn');
    if (!btn) return;
    btn.classList.toggle('active');
    btn.setAttribute('aria-pressed', btn.classList.contains('active') ? 'true' : 'false');
  }));
  document.querySelectorAll('.radio-group').forEach(group => group.addEventListener('click', e => {
    const opt = e.target.closest('.radio-option'); if (!opt) return;
    group.querySelectorAll('.radio-option').forEach(o => { o.classList.remove('active'); o.setAttribute('aria-checked', 'false'); });
    opt.classList.add('active'); opt.setAttribute('aria-checked', 'true');
  }));

  function handle(scopeId, form, successId, successKey, validate) {
    const scope = document.getElementById(scopeId); if (!scope) return;
    const btn = scope.querySelector('.form-submit button'); if (!btn) return;
    btn.type = 'button';
    btn.addEventListener('click', async () => {
      if (validate && !validate(scope)) return;
      btn.disabled = true;
      const old = btn.textContent;
      btn.textContent = lang() === 'en' ? 'Sending…' : 'در حال ارسال…';
      try {
        const r = await fetch('/api/submit', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ form, lang: lang(), items: capture(scope), website: '' })
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok || !data.ok) throw new Error(data.error || 'submit_failed');
        showMessage(scope, successId, T(successKey, lang() === 'en' ? 'Submitted successfully.' : 'ثبت با موفقیت انجام شد.'), 'success');
        btn.textContent = T('done_label', lang() === 'en' ? 'Submitted ✓' : 'ثبت شد ✓');
      } catch (_) {
        btn.disabled = false; btn.textContent = old;
        showMessage(scope, successId, lang() === 'en' ? 'Submission failed. Please check your connection and try again.' : 'ارسال انجام نشد. اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.', 'error');
      }
    });
  }

  handle('therapist-form', 'therapist', 'success-therapist', 'thf_success', scope => {
    if (!needVal(scope, '.form-grid .form-group input')) { alert(T('alert_need', 'لطفاً نام و اطلاعات تماس را کامل کنید.')); return false; }
    return true;
  });
  handle('applicant-form', 'applicant', 'success-applicant', 'appf_success', scope => {
    const grids = scope.querySelectorAll('.form-grid .form-group input');
    if (!(grids[1]?.value || '').trim()) { alert(T('alert_need', 'لطفاً اطلاعات تماس را کامل کنید.')); return false; }
    return true;
  });
  handle('donate-form', 'donate', 'success-donate', 'donf_success', scope => {
    if (!needVal(scope, '#donate-name') || !needVal(scope, '#donate-contact')) { alert(T('alert_need', 'لطفاً نام و اطلاعات تماس را کامل کنید.')); return false; }
    const agree = scope.querySelector('#donate-agree');
    if (agree && !agree.checked) { alert(T('alert_agree', 'لطفاً تأیید داوطلبانه بودن کمک را بزنید.')); return false; }
    return true;
  });
  handle('hamyar-form', 'hamyar', 'success-hamyar', 'hamf_success', scope => {
    if (!needVal(scope, '#hamyar-name') || !needVal(scope, '#hamyar-contact')) { alert(T('alert_need', 'لطفاً نام و اطلاعات تماس را کامل کنید.')); return false; }
    return true;
  });
})();
