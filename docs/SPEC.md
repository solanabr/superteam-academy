# Superteam Academy — On-Chain Program Specification

**Version:** 1.1 (Revised with Split Instructions)
**Network:** Solana Mainnet
**Framework:** Anchor + Light SDK (ZK Compression)

---

## Executive Summary

Superteam Academy is a decentralized learning platform for Solana development. This specification defines the on-chain program architecture that powers verifiable credentials, XP tracking, course registries, and creator incentives.

### Design Principles

1. **Tokens as state** — XP is a soulbound fungible token. Your balance is your score.
2. **Evolving credentials** — One ZK compressed credential per learning track that upgrades as you progress.
3. **Courses as factories** — Course PDAs spawn enrollment PDAs. Lessons are tracked by bitmap.
4. **Creators earn** — Course authors receive XP proportional to student completions.
5. **Minimal footprint** — Every byte justified. Closeable accounts. Reserved bytes for future-proofing.
6. **Compression first** — Credentials use ZK Compression (Light Protocol) for rent-free, scalable state.

### Key Metrics

| Metric | Value |
| --- | --- |
| Regular PDA types | 4 (Config, Course, LearnerProfile, Enrollment) |
| ZK compressed account types | 1 (Credential) |
| Instructions | 16 |
| Cost per learner/year | ~0.002 SOL |
| One-time setup cost | ~2 SOL (no merkle tree creation) |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           SOLANA MAINNET                                │
│                                                                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
│  │  XP Token         │  │  Config PDA      │  │  Course PDA          │  │
│  │  (Soulbound)      │  │  (Singleton)     │  │  (Factory)           │  │
│  │                   │  │                  │  │                      │  │
│  │  • Token-2022     │  │  • Authority     │  │  • Lesson count      │  │
│  │  • NonTransferable│  │  • Backend signer│  │  • Creator pubkey    │  │
│  │  • Permanent      │  │  • Current season│  │  • Prerequisite      │  │
│  │    Delegate       │  │  • Rate limit    │  │  • Spawns enrollments│  │
│  │  • 1 mint/season  │  │    caps          │  │                      │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────────┘  │
│                                                       │                 │
│  ┌──────────────────┐                    ┌────────────┴──────────────┐  │
│  │  Learner PDA     │                    │  Enrollment PDA           │  │
│  │  (Minimal)       │                    │  (Closeable)              │  │
│  │                  │                    │                           │  │
│  │  • Streak data   │                    │  • Lesson bitmap          │  │
│  │  • Achievement   │                    │  • Unenrollable           │  │
│  │    bits          │                    │  • Derived from course_id │  │
│  │  • Rate limiting │                    └───────────────────────────┘  │
│  │  • Referral info │                                                   │
│  └──────────────────┘                                                   │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  ZK COMPRESSED STATE (Light Protocol)                            │   │
│  │                                                                  │   │
│  │  Credential (one per learner-per-track)                          │   │
│  │  • Deterministic address: ["credential", learner, track_id]     │   │
│  │  • Track level, courses completed, XP earned                    │   │
│  │  • Metadata hash (Arweave) for display                          │   │
│  │  • No rent, no merkle tree setup, no Bubblegum dependency       │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                            OFF-CHAIN                                     │
│                                                                          │
│  • Content: Arweave (immutable, versioned via content_tx_id)            │
│  • Leaderboard: Indexed from XP token balances (Helius DAS API)        │
│  • Credentials: Indexed via Photon (Light Protocol indexer)            │
│  • Analytics: GA4 / PostHog / Sentry                                    │
│  • Community: Discord                                                    │
│  • Usernames: Wallet display names (SNS, Backpack) or frontend DB      │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 1. XP Token

### Overview

XP is a **soulbound fungible SPL token** using Token-2022. Your token balance equals your experience points. Non-transferable and non-burnable by users — only the platform can mint or burn.

### Token-2022 Configuration

```rust
let extensions = vec![
    ExtensionType::NonTransferable,     // Soulbound — no transfers
    ExtensionType::PermanentDelegate,   // Platform can burn; users cannot
    ExtensionType::MetadataPointer,     // Point to on-chain metadata
    ExtensionType::TokenMetadata,       // Name: "Superteam Academy XP S{n}"
];
```

`PermanentDelegate` gives the platform authority delegate rights over all token accounts, preventing users from burning their own XP (which would compromise leaderboard integrity) while allowing the platform to manage tokens for season resets.

### Seasons

Each season = new Token-2022 mint. The current mint is tracked in the Config PDA.

**Season lifecycle:**
```
create_season(2) → New mint created, Config updated
    │
    │  ... learners earn XP throughout season ...
    │
close_season() → Config marks season closed (no more minting)
    │
create_season(3) → New mint created, Config updated
```

Old season tokens remain in wallets as historical proof.

### Leaderboard (Off-Chain Derived)

```typescript
// Via Helius DAS API or custom indexer
const holders = await getTokenHolders(currentSeasonMint);
const leaderboard = holders
    .sort((a, b) => b.balance - a.balance)
    .map((h, i) => ({ rank: i + 1, wallet: h.owner, xp: h.balance }));
```

### Level Derivation

```typescript
function getLevel(xp: number): number {
    return Math.floor(Math.sqrt(xp / 100));
}
// 0-99 XP → Level 0, 100-399 → Level 1, 400-899 → Level 2, etc.
```

---

## 2. Config PDA (Singleton)

### Overview

Single configuration account that stores platform-wide settings. Replaces the previous XPMint PDA and adds rotatable backend signer, rate limit caps, and season tracking.

