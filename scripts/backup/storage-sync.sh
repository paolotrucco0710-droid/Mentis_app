#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

MANIFEST_PATH="${1:-storage-backup-manifest.json}"

echo "Generazione manifest storage..."
npm run storage:manifest -- "$MANIFEST_PATH"

if [[ "${STORAGE_PROVIDER:-local}" == "s3" ]]; then
  if [[ -z "${STORAGE_BUCKET:-}" ]]; then
    echo "STORAGE_BUCKET obbligatorio per sync S3." >&2
    exit 1
  fi

  LOCAL_PATH="${UPLOAD_STORAGE_PATH:-./storage/uploads}"
  S3_URI="s3://${STORAGE_BUCKET}/uploads/"

  echo "Sync locale -> S3: $LOCAL_PATH -> $S3_URI"
  aws s3 sync "$LOCAL_PATH" "$S3_URI" --only-show-errors
  echo "Sync storage completato."
else
  echo "STORAGE_PROVIDER=local: manifest generato, nessuna sync cloud richiesta."
fi
