use crate::helpers::*;
use anchor_lang::{InstructionData, ToAccountMetas};
use solana_sdk::{
    instruction::Instruction,
    signature::{Keypair, Signer},
    system_program,
    transaction::Transaction,
};
use superteam_academy::state::Course;

#[test]
fn create_course_stores_all_fields() {
    let (mut svm, authority) = setup();
    initialize_config(&mut svm, &authority, 5000, 1000);

    let course_id = "rust-101";
    let course_addr = create_test_course_full(
        &mut svm,
        &authority,
        course_id,
        10,   // lesson_count
        100,  // xp_per_lesson
        2,    // difficulty
        5,    // track_id
        3,    // track_level
        None, // prerequisite
        200,  // completion_bonus_xp
        50,   // creator_reward_xp
        5,    // min_completions_for_reward
    );

    let course: Course = get_account_data(&svm, &course_addr);

    assert_eq!(course.course_id, "rust-101");
    assert_eq!(course.creator, authority.pubkey());
    assert_eq!(course.authority, authority.pubkey());
    assert_eq!(course.content_tx_id, [0u8; 32]);
    assert_eq!(course.version, 1);
    assert_eq!(course.lesson_count, 10);
    assert_eq!(course.difficulty, 2);
    assert_eq!(course.xp_per_lesson, 100);
    assert_eq!(course.track_id, 5);
    assert_eq!(course.track_level, 3);
    assert_eq!(course.prerequisite, None);
    assert_eq!(course.completion_bonus_xp, 200);
    assert_eq!(course.creator_reward_xp, 50);
    assert_eq!(course.min_completions_for_reward, 5);
    assert_eq!(course.total_completions, 0);
    assert_eq!(course.total_enrollments, 0);
    assert!(course.is_active);
    assert!(course.created_at > 0);
    assert_eq!(course.created_at, course.updated_at);
    assert_eq!(course._reserved, [0u8; 16]);
}

#[test]
fn create_course_bump_stored_correctly() {
    let (mut svm, authority) = setup();
    initialize_config(&mut svm, &authority, 5000, 1000);

    let course_id = "test-bump";
    let course_addr = create_test_course(&mut svm, &authority, course_id, 5, 100);
    let course: Course = get_account_data(&svm, &course_addr);

    let (expected_addr, expected_bump) = course_pda(course_id);
    assert_eq!(course_addr, expected_addr);
    assert_eq!(course.bump, expected_bump);
}

