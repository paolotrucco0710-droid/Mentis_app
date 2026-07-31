#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_DIR="${1:-$ROOT_DIR/backups/db}"
TIMESTAMP="$(date -u +"%Y%m%dT%H%M%SZ")"
OUTPUT_FILE="$OUTPUT_DIR/mentis-$TIMESTAMP.sql"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL non impostato." >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

echo "Dump database in $OUTPUT_FILE"
pg_dump "$DATABASE_URL" --no-owner --no-acl --format=plain > "$OUTPUT_FILE"

gzip -f "$OUTPUT_FILE"
echo "Backup completato: ${OUTPUT_FILE}.gz"
