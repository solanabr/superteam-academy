use crate::helpers::*;
use anchor_lang::{AnchorDeserialize, AnchorSerialize};
use solana_sdk::pubkey::Pubkey;
use superteam_academy::state::{
    AchievementReceipt, AchievementType, MAX_ACHIEVEMENT_ID_LEN, MAX_ACHIEVEMENT_NAME_LEN,
    MAX_ACHIEVEMENT_URI_LEN,
};

// --- AchievementType ---

#[test]
fn achievement_type_size_constant_is_correct() {
    // 8 (discriminator) + (4 + 32) (achievement_id) + (4 + 64) (name)
    // + (4 + 128) (metadata_uri) + 32 (collection) + 32 (creator)
    // + 4 (max_supply) + 4 (current_supply) + 4 (xp_reward)
    // + 1 (is_active) + 8 (created_at) + 8 (_reserved) + 1 (bump)
    assert_eq!(AchievementType::SIZE, 338);
}

#[test]
fn max_achievement_id_len_is_32() {
    assert_eq!(MAX_ACHIEVEMENT_ID_LEN, 32);
}

#[test]
fn max_achievement_name_len_is_64() {
    assert_eq!(MAX_ACHIEVEMENT_NAME_LEN, 64);
}

#[test]
fn max_achievement_uri_len_is_128() {
    assert_eq!(MAX_ACHIEVEMENT_URI_LEN, 128);
}

#[test]
fn achievement_type_serialization_roundtrip() {
    let achievement = AchievementType {
        achievement_id: "early-adopter".to_string(),
        name: "Early Adopter Badge".to_string(),
        metadata_uri: "https://arweave.net/abc123".to_string(),
        collection: Pubkey::new_unique(),
        creator: Pubkey::new_unique(),
        max_supply: 1000,
        current_supply: 42,
        xp_reward: 500,
        is_active: true,
        created_at: 1700000000,
        _reserved: [0u8; 8],
        bump: 252,
    };

    let mut buf = Vec::new();
    achievement.serialize(&mut buf).unwrap();

    let deserialized = AchievementType::deserialize(&mut buf.as_slice()).unwrap();

    assert_eq!(deserialized.achievement_id, "early-adopter");
    assert_eq!(deserialized.name, "Early Adopter Badge");
    assert_eq!(deserialized.metadata_uri, "https://arweave.net/abc123");
    assert_eq!(deserialized.collection, achievement.collection);
    assert_eq!(deserialized.creator, achievement.creator);
    assert_eq!(deserialized.max_supply, 1000);
    assert_eq!(deserialized.current_supply, 42);
    assert_eq!(deserialized.xp_reward, 500);
    assert!(deserialized.is_active);
    assert_eq!(deserialized.created_at, 1700000000);
    assert_eq!(deserialized._reserved, [0u8; 8]);
    assert_eq!(deserialized.bump, 252);
}

#[test]
fn achievement_type_serialized_size_matches_constant() {
    let achievement = AchievementType {
        achievement_id: "a".repeat(MAX_ACHIEVEMENT_ID_LEN),
        name: "a".repeat(MAX_ACHIEVEMENT_NAME_LEN),
        metadata_uri: "a".repeat(MAX_ACHIEVEMENT_URI_LEN),
        collection: Pubkey::new_unique(),
        creator: Pubkey::new_unique(),
        max_supply: 0,
        current_supply: 0,
        xp_reward: 0,
        is_active: true,
        created_at: 0,
        _reserved: [0u8; 8],
        bump: 0,
    };

    let mut buf = Vec::new();
    achievement.serialize(&mut buf).unwrap();

    // Serialized data size + 8-byte discriminator should equal SIZE
    assert_eq!(buf.len() + 8, AchievementType::SIZE);
}

#[test]
fn achievement_type_shorter_strings_fit_within_allocation() {
    let achievement = AchievementType {
        achievement_id: "short".to_string(),
        name: "Short".to_string(),
        metadata_uri: "https://x.co".to_string(),
        collection: Pubkey::new_unique(),
        creator: Pubkey::new_unique(),
        max_supply: 0,
        current_supply: 0,
        xp_reward: 0,
        is_active: true,
        created_at: 0,
        _reserved: [0u8; 8],
        bump: 0,
    };

    let mut buf = Vec::new();
    achievement.serialize(&mut buf).unwrap();

    assert!(buf.len() + 8 <= AchievementType::SIZE);
}

