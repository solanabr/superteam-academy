# Superteam Academy — Complete Project Guide

Decentralized learning platform for Solana developers. Learners enroll in courses, complete interactive coding challenges, earn soulbound XP tokens, receive Metaplex Core credential NFTs, and collect achievement badges — all on Solana devnet.

Built as a submission for the [Superteam Brazil LMS dApp bounty](https://superteam.fun/listings/superteam-academy).

---

## Table of Contents

- [Live Demo](#live-demo)
- [On-Chain Program](#on-chain-program)
- [What We Built](#what-we-built)
- [Bounty Requirements vs Delivered](#bounty-requirements-vs-delivered)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Step-by-Step Project Setup](#step-by-step-project-setup)
  - [Step 1: Clone the Repository](#step-1-clone-the-repository)
  - [Step 2: Set Up Supabase](#step-2-set-up-supabase)
  - [Step 3: Set Up Sanity CMS](#step-3-set-up-sanity-cms)
  - [Step 4: Set Up Authentication](#step-4-set-up-authentication)
  - [Step 5: Set Up Solana RPC](#step-5-set-up-solana-rpc)
  - [Step 6: Set Up Analytics (Optional)](#step-6-set-up-analytics-optional)
  - [Step 7: Configure Frontend Environment](#step-7-configure-frontend-environment)
  - [Step 8: Configure Backend Environment](#step-8-configure-backend-environment)
  - [Step 9: Install Dependencies and Start](#step-9-install-dependencies-and-start)
  - [Step 10: Seed Content and Verify](#step-10-seed-content-and-verify)
- [Environment Variables Reference](#environment-variables-reference)
- [Deployment Guide](#deployment-guide)
  - [Frontend on Vercel](#frontend-on-vercel)
  - [Backend on Railway](#backend-on-railway)
  - [Why Railway for the Backend?](#why-railway-for-the-backend)
- [Database Schema](#database-schema)
- [All Features in Detail](#all-features-in-detail)
  - [10 Core Pages](#10-core-pages)
  - [Bonus Features](#bonus-features)
  - [Gamification System](#gamification-system)
  - [On-Chain Integration](#on-chain-integration)
  - [Analytics](#analytics)
  - [Internationalization](#internationalization)
  - [Themes](#themes)
  - [PWA Support](#pwa-support)
  - [E2E Testing](#e2e-testing)
- [Project Structure](#project-structure)
- [Frontend Deep Dive](#frontend-deep-dive)
  - [Service Layer](#service-layer)
  - [Custom Hooks](#custom-hooks)
  - [API Routes](#api-routes)
  - [Provider Hierarchy](#provider-hierarchy)
- [Backend Deep Dive](#backend-deep-dive)
  - [API Endpoints](#api-endpoints)
  - [Request Flow](#request-flow)
  - [Security Model](#security-model)
- [CMS Content Management](#cms-content-management)
- [Performance](#performance)
- [Documentation Index](#documentation-index)
- [License](#license)

---

## Live Demo

| Service | URL | Host |
|---------|-----|------|
| **Frontend** | *https://0xharp-superteam-academy-private.vercel.app/* | Vercel |
| **Backend** | *https://0xharp-superteam-academy-private-backend.up.railway.app/health* | Railway |

---

## On-Chain Program

Deployed on Solana Devnet. The on-chain program was pre-existing in the repo — our submission is the `app/` and `backend/` directories.

| | Address | Explorer |
|---|---|---|
| **Program** | `GuBhF6hk5yKhnvU5712LZwUPaoAmoxtJf9GTh4CHTxsF` | [View on Explorer](https://explorer.solana.com/address/GuBhF6hk5yKhnvU5712LZwUPaoAmoxtJf9GTh4CHTxsF?cluster=devnet) |
| **XP Mint** | `F1PbQKRkn3UXnhCJErDSAtNmiScKPdMpwJxLLR7F3JQM` | [View on Explorer](https://explorer.solana.com/address/F1PbQKRkn3UXnhCJErDSAtNmiScKPdMpwJxLLR7F3JQM?cluster=devnet) |

---

## What We Built

This submission delivers a **production-ready, full-stack learning management system** with actual Solana devnet integration — not mocks. The platform covers:

- **10 core pages** — all functional, responsive, accessible
- **Interactive code editor** — Monaco Editor with Rust and TypeScript support, live test execution, pass/fail feedback
- **On-chain enrollment** — learners sign enrollment transactions directly from their wallet
- **Soulbound XP tokens** — Token-2022 with NonTransferable + PermanentDelegate extensions
- **Credential NFTs** — Metaplex Core soulbound NFTs that upgrade in place per learning track
- **Leaderboard synced from on-chain data** — via Helius DAS API, not mock data
- **Triple-layer analytics** — GA4 + PostHog (heatmaps) + Sentry (error monitoring), 22 custom events
- **3 languages** — English, Portuguese (PT-BR), Spanish — 795 translated strings per locale
- **3 themes** — Light, Dark, Brasil (Brazilian flag green and gold palette)
- **Admin dashboard** — 7 management tabs for courses, users, achievements, challenges, tracks, analytics, stats
- **Community forum** — posts, replies, likes, tags, search, course-specific threads
- **Course creator wizard** — multi-step course creation with admin approval workflow
- **234 Playwright E2E test cases** across 13 test files — covering all critical flows
- **PWA support** — installable, offline fallback, app shortcuts

---

## Bounty Requirements vs Delivered

### Required Deliverables

| Requirement | Status | Details |
|-------------|--------|---------|
| PR to github.com/solanabr/superteam-academy | Done | Full frontend + backend in `app/` and `backend/` |
| All 10 core pages functional | Done | Landing, Catalog, Course Detail, Lesson View, Code Challenge, Dashboard, Profile, Leaderboard, Settings, Certificate View |
| Wallet auth | Done | Solana SIWS (Sign-In With Solana) + multi-wallet adapter |
| Google sign-in | Done | NextAuth 5.0.0 with Google OAuth |
| GitHub sign-in (bonus) | Done | NextAuth 5.0.0 with GitHub OAuth |
| Account linking | Done | Link wallet + Google + GitHub to single account |
| Gamification system | Done | XP, levels, streaks with freezes, achievements, daily challenges |
| Code editor integration | Done | Monaco Editor — Rust + TypeScript syntax, autocompletion, error display |
| i18n (PT-BR, ES, EN) | Done | next-intl, 795 strings per locale, language switcher |
| Light/dark themes | Done | Light + Dark + Brasil (3 themes total) |
| Responsive | Done | Mobile-first, all breakpoints tested |
| Lighthouse targets met | Done | Reports in `docs/LighthouseReport*.html` |
| GA4 with custom events | Done | 22 custom events via unified `trackEvent()` |
| Heatmap solution | Done | PostHog with `enable_heatmaps: true`, autocapture, click/scroll maps |
| Sentry error monitoring | Done | Client + server configs, error boundaries, instrumented catch blocks |
| CMS configured | Done | Sanity with 5 schema types, embedded Studio, webhook revalidation |
| Sample course imported | Done | Seed script: `pnpm seed-sanity` |
| Deployed on Vercel | Done | Frontend with preview deployments |
| README.md | Done | This document + root README.md |
| ARCHITECTURE.md | Done | `docs/ARCHITECTURE_APP.md` (app layer) + `docs/ARCHITECTURE.md` (on-chain) |
| CMS_GUIDE.md | Done | `docs/CMS_GUIDE.md` |
| CUSTOMIZATION.md | Done | `docs/CUSTOMIZATION.md` |

### Bonus Features

| Bonus | Status | Details                                                                                                                                                                                                                     |
|-------|--------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Admin dashboard | Done | `/admin` — 7 tabs: courses, users, achievements, daily challenges, tracks, analytics, stats                                                                                                                                 |
| E2E tests | Done | 234 test cases across 13 Playwright test files (multi-viewport: desktop + mobile) covering auth, courses, lessons, dashboard, leaderboard, profile, settings, community, gamification, i18n, admin, error handling, landing |
| Community/forum | Done | `/community` — posts, replies, likes, tags, search, course-specific threads                                                                                                                                                 |
| Onboarding flow with skill assessment | Done | `/onboarding` — quiz-based path recommendations by experience level + web3 knowledge + interests                                                                                                                            |
| PWA support | Done | Web app manifest, service worker (`public/sw.js`), offline fallback page (`public/offline.html`), installable, shortcuts                                                                                                    |
| Advanced gamification | Done | Daily coding challenges (quiz format), streak freezes (3/month auto-refresh), achievements, level-ups, XP history                                                                                                           |
| CMS course creator dashboard | Done | `/creator` — multi-step wizard, lesson editor, thumbnail upload, track assignment, admin approval                                                                                                                           |
| Actual devnet integration | Done | On-chain enrollment, XP minting (Token-2022), credential NFTs (Metaplex Core), leaderboard from on-chain balances (Helius DAS), achievement NFTs                                                                            |

**All 8 required deliverables and all 8 bonus features delivered.**

---

## Tech Stack

### Frontend (`app/` — 201 TypeScript/TSX files)

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | Next.js (App Router, Server Components) | 16.1.6 |
| UI Library | React | 19.2.3 |
| Language | TypeScript (strict mode, no `any`) | 5.x |
| Styling | Tailwind CSS | 4.x |
| Components | Shadcn/ui + Radix UI | Latest |
| Auth | NextAuth (Google, GitHub, Solana SIWS) | 5.0.0-beta.30 |
| Database | Supabase (PostgreSQL + Storage + RLS) | 2.95.3 |
| CMS | Sanity (embedded Studio via next-sanity) | 5.10.0 |
| Code Editor | Monaco Editor | 0.55.1 |
| i18n | next-intl | 4.8.2 |
| Analytics | PostHog (heatmaps, autocapture) | 1.347.2 |
| Error Monitoring | Sentry | 10.38.0 |
| Charts | Recharts | 3.7.0 |
| Wallet | @solana/wallet-adapter | 0.15.39 |
| Solana | @solana/web3.js + @coral-xyz/anchor | 1.98.4 / 0.32.1 |
| Token | @solana/spl-token (Token-2022) | 0.4.14 |
| E2E Testing | Playwright | 1.58.2 |
| Markdown | react-markdown + rehype-highlight + remark-gfm | Latest |
| Validation | Zod | 4.3.6 |

### Backend (`backend/` — 14 API endpoints)

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | Hono (@hono/node-server) | 4.6.14 |
| Solana Client | @coral-xyz/anchor | 0.31.1 |
| NFT Operations | @metaplex-foundation/mpl-core + umi | 1.7.0 / 1.5.1 |
| Auth | jose (JWT verification) | 5.9.6 |
| Token | @solana/spl-token (Token-2022 ATA creation) | 0.4.9 |
| Dev Server | tsx (hot reload) | 4.19.2 |

### On-Chain Program (`onchain-academy/` — pre-existing)

| Category | Technology |
|----------|-----------|
| Framework | Anchor 0.31+ |
| Language | Rust 1.82+ |
| XP Tokens | Token-2022 (NonTransferable + PermanentDelegate) |
| Credentials | Metaplex Core NFTs (PermanentFreezeDelegate) |
| Testing | 77 Rust unit tests + 62 TypeScript integration tests |
| Indexing | Helius DAS API |

---

## Architecture Overview

```
                        User Browser
                             |
              +--------------+--------------+
              |                             |
         Next.js 16                   Solana Wallet
         (Vercel)                          |
              |                    Direct on-chain tx
              |                    (enrollment only)
    +---------+---------+
    |         |         |
 Supabase  Sanity    Helius
 (DB/Auth) (CMS)    (DAS API)
              |
              | JWT-authenticated calls
              v
          Hono Server
          (Railway)
              |
         +---------+
         |         |
    Anchor       Metaplex
    Program      Core (UMI)
    (devnet)     (devnet)
         |
    Token-2022
    XP Mint
```

**Three tiers:**

1. **Frontend** (Next.js on Vercel) — UI, auth, data orchestration, Sanity Studio
2. **Backend** (Hono on Railway) — Transaction signing, keypair custody, on-chain writes
3. **Data** (Supabase + Sanity + Solana) — User state, course content, on-chain state

For the full architecture document with data flow diagrams, service layer details, and component structure, see [ARCHITECTURE_APP.md](./ARCHITECTURE_APP.md).

---

## Prerequisites

Before starting, you need:

| Tool | Version | Check | Install |
|------|---------|-------|---------|
| Node.js | 20+ | `node -v` | [nodejs.org](https://nodejs.org) |
| pnpm | 9+ | `pnpm -v` | `npm install -g pnpm` |
| npm | 10+ | `npm -v` | Comes with Node.js |
| Git | Any | `git -v` | [git-scm.com](https://git-scm.com) |

**Accounts you will create during setup:**

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| [Supabase](https://supabase.com) | Database, auth, file storage | 2 free projects |
| [Sanity](https://sanity.io) | CMS for course content | Free for small projects |
| [Google Cloud Console](https://console.cloud.google.com) | Google OAuth credentials | Free |
| [GitHub Developer Settings](https://github.com/settings/developers) | GitHub OAuth credentials | Free |
| [Helius](https://helius.dev) | Solana RPC + DAS API | 50k credits/day free |
| [PostHog](https://posthog.com) | Heatmaps + product analytics (optional) | 1M events/month free |
| [Sentry](https://sentry.io) | Error monitoring (optional) | 5k errors/month free |
| [Google Analytics](https://analytics.google.com) | GA4 (optional) | Free |

---

## Step-by-Step Project Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/solanabr/superteam-academy.git
cd superteam-academy
```

Verify the directory structure:

```bash
ls
# You should see: app/  backend/  docs/  onchain-academy/  CLAUDE.md  README.md  ...
```

---

### Step 2: Set Up Supabase

Supabase provides the PostgreSQL database, user state storage, avatar file storage, and row-level security.

**2a. Create a Supabase project:**

1. Go to [supabase.com](https://supabase.com) and sign up / sign in
2. Click **New Project**
3. Choose an organization, name your project (e.g., `superteam-academy`), set a database password, choose a region close to your users
4. Wait for the project to finish provisioning (takes ~1 minute)

**2b. Get your API credentials:**

1. In the Supabase dashboard, go to **Settings** (gear icon) -> **API**
2. Copy these values — you will need them for the frontend `.env.local`:
   - **Project URL** -> `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** (under Project API keys) -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** (under Project API keys) -> `SUPABASE_SERVICE_ROLE_KEY`

**2c. Run the database migration:**

1. In the Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Open the file `app/supabase/migrations/001_schema.sql` from this repo
4. Copy the entire contents and paste it into the SQL editor
5. Click **Run** (or press Ctrl+Enter)

This creates 11 tables with row-level security, indexes, and triggers:
- `profiles`, `accounts`, `user_stats`, `community_posts`, `post_likes`
- `daily_challenges`, `daily_challenge_completions`, `xp_transactions`
- `system_config`, `newsletter_subscribers`, `testimonials`

**2d. Create the avatars storage bucket:**

1. In the Supabase dashboard, go to **Storage** (left sidebar)
2. Click **New Bucket**
3. Name it `avatars`
4. Set it as **Public** (toggle public access on)
5. Click **Create Bucket**

**2e. (Optional) Enable Google/GitHub OAuth in Supabase Auth:**

Only needed if you want Supabase-level OAuth (the app uses NextAuth directly, so this step is usually not required). Skip unless you are extending auth.

---

### Step 3: Set Up Sanity CMS

Sanity manages all course content — courses, modules, lessons, instructors, tracks.

**3a. Create a Sanity project:**

1. Go to [sanity.io/manage](https://www.sanity.io/manage)
2. Sign up / sign in
3. Click **Create New Project**
4. Name it (e.g., `superteam-academy`)
5. Choose the **Free** plan
6. Copy the **Project ID** from the project dashboard -> `NEXT_PUBLIC_SANITY_PROJECT_ID`
7. The default dataset is `production` -> `NEXT_PUBLIC_SANITY_DATASET=production`

**3b. Generate an API token:**

1. In your Sanity project dashboard, go to **API** -> **Tokens**
2. Click **Add API Token**
3. Name: `superteam-academy-editor`
4. Permissions: **Editor** (needs write access for the seed script and creator dashboard)
5. Click **Save** and copy the token -> `SANITY_API_TOKEN`

**3c. Add CORS origin:**

1. In your Sanity project dashboard, go to **API** -> **CORS Origins**
2. Add `http://localhost:3000` (for local dev)
3. Check **Allow credentials**
4. If deploying, also add your Vercel URL

**3d. (Optional) Set up the Sanity webhook:**

For real-time content updates when editors publish in Sanity Studio:

1. Go to **API** -> **Webhooks** in the Sanity dashboard
2. Click **Create Webhook**
3. URL: `https://your-domain.com/api/webhooks/sanity`
4. Trigger on: Create, Update, Delete
5. Projection: `{_type}`
6. Generate a secret: `openssl rand -hex 32`
7. Paste the secret in the webhook form and save it for your `.env.local` -> `SANITY_WEBHOOK_SECRET`

---

### Step 4: Set Up Authentication

The app uses NextAuth 5.0.0 with three providers: Google OAuth, GitHub OAuth, and Solana SIWS (Sign-In With Solana).

**4a. Generate AUTH_SECRET:**

```bash
openssl rand -base64 32
```

Copy the output. This secret is shared between the frontend (NextAuth) and backend (JWT verification) — they must match exactly.

**4b. Set up Google OAuth:**

1. Go to [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select an existing one
3. If prompted, configure the **OAuth consent screen**:
   - User type: **External**
   - App name: `Superteam Academy`
   - Support email: your email
   - Add your email as a test user
4. Go back to **Credentials** -> **Create Credentials** -> **OAuth client ID**
5. Application type: **Web application**
6. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
7. Click **Create**
8. Copy:
   - **Client ID** -> `GOOGLE_ID`
   - **Client Secret** -> `GOOGLE_SECRET`

For production, add your Vercel URL as an additional redirect URI.

**4c. Set up GitHub OAuth:**

1. Go to [github.com/settings/developers](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in:
   - Application name: `Superteam Academy`
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Click **Register application**
5. Copy:
   - **Client ID** -> `GITHUB_ID`
   - Click **Generate a new client secret** -> `GITHUB_SECRET`

For production, update the URLs to your Vercel domain.

**4d. Wallet auth (SIWS):**

No setup needed — Sign-In With Solana works out of the box via the Solana Wallet Adapter. Users connect any Solana wallet (Phantom, Solflare, Backpack, etc.) and sign a message to authenticate.

---

### Step 5: Set Up Solana RPC

**5a. Get a Helius API key:**

1. Go to [helius.dev](https://helius.dev) and sign up
2. Create a new project
3. Copy your API key
4. Your devnet RPC URL: `https://devnet.helius-rpc.com/?api-key=YOUR_KEY`

Helius is used for both RPC calls and the DAS API (Digital Asset Standard) which powers credential NFT queries and leaderboard XP syncing.

**5b. Alternative RPC providers:**

| Provider | Free Tier | URL Format |
|----------|-----------|------------|
| [Helius](https://helius.dev) (recommended) | 50k credits/day | `https://devnet.helius-rpc.com/?api-key=KEY` |
| [QuickNode](https://quicknode.com) | Limited | Dashboard endpoint |
| Public devnet (rate limited) | Unlimited but slow | `https://api.devnet.solana.com` |

**5c. Backend keypairs:**

The backend needs two keypairs:

1. **Backend Signer** — Signs lesson completion, credential issuance, XP minting transactions. Must be registered in the on-chain program's Config as `backend_signer`.
2. **Authority** — Signs admin operations (course creation, track management, achievement types). Must match the program's Config `authority`.

For testing with the existing devnet deployment, you need the keypairs that were used during the original program setup. If you are deploying your own program instance, see `docs/DEPLOY-PROGRAM.md`.

Keypair formats accepted by the backend:

```bash
# File path
BACKEND_SIGNER_KEYPAIR=../wallets/backend-signer.json

# JSON array
BACKEND_SIGNER_KEYPAIR=[123,45,67,...]

# Base58 private key
BACKEND_SIGNER_KEYPAIR=5Jx3...base58key
```

---

### Step 6: Set Up Analytics (Optional)

Analytics are optional — the app works without them. When env vars are not set, analytics calls are silently skipped.

**6a. PostHog (heatmaps + product analytics):**

1. Sign up at [posthog.com](https://posthog.com) (1M events/month free)
2. Go to **Settings** -> **Project** -> **API Key**
3. Copy the project API key -> `NEXT_PUBLIC_POSTHOG_KEY`
4. Host: `https://us.i.posthog.com` -> `NEXT_PUBLIC_POSTHOG_HOST`

PostHog provides: click/scroll heatmaps, session recordings, autocapture, custom events, user identification.

**6b. Google Analytics 4:**

1. Go to [analytics.google.com](https://analytics.google.com)
2. Create a property for your site
3. Get the Measurement ID (starts with `G-`) -> `NEXT_PUBLIC_GA_ID`

**6c. Sentry (error monitoring):**

1. Sign up at [sentry.io](https://sentry.io) (5k errors/month free)
2. Create a **Next.js** project
3. Copy the DSN from **Settings** -> **Client Keys** -> `SENTRY_DSN`

---

### Step 7: Configure Frontend Environment

```bash
cd app
cp .env.example .env.local
```

Open `.env.local` and fill in the values from Steps 2-6:

```bash
# ===========================================
# Superteam Academy Frontend — .env.local
# ===========================================

# --- Supabase (Step 2) ---
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...

# --- Sanity CMS (Step 3) ---
NEXT_PUBLIC_SANITY_PROJECT_ID=abc123xyz
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=skxxxxxxxxxxxxxxx
SANITY_WEBHOOK_SECRET=                  # Optional: openssl rand -hex 32

# --- Auth (Step 4) ---
AUTH_SECRET=your_base64_secret          # openssl rand -base64 32
GOOGLE_ID=xxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxx
GITHUB_ID=Iv1.xxxxxxxxxxxx
GITHUB_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# --- Solana (Step 5) ---
NEXT_PUBLIC_SOLANA_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_KEY
HELIUS_API_KEY=YOUR_KEY

# --- Backend ---
BACKEND_URL=http://localhost:3001

# --- Analytics (Step 6, all optional) ---
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
SENTRY_DSN=https://xxxx@xxx.ingest.sentry.io/xxxxx

# --- Cron (for leaderboard sync) ---
CRON_SECRET=                            # openssl rand -hex 16
```

---

### Step 8: Configure Backend Environment

```bash
cd backend
cp .env.example .env
```

Open `.env` and fill in:

```bash
# ===========================================
# Superteam Academy Backend — .env
# ===========================================

# --- Solana RPC (Step 5) ---
SOLANA_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_KEY

# --- Keypairs (Step 5c) ---
BACKEND_SIGNER_KEYPAIR=../wallets/backend-signer.json
AUTHORITY_KEYPAIR=../wallets/signer.json

# --- Auth (Step 4a — MUST match frontend AUTH_SECRET) ---
AUTH_SECRET=your_base64_secret

# --- Sanity (Step 3) ---
SANITY_PROJECT_ID=abc123xyz
SANITY_DATASET=production

# --- Server ---
PORT=3001
APP_ORIGIN=http://localhost:3000
```

**Critical:** `AUTH_SECRET` must be identical in both `.env.local` (frontend) and `.env` (backend). The backend validates JWTs issued by NextAuth using this shared secret.

---

### Step 9: Install Dependencies and Start

Open **two terminal windows**.

**Terminal 1 — Frontend:**

```bash
cd app
pnpm install
pnpm dev
```

The frontend starts at `http://localhost:3000`.

**Terminal 2 — Backend:**

```bash
cd backend
npm install
npm run dev
```

The backend starts at `http://localhost:3001`.

**Verify both are running:**

- Frontend: Open `http://localhost:3000` — you should see the landing page
- Backend: Open `http://localhost:3001/health` — you should see `{"status":"ok"}`
- Sanity Studio: Open `http://localhost:3000/studio` — you should see the Sanity content editor

---

### Step 10: Seed Content and Verify

**10a. Seed sample course content into Sanity:**

```bash
cd app
pnpm seed-sanity
```

This creates a sample "Introduction to Solana" course with modules, lessons (content + challenge types), and an instructor profile.

**10b. Set up on-chain achievements (requires devnet keypairs):**

```bash
cd app
pnpm setup-achievements
```

This creates achievement type PDAs and Metaplex Core collections on devnet.

**10c. Verify everything works:**

1. Open `http://localhost:3000` — landing page loads with hero, stats, testimonials
2. Click **Courses** — sample course appears in the catalog
3. Click on the course — course detail page with modules and lessons
4. Sign in with Google or GitHub — redirected to dashboard
5. Connect a Solana wallet (Phantom recommended with devnet SOL)
6. Enroll in the course — wallet approval modal, transaction confirmed
7. Open a lesson — content renders, Monaco editor appears for challenges
8. Switch language (header dropdown) — UI updates to PT-BR or ES
9. Switch theme (header toggle) — Light/Dark/Brasil themes
10. Check `http://localhost:3000/studio` — Sanity Studio loads

**10d. Run E2E tests:**

```bash
cd app
npx playwright install    # First time only — installs browser binaries
pnpm test:e2e
```

13 test files covering: auth, courses, lessons, dashboard, leaderboard, profile, settings, community, gamification, i18n, admin, error handling, landing.

---

## Environment Variables Reference

### Frontend (`app/.env.local`) — Complete List

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | — | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | — | Supabase anonymous API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | — | Supabase service role key (server-side only) |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Yes | — | Sanity project ID |
| `NEXT_PUBLIC_SANITY_DATASET` | No | `production` | Sanity dataset name |
| `SANITY_API_TOKEN` | Yes | — | Sanity API token (Editor permissions) |
| `SANITY_WEBHOOK_SECRET` | No | — | HMAC secret for Sanity webhook verification |
| `AUTH_SECRET` | Yes | — | NextAuth session encryption secret |
| `GOOGLE_ID` | Yes | — | Google OAuth client ID |
| `GOOGLE_SECRET` | Yes | — | Google OAuth client secret |
| `GITHUB_ID` | Yes | — | GitHub OAuth client ID |
| `GITHUB_SECRET` | Yes | — | GitHub OAuth client secret |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | No | `https://api.devnet.solana.com` | Solana RPC endpoint |
| `HELIUS_API_KEY` | No | — | Helius API key for DAS queries |
| `BACKEND_URL` | No | `http://localhost:3001` | Backend server URL |
| `NEXT_PUBLIC_POSTHOG_KEY` | No | — | PostHog project API key |
| `NEXT_PUBLIC_POSTHOG_HOST` | No | `https://us.i.posthog.com` | PostHog instance URL |
| `NEXT_PUBLIC_GA_ID` | No | — | GA4 Measurement ID |
| `SENTRY_DSN` | No | — | Sentry DSN for error tracking |
| `CRON_SECRET` | No | — | Secret for Vercel cron job authentication |

### Backend (`backend/.env`) — Complete List

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SOLANA_RPC_URL` | Yes | — | Solana RPC endpoint (Helius recommended) |
| `BACKEND_SIGNER_KEYPAIR` | Yes | — | Keypair: file path, JSON array, or base58 |
| `AUTHORITY_KEYPAIR` | Yes | — | Admin authority keypair |
| `AUTH_SECRET` | Yes | — | Must match frontend `AUTH_SECRET` exactly |
| `SANITY_PROJECT_ID` | No | — | For track metadata resolution |
| `SANITY_DATASET` | No | `production` | Sanity dataset |
| `PORT` | No | `3001` | HTTP server port |
| `APP_ORIGIN` | No | `http://localhost:3000` | CORS allowed origin |

---

## Deployment Guide

### Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **Add New** -> **Project**
3. Import the GitHub repository
4. Configure:
   - **Root Directory**: `app`
   - **Framework Preset**: Next.js (auto-detected)
   - **Build Command**: `pnpm build`
   - **Install Command**: `pnpm install`
5. Add all frontend environment variables from the table above
6. Update `BACKEND_URL` to point to your Railway backend URL
7. Click **Deploy**

Preview deployments are enabled automatically — every PR gets a unique preview URL.

The `vercel.json` config includes:
- A daily cron job at `/api/leaderboard/sync` to sync on-chain XP data
- Cache headers for the service worker and manifest

### Backend on Railway

1. Go to [railway.app](https://railway.app) and sign in
2. Click **New Project** -> **Deploy from GitHub**
3. Select the repo and configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
4. Add all backend environment variables
5. Set `APP_ORIGIN` to your Vercel frontend URL (for CORS)
6. Railway assigns a public URL — use this as `BACKEND_URL` in the frontend env

### Why Railway for the Backend?

The backend holds a `backend_signer` keypair that signs Solana transactions. This requires a **long-running server process** — not a serverless function. Reasons:

1. **Keypair persistence** — The signing keypair must stay loaded in memory. Serverless cold starts would require re-reading the key on every invocation.
2. **Connection state** — Transaction building with Anchor requires a consistent `Connection` and `Program` instance. Re-initializing these on every request adds latency.
3. **Timeout constraints** — Solana transaction confirmation can take 5-30 seconds. Vercel serverless functions have a 10-second timeout on the free tier.
4. **Cost efficiency** — A single always-on container on Railway costs less than thousands of serverless invocations for transaction signing.

The frontend is stateless and deploys normally on Vercel with no issues.

---

## Database Schema

11 tables in Supabase PostgreSQL with row-level security on every table.

| Table | Rows per User | Purpose |
|-------|---------------|---------|
| `profiles` | 1 | Username, display name, bio, avatar, social links, preferences, admin flag |
| `accounts` | 1-3 | Linked OAuth/wallet accounts (Google, GitHub, Solana wallet) |
| `user_stats` | 1 | Current streak, longest streak, last activity date, streak freezes |
| `community_posts` | 0-N | Forum posts and replies (title, content, course_id, parent_id, tags) |
| `post_likes` | 0-N | Many-to-many likes on community posts |
| `daily_challenges` | N/A (admin) | Daily quiz pool (question, options, correct_index, xp_reward, category) |
| `daily_challenge_completions` | 0-1/day | Per-user daily challenge completion (one per day) |
| `xp_transactions` | 0-N | XP event log synced from on-chain (source, amount, tx_signature, course_id) |
| `system_config` | N/A | Platform config key-value pairs (leaderboard sync cursor) |
| `newsletter_subscribers` | 0-1 | Newsletter email subscriptions |
| `testimonials` | 0-N | User testimonials (admin-curated for landing page) |

Key constraints:
- Unique index on `(tx_signature, user_id)` in `xp_transactions` — prevents duplicate syncs
- GIN index on `tags` in `community_posts` — fast tag filtering
- Unique index on `(user_id, challenge_date)` in `daily_challenge_completions` — one per day

Migration file: `app/supabase/migrations/001_schema.sql`

---

## All Features in Detail

### 10 Core Pages

| # | Page | Route | Key Features |
|---|------|-------|-------------|
| 1 | **Landing** | `/` | Hero with CTAs, learning path previews, platform stats (courses, learners, XP minted), testimonials carousel, partner logos, newsletter signup, footer |
| 2 | **Course Catalog** | `/courses` | Filterable grid (difficulty, topic, track, duration), full-text search, course cards with thumbnail/title/progress/difficulty/XP, curated learning paths |
| 3 | **Course Detail** | `/courses/[slug]` | Course header (title, instructor, difficulty, duration), expandable module list with completion checkmarks, progress bar, XP to earn, on-chain enrollment button, prerequisite check |
| 4 | **Lesson View** | `/courses/[slug]/lessons/[id]` | Split layout: markdown content (left) + Monaco editor (right), resizable panels, syntax highlighting (Rust/TypeScript/JSON), previous/next navigation, expandable hints, solution toggle, auto-save |
| 5 | **Code Challenge** | *(within lesson view)* | Challenge prompt with objectives, visible test cases with pass/fail indicators, pre-populated starter code, Run button with loading state, real-time output display, error messages, success celebration, XP award |
| 6 | **Dashboard** | `/dashboard` | Current courses with progress %, XP balance + level progress bar, streak calendar visualization, achievement grid with claim buttons, daily challenge card, recommended courses, recent activity feed |
| 7 | **Profile** | `/profile/[username]` | Avatar, name, bio, social links, join date, skill radar chart (Recharts), achievement showcase, credential NFT cards with Explorer links, completed courses list, public/private visibility |
| 8 | **Leaderboard** | `/leaderboard` | Weekly/monthly/all-time tabs, course-specific filter, user cards (rank, avatar, name, XP, level, streak), current user highlighted, synced from on-chain XP |
| 9 | **Settings** | `/settings` | Profile editing (name, bio, avatar upload, social links), account management (linked wallets, Google, GitHub), preferences (language, theme, notifications), privacy (visibility, data export) |
| 10 | **Certificate** | `/certificates/[id]` | Visual certificate with course name + date + recipient, on-chain verification link (Solana Explorer), social sharing buttons, downloadable image (html-to-image), NFT details (mint address, metadata, ownership) |

### Bonus Features

| Feature | Route | Description |
|---------|-------|-------------|
| **Admin Dashboard** | `/admin` | 7 tabs: Courses (approve/reject submissions, set active/inactive), Users (browse, view stats, manage roles), Achievements (create/edit types, manage supply), Daily Challenges (CRUD quiz pool), Tracks (manage tracks + create Metaplex collections), Analytics (7d/30d XP distribution charts, signup trends), Stats (total users, active users, XP distributed) |
| **Community Forum** | `/community` | Post creation (title, content, tags, course association), reply threads, like/unlike toggle, course-specific filtering, tag filtering, search, sort (newest/oldest/popular), post type badges (question/discussion) |
| **Onboarding** | `/onboarding` | Multi-step quiz: experience level (beginner/intermediate/advanced), web3 knowledge level, interest areas. Generates personalized course recommendations. Marks user as onboarded in Supabase. |
| **Course Creator** | `/creator` | Dashboard listing user's courses, multi-step creation wizard (title -> description -> modules -> lessons -> review), inline lesson editor with markdown support, thumbnail upload to Supabase Storage, track assignment, submits for admin approval (`submissionStatus: "waiting"`) |
| **Course Preview** | `/courses/preview/[slug]` | Unauthenticated course preview — same layout as enrolled view but without completion tracking. Allows browsing before sign-up. |

### Gamification System

| Feature | Storage | Details |
|---------|---------|---------|
| **XP** | On-chain (Token-2022) | Soulbound tokens — NonTransferable + PermanentDelegate. Balance = user's XP. |
| **Levels** | Derived client-side | `Level = floor(sqrt(totalXP / 100))`. No storage needed. |
| **Streaks** | Supabase `user_stats` | Current streak, longest streak, streak freezes (3/month, auto-refresh). Calendar visualization in dashboard. Milestones at 3, 7, 14, 30 days. |
| **Achievements** | On-chain (Metaplex Core) | AchievementType + AchievementReceipt PDAs. Each award mints a soulbound NFT. Configurable supply caps and XP rewards. Auto-eligibility checks via `AchievementCheckerService`. |
| **Daily Challenges** | Supabase | Quiz-format coding questions. Admin-managed pool. One per user per day. XP reward on correct answer. |
| **Leaderboard** | Supabase (synced from chain) | Weekly/monthly/all-time. XP aggregated from `xp_transactions` table. Daily Vercel cron syncs on-chain data via Helius DAS API. |

### On-Chain Integration

| Feature | Implementation | How It Works |
|---------|---------------|-------------|
| **Enrollment** | Direct on-chain tx | Learner signs the `enroll` instruction directly from their wallet — no backend needed |
| **Lesson Completion** | Backend-signed tx | Frontend calls backend, backend builds + signs `complete_lesson` instruction, mints XP |
| **Course Finalization** | Auto-triggered | After last lesson completes, backend auto-calls `finalize_course` (awards bonus XP + creator reward) |
| **Credential Issuance** | Backend-signed tx | `issue_credential` creates soulbound Metaplex Core NFT; `upgrade_credential` updates existing one |
| **Achievement Awards** | Backend-signed tx | `award_achievement` mints soulbound achievement NFT + XP reward |
| **XP Balance** | Token-2022 query | Read `getTokenAccountBalance` on learner's ATA for the XP mint |
| **Credential Display** | Helius DAS API | `getAssetsByOwner` fetches Metaplex Core NFTs, parses track/level/XP attributes |
| **Leaderboard Sync** | Vercel cron + Helius | Daily job parses XP token transactions, upserts into `xp_transactions` table |

### Analytics

22 custom events across GA4 + PostHog + Sentry. All fire through a unified `trackEvent()` function.

| Category | Events |
|----------|--------|
| Navigation | `page_view`, `sign_in`, `language_changed`, `theme_changed`, `wallet_connected` |
| Course | `course_view`, `enrollment`, `unenrollment`, `course_complete` |
| Lesson | `lesson_start`, `lesson_complete`, `challenge_attempt`, `challenge_pass`, `challenge_fail` |
| Gamification | `xp_earned`, `level_up`, `achievement_unlocked`, `streak_milestone`, `streak_broken` |

PostHog heatmap and dashboard screenshots in `docs/screenshots/`. Full event catalog in [ANALYTICS.md](./ANALYTICS.md).

### Internationalization

- **3 locales**: English (`en`), Portuguese Brazil (`pt-BR`), Spanish (`es`)
- **795 translated strings** per locale in `app/src/messages/{locale}.json`
- **Route-level i18n**: `/en/courses`, `/pt-BR/courses`, `/es/courses`
- **Language switcher** in header and settings page
- **User preference** stored in Supabase `profiles.preferred_language`
- **Framework**: next-intl with App Router integration
- Course content remains in source language (managed via Sanity CMS)

### Themes

3 themes via CSS custom properties in `app/src/app/globals.css`:

| Theme | Class | Background | Primary | Accent | Design |
|-------|-------|-----------|---------|--------|--------|
| Light | `:root` | `#FAFAFA` | `#2f6b3f` (green) | `#e8f5ec` | Clean white, forest green accents |
| Dark | `.dark` | `#09090B` | `#ffd23f` (gold) | `#27272A` | Near-black zinc, gold highlights |
| Brasil | `.brasil` | `#1b231d` | `#ffd23f` (gold) | `#2f6b3f` | Brazilian flag colors — deep green background, warm gold primary, cream text |

Both Dark and Brasil share dark-mode component variants via `@custom-variant dark (&:is(.dark *, .brasil *))`.

Typography: Inter (body), Archivo (headings), Geist Mono (code).

See [CUSTOMIZATION.md](./CUSTOMIZATION.md) for adding new themes.

### PWA Support

- **Web App Manifest**: `app/src/app/manifest.ts` — name, icons (192x192, 512x512 + maskable), shortcuts (Dashboard, Courses, Leaderboard), categories
- **Service Worker**: `app/public/sw.js` — cache-first for assets, network-first for API calls
- **Offline Page**: `app/public/offline.html` — friendly offline fallback
- **Installable**: "Add to Home Screen" prompt on mobile and desktop
- **Theme Color**: `#1b231d` (matches Brasil theme)

### E2E Testing

**234 test cases** across 13 Playwright test files in `app/e2e/`, running on multiple viewports (desktop + mobile Chrome):

| Test File | Coverage |
|-----------|----------|
| `landing.spec.ts` | Landing page content, CTAs, navigation |
| `auth.spec.ts` | Sign-in flow, wallet linking |
| `courses.spec.ts` | Course browsing, filtering, enrollment |
| `lessons.spec.ts` | Lesson content, challenges, completion |
| `dashboard.spec.ts` | Dashboard loading, stats display |
| `leaderboard.spec.ts` | Leaderboard filtering, ranking |
| `profile.spec.ts` | Profile viewing, editing |
| `settings.spec.ts` | Settings form, preference changes |
| `community.spec.ts` | Post creation, filtering, liking |
| `gamification.spec.ts` | Streak, achievements, XP display |
| `i18n.spec.ts` | Locale switching (en, pt-BR, es) |
| `admin.spec.ts` | Admin page access, tab navigation |
| `error-handling.spec.ts` | 404/500 error pages |

Helper utilities in `app/e2e/helpers.ts`: `gotoWithLocale()`, `waitForLoad()`, `switchLocale()`.

```bash
cd app
npx playwright install    # First time only
pnpm test:e2e
```

---

## Project Structure

```
superteam-academy/
├── app/                                    # Next.js 16 frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── [locale]/                   # i18n route group
│   │   │   │   ├── admin/                  # Admin dashboard (7 tabs)
│   │   │   │   ├── auth/signin/            # Sign-in page
│   │   │   │   ├── certificates/[id]/      # Credential/certificate view
│   │   │   │   ├── community/              # Forum: list + [id] detail
│   │   │   │   ├── courses/                # Catalog + [slug] detail
│   │   │   │   │   └── [slug]/lessons/[id] # Lesson view + code editor
│   │   │   │   ├── creator/                # Course creator wizard
│   │   │   │   ├── dashboard/              # Learner dashboard
│   │   │   │   ├── leaderboard/            # XP rankings
│   │   │   │   ├── onboarding/             # Skill assessment quiz
│   │   │   │   ├── profile/[username]      # Public profile
│   │   │   │   └── settings/               # User settings
│   │   │   ├── api/                        # 30+ Next.js API routes
│   │   │   │   ├── admin/                  # Admin CRUD endpoints
│   │   │   │   ├── auth/[...nextauth]/     # NextAuth handler
│   │   │   │   ├── challenges/run-rust/    # Rust code execution
│   │   │   │   ├── community/              # Forum API
│   │   │   │   ├── creator/                # Creator API
│   │   │   │   ├── credentials/collect/    # Credential issuance
│   │   │   │   ├── gamification/           # Achievements + XP history
│   │   │   │   ├── leaderboard/sync/       # Cron: on-chain XP sync
│   │   │   │   ├── onboarding/             # Recommendations
│   │   │   │   ├── profile/                # Profile CRUD + avatar
│   │   │   │   ├── progress/               # Lesson completion
│   │   │   │   └── stats/                  # Player stats
│   │   │   ├── layout.tsx                  # Root layout (GA4 scripts, fonts)
│   │   │   ├── globals.css                 # 3 theme definitions
│   │   │   ├── manifest.ts                 # PWA manifest
│   │   │   └── global-error.tsx            # Sentry root error boundary
│   │   ├── components/
│   │   │   ├── auth/                       # SignInModal, UserMenu
│   │   │   ├── creator/                    # Wizard steps, lesson editor
│   │   │   ├── dashboard/                  # Achievement grid, daily challenge, credential banner
│   │   │   ├── layout/                     # Header, Footer, LocaleSwitcher, ThemeToggle
│   │   │   ├── providers/                  # Session, Wallet, Theme, Analytics, Onboarding
│   │   │   └── ui/                         # 25+ Shadcn/ui primitives
│   │   ├── hooks/                          # 11 custom hooks
│   │   │   ├── use-enrollment.ts           # On-chain enrollment PDA
│   │   │   ├── use-player-stats.ts         # XP, level, rank
│   │   │   ├── use-progress.ts             # Lesson completion
│   │   │   ├── use-streak.ts               # Streak + freeze
│   │   │   └── ...
│   │   ├── services/                       # 17 service files
│   │   │   ├── interfaces.ts               # Service interfaces (swappable)
│   │   │   ├── gamification.ts             # Streaks, achievements, XP
│   │   │   ├── credentials.ts              # Helius DAS API
│   │   │   ├── on-chain-progress.ts        # Backend signer integration
│   │   │   ├── leaderboard.ts              # XP ranking queries
│   │   │   ├── community.ts                # Forum CRUD
│   │   │   └── ...
│   │   ├── lib/
│   │   │   ├── analytics/                  # PostHog + GA4 trackEvent()
│   │   │   ├── auth/                       # NextAuth config + account linking
│   │   │   ├── editor/                     # Monaco Editor + Rust language
│   │   │   ├── sanity/                     # CMS client + GROQ queries
│   │   │   ├── solana/                     # PDA derivation, balance helpers
│   │   │   └── supabase/                   # Admin/client, type mappers
│   │   ├── messages/                       # i18n: en.json, pt-BR.json, es.json
│   │   ├── i18n/                           # next-intl routing config
│   │   └── types/                          # TypeScript definitions
│   ├── sanity/schemaTypes/                 # CMS schemas (course, module, lesson, instructor, track)
│   ├── supabase/migrations/               # 001_schema.sql (11 tables + RLS)
│   ├── e2e/                                # 234 test cases across 13 Playwright files
│   ├── public/
│   │   ├── sw.js                           # Service worker
│   │   ├── offline.html                    # Offline fallback
│   │   ├── icons/                          # PWA icons
│   │   └── logos/                          # Brand assets
│   ├── scripts/
│   │   ├── seed-sanity.ts                  # Seed sample course content
│   │   └── setup-achievements.ts           # Create on-chain achievements
│   ├── sanity.config.ts                    # Sanity Studio configuration
│   ├── playwright.config.ts                # E2E test configuration
│   ├── sentry.client.config.ts             # Sentry browser config
│   ├── sentry.server.config.ts             # Sentry server config
│   ├── next.config.ts                      # Next.js config (i18n, Sentry, images)
│   ├── vercel.json                         # Vercel: cron jobs, cache headers
│   └── package.json                        # Dependencies (pnpm)
│
├── backend/                                # Hono transaction signing server
│   ├── src/
│   │   ├── index.ts                        # Hono app, CORS, route mounting
│   │   ├── routes/                         # 14 API endpoints
│   │   │   ├── complete-lesson.ts          # Lesson completion + XP mint
│   │   │   ├── finalize-course.ts          # Course finalization + bonus XP
│   │   │   ├── issue-credential.ts         # Mint Metaplex Core NFT
│   │   │   ├── upgrade-credential.ts       # Update credential attributes
│   │   │   ├── reward-xp.ts               # Arbitrary XP minting
│   │   │   ├── award-achievement.ts        # Achievement NFT + XP
│   │   │   ├── create-course.ts            # Create Course PDA (admin)
│   │   │   ├── update-course.ts            # Update Course PDA (admin)
│   │   │   ├── create-track-collection.ts  # Metaplex collection (admin)
│   │   │   ├── create-achievement-type.ts  # Achievement type PDA (admin)
│   │   │   ├── deactivate-achievement-type.ts
│   │   │   ├── credential-metadata.ts      # NFT JSON metadata endpoint
│   │   │   └── track-stats.ts              # Track-level learner stats
│   │   ├── lib/
│   │   │   ├── program.ts                  # Anchor client + signer setup
│   │   │   ├── pda.ts                      # PDA derivation helpers
│   │   │   ├── ata.ts                      # Token-2022 ATA creation
│   │   │   ├── config.ts                   # Env loading + keypair parsing
│   │   │   └── tracks.ts                   # Sanity track metadata (cached)
│   │   ├── middleware/
│   │   │   └── auth.ts                     # JWT verification (jose)
│   │   └── types.ts                        # Request/response types
│   └── package.json                        # Dependencies (npm)
│
├── onchain-academy/                        # Anchor program (pre-existing)
│   ├── programs/onchain-academy/src/       # 16 instructions, 6 PDAs
│   └── tests/                              # 77 Rust + 62 TypeScript tests
│
├── docs/
│   ├── README.md                           # This file
│   ├── ARCHITECTURE_APP.md                 # App-layer architecture
│   ├── ARCHITECTURE.md                     # On-chain program architecture
│   ├── SPEC.md                             # Program specification
│   ├── INTEGRATION.md                      # Frontend integration guide
│   ├── ANALYTICS.md                        # 22 events, dashboards, funnels
│   ├── CMS_GUIDE.md                        # Sanity content management
│   ├── CUSTOMIZATION.md                    # Themes, languages, gamification
│   ├── SETUP_ENV.md                        # Env var setup walkthrough
│   ├── BOUNTY_DETAILS.md                   # Original bounty specification
│   ├── DEVNET_DEPLOYMENT.md                # Devnet deployment notes
│   ├── DEPLOY-PROGRAM.md                   # Deploy your own program
│   ├── LighthouseReportLandingPage.html    # Lighthouse: landing page
│   ├── LighthouseReportCoursesPage.html    # Lighthouse: courses page
│   ├── LighthouseReportLeaderboardPage.html # Lighthouse: leaderboard page
│   └── screenshots/                        # Analytics dashboard screenshots
│       ├── ga4_realtime_overview.png
│       ├── ga4_events_report.png
│       ├── ga4_user_funnel.png
│       ├── posthog_live_events.png
│       └── posthog_heatmap.png
│
├── README.md                               # Root README (concise overview)
├── CLAUDE.md                               # AI assistant instructions
└── wallets/                                # Keypairs (gitignored)
```

---

## Frontend Deep Dive

### Service Layer

17 service files implement clean interfaces defined in `services/interfaces.ts`. The interface pattern allows swapping local/Supabase implementations for on-chain implementations without changing consuming code.

| Service | Implementation | Data Source | Purpose |
|---------|---------------|-------------|---------|
| `ProfileService` | `SupabaseProfileService` | Supabase `profiles` | User profiles, username checks, stats |
| `GamificationService` | `SupabaseGamificationService` | Supabase + on-chain | Streaks, achievements, XP history |
| `LeaderboardService` | `SupabaseLeaderboardService` | Supabase `xp_transactions` | XP rankings by timeframe |
| `CredentialService` | `HeliusCredentialService` | Helius DAS API | On-chain credential NFT queries |
| `OnChainProgressService` | `BackendSignerOnChainProgressService` | Hono backend -> Solana | Lesson/course completion, credentials |
| `CommunityService` | `SupabaseCommunityService` | Supabase `community_posts` | Forum posts, replies, likes |
| `AchievementCheckerService` | `SupabaseAchievementCheckerService` | On-chain enrollment PDAs | Auto-check achievement eligibility |
| `OnChainSyncService` | `HeliusSyncService` | Helius DAS API | Parse XP transactions for leaderboard |
| `OnboardingService` | `SupabaseOnboardingService` | Supabase `profiles` | Course recommendations |
| `TrackService` | Sanity + on-chain | Sanity CMS + PDAs | Track metadata + progress |
| `AvatarService` | `SupabaseAvatarService` | Supabase Storage | Avatar upload/delete |
| `NewsletterService` | `SupabaseNewsletterService` | Supabase | Email subscriptions |
| `TestimonialService` | `SupabaseTestimonialService` | Supabase `testimonials` | Landing page testimonials |

### Custom Hooks

11 React hooks encapsulate data fetching and state management:

| Hook | Purpose | Key Behavior |
|------|---------|-------------|
| `useEnrollment` | On-chain enrollment state | Fetches enrollment PDA, exposes `enroll()` + `closeEnrollment()` |
| `usePlayerStats` | XP, level, rank | Reads Token-2022 balance, derives level, fetches rank |
| `useProgress` | Lesson completion per course | Tracks completed lessons, calls backend on completion |
| `useStreak` | Streak data | Current/longest streak, freezes, activity calendar |
| `useProfile` | User profile + stats | Profile data from Supabase |
| `useOnchainProgress` | Backend-signed completion | Calls Hono backend for lesson/course/credential operations |
| `useBulkEnrollments` | Multiple enrollment PDAs | Batch fetch enrollments for dashboard |
| `useCoursesCompleted` | Completed courses list | Credentials + completion state |
| `useLeaderboard` | Leaderboard data | Weekly/monthly/alltime with optional course filter |
| `useWalletLink` | SIWS wallet connection | Sign message, call link-intent API |
| `useProgramEvents` | On-chain event listener | Real-time event subscription |

### API Routes

30+ Next.js API Route Handlers organized by domain:

| Group | Routes | Auth |
|-------|--------|------|
| `/api/auth` | NextAuth handler, link-intent | Public |
| `/api/profile` | GET/PATCH profile, username check, avatar upload, preferences, privacy, data export | Authenticated |
| `/api/gamification` | Achievements, eligible achievements, claim, XP history | Authenticated |
| `/api/progress` | Lesson/course completion | Authenticated |
| `/api/stats` | Player stats (XP, level, rank) | Authenticated |
| `/api/leaderboard` | Rankings, sync cron | Public (read), Cron (sync) |
| `/api/credentials/collect` | Credential issuance/upgrade | Authenticated |
| `/api/community` | Posts CRUD, replies, likes, tags | Authenticated |
| `/api/creator` | Course CRUD, thumbnail upload | Authenticated |
| `/api/admin` | Courses, users, achievements, challenges, tracks, analytics, stats, testimonials | Admin only |
| `/api/courses` | Course listing | Public |
| `/api/tracks` | Track listing | Public |
| `/api/daily-challenge` | Today's challenge | Authenticated |
| `/api/challenges/run-rust` | Execute Rust code | Authenticated |
| `/api/onboarding` | Complete onboarding, recommendations | Authenticated |
| `/api/enrollments` | Enrollment data | Authenticated |
| `/api/newsletter` | Subscribe | Public |
| `/api/testimonials` | Submit testimonial | Authenticated |
| `/api/webhooks/sanity` | Sanity webhook (cache revalidation) | Webhook secret |

### Provider Hierarchy

```
RootLayout                          # GA4 script tags, fonts (Inter, Archivo, Geist Mono)
  └── [locale]/layout.tsx           # next-intl messages loaded
      └── SessionProvider           # NextAuth session context
          └── SolanaWalletProvider  # @solana/wallet-adapter (multi-wallet)
              └── ThemeProvider     # 3 themes (light/dark/brasil), persisted to Supabase
                  └── AnalyticsProvider  # PostHog init, page_view tracking, sign_in detection
                      └── OnboardingGuard  # Redirects new users to /onboarding
                          └── Page Content
```

---

## Backend Deep Dive

### API Endpoints

14 routes on the Hono server:

**Learner Operations** (signed by `backendSigner`):

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/complete-lesson` | Mark lesson complete in on-chain bitmap, mint XP. Auto-triggers `/finalize-course` if all lessons done. |
| POST | `/finalize-course` | Award bonus XP to learner + creator reward XP to course creator. |
| POST | `/issue-credential` | Create soulbound Metaplex Core NFT credential. Resolves track collection from Sanity. |
| POST | `/upgrade-credential` | Update existing credential metadata and attributes (track level, XP, courses completed). |
| POST | `/reward-xp` | Mint arbitrary XP to any wallet. Requires MinterRole PDA. |
| POST | `/award-achievement` | Award achievement: mint soulbound NFT + XP reward. |

**Admin Operations** (signed by `authoritySigner`):

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/create-course` | Create Course PDA with metadata. |
| POST | `/update-course` | Update Course account fields. |
| POST | `/admin/create-track-collection` | Create Metaplex Core collection for a track. |
| POST | `/admin/create-achievement-type` | Create AchievementType PDA + collection. |
| POST | `/admin/deactivate-achievement-type` | Deactivate an achievement type. |

**Read-Only** (no auth or public):

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/credential-metadata` | Metaplex-standard JSON metadata for credential NFTs. |
| GET | `/track-stats` | Courses completed + total XP for a learner in a track. |
| GET | `/health` | Health check: `{"status":"ok"}` |

### Request Flow

```
1. Frontend API route receives user action
2. Generates JWT from NextAuth session
3. POST to Hono backend with Authorization: Bearer <jwt>
4. auth.ts middleware: jose.jwtVerify() against shared AUTH_SECRET
5. Route handler: validates request body, fetches on-chain state (PDAs, balances)
6. Builds Anchor transaction: program.methods.xxx().accountsStrict({...})
7. Auto-creates Token-2022 ATAs if missing (backend pays via preInstruction)
8. backendSigner (or authoritySigner) signs the transaction
9. Submits to Solana RPC
10. Returns { success: true, signature: "5Tx..." }
```

### Security Model

- **JWT validation**: Every request authenticated against the same `AUTH_SECRET` as NextAuth
- **CORS restriction**: Only accepts requests from `APP_ORIGIN`
- **Keypair isolation**: Signing keys never leave the backend — not exposed via any endpoint
- **Scoped signing**: Backend only signs specific program instructions, not arbitrary transactions
- **ATA payment**: Backend pays for Token-2022 ATA creation (learners don't need SOL for ATAs)

---

## CMS Content Management

Sanity CMS manages all course content. See [CMS_GUIDE.md](./CMS_GUIDE.md) for the full guide.

**5 document types**: course, module, lesson, instructor, track

**Quick reference:**
- Sanity Studio: `http://localhost:3000/studio` (embedded in Next.js)
- Seed content: `cd app && pnpm seed-sanity`
- Content queries: `app/src/lib/sanity/queries.ts`
- Schema definitions: `app/sanity/schemaTypes/`

See [CUSTOMIZATION.md](./CUSTOMIZATION.md) for adding themes, languages, and gamification features.

---

## Performance

**Lighthouse targets**: Performance 90+, Accessibility 95+, Best Practices 95+, SEO 90+.

**Reports** (open in browser):
- [Landing Page](./LighthouseReportLandingPage.html)
- [Courses Page](./LighthouseReportCoursesPage.html)
- [Leaderboard Page](./LighthouseReportLeaderboardPage.html)

**Optimizations applied:**
- Server Components for data fetching (no client-side waterfall)
- Dynamic imports for Monaco Editor, Recharts (code splitting)
- Image optimization via Sanity CDN + `next/image`
- Optimized package imports (`lucide-react`, `recharts`, `framer-motion`)
- Tailwind CSS purging (no unused styles)
- Static generation for landing and catalog pages
- Service worker caching (cache-first for assets)
- Font preloading with `display: "swap"` (Inter, Archivo, Geist Mono)

---

## Documentation Index

| Document | Path | Description |
|----------|------|-------------|
| **Project README** | `docs/README.md` | This file — complete project guide |
| **Root README** | `README.md` | Concise overview for the repo root |
| **App Architecture** | `docs/ARCHITECTURE_APP.md` | Frontend + backend architecture, data flows, service layer |
| **Program Architecture** | `docs/ARCHITECTURE.md` | On-chain program account maps, CU budgets |
| **Program Specification** | `docs/SPEC.md` | All 16 instructions, 6 PDAs, 26 errors, 15 events |
| **Integration Guide** | `docs/INTEGRATION.md` | PDA derivation, instruction usage, events |
| **Analytics** | `docs/ANALYTICS.md` | 22 events, PostHog/GA4/Sentry setup, funnels, screenshots |
| **CMS Guide** | `docs/CMS_GUIDE.md` | Sanity content schema, publishing workflow |
| **Customization** | `docs/CUSTOMIZATION.md` | Themes, languages, gamification extensions |
| **Env Setup** | `docs/SETUP_ENV.md` | Step-by-step env var generation guide |
| **Bounty Details** | `docs/BOUNTY_DETAILS.md` | Original bounty specification |
| **Devnet Deployment** | `docs/DEVNET_DEPLOYMENT.md` | Devnet deployment notes |
| **Deploy Program** | `docs/DEPLOY-PROGRAM.md` | Deploy your own program instance |
| **Lighthouse** | `docs/LighthouseReport*.html` | Performance audit reports |
| **Screenshots** | `docs/screenshots/` | GA4, PostHog, analytics dashboards |

---

## License

[MIT](../LICENSE)
