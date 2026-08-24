> Last synced: 2026-08-24

# Deployment Guide

Production deployment guide for Superteam Academy on Vercel + Supabase + GCP.

There is **no CMS to deploy**. Course content ships as a committed bundle
compiled from the `solanabr/academy-courses` git repo — see
[Content Bundle](#content-bundle).

---

## Table of Contents

1. [Vercel Deployment (Web App)](#vercel-deployment)
2. [Supabase Setup](#supabase-setup)
3. [Content Bundle](#content-bundle)
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

> **The authoritative list is the `## Environment Variables` block in
> [`apps/web/CLAUDE.md`](../apps/web/CLAUDE.md)** — every variable, what it does,
> and what happens when it is unset. `.env.example` is the copyable template.
> This section covers only what is specific to deploying, and does not repeat the
> full list.

Validated eagerly at boot (`lib/env.ts` for public, `lib/env.server.ts` for
server-only, both wired through `instrumentation.ts`). A missing **required** var
fails the boot loudly rather than degrading silently.

Two things to know before you paste anything in:

- **`NEXT_PUBLIC_*` is inlined at build time.** Changing one requires a redeploy
  with "Use existing Build Cache" **disabled** — a cache-reusing redeploy keeps
  the old value baked into the served chunks while the dashboard shows the new
  one. That exact trap has caused a live incident. Verify by grepping the served
  `/_next/static` chunks, not the dashboard.
- **`ADMIN_SECRET` is retired** and can be deleted. Admin access is a Supabase
  session checked against the `admin_users` table; there is no admin password.

#### The ones that gate a deploy

Required at boot — the build or the first request fails without them:

| Variable                        | Type            | Notes                                                                                                                                   |
| ------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Public          | Bundled into client JS                                                                                                                  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public          | Bundled into client JS                                                                                                                  |
| `SUPABASE_SERVICE_ROLE_KEY`     | **Server-only** | Never exposed to the browser. Also gates admin auth — without it every admin check fails closed                                         |
| `NEXT_PUBLIC_SOLANA_RPC_URL`    | Public          | Browser RPC. Must carry **no** privileged key                                                                                           |
| `SOLANA_RPC_URL`                | **Server-only** | Server RPC — **this** is the one that may carry the Helius key. Required so a misconfig fails loudly instead of hitting public devnet   |
| `NEXT_PUBLIC_APP_URL`           | Public          | A **production** build with this unset fails at boot. An empty value would pin a relative metadata URI into an immutable credential NFT |

#### Feature-gated

Everything else switches a feature on or off. Unset means the feature is off,
and every one of them degrades deliberately rather than crashing:

| Set these for…           | Variables                                                                                                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| On-chain features        | `NEXT_PUBLIC_PROGRAM_ID`, `NEXT_PUBLIC_XP_MINT_ADDRESS`, `NEXT_PUBLIC_SOLANA_NETWORK`, `PROGRAM_AUTHORITY_SECRET`, `BACKEND_SIGNER_SECRET`, `XP_MINT_AUTHORITY_SECRET` |
| Helius event ingestion   | `HELIUS_API_KEY`, `HELIUS_WEBHOOK_SECRET`                                                                                                                              |
| The admin publish card   | `GITHUB_TOKEN` (**read scope only** — no route holds a write token; unset ⇒ 503 on that card alone)                                                                    |
| Rust builds and deploys  | `BUILD_SERVER_URL`, `BUILD_SERVER_API_KEY`, `RUST_PLAYGROUND_URL`                                                                                                      |
| The AI lesson assistant  | `GEMINI_API_KEY`, `AI_PARTNER_SEAL_SECRET`, the `AI_SPEND_*` caps, the `AI_MODEL_*` overrides                                                                          |
| Embedded wallets         | `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID` (see the build-cache warning above)                                                                                               |
| Permanent credentials    | `ARWEAVE_UPLOADER_SECRET` — a **Solana** keypair funding Irys, not an Arweave JWK. Unset ⇒ mint falls back to `/api/certificates/metadata`                             |
| Outbound email + cron    | `RESEND_API_KEY`, `EMAIL_FROM`, `CRON_SECRET` — all **fail-closed**: unset means nothing is ever sent                                                                  |
| Moderation notifications | `MODERATION_WEBHOOK_URL` (the queue still fills without it)                                                                                                            |
| Analytics                | `NEXT_PUBLIC_GA4_MEASUREMENT_ID`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`, `NEXT_PUBLIC_SENTRY_DSN`                                                      |

> **Tip**: Variables prefixed with `NEXT_PUBLIC_` are bundled into the client-side JavaScript bundle. All others are server-only and only accessible in API routes and server components.

#### Scheduled jobs (Vercel Cron)

`apps/web/vercel.json` (the Vercel **Root Directory** is `apps/web`) declares
every scheduled job:

| Path                          | Schedule (UTC) | Local time              | What it does                                                                                                                    |
| ----------------------------- | -------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `/api/cron/session-reminders` | `0 11 * * *`   | 08:00 America/Sao_Paulo | Sends the session-plan reminder to learners who committed to studying today AND opted in (#869).                                |
| `/api/cron/reengagement`      | `0 13 * * *`   | 10:00 America/Sao_Paulo | Sends the win-back nudge to opted-in learners inactive past the threshold, frequency-capped by `claim_due_reengagement` (#899). |

Brazil has had no DST since 2019, so `11:00Z` is a stable 08:00 São Paulo — the
learner gets the nudge in the morning, ahead of the hour they picked.

Set `CRON_SECRET` in Vercel; it authenticates every invocation. A manual
re-trigger (`curl -H "Authorization: Bearer $CRON_SECRET" …`) is normally a
no-op: each learner's send is claimed for the São Paulo day in Postgres, so a
second run the same day finds nothing to claim.

> **One caveat before re-triggering after a failure.** Claims are released for
> retry only when the batch was PROVABLY not transmitted (a 4xx from Resend, a
> DNS/connection failure). A batch that failed ambiguously — a 5xx, a timeout, a
> connection dropped mid-flight — may already have been delivered, so its claims
> are deliberately HELD and those learners are skipped for the day. Do not clear
> `email_reminder_log` rows by hand to "fix" a failed run: that is precisely how
> a delivered reminder gets sent twice. Check the run's `released` count in the
> route's JSON response — it counts only claims that are genuinely retryable.

> **No content-write secret exists.** The app cannot mutate course content at
> runtime under any credential. Content is a committed bundle; publishing is a
> pull request (see [Content Bundle](#content-bundle)). `GITHUB_TOKEN` is
> read-only and is used solely to poll `academy-courses` HEAD and its CI state.

### 4. Deploy

Click **Deploy**. Vercel will:

1. Install dependencies with `pnpm install`
2. Build the project with Turborepo
3. Deploy to the Vercel edge network

Subsequent pushes to `main` trigger automatic deployments. Pull requests get preview deployments.

---

## Supabase Setup

### 1. Create Project & Apply Migrations

> **Production project**: refers to the current production Supabase project. The
> previously used project is **retired** — do not point a new deploy at it.

1. Create a new project at [supabase.com/dashboard](https://supabase.com/dashboard)
2. Install the [Supabase CLI](https://supabase.com/docs/guides/cli) and link the project:
   ```bash
   supabase link --project-ref <your-project-ref>
   ```
3. Apply all migrations:
   ```bash
   supabase db push
   ```
   This runs all 62 files in `supabase/migrations/` in order, creating the 36
   tables, RLS policies, indexes, SECURITY DEFINER functions, and views. The
   table inventory and the access model are in
   [ARCHITECTURE.md § Database](./ARCHITECTURE.md#7-database).

> **Migrations are the source of truth.** `supabase/schema.sql` is a generated
> snapshot kept for reference and diffing — do **not** run or hand-edit it. It is
> also currently **stale**: `admin_users`, `onchain_deployments`, and
> `platform_freeze` exist only in the migrations. Ship schema changes as new
> migrations (`supabase migration new <name>`, then `supabase db push`).

> **Read [DB-MIGRATION-LEDGER.md](./DB-MIGRATION-LEDGER.md) before any
> `supabase db push` or `migration list` against production.** Migrations applied
> through the Supabase MCP carry an MCP-stamped version that diverges from the
> repo filename, so the CLI considers them unapplied.

Grant yourself admin access by inserting your `auth.users` id into
`admin_users` — that table is the entire admin authorization model, and it starts
empty.

> **`onchain_deployments` is load-bearing for content visibility.** It is the
> post-SP2 home of the on-chain sync status that gates which courses learners can
> see (`status == "synced" AND coalesce(is_active, true)`). A fresh project starts
> with zero rows, so **no courses are visible until you deploy them from
> `/admin/courses`** — see [ADMIN.md](./ADMIN.md). The base table is service_role
> only (RLS on, no policies); anon/authenticated read the narrow
> `public_onchain_deployments` view.

### 2. Auth Redirect URLs

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to your production URL: `https://superteam-academy-web.vercel.app`
3. Add to **Redirect URLs**: `https://superteam-academy-web.vercel.app/api/auth/callback`

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
3. All tables must have RLS enabled (set up by the migrations)

### 6. Database Backups

Supabase automatically creates daily backups on paid plans. On the free tier:

- The `supabase/migrations/` directory is the schema source of truth (re-applies the full schema on a fresh project via `supabase db push`)
- Use the Supabase CLI to dump data if needed: `supabase db dump --data-only`

---

## Content Bundle

**There is nothing to provision here.** Course content is not fetched at runtime
from any hosted service — it is compiled ahead of time and **committed to this
repo**, so a deploy is entirely self-contained.

### How it works

```
solanabr/academy-courses   ← git repo, the single source of truth for content
        │
        │  pinned to ONE commit by apps/web/content.lock
        ▼
apps/web/scripts/compile-content.ts
        │   fetch tarball @ locked SHA → Zod-validate every doc (fail-closed)
        │   → project → emit deterministic JSON
        ▼
apps/web/src/content/generated/*.json   ← COMMITTED
apps/web/public/content-assets/*        ← COMMITTED
```

`apps/web/content.lock` is the pin:

```json
{
  "repo": "solanabr/academy-courses",
  "sha": "<40-char commit sha>"
}
```

At build time the app statically imports the generated JSON (`lib/content/store.ts`,
`server-only`). Vercel needs **no** content credentials, and a content-repo
outage cannot take the site down.

### Regenerating the bundle

```bash
pnpm --filter web compile-content     # from the repo root
```

`GITHUB_TOKEN` is optional here — it only raises the GitHub rate limit when
fetching the tarball.

### CI enforces freshness

The compiler's output is a **pure function of the locked SHA** (sorted keys, no
wall-clock timestamps, assets kept as repo-relative paths). The
`Content bundle freshness` step in `.github/workflows/ci.yml` recompiles the
bundle and fails if the result differs by a single byte from what is committed.

This catches both failure modes:

- a `content.lock` bump without a recompile (stale bundle), and
- a hand-edit of `src/content/generated/*`.

> Never hand-edit the generated bundle. An ESLint rule also bans importing it
> outside `src/lib/content/`.

### Publishing new content

Publishing is a **pull request**, not a deploy step and not a button:

1. Merge the content change into `solanabr/academy-courses` (its own CI gates it).
2. In this repo: bump `"sha"` in `apps/web/content.lock`.
3. Run `pnpm --filter web compile-content`.
4. Commit `content.lock` **and** the regenerated bundle together.
5. Merge → Vercel redeploys with the new content.

The `/admin/courses` screen shows the pin-vs-HEAD drift and hands you a prefilled
PR link. It holds **no write token** and performs no repo write. See
[ADMIN.md](./ADMIN.md).

> New courses are still **invisible to learners** until they are deployed on-chain
> from `/admin/courses` — compiling the bundle is necessary but not sufficient.

### Slot activation — what is automated, and the one step that is not

Reordering or retiring lessons in a **deployed** course is safe by machinery,
not by care. The mechanism is worth knowing because the failure it prevents
(#740/#741) is silent when it happens.

**A learner's on-chain progress bit is the lesson's SLOT, from
`slots.lock.json` — never its position in `course.yaml`.**

- `getLessonSlot()` (`apps/web/src/lib/courses/lesson-slot.ts`) resolves the slot
  from the committed lock at request time. It is what
  `/api/lessons/complete` sends to `complete_lesson`, what it tests the
  enrollment bitmap against, and what it writes to `user_progress.lesson_index`.
  It **fails closed** — an unslotted lesson id throws rather than guessing.
- `findLessonIndex()` (`lesson-index.ts`) is the array position and is
  **display-only**. Conflating the two _was_ the #741 bug; it is fixed.
- `deriveActiveMask()` (`lib/github/content-commit.ts`) builds the on-chain
  `active_lessons` mask from the same lock, so the chain's live-lesson set and
  the authored lock cannot disagree.

Slots are assigned once, never renumbered, never reused, and `next` only grows.
**CI gate-3** (`packages/content-lint/src/checks/gate3-slots.ts`) diffs the lock
against the merge base on every academy-courses PR and fails the build if a
surviving lesson's slot moved, a retired slot was reused, or `next` went
backwards. That gate — not a hand diff of `course.yaml` — is the safety net.
`course.yaml` order is decoupled from slot assignment by design, so reordering
it is not by itself a hazard.

> Do **not** hand-diff lesson arrays to decide whether a reshape is safe: a
> `course.yaml`-only diff both flags safe reorders and misses real lock
> violations. Read gate-3's verdict instead.

#### The residual step: push the mask after retiring a lesson

The one thing no gate does for you is **update the on-chain mask**. Bumping
`content.lock` ships new content to the app; it does not touch the chain. The
mask goes out through the admin course sync (`/admin/courses` → the
content-hash commit, which sends `newActiveLessons` derived from the lockfile).

This matters in one direction. `finalize_course` is a **subset test** — it
requires `flags & active == active` (see `isCourseComplete` in
`lib/solana/bitmap.ts`). So:

- **Retiring a lesson without syncing the mask blocks completion.** The chain
  still lists the retired slot as active, so every learner who had not already
  completed that now-deleted lesson can never satisfy the gate. They cannot
  complete it either — it is gone from the bundle.
- Adding a lesson without syncing is benign by comparison: the new slot is
  simply not yet required.

**After any bump that retires a slot:**

1. [ ] Bump `content.lock` and commit the regenerated bundle together (see
       [Publishing new content](#publishing-new-content); CI byte-compares).
2. [ ] Run the course sync from `/admin/courses` so `active_lessons` matches the
       lockfile. `assertMaskMatchesLockfile` guards the signed mask against a
       mismatch, so a wrong mask is refused rather than written.
3. [ ] Spot-check a learner mid-course can still finalize.

**Symptom to recognize:** completion 500s citing an unslotted lesson mean the
bundle carries a lesson the lock does not — `getLessonSlot` refusing to guess.
Regenerate the lock rather than adding a fallback; the fail-closed behaviour is
deliberate, because a wrong slot corrupts on-chain state.

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

### 3. No App Env Var Needed

Google OAuth runs through Supabase Auth — enter the **Client ID** and **Client Secret** in the Supabase dashboard (**Authentication → Providers → Google**), not in the app's environment. The app has no `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.

GitHub OAuth works the same way — enable the GitHub provider in Supabase and add
the callback URL to your GitHub OAuth app.

> **When Dynamic is configured, it owns the Google and GitHub handshakes** and
> the Supabase providers become the fallback path. Configure both anyway: SIWS
> and Supabase OAuth are the kill switch if Dynamic is unavailable. See
> [AUTH-FLOWS.md](./AUTH-FLOWS.md).

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
export ALLOWED_ORIGIN=https://superteam-academy-web.vercel.app

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
# Public DSN — bundled client-side; safe to expose. Drives client + server + edge
# error reporting via the @sentry/nextjs instrumentation files.
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# Optional — source-map upload at build time (CI/Vercel only). Server-only.
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
SENTRY_AUTH_TOKEN=your-auth-token
```

Sign up at [sentry.io](https://sentry.io).

---

## Custom Domain

### 1. Add Domain in Vercel

1. Go to **Vercel → Project → Settings → Domains**
2. Add your custom domain (e.g., `academy.example.com`)
3. Follow Vercel's DNS instructions (add CNAME or A records)

### 2. Update Environment Variables

| Variable              | New Value                     |
| --------------------- | ----------------------------- |
| `NEXT_PUBLIC_APP_URL` | `https://academy.example.com` |

### 3. Update External Services

When changing domains, update all of these:

- **Supabase**: Update **Site URL** and **Redirect URLs** in Authentication settings
- **Google OAuth**: Add new domain to authorized redirect URIs in [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- **Build Server**: Update `ALLOWED_ORIGIN` env var in Cloud Run

---

## Post-Deployment Checklist

After deploying, verify:

- [ ] Landing page loads without errors
- [ ] Courses display correctly (served from the committed bundle; a course only
      appears once its `onchain_deployments` row is `synced` + active)
- [ ] SIWS works with an external wallet (the guaranteed path — test this one
      even if Dynamic is configured)
- [ ] Google / GitHub sign-in works, through whichever rail is live
- [ ] `/admin` 404s for a non-allowlisted account and loads for an allowlisted one
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

### Content

- The content bundle is statically imported at build time — **zero** network hops
  and zero cache misses on the read path
- Course assets are served from `public/content-assets/` by Vercel's CDN
- The only per-request content dependency is the on-chain deployment status map
  (Supabase), which is wrapped in `unstable_cache` (tag `courses`, 3600s) with a
  cookieless anon client so catalog and lesson routes stay static/ISR. An admin
  course sync purges the tag via `revalidateTag`.

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
| Solana Devnet | Free, rate-limited                          | Moving to mainnet         |
| Cloud Run     | 2M requests/month, 360K vCPU-sec free       | High build volume         |
| Artifact Reg. | 500MB storage free                          | Many image versions       |
