use crate::helpers::*;
use anchor_lang::{AnchorDeserialize, AnchorSerialize};
use onchain_academy::state::{Course, MAX_COURSE_ID_LEN};
use solana_sdk::pubkey::Pubkey;

#[test]
fn course_size_constant_is_correct() {
    // v-next (WS-1): v2's 255 - 2 (deleted min_completions_for_reward u16) = 253.
    // 8 (discriminator) + (4 + 32) (course_id) + 32 (creator) + 32 (content_tx_id)
    // + 2 (version) + 32 (active_lessons: [u64; 4]) + 1 (difficulty) + 4 (xp_per_lesson)
    // + 2 (track_id) + 1 (track_level) + (1 + 32) (prerequisite Option<Pubkey>)
    // + 4 (creator_reward_xp) + 4 (total_completions)
    // + 4 (total_enrollments) + 1 (is_active) + 8 (created_at) + 8 (updated_at)
    // + 32 (collection) + 8 (_reserved) + 1 (bump)
    // 253 must NOT drift back to 255 — the client decoder dispatches on length,
    // and 255 is the never-deployed v2 layout.
    assert_eq!(Course::SIZE, 253);
}

#[test]
fn max_course_id_len_is_32() {
    assert_eq!(MAX_COURSE_ID_LEN, 32);
}

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

#[test]
fn course_serialization_roundtrip() {
    let course = Course {
        course_id: "test-course".to_string(),
        creator: Pubkey::new_unique(),
        content_tx_id: [42u8; 32],
        version: 3,
        active_lessons: Course::dense_mask(10),
        difficulty: 2,
        xp_per_lesson: 100,
        track_id: 5,
        track_level: 2,
        prerequisite: None,
        creator_reward_xp: 50,
        total_completions: 7,
        total_enrollments: 25,
        is_active: true,
        created_at: 1700000000,
        updated_at: 1700001000,
        collection: Pubkey::new_unique(),
        _reserved: [0u8; 8],
        bump: 253,
    };
    let expected_collection = course.collection;

    let mut buf = Vec::new();
    course.serialize(&mut buf).unwrap();

    let deserialized = Course::deserialize(&mut buf.as_slice()).unwrap();

    assert_eq!(deserialized.course_id, "test-course");
    assert_eq!(deserialized.creator, course.creator);
    assert_eq!(deserialized.content_tx_id, [42u8; 32]);
    assert_eq!(deserialized.version, 3);
    assert_eq!(deserialized.live_lesson_count(), 10);
    assert_eq!(deserialized.difficulty, 2);
    assert_eq!(deserialized.xp_per_lesson, 100);
    assert_eq!(deserialized.track_id, 5);
    assert_eq!(deserialized.track_level, 2);
    assert_eq!(deserialized.prerequisite, None);
    assert_eq!(deserialized.creator_reward_xp, 50);
    assert_eq!(deserialized.total_completions, 7);
    assert_eq!(deserialized.total_enrollments, 25);
    assert!(deserialized.is_active);
    assert_eq!(deserialized.created_at, 1700000000);
    assert_eq!(deserialized.updated_at, 1700001000);
    assert_eq!(deserialized.collection, expected_collection);
    assert_eq!(deserialized._reserved, [0u8; 8]);
    assert_eq!(deserialized.bump, 253);
}

#[test]
fn course_with_prerequisite_roundtrip() {
    let prereq = Pubkey::new_unique();
    let course = Course {
        course_id: "advanced".to_string(),
        creator: Pubkey::new_unique(),
        content_tx_id: [0u8; 32],
        version: 1,
        active_lessons: Course::dense_mask(5),
        difficulty: 3,
        xp_per_lesson: 200,
        track_id: 1,
        track_level: 2,
        prerequisite: Some(prereq),
        creator_reward_xp: 20,
        total_completions: 0,
        total_enrollments: 0,
        is_active: true,
        created_at: 0,
        updated_at: 0,
        collection: Pubkey::new_unique(),
        _reserved: [0u8; 8],
        bump: 1,
    };

    let mut buf = Vec::new();
    course.serialize(&mut buf).unwrap();
    let deserialized = Course::deserialize(&mut buf.as_slice()).unwrap();

    assert_eq!(deserialized.prerequisite, Some(prereq));
}

