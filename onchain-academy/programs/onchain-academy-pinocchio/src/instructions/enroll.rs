//! `enroll(course_id)` — learner self-enrollment; enforces the optional
//! prerequisite via remaining accounts [prereq Course, prereq Enrollment].
//! Accounts: course (mut, PDA over the ARG course_id) | enrollment (init,
//! payer = learner) | learner (signer, mut) | system_program.

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

    take_accounts!([course, enrollment, learner, system_program] rest remaining = accounts);

    // -- extraction phase ----------------------------------------------------
    v::expect_account(course, &ACC_COURSE)?;
    let course_off = {
        let d = course.try_borrow()?;
        CourseOffsets::parse(&d)?
    };
    v::expect_signer(learner)?;
    v::expect_system_program(system_program)?;

    // -- constraint phase ----------------------------------------------------
    {
        let d = course.try_borrow()?;
        let bump = course_off.bump(&d);
        v::expect_pda(course, &[COURSE_SEED, course_id.as_bytes(), &[bump]])?;
    }
    v::expect_writable(course)?;
    // enrollment `init` (payer = learner). A live enrollment for the CURRENT
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
            learner,
            enrollment,
            ENROLLMENT_SIZE,
            &ID,
            &Signer::from(&seeds),
        )?;
    }
    v::expect_writable(learner)?;

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
