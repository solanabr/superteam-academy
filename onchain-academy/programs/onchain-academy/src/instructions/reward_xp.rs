use anchor_lang::prelude::*;

use crate::errors::AcademyError;
use crate::events::XpRewarded;
use crate::state::{Config, MinterRole};
use crate::utils::mint_xp;

pub fn handler(ctx: Context<RewardXp>, amount: u64, memo: String) -> Result<()> {
    let role = &ctx.accounts.minter_role;

    require!(role.is_active, AcademyError::MinterNotActive);
    require!(amount > 0, AcademyError::InvalidAmount);

    if role.max_xp_per_call > 0 {
        require!(
            amount <= role.max_xp_per_call,
            AcademyError::MinterAmountExceeded
        );
    }

    let config = &ctx.accounts.config;
    let config_seeds: &[&[u8]] = &[b"config", &[config.bump]];

    mint_xp(
        &ctx.accounts.xp_mint.to_account_info(),
        &ctx.accounts.recipient_token_account.to_account_info(),
        &ctx.accounts.config.to_account_info(),
        &ctx.accounts.token_program,
        config_seeds,
        amount,
    )?;

    let role_mut = &mut ctx.accounts.minter_role;
    role_mut.total_xp_minted = role_mut
        .total_xp_minted
        .checked_add(amount)
        .ok_or(AcademyError::Overflow)?;

    emit!(XpRewarded {
        minter: ctx.accounts.minter.key(),
        recipient: ctx.accounts.recipient_token_account.key(),
        amount,
        memo,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct RewardXp<'info> {
    #[account(
        seeds = [b"config"],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,

    #[account(
        mut,
        seeds = [b"minter", minter.key().as_ref()],
        bump = minter_role.bump,
        constraint = minter_role.minter == minter.key() @ AcademyError::Unauthorized,
    )]
    pub minter_role: Account<'info, MinterRole>,

    /// Token-2022 XP mint
    /// CHECK: Validated against config.xp_mint.
    #[account(
        mut,
        constraint = xp_mint.key() == config.xp_mint @ AcademyError::Unauthorized,
    )]
    pub xp_mint: AccountInfo<'info>,

    /// Recipient's Token-2022 ATA for XP
    /// CHECK: Validated by Token-2022 CPI.
    #[account(mut)]
    pub recipient_token_account: AccountInfo<'info>,

    pub minter: Signer<'info>,

    /// CHECK: Validated by address constraint.
    #[account(address = spl_token_2022::id())]
    pub token_program: AccountInfo<'info>,
}
