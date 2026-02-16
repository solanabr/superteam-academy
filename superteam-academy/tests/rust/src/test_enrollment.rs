use crate::helpers::*;
use anchor_lang::{InstructionData, ToAccountMetas};
use solana_sdk::{
    instruction::{AccountMeta, Instruction},
    signature::{Keypair, Signer},
    system_program,
    transaction::Transaction,
};
use superteam_academy::state::{Course, Enrollment};

#[test]
fn enroll_creates_enrollment_with_correct_fields() {
    let (mut svm, authority) = setup();
    initialize_config(&mut svm, &authority, 5000, 1000);

    let course_id = "enroll-test";
    let course_addr = create_test_course(&mut svm, &authority, course_id, 5, 100);

    let learner = Keypair::new();
    svm.airdrop(&learner.pubkey(), 5_000_000_000).unwrap();

    let enrollment_addr = enroll_learner(&mut svm, &learner, course_id);
    let enrollment: Enrollment = get_account_data(&svm, &enrollment_addr);

    assert_eq!(enrollment.course, course_addr);
    assert_eq!(enrollment.enrolled_version, 1);
    assert!(enrollment.enrolled_at > 0);
    assert_eq!(enrollment.completed_at, None);
    assert_eq!(enrollment.lesson_flags, [0u64; 4]);
    assert_eq!(enrollment.credential_asset, None);
    assert!(!enrollment.bonus_claimed);
    assert_eq!(enrollment._reserved, [0u8; 7]);
}

#[test]
fn enroll_increments_course_total_enrollments() {
    let (mut svm, authority) = setup();
    initialize_config(&mut svm, &authority, 5000, 1000);

    let course_id = "enroll-count";
    let course_addr = create_test_course(&mut svm, &authority, course_id, 5, 100);

    let learner1 = Keypair::new();
    let learner2 = Keypair::new();
    svm.airdrop(&learner1.pubkey(), 5_000_000_000).unwrap();
    svm.airdrop(&learner2.pubkey(), 5_000_000_000).unwrap();

    enroll_learner(&mut svm, &learner1, course_id);
    let course: Course = get_account_data(&svm, &course_addr);
    assert_eq!(course.total_enrollments, 1);

    enroll_learner(&mut svm, &learner2, course_id);
    let course: Course = get_account_data(&svm, &course_addr);
    assert_eq!(course.total_enrollments, 2);
}

#[test]
fn enroll_bump_stored_correctly() {
    let (mut svm, authority) = setup();
    initialize_config(&mut svm, &authority, 5000, 1000);

    let course_id = "bump-enroll";
    create_test_course(&mut svm, &authority, course_id, 5, 100);

    let learner = Keypair::new();
    svm.airdrop(&learner.pubkey(), 5_000_000_000).unwrap();

    let enrollment_addr = enroll_learner(&mut svm, &learner, course_id);
    let enrollment: Enrollment = get_account_data(&svm, &enrollment_addr);

    let (expected_addr, expected_bump) = enrollment_pda(course_id, &learner.pubkey());
    assert_eq!(enrollment_addr, expected_addr);
    assert_eq!(enrollment.bump, expected_bump);
}

