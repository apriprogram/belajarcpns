@echo off
title BISA-PNS - Menjalankan aplikasi
cd /d "%~dp0"
echo ============================================
echo   BISA-PNS - menjalankan dengan Docker Desktop
echo   Pastikan Docker Desktop sudah dibuka dulu.
echo ============================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\dev-up.ps1"
echo.
pause
