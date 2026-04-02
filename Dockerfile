# ══════════════════════════════════════════════════════
# InfoSec Report — Dockerfile
# Docker Hub: islamjihad/infosec-report
# ══════════════════════════════════════════════════════

# ── Stage 1: Builder ─────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source files
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js
RUN npm run build

# ── Stage 2: Runner ──────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Needed to drop privileges after root-only volume permission fixups.
RUN apk add --no-cache su-exec

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone server (includes traced node_modules + server.js)
COPY --from=builder /app/.next/standalone ./

# Copy static assets that standalone server does NOT bundle
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma files for runtime migrations
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/src/generated ./src/generated

# Install Prisma CLI for runtime database migrations
RUN npm install --no-save prisma@7

# Create data directory for SQLite
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

# Set DATABASE_URL to persistent volume path
ENV DATABASE_URL="file:/app/data/infosec.db"

# Copy entrypoint
COPY --from=builder /app/docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./docker-entrypoint.sh"]
