use anchor_lang::prelude::*;

use crate::errors::AcademyError;
use crate::events::CourseUpdated;
use crate::state::{Config, Course};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdateCourseParams {
    pub new_content_tx_id: Option<[u8; 32]>,
    pub new_is_active: Option<bool>,
    pub new_xp_per_lesson: Option<u32>,
    pub new_creator_reward_xp: Option<u32>,
    pub new_min_completions_for_reward: Option<u16>,
}

pub fn handler(ctx: Context<UpdateCourse>, params: UpdateCourseParams) -> Result<()> {
    let course_key = ctx.accounts.course.key();
    let course = &mut ctx.accounts.course;
    let now = Clock::get()?.unix_timestamp;

    if let Some(content_tx_id) = params.new_content_tx_id {
        course.content_tx_id = content_tx_id;
        course.version = course
            .version
            .checked_add(1)
            .ok_or(AcademyError::Overflow)?;
    }

    if let Some(is_active) = params.new_is_active {
        course.is_active = is_active;
    }

    if let Some(xp_per_lesson) = params.new_xp_per_lesson {
        course.xp_per_lesson = xp_per_lesson;
    }

    if let Some(creator_reward_xp) = params.new_creator_reward_xp {
        course.creator_reward_xp = creator_reward_xp;
    }

    if let Some(min_completions) = params.new_min_completions_for_reward {
        course.min_completions_for_reward = min_completions;
    }

    course.updated_at = now;

    emit!(CourseUpdated {
        course: course_key,
        version: course.version,
        timestamp: now,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct UpdateCourse<'info> {
    #[account(
        seeds = [b"config"],
        bump = config.bump,
        has_one = authority @ AcademyError::Unauthorized,
    )]
    pub config: Account<'info, Config>,

    #[account(
        mut,
        seeds = [b"course", course.course_id.as_bytes()],
        bump = course.bump,
    )]
    pub course: Account<'info, Course>,

    pub authority: Signer<'info>,
}
