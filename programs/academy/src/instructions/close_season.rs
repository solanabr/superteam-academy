use anchor_lang::prelude::*;
use crate::state::Config;

pub fn close_season(ctx: Context<CloseSeasonAccounts>) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.season_closed = true;

    msg!("✅ Season {} closed", config.current_season);
    Ok(())
}

pub struct CloseSeason;

#[derive(Accounts)]
pub struct CloseSeasonAccounts<'info> {
    #[account(mut)]
    pub config: Account<'info, Config>,
    pub authority: Signer<'info>,
}
