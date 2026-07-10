//! Gate 1a — wire-constant parity against an INDEPENDENT oracle (recomputed
//! sha256 discriminators, the known program id, and a hardcoded error table)
//! plus the real spl-token-2022 / mpl-core builders. Every hardcoded
//! discriminator, id, error code/log line, and hand-rolled CPI byte layout is
//! proven here without depending on the (deleted) Anchor program crate.

use onchain_academy_pinocchio::consts as c;
use onchain_academy_pinocchio::cpi::{mpl_core as pmpl, token2022 as pt22};
use onchain_academy_pinocchio::errors::{academy_log, AcademyError as P};
use pinocchio::Address;
use solana_program::hash::hash;
use solana_program::pubkey::Pubkey;

fn addr(p: Pubkey) -> Address {
    Address::new_from_array(p.to_bytes())
}

/// Anchor discriminator: `sha256("<namespace>:<name>")[..8]`, recomputed
/// independently of the Anchor crate so this gate stands alone.
fn anchor_disc(namespace: &str, name: &str) -> [u8; 8] {
    let full = hash(format!("{namespace}:{name}").as_bytes()).to_bytes();
    let mut out = [0u8; 8];
    out.copy_from_slice(&full[..8]);
    out
}

#[test]
fn program_ids() {
    // The default flavor tracks the upstream/Anchor id; `fresh-id`
    // intentionally diverges (self-owned devnet instance).
    #[cfg(not(feature = "fresh-id"))]
    {
        let upstream: Pubkey = "7NeJaSRyb4Wxay3Tcd9bdpD7T3GWYUQSFyrhG8SgwE8V"
            .parse()
            .unwrap();
        assert_eq!(upstream.to_bytes(), *c::ID.as_array());
    }
    assert_eq!(
        spl_token_2022::id().to_bytes(),
        *c::TOKEN_2022_ID.as_array()
    );
    assert_eq!(mpl_core::ID.to_bytes(), *c::MPL_CORE_ID.as_array());
    assert_eq!([0u8; 32], *c::SYSTEM_PROGRAM_ID.as_array());
}

#[test]
fn config_pda_consts() {
    // Derive from the flavor's own id so this gate holds for BOTH the
    // upstream-id and fresh-id builds.
    let program_id = Pubkey::new_from_array(*c::ID.as_array());
    let (pda, bump) = Pubkey::find_program_address(&[b"config"], &program_id);
    assert_eq!(pda.to_bytes(), *c::CONFIG_PDA.as_array());
    assert_eq!(bump, c::CONFIG_BUMP);
}

#[test]
fn instruction_discriminators() {
    let cases: [(&str, [u8; 8]); 18] = [
        ("initialize", c::IX_INITIALIZE),
        ("update_config", c::IX_UPDATE_CONFIG),
        ("create_course", c::IX_CREATE_COURSE),
        ("update_course", c::IX_UPDATE_COURSE),
        ("close_course", c::IX_CLOSE_COURSE),
        ("enroll", c::IX_ENROLL),
        ("complete_lesson", c::IX_COMPLETE_LESSON),
        ("finalize_course", c::IX_FINALIZE_COURSE),
        ("close_enrollment", c::IX_CLOSE_ENROLLMENT),
        ("issue_credential", c::IX_ISSUE_CREDENTIAL),
        ("upgrade_credential", c::IX_UPGRADE_CREDENTIAL),
        ("register_minter", c::IX_REGISTER_MINTER),
        ("revoke_minter", c::IX_REVOKE_MINTER),
        ("update_minter", c::IX_UPDATE_MINTER),
        ("reward_xp", c::IX_REWARD_XP),
        ("create_achievement_type", c::IX_CREATE_ACHIEVEMENT_TYPE),
        ("award_achievement", c::IX_AWARD_ACHIEVEMENT),
        (
            "deactivate_achievement_type",
            c::IX_DEACTIVATE_ACHIEVEMENT_TYPE,
        ),
    ];
    for (name, disc) in cases {
        let expected = hash(format!("global:{name}").as_bytes()).to_bytes();
        assert_eq!(&expected[..8], &disc[..], "instruction {name}");
    }
}

