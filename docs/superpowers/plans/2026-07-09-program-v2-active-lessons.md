# Program v2 — `active_lessons` mask (CS-3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This is the implementation plan for GitHub issue **#355 (CS-3)**. It does **not** close the issue — it unblocks the program change. The issue closes when the program is implemented, byte-verified, and deployed to devnet.

**Goal:** Make lesson structure editable on live courses by replacing the on-chain `Course.lesson_count` (`u8`) with a 256-bit `active_lessons` mask that mirrors `Enrollment.lesson_flags`. After this change a teacher can add, remove, reorder and replace lessons forever: retiring a slot clears its bit, `finalize_course` ANDs the learner's flags against the mask (so a stray bit for a retired slot no longer bricks completion), and the completion bonus is scaled by the live-lesson popcount instead of a monotonic count that can only lie after a deletion.

**Architecture:** One 256-bit mask field (`[u64; 4]`) added to the `Course` account; the `lesson_count` `u8` deleted. Three helper methods on `impl Course` centralize the bit math (`is_active_slot`, `live_lesson_count`, `dense_mask`). The three instructions that read `lesson_count` (`complete_lesson`, `finalize_course`, `update_course`) plus `create_course` are rewritten to the mask. The `Course` byte size grows `224 → 255` (`−1` deleted `lesson_count`, `+32` mask, `_reserved: [u8; 8]` untouched), which breaks deserialization of every existing 224-byte `Course` account — recreating those 7 devnet accounts via `close_course` + `create_course` is **CS-4's** execution, referenced here but not implemented. `Enrollment` is untouched (`lesson_flags` layout is unchanged, so no learner bitmap moves). `content_tx_id` (already a `[u8; 32]` field, already updatable via `update_course.new_content_tx_id`) is preserved and available for CS-9's commitment write; this plan does not touch it.

**Tech Stack:** Anchor 0.31+, Rust 1.82+, `solana-sdk` `=2.0.25`, Borsh. The on-chain program is `onchain-academy/programs/onchain-academy`; the Rust unit-test crate is `onchain-academy/tests/rust` (`onchain-academy-tests`).

**Spec:** `docs/superpowers/specs/2026-07-09-course-content-standard-design.md` (currently on the `spec-content-standard` worktree, not yet on `main`). This plan implements the settled, twice-audited change in **§5.1** (what the program does today), **§5.2** ("The change (D6, D7)" — the authoritative design), and **§5.3** (XP ceilings), with migration context in **§15**. The design is settled; do not re-litigate it.

## Global Constraints

- **Checked arithmetic only.** Every add/mul stays `checked_*` + `ok_or(AcademyError::Overflow)?`, exactly as today. No `unwrap()` in program code.
- **Store canonical bumps.** Unchanged — `course.bump = ctx.bumps.course` in `create_course`; all PDA constraints keep `bump = <account>.bump`.
- **256-bit mask.** `active_lessons: [u64; 4]` = 256 bits, mirroring `Enrollment.lesson_flags: [u64; 4]`. `lesson_index: u8` spans `0..=255`, so every index maps to a valid word/bit — **no bounds check needed** on the mask read. Deleting the `u8 lesson_count` is what makes all 256 slots usable (with it, the effective cap was 255).
- **Byte-exact `Course::SIZE = 255`.** Recompute the const and its byte-comment breakdown exactly. Serialization round-trips must satisfy `buf.len() + 8 == Course::SIZE` at max id + all options.
- **`MAX_XP_PER_MINT = 5000`** (`utils.rs`). The finalize XP invariant `xp_per_lesson × live_lesson_count / 2 ≤ MAX_XP_PER_MINT` must be preserved: violate it and every learner's `finalize_course` reverts forever (§5.2).
- **Error codes are frozen.** The live devnet program must not renumber `AcademyError`. Do **not** delete or reorder existing variants. `LessonCountDecrease` (6034) becomes unused-but-retained as a frozen tail (a `pub enum` variant, so no `dead_code` warning under `clippy -D warnings`).
- **Wire-format changes are acceptable** (devnet-only, no mainnet Course accounts). `UpdateCourseParams` changes shape (`new_lesson_count` → `new_active_lessons`); `CreateCourseParams` keeps `lesson_count` as an initializer input (dense-mask seed), so its wire format is unchanged.
- **TDD throughout.** Every task writes the failing test first, runs it to fail, implements the minimal change, runs it to pass, commits.

## Harness note (read before writing tests)

The `onchain-academy/tests/rust` crate has **no in-crate SVM runtime**. Its 128 tests are (a) **handler-logic mirrors** — pure functions reproducing a handler's `require!`/arithmetic, explicitly labelled as mirrors (see `test_completion.rs:1-11`, `test_lesson_count.rs:15-18`), (b) **real `impl` / state-method tests** that call program code directly (`Course::SIZE`, PDA derivations, `require_xp_mint`), and (c) **Borsh round-trips** that pin the wire format (and thus the generated IDL). Mollusk/LiteSVM appear only on the **TypeScript** side (`onchain-academy/tests/cu-measurement.ts`, `CU_BASELINE.md`) and in the 89-test `anchor test` suite, which is the crate's runtime layer.

This plan matches that convention: mask **helper methods** are tested as real `impl Course` code (Task 1); handler-level `require!` compositions are tested as labelled mirrors (Tasks 2–5); wire format via round-trips (Task 4). The authoritative **end-to-end runtime proofs** — finalize-with-a-stray-retired-bit succeeds on a real bank, complete rejects an inactive slot — belong in the TS `anchor test` suite and are specified in **Task 6**. Do not invent a Mollusk harness that diverges from the passing 128-test convention.

## File Structure

Program (`onchain-academy/programs/onchain-academy/src/`):

