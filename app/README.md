# Superteam Academy — Frontend

The premier Solana learning platform for Latin American developers.  
Interactive courses · On-chain XP tokens · NFT credentials · Multilingual (PT-BR, ES, EN)

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://typescriptlang.org)
[![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF)](https://solana.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](../LICENSE)

## Features

- 🎓 **10 core pages** — Landing, Courses, Course Detail, Lesson View, Dashboard, Profile, Leaderboard, Settings, Certificate
- ⚡ **Solana-native auth** — Phantom, Solflare, Coinbase, and more via Wallet Adapter
- 🏆 **On-chain XP** — Soulbound Token-2022 tokens, level system, leaderboard
- 🎨 **NFT Credentials** — Metaplex Core soulbound badges, displayed via Helius DAS API
- 🔥 **Gamification** — Streaks, achievements, daily challenges, milestone rewards
- 💻 **Code Editor** — Monaco Editor with Rust/TypeScript challenges and test runner
- 🌍 **i18n** — PT-BR, ES, EN with cookie-based locale switching
- 🎨 **Trendy UI** — Dark-first, aurora gradients, glassmorphism, Framer Motion animations
- 📊 **Analytics** — GA4 + PostHog + Sentry
- 📝 **CMS** — Sanity headless CMS with course schema

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Components | Radix UI + custom shadcn-style |
| Wallet | Solana Wallet Adapter |
| Animations | Framer Motion |
| State | TanStack Query + Zustand |
| CMS | Sanity |
| Code Editor | Monaco Editor |
| Analytics | GA4 + PostHog |
| Monitoring | Sentry |
| i18n | next-intl |
| Deployment | Vercel |

## Quick Start

### Prerequisites

- Node.js 18+
- A Solana wallet (Phantom recommended)
- Optional: Helius API key for XP/credential queries

### Installation

```bash
git clone https://github.com/solanabr/superteam-academy
cd superteam-academy/app
npm install
cp .env.example .env.local
# Fill in your environment variables
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

```env
# Solana (required)
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf

# Optional (enhances features)
NEXT_PUBLIC_HELIUS_RPC_URL=https://devnet.helius-rpc.com/?api-key=...
NEXT_PUBLIC_HELIUS_API_KEY=...
NEXT_PUBLIC_XP_MINT_ADDRESS=...

# CMS
NEXT_PUBLIC_SANITY_PROJECT_ID=...
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=...

# Auth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-...
SENTRY_DSN=...
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Landing page
│   ├── courses/            # Course catalog + detail + lessons
│   ├── dashboard/          # User dashboard
│   ├── profile/            # User profile
│   ├── leaderboard/        # XP leaderboard
│   ├── settings/           # User settings
│   └── certificates/       # Credential view
├── components/
│   ├── ui/                 # Reusable UI primitives (Button, Card, etc.)
│   ├── layout/             # Navbar, Footer, PageLayout
│   ├── landing/            # Hero, Features, Testimonials, CTA
│   ├── courses/            # Course cards, filters
│   ├── editor/             # Monaco code editor + challenge runner
│   ├── gamification/       # XP display, streak calendar, badges
│   ├── wallet/             # Wallet connection UI
│   └── analytics/          # GA4 script
├── lib/
│   ├── services/           # LearningProgressService (stubbed → on-chain)
│   ├── solana/             # PDA derivation, XP queries, credential fetch
│   ├── sanity/             # Sanity client + GROQ queries
│   ├── utils/              # XP math, bitmap helpers, cn()
│   └── analytics.ts        # GA4 event tracking
├── types/                  # All TypeScript interfaces
├── messages/               # i18n strings (en, pt-BR, es)
└── i18n/                   # next-intl configuration
```

## On-Chain Integration

### Wallet-signed instructions (implemented)
- `enroll` — Learner signs enrollment transaction
- `close_enrollment` — Learner reclaims rent after completion

### Backend-signed instructions (stubbed → clean interface)
- `complete_lesson` — Backend marks lesson done, mints XP
- `finalize_course` — Backend finalizes, mints completion XP
- `issue_credential` — Backend mints soulbound NFT

### Reading on-chain data (implemented with Helius)
- XP balance via Token-2022 ATA
- Credentials via Helius DAS `getAssetsByOwner`
- Leaderboard via XP token holder indexing

### Service interface

```typescript
// src/lib/services/learning-progress.ts
// Swap local storage for on-chain calls here:
await learningProgressService.getXpBalance(walletAddress);
await learningProgressService.getCredentials(walletAddress);
await learningProgressService.getLeaderboard("weekly");
await learningProgressService.completeLesson(userId, courseId, lessonIndex);
```

## Scripts

```bash
npm run dev      # Development server with Turbopack
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint
npm run tsc      # TypeScript check
```

## Deployment

### Vercel (recommended)

1. Connect your GitHub repo to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy — preview deployments are automatic on PRs

```bash
npm i -g vercel
vercel --prod
```

### Manual

```bash
npm run build
npm run start
```
