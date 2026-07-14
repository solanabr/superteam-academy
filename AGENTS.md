<!-- Satellite context file — extends the global hub (~/.claude/CLAUDE.md | ~/.pi/agent/AGENTS.md). Host-neutral; project-specific only. Do not duplicate hub standards here. -->

# Superteam Academy

> A decentralized learning platform on Solana. Learners enroll in courses, complete lessons to earn soulbound XP tokens, receive Metaplex Core credential NFTs, and collect achievements. Course creators earn XP rewards. Platform governed by a multisig authority.

**Org:** rz1989s (personal).

**Docs:**
- `docs/SPEC.md` — canonical program specification (source of truth)
- `docs/ARCHITECTURE.md` — account maps, data flows, CU budgets
- `docs/INTEGRATION.md` — frontend integration guide (PDA derivation, instruction usage, events)

## Monorepo Structure

```
superteam-academy/
├── docs/                  # SPEC, ARCHITECTURE, INTEGRATION
├── onchain-academy/       # Anchor workspace (programs/, tests/, Anchor.toml)
├── app/                   # Next.js 15 frontend (LIVE)
├── sdk/                   # TypeScript SDK (future)
├── wallets/               # keypairs (gitignored)
├── scripts/               # helper scripts
└── .claude/               # agents/, commands/, rules/, skills/, settings.json
```

## Technology Stack

| Layer | Stack |
|-------|-------|
| Programs | Anchor 0.31+, Rust 1.82+ |
| XP Tokens | Token-2022 (NonTransferable, PermanentDelegate) |
| Credentials | Metaplex Core NFTs (soulbound via PermanentFreezeDelegate) |
| Testing | Mollusk, LiteSVM, ts-mocha/Chai |
| Client | TypeScript, @coral-xyz/anchor, @solana/web3.js |
| Frontend | Next.js 15 (App Router), React 19, TypeScript (strict, zero `any`) |
| Styling | Tailwind CSS v4, shadcn/ui, OKLch design tokens |
| State | Zustand (course, user, enrollment) |
| i18n | next-intl — 627 keys × 4 locales (EN, PT-BR, ES, HI) |
| CMS | Sanity v3 with mock-client fallback for zero-config dev |
| Auth | NextAuth v5 beta (Google + GitHub, conditional on env vars) |
| Code Editor | Monaco |
| RPC | Helius DAS API (credential queries, XP leaderboard with 60s cache) |
| Content | Arweave/Irys (permanent course content, on-chain verification) |
| Multisig | Squads (platform authority) |

## Program Overview

16 instructions, 6 PDA types, 26 error variants, 15 events. See `docs/SPEC.md` and `docs/INTEGRATION.md`.

### Key Design Decisions

- **XP = soulbound Token-2022** — NonTransferable + PermanentDelegate (no transfer, no self-burn)
- **Credentials = Metaplex Core NFTs** — soulbound, wallet-visible, upgradeable attributes
- **No LearnerProfile PDA** — XP balance via Token-2022 ATA
- **`finalize_course` / `issue_credential` split** — XP awards independent of credential CPI
- **Rotatable backend signer** — stored in Config, rotatable via `update_config`
- **Reserved bytes** on all accounts for future-proofing

## Common Commands

```bash
# On-chain: build + test
anchor build && cargo fmt && cargo clippy -- -W clippy::all
cargo test --manifest-path onchain-academy/tests/rust/Cargo.toml
anchor test

# Frontend: build + test
cd app && pnpm tsc --noEmit && pnpm lint && pnpm test:run && pnpm build

# Deploy
/deploy          # on-chain: always devnet first
# frontend: push to main → Vercel auto-deploys
```

**Frontend tests:** `pnpm test:run` (364 Vitest unit) · `pnpm test:e2e` (36 Playwright E2E) · `pnpm tsc --noEmit` · `pnpm lint`.

**On-chain tests:** 62 TS integration (`onchain-academy/tests/onchain-academy.ts`) + 77 Rust unit (`tests/rust/`).

## Frontend Overview

**Production:** `https://superteam-academy.rectorspace.com` (Vercel, auto-deploys from `main`).

24 pages + 17 API routes across 4 route groups (Public, Platform, Admin, Onboarding) plus Legal/Info.

### Key Architecture Patterns

