# XP Token Service

**Status**: Backend API implementation. Integrates with deployed devnet program.

## Devnet Program

| | Address |
|---|---|
| **Program ID** | `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf` |
| **XP Mint** | `xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3` |

---

## Overview

The XP Token Service manages the Token-2022 XP system. XP is soulbound (NonTransferable) and minted via the PermanentDelegate extension.

## Token Configuration

- **Mint**: Token-2022 with extensions:
  - `NonTransferable` - Cannot be transferred between wallets
  - `PermanentDelegate` - Program can mint/burn (used for XP rewards)
- **Decimals**: 0
- **Supply**: Dynamic (minted on XP earn)

## Functions to Implement

### 1. Get or Create XP ATA

```typescript
async function getOrCreateXpAta(
  owner: PublicKey,
  payer: Keypair,
  xpMint: PublicKey
): Promise<PublicKey>
```

Creates associated token account if it doesn't exist.

### 2. Get XP Balance

```typescript
async function getXpBalance(
  owner: PublicKey,
  xpMint: PublicKey
): Promise<number>
```

### 3. Get XP Balances for Multiple Users

```typescript
async function getXpBalances(
  owners: PublicKey[],
  xpMint: PublicKey
): Promise<Map<PublicKey, number>>
```

### 4. Get XP Mint Address

```typescript
async function getXpMintAddress(): Promise<PublicKey>
// From Config PDA: config.xpMint
```

### 5. Check XP ATA Exists

```typescript
async function xpAtaExists(
  owner: PublicKey,
  xpMint: PublicKey
): Promise<boolean>
```

## XP Calculation Utilities

### Calculate Completion Bonus

```typescript
function calculateCompletionBonus(
  xpPerLesson: number,
  lessonCount: number
): number {
  // floor((xpPerLesson * lessonCount) / 2)
  return Math.floor((xpPerLesson * lessonCount) / 2);
}
```

### Calculate Total XP for Course

```typescript
function calculateCourseTotalXp(
  xpPerLesson: number,
  lessonCount: number
): number {
  const lessonXp = xpPerLesson * lessonCount;
  const bonusXp = calculateCompletionBonus(xpPerLesson, lessonCount);
  return lessonXp + bonusXp;
}
```

### Calculate Creator Reward

```typescript
function calculateCreatorReward(
  course: Course,
  currentCompletions: number
): number {
  if (currentCompletions >= course.minCompletionsForReward) {
    return course.creatorRewardXp;
  }
  return 0;
}
```

## Token Account Schema

```typescript
interface XpTokenAccount {
  mint: PublicKey;           // XP mint address
  owner: PublicKey;          // Learner wallet
  amount: number;            // XP balance (u64)
  delegate: PublicKey | null; // Permanent delegate (program)
  state: 'initialized' | 'frozen';
}
```

## RPC Integration (Helius DAS API)

### Get XP Holders (Leaderboard)

```typescript
async function getXpLeaderboard(
  limit: number = 100
): Promise<LeaderboardEntry[]>

interface LeaderboardEntry {
  rank: number;
  wallet: PublicKey;
  xp: number;
}
```

### Get Token Holders

```typescript
async function getTokenHolders(
  xpMint: PublicKey,
  limit: number = 100
): Promise<TokenHolder[]>
```

### Get All XP Balances for Owner

```typescript
async function getOwnerXpTokens(
  owner: PublicKey
): Promise<Token[]>
// Filters for XP mint
```

## Minter Role Management

The backend signer is auto-registered as a minter. Additional minters can be registered:

### Register Minter

```typescript
interface RegisterMinterParams {
  minter: PublicKey;
  label: string;              // e.g., "irl-events", "community"
  maxXpPerCall: number;       // 0 = unlimited
}

async function registerMinter(
  params: RegisterMinterParams,
  authority: Keypair
): Promise<{ minterRolePda: PublicKey }>
```

### Revoke Minter

```typescript
async function revokeMinter(
  minter: PublicKey,
  authority: Keypair
): Promise<{ txHash: string }>
```

### Reward XP (Minter Action)

```typescript
async function rewardXp(
  amount: number,
  recipient: PublicKey,
  minter: Keypair
): Promise<{ tx>
```

## EventsHash: string }

- `XpRewarded` - Emitted when XP is minted
- `MinterRegistered` - New minter added
- `MinterRevoked` - Minter removed
