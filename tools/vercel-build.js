/*
 * Сборка на Vercel (запускается из vercel.json).
 * 1. Берёт ключ к фото из переменной окружения MEDIA_KEY и записывает его в js/key.js:
 *    на сайте фото открываются без #k= в ссылке, а в репозитории ключа по-прежнему нет.
 * 2. Ставит в превью ссылки (og:image) адрес сайта на Vercel.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

// Принимаем и сам ключ, и случайно вставленную целиком ссылку с #k=
const raw = (process.env.MEDIA_KEY || '').trim();
const m = raw.match(/(?:^|k=)([A-Za-z0-9_-]{16,})$/);
if (m) {
  fs.writeFileSync(path.join(root, 'js', 'key.js'), 'window.MEDIA_KEY = ' + JSON.stringify(m[1]) + ';\n');
  console.log('MEDIA_KEY: ключ записан в js/key.js');
} else {
  console.log('MEDIA_KEY не задан — фото откроются только по ссылке с #k=');
}

const host = (process.env.VERCEL_PROJECT_PRODUCTION_URL || '').trim();
if (/^[a-z0-9.-]+$/i.test(host)) {
  const file = path.join(root, 'index.html');
  const html = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, html.replace(/(<meta property="og:image" content=")[^"]*(")/, '$1https://' + host + '/assets/og.jpg$2'));
  console.log('og:image: https://' + host + '/assets/og.jpg');
}
