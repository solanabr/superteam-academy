use anchor_lang::prelude::*;

#[account]
pub struct Config {
    /// Platform multisig (Squads)
    pub authority: Pubkey,
    /// Rotatable backend signer for completions
    pub backend_signer: Pubkey,
    /// Current active season number
    pub current_season: u16,
    /// Current season's Token-2022 mint address
    pub current_mint: Pubkey,
    /// Whether current season is closed
    pub season_closed: bool,
    /// Season start timestamp
    pub season_started_at: i64,
    /// Max XP any learner can earn per day
    pub max_daily_xp: u32,
    /// Max XP from a single achievement
    pub max_achievement_xp: u32,
    /// Reserved bytes for future use
    pub _reserved: [u8; 32],
    /// PDA bump
    pub bump: u8,
}

impl Config {
    pub const SIZE: usize = 8 + // discriminator
        32 + // authority
        32 + // backend_signer
        2 + // current_season
        32 + // current_mint
        1 + // season_closed
        8 + // season_started_at
        4 + // max_daily_xp
        4 + // max_achievement_xp
        32 + // reserved
        1; // bump

    pub const SEED: &'static [u8] = b"config";
}
