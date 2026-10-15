# Menjalankan BISA-PNS secara lokal dengan Docker Desktop (Windows PowerShell).
# Pemakaian (dari folder repo):  powershell -ExecutionPolicy Bypass -File .\scripts\dev-up.ps1
$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Write-Host 'Docker belum terpasang. Unduh Docker Desktop: https://www.docker.com/products/docker-desktop/' -ForegroundColor Red
  exit 1
}
docker info *> $null
if ($LASTEXITCODE -ne 0) {
  Write-Host 'Docker Desktop belum berjalan. Buka Docker Desktop, tunggu status "Engine running", lalu ulangi.' -ForegroundColor Red
  exit 1
}

if (-not (Test-Path '.env')) {
  Copy-Item '.env.example' '.env'
  Write-Host '==> .env dibuat dari .env.example' -ForegroundColor Cyan
}

Write-Host '==> Build & menjalankan container (pertama kali bisa 3-10 menit) ...' -ForegroundColor Cyan
docker compose up -d --build
if ($LASTEXITCODE -ne 0) { Write-Host 'docker compose gagal. Lihat pesan di atas.' -ForegroundColor Red; exit 1 }

$webPort = '3000'
$line = Select-String -Path '.env' -Pattern '^WEB_PORT=(\d+)' | Select-Object -First 1
if ($line) { $webPort = $line.Matches[0].Groups[1].Value }
$url = "http://localhost:$webPort"

Write-Host "==> Menunggu web siap di $url ..." -ForegroundColor Cyan
for ($i = 0; $i -lt 90; $i++) {
  try { Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 3 | Out-Null; break } catch { Start-Sleep -Seconds 2 }
}

docker compose ps
Write-Host ''
Write-Host "BISA-PNS siap: $url" -ForegroundColor Green
Write-Host '  Admin  : admin@bisapns.id / Admin123!'
Write-Host '  Peserta: peserta1@bisapns.id / Peserta123!'
Write-Host 'Log: docker compose logs -f api web'
Start-Process $url
