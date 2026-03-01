use anchor_lang::prelude::*;
use anchor_spl::token_2022::{spl_token_2022, Token2022};
use anchor_spl::token_interface::{token_metadata_initialize, TokenMetadataInitialize};

use crate::{
    errors::AcademyError,
    events::*,
    state::Config,
};

use super::platform::*;

pub fn handler_initialize(
    ctx: Context<Initialize>,
    max_daily_xp: u32,
    max_achievement_xp: u32,
) -> Result<()> {
    let config = &mut ctx.accounts.config;
    let authority = ctx.accounts.authority.key();
    let bump = ctx.bumps.config;

    config.authority = authority;
    config.backend_signer = authority; // Initially set to authority, can be rotated
    config.current_season = 0;
    config.current_mint = Pubkey::default();
    config.season_closed = true; // No active season initially
    config.season_started_at = 0;
    config.max_daily_xp = max_daily_xp;
    config.max_achievement_xp = max_achievement_xp;
    config._reserved = [0u8; 32];
    config.bump = bump;

    emit!(ConfigInitialized {
        authority,
        max_daily_xp,
        max_achievement_xp,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

pub fn handler_create_season(ctx: Context<CreateSeason>, season: u16) -> Result<()> {
    let config = &mut ctx.accounts.config;
    
    require!(
        config.season_closed || config.current_season == 0,
        AcademyError::SeasonNotActive
    );

    let expected_season = config.current_season.saturating_add(1);
    require_eq!(season, expected_season, AcademyError::Unauthorized);

    // Update config
    config.current_season = season;
    config.current_mint = ctx.accounts.mint.key();
    config.season_closed = false;
    config.season_started_at = Clock::get()?.unix_timestamp;

    // Initialize token metadata
    // TODO: Fix TokenMetadataInitialize CPI for Anchor 0.31
    // This is temporarily disabled to allow compilation
    msg!("Token metadata initialization skipped - needs Anchor 0.31 update");

    emit!(SeasonCreated {
        season,
        mint: ctx.accounts.mint.key(),
        timestamp: Clock::get()?.unix_timestamp,
    });

    msg!("Created season {} with mint {}", season, ctx.accounts.mint.key());

    Ok(())
}

pub fn handler_close_season(ctx: Context<CloseSeason>) -> Result<()> {
    let config = &mut ctx.accounts.config;
    
    require!(!config.season_closed, AcademyError::SeasonClosed);

    let season = config.current_season;
    config.season_closed = true;

    emit!(SeasonClosed {
        season,
        timestamp: Clock::get()?.unix_timestamp,
    });

    msg!("Closed season {}", season);

    Ok(())
}

pub fn handler_update_config(
    ctx: Context<UpdateConfig>,
    params: UpdateConfigParams,
) -> Result<()> {
    let config = &mut ctx.accounts.config;

    if let Some(backend_signer) = params.backend_signer {
        config.backend_signer = backend_signer;
        emit!(ConfigUpdated {
            field: "backend_signer".to_string(),
            timestamp: Clock::get()?.unix_timestamp,
        });
    }

    if let Some(max_daily_xp) = params.max_daily_xp {
        config.max_daily_xp = max_daily_xp;
        emit!(ConfigUpdated {
            field: "max_daily_xp".to_string(),
            timestamp: Clock::get()?.unix_timestamp,
        });
    }

    if let Some(max_achievement_xp) = params.max_achievement_xp {
        config.max_achievement_xp = max_achievement_xp;
        emit!(ConfigUpdated {
            field: "max_achievement_xp".to_string(),
            timestamp: Clock::get()?.unix_timestamp,
        });
    }

    Ok(())
}
