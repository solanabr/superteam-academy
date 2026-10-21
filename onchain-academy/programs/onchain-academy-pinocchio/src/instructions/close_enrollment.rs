//! `close_enrollment()` — voluntary unenroll after a 24h cooldown; refuses
//! finalized/credentialed enrollments (permanent replay guards) and any
//! enrollment with a completed lesson.
//! Accounts: course (ro, PDA) | enrollment (mut, PDA, course-match @
//! EnrollmentCourseMismatch, close = rent_recipient) | learner (signer, mut) |
//! rent_recipient (mut, address = the payer recorded at enroll).
//!
//! The rent goes back to whoever paid it: the payer stored in a 159-byte
//! enrollment, or the learner for a legacy 127-byte enrollment that predates
//! the payer field (they were the only possible recipient then).

use pinocchio::{AccountView, ProgramResult};

use crate::consts::*;
use crate::cpi::system::close_account;
use crate::errors::{academy, fw, AcademyError, CONSTRAINT_ADDRESS};
use crate::state::course::CourseOffsets;
use crate::state::enrollment::{rent_recipient as expected_rent_recipient, EnrollmentOffsets};
use crate::validation as v;
use crate::{events, require, take_accounts};

pub fn process(accounts: &mut [AccountView], _data: &[u8]) -> ProgramResult {
    take_accounts!([course, enrollment, learner, rent_recipient] = accounts);

    // -- extraction phase --------------------------------------------------
    v::expect_account(course, &ACC_COURSE)?;
    let course_off = {
        let d = course.try_borrow()?;
        CourseOffsets::parse(&d)?
    };
    v::expect_account(enrollment, &ACC_ENROLLMENT)?;
    let (enr_off, enrolled_at, enrollment_course) = {
        let d = enrollment.try_borrow()?;
        let off = EnrollmentOffsets::parse(&d)?;
        (off, off.enrolled_at(&d), off.course(&d))
    };
    v::expect_signer(learner)?;

    // -- constraint phase ---------------------------------------------------
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
    v::expect_writable(enrollment)?;
    v::expect_key(
        course,
        &enrollment_course,
        AcademyError::EnrollmentCourseMismatch,
    )?;
    v::expect_writable(learner)?;
    // rent_recipient: `address = <recorded payer>` (legacy: the learner).
    {
        let d = enrollment.try_borrow()?;
        let expected = expected_rent_recipient(&d, learner.address())?;
        if rent_recipient.address() != &expected {
            return Err(fw(CONSTRAINT_ADDRESS));
        }
    }
    v::expect_writable(rent_recipient)?;

    // -- handler -------------------------------------------------------------
    let now = v::now()?;
    {
        let d = enrollment.try_borrow()?;
        // Finalized or credentialed enrollments are permanent replay guards.
        require!(
            enr_off.completed_at(&d).is_none() && enr_off.credential_asset(&d).is_none(),
            AcademyError::EnrollmentFinalized
        );
        // A learner who has completed any lesson cannot unenroll: closing then
        // re-enrolling would otherwise reset the bitmap and re-mint that XP.
        require!(
            enr_off.completed_lessons(&d) == 0,
            AcademyError::EnrollmentInProgress
        );
    }

    let elapsed = now
        .checked_sub(enrolled_at)
        .ok_or_else(|| academy(AcademyError::Overflow))?;
    require!(
        elapsed > UNENROLL_COOLDOWN_SECS,
        AcademyError::UnenrollCooldown
    );

    let rent_reclaimed = enrollment.lamports();
    events::emit_enrollment_closed(
        learner.address(),
        &enrollment_course,
        false,
        rent_reclaimed,
        now,
    );

    close_account(enrollment, rent_recipient)
}
