use anchor_lang::prelude::*;
use mpl_core::{
    accounts::BaseAssetV1,
    fetch_asset_plugin,
    instructions::{UpdatePluginV1CpiBuilder, UpdateV1CpiBuilder},
    types::{Attribute, Attributes, Plugin, PluginType, UpdateAuthority},
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

    // Bug 2 fix: verify credential on-chain instead of via enrollment.credential_asset
    let asset = BaseAssetV1::try_from(&ctx.accounts.credential_asset)
        .map_err(|_| AcademyError::CredentialAssetMismatch)?;

    require!(
        asset.owner == ctx.accounts.learner.key(),
        AcademyError::InvalidCredentialOwner
    );
    require!(
        asset.update_authority == UpdateAuthority::Collection(ctx.accounts.track_collection.key()),
        AcademyError::TrackCollectionMismatch
    );

    // Bug 3 fix: read current credential level, only allow upgrades (never downgrade)
    let current_level: u8 =
        fetch_asset_plugin::<Attributes>(&ctx.accounts.credential_asset, PluginType::Attributes)
            .ok()
            .and_then(|(_, attrs, _)| {
                attrs
                    .attribute_list
                    .iter()
                    .find(|a| a.key == "level")
                    .and_then(|a| a.value.parse::<u8>().ok())
            })
            .unwrap_or(0);

    let effective_level = std::cmp::max(current_level, course.track_level);

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
                    value: effective_level.to_string(),
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

    // Propagate credential_asset to this enrollment
    let enrollment_mut = &mut ctx.accounts.enrollment;
    enrollment_mut.credential_asset = Some(ctx.accounts.credential_asset.key());

    emit!(CredentialUpgraded {
        learner: ctx.accounts.learner.key(),
        track_id: course.track_id,
        credential_asset: ctx.accounts.credential_asset.key(),
        current_level: effective_level,
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
        mut,
        seeds = [b"enrollment", course.course_id.as_bytes(), learner.key().as_ref()],
        bump = enrollment.bump,
        constraint = enrollment.course == course.key() @ AcademyError::EnrollmentCourseMismatch,
    )]
    pub enrollment: Account<'info, Enrollment>,

    /// CHECK: Tied to enrollment PDA via seeds constraint.
    pub learner: AccountInfo<'info>,

    /// Existing credential NFT asset — validated on-chain via BaseAssetV1 deserialization.
    /// CHECK: Validated against learner ownership and track collection membership.
    #[account(mut)]
    pub credential_asset: AccountInfo<'info>,

    /// CHECK: Metaplex Core collection for this track.
    #[account(
        mut,
        constraint = track_collection.key() == course.track_collection @ AcademyError::TrackCollectionMismatch,
    )]
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