**Seeds:** `["config"]`

```rust
#[account]
pub struct Config {
    // === Authority (32 bytes) ===
    /// Platform multisig (Squads)
    pub authority: Pubkey,

    // === Backend (32 bytes) ===
    /// Rotatable backend signer for completions
    pub backend_signer: Pubkey,

    // === Season (36 bytes) ===
    /// Current active season number
    pub current_season: u16,
    /// Current season's Token-2022 mint address
    pub current_mint: Pubkey,
    /// Whether current season is closed
    pub season_closed: bool,
    /// Season start timestamp
    pub season_started_at: i64,

    // === Rate Limits (8 bytes) ===
    /// Max XP any learner can earn per day
    pub max_daily_xp: u32,
    /// Max XP from a single achievement
    pub max_achievement_xp: u32,

    // === Future-proofing (32 bytes) ===
    pub _reserved: [u8; 32],

    // === PDA (1 byte) ===
    pub bump: u8,
}
```

**Size:** 8 (discriminator) + 143 + 32 (reserved) = ~183 bytes | **Rent:** ~0.002 SOL

---

## 3. Credentials (ZK Compressed Accounts)

### Overview

Credentials are **ZK compressed accounts** via Light Protocol. Instead of Bubblegum cNFTs, each credential is a compressed PDA with a deterministic address, enabling rent-free, updatable progress records per learning track.

**One credential per learner per track.** No merkle tree setup. No Bubblegum dependency.

### Why ZK Compression over Bubblegum

| Factor | Bubblegum cNFTs | ZK Compression |
| --- | --- | --- |
| Setup cost | ~1.5-15 SOL (tree) | 0 SOL (uses shared trees) |
| Per-credential cost | Near-zero | Zero (no rent) |
| Data flexibility | Limited to NFT metadata JSON | Arbitrary struct |
| Update complexity | Merkle proof as remaining_accounts | Validity proof in instruction data |
| Wallet display | Shows as NFT | Requires custom UI or decompress later |
| Dependency | Metaplex Bubblegum | Light Protocol |

**Trade-off:** Credentials won't appear as NFTs in wallets like Phantom. They're visible through the Academy frontend and any indexer that supports ZK Compression (Helius/Photon). A future `decompress_credential` instruction could mint a standard NFT from compressed state if needed.

### Compressed Account Structure

```rust
#[event]
#[derive(Clone, Debug, Default, LightDiscriminator)]
pub struct Credential {
    /// Owner/learner
    pub learner: Pubkey,           // 32
    /// Track identifier
    pub track_id: u16,             // 2
    /// Current level in track (1=beginner, 2=intermediate, 3=advanced)
    pub current_level: u8,         // 1
    /// Number of courses completed in this track
    pub courses_completed: u8,     // 1
    /// Total XP earned in this track
    pub total_xp_earned: u32,      // 4
    /// First credential earned timestamp
    pub first_earned: i64,         // 8
    /// Last upgrade timestamp
    pub last_updated: i64,         // 8
    /// Arweave TX hash for display metadata (badge image, name, etc.)
    pub metadata_hash: [u8; 32],   // 32
}
// ~88 bytes as compressed account data
// Address derived from: ["credential", learner.as_ref(), track_id.to_le_bytes()]
```

### Progression Model

```
Learner completes "Anchor Beginner" (track_id=1, track_level=1)
         │
         ▼
Create compressed credential:
  address = derive_address(["credential", learner, 1], address_tree, program_id)
  { learner, track_id: 1, current_level: 1, courses_completed: 1, ... }
         │
         │  Learner completes "Anchor Intermediate" (track_id=1, track_level=2)
         ▼
Update compressed credential:
  { current_level: 2, courses_completed: 2, last_updated: now, ... }
         │
         │  Learner completes "Anchor Advanced" (track_id=1, track_level=3)
         ▼
Update compressed credential:
  { current_level: 3, courses_completed: 3, last_updated: now, ... }
```

Same compressed address throughout. Full history preserved in Solana ledger (each update is a transaction).

### Credential Operations (Inside `issue_credential`)

```rust
fn create_or_upgrade_credential<'info>(
    ctx: &Context<'_, '_, '_, 'info, IssueCredential<'info>>,
    course: &Course,
    proof: ValidityProof,
    // If upgrading, pass current credential state + meta
    existing_credential: Option<Credential>,
    credential_meta: Option<CompressedAccountMeta>,
    // If creating, pass address tree info
    address_tree_info: Option<PackedAddressTreeInfo>,
    output_state_tree_index: u8,
    new_metadata_hash: [u8; 32],
) -> Result<()> {
    let light_cpi_accounts = CpiAccounts::new(
        ctx.accounts.backend_signer.as_ref(),
        ctx.remaining_accounts,
        crate::LIGHT_CPI_SIGNER,
    );

    if let Some(current) = existing_credential {
        // Upgrade existing credential
        let mut credential = LightAccount::<Credential>::new_mut(
            &crate::ID,
            &credential_meta.unwrap(),
            current,
        )?;
        credential.current_level = course.track_level;
        credential.courses_completed += 1;
        credential.total_xp_earned += course.xp_total;
        credential.last_updated = Clock::get()?.unix_timestamp;
        credential.metadata_hash = new_metadata_hash;

        LightSystemProgramCpi::new_cpi(LIGHT_CPI_SIGNER, proof)
            .with_light_account(credential)?
            .invoke(light_cpi_accounts)?;
    } else {
        // Create new credential for this track
        let ati = address_tree_info.unwrap();
        let (address, address_seed) = derive_address(
            &[b"credential",
              ctx.accounts.learner.key().as_ref(),
              &course.track_id.to_le_bytes()],
            &ati.get_tree_pubkey(&light_cpi_accounts)
                .map_err(|_| ErrorCode::AccountNotEnoughKeys)?,
            &crate::ID,
        );

        let mut credential = LightAccount::<Credential>::new_init(
            &crate::ID, Some(address), output_state_tree_index,
        );
        credential.learner = ctx.accounts.learner.key();
        credential.track_id = course.track_id;
        credential.current_level = course.track_level;
        credential.courses_completed = 1;
        credential.total_xp_earned = course.xp_total;
        credential.first_earned = Clock::get()?.unix_timestamp;
        credential.last_updated = Clock::get()?.unix_timestamp;
        credential.metadata_hash = new_metadata_hash;

        LightSystemProgramCpi::new_cpi(LIGHT_CPI_SIGNER, proof)
            .with_light_account(credential)?
            .with_new_addresses(&[ati.into_new_address_params_packed(address_seed)])
            .invoke(light_cpi_accounts)?;
    }
    Ok(())
}
```

