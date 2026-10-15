# Multi-stage Dockerfile for Blueberry Backend
FROM node:22-alpine AS builder

WORKDIR /app

# Install build tools for native compilation (e.g. better-sqlite3)
RUN apk add --no-cache python3 make g++

# Copy shared library contract
COPY shared ./shared

# Copy backend dependency declarations and install
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci

# Copy backend source code and build
COPY backend/ ./
RUN npm run build

# Prune development dependencies to keep final image lean
RUN npm prune --production

# Production runtime image
FROM node:22-alpine AS runner

WORKDIR /app/backend

# Install runtime utilities (including libstdc++ for better-sqlite3 native bindings)
RUN apk add --no-cache wget libstdc++

ENV NODE_ENV=production
ENV PORT=8100

# Copy runtime assets and built artifacts
COPY --from=builder /app/shared /app/shared
COPY --from=builder /app/backend/package*.json ./
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/public ./public
COPY --from=builder /app/backend/scripts ./scripts

# Ensure SQLite data directory exists
RUN mkdir -p /app/backend/data

EXPOSE 8100

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8100/health || exit 1

CMD ["node", "dist/index.js"]
