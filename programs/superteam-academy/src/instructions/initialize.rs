use anchor_lang::prelude::*;

use crate::state::Config;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Config::INIT_SPACE,
        seeds = [b"config"],
        bump,
    )]
    pub config: Account<'info, Config>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Initialize>, max_daily_xp: u32, max_achievement_xp: u32) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.authority = ctx.accounts.authority.key();
    config.backend_signer = ctx.accounts.authority.key();
    config.current_season = 0;
    config.current_mint = Pubkey::default();
    config.season_closed = true;
    config.season_started_at = 0;
    config.max_daily_xp = max_daily_xp;
    config.max_achievement_xp = max_achievement_xp;
    config._reserved = [0u8; 32];
    config.bump = ctx.bumps.config;

    Ok(())
}
