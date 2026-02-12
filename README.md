# Superteam Academy

Production-ready learning management system (LMS) for Solana development. Interactive courses, gamified progression (XP, streaks, achievements), and on-chain credentials.

## Overview

- **Frontend**: Next.js 14 (App Router), TypeScript (strict), Tailwind CSS, Radix UI–based components
- **Auth**: Solana Wallet Adapter (multi-wallet), with clean abstractions for Google/GitHub sign-in
- **i18n**: PT-BR, ES, EN from day one; language switcher in header
- **Gamification**: XP (soulbound Token-2022), levels `floor(sqrt(xp/100))`, streaks, achievements (stubbed with clean service interfaces for on-chain integration)
- **Credentials**: Display and verification of compressed NFTs (Metaplex Bubblegum / ZK compressed); issuance stubbed for backend integration

## Monorepo structure

```
superteam-academy/
├── app/                 # Next.js 14 frontend
│   ├── src/
│   │   ├── app/         # App Router routes ([locale], courses, dashboard, …)
│   │   ├── components/
│   │   ├── i18n/
│   │   └── lib/         # LearningProgressService, types, stub implementation
│   ├── messages/        # en, pt-BR, es
│   └── package.json
├── docs/                # SPEC, ARCHITECTURE (on-chain), IMPLEMENTATION_ORDER
├── programs/            # Anchor program (when present)
├── package.json         # Workspace root
└── pnpm-workspace.yaml
```

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript (strict, no `any`) |
| Styles | Tailwind CSS, design tokens (CSS variables) |
| Components | Radix UI primitives |
| Auth | Solana Wallet Adapter (multi-wallet) |
| i18n | next-intl (PT-BR, ES, EN) |
| Theme | Light/dark (next-themes) |

## Local development

### Prerequisites

- Node.js 20+
- pnpm 9+

### Setup

```bash
pnpm install
cp app/.env.example app/.env
# Edit app/.env if needed (RPC, optional Helius/Sentry/GA4)
pnpm dev
```

App runs at [http://localhost:3000](http://localhost:3000).

### Env vars

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SOLANA_RPC_URL` | Solana RPC (default: Devnet) |
| `NEXT_PUBLIC_SOLANA_NETWORK` | `devnet` or `mainnet-beta` |
| `NEXT_PUBLIC_HELIUS_API_KEY` | Optional; for DAS API (leaderboard, token accounts) |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional; error monitoring |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Optional; GA4 |

## Build & deploy

```bash
pnpm build
pnpm start
```

Deploy to Vercel or Netlify; use preview deployments for PRs. Configure env vars in the dashboard.

## Documentation

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — System architecture, component structure, data flow, service interfaces, on-chain integration points
- [docs/SPEC.md](docs/SPEC.md) — On-chain program specification
- [CMS_GUIDE.md](docs/CMS_GUIDE.md) — CMS content schema, course creation, publishing
- [CUSTOMIZATION.md](docs/CUSTOMIZATION.md) — Theme, languages, gamification extension

## License

MIT
