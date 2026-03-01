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
    #[msg("Course not fully completed")]
    CourseNotCompleted,
    #[msg("Course already completed")]
    CourseAlreadyCompleted,
    #[msg("Achievement already claimed")]
    AchievementAlreadyClaimed,
    #[msg("Course not finalized; issue_credential requires finalize_course to succeed first")]
    CourseNotFinalized,
    #[msg("Season already closed")]
    SeasonClosed,
    #[msg("Cannot refer yourself")]
    SelfReferral,
    #[msg("Already has a referrer")]
    AlreadyReferred,
    #[msg("Referrer not found")]
    ReferrerNotFound,
    #[msg("Prerequisite not met")]
    PrerequisiteNotMet,
    #[msg("Daily XP limit exceeded")]
    DailyXPLimitExceeded,
    #[msg("Unenroll cooldown not met (24h)")]
    UnenrollCooldown,
    #[msg("Enrollment/course mismatch")]
    EnrollmentCourseMismatch,
    #[msg("Season not active")]
    SeasonNotActive,
    #[msg("Math overflow")]
    MathOverflow,
}
