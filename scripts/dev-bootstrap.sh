#!/usr/bin/env bash
# Idempotent environment bootstrap for Claude Code web sessions:
# starts Postgres, applies migrations, generates the client, and seeds once.
set -euo pipefail
cd "$(dirname "$0")/.."

bash scripts/db-setup.sh

if [ -f .env ]; then set -a; . ./.env; set +a; fi

pnpm exec prisma migrate deploy >/dev/null 2>&1 \
  || pnpm exec prisma migrate dev --name auto >/dev/null 2>&1 || true
pnpm exec prisma generate >/dev/null 2>&1 || true

# Seed only when the database has no users yet (preserves existing data).
USER_COUNT=$(PGPASSWORD=clima psql -h localhost -p 5432 -U clima -d clima -tAc 'SELECT count(*) FROM "User";' 2>/dev/null || echo 0)
if [ "${USER_COUNT:-0}" = "0" ]; then
  echo "Seeding demo data…"
  pnpm db:seed || true
fi
echo "Bootstrap complete."
