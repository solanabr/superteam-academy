# Superteam Academy

You are **academy-builder** for the Superteam Academy monorepo — on-chain program, SDK, and frontend.

## Project Overview

Superteam Academy is a **decentralized learning platform on Solana**. Learners enroll in courses, complete lessons to earn soulbound XP tokens, receive Metaplex Core credential NFTs, and collect achievements. Course creators earn XP rewards. The platform is governed by a multisig authority.

**Docs**:

- `docs/ARCHITECTURE.md` — System architecture, component structure, data flows, service interfaces
- `docs/DEPLOYMENT.md` — Deployment guide (Vercel, Supabase, GCP)
- `docs/CUSTOMIZATION.md` — Theming, i18n, and extensibility
- `docs/ADMIN.md` — Admin panel guide for content-to-on-chain sync
- `docs/DEPLOY-PROGRAM.md` — Devnet program deployment guide

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
├── docs/                  ← Architecture, deployment, admin guides
├── onchain-academy/       ← Anchor workspace (programs/, tests/rust/, tests/*.ts)
├── apps/
│   ├── web/               ← Next.js 14 App Router (see apps/web/CLAUDE.md)
│   └── build-server/      ← Anchor build server (Rust/Axum, Dockerized)
├── packages/
│   ├── types/             ← Shared TypeScript interfaces (see packages/types/CLAUDE.md)
│   └── config/            ← Shared ESLint, TS, Tailwind configs
├── supabase/schema.sql    ← 19 tables, indexes, RLS, functions, views
├── wallets/               ← Keypairs (gitignored)
├── scripts/               ← Helper scripts
└── .claude/               ← agents/, commands/, rules/, skills/, settings.json
```

Full annotated tree: `structure.md` in the `superteam-academy-dev` skill.

## Technology Stack

| Layer            | Stack                                                                        |
| ---------------- | ---------------------------------------------------------------------------- |
| **Programs**     | Anchor 0.31+, Rust 1.82+                                                     |
| **XP Tokens**    | Token-2022 (NonTransferable, PermanentDelegate)                              |
| **Credentials**  | Metaplex Core NFTs (soulbound via PermanentFreezeDelegate)                   |
| **Testing**      | Mollusk, LiteSVM, ts-mocha/Chai                                              |
| **Client**       | TypeScript, @coral-xyz/anchor, @solana/web3.js                               |
| **Frontend**     | Next.js 14, React, Tailwind CSS, shadcn/ui + Radix                           |
| **Content**      | Committed bundle compiled from `solanabr/courses-academy` (content.lock pin) |
| **Backend/DB**   | Supabase (Postgres, RLS, auth helpers)                                       |
| **Auth**         | Solana Wallet Adapter (SIWS) + Google OAuth                                  |
| **Code Editor**  | Monaco Editor (JS/TS syntax, challenge runner)                               |
| **Build Server** | Rust/Axum (Docker-based Anchor compilation)                                  |
| **Analytics**    | GA4 + PostHog + Sentry                                                       |
| **i18n**         | next-intl (PT-BR, ES, EN)                                                    |
| **RPC**          | Helius (DAS API for credential queries + XP leaderboard)                     |
| **Storage**      | Arweave via Irys (permanent credential metadata)                             |
| **Multisig**     | Squads (platform authority)                                                  |
| **Deployment**   | Vercel (frontend), Google Cloud Run (build server)                           |

## Program Overview

18 instructions, 6 PDA types, 35 error variants, 18 events.

See `docs/ARCHITECTURE.md` for the program specification and frontend integration details (the on-chain program source is under `onchain-academy/programs/`).

### Key Design Decisions

- **XP = soulbound Token-2022** — NonTransferable + PermanentDelegate (no transfer, no self-burn)
- **Credentials = Metaplex Core NFTs** — soulbound, wallet-visible, upgradeable attributes
- **No LearnerProfile PDA** — XP balance via Token-2022 ATA
- **`finalize_course` / `issue_credential` split** — XP awards independent of credential CPI
- **Rotatable backend signer** — stored in Config, rotatable via `update_config`
- **Reserved bytes** on all accounts for future-proofing

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

- **RLS enabled** on all 19 tables
- **Core tables** (10): profiles, enrollments, user_progress, user_xp, xp_transactions, user_achievements, certificates, nft_metadata, siws_nonces, deployed_programs
- **Community tables** (6): forum_categories, threads, answers, votes, flags, thread_views
- **Queue/quest/infra tables** (3): pending_onchain_actions, user_daily_quests, rate_limits
- **Views**: `community_stats` (per-user thread/answer/accepted counts) and `public_user_xp` (non-sensitive user_id/total_xp/level for public profiles)
- Users can only SELECT/INSERT/UPDATE their own rows (verified via `auth.uid()`)
- Leaderboard data is served via the `get_leaderboard()` SECURITY DEFINER function + `public_user_xp` view; `user_xp`/`xp_transactions` are own-row SELECT only (no broad public policy)
- Community data (forum_categories, threads, answers, votes) has public SELECT policies
- `award_xp()`, `unlock_achievement()`, and `get_daily_quest_state()` are **SECURITY DEFINER** functions
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

## Design Direction

- Dark mode first, with polished light mode
- Solana brand gradient: purple #9945FF → teal #14F195
- Typography: bold display font for headings, clean sans-serif for body
- Micro-interactions on XP gains, level-ups (canvas-confetti)
- Web3-native feel, not generic AI aesthetic

## Where Things Live

| Topic                                                                                  | File (loads on demand)           |
| -------------------------------------------------------------------------------------- | -------------------------------- |
| Frontend middleware, i18n, gamification, env vars                                      | `apps/web/CLAUDE.md`             |
| The 34 API routes                                                                      | `apps/web/src/app/api/CLAUDE.md` |
| Shared TypeScript interfaces                                                           | `packages/types/CLAUDE.md`       |
| Anchor patterns, testing, security, deployment, vanity keypairs, pre-mainnet checklist | `superteam-academy-dev` skill    |

---

**Docs**: `docs/` | **Skills**: `.claude/skills/` | **Rules**: `.claude/rules/` | **Commands**: `.claude/commands/` | **Agents**: `.claude/agents/`
