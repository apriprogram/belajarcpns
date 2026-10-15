#!/usr/bin/env bash
# Menjalankan BISA-PNS secara lokal dengan Docker (Linux/Mac).
set -euo pipefail
cd "$(dirname "$0")/.."

command -v docker >/dev/null || { echo "Docker belum terpasang. Unduh: https://docs.docker.com/get-docker/"; exit 1; }
docker info >/dev/null 2>&1 || { echo "Docker daemon belum berjalan. Jalankan Docker Desktop / service docker dulu."; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "Plugin 'docker compose' v2 tidak ditemukan."; exit 1; }

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "==> .env dibuat dari .env.example"
fi

echo "==> Build & menjalankan container (pertama kali bisa 3-10 menit) ..."
docker compose up -d --build

WEB_PORT="$(grep -E '^WEB_PORT=' .env | cut -d= -f2 | cut -d' ' -f1)"; WEB_PORT="${WEB_PORT:-3000}"
URL="http://localhost:${WEB_PORT}"
echo "==> Menunggu web siap di $URL ..."
for _ in $(seq 1 90); do
  curl -fsS -o /dev/null "$URL" 2>/dev/null && break
  sleep 2
done

docker compose ps
echo
echo "BISA-PNS siap: $URL"
echo "  Admin  : admin@bisapns.id / Admin123!"
echo "  Peserta: peserta1@bisapns.id / Peserta123!"
echo "Log: docker compose logs -f api web"

if command -v xdg-open >/dev/null; then xdg-open "$URL" >/dev/null 2>&1 || true
elif command -v open >/dev/null; then open "$URL" || true; fi