#[test]
fn account_discriminators() {
    // Recomputed sha256("account:<Name>")[..8], independent of the Anchor crate.
    let cases: [(&str, [u8; 8]); 6] = [
        ("Config", c::ACC_CONFIG),
        ("Course", c::ACC_COURSE),
        ("Enrollment", c::ACC_ENROLLMENT),
        ("MinterRole", c::ACC_MINTER_ROLE),
        ("AchievementType", c::ACC_ACHIEVEMENT_TYPE),
        ("AchievementReceipt", c::ACC_ACHIEVEMENT_RECEIPT),
    ];
    for (name, disc) in cases {
        assert_eq!(anchor_disc("account", name), disc, "account {name}");
    }
}

#[test]
fn event_discriminators() {
    // Recomputed sha256("event:<Name>")[..8], independent of the Anchor crate.
    let cases: [(&str, [u8; 8]); 18] = [
        ("ConfigUpdated", c::EV_CONFIG_UPDATED),
        ("CourseCreated", c::EV_COURSE_CREATED),
        ("CourseUpdated", c::EV_COURSE_UPDATED),
        ("Enrolled", c::EV_ENROLLED),
        ("LessonCompleted", c::EV_LESSON_COMPLETED),
        ("CourseFinalized", c::EV_COURSE_FINALIZED),
        ("EnrollmentClosed", c::EV_ENROLLMENT_CLOSED),
        ("CredentialIssued", c::EV_CREDENTIAL_ISSUED),
        ("CredentialUpgraded", c::EV_CREDENTIAL_UPGRADED),
        ("MinterRegistered", c::EV_MINTER_REGISTERED),
        ("MinterRevoked", c::EV_MINTER_REVOKED),
        ("MinterUpdated", c::EV_MINTER_UPDATED),
        ("XpRewarded", c::EV_XP_REWARDED),
        ("AchievementAwarded", c::EV_ACHIEVEMENT_AWARDED),
        ("AchievementTypeCreated", c::EV_ACHIEVEMENT_TYPE_CREATED),
        (
            "AchievementTypeDeactivated",
            c::EV_ACHIEVEMENT_TYPE_DEACTIVATED,
        ),
        ("CourseClosed", c::EV_COURSE_CLOSED),
        ("MintingPauseSet", c::EV_MINTING_PAUSE_SET),
    ];
    for (name, disc) in cases {
        assert_eq!(anchor_disc("event", name), disc, "event {name}");
    }
}

