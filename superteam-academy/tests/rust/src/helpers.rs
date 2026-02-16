use anchor_lang::{AnchorDeserialize, InstructionData, ToAccountMetas};
use litesvm::LiteSvm;
use solana_sdk::{
    account::Account,
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
    signature::{Keypair, Signer},
    system_program,
    transaction::Transaction,
};
use superteam_academy::state::{Config, Course, Enrollment, LearnerProfile};

pub const PROGRAM_ID: Pubkey = superteam_academy::ID;

pub fn program_bytes() -> &'static [u8] {
    include_bytes!("../../../target/deploy/superteam_academy.so")
}

pub fn setup() -> (LiteSvm, Keypair) {
    let mut svm = LiteSvm::new();
    svm.add_program(PROGRAM_ID, program_bytes());
    let authority = Keypair::new();
    svm.airdrop(&authority.pubkey(), 10_000_000_000).unwrap();
    (svm, authority)
}

pub fn config_pda() -> (Pubkey, u8) {
    Pubkey::find_program_address(&[b"config"], &PROGRAM_ID)
}

pub fn learner_pda(learner: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[b"learner", learner.as_ref()], &PROGRAM_ID)
}

pub fn course_pda(course_id: &str) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[b"course", course_id.as_bytes()], &PROGRAM_ID)
}

pub fn enrollment_pda(course_id: &str, learner: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[b"enrollment", course_id.as_bytes(), learner.as_ref()],
        &PROGRAM_ID,
    )
}

/// Deserialize an Anchor account (skipping 8-byte discriminator) from LiteSVM.
pub fn get_account_data<T: AnchorDeserialize>(svm: &LiteSvm, address: &Pubkey) -> T {
    let account = svm.get_account(address).expect("account not found");
    T::deserialize(&mut &account.data[8..]).expect("failed to deserialize")
}

/// Initialize the Config PDA and XP mint. Returns (config_pda, xp_mint_keypair).
pub fn initialize_config(
    svm: &mut LiteSvm,
    authority: &Keypair,
    max_daily_xp: u32,
    max_achievement_xp: u32,
) -> (Pubkey, Keypair) {
    let (config_addr, _) = config_pda();
    let xp_mint = Keypair::new();

    let data = superteam_academy::instruction::Initialize {
        max_daily_xp,
        max_achievement_xp,
    };

    let accounts = superteam_academy::accounts::Initialize {
        config: config_addr,
        xp_mint: xp_mint.pubkey(),
        authority: authority.pubkey(),
        system_program: system_program::id(),
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
        &[authority, &xp_mint],
        svm.latest_blockhash(),
    );

    svm.send_transaction(tx).expect("initialize failed");
    (config_addr, xp_mint)
}

/// Initialize a LearnerProfile for the given keypair.
pub fn init_learner_profile(svm: &mut LiteSvm, learner: &Keypair) -> Pubkey {
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
        &[learner],
        svm.latest_blockhash(),
    );

    svm.send_transaction(tx).expect("init_learner failed");
    profile_addr
}

/// Create a course with sensible defaults. Returns the course PDA.
pub fn create_test_course(
    svm: &mut LiteSvm,
    authority: &Keypair,
    course_id: &str,
    lesson_count: u8,
    xp_per_lesson: u32,
) -> Pubkey {
    create_test_course_full(
        svm,
        authority,
        course_id,
        lesson_count,
        xp_per_lesson,
        1,    // difficulty
        1,    // track_id
        1,    // track_level
        None, // no prerequisite
        50,   // completion_bonus_xp
        10,   // creator_reward_xp
        1,    // min_completions_for_reward
    )
}

#[allow(clippy::too_many_arguments)]
pub fn create_test_course_full(
    svm: &mut LiteSvm,
    authority: &Keypair,
    course_id: &str,
    lesson_count: u8,
    xp_per_lesson: u32,
    difficulty: u8,
    track_id: u16,
    track_level: u8,
    prerequisite: Option<Pubkey>,
    completion_bonus_xp: u32,
    creator_reward_xp: u32,
    min_completions_for_reward: u16,
) -> Pubkey {
    let (config_addr, _) = config_pda();
    let (course_addr, _) = course_pda(course_id);

    let params = superteam_academy::instructions::CreateCourseParams {
        course_id: course_id.to_string(),
        creator: authority.pubkey(),
        content_tx_id: [0u8; 32],
        lesson_count,
        difficulty,
        xp_per_lesson,
        track_id,
        track_level,
        prerequisite,
        completion_bonus_xp,
        creator_reward_xp,
        min_completions_for_reward,
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
        &[authority],
        svm.latest_blockhash(),
    );

    svm.send_transaction(tx).expect("create_course failed");
    course_addr
}

