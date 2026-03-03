# Superteam Academy — Frontend

> Codecademy meets Cyfrin Updraft, on Solana. Earn verifiable XP tokens and soulbound credential NFTs as you learn.

Superteam Academy is a decentralized learning platform where developers master Solana by building. Learners enroll in structured courses, complete interactive coding challenges, earn soulbound Token-2022 XP tokens on-chain, and receive Metaplex Core credential NFTs upon course completion.

**Live demo**: https://app-dun-beta.vercel.app

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 App Router |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 + shadcn/ui (new-york) |
| Fonts | Geist Mono (headings) + Geist (body) |
| CMS | Sanity (hosted Studio) |
| Database | Supabase (profiles, XP, completions, community) |
| Auth | Clerk (Google + GitHub OAuth) + Solana Wallet Adapter |
| Code Editor | Monaco Editor (VS Code engine in-browser) |
| i18n | next-intl (EN, PT-BR, ES) |
| Analytics | PostHog + GA4 + Sentry |
| Solana | @solana/web3.js + Wallet Adapter + Metaplex Core + Anchor |
| PWA | Service Worker + Web App Manifest |
| Deployment | Vercel |

---

## Quick Start

```bash
git clone https://github.com/konradbachowski/superteam-academy
cd superteam-academy/app

npm install

# Copy and fill environment variables
cp .env.local.example .env.local

npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

---

## Pages

| Route | Description |
|---|---|
| `/` | Landing page — hero, learning tracks preview, social proof |
| `/courses` | Course catalog — filterable by difficulty, search |
| `/courses/[slug]` | Course detail — modules, XP reward, enroll CTA, student reviews |
| `/courses/[slug]/lessons/[id]` | Lesson view — split: content + Monaco editor, prev/next |
| `/leaderboard` | XP rankings from Supabase, linked to public profiles |
| `/certificates/[id]` | Public credential page — on-chain verification, Twitter share |
| `/community` | Forum — posts, upvotes, comments |
| `/onboarding` | 4-question quiz → personalized course recommendation |
| `/dashboard` | Real XP balance, level, streak, recent activity feed |
| `/profile/[username]` | Public profile — credentials, achievements, completed courses |
| `/settings` | Account settings — display name, bio, visibility toggle |
| `/admin` | Admin panel — wallet-gated access |

---

## Features

### XP & Progression
- **Real XP tracking** in Supabase (`profiles.total_xp`) — updated on lesson completion via `increment_xp` RPC
- **localStorage sync** (`useSyncXp`) — one-time backfill of historical completions to Supabase on first wallet connect
- **Level derivation**: `floor(sqrt(xp / 100))` — displayed as badge on profile and dashboard
- **Streak tracking** — daily activity via `useStreak` hook

### Leaderboard
- Queries Supabase `profiles` ordered by `total_xp DESC`
- Only `is_public = true` profiles shown
- Rows link to public profile pages

### Authentication
- **Clerk** handles Google + GitHub OAuth
- **Solana Wallet Adapter** for on-chain identity (Phantom, Solflare)
- Both identities stored in `profiles` — wallet address + social accounts unified

### Community
- Forum posts with upvotes and comments
- Display name shown from Supabase profile (falls back to wallet address)
- Author links to public profile

### Onboarding
- 4-question quiz: experience level, background, goal, time commitment
- Result card with recommended course, XP reward preview, and direct CTA
- Resolves to real existing course slugs from Sanity (no dead links)

### Newsletter Popup
- Appears after 8s, once per day (localStorage rate limit)
- Never shows again after subscribing
- If wallet connected and already subscribed in DB — suppressed permanently

### PWA
- Web App Manifest + Service Worker
- Installable on iOS and Android
- Offline-capable static pages

### Credential NFTs
- Fetched via Helius DAS API (`getAssetsByOwner`)
- Displayed on public profile page with track badge, level, and XP
- Explorer link to Solana Explorer

---

## Environment Variables

### Solana / On-Chain

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_PROGRAM_ID` | Yes | Deployed Anchor program (`64XGGSc32TUX7rxge5u4Qsv55RQN5ybSwS4B1eksWTxy`) |
| `NEXT_PUBLIC_CLUSTER` | Yes | `devnet` or `mainnet-beta` |
| `NEXT_PUBLIC_XP_MINT` | Yes | Token-2022 XP mint address |
| `NEXT_PUBLIC_RPC_URL` | Recommended | Custom RPC endpoint |
| `NEXT_PUBLIC_HELIUS_API_KEY` | Recommended | Helius key for DAS + RPC |
| `NEXT_PUBLIC_HELIUS_RPC_URL` | Optional | Full Helius RPC URL (overrides API key) |

