use anchor_lang::prelude::*;

pub const MAX_COURSE_ID_LEN: usize = 32;

#[account]
pub struct Course {
    pub course_id: String,
    /// XP recipient for creator rewards (not an authority — all admin goes through Config)
    pub creator: Pubkey,
    pub content_tx_id: [u8; 32],
    pub version: u16,
    /// 256-bit mask of live lesson slots, mirroring `Enrollment.lesson_flags`.
    /// Bit `i` set ⇒ slot `i` is a live lesson. Replaces the v1 `lesson_count`
    /// (u8): the live-lesson count is `live_lesson_count()` (popcount) and
    /// completion is `lesson_flags & active_lessons == active_lessons`, so
    /// retiring a slot (clearing its bit) never strands a completed learner.
    pub active_lessons: [u64; 4],
    pub difficulty: u8,
    pub xp_per_lesson: u32,
    pub track_id: u16,
    pub track_level: u8,
    pub prerequisite: Option<Pubkey>,
    /// XP minted to the creator on every completion; no completion-count
    /// threshold or window (still bounded per mint by MAX_XP_PER_MINT).
    pub creator_reward_xp: u32,
    pub total_completions: u32,
    pub total_enrollments: u32,
    pub is_active: bool,
    pub created_at: i64,
    pub updated_at: i64,
    /// Metaplex Core collection this course's credentials are minted into.
    /// `Pubkey::default()` until set via `create_course`/`update_course`.
    pub collection: Pubkey,
    pub _reserved: [u8; 8],
    pub bump: u8,
}

impl Course {
    // SIZE = 253. The client decoder dispatches on account length, so this must
    // not drift to 255 (the never-deployed v2 layout) — do not grow _reserved to
    // reclaim the 2 bytes freed by dropping min_completions_for_reward.
    // 8 (discriminator)
    // + (4 + 32) (course_id)
    // + 32 (creator)
    // + 32 (content_tx_id)
    // + 2 (version)
    // + 32 (active_lessons: [u64; 4])
    // + 1 (difficulty)
    // + 4 (xp_per_lesson)
    // + 2 (track_id)
    // + 1 (track_level)
    // + (1 + 32) (prerequisite)
    // + 4 (creator_reward_xp)
    // + 4 (total_completions)
    // + 4 (total_enrollments)
    // + 1 (is_active)
    // + 8 (created_at)
    // + 8 (updated_at)
    // + 32 (collection)
    // + 8 (_reserved)
    // + 1 (bump)
    pub const SIZE: usize = 8
        + (4 + MAX_COURSE_ID_LEN)
        + 32
        + 32
        + 2
        + 32
        + 1
        + 4
        + 2
        + 1
        + (1 + 32)
        + 4
        + 4
        + 4
        + 1
        + 8
        + 8
        + 32
        + 8
        + 1; // 253

    /// True if `slot` is a live lesson slot (its bit is set in `active_lessons`).
    /// `slot: u8` spans 0..=255, so every value maps to a valid word/bit of the
    /// 256-bit mask — no bounds check is needed.
    pub fn is_active_slot(&self, slot: u8) -> bool {
        let word = (slot / 64) as usize;
        let bit = slot % 64;
        (self.active_lessons[word] >> bit) & 1 == 1
    }

    /// Number of live lesson slots (popcount of `active_lessons`). Replaces the
    /// v1 `lesson_count` for XP math and the completion gate.
    pub fn live_lesson_count(&self) -> u32 {
        self.active_lessons.iter().map(|w| w.count_ones()).sum()
    }

    /// Dense mask for a course's initial `lesson_count` lessons: bits
    /// `0..lesson_count` set. New courses are always dense; slots are retired
    /// later via `update_course(new_active_lessons)`, never at creation.
    pub fn dense_mask(lesson_count: u8) -> [u64; 4] {
        let mut mask = [0u64; 4];
        // `lesson_count` is u8 (<= 255), so `i` never reaches 255 and cannot
        // overflow; every `i` maps to a valid word (0..=3) / bit (0..=63).
        for i in 0..lesson_count {
            let word = (i / 64) as usize;
            let bit = i % 64;
            mask[word] |= 1u64 << bit;
        }
        mask
    }
}