### Credential Categories

| Category | Behavior | Example Progression |
| --- | --- | --- |
| Course Track | Upgrades through track levels | Anchor: Beginner → Intermediate → Advanced |
| Skill | Upgrades through proficiency | Rust: Novice → Proficient → Expert |
| Streak | Upgrades at milestones | 7-day → 30-day → 100-day → 365-day |
| Platform | Upgrades with tenure/contribution | Newcomer → Veteran → Legend |
| Special | One-off, no upgrades | Hackathon Winner, Bug Hunter |

### Display Metadata (Off-Chain, Arweave)

The `metadata_hash` field points to a JSON file on Arweave for frontend display:

```json
{
  "name": "Anchor — Intermediate",
  "symbol": "STACAD",
  "image": "ar://intermediate_badge_hash...",
  "attributes": [
    { "trait_type": "category", "value": "course_track" },
    { "trait_type": "track", "value": "anchor" },
    { "trait_type": "level", "value": "intermediate" },
    { "trait_type": "level_number", "value": "2" }
  ]
}
```

---

## 4. Course Registry

### Account Structure

**Seeds:** `["course", course_id_bytes]` where `course_id` is a slug string (max 32 chars)

```rust
#[account]
pub struct Course {
    // === Identity (36 bytes) ===
    /// Unique course identifier (slug, max 32 chars)
    pub course_id: String,
    /// Course creator (earns XP on completions)
    pub creator: Pubkey,

    // === Authority (32 bytes) ===
    /// Who can update course content (can differ from creator)
    pub authority: Pubkey,

    // === Content (35 bytes) ===
    /// Arweave transaction hash (reconstruct URI on client)
    pub content_tx_id: [u8; 32],
    /// Content version (incremented on updates)
    pub version: u16,
    /// Content type: 0=arweave, 1=ipfs
    pub content_type: u8,

    // === Structure (8 bytes) ===
    /// Total lessons in course
    pub lesson_count: u8,
    /// Lessons that are challenges (subset)
    pub challenge_count: u8,
    /// Difficulty: 1=beginner, 2=intermediate, 3=advanced
    pub difficulty: u8,
    /// Total XP earnable in this course
    pub xp_total: u32,

    // === Track (3 bytes) ===
    /// Track ID (0=standalone, 1=anchor, 2=rust, etc.)
    pub track_id: u16,
    /// Level within track (1=beginner, 2=intermediate, 3=advanced)
    pub track_level: u8,

    // === Prerequisites (33 bytes) ===
    /// Optional prerequisite course PDA (None if no prerequisite)
    pub prerequisite: Option<Pubkey>,

    // === Creator Economics (8 bytes) ===
    /// XP awarded to creator per student completion
    pub completion_reward_xp: u32,
    /// Minimum completions before creator earns XP (anti-alt-account)
    pub min_completions_for_reward: u16,
    /// Padding
    _pad: u16,

    // === Stats (8 bytes) ===
    /// Total completions
    pub total_completions: u32,
    /// Total enrollments
    pub total_enrollments: u32,

    // === Status (17 bytes) ===
    /// Whether course accepts new enrollments
    pub is_active: bool,
    /// Creation timestamp
    pub created_at: i64,
    /// Last update timestamp
    pub updated_at: i64,

    // === Future-proofing (16 bytes) ===
    pub _reserved: [u8; 16],

    // === PDA (1 byte) ===
    pub bump: u8,
}
```

**Size:** 8 (discriminator) + ~222 bytes = ~230 bytes | **Rent:** ~0.002 SOL

**Note:** The `content_hash_check` field has been removed entirely. Arweave immutability is relied upon; no on-chain hash verification is performed.

### Content Verification (Client-Side)

```typescript
const course = await program.account.course.fetch(coursePDA);
// Reconstruct URI from tx hash
const uri = course.contentType === 0
    ? `ar://${base64Encode(course.contentTxId)}`
    : `ipfs://${cidFromBytes(course.contentTxId)}`;
