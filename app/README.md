# Superteam Academy - Frontend

> Codecademy meets Cyfrin Updraft, on Solana. Earn verifiable XP tokens and soulbound credential NFTs as you learn.

Superteam Academy is a decentralized learning platform where developers master Solana by building. Learners enroll in structured courses, complete interactive coding challenges, earn soulbound Token-2022 XP tokens on-chain, and receive Metaplex Core credential NFTs upon course completion. All progress is recorded on Solana devnet with a clear path to mainnet.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 + shadcn/ui (new-york) |
| Fonts | Geist Mono (headings) + Geist (body) |
| CMS | Sanity (embedded Studio at `/studio`) |
| Database | Supabase (profiles, streaks, linked accounts) |
| Auth | Solana Wallet Adapter + NextAuth (Google + GitHub OAuth) |
| Code Editor | Monaco Editor (VS Code engine in-browser) |
| i18n | next-intl (EN, PT-BR, ES) |
| Analytics | PostHog (product events) + GA4 (traffic) + Sentry (errors) |
| Solana | @solana/web3.js + Wallet Adapter + Metaplex Core + Anchor |
| PWA | Service Worker + Web App Manifest |
| Deployment | Vercel |

## Quick Start

```bash
# Clone the monorepo and navigate to the frontend
git clone https://github.com/solanabr/superteam-academy
cd superteam-academy/app

# Install dependencies
npm install

# Copy and fill environment variables
cp .env.example .env.local
# Edit .env.local with your values (see Environment Variables section below)

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Create `.env.local` from `.env.example` and fill in all required values:

### Solana / On-Chain

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_PROGRAM_ID` | Yes | Deployed Anchor program address (`ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf`) |
| `NEXT_PUBLIC_CLUSTER` | Yes | `devnet` or `mainnet-beta` |
| `NEXT_PUBLIC_XP_MINT` | Yes | Token-2022 XP mint address (NonTransferable + PermanentDelegate) |
| `NEXT_PUBLIC_HELIUS_API_KEY` | Recommended | Helius RPC + DAS API key for credential/leaderboard queries |
| `BACKEND_SIGNER_PRIVATE_KEY` | Production | Backend keypair byte array — signs `complete_lesson` transactions |

