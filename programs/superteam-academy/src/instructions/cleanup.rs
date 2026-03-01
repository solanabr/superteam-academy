use anchor_lang::prelude::*;
use crate::{
    errors::AcademyError,
    state::{Course, Enrollment},
    events::*,
};

#[derive(Accounts)]
pub struct CloseEnrollment<'info> {
    #[account(mut)]
    pub learner: Signer<'info>,
    #[account(
        mut,
        seeds = [b"enrollment", course.course_id.as_bytes(), learner.key().as_ref()],
        bump = enrollment.bump,
        constraint = enrollment.course == course.key() @ AcademyError::EnrollmentCourseMismatch,
        constraint = enrollment.completed_at.is_some() @ AcademyError::CourseNotCompleted,
        close = learner
    )]
    pub enrollment: Account<'info, Enrollment>,
    pub course: Account<'info, Course>,
}

pub fn handler_close_enrollment(ctx: Context<CloseEnrollment>) -> Result<()> {
    let enrollment = &ctx.accounts.enrollment;
    let rent_reclaimed = ctx.accounts.enrollment.to_account_info().lamports();

    emit!(EnrollmentClosed {
        learner: ctx.accounts.learner.key(),
        course: enrollment.course,
        rent_reclaimed,
        timestamp: Clock::get()?.unix_timestamp,
    });

    msg!(
        "Enrollment closed for learner {} in course {} (reclaimed: {} lamports)",
        ctx.accounts.learner.key(),
        ctx.accounts.course.course_id,
        rent_reclaimed
    );

    Ok(())
}
