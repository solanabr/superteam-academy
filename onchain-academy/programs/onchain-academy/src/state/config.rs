use anchor_lang::prelude::*;

#[account]
pub struct Config {
    /// Platform multisig (Squads)
    pub authority: Pubkey,
    /// Rotatable backend signer for completions
    pub backend_signer: Pubkey,
    /// Token-2022 mint for XP
    pub xp_mint: Pubkey,
    /// Global minting kill-switch. When true, every XP-minting / credential
    /// instruction is blocked: complete_lesson, finalize_course, reward_xp,
    /// award_achievement, and issue_credential. Occupies the first former
    /// `_reserved` byte; legacy accounts (reserved zeroed) deserialize as `false`.
    pub paused: bool,
    /// Reserved for future use
    pub _reserved: [u8; 7],
    /// PDA bump
    pub bump: u8,
}

impl Config {
    // 8 (discriminator) + 32 + 32 + 32 + 1 (paused) + 7 (reserved) + 1 (bump).
    // `paused` + `_reserved` together still span the original 8 reserved bytes,
    // so SIZE is unchanged — existing Config accounts need no resize.
    pub const SIZE: usize = 8 + 32 + 32 + 32 + 1 + 7 + 1; // 113
}
