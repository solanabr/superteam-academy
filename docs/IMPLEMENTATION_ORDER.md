# Superteam Academy — Implementation Order

Incremental build plan. Each phase produces a testable, deployable artifact. 5 phases for a complete V1 learning platform with credentials.

---

## Phase 1: Foundation — Config PDA + XP Mint

**Instructions:** `initialize`, `update_config`

**What you get:** Platform singleton with rotatable backend signer and single XP mint (Token-2022). Everything else depends on this.

**Accounts:** Config PDA

**Key logic:**
- `initialize` creates Config PDA and the XP mint in one transaction
- XP mint uses Token-2022 with NonTransferable + PermanentDelegate + MetadataPointer + TokenMetadata
- Config PDA is the mint authority (via PDA signer)
- `update_config` rotates backend signer

**Tests:**
- Initialize creates Config with correct values and XP mint
- XP mint has correct extensions (NonTransferable, PermanentDelegate)
- `update_config` rotates backend signer
- Only authority can call management instructions
- Double initialize fails

**Estimated effort:** 1 day

---

## Phase 2: Content Management — Course Registry

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

## Phase 3: Core Learning Loop — Enrollment + Lessons

**Instructions:** `enroll`, `complete_lesson`

**What you get:** The core product loop. Learners enroll in courses, complete lessons (backend-signed), and earn per-lesson XP.

**Accounts:** Enrollment PDA

**Key logic:**
- Prerequisite check on enroll (if course has prerequisite, verify learner has completed it)
- Bitmap manipulation for lesson tracking
- XP minting via Token-2022 CPI (`course.xp_per_lesson` — read from Course PDA, not a parameter)
- Backend enforces rate limiting off-chain before signing
- Checked arithmetic throughout

**Tests:**
- Enroll creates enrollment, `credential_asset = None`
- Prerequisite enforcement (with and without)
- `complete_lesson` sets correct bit in bitmap
- `complete_lesson` mints `xp_per_lesson` to learner token account
- Double-completion of same lesson fails
- Only backend signer can call `complete_lesson`
- Inactive course enrollment fails

**Estimated effort:** 2 days

---

## Phase 4: Completion — Finalize + Close

**Instructions:** `finalize_course`, `close_enrollment`

**What you get:** Course completion awards creator XP and learner bonus XP, enrollment can be closed. **Working learning platform with economic incentives.**

**Key logic:**
- Verify all lessons complete (bitmap popcount == lesson_count)
- Mint completion bonus XP to learner (`course.completion_bonus_xp`)
- Mint creator XP (`course.creator_reward_xp`, gated by `min_completions_for_reward`)
- Set `enrollment.completed_at`
- Increment `course.total_completions`
- `close_enrollment`: unified handler — completed courses close freely, incomplete courses require 24h cooldown

**Tests:**
- Finalize with incomplete bitmap fails
- Finalize awards correct XP to both learner and creator
- Creator reward gated by min_completions_for_reward
- Double finalize fails (completed_at already set)
- `close_enrollment` on completed course succeeds immediately
- `close_enrollment` on incomplete course requires 24h cooldown
- `close_enrollment` returns rent to learner

**Estimated effort:** 1.5 days

---

**Milestone: Phases 1-4 = Working Learning Platform**

At this point you have: config management, course registry, enrollment, lesson completion with per-lesson XP, course finalization with creator rewards and learner completion bonus, and enrollment close. Deploy to devnet and test the full flow end-to-end.

---

## Phase 5: Credentials — Metaplex Core NFTs

**Instructions:** `issue_credential`

**What you get:** Soulbound, wallet-visible credential NFTs that upgrade as learners progress through tracks. Immediately visible in Phantom, Backpack, Solflare.

**Pre-work:** Create Metaplex Core collection NFTs for each track (one-time authority action, off-chain or via admin script). Config PDA must be the update authority of each collection.

**Key logic:**
- Requires `enrollment.completed_at.is_some()` (finalize_course ran first)
- Checks `enrollment.credential_asset`: `None` → create, `Some` → upgrade (**no DAS API needed**)
- Metaplex Core CPI: `createV2` (new) or `updateV1` + `updatePluginV1` (upgrade)
- PermanentFreezeDelegate plugin makes NFTs soulbound on mint
- Attributes plugin stores level, courses_completed, total_xp on-chain
- Backend passes `credential_name` and `metadata_uri` as parameters (no `format!()` on-chain)
- Stores new asset pubkey in `enrollment.credential_asset` after create

**Dependencies:** `mpl-core` crate, Metaplex Core program (on-chain)

**Tests:**
- Issue credential for first course in track (create new NFT)
- Issue credential for subsequent course (upgrade existing NFT)
- Credential level and attributes update correctly
- NFT is frozen (PermanentFreezeDelegate) — transfer fails
- Cannot issue without finalize_course
- NFT belongs to correct track collection
- Config PDA is collection update authority

**Estimated effort:** 2 days

---

## Summary Timeline

| Phase | Days | Cumulative | What Ships |
| --- | --- | --- | --- |
| 1. Foundation | 1 | 1 | Config PDA + XP mint |
| 2. Course Registry | 1 | 2 | Content management |
| 3. Enrollment + Lessons | 2 | 4 | Core learning loop |
| 4. Completion + Close | 1.5 | 5.5 | **Working platform** |
| 5. Credentials (Metaplex Core) | 2 | 7.5 | Wallet-visible credentials |

**Total: ~7.5 working days for the complete V1.**

---

## Devnet Testing Checkpoints

1. **After Phase 4:** Full end-to-end test on devnet. Create config + XP mint, create course, enroll, complete all lessons, finalize course. Verify XP balances (learner per-lesson + bonus, creator reward). Close enrollment, verify rent reclaimed.

2. **After Phase 5:** Credential NFT creation and upgrade on devnet. Verify NFT appears in wallet. Test soulbound (transfer fails). Verify DAS API returns credential. Test upgrade flow (second course in same track).

3. **Full regression:** All 9 instructions exercised. Test prerequisite chains. Verify backend signer validation. Test 24h unenroll cooldown.

---

## CI/CD Milestones

| Gate | Requirement |
| --- | --- |
| PR merge | `anchor build` + `cargo fmt --check` + `cargo clippy -- -W clippy::all` + unit tests |
| Devnet deploy | All integration tests passing + CU profiling within budget |
| Mainnet deploy | Fuzz testing (10+ min), security audit, AI slop review, explicit approval |

---

*Refer to SPEC.md for detailed account structures and instruction signatures.*
