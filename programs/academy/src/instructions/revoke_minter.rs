use anchor_lang::prelude::*;

use crate::{errors::AcademyError, state::{Config, MinterRole}};

pub fn revoke_minter(ctx: Context<RevokeMinter>) -> Result<()> {
    require_keys_eq!(
        ctx.accounts.authority.key(),
        ctx.accounts.config.authority,
        AcademyError::Unauthorized
    );

    emit!(MinterRevoked {
        minter: ctx.accounts.minter_role.minter,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct RevokeMinter<'info> {
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,
    #[account(
        mut,
        close = authority,
        seeds = [b"minter", minter_role.minter.as_ref()],
        bump = minter_role.bump
    )]
    pub minter_role: Account<'info, MinterRole>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

#[event]
pub struct MinterRevoked {
    pub minter: Pubkey,
}
