# DzRent — Backend

Algerian car-rental platform (Client PWA + Agency SaaS), inspired by Yassir's simplicity and trust. NestJS + Prisma + PostgreSQL/PostGIS + Redis.

## Quick start

```bash
cp .env.example .env        # fill secrets (openssl rand -hex 32)
                            # if 5432 is taken, set POSTGRES_HOST_PORT and match it in DATABASE_URL/DIRECT_URL
docker compose up -d        # postgres+postgis, redis, minio
pnpm install                # run from the repo root the first time
pnpm exec prisma generate
pnpm exec prisma migrate deploy   # applies the committed baseline migration (0_init)
pnpm exec prisma db execute --file ./prisma/manual/add_gps_geography.sql --schema ./prisma/schema.prisma
pnpm exec prisma db seed
pnpm run start:dev          # → http://localhost:3000 · Swagger: /api/docs
```

## Docs

- **HANDOFF.md** — architecture decisions, the 5 audit fixes, module map, how to continue.
- **PROJECT_STATUS.md** — production-readiness checklist (what's done vs. pending).
- **DATABASE_SETUP.md** — full DB/migration/ops guide.

## Stack highlights

Phone-first OTP auth · JWT access+refresh rotation · multi-tenant agencies · KYC with versioned docs · wilaya-aware pricing · fraud gates · cross-agency blacklist · GPS geofencing · bilingual (fr/ar) contracts · CIB/Edahabia payments.

## Key conventions

UTC storage / Africa/Algiers display · E.164 phones · DZD Decimal money · soft deletes · append-only audit log (Loi 18-05).
