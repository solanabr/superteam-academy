//! `create_course(params)` — authority-gated course creation at
//! `["course", course_id]`.
//! Accounts: course (init, payer = authority) | config (mut, PDA, has_one
//! authority @ Unauthorized) | authority (signer, mut) | system_program.
//! `config` is writable so the monotonic `course_nonce` can advance; each
//! course is stamped with the pre-increment value as its `generation`.

use pinocchio::{
    cpi::{Seed, Signer},
    AccountView, ProgramResult,
};

use crate::consts::*;
use crate::cpi::system::create_pda_account;
use crate::errors::{academy, AcademyError};
use crate::state::course::InitCourse;
use crate::validation as v;
use crate::{events, require, state, take_accounts};

pub fn process(accounts: &mut [AccountView], data: &[u8]) -> ProgramResult {
    let mut cur = v::Cursor::new(data);
    let course_id = cur.str()?;
    let creator = cur.address()?;
    let content_tx_id = cur.bytes32()?;
    let lesson_count = cur.u8()?;
    let difficulty = cur.u8()?;
    let xp_per_lesson = cur.u32()?;
    let track_id = cur.u16()?;
    let track_level = cur.u8()?;
    let prerequisite = cur.option_address()?;
    let creator_reward_xp = cur.u32()?;
    let min_completions_for_reward = cur.u16()?;
    let collection = cur.option_address()?;

    take_accounts!([course, config, authority, system_program] = accounts);

    // -- extraction phase (course is `init`: just taken as AccountInfo) -----
    v::expect_account(config, &ACC_CONFIG)?;
    v::expect_signer(authority)?;
    v::expect_system_program(system_program)?;

    // -- constraint phase ---------------------------------------------------
    // course `init`: canonical PDA + create (payer = authority). Matches
    // Anchor: the account is created BEFORE the handler's parameter checks.
    let bump = v::expect_found_pda(course, &[COURSE_SEED, course_id.as_bytes()])?;
    {
        let bump_seed = [bump];
        let seeds = [
            Seed::from(COURSE_SEED),
            Seed::from(course_id.as_bytes()),
            Seed::from(&bump_seed),
        ];
        create_pda_account(authority, course, COURSE_SIZE, &ID, &Signer::from(&seeds))?;
    }
    v::expect_config_pda(config)?;
    v::expect_writable(config)?;
    {
        let cfg = config.try_borrow()?;
        v::expect_key(
            authority,
            &state::config::authority(&cfg),
            AcademyError::Unauthorized,
        )?;
    }
    v::expect_writable(authority)?;

    // -- handler -------------------------------------------------------------
    require!(!course_id.is_empty(), AcademyError::CourseIdEmpty);
    require!(
        course_id.len() <= MAX_COURSE_ID_LEN,
        AcademyError::CourseIdTooLong
    );
    require!(lesson_count > 0, AcademyError::InvalidLessonCount);
    require!(
        (1..=3).contains(&difficulty),
        AcademyError::InvalidDifficulty
    );

    let now = v::now()?;
    let effective_collection = collection.unwrap_or(DEFAULT_ADDRESS);

    // Claim the next generation and advance the monotonic counter, so a course
    // id recreated after `close_course` never reuses a prior generation.
    let generation = {
        let mut cfg = config.try_borrow_mut()?;
        let g = state::config::course_nonce(&cfg);
        let next = g
            .checked_add(1)
            .ok_or_else(|| academy(AcademyError::Overflow))?;
        state::config::set_course_nonce(&mut cfg, next);
        g
    };

    {
        let mut d = course.try_borrow_mut()?;
        state::course::init(
            &mut d,
            &InitCourse {
                course_id: course_id.as_bytes(),
                creator: &creator,
                content_tx_id,
                lesson_count,
                difficulty,
                xp_per_lesson,
                track_id,
                track_level,
                prerequisite: prerequisite.as_ref(),
                creator_reward_xp,
                min_completions_for_reward,
                collection: &effective_collection,
                generation,
                now,
                bump,
            },
        );
    }

    events::emit_course_created(
        course.address(),
        course_id.as_bytes(),
        &creator,
        track_id,
        track_level,
        &effective_collection,
        now,
    );
    Ok(())
}
