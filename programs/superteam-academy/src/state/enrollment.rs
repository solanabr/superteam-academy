use anchor_lang::prelude::*;

#[account]
pub struct Enrollment {
    /// The Course PDA this enrollment belongs to
    pub course: Pubkey,
    /// Course version at time of enrollment
    pub enrolled_version: u16,
    /// When learner enrolled
    pub enrolled_at: i64,
    /// When course was completed
    pub completed_at: Option<i64>,
    /// Lesson completion bitmap (up to 256 lessons)
    pub lesson_flags: [u64; 4],
    /// PDA bump
    pub bump: u8,
}

impl Enrollment {
    pub const SIZE: usize = 8 + // discriminator
        32 + // course
        2 + // enrolled_version
        8 + // enrolled_at
        1 + 8 + // completed_at (Option<i64>)
        32 + // lesson_flags (4 * 8)
        1; // bump

    pub fn seeds(course_id: &str, learner: &Pubkey) -> Vec<u8> {
        let mut seeds = Vec::with_capacity(46 + course_id.len());
        seeds.extend_from_slice(b"enrollment");
        seeds.extend_from_slice(course_id.as_bytes());
        seeds.extend_from_slice(learner.as_ref());
        seeds
    }

    pub fn is_lesson_completed(&self, lesson_index: u8) -> bool {
        let word = (lesson_index / 64) as usize;
        let bit = lesson_index % 64;
        self.lesson_flags[word] & (1u64 << bit) != 0
    }

    pub fn complete_lesson(&mut self, lesson_index: u8) -> bool {
        if self.is_lesson_completed(lesson_index) {
            return false;
        }
        let word = (lesson_index / 64) as usize;
        let bit = lesson_index % 64;
        self.lesson_flags[word] |= 1u64 << bit;
        true
    }

    pub fn completed_lessons_count(&self) -> u8 {
        let mut count = 0u8;
        for word in &self.lesson_flags {
            count = count.saturating_add(word.count_ones() as u8);
        }
        count
    }

    pub fn is_course_completed(&self, lesson_count: u8) -> bool {
        self.completed_lessons_count() >= lesson_count
    }
}
