use anchor_lang::prelude::*;
use crate::{errors::AcademyError, state::{Config, Course}, events::*};

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CreateCourseParams {
    pub course_id: String,
    pub creator: Pubkey,
    pub authority: Option<Pubkey>,
    pub content_tx_id: [u8; 32],
    pub content_type: u8,
    pub lesson_count: u8,
    pub challenge_count: u8,
    pub difficulty: u8,
    pub xp_total: u32,
    pub track_id: u16,
    pub track_level: u8,
    pub prerequisite: Option<Pubkey>,
    pub completion_reward_xp: u32,
    pub min_completions_for_reward: u16,
}

#[derive(Accounts)]
#[instruction(params: CreateCourseParams)]
pub struct CreateCourse<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        seeds = [Config::SEED],
        bump = config.bump,
        has_one = authority @ AcademyError::Unauthorized
    )]
    pub config: Account<'info, Config>,
    #[account(
        init,
        payer = authority,
        space = Course::size(),
        seeds = [b"course", params.course_id.as_bytes()],
        bump
    )]
    pub course: Account<'info, Course>,
    pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct UpdateCourseParams {
    pub content_tx_id: Option<[u8; 32]>,
    pub content_type: Option<u8>,
    pub is_active: Option<bool>,
    pub completion_reward_xp: Option<u32>,
    pub min_completions_for_reward: Option<u16>,
}

#[derive(Accounts)]
pub struct UpdateCourse<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        constraint = course.authority == authority.key() || course.creator == authority.key() @ AcademyError::Unauthorized
    )]
    pub course: Account<'info, Course>,
}

pub fn handler_create_course(ctx: Context<CreateCourse>, params: CreateCourseParams) -> Result<()> {
    require!(
        params.course_id.len() <= Course::MAX_COURSE_ID_LEN,
        AcademyError::Unauthorized
    );
    
    require!(
        params.lesson_count > 0 && params.lesson_count <= 255,
        AcademyError::Unauthorized
    );

    let course = &mut ctx.accounts.course;
    let now = Clock::get()?.unix_timestamp;
    let bump = ctx.bumps.course;

    course.course_id = params.course_id.clone();
    course.creator = params.creator;
    course.authority = params.authority.unwrap_or(params.creator);
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
    course._pad = 0;
    course.total_completions = 0;
    course.total_enrollments = 0;
    course.is_active = true;
    course.created_at = now;
    course.updated_at = now;
    course._reserved = [0u8; 16];
    course.bump = bump;

    emit!(CourseCreated {
        course: course.key(),
        course_id: params.course_id,
        creator: course.creator,
        track_id: course.track_id,
        track_level: course.track_level,
        timestamp: now,
    });

    msg!("Created course {} with {} lessons", course.course_id, course.lesson_count);

    Ok(())
}

pub fn handler_update_course(ctx: Context<UpdateCourse>, params: UpdateCourseParams) -> Result<()> {
    let course = &mut ctx.accounts.course;
    let now = Clock::get()?.unix_timestamp;

    if let Some(content_tx_id) = params.content_tx_id {
        course.content_tx_id = content_tx_id;
        course.version = course.version.saturating_add(1);
    }

    if let Some(content_type) = params.content_type {
        course.content_type = content_type;
    }

    if let Some(is_active) = params.is_active {
        course.is_active = is_active;
    }

    if let Some(completion_reward_xp) = params.completion_reward_xp {
        course.completion_reward_xp = completion_reward_xp;
    }

    if let Some(min_completions_for_reward) = params.min_completions_for_reward {
        course.min_completions_for_reward = min_completions_for_reward;
    }

    course.updated_at = now;

    emit!(CourseUpdated {
        course: course.key(),
        version: course.version,
        timestamp: now,
    });

    msg!("Updated course {} to version {}", course.course_id, course.version);

    Ok(())
}