- **Mock-client pattern:** `lib/sanity/client.ts` checks `NEXT_PUBLIC_SANITY_PROJECT_ID` — uses real Sanity or `mock-client.ts` with seed data. Full app works with zero env vars.
- **Seed data:** 5 courses across 4 tracks in `lib/sanity/seed-data.ts`.
- **100 coding challenges:** `lib/challenges/` — 5 categories × 20 (solana-fundamentals, defi, nft-metaplex, security, token-extensions). Each has starter code, solution, 3 test cases, 3 hints, XP reward.
- **Conditional OAuth:** `lib/auth.ts` only registers providers when env vars exist; buttons auto-hidden when no creds.
- **Real on-chain leaderboard:** Helius DAS `getTokenAccounts` with 60s cache (`api/leaderboard/route.ts`).
- **i18n:** 627 keys × 4 locales in `messages/` — 30 namespaces.

### Frontend Env Vars

| Var | Required | Notes |
|-----|----------|-------|
| `SUPERTEAM_ACADEMY_HELIUS_API_KEY` | For leaderboard | Real on-chain data |
| `NEXT_PUBLIC_CLUSTER` | Yes | `devnet` |
| `NEXTAUTH_SECRET` | For auth | Session encryption |
| `NEXT_PUBLIC_SANITY_*` | No | Falls back to mock-client |
| `GOOGLE_CLIENT_ID` / `GITHUB_CLIENT_ID` | No | Buttons auto-hidden |

## Mandatory Workflow

**Every program change:** build (`anchor build`) → format (`cargo fmt`) → lint (`cargo clippy -- -W clippy::all`) → test (Rust + `anchor test`) → remove AI slop → deploy (devnet first, mainnet with explicit confirmation).

**Every frontend change:** type check (`pnpm tsc --noEmit`) → lint → test (`pnpm test:run`) → build → push (Vercel auto-deploys from `main`).

## Security Principles

**NEVER:** deploy to mainnet without explicit confirmation · unchecked arithmetic · skip account validation · `unwrap()` in program code · recalculate PDA bumps on every call.

**ALWAYS:** validate ALL accounts (owner, signer, PDA) · checked arithmetic · store canonical PDA bumps · reload accounts after CPIs if modified · validate CPI target program IDs · verify backend_signer matches Config.

## Code Quality: AI Slop Removal

Before completing any branch: `git diff main...HEAD`. Remove: obvious comments, defensive try/catch abnormal for codebase, verbose error messages, redundant validation, style inconsistencies. Keep: security checks, comments on non-obvious logic (bitmap math, Metaplex Core CPI), error handling matching existing patterns.

## Branch Workflow

```bash
git checkout -b <type>/<scope>-<description>-<DD-MM-YYYY>
# feat/enrollment-lessons-11-02-2026 · fix/cooldown-check-12-02-2026 · docs/integration-guide-17-02-2026
```

Use `/quick-commit` to automate branch creation + commits.

## On-Chain Constants

- **Program ID:** `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf`
- **XP Mint:** `xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3`
- **Cluster:** Devnet

## Pre-Mainnet Checklist

- [ ] All tests passing (unit + integration + fuzz 10+ min)
- [ ] Security audit completed
- [ ] Verifiable build (`anchor build --verifiable`)
- [ ] CU optimization verified (see ARCHITECTURE.md)
- [ ] Metaplex Core credential flow tested end-to-end
- [ ] Devnet testing successful (multiple days)
- [ ] AI slop removed from branch
- [ ] User explicit confirmation received

## .claude Tooling

6 agents (solana-architect, anchor-engineer, solana-qa-engineer, tech-docs-writer, solana-guide, solana-researcher) · 11 slash commands (`/quick-commit`, `/build-program`, `/test-rust`, `/test-ts`, `/deploy`, `/audit-solana`, `/setup-ci-cd`, `/write-docs`, `/explain-code`, `/plan-feature`) · skills in `.claude/skills/` · always-on rules in `.claude/rules/`.

## Vanity Keypairs

Keypairs in `wallets/` (gitignored). Grind: `solana-keygen grind --starts-with ACAD:1` (program) / `--starts-with XP:1` (XP mint). After replacing, run `./scripts/update-program-id.sh` then `anchor build && anchor deploy --provider.cluster devnet --program-keypair wallets/program-keypair.json`.