#[test]
fn error_codes_and_log_lines() {
    // Independent oracle for the IDL `errors` table: (variant, name, message).
    // Numbers are 6000 + ordinal; the log line is the fixed AnchorError format
    // `@coral-xyz/anchor`'s `AnchorError.parse` consumes. All 37 variants,
    // including the three added post-Anchor (StaleEnrollment/OldMinterRoleMissing
    // /EnrollmentInProgress), are pinned verbatim here.
    let table: [(P, &str, &str); 37] = [
        (P::Unauthorized, "Unauthorized", "Unauthorized signer"),
        (P::CourseNotActive, "CourseNotActive", "Course not active"),
        (
            P::LessonOutOfBounds,
            "LessonOutOfBounds",
            "Lesson index out of bounds",
        ),
        (
            P::LessonAlreadyCompleted,
            "LessonAlreadyCompleted",
            "Lesson already completed",
        ),
        (
            P::CourseNotCompleted,
            "CourseNotCompleted",
            "Not all lessons completed",
        ),
        (
            P::CourseAlreadyFinalized,
            "CourseAlreadyFinalized",
            "Course already finalized",
        ),
        (
            P::CourseNotFinalized,
            "CourseNotFinalized",
            "Course not finalized",
        ),
        (
            P::PrerequisiteNotMet,
            "PrerequisiteNotMet",
            "Prerequisite not met",
        ),
        (
            P::UnenrollCooldown,
            "UnenrollCooldown",
            "Close cooldown not met (24h)",
        ),
        (
            P::EnrollmentCourseMismatch,
            "EnrollmentCourseMismatch",
            "Enrollment/course mismatch",
        ),
        (P::Overflow, "Overflow", "Arithmetic overflow"),
        (P::CourseIdEmpty, "CourseIdEmpty", "Course ID is empty"),
        (
            P::CourseIdTooLong,
            "CourseIdTooLong",
            "Course ID exceeds max length",
        ),
        (
            P::InvalidLessonCount,
            "InvalidLessonCount",
            "Lesson count must be at least 1",
        ),
        (
            P::InvalidDifficulty,
            "InvalidDifficulty",
            "Difficulty must be 1, 2, or 3",
        ),
        (
            P::CredentialAssetMismatch,
            "CredentialAssetMismatch",
            "Credential asset does not match enrollment record",
        ),
        (
            P::CollectionMismatch,
            "CollectionMismatch",
            "Collection does not match the course's credential collection",
        ),
        (
            P::CredentialAlreadyIssued,
            "CredentialAlreadyIssued",
            "Credential already issued for this enrollment",
        ),
        (
            P::MinterNotActive,
            "MinterNotActive",
            "Minter role is not active",
        ),
        (
            P::MinterAmountExceeded,
            "MinterAmountExceeded",
            "Amount exceeds minter's per-call limit",
        ),
        (
            P::MinterCapExceeded,
            "MinterCapExceeded",
            "Cumulative minted XP would exceed minter's total cap",
        ),
        (
            P::LabelTooLong,
            "LabelTooLong",
            "Minter label exceeds max length",
        ),
        (
            P::AchievementNotActive,
            "AchievementNotActive",
            "Achievement type is not active",
        ),
        (
            P::AchievementSupplyExhausted,
            "AchievementSupplyExhausted",
            "Achievement max supply reached",
        ),
        (
            P::AchievementIdTooLong,
            "AchievementIdTooLong",
            "Achievement ID exceeds max length",
        ),
        (
            P::AchievementNameTooLong,
            "AchievementNameTooLong",
            "Achievement name exceeds max length",
        ),
        (
            P::AchievementUriTooLong,
            "AchievementUriTooLong",
            "Achievement URI exceeds max length",
        ),
        (
            P::InvalidAmount,
            "InvalidAmount",
            "Amount must be greater than zero",
        ),
        (
            P::InvalidXpReward,
            "InvalidXpReward",
            "XP reward must be greater than zero",
        ),
        (
            P::EnrollmentFinalized,
            "EnrollmentFinalized",
            "Finalized or credentialed enrollment cannot be closed",
        ),
        (
            P::InvalidCourseAccount,
            "InvalidCourseAccount",
            "Account is not a valid Course PDA",
        ),
        (P::MintingPaused, "MintingPaused", "Minting is paused"),
        (
            P::WrongXpMint,
            "WrongXpMint",
            "Recipient token account mint does not match Config.xp_mint",
        ),
        (
            P::XpAmountExceedsMax,
            "XpAmountExceedsMax",
            "XP amount exceeds the per-mint ceiling",
        ),
        (
            P::StaleEnrollment,
            "StaleEnrollment",
            "Enrollment belongs to a superseded course generation",
        ),
        (
            P::OldMinterRoleMissing,
            "OldMinterRoleMissing",
            "Backend rotation requires the previous backend minter role account",
        ),
        (
            P::EnrollmentInProgress,
            "EnrollmentInProgress",
            "Enrollment with completed lessons cannot be closed",
        ),
    ];
    for (i, (p, name, msg)) in table.into_iter().enumerate() {
        let number = 6000 + i as u32;
        assert_eq!(p as u32, i as u32, "ordinal {name}");
        let expected = format!(
            "AnchorError occurred. Error Code: {name}. Error Number: {number}. Error Message: {msg}."
        );
        assert_eq!(academy_log(p), expected, "{name}");
    }
}

#[test]
fn xp_mint_space() {
    use spl_token_2022::extension::ExtensionType;
    use spl_token_2022::state::Mint;
    let space = ExtensionType::try_calculate_account_len::<Mint>(&[
        ExtensionType::NonTransferable,
        ExtensionType::PermanentDelegate,
        ExtensionType::MetadataPointer,
    ])
    .unwrap();
    assert_eq!(space, pt22::XP_MINT_SPACE);
}