#[test]
fn enroll_inactive_course_fails() {
    let (mut svm, authority) = setup();
    initialize_config(&mut svm, &authority, 5000, 1000);

    let course_id = "inactive-enroll";
    let course_addr = create_test_course(&mut svm, &authority, course_id, 5, 100);

    // Deactivate the course
    let params = superteam_academy::instructions::UpdateCourseParams {
        new_content_tx_id: None,
        new_is_active: Some(false),
        new_authority: None,
        new_xp_per_lesson: None,
        new_completion_bonus_xp: None,
        new_creator_reward_xp: None,
        new_min_completions_for_reward: None,
    };

    let data = superteam_academy::instruction::UpdateCourse { params };
    let accounts = superteam_academy::accounts::UpdateCourse {
        course: course_addr,
        authority: authority.pubkey(),
    };

    let ix = Instruction {
        program_id: PROGRAM_ID,
        accounts: accounts.to_account_metas(None),
        data: data.data(),
    };

    let tx = Transaction::new_signed_with_payer(
        &[ix],
        Some(&authority.pubkey()),
        &[&authority],
        svm.latest_blockhash(),
    );
    svm.send_transaction(tx).expect("update failed");

    // Now try to enroll
    let learner = Keypair::new();
    svm.airdrop(&learner.pubkey(), 5_000_000_000).unwrap();

    let (enrollment_addr, _) = enrollment_pda(course_id, &learner.pubkey());
    let enroll_data = superteam_academy::instruction::Enroll {
        course_id: course_id.to_string(),
    };

    let enroll_accounts = superteam_academy::accounts::Enroll {
        course: course_addr,
        enrollment: enrollment_addr,
        learner: learner.pubkey(),
        system_program: system_program::id(),
    };

    let enroll_ix = Instruction {
        program_id: PROGRAM_ID,
        accounts: enroll_accounts.to_account_metas(None),
        data: enroll_data.data(),
    };

    let enroll_tx = Transaction::new_signed_with_payer(
        &[enroll_ix],
        Some(&learner.pubkey()),
        &[&learner],
        svm.latest_blockhash(),
    );

    let result = svm.send_transaction(enroll_tx);
    assert!(result.is_err(), "Enrolling in inactive course should fail");
}

#[test]
fn complete_lesson_sets_bitmap_bit() {
    let (mut svm, authority) = setup();
    let (_, xp_mint_kp) = initialize_config(&mut svm, &authority, 5000, 1000);
    let xp_mint = xp_mint_kp.pubkey();

    let course_id = "bitmap-test";
    create_test_course(&mut svm, &authority, course_id, 5, 100);

    let learner = Keypair::new();
    svm.airdrop(&learner.pubkey(), 5_000_000_000).unwrap();
    init_learner_profile(&mut svm, &learner);

    enroll_learner(&mut svm, &learner, course_id);

    let learner_ata = create_token_2022_ata(&mut svm, &learner, &xp_mint, &learner.pubkey());

    // Complete lesson 0
    complete_lesson(
        &mut svm,
        &authority, // authority is backend_signer after initialize
        &learner,
        course_id,
        0,
        &xp_mint,
        &learner_ata,
    );

    let (enrollment_addr, _) = enrollment_pda(course_id, &learner.pubkey());
    let enrollment: Enrollment = get_account_data(&svm, &enrollment_addr);

    // Bit 0 should be set
    assert_eq!(enrollment.lesson_flags[0] & 1, 1);
    // Other bits should be 0
    assert_eq!(enrollment.lesson_flags[0] & !1u64, 0);
}

#[test]
fn complete_lesson_mints_xp() {
    let (mut svm, authority) = setup();
    let (_, xp_mint_kp) = initialize_config(&mut svm, &authority, 5000, 1000);
    let xp_mint = xp_mint_kp.pubkey();

    let course_id = "xp-mint-test";
    let xp_per_lesson = 100u32;
    create_test_course(&mut svm, &authority, course_id, 5, xp_per_lesson);

    let learner = Keypair::new();
    svm.airdrop(&learner.pubkey(), 5_000_000_000).unwrap();
    init_learner_profile(&mut svm, &learner);
    enroll_learner(&mut svm, &learner, course_id);

    let learner_ata = create_token_2022_ata(&mut svm, &learner, &xp_mint, &learner.pubkey());

    assert_eq!(get_token_balance(&svm, &learner_ata), 0);

    complete_lesson(
        &mut svm, &authority, &learner, course_id, 0, &xp_mint, &learner_ata,
    );

    assert_eq!(get_token_balance(&svm, &learner_ata), xp_per_lesson as u64);

    complete_lesson(
        &mut svm, &authority, &learner, course_id, 1, &xp_mint, &learner_ata,
    );

    assert_eq!(get_token_balance(&svm, &learner_ata), (xp_per_lesson * 2) as u64);
}

