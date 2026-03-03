use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;
pub mod utils;

declare_id!("2JEFfbRwBqZB3nf5JkTGsievs43CDuGettfzBWzf94Mw");

#[program]
pub mod academy {
    use super::*;

    pub fn initialize(ctx: Context<instructions::initialize::Initialize>) -> Result<()> {
        instructions::initialize::initialize(ctx)
    }

    pub fn update_config(
        ctx: Context<instructions::update_config::UpdateConfig>,
        changes: state::ConfigUpdate,
    ) -> Result<()> {
        instructions::update_config::update_config(ctx, changes)
    }

    pub fn create_course(
        ctx: Context<instructions::create_course::CreateCourse>,
        params: state::CreateCourseParams,
    ) -> Result<()> {
        instructions::create_course::create_course(ctx, params)
    }

    pub fn update_course(
        ctx: Context<instructions::update_course::UpdateCourse>,
        changes: state::CourseUpdate,
    ) -> Result<()> {
        instructions::update_course::update_course(ctx, changes)
    }

    pub fn register_minter(
        ctx: Context<instructions::register_minter::RegisterMinter>,
        params: state::RegisterMinterParams,
    ) -> Result<()> {
        instructions::register_minter::register_minter(ctx, params)
    }

    pub fn revoke_minter(ctx: Context<instructions::revoke_minter::RevokeMinter>) -> Result<()> {
        instructions::revoke_minter::revoke_minter(ctx)
    }

    pub fn create_achievement_type(
        ctx: Context<instructions::create_achievement_type::CreateAchievementType>,
        params: state::CreateAchievementTypeParams,
    ) -> Result<()> {
        instructions::create_achievement_type::create_achievement_type(ctx, params)
    }

    pub fn deactivate_achievement_type(
        ctx: Context<instructions::deactivate_achievement_type::DeactivateAchievementType>,
    ) -> Result<()> {
        instructions::deactivate_achievement_type::deactivate_achievement_type(ctx)
    }

    pub fn enroll(
        ctx: Context<instructions::enroll::Enroll>,
        course_id: String,
    ) -> Result<()> {
        instructions::enroll::enroll(ctx, course_id)
    }

    pub fn close_enrollment(
        ctx: Context<instructions::close_enrollment::CloseEnrollment>,
    ) -> Result<()> {
        instructions::close_enrollment::close_enrollment(ctx)
    }

    pub fn complete_lesson(
        ctx: Context<instructions::complete_lesson::CompleteLesson>,
        lesson_index: u8,
    ) -> Result<()> {
        instructions::complete_lesson::complete_lesson(ctx, lesson_index)
    }

    pub fn finalize_course(
        ctx: Context<instructions::finalize_course::FinalizeCourse>,
    ) -> Result<()> {
        instructions::finalize_course::finalize_course(ctx)
    }

    pub fn issue_credential(
        ctx: Context<instructions::issue_credential::IssueCredential>,
        credential_name: String,
        metadata_uri: String,
        courses_completed: u32,
        total_xp: state::I80F48,
    ) -> Result<()> {
        instructions::issue_credential::issue_credential(
            ctx,
            credential_name,
            metadata_uri,
            courses_completed,
            total_xp,
        )
    }

    pub fn upgrade_credential(
        ctx: Context<instructions::upgrade_credential::UpgradeCredential>,
        new_name: String,
        new_uri: String,
        courses_completed: u32,
        total_xp: state::I80F48,
    ) -> Result<()> {
        instructions::upgrade_credential::upgrade_credential(
            ctx,
            new_name,
            new_uri,
            courses_completed,
            total_xp,
        )
    }

    pub fn reward_xp(
        ctx: Context<instructions::reward_xp::RewardXp>,
        amount: state::I80F48,
        reason: String,
    ) -> Result<()> {
        instructions::reward_xp::reward_xp(ctx, amount, reason)
    }

    pub fn award_achievement(
        ctx: Context<instructions::award_achievement::AwardAchievement>,
    ) -> Result<()> {
        instructions::award_achievement::award_achievement(ctx)
    }
}
