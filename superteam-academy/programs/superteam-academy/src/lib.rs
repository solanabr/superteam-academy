use anchor_lang::prelude::*;

declare_id!("DFB44LZedVS461TK6kv4o9U28ALuhJF26N5V9yRyCvtZ");

const CONFIG_SEED: &[u8] = b"config";
const LEARNER_SEED: &[u8] = b"learner";
const COURSE_SEED: &[u8] = b"course";
const ENROLLMENT_SEED: &[u8] = b"enrollment";

#[program]
pub mod superteam_academy {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        backend_signer: Pubkey,
        authority: Pubkey,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.authority = authority;
        config.backend_signer = backend_signer;
        config.current_season = 1;
        config.current_mint = Pubkey::default();
        config.season_closed = false;
        config.bump = ctx.bumps.config;
        Ok(())
    }

    pub fn create_season(ctx: Context<AdminAction>, mint: Pubkey) -> Result<()> {
        let config = &mut ctx.accounts.config;
        require_keys_eq!(
            ctx.accounts.authority.key(),
            config.authority,
            AcademyError::UnauthorizedAuthority
        );
        require!(!config.season_closed, AcademyError::SeasonAlreadyClosed);
        config.current_season = config
            .current_season
            .checked_add(1)
            .ok_or(AcademyError::MathOverflow)?;
        config.current_mint = mint;
        config.season_closed = false;
        emit!(SeasonCreated {
            season: config.current_season,
            mint,
        });
        Ok(())
    }

    pub fn close_season(ctx: Context<AdminAction>) -> Result<()> {
        let config = &mut ctx.accounts.config;
        require_keys_eq!(
            ctx.accounts.authority.key(),
            config.authority,
            AcademyError::UnauthorizedAuthority
        );
        config.season_closed = true;
        Ok(())
    }

    pub fn update_config(
        ctx: Context<AdminAction>,
        new_authority: Option<Pubkey>,
        new_backend_signer: Option<Pubkey>,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        require_keys_eq!(
            ctx.accounts.authority.key(),
            config.authority,
            AcademyError::UnauthorizedAuthority
        );
        if let Some(authority) = new_authority {
            config.authority = authority;
        }
        if let Some(backend_signer) = new_backend_signer {
            config.backend_signer = backend_signer;
        }
        Ok(())
    }

    pub fn init_learner(ctx: Context<InitLearner>) -> Result<()> {
        let learner = &mut ctx.accounts.learner;
        learner.authority = ctx.accounts.user.key();
        learner.level = 1;
        learner.xp_total = 0;
        learner.streak_current = 0;
        learner.streak_longest = 0;
        learner.last_activity_ts = 0;
        learner.profile_asset = None;
        learner.bump = ctx.bumps.learner;
        Ok(())
    }

    pub fn create_course(
        ctx: Context<CreateCourse>,
        course_id: String,
        lessons_count: u16,
        track_id: u16,
    ) -> Result<()> {
        require!(
            !course_id.is_empty() && course_id.len() <= 64,
            AcademyError::InvalidCourseId
        );
        require_keys_eq!(
            ctx.accounts.authority.key(),
            ctx.accounts.config.authority,
            AcademyError::UnauthorizedAuthority
        );
        let course = &mut ctx.accounts.course;
        course.course_id = course_id;
        course.authority = ctx.accounts.authority.key();
        course.lessons_count = lessons_count;
        course.track_id = track_id;
        course.is_active = true;
        course.total_completions = 0;
        course.bump = ctx.bumps.course;
        Ok(())
    }

    pub fn update_course(
        ctx: Context<UpdateCourse>,
        lessons_count: Option<u16>,
        is_active: Option<bool>,
    ) -> Result<()> {
        let course = &mut ctx.accounts.course;
        require_keys_eq!(
            ctx.accounts.authority.key(),
            course.authority,
            AcademyError::UnauthorizedAuthority
        );
        if let Some(next_lessons_count) = lessons_count {
            course.lessons_count = next_lessons_count;
        }
        if let Some(next_is_active) = is_active {
            course.is_active = next_is_active;
        }
        Ok(())
    }

    pub fn enroll(ctx: Context<Enroll>) -> Result<()> {
        require!(ctx.accounts.course.is_active, AcademyError::CourseInactive);
        let enrollment = &mut ctx.accounts.enrollment;
        enrollment.course = ctx.accounts.course.key();
        enrollment.user = ctx.accounts.user.key();
        enrollment.lessons_completed = 0;
        enrollment.completed_at = None;
        enrollment.credential_asset = None;
        enrollment.current_level = 0;
        enrollment.revoked = false;
        enrollment.revocation_reason = 0;
        enrollment.bump = ctx.bumps.enrollment;
        Ok(())
    }

    pub fn complete_lesson(ctx: Context<BackendAction>) -> Result<()> {
        require_keys_eq!(
            ctx.accounts.backend_signer.key(),
            ctx.accounts.config.backend_signer,
            AcademyError::UnauthorizedBackendSigner
        );
        let enrollment = &mut ctx.accounts.enrollment;
        require!(
            enrollment.completed_at.is_none(),
            AcademyError::EnrollmentAlreadyCompleted
        );
        enrollment.lessons_completed = enrollment
            .lessons_completed
            .checked_add(1)
            .ok_or(AcademyError::MathOverflow)?;

        let learner = &mut ctx.accounts.learner;
        learner.xp_total = learner
            .xp_total
            .checked_add(50)
            .ok_or(AcademyError::MathOverflow)?;
        learner.last_activity_ts = Clock::get()?.unix_timestamp;
        Ok(())
    }

    pub fn finalize_course(ctx: Context<BackendAction>) -> Result<()> {
        require_keys_eq!(
            ctx.accounts.backend_signer.key(),
            ctx.accounts.config.backend_signer,
            AcademyError::UnauthorizedBackendSigner
        );
        let enrollment = &mut ctx.accounts.enrollment;
        require!(
            enrollment.lessons_completed >= ctx.accounts.course.lessons_count,
            AcademyError::CourseNotComplete
        );
        enrollment.completed_at = Some(Clock::get()?.unix_timestamp);
        let course = &mut ctx.accounts.course;
        course.total_completions = course
            .total_completions
            .checked_add(1)
            .ok_or(AcademyError::MathOverflow)?;
        Ok(())
    }

    pub fn issue_credential(
        ctx: Context<IssueCredential>,
        _metadata_uri: String,
        level: u8,
    ) -> Result<()> {
        require_keys_eq!(
            ctx.accounts.backend_signer.key(),
            ctx.accounts.config.backend_signer,
            AcademyError::UnauthorizedBackendSigner
        );
        let enrollment = &mut ctx.accounts.enrollment;
        require!(
            enrollment.completed_at.is_some(),
            AcademyError::FinalizeBeforeIssueRequired
        );
        if enrollment.credential_asset.is_none() {
            enrollment.credential_asset = Some(ctx.accounts.credential_asset.key());
            emit!(CredentialIssued {
                user: enrollment.user,
                course: enrollment.course,
                credential_asset: ctx.accounts.credential_asset.key(),
                credential_created: true,
                credential_upgraded: false,
                current_level: level,
                timestamp: Clock::get()?.unix_timestamp,
            });
        } else {
            emit!(CredentialIssued {
                user: enrollment.user,
                course: enrollment.course,
                credential_asset: enrollment.credential_asset.unwrap_or_default(),
                credential_created: false,
                credential_upgraded: true,
                current_level: level,
                timestamp: Clock::get()?.unix_timestamp,
            });
        }
        enrollment.current_level = level;
        Ok(())
    }

    pub fn revoke_certificate(ctx: Context<IssueCredential>, reason_code: u8) -> Result<()> {
        require_keys_eq!(
            ctx.accounts.backend_signer.key(),
            ctx.accounts.config.backend_signer,
            AcademyError::UnauthorizedBackendSigner
        );
        let enrollment = &mut ctx.accounts.enrollment;
        require!(
            enrollment.credential_asset.is_some(),
            AcademyError::CredentialMissing
        );
        enrollment.revoked = true;
        enrollment.revocation_reason = reason_code;
        emit!(CertificateRevoked {
            user: enrollment.user,
            course: enrollment.course,
            credential_asset: enrollment.credential_asset.unwrap_or_default(),
            reason_code,
            timestamp: Clock::get()?.unix_timestamp,
        });
        Ok(())
    }

    pub fn issue_profile_sbt(ctx: Context<IssueProfileSbt>, profile_asset: Pubkey) -> Result<()> {
        require_keys_eq!(
            ctx.accounts.backend_signer.key(),
            ctx.accounts.config.backend_signer,
            AcademyError::UnauthorizedBackendSigner
        );
        let learner = &mut ctx.accounts.learner;
        require!(
            learner.profile_asset.is_none(),
            AcademyError::ProfileAlreadyIssued
        );
        learner.profile_asset = Some(profile_asset);
        emit!(ProfileSbtIssued {
            user: learner.authority,
            profile_asset,
            timestamp: Clock::get()?.unix_timestamp,
        });
        Ok(())
    }

    pub fn update_profile_sbt(ctx: Context<IssueProfileSbt>, _metadata_uri: String) -> Result<()> {
        require_keys_eq!(
            ctx.accounts.backend_signer.key(),
            ctx.accounts.config.backend_signer,
            AcademyError::UnauthorizedBackendSigner
        );
        let learner = &ctx.accounts.learner;
        require!(
            learner.profile_asset.is_some(),
            AcademyError::ProfileMissing
        );
        emit!(ProfileSbtUpdated {
            user: learner.authority,
            profile_asset: learner.profile_asset.unwrap_or_default(),
            timestamp: Clock::get()?.unix_timestamp,
        });
        Ok(())
    }
}

