# Integration Guide

Reference for integrating with the Superteam Academy on-chain program from frontends, backends, and SDKs.

Program ID: `EHgTQKSeAAoh7JVMij46CFVzThh4xUi7RDjZjHnA7qR6`

---

## PDA Derivation Reference

All PDAs use the program ID as the program address.

| Account | Seeds | Bump | Notes |
|---------|-------|------|-------|
| Config | `["config"]` | Stored in `Config.bump` | Singleton, created by `initialize` |
| Course | `["course", course_id.as_bytes()]` | Stored in `Course.bump` | One per course |
| LearnerProfile | `["learner", user.key()]` | Stored in `LearnerProfile.bump` | One per learner |
| Enrollment | `["enrollment", course_id.as_bytes(), user.key()]` | Stored in `Enrollment.bump` | One per learner per course, closeable |
| MinterRole | `["minter", minter.key()]` | Stored in `MinterRole.bump` | Backend signer authorization |
| AchievementType | `["achievement", achievement_id.as_bytes()]` | Stored in `AchievementType.bump` | Achievement definition |
| AchievementReceipt | `["achievement_receipt", achievement_id.as_bytes(), recipient.key()]` | Stored in receipt | Proof of achievement |

### TypeScript PDA derivation

```typescript
import { PublicKey } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("EHgTQKSeAAoh7JVMij46CFVzThh4xUi7RDjZjHnA7qR6");

// Config PDA
const [configPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("config")],
  PROGRAM_ID,
);

// Course PDA
const [coursePda] = PublicKey.findProgramAddressSync(
  [Buffer.from("course"), Buffer.from(courseId)],
  PROGRAM_ID,
);

// LearnerProfile PDA
const [learnerPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("learner"), userPubkey.toBuffer()],
  PROGRAM_ID,
);

// Enrollment PDA
const [enrollmentPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("enrollment"), Buffer.from(courseId), userPubkey.toBuffer()],
  PROGRAM_ID,
);

// MinterRole PDA
const [minterPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("minter"), minterPubkey.toBuffer()],
  PROGRAM_ID,
);

// AchievementType PDA
const [achievementPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("achievement"), Buffer.from(achievementId)],
  PROGRAM_ID,
);

// AchievementReceipt PDA
const [receiptPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("achievement_receipt"), Buffer.from(achievementId), recipientPubkey.toBuffer()],
  PROGRAM_ID,
);
```

---

## Instruction Parameters

### Platform Management

#### `initialize`
Sets up the Config singleton and creates the initial MinterRole for the authority.
- **Signers:** `authority` (payer)
- **Creates:** Config PDA, MinterRole PDA

#### `create_season`
Creates a new Token-2022 XP mint with NonTransferable + PermanentDelegate + MetadataPointer extensions.
- **Signers:** `authority`
- **Params:** `name: String`, `symbol: String`, `uri: String`
- **Creates:** XP Mint account

#### `close_season`
Marks the current season as closed. No more XP can be minted for this season.
- **Signers:** `authority`

#### `update_config`
Updates Config fields (authority, backend signer, rate limits).
- **Signers:** `authority`
- **Params:** Optional fields to update

### Courses

#### `create_course`
- **Signers:** `authority`
- **Params:** `course_id: String`, `lesson_count: u16`, `xp_per_lesson: u64`, `xp_total: u64`, `difficulty: u8` (1-3), `track: u8`
- **Creates:** Course PDA

#### `update_course`
- **Signers:** `authority`
- **Params:** Optional fields to update

### Learner

#### `init_learner`
- **Signers:** `user` (payer)
- **Creates:** LearnerProfile PDA

### Enrollment & Progress

#### `enroll`
- **Signers:** `user` (payer)
- **Params:** `course_id: String`
- **Creates:** Enrollment PDA
- **Checks:** Course is active, prerequisite met (if any)

#### `unenroll`
- **Signers:** `user`
- **Checks:** 24h cooldown since enrollment

#### `complete_lesson`
- **Signers:** `backend_signer` (minter)
- **Params:** `lesson_index: u16`, `xp_amount: u64`
- **Effects:** Sets lesson bit in Enrollment, mints XP via Token-2022 CPI, updates streak
- **Checks:** Lesson not already completed, daily XP cap

#### `finalize_course`
- **Signers:** `backend_signer` (minter)
- **Effects:** Sets `completed_at`, mints course completion XP + creator reward XP
- **Checks:** All lessons completed (bitmap popcount == lesson_count)

#### `issue_credential`
- **Signers:** `backend_signer`
- **Effects:** Creates or upgrades Metaplex Core credential NFT (soulbound with PermanentFreezeDelegate)
- **Checks:** Course is finalized

#### `close_enrollment`
- **Signers:** `user`
- **Effects:** Closes Enrollment PDA, returns rent to user
- **Checks:** Course is finalized (completed_at is set)

### Achievements

#### `create_achievement_type`
- **Signers:** `authority`
- **Params:** `achievement_id: String`, `name: String`, `uri: String`, `xp_reward: u64`, `max_supply: Option<u32>`
- **Creates:** AchievementType PDA, Metaplex Core Collection

#### `award_achievement`
- **Signers:** `backend_signer` (minter)
- **Params:** `achievement_id: String`
- **Effects:** Creates Metaplex Core NFT in collection, mints XP reward
- **Creates:** AchievementReceipt PDA

---

## Error Codes

The program defines the following error codes. Use these to map on-chain errors to user-friendly messages.

