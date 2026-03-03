use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

use crate::{
    errors::AcademyError,
    state::{Config, I80F48, MinterRole},
    utils::{checked_add_i80, i80_to_u32, mint_xp},
};

pub fn reward_xp(ctx: Context<RewardXp>, amount: I80F48, reason: String) -> Result<()> {
    require!(ctx.accounts.minter_role.is_active, AcademyError::MinterNotActive);
    require!(amount.value > 0, AcademyError::InvalidAmount);

    let amount_u64 = amount.as_u64()?;
    let max_u64 = ctx.accounts.minter_role.max_xp_per_call.as_u64()?;
    require!(amount_u64 <= max_u64, AcademyError::MinterAmountExceeded);

    require_keys_eq!(
        ctx.accounts.xp_mint.key(),
        ctx.accounts.config.xp_mint,
        AcademyError::MintMismatch
    );
    require_keys_eq!(
        ctx.accounts.recipient_token_account.mint,
        ctx.accounts.xp_mint.key(),
        AcademyError::MintMismatch
    );

    mint_xp(
        &ctx.accounts.config,
        &ctx.accounts.xp_mint,
        &ctx.accounts.recipient_token_account,
        &ctx.accounts.token_program,
        amount_u64,
    )?;

    ctx.accounts.minter_role.total_xp_minted = checked_add_i80(
        ctx.accounts.minter_role.total_xp_minted,
        amount,
    )?;

    emit!(XpRewarded {
        recipient: ctx.accounts.recipient_token_account.owner,
        amount: i80_to_u32(amount)?,
        reason,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct RewardXp<'info> {
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,
    #[account(
        mut,
        seeds = [b"minter", minter.key().as_ref()],
        bump = minter_role.bump,
        constraint = minter_role.minter == minter.key() @ AcademyError::MinterRoleMismatch,
    )]
    pub minter_role: Account<'info, MinterRole>,
    #[account(mut)]
    pub xp_mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub recipient_token_account: InterfaceAccount<'info, TokenAccount>,
    pub minter: Signer<'info>,
    pub token_program: Interface<'info, TokenInterface>,
}

#[event]
pub struct XpRewarded {
    pub recipient: Pubkey,
    pub amount: u32,
    pub reason: String,
}
