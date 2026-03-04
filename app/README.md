# Caminho — Solana Developer Learning Platform

> "Caminho" means "path" in Portuguese — your path to mastering Solana development.

Caminho is an open-source, gamified learning management system (LMS) for Solana development. Think Codecademy meets Cyfrin Updraft — interactive coding challenges, on-chain credentials as evolving cNFTs, XP-based leveling, and a community leaderboard, built for the global Solana ecosystem.

Built for the [Superteam Brazil Hackathon](https://earn.superteam.fun).

## Live Demo

[https://caminho.vercel.app](https://caminho.vercel.app) <!-- replace with actual URL -->

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui + Radix UI |
| CMS | Sanity v3 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth + Solana Wallet Adapter |
| Blockchain | Solana Web3.js, Token-2022, Metaplex Bubblegum (cNFTs) |
| Code Editor | CodeMirror 6 |
| Analytics | GA4 + PostHog + Sentry |
| Animations | Framer Motion |
| i18n | Custom (EN, PT-BR, ES) |
| Deployment | Vercel |

## Features

- **Interactive Lessons** — Split-pane view with markdown content + embedded CodeMirror editor
- **Code Challenges** — Rust/TypeScript/JSON challenges with pass/fail feedback
- **Gamification** — XP, levels, streaks, 43 achievements
- **On-Chain Credentials** — Evolving cNFTs (Metaplex Bubblegum) on Solana Devnet
- **Leaderboard** — Global rankings indexed from XP token balances via Helius DAS API
- **Multi-auth** — Email, Google, GitHub, Solana Wallet (Phantom, Solflare, Torus, Ledger)
- **Internationalization** — EN, PT-BR, ES with language switcher
- **Dark/Light Mode** — System-aware with manual toggle
- **Admin Dashboard** — Course management, user analytics, enrollment tracking
- **Public Profiles** — Shareable at `/profile/[username]`

## Local Development

### Prerequisites

- Node.js 20+
- npm 10+
- A [Supabase](https://supabase.com) project
- A [Sanity](https://sanity.io) project
- A Solana Devnet RPC URL (free via [Helius](https://helius.dev))

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/caminho
cd caminho
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Sanity CMS
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your-sanity-token

# Solana / Helius
NEXT_PUBLIC_SOLANA_RPC_URL=https://devnet.helius-rpc.com/?api-key=your-key
SOLANA_RPC_URL=https://devnet.helius-rpc.com/?api-key=your-key
NEXT_PUBLIC_HELIUS_API_KEY=your-helius-key
NEXT_PUBLIC_ACADEMY_PROGRAM_ID=ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf
NEXT_PUBLIC_CREDENTIAL_COLLECTION=your-track-collection-pubkey
NEXT_PUBLIC_ENABLE_ONCHAIN_BRIDGE=false
NEXT_PUBLIC_ONCHAIN_STRICT_WRITES=false
ACADEMY_BACKEND_SIGNER=base58-secret-key-for-backend-signer

# Analytics (all optional — app works without these)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx  # optional — omit to disable Sentry
SENTRY_ORG=your-sentry-org                         # optional
SENTRY_PROJECT=your-sentry-project                 # optional
```

`ACADEMY_BACKEND_SIGNER` supports either:
- base58-encoded 64-byte secret key
- JSON array secret key format (e.g. `[12,34,...]`)

### 3. Database Setup

Run the SQL migrations in your Supabase dashboard (SQL Editor). Migration files are located in `/supabase/migrations/`. Apply them in order.

Key tables created:
- `profiles` — user profile data
- `linked_wallets` — wallet addresses per user
- `enrollments` — course enrollment + lesson progress (bitmap)
- `user_xp` — XP totals, streaks, achievement bitmap
- `xp_events` — XP transaction log

### 4. Sanity CMS Setup

```bash
cd sanity-studio
npm install
npx sanity dev  # starts Sanity Studio at localhost:3333
```

Import the sample course via the Sanity Studio interface. See [CMS_GUIDE.md](./CMS_GUIDE.md) for details.

### 5. Run the App

```bash
npm run dev  # starts at localhost:3000
```

The Sanity Studio runs separately at `localhost:3333`.

## Project Structure

```
caminho/
├── src/
│   ├── app/
│   │   ├── (public)/           # Unauthenticated routes (landing, auth, public profiles)
│   │   ├── (app)/              # Authenticated routes (dashboard, courses, leaderboard)
│   │   └── api/                # API routes (wallet auth)
│   ├── components/
│   │   ├── landing/            # Hero, Features, etc.
│   │   ├── layout/             # Navbar, Footer, Sidebar
│   │   ├── providers/          # Auth, Wallet, i18n, Analytics, Theme
│   │   ├── auth/               # Wallet sign-in button
│   │   ├── course/             # EnrollButton
│   │   ├── lesson/             # LessonClient
│   │   └── editor/             # CodeEditor (CodeMirror)
│   └── lib/
│       ├── services/           # LearningProgressService, OnChainReadService
│       ├── types/              # Domain types, XP helpers, achievement definitions
│       ├── cms/                # Sanity client + GROQ queries
│       ├── supabase/           # Browser + server + middleware clients
│       ├── i18n/               # Translations (en, pt-br, es)
│       └── analytics/          # GA4 + PostHog helpers
├── sanity-studio/              # Sanity CMS Studio (separate Next.js app)
└── public/                     # Static assets
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import into Vercel
3. Add all environment variables from `.env.local`
4. Deploy — Vercel handles the build automatically

### Sanity Studio

Deploy Sanity Studio separately:

```bash
cd sanity-studio
npx sanity deploy
```

## On-Chain Program

The gamification logic lives on the Anchor program at [github.com/solanabr/superteam-academy](https://github.com/solanabr/superteam-academy).

- **XP** — Soulbound Token-2022 (NonTransferable). Balance = XP. Level = `floor(sqrt(XP / 100))`.
- **Credentials** — Evolving cNFTs (Metaplex Bubblegum). One per track, upgrades as learner progresses.
- **Leaderboard** — Off-chain, indexed from XP token balances via Helius DAS API.

The frontend reads from Devnet via `OnChainReadService` in `src/lib/services/onchain-read.ts`. Local Supabase projection remains active for UI consistency, while bridge writes now support backend-signed on-chain submissions for completion/finalization paths.

Bridge write endpoints are exposed under:
- `/api/learning/*` (integration-doc compatible structure)
- `/api/onchain/*` (backward-compatible aliases)

For course enrollment/completion bridge writes, the app uses a string `courseId` seed (`<= 32` bytes). Configure Sanity `course.onChainCourseId` for stable on-chain IDs; when absent, the frontend falls back to `course.slug`.

Backend-signed endpoints now submit real devnet transactions for:
- `complete_lesson`
- `complete_course` / `finalize_course`
- `issue_credential`
- `upgrade_credential`
- `claim_achievement` (`award_achievement` on-chain path; backend signer must have active `MinterRole`)

Learner-signed flows now submit real devnet transactions from the connected wallet in UI for:
- `enroll` (course detail enroll CTA)
- `close_enrollment` (course detail, dashboard, and course catalog unenroll CTAs)

`start_lesson` is wired through `/api/learning/start-lesson` and lesson UI calls it when a lesson opens, but it is intentionally off-chain because the current on-chain program does not expose a `start_lesson` instruction.

For those actions to succeed:
- `ACADEMY_BACKEND_SIGNER` must match on-chain `Config.backend_signer`
- learner XP Token-2022 ATA must exist
- creator XP Token-2022 ATA must exist (for course finalization)
- `NEXT_PUBLIC_CREDENTIAL_COLLECTION` (or request `trackCollection`) must point to a valid Metaplex Core track collection

## Contributing

This project is open-source (MIT). Contributions, forks, and extensions are welcome. See [ARCHITECTURE.md](./ARCHITECTURE.md) for system design details before contributing.

## License

MIT
