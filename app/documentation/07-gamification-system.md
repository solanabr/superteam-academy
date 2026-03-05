# Gamification System

## Table of Contents

- [Gamification Architecture](#gamification-architecture)
- [XP System](#xp-system)
- [Level Progression](#level-progression)
- [Streak System](#streak-system)
- [Achievement System](#achievement-system)
- [Daily Challenges](#daily-challenges)
- [Credential System](#credential-system)

---

## Gamification Architecture

```mermaid
graph TB
    subgraph User["User Actions"]
        LOGIN["Daily Login"]
        LESSON["Complete Lesson"]
        COURSE["Finalize Course"]
        CHALLENGE["Complete Challenge"]
    end

    subgraph Rewards["Reward Distribution"]
        subgraph OnChain["On-Chain - Permanent"]
            XP_MINT["XP Token Mint - SPL Token-2022"]
            CRED_NFT["Credential NFTs - Metaplex Core"]
            ACH_NFT["Achievement NFTs - Metaplex Core"]
        end

        subgraph OffChain["Off-Chain - Database"]
            STREAK_DB["Streak Records - daily_login_streaks"]
            ACTIVITY_DB["Activity Log - streak_activity"]
            OFFCHAIN_XP["Off-Chain XP - profiles.offchain_xp"]
        end
    end

    subgraph Display["Frontend Display"]
        LEVEL_UI["Level Badge"]
        XP_BAR["XP Progress Bar"]
        STREAK_UI["Streak Counter"]
        ACH_UI["Achievement Gallery"]
        LB_UI["Leaderboard Rank"]
    end

    LOGIN --> OFFCHAIN_XP
    LOGIN --> STREAK_DB
    LESSON --> XP_MINT
    LESSON --> ACTIVITY_DB
    COURSE --> XP_MINT
    COURSE --> CRED_NFT
    CHALLENGE --> XP_MINT

    XP_MINT --> LEVEL_UI
    XP_MINT --> XP_BAR
    XP_MINT --> LB_UI
    STREAK_DB --> STREAK_UI
    ACH_NFT --> ACH_UI

    subgraph Feedback["User Feedback"]
        TOAST["goeyToast - Success/error notifications"]
        CLAIM_POPUP["ClaimXpPopup - Daily streak celebration"]
    end

    LOGIN --> CLAIM_POPUP
    LESSON --> TOAST
    COURSE --> TOAST
```

---

## XP System

### XP Sources and Amounts

| Source | XP Amount | Storage | Persistence |
|---|---|---|---|
| Lesson completion | `xpPerLesson` (course-defined) | On-chain token | Permanent |
| Course finalization bonus | `floor(xpPerLesson * lessonCount / 2)` | On-chain token | Permanent |
| Creator reward XP | `creatorRewardXp` (if threshold met) | On-chain token | Permanent |
| Achievement award | Variable (50-2000) | On-chain token | Permanent |
| Streak milestone | Variable XP | On-chain token (via `reward_xp`) | Permanent |
| Daily login | Incremental | Off-chain (`profiles.offchain_xp`) | Resets on streak break |

### XP Calculation Functions

```mermaid
graph LR
    subgraph Calculations["XP Calculation Module"]
        BONUS["calculateCompletionBonus: floor xpPerLesson * lessonCount / 2"]
        TOTAL["calculateCourseTotalXp: lessonXp + bonus"]
        CREATOR["calculateCreatorReward: reward if completions meet threshold"]
        LEVEL_CALC["calculateLevel: XP to level 1-10"]
        PROGRESS["getLevelProgress: percent within current level"]
    end
```

### XP Flow: Lesson to Leaderboard

```mermaid
sequenceDiagram
    participant Student
    participant API
    participant TxBuilder as Transaction Builder
    participant Solana
    participant Helius as Helius DAS

    Student->>API: Complete lesson
    API->>TxBuilder: buildCompleteLessonIx()
    TxBuilder->>Solana: complete_lesson (mint xpPerLesson)
    Solana-->>TxBuilder: TX confirmed

    Note over Solana: XP tokens now in student's ATA

    Student->>API: Check balance
    API->>Solana: getTokenAccountBalance(ATA)
    Solana-->>API: Balance (e.g., 5000)
    API->>API: calculateLevel(5000) = Level 4
    API-->>Student: { xp: 5000, level: 4, progress: 0% }

    Note over Helius: Periodic leaderboard sync
    API->>Helius: getXpTokenHolders(xpMint)
    Helius-->>API: Sorted holder list
    API-->>Student: Leaderboard rank
```

---

## Level Progression

### Level Thresholds

```mermaid
graph LR
    L1["Level 1: 0 XP"]
    L2["Level 2: 1,000 XP"]
    L3["Level 3: 2,500 XP"]
    L4["Level 4: 5,000 XP"]
    L5["Level 5: 10,000 XP"]
    L6["Level 6: 20,000 XP"]
    L7["Level 7: 35,000 XP"]
    L8["Level 8: 55,000 XP"]
    L9["Level 9: 80,000 XP"]
    L10["Level 10: 120,000 XP"]

    L1 --> L2 --> L3 --> L4 --> L5
    L5 --> L6 --> L7 --> L8 --> L9 --> L10

    style L1 fill:#95a5a6,color:#fff
    style L2 fill:#3498db,color:#fff
    style L3 fill:#2ecc71,color:#fff
    style L4 fill:#f1c40f,color:#000
    style L5 fill:#e67e22,color:#fff
    style L6 fill:#e74c3c,color:#fff
    style L7 fill:#9b59b6,color:#fff
    style L8 fill:#1abc9c,color:#fff
    style L9 fill:#c0392b,color:#fff
    style L10 fill:#f39c12,color:#fff
```

### Level Calculation Logic

| Function | Input | Output | Description |
|---|---|---|---|
| `calculateLevel(xp)` | XP amount | 1-10 | Current level |
| `getXpForLevel(level)` | Level number | XP threshold | XP needed to reach level |
| `getNextLevelXp(xp)` | Current XP | XP threshold | XP needed for next level |
| `getLevelProgress(xp)` | Current XP | 0-100% | Progress within current level |

---

## Streak System

### Dual Streak Model

```mermaid
graph TB
    subgraph DailyLogin["Daily Login Streaks"]
        DLS["daily_login_streaks - One record per user"]
        DLS_FIELDS["current_streak: int, longest_streak: int, last_login_date: date, total_login_xp: int, streak_broken: bool"]
    end

    subgraph ActivityStreaks["Activity Streaks"]
        AS["streaks - One record per user"]
        AS_FIELDS["current_streak: int, longest_streak: int, last_activity_date: date, freeze_count: int max 3, max_freezes: int"]
    end

    subgraph Activity["streak_activity - One record per user per day"]
        SA_FIELDS["activity_date, xp_earned, lessons_completed, courses_completed"]
    end

    DLS --> DLS_FIELDS
    AS --> AS_FIELDS
    Activity --> SA_FIELDS
```

### Streak Lifecycle

```mermaid
stateDiagram-v2
    [*] --> NoStreak: First visit
    NoStreak --> Active: Daily login
    Active --> Active: Consecutive day login
    Active --> AtRisk: Missed 1 day (freeze available)
    AtRisk --> Active: Use streak freeze
    AtRisk --> Broken: No freeze available
    Active --> Broken: Missed day (no freeze)
    Broken --> Active: New login (reset streak)

    state Active {
        [*] --> Day1
        Day1 --> Day7: 7-day milestone (100 XP)
        Day7 --> Day30: 30-day milestone (500 XP)
        Day30 --> Day100: 100-day milestone (2000 XP)
    }

    note right of Broken
        current_streak resets to 0
        offchain_xp resets to 0
        longest_streak preserved
    end note
```

### Streak Milestones

| Milestone | Days | XP Reward | On-Chain |
|---|---|---|---|
| Week Warrior | 7 | 100 | `reward_xp` with memo |
| Monthly Master | 30 | 500 | `reward_xp` with memo |
| Consistency King | 100 | 2,000 | `reward_xp` with memo |

### Streak API Flow

```mermaid
sequenceDiagram
    participant Client
    participant API as Streak API
    participant DB as PostgreSQL
    participant Chain as Solana

    Client->>API: POST /api/streak/checkin
    API->>DB: Get daily_login_streaks for user

    alt First Login Today
        API->>DB: Update current_streak++
        API->>DB: Update last_login_date
        API->>DB: Insert streak_activity record
        API->>DB: Update profiles.offchain_xp

        alt Milestone Reached
            API->>DB: Check streak_milestones not yet claimed
            API->>Chain: reward_xp recipient, amount, memo
            API->>DB: Insert streak_milestones record with tx_signature
        end
    else Already Checked In Today
        API-->>Client: alreadyCheckedIn true
    end

    API-->>Client: Streak data
```

### Frontend Feedback Components

| Action | Component | Behavior |
|--------|-----------|----------|
| Daily login XP claim | `ClaimXpPopup` | Full-screen celebratory overlay with XP animation. Only used for daily streak claims inside `DailyLoginStreak.tsx`. |
| Streak milestone reached | `goeyToast.success` | Toast: "Milestone reached! +{xp} XP" |
| Lesson/course XP earned | `goeyToast.success` | Toast with XP amount |
| Achievement unlocked | `goeyToast.success` | Toast: "Achievement unlocked!" |

---

## Achievement System

### Achievement Classification

```mermaid
graph TB
    subgraph Progress["Progress Achievements"]
        A1["First Steps - First lesson: 50 XP"]
        A2["Course Completer - First course: 100 XP"]
        A3["Knowledge Seeker - 5 courses: 500 XP"]
        A4["Scholar - 10 courses: 1000 XP"]
    end

    subgraph Streak_Ach["Streak Achievements"]
        A5["Week Warrior - 7-day: 100 XP"]
        A6["Monthly Master - 30-day: 500 XP"]
        A7["Consistency King - 100-day: 2000 XP"]
    end

    subgraph Skill["Skill Achievements"]
        A8["Rust Rookie - 5 Rust lessons: 100 XP"]
        A9["Anchor Novice - Anchor basics: 100 XP"]
        A10["Anchor Expert - Anchor track: 500 XP"]
        A11["Full Stack Solana - All tracks: 1000 XP"]
    end

    subgraph Special_Ach["Special Achievements"]
        A12["Early Adopter - Beta join: 500 XP"]
        A13["Speed Runner - 24h course: 300 XP"]
    end

    style Progress fill:#3498db,color:#fff
    style Streak_Ach fill:#e67e22,color:#fff
    style Skill fill:#2ecc71,color:#fff
    style Special_Ach fill:#9b59b6,color:#fff
```

### Achievement Award Flow

```mermaid
sequenceDiagram
    participant System as Achievement Check
    participant Service as Achievement Service
    participant Chain as Solana Program

    System->>Service: Check criteria met
    Service->>Service: hasAchievement(achievementId, recipient)
    alt Already Awarded
        Service-->>System: Skip (duplicate prevention)
    end
    Service->>Service: getAchievementDetails(achievementId)
    Service->>Service: Check maxSupply > currentSupply

    Service->>Chain: awardAchievement(achievementId, recipient, collection)
    Note over Chain: 1. Create AchievementReceipt PDA
    Note over Chain: 2. Mint Metaplex Core NFT
    Note over Chain: 3. Mint XP reward tokens
    Chain-->>Service: { asset, txHash }

    Service->>Service: Record in DB achievements table
    Service-->>System: Achievement awarded
```

---

## Daily Challenges

The challenge system provides daily goals to encourage consistent engagement:

```mermaid
graph TB
    subgraph Generation["Challenge Generation"]
        DAILY["Daily Reset - New challenges each day"]
    end

    subgraph Types["Challenge Types"]
        LESSON_C["Complete N lessons"]
        STREAK_C["Maintain streak"]
        COMMUNITY_C["Post in community"]
        TIME_C["Study for N minutes"]
    end

    subgraph Rewards_C["Challenge Rewards"]
        XP_R["XP bonus"]
        ACH_R["Achievement progress"]
    end

    DAILY --> Types
    Types --> Rewards_C
```

---

## Credential System

### Credential Architecture

```mermaid
graph TB
    subgraph Tracks["Learning Tracks"]
        T1["Track 1: Anchor Developer"]
        T2["Track 2: DeFi Specialist"]
        T3["Track 3: Mobile Developer"]
        T4["Track 4: Pinocchio Developer"]
        T5["Track 5: Token Engineer"]
    end

    subgraph Credentials["Credential NFTs"]
        C_ISSUE["Issue Credential - On course finalization"]
        C_UPGRADE["Upgrade Credential - Subsequent courses"]
    end

    subgraph Metadata["NFT Metadata"]
        META["Metaplex Core NFT - Soulbound, non-transferable"]
        ATTRS["Attributes: trackId, level, coursesCompleted, totalXp"]
    end

    T1 --> C_ISSUE
    T2 --> C_ISSUE
    T3 --> C_ISSUE
    T4 --> C_ISSUE
    T5 --> C_ISSUE

    C_ISSUE --> META
    C_UPGRADE --> META
    META --> ATTRS
```

### Credential Lifecycle

| Stage | Trigger | On-Chain Action |
|---|---|---|
| Enrollment | User enrolls in course | Enrollment PDA created |
| Lesson Progress | Each lesson completed | Bitmap updated, XP minted |
| Course Finalization | All lessons done | 50% bonus XP, creator reward |
| Credential Issue | First course in track | Metaplex Core NFT minted |
| Credential Upgrade | Subsequent track course | NFT metadata updated |
