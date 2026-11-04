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

> **Status:** all seven screens are built and styled, and phone-OTP authentication is
> wired to the live backend (login → JWT → protected dashboard, with token refresh +
> logout). The **requests queue is now fully live** against the API (TanStack Query +
> `/bookings/agency/requests` aggregation endpoint + dev seed). What remains in this
> phase is wiring the other screens the same way (1.6).

### 1.1 Requests queue — _the heart of agency trust_ (`/requests`) ✅ (live)

- [x] Tabs: En attente / Approuvées / Refusées with live counts (server-side `counts`)
- [x] Request list (avatar, name, car, time, `Nouvelle` tag, ⚠ flag)
- [x] Detail panel: customer header, two trust checks (blacklist presence, risk-signal
      count), expanded risk flags, inline KYC snapshot (4 docs + per-doc StatusBadge)
- [x] Booking period with **total and deposit shown separately** (deposit quarantined)
- [x] Approve / Refuse action bar → `POST /bookings/:id/approve|reject` + toast
- 🎯 Approving a request updates the queue and is the same call the client surface will
  observe live (state contract §8). **Verified e2e** (OTP login → queue → approve →
  status flips to AWAITING_PAYMENT, counts update).

### 1.2 Fleet (`/fleet`) ✅ (live)

- [x] Status filter chips with counts + grid/list toggle, live against `GET /vehicles`
- [x] Vehicle card: plate (mono), two ComplianceDots from **real** insurance/visite expiries
- [x] Add-vehicle form (`POST /vehicles`; new vehicles start PENDING_INSPECTION per the
      compliance gate) + per-vehicle status menu (`POST /vehicles/:id/status`)
- [ ] Edit-vehicle form + photo/document uploads (endpoints exist; UI remains)

### 1.3 Blacklist (`/blacklist`) ✅ (live, strict-rating model)

- [x] Federation view grouped per person: **distinct-agency count badge** (1 agence vs
      N agences), expandable per-report justifications (`GET /blacklist/visible`)
- [x] "Signaler un client" modal wired to `POST /blacklist` — registered phone +
      **mandatory written justification** (anti-abuse)
- [x] Severity-colored reason pills (full backend reason vocabulary)

### 1.4 GPS fleet map (`/map`) — deprioritised by product owner

- [ ] Real map (Leaflet/OSM) + live tracker positions from GPS ingest data
- [ ] Side panel: active/alert counts + per-vehicle live speed & violation labels

### 1.5 Revenue (`/revenue`) & Staff (`/staff`) ✅ (live)

- [x] Revenue live: rolling w/m/y KPI windows with previous-window trend, real
      12-month bar trend + by-category breakdown (`GET /bookings/agency/revenue`)
- [x] Staff live: owner card (session), member cards with role + OTP-pending badge,
      add-member by phone (`POST /agencies/:id/staff`), owner-only removal

### 1.6 Wire to the backend

- [x] Auth: phone OTP login against `@dzrent/backend`, token storage + refresh
- [x] Gate the dashboard behind a session; wire topbar + logout to the live user
- [x] Server-state layer (TanStack Query) + error/loading states (provider + first hooks)
- [x] Seed/onboard agency + vehicle + booking data (`pnpm --filter @dzrent/backend db:seed:dev`
      — verified agency, 4 vehicles, 4 trust-profile clients, bookings in every queue state)
- [x] Requests queue live: `GET /bookings/agency/requests` (bookings + KYC snapshot +
      risk flags + blacklist presence in one round-trip) consumed via `lib/requests.ts`
- [x] Dashboard home + sidebar badge live (shared query cache reacts to decisions);
      compliance alerts computed from real expiry dates
- [x] Notification center: `GET /notifications/me` + `readAt` migration + topbar dropdown
      with unread badge (marks read on open)
- [ ] Replace the last mock screen: map (deprioritised — needs Leaflet/OSM + live
      tracker positions)

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

## Phase 3 — Client website (`apps/client-web`) → then PWA

Goal: the client funnel. Desktop web first; the installable mobile PWA follows on the
same API and components.

- [x] Public catalogue API (`/catalog`: wilayas, categories, agency-first search,
      agency page, car detail, quote) sharing one bookability rule with search/booking
- [x] Scaffold `apps/client-web` (Next.js, desktop-first, port 3004) on the shared packages
- [x] Home/search → **agency-first** results (category + model filters) → agency page →
      car detail with live quote, total banner and quarantined deposit
- [x] Phone-OTP sign-in (returns to the car), booking request, live status page
      (pending → approved / refused), trips list, cancel
- [x] KYC documents page (status per document, presigned upload)
- [x] FR/AR with true RTL mirror
- [x] Production image + compose service (`client`, :3006) + nginx vhost
- [ ] Public object-storage endpoint so browsers can PUT KYC files / load car photos
      (presigned URLs currently point at the internal `minio:9000` host)
- [ ] Contract + e-signature, payment (CIB / Edahabia / cash) screens
- [ ] Extract reusable primitives into a `@dzrent/ui` package (now duplicated in
      both apps: Button, Chip, StatusBadge, Field, Placeholder, Icon)
- [ ] Mobile PWA: installable, offline-tolerant, ≥44px touch targets, self-hosted fonts
- 🎯 A client completes a booking; it appears in the agency queue; agency approval flips
  the client's booking page live. ✅ (desktop, verified locally)

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

1. **DamageReport & Review modules (Phase 2):** the schema exists; add their HTTP
   layer so the dashboard's trust/feedback surfaces have endpoints to call.
2. **Golden-path e2e + unit tests (Phase 2):** the money/legal paths (bookings,
   payments, contracts, kyc) are still untested; gate them in CI.
3. **GPS map (1.4, when reprioritised):** Leaflet/OSM canvas fed by real tracker
   positions (`GpsTrackingLog` latest-per-vehicle endpoint).
