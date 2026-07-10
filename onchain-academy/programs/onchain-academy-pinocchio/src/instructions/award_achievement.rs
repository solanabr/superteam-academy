//! `award_achievement()` — minter + backend cosigned: mints a soulbound
//! achievement NFT (supply-gated), optionally mints XP through the minter's
//! caps, and creates the one-per-(achievement, recipient) receipt PDA.
//! Accounts: config | achievement_type (mut, PDA) | achievement_receipt
//! (init, payer = payer) | minter_role (mut, PDA over minter.key,
//! role.minter == minter @ Unauthorized) | asset (signer, mut — new keypair)
//! | collection (mut, == achievement_type.collection @ Unauthorized) |
//! recipient | recipient_token_account (mut) | xp_mint (mut, ==
//! config.xp_mint @ Unauthorized) | payer (signer, mut) | minter (signer) |
//! backend_signer (signer, == config.backend_signer @ Unauthorized) |
//! mpl_core_program (address) | token_program (address) | system_program.

use pinocchio::{
    cpi::{Seed, Signer},
    AccountView, ProgramResult,
};

use crate::consts::*;
use crate::cpi::system::create_pda_account;
use crate::cpi::{config_seeds, mpl_core, token2022};
use crate::errors::{academy, AcademyError};
use crate::state::achievement::AchievementTypeOffsets;
use crate::state::minter_role::MinterRoleOffsets;
use crate::validation as v;
use crate::{events, require, state, take_accounts};

