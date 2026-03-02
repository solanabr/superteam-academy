use anchor_lang::prelude::*;
use mpl_core::{
    instructions::{UpdatePluginV1CpiBuilder, UpdateV1CpiBuilder},
    types::{Attribute, Attributes, Plugin},
};

use crate::errors::AcademyError;
use crate::events::CredentialUpgraded;
use crate::state::{Config, Course, Enrollment};

pub fn handler(
    ctx: Context<UpgradeCredential>,
    credential_name: String,
    metadata_uri: String,
    courses_completed: u32,
    total_xp: u64,
) -> Result<()> {
    let enrollment = &ctx.accounts.enrollment;
    let course = &ctx.accounts.course;
    let config = &ctx.accounts.config;

    require!(
        enrollment.completed_at.is_some(),
        AcademyError::CourseNotFinalized
    );

    let existing_asset = enrollment
        .credential_asset
        .ok_or(AcademyError::CourseNotFinalized)?;

    require!(
        ctx.accounts.credential_asset.key() == existing_asset,
        AcademyError::CredentialAssetMismatch
    );

    let config_bump = config.bump;
    let config_seeds: &[&[u8]] = &[b"config", &[config_bump]];
    let signer_seeds = &[config_seeds];

    UpdateV1CpiBuilder::new(&ctx.accounts.mpl_core_program.to_account_info())
        .asset(&ctx.accounts.credential_asset)
        .collection(Some(&ctx.accounts.track_collection))
        .authority(Some(&ctx.accounts.config.to_account_info()))
        .payer(&ctx.accounts.payer.to_account_info())
        .system_program(&ctx.accounts.system_program.to_account_info())
        .new_name(credential_name)
        .new_uri(metadata_uri)
        .invoke_signed(signer_seeds)?;

    UpdatePluginV1CpiBuilder::new(&ctx.accounts.mpl_core_program.to_account_info())
        .asset(&ctx.accounts.credential_asset)
        .collection(Some(&ctx.accounts.track_collection))
        .authority(Some(&ctx.accounts.config.to_account_info()))
        .payer(&ctx.accounts.payer.to_account_info())
        .system_program(&ctx.accounts.system_program.to_account_info())
        .plugin(Plugin::Attributes(Attributes {
            attribute_list: vec![
                Attribute {
                    key: "track_id".into(),
                    value: course.track_id.to_string(),
                },
                Attribute {
                    key: "level".into(),
                    value: course.track_level.to_string(),
                },
                Attribute {
                    key: "courses_completed".into(),
                    value: courses_completed.to_string(),
                },
                Attribute {
                    key: "total_xp".into(),
                    value: total_xp.to_string(),
                },
            ],
        }))
        .invoke_signed(signer_seeds)?;

    emit!(CredentialUpgraded {
        learner: ctx.accounts.learner.key(),
        track_id: course.track_id,
        credential_asset: ctx.accounts.credential_asset.key(),
        current_level: course.track_level,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct UpgradeCredential<'info> {
    #[account(
        seeds = [b"config"],
        bump = config.bump,
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
    )]
    pub enrollment: Account<'info, Enrollment>,

    /// CHECK: Tied to enrollment PDA via seeds constraint.
    pub learner: AccountInfo<'info>,

    /// Existing credential NFT asset — not a signer, validated against enrollment record.
    /// CHECK: Validated against enrollment.credential_asset.
    #[account(mut)]
    pub credential_asset: AccountInfo<'info>,

    /// CHECK: Metaplex Core collection for this track. Validated by Metaplex Core CPI.
    #[account(mut)]
    pub track_collection: AccountInfo<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        constraint = backend_signer.key() == config.backend_signer @ AcademyError::Unauthorized,
    )]
    pub backend_signer: Signer<'info>,

    /// CHECK: Metaplex Core program.
    #[account(address = mpl_core::ID)]
    pub mpl_core_program: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}
