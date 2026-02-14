use anchor_lang::prelude::*;

use crate::errors::AcademyError;
use crate::state::{Course, UpdateCourseParams};

#[derive(Accounts)]
pub struct UpdateCourse<'info> {
    #[account(
        mut,
        has_one = authority @ AcademyError::Unauthorized,
    )]
    pub course: Account<'info, Course>,

    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<UpdateCourse>, params: UpdateCourseParams) -> Result<()> {
    let course = &mut ctx.accounts.course;
    let now = Clock::get()?.unix_timestamp;

    if let Some(content_tx_id) = params.content_tx_id {
        course.content_tx_id = content_tx_id;
        course.version = course
            .version
            .checked_add(1)
            .ok_or(AcademyError::ArithmeticOverflow)?;
    }

    if let Some(content_type) = params.content_type {
        course.content_type = content_type;
    }

    if let Some(lesson_count) = params.lesson_count {
        require!(lesson_count > 0, AcademyError::InvalidLessonCount);
        course.lesson_count = lesson_count;
    }

    if let Some(challenge_count) = params.challenge_count {
        course.challenge_count = challenge_count;
    }

    if let Some(difficulty) = params.difficulty {
        course.difficulty = difficulty;
    }

    if let Some(xp_total) = params.xp_total {
        course.xp_total = xp_total;
    }

    if let Some(completion_reward_xp) = params.completion_reward_xp {
        course.completion_reward_xp = completion_reward_xp;
    }

    if let Some(min_completions_for_reward) = params.min_completions_for_reward {
        course.min_completions_for_reward = min_completions_for_reward;
    }

    if let Some(is_active) = params.is_active {
        course.is_active = is_active;
    }

    course.updated_at = now;

    emit!(CourseUpdated {
        course: course.key(),
        version: course.version,
        timestamp: now,
    });

    Ok(())
}

#[event]
pub struct CourseUpdated {
    pub course: Pubkey,
    pub version: u16,
    pub timestamp: i64,
}
