#!/usr/bin/env bash
# Backup manual database BISA-PNS via docker compose.
# Pemakaian: scripts/backup.sh [compose-file]   (default: docker-compose.yml)
#   contoh produksi: scripts/backup.sh docker-compose.prod.yml
set -euo pipefail
cd "$(dirname "$0")/.."

COMPOSE_FILE="${1:-docker-compose.yml}"
DB_USER="${POSTGRES_USER:-bisapns}"
DB_NAME="${POSTGRES_DB:-bisapns}"
OUT_DIR="backups"
mkdir -p "$OUT_DIR"
OUT="$OUT_DIR/bisapns-$(date +%Y%m%d-%H%M%S).dump"

echo "==> Membuat backup dari service 'db' ($COMPOSE_FILE) ..."
docker compose -f "$COMPOSE_FILE" exec -T db pg_dump -U "$DB_USER" -d "$DB_NAME" -Fc > "$OUT.tmp"
mv "$OUT.tmp" "$OUT"
echo "==> Selesai: $OUT ($(du -h "$OUT" | cut -f1))"
