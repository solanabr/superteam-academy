# Superteam Academy — Architecture Reference

Quick-reference for developers. Full details in [SPEC.md](./SPEC.md).

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                          │
│                                                                     │
│  Wallet Adapter ─── Anchor Client ─── Helius DAS API               │
└────────┬──────────────────┬─────────────────┬───────────────────────┘
         │                  │                 │
         │ sign txs         │ read accounts   │ leaderboard + credentials
         │                  │                 │
┌────────▼──────────────────▼─────────────────▼───────────────────────┐
│                        BACKEND (API)                                │
│                                                                     │
│  Lesson validation ─── TX builder ─── DAS API queries ─── Queue    │
│                                                                     │
│  Holds: backend_signer keypair (rotatable via update_config)       │
└────────┬────────────────────────────────────────────────────────────┘
         │
         │ signed transactions
         │
┌────────▼────────────────────────────────────────────────────────────┐
│                    SOLANA (On-Chain Program)                         │
│                                                                     │
│  Config ──┬── Course ──── Enrollment ──── Credential (Metaplex Core NFT) │
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
| Enrollment | `["enrollment", course_id.as_bytes(), user.key()]` | Program | Yes |
| Credential | Metaplex Core NFT (1 per learner per track) | Metaplex Core program | No |

### Account Relationships

```
Config (singleton)
  │
  ├── xp_mint ──► XP Token Mint (Token-2022)
  │                  │
  │                  └──► Token Accounts (one per learner)
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
        ├── credential_asset (set by issue_credential)
        │
        └──► Credential (Metaplex Core NFT, one per learner per track)
              │
              ├── Collection per track (Config PDA = collection update authority)
              ├── Soulbound via PermanentFreezeDelegate plugin
              ├── Upgradeable: URI + Attributes plugin (level, courses, XP)
              └── Visible in Phantom, Backpack, Solflare
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
   │ Emit: Enrolled event                         │
   └─────────────────────────────────────────────┘

2. COMPLETE LESSONS (repeated per lesson)
   Backend ──sign──► complete_lesson(lesson_index)
   ┌─────────────────────────────────────────────┐
   │ Check: lesson_index < course.lesson_count    │
   │ Check: bit not already set                   │
   │ Set: lesson_flags bit                        │
   │ Mint: course.xp_per_lesson to learner        │
   │   (Token-2022 CPI)                          │
   │ Emit: LessonCompleted event                  │
   └─────────────────────────────────────────────┘

   (Backend enforces rate limits off-chain before signing)

3. FINALIZE COURSE
   Backend ──sign──► finalize_course()
   ┌─────────────────────────────────────────────┐
   │ Check: all bits set (popcount == lesson_count)│
   │ Mint: completion_bonus_xp to learner         │
   │ Mint: creator_reward_xp to creator           │
   │   (gated by min_completions_for_reward)      │
   │ Set: enrollment.completed_at = now           │
   │ Increment: course.total_completions          │
   │ Emit: CourseFinalized event (includes bonus_xp)│
   └─────────────────────────────────────────────┘

4. ISSUE CREDENTIAL
   Backend ──sign──► issue_credential(metadata_uri, credential_name)
   ┌─────────────────────────────────────────────┐
   │ Check: enrollment.completed_at.is_some()     │
   │ Check: enrollment.credential_asset           │
   │ If None: create Metaplex Core NFT (CPI)     │
   │   → PermanentFreezeDelegate + Attributes     │
   │   → Store asset pubkey in enrollment         │
   │ If Some: upgrade existing NFT (CPI)          │
   │   → Update URI + name + Attributes plugin    │
   │ Emit: CredentialIssued event                 │
   └─────────────────────────────────────────────┘

5. CLOSE ENROLLMENT (optional, reclaims rent)
   Learner ──sign──► close_enrollment()
   ┌─────────────────────────────────────────────┐
   │ Check: completed_at.is_some() OR              │
   │        (now - enrolled_at > 24h)             │
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
  │──────────────────────────────────────────────────►│
  │                                                    │
  │ 2. Returns: None (new) or Some(asset_pubkey)       │
  │◄──────────────────────────────────────────────────│
  │                                                    │
  │ 3a. If None: build createV2 TX                     │
  │     (new asset keypair, collection, plugins)       │
  │ 3b. If Some: build updateV1 + updatePluginV1 TX   │
  │     (update URI, name, Attributes)                 │
  │──────────────────────────────────────────────────►│
  │                                                    │
  │ 4. Metaplex Core CPI executes                      │
  │    (Config PDA signs as collection authority)       │
  │◄──────────────────────────────────────────────────│
  │                                                    │
  │ 5. TX confirmed                                    │
  │    NFT immediately visible in all wallets          │
  │◄──────────────────────────────────────────────────│
```

