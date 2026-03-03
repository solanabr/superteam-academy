use anchor_lang::prelude::*;

use crate::{errors::AcademyError, state::{Config, ConfigUpdate}};

pub fn update_config(ctx: Context<UpdateConfig>, changes: ConfigUpdate) -> Result<()> {
    let config = &mut ctx.accounts.config;

    require_keys_eq!(
        ctx.accounts.authority.key(),
        config.authority,
        AcademyError::Unauthorized
    );

    if let Some(new_backend_signer) = changes.new_backend_signer {
        config.backend_signer = new_backend_signer;
    }

    emit!(crate::instructions::initialize::ConfigUpdated {
        authority: config.authority,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    #[account(mut, seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,
    pub authority: Signer<'info>,
}
