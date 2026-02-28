# Superteam Academy

Full-stack learning platform for Solana developers. On-chain Anchor program + production Next.js 15 frontend with wallet integration, trilingual i18n, code challenges, certificates, and offline support.

**[Live Demo](https://app-roan-iota-58.vercel.app)** · **[Demo Video](https://streamable.com/nealvo)**

## Features

| Feature | Description |
|---------|-------------|
| **Course Catalog** | Browse and search courses across five tracks with filtering |
| **Interactive Lessons** | Integrated Monaco code editor with real code challenges |
| **Code Challenges** | Solve coding problems with on-chain verification |
| **Certificates** | Soulbound Metaplex Core NFTs verifiable on Solana Explorer |
| **Leaderboard** | XP-based rankings with country and period filters |
| **Dashboard** | XP charts, streak calendars, and achievement badges |
| **Community Forum** | Discussion threads and peer interaction |
| **Offline Mode** | IndexedDB storage with background sync on reconnect |
| **Internationalization** | Full trilingual support (EN / ES / PT-BR), ~660 keys per locale |
| **Wallet Integration** | Phantom wallet adapter with lazy loading |
| **Admin Panel** | Five-tab governance dashboard with analytics |
| **Teaching Portal** | Course creation and management for instructors |

## Monorepo Structure

```
superteam-academy/
├── onchain-academy/          ← Anchor program (deployed on devnet)
│   ├── programs/             ← Rust program source (16 instructions)
│   ├── tests/                ← 77 Rust + 62 TypeScript tests
│   └── scripts/              ← Devnet interaction scripts
├── app/                      ← Next.js 15 frontend
│   ├── app/[locale]/         ← 14 page routes (i18n-aware)
│   ├── app/api/              ← 23 API routes across 15 domains
│   ├── components/           ← Shared React components
│   ├── e2e/                  ← 11 Playwright E2E test suites
│   ├── tests/                ← 12 Vitest unit test suites
│   ├── messages/             ← i18n translations (en, es, pt-BR)
│   ├── lib/                  ← Utilities, IDL, helpers
│   └── i18n/                 ← next-intl configuration
├── docs/                     ← Specification, architecture, integration guide
└── wallets/                  ← Keypairs (gitignored)
```

## Pages

Landing · Course Catalog · Course Detail · Lessons · Code Challenges · Dashboard · Leaderboard · Certificates · Community · Offline Library · Profile · Settings · Admin · Teaching Portal · Onboarding

## API Routes (23)

`achievements` · `analytics` · `auth` · `certificates` · `challenges` · `community` · `complete-lesson` · `courses` · `health` · `leaderboard` · `notifications` · `profile` · `quiz` · `search` · `stats`

## Tech Stack

| Layer | Stack |
|-------|-------|
| **Framework** | Next.js 15, React 19, TypeScript (strict) |
| **Styling** | Tailwind CSS, Radix UI, Framer Motion |
| **Code Editor** | Monaco Editor (@monaco-editor/react) |
| **Blockchain** | Anchor 0.31+, @solana/web3.js, @solana/spl-token |
| **Wallet** | Solana Wallet Adapter (Phantom) |
| **Credentials** | Metaplex Core NFTs (soulbound via PermanentFreezeDelegate) |
| **XP Tokens** | Token-2022 (NonTransferable, PermanentDelegate) |
| **i18n** | next-intl (EN, ES, PT-BR) |
| **Testing** | Playwright (E2E) + Vitest (unit) |
| **Monitoring** | Sentry (@sentry/nextjs) |
| **Deployment** | Vercel |

## Lighthouse Scores

| Performance | Accessibility | Best Practices | SEO |
|:-----------:|:------------:|:--------------:|:---:|
| 90 | 96 | 96 | 91 |

## Devnet Deployment

| | Address |
|---|---|
| **Program** | [`ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf`](https://explorer.solana.com/address/ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf?cluster=devnet) |
| **XP Mint** | [`xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3`](https://explorer.solana.com/address/xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3?cluster=devnet) |
| **Authority** | [`ACAd3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn`](https://explorer.solana.com/address/ACAd3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn?cluster=devnet) |

## Quick Start

```bash
git clone https://github.com/TheAuroraAI/superteam-academy.git
cd superteam-academy

# On-chain program
cd onchain-academy
yarn install
anchor build
anchor test

# Frontend
cd ../app
npm install
npm run dev          # http://localhost:3000
npm run test:unit    # Vitest
npm run test         # Playwright E2E
npm run test:all     # Both
```

## Documentation

- **[Program Specification](docs/SPEC.md)** — 16 instructions, 6 PDA types, 26 errors, 15 events
- **[Architecture](docs/ARCHITECTURE.md)** — Account maps, data flows, CU budgets
- **[Frontend Integration](docs/INTEGRATION.md)** — PDA derivation, instruction usage, events, error handling
- **[Deployment Guide](docs/DEPLOY-PROGRAM.md)** — Deploy your own program instance on devnet

## License

[MIT](LICENSE)
