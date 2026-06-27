# DzRent — Production Readiness Status

Honest accounting of what is built vs. what remains before real-world launch.

## ✅ Complete & compiling (Sprints 1–5)

- **Auth/Users** — phone OTP, JWT access+refresh rotation, lockouts, profile, admin list.
- **KYC** — versioned uploads via presigned S3, admin review queue, CIN→nationalIdNumber with duplicate detection, booking-eligibility gate.
- **Agencies** — onboarding with role promotion, verification documents, admin verify, staff management with StaffRole.
- **Vehicles** — full CRUD, versioned photos & compliance documents, the insurance+visite+GPS gate for AVAILABLE status, client search excluding booked/non-compliant vehicles.
- **Pricing** — vehicle→wilaya rate resolution, monthly/weekly/daily tiering, per-day options, TVA 19%.
- **Bookings** — 5 eligibility gates, Serializable overlap-safe creation, advisory-locked human refs, full state machine, Algerian late-return penalties, policy-snapshot cancellations.
- **Contracts** — clause assembly (mandatory + wilaya-scoped), PDF generation, HMAC e-signature with agency countersignature.
- **Payments** — gateway abstraction, deposit pre-auth lifecycle, cash with AML cap, gap-free per-agency invoicing.
- **Blacklist** — cross-agency federation with admin oversight.
- **GPS** — HMAC-authenticated batch ingestion, geofencing + speeding flags, deduplicated alerts, history.
- **Admin/Health** — config management, fraud resolution, stats, dependency checks.
- **Infra** — docker-compose (postgres/postgis, redis, minio), multi-stage Dockerfile, GitHub Actions CI, manual SQL migrations for PostGIS + RLS.

## ⚠️ Built but needs real-world work before launch

| Area | What exists | What's needed |
|---|---|---|
| **SATIM payments** | Documented register.do/confirm.do/deposit/reverse/refund flow; factory falls back to Mock | Bank merchant onboarding, terminal credentials, SATIM certification, sandbox testing |
| **Arabic contracts** | French clauses + Arabic titles in the PDF | Embed Amiri TTF in `assets/fonts/`, add arabic-reshaper + bidi shaping pass |
| **Multi-tenant RLS** | Policies written (`enable_rls.sql`), ALS context plumbing in place | Enable policies, set `app.current_agency_id` per request via Prisma middleware, session-mode pool for RLS connections |
| **E-signature** | HMAC-SHA256 proof-of-event (contractRef+userId+timestamp) | Legal review under Algerian law 15-04 for certified electronic signature weight |
| **GPS at scale** | Table + indexes + computed PostGIS column | Enable pg_partman monthly partitioning or TimescaleDB hypertable before high volume |

## ❌ Not started (operational follow-ups)

- Load & soak testing (target: GPS ingest ~1 ping/30s/vehicle).
- GPS hardware device provisioning & homologation workflow.
- Push notifications (FCM/APNs) — SMS-only today.
- Ooredoo/Mobilis SMS fallback providers (Twilio-only today; factory ready for it).
- Damage-report endpoints (schema + enums exist; controller/service not yet built).
- Reviews & ratings endpoints (schema exists; controller/service not yet built).
- Observability (structured logging shipper, metrics, tracing, alerting).
- Backup automation execution (script provided in DATABASE_SETUP.md; needs scheduling).

## Known scope notes

- `DamageReport` and `Review` models are in the locked schema and referenced by relations, but their HTTP modules are not yet implemented — they were outside the core booking pipeline. They're the most natural next modules to add.
- The pricing options engine reads `option_*_per_day_da` keys from PlatformConfig; verify these exist in your seed (defaults are coded as fallbacks).
