//! Hand-rolled instruction builders for all 18 program instructions
//! (Anchor discriminators + Borsh args, account orders copied from the
//! Anchor `#[derive(Accounts)]` structs), plus the ATA / mpl-core helpers
//! the scenarios need. Deliberately independent from both program crates.

use solana_sdk::instruction::{AccountMeta, Instruction};
use solana_sdk::pubkey::Pubkey;
use std::str::FromStr;

pub const PROGRAM_ID: &str = "7NeJaSRyb4Wxay3Tcd9bdpD7T3GWYUQSFyrhG8SgwE8V";
pub const TOKEN_2022_ID: &str = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
pub const ATA_PROGRAM_ID: &str = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
pub const MPL_CORE_ID: &str = "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d";

pub fn program_id() -> Pubkey {
    Pubkey::from_str(PROGRAM_ID).unwrap()
}
pub fn token_2022_id() -> Pubkey {
    Pubkey::from_str(TOKEN_2022_ID).unwrap()
}
pub fn ata_program_id() -> Pubkey {
    Pubkey::from_str(ATA_PROGRAM_ID).unwrap()
}
pub fn mpl_core_id() -> Pubkey {
    Pubkey::from_str(MPL_CORE_ID).unwrap()
}
/// The system program id is the all-zero pubkey.
pub fn system_program_id() -> Pubkey {
    Pubkey::default()
}

/// System `CreateAccount` (solana-sdk 3 dropped the helper module).
pub fn system_create_account(
    from: &Pubkey,
    to: &Pubkey,
    lamports: u64,
    space: u64,
    owner: &Pubkey,
) -> Instruction {
    let mut data = vec![0u8; 4]; // discriminator 0 (u32 LE)
    data.extend_from_slice(&lamports.to_le_bytes());
    data.extend_from_slice(&space.to_le_bytes());
    data.extend_from_slice(owner.as_ref());
    Instruction {
        program_id: system_program_id(),
        accounts: vec![AccountMeta::new(*from, true), AccountMeta::new(*to, true)],
        data,
    }
}

// ---- PDAs ------------------------------------------------------------------

pub fn config_pda() -> Pubkey {
    Pubkey::find_program_address(&[b"config"], &program_id()).0
}
pub fn course_pda(course_id: &str) -> Pubkey {
    Pubkey::find_program_address(&[b"course", course_id.as_bytes()], &program_id()).0
}
pub fn enrollment_pda(course_id: &str, learner: &Pubkey) -> Pubkey {
    Pubkey::find_program_address(
        &[b"enrollment", course_id.as_bytes(), learner.as_ref()],
        &program_id(),
    )
    .0
}
pub fn minter_pda(minter: &Pubkey) -> Pubkey {
    Pubkey::find_program_address(&[b"minter", minter.as_ref()], &program_id()).0
}
pub fn achievement_pda(achievement_id: &str) -> Pubkey {
    Pubkey::find_program_address(&[b"achievement", achievement_id.as_bytes()], &program_id()).0
}
pub fn receipt_pda(achievement_id: &str, recipient: &Pubkey) -> Pubkey {
    Pubkey::find_program_address(
        &[
            b"achievement_receipt",
            achievement_id.as_bytes(),
            recipient.as_ref(),
        ],
        &program_id(),
    )
    .0
}
pub fn ata(owner: &Pubkey, mint: &Pubkey) -> Pubkey {
    Pubkey::find_program_address(
        &[owner.as_ref(), token_2022_id().as_ref(), mint.as_ref()],
        &ata_program_id(),
    )
    .0
}

// ---- Borsh arg writer --------------------------------------------------------

#[derive(Default)]
pub struct Args(Vec<u8>);

