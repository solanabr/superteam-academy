# Superteam Academy — Architecture Reference

Quick-reference for developers. Full details in [SPEC.md](./SPEC.md).

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                          │
│                                                                     │
│  Wallet Adapter ─── Anchor Client ─── Helius DAS ─── Metaplex SDK │
└────────┬──────────────────┬─────────────────┬──────────────┬────────┘
         │                  │                 │              │
         │ sign txs         │ read accounts   │ leaderboard  │ credentials
         │                  │                 │              │
┌────────▼──────────────────▼─────────────────▼──────────────▼────────┐
│                        BACKEND (API)                                │
│                                                                     │
│  Lesson validation ─── TX builder ─── KMS signer ─── Queue         │
│                                                                     │
│  Holds: backend_signer keypair (rotatable via update_config)       │
└────────┬────────────────────────────────────────────────────────────┘
         │
         │ signed transactions
         │
┌────────▼────────────────────────────────────────────────────────────┐
│                    SOLANA (On-Chain Program)                         │
│                                                                     │
│  Config ──┬── Course ──── Enrollment ──── Credential (Core NFT)    │
│           │                                                         │
│           └── LearnerProfile                                        │
│                                                                     │
│  XP Token (Token-2022: NonTransferable + PermanentDelegate)        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Account Map

### PDA Derivation

| Account | Seeds | Owner | Closeable |
| --- | --- | --- | --- |
| Config | `["config"]` | Program | No |
| Course | `["course", course_id.as_bytes()]` | Program | No |
| LearnerProfile | `["learner", user.key()]` | Program | No |
| Enrollment | `["enrollment", course_id.as_bytes(), user.key()]` | Program | Yes |
| Credential | Metaplex Core asset (per track collection, per learner) | Metaplex Core | No (soulbound) |

### Account Relationships

```
Config (singleton)
  │
  ├── current_mint ──► XP Token Mint (Token-2022)
  │                       │
  │                       └──► Token Accounts (one per learner per season)
  │
  ├── backend_signer (rotatable keypair)
  │
  └── authority (Squads multisig)

Course (one per course)
  │
  ├── creator ──► receives XP on student completion
  ├── authority ──► can update course
  ├── prerequisite ──► Option<Course PDA>
  │
  └──► Enrollment (one per learner per course)
        │
        ├── lesson_flags (bitmap, up to 256 lessons)
        ├── completed_at (set by finalize_course)
        ├── credential_asset (set by issue_credential, used for create-vs-upgrade)
        │
        └──► Credential (Metaplex Core NFT, one per learner per track)
              │
              ├── Attributes plugin (level, courses_completed, total_xp)
              ├── PermanentFreezeDelegate (soulbound)
              └── uri ──► Metadata JSON (image, traits)

LearnerProfile (one per learner)
  │
  ├── streak data (current, longest, last_activity, freezes)
  ├── achievement_flags (bitmap, 256 slots)
  ├── rate limiting (xp_earned_today, last_xp_day)
  └── referral tracking (count, has_referrer)
```

---

## Data Flow: Core Learning Loop