### Supabase

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon public key |

### Sanity CMS

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Yes | Sanity project ID |
| `NEXT_PUBLIC_SANITY_DATASET` | No | Dataset name (default: `production`) |

### Clerk (Auth)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key |

### Analytics

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Optional | GA4 measurement ID |
| `NEXT_PUBLIC_POSTHOG_KEY` | Optional | PostHog project API key |
| `NEXT_PUBLIC_POSTHOG_HOST` | Optional | PostHog host (default: `https://eu.i.posthog.com`) |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional | Sentry DSN |

---

## Supabase Setup

Run migrations from `supabase/migrations/` in order, or use the SQL below directly in your Supabase SQL Editor.

### Tables

```sql
-- User profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE,
  google_id TEXT UNIQUE,
  github_id TEXT UNIQUE,
  username TEXT UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  twitter_handle TEXT,
  github_handle TEXT,
  is_public BOOLEAN DEFAULT true,
  total_xp INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Linked OAuth / wallet accounts
CREATE TABLE linked_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
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

-- Lesson completions (XP history)
CREATE TABLE lesson_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  course_slug TEXT NOT NULL,
  course_title TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  lesson_title TEXT NOT NULL,
  xp_earned INT NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(wallet_address, lesson_id)
);

-- Course reviews
CREATE TABLE course_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_slug TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  display_name TEXT,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(course_slug, wallet_address)
);

-- Community posts
CREATE TABLE forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_wallet TEXT NOT NULL,
  author_display_name TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  upvotes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Newsletter subscribers
CREATE TABLE newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  wallet_address TEXT,
  subscribed_at TIMESTAMPTZ DEFAULT now()
);
```

### RPC Function (required for XP increments)

```sql
CREATE OR REPLACE FUNCTION increment_xp(wallet TEXT, amount INT)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO profiles (wallet_address, total_xp)
  VALUES (wallet, amount)
  ON CONFLICT (wallet_address)
  DO UPDATE SET total_xp = profiles.total_xp + amount;
END;
$$;
```

---

## Project Structure

