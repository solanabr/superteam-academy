use anchor_lang::prelude::*;

use crate::errors::AcademyError;
use crate::state::{Config, UpdateConfigParams};

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump,
        has_one = authority @ AcademyError::Unauthorized,
    )]
    pub config: Account<'info, Config>,

    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<UpdateConfig>, params: UpdateConfigParams) -> Result<()> {
    let config = &mut ctx.accounts.config;
    let now = Clock::get()?.unix_timestamp;

    if let Some(backend_signer) = params.backend_signer {
        config.backend_signer = backend_signer;
        emit!(ConfigUpdated {
            field: "backend_signer".to_string(),
            timestamp: now,
        });
    }

    if let Some(max_daily_xp) = params.max_daily_xp {
        config.max_daily_xp = max_daily_xp;
        emit!(ConfigUpdated {
            field: "max_daily_xp".to_string(),
            timestamp: now,
        });
    }

    if let Some(max_achievement_xp) = params.max_achievement_xp {
        config.max_achievement_xp = max_achievement_xp;
        emit!(ConfigUpdated {
            field: "max_achievement_xp".to_string(),
            timestamp: now,
        });
    }

    Ok(())
}

#[event]
pub struct ConfigUpdated {
    pub field: String,
    pub timestamp: i64,
}
