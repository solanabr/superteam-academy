use crate::helpers::*;
use anchor_lang::{InstructionData, ToAccountMetas};
use solana_sdk::{
    instruction::Instruction,
    signature::{Keypair, Signer},
    system_program,
    transaction::Transaction,
};
use superteam_academy::state::LearnerProfile;

#[test]
fn init_learner_creates_profile_with_zeroed_fields() {
    let (mut svm, authority) = setup();
    let learner = Keypair::new();
    svm.airdrop(&learner.pubkey(), 5_000_000_000).unwrap();

    let profile_addr = init_learner_profile(&mut svm, &learner);
    let profile: LearnerProfile = get_account_data(&svm, &profile_addr);

    assert_eq!(profile.current_streak, 0);
    assert_eq!(profile.longest_streak, 0);
    assert_eq!(profile.last_activity_date, 0);
    assert_eq!(profile.streak_freezes, 0);
    assert_eq!(profile.achievement_flags, [0u64; 4]);
    assert_eq!(profile.xp_earned_today, 0);
    assert_eq!(profile.last_xp_day, 0);
    assert_eq!(profile.referral_count, 0);
    assert!(!profile.has_referrer);
    assert_eq!(profile._reserved, [0u8; 16]);
}

#[test]
fn init_learner_authority_matches_signer() {
    let (mut svm, authority) = setup();
    let learner = Keypair::new();
    svm.airdrop(&learner.pubkey(), 5_000_000_000).unwrap();

    let profile_addr = init_learner_profile(&mut svm, &learner);
    let profile: LearnerProfile = get_account_data(&svm, &profile_addr);

    assert_eq!(profile.authority, learner.pubkey());
}

#[test]
fn init_learner_bump_stored_correctly() {
    let (mut svm, authority) = setup();
    let learner = Keypair::new();
    svm.airdrop(&learner.pubkey(), 5_000_000_000).unwrap();

    let profile_addr = init_learner_profile(&mut svm, &learner);
    let profile: LearnerProfile = get_account_data(&svm, &profile_addr);

    let (expected_addr, expected_bump) = learner_pda(&learner.pubkey());
    assert_eq!(profile_addr, expected_addr);
    assert_eq!(profile.bump, expected_bump);
}

#[test]
fn init_learner_duplicate_fails() {
    let (mut svm, authority) = setup();
    let learner = Keypair::new();
    svm.airdrop(&learner.pubkey(), 5_000_000_000).unwrap();

    init_learner_profile(&mut svm, &learner);

    // Second init should fail
    let (profile_addr, _) = learner_pda(&learner.pubkey());

    let data = superteam_academy::instruction::InitLearner {};
    let accounts = superteam_academy::accounts::InitLearner {
        learner_profile: profile_addr,
        learner: learner.pubkey(),
        system_program: system_program::id(),
    };

    let ix = Instruction {
        program_id: PROGRAM_ID,
        accounts: accounts.to_account_metas(None),
        data: data.data(),
    };

    let tx = Transaction::new_signed_with_payer(
        &[ix],
        Some(&learner.pubkey()),
        &[&learner],
        svm.latest_blockhash(),
    );

    let result = svm.send_transaction(tx);
    assert!(
        result.is_err(),
        "Duplicate init_learner should fail but succeeded"
    );
}

#[test]
fn init_learner_different_users_get_different_pdas() {
    let (mut svm, authority) = setup();

    let learner1 = Keypair::new();
    let learner2 = Keypair::new();
    svm.airdrop(&learner1.pubkey(), 5_000_000_000).unwrap();
    svm.airdrop(&learner2.pubkey(), 5_000_000_000).unwrap();

    let addr1 = init_learner_profile(&mut svm, &learner1);
    let addr2 = init_learner_profile(&mut svm, &learner2);

    assert_ne!(addr1, addr2);

    let profile1: LearnerProfile = get_account_data(&svm, &addr1);
    let profile2: LearnerProfile = get_account_data(&svm, &addr2);

    assert_eq!(profile1.authority, learner1.pubkey());
    assert_eq!(profile2.authority, learner2.pubkey());
}

#[test]
fn init_learner_account_owned_by_program() {
    let (mut svm, authority) = setup();
    let learner = Keypair::new();
    svm.airdrop(&learner.pubkey(), 5_000_000_000).unwrap();

    let profile_addr = init_learner_profile(&mut svm, &learner);
    let account = svm.get_account(&profile_addr).expect("account not found");

    assert_eq!(account.owner, PROGRAM_ID);
}
