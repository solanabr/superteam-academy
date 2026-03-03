use anchor_lang::prelude::*;

use crate::{
    errors::AcademyError,
    state::{AchievementType, Config, CreateAchievementTypeParams, MAX_ACHIEVEMENT_ID_LEN, MAX_ACHIEVEMENT_NAME_LEN, MAX_METADATA_URI_LEN},
};

pub fn create_achievement_type(
    ctx: Context<CreateAchievementType>,
    params: CreateAchievementTypeParams,
) -> Result<()> {
    require!(!params.achievement_id.is_empty(), AcademyError::InvalidAchievementId);
    require!(
        params.achievement_id.len() <= MAX_ACHIEVEMENT_ID_LEN,
        AcademyError::InvalidAchievementId
    );
    require!(
        params.name.len() <= MAX_ACHIEVEMENT_NAME_LEN,
        AcademyError::InvalidMetadata
    );
    require!(
        params.metadata_uri.len() <= MAX_METADATA_URI_LEN,
        AcademyError::InvalidMetadata
    );
    require!(params.max_supply > 0, AcademyError::InvalidAmount);

    require_keys_eq!(
        ctx.accounts.authority.key(),
        ctx.accounts.config.authority,
        AcademyError::Unauthorized
    );

    let achievement_type = &mut ctx.accounts.achievement_type;
    achievement_type.achievement_id = params.achievement_id.clone();
    achievement_type.name = params.name;
    achievement_type.metadata_uri = params.metadata_uri;
    achievement_type.collection = ctx.accounts.collection.key();
    achievement_type.current_supply = 0;
    achievement_type.max_supply = params.max_supply;
    achievement_type.xp_reward = params.xp_reward;
    achievement_type.is_active = true;
    achievement_type.created_at = Clock::get()?.unix_timestamp;
    achievement_type.bump = ctx.bumps.achievement_type;

    emit!(AchievementTypeCreated {
        achievement_id: achievement_type.achievement_id.clone(),
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(params: CreateAchievementTypeParams)]
pub struct CreateAchievementType<'info> {
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,
    #[account(
        init,
        payer = payer,
        space = 8 + AchievementType::LEN,
        seeds = [b"achievement", params.achievement_id.as_bytes()],
        bump
    )]
    pub achievement_type: Account<'info, AchievementType>,
    #[account(mut)]
    pub collection: Signer<'info>,
    pub authority: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: Metaplex Core program account is validated by the client/deployment config.
    pub mpl_core_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct AchievementTypeCreated {
    pub achievement_id: String,
}
