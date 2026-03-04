# Superteam Academy — Frontend App

> **"Codecademy meets Cyfrin Updraft for Solana"** — The open-source, gamified learning platform for Solana developers across Latin America and beyond.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-aves--superteam--academy.vercel.app-14F195?style=for-the-badge&logo=vercel)](https://aves-superteam-academy.vercel.app)
[![Lighthouse](https://img.shields.io/badge/Lighthouse-90%2B-4CAF50?style=for-the-badge&logo=lighthouse)](https://aves-superteam-academy.vercel.app/lighthouse-report/index.html)
[![Solana Devnet](https://img.shields.io/badge/Solana-Devnet-9945FF?style=for-the-badge&logo=solana)](https://solana.com)

---

## Overview

Superteam Academy is a production-ready LMS (Learning Management System) built for the Solana ecosystem. It combines gamified progression (XP, levels, streaks, achievements), on-chain credentials via Metaplex Core NFTs, and interactive course delivery — all in a fast, multilingual interface.

**Tech Stack:**
- **Framework:** Next.js 16 (App Router) + TypeScript (strict)
- **Styling:** Tailwind CSS v4 with custom design tokens
- **UI Components:** shadcn/ui + Radix UI (accessible primitives)
- **Auth:** Privy (Solana wallet + Google/GitHub OAuth)
- **CMS:** Sanity (courses, modules, lessons)
- **Database:** Supabase (PostgreSQL) + Prisma ORM
- **On-Chain:** Solana Devnet — Token-2022 (XP), Metaplex Core NFTs (credentials), Anchor program
- **Background Jobs:** Inngest (async graduation, sync pipelines)
- **Caching:** Upstash Redis
- **Analytics:** GA4 (6 custom events) + Sentry error monitoring
- **i18n:** EN, PT-BR, ES (next-intl)
- **Deployment:** Vercel (`bom1` — Mumbai, co-located with Supabase)

---

## Local Development Setup

### Prerequisites
- **Node.js** v20+
- **pnpm** v9+ (`npm install -g pnpm`)
- A **Phantom** or any Solana wallet browser extension (for testing)

### Step 1 — Clone and Install

```bash
# From the repo root
cd app
pnpm install
```

### Step 2 — Configure Environment Variables

Copy the example file and fill in each value:

```bash
cp .env.example .env
```

> See the **Environment Variables** section below for what each variable does.

### Step 3 — Set up the Database

```bash
# Apply the Prisma schema to your Supabase (or local Postgres) database
npx prisma generate
npx prisma db push
```

### Step 4 — Set up Sanity CMS

```bash
# Install Sanity CLI (if not already)
npm install -g @sanity/cli

# Log in to Sanity
sanity login

# Import the sample course data (optional, for dev)
# See CMS_GUIDE.md for detailed instructions
```

### Step 5 — Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The app will redirect to `/en` by default.

---

## Environment Variables

Create a `.env` file in the `app/` directory with the following:

```env
# ── Auth (Privy) ──────────────────────────────────────────────────────────────
# Dashboard: https://dashboard.privy.io
NEXT_PUBLIC_PRIVY_APP_ID=            # Safe for client (NEXT_PUBLIC_)
PRIVY_APP_SECRET=                    # Server-only — NEVER expose to client

# ── Database (Supabase + Prisma) ──────────────────────────────────────────────
# Dashboard: https://supabase.com/dashboard/project/<ref>/settings/database
NEXT_PUBLIC_SUPABASE_URL=           # e.g. https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=      # Anon key (safe for client)
SUPABASE_SERVICE_KEY=               # Service role key (server-only)

# Prisma connection — use the "Transaction" pooler URL for serverless
# Settings > Database > Connection string > Transaction mode
DATABASE_URL="postgresql://...?pgbouncer=true&connection_limit=20&pool_timeout=20"

# Direct URL for schema migrations (bypasses PgBouncer)
DIRECT_URL="postgresql://..."

# ── CMS (Sanity) ──────────────────────────────────────────────────────────────
# Dashboard: https://sanity.io/manage
NEXT_PUBLIC_SANITY_PROJECT_ID=      # e.g. "unpfqvnd"
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=                   # Editor-role token for server writes

# ── Solana / On-Chain ─────────────────────────────────────────────────────────
NEXT_PUBLIC_USE_ONCHAIN=true        # Set false to skip on-chain transactions
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_HELIUS_RPC_URL=         # Helius RPC with API key (faster)
BACKEND_WALLET_PRIVATE_KEY=         # bs58-encoded private key for backend signing
NEXT_PUBLIC_COLLECTION_ADDRESS=     # Metaplex Core collection address on Devnet

# ── Background Jobs (Inngest) ─────────────────────────────────────────────────
# Dashboard: https://app.inngest.com
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# ── Caching (Upstash Redis) ───────────────────────────────────────────────────
# Dashboard: https://console.upstash.com
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# ── Analytics & Monitoring ────────────────────────────────────────────────────
NEXT_PUBLIC_GA_MEASUREMENT_ID=      # GA4 Measurement ID (e.g. G-XXXXXXXXXX)
NEXT_PUBLIC_SENTRY_DSN=             # Sentry DSN from Project Settings > Client Keys
SENTRY_ORG=                         # Sentry org slug
SENTRY_PROJECT=                     # Sentry project slug
# SENTRY_AUTH_TOKEN=                # Add to Vercel only (source map uploads)

# ── App URL ───────────────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Key Setup Notes

**Privy Auth:**
- Enable **Email**, **Google**, **GitHub**, and **Wallet** login in the Privy dashboard.
- For GitHub OAuth, set the Authorization callback URL to `https://auth.privy.io/api/v1/oauth/callback` (NOT your app URL).
- Every user gets a Solana wallet (embedded, if no external wallet is connected).

**Supabase DATABASE_URL:**
- Use the **Transaction mode** pooler URL (port `6543`) with `?pgbouncer=true` for the app.
- Use the **Direct** URL (port `5432`) for `DIRECT_URL` to run migrations.
- Always include `connection_limit=20` in the pooler URL to avoid exhausting connections on serverless.

---

## Available Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start development server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `npx prisma db push` | Push schema changes to database |
| `npx prisma generate` | Regenerate Prisma client after schema changes |
| `npx prisma studio` | Open Prisma Studio (local DB GUI) |

---

## Project Structure

```
app/
├── prisma/                   # Database schema & migrations
│   └── schema.prisma         # Prisma schema (User, Enrollment, Credential...)
├── public/                   # Static assets (logos, images, lighthouse report)
│   └── lighthouse-report/    # Static Lighthouse performance report
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── [locale]/         # i18n-aware routes (en, pt-BR, es)
│   │   │   ├── page.tsx      # Landing page (/)
│   │   │   └── (authenticated)/
│   │   │       └── (platform)/
│   │   │           ├── dashboard/     # /dashboard
│   │   │           ├── courses/       # /courses & /courses/[slug]
│   │   │           ├── achievements/  # /achievements
│   │   │           ├── leaderboard/   # /leaderboard
│   │   │           ├── profile/       # /profile/[wallet]
│   │   │           ├── settings/      # /settings
│   │   │           ├── certificates/  # /certificates/[id]
│   │   │           └── teach/         # /teach (course creator dashboard)
│   │   └── api/              # API routes
│   │       ├── onchain/      # Solana transaction handlers
│   │       ├── enrollment/   # Enrollment state management
│   │       ├── graduation/   # Course completion + XP award
│   │       ├── sync/         # Background sync (certificates, progress, course)
│   │       └── ...           # 24 total API route groups
│   ├── components/           # UI components (17 folders)
│   │   ├── analytics/        # ThirdPartyScripts + sendGAEvent
│   │   ├── auth/             # SyncUserOnLogin, AuthGuard
│   │   ├── courses/          # CourseCard, EnrollButton, LessonList
│   │   ├── dashboard/        # XPBar, StreakCalendar, ActivityFeed
│   │   ├── layout/           # Footer, LocaleSwitcher, Navigation
│   │   ├── lessons/          # LessonView, CodeEditor, QuizModal
│   │   └── ui/               # SolanaTransactionModal, button, input
│   ├── store/                # Zustand state management (11 stores)
│   │   ├── user-store.ts     # User auth, XP, progress, credentials
│   │   ├── enrollment-store.ts  # Course enrollment & rent reclaim
│   │   ├── course-store.ts   # Course detail state
│   │   ├── lesson-store.ts   # Lesson progress & completion
│   │   └── ...
│   ├── lib/                  # Utilities and service layer
│   │   ├── learning-progress/ # LearningProgressService (clean abstraction)
│   │   ├── solana-connection.ts  # RPC connection management
│   │   ├── onchain-admin.ts  # Backend wallet for signing transactions
│   │   ├── cache.ts          # Upstash Redis caching helpers
│   │   └── db.ts             # Prisma client singleton
│   ├── messages/             # i18n translation files
│   │   ├── en.json, pt-BR.json, es.json
│   └── sanity/               # Sanity client, schemas, queries
├── sentry.client.config.ts   # Sentry — browser error capture + Session Replay
├── sentry.server.config.ts   # Sentry — server-side error capture
├── sentry.edge.config.ts     # Sentry — edge runtime error capture
├── next.config.ts            # Next.js config (withSentryConfig, next-intl)
└── vercel.json               # Vercel deployment config (region: bom1)
```

---

## Deployment (Vercel)

The app is deployed on Vercel with the function region explicitly set to **`bom1` (Mumbai)** to co-locate with the Supabase database in `ap-south-1`, minimizing database query latency.

### Deploy to Vercel

1. **Fork/clone** the repo and push to GitHub.
2. **Import** the repo into Vercel.
3. **Set root directory** to `app/` in Vercel project settings.
4. **Add all environment variables** from the table above.
5. **Add `SENTRY_AUTH_TOKEN`** (server-only, for source map uploads during build).
6. Push to the `main` branch to trigger a deployment.

### Performance Results

| Metric | Score |
|---|---|
| Lighthouse Performance | 90+ |
| Lighthouse Accessibility | 95+ |
| Lighthouse Best Practices | 95+ |
| Lighthouse SEO | 90+ |
| API response time (cached) | < 10ms |
| API response time (DB) | 200–900ms |
| Solana transaction (Devnet) | 6–8s |

[View Full Lighthouse Report →](https://aves-superteam-academy.vercel.app/lighthouse-report/index.html)

---

## License

MIT — See root `LICENSE` for details.
