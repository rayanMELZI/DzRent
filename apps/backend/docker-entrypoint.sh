#!/bin/sh
# Backend container entrypoint: bring the schema up to date, then start the API.
# `migrate deploy` only applies already-committed migrations (never generates or
# resets), so it is safe to run on every boot. Seeding is a separate one-off:
#   docker compose -f docker-compose.prod.yml exec backend npx prisma db seed
set -e

echo "▶ Applying database migrations…"
npx prisma migrate deploy

# Nest emits to dist/src/main.js (the project-root prisma/ dir nests output under src).
echo "▶ Starting DzRent API…"
exec node dist/src/main
