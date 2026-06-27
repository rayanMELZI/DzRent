# @dzrent/agency-dashboard

Desktop-first SaaS for rental agencies: fleet, bookings, KYC review, the inter-agency
blacklist, GPS dispatch and revenue. Next.js (App Router) · TypeScript · Tailwind.

## Run

```bash
pnpm --filter @dzrent/agency-dashboard dev     # http://localhost:3001
```

Or `pnpm dev` from the repo root to run every app.

## Layout

- `src/app/(dashboard)/` — routes rendered inside the sidebar + topbar shell.
- `src/components/` — primitives (`Icon`, `StatusBadge`, `VerifiedBadge`) and `shell/`.
- `src/lib/` — `i18n` (FR/AR + RTL), `store` (mock state contract), `seed` (typed data).

## Conventions

- Style only via the shared Tailwind preset (`@dzrent/tokens`) and the shared
  `StatusBadge` — no per-feature colors.
- All copy lives in `@dzrent/i18n` with both `fr` and `ar`.
- RTL is a true mirror: logical properties + `.dz-flip`, verified by toggling FR↔AR.

The current screen state and what to build next are tracked in
[../../docs/ROADMAP.md](../../docs/ROADMAP.md) (Phase 1).
