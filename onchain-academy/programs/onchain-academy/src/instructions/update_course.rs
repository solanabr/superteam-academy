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
    /// Set/backfill the Metaplex Core credential collection for this course.
    pub new_collection: Option<Pubkey>,
    /// Grow the lesson count when a course is extended after deploy (e.g. a
    /// teacher adds lessons). Increase-only: `lesson_count` seeds the enrollment
    /// completion bitmap position and gates `complete_lesson`, so shrinking it
    /// would strand already-completed high-index lessons.
    pub new_lesson_count: Option<u8>,
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

    if let Some(collection) = params.new_collection {
        // Only allow setting the collection while it is unset (backfill / self-heal).
        // Re-pointing a live collection would orphan existing credential holders;
        // a deliberate re-bind must go through a separate explicit instruction.
        require!(
            course.collection == Pubkey::default() || course.collection == collection,
            AcademyError::CollectionMismatch
        );
        course.collection = collection;
    }

    if let Some(new_lesson_count) = params.new_lesson_count {
        require!(
            new_lesson_count >= course.lesson_count,
            AcademyError::LessonCountCannotDecrease
        );
        course.lesson_count = new_lesson_count;
    }

    course.updated_at = now;

    emit!(CourseUpdated {
        course: course_key,
        version: course.version,
        collection: course.collection,
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
