# Superteam Academy — Frontend

Interactive learning platform for Solana developers. Built with Next.js 16, Tailwind CSS 4, and Solana Wallet Adapter.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 4 + CSS design tokens |
| Components | Radix UI primitives + custom wrappers |
| Wallet | Solana Wallet Adapter (Phantom, Solflare, Torus, Ledger, Coinbase) |
| State | Zustand + TanStack React Query |
| i18n | next-intl (EN, ES, PT-BR) |
| Theming | next-themes (dark/light/system) |
| Icons | Lucide React |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+

### Setup

```bash
cd app
pnpm install
```

### Environment Variables

Create `.env.local` in the `app/` directory:

```env
# Solana RPC (defaults to devnet if not set)
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=devnet
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
pnpm build
pnpm start
```

### Lint

```bash
pnpm lint
```

## Project Structure

```
app/src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Landing page (/)
│   ├── courses/            # Course catalog + detail + lessons
│   ├── dashboard/          # Learner dashboard
│   ├── leaderboard/        # XP rankings
│   ├── profile/            # User profile
│   ├── settings/           # User preferences
│   └── certificates/       # On-chain credential viewer
├── components/
│   ├── ui/                 # Radix UI primitives (button, card, tabs, etc.)
│   ├── landing/            # Landing page sections (hero, features, CTA, etc.)
│   ├── layout/             # Header + Footer
│   ├── courses/            # Course catalog, card, detail
│   ├── lessons/            # Lesson viewer with code editor
│   ├── editor/             # Code editor component
│   ├── dashboard/          # Dashboard widgets
│   ├── leaderboard/        # Leaderboard table + podium
│   ├── profile/            # Profile page + tabs
│   ├── settings/           # Settings forms
│   └── certificate/        # Certificate display + verification
├── services/
│   ├── interfaces.ts       # Service contracts (swap stubs for on-chain)
│   ├── index.ts            # Service exports
│   └── stub/               # Local storage implementations
│       ├── courses.ts      # 6 mock courses with modules/lessons
│       ├── learning-progress.ts  # Progress tracking
│       ├── gamification.ts # XP, streaks, achievements, leaderboard
│       └── credentials.ts  # Mock on-chain credentials
├── providers/              # React context providers
│   ├── solana-provider.tsx # Wallet adapter + connection
│   ├── theme-provider.tsx  # Dark/light theme
│   ├── query-provider.tsx  # TanStack Query
│   └── index.tsx           # Composed provider tree
├── i18n/                   # Internationalization config
│   ├── config.ts           # Locale definitions
│   ├── request.ts          # Server-side locale detection
│   └── index.ts            # Re-exports
├── messages/               # Translation files
│   ├── en.json             # English (~330 keys)
│   ├── es.json             # Spanish
│   └── pt-BR.json          # Brazilian Portuguese
├── types/                  # TypeScript type definitions
│   └── index.ts            # Course, Credential, Progress, Achievement, etc.
└── lib/
    └── utils.ts            # cn(), formatXP(), getLevel(), truncateAddress()
```

## Architecture

### Pages (10 routes)

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Landing | Hero, features, learning paths, stats, testimonials, partners, CTA |
| `/courses` | CourseCatalog | Filterable grid with search, difficulty/track filters |
| `/courses/[slug]` | CourseDetail | Course info, module accordion, enrollment CTA |
| `/courses/[slug]/lessons/[id]` | LessonView | Split content + code editor, prev/next nav |
| `/dashboard` | Dashboard | XP, streak, rank, courses in progress, achievements |
| `/profile` | ProfilePage | Avatar, credentials, achievements, activity |
| `/leaderboard` | Leaderboard | Top-3 podium, full rankings table, timeframe tabs |
| `/settings` | SettingsPage | Profile, account, preferences, privacy tabs |
| `/certificates/[id]` | CertificatePage | Visual certificate, on-chain verification, NFT details |

### Service Layer

All data flows through service interfaces defined in `services/interfaces.ts`. Stub implementations use `localStorage` for persistence. To connect on-chain:

1. Create a new implementation of the interface (e.g., `services/onchain/courses.ts`)
2. Swap the export in `services/index.ts`

```typescript
// services/index.ts — swap stubs for on-chain
export { courseService } from "./onchain/courses";  // was "./stub/courses"
```

**Service interfaces:**

| Service | Methods | Stub |
|---------|---------|------|
| `CourseService` | getCourses, getCourse, searchCourses, getByTrack | Yes |
| `LearningProgressService` | getProgress, completeLesson, enrollInCourse, finalizeCourse | Yes |
| `GamificationService` | getXP, getStreak, getAchievements, getLeaderboard | Yes |
| `CredentialService` | getCredentials, getCredential, verifyCredential | Yes |
| `UserService` | getUser, updateUser, linkAuthProvider | Interface only |
| `AnalyticsService` | trackPageView, trackEvent, trackError | Interface only |

### Design System

CSS custom properties in `globals.css` provide the full token system:

- **Colors**: primary (purple), accent (teal), semantic (success/warning/destructive)
- **Gamification**: `--xp`, `--streak`, `--level` with `.text-xp`, `.text-streak`, `.text-level` utilities
- **Tracks**: Per-track colors (`--track-fundamentals`, `--track-defi`, etc.)
- **Dark/Light**: Full dual-theme support, dark mode is primary

### i18n

All UI strings are externalized in `messages/{locale}.json`. Language switcher is in the header. Locale is stored as a cookie and detected server-side via `next-intl`.

Supported locales: `en`, `es`, `pt-BR`.

## Wallet Integration

The app uses Solana Wallet Adapter with support for:
- Phantom
- Solflare
- Torus
- Ledger
- Coinbase Wallet

Wallet-gated features: Dashboard, Profile, Settings, Course Enrollment.

RPC defaults to devnet. Configure via `NEXT_PUBLIC_SOLANA_RPC_URL`.

## Deployment

Deploy to Vercel:

```bash
cd app
npx vercel
```

Or connect the GitHub repo to Vercel with:
- **Root Directory**: `app`
- **Build Command**: `pnpm build`
- **Output Directory**: `.next`

Set environment variables in the Vercel dashboard.

## On-Chain Integration Points

The frontend is designed to connect to the Superteam Academy Anchor program. Key integration points:

| Feature | Current | On-Chain |
|---------|---------|----------|
| XP Balance | localStorage counter | Token-2022 soulbound token balance |
| Credentials | Mock Credential array | Metaplex Core NFTs via Photon indexer |
| Enrollment | localStorage flag | Enrollment PDA creation (learner signs) |
| Lesson Completion | localStorage bitmap | Backend-signed transaction |
| Leaderboard | Mock data | Helius DAS API indexing XP token balances |
| Achievements | Mock bitmap | AchievementReceipt PDA + soulbound NFT |

See `docs/SPEC.md` and `docs/INTEGRATION.md` for full program specification.
