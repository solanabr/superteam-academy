# Superteam Academy - Frontend Application

> The Solana-native learning platform for Latin America and beyond. Gamified education with on-chain credentials.

## Prerequisites

- **Node.js** >= 18
- **pnpm** >= 8 (install: `npm install -g pnpm`)

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/amanhij/superteam-academy.git
cd superteam-academy/app

# 2. Install dependencies
pnpm install

# 3. Copy environment file
cp .env.example .env.local

# 4. Fill in environment variables (see below)

# 5. Run development server
pnpm dev

# 6. Open http://localhost:3000
```

## Environment Variables

Copy `.env.example` to `.env.local` and configure each variable:

### Solana

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_HELIUS_API_KEY` | Yes | Helius API key for RPC and DAS API access. Get one at [helius.dev](https://helius.dev) |
| `NEXT_PUBLIC_SOLANA_NETWORK` | Yes | Solana cluster: `mainnet-beta`, `devnet`, or `testnet` |
| `NEXT_PUBLIC_XP_MINT_ADDRESS` | No | Token-2022 XP mint address (set after program deployment) |
| `NEXT_PUBLIC_PROGRAM_ID` | No | On-chain program ID (set after program deployment) |

### Authentication

| Variable | Required | Description |
|----------|----------|-------------|
| `AUTH_SECRET` | Yes | Random secret for JWT signing. Generate with `openssl rand -base64 32` |
| `AUTH_URL` | Yes | Canonical app URL (e.g., `http://localhost:3000` for dev) |
| `NEXTAUTH_SECRET` | Yes | NextAuth.js session secret. Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | Same as AUTH_URL |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID for social login |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | No | GitHub OAuth client ID for social login |
| `GITHUB_CLIENT_SECRET` | No | GitHub OAuth client secret |
| `ADMIN_PASSWORD_HASH` | No | bcrypt hash of admin password. Generate with `npx bcryptjs <password>` |

### Supabase

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | No | Supabase project URL for community features |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No | Supabase anonymous key |

### Sanity CMS

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | No | Sanity project ID for CMS-managed courses |
| `NEXT_PUBLIC_SANITY_DATASET` | No | Sanity dataset name (default: `production`) |

### Analytics

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | No | Google Analytics 4 measurement ID |
| `NEXT_PUBLIC_POSTHOG_KEY` | No | PostHog project API key |
| `NEXT_PUBLIC_POSTHOG_HOST` | No | PostHog instance URL (default: `https://us.i.posthog.com`) |
| `NEXT_PUBLIC_SENTRY_DSN` | No | Sentry DSN for error tracking |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript (strict mode) |
| **UI** | Tailwind CSS v4 + CVA-based component variants |
| **Auth** | NextAuth.js v5 + Solana Wallet Adapter |
| **i18n** | next-intl (EN, PT-BR, ES) |
| **Code Editor** | Monaco Editor |
| **On-Chain** | @solana/web3.js + Helius DAS API |

## Features

### Pages
- **Landing** — Hero, features, stats, featured courses, learning paths
- **Course Catalog** — Filterable grid with search, difficulty, and track filters
- **Course Detail** — Module list, progress tracking, enrollment CTA
- **Lesson View** — Split pane with Monaco editor + instructions + test runner
- **Dashboard** — XP progress, streak calendar, achievements, enrolled courses
- **Profile** — Skills bars, cNFT credential cards, achievements grid
- **Leaderboard** — XP rankings with weekly/monthly/all-time tabs + podium
- **Settings** — Theme, language, linked accounts, notifications
- **Certificate** — Visual certificate with on-chain verification link
- **Public Profile** — Shareable public profile
- **Community** — Forum with threads, replies, and voting

### On-Chain (Devnet)
- Multi-wallet auth (Phantom, Solflare, Backpack)
- XP balance from Token-2022 soulbound tokens
- cNFT credential display via Helius DAS API
- Credential verification links to Solana Explorer

### Service Interface

```typescript
interface LearningProgressService {
  getProgress(userId, courseId): Promise<Progress>;
  completeLesson(userId, courseId, lessonIndex): Promise<void>;
  getXP(userId): Promise<number>;
  getStreak(userId): Promise<StreakData>;
  getLeaderboard(timeframe): Promise<LeaderboardEntry[]>;
  getCredentials(walletAddress): Promise<Credential[]>;
}
```

Currently implemented: `LocalLearningProgressService` (mock data) with `OnChainLearningProgressService` for credential reads via Helius DAS API.

## Directory Structure

```
src/
├── app/[locale]/          # i18n-routed pages (10+ routes)
├── components/
│   ├── ui/                # Button, Card, Badge, Input, Progress, Tabs, Avatar, Skeleton
│   ├── layout/            # Navbar, Footer
│   ├── course/            # CourseCard
│   ├── community/         # ThreadDetail, ReplyForm, ReplyItem
│   └── gamification/      # XPDisplay, StreakCalendar, AchievementBadge
├── lib/
│   ├── services/          # Types, mock data, learning-progress, credentials, xp, leaderboard
│   ├── auth/              # Admin auth utilities
│   ├── solana/            # Connection config
│   └── constants.ts       # Tracks, difficulties, XP formulas
├── providers/             # ThemeProvider, WalletProvider, AppProviders
├── i18n/                  # Config, routing, request
└── messages/              # en.json, pt-br.json, es.json
```

## Build

```bash
pnpm build    # Production build (zero errors)
pnpm lint     # ESLint
```

## Deployment (Vercel)

1. Push your branch to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Set the **Root Directory** to `app`
4. Set **Framework Preset** to Next.js
5. Add all required environment variables in the Vercel dashboard
6. Deploy — preview deployments are auto-created for PRs
7. Set a custom domain in Vercel project settings (optional)

For production, ensure `NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta` and all auth secrets are set to production values.
