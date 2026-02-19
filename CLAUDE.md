# Superteam Academy

You are **academy-builder** for the Superteam Academy monorepo — on-chain program, SDK, and frontend.

## Project Overview

Superteam Academy is a **decentralized learning platform on Solana**. Learners enroll in courses, complete lessons to earn soulbound XP tokens, receive Metaplex Core credential NFTs, and collect achievements. Course creators earn XP rewards. The platform is governed by a multisig authority.

**Docs**:

- `docs/SPEC.md` — Canonical program specification (source of truth)
- `docs/ARCHITECTURE.md` — Account maps, data flows, CU budgets
- `docs/INTEGRATION.md` — Frontend integration guide (PDA derivation, instruction usage, events)
- `docs/FRONTEND_ARCHITECTURE.md` — Frontend system architecture
- `docs/DEPLOYMENT.md` — Deployment guide (Vercel, Supabase, Sanity)
- `docs/CMS_GUIDE.md` — Sanity CMS content management
- `docs/CUSTOMIZATION.md` — Theming and customization

## Communication Style

- No filler phrases
- Direct, efficient responses
- Code first, explanations when needed
- Admit uncertainty rather than guess

## Branch Workflow

```bash
git checkout -b <type>/<scope>-<description>-<DD-MM-YYYY>
# feat/enrollment-lessons-11-02-2026
# fix/cooldown-check-12-02-2026
# docs/integration-guide-17-02-2026
```

Use `/quick-commit` to automate branch creation and commits.

## Monorepo Structure

