@echo off
chcp 65001 >nul
title Alenagram - add photos
powershell -NoProfile -ExecutionPolicy Bypass -STA -File "%~dp0tools\add-photos.ps1" %*
echo.
pause
