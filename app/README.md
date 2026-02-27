# Superteam Brazil Learning Management System (LMS) dApp

A Learning Management System dApp for **Superteam Brazil Academy**, built for the [Superteam Earn bounty](https://superteam.fun/earn/listing/superteam-academy/). Learners connect a Solana wallet to track progress, earn XP, and complete courses with on-chain credential support (stubbed for production swap).

**Credits:** [Superteam Brazil](https://x.com/superteambr) (@superteambr); prizes by [@kauenet](https://x.com/kauenet).

## Features

- **Wallet & auth** — Multi-wallet adapter (Phantom and compatible Solana wallets); optional Google/GitHub sign-in via NextAuth for account linking.
- **Courses & lessons** — Catalog with filters (difficulty, topic, duration) and full-text search; course detail with progress bar and enrollment; lesson view with resizable split layout, markdown content with syntax highlighting, and code challenges (objectives, test cases, hints, Run).
- **Progress & gamification** — Per-wallet progress; XP and level (`floor(sqrt(xp/100))`); streak calendar and milestones; achievements (locked/unlocked); leaderboard with timeframe and course filter; recommended next courses and recent activity.
- **Credentials** — Certificate view with share, verify link, and download; stub for Metaplex Core NFTs (production: on-chain).
- **Enrollment** — Enroll CTA per course (stub; production: learner-signed enroll instruction).
- **Multi-language** — Portuguese (PT-BR), Spanish, English via i18n context and language switcher in the header.
- **Theme** — Light/dark mode with persistence.
- **Analytics** — Custom events (`lesson_complete`, `enroll`) to `POST /api/analytics`; wire to GA4/Sentry via env.
- **Open-source** — MIT; forkable; clean service layer for the [Superteam Academy](https://github.com/solanabr/superteam-academy) program/backend.

## Tech stack

- **Frontend:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS, Recharts, react-markdown, react-resizable-panels
- **Wallet:** Solana Wallet Adapter, `@solana/web3.js`
- **Auth:** NextAuth.js (Google, GitHub; optional)
- **Backend:** Next.js API routes (progress, xp, leaderboard, enroll, credentials, streak, analytics)
- **Service layer:** `lib/services/learning-progress.ts` — stubs for progress, XP, streak, leaderboard, credentials, achievements, enrollment; swap per `docs/INTEGRATION.md`

## Prerequisites

- Node.js 18+
- npm or yarn

## Getting started

1. **Clone and install**

   ```bash
   git clone <your-repo-url>
   cd superearn
   npm install
   ```

2. **Environment (optional)**

   Create `.env.local` for overrides:

   ```env
   NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
   # Optional: AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, AUTH_GITHUB_ID, AUTH_GITHUB_SECRET
   ```

   Omit to use defaults (Devnet RPC; wallet-only auth).

3. **Run locally**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

4. **Build for production**

   ```bash
   npm run build
   npm start
   ```

## Project structure

| Path | Description |
|------|-------------|
| `app/` | Pages: `/`, `/courses`, `/courses/[slug]`, `/courses/[slug]/lessons/[id]`, `/dashboard`, `/profile`, `/profile/[username]`, `/leaderboard`, `/settings`, `/certificates/[id]` |
| `app/api/` | Routes: `progress`, `xp`, `leaderboard`, `enroll`, `credentials`, `streak`, `analytics`, `auth/[...nextauth]` |
| `components/` | Header (XP badge, language, theme), Footer, WalletProvider, StatsCharts, CourseCardIcon, LessonMarkdown, LessonResizableSplit, etc. |
| `lib/data/` | Courses, lessons, achievements |
| `lib/services/` | Learning progress service (stubs); streak (frontend-only) |
| `lib/i18n/` | Messages (en, pt, es) and context |
| `lib/theme/` | Light/dark theme context |

## Documentation

| Doc | Description |
|-----|-------------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture, data flow, service interfaces |
| [docs/CUSTOMIZATION.md](docs/CUSTOMIZATION.md) | Theme, languages, gamification customization |
| [docs/CMS_GUIDE.md](docs/CMS_GUIDE.md) | Content schema and CMS integration |
| [docs/INTEGRATION.md](docs/INTEGRATION.md) | On-chain account structures, instruction mapping, production swap |
| [docs/IMPLEMENTATION_CHECKLIST.md](docs/IMPLEMENTATION_CHECKLIST.md) | Bounty requirements vs implemented features (for judges) |
| [SUBMISSION_GUIDE.md](SUBMISSION_GUIDE.md) | Bounty submission steps and PR text |

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/progress?wallet=` | Progress (completed lessons per course) |
| POST | `/api/progress` | Mark lesson complete |
| GET | `/api/xp?wallet=` | XP balance and level (stub) |
| GET | `/api/leaderboard?wallet=&timeframe=weekly\|monthly\|all-time&courseId=` | Leaderboard (stub; optional course filter) |
| POST | `/api/enroll` | Enroll in course (stub) |
| GET | `/api/credentials?wallet=` | Credentials (stub) |
| GET | `/api/streak?wallet=` | Streak data (frontend-only) |
| POST | `/api/analytics` | Analytics events (stub; wire to GA4/Sentry) |

## Deployment

Deploy to Vercel (or any Node host). Set `NEXTAUTH_URL` and `NEXTAUTH_SECRET` if using NextAuth; set `NEXT_PUBLIC_SOLANA_RPC` for a custom RPC.

```bash
npm run build
```

## License

MIT