pub fn process(accounts: &mut [AccountView], _data: &[u8]) -> ProgramResult {
    take_accounts!(
        [
            config,
            achievement_type,
            achievement_receipt,
            minter_role,
            asset,
            collection,
            recipient,
            recipient_token_account,
            xp_mint,
            payer,
            minter,
            backend_signer,
            mpl_core_program,
            token_program,
            system_program
        ] = accounts
    );

    // -- extraction phase ----------------------------------------------------
    v::expect_account(config, &ACC_CONFIG)?;
    v::expect_account(achievement_type, &ACC_ACHIEVEMENT_TYPE)?;
    let achv_off = {
        let d = achievement_type.try_borrow()?;
        AchievementTypeOffsets::parse(&d)?
    };
    v::expect_account(minter_role, &ACC_MINTER_ROLE)?;
    let role_off = {
        let d = minter_role.try_borrow()?;
        MinterRoleOffsets::parse(&d)?
    };
    v::expect_signer(asset)?;
    v::expect_signer(payer)?;
    v::expect_signer(minter)?;
    v::expect_signer(backend_signer)?;
    v::expect_system_program(system_program)?;

    // -- constraint phase ----------------------------------------------------
    v::expect_config_pda(config)?;
    {
        let d = achievement_type.try_borrow()?;
        let bump = achv_off.bump(&d);
        v::expect_pda(
            achievement_type,
            &[ACHIEVEMENT_SEED, achv_off.achievement_id(&d), &[bump]],
        )?;
    }
    v::expect_writable(achievement_type)?;
    // achievement_receipt `init` (payer = payer) — the double-award guard:
    // a live receipt PDA makes the create CPI fail inside the system program.
    let receipt_bump = {
        let d = achievement_type.try_borrow()?;
        let bump = v::expect_found_pda(
            achievement_receipt,
            &[
                ACHIEVEMENT_RECEIPT_SEED,
                achv_off.achievement_id(&d),
                recipient.address().as_array(),
            ],
        )?;
        let bump_seed = [bump];
        let seeds = [
            Seed::from(ACHIEVEMENT_RECEIPT_SEED),
            Seed::from(achv_off.achievement_id(&d)),
            Seed::from(recipient.address().as_array()),
            Seed::from(&bump_seed),
        ];
        create_pda_account(
            payer,
            achievement_receipt,
            ACHIEVEMENT_RECEIPT_SIZE,
            &ID,
            &Signer::from(&seeds),
        )?;
        bump
    };
    {
        let d = minter_role.try_borrow()?;
        let bump = role_off.bump(&d);
        v::expect_pda(
            minter_role,
            &[MINTER_SEED, minter.address().as_array(), &[bump]],
        )?;
        v::expect_writable(minter_role)?;
        v::expect_key(minter, &role_off.minter(&d), AcademyError::Unauthorized)?;
    }
    v::expect_writable(asset)?;
    v::expect_writable(collection)?;
    {
        let d = achievement_type.try_borrow()?;
        v::expect_key(
            collection,
            &achv_off.collection(&d),
            AcademyError::Unauthorized,
        )?;
    }
    v::expect_writable(recipient_token_account)?;
    v::expect_writable(xp_mint)?;
    {
        let cfg = config.try_borrow()?;
        v::expect_key(
            xp_mint,
            &state::config::xp_mint(&cfg),
            AcademyError::Unauthorized,
        )?;
    }
    v::expect_writable(payer)?;
    {
        let cfg = config.try_borrow()?;
        v::expect_key(
            backend_signer,
            &state::config::backend_signer(&cfg),
            AcademyError::Unauthorized,
        )?;
    }
    v::expect_address(mpl_core_program, &MPL_CORE_ID)?;
    v::expect_address(token_program, &TOKEN_2022_ID)?;

    // -- handler ---------------------------------------------------------------
    let xp_mint_key = {
        let cfg = config.try_borrow()?;
        require!(!state::config::paused(&cfg), AcademyError::MintingPaused);
        state::config::xp_mint(&cfg)
    };

    let (xp_reward, current_supply, max_supply) = {
        let d = achievement_type.try_borrow()?;
        require!(achv_off.is_active(&d), AcademyError::AchievementNotActive);
        (
            achv_off.xp_reward(&d),
            achv_off.current_supply(&d),
            achv_off.max_supply(&d),
        )
    };
    {
        let d = minter_role.try_borrow()?;
        require!(role_off.is_active(&d), AcademyError::MinterNotActive);
    }
    if max_supply > 0 {
        require!(
            current_supply < max_supply,
            AcademyError::AchievementSupplyExhausted
        );
    }

    // Enforce the minter's cumulative XP ceiling before any CPI (this path
    // mints XP through the role too, so the cap must gate it).
    let new_total_xp_minted = {
        let d = minter_role.try_borrow()?;
        if xp_reward > 0 {
            require!(
                xp_reward as u64 <= MAX_XP_PER_MINT,
                AcademyError::XpAmountExceedsMax
            );
            let new_total = role_off
                .total_xp_minted(&d)
                .checked_add(xp_reward as u64)
                .ok_or_else(|| academy(AcademyError::Overflow))?;
            let max_total = role_off.max_total_xp(&d);
            if max_total > 0 {
                require!(new_total <= max_total, AcademyError::MinterCapExceeded);
            }
            new_total
        } else {
            role_off.total_xp_minted(&d)
        }
    };

    let next_supply = current_supply
        .checked_add(1)
        .ok_or_else(|| academy(AcademyError::Overflow))?;

    // Mint the soulbound achievement NFT. The achievement_type borrow is held
    // across the CPI — it is not one of the CPI's accounts.
    {
        let d = achievement_type.try_borrow()?;
        let mut supply_buf = [0u8; 20];
        let attrs = [
            mpl_core::Attr {
                key: b"achievement_id",
                value: achv_off.achievement_id(&d),
            },
            mpl_core::Attr {
                key: b"supply_number",
                value: mpl_core::itoa_u64(&mut supply_buf, next_supply as u64),
            },
        ];
        let seeds = config_seeds();
        mpl_core::create_v2_signed(
            mpl_core_program,
            asset,
            collection,
            config,
            payer,
            recipient,
            system_program,
            achv_off.name(&d),
            achv_off.metadata_uri(&d),
            &attrs,
            &Signer::from(&seeds),
        )?;
    }

    if xp_reward > 0 {
        v::require_xp_recipient(recipient_token_account, &xp_mint_key, recipient.address())?;
        let seeds = config_seeds();
        token2022::mint_to_signed(
            xp_mint,
            recipient_token_account,
            config,
            xp_reward as u64,
            &Signer::from(&seeds),
        )?;
    }

    let now = v::now()?;
    {
        let mut d = achievement_type.try_borrow_mut()?;
        achv_off.set_current_supply(&mut d, next_supply);
    }
    {
        let mut d = minter_role.try_borrow_mut()?;
        role_off.set_total_xp_minted(&mut d, new_total_xp_minted);
    }
    {
        let mut d = achievement_receipt.try_borrow_mut()?;
        state::achievement::init_receipt(&mut d, asset.address(), now, receipt_bump);
    }

    let d = achievement_type.try_borrow()?;
    events::emit_achievement_awarded(
        achv_off.achievement_id(&d),
        recipient.address(),
        asset.address(),
        xp_reward,
        now,
    );
    Ok(())
}
