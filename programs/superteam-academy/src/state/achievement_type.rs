use anchor_lang::prelude::*;

pub const MAX_ACHIEVEMENT_ID_LEN: usize = 32;
pub const MAX_ACHIEVEMENT_NAME_LEN: usize = 64;
pub const MAX_ACHIEVEMENT_URI_LEN: usize = 128;

#[account]
pub struct AchievementType {
    pub achievement_id: String,
    pub name: String,
    /// Default metadata URI for minted NFTs
    pub metadata_uri: String,
    /// Metaplex Core collection for this achievement
    pub collection: Pubkey,
    pub creator: Pubkey,
    /// 0 = unlimited supply
    pub max_supply: u32,
    pub current_supply: u32,
    /// XP awarded alongside the NFT (0 = no XP)
    pub xp_reward: u32,
    pub is_active: bool,
    pub created_at: i64,
    pub _reserved: [u8; 8],
    pub bump: u8,
}

impl AchievementType {
    pub const SIZE: usize = 8
        + (4 + MAX_ACHIEVEMENT_ID_LEN)
        + (4 + MAX_ACHIEVEMENT_NAME_LEN)
        + (4 + MAX_ACHIEVEMENT_URI_LEN)
        + 32
        + 32
        + 4
        + 4
        + 4
        + 1
        + 8
        + 8
        + 1; // 338
}

/// Thin PDA for on-chain double-award prevention.
/// Seeds: ["achievement_receipt", achievement_id.as_bytes(), recipient.key()]
#[account]
pub struct AchievementReceipt {
    /// Metaplex Core NFT address
    pub asset: Pubkey,
    pub awarded_at: i64,
    pub bump: u8,
}

impl AchievementReceipt {
    pub const SIZE: usize = 8 + 32 + 8 + 1; // 49
}
