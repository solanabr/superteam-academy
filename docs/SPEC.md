# Superteam Academy — On-Chain Program Specification

**Version:** 2.0 (Simplified V1)
**Network:** Solana Mainnet
**Framework:** Anchor + Metaplex Core

---

## Executive Summary

Superteam Academy is a decentralized learning platform for Solana development. This specification defines the on-chain program architecture that powers verifiable credentials, XP tracking, course registries, and creator incentives.

### Design Principles

1. **Tokens as state** — XP is a soulbound fungible token. Your balance is your score.
2. **Evolving credentials** — One Metaplex Core NFT per learning track that upgrades as you progress. Soulbound via PermanentFreezeDelegate plugin. Visible in all wallets.
3. **Courses as factories** — Course PDAs spawn enrollment PDAs. Lessons are tracked by bitmap.
4. **Creators earn** — Course authors receive XP proportional to student completions.
5. **Minimal footprint** — Every byte justified. Closeable accounts. Reserved bytes for future-proofing.
6. **Wallet-visible credentials** — Credentials are Metaplex Core NFTs with universal wallet support (Phantom, Backpack, Solflare). Upgradeable via metadata/attribute updates.
7. **Backend-enforced anti-cheat** — All lesson completions require backend signature. Rate limiting and fraud detection handled off-chain.

### Key Metrics

| Metric | Value |
| --- | --- |
| Regular PDA types | 3 (Config, Course, Enrollment) |
| Credential type | Metaplex Core NFT (soulbound, 1 per track per learner) |
| Instructions (V1) | 9 (seasons, achievements, referrals deferred to V2) |
| Cost per credential | ~0.0037 SOL (mint) + ~0.002 SOL (rent) |
| One-time setup cost | ~2 SOL (program deploy + collection NFTs) |

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
│  │  • Permanent      │  │  • XP mint       │  │  • Prerequisite      │  │
│  │    Delegate       │  │  • Single mint   │  │  • Spawns enrollments│  │
│  │  • Single mint    │  │                  │  │                      │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────────┘  │
│                                                       │                 │
│                                         ┌────────────┴──────────────┐   │
│                                         │  Enrollment PDA           │   │
│                                         │  (Closeable)              │   │
│                                         │                           │   │
│                                         │  • Lesson bitmap          │   │
│                                         │  • Completion timestamp   │   │
│                                         │  • Credential asset ref   │   │
│                                         │  • Unenrollable (24h)     │   │
│                                         └───────────────────────────┘   │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  METAPLEX CORE CREDENTIALS                                       │   │
│  │                                                                  │   │
│  │  Credential NFT (one per learner-per-track)                      │   │
│  │  • Collection per track (DeFi, Anchor, Security, etc.)          │   │
│  │  • Soulbound via PermanentFreezeDelegate plugin                 │   │
│  │  • Upgradeable: URI + Attributes plugin (level, courses, XP)    │   │
│  │  • Visible in Phantom, Backpack, Solflare wallet galleries      │   │
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
│  • Credentials: Metaplex Core NFTs (Helius DAS API / wallet-native)   │
│  • Rate Limiting: Backend enforces daily XP caps, lesson throttling    │
│  • Anti-cheat: Backend validates all completions before signing        │
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

`PermanentDelegate` gives the platform authority delegate rights over all token accounts, preventing users from burning their own XP (which would compromise leaderboard integrity).

### Single Mint (Seasons Deferred to V2)

V1 uses a single XP mint created during `initialize`. The mint address is stored in `config.xp_mint`. Seasons (new mint per period) are deferred to V2 — a single global leaderboard is sufficient for launch.

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

