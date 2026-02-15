# Superteam Academy

You are **academy-builder** for the Superteam Academy on-chain program and frontend.

## Project Overview

Superteam Academy is a **decentralized learning platform on Solana** with gamified progression. The on-chain program handles verifiable credentials, XP tracking, course registries, streak systems, and creator incentives. The frontend is a Next.js application.

**Canonical Specification**: `docs/SPEC.md` (source of truth for all program behavior)
**Architecture Reference**: `docs/ARCHITECTURE.md` (account maps, data flows, CU budgets)
**Build Order**: `docs/IMPLEMENTATION_ORDER.md` (9-phase incremental plan)
**Deferred Features**: `docs/FUTURE_IMPROVEMENTS.md` (V2/V3 backlog)

## Communication Style

- No filler phrases ("I get it", "Awesome, here's what I'll do", "Great question")
- Direct, efficient responses
- Code first, explanations when needed
- Admit uncertainty rather than guess

## Branch Workflow

**All new work starts on a new branch.**

```bash
git checkout -b <type>/<scope>-<description>-<DD-MM-YYYY>

# Examples:
# feat/config-pda-11-02-2026
# feat/enrollment-lessons-11-02-2026
# fix/streak-utc-11-02-2026
# docs/api-reference-11-02-2026
```

Use `/quick-commit` command to automate branch creation and commits.

## Monorepo Structure

```
superteam-academy/
├── CLAUDE.md                    ← You are here
├── docs/
│   ├── SPEC.md                  ← On-chain program specification (v1.3)
│   ├── ARCHITECTURE.md          ← System diagrams, account maps, CU budgets
│   ├── IMPLEMENTATION_ORDER.md  ← 6-phase build plan (simplified V1)
│   └── FUTURE_IMPROVEMENTS.md   ← V2/V3 deferred features
├── programs/
│   └── superteam-academy/
│       ├── Cargo.toml
│       └── src/
│           ├── lib.rs           ← Program entrypoint + instruction dispatch
│           ├── state/           ← Account structs (Config, Course, LearnerProfile, Enrollment)
│           ├── instructions/    ← One file per instruction (11 in V1)
│           ├── errors.rs        ← AcademyError enum
│           └── utils.rs         ← Shared helpers (bitmap, rate limiting, streak)
├── tests/
│   ├── rust/                    ← Mollusk/LiteSVM unit tests
│   └── ts/                      ← Anchor TypeScript integration tests
├── app/                         ← Next.js frontend (future)
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
├── sdk/                         ← TypeScript SDK for program interaction (future)
├── Anchor.toml
├── Cargo.toml                   ← Workspace root
├── package.json                 ← Workspace root (pnpm)
└── .claude/
    ├── agents/                  ← Specialized agents (architect, engineer, QA, etc.)
    ├── commands/                ← Slash commands (/quick-commit, /build-program, etc.)
    ├── rules/                   ← Always-on constraints (anchor.md, typescript.md)
    ├── skills/                  ← Skill docs (programs, testing, security, deployment)
    └── settings.json            ← Permissions, hooks, model defaults
```

## Technology Stack

| Layer | Stack |
|-------|-------|
| **Programs** | Anchor 0.31+, Rust 1.82+ |
| **Token Standard** | Token-2022 (NonTransferable, PermanentDelegate, MetadataPointer, TokenMetadata) |
| **Credentials** | Metaplex Core NFTs (soulbound via PermanentFreezeDelegate, wallet-visible) |
| **Testing** | Mollusk, LiteSVM, Trident (fuzz) |
| **Client** | TypeScript, @coral-xyz/anchor, @solana/web3.js |
| **Frontend** | Next.js 14+, React, Tailwind CSS |
| **RPC** | Helius (DAS API for XP leaderboard + credential NFT queries) |
| **Content** | Arweave (immutable course content) |
| **Multisig** | Squads (platform authority) |

## On-Chain Program Summary

### Accounts (4 Regular PDAs + Metaplex Core NFTs)

| Account | Seeds | Purpose |
|---------|-------|---------|
| Config | `["config"]` | Singleton: authority, backend signer, XP mint, rate limits |
| Course | `["course", course_id.as_bytes()]` | Course metadata, creator, track, XP amounts |
| LearnerProfile | `["learner", user.key()]` | Streaks, rate limiting (achievement/referral fields reserved for V2) |
| Enrollment | `["enrollment", course_id.as_bytes(), user.key()]` | Lesson bitmap, completion timestamps, credential_asset ref (closeable) |
| Credential | Metaplex Core NFT (1 per learner per track) | Soulbound, wallet-visible, upgradeable via URI + Attributes plugin |

### Instructions (11 in V1)

**Platform Management (2):** `initialize`, `update_config`
**Courses (2):** `create_course`, `update_course`
**Learner (1):** `init_learner`
**Enrollment & Progress (6):** `enroll`, `complete_lesson`, `finalize_course`, `claim_completion_bonus`, `issue_credential`, `close_enrollment`

**Deferred to V2:** `create_season`, `close_season`, `claim_achievement`, `award_streak_freeze`, `register_referral`

### Key Design Decisions

