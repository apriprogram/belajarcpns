#!/bin/sh
# Watchdog API (Cron Jobs cPanel, tiap 5 menit):
#   */5 * * * * /bin/sh $HOME/public/belajarcpns.web.id/_app/bin/watchdog.sh >/dev/null 2>&1
# Menyalakan API Go bila mati & memangkas log yang terlalu besar. docs/DEPLOY-CPANEL.md
APP="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP" || exit 1
API_PORT=$(sed -n "s/^API_PORT=['\"]\{0,1\}\([0-9]*\).*/\1/p" .env | head -n1)
API_PORT=${API_PORT:-47391}
mkdir -p logs data/uploads

for f in logs/*.log; do
  [ -f "$f" ] && [ "$(wc -c <"$f")" -gt 20000000 ] && tail -c 2000000 "$f" >"$f.tmp" && mv "$f.tmp" "$f"
done

if ! curl -fsS --max-time 3 "http://127.0.0.1:$API_PORT/health" 2>/dev/null | grep -q '"ok"'; then
  # Muat .env lalu jalankan API di port lokal.
  set -a
  . ./.env
  set +a
  HOST=127.0.0.1 PORT=$API_PORT TZ=Asia/Jakarta nohup ./bin/bisapns-api >>logs/api.log 2>&1 &
  echo "$(date '+%F %T') watchdog: API dinyalakan ulang" >>logs/watchdog.log
fi
