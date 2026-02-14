use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Course {
    /// Unique course identifier (slug)
    #[max_len(32)]
    pub course_id: String,
    /// Course creator (earns XP on completions)
    pub creator: Pubkey,
    /// Who can update course content
    pub authority: Pubkey,
    /// Arweave transaction hash
    pub content_tx_id: [u8; 32],
    /// Content version (incremented on updates)
    pub version: u16,
    /// Content type: 0=arweave, 1=ipfs
    pub content_type: u8,
    /// Total lessons in course
    pub lesson_count: u8,
    /// Lessons that are challenges (subset)
    pub challenge_count: u8,
    /// Difficulty: 1=beginner, 2=intermediate, 3=advanced
    pub difficulty: u8,
    /// Total XP earnable in this course
    pub xp_total: u32,
    /// Track ID (0=standalone, 1=anchor, 2=rust, etc.)
    pub track_id: u16,
    /// Level within track
    pub track_level: u8,
    /// Optional prerequisite course PDA
    pub prerequisite: Option<Pubkey>,
    /// XP awarded to creator per student completion
    pub completion_reward_xp: u32,
    /// Minimum completions before creator earns XP
    pub min_completions_for_reward: u16,
    /// Total completions
    pub total_completions: u32,
    /// Total enrollments
    pub total_enrollments: u32,
    /// Whether course accepts new enrollments
    pub is_active: bool,
    /// Creation timestamp
    pub created_at: i64,
    /// Last update timestamp
    pub updated_at: i64,
    /// Reserved for future use
    pub _reserved: [u8; 16],
    /// PDA bump
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CreateCourseParams {
    pub course_id: String,
    pub creator: Pubkey,
    pub content_tx_id: [u8; 32],
    pub content_type: u8,
    pub lesson_count: u8,
    pub challenge_count: u8,
    pub difficulty: u8,
    pub xp_total: u32,
    pub track_id: u16,
    pub track_level: u8,
    pub prerequisite: Option<Pubkey>,
    pub completion_reward_xp: u32,
    pub min_completions_for_reward: u16,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct UpdateCourseParams {
    pub content_tx_id: Option<[u8; 32]>,
    pub content_type: Option<u8>,
    pub lesson_count: Option<u8>,
    pub challenge_count: Option<u8>,
    pub difficulty: Option<u8>,
    pub xp_total: Option<u32>,
    pub completion_reward_xp: Option<u32>,
    pub min_completions_for_reward: Option<u16>,
    pub is_active: Option<bool>,
}
