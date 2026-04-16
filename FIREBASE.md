# Deploy to Firebase App Hosting

This app targets **[Firebase App Hosting](https://firebase.google.com/docs/app-hosting)** (Next.js on Cloud Run). The repo includes [`apphosting.yaml`](./apphosting.yaml).

## What you must change for Firebase

Do **not** commit secrets. Use the Firebase console and Secret Manager instead.

| What | Where | Action |
|------|--------|--------|
| **Firebase project** | [Firebase console](https://console.firebase.google.com/) | Create or pick a project; note the **project ID**. |
| **App Hosting backend** | Console → **Hosting & serverless** → **App Hosting** | Create backend, connect **GitHub**, pick **branch**, set **root directory** to the folder that contains this app’s `package.json` (e.g. `ipl-fantasy` if the repo root is not the app). |
| **`CRICKET_API_KEY`** | Secret Manager (via CLI below) | Same value as local `.env` — your Cricket Data API key. |
| **`DATABASE_URL`** | Secret Manager (via CLI below) | A **PostgreSQL** URL reachable from Google Cloud (e.g. [Neon](https://neon.tech)), usually with `?sslmode=require`. **Not** `file:…` SQLite. |
| **`APP_URL`** | App Hosting → **Environment variables** | Your live HTTPS URL after first deploy (no trailing slash), e.g. `https://<backend>--<project-id>.web.app` or your custom domain. Set availability to **BUILD** and **RUNTIME**. |
| **`.firebaserc` (optional)** | Local machine only | Copy [`.firebaserc.example`](./.firebaserc.example) to `.firebaserc` and replace `your-firebase-project-id` with your real project ID if you use `firebase` CLI commands. |

**CLI — create secrets** (names must match [`apphosting.yaml`](./apphosting.yaml)):

```bash
firebase apphosting:secrets:set CRICKET_API_KEY --project YOUR_PROJECT_ID
firebase apphosting:secrets:set DATABASE_URL --project YOUR_PROJECT_ID
```

Grant the App Hosting backend access to these secrets if the CLI prompts you.

**You usually do not edit** `apphosting.yaml` secret *names* unless you rename secrets in Google Cloud — then update the `secret:` fields to match.

---

## Why PostgreSQL?

Firebase App Hosting runs your app on **Cloud Run** with an **ephemeral filesystem**. **SQLite and on-disk uploads are not durable.** The app uses **PostgreSQL** via Prisma. Provision a managed Postgres instance and point `DATABASE_URL` at it (SSL usually required).

Good options:

- **[Neon](https://neon.tech)** — serverless Postgres, quick to create a branch and connection string.
- **Google Cloud SQL for PostgreSQL** — same GCP project as Firebase; can use [VPC](https://firebase.google.com/docs/app-hosting/vpc-network) if you need private networking.

## One-time setup

1. Install [Firebase CLI](https://firebase.google.com/docs/cli) (v13.15.4+): `npm i -g firebase-tools`
2. **Create a Firebase project** in the [Firebase console](https://console.firebase.google.com/).
3. Enable **App Hosting**: **Hosting & serverless → App Hosting → Get started**.
4. **Connect your GitHub repository** and choose the branch to deploy (e.g. `main`). Set the app root to the folder that contains `package.json` (this repo: `ipl-fantasy` or repo root if the app is at root).
5. **PostgreSQL**: Create a database and copy the connection string (must include `?sslmode=require` or equivalent if your provider requires SSL).

## Secrets and environment variables

Store sensitive values in **Google Cloud Secret Manager** via Firebase:

```bash
firebase login
firebase apphosting:secrets:set CRICKET_API_KEY --project YOUR_PROJECT_ID
firebase apphosting:secrets:set DATABASE_URL --project YOUR_PROJECT_ID
```

Paste the full Postgres URL when prompted for `DATABASE_URL` (e.g. `postgresql://user:pass@host/db?sslmode=require`).

In the Firebase console, under your **App Hosting backend → Environment**, set:

- **`APP_URL`** — your public site URL (no trailing slash), e.g. `https://<backend-id>--<project-id>.web.app` or your custom domain. Use availability **BUILD** and **RUNTIME** so metadata/Open Graph resolve correctly.

Console variables **override** [`apphosting.yaml`](./apphosting.yaml).

## What the config does

- **`runCommand`** in `apphosting.yaml` runs `prisma db push` before `npm run start` so the database schema matches `schema.prisma` (no Prisma Migrate history for now).
- **Memory** is set to 1024 MiB to leave headroom for OCR (Tesseract). Increase if you see OOM errors.

## Uploads / screenshots

Dream11 screenshots are saved under `public/uploads` on the **local disk**. On App Hosting, that disk is **not** persistent across instances or restarts. For production you should either:

- Accept ephemeral images (not ideal), or  
- Later, move uploads to **Firebase Storage** or another object store and store URLs in the database.

## Troubleshooting

- **`db push` fails**: Check `DATABASE_URL` (network access from Cloud Run to your DB, SSL params, IP allowlist if used).
- **Build fails**: Ensure `npm run build` works locally with `DATABASE_URL` set to the same kind of Postgres URL.
- **OCR errors**: Bump `memoryMiB` in `apphosting.yaml` or reduce concurrent requests (`concurrency`).

## Local development with Postgres

```bash
docker compose up db -d
cp .env.example .env
# Set CRICKET_API_KEY in .env
npx prisma db push
npm run dev
```

App Hosting and Docker run `prisma db push` on startup so the schema stays in sync without migration files.
