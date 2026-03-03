use anchor_lang::prelude::*;

pub const MAX_COURSE_ID_LEN: usize = 64;
pub const MAX_MINTER_LABEL_LEN: usize = 32;
pub const MAX_ACHIEVEMENT_ID_LEN: usize = 64;
pub const MAX_ACHIEVEMENT_NAME_LEN: usize = 64;
pub const MAX_METADATA_URI_LEN: usize = 200;
pub const MAX_LESSONS: u8 = 256;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Default, PartialEq, Eq)]
pub struct I80F48 {
    pub value: i128,
}

impl I80F48 {
    pub fn from_u64(v: u64) -> Self {
        Self { value: v as i128 }
    }

    pub fn as_u64(self) -> Result<u64> {
        require!(self.value >= 0, crate::errors::AcademyError::InvalidAmount);
        u64::try_from(self.value).map_err(|_| error!(crate::errors::AcademyError::InvalidAmount))
    }

    pub fn checked_add(self, rhs: Self) -> Result<Self> {
        self.value
            .checked_add(rhs.value)
            .map(|value| Self { value })
            .ok_or_else(|| error!(crate::errors::AcademyError::Overflow))
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, Default)]
pub struct ConfigUpdate {
    pub new_backend_signer: Option<Pubkey>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct CreateCourseParams {
    pub course_id: String,
    pub creator: Pubkey,
    pub content_tx_id: [u8; 32],
    pub lesson_count: u8,
    pub difficulty: u8,
    pub xp_per_lesson: u32,
    pub track_id: u32,
    pub track_level: u32,
    pub prerequisite: Option<Pubkey>,
    pub creator_reward_xp: u32,
    pub min_completions_for_reward: u32,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, Default)]
pub struct CourseUpdate {
    pub new_content_tx_id: Option<[u8; 32]>,
    pub new_is_active: Option<bool>,
    pub new_xp_per_lesson: Option<u32>,
    pub new_creator_reward_xp: Option<u32>,
    pub new_min_completions_for_reward: Option<u32>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct RegisterMinterParams {
    pub minter: Pubkey,
    pub label: String,
    pub max_xp_per_call: I80F48,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct CreateAchievementTypeParams {
    pub achievement_id: String,
    pub name: String,
    pub metadata_uri: String,
    pub max_supply: u32,
    pub xp_reward: u32,
}

#[account]
pub struct Config {
    pub authority: Pubkey,
    pub backend_signer: Pubkey,
    pub xp_mint: Pubkey,
    pub bump: u8,
}

impl Config {
    pub const LEN: usize = 32 + 32 + 32 + 1;
}

#[account]
pub struct Course {
    pub course_id: String,
    pub creator: Pubkey,
    pub content_tx_id: [u8; 32],
    pub lesson_count: u8,
    pub difficulty: u8,
    pub xp_per_lesson: u32,
    pub track_id: u32,
    pub track_level: u32,
    pub prerequisite: Option<Pubkey>,
    pub creator_reward_xp: u32,
    pub min_completions_for_reward: u32,
    pub completion_count: u32,
    pub is_active: bool,
    pub created_at: i64,
    pub bump: u8,
}

impl Course {
    pub const LEN: usize = (4 + MAX_COURSE_ID_LEN)
        + 32
        + 32
        + 1
        + 1
        + 4
        + 4
        + 4
        + (1 + 32)
        + 4
        + 4
        + 4
        + 1
        + 8
        + 1;
}

#[account]
pub struct Enrollment {
    pub course_id: String,
    pub learner: Pubkey,
    pub lesson_flags: [u64; 4],
    pub enrolled_at: i64,
    pub completed_at: Option<i64>,
    pub credential_asset: Option<Pubkey>,
    pub bump: u8,
}

impl Enrollment {
    pub const LEN: usize = (4 + MAX_COURSE_ID_LEN) + 32 + 32 + 8 + (1 + 8) + (1 + 32) + 1;

    pub fn is_lesson_complete(&self, lesson_index: u8) -> bool {
        let word_index = (lesson_index / 64) as usize;
        let bit_index = lesson_index % 64;
        ((self.lesson_flags[word_index] >> bit_index) & 1) == 1
    }

    pub fn set_lesson_complete(&mut self, lesson_index: u8) -> Result<()> {
        require!(
            lesson_index < MAX_LESSONS,
            crate::errors::AcademyError::LessonOutOfBounds
        );
        let word_index = (lesson_index / 64) as usize;
        let bit_index = lesson_index % 64;
        self.lesson_flags[word_index] |= 1u64 << bit_index;
        Ok(())
    }

    pub fn completed_lesson_count(&self) -> u32 {
        self.lesson_flags.iter().map(|w| w.count_ones()).sum()
    }

    pub fn all_lessons_complete(&self, lesson_count: u8) -> bool {
        self.completed_lesson_count() == lesson_count as u32
    }
}

#[account]
pub struct MinterRole {
    pub minter: Pubkey,
    pub label: String,
    pub max_xp_per_call: I80F48,
    pub total_xp_minted: I80F48,
    pub is_active: bool,
    pub created_at: i64,
    pub bump: u8,
}

impl MinterRole {
    pub const LEN: usize = 32 + (4 + MAX_MINTER_LABEL_LEN) + 16 + 16 + 1 + 8 + 1;
}

#[account]
pub struct AchievementType {
    pub achievement_id: String,
    pub name: String,
    pub metadata_uri: String,
    pub collection: Pubkey,
    pub current_supply: u32,
    pub max_supply: u32,
    pub xp_reward: u32,
    pub is_active: bool,
    pub created_at: i64,
    pub bump: u8,
}

impl AchievementType {
    pub const LEN: usize = (4 + MAX_ACHIEVEMENT_ID_LEN)
        + (4 + MAX_ACHIEVEMENT_NAME_LEN)
        + (4 + MAX_METADATA_URI_LEN)
        + 32
        + 4
        + 4
        + 4
        + 1
        + 8
        + 1;
}

#[account]
pub struct AchievementReceipt {
    pub achievement_id: String,
    pub recipient: Pubkey,
    pub asset: Pubkey,
    pub awarded_at: i64,
    pub bump: u8,
}

impl AchievementReceipt {
    pub const LEN: usize = (4 + MAX_ACHIEVEMENT_ID_LEN) + 32 + 32 + 8 + 1;
}