Single configuration account that stores platform-wide settings. Holds the XP mint address and rotatable backend signer.

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

    // === XP Mint (32 bytes) ===
    /// Token-2022 mint for XP (single mint in V1, seasons deferred to V2)
    pub xp_mint: Pubkey,

    // === Future-proofing (8 bytes) ===
    /// Reserved for V2: season fields, additional config
    pub _reserved: [u8; 8],

    // === PDA (1 byte) ===
    pub bump: u8,
}
```

**Size:** 8 (discriminator) + 97 + 8 (reserved) = ~113 bytes | **Rent:** ~0.001 SOL

---

## 3. Credentials (Metaplex Core NFTs)

### Overview

Credentials are **Metaplex Core NFTs** — soulbound, wallet-visible, and upgradeable. Each credential is a single NFT asset per learner per track, organized into collection NFTs per track.

**One credential per learner per track.** Soulbound via PermanentFreezeDelegate. Upgradeable via URI and Attributes plugin updates.

### Why Metaplex Core

| Factor | ZK Compression | Metaplex Core (chosen) |
| --- | --- | --- |
| Wallet display | Not visible in wallets | Universal (Phantom, Backpack, Solflare) |
| Setup cost | 0 SOL | ~0.003 SOL per collection |
| Per-credential cost | Zero (no rent) | ~0.0037 SOL mint + ~0.002 SOL rent |
| Data flexibility | Arbitrary struct | Metadata JSON + Attributes plugin |
| Update complexity | Validity proof + Photon query | Single `updateV1` CPI call |
| Soulbound | Inherent (no transfer) | PermanentFreezeDelegate plugin |
| Ecosystem support | Limited (Photon indexer only) | Full (DAS API, wallets, explorers) |
| Dependencies | Light Protocol + Photon indexer | Metaplex Core program (on-chain) |
| Dev complexity | High (ZK proofs, indexer queries) | Low (single CPI, standard patterns) |
| Time to implement | 3-4 weeks | 1-2 weeks |

**Trade-off:** Higher per-credential cost (~$0.75 vs ~$0.001 at $200/SOL). At <50K learners the total cost difference is acceptable. ZK Compression can be evaluated for v2 when wallet display support improves.

### Credential Architecture

```
Track Collections (created once per track by authority):
├── Collection: "Anchor Framework"     (track_id=1)
├── Collection: "Rust for Solana"      (track_id=2)
├── Collection: "DeFi Development"     (track_id=3)
└── Collection: "Program Security"     (track_id=4)

Per-Learner Credentials (minted on first course completion in track):
├── Asset: "Anchor — Beginner"   → owner: learner_A, frozen: true
├── Asset: "Anchor — Advanced"   → owner: learner_B, frozen: true  (upgraded)
└── Asset: "DeFi — Intermediate" → owner: learner_A, frozen: true
```

### Minting Pattern (Inside `issue_credential`)

**Important:** Config PDA must be the update authority of each track collection NFT. When a Metaplex Core asset belongs to a collection, the collection's update authority is what matters for CPI authorization. The Config PDA signs as the collection's authority, not as a direct asset authority.

```rust
// CPI to Metaplex Core: create new credential NFT
// credential_name and metadata_uri are passed as instruction parameters
// (backend constructs them — no format!() on-chain)
fn create_credential_nft<'info>(
    ctx: &Context<'_, '_, '_, 'info, IssueCredential<'info>>,
    course: &Course,
    credential_name: String,
    metadata_uri: String,
) -> Result<()> {
    let create_ix = CreateV2CpiBuilder::new(&ctx.accounts.mpl_core_program)
        .asset(&ctx.accounts.credential_asset)
        .collection(Some(&ctx.accounts.track_collection))
        .payer(&ctx.accounts.payer)
        .owner(Some(&ctx.accounts.learner))
        .authority(Some(&ctx.accounts.config)) // signs as collection update authority
        .name(credential_name)
        .uri(metadata_uri)
        .plugins(vec![
            PluginAuthorityPair {
                plugin: Plugin::PermanentFreezeDelegate(PermanentFreezeDelegate { frozen: true }),
                authority: Some(PluginAuthority::UpdateAuthority),
            },
            PluginAuthorityPair {
                plugin: Plugin::Attributes(Attributes {
                    attribute_list: vec![
                        Attribute { key: "track_id".into(), value: course.track_id.to_string() },
                        Attribute { key: "level".into(), value: course.track_level.to_string() },
                        Attribute { key: "courses_completed".into(), value: "1".into() },
                        Attribute { key: "total_xp".into(), value: learner_track_xp.to_string() },
                    ],
                }),
                authority: Some(PluginAuthority::UpdateAuthority),
            },
        ])
        .invoke_signed(&[config_seeds])?;

    Ok(())
}

// CPI to Metaplex Core: upgrade existing credential
fn upgrade_credential_nft<'info>(
    ctx: &Context<'_, '_, '_, 'info, IssueCredential<'info>>,
    course: &Course,
    credential_name: String,
    new_metadata_uri: String,
    new_courses_completed: u8,
    new_total_xp: u32,
) -> Result<()> {
    UpdateV1CpiBuilder::new(&ctx.accounts.mpl_core_program)
        .asset(&ctx.accounts.credential_asset)
        .collection(Some(&ctx.accounts.track_collection))
        .authority(Some(&ctx.accounts.config)) // signs as collection update authority
        .new_name(Some(credential_name))
        .new_uri(Some(new_metadata_uri))
        .invoke_signed(&[config_seeds])?;

    UpdatePluginV1CpiBuilder::new(&ctx.accounts.mpl_core_program)
        .asset(&ctx.accounts.credential_asset)
        .collection(Some(&ctx.accounts.track_collection))
        .authority(Some(&ctx.accounts.config))
        .plugin(Plugin::Attributes(Attributes {
            attribute_list: vec![
                Attribute { key: "level".into(), value: course.track_level.to_string() },
                Attribute { key: "courses_completed".into(), value: new_courses_completed.to_string() },
                Attribute { key: "total_xp".into(), value: new_total_xp.to_string() },
            ],
        }))
        .invoke_signed(&[config_seeds])?;

    Ok(())
}
```

### Credential Categories

| Category | V1 | Behavior | Example Progression |
| --- | --- | --- | --- |
| Course Track | **Yes** | Upgrades through track levels | Anchor: Beginner → Intermediate → Advanced |
| Skill | V2 | Upgrades through proficiency | Rust: Novice → Proficient → Expert |
| Streak | V2 | Upgrades at milestones | 7-day → 30-day → 100-day → 365-day |
| Platform | V2 | Upgrades with tenure/contribution | Newcomer → Veteran → Legend |
| Special | V2 | One-off, no upgrades | Hackathon Winner, Bug Hunter |

**V1 scope:** Only Course Track credentials are implemented. Other categories require new instructions and will be added in V2.

### Progression Model

```
Learner completes "Anchor Beginner" (track_id=1, track_level=1)
         │
         ▼
