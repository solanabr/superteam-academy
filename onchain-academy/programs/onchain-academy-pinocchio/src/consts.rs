//! Program constants: addresses, PDA seeds, Anchor-compatible discriminators
//! and limits. Every discriminator is copied verbatim from the committed IDL
//! (`apps/web/src/lib/solana/idl/superteam_academy.json`) and cross-checked
//! against the Anchor crate in `tests/discriminator_parity.rs`.

use pinocchio::Address;

/// Program identity, selected at compile time:
///
/// * default — the upstream devnet program id. All parity gates (host tests,
///   dual-VM differential, unmodified TS suite) run this flavor so behavior is
///   compared against the deployed Anchor oracle at its real id.
/// * `--features fresh-id` — a self-owned devnet instance for end-to-end
///   testing without the upstream upgrade authority. Keypair:
///   `onchain-academy/wallets/pinocchio-program-devnet.json` (gitignored).
///   See docs/DEPLOY-PROGRAM.md § "Fresh devnet instance".
///
/// The entrypoint's `DeclaredProgramIdMismatch` self-check makes a
/// wrong-flavor deploy fail loudly on its first instruction, before any state
/// exists.
#[cfg(not(feature = "fresh-id"))]
pub const ID: Address = Address::from_str_const("7NeJaSRyb4Wxay3Tcd9bdpD7T3GWYUQSFyrhG8SgwE8V");
#[cfg(feature = "fresh-id")]
pub const ID: Address = Address::from_str_const("CYneSS6KYx1YA73ZwrxC4vvWKsR2xJKLWpKNJNXC5SnM");

