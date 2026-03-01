# Superteam Academy

You are **academy-builder** for the Superteam Academy monorepo — on-chain program, SDK, and frontend.

## Project Overview

Superteam Academy is a **decentralized learning platform on Solana**. Learners enroll in courses, complete lessons to earn soulbound XP tokens, receive Metaplex Core credential NFTs, and collect achievements. Course creators earn XP rewards. The platform is governed by a multisig authority.

**Docs**:
- `docs/SPEC.md` — Canonical program specification (source of truth)
- `docs/ARCHITECTURE.md` — Account maps, data flows, CU budgets
- `docs/INTEGRATION.md` — Frontend integration guide (PDA derivation, instruction usage, events)

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
│   └── INTEGRATION.md           ← Frontend integration guide
├── onchain-academy/             ← Anchor workspace
│   ├── programs/
│   │   └── onchain-academy/    ← On-chain program (Anchor 0.31+)
│   │       └── src/
│   │           ├── lib.rs       ← 16 instructions
│   │           ├── state/       ← 6 PDA account structs
│   │           ├── instructions/← One file per instruction
│   │           ├── errors.rs    ← 26 error variants
│   │           ├── events.rs    ← 15 events
│   │           └── utils.rs     ← Shared helpers (mint_xp)
│   ├── tests/
│   │   ├── onchain-academy.ts  ← 62 TypeScript integration tests
│   │   └── rust/                ← 77 Rust unit tests
│   ├── Anchor.toml
│   ├── Cargo.toml               ← Workspace root
│   └── package.json
├── app/                         ← Next.js 15 frontend (LIVE)
│   ├── src/
│   │   ├── app/[locale]/        ← 24 pages across 4 route groups + 17 API routes
│   │   ├── components/          ← 141 components (landing, courses, layout, ui, admin)
│   │   ├── lib/
│   │   │   ├── sanity/          ← CMS client + mock-client + seed data
│   │   │   ├── stores/          ← Zustand (course-store, user-store)
│   │   │   ├── hooks/           ← 10 custom hooks (use-course, use-mobile, etc.)
│   │   │   ├── challenges/      ← 100 coding challenges (5 categories x 20)
│   │   │   └── solana/          ← Constants, Helius DAS integration
│   │   ├── i18n/                ← Routing + request config
│   │   └── messages/            ← EN, PT, ES, HI translations (627 keys each)
│   ├── public/images/courses/   ← 5 custom SVG course thumbnails
│   └── e2e/                     ← 36 Playwright E2E tests
├── sdk/                         ← TypeScript SDK (future)
├── wallets/                     ← Keypairs (gitignored)
├── scripts/                     ← Helper scripts
└── .claude/
    ├── agents/                  ← 6 specialized agents
    ├── commands/                ← 11 slash commands
    ├── rules/                   ← Always-on constraints
    ├── skills/                  ← Skill docs
    └── settings.json            ← Permissions, hooks
```

## Technology Stack

| Layer | Stack |
|-------|-------|
| **Programs** | Anchor 0.31+, Rust 1.82+ |
| **XP Tokens** | Token-2022 (NonTransferable, PermanentDelegate) |
| **Credentials** | Metaplex Core NFTs (soulbound via PermanentFreezeDelegate) |
| **Testing** | Mollusk, LiteSVM, ts-mocha/Chai |
| **Client** | TypeScript, @coral-xyz/anchor, @solana/web3.js |
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript (strict, zero `any`) |
| **Styling** | Tailwind CSS v4, shadcn/ui, OKLch design tokens |
| **State** | Zustand stores (course, user, enrollment) |
| **i18n** | next-intl — 627 keys x 4 locales (EN, PT-BR, ES, HI) |
| **CMS** | Sanity v3 with mock-client fallback for zero-config dev |
| **Auth** | NextAuth v5 beta (Google + GitHub, conditional on env vars) |
| **Code Editor** | Monaco — Rust, TypeScript, JavaScript, Python, Solidity, JSON |
| **RPC** | Helius DAS API (credential queries, XP leaderboard with 60s cache) |
| **Content** | Arweave/Irys (permanent course content with on-chain verification) |
| **Multisig** | Squads (platform authority) |

## Program Overview

16 instructions, 6 PDA types, 26 error variants, 15 events.

See `docs/SPEC.md` for full specification and `docs/INTEGRATION.md` for frontend usage.

### Key Design Decisions

- **XP = soulbound Token-2022** — NonTransferable + PermanentDelegate (no transfer, no self-burn)
- **Credentials = Metaplex Core NFTs** — soulbound, wallet-visible, upgradeable attributes
- **No LearnerProfile PDA** — XP balance via Token-2022 ATA
- **`finalize_course` / `issue_credential` split** — XP awards independent of credential CPI
- **Rotatable backend signer** — stored in Config, rotatable via `update_config`
- **Reserved bytes** on all accounts for future-proofing

## Frontend Overview

**Production**: `https://superteam-academy.rectorspace.com` (Vercel, auto-deploys from `main`)

### Pages (24 pages + 17 API routes)

| Group | Pages |
|-------|-------|
| **Public** | Landing (`/`), Sign-in |
| **Platform** | Course Catalog, Course Detail, Lesson Viewer, Dashboard, Profile, Leaderboard, Settings, Credentials, Community Forum, Daily Challenges |
| **Admin** | Admin Panel (Overview, Courses, Users, Achievements, Analytics, Config) |
| **Onboarding** | 5-step wizard |
| **Legal/Info** | Terms, Privacy, Contact, Docs |

### Key Architecture Patterns

