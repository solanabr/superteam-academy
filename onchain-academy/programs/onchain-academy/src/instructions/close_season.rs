use anchor_lang::prelude::*;

use crate::errors::AcademyError;
use crate::events::SeasonClosedEvent;
use crate::state::Config;

#[derive(Accounts)]
pub struct CloseSeason<'info> {
    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump,
        has_one = authority @ AcademyError::Unauthorized,
    )]
    pub config: Account<'info, Config>,

    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<CloseSeason>) -> Result<()> {
    let config = &mut ctx.accounts.config;

    require!(!config.season_closed, AcademyError::SeasonClosed);

    config.season_closed = true;

    emit!(SeasonClosedEvent {
        season: config.current_season,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
