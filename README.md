<div align="center">

```
███████╗██╗   ██╗██████╗ ███████╗██████╗ ████████╗███████╗ █████╗ ███╗   ███╗
██╔════╝██║   ██║██╔══██╗██╔════╝██╔══██╗╚══██╔══╝██╔════╝██╔══██╗████╗ ████║
███████╗██║   ██║██████╔╝█████╗  ██████╔╝   ██║   █████╗  ███████║██╔████╔██║
╚════██║██║   ██║██╔═══╝ ██╔══╝  ██╔══██╗   ██║   ██╔══╝  ██╔══██║██║╚██╔╝██║
███████║╚██████╔╝██║     ███████╗██║  ██║   ██║   ███████╗██║  ██║██║ ╚═╝ ██║
╚══════╝ ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝
                     █████╗  ██████╗ █████╗ ██████╗ ███████╗███╗   ███╗██╗   ██╗
                    ██╔══██╗██╔════╝██╔══██╗██╔══██╗██╔════╝████╗ ████║╚██╗ ██╔╝
                    ███████║██║     ███████║██║  ██║█████╗  ██╔████╔██║ ╚████╔╝
                    ██╔══██║██║     ██╔══██║██║  ██║██╔══╝  ██║╚██╔╝██║  ╚██╔╝
                    ██║  ██║╚██████╗██║  ██║██████╔╝███████╗██║ ╚═╝ ██║   ██║
                    ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚═════╝ ╚══════╝╚═╝     ╚═╝   ╚═╝
```

### Learn Solana. Build On-Chain. Earn Credentials.

**Production-ready Learning Management System dApp for Solana developer education.**
Interactive courses, soulbound XP tokens, on-chain credential NFTs, and an integrated code editor.

