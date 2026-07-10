//! `update_config(params { new_backend_signer?, paused?, new_authority? })`
//! Accounts: config (mut, PDA, has_one authority @ Unauthorized) | authority
//! (signer) | remaining[0]: the previous backend's MinterRole PDA — REQUIRED
//! when rotating the backend signer, so a live old role is always retired.

use pinocchio::{AccountView, ProgramResult};

use crate::consts::*;
use crate::errors::{academy, AcademyError};
use crate::state::minter_role::MinterRoleOffsets;
use crate::validation as v;
use crate::{events, require, state, take_accounts};

pub fn process(accounts: &mut [AccountView], data: &[u8]) -> ProgramResult {
    let mut cur = v::Cursor::new(data);
    let new_backend_signer = cur.option_address()?;
    let paused = cur.option_bool()?;
    let new_authority = cur.option_address()?;

    take_accounts!([config, authority] rest remaining = accounts);

    // -- extraction phase --------------------------------------------------
    v::expect_account(config, &ACC_CONFIG)?;
    v::expect_signer(authority)?;

    // -- constraint phase ---------------------------------------------------
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

    // -- handler -------------------------------------------------------------
    let now = v::now()?;

    if let Some(signer) = new_backend_signer {
        // Rotating the backend signer MUST retire the previous backend's
        // MinterRole in the same call — otherwise a leaked old key keeps a live
        // role that a later re-appointment would reactivate. The caller must
        // pass the canonical `["minter", old_backend]` PDA (so it can't be
        // silently skipped); it is deactivated when it is a live role, and is a
        // no-op when the old backend never held one (freshly appointed backend).
        let old_backend = {
            let cfg = config.try_borrow()?;
            state::config::backend_signer(&cfg)
        };
        let old_role = remaining
            .first_mut()
            .ok_or_else(|| academy(AcademyError::OldMinterRoleMissing))?;
        let (expected_pda, _) = v::find_pda(&[MINTER_SEED, old_backend.as_array()]);
        require!(
            old_role.address() == &expected_pda,
            AcademyError::OldMinterRoleMissing
        );
        if old_role.owned_by(&ID) {
            let off = {
                let d = old_role.try_borrow()?;
                if d.len() >= 8 && d[..8] == ACC_MINTER_ROLE[..] {
                    Some(
                        MinterRoleOffsets::parse(&d)
                            .map_err(|_| academy(AcademyError::Unauthorized))?,
                    )
                } else {
                    None
                }
            };
            if let Some(off) = off {
                let mut d = old_role.try_borrow_mut()?;
                off.set_is_active(&mut d, false);
            }
        }

        {
            let mut cfg = config.try_borrow_mut()?;
            state::config::set_backend_signer(&mut cfg, &signer);
        }
        events::emit_config_updated("backend_signer", now);
    }

    if let Some(paused) = paused {
        {
            let mut cfg = config.try_borrow_mut()?;
            state::config::set_paused(&mut cfg, paused);
        }
        events::emit_minting_pause_set(paused, now);
    }

    if let Some(new_authority) = new_authority {
        // Reject the zero pubkey — an unrecoverable governance handoff.
        require!(new_authority != DEFAULT_ADDRESS, AcademyError::Unauthorized);
        {
            let mut cfg = config.try_borrow_mut()?;
            state::config::set_authority(&mut cfg, &new_authority);
        }
        events::emit_config_updated("authority", now);
    }

    Ok(())
}