```
state/course.rs           EDIT  delete lesson_count; add active_lessons + 3 helper methods; SIZE 224→255
state/enrollment.rs       EDIT  doc-comment only (lesson_count reference → active_lessons)
instructions/complete_lesson.rs   EDIT  bound check → is_active_slot
instructions/finalize_course.rs   EDIT  equality → mask AND; bonus multiplier → live_lesson_count()
instructions/update_course.rs     EDIT  new_lesson_count (+ monotonic check) → new_active_lessons
instructions/create_course.rs     EDIT  set active_lessons = dense_mask(lesson_count)
errors.rs                 UNCHANGED  (LessonCountDecrease retained as frozen tail)
events.rs                 UNCHANGED  (no event carries lesson_count — verified)
```

Rust tests (`onchain-academy/tests/rust/src/`):

```
test_course.rs            EDIT  SIZE 224→255 + byte comment; 5 Course literals; add mask-helper tests
test_completion.rs        EDIT  finalize mirror: equality → mask AND; stray-bit test inverts; bound → is_active_slot
test_lesson_count.rs      DELETE  targets deleted new_lesson_count/monotonic behavior
test_active_lessons.rs    NEW    update_course new_active_lessons roundtrip; create dense mask; frozen-tail pin
lib.rs                    EDIT  mod test_lesson_count → mod test_active_lessons
```

TS integration (`onchain-academy/tests/`):

```
onchain-academy.ts        EDIT  add: finalize-succeeds-with-stray-retired-bit; complete-rejects-inactive-slot
```

Every `lesson_count` reader in the program is one of the files above — verified by grep: `complete_lesson.rs`, `create_course.rs`, `finalize_course.rs`, `update_course.rs`, `state/course.rs`, plus a doc comment in `state/enrollment.rs`. No event struct references it.

---

### Task 1: `Course` layout v2 — delete `lesson_count`, add `active_lessons` + helper methods

Deletes the `u8 lesson_count`, adds `active_lessons: [u64; 4]`, recomputes `SIZE 224 → 255` with an exact byte breakdown, and adds the three helper methods every other task depends on. Covers change items **1, 2, 3, 8**.

**Files:**
- Edit: `onchain-academy/programs/onchain-academy/src/state/course.rs`
- Edit: `onchain-academy/programs/onchain-academy/src/state/enrollment.rs` (doc comment only)
- Test: `onchain-academy/tests/rust/src/test_course.rs`

- [ ] **Step 1: Write the failing tests.**

In `test_course.rs`, change the SIZE assertion and its comment, and add the mask-helper tests. Replace the body of `course_size_constant_is_correct`:

```rust
#[test]
fn course_size_constant_is_correct() {
    // v2 (CS-3): 224 - 1 (deleted lesson_count u8) + 32 (active_lessons [u64;4]) = 255.
    // 8 (discriminator) + (4 + 32) (course_id) + 32 (creator) + 32 (content_tx_id)
    // + 2 (version) + 32 (active_lessons: [u64; 4]) + 1 (difficulty) + 4 (xp_per_lesson)
    // + 2 (track_id) + 1 (track_level) + (1 + 32) (prerequisite Option<Pubkey>)
    // + 4 (creator_reward_xp) + 2 (min_completions_for_reward) + 4 (total_completions)
    // + 4 (total_enrollments) + 1 (is_active) + 8 (created_at) + 8 (updated_at)
    // + 32 (collection) + 8 (_reserved) + 1 (bump)
    assert_eq!(Course::SIZE, 255);
}
```

Add a helper at the top of `test_course.rs` (below the imports) so the mask tests read cleanly, and the new tests:

```rust
/// A minimal valid Course with a caller-chosen live-lesson mask, for exercising
/// the real `impl Course` mask methods.
fn course_with_mask(active_lessons: [u64; 4]) -> Course {
    Course {
        course_id: "mask-course".to_string(),
        creator: Pubkey::new_unique(),
        content_tx_id: [0u8; 32],
        version: 1,
        active_lessons,
        difficulty: 1,
        xp_per_lesson: 10,
        track_id: 0,
        track_level: 0,
        prerequisite: None,
        creator_reward_xp: 0,
        min_completions_for_reward: 0,
        total_completions: 0,
        total_enrollments: 0,
        is_active: true,
        created_at: 0,
        updated_at: 0,
        collection: Pubkey::default(),
        _reserved: [0u8; 8],
        bump: 0,
    }
}

#[test]
fn is_active_slot_reads_the_mask() {
    // slot 0 live and slot 130 live (word 2, bit 2); nothing else.
    let mut mask = [0u64; 4];
    mask[0] |= 1;
    mask[2] |= 1u64 << 2;
    let course = course_with_mask(mask);

    assert!(course.is_active_slot(0));
    assert!(course.is_active_slot(130));
    assert!(!course.is_active_slot(1));
    assert!(!course.is_active_slot(255)); // reachable index, but not live
}

#[test]
fn live_lesson_count_is_popcount() {
    let mut course = course_with_mask(Course::dense_mask(12));
    assert_eq!(course.live_lesson_count(), 12);

    // Retiring slot 3 (clearing its bit) drops the live count to 11.
    course.active_lessons[0] &= !(1u64 << 3);
    assert_eq!(course.live_lesson_count(), 11);
}

#[test]
fn dense_mask_sets_contiguous_low_bits() {
    assert_eq!(Course::dense_mask(0), [0, 0, 0, 0]);
    assert_eq!(Course::dense_mask(1), [1, 0, 0, 0]);
    assert_eq!(Course::dense_mask(64), [u64::MAX, 0, 0, 0]);
    // 65 bits spans the first word boundary.
    assert_eq!(Course::dense_mask(65), [u64::MAX, 1, 0, 0]);
    // u8 ceiling: 255 dense bits (slot 255 is reachable only via update_course).
    let full: u32 = Course::dense_mask(255).iter().map(|w| w.count_ones()).sum();
    assert_eq!(full, 255);
}

#[test]
fn active_lessons_mask_roundtrip() {
    let mut mask = [0u64; 4];
    mask[0] = 0b1011;
    mask[3] = 1u64 << 63; // slot 255 set — proves the full 256-bit range survives Borsh
    let course = course_with_mask(mask);

    let mut buf = Vec::new();
    course.serialize(&mut buf).unwrap();
    let de = Course::deserialize(&mut buf.as_slice()).unwrap();
    assert_eq!(de.active_lessons, mask);
    assert_eq!(de.live_lesson_count(), 4);
}
```

