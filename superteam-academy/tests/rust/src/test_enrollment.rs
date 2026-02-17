use crate::helpers::*;
use anchor_lang::{AnchorDeserialize, AnchorSerialize};
use solana_sdk::pubkey::Pubkey;
use superteam_academy::state::Enrollment;

#[test]
fn enrollment_size_constant_is_correct() {
    // 8 (discriminator) + 32 (course) + 8 (enrolled_at) + (1 + 8) (completed_at Option<i64>)
    // + 32 (lesson_flags [u64; 4]) + (1 + 32) (credential_asset Option<Pubkey>)
    // + 4 (_reserved) + 1 (bump)
    assert_eq!(Enrollment::SIZE, 8 + 32 + 8 + 9 + 32 + 33 + 4 + 1);
    assert_eq!(Enrollment::SIZE, 127);
}

#[test]
fn enrollment_serialization_roundtrip_in_progress() {
    let course = Pubkey::new_unique();
    let enrollment = Enrollment {
        course,
        enrolled_at: 1700000000,
        completed_at: None,
        lesson_flags: [0u64; 4],
        credential_asset: None,
        _reserved: [0u8; 4],
        bump: 252,
    };

    let mut buf = Vec::new();
    enrollment.serialize(&mut buf).unwrap();
    let deserialized = Enrollment::deserialize(&mut buf.as_slice()).unwrap();

    assert_eq!(deserialized.course, course);
    assert_eq!(deserialized.enrolled_at, 1700000000);
    assert_eq!(deserialized.completed_at, None);
    assert_eq!(deserialized.lesson_flags, [0u64; 4]);
    assert_eq!(deserialized.credential_asset, None);
    assert_eq!(deserialized._reserved, [0u8; 4]);
    assert_eq!(deserialized.bump, 252);
}

#[test]
fn enrollment_serialization_roundtrip_completed() {
    let course = Pubkey::new_unique();
    let credential = Pubkey::new_unique();
    let enrollment = Enrollment {
        course,
        enrolled_at: 1700000000,
        completed_at: Some(1700100000),
        lesson_flags: [0b1111, 0, 0, 0],
        credential_asset: Some(credential),
        _reserved: [0u8; 4],
        bump: 250,
    };

    let mut buf = Vec::new();
    enrollment.serialize(&mut buf).unwrap();
    let deserialized = Enrollment::deserialize(&mut buf.as_slice()).unwrap();

    assert_eq!(deserialized.completed_at, Some(1700100000));
    assert_eq!(deserialized.lesson_flags[0], 0b1111);
    assert_eq!(deserialized.credential_asset, Some(credential));
}

#[test]
fn enrollment_serialized_size_matches_constant() {
    // All Option fields must be Some for worst-case size to match SIZE constant
    let enrollment = Enrollment {
        course: Pubkey::new_unique(),
        enrolled_at: 0,
        completed_at: Some(12345),
        lesson_flags: [0u64; 4],
        credential_asset: Some(Pubkey::new_unique()),
        _reserved: [0u8; 4],
        bump: 0,
    };

    let mut buf = Vec::new();
    enrollment.serialize(&mut buf).unwrap();

    // Serialized data + 8-byte discriminator = SIZE
    assert_eq!(buf.len() + 8, Enrollment::SIZE);
}

#[test]
fn enrollment_serialized_size_none_options_fits_within_allocation() {
    let enrollment = Enrollment {
        course: Pubkey::new_unique(),
        enrolled_at: 0,
        completed_at: None,
        lesson_flags: [0u64; 4],
        credential_asset: None,
        _reserved: [0u8; 4],
        bump: 0,
    };

    let mut buf = Vec::new();
    enrollment.serialize(&mut buf).unwrap();

    // None options serialize smaller, but must fit within allocated SIZE
    assert!(buf.len() + 8 <= Enrollment::SIZE);
}

#[test]
fn enrollment_pda_is_deterministic() {
    let learner = Pubkey::new_unique();
    let (pda1, bump1) = enrollment_pda("test", &learner);
    let (pda2, bump2) = enrollment_pda("test", &learner);
    assert_eq!(pda1, pda2);
    assert_eq!(bump1, bump2);
}

#[test]
fn different_learners_yield_different_enrollment_pdas() {
    let learner_a = Pubkey::new_unique();
    let learner_b = Pubkey::new_unique();
    let (pda_a, _) = enrollment_pda("same-course", &learner_a);
    let (pda_b, _) = enrollment_pda("same-course", &learner_b);
    assert_ne!(pda_a, pda_b);
}

#[test]
fn different_courses_yield_different_enrollment_pdas() {
    let learner = Pubkey::new_unique();
    let (pda_a, _) = enrollment_pda("course-a", &learner);
    let (pda_b, _) = enrollment_pda("course-b", &learner);
    assert_ne!(pda_a, pda_b);
}

#[test]
fn enrollment_pda_is_valid() {
    let learner = Pubkey::new_unique();
    let course_id = "my-course";
    let (pda, bump) = enrollment_pda(course_id, &learner);
    let derived = Pubkey::create_program_address(
        &[
            b"enrollment",
            course_id.as_bytes(),
            learner.as_ref(),
            &[bump],
        ],
        &PROGRAM_ID,
    );
    assert!(derived.is_ok());
    assert_eq!(derived.unwrap(), pda);
}

#[test]
fn enrollment_bitmap_set_lesson() {
    let mut enrollment = Enrollment {
        course: Pubkey::new_unique(),
        enrolled_at: 0,
        completed_at: None,
        lesson_flags: [0u64; 4],
        credential_asset: None,
        _reserved: [0u8; 4],
        bump: 0,
    };

    let lesson_index: u8 = 5;
    let word_index = (lesson_index / 64) as usize;
    let bit_index = lesson_index % 64;
    let mask = 1u64 << bit_index;

    // Before: bit is clear
    assert_eq!(enrollment.lesson_flags[word_index] & mask, 0);

    // Set bit
    enrollment.lesson_flags[word_index] |= mask;

    // After: bit is set
    assert_ne!(enrollment.lesson_flags[word_index] & mask, 0);

    // Serialization preserves the bitmap
    let mut buf = Vec::new();
    enrollment.serialize(&mut buf).unwrap();
    let deserialized = Enrollment::deserialize(&mut buf.as_slice()).unwrap();
    assert_ne!(deserialized.lesson_flags[word_index] & mask, 0);
}

#[test]
fn enrollment_completed_lessons_count() {
    let mut flags = [0u64; 4];
    let lesson_count: u8 = 10;

    for i in 0..lesson_count {
        let word = (i / 64) as usize;
        let bit = i % 64;
        flags[word] |= 1u64 << bit;
    }

    let completed: u32 = flags.iter().map(|w| w.count_ones()).sum();
    assert_eq!(completed, lesson_count as u32);
}

#[test]
fn enrollment_reserved_bytes_size() {
    let enrollment = Enrollment {
        course: Pubkey::new_unique(),
        enrolled_at: 0,
        completed_at: None,
        lesson_flags: [0u64; 4],
        credential_asset: None,
        _reserved: [0u8; 4],
        bump: 0,
    };

    assert_eq!(enrollment._reserved.len(), 4);
}
