use crate::helpers::*;
use anchor_lang::{InstructionData, ToAccountMetas};
use solana_sdk::{
    instruction::Instruction,
    signature::{Keypair, Signer},
    transaction::Transaction,
};
use superteam_academy::state::{Course, Enrollment};

/// Helper: set up a fully enrolled learner with all lessons completed and ready to finalize.
fn setup_completed_course(
    xp_per_lesson: u32,
    lesson_count: u8,
    max_daily_xp: u32,
) -> (LiteSvm, Keypair, Keypair, String, solana_sdk::pubkey::Pubkey) {
    let (mut svm, authority) = setup();
    let (_, xp_mint_kp) = initialize_config(&mut svm, &authority, max_daily_xp, 1000);
    let xp_mint = xp_mint_kp.pubkey();

    let course_id = "complete-test";
    create_test_course(&mut svm, &authority, course_id, lesson_count, xp_per_lesson);

    let learner = Keypair::new();
    svm.airdrop(&learner.pubkey(), 5_000_000_000).unwrap();
    init_learner_profile(&mut svm, &learner);
    enroll_learner(&mut svm, &learner, course_id);

    let learner_ata = create_token_2022_ata(&mut svm, &learner, &xp_mint, &learner.pubkey());

    for i in 0..lesson_count {
        complete_lesson(
            &mut svm,
            &authority,
            &learner,
            course_id,
            i,
            &xp_mint,
            &learner_ata,
        );
    }

    (svm, authority, learner, course_id.to_string(), xp_mint)
}

fn send_finalize(
    svm: &mut LiteSvm,
    authority: &Keypair,
    learner: &Keypair,
    course_id: &str,
    xp_mint: &solana_sdk::pubkey::Pubkey,
) -> Result<litesvm::types::TransactionMetadata, litesvm::types::FailedTransactionMetadata> {
    let (config_addr, _) = config_pda();
    let (course_addr, _) = course_pda(course_id);
    let (enrollment_addr, _) = enrollment_pda(course_id, &learner.pubkey());
    let (learner_profile_addr, _) = learner_pda(&learner.pubkey());

    // Creator token account (authority is the creator per create_test_course)
    let creator_ata = spl_associated_token_account::get_associated_token_address_with_program_id(
        &authority.pubkey(),
        xp_mint,
        &spl_token_2022::id(),
    );
    // Ensure creator ATA exists
    if svm.get_account(&creator_ata).is_none() {
        create_token_2022_ata(svm, authority, xp_mint, &authority.pubkey());
    }

    let data = superteam_academy::instruction::FinalizeCourse {};
    let accounts = superteam_academy::accounts::FinalizeCourse {
        config: config_addr,
        course: course_addr,
        enrollment: enrollment_addr,
        learner_profile: learner_profile_addr,
        learner: learner.pubkey(),
        creator_token_account: creator_ata,
        creator: authority.pubkey(),
        xp_mint: *xp_mint,
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
        &[authority],
        svm.latest_blockhash(),
    );

    svm.send_transaction(tx)
}

use litesvm::LiteSvm;

#[test]
fn finalize_course_all_lessons_complete_succeeds() {
    let (mut svm, authority, learner, course_id, xp_mint) =
        setup_completed_course(100, 3, 50000);

    let result = send_finalize(&mut svm, &authority, &learner, &course_id, &xp_mint);
    assert!(result.is_ok(), "finalize should succeed: {:?}", result.err());

    let (enrollment_addr, _) = enrollment_pda(&course_id, &learner.pubkey());
    let enrollment: Enrollment = get_account_data(&svm, &enrollment_addr);
    assert!(enrollment.completed_at.is_some());
}

#[test]
fn finalize_course_sets_completed_at() {
    let (mut svm, authority, learner, course_id, xp_mint) =
        setup_completed_course(100, 3, 50000);

    send_finalize(&mut svm, &authority, &learner, &course_id, &xp_mint).unwrap();

    let (enrollment_addr, _) = enrollment_pda(&course_id, &learner.pubkey());
    let enrollment: Enrollment = get_account_data(&svm, &enrollment_addr);

    let completed_at = enrollment.completed_at.unwrap();
    assert!(completed_at > 0);
}

#[test]
fn finalize_course_increments_total_completions() {
    let (mut svm, authority, learner, course_id, xp_mint) =
        setup_completed_course(100, 3, 50000);

    let (course_addr, _) = course_pda(&course_id);
    let course_before: Course = get_account_data(&svm, &course_addr);
    assert_eq!(course_before.total_completions, 0);

    send_finalize(&mut svm, &authority, &learner, &course_id, &xp_mint).unwrap();

    let course_after: Course = get_account_data(&svm, &course_addr);
    assert_eq!(course_after.total_completions, 1);
}

