# Superteam Academy — Frontend Integration Guide

Program ID: `3YchgRgR65gdRqgTZTM5qQXqtTZn5Kt2i6FPnZVu34Qb`

## Architecture

```
┌───────────-──┐     ┌──────────────┐     ┌───────────────────┐
│  Next.js     │────▶│  Backend     │────▶│  On-Chain Program │
│  Frontend    │     │  (signer)    │     │  (Anchor)         │
└──────┬───────┘     └──────────────┘     └───────────────────┘
       │                                          │
       │  wallet signs: enroll, close_enrollment  │
       │                                          │
       │  backend signs: complete_lesson,         │
       │    finalize_course, issue_credential,    │
       │    upgrade_credential                    │
       │                                          │
       └──────────────────────────────────────────┘
```

**Key pattern**: Learners sign their own enrollment/close transactions. The backend server signs lesson completions, course finalization, and credential issuance (anti-cheat). Admin signs platform management via multisig.

---

## Setup

```typescript
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import { getAssociatedTokenAddressSync, createAssociatedTokenAccountInstruction } from "@solana/spl-token";
import { SuperteamAcademy, IDL } from "../target/types/superteam_academy";

const PROGRAM_ID = new PublicKey("3YchgRgR65gdRqgTZTM5qQXqtTZn5Kt2i6FPnZVu34Qb");
const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
const MPL_CORE_PROGRAM_ID = new PublicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");

const provider = AnchorProvider.env();
const program = new Program<SuperteamAcademy>(IDL, PROGRAM_ID, provider);
```

---

## PDA Derivation

```typescript
// Config (singleton)
const [configPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("config")],
  PROGRAM_ID
);

// Course
const [coursePda] = PublicKey.findProgramAddressSync(
  [Buffer.from("course"), Buffer.from(courseId)],
  PROGRAM_ID
);

// Enrollment
const [enrollmentPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("enrollment"), Buffer.from(courseId), learner.toBuffer()],
  PROGRAM_ID
);

// MinterRole
const [minterRolePda] = PublicKey.findProgramAddressSync(
  [Buffer.from("minter"), minter.toBuffer()],
  PROGRAM_ID
);

// AchievementType
const [achievementTypePda] = PublicKey.findProgramAddressSync(
  [Buffer.from("achievement"), Buffer.from(achievementId)],
  PROGRAM_ID
);

// AchievementReceipt
const [receiptPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("achievement_receipt"), Buffer.from(achievementId), recipient.toBuffer()],
  PROGRAM_ID
);
```

---

## Instructions by Role

### Learner (wallet signer)

#### enroll

Enrolls the connected wallet in a course. If the course has a prerequisite, pass the prerequisite Course PDA and the learner's completed Enrollment PDA as remaining accounts.

```typescript
await program.methods
  .enroll(courseId)
  .accountsPartial({
    course: coursePda,
    enrollment: enrollmentPda,
    learner: wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  // If course has prerequisite:
  .remainingAccounts([
    { pubkey: prereqCoursePda, isWritable: false, isSigner: false },
    { pubkey: prereqEnrollmentPda, isWritable: false, isSigner: false },
  ])
  .rpc();
```

#### close_enrollment

Closes enrollment and reclaims rent. Completed courses close immediately. Incomplete courses require 24h after enrollment.

```typescript
await program.methods
  .closeEnrollment()
  .accountsPartial({
    course: coursePda,
    enrollment: enrollmentPda,
    learner: wallet.publicKey,
  })
  .rpc();
```

### Backend (backend_signer keypair)

#### complete_lesson

Marks a lesson complete and mints `xp_per_lesson` XP to the learner.

```typescript
await program.methods
  .completeLesson(lessonIndex)
  .accountsPartial({
    config: configPda,
    course: coursePda,
    enrollment: enrollmentPda,
    learner: learnerPubkey,
    learnerTokenAccount: learnerXpAta,
    xpMint: xpMintPubkey,
    backendSigner: backendSigner.publicKey,
    tokenProgram: TOKEN_2022_PROGRAM_ID,
  })
  .signers([backendSigner])
  .rpc();
```

#### finalize_course

Verifies all lessons complete, awards 50% bonus XP to learner, awards creator XP if threshold met.

```typescript
await program.methods
  .finalizeCourse()
  .accountsPartial({
    config: configPda,
    course: coursePda,
    enrollment: enrollmentPda,
    learner: learnerPubkey,
    learnerTokenAccount: learnerXpAta,
    creatorTokenAccount: creatorXpAta,
    creator: creatorPubkey,
    xpMint: xpMintPubkey,
    backendSigner: backendSigner.publicKey,
    tokenProgram: TOKEN_2022_PROGRAM_ID,
  })
  .signers([backendSigner])
  .rpc();
```

