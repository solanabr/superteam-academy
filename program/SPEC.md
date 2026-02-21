# Superteam Academy — On-Chain Program Specification

**Version:** 3.0
**Network:** Solana Mainnet
**Framework:** Anchor + Metaplex Core

---

## Executive Summary

Superteam Academy is a decentralized learning platform on Solana that issues verifiable credentials, tracks learner XP, manages a course registry, and distributes creator incentives. The on-chain program enforces enrollment gating, lesson-completion bitmaps, XP minting, and soulbound NFT credential lifecycle. Anti-cheat, rate limiting, and content delivery are handled off-chain by a backend service that co-signs transactions with a rotatable keypair stored in the Config PDA.

---

## Account Types

| Account | Seeds | Size | Closeable | Purpose |
|---------|-------|------|-----------|---------|
| Config | `["config"]` | 113 B | No | Singleton: platform authority, backend signer, XP mint |
| Course | `["course", course_id.as_bytes()]` | 192 B | No | Course metadata, creator, XP amounts, lesson count, prerequisite |
| Enrollment | `["enrollment", course_id.as_bytes(), user.key()]` | 127 B | Yes | Per-learner progress: lesson bitmap, timestamps, credential ref |
| MinterRole | `["minter", minter.key()]` | 110 B | Yes (via revoke_minter) | Registered XP minter: label, per-call cap, active flag |
| AchievementType | `["achievement", achievement_id.as_bytes()]` | 338 B | No | Achievement definition: name, metadata URI, collection, supply cap |
| AchievementReceipt | `["achievement_receipt", achievement_id.as_bytes(), recipient.key()]` | 49 B | No | Proof of award — init collision prevents double-awarding |
| Credential NFT | Metaplex Core asset (1 per learner per track) | ~200 B | No | Soulbound wallet-visible credential, upgradeable via plugins |

---

## Instructions

### Platform Management

| Instruction | Who Signs | Description |
|-------------|-----------|-------------|
| `initialize` | authority | One-time setup: create Config PDA, XP mint (Token-2022), auto-register backend signer as MinterRole |
| `update_config` | authority | Rotate backend signer (optionally deactivate old MinterRole via remaining_accounts) |

### Course Management

| Instruction | Who Signs | Description |
|-------------|-----------|-------------|
| `create_course` | authority | Register a new course PDA with XP amounts, lesson count, track, prerequisite |
| `update_course` | authority | Update course content, XP reward, active status, or creator reward |

### Enrollment and Progress

| Instruction | Who Signs | Description |
|-------------|-----------|-------------|
| `enroll` | learner | Create Enrollment PDA; checks course is active and prerequisite completed |
| `complete_lesson` | backend_signer | Set lesson bit in bitmap, mint `xp_per_lesson` to learner |
| `finalize_course` | backend_signer | Verify full bitmap, mint completion bonus to learner, mint creator reward (if threshold met), set `completed_at` |
| `issue_credential` | backend_signer | Create Metaplex Core credential NFT for the learner's track. Params: `credential_name`, `metadata_uri`, `courses_completed: u32`, `total_xp: u64` |
| `upgrade_credential` | backend_signer | Upgrade an existing credential NFT URI and attributes. Params: `credential_name`, `metadata_uri`, `courses_completed: u32`, `total_xp: u64` |
| `close_enrollment` | learner | Close Enrollment PDA; free immediately if completed, 24h cooldown if incomplete |

### Minter Roles

| Instruction | Who Signs | Description |
|-------------|-----------|-------------|
| `register_minter` | authority | Create MinterRole PDA, set label and optional per-call XP cap |
| `revoke_minter` | authority | Close a MinterRole PDA, reclaiming rent to authority |
| `reward_xp` | minter | Mint arbitrary XP to a recipient, gated by MinterRole cap and active flag |

### Achievements

| Instruction | Who Signs | Description |
|-------------|-----------|-------------|
| `create_achievement_type` | authority | Define an achievement: name, metadata URI, Metaplex Core collection, supply cap, XP reward |
| `award_achievement` | minter | Mint achievement NFT to recipient; create AchievementReceipt PDA; mint XP reward |
| `deactivate_achievement_type` | authority | Mark achievement type inactive, blocking future awards |

