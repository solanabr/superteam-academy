use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Enrollment {
    /// The Course PDA this enrollment belongs to
    pub course: Pubkey,
    /// Course version at time of enrollment
    pub enrolled_version: u16,
    /// When learner enrolled
    pub enrolled_at: i64,
    /// When course was completed (None if in progress)
    pub completed_at: Option<i64>,
    /// Lesson completion bitmap (up to 256 lessons)
    pub lesson_flags: [u64; 4],
    /// PDA bump
    pub bump: u8,
}
