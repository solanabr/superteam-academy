# Superteam Academy LMS (Next.js 16)

Production-oriented LMS scaffold for Solana-native education.

## Quick start

```bash
pnpm install
cp .env.example .env.local # optional, all integrations are optional
pnpm dev
```

## Build

```bash
pnpm build
```

Build works with zero env vars configured (external providers are optional and gracefully disabled).

## Architecture overview

- **App Router** pages for courses, lessons, dashboard, leaderboard, auth, settings, profile
- **Auth**: NextAuth + Google OAuth (optional) + wallet adapter (Phantom/Solflare/Backpack)
- **I18N**: locale cookie + middleware + EN/PT-BR/ES dictionaries
- **Code editor**: Monaco on lesson pages with stub run feedback loop
- **CMS**: Sanity client + schema stubs + typed fallback to local mock data
- **Gamification**: XP/level/streak + achievements service using localStorage
- **Devnet reads**: XP token and cNFT DAS request scaffold
- **Analytics**: GA4/PostHog/Sentry optional providers and event tracking

## Demo

- Demo URL: `TBD`
- Demo video: `TBD`
- X post: `TBD`
