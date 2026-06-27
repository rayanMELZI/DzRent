# Handoff: DzRent — Marketplace de location de voitures (Algérie)

> **Read this first.** The files in `prototype/` are **design references built in HTML/React-via-Babel** — a working, clickable prototype that demonstrates the intended look, flow, and behavior. They are **not production code to ship**. Your job is to **recreate these designs in a real codebase** using its established stack and patterns. If no codebase exists yet, pick an appropriate stack (recommendation below) and implement faithfully.

---

## 1. Overview

DzRent is a **car-rental marketplace for Algeria**, delivered as **two surfaces that form one product family**:

1. **Client PWA** — mobile-first (Android mid-range, unstable data). A private individual rents a car from local rental **agencies**.
2. **Agency Dashboard** — desktop-first SaaS. The agency manager + staff manage fleet, bookings, contracts, customer KYC, and fraud signals.

**Trust is the core of the product, and it lives mostly on the agency side**: the agency verifies the customer (KYC), approves bookings, monitors compliance (insurance, technical inspection), and feeds a shared inter-agency blacklist. The client *reads* the result of that trust (verified-agency badges, document status, deposit clarity).

The prototype proves the **happy path of both surfaces and a live state bridge between them**: a client booking appears in real time as a new request in the agency queue; agency approval flips the client to an active rental.

---

## 2. Fidelity

**High-fidelity (hifi).** Final colors, typography, spacing, status vocabulary, copy (FR + AR), and interactions are all decided and present. Recreate the UI **pixel-accurately** using the target codebase's component library, but honor the exact tokens in §6 and the hard rules in §3. Imagery uses **striped placeholders with mono labels** (e.g. `photo · Dacia Logan`) — replace with real photography; keep the labeled-slot pattern until assets arrive.

---

## 3. HARD RULES (do not break)

These encode product decisions that earlier attempts got wrong. Treat them as acceptance criteria.

