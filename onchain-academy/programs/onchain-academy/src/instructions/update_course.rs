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
    /// Set/backfill the Metaplex Core credential collection for this course.
    pub new_collection: Option<Pubkey>,
    /// Replace the 256-bit live-lesson mask. Add, remove, reorder and replace
    /// lessons all reduce to writing a new mask: retiring a slot clears its bit,
    /// adding one sets a fresh bit. The chain cannot know slots are never reused
    /// — the repo's `slots.lock.json` is the only invariant carrier — so this is
    /// trusted blindly here; the sync route asserts the mask matches the lockfile
    /// right before signing (spec §11.0). Replaces v1's `new_lesson_count`.
    pub new_active_lessons: Option<[u64; 4]>,
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

    if let Some(active_lessons) = params.new_active_lessons {
        course.active_lessons = active_lessons;
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
