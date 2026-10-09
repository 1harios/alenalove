/* Звуки, синтезированные прямо в браузере (без файлов), + «Happy Birthday» на музыкальной шкатулке */
(function () {
  'use strict';

  var App = window.App;
  var C = window.CONFIG || {};
  var ctx = null;
  var master = null;
  var noiseBuf = null;
  var musicEl = null;
  var muted = !!App.store.get('muted', false);
  var listeners = [];

  function ac() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (e) { return null; }
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.9;
      var comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -10;
      comp.ratio.value = 4;
      master.connect(comp);
      comp.connect(ctx.destination);
    }
    if (ctx.state === 'suspended' && ctx.resume) ctx.resume().catch(function () {});
    return ctx;
  }

  /* Разблокировка звука на iOS — вызывается из нажатия */
  function unlock() {
    var c = ac();
    if (!c) return;
    try {
      var b = c.createBuffer(1, 1, 22050);
      var s = c.createBufferSource();
      s.buffer = b;
      s.connect(c.destination);
      s.start(0);
    } catch (e) { /* ignore */ }
  }

  function env(g, t0, a, peak, d) {
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
  }

  function tone(o) {
    var c = ac();
    if (!c || muted) return;
    var t0 = c.currentTime + (o.t || 0);
    var a = o.a || 0.005;
    var d = o.d || 0.3;
    var osc = c.createOscillator();
    var g = c.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f || 440, t0);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t0 + a + d);
    env(g, t0, a, o.v || 0.25, d);
    osc.connect(g);
    g.connect(o.out || master);
    osc.start(t0);
    osc.stop(t0 + a + d + 0.05);
  }

  function noise(o) {
    var c = ac();
    if (!c || muted) return;
    if (!noiseBuf) {
      noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
      var ch = noiseBuf.getChannelData(0);
      for (var i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    }
    var t0 = c.currentTime + (o.t || 0);
    var a = o.a || 0.005;
    var d = o.d || 0.2;
    var src = c.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    var fl = c.createBiquadFilter();
    fl.type = o.type || 'bandpass';
    fl.frequency.setValueAtTime(o.f || 1000, t0);
    if (o.f2) fl.frequency.exponentialRampToValueAtTime(o.f2, t0 + a + d);
    fl.Q.value = o.q || 1;
    var g = c.createGain();
    env(g, t0, a, o.v || 0.3, d);
    src.connect(fl);
    fl.connect(g);
    g.connect(master);
    src.start(t0, Math.random() * 0.5);
    src.stop(t0 + a + d + 0.05);
  }

  var throttle = {};
  function once(name, ms) {
    var now = Date.now();
    if (throttle[name] && now - throttle[name] < ms) return false;
    throttle[name] = now;
    return true;
  }

  var S = {
    unlock: unlock,
    ctx: ac,
    tap: function () { tone({ f: 880, f2: 620, d: 0.06, v: 0.1 }); },
    pop: function () {
      noise({ type: 'highpass', f: 900, q: 0.7, a: 0.001, d: 0.09, v: 0.8 });
      tone({ type: 'triangle', f: 520, f2: 110, a: 0.001, d: 0.12, v: 0.35 });
    },
    chomp: function () {
      noise({ type: 'bandpass', f: 650, q: 1.3, a: 0.002, d: 0.07, v: 0.55 });
      noise({ type: 'bandpass', f: 480, q: 1.3, a: 0.002, d: 0.08, v: 0.5, t: 0.14 });
      tone({ f: 190, f2: 90, d: 0.09, v: 0.25 });
      tone({ f: 170, f2: 80, d: 0.09, v: 0.22, t: 0.14 });
    },
    ding: function () {
      tone({ f: 1318.5, d: 0.6, v: 0.2 });
      tone({ f: 1975.5, d: 0.75, v: 0.14, t: 0.09 });
    },
    success: function () {
      [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) {
        tone({ type: 'triangle', f: f, d: 0.38, v: 0.17, t: i * 0.08 });
      });
    },
    sparkle: function () {
      for (var i = 0; i < 7; i++) tone({ f: 1400 + Math.random() * 1800, d: 0.16, v: 0.05, t: i * 0.05 });
    },
    whoosh: function () { noise({ type: 'bandpass', f: 400, f2: 2600, q: 0.8, a: 0.05, d: 0.45, v: 0.35 }); },
    blow: function () { noise({ type: 'lowpass', f: 2000, f2: 260, q: 0.5, a: 0.04, d: 0.7, v: 0.45 }); },
    crack: function () {
      noise({ type: 'highpass', f: 2200, a: 0.001, d: 0.05, v: 0.6 });
      noise({ type: 'highpass', f: 3200, a: 0.001, d: 0.04, v: 0.45, t: 0.06 });
    },
    heart: function () { tone({ f: 660, f2: 990, d: 0.16, v: 0.13 }); },
    boing: function () { tone({ type: 'sine', f: 180, f2: 620, d: 0.22, v: 0.2 }); },
    scratch: function () { if (once('scratch', 90)) noise({ type: 'highpass', f: 3500, a: 0.002, d: 0.05, v: 0.07 }); },
    swoosh: function () { noise({ type: 'bandpass', f: 1800, f2: 500, q: 0.9, a: 0.02, d: 0.25, v: 0.2 }); },

    happyBirthday: happyBirthday,
    setMuted: setMuted,
    isMuted: function () { return muted; },
    toggle: function () {
      setMuted(!muted);
      // Явно включила звук — на iPhone играем даже в беззвучном режиме (iOS 17+)
      if (!muted) { try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* ignore */ } }
      return muted;
    },
    onChange: function (fn) { listeners.push(fn); },
    hasMusic: function () { return !!musicEl; },
    playMusic: function () {
      if (!musicEl || muted) return;
      var p = musicEl.play();
      if (p && p.catch) p.catch(function () {});
    },
    pauseMusic: function () { if (musicEl) musicEl.pause(); }
  };

  function setMuted(m) {
    muted = !!m;
    App.store.set('muted', muted);
    if (ctx && master) master.gain.setTargetAtTime(muted ? 0 : 0.9, ctx.currentTime, 0.03);
    if (musicEl) {
      musicEl.muted = muted;
      if (!muted && App.stories && App.stories.isOpen()) S.playMusic();
    }
    listeners.forEach(function (fn) { fn(muted); });
  }

  /* --- Музыкальная шкатулка --- */
  var NOTE = {
    F2: 87.31, G2: 98.0, C3: 130.81, E3: 164.81, F3: 174.61, G3: 196.0,
    G4: 392.0, A4: 440.0, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99
  };
  function bell(f, t0, v, out) {
    var c = ctx;
    [[1, 1, 1.6], [2, 0.32, 0.7], [3.01, 0.12, 0.4], [4.18, 0.05, 0.25]].forEach(function (p) {
      var o = c.createOscillator();
      var g = c.createGain();
      o.type = 'sine';
      o.frequency.value = f * p[0];
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(v * p[1], t0 + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + p[2]);
      o.connect(g);
      g.connect(out);
      o.start(t0);
      o.stop(t0 + p[2] + 0.05);
    });
  }
  function bass(f, t0, v, out) {
    var c = ctx;
    var o = c.createOscillator();
    var g = c.createGain();
    o.type = 'triangle';
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(v, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.3);
    o.connect(g);
    g.connect(out);
    o.start(t0);
    o.stop(t0 + 1.4);
  }
  function happyBirthday() {
    var c = ac();
    if (!c) return 0;
    var song = [
      ['G4', 0.75], ['G4', 0.25], ['A4', 1, 'C3'], ['G4', 1], ['C5', 1], ['B4', 2, 'G2'],
      ['G4', 0.75], ['G4', 0.25], ['A4', 1, 'G2'], ['G4', 1], ['D5', 1], ['C5', 2, 'C3'],
      ['G4', 0.75], ['G4', 0.25], ['G5', 1, 'C3'], ['E5', 1], ['C5', 1], ['B4', 1, 'F2'], ['A4', 2],
      ['F5', 0.75], ['F5', 0.25], ['E5', 1, 'C3'], ['C5', 1], ['D5', 1, 'G2'], ['C5', 3, 'C3']
    ];
    var beat = 0.43;
    var out = c.createGain();
    out.gain.value = 1;
    out.connect(master);
    var t = c.currentTime + 0.12;
    song.forEach(function (n) {
      bell(NOTE[n[0]], t, 0.28, out);
      if (n[2]) bass(NOTE[n[2]], t, 0.16, out);
      t += n[1] * beat;
    });
    if (musicEl && !musicEl.paused) {
      musicEl.pause();
      setTimeout(function () { S.playMusic(); }, (t - c.currentTime) * 1000 + 600);
    }
    return (t - c.currentTime) * 1000;
  }

  /* Свернули вкладку — музыка на паузу, вернулись — продолжаем */
  document.addEventListener('visibilitychange', function () {
    if (!musicEl) return;
    if (document.hidden) musicEl.pause();
    else if (App.stories && App.stories.isOpen()) S.playMusic();
  });

  /* --- Фоновая музыка из файла (если указана в config.js) --- */
  if (C.music && C.music.src) {
    try {
      musicEl = new Audio(C.music.src);
      musicEl.loop = true;
      musicEl.preload = 'auto';
      musicEl.volume = 0.55;
      musicEl.muted = muted;
    } catch (e) { musicEl = null; }
  }

  App.sound = S;
})();
