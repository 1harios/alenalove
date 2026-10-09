/* Экран блокировки, профиль «Alёnagram», лента фото и запуск */
(function () {
  'use strict';

  var A = window.App;
  var C = window.CONFIG || {};
  var esc = A.esc;
  var $ = A.$;
  var unlocked = false;
  var avatarBtn = null;

  /* Высота «телефона» = видимая часть экрана (iOS Safari меняет её при скролле) */
  function setAppHeight() {
    document.documentElement.style.setProperty('--app-h', window.innerHeight + 'px');
  }
  setAppHeight();
  window.addEventListener('resize', setAppHeight);

  var params = (function () { try { return new URLSearchParams(location.search); } catch (e) { return null; } })();

  /* ---------- Экран блокировки ---------- */
  function renderLock() {
    var lock = $('#lock');
    var info = A.birthdayInfo();
    var nameGen = C.nameGenitive || C.name;
    var calText;
    if (info.isToday) calText = 'Сегодня день рождения у ' + nameGen + '! 🎉';
    else if (info.daysTo > 0) calText = 'Через ' + A.nw(info.daysTo, 'day') + ' — день рождения ' + nameGen + ' 🎂';
    else calText = A.dateLong(info.date, false) + ' был день рождения ' + nameGen + ' 🎂';
    var now = new Date();
    lock.innerHTML =
      '<div class="lock__wall"></div>' +
      A.icons.lock +
      '<div class="lock__date"></div>' +
      '<div class="lock__time"></div>' +
      '<div class="lock__notes">' +
        '<div class="note" style="--d:.5s">' +
          '<div class="note__icon note__icon--cal"><small>' + A.weekdayShort(now) + '</small><b>' + now.getDate() + '</b></div>' +
          '<div class="note__body"><div class="note__row"><span class="note__title">Календарь</span><span class="note__time">весь день</span></div>' +
          '<div class="note__text">' + esc(calText) + '</div></div>' +
        '</div>' +
        '<button class="note note--main" style="--d:1.3s" aria-label="Открыть историю">' +
          '<span class="note__icon note__icon--app">A</span>' +
          '<span class="note__body"><span class="note__row"><span class="note__title">Alёnagram</span><span class="note__time">сейчас</span></span>' +
          '<span class="note__text"><b>' + esc(C.fromUsername || 'sasha') + '</b> опубликовал историю специально для тебя 💌</span></span>' +
        '</button>' +
      '</div>' +
      '<div class="lock__hint">Нажми на уведомление 👆</div>' +
      '<div class="lock__bar"></div>';
    A.emojify(lock);
    function clock() {
      var d = new Date();
      $('.lock__time', lock).textContent = d.getHours() + ':' + A.pad(d.getMinutes());
      var wd = A.weekday(d);
      $('.lock__date', lock).textContent = wd.charAt(0).toUpperCase() + wd.slice(1) + ', ' + A.dateLong(d, false);
    }
    clock();
    setInterval(clock, 5000);
    lock.addEventListener('click', unlock);
    // свайп вверх — тоже открыть
    var y0 = null;
    lock.addEventListener('pointerdown', function (e) { y0 = e.clientY; });
    lock.addEventListener('pointerup', function (e) { if (y0 !== null && y0 - e.clientY > 60) unlock(); y0 = null; });
  }

  function setLockWallpaper() {
    if (!A.photos.length && !A.hasSpecial('wallpaper')) return;
    A.picAsync('wallpaper').then(function (src) {
      return src ? A.preload(src).then(function (img) { return img ? src : ''; }) : '';
    }).then(function (src) {
      if (!src) return;
      var wall = $('#lock .lock__wall');
      if (!wall) return;
      wall.style.backgroundImage = 'linear-gradient(rgba(30,10,50,.25), rgba(30,10,50,.25)), url("' + src.replace(/"/g, '%22') + '")';
      wall.classList.add('has-photo');
    });
  }

  function unlock() {
    if (unlocked) return;
    unlocked = true;
    A.sound.unlock();
    A.unlockVideo();
    A.sound.playMusic();
    var lock = $('#lock');
    lock.classList.add('unlocked');
    setTimeout(function () { lock.hidden = true; }, 650);
    if (!A.isReady) {
      // фото ещё расшифровываются — показываем чёрный экран историй с индикатором загрузки
      var viewer = $('#viewer');
      viewer.hidden = false;
      viewer.classList.add('waiting');
    }
    A.ready.then(function () {
      setTimeout(function () { A.stories.open(0, avatarBtn); }, 320);
    });
  }

  /* ---------- Профиль ---------- */
  var HIGHLIGHTS = [
    { id: 'imvu', img: 'imvu', em: '🎮', label: 'IMVU', bg: 'linear-gradient(135deg,#2b0a57,#7b2ff7)' },
    { id: 'timer', em: '⏳', label: 'Вместе', bg: 'linear-gradient(135deg,#2b1650,#6a2c70)' },
    { id: 'b1-1', img: 'avatar', em: '😍', label: 'Ты', bg: 'linear-gradient(135deg,#fbc2eb,#a6c1ee)' },
    { id: 'b2-1', img: 'us', em: '❤️', label: 'Мы', bg: 'linear-gradient(135deg,#ff758c,#ff7eb3)' },
    { id: 'feed', em: '🎂', label: 'Тортик', bg: 'linear-gradient(135deg,#ffd1dc,#ff9ec4)' },
    { id: 'candles', em: '🕯️', label: 'Свечи', bg: 'linear-gradient(135deg,#3d1f2b,#7a3b52)' },
    { id: 'balloons', em: '🎈', label: 'Шарики', bg: 'linear-gradient(135deg,#7ec8ff,#ffd6ec)' },
    { id: 'coupons', em: '🎟️', label: 'Купоны', bg: 'linear-gradient(135deg,#f6d365,#fda085)' },
    { id: 'cookie', em: '🥠', label: 'Судьба', bg: 'linear-gradient(135deg,#2a1250,#5a2d91)' },
    { id: 'reasons', em: '🫶', label: 'Причины', bg: 'linear-gradient(135deg,#e6cfff,#ffc7e4)' },
    { id: 'letter', em: '💌', label: 'Письмо', bg: 'linear-gradient(135deg,#ffecd2,#fcb69f)' },
    { id: 'quest', em: '🎁', label: 'Подарок', bg: 'linear-gradient(135deg,#2a1d5c,#5b3fa8)' }
  ];
  var DECO = [
    ['🎂', 'С днём рождения!', '#ff9a9e', '#fecfef'],
    ['🎈', '', '#a18cd1', '#fbc2eb'],
    ['💐', 'Это всё тебе', '#f6d365', '#fda085'],
    ['✨', 'Самая красивая', '#84fab0', '#8fd3f4'],
    ['🥂', 'За тебя!', '#fccb90', '#d57eeb'],
    ['💌', '', '#ff758c', '#ff7eb3'],
    ['🎁', 'Сюрприз', '#4facfe', '#00f2fe'],
    ['👑', 'Королева дня', '#f093fb', '#f5576c'],
    ['💖', '', '#fa709a', '#fee140']
  ];

  function bioBirthday(info) {
    if (info.isToday) return '🎉 Сегодня день рождения!';
    if (info.daysTo > 0) return '⏳ День рождения через ' + A.nw(info.daysTo, 'day');
    return '🎂 День рождения — ' + A.dateLong(info.date, false);
  }

  function renderProfile() {
    var p = $('#profile');
    var info = A.birthdayInfo();
    var since = A.since(A.metAt);
    var hasPhotos = A.photos.length > 0;
    var av = hasPhotos || C.avatar || A.hasSpecial('avatar');
    var user = C.username || 'alenka';
    var from = C.fromUsername || 'sasha';

    var hl = HIGHLIGHTS.filter(function (h) { return A.stories.indexOf(h.id) >= 0; }).map(function (h) {
      var img = h.img && (hasPhotos || A.hasSpecial(h.img));
      return '<button class="hl" data-open="' + h.id + '"><span class="hl__ring"><span class="hl__cover" style="--hl-bg:' + h.bg + '">' +
        (img ? '<img data-pic="' + h.img + '" alt="">' : h.em) +
        '</span></span><span class="hl__label">' + esc(h.label) + '</span></button>';
    }).join('');

    // История с видео — для вкладки «Reels»
    var reelsId = 'final';
    [1, 2].some(function (n) {
      var b = A.storyBlock(n);
      for (var k = 0; k < b.length; k++) if (b[k].video) { reelsId = 'b' + n + '-' + (k + 1); return true; }
      return false;
    });

    // Как в Instagram: новые публикации сверху
    var tiles = hasPhotos
      ? A.photos.map(function (ph, i) { return i; }).reverse().map(function (i) {
        var ph = A.photos[i];
        return '<button class="tile" data-post="' + i + '" aria-label="' + (ph.video ? 'Видео' : 'Фото') + '"><img data-thumb="' + i + '" alt="" decoding="async">' +
          (ph.video ? '<span class="tile__badge">' + A.icons.reels + '</span>' : '') + '</button>';
      }).join('')
      : DECO.map(function (d) {
        var txt = d[1] || (d[0] === '💖' ? (C.from + ' + ' + C.name) : d[0] === '💌' ? 'Люблю тебя' : A.pad(A.birth.getDate()) + '.' + A.pad(A.birth.getMonth() + 1));
        return '<button class="tile tile--deco" data-deco style="background:linear-gradient(135deg,' + d[2] + ',' + d[3] + ')"><span class="tile__em">' + d[0] +
          '</span><span class="tile__txt">' + esc(txt) + '</span></button>';
      }).join('');

    p.innerHTML =
      '<header class="p-top">' +
        '<div class="p-top__user"><span>' + esc(user) + '</span>' + A.icons.verified + A.icons.chevronDown + '</div>' +
        '<div class="p-top__actions">' +
          '<button class="p-top__btn" data-act="hearts" aria-label="Сердечки">' + A.icons.heart + '</button>' +
          '<button class="p-top__btn" data-open="intro" aria-label="Новая история">' + A.icons.send + '<span class="p-top__dot"></span></button>' +
        '</div>' +
      '</header>' +
      '<section class="p-head">' +
        '<button class="p-avatar ring" id="avatarBtn" aria-label="Открыть историю">' +
          '<span class="ring__grad"></span>' +
          '<span class="p-avatar__img">' + (av ? '<img data-pic="avatar" alt="">' : '🥰') + '</span>' +
          '<span class="p-avatar__badge">НОВОЕ</span>' +
        '</button>' +
        '<div class="p-stats">' +
          '<div><b>' + info.age + '</b><span>' + A.plural(info.age, A.W.year) + '</span></div>' +
          '<div><b>' + A.fmt(since.days) + '</b><span>' + A.plural(since.days, A.W.day) + ' вместе</span></div>' +
          '<div><b>∞</b><span>любви</span></div>' +
        '</div>' +
      '</section>' +
      '<section class="p-bio">' +
        '<div class="p-name">' + esc(C.name) + ' 🎂</div>' +
        '<div class="p-cat">Именинница</div>' +
        '<div>👑 Самая красивая девушка на свете</div>' +
        '<div>' + esc(bioBirthday(info)) + '</div>' +
        '<div>💌 Новая история от <a href="#" data-open="intro">@' + esc(from) + '</a></div>' +
        (A.mediaLocked ? '<div class="p-lock">🔒 Фото и видео откроются по ссылке от ' + esc(C.fromGenitive || C.from) + '</div>' : '') +
      '</section>' +
      '<section class="p-actions">' +
        '<button class="btn btn--primary" data-open="intro">Смотреть историю</button>' +
        '<button class="btn" data-open="letter">Сообщение</button>' +
      '</section>' +
      '<section class="p-hl" aria-label="Актуальное">' + hl + '</section>' +
      '<nav class="p-tabs">' +
        '<button class="active" aria-label="Публикации">' + A.icons.grid + '</button>' +
        '<button data-open="' + reelsId + '" aria-label="Видео">' + A.icons.reels + '</button>' +
        '<button data-open="final" aria-label="Отметки">' + A.icons.tagged + '</button>' +
      '</nav>' +
      '<section class="p-grid">' + tiles + '</section>' +
      '<footer class="p-foot">Сделано с любовью ❤️ ' + esc(C.from) + '</footer>';
    A.emojify(p);
    A.fill(p);
    avatarBtn = $('#avatarBtn');

    p.addEventListener('click', function (e) {
      var t = e.target.closest('[data-open], [data-post], [data-act], [data-deco], #avatarBtn');
      if (!t) return;
      e.preventDefault();
      A.sound.unlock();
      A.unlockVideo();
      if (t.id === 'avatarBtn') { A.stories.open(A.stories.resumeIndex(), avatarBtn); return; }
      if (t.hasAttribute('data-post')) { openFeed(+t.getAttribute('data-post')); return; }
      if (t.hasAttribute('data-deco') || t.getAttribute('data-act') === 'hearts') {
        var c = A.center(t);
        A.fx.hearts(c.x, c.y, 8);
        A.sound.heart();
        return;
      }
      var id = t.getAttribute('data-open');
      var idx = A.stories.indexOf(id);
      if (idx < 0) { A.stories.build(); idx = A.stories.indexOf(id); }
      A.stories.open(idx < 0 ? 0 : idx, id === 'intro' ? avatarBtn : t);
    });
  }

  A.onStoriesClosed = function () {
    if (avatarBtn) avatarBtn.classList.add('seen');
  };

  /* ---------- Лента публикаций ---------- */
  var feedObserver = null;

  function buildFeed() {
    var fv = $('#feedView');
    var user = C.username || 'alenka';
    var av = A.photos.length > 0 || C.avatar || A.hasSpecial('avatar');
    var caps = C.photoCaptions || [];
    var info = A.birthdayInfo();
    var order = A.photos.map(function (ph, i) { return i; }).reverse();
    fv.innerHTML =
      '<div class="feed-view__top"><button class="v-btn" data-act="back" aria-label="Назад" style="color:inherit;filter:none">' + A.icons.back + '</button>' +
        '<div><small>' + esc(user) + '</small><b>Публикации</b></div></div>' +
      '<div class="feed-view__list">' + order.map(function (i) {
        var ph = A.photos[i];
        var cap = ph.caption || (caps.length ? caps[i % caps.length] : '');
        var ratio = ph.w && ph.h ? A.clamp(ph.w / ph.h, 0.8, 1.91).toFixed(3) : '0.8';
        var media = ph.video
          ? '<video class="post__video" muted loop playsinline preload="none"></video><span class="post__mute">🔇</span>'
          : '<img data-thumb="' + i + '" alt="" decoding="async">';
        return '<article class="post" data-i="' + i + '">' +
          '<div class="post__head"><div class="post__ava">' + (av ? '<img data-pic="avatar" alt="">' : '🥰') + '</div>' +
            '<div><b>' + esc(user) + '</b><span>📍 В сердце у ' + esc(C.fromGenitive || C.from) + '</span></div></div>' +
          '<div class="post__media' + (ph.video ? ' is-video' : '') + '" style="aspect-ratio:' + ratio + '">' + media +
            '<div class="post__heart">' + A.icons.heartFill + '</div></div>' +
          '<div class="post__actions"><button class="post__like" aria-label="Нравится">' + A.icons.heart + '</button>' +
            '<button aria-label="Комментарий">' + A.icons.comment + '</button><button aria-label="Поделиться">' + A.icons.send + '</button>' +
            '<div class="grow"></div><button aria-label="Сохранить">' + A.icons.bookmark + '</button></div>' +
          '<div class="post__likes">Нравится: <b>' + esc(C.fromUsername || 'sasha') + '</b> и ещё <b>∞</b></div>' +
          (cap ? '<div class="post__cap"><b>' + esc(user) + '</b>' + esc(cap) + '</div>' : '') +
          '<div class="post__date">' + A.dateLong(info.date, false) + '</div>' +
        '</article>';
      }).join('') + '</div>';
    A.emojify(fv);
    A.fill(fv);
    A.$$('.post', fv).forEach(function (post) {
      var ph = A.photos[+post.getAttribute('data-i')];
      var v = $('.post__video', post);
      if (v) A.thumbOf(ph).then(function (url) { if (url) v.poster = url; });
    });
    var list = $('.feed-view__list', fv);

    // Полноразмерные фото и видео подгружаем, когда пост показывается на экране
    function show(post, visible) {
      var ph = A.photos[+post.getAttribute('data-i')];
      var v = $('.post__video', post);
      if (visible && !post._full) {
        post._full = true;
        A.photoSrc(ph).then(function (url) {
          if (!url) return;
          if (v) { v.src = url; if (post._visible) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); } }
          else { var img = $('img', $('.post__media', post)); img.removeAttribute('data-thumb'); img.src = url; }
        });
      }
      post._visible = visible;
      if (v && v.getAttribute('src')) {
        if (visible) { var pr2 = v.play(); if (pr2 && pr2.catch) pr2.catch(function () {}); } else v.pause();
      }
    }
    if ('IntersectionObserver' in window) {
      feedObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { show(en.target, en.isIntersecting); });
      }, { root: list, rootMargin: '300px 0px', threshold: 0.01 });
      A.$$('.post', fv).forEach(function (post) { feedObserver.observe(post); });
    } else {
      A.$$('.post', fv).forEach(function (post) { show(post, true); });
    }

    function like(post, force) {
      var btn = $('.post__like', post);
      var on = force || !btn.classList.contains('liked');
      btn.classList.toggle('liked', on);
      btn.innerHTML = on ? A.icons.heartFill : A.icons.heart;
      if (on) { A.sound.heart(); A.vibrate(12); }
    }
    var lastTap = 0;
    fv.addEventListener('click', function (e) {
      if (e.target.closest('[data-act="back"]')) { closeFeed(); return; }
      var post = e.target.closest('.post');
      if (!post) return;
      if (e.target.closest('.post__like')) { like(post); return; }
      var media = e.target.closest('.post__media');
      if (media) {
        var v = $('.post__video', media);
        if (v) {
          v.muted = !v.muted;
          A.setText($('.post__mute', media), v.muted ? '🔇' : '🔊');
          if (v.paused && v.getAttribute('src')) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
        }
        var now = Date.now();
        if (now - lastTap < 320) {
          like(post, true);
          var h = $('.post__heart', post);
          h.classList.remove('go');
          void h.offsetWidth;
          h.classList.add('go');
          lastTap = 0;
        } else lastTap = now;
      }
    });
  }

  function openFeed(i) {
    var fv = $('#feedView');
    if (!fv.firstChild) buildFeed();
    fv.hidden = false;
    var post = fv.querySelector('.post[data-i="' + i + '"]');
    var list = $('.feed-view__list', fv);
    requestAnimationFrame(function () {
      fv.classList.add('show');
      if (post) list.scrollTop = post.offsetTop - list.offsetTop;
    });
  }
  function closeFeed() {
    var fv = $('#feedView');
    fv.classList.remove('show');
    A.$$('.post__video', fv).forEach(function (v) { v.pause(); });
    setTimeout(function () { fv.hidden = true; }, 330);
  }

  /* ---------- Запуск ---------- */
  function init() {
    A.stories.init();
    renderLock();
    A.ready = A.loadPhotos().then(function () {
      A.isReady = true;
      A.stories.build();
      A.picAsync('sasha').then(A.stories.setAvatar);
      renderProfile();
      setLockWallpaper();
      var em = ['🎉', '🎈', '💖', '✨', '😍', '🥰', '👑', '❤️', '💘', '🍰', '🎂', '🎟️', '🎁', '🔮', '⭐', '💥'];
      A.fx.preloadEmoji(em);
    });

    // ?s=candles — открыть сразу нужную историю (удобно для проверки)
    var start = params && params.get('s');
    if (start) {
      unlocked = true;
      $('#lock').hidden = true;
      A.ready.then(function () { A.stories.open(start, avatarBtn); });
    }
    document.addEventListener('keydown', function (e) {
      if (!unlocked && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); unlock(); }
      if (e.key === 'Escape' && !$('#feedView').hidden && !A.stories.isOpen()) closeFeed();
    });
  }

  init();
})();