Also update the five existing `Course { .. }` literals in `test_course.rs` (lines ~24, 78, 111, 187, 219): replace each `lesson_count: N,` with `active_lessons: Course::dense_mask(N),`, and in `course_serialization_roundtrip` replace the assertion `assert_eq!(deserialized.lesson_count, 10);` with `assert_eq!(deserialized.live_lesson_count(), 10);`.

- [ ] **Step 2: Run to fail.** `cargo test --manifest-path onchain-academy/tests/rust/Cargo.toml` — fails to compile (`Course` has no field `active_lessons`, no method `dense_mask`), which is the correct red state.

- [ ] **Step 3: Minimal implementation.** Rewrite `state/course.rs`:

```rust
use anchor_lang::prelude::*;

pub const MAX_COURSE_ID_LEN: usize = 32;

#[account]
pub struct Course {
    pub course_id: String,
    /// XP recipient for creator rewards (not an authority — all admin goes through Config)
    pub creator: Pubkey,
    pub content_tx_id: [u8; 32],
    pub version: u16,
    /// 256-bit mask of live lesson slots, mirroring `Enrollment.lesson_flags`.
    /// Bit `i` set ⇒ slot `i` is a live lesson. Replaces the v1 `lesson_count`
    /// (u8): the live-lesson count is `live_lesson_count()` (popcount) and
    /// completion is `lesson_flags & active_lessons == active_lessons`, so
    /// retiring a slot (clearing its bit) never strands a completed learner.
    pub active_lessons: [u64; 4],
    pub difficulty: u8,
    pub xp_per_lesson: u32,
    pub track_id: u16,
    pub track_level: u8,
    pub prerequisite: Option<Pubkey>,
    pub creator_reward_xp: u32,
    pub min_completions_for_reward: u16,
    pub total_completions: u32,
    pub total_enrollments: u32,
    pub is_active: bool,
    pub created_at: i64,
    pub updated_at: i64,
    /// Metaplex Core collection this course's credentials are minted into.
    /// `Pubkey::default()` until set via `create_course`/`update_course`.
    pub collection: Pubkey,
    pub _reserved: [u8; 8],
    pub bump: u8,
}

impl Course {
    // SIZE grew 224 -> 255 in v2 (CS-3): `lesson_count` (u8, -1) was deleted and
    // `active_lessons: [u64; 4]` (+32) added; `_reserved: [u8; 8]` is preserved
    // (the "reserved bytes on every account" convention is kept, not consumed).
    // Old 224-byte Course accounts no longer deserialize, so EVERY instruction
    // that resolves `course: Account<Course>` fails until the account is recreated
    // via close_course + create_course. That recreation is CS-4's execution.
    // 8 (discriminator)
    // + (4 + 32) (course_id)
    // + 32 (creator)
    // + 32 (content_tx_id)
    // + 2 (version)
    // + 32 (active_lessons: [u64; 4])
    // + 1 (difficulty)
    // + 4 (xp_per_lesson)
    // + 2 (track_id)
    // + 1 (track_level)
    // + (1 + 32) (prerequisite)
    // + 4 (creator_reward_xp)
    // + 2 (min_completions_for_reward)
    // + 4 (total_completions)
    // + 4 (total_enrollments)
    // + 1 (is_active)
    // + 8 (created_at)
    // + 8 (updated_at)
    // + 32 (collection)
    // + 8 (_reserved)
    // + 1 (bump)
    pub const SIZE: usize = 8
        + (4 + MAX_COURSE_ID_LEN)
        + 32
        + 32
        + 2
        + 32
        + 1
        + 4
        + 2
        + 1
        + (1 + 32)
        + 4
        + 2
        + 4
        + 4
        + 1
        + 8
        + 8
        + 32
        + 8
        + 1; // 255

    /// True if `slot` is a live lesson slot (its bit is set in `active_lessons`).
    /// `slot: u8` spans 0..=255, so every value maps to a valid word/bit of the
    /// 256-bit mask — no bounds check is needed.
    pub fn is_active_slot(&self, slot: u8) -> bool {
        let word = (slot / 64) as usize;
        let bit = slot % 64;
        (self.active_lessons[word] >> bit) & 1 == 1
    }

    /// Number of live lesson slots (popcount of `active_lessons`). Replaces the
    /// v1 `lesson_count` for XP math and the completion gate.
    pub fn live_lesson_count(&self) -> u32 {
        self.active_lessons.iter().map(|w| w.count_ones()).sum()
    }

    /// Dense mask for a course's initial `lesson_count` lessons: bits
    /// `0..lesson_count` set. New courses are always dense; slots are retired
    /// later via `update_course(new_active_lessons)`, never at creation.
    pub fn dense_mask(lesson_count: u8) -> [u64; 4] {
        let mut mask = [0u64; 4];
        // `lesson_count` is u8 (<= 255), so `i` never reaches 255 and cannot
        // overflow; every `i` maps to a valid word (0..=3) / bit (0..=63).
        for i in 0..lesson_count {
            let word = (i / 64) as usize;
            let bit = i % 64;
            mask[word] |= 1u64 << bit;
        }
        mask
    }
}
```

