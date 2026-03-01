use anchor_lang::prelude::*;

#[account]
pub struct Course {
    /// Unique course identifier (slug, max 32 chars)
    pub course_id: String,
    /// Course creator (earns XP on completions)
    pub creator: Pubkey,
    /// Who can update course content
    pub authority: Pubkey,
    /// Arweave transaction hash
    pub content_tx_id: [u8; 32],
    /// Content version
    pub version: u16,
    /// Content type: 0=arweave, 1=ipfs
    pub content_type: u8,
    /// Total lessons in course
    pub lesson_count: u8,
    /// Lessons that are challenges
    pub challenge_count: u8,
    /// Difficulty: 1=beginner, 2=intermediate, 3=advanced
    pub difficulty: u8,
    /// Total XP earnable in this course
    pub xp_total: u32,
    /// Track ID
    pub track_id: u16,
    /// Level within track
    pub track_level: u8,
    /// Optional prerequisite course PDA
    pub prerequisite: Option<Pubkey>,
    /// XP awarded to creator per student completion
    pub completion_reward_xp: u32,
    /// Minimum completions before creator earns XP
    pub min_completions_for_reward: u16,
    /// Padding for alignment
    pub _pad: u16,
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
    /// Reserved bytes
    pub _reserved: [u8; 16],
    /// PDA bump
    pub bump: u8,
}

impl Course {
    pub const MAX_COURSE_ID_LEN: usize = 32;
    
    pub fn size() -> usize {
        8 + // discriminator
        4 + Self::MAX_COURSE_ID_LEN + // course_id (string prefix + max chars)
        32 + // creator
        32 + // authority
        32 + // content_tx_id
        2 + // version
        1 + // content_type
        1 + // lesson_count
        1 + // challenge_count
        1 + // difficulty
        4 + // xp_total
        2 + // track_id
        1 + // track_level
        1 + 32 + // prerequisite (Option<Pubkey>)
        4 + // completion_reward_xp
        2 + // min_completions_for_reward
        2 + // _pad
        4 + // total_completions
        4 + // total_enrollments
        1 + // is_active
        8 + // created_at
        8 + // updated_at
        16 + // reserved
        1 // bump
    }

    pub fn seeds(course_id: &str) -> Vec<u8> {
        let mut seeds = Vec::with_capacity(6 + course_id.len());
        seeds.extend_from_slice(b"course");
        seeds.extend_from_slice(course_id.as_bytes());
        seeds
    }
}