| Error | Code | Message | Suggested User Message |
|-------|------|---------|----------------------|
| `Unauthorized` | 6000 | Unauthorized signer | You don't have permission for this action |
| `CourseNotActive` | 6001 | Course not active | This course is not currently available |
| `LessonOutOfBounds` | 6002 | Lesson index out of bounds | Invalid lesson |
| `LessonAlreadyCompleted` | 6003 | Lesson already completed | You've already completed this lesson |
| `CourseNotCompleted` | 6004 | Not all lessons completed | Complete all lessons before finalizing |
| `CourseAlreadyFinalized` | 6005 | Course already finalized | This course has already been finalized |
| `CourseNotFinalized` | 6006 | Course not finalized | Complete the course first |
| `PrerequisiteNotMet` | 6007 | Prerequisite not met | Complete the prerequisite course first |
| `UnenrollCooldown` | 6008 | Close cooldown not met (24h) | Wait 24 hours before unenrolling |
| `EnrollmentCourseMismatch` | 6009 | Enrollment/course mismatch | Enrollment doesn't match this course |
| `Overflow` | 6010 | Arithmetic overflow | An internal error occurred |
| `CourseIdEmpty` | 6011 | Course ID is empty | Course ID is required |
| `CourseIdTooLong` | 6012 | Course ID exceeds max length | Course ID is too long |
| `InvalidLessonCount` | 6013 | Lesson count must be at least 1 | Course must have at least one lesson |
| `InvalidDifficulty` | 6014 | Difficulty must be 1, 2, or 3 | Invalid difficulty level |
| `CredentialAssetMismatch` | 6015 | Credential asset does not match | Credential mismatch |
| `CredentialAlreadyIssued` | 6016 | Credential already issued | You already have this credential |
| `MinterNotActive` | 6017 | Minter role is not active | Backend authorization failed |
| `MinterAmountExceeded` | 6018 | Amount exceeds minter's per-call limit | XP amount too large |
| `LabelTooLong` | 6019 | Minter label exceeds max length | Label is too long |
| `AchievementNotActive` | 6020 | Achievement type is not active | This achievement is not available |
| `AchievementSupplyExhausted` | 6021 | Achievement max supply reached | No more of this achievement available |
| `AchievementIdTooLong` | 6022 | Achievement ID exceeds max length | Achievement ID is too long |
| `AchievementNameTooLong` | 6023 | Achievement name exceeds max length | Achievement name is too long |
| `AchievementUriTooLong` | 6024 | Achievement URI exceeds max length | Achievement URI is too long |
| `InvalidAmount` | 6025 | Amount must be greater than zero | Amount must be positive |
| `InvalidXpReward` | 6026 | XP reward must be greater than zero | XP reward must be positive |

### Error handling in TypeScript

```typescript
import { AnchorError } from "@coral-xyz/anchor";

try {
  await program.methods.enroll(courseId).rpc();
} catch (err) {
  if (err instanceof AnchorError) {
    switch (err.error.errorCode.code) {
      case "CourseNotActive":
        showToast("This course is not currently available");
        break;
      case "PrerequisiteNotMet":
        showToast("Complete the prerequisite course first");
        break;
      default:
        showToast(`Error: ${err.error.errorMessage}`);
    }
  }
}
```

---

## XP Token Architecture

- **Standard:** Token-2022 (SPL Token Extensions)
- **Extensions:** NonTransferable, PermanentDelegate, MetadataPointer
- **Mint authority:** Config PDA (program-controlled)
- **Seasons:** Each season creates a new mint. Old season tokens remain as history.
- **Current XP Mint (devnet):** `H2LjXpSDff3iQsut49nGniBoAQWjERYA5BdTcmfjf9Yz`

### Reading XP balance

```typescript
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

const ata = getAssociatedTokenAddressSync(
  xpMintAddress,
  userPublicKey,
  false,
  TOKEN_2022_PROGRAM_ID,
);

const accountInfo = await connection.getAccountInfo(ata);
// Parse token account data to get balance
```

---

## Credential Architecture

Credentials use Metaplex Core NFTs with:
- **PermanentFreezeDelegate** plugin (soulbound — cannot be transferred)
- **Attributes** plugin for on-chain metadata (track, level, courses completed)
- One credential per learner per track, upgradeable on further completions

### Reading credentials via Helius DAS API

```typescript
const response = await fetch(`https://mainnet.helius-rpc.com/?api-key=${apiKey}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: "credentials",
    method: "getAssetsByOwner",
    params: {
      ownerAddress: walletAddress,
      page: 1,
      limit: 100,
    },
  }),
});
```

---

## Account Sizes

| Account | Total Size | Approximate Rent |
|---------|-----------|-----------------|
| Config | ~183 bytes | ~0.002 SOL |
| Course | ~230 bytes | ~0.002 SOL |
| LearnerProfile | ~111 bytes | ~0.001 SOL |
| Enrollment | ~99 bytes | ~0.001 SOL |

---

## Compute Unit Budgets

| Instruction | CU Budget | Notes |
|-------------|-----------|-------|
| initialize | 5K | PDA creation |
| create_season | 50K | Token-2022 mint + extensions |
| create_course | 15K | PDA creation |
| enroll | 15K | PDA creation + prerequisite check |
| complete_lesson | 40K | Bitmap + Token-2022 CPI + streak |
| finalize_course | 100K | Bitmap verify + 2x Token-2022 CPI |
| issue_credential | 200-300K | Metaplex Core CPI |
| award_achievement | 30K | Metaplex Core CPI + XP mint |

---

## Related Documentation

- [SPEC.md](./SPEC.md) — Full program specification
- [ARCHITECTURE.md](./ARCHITECTURE.md) — System diagrams and account maps
- [IMPLEMENTATION_ORDER.md](./IMPLEMENTATION_ORDER.md) — Build phases
- [CUSTOMIZATION.md](./CUSTOMIZATION.md) — Frontend customization guide
