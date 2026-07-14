use anchor_lang::prelude::*;

use crate::errors::AcademyError;
use crate::events::CourseCreated;
use crate::state::{Config, Course, MAX_COURSE_ID_LEN};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CreateCourseParams {
    pub course_id: String,
    pub creator: Pubkey,
    pub content_tx_id: [u8; 32],
    pub lesson_count: u8,
    pub difficulty: u8,
    pub xp_per_lesson: u32,
    pub track_id: u16,
    pub track_level: u8,
    pub prerequisite: Option<Pubkey>,
    pub creator_reward_xp: u32,
    /// Metaplex Core collection for credential NFTs. `None` defers to a later
    /// `update_course` (the per-course collection is created after the PDA).
    pub collection: Option<Pubkey>,
}

pub fn handler(ctx: Context<CreateCourse>, params: CreateCourseParams) -> Result<()> {
    require!(!params.course_id.is_empty(), AcademyError::CourseIdEmpty);
    require!(
        params.course_id.len() <= MAX_COURSE_ID_LEN,
        AcademyError::CourseIdTooLong
    );
    require!(params.lesson_count > 0, AcademyError::InvalidLessonCount);
    require!(
        (1..=3).contains(&params.difficulty),
        AcademyError::InvalidDifficulty
    );

    let now = Clock::get()?.unix_timestamp;
    let course = &mut ctx.accounts.course;

    course.course_id = params.course_id.clone();
    course.creator = params.creator;
    course.content_tx_id = params.content_tx_id;
    course.version = 1;
    // New courses are dense: bits 0..lesson_count set. Slots are retired later
    // via update_course(new_active_lessons); create never produces holes.
    course.active_lessons = Course::dense_mask(params.lesson_count);
    course.difficulty = params.difficulty;
    course.xp_per_lesson = params.xp_per_lesson;
    course.track_id = params.track_id;
    course.track_level = params.track_level;
    course.prerequisite = params.prerequisite;
    course.creator_reward_xp = params.creator_reward_xp;
    course.total_completions = 0;
    course.total_enrollments = 0;
    course.is_active = true;
    course.created_at = now;
    course.updated_at = now;
    course.collection = params.collection.unwrap_or_default();
    course._reserved = [0u8; 8];
    course.bump = ctx.bumps.course;

    let course_key = course.key();
    let collection = course.collection;

    emit!(CourseCreated {
        course: course_key,
        course_id: params.course_id,
        creator: params.creator,
        track_id: params.track_id,
        track_level: params.track_level,
        collection,
        timestamp: now,
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(params: CreateCourseParams)]
pub struct CreateCourse<'info> {
    #[account(
        init,
        payer = authority,
        space = Course::SIZE,
        seeds = [b"course", params.course_id.as_bytes()],
        bump,
    )]
    pub course: Account<'info, Course>,

    #[account(
        seeds = [b"config"],
        bump = config.bump,
        has_one = authority @ AcademyError::Unauthorized,
    )]
    pub config: Account<'info, Config>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}
