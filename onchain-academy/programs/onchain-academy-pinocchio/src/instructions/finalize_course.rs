//! `finalize_course()` — backend-cosigned completion: requires every lesson
//! bit set, stamps `completed_at`, mints a 50% completion bonus to the
//! learner, and drips the creator reward within the bounded window
//! `[min_completions, min_completions + 100)`.
//! Accounts: config | course (mut) | enrollment (mut, course-match @ 6009) |
//! learner | learner_token_account (mut, t22-owned @ 6000) |
//! creator_token_account (mut, t22-owned @ 6000) | creator (== course.creator
//! @ 6000) | xp_mint (mut, == config.xp_mint @ 6000) | backend_signer
//! (signer, == config.backend_signer @ 6000) | token_program (address).

use pinocchio::{cpi::Signer, AccountView, ProgramResult};

use crate::consts::*;
use crate::cpi::{config_seeds, token2022};
use crate::errors::{academy, AcademyError};
use crate::state::course::CourseOffsets;
use crate::state::enrollment::EnrollmentOffsets;
use crate::validation as v;
use crate::{events, require, state, take_accounts};

pub fn process(accounts: &mut [AccountView], _data: &[u8]) -> ProgramResult {
    take_accounts!(
        [
            config,
            course,
            enrollment,
            learner,
            learner_token_account,
            creator_token_account,
            creator,
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
    let mut enr_off = {
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
    v::expect_writable(course)?;
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
    v::expect_writable(creator_token_account)?;
    require!(
        creator_token_account.owned_by(&TOKEN_2022_ID),
        AcademyError::Unauthorized
    );
    {
        let cd = course.try_borrow()?;
        v::expect_key(
            creator,
            &course_off.creator(&cd),
            AcademyError::Unauthorized,
        )?;
    }
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
    let xp_mint_key = {
        let cfg = config.try_borrow()?;
        require!(!state::config::paused(&cfg), AcademyError::MintingPaused);
        state::config::xp_mint(&cfg)
    };

    let now = v::now()?;

    let (completed, live_lessons, xp_per_lesson) = {
        let ed = enrollment.try_borrow()?;
        require!(
            enr_off.completed_at(&ed).is_none(),
            AcademyError::CourseAlreadyFinalized
        );
        let cd = course.try_borrow()?;
        // v2 completion: every LIVE lesson bit must be set in the learner's
        // flags (lesson_flags & active_lessons == active_lessons, per word).
        // Retiring a slot (clearing its active bit) never strands a learner who
        // already completed it.
        let all_active_completed = (0..4).all(|w| {
            let active = course_off.active_lesson_word(&cd, w);
            enr_off.lesson_flag_word(&ed, w) & active == active
        });
        require!(all_active_completed, AcademyError::CourseNotCompleted);
        (
            enr_off.completed_lessons(&ed),
            course_off.live_lesson_count(&cd),
            course_off.xp_per_lesson(&cd),
        )
    };

    {
        let mut ed = enrollment.try_borrow_mut()?;
        enr_off.set_completed_at(&mut ed, now);
    }

    {
        // The total-completions counter still increments (used off-chain); it no
        // longer gates the creator reward (v2 flat reward, #469).
        let mut cd = course.try_borrow_mut()?;
        let total = course_off
            .total_completions(&cd)
            .checked_add(1)
            .ok_or_else(|| academy(AcademyError::Overflow))?;
        course_off.set_total_completions(&mut cd, total);
    }

    // Completion bonus = 50% of total lesson XP (rounded down). Basis is the
    // live lesson count (popcount of the active mask), NOT the learner's
    // completed count — a stray retired bit must not inflate it.
    let total_lesson_xp = (xp_per_lesson as u64)
        .checked_mul(live_lessons as u64)
        .ok_or_else(|| academy(AcademyError::Overflow))?;
    let bonus_xp = total_lesson_xp / 2;
    require!(
        bonus_xp <= MAX_XP_PER_MINT,
        AcademyError::XpAmountExceedsMax
    );

    let seeds = config_seeds();
    let config_signer = Signer::from(&seeds);

    if bonus_xp > 0 {
        v::require_xp_recipient(learner_token_account, &xp_mint_key, learner.address())?;
        token2022::mint_to_signed(
            xp_mint,
            learner_token_account,
            config,
            bonus_xp,
            &config_signer,
        )?;
    }

    // Creator reward: flat — minted on every finalize where creator_reward_xp > 0
    // (still bounded per mint by MAX_XP_PER_MINT). The v1 completion-count window
    // [min_completions, min_completions + 100) was removed in the v2 program
    // (WS-1 #469): no threshold, no window.
    let creator_reward_xp = {
        let cd = course.try_borrow()?;
        course_off.creator_reward_xp(&cd)
    };

    let mut creator_xp: u32 = 0;
    if creator_reward_xp > 0 {
        require!(
            creator_reward_xp as u64 <= MAX_XP_PER_MINT,
            AcademyError::XpAmountExceedsMax
        );
        v::require_xp_recipient(creator_token_account, &xp_mint_key, creator.address())?;
        token2022::mint_to_signed(
            xp_mint,
            creator_token_account,
            config,
            creator_reward_xp as u64,
            &config_signer,
        )?;
        creator_xp = creator_reward_xp;
    }

    let total_xp = completed
        .checked_mul(xp_per_lesson)
        .ok_or_else(|| academy(AcademyError::Overflow))?;
    events::emit_course_finalized(
        learner.address(),
        course.address(),
        total_xp,
        bonus_xp,
        creator.address(),
        creator_xp,
        now,
    );
    Ok(())
}
