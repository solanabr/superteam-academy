# Architecture

## Overview
Superteam Academy is a Next.js 16 App Router monorepo with a frontend client, Sanity CMS, and Solana Devnet integration.

## Folder Structure
```
app/                    # Next.js frontend
  app/[locale]/         # i18n routes (en, pt-BR, es)
    courses/            # Course catalog + detail + lessons
    dashboard/          # User dashboard
    leaderboard/        # XP leaderboard
    profile/            # User profile
    settings/           # Account settings
    certificates/       # NFT credential viewer
    onboarding/         # Psychometric quiz
  app/api/              # API routes
    ai-mentor/          # Gemini AI error explainer
  components/           # Reusable UI components
  lib/                  # Services, types, utilities
    services/           # Data layer (stubs + Sanity + on-chain)
    sanity/             # Sanity client + schemas
  i18n/                 # next-intl config
  locales/              # Translation files (en, pt-BR, es)
```

## Data Flow
1. User authenticates via Privy (Google/GitHub/wallet)
2. Privy silently provisions a Solana wallet
3. Course content served from Sanity CMS
4. XP balance read from Token-2022 account via Helius
5. NFT credentials read from Metaplex Core via Helius DAS
6. AI mentor calls Gemini API with error context + locale

## Service Layer
All data access goes through service interfaces in lib/services/:
- courseService — stub data for development
- sanityCourseService — Sanity CMS integration
- credentialService — Metaplex Core NFT reading
- userService — XP balance + profile data

## On-Chain Integration Points
- XP Token: Token-2022 NonTransferable mint on Devnet
- Credentials: Metaplex Core NFTs with PermanentFreezeDelegate
- Enrollment: Direct PDA instruction signed by learner
- Leaderboard: Indexed via Helius DAS API