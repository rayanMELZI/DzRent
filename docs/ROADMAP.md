# Roadmap

The plan from the current foundation to a usable MVP and a launchable product. Each
phase has a goal, concrete tasks, and an acceptance bar. Pick up at the first
unchecked box in the current phase — the work is sequenced so you can stop and resume
at any point.

Legend: `[x]` done · `[ ]` to do · 🎯 acceptance criteria.

---

## Phase 0 — Foundation ✅ (complete)

Goal: a professional monorepo where every surface installs, typechecks and builds.

- [x] pnpm + Turborepo monorepo, shared tsconfig/prettier/eslint, `.editorconfig`
- [x] Backend imported into `apps/backend`, compiles against the **real** Prisma client
- [x] Shared packages: `@dzrent/tokens` (+ Tailwind preset), `@dzrent/i18n` (FR/AR),
      `@dzrent/types` (domain + state contract)
- [x] Agency dashboard scaffolded: Next.js App Router, Tailwind preset wired, FR/AR +
      RTL provider, mock store mirroring the state contract, dashboard shell, DashHome
- [x] GitHub Actions CI (quality job + backend integration tests)
- [x] Root documentation (README, ARCHITECTURE, ROADMAP, CONTRIBUTING) + design handoff

🎯 `pnpm install && pnpm typecheck && pnpm build` is green. **Met.**

---

## Phase 1 — Agency dashboard MVP 🔄 (in progress)

Goal: the agency can do its real daily job against seed data, then against the API.
The agency side is where trust lives, so it ships first.

> **Status:** all seven screens are built and styled against the typed store, and
> phone-OTP authentication is wired to the live backend (login → JWT → protected
> dashboard, with token refresh + logout). What remains in this phase is replacing
> the seed-data reads with live API calls per screen (1.6).

### 1.1 Requests queue — _the heart of agency trust_ (`/requests`)
- [ ] Tabs: En attente / Approuvées / Refusées with live counts
- [ ] Request list (avatar, name, car, time, `Nouvelle` tag, ⚠ flag)
- [ ] Detail panel: customer header, two trust checks (blacklist presence, risk-signal
      count), expanded risk flags, inline KYC snapshot (4 docs + per-doc StatusBadge)
- [ ] Booking period with **total and deposit shown separately** (deposit quarantined)
- [ ] Approve / Refuse action bar → `setRequestStatus` + toast
- 🎯 Approving a request updates the queue and is the same call the client surface will
      observe live (state contract §8).

### 1.2 Fleet (`/fleet`)
- [ ] Status filter chips with counts (Disponible / Louée / Maintenance / Hors service /
      Inspection) + grid/list toggle + "Ajouter un véhicule"
- [ ] Vehicle card: plate (mono), two ComplianceDots (assurance, visite) by days-to-expiry
- [ ] Add/edit vehicle form (compliance gate for AVAILABLE)

### 1.3 Blacklist (`/blacklist`)
- [ ] Shared inter-agency list with search
- [ ] "Signaler un client" modal (name, phone, reason + severity)
- [ ] Rows with severity-colored reason pill (blacklist token, distinct from refused)

### 1.4 GPS fleet map (`/map`)
- [ ] Dark dispatch canvas, dashed geofence, vehicle pins by state (ok / speeding / out)
- [ ] Side panel: active/alert counts + per-vehicle live speed & violation labels

### 1.5 Revenue (`/revenue`) & Staff (`/staff`)
- [ ] Revenue: period chips, 3 KPI cards, monthly bar trend, revenue-by-category
- [ ] Staff: member cards with role, OWNER tag, permission chips

### 1.6 Wire to the backend
- [x] Auth: phone OTP login against `@dzrent/backend`, token storage + refresh
- [x] Gate the dashboard behind a session; wire topbar + logout to the live user
- [ ] Replace `lib/seed.ts` reads with API calls (typed via `@dzrent/types`)
- [ ] Server-state layer (TanStack Query) + error/loading states
- [ ] Seed/onboard agency + vehicle + booking data so fleet/requests show live records

🎯 An agency owner logs in with a phone number, sees real pending requests, reviews a
customer's KYC, approves a booking, and manages their fleet — end to end.

---

## Phase 2 — Backend made real

Goal: move the backend from "compiles" to "runs the golden path in a real environment".

- [x] Run `docker compose up`, `prisma migrate deploy`, the manual PostGIS migration, `db seed`
      (baseline migration `0_init` committed; database seeded and API verified live)
- [ ] e2e the golden path: request-otp → verify → KYC upload+approve → agency create+verify
      → vehicle create+docs+insurance → search → book → pay (mock) → sign → pickup → return
- [ ] Build the two known-missing modules: **DamageReport** and **Review** (schema exists,
      HTTP layer doesn't)
- [ ] Hardening: enable RLS (`prisma/migrations/manual/enable_rls.sql`) + per-request
      `app.current_agency_id`, embed the Amiri font for Arabic PDFs, wire real SATIM
      credentials behind the existing gateway factory
- 🎯 The full booking pipeline runs against Postgres/Redis/MinIO with Swagger at `/api/docs`.

See [PROJECT_STATUS.md](../apps/backend/PROJECT_STATUS.md) for the authoritative list.

---

## Phase 3 — Client PWA (`apps/client-pwa`)

Goal: the mobile funnel, installable and tolerant of unstable data.

- [ ] Scaffold `apps/client-pwa` (Next.js PWA, port 3002) reusing the shared packages
- [ ] Extract reusable primitives into a new `@dzrent/ui` package (Button, Chip,
      StatusBadge, DepositBox, PriceBreakdown, DocUpload, WilayaPicker)
- [ ] Screens (design handoff §9.A): OTP phone → OTP code → KYC → Home/search →
      **agency-first** results → agency page → car detail → checkout → contract +
      e-signature → payment → confirmation/active → trips/docs/profile
- [ ] PWA: installable, offline-tolerant, ≥44px touch targets, self-hosted fonts
- 🎯 A client completes a booking on a phone; it appears in the agency queue; agency
      approval flips the client to an active rental.

---

## Phase 4 — Realtime & integration

- [ ] Promote the client↔agency bridge from in-memory to WebSocket/SSE (same contract)
- [ ] Push notifications (FCM/APNs via the PWA service worker), SMS already covered
- [ ] Shared API client package consumed by both surfaces

---

## Phase 5 — Launch readiness

- [ ] Observability: structured logging shipper, metrics, tracing, alerting
- [ ] Load & soak testing (GPS ingest target ~1 ping/30s/vehicle); GPS table partitioning
- [ ] Backup automation scheduling; deployment (separate hosts/ports per app) + IaC
- [ ] SATIM bank certification; legal review of the e-signature under Algerian law 15-04
- 🎯 Production deployment with monitoring, backups, and certified payments.

---

## Immediate next 3 tasks

1. **Data binding (1.6):** add a TanStack Query layer and replace `lib/seed.ts`
   reads with authenticated API calls, starting with the requests queue.
2. **Agency onboarding data:** wire the flow (or a seed script) to create an agency
   + vehicles + bookings so fleet/requests render live backend records.
3. **DamageReport & Review modules (Phase 2):** the schema exists; add their HTTP
   layer so the dashboard's trust/feedback surfaces have endpoints to call.
