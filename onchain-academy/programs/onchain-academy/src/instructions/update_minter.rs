use anchor_lang::prelude::*;

use crate::errors::AcademyError;
use crate::events::MinterUpdated;
use crate::state::{Config, MinterRole};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdateMinterParams {
    /// New per-call XP cap. 0 = unlimited.
    pub max_xp_per_call: u64,
    /// New cumulative XP ceiling. 0 = unlimited. Setting this at or below the
    /// role's existing total_xp_minted freezes the role from further minting,
    /// which is a valid way to retire a minter without closing its PDA.
    pub max_total_xp: u64,
}

pub fn handler(ctx: Context<UpdateMinter>, params: UpdateMinterParams) -> Result<()> {
    let role = &mut ctx.accounts.minter_role;
    role.max_xp_per_call = params.max_xp_per_call;
    role.max_total_xp = params.max_total_xp;

    emit!(MinterUpdated {
        minter: role.minter,
        max_xp_per_call: role.max_xp_per_call,
        max_total_xp: role.max_total_xp,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct UpdateMinter<'info> {
    #[account(
        seeds = [b"config"],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,

    #[account(
        mut,
        seeds = [b"minter", minter_role.minter.as_ref()],
        bump = minter_role.bump,
    )]
    pub minter_role: Account<'info, MinterRole>,

    #[account(
        constraint = authority.key() == config.authority @ AcademyError::Unauthorized,
    )]
    pub authority: Signer<'info>,
}
