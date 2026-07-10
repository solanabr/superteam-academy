//! Error codes and client-visible error logs.
//!
//! Error numbers and log lines are wire-compatible with the Anchor build:
//! program errors are `Custom(6000 + variant)` and every failure logs a single
//! pre-baked `AnchorError occurred. …` line that `@coral-xyz/anchor`'s
//! `AnchorError.parse` understands. (Anchor itself sometimes emits the
//! `thrown in <file>:<line>` / `caused by account: <name>` variants; clients
//! parse all three shapes identically, and the origin-less form is the only
//! one that stays stable across implementations.)
//!
//! Framework-level checks (signer/seeds/owner/…) reuse Anchor's own error
//! codes and messages so the unmodified TS test suite sees identical failures.

use pinocchio::error::ProgramError;

use crate::log::sol_log;

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
#[repr(u32)]
pub enum AcademyError {
    Unauthorized = 0,
    CourseNotActive = 1,
    LessonOutOfBounds = 2,
    LessonAlreadyCompleted = 3,
    CourseNotCompleted = 4,
    CourseAlreadyFinalized = 5,
    CourseNotFinalized = 6,
    PrerequisiteNotMet = 7,
    UnenrollCooldown = 8,
    EnrollmentCourseMismatch = 9,
    Overflow = 10,
    CourseIdEmpty = 11,
    CourseIdTooLong = 12,
    InvalidLessonCount = 13,
    InvalidDifficulty = 14,
    CredentialAssetMismatch = 15,
    CollectionMismatch = 16,
    CredentialAlreadyIssued = 17,
    MinterNotActive = 18,
    MinterAmountExceeded = 19,
    MinterCapExceeded = 20,
    LabelTooLong = 21,
    AchievementNotActive = 22,
    AchievementSupplyExhausted = 23,
    AchievementIdTooLong = 24,
    AchievementNameTooLong = 25,
    AchievementUriTooLong = 26,
    InvalidAmount = 27,
    InvalidXpReward = 28,
    EnrollmentFinalized = 29,
    InvalidCourseAccount = 30,
    MintingPaused = 31,
    WrongXpMint = 32,
    XpAmountExceedsMax = 33,
    StaleEnrollment = 34,
    OldMinterRoleMissing = 35,
    EnrollmentInProgress = 36,
}

macro_rules! anchor_log {
    ($name:literal, $num:literal, $msg:literal) => {
        concat!(
            "AnchorError occurred. Error Code: ",
            $name,
            ". Error Number: ",
            $num,
            ". Error Message: ",
            $msg,
            "."
        )
    };
}

/// One pre-baked log line per `AcademyError` variant, indexed by ordinal.
/// Names/numbers/messages match the IDL `errors` table verbatim.
const ACADEMY_LOGS: [&str; 37] = [
    anchor_log!("Unauthorized", 6000, "Unauthorized signer"),
    anchor_log!("CourseNotActive", 6001, "Course not active"),
    anchor_log!("LessonOutOfBounds", 6002, "Lesson index out of bounds"),
    anchor_log!("LessonAlreadyCompleted", 6003, "Lesson already completed"),
    anchor_log!("CourseNotCompleted", 6004, "Not all lessons completed"),
    anchor_log!("CourseAlreadyFinalized", 6005, "Course already finalized"),
    anchor_log!("CourseNotFinalized", 6006, "Course not finalized"),
    anchor_log!("PrerequisiteNotMet", 6007, "Prerequisite not met"),
    anchor_log!("UnenrollCooldown", 6008, "Close cooldown not met (24h)"),
    anchor_log!(
        "EnrollmentCourseMismatch",
        6009,
        "Enrollment/course mismatch"
    ),
    anchor_log!("Overflow", 6010, "Arithmetic overflow"),
    anchor_log!("CourseIdEmpty", 6011, "Course ID is empty"),
    anchor_log!("CourseIdTooLong", 6012, "Course ID exceeds max length"),
    anchor_log!(
        "InvalidLessonCount",
        6013,
        "Lesson count must be at least 1"
    ),
    anchor_log!("InvalidDifficulty", 6014, "Difficulty must be 1, 2, or 3"),
    anchor_log!(
        "CredentialAssetMismatch",
        6015,
        "Credential asset does not match enrollment record"
    ),
    anchor_log!(
        "CollectionMismatch",
        6016,
        "Collection does not match the course's credential collection"
    ),
    anchor_log!(
        "CredentialAlreadyIssued",
        6017,
        "Credential already issued for this enrollment"
    ),
    anchor_log!("MinterNotActive", 6018, "Minter role is not active"),
    anchor_log!(
        "MinterAmountExceeded",
        6019,
        "Amount exceeds minter's per-call limit"
    ),
    anchor_log!(
        "MinterCapExceeded",
        6020,
        "Cumulative minted XP would exceed minter's total cap"
    ),
    anchor_log!("LabelTooLong", 6021, "Minter label exceeds max length"),
    anchor_log!(
        "AchievementNotActive",
        6022,
        "Achievement type is not active"
    ),
    anchor_log!(
        "AchievementSupplyExhausted",
        6023,
        "Achievement max supply reached"
    ),
    anchor_log!(
        "AchievementIdTooLong",
        6024,
        "Achievement ID exceeds max length"
    ),
    anchor_log!(
        "AchievementNameTooLong",
        6025,
        "Achievement name exceeds max length"
    ),
    anchor_log!(
        "AchievementUriTooLong",
        6026,
        "Achievement URI exceeds max length"
    ),
    anchor_log!("InvalidAmount", 6027, "Amount must be greater than zero"),
    anchor_log!(
        "InvalidXpReward",
        6028,
        "XP reward must be greater than zero"
    ),
    anchor_log!(
        "EnrollmentFinalized",
        6029,
        "Finalized or credentialed enrollment cannot be closed"
    ),
    anchor_log!(
        "InvalidCourseAccount",
        6030,
        "Account is not a valid Course PDA"
    ),
    anchor_log!("MintingPaused", 6031, "Minting is paused"),
    anchor_log!(
        "WrongXpMint",
        6032,
        "Recipient token account mint does not match Config.xp_mint"
    ),
    anchor_log!(
        "XpAmountExceedsMax",
        6033,
        "XP amount exceeds the per-mint ceiling"
    ),
    anchor_log!(
        "StaleEnrollment",
        6034,
        "Enrollment belongs to a superseded course generation"
    ),
    anchor_log!(
        "OldMinterRoleMissing",
        6035,
        "Backend rotation requires the previous backend minter role account"
    ),
    anchor_log!(
        "EnrollmentInProgress",
        6036,
        "Enrollment with completed lessons cannot be closed"
    ),
];

