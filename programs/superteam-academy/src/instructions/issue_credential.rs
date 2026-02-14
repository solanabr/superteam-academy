use anchor_lang::prelude::*;

use crate::errors::AcademyError;
use crate::state::{Config, Course, Enrollment};

/// Stubbed for MVP. In production, this will use Light Protocol ZK Compression
/// to create or upgrade compressed credential accounts. For now, it simply
/// validates the enrollment is finalized and emits an event.
#[derive(Accounts)]
pub struct IssueCredential<'info> {
    #[account(
        seeds = [b"config"],
        bump = config.bump,
        constraint = config.backend_signer == backend_signer.key() @ AcademyError::Unauthorized,
    )]
    pub config: Account<'info, Config>,

    #[account(
        seeds = [b"course", course.course_id.as_bytes()],
        bump = course.bump,
    )]
    pub course: Account<'info, Course>,

    #[account(
        seeds = [b"enrollment", course.course_id.as_bytes(), learner.key().as_ref()],
        bump = enrollment.bump,
        constraint = enrollment.course == course.key() @ AcademyError::EnrollmentCourseMismatch,
        constraint = enrollment.completed_at.is_some() @ AcademyError::CourseNotFinalized,
    )]
    pub enrollment: Account<'info, Enrollment>,

    /// CHECK: The learner wallet. Validated via enrollment PDA seeds.
    pub learner: AccountInfo<'info>,

    pub backend_signer: Signer<'info>,
}

pub fn handler(ctx: Context<IssueCredential>) -> Result<()> {
    let course = &ctx.accounts.course;
    let now = Clock::get()?.unix_timestamp;

    emit!(CredentialIssued {
        learner: ctx.accounts.learner.key(),
        track_id: course.track_id,
        credential_created: true,
        credential_upgraded: false,
        current_level: course.track_level,
        timestamp: now,
    });

    Ok(())
}

#[event]
pub struct CredentialIssued {
    pub learner: Pubkey,
    pub track_id: u16,
    pub credential_created: bool,
    pub credential_upgraded: bool,
    pub current_level: u8,
    pub timestamp: i64,
}
