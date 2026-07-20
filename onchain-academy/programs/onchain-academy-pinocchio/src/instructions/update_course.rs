//! `update_course(params { 6 × Option<_> })` — partial updates; bumps
//! `version` when content changes; collection may only be set while unset.
//! Accounts: config (ro, PDA, has_one authority @ Unauthorized) | course
//! (mut, PDA) | authority (signer).

use pinocchio::{AccountView, ProgramResult};

use crate::consts::*;
use crate::errors::{academy, AcademyError};
use crate::state::course::CourseOffsets;
use crate::validation as v;
use crate::{events, require, state, take_accounts};

pub fn process(accounts: &mut [AccountView], data: &[u8]) -> ProgramResult {
    let mut cur = v::Cursor::new(data);
    let new_content_tx_id = cur.option_bytes32()?.copied();
    let new_is_active = cur.option_bool()?;
    let new_xp_per_lesson = cur.option_u32()?;
    let new_creator_reward_xp = cur.option_u32()?;
    let new_collection = cur.option_address()?;
    // v2: retire/rewrite live lesson slots. Wire is Option<[u64;4]> (32 LE
    // bytes); replaces v1's new_lesson_count. Dropped: new_min_completions (#469).
    let new_active_lessons = cur.option_bytes32()?.copied();

    take_accounts!([config, course, authority] = accounts);

    // -- extraction phase --------------------------------------------------
    v::expect_account(config, &ACC_CONFIG)?;
    v::expect_account(course, &ACC_COURSE)?;
    let off = {
        let d = course.try_borrow()?;
        CourseOffsets::parse(&d)?
    };
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
    {
        let d = course.try_borrow()?;
        let bump = off.bump(&d);
        v::expect_pda(course, &[COURSE_SEED, off.course_id(&d), &[bump]])?;
    }
    v::expect_writable(course)?;

    // -- handler -------------------------------------------------------------
    let now = v::now()?;
    let (version, collection) = {
        let mut d = course.try_borrow_mut()?;

        if let Some(content_tx_id) = new_content_tx_id {
            off.set_content_tx_id(&mut d, &content_tx_id);
            let bumped = off
                .version(&d)
                .checked_add(1)
                .ok_or_else(|| academy(AcademyError::Overflow))?;
            off.set_version(&mut d, bumped);
        }
        if let Some(is_active) = new_is_active {
            off.set_is_active(&mut d, is_active);
        }
        if let Some(xp) = new_xp_per_lesson {
            off.set_xp_per_lesson(&mut d, xp);
        }
        if let Some(reward) = new_creator_reward_xp {
            off.set_creator_reward_xp(&mut d, reward);
        }
        if let Some(bytes) = new_active_lessons {
            let mut mask = [0u64; 4];
            for (w, chunk) in bytes.chunks_exact(8).enumerate() {
                mask[w] = u64::from_le_bytes(chunk.try_into().unwrap());
            }
            off.set_active_lessons(&mut d, &mask);
        }
        if let Some(collection) = new_collection {
            // Backfill-only: re-pointing a live collection would orphan
            // existing credential holders.
            let current = off.collection(&d);
            require!(
                current == DEFAULT_ADDRESS || current == collection,
                AcademyError::CollectionMismatch
            );
            off.set_collection(&mut d, &collection);
        }
        off.set_updated_at(&mut d, now);

        (off.version(&d), off.collection(&d))
    };

    events::emit_course_updated(course.address(), version, &collection, now);
    Ok(())
}
