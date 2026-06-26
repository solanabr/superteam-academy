use crate::helpers::*;
use anchor_lang::{AnchorDeserialize, AnchorSerialize};
use solana_sdk::pubkey::Pubkey;
use onchain_academy::state::Config;

#[test]
fn config_size_constant_is_correct() {
    // discriminator(8) + authority(32) + backend_signer(32) + xp_mint(32)
    // + paused(1) + _reserved(7) + bump(1).
    // `paused` (1) + `_reserved` (7) together still span the original 8
    // reserved bytes, so SIZE is unchanged at 113 — no account resize needed.
    assert_eq!(Config::SIZE, 8 + 32 + 32 + 32 + 1 + 7 + 1);
    assert_eq!(Config::SIZE, 113);
}

#[test]
fn config_serialization_roundtrip() {
    let config = Config {
        authority: Pubkey::new_unique(),
        backend_signer: Pubkey::new_unique(),
        xp_mint: Pubkey::new_unique(),
        paused: true,
        _reserved: [0u8; 7],
        bump: 254,
    };

    let mut buf = Vec::new();
    config.serialize(&mut buf).unwrap();

    let deserialized = Config::deserialize(&mut buf.as_slice()).unwrap();

    assert_eq!(deserialized.authority, config.authority);
    assert_eq!(deserialized.backend_signer, config.backend_signer);
    assert_eq!(deserialized.xp_mint, config.xp_mint);
    assert!(deserialized.paused);
    assert_eq!(deserialized._reserved, [0u8; 7]);
    assert_eq!(deserialized.bump, 254);
}

#[test]
fn config_serialized_size_matches_constant() {
    let config = Config {
        authority: Pubkey::new_unique(),
        backend_signer: Pubkey::new_unique(),
        xp_mint: Pubkey::new_unique(),
        paused: false,
        _reserved: [0u8; 7],
        bump: 255,
    };

    let mut buf = Vec::new();
    config.serialize(&mut buf).unwrap();

    // Serialized data size + 8-byte discriminator should equal SIZE
    assert_eq!(buf.len() + 8, Config::SIZE);
}

#[test]
fn config_pda_is_deterministic() {
    let (pda1, bump1) = config_pda();
    let (pda2, bump2) = config_pda();
    assert_eq!(pda1, pda2);
    assert_eq!(bump1, bump2);
}

#[test]
fn config_pda_is_valid() {
    let (pda, bump) = config_pda();
    let derived = Pubkey::create_program_address(&[b"config", &[bump]], &PROGRAM_ID);
    assert!(derived.is_ok());
    assert_eq!(derived.unwrap(), pda);
}

#[test]
fn config_reserved_bytes_are_zeroed() {
    let config = Config {
        authority: Pubkey::new_unique(),
        backend_signer: Pubkey::new_unique(),
        xp_mint: Pubkey::new_unique(),
        paused: false,
        _reserved: [0u8; 7],
        bump: 1,
    };

    assert_eq!(config._reserved, [0u8; 7]);
    assert_eq!(config._reserved.len(), 7);
}

/// A freshly initialized Config has `paused == false` — minting is open by
/// default. Mirrors `initialize::handler`, which sets `config.paused = false`.
#[test]
fn freshly_initialized_config_is_not_paused() {
    // Exactly the field values the initialize handler writes for the kill-switch
    // (authority/backend_signer/xp_mint vary at runtime; the invariant is paused).
    let config = Config {
        authority: Pubkey::new_unique(),
        backend_signer: Pubkey::new_unique(),
        xp_mint: Pubkey::new_unique(),
        paused: false,
        _reserved: [0u8; 7],
        bump: 1,
    };

    assert!(!config.paused);
}

/// `paused` occupies the FIRST former `_reserved` byte. A legacy Config written
/// before this change has all 8 of those bytes zeroed, so the byte now read as
/// `paused` is 0 → deserializes as `false`. This proves the no-resize migration:
/// existing accounts come back un-paused without any data migration.
#[test]
fn legacy_zeroed_reserved_byte_deserializes_as_not_paused() {
    // Reproduce a legacy account's raw bytes: the new layout is
    // [disc(8)] authority(32) backend_signer(32) xp_mint(32) paused(1) reserved(7) bump(1).
    // Before this change those final 8 bytes (paused + reserved) were one zeroed
    // `[u8; 8]` reserved block. Build that exact byte image (sans discriminator,
    // since Borsh struct (de)serialization here excludes it) and decode it.
    let authority = Pubkey::new_unique();
    let backend_signer = Pubkey::new_unique();
    let xp_mint = Pubkey::new_unique();
    let legacy_bump = 250u8;

    let mut legacy = Vec::new();
    legacy.extend_from_slice(authority.as_ref());
    legacy.extend_from_slice(backend_signer.as_ref());
    legacy.extend_from_slice(xp_mint.as_ref());
    // The former `_reserved: [u8; 8]`, all zero — its first byte is now `paused`.
    legacy.extend_from_slice(&[0u8; 8]);
    legacy.push(legacy_bump);

    let decoded = Config::deserialize(&mut legacy.as_slice()).unwrap();

    assert_eq!(decoded.authority, authority);
    assert_eq!(decoded.backend_signer, backend_signer);
    assert_eq!(decoded.xp_mint, xp_mint);
    assert!(!decoded.paused);
    assert_eq!(decoded._reserved, [0u8; 7]);
    assert_eq!(decoded.bump, legacy_bump);
}