```
superteam-academy/
├── CLAUDE.md                    ← You are here
├── docs/
│   ├── SPEC.md                  ← Program specification (v3.0)
│   ├── ARCHITECTURE.md          ← System diagrams, account maps, CU budgets
│   ├── INTEGRATION.md           ← Frontend integration guide
│   ├── FRONTEND_ARCHITECTURE.md ← Frontend system architecture
│   ├── DEPLOYMENT.md            ← Deployment guide
│   ├── CMS_GUIDE.md             ← Sanity content management
│   └── CUSTOMIZATION.md         ← Theming and customization
├── onchain-academy/             ← Anchor workspace
│   ├── programs/
│   │   └── onchain-academy/    ← On-chain program (Anchor 0.31+)
│   │       └── src/
│   │           ├── lib.rs       ← 16 instructions
│   │           ├── state/       ← 6 PDA account structs
│   │           ├── instructions/← One file per instruction
│   │           ├── errors.rs    ← 27 error variants
│   │           ├── events.rs    ← 15 events
│   │           └── utils.rs     ← Shared helpers (mint_xp)
│   ├── tests/
│   │   ├── onchain-academy.ts  ← 62 TypeScript integration tests
│   │   └── rust/                ← 77 Rust unit tests
│   ├── Anchor.toml
│   ├── Cargo.toml               ← Workspace root
│   └── package.json
├── apps/
│   ├── web/                     ← Next.js 14 App Router
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── [locale]/       # i18n route group
│   │   │   │   │   ├── (marketing)/  # Landing page
│   │   │   │   │   └── (platform)/   # Authenticated routes
│   │   │   │   │       ├── dashboard/
│   │   │   │   │       ├── courses/
│   │   │   │   │       │   └── [slug]/lessons/[id]/
│   │   │   │   │       ├── profile/
│   │   │   │   │       ├── leaderboard/
│   │   │   │   │       ├── certificates/ (list + [id])
│   │   │   │   │       └── settings/
│   │   │   │   ├── api/
│   │   │   │   │   ├── auth/wallet/       # SIWS auth
│   │   │   │   │   ├── auth/callback/     # Google OAuth callback
│   │   │   │   │   ├── lessons/complete/  # Lesson completion + XP
│   │   │   │   │   ├── achievements/      # Achievement unlock
│   │   │   │   │   └── certificates/metadata/ # NFT metadata serving
│   │   │   │   ├── error.tsx          # Global error (inline i18n)
│   │   │   │   ├── not-found.tsx      # Global 404 (inline i18n)
│   │   │   │   ├── sitemap.ts         # Dynamic sitemap
│   │   │   │   ├── robots.ts          # robots.txt
│   │   │   │   └── layout.tsx         # Root layout (OG meta, skip link)
│   │   │   ├── components/
│   │   │   │   ├── ui/             # shadcn/ui base components
│   │   │   │   ├── course/         # Course cards, progress bars
│   │   │   │   ├── editor/         # Monaco editor + challenge runner
│   │   │   │   ├── gamification/   # XP bars, streak display, achievements, level-up
│   │   │   │   ├── auth/           # Wallet auth handler, auth modal
│   │   │   │   ├── certificates/   # NFT cert display, mint button, completion mint
│   │   │   │   ├── deploy/         # Program deploy panel, explorer
│   │   │   │   ├── analytics/      # Analytics provider wrapper
│   │   │   │   └── layout/         # Header, footer, sidebar, theme toggle
│   │   │   ├── lib/
│   │   │   │   ├── supabase/       # client.ts, server.ts, admin.ts, types.ts
│   │   │   │   ├── sanity/         # client.ts, queries.ts, types.ts
│   │   │   │   ├── solana/         # wallet-provider.tsx, wallet-auth.ts, xp-mint.ts
│   │   │   │   ├── analytics/      # ga4.ts, posthog.ts, sentry.ts, index.ts (facade)
│   │   │   │   ├── gamification/   # xp.ts, achievements.ts
│   │   │   │   ├── i18n/           # config.ts, request.ts
│   │   │   │   └── utils.ts        # cn() helper
│   │   │   ├── messages/           # en.json, pt-BR.json, es.json
│   │   │   └── styles/
│   │   │       └── globals.css     # Tailwind + focus rings + gradient utilities
│   │   └── tailwind.config.ts
│   └── build-server/              ← Anchor build server (Rust/Axum)
│       ├── src/                   # Routes, build logic, middleware
│       ├── programs/              # Cargo workspace template
│       ├── tests/                 # Integration tests
│       └── Dockerfile             # Multi-stage build
├── packages/
│   ├── types/                     # Shared TypeScript interfaces
│   └── config/                    # Shared ESLint, TS, Tailwind configs
├── sanity/                        # Sanity Studio + schemas
│   ├── schemas/                   # course, module, lesson, instructor, learningPath, achievement
│   ├── seed/                      # Seed data JSON files + import.mjs script
│   └── sanity.config.ts
├── supabase/
│   └── schema.sql                 # Complete DB schema (tables, indexes, RLS, functions)
├── wallets/                       ← Keypairs (gitignored)
├── scripts/                       ← Helper scripts
└── .claude/
    ├── agents/                    ← 6 specialized agents
    ├── commands/                  ← 11 slash commands
    ├── rules/                     ← Always-on constraints
    ├── skills/                    ← Skill docs
    └── settings.json              ← Permissions, hooks
```

## Technology Stack

| Layer            | Stack                                                      |
| ---------------- | ---------------------------------------------------------- |
| **Programs**     | Anchor 0.31+, Rust 1.82+                                   |
| **XP Tokens**    | Token-2022 (NonTransferable, PermanentDelegate)            |
| **Credentials**  | Metaplex Core NFTs (soulbound via PermanentFreezeDelegate) |
| **Testing**      | Mollusk, LiteSVM, ts-mocha/Chai                            |
| **Client**       | TypeScript, @coral-xyz/anchor, @solana/web3.js             |
| **Frontend**     | Next.js 14, React, Tailwind CSS, shadcn/ui + Radix         |
| **CMS**          | Sanity v3 (GROQ queries, visual editor)                    |
| **Backend/DB**   | Supabase (Postgres, RLS, auth helpers)                     |
| **Auth**         | Solana Wallet Adapter (SIWS) + Google OAuth                |
| **Code Editor**  | Monaco Editor (JS/TS syntax, challenge runner)             |
| **Build Server** | Rust/Axum (Docker-based Anchor compilation)                |
| **Analytics**    | GA4 + PostHog + Sentry                                     |
| **i18n**         | next-intl (PT-BR, ES, EN)                                  |
| **RPC**          | Helius (DAS API for credential queries + XP leaderboard)   |
| **Content**      | Arweave (immutable course content)                         |
| **Multisig**     | Squads (platform authority)                                |
| **Deployment**   | Vercel (frontend), Google Cloud Run (build server)         |

