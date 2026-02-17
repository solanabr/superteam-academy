use anchor_lang::prelude::*;

use crate::errors::AcademyError;
use crate::events::AchievementTypeDeactivated;
use crate::state::{AchievementType, Config};

pub fn handler(ctx: Context<DeactivateAchievementType>) -> Result<()> {
    let achievement = &mut ctx.accounts.achievement_type;
    achievement.is_active = false;

    emit!(AchievementTypeDeactivated {
        achievement_id: achievement.achievement_id.clone(),
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct DeactivateAchievementType<'info> {
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
        constraint = authority.key() == config.authority @ AcademyError::Unauthorized,
    )]
    pub authority: Signer<'info>,
}
