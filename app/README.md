# Superteam Academy — Frontend

Production-ready LMS frontend for Solana developer education. Built with Next.js 14, TypeScript, and integrated with the on-chain Anchor program on devnet.

## Features

- **🎓 Course Management** — Browse, enroll, and complete Solana development courses
- **⚡ On-Chain XP** — Soulbound Token-2022 XP tokens tracked in real-time
- **🏆 Credentials** — Metaplex Core NFT credentials displayed from wallet
- **📊 Leaderboard** — Rankings by XP via Helius DAS API
- **🔥 Streak Tracking** — Daily activity streaks with calendar visualization
- **🌍 i18n** — English, Portuguese (BR), and Spanish from day one
- **💼 Multi-Wallet** — Phantom, Solflare, Backpack support
- **📝 Code Editor** — Monaco Editor with Rust/TypeScript syntax highlighting
- **📈 Analytics** — PostHog, GA4, and Sentry integration ready
- **🎨 Dark Theme** — Solana-branded design with custom design tokens
- **♿ Accessible** — ARIA labels, keyboard navigation, semantic HTML
- **📱 Responsive** — Mobile-first design

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS + shadcn/ui |
| Blockchain | Solana Web3.js + Anchor |
| Wallet | Solana Wallet Adapter |
| i18n | next-intl |
| CMS | Sanity (headless) |
| Code Editor | Monaco Editor |
| Analytics | PostHog + GA4 + Sentry |

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SOLANA_RPC_URL` | Yes | Solana RPC endpoint |
| `NEXT_PUBLIC_PROGRAM_ID` | Yes | Academy program ID |
| `NEXT_PUBLIC_XP_MINT` | Yes | XP token mint address |
| `NEXT_PUBLIC_HELIUS_RPC_URL` | No | Helius DAS API for leaderboard |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | No | Sanity CMS project |
| `NEXT_PUBLIC_POSTHOG_KEY` | No | PostHog analytics |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | No | Google Analytics 4 |
| `NEXT_PUBLIC_SENTRY_DSN` | No | Sentry error tracking |

## Architecture

```
src/
├── app/                     # Next.js App Router pages
│   └── [locale]/            # i18n routing (en, pt-BR, es)
│       ├── page.tsx         # Landing page
│       ├── courses/         # Course listing and detail
│       ├── leaderboard/     # XP rankings
│       ├── profile/         # User profile with credentials
│       └── achievements/    # Achievement gallery
├── components/
│   ├── ui/                  # shadcn/ui primitives
│   ├── layout/              # Header, Footer, LanguageSwitcher
│   ├── courses/             # CourseCard, CourseGrid, LessonView
│   ├── gamification/        # XpDisplay, StreakDisplay, LevelProgress
│   ├── wallet/              # WalletProvider, ConnectButton
│   └── editor/              # CodeEditor (Monaco)
├── lib/
│   ├── solana/              # Program interaction, PDAs, constants
│   ├── services/            # LearningProgressService, StreakService
│   ├── sanity/              # CMS client
│   ├── hooks/               # useCourses, useEnrollmentProgress
│   ├── utils.ts             # Utility functions
│   └── analytics.ts         # PostHog + GA4 initialization
├── messages/                # i18n translation files
│   ├── en.json
│   ├── pt-BR.json
│   └── es.json
└── types/                   # TypeScript type definitions
```

## On-Chain Integration

### Fully Implemented (Devnet)
- ✅ Wallet connection (Phantom, Solflare, Backpack)
- ✅ XP balance display from Token-2022 accounts
- ✅ Credential NFT display via Helius DAS API
- ✅ Leaderboard from XP token holder indexing
- ✅ Course listing from on-chain PDAs
- ✅ Enrollment status checking

### Stubbed with Clean Abstractions
- 🔲 Lesson completion (requires backend co-signature)
- 🔲 Course finalization and credential issuance
- 🔲 Achievement claiming
- 🔲 Streak tracking (frontend-only, localStorage)

### Service Interface

```typescript
const service = getLearningProgressService();

// Get lesson progress
await service.getProgress(courseId, wallet);

// Complete a lesson (stub - needs backend)
await service.completeLesson(courseId, lessonIndex, wallet);

// Get XP balance
await service.getXp(wallet);

// Get streak data
service.getStreak(walletAddress);

// Get leaderboard
await service.getLeaderboard('all-time', 50);

// Get credentials
await service.getCredentials(walletAddress);
```

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Set environment variables in Vercel dashboard.

## Development

```bash
# Run dev server
npm run dev

# Type checking
npx tsc --noEmit

# Lint
npm run lint

# Build for production
npm run build
```

## License

MIT
