# Superteam Academy - Frontend Application

> The Solana-native learning platform for Latin America and beyond. Gamified education with on-chain credentials.

## Quick Start

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript (strict mode) |
| **UI** | Tailwind CSS v4 + shadcn/ui-style components |
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
├── app/[locale]/          # i18n-routed pages (10 routes)
├── components/
│   ├── ui/                # Button, Card, Badge, Input, Progress, Tabs, Avatar, Skeleton
│   ├── layout/            # Navbar, Footer
│   ├── course/            # CourseCard
│   └── gamification/      # XPDisplay, StreakCalendar, AchievementBadge
├── lib/
│   ├── services/          # Types, mock data, learning-progress, credentials, xp, leaderboard
│   ├── solana/            # Connection config
│   └── constants.ts       # Tracks, difficulties, XP formulas
├── providers/             # ThemeProvider, WalletProvider, AppProviders
├── i18n/                  # Config, routing, request
└── messages/              # en.json, pt-br.json, es.json
```

## Environment Variables

Copy `.env.example` to `.env.local`. See the file for all available options.

## Build

```bash
pnpm build    # Production build (zero errors)
pnpm lint     # ESLint
```

## Deployment

Import in Vercel, set environment variables, deploy. Preview deployments work for PRs.
