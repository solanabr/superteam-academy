use anchor_lang::prelude::*;
use crate::state::LearnerProfile;

pub fn init_learner(ctx: Context<InitLearnerAccounts>) -> Result<()> {
    let learner = &mut ctx.accounts.learner;
    
    learner.user = ctx.accounts.user.key();
    learner.total_xp = 0;
    learner.season_xp = 0;
    learner.xp_earned_today = 0;
    learner.last_activity = Clock::get()?.unix_timestamp;
    learner.current_streak = 0;
    learner.longest_streak = 0;
    learner.streak_freezes = 0;
    learner.achievement_flags = 0;
    learner.courses_completed = 0;
    learner.has_referrer = false;
    learner.referral_count = 0;
    learner.bump = ctx.bumps.learner;

    msg!("✅ Learner profile initialized for: {}", ctx.accounts.user.key());
    Ok(())
}

#[derive(Accounts)]
pub struct InitLearnerAccounts<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 300,
        seeds = [b"learner", user.key().as_ref()],
        bump
    )]
    pub learner: Account<'info, LearnerProfile>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}
