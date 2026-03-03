# Solana Blockchain Integration

## Table of Contents

- [On-Chain Architecture](#on-chain-architecture)
- [Program Account Structure](#program-account-structure)
- [PDA Derivation](#pda-derivation)
- [Transaction Builder](#transaction-builder)
- [XP Token System](#xp-token-system)
- [Credential NFT System](#credential-nft-system)
- [Achievement NFT System](#achievement-nft-system)
- [Enrollment Service](#enrollment-service)
- [Course Service](#course-service)
- [Helius DAS Integration](#helius-das-integration)
- [On-Chain to Off-Chain Bridge](#on-chain-to-off-chain-bridge)

---

## On-Chain Architecture

```mermaid
graph TB
    subgraph Program["Superteam Academy Program"]
        PID["Program ID<br/>ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf"]

        subgraph Instructions["16 Instructions"]
            I_COURSE["Course Management<br/>create_course, update_course,<br/>deactivate_course"]
            I_ENROLL["Enrollment<br/>enroll, close_enrollment"]
            I_LESSON["Progress<br/>complete_lesson, finalize_course"]
            I_CRED["Credentials<br/>issue_credential, upgrade_credential"]
            I_ACH["Achievements<br/>create_achievement_type,<br/>deactivate_achievement_type,<br/>award_achievement"]
            I_XP["XP<br/>reward_xp"]
            I_ADMIN["Admin<br/>initialize, register_minter,<br/>revoke_minter"]
        end

        subgraph PDAs["6 PDA Types"]
            PDA_GLOBAL["GlobalState"]
            PDA_COURSE["Course"]
            PDA_ENROLL["Enrollment"]
            PDA_ACHTYPE["AchievementType"]
            PDA_ACHRECEIPT["AchievementReceipt"]
            PDA_MINTER["MinterRole"]
        end

        subgraph Tokens["Token Integration"]
            TOK_XP["XP Mint (Token-2022)<br/>xpXPUjkfk7t4AJF..."]
            TOK_CRED["Credential NFTs<br/>Metaplex Core"]
            TOK_ACH["Achievement NFTs<br/>Metaplex Core"]
        end
    end

    I_LESSON --> PDA_ENROLL
    I_LESSON --> TOK_XP
    I_CRED --> TOK_CRED
    I_ACH --> TOK_ACH
    I_ACH --> TOK_XP
    I_ENROLL --> PDA_ENROLL
    I_ENROLL --> PDA_COURSE
```

---

## Program Account Structure

```mermaid
classDiagram
    class GlobalState {
        +PublicKey authority
        +PublicKey xpMint
        +u64 totalCoursesCreated
        +u64 totalEnrollments
        +u8 bump
    }

    class Course {
        +String courseId
        +PublicKey creator
        +[u8; 32] contentTxId
        +u16 version
        +u8 lessonCount
        +Difficulty difficulty
        +u64 xpPerLesson
        +u8 trackId
        +u8 trackLevel
        +Option~PublicKey~ prerequisite
        +u64 creatorRewardXp
        +u32 minCompletionsForReward
        +u32 totalCompletions
        +u32 totalEnrollments
        +bool isActive
        +i64 createdAt
        +i64 updatedAt
        +u8 bump
    }

    class Enrollment {
        +String courseId
        +PublicKey learner
        +i64 enrolledAt
        +Option~i64~ completedAt
        +Vec~u64~ lessonFlags
        +Option~PublicKey~ credentialAsset
        +u8 bump
    }

    class AchievementType {
        +String achievementId
        +String name
        +String metadataUri
        +PublicKey collection
        +u32 maxSupply
        +u32 currentSupply
        +u64 xpReward
        +bool isActive
    }

    class AchievementReceipt {
        +String achievementId
        +PublicKey asset
        +i64 awardedAt
    }

    GlobalState --> Course : manages
    Course --> Enrollment : tracks
    AchievementType --> AchievementReceipt : awards
```

---

## PDA Derivation

All PDAs are derived using the program ID and deterministic seeds:

```mermaid
graph LR
    subgraph Seeds["PDA Seeds"]
        S1["global_state"]
        S2["course + courseId"]
        S3["enrollment + courseId + learner"]
        S4["achievement_type + achievementId"]
        S5["achievement_receipt + achievementId + recipient"]
        S6["minter_role + wallet"]
    end

    subgraph Derivation["PublicKey.findProgramAddressSync"]
        D["Program ID:<br/>ACADBRCB3z..."]
    end

    subgraph Addresses["Derived PDAs"]
        A1["GlobalState PDA"]
        A2["Course PDA"]
        A3["Enrollment PDA"]
        A4["AchievementType PDA"]
        A5["AchievementReceipt PDA"]
        A6["MinterRole PDA"]
    end

    S1 --> D --> A1
    S2 --> D --> A2
    S3 --> D --> A3
    S4 --> D --> A4
    S5 --> D --> A5
    S6 --> D --> A6
```

### PDA Derivation Functions

| Function | Seeds | Returns |
|---|---|---|
| `deriveCoursePda(courseId)` | `["course", courseId]` | `[PublicKey, bump]` |
| `deriveEnrollmentPda(courseId, learner)` | `["enrollment", courseId, learner]` | `[PublicKey, bump]` |

---

## Transaction Builder

The `TransactionBuilder` class handles all backend-signed on-chain operations.

### Architecture

```mermaid
graph TB
    subgraph TransactionBuilder["TransactionBuilder Class"]
        CONFIG["Configuration<br/>connection, backendSigner,<br/>programId, xpMint"]

        subgraph BuildMethods["Build Methods (7)"]
            B1["buildCompleteLessonIx"]
            B2["buildFinalizeCourseIx"]
            B3["buildIssueCredentialIx"]
            B4["buildUpgradeCredentialIx"]
            B5["buildRewardXpIx"]
            B6["buildAwardAchievementIx"]
        end

        subgraph Convenience["Convenience Methods (2)"]
            C1["completeLesson"]
            C2["awardAchievement"]
        end

        subgraph Execution["Execution Layer"]
            E1["executeTransaction<br/>Simulate, sign, send, confirm"]
            E2["executeWithRetry<br/>3 retries, exponential backoff"]
        end
    end

    BuildMethods --> E1
    Convenience --> BuildMethods
    E1 --> E2
```

### Transaction Execution Pipeline

```mermaid
sequenceDiagram
    participant Caller
    participant TB as TransactionBuilder
    participant Chain as Solana RPC

    Caller->>TB: buildXxxIx(params)
    TB->>TB: Derive PDAs
    TB->>TB: Create AnchorProvider with backendSigner
    TB->>TB: Build instruction via program.methods
    TB-->>Caller: BuiltInstruction { transaction, additionalSigners }

    Caller->>TB: executeTransaction(tx, signers)
    TB->>Chain: Simulate transaction
    alt Simulation Fails
        Chain-->>TB: SimulationError
        TB-->>Caller: Throw error
    end
    TB->>TB: Set blockhash, sign with backendSigner + additionalSigners
    TB->>Chain: sendRawTransaction()
    TB->>Chain: confirmTransaction(signature, timeout: 60s)
    alt Confirmation Timeout
        Chain-->>TB: TimeoutError
        TB-->>Caller: Throw error
    end
    Chain-->>TB: { slot }
    TB-->>Caller: TransactionResult { signature, slot }
```

### Retry Logic

The `executeWithRetry` method provides automatic retry for transient failures:

| Parameter | Value |
|---|---|
| Max Retries | 3 |
| Backoff | Exponential (1s, 2s, 4s) |
| Retryable Errors | Network timeouts, blockhash expiry, RPC 429/503 |
| Non-Retryable | Insufficient funds, invalid params, program errors |

---

## XP Token System

### Token Specifications

| Property | Value |
|---|---|
| Standard | SPL Token-2022 |
| Mint Address | `xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3` |
| Type | Soulbound (non-transferable) |
| Decimals | Default |
| ATA Program | TOKEN_2022_PROGRAM_ID |

### XP Token Flow

```mermaid
graph LR
    subgraph Sources["XP Sources"]
        LESSON["Lesson Completion<br/>xpPerLesson tokens"]
        FINAL["Course Finalization<br/>50% bonus"]
        ACH["Achievement Award<br/>Variable XP"]
        REWARD["Streak Milestone<br/>reward_xp with memo"]
    end

    subgraph Token["XP Token Operations"]
        ATA["Ensure ATA Exists<br/>Token-2022 ATA"]
        MINT["Mint XP Tokens<br/>Backend signer"]
        BAL["Query Balance<br/>getTokenAccountBalance"]
    end

    subgraph Display["Frontend Display"]
        LEVEL["Level Calculation<br/>10-level system"]
        LB["Leaderboard Rank<br/>Helius token holders"]
    end

    LESSON --> ATA --> MINT
    FINAL --> ATA
    ACH --> ATA
    REWARD --> ATA
    MINT --> BAL
    BAL --> LEVEL
    BAL --> LB
```

### XP Service Functions

| Function | Description |
|---|---|
| `deriveXpAta(owner)` | Derive Token-2022 ATA address |
| `xpAtaExists(connection, owner)` | Check if ATA exists |
| `ensureXpAta(connection, owner, payer)` | Create ATA if missing |
| `buildCreateXpAtaInstruction(owner, payer)` | Build ATA creation instruction (for bundling) |
| `getXpBalance(connection, owner)` | Get XP balance (returns 0 if no ATA) |
| `getXpBalances(connection, owners[])` | Batch balance query via getMultipleAccountsInfo |

### Level Thresholds

| Level | XP Required | Cumulative |
|---|---|---|
| 1 | 0 | 0 |
| 2 | 1,000 | 1,000 |
| 3 | 2,500 | 2,500 |
| 4 | 5,000 | 5,000 |
| 5 | 10,000 | 10,000 |
| 6 | 20,000 | 20,000 |
| 7 | 35,000 | 35,000 |
| 8 | 55,000 | 55,000 |
| 9 | 80,000 | 80,000 |
| 10 | 120,000 | 120,000 |

---

## Credential NFT System

### Credential Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Enrolled: enroll()
    Enrolled --> InProgress: complete_lesson() (bitmap update)
    InProgress --> InProgress: complete_lesson() (more lessons)
    InProgress --> Finalized: finalize_course() (all lessons done)
    Finalized --> Credentialed: issue_credential() (mint NFT)
    Credentialed --> Upgraded: upgrade_credential() (subsequent course)

    note right of Finalized
        50% bonus XP awarded
        Creator reward XP if threshold met
    end note

    note right of Credentialed
        Soulbound Metaplex Core NFT
        Contains track, level, courses, XP metadata
    end note
```

### Credential Service Functions

| Function | Description |
|---|---|
| `issueCredential(connection, signer, payer, params)` | Mint new credential NFT |
| `upgradeCredential(connection, signer, payer, params)` | Update existing credential metadata |
| `checkCredentialStatus(connection, courseId, learner)` | Check if credential exists |
| `getCredentialDetails(assetId)` | Fetch credential via Helius DAS |
| `getUserCredentials(ownerAddress, trackCollections?)` | Get all user credentials |
| `hasTrackCredential(ownerAddress, trackCollection)` | Check track credential ownership |

### Track Collections

| Track ID | Track Name |
|---|---|
| 1 | Anchor Developer |
| 2 | DeFi Specialist |
| 3 | Mobile Developer |
| 4 | Pinocchio Developer |
| 5 | Token Engineer |

---

## Achievement NFT System

### Achievement Architecture

```mermaid
graph TB
    subgraph Definitions["Achievement Definitions (13)"]
        P["Progress (4)<br/>First Steps, Course Completer,<br/>Knowledge Seeker, Scholar"]
        S["Streak (3)<br/>Week Warrior, Monthly Master,<br/>Consistency King"]
        SK["Skills (4)<br/>Rust Rookie, Anchor Novice,<br/>Anchor Expert, Full Stack Solana"]
        SP["Special (2)<br/>Early Adopter, Speed Runner"]
    end

    subgraph OnChain["On-Chain Operations"]
        CREATE["createAchievementType<br/>Creates NFT collection"]
        AWARD["awardAchievement<br/>Mints NFT + XP"]
        DEACTIVATE["deactivateAchievementType<br/>Stops new awards"]
    end

    subgraph Checks["Guard Checks"]
        HAS["hasAchievement<br/>AchievementReceipt PDA"]
        MAX["maxSupply Check<br/>currentSupply < maxSupply"]
    end

    P --> AWARD
    S --> AWARD
    SK --> AWARD
    SP --> AWARD
    AWARD --> HAS
    AWARD --> MAX
```

### Achievement Definitions

| ID | Name | Category | XP Reward | Condition |
|---|---|---|---|---|
| `first-steps` | First Steps | Progress | 50 | Complete first lesson |
| `course-completer` | Course Completer | Progress | 100 | Complete first course |
| `five-courses` | Knowledge Seeker | Progress | 500 | Complete 5 courses |
| `ten-courses` | Scholar | Progress | 1,000 | Complete 10 courses |
| `week-warrior` | Week Warrior | Streak | 100 | 7-day streak |
| `monthly-master` | Monthly Master | Streak | 500 | 30-day streak |
| `consistency-king` | Consistency King | Streak | 2,000 | 100-day streak |
| `rust-rookie` | Rust Rookie | Skill | 100 | 5 Rust lessons |
| `anchor-novice` | Anchor Novice | Skill | 100 | Anchor basics |
| `anchor-expert` | Anchor Expert | Skill | 500 | Anchor track |
| `full-stack-solana` | Full Stack Solana | Skill | 1,000 | All Solana tracks |
| `early-adopter` | Early Adopter | Special | 500 | Join during beta |
| `speed-runner` | Speed Runner | Special | 300 | Course in 24 hours |

---

## Enrollment Service

### Enrollment Flow with Prerequisites

```mermaid
sequenceDiagram
    participant Client
    participant EnrollSvc as Enrollment Service
    participant Chain as Solana Program

    Client->>EnrollSvc: buildEnrollTransaction(courseId, learner)
    EnrollSvc->>Chain: Fetch Course account
    Chain-->>EnrollSvc: Course data (prerequisite field)

    alt Course Has Prerequisite
        EnrollSvc->>EnrollSvc: Derive prerequisite Course PDA
        EnrollSvc->>EnrollSvc: Derive prerequisite Enrollment PDA
        EnrollSvc->>EnrollSvc: Add as remaining_accounts
    end

    EnrollSvc->>EnrollSvc: Derive enrollment PDA
    EnrollSvc->>EnrollSvc: Build enroll instruction
    EnrollSvc-->>Client: Transaction (ready for user signature)

    Client->>Chain: Send transaction (user signs)
    Chain->>Chain: Verify prerequisites via remaining_accounts
    Chain->>Chain: Create Enrollment PDA
    Chain-->>Client: Confirmation
```

### Enrollment Service Functions

| Function | Description |
|---|---|
| `buildEnrollTransaction(connection, courseId, learner, prerequisiteCourseId?)` | Build enrollment tx with prerequisite handling |
| `fetchEnrollment(connection, courseId, learner)` | Fetch enrollment state |
| `checkPrerequisiteMet(connection, courseId, learner)` | Check prerequisite completion |
| `buildCloseEnrollmentTransaction(connection, courseId, learner)` | Build close enrollment tx (24h cooldown for incomplete) |

### Lesson Completion Bitmap

Lesson progress is tracked using a bitmap pattern in the `lessonFlags` field:

```mermaid
graph LR
    subgraph Bitmap["lessonFlags: Vec<u64>"]
        B0["u64[0]: Lessons 0-63"]
        B1["u64[1]: Lessons 64-127"]
        B2["u64[2]: Lessons 128-191"]
    end

    subgraph Operations["Bitmap Operations"]
        SET["Set bit: flags[i/64] |= (1 << i%64)"]
        CHECK["Check bit: (flags[i/64] >> i%64) & 1"]
        COUNT["Count: popcount each u64"]
    end

    Bitmap --> Operations
```

---

## Course Service

### Course Data Flow

```mermaid
graph TB
    subgraph OnChain["On-Chain (Source of Truth)"]
        ACCOUNTS["Course PDA Accounts"]
    end

    subgraph Service["Course Service Layer"]
        FETCH["fetchAllCourses()"]
        PAGINATE["fetchCoursesPaginated()"]
        ACTIVE["fetchActiveCourses()"]
        BY_ID["fetchCourseById()"]
        BY_TRACK["fetchCoursesByTrack()"]
        BY_CREATOR["fetchCoursesByCreator()"]
        STATS["fetchCourseStats()"]
    end

    subgraph CMS["CMS Content (Sanity)"]
        CONTENT["Course Content<br/>Lessons, Media, Instructions"]
    end

    subgraph Frontend["Frontend Display"]
        CATALOG["Course Catalog"]
        DETAIL["Course Detail"]
        EDITOR["Code Editor"]
    end

    ACCOUNTS --> FETCH
    FETCH --> PAGINATE
    FETCH --> ACTIVE
    FETCH --> BY_TRACK
    FETCH --> BY_CREATOR
    FETCH --> STATS
    ACCOUNTS --> BY_ID

    FETCH --> CATALOG
    BY_ID --> DETAIL
    CONTENT --> DETAIL
    CONTENT --> EDITOR
```

---

## Helius DAS Integration

### Helius Service Architecture

```mermaid
graph TB
    subgraph HeliusDAS["Helius DAS API"]
        RPC["JSON-RPC Endpoint<br/>helius-rpc.com"]
    end

    subgraph Methods["DAS Methods"]
        M1["getAssetsByOwner<br/>All wallet assets"]
        M2["getAssetsByGroup<br/>Collection assets"]
        M3["getAsset<br/>Single asset detail"]
        M4["getTokenAccounts<br/>XP token holders"]
    end

    subgraph UseCases["Application Use Cases"]
        UC1["Credential Display<br/>getUserCredentials()"]
        UC2["Leaderboard<br/>getXpTokenHolders()"]
        UC3["Achievement Gallery<br/>Filter by collection"]
        UC4["Credential Detail<br/>getCredentialDetails()"]
    end

    subgraph Reliability["Reliability Layer"]
        RETRY["withRetry<br/>3 retries, exponential backoff"]
        TRANSIENT["isTransientError<br/>Network, 429, 503"]
    end

    Methods --> RPC
    UseCases --> Methods
    Methods --> Reliability
```

---

## On-Chain to Off-Chain Bridge

### Event Processing Pipeline

```mermaid
sequenceDiagram
    participant Chain as Solana Program
    participant Listener as Event Listener
    participant Handler as Event Handlers
    participant Queue as Job Queue
    participant DB as PostgreSQL
    participant Webhook as Webhook Dispatcher

    Chain->>Chain: Emit program event
    Listener->>Chain: Poll for new events
    Chain-->>Listener: Event data (slot, tx_hash)

    Listener->>DB: Insert event_log (processed: false)
    Listener->>Handler: Route event by type

    alt Enrollment Event
        Handler->>DB: Create/update enrollment records
    end

    alt Completion Event
        Handler->>DB: Update streak_activity
        Handler->>DB: Check achievement criteria
    end

    alt Achievement Event
        Handler->>DB: Record achievement award
    end

    Handler->>DB: Mark event_log as processed
    Handler->>Queue: Enqueue notification jobs

    Queue->>Webhook: Deliver webhook payloads
    Queue->>DB: Update job status
```

### Data Synchronization

| Data Type | Source of Truth | Sync Direction | Mechanism |
|---|---|---|---|
| Course catalog | On-chain | Chain to Frontend | Direct RPC query |
| Enrollment status | On-chain | Chain to Frontend | Direct RPC query |
| Lesson progress | On-chain (bitmap) | Chain to Frontend | Direct RPC query |
| XP balance | On-chain (Token-2022) | Chain to Frontend | Direct RPC / Helius DAS |
| Credentials | On-chain (Metaplex Core) | Chain to Frontend | Helius DAS API |
| Achievements | On-chain + DB | Bidirectional | Event listener sync |
| Streaks | Off-chain (DB) | DB to Frontend | Prisma queries |
| Community data | Off-chain (DB) | DB to Frontend | Prisma queries |
| Leaderboard | On-chain (snapshots) | Cron sync | `/api/cron/sync-xp-snapshots` |
