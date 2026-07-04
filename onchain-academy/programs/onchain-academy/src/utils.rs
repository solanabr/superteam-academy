use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke_signed;

use crate::errors::AcademyError;

/// Hard ceiling on the XP minted in a single instruction.
///
/// Deliberately generous versus the largest legitimate single mint (a
/// course-completion bonus): a max-difficulty course with `xp_per_lesson = 50`
/// and a full 50-lesson roster yields a `2500 * 0.5 = 1250` bonus, and creator
/// rewards / achievement grants sit well below that. This is a tunable backstop,
/// not a business rule — its job is to cap the blast radius of a bug or a leaked
/// `backend_signer` to a bounded per-call amount. It matches the 5000 XP daily
/// ceiling enforced in SQL, so the two limits stay in lockstep.
pub const MAX_XP_PER_MINT: u64 = 5000;

/// Asserts that `token_account` is a Token-2022 account whose base mint equals
/// `expected_mint` (i.e. `Config.xp_mint`).
///
/// The `#[account(mut)]` + program-owner constraints on the recipient ATAs only
/// prove the account is *some* Token-2022 account; without this the backend
/// could point a mint instruction at an ATA of an unrelated Token-2022 mint. The
/// `mint_to` CPI would still fail there (mint/account mismatch), but asserting up
/// front turns that into a precise, named error instead of an opaque CPI failure.
pub fn require_xp_mint(token_account: &AccountInfo, expected_mint: &Pubkey) -> Result<()> {
    let data = token_account.try_borrow_data()?;
    let state =
        spl_token_2022::extension::StateWithExtensions::<spl_token_2022::state::Account>::unpack(
            &data,
        )?;
    require_keys_eq!(state.base.mint, *expected_mint, AcademyError::WrongXpMint);
    Ok(())
}

/// Asserts that `token_account` is a Token-2022 account whose base mint equals
/// `expected_mint` (== `Config.xp_mint`) AND whose token-account authority
/// equals `expected_owner`.
///
/// The mint check alone (see `require_xp_mint`) does not bind *whose* account
/// receives the XP: a leaked/buggy backend could pass any wallet's XP ATA and
/// mint to it while the emitted event names a different learner/creator/recipient.
/// Binding the owner closes that gap — XP can only ever land in the intended
/// identity's own account. Used on every recipient-identity-bearing mint path
/// (complete_lesson, finalize_course, award_achievement); the address-based
/// reward_xp path has no on-chain recipient identity and keeps `require_xp_mint`.
pub fn require_xp_recipient(
    token_account: &AccountInfo,
    expected_mint: &Pubkey,
    expected_owner: &Pubkey,
) -> Result<()> {
    let data = token_account.try_borrow_data()?;
    let state =
        spl_token_2022::extension::StateWithExtensions::<spl_token_2022::state::Account>::unpack(
            &data,
        )?;
    require_keys_eq!(state.base.mint, *expected_mint, AcademyError::WrongXpMint);
    require_keys_eq!(
        state.base.owner,
        *expected_owner,
        AcademyError::Unauthorized
    );
    Ok(())
}

/// Mints XP tokens via Token-2022 CPI. The authority (Config PDA) signs
/// using the provided seeds.
pub fn mint_xp<'info>(
    mint: &AccountInfo<'info>,
    to: &AccountInfo<'info>,
    authority: &AccountInfo<'info>,
    token_program: &AccountInfo<'info>,
    authority_seeds: &[&[u8]],
    amount: u64,
) -> Result<()> {
    let ix = spl_token_2022::instruction::mint_to(
        token_program.key,
        mint.key,
        to.key,
        authority.key,
        &[],
        amount,
    )?;

    invoke_signed(
        &ix,
        &[mint.clone(), to.clone(), authority.clone()],
        &[authority_seeds],
    )?;

    Ok(())
}
