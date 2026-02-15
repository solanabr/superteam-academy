# Superteam Academy — Future Improvements

Items deferred from V1 to keep the initial release lean. Ordered roughly by expected impact.

---

## V2: Deferred from V1 + Platform Maturity

### 0. V1 Deferrals (Ship First in V2)

**Seasons:** `create_season`, `close_season` — new Token-2022 mint per season, old tokens as history. Requires per-learner ATA per season.

**Achievements:** `claim_achievement` — bitmap tracking + XP rewards. Requires on-chain achievement registry or fixed XP from Config.

**Streak Freezes:** `award_streak_freeze` — backend awards freezes, multi-day stacking in `update_streak`. Add `MAX_STREAK_FREEZES` cap.

**Referrals:** `register_referral` — analytics-only tracking. Referral XP rewards in later V2.

**Complexity:** Low-Medium. These are fully specified in SPEC.md; implementation is straightforward since account structures already have reserved fields.

---

### 1. On-Chain Track Registry

**Problem:** Track IDs are validated off-chain only. The program can't reject invalid `track_id` values during `create_course`, and track ordering (beginner before intermediate) isn't enforceable on-chain.

**Approach:** Add a `TrackConfig` PDA per track, or encode valid track IDs as a bitmap in the Config PDA. Each track entry stores: name hash, max levels, required ordering, and whether it's active.

**Seeds:** `["track", track_id.to_le_bytes()]`

**Complexity:** Low. 1 new PDA type, 2 new instructions (`create_track`, `update_track`). Constraint added to `create_course` to validate `track_id` exists.

---

### 2. Time-Based Decay for Creator Rewards

**Problem:** `min_completions_for_reward` is a static threshold that only delays Sybil attacks (alt accounts can grind past it). It doesn't scale with time or distinguish organic growth from manipulation.

**Approach:** Replace with a decay function:

```rust
fn creator_reward(base_xp: u32, course: &Course) -> u32 {
    let age_days = (now - course.created_at) / 86400;
    let completions = course.total_completions;

    // Reward scales up with organic growth, decays if completions spike unnaturally
    let daily_rate = completions as f64 / age_days.max(1) as f64;

    if daily_rate > SUSPICIOUS_THRESHOLD {
        // Reduce reward for suspicious velocity
        base_xp / 4
    } else if completions < WARMUP_THRESHOLD {
        // Warmup period: reduced reward
        base_xp / 2
    } else {
        base_xp
    }
}
```

**Alternative:** Gate creator XP on verified identity (Civic, Humanode, or similar attestation). Creators must verify before earning. Stronger defense, but adds external dependency.

**Complexity:** Medium. Modifies `finalize_course` logic, adds fields to Course or Config.

---

### 3. ZK Compression Migration for Credentials

**Problem:** Metaplex Core NFTs cost ~0.006 SOL per credential in rent. At 100K+ learners with multiple tracks, credential rent becomes significant (~600+ SOL).

**Approach:** Migrate credentials from Metaplex Core NFTs to ZK compressed accounts when:
1. Wallet support for compressed assets improves (Phantom, Backpack display them natively)
2. Scale warrants the cost reduction (~$0.001 vs ~$0.75 per credential at $200/SOL)
3. Light Protocol tooling stabilizes for production use

This would require a new `issue_credential_compressed` instruction and potentially a migration path for existing Metaplex Core credentials.

**Complexity:** High. Requires Photon indexer dependency, validity proofs, and wallet display regression testing.

---

### 4. SPL Token Rewards for Creators

**Problem:** Creators currently earn XP (soulbound, no monetary value). For sustainability, creators need real economic incentives.

**Approach:** Escrow model:
1. Platform deposits SPL tokens (USDC, SOL, or a native token) into an escrow vault
2. `finalize_course` distributes a portion to creator based on completion
3. Vesting schedule prevents creators from dumping after a single completion

**Dependencies:** Vault program or escrow PDA, token distribution logic, vesting schedule.

**Complexity:** High. Essentially a mini-vault program. Could reuse patterns from ERC-4626 vault work.

---

### 5. Guild / Team Accounts

**Problem:** No support for cohort-based learning, study groups, or organizational accounts.

**Approach:** `Guild` PDA with:
- Member list (or bitmap if fixed max)
- Shared XP leaderboard (sum of member XP)
- Guild achievements
- Admin/member roles

**Seeds:** `["guild", guild_id]`

