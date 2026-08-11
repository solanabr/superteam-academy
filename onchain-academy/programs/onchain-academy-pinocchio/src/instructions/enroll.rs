//! `enroll(course_id)` — learner self-enrollment; enforces the optional
//! prerequisite via remaining accounts [prereq Course, prereq Enrollment].
//! Accounts: course (mut, PDA over the ARG course_id) | enrollment (init,
//! payer = payer) | learner (signer) | payer (signer, mut) | system_program.
//!
//! `learner` and `payer` are SEPARATE slots (#1004). The learner still signs —
//! enrolment is their consent and their address is an Enrollment PDA seed — but
//! the rent for that PDA is debited from `payer`, so a learner holding zero SOL
//! can enrol. That is the whole point: Phantom Connect hands a learner an
//! embedded wallet with no SOL in it, and every other instruction they touch
//! (`complete_lesson`, `finalize_course`, `issue_credential`) is already funded
//! by someone else, so this was the single instruction standing between an
//! email sign-up and a first lesson.
//!
//! `payer` is any signer, deliberately NOT pinned to `config.backend_signer`:
//! a learner who does have SOL can pass their own address for both slots and
//! self-pay with no server round trip, and the platform can move sponsorship to
//! a dedicated treasury wallet without a program upgrade or a Config write.
//! The signer requirement is what makes it safe — an arbitrary funded account
//! cannot be named as payer without its own signature.

use pinocchio::{
    cpi::{Seed, Signer},
    AccountView, ProgramResult,
};

use crate::consts::*;
use crate::cpi::system::create_pda_account;
use crate::errors::{academy, AcademyError};
use crate::state::course::CourseOffsets;
use crate::state::enrollment::EnrollmentOffsets;
use crate::validation as v;
use crate::{events, require, state, take_accounts};