#[test]
fn achievement_type_unlimited_supply() {
    let achievement = AchievementType {
        achievement_id: "unlimited".to_string(),
        name: "Unlimited Badge".to_string(),
        metadata_uri: "https://arweave.net/xyz".to_string(),
        collection: Pubkey::new_unique(),
        creator: Pubkey::new_unique(),
        max_supply: 0,
        current_supply: 0,
        xp_reward: 100,
        is_active: true,
        created_at: 0,
        _reserved: [0u8; 8],
        bump: 1,
    };

    // 0 = unlimited supply per the field doc
    assert_eq!(achievement.max_supply, 0);
}

#[test]
fn achievement_type_reserved_bytes_are_zeroed() {
    let achievement = AchievementType {
        achievement_id: "test".to_string(),
        name: "Test".to_string(),
        metadata_uri: "https://test.com".to_string(),
        collection: Pubkey::new_unique(),
        creator: Pubkey::new_unique(),
        max_supply: 0,
        current_supply: 0,
        xp_reward: 0,
        is_active: true,
        created_at: 0,
        _reserved: [0u8; 8],
        bump: 1,
    };

    assert_eq!(achievement._reserved, [0u8; 8]);
    assert_eq!(achievement._reserved.len(), 8);
}

#[test]
fn achievement_type_pda_is_deterministic() {
    let achievement_id = "early-adopter";
    let (pda1, bump1) = Pubkey::find_program_address(
        &[b"achievement", achievement_id.as_bytes()],
        &PROGRAM_ID,
    );
    let (pda2, bump2) = Pubkey::find_program_address(
        &[b"achievement", achievement_id.as_bytes()],
        &PROGRAM_ID,
    );
    assert_eq!(pda1, pda2);
    assert_eq!(bump1, bump2);
}

#[test]
fn different_achievement_ids_yield_different_pdas() {
    let (pda_a, _) = Pubkey::find_program_address(
        &[b"achievement", b"badge-a"],
        &PROGRAM_ID,
    );
    let (pda_b, _) = Pubkey::find_program_address(
        &[b"achievement", b"badge-b"],
        &PROGRAM_ID,
    );
    assert_ne!(pda_a, pda_b);
}

// --- AchievementReceipt ---

#[test]
fn achievement_receipt_size_constant_is_correct() {
    // 8 (discriminator) + 32 (asset) + 8 (awarded_at) + 1 (bump)
    assert_eq!(AchievementReceipt::SIZE, 49);
}

#[test]
fn achievement_receipt_serialization_roundtrip() {
    let receipt = AchievementReceipt {
        asset: Pubkey::new_unique(),
        awarded_at: 1700000000,
        bump: 251,
    };

    let mut buf = Vec::new();
    receipt.serialize(&mut buf).unwrap();

    let deserialized = AchievementReceipt::deserialize(&mut buf.as_slice()).unwrap();

    assert_eq!(deserialized.asset, receipt.asset);
    assert_eq!(deserialized.awarded_at, 1700000000);
    assert_eq!(deserialized.bump, 251);
}

#[test]
fn achievement_receipt_serialized_size_matches_constant() {
    let receipt = AchievementReceipt {
        asset: Pubkey::new_unique(),
        awarded_at: 0,
        bump: 0,
    };

    let mut buf = Vec::new();
    receipt.serialize(&mut buf).unwrap();

    // Serialized data size + 8-byte discriminator should equal SIZE
    assert_eq!(buf.len() + 8, AchievementReceipt::SIZE);
}

#[test]
fn achievement_receipt_pda_is_deterministic() {
    let recipient = Pubkey::new_unique();
    let achievement_id = "early-adopter";
    let (pda1, bump1) = Pubkey::find_program_address(
        &[
            b"achievement_receipt",
            achievement_id.as_bytes(),
            recipient.as_ref(),
        ],
        &PROGRAM_ID,
    );
    let (pda2, bump2) = Pubkey::find_program_address(
        &[
            b"achievement_receipt",
            achievement_id.as_bytes(),
            recipient.as_ref(),
        ],
        &PROGRAM_ID,
    );
    assert_eq!(pda1, pda2);
    assert_eq!(bump1, bump2);
}

#[test]
fn different_recipients_yield_different_receipt_pdas() {
    let recipient_a = Pubkey::new_unique();
    let recipient_b = Pubkey::new_unique();
    let achievement_id = "badge";
    let (pda_a, _) = Pubkey::find_program_address(
        &[
            b"achievement_receipt",
            achievement_id.as_bytes(),
            recipient_a.as_ref(),
        ],
        &PROGRAM_ID,
    );
    let (pda_b, _) = Pubkey::find_program_address(
        &[
            b"achievement_receipt",
            achievement_id.as_bytes(),
            recipient_b.as_ref(),
        ],
        &PROGRAM_ID,
    );
    assert_ne!(pda_a, pda_b);
}
