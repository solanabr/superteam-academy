use crate::helpers::*;
use anchor_lang::{AnchorDeserialize, AnchorSerialize};
use onchain_academy::state::{MinterRole, MAX_LABEL_LEN};
use solana_sdk::pubkey::Pubkey;

#[test]
fn minter_role_size_constant_is_correct() {
    // 8 (discriminator) + 32 (minter) + (4 + 32) (label)
    // + 8 (max_xp_per_call) + 8 (total_xp_minted)
    // + 1 (is_active) + 8 (created_at) + 8 (max_total_xp) + 1 (bump)
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
        max_total_xp: 1_000_000,
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
    assert_eq!(deserialized.max_total_xp, 1_000_000);
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
        max_total_xp: 0,
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
        max_total_xp: 0,
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
        max_total_xp: 0,
        bump: 1,
    };

    // 0 = unlimited per the field docs
    assert_eq!(minter_role.max_xp_per_call, 0);
    assert_eq!(minter_role.max_total_xp, 0);
}

/// max_total_xp occupies the bytes formerly reserved (`[u8; 8]`). A legacy
/// MinterRole whose trailing 8 bytes are zero must deserialize with
/// max_total_xp == 0 (unlimited), so the new ceiling is opt-in and existing
/// roles keep their prior behavior. This encodes the zero-init migration
/// guarantee at the byte level.
#[test]
fn legacy_zeroed_reserved_bytes_deserialize_as_unlimited_cap() {
    // Serialize a role with the former `_reserved` slot left zero (which is
    // exactly the byte layout of every account written before this change).
    let minter_role = MinterRole {
        minter: Pubkey::new_unique(),
        label: "legacy".to_string(),
        max_xp_per_call: 500,
        total_xp_minted: 9000,
        is_active: true,
        created_at: 1700000000,
        max_total_xp: 0,
        bump: 7,
    };

    let mut buf = Vec::new();
    minter_role.serialize(&mut buf).unwrap();

    // The 8 bytes immediately before the trailing `bump` are the max_total_xp
    // slot; for a legacy (reserved-zeroed) account they are all zero.
    let bump_offset = buf.len() - 1;
    let cap_bytes = &buf[bump_offset - 8..bump_offset];
    assert_eq!(cap_bytes, &[0u8; 8]);

    let deserialized = MinterRole::deserialize(&mut buf.as_slice()).unwrap();
    assert_eq!(deserialized.max_total_xp, 0);
    assert_eq!(deserialized.bump, 7);
    assert_eq!(deserialized.total_xp_minted, 9000);
}

#[test]
fn minter_role_pda_is_deterministic() {
    let minter = Pubkey::new_unique();
    let (pda1, bump1) = Pubkey::find_program_address(&[b"minter", minter.as_ref()], &PROGRAM_ID);
    let (pda2, bump2) = Pubkey::find_program_address(&[b"minter", minter.as_ref()], &PROGRAM_ID);
    assert_eq!(pda1, pda2);
    assert_eq!(bump1, bump2);
}

#[test]
fn different_minters_yield_different_pdas() {
    let minter_a = Pubkey::new_unique();
    let minter_b = Pubkey::new_unique();
    let (pda_a, _) = Pubkey::find_program_address(&[b"minter", minter_a.as_ref()], &PROGRAM_ID);
    let (pda_b, _) = Pubkey::find_program_address(&[b"minter", minter_b.as_ref()], &PROGRAM_ID);
    assert_ne!(pda_a, pda_b);
}