const manifest = await fetch(uri).then(r => r.json());
```

### Track Registry (Off-Chain)

```typescript
const TRACKS: Record<number, TrackInfo> = {
    0: { name: "standalone", display: "Standalone Course" },
    1: { name: "anchor", display: "Anchor Framework" },
    2: { name: "rust", display: "Rust for Solana" },
    3: { name: "defi", display: "DeFi Development" },
    4: { name: "security", display: "Program Security" },
    // Add new tracks without program upgrades
};
```

---

## 5. Learner Profile

### Account Structure

**Seeds:** `["learner", user_pubkey]`

```rust
#[account]
pub struct LearnerProfile {
    // === Identity (32 bytes) ===
    pub authority: Pubkey,

    // === Streaks (13 bytes) ===
    /// Current consecutive-day streak
    pub current_streak: u16,
    /// Longest streak ever achieved
    pub longest_streak: u16,
    /// Last activity (unix timestamp, UTC day-level)
    pub last_activity_date: i64,
    /// Available streak freezes
    pub streak_freezes: u8,

    // === Achievements (32 bytes) ===
    /// Bitmap of claimed achievements (256 possible)
    pub achievement_flags: [u64; 4],

    // === Rate Limiting (6 bytes) ===
    /// XP earned today (resets daily, checked on-chain)
    pub xp_earned_today: u32,
    /// Day number of last XP earn (unix_ts / 86400)
    pub last_xp_day: u16,

    // === Social (3 bytes) ===
    /// Number of successful referrals
    pub referral_count: u16,
    /// Whether this learner has already registered a referrer
    pub has_referrer: bool,

    // === Future-proofing (16 bytes) ===
    pub _reserved: [u8; 16],

    // === PDA (1 byte) ===
    pub bump: u8,
}
```

**Size:** 8 (discriminator) + ~87 + 16 (reserved) = ~111 bytes | **Rent:** ~0.001 SOL

### Derived Data (Not Stored)

| Data | Source |
| --- | --- |
| XP balance | Query XP token account |
| Level | `floor(sqrt(xp / 100))` |
| Rank | Index all XP balances, sort |
| Skills/Tracks | Query credentials via Photon indexer |
| Courses completed | Count from credential data |
| Username | Wallet display name (SNS, Backpack) or frontend DB |
| Join date | `init_learner` transaction timestamp |

---

## 6. Enrollment

### Account Structure

**Seeds:** `["enrollment", course_id_bytes, user_pubkey]`

Using `course_id` string bytes instead of course PDA address for seed stability.

```rust
#[account]
pub struct Enrollment {
    // === Reference (32 bytes) ===
    /// The Course PDA this enrollment belongs to
    pub course: Pubkey,

    // === Snapshot (2 bytes) ===
    /// Course version at time of enrollment
    pub enrolled_version: u16,

    // === Timestamps (24 bytes) ===
    /// When learner enrolled
    pub enrolled_at: i64,
    /// When course was completed (None if in progress)
    pub completed_at: Option<i64>,

    // === Progress (32 bytes) ===
    /// Lesson completion bitmap (up to 256 lessons)
    pub lesson_flags: [u64; 4],

    // === PDA (1 byte) ===
    pub bump: u8,
}
```

**Size:** 8 (discriminator) + ~91 bytes = ~99 bytes | **Rent:** ~0.001 SOL (reclaimable)

Note: `learner` pubkey removed (derivable from PDA seeds). `credential_asset_id` removed (credentials are now ZK compressed accounts looked up by `["credential", learner, track_id]`).

### Unenroll

Learners can abandon courses they don't want to finish:

```rust
pub fn unenroll(ctx: Context<Unenroll>) -> Result<()> {
    let enrollment = &ctx.accounts.enrollment;

    // Cannot unenroll completed courses (use close_enrollment instead)
    require!(enrollment.completed_at.is_none(), ErrorCode::NotCompleted);

    // 24-hour cooldown: prevent enroll/unenroll spam
    let now = Clock::get()?.unix_timestamp;
    require!(
        now - enrollment.enrolled_at > 86400,
        ErrorCode::UnenrollCooldown
    );

    // No XP awarded. Rent returned to learner.
    emit!(Unenrolled {
        learner: ctx.accounts.learner.key(),
        course: enrollment.course,
        timestamp: now,
    });

    Ok(())
}
```

### Close Enrollment (After Completion)

```rust
pub fn close_enrollment(ctx: Context<CloseEnrollment>) -> Result<()> {
    let enrollment = &ctx.accounts.enrollment;
    require!(enrollment.completed_at.is_some(), ErrorCode::NotCompleted);

    emit!(EnrollmentClosed {
        learner: ctx.accounts.learner.key(),
        course: enrollment.course,
        rent_reclaimed: ctx.accounts.enrollment.to_account_info().lamports(),
        timestamp: Clock::get()?.unix_timestamp,
    });
    Ok(())
}
```

**What's preserved after closing:** credential (compressed account, permanent), all events in ledger, full progress reconstructible by indexer.

---

## 7. Creator Incentives

### Mechanism

When a student completes a course, both learner AND creator earn XP:

```rust
// Inside finalize_course
mint_xp(&learner_token_account, course.xp_total)?;

