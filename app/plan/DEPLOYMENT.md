# Program Deployment Status & Development Guide

## Current Status

The on-chain program is **fully implemented** and **deployed on devnet**.

### Devnet Deployment

| | Address | Explorer |
|---|---|---|
| **Program** | `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf` | [View](https://explorer.solana.com/address/ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf?cluster=devnet) |
| **XP Mint** | `xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3` | [View](https://explorer.solana.com/address/xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3?cluster=devnet) |
| **Authority** | `ACAd3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn` | [View](https://explorer.solana.com/address/ACAd3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn?cluster=devnet) |

### Deployed Networks

| Network | Status | URL |
|---------|--------|-----|
| Mainnet | Not Deployed | - |
| Devnet | ✅ **Deployed** | See addresses above |
| Localnet | Available | localhost |

### For Development

**Frontend bounty applicants should use the deployed devnet instance.** The program is already initialized and ready for integration.

To deploy your own instance (optional), see [docs/DEPLOY-PROGRAM.md](../docs/DEPLOY-PROGRAM.md).

---

## Program Details

The deployed program includes:
- **16 instructions** - Full learning lifecycle
- **6 PDA types** - Config, Course, Enrollment, MinterRole, AchievementType, AchievementReceipt
- **26 error variants** - Comprehensive error handling
- **15 events** - For off-chain indexing
- **Token-2022 XP** - Soulbound, non-transferable
- **Metaplex Core credentials** - Soulbound NFTs with PermanentFreezeDelegate

### Core On-Chain Features

| Feature | Status | On-Chain |
|---------|--------|----------|
| XP Token (Token-2022) | ✅ Deployed | Yes - soulbound, NonTransferable |
| Credentials (Metaplex Core) | ✅ Deployed | Yes - soulbound NFTs |
| Course Management | ✅ Deployed | Yes - Course PDAs |
| Enrollment Tracking | ✅ Deployed | Yes - Enrollment PDAs with bitmap |
| Lesson Progress | ✅ Deployed | Yes - 256-bit bitmap |
| Achievements | ✅ Deployed | Yes - AchievementType + Receipt PDAs |
| Minter Roles | ✅ Deployed | Yes - for XP distribution |
| Creator Rewards | ✅ Deployed | Yes - on course completion |

### Frontend-Only Features (Not On-Chain)

| Feature | Status | Implementation |
|---------|--------|----------------|
| Streaks | ⏳ Pending | Frontend/local storage |
| Course Content | ⏳ Pending | Sanity CMS |
| User Profiles | ⏳ Pending | Database/CMS |
| Analytics | ⏳ Pending | GA4/PostHog |
| i18n | ⏳ Pending | Frontend |

---

## Implementation Priority

### Phase 1: Core (MVP - Devnet)

1. **Wallet Connection** - Multi-wallet adapter
2. **Course Catalog** - Browse courses
3. **Course Enrollment** - Learner signs enroll tx
4. **XP Display** - Token-2022 balance
5. **Credentials Display** - Metaplex Core NFTs via DAS API

### Phase 2: Learning Flow (Backend Required)

1. **Lesson Completion** - Backend-signed transactions
2. **Course Finalization** - Backend-signed
3. **Credential Issuance** - Backend-signed
4. **Achievement Awards** - Backend-signed

### Phase 3: Enhancement

1. **Code Editor Integration** - Monaco/CodeMirror
2. **Streak Tracking** - Frontend-only
3. **i18n** - PT-BR, ES, EN
4. **Analytics** - GA4 + heatmaps

---

## Development Commands

```bash
# Build program (if making changes)
anchor build

# Run tests
anchor test

# Rust unit tests
cargo test --manifest-path onchain-academy/tests/rust/Cargo.toml

# Run frontend
cd app && npm run dev
```

---

## External Services Required

| Service | Purpose | Required |
|---------|---------|----------|
| Helius RPC | Solana RPC + DAS API | Yes |
| Arweave | Credential metadata storage (immutable) | Yes |
| Wallet (Phantom/Backpack/Solflare) | User wallet | Yes |
| Vercel | Frontend deployment | Yes |
| Supabase | Auth + Database | Yes |
| Sanity/Strapi | CMS for course content | Yes |
| GA4 | Analytics | Yes |
| PostHog | Heatmaps | Optional |

---

## Verification Checklist

- [x] Program ID matches across all configs
- [x] All 16 instructions implemented
- [x] All 6 PDA types defined
- [x] Token-2022 with NonTransferable
- [x] Metaplex Core with PermanentFreezeDelegate
- [x] 26 error codes defined
- [x] 15 events defined
- [x] Tests available (Rust + TS)
- [x] Program deployed on devnet
- [x] XP mint created
- [x] Authority configured

---

## Documentation

- [SPEC.md](../docs/SPEC.md) - Program specification
- [INTEGRATION.md](../docs/INTEGRATION.md) - Frontend integration guide
- [ARCHITECTURE.md](../docs/ARCHITECTURE.md) - System architecture
- [DEPLOY-PROGRAM.md](../docs/DEPLOY-PROGRAM.md) - Deploy your own instance

---

**Last Updated**: 18-02-2026
