# Superteam Academy - Decentralized Learning Platform for Solana

A gamified, on-chain education platform where developers learn Solana through interactive coding challenges, earn verifiable credentials, and compete on a global leaderboard. Built with Next.js 16, React 19, and the Solana blockchain.

## Screenshots

> Screenshots and demo recording coming soon. The app ships with light and dark mode out of the box.

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Framework** | Next.js (App Router, Turbopack) | 16.1 |
| **UI Library** | React | 19.2 |
| **Language** | TypeScript | 5.7 |
| **Styling** | Tailwind CSS + CSS Variables | 3.4 |
| **Component Library** | shadcn/ui (Radix primitives) | -- |
| **Blockchain** | Solana Web3.js | 1.98 |
| **Program Framework** | Anchor (client) | 0.32 |
| **Wallet** | Solana Wallet Adapter (Phantom, Solflare) | 0.15 |
| **Authentication** | Custom JWT wallet auth + NextAuth v5 (Google, GitHub) | 5.0 beta |
| **Internationalization** | next-intl | 4.8 |
| **Code Editor** | Monaco Editor (@monaco-editor/react) | 4.7 |
| **CMS** | Sanity (optional, with local fallback) | -- |
| **Analytics** | PostHog + Google Analytics 4 + Sentry | -- |
| **Charts** | Recharts | 2.15 |
| **Roadmaps** | React Flow (@xyflow/react) | 12.10 |
| **Icons** | Lucide React | 0.544 |
| **Forms** | React Hook Form + Zod | -- |
| **Fonts** | Inter, Archivo, JetBrains Mono (Google Fonts) | -- |

## Features

### Core Pages

| Page | Route | Description |
|------|-------|-------------|
| Landing | `/` | Hero, stats, learning paths, features, testimonials, CTA |
| Courses | `/courses` | Filterable course catalog with search |
| Course Detail | `/courses/[slug]` | Course overview, modules, enrollment |
| Lesson View | `/courses/[slug]/lessons/[id]` | Reading, video, or interactive coding challenge |
| Dashboard | `/dashboard` | Progress stats, activity heatmap, streak, recommendations |
| Leaderboard | `/leaderboard` | Global XP ranking from on-chain data |
| Profile | `/profile` and `/profile/[username]` | User profile with badges, certificates, skills |
| Roadmaps | `/roadmaps` and `/roadmaps/[slug]` | Interactive learning path diagrams (React Flow) |
| Settings | `/settings` | User preferences and account linking |
| Certificates | `/certificates/[id]` | Verifiable on-chain credential viewer |
| Auth | `/auth/signin` | Sign in with wallet or OAuth |

### Platform Features

- **Wallet Authentication** -- Sign in with Phantom or Solflare via message signing (nonce-based challenge-response)
- **OAuth Integration** -- Optional Google and GitHub sign-in with account linking
- **On-Chain Progress** -- Learner profiles, enrollments, and lesson completion recorded on Solana devnet
- **Interactive Code Editor** -- Monaco Editor with Rust/TypeScript support, test runner, and confetti on completion
- **Gamification** -- XP system, levels, streaks, achievements/badges, and global leaderboard
- **Activity Heatmap** -- GitHub-style contribution graph showing daily learning activity
- **Internationalization** -- English, Portuguese (BR), and Spanish with cookie-based locale switching
- **Dark/Light Mode** -- System-aware theme with manual toggle
- **CMS Integration** -- Sanity headless CMS with automatic fallback to hardcoded course data
- **Analytics Pipeline** -- GA4 pageviews, PostHog event tracking and session replay, Sentry error monitoring
- **Interactive Roadmaps** -- Visual learning path diagrams with React Flow
- **Responsive Design** -- Mobile-first layout with skeleton loading states

## Quick Start

### Prerequisites

- Node.js 18+ (20 recommended)
- npm, pnpm, or yarn
- A Solana wallet browser extension (Phantom or Solflare) for full functionality

### Installation

```bash
# Clone the repository
git clone https://github.com/superteam/superteam-academy.git
cd superteam-academy/superteam-frontend

# Copy environment variables
cp .env.example .env.local

# Install dependencies
npm install

# Start the development server (uses Turbopack)
npm run dev
```

