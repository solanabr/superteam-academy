use anchor_lang::prelude::*;

use crate::errors::AcademyError;
use crate::state::{Config, Course, CreateCourseParams};

#[derive(Accounts)]
#[instruction(params: CreateCourseParams)]
pub struct CreateCourse<'info> {
    #[account(
        seeds = [b"config"],
        bump = config.bump,
        has_one = authority @ AcademyError::Unauthorized,
    )]
    pub config: Account<'info, Config>,

    #[account(
        init,
        payer = authority,
        space = 8 + Course::INIT_SPACE,
        seeds = [b"course", params.course_id.as_bytes()],
        bump,
    )]
    pub course: Account<'info, Course>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreateCourse>, params: CreateCourseParams) -> Result<()> {
    require!(
        !params.course_id.is_empty() && params.course_id.len() <= 32,
        AcademyError::InvalidCourseId
    );
    require!(
        params.lesson_count > 0 && params.lesson_count <= 255,
        AcademyError::InvalidLessonCount
    );

    let now = Clock::get()?.unix_timestamp;
    let course = &mut ctx.accounts.course;

    course.course_id = params.course_id.clone();
    course.creator = params.creator;
    course.authority = ctx.accounts.authority.key();
    course.content_tx_id = params.content_tx_id;
    course.version = 1;
    course.content_type = params.content_type;
    course.lesson_count = params.lesson_count;
    course.challenge_count = params.challenge_count;
    course.difficulty = params.difficulty;
    course.xp_total = params.xp_total;
    course.track_id = params.track_id;
    course.track_level = params.track_level;
    course.prerequisite = params.prerequisite;
    course.completion_reward_xp = params.completion_reward_xp;
    course.min_completions_for_reward = params.min_completions_for_reward;
    course.total_completions = 0;
    course.total_enrollments = 0;
    course.is_active = true;
    course.created_at = now;
    course.updated_at = now;
    course._reserved = [0u8; 16];
    course.bump = ctx.bumps.course;

    emit!(CourseCreated {
        course: course.key(),
        course_id: params.course_id,
        creator: params.creator,
        track_id: params.track_id,
        track_level: params.track_level,
        timestamp: now,
    });

    Ok(())
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
