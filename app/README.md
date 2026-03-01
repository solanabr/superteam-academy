# Superteam Academy

A gamified learning management system for Solana developer education. Built with Next.js 16, Tailwind CSS v4, and on-chain credentials.

[Live Demo](https://academy.superteam.fun) · [Architecture](./ARCHITECTURE.md) · [CMS Guide](./CMS_GUIDE.md) · [Customization](./CUSTOMIZATION.md)

---

## Features

### Core Platform

- **10 pages** -- Landing, Course Catalog, Course Detail, Lesson Viewer, Code Challenge, Dashboard, Leaderboard, Profile, Settings, Credential Viewer
- **Interactive code editor** with Monaco-powered test runner
- **Real-time progress tracking** via on-chain lesson bitmap

### On-Chain Integration

- **Soulbound XP tokens** -- Token-2022 with NonTransferable extension
- **Credential NFTs** -- Metaplex Core for course completion certificates
- **Achievement receipts** with on-chain verification
- **Backend signer anti-cheat** pattern for server-validated submissions

### Gamification

- **XP leveling system** -- `Level = floor(sqrt(xp / 100))`
- **Streak tracking** with multipliers
- **Achievement badges** across 5 categories
- **Visual rewards** -- confetti, level-up modal, animated XP toasts

### Internationalization

- **3 languages** -- English, Portuguese, Spanish
- **Locale-based routing** -- `/en/courses`, `/pt/courses`, `/es/courses`
- **CMS content** served in all supported languages

### Bonus Features

- Admin dashboard with analytics (pure SVG charts)
- Community forum (Supabase-backed)
- Onboarding quiz with recommendation engine
- Daily coding challenges
- Creator dashboard
- PWA support
- Playwright E2E test suite

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4, Radix UI, shadcn/ui |
| State | Zustand |
| CMS | Sanity v5 (embedded Studio at `/studio`) |
| Blockchain | Solana (web3.js, Anchor, SPL Token, Metaplex Core) |
| Auth | Solana Wallet Adapter |
| i18n | next-intl |
| Database | Supabase (forum, preferences) |
| Testing | Vitest, Testing Library, Playwright |
| Monitoring | Sentry, Vercel Analytics |

---

## Quick Start

```bash
# Clone and install
git clone <repo-url>
cd app
pnpm install

# Configure environment (optional -- works with mock data out of the box)
cp .env.example .env.local
# Edit .env.local with your Sanity/Solana credentials

# Development
pnpm dev

# Build
pnpm build

# Test
pnpm test:run        # Unit tests (308 tests)
pnpm test:e2e        # E2E tests (requires Playwright browsers)
```

> The app ships with comprehensive mock data. No external services are required for local development.

---

## Project Structure

```
src/
  app/           # Next.js App Router pages and layouts
  components/    # React components (UI primitives + feature modules)
  lib/           # Shared utilities, hooks, stores, types, and constants
  i18n/          # Internationalization config and request handler
  messages/      # Translation JSON files (en, pt, es)
  middleware.ts  # Locale detection and routing middleware
e2e/             # Playwright end-to-end tests
sanity/          # Sanity schema definitions and seed data
public/          # Static assets (images, icons, manifest)
```

---

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_PROGRAM_ID` | No | Solana program address (default provided) |
| `NEXT_PUBLIC_XP_MINT` | No | XP token mint address (default provided) |
| `NEXT_PUBLIC_AUTHORITY` | No | Program authority address (default provided) |
| `NEXT_PUBLIC_CLUSTER` | No | Solana cluster -- `devnet` or `mainnet-beta` |
| `NEXT_PUBLIC_HELIUS_RPC_URL` | No | Helius RPC endpoint for reliable Solana access |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | No | Sanity project ID (mock data used if absent) |
| `NEXT_PUBLIC_SANITY_DATASET` | No | Sanity dataset name (defaults to `production`) |
| `BACKEND_SIGNER_KEYPAIR` | No | Server-side keypair for anti-cheat signing |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | No | Google Analytics measurement ID |
| `SENTRY_DSN` | No | Sentry error tracking DSN |
| `SENTRY_AUTH_TOKEN` | No | Sentry auth token for source maps |
| `NEXT_PUBLIC_SUPABASE_URL` | No | Supabase project URL (forum features) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No | Supabase anonymous key |

> All variables are optional. The platform runs fully functional with mock data when no external services are configured.

---

## Scripts

| Script | Description |
| --- | --- |
| `pnpm dev` | Start dev server with Turbopack |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm test` | Run unit tests in watch mode (Vitest) |
| `pnpm test:run` | Run unit tests once |
| `pnpm test:coverage` | Run unit tests with coverage report |
| `pnpm test:e2e` | Run E2E tests (Playwright) |
| `pnpm test:e2e:ui` | Run E2E tests with interactive UI |
| `pnpm lint` | Run ESLint |

---

## CMS Setup

Sanity Studio is embedded at `/studio` and provides a full content editing experience.

**Option A: Use mock data (zero setup)**

Skip CMS configuration entirely. The app serves built-in mock data for all courses, lessons, and challenges.

**Option B: Connect Sanity**

1. Create a project at [sanity.io](https://www.sanity.io)
2. Set `NEXT_PUBLIC_SANITY_PROJECT_ID` in `.env.local`
3. Import seed data:
   ```bash
   npx sanity dataset import sanity/seed/production.ndjson production
   ```
4. Access Studio at `http://localhost:3000/studio`

---

## Deployment

### Vercel (recommended)

1. Connect your repository to [Vercel](https://vercel.com)
2. Set environment variables in the Vercel dashboard
3. Deploy -- Vercel auto-detects the Next.js configuration

### Self-hosted

```bash
pnpm build
pnpm start
```

The production server starts on port 3000 by default. Use a reverse proxy (nginx, Caddy) for TLS termination.

---

## Documentation

| Document | Description |
| --- | --- |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Technical architecture, data flow, on-chain design |
| [CMS_GUIDE.md](./CMS_GUIDE.md) | Content editor guide for Sanity Studio |
| [CUSTOMIZATION.md](./CUSTOMIZATION.md) | Developer guide for extending the platform |

---

## License

MIT
