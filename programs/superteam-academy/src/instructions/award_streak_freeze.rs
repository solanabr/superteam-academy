use anchor_lang::prelude::*;

use crate::errors::AcademyError;
use crate::state::{Config, LearnerProfile};

#[derive(Accounts)]
pub struct AwardStreakFreeze<'info> {
    #[account(
        seeds = [b"config"],
        bump = config.bump,
        constraint = config.backend_signer == backend_signer.key() @ AcademyError::Unauthorized,
    )]
    pub config: Account<'info, Config>,

    #[account(
        mut,
        seeds = [b"learner", learner.key().as_ref()],
        bump = learner_profile.bump,
    )]
    pub learner_profile: Account<'info, LearnerProfile>,

    /// CHECK: The learner wallet. Validated via PDA seeds.
    pub learner: AccountInfo<'info>,

    pub backend_signer: Signer<'info>,
}

pub fn handler(ctx: Context<AwardStreakFreeze>) -> Result<()> {
    let learner_profile = &mut ctx.accounts.learner_profile;

    learner_profile.streak_freezes = learner_profile
        .streak_freezes
        .checked_add(1)
        .ok_or(AcademyError::ArithmeticOverflow)?;

    let now = Clock::get()?.unix_timestamp;

    emit!(StreakFreezeAwarded {
        learner: learner_profile.authority,
        freezes_remaining: learner_profile.streak_freezes,
        timestamp: now,
    });

    Ok(())
}

#[event]
pub struct StreakFreezeAwarded {
    pub learner: Pubkey,
    pub freezes_remaining: u8,
    pub timestamp: i64,
}
