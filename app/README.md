# Superteam Academy

A decentralized learning platform for Solana development. Learners enroll in courses, complete interactive coding challenges, earn soulbound XP tokens (Token-2022), collect Metaplex Core credential NFTs, and climb the leaderboard.

**[Live Demo](https://superteam-academy-jade.vercel.app/)** | **[Demo Video](https://www.loom.com/share/918518c7613848ebbd7523e2fcc6dcb4)** | **[Tweet](https://x.com/ArpitaGanatra/status/2029371774555832768)**

## Features

- **Wallet + OAuth Authentication** — Phantom, Solflare, Coinbase via Solana Wallet Adapter; Google and GitHub via NextAuth
- **Interactive Code Editor** — Monaco Editor with syntax highlighting, auto-save to localStorage, and in-browser test execution
- **Soulbound XP Tokens** — Token-2022 with NonTransferable + PermanentDelegate extensions
- **On-Chain Credentials** — Metaplex Core NFTs with PermanentFreezeDelegate (soulbound, wallet-visible)
- **Gamification** — Streaks with freeze tokens, 16 achievement types, XP leaderboard with time filters
- **Internationalization** — English, Portuguese (PT-BR), Spanish via custom locale provider
- **Analytics** — GA4 page views + custom events, PostHog session recordings, Sentry error monitoring
- **CMS Integration** — Sanity CMS for course content with GROQ queries; falls back to hardcoded data
- **Service Layer** — Interface-driven architecture with localStorage stubs swappable to on-chain implementations

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, React 19, React Compiler) |
| Styling | Tailwind CSS 4, shadcn/ui, tw-animate-css |
| Wallet | @solana/wallet-adapter-react |
| Blockchain | @solana/web3.js 1.x, @coral-xyz/anchor 0.32 |
| Code Editor | Monaco Editor (@monaco-editor/react) |
| Markdown | react-markdown + remark-gfm + rehype-highlight |
| Auth | NextAuth 4 (Google, GitHub providers) |
| Database | Supabase (user profiles, RLS) |
| CMS | Sanity v5 (course content, Sanity Studio embedded at `/studio`) |
| Analytics | GA4, PostHog, Sentry |
| Animations | Motion (Framer Motion), canvas-confetti |

## Getting Started

### Prerequisites

- Node.js 20+
- npm or pnpm

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The app runs fully with zero env vars configured — all services fall back to localStorage stubs and hardcoded course data.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Environment Variables

All optional. The app works without any of these configured.

```env
# ── Solana ──
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_PROGRAM_ID=ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf
NEXT_PUBLIC_XP_MINT=xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3

# ── NextAuth ──
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=                    # Required for production
GOOGLE_CLIENT_ID=                   # Google OAuth
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=                   # GitHub OAuth
GITHUB_CLIENT_SECRET=

# ── Supabase ──
NEXT_PUBLIC_SUPABASE_URL=           # User profiles database
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # Server-side writes (bypasses RLS)

# ── Sanity CMS ──
NEXT_PUBLIC_SANITY_PROJECT_ID=      # Course content CMS
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=                   # Mutations (Studio)
SANITY_REVALIDATE_SECRET=           # Webhook revalidation

# ── Analytics ──
NEXT_PUBLIC_GA4_ID=                 # Google Analytics 4
NEXT_PUBLIC_POSTHOG_KEY=            # PostHog session recordings
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
NEXT_PUBLIC_SENTRY_DSN=             # Sentry error monitoring
SENTRY_AUTH_TOKEN=                  # Source map uploads

# ── Helius ──
NEXT_PUBLIC_HELIUS_RPC_URL=         # DAS API for credential queries
```

## Project Structure

