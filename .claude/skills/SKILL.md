---
name: superteam-academy-dev
description: Superteam Academy — decentralized learning platform on Solana with soulbound XP tokens (Token-2022), Metaplex Core credentials, course registry, achievements, and creator incentives. Covers Anchor program development, testing with LiteSVM/Mollusk/Trident.
user-invocable: true
---

# Superteam Academy Skill

## What this Skill is for

Use this Skill when the user asks for:
- On-chain program development for the Academy platform
- XP token minting (soulbound Token-2022)
- Course registry and enrollment logic
- Lesson completion and bitmap tracking
- Finalize course / award XP flows
- Metaplex Core credential issuance and upgrades (soulbound via PermanentFreezeDelegate)
- Achievement system (create, award, deactivate)
- Minter role management (register, revoke, reward XP)
- Anchor program development, testing, security
- Deployment workflows (devnet → mainnet)

## Core Concepts

### Account Structure (6 PDAs + Metaplex Core NFTs)

| Account | Seeds | Purpose |
|---------|-------|---------|
| Config | `["config"]` | Singleton: authority, backend signer, XP mint |
| Course | `["course", course_id.as_bytes()]` | Course metadata, creator, track, XP amounts |
| Enrollment | `["enrollment", course_id.as_bytes(), user.key()]` | Lesson bitmap, completion timestamps, credential ref (closeable) |
| MinterRole | `["minter", minter.key()]` | Registered XP minter with optional per-call cap (closeable via revoke_minter) |
| AchievementType | `["achievement", achievement_id.as_bytes()]` | Achievement definition: name, collection, supply cap, XP reward |
| AchievementReceipt | `["achievement_receipt", achievement_id.as_bytes(), recipient.key()]` | Proof of award — PDA collision prevents double-awarding |
| Credential NFT | Metaplex Core asset (1 per learner per track) | Soulbound, wallet-visible, upgradeable via URI + Attributes plugin |

### Instructions (16 Total)

| Category | Instructions |
|----------|-------------|
| **Platform Management (2)** | `initialize`, `update_config` |
| **Courses (2)** | `create_course`, `update_course` |
| **Enrollment & Progress (6)** | `enroll`, `complete_lesson`, `finalize_course`, `close_enrollment`, `issue_credential`, `upgrade_credential` |
| **Minter Roles (3)** | `register_minter`, `revoke_minter`, `reward_xp` |
| **Achievements (3)** | `create_achievement_type`, `award_achievement`, `deactivate_achievement_type` |

### Core Learning Loop

```
ENROLL → COMPLETE LESSONS → FINALIZE COURSE → ISSUE CREDENTIAL → CLOSE ENROLLMENT
```

1. **Enroll**: Learner signs, prerequisite check, create Enrollment PDA
2. **Complete Lessons**: Backend signs, set bitmap bit, mint lesson XP (Token-2022 CPI)
3. **Finalize Course**: Backend signs, verify all lessons done, mint completion bonus + creator XP
4. **Issue Credential**: Backend signs, Metaplex Core createV2 CPI (PermanentFreezeDelegate + Attributes plugins)
5. **Close Enrollment**: Learner signs, reclaim rent (immediate if completed, 24h cooldown if not)

### Key Design Decisions

- **XP = soulbound Token-2022 token** (NonTransferable + PermanentDelegate)
- **Credentials = Metaplex Core NFTs** — soulbound via PermanentFreezeDelegate, wallet-visible, upgradeable
- **Config PDA = update authority** of all track collection NFTs
- **`finalize_course` and `issue_credential` are split** — XP awards don't depend on credential CPI
- **Completion bonus merged into `finalize_course`** — bonus XP = floor(xp_per_lesson * lesson_count / 2)
- **No LearnerProfile PDA** — XP balance tracked via Token-2022 ATA
- **Rotatable backend signer** stored in Config
- **Reserved bytes** on all accounts for future-proofing without migrations
- **`revoke_minter` closes the MinterRole PDA** (not a soft deactivation)

