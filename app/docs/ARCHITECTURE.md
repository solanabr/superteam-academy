# Architecture

## Layers

1. **Presentation**: App Router pages and reusable components
2. **Application services**: `lib/*` modules (auth, i18n, gamification, solana, cms)
3. **External integrations**: NextAuth, Wallet Adapter, Sanity, GA4/PostHog/Sentry

## Data flow

- Pages call service modules (server/client depending on concern)
- Courses load from Sanity when configured, fallback to local typed data
- Gamification state is currently localStorage-based and isolated behind interfaces for backend/on-chain swap later

## On-chain-ready design

- `lib/solana.ts` encapsulates all devnet reads
- leaderboard currently returns stubbed index rows using the same shape expected from an indexer