The app will be available at `http://localhost:3000`.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run TypeScript type checking |

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_ACADEMY_PROGRAM_ID` | Yes | `DFB44LZed...` | Deployed Solana program ID |
| `NEXT_PUBLIC_ACADEMY_CLUSTER` | Yes | `devnet` | Solana cluster (`devnet` or `mainnet-beta`) |
| `NEXT_PUBLIC_ACADEMY_RPC_URL` | Yes | Helius devnet | Solana RPC endpoint (Helius recommended) |
| `AUTH_JWT_SECRET` | No | Dev fallback | JWT secret for wallet auth sessions (64-char hex) |
| `GOOGLE_CLIENT_ID` | No | -- | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | -- | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | No | -- | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | No | -- | GitHub OAuth client secret |
| `NEXTAUTH_SECRET` | No | -- | NextAuth session secret (required if using OAuth) |
| `NEXTAUTH_URL` | No | `http://localhost:3000` | Canonical app URL for NextAuth |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | No | -- | Sanity CMS project ID |
| `NEXT_PUBLIC_SANITY_DATASET` | No | `production` | Sanity dataset name |
| `SANITY_API_TOKEN` | No | -- | Sanity API token (for draft content) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | No | -- | Google Analytics 4 measurement ID |
| `NEXT_PUBLIC_POSTHOG_KEY` | No | -- | PostHog project API key |
| `NEXT_PUBLIC_POSTHOG_HOST` | No | `https://us.i.posthog.com` | PostHog ingestion host |
| `NEXT_PUBLIC_SENTRY_DSN` | No | -- | Sentry DSN for error monitoring |
| `NEXT_PUBLIC_APP_URL` | No | `http://localhost:3000` | Public-facing app URL |

The app runs without any optional variables. Wallet auth uses a built-in dev secret, and courses load from hardcoded data when Sanity is not configured.

## Project Structure