/// Logs the Anchor-format error line and returns the matching custom error.
#[cold]
pub fn academy(e: AcademyError) -> ProgramError {
    sol_log(ACADEMY_LOGS[e as usize]);
    ProgramError::Custom(6000 + e as u32)
}

/// The pre-baked log line for a variant (parity-tested against the Anchor
/// crate's error name/number/message).
pub fn academy_log(e: AcademyError) -> &'static str {
    ACADEMY_LOGS[e as usize]
}

/// An Anchor framework error: (code, pre-baked log line).
pub type FwError = (u32, &'static str);

pub const INSTRUCTION_FALLBACK_NOT_FOUND: FwError = (
    101,
    anchor_log!(
        "InstructionFallbackNotFound",
        101,
        "Fallback functions are not supported"
    ),
);
pub const INSTRUCTION_DID_NOT_DESERIALIZE: FwError = (
    102,
    anchor_log!(
        "InstructionDidNotDeserialize",
        102,
        "The program could not deserialize the given instruction"
    ),
);
pub const CONSTRAINT_MUT: FwError = (
    2000,
    anchor_log!("ConstraintMut", 2000, "A mut constraint was violated"),
);
pub const CONSTRAINT_SEEDS: FwError = (
    2006,
    anchor_log!("ConstraintSeeds", 2006, "A seeds constraint was violated"),
);
pub const CONSTRAINT_ADDRESS: FwError = (
    2012,
    anchor_log!(
        "ConstraintAddress",
        2012,
        "An address constraint was violated"
    ),
);
pub const ACCOUNT_DISCRIMINATOR_NOT_FOUND: FwError = (
    3001,
    anchor_log!(
        "AccountDiscriminatorNotFound",
        3001,
        "No discriminator was found on the account"
    ),
);
pub const ACCOUNT_DISCRIMINATOR_MISMATCH: FwError = (
    3002,
    anchor_log!(
        "AccountDiscriminatorMismatch",
        3002,
        "Account discriminator did not match what was expected"
    ),
);
pub const ACCOUNT_DID_NOT_DESERIALIZE: FwError = (
    3003,
    anchor_log!(
        "AccountDidNotDeserialize",
        3003,
        "Failed to deserialize the account"
    ),
);
pub const ACCOUNT_NOT_ENOUGH_KEYS: FwError = (
    3005,
    anchor_log!(
        "AccountNotEnoughKeys",
        3005,
        "Not enough account keys given to the instruction"
    ),
);
pub const ACCOUNT_OWNED_BY_WRONG_PROGRAM: FwError = (
    3007,
    anchor_log!(
        "AccountOwnedByWrongProgram",
        3007,
        "The given account is owned by a different program than expected"
    ),
);
pub const INVALID_PROGRAM_ID: FwError = (
    3008,
    anchor_log!("InvalidProgramId", 3008, "Program ID was not as expected"),
);
pub const ACCOUNT_NOT_SIGNER: FwError = (
    3010,
    anchor_log!("AccountNotSigner", 3010, "The given account did not sign"),
);
pub const ACCOUNT_NOT_INITIALIZED: FwError = (
    3012,
    anchor_log!(
        "AccountNotInitialized",
        3012,
        "The program expected this account to be already initialized"
    ),
);
pub const DECLARED_PROGRAM_ID_MISMATCH: FwError = (
    4100,
    anchor_log!(
        "DeclaredProgramIdMismatch",
        4100,
        "The declared program id does not match the actual program id"
    ),
);

/// Logs and returns an Anchor framework error.
#[cold]
pub fn fw(e: FwError) -> ProgramError {
    sol_log(e.1);
    ProgramError::Custom(e.0)
}

/// Anchor `require!` equivalent: bails with the given `AcademyError`.
#[macro_export]
macro_rules! require {
    ($cond:expr, $err:expr) => {
        if !$cond {
            return Err($crate::errors::academy($err));
        }
    };
}

/// Bails with the given Anchor framework error when the condition fails.
#[macro_export]
macro_rules! require_fw {
    ($cond:expr, $err:expr) => {
        if !$cond {
            return Err($crate::errors::fw($err));
        }
    };
}
