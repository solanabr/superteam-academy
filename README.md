<div align="center">
  <h1>Solarium</h1>
  <p><strong>Where Solana developers take root.</strong></p>
  <p>An open-source learning platform for Solana blockchain development.<br/>Built by <a href="https://superteam.fun">Superteam Brazil</a>.</p>
  <p><a href="https://solarium.courses">solarium.courses</a></p>

  <p>
    <a href="#features">Features</a> &bull;
    <a href="#tech-stack">Tech Stack</a> &bull;
    <a href="#getting-started">Getting Started</a> &bull;
    <a href="docs/ARCHITECTURE.md">Architecture</a> &bull;
    <a href="docs/DEPLOYMENT.md">Deployment</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-14-black?logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/Rust-Axum-DEA584?logo=rust" alt="Rust" />
    <img src="https://img.shields.io/badge/Solana-Devnet-9945FF?logo=solana" alt="Solana" />
    <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="MIT License" />
    <img src="https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase" alt="Supabase" />
    <img src="https://img.shields.io/badge/Sanity-CMS-F36458?logo=sanity" alt="Sanity" />
  </p>
</div>

---

> Think "Codecademy meets Cyfrin Updraft" for Solana: gamified XP as soulbound Token-2022 tokens, interactive coding challenges with Monaco Editor, a Rust build server for on-chain program verification, and NFT certificates minted on Solana Devnet.

## Features

### Learn

- **Interactive courses** with structured modules and lessons
- **Code challenges** with an in-browser Monaco Editor and mock Solana SDK
- **Rust program builds** compiled and verified by a sandboxed build server
- **Content lessons** with rich markdown rendering
- **Learning paths** that guide students through a curated sequence of courses

### Earn

- **On-chain XP** as soulbound Token-2022 tokens on Solana Devnet (NonTransferable + PermanentDelegate)
- **Level progression** using a square-root curve (`Level = floor(sqrt(totalXP / 100))`)
- **Daily streaks** that track consecutive learning days
- **15 achievement badges** across 5 categories (Progress, Streaks, Skills, Community, Special)

### Certify

- **Real NFT certificates** minted on Solana Devnet via Metaplex Token Metadata
- **On-chain verification** with Solana Explorer links
- **Certificate gallery** on your profile page

### Connect

- **Solana wallet auth** (SIWS) supporting Phantom, Solflare, and Backpack
- **Google OAuth** for low-friction onboarding
- **Account linking** -- both auth methods create unified Supabase users

### Compete

- **Live leaderboard** with weekly, monthly, and all-time XP rankings (backed by Helius DAS API)
- **Public profiles** showing achievements, certificates, and learning stats

### Explore

- **3 languages**: English, Portuguese (BR), and Spanish
- **Dark/light mode** with a Solana-branded gradient theme
- **Fully responsive** mobile-first design with shadcn/ui and Radix

## Tech Stack

