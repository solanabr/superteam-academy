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

    // Prerequisite check via remaining accounts:
    //   remaining_accounts[0] = prerequisite Course PDA
    //   remaining_accounts[1] = prerequisite Enrollment PDA (must belong to this learner)
    if let Some(prerequisite_course) = course.prerequisite {
        let remaining = ctx.remaining_accounts;
        require!(remaining.len() >= 2, AcademyError::PrerequisiteNotMet);

        let prereq_course_info = &remaining[0];
        let prereq_enrollment_info = &remaining[1];

        require!(
            prereq_course_info.owner == ctx.program_id,
            AcademyError::PrerequisiteNotMet
        );
        require!(
            prereq_enrollment_info.owner == ctx.program_id,
            AcademyError::PrerequisiteNotMet
        );

        // Verify the prerequisite course account matches
        require!(
            prereq_course_info.key() == prerequisite_course,
            AcademyError::PrerequisiteNotMet
        );
        let prereq_course = Account::<Course>::try_from(prereq_course_info)
            .map_err(|_| AcademyError::PrerequisiteNotMet)?;

        let prereq_enrollment = Account::<Enrollment>::try_from(prereq_enrollment_info)
            .map_err(|_| AcademyError::PrerequisiteNotMet)?;

        require!(
            prereq_enrollment.course == prerequisite_course,
            AcademyError::PrerequisiteNotMet
        );
        require!(
            prereq_enrollment.completed_at.is_some(),
            AcademyError::PrerequisiteNotMet
        );

        // Verify the enrollment PDA belongs to this learner via seed derivation
        let (expected_pda, _) = Pubkey::find_program_address(
            &[
                b"enrollment",
                prereq_course.course_id.as_bytes(),
                ctx.accounts.learner.key().as_ref(),
            ],
            ctx.program_id,
        );
        require!(
            prereq_enrollment_info.key() == expected_pda,
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
