use anchor_lang::prelude::*;

use crate::events::LearnerInitialized;
use crate::state::LearnerProfile;

#[derive(Accounts)]
pub struct InitLearner<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + LearnerProfile::INIT_SPACE,
        seeds = [b"learner", authority.key().as_ref()],
        bump,
    )]
    pub learner: Account<'info, LearnerProfile>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitLearner>) -> Result<()> {
    let learner = &mut ctx.accounts.learner;
    learner.authority = ctx.accounts.authority.key();
    learner.current_streak = 0;
    learner.longest_streak = 0;
    learner.last_activity_date = 0;
    learner.streak_freezes = 0;
    learner.achievement_flags = [0u64; 4];
    learner.xp_earned_today = 0;
    learner.last_xp_day = 0;
    learner.referral_count = 0;
    learner.has_referrer = false;
    learner._reserved = [0u8; 16];
    learner.bump = ctx.bumps.learner;

    emit!(LearnerInitialized {
        learner: ctx.accounts.authority.key(),
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