| Layer        | Technology                                |
| ------------ | ----------------------------------------- |
| Framework    | Next.js 14 (App Router)                   |
| Language     | TypeScript (strict mode, zero `any`)      |
| Build Server | Rust / Axum on GCP Cloud Run              |
| CMS          | Sanity v3 (GROQ queries)                  |
| Database     | Supabase (Postgres + RLS + Auth)          |
| Blockchain   | Solana Devnet, Token-2022, Metaplex UMI   |
| Auth         | SIWS (Sign In With Solana) + Google OAuth |
| Styling      | Tailwind CSS + shadcn/ui + Radix UI       |
| i18n         | next-intl (EN, PT-BR, ES)                 |
| Code Editor  | Monaco Editor (VS Code engine)            |
| Analytics    | GA4 + PostHog + Sentry                    |
| Monorepo     | Turborepo + pnpm 9                        |
| Deployment   | Vercel (web) + GCP Cloud Run (build)      |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) >= 18
- [pnpm](https://pnpm.io) >= 9
- A [Supabase](https://supabase.com) account (free tier works)
- A [Sanity](https://sanity.io) account (free tier works)
- A Solana wallet ([Phantom](https://phantom.app) recommended)

### Quick Setup

```bash
# 1. Clone and install
git clone https://github.com/superteam-brazil/solarium.git
cd solarium
pnpm install

# 2. Configure environment
cp .env.example apps/web/.env.local
# Edit apps/web/.env.local with your credentials (see Environment Variables below)

# 3. Set up the database
# Paste supabase/schema.sql into your Supabase SQL Editor and run it

# 4. Set up Token-2022 XP mint on Devnet
pnpm setup:devnet
# This creates the soulbound XP token mint and prints the env vars to add

# 5. Import seed content
cd sanity && node seed/import.mjs && cd ..

# 6. Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

For detailed deployment instructions, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Project Structure

```
solarium/
├── apps/
│   ├── web/                   # Next.js 14 application
│   │   ├── src/app/           #   App Router pages ([locale] route groups)
│   │   ├── src/components/    #   UI components (auth, editor, gamification, layout)
│   │   ├── src/lib/           #   Utilities (supabase, sanity, solana, services, analytics)
│   │   └── src/messages/      #   i18n translation files (en, pt-BR, es)
│   └── build-server/          # Rust/Axum build server (GCP Cloud Run)
│       ├── src/               #   Axum routes, middleware, caching, cleanup
│       ├── programs/          #   Template Cargo workspace for user builds
│       ├── deploy/            #   cloudbuild.yaml, deploy.sh, setup-gcp.sh
│       ├── Dockerfile         #   Multi-stage build (Rust 1.84, x86_64)
│       └── tests/             #   Integration tests
├── packages/
│   ├── types/                 # Shared TypeScript interfaces (incl. on-chain types)
│   └── config/                # Shared ESLint, TS, Tailwind configs
├── scripts/                   # Devnet setup (Token-2022 XP mint provisioning)
├── sanity/                    # Sanity Studio + schemas + seed data
├── supabase/                  # Database schema (schema.sql)
├── docs/                      # Documentation
└── turbo.json                 # Turborepo config
```

## Environment Variables

Copy `.env.example` to `apps/web/.env.local` and fill in values:

```bash
# ── Supabase ─────────────────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=          # Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Public anon key (safe for browser)
SUPABASE_SERVICE_ROLE_KEY=         # PRIVATE -- server-only, for admin operations

# ── Sanity CMS ───────────────────────────────────────────────────────────────
NEXT_PUBLIC_SANITY_PROJECT_ID=     # From sanity.io/manage
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=                  # Only needed for seed import (sanity/seed/import.mjs)

# ── Solana ───────────────────────────────────────────────────────────────────
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=devnet

# Token-2022 XP Mint (generated by `pnpm setup:devnet`)
NEXT_PUBLIC_XP_MINT_ADDRESS=       # Base58 mint pubkey
XP_MINT_AUTHORITY_SECRET=          # PRIVATE -- JSON array of authority keypair bytes

# Helius DAS API (for on-chain leaderboard indexing — server-only)
HELIUS_API_KEY=

# ── Auth ─────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_GOOGLE_CLIENT_ID=      # Google OAuth client ID

# ── Build Server (GCP Cloud Run) ────────────────────────────────────────────
# Direct Cloud Run URL (IAM check disabled, app validates X-API-Key)
NEXT_PUBLIC_BUILD_SERVER_URL=https://solarium-build-server-HASH.a.run.app
BUILD_SERVER_API_KEY=              # PRIVATE -- same value as SOLARIUM_API_KEY on Cloud Run

# ── Analytics (optional -- platform works without these) ─────────────────────
NEXT_PUBLIC_GA4_MEASUREMENT_ID=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
SENTRY_DSN=

# ── App URL (for sitemap, OG tags, NFT metadata URI) ────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Documentation

| Document                               | Description                                    |
| -------------------------------------- | ---------------------------------------------- |
| [Architecture](docs/ARCHITECTURE.md)   | System design, data flow, security model       |
| [Deployment](docs/DEPLOYMENT.md)       | Production deployment (Vercel + GCP Cloud Run) |
| [CMS Guide](docs/CMS_GUIDE.md)         | Sanity schema, GROQ patterns, content workflow |
| [Customization](docs/CUSTOMIZATION.md) | Theming, i18n, gamification, and extending     |

## Development

```bash
pnpm dev          # Start Next.js dev server
pnpm build        # Production build
pnpm lint         # ESLint
pnpm typecheck    # TypeScript type checking
pnpm format       # Prettier formatting
pnpm setup:devnet # Provision Token-2022 XP mint on Solana Devnet
```

### Code Quality

- TypeScript strict mode with zero `any` types
- ESLint + Prettier enforced via Husky pre-commit hooks
- Conventional commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`
- All UI strings externalized via next-intl (never hardcoded)
- Server components by default, client components only when needed

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit using conventional commits: `git commit -m "feat: add quiz lesson type"`
4. Push and open a pull request

## License

MIT

## Acknowledgments

- [Superteam Brazil](https://superteam.fun) -- community and bounty program
- [Solana Foundation](https://solana.org) -- blockchain infrastructure
- Built with [Claude Code](https://claude.ai/claude-code) (Anthropic)