#[test]
fn course_collection_roundtrip() {
    let collection = Pubkey::new_unique();
    let course = Course {
        course_id: "with-collection".to_string(),
        creator: Pubkey::new_unique(),
        content_tx_id: [0u8; 32],
        version: 1,
        active_lessons: Course::dense_mask(3),
        difficulty: 2,
        xp_per_lesson: 50,
        track_id: 1,
        track_level: 1,
        prerequisite: None,
        creator_reward_xp: 0,
        total_completions: 0,
        total_enrollments: 0,
        is_active: true,
        created_at: 0,
        updated_at: 0,
        collection,
        _reserved: [0u8; 8],
        bump: 1,
    };

    let mut buf = Vec::new();
    course.serialize(&mut buf).unwrap();
    let deserialized = Course::deserialize(&mut buf.as_slice()).unwrap();

    assert_eq!(deserialized.collection, collection);

    // A freshly-created course with no collection set must read as the default
    // pubkey, which is what makes credential mint revert until backfilled.
    let mut unset = course;
    unset.collection = Pubkey::default();
    let mut unset_buf = Vec::new();
    unset.serialize(&mut unset_buf).unwrap();
    let unset_de = Course::deserialize(&mut unset_buf.as_slice()).unwrap();
    assert_eq!(unset_de.collection, Pubkey::default());
}

#[test]
fn course_pda_is_deterministic() {
    let (pda1, bump1) = course_pda("test-course");
    let (pda2, bump2) = course_pda("test-course");
    assert_eq!(pda1, pda2);
    assert_eq!(bump1, bump2);
}

#[test]
fn different_course_ids_yield_different_pdas() {
    let (pda_a, _) = course_pda("course-a");
    let (pda_b, _) = course_pda("course-b");
    assert_ne!(pda_a, pda_b);
}

#[test]
fn course_pda_is_valid() {
    let course_id = "my-course";
    let (pda, bump) = course_pda(course_id);
    let derived =
        Pubkey::create_program_address(&[b"course", course_id.as_bytes(), &[bump]], &PROGRAM_ID);
    assert!(derived.is_ok());
    assert_eq!(derived.unwrap(), pda);
}

#[test]
fn course_max_id_length_pda() {
    let long_id = "a".repeat(MAX_COURSE_ID_LEN);
    let (pda, bump) = course_pda(&long_id);
    let derived =
        Pubkey::create_program_address(&[b"course", long_id.as_bytes(), &[bump]], &PROGRAM_ID);
    assert!(derived.is_ok());
    assert_eq!(derived.unwrap(), pda);
}

#[test]
fn course_serialized_size_with_max_id_and_all_options() {
    let course = Course {
        course_id: "a".repeat(MAX_COURSE_ID_LEN),
        creator: Pubkey::new_unique(),
        content_tx_id: [0u8; 32],
        version: 1,
        active_lessons: Course::dense_mask(1),
        difficulty: 1,
        xp_per_lesson: 0,
        track_id: 0,
        track_level: 0,
        prerequisite: Some(Pubkey::new_unique()),
        creator_reward_xp: 0,
        total_completions: 0,
        total_enrollments: 0,
        is_active: true,
        created_at: 0,
        updated_at: 0,
        collection: Pubkey::new_unique(),
        _reserved: [0u8; 8],
        bump: 0,
    };

    let mut buf = Vec::new();
    course.serialize(&mut buf).unwrap();

    // With max-length course_id and all Options filled, serialized data + discriminator = SIZE
    assert_eq!(buf.len() + 8, Course::SIZE);
}

#[test]
fn course_serialized_size_shorter_id_fits_within_allocation() {
    let course = Course {
        course_id: "short".to_string(),
        creator: Pubkey::new_unique(),
        content_tx_id: [0u8; 32],
        version: 1,
        active_lessons: Course::dense_mask(1),
        difficulty: 1,
        xp_per_lesson: 0,
        track_id: 0,
        track_level: 0,
        prerequisite: None,
        creator_reward_xp: 0,
        total_completions: 0,
        total_enrollments: 0,
        is_active: true,
        created_at: 0,
        updated_at: 0,
        collection: Pubkey::new_unique(),
        _reserved: [0u8; 8],
        bump: 0,
    };

    let mut buf = Vec::new();
    course.serialize(&mut buf).unwrap();

    // Shorter course_id means serialized data fits within allocated SIZE
    assert!(buf.len() + 8 <= Course::SIZE);
}
