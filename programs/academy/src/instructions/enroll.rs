use anchor_lang::prelude::*;

use crate::{errors::AcademyError, state::{Course, Enrollment}};

pub fn enroll(ctx: Context<Enroll>, course_id: String) -> Result<()> {
    let course = &ctx.accounts.course;

    require!(course.is_active, AcademyError::CourseNotActive);
    require!(course.course_id == course_id, AcademyError::InvalidCourseId);

    if let Some(prereq_course_key) = course.prerequisite {
        require!(
            ctx.remaining_accounts.len() >= 2,
            AcademyError::MissingPrerequisiteEnrollment
        );

        // Deserialize remaining accounts without Account wrapper to avoid lifetime issues
        let prereq_course_info = &ctx.remaining_accounts[0];
        require_keys_eq!(
            prereq_course_info.key(),
            prereq_course_key,
            AcademyError::PrerequisiteNotMet
        );
        let prereq_course_data = Course::try_deserialize(
            &mut &prereq_course_info.try_borrow_data()?[..],
        )?;

        let prereq_enrollment_info = &ctx.remaining_accounts[1];
        let prereq_enrollment_data = Enrollment::try_deserialize(
            &mut &prereq_enrollment_info.try_borrow_data()?[..],
        )?;
        require!(
            prereq_enrollment_data.course_id == prereq_course_data.course_id,
            AcademyError::PrerequisiteNotMet
        );
        require_keys_eq!(
            prereq_enrollment_data.learner,
            ctx.accounts.learner.key(),
            AcademyError::PrerequisiteNotMet
        );
        require!(
            prereq_enrollment_data.completed_at.is_some(),
            AcademyError::PrerequisiteNotMet
        );
    }

    let enrollment = &mut ctx.accounts.enrollment;
    enrollment.course_id = course_id.clone();
    enrollment.learner = ctx.accounts.learner.key();
    enrollment.lesson_flags = [0u64; 4];
    enrollment.enrolled_at = Clock::get()?.unix_timestamp;
    enrollment.completed_at = None;
    enrollment.credential_asset = None;
    enrollment.bump = ctx.bumps.enrollment;

    emit!(Enrolled {
        learner: ctx.accounts.learner.key(),
        course_id,
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(course_id: String)]
pub struct Enroll<'info> {
    #[account(seeds = [b"course", course_id.as_bytes()], bump = course.bump)]
    pub course: Account<'info, Course>,
    #[account(
        init,
        payer = learner,
        space = 8 + Enrollment::LEN,
        seeds = [b"enrollment", course_id.as_bytes(), learner.key().as_ref()],
        bump
    )]
    pub enrollment: Account<'info, Enrollment>,
    #[account(mut)]
    pub learner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct Enrolled {
    pub learner: Pubkey,
    pub course_id: String,
}
