# Deployment Guide

Production deployment guide for Solarium on Vercel + Supabase + Sanity + GCP.

---

## Table of Contents

1. [Vercel Deployment (Web App)](#vercel-deployment)
2. [Supabase Setup](#supabase-setup)
3. [Sanity CMS Setup](#sanity-cms-setup)
4. [Google OAuth Setup](#google-oauth-setup)
5. [Solana Devnet Setup (XP Mint)](#solana-devnet-setup)
6. [Build Server (GCP Cloud Run)](#build-server-gcp-cloud-run)
7. [Analytics (Optional)](#analytics-optional)
8. [Custom Domain](#custom-domain)
9. [Post-Deployment Checklist](#post-deployment-checklist)
10. [Performance Optimization](#performance-optimization)
11. [Emergency: Reverting a Deployment](#emergency-reverting-a-deployment)
12. [Cost Estimates](#cost-estimates)

---

## Vercel Deployment

### 1. Connect Repository

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Vercel will auto-detect Next.js

### 2. Configure Build Settings

| Setting          | Value                                                |
| ---------------- | ---------------------------------------------------- |
| Framework Preset | Next.js                                              |
| Root Directory   | `apps/web`                                           |
| Build Command    | `cd ../.. && pnpm build --filter @superteam-lms/web` |
| Install Command  | `pnpm install`                                       |
| Output Directory | (leave default)                                      |

> **Why the build command uses `cd ../..`**: The root directory is set to `apps/web` so Vercel runs commands there, but `pnpm build` needs to run from the monorepo root for Turborepo to resolve workspace dependencies.

### 3. Environment Variables

Add all environment variables in **Vercel → Project → Settings → Environment Variables**.

#### Required Variables

| Variable                        | Type            | Notes                                                                          |
| ------------------------------- | --------------- | ------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | Public          | Bundled into client JS                                                         |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public          | Bundled into client JS                                                         |
| `SUPABASE_SERVICE_ROLE_KEY`     | **Server-only** | Never exposed to browser                                                       |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Public          | Bundled into client JS                                                         |
| `NEXT_PUBLIC_SANITY_DATASET`    | Public          | Usually `production`                                                           |
| `NEXT_PUBLIC_SOLANA_RPC_URL`    | Public          | `https://api.devnet.solana.com`                                                |
| `NEXT_PUBLIC_SOLANA_NETWORK`    | Public          | `devnet`                                                                       |
| `NEXT_PUBLIC_APP_URL`           | Public          | Your Vercel URL (e.g., `https://solarium.courses`)                             |
| `NEXT_PUBLIC_PROGRAM_ID`        | Public          | Program ID from `anchor deploy` (see [DEPLOY-PROGRAM.md](./DEPLOY-PROGRAM.md)) |
| `NEXT_PUBLIC_XP_MINT_ADDRESS`   | Public          | XP mint pubkey from `initialize.ts` output                                     |
| `NEXT_PUBLIC_BACKEND_SIGNER`    | Public          | Authority pubkey (same as deployer on devnet)                                  |
| `NEXT_PUBLIC_BUILD_SERVER_URL`  | Public          | Cloud Run service URL (e.g., `https://academy-build-server-HASH.a.run.app`)    |
| `BUILD_SERVER_API_KEY`          | **Server-only** | Same value as `ACADEMY_API_KEY` on Cloud Run                                   |

#### Optional Variables

| Variable                         | Type            | Notes                                           |
| -------------------------------- | --------------- | ----------------------------------------------- |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID`   | Public          | Google OAuth (see [setup](#google-oauth-setup)) |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | Public          | Google Analytics 4                              |
| `NEXT_PUBLIC_POSTHOG_KEY`        | Public          | PostHog project key                             |
| `NEXT_PUBLIC_POSTHOG_HOST`       | Public          | PostHog instance URL                            |
| `SENTRY_DSN`                     | **Server-only** | Sentry error tracking                           |

> **Tip**: Variables prefixed with `NEXT_PUBLIC_` are bundled into the client-side JavaScript bundle. All others are server-only and only accessible in API routes and server components.

### 4. Deploy

Click **Deploy**. Vercel will:

1. Install dependencies with `pnpm install`
2. Build the project with Turborepo
3. Deploy to the Vercel edge network

Subsequent pushes to `main` trigger automatic deployments. Pull requests get preview deployments.

---

## Supabase Setup

### 1. Create Project & Apply Schema

1. Create a new project at [supabase.com/dashboard](https://supabase.com/dashboard)
2. Open **SQL Editor**
3. Paste the entire contents of `supabase/schema.sql`
4. Run — this creates all 7 tables, RLS policies, indexes, and SECURITY DEFINER functions

The schema includes:

| Table               | Purpose                       |
| ------------------- | ----------------------------- |
| `profiles`          | User profiles (wallet, email) |
| `enrollments`       | Course enrollments            |
| `user_progress`     | Lesson completion tracking    |
| `user_xp`           | Total XP per user             |
| `xp_transactions`   | XP change log                 |
| `user_achievements` | Unlocked achievements         |
| `certificates`      | NFT certificate records       |
| `siws_nonces`       | SIWS replay protection        |
| `nft_metadata`      | NFT metadata storage          |

### 2. Auth Redirect URLs

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to your production URL: `https://solarium.courses`
3. Add to **Redirect URLs**: `https://solarium.courses/api/auth/callback`

### 3. Enable Google OAuth Provider

1. Go to **Authentication** → **Providers** → **Google**
2. Toggle **Enable**
3. Enter the **Client ID** and **Client Secret** from Google Cloud Console (see [Google OAuth Setup](#google-oauth-setup))
4. The redirect URI Supabase gives you must be added to Google Cloud Console

### 4. Copy API Keys

From **Settings** → **API**, copy:

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

### 5. Verify RLS is Enabled

1. Go to **Table Editor** → select any table
2. Click the shield icon — it should show "RLS enabled"
3. All tables must have RLS enabled (set up by `schema.sql`)

### 6. Database Backups

Supabase automatically creates daily backups on paid plans. On the free tier:

- The `supabase/schema.sql` file in the repo serves as the source of truth
- Use the Supabase CLI to dump data if needed: `supabase db dump --data-only`

---

## Sanity CMS Setup

### 1. Create Project

1. Go to [sanity.io/manage](https://sanity.io/manage)
2. Create a new project
3. Note the **Project ID** → `NEXT_PUBLIC_SANITY_PROJECT_ID`
4. Use dataset `production` → `NEXT_PUBLIC_SANITY_DATASET`

### 2. CORS Origins

1. Navigate to **API** → **CORS Origins**
2. Add your production domain: `https://solarium.courses`
3. Check **Allow credentials**
4. Also add `http://localhost:3000` for local development

### 3. API Token (for Seed Import Only)

1. Go to **API** → **Tokens**
2. Create a token with **Editor** permissions
3. Set as `SANITY_API_TOKEN` (only needed for the seed script, not the running app)

### 4. Import Seed Data

```bash
cd sanity
SANITY_API_TOKEN=<your-token> node seed/import.mjs
```

This populates courses, modules, lessons, and instructor data.

### 5. Deploy Sanity Studio (Optional)

The Sanity Studio in `sanity/` can be deployed separately for content editing:

```bash
cd sanity
npx sanity deploy
```

---

## Google OAuth Setup

Google OAuth lets users sign in without a wallet. It requires configuration in both Google Cloud Console and Supabase.

### 1. Google Cloud Console

1. Go to [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)
2. Create a new **OAuth 2.0 Client ID** (Web application)
3. Under **Authorized redirect URIs**, add:
   - `https://<your-supabase-ref>.supabase.co/auth/v1/callback` (from Supabase dashboard)
   - `http://localhost:54321/auth/v1/callback` (for local Supabase dev)
4. Copy the **Client ID** and **Client Secret**

### 2. Configure in Supabase

1. Go to **Authentication** → **Providers** → **Google**
2. Enable Google
3. Paste the Client ID and Client Secret
4. Copy the **Callback URL** Supabase shows — this must match what's in Google Cloud Console

### 3. Set Environment Variable

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
```

> **Note**: The `profiles` table has a `github_id` column in the schema for future GitHub OAuth, but it is not currently implemented in the app.

---

## Solana Devnet Setup

The platform uses Token-2022 soulbound tokens for on-chain XP tracking.

### Deploy and Initialize the On-Chain Program

The XP mint is created by the on-chain program's `initialize` instruction — not a standalone script. Follow the full deployment guide:

**[DEPLOY-PROGRAM.md](./DEPLOY-PROGRAM.md)** — keypair generation, build, deploy, initialize, and verification.

After deployment, add these to your `.env.local`:

```bash
NEXT_PUBLIC_PROGRAM_ID=<your-program-id>
NEXT_PUBLIC_XP_MINT_ADDRESS=<xp-mint-pubkey-from-initialize-output>
NEXT_PUBLIC_BACKEND_SIGNER=<your-authority-pubkey>
```

On devnet, the deployer wallet serves as both `authority` and `backend_signer`.

---

## Build Server (GCP Cloud Run)

The build server is a Rust (Axum) service that compiles Solana/Anchor programs via `cargo-build-sbf` and returns `.so` binaries. It runs on GCP Cloud Run.

### Architecture

```
Next.js (Vercel) ──X-API-Key──→ Cloud Run (Axum + cargo-build-sbf)
```

- **Stack**: Rust 1.85, Agave 3.0.14 (platform-tools v1.51 / rustc 1.84.1), Anchor 0.32.1
- **Auth**: `--no-invoker-iam-check` disables GCP's IAM layer; the Axum server validates `X-API-Key` at the application level
- **Rate limit**: Built-in per-IP limiting
- **Builds**: User code → temp dir → `cargo-build-sbf --offline` → `.so` binary

### Prerequisites

- [gcloud CLI](https://cloud.google.com/sdk/docs/install) authenticated
- Docker installed and running
- A GCP project with billing enabled

### 1. First-Time GCP Setup

```bash
cd apps/build-server/deploy
./setup-gcp.sh <PROJECT_ID> [REGION]
```

**Default region**: `southamerica-east1` (São Paulo)

This enables the required APIs and creates:

- **Artifact Registry** repository (`academy-images`)
- **Service account** (`academy-build-sa`) with `run.invoker` and `iam.serviceAccountUser` roles

After running, grant Artifact Registry write access to the Compute Engine default service account (used by regional Cloud Build):

```bash
PROJECT_NUMBER=$(gcloud projects describe <PROJECT_ID> --format='value(projectNumber)')

gcloud projects add-iam-policy-binding <PROJECT_ID> \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"
```

Generate an API key:

```bash
openssl rand -hex 32
```

### 2. Deploy to Cloud Run

```bash
export ACADEMY_API_KEY=<your-generated-api-key>
export ALLOWED_ORIGIN=https://solarium.courses

cd apps/build-server/deploy
./deploy.sh <PROJECT_ID> [REGION] [TAG]
```

This builds the Docker image (~15 min first time due to `cargo-build-sbf` crate pre-caching), pushes to Artifact Registry, and deploys to Cloud Run with `--no-invoker-iam-check` (bypasses GCP IAM — the app handles auth via `X-API-Key`).

#### Cloud Run Configuration

| Setting           | Value                         |
| ----------------- | ----------------------------- |
| CPU               | 4 vCPU                        |
| Memory            | 8 GiB                         |
| Timeout           | 300s                          |
| Concurrency       | 2 (one build per vCPU pair)   |
| Min instances     | 1 (avoids cold start)         |
| Max instances     | 3                             |
| Invoker IAM check | **Disabled** (app-level auth) |

#### Environment Variables (set by deploy.sh)

| Variable                | Purpose                          |
| ----------------------- | -------------------------------- |
| `ACADEMY_API_KEY`       | API key for `X-API-Key` header   |
| `ALLOWED_ORIGIN`        | CORS origin for the web app      |
| `MAX_CONCURRENT_BUILDS` | Max parallel builds (default: 2) |
| `BUILD_TIMEOUT_SECS`    | Per-build timeout (default: 120) |
| `CACHE_TTL_SECS`        | Build cache TTL (default: 1800)  |
| `LOG_FORMAT`            | `json` for Cloud Logging         |
| `RUST_LOG`              | Log level (default: `info`)      |

### 3. CI/CD with Cloud Build

The `deploy/cloudbuild.yaml` triggers on push and runs the full build → push → deploy pipeline. To set up:

```bash
gcloud builds triggers create github \
  --repo-name=<REPO> \
  --repo-owner=<OWNER> \
  --branch-pattern="^main$" \
  --build-config=apps/build-server/deploy/cloudbuild.yaml \
  --substitutions=_REGION=southamerica-east1,_REPO=academy-images,_SERVICE=academy-build-server \
  --include-build-logs=ALL
```

Secrets (`ACADEMY_API_KEY`, `ALLOWED_ORIGIN`) must be added via Cloud Build substitutions or Secret Manager.

### 4. Verify Deployment

```bash
# Health check (no auth needed for /health)
curl https://academy-build-server-<HASH>.a.run.app/health

# Expected response:
# {"status":"ok","version":"0.1.0","solana_version":"3.0.14",
#  "uptime_secs":1234,"cache_entries":0,"active_builds":0,"total_builds":0}
```

### 5. Docker Image Details

The Dockerfile uses a two-stage build:

1. **Stage 1** (`rust:1.85-bookworm`): Compiles the Axum server binary
2. **Stage 2** (`ubuntu:24.04`): Installs Rust 1.85 + Agave 3.0.14 toolchain, pre-caches all Anchor 0.32.1 crates via a template program build, then copies the server binary

Key toolchain pins:

| Component | Version | Why                                                                                 |
| --------- | ------- | ----------------------------------------------------------------------------------- |
| Rust      | 1.85    | Latest stable, compiles the Axum server                                             |
| Agave     | 3.0.14  | Ships platform-tools v1.51 (rustc 1.84.1) natively                                  |
| Anchor    | 0.32.1  | Latest Anchor, requires rustc >= 1.82                                               |
| blake3    | < 1.8   | Pinned because >= 1.8 uses edition2024 (needs Cargo 1.85+, platform-tools has 1.84) |
| borsh     | 0.10.3  | Matches Anchor 0.32 internal borsh version                                          |

---

## Analytics (Optional)

All analytics providers gracefully degrade — the platform works without any configured.

### Google Analytics 4

```bash
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

### PostHog

```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_XXXXXXXX
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

Sign up at [posthog.com](https://posthog.com).

### Sentry

```bash
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

Sign up at [sentry.io](https://sentry.io).

---

## Custom Domain

### 1. Add Domain in Vercel

1. Go to **Vercel → Project → Settings → Domains**
2. Add your custom domain (e.g., `solarium.courses`)
3. Follow Vercel's DNS instructions (add CNAME or A records)

### 2. Update Environment Variables

| Variable              | New Value                  |
| --------------------- | -------------------------- |
| `NEXT_PUBLIC_APP_URL` | `https://solarium.courses` |

### 3. Update External Services

When changing domains, update all of these:

- **Supabase**: Update **Site URL** and **Redirect URLs** in Authentication settings
- **Google OAuth**: Add new domain to authorized redirect URIs in [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- **Sanity**: Add new domain to CORS origins
- **Build Server**: Update `ALLOWED_ORIGIN` env var in Cloud Run

---

## Post-Deployment Checklist

After deploying, verify:

- [ ] Landing page loads without errors
- [ ] Courses display correctly (fetched from Sanity)
- [ ] Wallet connect works (Phantom, Solflare, Backpack)
- [ ] Google OAuth works (if configured)
- [ ] Completing a lesson awards XP
- [ ] Leaderboard shows correct rankings
- [ ] NFT certificate minting works on Devnet
- [ ] Language switching works (EN, PT-BR, ES)
- [ ] Dark/light mode toggle works
- [ ] Build server health check passes
- [ ] `robots.txt` is accessible at `/robots.txt`
- [ ] `sitemap.xml` is accessible at `/sitemap.xml`
- [ ] Open Graph meta tags render in link previews (use [opengraph.xyz](https://www.opengraph.xyz) to test)

---

## Performance Optimization

### Vercel

- Static pages (landing, courses list, leaderboard) are prerendered at build time
- Dynamic pages (course detail, lessons) are server-rendered on demand
- The middleware handles locale detection and auth checks at the edge

### Sanity

- GROQ queries use CDN caching by default
- Image assets are served through Sanity's image CDN with automatic optimization

### Next.js

- Monaco Editor is loaded via `dynamic()` import with `ssr: false` to avoid 4MB+ SSR bundle
- Server components handle data fetching (zero client JS for read-only pages)
- `@next/font` handles font loading without layout shift

### Build Server

- Template crates pre-cached in Docker image (`cargo-build-sbf --offline` avoids network fetch)
- In-memory LRU build cache with configurable TTL
- Concurrency limited to 2 (one build per vCPU pair) to avoid OOM

---

## Emergency: Reverting a Deployment

### Web App (Vercel)

1. Go to **Vercel → Deployments**
2. Find the last working deployment
3. Click **...** → **Promote to Production**
4. This instantly rolls back without rebuilding

### Build Server (Cloud Run)

```bash
# List revisions
gcloud run revisions list --service=academy-build-server --region=southamerica-east1

# Route traffic to a previous revision
gcloud run services update-traffic academy-build-server \
  --to-revisions=<REVISION_NAME>=100 \
  --region=southamerica-east1
```

---

## Cost Estimates

| Service       | Free Tier Limits                            | Upgrade Trigger           |
| ------------- | ------------------------------------------- | ------------------------- |
| Vercel        | 100GB bandwidth, 100 deploys/day            | High traffic              |
| Supabase      | 500MB database, 50K auth users, 2GB storage | >500MB data or >50K users |
| Sanity        | 100K API requests/month, 10GB bandwidth     | High content volume       |
| Solana Devnet | Free, rate-limited                          | Moving to mainnet         |
| Cloud Run     | 2M requests/month, 360K vCPU-sec free       | High build volume         |
| Artifact Reg. | 500MB storage free                          | Many image versions       |