// Creator reward gated by minimum completions
if course.total_completions >= course.min_completions_for_reward as u32 {
    mint_xp(&creator_token_account, course.completion_reward_xp)?;
}
```

### Economics

| Difficulty | Student XP | Creator XP | Ratio |
| --- | --- | --- | --- |
| Beginner | 500 | 50 | 10% |
| Intermediate | 1,000 | 100 | 10% |
| Advanced | 2,000 | 200 | 10% |

### Dynamic Rewards

`completion_reward_xp` can be adjusted via `update_course` (authority-gated) based on quality metrics. `min_completions_for_reward` prevents gaming with alt accounts.

---

## 8. Streak System

### Design: Activity-Derived, UTC Standard

No dedicated `checkin` instruction. Streaks update as a side effect of `complete_lesson`. All day boundaries use UTC (documented to users).

### Logic

```rust
fn update_streak(learner: &mut LearnerProfile) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let today = now / 86400;  // UTC day number
    let last_day = learner.last_activity_date / 86400;

    if today > last_day {
        if today == last_day + 1 {
            learner.current_streak += 1;
        } else if today == last_day + 2 && learner.streak_freezes > 0 {
            learner.streak_freezes -= 1;
            learner.current_streak += 1;
        } else if today > last_day + 1 {
            emit!(StreakBroken {
                learner: learner.authority,
                final_streak: learner.current_streak,
                timestamp: now,
            });
            learner.current_streak = 1;
        }

        // Emit milestone events
        let milestones = [7, 30, 100, 365];
        if milestones.contains(&learner.current_streak) {
            emit!(StreakMilestone {
                learner: learner.authority,
                milestone: learner.current_streak,
                timestamp: now,
            });
        }

        if learner.current_streak > learner.longest_streak {
            learner.longest_streak = learner.current_streak;
        }
        learner.last_activity_date = now;
    }
    Ok(())
}
```

---

## 9. Achievement System

### Design

Achievements tracked in a bitmap (prevents double-claiming) and rewarded with XP. XP amount is capped on-chain via `config.max_achievement_xp`.

```rust
pub fn claim_achievement(
    ctx: Context<ClaimAchievement>,
    achievement_index: u8,
    xp_reward: u32,
) -> Result<()> {
    let config = &ctx.accounts.config;
    let learner = &mut ctx.accounts.learner;

    // Cap XP reward
    let capped_reward = xp_reward.min(config.max_achievement_xp);

    // Check not already claimed
    let word = (achievement_index / 64) as usize;
    let bit = achievement_index % 64;
    require!(
        learner.achievement_flags[word] & (1u64 << bit) == 0,
        ErrorCode::AlreadyClaimed
    );

    // Check daily rate limit
    check_and_update_daily_xp(learner, capped_reward)?;

    // Mark claimed + award XP
    learner.achievement_flags[word] |= 1u64 << bit;
    mint_xp(&ctx.accounts.learner_token, capped_reward as u64)?;

    emit!(AchievementClaimed {
        learner: learner.authority,
        achievement_index,
        xp_reward: capped_reward,
        timestamp: Clock::get()?.unix_timestamp,
    });
    Ok(())
}
```

---

## 10. Anti-Cheat

### Server-Signed Completions

All lesson completions require backend signature. The backend signer is stored in Config PDA and rotatable via `update_config`.

### On-Chain Rate Limiting

```rust
fn check_and_update_daily_xp(
    learner: &mut LearnerProfile,
    xp_amount: u32,
) -> Result<()> {
    let today = (Clock::get()?.unix_timestamp / 86400) as u16;

    if today > learner.last_xp_day {
        // New day: reset counter
        learner.xp_earned_today = 0;
        learner.last_xp_day = today;
    }

    require!(
        learner.xp_earned_today + xp_amount <= MAX_DAILY_XP,
        ErrorCode::DailyXPLimitExceeded
    );

    learner.xp_earned_today += xp_amount;
    Ok(())
}
```

### Backend Rate Limits (Additional Layer)

| Limit | Value | Rationale |
| --- | --- | --- |
| Lessons per hour | 10 | Prevents grinding |
| XP per day | 2,000 (also enforced on-chain) | Caps exploitation |
| Challenges per hour | 5 | Reasonable attempt rate |

---

## 11. Instruction Set (16 Instructions)

```rust
// ═══════════════════════════════════════════════════════════════
// PLATFORM MANAGEMENT (Authority-gated)
// ═══════════════════════════════════════════════════════════════

/// One-time: create Config PDA
pub fn initialize(ctx: Context<Initialize>, max_daily_xp: u32, max_achievement_xp: u32) -> Result<()>;

/// Create a new season's XP mint
pub fn create_season(ctx: Context<CreateSeason>, season: u16) -> Result<()>;

/// Close current season (no more XP minting)
pub fn close_season(ctx: Context<CloseSeason>) -> Result<()>;

/// Update config: rotate backend signer, adjust rate limits
pub fn update_config(ctx: Context<UpdateConfig>, params: UpdateConfigParams) -> Result<()>;


// ═══════════════════════════════════════════════════════════════
// COURSES (Authority-gated)
// ═══════════════════════════════════════════════════════════════

/// Register a new course
pub fn create_course(ctx: Context<CreateCourse>, params: CreateCourseParams) -> Result<()>;

/// Update course content, reward, or deactivate
pub fn update_course(ctx: Context<UpdateCourse>, params: UpdateCourseParams) -> Result<()>;


// ═══════════════════════════════════════════════════════════════
// LEARNER
// ═══════════════════════════════════════════════════════════════

/// Initialize learner profile
pub fn init_learner(ctx: Context<InitLearner>) -> Result<()>;

/// Register a referral (validates referrer exists, prevents self-referral)
pub fn register_referral(ctx: Context<RegisterReferral>) -> Result<()>;

/// Claim an achievement (backend validates eligibility, on-chain caps XP)
pub fn claim_achievement(ctx: Context<ClaimAchievement>, achievement_index: u8, xp_reward: u32) -> Result<()>;

/// Award a streak freeze to learner (backend-gated, increments streak_freezes counter)
pub fn award_streak_freeze(ctx: Context<AwardStreakFreeze>) -> Result<()>;


