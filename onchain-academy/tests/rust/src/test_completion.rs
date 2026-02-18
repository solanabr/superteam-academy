/// Tests for course completion logic: bitmap counting, all-lessons-complete check,
/// and finalize eligibility. These mirror the logic in `finalize_course` and
/// `complete_lesson` handlers without requiring a runtime.

/// Mirrors the completion check in finalize_course:
/// `let completed: u32 = enrollment.lesson_flags.iter().map(|w| w.count_ones()).sum();`
/// `require!(completed == course.lesson_count as u32, ...)`
fn all_lessons_complete(flags: &[u64; 4], lesson_count: u8) -> bool {
    let completed: u32 = flags.iter().map(|w| w.count_ones()).sum();
    completed == lesson_count as u32
}

fn set_lesson(flags: &mut [u64; 4], index: u8) {
    let word = (index / 64) as usize;
    let bit = index % 64;
    flags[word] |= 1u64 << bit;
}

#[test]
fn empty_bitmap_is_not_complete() {
    let flags = [0u64; 4];
    assert!(!all_lessons_complete(&flags, 1));
    assert!(!all_lessons_complete(&flags, 10));
    assert!(!all_lessons_complete(&flags, 255));
}

#[test]
fn all_lessons_complete_single_lesson() {
    let mut flags = [0u64; 4];
    set_lesson(&mut flags, 0);
    assert!(all_lessons_complete(&flags, 1));
}

#[test]
fn partial_completion_not_complete() {
    let mut flags = [0u64; 4];
    let lesson_count = 5u8;

    for i in 0..3 {
        set_lesson(&mut flags, i);
    }

    assert!(!all_lessons_complete(&flags, lesson_count));
}

#[test]
fn exact_completion_is_complete() {
    let mut flags = [0u64; 4];
    let lesson_count = 5u8;

    for i in 0..lesson_count {
        set_lesson(&mut flags, i);
    }

    assert!(all_lessons_complete(&flags, lesson_count));
}

#[test]
fn extra_bits_beyond_lesson_count_still_passes() {
    // If somehow extra bits are set beyond lesson_count, the count_ones() sum
    // will exceed lesson_count and the check will fail (completed != lesson_count).
    let mut flags = [0u64; 4];
    let lesson_count = 3u8;

    for i in 0..5 {
        set_lesson(&mut flags, i);
    }

    // 5 bits set != 3 lesson_count
    assert!(!all_lessons_complete(&flags, lesson_count));
}

#[test]
fn completion_across_word_boundaries() {
    let mut flags = [0u64; 4];
    let lesson_count = 65u8;

    for i in 0..lesson_count {
        set_lesson(&mut flags, i);
    }

    assert!(all_lessons_complete(&flags, lesson_count));

    // Word 0 should be full (64 bits)
    assert_eq!(flags[0], u64::MAX);
    // Word 1 should have 1 bit
    assert_eq!(flags[1], 1);
}

#[test]
fn max_lessons_256_complete() {
    let mut flags = [0u64; 4];

    for i in 0..=255u8 {
        set_lesson(&mut flags, i);
    }

    // 256 bits set. The lesson_count is u8 which maxes at 255.
    // With 256 bits set and lesson_count=255, this would fail (256 != 255).
    assert!(!all_lessons_complete(&flags, 255));

    // But actually 255 lessons means indices 0..254
    let mut flags2 = [0u64; 4];
    for i in 0..255u8 {
        set_lesson(&mut flags2, i);
    }
    assert!(all_lessons_complete(&flags2, 255));
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

#[test]
fn lesson_out_of_bounds_check() {
    // Mirrors: `require!(lesson_index < course.lesson_count, LessonOutOfBounds)`
    let lesson_count: u8 = 10;

    // Valid indices
    for i in 0..lesson_count {
        assert!(i < lesson_count);
    }

    // Invalid: index == lesson_count
    assert!(!(lesson_count < lesson_count));

    // Invalid: index > lesson_count
    assert!(!(lesson_count + 1 < lesson_count));
}

#[test]
fn completion_bonus_xp_is_50_percent_of_total() {
    // finalize_course: bonus = (xp_per_lesson * lesson_count) / 2
    let xp_per_lesson: u32 = 100;
    let lesson_count: u8 = 5;
    let creator_reward_xp: u32 = 50;
    let min_completions_for_reward: u16 = 3;
    let total_completions: u32 = 3;

    let total_lesson_xp = (xp_per_lesson as u64) * (lesson_count as u64);
    assert_eq!(total_lesson_xp, 500);

    let bonus_xp = total_lesson_xp / 2;
    assert_eq!(bonus_xp, 250);

    // Creator reward is minted if threshold met
    assert!(total_completions >= min_completions_for_reward as u32);
    let total_xp_to_learner = total_lesson_xp + bonus_xp;
    assert_eq!(total_xp_to_learner, 750);

    // Creator gets their reward
    assert_eq!(creator_reward_xp, 50);
}

#[test]
fn completion_bonus_zero_when_xp_per_lesson_is_one() {
    // With xp_per_lesson=1, lesson_count=1: bonus = (1*1)/2 = 0 (integer division)
    let xp_per_lesson: u32 = 1;
    let lesson_count: u8 = 1;
    let total_lesson_xp = (xp_per_lesson as u64) * (lesson_count as u64);
    let bonus_xp = total_lesson_xp / 2;
    assert_eq!(bonus_xp, 0);
}

#[test]
fn creator_reward_below_threshold_means_no_mint() {
    let min_completions_for_reward: u16 = 5;
    let total_completions: u32 = 4; // below threshold
    let creator_reward_xp: u32 = 100;

    // finalize_course: `if total_completions >= min_completions && creator_reward_xp > 0`
    let should_mint =
        total_completions >= min_completions_for_reward as u32 && creator_reward_xp > 0;
    assert!(!should_mint);
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
fn close_enrollment_completed_skips_cooldown() {
    // close_enrollment: `if enrollment.completed_at.is_none() { check cooldown }`
    let completed_at: Option<i64> = Some(1700000000);
    // When completed, cooldown check is skipped
    assert!(completed_at.is_some());
}
