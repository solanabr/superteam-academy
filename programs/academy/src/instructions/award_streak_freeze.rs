use anchor_lang::prelude::*;
use crate::state::LearnerProfile;

pub fn award_streak_freeze(ctx: Context<AwardStreakFreezeAccounts>) -> Result<()> {
    let learner = &mut ctx.accounts.learner;

    // Add streak freeze (max 3)
    learner.streak_freezes = std::cmp::min(learner.streak_freezes + 1, 3);

    msg!("✅ Streak freeze awarded to {}", ctx.accounts.user.key());

    emit!(StreakFreezeAwardedEvent {
        user: ctx.accounts.user.key(),
        freezes_remaining: learner.streak_freezes,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct AwardStreakFreezeAccounts<'info> {
    #[account(mut)]
    pub learner: Account<'info, LearnerProfile>,
    pub user: Signer<'info>,
}

#[event]
pub struct StreakFreezeAwardedEvent {
    pub user: Pubkey,
    pub freezes_remaining: u8,
}
