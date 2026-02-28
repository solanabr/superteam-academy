use anchor_lang::prelude::*;

#[account]
pub struct Config {
    /// Platform multisig (Squads)
    pub authority: Pubkey,
    /// Rotatable backend signer for completions
    pub backend_signer: Pubkey,
    /// Token-2022 mint for XP (static, created in initialize)
    pub xp_mint: Pubkey,
    /// Current season number (0 = no season yet)
    pub current_season: u16,
    /// Whether the current season is closed
    pub season_closed: bool,
    /// Timestamp when the current season started
    pub season_started_at: i64,
    /// Maximum XP a learner can earn per day
    pub max_daily_xp: u32,
    /// Maximum XP per achievement claim
    pub max_achievement_xp: u32,
    /// Reserved for future use
    pub _reserved: [u8; 8],
    /// PDA bump
    pub bump: u8,
}

impl Config {
    // 8 (discriminator) + 32 + 32 + 32 + 2 + 1 + 8 + 4 + 4 + 8 + 1 = 132
    pub const SIZE: usize = 8 + 32 + 32 + 32 + 2 + 1 + 8 + 4 + 4 + 8 + 1;
}
