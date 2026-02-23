# Superteam Academy LMS Frontend

A Solana-native learning platform frontend built with Next.js App Router. This app delivers interactive course content, wallet-based enrollment, gamified XP progression, leaderboard views, and shareable learning credentials.

## Overview

Superteam Academy is a frontend-first LMS experience designed for Solana builders. The current implementation ships with local/mock data and service abstractions that make it straightforward to migrate to on-chain reads/writes and/or a headless CMS backend.

The codebase uses modern React patterns (server + client components), provider-based composition for theme/i18n/wallet concerns, and typed service interfaces for clean data-source swapping.

## Feature Highlights

- Solana-native UX with wallet integration (`Phantom`, `Solflare`) via Solana Wallet Adapter.
- Course catalog, filtering, enrollment flow, course details, and lesson progression.
- Challenge-capable lesson pages with Monaco-based code editor.
- XP, streaks, levels, achievements, and leaderboard views.
- Credential pages with Solana Explorer verification links.
- Persistent local user state using Zustand + `persist` middleware.
- Internationalization with runtime locale switching (`en`, `pt-BR`, `es`) using `next-intl`.
- Tailwind + shadcn/ui design system with responsive layout and reusable UI primitives.
- Framer Motion animations across landing/leaderboard and key interaction surfaces.

## Tech Stack

Core framework and runtime:

- `next@16.1.6`
- `react@19.2.3`
- `react-dom@19.2.3`

UI and styling:

- `tailwindcss@4`
- `@tailwindcss/postcss@4`
- `shadcn/ui` (configured in `components.json`, New York style)
- `radix-ui`
- `framer-motion`

Web3:

- `@solana/web3.js`
- `@solana/wallet-adapter-react`
- `@solana/wallet-adapter-react-ui`
- `@solana/wallet-adapter-wallets`
- `@solana/spl-token`
- `@coral-xyz/anchor`

State, i18n, utilities:

- `zustand`
- `next-intl`
- `zod`

## Getting Started

### Prerequisites

- Node.js `20+` (recommended)
- npm `10+`

### Install

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Open `http://localhost:3000`.

### Build for Production

```bash
npm run build
npm run start
```

### Lint

```bash
npm run lint
```

## Project Structure

```text
.
├── src/
│   ├── app/                      # Next.js App Router routes + root layout
│   │   ├── (auth)/sign-in
│   │   ├── (auth)/sign-up
│   │   ├── courses
│   │   ├── dashboard
│   │   ├── leaderboard
│   │   ├── profile/[username]
│   │   ├── certificates/[id]
│   │   └── settings
│   ├── components/
│   │   ├── course/               # Course cards, grid, module list, lesson UI
│   │   ├── gamification/         # XP, streak, level, achievements UI
│   │   ├── layout/               # Header, sidebar, footer
│   │   ├── providers/            # Theme, i18n, wallet, app provider composition
│   │   └── ui/                   # shadcn/ui primitives
│   ├── hooks/                    # useCourses, useEnrollment, useXp
│   ├── lib/
│   │   ├── data/                 # mock-courses and seeded mock entities
│   │   ├── services/             # Data/service contracts + local implementations
│   │   ├── solana/               # Program constants, connection, PDA helpers
│   │   └── store/                # Zustand user store
│   ├── messages/                 # i18n dictionaries (en, es, pt-BR)
│   └── types/                    # Shared domain types
├── public/
├── REFERENCE_COURSE_CATALOG.ts   # Large source catalog mapped into app courses
└── docs/
    ├── ARCHITECTURE.md
    ├── CUSTOMIZATION.md
    └── CMS_GUIDE.md
```

## Environment Variables

Current status:

- No required environment variables for local development.
- Solana RPC and program IDs are currently hardcoded in `src/lib/solana/constants.ts`.

### Optional Variables You May Introduce

If you want runtime configurability (recommended for production), add:

```bash
# .env.local
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_ACADEMY_PROGRAM_ID=ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf
NEXT_PUBLIC_XP_MINT=xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3
```

Then wire them in `src/lib/solana/constants.ts`.

## Deployment Guide

### Deploy on Vercel

1. Push the repo to GitHub/GitLab/Bitbucket.
2. Import project in Vercel.
3. Use default build settings:
   - Install command: `npm install`
   - Build command: `npm run build`
   - Output: Next.js managed output
4. Configure environment variables if you externalize Solana/CMS config.
5. Deploy.

### Self-Hosted Deployment

```bash
npm ci
npm run build
npm run start
```

Deploy behind a reverse proxy (Nginx/Caddy) and set `NODE_ENV=production`.

## Contributing

1. Create a feature branch.
2. Keep changes typed and aligned with existing service interfaces in `src/lib/services`.
3. Reuse shared components from `src/components/ui` and utility helpers from `src/lib`.
4. Run `npm run lint` before opening a PR.
5. Provide screenshots for UI changes and list impacted routes.

### Recommended Contribution Pattern

- For data/backend changes: update service interfaces first, then swap implementation class.
- For new user-facing text: update all dictionaries in `src/messages`.
- For new routes: follow App Router file conventions and maintain server/client boundaries.

## Additional Documentation

- Architecture: `docs/ARCHITECTURE.md`
- UI/theme/content customization: `docs/CUSTOMIZATION.md`
- CMS integration strategy: `docs/CMS_GUIDE.md`