#[account]
pub struct Config {
    pub authority: Pubkey,
    pub backend_signer: Pubkey,
    pub current_season: u16,
    pub current_mint: Pubkey,
    pub season_closed: bool,
    pub bump: u8,
}

impl Config {
    pub const LEN: usize = 32 + 32 + 2 + 32 + 1 + 1;
}

#[account]
pub struct LearnerProfile {
    pub authority: Pubkey,
    pub level: u16,
    pub xp_total: u64,
    pub streak_current: u16,
    pub streak_longest: u16,
    pub last_activity_ts: i64,
    pub profile_asset: Option<Pubkey>,
    pub bump: u8,
}

impl LearnerProfile {
    pub const LEN: usize = 32 + 2 + 8 + 2 + 2 + 8 + 1 + 32 + 1;
}

#[account]
pub struct Course {
    pub course_id: String,
    pub authority: Pubkey,
    pub lessons_count: u16,
    pub track_id: u16,
    pub is_active: bool,
    pub total_completions: u64,
    pub bump: u8,
}

impl Course {
    pub const MAX_ID_LEN: usize = 64;
    pub const LEN: usize = 4 + Self::MAX_ID_LEN + 32 + 2 + 2 + 1 + 8 + 1;
}

#[account]
pub struct Enrollment {
    pub course: Pubkey,
    pub user: Pubkey,
    pub lessons_completed: u16,
    pub completed_at: Option<i64>,
    pub credential_asset: Option<Pubkey>,
    pub current_level: u8,
    pub revoked: bool,
    pub revocation_reason: u8,
    pub bump: u8,
}

