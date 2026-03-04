use anchor_lang::prelude::*;

#[account]
pub struct Enrollment {
    /// The Course PDA this enrollment belongs to
    pub course: Pubkey,
    /// When learner enrolled
    pub enrolled_at: i64,
    /// When course was completed (None if in progress)
    pub completed_at: Option<i64>,
    /// Lesson completion bitmap: 4 × u64 = 256 bits.
    /// lesson_count is u8 (max 255), so all valid indices fit within this bitmap.
    pub lesson_flags: [u64; 4],
    /// Credential NFT address for this track (set by issue_credential)
    pub credential_asset: Option<Pubkey>,
    /// Reserved for future use (4 bytes — differs from 8 on other accounts; cannot resize without migration)
    pub _reserved: [u8; 4],
    /// PDA bump
    pub bump: u8,
}

impl Enrollment {
    // 8 (discriminator)
    // + 32 (course)
    // + 8 (enrolled_at)
    // + 1 + 8 (completed_at: Option<i64>)
    // + 32 (lesson_flags: [u64; 4])
    // + 1 + 32 (credential_asset: Option<Pubkey>)
    // + 4 (_reserved)
    // + 1 (bump)
    pub const SIZE: usize = 8 + 32 + 8 + (1 + 8) + 32 + (1 + 32) + 4 + 1; // 127
}
