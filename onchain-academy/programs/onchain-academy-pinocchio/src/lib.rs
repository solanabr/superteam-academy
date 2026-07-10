#![no_std]

#[cfg(test)]
extern crate std;

pub mod consts;
pub mod cpi;
pub mod errors;
pub mod events;
pub mod instructions;
pub mod log;
pub mod state;
pub mod validation;

use pinocchio::{
    no_allocator, nostd_panic_handler, program_entrypoint, AccountView, Address, ProgramResult,
};

use crate::consts::*;
use crate::errors::{fw, DECLARED_PROGRAM_ID_MISMATCH, INSTRUCTION_FALLBACK_NOT_FOUND};
use crate::log::sol_log;

#[cfg(not(feature = "no-entrypoint"))]
program_entrypoint!(process_instruction);
#[cfg(not(feature = "no-entrypoint"))]
no_allocator!();
#[cfg(not(feature = "no-entrypoint"))]
nostd_panic_handler!();

const fn disc(d: [u8; 8]) -> u64 {
    u64::from_le_bytes(d)
}

const D_INITIALIZE: u64 = disc(IX_INITIALIZE);
const D_UPDATE_CONFIG: u64 = disc(IX_UPDATE_CONFIG);
const D_CREATE_COURSE: u64 = disc(IX_CREATE_COURSE);
const D_UPDATE_COURSE: u64 = disc(IX_UPDATE_COURSE);
const D_CLOSE_COURSE: u64 = disc(IX_CLOSE_COURSE);
const D_ENROLL: u64 = disc(IX_ENROLL);
const D_COMPLETE_LESSON: u64 = disc(IX_COMPLETE_LESSON);
const D_FINALIZE_COURSE: u64 = disc(IX_FINALIZE_COURSE);
const D_CLOSE_ENROLLMENT: u64 = disc(IX_CLOSE_ENROLLMENT);
const D_ISSUE_CREDENTIAL: u64 = disc(IX_ISSUE_CREDENTIAL);
const D_UPGRADE_CREDENTIAL: u64 = disc(IX_UPGRADE_CREDENTIAL);
const D_REGISTER_MINTER: u64 = disc(IX_REGISTER_MINTER);
const D_REVOKE_MINTER: u64 = disc(IX_REVOKE_MINTER);
const D_UPDATE_MINTER: u64 = disc(IX_UPDATE_MINTER);
const D_REWARD_XP: u64 = disc(IX_REWARD_XP);
const D_CREATE_ACHIEVEMENT_TYPE: u64 = disc(IX_CREATE_ACHIEVEMENT_TYPE);
const D_AWARD_ACHIEVEMENT: u64 = disc(IX_AWARD_ACHIEVEMENT);
const D_DEACTIVATE_ACHIEVEMENT_TYPE: u64 = disc(IX_DEACTIVATE_ACHIEVEMENT_TYPE);

pub fn process_instruction(
    program_id: &Address,
    accounts: &mut [AccountView],
    instruction_data: &[u8],
) -> ProgramResult {
    if program_id != &ID {
        return Err(fw(DECLARED_PROGRAM_ID_MISMATCH));
    }
    if instruction_data.len() < 8 {
        return Err(fw(INSTRUCTION_FALLBACK_NOT_FOUND));
    }
    let mut sighash = [0u8; 8];
    sighash.copy_from_slice(&instruction_data[..8]);
    let args = &instruction_data[8..];

    // Hot instructions first. Each arm logs the Anchor-format entry line
    // before argument parsing, exactly like the Anchor dispatcher.
    match u64::from_le_bytes(sighash) {
        D_COMPLETE_LESSON => {
            sol_log("Instruction: CompleteLesson");
            instructions::complete_lesson::process(accounts, args)
        }
        D_FINALIZE_COURSE => {
            sol_log("Instruction: FinalizeCourse");
            instructions::finalize_course::process(accounts, args)
        }
        D_ENROLL => {
            sol_log("Instruction: Enroll");
            instructions::enroll::process(accounts, args)
        }
        D_REWARD_XP => {
            sol_log("Instruction: RewardXp");
            instructions::reward_xp::process(accounts, args)
        }
        D_AWARD_ACHIEVEMENT => {
            sol_log("Instruction: AwardAchievement");
            instructions::award_achievement::process(accounts, args)
        }
        D_ISSUE_CREDENTIAL => {
            sol_log("Instruction: IssueCredential");
            instructions::issue_credential::process(accounts, args)
        }
        D_UPGRADE_CREDENTIAL => {
            sol_log("Instruction: UpgradeCredential");
            instructions::upgrade_credential::process(accounts, args)
        }
        D_CLOSE_ENROLLMENT => {
            sol_log("Instruction: CloseEnrollment");
            instructions::close_enrollment::process(accounts, args)
        }
        D_INITIALIZE => {
            sol_log("Instruction: Initialize");
            instructions::initialize::process(accounts, args)
        }
        D_UPDATE_CONFIG => {
            sol_log("Instruction: UpdateConfig");
            instructions::update_config::process(accounts, args)
        }
        D_CREATE_COURSE => {
            sol_log("Instruction: CreateCourse");
            instructions::create_course::process(accounts, args)
        }
        D_UPDATE_COURSE => {
            sol_log("Instruction: UpdateCourse");
            instructions::update_course::process(accounts, args)
        }
        D_CLOSE_COURSE => {
            sol_log("Instruction: CloseCourse");
            instructions::close_course::process(accounts, args)
        }
        D_REGISTER_MINTER => {
            sol_log("Instruction: RegisterMinter");
            instructions::register_minter::process(accounts, args)
        }
        D_REVOKE_MINTER => {
            sol_log("Instruction: RevokeMinter");
            instructions::revoke_minter::process(accounts, args)
        }
        D_UPDATE_MINTER => {
            sol_log("Instruction: UpdateMinter");
            instructions::update_minter::process(accounts, args)
        }
        D_CREATE_ACHIEVEMENT_TYPE => {
            sol_log("Instruction: CreateAchievementType");
            instructions::create_achievement_type::process(accounts, args)
        }
        D_DEACTIVATE_ACHIEVEMENT_TYPE => {
            sol_log("Instruction: DeactivateAchievementType");
            instructions::deactivate_achievement_type::process(accounts, args)
        }
        _ => Err(fw(INSTRUCTION_FALLBACK_NOT_FOUND)),
    }
}
