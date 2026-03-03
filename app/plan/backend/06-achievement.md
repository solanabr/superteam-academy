# Achievement Service

**Status**: Backend API implementation. Integrates with deployed devnet program.

## Devnet Program

| | Address |
|---|---|
| **Program ID** | `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf` |

---

## Overview

The Achievement Service manages achievement awards. Achievements are Metaplex Core NFTs with limited supply, awarded for special accomplishments.

## Achievement Types

- Limited supply (e.g., Hackathon Winner - 100 max)
- XP rewards on award
- One-time per recipient (prevented by AchievementReceipt PDA)

## Functions to Implement

### 1. Create Achievement Type

```typescript
interface CreateAchievementParams {
  achievementId: string;       // Unique ID (max 50 chars)
  name: string;                // Display name (max 100 chars)
  metadataUri: string;         // Arweave JSON
  collection: Keypair;         // New collection for this achievement
  maxSupply: number;           // 0 = unlimited
  xpReward: number;            // XP awarded on receipt
}

async function createAchievementType(
  params: CreateAchievementParams,
  authority: Keypair
): Promise<{
  achievementTypePda: PublicKey;
  collection: PublicKey;
}>
```

### 2. Deactivate Achievement Type

```typescript
async function deactivateAchievementType(
  achievementId: string,
  authority: Keypair
): Promise<{ txHash: string }>
```

### 3. Award Achievement

```typescript
interface AwardAchievementParams {
  achievementId: string;
  recipient: PublicKey;
  minter: Keypair;
  payer: Keypair;
}

async function awardAchievement(
  params: AwardAchievementParams
): Promise<{
  asset: PublicKey;
  txHash: string;
}>
```

**On-chain accounts:**
- config (PDA)
- achievementType (PDA)
- achievementReceipt (PDA) - init collision = already awarded
- minterRole (PDA)
- asset (Keypair) - new NFT
- collection (PDA)
- recipient (owner)
- recipientTokenAccount (XP ATA)
- xpMint
- payer (signer)
- minter (signer)
- mplCoreProgram
- tokenProgram (Token-2022)
- systemProgram

### 4. Check if Awarded

```typescript
async function hasAchievement(
  achievementId: string,
  recipient: PublicKey
): Promise<boolean>
```

### 5. Get Achievement Details

```typescript
interface AchievementDetails {
  achievementId: string;
  name: string;
  metadataUri: string;
  collection: PublicKey;
  maxSupply: number;
  currentSupply: number;
  xpReward: number;
  isActive: boolean;
}

async function getAchievementDetails(
  achievementId: string
): Promise<AchievementDetails>
```

### 6. Get User Achievements

```typescript
async function getUserAchievements(
  user: PublicKey
): Promise<AchievementReceipt[]>
```

### 7. Get All Achievement Types

```typescript
async function getAllAchievementTypes(): Promise<AchievementDetails[]>
async function getActiveAchievements(): Promise<AchievementDetails[]>
```

## Achievement Data Schema

```typescript
// On-chain AchievementType PDA (338 bytes)
interface OnChainAchievementType {
  discriminator: "achievement";
  achievementId: string;     // 50 bytes max
  name: string;               // 100 bytes max
  metadataUri: string;        // 100 bytes max (URL)
  collection: PublicKey;     // 32 bytes
  maxSupply: u32;             // 4 bytes (0 = unlimited)
  currentSupply: u32;        // 4 bytes
  xpReward: u32;              // 4 bytes
  isActive: bool;             // 1 byte
  bump: u8;                   // 1 byte
  reserved: [u8; 8];         // 8 bytes
}

// AchievementReceipt PDA (49 bytes)
interface OnChainAchievementReceipt {
  discriminator: "achievement_receipt";
  asset: PublicKey;           // 32 bytes
  awardedAt: i64;            // 8 bytes
  bump: u8;                   // 1 byte
  // No reserved - this account is small
}
```

## Achievement Metadata Schema

```json
{
  "name": "Hackathon Winner",
  "description": "Awarded for winning a Superteam Hackathon",
  "image": "arweave://...",
  "external_url": "https://superteam.academy/achievements/...",
  "attributes": [
    {
      "trait_type": "event",
      "value": "hackathon-2024"
    },
    {
      "trait_type": "type",
      "value": "winner"
    }
  ]
}
```

## Predefined Achievements

| ID | Name | Max Supply | XP Reward |
|----|------|------------|-----------|
| hackathon-winner | Hackathon Winner | 100 | 1000 |
| hackathon-participant | Hackathon Participant | 1000 | 200 |
| early-supporter | Early Supporter | 500 | 500 |
| streak-7 | 7-Day Streak | 0 (unlimited) | 100 |
| streak-30 | 30-Day Streak | 0 (unlimited) | 500 |
| top-creator | Top Course Creator | 50 | 1000 |

## Events

- `AchievementTypeCreated` - New achievement type defined
- `AchievementTypeDeactivated` - Achievement retired
- `AchievementAwarded` - Achievement minted to user
