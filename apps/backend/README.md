# DzRent — Backend

Algerian car-rental platform (Client PWA + Agency SaaS), inspired by Yassir's simplicity and trust. NestJS + Prisma + PostgreSQL/PostGIS + Redis.

## Quick start

```bash
cp .env.example .env        # fill secrets (openssl rand -hex 32)
docker compose up -d        # postgres+postgis, redis, minio
npm install
npx prisma generate
npx prisma migrate dev --name sprint1_initial_schema
npx prisma db execute --file ./prisma/migrations/manual/add_gps_geography.sql --schema ./prisma/schema.prisma
npx prisma db seed
npm run start:dev           # → http://localhost:3000 · Swagger: /api/docs
```

## Docs
- **HANDOFF.md** — architecture decisions, the 5 audit fixes, module map, how to continue.
- **PROJECT_STATUS.md** — production-readiness checklist (what's done vs. pending).
- **DATABASE_SETUP.md** — full DB/migration/ops guide.

## Stack highlights
Phone-first OTP auth · JWT access+refresh rotation · multi-tenant agencies · KYC with versioned docs · wilaya-aware pricing · fraud gates · cross-agency blacklist · GPS geofencing · bilingual (fr/ar) contracts · CIB/Edahabia payments.

## Key conventions
UTC storage / Africa/Algiers display · E.164 phones · DZD Decimal money · soft deletes · append-only audit log (Loi 18-05).