```
app/
├── sanity/
│   └── schemas/            # Sanity CMS schema definitions
│       ├── course.ts       # Course document type
│       ├── module.ts       # Module object type
│       ├── lesson.ts       # Lesson object type (video/reading/challenge)
│       ├── testCase.ts     # Test case object type
│       └── instructor.ts   # Instructor document type
└── src/
    ├── app/                # Next.js App Router
    │   ├── page.tsx        # Landing page
    │   ├── courses/
    │   │   ├── page.tsx    # Course catalog (filters, search, learning paths)
    │   │   └── [slug]/
    │   │       ├── page.tsx          # Course detail (curriculum, enrollment)
    │   │       └── lessons/[id]/
    │   │           └── page.tsx      # Lesson viewer (editor, tests, markdown)
    │   ├── dashboard/      # User dashboard (stats, activity, streaks)
    │   ├── leaderboard/    # XP leaderboard (weekly/monthly/all-time)
    │   ├── profile/        # User profile + public profiles (/profile/[username])
    │   ├── settings/       # Account settings (OAuth, theme, locale, wallet)
    │   ├── certificates/[id]/ # NFT credential viewer
    │   ├── studio/         # Embedded Sanity Studio
    │   └── api/            # API routes
    │       ├── auth/       # NextAuth + user upsert
    │       ├── lessons/complete/     # POST: mark lesson complete
    │       ├── courses/finalize/     # POST: finalize course
    │       ├── credentials/issue/    # POST: issue credential NFT
    │       ├── credentials/upgrade/  # POST: upgrade credential
    │       ├── achievements/claim/   # POST: claim achievement
    │       ├── leaderboard/          # GET: paginated leaderboard
    │       ├── streaks/              # GET/POST: streak management
    │       └── users/by-username/    # GET: public profile lookup
    ├── components/
    │   ├── ui/             # shadcn/ui primitives (button, card, badge, etc.)
    │   ├── layout/         # Header, Footer
    │   └── course/         # CourseCard, LearningTracks, SocialProof, PlatformFeatures
    ├── data/               # Hardcoded fallback data
    │   ├── courses.ts      # 10 courses with modules and lessons
    │   ├── lesson-content.ts       # Lesson markdown + code (EN)
    │   ├── lesson-content-pt-BR.ts # Portuguese translations
    │   ├── lesson-content-es.ts    # Spanish translations
    │   ├── leaderboard.ts  # Mock leaderboard entries
    │   ├── dashboard.ts    # Mock dashboard stats
    │   └── profile.ts      # Mock profile data
    ├── services/           # Service layer
    │   ├── interfaces.ts   # 8 service contracts
    │   ├── service-factory.ts      # Environment-based service creation
    │   ├── index.ts        # Barrel exports + singleton instances
    │   ├── progress.service.ts     # Enrollment + lesson completion (localStorage)
    │   ├── xp.service.ts           # XP balance tracking
    │   ├── streak.service.ts       # Daily streaks with freeze tokens
    │   ├── credential.service.ts   # Credential NFT tracking
    │   ├── leaderboard.service.ts  # Leaderboard rankings
    │   ├── achievement.service.ts  # Achievement badges
    │   ├── activity.service.ts     # Activity feed
    │   └── onchain/        # Devnet on-chain implementations
    │       ├── progress.service.ts   # Reads enrollment PDAs, sends enroll tx
    │       ├── xp.service.ts         # Token-2022 ATA balance
    │       ├── credential.service.ts # Helius DAS API for Metaplex Core NFTs
    │       └── leaderboard.service.ts
    ├── providers/          # React context providers
    │   ├── theme-provider.tsx      # next-themes (dark/light/system)
    │   ├── session-provider.tsx    # NextAuth session
    │   ├── wallet-provider.tsx     # Solana Wallet Adapter
    │   ├── solana-program-provider.tsx # Anchor program injection
    │   ├── auth-provider.tsx       # User profile + wallet linking
    │   ├── locale-provider.tsx     # i18n with nested key lookup
    │   └── analytics-provider.tsx  # GA4 + PostHog + Sentry init
    ├── lib/
    │   ├── analytics.ts    # Event tracking (12 custom events)
    │   ├── auth.ts         # NextAuth config (Google + GitHub)
    │   ├── supabase.ts     # Browser + server Supabase clients
    │   ├── sanity.ts       # Sanity client + GROQ queries
    │   ├── sanity-fetch.ts # Course/lesson fetchers with type mapping
    │   ├── utils.ts        # cn() helper
    │   └── solana/
    │       ├── constants.ts    # Program ID, XP mint, PDA derivation helpers
    │       ├── program.ts      # Anchor program type
    │       ├── enrollment.ts   # Enrollment PDA deserialization
    │       └── idl/            # Anchor IDL
    ├── i18n/
    │   ├── config.ts       # Locale definitions (en, pt-BR, es)
    │   ├── en.json         # English translations
    │   ├── pt-BR.json      # Portuguese translations
    │   └── es.json         # Spanish translations
    └── types/
        └── index.ts        # All TypeScript type definitions
```

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth OAuth handlers |
| `/api/auth/upsert-user` | POST | Create or update user profile in Supabase |
| `/api/lessons/complete` | POST | Mark lesson complete, award XP |
| `/api/courses/finalize` | POST | Finalize course completion, award bonus XP |
| `/api/credentials/issue` | POST | Issue Metaplex Core credential NFT |
| `/api/credentials/upgrade` | POST | Upgrade credential attributes |
| `/api/achievements/claim` | POST | Claim achievement badge |
| `/api/leaderboard` | GET | Paginated leaderboard with time filters |
| `/api/streaks` | GET/POST | Get or update streak data |
| `/api/users/by-username` | GET | Public profile lookup by username |

## On-Chain Integration

| Component | Details |
|-----------|---------|
| Program ID | `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf` |
| XP Mint | `xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3` |
| XP Level | `Level = floor(sqrt(xp / 100))` |
| RPC | Defaults to devnet; configurable via `NEXT_PUBLIC_SOLANA_RPC_URL` |

The service factory (`service-factory.ts`) switches between localStorage stubs and on-chain implementations based on environment variables. When `HELIUS_RPC_URL` and `NEXT_PUBLIC_SOLANA_RPC_URL` are set, credential queries use the Helius DAS API.

## Documentation

- [Architecture](../docs/ARCHITECTURE.md) — Component structure, data flow, service interfaces
- [CMS Guide](../docs/CMS_GUIDE.md) — Sanity setup, content schema, publishing workflow
- [Customization](../docs/CUSTOMIZATION.md) — Theming, i18n, adding courses, deployment

## License

MIT
