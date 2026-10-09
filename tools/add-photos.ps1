<#
  Добавляет фотографии Алёны на сайт.

  Что делает:
    1. Берёт фото из папки «Изображения\Алёна» (OneDrive). Если её нет — спросит, где фото.
    2. Поворачивает их как надо (по EXIF), уменьшает до 1600 px и убирает геометки.
    3. Кладёт в папку photos (а маленькие копии — в photos\thumbs).
    4. Записывает список в js\photos.js и открывает сайт.

  Запуск: двойной клик по add-photos.bat в корне проекта.
  Можно указать свою папку: add-photos.bat "D:\Фото\Мы"
#>
param(
  [string]$Source = '',
  [int]$MaxSize = 1600,
  [int]$ThumbSize = 480,
  [int]$Quality = 85
)

$ErrorActionPreference = 'Stop'
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}

function Say([string]$text, [string]$color = 'Gray') { Write-Host $text -ForegroundColor $color }

$root = Split-Path -Parent $PSScriptRoot
$photosDir = Join-Path $root 'photos'
$thumbsDir = Join-Path $photosDir 'thumbs'
$listFile = Join-Path $root 'js\photos.js'

# ---------- 1. Папка с фото ----------
$candidates = New-Object System.Collections.Generic.List[string]
if ($Source) { $candidates.Add($Source) }
$candidates.Add('C:\Users\kkkar\OneDrive\Изображения\Алёна')
if ($env:OneDrive) {
  $candidates.Add((Join-Path $env:OneDrive 'Изображения\Алёна'))
  $candidates.Add((Join-Path $env:OneDrive 'Pictures\Алёна'))
}
$pics = [Environment]::GetFolderPath('MyPictures')
if ($pics) { $candidates.Add((Join-Path $pics 'Алёна')) }
if ($env:USERPROFILE) { $candidates.Add((Join-Path $env:USERPROFILE 'Pictures\Алёна')) }

$src = $null
foreach ($c in $candidates) {
  if ($c -and (Test-Path -LiteralPath $c -PathType Container)) { $src = $c; break }
}
if (-not $src) {
  Say 'Не нашёл папку «Изображения\Алёна». Выбери папку с фотографиями в открывшемся окне…' 'Yellow'
  Add-Type -AssemblyName System.Windows.Forms
  $dlg = New-Object System.Windows.Forms.FolderBrowserDialog
  $dlg.Description = 'Выбери папку с фотографиями Алёны'
  $dlg.ShowNewFolderButton = $false
  if ($dlg.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) { Say 'Отменено.' 'Red'; exit 1 }
  $src = $dlg.SelectedPath
}
Say ('Беру фото из: ' + $src) 'Cyan'

$exts = @('.jpg', '.jpeg', '.jfif', '.png', '.heic', '.heif', '.webp', '.bmp', '.gif', '.tif', '.tiff')
$files = @(Get-ChildItem -LiteralPath $src -File | Where-Object { $exts -contains $_.Extension.ToLower() })
if ($files.Count -eq 0) { Say 'В этой папке нет фотографий (jpg, png, heic…).' 'Red'; exit 1 }
Say ('Нашёл фото: ' + $files.Count)

Add-Type -AssemblyName PresentationCore, WindowsBase

function Get-Orientation($frame) {
  $meta = $null
  try { $meta = $frame.Metadata } catch { return 1 }
  if ($null -eq $meta) { return 1 }
  foreach ($q in @('System.Photo.Orientation', '/app1/ifd/{ushort=274}', '/ifd/{ushort=274}')) {
    try {
      $v = $meta.GetQuery($q)
      if ($null -ne $v) { $o = [int]$v; if ($o -ge 1 -and $o -le 8) { return $o } }
    } catch {}
  }
  return 1
}

function Get-Taken($frame, $file) {
  try {
    $d = $frame.Metadata.DateTaken
    if ($d) { return [datetime]::Parse($d, [System.Globalization.CultureInfo]::CurrentCulture) }
  } catch {}
  return $file.LastWriteTime
}

