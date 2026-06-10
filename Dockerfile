FROM node:22-bookworm AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

RUN npx playwright install-deps chromium
RUN npx playwright install chromium

COPY tsconfig.server.json tsconfig.client.json ./
COPY src/ ./src/

RUN npm run build

FROM node:22-bookworm

WORKDIR /app

RUN apt-get update && apt-get install -y \
  libnss3 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libdrm2 \
  libxkbcommon0 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  libgbm1 \
  libpango-1.0-0 \
  libcairo2 \
  libasound2 \
  libwayland-client0 \
  fonts-liberation \
  libvulkan1 \
  libx11-xcb1 \
  libxcb1 \
  libxfixes3 \
  libxshmfence1 \
  wget \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

RUN npx playwright install chromium

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/server/app.js"]