#[test]
fn complete_lesson_duplicate_fails() {
    let (mut svm, authority) = setup();
    let (_, xp_mint_kp) = initialize_config(&mut svm, &authority, 5000, 1000);
    let xp_mint = xp_mint_kp.pubkey();

    let course_id = "dup-lesson";
    create_test_course(&mut svm, &authority, course_id, 5, 100);

    let learner = Keypair::new();
    svm.airdrop(&learner.pubkey(), 5_000_000_000).unwrap();
    init_learner_profile(&mut svm, &learner);
    enroll_learner(&mut svm, &learner, course_id);

    let learner_ata = create_token_2022_ata(&mut svm, &learner, &xp_mint, &learner.pubkey());

    // Complete lesson 2 once
    complete_lesson(
        &mut svm, &authority, &learner, course_id, 2, &xp_mint, &learner_ata,
    );

    // Try again -- should fail
    let (config_addr, _) = config_pda();
    let (course_addr, _) = course_pda(course_id);
    let (enrollment_addr, _) = enrollment_pda(course_id, &learner.pubkey());
    let (learner_profile_addr, _) = learner_pda(&learner.pubkey());

    let data = superteam_academy::instruction::CompleteLesson { lesson_index: 2 };
    let accounts = superteam_academy::accounts::CompleteLesson {
        config: config_addr,
        course: course_addr,
        enrollment: enrollment_addr,
        learner_profile: learner_profile_addr,
        learner: learner.pubkey(),
        learner_token_account: learner_ata,
        xp_mint,
        backend_signer: authority.pubkey(),
        token_program: spl_token_2022::id(),
    };

    let ix = Instruction {
        program_id: PROGRAM_ID,
        accounts: accounts.to_account_metas(None),
        data: data.data(),
    };

    let tx = Transaction::new_signed_with_payer(
        &[ix],
        Some(&authority.pubkey()),
        &[&authority],
        svm.latest_blockhash(),
    );

    let result = svm.send_transaction(tx);
    assert!(result.is_err(), "Duplicate lesson completion should fail");
}

#[test]
fn complete_lesson_out_of_bounds_fails() {
    let (mut svm, authority) = setup();
    let (_, xp_mint_kp) = initialize_config(&mut svm, &authority, 5000, 1000);
    let xp_mint = xp_mint_kp.pubkey();

    let course_id = "oob-lesson";
    let lesson_count = 5u8;
    create_test_course(&mut svm, &authority, course_id, lesson_count, 100);

    let learner = Keypair::new();
    svm.airdrop(&learner.pubkey(), 5_000_000_000).unwrap();
    init_learner_profile(&mut svm, &learner);
    enroll_learner(&mut svm, &learner, course_id);

    let learner_ata = create_token_2022_ata(&mut svm, &learner, &xp_mint, &learner.pubkey());

    // Try lesson_index = lesson_count (out of bounds)
    let (config_addr, _) = config_pda();
    let (course_addr, _) = course_pda(course_id);
    let (enrollment_addr, _) = enrollment_pda(course_id, &learner.pubkey());
    let (learner_profile_addr, _) = learner_pda(&learner.pubkey());

    let data = superteam_academy::instruction::CompleteLesson {
        lesson_index: lesson_count,
    };
    let accounts = superteam_academy::accounts::CompleteLesson {
        config: config_addr,
        course: course_addr,
        enrollment: enrollment_addr,
        learner_profile: learner_profile_addr,
        learner: learner.pubkey(),
        learner_token_account: learner_ata,
        xp_mint,
        backend_signer: authority.pubkey(),
        token_program: spl_token_2022::id(),
    };

    let ix = Instruction {
        program_id: PROGRAM_ID,
        accounts: accounts.to_account_metas(None),
        data: data.data(),
    };

    let tx = Transaction::new_signed_with_payer(
        &[ix],
        Some(&authority.pubkey()),
        &[&authority],
        svm.latest_blockhash(),
    );

    let result = svm.send_transaction(tx);
    assert!(
        result.is_err(),
        "Lesson index out of bounds should fail"
    );
}