Then fix the `enrollment.rs` doc comment (lines 11–12) for accuracy:

```rust
    /// Lesson completion bitmap: 4 × u64 = 256 bits, mirroring
    /// `Course.active_lessons`. Completion is `lesson_flags & active_lessons ==
    /// active_lessons`, so every valid slot (0..=255) fits within this bitmap.
    pub lesson_flags: [u64; 4],
```

- [ ] **Step 4: Run to pass.** `cargo test --manifest-path onchain-academy/tests/rust/Cargo.toml` — the `test_course.rs` module compiles and passes. (`test_completion.rs`, `test_lesson_count.rs`, and the four instruction files still fail to compile — expected; later tasks fix them. To iterate on this task alone, run the named tests after the whole tree compiles at Task 5: `... --manifest-path onchain-academy/tests/rust/Cargo.toml course_size_constant_is_correct is_active_slot live_lesson_count dense_mask active_lessons_mask_roundtrip`.)

- [ ] **Step 5: Commit.** `git commit -m "feat(onchain): Course v2 active_lessons mask + helper methods (CS-3)"`

---

### Task 2: `complete_lesson` — reject inactive slots via `is_active_slot`

Replaces the `lesson_index < course.lesson_count` bound with a live-slot check. Covers change item **4**.

**Files:**
- Edit: `onchain-academy/programs/onchain-academy/src/instructions/complete_lesson.rs`
- Test: `onchain-academy/tests/rust/src/test_completion.rs`

- [ ] **Step 1: Write the failing test.** In `test_completion.rs`, replace `lesson_out_of_bounds_check` with a mirror of the v2 live-slot gate:

```rust
/// Mirrors the v2 bound in complete_lesson:
/// `require!(course.is_active_slot(lesson_index), LessonOutOfBounds)`.
fn is_active_slot(active: &[u64; 4], slot: u8) -> bool {
    let word = (slot / 64) as usize;
    let bit = slot % 64;
    (active[word] >> bit) & 1 == 1
}

#[test]
fn inactive_slot_is_rejected() {
    // Course has slots 0 and 2 live; slot 1 was retired.
    let active = [0b101u64, 0, 0, 0];
    assert!(is_active_slot(&active, 0));
    assert!(!is_active_slot(&active, 1)); // retired → complete_lesson reverts
    assert!(is_active_slot(&active, 2));
    // An index past the live set (but a valid u8) is also rejected.
    assert!(!is_active_slot(&active, 200));
}
```

- [ ] **Step 2: Run to fail.** `cargo test --manifest-path onchain-academy/tests/rust/Cargo.toml inactive_slot_is_rejected` — fails (the handler still bounds on `course.lesson_count`, which no longer exists → the crate also won't compile against the Task-1 struct). Confirm the red state.

- [ ] **Step 3: Minimal implementation.** In `complete_lesson.rs`, replace the bound (lines 15–18):

```rust
    // The slot must be a live lesson (its bit set in the course's active mask).
    // Reusing LessonOutOfBounds keeps error codes frozen for the live program;
    // "not a live slot" is the v2 meaning of an out-of-range lesson index.
    require!(
        course.is_active_slot(lesson_index),
        AcademyError::LessonOutOfBounds
    );
```

Nothing else in the handler changes — the per-word/bit set of `enrollment.lesson_flags` (lines 20–28) and the `xp_per_lesson <= MAX_XP_PER_MINT` guard stay as-is.

- [ ] **Step 4: Run to pass.** `cargo test --manifest-path onchain-academy/tests/rust/Cargo.toml inactive_slot_is_rejected`

- [ ] **Step 5: Commit.** `git commit -m "feat(onchain): complete_lesson gates on active_lessons mask (CS-3)"`

---

### Task 3: `finalize_course` — mask-AND completion + `live_lesson_count` bonus

Replaces the popcount-equality completion check with a mask AND (stray retired bits are ignored) and switches the completion-bonus multiplier from `lesson_count` to `popcount(active_lessons)`, preserving the finalize XP invariant. Covers change item **5**.

**Files:**
- Edit: `onchain-academy/programs/onchain-academy/src/instructions/finalize_course.rs`
- Test: `onchain-academy/tests/rust/src/test_completion.rs`

- [ ] **Step 1: Write the failing tests.** In `test_completion.rs`, replace the local `all_lessons_complete` mirror and the finalize-related tests. New mirror + tests:

```rust
/// Mirrors the v2 completion check in finalize_course:
/// `lesson_flags & active_lessons == active_lessons` per word. Every ACTIVE bit
/// must be set; stray bits for since-retired slots are ignored by the AND.
fn all_active_complete(flags: &[u64; 4], active: &[u64; 4]) -> bool {
    flags.iter().zip(active.iter()).all(|(f, a)| f & a == *a)
}

/// Local dense-mask builder (mirror of Course::dense_mask) so this file stays
/// runtime-free and self-contained.
fn dense(n: u16) -> [u64; 4] {
    let mut m = [0u64; 4];
    for i in 0..n {
        m[(i / 64) as usize] |= 1u64 << (i % 64);
    }
    m
}

#[test]
fn empty_flags_do_not_finalize_a_live_course() {
    let active = [0b111u64, 0, 0, 0]; // 3 live slots
    assert!(!all_active_complete(&[0u64; 4], &active));
}

#[test]
fn finalize_requires_every_active_bit() {
    let active = [0b111u64, 0, 0, 0]; // slots 0,1,2 live
    assert!(!all_active_complete(&[0b011u64, 0, 0, 0], &active)); // missing slot 2
    assert!(all_active_complete(&[0b111u64, 0, 0, 0], &active)); // all present
}

