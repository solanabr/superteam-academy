//! `reward_xp(amount, memo)` — general-purpose XP mint through a registered
//! MinterRole (minter + backend co-sign). Address-based by design: the
//! destination ATA is bound to the XP mint but not to an owner identity.
//! Accounts: config | minter_role (mut, PDA over minter.key, role.minter ==
//! minter @ Unauthorized) | xp_mint (mut, == config.xp_mint @ Unauthorized) |
//! recipient_token_account (mut) | minter (signer) | backend_signer (signer,
//! == config.backend_signer @ Unauthorized) | token_program (address).

use pinocchio::{cpi::Signer, AccountView, ProgramResult};

use crate::consts::*;
use crate::cpi::{config_seeds, token2022};
use crate::errors::{academy, AcademyError};
use crate::state::minter_role::MinterRoleOffsets;
use crate::validation as v;
use crate::{events, require, state, take_accounts};

pub fn process(accounts: &mut [AccountView], data: &[u8]) -> ProgramResult {
    let mut cur = v::Cursor::new(data);
    let amount = cur.u64()?;
    let memo = cur.str()?;

    take_accounts!(
        [
            config,
            minter_role,
            xp_mint,
            recipient_token_account,
            minter,
            backend_signer,
            token_program
        ] = accounts
    );

    // -- extraction phase ----------------------------------------------------
    v::expect_account(config, &ACC_CONFIG)?;
    v::expect_account(minter_role, &ACC_MINTER_ROLE)?;
    let role_off = {
        let d = minter_role.try_borrow()?;
        MinterRoleOffsets::parse(&d)?
    };
    v::expect_signer(minter)?;
    v::expect_signer(backend_signer)?;

    // -- constraint phase ----------------------------------------------------
    v::expect_config_pda(config)?;
    {
        let d = minter_role.try_borrow()?;
        let bump = role_off.bump(&d);
        // seeds are derived from the SIGNING minter account's key
        v::expect_pda(
            minter_role,
            &[MINTER_SEED, minter.address().as_array(), &[bump]],
        )?;
    }
    v::expect_writable(minter_role)?;
    {
        let d = minter_role.try_borrow()?;
        v::expect_key(minter, &role_off.minter(&d), AcademyError::Unauthorized)?;
    }
    v::expect_writable(xp_mint)?;
    {
        let cfg = config.try_borrow()?;
        v::expect_key(
            xp_mint,
            &state::config::xp_mint(&cfg),
            AcademyError::Unauthorized,
        )?;
    }
    v::expect_writable(recipient_token_account)?;
    {
        let cfg = config.try_borrow()?;
        v::expect_key(
            backend_signer,
            &state::config::backend_signer(&cfg),
            AcademyError::Unauthorized,
        )?;
    }
    v::expect_address(token_program, &TOKEN_2022_ID)?;

    // -- handler ---------------------------------------------------------------
    let (new_total, xp_mint_key) = {
        let cfg = config.try_borrow()?;
        require!(!state::config::paused(&cfg), AcademyError::MintingPaused);

        let d = minter_role.try_borrow()?;
        require!(role_off.is_active(&d), AcademyError::MinterNotActive);
        require!(amount > 0, AcademyError::InvalidAmount);
        // Absolute per-call ceiling bounding the blast radius of a leaked
        // backend_signer; the per-minter caps apply on top.
        require!(amount <= MAX_XP_PER_MINT, AcademyError::XpAmountExceedsMax);

        let max_per_call = role_off.max_xp_per_call(&d);
        if max_per_call > 0 {
            require!(amount <= max_per_call, AcademyError::MinterAmountExceeded);
        }

        let new_total = role_off
            .total_xp_minted(&d)
            .checked_add(amount)
            .ok_or_else(|| academy(AcademyError::Overflow))?;

        let max_total = role_off.max_total_xp(&d);
        if max_total > 0 {
            require!(new_total <= max_total, AcademyError::MinterCapExceeded);
        }

        (new_total, state::config::xp_mint(&cfg))
    };

    v::require_xp_mint(recipient_token_account, &xp_mint_key)?;

    let seeds = config_seeds();
    token2022::mint_to_signed(
        xp_mint,
        recipient_token_account,
        config,
        amount,
        &Signer::from(&seeds),
    )?;

    {
        let mut d = minter_role.try_borrow_mut()?;
        role_off.set_total_xp_minted(&mut d, new_total);
    }

    events::emit_xp_rewarded(
        minter.address(),
        recipient_token_account.address(),
        amount,
        memo,
        v::now()?,
    );
    Ok(())
}
