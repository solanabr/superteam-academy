use anchor_lang::prelude::*;
use crate::{
    errors::AcademyError,
    state::{Config, Course, Enrollment, Credential, CredentialData},
    events::*,
};

#[derive(Accounts)]
pub struct IssueCredential<'info> {
    /// CHECK: Verified against config.backend_signer
    #[account(mut)]
    pub backend_signer: Signer<'info>,
    #[account(
        seeds = [Config::SEED],
        bump = config.bump,
        has_one = backend_signer @ AcademyError::Unauthorized
    )]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub learner: SystemAccount<'info>,
    #[account(
        mut,
        constraint = course.is_active @ AcademyError::CourseNotActive
    )]
    pub course: Account<'info, Course>,
    #[account(
        seeds = [b"enrollment", course.course_id.as_bytes(), learner.key().as_ref()],
        bump = enrollment.bump,
        constraint = enrollment.course == course.key() @ AcademyError::EnrollmentCourseMismatch,
        constraint = enrollment.completed_at.is_some() @ AcademyError::CourseNotFinalized
    )]
    pub enrollment: Account<'info, Enrollment>,
    /// CHECK: Optional existing credential for this track (for upgrades)
    pub existing_credential: Option<Account<'info, Credential>>,
    #[account(
        init_if_needed,
        payer = backend_signer,
        space = Credential::SIZE,
        seeds = [b"credential", learner.key().as_ref(), &course.track_id.to_le_bytes()],
        bump
    )]
    pub credential: Account<'info, Credential>,
    pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct IssueCredentialParams {
    /// Arweave metadata hash for the new/updated credential
    pub metadata_hash: [u8; 32],
    /// Whether this is creating a new credential or upgrading existing
    pub is_upgrade: bool,
}

pub fn handler_issue_credential(
    ctx: Context<IssueCredential>,
    params: IssueCredentialParams,
) -> Result<()> {
    let course = &ctx.accounts.course;
    let enrollment = &ctx.accounts.enrollment;
    let credential = &mut ctx.accounts.credential;
    let bump = ctx.bumps.credential;
    let now = Clock::get()?.unix_timestamp;

    // Double-check course is finalized (enrollment constraint enforces this too)
    require!(
        enrollment.completed_at.is_some(),
        AcademyError::CourseNotFinalized
    );

    let (credential_created, credential_upgraded) = if params.is_upgrade {
        // Upgrade existing credential
        require!(
            credential.learner == ctx.accounts.learner.key(),
            AcademyError::Unauthorized
        );
        require!(
            credential.track_id == course.track_id,
            AcademyError::Unauthorized
        );

        // Update to higher level if this course is higher
        if course.track_level > credential.current_level {
            credential.current_level = course.track_level;
        }

        (false, true)
    } else {
        // Create new credential for this track
        credential.learner = ctx.accounts.learner.key();
        credential.track_id = course.track_id;
        credential.current_level = course.track_level;
        credential.bump = bump;

        (true, false)
    };

    // Build credential data for ZK compression (this would be passed to Light Protocol CPI)
    let credential_data = CredentialData {
        learner: ctx.accounts.learner.key(),
        track_id: course.track_id,
        current_level: credential.current_level,
        courses_completed: if credential_upgraded { 
            // Would need to fetch from existing compressed state
            1 
        } else { 
            1 
        },
        total_xp_earned: course.xp_total,
        first_earned: if credential_created { now } else { now }, // Would fetch from existing for upgrades
        last_updated: now,
        metadata_hash: params.metadata_hash,
    };

    // TODO: Light Protocol ZK Compression CPI
    // This would call LightSystemProgram to create/update compressed account
    // For now, we store in regular PDA for hackathon demo
    // Future: migrate to actual ZK compressed state
    msg!("Credential data prepared for track {} level {}", 
        credential_data.track_id, 
        credential_data.current_level
    );
    msg!("Metadata hash: {:?}", credential_data.metadata_hash);

    emit!(CredentialIssued {
        learner: ctx.accounts.learner.key(),
        track_id: course.track_id,
        credential_created,
        credential_upgraded,
        current_level: credential.current_level,
        timestamp: now,
    });

    msg!(
        "Issued {} credential for learner {} in track {} (level {})",
        if credential_upgraded { "upgraded" } else { "new" },
        ctx.accounts.learner.key(),
        course.track_id,
        credential.current_level
    );

    Ok(())
}
