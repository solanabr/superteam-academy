//! Hand-written Trident instruction builders for the `onchain_academy` program.
//!
//! These mirror the structs that `trident fuzz add` generates from the Anchor
//! IDL (`target/idl/onchain_academy.json`). Each builder embeds the real 8-byte
//! Anchor discriminator and serializes its data with Borsh in declaration order,
//! so the bytes are identical to what the deployed program decodes. Only the
//! instructions exercised by `fuzz_0` are declared (the state-mutating core:
//! initialize, create_course, enroll, complete_lesson, finalize_course).
//!
//! Keep the discriminators / field order in sync with the IDL if the program
//! changes — regenerate with `trident fuzz add` (or re-derive from the IDL).

#![allow(dead_code)]

use trident_fuzz::fuzzing::*;

/// Token-2022 program id (`spl_token_2022::id()`), the CPI target for `mint_xp`.
pub const TOKEN_2022_PROGRAM_ID: Pubkey = pubkey!("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
/// System program id.
pub const SYSTEM_PROGRAM_ID: Pubkey = pubkey!("11111111111111111111111111111111");

/// `onchain_academy` program id (`declare_id!`), matched by `Trident.toml`.
pub fn program_id() -> Pubkey {
    pubkey!("7NeJaSRyb4Wxay3Tcd9bdpD7T3GWYUQSFyrhG8SgwE8V")
}

fn encode(discriminator: [u8; 8], data: &impl BorshSerialize, metas: Vec<AccountMeta>) -> Instruction {
    let mut buffer: Vec<u8> = Vec::with_capacity(8);
    buffer.extend_from_slice(&discriminator);
    data.serialize(&mut buffer).unwrap();
    Instruction::new_with_bytes(program_id(), &buffer, metas)
}

// ----------------------------------------------------------------------------
// initialize
// ----------------------------------------------------------------------------

/// Accounts for `initialize` (creates Config PDA + the Token-2022 XP mint via CPI
/// + the backend MinterRole PDA).
pub struct InitializeAccounts {
    pub config: Pubkey,
    pub xp_mint: Pubkey,
    pub authority: Pubkey,
    pub backend_minter_role: Pubkey,
}

pub fn initialize_ix(accounts: &InitializeAccounts) -> Instruction {
    let metas = vec![
        AccountMeta::new(accounts.config, false),
        AccountMeta::new(accounts.xp_mint, true),
        AccountMeta::new(accounts.authority, true),
        AccountMeta::new(accounts.backend_minter_role, false),
        AccountMeta::new_readonly(SYSTEM_PROGRAM_ID, false),
        AccountMeta::new_readonly(TOKEN_2022_PROGRAM_ID, false),
    ];
    // initialize takes no args.
    encode([175, 175, 109, 31, 13, 152, 155, 237], &(), metas)
}

// ----------------------------------------------------------------------------
// create_course
// ----------------------------------------------------------------------------

/// Borsh-identical to the program's `CreateCourseParams`.
#[derive(BorshSerialize, BorshDeserialize, Clone, Debug)]
pub struct CreateCourseParams {
    pub course_id: String,
    pub creator: Pubkey,
    pub content_tx_id: [u8; 32],
    pub lesson_count: u8,
    pub difficulty: u8,
    pub xp_per_lesson: u32,
    pub track_id: u16,
    pub track_level: u8,
    pub prerequisite: Option<Pubkey>,
    pub creator_reward_xp: u32,
    pub min_completions_for_reward: u16,
    pub collection: Option<Pubkey>,
}

pub struct CreateCourseAccounts {
    pub course: Pubkey,
    pub config: Pubkey,
    pub authority: Pubkey,
}

pub fn create_course_ix(
    accounts: &CreateCourseAccounts,
    params: &CreateCourseParams,
) -> Instruction {
    let metas = vec![
        AccountMeta::new(accounts.course, false),
        AccountMeta::new_readonly(accounts.config, false),
        AccountMeta::new(accounts.authority, true),
        AccountMeta::new_readonly(SYSTEM_PROGRAM_ID, false),
    ];
    encode([120, 121, 154, 164, 107, 180, 167, 241], params, metas)
}

// ----------------------------------------------------------------------------
// enroll
// ----------------------------------------------------------------------------

pub struct EnrollAccounts {
    pub course: Pubkey,
    pub enrollment: Pubkey,
    pub learner: Pubkey,
}

pub fn enroll_ix(accounts: &EnrollAccounts, course_id: &str) -> Instruction {
    let metas = vec![
        AccountMeta::new(accounts.course, false),
        AccountMeta::new(accounts.enrollment, false),
        AccountMeta::new(accounts.learner, true),
        AccountMeta::new_readonly(SYSTEM_PROGRAM_ID, false),
    ];
    encode([58, 12, 36, 3, 142, 28, 1, 43], &course_id.to_string(), metas)
}

// ----------------------------------------------------------------------------
// complete_lesson
// ----------------------------------------------------------------------------

pub struct CompleteLessonAccounts {
    pub config: Pubkey,
    pub course: Pubkey,
    pub enrollment: Pubkey,
    pub learner: Pubkey,
    pub learner_token_account: Pubkey,
    pub xp_mint: Pubkey,
    pub backend_signer: Pubkey,
}

pub fn complete_lesson_ix(accounts: &CompleteLessonAccounts, lesson_index: u8) -> Instruction {
    let metas = vec![
        AccountMeta::new_readonly(accounts.config, false),
        AccountMeta::new_readonly(accounts.course, false),
        AccountMeta::new(accounts.enrollment, false),
        AccountMeta::new_readonly(accounts.learner, false),
        AccountMeta::new(accounts.learner_token_account, false),
        AccountMeta::new(accounts.xp_mint, false),
        AccountMeta::new_readonly(accounts.backend_signer, true),
        AccountMeta::new_readonly(TOKEN_2022_PROGRAM_ID, false),
    ];
    encode([77, 217, 53, 132, 204, 150, 169, 58], &lesson_index, metas)
}

// ----------------------------------------------------------------------------
// finalize_course
// ----------------------------------------------------------------------------

pub struct FinalizeCourseAccounts {
    pub config: Pubkey,
    pub course: Pubkey,
    pub enrollment: Pubkey,
    pub learner: Pubkey,
    pub learner_token_account: Pubkey,
    pub creator_token_account: Pubkey,
    pub creator: Pubkey,
    pub xp_mint: Pubkey,
    pub backend_signer: Pubkey,
}

pub fn finalize_course_ix(accounts: &FinalizeCourseAccounts) -> Instruction {
    let metas = vec![
        AccountMeta::new_readonly(accounts.config, false),
        AccountMeta::new(accounts.course, false),
        AccountMeta::new(accounts.enrollment, false),
        AccountMeta::new_readonly(accounts.learner, false),
        AccountMeta::new(accounts.learner_token_account, false),
        AccountMeta::new(accounts.creator_token_account, false),
        AccountMeta::new_readonly(accounts.creator, false),
        AccountMeta::new(accounts.xp_mint, false),
        AccountMeta::new_readonly(accounts.backend_signer, true),
        AccountMeta::new_readonly(TOKEN_2022_PROGRAM_ID, false),
    ];
    // finalize_course takes no args.
    encode([68, 189, 122, 239, 39, 121, 16, 218], &(), metas)
}

// ----------------------------------------------------------------------------
// On-chain account layouts (for deserialization / invariant checks)
// ----------------------------------------------------------------------------

/// Borsh body of the `Enrollment` account (after the 8-byte discriminator).
#[derive(BorshDeserialize, Debug, Clone)]
pub struct EnrollmentAccount {
    pub course: Pubkey,
    pub enrolled_at: i64,
    pub completed_at: Option<i64>,
    pub lesson_flags: [u64; 4],
    pub credential_asset: Option<Pubkey>,
    pub _reserved: [u8; 4],
    pub bump: u8,
}

/// Borsh body of the `Course` account (after the 8-byte discriminator).
#[derive(BorshDeserialize, Debug, Clone)]
pub struct CourseAccount {
    pub course_id: String,
    pub creator: Pubkey,
    pub content_tx_id: [u8; 32],
    pub version: u16,
    pub lesson_count: u8,
    pub difficulty: u8,
    pub xp_per_lesson: u32,
    pub track_id: u16,
    pub track_level: u8,
    pub prerequisite: Option<Pubkey>,
    pub creator_reward_xp: u32,
    pub min_completions_for_reward: u16,
    pub total_completions: u32,
    pub total_enrollments: u32,
    pub is_active: bool,
    pub created_at: i64,
    pub updated_at: i64,
    pub collection: Pubkey,
    pub _reserved: [u8; 8],
    pub bump: u8,
}