```
1. ENROLL
   Learner ──sign──► enroll(course_id)
   ┌─────────────────────────────────────────────┐
   │ Check: course.is_active                      │
   │ Check: prerequisite completed (if set)       │
   │ Create: Enrollment PDA                       │
   │ Snapshot: enrolled_version = course.version  │
   │ Emit: Enrolled event                         │
   └─────────────────────────────────────────────┘

2. COMPLETE LESSONS (repeated per lesson)
   Backend ──sign──► complete_lesson(lesson_index)
   ┌─────────────────────────────────────────────┐
   │ Check: lesson_index < course.lesson_count    │
   │ Check: bit not already set                   │
   │ Check: daily XP cap (config.max_daily_xp)   │
   │ Set: lesson_flags bit                        │
   │ Mint: course.xp_per_lesson to learner        │
   │ Update: streak (side effect, freezes stack)  │
   │ Emit: LessonCompleted event                  │
   └─────────────────────────────────────────────┘

3. FINALIZE COURSE
   Backend ──sign──► finalize_course()
   ┌─────────────────────────────────────────────┐
   │ Check: all bits set (popcount == lesson_count)│
   │ Mint: creator_reward_xp to creator           │
   │   (gated by min_completions_for_reward)      │
   │ Set: enrollment.completed_at = now           │
   │ Increment: course.total_completions          │
   │ Emit: CourseFinalized event                  │
   └─────────────────────────────────────────────┘

3b. CLAIM COMPLETION BONUS (learner-initiated)
   Learner ──sign──► claim_completion_bonus()
   ┌─────────────────────────────────────────────┐
   │ Check: enrollment.completed_at.is_some()     │
   │ Check: bonus not already claimed             │
   │ Check: daily XP cap                          │
   │ Mint: course.completion_bonus_xp to learner  │
   │ Emit: CompletionBonusClaimed event           │
   └─────────────────────────────────────────────┘

4. ISSUE CREDENTIAL
   Backend ──sign──► issue_credential(metadata_uri)
   ┌─────────────────────────────────────────────┐
   │ Check: enrollment.completed_at.is_some()     │
   │ Check: enrollment.credential_asset           │
   │ If None: CPI Metaplex Core createV2          │
   │   (PermanentFreezeDelegate + Attributes)     │
   │   Store asset pubkey in enrollment           │
   │ If Some: CPI updateV1 + updatePluginV1      │
   │ Emit: CredentialIssued event                 │
   └─────────────────────────────────────────────┘

5. CLOSE ENROLLMENT (optional, reclaims rent)
   Learner ──sign──► close_enrollment()
   ┌─────────────────────────────────────────────┐
   │ If completed: close freely                   │
   │ If incomplete: require 24h cooldown          │
   │ Close: account, return lamports to learner   │
   │ Emit: EnrollmentClosed event                 │
   └─────────────────────────────────────────────┘
```

---

## XP Token Architecture

```
Season 1                    Season 2                    Season 3
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│ Mint: S1_PUBKEY  │       │ Mint: S2_PUBKEY  │       │ Mint: S3_PUBKEY  │
│ Extensions:      │       │ Extensions:      │       │ Extensions:      │
│  NonTransferable │       │  NonTransferable │       │  NonTransferable │
│  PermanentDelegate       │  PermanentDelegate       │  PermanentDelegate
│  MetadataPointer │       │  MetadataPointer │       │  MetadataPointer │
│  TokenMetadata   │       │  TokenMetadata   │       │  TokenMetadata   │
└────────┬─────────┘       └────────┬─────────┘       └────────┬─────────┘
         │                          │                           │
    ┌────┴────┐                ┌────┴────┐                ┌────┴────┐
    │ ATA: A  │                │ ATA: A  │                │ ATA: A  │
    │ bal: 500│                │ bal: 800│                │ bal: 0  │
    ├─────────┤                ├─────────┤                ├─────────┤
    │ ATA: B  │                │ ATA: B  │                │ ATA: B  │
    │ bal: 300│                │ bal: 150│                │ bal: 0  │
    └─────────┘                └─────────┘                └─────────┘

    closed                     active                     future

Config.current_mint = S2_PUBKEY
Config.current_season = 2
Config.season_closed = false
```

---

## Metaplex Core Credential Flow

```
Backend                                              Solana
  │                                                    │
  │ 1. Read enrollment.credential_asset on-chain       │
  │───────────────────────────────────────────────────►│
  │                                                    │
  │ 2. Returns: Some(pubkey) or None                   │
  │◄───────────────────────────────────────────────────│
  │                                                    │
  │ 3. Build TX: issue_credential(metadata_uri)        │
  │    Program checks enrollment.credential_asset:     │
  │    If None: createV2 CPI → store asset in enrollment│
  │    If Some: updateV1 CPI                           │
  │    Sign with KMS (backend_signer)                  │
  │───────────────────────────────────────────────────►│
  │                                                    │
  │ 4. TX confirmed                                    │
  │◄───────────────────────────────────────────────────│
```

**No DAS API dependency for writes.** Create-vs-upgrade decision is fully on-chain via `enrollment.credential_asset`. DAS API is only used for **read queries** (leaderboards, wallet galleries, frontend display).

---

## Instruction → Account Matrix

Which accounts each instruction reads/writes:

| Instruction | Config | Course | Learner | Enrollment | Credential | XP Mint | Token Accts |
| --- | --- | --- | --- | --- | --- | --- | --- |
| initialize | **W** | | | | | | |
| create_season | **W** | | | | | **W** (create) | |
| close_season | **W** | | | | | | |
| update_config | **W** | | | | | | |
| create_course | R | **W** (create) | | | | | |
| update_course | | **W** | | | | | |
| init_learner | | | **W** (create) | | | | |
| enroll | | R | | **W** (create) | | | |
| complete_lesson | R | R | **W** | **W** | | R | **W** (learner) |
| finalize_course | R | **W** | | **W** | | R | **W** (creator) |
| claim_completion_bonus | R | R | **W** | R | | R | **W** (learner) |
| issue_credential | R | R | | **W** | **W** | | |
| claim_achievement | R | | **W** | | | R | **W** (learner) |
| award_streak_freeze | R | | **W** | | | | |
| register_referral | | | **W** (both) | | | | |
| close_enrollment | | | | **W** (close) | | | |

R = read, **W** = write, (create) = init, (close) = close account

---

## Account Sizes

| Account | Discriminator | Data | Reserved | Total | Rent |
| --- | --- | --- | --- | --- | --- |
| Config | 8 | 143 | 32 | ~183 | ~0.002 SOL |
| Course | 8 | ~202 | 16 | ~226 | ~0.002 SOL |
| LearnerProfile | 8 | ~87 | 16 | ~111 | ~0.001 SOL |
| Enrollment | 8 | ~124 | 8 | ~140 | ~0.001 SOL |
| Credential | — | ~200 | 0 | ~200 | ~0.006 SOL (Metaplex Core) |

---

## Compute Unit Budget

| Instruction | CU Budget | Primary Cost |
| --- | --- | --- |
| initialize | 5K | PDA creation |
| create_season | 50K | Token-2022 mint + extensions |
| close_season | 5K | Flag update |
| update_config | 5K | Field updates |
| create_course | 15K | PDA creation |
| update_course | 10K | Field updates |
| init_learner | 5K | PDA creation |
| enroll | 15K | PDA creation + prerequisite check |
| complete_lesson | 40K | Bitmap + Token-2022 CPI + streak |
| finalize_course | 80K | Bitmap verify + creator Token-2022 CPI |
| claim_completion_bonus | 30K | Token-2022 CPI + daily cap check |
| issue_credential | 50-100K | Metaplex Core CPI (create or update) |
| claim_achievement | 30K | Bitmap + Token-2022 CPI |
| award_streak_freeze | 5K | Counter increment |
| register_referral | 10K | Two account updates |
| close_enrollment | 5K | Account close |

---

## Error Handling Strategy

```
On-chain:                           Backend:
┌─────────────────────────┐        ┌─────────────────────────────────┐
│ Anchor error codes      │        │ Retry logic for:                │
│ (AcademyError enum)     │        │   - TX confirmation failures    │
│                         │        │   - DAS API query failures        │
│ checked_add/sub/mul     │        │   - Blockhash expiry            │
│ (no unchecked math)     │        │                                 │
│                         │        │ Queue for:                      │
│ require!() macros       │        │   - issue_credential failures   │
│ (fail fast)             │        │   (finalize_course already      │
│                         │        │    succeeded, XP is safe)       │
└─────────────────────────┘        └─────────────────────────────────┘
```

---

## Off-Chain Dependencies

| Service | Purpose | Fallback |
| --- | --- | --- |
| Helius DAS API | XP leaderboard, token indexing, credential NFT display (**reads only**) | Custom indexer on transaction logs |
| AWS KMS | Backend signer key storage and signing | HashiCorp Vault or GCP Cloud KMS |
| Arweave | Course content, credential metadata | Content is immutable once uploaded |
| Squads | Multisig for platform authority | Single signer (reduced security) |

**Note:** DAS API is not required for any write operations. All create-vs-upgrade decisions are on-chain via `enrollment.credential_asset`.

---

*For full implementation details, see [SPEC.md](./SPEC.md). For build order, see [IMPLEMENTATION_ORDER.md](./IMPLEMENTATION_ORDER.md). For deferred features, see [FUTURE_IMPROVEMENTS.md](./FUTURE_IMPROVEMENTS.md).*
