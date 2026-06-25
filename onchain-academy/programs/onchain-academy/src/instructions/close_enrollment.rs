use anchor_lang::prelude::*;

use crate::errors::AcademyError;
use crate::events::EnrollmentClosed;
use crate::state::{Course, Enrollment};

pub fn handler(ctx: Context<CloseEnrollment>) -> Result<()> {
    let enrollment = &ctx.accounts.enrollment;
    let now = Clock::get()?.unix_timestamp;

    // Finalized or credentialed enrollments are permanent replay guards: closing
    // them frees the PDA seeds, letting the learner re-enroll and re-earn XP /
    // re-mint a credential. Only the legitimate incomplete-unenroll path may close.
    require!(
        enrollment.completed_at.is_none() && enrollment.credential_asset.is_none(),
        AcademyError::EnrollmentFinalized
    );

    let elapsed = now
        .checked_sub(enrollment.enrolled_at)
        .ok_or(AcademyError::Overflow)?;
    require!(elapsed > 86400, AcademyError::UnenrollCooldown);

    let rent_reclaimed = ctx.accounts.enrollment.to_account_info().lamports();

    emit!(EnrollmentClosed {
        learner: ctx.accounts.learner.key(),
        course: enrollment.course,
        // Only incomplete enrollments are closable now; finalized/credentialed
        // ones are rejected above, so a closed enrollment is never completed.
        completed: false,
        rent_reclaimed,
        timestamp: now,
    });

    // Anchor's close = learner constraint handles zeroing data + returning rent
    Ok(())
}

#[derive(Accounts)]
pub struct CloseEnrollment<'info> {
    #[account(
        seeds = [b"course", course.course_id.as_bytes()],
        bump = course.bump,
    )]
    pub course: Account<'info, Course>,

    #[account(
        mut,
        seeds = [b"enrollment", course.course_id.as_bytes(), learner.key().as_ref()],
        bump = enrollment.bump,
        constraint = enrollment.course == course.key() @ AcademyError::EnrollmentCourseMismatch,
        close = learner,
    )]
    pub enrollment: Account<'info, Enrollment>,

    #[account(mut)]
    pub learner: Signer<'info>,
}
