//! `initialize()` — one-time platform setup: creates the Config PDA, the
//! Token-2022 XP mint (NonTransferable + PermanentDelegate + MetadataPointer,
//! authority = Config PDA), and auto-registers the authority's backend
//! MinterRole.
//! Accounts: config (init, payer = authority) | xp_mint (signer, mut) |
//! authority (signer, mut) | backend_minter_role (init, payer = authority) |
//! system_program | token_program (address = Token-2022).

use pinocchio::{
    cpi::{Seed, Signer},
    AccountView, ProgramResult,
};
use pinocchio_system::instructions::CreateAccount;

use crate::consts::*;
use crate::cpi::system::create_pda_account;
use crate::cpi::token2022;
use crate::state;
use crate::take_accounts;
use crate::validation as v;

pub fn process(accounts: &mut [AccountView], _data: &[u8]) -> ProgramResult {
    take_accounts!(
        [
            config,
            xp_mint,
            authority,
            backend_minter_role,
            system_program,
            token_program
        ] = accounts
    );

    // -- extraction phase ----------------------------------------------------
    v::expect_signer(xp_mint)?;
    v::expect_signer(authority)?;
    v::expect_system_program(system_program)?;

    // -- constraint phase ----------------------------------------------------
    // config `init`: the canonical PDA/bump are compile-time constants.
    if config.address() != &CONFIG_PDA {
        return Err(crate::errors::fw(crate::errors::CONSTRAINT_SEEDS));
    }
    {
        let bump_seed = [CONFIG_BUMP];
        let seeds = [Seed::from(CONFIG_SEED), Seed::from(&bump_seed)];
        create_pda_account(authority, config, CONFIG_SIZE, &ID, &Signer::from(&seeds))?;
    }
    v::expect_writable(xp_mint)?;
    v::expect_writable(authority)?;
    // backend_minter_role `init` for the authority (= initial backend signer).
    let minter_bump = v::expect_found_pda(
        backend_minter_role,
        &[MINTER_SEED, authority.address().as_array()],
    )?;
    {
        let bump_seed = [minter_bump];
        let seeds = [
            Seed::from(MINTER_SEED),
            Seed::from(authority.address().as_array()),
            Seed::from(&bump_seed),
        ];
        create_pda_account(
            authority,
            backend_minter_role,
            MINTER_ROLE_SIZE,
            &ID,
            &Signer::from(&seeds),
        )?;
    }
    v::expect_address(token_program, &TOKEN_2022_ID)?;

    // -- handler ---------------------------------------------------------------
    // Create the XP mint account (plain invoke: authority + mint keypair are
    // transaction-level signers), then initialize extensions BEFORE the mint.
    let lamports = crate::cpi::system::rent_minimum_balance(token2022::XP_MINT_SPACE)?;
    CreateAccount {
        from: authority,
        to: xp_mint,
        lamports,
        space: token2022::XP_MINT_SPACE as u64,
        owner: &TOKEN_2022_ID,
    }
    .invoke()?;

    token2022::init_non_transferable(xp_mint)?;
    token2022::init_permanent_delegate(xp_mint, &CONFIG_PDA)?;
    // MetadataPointer: authority = Config PDA, metadata = the mint itself.
    // TokenMetadata initialization itself is deferred to the client (Agave 3.0
    // CPI realloc restrictions), matching the Anchor build.
    token2022::init_metadata_pointer(xp_mint, &CONFIG_PDA, xp_mint.address())?;
    token2022::init_mint2(xp_mint, &CONFIG_PDA)?;

    let now = v::now()?;
    {
        let mut d = config.try_borrow_mut()?;
        state::config::init(
            &mut d,
            authority.address(),
            authority.address(), // backend_signer defaults to the authority
            xp_mint.address(),
            CONFIG_BUMP,
        );
    }
    {
        let mut d = backend_minter_role.try_borrow_mut()?;
        state::minter_role::init(
            &mut d,
            authority.address(),
            b"backend",
            0, // unlimited per-call
            0, // unlimited lifetime
            now,
            minter_bump,
        );
    }

    // No events emitted (matches the Anchor handler).
    Ok(())
}