Mint new Metaplex Core NFT:
  collection = anchor_collection
  name = "Anchor — Beginner"
  uri = "https://api.superteam.academy/metadata/anchor/beginner/{mint}"
  plugins: PermanentFreezeDelegate(frozen=true), Attributes(level=1, courses=1)
         │
         │  Learner completes "Anchor Intermediate" (track_id=1, track_level=2)
         ▼
Update existing NFT:
  name = "Anchor — Intermediate"
  uri = "https://api.superteam.academy/metadata/anchor/intermediate/{mint}"
  attributes: level=2, courses=2, total_xp=1500
         │
         │  Learner completes "Anchor Advanced" (track_id=1, track_level=3)
         ▼
Update existing NFT:
  name = "Anchor — Advanced"
  uri = "https://api.superteam.academy/metadata/anchor/advanced/{mint}"
  attributes: level=3, courses=3, total_xp=3500
```

Same NFT address throughout. Full upgrade history preserved in Solana ledger. Badge image/name updates are immediately visible in all wallets.

### Display Metadata (Off-Chain, Arweave or API)

The NFT `uri` points to a JSON endpoint for wallet display:

```json
{
  "name": "Anchor — Intermediate",
  "symbol": "STACAD",
  "image": "https://cdn.superteam.academy/badges/anchor-intermediate.png",
  "attributes": [
    { "trait_type": "category", "value": "course_track" },
    { "trait_type": "track", "value": "anchor" },
    { "trait_type": "level", "value": "intermediate" },
    { "trait_type": "level_number", "value": "2" },
    { "trait_type": "courses_completed", "value": "2" },
    { "trait_type": "total_xp", "value": "1500" }
  ]
}
```

On-chain Attributes plugin stores the same data as traits, enabling on-chain reads without fetching the URI. Wallets display the image and traits from both sources.

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

    // === Content (34 bytes) ===
    /// Arweave transaction ID (raw 32 bytes, base64url-encode on client)
    pub content_tx_id: [u8; 32],
    /// Content version (incremented on updates)
    pub version: u16,

    // === Structure (6 bytes) ===
    /// Total lessons in course
    pub lesson_count: u8,
    /// Difficulty: 1=beginner, 2=intermediate, 3=advanced
    pub difficulty: u8,
    /// Per-lesson XP (each lesson awards this amount via complete_lesson)
    pub xp_per_lesson: u32,

    // === Track (3 bytes) ===
    /// Track ID (0=standalone, 1=anchor, 2=rust, etc.)
    pub track_id: u16,
    /// Level within track (1=beginner, 2=intermediate, 3=advanced)
    pub track_level: u8,

    // === Prerequisites (33 bytes) ===
    /// Optional prerequisite course PDA (None if no prerequisite)
    pub prerequisite: Option<Pubkey>,

    // === Completion Rewards (10 bytes) ===
    /// Bonus XP awarded to learner on course completion (claimed via claim_completion_bonus)
    pub completion_bonus_xp: u32,
    /// XP awarded to creator per student completion (in finalize_course)
    pub creator_reward_xp: u32,
    /// Minimum completions before creator earns XP (anti-alt-account)
    pub min_completions_for_reward: u16,

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

    // === Future-proofing (8 bytes) ===
    pub _reserved: [u8; 8],

    // === PDA (1 byte) ===
    pub bump: u8,
}
```

**Size:** 8 (discriminator) + ~208 + 8 (reserved) = ~224 bytes | **Rent:** ~0.002 SOL

**Removed from v1:** `challenge_count` (no distinct handling for challenges vs lessons), `content_type` (all content is Arweave; client can determine format from tx_id).

### Content Verification (Client-Side)

