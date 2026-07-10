//! `revoke_minter()` — closes a MinterRole PDA, returning rent to the
//! authority. Refuses to close the live backend signer's own role.
//! Accounts: config (ro, PDA) | minter_role (mut, PDA, close = authority) |
//! authority (signer, mut, == config.authority @ Unauthorized).

use pinocchio::{AccountView, ProgramResult};

use crate::consts::*;
use crate::cpi::system::close_account;
use crate::errors::AcademyError;
use crate::state::minter_role::MinterRoleOffsets;
use crate::validation as v;
use crate::{events, require, state, take_accounts};

pub fn process(accounts: &mut [AccountView], _data: &[u8]) -> ProgramResult {
    take_accounts!([config, minter_role, authority] = accounts);

    // -- extraction phase --------------------------------------------------
    v::expect_account(config, &ACC_CONFIG)?;
    v::expect_account(minter_role, &ACC_MINTER_ROLE)?;
    let (minter, total_xp_minted, bump) = {
        let d = minter_role.try_borrow()?;
        let off = MinterRoleOffsets::parse(&d)?;
        (off.minter(&d), off.total_xp_minted(&d), off.bump(&d))
    };
    v::expect_signer(authority)?;

    // -- constraint phase ---------------------------------------------------
    v::expect_config_pda(config)?;
    v::expect_pda(minter_role, &[MINTER_SEED, minter.as_array(), &[bump]])?;
    v::expect_writable(minter_role)?;
    v::expect_writable(authority)?;
    {
        let cfg = config.try_borrow()?;
        v::expect_key(
            authority,
            &state::config::authority(&cfg),
            AcademyError::Unauthorized,
        )?;
    }

    // -- handler -------------------------------------------------------------
    // Closing the live backend's own role would silently break completions;
    // rotate backend_signer via update_config first.
    {
        let cfg = config.try_borrow()?;
        require!(
            minter != state::config::backend_signer(&cfg),
            AcademyError::Unauthorized
        );
    }

    events::emit_minter_revoked(&minter, total_xp_minted, v::now()?);

    close_account(minter_role, authority)
}
