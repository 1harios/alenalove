/* Просмотр историй: полоски прогресса, тапы, удержание, свайпы, ответ */
(function () {
  'use strict';

  var A = window.App;
  var C = window.CONFIG || {};
  var $ = A.$;

  var V = {
    open: false,
    index: -1,
    slides: [],
    elapsed: 0,
    last: 0,
    raf: 0,
    holding: false,
    kbPaused: false,
    sheet: false,
    ptr: null,
    holdT: 0
  };
  var el, stage, box, bars, nextBtn, sheet, likeBtn, soundBtn;

  function cur() { return V.slides[V.index] || null; }

  /* --- Размеры: единица --u = 1% ширины «истории» 9:16 --- */
  function measure() {
    if (!stage) return;
    var w = stage.clientWidth;
    var h = stage.clientHeight;
    if (!w || !h) return;
    var u = Math.min(w / 100, h / 177.8);
    stage.style.setProperty('--u', u.toFixed(3) + 'px');
    stage.style.setProperty('--sh', Math.round(h) + 'px');
  }

  /* --- Сборка --- */
  function build() {
    if (V.index >= 0) leave(V.index);
    box.innerHTML = '';
    V.slides = A.buildSlides().map(function (def) {
      return { def: def, el: null, api: null, done: false, progress: 0, timers: [], active: false, waiting: false };
    });
    bars.innerHTML = V.slides.map(function () { return '<div class="bar"><i></i></div>'; }).join('');
    V.index = -1;
  }

  function makeApi(s, i) {
    var api = {
      slide: s,
      index: i,
      isActive: function () { return V.open && V.index === i; },
      complete: function (o) {
        if (s.done) return;
        s.done = true;
        s.progress = 1;
        if (V.index === i) { updateNext(); paintBars(); }
        if (o && o.autoNext) api.later(function () { if (api.isActive()) next(); }, o.autoNext);
      },
      setProgress: function (p) { if (!s.done) s.progress = A.clamp(p, 0, 1); },
      later: function (fn, ms) { var t = setTimeout(fn, ms); s.timers.push(t); return t; },
      every: function (fn, ms) { var t = setInterval(fn, ms); s.timers.push(t); return t; },
      wait: function (promise) {
        s.waiting = true;
        updateWaiting();
        var fin = function () { s.waiting = false; updateWaiting(); };
        promise.then(fin, fin);
        api.later(fin, 9000);
      },
      next: function () { next(); },
      prev: function () { prev(); },
      openReply: function () { openSheet(); },
      restart: function () { restart(); },
      close: function () { close(); }
    };
    return api;
  }

  function ensure(i) {
    var s = V.slides[i];
    if (!s) return null;
    if (s.el) return s;
    var node = document.createElement('div');
    node.className = 'slide ' + (s.def.cls || '');
    node.setAttribute('data-id', s.def.id);
    s.api = makeApi(s, i);
    var html = s.def.render ? s.def.render(s.api) : '';
    if (typeof html === 'string') node.innerHTML = html;
    else if (html) node.appendChild(html);
    A.emojify(node);
    box.appendChild(node);
    s.el = node;
    if (s.def.mount) s.def.mount(node, s.api);
    return s;
  }

  function go(i) {
    if (!V.slides.length) return;
    i = A.clamp(i, 0, V.slides.length - 1);
    if (V.index >= 0) leave(V.index);
    V.index = i;
    V.elapsed = 0;
    var s = ensure(i);
    if (!s.def.interactive && !s.def.final) s.progress = 0;
    if (s.def.final && !s.done) s.progress = 0;
    var node = s.el;
    node.classList.remove('is-active', 'entering');
    void node.offsetWidth;
    node.classList.add('is-active', 'entering');
    s.active = true;
    measure();
    if (s.def.enter) s.def.enter(node, s.api);
    updateWaiting();
    updateNext();
    paintBars();
    var n = V.slides[i + 1];
    if (n && n.def.preload) n.def.preload();
  }

  function leave(i) {
    var s = V.slides[i];
    if (!s || !s.el || !s.active) return;
    s.active = false;
    s.timers.forEach(function (t) { clearTimeout(t); clearInterval(t); });
    s.timers = [];
    s.waiting = false;
    if (s.def.leave) s.def.leave(s.el, s.api);
    s.el.classList.remove('is-active', 'entering');
  }

  function next() {
    if (V.index < V.slides.length - 1) go(V.index + 1);
    else close();
  }
  function prev() { go(V.index > 0 ? V.index - 1 : 0); }
  function tryNext() {
    var s = cur();
    if (s && s.def.interactive && !s.done) { nudge(); return; }
    next();
  }
  function nudge() {
    nextBtn.classList.remove('nudge');
    void nextBtn.offsetWidth;
    nextBtn.classList.add('nudge');
    var s = cur();
    if (s && s.def.hint) s.def.hint(s.el, s.api);
  }

  /* --- Время --- */
  function tick(t) {
    V.raf = requestAnimationFrame(tick);
    var dt = V.last ? Math.min(100, t - V.last) : 16;
    V.last = t;
    var s = cur();
    if (!s) return;
    var paused = V.holding || V.kbPaused || V.sheet || document.hidden || s.waiting;
    if (!s.def.interactive && !paused && !(s.def.final && s.done)) {
      var dur = s.def.duration || 6000;
      V.elapsed += dt;
      s.progress = Math.min(1, V.elapsed / dur);
      if (V.elapsed >= dur) {
        if (s.def.final) s.done = true;
        else { next(); return; }
      }
    }
    var b = bars.children[V.index];
    if (b) b.firstChild.style.transform = 'scaleX(' + s.progress.toFixed(4) + ')';
  }

  function paintBars() {
    for (var k = 0; k < bars.children.length; k++) {
      var p = k < V.index ? 1 : k > V.index ? 0 : (V.slides[k].progress || 0);
      bars.children[k].firstChild.style.transform = 'scaleX(' + p + ')';
    }
  }

  function updateWaiting() {
    var s = cur();
    el.classList.toggle('waiting', !!(s && s.waiting));
  }

  function updateNext() {
    var s = cur();
    if (!s) return;
    var show = !!s.def.interactive;
    nextBtn.hidden = !show;
    if (!show) return;
    nextBtn.classList.toggle('ready', s.done);
    nextBtn.innerHTML = '<span>' + (s.done ? 'Дальше' : 'Пропустить') + '</span>' + A.icons.next;
  }

  /* --- Жесты --- */
  function isUiTarget(t) {
    return !!(t && t.closest && t.closest('button, a, input, textarea, [data-interactive], .paper, .sheet'));
  }

  function onDown(e) {
    if (!V.open || V.sheet) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (isUiTarget(e.target)) return;
    V.ptr = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false, mode: null, dx: 0, dy: 0 };
    clearTimeout(V.holdT);
    V.holdT = setTimeout(function () {
      if (V.ptr && !V.ptr.moved) { V.holding = true; el.classList.add('holding'); }
    }, 230);
  }

  function onMove(e) {
    var p = V.ptr;
    if (!p || e.pointerId !== p.id) return;
    p.dx = e.clientX - p.x;
    p.dy = e.clientY - p.y;
    if (!p.moved && (Math.abs(p.dx) > 10 || Math.abs(p.dy) > 10)) {
      p.moved = true;
      clearTimeout(V.holdT);
      if (Math.abs(p.dy) > Math.abs(p.dx)) p.mode = p.dy > 0 ? 'down' : 'up';
      else p.mode = 'side';
    }
    if (p.mode === 'down') {
      var d = Math.max(0, p.dy);
      el.style.transform = 'translateY(' + d + 'px) scale(' + (1 - Math.min(0.12, d / 2400)) + ')';
      el.style.borderRadius = Math.min(28, d / 5) + 'px';
    }
  }

  function onUp(e) {
    var p = V.ptr;
    if (!p || e.pointerId !== p.id) return;
    V.ptr = null;
    clearTimeout(V.holdT);
    var wasHolding = V.holding;
    if (V.holding) { V.holding = false; el.classList.remove('holding'); }
    if (p.mode === 'down') {
      if (p.dy > 110 && e.type !== 'pointercancel') { close(); return; }
      el.style.transition = 'transform .25s ease, border-radius .25s ease';
      el.style.transform = '';
      el.style.borderRadius = '';
      setTimeout(function () { el.style.transition = ''; }, 260);
      return;
    }
    if (e.type === 'pointercancel') return;
    if (p.mode === 'side') {
      if (p.dx < -50) tryNext();
      else if (p.dx > 50) prev();
      return;
    }
    if (p.mode === 'up') { if (p.dy < -60) openSheet(); return; }
    if (wasHolding || p.moved) return;
    var r = stage.getBoundingClientRect();
    if (e.clientX - r.left < r.width * 0.3) prev();
    else tryNext();
  }

  function onKey(e) {
    if (!V.open) return;
    if (V.sheet) { if (e.key === 'Escape') closeSheet(); return; }
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); tryNext(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    else if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      V.kbPaused = !V.kbPaused;
      el.classList.toggle('kb-paused', V.kbPaused);
    } else if (e.key === 'Escape') close();
  }

  /* --- Открыть / закрыть --- */
  function open(start, origin) {
    if (!V.slides.length) build();
    A.sound.unlock();
    el.hidden = false;
    el.style.transform = '';
    el.style.borderRadius = '';
    if (origin) {
      var r = origin.getBoundingClientRect();
      var vr = el.getBoundingClientRect();
      el.style.setProperty('--ox', (r.left + r.width / 2 - vr.left) + 'px');
      el.style.setProperty('--oy', (r.top + r.height / 2 - vr.top) + 'px');
    } else {
      el.style.removeProperty('--ox');
      el.style.removeProperty('--oy');
    }
    el.classList.remove('closing', 'opening');
    void el.offsetWidth;
    el.classList.add('opening');
    clearTimeout(V.openT);
    V.openT = setTimeout(function () { el.classList.remove('opening'); }, 460);
    V.open = true;
    V.kbPaused = false;
    el.classList.remove('kb-paused');
    measure();
    var idx = typeof start === 'string' ? indexOf(start) : (start || 0);
    go(idx < 0 ? 0 : idx);
    V.last = 0;
    if (!V.raf) V.raf = requestAnimationFrame(tick);
    A.sound.playMusic();
    updateSound();
  }

  function close() {
    if (!V.open) return;
    leave(V.index);
    V.open = false;
    closeSheet();
    cancelAnimationFrame(V.raf);
    V.raf = 0;
    el.classList.remove('opening', 'holding');
    el.classList.add('closing');
    A.sound.pauseMusic();
    var reachedEnd = V.index >= V.slides.length - 1;
    setTimeout(function () {
      el.hidden = true;
      el.classList.remove('closing');
      el.style.transform = '';
      el.style.borderRadius = '';
    }, 300);
    if (A.onStoriesClosed) A.onStoriesClosed(reachedEnd);
  }

  function restart() {
    build();
    go(0);
  }

  function indexOf(id) {
    for (var i = 0; i < V.slides.length; i++) if (V.slides[i].def.id === id) return i;
    return -1;
  }

  /* --- Ответ, лайк, звук --- */
  function openSheet() {
    if (V.sheet || !V.open) return;
    V.sheet = true;
    sheet.hidden = false;
  }
  function closeSheet() {
    if (!V.sheet) return;
    V.sheet = false;
    sheet.hidden = true;
    var inp = $('input', sheet);
    if (inp) inp.blur();
  }

  function sendReply(text) {
    A.fx.reaction('💌', stage);
    A.sound.whoosh();
    var to = C.fromDative || C.from;
    if (navigator.share) {
      setTimeout(function () {
        navigator.share({ text: text }).then(function () {
          A.toast('Отправлено ' + to + ' 💘');
        }).catch(function () { /* отменили — ничего страшного */ });
      }, 350);
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        A.toast('Текст скопирован — отправь его ' + to + ' в мессенджере 😉', 3600);
      }, function () { A.toast('Скажи это ' + to + ' лично — он будет счастлив 🥰', 3600); });
    } else {
      A.toast('Скажи это ' + to + ' лично — он будет счастлив 🥰', 3600);
    }
  }

  function updateSound() {
    soundBtn.innerHTML = A.sound.isMuted() ? A.icons.soundOff : A.icons.soundOn;
    soundBtn.setAttribute('aria-label', A.sound.isMuted() ? 'Включить звук' : 'Выключить звук');
  }

  function shareSite() {
    var data = { title: document.title, url: location.href };
    if (navigator.share && /^https?:/.test(location.protocol)) {
      navigator.share(data).catch(function () {});
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(location.href).then(function () { A.toast('Ссылка скопирована 🔗'); }, function () {});
    }
  }

  function init() {
    el = $('#viewer');
    stage = $('#stage');
    box = $('.slides', stage);
    bars = $('.bars', el);
    nextBtn = $('.v-next', el);
    sheet = $('.sheet', el);
    likeBtn = $('.v-like', el);
    soundBtn = $('[data-act="sound"]', el);

    // Шапка
    var ava = $('.v-ava', el);
    if (C.fromAvatar) ava.innerHTML = '<img src="' + A.esc(C.fromAvatar) + '" alt="">';
    else ava.textContent = (C.from || 'С').charAt(0).toUpperCase();
    $('.v-name', el).textContent = C.fromUsername || 'sasha';
    $('.v-time', el).textContent = A.storyTime();
    if (C.music && C.music.src && C.music.title) {
      var mus = $('.v-music', el);
      mus.textContent = '🎵 ' + C.music.title + (C.music.artist ? ' · ' + C.music.artist : '');
      mus.classList.add('on');
      A.emojify(mus);
    }
    $('[data-act="close"]', el).innerHTML = A.icons.close;
    $('.v-paused', el).innerHTML = A.icons.pause;
    $('.v-reply', el).textContent = 'Ответить ' + (C.fromUsername || 'sasha') + '…';
    likeBtn.innerHTML = A.icons.heart;
    $('.v-send', el).innerHTML = A.icons.send;
    updateSound();
    A.sound.onChange(updateSound);

    // Жесты
    stage.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    stage.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', function () { setTimeout(measure, 300); });

    // Кнопки
    $('[data-act="close"]', el).addEventListener('click', close);
    soundBtn.addEventListener('click', function () { A.sound.toggle(); A.sound.unlock(); });
    nextBtn.addEventListener('click', next);
    $('.v-reply', el).addEventListener('click', openSheet);
    $('.v-send', el).addEventListener('click', shareSite);
    likeBtn.addEventListener('click', function () {
      var on = !likeBtn.classList.contains('liked');
      likeBtn.classList.toggle('liked', on);
      likeBtn.innerHTML = on ? A.icons.heartFill : A.icons.heart;
      if (on) {
        var c = A.center(likeBtn);
        A.fx.hearts(c.x, c.y, 9);
        A.sound.heart();
        A.vibrate(15);
      }
    });

    // Окно ответа
    $('.sheet__backdrop', sheet).addEventListener('click', closeSheet);
    A.$$('.quick button', sheet).forEach(function (b) {
      b.addEventListener('click', function () {
        var ch = b.getAttribute('data-e');
        closeSheet();
        A.fx.reaction(ch, stage);
        A.sound.heart();
        A.vibrate(15);
        A.toast('Реакция улетела ' + (C.fromDative || C.from) + ' 💘');
      });
    });
    $('.reply-form', sheet).addEventListener('submit', function (e) {
      e.preventDefault();
      var inp = $('input', sheet);
      var text = inp.value.trim();
      if (!text) { inp.focus(); return; }
      inp.value = '';
      closeSheet();
      sendReply(text);
    });
    $('input', sheet).placeholder = 'Сообщение для ' + (C.fromGenitive || C.from) + '…';
    A.emojify(sheet);
  }

  A.stories = {
    init: init,
    open: open,
    close: close,
    restart: restart,
    build: build,
    indexOf: indexOf,
    isOpen: function () { return V.open; },
    resumeIndex: function () {
      return V.index > 0 && V.index < V.slides.length - 1 ? V.index : 0;
    },
    measure: measure
  };
})();
