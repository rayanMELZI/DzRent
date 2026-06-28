# DzRent backend — production image.
#
# The backend is a self-contained NestJS app (no @dzrent/* workspace deps), so it
# builds standalone with its own package.json — build context is apps/backend.
# The runtime keeps the full dependency set on purpose: the Prisma CLI (for
# `migrate deploy` at startup) and ts-node (for `db seed`) must be available.

# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json ./
RUN npm install
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
RUN npm run build

# ── Runtime stage ────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production
# Carry the built app + the full node_modules (incl. Prisma CLI & generated client).
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/assets ./assets
COPY package.json ./
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh
EXPOSE 3000
# Applies pending migrations, then boots the API.
ENTRYPOINT ["./docker-entrypoint.sh"]
