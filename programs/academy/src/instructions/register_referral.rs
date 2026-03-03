use anchor_lang::prelude::*;
use crate::state::LearnerProfile;

pub fn register_referral(ctx: Context<RegisterReferralAccounts>) -> Result<()> {
    let referrer = &mut ctx.accounts.referrer;
    let referred = &mut ctx.accounts.referred;

    // Mark referred as having a referrer
    require!(
        !referred.has_referrer,
        crate::errors::AcademyError::UnauthorizedSigner
    );

    referred.has_referrer = true;
    referrer.referral_count = referrer.referral_count
        .checked_add(1)
        .ok_or(crate::errors::AcademyError::ArithmeticOverflow)?;

    msg!("✅ Referral registered: {} referred {}", referrer.user, referred.user);

    emit!(ReferralRegisteredEvent {
        referrer: referrer.user,
        referred: referred.user,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct RegisterReferralAccounts<'info> {
    #[account(mut)]
    pub referrer: Account<'info, LearnerProfile>,
    #[account(mut)]
    pub referred: Account<'info, LearnerProfile>,
    pub signer: Signer<'info>,
}

#[event]
pub struct ReferralRegisteredEvent {
    pub referrer: Pubkey,
    pub referred: Pubkey,
}