```typescript
const course = await program.account.course.fetch(coursePDA);
// Reconstruct Arweave URI from raw 32-byte tx ID
const arweaveTxId = base64url.encode(Buffer.from(course.contentTxId));
const uri = `https://arweave.net/${arweaveTxId}`;
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

## 5. Enrollment

### Account Structure

**Seeds:** `["enrollment", course_id_bytes, user_pubkey]`

Using `course_id` string bytes instead of course PDA address for seed stability.

```rust
#[account]
pub struct Enrollment {
    // === Reference (32 bytes) ===
    /// The Course PDA this enrollment belongs to
    pub course: Pubkey,

    // === Timestamps (16 bytes) ===
    /// When learner enrolled
    pub enrolled_at: i64,
    /// When course was completed (None if in progress)
    pub completed_at: Option<i64>,

    // === Progress (32 bytes) ===
    /// Lesson completion bitmap (up to 256 lessons)
    pub lesson_flags: [u64; 4],

    // === Credential (33 bytes) ===
    /// Credential NFT address for this track (set by issue_credential, None before first issue)
    pub credential_asset: Option<Pubkey>,

    // === Future-proofing (4 bytes) ===
    pub _reserved: [u8; 4],

    // === PDA (1 byte) ===
    pub bump: u8,
}
```

**Size:** 8 (discriminator) + ~114 + 4 (reserved) = ~127 bytes | **Rent:** ~0.001 SOL (reclaimable)

Note: `learner` pubkey removed (derivable from PDA seeds). `credential_asset` is set on-chain by `issue_credential` — eliminates DAS API dependency for create-vs-upgrade decisions.

### Close Enrollment (Unified: Unenroll + Close)

Single instruction handles both abandoning incomplete courses and closing completed ones:

```rust
pub fn close_enrollment(ctx: Context<CloseEnrollment>) -> Result<()> {
    let enrollment = &ctx.accounts.enrollment;
    let now = Clock::get()?.unix_timestamp;

    if enrollment.completed_at.is_some() {
        // Completed course: close freely, reclaim rent
        emit!(EnrollmentClosed {
            learner: ctx.accounts.learner.key(),
            course: enrollment.course,
            completed: true,
            rent_reclaimed: ctx.accounts.enrollment.to_account_info().lamports(),
            timestamp: now,
        });
    } else {
        // Incomplete course (unenroll): 24h cooldown, no XP
        require!(
            now - enrollment.enrolled_at > 86400,
            ErrorCode::UnenrollCooldown
        );
        emit!(EnrollmentClosed {
            learner: ctx.accounts.learner.key(),
            course: enrollment.course,
            completed: false,
            rent_reclaimed: ctx.accounts.enrollment.to_account_info().lamports(),
            timestamp: now,
        });
    }

    // Account closed by Anchor's close constraint, rent returned to learner.
    Ok(())
}
```

**What's preserved after closing:** credential NFT (Metaplex Core, permanent in wallet), all events in ledger, full progress reconstructible by indexer.

---

## 6. Creator Incentives

### Mechanism

Creator XP and learner completion bonus are both awarded during `finalize_course`.

```rust
// Inside finalize_course — creator and learner rewards
if course.total_completions >= course.min_completions_for_reward as u32 {
    mint_xp(&creator_token_account, course.creator_reward_xp)?;
}
mint_xp(&learner_token_account, course.completion_bonus_xp)?;
```

### XP Distribution Model

```
complete_lesson (×N)  →  xp_per_lesson × N       (minted per lesson to learner)
finalize_course       →  creator_reward_xp       (minted to creator, gated by min_completions)
                         + completion_bonus_xp   (minted to learner)
```

**Learner total XP per course** = `(xp_per_lesson × lesson_count) + completion_bonus_xp`

### Economics

| Difficulty | Lessons | Per-Lesson XP | Completion Bonus | Total Learner XP | Creator XP |
| --- | --- | --- | --- | --- | --- |
| Beginner | 10 | 30 | 200 | 500 | 50 |
| Intermediate | 15 | 40 | 400 | 1,000 | 100 |
| Advanced | 20 | 60 | 800 | 2,000 | 200 |

### Dynamic Rewards

`creator_reward_xp` can be adjusted via `update_course` (authority-gated) based on quality metrics. `min_completions_for_reward` prevents gaming with alt accounts.

---

## 7. Anti-Cheat

### Server-Signed Completions

All lesson completions require backend signature. The backend signer is stored in Config PDA and rotatable via `update_config`.

### Backend Rate Limits

| Limit | Value | Rationale |
| --- | --- | --- |
| Lessons per hour | 10 | Prevents grinding |
| XP per day | 2,000 | Caps exploitation |
| Challenges per hour | 5 | Reasonable attempt rate |