impl Args {
    pub fn new(discriminator: [u8; 8]) -> Self {
        Self(discriminator.to_vec())
    }
    pub fn u8(mut self, v: u8) -> Self {
        self.0.push(v);
        self
    }
    pub fn u16(mut self, v: u16) -> Self {
        self.0.extend_from_slice(&v.to_le_bytes());
        self
    }
    pub fn u32(mut self, v: u32) -> Self {
        self.0.extend_from_slice(&v.to_le_bytes());
        self
    }
    pub fn u64(mut self, v: u64) -> Self {
        self.0.extend_from_slice(&v.to_le_bytes());
        self
    }
    pub fn key(mut self, v: &Pubkey) -> Self {
        self.0.extend_from_slice(v.as_ref());
        self
    }
    pub fn bytes32(mut self, v: &[u8; 32]) -> Self {
        self.0.extend_from_slice(v);
        self
    }
    pub fn string(mut self, v: &str) -> Self {
        self.0.extend_from_slice(&(v.len() as u32).to_le_bytes());
        self.0.extend_from_slice(v.as_bytes());
        self
    }
    pub fn opt<T, F: FnOnce(Self, T) -> Self>(mut self, v: Option<T>, f: F) -> Self {
        match v {
            None => {
                self.0.push(0);
                self
            }
            Some(x) => {
                self.0.push(1);
                f(self, x)
            }
        }
    }
    pub fn build(self) -> Vec<u8> {
        self.0
    }
}

const IX_INITIALIZE: [u8; 8] = [175, 175, 109, 31, 13, 152, 155, 237];
const IX_UPDATE_CONFIG: [u8; 8] = [29, 158, 252, 191, 10, 83, 219, 99];
const IX_CREATE_COURSE: [u8; 8] = [120, 121, 154, 164, 107, 180, 167, 241];
const IX_UPDATE_COURSE: [u8; 8] = [81, 217, 18, 192, 129, 233, 129, 231];
const IX_CLOSE_COURSE: [u8; 8] = [157, 252, 239, 166, 213, 174, 160, 34];
const IX_ENROLL: [u8; 8] = [58, 12, 36, 3, 142, 28, 1, 43];
const IX_COMPLETE_LESSON: [u8; 8] = [77, 217, 53, 132, 204, 150, 169, 58];
const IX_FINALIZE_COURSE: [u8; 8] = [68, 189, 122, 239, 39, 121, 16, 218];
const IX_CLOSE_ENROLLMENT: [u8; 8] = [236, 137, 133, 253, 91, 138, 217, 91];
const IX_ISSUE_CREDENTIAL: [u8; 8] = [255, 193, 171, 224, 68, 171, 194, 87];
const IX_UPGRADE_CREDENTIAL: [u8; 8] = [2, 121, 77, 255, 103, 187, 252, 169];
const IX_REGISTER_MINTER: [u8; 8] = [58, 224, 74, 142, 170, 95, 116, 191];
const IX_REVOKE_MINTER: [u8; 8] = [33, 91, 131, 167, 62, 37, 38, 105];
const IX_UPDATE_MINTER: [u8; 8] = [164, 129, 164, 88, 75, 29, 91, 38];
const IX_REWARD_XP: [u8; 8] = [144, 187, 117, 238, 89, 118, 224, 145];
const IX_CREATE_ACHIEVEMENT_TYPE: [u8; 8] = [231, 38, 39, 228, 103, 4, 229, 19];
const IX_AWARD_ACHIEVEMENT: [u8; 8] = [75, 47, 156, 253, 124, 231, 84, 12];
const IX_DEACTIVATE_ACHIEVEMENT_TYPE: [u8; 8] = [185, 21, 222, 243, 192, 118, 71, 191];

// ---- Program instructions ------------------------------------------------------

pub fn initialize(xp_mint: &Pubkey, authority: &Pubkey) -> Instruction {
    Instruction {
        program_id: program_id(),
        accounts: vec![
            AccountMeta::new(config_pda(), false),
            AccountMeta::new(*xp_mint, true),
            AccountMeta::new(*authority, true),
            AccountMeta::new(minter_pda(authority), false),
            AccountMeta::new_readonly(system_program_id(), false),
            AccountMeta::new_readonly(token_2022_id(), false),
        ],
        data: Args::new(IX_INITIALIZE).build(),
    }
}

