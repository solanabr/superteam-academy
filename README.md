# Superteam Academy

Production-ready Learning Management System (LMS) dApp for Solana developer education. Interactive courses, gamification with soulbound XP tokens (Token-2022), on-chain credential NFTs (Metaplex Core), and integrated code editor.

## Monorepo Structure

```
superteam-academy/
├── onchain-academy/          ← Anchor program (deployed on devnet)
│   ├── programs/             ← Rust program source (16 instructions)
│   ├── tests/                ← 77 Rust + 62 TypeScript tests
│   └── scripts/              ← Devnet interaction scripts
├── app/                      ← Next.js frontend
│   ├── src/                  ← Application source
│   ├── e2e/                  ← Playwright E2E tests
│   └── public/               ← Static assets + PWA
├── docs/                     ← Documentation
│   ├── SPEC.md               ← Program specification
│   ├── ARCHITECTURE.md       ← Account maps, data flows, CU budgets
│   ├── INTEGRATION.md        ← Frontend integration guide
│   └── DEPLOY-PROGRAM.md     ← Deploy your own devnet instance
└── scripts/                  ← Utility scripts
```

## Tech Stack

| Layer | Stack |
|---|---|
| **Frontend** | Next.js 14+ (App Router), TypeScript (strict), Tailwind CSS, shadcn/ui |
| **CMS** | Sanity (courses, lessons, achievements) |
| **Code Editor** | Monaco Editor (Rust/TypeScript/JSON) |
| **Wallet** | Solana Wallet Adapter (multi-wallet, wallet-standard) |
| **Auth** | NextAuth (Google + GitHub) + Solana Wallet |
| **i18n** | next-intl (English, Portuguese, Spanish) |
| **Programs** | Anchor 0.31+, Rust 1.82+ |
| **XP Tokens** | Token-2022 (NonTransferable, PermanentDelegate) |
| **Credentials** | Metaplex Core NFTs (soulbound via PermanentFreezeDelegate) |
| **RPC** | Helius (DAS API for credential queries + XP leaderboard) |
| **Analytics** | GA4 + Microsoft Clarity + Sentry |
| **Testing** | Vitest (308 unit tests) + Playwright (36 E2E specs) |
| **Deploy** | Vercel |

## Devnet Deployment

The program is live on devnet:

| | Address |
|---|---|
| **Program** | [`ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf`](https://explorer.solana.com/address/ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf?cluster=devnet) |
| **XP Mint** | [`xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3`](https://explorer.solana.com/address/xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3?cluster=devnet) |
| **Authority** | [`ACAd3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn`](https://explorer.solana.com/address/ACAd3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn?cluster=devnet) |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Solana CLI (for devnet interaction)

### Frontend Setup

```bash
cd app
cp .env.example .env.local
pnpm install
pnpm dev
```

### On-Chain Program

```bash
cd onchain-academy
yarn install
anchor build
anchor test
```

### Environment Variables

```env
NEXT_PUBLIC_PROGRAM_ID=ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf
NEXT_PUBLIC_XP_MINT=xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3
NEXT_PUBLIC_CLUSTER=devnet
NEXT_PUBLIC_HELIUS_RPC_URL=<your-helius-rpc>
NEXT_PUBLIC_SANITY_PROJECT_ID=<your-sanity-project>
NEXT_PUBLIC_SANITY_DATASET=production
BACKEND_SIGNER_KEYPAIR=<path-to-signer-keypair>
```

## Features

### Core (10 Pages)
- Landing page with hero, social proof, and animated stats
- Course catalog with filtering and search
- Course detail with module/lesson curriculum and reviews
- Split-layout lesson view with Monaco code editor
- Code challenge interface with test cases
- User dashboard with progress, achievements, and activity feed
- User profiles with skill radar chart and credentials
- Leaderboard with time-based and course filters
- Settings (appearance, language, notifications, privacy)
- Credential viewer with on-chain verification

### Gamification
- Soulbound XP tokens with configurable rewards by difficulty
- Level system: `Level = floor(sqrt(totalXP / 100))`
- 18 achievement types across 5 categories
- Streaks with freeze mechanism and milestone rewards
- 256-bit bitmap for lesson/achievement tracking

### Bonus
- Admin dashboard (course management, analytics)
- E2E test suite (Playwright, 36 specs)
- Community forum with threads and voting
- Onboarding quiz
- PWA support (installable, offline-capable)
- Daily coding challenges
- Course creator dashboard
- Deep devnet program integration
- Google + GitHub OAuth

## Documentation

- **[Program Specification](docs/SPEC.md)** — 16 instructions, 6 PDA types, 26 errors, 15 events
- **[Architecture](docs/ARCHITECTURE.md)** — Account maps, data flows, CU budgets
- **[Frontend Integration](docs/INTEGRATION.md)** — PDA derivation, instruction usage, events, error handling
- **[Deployment Guide](docs/DEPLOY-PROGRAM.md)** — Deploy your own program instance on devnet
- **[Frontend Architecture](app/ARCHITECTURE.md)** — Component architecture, service interfaces, data flow
- **[CMS Guide](app/CMS_GUIDE.md)** — Course creation, content schema, publishing workflow
- **[Customization](app/CUSTOMIZATION.md)** — Theme, languages, gamification extensions

## License

[MIT](LICENSE)