### Supabase

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL (`https://xyz.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Service role key for admin operations (server-side only) |

### Sanity CMS

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Yes | Sanity project ID from sanity.io dashboard |
| `NEXT_PUBLIC_SANITY_DATASET` | No | Dataset name, defaults to `production` |
| `SANITY_API_TOKEN` | Optional | Write token for seeding content via script |

### Authentication (NextAuth)

| Variable | Required | Description |
|---|---|---|
| `NEXTAUTH_SECRET` | Yes | Random 32+ char string (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Production | Full URL of your deployment (`https://your-app.vercel.app`) |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth app client ID |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth app client secret |
| `GITHUB_CLIENT_ID` | Optional | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | Optional | GitHub OAuth app client secret |

### Analytics

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Optional | GA4 measurement ID (`G-XXXXXXXXXX`) |
| `NEXT_PUBLIC_POSTHOG_KEY` | Optional | PostHog project API key (`phc_xxx`) |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional | Sentry DSN for error tracking |

## Supabase Setup

Run this SQL in your Supabase SQL Editor to create the required tables:

```sql
-- User profiles (Solana wallet + OAuth unified identity)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE,
  google_id TEXT UNIQUE,
  github_id TEXT UNIQUE,
  username TEXT UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Linked OAuth / wallet accounts per user
CREATE TABLE linked_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'wallet' | 'google' | 'github'
  provider_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(provider, provider_id)
);

-- Daily learning streaks
CREATE TABLE streaks (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_activity_date DATE,
  streak_history JSONB DEFAULT '[]'
);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE linked_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

-- Public profiles are readable by anyone
CREATE POLICY "Public profiles readable" ON profiles
  FOR SELECT USING (is_public = true);

-- Users can update their own profile
CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (auth.uid()::text = id::text);
```

## Project Structure

```
src/
├── app/
│   ├── [locale]/                    # i18n root (en, pt-BR, es)
│   │   ├── (public)/                # No auth required
│   │   │   ├── page.tsx             # Landing page
│   │   │   ├── courses/             # Course list + detail + lesson view
│   │   │   ├── leaderboard/         # XP leaderboard
│   │   │   ├── certificates/[id]/   # Public credential page
│   │   │   ├── community/           # Community hub
│   │   │   ├── onboarding/          # New user onboarding
│   │   │   └── admin/               # Admin panel (dev)
│   │   ├── (auth)/                  # Requires authentication
│   │   │   ├── dashboard/           # Learner dashboard
│   │   │   ├── profile/             # Own profile
│   │   │   ├── profile/[username]/  # Public profile view
│   │   │   └── settings/            # Account settings
│   │   └── layout.tsx               # Locale layout (Header + Footer)
│   ├── api/
│   │   ├── auth/[...nextauth]/      # NextAuth route handler
│   │   └── lessons/complete/        # Backend-signed lesson completion
│   ├── icon.tsx                     # Next.js auto-generated favicon (32x32)
│   ├── apple-icon.tsx               # Apple touch icon (180x180)
│   ├── layout.tsx                   # Root layout (fonts, PWA meta)
│   └── globals.css                  # Design tokens + Tailwind theme
├── components/
│   ├── ui/                          # shadcn/ui primitives
│   ├── layout/                      # Header, Footer
│   ├── course/                      # CourseCard, CourseGrid
│   ├── gamification/                # XPBar, StreakWidget, LevelBadge
│   ├── editor/                      # MonacoEditor, CodeChallenge
│   ├── solana/                      # WalletButton, CredentialCard
│   ├── leaderboard/                 # LeaderboardTable
│   └── providers/                   # WalletProvider, SessionProvider
├── services/                        # Business logic (Solana + Supabase + Sanity)
│   ├── learning-progress.ts         # LearningProgressService implementation
│   ├── credentials.ts               # Helius DAS credential queries
│   ├── leaderboard.ts               # XP token index → leaderboard
│   └── streak.ts                    # Daily streak tracking
├── lib/
│   ├── pda.ts                       # PDA derivation helpers (all 6 account types)
│   ├── bitmap.ts                    # Lesson progress bitmap helpers ([u64; 4])
│   ├── solana.ts                    # Connection, XP balance, explorer URL
│   ├── sanity.ts                    # Sanity GROQ query client
│   ├── supabase.ts                  # Supabase client (browser + server)
│   ├── analytics.ts                 # PostHog + GA4 event tracking
│   └── utils.ts                     # cn(), formatting helpers
├── hooks/                           # React hooks (useXpBalance, useEnrollment, etc.)
├── types/                           # Shared TypeScript interfaces + TRACKS constant
└── i18n/
    ├── routing.ts                   # next-intl locale config
    ├── request.ts                   # Server-side message loader
    └── messages/
        ├── en.json                  # English (default)
        ├── pt-BR.json               # Brazilian Portuguese
        └── es.json                  # Spanish
```

## On-Chain Integration

**Program ID**: `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf`

### Transaction Signing Split

| Action | Who Signs | Instruction |
|---|---|---|
| Enroll in course | Learner wallet | `enroll` |
| Close enrollment | Learner wallet | `close_enrollment` |
| Complete lesson + mint XP | Backend keypair | `complete_lesson` |
| Finalize course | Backend keypair | `finalize_course` |
| Issue credential NFT | Backend keypair | `issue_credential` |

The learner never pays gas for progress — only for enrollment (one-time rent deposit). The backend keypair signs completion to prevent cheating.

### PDA Derivation

See `src/lib/pda.ts` for all helper functions. Seeds:

- Config: `["config"]`
- Course: `["course", courseId]`
- Enrollment: `["enrollment", courseId, learnerPubkey]`
- MinterRole: `["minter", minterPubkey]`
- AchievementType: `["achievement", achievementId]`
- AchievementReceipt: `["achievement_receipt", achievementId, recipientPubkey]`

## Development Commands

```bash
npm run dev       # Start dev server (http://localhost:3000)
npm run build     # Production build with type checking
npm run lint      # ESLint
npm run typecheck # TypeScript type check without building
```

## Deployment to Vercel

1. Push your fork to GitHub.
2. Import the repository at [vercel.com/new](https://vercel.com/new).
3. Set the **Root Directory** to `apps/superteam-academy/app` (or `app` if deploying the subfolder directly).
4. Add all environment variables in the Vercel dashboard under **Settings > Environment Variables**.
5. Set `NEXTAUTH_URL` to your production URL (e.g. `https://your-app.vercel.app`).
6. Click **Deploy**. Preview deployments are created automatically for every PR.

### Required Vercel Environment Variables

Copy all variables from `.env.example` to Vercel. At minimum set:
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `NEXT_PUBLIC_PROGRAM_ID` + `NEXT_PUBLIC_CLUSTER` + `NEXT_PUBLIC_XP_MINT`
- `NEXTAUTH_SECRET` + `NEXTAUTH_URL`

## Contributing

1. Fork the repository.
2. Create a branch: `git checkout -b feat/your-feature`.
3. Make changes, run `npm run lint` and `npm run build` to verify.
4. Open a PR targeting `main` at `github.com/solanabr/superteam-academy`.

## Bounty Submission

This is a submission for the Superteam Brazil hackathon bounty.
PR target: `github.com/solanabr/superteam-academy`
