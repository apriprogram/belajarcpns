#!/usr/bin/env bash
# Restore database BISA-PNS dari file .dump (format custom pg_dump -Fc).
# Pemakaian: scripts/restore.sh <file.dump> [compose-file]
# PERINGATAN: objek yang ada akan ditimpa (--clean --if-exists).
set -euo pipefail
cd "$(dirname "$0")/.."

FILE="${1:-}"
COMPOSE_FILE="${2:-docker-compose.yml}"
DB_USER="${POSTGRES_USER:-bisapns}"
DB_NAME="${POSTGRES_DB:-bisapns}"

if [[ -z "$FILE" || ! -f "$FILE" ]]; then
  echo "Pemakaian: $0 <file.dump> [compose-file]" >&2
  echo "File backup tersedia:" >&2
  ls -1t backups/*.dump 2>/dev/null | head -n 10 >&2 || echo "  (tidak ada)" >&2
  exit 1
fi

read -r -p "Database '$DB_NAME' akan DITIMPA dengan $FILE. Lanjutkan? [y/N] " ans
[[ "$ans" =~ ^[Yy]$ ]] || { echo "Dibatalkan."; exit 1; }

echo "==> Menghentikan api sementara ..."
docker compose -f "$COMPOSE_FILE" stop api >/dev/null 2>&1 || true

echo "==> Restore ..."
docker compose -f "$COMPOSE_FILE" exec -T db \
  pg_restore -U "$DB_USER" -d "$DB_NAME" --clean --if-exists --no-owner --no-privileges --exit-on-error < "$FILE"

echo "==> Menyalakan kembali api ..."
docker compose -f "$COMPOSE_FILE" start api >/dev/null
echo "==> Restore selesai."