#[test]
fn stray_bit_for_retired_slot_still_finalizes() {
    // Course retired slot 1: active = {0, 2}. A learner who completed slot 1 while
    // it was live still holds its bit; the AND ignores it. This is the exact case
    // the v1 popcount-equality bricked forever (spec §5.1).
    let active = [0b101u64, 0, 0, 0];
    let flags_with_stray = [0b111u64, 0, 0, 0]; // slots 0,1(retired),2
    assert!(all_active_complete(&flags_with_stray, &active));
    // A learner who never touched the retired slot also finalizes.
    assert!(all_active_complete(&[0b101u64, 0, 0, 0], &active));
}

#[test]
fn finalize_completion_across_word_boundaries() {
    // 65 live slots (0..=64) spanning word 0 and word 1.
    let active = dense(65);
    let mut flags = dense(65);
    assert!(all_active_complete(&flags, &active));
    // Drop slot 64 (word 1, bit 0): no longer complete.
    flags[1] &= !1u64;
    assert!(!all_active_complete(&flags, &active));
}

#[test]
fn finalize_bonus_uses_live_lesson_count() {
    // bonus = xp_per_lesson * popcount(active_lessons) / 2 (spec §5.2).
    let active = [0b101u64, 0, 0, 0]; // 2 live slots
    let live: u32 = active.iter().map(|w| w.count_ones()).sum();
    assert_eq!(live, 2);
    let xp_per_lesson: u64 = 40;
    let bonus = (xp_per_lesson * live as u64) / 2;
    assert_eq!(bonus, 40);
}

#[test]
fn finalize_xp_invariant_holds_at_the_ceiling() {
    // The hard invariant (spec §5.2 / §6.2 gate 5a): xp_per_lesson * live / 2 must
    // stay <= MAX_XP_PER_MINT (5000). live=200, xp=50 -> exactly 5000 passes.
    let bonus = (50u64 * 200u64) / 2;
    assert_eq!(bonus, onchain_academy::utils::MAX_XP_PER_MINT);
    assert!(bonus <= onchain_academy::utils::MAX_XP_PER_MINT);
    // One step over the live count reverts with XpAmountExceedsMax.
    let over = (50u64 * 202u64) / 2;
    assert!(over > onchain_academy::utils::MAX_XP_PER_MINT);
}
```

Delete the now-obsolete v1 tests in this file: `empty_bitmap_is_not_complete`, `all_lessons_complete_single_lesson`, `partial_completion_not_complete`, `exact_completion_is_complete`, `extra_bits_beyond_lesson_count_still_passes` (its assertion **inverts** under v2 — stray bits now pass — replaced by `stray_bit_for_retired_slot_still_finalizes`), `completion_across_word_boundaries`, and `max_lessons_256_complete`. Keep `lesson_already_completed_detection`, `double_finalize_detection`, and the three `close_enrollment_*` tests unchanged. In `completion_bonus_xp_is_50_percent_of_total` and `completion_bonus_zero_when_xp_per_lesson_is_one`, rename the local `lesson_count` variable to `live_lesson_count` and update the leading comment to `bonus = (xp_per_lesson * live_lesson_count) / 2` — the arithmetic is unchanged. Add `use onchain_academy::utils;` at the top of the file (referenced by `MAX_XP_PER_MINT`), or use the fully-qualified `onchain_academy::utils::MAX_XP_PER_MINT` as written above.

- [ ] **Step 2: Run to fail.** `cargo test --manifest-path onchain-academy/tests/rust/Cargo.toml` — the new mirrors pass in isolation but the crate does not yet build against the handler (still reads `course.lesson_count`). Confirm the compile error names `finalize_course.rs`.

- [ ] **Step 3: Minimal implementation.** In `finalize_course.rs`, replace the completion check (lines 22–26):

```rust
    // Actual lessons the learner completed (and was minted XP for), including any
    // bit for a since-retired slot. Used only for the emitted total_xp below.
    let completed: u32 = enrollment.lesson_flags.iter().map(|w| w.count_ones()).sum();

    // Completion requires every ACTIVE lesson bit to be set. A learner holding a
    // stray bit for a since-retired slot still finalizes — the AND ignores it,
    // which is exactly what the v1 popcount-equality could not do (spec §5.1).
    let all_active_completed = enrollment
        .lesson_flags
        .iter()
        .zip(course.active_lessons.iter())
        .all(|(flags, active)| flags & active == *active);
    require!(all_active_completed, AcademyError::CourseNotCompleted);
```

And replace the bonus multiplier (lines 38–40):

```rust
    // Completion bonus basis = live lesson count (popcount of the active mask),
    // NOT the learner's completed count — a stray retired bit must not inflate it.
    let total_lesson_xp = (course.xp_per_lesson as u64)
        .checked_mul(course.live_lesson_count() as u64)
        .ok_or(AcademyError::Overflow)?;
```

The `bonus_xp = total_lesson_xp / 2` line, the `bonus_xp <= MAX_XP_PER_MINT` guard, the creator-reward window, and the `CourseFinalized` event (`total_xp: completed.checked_mul(course.xp_per_lesson)?`, which still uses `completed`) all stay unchanged — `completed` remains a live binding, so no unused-variable warning.

- [ ] **Step 4: Run to pass.** `cargo test --manifest-path onchain-academy/tests/rust/Cargo.toml` (all of `test_completion.rs` now compiles once Tasks 4/5 land; run the named finalize tests to confirm this task).

- [ ] **Step 5: Commit.** `git commit -m "feat(onchain): finalize_course completes via active_lessons AND + popcount bonus (CS-3)"`

---

### Task 4: `update_course` — `new_active_lessons`, delete `new_lesson_count` + monotonic check

Adds `new_active_lessons: Option<[u64; 4]>` to the params and **deletes** the now-meaningless `new_lesson_count` field and its monotonic `>=` guard. Retire/insert/reorder all become "write a new mask". Covers change item **6**.

**Files:**
- Edit: `onchain-academy/programs/onchain-academy/src/instructions/update_course.rs`
- Delete: `onchain-academy/tests/rust/src/test_lesson_count.rs`
- Create: `onchain-academy/tests/rust/src/test_active_lessons.rs`
- Edit: `onchain-academy/tests/rust/src/lib.rs`

- [ ] **Step 1: Write the failing tests.** Delete `test_lesson_count.rs` (it targets the deleted `new_lesson_count`/`LessonCountDecrease`-monotonic behavior). In `lib.rs`, replace `mod test_lesson_count;` with `mod test_active_lessons;` (keep the `#[cfg(test)]` attribute on the line above). Create `test_active_lessons.rs`:

```rust
//! Tests for the v2 `active_lessons` mask surface (CS-3):
//! - `UpdateCourseParams` swaps `new_lesson_count: Option<u8>` for
//!   `new_active_lessons: Option<[u64; 4]>`; the monotonic count check is gone.
//! - `create_course` seeds a dense mask from the initial `lesson_count` param.
//! - `AcademyError::LessonCountDecrease` is RETAINED as a frozen tail (6034) so
//!   the live devnet program never renumbers; it is simply unused in v2.
//!
//! Handler-mirror + wire-format tests, matching this crate's runtime-free
//! convention (see the Harness note in the plan).

use anchor_lang::{AnchorDeserialize, AnchorSerialize};
use onchain_academy::errors::AcademyError;
use onchain_academy::instructions::UpdateCourseParams;
use onchain_academy::state::Course;

/// Setting `new_active_lessons` writes the mask verbatim — add, remove, reorder
/// and replace all reduce to this single assignment (the chain trusts the
/// authority; the sync route validates against slots.lock.json before signing,
/// spec §11.0).
fn apply_active_lessons(current: [u64; 4], new: Option<[u64; 4]>) -> [u64; 4] {
    match new {
        Some(mask) => mask,
        None => current,
    }
}

#[test]
fn update_sets_active_lessons_verbatim() {
    let dense = Course::dense_mask(5); // slots 0..4
    // Retire slot 1 and add slot 5: a hand-built target mask.
    let target = [0b101101u64, 0, 0, 0]; // slots 0,2,3,5
    assert_eq!(apply_active_lessons(dense, Some(target)), target);
    // A reorder that keeps the same live set is a no-op on-chain — the mask is
    // identity to display order, so the same bits round-trip unchanged.
    assert_eq!(apply_active_lessons(target, Some(target)), target);
}

#[test]
fn update_none_leaves_mask_unchanged() {
    let mask = Course::dense_mask(9);
    assert_eq!(apply_active_lessons(mask, None), mask);
}

#[test]
fn update_course_params_new_active_lessons_roundtrip() {
    // Retire-a-slot update: mask only.
    let mut target = Course::dense_mask(12);
    target[0] &= !(1u64 << 4); // retire slot 4
    let retire = UpdateCourseParams {
        new_content_tx_id: None,
        new_is_active: None,
        new_xp_per_lesson: None,
        new_creator_reward_xp: None,
        new_min_completions_for_reward: None,
        new_collection: None,
        new_active_lessons: Some(target),
    };
    let mut buf = Vec::new();
    retire.serialize(&mut buf).unwrap();
    let decoded = UpdateCourseParams::deserialize(&mut buf.as_slice()).unwrap();
    assert_eq!(decoded.new_active_lessons, Some(target));
    assert_eq!(decoded.new_xp_per_lesson, None);

    // All-None: the empty update still round-trips (the field is a strict swap
    // for the removed new_lesson_count, so the noop shape is preserved).
    let noop = UpdateCourseParams {
        new_content_tx_id: None,
        new_is_active: None,
        new_xp_per_lesson: None,
        new_creator_reward_xp: None,
        new_min_completions_for_reward: None,
        new_collection: None,
        new_active_lessons: None,
    };
    let mut buf = Vec::new();
    noop.serialize(&mut buf).unwrap();
    let decoded = UpdateCourseParams::deserialize(&mut buf.as_slice()).unwrap();
    assert_eq!(decoded.new_active_lessons, None);
}

/// The retired `LessonCountDecrease` variant stays at 6034 and no prior code
/// moves — the live devnet program must not renumber errors.
#[test]
fn lesson_count_decrease_is_frozen_at_tail() {
    assert_eq!(6000 + AcademyError::XpAmountExceedsMax as u32, 6033);
    assert_eq!(6000 + AcademyError::LessonCountDecrease as u32, 6034);
}
```

- [ ] **Step 2: Run to fail.** `cargo test --manifest-path onchain-academy/tests/rust/Cargo.toml` — fails to compile (`UpdateCourseParams` has no field `new_active_lessons`). Red confirmed.

- [ ] **Step 3: Minimal implementation.** In `update_course.rs`, replace the `new_lesson_count` field in `UpdateCourseParams`:

```rust
    /// Replace the 256-bit live-lesson mask. Add, remove, reorder and replace
    /// lessons all reduce to writing a new mask: retiring a slot clears its bit,
    /// adding one sets a fresh bit. The chain cannot know slots are never reused
    /// — the repo's `slots.lock.json` is the only invariant carrier — so this is
    /// trusted blindly here; the sync route asserts the mask matches the lockfile
    /// right before signing (spec §11.0). Replaces v1's `new_lesson_count`.
    pub new_active_lessons: Option<[u64; 4]>,
```

And replace the monotonic-count handler block (lines 53–62) with:

```rust
    if let Some(active_lessons) = params.new_active_lessons {
        course.active_lessons = active_lessons;
    }
```

No `require!` here: unlike the deleted monotonic guard, the mask is trusted (see the field doc). `AcademyError::LessonCountDecrease` is no longer referenced in this file; the `use crate::errors::AcademyError;` import stays (still used by `Overflow`/`CollectionMismatch`). Leave `errors.rs` unchanged — the variant is retained as a frozen tail.

