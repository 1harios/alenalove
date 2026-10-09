/* Конфетти, салюты, летящие сердечки и реакции */
(function () {
  'use strict';

  var App = window.App;
  var canvas = document.getElementById('fx');
  var g = canvas.getContext('2d');
  var W = 0;
  var H = 0;
  var dpr = 1;
  var parts = [];
  var raf = 0;
  var COLORS = ['#ff3b6b', '#ff9f1c', '#ffd23f', '#3bceac', '#4f8cff', '#b15cff', '#ff6ec7', '#ffffff'];
  var imgs = {};

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
  }
  window.addEventListener('resize', resize);
  resize();

  function emojiImage(ch) {
    if (imgs[ch] !== undefined) return imgs[ch];
    var src = App.emojiSrc(ch);
    if (!src) { imgs[ch] = null; return null; }
    var img = new Image();
    img.src = src;
    imgs[ch] = img;
    return img;
  }
  function preloadEmoji(list) { list.forEach(emojiImage); }

  function add(p) {
    parts.push(p);
    if (!raf) raf = requestAnimationFrame(loop);
  }

  function loop() {
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.life++;
      p.vx *= p.drag;
      p.vy = p.vy * p.drag + p.g;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.tilt += p.vt;
      if (p.life >= p.ttl || p.y > H + 80 || p.x < -80 || p.x > W + 80) { parts.splice(i, 1); continue; }
      var a = p.life > p.ttl - 25 ? (p.ttl - p.life) / 25 : 1;
      if (p.fadeIn && p.life < 10) a *= p.life / 10;
      g.save();
      g.globalAlpha = Math.max(0, a);
      g.translate(p.x, p.y);
      g.rotate(p.rot);
      if (p.kind === 'emoji') {
        var s = p.size;
        if (p.img && p.img.complete && p.img.naturalWidth) g.drawImage(p.img, -s / 2, -s / 2, s, s);
        else {
          g.font = s + 'px sans-serif';
          g.textAlign = 'center';
          g.textBaseline = 'middle';
          g.fillText(p.ch, 0, 0);
        }
      } else if (p.kind === 'circle') {
        g.fillStyle = p.color;
        g.beginPath();
        g.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        g.fill();
      } else if (p.kind === 'spark') {
        g.fillStyle = p.color;
        g.shadowColor = p.color;
        g.shadowBlur = 8;
        g.beginPath();
        g.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        g.fill();
      } else {
        g.scale(1, Math.cos(p.tilt));
        g.fillStyle = p.color;
        g.fillRect(-p.size / 2, -p.size * 0.3, p.size, p.size * 0.6);
      }
      g.restore();
    }
    if (parts.length) raf = requestAnimationFrame(loop);
    else { raf = 0; g.clearRect(0, 0, W, H); }
  }

  /* Взрыв конфетти из точки */
  function confetti(o) {
    o = o || {};
    var count = o.count || 90;
    if (App.reducedMotion) count = Math.ceil(count / 3);
    var x = o.x == null ? W / 2 : o.x;
    var y = o.y == null ? H / 2 : o.y;
    var angle = o.angle == null ? -Math.PI / 2 : o.angle;
    var spread = o.spread == null ? Math.PI * 0.9 : o.spread;
    var sp = o.speed || [7, 15];
    var sz = o.size || [7, 12];
    var colors = o.colors || COLORS;
    var emoji = o.emoji || null;
    for (var i = 0; i < count; i++) {
      var ang = angle + (Math.random() - 0.5) * spread;
      var s = App.rand(sp[0], sp[1]);
      var isEmoji = emoji && Math.random() < (o.emojiShare || 0.3);
      var ch = isEmoji ? App.pick(emoji) : null;
      add({
        x: x, y: y,
        vx: Math.cos(ang) * s,
        vy: Math.sin(ang) * s,
        g: o.gravity == null ? 0.3 : o.gravity,
        drag: o.drag || 0.982,
        rot: Math.random() * 6.28,
        vr: App.rand(-0.22, 0.22),
        tilt: Math.random() * 6.28,
        vt: App.rand(0.06, 0.16),
        size: isEmoji ? App.rand(22, 34) : App.rand(sz[0], sz[1]),
        color: App.pick(colors),
        kind: isEmoji ? 'emoji' : (o.kind || (Math.random() < 0.28 ? 'circle' : 'rect')),
        img: isEmoji ? emojiImage(ch) : null,
        ch: ch,
        life: 0,
        ttl: o.ttl || App.rand(110, 170)
      });
    }
  }

  /* Дождь сверху */
  function rain(o) {
    o = o || {};
    var until = performance.now() + (o.duration || 2500);
    var emoji = o.emoji || null;
    (function step() {
      var n = o.rate || 4;
      for (var i = 0; i < n; i++) {
        var isEmoji = emoji && Math.random() < (o.emojiShare || 0.35);
        var ch = isEmoji ? App.pick(emoji) : null;
        add({
          x: Math.random() * W, y: -30,
          vx: App.rand(-1.2, 1.2), vy: App.rand(2, 5),
          g: 0.06, drag: 0.995,
          rot: Math.random() * 6.28, vr: App.rand(-0.1, 0.1),
          tilt: Math.random() * 6.28, vt: App.rand(0.05, 0.14),
          size: isEmoji ? App.rand(24, 36) : App.rand(7, 12),
          color: App.pick(o.colors || COLORS),
          kind: isEmoji ? 'emoji' : (Math.random() < 0.3 ? 'circle' : 'rect'),
          img: isEmoji ? emojiImage(ch) : null, ch: ch,
          life: 0, ttl: 420
        });
      }
      if (performance.now() < until) setTimeout(step, 70);
    })();
  }

  /* Салют */
  function firework(x, y, hue) {
    hue = hue == null ? Math.floor(Math.random() * 360) : hue;
    var colors = [
      'hsl(' + hue + ',100%,70%)',
      'hsl(' + ((hue + 30) % 360) + ',100%,65%)',
      'hsl(' + hue + ',100%,88%)'
    ];
    var n = App.reducedMotion ? 18 : 46;
    for (var i = 0; i < n; i++) {
      var a = (i / n) * Math.PI * 2;
      var s = App.rand(2.2, 4.6);
      add({
        x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        g: 0.045, drag: 0.975, rot: 0, vr: 0, tilt: 0, vt: 0,
        size: App.rand(3, 5), color: App.pick(colors), kind: 'spark',
        life: 0, ttl: App.rand(60, 90)
      });
    }
  }

  /* DOM-эффект: эмодзи взлетают и тают */
  function floatEmoji(ch, x, y, o) {
    o = o || {};
    var el = document.createElement('div');
    el.className = 'fx-float';
    var size = o.size || 34;
    el.style.left = (x - size / 2) + 'px';
    el.style.top = (y - size / 2) + 'px';
    el.style.fontSize = size + 'px';
    App.setText(el, ch);
    document.body.appendChild(el);
    var dx = o.dx == null ? App.rand(-40, 40) : o.dx;
    var rise = o.rise || App.rand(160, 260);
    var dur = o.duration || App.rand(1300, 1900);
    var rot = App.rand(-25, 25);
    if (!el.animate) { setTimeout(function () { el.remove(); }, 300); return; }
    var an = el.animate([
      { transform: 'translate(0,0) scale(.3)', opacity: 0 },
      { transform: 'translate(' + dx * 0.3 + 'px,' + (-rise * 0.25) + 'px) scale(' + (o.scale || 1.15) + ') rotate(' + rot * 0.4 + 'deg)', opacity: 1, offset: 0.2 },
      { transform: 'translate(' + dx + 'px,' + (-rise) + 'px) scale(1) rotate(' + rot + 'deg)', opacity: 0 }
    ], { duration: dur, delay: o.delay || 0, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'both' });
    an.onfinish = function () { el.remove(); };
  }

  function hearts(x, y, n, o) {
    o = o || {};
    var set = o.set || ['❤️', '💖', '💕', '💗', '💓'];
    for (var i = 0; i < (n || 8); i++) {
      floatEmoji(App.pick(set), x + App.rand(-20, 20), y + App.rand(-10, 10), {
        size: App.rand(o.min || 24, o.max || 42),
        delay: i * 55,
        rise: App.rand(150, o.rise || 300),
        dx: App.rand(-70, 70)
      });
    }
  }

  /* «Быстрая реакция» как в Instagram: много эмодзи всплывают снизу */
  function reaction(ch, box) {
    var r = box ? box.getBoundingClientRect() : { left: 0, top: 0, width: W, height: H };
    for (var i = 0; i < 14; i++) {
      floatEmoji(ch, r.left + App.rand(r.width * 0.1, r.width * 0.9), r.top + r.height - App.rand(20, 80), {
        size: App.rand(30, 64),
        delay: i * 70 + App.rand(0, 120),
        rise: App.rand(r.height * 0.45, r.height * 0.85),
        dx: App.rand(-30, 30),
        duration: App.rand(1600, 2300)
      });
    }
  }

  App.fx = {
    confetti: confetti,
    rain: rain,
    firework: firework,
    floatEmoji: floatEmoji,
    hearts: hearts,
    reaction: reaction,
    preloadEmoji: preloadEmoji,
    clear: function () { parts.length = 0; }
  };
})();
