use anchor_lang::prelude::*;
use mpl_core::{
    instructions::CreateV2CpiBuilder,
    types::{
        Attribute, Attributes, PermanentFreezeDelegate, Plugin, PluginAuthority,
        PluginAuthorityPair,
    },
};

use crate::errors::AcademyError;
use crate::events::AchievementAwarded;
use crate::state::{AchievementReceipt, AchievementType, Config, MinterRole};
use crate::utils::mint_xp;

pub fn handler(ctx: Context<AwardAchievement>) -> Result<()> {
    let achievement = &ctx.accounts.achievement_type;
    let role = &ctx.accounts.minter_role;

    require!(achievement.is_active, AcademyError::AchievementNotActive);
    require!(role.is_active, AcademyError::MinterNotActive);

    if achievement.max_supply > 0 {
        require!(
            achievement.current_supply < achievement.max_supply,
            AcademyError::AchievementSupplyExhausted
        );
    }

    let config = &ctx.accounts.config;
    let config_seeds: &[&[u8]] = &[b"config", &[config.bump]];
    let signer_seeds = &[config_seeds];

    let next_supply = achievement
        .current_supply
        .checked_add(1)
        .ok_or(AcademyError::Overflow)?;

    // Mint soulbound achievement NFT
    CreateV2CpiBuilder::new(&ctx.accounts.mpl_core_program.to_account_info())
        .asset(&ctx.accounts.asset.to_account_info())
        .collection(Some(&ctx.accounts.collection.to_account_info()))
        .payer(&ctx.accounts.payer.to_account_info())
        .owner(Some(&ctx.accounts.recipient.to_account_info()))
        .authority(Some(&ctx.accounts.config.to_account_info()))
        .system_program(&ctx.accounts.system_program.to_account_info())
        .name(achievement.name.clone())
        .uri(achievement.metadata_uri.clone())
        .plugins(vec![
            PluginAuthorityPair {
                plugin: Plugin::PermanentFreezeDelegate(PermanentFreezeDelegate { frozen: true }),
                authority: Some(PluginAuthority::UpdateAuthority),
            },
            PluginAuthorityPair {
                plugin: Plugin::Attributes(Attributes {
                    attribute_list: vec![
                        Attribute {
                            key: "achievement_id".into(),
                            value: achievement.achievement_id.clone(),
                        },
                        Attribute {
                            key: "supply_number".into(),
                            value: next_supply.to_string(),
                        },
                    ],
                }),
                authority: Some(PluginAuthority::UpdateAuthority),
            },
        ])
        .invoke_signed(signer_seeds)?;

    // Mint XP if xp_reward > 0
    if achievement.xp_reward > 0 {
        mint_xp(
            &ctx.accounts.xp_mint.to_account_info(),
            &ctx.accounts.recipient_token_account.to_account_info(),
            &ctx.accounts.config.to_account_info(),
            &ctx.accounts.token_program,
            config_seeds,
            achievement.xp_reward as u64,
        )?;
    }

    let now = Clock::get()?.unix_timestamp;

    // Update achievement supply
    let achievement_mut = &mut ctx.accounts.achievement_type;
    achievement_mut.current_supply = next_supply;

    // Update minter stats
    let role_mut = &mut ctx.accounts.minter_role;
    if achievement_mut.xp_reward > 0 {
        role_mut.total_xp_minted = role_mut
            .total_xp_minted
            .checked_add(achievement_mut.xp_reward as u64)
            .ok_or(AcademyError::Overflow)?;
    }

    // Initialize receipt
    let receipt = &mut ctx.accounts.achievement_receipt;
    receipt.asset = ctx.accounts.asset.key();
    receipt.awarded_at = now;
    receipt.bump = ctx.bumps.achievement_receipt;

    emit!(AchievementAwarded {
        achievement_id: achievement_mut.achievement_id.clone(),
        recipient: ctx.accounts.recipient.key(),
        asset: ctx.accounts.asset.key(),
        xp_reward: achievement_mut.xp_reward,
        timestamp: now,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct AwardAchievement<'info> {
    #[account(
        seeds = [b"config"],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,

    #[account(
        mut,
        seeds = [b"achievement", achievement_type.achievement_id.as_bytes()],
        bump = achievement_type.bump,
    )]
    pub achievement_type: Account<'info, AchievementType>,

    #[account(
        init,
        payer = payer,
        space = AchievementReceipt::SIZE,
        seeds = [
            b"achievement_receipt",
            achievement_type.achievement_id.as_bytes(),
            recipient.key().as_ref(),
        ],
        bump,
    )]
    pub achievement_receipt: Account<'info, AchievementReceipt>,

    #[account(
        mut,
        seeds = [b"minter", minter.key().as_ref()],
        bump = minter_role.bump,
        constraint = minter_role.minter == minter.key() @ AcademyError::Unauthorized,
    )]
    pub minter_role: Account<'info, MinterRole>,

    /// New achievement NFT keypair
    #[account(mut)]
    pub asset: Signer<'info>,

    /// CHECK: Metaplex Core collection for this achievement. Validated by CPI.
    #[account(
        mut,
        constraint = collection.key() == achievement_type.collection @ AcademyError::Unauthorized,
    )]
    pub collection: AccountInfo<'info>,

    /// CHECK: Recipient of the achievement NFT.
    pub recipient: AccountInfo<'info>,

    /// CHECK: Recipient's Token-2022 ATA. Only used if xp_reward > 0. Validated by CPI.
    #[account(mut)]
    pub recipient_token_account: AccountInfo<'info>,

    /// CHECK: XP mint. Only used if xp_reward > 0. Validated against config.
    #[account(
        mut,
        constraint = xp_mint.key() == config.xp_mint @ AcademyError::Unauthorized,
    )]
    pub xp_mint: AccountInfo<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub minter: Signer<'info>,

    /// CHECK: Metaplex Core program.
    #[account(address = mpl_core::ID)]
    pub mpl_core_program: AccountInfo<'info>,

    /// CHECK: Token-2022 program.
    #[account(address = spl_token_2022::id())]
    pub token_program: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}
