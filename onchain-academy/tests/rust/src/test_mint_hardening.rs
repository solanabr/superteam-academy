//! Tests for the on-chain XP-mint hardening (launch-readiness §3).
//!
//! Two independent guards were added to every XP-minting path
//! (`complete_lesson`, `finalize_course`, `reward_xp`, `award_achievement`):
//!
//! 1. `utils::require_xp_mint(ata, &config.xp_mint)` — unpacks the recipient
//!    Token-2022 account and asserts its base mint equals `Config.xp_mint`,
//!    raising `WrongXpMint` otherwise. Without it, a recipient ATA of an
//!    unrelated Token-2022 mint would pass the program-owner constraint.
//! 2. `require!(amount <= MAX_XP_PER_MINT, XpAmountExceedsMax)` — a tunable
//!    per-call ceiling that bounds the blast radius of a bug or a leaked
//!    `backend_signer`.
//!
//! These exercise the real `require_xp_mint` against packed Token-2022 account
//! bytes, mirror the ceiling gate, and pin the new error codes — matching the
//! rest of this test crate, which validates handler logic without a runtime.

use onchain_academy::errors::AcademyError;
use onchain_academy::utils::{require_xp_mint, MAX_XP_PER_MINT};
use solana_program::account_info::AccountInfo;
use solana_program::program_pack::Pack;
use solana_sdk::pubkey::Pubkey;
use spl_token_2022::state::{Account as Token2022Account, AccountState};

/// Pack an initialized Token-2022 account (base state, no extensions) holding
/// the given mint — exactly the byte layout `require_xp_mint` unpacks.
fn pack_token_account(mint: Pubkey, owner: Pubkey) -> Vec<u8> {
    let account = Token2022Account {
        mint,
        owner,
        amount: 0,
        state: AccountState::Initialized,
        ..Default::default()
    };
    let mut data = vec![0u8; Token2022Account::LEN];
    Token2022Account::pack(account, &mut data).expect("pack token account");
    data
}

/// Build an owned `AccountInfo` over a packed Token-2022 account so the real
/// `require_xp_mint` can be invoked directly (not a logic mirror).
fn call_require_xp_mint(account_mint: Pubkey, expected_mint: &Pubkey) -> anchor_lang::Result<()> {
    let key = Pubkey::new_unique();
    let owner = spl_token_2022::id();
    let ata_owner = Pubkey::new_unique();
    let mut lamports: u64 = 1_000_000;
    let mut data = pack_token_account(account_mint, ata_owner);

    let account_info = AccountInfo::new(
        &key,
        false,
        true,
        &mut lamports,
        &mut data,
        &owner,
        false,
        0,
    );

    require_xp_mint(&account_info, expected_mint)
}

// --- require_xp_mint: mint-matching guard ---

#[test]
fn require_xp_mint_accepts_matching_mint() {
    let xp_mint = Pubkey::new_unique();
    assert!(call_require_xp_mint(xp_mint, &xp_mint).is_ok());
}

#[test]
fn require_xp_mint_rejects_wrong_mint() {
    let xp_mint = Pubkey::new_unique();
    let other_mint = Pubkey::new_unique();
    assert_ne!(xp_mint, other_mint);

    let err = call_require_xp_mint(other_mint, &xp_mint)
        .expect_err("an ATA of a different mint must be rejected");

    // The error must be exactly WrongXpMint (6032), not some opaque unpack
    // failure. `require_keys_eq!` decorates the AnchorError with a source
    // location and the mismatched pubkeys, so match on the code, not the string.
    match err {
        anchor_lang::error::Error::AnchorError(ae) => {
            assert_eq!(
                ae.error_code_number,
                AcademyError::WrongXpMint as u32 + 6000
            );
            assert_eq!(ae.error_code_number, 6032);
        }
        other => panic!("expected AnchorError(WrongXpMint), got {other:?}"),
    }
}

// --- MAX_XP_PER_MINT: per-call ceiling gate ---

/// The exact gate applied before minting in complete_lesson (xp_per_lesson),
/// finalize_course (bonus), and award_achievement (xp_reward):
/// `require!(amount <= MAX_XP_PER_MINT, XpAmountExceedsMax)`.
fn amount_within_ceiling(amount: u64) -> bool {
    amount <= MAX_XP_PER_MINT
}

#[test]
fn max_xp_per_mint_is_5000() {
    // Pinned to the SQL daily ceiling so the two limits stay in lockstep.
    assert_eq!(MAX_XP_PER_MINT, 5000);
}

#[test]
fn ceiling_gate_boundaries() {
    // Below the ceiling: allowed.
    assert!(amount_within_ceiling(0));
    assert!(amount_within_ceiling(4999));
    // Exactly at the ceiling: allowed (<=).
    assert!(amount_within_ceiling(MAX_XP_PER_MINT));
    // One over: rejected.
    assert!(!amount_within_ceiling(MAX_XP_PER_MINT + 1));
    assert!(!amount_within_ceiling(u64::MAX));
}

/// The largest legitimate single mint is the finalize_course completion bonus:
/// `(xp_per_lesson * lesson_count) / 2`. Even a max-difficulty course
/// (xp_per_lesson = 50) with a 50-lesson roster stays under the ceiling, so the
/// backstop never trips on honest traffic.
#[test]
fn largest_legitimate_bonus_is_within_ceiling() {
    let xp_per_lesson: u64 = 50;
    let lesson_count: u64 = 50;
    let bonus = (xp_per_lesson * lesson_count) / 2;
    assert_eq!(bonus, 1250);
    assert!(amount_within_ceiling(bonus));
}

// --- Error codes: append-only, prior codes never shift ---

/// The two new variants were appended at the END of `AcademyError`, so every
/// prior code — critically `MintingPaused` at 6031 — stays put. Anchor numbers
/// variants from 6000 in declaration order. Pin the absolute codes so a future
/// reorder fails CI instantly.
#[test]
fn new_error_codes_are_appended_after_minting_paused() {
    let minting_paused = 6000 + AcademyError::MintingPaused as u32;
    let wrong_xp_mint = 6000 + AcademyError::WrongXpMint as u32;
    let xp_amount_exceeds_max = 6000 + AcademyError::XpAmountExceedsMax as u32;

    // MintingPaused is unchanged.
    assert_eq!(minting_paused, 6031);
    // The two new variants follow it, in order.
    assert_eq!(wrong_xp_mint, 6032);
    assert_eq!(xp_amount_exceeds_max, 6033);

    // Strictly monotonic append — no code reuse or reordering.
    assert!(wrong_xp_mint > minting_paused);
    assert!(xp_amount_exceeds_max > wrong_xp_mint);
}
