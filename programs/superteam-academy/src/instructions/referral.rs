use anchor_lang::prelude::*;
use crate::{
    errors::AcademyError,
    state::LearnerProfile,
    events::*,
};

#[derive(Accounts)]
pub struct RegisterReferral<'info> {
    #[account(mut)]
    pub referee: Signer<'info>,
    /// CHECK: Referrer account - must have a learner profile
    pub referrer: AccountInfo<'info>,
    #[account(
        mut,
        seeds = [b"learner", referee.key().as_ref()],
        bump = referee_profile.bump,
        constraint = !referee_profile.has_referrer @ AcademyError::AlreadyReferred
    )]
    pub referee_profile: Account<'info, LearnerProfile>,
    #[account(
        mut,
        seeds = [b"learner", referrer.key().as_ref()],
        bump = referrer_profile.bump
    )]
    pub referrer_profile: Account<'info, LearnerProfile>,
}

pub fn handler_register_referral(ctx: Context<RegisterReferral>) -> Result<()> {
    let referee_key = ctx.accounts.referee.key();
    let referrer_key = ctx.accounts.referrer.key();

    // Prevent self-referral
    require!(
        referee_key != referrer_key,
        AcademyError::SelfReferral
    );

    let referee_profile = &mut ctx.accounts.referee_profile;
    let referrer_profile = &mut ctx.accounts.referrer_profile;

    // Mark referee as having a referrer
    referee_profile.has_referrer = true;

    // Increment referrer's count
    referrer_profile.referral_count = referrer_profile.referral_count
        .checked_add(1)
        .ok_or(AcademyError::MathOverflow)?;

    emit!(ReferralRegistered {
        referrer: referrer_key,
        referee: referee_key,
        timestamp: Clock::get()?.unix_timestamp,
    });

    msg!(
        "Referral registered: {} referred by {}",
        referee_key,
        referrer_key
    );

    Ok(())
}
