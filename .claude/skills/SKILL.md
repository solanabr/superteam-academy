---
name: superteam-academy-dev
description: Superteam Academy — decentralized learning platform on Solana with gamified progression, soulbound XP tokens, Metaplex Core credential NFTs, streak systems, and creator incentives.
user-invocable: true
---

# Superteam Academy Skill

## What this Skill is for

Use this Skill when the user asks for:
- On-chain program development for the Academy platform
- XP token minting (soulbound Token-2022)
- Course registry and enrollment logic
- Lesson completion, bitmap tracking, streak systems
- Metaplex Core credential NFT issuance (soulbound, upgradeable)
- Achievement, referral, and gamification features
- Anchor program development, testing, security
- Deployment workflows (devnet → mainnet)

## Canonical Docs (read these first)

| Document | Purpose |
|----------|---------|
| `docs/SPEC.md` | **Source of truth** for all program behavior, account structs, instructions |
| `docs/ARCHITECTURE.md` | Account maps, data flows, CU budgets |
| `docs/IMPLEMENTATION_ORDER.md` | 9-phase incremental build plan |
| `docs/FUTURE_IMPROVEMENTS.md` | V2/V3 deferred features backlog |
| `CLAUDE.md` | Project-wide conventions, security rules, workflow |

## Progressive Disclosure (read when needed)

### Frontend & Client
- [frontend-framework-kit.md](frontend-framework-kit.md) — React/Next.js with @solana/client + @solana/react-hooks
- [kit-web3-interop.md](kit-web3-interop.md) — @solana/kit ↔ web3.js boundary patterns, @solana/web3-compat

### Programs & Development
- [programs-anchor.md](programs-anchor.md) — Anchor patterns, constraints, testing pyramid, IDL generation
- [programs-pinocchio.md](programs-pinocchio.md) — Pinocchio: zero-copy, minimal CU, high-performance programs

### Testing & Security
- [testing.md](testing.md) — LiteSVM, Mollusk, Trident, CI guidance
- [security.md](security.md) — Vulnerability categories, program checklists

### Deployment
- [deployment.md](deployment.md) — Devnet/mainnet workflows, verifiable builds, multisig

### Payments & Token Extensions
- [payments.md](payments.md) — Commerce Kit, Kora gasless transactions
- [confidential-transfers.md](confidential-transfers.md) — Token-2022 ZK encrypted balances and transfers

### Ecosystem & Reference
- [ecosystem.md](ecosystem.md) — Token standards, DeFi protocols
- [idl-codegen.md](idl-codegen.md) — Codama/Shank client generation
- [resources.md](resources.md) — Official documentation links

## Task Routing Guide

| User asks about... | Primary file(s) |
|--------------------|-----------------|
| Account structures, instructions, XP model | `docs/SPEC.md` |
| Data flows, CU budgets, account matrix | `docs/ARCHITECTURE.md` |
| Build order, what to implement next | `docs/IMPLEMENTATION_ORDER.md` |
| React/Next.js frontend | frontend-framework-kit.md |
| Wallet connection, hooks | frontend-framework-kit.md |
| @solana/kit vs web3.js | kit-web3-interop.md |
| Anchor program code | programs-anchor.md |
| Pinocchio / low-CU programs | programs-pinocchio.md |
| Unit/integration testing | testing.md |
| Fuzz testing (Trident) | testing.md |
| Security review, audit | security.md |
| Deploy to devnet/mainnet | deployment.md |
| Payments, checkout, tips | payments.md |
| Confidential transfers, ZK | confidential-transfers.md |
| Token standards, SPL, Token-2022 | ecosystem.md |
| Generated clients, IDL | idl-codegen.md |
| Official docs and resources | resources.md |