- [ ] **Step 4: Run to pass.** `cargo test --manifest-path onchain-academy/tests/rust/Cargo.toml` (the crate compiles end-to-end once Task 5 lands; run the `test_active_lessons` module to confirm this task).

- [ ] **Step 5: Commit.** `git commit -m "feat(onchain): update_course replaces new_lesson_count with new_active_lessons (CS-3)"`

---

### Task 5: `create_course` — seed the initial dense mask

Sets the initial `active_lessons` to a dense mask derived from the `lesson_count` param, instead of storing the deleted `lesson_count`. Covers change item **7**.

**Files:**
- Edit: `onchain-academy/programs/onchain-academy/src/instructions/create_course.rs`
- Test: `onchain-academy/tests/rust/src/test_active_lessons.rs`

- [ ] **Step 1: Write the failing test.** Append to `test_active_lessons.rs`:

```rust
/// create_course seeds a dense mask from the initial lesson_count param
/// (`course.active_lessons = Course::dense_mask(params.lesson_count)`), and still
/// rejects a zero count with InvalidLessonCount.
#[test]
fn create_course_seeds_dense_mask() {
    // A fresh 3-lesson course has slots 0,1,2 live and 3 live lessons.
    let mask = Course::dense_mask(3);
    assert_eq!(mask, [0b111u64, 0, 0, 0]);
    let live: u32 = mask.iter().map(|w| w.count_ones()).sum();
    assert_eq!(live, 3);

    // A 12-lesson course (the common live case) is dense across the low word.
    assert_eq!(Course::dense_mask(12), [0b1111_1111_1111u64, 0, 0, 0]);
}

/// Mirror of the create_course guard: `require!(lesson_count > 0, ...)`.
#[test]
fn create_course_rejects_zero_lessons() {
    let lesson_count: u8 = 0;
    // Zero lessons is rejected before any mask is built.
    assert!(!(lesson_count > 0));
    // A dense mask of 0 would be empty, which live_lesson_count reports as 0.
    let live: u32 = Course::dense_mask(0).iter().map(|w| w.count_ones()).sum();
    assert_eq!(live, 0);
}
```

- [ ] **Step 2: Run to fail.** `cargo test --manifest-path onchain-academy/tests/rust/Cargo.toml create_course_seeds_dense_mask` — fails while `create_course.rs` still assigns the deleted `course.lesson_count`, so the crate won't compile. Red confirmed.

- [ ] **Step 3: Minimal implementation.** In `create_course.rs`, replace the field assignment (line 44):

```rust
    // New courses are dense: bits 0..lesson_count set. Slots are retired later
    // via update_course(new_active_lessons); create never produces holes.
    course.active_lessons = Course::dense_mask(params.lesson_count);
```

Keep `CreateCourseParams` unchanged — `lesson_count: u8` stays as the initializer input (its wire format and the generated IDL arg do not change). Keep `require!(params.lesson_count > 0, AcademyError::InvalidLessonCount);`. `Course` is already imported in this file.

- [ ] **Step 4: Run to pass.** `cargo test --manifest-path onchain-academy/tests/rust/Cargo.toml` — the **entire** crate now compiles and all tests pass. Confirm the green count.

- [ ] **Step 5: Commit.** `git commit -m "feat(onchain): create_course seeds dense active_lessons mask (CS-3)"`

---

### Task 6a: Migrate the existing TS suite to the new IDL (BEFORE Task 6's new tests)

Renaming `UpdateCourseParams.new_lesson_count` → `new_active_lessons` and deleting
`Course.lesson_count` breaks the existing 89-test suite in three ways (PR #366 review,
verified line-by-line against `onchain-academy/tests/onchain-academy.ts`). A worker who
skips this hits ~15+ compile/assertion failures in `anchor test` with no plan coverage.

**Files:**
- Edit: `onchain-academy/tests/onchain-academy.ts`

- [ ] **Step 1: Rename all 12 `newLessonCount` call sites to `newActiveLessons`** (lines
  684, 707, 728, 757, 817, 839, 865, 895, 1074, 1128, plus the helper/param at 944/953),
  passing `slotsToMask([...])` — define the `slotsToMask(slots: number[]): BN[]` helper
  here; Task 6 reuses it. Sites that previously grew the count to N pass the dense mask
  of N slots.

- [ ] **Step 2: Rewrite the 5 `course.lessonCount` assertion reads** (lines 378, 965, 970,
  984, 5198) against `course.activeLessons` with a TS-side popcount:
  `const liveCount = (m: BN[]) => m.reduce((n, w) => n + popcountU64(w), 0)`.

- [ ] **Step 3: Replace the `"lesson_count is increase-only (grow ok, equal no-op, shrink rejected)"` test**
  (lines 914-984, asserting `LessonCountDecrease` at 978) — the monotonic guard it
  exercises is deleted by Task 4. Its replacement asserts the new semantics: shrinking
  via `newActiveLessons` (retiring a slot) is LEGAL, and the mask round-trips on read.

- [ ] **Step 4: Run.** `anchor test` — the migrated suite compiles and passes (89 tests:
  net-zero from this task; the increase-only test is replaced, not removed). Record the
  actual green count.

- [ ] **Step 5: Commit.** `git commit -m "test(onchain): migrate TS suite to active_lessons IDL (CS-3)"`

---

### Task 6: TS integration proofs on a real runtime (`anchor test`)

The Rust crate mirrors handler logic; the `anchor test` suite is the only place a real bank exercises the wired instructions. Add the two behaviors the mask exists to enable, end-to-end. **Task 6a must be green first.**

**Files:**
- Edit: `onchain-academy/tests/onchain-academy.ts`