#[test]
fn token2022_wire_parity() {
    let pid = spl_token_2022::id();
    let mint = Pubkey::new_unique();
    let dest = Pubkey::new_unique();
    let auth = Pubkey::new_unique();

    let ix = spl_token_2022::instruction::mint_to(&pid, &mint, &dest, &auth, &[], 12_345).unwrap();
    assert_eq!(ix.data, pt22::mint_to_data(12_345));
    let metas: Vec<_> = ix
        .accounts
        .iter()
        .map(|m| (m.pubkey, m.is_writable, m.is_signer))
        .collect();
    assert_eq!(
        metas,
        vec![
            (mint, true, false),
            (dest, true, false),
            (auth, false, true)
        ]
    );

    let ix = spl_token_2022::instruction::initialize_non_transferable_mint(&pid, &mint).unwrap();
    assert_eq!(ix.data, pt22::INIT_NON_TRANSFERABLE_DATA);
    assert_eq!(ix.accounts.len(), 1);
    assert!(ix.accounts[0].is_writable && !ix.accounts[0].is_signer);

    let ix =
        spl_token_2022::instruction::initialize_permanent_delegate(&pid, &mint, &auth).unwrap();
    assert_eq!(ix.data, pt22::init_permanent_delegate_data(&addr(auth)));

    let ix = spl_token_2022::extension::metadata_pointer::instruction::initialize(
        &pid,
        &mint,
        Some(auth),
        Some(mint),
    )
    .unwrap();
    assert_eq!(
        ix.data,
        pt22::init_metadata_pointer_data(&addr(auth), &addr(mint))
    );

    let ix = spl_token_2022::instruction::initialize_mint2(&pid, &mint, &auth, None, 0).unwrap();
    assert_eq!(ix.data, pt22::init_mint2_data(&addr(auth)));
}

fn asset_plugin_pairs(attrs: &[(&str, String)]) -> Vec<mpl_core::types::PluginAuthorityPair> {
    use mpl_core::types::*;
    vec![
        PluginAuthorityPair {
            plugin: Plugin::PermanentFreezeDelegate(PermanentFreezeDelegate { frozen: true }),
            authority: Some(PluginAuthority::UpdateAuthority),
        },
        PluginAuthorityPair {
            plugin: Plugin::Attributes(Attributes {
                attribute_list: attrs
                    .iter()
                    .map(|(k, v)| Attribute {
                        key: (*k).into(),
                        value: v.clone(),
                    })
                    .collect(),
            }),
            authority: Some(PluginAuthority::UpdateAuthority),
        },
    ]
}

#[test]
fn mpl_core_create_v2_wire_parity() {
    use mpl_core::instructions::{CreateV2, CreateV2InstructionArgs};
    use mpl_core::types::DataState;

    let asset = Pubkey::new_unique();
    let collection = Pubkey::new_unique();
    let config = Pubkey::new_unique();
    let payer = Pubkey::new_unique();
    let owner = Pubkey::new_unique();
    let system = solana_program::system_program::ID;

    // issue_credential-shaped attributes (numeric values rendered via to_string)
    let attrs = [
        ("track_id", 7u64.to_string()),
        ("level", 2u64.to_string()),
        ("courses_completed", 15u64.to_string()),
        ("total_xp", 123_456u64.to_string()),
    ];
    let real = CreateV2 {
        asset,
        collection: Some(collection),
        authority: Some(config),
        payer,
        owner: Some(owner),
        update_authority: None,
        system_program: system,
        log_wrapper: None,
    }
    .instruction(CreateV2InstructionArgs {
        data_state: DataState::AccountState,
        name: "Solana Track Credential".into(),
        uri: "https://arweave.net/abc".into(),
        plugins: Some(asset_plugin_pairs(&attrs)),
        external_plugin_adapters: None,
    });

    let mut itoa_bufs = [[0u8; 20]; 4];
    let values: Vec<Vec<u8>> = [7u64, 2, 15, 123_456]
        .iter()
        .zip(itoa_bufs.iter_mut())
        .map(|(v, b)| pmpl::itoa_u64(b, *v).to_vec())
        .collect();
    let my_attrs = [
        pmpl::Attr {
            key: b"track_id",
            value: &values[0],
        },
        pmpl::Attr {
            key: b"level",
            value: &values[1],
        },
        pmpl::Attr {
            key: b"courses_completed",
            value: &values[2],
        },
        pmpl::Attr {
            key: b"total_xp",
            value: &values[3],
        },
    ];
    let mut buf = [0u8; 1408];
    let mine = pmpl::create_v2_data(
        &mut buf,
        b"Solana Track Credential",
        b"https://arweave.net/abc",
        &my_attrs,
    );
    assert_eq!(real.data, mine);

    // Meta order + flags (None optionals become readonly mpl-core id).
    let metas: Vec<_> = real
        .accounts
        .iter()
        .map(|m| (m.pubkey, m.is_writable, m.is_signer))
        .collect();
    assert_eq!(
        metas,
        vec![
            (asset, true, true),
            (collection, true, false),
            (config, false, true),
            (payer, true, true),
            (owner, false, false),
            (mpl_core::ID, false, false),
            (system, false, false),
            (mpl_core::ID, false, false),
        ]
    );
}

