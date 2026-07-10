//! `upgrade_credential(name, uri, courses_completed, total_xp)` — backend-
//! cosigned: renames/re-URIs the existing credential NFT and replaces its
//! Attributes plugin.
//! Accounts: config | course | enrollment (ro, course-match @ 6009) |
//! learner | credential_asset (mut, == enrollment.credential_asset @
//! CredentialAssetMismatch) | track_collection (mut, == course.collection @
//! CollectionMismatch) | payer (signer, mut) | backend_signer (signer, ==
//! config.backend_signer @ Unauthorized) | mpl_core_program (address) |
//! system_program.

use pinocchio::{cpi::Signer, AccountView, ProgramResult};

use crate::consts::*;
use crate::cpi::{config_seeds, mpl_core};
use crate::errors::{academy, AcademyError};
use crate::state::course::CourseOffsets;
use crate::state::enrollment::EnrollmentOffsets;
use crate::validation as v;
use crate::{events, require, state, take_accounts};

pub fn process(accounts: &mut [AccountView], data: &[u8]) -> ProgramResult {
    let mut cur = v::Cursor::new(data);
    let credential_name = cur.str()?;
    let metadata_uri = cur.str()?;
    let courses_completed = cur.u32()?;
    let total_xp = cur.u64()?;

    take_accounts!(
        [
            config,
            course,
            enrollment,
            learner,
            credential_asset,
            track_collection,
            payer,
            backend_signer,
            mpl_core_program,
            system_program
        ] = accounts
    );

    // -- extraction phase ----------------------------------------------------
    v::expect_account(config, &ACC_CONFIG)?;
    v::expect_account(course, &ACC_COURSE)?;
    let course_off = {
        let d = course.try_borrow()?;
        CourseOffsets::parse(&d)?
    };
    v::expect_account(enrollment, &ACC_ENROLLMENT)?;
    let enr_off = {
        let d = enrollment.try_borrow()?;
        EnrollmentOffsets::parse(&d)?
    };
    v::expect_signer(payer)?;
    v::expect_signer(backend_signer)?;
    v::expect_system_program(system_program)?;

    // -- constraint phase ----------------------------------------------------
    v::expect_config_pda(config)?;
    {
        let d = course.try_borrow()?;
        let bump = course_off.bump(&d);
        v::expect_pda(course, &[COURSE_SEED, course_off.course_id(&d), &[bump]])?;
    }
    {
        let cd = course.try_borrow()?;
        let ed = enrollment.try_borrow()?;
        let bump = enr_off.bump(&ed);
        v::expect_pda(
            enrollment,
            &[
                ENROLLMENT_SEED,
                course_off.course_id(&cd),
                learner.address().as_array(),
                &[bump],
            ],
        )?;
    }
    {
        let ed = enrollment.try_borrow()?;
        v::expect_key(
            course,
            &enr_off.course(&ed),
            AcademyError::EnrollmentCourseMismatch,
        )?;
    }
    {
        // Reject an enrollment left over from a superseded course generation.
        let cd = course.try_borrow()?;
        let ed = enrollment.try_borrow()?;
        require!(
            enr_off.course_gen(&ed) == course_off.generation(&cd),
            AcademyError::StaleEnrollment
        );
    }
    v::expect_writable(credential_asset)?;
    v::expect_writable(track_collection)?;
    {
        let cd = course.try_borrow()?;
        v::expect_key(
            track_collection,
            &course_off.collection(&cd),
            AcademyError::CollectionMismatch,
        )?;
    }
    v::expect_writable(payer)?;
    {
        let cfg = config.try_borrow()?;
        v::expect_key(
            backend_signer,
            &state::config::backend_signer(&cfg),
            AcademyError::Unauthorized,
        )?;
    }
    v::expect_address(mpl_core_program, &MPL_CORE_ID)?;

    // -- handler ---------------------------------------------------------------
    {
        let cfg = config.try_borrow()?;
        require!(!state::config::paused(&cfg), AcademyError::MintingPaused);
    }
    {
        let ed = enrollment.try_borrow()?;
        require!(
            enr_off.completed_at(&ed).is_some(),
            AcademyError::CourseNotFinalized
        );
        let existing_asset = enr_off
            .credential_asset(&ed)
            .ok_or_else(|| academy(AcademyError::CourseNotFinalized))?;
        require!(
            credential_asset.address() == &existing_asset,
            AcademyError::CredentialAssetMismatch
        );
    }

    let seeds = config_seeds();
    let config_signer = Signer::from(&seeds);

    mpl_core::update_v1_signed(
        mpl_core_program,
        credential_asset,
        track_collection,
        config,
        payer,
        system_program,
        credential_name.as_bytes(),
        metadata_uri.as_bytes(),
        &config_signer,
    )?;

    let (track_id, track_level) = {
        let cd = course.try_borrow()?;
        (course_off.track_id(&cd), course_off.track_level(&cd))
    };
    let mut b0 = [0u8; 20];
    let mut b1 = [0u8; 20];
    let mut b2 = [0u8; 20];
    let mut b3 = [0u8; 20];
    let attrs = [
        mpl_core::Attr {
            key: b"track_id",
            value: mpl_core::itoa_u64(&mut b0, track_id as u64),
        },
        mpl_core::Attr {
            key: b"level",
            value: mpl_core::itoa_u64(&mut b1, track_level as u64),
        },
        mpl_core::Attr {
            key: b"courses_completed",
            value: mpl_core::itoa_u64(&mut b2, courses_completed as u64),
        },
        mpl_core::Attr {
            key: b"total_xp",
            value: mpl_core::itoa_u64(&mut b3, total_xp),
        },
    ];

    mpl_core::update_plugin_v1_signed(
        mpl_core_program,
        credential_asset,
        track_collection,
        config,
        payer,
        system_program,
        &attrs,
        &config_signer,
    )?;

    events::emit_credential_upgraded(
        learner.address(),
        track_id,
        credential_asset.address(),
        track_level,
        v::now()?,
    );
    Ok(())
}
