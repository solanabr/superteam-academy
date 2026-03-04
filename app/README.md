# Superteam Academy

![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)
![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue)
![i18n](https://img.shields.io/badge/i18n-PT--BR%20%7C%20ES%20%7C%20EN-orange)

A gamified, decentralized learning platform built on Solana. Learners enroll in courses, complete lessons to earn soulbound XP tokens (Token-2022), receive Metaplex Core credential NFTs upon course completion, and compete on a global leaderboard. All progress is recorded on-chain — permissionless and verifiable.

---

## Live Demo

> **Live Demo:** [https://superteam-academy.vercel.app](https://superteam-academy.vercel.app) *(deploy in progress)*
>
> **On-chain Program (Devnet):** [ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf](https://explorer.solana.com/address/ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf?cluster=devnet)

---

## Screenshots

| Dashboard | Course Detail | Code Challenge |
|:-:|:-:|:-:|
| ![Dashboard](./docs/screenshots/dashboard.png) | ![Course Detail](./docs/screenshots/course-detail.png) | ![Code Challenge](./docs/screenshots/code-challenge.png) |

| Leaderboard | Profile | Landing Page |
|:-:|:-:|:-:|
| ![Leaderboard](./docs/screenshots/leaderboard.png) | ![Profile](./docs/screenshots/profile.png) | ![Landing](./docs/screenshots/landing.png) |

---

## Key Features

- **Structured Courses** — Multi-lesson courses organized by track and difficulty, authored in Sanity CMS with support for pt-BR, English, and Spanish
- **On-Chain XP Tokens** — Soulbound Token-2022 tokens minted per completed lesson; non-transferable, permanently delegated to program authority
- **Credential NFTs** — Metaplex Core NFTs issued on course completion, visible in any Solana wallet (DAS-compatible)
- **Global Leaderboard** — XP ranking powered by Helius DAS API with ISR caching
- **Achievements** — On-chain achievement receipts for milestones (first lesson, streaks, course completion, speed runs, etc.)
- **Daily Streaks** — Streak tracking with freeze tokens and milestone rewards (7/30/100 days)
- **Code Challenges** — In-browser TypeScript and Rust challenges with Monaco editor
- **Multi-language** — Interface and content in Portuguese (pt-BR), English, and Spanish via next-intl
- **Dark Mode** — System-aware theme with explicit override via next-themes
- **Social Auth** — Google and GitHub OAuth via NextAuth v5; wallet connection is separate and additive

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js App Router | 16.1.6 |
| Language | TypeScript (strict) | 5 |
| Styling | Tailwind CSS | v4 |
| Component library | shadcn/ui (Radix UI) | latest |
| On-chain program | Anchor + Rust | 0.32 |
| XP tokens | Token-2022 | NonTransferable + PermanentDelegate |
| Credential NFTs | Metaplex Core | soulbound |
| CMS | Sanity | v5 |
| Authentication | NextAuth | v5 (beta) |
| i18n | next-intl | v4 |
| State management | Zustand | v5 |
| RPC / DAS | Helius | — |
| Error monitoring | Sentry | @sentry/nextjs v10 |
| Analytics | GA4, PostHog, Microsoft Clarity | — |
| Code editor | @monaco-editor/react | v4 |
| Rich text rendering | @portabletext/react | v6 |
| Charts | recharts | v3 |
| Certificate export | html2canvas-pro | v2 |
| Layout panels | react-resizable-panels | v4 |
| Wallet sig verification | tweetnacl | v1 |

---

## Quick Start

### Prerequisites

- **Node.js 20+** (`node -v` to check)
- **npm** (bundled with Node)
- A Solana wallet (Phantom or Solflare) set to **Devnet**
- Sanity project credentials ([sanity.io/manage](https://sanity.io/manage))
- Helius API key ([helius.dev](https://helius.dev))

### 1. Clone and install

```bash
git clone https://github.com/praneethreddy1729/superteam-academy.git
cd superteam-academy/app
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in these required values:

```bash
# Solana
NEXT_PUBLIC_SOLANA_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_KEY
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_PROGRAM_ID=ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf
NEXT_PUBLIC_XP_MINT=xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3
BACKEND_SIGNER_KEYPAIR=[...64 bytes as JSON array...]
HELIUS_API_KEY=your-helius-api-key

# Auth
AUTH_SECRET=generate-with-openssl-rand-base64-32
AUTH_GOOGLE_ID=your-google-oauth-client-id
AUTH_GOOGLE_SECRET=your-google-oauth-client-secret
AUTH_GITHUB_ID=your-github-oauth-app-id
AUTH_GITHUB_SECRET=your-github-oauth-app-secret

# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=your-sanity-project-id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your-sanity-write-token
```

See the full [environment variable reference](#environment-variables) below.

### 3. Seed demo content (optional)

```bash
node scripts/seed-sanity.mjs
```

This populates your Sanity dataset with two demo courses in all three locales. The script is idempotent.

### 4. Start the development server

```bash
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000). The default locale is `pt-BR`, so the root URL redirects to `/pt-BR`. The Sanity Studio is available at [http://localhost:3000/studio](http://localhost:3000/studio).

### 5. Build for production

```bash
npm run build
npm run start
```

---

## Project Structure

```
app/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── [locale]/               # Locale-prefixed routes (pt-BR, en, es)
│   │   │   ├── layout.tsx          # Provider hierarchy (theme, wallet, i18n, auth)
│   │   │   ├── page.tsx            # Landing page (ISR, revalidate=3600)
│   │   │   ├── courses/            # Course catalog, detail, and lessons
│   │   │   ├── dashboard/          # Learner dashboard (XP, progress, activity)
│   │   │   ├── leaderboard/        # Global XP leaderboard
│   │   │   ├── profile/            # Wallet profile + credential NFTs
│   │   │   ├── certificates/       # Credential NFT viewer
│   │   │   ├── challenges/         # Standalone code challenges
│   │   │   └── settings/           # User settings
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/ # NextAuth v5 route handler
│   │   │   ├── progress/           # Lesson/course/achievement/credential APIs
│   │   │   └── helius/             # Server-side Helius DAS proxy routes
│   │   └── studio/                 # Sanity Studio at /studio
│   ├── components/
│   │   ├── ui/                     # shadcn/ui base components
│   │   ├── layout/                 # Header, Footer, Sidebar, LocaleSwitcher
│   │   ├── courses/                # CourseGrid, CourseCard, EnrollButton
│   │   ├── lessons/                # LessonView
│   │   ├── challenges/             # CodeChallenge (Monaco editor)
│   │   ├── gamification/           # XPToast, LevelUpModal, StreakBadge
│   │   ├── wallet/                 # LazyWalletProvider, WalletButton
│   │   └── shared/                 # ErrorBoundary, SkeletonCard, EmptyState
│   ├── hooks/                      # React hooks for on-chain data
│   ├── lib/
│   │   ├── solana/                 # PDAs, instructions, program client, Helius
│   │   ├── sanity/                 # Sanity client, GROQ queries, schemas
│   │   ├── services/               # BackendSignerService, LearningProgressService,
│   │   │                           # AchievementTriggerService
│   │   ├── auth/                   # NextAuth config (Google, GitHub)
│   │   ├── analytics/              # GA4, PostHog, Clarity, event tracking
│   │   ├── gamification/           # Achievement definitions + bitmap helpers
│   │   └── rate-limit.ts           # In-memory rate limiter for API routes
│   ├── stores/                     # Zustand stores (progress, activity, bookmarks)
│   └── i18n/                       # next-intl routing + message files
├── docs/                           # Documentation
│   ├── ARCHITECTURE.md             # System architecture, data flows, PDA map
│   ├── CMS_GUIDE.md                # Sanity content authoring guide
│   ├── CUSTOMIZATION.md            # Theming, i18n, gamification extension
│   └── DEPLOYMENT.md               # Vercel deployment guide
├── .env.example                    # Environment variable template
├── next.config.ts                  # Next.js + Sentry + next-intl config
├── sanity.config.ts                # Sanity Studio config
└── package.json
```

---

## On-Chain Integration

The Anchor program lives in `../onchain-academy/` and is deployed to Solana Devnet.

**Program ID:** `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf`

### On-chain accounts (PDAs)

| Account | Seeds | Purpose |
|---|---|---|
| Config | `["config"]` | Platform authority, XP mint, backend signer pubkey |
| Course | `["course", courseId]` | Course metadata, lesson count, XP rates |
| Enrollment | `["enrollment", courseId, learner]` | Per-learner progress bitmap, timestamps |
| MinterRole | `["minter", minter]` | Authorized XP minter |
| AchievementType | `["achievement", achievementId]` | Achievement definition + Metaplex Core collection |
| AchievementReceipt | `["achievement_receipt", achievementId, recipient]` | Per-user achievement grant |

### How XP works

- XP tokens are **Token-2022** with `NonTransferable` and `PermanentDelegate` extensions — they are soulbound to the learner's wallet.
- Tokens are minted by the backend signer when a learner completes a lesson or finalizes a course.
- The XP mint address is set in the `Config` PDA and must match `NEXT_PUBLIC_XP_MINT`.

### How credentials work

- Credential NFTs are **Metaplex Core** assets, soulbound via the `PermanentFreezeDelegate` plugin.
- Issued by `BackendSignerService.issueCredential()` after a course is finalized.
- Queryable via Helius DAS API (`getAssetsByOwner`), visible in any DAS-compatible wallet.

### Transaction signing model

| Action | Who signs |
|---|---|
| Enroll in course | **Learner wallet** (direct transaction) |
| Complete lesson | **Backend signer** (API route, learner signs a message for auth) |
| Finalize course | **Backend signer** (API route, learner signs a message for auth) |
| Issue credential | **Backend signer** (API route, learner signs a message for auth) |
| Award achievement | **Backend signer** (API route, learner signs a message for auth) |

The learner's wallet signature (via `signMessage`) proves ownership — it is verified server-side with tweetnacl before the backend signer submits the on-chain transaction.

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server (requires `build` first) |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:e2e` | Run end-to-end tests (Playwright) |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SOLANA_RPC_URL` | Yes | Helius RPC endpoint |
| `NEXT_PUBLIC_SOLANA_NETWORK` | Yes | `devnet` or `mainnet-beta` |
| `NEXT_PUBLIC_PROGRAM_ID` | Yes | Deployed on-chain program address |
| `NEXT_PUBLIC_XP_MINT` | Yes | Token-2022 XP mint address |
| `BACKEND_SIGNER_KEYPAIR` | Yes | JSON byte array — server-only |
| `HELIUS_API_KEY` | Yes | Helius API key for DAS queries |
| `AUTH_SECRET` | Yes | NextAuth secret (`openssl rand -base64 32`) |
| `AUTH_GOOGLE_ID` | Yes | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Yes | Google OAuth client secret |
| `AUTH_GITHUB_ID` | Yes | GitHub OAuth App client ID |
| `AUTH_GITHUB_SECRET` | Yes | GitHub OAuth App client secret |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Yes | Sanity project ID |
| `NEXT_PUBLIC_SANITY_DATASET` | Yes | Sanity dataset (usually `production`) |
| `SANITY_API_TOKEN` | Yes | Sanity write token — server-only |
| `NEXT_PUBLIC_APP_URL` | Yes | Full public URL |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | No | Google Analytics 4 |
| `NEXT_PUBLIC_POSTHOG_KEY` | No | PostHog project key |
| `NEXT_PUBLIC_POSTHOG_HOST` | No | PostHog ingestion host |
| `NEXT_PUBLIC_CLARITY_ID` | No | Microsoft Clarity |
| `SENTRY_DSN` | No | Sentry error monitoring |

---

## Documentation

| Document | Description |
|---|---|
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System architecture, data flows, PDA map, state management, caching, i18n |
| [docs/CMS_GUIDE.md](./docs/CMS_GUIDE.md) | Sanity Studio guide, schema reference, GROQ queries, content workflow |
| [docs/CUSTOMIZATION.md](./docs/CUSTOMIZATION.md) | Theming, new languages, achievements, gamification, env vars |
| [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Vercel deployment, OAuth setup, Sanity CORS configuration |

---

## Deployment

The app is designed for deployment on **Vercel**:

1. Push to GitHub.
2. Import the `app/` directory as the root of your Vercel project.
3. Add all environment variables from `.env.example` in the Vercel dashboard under **Settings → Environment Variables**.
4. Deploy. Vercel automatically runs `npm run build` on push.

For detailed instructions including OAuth redirect URI setup, Sanity CORS configuration, and the backend signer keypair format, see [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md).

---

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make your changes and ensure `npm run build` and `npm run lint` both pass.
4. Add translations for all 3 locales (`pt-BR`, `en`, `es`) for any new user-facing strings.
5. Submit a pull request against `main`.

Please follow the existing code style. Components should be Server Components by default; use `"use client"` only where interactivity requires it.

---

## Troubleshooting

**Wallet won't connect**
- Ensure your wallet is set to **Solana Devnet**.
- Try refreshing or disconnecting and reconnecting.

**Sanity Studio not loading**
- Verify `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET` are set.
- Add `http://localhost:3000` to Sanity CORS origins at [sanity.io/manage](https://sanity.io/manage).

**`Buffer is not defined` error**
- The webpack config in `next.config.ts` disables Node.js built-in resolution for `buffer`, `crypto`, `stream`.
- Clear `.next/` and rebuild: `rm -rf .next && npm run build`.

**XP balance showing 0**
- Ensure `HELIUS_API_KEY` is configured for Token-2022 queries.
- The learner must have completed at least one lesson via the backend signer.

**Leaderboard empty**
- Ensure `NEXT_PUBLIC_XP_MINT` matches your deployed program's mint.

**CORS errors from Sanity**
- Add your URL to the Sanity project's CORS origins.

---

## License

MIT
