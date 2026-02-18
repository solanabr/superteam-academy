# Architecture

Technical architecture documentation for Superteam Academy -- a production-ready learning management system for Solana developer education, built by Superteam Brazil.

**Production domain**: `solarium.courses`

## System Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│     Browser      │────▶│    Next.js 14     │────▶│    Supabase     │
│  (React + Solana │     │   (App Router)    │     │  (Postgres +    │
│   Wallet Adapter)│     │   on Vercel       │     │   Auth + RLS)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                              │       │
                    ┌─────────┘       └──────────┐
                    ▼                            ▼
              ┌───────────┐              ┌──────────────┐
              │  Sanity   │              │   Solana      │
              │  (CMS)    │              │  (Devnet)     │
              └───────────┘              │  Token-2022   │
                                         │  NFT Certs    │
                                         └──────────────┘
                    Next.js API Routes
                         │
               ┌─────────┴──────────┐
               ▼                    ▼
        ┌─────────────┐    ┌──────────────────────┐
        │ Rust         │    │ Build Server          │
        │ Playground   │    │ (Rust/Axum on         │
        │ (proxy)      │    │  GCP Cloud Run)       │
        └─────────────┘    └──────────────────────┘
```

- **Browser**: React client with Solana Wallet Adapter (Phantom, Solflare, Backpack)
- **Next.js**: Server-rendered pages, API routes, middleware for auth + i18n
- **Supabase**: Postgres database with Row Level Security, auth provider
- **Sanity**: Headless CMS for course content (read-only from the app)
- **Solana**: Token-2022 soulbound XP tokens + NFT certificate minting on Devnet
- **Build Server**: Rust/Axum service on GCP Cloud Run for compiling Solana programs
- **Rust Playground**: Proxied via `/api/rust/execute` for basic Rust code execution

## Tech Stack

| Layer        | Technology                                    | Purpose                                                     |
| ------------ | --------------------------------------------- | ----------------------------------------------------------- |
| Framework    | Next.js 14 (App Router)                       | Server/client rendering, API routes, TypeScript strict mode |
| Styling      | Tailwind CSS                                  | Utility-first styling with custom design tokens             |
| Components   | shadcn/ui + Radix UI                          | Accessible, composable UI primitives                        |
| CMS          | Sanity v3                                     | Headless CMS with GROQ queries and visual editor            |
| Backend/DB   | Supabase (Postgres)                           | RLS policies, auth helpers, SECURITY DEFINER functions      |
| Auth         | Solana Wallet Adapter + Google + GitHub OAuth | Phantom, Solflare, Backpack wallets + social login          |
| Code Editor  | Monaco Editor                                 | In-browser code editing with syntax highlighting            |
| NFT Certs    | Metaplex UMI                                  | On-chain certificate minting via Token Metadata standard    |
| XP Tokens    | Token-2022 (spl-token)                        | Soulbound XP tokens (NonTransferable + PermanentDelegate)   |
| Analytics    | GA4 + PostHog + Sentry                        | Event tracking, session replay, error monitoring            |
| i18n         | next-intl                                     | EN, PT-BR, ES with `[locale]` URL prefix                    |
| Monorepo     | Turborepo + pnpm                              | Build orchestration, workspace management                   |
| Build Server | Rust 1.85 / Axum                              | Solana program compilation (cargo-build-sbf)                |
| Deployment   | Vercel (web) + GCP Cloud Run (build server)   | Automatic deployments, edge middleware, CDN                 |

## Monorepo Structure

```
superteam-academy/
├── apps/
│   ├── web/                             # Next.js 14 application
│   │   ├── src/
│   │   │   ├── app/                     # App Router pages
│   │   │   │   ├── [locale]/            # i18n route group
│   │   │   │   │   ├── (marketing)/     # Public pages (landing)
│   │   │   │   │   └── (platform)/      # Authenticated pages
│   │   │   │   │       ├── dashboard/
│   │   │   │   │       ├── courses/[slug]/lessons/[id]/
│   │   │   │   │       ├── profile/
│   │   │   │   │       ├── leaderboard/
│   │   │   │   │       ├── certificates/ (list + [id])
│   │   │   │   │       └── settings/
│   │   │   │   ├── api/                 # 10 API routes
│   │   │   │   ├── error.tsx            # Global error (inline i18n)
│   │   │   │   ├── not-found.tsx        # Global 404 (inline i18n)
│   │   │   │   ├── sitemap.ts           # Dynamic sitemap
│   │   │   │   └── robots.ts            # robots.txt
│   │   │   ├── components/
│   │   │   │   ├── ui/                  # shadcn/ui base components
│   │   │   │   ├── course/              # Course cards, progress bars
│   │   │   │   ├── editor/              # Monaco editor + challenge runner
│   │   │   │   ├── gamification/        # XP, streaks, badges, leaderboard
│   │   │   │   ├── auth/                # Wallet + Google + GitHub auth
│   │   │   │   ├── certificates/        # NFT cert display + mint
│   │   │   │   ├── analytics/           # Analytics provider wrapper
│   │   │   │   └── layout/              # Header, footer, sidebar
│   │   │   ├── lib/
│   │   │   │   ├── analytics/           # GA4, PostHog, Sentry wrappers
│   │   │   │   ├── supabase/            # client.ts, server.ts, admin.ts, types.ts
│   │   │   │   ├── sanity/              # CMS client, queries, types
│   │   │   │   ├── solana/              # Wallet provider, auth, minting, xp-mint
│   │   │   │   ├── services/            # HybridProgressService (on-chain + Supabase)
│   │   │   │   ├── gamification/        # XP calc, achievements
│   │   │   │   └── i18n/                # next-intl config
│   │   │   ├── messages/                # Translation files (en, pt-BR, es)
│   │   │   └── styles/                  # Tailwind global styles
│   │   └── tailwind.config.ts
│   └── build-server/                    # Rust/Axum Solana program compiler
│       ├── src/
│       │   ├── main.rs                  # Axum server setup, middleware stack
│       │   ├── build.rs                 # BuildService: validation, compilation
│       │   ├── cache.rs                 # SHA-256 content-addressed build cache
│       │   ├── config.rs                # Env-based configuration
│       │   ├── cleanup.rs               # Background TTL cleanup task
│       │   ├── error.rs                 # AppError types
│       │   ├── metrics.rs               # Prometheus-style build metrics
│       │   ├── middlewares/             # auth (X-API-Key), logging, request_id
│       │   └── routes/                  # build, deploy, health, metrics
│       ├── programs/                    # Anchor template with pre-cached deps
│       └── Dockerfile                   # Multi-stage: Rust 1.85 + Agave 3.0.14
├── packages/
│   ├── types/                           # Shared TypeScript interfaces
│   └── config/                          # Shared ESLint, TS, Tailwind configs
├── scripts/
│   └── update-program-id.sh             # Patches program ID in lib.rs + Anchor.toml
├── sanity/                              # Sanity Studio + CMS schemas
│   ├── schemas/                         # course, module, lesson, instructor, learningPath, achievement
│   └── seed/                            # Seed data + import script
├── supabase/
│   └── schema.sql                       # Complete DB schema + RLS + functions
└── docs/                                # Documentation
```

## Data Flow

### Four Data Sources

| Source                | Data                                                           | Access Pattern                                                                                             |
| --------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Sanity CMS**        | Course content (titles, descriptions, lessons, challenges)     | Read-only. Fetched via GROQ queries in server components.                                                  |
| **Supabase Postgres** | User data (profiles, progress, XP, achievements, certificates) | Read/write. Client reads via anon key + RLS. Writes via API routes + service_role.                         |
| **Solana Blockchain** | Token-2022 XP balances + NFT certificates                      | XP: minted on lesson completion, burned on wallet unlink. Certs: minted on course completion. Devnet only. |
| **Build Server**      | Compiled Solana programs (.so binaries)                        | POST files to /build, GET binary from /deploy/{uuid}.                                                      |

### Content Delivery

```
Sanity CMS (content authoring)
       │
       ▼ GROQ queries via CDN
       │