pub fn update_config(
    authority: &Pubkey,
    new_backend_signer: Option<Pubkey>,
    paused: Option<bool>,
    new_authority: Option<Pubkey>,
    old_minter_role: Option<Pubkey>,
) -> Instruction {
    let mut accounts = vec![
        AccountMeta::new(config_pda(), false),
        AccountMeta::new_readonly(*authority, true),
    ];
    if let Some(old_role) = old_minter_role {
        accounts.push(AccountMeta::new(old_role, false));
    }
    Instruction {
        program_id: program_id(),
        accounts,
        data: Args::new(IX_UPDATE_CONFIG)
            .opt(new_backend_signer, |a, k| a.key(&k))
            .opt(paused, |a, p| a.u8(p as u8))
            .opt(new_authority, |a, k| a.key(&k))
            .build(),
    }
}

pub struct CourseParams<'a> {
    pub course_id: &'a str,
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

impl<'a> CourseParams<'a> {
    pub fn simple(course_id: &'a str, creator: Pubkey, lesson_count: u8) -> Self {
        Self {
            course_id,
            creator,
            content_tx_id: [7; 32],
            lesson_count,
            difficulty: 2,
            xp_per_lesson: 50,
            track_id: 1,
            track_level: 1,
            prerequisite: None,
            creator_reward_xp: 0,
            min_completions_for_reward: 0,
            collection: None,
        }
    }
}

pub fn create_course(authority: &Pubkey, p: &CourseParams) -> Instruction {
    Instruction {
        program_id: program_id(),
        accounts: vec![
            AccountMeta::new(course_pda(p.course_id), false),
            // config is writable: create_course advances Config.course_nonce.
            AccountMeta::new(config_pda(), false),
            AccountMeta::new(*authority, true),
            AccountMeta::new_readonly(system_program_id(), false),
        ],
        data: Args::new(IX_CREATE_COURSE)
            .string(p.course_id)
            .key(&p.creator)
            .bytes32(&p.content_tx_id)
            .u8(p.lesson_count)
            .u8(p.difficulty)
            .u32(p.xp_per_lesson)
            .u16(p.track_id)
            .u8(p.track_level)
            .opt(p.prerequisite, |a, k| a.key(&k))
            .u32(p.creator_reward_xp)
            .u16(p.min_completions_for_reward)
            .opt(p.collection, |a, k| a.key(&k))
            .build(),
    }
}

#[allow(clippy::too_many_arguments)]
pub fn update_course(
    authority: &Pubkey,
    course_id: &str,
    new_content_tx_id: Option<[u8; 32]>,
    new_is_active: Option<bool>,
    new_xp_per_lesson: Option<u32>,
    new_creator_reward_xp: Option<u32>,
    new_min_completions_for_reward: Option<u16>,
    new_collection: Option<Pubkey>,
) -> Instruction {
    Instruction {
        program_id: program_id(),
        accounts: vec![
            AccountMeta::new_readonly(config_pda(), false),
            AccountMeta::new(course_pda(course_id), false),
            AccountMeta::new_readonly(*authority, true),
        ],
        data: Args::new(IX_UPDATE_COURSE)
            .opt(new_content_tx_id, |a, v| a.bytes32(&v))
            .opt(new_is_active, |a, v| a.u8(v as u8))
            .opt(new_xp_per_lesson, |a, v| a.u32(v))
            .opt(new_creator_reward_xp, |a, v| a.u32(v))
            .opt(new_min_completions_for_reward, |a, v| a.u16(v))
            .opt(new_collection, |a, k| a.key(&k))
            .build(),
    }
}

pub fn close_course(authority: &Pubkey, course_id: &str) -> Instruction {
    Instruction {
        program_id: program_id(),
        accounts: vec![
            AccountMeta::new_readonly(config_pda(), false),
            AccountMeta::new(course_pda(course_id), false),
            AccountMeta::new_readonly(*authority, true),
        ],
        data: Args::new(IX_CLOSE_COURSE).string(course_id).build(),
    }
}

pub fn enroll(learner: &Pubkey, course_id: &str, prereq: Option<(&str, &Pubkey)>) -> Instruction {
    let mut accounts = vec![
        AccountMeta::new(course_pda(course_id), false),
        AccountMeta::new(enrollment_pda(course_id, learner), false),
        AccountMeta::new(*learner, true),
        AccountMeta::new_readonly(system_program_id(), false),
    ];
    if let Some((prereq_course_id, prereq_learner)) = prereq {
        accounts.push(AccountMeta::new_readonly(
            course_pda(prereq_course_id),
            false,
        ));
        accounts.push(AccountMeta::new_readonly(
            enrollment_pda(prereq_course_id, prereq_learner),
            false,
        ));
    }
    Instruction {
        program_id: program_id(),
        accounts,
        data: Args::new(IX_ENROLL).string(course_id).build(),
    }
}