#[test]
fn mpl_core_create_collection_v2_wire_parity() {
    use mpl_core::instructions::{CreateCollectionV2, CreateCollectionV2InstructionArgs};

    let collection = Pubkey::new_unique();
    let config = Pubkey::new_unique();
    let payer = Pubkey::new_unique();
    let system = solana_program::system_program::ID;

    let real = CreateCollectionV2 {
        collection,
        update_authority: Some(config),
        payer,
        system_program: system,
    }
    .instruction(CreateCollectionV2InstructionArgs {
        name: "Early Adopter".into(),
        uri: "https://arweave.net/xyz".into(),
        plugins: None,
        external_plugin_adapters: None,
    });

    let mut buf = [0u8; 256];
    let mine =
        pmpl::create_collection_v2_data(&mut buf, b"Early Adopter", b"https://arweave.net/xyz");
    assert_eq!(real.data, mine);

    let metas: Vec<_> = real
        .accounts
        .iter()
        .map(|m| (m.pubkey, m.is_writable, m.is_signer))
        .collect();
    assert_eq!(
        metas,
        vec![
            (collection, true, true),
            (config, false, false),
            (payer, true, true),
            (system, false, false),
        ]
    );
}

#[test]
fn mpl_core_update_v1_wire_parity() {
    use mpl_core::instructions::{UpdateV1, UpdateV1InstructionArgs};

    let asset = Pubkey::new_unique();
    let collection = Pubkey::new_unique();
    let config = Pubkey::new_unique();
    let payer = Pubkey::new_unique();
    let system = solana_program::system_program::ID;

    let real = UpdateV1 {
        asset,
        collection: Some(collection),
        payer,
        authority: Some(config),
        system_program: system,
        log_wrapper: None,
    }
    .instruction(UpdateV1InstructionArgs {
        new_name: Some("Level 3".into()),
        new_uri: Some("https://arweave.net/upd".into()),
        new_update_authority: None,
    });

    let mut buf = [0u8; 1280];
    let mine = pmpl::update_v1_data(&mut buf, b"Level 3", b"https://arweave.net/upd");
    assert_eq!(real.data, mine);

    let metas: Vec<_> = real
        .accounts
        .iter()
        .map(|m| (m.pubkey, m.is_writable, m.is_signer))
        .collect();
    assert_eq!(
        metas,
        vec![
            (asset, true, false),
            (collection, false, false), // read-only, unlike UpdatePluginV1
            (payer, true, true),
            (config, false, true),
            (system, false, false),
            (mpl_core::ID, false, false),
        ]
    );
}