impl Enrollment {
    pub const LEN: usize = 32 + 32 + 2 + 1 + 8 + 1 + 32 + 1 + 1 + 1 + 1;
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = payer,
        seeds = [CONFIG_SEED],
        bump,
        space = 8 + Config::LEN
    )]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AdminAction<'info> {
    #[account(mut, seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, Config>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct InitLearner<'info> {
    #[account(
        init,
        payer = user,
        seeds = [LEARNER_SEED, user.key().as_ref()],
        bump,
        space = 8 + LearnerProfile::LEN
    )]
    pub learner: Account<'info, LearnerProfile>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(course_id: String)]
pub struct CreateCourse<'info> {
    #[account(mut, seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, Config>,
    #[account(
        init,
        payer = authority,
        seeds = [COURSE_SEED, course_id.as_bytes()],
        bump,
        space = 8 + Course::LEN
    )]
    pub course: Account<'info, Course>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateCourse<'info> {
    #[account(mut)]
    pub course: Account<'info, Course>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct Enroll<'info> {
    #[account(mut)]
    pub course: Account<'info, Course>,
    #[account(
        init,
        payer = user,
        seeds = [ENROLLMENT_SEED, course.key().as_ref(), user.key().as_ref()],
        bump,
        space = 8 + Enrollment::LEN
    )]
    pub enrollment: Account<'info, Enrollment>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BackendAction<'info> {
    #[account(seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub learner: Account<'info, LearnerProfile>,
    #[account(mut)]
    pub course: Account<'info, Course>,
    #[account(mut)]
    pub enrollment: Account<'info, Enrollment>,
    pub backend_signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct IssueCredential<'info> {
    #[account(seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub course: Account<'info, Course>,
    #[account(mut)]
    pub enrollment: Account<'info, Enrollment>,
    /// CHECK: Metaplex Core asset account is validated by CPI in full implementation.
    pub credential_asset: UncheckedAccount<'info>,
    pub backend_signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct IssueProfileSbt<'info> {
    #[account(seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub learner: Account<'info, LearnerProfile>,
    pub backend_signer: Signer<'info>,
}

#[event]
pub struct SeasonCreated {
    pub season: u16,
    pub mint: Pubkey,
}

#[event]
pub struct CredentialIssued {
    pub user: Pubkey,
    pub course: Pubkey,
    pub credential_asset: Pubkey,
    pub credential_created: bool,
    pub credential_upgraded: bool,
    pub current_level: u8,
    pub timestamp: i64,
}

#[event]
pub struct CertificateRevoked {
    pub user: Pubkey,
    pub course: Pubkey,
    pub credential_asset: Pubkey,
    pub reason_code: u8,
    pub timestamp: i64,
}

#[event]
pub struct ProfileSbtIssued {
    pub user: Pubkey,
    pub profile_asset: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct ProfileSbtUpdated {
    pub user: Pubkey,
    pub profile_asset: Pubkey,
    pub timestamp: i64,
}

#[error_code]
pub enum AcademyError {
    #[msg("Math overflow.")]
    MathOverflow,
    #[msg("Season is already closed.")]
    SeasonAlreadyClosed,
    #[msg("Invalid course id.")]
    InvalidCourseId,
    #[msg("Course is inactive.")]
    CourseInactive,
    #[msg("Enrollment already completed.")]
    EnrollmentAlreadyCompleted,
    #[msg("Course lessons are not fully complete.")]
    CourseNotComplete,
    #[msg("Course must be finalized before issuing a credential.")]
    FinalizeBeforeIssueRequired,
    #[msg("Credential is missing.")]
    CredentialMissing,
    #[msg("Profile SBT already issued.")]
    ProfileAlreadyIssued,
    #[msg("Profile SBT missing.")]
    ProfileMissing,
    #[msg("Unauthorized authority.")]
    UnauthorizedAuthority,
    #[msg("Unauthorized backend signer.")]
    UnauthorizedBackendSigner,
}
