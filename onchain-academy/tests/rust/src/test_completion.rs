/// Tests for course completion logic: bitmap counting, all-active-complete check,
/// and finalize eligibility. These mirror the logic in `finalize_course` and
/// `complete_lesson` handlers without requiring a runtime.

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

fn set_lesson(flags: &mut [u64; 4], index: u8) {
    let word = (index / 64) as usize;
    let bit = index % 64;
    flags[word] |= 1u64 << bit;
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

#[test]
fn lesson_already_completed_detection() {
    let mut flags = [0u64; 4];
    set_lesson(&mut flags, 7);

    // Mirrors the check in complete_lesson:
    // `require!(enrollment.lesson_flags[word_index] & mask == 0, LessonAlreadyCompleted)`
    let word = (7u8 / 64) as usize;
    let bit = 7u8 % 64;
    let mask = 1u64 << bit;

    // Bit is already set
    assert_ne!(flags[word] & mask, 0);
}

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

#[test]
fn completion_bonus_xp_is_50_percent_of_total() {
    // finalize_course: bonus = (xp_per_lesson * live_lesson_count) / 2
    let xp_per_lesson: u32 = 100;
    let live_lesson_count: u8 = 5;
    let creator_reward_xp: u32 = 50;

    let total_lesson_xp = (xp_per_lesson as u64) * (live_lesson_count as u64);
    assert_eq!(total_lesson_xp, 500);

    let bonus_xp = total_lesson_xp / 2;
    assert_eq!(bonus_xp, 250);

    let total_xp_to_learner = total_lesson_xp + bonus_xp;
    assert_eq!(total_xp_to_learner, 750);

    // Creator reward is now unconditional on completion (WS-1: no threshold, no
    // window) whenever creator_reward_xp > 0.
    assert!(creator_reward_xp > 0);
}

#[test]
fn completion_bonus_zero_when_xp_per_lesson_is_one() {
    // With xp_per_lesson=1, live_lesson_count=1: bonus = (1*1)/2 = 0 (integer division)
    let xp_per_lesson: u32 = 1;
    let live_lesson_count: u8 = 1;
    let total_lesson_xp = (xp_per_lesson as u64) * (live_lesson_count as u64);
    let bonus_xp = total_lesson_xp / 2;
    assert_eq!(bonus_xp, 0);
}

#[test]
fn creator_reward_gate_is_reward_xp_only() {
    // WS-1: the `total_completions >= min_completions` threshold and the window
    // are gone. finalize_course now mints the creator reward iff reward_xp > 0,
    // on the first completion and every one after.
    let mint = |reward_xp: u32| reward_xp > 0;

    assert!(mint(100)); // first completion pays — no threshold to cross
    assert!(!mint(0)); // reward_xp == 0 is the only thing that suppresses it
}

#[test]
fn double_finalize_detection() {
    // finalize_course: `require!(enrollment.completed_at.is_none(), CourseAlreadyFinalized)`
    let completed_at: Option<i64> = Some(1700000000);
    assert!(!completed_at.is_none());
}

#[test]
fn close_enrollment_cooldown_logic() {
    // close_enrollment: if not completed, requires elapsed > 86400
    let enrolled_at: i64 = 1700000000;
    let now_too_early: i64 = enrolled_at + 86400; // exactly 24h, not >
    let now_ok: i64 = enrolled_at + 86401;

    let elapsed_early = now_too_early.checked_sub(enrolled_at).unwrap();
    assert!(!(elapsed_early > 86400));

    let elapsed_ok = now_ok.checked_sub(enrolled_at).unwrap();
    assert!(elapsed_ok > 86400);
}

#[test]
fn close_enrollment_blocks_completed() {
    // close_enrollment now rejects finalized enrollments (replay guard):
    // `require!(completed_at.is_none() && credential_asset.is_none(), EnrollmentFinalized)`
    let completed_at: Option<i64> = Some(1700000000);
    let credential_asset: Option<[u8; 32]> = None;
    let closable = completed_at.is_none() && credential_asset.is_none();
    assert!(!closable);
}

#[test]
fn close_enrollment_blocks_credentialed() {
    // A credentialed enrollment cannot be closed even if completed_at were None,
    // because closing it would orphan the credential linkage.
    let completed_at: Option<i64> = None;
    let credential_asset: Option<[u8; 32]> = Some([7u8; 32]);
    let closable = completed_at.is_none() && credential_asset.is_none();
    assert!(!closable);
}

#[test]
fn close_enrollment_allows_incomplete_after_cooldown() {
    // The legitimate incomplete-unenroll path: no completion, no credential,
    // and past the 24h cooldown.
    let completed_at: Option<i64> = None;
    let credential_asset: Option<[u8; 32]> = None;
    let enrolled_at: i64 = 1700000000;
    let now: i64 = enrolled_at + 86401;

    let not_finalized = completed_at.is_none() && credential_asset.is_none();
    let cooldown_met = now.checked_sub(enrolled_at).unwrap() > 86400;
    assert!(not_finalized && cooldown_met);
}
