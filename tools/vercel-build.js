/*
 * Сборка на Vercel (запускается из vercel.json).
 * 1. Берёт ключ к фото из переменной окружения MEDIA_KEY и записывает его в js/key.js:
 *    на сайте фото открываются без #k= в ссылке, а в репозитории ключа по-прежнему нет.
 *    Проверить: открой на сайте /js/key.js — там написано, задан ли ключ и какая это сборка.
 * 2. Ставит в превью ссылки (og:image) адрес сайта на Vercel.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const sha = (process.env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 7);
const head = '/* Сборка' + (sha ? ' ' + sha : '') + '. ';

// Ключ — последняя длинная «base64url»-последовательность: подойдёт и ключ в кавычках/с пробелами,
// и случайно вставленная целиком ссылка с #k=
const found = (process.env.MEDIA_KEY || '').match(/[A-Za-z0-9_-]{16,}/g);
const key = found ? found[found.length - 1] : '';
const keyFile = path.join(root, 'js', 'key.js');
if (key) {
  fs.writeFileSync(keyFile, head + 'Ключ к фото взят из переменной MEDIA_KEY. */\nwindow.MEDIA_KEY = ' + JSON.stringify(key) + ';\n');
  console.log('MEDIA_KEY: ключ записан в js/key.js');
} else {
  fs.writeFileSync(keyFile, head + 'Переменная MEDIA_KEY не задана — фото откроются только по ссылке с #k= */\nwindow.MEDIA_KEY = \'\';\n');
  console.log('MEDIA_KEY не задан — фото откроются только по ссылке с #k=');
}

const host = (process.env.VERCEL_PROJECT_PRODUCTION_URL || '').trim();
if (/^[a-z0-9.-]+$/i.test(host)) {
  const file = path.join(root, 'index.html');
  const html = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, html.replace(/(<meta property="og:image" content=")[^"]*(")/, '$1https://' + host + '/assets/og.jpg$2'));
  console.log('og:image: https://' + host + '/assets/og.jpg');
}