#[test]
fn finalize_course_incomplete_bitmap_fails() {
    let (mut svm, authority) = setup();
    let (_, xp_mint_kp) = initialize_config(&mut svm, &authority, 50000, 1000);
    let xp_mint = xp_mint_kp.pubkey();

    let course_id = "incomplete";
    create_test_course(&mut svm, &authority, course_id, 5, 100);

    let learner = Keypair::new();
    svm.airdrop(&learner.pubkey(), 5_000_000_000).unwrap();
    init_learner_profile(&mut svm, &learner);
    enroll_learner(&mut svm, &learner, course_id);

    let learner_ata = create_token_2022_ata(&mut svm, &learner, &xp_mint, &learner.pubkey());

    // Complete only 3 of 5 lessons
    for i in 0..3u8 {
        complete_lesson(
            &mut svm, &authority, &learner, course_id, i, &xp_mint, &learner_ata,
        );
    }

    let result = send_finalize(&mut svm, &authority, &learner, course_id, &xp_mint);
    assert!(
        result.is_err(),
        "Finalize with incomplete lessons should fail"
    );
}

#[test]
fn finalize_course_double_finalize_fails() {
    let (mut svm, authority, learner, course_id, xp_mint) =
        setup_completed_course(100, 3, 50000);

    send_finalize(&mut svm, &authority, &learner, &course_id, &xp_mint).unwrap();

    let result = send_finalize(&mut svm, &authority, &learner, &course_id, &xp_mint);
    assert!(
        result.is_err(),
        "Double finalize should fail"
    );
}

// ---------- claim_completion_bonus tests ----------

fn send_claim_bonus(
    svm: &mut LiteSvm,
    learner: &Keypair,
    course_id: &str,
    xp_mint: &solana_sdk::pubkey::Pubkey,
) -> Result<litesvm::types::TransactionMetadata, litesvm::types::FailedTransactionMetadata> {
    let (config_addr, _) = config_pda();
    let (course_addr, _) = course_pda(course_id);
    let (enrollment_addr, _) = enrollment_pda(course_id, &learner.pubkey());
    let (learner_profile_addr, _) = learner_pda(&learner.pubkey());

    let learner_ata = spl_associated_token_account::get_associated_token_address_with_program_id(
        &learner.pubkey(),
        xp_mint,
        &spl_token_2022::id(),
    );

    let data = superteam_academy::instruction::ClaimCompletionBonus {};
    let accounts = superteam_academy::accounts::ClaimCompletionBonus {
        config: config_addr,
        course: course_addr,
        enrollment: enrollment_addr,
        learner_profile: learner_profile_addr,
        learner: learner.pubkey(),
        learner_token_account: learner_ata,
        xp_mint: *xp_mint,
        token_program: spl_token_2022::id(),
    };

    let ix = Instruction {
        program_id: PROGRAM_ID,
        accounts: accounts.to_account_metas(None),
        data: data.data(),
    };

    let tx = Transaction::new_signed_with_payer(
        &[ix],
        Some(&learner.pubkey()),
        &[learner],
        svm.latest_blockhash(),
    );

    svm.send_transaction(tx)
}

#[test]
fn claim_bonus_succeeds_after_finalize() {
    let (mut svm, authority, learner, course_id, xp_mint) =
        setup_completed_course(100, 3, 50000);

    send_finalize(&mut svm, &authority, &learner, &course_id, &xp_mint).unwrap();

    let result = send_claim_bonus(&mut svm, &learner, &course_id, &xp_mint);
    assert!(result.is_ok(), "claim_bonus should succeed: {:?}", result.err());

    let (enrollment_addr, _) = enrollment_pda(&course_id, &learner.pubkey());
    let enrollment: Enrollment = get_account_data(&svm, &enrollment_addr);
    assert!(enrollment.bonus_claimed);
}