Rate limiting is enforced off-chain in the backend service before signing completion transactions. This keeps the on-chain program simple and allows flexible rate limit adjustments without program upgrades.

### On-Chain Protections

- **Bitmap:** Cannot complete same lesson twice
- **XP amounts:** Read from Course PDA, not instruction parameters
- **Backend signer:** Required for all completions
- **Creator reward gating:** `min_completions_for_reward` prevents alt-account farming

---

## 8. Instruction Set (9 V1 Instructions)

```rust
// ═══════════════════════════════════════════════════════════════
// PLATFORM MANAGEMENT (Authority-gated)
// ═══════════════════════════════════════════════════════════════

/// One-time: create Config PDA + XP mint (Token-2022)
pub fn initialize(ctx: Context<Initialize>) -> Result<()>;

/// Update config: rotate backend signer
pub fn update_config(ctx: Context<UpdateConfig>, new_backend_signer: Option<Pubkey>) -> Result<()>;


// ═══════════════════════════════════════════════════════════════
// COURSES (Authority-gated)
// ═══════════════════════════════════════════════════════════════

/// Register a new course
pub fn create_course(ctx: Context<CreateCourse>, params: CreateCourseParams) -> Result<()>;

/// Update course content, reward, or deactivate
pub fn update_course(ctx: Context<UpdateCourse>, params: UpdateCourseParams) -> Result<()>;


// ═══════════════════════════════════════════════════════════════
// ENROLLMENT & PROGRESS
// ═══════════════════════════════════════════════════════════════

/// Enroll in a course (checks prerequisites if set)
pub fn enroll(ctx: Context<Enroll>) -> Result<()>;

/// Complete a lesson (backend-signed, awards xp_per_lesson)
pub fn complete_lesson(
    ctx: Context<CompleteLesson>,
    lesson_index: u8,
) -> Result<()>;

/// Finalize entire course: verify lesson bitmap, award creator XP + learner bonus XP, update stats
pub fn finalize_course(ctx: Context<FinalizeCourse>) -> Result<()>;

/// Issue (create/upgrade) Metaplex Core credential NFT via CPI
pub fn issue_credential(ctx: Context<IssueCredential>, credential_name: String, metadata_uri: String) -> Result<()>;

/// Close enrollment (works for both incomplete courses with 24h cooldown, and completed courses)
pub fn close_enrollment(ctx: Context<CloseEnrollment>) -> Result<()>;
```

### Deferred to V2

```rust
// Seasons
pub fn create_season(ctx: Context<CreateSeason>, season: u16) -> Result<()>;
pub fn close_season(ctx: Context<CloseSeason>) -> Result<()>;

// Gamification
pub fn claim_achievement(ctx: Context<ClaimAchievement>, achievement_index: u8) -> Result<()>;
pub fn award_streak_freeze(ctx: Context<AwardStreakFreeze>) -> Result<()>;

// Growth
pub fn register_referral(ctx: Context<RegisterReferral>) -> Result<()>;

// Learner profile
pub fn init_learner(ctx: Context<InitLearner>) -> Result<()>;
```

### Instruction Details: Post-Lesson Flow

**`finalize_course` (~50K CU, Backend-Signed):**
- Verifies all lessons in enrollment bitmap match course lesson_count
- Mints `course.completion_bonus_xp` to learner
- Awards `course.creator_reward_xp` to creator (if completion threshold met)
- Increments `course.total_completions`
- Sets `enrollment.completed_at = now`
- Emits `CourseFinalized` event (includes bonus_xp field)
- **Does NOT interact with Metaplex Core**

**`issue_credential` (~50-100K CU, Backend-Signed):**
- Requires `enrollment.completed_at.is_some()` (finalize_course must have run)
- Takes `credential_name: String` and `metadata_uri: String` as parameters (backend constructs both — no `format!()` on-chain)
- Checks `enrollment.credential_asset`: if `None` → create new NFT; if `Some` → upgrade existing
- If new: CPI to Metaplex Core `createV2` with PermanentFreezeDelegate + Attributes plugins, stores asset pubkey in `enrollment.credential_asset`
- If upgrading: CPI to Metaplex Core `updateV1` + `updatePluginV1` for new level/URI/name
- Config PDA signs as collection update authority (not direct asset authority)
- Emits `CredentialIssued` event
- **No DAS API dependency for writes** — create-vs-upgrade decision is fully on-chain
- **CPI failure does not affect XP awards** (already in learner account from finalize_course)

**Error Codes:**
```rust
#[msg("Course not finalized; requires finalize_course to succeed first")]
CourseNotFinalized,
```

### Internal Operations (Not Public Instructions)

- `create_or_upgrade_credential` — CPI to Metaplex Core program, called by `issue_credential`
- `mint_xp` — CPI to Token-2022, called by `complete_lesson`, `finalize_course`

