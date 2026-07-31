#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[mentis] Applying database migrations..."
npx prisma migrate deploy

echo "[mentis] Starting production server..."
exec npm run start
