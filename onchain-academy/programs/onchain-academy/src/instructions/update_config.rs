use anchor_lang::prelude::*;

use crate::errors::AcademyError;
use crate::events::{ConfigUpdated, MintingPauseSet};
use crate::state::{Config, MinterRole};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdateConfigParams {
    pub new_backend_signer: Option<Pubkey>,
    /// Minting kill-switch toggle. `Some(true)` pauses all minting,
    /// `Some(false)` resumes, `None` leaves it unchanged.
    pub paused: Option<bool>,
}

pub fn handler<'info>(
    ctx: Context<'_, '_, 'info, 'info, UpdateConfig<'info>>,
    params: UpdateConfigParams,
) -> Result<()> {
    let config = &mut ctx.accounts.config;

    if let Some(signer) = params.new_backend_signer {
        // Deactivate old backend MinterRole if passed via remaining_accounts
        let remaining = ctx.remaining_accounts;
        if !remaining.is_empty() {
            let old_role_info = &remaining[0];
            require!(
                old_role_info.owner == ctx.program_id,
                AcademyError::Unauthorized
            );
            let mut old_role = Account::<MinterRole>::try_from(old_role_info)
                .map_err(|_| AcademyError::Unauthorized)?;
            require!(
                old_role.minter == config.backend_signer,
                AcademyError::Unauthorized
            );
            old_role.is_active = false;
            old_role.exit(ctx.program_id)?;
        }

        config.backend_signer = signer;
        emit!(ConfigUpdated {
            field: "backend_signer".to_string(),
            timestamp: Clock::get()?.unix_timestamp,
        });
    }

    if let Some(paused) = params.paused {
        config.paused = paused;
        emit!(MintingPauseSet {
            paused,
            timestamp: Clock::get()?.unix_timestamp,
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
