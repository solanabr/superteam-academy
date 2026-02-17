use anchor_lang::AnchorDeserialize;
use solana_sdk::pubkey::Pubkey;

pub const PROGRAM_ID: Pubkey = superteam_academy::ID;

pub fn config_pda() -> (Pubkey, u8) {
    Pubkey::find_program_address(&[b"config"], &PROGRAM_ID)
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

pub fn minter_role_pda(minter: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[b"minter", minter.as_ref()], &PROGRAM_ID)
}

pub fn achievement_type_pda(achievement_id: &str) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[b"achievement", achievement_id.as_bytes()], &PROGRAM_ID)
}

pub fn achievement_receipt_pda(achievement_id: &str, recipient: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[
            b"achievement_receipt",
            achievement_id.as_bytes(),
            recipient.as_ref(),
        ],
        &PROGRAM_ID,
    )
}

/// Deserialize an Anchor account from raw data (skipping 8-byte discriminator).
pub fn deserialize_account<T: AnchorDeserialize>(data: &[u8]) -> T {
    T::deserialize(&mut &data[8..]).expect("failed to deserialize")
}
