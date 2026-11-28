(function () {
  "use strict";

  var player = document.getElementById("player");
  var audio = document.getElementById("audio");
  var button = document.getElementById("play");
  var ring = document.getElementById("ring");
  var current = document.getElementById("cur");
  var total = document.getElementById("dur");
  var errorBox = document.getElementById("err");

  if (!player || !audio || !button || !ring) return;

  var CIRC = 2 * Math.PI * 56;
  var source = audio.getAttribute("src") || audio.src;

  var mode = "element"; // "element" | "webaudio"
  var ctx = null;
  var buffer = null;
  var pending = null;
  var node = null;
  var startedAt = 0;
  var offset = 0;
  var frame = 0;
  var loading = false;

  function toPersian(value) {
    return String(value).replace(/\d/g, function (digit) {
      return "۰۱۲۳۴۵۶۷۸۹"[Number(digit)];
    });
  }

  function format(seconds) {
    if (!isFinite(seconds) || seconds < 0) return "—";
    var rounded = Math.round(seconds);
    var minutes = Math.floor(rounded / 60);
    var rest = rounded % 60;
    return toPersian(minutes) + ":" + toPersian(String(rest).padStart(2, "0"));
  }

  function duration() {
    if (mode === "webaudio") return buffer ? buffer.duration : 0;
    return audio.duration;
  }

  function position() {
    if (mode === "element") return audio.currentTime;
    if (!node) return offset;
    var limit = buffer ? buffer.duration : Infinity;
    return Math.min(limit, offset + (ctx.currentTime - startedAt));
  }

  function paint() {
    var whole = duration();
    var now = position();
    var progress = whole ? Math.min(1, now / whole) : 0;
    ring.style.strokeDashoffset = String(CIRC * (1 - progress));
    current.textContent = format(now);
  }

  function setPlaying(isPlaying) {
    player.classList.toggle("is-playing", isPlaying);
    button.setAttribute("aria-label", isPlaying ? "توقف پخش" : "پخش صدا");
    button.setAttribute("aria-pressed", isPlaying ? "true" : "false");
  }

  function showError() {
    if (!errorBox) return;
    errorBox.hidden = false;
    errorBox.textContent = "صدا باز نشد. اتصال اینترنت را بررسی کن و دوباره لمس کن.";
  }

  /* ---------- پخش با Web Audio ----------
     بعضی میزبان‌ها با Content-Security-Policy تگ <audio> را بلاک می‌کنند.
     در آن حالت فایل را با fetch می‌گیریم و با AudioContext پخش می‌کنیم. */

  function ensureContext() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) throw new Error("AudioContext پشتیبانی نمی‌شود");
      ctx = new AC();
    }
    if (ctx.state === "suspended" && ctx.resume) ctx.resume();
    return ctx;
  }

  function loadBuffer() {
    if (buffer) return Promise.resolve(buffer);
    if (pending) return pending;

    pending = fetch(source, { credentials: "same-origin" })
      .then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.arrayBuffer();
      })
      .then(function (data) {
        return new Promise(function (resolve, reject) {
          var settled = false;
          var done = function (decoded) {
            if (settled) return;
            settled = true;
            buffer = decoded;
            resolve(decoded);
          };
          var fail = function (error) {
            if (settled) return;
            settled = true;
            reject(error || new Error("decodeAudioData"));
          };
          var maybe = ensureContext().decodeAudioData(data, done, fail);
          if (maybe && typeof maybe.then === "function") maybe.then(done, fail);
        });
      })
      .catch(function (error) {
        pending = null;
        throw error;
      });

    return pending;
  }

  function stopTick() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }

  function tick() {
    if (mode !== "webaudio" || !node) return;
    paint();
    frame = requestAnimationFrame(tick);
  }

  function playWeb() {
    if (loading) return;
    loading = true;
    loadBuffer()
      .then(function (decoded) {
        loading = false;
        var context = ensureContext();
        var src = context.createBufferSource();
        src.buffer = decoded;
        src.connect(context.destination);
        src.onended = function () {
          if (src !== node) return;
          node = null;
          stopTick();
          offset = 0;
          setPlaying(false);
          paint();
        };
        node = src;
        startedAt = context.currentTime;
        src.start(0, Math.min(offset, Math.max(0, decoded.duration - 0.02)));
        total.textContent = format(decoded.duration);
        setPlaying(true);
        tick();
      })
      .catch(function () {
        loading = false;
        showError();
      });
  }

  function pauseWeb() {
    offset = position();
    if (node) {
      var old = node;
      node = null;
      old.onended = null;
      try {
        old.stop();
      } catch (error) {
        /* قبلاً متوقف شده */
      }
    }
    stopTick();
    setPlaying(false);
    paint();
  }

  function switchToWebAudio() {
    if (mode === "webaudio") return;
    mode = "webaudio";
    offset = 0;
    setPlaying(false);
    total.textContent = "—";
    loadBuffer()
      .then(function (decoded) {
        total.textContent = format(decoded.duration);
        paint();
      })
      .catch(function () {
        /* خطای واقعی هنگام لمس نشان داده می‌شود */
      });
  }

  /* ---------- مسیر عادی: تگ <audio> ---------- */

  button.addEventListener("click", function () {
    if (mode === "element") {
      if (audio.paused) {
        var attempt = audio.play();
        if (attempt && typeof attempt.catch === "function") {
          attempt.catch(function () {
            switchToWebAudio();
            playWeb();
          });
        }
      } else {
        audio.pause();
      }
      return;
    }

    if (node) {
      pauseWeb();
    } else {
      playWeb();
    }
  });

  audio.addEventListener("play", function () {
    if (mode === "element") setPlaying(true);
  });

  audio.addEventListener("pause", function () {
    if (mode === "element") setPlaying(false);
  });

  audio.addEventListener("ended", function () {
    if (mode !== "element") return;
    setPlaying(false);
    audio.currentTime = 0;
    paint();
  });

  audio.addEventListener("timeupdate", function () {
    if (mode === "element") paint();
  });

  function syncDuration() {
    if (mode !== "element") return;
    total.textContent = format(audio.duration);
    paint();
  }

  audio.addEventListener("durationchange", syncDuration);
  audio.addEventListener("loadedmetadata", syncDuration);

  audio.addEventListener("error", function () {
    if (mode === "element") switchToWebAudio();
  });

  paint();
})();