// ═══════════════════════════════════════════════════════════════
// ENROLLMENT & PROGRESS
// ═══════════════════════════════════════════════════════════════

/// Enroll in a course (checks prerequisites if set)
pub fn enroll(ctx: Context<Enroll>) -> Result<()>;

/// Abandon a course, reclaim rent (24h cooldown, no XP)
pub fn unenroll(ctx: Context<Unenroll>) -> Result<()>;

/// Complete a lesson (backend-signed, awards XP, updates streak, rate-limited)
pub fn complete_lesson(
    ctx: Context<CompleteLesson>,
    lesson_index: u8,
    xp_amount: u32,
) -> Result<()>;

/// Finalize entire course: verify lesson bitmap, award XP to learner and creator, update stats
pub fn finalize_course(ctx: Context<FinalizeCourse>) -> Result<()>;

/// Issue (create/upgrade) ZK compressed credential via Light Protocol CPI
pub fn issue_credential(ctx: Context<IssueCredential>, /* ZK Compression params */) -> Result<()>;

/// Close completed enrollment, reclaim rent
pub fn close_enrollment(ctx: Context<CloseEnrollment>) -> Result<()>;
```

### Instruction Details: finalize_course vs issue_credential

**`finalize_course` (~100K CU, Backend-Signed):**
- Verifies all lessons in enrollment bitmap match course lesson_count
- Awards `course.xp_total` to learner
- Awards `course.completion_reward_xp` to creator (if completion threshold met)
- Increments `course.total_completions`
- Sets `enrollment.completed_at = now`
- Emits `CourseFinalized` event
- **Does NOT interact with Light Protocol**
- If this instruction fails, learner loses XP; must be called first
- If this succeeds, `issue_credential` can safely be called afterward

**`issue_credential` (~200-300K CU, Backend-Signed):**
- Requires `enrollment.completed_at.is_some()` (i.e., `finalize_course` must have run)
- Fetches existing credential from Photon (if upgrading) or creates new
- Performs Light Protocol CPI to create or upgrade ZK compressed credential
- Updates credential metadata hash from Arweave
- Emits `CredentialIssued` event
- **CPI failure does not affect XP awards** (already in learner account)
- Backend calls `finalize_course` first, then `issue_credential` sequentially
- If `issue_credential` fails, credential state is not updated, but learner keeps XP

**Error Code Added:**
```rust
#[msg("Course not finalized; issue_credential requires finalize_course to succeed first")]
CourseNotFinalized,
```

### Internal Operations (Not Public Instructions)

- `create_or_upgrade_credential` — CPI to Light System Program, called by `issue_credential`
- `mint_xp` — CPI to Token-2022, called by `finalize_course`, `complete_lesson`, `claim_achievement`
- `update_streak` — Called internally by `complete_lesson`
- `check_and_update_daily_xp` — Called internally by XP-awarding instructions

### Estimated Compute Units

| Instruction | Est. CU | Notes |
| --- | --- | --- |
| initialize | ~5,000 | Simple PDA init |
| create_season | ~50,000 | Token-2022 mint creation |
| init_learner | ~5,000 | Simple PDA init |
| enroll | ~15,000 | PDA init + prerequisite check |
| complete_lesson | ~40,000 | Bitmap + XP mint CPI + streak |
| finalize_course | ~100,000 | Bitmap verification + 2 XP mints (learner + creator) |
| issue_credential | ~200-300,000 | ZK Compression CPI + Photon proof fetch |
| claim_achievement | ~30,000 | Bitmap + XP mint CPI |
| award_streak_freeze | ~5,000 | Increment counter |
| register_referral | ~10,000 | Two account updates |
| close_enrollment | ~5,000 | Account close |

---

## 12. Events

```rust
#[event] pub struct LearnerInitialized { pub learner: Pubkey, pub timestamp: i64 }

#[event] pub struct CourseCreated {
    pub course: Pubkey, pub course_id: String, pub creator: Pubkey,
    pub track_id: u16, pub track_level: u8, pub timestamp: i64,
}

#[event] pub struct CourseUpdated {
    pub course: Pubkey, pub version: u16, pub timestamp: i64,
}

#[event] pub struct Enrolled {
    pub learner: Pubkey, pub course: Pubkey,
    pub course_version: u16, pub timestamp: i64,
}

#[event] pub struct Unenrolled {
    pub learner: Pubkey, pub course: Pubkey, pub timestamp: i64,
}

#[event] pub struct LessonCompleted {
    pub learner: Pubkey, pub course: Pubkey, pub lesson_index: u8,
    pub xp_earned: u32, pub current_streak: u16, pub timestamp: i64,
}

#[event] pub struct CourseFinalized {
    pub learner: Pubkey, pub course: Pubkey, pub total_xp: u32,
    pub creator: Pubkey, pub creator_xp: u32, pub timestamp: i64,
}

#[event] pub struct CredentialIssued {
    pub learner: Pubkey, pub track_id: u16,
    pub credential_created: bool, pub credential_upgraded: bool,
    pub current_level: u8, pub timestamp: i64,
}

#[event] pub struct AchievementClaimed {
    pub learner: Pubkey, pub achievement_index: u8,
    pub xp_reward: u32, pub timestamp: i64,
}

#[event] pub struct StreakBroken {
    pub learner: Pubkey, pub final_streak: u16, pub timestamp: i64,
}

#[event] pub struct StreakMilestone {
    pub learner: Pubkey, pub milestone: u16, pub timestamp: i64,
}

