use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};
use crate::state::Config;

pub fn create_season(
    ctx: Context<CreateSeasonAccounts>,
    season: u32,
    _metadata_uri: String,
) -> Result<()> {
    let config = &mut ctx.accounts.config;
    
    require!(!config.season_closed, crate::errors::AcademyError::SeasonNotInitialized);
    
    config.current_season = season;
    config.current_mint = ctx.accounts.xp_mint.key();
    config.season_closed = false;

    msg!("✅ Season {} created with mint: {}", season, ctx.accounts.xp_mint.key());
    Ok(())
}

pub struct CreateSeason;

#[derive(Accounts)]
pub struct CreateSeasonAccounts<'info> {
    #[account(mut)]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub xp_mint: Account<'info, Mint>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
