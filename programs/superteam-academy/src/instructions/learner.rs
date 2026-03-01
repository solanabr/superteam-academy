use anchor_lang::prelude::*;
use crate::{state::LearnerProfile, events::*};

#[derive(Accounts)]
pub struct InitLearner<'info> {
    #[account(mut)]
    pub learner: Signer<'info>,
    #[account(
        init,
        payer = learner,
        space = LearnerProfile::SIZE,
        seeds = [b"learner", learner.key().as_ref()],
        bump
    )]
    pub learner_profile: Account<'info, LearnerProfile>,
    pub system_program: Program<'info, System>,
}

pub fn handler_init_learner(ctx: Context<InitLearner>) -> Result<()> {
    let profile = &mut ctx.accounts.learner_profile;
    let learner_key = ctx.accounts.learner.key();
    let bump = ctx.bumps.learner_profile;

    profile.authority = learner_key;
    profile.current_streak = 0;
    profile.longest_streak = 0;
    profile.last_activity_date = 0;
    profile.streak_freezes = 0;
    profile.achievement_flags = [0u64; 4];
    profile.xp_earned_today = 0;
    profile.last_xp_day = 0;
    profile.referral_count = 0;
    profile.has_referrer = false;
    profile._reserved = [0u8; 16];
    profile.bump = bump;

    emit!(LearnerInitialized {
        learner: learner_key,
        timestamp: Clock::get()?.unix_timestamp,
    });

    msg!("Initialized learner profile for {}", learner_key);

    Ok(())
}
