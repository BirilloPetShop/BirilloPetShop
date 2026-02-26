# ── Stage 1: Build ──
FROM node:20-alpine AS builder
WORKDIR /app

ENV NODE_OPTIONS="--max-old-space-size=1536"

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build && ls -la dist/

# ── Stage 2: Production ──
FROM node:20-alpine
WORKDIR /app

ENV NODE_OPTIONS="--max-old-space-size=400"
ENV NODE_ENV=production

# Copy full dist (contains compiled TS + admin panel build)
COPY --from=builder /app/dist ./dist
# Strapi non-TS mode looks for config/src/build in appDir root
COPY --from=builder /app/dist/config ./config
COPY --from=builder /app/dist/src ./src
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/favicon.png ./

EXPOSE 1337

CMD ["npm", "run", "start"]