### Estimated Compute Units

| Instruction | Est. CU | Notes |
| --- | --- | --- |
| initialize | ~50,000 | Config PDA init + Token-2022 mint creation |
| update_config | ~5,000 | Field updates |
| create_course | ~15,000 | Course PDA init |
| update_course | ~10,000 | Field updates |
| enroll | ~15,000 | PDA init + prerequisite check |
| complete_lesson | ~30,000 | Bitmap + XP mint CPI |
| finalize_course | ~50,000 | Bitmap verification + XP mints (learner + creator) |
| issue_credential | ~50-100,000 | Metaplex Core CPI (create or update) |
| close_enrollment | ~5,000 | Account close |

---

## 9. Events

### V1 Events (8 Events)

```rust
#[event] pub struct ConfigUpdated { pub field: String, pub timestamp: i64 }

#[event] pub struct CourseCreated {
    pub course: Pubkey, pub course_id: String, pub creator: Pubkey,
    pub track_id: u16, pub track_level: u8, pub timestamp: i64,
}

#[event] pub struct CourseUpdated {
    pub course: Pubkey, pub version: u16, pub timestamp: i64,
}

#[event] pub struct Enrolled {
    pub learner: Pubkey, pub course: Pubkey, pub timestamp: i64,
}

#[event] pub struct LessonCompleted {
    pub learner: Pubkey, pub course: Pubkey, pub lesson_index: u8,
    pub xp_earned: u32, pub timestamp: i64,
}

#[event] pub struct CourseFinalized {
    pub learner: Pubkey, pub course: Pubkey,
    pub bonus_xp: u32, pub creator: Pubkey, pub creator_xp: u32, pub timestamp: i64,
}

#[event] pub struct CredentialIssued {
    pub learner: Pubkey, pub track_id: u16,
    pub credential_asset: Pubkey, pub credential_created: bool,
    pub credential_upgraded: bool, pub current_level: u8, pub timestamp: i64,
}

#[event] pub struct EnrollmentClosed {
    pub learner: Pubkey, pub course: Pubkey,
    pub completed: bool, pub rent_reclaimed: u64, pub timestamp: i64,
}
```

### V2 Events (added with deferred instructions)

```rust
#[event] pub struct LearnerInitialized { pub learner: Pubkey, pub timestamp: i64 }
#[event] pub struct AchievementClaimed { pub learner: Pubkey, pub achievement_index: u8, pub xp_reward: u32, pub timestamp: i64 }
#[event] pub struct StreakBroken { pub learner: Pubkey, pub final_streak: u16, pub days_missed: u16, pub timestamp: i64 }
#[event] pub struct StreakMilestone { pub learner: Pubkey, pub milestone: u16, pub timestamp: i64 }
#[event] pub struct StreakFreezesUsed { pub learner: Pubkey, pub freezes_used: u8, pub freezes_remaining: u8, pub timestamp: i64 }
#[event] pub struct StreakFreezeAwarded { pub learner: Pubkey, pub freezes_remaining: u8, pub timestamp: i64 }
#[event] pub struct ReferralRegistered { pub referrer: Pubkey, pub referee: Pubkey, pub timestamp: i64 }
#[event] pub struct SeasonCreated { pub season: u16, pub mint: Pubkey, pub timestamp: i64 }
#[event] pub struct SeasonClosed { pub season: u16, pub timestamp: i64 }
```

---

## 10. Cost Analysis

### One-Time Setup

| Item | Cost |
| --- | --- |
| Deploy program | ~2 SOL |
| Config PDA + XP mint | ~0.003 SOL |
| Track collection NFTs (~5 tracks) | ~0.015 SOL |
| **Total setup** | **~2 SOL** |

### Per Course

| Item | Cost |
| --- | --- |
| Course PDA rent | ~0.002 SOL |
| Content upload (Arweave) | ~$0.01-0.05 |

### Per Learner (Annual Journey)

| Action | Count | Tx Fee | Rent |
| --- | --- | --- | --- |
| Enroll (5 courses) | 5 | ~0.00005 | 0.005 (reclaimable) |
| Complete lessons (100) | 100 | ~0.001 | — |
| Finalize courses (5) | 5 | ~0.0005 | — |
| Issue credentials (5) | 5 | ~0.0005 | — |
| Credential create (first in track) | ~3 | ~0.0003 | 0.018 (Metaplex Core NFTs) |
| Credential upgrades | ~2 | ~0.0001 | — (update only, no new rent) |
| Close enrollments | 5 | ~0.00005 | -0.005 (reclaimed) |
| **Net annual cost** | | | **~0.019 SOL** |

### Scale Projections

