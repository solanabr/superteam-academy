use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

use crate::{
    errors::AcademyError,
    state::{AchievementReceipt, AchievementType, Config, I80F48, MinterRole},
    utils::{checked_add_i80, mint_xp},
};

pub fn award_achievement(ctx: Context<AwardAchievement>) -> Result<()> {
    let achievement_type = &mut ctx.accounts.achievement_type;

    require!(achievement_type.is_active, AcademyError::AchievementNotActive);
    require!(
        achievement_type.current_supply < achievement_type.max_supply,
        AcademyError::AchievementSupplyExhausted
    );
    require!(ctx.accounts.minter_role.is_active, AcademyError::MinterNotActive);

    require_keys_eq!(
        ctx.accounts.collection.key(),
        achievement_type.collection,
        AcademyError::InvalidMetadata
    );
    require_keys_eq!(
        ctx.accounts.xp_mint.key(),
        ctx.accounts.config.xp_mint,
        AcademyError::MintMismatch
    );
    require_keys_eq!(
        ctx.accounts.recipient_token_account.owner,
        ctx.accounts.recipient.key(),
        AcademyError::InvalidTokenAccount
    );
    require_keys_eq!(
        ctx.accounts.recipient_token_account.mint,
        ctx.accounts.xp_mint.key(),
        AcademyError::MintMismatch
    );

    let receipt = &mut ctx.accounts.achievement_receipt;
    receipt.achievement_id = achievement_type.achievement_id.clone();
    receipt.recipient = ctx.accounts.recipient.key();
    receipt.asset = ctx.accounts.asset.key();
    receipt.awarded_at = Clock::get()?.unix_timestamp;
    receipt.bump = ctx.bumps.achievement_receipt;

    achievement_type.current_supply = achievement_type
        .current_supply
        .checked_add(1)
        .ok_or_else(|| error!(AcademyError::Overflow))?;

    let xp_reward = achievement_type.xp_reward as u64;
    mint_xp(
        &ctx.accounts.config,
        &ctx.accounts.xp_mint,
        &ctx.accounts.recipient_token_account,
        &ctx.accounts.token_program,
        xp_reward,
    )?;

    ctx.accounts.minter_role.total_xp_minted = checked_add_i80(
        ctx.accounts.minter_role.total_xp_minted,
        I80F48::from_u64(xp_reward),
    )?;

    // Metaplex Core NFT mint CPI is intentionally left as integration hook.

    emit!(AchievementAwarded {
        achievement_id: receipt.achievement_id.clone(),
        recipient: receipt.recipient,
        asset: receipt.asset,
        xp_reward: achievement_type.xp_reward,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct AwardAchievement<'info> {
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,
    #[account(
        mut,
        seeds = [b"achievement", achievement_type.achievement_id.as_bytes()],
        bump = achievement_type.bump
    )]
    pub achievement_type: Account<'info, AchievementType>,
    #[account(
        init,
        payer = payer,
        space = 8 + AchievementReceipt::LEN,
        seeds = [
            b"achievement_receipt",
            achievement_type.achievement_id.as_bytes(),
            recipient.key().as_ref()
        ],
        bump
    )]
    pub achievement_receipt: Account<'info, AchievementReceipt>,
    #[account(
        mut,
        seeds = [b"minter", minter.key().as_ref()],
        bump = minter_role.bump,
        constraint = minter_role.minter == minter.key() @ AcademyError::MinterRoleMismatch,
    )]
    pub minter_role: Account<'info, MinterRole>,
    #[account(mut)]
    pub asset: Signer<'info>,
    /// CHECK: Verified against achievement_type.collection in handler.
    pub collection: UncheckedAccount<'info>,
    /// CHECK: Recipient pubkey used for receipt seed and ATA ownership checks.
    pub recipient: UncheckedAccount<'info>,
    #[account(mut)]
    pub recipient_token_account: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub xp_mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub minter: Signer<'info>,
    /// CHECK: Metaplex Core program account passed through to integration CPI.
    pub mpl_core_program: UncheckedAccount<'info>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct AchievementAwarded {
    pub achievement_id: String,
    pub recipient: Pubkey,
    pub asset: Pubkey,
    pub xp_reward: u32,
}
