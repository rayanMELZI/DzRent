# DzRent

> Marketplace de location de voitures pour l'Algérie — **PWA Client** + **SaaS Agence**.
> _Car-rental marketplace for Algeria — a Client PWA and an Agency dashboard that form one product family._

Trust is the core of the product. A private individual rents a car from a local,
**verified** rental agency. The agency verifies the customer (KYC), approves
bookings, monitors compliance (insurance, technical inspection) and feeds a shared
inter-agency blacklist. Everything is **bilingual French / Arabic** with a true RTL
mirror, phone-first (OTP) identity, and DZD pricing where the refundable deposit is
always visually quarantined.

---

## Monorepo at a glance

```
dzrent/
├── apps/
│   ├── backend/            NestJS + Prisma + PostgreSQL/PostGIS + Redis API   → :3000
│   ├── agency-dashboard/   Next.js desktop SaaS (fleet, bookings, KYC, fraud) → :3001
│   └── client-pwa/         Next.js mobile PWA (not yet scaffolded)            → :3002
├── packages/
│   ├── tokens/             Design tokens + Tailwind preset (one visual source of truth)
│   ├── i18n/               Bilingual FR/AR dictionary, DZD formatter, RTL helpers
│   └── types/              Shared domain types + the client↔agency state contract
├── docs/                   Architecture, roadmap, contributing
└── turbo.json              Task pipeline (build · dev · lint · typecheck · test)
```

It is a **monorepo, not a monolith.** Each app builds into its own artifact and is
deployed and served independently on its own port. The monorepo only shares code and
tooling at development time (design tokens, i18n, types, lint/format config).

---

## Quick start

Prerequisites: **Node ≥ 20**, **pnpm ≥ 9** (`corepack enable` or `npm i -g pnpm`),
**Docker** (for the backend's Postgres/Redis/MinIO).

```bash
pnpm install                       # install the whole workspace

# 1) Backend infrastructure + API
cd apps/backend
cp .env.example .env               # fill the CHANGE_ME secrets: openssl rand -hex 32
                                   # if port 5432 is taken, set POSTGRES_HOST_PORT=5433
                                   # and use that port in DATABASE_URL / DIRECT_URL
docker compose up -d               # postgres+postgis, redis, minio
pnpm exec prisma generate
pnpm exec prisma migrate deploy    # applies the committed baseline migration
pnpm exec prisma db execute --file ./prisma/manual/add_gps_geography.sql --schema ./prisma/schema.prisma
pnpm exec prisma db seed           # 58 wilayas, categories, legal clauses, platform config
cd ../..

# 2) Agency dashboard env
cp apps/agency-dashboard/.env.example apps/agency-dashboard/.env.local

# 3) Run everything (turbo runs each app's dev task)
pnpm dev
```

- API + Swagger docs → http://localhost:3000/api/docs (global route prefix: `/api/v1`)
- Agency dashboard → http://localhost:3001

**Signing in (dev):** the dashboard uses phone-OTP login. With the console SMS
provider (default in dev) the 6-digit code is printed to the **backend console** —
copy it from there into the login screen. No real SMS account is needed.

To run a single app: `pnpm --filter @dzrent/agency-dashboard dev`.

---

## Common scripts (root)

| Script                          | Does                                |
| ------------------------------- | ----------------------------------- |
| `pnpm dev`                      | Run every app's dev server (Turbo)  |
| `pnpm build`                    | Build every app and package         |
| `pnpm typecheck`                | `tsc --noEmit` across the workspace |
| `pnpm lint`                     | Lint every package                  |
| `pnpm format`                   | Prettier write across the repo      |
| `pnpm --filter <name> <script>` | Target one workspace package        |

Workspace package names: `@dzrent/backend`, `@dzrent/agency-dashboard`,
`@dzrent/tokens`, `@dzrent/i18n`, `@dzrent/types`.

---

## Documentation

| Doc                                                              | Read it for                                           |
| ---------------------------------------------------------------- | ----------------------------------------------------- |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)                     | How the pieces fit, tech decisions, conventions       |
| [docs/ROADMAP.md](docs/ROADMAP.md)                               | The phased plan from here to a usable MVP and beyond  |
| [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)                     | Branching, commits, how to add a package or screen    |
| [apps/backend/HANDOFF.md](apps/backend/HANDOFF.md)               | Backend architecture decisions & module map           |
| [apps/backend/PROJECT_STATUS.md](apps/backend/PROJECT_STATUS.md) | Backend production-readiness checklist                |
| [docs/design-handoff/](docs/design-handoff/)                     | The hi-fi design spec, tokens, RTL rules, screen list |

---

## Tech stack

**Backend** NestJS · Prisma · PostgreSQL 16 + PostGIS · Redis · S3-compatible storage
· phone-OTP auth (JWT access+refresh rotation) · SATIM/CIB + Edahabia + cash payments.

**Frontend** Next.js (App Router) · TypeScript · Tailwind CSS (shared token preset) ·
bilingual FR/AR with true RTL mirror · mobile-first PWA (client) and desktop-first SaaS (agency).

**Tooling** pnpm workspaces · Turborepo · ESLint · Prettier · GitHub Actions CI.
