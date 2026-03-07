use anchor_lang::prelude::*;
use mpl_core::accounts::BaseAssetV1;
use mpl_core::types::UpdateAuthority;

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
    //   remaining_accounts[1] = credential NFT (Metaplex Core asset proving completion)
    if let Some(prerequisite_course) = course.prerequisite {
        let remaining = ctx.remaining_accounts;
        require!(remaining.len() >= 2, AcademyError::PrerequisiteNotMet);

        let prereq_course_info = &remaining[0];
        let credential_info = &remaining[1];

        require!(
            prereq_course_info.owner == ctx.program_id,
            AcademyError::PrerequisiteNotMet
        );
        require!(
            prereq_course_info.key() == prerequisite_course,
            AcademyError::PrerequisiteNotMet
        );

        let prereq_course = Account::<Course>::try_from(prereq_course_info)
            .map_err(|_| AcademyError::PrerequisiteNotMet)?;

        // Verify credential is a Metaplex Core asset
        require!(
            credential_info.owner == &mpl_core::ID,
            AcademyError::PrerequisiteNotMet
        );

        // Deserialize credential and verify ownership + collection
        let asset =
            BaseAssetV1::try_from(credential_info).map_err(|_| AcademyError::PrerequisiteNotMet)?;

        require!(
            asset.owner == ctx.accounts.learner.key(),
            AcademyError::PrerequisiteNotMet
        );
        require!(
            asset.update_authority == UpdateAuthority::Collection(prereq_course.track_collection),
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