#[test]
fn complete_lesson_wrong_backend_signer_fails() {
    let (mut svm, authority) = setup();
    let (_, xp_mint_kp) = initialize_config(&mut svm, &authority, 5000, 1000);
    let xp_mint = xp_mint_kp.pubkey();

    let course_id = "wrong-signer";
    create_test_course(&mut svm, &authority, course_id, 5, 100);

    let learner = Keypair::new();
    svm.airdrop(&learner.pubkey(), 5_000_000_000).unwrap();
    init_learner_profile(&mut svm, &learner);
    enroll_learner(&mut svm, &learner, course_id);

    let learner_ata = create_token_2022_ata(&mut svm, &learner, &xp_mint, &learner.pubkey());

    let fake_signer = Keypair::new();
    svm.airdrop(&fake_signer.pubkey(), 5_000_000_000).unwrap();

    let (config_addr, _) = config_pda();
    let (course_addr, _) = course_pda(course_id);
    let (enrollment_addr, _) = enrollment_pda(course_id, &learner.pubkey());
    let (learner_profile_addr, _) = learner_pda(&learner.pubkey());

    let data = superteam_academy::instruction::CompleteLesson { lesson_index: 0 };
    let accounts = superteam_academy::accounts::CompleteLesson {
        config: config_addr,
        course: course_addr,
        enrollment: enrollment_addr,
        learner_profile: learner_profile_addr,
        learner: learner.pubkey(),
        learner_token_account: learner_ata,
        xp_mint,
        backend_signer: fake_signer.pubkey(),
        token_program: spl_token_2022::id(),
    };

    let ix = Instruction {
        program_id: PROGRAM_ID,
        accounts: accounts.to_account_metas(None),
        data: data.data(),
    };

    let tx = Transaction::new_signed_with_payer(
        &[ix],
        Some(&fake_signer.pubkey()),
        &[&fake_signer],
        svm.latest_blockhash(),
    );

    let result = svm.send_transaction(tx);
    assert!(
        result.is_err(),
        "Wrong backend signer should fail"
    );
}

#[test]
fn complete_all_lessons_sets_all_bits() {
    let (mut svm, authority) = setup();
    let (_, xp_mint_kp) = initialize_config(&mut svm, &authority, 50000, 1000);
    let xp_mint = xp_mint_kp.pubkey();

    let course_id = "all-lessons";
    let lesson_count = 10u8;
    create_test_course(&mut svm, &authority, course_id, lesson_count, 100);

    let learner = Keypair::new();
    svm.airdrop(&learner.pubkey(), 5_000_000_000).unwrap();
    init_learner_profile(&mut svm, &learner);
    enroll_learner(&mut svm, &learner, course_id);

    let learner_ata = create_token_2022_ata(&mut svm, &learner, &xp_mint, &learner.pubkey());

    for i in 0..lesson_count {
        complete_lesson(
            &mut svm, &authority, &learner, course_id, i, &xp_mint, &learner_ata,
        );
    }

    let (enrollment_addr, _) = enrollment_pda(course_id, &learner.pubkey());
    let enrollment: Enrollment = get_account_data(&svm, &enrollment_addr);

    let completed: u32 = enrollment.lesson_flags.iter().map(|w| w.count_ones()).sum();
    assert_eq!(completed, lesson_count as u32);

    // Verify XP minted
    assert_eq!(
        get_token_balance(&svm, &learner_ata),
        (lesson_count as u64) * 100
    );
}
