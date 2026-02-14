use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;
pub mod utils;

use instructions::*;
use state::*;

declare_id!("STAcademy1111111111111111111111111111111111");

#[program]
pub mod superteam_academy {
    use super::*;

    // =====================================================================
    // Platform Management (Authority-gated)
    // =====================================================================

    /// One-time: create Config PDA with rate limit caps.
    pub fn initialize(
        ctx: Context<Initialize>,
        max_daily_xp: u32,
        max_achievement_xp: u32,
    ) -> Result<()> {
        instructions::initialize::handler(ctx, max_daily_xp, max_achievement_xp)
    }

    /// Create a new season's XP mint (Token-2022 with NonTransferable +
    /// PermanentDelegate + MetadataPointer + TokenMetadata).
    pub fn create_season(ctx: Context<CreateSeason>, season: u16) -> Result<()> {
        instructions::create_season::handler(ctx, season)
    }

    /// Close the current season (no more XP minting).
    pub fn close_season(ctx: Context<CloseSeason>) -> Result<()> {
        instructions::close_season::handler(ctx)
    }

    /// Update config: rotate backend signer, adjust rate limits.
    pub fn update_config(ctx: Context<UpdateConfig>, params: UpdateConfigParams) -> Result<()> {
        instructions::update_config::handler(ctx, params)
    }

    // =====================================================================
    // Courses (Authority-gated)
    // =====================================================================

    /// Register a new course with content reference, track, and economics.
    pub fn create_course(ctx: Context<CreateCourse>, params: CreateCourseParams) -> Result<()> {
        instructions::create_course::handler(ctx, params)
    }

    /// Update course content, rewards, or toggle active status.
    pub fn update_course(ctx: Context<UpdateCourse>, params: UpdateCourseParams) -> Result<()> {
        instructions::update_course::handler(ctx, params)
    }

    // =====================================================================
    // Learner
    // =====================================================================

    /// Initialize a learner profile PDA.
    pub fn init_learner(ctx: Context<InitLearner>) -> Result<()> {
        instructions::init_learner::handler(ctx)
    }

    /// Register a referral (validates referrer exists, prevents self-referral).
    pub fn register_referral(ctx: Context<RegisterReferral>) -> Result<()> {
        instructions::register_referral::handler(ctx)
    }

    /// Claim an achievement (backend validates eligibility, on-chain caps XP).
    pub fn claim_achievement(
        ctx: Context<ClaimAchievement>,
        achievement_index: u8,
        xp_reward: u32,
    ) -> Result<()> {
        instructions::claim_achievement::handler(ctx, achievement_index, xp_reward)
    }

    /// Award a streak freeze to a learner (backend-gated).
    pub fn award_streak_freeze(ctx: Context<AwardStreakFreeze>) -> Result<()> {
        instructions::award_streak_freeze::handler(ctx)
    }

    // =====================================================================
    // Enrollment & Progress
    // =====================================================================

    /// Enroll in a course (checks prerequisites if set).
    pub fn enroll(ctx: Context<Enroll>, course_id: String) -> Result<()> {
        instructions::enroll::handler(ctx, course_id)
    }

    /// Abandon a course, reclaim rent (24h cooldown, no XP).
    pub fn unenroll(ctx: Context<Unenroll>, course_id: String) -> Result<()> {
        instructions::unenroll::handler(ctx, course_id)
    }

    /// Complete a lesson (backend-signed, awards XP, updates streak).
    pub fn complete_lesson(
        ctx: Context<CompleteLesson>,
        lesson_index: u8,
        xp_amount: u32,
    ) -> Result<()> {
        instructions::complete_lesson::handler(ctx, lesson_index, xp_amount)
    }

    /// Finalize entire course: verify bitmap, award XP to learner + creator.
    pub fn finalize_course(ctx: Context<FinalizeCourse>) -> Result<()> {
        instructions::finalize_course::handler(ctx)
    }

    /// Issue credential (STUB: validates finalization, emits event).
    pub fn issue_credential(ctx: Context<IssueCredential>) -> Result<()> {
        instructions::issue_credential::handler(ctx)
    }

    /// Close completed enrollment, reclaim rent.
    pub fn close_enrollment(ctx: Context<CloseEnrollment>, course_id: String) -> Result<()> {
        instructions::close_enrollment::handler(ctx, course_id)
    }
}
