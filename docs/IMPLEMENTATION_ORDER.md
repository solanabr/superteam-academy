# Superteam Academy — Implementation Order

Incremental build plan. Each phase produces a testable, deployable artifact. Ship Phase 1-5 first (working learning platform), then layer on Phase 6-10 (gamification and polish).

---

## Phase 1: Foundation — Config PDA + Season Management

**Instructions:** `initialize`, `create_season`, `close_season`, `update_config`

**What you get:** Platform singleton with rotatable backend signer, rate limit caps, and season lifecycle. Everything else depends on this.

**Accounts:** Config PDA

**Tests:**
- Initialize creates Config with correct values
- `create_season` mints Token-2022 with NonTransferable + PermanentDelegate
- `close_season` prevents further minting
- `update_config` rotates backend signer
- `update_config` adjusts rate limits
- Only authority can call management instructions

**Estimated effort:** 1-2 days

---

## Phase 2: User Onboarding — LearnerProfile

**Instructions:** `init_learner`

**What you get:** Learners can create profiles. Foundation for streaks, achievements, and rate limiting.

**Accounts:** LearnerProfile PDA

**Tests:**
- `init_learner` creates profile with zeroed fields
- Duplicate init fails
- PDA derivation matches `["learner", user_pubkey]`

**Estimated effort:** 0.5 days

---

## Phase 3: Content Management — Course Registry

**Instructions:** `create_course`, `update_course`

**What you get:** Authority can register courses with content references, track assignments, and creator economics.

**Accounts:** Course PDA

**Tests:**
- `create_course` with all fields (track, difficulty, lesson_count, XP, prerequisite)
- `update_course` modifies content_tx_id, increments version
- `update_course` toggles is_active
- Only authority/course_authority can modify
- PDA derivation matches `["course", course_id_bytes]`

**Estimated effort:** 1 day

---

## Phase 4: Core Learning Loop — Enrollment + Lessons

**Instructions:** `enroll`, `complete_lesson`

**What you get:** The core product loop. Learners enroll in courses, complete lessons (backend-signed), earn per-lesson XP (`course.xp_per_lesson`), and streaks update automatically.

**Accounts:** Enrollment PDA (with `credential_asset: Option<Pubkey>` and `_reserved`)

**Key logic:**
- Prerequisite check on enroll (if course has prerequisite, verify learner has completed it)
- Bitmap manipulation for lesson tracking
- XP minting via Token-2022 CPI (`course.xp_per_lesson` — not a parameter, read from Course)
- Streak update as side effect of `complete_lesson` (simple case: no freezes in Phase 4)
- On-chain daily XP rate limiting (reads `config.max_daily_xp`)
- Checked arithmetic throughout

**Tests:**
- Enroll creates enrollment with correct snapshot, `credential_asset = None`
- Prerequisite enforcement (with and without)
- `complete_lesson` sets correct bit in bitmap
- `complete_lesson` mints `xp_per_lesson` to learner token account
- `complete_lesson` updates streak (same day, next day, gap → broken)
- Double-completion of same lesson fails
- Daily XP cap enforced (reads from config, not constant)
- Only backend signer can call `complete_lesson`

**Estimated effort:** 3-4 days (most complex phase)

---

## Phase 5: Completion — Finalize + Bonus + Close

**Instructions:** `finalize_course`, `claim_completion_bonus`, `close_enrollment`

**What you get:** Course completion awards creator XP, learner claims bonus XP separately, enrollment can be closed (both incomplete with 24h cooldown and completed). Working learning platform with economic incentives.

**Key logic:**
- Verify all lessons complete (bitmap popcount == lesson_count)
- Mint creator XP (`course.creator_reward_xp`, gated by `min_completions_for_reward`)
- Set `enrollment.completed_at`
- Increment `course.total_completions`
- `claim_completion_bonus`: learner-signed, mints `course.completion_bonus_xp`, one-time per enrollment
- `close_enrollment`: unified handler — completed courses close freely, incomplete courses require 24h cooldown

**Tests:**
- Finalize with incomplete bitmap fails
- Finalize awards correct XP to creator only (learner XP already minted per-lesson)
- Creator reward gated by min_completions_for_reward
- Double finalize fails (completed_at already set)
- `claim_completion_bonus` works after finalization, fails before
- `claim_completion_bonus` cannot be called twice
- `claim_completion_bonus` respects daily XP cap
- `close_enrollment` on completed course succeeds immediately
- `close_enrollment` on incomplete course requires 24h cooldown
- `close_enrollment` returns rent to learner

**Estimated effort:** 1-2 days

---

**Milestone: Phases 1-5 = Working Learning Platform**

At this point you have: config management, learner profiles, course registry, enrollment, lesson completion with per-lesson XP, streaks, course finalization with creator rewards, learner completion bonus claiming, and enrollment close/unenroll. Deploy to devnet and test the full flow end-to-end.

---

## Phase 6: Credentials — Metaplex Core NFTs

**Instructions:** `issue_credential`

**What you get:** Soulbound, wallet-visible credential NFTs that upgrade as learners progress through tracks. Immediately visible in Phantom, Backpack, Solflare.

**Pre-work:** Create Metaplex Core collection NFTs for each track (one-time authority action, off-chain or via admin script).

