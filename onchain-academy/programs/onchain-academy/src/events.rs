use anchor_lang::prelude::*;

#[event]
pub struct ConfigUpdated {
    pub field: String,
    pub timestamp: i64,
}

#[event]
pub struct CourseCreated {
    pub course: Pubkey,
    pub course_id: String,
    pub creator: Pubkey,
    pub track_id: u16,
    pub track_level: u8,
    pub timestamp: i64,
}

#[event]
pub struct CourseUpdated {
    pub course: Pubkey,
    pub version: u16,
    pub timestamp: i64,
}

#[event]
pub struct Enrolled {
    pub learner: Pubkey,
    pub course: Pubkey,
    pub course_version: u16,
    pub timestamp: i64,
}

#[event]
pub struct LessonCompleted {
    pub learner: Pubkey,
    pub course: Pubkey,
    pub lesson_index: u8,
    pub xp_earned: u32,
    pub timestamp: i64,
}

#[event]
pub struct CourseFinalized {
    pub learner: Pubkey,
    pub course: Pubkey,
    pub total_xp: u32,
    pub bonus_xp: u64,
    pub creator: Pubkey,
    pub creator_xp: u32,
    pub timestamp: i64,
}

#[event]
pub struct EnrollmentClosed {
    pub learner: Pubkey,
    pub course: Pubkey,
    pub completed: bool,
    pub rent_reclaimed: u64,
    pub timestamp: i64,
}

#[event]
pub struct CredentialIssued {
    pub learner: Pubkey,
    pub track_id: u16,
    pub credential_asset: Pubkey,
    pub current_level: u8,
    pub timestamp: i64,
}

#[event]
pub struct CredentialUpgraded {
    pub learner: Pubkey,
    pub track_id: u16,
    pub credential_asset: Pubkey,
    pub current_level: u8,
    pub timestamp: i64,
}

#[event]
pub struct MinterRegistered {
    pub minter: Pubkey,
    pub label: String,
    pub max_xp_per_call: u64,
    pub timestamp: i64,
}

#[event]
pub struct MinterRevoked {
    pub minter: Pubkey,
    pub total_xp_minted: u64,
    pub timestamp: i64,
}

#[event]
pub struct XpRewarded {
    pub minter: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub memo: String,
    pub timestamp: i64,
}

#[event]
pub struct AchievementAwarded {
    pub achievement_id: String,
    pub recipient: Pubkey,
    pub asset: Pubkey,
    pub xp_reward: u32,
    pub timestamp: i64,
}

#[event]
pub struct AchievementTypeCreated {
    pub achievement_id: String,
    pub collection: Pubkey,
    pub creator: Pubkey,
    pub max_supply: u32,
    pub xp_reward: u32,
    pub timestamp: i64,
}

#[event]
pub struct AchievementTypeDeactivated {
    pub achievement_id: String,
    pub timestamp: i64,
}

#[event]
pub struct LearnerInitialized {
    pub learner: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct ReferralRegistered {
    pub referrer: Pubkey,
    pub referee: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct AchievementClaimed {
    pub learner: Pubkey,
    pub achievement_index: u8,
    pub xp_reward: u32,
    pub timestamp: i64,
}

#[event]
pub struct StreakFreezeAwarded {
    pub learner: Pubkey,
    pub freezes_remaining: u8,
    pub timestamp: i64,
}

#[event]
pub struct Unenrolled {
    pub learner: Pubkey,
    pub course: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct SeasonCreated {
    pub season: u16,
    pub mint: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct SeasonClosedEvent {
    pub season: u16,
    pub timestamp: i64,
}

#[event]
pub struct StreakBroken {
    pub learner: Pubkey,
    pub final_streak: u16,
    pub timestamp: i64,
}

#[event]
pub struct StreakMilestone {
    pub learner: Pubkey,
    pub milestone: u16,
    pub timestamp: i64,
}
