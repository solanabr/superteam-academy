//! `complete_lesson(lesson_index)` — backend-cosigned lesson completion:
//! sets the bitmap bit and mints `xp_per_lesson` to the learner's XP ATA.
//! Accounts: config | course | enrollment (mut, course-match @ 6009) |
//! learner | learner_token_account (mut, token-2022-owned @ Unauthorized) |
//! xp_mint (mut, == config.xp_mint @ Unauthorized) | backend_signer (signer,
//! == config.backend_signer @ Unauthorized) | token_program (address).

use pinocchio::{cpi::Signer, AccountView, ProgramResult};

use crate::consts::*;
use crate::cpi::{config_seeds, token2022};
use crate::errors::AcademyError;
use crate::state::course::CourseOffsets;
use crate::state::enrollment::EnrollmentOffsets;
use crate::validation as v;
use crate::{events, require, state, take_accounts};

pub fn process(accounts: &mut [AccountView], data: &[u8]) -> ProgramResult {
    let mut cur = v::Cursor::new(data);
    let lesson_index = cur.u8()?;

    take_accounts!(
        [
            config,
            course,
            enrollment,
            learner,
            learner_token_account,
            xp_mint,
            backend_signer,
            token_program
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
    v::expect_signer(backend_signer)?;

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
    v::expect_writable(enrollment)?;
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
    v::expect_writable(learner_token_account)?;
    require!(
        learner_token_account.owned_by(&TOKEN_2022_ID),
        AcademyError::Unauthorized
    );
    v::expect_writable(xp_mint)?;
    {
        let cfg = config.try_borrow()?;
        v::expect_key(
            xp_mint,
            &state::config::xp_mint(&cfg),
            AcademyError::Unauthorized,
        )?;
        v::expect_key(
            backend_signer,
            &state::config::backend_signer(&cfg),
            AcademyError::Unauthorized,
        )?;
    }
    v::expect_address(token_program, &TOKEN_2022_ID)?;

    // -- handler ---------------------------------------------------------------
    let (xp_per_lesson, xp_mint_key) = {
        let cfg = config.try_borrow()?;
        require!(!state::config::paused(&cfg), AcademyError::MintingPaused);
        let cd = course.try_borrow()?;
        require!(
            lesson_index < course_off.lesson_count(&cd),
            AcademyError::LessonOutOfBounds
        );
        (course_off.xp_per_lesson(&cd), state::config::xp_mint(&cfg))
    };

    let word_index = (lesson_index / 64) as usize;
    let mask = 1u64 << (lesson_index % 64);
    {
        let mut ed = enrollment.try_borrow_mut()?;
        require!(
            enr_off.lesson_flag_word(&ed, word_index) & mask == 0,
            AcademyError::LessonAlreadyCompleted
        );
        let word = enr_off.lesson_flag_word(&ed, word_index) | mask;
        enr_off.set_lesson_flag_word(&mut ed, word_index, word);
    }

    require!(
        xp_per_lesson as u64 <= MAX_XP_PER_MINT,
        AcademyError::XpAmountExceedsMax
    );

    // Bind the recipient ATA to the learner (mint + owner).
    v::require_xp_recipient(learner_token_account, &xp_mint_key, learner.address())?;

    let seeds = config_seeds();
    token2022::mint_to_signed(
        xp_mint,
        learner_token_account,
        config,
        xp_per_lesson as u64,
        &Signer::from(&seeds),
    )?;

    events::emit_lesson_completed(
        learner.address(),
        course.address(),
        lesson_index,
        xp_per_lesson,
        v::now()?,
    );
    Ok(())
}
