/* Demo data shim: no backend, no real requests. */
(function () {
  var nativeFetch = window.fetch ? window.fetch.bind(window) : null;

  function json(payload, status) {
    return Promise.resolve(new Response(JSON.stringify(payload), {
      status: status || 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    }));
  }

  var services = [
    ['تعمیر یخچال', 'refrigerator', 'تعمیر یخچال فریزر و ساید بای ساید', 1],
    ['تعمیر لباسشویی', 'washing-machine', 'تعمیر ماشین لباسشویی اتوماتیک', 2],
    ['تعمیر ظرفشویی', 'dishwasher', 'تعمیر ماشین ظرفشویی', 3],
    ['تلویزیون', 'television', 'تعمیر تلویزیون LED و LCD', 4],
    ['جاروبرقی', 'vacuum-cleaner', 'تعمیر جاروبرقی', 5],
    ['پکیج و بخاری', 'boiler-package', 'تعمیر پکیج و بخاری دیواری', 6],
    ['آبگرمکن', 'water-heater', 'تعمیر آبگرمکن', 7],
    ['کولر گازی', 'air-conditioner', 'تعمیر کولر گازی و اسپلیت', 8],
    ['اجاق گاز', 'oven-stove', 'تعمیر اجاق گاز و فر', 9],
    ['مایکروفر', 'microwave', 'تعمیر مایکروفر', 10],
    ['سایر لوازم خانگی', 'other-appliances', 'تعمیر سایر لوازم خانگی', 11]
  ].map(function (s) {
    return {
      id: s[1] + '-0000-0000-0000-000000000000',
      title: s[0], slug: s[1], description: s[2], displayOrder: s[3],
      imageUrl: '/services/' + s[1] + '.webp'
    };
  });

  var brands = [
    ['سامسونگ', 'samsung'], ['ال جی', 'lg'], ['بوش', 'bosch'], ['بکو', 'beko'],
    ['دوو', 'daewoo'], ['ایستنا', 'estina'], ['اسنوا', 'snowa'], ['پارس', 'pars'],
    ['جنرال الکتریک', 'ge'], ['هایر', 'haier']
  ].map(function (b, i) {
    return {
      id: b[1] + '-1111-1111-1111-000000000000',
      title: b[0], slug: b[1], description: 'تعمیر تخصصی لوازم خانگی ' + b[0],
      authorization: false, logoUrl: '/brands/' + b[1] + '.svg', displayOrder: i + 1
    };
  });

  var areas = [
    { id: 'sabzevar', type: 'CITY', name: 'سبزوار', slug: 'sabzevar', isServiceable: true, seoEnabled: true, parentId: null, children: [] },
    { id: 'other', type: 'OTHER', name: 'سایر مناطق و حومه سبزوار', slug: 'other-surrounding-areas', isServiceable: true, seoEnabled: false, parentId: null, children: [] }
  ];

  var articles = [{
    id: 'a1',
    title: 'تعمیرات لوازم خانگی در سبزوار: راهنمای کامل تعمیر یخچال و لباسشویی',
    slug: 'tamirat-lavazem-khanegi-sabzevar',
    summary: 'خرابی یخچال یا لباسشویی می‌تواند کارهای روزمره را مختل کند. اگر در سبزوار هستید، پیش از تصمیم برای تعمیر یا تعویض، نشانه‌های خرابی و راه انتخاب تعمیرکار را بشناسید.',
    coverImageUrl: '/articles/01-home-appliance-repair-sabzevar-hero.webp',
    authorName: 'تیم محتوا',
    publishedAt: '2026-09-20T09:00:00.000Z'
  }];

  function pathOf(url) {
    try { return new URL(url, location.href).pathname; } catch (e) { return ''; }
  }

  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    var path = pathOf(url);

    // Freeze App Router client navigation: this demo has no RSC server.
    if (url.indexOf('_rsc=') !== -1) return new Promise(function () {});

    if (path.indexOf('/api/') !== 0) {
      return nativeFetch ? nativeFetch(input, init) : Promise.reject(new Error('offline'));
    }
    if (path === '/api/public/services') return json(services);
    if (path === '/api/public/brands') return json(brands);
    if (path === '/api/public/areas') return json(areas);
    if (path === '/api/public/articles') return json(articles);
    if (path === '/api/public/pages/terms' || path === '/api/public/pages/privacy') return json(null);
    if (path === '/api/otp/request') return json({ ok: true, challengeId: 'demo-challenge' });
    if (path === '/api/otp/verify') return json({ ok: true, verificationToken: 'demo-token' });
    if (path.indexOf('/api/analytics') === 0) return new Response(null, { status: 204 });
    if (path === '/api/requests') {
      /* The app navigates to /repair-request/success itself, which is root
         absolute and does not exist in a static demo. Navigate first, then
         leave the promise pending so the app's own push never runs. */
      var ref = 'KAR-DEMO-1042';
      var base = location.pathname.replace(/\/[^/]*$/, '/').replace(/\/repair-request\/$/, '/');
      location.replace(base + 'repair-request/success/index.html?ref=' + ref);
      return new Promise(function () {});
    }
    if (path.indexOf('/api/public/services/') === 0) {
      var s = services.filter(function (x) { return x.slug === path.split('/').pop(); })[0];
      return json(s || null);
    }
    if (path.indexOf('/api/public/brands/') === 0) {
      var b = brands.filter(function (x) { return x.slug === path.split('/').pop(); })[0];
      return json(b || null);
    }
    return json({ ok: true, demo: true });
  };
})();