#### issue_credential

Creates a soulbound Metaplex Core NFT credential. Requires `finalize_course` first. `coursesCompleted` and `totalXp` are written to the NFT Attributes plugin.

```typescript
const credentialAsset = Keypair.generate();

await program.methods
  .issueCredential(credentialName, metadataUri, coursesCompleted, new BN(totalXp))
  .accountsPartial({
    config: configPda,
    course: coursePda,
    enrollment: enrollmentPda,
    learner: learnerPubkey,
    credentialAsset: credentialAsset.publicKey,
    trackCollection: trackCollectionPubkey,
    payer: payer.publicKey,
    backendSigner: backendSigner.publicKey,
    mplCoreProgram: MPL_CORE_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  })
  .signers([backendSigner, credentialAsset, payer])
  .rpc();
```

#### upgrade_credential

Updates an existing credential NFT with new name, URI, and attributes.

```typescript
await program.methods
  .upgradeCredential(newName, newUri, coursesCompleted, new BN(totalXp))
  .accountsPartial({
    config: configPda,
    course: coursePda,
    enrollment: enrollmentPda,
    learner: learnerPubkey,
    credentialAsset: existingAssetPubkey,
    trackCollection: trackCollectionPubkey,
    payer: payer.publicKey,
    backendSigner: backendSigner.publicKey,
    mplCoreProgram: MPL_CORE_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  })
  .signers([backendSigner, payer])
  .rpc();
```

### Admin (config.authority signer)

#### initialize

One-time setup. Creates Config PDA, XP mint (Token-2022), and auto-registers authority as a MinterRole.

```typescript
const xpMint = Keypair.generate();
const [backendMinterRolePda] = PublicKey.findProgramAddressSync(
  [Buffer.from("minter"), authority.publicKey.toBuffer()],
  PROGRAM_ID
);

await program.methods
  .initialize()
  .accountsPartial({
    config: configPda,
    xpMint: xpMint.publicKey,
    authority: authority.publicKey,
    backendMinterRole: backendMinterRolePda,
    systemProgram: SystemProgram.programId,
    tokenProgram: TOKEN_2022_PROGRAM_ID,
  })
  .signers([authority, xpMint])
  .rpc();
```

#### update_config

Rotates backend signer. Optionally pass old MinterRole PDA as remaining account to deactivate it.

```typescript
await program.methods
  .updateConfig({ newBackendSigner: newSignerPubkey })
  .accountsPartial({
    config: configPda,
    authority: authority.publicKey,
  })
  .remainingAccounts([
    { pubkey: oldMinterRolePda, isWritable: true, isSigner: false },
  ])
  .signers([authority])
  .rpc();
```

#### create_course

```typescript
await program.methods
  .createCourse({
    courseId: "anchor-101",
    creator: creatorPubkey,
    contentTxId: Array.from(arweaveTxIdBytes),
    lessonCount: 10,
    difficulty: 1,
    xpPerLesson: 100,
    trackId: 1,
    trackLevel: 1,
    prerequisite: null,
    creatorRewardXp: 50,
    minCompletionsForReward: 3,
  })
  .accountsPartial({
    course: coursePda,
    config: configPda,
    authority: authority.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .signers([authority])
  .rpc();
```

#### update_course

```typescript
await program.methods
  .updateCourse({
    newContentTxId: null,
    newIsActive: true,
    newXpPerLesson: 150,
    newCreatorRewardXp: null,
    newMinCompletionsForReward: null,
  })
  .accountsPartial({
    config: configPda,
    course: coursePda,
    authority: authority.publicKey,
  })
  .signers([authority])
  .rpc();
```

#### register_minter

```typescript
await program.methods
  .registerMinter({
    minter: minterPubkey,
    label: "irl-events",
    maxXpPerCall: new BN(1000),
  })
  .accountsPartial({
    config: configPda,
    minterRole: minterRolePda,
    authority: authority.publicKey,
    payer: authority.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .signers([authority])
  .rpc();
```

#### revoke_minter

Closes the MinterRole PDA and reclaims rent to authority.

```typescript
await program.methods
  .revokeMinter()
  .accountsPartial({
    config: configPda,
    minterRole: minterRolePda,
    authority: authority.publicKey,
  })
  .signers([authority])
  .rpc();
```