#[test]
fn mpl_core_update_plugin_v1_wire_parity() {
    use mpl_core::instructions::{UpdatePluginV1, UpdatePluginV1InstructionArgs};
    use mpl_core::types::{Attribute, Attributes, Plugin};

    let asset = Pubkey::new_unique();
    let collection = Pubkey::new_unique();
    let config = Pubkey::new_unique();
    let payer = Pubkey::new_unique();
    let system = solana_program::system_program::ID;

    let real = UpdatePluginV1 {
        asset,
        collection: Some(collection),
        payer,
        authority: Some(config),
        system_program: system,
        log_wrapper: None,
    }
    .instruction(UpdatePluginV1InstructionArgs {
        plugin: Plugin::Attributes(Attributes {
            attribute_list: vec![
                Attribute {
                    key: "track_id".into(),
                    value: "7".into(),
                },
                Attribute {
                    key: "level".into(),
                    value: "3".into(),
                },
            ],
        }),
    });

    let mut buf = [0u8; 256];
    let mine = pmpl::update_plugin_v1_data(
        &mut buf,
        &[
            pmpl::Attr {
                key: b"track_id",
                value: b"7",
            },
            pmpl::Attr {
                key: b"level",
                value: b"3",
            },
        ],
    );
    assert_eq!(real.data, mine);

    let metas: Vec<_> = real
        .accounts
        .iter()
        .map(|m| (m.pubkey, m.is_writable, m.is_signer))
        .collect();
    assert_eq!(
        metas,
        vec![
            (asset, true, false),
            (collection, true, false), // WRITABLE, unlike UpdateV1
            (payer, true, true),
            (config, false, true),
            (system, false, false),
            (mpl_core::ID, false, false),
        ]
    );
}

#[test]
fn itoa_matches_to_string() {
    for v in [0u64, 1, 9, 10, 99, 100, 12_345, u32::MAX as u64, u64::MAX] {
        let mut buf = [0u8; 20];
        assert_eq!(pmpl::itoa_u64(&mut buf, v), v.to_string().as_bytes());
    }
}

// ---- Audit follow-ups: CPI byte-coverage gaps flagged by the adversarial ----
// review (the port was byte-perfect; these lock the coverage in permanently).

#[test]
fn mint_init_instructions_are_single_writable_mint() {
    // The hand-rolled mint-init CPIs all issue a single [mint(w, non-signer)]
    // account. Pin that against the real spl-token-2022 builders so a future
    // edit that adds/reorders an account is caught.
    let pid = spl_token_2022::id();
    let mint = Pubkey::new_unique();
    let auth = Pubkey::new_unique();

    let ixs = vec![
        spl_token_2022::instruction::initialize_non_transferable_mint(&pid, &mint).unwrap(),
        spl_token_2022::instruction::initialize_permanent_delegate(&pid, &mint, &auth).unwrap(),
        spl_token_2022::extension::metadata_pointer::instruction::initialize(
            &pid,
            &mint,
            Some(auth),
            Some(mint),
        )
        .unwrap(),
        spl_token_2022::instruction::initialize_mint2(&pid, &mint, &auth, None, 0).unwrap(),
    ];
    for ix in ixs {
        assert_eq!(ix.accounts.len(), 1, "mint-init takes exactly one account");
        assert_eq!(ix.accounts[0].pubkey, mint);
        assert!(ix.accounts[0].is_writable && !ix.accounts[0].is_signer);
    }
}

#[test]
fn init_mint2_freeze_option_shape() {
    // Pins the OptionalNonZeroPubkey-style COption encoding the port relies on:
    // None = trailing single 0 byte (35 bytes total); Some = 1 + 32 (67 bytes).
    // The port hard-codes None (data[34] = 0) because the XP mint has no freeze
    // authority — this guards that assumption against a future edit.
    let pid = spl_token_2022::id();
    let mint = Pubkey::new_unique();
    let auth = Pubkey::new_unique();
    let freeze = Pubkey::new_unique();

    let none = spl_token_2022::instruction::initialize_mint2(&pid, &mint, &auth, None, 0).unwrap();
    assert_eq!(none.data.len(), 35);
    assert_eq!(none.data[34], 0);
    assert_eq!(none.data, pt22::init_mint2_data(&addr(auth)));

    let some = spl_token_2022::instruction::initialize_mint2(&pid, &mint, &auth, Some(&freeze), 0)
        .unwrap();
    assert_eq!(some.data.len(), 67);
    assert_eq!(some.data[34], 1);
}