---

## User Flows

### Learner Journey

- Learner calls `enroll` — Enrollment PDA created, prerequisite checked on-chain
- Backend validates quiz or content progress, then signs and submits `complete_lesson` for each lesson — XP minted per lesson
- Backend verifies full bitmap and submits `finalize_course` — completion bonus and creator reward minted
- Backend submits `issue_credential` — Metaplex Core NFT created (first track course) or upgraded (subsequent track courses); asset pubkey stored in Enrollment
- Learner optionally calls `close_enrollment` to reclaim rent; credential NFT remains in wallet permanently
- Learner can unenroll from an incomplete course after 24 hours by calling `close_enrollment`

### Admin Management

- Authority calls `initialize` once — Config PDA and XP mint created; backend signer auto-registered as MinterRole
- Authority calls `create_course` for each new course — sets lesson count, XP amounts, track, and optional prerequisite
- Authority calls `update_course` to adjust reward amounts, content tx ID, or deactivate a course
- Authority calls `update_config` to rotate backend signer without a program upgrade
- Authority calls `register_minter` to onboard external XP minters with optional per-call caps
- Authority calls `revoke_minter` to close a minter's PDA and reclaim rent
- Authority calls `create_achievement_type` to define new achievements
- Authority calls `deactivate_achievement_type` to stop awarding an achievement

### Minter XP Rewards

- Authority registers a minter via `register_minter` with a label and optional cap
- Minter calls `reward_xp` with an amount and recipient — program checks MinterRole is active and amount is within cap, then mints XP
- Minter's `total_xp_minted` counter increments on each call

### Achievement Awards

- Authority creates an achievement type via `create_achievement_type` — sets collection, supply cap, XP reward
- Minter calls `award_achievement` for a recipient — mints achievement NFT, creates AchievementReceipt PDA (collision = already awarded), mints XP reward
- Authority calls `deactivate_achievement_type` when the achievement is retired

---

## XP Economics

XP is earned through five mechanisms:

| Source | Amount | Trigger |
|--------|--------|---------|
| Lesson completion | `course.xp_per_lesson` per lesson | `complete_lesson` (each lesson) |
| Course completion bonus | 50% of total lesson XP (floor), computed dynamically | `finalize_course` |
| Creator reward | `course.creator_reward_xp` | `finalize_course`, gated by `min_completions_for_reward` |
| Minter reward | Arbitrary, capped by MinterRole | `reward_xp` |
| Achievement award | `achievement_type.xp_reward` | `award_achievement` |

The completion bonus is computed as `floor((xp_per_lesson * lesson_count) / 2)` at finalization — it is not stored on the Course account. Creator reward only mints once the course has reached `min_completions_for_reward` total completions, preventing alt-account farming.

---

## Credentials

Credentials are Metaplex Core NFTs — soulbound via PermanentFreezeDelegate plugin, universally visible in Phantom, Backpack, and Solflare. One credential NFT exists per learner per track (e.g., one for the Anchor track, one for the DeFi track). The credential upgrades in place as the learner completes higher-level courses in the same track — the NFT address never changes.

Config PDA is the update authority for all track collection NFTs. This means only the program (signing as Config PDA) can create or upgrade credentials via Metaplex Core CPI. The Enrollment account stores the `credential_asset` pubkey once issued — this field is the on-chain source of truth for create-vs-upgrade decisions, eliminating any DAS API dependency for writes.

Achievement NFTs are distinct from track credentials — each is a separate Metaplex Core asset in its own collection, awarded once per recipient per achievement type.

---

## Security

### Authority Roles

| Role | Key | Gated Instructions |
|------|-----|--------------------|
| Authority | `config.authority` (Squads multisig) | initialize, update_config, create_course, update_course, register_minter, revoke_minter, create_achievement_type, deactivate_achievement_type |
| Backend Signer | `config.backend_signer` (rotatable) | complete_lesson, finalize_course, issue_credential, upgrade_credential |
| Minter | `minter_role.minter` (registered) | reward_xp, award_achievement |
| Learner | wallet signature | enroll, close_enrollment |

### Anti-Cheat Summary

