use anchor_lang::prelude::*;

pub const MAX_COURSE_ID_LEN: usize = 32;

#[account]
pub struct Course {
    pub course_id: String,
    /// XP recipient for creator rewards (not an authority — all admin goes through Config)
    pub creator: Pubkey,
    pub content_tx_id: [u8; 32],
    pub version: u16,
    pub lesson_count: u8,
    pub difficulty: u8,
    pub xp_per_lesson: u32,
    pub track_id: u16,
    pub track_level: u8,
    pub prerequisite: Option<Pubkey>,
    pub creator_reward_xp: u32,
    pub min_completions_for_reward: u16,
    pub total_completions: u32,
    pub total_enrollments: u32,
    pub is_active: bool,
    pub created_at: i64,
    pub updated_at: i64,
    pub _reserved: [u8; 8],
    pub bump: u8,
}

impl Course {
    // 8 (discriminator)
    // + (4 + 32) (course_id)
    // + 32 (creator)
    // + 32 (content_tx_id)
    // + 2 (version)
    // + 1 (lesson_count)
    // + 1 (difficulty)
    // + 4 (xp_per_lesson)
    // + 2 (track_id)
    // + 1 (track_level)
    // + (1 + 32) (prerequisite)
    // + 4 (creator_reward_xp)
    // + 2 (min_completions_for_reward)
    // + 4 (total_completions)
    // + 4 (total_enrollments)
    // + 1 (is_active)
    // + 8 (created_at)
    // + 8 (updated_at)
    // + 8 (_reserved)
    // + 1 (bump)
    pub const SIZE: usize = 8
        + (4 + MAX_COURSE_ID_LEN)
        + 32
        + 32
        + 2
        + 1
        + 1
        + 4
        + 2
        + 1
        + (1 + 32)
        + 4
        + 2
        + 4
        + 4
        + 1
        + 8
        + 8
        + 8
        + 1; // 192
}
