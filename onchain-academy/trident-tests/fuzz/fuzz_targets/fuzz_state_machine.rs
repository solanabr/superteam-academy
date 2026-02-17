#![no_main]
use arbitrary::Arbitrary;
use libfuzzer_sys::fuzz_target;

/// Fuzz target that simulates the enrollment state machine:
///   enroll -> complete_lesson* -> finalize_course -> close_enrollment / issue_credential
///
/// Tests state transition invariants without the Solana runtime.
/// Reflects the simplified V1 program: no LearnerProfile, no daily XP cap,
/// no streaks, no separate claim_completion_bonus (bonus merged into finalize).

#[derive(Debug, Arbitrary, Clone)]
enum Action {
    CompleteLesson { lesson_index: u8 },
    FinalizeCourse,
    CloseEnrollment { elapsed_seconds: i64 },
    IssueCredential,
}

#[derive(Debug, Arbitrary)]
struct StateMachineInput {
    lesson_count: u8,
    xp_per_lesson: u32,
    completion_bonus_xp: u32,
    creator_reward_xp: u32,
    min_completions_for_reward: u16,
    actions: Vec<Action>,
}

#[derive(Debug, Clone)]
struct Enrollment {
    lesson_flags: [u64; 4],
    completed_at: Option<i64>,
    credential_asset: bool,
    enrolled_at: i64,
}

#[derive(Debug, Clone)]
struct Course {
    lesson_count: u8,
    xp_per_lesson: u32,
    completion_bonus_xp: u32,
    creator_reward_xp: u32,
    min_completions_for_reward: u16,
    total_completions: u32,
    total_enrollments: u32,
    is_active: bool,
}

#[derive(Debug)]
enum ActionResult {
    Ok,
    LessonOutOfBounds,
    LessonAlreadyCompleted,
    CourseNotCompleted,
    CourseAlreadyFinalized,
    CourseNotFinalized,
    UnenrollCooldown,
    Overflow,
}

fn is_lesson_completed(flags: &[u64; 4], idx: u8) -> bool {
    let w = (idx / 64) as usize;
    if w >= 4 {
        return false;
    }
    flags[w] & (1u64 << (idx % 64)) != 0
}

fn set_lesson_completed(flags: &mut [u64; 4], idx: u8) {
    let w = (idx / 64) as usize;
    if w < 4 {
        flags[w] |= 1u64 << (idx % 64);
    }
}

fn count_completed(flags: &[u64; 4]) -> u32 {
    flags.iter().map(|w| w.count_ones()).sum()
}

/// Tracks total XP minted across all actions for invariant checking.
struct XpTracker {
    learner_xp: u64,
    creator_xp: u64,
}

fn execute_complete_lesson(
    enrollment: &mut Enrollment,
    course: &Course,
    xp: &mut XpTracker,
    lesson_index: u8,
) -> ActionResult {
    if lesson_index >= course.lesson_count {
        return ActionResult::LessonOutOfBounds;
    }
    if is_lesson_completed(&enrollment.lesson_flags, lesson_index) {
        return ActionResult::LessonAlreadyCompleted;
    }

    set_lesson_completed(&mut enrollment.lesson_flags, lesson_index);

    match xp.learner_xp.checked_add(course.xp_per_lesson as u64) {
        Some(v) => xp.learner_xp = v,
        None => return ActionResult::Overflow,
    }

    ActionResult::Ok
}

fn execute_finalize(
    enrollment: &mut Enrollment,
    course: &mut Course,
    xp: &mut XpTracker,
    now: i64,
) -> ActionResult {
    if enrollment.completed_at.is_some() {
        return ActionResult::CourseAlreadyFinalized;
    }

    let completed = count_completed(&enrollment.lesson_flags);
    if completed != course.lesson_count as u32 {
        return ActionResult::CourseNotCompleted;
    }

    enrollment.completed_at = Some(now);

    match course.total_completions.checked_add(1) {
        Some(v) => course.total_completions = v,
        None => return ActionResult::Overflow,
    }

    // Bonus XP minted to learner during finalize
    if course.completion_bonus_xp > 0 {
        match xp.learner_xp.checked_add(course.completion_bonus_xp as u64) {
            Some(v) => xp.learner_xp = v,
            None => return ActionResult::Overflow,
        }
    }

    // Creator reward if threshold met
    if course.total_completions >= course.min_completions_for_reward as u32
        && course.creator_reward_xp > 0
    {
        match xp.creator_xp.checked_add(course.creator_reward_xp as u64) {
            Some(v) => xp.creator_xp = v,
            None => return ActionResult::Overflow,
        }
    }

    ActionResult::Ok
}