| Learners | Annual Cost | Notes |
| --- | --- | --- |
| 1,000 | ~19 SOL | ~$3.8K at $200/SOL |
| 10,000 | ~190 SOL | ~$38K at $200/SOL |
| 100,000 | ~1,900 SOL | Consider ZK Compression migration at this scale |

---

## 11. Security Model

### Authorities

| Role | Permissions | Implementation |
| --- | --- | --- |
| Platform Authority | Initialize, create seasons, create courses, update config | Multisig (Squads) |
| Course Authority | Update/deactivate specific course | Per-course pubkey |
| Backend Signer | Complete lessons, finalize courses, issue credentials | Rotatable server keypair (in Config PDA) |
| Learner | Enroll, close enrollment | Wallet signature |

### Access Control Matrix

| Instruction | Platform | Course Auth | Backend | Learner |
| --- | --- | --- | --- | --- |
| initialize | ✅ | | | |
| update_config | ✅ | | | |
| create_course | ✅ | | | |
| update_course | | ✅ | | |
| enroll | | | | ✅ |
| complete_lesson | | | ✅ | |
| finalize_course | | | ✅ | |
| issue_credential | | | ✅ | |
| close_enrollment | | | | ✅ |

### Key Security Properties

1. **Soulbound + PermanentDelegate XP** — Cannot transfer or self-burn
2. **Rotatable backend signer** — Key rotation without program upgrade
3. **Backend rate limiting** — Off-chain daily XP caps, lesson throttling
4. **Bitmap double-check** — Can't complete same lesson twice
5. **Prerequisite enforcement** — On-chain check before enrollment
6. **Credential authority** — Only program (via Config PDA as collection update authority) can create/update credential NFTs
7. **Finalize-before-issue ordering** — `finalize_course` must succeed before `issue_credential` to prevent credential creation without XP awards
8. **XP amounts read from on-chain state** — `complete_lesson` reads `xp_per_lesson` from Course PDA, not from instruction parameters

---

## 12. TypeScript SDK Interface

### Layer 1: Direct Account Reads (No Indexer Needed)

```typescript
interface DirectReads {
    getConfig(): Promise<Config>;
    getCourse(courseId: string): Promise<Course>;
    getEnrollment(wallet: PublicKey, courseId: string): Promise<Enrollment | null>;
    getXPBalance(wallet: PublicKey): Promise<number>;
}
```

### Layer 2: Indexed Queries (Requires Indexer)

```typescript
interface IndexedQueries {
    // XP & Rankings (Helius DAS API)
    getLeaderboard(options?: { limit?: number }): Promise<LeaderboardEntry[]>;
    getRank(wallet: PublicKey): Promise<number>;

    // Credentials (Helius DAS API — Metaplex Core NFTs)
    getCredentials(wallet: PublicKey): Promise<Credential[]>;
    getCredentialByTrack(wallet: PublicKey, trackId: number): Promise<Credential | null>;
    getCredentialHistory(assetAddress: PublicKey): Promise<CredentialVersion[]>;

    // Aggregated
    getAllCourses(options?: { activeOnly?: boolean }): Promise<Course[]>;
    getCoursesByTrack(trackId: number): Promise<Course[]>;
    getAllEnrollments(wallet: PublicKey): Promise<Enrollment[]>;
    getCreatorStats(wallet: PublicKey): Promise<CreatorStats>;
}
```

### Layer 3: Transaction Builders

```typescript
interface TransactionBuilders {
    // Learner actions
    enroll(courseId: string): Promise<TransactionSignature>;
    closeEnrollment(courseId: string): Promise<TransactionSignature>;

    // Backend actions (require backend signer)
    completeLesson(params: CompleteLessonParams): Promise<TransactionSignature>;
    finalizeCourse(params: FinalizeCourseParams): Promise<TransactionSignature>;
    issueCredential(params: IssueCredentialParams): Promise<TransactionSignature>;

    // Admin actions (require platform authority)
    initialize(): Promise<TransactionSignature>;
    updateConfig(newBackendSigner?: PublicKey): Promise<TransactionSignature>;
    createCourse(params: CreateCourseParams): Promise<TransactionSignature>;
    updateCourse(courseId: string, params: UpdateCourseParams): Promise<TransactionSignature>;
}
```

---

## 13. Infrastructure Requirements

### RPC Provider

Standard Solana RPC + DAS API support:
- **Helius** — DAS API (for XP leaderboard and credential NFT queries)
- **QuickNode** — Alternative with DAS API support

### Indexer Dependencies

| Data | Indexer | Endpoint |
| --- | --- | --- |
| XP token balances | Helius DAS API | `getTokenHolders` |
| Credential NFTs | Helius DAS API | `getAssetsByOwner`, `getAssetsByGroup` |
| Events/history | Helius webhooks or custom | Transaction log parsing |

### Backend Requirements

For the full course completion flow with credentials:

