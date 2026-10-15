#!/bin/sh
# Backup harian PostgreSQL (dijalankan oleh service `backup` di docker-compose.prod.yml).
# - Dump format custom (-Fc) ke /backups/bisapns-YYYYmmdd-HHMMSS.dump
# - Berjalan setiap hari pada BACKUP_TIME (HH:MM, zona TZ), retensi BACKUP_RETENTION_DAYS hari.
set -u
BACKUP_TIME="${BACKUP_TIME:-02:00}"
RETENTION="${BACKUP_RETENTION_DAYS:-14}"
DIR=/backups
mkdir -p "$DIR"

do_backup() {
  ts=$(date +%Y%m%d-%H%M%S)
  out="$DIR/bisapns-$ts.dump"
  echo "[backup] $(date '+%F %T') mulai -> $out"
  if pg_dump -Fc -f "$out.tmp"; then
    mv "$out.tmp" "$out"
    echo "[backup] selesai ($(du -h "$out" | cut -f1))"
  else
    echo "[backup] GAGAL" >&2
    rm -f "$out.tmp"
  fi
  find "$DIR" -name 'bisapns-*.dump' -type f -mtime +"$RETENTION" -print -delete
}

until pg_isready -q; do sleep 2; done
echo "[backup] aktif. Jadwal harian $BACKUP_TIME, retensi $RETENTION hari."
# Backup pertama saat container start bila belum ada backup hari ini.
ls "$DIR"/bisapns-"$(date +%Y%m%d)"-*.dump >/dev/null 2>&1 || do_backup
last=""
while true; do
  now=$(date +%H:%M); today=$(date +%F)
  if [ "$now" = "$BACKUP_TIME" ] && [ "$last" != "$today" ]; then
    do_backup
    last="$today"
  fi
  sleep 30
done
