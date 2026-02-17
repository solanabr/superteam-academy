use anchor_lang::prelude::*;

pub mod errors;
pub mod events;
pub mod instructions;
pub mod state;
pub mod utils;

use instructions::*;

declare_id!("3YchgRgR65gdRqgTZTM5qQXqtTZn5Kt2i6FPnZVu34Qb");

#[program]
pub mod superteam_academy {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        instructions::initialize::handler(ctx)
    }

    pub fn update_config<'info>(
        ctx: Context<'_, '_, 'info, 'info, UpdateConfig<'info>>,
        params: UpdateConfigParams,
    ) -> Result<()> {
        instructions::update_config::handler(ctx, params)
    }

    pub fn create_course(ctx: Context<CreateCourse>, params: CreateCourseParams) -> Result<()> {
        instructions::create_course::handler(ctx, params)
    }

    pub fn update_course(ctx: Context<UpdateCourse>, params: UpdateCourseParams) -> Result<()> {
        instructions::update_course::handler(ctx, params)
    }

    pub fn enroll<'info>(
        ctx: Context<'_, '_, 'info, 'info, Enroll<'info>>,
        course_id: String,
    ) -> Result<()> {
        instructions::enroll::handler(ctx, course_id)
    }

    pub fn complete_lesson(ctx: Context<CompleteLesson>, lesson_index: u8) -> Result<()> {
        instructions::complete_lesson::handler(ctx, lesson_index)
    }

    pub fn finalize_course(ctx: Context<FinalizeCourse>) -> Result<()> {
        instructions::finalize_course::handler(ctx)
    }

    pub fn close_enrollment(ctx: Context<CloseEnrollment>) -> Result<()> {
        instructions::close_enrollment::handler(ctx)
    }

    pub fn issue_credential(
        ctx: Context<IssueCredential>,
        credential_name: String,
        metadata_uri: String,
        courses_completed: u32,
        total_xp: u64,
    ) -> Result<()> {
        instructions::issue_credential::handler(
            ctx,
            credential_name,
            metadata_uri,
            courses_completed,
            total_xp,
        )
    }

    pub fn upgrade_credential(
        ctx: Context<UpgradeCredential>,
        credential_name: String,
        metadata_uri: String,
        courses_completed: u32,
        total_xp: u64,
    ) -> Result<()> {
        instructions::upgrade_credential::handler(
            ctx,
            credential_name,
            metadata_uri,
            courses_completed,
            total_xp,
        )
    }

    pub fn register_minter(
        ctx: Context<RegisterMinter>,
        params: RegisterMinterParams,
    ) -> Result<()> {
        instructions::register_minter::handler(ctx, params)
    }

    pub fn revoke_minter(ctx: Context<RevokeMinter>) -> Result<()> {
        instructions::revoke_minter::handler(ctx)
    }

    pub fn reward_xp(ctx: Context<RewardXp>, amount: u64, memo: String) -> Result<()> {
        instructions::reward_xp::handler(ctx, amount, memo)
    }

    pub fn create_achievement_type(
        ctx: Context<CreateAchievementType>,
        params: CreateAchievementTypeParams,
    ) -> Result<()> {
        instructions::create_achievement_type::handler(ctx, params)
    }

    pub fn award_achievement(ctx: Context<AwardAchievement>) -> Result<()> {
        instructions::award_achievement::handler(ctx)
    }

    pub fn deactivate_achievement_type(ctx: Context<DeactivateAchievementType>) -> Result<()> {
        instructions::deactivate_achievement_type::handler(ctx)
    }
}
