//! Tests for the increase-only `lesson_count` mutation (#314).
//!
//! `update_course` gains `UpdateCourseParams.new_lesson_count: Option<u8>` so a
//! teacher who appends lessons to an already-deployed course can raise the
//! on-chain `course.lesson_count`; without it a newly-added lesson's index is
//! `>= course.lesson_count` and `complete_lesson` reverts with
//! `LessonOutOfBounds`.
//!
//! Invariant: the count is INCREASE-ONLY. Raising it succeeds, an equal value is
//! a no-op that is accepted, and any value below the current count is rejected
//! with the new `LessonCountDecrease` error (shrinking would strand already-set
//! completion flags and shift bitmap indices). No account resize is needed — the
//! enrollment bitmap is `[u64; 4]` = 256 bits and `lesson_count` is a `u8`
//! (max 255), so the `Course` layout is unchanged.
//!
//! These mirror the handler guard directly (matching the rest of this test
//! crate, which validates handler logic without a runtime) and round-trip the
//! wire format so the generated IDL arg is pinned.

use anchor_lang::{AnchorDeserialize, AnchorSerialize};
use onchain_academy::errors::AcademyError;
use onchain_academy::instructions::UpdateCourseParams;

/// Mirror of the increase-only branch in the handler:
/// `if let Some(n) = params.new_lesson_count { require!(n >= course.lesson_count, LessonCountDecrease); course.lesson_count = n }`.
/// Returns the resulting lesson_count, or the error code for a rejected shrink.
fn apply_lesson_count_update(current: u8, new_lesson_count: Option<u8>) -> Result<u8, u32> {
    match new_lesson_count {
        Some(n) if n < current => Err(6000 + AcademyError::LessonCountDecrease as u32),
        Some(n) => Ok(n),
        None => Ok(current),
    }
}

#[test]
fn lesson_count_can_be_increased() {
    // A teacher appends lessons: 5 -> 8 lands, matching the new bitmap positions.
    assert_eq!(apply_lesson_count_update(5, Some(8)), Ok(8));
    // Growth all the way to the u8 ceiling still fits the [u64; 4] bitmap.
    assert_eq!(apply_lesson_count_update(1, Some(255)), Ok(255));
}

#[test]
fn lesson_count_equal_is_an_accepted_noop() {
    // Re-syncing with an unchanged count is not an error — it simply re-sets the
    // same value (idempotent), so a redundant admin re-sync never reverts.
    assert_eq!(apply_lesson_count_update(10, Some(10)), Ok(10));
}

#[test]
fn lesson_count_decrease_is_rejected() {
    // Any value below the current count is rejected with LessonCountDecrease:
    // shrinking would strand completion flags for the removed tail lessons and
    // shift indices for the survivors.
    let err = apply_lesson_count_update(10, Some(9))
        .expect_err("shrinking lesson_count must be rejected");
    assert_eq!(err, 6000 + AcademyError::LessonCountDecrease as u32);

    // Dropping to zero is likewise rejected.
    assert_eq!(
        apply_lesson_count_update(10, Some(0)),
        Err(6000 + AcademyError::LessonCountDecrease as u32)
    );
}

#[test]
fn lesson_count_none_leaves_it_unchanged() {
    // Omitting the field (the common re-sync case where the count is unchanged)
    // leaves lesson_count as-is.
    assert_eq!(apply_lesson_count_update(7, None), Ok(7));
}

/// `UpdateCourseParams` now carries `new_lesson_count: Option<u8>` appended after
/// `new_collection`. Round-trip the meaningful shapes so the wire format (and
/// thus the generated IDL arg) is pinned — including a grow-only call and the
/// all-None (nothing-to-do) shape.
#[test]
fn update_course_params_new_lesson_count_serialization_roundtrip() {
    // Grow lesson_count only.
    let grow = UpdateCourseParams {
        new_content_tx_id: None,
        new_is_active: None,
        new_xp_per_lesson: None,
        new_creator_reward_xp: None,
        new_min_completions_for_reward: None,
        new_collection: None,
        new_lesson_count: Some(12),
    };
    let mut buf = Vec::new();
    grow.serialize(&mut buf).unwrap();
    let decoded = UpdateCourseParams::deserialize(&mut buf.as_slice()).unwrap();
    assert_eq!(decoded.new_lesson_count, Some(12));
    assert_eq!(decoded.new_xp_per_lesson, None);
    assert_eq!(decoded.new_collection, None);

    // All-None: nothing to change (the field is a strict addition, so the empty
    // update still round-trips).
    let noop = UpdateCourseParams {
        new_content_tx_id: None,
        new_is_active: None,
        new_xp_per_lesson: None,
        new_creator_reward_xp: None,
        new_min_completions_for_reward: None,
        new_collection: None,
        new_lesson_count: None,
    };
    let mut buf = Vec::new();
    noop.serialize(&mut buf).unwrap();
    let decoded = UpdateCourseParams::deserialize(&mut buf.as_slice()).unwrap();
    assert_eq!(decoded.new_lesson_count, None);
}

/// The new variant is APPENDED at the end of `AcademyError`, so every prior
/// discriminant keeps its number (the live devnet program must not renumber).
/// Pin the tail: XpAmountExceedsMax stays 6033, LessonCountDecrease is 6034.
#[test]
fn lesson_count_decrease_is_appended_without_shifting_prior_codes() {
    assert_eq!(6000 + AcademyError::XpAmountExceedsMax as u32, 6033);
    assert_eq!(6000 + AcademyError::LessonCountDecrease as u32, 6034);
}
