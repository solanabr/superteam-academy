# Superteam Academy Frontend (`app`)

Implementation-focused documentation for the current Next.js application in this monorepo.

## Project Overview

This app is the product frontend for Superteam Academy, a Solana learning platform with:

- marketing + authenticated dashboard experiences
- multi-auth sign-in (wallet + Google + GitHub)
- course/lesson/challenge UX
- gamification (XP, streaks, achievements, leaderboard)
- on-chain integrations for XP and credentials
- CMS-backed content management via Sanity

### Implemented status (current)

- Auth supports OAuth and wallet flows, with account linking and wallet reconnect from dashboard.
- Dashboard and profile load from API/database with on-chain-aware XP indexing.
- Leaderboard defaults to on-chain source for default view, with fallback to DB source.
- Certificate/Credential pages include display + verification APIs.
- Credential verification now supports provider-aware indexer paths (`custom`, `helius`, `alchemy`).
- Learning progress service now has swappable providers:
	- local storage implementation
	- on-chain/API-backed implementation
	- selected via `NEXT_PUBLIC_PROGRESS_SERVICE_MODE`.

## Tech Stack

- Framework: Next.js 15 (App Router), React 18, TypeScript
- UI: Tailwind CSS, Radix UI, shadcn-style components, Lucide icons
- Auth: NextAuth v5 beta, Solana Wallet Adapter, Google, GitHub
- Blockchain: `@solana/web3.js`, Anchor client libs, SPL Token-2022, Metaplex Core integration points
- Data: MongoDB + Mongoose
- CMS: Sanity (Studio + content client)
- Observability/Analytics: Sentry, GA4, PostHog
- PWA: service worker + manifest

## Local Development Setup

### Prerequisites

- Node.js 20+
- npm 10+
- MongoDB instance

### Install

```bash
cd app
npm install
```

### Configure environment

Create `app/.env.local` and fill values from the Environment Variables section below.

### Run locally

```bash
npm run dev
```

App runs at `http://localhost:3000`.

### Available scripts

```bash
npm run dev      # Next dev (Turbopack)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Lint checks
```

## Environment Variables

Create `app/.env.local`.

### Required (core)

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret
MONGODB_URI=mongodb://...
```

### Required (OAuth if enabled)

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

### Solana / Program (recommended)

```env
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=
NEXT_PUBLIC_XP_MINT=
```

Server-side Solana fallbacks/ops:

```env
SOLANA_RPC_URL=
XP_TOKEN_MINT_ADDRESS=
BACKEND_SIGNER_SECRET_KEY=[...]   # JSON array secret key for backend-signed instructions
```

### Indexer provider selection (credentials + leaderboard paths)

```env
NEXT_PUBLIC_INDEXER_PROVIDER=custom   # custom | helius | alchemy
NEXT_PUBLIC_HELIUS_API_KEY=
NEXT_PUBLIC_HELIUS_RPC_URL=
NEXT_PUBLIC_ALCHEMY_API_KEY=
NEXT_PUBLIC_ALCHEMY_RPC_URL=
```

### Progress service mode (swappable abstraction)

```env
NEXT_PUBLIC_PROGRESS_SERVICE_MODE=local   # local | onchain
```

### Sanity CMS

```env
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2026-02-23
SANITY_API_TOKEN=
```

### Analytics / Monitoring (optional)

```env
NEXT_PUBLIC_GA4_MEASUREMENT_ID=
NEXT_PUBLIC_POSTHOG_API_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
NEXT_PUBLIC_SENTRY_DSN=
```

### Notifications / integrations (optional)

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:you@example.com

EMAIL_PROVIDER=sendgrid
RESEND_API_KEY=
EMAIL_FROM=
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=

NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

### Admin controls (optional)

```env
ADMIN_USER_IDS=
ADMIN_EMAILS=
NEXT_PUBLIC_ADMIN_ADDRESSES=
```

## Deployment

### Recommended target

- Vercel (preferred for Next.js App Router)

### Build and start

```bash
npm run build
npm run start
```

### Deployment checklist

1. Add all required env vars in deployment platform.
2. Ensure `MONGODB_URI` points to production database.
3. Set Solana network and program values (`NEXT_PUBLIC_SOLANA_NETWORK`, `NEXT_PUBLIC_PROGRAM_ID`, `NEXT_PUBLIC_XP_MINT`).
4. If using backend-signed on-chain actions, set `BACKEND_SIGNER_SECRET_KEY` securely.
5. Configure indexer provider credentials (`helius`/`alchemy`) if not using `custom`.
6. Configure Sanity variables if CMS features are enabled.

## Architecture Notes

- On-chain integration references:
	- `../docs/INTEGRATION.md`
	- `../docs/SPEC.md`
	- `../docs/DEPLOY-PROGRAM.md`
- App Solana config entrypoint:
	- `src/lib/solana/program-config.ts`
- Swappable learning progress abstraction:
	- `src/services/learning-progress.ts`

## Key Routes

- `/`
- `/auth/signin`
- `/dashboard`
- `/courses`
- `/courses/[slug]`
- `/courses/[slug]/lessons/[id]`
- `/leaderboard`
- `/profile`
- `/profile/[username]`
- `/settings`
- `/certificates/[id]`
- `/admin-premium/studio/*`