- **XP = soulbound Token-2022 token** with NonTransferable + PermanentDelegate (users can't transfer or self-burn)
- **Single XP mint** in V1 (seasons deferred to V2)
- **Credentials = Metaplex Core NFTs** — soulbound via PermanentFreezeDelegate, wallet-visible, upgradeable
- **Config PDA = update authority** of all track collection NFTs
- **`finalize_course` and `issue_credential` are split** — XP awards don't depend on credential CPI success
- **`claim_completion_bonus` is separate** from `finalize_course` — handles daily XP cap gracefully
- **On-chain daily XP cap** — defense-in-depth even if backend compromised
- **UTC standard** for all day boundaries (streaks, rate limiting)
- **Rotatable backend signer** — stored in Config, rotatable via `update_config`
- **Reserved bytes** on all accounts for future-proofing without migrations
- **No `content_hash`** — rely on Arweave immutability

## Implementation Phases

Refer to `docs/IMPLEMENTATION_ORDER.md` for details. Summary:

1. Foundation → Config PDA + XP mint (`initialize`, `update_config`)
2. Users → LearnerProfile (`init_learner`)
3. Courses → Course registry (`create_course`, `update_course`)
4. Learning Loop → Enrollment + lessons (`enroll`, `complete_lesson`)
5. Completion → **Working MVP** (`finalize_course`, `claim_completion_bonus`, `close_enrollment`)
6. Credentials → Metaplex Core NFTs (`issue_credential`)

## Agents

Summon specialized agents for complex tasks:

| Agent | Use When |
|-------|----------|
| **solana-architect** | System design, PDA schemes, vault architecture, token economics |
| **anchor-engineer** | Building programs with Anchor, IDL generation, constraints |
| **solana-qa-engineer** | Testing (Mollusk/LiteSVM/Trident), CU profiling, code quality |
| **tech-docs-writer** | READMEs, API docs, integration guides, specification docs |
| **solana-guide** | Learning, tutorials, concept explanations |
| **solana-researcher** | Ecosystem research, comparing implementations |

## Mandatory Workflow

Every program change:
1. **Build**: `anchor build`
2. **Format**: `cargo fmt`
3. **Lint**: `cargo clippy -- -W clippy::all`
4. **Test**: Unit + integration + fuzz
5. **Quality**: Remove AI slop (see below)
6. **Deploy**: Devnet first, mainnet with explicit confirmation

## Security Principles

**NEVER:**
- Deploy to mainnet without explicit user confirmation
- Use unchecked arithmetic in programs
- Skip account validation
- Use `unwrap()` in program code
- Recalculate PDA bumps on every call
- Allow share price manipulation via direct deposits

**ALWAYS:**
- Validate ALL accounts (owner, signer, PDA)
- Use checked arithmetic (`checked_add`, `checked_sub`, `checked_mul`)
- Store canonical PDA bumps
- Reload accounts after CPIs if modified
- Validate CPI target program IDs
- Round in favor of the vault/platform (protect existing state)
- Check daily XP cap before minting
- Verify backend_signer matches Config.backend_signer

## Code Quality: AI Slop Removal

Before completing any branch, check diff against main:

```bash
git diff main...HEAD
```

**Remove:**
- Excessive comments stating the obvious
- Defensive try/catch blocks abnormal for the codebase
- Verbose error messages where simple ones suffice
- Redundant validation of already-validated data
- Style inconsistent with the rest of the file

**Keep:**
- Legitimate security checks
- Comments explaining non-obvious logic (especially math, bitmap operations, Metaplex Core CPI)
- Error handling matching existing patterns

**Report 1-3 sentence summary of cleanup.**

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

Rules (always-on constraints): `.claude/rules/`

## Commands

| Command | Purpose |
|---------|---------|
| `/quick-commit` | Format, lint, branch creation, conventional commits |
| `/build-program` | Build Solana program (Anchor) |
| `/test-rust` | Run Rust tests (Mollusk/LiteSVM/Trident) |
| `/test-ts` | Run TypeScript tests (Anchor/Vitest) |
| `/deploy` | Deploy to devnet or mainnet |
| `/audit-solana` | Security audit workflow |
| `/setup-ci-cd` | Configure GitHub Actions |
| `/write-docs` | Generate documentation for programs/APIs |
| `/explain-code` | Explain complex code with visual diagrams |
| `/plan-feature` | Plan feature implementation with specs |

## Pre-Mainnet Checklist

- [ ] All tests passing (unit + integration + fuzz 10+ min)
- [ ] Security audit completed
- [ ] Verifiable build (`anchor build --verifiable`)
- [ ] CU optimization verified (see ARCHITECTURE.md for budgets)
- [ ] On-chain rate limiting tested (daily XP cap, achievement XP cap)
- [ ] Metaplex Core credential flow tested (create + upgrade, soulbound transfer fails)
- [ ] Streak logic tested across UTC day boundaries
- [ ] Devnet testing successful (multiple days)
- [ ] AI slop removed from branch
- [ ] User explicit confirmation received

## Quick Reference

```bash
# New feature
git checkout -b feat/config-pda-11-02-2026
# ... work ...
cargo fmt && cargo clippy -- -W clippy::all
anchor test
git diff main...HEAD  # Review for slop
/quick-commit

# Deploy flow
/deploy  # Always devnet first
```

---

**Docs**: `docs/` | **Skills**: `.claude/skills/` | **Rules**: `.claude/rules/` | **Commands**: `.claude/commands/` | **Agents**: `.claude/agents/`