[![Live Demo](https://img.shields.io/badge/Live_Demo-superteam--academy.rectorspace.com-9333EA?style=for-the-badge&logo=vercel)](https://superteam-academy.rectorspace.com)

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict_|_Zero_Any-3178C6.svg?logo=typescript&logoColor=white)](tsconfig.json)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg?logo=next.js)](https://nextjs.org)
[![Solana](https://img.shields.io/badge/Solana-Devnet-14F195.svg?logo=solana)](https://explorer.solana.com/address/ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf?cluster=devnet)
[![Tests](https://img.shields.io/badge/Tests-356_Unit_|_36_E2E-brightgreen.svg)]()
[![i18n](https://img.shields.io/badge/i18n-EN_|_PT--BR_|_ES-orange.svg)]()

</div>

---

![Landing Page](assets/screenshots/landing-hero.png)

---

## Demo Video

https://github.com/user-attachments/assets/ceeb4f76-4bd3-4ab0-9250-45cf91829f8a

> 3-minute walkthrough covering course enrollment, lesson completion, code editor, leaderboard, dashboard, and settings.

---

## Table of Contents

- [Demo Video](#demo-video)
- [Screenshots](#-screenshots)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Architecture](#-architecture)
- [On-Chain Program](#-on-chain-program)
- [Gamification](#-gamification)
- [Testing](#-testing)
- [Documentation](#-documentation)
- [License](#-license)

---

## Screenshots

<table>
<tr>
<td width="50%">

**Course Catalog** — Filter by track, difficulty, and search

![Course Catalog](assets/screenshots/course-catalog.png)

</td>
<td width="50%">

**Lesson View** — Split-pane with Monaco code editor

![Lesson View](assets/screenshots/lesson-view.png)

</td>
</tr>
<tr>
<td width="50%">

**Dashboard** — XP stats, activity heatmap, achievements

![Dashboard](assets/screenshots/dashboard.png)

</td>
<td width="50%">

**Leaderboard** — Real on-chain XP rankings via Helius DAS

![Leaderboard](assets/screenshots/leaderboard.png)

</td>
</tr>
<tr>
<td width="50%">

**Daily Challenges** — Timed coding challenges with speed leaderboard

![Challenges](assets/screenshots/challenges.png)

</td>
<td width="50%">

**Community Forum** — Threads, voting, and discussion

![Community](assets/screenshots/community.png)

</td>
</tr>
<tr>
<td width="50%">

**Course Detail** — Curriculum, reviews, enrollment CTA

![Course Detail](assets/screenshots/course-detail.png)

</td>
<td width="50%">

**Settings** — Theme, language, privacy, data export

![Settings](assets/screenshots/settings.png)

</td>
</tr>
</table>

---

## Features

### 10 Core Pages

| Page | Route | Highlights |
|------|-------|------------|
| **Landing** | `/` | Hero with code animation, social proof, featured courses, stats |
| **Course Catalog** | `/courses` | Filterable grid, full-text search, track & difficulty filters |
| **Course Detail** | `/courses/[slug]` | Module/lesson curriculum, reviews, progress bar, enrollment CTA |
| **Lesson View** | `/courses/[slug]/lessons/[id]` | Split layout, Monaco editor, prev/next nav, completion tracking |
| **Code Challenge** | Integrated in lessons | Test cases, run button, pass/fail feedback, XP rewards |
| **Dashboard** | `/dashboard` | XP balance, streak calendar, achievements, activity heatmap |
| **Profile** | `/profile/[wallet]` | Skill radar chart, badge showcase, credential gallery |
| **Leaderboard** | `/leaderboard` | Global rankings, time filters, course filters, podium display |
| **Settings** | `/settings` | Profile editing, appearance, notifications, privacy, data export |
| **Credentials** | `/credentials/[id]` | Visual certificate, on-chain verification, social sharing |

### Bonus Features

- **Admin Dashboard** — Course management, user analytics, achievement configuration
- **Daily Coding Challenges** — Timed challenges with speed leaderboard
- **Community Forum** — Discussion threads with voting and Q&A
- **Onboarding Quiz** — Skill assessment to personalize learning path
- **PWA Support** — Installable, offline-capable with service worker
- **Course Creator Dashboard** — Content creation tools for instructors
- **Google + GitHub OAuth** — Conditional providers (graceful when unconfigured)
- **AI Code Hints** — Claude-powered contextual hints in the Monaco editor (3 per challenge)
- **Server-Side Quiz Validation** — Secure answer checking with `server-only` guard
- **On-Chain Achievement Claiming** — Claim achievements as soulbound NFTs via wallet signing
- **Arweave Content Storage** — Permanent course content with verifiable on-chain links
- **JSON-LD Structured Data** — Schema.org EducationalOrganization + Course for SEO
- **17 API Routes** — Search, courses, reviews, notifications, stats, profile, AI hints, quiz validation
- **CSP Security Headers** — Content-Security-Policy, X-Frame-Options, HSTS, and more
- **5-Job CI/CD Pipeline** — Parallel TypeScript, ESLint, Vitest, Build, and E2E jobs
- **E2E Test Suite** — 36 Playwright specs across 8 test files

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 15 (App Router), React 19, TypeScript (strict, zero `any`) |
| **Styling** | Tailwind CSS v4 with OKLch design tokens, shadcn/ui |
| **CMS** | Sanity v3 (with mock-client fallback for zero-config dev) |
| **Code Editor** | Monaco Editor — Rust, TypeScript, JavaScript, Python, Solidity, JSON |
| **Wallet** | Solana Wallet Adapter (multi-wallet, Wallet Standard) |
| **Auth** | NextAuth v5 beta (Google + GitHub, conditional registration) |
| **i18n** | next-intl — English, Portuguese (PT-BR), Spanish (ES) |
| **On-Chain** | Anchor 0.31+, Token-2022 (soulbound XP), Metaplex Core (credential NFTs) |
| **RPC/Indexing** | Helius DAS API (credential queries, XP leaderboard) |
| **Analytics** | GA4 + Microsoft Clarity (heatmaps) + Sentry (error monitoring) + Vercel Analytics |
| **AI** | Anthropic Claude (contextual code hints in editor) |
| **Storage** | Arweave (permanent course content via Irys) |
| **Testing** | Vitest (356 unit tests) + Playwright (36 E2E specs) |
| **Deployment** | Vercel with preview builds |
| **PWA** | Service worker (multi-strategy caching) + Web App Manifest |

---

## Getting Started

### Prerequisites

- **Node.js** 20+
- **pnpm** 9+
- **Solana CLI** (for devnet interaction)
- **Anchor** 0.31+ (for on-chain program)

### Frontend (works with zero config)

```bash
git clone https://github.com/solanabr/superteam-academy.git
cd superteam-academy/app
cp .env.example .env.local
pnpm install
pnpm dev
```

> The app runs fully functional out of the box — no Sanity, Supabase, or OAuth credentials needed. The mock-client provides seed data, and unconfigured services gracefully fall back.

### On-Chain Program

```bash
cd onchain-academy
yarn install
anchor build
anchor test    # 77 Rust + 62 TypeScript tests
```

### Environment Variables

<details>
<summary><strong>Required</strong></summary>

```env
NEXT_PUBLIC_PROGRAM_ID=ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf
NEXT_PUBLIC_XP_MINT=xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3
NEXT_PUBLIC_CLUSTER=devnet
NEXTAUTH_SECRET=<random-secret>
NEXTAUTH_URL=http://localhost:3000
```

</details>

<details>
<summary><strong>Optional (features activate when set)</strong></summary>

```env
# RPC — enables real on-chain data (leaderboard, credentials, XP)
NEXT_PUBLIC_HELIUS_RPC_URL=https://devnet.helius-rpc.com/?api-key=<key>
HELIUS_RPC_URL=https://devnet.helius-rpc.com/?api-key=<key>

# CMS — switches from mock data to live Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=<project-id>
NEXT_PUBLIC_SANITY_DATASET=production

# OAuth — shows sign-in buttons when configured
GOOGLE_CLIENT_ID=<id>
GOOGLE_CLIENT_SECRET=<secret>
GITHUB_CLIENT_ID=<id>
GITHUB_CLIENT_SECRET=<secret>

# Forum — enables live community threads
NEXT_PUBLIC_SUPABASE_URL=<url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<key>

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXX
NEXT_PUBLIC_CLARITY_PROJECT_ID=<id>
SENTRY_DSN=<dsn>

# Backend signer (for lesson completion, credential issuance)
BACKEND_SIGNER_KEYPAIR=<path-to-keypair>
```

</details>

---

## Architecture

```
superteam-academy/
├── onchain-academy/                ← Anchor program (deployed on devnet)
│   ├── programs/                   ← Rust source (16 instructions, 6 PDAs)
│   ├── tests/                      ← 77 Rust + 62 TypeScript tests
│   └── scripts/                    ← Devnet interaction scripts
├── app/                            ← Next.js 15 frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── [locale]/(marketing)/   ← Landing page
│   │   │   ├── [locale]/(platform)/    ← Dashboard, courses, leaderboard, etc.
│   │   │   ├── [locale]/(admin)/       ← Admin panel
│   │   │   └── api/                    ← 17 API routes (search, AI, quiz, etc.)
│   │   ├── components/                 ← 139 React components (shadcn/ui based)
│   │   ├── lib/
│   │   │   ├── sanity/                 ← CMS client + mock-client + seed data
│   │   │   ├── solana/                 ← On-chain: accounts, PDAs, XP, credentials
│   │   │   ├── stores/                 ← Zustand: course-store, user-store
│   │   │   ├── hooks/                  ← 9 React hooks (enrollment, XP, streak, etc.)
│   │   │   └── services/              ← Service interfaces (learning progress)
│   │   ├── i18n/                       ← next-intl routing config
│   │   └── messages/                   ← en.json, pt.json, es.json (358 keys each)
│   ├── e2e/                            ← Playwright E2E specs
│   └── public/                         ← Static assets, PWA manifest, service worker
├── docs/                               ← Program & architecture documentation
│   ├── SPEC.md                         ← 16 instructions, 26 errors, 15 events
│   ├── ARCHITECTURE.md                 ← Account maps, data flows, CU budgets
│   ├── INTEGRATION.md                  ← Frontend integration guide
│   └── DEPLOY-PROGRAM.md              ← Deploy your own devnet instance
└── scripts/                            ← Utility scripts
```

### Data Flow

```
Courses:   Sanity (or mock-client) → course-store (Zustand) → components
XP:        wallet connect → user-store → connection.getTokenAccountBalance()
Credentials: wallet → user-store → Helius DAS getAssetsByOwner()
Leaderboard: /api/leaderboard → Helius DAS getTokenAccounts → 60s cache
Enrollment:  use-enrollment hook → buildEnrollInstruction() → wallet signing
Auth:        NextAuth → conditional Google/GitHub → /api/auth/providers-status
AI Hints:    Monaco editor → /api/ai/hint → Claude Haiku → contextual guidance
Quiz:        Lesson quiz → /api/quiz/validate → server-only answer keys → XP award
Arweave:     Course content → Irys upload → arweave.net/{txId} → permanent storage
```

---

## On-Chain Program

The Anchor program is deployed on Solana devnet with 16 instructions covering the full learning lifecycle.

| | Address |
|---|---|
| **Program** | [`ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf`](https://explorer.solana.com/address/ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf?cluster=devnet) |
| **XP Mint** | [`xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3`](https://explorer.solana.com/address/xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3?cluster=devnet) |
| **Authority** | [`ACAd3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn`](https://explorer.solana.com/address/ACAd3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn?cluster=devnet) |

### Key Design Decisions

- **XP Tokens**: Token-2022 with `NonTransferable` + `PermanentDelegate` extensions — soulbound, can only be minted by the program
- **Credentials**: Metaplex Core NFTs with `PermanentFreezeDelegate` — verifiable, non-transferable course completion proof
- **PDAs**: `[b"course", courseId]`, `[b"enrollment", course, learner]` — deterministic, composable
- **Lesson Tracking**: 256-bit bitmap (`[u64; 4]`) per enrollment — gas-efficient, supports up to 256 lessons per course

---

## Gamification

### XP & Leveling

| Event | XP Reward |
|-------|-----------|
| Lesson completion | 10 – 50 XP |
| Challenge completion | 25 – 100 XP |
| Course completion | 500 – 2,000 XP |
| Daily streak bonus | 10 XP |
| First completion of day | 25 XP |

**Level formula:** `Level = floor(sqrt(totalXP / 100))`

11 named tiers: Newcomer → Beginner → Apprentice → Student → Developer → Engineer → Architect → Expert → Master → Grandmaster → Legend

### Streaks & Achievements

- **Streak tracking** with calendar heatmap visualization
- **Streak freeze** mechanism (skip days without breaking streak)
- **Milestone rewards** at 7, 30, and 100 days
- **18 achievement types** across 5 categories: Progress, Streaks, Skills, Community, Special
- **On-chain achievements**: Soulbound Metaplex Core NFTs minted per achievement

---

## Testing

| Layer | Coverage | Tests |
|-------|----------|-------|
| **Solana/Business Logic** | 95–100% | 165 tests (PDAs, XP, bitmap, credentials, achievements) |
| **Zustand Stores** | 100% | 75 tests (course-store, user-store) |
| **React Hooks** | 100% | 35 tests (all 9 hooks) |
| **Services & Utils** | 85% | 42 tests (learning progress, recommendations, forum) |
| **API Routes** | Partial | 13 tests (leaderboard, quiz validation) |
| **E2E (Playwright)** | 8 specs | 36 tests (navigation, courses, i18n, responsive, a11y) |
| **On-Chain (Anchor)** | Full | 77 Rust + 62 TypeScript tests |

```bash
# Frontend tests
cd app
pnpm test:run          # Run all 356 unit tests
pnpm test              # Watch mode

# E2E tests
pnpm exec playwright test

# On-chain tests
cd onchain-academy
anchor test            # 139 tests
```

---

## Documentation

| Document | Description |
|----------|-------------|
| **[Program Specification](docs/SPEC.md)** | 16 instructions, 6 PDA types, 26 errors, 15 events |
| **[Architecture](docs/ARCHITECTURE.md)** | Account maps, data flows, CU budgets |
| **[Frontend Integration](docs/INTEGRATION.md)** | PDA derivation, instruction building, events, error handling |
| **[Deployment Guide](docs/DEPLOY-PROGRAM.md)** | Deploy your own program instance on devnet |
| **[Frontend Architecture](app/ARCHITECTURE.md)** | Component architecture, service interfaces, data flow |
| **[CMS Guide](app/CMS_GUIDE.md)** | Course creation, content schema, publishing workflow |
| **[Customization](app/CUSTOMIZATION.md)** | Theme tokens, language additions, gamification extensions |

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Lighthouse Performance | 90+ |
| Lighthouse Accessibility | 95+ |
| Lighthouse Best Practices | 95+ |
| Lighthouse SEO | 90+ |
| LCP | < 2.5s |
| FID | < 100ms |
| CLS | < 0.1 |

Optimizations: image optimization, code splitting, lazy-loaded Monaco editor, static generation for marketing pages, service worker caching.

---

## License

[MIT](LICENSE) — Open source. Built for the Solana developer community.

<div align="center">

---

**Built for [Superteam Brazil](https://superteam.fun) — Empowering Solana developer education across LATAM.**

</div>