- **Mock-client pattern**: `lib/sanity/client.ts` checks `NEXT_PUBLIC_SANITY_PROJECT_ID` — uses real Sanity or `mock-client.ts` with seed data. Full app works with zero env vars.
- **Seed data**: 5 courses across 4 tracks in `lib/sanity/seed-data.ts` (solana-101, defi-201, nft-201, sec-301, token-201)
- **100 coding challenges**: `lib/challenges/` — 5 categories (solana-fundamentals, defi, nft-metaplex, security, token-extensions) x 20 each. Each has starter code, solution, 3 test cases, 3 hints, XP reward.
- **Conditional OAuth**: `lib/auth.ts` only registers providers when env vars exist; buttons auto-hidden when no creds
- **Real on-chain leaderboard**: Helius DAS `getTokenAccounts` with 60s cache (`api/leaderboard/route.ts`)
- **i18n**: 627 keys x 4 locales (EN, PT-BR, ES, HI) in `messages/` — 30 namespaces covering every surface

### Frontend Testing

```bash
cd app
pnpm test:run          # 364 Vitest unit tests
pnpm test:e2e          # 36 Playwright E2E tests
pnpm tsc --noEmit      # TypeScript strict check
pnpm lint              # ESLint
```

### Frontend Env Vars

| Var | Required | Notes |
|-----|----------|-------|
| `HELIUS_RPC_URL` | For leaderboard | Real on-chain data |
| `NEXT_PUBLIC_CLUSTER` | Yes | `devnet` |
| `NEXTAUTH_SECRET` | For auth | Session encryption |
| `NEXT_PUBLIC_SANITY_*` | No | Falls back to mock-client |
| `GOOGLE_CLIENT_ID` / `GITHUB_CLIENT_ID` | No | Buttons auto-hidden |

## Agents

| Agent | Use When |
|-------|----------|
| **solana-architect** | System design, PDA schemes, token economics |
| **anchor-engineer** | Anchor programs, IDL generation, constraints |
| **solana-qa-engineer** | Testing, CU profiling, code quality |
| **tech-docs-writer** | Documentation generation |
| **solana-guide** | Learning, tutorials, concept explanations |
| **solana-researcher** | Ecosystem research |

## Mandatory Workflow

Every program change:
1. **Build**: `anchor build`
2. **Format**: `cargo fmt`
3. **Lint**: `cargo clippy -- -W clippy::all`
4. **Test**: `cargo test --manifest-path tests/rust/Cargo.toml && anchor test`
5. **Quality**: Remove AI slop (see below)
6. **Deploy**: Devnet first, mainnet with explicit confirmation

## Mandatory Workflow (Frontend)

Every frontend change:
1. **Type check**: `cd app && pnpm tsc --noEmit`
2. **Lint**: `pnpm lint`
3. **Test**: `pnpm test:run`
4. **Build**: `pnpm build`
5. **Push**: Auto-deploys to Vercel from `main`

## Security Principles

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

## Code Quality: AI Slop Removal

Before completing any branch:

```bash
git diff main...HEAD
```

**Remove:** Obvious comments, defensive try/catch abnormal for codebase, verbose error messages, redundant validation, style inconsistencies.

**Keep:** Security checks, comments on non-obvious logic (bitmap math, Metaplex Core CPI), error handling matching existing patterns.

## Skill System

Entry point: `.claude/skills/SKILL.md`

| Category | Files |
|----------|-------|
| **Programs** | programs-anchor.md |
| **Testing** | testing.md |
| **Security** | security.md |
| **Deployment** | deployment.md |
| **Ecosystem** | ecosystem.md, resources.md |
| **IDL** | idl-codegen.md |

Rules (always-on): `.claude/rules/anchor.md`, `.claude/rules/typescript.md`

## Commands

| Command | Purpose |
|---------|---------|
| `/quick-commit` | Format, lint, branch creation, conventional commits |
| `/build-program` | Build Solana program (Anchor) |
| `/test-rust` | Run Rust unit tests |
| `/test-ts` | Run TypeScript integration tests |
| `/deploy` | Deploy to devnet or mainnet |
| `/audit-solana` | Security audit workflow |
| `/setup-ci-cd` | Configure GitHub Actions |
| `/write-docs` | Generate documentation |
| `/explain-code` | Explain complex code with diagrams |
| `/plan-feature` | Plan feature implementation |

## Vanity Keypairs

Keypairs live in `wallets/` (gitignored). Replace placeholders with vanity-ground keys.

| File | Purpose |
|------|---------|
| `wallets/signer.json` | Authority/payer keypair |
| `wallets/program-keypair.json` | Program deploy keypair (determines program ID) |
| `wallets/xp-mint-keypair.json` | XP mint keypair (determines mint address) |

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
- [ ] AI slop removed from branch
- [ ] User explicit confirmation received

## Quick Reference

```bash
# On-chain: Build + test
anchor build && cargo fmt && cargo clippy -- -W clippy::all
cargo test --manifest-path onchain-academy/tests/rust/Cargo.toml
anchor test

# Frontend: Build + test
cd app && pnpm tsc --noEmit && pnpm lint && pnpm test:run && pnpm build

# Deploy
/deploy  # On-chain: Always devnet first
# Frontend: Push to main → Vercel auto-deploys
```

## On-Chain Constants

| Constant | Value |
|----------|-------|
| **Program ID** | `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf` |
| **XP Mint** | `xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3` |
| **Cluster** | Devnet |

---

**Docs**: `docs/` | **Skills**: `.claude/skills/` | **Rules**: `.claude/rules/` | **Commands**: `.claude/commands/` | **Agents**: `.claude/agents/`