**Complexity:** Medium-High. 1-2 new PDA types, 4-6 new instructions (create, join, leave, promote, disband, guild_achievement).

---

### 6. Batch Operations

**Problem:** Completing multiple lessons in a single transaction would reduce costs for power users.

**Approach:** `complete_lessons_batch` instruction that takes a `Vec<u8>` of lesson indices and processes them in a loop. Must stay within compute budget.

**Constraints:** Max ~10 lessons per batch to stay under 200K CU. Each lesson still validates individually.

**Complexity:** Low. Single new instruction wrapping existing logic.

---

### 7. On-Chain Governance for Curriculum

**Problem:** Course creation is authority-gated. As the platform grows, community governance over curriculum would increase decentralization.

**Approach:** Integrate with Realms (SPL Governance) or a custom voting mechanism where XP holders vote on:
- New course proposals
- Track structure changes
- Platform parameter updates

**Complexity:** Very High. Requires governance program integration, proposal system, voting weight calculations.

---

### 8. Cross-Program Composability

**Problem:** Other programs can't easily check a learner's credentials or XP for gating.

**Approach:** Expose read-only CPIs or use credential accounts as proof:
- **DAO gating:** "Must hold Advanced Anchor credential to vote"
- **Job boards:** "Must have 10,000+ XP to apply"
- **DeFi:** "Reduced fees for certified developers"

Since credentials are now Metaplex Core NFTs, other programs can simply verify NFT ownership and read on-chain Attributes plugin data without any special CPI integration.

**Complexity:** Medium. Mostly documentation and example code. Actual CPI interface is already available via account reads.

---

### 9. Streak Challenges

**Problem:** Streaks only track consecutive days. No support for streak-based challenges (e.g., "complete 5 lessons in 3 days").

**Approach:** Add a `Challenge` PDA type with configurable goals:

```rust
pub struct Challenge {
    pub challenge_type: u8,    // 0=streak, 1=volume, 2=speed
    pub target: u32,           // e.g., 5 lessons
    pub timeframe: i64,        // e.g., 3 days in seconds
    pub xp_reward: u32,
    pub starts_at: i64,
    pub ends_at: i64,
}
```

**Complexity:** Medium. 1 new PDA type, 2-3 new instructions.

---

### 10. Analytics Events Enrichment

**Problem:** Current events are minimal. Richer events would enable better analytics without on-chain storage costs.

**Approach:** Add optional data to existing events:
- `LessonCompleted` → add `time_spent_seconds` (backend-provided)
- `CourseFinalized` → add `total_time_seconds`, `attempt_count`
- New event: `SessionStarted` for engagement tracking

Events cost minimal CU and enable powerful off-chain analytics pipelines.

**Complexity:** Low. Modify existing event structs, no new accounts.

---

## V3: Scale & Interoperability

### 11. Multi-Chain Credentials

Bridge credentials to other chains (Ethereum, Polygon) for broader recognition.

### 12. AI-Powered Content Validation

Use AI models to validate course content quality before on-chain registration.

### 13. Reputation Score

Composite score combining XP, streaks, credentials, referrals, and community contributions. Stored as a derived value or separate compressed account.

### 14. Marketplace for Courses

Allow creators to set prices (in SOL or USDC) for premium courses, with platform fees.

---

## Priority Matrix

| Improvement | Impact | Effort | Priority |
| --- | --- | --- | --- |
| Seasons (deferred from V1) | Medium | Low | V2.0 |
| Achievements (deferred from V1) | Medium | Low | V2.0 |
| Streak freezes (deferred from V1) | Low | Low | V2.0 |
| Referrals (deferred from V1) | Low | Low | V2.0 |
| Time-based creator decay | High | Medium | V2.0 |
| Track registry on-chain | Medium | Low | V2.0 |
| Batch operations | Medium | Low | V2.0 |
| Analytics enrichment | Medium | Low | V2.0 |
| SPL token rewards | High | High | V2.1 |
| Guild accounts | Medium | Medium | V2.1 |
| ZK Compression migration | Medium | High | V2.1+ |
| Streak challenges | Low | Medium | V2.2 |
| Cross-program composability | High | Medium | V2.2 |
| On-chain governance | Medium | Very High | V3.0 |
| Multi-chain credentials | Medium | Very High | V3.0 |

---

*This document is a living backlog. Items may be reprioritized based on user feedback and ecosystem developments.*
