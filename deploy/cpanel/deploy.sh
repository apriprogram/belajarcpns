#!/bin/bash
# Deploy BELAJAR CPNS di cPanel dari repo Git (cPanel → Git Version Control → Deploy HEAD Commit,
# lewat .cpanel.yml) atau manual di Terminal:  bash ~/repositories/belajarcpns/deploy/cpanel/deploy.sh
# Membangun API Go + web Next.js DI SERVER lalu memasang ke folder domain. docs/DEPLOY-CPANEL.md
set -euo pipefail

REPO="$(cd "$(dirname "$0")/../.." && pwd)"
DOMAIN="${DEPLOY_DOMAIN:-belajarcpns.web.id}"
APP="${DEPLOY_APP:-$HOME/public/$DOMAIN}"           # Application root Node.js App
BUILD="${DEPLOY_BUILD:-$HOME/.belajarcpns-build}"    # cache build (di luar public)
NODEVENV="${DEPLOY_NODEVENV:-$HOME/nodevenv/public/$DOMAIN/22}"
TOOLS="$HOME/.local/opt"
LOG="$HOME/belajarcpns-deploy.log"
LOCK="$HOME/.belajarcpns-deploy.lock"

# Catat ke log (jailshell cPanel tak punya /dev/fd → tanpa process substitution).
if [ -z "${DEPLOY_LOGGING:-}" ]; then
  export DEPLOY_LOGGING=1
  bash "$0" "$@" 2>&1 | tee -a "$LOG"
  exit "${PIPESTATUS[0]}"
fi
echo "===== $(date '+%F %T') deploy $(git -C "$REPO" log --oneline -1) ====="

# Satu deploy dalam satu waktu.
if command -v flock >/dev/null 2>&1; then
  exec 9>"$LOCK"
  flock -n 9 || { echo "Deploy lain sedang berjalan."; exit 1; }
fi

mkdir -p "$APP/_app"/{bin,logs,data/uploads} "$BUILD" "$TOOLS"

# ---------- .env (dibuat sekali; isi password DB lewat File Manager) ----------
ENVF="$APP/_app/.env"
if [ ! -f "$ENVF" ]; then
  sed "s|__JWT_SECRET__|$(head -c 48 /dev/urandom | base64 | tr -d '\n/+=')|" "$REPO/deploy/cpanel/env.template" >"$ENVF"
  chmod 600 "$ENVF"
  echo "Dibuat $ENVF — ISI password database (GANTI_PASSWORD_DB) lalu deploy/restart lagi."
fi
API_PORT=$(sed -n "s/^API_PORT=['\"]\{0,1\}\([0-9]*\).*/\1/p" "$ENVF" | head -n1)
API_PORT=${API_PORT:-47391}

# ---------- API Go ----------
GOV=$(curl -fsSL "https://go.dev/VERSION?m=text" | head -n1)
if [ ! -x "$TOOLS/go/bin/go" ] || [ "$("$TOOLS/go/bin/go" env GOVERSION)" != "$GOV" ]; then
  echo "Memasang $GOV ..."
  rm -rf "$TOOLS/go"
  curl -fsSL "https://go.dev/dl/$GOV.linux-amd64.tar.gz" | tar -xz -C "$TOOLS"
fi
export PATH="$TOOLS/go/bin:$PATH" GOPATH="$BUILD/gopath" GOCACHE="$BUILD/gocache" GOFLAGS=-trimpath GOTOOLCHAIN=local
rm -rf "$BUILD/api" && cp -r "$REPO/apps/api" "$BUILD/api"
(
  cd "$BUILD/api"
  sed -i '/DEV-ONLY-REPLACE-START/,/DEV-ONLY-REPLACE-END/d' go.mod
  go mod tidy
  CGO_ENABLED=0 go build -ldflags='-s -w' -o "$APP/_app/bin/bisapns-api.new" ./cmd/api
)
echo "API terbangun."

# ---------- Web Next.js (standalone) ----------
# shellcheck disable=SC1091
source "$NODEVENV/bin/activate"
mkdir -p "$BUILD/web"
# Salin sumber (pertahankan node_modules & cache .next/cache agar build berikutnya cepat).
( cd "$REPO/apps/web" && tar --exclude=node_modules --exclude=.next -cf - . ) | ( cd "$BUILD/web" && tar -xf - )
(
  cd "$BUILD/web"
  if [ ! -d node_modules ] || ! cmp -s package-lock.json node_modules/.deploy-lock; then
    npm ci --no-audit --no-fund
    cp package-lock.json node_modules/.deploy-lock
  fi
  rm -rf .next/standalone .next/static
  API_URL="http://127.0.0.1:$API_PORT" SITE_URL="https://$DOMAIN" NEXT_TELEMETRY_DISABLED=1 NODE_OPTIONS=--max-old-space-size=3072 npm run build
  rm -rf "$APP/_app/web.new" && mkdir -p "$APP/_app/web.new"
  cp -r .next/standalone/. "$APP/_app/web.new/"
  cp -r .next/static "$APP/_app/web.new/.next/static"
  cp -r public "$APP/_app/web.new/public"
)
deactivate || true
echo "Web terbangun."

# ---------- Pasang ----------
cp "$REPO/deploy/cpanel/server.js" "$APP/server.js"
cp "$REPO/deploy/cpanel/package.json" "$APP/package.json"
cp "$REPO/deploy/cpanel/watchdog.sh" "$APP/_app/bin/watchdog.sh"
chmod +x "$APP/_app/bin/watchdog.sh" "$APP/_app/bin/bisapns-api.new"

# Blok proteksi .htaccess di atas baris Passenger buatan cPanel.
HT="$APP/.htaccess"
touch "$HT"
if ! grep -q "BELAJARCPNS-PROTECT-START" "$HT"; then
  cat "$REPO/deploy/cpanel/htaccess-protect.txt" "$HT" >"$HT.new" && mv "$HT.new" "$HT"
fi

# Tukar versi lama ↔ baru, hentikan API lama, mulai ulang aplikasi Node (Passenger).
rm -rf "$APP/_app/web.old" && { [ -d "$APP/_app/web" ] && mv "$APP/_app/web" "$APP/_app/web.old" || true; }
mv "$APP/_app/web.new" "$APP/_app/web"
mv -f "$APP/_app/bin/bisapns-api.new" "$APP/_app/bin/bisapns-api"
pkill -u "$(id -u)" -f "$APP/_app/bin/bisapns-api" || pkill -u "$(id -u)" -x bisapns-api || true
sleep 1
/bin/sh "$APP/_app/bin/watchdog.sh" || true
mkdir -p "$APP/tmp" && touch "$APP/tmp/restart.txt"
rm -rf "$APP/_app/web.old"

sleep 4
if curl -fsS --max-time 5 "http://127.0.0.1:$API_PORT/health" | grep -q '"ok"'; then
  echo "API sehat di 127.0.0.1:$API_PORT"
else
  echo "PERINGATAN: API belum sehat — lihat $APP/_app/logs/api.log (cek password DB di _app/.env)"
  tail -n 20 "$APP/_app/logs/api.log" || true
fi
echo "===== selesai $(date '+%F %T') ====="
