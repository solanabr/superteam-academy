# Superteam Academy App

Frontend for the Superteam Academy learning platform. This app provides wallet-based learning flows, on-chain progress tracking, credentials/certificates, daily challenges, leaderboard, discussions, admin tools, and Sanity CMS integration.

## Monorepo Context

This repository includes multiple workspaces (`app`, `backend`, `onchain-academy`). This README documents the frontend app in `./app`.

## Overview

Key capabilities:

- Wallet-first authentication and profile experience (Solana Wallet Adapter)
- Course catalog and lesson player
- Enrollment + progress tracking backed by on-chain PDAs
- XP, leaderboard, streaks, and achievements UI
- Certificate and credential views (Metaplex Core assets)
- Daily challenge flow with code execution and completion tracking
- Community discussions backed by Postgres (Prisma)
- Admin console for config, courses, minters, credentials, achievements, challenges
- Sanity Studio integration for content operations
- PWA support for offline caching of visited content

## Tech Stack

| Layer | Stack |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling/UI | Tailwind CSS v4, shadcn/ui, Radix primitives, Lucide icons |
| Wallet/Web3 | `@solana/wallet-adapter-*`, `@solana/web3.js`, Anchor client |
| State/Data | TanStack Query |
| Community DB | PostgreSQL + Prisma + `@prisma/adapter-pg` |
| Content | Sanity (`next-sanity`, `@sanity/client`) with mock fallback |
| Analytics/Monitoring | GA4, Microsoft Clarity, Sentry (optional) |
| PWA | Service worker + manifest (`/public/sw.js`, `app/manifest.ts`) |

## Local Development Setup

### Prerequisites

- Node.js 20+
- `pnpm` 10+
- A running backend (`./backend`) for academy/challenge/admin proxy actions
- A Postgres database for discussions
- A browser wallet (Phantom/Solflare/etc.)

### Run Locally

```bash
cd app
pnpm install
cp .env.example .env.local
```

Update `.env.local` with your values, then:

```bash
pnpm db:generate
pnpm db:push   # first run or after schema changes
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Use `app/.env.example` as the source of truth.

### Core (public / wallet / chain)

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_PROGRAM_ID` | Yes | On-chain academy program id |
| `NEXT_PUBLIC_XP_MINT` | Yes | Token-2022 XP mint |
| `NEXT_PUBLIC_BACKEND_SIGNER` | Yes | Backend signer pubkey |
| `NEXT_PUBLIC_CLUSTER` | Recommended | Default `devnet` |
| `NEXT_PUBLIC_SOLANA_RPC` | Recommended | RPC endpoint for client reads/writes |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Optional | Enables WalletConnect adapter |

### Community (Postgres)

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Yes (for discussions) | Used by Prisma in `lib/prisma.ts` |
| `DATABASE_URL_SSL_REJECT_UNAUTHORIZED` | Optional | Set `false` only when required |

### Backend proxy (server-only)

| Variable | Required | Notes |
| --- | --- | --- |
| `BACKEND_URL` | Yes for academy/admin/challenges APIs | Defaults to `http://localhost:3001` |
| `BACKEND_API_TOKEN` | Yes for `/api/academy/*` and challenge proxy routes | Must match backend |
| `ADMIN_JWT_SECRET` | Yes for admin-protected actions | Must match backend signer/auth setup |

### Content / CMS

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_USE_SANITY` | Optional | `true` uses Sanity content, `false` uses mock content |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Required when using Sanity | Used by read client + Studio |
| `NEXT_PUBLIC_SANITY_DATASET` | Required when using Sanity | Usually `production` |
| `NEXT_PUBLIC_SANITY_API_VERSION` | Optional | Default in code |
| `SANITY_API_TOKEN` | Optional | Required for write stub endpoints |
| `SANITY_PROJECT_ID` | Optional | Server-side write client for stub APIs |
| `SANITY_DATASET` | Optional | Server-side write client for stub APIs |
| `SANITY_API_VERSION` | Optional | Server-side write client API version |

### Credentials / DAS

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_HELIUS_RPC` | Optional | Helius RPC URL for credential/leaderboard reads |
| `HELIUS_API_KEY` | Optional | Server-side fallback if public RPC is not set |
| `NEXT_PUBLIC_CREDENTIAL_TRACK_COLLECTIONS` | Optional | Comma-separated Metaplex Core collection addresses |
| `NEXT_PUBLIC_CREDENTIAL_PLACEHOLDER_URI` | Optional | URI treated as placeholder image |

### Optional telemetry

- `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- `NEXT_PUBLIC_CLARITY_PROJECT_ID`
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `SENTRY_AUTH_TOKEN`

## Useful Scripts

```bash
cd app
pnpm dev          # Start Next.js app
pnpm build        # Production build
pnpm start        # Production server
pnpm lint         # ESLint
pnpm db:generate  # Prisma client generation
pnpm db:push      # Push Prisma schema to DB
pnpm test:e2e     # Playwright tests
```

## Deployment

### Build and run

```bash
cd app
pnpm install
pnpm db:generate
pnpm build
pnpm start
```

### Deployment checklist

- Set all required environment variables in your hosting provider
- Ensure `BACKEND_URL` is reachable from deployed app runtime
- Ensure `DATABASE_URL` points to the intended production DB
- Run `pnpm db:push` (or equivalent migration workflow) before serving discussions
- If using Sanity, set `NEXT_PUBLIC_USE_SANITY=true` plus Sanity env values
- Set `NEXT_PUBLIC_APP_URL` if you need absolute URL API calls
- Verify service worker behavior in production (it is disabled in dev by design)

### Vercel notes

- If deploying from monorepo root, set project root directory to `app`
- Add all env vars under project settings
- Confirm API routes can reach backend and Postgres from Vercel region/network

## Additional Docs

- [ARCHITECTURE](./docs/ARCHITECTURE.md)
- [CMS Guide](./docs/CMS_GUIDE.md)
- [Customization](./docs/CUSTOMIZATION.md)
