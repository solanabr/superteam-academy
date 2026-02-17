use anchor_lang::prelude::*;

#[account]
pub struct Config {
    /// Platform multisig (Squads)
    pub authority: Pubkey,
    /// Rotatable backend signer for completions
    pub backend_signer: Pubkey,
    /// Token-2022 mint for XP
    pub xp_mint: Pubkey,
    /// Reserved for future use
    pub _reserved: [u8; 8],
    /// PDA bump
    pub bump: u8,
}

impl Config {
    pub const SIZE: usize = 8 + 32 + 32 + 32 + 8 + 1; // 113
}