- [ ] **Step 1: Add a "finalize succeeds with a stray retired bit" test.** Using the existing suite's helpers (create/enroll/complete/finalize builders): create a course with `lessonCount = 3` (dense mask `{0,1,2}`); enroll a learner; `complete_lesson` slots 0, 1, 2; `update_course({ newActiveLessons: mask{0,2} })` to retire slot 1; then `finalize_course` and assert it **succeeds** (the learner holds slot 1's stray bit, ignored by the AND), `enrollment.completedAt` is set, `course.totalCompletions` incremented, and the bonus equals `xpPerLesson * 2 / 2` (live count 2). `newActiveLessons` is a `[BN, BN, BN, BN]` (4 × u64) arg in the camelCase IDL; build the mask helper on the TS side (`slotsToMask(numbers): BN[]`).

- [ ] **Step 2: Add a "complete rejects an inactive slot" test.** Create a `lessonCount = 3` course; `update_course({ newActiveLessons: mask{0,2} })`; enroll; assert `complete_lesson(1)` **reverts** with `LessonOutOfBounds` (slot 1 retired), while `complete_lesson(0)` and `complete_lesson(2)` succeed.

- [ ] **Step 3: Run.** `anchor test` — from `onchain-academy/`, the full TS suite (91: 89 migrated by Task 6a, +2 new) passes against a local validator.

- [ ] **Step 4: Commit.** `git commit -m "test(onchain): TS integration proofs for active_lessons finalize + complete (CS-3)"`

---

## Verification

Run from `onchain-academy/`, in order (mirrors the "Mandatory On-Chain Workflow" in CLAUDE.md):

1. **Build:** `anchor build` — compiles the program and regenerates the IDL. Confirm the IDL diff shows `Course.active_lessons: [u64; 4]` present, `Course.lesson_count` gone, `UpdateCourseParams.new_active_lessons` present, `new_lesson_count` gone, and `CreateCourseParams` unchanged.
2. **Format:** `cargo fmt` — no diff.
3. **Lint:** `cargo clippy -- -W clippy::all` (the repo's pre-commit uses `-D warnings`) — clean. Confirm the retained `LessonCountDecrease` variant does **not** trip `dead_code` (it will not — `AcademyError` is a `pub enum`).
4. **Rust unit tests:** `cargo test --manifest-path onchain-academy/tests/rust/Cargo.toml`. The count moves from **128**: `test_lesson_count.rs` (−6) is deleted; `test_active_lessons.rs`, the new `test_course.rs` mask tests, and the reworked `test_completion.rs` finalize tests are added (net roughly +12 → **~140**). Record the exact `cargo test` total in the PR description; do not hardcode a guessed number.
5. **TS integration tests:** `anchor test` — the suite is migrated in place (Task 6a: 12 renames, 5 assertion rewrites, 1 test replaced) then grows **89 → 91** (Task 6). All pass against the local validator.
6. **Byte-verify + devnet deploy (CS-3 merge-time step, per the goal — NOT part of this plan doc):** after merge, build the verifiable artifact, byte-verify the on-chain program hash, and deploy to devnet **via the Helius RPC** (the public devnet RPC corrupts large deploys — this is a hard-won gotcha, see MEMORY). The 7 existing 224-byte `Course` accounts will fail to deserialize post-deploy until recreated — that recreation is **CS-4**, not this task. Sequence the deploy so CS-4's `close_course` + `create_course` resync runs immediately after.

## Re-audit required before devnet deploy

Three instructions change behavior and one changes initialization; all four need fresh audit sign-off (per spec §5.2 — "the audit sign-off and byte-verified deploy for those instructions must be redone") **before** the CS-3 devnet deploy:

- `complete_lesson` — new live-slot gate (`is_active_slot`).
- `finalize_course` — new completion predicate (mask AND) + new bonus basis (`live_lesson_count`); confirm the `xp_per_lesson × live / 2 ≤ MAX_XP_PER_MINT` invariant still holds and that `checked_mul` guards the multiply.
- `update_course` — the mask is now trusted blindly on-chain; confirm the compensating control (the sync route asserts the mask equals the `slots.lock.json`-derived mask before signing, §11.0) is documented as the invariant carrier and is CS-9's responsibility.
- `create_course` — dense-mask seeding; confirm `dense_mask` cannot overflow (`lesson_count: u8`, `i` never reaches 255) and that a 0-lesson course is still rejected.

Use the `audit-solana` skill / `solana-qa-engineer` for the pass. The `MinterRole.max_xp_per_call` re-check against live chain config (spec §6.2 gate 18) is a sync-route concern (CS-9), not this program change.

## Change-item coverage map

| # | Change (spec §5.2) | Task |
|---|---|---|
| 1 | Delete `Course.lesson_count` (u8) | 1 |
| 2 | Add `Course.active_lessons: [u64; 4]` | 1 |
| 3 | `Course::SIZE` 224 → 255, byte comment recomputed, `_reserved: [u8; 8]` preserved | 1 |
| 4 | `complete_lesson`: bound → `is_active_slot` | 2 |
| 5 | `finalize_course`: equality → mask AND; bonus × `popcount(active_lessons)`; XP invariant preserved | 3 |
| 6 | `update_course`: add `new_active_lessons`; delete monotonic `new_lesson_count` check | 4 |
| 7 | `create_course`: set initial `active_lessons` (dense) instead of `lesson_count` | 5 |
| 8 | `Course` helpers `is_active_slot(u8) -> bool`, `live_lesson_count() -> u32` (+ `dense_mask`) | 1 |
| 9 | SIZE change ⇒ recreate every `Course` via `close_course` + `create_course` — **CS-4's execution**, referenced not implemented | Verification §6 |

`content_tx_id` (already `[u8; 32]`, already updatable via `update_course.new_content_tx_id`) is preserved and available for the commitment write; the SHA write is CS-9's sync route, out of scope here.
