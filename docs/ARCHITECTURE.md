# Architecture

This document explains how DzRent is structured and **why**, so decisions don't get
re-litigated. Read it before making cross-cutting changes.

## 1. Shape: a deploy-independent monorepo

One repository, multiple independently-deployable artifacts. pnpm workspaces give us
a single `node_modules` and `workspace:*` linking; Turborepo orchestrates and caches
the `build` / `dev` / `lint` / `typecheck` / `test` tasks.

```
apps/        deployable surfaces (own port, own build, own lifecycle)
packages/    shared libraries consumed by the apps at build time
```

**Why a monorepo if everything deploys separately?** The client PWA and the agency
dashboard must look and read identically — same brand palette, same status
vocabulary, same FR/AR copy, same domain shapes. Duplicating those across repos
guarantees drift. Sharing them as versioned internal packages guarantees parity while
each surface stays a standalone deployment on its own port:

| Surface          | Package                          | Port |
| ---------------- | -------------------------------- | ---- |
| API              | `@dzrent/backend`                | 3000 |
| Agency dashboard | `@dzrent/agency-dashboard`       | 3001 |
| Client PWA       | `@dzrent/client-pwa` _(planned)_ | 3002 |

## 2. Shared packages

Internal packages ship **raw TypeScript** (no build step). The Next.js apps list them
in `transpilePackages`, so editing a token or a string is reflected instantly with no
rebuild dance. Each is consumed via `workspace:*`.

- **`@dzrent/tokens`** — the single visual source of truth: colors, the shared status
  vocabulary, type scale, radii, shadows. Exports a plain `tokens` object **and** a
  Tailwind preset (`@dzrent/tokens/tailwind-preset`) that every app extends, so
  `bg-primary`, `text-status-refused-ink`, `rounded-r3`, `shadow-card` etc. mean the
  same thing everywhere.
- **`@dzrent/i18n`** — the bilingual `STR` dictionary (FR primary, AR), the DZD
  formatter (`formatDZD`), and the `Lang`/`Dir` model. Framework-agnostic; each app
  wraps it in its own React provider.
- **`@dzrent/types`** — domain types and the **client↔agency state contract**: the
  `Request` shape a client checkout creates and an agency approves, plus the canonical
  price math (`computeTotals`). As backend DTOs come online they converge onto these.

## 3. Backend (`apps/backend`)

NestJS + Prisma + PostgreSQL/PostGIS + Redis. It arrived feature-complete across its
first build cycle (~22 modules, ~70 endpoints) and compiles cleanly against the real
Prisma client. The authoritative backend docs live alongside the code:

- [HANDOFF.md](../apps/backend/HANDOFF.md) — architecture decisions, the audit fixes,
  module map, how to continue.
- [PROJECT_STATUS.md](../apps/backend/PROJECT_STATUS.md) — what's production-ready vs.
  what needs real-world work (SATIM certification, RLS enablement, Arabic PDF shaping,
  GPS partitioning, damage-report + reviews endpoints).

Key conventions (do not break): UTC storage / Africa/Algiers display · E.164 phones ·
DZD `Decimal` money · soft deletes · append-only audit log (Loi 18-05) · multi-tenant
`agencyId` on every agency-scoped row.

> **First-run note:** the backend must run `prisma generate` in a real environment.
> The original build validated types against a generated-client shim; the genuine
> client is stricter, which is why a few `select` definitions use
> `satisfies Prisma.UserSelect` (not `as const`) and a couple of `Array.includes`
> guards are annotated `as BookingStatus[]`. Keep that pattern.

## 4. Frontend (`apps/agency-dashboard`)

Next.js App Router, TypeScript, Tailwind. Chosen over a Vite SPA for SEO, server
rendering, and a clearer routing model.

```
src/
├── app/
│   ├── layout.tsx              root <html> + providers
│   ├── providers.tsx           LangProvider + StoreProvider (client)
│   ├── globals.css             Tailwind layers + ported dz-* utilities + fonts
│   └── (dashboard)/            route group rendered inside the dashboard shell
│       ├── layout.tsx          DashboardShell (sidebar + topbar + content)
│       ├── page.tsx            DashHome (KPIs, latest requests, compliance alerts)
│       └── fleet|requests|blacklist|map|revenue|staff/page.tsx
├── components/
│   ├── Icon, StatusBadge, VerifiedBadge, SectionStub
│   └── shell/ Sidebar, Topbar, Toast, DashboardShell
└── lib/
    ├── i18n.tsx                React context over @dzrent/i18n; syncs <html lang/dir>
    ├── store.tsx               mock store mirroring the state contract (§8)
    └── seed.ts                 typed seed data (stands in for the API for now)
```

**Bilingual / RTL.** Arabic is a _true layout mirror_, not just right-aligned text.
`LangProvider` sets `lang`/`dir` on `<html>`; layouts use logical properties
(`ms-`, `me-`, `ps-`, `inset-inline-*`) and `.dz-flip` for directional glyphs, so
toggling FR↔AR moves the whole layout (sidebar to the right, chevrons flipped).

**The state contract is the spine.** `lib/store.tsx` deliberately implements the same
interface the real API will expose (`addRequest`, `setRequestStatus`, …). When backend
endpoints land, only this file's data source changes — components are untouched.

## 5. Data & realtime direction

Today the dashboard reads from a typed in-memory store. The migration path:

1. Replace `lib/seed.ts` reads with API calls to `@dzrent/backend` (typed via
   `@dzrent/types`).
2. Promote the live client↔agency bridge (`addRequest` → agency queue, approve/refuse
   → client confirmation) from in-memory to WebSocket/SSE — the contract is identical.
3. Introduce a server-state layer (e.g. TanStack Query) and auth token handling.

See [ROADMAP.md](ROADMAP.md) for sequencing.
