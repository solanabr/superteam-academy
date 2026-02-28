# Superteam Academy

A decentralized learning management system (LMS) for Solana developers, built by [Superteam Brazil](https://twitter.com/SuperteamBR). Interactive courses, on-chain credentials, gamified progression, and a multilingual interface -- all open source and forkable.

## Overview

Superteam Academy is a Next.js frontend that connects to a Solana Anchor program on devnet. Learners browse courses, complete lessons with an in-browser code editor, earn soulbound XP tokens (Token-2022), and receive upgradeable ZK compressed credentials per learning track. The app works fully offline with localStorage and progressively upgrades to on-chain state when a wallet is connected.

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 16 (App Router) | SSR, routing, API routes |
| Language | TypeScript (strict mode) | Type safety |
| UI Library | React 19 | Component rendering |
| Styling | Tailwind CSS v4 (`@theme inline`) | Utility-first CSS with design tokens |
| Database | PostgreSQL + Prisma 7 | Persistent data, migrations, seed scripts |
| Components | Radix UI Primitives | Accessible, unstyled building blocks |
| Icons | Lucide React | Consistent iconography |
| Blockchain | Solana Wallet Adapter | Wallet connection (Phantom, Solflare) |
| Web3 | @solana/web3.js, @coral-xyz/anchor | Devnet RPC, transaction building |
| Tokens | Token-2022 (NonTransferable + PermanentDelegate) | Soulbound XP tokens |
| Credentials | Metaplex Core + Helius DAS API | On-chain credential reads |
| CMS | Sanity (headless) | Course content management |
| i18n | next-intl | PT-BR, ES, EN translations |
| Theming | next-themes | Dark/light mode toggle |
| Code Editor | Monaco Editor (@monaco-editor/react) | In-browser Rust/TypeScript editing |
| Charts | Recharts | XP/progress data visualization |
| Layout | react-resizable-panels | Split-pane lesson/editor view |
| Testing | Vitest + Playwright | Unit tests + E2E tests |
| CI/CD | GitHub Actions | Lint, test, build on push/PR |
| Analytics | GA4 + PostHog + Clarity + Sentry | Usage tracking, heatmaps, error monitoring |

## Features

- **Interactive Code Editor** -- Monaco-powered split-pane editor with Rust, TypeScript, and JSON support
- **On-Chain Credentials** -- Soulbound Token-2022 XP tokens and Metaplex Core credentials readable via Helius DAS API
- **Gamified Progression** -- XP system, daily streaks with freeze mechanics, 20 achievements across 5 categories, combo multipliers, daily quests, and a live leaderboard
- **Multilingual** -- Full i18n with Portuguese (BR), Spanish, and English via cookie-based locale switching
- **Dark / Light Mode** -- Superteam Brazil official color palette with full theme support via `next-themes`
- **Wallet Authentication** -- Solana Wallet Adapter with Phantom and Solflare support on devnet
- **CMS-Driven Content** -- Sanity CMS with structured schemas; falls back to database seed data when not configured
- **PostgreSQL Backend** -- Full Prisma 7 data layer for courses, enrollments, progress, XP events, and achievements
- **On-Chain Integration** -- On-chain reads (XP, enrollment, credentials) with database writes for reliable persistence
- **Responsive Design** -- Mobile-first layout with glassmorphic cards, gold-gradient hover effects, and accessible Radix UI primitives

## Quick Start

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | >= 18 |
| pnpm | >= 9 |
| Git | any |
| Solana CLI | >= 1.18 (optional, for on-chain features) |

### Installation

```bash
git clone https://github.com/superteam-brazil/superteam-academy.git
cd superteam-academy/app

pnpm install
```

### Environment Variables

Copy the example and fill in values:

```bash
cp .env.example .env.local
```

Required for development:

```env
# Database (PostgreSQL -- required)
DATABASE_URL=postgresql://user:password@localhost:5432/superteam_academy?schema=public

# Authentication (required)
AUTH_SECRET=generate-a-random-secret-here
```

Optional variables for extended features:

```env
# Solana (enables on-chain reads when wallet connected)
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=devnet

# Helius (enables credentials and leaderboard from chain)
NEXT_PUBLIC_HELIUS_API_KEY=your-helius-key

# Sanity CMS (uses database seed data when not set)
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_CLARITY_PROJECT_ID=
NEXT_PUBLIC_SENTRY_DSN=
```

See [CUSTOMIZATION.md](CUSTOMIZATION.md#environment-variables-reference) for the full variable reference.

### Database Setup

```bash
# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate deploy

# Seed with 6 courses, 20 achievements, and educational content
pnpm db:seed
```

### Run the Dev Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The app uses Turbopack for fast refresh.

## Project Structure

```
app/
├── prisma/
│   ├── schema.prisma                Database schema (23 models)
│   ├── migrations/                  PostgreSQL migrations
│   ├── seed.ts                      Database seed script
│   └── seed-data/                   Course content (6 courses, achievements)
├── public/                          Static assets
├── src/
│   ├── app/                         Next.js App Router pages
│   │   ├── layout.tsx               Root layout (providers, header, footer)
│   │   ├── page.tsx                 Landing page (/)
│   │   ├── globals.css              Design tokens + Tailwind v4 theme
│   │   ├── courses/                 Course catalog + detail + lesson pages
│   │   ├── dashboard/               Gamification dashboard
│   │   ├── leaderboard/             XP leaderboard
│   │   ├── profile/                 User profile + public profiles
│   │   ├── settings/                User settings
│   │   └── certificates/            On-chain credential viewer
│   ├── components/
│   │   ├── auth/                    Wallet auth components
│   │   ├── gamification/            XP bar, streak, achievements, combos,
│   │   │                            daily quests, celebration modal
│   │   ├── layout/                  Header, Footer, ThemeProvider, WalletProvider
│   │   └── ui/                      Radix-based design system (17 components)
│   ├── i18n/                        Locale config, server-side resolution, actions
│   ├── lib/
│   │   ├── constants.ts             XP limits, track registry, learning paths
│   │   ├── utils.ts                 cn(), XP math, address truncation
│   │   ├── mock-data.ts             Fallback course data (used when Sanity is not configured)
│   │   ├── data-service.ts          Sanity-or-mock data fetcher
│   │   ├── analytics.ts             GA4 + PostHog + Clarity event tracking
│   │   ├── hooks/                   useLearningProgress, useGamification
│   │   ├── onchain/                 Program ID, PDA derivation, bitmap utils,
│   │   │                            credential queries, transaction builders
│   │   ├── sanity/                  Client, GROQ queries, 5 CMS schemas
│   │   └── services/               LearningProgressService interface +
│   │                                3 implementations (Local, OnChain, Hybrid)
│   ├── messages/                    Translation files (en, pt-BR, es)
│   └── types/                       Domain types + env declarations
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── eslint.config.mjs
└── package.json
```

## On-Chain Integration

The frontend connects to an Anchor program deployed on Solana devnet.

| Property | Value |
|----------|-------|
| Program ID | `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf` |
| Network | Solana devnet |
| XP Token | Token-2022 with NonTransferable + PermanentDelegate extensions |

### How It Works

The app uses a **PrismaProgressService** for persistent storage with optional on-chain reads:

- **Course Data**: Courses, modules, lessons, and challenges are stored in PostgreSQL and served via Prisma queries. Seed scripts populate 6 complete courses with full educational content.
- **Progress Tracking**: Enrollments, lesson completions, and XP events are stored in the database via API routes.
- **XP Balance**: When a wallet is connected, reads the learner's Token-2022 ATA balance for the current season's XP mint.
- **Credentials**: Queries Helius DAS API (`getAssetsByOwner`) for Metaplex Core assets with academy-specific attributes (`track_id`, `level`, `courses_completed`).
- **Leaderboard**: Aggregates XP events from the database with time-based filtering (weekly, monthly, all-time).
- **Enrollment Transactions**: When a wallet is connected, the frontend builds and signs real `enroll` transactions on devnet.

The app works without a wallet connection, using the database for all progress tracking.

### PDA Derivation

The frontend derives PDAs matching the on-chain program:

| PDA | Seeds |
|-----|-------|
| Config | `["config"]` |
| Course | `["course", courseId]` |
| Enrollment | `["enrollment", courseId, learnerPubkey]` |

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full data flow documentation.

## Testing

Unit tests use [Vitest](https://vitest.dev/) and live in `src/__tests__/`.

```bash
pnpm test           # run all tests
pnpm test:watch     # watch mode
```

Test coverage:

- **Utils** -- XP math, level calculations, address truncation, `cn()` helper
- **Learning Progress** -- Enrollment, lesson completion, streaks, achievements, leaderboard
- **Gamification Components** -- Level-up detection, calendar building, XP formatting
- **Data Service** -- Sanity/mock fallback behavior
- **Analytics** -- Event tracking
- **Account Linking** -- Social account connections
- **i18n Completeness** -- Verifies all locale files have the same translation keys

E2E tests use [Playwright](https://playwright.dev/) and live in `e2e/`.

```bash
pnpm e2e            # run E2E tests
pnpm e2e:ui         # run with Playwright UI
```

## Performance

### Lighthouse Scores

Measured via Lighthouse CLI 13 (headless Chrome, mobile preset) on a local production build:

| Category | Score |
|----------|-------|
| **Performance** | 84 |
| **Accessibility** | 100 |
| **Best Practices** | 96 |
| **SEO** | 100 |

### Core Web Vitals

| Metric | Value | Score |
|--------|-------|-------|
| First Contentful Paint (FCP) | 0.9 s | 100 |
| Speed Index (SI) | 0.9 s | 100 |
| Cumulative Layout Shift (CLS) | 0.00 | 100 |
| Total Blocking Time (TBT) | 10–20 ms | 100 |
| Largest Contentful Paint (LCP) | 4.5 s | ~35 |
| Time to Interactive (TTI) | 4.5 s | ~80 |

> **Note:** LCP and TTI are dominated by JS hydration time on localhost. On production (Vercel CDN + edge caching), expect **90+ Performance** as JS chunks are served from the nearest PoP and static pages are cached at the edge.

### Optimizations Applied

- **Server Components with ISR** — Landing page and course catalog are async server components with `revalidate = 3600` (1-hour cache)
- **Static Generation** — Course detail and certificate pages use `generateStaticParams` for build-time pre-rendering
- **Dynamic Imports** — Heavy libraries (wallet adapter UI, Monaco editor, Recharts, html-to-image) are lazy-loaded with `next/dynamic` and `ssr: false`
- **Image Optimization** — All images use `next/image` with AVIF/WebP format support, proper `sizes` attributes, and `priority` for above-the-fold content
- **Font Optimization** — Inter and JetBrains Mono loaded via `next/font/google` with `display: "swap"`; eliminated render-blocking third-party font request (DM Sans) from wallet adapter CSS
- **CSS-only Page Transitions** — Replaced JS-based (Framer Motion) page transitions with pure CSS `@keyframes` to eliminate CLS and reduce client JS
- **Optimized Auth** — SessionProvider configured with `refetchOnWindowFocus={false}` and `refetchInterval={0}` to minimize unnecessary API calls
- **Bundle Size** — Tree-shaking via ES modules, webpack externals for unused Node.js packages
- **WCAG AA Accessibility** — Skip-to-content link, 4.5:1+ color contrast ratios, ARIA labels on all icon-only buttons, `prefers-reduced-motion` support

## Building

```bash
pnpm build          # generates .next/ production build
pnpm start          # starts production server on port 3000
pnpm lint           # run ESLint
```

## Deployment

### Vercel (Recommended)

1. Push your repository to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Set the **Root Directory** to `app`
4. Add environment variables in the Vercel dashboard:
   - `NEXT_PUBLIC_RPC_URL`
   - `NEXT_PUBLIC_HELIUS_RPC_URL` (for credentials and leaderboard)
   - `NEXT_PUBLIC_SANITY_PROJECT_ID` + `NEXT_PUBLIC_SANITY_DATASET`
   - `AUTH_SECRET` (generate a secure random string)
   - Optional: `NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_POSTHOG_KEY`
5. Deploy -- Vercel auto-detects Next.js and configures the build

### Other Platforms

The app is a standard Next.js 16 application. It can be deployed to any platform that supports Node.js 18+:

```bash
pnpm build
pnpm start
```

For Docker deployments, set `output: "standalone"` in `next.config.ts` to generate a minimal production image.

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server with Turbopack |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run unit tests (Vitest) |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm e2e` | Run E2E tests (Playwright) |
| `pnpm e2e:ui` | Run E2E tests with Playwright UI |
| `pnpm db:seed` | Seed database with courses and achievements |
| `pnpm db:reset` | Reset database (drop + migrate + seed) |
| `pnpm db:studio` | Open Prisma Studio for database browsing |

## Internationalization

| Code | Language |
|------|----------|
| `en` | English |
| `pt-BR` | Portuguese (Brazil) |
| `es` | Spanish |

Locale is stored in a `locale` cookie (1-year TTL) and resolved server-side via `next-intl/server`. No URL prefix is used. To add a new language, see [CUSTOMIZATION.md](CUSTOMIZATION.md#adding-new-languages).

## Related Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) -- System architecture, data flows, service layer, on-chain integration details
- [CMS_GUIDE.md](CMS_GUIDE.md) -- Sanity CMS setup, schemas, content creation workflow, GROQ queries
- [CUSTOMIZATION.md](CUSTOMIZATION.md) -- Design tokens, theming, adding languages, extending gamification, environment variables

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make changes following the existing code style
4. Ensure `pnpm lint` and `pnpm test` pass
5. Submit a pull request

Commit messages follow conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`.

## License

[MIT](../LICENSE) -- Copyright (c) 2026 Superteam Brazil