## Technology Stack

| Layer | Stack |
|-------|-------|
| Programs | Anchor 0.31+, Rust 1.82+ |
| Token Standard | Token-2022 (NonTransferable, PermanentDelegate, MetadataPointer, TokenMetadata) |
| Credentials | Metaplex Core NFTs (soulbound via PermanentFreezeDelegate) |
| Testing | Mollusk, LiteSVM, Trident (fuzz) |
| Client | TypeScript, @coral-xyz/anchor, @solana/web3.js |
| Frontend | Next.js 14+, React, Tailwind CSS |
| RPC | Helius (DAS API for XP leaderboard + credential NFT queries) |
| Content | Arweave (immutable course content) |
| Multisig | Squads (platform authority) |

## Compute Budgets

| Instruction | CU Budget |
|-------------|-----------|
| initialize | ~50K |
| create_course | ~15K |
| complete_lesson | ~30K |
| finalize_course | ~50K |
| issue_credential | ~50-100K |
| upgrade_credential | ~50-100K |
| award_achievement | ~80K |

## Operating Procedure

### 1. Classify the task

- Platform setup (Config, authority)
- Course management (create, update, track assignment)
- Enrollment flow (enroll, lessons, finalize, credentials, close)
- Minter roles (register, revoke, reward XP)
- Achievements (create type, award, deactivate)
- Account structure (PDAs, state)
- Access control (backend signer, authority, minter permissions)
- Testing (unit, integration, fuzz)
- Security (audit, attack vectors)
- Deployment (devnet, mainnet)

### 2. Implementation Checklist

Always verify:
- Account validation (owner, signer, PDA seeds + bump)
- Backend signer matches `Config.backend_signer`
- Checked arithmetic throughout (`checked_add`, `checked_sub`, `checked_mul`)
- Bitmap operations correct for lesson tracking
- Events emitted for state changes
- Canonical PDA bumps stored (never recalculated)
- Reserved bytes preserved on account modifications
- CPI target program IDs validated

### 3. Testing Requirements

- **Unit test** (Mollusk): Each instruction in isolation
- **Integration test** (LiteSVM): Full enroll → complete lessons → finalize → credential flow
- **Fuzz test** (Trident): Random amounts, edge cases, bitmap bounds
- **Attack test**: Unauthorized signer, double completion, supply exhaustion

## Progressive Disclosure (read when needed)

### Programs & Development
- [programs-anchor.md](programs-anchor.md) — Anchor patterns, constraints, testing pyramid, IDL generation

### Testing & Security
- [testing.md](testing.md) — LiteSVM, Mollusk, Trident, CI guidance
- [security.md](security.md) — Vulnerability categories, program checklists

### Deployment
- [deployment.md](deployment.md) — Devnet/mainnet workflows, verifiable builds, multisig

### Ecosystem & Reference
- [ecosystem.md](ecosystem.md) — Token standards, DeFi protocols
- [idl-codegen.md](idl-codegen.md) — Codama/Shank client generation
- [resources.md](resources.md) — Official documentation links

## Task Routing Guide

| User asks about... | Primary file(s) |
|--------------------|-----------------|
| Anchor program code | programs-anchor.md |
| Unit/integration testing | testing.md |
| Fuzz testing (Trident) | testing.md |
| Security review, audit | security.md |
| Deploy to devnet/mainnet | deployment.md |
| Token standards, SPL, Token-2022 | ecosystem.md |
| Generated clients, IDL | idl-codegen.md |
| Official docs and resources | resources.md |

## Canonical Docs

| Document | Purpose |
|----------|---------|
| `docs/SPEC.md` | Source of truth for all program behavior |
| `docs/ARCHITECTURE.md` | Account maps, data flows, CU budgets |
| `docs/INTEGRATION.md` | Frontend integration guide |
