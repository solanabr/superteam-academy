//! `close_course(course_id)` — authority-gated tool that frees a Course PDA
//! nobody ever enrolled in, so it can be recreated (including stale pre-resize
//! 192/224-byte accounts). The course is validated by canonical PDA + owner +
//! Course discriminator; a current-layout course is also parsed and must have
//! `total_enrollments == 0`. `close_enrollment` never decrements that counter,
//! so a course that ever had an enrollment can never be closed and learner
//! progress cannot be reset by a close + recreate.
//! Accounts: config (ro, PDA, has_one authority @ Unauthorized) | course
//! (mut, unchecked, find-PDA, owner = program @ InvalidCourseAccount) |
//! authority (signer).

use pinocchio::{AccountView, ProgramResult, Resize};

use crate::consts::*;
use crate::errors::{academy, AcademyError};
use crate::state::course::CourseOffsets;
use crate::validation as v;
use crate::{events, require, state, take_accounts};

pub fn process(accounts: &mut [AccountView], data: &[u8]) -> ProgramResult {
    let mut cur = v::Cursor::new(data);
    let course_id = cur.str()?;

    take_accounts!([config, course, authority] = accounts);

    // -- extraction phase (course is an UncheckedAccount: no type checks) ---
    v::expect_account(config, &ACC_CONFIG)?;
    v::expect_signer(authority)?;

    // -- constraint phase ---------------------------------------------------
    v::expect_config_pda(config)?;
    {
        let cfg = config.try_borrow()?;
        v::expect_key(
            authority,
            &state::config::authority(&cfg),
            AcademyError::Unauthorized,
        )?;
    }
    // course: seeds (canonical bump) -> mut -> owner (custom error).
    v::expect_found_pda(course, &[COURSE_SEED, course_id.as_bytes()])?;
    v::expect_writable(course)?;
    require!(course.owned_by(&ID), AcademyError::InvalidCourseAccount);

    // -- handler -------------------------------------------------------------
    // Genuine Course PDA check: the discriminator is stable across the
    // 192 -> 224 resize, so stale accounts pass too.
    {
        let d = course.try_borrow()?;
        require!(d.len() >= 8, AcademyError::InvalidCourseAccount);
        require!(d[..8] == ACC_COURSE[..], AcademyError::InvalidCourseAccount);
        // Older layouts (192/224 bytes) predate this rule and keep the
        // discriminator-only path; `create_course` only ever writes
        // COURSE_SIZE accounts.
        if d.len() == COURSE_SIZE {
            let off = CourseOffsets::parse(&d)?;
            require!(
                off.total_enrollments(&d) == 0,
                AcademyError::CourseHasEnrollments
            );
        }
    }

    let now = v::now()?;
    let course_key = course.address().clone();

    // Drain all lamports to the authority with checked math.
    let new_authority_lamports = authority
        .lamports()
        .checked_add(course.lamports())
        .ok_or_else(|| academy(AcademyError::Overflow))?;
    authority.set_lamports(new_authority_lamports);
    course.set_lamports(0);

    // Free the PDA: truncate, then hand ownership back to the system program
    // (this order matches the Anchor handler).
    course.resize(0)?;
    // SAFETY: no reference to `course.owner()` is alive; the account is
    // writable and was program-owned.
    unsafe { course.assign(&SYSTEM_PROGRAM_ID) };

    events::emit_course_closed(&course_key, course_id.as_bytes(), now);
    Ok(())
}
