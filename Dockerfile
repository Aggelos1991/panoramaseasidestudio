# ───────────────────────────────────────────────────────
# Panorama Seaside Studios — Production Dockerfile
# Multi-stage build for Next.js standalone output
# ───────────────────────────────────────────────────────

# Stage 1: Install dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma/
RUN npm ci --ignore-scripts
RUN npx prisma generate

# Stage 2: Build the application
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Dummy build-time env vars (Next.js needs them during static analysis)
# Real values are injected at runtime via docker-compose.yml
ENV STRIPE_SECRET_KEY=sk_build_placeholder
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_build_placeholder
ENV STRIPE_WEBHOOK_SECRET=whsec_build_placeholder
ENV DATABASE_URL=mysql://build:build@localhost:3306/build
ENV JWT_SECRET=build_placeholder
ENV ENCRYPTION_KEY=0000000000000000000000000000000000000000000000000000000000000000
ENV RESEND_API_KEY=re_build_placeholder
ENV NEXT_PUBLIC_APP_URL=http://localhost:3000

RUN npm run build

# Stage 3: Production runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Security: run as non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone build output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema + generated client (needed at runtime)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

USER nextjs
EXPOSE 3000

# Health check
HEALTHCHECK --interval=15s --timeout=10s --start-period=30s --retries=5 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

CMD ["node", "server.js"]
