use anchor_lang::prelude::*;
use mpl_core::instructions::CreateCollectionV2CpiBuilder;

use crate::errors::AcademyError;
use crate::events::AchievementTypeCreated;
use crate::state::{
    achievement_type::{MAX_ACHIEVEMENT_ID_LEN, MAX_ACHIEVEMENT_NAME_LEN, MAX_ACHIEVEMENT_URI_LEN},
    AchievementType, Config,
};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CreateAchievementTypeParams {
    pub achievement_id: String,
    pub name: String,
    pub metadata_uri: String,
    pub max_supply: u32,
    pub xp_reward: u32,
}

pub fn handler(
    ctx: Context<CreateAchievementType>,
    params: CreateAchievementTypeParams,
) -> Result<()> {
    require!(
        !params.achievement_id.is_empty() && params.achievement_id.len() <= MAX_ACHIEVEMENT_ID_LEN,
        AcademyError::AchievementIdTooLong
    );
    require!(
        !params.name.is_empty() && params.name.len() <= MAX_ACHIEVEMENT_NAME_LEN,
        AcademyError::AchievementNameTooLong
    );
    require!(
        !params.metadata_uri.is_empty() && params.metadata_uri.len() <= MAX_ACHIEVEMENT_URI_LEN,
        AcademyError::AchievementUriTooLong
    );
    require!(params.xp_reward > 0, AcademyError::InvalidXpReward);
    // max_supply: 0 = unlimited, >0 = capped supply

    let config = &ctx.accounts.config;
    let config_seeds: &[&[u8]] = &[b"config", &[config.bump]];
    let signer_seeds = &[config_seeds];

    // Create Metaplex Core collection for this achievement type
    CreateCollectionV2CpiBuilder::new(&ctx.accounts.mpl_core_program.to_account_info())
        .collection(&ctx.accounts.collection.to_account_info())
        .payer(&ctx.accounts.payer.to_account_info())
        .update_authority(Some(&ctx.accounts.config.to_account_info()))
        .system_program(&ctx.accounts.system_program.to_account_info())
        .name(params.name.clone())
        .uri(params.metadata_uri.clone())
        .invoke_signed(signer_seeds)?;

    let achievement = &mut ctx.accounts.achievement_type;
    achievement.achievement_id = params.achievement_id;
    achievement.name = params.name;
    achievement.metadata_uri = params.metadata_uri;
    achievement.collection = ctx.accounts.collection.key();
    achievement.creator = ctx.accounts.authority.key();
    achievement.max_supply = params.max_supply;
    achievement.current_supply = 0;
    achievement.xp_reward = params.xp_reward;
    achievement.is_active = true;
    achievement.created_at = Clock::get()?.unix_timestamp;
    achievement._reserved = [0u8; 8];
    achievement.bump = ctx.bumps.achievement_type;

    emit!(AchievementTypeCreated {
        achievement_id: achievement.achievement_id.clone(),
        collection: achievement.collection,
        creator: achievement.creator,
        max_supply: achievement.max_supply,
        xp_reward: achievement.xp_reward,
        timestamp: achievement.created_at,
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(params: CreateAchievementTypeParams)]
pub struct CreateAchievementType<'info> {
    #[account(
        seeds = [b"config"],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,

    #[account(
        init,
        payer = payer,
        space = AchievementType::SIZE,
        seeds = [b"achievement", params.achievement_id.as_bytes()],
        bump,
    )]
    pub achievement_type: Account<'info, AchievementType>,

    /// New Metaplex Core collection keypair
    #[account(mut)]
    pub collection: Signer<'info>,

    #[account(
        constraint = authority.key() == config.authority @ AcademyError::Unauthorized,
    )]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: Metaplex Core program.
    #[account(address = mpl_core::ID)]
    pub mpl_core_program: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}
