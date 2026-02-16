use anchor_lang::prelude::*;

use crate::errors::AcademyError;
use crate::events::Enrolled;
use crate::state::{Course, Enrollment};

pub fn handler<'info>(
    ctx: Context<'_, '_, 'info, 'info, Enroll<'info>>,
    _course_id: String,
) -> Result<()> {
    let course = &mut ctx.accounts.course;
    let enrollment = &mut ctx.accounts.enrollment;
    let now = Clock::get()?.unix_timestamp;

    require!(course.is_active, AcademyError::CourseNotActive);

    // Prerequisite check via remaining accounts
    if let Some(prerequisite_course) = course.prerequisite {
        let remaining = ctx.remaining_accounts;
        require!(!remaining.is_empty(), AcademyError::PrerequisiteNotMet);

        let prereq_account = &remaining[0];

        let prereq_enrollment = Account::<Enrollment>::try_from(prereq_account)
            .map_err(|_| AcademyError::PrerequisiteNotMet)?;

        require!(
            prereq_enrollment.course == prerequisite_course,
            AcademyError::PrerequisiteNotMet
        );
        require!(
            prereq_enrollment.completed_at.is_some(),
            AcademyError::PrerequisiteNotMet
        );

        require!(
            prereq_account.owner == ctx.program_id,
            AcademyError::PrerequisiteNotMet
        );
    }

    enrollment.course = course.key();
    enrollment.enrolled_at = now;
    enrollment.completed_at = None;
    enrollment.lesson_flags = [0u64; 4];
    enrollment.credential_asset = None;
    enrollment._reserved = [0u8; 4];
    enrollment.bump = ctx.bumps.enrollment;

    course.total_enrollments = course
        .total_enrollments
        .checked_add(1)
        .ok_or(AcademyError::Overflow)?;

    emit!(Enrolled {
        learner: ctx.accounts.learner.key(),
        course: course.key(),
        course_version: course.version,
        timestamp: now,
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(course_id: String)]
pub struct Enroll<'info> {
    #[account(
        mut,
        seeds = [b"course", course_id.as_bytes()],
        bump = course.bump,
    )]
    pub course: Account<'info, Course>,

    #[account(
        init,
        payer = learner,
        space = Enrollment::SIZE,
        seeds = [b"enrollment", course_id.as_bytes(), learner.key().as_ref()],
        bump,
    )]
    pub enrollment: Account<'info, Enrollment>,

    #[account(mut)]
    pub learner: Signer<'info>,

    pub system_program: Program<'info, System>,
}
