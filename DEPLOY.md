# Hosting IPL Fantasy

The app uses **PostgreSQL** (Prisma) and stores screenshots under **`public/uploads/`**. On Docker, uploads can use a **volume**; on **Firebase App Hosting**, disk is ephemeral — see [FIREBASE.md](./FIREBASE.md).

## Environment

| Variable | Required | Notes |
|----------|----------|--------|
| `CRICKET_API_KEY` | Yes | Cricket data API key. |
| `DATABASE_URL` | Yes | PostgreSQL connection string. Local: see `.env.example`. Docker Compose sets this for the `web` service. |
| `APP_URL` | Strongly recommended | Public origin, no trailing slash — Open Graph / metadata. |
| `PORT` | No | Host port for Compose (default `3000`). |
| `NEXT_DEV_ALLOWED_ORIGINS` | No | **Dev only** — HMR when using LAN IPs. |

## Option A: Docker Compose (VPS, etc.)

1. Install Docker and Docker Compose.
2. Copy `.env.example` to `.env` and set `CRICKET_API_KEY` (and optional `APP_URL`).
3. From the project directory:

```bash
docker compose up -d --build
```

The stack runs **Postgres** (`db`) and the **web** app. Data persists in the `postgres-data` Docker volume; uploads persist in `./docker-uploads`.

4. Open port **3000** (or `${PORT}`) or put **Caddy** / **nginx** in front with HTTPS.

## Option B: Firebase App Hosting

See **[FIREBASE.md](./FIREBASE.md)** for PostgreSQL, secrets, and `apphosting.yaml`.

## Option C: `docker run` (custom orchestration)

You must supply a reachable PostgreSQL and pass `DATABASE_URL`:

```bash
docker build -t ipl-fantasy .
docker run --rm -p 3000:3000 \
  -e CRICKET_API_KEY=your_key \
  -e APP_URL=https://your-public-url \
  -e DATABASE_URL=postgresql://user:pass@host:5432/dbname \
  -v "$(pwd)/docker-uploads:/app/public/uploads" \
  ipl-fantasy
```

## Production checklist

- Set `NODE_ENV=production` (Dockerfile does this).
- Use HTTPS in front of the app (reverse proxy or Firebase’s HTTPS).
- Back up your **Postgres** database and any **upload** volume or object storage regularly.
