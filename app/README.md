# Superteam Academy - Frontend

A Solana-native learning platform built with Next.js. Wallet-based enrollment, on-chain XP (Token-2022), Metaplex Core credentials, gamified progression, and a CMS-ready architecture.

## Tech Stack

| Layer | Stack |
|-------|-------|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui (New York), Radix UI |
| Web3 | @solana/web3.js, @coral-xyz/anchor, Solana Wallet Adapter |
| Auth | NextAuth.js - SIWS (Sign-In With Solana) + Google OAuth |
| Database | Prisma + PostgreSQL (Supabase) |
| State | Zustand (persisted), TanStack React Query |
| i18n | next-intl (EN, PT-BR, ES) |
| Analytics | GA4, PostHog, Sentry |
| Tokens | Token-2022 (soulbound XP), Metaplex Core (credential NFTs) |

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL database (Supabase recommended)

### Install

```bash
cd app
npm install
```

### Environment

Copy `.env.example` to `.env.local` and fill in values:

```bash
cp .env.example .env.local
```

Required variables:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_HELIUS_RPC_URL` | Helius RPC endpoint (devnet or mainnet) |
| `BACKEND_SIGNER_KEY` | Base58 or JSON keypair for backend-signed transactions |
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Session encryption key (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | App URL (http://localhost:3000 for local) |

Optional variables:

| Variable | Purpose |
|----------|---------|
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 |
| `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST` | PostHog analytics |
| `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_ORG` / `SENTRY_PROJECT` | Sentry error monitoring |
| `TRACK_COLLECTION_PUBKEY` | Metaplex Core track collection address |

### Run

```bash
npm run dev       # Development server at localhost:3000
npm run build     # Production build
npm run start     # Start production server
npm run lint      # ESLint check
```

### Database

```bash
npx prisma generate   # Generate Prisma client
npx prisma db push    # Push schema to database
```

## Project Structure

```
src/
+-- app/                          # App Router routes
|   +-- (auth)/sign-in            # SIWS + Google sign-in
|   +-- (auth)/sign-up            # SIWS + Google sign-up
|   +-- api/                      # Server API routes
|   |   +-- auth/[...nextauth]    # NextAuth handler
|   |   +-- auth/nonce            # SIWS nonce generation
|   |   +-- courses/finalize      # Backend-signed course finalization
|   |   +-- courses/issue-credential  # Backend-signed credential issuance
|   |   +-- lessons/complete      # Backend-signed lesson completion
|   |   +-- leaderboard           # On-chain XP leaderboard
|   |   +-- user                  # Profile CRUD
|   +-- certificates/[id]         # Credential detail + verification
|   +-- courses/                  # Course catalog
|   +-- courses/[slug]            # Course detail + enrollment
|   +-- courses/[slug]/lessons/[id]  # Lesson viewer + code editor
|   +-- dashboard/                # Learner metrics + activity
|   +-- leaderboard/              # XP ranking with timeframe filters
|   +-- profile/[username]        # Public profile + credentials
|   +-- settings/                 # Preferences + wallet management
+-- components/
|   +-- course/                   # CourseCard, CourseGrid, LessonContent
|   +-- editor/                   # Monaco code editor, challenge workspace
|   +-- gamification/             # XP display, streaks, levels, achievements
|   +-- layout/                   # Header, Sidebar, Footer
|   +-- providers/                # Theme, Intl, Query, Wallet providers
|   +-- ui/                       # shadcn/ui primitives
+-- hooks/
|   +-- use-courses.ts            # Course search/filter
|   +-- use-enrollment.ts         # On-chain enrollment flow
|   +-- use-on-chain.ts           # React Query wrappers for on-chain reads
|   +-- use-siws-auth.ts          # Sign-In With Solana flow
|   +-- use-xp.ts                 # XP balance + streak computation
+-- lib/
|   +-- api-schemas.ts            # Zod validation schemas for API routes
|   +-- auth/                     # NextAuth config, session guards, SIWS verification
|   +-- data/                     # Local course data + mock entities
|   +-- db/                       # Prisma client singleton
|   +-- services/                 # Service interfaces + local implementations
|   +-- solana/                   # Program client, on-chain service, backend signer
|   +-- store/                    # Zustand user store (persisted)
+-- messages/                     # i18n dictionaries (en, es, pt-BR)
+-- types/                        # Domain types + NextAuth augmentation
```

## On-Chain Integration

| Instruction | Signer | Route |
|------------|--------|-------|
| `enroll_course` | Client wallet | Direct (hooks) |
| `complete_lesson` | Backend | `POST /api/lessons/complete` |
| `finalize_course` | Backend | `POST /api/courses/finalize` |
| `issue_credential` | Backend | `POST /api/courses/issue-credential` |

Program ID: `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf` (devnet: `5bzKJ9GdnR6FmnF4Udcza64Hgdiz5vtsX35szuKzXp7c`)

XP Mint: `xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3`

## API Routes

All protected routes use `requireSession()` auth guard + Zod request validation.

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/auth/[...nextauth]` | * | Public | NextAuth handlers (SIWS + Google) |
| `/api/auth/nonce` | GET | Public | Cryptographic nonce for SIWS |
| `/api/user` | GET/PATCH | Public | Profile lookup + upsert |
| `/api/lessons/complete` | POST | Session | Record lesson completion on-chain |
| `/api/courses/finalize` | POST | Session | Finalize course + award XP |
| `/api/courses/issue-credential` | POST | Session | Mint Metaplex Core credential NFT |
| `/api/leaderboard` | GET | Public | On-chain XP leaderboard (top 50) |

## Deployment

### Vercel (recommended)

1. Import repo in Vercel
2. Set root directory to `app`
3. Configure environment variables
4. Deploy - Next.js settings are auto-detected

### Self-hosted

```bash
npm ci && npm run build && npm run start
```

## Documentation

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - System architecture, components, data flow
- [CMS_GUIDE.md](docs/CMS_GUIDE.md) - Content management, course creation, CMS migration
- [CUSTOMIZATION.md](docs/CUSTOMIZATION.md) - Theming, i18n, gamification customization
