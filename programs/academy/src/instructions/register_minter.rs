use anchor_lang::prelude::*;

use crate::{
    errors::AcademyError,
    state::{Config, MinterRole, RegisterMinterParams, MAX_MINTER_LABEL_LEN},
};

pub fn register_minter(ctx: Context<RegisterMinter>, params: RegisterMinterParams) -> Result<()> {
    require!(
        params.label.len() <= MAX_MINTER_LABEL_LEN,
        AcademyError::InvalidMetadata
    );

    require_keys_eq!(
        ctx.accounts.authority.key(),
        ctx.accounts.config.authority,
        AcademyError::Unauthorized
    );

    let minter_role = &mut ctx.accounts.minter_role;
    minter_role.minter = params.minter;
    minter_role.label = params.label.clone();
    minter_role.max_xp_per_call = params.max_xp_per_call;
    minter_role.total_xp_minted = crate::state::I80F48 { value: 0 };
    minter_role.is_active = true;
    minter_role.created_at = Clock::get()?.unix_timestamp;
    minter_role.bump = ctx.bumps.minter_role;

    emit!(MinterRegistered {
        minter: minter_role.minter,
        label: minter_role.label.clone(),
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(params: RegisterMinterParams)]
pub struct RegisterMinter<'info> {
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,
    #[account(
        init,
        payer = payer,
        space = 8 + MinterRole::LEN,
        seeds = [b"minter", params.minter.as_ref()],
        bump
    )]
    pub minter_role: Account<'info, MinterRole>,
    pub authority: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct MinterRegistered {
    pub minter: Pubkey,
    pub label: String,
}
