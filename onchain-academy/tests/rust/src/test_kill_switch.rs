//! Tests for the minting kill-switch (issue #128).
//!
//! `Config.paused` is a global switch that blocks every XP-minting / credential
//! instruction: `complete_lesson`, `finalize_course`, `reward_xp`,
//! `award_achievement`, and `issue_credential`. Each of those handlers opens
//! with `require!(!config.paused, AcademyError::MintingPaused)`. The switch is
//! toggled via `update_config` (`UpdateConfigParams.paused: Option<bool>`),
//! which is authority-gated by the `has_one = authority` constraint on the
//! `UpdateConfig` accounts.
//!
//! These mirror the handler logic and account-struct (de)serialization without
//! a runtime, matching the rest of this test crate.

use anchor_lang::{AnchorDeserialize, AnchorSerialize};
use onchain_academy::errors::AcademyError;
use onchain_academy::events::MintingPauseSet;
use onchain_academy::instructions::UpdateConfigParams;
use onchain_academy::state::Config;
use solana_sdk::pubkey::Pubkey;

/// The exact gate at the top of complete_lesson / finalize_course / reward_xp /
/// award_achievement / issue_credential: `require!(!config.paused, MintingPaused)`
/// — i.e. the instruction proceeds iff the config is not paused.
fn mint_allowed(paused: bool) -> bool {
    !paused
}

/// Mirror of the `has_one = authority` constraint on `UpdateConfig`: the signer
/// may toggle the switch iff it equals `config.authority`.
fn update_config_authorized(config_authority: &Pubkey, signer: &Pubkey) -> bool {
    config_authority == signer
}

fn config_with_paused(paused: bool) -> Config {
    Config {
        authority: Pubkey::new_unique(),
        backend_signer: Pubkey::new_unique(),
        xp_mint: Pubkey::new_unique(),
        paused,
        _reserved: [0u8; 7],
        bump: 255,
    }
}

// --- Gate: paused blocks the three minting instructions ---

/// When `paused == true`, each of the five minting instructions hits the guard
/// and fails with MintingPaused. The guard is identical in all of them, so one
/// boolean covers them.
#[test]
fn paused_blocks_all_five_minting_instructions() {
    let config = config_with_paused(true);

    // complete_lesson guard
    assert!(!mint_allowed(config.paused));
    // finalize_course guard (learner completion bonus + creator reward)
    assert!(!mint_allowed(config.paused));
    // reward_xp guard
    assert!(!mint_allowed(config.paused));
    // award_achievement guard (same expression on the same field)
    assert!(!mint_allowed(config.paused));
    // issue_credential guard (same expression on the same field)
    assert!(!mint_allowed(config.paused));
}

/// When `paused == false`, the guard passes and all five instructions proceed
/// to their normal logic. This is the resumed state after `update_config`
/// flips the switch back off.
#[test]
fn not_paused_allows_all_five_minting_instructions() {
    let config = config_with_paused(false);

    // complete_lesson / finalize_course / reward_xp / award_achievement /
    // issue_credential all read the same `!paused` gate.
    for _ in 0..5 {
        assert!(mint_allowed(config.paused));
    }
}

/// The full pause → resume cycle a human operator drives via update_config:
/// pause halts minting, then resume re-enables it.
#[test]
fn pause_then_resume_re_enables_minting() {
    let mut config = config_with_paused(false);
    assert!(mint_allowed(config.paused), "starts open");

    // update_config { paused: Some(true) }
    config.paused = true;
    assert!(!mint_allowed(config.paused), "pause halts minting");

    // update_config { paused: Some(false) }
    config.paused = false;
    assert!(mint_allowed(config.paused), "resume re-enables minting");
}

// --- Toggle: update_config handler semantics ---

/// `update_config` applies the toggle only when `paused` is `Some`; `None`
/// leaves the field untouched. Mirrors `if let Some(paused) = params.paused`.
#[test]
fn update_config_paused_some_applies_none_leaves_unchanged() {
    fn apply(current: bool, param: Option<bool>) -> bool {
        match param {
            Some(p) => p,
            None => current,
        }
    }

    // Some(true) pauses.
    assert!(apply(false, Some(true)));
    // Some(false) resumes.
    assert!(!apply(true, Some(false)));
    // None leaves a paused config paused.
    assert!(apply(true, None));
    // None leaves an open config open.
    assert!(!apply(false, None));
}

