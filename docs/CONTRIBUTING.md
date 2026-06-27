# Contributing

Conventions that keep the codebase consistent and reviewable. Following them is how a
single developer today scales to a team later without rework.

## Environment

- **Node ≥ 20**, **pnpm ≥ 9**. Enable pnpm with `corepack enable` or `npm i -g pnpm`.
- Install once at the root: `pnpm install`. Never run `npm install` inside an app.
- VS Code users: install the recommended extensions (ESLint, Prettier, Prisma,
  Tailwind) — see `.vscode/extensions.json`.

## Branching

- `main` — always green (CI passes), always deployable.
- `develop` — integration branch (optional while solo; use it once more than one person).
- Feature branches off the integration branch: `feat/<area>-<short-desc>`, e.g.
  `feat/agency-requests-queue`, `fix/booking-cancel-status`.
- Never commit directly to `main` once the repo has a remote — open a PR.

## Commits — Conventional Commits

Format: `type(scope): subject` in the imperative mood.

```
feat(agency-dashboard): add requests queue with approve/refuse
fix(backend): annotate booking-status includes guard for real prisma client
chore(repo): set up pnpm + turborepo workspace
docs(roadmap): sequence phase 1 agency MVP
```

Types: `feat` · `fix` · `chore` · `docs` · `refactor` · `test` · `perf` · `build` · `ci`.
Scopes are usually the package: `backend`, `agency-dashboard`, `client-pwa`, `tokens`,
`i18n`, `types`, or `repo` for cross-cutting changes. Keep each commit focused — one
logical change.

## Before you push

```bash
pnpm format        # prettier write
pnpm lint          # eslint
pnpm typecheck     # tsc --noEmit across the workspace
pnpm build         # production build of every app
```

CI runs the same checks plus backend integration tests against Postgres + Redis. A red
CI never merges.

## Working in the monorepo

- Target one package: `pnpm --filter @dzrent/agency-dashboard <script>`.
- Add a dependency to one app: `pnpm --filter @dzrent/agency-dashboard add <pkg>`.
- Use a shared package from an app: add `"@dzrent/<name>": "workspace:*"` to its
  dependencies, then `pnpm install`.

## Adding a shared package

1. `packages/<name>/package.json` — name `@dzrent/<name>`, `"private": true`,
   `exports` pointing at `./src/index.ts` (internal packages ship raw TS).
2. `packages/<name>/tsconfig.json` extending `../../tsconfig.base.json`.
3. Add the package name to the consuming app's `transpilePackages` in `next.config.mjs`.

## Adding an agency-dashboard screen

1. Create `src/app/(dashboard)/<route>/page.tsx`.
2. Add the nav entry in `src/components/shell/Sidebar.tsx` (route + icon + i18n key).
3. New copy goes in `packages/i18n/src/strings.ts` **with both `fr` and `ar`** — never
   ship a key in one language.
4. Use the design tokens via Tailwind classes (`bg-primary`, `text-status-*-ink`,
   `rounded-r3`, `shadow-card`) and the shared `StatusBadge` — don't invent per-feature
   colors or status styles.
5. Honor RTL: logical properties (`ms-`, `me-`, `ps-`, `pe-`, `inset-inline-*`) and
   `.dz-flip` on directional glyphs. Verify by toggling FR↔AR — the layout must mirror.

## Hard product rules (acceptance criteria, not preferences)

These come from the design handoff and earlier mistakes. Treat them as non-negotiable:

1. **Search is agency-first, never car-first.** A model filter returns *agencies*, never
   a flat car catalogue.
2. **Bilingual, true RTL mirror.** Toggling Arabic moves the whole layout, not just text.
3. **The refundable deposit is visually quarantined** (dashed cold blue-slate) and is
   **never** summed into or colored like the spent total.
4. **Identity is phone OTP** — no email, no password anywhere in the product UI.
5. **One shared status vocabulary** across KYC, vehicle papers, bookings and fraud.

See [design-handoff/README.md](design-handoff/README.md) §3 for the full list and §6 for
the exact tokens.

## Secrets

Never commit `.env`. Each app ships a `.env.example`. Generate secrets with
`openssl rand -hex 32` and keep access/refresh JWT secrets distinct.
