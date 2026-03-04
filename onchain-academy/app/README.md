# Superteam Academy Frontend

Production-focused frontend for the Superteam Academy Solana LMS.

## Tech Stack

- Next.js (App Router), TypeScript strict mode
- Tailwind CSS with tokenized dark-mode-first theme
- next-intl (EN, PT-BR, ES)
- Solana client integration (`@solana/web3.js`) for wallet-driven flows
- Monaco editor for coding challenges
- PostHog + GA4 + Sentry instrumentation hooks
- Supabase-backed API durability for progress/enrollment/leaderboard
- Privy-ready auth bridge (wallet + social account linking flow)

## Local Development

```bash
cd onchain-academy/app
npm install
npm run dev
```

Open `http://localhost:3000` and you will be redirected to `/en`.

## Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_HELIUS_RPC_URL=
HELIUS_RPC_URL=
NEXT_PUBLIC_XP_MINT=xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3
NEXT_PUBLIC_LEADERBOARD_API_URL=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
NEXT_PUBLIC_GA_MEASUREMENT_ID=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_DSN=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_PRIVY_APP_ID=
NEXT_PUBLIC_PRIVY_CLIENT_ID=
```

If Supabase/Privy variables are not configured, the app automatically falls back to local demo behavior.
For production, prefer setting `HELIUS_RPC_URL` (server-side) and keep Helius RPC off direct browser calls.

## Route Map

- `/[locale]` Landing page
- `/[locale]/courses`
- `/[locale]/courses/[slug]`
- `/[locale]/courses/[slug]/lessons/[id]`
- `/[locale]/dashboard`
- `/[locale]/profile`
- `/[locale]/profile/[username]`
- `/[locale]/leaderboard`
- `/[locale]/settings`
- `/[locale]/certificates/[id]`

## Integration Status

Implemented on devnet-compatible reads/signing:
- Wallet connect (injected providers)
- XP token balance reads
- Credential listing + verification interface
- Enrollment signer flow (placeholder instruction signing path)
- Enrollment transaction signing from learner wallet (Devnet)

Stubbed with clean interfaces:
- Backend-signed lesson completion/finalization
- Achievement claiming
- Program-side credential issuance and upgrade handlers

## API Endpoints (Next.js Route Handlers)

- `GET/POST /api/enrollments`
- `GET/POST /api/progress`
- `GET /api/streak`
- `GET /api/activity`
- `GET /api/leaderboard?window=weekly|monthly|all-time`

These routes are remote-first with Supabase and degrade gracefully to local-only mode.

## Deployment

- Recommended: Vercel
- Ensure all environment variables are configured in project settings.
- Enable preview deployments for PR review.
