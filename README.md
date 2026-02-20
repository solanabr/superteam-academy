<div align="center">
  <h1>Solarium</h1>
  <p><strong>A Solana-native learning platform with on-chain credentials.</strong></p>
  <p>Soulbound XP tokens, NFT certificates, interactive coding challenges, and gamified progression — all on Solana.</p>
  <p>Built by <a href="https://superteam.fun">Superteam Brazil</a></p>

  <p>
    <a href="#overview">Overview</a> &bull;
    <a href="#tech-stack">Tech Stack</a> &bull;
    <a href="#local-development">Local Development</a> &bull;
    <a href="#environment-variables">Environment Variables</a> &bull;
    <a href="#deployment">Deployment</a> &bull;
    <a href="#documentation">Documentation</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Solana-Devnet-9945FF?logo=solana" alt="Solana" />
    <img src="https://img.shields.io/badge/Token--2022-Soulbound_XP-14F195" alt="Token-2022" />
    <img src="https://img.shields.io/badge/Metaplex_Core-NFT_Credentials-E42575" alt="Metaplex Core" />
    <img src="https://img.shields.io/badge/Next.js-14-black?logo=next.js" alt="Next.js 14" />
    <img src="https://img.shields.io/badge/Anchor-0.31+-DEA584?logo=rust" alt="Anchor" />
    <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="MIT License" />
  </p>
</div>

---

## Overview

Solarium is an open-source learning management system built on Solana. Learners enroll in courses, complete lessons to earn soulbound XP tokens, receive NFT certificates on course completion, and collect achievements — all with on-chain verification.

### Feature Highlights

**On-Chain Credentials**

- **Soulbound XP tokens** via Token-2022 (NonTransferable + PermanentDelegate) — cannot be transferred or self-burned
- **NFT certificates** via Metaplex Core, auto-minted on course completion and frozen to the learner's wallet (PermanentFreezeDelegate)
- **On-chain lesson tracking** using a bitmap stored in the Enrollment PDA — each bit represents a lesson

**Interactive Learning**

- Code challenges with an in-browser Monaco Editor (JS/TS syntax highlighting, automated test cases)
- Rust/Anchor program compilation via a sandboxed build server
- Content lessons with rich markdown rendering
- Program deployment and interaction directly from lesson pages

**Gamification**

- XP rewards for lesson completions (10-100 XP based on difficulty)
- Level progression: `Level = floor(sqrt(totalXP / 100))`
- Daily streaks tracking consecutive learning days
- 15 achievements across 5 categories (Progress, Streaks, Skills, Community, Special)
- Celebration popups for level-ups, achievements, and certificate minting

**Platform**

- i18n: English, Portuguese (pt-BR), Spanish
- Dark/light mode with Solana-branded gradient theme
- Wallet auth (SIWS) supporting Phantom, Solflare, and Backpack
- Google OAuth for low-friction onboarding
- Admin panel for deploying courses and achievements on-chain
- Live leaderboard with weekly, monthly, and all-time XP rankings

## Tech Stack

| Layer            | Technology                                                            |
| ---------------- | --------------------------------------------------------------------- |
| Frontend         | Next.js 14 (App Router), React 18, Tailwind CSS, shadcn/ui + Radix UI |
| CMS              | Sanity v3 (GROQ queries)                                              |
| Database / Auth  | Supabase (Postgres, RLS, Auth)                                        |
| On-Chain Program | Solana, Anchor 0.31+ (Rust)                                           |
| XP Tokens        | Token-2022 (NonTransferable + PermanentDelegate)                      |
| Credential NFTs  | Metaplex Core (soulbound via PermanentFreezeDelegate)                 |
| i18n             | next-intl (EN, PT-BR, ES)                                             |
| Auth             | SIWS (Sign In With Solana) + Google OAuth                             |
| Code Editor      | Monaco Editor                                                         |
| Build Server     | Rust/Axum on GCP Cloud Run                                            |
| Analytics        | GA4, PostHog, Sentry (all optional)                                   |
| RPC              | Helius (DAS API for credential queries + leaderboard)                 |
| Monorepo         | Turborepo + pnpm 9                                                    |
| Deployment       | Vercel (web) + GCP Cloud Run (build server)                           |

