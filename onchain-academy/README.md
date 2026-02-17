# Onchain Academy

Anchor program for the Superteam Academy learning platform — courses, soulbound XP tokens, Metaplex Core credentials, and achievements on Solana.

## Devnet Deployment

| | Address |
|---|---|
| **Program** | `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf` |
| **Config PDA** | `GjsatVW8i6vvHHGtTd59xhRPud1SfoS8ckxL5bGeM7sc` |
| **XP Mint** | `xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3` |
| **Authority / Signer** | `ACAd3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn` |
| **Mock Course** | `7MRgCuJAbDCP1T5b3B5hkE36wAU7hvZQT7eNAn8Ag3rC` |
| **Mock Track Collection** | `HgbTmCi4wUWAWLx4LD6zJ2AQdayaCe7mVfhJpGwXfeVX` |

## Architecture

**16 instructions · 6 PDA types · 26 error variants · 15 events**

- **XP** — Soulbound Token-2022 (NonTransferable + PermanentDelegate), 0 decimals
- **Credentials** — Metaplex Core NFTs, soulbound via PermanentFreezeDelegate, upgradeable attributes
- **Achievements** — Metaplex Core NFTs with AchievementType (config/supply) + AchievementReceipt (double-award prevention) PDAs
- **Lesson Progress** — 256-bit bitmap per enrollment (`[u64; 4]`)
- **No LearnerProfile PDA** — XP balance lives in the Token-2022 ATA

## Instructions

### Admin (authority signer)

| Instruction | Description |
|---|---|
| `initialize` | Create Config PDA, XP mint (Token-2022), auto-register authority MinterRole |
| `update_config` | Rotate backend signer, optionally deactivate old MinterRole |
| `create_course` | Create a course PDA with lessons, XP rewards, prerequisites |
| `update_course` | Update content, toggle active, change XP/reward settings |
| `register_minter` | Register an external XP minter with per-call cap |
| `revoke_minter` | Close MinterRole PDA, reclaim rent |
| `create_achievement_type` | Define achievement badge with Metaplex Core collection |
| `deactivate_achievement_type` | Disable further awards for an achievement |

### Backend (backend_signer)

| Instruction | Description |
|---|---|
| `complete_lesson` | Mark lesson done (bitmap), mint `xp_per_lesson` XP |
| `finalize_course` | Verify all lessons, award 50% bonus XP + creator reward |
| `issue_credential` | Mint soulbound Metaplex Core NFT credential |
| `upgrade_credential` | Update existing credential name, URI, attributes |

### Learner (wallet signer)

| Instruction | Description |
|---|---|
| `enroll` | Enroll in a course (checks prerequisites) |
| `close_enrollment` | Close enrollment, reclaim rent (24h cooldown if incomplete) |

### Minter (registered MinterRole)

| Instruction | Description |
|---|---|
| `reward_xp` | Mint XP to any recipient (within per-call cap) |
| `award_achievement` | Mint achievement NFT + XP reward |

## PDA Seeds

```
Config:             ["config"]
Course:             ["course", course_id]
Enrollment:         ["enrollment", course_id, learner]
MinterRole:         ["minter", minter]
AchievementType:    ["achievement", achievement_id]
AchievementReceipt: ["achievement_receipt", achievement_id, recipient]
```

## Build & Test

```bash
# Build
anchor build

# Rust unit tests (77 tests)
cargo test --manifest-path tests/rust/Cargo.toml

# TypeScript integration tests (62 tests)
anchor test

# Format + lint
cargo fmt && cargo clippy -- -W clippy::all
```

If you hit `edition2024` build errors:
```bash
cargo update -p blake3 --precise 1.7.0
cargo update -p rmp --precise 0.8.14
cargo update -p rmp-serde --precise 1.3.0
```

## Scripts

All scripts run from the `onchain-academy/` directory:

```bash
npx ts-node scripts/<script>.ts [args]
```

| Script | Description |
|---|---|
| `initialize.ts` | One-time program initialization |
| `create-mock-course.ts` | Create a test course |
| `create-mock-track.ts` | Create a Metaplex Core track collection (UMI) |
| `enroll.ts` | Enroll in a course |
| `complete-lesson.ts` | Complete a lesson for a learner |
| `finalize-course.ts` | Finalize a completed course |
| `issue-credential.ts` | Issue credential NFT |
| `fetch-config.ts` | Display Config PDA |
| `fetch-course.ts` | Display Course PDA |
| `fetch-enrollment.ts` | Display Enrollment with lesson progress |
| `check-xp.ts` | Check XP balance for a wallet |
| **`e2e-flow.ts`** | **Full learner flow: enroll → lessons → finalize → credential → close** |

Scripts use hardcoded defaults matching the deployed mock data. Pass CLI args to override.

Run the full end-to-end flow:
```bash
npx ts-node scripts/e2e-flow.ts              # default mock course
npx ts-node scripts/e2e-flow.ts my-course-id  # custom course
```

The e2e script is resumable — it detects existing enrollment state and picks up where it left off.

## Documentation

- [Program Specification](../docs/SPEC.md) — Full instruction specs, account structures, error codes
- [Architecture](../docs/ARCHITECTURE.md) — Account maps, data flows, CU budgets
- [Frontend Integration](../docs/INTEGRATION.md) — PDA derivation, instruction usage, events, error handling
- [Deployment Guide](../docs/DEPLOY-PROGRAM.md) — Deploy your own instance on devnet

## License

MIT