#[test]
fn mpl_core_award_shape_create_v2_wire_parity() {
    // award_achievement mints a create_v2 with exactly TWO attributes
    // (achievement_id string + supply_number numeric) — a different plugin
    // shape than the 4-attribute credential path already covered.
    use mpl_core::instructions::{CreateV2, CreateV2InstructionArgs};
    use mpl_core::types::DataState;

    let asset = Pubkey::new_unique();
    let collection = Pubkey::new_unique();
    let config = Pubkey::new_unique();
    let payer = Pubkey::new_unique();
    let owner = Pubkey::new_unique();
    let system = solana_program::system_program::ID;

    let attrs = [
        ("achievement_id", "early-adopter".to_string()),
        ("supply_number", 7u64.to_string()),
    ];
    let real = CreateV2 {
        asset,
        collection: Some(collection),
        authority: Some(config),
        payer,
        owner: Some(owner),
        update_authority: None,
        system_program: system,
        log_wrapper: None,
    }
    .instruction(CreateV2InstructionArgs {
        data_state: DataState::AccountState,
        name: "Early Adopter".into(),
        uri: "https://arweave.net/a".into(),
        plugins: Some(asset_plugin_pairs(&attrs)),
        external_plugin_adapters: None,
    });

    let mut sup = [0u8; 20];
    let supply = pmpl::itoa_u64(&mut sup, 7).to_vec();
    let my_attrs = [
        pmpl::Attr {
            key: b"achievement_id",
            value: b"early-adopter",
        },
        pmpl::Attr {
            key: b"supply_number",
            value: &supply,
        },
    ];
    let mut buf = [0u8; 1408];
    let mine = pmpl::create_v2_data(
        &mut buf,
        b"Early Adopter",
        b"https://arweave.net/a",
        &my_attrs,
    );
    assert_eq!(real.data, mine);
}

#[test]
fn mpl_core_create_v2_near_max_buffer_no_overflow() {
    // 512-byte name + 512-byte uri + 4 max-width numeric attributes must fit
    // the 1408-byte stack buffer and stay byte-equal to the real builder.
    use mpl_core::instructions::{CreateV2, CreateV2InstructionArgs};
    use mpl_core::types::DataState;

    let name = "n".repeat(512);
    let uri = "u".repeat(512);
    let attrs = [
        ("track_id", u16::MAX.to_string()),
        ("level", u8::MAX.to_string()),
        ("courses_completed", u32::MAX.to_string()),
        ("total_xp", u64::MAX.to_string()),
    ];
    let real = CreateV2 {
        asset: Pubkey::new_unique(),
        collection: Some(Pubkey::new_unique()),
        authority: Some(Pubkey::new_unique()),
        payer: Pubkey::new_unique(),
        owner: Some(Pubkey::new_unique()),
        update_authority: None,
        system_program: solana_program::system_program::ID,
        log_wrapper: None,
    }
    .instruction(CreateV2InstructionArgs {
        data_state: DataState::AccountState,
        name: name.clone(),
        uri: uri.clone(),
        plugins: Some(asset_plugin_pairs(&attrs)),
        external_plugin_adapters: None,
    });

    let mut bufs = [[0u8; 20]; 4];
    let vals: Vec<Vec<u8>> = [u16::MAX as u64, u8::MAX as u64, u32::MAX as u64, u64::MAX]
        .iter()
        .zip(bufs.iter_mut())
        .map(|(v, b)| pmpl::itoa_u64(b, *v).to_vec())
        .collect();
    let my_attrs = [
        pmpl::Attr {
            key: b"track_id",
            value: &vals[0],
        },
        pmpl::Attr {
            key: b"level",
            value: &vals[1],
        },
        pmpl::Attr {
            key: b"courses_completed",
            value: &vals[2],
        },
        pmpl::Attr {
            key: b"total_xp",
            value: &vals[3],
        },
    ];
    let mut buf = [0u8; 1408];
    let mine = pmpl::create_v2_data(&mut buf, name.as_bytes(), uri.as_bytes(), &my_attrs);
    assert_eq!(real.data, mine);
    assert!(mine.len() < 1408, "must fit the stack buffer with margin");
}
