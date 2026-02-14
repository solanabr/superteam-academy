use anchor_lang::prelude::*;

use crate::errors::AcademyError;
use crate::state::{Course, Enrollment};

#[derive(Accounts)]
#[instruction(course_id: String)]
pub struct Enroll<'info> {
    #[account(
        mut,
        seeds = [b"course", course_id.as_bytes()],
        bump = course.bump,
        constraint = course.is_active @ AcademyError::CourseNotActive,
    )]
    pub course: Account<'info, Course>,

    #[account(
        init,
        payer = learner,
        space = 8 + Enrollment::INIT_SPACE,
        seeds = [b"enrollment", course_id.as_bytes(), learner.key().as_ref()],
        bump,
    )]
    pub enrollment: Account<'info, Enrollment>,

    /// If the course has a prerequisite, the learner must have a completed
    /// enrollment for that prerequisite course. Optional -- only required
    /// when course.prerequisite is Some.
    pub prerequisite_enrollment: Option<Account<'info, Enrollment>>,

    #[account(mut)]
    pub learner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Enroll>, _course_id: String) -> Result<()> {
    let course = &mut ctx.accounts.course;

    // Prerequisite check
    if let Some(prereq_course_key) = course.prerequisite {
        let prereq_enrollment = ctx
            .accounts
            .prerequisite_enrollment
            .as_ref()
            .ok_or(AcademyError::PrerequisiteNotMet)?;

        require!(
            prereq_enrollment.course == prereq_course_key,
            AcademyError::EnrollmentCourseMismatch
        );
        require!(
            prereq_enrollment.completed_at.is_some(),
            AcademyError::PrerequisiteNotMet
        );
    }

    let now = Clock::get()?.unix_timestamp;

    // Increment total enrollments
    course.total_enrollments = course
        .total_enrollments
        .checked_add(1)
        .ok_or(AcademyError::ArithmeticOverflow)?;

    let enrollment = &mut ctx.accounts.enrollment;
    enrollment.course = course.key();
    enrollment.enrolled_version = course.version;
    enrollment.enrolled_at = now;
    enrollment.completed_at = None;
    enrollment.lesson_flags = [0u64; 4];
    enrollment.bump = ctx.bumps.enrollment;

    emit!(Enrolled {
        learner: ctx.accounts.learner.key(),
        course: course.key(),
        course_version: course.version,
        timestamp: now,
    });

    Ok(())
}

#[event]
pub struct Enrolled {
    pub learner: Pubkey,
    pub course: Pubkey,
    pub course_version: u16,
    pub timestamp: i64,
}
