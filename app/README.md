# Superteam Academy — Frontend

A decentralized learning platform on Solana. Built with **Next.js 16**, **Tailwind CSS v4**, **shadcn/ui**, **Supabase**, **Sanity CMS**, and **Solana** (Token-2022, Metaplex Core).

> Open-source, forkable, and ready to deploy for any community.

---

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your Supabase keys (minimum required)

# 3. Start development server
pnpm dev
# → http://localhost:3000
```

> **Zero-config mode**: The app works without Sanity, Helius, or analytics keys. It falls back to 6 built-in Solana courses with full content and code challenges.

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18+ |
| pnpm | 9+ |
| Supabase project | [supabase.com](https://supabase.com) |

---

## Project Structure

```
app/
├── src/
│   ├── app/                    # Next.js App Router (13 routes)
│   │   ├── page.tsx            # Landing page (hero, stats, testimonials, CTA)
│   │   ├── courses/            # Catalog → Detail → Lessons
│   │   ├── dashboard/          # Authenticated dashboard
│   │   ├── profile/            # Own + public profiles
│   │   ├── leaderboard/        # XP leaderboard
│   │   ├── settings/           # User settings
│   │   ├── certificates/[id]/  # Credential detail + on-chain verification
│   │   └── api/                # Auth callback + health check
│   ├── components/
│   │   ├── auth/               # AuthDialog, ProtectedRoute
│   │   ├── gamification/       # StreakCalendar, AchievementCard, LevelRing,
│   │   │                       # XPNotification, SkillRadar
│   │   ├── layout/             # Navbar, Footer, PlatformLayout
│   │   ├── lesson/             # CodeEditor (Monaco)
│   │   ├── providers/          # Auth, Solana, Theme, Analytics
│   │   ├── shared/             # XPDisplay, StreakBadge, ErrorBoundary
│   │   └── ui/                 # shadcn/ui (20+ components + resizable panels)
│   ├── hooks/                  # use-services.ts, use-onchain.ts
│   ├── i18n/                   # next-intl (en, pt-br, es)
│   ├── lib/                    # Constants, Sanity client, Solana PDAs, Supabase
│   ├── services/               # 10 interfaces + implementations (Sanity/Supabase/Mock)
│   ├── stores/                 # Zustand auth store
│   └── types/                  # TypeScript types
├── docs/
│   ├── ARCHITECTURE.md         # System diagrams, data flows, provider stack
│   ├── CMS_GUIDE.md            # Course content management
│   └── CUSTOMIZATION.md        # Theme, i18n, gamification, forking
├── supabase/
│   └── schema.sql              # Database schema + RLS policies
├── .env.example                # Environment variable template
└── package.json
```

---

## Features

| Feature | Implementation | Status |
|---------|---------------|--------|
| **Course Catalog** | Sanity CMS + mock fallback, search/filter by track & difficulty | ✅ |
| **Interactive Lessons** | Resizable split layout: content + Monaco code editor | ✅ |
| **Code Challenges** | Starter code, solution, test cases with pass/fail feedback | ✅ |
| **Wallet Auth** | Solana Wallet Standard (auto-detect all wallets) | ✅ |
| **OAuth** | Supabase Auth (Google + GitHub) | ✅ |
| **XP System** | Soulbound Token-2022, on-chain ATA reader | ✅ |
| **Credential NFTs** | Metaplex Core, Helius DAS API, on-chain verification | ✅ |
| **On-Chain Enrollment** | Transaction builder + confirmation with explorer link | ✅ |
| **Streaks** | Daily streak tracking + GitHub-style calendar | ✅ |
| **Achievements** | 8 types across 4 categories with progress bars | ✅ |
| **Level System** | Logarithmic XP curve, SVG ring component | ✅ |
| **Skill Radar** | Recharts radar chart on profile page | ✅ |
| **Leaderboard** | XP ranking with timeframe toggle (weekly/monthly/all-time) | ✅ |
| **i18n** | 3 locales (EN, PT-BR, ES) via next-intl | ✅ |
| **Dark Mode** | Full support via class strategy | ✅ |
| **Responsive** | Mobile-first, resizable panels on desktop | ✅ |
| **Analytics** | GA4 + PostHog (optional, graceful degradation) | ✅ |
| **Newsletter** | Footer signup with toast confirmation | ✅ |
| **Social Proof** | Testimonials + partner logos on landing page | ✅ |
| **Public Profiles** | `/profile/[username]` with stats + achievements | ✅ |
| **Error Boundary** | React error boundary with retry | ✅ |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | Supabase anon key |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | No | Sanity project ID (empty = mock courses) |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | No | RPC endpoint (default: devnet) |
| `NEXT_PUBLIC_PROGRAM_ID` | No | On-chain program address |
| `NEXT_PUBLIC_XP_MINT` | No | XP token mint address |
| `NEXT_PUBLIC_HELIUS_API_KEY` | No | Helius DAS API key |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | No | Google Analytics 4 |
| `NEXT_PUBLIC_POSTHOG_KEY` | No | PostHog product analytics |

See [.env.example](.env.example) for all variables with descriptions.

---

## Development

```bash
pnpm dev          # Start dev server (Turbopack)
pnpm build        # Production build
pnpm start        # Run production server
pnpm lint         # ESLint
```

### Database Setup

1. Create a [Supabase](https://supabase.com) project
2. Run `supabase/schema.sql` in the SQL Editor
3. Enable Google and/or GitHub OAuth in Authentication → Providers
4. Copy the URL + anon key to `.env.local`

### CMS Setup (optional)

See [docs/CMS_GUIDE.md](docs/CMS_GUIDE.md) for full instructions.

### Customization

See [docs/CUSTOMIZATION.md](docs/CUSTOMIZATION.md) for theme, i18n, and gamification customization.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Styling | Tailwind CSS v4, shadcn/ui, oklch colors |
| Auth | Supabase Auth + Solana Wallet Standard |
| Database | Supabase (PostgreSQL + RLS) |
| CMS | Sanity v3 (GROQ queries, portable text) |
| Blockchain | Solana (Token-2022, Metaplex Core, Anchor) |
| Code Editor | Monaco Editor (@monaco-editor/react) |
| Charts | Recharts (radar chart) |
| i18n | next-intl (EN, PT-BR, ES) |
| State | Zustand |
| Analytics | GA4 + PostHog |
| Animations | Framer Motion |

---

## On-Chain Integration

The platform integrates with the [Superteam Academy Solana program](../onchain-academy/):

- **Program ID**: `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf`
- **XP Mint**: `XPTkMWRRH1QLbAYGSkwNmmHF8Q75RURmC269nHVhUoe`
- **Network**: Devnet

### Hooks

| Hook | Purpose |
|------|---------|
| `useOnChainXP()` | Read soulbound XP balance from Token-2022 ATA |
| `useOnChainEnrollment(courseId)` | Check if enrollment PDA exists |
| `useEnrollOnChain()` | Build + send enrollment transaction |
| `useOnChainCredentials()` | Fetch Metaplex Core NFTs via Helius DAS |
| `useOnChainConfig()` | Read program Config PDA |
| `useSendTransaction()` | Generic transaction sender with confirmation |

---

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for:
- System diagrams and data flows
- Provider stack
- Service layer pattern
- Performance considerations

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make changes and run `pnpm build` to verify
4. Submit a pull request

---

## License

MIT — see [LICENSE](../LICENSE)
