//! `deactivate_achievement_type()` — sets `is_active = false`.
//! Accounts: config (ro, PDA) | achievement_type (mut, PDA) | authority
//! (signer, == config.authority @ Unauthorized).

use pinocchio::{AccountView, ProgramResult};

use crate::consts::*;
use crate::errors::AcademyError;
use crate::state::achievement::AchievementTypeOffsets;
use crate::take_accounts;
use crate::validation as v;
use crate::{events, state};

pub fn process(accounts: &mut [AccountView], _data: &[u8]) -> ProgramResult {
    take_accounts!([config, achievement_type, authority] = accounts);

    // -- extraction phase --------------------------------------------------
    v::expect_account(config, &ACC_CONFIG)?;
    v::expect_account(achievement_type, &ACC_ACHIEVEMENT_TYPE)?;
    let off = {
        let d = achievement_type.try_borrow()?;
        AchievementTypeOffsets::parse(&d)?
    };
    v::expect_signer(authority)?;

    // -- constraint phase ---------------------------------------------------
    v::expect_config_pda(config)?;
    {
        let d = achievement_type.try_borrow()?;
        let bump = off.bump(&d);
        v::expect_pda(
            achievement_type,
            &[ACHIEVEMENT_SEED, off.achievement_id(&d), &[bump]],
        )?;
    }
    v::expect_writable(achievement_type)?;
    {
        let cfg = config.try_borrow()?;
        v::expect_key(
            authority,
            &state::config::authority(&cfg),
            AcademyError::Unauthorized,
        )?;
    }

    // -- handler -------------------------------------------------------------
    let now = v::now()?;
    {
        let mut d = achievement_type.try_borrow_mut()?;
        off.set_is_active(&mut d, false);
    }
    let d = achievement_type.try_borrow()?;
    events::emit_achievement_type_deactivated(off.achievement_id(&d), now);
    Ok(())
}
