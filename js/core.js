/* Общие помощники: DOM, даты, склонения, iOS-эмодзи, фото, тосты, иконки */
(function () {
  'use strict';

  var C = window.CONFIG || {};
  var App = (window.App = window.App || {});

  /* ---------- DOM ---------- */
  App.$ = function (sel, root) { return (root || document).querySelector(sel); };
  App.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  App.h = function (html) {
    var t = document.createElement('template');
    t.innerHTML = String(html).trim();
    return t.content.firstElementChild;
  };
  App.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  App.rand = function (a, b) { return a + Math.random() * (b - a); };
  App.pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
  App.clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  App.shuffle = function (arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  };
  App.vibrate = function (p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { /* ignore */ } };
  App.center = function (el) {
    var r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: r };
  };
  App.reducedMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------- Хранилище (может быть недоступно — тогда просто не запоминаем) ---------- */
  App.store = {
    get: function (k, d) {
      try { var v = localStorage.getItem('alena:' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; }
    },
    set: function (k, v) {
      try { localStorage.setItem('alena:' + k, JSON.stringify(v)); } catch (e) { /* ignore */ }
    }
  };

  /* ---------- Склонения и числа ---------- */
  App.plural = function (n, forms) {
    n = Math.abs(Math.floor(n)) % 100;
    var n1 = n % 10;
    if (n > 10 && n < 20) return forms[2];
    if (n1 > 1 && n1 < 5) return forms[1];
    if (n1 === 1) return forms[0];
    return forms[2];
  };
  App.fmt = function (n) {
    return String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };
  App.W = {
    year: ['год', 'года', 'лет'],
    month: ['месяц', 'месяца', 'месяцев'],
    week: ['неделя', 'недели', 'недель'],
    day: ['день', 'дня', 'дней'],
    hour: ['час', 'часа', 'часов'],
    minute: ['минута', 'минуты', 'минут'],
    second: ['секунда', 'секунды', 'секунд'],
    times: ['раз', 'раза', 'раз']
  };
  App.nw = function (n, key) { return App.fmt(n) + ' ' + App.plural(n, App.W[key]); };

  /* ---------- Даты ---------- */
  var MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  var MONTHS_SHORT = ['янв.', 'февр.', 'мар.', 'апр.', 'мая', 'июн.', 'июл.', 'авг.', 'сент.', 'окт.', 'нояб.', 'дек.'];
  var WEEKDAYS = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
  var WEEKDAYS_SHORT = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

  function parseLocal(str) {
    var m = String(str || '').match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
    if (!m) return new Date(NaN);
    return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
  }
  App.parseLocal = parseLocal;
  App.birth = parseLocal(C.birthday || '1995-10-11');
  App.metAt = parseLocal(C.metAt || '2025-03-22T00:00');
  App.startOfDay = function (d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };

  App.dateLong = function (d, withYear) {
    return d.getDate() + ' ' + MONTHS_GEN[d.getMonth()] + (withYear === false ? '' : ' ' + d.getFullYear());
  };
  App.dateShort = function (d) { return d.getDate() + ' ' + MONTHS_SHORT[d.getMonth()]; };
  App.weekday = function (d) { return WEEKDAYS[d.getDay()]; };
  App.weekdayShort = function (d) { return WEEKDAYS_SHORT[d.getDay()]; };
  App.pad = function (n) { return (n < 10 ? '0' : '') + n; };

  /* День рождения, который сейчас празднуем: ближайший впереди (если до него < 2 месяцев)
     или последний прошедший. Отсюда считается возраст. */
  App.birthdayInfo = function (now) {
    now = now || new Date();
    var b = App.birth;
    var y = now.getFullYear();
    var thisYear = new Date(y, b.getMonth(), b.getDate());
    var today = App.startOfDay(now);
    var daysTo = Math.round((thisYear - today) / 864e5);
    var celebrated = daysTo <= 60 ? y : y - 1;
    if (daysTo < 0) celebrated = y;
    var date = new Date(celebrated, b.getMonth(), b.getDate());
    var diff = Math.round((date - today) / 864e5);
    return {
      age: celebrated - b.getFullYear(),
      date: date,
      daysTo: diff, // >0 — впереди, 0 — сегодня, <0 — уже было
      isToday: diff === 0
    };
  };

  /* Сколько прошло с момента знакомства */
  App.since = function (from, now) {
    now = now || new Date();
    var ms = Math.max(0, now - from);
    return {
      ms: ms,
      days: Math.floor(ms / 864e5),
      hours: Math.floor(ms / 36e5) % 24,
      minutes: Math.floor(ms / 6e4) % 60,
      seconds: Math.floor(ms / 1e3) % 60,
      totalHours: Math.floor(ms / 36e5),
      totalMinutes: Math.floor(ms / 6e4),
      totalSeconds: Math.floor(ms / 1e3)
    };
  };
  App.calendarDiff = function (from, now) {
    now = now || new Date();
    if (now < from) return { years: 0, months: 0, days: 0 };
    var y = now.getFullYear() - from.getFullYear();
    var m = now.getMonth() - from.getMonth();
    var d = now.getDate() - from.getDate();
    var nowT = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    var fromT = from.getHours() * 3600 + from.getMinutes() * 60 + from.getSeconds();
    if (nowT < fromT) d -= 1;
    if (d < 0) { m -= 1; d += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
    if (m < 0) { y -= 1; m += 12; }
    return { years: y, months: m, days: d };
  };
  App.joinRu = function (parts) {
    parts = parts.filter(Boolean);
    if (parts.length <= 1) return parts.join('');
    return parts.slice(0, -1).join(', ') + ' и ' + parts[parts.length - 1];
  };

  /* «3 ч» в шапке истории */
  App.storyTime = function () {
    var info = App.birthdayInfo();
    var now = new Date();
    if (info.isToday) {
      var mins = Math.floor((now - App.startOfDay(now)) / 6e4);
      if (mins < 1) return 'сейчас';
      if (mins < 60) return mins + ' мин.';
      return Math.floor(mins / 60) + ' ч.';
    }
    return App.dateShort(info.date);
  };

  /* ---------- iOS-эмодзи ---------- */
  var UA = navigator.userAgent || '';
  App.isApple = /iPhone|iPad|iPod|Macintosh|Mac OS X/.test(UA) && !/Android|Windows/.test(UA);
  App.nativeEmoji = App.isApple;
  try {
    var q = new URLSearchParams(location.search);
    if (q.get('emoji') === 'img') App.nativeEmoji = false;
    if (q.get('emoji') === 'native') App.nativeEmoji = true;
  } catch (e) { /* ignore */ }

  var KEYS = {};
  (window.EMOJI_KEYS || []).forEach(function (k) { KEYS[k] = true; });
  var EMOJI_RE = null;
  try {
    EMOJI_RE = new RegExp('(?:\\p{Extended_Pictographic}|\\p{Regional_Indicator})(?:\\uFE0F|\\p{Emoji_Modifier})?(?:\\u200D\\p{Extended_Pictographic}(?:\\uFE0F|\\p{Emoji_Modifier})?)*', 'gu');
  } catch (e) { EMOJI_RE = null; }

  App.emojiKey = function (s) {
    return Array.from(s).map(function (c) { return c.codePointAt(0).toString(16); })
      .filter(function (h) { return h !== 'fe0f'; }).join('-');
  };
  App.emojiSrc = function (s) {
    var k = App.emojiKey(s);
    return KEYS[k] ? 'assets/emoji/' + k + '.webp' : null;
  };
  App.emojiImg = function (ch, src) {
    var img = document.createElement('img');
    img.className = 'emoji';
    img.alt = ch;
    img.draggable = false;
    img.decoding = 'async';
    img.onerror = function () { if (img.parentNode) img.parentNode.replaceChild(document.createTextNode(ch), img); };
    img.src = src;
    return img;
  };
  /* Заменяет эмодзи в тексте на картинки в стиле iOS (на iPhone/Mac — оставляет родные) */
  App.emojify = function (root) {
    if (!root || App.nativeEmoji || !EMOJI_RE) return root;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while (walker.nextNode()) {
      var n = walker.currentNode;
      var p = n.parentNode;
      if (!p || (p.nodeType === 1 && p.closest && p.closest('script,style,textarea,input,.no-emoji'))) continue;
      EMOJI_RE.lastIndex = 0;
      if (EMOJI_RE.test(n.nodeValue)) nodes.push(n);
    }
    nodes.forEach(function (node) {
      var text = node.nodeValue;
      var frag = null;
      var last = 0;
      var m;
      EMOJI_RE.lastIndex = 0;
      while ((m = EMOJI_RE.exec(text))) {
        var src = App.emojiSrc(m[0]);
        if (!src) continue;
        frag = frag || document.createDocumentFragment();
        if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
        frag.appendChild(App.emojiImg(m[0], src));
        last = m.index + m[0].length;
      }
      if (!frag) return;
      if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
      node.parentNode.replaceChild(frag, node);
    });
    return root;
  };
  App.setText = function (el, text) {
    el.textContent = text;
    App.emojify(el);
    return el;
  };
  /* Делит строку на кусочки «текст»/«эмодзи» — для эффекта печатной машинки */
  App.tokenize = function (text) {
    var out = [];
    if (!EMOJI_RE) return Array.from(text).map(function (c) { return { t: c }; });
    var last = 0;
    var m;
    EMOJI_RE.lastIndex = 0;
    while ((m = EMOJI_RE.exec(text))) {
      if (m.index > last) Array.from(text.slice(last, m.index)).forEach(function (c) { out.push({ t: c }); });
      out.push({ t: m[0], e: true });
      last = m.index + m[0].length;
    }
    Array.from(text.slice(last)).forEach(function (c) { out.push({ t: c }); });
    return out;
  };

  /* ---------- Фото ---------- */
  App.photos = [];
  var IMG_RE = /\.(jpe?g|png|webp|gif|avif)$/i;

  function fromGitHub() {
    // Если сайт на GitHub Pages, а js/photos.js пустой — берём список файлов папки photos из репозитория
    var m = location.hostname.match(/^([a-z0-9-]+)\.github\.io$/i);
    if (!m || !window.fetch) return Promise.resolve([]);
    var owner = m[1];
    var seg = location.pathname.split('/').filter(Boolean)[0];
    var repo = seg && !/\.html?$/i.test(seg) ? seg : owner + '.github.io';
    var ctrl = window.AbortController ? new AbortController() : null;
    if (ctrl) setTimeout(function () { ctrl.abort(); }, 5000);
    return fetch('https://api.github.com/repos/' + owner + '/' + repo + '/contents/photos', {
      signal: ctrl ? ctrl.signal : undefined,
      headers: { Accept: 'application/vnd.github+json' }
    }).then(function (r) { return r.ok ? r.json() : []; })
      .then(function (items) {
        if (!Array.isArray(items)) return [];
        return items.filter(function (it) { return it.type === 'file' && IMG_RE.test(it.name); })
          .sort(function (a, b) { return a.name.localeCompare(b.name, undefined, { numeric: true }); })
          .map(function (it) { return { src: 'photos/' + encodeURIComponent(it.name) }; });
      })
      .catch(function () { return []; });
  }

  /* ---------- Зашифрованные фото и видео ----------
     Файлы media/*.bin = 12 байт IV + AES-GCM. Ключ приходит в ссылке после # (k=...)
     и на сервер не отправляется; сайт запоминает его, чтобы фото открывались и без хвоста ссылки. */
  var mediaCache = {};
  var keyPromise = null;
  function b64url(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    var bin = atob(s);
    var out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  App.mediaKey = (function () {
    var m = (location.hash || '').match(/[#&]k=([A-Za-z0-9_-]{16,})/);
    if (m) { App.store.set('mediaKey', m[1]); return m[1]; }
    return App.store.get('mediaKey', '');
  })();
  // Ключ дописали в адрес уже открытой страницы — браузер сам её не перезагрузит
  window.addEventListener('hashchange', function () {
    var m = (location.hash || '').match(/[#&]k=([A-Za-z0-9_-]{16,})/);
    if (m && m[1] !== App.mediaKey) { App.store.set('mediaKey', m[1]); location.reload(); }
  });
  function cryptoKey() {
    if (keyPromise) return keyPromise;
    var subtle = window.crypto && window.crypto.subtle;
    if (!App.mediaKey || !subtle || !window.fetch) return (keyPromise = Promise.resolve(null));
    try {
      keyPromise = Promise.resolve(subtle.importKey('raw', b64url(App.mediaKey), 'AES-GCM', false, ['decrypt']))
        .catch(function () { return null; });
    } catch (e) { keyPromise = Promise.resolve(null); }
    return keyPromise;
  }
  /* Promise<url>: обычный файл — его путь; зашифрованный — blob: после расшифровки (или '' если не вышло) */
  App.media = function (path, type, enc) {
    if (!path) return Promise.resolve('');
    if (!enc) return Promise.resolve(path);
    if (mediaCache[path]) return mediaCache[path];
    mediaCache[path] = cryptoKey().then(function (key) {
      if (!key) return '';
      return fetch(path)
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); })
        .then(function (buf) {
          return window.crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(buf, 0, 12) }, key, new Uint8Array(buf, 12));
        })
        .then(function (plain) { return URL.createObjectURL(new Blob([plain], { type: type || 'image/jpeg' })); });
    }).catch(function () { return ''; });
    return mediaCache[path];
  };

  /* Особые кадры (аватарка, обои, полароид…) — расшифровываются по требованию */
  App.special = {};
  var specialPromises = {};
  function loadSpecial(k) {
    if (!specialPromises[k]) {
      var sp = window.SPECIAL || {};
      specialPromises[k] = App.media(sp[k], 'image/jpeg', !!sp.enc).then(function (url) {
        App.special[k] = url || '';
        return App.special[k];
      });
    }
    return specialPromises[k];
  }
  App.hasSpecial = function (k) {
    var sp = window.SPECIAL || {};
    return !!sp[k] && !(sp.enc && App.mediaLocked);
  };

  // Проверяем ключ на одном маленьком файле, чтобы не ждать расшифровки всего сразу
  function probeKey(items) {
    var sp = window.SPECIAL || {};
    var path = sp.enc && sp.sasha ? sp.sasha : '';
    if (!path) {
      var e = items.filter(function (p) { return p.enc; })[0];
      path = e ? (e.thumb || e.poster || e.src) : '';
    }
    if (!path) return Promise.resolve(true);
    return App.media(path, 'image/jpeg', true).then(function (url) { return !!url; });
  }

  App.loadPhotos = function () {
    var list = (window.PHOTOS || []).map(function (p) {
      return typeof p === 'string' ? { src: p } : p;
    }).filter(function (p) { return p && p.src; });
    var ready = list.length ? Promise.resolve(list) : fromGitHub();
    return ready.then(function (items) {
      var hasEnc = items.some(function (p) { return p.enc; }) || !!(window.SPECIAL && window.SPECIAL.enc);
      return (hasEnc ? probeKey(items) : Promise.resolve(true)).then(function (ok) {
        App.mediaLocked = hasEnc && !ok;
        App.photos = items.filter(function (p) { return !p.enc || ok; }).map(function (p) {
          return {
            src: p.src,
            thumbPath: p.thumb || (p.video ? p.poster : p.src),
            thumb: '',
            poster: p.poster || '',
            enc: !!p.enc,
            video: !!p.video,
            type: p.type || (p.video ? 'video/mp4' : 'image/jpeg'),
            duration: p.duration || 0,
            w: p.w || 0,
            h: p.h || 0,
            caption: p.caption || '',
            story: p.story || false
          };
        });
        // для первых историй нужен только полароид; остальное грузится в фоне
        return App.picAsync('polaroid');
      });
    }).then(function () {
      App.allLoaded = Promise.all(
        ['wallpaper', 'avatar', 'feedFace', 'us', 'imvu'].map(App.picAsync)
          .concat(App.photos.map(App.thumbOf))
      );
      return App.photos;
    });
  };
  App.thumbOf = function (p) {
    if (p.thumb) return Promise.resolve(p.thumb);
    return App.media(p.thumbPath, 'image/jpeg', p.enc).then(function (url) {
      if (url) p.thumb = url;
      return p.thumb;
    });
  };
  /* Особый кадр с запасными вариантами (Promise<url>) */
  App.picAsync = function (name) {
    if (name === 'avatar' && C.avatar) return Promise.resolve(C.avatar);
    if (name === 'sasha' && C.fromAvatar) return Promise.resolve(C.fromAvatar);
    if (App.mediaLocked && window.SPECIAL && window.SPECIAL.enc) return Promise.resolve('');
    return loadSpecial(name).then(function (url) {
      if (url || name === 'sasha' || name === 'imvu') return url;
      if (name !== 'avatar') return App.picAsync('avatar');
      var first = App.photos.filter(function (p) { return !p.video; })[0];
      return first ? App.thumbOf(first) : '';
    });
  };
  /* Подставляет картинки в <img data-pic="..."> и <img data-thumb="индекс фото"> (или фон у других элементов) */
  function setUrl(el, url) {
    if (!url) return;
    if (el.tagName === 'IMG') { if (el.getAttribute('src') !== url) el.src = url; }
    else el.style.backgroundImage = 'url("' + url.replace(/"/g, '%22') + '")';
  }
  App.fill = function (root) {
    App.$$('[data-pic]', root).forEach(function (el) {
      App.picAsync(el.getAttribute('data-pic')).then(function (url) { setUrl(el, url); });
    });
    App.$$('[data-thumb]', root).forEach(function (el) {
      var p = App.photos[+el.getAttribute('data-thumb')];
      // если тем временем подставили полноразмерное фото (атрибут сняли) — превью не нужно
      if (p) App.thumbOf(p).then(function (url) { if (el.hasAttribute('data-thumb')) setUrl(el, url); });
    });
    return root;
  };

  App.photoSrc = function (p) { return App.media(p.src, p.type, p.enc); };
  App.posterSrc = function (p) { return p.poster ? App.media(p.poster, 'image/jpeg', p.enc) : Promise.resolve(p.thumb); };

  /* Фото для историй: story: 1 — «Самая красивая», story: 2 — «Это мы».
     Если ни одно фото не отмечено — для первого блока берём несколько равномерно по времени. */
  App.storyBlock = function (n) {
    var ps = App.photos;
    if (ps.some(function (p) { return p.story; })) {
      return ps.filter(function (p) { return p.story === n || (n === 1 && p.story === true); });
    }
    if (n !== 1) return [];
    var pics = ps.filter(function (p) { return !p.video; });
    var k = Math.max(0, C.storyPhotoCount == null ? 6 : C.storyPhotoCount);
    if (pics.length <= k) return pics;
    if (k === 1) return [pics[0]];
    var out = [];
    for (var i = 0; i < k; i++) out.push(pics[Math.round(i * (pics.length - 1) / (k - 1))]);
    return out;
  };
  App.storyPhotos = function () { return App.storyBlock(1).concat(App.storyBlock(2)); };


  App.preload = function (src) {
    return new Promise(function (res) {
      if (!src) return res(null);
      var img = new Image();
      img.decoding = 'async';
      img.onload = function () { res(img); };
      img.onerror = function () { res(null); };
      img.src = src;
    });
  };

  /* ---------- Тост ---------- */
  App.toast = function (text, ms) {
    var el = document.getElementById('toast');
    if (!el) return;
    App.setText(el, text);
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove('show'); }, ms || 2600);
  };

  /* ---------- Иконки ---------- */
  var S = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';
  App.icons = {
    heart: S + '<path d="M12 20.5s-7.6-4.6-9.4-9.3C1.2 7.6 3.5 4 7.1 4c2.1 0 3.6 1.2 4.9 2.9C13.3 5.2 14.8 4 16.9 4c3.6 0 5.9 3.6 4.5 7.2-1.8 4.7-9.4 9.3-9.4 9.3z"/></svg>',
    heartFill: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 20.5s-7.6-4.6-9.4-9.3C1.2 7.6 3.5 4 7.1 4c2.1 0 3.6 1.2 4.9 2.9C13.3 5.2 14.8 4 16.9 4c3.6 0 5.9 3.6 4.5 7.2-1.8 4.7-9.4 9.3-9.4 9.3z"/></svg>',
    send: S + '<path d="M21.5 2.5 10.3 13.7"/><path d="M21.5 2.5 14.6 21l-4.3-7.3L3 9.4z"/></svg>',
    comment: S + '<path d="M20.6 16.3A9 9 0 1 0 17 20l4 1.2z"/></svg>',
    bookmark: S + '<path d="M19 21l-7-5.5L5 21V3h14z"/></svg>',
    close: S.replace('stroke-width="2"', 'stroke-width="2.4"') + '<path d="M5.5 5.5l13 13M18.5 5.5l-13 13"/></svg>',
    more: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.8" fill="currentColor"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/><circle cx="19" cy="12" r="1.8" fill="currentColor"/></svg>',
    soundOn: S + '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 9a4.5 4.5 0 0 1 0 6M18.3 6.3a8.4 8.4 0 0 1 0 11.4"/></svg>',
    soundOff: S + '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>',
    grid: S + '<rect x="3.5" y="3.5" width="17" height="17" rx="1"/><path d="M9.2 3.5v17M14.8 3.5v17M3.5 9.2h17M3.5 14.8h17"/></svg>',
    reels: S + '<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M3.5 8.5h17M8.5 3.5l3 5M14 3.5l3 5"/><path d="M10.5 11.5v5l4-2.5z" fill="currentColor"/></svg>',
    tagged: S + '<path d="M9 5H5.5a1 1 0 0 0-1 1v13.5a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H15l-3-2.5z"/><circle cx="12" cy="11" r="2.6"/><path d="M7.5 18c.8-2 2.5-3 4.5-3s3.7 1 4.5 3"/></svg>',
    menu: S + '<path d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17"/></svg>',
    plus: S + '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><path d="M12 8v8M8 12h8"/></svg>',
    chevronDown: S + '<path d="M6 9l6 6 6-6"/></svg>',
    back: S.replace('stroke-width="2"', 'stroke-width="2.4"') + '<path d="M15 4.5 7.5 12l7.5 7.5"/></svg>',
    next: S.replace('stroke-width="2"', 'stroke-width="2.6"') + '<path d="M9 5l7 7-7 7"/></svg>',
    pause: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor"/></svg>',
    lock: '<svg class="icon lock__lock" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 10V7.5a5 5 0 0 1 10 0V10h.5A1.5 1.5 0 0 1 19 11.5v8a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5v-8A1.5 1.5 0 0 1 6.5 10zm2 0h6V7.5a3 3 0 0 0-6 0z"/></svg>',
    verified: (function () {
      var c = '';
      for (var i = 0; i < 12; i++) {
        var a = i * Math.PI / 6;
        c += '<circle cx="' + (12 + Math.cos(a) * 7.6).toFixed(2) + '" cy="' + (12 + Math.sin(a) * 7.6).toFixed(2) + '" r="3.2"/>';
      }
      return '<svg class="verified" viewBox="0 0 24 24" aria-label="Подтверждённая именинница"><g fill="#0095f6"><circle cx="12" cy="12" r="8.6"/>' + c +
        '</g><path d="M8 12.3l2.6 2.6L16.2 9.3" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    })()
  };
})();
