# =============================================================================
# Netr — Multi-stage production build
# Stage 1: Build frontend + backend
# Stage 2: Minimal runtime with nginx (frontend) + node (API)
# =============================================================================

# -- Build stage --------------------------------------------------------------
FROM node:22-alpine AS build

WORKDIR /app

# Frontend deps
COPY package.json package-lock.json ./
RUN npm ci

# Backend deps
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci

# Frontend source + build
COPY index.html tsconfig.json vite.config.ts ./
COPY src/ ./src/
RUN npm run build

# Backend — bundle with tsx (no tsc emit, use tsx at runtime)
COPY server/ ./server/

# -- Production stage ---------------------------------------------------------
FROM node:22-alpine AS production

RUN apk add --no-cache nginx

WORKDIR /app

# Copy built frontend to nginx html dir
COPY --from=build /app/dist /usr/share/nginx/html

# Copy backend
COPY --from=build /app/server /app/server

# Install only production deps for backend
RUN cd /app/server && npm ci --omit=dev

# Nginx config — serves frontend + proxies /api to backend
COPY nginx.conf /etc/nginx/http.d/default.conf

# Entrypoint script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 80 8787

CMD ["/app/docker-entrypoint.sh"]
