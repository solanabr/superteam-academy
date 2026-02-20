use anchor_lang::prelude::*;

use crate::errors::AcademyError;
use crate::events::MinterRegistered;
use crate::state::{minter_role::MAX_LABEL_LEN, Config, MinterRole};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct RegisterMinterParams {
    pub minter: Pubkey,
    pub label: String,
    pub max_xp_per_call: u64,
}

pub fn handler(ctx: Context<RegisterMinter>, params: RegisterMinterParams) -> Result<()> {
    require!(
        params.label.len() <= MAX_LABEL_LEN,
        AcademyError::LabelTooLong
    );

    let role = &mut ctx.accounts.minter_role;
    role.minter = params.minter;
    role.label = params.label.clone();
    role.max_xp_per_call = params.max_xp_per_call;
    role.total_xp_minted = 0;
    role.is_active = true;
    role.created_at = Clock::get()?.unix_timestamp;
    role._reserved = [0u8; 8];
    role.bump = ctx.bumps.minter_role;

    emit!(MinterRegistered {
        minter: params.minter,
        label: params.label,
        max_xp_per_call: params.max_xp_per_call,
        timestamp: role.created_at,
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(params: RegisterMinterParams)]
pub struct RegisterMinter<'info> {
    #[account(
        seeds = [b"config"],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,

    #[account(
        init,
        payer = payer,
        space = MinterRole::SIZE,
        seeds = [b"minter", params.minter.as_ref()],
        bump,
    )]
    pub minter_role: Account<'info, MinterRole>,

    #[account(
        mut,
        constraint = authority.key() == config.authority @ AcademyError::Unauthorized,
    )]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}