```
superteam-frontend/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout (fonts, providers, i18n)
│   ├── page.tsx                  # Landing page
│   ├── globals.css               # CSS variables, theme, custom styles
│   ├── auth/signin/              # Sign-in page
│   ├── courses/                  # Course catalog and detail pages
│   │   ├── page.tsx              # Course catalog
│   │   └── [slug]/               # Dynamic course detail + lesson views
│   ├── dashboard/                # Authenticated dashboard
│   ├── leaderboard/              # Global leaderboard
│   ├── profile/                  # User profile
│   │   └── [username]/           # Public profile view
│   ├── roadmaps/                 # Interactive roadmaps
│   │   └── [slug]/               # Individual roadmap detail
│   ├── certificates/[id]/        # Certificate viewer
│   ├── settings/                 # User settings
│   └── api/                      # API routes
│       ├── auth/                 # Wallet auth + NextAuth endpoints
│       │   ├── me/               # Session check
│       │   └── wallet/           # Nonce, verify, logout, session
│       ├── academy/              # On-chain program interactions
│       │   ├── courses/ensure/   # Ensure course exists on-chain
│       │   ├── progress/complete/# Lesson completion
│       │   └── status/           # Enrollment status
│       ├── activity/             # Activity heatmap + recent activity
│       ├── identity/me/          # Identity snapshot
│       ├── leaderboard/          # Leaderboard data
│       └── settings/             # User settings CRUD
├── components/                   # React components
│   ├── analytics/                # Analytics provider
│   ├── auth/                     # Sign-in buttons
│   ├── certificates/             # Certificate page component
│   ├── courses/                  # Course card, catalog, detail
│   ├── dashboard/                # Dashboard content, leaderboard widget
│   ├── landing/                  # Landing page sections
│   ├── leaderboard/              # Leaderboard page component
│   ├── lesson/                   # Code editor, lesson view
│   ├── profile/                  # Profile page component
│   ├── providers/                # App providers (theme, web3, auth, intl)
│   ├── roadmap/                  # Roadmap viewer, nodes, detail panel
│   ├── settings/                 # Settings page component
│   ├── skeletons/                # Loading skeleton components
│   ├── ui/                       # shadcn/ui base components
│   ├── navbar.tsx                # Top navigation bar
│   ├── footer.tsx                # Site footer
│   ├── language-switcher.tsx     # i18n locale picker
│   ├── theme-provider.tsx        # next-themes provider
│   └── activity-heatmap.tsx      # GitHub-style activity heatmap
├── hooks/                        # Custom React hooks
│   ├── use-identity-snapshot.ts  # Fetch user identity
│   ├── use-mobile.tsx            # Responsive breakpoint hook
│   └── use-toast.ts              # Toast notifications
├── i18n/                         # Internationalization
│   ├── config.ts                 # Locale definitions (en, pt-br, es)
│   ├── request.ts                # Server-side locale resolution
│   └── client.ts                 # Client-side locale hooks
├── lib/                          # Shared utilities and services
│   ├── analytics/                # GA4, PostHog, Sentry clients
│   ├── cms/                      # Sanity CMS client, schema, service
│   ├── generated/                # Generated program constants
│   ├── hooks/                    # Shared hooks
│   ├── identity/                 # Identity types
│   ├── roadmaps/                 # Roadmap definitions and builder
│   ├── server/                   # Server-only modules
│   │   ├── academy-program.ts    # On-chain instruction building + signing
│   │   ├── academy-chain-read.ts # Chain data reading utilities
│   │   ├── wallet-auth.ts        # JWT token creation/verification
│   │   ├── auth-config.ts        # NextAuth configuration
│   │   ├── account-linking.ts    # Wallet + OAuth account linking
│   │   ├── leaderboard-cache.ts  # In-memory leaderboard cache
│   │   ├── activity-store.ts     # Activity tracking + heatmap data
│   │   └── certificate-service.ts# Certificate generation
│   ├── solana/                   # Client-side Solana transactions
│   │   ├── init-learner.ts       # Initialize learner profile
│   │   └── enroll-course.ts      # Course enrollment
│   ├── course-catalog.ts         # Hardcoded course data
│   ├── landing-data.ts           # Landing page content
│   └── utils.ts                  # General utilities (cn, etc.)
├── messages/                     # i18n translation files
│   ├── en.json                   # English
│   ├── es.json                   # Spanish
│   └── pt-br.json                # Portuguese (Brazil)
├── public/                       # Static assets
├── styles/                       # Additional stylesheets
│   └── globals.css               # Legacy global styles
├── tailwind.config.ts            # Tailwind configuration
├── next.config.mjs               # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
├── components.json               # shadcn/ui configuration
└── package.json                  # Dependencies and scripts
```

## Deployment

### Vercel (Recommended)

1. Push the repository to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Set the **Root Directory** to `superteam-frontend` if deploying from the monorepo.
4. Add all required environment variables from `.env.example` to the Vercel project settings.
5. Deploy. Vercel auto-detects Next.js and uses the correct build settings.

**Build command:** `npm run build` (auto-detected)
**Output directory:** `.next` (auto-detected)

### Other Platforms

The app is a standard Next.js application and can be deployed to any platform that supports Node.js server-side rendering:

- **Netlify** -- Use the `@netlify/plugin-nextjs` adapter.
- **AWS Amplify** -- Supports Next.js apps natively.
- **Docker** -- Use a multi-stage build with `node:20-alpine`.
- **Self-hosted** -- Run `npm run build && npm run start` behind a reverse proxy.

Set `NEXT_PUBLIC_APP_URL` to your production URL in all cases.

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feat/your-feature-18-02-2026`.
3. Make your changes and ensure `npm run lint` passes.
4. Commit with conventional commit messages (`feat:`, `fix:`, `docs:`, etc.).
5. Open a pull request against `main`.

### Code Style

- TypeScript strict mode.
- Tailwind CSS for styling (no CSS modules).
- shadcn/ui patterns for component composition.
- Server Components by default; add `"use client"` only when needed.
- Absolute imports via `@/` path alias.

### Architecture Documentation

See `docs/ARCHITECTURE.md` for system design, data flow, and service layer details.

## License

MIT
