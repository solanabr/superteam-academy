use crate::helpers::*;
use anchor_lang::{AnchorDeserialize, AnchorSerialize};
use solana_sdk::pubkey::Pubkey;
use superteam_academy::state::{Course, MAX_COURSE_ID_LEN};

#[test]
fn course_size_constant_is_correct() {
    // 8 (discriminator) + (4 + 32) (course_id String) + 32 (creator)
    // + 32 (content_tx_id) + 2 (version) + 1 (lesson_count) + 1 (difficulty)
    // + 4 (xp_per_lesson) + 2 (track_id) + 1 (track_level) + (1 + 32) (prerequisite Option<Pubkey>)
    // + 4 (creator_reward_xp) + 2 (min_completions_for_reward)
    // + 4 (total_completions) + 4 (total_enrollments) + 1 (is_active)
    // + 8 (created_at) + 8 (updated_at) + 8 (_reserved) + 1 (bump)
    assert_eq!(Course::SIZE, 192);
}

#[test]
fn max_course_id_len_is_32() {
    assert_eq!(MAX_COURSE_ID_LEN, 32);
}

#[test]
fn course_serialization_roundtrip() {
    let course = Course {
        course_id: "test-course".to_string(),
        creator: Pubkey::new_unique(),
        content_tx_id: [42u8; 32],
        version: 3,
        lesson_count: 10,
        difficulty: 2,
        xp_per_lesson: 100,
        track_id: 5,
        track_level: 2,
        prerequisite: None,
        creator_reward_xp: 50,
        min_completions_for_reward: 10,
        total_completions: 7,
        total_enrollments: 25,
        is_active: true,
        created_at: 1700000000,
        updated_at: 1700001000,
        _reserved: [0u8; 8],
        bump: 253,
    };

    let mut buf = Vec::new();
    course.serialize(&mut buf).unwrap();

    let deserialized = Course::deserialize(&mut buf.as_slice()).unwrap();

    assert_eq!(deserialized.course_id, "test-course");
    assert_eq!(deserialized.creator, course.creator);
    assert_eq!(deserialized.content_tx_id, [42u8; 32]);
    assert_eq!(deserialized.version, 3);
    assert_eq!(deserialized.lesson_count, 10);
    assert_eq!(deserialized.difficulty, 2);
    assert_eq!(deserialized.xp_per_lesson, 100);
    assert_eq!(deserialized.track_id, 5);
    assert_eq!(deserialized.track_level, 2);
    assert_eq!(deserialized.prerequisite, None);
    assert_eq!(deserialized.creator_reward_xp, 50);
    assert_eq!(deserialized.min_completions_for_reward, 10);
    assert_eq!(deserialized.total_completions, 7);
    assert_eq!(deserialized.total_enrollments, 25);
    assert!(deserialized.is_active);
    assert_eq!(deserialized.created_at, 1700000000);
    assert_eq!(deserialized.updated_at, 1700001000);
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
        lesson_count: 5,
        difficulty: 3,
        xp_per_lesson: 200,
        track_id: 1,
        track_level: 2,
        prerequisite: Some(prereq),
        creator_reward_xp: 20,
        min_completions_for_reward: 5,
        total_completions: 0,
        total_enrollments: 0,
        is_active: true,
        created_at: 0,
        updated_at: 0,
        _reserved: [0u8; 8],
        bump: 1,
    };

    let mut buf = Vec::new();
    course.serialize(&mut buf).unwrap();
    let deserialized = Course::deserialize(&mut buf.as_slice()).unwrap();

    assert_eq!(deserialized.prerequisite, Some(prereq));
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
        lesson_count: 1,
        difficulty: 1,
        xp_per_lesson: 0,
        track_id: 0,
        track_level: 0,
        prerequisite: Some(Pubkey::new_unique()),
        creator_reward_xp: 0,
        min_completions_for_reward: 0,
        total_completions: 0,
        total_enrollments: 0,
        is_active: true,
        created_at: 0,
        updated_at: 0,
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
        lesson_count: 1,
        difficulty: 1,
        xp_per_lesson: 0,
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
        _reserved: [0u8; 8],
        bump: 0,
    };

    let mut buf = Vec::new();
    course.serialize(&mut buf).unwrap();

    // Shorter course_id means serialized data fits within allocated SIZE
    assert!(buf.len() + 8 <= Course::SIZE);
}
