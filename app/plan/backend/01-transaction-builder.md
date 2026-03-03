# Transaction Builder Service

## Overview

The Transaction Builder Service is the core service that constructs and signs transactions for the backend. It acts as the backend signer that co-signs lesson completions, course finalization, and credential issuance.

## Program ID

**Devnet Deployment**

| | Address |
|---|---|
| **Program** | `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf` |
| **XP Mint** | `xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3` |

## Responsibilities

1. **Transaction Construction** - Build valid Anchor instructions
2. **Backend Signing** - Sign transactions with backend_signer keypair
3. **Transaction Submission** - Send to RPC and handle confirmation
4. **Key Rotation Support** - Handle backend_signer rotation via update_config

## Account Keys Required

| Key | Source |
|-----|--------|
| backend_signer | Stored in Config PDA, rotatable |
| backend_signer_nonce | Config PDA bump |

## Functions to Implement

### 1. Build Complete Lesson Transaction

```typescript
async function buildCompleteLessonTx(
  learner: PublicKey,
  courseId: string,
  lessonIndex: number
): Promise<Transaction>
```

**Required Accounts:**
- config (PDA: ["config"])
- course (PDA: ["course", courseId])
- enrollment (PDA: ["enrollment", courseId, learner])
- learner (ATA for XP)
- xpMint (from Config)
- backend_signer (signer)
- tokenProgram (Token-2022)

### 2. Build Finalize Course Transaction

```typescript
async function buildFinalizeCourseTx(
  learner: PublicKey,
  courseId: string
): Promise<Transaction>
```

**Required Accounts:**
- config (PDA)
- course (PDA)
- enrollment (PDA)
- learner (ATA)
- creator (ATA for creator reward)
- xpMint
- backend_signer (signer)
- tokenProgram

### 3. Build Issue Credential Transaction

```typescript
async function buildIssueCredentialTx(
  learner: PublicKey,
  courseId: string,
  credentialName: string,
  metadataUri: string,
  coursesCompleted: number,
  totalXp: number
): Promise<Transaction>
```

**Required Accounts:**
- config (PDA)
- course (PDA)
- enrollment (PDA)
- credentialAsset (Keypair - new NFT)
- trackCollection (from course.trackId)
- payer
- backend_signer (signer)
- mplCoreProgram

### 4. Build Upgrade Credential Transaction

```typescript
async function buildUpgradeCredentialTx(
  learner: PublicKey,
  courseId: string,
  credentialAsset: PublicKey,
  credentialName: string,
  metadataUri: string,
  coursesCompleted: number,
  totalXp: number
): Promise<Transaction>
```

### 5. Transaction Execution

```typescript
async function executeTransaction(
  tx: Transaction,
  signers: Keypair[]
): Promise<{ txHash: string; blockTime: number }>
```

## Error Handling

| Error | Action |
|-------|--------|
| BlockhashExpired | Refresh and retry |
| TransactionExpired | Rebuild and retry |
| InsufficientFunds | Alert and queue |
| CPI Error | Log and alert |

## Security Considerations

- Backend signer key stored in AWS KMS (recommended)
- Key rotation via update_config instruction
- Rate limiting per learner
- Transaction deduplication
