use anchor_lang::prelude::*;

#[error_code]
pub enum AcademyError {
    #[msg("Course is not active")]
    CourseNotActive = 6000,
    #[msg("Lesson index out of bounds")]
    LessonOutOfBounds = 6001,
    #[msg("Lesson already completed")]
    LessonAlreadyCompleted = 6002,
    #[msg("Not all lessons completed")]
    CourseNotCompleted = 6003,
    #[msg("Course already finalized")]
    CourseAlreadyFinalized = 6004,
    #[msg("Course not yet finalized")]
    CourseNotFinalized = 6005,
    #[msg("Prerequisite course not completed")]
    PrerequisiteNotMet = 6006,
    #[msg("24h cooldown for incomplete courses")]
    UnenrollCooldown = 6007,
    #[msg("Minter role is not active")]
    MinterNotActive = 6008,
    #[msg("Amount exceeds per-call XP cap")]
    MinterAmountExceeded = 6009,
    #[msg("Achievement is not active")]
    AchievementNotActive = 6010,
    #[msg("Max supply reached")]
    AchievementSupplyExhausted = 6011,
    #[msg("Invalid amount")]
    InvalidAmount = 6012,
    #[msg("Unauthorized")]
    Unauthorized = 6013,
    #[msg("Achievement already awarded to recipient")]
    AlreadyAwarded = 6014,
    #[msg("Invalid token account")]
    InvalidTokenAccount = 6015,
    #[msg("Mint mismatch")]
    MintMismatch = 6016,
    #[msg("Arithmetic overflow")]
    Overflow = 6017,
    #[msg("Invalid course id")]
    InvalidCourseId = 6018,
    #[msg("Invalid achievement id")]
    InvalidAchievementId = 6019,
    #[msg("Backend signer mismatch")]
    BackendSignerMismatch = 6020,
    #[msg("Missing prerequisite enrollment")]
    MissingPrerequisiteEnrollment = 6021,
    #[msg("Invalid credential asset")]
    InvalidCredentialAsset = 6022,
    #[msg("Minter role mismatch")]
    MinterRoleMismatch = 6023,
    #[msg("Invalid metadata")]
    InvalidMetadata = 6024,
    #[msg("Invalid lesson count")]
    InvalidLessonCount = 6025,
}
