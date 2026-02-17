use anchor_lang::prelude::*;

pub const MAX_LABEL_LEN: usize = 32;

#[account]
pub struct MinterRole {
    /// Wallet or program PDA authorized to mint XP
    pub minter: Pubkey,
    /// Human-readable label ("streak-program", "irl-events", etc.)
    pub label: String,
    /// Per-call XP cap. 0 = unlimited.
    pub max_xp_per_call: u64,
    /// Lifetime XP minted through this role
    pub total_xp_minted: u64,
    pub is_active: bool,
    pub created_at: i64,
    pub _reserved: [u8; 8],
    pub bump: u8,
}

impl MinterRole {
    // 8 (discriminator)
    // + 32 (minter)
    // + (4 + 32) (label)
    // + 8 (max_xp_per_call)
    // + 8 (total_xp_minted)
    // + 1 (is_active)
    // + 8 (created_at)
    // + 8 (_reserved)
    // + 1 (bump)
    pub const SIZE: usize = 8 + 32 + (4 + MAX_LABEL_LEN) + 8 + 8 + 1 + 8 + 8 + 1; // 110
}