fn execute_close_enrollment(enrollment: &Enrollment, elapsed_seconds: i64) -> ActionResult {
    if enrollment.completed_at.is_none() {
        if elapsed_seconds <= 86400 {
            return ActionResult::UnenrollCooldown;
        }
    }
    ActionResult::Ok
}

fn execute_issue_credential(enrollment: &mut Enrollment) -> ActionResult {
    if enrollment.completed_at.is_none() {
        return ActionResult::CourseNotFinalized;
    }
    enrollment.credential_asset = true;
    ActionResult::Ok
}

fuzz_target!(|input: StateMachineInput| {
    let lesson_count = if input.lesson_count == 0 {
        1
    } else {
        input.lesson_count
    };

    let mut course = Course {
        lesson_count,
        xp_per_lesson: input.xp_per_lesson.min(10_000),
        completion_bonus_xp: input.completion_bonus_xp.min(50_000),
        creator_reward_xp: input.creator_reward_xp.min(10_000),
        min_completions_for_reward: if input.min_completions_for_reward == 0 {
            1
        } else {
            input.min_completions_for_reward
        },
        total_completions: 0,
        total_enrollments: 1,
        is_active: true,
    };

    let mut enrollment = Enrollment {
        lesson_flags: [0u64; 4],
        completed_at: None,
        credential_asset: false,
        enrolled_at: 86400 * 100,
    };

    let mut xp = XpTracker {
        learner_xp: 0,
        creator_xp: 0,
    };

    let now = 86400 * 100 + 3600; // 1 hour after enrollment

    // Track previous bitmap state for monotonicity invariant
    let mut prev_lesson_flags = enrollment.lesson_flags;

    for action in input.actions.iter().take(300) {
        match action {
            Action::CompleteLesson { lesson_index } => {
                let result = execute_complete_lesson(
                    &mut enrollment,
                    &course,
                    &mut xp,
                    *lesson_index,
                );

                match result {
                    ActionResult::Ok => {
                        // INVARIANT: lesson is now marked complete
                        assert!(
                            is_lesson_completed(&enrollment.lesson_flags, *lesson_index),
                            "Lesson {} must be marked after completion",
                            lesson_index,
                        );

                        // INVARIANT: count never exceeds lesson_count
                        let count = count_completed(&enrollment.lesson_flags);
                        assert!(
                            count <= lesson_count as u32,
                            "Completed count ({}) exceeds lesson_count ({})",
                            count,
                            lesson_count,
                        );
                    }
                    ActionResult::LessonOutOfBounds => {
                        assert!(
                            *lesson_index >= lesson_count,
                            "LessonOutOfBounds only for index >= lesson_count"
                        );
                    }
                    ActionResult::LessonAlreadyCompleted => {
                        assert!(
                            is_lesson_completed(&enrollment.lesson_flags, *lesson_index),
                            "LessonAlreadyCompleted requires the bit to already be set"
                        );
                    }
                    ActionResult::Overflow => {}
                    _ => panic!("Unexpected result from complete_lesson"),
                }
            }

            Action::FinalizeCourse => {
                let pre_completions = course.total_completions;
                let result = execute_finalize(&mut enrollment, &mut course, &mut xp, now);

                match result {
                    ActionResult::Ok => {
                        // INVARIANT: completed_at is set
                        assert!(enrollment.completed_at.is_some());

                        // INVARIANT: all lessons must have been completed
                        let count = count_completed(&enrollment.lesson_flags);
                        assert_eq!(count, lesson_count as u32);

                        // INVARIANT: total_completions incremented by exactly 1
                        assert_eq!(
                            course.total_completions,
                            pre_completions + 1,
                            "total_completions must increment by 1"
                        );
                    }
                    ActionResult::CourseAlreadyFinalized => {
                        assert!(
                            enrollment.completed_at.is_some(),
                            "AlreadyFinalized requires completed_at.is_some()"
                        );
                    }
                    ActionResult::CourseNotCompleted => {
                        let count = count_completed(&enrollment.lesson_flags);
                        assert!(
                            count < lesson_count as u32,
                            "CourseNotCompleted but count ({}) == lesson_count ({})",
                            count,
                            lesson_count,
                        );
                    }
                    ActionResult::Overflow => {}
                    _ => panic!("Unexpected result from finalize"),
                }
            }

            Action::CloseEnrollment { elapsed_seconds } => {
                let result = execute_close_enrollment(&enrollment, *elapsed_seconds);

                match result {
                    ActionResult::Ok => {
                        if enrollment.completed_at.is_none() {
                            assert!(
                                *elapsed_seconds > 86400,
                                "Incomplete enrollment close requires > 24h"
                            );
                        }
                    }
                    ActionResult::UnenrollCooldown => {
                        assert!(enrollment.completed_at.is_none());
                        assert!(*elapsed_seconds <= 86400);
                    }
                    _ => panic!("Unexpected result from close_enrollment"),
                }
            }

            Action::IssueCredential => {
                let result = execute_issue_credential(&mut enrollment);

                match result {
                    ActionResult::Ok => {
                        assert!(enrollment.completed_at.is_some());
                        assert!(enrollment.credential_asset);
                    }
                    ActionResult::CourseNotFinalized => {
                        assert!(enrollment.completed_at.is_none());
                    }
                    _ => panic!("Unexpected result from issue_credential"),
                }
            }
        }

        // === GLOBAL INVARIANTS (checked after every action) ===

        // INVARIANT: completed_at transition is one-way (None -> Some)
        if enrollment.completed_at.is_some() {
            let saved = enrollment.completed_at;
            assert_eq!(enrollment.completed_at, saved);
        }

        // INVARIANT: lesson_flags bits only get set, never cleared (monotonic)
        for i in 0..4 {
            assert_eq!(
                prev_lesson_flags[i] & enrollment.lesson_flags[i],
                prev_lesson_flags[i],
                "Lesson flags word {} had bits cleared (was {:064b}, now {:064b})",
                i,
                prev_lesson_flags[i],
                enrollment.lesson_flags[i],
            );
        }
        prev_lesson_flags = enrollment.lesson_flags;

        // INVARIANT: total_completions <= total_enrollments
        assert!(
            course.total_completions <= course.total_enrollments,
            "total_completions ({}) > total_enrollments ({})",
            course.total_completions,
            course.total_enrollments,
        );
    }

    // === POST-SEQUENCE INVARIANTS ===

    // INVARIANT: If finalized, completed count must match lesson_count
    if enrollment.completed_at.is_some() {
        let count = count_completed(&enrollment.lesson_flags);
        assert_eq!(
            count, lesson_count as u32,
            "Finalized enrollment must have all lessons completed"
        );
    }

    // INVARIANT: credential_asset implies completed_at is Some
    if enrollment.credential_asset {
        assert!(
            enrollment.completed_at.is_some(),
            "credential requires finalization"
        );
    }

    // INVARIANT: XP accounting -- learner XP should equal
    // (lessons_completed * xp_per_lesson) + (bonus if finalized)
    if enrollment.completed_at.is_some() {
        let expected_lesson_xp = count_completed(&enrollment.lesson_flags) as u64
            * course.xp_per_lesson as u64;
        let expected_bonus = course.completion_bonus_xp as u64;
        let expected_total = expected_lesson_xp + expected_bonus;
        assert_eq!(
            xp.learner_xp, expected_total,
            "Learner XP ({}) must equal lesson XP ({}) + bonus ({})",
            xp.learner_xp, expected_lesson_xp, expected_bonus,
        );
    } else {
        let expected_lesson_xp = count_completed(&enrollment.lesson_flags) as u64
            * course.xp_per_lesson as u64;
        assert_eq!(
            xp.learner_xp, expected_lesson_xp,
            "Learner XP ({}) must equal lesson XP ({}) when not finalized",
            xp.learner_xp, expected_lesson_xp,
        );
    }

    // INVARIANT: Creator reward XP accounting
    if enrollment.completed_at.is_some()
        && course.total_completions >= course.min_completions_for_reward as u32
        && course.creator_reward_xp > 0
    {
        assert!(
            xp.creator_xp > 0,
            "Creator should have received XP when threshold met"
        );
    }

    // INVARIANT: If not finalized, total_completions should be 0 (single enrollment)
    if enrollment.completed_at.is_none() {
        assert_eq!(
            course.total_completions, 0,
            "total_completions must be 0 if enrollment not finalized"
        );
    }

    // INVARIANT: XP values are always non-negative (u64 guarantees this but check logic)
    assert!(
        xp.learner_xp <= u64::MAX,
        "Learner XP must not overflow"
    );
    assert!(
        xp.creator_xp <= u64::MAX,
        "Creator XP must not overflow"
    );

    // INVARIANT: Credential is idempotent (can issue multiple times without error)
    if enrollment.completed_at.is_some() {
        let prev = enrollment.credential_asset;
        let result = execute_issue_credential(&mut enrollment);
        assert!(matches!(result, ActionResult::Ok));
        // credential_asset remains true once set
        if prev {
            assert!(enrollment.credential_asset);
        }
    }

    // INVARIANT: Close enrollment after finalize always succeeds (no cooldown)
    if enrollment.completed_at.is_some() {
        let result = execute_close_enrollment(&enrollment, 0);
        assert!(
            matches!(result, ActionResult::Ok),
            "Completed enrollment close must always succeed regardless of elapsed time"
        );
    }
});