#### create_achievement_type

```typescript
const collection = Keypair.generate();

await program.methods
  .createAchievementType({
    achievementId: "hackathon-winner",
    name: "Hackathon Winner",
    metadataUri: "https://arweave.net/...",
    maxSupply: 100,
    xpReward: 500,
  })
  .accountsPartial({
    config: configPda,
    achievementType: achievementTypePda,
    collection: collection.publicKey,
    authority: authority.publicKey,
    payer: authority.publicKey,
    mplCoreProgram: MPL_CORE_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  })
  .signers([authority, collection])
  .rpc();
```

#### deactivate_achievement_type

```typescript
await program.methods
  .deactivateAchievementType()
  .accountsPartial({
    config: configPda,
    achievementType: achievementTypePda,
    authority: authority.publicKey,
  })
  .signers([authority])
  .rpc();
```

### Minter (registered MinterRole signer)

#### reward_xp

```typescript
await program.methods
  .rewardXp(new BN(500), "community event reward")
  .accountsPartial({
    config: configPda,
    minterRole: minterRolePda,
    xpMint: xpMintPubkey,
    recipientTokenAccount: recipientXpAta,
    minter: minter.publicKey,
    tokenProgram: TOKEN_2022_PROGRAM_ID,
  })
  .signers([minter])
  .rpc();
```

#### award_achievement

```typescript
const asset = Keypair.generate();

await program.methods
  .awardAchievement()
  .accountsPartial({
    config: configPda,
    achievementType: achievementTypePda,
    achievementReceipt: receiptPda,
    minterRole: minterRolePda,
    asset: asset.publicKey,
    collection: collectionPubkey,
    recipient: recipientPubkey,
    recipientTokenAccount: recipientXpAta,
    xpMint: xpMintPubkey,
    payer: payer.publicKey,
    minter: minter.publicKey,
    mplCoreProgram: MPL_CORE_PROGRAM_ID,
    tokenProgram: TOKEN_2022_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  })
  .signers([minter, asset, payer])
  .rpc();
```

---

## Reading Accounts

```typescript
// Config
const config = await program.account.config.fetch(configPda);
// config.authority, config.backendSigner, config.xpMint

// Course
const course = await program.account.course.fetch(coursePda);
// course.courseId, course.lessonCount, course.xpPerLesson, course.isActive

// Enrollment (returns null if closed/never created)
const enrollment = await program.account.enrollment.fetchNullable(enrollmentPda);
// enrollment.lessonFlags, enrollment.completedAt, enrollment.credentialAsset

// MinterRole
const role = await program.account.minterRole.fetch(minterRolePda);
// role.isActive, role.totalXpMinted, role.maxXpPerCall

// AchievementType
const achievement = await program.account.achievementType.fetch(achievementTypePda);
// achievement.currentSupply, achievement.maxSupply, achievement.xpReward

// AchievementReceipt (null = not yet awarded)
const receipt = await program.account.achievementReceipt.fetchNullable(receiptPda);
// receipt.asset, receipt.awardedAt
```

### List all courses

```typescript
const allCourses = await program.account.course.all();
const activeCourses = allCourses.filter(c => c.account.isActive);
```

### List enrollments for a wallet

```typescript
// Use getProgramAccounts with memcmp filter on course pubkey
// or iterate all enrollments (small dataset) and filter client-side
const enrollments = await program.account.enrollment.all();
```

---

## XP Balance

XP uses Token-2022 with 0 decimals. Query the learner's Associated Token Account:

```typescript
const xpAta = getAssociatedTokenAddressSync(
  xpMintPubkey,
  walletPubkey,
  false,
  TOKEN_2022_PROGRAM_ID
);

const balance = await provider.connection.getTokenAccountBalance(xpAta);
const xpAmount = Number(balance.value.amount);
```

### Create XP Token Account

Before a learner can receive XP, they need a Token-2022 ATA. Your backend should create this before calling `complete_lesson`:

```typescript
const ix = createAssociatedTokenAccountInstruction(
  payer,
  xpAta,
  walletPubkey,
  xpMintPubkey,
  TOKEN_2022_PROGRAM_ID
);
```

---

## Credential Queries (Helius DAS API)

Credential NFTs are Metaplex Core assets. Query via Helius DAS:

