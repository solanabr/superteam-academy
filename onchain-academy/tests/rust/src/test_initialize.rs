use crate::helpers::*;
use anchor_lang::{AnchorDeserialize, AnchorSerialize};
use solana_sdk::pubkey::Pubkey;
use superteam_academy::state::Config;

#[test]
fn config_size_constant_is_correct() {
    // discriminator(8) + authority(32) + backend_signer(32) + xp_mint(32) + _reserved(8) + bump(1)
    assert_eq!(Config::SIZE, 8 + 32 + 32 + 32 + 8 + 1);
    assert_eq!(Config::SIZE, 113);
}

#[test]
fn config_serialization_roundtrip() {
    let config = Config {
        authority: Pubkey::new_unique(),
        backend_signer: Pubkey::new_unique(),
        xp_mint: Pubkey::new_unique(),
        _reserved: [0u8; 8],
        bump: 254,
    };

    let mut buf = Vec::new();
    config.serialize(&mut buf).unwrap();

    let deserialized = Config::deserialize(&mut buf.as_slice()).unwrap();

    assert_eq!(deserialized.authority, config.authority);
    assert_eq!(deserialized.backend_signer, config.backend_signer);
    assert_eq!(deserialized.xp_mint, config.xp_mint);
    assert_eq!(deserialized._reserved, [0u8; 8]);
    assert_eq!(deserialized.bump, 254);
}

#[test]
fn config_serialized_size_matches_constant() {
    let config = Config {
        authority: Pubkey::new_unique(),
        backend_signer: Pubkey::new_unique(),
        xp_mint: Pubkey::new_unique(),
        _reserved: [0u8; 8],
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
        _reserved: [0u8; 8],
        bump: 1,
    };

    assert_eq!(config._reserved, [0u8; 8]);
    assert_eq!(config._reserved.len(), 8);
}