pub const SYSTEM_PROGRAM_ID: Address = Address::new_from_array([0u8; 32]);
/// `Pubkey::default()` — the "unset" sentinel used by `Course.collection`.
pub const DEFAULT_ADDRESS: Address = Address::new_from_array([0u8; 32]);
pub const TOKEN_2022_ID: Address =
    Address::from_str_const("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
pub const MPL_CORE_ID: Address =
    Address::from_str_const("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");

/// `["config"]` derives a single address for a fixed program id, so the PDA
/// and its canonical bump are compile-time constants — this replaces a
/// ~1,500 CU `create_program_address` syscall with a 32-byte compare on every
/// instruction. One pair per [`ID`] flavor; each is verified against
/// `find_program_address(["config"], ID)` in `tests/discriminator_parity.rs`.
#[cfg(not(feature = "fresh-id"))]
pub const CONFIG_PDA: Address =
    Address::from_str_const("HmQsZaBKvADBvnUuyxG8G3hdDKYSyZsQbpmeMcPWoPn");
#[cfg(not(feature = "fresh-id"))]
pub const CONFIG_BUMP: u8 = 255;
#[cfg(feature = "fresh-id")]
pub const CONFIG_PDA: Address =
    Address::from_str_const("F6D5iHRkW7F2zGmmExN3Z2ZqSG1gDTgNjgxKWARYWDsm");
#[cfg(feature = "fresh-id")]
pub const CONFIG_BUMP: u8 = 255;

// PDA seeds
pub const CONFIG_SEED: &[u8] = b"config";
pub const COURSE_SEED: &[u8] = b"course";
pub const ENROLLMENT_SEED: &[u8] = b"enrollment";
pub const MINTER_SEED: &[u8] = b"minter";
pub const ACHIEVEMENT_SEED: &[u8] = b"achievement";
pub const ACHIEVEMENT_RECEIPT_SEED: &[u8] = b"achievement_receipt";

// Limits (mirrors the Anchor crate's constants)
pub const MAX_XP_PER_MINT: u64 = 5000;
pub const MAX_COURSE_ID_LEN: usize = 32;
pub const MAX_LABEL_LEN: usize = 32;
pub const MAX_ACHIEVEMENT_ID_LEN: usize = 32;
pub const MAX_ACHIEVEMENT_NAME_LEN: usize = 64;
pub const MAX_ACHIEVEMENT_URI_LEN: usize = 128;
pub const CREATOR_REWARD_WINDOW: u32 = 100;
pub const UNENROLL_COOLDOWN_SECS: i64 = 86_400;

// Account sizes (allocation sizes; serialized content may be shorter)
pub const CONFIG_SIZE: usize = 113;
pub const COURSE_SIZE: usize = 224;
pub const ENROLLMENT_SIZE: usize = 127;
pub const MINTER_ROLE_SIZE: usize = 110;
pub const ACHIEVEMENT_TYPE_SIZE: usize = 338;
pub const ACHIEVEMENT_RECEIPT_SIZE: usize = 49;

// Instruction discriminators — sha256("global:<name>")[..8]
pub const IX_INITIALIZE: [u8; 8] = [175, 175, 109, 31, 13, 152, 155, 237];
pub const IX_UPDATE_CONFIG: [u8; 8] = [29, 158, 252, 191, 10, 83, 219, 99];
pub const IX_CREATE_COURSE: [u8; 8] = [120, 121, 154, 164, 107, 180, 167, 241];
pub const IX_UPDATE_COURSE: [u8; 8] = [81, 217, 18, 192, 129, 233, 129, 231];
pub const IX_CLOSE_COURSE: [u8; 8] = [157, 252, 239, 166, 213, 174, 160, 34];
pub const IX_ENROLL: [u8; 8] = [58, 12, 36, 3, 142, 28, 1, 43];
pub const IX_COMPLETE_LESSON: [u8; 8] = [77, 217, 53, 132, 204, 150, 169, 58];
pub const IX_FINALIZE_COURSE: [u8; 8] = [68, 189, 122, 239, 39, 121, 16, 218];
pub const IX_CLOSE_ENROLLMENT: [u8; 8] = [236, 137, 133, 253, 91, 138, 217, 91];
pub const IX_ISSUE_CREDENTIAL: [u8; 8] = [255, 193, 171, 224, 68, 171, 194, 87];
pub const IX_UPGRADE_CREDENTIAL: [u8; 8] = [2, 121, 77, 255, 103, 187, 252, 169];
pub const IX_REGISTER_MINTER: [u8; 8] = [58, 224, 74, 142, 170, 95, 116, 191];
pub const IX_REVOKE_MINTER: [u8; 8] = [33, 91, 131, 167, 62, 37, 38, 105];
pub const IX_UPDATE_MINTER: [u8; 8] = [164, 129, 164, 88, 75, 29, 91, 38];
pub const IX_REWARD_XP: [u8; 8] = [144, 187, 117, 238, 89, 118, 224, 145];
pub const IX_CREATE_ACHIEVEMENT_TYPE: [u8; 8] = [231, 38, 39, 228, 103, 4, 229, 19];
pub const IX_AWARD_ACHIEVEMENT: [u8; 8] = [75, 47, 156, 253, 124, 231, 84, 12];
pub const IX_DEACTIVATE_ACHIEVEMENT_TYPE: [u8; 8] = [185, 21, 222, 243, 192, 118, 71, 191];

// Account discriminators — sha256("account:<Name>")[..8]
pub const ACC_CONFIG: [u8; 8] = [155, 12, 170, 224, 30, 250, 204, 130];
pub const ACC_COURSE: [u8; 8] = [206, 6, 78, 228, 163, 138, 241, 106];
pub const ACC_ENROLLMENT: [u8; 8] = [249, 210, 64, 145, 197, 241, 57, 51];
pub const ACC_MINTER_ROLE: [u8; 8] = [21, 246, 6, 133, 142, 211, 33, 193];
pub const ACC_ACHIEVEMENT_TYPE: [u8; 8] = [13, 187, 114, 66, 217, 154, 85, 137];
pub const ACC_ACHIEVEMENT_RECEIPT: [u8; 8] = [149, 5, 79, 178, 116, 231, 43, 248];

// Event discriminators — sha256("event:<Name>")[..8]
pub const EV_CONFIG_UPDATED: [u8; 8] = [40, 241, 230, 122, 11, 19, 198, 194];
pub const EV_COURSE_CREATED: [u8; 8] = [205, 144, 55, 47, 150, 170, 123, 214];
pub const EV_COURSE_UPDATED: [u8; 8] = [124, 141, 110, 224, 149, 124, 26, 141];
pub const EV_ENROLLED: [u8; 8] = [129, 156, 102, 214, 94, 196, 220, 127];
pub const EV_LESSON_COMPLETED: [u8; 8] = [248, 174, 148, 235, 186, 49, 11, 163];
pub const EV_COURSE_FINALIZED: [u8; 8] = [18, 195, 195, 25, 165, 189, 194, 56];
pub const EV_ENROLLMENT_CLOSED: [u8; 8] = [197, 4, 145, 238, 217, 4, 175, 77];
pub const EV_CREDENTIAL_ISSUED: [u8; 8] = [194, 216, 28, 159, 89, 29, 72, 177];
pub const EV_CREDENTIAL_UPGRADED: [u8; 8] = [198, 142, 252, 191, 210, 200, 253, 133];
pub const EV_MINTER_REGISTERED: [u8; 8] = [104, 203, 87, 105, 23, 33, 231, 1];
pub const EV_MINTER_REVOKED: [u8; 8] = [138, 76, 227, 247, 141, 92, 77, 127];
pub const EV_MINTER_UPDATED: [u8; 8] = [8, 124, 66, 45, 176, 53, 49, 153];
pub const EV_XP_REWARDED: [u8; 8] = [140, 182, 232, 144, 16, 155, 237, 182];
pub const EV_ACHIEVEMENT_AWARDED: [u8; 8] = [127, 212, 93, 231, 175, 0, 69, 150];
pub const EV_ACHIEVEMENT_TYPE_CREATED: [u8; 8] = [189, 36, 173, 243, 25, 232, 198, 153];
pub const EV_ACHIEVEMENT_TYPE_DEACTIVATED: [u8; 8] = [133, 12, 218, 127, 151, 28, 1, 222];
pub const EV_COURSE_CLOSED: [u8; 8] = [35, 195, 37, 254, 25, 107, 100, 12];
pub const EV_MINTING_PAUSE_SET: [u8; 8] = [232, 11, 219, 8, 116, 65, 178, 74];
