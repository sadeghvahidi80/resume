/* Ravanyar UI: mobile menu + bilingual rule-based chatbot (no backend needed) */
(function () {
  // ---------- mobile menu ----------
  var btn = document.getElementById("menu-btn");
  var panel = document.getElementById("mnav-panel");
  var back = document.getElementById("mnav-backdrop");
  function closeMenu() {
    if (panel) panel.classList.remove("show");
    if (back) back.classList.remove("show");
    if (btn) btn.classList.remove("open");
  }
  if (btn && panel) {
    btn.addEventListener("click", function () {
      var open = panel.classList.toggle("show");
      if (back) back.classList.toggle("show", open);
      btn.classList.toggle("open", open);
    });
    var c = document.getElementById("mnav-close");
    if (c) c.addEventListener("click", closeMenu);
    if (back) back.addEventListener("click", closeMenu);
    panel.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", closeMenu); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });
  }

  // ---------- chatbot ----------
  var KB = {
    fa: {
      name: "دستیار روان‌یار",
      online: "پاسخگوی خودکار • برای بحران با ۱۱۵ تماس بگیرید",
      ph: "سوالت را بنویس...",
      send: "ارسال",
      chips: ["هزینه چقدر است؟", "روند کار چگونه است؟", "می‌خواهم کمک مالی کنم", "در بحرانم!"],
      hello: "سلام! من دستیار روان‌یارم. درباره روند حمایت، همکاری درمانگران یا کمک مالی بپرس — یا یکی از دکمه‌ها را بزن.",
      rules: [
        { k: ["سلام", "درود", "هی", "وقت بخیر", "صبح بخیر"], t: "سلام! چطور کمکت کنم؟ می‌توانی درباره روند، هزینه یا کمک مالی بپرسی." },
        { k: ["هزینه", "قیمت", "رایگان", "پول", "شهریه"], t: "هماهنگی شبکه رایگان است. حمایت مالی (تا سقف معادل ساعتی ۵ پوند برای هر جلسه) بر اساس نیاز و ظرفیت، کنار سهم مراجع یا تخفیف درمانگر پرداخت می‌شود." },
        { k: ["روند", "مراحل", "چگونه", "چطور", "شروع", "مسیر"], t: "مسیر: ۱) ثبت درخواست محرمانه ۲) بررسی نیاز مالی ۳) معرفی درمانگر متناسب ۴) شروع جلسات با حمایت مالی. از بخش «فرآیند» هم ببین." },
        { k: ["درمانگر", "تراپیست", "مشاور", "همکاری"], t: "درمانگران حرفه‌ای می‌توانند ظرفیت ماهانه، حوزه تخصص و تعرفه حمایتی خود را در «فرم درمانگر» ثبت کنند. استقلال بالینی کاملاً با درمانگر است." },
        { k: ["کمک مالی", "دونیت", "پرداخت", "حمایت مالی", "donate", "کمک می"], t: "ممنون از لطفت! در «فرم کمک مالی» آمادگی‌ات را ثبت کن، بعد از یکی از سه مسیر ریالی، ارزی یا رمزارز در بخش پرداخت اقدام کن." },
        { k: ["بحران", "خودکشی", "فوری", "خطر", "اضطراری"], t: "CRISIS", crisis: true },
        { k: ["تماس", "ارتباط", "تلگرام", "ایمیل", "پشتیبانی"], t: "راه ارتباطی: تلگرام Blueberry_SweetSour@ و اینستاگرام روان‌یار" },
        { k: ["شرایط", "واجد", "چه کسی", "کی"], t: "اولویت با ساکنان ایران است که به‌دلیل وضعیت مالی امکان پرداخت هزینه درمان را ندارند." },
        { k: ["وقت", "زمان", "طولانی", "نوبت"], t: "زمان بررسی هر درخواست متفاوت است؛ سطح فوریت را در فرم مشخص کن تا سریع‌تر رسیدگی شود." },
        { k: ["مجله", "مقاله", "مطلب", "خواندن"], t: "در بخش «مجله» ۶ مطلب کوتاه داریم: سوگ، اضطراب، تروما، فرسودگی، افسردگی و خانواده." },
        { k: ["ویدیو", "فیلم", "کلیپ"], t: "دو ویدیوی معرفی در بخش «ویدیو معرفی» صفحه اصلی است." },
        { k: ["مرسی", "ممنون", "تشکر", "عالی"], t: "خواهش می‌کنم! اگر سوال دیگری داری در خدمتم." },
        { k: ["خداحافظ", "بای", "فعلا"], t: "به امید دیدار! مراقب خودت باش." }
      ],
      crisis: "اگر در خطر فوری هستی، همین حالا با اورژانس (۱۱۵) یا اورژانس اجتماعی (۱۲۳) تماس بگیر. این شبکه جایگزین کمک اضطراری نیست — اول با آن‌ها تماس بگیر، بعد برای ادامه مسیر اینجاییم.",
      fallback: "متوجه نشدم. می‌توانی درباره «هزینه»، «روند»، «درمانگر» یا «کمک مالی» بپرسی — یا از تلگرام با تیم در ارتباط باش."
    },
    en: {
      name: "Ravan Yar Assistant",
      online: "Auto-replies • In crisis call 115",
      ph: "Type your question...",
      send: "Send",
      chips: ["How much does it cost?", "How does it work?", "I want to donate", "I am in crisis!"],
      hello: "Hi! I am the Ravan Yar assistant. Ask about the process, costs or donations — or tap a button below.",
      rules: [
        { k: ["hello", "hi", "hey", "salam"], t: "Hello! How can I help? Ask about the process, costs or donations." },
        { k: ["cost", "price", "free", "fee", "money"], t: "Coordination is free. Financial support (up to ~£5 per session) is offered based on need and capacity, alongside the client's share or the therapist's discount." },
        { k: ["process", "how", "steps", "start", "work"], t: "The path: 1) confidential request 2) financial-need review 3) matched therapist 4) sessions begin with support. See the Process section too." },
        { k: ["therapist", "collaborat", "join", "register"], t: "Professional therapists can register monthly capacity, specialties and supportive rates in the Therapist form. Full clinical independence stays with the therapist." },
        { k: ["donat", "pay", "give", "contribut"], t: "Thank you! Pledge in the Donation form, then give via Rial, FX or crypto in the Payments section." },
        { k: ["crisis", "suicide", "urgent", "emergency", "danger"], t: "CRISIS", crisis: true },
        { k: ["contact", "telegram", "email", "support", "call"], t: "Contact: Telegram @Blueberry_SweetSour and Ravan Yar on Instagram" },
        { k: ["who", "eligib", "condition"], t: "Priority is for Iran residents who cannot afford therapy costs." },
        { k: ["time", "long", "wait"], t: "Review times vary; mark urgency in the form for faster handling." },
        { k: ["magazine", "article", "blog", "read"], t: "The Magazine has 6 short reads: grief, anxiety, trauma, burnout, depression and family." },
        { k: ["video", "film", "clip"], t: "Two intro videos are in the Intro videos section." },
        { k: ["thanks", "thank", "great"], t: "You are welcome! Anything else?" },
        { k: ["bye"], t: "Take care of yourself!" }
      ],
      crisis: "If you are in immediate danger, call emergency services (115) or social emergency (123) right now. This network is not a substitute for emergency help — call them first; we are here for what comes after.",
      fallback: "I did not get that. Ask about cost, process, therapists or donations — or reach the team on Telegram."
    }
  };
  function lang() {
    try { return localStorage.getItem("psy_lang") || "fa"; } catch (e) { return "fa"; }
  }
  var root = document.getElementById("chatbot-root");
  if (!root) return;
  root.innerHTML =
    '<button class="cb-fab" id="cb-fab" aria-label="chat"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5z"/></svg></button>' +
    '<div class="cb-panel" id="cb-panel" role="dialog" aria-label="chat">' +
    '<div class="cb-head"><span class="cb-dot"></span><div><b id="cb-name"></b><small id="cb-online"></small></div>' +
    '<button class="cb-close" id="cb-close" aria-label="close">×</button></div>' +
    '<div class="cb-body" id="cb-body"></div>' +
    '<div class="cb-chips" id="cb-chips"></div>' +
    '<div class="cb-input"><input id="cb-text" type="text"><button id="cb-send"></button></div></div>';

  var fab = document.getElementById("cb-fab"),
      panelEl = document.getElementById("cb-panel"),
      body = document.getElementById("cb-body"),
      chips = document.getElementById("cb-chips"),
      input = document.getElementById("cb-text"),
      send = document.getElementById("cb-send"),
      greeted = false;

  function texts() { return KB[lang()] || KB.fa; }
  function paint() {
    var T = texts();
    document.getElementById("cb-name").textContent = T.name;
    document.getElementById("cb-online").textContent = T.online;
    input.placeholder = T.ph;
    send.textContent = T.send;
    chips.innerHTML = "";
    T.chips.forEach(function (c) {
      var b = document.createElement("button");
      b.className = "cb-chip"; b.textContent = c;
      b.addEventListener("click", function () { ask(c); });
      chips.appendChild(b);
    });
  }
  function bubble(text, cls) {
    var d = document.createElement("div");
    d.className = "cb-msg " + cls;
    d.textContent = text;
    body.appendChild(d);
    body.scrollTop = body.scrollHeight;
  }
  function answer(q) {
    var T = texts(), s = q.toLowerCase();
    for (var i = 0; i < T.rules.length; i++) {
      var r = T.rules[i];
      for (var j = 0; j < r.k.length; j++) {
        if (s.indexOf(r.k[j].toLowerCase()) >= 0) {
          if (r.crisis) { bubble(T.crisis, "cb-bot cb-hotline"); return; }
          return r.t;
        }
      }
    }
    return T.fallback;
  }
  function ask(q) {
    bubble(q, "cb-user");
    input.value = "";
    var typing = document.createElement("div");
    typing.className = "cb-msg cb-bot"; typing.textContent = "…";
    setTimeout(function () {
      body.appendChild(typing);
      body.scrollTop = body.scrollHeight;
    }, 150);
    setTimeout(function () {
      typing.remove();
      var a = answer(q);
      if (typeof a === "string") bubble(a, "cb-bot");
    }, 700);
  }
  fab.addEventListener("click", function () {
    var open = panelEl.classList.toggle("show");
    if (open) {
      paint();
      if (!greeted) { greeted = true; bubble(texts().hello, "cb-bot"); }
      setTimeout(function () { input.focus(); }, 100);
    }
  });
  document.getElementById("cb-close").addEventListener("click", function () {
    panelEl.classList.remove("show");
  });
  send.addEventListener("click", function () {
    if (input.value.trim()) ask(input.value.trim());
  });
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && input.value.trim()) ask(input.value.trim());
  });
})();
