# Superteam Academy — Frontend Submission

## Submission Overview

Full-featured Learning Management System frontend for the Superteam Academy on-chain program, built as a Next.js application within the monorepo's `app/` directory.

**Repository:** https://github.com/baladithyab/superteam-academy/tree/feat/frontend-lms-app
**Branch:** `feat/frontend-lms-app`
**PR Target:** `solanabr/superteam-academy:main` ← `baladithyab/superteam-academy:feat/frontend-lms-app`

## Deployment

**To deploy to Vercel:**
1. Import the GitHub repo: `baladithyab/superteam-academy`
2. Set root directory: `app`
3. Framework preset: Next.js
4. Add environment variables from `app/.env.example`
5. Deploy

**To run locally:**
```bash
cd app
cp .env.example .env.local
pnpm install
pnpm dev
```

Build verified: `pnpm run build` completes with zero errors.

## What's Implemented ✅

### Core Features (On-Chain Integration)
1. **Wallet Authentication** — Solana Wallet Adapter (Phantom, Solflare) with auto-connect
2. **XP Balance Display** — Real-time Token-2022 soulbound XP balance from on-chain ATA
3. **Course Enrollment** — Learner-signed enrollment transactions with PDA derivation
4. **Credential NFT Display** — Helius DAS API integration for Metaplex Core credentials
5. **Leaderboard** — XP rankings from Token-2022 balance indexing (mock data + Helius integration)
6. **Course Progress** — Bitmap-based lesson tracking with visual progress bars

### Pages (7 routes)
1. **Landing Page** (`/`) — Hero, stats, learning tracks, feature highlights, CTA
2. **Course Catalog** (`/courses`) — Filterable grid by track and difficulty level
3. **Course Detail** (`/courses/[id]`) — Lessons, XP breakdown, enrollment, code editor preview
4. **Leaderboard** (`/leaderboard`) — Top 3 podium + full ranked list with XP bars
5. **Profile** (`/profile`) — XP balance, streak widget, credentials, stats dashboard
6. **Achievements** (`/achievements`) — Gallery of 12 achievements with XP rewards and supply
7. **API Routes** (`/api/courses`, `/api/leaderboard`) — Server-side data endpoints

### Technical Highlights
- **PDA Derivation** — All 6 PDA types from SPEC.md (Config, Course, Enrollment, MinterRole, AchievementType, AchievementReceipt)
- **Bitmap Helpers** — Full implementation of `isLessonComplete`, `countCompletedLessons`, `getProgressPercent`
- **Service Layer** — Clean separation: course-service, xp-service, credential-service, streak-service
- **Type System** — Complete TypeScript types matching on-chain account structures
- **i18n Ready** — Locale files for PT-BR, ES, EN with language switcher component
- **Responsive** — Mobile-first design, works on all screen sizes
- **Dark Theme** — Solana brand colors (#9945FF purple, #14F195 green), glassmorphism cards
- **Code Editor** — Syntax-highlighted Rust/TypeScript preview (Monaco ready)

## What's Stubbed 🔧

All stubbed features have **clean service interfaces** ready for backend implementation:

1. **Lesson Completion** — `LessonCompletionService` interface (requires backend signer)
2. **Course Finalization** — `CourseFinalizationService` interface (requires backend signer)
3. **Credential Issuance** — `CredentialIssuanceService` interface (requires backend signer)
4. **Achievement Claiming** — Documented in UI (requires minter role)
5. **Streak Persistence** — localStorage implementation (production: backend/PDA)
6. **Full i18n Routing** — Locale files ready, next-intl wiring needs completion

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 |
| Wallet | @solana/wallet-adapter-react v0.15 |
| On-chain | @coral-xyz/anchor v0.30, @solana/web3.js v1 |
| Token | @solana/spl-token (Token-2022 support) |
| NFTs | Helius DAS API (Metaplex Core) |
| Components | Radix UI primitives |
| Icons | Lucide React |
| Build | Turbopack (3s builds) |
| Deploy | Vercel-ready |

## Architecture

```
app/
├── src/
│   ├── app/                    # 7 App Router routes
│   ├── components/
│   │   ├── layout/             # Navbar, Footer, LanguageSwitcher
│   │   ├── wallet/             # WalletProvider, WalletButton
│   │   └── courses/            # CourseCard
│   ├── lib/
│   │   ├── solana/             # PDA derivation, connection management
│   │   ├── services/           # Course, XP, credential, streak services
│   │   └── utils/              # cn(), bitmap helpers
│   └── types/
│       └── academy.ts          # Types + constants matching on-chain spec
├── public/
│   ├── locales/                # i18n: en, pt-BR, es
│   └── images/                 # Course assets
├── .env.example                # Environment template
├── next.config.ts              # Turbopack config
└── vercel.json                 # Deployment config
```

## On-Chain Program Reference

- **Program ID:** `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf`
- **XP Mint:** `xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3`
- **Network:** Solana Devnet

## Demo Instructions

1. Open the app in browser
2. Click "Connect Wallet" → choose Phantom (switch to Devnet in wallet settings)
3. Browse courses → select "Anchor 101"
4. Click "Enroll Now" → wallet prompts for signature
5. View profile → see XP balance, streak widget
6. Check leaderboard → see XP rankings
7. Browse achievements → see available achievement NFTs

## File Count

- **34 files** in the `app/` directory
- **~2,500 lines** of application code
- **Zero build errors**, TypeScript strict mode
- Clean, well-commented, production-quality code
