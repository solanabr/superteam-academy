use anchor_lang::prelude::*;

use crate::{
    errors::AcademyError,
    state::{Config, Course, CreateCourseParams, MAX_COURSE_ID_LEN},
};

pub fn create_course(ctx: Context<CreateCourse>, params: CreateCourseParams) -> Result<()> {
    require!(!params.course_id.is_empty(), AcademyError::InvalidCourseId);
    require!(
        params.course_id.len() <= MAX_COURSE_ID_LEN,
        AcademyError::InvalidCourseId
    );
    require!(
        params.lesson_count > 0,
        AcademyError::InvalidLessonCount
    );

    require_keys_eq!(
        ctx.accounts.authority.key(),
        ctx.accounts.config.authority,
        AcademyError::Unauthorized
    );

    let course = &mut ctx.accounts.course;
    course.course_id = params.course_id.clone();
    course.creator = params.creator;
    course.content_tx_id = params.content_tx_id;
    course.lesson_count = params.lesson_count;
    course.difficulty = params.difficulty;
    course.xp_per_lesson = params.xp_per_lesson;
    course.track_id = params.track_id;
    course.track_level = params.track_level;
    course.prerequisite = params.prerequisite;
    course.creator_reward_xp = params.creator_reward_xp;
    course.min_completions_for_reward = params.min_completions_for_reward;
    course.completion_count = 0;
    course.is_active = true;
    course.created_at = Clock::get()?.unix_timestamp;
    course.bump = ctx.bumps.course;

    emit!(CourseCreated {
        course_id: course.course_id.clone(),
        creator: course.creator,
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(params: CreateCourseParams)]
pub struct CreateCourse<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Course::LEN,
        seeds = [b"course", params.course_id.as_bytes()],
        bump
    )]
    pub course: Account<'info, Course>,
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct CourseCreated {
    pub course_id: String,
    pub creator: Pubkey,
}
