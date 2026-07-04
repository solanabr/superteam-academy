//! Tests for the security-audit remediation (audit hardening).
//!
//! Four fixes, one file:
//!
//! 1. `reward_xp` per-call ceiling — the only general-purpose XP-mint path now
//!    gates `amount <= MAX_XP_PER_MINT` (XpAmountExceedsMax), on top of the
//!    per-minter cap.
//! 2. `update_config` authority rotation — `UpdateConfigParams.new_authority:
//!    Option<Pubkey>` rotates `Config.authority` (co-signed by the current
//!    authority via `has_one`); the zero pubkey is rejected (Unauthorized).
//! 3. `revoke_minter` backend guard — the role whose `minter ==
//!    Config.backend_signer` cannot be closed (Unauthorized), so operators can't
//!    brick the live backend's minting role.
//! 4. recipient-owner binding — `require_xp_recipient` asserts the recipient ATA
//!    is the XP mint AND is owned by the intended learner/creator/recipient, so
//!    XP can only land in that identity's own account.
//!
//! These exercise the real `require_xp_recipient` against packed Token-2022
//! bytes, mirror the handler guards, and pin the error codes — matching the rest
//! of this test crate, which validates handler logic without a runtime.

use anchor_lang::{AnchorDeserialize, AnchorSerialize};
use onchain_academy::errors::AcademyError;
use onchain_academy::instructions::UpdateConfigParams;
use onchain_academy::utils::{require_xp_recipient, MAX_XP_PER_MINT};
use solana_program::account_info::AccountInfo;
use solana_program::program_pack::Pack;
use solana_sdk::pubkey::Pubkey;
use spl_token_2022::state::{Account as Token2022Account, AccountState};

// --- Fix 1: reward_xp absolute per-call ceiling ---

/// The gate added to reward_xp after `amount > 0`:
/// `require!(amount <= MAX_XP_PER_MINT, XpAmountExceedsMax)`. reward_xp is the
/// only general-purpose mint path, so an over-generously-capped (or unlimited)
/// minter role must still not mint more than the ceiling in one call.
fn reward_xp_amount_allowed(amount: u64) -> bool {
    amount > 0 && amount <= MAX_XP_PER_MINT
}

#[test]
fn reward_xp_rejects_amount_over_ceiling() {
    // At/under the ceiling: allowed.
    assert!(reward_xp_amount_allowed(1));
    assert!(reward_xp_amount_allowed(MAX_XP_PER_MINT));
    // One over: rejected — this is the new XpAmountExceedsMax path.
    assert!(!reward_xp_amount_allowed(MAX_XP_PER_MINT + 1));
    assert!(!reward_xp_amount_allowed(u64::MAX));
    // Zero still rejected by the pre-existing InvalidAmount gate.
    assert!(!reward_xp_amount_allowed(0));
}

/// The ceiling is enforced BEFORE and independently of the per-minter cap: even
/// an unlimited role (max_xp_per_call == 0, max_total_xp == 0) is bounded to
/// MAX_XP_PER_MINT per call. Mirrors the ordering in the handler.
#[test]
fn reward_xp_ceiling_binds_even_an_unlimited_role() {
    let max_xp_per_call: u64 = 0; // unlimited per-call
    let over = MAX_XP_PER_MINT + 1;

    // The per-minter per-call gate would allow it (0 == unlimited)...
    let per_minter_allows = max_xp_per_call == 0 || over <= max_xp_per_call;
    assert!(per_minter_allows);
    // ...but the absolute ceiling rejects it first.
    assert!(!reward_xp_amount_allowed(over));
}

// --- Fix 2: update_config authority rotation ---

/// Mirror of the rotation branch in the handler:
/// `if let Some(a) = params.new_authority { require!(a != default); config.authority = a }`.
/// Returns the resulting authority, or an error code for the rejected zero key.
fn apply_authority_rotation(
    current_authority: Pubkey,
    new_authority: Option<Pubkey>,
) -> Result<Pubkey, u32> {
    match new_authority {
        Some(a) if a == Pubkey::default() => Err(6000 + AcademyError::Unauthorized as u32),
        Some(a) => Ok(a),
        None => Ok(current_authority),
    }
}

#[test]
fn authority_rotation_succeeds_for_a_real_key() {
    let current = Pubkey::new_unique();
    let multisig = Pubkey::new_unique();
    assert_ne!(current, multisig);

    // The current authority co-signs (has_one, enforced by the accounts struct);
    // the handler swaps in the new key.
    let result = apply_authority_rotation(current, Some(multisig));
    assert_eq!(result, Ok(multisig));
}

#[test]
fn authority_rotation_rejects_the_zero_pubkey() {
    let current = Pubkey::new_unique();

    // Some(default) is an unrecoverable handoff that would brick governance.
    let result = apply_authority_rotation(current, Some(Pubkey::default()));
    assert_eq!(result, Err(6000 + AcademyError::Unauthorized as u32));
    assert_eq!(result, Err(6000)); // Unauthorized is index 0.
}

#[test]
fn authority_rotation_none_leaves_authority_unchanged() {
    let current = Pubkey::new_unique();
    assert_eq!(apply_authority_rotation(current, None), Ok(current));
}

