#!/bin/bash
# Pulihkan data (database + file unggahan) ke hosting cPanel dari arsip belajarcpns-data.tar.gz
# (isi: db.sql hasil pg_dump --clean --if-exists --no-owner --no-acl, dan folder uploads/).
#   bash ~/repositories/belajarcpns/deploy/cpanel/restore-data.sh ~/belajarcpns-data.tar.gz
# PERHATIAN: menimpa seluruh isi database produksi. Koneksi DB dibaca dari _app/.env. docs/DEPLOY-CPANEL.md
set -euo pipefail

ARCHIVE="${1:?pakai: restore-data.sh <arsip.tar.gz>}"
APP="${DEPLOY_APP:-$HOME/public/belajarcpns.web.id}"
STAGE="$HOME/.belajarcpns-restore"

rm -rf "$STAGE" && mkdir -p "$STAGE"
tar -xzf "$ARCHIVE" -C "$STAGE"
[ -f "$STAGE/db.sql" ] || { echo "db.sql tidak ada di arsip"; exit 1; }

set -a
# shellcheck disable=SC1091
. "$APP/_app/.env"
set +a
case "$DATABASE_URL" in *GANTI_PASSWORD_DB*) echo "Isi dulu password database di $APP/_app/.env"; exit 1 ;; esac

echo "Menghentikan API..."
pkill -u "$(id -u)" -f "_app/bin/bisapns-api" || true
sleep 1

echo "Memulihkan database..."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f "$STAGE/db.sql" >/dev/null
psql "$DATABASE_URL" -At -c "select 'users='||count(*) from users" -c "select 'questions='||count(*) from questions" -c "select 'migrasi='||max(version) from schema_migrations"

if [ -d "$STAGE/uploads" ]; then
  echo "Menyalin file unggahan..."
  mkdir -p "$APP/_app/data/uploads"
  cp -r "$STAGE/uploads/." "$APP/_app/data/uploads/"
fi

rm -rf "$STAGE"
/bin/sh "$APP/_app/bin/watchdog.sh" || true
sleep 4
curl -fsS --max-time 5 "http://127.0.0.1:${API_PORT:-47391}/health" && echo && echo "Selesai: API sehat."
