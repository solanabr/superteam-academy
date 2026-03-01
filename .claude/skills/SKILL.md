---
name: superteam-academy-dev
description: Superteam Academy — decentralized learning platform on Solana with gamified progression, soulbound XP tokens, ZK compressed credentials, streak systems, and creator incentives. Covers Anchor program development, Token-2022, Light Protocol, and testing with LiteSVM/Mollusk/Trident.
user-invocable: true
---

# Superteam Academy Skill

## What this Skill is for

Use this Skill when the user asks for:
- On-chain program development for the Academy platform
- XP token minting (soulbound Token-2022)
- Season lifecycle management (create/close seasons, new mints)
- Course registry and enrollment logic
- Lesson completion, bitmap tracking, streak systems
- Finalize course / award XP flows
- ZK Compressed credential issuance (Light Protocol)
- Achievement and gamification features
- Referral system implementation
- Anchor program development, testing, security
- Deployment workflows (devnet → mainnet)

## Core Concepts

### Account Structure (4 PDAs + 1 Compressed)

| Account | Seeds | Purpose |
|---------|-------|---------|
| Config | `["config"]` | Singleton: authority, backend signer, season, rate limits |
| Course | `["course", course_id.as_bytes()]` | Course metadata, creator, track, XP amounts |
| LearnerProfile | `["learner", user.key()]` | Streaks, achievements (bitmap), rate limiting, referrals |
| Enrollment | `["enrollment", course_id.as_bytes(), user.key()]` | Lesson bitmap, completion timestamps (closeable) |
| Credential | `["credential", learner.key(), track_id.to_le_bytes()]` | ZK compressed via Light Protocol, upgradeable per track |

### Instructions (16 Total)

| Category | Instructions |
|----------|-------------|
| **Platform Management (4)** | `initialize`, `create_season`, `close_season`, `update_config` |
| **Courses (2)** | `create_course`, `update_course` |
| **Learner (4)** | `init_learner`, `register_referral`, `claim_achievement`, `award_streak_freeze` |
| **Enrollment & Progress (6)** | `enroll`, `unenroll`, `complete_lesson`, `finalize_course`, `issue_credential`, `close_enrollment` |

### Core Learning Loop

```
ENROLL → COMPLETE LESSONS → FINALIZE COURSE → ISSUE CREDENTIAL → CLOSE ENROLLMENT
```

1. **Enroll**: Learner signs, prerequisite check, create Enrollment PDA
2. **Complete Lessons**: Backend signs, set bitmap bit, mint lesson XP, update streak
3. **Finalize Course**: Backend signs, verify all lessons done, mint learner + creator XP
4. **Issue Credential**: Backend signs, Light CPI to create/upgrade ZK compressed credential
5. **Close Enrollment**: Learner signs, reclaim rent

### Key Design Decisions

- **XP = soulbound Token-2022 token** (NonTransferable + PermanentDelegate)
- **Seasons** = new mint per season; old tokens remain as history
- **Credentials** use ZK Compression (Light Protocol) — no merkle tree, no rent, upgradeable
- **`finalize_course` and `issue_credential` are split** — XP awards don't depend on credential CPI
- **On-chain daily XP cap** — defense-in-depth even if backend compromised
- **UTC standard** for all day boundaries (streaks, rate limiting)
- **Rotatable backend signer** stored in Config
- **Reserved bytes** on all accounts for future-proofing without migrations

## Technology Stack

| Layer | Stack |
|-------|-------|
| Programs | Anchor 0.31+, Rust 1.82+ |
| Token Standard | Token-2022 (NonTransferable, PermanentDelegate, MetadataPointer, TokenMetadata) |
| Credentials | Light SDK (ZK Compression) — compressed PDAs, Photon indexer |
| Testing | Mollusk, LiteSVM, Trident (fuzz) |
| Client | TypeScript, @coral-xyz/anchor, @solana/web3.js |
| Frontend | Next.js 14+, React, Tailwind CSS |
| RPC | Helius (DAS API + Photon for ZK Compression) |
| Content | Arweave (immutable course content) |
| Multisig | Squads (platform authority) |

## Compute Budgets

| Instruction | CU Budget |
|-------------|-----------|
| initialize | ~5K |
| create_season | ~50K |
| complete_lesson | ~40K |
| finalize_course | ~100K |
| issue_credential | ~200-300K |

## Operating Procedure

### 1. Classify the task

- Platform setup (Config, seasons, authority)
- Course management (create, update, track assignment)
- Learner lifecycle (init, streaks, achievements, referrals)
- Enrollment flow (enroll, lessons, finalize, credentials, close)
- Account structure (PDAs, compressed accounts, state)
- Access control (backend signer, authority, permissions)
- Testing (unit, integration, fuzz)
- Security (audit, attack vectors)
- Deployment (devnet, mainnet)

### 2. Implementation Checklist

Always verify:
- Account validation (owner, signer, PDA seeds + bump)
- Backend signer matches `Config.backend_signer`
- Checked arithmetic throughout (`checked_add`, `checked_sub`, `checked_mul`)
- Bitmap operations correct for lesson tracking
- Daily XP cap enforced before minting
- Streak logic uses UTC day boundaries
- Events emitted for state changes
- Canonical PDA bumps stored (never recalculated)
- Reserved bytes preserved on account modifications
- CPI target program IDs validated

### 3. Testing Requirements

- **Unit test** (Mollusk): Each instruction in isolation
- **Integration test** (LiteSVM): Full enroll → complete lessons → finalize → credential flow
- **Fuzz test** (Trident): Random amounts, edge cases, bitmap bounds
- **Attack test**: Daily cap bypass, unauthorized signer, double completion
- **Streak test**: UTC boundary edge cases

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

## Implementation Phases

Refer to `docs/IMPLEMENTATION_ORDER.md` for details. Summary:

1. **Config + Seasons** → foundation (~1-2 days)
2. **LearnerProfile** → user onboarding (~0.5 days)
3. **Course Registry** → content management (~1 day)
4. **Enrollment + Lessons** → core learning loop (~3-4 days)
5. **Finalize Course** → working MVP (~1-2 days) ← **devnet deploy here**
6. **Credentials (ZK)** → verifiable credentials (~3-4 days)
7. **Achievements** → gamification (~1 day)
8. **Streak Freezes** → streak polish (~0.5 days)
9. **Referrals** → growth (~0.5 days)
10. **Close Enrollment** → rent reclaim (~0.5 days)

## Canonical Docs

| Document | Purpose |
|----------|---------|
| `docs/SPEC.md` | Source of truth for all program behavior |
| `docs/ARCHITECTURE.md` | Account maps, data flows, CU budgets |
| `docs/IMPLEMENTATION_ORDER.md` | 10-phase incremental build plan |
| `docs/FUTURE_IMPROVEMENTS.md` | V2/V3 deferred features backlog |