Next.js Server Components ──────► HTML (SSR/SSG)
       │                               │
       ▼                               ▼
  Client Components ◄──────────── Hydration
       │
       ▼
  User Browser
```

### User Data

```
User Browser
       │
       ├──► Supabase Client (anon key + RLS) ──► SELECT own data
       │
       └──► API Routes (service_role) ──► SECURITY DEFINER functions
                                           ├── award_xp()
                                           └── unlock_achievement()
                                    ──► Token-2022 XP mint (server-side)
                                           ├── mintXpToWallet()
                                           └── burnXpFromWallet()
```

### Hybrid XP Read Path

```
Dashboard / Leaderboard / Profile
       │
       ▼
  HybridProgressService
       │
       ├──► Token-2022 ATA balance (on-chain via RPC)
       │    └── Falls back to Supabase if wallet not linked or RPC fails
       │
       ├──► Helius DAS API (alltime leaderboard)
       │    └── Falls back to Supabase get_leaderboard() RPC
       │
       └──► Supabase (weekly/monthly leaderboard, streaks, progress)
```

### Solana Program Build Flow

```
User writes Anchor/Solana code in Monaco Editor
       │
       ├──► /api/rust/execute (basic Rust) ──► Rust Playground proxy
       │
       └──► Build Server (Solana programs)
              │
              1. POST /build { files, uuid? }
              │   ├── Validate file paths (regex: /src/*.rs only)
              │   ├── Check blocked patterns (std::process, std::fs, std::net, etc.)
              │   ├── SHA-256 content hash → cache lookup
              │   ├── Semaphore-gated concurrency (default: 2 concurrent builds)
              │   ├── cargo-build-sbf --offline (uses pre-cached deps)
              │   └── Return { success, stderr, uuid }
              │
              2. GET /deploy/{uuid}
              │   └── Return compiled .so binary (application/octet-stream)
              │
              3. GET /health
              │   └── Cache stats, active builds, uptime
              │
              4. GET /metrics
                  └── Build counts, durations, cache hit rate
```

### Analytics Pipeline

```
User Interaction
       │
       ├──► GA4 (page views, events)
       ├──► PostHog (events, user identification, session recordings)
       └──► Sentry (errors, performance traces)
```

The analytics facade (`lib/analytics/index.ts`) dispatches events to all configured providers. Each provider gracefully degrades when its environment variables are missing.

## Authentication

### SIWS (Sign In With Solana)

```
1. User clicks "Connect Wallet"
       │
2. Wallet adapter shows selection modal (Phantom, Solflare, Backpack)
       │
3. Client requests nonce from GET /api/auth/nonce
   Server generates nonce, stores in siws_nonces table (Postgres),
   returns { nonce, domain, expiresAt }
       │
4. Client builds SIWS message with:
   - Domain (from server response)
   - Nonce (from server response)
   - Expiration time (5 minutes)
       │
5. Wallet prompts user to sign the message
       │
6. POST /api/auth/wallet with { message, signature, publicKey }
       │
7. Server validates:
   ├── Nonce exists in siws_nonces table with status='pending'
   ├── Nonce not expired (5-minute TTL)
   ├── Domain matches request Host header
   ├── Ed25519 signature valid (via tweetnacl)
   └── Marks nonce as 'consumed' in siws_nonces table
       │
8. Server creates/finds user in Supabase:
   - Creates auth.users entry with email: {pubkey}@wallet.superteam-lms.local
   - Database trigger auto-creates profile + user_xp rows
   - Generates magic link → verifies OTP → sets session cookies
   - Assigns a generated wallet name if profile has placeholder username
       │
9. Session cookie set → user redirected to dashboard
```

### Google OAuth

```
1. User clicks "Sign in with Google"
       │
2. Supabase redirects to Google OAuth consent screen
       │
3. Google redirects to /api/auth/callback with authorization code
       │
4. Server exchanges code for session (with redirect URL sanitization)
       │
5. Database trigger auto-creates profile + user_xp rows
       │
6. User redirected to dashboard
```

### GitHub OAuth

```
1. User clicks "Sign in with GitHub"
       │
2. Supabase redirects to GitHub OAuth consent screen
       │
3. GitHub redirects to /api/auth/callback with authorization code
       │
4. Server exchanges code for session (with redirect URL sanitization)
       │
5. Database trigger auto-creates profile + user_xp rows
       │
6. User redirected to dashboard
```

### Account Linking

Users can link additional auth methods after initial sign-up via the Settings page:

- **Link Wallet** (`POST /api/auth/link-wallet`): Verifies SIWS signature, updates `profiles.wallet_address`. On link, mints all existing Supabase XP to the wallet as Token-2022 tokens (one-time sync).
- **Unlink** (`POST /api/auth/unlink`): Removes an auth method (wallet, Google, or GitHub). At least one method must remain. When unlinking a wallet, burns all on-chain XP tokens via the PermanentDelegate authority to prevent double-spending. XP is re-minted to a new wallet on re-link.

## Security Model

### Row Level Security (RLS)

All 9 tables have RLS enabled:

| Table               | SELECT                   | INSERT        | UPDATE        | DELETE |
| ------------------- | ------------------------ | ------------- | ------------- | ------ |
| `profiles`          | Own + public             | Own           | Own           | -      |
| `enrollments`       | Own + public profiles    | Own           | -             | Own    |
| `user_progress`     | Own + public profiles    | Own           | Own           | -      |
| `user_xp`           | Own + all (leaderboard)  | Function only | Function only | -      |
| `xp_transactions`   | Own + all (leaderboard)  | Function only | -             | -      |
| `user_achievements` | Own + public profiles    | Function only | -             | -      |
| `certificates`      | Own + public profiles    | Own           | Own           | -      |
| `nft_metadata`      | All (public)             | Authenticated | -             | -      |
| `siws_nonces`       | None (service_role only) | None          | -             | -      |

### SECURITY DEFINER Functions

| Function                                      | Purpose                                    | Access                                    |
| --------------------------------------------- | ------------------------------------------ | ----------------------------------------- |
| `award_xp(user_id, amount, reason)`           | Award XP, update level, manage streaks     | `service_role` only                       |
| `unlock_achievement(user_id, achievement_id)` | Record achievement unlock                  | `service_role` only                       |
| `get_leaderboard(timeframe, limit)`           | Leaderboard query (alltime/weekly/monthly) | `SECURITY INVOKER` (authenticated + anon) |

`award_xp` and `unlock_achievement` are **REVOKE**d from `authenticated`, `anon`, and `public`. Called via `createAdminClient()` in API routes.

### Auth Security

- **Nonce replay protection**: Postgres `siws_nonces` table with 5-minute TTL. Nonce is marked as `consumed` after use. Background cleanup deletes expired pending (>5 min) and old consumed (>1 hour) nonces.
- **Per-IP rate limiting**: Max 10 pending nonces per IP address within the TTL window (`/api/auth/nonce`)
- **Domain validation**: SIWS message domain must match Host header
- **Message expiry**: Signed messages expire after 5 minutes
- **Redirect sanitization**: OAuth callback prevents open redirects
- **Body size limit**: Wallet auth and link-wallet routes reject requests > 10KB
- **Env var guards**: API routes fail-fast with 500 if required vars missing
- **Generic errors**: No stack traces or internal details in responses
- **Constant-time key comparison**: Build server uses `subtle::ConstantTimeEq` for API key validation

### Code Execution Sandbox

The challenge runner executes user code via `new Function()` in the browser:

- **Blocked patterns**: `eval`, `Function`, `document`, `window`, `fetch`, `XMLHttpRequest`, `import()`
- **Mock console**: Captures output without touching the real console
- **Mock Solana SDK**: Stub implementations of Keypair, PublicKey, Connection, Transaction, SystemProgram
- **No I/O**: No network, no DOM, no file system access

### Build Server Sandbox

The Solana program build server provides defense-in-depth:

- **File validation**: Only `/src/*.rs` paths allowed (regex-enforced), max 64 files, max 100KB per file, max 500KB total
- **Blocked patterns**: `std::process`, `std::fs`, `std::net`, `std::env`, `Command::new`, `include_bytes!`, `include_str!`, `env!()`, `proc_macro`
- **SBF target**: Programs compile to Solana BPF/SBF bytecode, which cannot access the host system
- **Concurrency limit**: Semaphore-gated (default: 2 concurrent builds)
- **Build timeout**: Configurable (default: 120 seconds)
- **Non-root execution**: Docker runs as `academy` user
- **CORS**: Exact origin match (`ALLOWED_ORIGIN` env var, default: `https://solarium.courses`)
- **API key auth**: `X-API-Key` header validated at Axum middleware level; `/health` and `/metrics` are exempt
- **Request body limit**: 512KB (tower-http `RequestBodyLimitLayer`)
- **Rate limiting**: Per-IP via tower-governor with `SmartIpKeyExtractor` (reads `X-Forwarded-For`/`X-Real-IP` from Cloud Run's Google Frontend proxy, falls back to peer IP). Build: 5 req/min, deploy: 20 req/min

## Build Server Architecture

The build server is a standalone Rust/Axum service deployed on **GCP Cloud Run** with `--no-invoker-iam-check` (GCP's IAM layer is disabled; authentication is handled at the application level via `X-API-Key` header). There is no API Gateway or Load Balancer in front of it.

**URL pattern**: `https://academy-build-server-HASH.a.run.app`

### Stack

- **Runtime**: Rust 1.85 (server binary) + Agave 3.0.14 (cargo-build-sbf, platform-tools v1.51 / rustc 1.84.1)
- **Framework**: Axum with tower middleware
- **Container**: Multi-stage Dockerfile (build stage compiles server, final stage installs Solana toolchain)
- **Pre-cached deps**: Template `programs/Cargo.toml` with Anchor 0.32.1 dependencies are pre-compiled during Docker build for `--offline` builds

### Middleware Stack

Axum applies layers in reverse declaration order. Request flow:

```
Request → CORS → Body Limit (512KB) → Compression → Request ID → Logging → API Key Auth → Handler
```

### Endpoints

| Route            | Method | Auth    | Rate Limit | Purpose                                     |
| ---------------- | ------ | ------- | ---------- | ------------------------------------------- |
| `/build`         | POST   | API key | 5 req/min  | Compile Solana program, return build result |
| `/deploy/{uuid}` | GET    | API key | 20 req/min | Download compiled .so binary                |
| `/health`        | GET    | None    | None       | Health check with cache/metrics stats       |
| `/metrics`       | GET    | None    | None       | Prometheus-style build metrics              |

### Build Pipeline

1. **Validate** files (paths, sizes, allowed patterns)
2. **Hash** file contents (SHA-256) for cache lookup
3. **Cache hit** → return cached result immediately
4. **Acquire** semaphore permit (max concurrent builds)
5. **Setup** build directory with template Cargo.toml + student source files
6. **Compile** via `cargo-build-sbf --offline` with configurable timeout
7. **Record** metrics (success/error/timeout counts, build duration)
8. **Cache** result for future identical submissions
9. **Cleanup** build directories via background TTL task

### Environment Variables (Build Server)

| Variable                | Required | Default                    | Purpose                       |
| ----------------------- | -------- | -------------------------- | ----------------------------- |
| `ACADEMY_API_KEY`       | Yes      | -                          | API key for X-API-Key auth    |
| `ALLOWED_ORIGIN`        | No       | `https://solarium.courses` | CORS allowed origin           |
| `PORT`                  | No       | `8080`                     | Listen port                   |
| `MAX_CONCURRENT_BUILDS` | No       | `2`                        | Semaphore permits             |
| `BUILD_TIMEOUT_SECS`    | No       | `120`                      | Per-build timeout             |
| `CACHE_TTL_SECS`        | No       | `1800`                     | Build cache TTL (30 min)      |
| `LOG_FORMAT`            | No       | `json`                     | `json` or `pretty`            |
| `PROGRAMS_DIR`          | No       | `programs`                 | Template Cargo.toml directory |
| `BUILDS_DIR`            | No       | `/tmp/academy-builds`      | Build output directory        |

## API Routes

| Route                              | Method | Auth     | Purpose                                            |
| ---------------------------------- | ------ | -------- | -------------------------------------------------- |
| `/api/auth/wallet`                 | POST   | None     | SIWS authentication                                |
| `/api/auth/callback`               | GET    | None     | Google OAuth callback                              |
| `/api/auth/link-wallet`            | POST   | Required | Link wallet to existing account                    |
| `/api/auth/nonce`                  | GET    | None     | Generate SIWS nonce                                |
| `/api/lessons/complete`            | POST   | Required | Mark lesson complete, award XP, check achievements |
| `/api/leaderboard`                 | GET    | None     | XP rankings                                        |
| `/api/credentials/issue`           | POST   | Required | Issue Metaplex Core credential NFT                 |
| `/api/certificates/metadata`       | GET    | None     | Serve NFT metadata JSON for Metaplex               |
| `/api/build-program`               | POST   | Required | Proxy Anchor build to build server                 |
| `/api/deploy`                      | POST   | Required | Program deployment orchestrator                    |
| `/api/enrollment/sync`             | POST   | Required | Sync on-chain enrollment to Supabase               |
| `/api/courses/[courseId]/finalize` | POST   | Required | Finalize course completion on-chain                |

## Database Schema

### Tables (9)

```
┌─────────────────┐       ┌──────────────┐       ┌───────────────┐
│    profiles      │       │  enrollments │       │ user_progress  │
├─────────────────┤       ├──────────────┤       ├───────────────┤
│ id (PK, FK)     │◄──┐   │ id (PK)      │       │ id (PK)       │
│ wallet_address   │   ├──│ user_id (FK) │   ┌──│ user_id (FK)  │
│ google_id        │   │   │ course_id    │   │   │ course_id     │
│ github_id        │   │   │ enrolled_at  │   │   │ lesson_id     │
│ username         │   │   └──────────────┘   │   │ completed     │
│ bio              │   │                       │   │ completed_at  │
│ avatar_url       │   │   ┌──────────────┐   │   └───────────────┘
│ social_links     │   ├──│   user_xp    │   │
│ is_public        │   │   ├──────────────┤   │   ┌─────────────────┐
│ name_rerolls_used│   │   │ id (PK)      │   │   │ xp_transactions  │
│ created_at       │   │   │ user_id (FK) │   │   ├─────────────────┤
└─────────────────┘   ├──│              │   ├──│ user_id (FK)    │
                       │   │ total_xp     │   │   │ amount          │
                       │   │ level        │   │   │ reason          │
                       │   │ current_streak│   │   │ created_at      │
                       │   │ longest_streak│   │   └─────────────────┘
                       │   │ last_activity │   │
                       │   └──────────────┘   │
                       │                       │   ┌──────────────────┐
                       ├──────────────────────┤   │ user_achievements │
                       │                       │   ├──────────────────┤
                       │                       ├──│ user_id (FK)     │
                       │                       │   │ achievement_id   │
                       │                       │   │ unlocked_at      │
                       │                       │   └──────────────────┘
                       │                       │
                       │                       │   ┌──────────────┐
                       └───────────────────────┤   │ certificates │
                                               │   ├──────────────┤
                                               └──│ user_id (FK) │
                                                   │ course_id    │
                                                   │ course_title │
                                                   │ mint_address │
                                                   │ metadata_uri │
                                                   │ minted_at    │
                                                   └──────────────┘

┌──────────────┐       ┌──────────────┐
│ nft_metadata  │       │ siws_nonces  │
├──────────────┤       ├──────────────┤
│ id (PK)      │       │ nonce (PK)   │
│ data (JSONB) │       │ status       │
│ created_at   │       │ wallet_addr  │
└──────────────┘       │ ip_address   │
                        │ created_at   │
                        │ consumed_at  │
                        └──────────────┘
```

### Auto-provisioning Trigger

When a new user signs up (via either auth method), the `on_auth_user_created` trigger fires `handle_new_user()`, which creates:

1. A `profiles` row with username `user_{first_8_chars_of_id}`
2. A `user_xp` row initialized to 0 XP, level 0

### Storage

- **avatars** bucket (public): Users can upload/update/delete their own avatar via `auth.uid()` folder path

## Gamification System

### XP Awards

| Action                 | XP Range | Enforced By                       |
| ---------------------- | -------- | --------------------------------- |
| Complete lesson        | 10-50    | `/api/lessons/complete` (max 100) |
| Complete challenge     | 25-100   | `/api/lessons/complete` (max 100) |
| Complete course        | 500      | `/api/courses/complete`           |
| Daily streak bonus     | 10       | `award_xp()` SQL function         |
| First daily completion | 25       | Application logic                 |

Difficulty multipliers (`lib/gamification/xp.ts`): beginner = 0 (min XP), intermediate = 0.5, advanced = 1 (max XP).

### XP Token-2022 Integration

XP is dual-written: Supabase is the source of truth, and Token-2022 soulbound tokens provide on-chain verifiability.

- **Mint on lesson completion**: `/api/lessons/complete` mints Token-2022 XP to the user's wallet (if connected) via `mintXpToWallet()`. Non-blocking -- failure does not affect the lesson completion flow.
- **Sync on wallet link**: `/api/auth/link-wallet` mints all existing Supabase XP to the newly linked wallet (one-time backfill).
- **Burn on wallet unlink**: `/api/auth/unlink` burns all on-chain XP via `PermanentDelegate` authority (no wallet owner signature needed). XP is re-minted on re-link.
- **Token properties**: NonTransferable (soulbound) + PermanentDelegate (platform can burn/adjust). 0 decimals (1 token = 1 XP).

### Leveling

```
Level = floor(sqrt(totalXP / 100))
```

| Level | Total XP Required |
| ----- | ----------------- |
| 1     | 100               |
| 2     | 400               |
| 3     | 900               |
| 5     | 2,500             |
| 10    | 10,000            |

### Streaks

Handled in the `award_xp()` SQL function:

- Yesterday → increment streak
- Today → no change
- Gap > 1 day → reset to 1
- `longest_streak` = `GREATEST(longest_streak, current_streak)`

### Achievements (15)

| Category  | Achievements                                                     | Trigger                     |
| --------- | ---------------------------------------------------------------- | --------------------------- |
| Progress  | First Steps, Course Completer, Speed Runner                      | Lesson/course completion    |
| Streaks   | Week Warrior (7d), Monthly Master (30d), Consistency King (100d) | Streak length               |
| Skills    | Rust Rookie, Anchor Expert, Full Stack Solana                    | Specific content completion |
| Community | Helper, First Comment, Top Contributor                           | Community engagement        |
| Special   | Early Adopter, Bug Hunter, Perfect Score                         | Special conditions          |

Checked after each lesson completion in `/api/lessons/complete`.

## NFT Certificate Pipeline

```
1. User completes all lessons in a course
       │
2. CourseCompletionMint component checks:
   ├── All lessons completed? (queries user_progress)
   └── Already minted? (queries certificates)
       │
3. User clicks "Mint Certificate"
       │
4. Client builds metadata JSON:
   ├── name, description, image
   └── attributes: [course, date, recipient, platform]
       │
5. Metadata stored in nft_metadata table, served via
   GET /api/certificates/metadata?id={uuid}
       │
6. Metaplex UMI createNft() mints Token Metadata NFT on Devnet
       │
7. mint_address + metadata_uri saved to certificates table
   Certificate viewable at /certificates/[id] with Explorer link
```

**Current limitations:**

- Devnet only (no real-world value)
- Metadata stored in Supabase `nft_metadata` table (not Arweave/IPFS)
- ~0.01 SOL per mint from user's wallet

## Internationalization (i18n)

| Code    | Language            |
| ------- | ------------------- |
| `en`    | English (default)   |
| `pt-BR` | Portuguese (Brazil) |
| `es`    | Spanish             |

### Architecture

1. **Middleware** (`middleware.ts`): Redirects to locale-prefixed URLs. Default: `en`.
2. **Route Groups**: All pages under `app/[locale]/`. `next-intl` loads the correct message bundle.
3. **Message Files**: `messages/{locale}.json`. Server: `getTranslations()`. Client: `useTranslations()`.
4. **Root pages**: `not-found.tsx` and `error.tsx` use inline translation objects (outside `[locale]` layout).
5. **Language switcher**: In header and settings page.

## Middleware

The middleware (`src/middleware.ts`) chains two concerns:

1. **Supabase auth**: Creates a Supabase server client, calls `getUser()` (may refresh tokens). Runs first so that token refresh cookies are forwarded to the intl response.
2. **next-intl**: Adds locale prefix to all routes (default: `en`).

**Auth-gated routes** (require login):

- `/dashboard`
- `/settings`
- `/profile` (exact -- own profile only; `/profile/[userId]` is public)

**Public routes** (no auth required):

- `/` (landing)
- `/courses` and `/courses/[slug]/lessons/[id]`
- `/leaderboard`
- `/certificates` and `/certificates/[id]`
- `/profile/[userId]` (viewing other users' public profiles)

The middleware matcher excludes API routes, `_next`, `_vercel`, and static assets.

## Component Architecture

### Server vs Client

| Type   | Used For                        | Examples                                      |
| ------ | ------------------------------- | --------------------------------------------- |
| Server | Data fetching, static rendering | Course detail, lesson page, leaderboard       |
| Client | Interactivity, browser APIs     | Auth modal, code editor, wallet, theme toggle |

### Layout Hierarchy

```
RootLayout (app/layout.tsx)
  ├── Skip-to-content link (locale-aware)
  ├── OG meta tags
  └── [locale] layout
       ├── ThemeProvider + SolanaWalletProvider
       └── (platform) layout
            ├── Header (auth, wallet, language, theme)
            ├── Sidebar (nav with aria-current)
            ├── <main id="main-content">
            └── Footer (social links)
```

### Code Editor Architecture

```
ChallengeInterface (orchestrator)
  ├── CodeEditor (Monaco, dynamic import, ssr: false)
  ├── ChallengeRunner (test execution, results)
  └── HintPanel (progressive hints)
```

## Hybrid On-Chain / Off-Chain Progress

The `LearningProgressService` interface (defined in `packages/types/src/progress.ts`) is implemented by `HybridProgressService` (`apps/web/src/lib/services/hybrid-progress-service.ts`), which reads from Solana first and falls back to Supabase:

- **XP**: Reads the user's Token-2022 ATA balance via `getAccount()` (soulbound XP token with NonTransferable + PermanentDelegate extensions). Falls back to `user_xp` table when the wallet or XP mint is not configured.
- **Leaderboard (alltime)**: Queries Helius DAS API `getTokenAccounts` for all holders of the XP mint, sorted by balance. Falls back to `get_leaderboard` Supabase RPC.
- **Leaderboard (weekly/monthly)**: Always Supabase -- Token-2022 balances have no time-windowed snapshots.
- **Progress, Streaks, Credentials**: Always Supabase.
- **Write path**: All writes (lesson completion, XP award, achievements) remain server-side via API routes using Supabase `SECURITY DEFINER` functions. On-chain XP minting happens via the platform's mint authority keypair in `lib/solana/xp-mint.ts`.

All consumer pages (dashboard, leaderboard, profile) access data through `getProgressService(supabase)` -- a factory that returns the `HybridProgressService` instance. Changing the data source does not require changing consuming code.

## Shared TypeScript Interfaces

Located in `packages/types/src/`. Key types:

- **`course.ts`**: `Course`, `Module`, `Lesson` (content + challenge variants), `Instructor`, `LearningPath`, `TestCase`, `Difficulty`
- **`user.ts`**: `UserProfile`, `Achievement`, `Certificate`
- **`progress.ts`**: `Progress`, `StreakData`, `LeaderboardEntry`, `XpTransaction`, `Credential`, `LearningProgressService`
- **`onchain.ts`**: `XPMintInfo`, `LearnerProfileAccount`, `EnrollmentAccount`, `PDA_SEEDS`, bitmap helpers (`setBit`, `checkBit`, `popcount`)

## Environment Variables

```bash
# ── Supabase ──────────────────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=              # Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=         # Public anon key (safe for browser)
SUPABASE_SERVICE_ROLE_KEY=             # PRIVATE — server-only, for admin operations

# ── Sanity CMS ────────────────────────────────────────────────────────────────
NEXT_PUBLIC_SANITY_PROJECT_ID=         # From sanity.io/manage
NEXT_PUBLIC_SANITY_DATASET=production

# ── Solana ────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=devnet

# On-chain program (see docs/DEPLOY-PROGRAM.md)
NEXT_PUBLIC_PROGRAM_ID=                # Program ID from deployment
NEXT_PUBLIC_XP_MINT_ADDRESS=           # XP mint pubkey (from initialize script output)
NEXT_PUBLIC_BACKEND_SIGNER=            # Authority pubkey (same as deployer on devnet)

# ── Auth ──────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_GOOGLE_CLIENT_ID=          # Google OAuth client ID

# ── Build Server (GCP Cloud Run) ─────────────────────────────────────────────
NEXT_PUBLIC_BUILD_SERVER_URL=          # Direct Cloud Run URL (IAM check disabled)
BUILD_SERVER_API_KEY=                  # PRIVATE — server-only, same as ACADEMY_API_KEY on Cloud Run

# ── Analytics (optional — platform works without these) ───────────────────────
NEXT_PUBLIC_GA4_MEASUREMENT_ID=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
SENTRY_DSN=

# ── App URL (for sitemap, OG tags, NFT metadata URI) ─────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`SANITY_API_TOKEN` is only needed for the seed import script (`sanity/seed/import.mjs`), not for the running app.

## Key Design Decisions

### Hybrid On-Chain / Off-Chain Progress

Supabase is the source of truth for all user data. Token-2022 XP tokens provide on-chain verifiability without blocking the user experience. The `HybridProgressService` reads from chain first and falls back to Supabase, making the transition transparent to consuming code.

### Sanity CMS over Markdown Files

Sanity provides a visual editor for non-technical content authors, supports structured content (test cases, hints, solutions), and enables real-time updates without redeployment.

### Multi-Auth Strategy

Three sign-in methods: **Solana Wallet** (SIWS with Ed25519 verification), **Google OAuth**, and **GitHub OAuth**. Wallet auth is natural for Web3 users; OAuth lowers the barrier for newcomers. All methods create the same Supabase user for a unified experience. Account linking (Settings page) allows users to connect additional methods after initial sign-up.

### Browser-Side Code Execution

Challenge code runs in the browser via `new Function()`. Server-side execution would require container infrastructure. The mock SDK provides sufficient fidelity for educational challenges, and security is enforced via pattern blocking and scope isolation.

### Server-Side Solana Program Compilation

The build server runs `cargo-build-sbf` in a Docker container with pre-cached dependencies for fast `--offline` builds. The SBF compilation target itself is a sandbox -- programs cannot access the host system. Additional defense-in-depth via file validation, blocked patterns, concurrency limits, and timeouts.

### Dark Mode First

The Solana brand colors (#9945FF, #14F195) contrast best against dark backgrounds. Developer tools are overwhelmingly used in dark mode.

### Turborepo Monorepo

Shared types (`packages/types/`) are consumed by the Next.js app and could support future packages (mobile app, CLI). Turborepo provides caching and parallel builds with minimal configuration.
