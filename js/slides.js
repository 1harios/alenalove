/* Истории (слайды) и мини-игры */
(function () {
  'use strict';

  var A = window.App;
  var C = window.CONFIG || {};
  var esc = A.esc;
  var fx = A.fx;
  var snd = A.sound;

  /* ---------- помощники разметки ---------- */
  function floaters(set, n) {
    var s = '<div class="floaters" aria-hidden="true">';
    for (var i = 0; i < n; i++) {
      s += '<span style="--x:' + A.rand(2, 90).toFixed(1) + '%;--d:' + (-A.rand(0, 10)).toFixed(2) +
        's;--t:' + A.rand(8, 13).toFixed(2) + 's;--s:' + A.rand(5, 9).toFixed(1) + '">' + set[i % set.length] + '</span>';
    }
    return s + '</div>';
  }
  function stars(n) {
    var s = '<div class="stars" aria-hidden="true">';
    for (var i = 0; i < n; i++) {
      s += '<i style="left:' + A.rand(0, 100).toFixed(1) + '%;top:' + A.rand(0, 100).toFixed(1) +
        '%;--t:' + A.rand(2, 5).toFixed(2) + 's;--d:' + (-A.rand(0, 5)).toFixed(2) + 's"></i>';
    }
    return s + '</div>';
  }
  function letters(text, start) {
    var out = '<span class="ln">';
    var i = start;
    Array.from(text).forEach(function (ch) {
      out += ch === ' ' ? ' ' : '<span class="ch" style="--i:' + (i++) + '">' + esc(ch) + '</span>';
    });
    return out + '</span>';
  }
  function cssUrl(u) { return String(u).replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }
  // Анимации появления держат opacity, поэтому сначала снимаем их, потом плавно прячем
  function fadeOut(node, ms) {
    if (!node) return;
    node.classList.remove('rise', 'pop-in', 'fade-in');
    node.style.transition = 'opacity ' + (ms || 300) + 'ms ease';
    void node.offsetWidth;
    node.style.opacity = '0';
  }
  function pulse(node) {
    if (!node) return;
    node.classList.remove('nudge-me');
    void node.offsetWidth;
    node.classList.add('nudge-me');
  }
  var fromName = C.from || 'Саша';
  var fromGen = C.fromGenitive || fromName;
  var fromDat = C.fromDative || fromName;
  var sign = C.letterSign || ('Твой ' + fromName);

  /* =========================================================
     1. Вступление
     ========================================================= */
  function sIntro() {
    return {
      id: 'intro',
      cls: 'bg-ig',
      duration: 6500,
      render: function () {
        return '<div class="bg-anim"></div>' + floaters(['💌', '✨', '💖', '🎈', '🌸', '💫', '💕'], 10) +
          '<div class="sl sl--center">' +
            '<div class="stk-mention intro__mention pop-in" style="--d:.15s;--r:-6deg"><b>@' + esc(C.username || 'alenka') + '</b></div>' +
            '<h1 class="t-neon intro__name rise" style="--d:.35s">' + esc(C.name) + ',</h1>' +
            '<p class="t-hl rise" style="--d:.75s"><span>у меня для тебя</span><br><span>кое-что есть…</span></p>' +
            '<div class="intro__emoji rise" style="--d:1.15s"><span class="bob">🤫</span></div>' +
          '</div>' +
          '<div class="tap-hint rise" style="--d:1.9s"><span class="tap-hint__finger">👆</span><span>Нажимай справа, чтобы листать</span></div>' +
          '<div class="sound-hint rise" style="--d:2.4s">🔊 Со звуком интереснее</div>';
      }
    };
  }

  /* =========================================================
     2. С днём рождения!
     ========================================================= */
  function sHB() {
    var info = A.birthdayInfo();
    var photo = A.photos.length > 0 || A.hasSpecial('polaroid');
    return {
      id: 'hb',
      cls: 'bg-party',
      duration: 8500,
      render: function () {
        var hues = [0, 40, 200, 280, 320, 150, 60, 230, 340];
        var balloons = '';
        for (var i = 0; i < 9; i++) {
          balloons += '<span style="--x:' + (2 + i * 11 + A.rand(0, 4)).toFixed(1) + '%;--d:' + A.rand(0, 5).toFixed(2) +
            's;--t:' + A.rand(6.5, 10).toFixed(2) + 's;--h:' + hues[i] + 'deg;--s:' + A.rand(10, 15).toFixed(1) + '">🎈</span>';
        }
        var dd = A.pad(A.birth.getDate()) + '.' + A.pad(A.birth.getMonth() + 1);
        return '<div class="hb__balloons" aria-hidden="true">' + balloons + '</div>' +
          '<div class="sl sl--center">' +
            '<div class="polaroid pop-in" style="--d:.1s;--r:-5deg"><div class="polaroid__tape"></div>' +
              (photo ? '<img class="polaroid__img" data-pic="polaroid" alt="">' : '<div class="polaroid__emoji">🥳</div>') +
              '<div class="polaroid__cap">' + dd + ' ✨</div>' +
            '</div>' +
            '<h1 class="t-big hb__title">' + letters('С днём', 0) + letters('рождения!', 6) + '</h1>' +
            '<div class="t-neon hb__name rise" style="--d:1.3s">' + esc(C.name) + ' 🎂</div>' +
          '</div>' +
          '<div class="hb__age pop-in" style="--d:1.8s;--r:10deg">' + info.age + '</div>';
      },
      enter: function (el, api) {
        api.later(function () {
          var c = A.center(el.querySelector('.hb__title'));
          fx.confetti({ x: c.x, y: c.y, count: 120, spread: Math.PI * 1.25, emoji: ['🎉', '🎈', '💖', '✨'] });
          snd.success();
        }, 950);
        api.later(function () { fx.rain({ duration: 1800, rate: 3 }); }, 1900);
      },
      preload: function () { A.picAsync('polaroid'); }
    };
  }

  /* =========================================================
     3. Опрос
     ========================================================= */
  function sPoll() {
    function opt(t) {
      return '<button class="poll__opt"><i class="poll__fill"></i><span class="poll__txt">' + esc(t) +
        '</span><b class="poll__pct">100%</b></button>';
    }
    return {
      id: 'poll',
      cls: 'bg-sunset',
      interactive: true,
      render: function () {
        return '<div class="bg-anim"></div>' + floaters(['👑', '💖', '✨', '💅'], 7) +
          '<div class="sl sl--center poll-wrap">' +
            '<div class="poll__crown rise" style="--d:.1s"><span class="bob">👑</span></div>' +
            '<div class="poll stk pop-in" style="--d:.25s;--r:-2deg" data-interactive>' +
              '<div class="poll__q">Кто сегодня самая красивая?</div>' +
              opt(C.name + ' 😍') + opt('Тоже ' + C.name + ' 🥰') +
            '</div>' +
            '<p class="t-hl t-hl--sm poll__after"><span>Голосование честное 😌</span><br><span>Результаты однозначные</span></p>' +
          '</div>';
      },
      mount: function (el, api) {
        A.$$('.poll__opt', el).forEach(function (b) {
          b.addEventListener('click', function () {
            if (api.slide.done) return;
            b.classList.add('chosen');
            A.$('.poll', el).classList.add('voted');
            A.$('.poll-wrap', el).classList.add('voted');
            snd.success();
            A.vibrate(20);
            var c = A.center(b);
            fx.confetti({ x: c.x, y: c.y, count: 70, emoji: ['😍', '🥰', '👑'] });
            api.complete({ autoNext: 5000 });
          });
        });
      },
      hint: function (el) { pulse(A.$('.poll', el)); A.toast('Проголосуй — нажми на вариант 👆'); }
    };
  }

  /* =========================================================
     4. Таймер «Мы общаемся уже…»
     ========================================================= */
  function sTimer() {
    var KEYS = [['d', 'day'], ['h', 'hour'], ['m', 'minute'], ['s', 'second']];
    return {
      id: 'timer',
      cls: 'bg-night',
      duration: 15000,
      render: function () {
        return stars(42) +
          '<div class="sl sl--center">' +
            '<p class="t-hl rise" style="--d:.1s"><span>Мы общаемся уже ⏳</span></p>' +
            '<div class="cd stk pop-in" style="--d:.3s;--r:-1.5deg">' +
              '<div class="cd__title">с ' + A.dateLong(A.metAt) + ' 💬</div>' +
              '<div class="cd__grid">' + KEYS.map(function (k) {
                return '<div class="cd__cell"><b data-k="' + k[0] + '">0</b><i data-l="' + k[0] + '"></i></div>';
              }).join('') + '</div>' +
            '</div>' +
            '<ul class="facts">' + ['cal', 'hours', 'beats', 'nights'].map(function (f, i) {
              return '<li class="rise" style="--d:' + (1.1 + i * 0.5).toFixed(2) + 's" data-f="' + f + '"></li>';
            }).join('') + '</ul>' +
          '</div>';
      },
      enter: function (el, api) {
        function upd() {
          var s = A.since(A.metAt);
          var vals = { d: s.days, h: s.hours, m: s.minutes, s: s.seconds };
          KEYS.forEach(function (k) {
            var v = vals[k[0]];
            var b = A.$('[data-k="' + k[0] + '"]', el);
            var txt = k[0] === 'd' ? A.fmt(v) : A.pad(v);
            if (b.textContent !== txt) {
              b.textContent = txt;
              if (k[0] === 's') { b.classList.remove('tick'); void b.offsetWidth; b.classList.add('tick'); }
            }
            A.$('[data-l="' + k[0] + '"]', el).textContent = A.plural(v, A.W[k[1]]);
          });
        }
        upd();
        api.every(upd, 1000);

        var s = A.since(A.metAt);
        var cal = A.calendarDiff(A.metAt);
        var calTxt = A.joinRu([
          cal.years ? A.nw(cal.years, 'year') : '',
          cal.months ? A.nw(cal.months, 'month') : '',
          cal.days ? A.nw(cal.days, 'day') : ''
        ]) || 'совсем чуть-чуть';
        var beats = s.totalMinutes * 72;
        var beatsTxt = beats >= 1e6 ? (beats / 1e6).toFixed(1).replace('.', ',') + ' млн' : A.fmt(beats);
        var facts = {
          cal: '📅 Это <b>' + calTxt + '</b>',
          hours: '⏱️ Или <b>' + A.nw(s.totalHours, 'hour') + '</b> — и ни одного лишнего',
          beats: '💓 ≈ <b>' + beatsTxt + '</b> ударов моего сердца',
          nights: '🌙 <b>' + A.nw(s.days, 'times') + '</b> «спокойной ночи»'
        };
        Object.keys(facts).forEach(function (f) {
          var li = A.$('[data-f="' + f + '"]', el);
          li.innerHTML = facts[f];
          A.emojify(li);
        });
      }
    };
  }

  /* =========================================================
     5. Игра: накорми именинницу тортиком
     ========================================================= */
  function sFeed() {
    var photo = A.photos.length > 0 || A.hasSpecial('feedFace');
    var TOTAL = 5;
    var lines = ['Ням! 😋', 'Ммм, как вкусно! 🤤', 'Ещё кусочек! 🥰', 'Последний… наверное 🤭'];
    var pokes = ['Ну дай тортик 🥺', 'Я жду-у 😋', 'Тортик сам себя не съест 🍰'];
    return {
      id: 'feed',
      cls: 'bg-pink',
      interactive: true,
      render: function () {
        var slices = '';
        for (var i = 0; i < TOTAL; i++) {
          var x = 12 + i * (76 / (TOTAL - 1));
          slices += '<div class="slice" style="left:' + x.toFixed(1) + '%;--r:' + Math.round(A.rand(-16, 16)) + 'deg" data-interactive><span>🍰</span></div>';
        }
        return floaters(['🍰', '🧁', '🍓', '💕'], 7) +
          '<div class="sl">' +
            '<p class="t-hl feed__title rise"><span>Накорми именинницу</span><br><span>тортиком 🎂</span></p>' +
            '<div class="feed__face rise" style="--d:.2s" data-interactive>' +
              '<div class="feed__bubble">Покорми меня тортиком 🥺</div>' +
              '<div class="feed__avatar">' + (photo ? '<img data-pic="feedFace" alt="">' : '<span class="feed__big">😊</span>') + '</div>' +
              (photo ? '<div class="feed__react">😊</div>' : '') +
            '</div>' +
            '<div class="feed__meter rise" style="--d:.35s"><span>Сытость</span><div class="feed__bar"><i></i></div><span class="feed__count">0/' + TOTAL + '</span></div>' +
            '<div class="feed__table rise" style="--d:.45s">' +
              '<div class="feed__plate"></div><div class="feed__cake">🎂</div>' + slices +
            '</div>' +
          '</div>';
      },
      mount: function (el, api) {
        var face = A.$('.feed__face', el);
        var avatar = A.$('.feed__avatar', el);
        var react = A.$('.feed__react', el) || A.$('.feed__big', el);
        var bubble = A.$('.feed__bubble', el);
        var bar = A.$('.feed__bar i', el);
        var count = A.$('.feed__count', el);
        var slices = A.$$('.slice', el);
        var eaten = 0;
        var nearNow = false;

        function setReact(ch) { A.setText(react, ch); }
        function say(t) {
          A.setText(bubble, t);
          bubble.classList.remove('say');
          void bubble.offsetWidth;
          bubble.classList.add('say');
        }
        function near(s) {
          var a = A.center(avatar);
          var b = A.center(s);
          return Math.hypot(a.x - b.x, a.y - b.y) < a.r.width * 0.78;
        }
        function setNear(n) {
          if (n === nearNow) return;
          nearNow = n;
          face.classList.toggle('near', n);
          setReact(n ? '😮' : '😊');
        }
        function translateOf(s) {
          var m = (s.style.transform || '').match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
          return m ? { x: +m[1], y: +m[2] } : { x: 0, y: 0 };
        }

        function eat(s) {
          s.busy = true;
          var a = A.center(avatar);
          var b = A.center(s);
          var t = translateOf(s);
          var tx = t.x + (a.x - b.x);
          var ty = t.y + (a.y - b.y) + a.r.height * 0.12;
          setNear(true);
          var done = function () {
            s.classList.add('eaten');
            s.style.transform = '';
            s.busy = false;
            eaten++;
            snd.chomp();
            A.vibrate([15, 40, 15]);
            nearNow = false;
            face.classList.remove('near', 'munch');
            void face.offsetWidth;
            face.classList.add('munch');
            fx.confetti({
              x: a.x, y: a.y + a.r.height * 0.15, count: 24, spread: Math.PI * 1.7, speed: [2, 6], size: [4, 7],
              colors: ['#8b5a2b', '#f3d9a4', '#ffffff', '#ff9eb5', '#ffd1dc'], gravity: 0.25, ttl: 70
            });
            bar.style.width = (eaten / TOTAL * 100) + '%';
            count.textContent = eaten + '/' + TOTAL;
            api.setProgress(eaten / TOTAL);
            if (eaten >= TOTAL) { finish(); return; }
            say(lines[(eaten - 1) % lines.length]);
            setReact('😋');
            api.later(function () { if (!nearNow) setReact('😊'); }, 1000);
          };
          if (s.animate) {
            var an = s.animate([
              { transform: 'translate(' + t.x + 'px,' + t.y + 'px) scale(1)' },
              { transform: 'translate(' + tx + 'px,' + ty + 'px) scale(.3)', opacity: 0.15 }
            ], { duration: 380, easing: 'cubic-bezier(.4,0,.6,1)', fill: 'forwards' });
            an.onfinish = function () { done(); an.cancel(); };
          } else done();
        }

        function back(s) {
          setNear(false);
          setReact('🥺');
          s.classList.add('back');
          s.style.transform = '';
          snd.boing();
          api.later(function () { s.classList.remove('back'); setReact('😊'); }, 500);
        }

        function finish() {
          say('Я наелась! Спасибо, ' + fromName + ' 💕');
          setReact('🥰');
          var a = A.center(avatar);
          fx.hearts(a.x, a.y, 12);
          fx.confetti({ x: a.x, y: a.y, count: 90, emoji: ['🍰', '💖', '🥰'] });
          snd.success();
          api.complete();
        }

        slices.forEach(function (s) {
          s.addEventListener('pointerdown', function (e) {
            if (s.busy || s.classList.contains('eaten')) return;
            e.preventDefault();
            e.stopPropagation();
            try { s.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
            slices.forEach(function (x) { x.classList.remove('hinting'); });
            s.classList.remove('back');
            s.classList.add('dragging');
            var x0 = e.clientX;
            var y0 = e.clientY;
            var moved = false;
            function mv(ev) {
              var dx = ev.clientX - x0;
              var dy = ev.clientY - y0;
              if (Math.abs(dx) + Math.abs(dy) > 8) moved = true;
              s.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
              setNear(near(s));
            }
            function up(ev) {
              s.removeEventListener('pointermove', mv);
              s.removeEventListener('pointerup', up);
              s.removeEventListener('pointercancel', up);
              s.classList.remove('dragging');
              if (ev.type === 'pointercancel') back(s);
              else if (!moved || near(s)) eat(s);
              else back(s);
            }
            s.addEventListener('pointermove', mv);
            s.addEventListener('pointerup', up);
            s.addEventListener('pointercancel', up);
          });
        });

        face.addEventListener('click', function () {
          var a = A.center(avatar);
          if (api.slide.done) { fx.hearts(a.x, a.y, 6); snd.heart(); return; }
          say(A.pick(pokes));
        });
      },
      enter: function (el, api) {
        if (api.slide.done) return;
        api.later(function () {
          var s = A.$$('.slice:not(.eaten)', el)[0];
          if (s) s.classList.add('hinting');
        }, 1600);
      },
      hint: function (el) {
        var s = A.$$('.slice:not(.eaten)', el)[0];
        if (s) { s.classList.remove('hinting'); void s.offsetWidth; s.classList.add('hinting'); }
        A.toast('Перетащи кусочек к имениннице 👆 (или просто нажми)');
      }
    };
  }

  /* =========================================================
     6. Игра: задуй свечи
     ========================================================= */
  function sCandles() {
    var info = A.birthdayInfo();
    var digits = String(info.age).split('');
    return {
      id: 'candles',
      cls: 'bg-candle',
      interactive: true,
      render: function () {
        var bokeh = '';
        for (var i = 0; i < 10; i++) {
          var sz = A.rand(40, 130).toFixed(0);
          bokeh += '<i style="left:' + A.rand(-5, 90).toFixed(1) + '%;top:' + A.rand(0, 88).toFixed(1) + '%;width:' + sz + 'px;height:' + sz +
            'px;--t:' + A.rand(4, 8).toFixed(2) + 's;--d:' + (-A.rand(0, 6)).toFixed(2) + 's"></i>';
        }
        var cands = digits.map(function (d) {
          return '<div class="nc"><div class="nc__flame"></div>' +
            '<div class="nc__smoke"><i></i><i style="--d:.35s;--x:-12px"></i><i style="--d:.7s;--x:14px"></i></div>' +
            '<div class="nc__wick"></div><div class="nc__num">' + esc(d) + '</div></div>';
        }).join('');
        var colors = ['#ffd23f', '#3bceac', '#4f8cff', '#b15cff', '#fff', '#ff9f1c'];
        var spr = '';
        for (var k = 0; k < 16; k++) {
          spr += '<i class="sprinkle" style="left:' + A.rand(8, 90).toFixed(1) + '%;top:' + A.rand(12, 34).toFixed(1) +
            '%;--c:' + colors[k % colors.length] + ';--r:' + Math.round(A.rand(0, 180)) + 'deg"></i>';
        }
        return '<div class="bokeh" aria-hidden="true">' + bokeh + '</div>' +
          '<div class="candles__dark"></div>' +
          '<div class="sl sl--center candles">' +
            '<p class="t-hl rise"><span>Загадай желание 🤫</span><br><span>и задуй свечи!</span></p>' +
            '<div class="cake rise" style="--d:.2s" data-interactive>' +
              '<div class="cake__glow"></div>' +
              '<div class="cake__candles">' + cands + '</div>' +
              '<div class="cake__body"><div class="cake__top"></div><div class="cake__tier"></div><div class="cake__plate"></div>' + spr + '</div>' +
            '</div>' +
            '<div class="candles__ctrl rise" style="--d:.4s">' +
              '<button class="pill pill--glass mic-btn">🎤 Подуть в микрофон</button>' +
              '<div class="mic-meter" hidden><i></i></div>' +
              '<div class="candles__hint">или проведи пальцем по огонькам 💨</div>' +
            '</div>' +
            '<div class="candles__wish t-neon" hidden>Желание сбудется ✨<small>Я прослежу 😉</small></div>' +
          '</div>';
      },
      mount: function (el, api) {
        var cake = A.$('.cake', el);
        var ncs = A.$$('.nc', el);
        var micBtn = A.$('.mic-btn', el);
        var meter = A.$('.mic-meter', el);
        var meterI = A.$('.mic-meter i', el);
        var ctrl = A.$('.candles__ctrl', el);
        var wish = A.$('.candles__wish', el);
        var st = { mic: null, raf: 0, down: false };

        function lit() { return ncs.filter(function (n) { return !n.classList.contains('out'); }); }
        function blowOut(n) {
          if (n.classList.contains('out')) return;
          n.classList.add('out');
          snd.blow();
          A.vibrate(25);
          api.setProgress(1 - lit().length / ncs.length);
          if (!lit().length) allOut();
        }
        function check(e) {
          ncs.forEach(function (n) {
            if (n.classList.contains('out')) return;
            var f = A.$('.nc__flame', n).getBoundingClientRect();
            var pad = Math.max(18, f.width);
            if (e.clientX > f.left - pad && e.clientX < f.right + pad && e.clientY > f.top - pad * 1.3 && e.clientY < f.bottom + pad * 0.6) blowOut(n);
          });
        }
        cake.addEventListener('pointerdown', function (e) {
          if (api.slide.done) return;
          e.preventDefault();
          st.down = true;
          try { cake.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
          check(e);
        });
        cake.addEventListener('pointermove', function (e) { if (st.down) check(e); });
        cake.addEventListener('pointerup', function () { st.down = false; });
        cake.addEventListener('pointercancel', function () { st.down = false; });

        function stopMic() {
          if (st.mic) {
            st.mic.stream.getTracks().forEach(function (t) { t.stop(); });
            try { st.mic.src.disconnect(); } catch (err) { /* ignore */ }
            st.mic = null;
          }
          cancelAnimationFrame(st.raf);
          meter.hidden = true;
          cake.style.removeProperty('--lean');
          if (!api.slide.done) A.setText(micBtn, '🎤 Подуть в микрофон');
        }
        api.slide.stopMic = stopMic;

        function startMic() {
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            A.toast('Микрофон тут недоступен — проведи пальцем по огонькам 💨', 3200);
            return;
          }
          micBtn.disabled = true;
          navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } })
            .then(function (stream) {
              micBtn.disabled = false;
              var c = snd.ctx();
              if (!c || !api.isActive() || api.slide.done) { stream.getTracks().forEach(function (t) { t.stop(); }); return; }
              var src = c.createMediaStreamSource(stream);
              var an = c.createAnalyser();
              an.fftSize = 512;
              src.connect(an);
              var buf = new Uint8Array(an.fftSize);
              st.mic = { stream: stream, src: src };
              A.setText(micBtn, '🌬️ Дуй сильнее! (стоп)');
              meter.hidden = false;
              var level = 0;
              var acc = 0;
              var last = performance.now();
              (function loop() {
                if (!st.mic) return;
                an.getByteTimeDomainData(buf);
                var sum = 0;
                for (var i = 0; i < buf.length; i++) { var v = (buf[i] - 128) / 128; sum += v * v; }
                var rms = Math.sqrt(sum / buf.length);
                level = level * 0.6 + rms * 0.4;
                var now = performance.now();
                var dt = now - last;
                last = now;
                meterI.style.width = Math.min(100, level * 320).toFixed(0) + '%';
                cake.style.setProperty('--lean', (Math.min(1, level * 4) * 32).toFixed(1) + 'deg');
                if (level > 0.11) acc += dt; else acc = Math.max(0, acc - dt * 0.6);
                if (acc > 320) {
                  acc = 0;
                  var l = lit();
                  if (l.length) blowOut(l[0]);
                }
                st.raf = requestAnimationFrame(loop);
              })();
            })
            .catch(function () {
              micBtn.disabled = false;
              A.toast('Без микрофона тоже можно — проведи пальцем по огонькам 💨', 3200);
            });
        }
        micBtn.addEventListener('click', function () {
          if (st.mic) stopMic(); else startMic();
        });

        function allOut() {
          stopMic();
          cake.classList.add('all-out');
          el.classList.add('dim');
          ctrl.hidden = true;
          api.later(function () {
            el.classList.add('party');
            snd.happyBirthday();
            var c = A.center(cake);
            fx.confetti({ x: c.x, y: c.y - 40, count: 140, spread: Math.PI * 1.3, emoji: ['🎉', '🎂', '✨', '💖'] });
            api.later(function () {
              fx.confetti({ x: c.r.left, y: c.y, angle: -Math.PI / 3, spread: 0.9, count: 70 });
              fx.confetti({ x: c.r.right, y: c.y, angle: -2 * Math.PI / 3, spread: 0.9, count: 70 });
            }, 500);
            wish.hidden = false;
            wish.classList.add('rise');
            api.complete();
          }, 1000);
        }
      },
      leave: function (el, api) { if (api.slide.stopMic) api.slide.stopMic(); },
      hint: function () { A.toast('Проведи пальцем по огонькам или нажми «Подуть» 🌬️'); }
    };
  }

  /* =========================================================
     7. Фото-истории
     ========================================================= */
  function photoCaption(p, i) {
    var caps = C.photoCaptions || [];
    return p.caption || (caps.length ? caps[i % caps.length] : '');
  }
  function photoLayers(p, i, label) {
    var cap = photoCaption(p, i);
    return '<div class="ph__bg" data-thumb="' + i + '"></div>' +
      '<div class="ph__media"></div>' +
      '<div class="ph__shade"></div>' +
      (label ? '<div class="ph__label stk-pill pop-in" style="--d:.2s">' + esc(label) + '</div>' : '') +
      (cap ? '<div class="ph__cap rise" style="--d:.5s"><p class="t-hl t-hl--sm"><span>' + esc(cap) + '</span></p></div>' : '');
  }

  function sPhoto(p, i, id, label) {
    return {
      id: id,
      cls: 'photo-slide',
      duration: 6500,
      render: function () { return photoLayers(p, i, label); },
      enter: function (el, api) {
        var box = A.$('.ph__media', el);
        var img = A.$('img', box);
        if (img && img.complete && img.naturalWidth) return;
        if (!img) {
          img = document.createElement('img');
          img.className = 'ph__img';
          img.alt = '';
          img.decoding = 'async';
          box.appendChild(img);
        }
        api.wait(A.photoSrc(p).then(function (url) {
          if (!url) return;
          return new Promise(function (res) {
            img.onload = function () {
              // широкие фото и высокие скриншоты показываем целиком на размытом фоне
              var r = img.naturalWidth / img.naturalHeight;
              if (r > 1.05 || r < 0.5) img.classList.add('contain');
              img.classList.add('loaded');
              res();
            };
            img.onerror = function () { res(); };
            img.src = url;
          });
        }));
      },
      preload: function () { A.photoSrc(p).then(A.preload); }
    };
  }

  /* --- Видео-история: один общий <video> на весь сайт.
     Он «разблокируется» первым нажатием (экран блокировки), поэтому дальше iPhone
     разрешает играть видео со звуком без отдельного тапа. --- */
  var vid = null;
  A.videoEl = function () {
    if (!vid) {
      vid = document.createElement('video');
      vid.className = 'vid';
      vid.setAttribute('playsinline', '');
      vid.setAttribute('webkit-playsinline', '');
      vid.playsInline = true;
      vid.preload = 'auto';
      vid.disableRemotePlayback = true;
      A.sound.onChange(function (m) { vid.muted = m; });
    }
    return vid;
  };
  A.unlockVideo = function () {
    var v = A.videoEl();
    try {
      v.muted = true;
      v.load();
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
      v.pause();
      v.muted = A.sound.isMuted();
    } catch (e) { /* ignore */ }
  };

  function sVideo(p, i, id, label) {
    var st = { failed: false, url: '' };
    var api0 = null;
    function btn(el, mode) {
      var b = A.$('.vid__btn', el);
      b.hidden = !mode;
      if (mode) A.setText(b, mode === 'sound' ? '🔇 Нажми, чтобы включить звук' : '▶️ Нажми, чтобы посмотреть');
      b.setAttribute('data-mode', mode || '');
    }
    // Браузер не умеет этот формат — показываем кадр из видео, и история идёт сама по таймеру
    function fallback(el) {
      if (st.failed) return;
      st.failed = true;
      btn(el, null);
      A.videoEl().removeAttribute('src');
      var box = A.$('.ph__media', el);
      A.posterSrc(p).then(function (url) {
        if (!url) return;
        box.innerHTML = '<img class="ph__img loaded' + (p.w / p.h > 0.62 ? ' contain' : '') + '" alt="">';
        A.$('img', box).src = url;
      });
    }
    function start(el) {
      var v = A.videoEl();
      v.muted = A.sound.isMuted();
      v.onerror = function () { if (api0 && api0.isActive()) fallback(el); };
      var pr = v.play();
      if (!pr || !pr.catch) return Promise.resolve();
      return pr.catch(function (e) {
        if (e && e.name === 'AbortError') return; // запуск прервали паузой — это не запрет звука
        if (e && e.name === 'NotSupportedError') { fallback(el); return; }
        // звук без нажатия не разрешили — играем без звука и предлагаем включить
        v.muted = true;
        return v.play().then(function () {
          if (!A.sound.isMuted()) btn(el, 'sound');
        }, function () { btn(el, 'play'); });
      });
    }
    return {
      id: id,
      cls: 'photo-slide video-slide',
      duration: Math.round((p.duration || 10) * 1000) + 300,
      render: function () {
        return photoLayers(p, i, label) + '<button class="vid__btn" hidden></button>';
      },
      mount: function (el) {
        A.$('.vid__btn', el).addEventListener('click', function () {
          var v = A.videoEl();
          A.sound.unlock();
          if (A.sound.isMuted()) A.sound.setMuted(false);
          v.muted = false;
          var pr = v.play();
          if (pr && pr.catch) pr.catch(function () {});
          btn(el, null);
        });
      },
      enter: function (el, api) {
        api0 = api;
        if (st.failed) return;
        var v = A.videoEl();
        var box = A.$('.ph__media', el);
        box.appendChild(v);
        v.classList.toggle('contain', p.w && p.h ? p.w / p.h > 0.62 : false);
        btn(el, null);
        A.sound.pauseMusic();
        api.wait(A.photoSrc(p).then(function (url) {
          if (!url) { st.failed = true; api.later(function () { if (api.isActive()) api.next(); }, 4000); return; }
          if (st.url !== url || v.getAttribute('src') !== url) { st.url = url; v.src = url; }
          try { v.currentTime = 0; } catch (e) { /* ignore */ }
          return start(el);
        }));
      },
      leave: function () {
        var v = A.videoEl();
        v.onerror = null;
        v.pause();
        A.sound.playMusic();
      },
      clock: function () {
        if (st.failed) return null;
        var v = A.videoEl();
        return { t: v.currentTime || 0, d: v.duration || p.duration || 1, ended: v.ended };
      },
      setPaused: function (paused) {
        var v = A.videoEl();
        if (paused) v.pause();
        else if (st.url && v.paused && !v.ended) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
      },
      preload: function () { A.photoSrc(p); }
    };
  }

  /* =========================================================
     Как всё началось — IMVU
     ========================================================= */
  function sMet() {
    var how = C.howWeMet || {};
    return {
      id: 'imvu',
      cls: 'bg-imvu',
      duration: 9500,
      render: function () {
        return stars(26) +
          '<div class="imvu__beam imvu__beam--l"></div><div class="imvu__beam imvu__beam--r"></div>' +
          '<div class="sl sl--center imvu">' +
            '<p class="t-hl rise"><span>' + esc(how.title || 'А помнишь, как всё началось? 🎮') + '</span></p>' +
            '<div class="imvu__phone pop-in" style="--d:.3s;--r:-4deg"><img data-pic="imvu" alt=""></div>' +
            '<div class="imvu__ach"><span class="imvu__trophy">🏆</span><span><small>Достижение получено</small><b>' +
              esc(how.achievement || '«Встретить ту самую» ❤️') + '</b></span></div>' +
            '<p class="t-hl t-hl--sm rise" style="--d:2.2s"><span>' + esc(A.dateLong(A.metAt)) + ' · ' + esc(how.place || 'IMVU') + '</span><br><span>' +
              esc(how.text || 'Кто бы мог подумать, что из игры получится самое настоящее 💞') + '</span></p>' +
          '</div>';
      },
      enter: function (el, api) {
        var ach = A.$('.imvu__ach', el);
        ach.classList.remove('show');
        api.later(function () { ach.classList.add('show'); snd.ding(); A.vibrate(20); }, 1500);
        api.later(function () {
          var c = A.center(ach);
          fx.confetti({ x: c.x, y: c.y, count: 50, spread: Math.PI * 2, speed: [3, 8], emoji: ['🏆', '✨', '💜'] });
        }, 1650);
      }
    };
  }

  /* =========================================================
     8. Игра: лопни шарики
     ========================================================= */
  function sBalloons() {
    var N = C.balloonsToPop || 8;
    var list = A.shuffle(C.compliments && C.compliments.length ? C.compliments : ['Ты чудо ✨']);
    return {
      id: 'balloons',
      cls: 'bg-sky',
      interactive: true,
      render: function () {
        var clouds = [[4, 26, 15, 24], [62, 18, 12, 30], [30, 64, 17, 26], [74, 52, 11, 20]].map(function (c) {
          return '<span style="--x:' + c[0] + '%;--y:' + c[1] + '%;--s:' + c[2] + ';--t:' + c[3] + 's">☁️</span>';
        }).join('');
        return '<div class="clouds" aria-hidden="true">' + clouds + '</div>' +
          '<div class="sl balloons">' +
            '<p class="t-hl rise"><span>Лопни шарики 🎈</span><br><span>в каждом — правда о тебе</span></p>' +
          '</div>' +
          '<div class="balloons__field" data-interactive></div>' +
          '<div class="balloons__count stk-pill"><span>🎈</span><span><b>0</b> / ' + N + '</span></div>';
      },
      enter: function (el, api) {
        var field = A.$('.balloons__field', el);
        var countEl = A.$('.balloons__count b', el);
        var st = api.slide.st || (api.slide.st = { popped: 0, ci: 0 });
        countEl.textContent = Math.min(st.popped, N);

        function pop(b) {
          if (b._popped) return;
          b._popped = true;
          var c = A.center(b);
          if (b._an) b._an.cancel();
          b.remove();
          snd.pop();
          A.vibrate(12);
          fx.confetti({ x: c.x, y: c.y - 10, count: 26, spread: Math.PI * 2, speed: [3, 8], gravity: 0.22, ttl: 80 });
          st.popped++;
          var text = list[st.ci++ % list.length];
          var fr = field.getBoundingClientRect();
          var cm = document.createElement('div');
          cm.className = 'compliment';
          cm.style.left = A.clamp(c.x - fr.left, fr.width * 0.38, fr.width * 0.62) + 'px';
          cm.style.top = A.clamp(c.y - fr.top, fr.height * 0.28, fr.height * 0.78) + 'px';
          A.setText(cm, text);
          field.appendChild(cm);
          setTimeout(function () { cm.remove(); }, 2700);
          countEl.textContent = Math.min(st.popped, N);
          api.setProgress(st.popped / N);
          if (st.popped === N) {
            api.later(function () {
              var d = A.h('<div class="balloons__done rise"><p class="t-hl t-hl--pink"><span>Все комплименты —</span><br><span>чистая правда 😌💯</span></p></div>');
              A.emojify(d);
              el.appendChild(d);
              var r = el.getBoundingClientRect();
              fx.confetti({ x: r.left + r.width / 2, y: r.top + r.height / 2, count: 120, spread: Math.PI * 2, emoji: ['🎈', '💖', '✨'] });
              snd.success();
              api.complete();
              api.later(function () { fadeOut(d, 600); }, 3600);
              api.later(function () { d.remove(); }, 4300);
            }, 1500);
          }
        }

        function spawn() {
          if (!api.isActive() || field.querySelectorAll('.bln').length > 8) return;
          var b = document.createElement('button');
          b.className = 'bln';
          b.setAttribute('aria-label', 'Шарик');
          b.style.left = A.rand(14, 86).toFixed(1) + '%';
          b.style.setProperty('--h', A.pick([0, 25, 45, 120, 190, 215, 265, 300, 330]) + 'deg');
          b.style.setProperty('--sw', A.rand(1.8, 3).toFixed(2) + 's');
          b.innerHTML = '<span>🎈</span>';
          A.emojify(b);
          field.appendChild(b);
          var H = field.clientHeight + b.offsetHeight * 2.4;
          var dur = A.rand(6500, 9500) * (st.popped >= N ? 1.25 : 1);
          if (b.animate) {
            b._an = b.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(' + (-H) + 'px)' }], { duration: dur, easing: 'linear' });
            b._an.onfinish = function () { b.remove(); };
          } else {
            setTimeout(function () { b.remove(); }, 4000);
          }
          b.addEventListener('pointerdown', function (e) { e.preventDefault(); e.stopPropagation(); pop(b); });
        }
        spawn();
        api.later(spawn, 350);
        api.every(spawn, 800);
      },
      leave: function (el) {
        A.$$('.bln, .compliment', el).forEach(function (n) { n.remove(); });
      },
      hint: function () { A.toast('Нажимай на шарики 🎈'); }
    };
  }

  /* =========================================================
     9. Эмодзи-слайдер
     ========================================================= */
  function sSlider() {
    return {
      id: 'slider',
      cls: 'bg-magenta',
      interactive: true,
      render: function () {
        return '<div class="bg-anim"></div>' + floaters(['😍', '💗', '💞', '✨'], 8) +
          '<div class="sl sl--center">' +
            '<div class="es stk pop-in" style="--d:.15s;--r:-2deg" data-interactive>' +
              '<div class="es__q">Насколько сильно ' + esc(fromName) + ' тебя любит?</div>' +
              '<div class="es__track"><div class="es__fill"></div><div class="es__knob"><span>😍</span></div></div>' +
            '</div>' +
            '<div class="es__hint rise" style="--d:.6s">Потяни смайлик вправо 👉</div>' +
            '<div class="es__result" hidden>' +
              '<p class="t-hl t-hl--dark"><span>Ошибка 💥 Шкала не выдержала!</span></p>' +
              '<p class="t-neon">Больше, чем можно<br>измерить ❤️</p>' +
            '</div>' +
          '</div>';
      },
      mount: function (el, api) {
        var card = A.$('.es', el);
        var track = A.$('.es__track', el);
        var fill = A.$('.es__fill', el);
        var knob = A.$('.es__knob', el);
        var em = A.$('.es__knob > span', el);
        var hint = A.$('.es__hint', el);
        var dragging = false;
        var fired = false;
        function setVal(v) {
          v = A.clamp(v, 0, 1);
          fill.style.width = (v * 100) + '%';
          knob.style.left = (v * 100) + '%';
          em.style.setProperty('--k', (1 + v * 1.5).toFixed(3));
        }
        function valFrom(e) {
          var r = track.getBoundingClientRect();
          return (e.clientX - r.left) / r.width;
        }
        track.addEventListener('pointerdown', function (e) {
          if (fired) return;
          e.preventDefault();
          dragging = true;
          try { track.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
          card.classList.remove('anim');
          setVal(valFrom(e));
          fadeOut(hint);
        });
        track.addEventListener('pointermove', function (e) { if (dragging) setVal(valFrom(e)); });
        function release() {
          if (!dragging) return;
          dragging = false;
          overload();
        }
        track.addEventListener('pointerup', release);
        track.addEventListener('pointercancel', release);
        function overload() {
          if (fired) return;
          fired = true;
          card.classList.add('anim');
          setVal(1);
          snd.boing();
          api.later(function () {
            em.style.setProperty('--k', '3.2');
            card.classList.add('shake');
            snd.pop();
            A.vibrate([30, 50, 30]);
            var c = A.center(knob);
            fx.confetti({ x: c.x, y: c.y, count: 110, spread: Math.PI * 2, emoji: ['😍', '❤️', '💖', '💥'], emojiShare: 0.5 });
            fx.hearts(c.x, c.y, 10);
            A.$('.es__result', el).hidden = false;
            A.$('.es__result', el).classList.add('rise');
            api.later(function () { em.style.setProperty('--k', '1.6'); }, 400);
            api.complete({ autoNext: 6000 });
          }, 950);
        }
      },
      hint: function (el) { pulse(A.$('.es', el)); A.toast('Потяни смайлик 😍 вправо'); }
    };
  }

  /* =========================================================
     10. Игра: подарочные купоны (стереть)
     ========================================================= */
  function sCoupons() {
    var list = (C.coupons || []).slice(0, 6);
    return {
      id: 'coupons',
      cls: 'bg-warm',
      interactive: true,
      render: function () {
        return floaters(['🎟️', '✨', '🎁'], 6) +
          '<div class="sl sl--center coupons">' +
            '<p class="t-hl rise"><span>Подарочные купоны 🎟️</span><br><span>сотри, чтобы открыть</span></p>' +
            '<div class="cp-grid rise" style="--d:.2s">' + list.map(function (c, i) {
              return '<div class="cp" data-i="' + i + '" data-interactive>' +
                '<div class="cp__ticket"><div class="cp__emoji">' + esc(c.emoji || '🎁') + '</div>' +
                  '<div class="cp__title">' + esc(c.title) + '</div>' +
                  (c.note ? '<div class="cp__note">' + esc(c.note) + '</div>' : '') +
                '</div>' +
                '<canvas class="cp__scratch"></canvas>' +
                '<div class="cp__label"><span>🪙</span><span>Сотри</span></div>' +
              '</div>';
            }).join('') + '</div>' +
            '<p class="t-hl t-hl--sm coupons__note"><span>Сделай скриншот 📸</span><br><span>и предъяви ' + esc(fromDat) + ' 😉</span><br><span>Срок действия — бессрочно</span></p>' +
          '</div>';
      },
      enter: function (el, api) {
        var cards = A.$$('.cp', el);
        var total = cards.length;
        var opened = function () { return A.$$('.cp.revealed', el).length; };

        function onReveal() {
          var n = opened();
          api.setProgress(n / total);
          if (n === total && !api.slide.done) {
            A.$('.coupons', el).classList.add('all');
            var r = el.getBoundingClientRect();
            fx.confetti({ x: r.left + r.width / 2, y: r.top + r.height * 0.6, count: 120, spread: Math.PI * 1.3, emoji: ['🎟️', '🎁', '✨'] });
            snd.success();
            api.complete();
          }
        }

        function setup(cp) {
          var cv = A.$('canvas', cp);
          var W = cp.offsetWidth;
          var H = cp.offsetHeight;
          if (!W || !H) return;
          cp._init = true;
          var dpr = Math.min(2, window.devicePixelRatio || 1);
          cv.width = Math.round(W * dpr);
          cv.height = Math.round(H * dpr);
          var g = cv.getContext('2d', { willReadFrequently: true });
          g.scale(dpr, dpr);
          var grad = g.createLinearGradient(0, 0, W, H);
          grad.addColorStop(0, '#c9ced6');
          grad.addColorStop(0.45, '#f3f4f7');
          grad.addColorStop(0.55, '#e1e4ea');
          grad.addColorStop(1, '#a9afba');
          g.fillStyle = grad;
          g.fillRect(0, 0, W, H);
          g.strokeStyle = 'rgba(255,255,255,.32)';
          g.lineWidth = 2;
          for (var x = -H; x < W; x += 11) { g.beginPath(); g.moveTo(x, H); g.lineTo(x + H, 0); g.stroke(); }
          g.fillStyle = 'rgba(255,255,255,.85)';
          for (var i = 0; i < 16; i++) {
            var sx = A.rand(6, W - 6);
            var sy = A.rand(6, H - 6);
            var rr = A.rand(1.2, 2.6);
            g.beginPath();
            g.moveTo(sx, sy - rr * 2.4); g.lineTo(sx + rr * 0.6, sy - rr * 0.6); g.lineTo(sx + rr * 2.4, sy);
            g.lineTo(sx + rr * 0.6, sy + rr * 0.6); g.lineTo(sx, sy + rr * 2.4); g.lineTo(sx - rr * 0.6, sy + rr * 0.6);
            g.lineTo(sx - rr * 2.4, sy); g.lineTo(sx - rr * 0.6, sy - rr * 0.6);
            g.closePath();
            g.fill();
          }
          g.globalCompositeOperation = 'destination-out';
          g.lineCap = 'round';
          g.lineJoin = 'round';
          g.strokeStyle = '#000';
          g.fillStyle = '#000';
          g.lineWidth = Math.max(24, W * 0.18);
          var down = false;
          var last = null;
          var moves = 0;
          function pos(e) {
            var b = cv.getBoundingClientRect();
            return { x: (e.clientX - b.left) * (W / b.width), y: (e.clientY - b.top) * (H / b.height) };
          }
          function check() {
            if (cp._done) return;
            var d;
            try { d = g.getImageData(0, 0, cv.width, cv.height).data; } catch (err) { reveal(); return; }
            var tot = 0;
            var clear = 0;
            for (var k = 3; k < d.length; k += 4 * 23) { tot++; if (d[k] < 90) clear++; }
            if (clear / tot > 0.5) reveal();
          }
          function reveal() {
            if (cp._done) return;
            cp._done = true;
            cv.classList.add('gone');
            cp.classList.add('revealed', 'touched');
            snd.ding();
            A.vibrate(15);
            var c = A.center(cp);
            var em = list[+cp.getAttribute('data-i')].emoji || '🎁';
            fx.confetti({ x: c.x, y: c.y, count: 40, spread: Math.PI * 2, speed: [3, 8], emoji: [em, '✨'] });
            onReveal();
          }
          cv.addEventListener('pointerdown', function (e) {
            if (cp._done) return;
            e.preventDefault();
            down = true;
            try { cv.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
            last = pos(e);
            g.beginPath();
            g.arc(last.x, last.y, g.lineWidth / 2, 0, Math.PI * 2);
            g.fill();
            cp.classList.add('touched');
          });
          cv.addEventListener('pointermove', function (e) {
            if (!down) return;
            var p = pos(e);
            g.beginPath();
            g.moveTo(last.x, last.y);
            g.lineTo(p.x, p.y);
            g.stroke();
            last = p;
            snd.scratch();
            if (++moves % 5 === 0) check();
          });
          function end() { if (!down) return; down = false; check(); }
          cv.addEventListener('pointerup', end);
          cv.addEventListener('pointercancel', end);
        }

        requestAnimationFrame(function () {
          cards.forEach(function (cp) { if (!cp._init) setup(cp); });
        });
      },
      hint: function () { A.toast('Сотри серебристый слой пальцем 🪙'); }
    };
  }

  /* =========================================================
     11. Печенька с предсказанием
     ========================================================= */
  function sCookie() {
    var preds = C.predictions && C.predictions.length ? C.predictions : ['Тебя ждёт прекрасный год ✨'];
    var pred = A.pick(preds);
    return {
      id: 'cookie',
      cls: 'bg-mystic',
      interactive: true,
      render: function () {
        return stars(34) +
          '<div class="sl sl--center">' +
            '<p class="t-hl rise"><span>Предсказание</span><br><span>на новый год жизни 🔮</span></p>' +
            '<button class="ck__cookie rise" style="--d:.2s" data-interactive aria-label="Печенька с предсказанием">' +
              '<span class="ck__glow"></span><span class="ck__half ck__half--l">🥠</span><span class="ck__half ck__half--r">🥠</span>' +
            '</button>' +
            '<div class="ck__taps"><i></i><i></i><i></i></div>' +
            '<div class="ck__hint">Разломи печеньку — нажми 3 раза 👆</div>' +
            '<div class="ck__paper" hidden><div class="ck__text"></div></div>' +
          '</div>';
      },
      mount: function (el, api) {
        var btn = A.$('.ck__cookie', el);
        var taps = A.$$('.ck__taps i', el);
        var n = 0;
        btn.addEventListener('click', function () {
          if (n >= 3) return;
          n++;
          taps[n - 1].classList.add('on');
          var c = A.center(btn);
          snd.crack();
          A.vibrate(15);
          fx.confetti({ x: c.x, y: c.y, count: 10 + n * 6, spread: Math.PI * 2, speed: [2, 6], size: [3, 6], colors: ['#d9a35b', '#f0c987', '#b97a2e', '#fff1cf'], gravity: 0.3, ttl: 70 });
          btn.classList.remove('w1', 'w2');
          void btn.offsetWidth;
          if (n < 3) { btn.classList.add(n === 1 ? 'w1' : 'w2'); return; }
          btn.classList.add('open');
          snd.sparkle();
          A.$('.ck__hint', el).hidden = true;
          A.$('.ck__taps', el).hidden = true;
          var paper = A.$('.ck__paper', el);
          A.setText(A.$('.ck__text', paper), pred);
          paper.hidden = false;
          fx.confetti({ x: c.x, y: c.y, count: 60, emoji: ['✨', '🔮', '⭐'] });
          api.complete();
        });
      },
      hint: function (el) { pulse(A.$('.ck__cookie', el)); A.toast('Нажми на печеньку 🥠'); }
    };
  }

  /* =========================================================
     12. «Ты меня любишь?»
     ========================================================= */
  function sAsk() {
    var noLabels = ['Нет', 'Точно? 🤨', 'Подумай ещё 🥺', 'Не-а 😏', 'Ну пожалуйста 🙏', 'Мимо 🙈'];
    return {
      id: 'ask',
      cls: 'bg-love',
      interactive: true,
      render: function () {
        return floaters(['❤️', '💕', '💗', '💘'], 9) +
          '<div class="sl sl--center ask" data-interactive>' +
            '<div class="ask__emoji rise"><span class="bob">🥺</span></div>' +
            '<p class="t-hl rise" style="--d:.15s"><span>И последний вопрос…</span></p>' +
            '<h2 class="t-neon ask__q rise" style="--d:.3s">Ты меня любишь?</h2>' +
            '<div class="ask__btns rise" style="--d:.5s">' +
              '<button class="pill pill--yes">Да ❤️</button>' +
              '<button class="pill pill--no">Нет</button>' +
            '</div>' +
            '<div class="ask__after" hidden>' +
              '<p class="t-big">Я так и знал 😌</p>' +
              '<p class="t-hl"><span>Я тебя тоже очень-очень люблю ❤️</span></p>' +
            '</div>' +
          '</div>';
      },
      mount: function (el, api) {
        var wrap = A.$('.ask', el);
        var btns = A.$('.ask__btns', el);
        var yes = A.$('.pill--yes', el);
        var no = A.$('.pill--no', el);
        var emo = A.$('.ask__emoji', el);
        var tries = 0;
        var lastFlee = 0;

        function flee(e) {
          if (e) { e.preventDefault(); e.stopPropagation(); }
          if (api.slide.done) return;
          var now = Date.now();
          if (now - lastFlee < 250) return;
          lastFlee = now;
          tries++;
          snd.swoosh();
          A.vibrate(10);
          if (tries > noLabels.length) {
            no.classList.add('gone');
            A.toast('Кнопка «Нет» сломалась 🤷‍♂️');
            yes.style.setProperty('--grow', '1.45');
            return;
          }
          var wr = wrap.getBoundingClientRect();
          if (!no.classList.contains('fly')) {
            var br0 = no.getBoundingClientRect();
            wrap.appendChild(no);
            no.classList.add('fly');
            no.style.transition = 'none';
            no.style.left = (br0.left - wr.left) + 'px';
            no.style.top = (br0.top - wr.top) + 'px';
            void no.offsetWidth;
            no.style.transition = '';
          }
          A.setText(no, noLabels[Math.min(tries, noLabels.length - 1)]);
          var bw = no.offsetWidth;
          var bh = no.offsetHeight;
          // Куда можно прыгнуть: вся история, кроме шапки, кнопки «Дальше», текста и кнопки «Да»
          // («Да» скоро подрастёт — заранее учитываем её будущий размер)
          var g = 1 + tries * 0.08;
          var pad = 10;
          var blocks = ['.ask__emoji', '.t-hl', '.ask__q'].map(function (sel) {
            var r = A.$(sel, el).getBoundingClientRect();
            return { l: r.left - wr.left - pad, t: r.top - wr.top - pad, r: r.right - wr.left + pad, b: r.bottom - wr.top + pad };
          });
          var yr = yes.getBoundingClientRect();
          var ycx = (yr.left + yr.right) / 2 - wr.left;
          var ycy = (yr.top + yr.bottom) / 2 - wr.top;
          var yhw = yes.offsetWidth * g / 2 + 14;
          var yhh = yes.offsetHeight * g / 2 + 14;
          blocks.push({ l: ycx - yhw, t: ycy - yhh, r: ycx + yhw, b: ycy + yhh });
          var minY = 72;
          var maxY = Math.max(minY + 1, wr.height - bh - 72);
          var spots = [];
          var far = null;
          for (var gx = 0; gx <= 6; gx++) {
            for (var gy = 0; gy <= 10; gy++) {
              var x = 10 + (wr.width - bw - 20) * gx / 6;
              var y = minY + (maxY - minY) * gy / 10;
              var hit = blocks.some(function (q) { return x < q.r && x + bw > q.l && y < q.b && y + bh > q.t; });
              if (hit) continue;
              var d = e && e.clientX != null ? Math.hypot(wr.left + x + bw / 2 - e.clientX, wr.top + y + bh / 2 - e.clientY) : 999;
              if (d >= 110) spots.push([x, y]);
              if (!far || d > far.d) far = { d: d, x: x, y: y };
            }
          }
          var spot = spots.length ? A.pick(spots) : far ? [far.x, far.y] : [10, maxY];
          no.style.left = spot[0] + 'px';
          no.style.top = spot[1] + 'px';
          yes.style.setProperty('--grow', (1 + tries * 0.08).toFixed(2));
        }
        no.addEventListener('pointerdown', flee);
        no.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') flee(e); });
        no.addEventListener('click', function (e) { e.preventDefault(); if (Date.now() - lastFlee > 600) flee(); });

        yes.addEventListener('click', function () {
          if (api.slide.done) return;
          btns.hidden = true;
          no.hidden = true;
          A.setText(A.$('span', emo), '🥰');
          emo.classList.remove('rise');
          emo.classList.add('yay');
          A.$('.ask__after', el).hidden = false;
          A.$('.ask__after', el).classList.add('rise');
          var c = A.center(emo);
          fx.hearts(c.x, c.y, 16, { max: 52, rise: 380 });
          fx.confetti({ x: c.x, y: c.y, count: 150, spread: Math.PI * 2, emoji: ['❤️', '💖', '💘', '🥰'], emojiShare: 0.4 });
          snd.success();
          A.vibrate([20, 40, 20, 40, 60]);
          api.complete({ autoNext: 6500 });
        });
      },
      hint: function (el) { pulse(A.$('.pill--yes', el)); A.toast('Ответь на вопрос 😉'); }
    };
  }

  /* =========================================================
     13. Письмо
     ========================================================= */
  function sLetter() {
    return {
      id: 'letter',
      cls: 'bg-peach',
      interactive: true,
      render: function () {
        return floaters(['💌', '💕', '✨', '🌸'], 7) +
          '<div class="sl sl--center lt">' +
            '<div class="env rise" data-interactive role="button" tabindex="0" aria-label="Открыть письмо">' +
              '<div class="env__back"></div>' +
              '<div class="env__card"><span>' + esc(C.name) + ' ❤️</span></div>' +
              '<div class="env__front"></div><div class="env__flap"></div>' +
              '<div class="env__seal">💌</div>' +
            '</div>' +
            '<p class="t-hl t-hl--sm lt__hint rise" style="--d:.3s"><span>Тебе письмо от ' + esc(fromGen) + ' 💌</span><br><span>Нажми, чтобы открыть</span></p>' +
          '</div>' +
          '<div class="paper" hidden><div class="paper__text"></div><div class="paper__sign"></div></div>' +
          '<button class="paper__skip" hidden>Показать всё ›</button>';
      },
      mount: function (el, api) {
        var env = A.$('.env', el);
        var paper = A.$('.paper', el);
        var textEl = A.$('.paper__text', el);
        var skip = A.$('.paper__skip', el);
        A.setText(A.$('.paper__sign', el), sign + ' ❤️');
        var opened = false;
        var timer = 0;
        var tokens = A.tokenize(C.letter || '');
        var i = 0;
        var caret = null;
        var userScrolled = false;

        function appendToken(tk) {
          if (tk.e && !A.nativeEmoji) {
            var src = A.emojiSrc(tk.t);
            if (src) { textEl.insertBefore(A.emojiImg(tk.t, src), caret); return; }
          }
          var prev = caret.previousSibling;
          if (prev && prev.nodeType === 3) prev.nodeValue += tk.t;
          else textEl.insertBefore(document.createTextNode(tk.t), caret);
        }
        function finish() {
          clearTimeout(timer);
          timer = 0;
          if (!caret) return;
          while (i < tokens.length) appendToken(tokens[i++]);
          caret.remove();
          caret = null;
          skip.hidden = true;
          paper.classList.add('done');
          if (!api.slide.done) { snd.sparkle(); api.complete(); }
        }
        api.slide.finishTyping = finish;
        function step() {
          if (i >= tokens.length) { finish(); return; }
          var tk = tokens[i++];
          appendToken(tk);
          api.setProgress(i / tokens.length);
          if (!userScrolled) paper.scrollTop = paper.scrollHeight;
          var t = tk.t;
          var delay = tk.e ? 160 : /[.!?…]/.test(t) ? 280 : /[,—:;]/.test(t) ? 130 : t === '\n' ? 180 : 26;
          timer = setTimeout(step, delay);
        }
        function open() {
          if (opened) return;
          opened = true;
          env.classList.add('open');
          snd.whoosh();
          fadeOut(A.$('.lt__hint', el));
          api.later(function () { env.classList.add('gone'); }, 1250);
          api.later(function () {
            paper.hidden = false;
            skip.hidden = false;
            caret = document.createElement('span');
            caret.className = 'paper__caret';
            textEl.appendChild(caret);
            step();
          }, 1650);
        }
        env.addEventListener('click', open);
        env.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
        paper.addEventListener('scroll', function () {
          if (!caret) return;
          userScrolled = paper.scrollTop + paper.clientHeight < paper.scrollHeight - 40;
        }, { passive: true });
        paper.addEventListener('click', function () { if (caret) finish(); });
        skip.addEventListener('click', function () { if (caret) finish(); });
      },
      leave: function (el, api) { if (api.slide.finishTyping) api.slide.finishTyping(); },
      hint: function (el) { pulse(A.$('.env', el)); A.toast('Нажми на конверт 💌'); }
    };
  }

  /* =========================================================
     14. Финал
     ========================================================= */
  // Точки на контуре сердца на равном расстоянии друг от друга
  function heartPoints(n) {
    var raw = [];
    var M = 720;
    for (var i = 0; i <= M; i++) {
      var t = (i / M) * Math.PI * 2;
      raw.push({
        x: 16 * Math.pow(Math.sin(t), 3),
        y: -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))
      });
    }
    var len = [0];
    for (var j = 1; j < raw.length; j++) len.push(len[j - 1] + Math.hypot(raw[j].x - raw[j - 1].x, raw[j].y - raw[j - 1].y));
    var total = len[len.length - 1];
    var out = [];
    var idx = 0;
    for (var k = 0; k < n; k++) {
      var target = (k / n) * total;
      while (idx < len.length - 1 && len[idx] < target) idx++;
      out.push(raw[idx]);
    }
    return out;
  }
  function sFinal() {
    var photos = A.photos;
    var center = photos.length > 0 || A.hasSpecial('us');
    return {
      id: 'final',
      cls: 'bg-final',
      duration: 9000,
      final: true,
      render: function () {
        var usePhotos = photos.length >= 3;
        var N = usePhotos ? 22 : 28;
        var dots = '';
        var hearts = ['❤️', '💖'];
        var pts = heartPoints(N);
        for (var k = 0; k < N; k++) {
          var px = ((pts[k].x + 16) / 32 * 100).toFixed(1);
          var py = ((pts[k].y + 12) / 29 * 100).toFixed(1);
          var style = 'style="--x:' + px + '%;--y:' + py + '%;--i:' + k + (usePhotos ? '' : ';--s:8') + '"';
          if (usePhotos) {
            dots += '<div class="fin__dot ph" ' + style + '><img data-thumb="' + (k % photos.length) + '" alt="" decoding="async"></div>';
          } else {
            dots += '<div class="fin__dot em" ' + style + '>' + hearts[k % hearts.length] + '</div>';
          }
        }
        return stars(30) +
          '<div class="sl sl--center">' +
            '<div class="fin__heart">' + dots +
              '<div class="fin__center' + (center ? ' ph' : '') + '">' + (center ? '<img data-pic="us" alt="">' : '💖') + '</div>' +
            '</div>' +
            '<h1 class="t-neon fin__title rise" style="--d:2.1s">С днём рождения,<br>любимая!</h1>' +
            '<p class="fin__sub rise" style="--d:2.5s">Я тебя очень люблю ❤️<br><span class="fin__sign">' + esc(sign) + '</span></p>' +
            '<div class="fin__btns rise" style="--d:2.9s">' +
              '<button class="pill pill--white" data-act="replay">🔁 Сначала</button>' +
              '<button class="pill pill--glass" data-act="reply">💬 Ответить</button>' +
            '</div>' +
          '</div>';
      },
      mount: function (el, api) {
        A.$('[data-act="replay"]', el).addEventListener('click', function () { snd.tap(); api.restart(); });
        A.$('[data-act="reply"]', el).addEventListener('click', function () { api.openReply(); });
      },
      enter: function (el, api) {
        api.later(function () { snd.success(); }, 2100);
        api.later(function () { fx.rain({ duration: 2600, rate: 3 }); }, 2200);
        var fire = function () {
          var r = el.getBoundingClientRect();
          fx.firework(A.rand(r.left + 40, r.right - 40), A.rand(r.top + r.height * 0.12, r.top + r.height * 0.42));
        };
        api.later(function () { fire(); api.every(fire, 1100); }, 2600);
      },
      preload: function () { A.picAsync('us'); }
    };
  }

  /* ---------- Порядок историй ---------- */
  A.buildSlides = function () {
    var blocks = C.photoBlocks || {};
    function block(n, fallbackLabel) {
      var count = 0;
      return A.storyBlock(n).map(function (p) {
        var i = A.photos.indexOf(p);
        var label = count === 0 ? (blocks[n] || fallbackLabel) : '';
        count++;
        var id = 'b' + n + '-' + count;
        return p.video ? sVideo(p, i, id, label) : sPhoto(p, i, id, label);
      });
    }
    var list = [sIntro(), sHB(), sPoll()];
    if (A.hasSpecial('imvu')) list.push(sMet());
    list.push(sTimer(), sFeed(), sCandles());
    list = list.concat(block(1, '📸 Наши моменты'));
    list.push(sBalloons(), sSlider());
    list = list.concat(block(2, '❤️ Это мы'));
    list.push(sCoupons(), sCookie(), sAsk(), sLetter(), sFinal());
    return list;
  };
})();
