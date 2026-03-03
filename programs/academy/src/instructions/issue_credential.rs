use anchor_lang::prelude::*;

use crate::{errors::AcademyError, state::{Config, Course, Enrollment, I80F48}};

pub fn issue_credential(
    ctx: Context<IssueCredential>,
    _credential_name: String,
    _metadata_uri: String,
    _courses_completed: u32,
    _total_xp: I80F48,
) -> Result<()> {
    require_keys_eq!(
        ctx.accounts.backend_signer.key(),
        ctx.accounts.config.backend_signer,
        AcademyError::BackendSignerMismatch
    );

    let enrollment = &mut ctx.accounts.enrollment;
    require!(
        enrollment.course_id == ctx.accounts.course.course_id,
        AcademyError::InvalidCourseId
    );
    require_keys_eq!(
        enrollment.learner,
        ctx.accounts.learner.key(),
        AcademyError::Unauthorized
    );
    require!(
        enrollment.completed_at.is_some(),
        AcademyError::CourseNotFinalized
    );

    enrollment.credential_asset = Some(ctx.accounts.credential_asset.key());

    // Metaplex Core mint CPI is intentionally left as integration hook.
    // Account wiring matches the spec so this can be swapped to a CPI call.

    emit!(CredentialIssued {
        learner: ctx.accounts.learner.key(),
        asset: ctx.accounts.credential_asset.key(),
    });

    Ok(())
}

#[derive(Accounts)]
pub struct IssueCredential<'info> {
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,
    #[account(seeds = [b"course", course.course_id.as_bytes()], bump = course.bump)]
    pub course: Account<'info, Course>,
    #[account(
        mut,
        seeds = [b"enrollment", enrollment.course_id.as_bytes(), learner.key().as_ref()],
        bump = enrollment.bump
    )]
    pub enrollment: Account<'info, Enrollment>,
    /// CHECK: Learner pubkey used for ownership checks and enrollment seed validation.
    pub learner: UncheckedAccount<'info>,
    #[account(mut)]
    pub credential_asset: Signer<'info>,
    /// CHECK: Metaplex Core collection account passed through to integration CPI.
    pub track_collection: UncheckedAccount<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub backend_signer: Signer<'info>,
    /// CHECK: Metaplex Core program account passed through to integration CPI.
    pub mpl_core_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct CredentialIssued {
    pub learner: Pubkey,
    pub asset: Pubkey,
}