pub fn complete_lesson(
    course_id: &str,
    learner: &Pubkey,
    xp_mint: &Pubkey,
    backend_signer: &Pubkey,
    lesson_index: u8,
) -> Instruction {
    complete_lesson_with_ata(
        course_id,
        learner,
        &ata(learner, xp_mint),
        xp_mint,
        backend_signer,
        lesson_index,
    )
}

pub fn complete_lesson_with_ata(
    course_id: &str,
    learner: &Pubkey,
    learner_token_account: &Pubkey,
    xp_mint: &Pubkey,
    backend_signer: &Pubkey,
    lesson_index: u8,
) -> Instruction {
    Instruction {
        program_id: program_id(),
        accounts: vec![
            AccountMeta::new_readonly(config_pda(), false),
            AccountMeta::new_readonly(course_pda(course_id), false),
            AccountMeta::new(enrollment_pda(course_id, learner), false),
            AccountMeta::new_readonly(*learner, false),
            AccountMeta::new(*learner_token_account, false),
            AccountMeta::new(*xp_mint, false),
            AccountMeta::new_readonly(*backend_signer, true),
            AccountMeta::new_readonly(token_2022_id(), false),
        ],
        data: Args::new(IX_COMPLETE_LESSON).u8(lesson_index).build(),
    }
}

pub fn finalize_course(
    course_id: &str,
    learner: &Pubkey,
    creator: &Pubkey,
    xp_mint: &Pubkey,
    backend_signer: &Pubkey,
) -> Instruction {
    Instruction {
        program_id: program_id(),
        accounts: vec![
            AccountMeta::new_readonly(config_pda(), false),
            AccountMeta::new(course_pda(course_id), false),
            AccountMeta::new(enrollment_pda(course_id, learner), false),
            AccountMeta::new_readonly(*learner, false),
            AccountMeta::new(ata(learner, xp_mint), false),
            AccountMeta::new(ata(creator, xp_mint), false),
            AccountMeta::new_readonly(*creator, false),
            AccountMeta::new(*xp_mint, false),
            AccountMeta::new_readonly(*backend_signer, true),
            AccountMeta::new_readonly(token_2022_id(), false),
        ],
        data: Args::new(IX_FINALIZE_COURSE).build(),
    }
}

pub fn close_enrollment(course_id: &str, learner: &Pubkey) -> Instruction {
    Instruction {
        program_id: program_id(),
        accounts: vec![
            AccountMeta::new_readonly(course_pda(course_id), false),
            AccountMeta::new(enrollment_pda(course_id, learner), false),
            AccountMeta::new(*learner, true),
        ],
        data: Args::new(IX_CLOSE_ENROLLMENT).build(),
    }
}

#[allow(clippy::too_many_arguments)]
pub fn issue_credential(
    course_id: &str,
    learner: &Pubkey,
    credential_asset: &Pubkey,
    track_collection: &Pubkey,
    payer: &Pubkey,
    backend_signer: &Pubkey,
    name: &str,
    uri: &str,
    courses_completed: u32,
    total_xp: u64,
) -> Instruction {
    Instruction {
        program_id: program_id(),
        accounts: vec![
            AccountMeta::new_readonly(config_pda(), false),
            AccountMeta::new_readonly(course_pda(course_id), false),
            AccountMeta::new(enrollment_pda(course_id, learner), false),
            AccountMeta::new_readonly(*learner, false),
            AccountMeta::new(*credential_asset, true),
            AccountMeta::new(*track_collection, false),
            AccountMeta::new(*payer, true),
            AccountMeta::new_readonly(*backend_signer, true),
            AccountMeta::new_readonly(mpl_core_id(), false),
            AccountMeta::new_readonly(system_program_id(), false),
        ],
        data: Args::new(IX_ISSUE_CREDENTIAL)
            .string(name)
            .string(uri)
            .u32(courses_completed)
            .u64(total_xp)
            .build(),
    }
}

