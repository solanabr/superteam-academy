# Credential Service

**Status**: Backend API implementation. Integrates with deployed devnet program.

## Devnet Program

| | Address |
|---|---|
| **Program ID** | `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf` |

---

## Overview

The Credential Service manages Metaplex Core NFT credentials. Credentials are soulbound (PermanentFreezeDelegate), wallet-visible, and upgradeable.

## Credential Types

1. **Track Credentials** - One per learner per track (Anchor, DeFi, etc.)
2. **Upgradable** - NFT address stays the same, attributes update

## Functions to Implement

### 1. Issue Credential (First in Track)

```typescript
interface IssueCredentialParams {
  learner: PublicKey;
  courseId: string;
  credentialName: string;      // e.g., "Anchor Developer"
  metadataUri: string;         // Arweave JSON
  coursesCompleted: number;   // Track completion count
  totalXp: number;            // Total XP in track
}

async function issueCredential(
  params: IssueCredentialParams,
  backendSigner: Keypair,
  payer: Keypair
): Promise<{
  credentialAsset: PublicKey;
  txHash: string;
}>
```

**On-chain accounts:**
- config (PDA) - update authority
- course (PDA)
- enrollment (PDA)
- learner (owner)
- credentialAsset (Keypair) - new NFT
- trackCollection (PDA for track)
- payer (signer)
- backendSigner (signer)
- mplCoreProgram
- systemProgram

### 2. Upgrade Credential (Subsequent Courses)

```typescript
interface UpgradeCredentialParams {
  learner: PublicKey;
  courseId: string;
  credentialAsset: PublicKey;  // Existing NFT
  newName: string;
  newMetadataUri: string;
  coursesCompleted: number;
  totalXp: number;
}

async function upgradeCredential(
  params: UpgradeCredentialParams,
  backendSigner: Keypair,
  payer: Keypair
): Promise<{ txHash: string }>
```

### 3. Check if Credential Exists

```typescript
async function hasCredential(
  learner: PublicKey,
  trackId: number
): Promise<{
  hasCredential: boolean;
  credentialAsset?: PublicKey;
}>
```

### 4. Get Credential Details

```typescript
interface CredentialDetails {
  asset: PublicKey;
  name: string;
  uri: string;
  attributes: CredentialAttributes;
  collection: PublicKey;
  owner: PublicKey;
  frozen: boolean;
}

interface CredentialAttributes {
  track_id: number;
  level: number;
  courses_completed: number;
  total_xp: number;
}

async function getCredentialDetails(
  asset: PublicKey
): Promise<CredentialDetails>
```

### 5. Get All Credentials for User

```typescript
async function getUserCredentials(
  owner: PublicKey
): Promise<CredentialDetails[]>
```

### 6. Fetch Credentials via Helius DAS

```typescript
async function fetchCredentialsByOwner(
  owner: PublicKey,
  trackCollection?: PublicKey
): Promise<DassCoreAsset[]>
```

## Credential Metadata Schema

```json
{
  "name": "Anchor Developer",
  "description": "Superteam Academy - Anchor Developer Track",
  "image": "arweave://...",
  "external_url": "https://superteam.academy/credentials/...",
  "attributes": [
    {
      "trait_type": "track_id",
      "value": 1
    },
    {
      "trait_type": "level",
      "value": 3
    },
    {
      "trait_type": "courses_completed",
      "value": 5
    },
    {
      "trait_type": "total_xp",
      "value": 5000
    }
  ]
}
```

## Track Collections

```typescript
const TRACK_COLLECTIONS: Record<number, PublicKey> = {
  1: new PublicKey("..."), // Anchor
  2: new PublicKey("..."), // DeFi
  3: new PublicKey("..."), // Mobile
  // ...
};

const TRACK_NAMES: Record<number, string> = {
  1: "Anchor Developer",
  2: "DeFi Specialist",
  3: "Mobile Developer",
};
```

## Credential Lifecycle

```
1. Learner enrolls in first course of track
2. Completes all lessons + finalizes course
3. Backend calls issue_credential (CREATE path)
4. Credential NFT created with track collection
5. Learner completes more courses in track
6. Backend calls issue_credential (UPGRADE path)
7. Credential attributes updated in-place
8. NFT address remains the same
```

## Errors

| Error | Description |
|-------|-------------|
| CredentialAlreadyIssued | Trying to create when one exists |
| CredentialAssetMismatch | Wrong asset in upgrade |
| CourseNotFinalized | Must finalize before credential |
| CredentialNotIssued | No credential to upgrade |

## Events

- `CredentialIssued` - New credential created
- `CredentialUpgraded` - Existing credential updated