function Read-Info($file) {
  $fs = $null
  try {
    $fs = [System.IO.File]::OpenRead($file.FullName)
    $dec = [System.Windows.Media.Imaging.BitmapDecoder]::Create($fs, [System.Windows.Media.Imaging.BitmapCreateOptions]::DelayCreation, [System.Windows.Media.Imaging.BitmapCacheOption]::None)
    $frame = $dec.Frames[0]
    return [pscustomobject]@{ File = $file; Taken = (Get-Taken $frame $file) }
  } catch {
    return [pscustomobject]@{ File = $file; Taken = $file.LastWriteTime }
  } finally {
    if ($fs) { $fs.Dispose() }
  }
}

function Read-Frame([string]$path) {
  $bytes = [System.IO.File]::ReadAllBytes($path)
  $ms = New-Object System.IO.MemoryStream(, $bytes)
  $dec = [System.Windows.Media.Imaging.BitmapDecoder]::Create($ms, [System.Windows.Media.Imaging.BitmapCreateOptions]::None, [System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad)
  return $dec.Frames[0]
}

function New-Picture($frame, [int]$orientation, [int]$max) {
  $w = $frame.PixelWidth
  $h = $frame.PixelHeight
  $scale = [Math]::Min(1.0, $max / [double][Math]::Max($w, $h))
  $tg = New-Object System.Windows.Media.TransformGroup
  if ($scale -lt 1.0) { $tg.Children.Add((New-Object System.Windows.Media.ScaleTransform($scale, $scale))) }
  switch ($orientation) {
    2 { $tg.Children.Add((New-Object System.Windows.Media.ScaleTransform(-1, 1))) }
    3 { $tg.Children.Add((New-Object System.Windows.Media.RotateTransform(180))) }
    4 { $tg.Children.Add((New-Object System.Windows.Media.ScaleTransform(1, -1))) }
    5 { $tg.Children.Add((New-Object System.Windows.Media.ScaleTransform(-1, 1))); $tg.Children.Add((New-Object System.Windows.Media.RotateTransform(270))) }
    6 { $tg.Children.Add((New-Object System.Windows.Media.RotateTransform(90))) }
    7 { $tg.Children.Add((New-Object System.Windows.Media.ScaleTransform(-1, 1))); $tg.Children.Add((New-Object System.Windows.Media.RotateTransform(90))) }
    8 { $tg.Children.Add((New-Object System.Windows.Media.RotateTransform(270))) }
  }
  $pic = $frame
  if ($tg.Children.Count -gt 0) { $pic = New-Object System.Windows.Media.Imaging.TransformedBitmap($frame, $tg) }
  if ($pic.Format -ne [System.Windows.Media.PixelFormats]::Bgr24) {
    $pic = New-Object System.Windows.Media.Imaging.FormatConvertedBitmap($pic, [System.Windows.Media.PixelFormats]::Bgr24, $null, 0)
  }
  return $pic
}

function Save-Jpeg($pic, [string]$path, [int]$q) {
  $enc = New-Object System.Windows.Media.Imaging.JpegBitmapEncoder
  $enc.QualityLevel = $q
  $enc.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($pic))
  $out = [System.IO.File]::Open($path, [System.IO.FileMode]::Create)
  try { $enc.Save($out) } finally { $out.Dispose() }
}

# ---------- 2. Сортируем по дате съёмки ----------
$infos = New-Object System.Collections.Generic.List[object]
$i = 0
foreach ($f in $files) {
  $i++
  Write-Progress -Activity 'Читаю даты съёмки' -Status $f.Name -PercentComplete ([int]($i * 100 / $files.Count))
  $infos.Add((Read-Info $f))
}
Write-Progress -Activity 'Читаю даты съёмки' -Completed
$sorted = @($infos | Sort-Object -Property Taken)

# ---------- 3. Чистим старые копии (только наши 01.jpg, 02.jpg…) ----------
New-Item -ItemType Directory -Force -Path $photosDir | Out-Null
New-Item -ItemType Directory -Force -Path $thumbsDir | Out-Null
$ours = '^\d{2,3}\.(jpe?g|png|webp|gif)$'
Get-ChildItem -LiteralPath $photosDir -File | Where-Object { $_.Name -match $ours } | Remove-Item -Force
Get-ChildItem -LiteralPath $thumbsDir -File | Where-Object { $_.Name -match $ours } | Remove-Item -Force

