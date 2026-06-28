# DzRent Backend — Handoff

NestJS + Prisma + PostgreSQL backend for an Algerian car-rental platform (Client PWA + Agency SaaS). This document is the single source of truth for continuing the backend.

## Status: feature-complete across Sprints 1–5, compiles cleanly (`tsc --noEmit` → 0 errors)

90 TS files · 22 modules · 12 controllers · ~70 endpoints.

---

## How to run (first time)

```bash
cp .env.example .env          # fill CHANGE_ME secrets: openssl rand -hex 32
docker compose up -d          # postgres+postgis, redis, minio
pnpm install                  # from the repo root
pnpm exec prisma generate
pnpm exec prisma migrate deploy   # applies the committed baseline migration (0_init)
pnpm exec prisma db execute --file ./prisma/manual/add_gps_geography.sql --schema ./prisma/schema.prisma
pnpm exec prisma db seed
pnpm run start:dev            # Swagger at /api/docs
```

> **Sandbox note:** this code was built where `binaries.prisma.sh` is firewalled, so
> `prisma generate` could not download the query engine. A **types-only shim** was
> written to `node_modules/.prisma/client/` so `tsc` could validate the code. The
> FIRST thing to do in a real environment is delete `node_modules` and run a normal
> `npm install && npx prisma generate` — the genuine client replaces the shim. The
> shim is types-only and never ships (node_modules is git-ignored).

---

## Architecture decisions (the "why", so you don't re-litigate them)

- **Phone-first auth.** OTP (6-digit, bcrypt-hashed in `User.otpHash`, 10-min TTL, 5 attempts → 30-min lock, 60s Redis resend cooldown). JWT access (15m) + refresh (7d) with **separate secrets** and a `type` claim to prevent confusion attacks. Refresh tokens stored **sha256-hashed** in Redis (NOT bcrypt — see Audit B2), rotated on use, with theft-detection revoking all sessions on hash mismatch.
- **Global infra modules** (`@Global()`): Prisma, Redis, SMS, Storage, Audit, Notifications, PlatformConfig, Fraud, Pricing. Feature modules inject their services without re-importing.
- **Provider abstraction via Symbol tokens + factory** for both SMS (`SMS_SERVICE`) and Payments (`PAYMENT_GATEWAY`): real impl in production-with-credentials, Mock/Console otherwise. This is how the whole booking→payment→contract pipeline runs end-to-end in dev with no Twilio/SATIM accounts.
- **Money** = `Decimal` everywhere, DZD. **Dates** = `Timestamptz` UTC, displayed Africa/Algiers at the app layer. **Phones** = E.164 (`+213[5-7]XXXXXXXX`).
- **Multi-tenant**: every agency-scoped row carries `agencyId`. Enforcement today is application-layer filtering; RLS policies are written (`prisma/migrations/manual/enable_rls.sql`) and the `AsyncLocalStorage` agency-context plumbing is in place, to be switched on in a hardening pass.
- **Immutable snapshots**: bookings freeze their price quote AND cancellation policy at creation, so later price/policy changes never alter historical contracts (financial-audit requirement).

## The 5 audit bugs that were found & fixed (do not reintroduce)

1. **B1** — `TooManyRequestsException` is **not** in `@nestjs/common`. Custom one lives in `src/common/exceptions/app.exceptions.ts`.
2. **B2** — bcrypt truncates at 72 bytes, so all of a user's refresh tokens hashed identically → theft-detection was dead. Refresh tokens now use `sha256Hex` + `safeEqualHex` (`src/common/utils/crypto.util.ts`). bcrypt still used for the low-entropy OTP.
3. **B3** — NestJS **middleware runs before guards**, so reading `req.user` in middleware always saw `undefined`. Agency context is now an empty ALS store created in middleware and **populated in `JwtAuthGuard`** after Passport authenticates.
4. **B4** — `ThrottlerModule` alone does nothing; the guard must be bound. `{ provide: APP_GUARD, useClass: ThrottlerGuard }` is in `app.module.ts`. Without it every `@Throttle()` on the OTP endpoints was inert.
5. **B5** — `redis.keys()` blocks the event loop. `revokeAllSessions` uses `scanStream`.

## Module map (all under src/)

| Module | Responsibility |
|---|---|
| auth, users | OTP login, JWT rotation, profile, admin user list |
| kyc | Versioned doc upload (presigned S3), admin review, CIN→`nationalIdNumber` + duplicate-CIN fraud signal, booking-eligibility gate |
| agencies | Onboarding (CLIENT→AGENCY_OWNER promotion), verification docs, admin verify, staff management |
| vehicles | Agency CRUD, photos/docs (versioned), **compliance gate** (insurance+visite+GPS) for AVAILABLE, public client search |
| pricing | Rate resolution chain (vehicle override → wilaya rule → 422), tiered quote (monthly/weekly/daily) + options + TVA 19% |
| bookings | **The orchestrator.** 5 gates (active → KYC → blacklist → risk score → velocity), Serializable overlap-safe creation with advisory-locked `DZR-YYYY-NNNNN` ref, full lifecycle (approve/reject/pickup/return/cancel) with Algerian late-return penalty + policy-snapshot refunds |
| contracts | Clause selection (mandatory + wilaya-scoped), bilingual PDF (pdfkit), HMAC e-signature |
| payments | `IPaymentGateway` (SATIM for CIB+Edahabia / Mock), deposit pre-auth→release/capture, cash with AML cap, gap-free per-agency invoicing |
| blacklist | Cross-agency federation (shares/accepts), admin review |
| gps | HMAC-signed batch ingestion (no JWT), haversine geofencing + speed flags, Redis-deduped alerts, agency-scoped history |
| admin, health | Config CRUD, fraud-signal resolution, platform stats; DB+Redis liveness |

## What is NOT production-ready (deliberate — see PROJECT_STATUS.md for the full list)

- **SATIM gateway** implements the documented register/confirm shape but is **not bank-certified**. Real terminal credentials + certification required. Falls back to MockGateway until `SATIM_*` env present in production.
- **Arabic PDF** renders French clauses + Arabic titles only. Full RTL needs an embedded Amiri font (`assets/fonts/`) + a reshaper/bidi pass.
- **RLS** policies written but not enabled. App-layer `agencyId` filtering is the current enforcement.
- **E-signature** is HMAC proof-of-event, not a legally-certified electronic signature (Algerian law 15-04 review needed for full legal weight).
- GPS device provisioning, load testing, and the partitioning/Timescale migration for `gps_tracking_logs` at scale are operational follow-ups.

## Suggested next steps, in order

1. Real `npm install && prisma generate` in your environment; run the migrate+seed sequence above; hit `/api/docs`.
2. Write the seed values the pricing/options engine reads (`option_*_per_day_da`, etc.) into `PlatformConfig` — the seed covers most; confirm the option keys.
3. e2e test the golden path: request-otp → verify → KYC upload+approve (admin) → agency create+verify → vehicle create+docs+insurance → search → book → pay (mock) → sign → pickup → return.
4. Hardening pass: enable RLS, add the Amiri font, wire real SATIM credentials behind the existing factory.