/// Enroll a learner in a course. Returns the enrollment PDA.
pub fn enroll_learner(
    svm: &mut LiteSvm,
    learner: &Keypair,
    course_id: &str,
) -> Pubkey {
    enroll_learner_with_remaining(svm, learner, course_id, vec![])
}

/// Enroll with optional remaining accounts (for prerequisite verification).
pub fn enroll_learner_with_remaining(
    svm: &mut LiteSvm,
    learner: &Keypair,
    course_id: &str,
    remaining_accounts: Vec<AccountMeta>,
) -> Pubkey {
    let (course_addr, _) = course_pda(course_id);
    let (enrollment_addr, _) = enrollment_pda(course_id, &learner.pubkey());

    let data = superteam_academy::instruction::Enroll {
        course_id: course_id.to_string(),
    };

    let mut account_metas = superteam_academy::accounts::Enroll {
        course: course_addr,
        enrollment: enrollment_addr,
        learner: learner.pubkey(),
        system_program: system_program::id(),
    }
    .to_account_metas(None);

    account_metas.extend(remaining_accounts);

    let ix = Instruction {
        program_id: PROGRAM_ID,
        accounts: account_metas,
        data: data.data(),
    };

    let tx = Transaction::new_signed_with_payer(
        &[ix],
        Some(&learner.pubkey()),
        &[learner],
        svm.latest_blockhash(),
    );

    svm.send_transaction(tx).expect("enroll failed");
    enrollment_addr
}

/// Complete a single lesson. Requires backend_signer, XP mint, and learner token account.
pub fn complete_lesson(
    svm: &mut LiteSvm,
    backend_signer: &Keypair,
    learner: &Keypair,
    course_id: &str,
    lesson_index: u8,
    xp_mint: &Pubkey,
    learner_token_account: &Pubkey,
) {
    let (config_addr, _) = config_pda();
    let (course_addr, _) = course_pda(course_id);
    let (enrollment_addr, _) = enrollment_pda(course_id, &learner.pubkey());
    let (learner_profile_addr, _) = learner_pda(&learner.pubkey());

    let data = superteam_academy::instruction::CompleteLesson { lesson_index };

    let accounts = superteam_academy::accounts::CompleteLesson {
        config: config_addr,
        course: course_addr,
        enrollment: enrollment_addr,
        learner_profile: learner_profile_addr,
        learner: learner.pubkey(),
        learner_token_account: *learner_token_account,
        xp_mint: *xp_mint,
        backend_signer: backend_signer.pubkey(),
        token_program: spl_token_2022::id(),
    };

    let ix = Instruction {
        program_id: PROGRAM_ID,
        accounts: accounts.to_account_metas(None),
        data: data.data(),
    };

    let tx = Transaction::new_signed_with_payer(
        &[ix],
        Some(&backend_signer.pubkey()),
        &[backend_signer],
        svm.latest_blockhash(),
    );

    svm.send_transaction(tx).expect("complete_lesson failed");
}

/// Create an Associated Token Account for Token-2022.
/// Returns the ATA address.
pub fn create_token_2022_ata(
    svm: &mut LiteSvm,
    payer: &Keypair,
    mint: &Pubkey,
    owner: &Pubkey,
) -> Pubkey {
    let ata = spl_associated_token_account::get_associated_token_address_with_program_id(
        owner,
        mint,
        &spl_token_2022::id(),
    );

    let ix =
        spl_associated_token_account::instruction::create_associated_token_account(
            &payer.pubkey(),
            owner,
            mint,
            &spl_token_2022::id(),
        );

    let tx = Transaction::new_signed_with_payer(
        &[ix],
        Some(&payer.pubkey()),
        &[payer],
        svm.latest_blockhash(),
    );

    svm.send_transaction(tx)
        .expect("create ATA failed");
    ata
}

/// Read the token balance from a Token-2022 account.
pub fn get_token_balance(svm: &LiteSvm, token_account: &Pubkey) -> u64 {
    let account = svm.get_account(token_account).expect("token account not found");
    let token_account_data =
        spl_token_2022::state::Account::unpack(&account.data).expect("unpack failed");
    token_account_data.amount
}
