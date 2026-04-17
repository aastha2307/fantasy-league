# PostgreSQL is required (see docker-compose.yml). Uploads use a volume at public/uploads.
FROM node:22-bookworm-slim AS base
WORKDIR /app
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# Optional: set DATABASE_URL if the build runs code that connects to Postgres.
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/iplfantasy"
RUN mkdir -p /app/public/uploads
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh
RUN mkdir -p /app/public/uploads
EXPOSE 3000
ENV PORT=3000
ENV DATABASE_URL=postgresql://postgres:postgres@db:5432/iplfantasy
ENTRYPOINT ["./docker-entrypoint.sh"]
