use anchor_lang::prelude::*;

use crate::{errors::AcademyError, state::{Course, Enrollment}};

const INCOMPLETE_CLOSE_COOLDOWN_SECS: i64 = 24 * 60 * 60;

pub fn close_enrollment(ctx: Context<CloseEnrollment>) -> Result<()> {
    let course = &ctx.accounts.course;
    let enrollment = &ctx.accounts.enrollment;

    require!(enrollment.course_id == course.course_id, AcademyError::InvalidCourseId);
    require_keys_eq!(
        enrollment.learner,
        ctx.accounts.learner.key(),
        AcademyError::Unauthorized
    );

    if enrollment.completed_at.is_none() {
        let now = Clock::get()?.unix_timestamp;
        let elapsed = now.saturating_sub(enrollment.enrolled_at);
        require!(
            elapsed >= INCOMPLETE_CLOSE_COOLDOWN_SECS,
            AcademyError::UnenrollCooldown
        );
    }

    emit!(EnrollmentClosed {
        learner: ctx.accounts.learner.key(),
        course_id: enrollment.course_id.clone(),
    });

    Ok(())
}

#[derive(Accounts)]
pub struct CloseEnrollment<'info> {
    #[account(seeds = [b"course", course.course_id.as_bytes()], bump = course.bump)]
    pub course: Account<'info, Course>,
    #[account(
        mut,
        close = learner,
        seeds = [b"enrollment", enrollment.course_id.as_bytes(), learner.key().as_ref()],
        bump = enrollment.bump
    )]
    pub enrollment: Account<'info, Enrollment>,
    #[account(mut)]
    pub learner: Signer<'info>,
}

#[event]
pub struct EnrollmentClosed {
    pub learner: Pubkey,
    pub course_id: String,
}