**Key:** Config PDA must be the update authority of each track collection NFT. No external indexer dependency for create-vs-upgrade decisions — `enrollment.credential_asset` stores the state on-chain.

---

## Instruction → Account Matrix

Which accounts each instruction reads/writes:

| Instruction | Config | Course | Enrollment | Credential | XP Mint | Token Accts |
| --- | --- | --- | --- | --- | --- | --- |
| initialize | **W** | | | | **W** (create) | |
| update_config | **W** | | | | | |
| create_course | R | **W** (create) | | | | |
| update_course | | **W** | | | | |
| enroll | | R | **W** (create) | | | |
| complete_lesson | R | R | **W** | | R | **W** (learner) |
| finalize_course | R | **W** | **W** | | R | **W** (learner + creator) |
| issue_credential | R | R | R | **W** | | |
| close_enrollment | | | **W** (close) | | | |

R = read, **W** = write, (create) = init, (close) = close account

---

## Account Sizes

| Account | Discriminator | Data | Reserved | Total | Rent |
| --- | --- | --- | --- | --- | --- |
| Config | 8 | 97 | 8 | ~113 | ~0.001 SOL |
| Course | 8 | ~208 | 8 | ~224 | ~0.002 SOL |
| Enrollment | 8 | ~114 | 4 | ~127 | ~0.001 SOL |
| Credential | — | ~200 (Metaplex Core asset) | — | ~200 | ~0.006 SOL |

---

## Compute Unit Budget

| Instruction | CU Budget | Primary Cost |
| --- | --- | --- |
| initialize | 50K | Config PDA + Token-2022 mint creation |
| update_config | 5K | Field updates |
| create_course | 15K | PDA creation |
| update_course | 10K | Field updates |
| enroll | 15K | PDA creation + prerequisite check |
| complete_lesson | 30K | Bitmap + Token-2022 CPI |
| finalize_course | 50K | Bitmap verify + 2x XP mint CPI (learner + creator) |
| issue_credential | 50-100K | Metaplex Core CPI (create or update) |
| close_enrollment | 5K | Account close |

---

## Error Handling Strategy

```
On-chain:                           Backend:
┌─────────────────────────┐        ┌─────────────────────────────────┐
│ Anchor error codes      │        │ Rate limiting (Redis/Upstash):  │
│ (AcademyError enum)     │        │   - Lessons per hour            │
│                         │        │   - XP per day                  │
│ checked_add/sub/mul     │        │                                 │
│ (no unchecked math)     │        │ Retry logic for:                │
│                         │        │   - TX confirmation failures    │
│ require!() macros       │        │   - Metaplex Core CPI failures   │
│ (fail fast)             │        │   - Blockhash expiry            │
│                         │        │                                 │
│                         │        │ Queue for:                      │
│                         │        │   - issue_credential failures   │
│                         │        │   (finalize_course already      │
│                         │        │    succeeded, XP is safe)       │
└─────────────────────────┘        └─────────────────────────────────┘
```

---

## Off-Chain Dependencies

| Service | Purpose | Fallback |
| --- | --- | --- |
| Helius DAS API | XP leaderboard, token indexing, credential NFT queries | Custom indexer on transaction logs |
| Arweave | Course content, credential metadata JSON | Content is immutable once uploaded |
| Squads | Multisig for platform authority | Single signer (reduced security) |

---

*For full implementation details, see [SPEC.md](./SPEC.md). For build order, see [IMPLEMENTATION_ORDER.md](./IMPLEMENTATION_ORDER.md). For deferred features, see [FUTURE_IMPROVEMENTS.md](./FUTURE_IMPROVEMENTS.md).*
