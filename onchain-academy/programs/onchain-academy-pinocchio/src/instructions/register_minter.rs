//! `register_minter(params { minter, label, max_xp_per_call, max_total_xp })`
//! Accounts: config (ro, PDA) | minter_role (init, payer = payer) | authority
//! (signer, mut, == config.authority @ Unauthorized) | payer (signer, mut) |
//! system_program.

use pinocchio::{
    cpi::{Seed, Signer},
    AccountView, ProgramResult,
};

use crate::consts::*;
use crate::cpi::system::create_pda_account;
use crate::errors::AcademyError;
use crate::validation as v;
use crate::{events, require, state, take_accounts};

pub fn process(accounts: &mut [AccountView], data: &[u8]) -> ProgramResult {
    let mut cur = v::Cursor::new(data);
    let minter = cur.address()?;
    let label = cur.str()?;
    let max_xp_per_call = cur.u64()?;
    let max_total_xp = cur.u64()?;

    take_accounts!([config, minter_role, authority, payer, system_program] = accounts);

    // -- extraction phase ----------------------------------------------------
    v::expect_account(config, &ACC_CONFIG)?;
    v::expect_signer(authority)?;
    v::expect_signer(payer)?;
    v::expect_system_program(system_program)?;

    // -- constraint phase ----------------------------------------------------
    v::expect_config_pda(config)?;
    // minter_role `init` (payer = payer) — runs BEFORE the authority
    // constraint, matching Anchor's field order.
    let bump = v::expect_found_pda(minter_role, &[MINTER_SEED, minter.as_array()])?;
    {
        let bump_seed = [bump];
        let seeds = [
            Seed::from(MINTER_SEED),
            Seed::from(minter.as_array()),
            Seed::from(&bump_seed),
        ];
        create_pda_account(
            payer,
            minter_role,
            MINTER_ROLE_SIZE,
            &ID,
            &Signer::from(&seeds),
        )?;
    }
    v::expect_writable(authority)?;
    {
        let cfg = config.try_borrow()?;
        v::expect_key(
            authority,
            &state::config::authority(&cfg),
            AcademyError::Unauthorized,
        )?;
    }
    v::expect_writable(payer)?;

    // -- handler ---------------------------------------------------------------
    require!(label.len() <= MAX_LABEL_LEN, AcademyError::LabelTooLong);

    let now = v::now()?;
    {
        let mut d = minter_role.try_borrow_mut()?;
        state::minter_role::init(
            &mut d,
            &minter,
            label.as_bytes(),
            max_xp_per_call,
            max_total_xp,
            now,
            bump,
        );
    }

    events::emit_minter_registered(&minter, label, max_xp_per_call, max_total_xp, now);
    Ok(())
}
