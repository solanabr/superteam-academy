use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
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
    /// Reserved for future use
    pub _reserved: [u8; 32],
    /// PDA bump
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct UpdateConfigParams {
    pub backend_signer: Option<Pubkey>,
    pub max_daily_xp: Option<u32>,
    pub max_achievement_xp: Option<u32>,
}