# ---------- 4. Поворачиваем, уменьшаем, сохраняем ----------
$digits = if ($sorted.Count -gt 99) { 3 } else { 2 }
$names = New-Object System.Collections.Generic.List[string]
$skipped = 0
$n = 0
foreach ($it in $sorted) {
  $f = $it.File
  Write-Progress -Activity 'Готовлю фото для сайта' -Status $f.Name -PercentComplete ([int](($names.Count + $skipped) * 100 / $sorted.Count))
  try {
    $frame = Read-Frame $f.FullName
    $o = Get-Orientation $frame
    $name = ('{0:D' + $digits + '}.jpg') -f ($n + 1)
    Save-Jpeg (New-Picture $frame $o $MaxSize) (Join-Path $photosDir $name) $Quality
    Save-Jpeg (New-Picture $frame $o $ThumbSize) (Join-Path $thumbsDir $name) 80
    $names.Add($name)
    $n++
    Say ('  + ' + $f.Name + '  ->  photos\' + $name) 'Green'
  } catch {
    $ext = $f.Extension.ToLower()
    if (@('.jpg', '.jpeg', '.png', '.webp', '.gif') -contains $ext) {
      # Не получилось обработать — кладём как есть (браузер сам повернёт фото)
      $name = (('{0:D' + $digits + '}') -f ($n + 1)) + $ext
      Copy-Item -LiteralPath $f.FullName -Destination (Join-Path $photosDir $name) -Force
      Copy-Item -LiteralPath $f.FullName -Destination (Join-Path $thumbsDir $name) -Force
      $names.Add($name)
      $n++
      Say ('  + ' + $f.Name + '  ->  photos\' + $name + ' (скопировал без уменьшения)') 'DarkYellow'
    } else {
      $skipped++
      $hint = ''
      if ($ext -match '^\.hei') { $hint = ' (для HEIC установи «Расширения для изображений HEIF» из Microsoft Store или сохрани фото как JPG)' }
      Say ('  ! пропускаю ' + $f.Name + ' — Windows не смог его открыть' + $hint) 'Yellow'
    }
  }
  $frame = $null
  if (($names.Count + $skipped) % 8 -eq 0) { [GC]::Collect() }
}
Write-Progress -Activity 'Готовлю фото для сайта' -Completed

if ($names.Count -eq 0) { Say 'Не получилось подготовить ни одного фото.' 'Red'; exit 1 }

# ---------- 5. Список для сайта ----------
if (Test-Path -LiteralPath $listFile) { Copy-Item -LiteralPath $listFile -Destination (Join-Path $root 'js\photos.backup.js') -Force }
$lines = foreach ($nm in $names) { "  { src: 'photos/$nm', thumb: 'photos/thumbs/$nm', caption: '' }," }
$stamp = Get-Date -Format 'dd.MM.yyyy HH:mm'
$content = @"
/*
 * 📸 ФОТОГРАФИИ — список создан скриптом add-photos.bat ($stamp)
 * Можно дописать подписи: caption: 'Моя любимая улыбка 😍'
 * story: true — показать именно это фото в историях
 * (прошлая версия файла сохранена в js/photos.backup.js)
 */
window.PHOTOS = [
$($lines -join "`n")
];
"@
[System.IO.File]::WriteAllText($listFile, ($content -replace "`r`n", "`n") + "`n", (New-Object System.Text.UTF8Encoding($false)))

$size = (Get-ChildItem -LiteralPath $photosDir -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB
Say ''
Say ('Готово! Добавлено фото: ' + $names.Count + $(if ($skipped) { ', пропущено: ' + $skipped } else { '' })) 'Green'
Say ('Размер папки photos: {0:N1} МБ' -f $size)
Say 'Открываю сайт в браузере…' 'Cyan'
Say 'Дальше загрузи папки photos и js на GitHub (см. README.md).'
try { Start-Process (Join-Path $root 'index.html') } catch {}
