use anchor_lang::prelude::*;

use crate::{errors::AcademyError, state::{Config, Course, CourseUpdate}};

pub fn update_course(ctx: Context<UpdateCourse>, changes: CourseUpdate) -> Result<()> {
    require_keys_eq!(
        ctx.accounts.authority.key(),
        ctx.accounts.config.authority,
        AcademyError::Unauthorized
    );

    let course = &mut ctx.accounts.course;
    if let Some(content_tx_id) = changes.new_content_tx_id {
        course.content_tx_id = content_tx_id;
    }
    if let Some(is_active) = changes.new_is_active {
        course.is_active = is_active;
    }
    if let Some(xp_per_lesson) = changes.new_xp_per_lesson {
        course.xp_per_lesson = xp_per_lesson;
    }
    if let Some(creator_reward_xp) = changes.new_creator_reward_xp {
        course.creator_reward_xp = creator_reward_xp;
    }
    if let Some(min_completions_for_reward) = changes.new_min_completions_for_reward {
        course.min_completions_for_reward = min_completions_for_reward;
    }

    emit!(CourseUpdated {
        course_id: course.course_id.clone(),
    });

    Ok(())
}

#[derive(Accounts)]
pub struct UpdateCourse<'info> {
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,
    #[account(mut, seeds = [b"course", course.course_id.as_bytes()], bump = course.bump)]
    pub course: Account<'info, Course>,
    pub authority: Signer<'info>,
}

#[event]
pub struct CourseUpdated {
    pub course_id: String,
}
