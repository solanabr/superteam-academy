use anchor_lang::prelude::*;

use crate::errors::AcademyError;
use crate::events::ConfigUpdated;
use crate::state::Config;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdateConfigParams {
    pub new_backend_signer: Option<Pubkey>,
}

pub fn handler(ctx: Context<UpdateConfig>, params: UpdateConfigParams) -> Result<()> {
    let config = &mut ctx.accounts.config;
    let now = Clock::get()?.unix_timestamp;

    if let Some(signer) = params.new_backend_signer {
        config.backend_signer = signer;
        emit!(ConfigUpdated {
            field: "backend_signer".to_string(),
            timestamp: now,
        });
    }

    Ok(())
}

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
