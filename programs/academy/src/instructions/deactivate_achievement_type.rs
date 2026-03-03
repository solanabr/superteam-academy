use anchor_lang::prelude::*;

use crate::{errors::AcademyError, state::{AchievementType, Config}};

pub fn deactivate_achievement_type(ctx: Context<DeactivateAchievementType>) -> Result<()> {
    require_keys_eq!(
        ctx.accounts.authority.key(),
        ctx.accounts.config.authority,
        AcademyError::Unauthorized
    );

    let achievement_type = &mut ctx.accounts.achievement_type;
    achievement_type.is_active = false;

    emit!(AchievementTypeDeactivated {
        achievement_id: achievement_type.achievement_id.clone(),
    });

    Ok(())
}

#[derive(Accounts)]
pub struct DeactivateAchievementType<'info> {
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,
    #[account(
        mut,
        seeds = [b"achievement", achievement_type.achievement_id.as_bytes()],
        bump = achievement_type.bump
    )]
    pub achievement_type: Account<'info, AchievementType>,
    pub authority: Signer<'info>,
}

#[event]
pub struct AchievementTypeDeactivated {
    pub achievement_id: String,
}