/// `UpdateConfigParams` now carries `new_authority: Option<Pubkey>` appended
/// after `paused`. Round-trip the meaningful shapes so the wire format (and thus
/// the generated IDL arg) is pinned — including a rotate-only call.
#[test]
fn update_config_params_new_authority_serialization_roundtrip() {
    // Rotate authority only.
    let rotate = UpdateConfigParams {
        new_backend_signer: None,
        paused: None,
        new_authority: Some(Pubkey::new_unique()),
    };
    let mut buf = Vec::new();
    rotate.serialize(&mut buf).unwrap();
    let decoded = UpdateConfigParams::deserialize(&mut buf.as_slice()).unwrap();
    assert_eq!(decoded.new_backend_signer, None);
    assert_eq!(decoded.paused, None);
    assert_eq!(decoded.new_authority, rotate.new_authority);

    // All three fields set together.
    let all = UpdateConfigParams {
        new_backend_signer: Some(Pubkey::new_unique()),
        paused: Some(true),
        new_authority: Some(Pubkey::new_unique()),
    };
    let mut buf = Vec::new();
    all.serialize(&mut buf).unwrap();
    let decoded = UpdateConfigParams::deserialize(&mut buf.as_slice()).unwrap();
    assert_eq!(decoded.new_backend_signer, all.new_backend_signer);
    assert_eq!(decoded.paused, Some(true));
    assert_eq!(decoded.new_authority, all.new_authority);
}

// --- Fix 3: revoke_minter cannot brick the backend's own role ---

/// The guard added to revoke_minter:
/// `require!(role.minter != config.backend_signer, Unauthorized)`. Closing the
/// role whose minter is the live backend_signer would leave the backend
/// authorized as signer but unable to mint (its MinterRole PDA gone).
fn revoke_minter_allowed(role_minter: &Pubkey, backend_signer: &Pubkey) -> bool {
    role_minter != backend_signer
}

#[test]
fn revoke_minter_rejects_the_backends_own_role() {
    let backend_signer = Pubkey::new_unique();

    // Revoking the backend's own role is rejected — operators must rotate
    // backend_signer via update_config first (which deactivates the old role).
    assert!(!revoke_minter_allowed(&backend_signer, &backend_signer));
}

#[test]
fn revoke_minter_allows_any_other_role() {
    let backend_signer = Pubkey::new_unique();
    let other_minter = Pubkey::new_unique();
    assert_ne!(backend_signer, other_minter);

    // A non-backend minter role closes normally.
    assert!(revoke_minter_allowed(&other_minter, &backend_signer));
}

// --- Fix 4: recipient-owner binding (require_xp_recipient) ---

/// Pack an initialized Token-2022 account (base state, no extensions) with the
/// given mint + owner — exactly the byte layout `require_xp_recipient` unpacks.
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

/// Invoke the real `require_xp_recipient` over an owned `AccountInfo` wrapping a
/// packed Token-2022 account (not a logic mirror).
fn call_require_xp_recipient(
    account_mint: Pubkey,
    account_owner: Pubkey,
    expected_mint: &Pubkey,
    expected_owner: &Pubkey,
) -> anchor_lang::Result<()> {
    let key = Pubkey::new_unique();
    let program_owner = spl_token_2022::id();
    let mut lamports: u64 = 1_000_000;
    let mut data = pack_token_account(account_mint, account_owner);

    let account_info = AccountInfo::new(
        &key,
        false,
        true,
        &mut lamports,
        &mut data,
        &program_owner,
        false,
        0,
    );

    require_xp_recipient(&account_info, expected_mint, expected_owner)
}

#[test]
fn require_xp_recipient_accepts_matching_mint_and_owner() {
    let xp_mint = Pubkey::new_unique();
    let learner = Pubkey::new_unique();
    assert!(call_require_xp_recipient(xp_mint, learner, &xp_mint, &learner).is_ok());
}

#[test]
fn require_xp_recipient_rejects_wrong_owner() {
    let xp_mint = Pubkey::new_unique();
    let learner = Pubkey::new_unique();
    let attacker = Pubkey::new_unique();
    assert_ne!(learner, attacker);

    // Right mint, wrong owner: an ATA belonging to someone other than the
    // intended recipient must be rejected with Unauthorized (6000).
    let err = call_require_xp_recipient(xp_mint, attacker, &xp_mint, &learner)
        .expect_err("an ATA owned by a different wallet must be rejected");

    match err {
        anchor_lang::error::Error::AnchorError(ae) => {
            assert_eq!(
                ae.error_code_number,
                AcademyError::Unauthorized as u32 + 6000
            );
            assert_eq!(ae.error_code_number, 6000);
        }
        other => panic!("expected AnchorError(Unauthorized), got {other:?}"),
    }
}

#[test]
fn require_xp_recipient_rejects_wrong_mint() {
    let xp_mint = Pubkey::new_unique();
    let other_mint = Pubkey::new_unique();
    let learner = Pubkey::new_unique();
    assert_ne!(xp_mint, other_mint);

    // Wrong mint (even with the right owner) is rejected with WrongXpMint (6032),
    // checked before the owner assertion — mirrors require_xp_mint's ordering.
    let err = call_require_xp_recipient(other_mint, learner, &xp_mint, &learner)
        .expect_err("an ATA of a different mint must be rejected");

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

// --- Error codes: prior codes never shift (append-only invariant) ---

/// The audit fixes add NO new error variants: they reuse Unauthorized (6000),
/// WrongXpMint (6032), and XpAmountExceedsMax (6033). Pin the three critical
/// codes so a future error-list reorder fails CI instantly.
#[test]
fn audit_fixes_reuse_existing_codes_without_shifting_them() {
    assert_eq!(6000 + AcademyError::Unauthorized as u32, 6000);
    assert_eq!(6000 + AcademyError::MintingPaused as u32, 6031);
    assert_eq!(6000 + AcademyError::WrongXpMint as u32, 6032);
    assert_eq!(6000 + AcademyError::XpAmountExceedsMax as u32, 6033);
}
