# DzRent client website — production image.
#
# Unlike the backend, this app depends on the @dzrent/* workspace packages, so it
# builds from the MONOREPO ROOT context (pnpm workspace install). It emits a
# self-contained Next.js standalone server (BUILD_STANDALONE=1) that traces the
# workspace packages in, so the runtime image needs no pnpm and no node_modules.
#
# Build from the repo root:
#   docker build -f apps/client-web/Dockerfile \
#     --build-arg NEXT_PUBLIC_API_URL=https://dzrent.rayanemelzi.dev/api/v1 .

# ── Base ─────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /repo

# ── Build ────────────────────────────────────────────────────────────────────
FROM base AS build
ENV NEXT_TELEMETRY_DISABLED=1 BUILD_STANDALONE=1
# NEXT_PUBLIC_* values are inlined at build time, so the API URL must be set here.
ARG NEXT_PUBLIC_API_URL=https://dzrent.rayanemelzi.dev/api/v1
ARG NEXT_PUBLIC_AGENCY_URL=https://dzrent-agence.rayanemelzi.dev
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL NEXT_PUBLIC_AGENCY_URL=$NEXT_PUBLIC_AGENCY_URL
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @dzrent/client-web build

# ── Runtime ──────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
# Standalone output carries a minimal server + traced deps (monorepo layout).
COPY --from=build /repo/apps/client-web/.next/standalone ./
COPY --from=build /repo/apps/client-web/.next/static ./apps/client-web/.next/static
COPY --from=build /repo/apps/client-web/public ./apps/client-web/public
USER nextjs
EXPOSE 3000
CMD ["node", "apps/client-web/server.js"]
