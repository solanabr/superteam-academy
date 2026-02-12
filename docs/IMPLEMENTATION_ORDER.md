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

**Instructions:** `enroll`, `complete_lesson`, `unenroll`

**What you get:** The core product loop. Learners enroll in courses, complete lessons (backend-signed), earn per-lesson XP, and streaks update automatically.

**Accounts:** Enrollment PDA

**Key logic:**
- Prerequisite check on enroll (if course has prerequisite, verify learner has completed it)
- Bitmap manipulation for lesson tracking
- XP minting via Token-2022 CPI
- Streak update as side effect of `complete_lesson`
- On-chain daily XP rate limiting
- 24h cooldown on unenroll

**Tests:**
- Enroll creates enrollment with correct snapshot
- Prerequisite enforcement (with and without)
- `complete_lesson` sets correct bit in bitmap
- `complete_lesson` mints XP to learner token account
- `complete_lesson` updates streak (same day, next day, gap, freeze)
- Double-completion of same lesson fails
- Daily XP cap enforced
- Unenroll after 24h works, before 24h fails
- Only backend signer can call `complete_lesson`

**Estimated effort:** 3-4 days (most complex phase)

---

## Phase 5: Rewards — XP Minting + Course Completion

**Instructions:** `finalize_course`

**What you get:** Course completion awards XP to both learner and creator. Working learning platform with economic incentives.

**Key logic:**
- Verify all lessons complete (bitmap popcount == lesson_count)
- Mint XP to learner (course.xp_total)
- Mint XP to creator (course.completion_reward_xp, gated by min_completions)
- Set enrollment.completed_at
- Increment course.total_completions

**Tests:**
- Finalize with incomplete bitmap fails
- Finalize awards correct XP to learner and creator
- Creator reward gated by min_completions_for_reward
- Double finalize fails (completed_at already set)
- Rate limit still enforced for finalize XP

**Estimated effort:** 1-2 days

---

**Milestone: Phases 1-5 = Working Learning Platform**

At this point you have: config management, learner profiles, course registry, enrollment, lesson completion with XP, streaks, and course finalization. Deploy to devnet and test the full flow end-to-end.

---

## Phase 6: Credentials — ZK Compression Integration

**Instructions:** `issue_credential`

**What you get:** Verifiable, rent-free credentials that upgrade as learners progress through tracks. The core differentiator.

**Key logic:**
- Requires `enrollment.completed_at.is_some()` (finalize_course ran first)
- Light Protocol CPI for compressed account creation/update
- Deterministic address derivation: `["credential", learner, track_id]`
- Create new credential (first course in track) or upgrade existing
- Validity proof from Photon indexer

**Dependencies:** Light SDK integration, Photon RPC endpoint

**Tests:**
- Issue credential for first course in track (create)
- Issue credential for subsequent course (upgrade)
- Credential level updates correctly
- Cannot issue without finalize_course
- Address derivation is deterministic and consistent

**Estimated effort:** 3-4 days (new CPI pattern, ZK Compression learning curve)

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

## Phase 8: Streak Polish — Freeze Awards

**Instructions:** `award_streak_freeze`

**What you get:** Backend can award streak freezes to learners (via achievements, events, or manual grants).

**Key logic:**
- Backend-signed instruction
- Increments learner.streak_freezes (cap at 255)
- Emits StreakFreezeAwarded event

**Tests:**
- Award increments counter
- Only backend signer can call
- Counter doesn't overflow

**Estimated effort:** 0.5 days

---

## Phase 9: Growth — Referrals

**Instructions:** `register_referral`

**What you get:** Referral tracking for growth analytics.

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

## Phase 10: Cleanup — Close Enrollment

**Instructions:** `close_enrollment`

**What you get:** Rent reclamation for completed courses. Platform polish.

**Key logic:**
- Requires completed_at.is_some()
- Returns rent to learner
- Emits EnrollmentClosed event

**Tests:**
- Close returns rent
- Cannot close incomplete enrollment
- Account is removed after close

**Estimated effort:** 0.5 days

---

## Summary Timeline

| Phase | Days | Cumulative | What Ships |
| --- | --- | --- | --- |
| 1. Config + Seasons | 1-2 | 2 | Platform foundation |
| 2. Learner Profile | 0.5 | 2.5 | User onboarding |
| 3. Course Registry | 1 | 3.5 | Content management |
| 4. Enrollment + Lessons | 3-4 | 7.5 | Core learning loop |
| 5. Finalize Course | 1-2 | 9.5 | **Working platform** |
| 6. Credentials (ZK) | 3-4 | 13.5 | Verifiable credentials |
| 7. Achievements | 1 | 14.5 | Gamification |
| 8. Streak Freezes | 0.5 | 15 | Streak polish |
| 9. Referrals | 0.5 | 15.5 | Growth mechanism |
| 10. Close Enrollment | 0.5 | 16 | Rent reclaim |

**Total: ~16 working days for the full program.**

Phases 1-5 (~10 days) give you a deployable MVP. Phases 6-10 (~6 days) add the differentiating features.

---

## Devnet Testing Checkpoints

After each milestone:

1. **After Phase 5:** Full end-to-end test on devnet. Create config, season, course. Init learner, enroll, complete all lessons, finalize course. Verify XP balances.

2. **After Phase 6:** Credential creation and upgrade on devnet. Verify Photon indexing. Test validity proof flow.

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
