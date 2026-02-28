use anchor_lang::prelude::*;

#[error_code]
pub enum AcademyError {
    #[msg("Unauthorized signer")]
    Unauthorized,
    #[msg("Course not active")]
    CourseNotActive,
    #[msg("Lesson index out of bounds")]
    LessonOutOfBounds,
    #[msg("Lesson already completed")]
    LessonAlreadyCompleted,
    #[msg("Not all lessons completed")]
    CourseNotCompleted,
    #[msg("Course already finalized")]
    CourseAlreadyFinalized,
    #[msg("Course not finalized")]
    CourseNotFinalized,
    #[msg("Prerequisite not met")]
    PrerequisiteNotMet,
    #[msg("Close cooldown not met (24h)")]
    UnenrollCooldown,
    #[msg("Enrollment/course mismatch")]
    EnrollmentCourseMismatch,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Course ID is empty")]
    CourseIdEmpty,
    #[msg("Course ID exceeds max length")]
    CourseIdTooLong,
    #[msg("Lesson count must be at least 1")]
    InvalidLessonCount,
    #[msg("Difficulty must be 1, 2, or 3")]
    InvalidDifficulty,
    #[msg("Credential asset does not match enrollment record")]
    CredentialAssetMismatch,
    #[msg("Credential already issued for this enrollment")]
    CredentialAlreadyIssued,
    #[msg("Minter role is not active")]
    MinterNotActive,
    #[msg("Amount exceeds minter's per-call limit")]
    MinterAmountExceeded,
    #[msg("Minter label exceeds max length")]
    LabelTooLong,
    #[msg("Achievement type is not active")]
    AchievementNotActive,
    #[msg("Achievement max supply reached")]
    AchievementSupplyExhausted,
    #[msg("Achievement ID exceeds max length")]
    AchievementIdTooLong,
    #[msg("Achievement name exceeds max length")]
    AchievementNameTooLong,
    #[msg("Achievement URI exceeds max length")]
    AchievementUriTooLong,
    #[msg("Amount must be greater than zero")]
    InvalidAmount,
    #[msg("XP reward must be greater than zero")]
    InvalidXpReward,
}