## Screenshots / Demo

> **Add screenshots here before submission.**
> Suggested: Dashboard, lesson page with Monaco editor, achievement popup, certificate page, admin panel.
>
> Place files in `docs/screenshots/` and reference them:
> `![Dashboard](docs/screenshots/dashboard.png)`

## Local Development

### Prerequisites

- [Node.js](https://nodejs.org) >= 18
- [pnpm](https://pnpm.io) >= 9
- A [Supabase](https://supabase.com) account (free tier works)
- A [Sanity](https://sanity.io) account (free tier works)
- A Solana wallet ([Phantom](https://phantom.app) recommended)

For on-chain program development, you also need:

- [Rust](https://rustup.rs) >= 1.82
- [Solana CLI](https://docs.solanalabs.com/cli/install) >= 1.18
- [Anchor CLI](https://www.anchor-lang.com/docs/installation) >= 0.31

### Quick Setup

```bash
# 1. Clone and install
git clone https://github.com/superteam-brazil/solarium.git
cd solarium
pnpm install

# 2. Configure environment
cp .env.example apps/web/.env.local
# Fill in required values (see Environment Variables below)

# 3. Set up the database
# Create a Supabase project, then run supabase/schema.sql in the SQL Editor.
# Then apply migrations from supabase/migrations/ in order.

# 4. Import seed content into Sanity
cd sanity && SANITY_API_TOKEN=<your-token> node seed/import.mjs && cd ..

# 5. Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

**Minimum variables for basic dev** (no on-chain features): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`.

**Full on-chain features** require: `NEXT_PUBLIC_PROGRAM_ID`, `NEXT_PUBLIC_XP_MINT_ADDRESS`, `NEXT_PUBLIC_BACKEND_SIGNER`, `PROGRAM_AUTHORITY_SECRET`, `BACKEND_SIGNER_SECRET`. See [Program Deployment](docs/DEPLOY-PROGRAM.md) for the deploy and initialize workflow.

### Development Commands

```bash
pnpm dev          # Start Next.js dev server
pnpm build        # Production build
pnpm lint         # ESLint
pnpm typecheck    # TypeScript type checking
pnpm format       # Prettier formatting
```

## Project Structure

```
solarium/
├── apps/
│   ├── web/                    # Next.js 14 application
│   │   ├── src/app/            #   App Router pages ([locale] route groups)
│   │   │   ├── [locale]/
│   │   │   │   ├── (marketing)/  # Landing page
│   │   │   │   ├── (platform)/   # Authenticated routes (dashboard, courses, etc.)
│   │   │   │   └── admin/        # Admin panel
│   │   │   └── api/              # API routes (auth, lessons, achievements, etc.)
│   │   ├── src/components/     #   UI components (auth, editor, gamification, layout)
│   │   ├── src/lib/            #   Utilities (supabase, sanity, solana, analytics)
│   │   └── src/messages/       #   i18n translation files (en, pt-BR, es)
│   └── build-server/           # Rust/Axum build server (GCP Cloud Run)
├── onchain-academy/            # Anchor workspace (Solana program)
│   ├── programs/               #   On-chain program source (Rust)
│   └── tests/                  #   Integration + unit tests
├── packages/
│   ├── types/                  # Shared TypeScript interfaces
│   └── config/                 # Shared ESLint, TS, Tailwind configs
├── sanity/                     # Sanity Studio + schemas + seed data
├── supabase/                   # Database schema + migrations
├── scripts/                    # Helper scripts (init-program, update-program-id)
├── wallets/                    # Keypairs (gitignored)
└── docs/                       # Documentation
```

## Environment Variables

Copy `.env.example` to `apps/web/.env.local` and fill in values.

### Supabase (Required)

| Variable                        | Scope  | Description                                                         |
| ------------------------------- | ------ | ------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Client | Supabase project URL                                                |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client | Public anon key (safe for browser)                                  |
| `SUPABASE_SERVICE_ROLE_KEY`     | Server | Service role key for admin operations. **Never expose to browser.** |

### Sanity CMS (Required)

| Variable                        | Scope  | Description                                                  |
| ------------------------------- | ------ | ------------------------------------------------------------ |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Client | Project ID from [sanity.io/manage](https://sanity.io/manage) |
| `NEXT_PUBLIC_SANITY_DATASET`    | Client | Dataset name (usually `production`)                          |
| `SANITY_API_TOKEN`              | Server | Editor token for seed import script only                     |

### Solana (Required for on-chain features)

| Variable                      | Scope  | Description                                             |
| ----------------------------- | ------ | ------------------------------------------------------- |
| `NEXT_PUBLIC_SOLANA_RPC_URL`  | Client | RPC endpoint (default: `https://api.devnet.solana.com`) |
| `NEXT_PUBLIC_SOLANA_NETWORK`  | Client | Network name (`devnet`)                                 |
| `NEXT_PUBLIC_PROGRAM_ID`      | Client | Program ID from `anchor deploy`                         |
| `NEXT_PUBLIC_XP_MINT_ADDRESS` | Client | XP mint pubkey from `initialize` output                 |
| `NEXT_PUBLIC_BACKEND_SIGNER`  | Client | Authority pubkey (same as deployer on devnet)           |

### Admin / Signing (Required for admin panel and on-chain operations)

| Variable                   | Scope  | Description                                                                                |
| -------------------------- | ------ | ------------------------------------------------------------------------------------------ |
| `PROGRAM_AUTHORITY_SECRET` | Server | JSON array of authority keypair bytes (64 elements). The keypair that signed `initialize`. |
| `BACKEND_SIGNER_SECRET`    | Server | JSON array of backend signer keypair bytes. On devnet, same as `PROGRAM_AUTHORITY_SECRET`. |
| `ADMIN_SECRET`             | Server | Admin panel password (min 32 chars, random string)                                         |
| `SANITY_ADMIN_TOKEN`       | Server | Write-enabled Sanity API token for course sync in admin panel                              |

### Auth (Optional)

| Variable                       | Scope  | Description            |
| ------------------------------ | ------ | ---------------------- |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Client | Google OAuth client ID |

### Build Server (Optional -- for code compilation features)

| Variable                       | Scope  | Description                                                              |
| ------------------------------ | ------ | ------------------------------------------------------------------------ |
| `NEXT_PUBLIC_BUILD_SERVER_URL` | Client | Cloud Run service URL                                                    |
| `BUILD_SERVER_API_KEY`         | Server | API key for `X-API-Key` header (same as `SOLARIUM_API_KEY` on Cloud Run) |

### Analytics (Optional -- platform works without these)

| Variable                         | Scope  | Description                                                |
| -------------------------------- | ------ | ---------------------------------------------------------- |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | Client | Google Analytics 4 measurement ID                          |
| `NEXT_PUBLIC_POSTHOG_KEY`        | Client | PostHog project key                                        |
| `NEXT_PUBLIC_POSTHOG_HOST`       | Client | PostHog instance URL (default: `https://us.i.posthog.com`) |
| `SENTRY_DSN`                     | Server | Sentry error tracking DSN                                  |

### App URL

| Variable              | Scope  | Description                                                                        |
| --------------------- | ------ | ---------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL` | Client | Base URL for sitemap, OG tags, NFT metadata URI (default: `http://localhost:3000`) |

## Deployment

Solarium deploys as a Vercel-hosted Next.js app backed by Supabase (Postgres + Auth), Sanity CMS, and a Solana on-chain program.

- **[Production Deployment Guide](docs/DEPLOYMENT.md)** -- Full instructions for Vercel, Supabase, Sanity, Google OAuth, GCP Cloud Run (build server), analytics, custom domains, and post-deployment checklist.
- **[Program Deployment Guide](docs/DEPLOY-PROGRAM.md)** -- On-chain program build, deploy, and initialize workflow (keypair generation, Anchor build, devnet deploy, XP mint creation).

## On-Chain Program

**Program**: Solarium Academy (`onchain_academy`)
**Network**: Solana Devnet
**Program ID**: `GmLKszNTdCgYYkrspmi9sRFWj3ZiCamkc4YrppKJRUhh`

The program manages the full learning lifecycle on-chain:

- **16 instructions**: initialize, create/update/close course, enroll, complete lesson, finalize course, issue/upgrade credential, create achievement type, unlock achievement, register/revoke minter, update config, unenroll, and more
- **6 PDA account types**: Config, Course, Enrollment, MinterRole, AchievementType, AchievementRecord
- **XP minting**: Token-2022 soulbound tokens minted on lesson completion
- **Credential issuance**: Metaplex Core NFTs minted on course completion

For deployment instructions, see [docs/DEPLOY-PROGRAM.md](docs/DEPLOY-PROGRAM.md).
For system architecture, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Admin Panel

**URL**: `/{locale}/admin` (e.g., `/en/admin`)
**Auth**: Enter the `ADMIN_SECRET` environment variable value

The admin panel bridges Sanity CMS content with the on-chain program:

- **Deploy courses**: Creates the course on-chain, creates a Metaplex Core collection for the track, and syncs `onChainStatus` back to Sanity
- **Deploy achievements**: Creates achievement types on-chain with their Metaplex Core collections
- **View sync status**: See which courses and achievements are deployed on-chain

For details, see [docs/ADMIN.md](docs/ADMIN.md).

## Documentation

| Document                                     | Description                                           |
| -------------------------------------------- | ----------------------------------------------------- |
| [Architecture](docs/ARCHITECTURE.md)         | System design, account maps, data flows, CU budgets   |
| [CMS Guide](docs/CMS_GUIDE.md)               | Sanity schema, GROQ patterns, content workflow        |
| [Customization](docs/CUSTOMIZATION.md)       | Theming, i18n, gamification, and extending            |
| [Admin Guide](docs/ADMIN.md)                 | Admin panel usage and course/achievement deployment   |
| [Program Deployment](docs/DEPLOY-PROGRAM.md) | On-chain program build, deploy, and initialize        |
| [Developer Reference](CLAUDE.md)             | Full codebase conventions, security model, API routes |

## Known Limitations / Roadmap

The on-chain program is feature-complete with 16 instructions covering the full learning lifecycle. The following items are scoped for future iterations:

- **Track collection enforcement**: `track_collection` is validated server-side during credential issuance but is not yet enforced on-chain as an account constraint (future program upgrade).
- **Cross-course achievements**: Three achievement types (Anchor Expert, Full Stack Solana, Rust Rookie) have partial frontend logic but lack proper cross-course tracking infrastructure. `full-stack-solana` is hardcoded to `false`; `anchor-expert` and `rust-rookie` use lesson ID pattern matching instead of course-level completion checks.
- **Build server**: Compilation features (`buildable` Rust challenges + program deployment) require a separately deployed Rust/Axum build server on GCP Cloud Run. See the [Deployment](#deployment) section for setup details.

## Code Quality

- TypeScript strict mode with zero `any` types
- ESLint + Prettier enforced via Husky pre-commit hooks
- Conventional commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`
- All UI strings externalized via next-intl (never hardcoded)
- Server components by default, client components only when needed
- RLS enabled on all Supabase tables; sensitive functions restricted to `service_role`

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit using conventional commits: `git commit -m "feat: add quiz lesson type"`
4. Push and open a pull request

## License

MIT

## Acknowledgments

- [Superteam Brazil](https://superteam.fun) -- community and bounty program
- [Solana Foundation](https://solana.org) -- blockchain infrastructure
- Built with [Claude Code](https://claude.ai/claude-code) (Anthropic)
