# Superteam Academy

**A Solana-native learning management system with gamified progression, on-chain credentials, and verifiable skill tracking.**

Built by [Superteam Brazil](https://superteam.fun/) as a competition entry for [Superteam Earn](https://earn.superteam.fun/).

![Superteam Academy Screenshot](./docs/assets/screenshot.png)

---

## Features

- **Course Catalog** -- Filterable grid with search, difficulty badges, and learning track filters
- **Interactive Lessons** -- Reading content, embedded video, code challenges with Monaco Editor, and quizzes
- **Dashboard** -- XP and level progress, streak calendar with heatmap, achievements, personalized recommendations
- **Leaderboard** -- Global XP rankings with time-based and course-based filters, podium display
- **On-Chain Credentials** -- Bubblegum compressed NFT (cNFT) certificates issued on course completion, viewable in profile
- **Profile with Skill Constellation** -- Radar chart visualization, achievement showcase, credential gallery
- **Certificates** -- Visual certificate cards with on-chain verification, social sharing, and image download
- **Settings** -- Profile management, linked accounts (Google/GitHub/Wallet), theme toggle, language switcher, data export
- **Wallet Authentication** -- Multi-wallet support (Phantom, Backpack, Solflare) via Wallet Standard auto-detect
- **XP System** -- Soulbound Token-2022 tokens with level formula: `Level = floor(sqrt(totalXP / 100))`
- **Gamification** -- XP rewards per lesson (10-50), challenge (25-100), course (500-2,000); streak tracking with freeze system; 20 achievements across 5 categories
- **Internationalization** -- English, Portuguese (BR), and Spanish with full UI string externalization
- **Dark and Light Themes** -- Dark mode by default with Warm Stone palette, theme toggle via `next-themes`
- **Analytics** -- Google Analytics 4, PostHog product analytics, and Sentry error monitoring
- **CMS** -- Sanity with full content schemas, studio route at `/studio`, draft/publish workflow

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.1 (App Router, Turbopack) |
| UI Library | React 19 |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 + Solana Foundation design tokens |
| Components | Custom component library (shadcn/ui patterns) |
| Auth | NextAuth.js v5 (beta) + Solana Wallet Adapter |
| CMS | Sanity v5 |
| Database | Supabase |
| Code Editor | Monaco Editor (in-browser) |
| Charts | Recharts |
| Animations | Framer Motion |
| Markdown | react-markdown + remark-gfm + rehype-highlight |
| Analytics | GA4 + PostHog + Sentry |
| i18n | next-intl (EN, PT-BR, ES) |
| Fonts | ABC Diatype (Solana Foundation), Geist |
| On-Chain | @solana/web3.js, @solana/spl-token (Token-2022), Helius DAS API, Bubblegum cNFTs |
| Package Manager | pnpm |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20 or later
- [pnpm](https://pnpm.io/) 9 or later
- A Solana wallet browser extension (Phantom, Backpack, or Solflare) for testing wallet features

### Clone and Install

```bash
git clone https://github.com/solanabr/superteam-academy.git
cd superteam-academy/app
pnpm install
```

### Environment Variables

Create a `.env.local` file in the `app/` directory:

```bash
cp .env.example .env.local
```

Fill in the following variables:

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SOLANA_NETWORK` | Yes | Solana cluster -- `devnet` or `mainnet-beta` |
| `NEXT_PUBLIC_HELIUS_API_KEY` | Yes | Helius API key for DAS API and enhanced RPC |
| `NEXT_PUBLIC_XP_MINT_ADDRESS` | Yes | Mint address of the soulbound XP token (Token-2022) |
| `NEXT_PUBLIC_CREDENTIAL_COLLECTION` | Yes | Bubblegum cNFT collection address for credentials |
| `NEXT_PUBLIC_PROGRAM_ID` | Yes | Deployed Academy program ID |
| `NEXTAUTH_SECRET` | Yes | NextAuth.js secret -- generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | Canonical app URL -- `http://localhost:3000` for local dev |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID (for Google sign-in) |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | No | GitHub OAuth client ID (for GitHub sign-in) |
| `GITHUB_CLIENT_SECRET` | No | GitHub OAuth client secret |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | No | Google Analytics 4 measurement ID |
| `NEXT_PUBLIC_POSTHOG_KEY` | No | PostHog project API key |
| `NEXT_PUBLIC_POSTHOG_HOST` | No | PostHog instance host URL |
| `NEXT_PUBLIC_SENTRY_DSN` | No | Sentry DSN for error monitoring |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | No | Sanity CMS project ID |
| `NEXT_PUBLIC_SANITY_DATASET` | No | Sanity dataset name (default: `production`) |

### Run Development Server

```bash
cd superteam-academy/app
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
pnpm build
pnpm start
```

## Project Structure

```
superteam-academy/
├── README.md
├── LICENSE                          # MIT
├── docs/
│   ├── ARCHITECTURE.md              # System architecture, account maps, data flows
│   ├── SPEC.md                      # Full on-chain program specification
│   ├── CMS_GUIDE.md                 # Course creation and publishing workflow
│   ├── CUSTOMIZATION.md             # Theme, language, gamification customization
│   ├── IMPLEMENTATION_ORDER.md      # 10-phase incremental build plan
│   └── FUTURE_IMPROVEMENTS.md       # V2/V3 feature backlog
├── app/                             # Next.js frontend application
│   ├── package.json
│   ├── next.config.ts
│   ├── sanity.config.ts             # Sanity CMS configuration
│   ├── sentry.*.config.ts           # Sentry initialization (client/server/edge)
│   └── src/
│       ├── app/
│       │   ├── [locale]/            # i18n routes (en, pt-br, es)
│       │   │   ├── courses/         # Course catalog, detail, and lesson views
│       │   │   ├── dashboard/       # User dashboard with XP and progress
│       │   │   ├── leaderboard/     # Global XP rankings
│       │   │   ├── profile/         # User and public profile pages
│       │   │   ├── certificates/    # Certificate viewer and sharing
│       │   │   └── settings/        # User settings and preferences
│       │   ├── api/
│       │   │   ├── auth/            # NextAuth.js API routes
│       │   │   └── leaderboard/     # XP leaderboard API (read-only, 60s cache)
│       │   └── studio/              # Sanity CMS Studio (embedded)
│       ├── components/
│       │   ├── course/              # Course cards, module lists, lesson content
│       │   ├── editor/              # Monaco Editor integration
│       │   ├── gamification/        # XP bars, streak displays, achievement toasts
│       │   ├── layout/              # Navbar, footer, page wrappers
│       │   └── ui/                  # Primitives (Button, Badge, Tabs, Dialog, etc.)
│       ├── lib/
│       │   ├── auth/                # NextAuth.js configuration and providers
│       │   ├── hooks/               # useUser, useToast, useIntersectionObserver
│       │   ├── sanity/              # Sanity client, GROQ queries, content schemas
│       │   ├── services/            # Service layer
│       │   │   ├── courses.ts       # Static course catalog and achievement definitions
│       │   │   ├── credentials.ts   # Helius DAS API -- cNFT credential fetching
│       │   │   ├── xp.ts            # Token-2022 soulbound XP balance reads
│       │   │   ├── leaderboard.ts   # Leaderboard API client
│       │   │   ├── learning-progress.ts  # LocalStorageProgressService (swappable)
│       │   │   └── types.ts         # Shared service type definitions
│       │   ├── solana/              # Solana utilities and connection helpers
│       │   ├── supabase/            # Supabase client configuration
│       │   ├── constants.ts         # Network config, level formula, track colors
│       │   └── utils.ts             # General utility functions
│       ├── providers/               # React context providers (wallet, theme, i18n)
│       ├── messages/                # i18n translation JSON files
│       │   ├── en.json
│       │   ├── pt-br.json
│       │   └── es.json
│       ├── fonts/                   # ABC Diatype and DSemi font files
│       ├── i18n/                    # next-intl routing and request configuration
│       └── types/                   # TypeScript type definitions
└── programs/                        # Anchor/Rust on-chain program (planned)
```

## Internationalization

The application supports three languages using [next-intl](https://next-intl-docs.vercel.app/):

| Language | Locale | File |
|---|---|---|
| English | `en` | `src/messages/en.json` |
| Portuguese (Brazil) | `pt-br` | `src/messages/pt-br.json` |
| Spanish | `es` | `src/messages/es.json` |

All UI strings are externalized into JSON translation files. The locale is embedded in the URL path (`/en/courses`, `/pt-br/courses`, `/es/courses`). Users can switch languages via the language picker in the navbar or settings page.

To add a new language:
1. Create a new translation file in `src/messages/` (e.g., `fr.json`)
2. Add the locale to the routing configuration in `src/i18n/`
3. Translate all keys from `en.json`

## On-Chain Integration

Superteam Academy uses Solana devnet for all on-chain features. The architecture is designed with clean service abstractions so the local storage stub can be swapped for a full on-chain implementation without UI changes.

### XP Tokens

XP is represented as a **soulbound Token-2022 token** with the NonTransferable and PermanentDelegate extensions. Users cannot transfer or self-burn their XP. The frontend reads XP balances using `getTokenAccountsByOwner` from `@solana/spl-token`.

**Level formula:** `Level = floor(sqrt(totalXP / 100))`

### Credentials (cNFTs)

Course completion credentials are issued as **Bubblegum compressed NFTs** (cNFTs). The frontend fetches a user's credentials via the Helius DAS API (`getAssetsByOwner`), filtering by the credential collection address. Credentials are displayed in the profile page and can be shared as visual certificates.

### Leaderboard

The leaderboard ranks users by XP token balance. The `/api/leaderboard` API route uses `getTokenLargestAccounts` to index holders, with a 60-second server-side cache to reduce RPC load.

### Service Interface

```typescript
interface LearningProgressService {
  getProgress(userId: string, courseId: string): Promise<Progress>;
  getAllProgress(userId: string): Promise<Progress[]>;
  completeLesson(userId: string, courseId: string, lessonIndex: number): Promise<void>;
  enrollInCourse(userId: string, courseId: string): Promise<void>;
  unenrollFromCourse(userId: string, courseId: string): Promise<void>;
  getXP(userId: string): Promise<number>;
  getStreak(userId: string): Promise<StreakData>;
  getLeaderboard(timeframe: "weekly" | "monthly" | "alltime"): Promise<LeaderboardEntry[]>;
  getCredentials(walletAddress: string): Promise<Credential[]>;
}
```

The current implementation (`LocalStorageProgressService`) uses browser localStorage for progress and streaks, while XP balances, credentials, and leaderboard data are read directly from the Solana blockchain. This service can be replaced with an `OnChainProgressService` backed by the Anchor program once deployed -- no frontend changes required.

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from the app directory
cd superteam-academy/app
vercel
```

Configure all environment variables in the [Vercel Dashboard](https://vercel.com/dashboard) under your project's Settings > Environment Variables.

### Manual Deployment

Any hosting platform that supports Node.js 20+ and Next.js can run the application:

```bash
cd superteam-academy/app
pnpm build
pnpm start
```

The production server starts on port 3000 by default. Set the `PORT` environment variable to change this.

## Documentation

| Document | Description |
|---|---|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture, account maps, data flow diagrams |
| [SPEC.md](docs/SPEC.md) | Full on-chain program specification (v1.1) |
| [CMS_GUIDE.md](docs/CMS_GUIDE.md) | Course creation, content schema, publishing workflow |
| [CUSTOMIZATION.md](docs/CUSTOMIZATION.md) | Theme, language, and gamification customization guide |
| [IMPLEMENTATION_ORDER.md](docs/IMPLEMENTATION_ORDER.md) | 10-phase incremental build plan |
| [FUTURE_IMPROVEMENTS.md](docs/FUTURE_IMPROVEMENTS.md) | V2/V3 deferred feature backlog |

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make your changes and ensure linting passes: `pnpm lint`
4. Commit with a clear message following [Conventional Commits](https://www.conventionalcommits.org/)
5. Push to your fork and open a Pull Request against `main`

Please read the existing documentation in `docs/` before making architectural changes.

## License

This project is licensed under the [MIT License](LICENSE).

Copyright (c) 2026 Superteam Brazil.