#[allow(clippy::too_many_arguments)]
pub fn upgrade_credential(
    course_id: &str,
    learner: &Pubkey,
    credential_asset: &Pubkey,
    track_collection: &Pubkey,
    payer: &Pubkey,
    backend_signer: &Pubkey,
    name: &str,
    uri: &str,
    courses_completed: u32,
    total_xp: u64,
) -> Instruction {
    Instruction {
        program_id: program_id(),
        accounts: vec![
            AccountMeta::new_readonly(config_pda(), false),
            AccountMeta::new_readonly(course_pda(course_id), false),
            AccountMeta::new_readonly(enrollment_pda(course_id, learner), false),
            AccountMeta::new_readonly(*learner, false),
            AccountMeta::new(*credential_asset, false),
            AccountMeta::new(*track_collection, false),
            AccountMeta::new(*payer, true),
            AccountMeta::new_readonly(*backend_signer, true),
            AccountMeta::new_readonly(mpl_core_id(), false),
            AccountMeta::new_readonly(system_program_id(), false),
        ],
        data: Args::new(IX_UPGRADE_CREDENTIAL)
            .string(name)
            .string(uri)
            .u32(courses_completed)
            .u64(total_xp)
            .build(),
    }
}

pub fn register_minter(
    authority: &Pubkey,
    payer: &Pubkey,
    minter: &Pubkey,
    label: &str,
    max_xp_per_call: u64,
    max_total_xp: u64,
) -> Instruction {
    Instruction {
        program_id: program_id(),
        accounts: vec![
            AccountMeta::new_readonly(config_pda(), false),
            AccountMeta::new(minter_pda(minter), false),
            AccountMeta::new(*authority, true),
            AccountMeta::new(*payer, true),
            AccountMeta::new_readonly(system_program_id(), false),
        ],
        data: Args::new(IX_REGISTER_MINTER)
            .key(minter)
            .string(label)
            .u64(max_xp_per_call)
            .u64(max_total_xp)
            .build(),
    }
}

pub fn revoke_minter(authority: &Pubkey, minter: &Pubkey) -> Instruction {
    Instruction {
        program_id: program_id(),
        accounts: vec![
            AccountMeta::new_readonly(config_pda(), false),
            AccountMeta::new(minter_pda(minter), false),
            AccountMeta::new(*authority, true),
        ],
        data: Args::new(IX_REVOKE_MINTER).build(),
    }
}

pub fn update_minter(
    authority: &Pubkey,
    minter: &Pubkey,
    max_xp_per_call: u64,
    max_total_xp: u64,
) -> Instruction {
    Instruction {
        program_id: program_id(),
        accounts: vec![
            AccountMeta::new_readonly(config_pda(), false),
            AccountMeta::new(minter_pda(minter), false),
            AccountMeta::new_readonly(*authority, true),
        ],
        data: Args::new(IX_UPDATE_MINTER)
            .u64(max_xp_per_call)
            .u64(max_total_xp)
            .build(),
    }
}

pub fn reward_xp(
    minter: &Pubkey,
    backend_signer: &Pubkey,
    xp_mint: &Pubkey,
    recipient_token_account: &Pubkey,
    amount: u64,
    memo: &str,
) -> Instruction {
    Instruction {
        program_id: program_id(),
        accounts: vec![
            AccountMeta::new_readonly(config_pda(), false),
            AccountMeta::new(minter_pda(minter), false),
            AccountMeta::new(*xp_mint, false),
            AccountMeta::new(*recipient_token_account, false),
            AccountMeta::new_readonly(*minter, true),
            AccountMeta::new_readonly(*backend_signer, true),
            AccountMeta::new_readonly(token_2022_id(), false),
        ],
        data: Args::new(IX_REWARD_XP).u64(amount).string(memo).build(),
    }
}

