use anchor_lang::prelude::*;

pub const MAX_COURSE_ID_LEN: usize = 32;

#[account]
pub struct Course {
    pub course_id: String,
    pub creator: Pubkey,
    pub authority: Pubkey,
    pub content_tx_id: [u8; 32],
    pub version: u16,
    pub lesson_count: u8,
    pub difficulty: u8,
    pub xp_per_lesson: u32,
    pub track_id: u16,
    pub track_level: u8,
    pub prerequisite: Option<Pubkey>,
    pub completion_bonus_xp: u32,
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
    pub const SIZE: usize = 8
        + (4 + MAX_COURSE_ID_LEN)
        + 32
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
        + 4
        + 2
        + 4
        + 4
        + 1
        + 8
        + 8
        + 8
        + 1; // 228
}