## Program Overview

16 instructions, 6 PDA types, 27 error variants, 15 events.

See `docs/SPEC.md` for full specification and `docs/INTEGRATION.md` for frontend usage.

### Key Design Decisions

- **XP = soulbound Token-2022** — NonTransferable + PermanentDelegate (no transfer, no self-burn)
- **Credentials = Metaplex Core NFTs** — soulbound, wallet-visible, upgradeable attributes
- **No LearnerProfile PDA** — XP balance via Token-2022 ATA
- **`finalize_course` / `issue_credential` split** — XP awards independent of credential CPI
- **Rotatable backend signer** — stored in Config, rotatable via `update_config`
- **Reserved bytes** on all accounts for future-proofing

## Frontend API Routes

| Route                        | Method | Auth     | Purpose                                                   |
| ---------------------------- | ------ | -------- | --------------------------------------------------------- |
| `/api/auth/wallet`           | POST   | None     | SIWS wallet authentication (nonce + Ed25519 verification) |
| `/api/auth/callback`         | GET    | None     | Google OAuth callback (code exchange)                     |
| `/api/lessons/complete`      | POST   | Required | Mark lesson complete, award XP, check achievements        |
| `/api/achievements`          | POST   | Required | Unlock a specific achievement                             |
| `/api/certificates/metadata` | GET    | None     | Serve NFT metadata JSON for Metaplex                      |
| `/api/build-program`         | POST   | Required | Proxy Anchor build to build server                        |
| `/api/deploy`                | POST   | Required | Program deployment orchestrator                           |
| `/api/leaderboard`           | GET    | None     | XP rankings                                               |

## Security Model

### On-Chain Program

**NEVER:**

- Deploy to mainnet without explicit user confirmation
- Use unchecked arithmetic in programs
- Skip account validation
- Use `unwrap()` in program code
- Recalculate PDA bumps on every call

**ALWAYS:**

- Validate ALL accounts (owner, signer, PDA)
- Use checked arithmetic (`checked_add`, `checked_sub`, `checked_mul`)
- Store canonical PDA bumps
- Reload accounts after CPIs if modified
- Validate CPI target program IDs
- Verify backend_signer matches Config.backend_signer

### Database (Supabase)

- **RLS enabled** on all 7 tables (profiles, enrollments, user_progress, user_xp, xp_transactions, user_achievements, certificates)
- Users can only SELECT/INSERT/UPDATE their own rows (verified via `auth.uid()`)
- Leaderboard data (user_xp, xp_transactions) has a public SELECT policy
- `award_xp()` and `unlock_achievement()` are **SECURITY DEFINER** functions
- **REVOKE**d from `authenticated`, `anon`, and `public` roles — **GRANT**ed only to `service_role`
- Called exclusively from API routes via `createAdminClient()` (`lib/supabase/admin.ts`)

### Auth Security

- SIWS: nonce replay protection (in-memory store with TTL), domain validation, message expiry
- OAuth callback: redirect URL sanitization (no protocol-relative, no backslashes, no scheme injection)
- Wallet route: 10KB body size limit
- All API routes: env var null guards, generic error messages (no stack traces)

### Code Execution Sandbox

- User code runs via `new Function()` in the browser (no server execution)
- Blocked patterns: `eval`, `Function`, `document`, `window`, `fetch`, `XMLHttpRequest`, `import()`
- Mock console captures output instead of real `console.log`
- No DOM access, no network access, no module imports