```
src/
├── app/
│   ├── [locale]/                    # i18n root (en, pt-BR, es)
│   │   ├── (public)/
│   │   │   ├── page.tsx             # Landing page
│   │   │   ├── courses/             # Catalog, detail, lesson view
│   │   │   ├── leaderboard/         # XP leaderboard
│   │   │   ├── certificates/[id]/   # Public credential page
│   │   │   ├── community/           # Forum posts
│   │   │   ├── onboarding/          # Personalized path quiz
│   │   │   └── admin/               # Admin panel
│   │   ├── (auth)/
│   │   │   ├── dashboard/           # Learner dashboard (real XP + activity)
│   │   │   ├── profile/             # Own profile
│   │   │   ├── profile/[username]/  # Public profile
│   │   │   └── settings/            # Account settings
│   │   └── layout.tsx
│   ├── api/
│   │   └── lessons/complete/        # Backend-signed lesson completion stub
│   ├── layout.tsx                   # Root layout (ClerkProvider, fonts, PWA)
│   └── globals.css
├── components/
│   ├── ui/                          # shadcn/ui primitives
│   ├── layout/                      # Header, Footer, NewsletterPopup
│   ├── course/                      # CourseCard, CourseGrid, ReviewSection
│   ├── gamification/                # XPBar, StreakWidget, LevelBadge
│   ├── editor/                      # MonacoEditor, CodeChallenge
│   ├── solana/                      # WalletButton, CredentialCard
│   ├── leaderboard/                 # LeaderboardTable
│   └── providers/                   # WalletProvider, PostHogProvider
├── services/
│   ├── learning-progress.ts         # LearningProgressService
│   ├── credentials.ts               # Helius DAS credential queries
│   ├── leaderboard.ts               # Supabase XP leaderboard
│   └── streak.ts                    # Streak tracking
├── lib/
│   ├── pda.ts                       # PDA derivation helpers
│   ├── bitmap.ts                    # Lesson progress bitmap helpers
│   ├── solana.ts                    # Connection, XP balance
│   ├── explorer.ts                  # solanaExplorerUrl (SSR-safe)
│   ├── sanity.ts                    # Sanity GROQ client
│   ├── supabase.ts                  # Supabase client + profile helpers
│   ├── analytics.ts                 # PostHog + GA4 events
│   └── utils.ts                     # cn(), formatting helpers
├── hooks/
│   ├── useXpBalance.ts              # Reads total_xp from Supabase profiles
│   ├── useActivity.ts               # Recent lesson completions feed
│   ├── useSyncXp.ts                 # One-time localStorage → Supabase XP sync
│   ├── useEnrollment.ts             # On-chain enrollment state
│   ├── useCredentials.ts            # Credential NFTs via Helius DAS
│   ├── useProfile.ts                # User profile from Supabase
│   └── useStreak.ts                 # Daily learning streak
├── types/                           # Shared TypeScript interfaces + TRACKS
└── i18n/
    ├── routing.ts                   # next-intl locale config
    ├── request.ts                   # Server-side message loader
    └── messages/
        ├── en.json
        ├── pt-BR.json
        └── es.json
```

---

## On-Chain Integration

**Program ID (Devnet)**: `64XGGSc32TUX7rxge5u4Qsv55RQN5ybSwS4B1eksWTxy`

### Transaction Signing

| Action | Signer | Instruction |
|---|---|---|
| Enroll in course | Learner wallet | `enroll` |
| Complete lesson + mint XP | Backend keypair | `complete_lesson` |
| Finalize course | Backend keypair | `finalize_course` |
| Issue credential NFT | Backend keypair | `issue_credential` |

The learner signs only enrollment. All progress is backend-signed to prevent cheating.

### PDA Seeds

- Config: `["config"]`
- Course: `["course", courseId]`
- Enrollment: `["enrollment", courseId, learnerPubkey]`
- MinterRole: `["minter", minterPubkey]`
- AchievementType: `["achievement", achievementId]`
- AchievementReceipt: `["achievement_receipt", achievementId, recipientPubkey]`

---

## Development Commands

```bash
npm run dev      # Dev server (http://localhost:3001)
npm run build    # Production build
npm run lint     # ESLint
```

---

## Deployment

1. Push to GitHub — Vercel deploys automatically on every push to `main`.
2. Set **Root Directory** to `app` in Vercel project settings.
3. Add all environment variables under **Settings > Environment Variables**.
4. Run Supabase migrations (SQL Editor or `supabase db push`).

Minimum required env vars for a working deployment:
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `NEXT_PUBLIC_PROGRAM_ID` + `NEXT_PUBLIC_CLUSTER` + `NEXT_PUBLIC_XP_MINT`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY`

---

## Admin Panel

The admin panel at `/admin` is wallet-gated. Only wallets listed in `NEXT_PUBLIC_ADMIN_WALLETS` can access it.

### Authorized Wallets

Configure in `.env.local` (comma-separated for multiple wallets):

```
NEXT_PUBLIC_ADMIN_WALLETS=8RER7VKxDjHgruqJPgQhKo54cUTTsdX5iLoiKRTjsB1f
```

If the variable is not set, the default authorized wallet is `8RER7VKxDjHgruqJPgQhKo54cUTTsdX5iLoiKRTjsB1f`.

Visitors without an authorized wallet will see an "Access Denied" page. The panel shows real Supabase data: user count, forum threads, replies, recent signups, and recent forum activity.

---

## Bounty Submission

Superteam Brazil hackathon — LMS for Solana developers.

PR: https://github.com/solanabr/superteam-academy/pull/37
Live demo: https://app-dun-beta.vercel.app
