@echo off
title BISA-PNS - Menghentikan aplikasi
cd /d "%~dp0"
docker compose down
echo.
echo BISA-PNS sudah dihentikan. Data tetap tersimpan.
pause
