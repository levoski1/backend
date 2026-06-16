# ─── Build Stage ─────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /build

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build && npm prune --production

# ─── Production Stage ────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

RUN addgroup --system --gid 1001 shelter && \
    adduser --system --uid 1001 shelter

COPY --from=builder /build/dist ./dist
COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/package.json ./
COPY ecosystem.config.cjs ./

EXPOSE 4000

USER shelter

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/v1/health || exit 1

CMD ["node", "dist/server.js"]
