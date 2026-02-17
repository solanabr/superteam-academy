use anchor_lang::prelude::*;

#[error_code]
pub enum AcademyError {
    #[msg("Unauthorized signer")]
    Unauthorized,
    #[msg("Course not active")]
    CourseNotActive,
    #[msg("Already enrolled")]
    AlreadyEnrolled,
    #[msg("Not enrolled")]
    NotEnrolled,
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
    #[msg("Metaplex Core CPI failed")]
    CredentialCpiFailed,
}