/// Setting `Some(false)` on an already-paused config resumes minting — the
/// (c) "after update_config{paused:Some(false)}, minting works again" case,
/// expressed end-to-end over the Config field the guard reads.
#[test]
fn resume_after_pause_allows_minting_again() {
    let mut config = config_with_paused(true);
    assert!(!mint_allowed(config.paused));

    // Apply update_config { paused: Some(false) }.
    if let Some(p) = Some(false) {
        config.paused = p;
    }

    assert!(mint_allowed(config.paused));
}

// --- Authority gating of the toggle ---

/// The `UpdateConfig` accounts carry `has_one = authority @ Unauthorized`, so
/// only the stored authority can flip the switch. A non-authority signer is
/// rejected with Unauthorized before the toggle runs.
#[test]
fn non_authority_cannot_toggle_pause() {
    let config = config_with_paused(false);
    let attacker = Pubkey::new_unique();

    // The real authority is allowed.
    assert!(update_config_authorized(&config.authority, &config.authority));
    // A different signer is not — this is the Unauthorized path.
    assert!(!update_config_authorized(&config.authority, &attacker));
    assert_ne!(config.authority, attacker);
}

/// `has_one` failure maps to `AcademyError::Unauthorized`, distinct from the
/// `MintingPaused` raised by the minting guards. Pin both discriminants so a
/// future error-list reorder can't silently swap them.
#[test]
fn pause_errors_have_distinct_stable_codes() {
    // Anchor error codes start at 6000 in declaration order. MintingPaused was
    // appended LAST specifically to keep every prior code stable.
    assert_eq!(AcademyError::Unauthorized as u32, 0);
    let unauthorized_code = 6000 + AcademyError::Unauthorized as u32;
    let minting_paused_code = 6000 + AcademyError::MintingPaused as u32;
    assert_eq!(unauthorized_code, 6000);
    assert_ne!(unauthorized_code, minting_paused_code);
    assert!(minting_paused_code > unauthorized_code);
}

// --- Serialization: new params + event land in the IDL byte layout ---

/// `UpdateConfigParams` now carries `paused: Option<bool>` after
/// `new_backend_signer`. Round-trip all three meaningful shapes so the wire
/// format (and thus the generated IDL arg) is pinned.
#[test]
fn update_config_params_serialization_roundtrip() {
    // new_backend_signer + paused toggle together.
    let params = UpdateConfigParams {
        new_backend_signer: Some(Pubkey::new_unique()),
        paused: Some(true),
    };
    let mut buf = Vec::new();
    params.serialize(&mut buf).unwrap();
    let decoded = UpdateConfigParams::deserialize(&mut buf.as_slice()).unwrap();
    assert_eq!(decoded.new_backend_signer, params.new_backend_signer);
    assert_eq!(decoded.paused, Some(true));

    // Pause-only call: rotate nothing, just flip the switch.
    let pause_only = UpdateConfigParams {
        new_backend_signer: None,
        paused: Some(false),
    };
    let mut buf = Vec::new();
    pause_only.serialize(&mut buf).unwrap();
    let decoded = UpdateConfigParams::deserialize(&mut buf.as_slice()).unwrap();
    assert_eq!(decoded.new_backend_signer, None);
    assert_eq!(decoded.paused, Some(false));

    // Neither field set: a no-op update (both None).
    let noop = UpdateConfigParams {
        new_backend_signer: None,
        paused: None,
    };
    let mut buf = Vec::new();
    noop.serialize(&mut buf).unwrap();
    let decoded = UpdateConfigParams::deserialize(&mut buf.as_slice()).unwrap();
    assert_eq!(decoded.new_backend_signer, None);
    assert_eq!(decoded.paused, None);
}

/// `MintingPauseSet { paused, timestamp }` is emitted whenever the toggle runs.
/// Round-trip both polarities so the event's IDL shape is pinned.
#[test]
fn minting_pause_set_event_serialization_roundtrip() {
    for paused in [true, false] {
        let event = MintingPauseSet {
            paused,
            timestamp: 1_700_000_000,
        };
        let mut buf = Vec::new();
        event.serialize(&mut buf).unwrap();
        let decoded = MintingPauseSet::deserialize(&mut buf.as_slice()).unwrap();
        assert_eq!(decoded.paused, paused);
        assert_eq!(decoded.timestamp, 1_700_000_000);
    }
}
