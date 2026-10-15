# Multi-stage Dockerfile for Blueberry Vue 3 Client
FROM node:22-alpine AS builder

WORKDIR /app

# Copy shared library contract
COPY shared ./shared

# Copy frontend dependency declarations
COPY vue-app/package*.json ./vue-app/
WORKDIR /app/vue-app
RUN npm ci

# Copy frontend source code and build production bundle
COPY vue-app/ ./
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Nginx production runtime stage
FROM nginx:alpine AS runner

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy compiled SPA bundle and PWA service worker
COPY --from=builder /app/vue-app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY vue-app/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
