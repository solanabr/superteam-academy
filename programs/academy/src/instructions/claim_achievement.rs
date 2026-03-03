use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, TokenAccount};
use crate::state::{Config, LearnerProfile};

pub fn claim_achievement(
    ctx: Context<ClaimAchievementAccounts>,
    achievement_id: u8,
    xp_bonus: u32,
) -> Result<()> {
    let _config = &ctx.accounts.config;
    let learner = &mut ctx.accounts.learner;

    // Validate achievement ID (0-63)
    require!(
        achievement_id < 64,
        crate::errors::AcademyError::InvalidAchievement
    );

    // Check not already claimed
    let flag_set = (learner.achievement_flags >> achievement_id) & 1 == 1;
    require!(
        !flag_set,
        crate::errors::AcademyError::AchievementAlreadyClaimed
    );

    // Set achievement flag
    learner.achievement_flags |= 1u64 << achievement_id;

    // Award XP bonus
    learner.total_xp = learner.total_xp
        .checked_add(xp_bonus)
        .ok_or(crate::errors::AcademyError::ArithmeticOverflow)?;

    msg!("✅ Achievement {} claimed, {} bonus XP awarded", achievement_id, xp_bonus);

    emit!(AchievementClaimedEvent {
        user: ctx.accounts.user.key(),
        achievement_id,
        xp_bonus,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct ClaimAchievementAccounts<'info> {
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub learner: Account<'info, LearnerProfile>,
    pub xp_mint: Account<'info, Mint>,
    pub user_xp_ata: Account<'info, TokenAccount>,
    pub user: Signer<'info>,
    pub token_program: Program<'info, anchor_spl::token::Token>,
}

#[event]
pub struct AchievementClaimedEvent {
    pub user: Pubkey,
    pub achievement_id: u8,
    pub xp_bonus: u32,
}
