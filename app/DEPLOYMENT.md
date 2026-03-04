# DEPLOYMENT.md

## Deploy to Vercel

1. Push branch to remote
2. Import repository in Vercel
3. Set **Root Directory** to `app`
4. Framework: **Next.js**
5. Build command: `pnpm build`
6. Install command: `pnpm install`
7. Output directory: `.next`

## Environment variables

Set only what you need; all integrations are optional.

### Auth
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

### Solana
- `NEXT_PUBLIC_SOLANA_RPC_URL`
- `NEXT_PUBLIC_XP_TOKEN_MINT`
- `NEXT_PUBLIC_DAS_API_URL`

### Sanity
- `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `NEXT_PUBLIC_SANITY_DATASET`
- `NEXT_PUBLIC_SANITY_API_VERSION`
- `SANITY_API_TOKEN`

### Analytics & Monitoring
- `NEXT_PUBLIC_GA4_ID`
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST`
- `NEXT_PUBLIC_SENTRY_DSN`

## Verification checklist

- [ ] `pnpm build` passes with no env vars
- [ ] Site loads routes under `/courses`, `/dashboard`, `/leaderboard`
- [ ] Wallet connect works in browser
- [ ] Optional providers activate only when env vars are set