#[test]
fn claim_bonus_fails_before_finalize() {
    let (mut svm, authority) = setup();
    let (_, xp_mint_kp) = initialize_config(&mut svm, &authority, 50000, 1000);
    let xp_mint = xp_mint_kp.pubkey();

    let course_id = "no-finalize";
    create_test_course(&mut svm, &authority, course_id, 3, 100);

    let learner = Keypair::new();
    svm.airdrop(&learner.pubkey(), 5_000_000_000).unwrap();
    init_learner_profile(&mut svm, &learner);
    enroll_learner(&mut svm, &learner, course_id);
    create_token_2022_ata(&mut svm, &learner, &xp_mint, &learner.pubkey());

    // Complete all lessons but don't finalize
    for i in 0..3u8 {
        complete_lesson(
            &mut svm, &authority, &learner, course_id, i, &xp_mint,
            &spl_associated_token_account::get_associated_token_address_with_program_id(
                &learner.pubkey(),
                &xp_mint,
                &spl_token_2022::id(),
            ),
        );
    }

    let result = send_claim_bonus(&mut svm, &learner, course_id, &xp_mint);
    assert!(
        result.is_err(),
        "Claiming bonus before finalize should fail"
    );
}

#[test]
fn claim_bonus_fails_on_second_attempt() {
    let (mut svm, authority, learner, course_id, xp_mint) =
        setup_completed_course(100, 3, 50000);

    send_finalize(&mut svm, &authority, &learner, &course_id, &xp_mint).unwrap();
    send_claim_bonus(&mut svm, &learner, &course_id, &xp_mint).unwrap();

    let result = send_claim_bonus(&mut svm, &learner, &course_id, &xp_mint);
    assert!(
        result.is_err(),
        "Second claim_bonus should fail"
    );
}

// ---------- close_enrollment tests ----------

fn send_close_enrollment(
    svm: &mut LiteSvm,
    learner: &Keypair,
    course_id: &str,
) -> Result<litesvm::types::TransactionMetadata, litesvm::types::FailedTransactionMetadata> {
    let (enrollment_addr, _) = enrollment_pda(course_id, &learner.pubkey());

    let data = superteam_academy::instruction::CloseEnrollment {};
    let accounts = superteam_academy::accounts::CloseEnrollment {
        enrollment: enrollment_addr,
        learner: learner.pubkey(),
    };

    let ix = Instruction {
        program_id: PROGRAM_ID,
        accounts: accounts.to_account_metas(None),
        data: data.data(),
    };

    let tx = Transaction::new_signed_with_payer(
        &[ix],
        Some(&learner.pubkey()),
        &[learner],
        svm.latest_blockhash(),
    );

    svm.send_transaction(tx)
}

#[test]
fn close_enrollment_completed_course_succeeds() {
    let (mut svm, authority, learner, course_id, xp_mint) =
        setup_completed_course(100, 3, 50000);

    send_finalize(&mut svm, &authority, &learner, &course_id, &xp_mint).unwrap();

    let (enrollment_addr, _) = enrollment_pda(&course_id, &learner.pubkey());
    // Verify enrollment exists before close
    assert!(svm.get_account(&enrollment_addr).is_some());

    let result = send_close_enrollment(&mut svm, &learner, &course_id);
    assert!(
        result.is_ok(),
        "Close on completed enrollment should succeed: {:?}",
        result.err()
    );

    // Account should be closed (zeroed or gone)
    let account = svm.get_account(&enrollment_addr);
    match account {
        None => {} // closed completely
        Some(acc) => {
            // lamports returned, data zeroed
            assert_eq!(acc.lamports, 0);
        }
    }
}

#[test]
fn close_enrollment_incomplete_before_cooldown_fails() {
    let (mut svm, authority) = setup();
    let (_, xp_mint_kp) = initialize_config(&mut svm, &authority, 50000, 1000);

    let course_id = "early-close";
    create_test_course(&mut svm, &authority, course_id, 5, 100);

    let learner = Keypair::new();
    svm.airdrop(&learner.pubkey(), 5_000_000_000).unwrap();
    enroll_learner(&mut svm, &learner, course_id);

    // Try to close immediately (before 24h cooldown)
    let result = send_close_enrollment(&mut svm, &learner, course_id);
    assert!(
        result.is_err(),
        "Close before 24h cooldown should fail"
    );
}

#[test]
fn claim_bonus_mints_correct_xp_amount() {
    let (mut svm, authority, learner, course_id, xp_mint) =
        setup_completed_course(100, 3, 50000);

    send_finalize(&mut svm, &authority, &learner, &course_id, &xp_mint).unwrap();

    let learner_ata = spl_associated_token_account::get_associated_token_address_with_program_id(
        &learner.pubkey(),
        &xp_mint,
        &spl_token_2022::id(),
    );

    let balance_before = get_token_balance(&svm, &learner_ata);

    send_claim_bonus(&mut svm, &learner, &course_id, &xp_mint).unwrap();

    let balance_after = get_token_balance(&svm, &learner_ata);
    // Default completion_bonus_xp from create_test_course is 50
    assert_eq!(balance_after - balance_before, 50);
}
