use anchor_lang::prelude::*;

use crate::errors::AcademyError;
use crate::state::Enrollment;

#[derive(Accounts)]
#[instruction(course_id: String)]
pub struct Unenroll<'info> {
    #[account(
        mut,
        close = learner,
        seeds = [b"enrollment", course_id.as_bytes(), learner.key().as_ref()],
        bump = enrollment.bump,
    )]
    pub enrollment: Account<'info, Enrollment>,

    #[account(mut)]
    pub learner: Signer<'info>,
}

pub fn handler(ctx: Context<Unenroll>, _course_id: String) -> Result<()> {
    let enrollment = &ctx.accounts.enrollment;

    // Cannot unenroll completed courses (use close_enrollment instead)
    require!(
        enrollment.completed_at.is_none(),
        AcademyError::CourseAlreadyCompleted
    );

    // 24-hour cooldown: prevent enroll/unenroll spam
    let now = Clock::get()?.unix_timestamp;
    require!(
        now.checked_sub(enrollment.enrolled_at)
            .ok_or(AcademyError::ArithmeticOverflow)?
            > 86400,
        AcademyError::UnenrollCooldown
    );

    emit!(Unenrolled {
        learner: ctx.accounts.learner.key(),
        course: enrollment.course,
        timestamp: now,
    });

    Ok(())
}

#[event]
pub struct Unenrolled {
    pub learner: Pubkey,
    pub course: Pubkey,
    pub timestamp: i64,
}