pub fn process(accounts: &mut [AccountView], data: &[u8]) -> ProgramResult {
    let mut cur = v::Cursor::new(data);
    let course_id = cur.str()?;

    take_accounts!([course, enrollment, learner, payer, system_program] rest remaining = accounts);

    // -- extraction phase ----------------------------------------------------
    v::expect_account(course, &ACC_COURSE)?;
    let course_off = {
        let d = course.try_borrow()?;
        CourseOffsets::parse(&d)?
    };
    v::expect_signer(learner)?;
    // The rent source must sign for itself. Without this, any funded account
    // could be named as payer by anyone and drained one enrolment at a time.
    v::expect_signer(payer)?;
    v::expect_system_program(system_program)?;

    // -- constraint phase ----------------------------------------------------
    {
        let d = course.try_borrow()?;
        let bump = course_off.bump(&d);
        v::expect_pda(course, &[COURSE_SEED, course_id.as_bytes(), &[bump]])?;
    }
    v::expect_writable(course)?;
    // enrollment `init` (payer = payer). A live enrollment for the CURRENT
    // course generation blocks re-enroll — create fails inside the system
    // program, exactly as under Anchor. A leftover enrollment from a
    // SUPERSEDED generation (the course id was closed and recreated) is
    // re-initialised in place, so the learner can take the new course.
    let bump = v::expect_found_pda(
        enrollment,
        &[
            ENROLLMENT_SEED,
            course_id.as_bytes(),
            learner.address().as_array(),
        ],
    )?;
    let current_gen = {
        let d = course.try_borrow()?;
        course_off.generation(&d)
    };
    let reuse_stale = {
        let ed = enrollment.try_borrow()?;
        enrollment.owned_by(&ID)
            && ed.len() >= 8
            && ed[..8] == ACC_ENROLLMENT[..]
            && EnrollmentOffsets::parse(&ed)
                .map(|off| off.course_gen(&ed) != current_gen)
                .unwrap_or(false)
    };
    if !reuse_stale {
        let bump_seed = [bump];
        let seeds = [
            Seed::from(ENROLLMENT_SEED),
            Seed::from(course_id.as_bytes()),
            Seed::from(learner.address().as_array()),
            Seed::from(&bump_seed),
        ];
        create_pda_account(
            payer,
            enrollment,
            ENROLLMENT_SIZE,
            &ID,
            &Signer::from(&seeds),
        )?;
    }
    // Rent comes off `payer`, so `payer` is the account that must be writable —
    // `learner` is now only a signer and a PDA seed. Self-pay still works: the
    // client passes one address into both slots and the runtime merges them.
    v::expect_writable(payer)?;

    // -- handler ---------------------------------------------------------------
    let now = v::now()?;
    {
        let d = course.try_borrow()?;
        require!(course_off.is_active(&d), AcademyError::CourseNotActive);
    }

    // Prerequisite check via remaining accounts:
    //   remaining[0] = prerequisite Course PDA
    //   remaining[1] = prerequisite Enrollment PDA (must belong to this learner)
    let prerequisite = {
        let d = course.try_borrow()?;
        course_off.prerequisite(&d)
    };
    if let Some(prerequisite_course) = prerequisite {
        require!(remaining.len() >= 2, AcademyError::PrerequisiteNotMet);
        let prereq_course_info = &remaining[0];
        let prereq_enrollment_info = &remaining[1];

        require!(
            prereq_course_info.owned_by(&ID),
            AcademyError::PrerequisiteNotMet
        );
        require!(
            prereq_enrollment_info.owned_by(&ID),
            AcademyError::PrerequisiteNotMet
        );
        require!(
            prereq_course_info.address() == &prerequisite_course,
            AcademyError::PrerequisiteNotMet
        );

        // `Account::<T>::try_from(..)` equivalents — any load/parse failure
        // maps to PrerequisiteNotMet, as in the Anchor handler.
        let pc_data = prereq_course_info.try_borrow()?;
        if pc_data.len() < 8 || pc_data[..8] != ACC_COURSE[..] {
            return Err(academy(AcademyError::PrerequisiteNotMet));
        }
        let pc_off = CourseOffsets::parse(&pc_data)
            .map_err(|_| academy(AcademyError::PrerequisiteNotMet))?;

        let pe_data = prereq_enrollment_info.try_borrow()?;
        if pe_data.len() < 8 || pe_data[..8] != ACC_ENROLLMENT[..] {
            return Err(academy(AcademyError::PrerequisiteNotMet));
        }
        let pe_off = EnrollmentOffsets::parse(&pe_data)
            .map_err(|_| academy(AcademyError::PrerequisiteNotMet))?;

        require!(
            pe_off.course(&pe_data) == prerequisite_course,
            AcademyError::PrerequisiteNotMet
        );
        require!(
            pe_off.completed_at(&pe_data).is_some(),
            AcademyError::PrerequisiteNotMet
        );

        // The prerequisite enrollment must belong to THIS learner (canonical
        // PDA derivation, as the Anchor handler does with find_program_address).
        let (expected_pda, _) = v::find_pda(&[
            ENROLLMENT_SEED,
            pc_off.course_id(&pc_data),
            learner.address().as_array(),
        ]);
        require!(
            prereq_enrollment_info.address() == &expected_pda,
            AcademyError::PrerequisiteNotMet
        );
    }

    {
        let mut d = enrollment.try_borrow_mut()?;
        state::enrollment::init(&mut d, course.address(), now, current_gen, bump);
    }

    let (version, new_total) = {
        let d = course.try_borrow()?;
        let total = course_off
            .total_enrollments(&d)
            .checked_add(1)
            .ok_or_else(|| academy(AcademyError::Overflow))?;
        (course_off.version(&d), total)
    };
    {
        let mut d = course.try_borrow_mut()?;
        course_off.set_total_enrollments(&mut d, new_total);
    }

    events::emit_enrolled(learner.address(), course.address(), version, now);
    Ok(())
}