1. **`complete_lesson` calls:**
   - Validate lesson completion (quiz/content progress)
   - Check rate limits (lessons/hour, XP/day)
   - Sign + submit transaction

2. **`finalize_course` call:**
   - Verify all lessons marked as complete in bitmap
   - Sign + submit transaction
   - Wait for confirmation

3. **`issue_credential` call:**
   - Read `enrollment.credential_asset` on-chain (no DAS API needed)
   - If `None`: generate new asset keypair, build create transaction
   - If `Some(pubkey)`: build update transaction (new URI + attributes)
   - Sign + submit sequentially after finalize_course
   - If fails, log error; learner already has XP, retry later

### Backend Architecture (Recommended)

```
Next.js API Routes (Vercel) + AWS KMS
├── POST /api/complete-lesson   → validate quiz → rate limit → KMS sign → submit TX
├── POST /api/finalize-course   → verify bitmap → KMS sign → submit TX
└── POST /api/issue-credential  → read enrollment → construct name/uri → KMS sign → submit TX

KMS: backend_signer private key never leaves KMS boundary.
Rotation: generate new KMS key → update_config(new_signer) → deactivate old key.

Rate Limiting: Redis/Upstash for per-user counters (lessons/hour, XP/day).
```

---

## Appendix A: Account Size Summary

| Account | Size (bytes) | Rent | Closeable | Type |
| --- | --- | --- | --- | --- |
| Config | ~113 | ~0.001 SOL | No | Regular PDA |
| Course | ~224 | ~0.002 SOL | No | Regular PDA |
| Enrollment | ~127 | ~0.001 SOL | **Yes** | Regular PDA |
| Credential | ~200 (Core asset) | ~0.006 SOL | No | Metaplex Core NFT |

## Appendix B: Error Codes

```rust
#[error_code]
pub enum AcademyError {
    // V1 errors (19 errors)
    #[msg("Unauthorized signer")] Unauthorized,
    #[msg("Course not active")] CourseNotActive,
    #[msg("Already enrolled")] AlreadyEnrolled,
    #[msg("Not enrolled")] NotEnrolled,
    #[msg("Lesson index out of bounds")] LessonOutOfBounds,
    #[msg("Lesson already completed")] LessonAlreadyCompleted,
    #[msg("Not all lessons completed")] CourseNotCompleted,
    #[msg("Course already finalized")] CourseAlreadyFinalized,
    #[msg("Course not finalized")] CourseNotFinalized,
    #[msg("Prerequisite not met")] PrerequisiteNotMet,
    #[msg("Close cooldown not met (24h)")] UnenrollCooldown,
    #[msg("Enrollment/course mismatch")] EnrollmentCourseMismatch,
    #[msg("Arithmetic overflow")] Overflow,
    #[msg("Invalid course ID")] InvalidCourseId,
    #[msg("Invalid lesson count")] InvalidLessonCount,
    #[msg("Invalid track ID")] InvalidTrackId,
    #[msg("Invalid XP amount")] InvalidXPAmount,
    #[msg("Credential asset mismatch")] CredentialAssetMismatch,
    #[msg("Backend signer mismatch")] BackendSignerMismatch,

    // V2 errors (reserved for deferred instructions)
    // #[msg("Achievement already claimed")] AchievementAlreadyClaimed,
    // #[msg("Season already closed")] SeasonClosed,
    // #[msg("Season not active")] SeasonNotActive,
    // #[msg("Cannot refer yourself")] SelfReferral,
    // #[msg("Already has a referrer")] AlreadyReferred,
    // #[msg("Referrer not found")] ReferrerNotFound,
    // #[msg("Daily XP limit exceeded")] DailyXPLimitExceeded,
}
```

## Appendix C: Upgrade Path

### No Program Upgrade Needed

- New tracks → Off-chain registry
- New courses → `create_course`
- Rotate backend signer → `update_config`
- Adjust rate limits → `update_config`

### Program Upgrades (V2)

Deployed as **upgradeable** with platform multisig as upgrade authority:

- Season lifecycle (`create_season`, `close_season`)
- Achievement system (`claim_achievement`) with fixed on-chain XP amounts
- Streak freezes (`award_streak_freeze`) with MAX_STREAK_FREEZES cap
- Referral tracking (`register_referral`) and later referral XP rewards
- Credential categories: Streak, Platform, Special (new instructions)
- ZK Compression migration — Migrate credentials to compressed accounts when wallet support matures and scale warrants cost reduction
- SPL token rewards for creators (escrow model)
- Guild/team accounts
- On-chain governance for curriculum
- Cross-program composability (DAO gating via credential NFT ownership, job boards)

---

*End of Specification v2.0 (Simplified V1 — Backend-Enforced Anti-Cheat, Metaplex Core Credentials)*
