use anchor_lang::prelude::*;
use mpl_core::{
    instructions::CreateV2CpiBuilder,
    types::{
        Attribute, Attributes, PermanentFreezeDelegate, Plugin, PluginAuthority,
        PluginAuthorityPair,
    },
};

use crate::errors::AcademyError;
use crate::events::CredentialIssued;
use crate::state::{Config, Course, Enrollment};

pub fn handler(
    ctx: Context<IssueCredential>,
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

    require!(
        enrollment.credential_asset.is_none(),
        AcademyError::CredentialAlreadyIssued
    );

    let config_bump = config.bump;
    let config_seeds: &[&[u8]] = &[b"config", &[config_bump]];
    let signer_seeds = &[config_seeds];

    CreateV2CpiBuilder::new(&ctx.accounts.mpl_core_program.to_account_info())
        .asset(&ctx.accounts.credential_asset.to_account_info())
        .collection(Some(&ctx.accounts.track_collection))
        .payer(&ctx.accounts.payer.to_account_info())
        .owner(Some(&ctx.accounts.learner))
        .authority(Some(&ctx.accounts.config.to_account_info()))
        .system_program(&ctx.accounts.system_program.to_account_info())
        .name(credential_name)
        .uri(metadata_uri)
        .plugins(vec![
            PluginAuthorityPair {
                plugin: Plugin::PermanentFreezeDelegate(PermanentFreezeDelegate { frozen: true }),
                authority: Some(PluginAuthority::UpdateAuthority),
            },
            PluginAuthorityPair {
                plugin: Plugin::Attributes(Attributes {
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
                }),
                authority: Some(PluginAuthority::UpdateAuthority),
            },
        ])
        .invoke_signed(signer_seeds)?;

    let enrollment_mut = &mut ctx.accounts.enrollment;
    enrollment_mut.credential_asset = Some(ctx.accounts.credential_asset.key());

    emit!(CredentialIssued {
        learner: ctx.accounts.learner.key(),
        track_id: course.track_id,
        credential_asset: ctx.accounts.credential_asset.key(),
        current_level: course.track_level,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct IssueCredential<'info> {
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
        mut,
        seeds = [b"enrollment", course.course_id.as_bytes(), learner.key().as_ref()],
        bump = enrollment.bump,
        constraint = enrollment.course == course.key() @ AcademyError::EnrollmentCourseMismatch,
    )]
    pub enrollment: Account<'info, Enrollment>,

    /// CHECK: Tied to enrollment PDA via seeds constraint.
    pub learner: AccountInfo<'info>,

    /// New credential NFT asset keypair — must sign the transaction.
    #[account(mut)]
    pub credential_asset: Signer<'info>,

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