#[event] pub struct StreakFreezeAwarded {
    pub learner: Pubkey, pub freezes_remaining: u8, pub timestamp: i64,
}

#[event] pub struct EnrollmentClosed {
    pub learner: Pubkey, pub course: Pubkey,
    pub rent_reclaimed: u64, pub timestamp: i64,
}

#[event] pub struct ReferralRegistered {
    pub referrer: Pubkey, pub referee: Pubkey, pub timestamp: i64,
}

#[event] pub struct SeasonCreated {
    pub season: u16, pub mint: Pubkey, pub timestamp: i64,
}

#[event] pub struct SeasonClosed { pub season: u16, pub timestamp: i64 }

#[event] pub struct ConfigUpdated { pub field: String, pub timestamp: i64 }
```

---

## 13. Cost Analysis

### One-Time Setup

| Item | Cost |
| --- | --- |
| Deploy program | ~2 SOL |
| Config PDA | ~0.002 SOL |
| First season XP mint | ~0.001 SOL |
| **Total setup** | **~2 SOL** |

No merkle tree creation needed (ZK Compression uses shared public trees).

### Per Course

| Item | Cost |
| --- | --- |
| Course PDA rent | ~0.002 SOL |
| Content upload (Arweave) | ~$0.01-0.05 |

### Per Learner (Annual Journey)

| Action | Count | Tx Fee | Rent |
| --- | --- | --- | --- |
| Init learner | 1 | ~0.00001 | 0.001 |
| Enroll (5 courses) | 5 | ~0.00005 | 0.005 (reclaimable) |
| Complete lessons (100) | 100 | ~0.001 | — |
| Finalize courses (5) | 5 | ~0.0005 | — |
| Issue credentials (5) | 5 | ~0.0005 | — |
| Credential create (first in track) | ~3 | ~0.0003 | 0 (compressed) |
| Credential upgrades | ~2 | ~0.0002 | 0 (compressed) |
| Close enrollments | 5 | ~0.00005 | -0.005 (reclaimed) |
| **Net annual cost** | | | **~0.002 SOL** |

### Scale Projections

| Learners | Annual Cost |
| --- | --- |
| 1,000 | ~2 SOL |
| 10,000 | ~20 SOL |
| 100,000 | ~200 SOL |

---

## 14. Security Model

### Authorities

| Role | Permissions | Implementation |
| --- | --- | --- |
| Platform Authority | Initialize, create seasons, create courses, update config | Multisig (Squads) |
| Course Authority | Update/deactivate specific course | Per-course pubkey |
| Backend Signer | Complete lessons, finalize courses, issue credentials, claim achievements, award streak freezes | Rotatable server keypair (in Config PDA) |
| Learner | Init profile, enroll, unenroll, close enrollment, register referral | Wallet signature |

### Access Control Matrix

| Instruction | Platform | Course Auth | Backend | Learner |
| --- | --- | --- | --- | --- |
| initialize | ✅ | | | |
| create_season | ✅ | | | |
| close_season | ✅ | | | |
| update_config | ✅ | | | |
| create_course | ✅ | | | |
| update_course | | ✅ | | |
| init_learner | | | | ✅ |
| enroll | | | | ✅ |
| unenroll | | | | ✅ |
| complete_lesson | | | ✅ | |
| finalize_course | | | ✅ | |
| issue_credential | | | ✅ | |
| award_streak_freeze | | | ✅ | |
| claim_achievement | | | ✅ | |
| register_referral | | | | ✅ |
| close_enrollment | | | | ✅ |

### Key Security Properties

1. **Soulbound + PermanentDelegate XP** — Cannot transfer or self-burn
2. **Rotatable backend signer** — Key rotation without program upgrade
3. **On-chain daily XP cap** — Defense-in-depth even if backend compromised
4. **On-chain achievement XP cap** — Prevents unbounded minting via achievements
5. **Bitmap double-check** — Can't complete same lesson twice
6. **Prerequisite enforcement** — On-chain check before enrollment
7. **Referral validation** — Referrer must exist, no self-referral, one-time only
8. **Credential authority** — Only program (via CPI signer PDA) can create/update credentials
9. **Finalize-before-issue ordering** — `finalize_course` must succeed before `issue_credential` to prevent credential creation without XP awards

---

## 15. TypeScript SDK Interface

### Layer 1: Direct Account Reads (No Indexer Needed)

```typescript
interface DirectReads {
    getConfig(): Promise<Config>;
    getCourse(courseId: string): Promise<Course>;
    getLearner(wallet: PublicKey): Promise<LearnerProfile | null>;
    getEnrollment(wallet: PublicKey, courseId: string): Promise<Enrollment | null>;
    getXPBalance(wallet: PublicKey, season?: number): Promise<number>;
}
```

### Layer 2: Indexed Queries (Requires Indexer)

```typescript
interface IndexedQueries {
    // XP & Rankings (Helius DAS API)
    getLeaderboard(options?: { season?: number; limit?: number }): Promise<LeaderboardEntry[]>;
    getRank(wallet: PublicKey, season?: number): Promise<number>;

    // Credentials (Photon / ZK Compression indexer)
    getCredentials(wallet: PublicKey): Promise<Credential[]>;
    getCredentialByTrack(wallet: PublicKey, trackId: number): Promise<Credential | null>;
    getCredentialHistory(address: PublicKey): Promise<CredentialVersion[]>;