```typescript
const response = await fetch(HELIUS_RPC_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: "1",
    method: "getAssetsByOwner",
    params: { ownerAddress: walletAddress, page: 1, limit: 100 },
  }),
});

const data = await response.json();

// Filter by track collection
const credentials = data.result.items.filter(
  item => item.grouping?.find(
    g => g.group_key === "collection" && g.group_value === trackCollectionAddress
  )
);

// Read credential attributes
for (const cred of credentials) {
  const attrs = cred.content?.metadata?.attributes;
  // { track_id, level, courses_completed, total_xp }
}
```

---

## Events

Listen for program events via transaction logs:

```typescript
program.addEventListener("LessonCompleted", (event) => {
  // event.learner, event.course, event.lessonIndex, event.xpEarned, event.timestamp
});

program.addEventListener("CourseFinalized", (event) => {
  // event.learner, event.course, event.totalXp, event.bonusXp, event.creator, event.creatorXp
});

program.addEventListener("AchievementAwarded", (event) => {
  // event.achievementId, event.recipient, event.asset, event.xpReward
});
```

All 15 events: `ConfigUpdated`, `CourseCreated`, `CourseUpdated`, `Enrolled`, `LessonCompleted`, `CourseFinalized`, `EnrollmentClosed`, `CredentialIssued`, `CredentialUpgraded`, `MinterRegistered`, `MinterRevoked`, `XpRewarded`, `AchievementAwarded`, `AchievementTypeCreated`, `AchievementTypeDeactivated`

**Note:** `XpRewarded.recipient` is the Token-2022 ATA address, not the wallet pubkey. Derive the wallet from the ATA or use associated token account lookup.

---

## Error Handling

```typescript
try {
  await program.methods.completeLesson(lessonIndex).accounts({...}).rpc();
} catch (err) {
  if (err.error?.errorCode?.code === "LessonAlreadyCompleted") {
    // Lesson already done — refresh UI
  } else if (err.error?.errorCode?.code === "CourseNotActive") {
    // Course deactivated — show message
  }
}
```

Common error codes:

| Code | When |
|------|------|
| `CourseNotActive` | Course deactivated |
| `LessonOutOfBounds` | Invalid lesson index |
| `LessonAlreadyCompleted` | Duplicate completion attempt |
| `CourseNotCompleted` | Finalize before all lessons done |
| `CourseAlreadyFinalized` | Double finalize |
| `CourseNotFinalized` | Credential before finalize |
| `PrerequisiteNotMet` | Missing prerequisite course |
| `UnenrollCooldown` | Close too early (24h cooldown) |
| `MinterNotActive` | Revoked minter |
| `MinterAmountExceeded` | Over per-call XP cap |
| `AchievementNotActive` | Deactivated achievement |
| `AchievementSupplyExhausted` | Max supply reached |
| `InvalidAmount` | Zero XP in reward_xp |
| `Unauthorized` | Wrong signer |

---

## Lesson Bitmap Helpers

Enrollment tracks completed lessons as a bitmap (`[u64; 4]` = 256 bits):

```typescript
function isLessonComplete(lessonFlags: BN[], lessonIndex: number): boolean {
  const wordIndex = Math.floor(lessonIndex / 64);
  const bitIndex = lessonIndex % 64;
  return !lessonFlags[wordIndex].and(new BN(1).shln(bitIndex)).isZero();
}

function countCompletedLessons(lessonFlags: BN[]): number {
  return lessonFlags.reduce((sum, word) => {
    let count = 0;
    let w = word.clone();
    while (!w.isZero()) {
      count += w.and(new BN(1)).toNumber();
      w = w.shrn(1);
    }
    return sum + count;
  }, 0);
}

function getCompletedLessonIndices(lessonFlags: BN[], lessonCount: number): number[] {
  const completed: number[] = [];
  for (let i = 0; i < lessonCount; i++) {
    if (isLessonComplete(lessonFlags, i)) completed.push(i);
  }
  return completed;
}
```

---

## Typical Frontend Flow

1. **Connect wallet** → derive configPda, fetch config for xpMint address
2. **Browse courses** → `program.account.course.all()` → filter active
3. **Check enrollment** → `fetchNullable(enrollmentPda)` → show progress or enroll button
4. **Enroll** → learner signs `enroll` tx (check prerequisites first)
5. **Complete lessons** → backend calls `complete_lesson` after verifying content completion
6. **Show progress** → read `enrollment.lessonFlags` bitmap → render progress bar
7. **Finalize** → backend calls `finalize_course` when all lessons done
8. **Issue credential** → backend calls `issue_credential` → NFT appears in wallet
9. **Show XP** → query Token-2022 ATA balance
10. **Show credentials** → Helius DAS `getAssetsByOwner` filtered by collection