#[allow(clippy::too_many_arguments)]
pub fn create_achievement_type(
    authority: &Pubkey,
    payer: &Pubkey,
    collection: &Pubkey,
    achievement_id: &str,
    name: &str,
    metadata_uri: &str,
    max_supply: u32,
    xp_reward: u32,
) -> Instruction {
    Instruction {
        program_id: program_id(),
        accounts: vec![
            AccountMeta::new_readonly(config_pda(), false),
            AccountMeta::new(achievement_pda(achievement_id), false),
            AccountMeta::new(*collection, true),
            AccountMeta::new_readonly(*authority, true),
            AccountMeta::new(*payer, true),
            AccountMeta::new_readonly(mpl_core_id(), false),
            AccountMeta::new_readonly(system_program_id(), false),
        ],
        data: Args::new(IX_CREATE_ACHIEVEMENT_TYPE)
            .string(achievement_id)
            .string(name)
            .string(metadata_uri)
            .u32(max_supply)
            .u32(xp_reward)
            .build(),
    }
}

#[allow(clippy::too_many_arguments)]
pub fn award_achievement(
    achievement_id: &str,
    asset: &Pubkey,
    collection: &Pubkey,
    recipient: &Pubkey,
    xp_mint: &Pubkey,
    payer: &Pubkey,
    minter: &Pubkey,
    backend_signer: &Pubkey,
) -> Instruction {
    Instruction {
        program_id: program_id(),
        accounts: vec![
            AccountMeta::new_readonly(config_pda(), false),
            AccountMeta::new(achievement_pda(achievement_id), false),
            AccountMeta::new(receipt_pda(achievement_id, recipient), false),
            AccountMeta::new(minter_pda(minter), false),
            AccountMeta::new(*asset, true),
            AccountMeta::new(*collection, false),
            AccountMeta::new_readonly(*recipient, false),
            AccountMeta::new(ata(recipient, xp_mint), false),
            AccountMeta::new(*xp_mint, false),
            AccountMeta::new(*payer, true),
            AccountMeta::new_readonly(*minter, true),
            AccountMeta::new_readonly(*backend_signer, true),
            AccountMeta::new_readonly(mpl_core_id(), false),
            AccountMeta::new_readonly(token_2022_id(), false),
            AccountMeta::new_readonly(system_program_id(), false),
        ],
        data: Args::new(IX_AWARD_ACHIEVEMENT).build(),
    }
}

pub fn deactivate_achievement_type(authority: &Pubkey, achievement_id: &str) -> Instruction {
    Instruction {
        program_id: program_id(),
        accounts: vec![
            AccountMeta::new_readonly(config_pda(), false),
            AccountMeta::new(achievement_pda(achievement_id), false),
            AccountMeta::new_readonly(*authority, true),
        ],
        data: Args::new(IX_DEACTIVATE_ACHIEVEMENT_TYPE).build(),
    }
}

// ---- Helper programs ------------------------------------------------------------

/// Associated Token Account `CreateIdempotent` for the Token-2022 mint.
pub fn create_ata_idempotent(payer: &Pubkey, owner: &Pubkey, mint: &Pubkey) -> Instruction {
    Instruction {
        program_id: ata_program_id(),
        accounts: vec![
            AccountMeta::new(*payer, true),
            AccountMeta::new(ata(owner, mint), false),
            AccountMeta::new_readonly(*owner, false),
            AccountMeta::new_readonly(*mint, false),
            AccountMeta::new_readonly(system_program_id(), false),
            AccountMeta::new_readonly(token_2022_id(), false),
        ],
        data: vec![1], // CreateIdempotent
    }
}

/// mpl-core `CreateCollectionV2` with update authority = the Config PDA —
/// bootstraps a track credential collection like the production client does.
pub fn mpl_create_collection(
    collection: &Pubkey,
    payer: &Pubkey,
    name: &str,
    uri: &str,
) -> Instruction {
    let mut data = vec![21u8];
    data.extend_from_slice(&(name.len() as u32).to_le_bytes());
    data.extend_from_slice(name.as_bytes());
    data.extend_from_slice(&(uri.len() as u32).to_le_bytes());
    data.extend_from_slice(uri.as_bytes());
    data.push(0); // plugins: None
    data.push(0); // external_plugin_adapters: None
    Instruction {
        program_id: mpl_core_id(),
        accounts: vec![
            AccountMeta::new(*collection, true),
            AccountMeta::new_readonly(config_pda(), false),
            AccountMeta::new(*payer, true),
            AccountMeta::new_readonly(system_program_id(), false),
        ],
        data,
    }
}