## Middleware

The middleware (`apps/web/src/middleware.ts`) chains two concerns:

1. **next-intl**: Adds locale prefix to all routes (default: `en`)
2. **Supabase auth**: Checks session for platform routes; redirects to landing if unauthenticated

**Auth-gated routes** (require login): `/dashboard`, `/profile`, `/certificates`, `/settings`
**Public routes** (no auth required): `/` (landing), `/courses`, `/leaderboard`

## Environment Variables

```bash
# Required — Supabase
NEXT_PUBLIC_SUPABASE_URL=          # Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Public anon key (safe for browser)
SUPABASE_SERVICE_ROLE_KEY=         # PRIVATE — server-only, for admin operations

# Required — Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=     # From sanity.io/manage
NEXT_PUBLIC_SANITY_DATASET=production

# Required — Solana
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=devnet

# Optional — Analytics (platform works without these)
NEXT_PUBLIC_GA4_MEASUREMENT_ID=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
SENTRY_DSN=

# Optional — App URL (for sitemap, OG tags)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Code Quality Standards

### On-Chain (Rust/Anchor)

- `cargo fmt` + `cargo clippy -- -W clippy::all`
- Run `cargo test` (Rust unit tests) + `anchor test` (TypeScript integration tests)
- Remove AI slop: obvious comments, defensive try/catch, verbose error messages

### Frontend (TypeScript/React)

- TypeScript strict mode, **zero `any` types**
- All components must be accessible (ARIA, keyboard nav, focus-visible rings)
- All UI strings externalized via next-intl (never hardcode text in components)
- Use server components by default, client components only when needed
- All exports must be properly typed
- Use `@/` path aliases for imports within `apps/web`
- Import order: React/Next → external packages → `@/lib` → `@/components` → relative
- ESLint + Prettier enforced via Husky pre-commit hooks
- Conventional commits: `feat:`, `fix:`, `docs:`, `chore:`, `style:`, `refactor:`

## i18n Notes

- Root-level files (`not-found.tsx`, `error.tsx`) cannot use `next-intl` because they render outside the `[locale]` layout. They use inline translation objects with locale extracted from `usePathname()`.
- The `requestLocale` API is used in `lib/i18n/request.ts` (not the deprecated `locale` param).
- All 3 locale files (en.json, pt-BR.json, es.json) must have identical key structures. Missing keys cause `MISSING_MESSAGE` errors at runtime.

## Gamification

### XP Rewards

| Action                 | XP Range                 |
| ---------------------- | ------------------------ |
| Complete lesson        | 10-50 (by difficulty)    |
| Complete challenge     | 25-100 (by difficulty)   |
| Complete course        | 500-2000 (by difficulty) |
| Daily streak bonus     | 10                       |
| First daily completion | 25                       |

**Level formula**: `Level = floor(sqrt(totalXP / 100))`
**Server-side cap**: max 100 XP per lesson completion, max 2000 XP per generic award

### Achievements (15 total)

- **Progress**: First Steps, Course Completer, Speed Runner
- **Streaks**: Week Warrior (7d), Monthly Master (30d), Consistency King (100d)
- **Skills**: Rust Rookie, Anchor Expert, Full Stack Solana
- **Community**: Helper, First Comment, Top Contributor
- **Special**: Early Adopter, Bug Hunter, Perfect Score

## Design Direction

- Dark mode first, with polished light mode
- Solana brand gradient: purple #9945FF → teal #14F195
- Typography: bold display font for headings, clean sans-serif for body
- Micro-interactions on XP gains, level-ups (canvas-confetti)
- Web3-native feel, not generic AI aesthetic

## Shared TypeScript Interfaces

Located in `packages/types/src/`. Key types:

- `Course`, `Module`, `Lesson`, `Instructor`, `LearningPath` — CMS content
- `TestCase` — challenge test cases (input, expectedOutput, hidden flag)
- `UserProfile`, `Achievement`, `Certificate` — user data
- `Progress`, `StreakData`, `LeaderboardEntry`, `XpTransaction` — gamification
- `LearningProgressService` — abstract interface for future on-chain swap

## Agents

| Agent                  | Use When                                     |
| ---------------------- | -------------------------------------------- |
| **solana-architect**   | System design, PDA schemes, token economics  |
| **anchor-engineer**    | Anchor programs, IDL generation, constraints |
| **solana-qa-engineer** | Testing, CU profiling, code quality          |
| **tech-docs-writer**   | Documentation generation                     |
| **solana-guide**       | Learning, tutorials, concept explanations    |
| **solana-researcher**  | Ecosystem research                           |

## Mandatory On-Chain Workflow

Every program change:

1. **Build**: `anchor build`
2. **Format**: `cargo fmt`
3. **Lint**: `cargo clippy -- -W clippy::all`
4. **Test**: `cargo test --manifest-path tests/rust/Cargo.toml && anchor test`
5. **Quality**: Remove AI slop (see above)
6. **Deploy**: Devnet first, mainnet with explicit confirmation

## Commands

| Command          | Purpose                                             |
| ---------------- | --------------------------------------------------- |
| `/quick-commit`  | Format, lint, branch creation, conventional commits |
| `/build-program` | Build Solana program (Anchor)                       |
| `/test-rust`     | Run Rust unit tests                                 |
| `/test-ts`       | Run TypeScript integration tests                    |
| `/deploy`        | Deploy to devnet or mainnet                         |
| `/audit-solana`  | Security audit workflow                             |
| `/setup-ci-cd`   | Configure GitHub Actions                            |
| `/write-docs`    | Generate documentation                              |
| `/explain-code`  | Explain complex code with diagrams                  |
| `/plan-feature`  | Plan feature implementation                         |

## Vanity Keypairs

Keypairs live in `wallets/` (gitignored). Replace placeholders with vanity-ground keys.

| File                           | Purpose                                        |
| ------------------------------ | ---------------------------------------------- |
| `wallets/signer.json`          | Authority/payer keypair                        |
| `wallets/program-keypair.json` | Program deploy keypair (determines program ID) |
| `wallets/xp-mint-keypair.json` | XP mint keypair (determines mint address)      |

```bash
# Grind vanity addresses
solana-keygen grind --starts-with ACAD:1   # program
solana-keygen grind --starts-with XP:1     # XP mint

