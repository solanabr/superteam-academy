# Superteam Academy — Frontend

> Codecademy meets Cyfrin Updraft, on Solana. Earn verifiable XP tokens and soulbound credential NFTs as you learn.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 App Router |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + shadcn/ui (new-york) |
| Fonts | Geist Mono (headings) + Geist (body) |
| CMS | Sanity |
| Database | Supabase (profiles, streaks, linked accounts) |
| Auth | Solana Wallet Adapter + NextAuth (Google + GitHub) |
| Code Editor | Monaco Editor |
| i18n | next-intl (EN, PT-BR, ES) |
| Analytics | GA4 + PostHog + Sentry |
| Solana | @solana/web3.js + Wallet Adapter + Metaplex Core |
| Deployment | Vercel |

## Quick Start

```bash
cd app
npm install
cp .env.local .env.example  # fill in values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Copy `.env.local` and fill in the values:

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_PROGRAM_ID` | Yes | Anchor program address (`ACADBRCB3...`) |
| `NEXT_PUBLIC_CLUSTER` | Yes | `devnet` or `mainnet-beta` |
| `NEXT_PUBLIC_XP_MINT` | Yes | Token-2022 XP mint address |
| `NEXT_PUBLIC_HELIUS_API_KEY` | Recommended | For DAS API (credentials + leaderboard) |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Yes | Sanity project ID |
| `NEXTAUTH_SECRET` | Yes | Random secret for NextAuth |
| `GOOGLE_CLIENT_ID` / `SECRET` | Optional | Google OAuth |
| `GITHUB_CLIENT_ID` / `SECRET` | Optional | GitHub OAuth |

## Supabase Setup

Run this SQL in your Supabase project:

```sql
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
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE linked_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT,
  provider_id TEXT,
  UNIQUE(provider, provider_id)
);

CREATE TABLE streaks (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_activity_date DATE,
  streak_history JSONB DEFAULT '[]'
);
```

## Project Structure

```
src/
├── app/
│   ├── [locale]/           # i18n root
│   │   ├── (public)/       # Landing, Courses, Leaderboard, Certificates
│   │   └── (auth)/         # Dashboard, Profile, Settings
│   └── api/
│       ├── auth/[...nextauth]/  # NextAuth
│       └── lessons/complete/   # Backend-signed lesson completion stub
├── components/
│   ├── ui/                 # shadcn/ui
│   ├── layout/             # Header, Footer
│   ├── course/             # CourseCard, CourseGrid
│   ├── gamification/       # XPBar, StreakWidget, LevelBadge
│   ├── editor/             # MonacoEditor, CodeChallenge
│   ├── solana/             # WalletButton, CredentialCard
│   ├── leaderboard/        # LeaderboardTable
│   └── providers/          # WalletProvider, SessionProvider
├── services/               # Business logic layer
├── lib/                    # Utilities, clients, PDA helpers
├── hooks/                  # React hooks
├── types/                  # Shared TypeScript types
└── i18n/                   # Translation files + routing
```

## On-Chain Integration

Program: `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf`

**Learner signs**: `enroll`, `close_enrollment`
**Backend signs**: `complete_lesson`, `finalize_course`, `issue_credential`

See `src/lib/pda.ts` for PDA derivation helpers and `src/lib/bitmap.ts` for lesson progress helpers.

## Development

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run lint      # ESLint
```

## Deployment

Deploy to Vercel:
1. Connect your fork to Vercel
2. Set all env variables in the Vercel dashboard
3. Deploy — preview deployments on every PR

## Bounty Submission

This is a submission for the Superteam Brazil hackathon bounty.
PR target: `github.com/solanabr/superteam-academy`
