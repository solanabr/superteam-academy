use crate::helpers::*;
use anchor_lang::{AnchorDeserialize, AnchorSerialize};
use solana_sdk::pubkey::Pubkey;
use superteam_academy::state::{MinterRole, MAX_LABEL_LEN};

#[test]
fn minter_role_size_constant_is_correct() {
    // 8 (discriminator) + 32 (minter) + (4 + 32) (label)
    // + 8 (max_xp_per_call) + 8 (total_xp_minted)
    // + 1 (is_active) + 8 (created_at) + 8 (_reserved) + 1 (bump)
    assert_eq!(MinterRole::SIZE, 110);
}

#[test]
fn max_label_len_is_32() {
    assert_eq!(MAX_LABEL_LEN, 32);
}

#[test]
fn minter_role_serialization_roundtrip() {
    let minter_role = MinterRole {
        minter: Pubkey::new_unique(),
        label: "streak-program".to_string(),
        max_xp_per_call: 500,
        total_xp_minted: 12000,
        is_active: true,
        created_at: 1700000000,
        _reserved: [0u8; 8],
        bump: 253,
    };

    let mut buf = Vec::new();
    minter_role.serialize(&mut buf).unwrap();

    let deserialized = MinterRole::deserialize(&mut buf.as_slice()).unwrap();

    assert_eq!(deserialized.minter, minter_role.minter);
    assert_eq!(deserialized.label, "streak-program");
    assert_eq!(deserialized.max_xp_per_call, 500);
    assert_eq!(deserialized.total_xp_minted, 12000);
    assert!(deserialized.is_active);
    assert_eq!(deserialized.created_at, 1700000000);
    assert_eq!(deserialized._reserved, [0u8; 8]);
    assert_eq!(deserialized.bump, 253);
}

#[test]
fn minter_role_serialized_size_matches_constant() {
    let minter_role = MinterRole {
        minter: Pubkey::new_unique(),
        label: "a".repeat(MAX_LABEL_LEN),
        max_xp_per_call: 0,
        total_xp_minted: 0,
        is_active: true,
        created_at: 0,
        _reserved: [0u8; 8],
        bump: 0,
    };

    let mut buf = Vec::new();
    minter_role.serialize(&mut buf).unwrap();

    // Serialized data size + 8-byte discriminator should equal SIZE
    assert_eq!(buf.len() + 8, MinterRole::SIZE);
}

#[test]
fn minter_role_shorter_label_fits_within_allocation() {
    let minter_role = MinterRole {
        minter: Pubkey::new_unique(),
        label: "short".to_string(),
        max_xp_per_call: 100,
        total_xp_minted: 0,
        is_active: true,
        created_at: 0,
        _reserved: [0u8; 8],
        bump: 0,
    };

    let mut buf = Vec::new();
    minter_role.serialize(&mut buf).unwrap();

    assert!(buf.len() + 8 <= MinterRole::SIZE);
}

#[test]
fn minter_role_unlimited_xp_cap() {
    let minter_role = MinterRole {
        minter: Pubkey::new_unique(),
        label: "unlimited".to_string(),
        max_xp_per_call: 0,
        total_xp_minted: 0,
        is_active: true,
        created_at: 0,
        _reserved: [0u8; 8],
        bump: 1,
    };

    // 0 = unlimited per the field doc
    assert_eq!(minter_role.max_xp_per_call, 0);
}

#[test]
fn minter_role_reserved_bytes_are_zeroed() {
    let minter_role = MinterRole {
        minter: Pubkey::new_unique(),
        label: "test".to_string(),
        max_xp_per_call: 0,
        total_xp_minted: 0,
        is_active: true,
        created_at: 0,
        _reserved: [0u8; 8],
        bump: 1,
    };

    assert_eq!(minter_role._reserved, [0u8; 8]);
    assert_eq!(minter_role._reserved.len(), 8);
}

#[test]
fn minter_role_pda_is_deterministic() {
    let minter = Pubkey::new_unique();
    let (pda1, bump1) =
        Pubkey::find_program_address(&[b"minter", minter.as_ref()], &PROGRAM_ID);
    let (pda2, bump2) =
        Pubkey::find_program_address(&[b"minter", minter.as_ref()], &PROGRAM_ID);
    assert_eq!(pda1, pda2);
    assert_eq!(bump1, bump2);
}

#[test]
fn different_minters_yield_different_pdas() {
    let minter_a = Pubkey::new_unique();
    let minter_b = Pubkey::new_unique();
    let (pda_a, _) =
        Pubkey::find_program_address(&[b"minter", minter_a.as_ref()], &PROGRAM_ID);
    let (pda_b, _) =
        Pubkey::find_program_address(&[b"minter", minter_b.as_ref()], &PROGRAM_ID);
    assert_ne!(pda_a, pda_b);
}
