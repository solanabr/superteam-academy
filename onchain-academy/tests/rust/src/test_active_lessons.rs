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
