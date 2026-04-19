# Deploy to Firebase App Hosting

This app targets **[Firebase App Hosting](https://firebase.google.com/docs/app-hosting)** (Next.js on Cloud Run). The repo includes [`apphosting.yaml`](./apphosting.yaml).

### PostgreSQL: `pg` and Data Connect are not the same thing

- **Cloud SQL** is one PostgreSQL server (your database).
- **node-postgres (`pg`)** — app APIs use `DATABASE_URL` for core tables (`League`, `GameRoom`, etc.). A human-readable model reference lives at [`docs/schema.prisma`](./docs/schema.prisma) (not used by the build).
- **Firebase Data Connect** ([`dataconnect/`](./dataconnect/)) is a **GraphQL API + tooling** that *also* uses that same PostgreSQL database for tables it manages (e.g. `dc_health`). It does **not** automatically replace direct SQL; route handlers would need GraphQL operations if you wanted to route everything through Data Connect.

**Production readiness:** [`apphosting.yaml`](./apphosting.yaml) sets `DATABASE_URL` and `CRICKET_API_KEY` from secrets, wires **Data Connect** env vars for the server, and **NEXT_PUBLIC_FIREBASE_*** for the browser bundle so Auth / Storage / Data Connect client SDKs talk to your Firebase project. After a rollout, call **`GET /api/health`** on your live site — it verifies **Postgres** (`pg`), **Firestore** (Admin SDK), and **Data Connect** (Admin GraphQL). Enable **Cloud Firestore** and deploy **Data Connect** (`firebase deploy --only dataconnect`) so those checks pass.

**Firebase Data Connect** is configured under [`dataconnect/`](./dataconnect/) and [`firebase.json`](./firebase.json). It uses the **same Cloud SQL for PostgreSQL** instance as the app (`DATABASE_URL`). `schemaValidation: COMPATIBLE` means Data Connect adds its own tables (e.g. `dc_health`) and does **not** remove existing app tables.

### “Deploying Data Connect schemas…” then `Error: An unexpected error has occurred`

The CLI opens a **direct PostgreSQL connection** to your Cloud SQL instance (port **5432**) to migrate the schema. If that step fails, the log usually shows **`read ECONNRESET`** (connection dropped). That is a **network access** issue, not a problem with your `.gql` files.

**Fix (pick one):**

1. **Allow your current public IP on Cloud SQL** (most common for local deploys):
   - Google Cloud Console → **SQL** → instance **`ipl-fantasy-league-71959-instance`** → **Connections** → **Networking**.
   - Ensure **Public IP** is enabled for the instance.
   - Under **Authorized networks**, **Add network**: name e.g. `laptop`, **Network** = your public IP in CIDR form, e.g. `203.0.113.48/32`. (Find your IP with `curl -s https://ifconfig.me` or visit [ifconfig.me](https://ifconfig.me).)
   - Save, wait a minute, then run `firebase deploy --only dataconnect` again.

2. **Deploy from [Google Cloud Shell](https://shell.cloud.google.com/)** (same GCP project): clone or upload this repo, `cd` into `ipl-fantasy`, run `npm i` if needed, then `firebase deploy --only dataconnect`. Cloud Shell’s egress can reach Cloud SQL without your home IP allowlist in many setups.

3. **VPN / corporate Wi‑Fi** often blocks outbound **5432**. Try another network or Cloud Shell.

4. See verbose logs: `DEBUG=* firebase deploy --only dataconnect --project YOUR_PROJECT_ID 2>&1 | tee /tmp/dc.log` and search for `ECONNRESET` or `timeout`.

---

1. **Deploy the Data Connect service** (after `firebase login` and with the correct project):

   ```bash
   firebase deploy --only dataconnect --project YOUR_PROJECT_ID
   ```

2. **Regenerate the typed web SDK** when you change schema or connector operations:

   ```bash
   npm run dataconnect:sdk:generate
   ```

3. **Smoke test** the Admin → Data Connect path (requires the service deployed and Application Default Credentials locally, or runs automatically on App Hosting):

   - `GET /api/dataconnect/health` — returns `{ ok: true, dataConnect: { dcHealths: [...] } }` when the GraphQL read succeeds.

If deploy still fails after fixing Cloud SQL access (see **“Deploying Data Connect schemas…”** above), capture logs with `DEBUG=* firebase deploy --only dataconnect --project YOUR_PROJECT_ID 2>&1 | tee /tmp/dataconnect-deploy.log`.

The generated client package is `@ipl-fantasy/dataconnect` (see `package.json` `file:src/lib/dataconnect-sdk`). In the browser, use `getDataConnect(firebaseApp, connectorConfig)` from `firebase/data-connect` (see [`FirebaseDbPanel`](./src/components/FirebaseDbPanel.tsx) and the [`/firebase`](./src/app/firebase/page.tsx) page).

**Cloud Firestore** uses [`firestore.rules`](./firestore.rules). Deploy rules with `firebase deploy --only firestore`. The API route `GET /api/firebase/app-settings` reads `app/settings` with the Admin SDK (enable Firestore in the Firebase console if you have not already).

**Billing:** App Hosting requires the Firebase project to be on the **Blaze (pay-as-you-go)** plan (Cloud Run + build infrastructure). [Upgrade in the console](https://console.firebase.google.com/) if `firebase apphosting:*` commands ask you to upgrade.

## Push code (GitHub → Firebase)

Firebase does **not** receive `git push` directly. You push to **GitHub**; App Hosting builds from the connected repo.

1. Create a **new repository** on GitHub (empty, no README if you already have a local commit).
2. In `ipl-fantasy` on your machine:

   ```bash
   git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
   git push -u origin main
   ```

3. In [Firebase → App Hosting](https://console.firebase.google.com/), connect that repository, select branch **`main`**, and set **root directory** if the app lives in a subfolder.
4. Pushes to `main` trigger new rollouts. Or run:

   ```bash
   firebase apphosting:rollouts:create YOUR_BACKEND_ID --git-branch main --project YOUR_PROJECT_ID
   ```

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

Firebase App Hosting runs your app on **Cloud Run** with an **ephemeral filesystem**. **SQLite and on-disk uploads are not durable.** The app uses **PostgreSQL** via `pg`. Provision a managed Postgres instance and point `DATABASE_URL` at it (SSL usually required).

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

- The App Hosting **Next.js adapter** runs `npm run start` from `package.json` unless you override scripts (not recommended). Apply or migrate the database schema separately (e.g. against Cloud SQL) so tables match [`docs/schema.prisma`](./docs/schema.prisma).
- **Memory** is set to 1024 MiB to leave headroom for OCR (Tesseract). Increase if you see OOM errors.

## Uploads / screenshots

Dream11 screenshots are stored in **Firebase Storage** (GCS) when `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` is set. A permanent download-token URL is returned and saved to the database, so images survive Cloud Run instance restarts and scale-outs without any 404s.

When the env var is not set (local dev without a bucket configured) the file falls back to `public/uploads` on disk, served by the Next.js dev server.

### First-time setup (one-off)

The upload uses the Firebase Admin SDK with Application Default Credentials (ADC), which is automatic on Cloud Run. No extra secrets are needed — the Cloud Run service account must have the **Firebase Storage Admin** (or **Storage Object Admin**) role on the project:

```bash
# Find the Cloud Run service account (printed in the Cloud Run service details)
# then grant it access:
gcloud projects add-iam-policy-binding ipl-fantasy-league-71959 \
  --member="serviceAccount:<SERVICE_ACCOUNT_EMAIL>" \
  --role="roles/storage.objectAdmin"
```

The `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` variable is already set in `apphosting.yaml` (`ipl-fantasy-league-71959.firebasestorage.app`), so no additional env var configuration is required.

## Troubleshooting

### API routes return 500 (e.g. `/api/game/active`, `/api/game/overall`)

These handlers use **`pg`** and **`DATABASE_URL`**. Open **`GET /api/health`** on your live site: if **`checks.postgresql`** is `"error"`, Postgres is not reachable from Cloud Run.

**Cloud SQL (same project as this app)** — if `DATABASE_URL` uses the **Unix socket** form from [`apphosting.yaml`](./apphosting.yaml) (`host=/cloudsql/PROJECT:REGION:INSTANCE`), the **Cloud Run service must have that Cloud SQL instance attached**. Otherwise the socket path does not exist in the container and every query fails.

1. [Cloud Run](https://console.cloud.google.com/run?project=ipl-fantasy-league-71959) → select the App Hosting service in **`asia-southeast1`** (often named like your backend, e.g. `fantasy-league`) → **Edit & deploy new revision** → **Connections** → **Add connection** → choose instance **`ipl-fantasy-league-71959-instance`**, or use:

   ```bash
   gcloud run services list --project=ipl-fantasy-league-71959 --region=asia-southeast1
   gcloud run services update SERVICE_NAME --region=asia-southeast1 --project=ipl-fantasy-league-71959 \
     --add-cloudsql-instances=ipl-fantasy-league-71959:asia-south1:ipl-fantasy-league-71959-instance
   ```

2. Ensure the **runtime service account** used by that Cloud Run service has **`roles/cloudsql.client`** on the project (often granted when you add the connection in the console).

3. Confirm the **`DATABASE_URL`** secret matches the [socket URL format](./apphosting.yaml) (correct DB name, user, password).

4. **Schema**: tables such as `GameRoom` must exist on that database (apply [`sql/init-schema.sql`](./sql/init-schema.sql) or your migration against Cloud SQL if you have not already).

**Alternative without Unix socket:** use a **`DATABASE_URL`** that points at **private IP** (with [`vpcAccess`](https://firebase.google.com/docs/app-hosting/vpc-network) in `apphosting.yaml`) or a **hosted Postgres** URL with TLS (`?sslmode=require`) and network access from Cloud Run.

- **Database connection errors**: Check `DATABASE_URL` (network access from Cloud Run to your DB, SSL params, IP allowlist if used).
- **Build fails**: Ensure `npm run build` works locally with `DATABASE_URL` set to the same kind of Postgres URL.
- **OCR errors**: Bump `memoryMiB` in `apphosting.yaml` or reduce concurrent requests (`concurrency`).

## Local development with Postgres

```bash
docker compose up db -d
cp .env.example .env
# Set CRICKET_API_KEY in .env
npm run dev
```

Ensure your Postgres instance already has the tables described in [`docs/schema.prisma`](./docs/schema.prisma) (e.g. from an existing Cloud SQL database or a one-time schema apply).