### 3.1 Search is AGENCY-FIRST, never car-first
- The primary unit of navigation is the **agency**, never an isolated car.
- Flow: client picks **wilaya + dates** → sees a **list of AGENCIES** (verified, rated, commune/distance, # cars available) → taps an agency → sees **that agency's cars**.
- A **model/category filter** is available. Filtering by a model returns **the AGENCIES that offer that model** — still a list of agencies, not a flat car list. You enter an agency to see its cars.
- **Never** render a global car catalogue disconnected from agencies. (This was the #1 prior mistake.)

### 3.2 Bilingual, two-directional — TRUE layout mirror
- **French (LTR, primary)** and **Arabic (RTL)**. RTL is a **real layout mirror**, not just text alignment: nav/sidebar move to the right, chevrons flip, money/progress run right-to-left.
- Implemented via `dir="rtl"` on the surface root + **CSS logical properties** (`margin-inline-start`, `inset-inline-start`, `border-inline-start`, `padding-inline`, etc.). Directional glyphs get a `.dz-flip { transform: scaleX(-1) }` under `[dir="rtl"]`.
- Typography must support Arabic natively (see §6 — IBM Plex Sans Arabic shares metrics with Plex Sans, so a flipped screen keeps the same voice).

### 3.3 Money is always DZD, and the DEPOSIT is visually quarantined
- All amounts in **DZD**, formatted `Intl.NumberFormat('fr-FR')` → space thousands separator: `25 000 DZD`.
- **Amounts to pay**: solid, dark; the final total sits on a filled `#0F5249` banner.
- **The refundable deposit (caution)** is visually "quarantined": **dashed border** `#7D97A3`, cold blue-slate fill `#F1F5F6`, text `#33505C`, a **return arrow ↩**, and a `Remboursable` tag. It is **NEVER** summed into or colored like the spent total. People confuse it — the UI must not.

### 3.4 Identity is by phone (OTP), not email
- Entry point is the **phone OTP screen**. No email, no password anywhere.

### 3.5 One shared STATUS vocabulary everywhere
- The same status badge system is reused across KYC docs, vehicle papers, bookings, and fraud. Exact tokens in §6.4. Don't invent per-feature status styles.

---

## 4. Recommended stack & architecture

The prototype is React (UMD + Babel, split into `window`-exported modules). For production:

- **Client PWA**: React + Vite PWA (or Next.js), installable, offline-tolerant. Mobile-first, generous touch targets **≥ 44px**, low visual weight, nothing that assumes a fast connection.
- **Agency Dashboard**: React + Vite/Next, desktop-first. Sidebar `#0F5249`, content on `#F6F3EC`.
- **Shared**: a design-token package (§6), an i18n layer (FR/AR with `dir`), a shared status-badge component, and the domain types (§7).
- **i18n**: the prototype uses a flat `STR[key][lang]` dictionary (`prototype/src/i18n.jsx`) — port these strings verbatim into your i18n framework (i18next, etc.). Both FR and AR copy are already written.
- **Backend (not in prototype)**: phone OTP auth, KYC document storage + review, bookings, agency/fleet CRUD, the inter-agency blacklist, GPS telemetry ingestion, payments (CIB / Edahabia / cash-on-pickup). The prototype fakes these with in-memory React state — see §8 for the exact state contract the UI expects.

### Source file map (`prototype/src/`)
| File | Contains |
|---|---|
| `tokens.jsx` | Global stylesheet inject + `T` token object (colors, type, radii, shadows, animations) |
| `data.jsx` | Seed data: wilayas-by-region, categories, cars, features, agencies, KYC doc types, blacklist reasons, seed requests |
| `i18n.jsx` | `STR` bilingual dictionary, `fmtDZD()`, `LangContext`/`useLang` |
| `store.jsx` | `StoreProvider`/`useStore` — the shared client↔agency state bridge |
| `ui.jsx` | Primitives: Icon set, Button, Chip, StatusBadge, VerifiedBadge, Stars, Placeholder, Toast, PhoneFrame, BrowserFrame |
| `ui2.jsx` | Composite widgets: Sheet, Field, **PriceBreakdown**, **DepositBox**, **DocUpload**, **WilayaPicker** |
| `client.jsx` | Client shell + nav, OTP phone, OTP code, KYC flow |
| `client-search.jsx` | HomeSearch, **ResultsAgencies** (agency-first), AgencyPage, AgencyCard, CarCard |
| `client-detail.jsx` | CarDetail, Checkout, Contract (+ signature pad), payment handoff |
| `client-confirm.jsx` | Payment, Confirmation (pending/active/refused), Trips, Docs, Profile |
| `agency.jsx` | Dashboard shell (sidebar+topbar), DashHome (KPIs), FleetScreen |
| `agency2.jsx` | **RequestsQueue** (KYC snapshot + approve/refuse), Blacklist |
| `agency3.jsx` | FleetMap (GPS dispatch), Revenue, Staff |
| `app.jsx` | Root shell: language+RTL provider, surface switcher, fit-to-viewport scaling |

---

## 5. Brand personality

- **Trust before flash.** Renting a stranger's car in a market with real fraud/theft risk: every screen must *feel* safe — verified badges, clear document status, visible deposit terms, zero dark patterns.
- **Modern but not generic.** Avoid the teal/violet ride-hailing gradient cliché. Distinctly Algerian — confident, warm, a little local — **without literal flag-color cliché**. The chosen direction is "Sahel": deep green-teal trust color on warm sand.
- **Calm in the face of complexity.** KYC, contracts, deposits, insurance are bureaucratic by nature; the UI must make them feel like 3 simple steps, not a trip to the administration.
- Reference tone: Yassir/Careem simplicity (client) × fleet-ops/logistics tool (agency). No decorative emoji. No aggressive gradients.

---

## 6. Design tokens

All tokens live in `prototype/src/tokens.jsx` as the `T` object and a global `<style id="dz-tokens">`.

### 6.1 Brand & surface colors
| Token | Hex | Use |
|---|---|---|
| `primary` | `#0F5249` | Trust green-teal — primary actions, sidebar, total banner |
| `primaryDeep` | `#0B3F38` | Pressed/dark green |
| `primarySoft` | `#E2ECEA` | Soft green chips/fills |
| `clay` | `#C0613A` | Terracotta accent — secondary CTAs, attention points, "new" tags |
| `claySoft` | `#F2E1D8` | Soft clay fill |
| `sand` | `#F6F3EC` | **Screen background** |
| `canvas` | `#E7E4DD` | Warm-gray canvas/showcase background |
| `paper` | `#FFFFFF` | Cards |

### 6.2 Text & borders
| Token | Hex |
|---|---|
| `ink` (primary text) | `#1D2421` |
| `ink2` | `#4A5048` |
| `ink3` | `#6B7069` |
| `ink4` | `#8A8F88` |
| `ink5` | `#9AA09A` |
| `line` | `#E6E1D6` |
| `line2` | `#DDD7CA` |
| `line3` | `#EFECE0` |

### 6.3 Deposit (money quarantine)
| Token | Hex |
|---|---|
| `depositBg` | `#F1F5F6` (cold blue-slate fill) |
| `depositInk` | `#33505C` |
| `depositLine` | `#7D97A3` (dashed border) |

### 6.4 Status vocabulary (reused everywhere)
Each status = `{ ink, bg, dot }` (text color, fill, status dot). `expiring` additionally uses a `border`.
| Status | ink | bg | dot / border | Used for |
|---|---|---|---|---|
| **approved / verified** | `#1F6B41` | `#E4F3EA` | dot `#2F8F5B` | KYC ok, car available, booking confirmed |
| **pending / in review** | `#8A5A12` | `#FBEED3` | dot `#D99316` | KYC in review, booking pending, car rented |
| **refused** | `#9C352B` | `#F8E3E1` | dot `#C0392B` | KYC rejected, booking refused, car out of service |
| **expiring soon** | `#9A6516` | `#FFFFFF` | border `#E0A94E` | insurance / technical inspection expiry |
| **not submitted** | `#6B7069` | `#EEECE5` | dot `#9AA09A` | KYC not uploaded, inspection-pending |
| **blacklist / fraud** | `#7A1F17` | `#F4D3CE` | dot `#7A1F17` | inter-agency blacklist. Darker & distinct from "refused". Serious, not punitive. |

Badge component: pill, `gap:6`, dot 7px, `font-weight:600`. See `StatusBadge` in `ui.jsx`. Status labels are localized via `STR.st_*`.

### 6.5 Typography — IBM Plex superfamily
- **IBM Plex Sans** (Latin) + **IBM Plex Sans Arabic** (Arabic) — same rhythm/proportions, so an RTL-flipped screen keeps the same voice.
- **IBM Plex Mono** for codes, plates, IDs, table amounts.
- Google Fonts import: `IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500`
- `[dir="rtl"]` switches the base family to Plex Sans Arabic.

Scale (class → size/weight):
| Class | Size | Weight | Notes |
|---|---|---|---|
| `.dz-display` | 38px | 700 | -0.02em tracking |
| `.dz-h1` | 24px | 600 | |
| `.dz-h2` | 19px | 600 | |
| `.dz-h3` | 16px | 600 | |
| `.dz-body` | 15px | 400 | 1.5 line-height |
| `.dz-sm` | 13px | 400 | |
| `.dz-xs` | 11.5px | 400 | |
| `.dz-label` | 11px | 600 | uppercase, 0.04em tracking |
| `.dz-mono` | — | — | IBM Plex Mono, tabular numerals |

**Minimum sizes**: mobile body text ≥ 13px; touch targets ≥ 44px.

### 6.6 Radii, shadows, motion
- Radii: `r1 8px · r2 12px · r3 16px · r4 22px`.
- `shadow`: `0 1px 2px rgba(29,36,33,.04), 0 6px 20px rgba(29,36,33,.06)`
- `shadowCard`: `0 1px 3px rgba(29,36,33,.05), 0 10px 30px rgba(29,36,33,.08)`
- `shadowUp` (bottom sticky bars): `0 -2px 16px rgba(29,36,33,.08)`
- Motion: entrance = translate-only (`dz-enter`, 0.34s) and scale-in (`dz-pop`, 0.24s) — **never gate visibility on opacity** (so print/reduced-motion always show content). Pulse `dz-pulse` for live/alert dots. All disabled under `prefers-reduced-motion`.

### 6.7 Verified-agency badge
A `✓` in a `#0F5249` circle next to the agency name. **Granted only after RC/NIF verification** — it is the agency's trust currency, not decoration. Component: `VerifiedBadge` in `ui.jsx`.

---

## 7. Domain data model

Full seed in `prototype/src/data.jsx`. Shapes the UI depends on:

```ts
Wilaya   = { code: string /* "16" */, fr: string, ar: string }   // grouped under Regions
Region   = { id, fr, ar, wilayas: Wilaya[] }
// Regions: Nord Centre, Nord Est, Nord Ouest, Hauts Plateaux, Grand Sud (58 wilayas total)

Category = { id: 'citadine'|'berline'|'suv'|'utilitaire'|'minivan'|'prestige', fr, ar }

Car = {
  id, fr, ar, cat: Category.id, year, seats,
  trans: 'man'|'auto', fuel: 'diesel'|'essence',
  price: number /* DZD/day */, deposit: number /* refundable DZD */
}

Agency = {
  id, fr, ar,
  verified: boolean, verifiedOn: string|null,
  rating: number, reviews: number,
  commune: {fr,ar}, distanceKm: number,
  responseTime: {fr,ar} /* "Répond < 1h" */, completed: number /* lifetime rentals */,
  cars: Car.id[]   // <-- agency offers these cars
}

KycDoc = { id: 'cin'|'permis'|'selfie'|'domicile', fr, ar, why: {fr,ar} }
KycStatus = 'approved'|'pending'|'refused'|'none'   // per document

BlacklistReason = { id: 'non_return'|'doc_fraud'|'payment'|'damage', fr, ar, sev: 'high'|'mid' }
BlacklistEntry  = { id, initials, name, phone, reason: BlacklistReason.id, addedBy, date, wilaya }

Request = {           // a booking request, shared across both surfaces
  id, status: 'pending'|'approved'|'refused', createdAt, justNow?, flagged?,
  customer: {
    name, phone, initials, joined, rentals,
    kyc: { cin, permis, selfie, domicile },   // each a KycStatus
    blacklisted: boolean,
    riskFlags: {fr,ar}[]                       // e.g. "Selfie ne correspond pas à la CIN"
  },
  car: Car.id, agency: Agency.id,
  from, to, days, total: number, deposit: number, payMethod?
}
```

**Price math** (`PriceBreakdown` / `computeTotals`): `subtotal = price*days + addons`; `insurance = 800*days`; `tva = round(subtotal*0.19)`; `total = subtotal + tva + insurance`. **Deposit is separate and never added to total.**

Add-ons (DZD): child seat 1500, portable GPS 1000, additional driver 2500, excess buyback (CDW) 4000.

---

## 8. State contract — the live client↔agency bridge

`store.jsx` is the spine the UI expects. In production this becomes API + realtime (websocket/SSE), but the **contract is the same**:

- `requests: Request[]` — starts with 3 seed requests (one flagged with risk signals, one already approved).
- `addRequest(payload) → id` — **client checkout calls this** on payment. Creates a `pending` request with `justNow:true`, prepends it to the queue. → The agency "Demandes" badge increments live.
- `setRequestStatus(id, 'approved'|'refused')` — **agency approve/refuse calls this**. → The client's Confirmation screen, reading the same request by id, **flips live**: `pending` → waiting screen, `approved` → **active rental** (countdown, pickup code, deposit box), `refused` → refused screen (no money debited).
- `blacklist: BlacklistEntry[]`, `addBlacklist(entry)` — shared inter-agency list.
- `showToast(msg, 'ok'|'err')`, `pendingCount`.

**Acceptance test (verified in prototype):** complete a client booking → agency queue badge 2→3, new request shows a `Nouvelle` tag → open it agency-side, KYC snapshot + risk checks visible → Approve → client screen becomes "Location active". This loop must work in production.

---

## 9. Screens

### 9.A Client PWA (mobile, ~366px screen inside a phone frame; bottom tab nav on main screens)

1. **OTP — phone** (`OtpPhone`). Entry point. Secured-connection badge, `+213` prefix + tel input, "Recevoir le code". Terms line. Content top-aligned (~13% from top).
2. **OTP — code** (`OtpCode`). 6 separate digit boxes (LTR even in AR), auto-advance, resend link. Auto-proceeds when full.
3. **KYC flow** (`KycFlow`). Green header with progress bars (one per doc). Four `DocUpload` cards: **CIN, permis, selfie (liveness), justificatif de domicile**. Each card shows the doc name, a "Pourquoi ?" expander explaining *why it's required*, a per-doc StatusBadge, and Camera/Upload buttons (→ re-submit state when captured). Sticky footer: "Plus tard" + "Soumettre pour vérification". Note that docs go to agency review.
4. **Home / search** (`HomeSearch`). Green hero + tagline. Search card: **WilayaPicker** (opens a bottom Sheet with quick search, grouped by region), date range (Départ/Retour), category chips (Toutes + 6 categories). CTA "Voir les agences". Trust strip (420+ agences vérifiées, 3 100 voitures).
5. **Results = AGENCY LIST** (`ResultsAgencies`). Header with count + wilaya. Filter row: **model filter** (opens Sheet, returns agencies) + category chips. List of `AgencyCard`: storefront placeholder, name + VerifiedBadge, stars + reviews + lifetime rentals, commune + distance, "N voitures dispo" pill, "Répond < Xh" in clay. Sorted verified-first then rating. **Filtering by model still yields agencies.**
6. **Agency page** (`AgencyPage`). Storefront header, identity (name + VerifiedBadge), rating/reviews/commune, a green "Vérifiée le … · N locations" trust bar. Then **"Ses voitures"** with category chips (only categories this agency has) and `CarCard`s.
7. **Car detail** (`CarDetail`). Photo carousel placeholder, name/category/year, available badge, 4-up specs (seats/transmission/fuel/year), feature chips, **agency snippet** (tappable, with VerifiedBadge + response time), reviews. Sticky footer: price/day + deposit hint + "Réserver".
8. **Checkout** (`Checkout`). Car mini, rental period, **add-on toggles** (with prices), then **`PriceBreakdown`**: subtotal·price×days, add-ons, insurance, TVA(19%) in a card → **total on green banner** → **`DepositBox` (dashed cold quarantine)**. Sticky "Continuer vers le contrat".
9. **Contract + e-signature** (`Contract`). Bilingual legal doc with contract id (mono), numbered clauses, **canvas signature pad** (draw, clear), agree checkbox. "Valider et payer" disabled until signed + agreed.
10. **Payment** (`Payment`). Three parallel methods — **Carte CIB**, **Carte Edahabia**, **Paiement à la prise (cash)** — do not bias toward card. Card form appears for card methods. Deposit-hold note (dashed). Footer total + pay/confirm. On submit → `addRequest` → confirmation.
11. **Confirmation / active** (`Confirmation`). Reads its request by id and renders live:
    - **pending**: "Demande envoyée à l'agence", a 3-step Timeline, "En attente de l'agence" pulse, booking summary, hint to switch to the Agency surface.
    - **approved → `ActiveRental`**: "Location active" + "Approuvée par {agency}", **countdown**, vehicle status ("Votre véhicule" / "En cours d'utilisation" — **NO live GPS map for the client**, just trip status), pickup commune + **pickup code** (mono), **`DepositBox`**.
    - **refused → `RefusedBooking`**: clear "no amount debited" message.
12. **Trips / Docs / Profile** (`TripsScreen`, `DocsScreen`, `ProfileScreen`). Trip cards with status, saved KYC documents with StatusBadges, profile with phone identity + settings rows.

### 9.B Agency Dashboard (desktop; `#0F5249` sidebar, content on sand; topbar with search + notification + avatar)

1. **Dashboard home** (`DashHome`). 4 KPI cards: **locations actives** (/fleet), **revenu du mois** (DZD, +trend), **utilisation flotte** (% with bar), **demandes en attente** (clickable → queue). Two panels: **Dernières demandes** (live list, flagged ones marked) and **Alertes de conformité** (insurance/technical-inspection expiries, sorted by urgency, red ≤10j / amber ≤30j).
2. **Fleet** (`FleetScreen`). Status filter chips with counts + grid/list toggle + "Ajouter un véhicule". Status set: **Disponible / Louée / Maintenance / Hors service / Inspection** (mapped to the shared status colors). Each vehicle shows plate (mono) + two **ComplianceDot**s (assurance, visite) colored by days-to-expiry.
3. **Requests queue** (`RequestsQueue`) — **the heart of agency trust**. Left: tabs (En attente / Approuvées / Refusées with counts) + request list (avatar, name, car, time, `Nouvelle` tag, ⚠ flag). Right: **request detail** with customer header (rentals, member-since), two trust checks (**blacklist presence**, **risk-signal count**), expanded **risk flags** if any, the **inline KYC snapshot** (4 doc thumbnails + per-doc StatusBadge), booking period with **total and deposit shown separately**, and an **Approuver / Refuser** action bar (pending only). Actions call `setRequestStatus` → client flips live + toast.
4. **Blacklist** (`Blacklist`). Inter-agency shared list. Search, "Signaler un client" modal (name, phone, reason with severity). Rows: avatar, name+phone, reason pill (severity-colored, **blacklist token, distinct from refused**), "Signalé par {agency} · date · wilaya". Serious/legal tone, not punitive clutter.
5. **GPS fleet map** (`FleetMap`) — **the only screen that should look like a dispatch/ops tool**. Dark map canvas, road lines, a dashed **geofence** boundary, vehicle **pins** (plate label) colored by state: ok / **excès de vitesse** (clay) / **hors geofence** (red), with pulsing halos on violations. Side panel: active/alert counts + per-vehicle list with live speed and violation labels.
6. **Revenue** (`RevenueScreen`). Period chips, 3 KPI cards, monthly bar trend (last month in clay), revenue-by-category bars.
7. **Staff & permissions** (`StaffScreen`). Member cards with role, OWNER tag, and permission chips.

---

## 10. RTL mirror rules (documented for ≥3 components)

Implement RTL with `dir` + logical properties, not hardcoded left/right. Verified-correct examples in the prototype:

1. **Agency sidebar / dashboard shell** (`agency.jsx`): in RTL the entire grid flips — sidebar renders on the **right**, topbar title right-aligned, search/avatar on the left. Achieved by `dir="rtl"` on the surface root + flex order following document direction (no absolute left/right).
2. **Status badge & list rows** (`StatusBadge`, request/fleet/blacklist rows): use `gap` + logical padding so the dot leads on the correct side; notification badges use `inset-inline-end`.
3. **Deposit box & price breakdown** (`DepositBox`, `PriceBreakdown`): the return-arrow glyph carries `.dz-flip`; amounts use `dir` on the number line so DZD reads right-to-left in AR; the vertical divider between total and deposit uses `border-inline-start` + `padding-inline-start`.
4. **Back chevrons / "next" arrows** everywhere: wrapped in `.dz-flip` so they point the correct way.
5. **Phone status bar** (`PhoneFrame`): time and battery swap sides via flex in document direction; numerals render as Arabic-Indic in AR (`٩:٤١`).

**Acceptance:** toggling FR↔AR must move the whole layout, not merely re-align text. Test on the Requests queue and Checkout specifically — these are the busiest layouts.

---

## 11. Assets

- **No real imagery in the prototype.** All photos/logos are `Placeholder` components: subtly striped backgrounds with a mono label (`photo · Dacia Logan`, `devanture · Sahara Auto Location`, `scan · cin`). Replace with real photography; keep the labeled empty-slot pattern for any not-yet-supplied image.
- **Icons**: a small hand-rolled inline SVG set (`ICONS` in `ui.jsx`) — replace with your icon library (Lucide/Phosphor are close in weight: 1.7px stroke, round caps).
- **Fonts**: IBM Plex Sans / Sans Arabic / Mono via Google Fonts (self-host for the PWA).
- **No brand logo asset** — wordmark is set in Plex Sans 700; the "D" mark is a simple rounded square. Replace with a real logo when available.

---

## 12. Files in this bundle

```
design_handoff_dzrent/
├── README.md                      ← this file (self-sufficient spec)
└── prototype/
    ├── DzRent Prototype.html      ← open in a browser to explore the live prototype
    └── src/                       ← documented React modules (see §4 file map)
```

**To run the prototype:** open `prototype/DzRent Prototype.html` in a browser (it loads React + Babel from CDN). Use the top bar to switch **Côte à côte / Client / Agence** and **FR / العربية**. Walk the client funnel, complete a booking, switch to Agence, approve the new request, switch back — the client goes active.

Treat the HTML as the source of truth for visual detail; treat this README as the source of truth for rules, tokens, and the state contract.
