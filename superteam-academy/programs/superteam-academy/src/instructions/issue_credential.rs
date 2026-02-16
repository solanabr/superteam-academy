use anchor_lang::prelude::*;
use mpl_core::{
    instructions::{CreateV2CpiBuilder, UpdatePluginV1CpiBuilder, UpdateV1CpiBuilder},
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
) -> Result<()> {
    let enrollment = &ctx.accounts.enrollment;
    let course = &ctx.accounts.course;
    let config = &ctx.accounts.config;

    require!(
        enrollment.completed_at.is_some(),
        AcademyError::CourseNotFinalized
    );

    let config_bump = config.bump;
    let config_seeds: &[&[u8]] = &[b"config", &[config_bump]];
    let signer_seeds = &[config_seeds];

    let is_create = enrollment.credential_asset.is_none();

    if is_create {
        // CREATE path: new credential NFT
        CreateV2CpiBuilder::new(&ctx.accounts.mpl_core_program.to_account_info())
            .asset(&ctx.accounts.credential_asset)
            .collection(Some(&ctx.accounts.track_collection))
            .payer(&ctx.accounts.payer.to_account_info())
            .owner(Some(&ctx.accounts.learner))
            .authority(Some(&ctx.accounts.config.to_account_info()))
            .system_program(&ctx.accounts.system_program.to_account_info())
            .name(credential_name)
            .uri(metadata_uri)
            .plugins(vec![
                PluginAuthorityPair {
                    plugin: Plugin::PermanentFreezeDelegate(PermanentFreezeDelegate {
                        frozen: true,
                    }),
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
                                value: "1".into(),
                            },
                            Attribute {
                                key: "total_xp".into(),
                                value: (course.xp_per_lesson as u64 * course.lesson_count as u64)
                                    .to_string(),
                            },
                        ],
                    }),
                    authority: Some(PluginAuthority::UpdateAuthority),
                },
            ])
            .invoke_signed(signer_seeds)?;

        // Store the credential asset key on the enrollment
        let enrollment_mut = &mut ctx.accounts.enrollment;
        enrollment_mut.credential_asset = Some(ctx.accounts.credential_asset.key());
    } else {
        // UPGRADE path: update existing credential NFT
        let existing_asset = enrollment.credential_asset.unwrap();
        require!(
            ctx.accounts.credential_asset.key() == existing_asset,
            AcademyError::CredentialAssetMismatch
        );

        // Update name + URI
        UpdateV1CpiBuilder::new(&ctx.accounts.mpl_core_program.to_account_info())
            .asset(&ctx.accounts.credential_asset)
            .collection(Some(&ctx.accounts.track_collection))
            .authority(Some(&ctx.accounts.config.to_account_info()))
            .payer(&ctx.accounts.payer.to_account_info())
            .system_program(&ctx.accounts.system_program.to_account_info())
            .new_name(credential_name)
            .new_uri(metadata_uri)
            .invoke_signed(signer_seeds)?;

        // Update Attributes plugin
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
                        value: course.total_completions.to_string(),
                    },
                    Attribute {
                        key: "total_xp".into(),
                        value: (course.xp_per_lesson as u64 * course.lesson_count as u64)
                            .to_string(),
                    },
                ],
            }))
            .invoke_signed(signer_seeds)?;
    }

    emit!(CredentialIssued {
        learner: ctx.accounts.learner.key(),
        track_id: course.track_id,
        credential_asset: ctx.accounts.credential_asset.key(),
        credential_created: is_create,
        credential_upgraded: !is_create,
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

    pub course: Account<'info, Course>,

    #[account(
        mut,
        constraint = enrollment.course == course.key() @ AcademyError::EnrollmentCourseMismatch,
    )]
    pub enrollment: Account<'info, Enrollment>,

    /// The learner wallet (owner of the credential NFT).
    /// CHECK: Not a signer; backend signs on behalf of learner.
    pub learner: AccountInfo<'info>,

    /// The credential NFT asset account.
    /// For create: new keypair (signer).
    /// For upgrade: existing asset (not signer).
    /// CHECK: Validated by Metaplex Core CPI. For upgrades, verified against enrollment.credential_asset.
    #[account(mut)]
    pub credential_asset: AccountInfo<'info>,

    /// The Metaplex Core collection for this track.
    /// CHECK: Validated by Metaplex Core CPI (collection authority must match Config PDA).
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
