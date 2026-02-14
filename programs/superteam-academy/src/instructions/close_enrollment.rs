use anchor_lang::prelude::*;

use crate::errors::AcademyError;
use crate::state::Enrollment;

#[derive(Accounts)]
#[instruction(course_id: String)]
pub struct CloseEnrollment<'info> {
    #[account(
        mut,
        close = learner,
        seeds = [b"enrollment", course_id.as_bytes(), learner.key().as_ref()],
        bump = enrollment.bump,
        constraint = enrollment.completed_at.is_some() @ AcademyError::CourseNotCompleted,
    )]
    pub enrollment: Account<'info, Enrollment>,

    #[account(mut)]
    pub learner: Signer<'info>,
}

pub fn handler(ctx: Context<CloseEnrollment>, _course_id: String) -> Result<()> {
    let enrollment = &ctx.accounts.enrollment;
    let now = Clock::get()?.unix_timestamp;

    emit!(EnrollmentClosed {
        learner: ctx.accounts.learner.key(),
        course: enrollment.course,
        rent_reclaimed: ctx.accounts.enrollment.to_account_info().lamports(),
        timestamp: now,
    });

    Ok(())
}

#[event]
pub struct EnrollmentClosed {
    pub learner: Pubkey,
    pub course: Pubkey,
    pub rent_reclaimed: u64,
    pub timestamp: i64,
}
