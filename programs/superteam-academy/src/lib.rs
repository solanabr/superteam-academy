use anchor_lang::prelude::*;

pub mod errors;
pub mod events;
pub mod instructions;
pub mod state;
pub mod utils;

pub use errors::*;
pub use events::*;
pub use state::*;

use instructions::platform::*;
use instructions::platform_handler;
use instructions::learner::*;
use instructions::course::*;
use instructions::enrollment::*;
use instructions::finalize::*;
use instructions::credential::*;
use instructions::gamification::*;
use instructions::referral::*;
use instructions::cleanup::*;

declare_id!("Acad111111111111111111111111111111111111111");

#[program]
pub mod superteam_academy {
    use super::*;

    // ═══════════════════════════════════════════════════════════════
    // PLATFORM MANAGEMENT
    // ═══════════════════════════════════════════════════════════════

    pub fn initialize(
        ctx: Context<Initialize>,
        max_daily_xp: u32,
        max_achievement_xp: u32,
    ) -> Result<()> {
        platform_handler::handler_initialize(ctx, max_daily_xp, max_achievement_xp)
    }

    pub fn create_season(ctx: Context<CreateSeason>, season: u16) -> Result<()> {
        platform_handler::handler_create_season(ctx, season)
    }

    pub fn close_season(ctx: Context<CloseSeason>) -> Result<()> {
        platform_handler::handler_close_season(ctx)
    }

    pub fn update_config(ctx: Context<UpdateConfig>, params: UpdateConfigParams) -> Result<()> {
        platform_handler::handler_update_config(ctx, params)
    }

    // ═══════════════════════════════════════════════════════════════
    // LEARNER
    // ═══════════════════════════════════════════════════════════════

    pub fn init_learner(ctx: Context<InitLearner>) -> Result<()> {
        instructions::learner::handler_init_learner(ctx)
    }

    // ═══════════════════════════════════════════════════════════════
    // COURSES
    // ═══════════════════════════════════════════════════════════════

    pub fn create_course(ctx: Context<CreateCourse>, params: CreateCourseParams) -> Result<()> {
        instructions::course::handler_create_course(ctx, params)
    }

    pub fn update_course(ctx: Context<UpdateCourse>, params: UpdateCourseParams) -> Result<()> {
        instructions::course::handler_update_course(ctx, params)
    }

    // ═══════════════════════════════════════════════════════════════
    // ENROLLMENT & PROGRESS
    // ═══════════════════════════════════════════════════════════════

    pub fn enroll(ctx: Context<Enroll>) -> Result<()> {
        instructions::enrollment::handler_enroll(ctx)
    }

    pub fn unenroll(ctx: Context<Unenroll>) -> Result<()> {
        instructions::enrollment::handler_unenroll(ctx)
    }

    pub fn complete_lesson(
        ctx: Context<CompleteLesson>,
        lesson_index: u8,
        xp_amount: u32,
    ) -> Result<()> {
        instructions::enrollment::handler_complete_lesson(ctx, lesson_index, xp_amount)
    }

    pub fn finalize_course(ctx: Context<FinalizeCourse>) -> Result<()> {
        instructions::finalize::handler_finalize_course(ctx)
    }

    pub fn issue_credential(
        ctx: Context<IssueCredential>,
        params: IssueCredentialParams,
    ) -> Result<()> {
        instructions::credential::handler_issue_credential(ctx, params)
    }

    // ═══════════════════════════════════════════════════════════════
    // GAMIFICATION
    // ═══════════════════════════════════════════════════════════════

    pub fn claim_achievement(
        ctx: Context<ClaimAchievement>,
        achievement_index: u8,
        xp_reward: u32,
    ) -> Result<()> {
        instructions::gamification::handler_claim_achievement(ctx, achievement_index, xp_reward)
    }

    pub fn award_streak_freeze(ctx: Context<AwardStreakFreeze>) -> Result<()> {
        instructions::gamification::handler_award_streak_freeze(ctx)
    }

    // ═══════════════════════════════════════════════════════════════
    // REFERRALS
    // ═══════════════════════════════════════════════════════════════

    pub fn register_referral(ctx: Context<RegisterReferral>) -> Result<()> {
        instructions::referral::handler_register_referral(ctx)
    }

    // ═══════════════════════════════════════════════════════════════
    // CLEANUP
    // ═══════════════════════════════════════════════════════════════

    pub fn close_enrollment(ctx: Context<CloseEnrollment>) -> Result<()> {
        instructions::cleanup::handler_close_enrollment(ctx)
    }
}
