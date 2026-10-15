#!/bin/bash
# Deploy BELAJAR CPNS di cPanel. Dipanggil .cpanel.yml (Git Version Control → Deploy HEAD Commit) atau manual:
#   bash ~/repositories/belajarcpns/deploy/cpanel/deploy.sh
# Paket (API Go + Next.js standalone) dibangun GitHub Actions (.github/workflows/cpanel-build.yml) karena
# RAM/proses shared hosting tidak cukup untuk build. Skrip ini mengunduh paket untuk commit HEAD repo,
# memasangnya ke folder domain, lalu memulai ulang aplikasi. docs/DEPLOY-CPANEL.md
set -euo pipefail

REPO="$(cd "$(dirname "$0")/../.." && pwd)"
DOMAIN="${DEPLOY_DOMAIN:-belajarcpns.web.id}"
APP="${DEPLOY_APP:-$HOME/public/$DOMAIN}"           # Application root Node.js App
GH_REPO="${DEPLOY_GH_REPO:-apriprogram/belajarcpns}"
PKG_URL="https://github.com/$GH_REPO/releases/download/cpanel-build/belajarcpns-build.tar.gz"
WAIT_MIN="${DEPLOY_WAIT_MIN:-20}"                     # tunggu build GitHub Actions maks. N menit
LOG="$HOME/belajarcpns-deploy.log"
STAGE="$HOME/.belajarcpns-stage"

# Catat ke log (jailshell cPanel tak punya /dev/fd → tanpa process substitution).
if [ -z "${DEPLOY_LOGGING:-}" ]; then
  export DEPLOY_LOGGING=1
  bash "$0" "$@" 2>&1 | tee -a "$LOG"
  exit "${PIPESTATUS[0]}"
fi

HEAD=$(git -C "$REPO" rev-parse HEAD)
echo "===== $(date '+%F %T') deploy $(git -C "$REPO" log --oneline -1) ====="

if command -v flock >/dev/null 2>&1; then
  exec 9>"$HOME/.belajarcpns-deploy.lock"
  flock -n 9 || { echo "Deploy lain sedang berjalan."; exit 1; }
fi

mkdir -p "$APP/_app"/{bin,logs,data/uploads}

# ---------- .env (dibuat sekali; isi password DB lewat File Manager) ----------
ENVF="$APP/_app/.env"
if [ ! -f "$ENVF" ]; then
  sed "s|__JWT_SECRET__|$(head -c 48 /dev/urandom | base64 | tr -d '\n/+=')|" "$REPO/deploy/cpanel/env.template" >"$ENVF"
  chmod 600 "$ENVF"
  echo "Dibuat $ENVF — ISI password database (GANTI_PASSWORD_DB) lalu jalankan deploy lagi."
fi
API_PORT=$(sed -n "s/^API_PORT=['\"]\{0,1\}\([0-9]*\).*/\1/p" "$ENVF" | head -n1)
API_PORT=${API_PORT:-47391}

# ---------- Unduh paket untuk commit HEAD ----------
rm -rf "$STAGE" && mkdir -p "$STAGE"
deadline=$(( $(date +%s) + WAIT_MIN * 60 ))
while :; do
  if curl -fsSL --retry 3 -o "$STAGE/pkg.tar.gz" "$PKG_URL?t=$(date +%s)"; then
    BUILT=$(tar -xzOf "$STAGE/pkg.tar.gz" ./_app/BUILD_COMMIT 2>/dev/null || true)
    [ "$BUILT" = "$HEAD" ] && break
    echo "Paket di GitHub masih untuk ${BUILT:0:7}, menunggu build ${HEAD:0:7} (GitHub Actions)..."
  else
    echo "Paket belum tersedia, menunggu GitHub Actions..."
  fi
  [ "$(date +%s)" -ge "$deadline" ] && { echo "GAGAL: paket untuk ${HEAD:0:7} belum ada setelah $WAIT_MIN menit. Cek tab Actions di GitHub."; exit 1; }
  sleep 30
done
tar -xzf "$STAGE/pkg.tar.gz" -C "$STAGE"
BUILT_PORT=$(cat "$STAGE/_app/BUILD_API_PORT" 2>/dev/null || echo 47391)
[ "$BUILT_PORT" = "$API_PORT" ] || echo "PERINGATAN: paket dibangun untuk API_PORT=$BUILT_PORT, .env memakai $API_PORT — samakan!"
echo "Paket ${HEAD:0:7} terunduh."

# ---------- Pasang ----------
cp "$STAGE/server.js" "$STAGE/package.json" "$APP/"
cp "$STAGE/_app/bin/watchdog.sh" "$APP/_app/bin/watchdog.sh"
cp "$STAGE/_app/bin/bisapns-api" "$APP/_app/bin/bisapns-api.new"
cp "$STAGE/_app/BUILD_COMMIT" "$APP/_app/BUILD_COMMIT"
chmod +x "$APP/_app/bin/watchdog.sh" "$APP/_app/bin/bisapns-api.new"

# Blok proteksi .htaccess di atas baris Passenger buatan cPanel.
HT="$APP/.htaccess"
touch "$HT"
if ! grep -q "BELAJARCPNS-PROTECT-START" "$HT"; then
  cat "$REPO/deploy/cpanel/htaccess-protect.txt" "$HT" >"$HT.new" && mv "$HT.new" "$HT"
fi

# Tukar web lama ↔ baru, hentikan API lama, mulai ulang aplikasi Node (Passenger).
rm -rf "$APP/_app/web.old"
if [ -d "$APP/_app/web" ]; then mv "$APP/_app/web" "$APP/_app/web.old"; fi
mv "$STAGE/_app/web" "$APP/_app/web"
mv -f "$APP/_app/bin/bisapns-api.new" "$APP/_app/bin/bisapns-api"
pkill -u "$(id -u)" -f "_app/bin/bisapns-api" || true
sleep 1
/bin/sh "$APP/_app/bin/watchdog.sh" || true
mkdir -p "$APP/tmp" && touch "$APP/tmp/restart.txt"
rm -rf "$APP/_app/web.old" "$STAGE"

sleep 5
if curl -fsS --max-time 5 "http://127.0.0.1:$API_PORT/health" | grep -q '"ok"'; then
  echo "API sehat di 127.0.0.1:$API_PORT"
else
  echo "PERINGATAN: API belum sehat — lihat $APP/_app/logs/api.log (cek password DB di _app/.env)"
  tail -n 15 "$APP/_app/logs/api.log" || true
fi
echo "===== selesai $(date '+%F %T') ====="