#[test]
fn create_course_empty_id_fails() {
    let (mut svm, authority) = setup();
    initialize_config(&mut svm, &authority, 5000, 1000);

    let (config_addr, _) = config_pda();
    let (course_addr, _) = course_pda("");

    let params = superteam_academy::instructions::CreateCourseParams {
        course_id: "".to_string(),
        creator: authority.pubkey(),
        content_tx_id: [0u8; 32],
        lesson_count: 5,
        difficulty: 1,
        xp_per_lesson: 100,
        track_id: 1,
        track_level: 1,
        prerequisite: None,
        completion_bonus_xp: 50,
        creator_reward_xp: 10,
        min_completions_for_reward: 1,
    };

    let data = superteam_academy::instruction::CreateCourse { params };
    let accounts = superteam_academy::accounts::CreateCourse {
        course: course_addr,
        config: config_addr,
        authority: authority.pubkey(),
        system_program: system_program::id(),
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
    assert!(result.is_err(), "Empty course_id should fail");
}

#[test]
fn create_course_difficulty_zero_fails() {
    let (mut svm, authority) = setup();
    initialize_config(&mut svm, &authority, 5000, 1000);

    let course_id = "diff-zero";
    let (config_addr, _) = config_pda();
    let (course_addr, _) = course_pda(course_id);

    let params = superteam_academy::instructions::CreateCourseParams {
        course_id: course_id.to_string(),
        creator: authority.pubkey(),
        content_tx_id: [0u8; 32],
        lesson_count: 5,
        difficulty: 0,
        xp_per_lesson: 100,
        track_id: 1,
        track_level: 1,
        prerequisite: None,
        completion_bonus_xp: 50,
        creator_reward_xp: 10,
        min_completions_for_reward: 1,
    };

    let data = superteam_academy::instruction::CreateCourse { params };
    let accounts = superteam_academy::accounts::CreateCourse {
        course: course_addr,
        config: config_addr,
        authority: authority.pubkey(),
        system_program: system_program::id(),
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
    assert!(result.is_err(), "difficulty=0 should fail");
}

#[test]
fn create_course_difficulty_four_fails() {
    let (mut svm, authority) = setup();
    initialize_config(&mut svm, &authority, 5000, 1000);

    let course_id = "diff-four";
    let (config_addr, _) = config_pda();
    let (course_addr, _) = course_pda(course_id);

    let params = superteam_academy::instructions::CreateCourseParams {
        course_id: course_id.to_string(),
        creator: authority.pubkey(),
        content_tx_id: [0u8; 32],
        lesson_count: 5,
        difficulty: 4,
        xp_per_lesson: 100,
        track_id: 1,
        track_level: 1,
        prerequisite: None,
        completion_bonus_xp: 50,
        creator_reward_xp: 10,
        min_completions_for_reward: 1,
    };

    let data = superteam_academy::instruction::CreateCourse { params };
    let accounts = superteam_academy::accounts::CreateCourse {
        course: course_addr,
        config: config_addr,
        authority: authority.pubkey(),
        system_program: system_program::id(),
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
    assert!(result.is_err(), "difficulty=4 should fail");
}

#[test]
fn create_course_lesson_count_zero_fails() {
    let (mut svm, authority) = setup();
    initialize_config(&mut svm, &authority, 5000, 1000);

    let course_id = "zero-lessons";
    let (config_addr, _) = config_pda();
    let (course_addr, _) = course_pda(course_id);

    let params = superteam_academy::instructions::CreateCourseParams {
        course_id: course_id.to_string(),
        creator: authority.pubkey(),
        content_tx_id: [0u8; 32],
        lesson_count: 0,
        difficulty: 1,
        xp_per_lesson: 100,
        track_id: 1,
        track_level: 1,
        prerequisite: None,
        completion_bonus_xp: 50,
        creator_reward_xp: 10,
        min_completions_for_reward: 1,
    };

    let data = superteam_academy::instruction::CreateCourse { params };
    let accounts = superteam_academy::accounts::CreateCourse {
        course: course_addr,
        config: config_addr,
        authority: authority.pubkey(),
        system_program: system_program::id(),
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
    assert!(result.is_err(), "lesson_count=0 should fail");
}

#[test]
fn update_course_increments_version_on_content_change() {
    let (mut svm, authority) = setup();
    initialize_config(&mut svm, &authority, 5000, 1000);

    let course_id = "ver-test";
    let course_addr = create_test_course(&mut svm, &authority, course_id, 5, 100);

    let course_before: Course = get_account_data(&svm, &course_addr);
    assert_eq!(course_before.version, 1);

    let params = superteam_academy::instructions::UpdateCourseParams {
        new_content_tx_id: Some([1u8; 32]),
        new_is_active: None,
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

    svm.send_transaction(tx).expect("update_course failed");

    let course_after: Course = get_account_data(&svm, &course_addr);
    assert_eq!(course_after.version, 2);
    assert_eq!(course_after.content_tx_id, [1u8; 32]);
}

#[test]
fn update_course_no_content_change_keeps_version() {
    let (mut svm, authority) = setup();
    initialize_config(&mut svm, &authority, 5000, 1000);

    let course_id = "no-ver-bump";
    let course_addr = create_test_course(&mut svm, &authority, course_id, 5, 100);

    let params = superteam_academy::instructions::UpdateCourseParams {
        new_content_tx_id: None,
        new_is_active: Some(false),
        new_authority: None,
        new_xp_per_lesson: Some(200),
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

    svm.send_transaction(tx).expect("update_course failed");

    let course: Course = get_account_data(&svm, &course_addr);
    assert_eq!(course.version, 1); // unchanged
    assert!(!course.is_active);
    assert_eq!(course.xp_per_lesson, 200);
}

#[test]
fn update_course_wrong_authority_fails() {
    let (mut svm, authority) = setup();
    initialize_config(&mut svm, &authority, 5000, 1000);

    let course_id = "auth-test";
    let course_addr = create_test_course(&mut svm, &authority, course_id, 5, 100);

    let imposter = Keypair::new();
    svm.airdrop(&imposter.pubkey(), 5_000_000_000).unwrap();

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
        authority: imposter.pubkey(),
    };

    let ix = Instruction {
        program_id: PROGRAM_ID,
        accounts: accounts.to_account_metas(None),
        data: data.data(),
    };

    let tx = Transaction::new_signed_with_payer(
        &[ix],
        Some(&imposter.pubkey()),
        &[&imposter],
        svm.latest_blockhash(),
    );

    let result = svm.send_transaction(tx);
    assert!(
        result.is_err(),
        "Update with wrong authority should fail"
    );
}

#[test]
fn create_course_account_owned_by_program() {
    let (mut svm, authority) = setup();
    initialize_config(&mut svm, &authority, 5000, 1000);

    let course_addr = create_test_course(&mut svm, &authority, "owner-check", 5, 100);
    let account = svm.get_account(&course_addr).expect("account not found");

    assert_eq!(account.owner, PROGRAM_ID);
}