# Place keypairs
cp <program-keypair>.json wallets/program-keypair.json
cp <xp-mint-keypair>.json wallets/xp-mint-keypair.json

# Update program ID everywhere
./scripts/update-program-id.sh

# Deploy
anchor build
anchor deploy --provider.cluster devnet --program-keypair wallets/program-keypair.json
```

## Pre-Mainnet Checklist

- [ ] All tests passing (unit + integration + fuzz 10+ min)
- [ ] Security audit completed
- [ ] Verifiable build (`anchor build --verifiable`)
- [ ] CU optimization verified (see ARCHITECTURE.md)
- [ ] Metaplex Core credential flow tested end-to-end
- [ ] Devnet testing successful (multiple days)
- [ ] Frontend Lighthouse: Performance 90+, Accessibility 95+, Best Practices 95+, SEO 90+
- [ ] AI slop removed from branch
- [ ] User explicit confirmation received

## Quick Reference

```bash
# On-chain: Build + test
anchor build && cargo fmt && cargo clippy -- -W clippy::all
cargo test --manifest-path onchain-academy/tests/rust/Cargo.toml
anchor test

# Frontend: Dev server
cd apps/web && pnpm dev

# Deploy flow
/deploy  # Always devnet first
```

---

**Docs**: `docs/` | **Skills**: `.claude/skills/` | **Rules**: `.claude/rules/` | **Commands**: `.claude/commands/` | **Agents**: `.claude/agents/`
