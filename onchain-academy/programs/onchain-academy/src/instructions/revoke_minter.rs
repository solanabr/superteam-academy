use anchor_lang::prelude::*;

use crate::errors::AcademyError;
use crate::events::MinterRevoked;
use crate::state::{Config, MinterRole};

pub fn handler(ctx: Context<RevokeMinter>) -> Result<()> {
    let role = &ctx.accounts.minter_role;

    emit!(MinterRevoked {
        minter: role.minter,
        total_xp_minted: role.total_xp_minted,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct RevokeMinter<'info> {
    #[account(
        seeds = [b"config"],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,

    #[account(
        mut,
        close = authority,
        seeds = [b"minter", minter_role.minter.as_ref()],
        bump = minter_role.bump,
    )]
    pub minter_role: Account<'info, MinterRole>,

    #[account(
        mut,
        constraint = authority.key() == config.authority @ AcademyError::Unauthorized,
    )]
    pub authority: Signer<'info>,
}
