#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Panorama Seaside Studios — MySQL Backup Script
# Add to crontab: 0 3 * * * /opt/panorama/scripts/backup.sh
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

BACKUP_DIR="/opt/panorama/backups"
CONTAINER="panorama-mysql"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Load env
if [ -f /opt/panorama/.env ]; then
  source /opt/panorama/.env
fi

DB_NAME="${MYSQL_DATABASE:-panorama}"
DB_USER="${MYSQL_USER:-panorama_user}"
DB_PASS="${MYSQL_PASSWORD:-}"

if [ -z "$DB_PASS" ]; then
  echo "[ERROR] MYSQL_PASSWORD not set in .env"
  exit 1
fi

mkdir -p "$BACKUP_DIR"

BACKUP_FILE="$BACKUP_DIR/panorama_${DATE}.sql.gz"

echo "[BACKUP] Starting MySQL backup: $DATE"

# Use MYSQL_PWD env var to avoid password in process listing
docker exec -e MYSQL_PWD="$DB_PASS" "$CONTAINER" mysqldump \
  -u "$DB_USER" \
  --single-transaction \
  --no-tablespaces \
  --routines \
  --triggers \
  "$DB_NAME" | gzip > "$BACKUP_FILE"

FILESIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "[BACKUP] Created: $BACKUP_FILE ($FILESIZE)"

# Cleanup old backups
echo "[BACKUP] Cleaning backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -name "panorama_*.sql.gz" -mtime +$RETENTION_DAYS -delete

TOTAL=$(ls -1 "$BACKUP_DIR"/panorama_*.sql.gz 2>/dev/null | wc -l)
echo "[BACKUP] Done. $TOTAL backup(s) retained."