    // Aggregated
    getAllCourses(options?: { activeOnly?: boolean }): Promise<Course[]>;
    getCoursesByTrack(trackId: number): Promise<Course[]>;
    getAllEnrollments(wallet: PublicKey): Promise<Enrollment[]>;
    getCreatorStats(wallet: PublicKey): Promise<CreatorStats>;
    getAchievements(wallet: PublicKey): Promise<AchievementStatus[]>;
}
```

### Layer 3: Transaction Builders

```typescript
interface TransactionBuilders {
    // Learner actions
    initLearner(): Promise<TransactionSignature>;
    enroll(courseId: string): Promise<TransactionSignature>;
    unenroll(courseId: string): Promise<TransactionSignature>;
    closeEnrollment(courseId: string): Promise<TransactionSignature>;
    registerReferral(referrer: PublicKey): Promise<TransactionSignature>;

    // Backend actions (require backend signer)
    completeLesson(params: CompleteLessonParams): Promise<TransactionSignature>;
    finalizeCourse(params: FinalizeCourseParams): Promise<TransactionSignature>;
    issueCredential(params: IssueCredentialParams): Promise<TransactionSignature>;
    awardStreakFreeze(params: AwardStreakFreezeParams): Promise<TransactionSignature>;
    claimAchievement(learner: PublicKey, index: number, xp: number): Promise<TransactionSignature>;

    // Admin actions (require platform authority)
    initialize(params: InitParams): Promise<TransactionSignature>;
    createSeason(season: number): Promise<TransactionSignature>;
    closeSeason(): Promise<TransactionSignature>;
    updateConfig(params: UpdateConfigParams): Promise<TransactionSignature>;
    createCourse(params: CreateCourseParams): Promise<TransactionSignature>;
    updateCourse(courseId: string, params: UpdateCourseParams): Promise<TransactionSignature>;
}
```

---

## 16. Infrastructure Requirements

### RPC Provider

Must support both standard Solana RPC and ZK Compression endpoints:
- **Helius** — Supports both DAS API (for XP leaderboard) and Photon (for credentials)
- **Triton** — Alternative with ZK Compression support

### Indexer Dependencies

| Data | Indexer | Endpoint |
| --- | --- | --- |
| XP token balances | Helius DAS API | `getTokenHolders` |
| Credentials | Photon (ZK Compression) | `getCompressedAccount`, `getValidityProof` |
| Events/history | Helius webhooks or custom | Transaction log parsing |

### Backend Requirements

For the full course completion flow with credentials:

1. **`finalize_course` call:**
   - Verify all lessons marked as complete in bitmap
   - Verify all lessons exist in course
   - Sign + submit transaction
   - Wait for confirmation

2. **`issue_credential` call:**
   - Query Photon for existing credential (if upgrading): `getCompressedAccountsByOwner`
   - Fetch validity proof: `getValidityProof`
   - Build transaction with compressed account data + proof
   - Sign + submit sequentially after finalize_course
   - If fails, log error but do not retry blocking operations

---

## Appendix A: Account Size Summary

| Account | Size (bytes) | Rent | Closeable | Type |
| --- | --- | --- | --- | --- |
| Config | ~183 | ~0.002 SOL | No | Regular PDA |
| Course | ~230 | ~0.002 SOL | No | Regular PDA |
| LearnerProfile | ~111 | ~0.001 SOL | No | Regular PDA |
| Enrollment | ~99 | ~0.001 SOL | **Yes** | Regular PDA |
| Credential | ~88 | **0 SOL** | N/A | ZK Compressed |

## Appendix B: Error Codes

```rust
#[error_code]
pub enum AcademyError {
    #[msg("Unauthorized signer")] Unauthorized,
    #[msg("Course not active")] CourseNotActive,
    #[msg("Already enrolled")] AlreadyEnrolled,
    #[msg("Not enrolled")] NotEnrolled,
    #[msg("Lesson index out of bounds")] LessonOutOfBounds,
    #[msg("Lesson already completed")] LessonAlreadyCompleted,
    #[msg("Course not fully completed")] CourseNotCompleted,
    #[msg("Course already completed")] CourseAlreadyCompleted,
    #[msg("Achievement already claimed")] AchievementAlreadyClaimed,
    #[msg("Course not finalized; issue_credential requires finalize_course to succeed first")] CourseNotFinalized,
    #[msg("Season already closed")] SeasonClosed,
    #[msg("Cannot refer yourself")] SelfReferral,
    #[msg("Already has a referrer")] AlreadyReferred,
    #[msg("Referrer not found")] ReferrerNotFound,
    #[msg("Prerequisite not met")] PrerequisiteNotMet,
    #[msg("Daily XP limit exceeded")] DailyXPLimitExceeded,
    #[msg("Unenroll cooldown not met (24h)")] UnenrollCooldown,
    #[msg("Enrollment/course mismatch")] EnrollmentCourseMismatch,
    #[msg("Season not active")] SeasonNotActive,
}
```

## Appendix C: Upgrade Path

### No Program Upgrade Needed

- New tracks → Off-chain registry
- New achievements → Off-chain config, unused bitmap indices
- New courses → `create_course`
- New seasons → `create_season`
- Rotate backend signer → `update_config`
- Adjust rate limits → `update_config`

### Program Upgrades (Future)

Deployed as **upgradeable** with platform multisig as upgrade authority:

- `decompress_credential` — Mint standard NFT from compressed credential
- SPL token rewards for creators (escrow model)
- Guild/team accounts
- On-chain governance for curriculum
- Cross-program composability (DAO gating, job boards)

---

*End of Specification v1.1 (Revised with Split Instructions)*
