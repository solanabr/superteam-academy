//! `update_minter(params { max_xp_per_call: u64, max_total_xp: u64 })`
//! Accounts: config (ro, PDA) | minter_role (mut, PDA) | authority (signer,
//! == config.authority @ Unauthorized).
//!
//! Like every instruction here, validation is two-phase to match Anchor's
//! generated `try_accounts`: first all fields are extracted/type-checked in
//! declaration order, then all constraints run in declaration order.

use pinocchio::{AccountView, ProgramResult};

use crate::consts::*;
use crate::errors::AcademyError;
use crate::state::minter_role::MinterRoleOffsets;
use crate::take_accounts;
use crate::validation as v;
use crate::{events, state};

pub fn process(accounts: &mut [AccountView], data: &[u8]) -> ProgramResult {
    let mut cur = v::Cursor::new(data);
    let max_xp_per_call = cur.u64()?;
    let max_total_xp = cur.u64()?;

    take_accounts!([config, minter_role, authority] = accounts);

    // -- extraction phase --------------------------------------------------
    v::expect_account(config, &ACC_CONFIG)?;
    v::expect_account(minter_role, &ACC_MINTER_ROLE)?;
    let (off, minter, bump) = {
        let d = minter_role.try_borrow()?;
        let off = MinterRoleOffsets::parse(&d)?;
        (off, off.minter(&d), off.bump(&d))
    };
    v::expect_signer(authority)?;

    // -- constraint phase ---------------------------------------------------
    v::expect_config_pda(config)?;
    v::expect_pda(minter_role, &[MINTER_SEED, minter.as_array(), &[bump]])?;
    v::expect_writable(minter_role)?;
    {
        let cfg = config.try_borrow()?;
        v::expect_key(
            authority,
            &state::config::authority(&cfg),
            AcademyError::Unauthorized,
        )?;
    }

    // -- handler -------------------------------------------------------------
    {
        let mut d = minter_role.try_borrow_mut()?;
        off.set_max_xp_per_call(&mut d, max_xp_per_call);
        off.set_max_total_xp(&mut d, max_total_xp);
    }

    events::emit_minter_updated(&minter, max_xp_per_call, max_total_xp, v::now()?);
    Ok(())
}
