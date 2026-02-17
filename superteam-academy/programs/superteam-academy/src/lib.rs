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

    pub fn update_config(ctx: Context<UpdateConfig>, params: UpdateConfigParams) -> Result<()> {
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
    ) -> Result<()> {
        instructions::issue_credential::handler(ctx, credential_name, metadata_uri)
    }

    pub fn upgrade_credential(
        ctx: Context<UpgradeCredential>,
        credential_name: String,
        metadata_uri: String,
    ) -> Result<()> {
        instructions::upgrade_credential::handler(ctx, credential_name, metadata_uri)
    }
}