- Lesson bitmap — cannot complete the same lesson twice (on-chain bit check)
- XP amounts — read from Course PDA, not from instruction parameters
- Backend co-signature required for all completions and credential issuance
- Rate limiting and fraud detection handled off-chain before the backend signs
- Creator reward gating — `min_completions_for_reward` blocks alt-account farming
- AchievementReceipt PDA init — account collision prevents double-awarding
- MinterRole cap — `max_xp_per_call` (0 = unlimited) limits per-call damage from a compromised minter
- Prerequisite enforcement — Enrollment checks completed_at on prerequisite Enrollment PDA at enroll time

---

## Error Codes

| Code | Message |
|------|---------|
| `Unauthorized` | Unauthorized signer |
| `CourseNotActive` | Course not active |
| `LessonOutOfBounds` | Lesson index out of bounds |
| `LessonAlreadyCompleted` | Lesson already completed |
| `CourseNotCompleted` | Not all lessons completed |
| `CourseAlreadyFinalized` | Course already finalized |
| `CourseNotFinalized` | Course not finalized |
| `PrerequisiteNotMet` | Prerequisite not met |
| `UnenrollCooldown` | Close cooldown not met (24h) |
| `EnrollmentCourseMismatch` | Enrollment/course mismatch |
| `Overflow` | Arithmetic overflow |
| `CourseIdEmpty` | Course ID is empty |
| `CourseIdTooLong` | Course ID exceeds max length |
| `InvalidLessonCount` | Lesson count must be at least 1 |
| `InvalidDifficulty` | Difficulty must be 1, 2, or 3 |
| `CredentialAssetMismatch` | Credential asset does not match enrollment record |
| `CredentialAlreadyIssued` | Credential already issued for this enrollment |
| `MinterNotActive` | Minter role is not active |
| `MinterAmountExceeded` | Amount exceeds minter's per-call limit |
| `LabelTooLong` | Minter label exceeds max length |
| `AchievementNotActive` | Achievement type is not active |
| `AchievementSupplyExhausted` | Achievement max supply reached |
| `AchievementIdTooLong` | Achievement ID exceeds max length |
| `AchievementNameTooLong` | Achievement name exceeds max length |
| `AchievementUriTooLong` | Achievement URI exceeds max length |
| `InvalidAmount` | Amount must be greater than zero |
| `InvalidXpReward` | XP reward must be greater than zero |

---

## Events

| Event | Emitted By |
|-------|------------|
| `ConfigUpdated` | update_config |
| `CourseCreated` | create_course |
| `CourseUpdated` | update_course |
| `Enrolled` | enroll |
| `LessonCompleted` | complete_lesson |
| `CourseFinalized` | finalize_course |
| `EnrollmentClosed` | close_enrollment |
| `CredentialIssued` | issue_credential |
| `CredentialUpgraded` | upgrade_credential |
| `MinterRegistered` | register_minter |
| `MinterRevoked` | revoke_minter |
| `XpRewarded` | reward_xp |
| `AchievementAwarded` | award_achievement |
| `AchievementTypeCreated` | create_achievement_type |
| `AchievementTypeDeactivated` | deactivate_achievement_type |

---

## Cost Analysis

### Account Rent (Approximate)

| Account | Size | Rent | Closeable |
|---------|------|------|-----------|
| Config | 113 B | ~0.001 SOL | No |
| Course | 192 B | ~0.002 SOL | No |
| Enrollment | 127 B | ~0.001 SOL | Yes — reclaimed on close |
| MinterRole | 110 B | ~0.001 SOL | Yes (via revoke_minter) |
| AchievementType | 338 B | ~0.003 SOL | No |
| AchievementReceipt | 49 B | ~0.0004 SOL | No |
| Credential NFT (Metaplex Core) | ~200 B | ~0.006 SOL | No |

### Per-Learner (Single Course)

| Action | Rent | Notes |
|--------|------|-------|
| Enroll | 0.001 SOL | Reclaimable |
| Complete lessons | — | TX fees only |
| Finalize | — | TX fees only |
| Issue credential (first in track) | ~0.006 SOL | Permanent NFT in wallet |
| Issue credential (upgrade) | — | No new rent |
| Close enrollment | -0.001 SOL | Reclaimed |

---

*Specification v3.0 — Superteam Academy*
