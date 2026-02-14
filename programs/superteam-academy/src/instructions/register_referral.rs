use anchor_lang::prelude::*;

use crate::errors::AcademyError;
use crate::state::LearnerProfile;

#[derive(Accounts)]
pub struct RegisterReferral<'info> {
    #[account(
        mut,
        seeds = [b"learner", referee.key().as_ref()],
        bump = referee_profile.bump,
        constraint = !referee_profile.has_referrer @ AcademyError::AlreadyReferred,
    )]
    pub referee_profile: Account<'info, LearnerProfile>,

    #[account(
        mut,
        seeds = [b"learner", referrer.key().as_ref()],
        bump = referrer_profile.bump,
    )]
    pub referrer_profile: Account<'info, LearnerProfile>,

    /// The referee (the learner who is registering a referrer)
    #[account(
        constraint = referee.key() != referrer.key() @ AcademyError::SelfReferral,
    )]
    pub referee: Signer<'info>,

    /// CHECK: The referrer wallet. Validated via referrer_profile PDA seeds.
    pub referrer: AccountInfo<'info>,
}

pub fn handler(ctx: Context<RegisterReferral>) -> Result<()> {
    let referee_profile = &mut ctx.accounts.referee_profile;
    let referrer_profile = &mut ctx.accounts.referrer_profile;

    referee_profile.has_referrer = true;

    referrer_profile.referral_count = referrer_profile
        .referral_count
        .checked_add(1)
        .ok_or(AcademyError::ArithmeticOverflow)?;

    let now = Clock::get()?.unix_timestamp;

    emit!(ReferralRegistered {
        referrer: ctx.accounts.referrer.key(),
        referee: ctx.accounts.referee.key(),
        timestamp: now,
    });

    Ok(())
}

#[event]
pub struct ReferralRegistered {
    pub referrer: Pubkey,
    pub referee: Pubkey,
    pub timestamp: i64,
}
