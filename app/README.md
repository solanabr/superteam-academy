# Superteam Academy LMS

Superteam Academy is a Solana-focused learning platform scaffold built with **Next.js 16**, **React 19**, **Tailwind 4**, and **pnpm**.

## Features

- Wallet + Google auth scaffolding (NextAuth + Solana Wallet Adapter)
- Internationalization foundation (EN / PT-BR / ES)
- Interactive lesson code editor (Monaco, TypeScript/Rust)
- CMS-ready content layer (Sanity schemas + fallback mock data)
- Gamification service (XP, level thresholds, streaks, achievements)
- Devnet read scaffolding (XP token balance + cNFT/DAS payload)
- Optional analytics + observability (GA4, PostHog, Sentry)
- Vercel-ready deployment config

## Architecture

- `src/app/*`: App Router routes and API endpoints
- `src/components/*`: UI components and providers
- `src/lib/*`: service layer (auth, i18n, gamification, solana, sanity)
- `src/messages/*`: locale dictionaries
- `docs/*`: architecture and API documentation

## Setup

```bash
pnpm install
cp .env.example .env.local # optional
pnpm dev
```

Open: http://localhost:3000

## Build

```bash
pnpm build
```

✅ Build passes with zero env vars configured.

## Environment variables

See `.env.example` for all optional integrations:
- Auth: `NEXTAUTH_*`, `GOOGLE_*`
- Solana: `NEXT_PUBLIC_SOLANA_RPC_URL`, `NEXT_PUBLIC_XP_TOKEN_MINT`, `NEXT_PUBLIC_DAS_API_URL`
- Sanity: `NEXT_PUBLIC_SANITY_*`, `SANITY_API_TOKEN`
- Analytics/Monitoring: `NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_POSTHOG_*`, `NEXT_PUBLIC_SENTRY_DSN`

## Screenshots

- Home page: `docs/screenshots/home.png` (placeholder)
- Lesson editor: `docs/screenshots/lesson-editor.png` (placeholder)
- Dashboard: `docs/screenshots/dashboard.png` (placeholder)

## Demo

- Demo URL: **TBD**
- Demo video: **TBD**
- X post: **TBD**

## Contributing

1. Create a feature branch
2. Run `pnpm lint` and `pnpm build`
3. Open a PR with before/after notes and screenshots

## License

MIT (placeholder)