**Key logic:**
- Requires `enrollment.completed_at.is_some()` (finalize_course ran first)
- Checks `enrollment.credential_asset`: `None` → create, `Some` → upgrade (**no DAS API needed**)
- Metaplex Core CPI: `createV2` (new) or `updateV1` + `updatePluginV1` (upgrade)
- PermanentFreezeDelegate plugin makes NFTs soulbound on mint
- Attributes plugin stores level, courses_completed, total_xp on-chain
- Stores new asset pubkey in `enrollment.credential_asset` after create

**Dependencies:** `mpl-core` crate, Metaplex Core program (on-chain)

**Tests:**
- Issue credential for first course in track (create new NFT)
- Issue credential for subsequent course (upgrade existing NFT)
- Credential level and attributes update correctly
- NFT is frozen (PermanentFreezeDelegate) — transfer fails
- Cannot issue without finalize_course
- NFT belongs to correct track collection

**Estimated effort:** 1-2 days (well-documented CPI, standard patterns)

---

## Phase 7: Gamification — Achievements

**Instructions:** `claim_achievement`

**What you get:** Achievement system with bitmap tracking and XP rewards.

**Key logic:**
- Bitmap check for double-claim prevention
- XP capped by config.max_achievement_xp
- Daily rate limit applies to achievement XP

**Tests:**
- Claim sets correct bit in achievement_flags
- Double claim fails
- XP cap enforced
- Daily limit enforced

**Estimated effort:** 1 day

---

## Phase 8: Streak Polish — Freeze Awards + Multi-Day Freeze Support

**Instructions:** `award_streak_freeze`

**What you get:** Backend can award streak freezes to learners (via achievements, events, or manual grants). Update `update_streak` to consume multiple freezes for multi-day gaps.

**Key logic:**
- Backend-signed instruction
- Increments `learner.streak_freezes` (cap at 255)
- Emits `StreakFreezeAwarded` event
- Update `update_streak` (from Phase 4) to handle multi-day freeze stacking:
  - Gap of N missed days consumes N freezes if available
  - If insufficient freezes, streak breaks entirely (no partial consumption)

**Tests:**
- Award increments counter
- Only backend signer can call
- Counter doesn't overflow (checked_add to 255)
- Multi-day gap with sufficient freezes → streak continues, freezes decremented
- Multi-day gap with insufficient freezes → streak broken
- Emits `StreakFreezesUsed` event with correct counts

**Estimated effort:** 0.5 days

---

## Phase 9: Growth — Referrals (Analytics-Only)

**Instructions:** `register_referral`

**What you get:** Referral tracking for growth analytics. No XP reward in v1 — referral rewards deferred to V2.

**Key logic:**
- Validate referrer LearnerProfile exists
- Prevent self-referral
- One-time registration per learner
- Increment referrer's referral_count

**Tests:**
- Register referral increments referrer count
- Self-referral fails
- Double registration fails
- Non-existent referrer fails

**Estimated effort:** 0.5 days

---

## ~~Phase 10: Cleanup — Close Enrollment~~ (Merged into Phase 5)

`close_enrollment` is now part of Phase 5. It handles both incomplete (unenroll with 24h cooldown) and completed enrollment closure in a single instruction.

---

## Summary Timeline

| Phase | Days | Cumulative | What Ships |
| --- | --- | --- | --- |
| 1. Config + Seasons | 1-2 | 2 | Platform foundation |
| 2. Learner Profile | 0.5 | 2.5 | User onboarding |
| 3. Course Registry | 1 | 3.5 | Content management |
| 4. Enrollment + Lessons | 3-4 | 7.5 | Core learning loop |
| 5. Completion + Close | 1-2 | 9.5 | **Working platform** (finalize, bonus, close) |
| 6. Credentials (Core) | 1-2 | 11.5 | Wallet-visible credentials |
| 7. Achievements | 1 | 12.5 | Gamification |
| 8. Streak Freezes | 0.5 | 13 | Multi-day freeze stacking |
| 9. Referrals | 0.5 | 13.5 | Analytics tracking |

**Total: ~13.5 working days for the full program.**

Phases 1-5 (~10 days) give you a deployable MVP. Phases 6-9 (~3.5 days) add the differentiating features.

---

## Devnet Testing Checkpoints

After each milestone:

1. **After Phase 5:** Full end-to-end test on devnet. Create config, season, course. Init learner, enroll, complete all lessons, finalize course. Verify XP balances.

2. **After Phase 6:** Credential NFT creation and upgrade on devnet. Verify NFT appears in wallet. Test soulbound (transfer fails). Verify DAS API returns credential.

3. **After Phase 10:** Full regression test. All 16 instructions exercised. Run for multiple days to verify streak logic across day boundaries.

---

## CI/CD Milestones

| Gate | Requirement |
| --- | --- |
| PR merge | `anchor build` + `cargo fmt --check` + `cargo clippy -- -W clippy::all` + unit tests |
| Devnet deploy | All integration tests passing + CU profiling within budget |
| Mainnet deploy | Fuzz testing (10+ min), security audit, AI slop review, explicit approval |

---

*Refer to SPEC.md for detailed account structures and instruction signatures.*
