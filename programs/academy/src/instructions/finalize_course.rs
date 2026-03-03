use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

use crate::{
    errors::AcademyError,
    state::{Config, Course, Enrollment},
    utils::mint_xp,
};

pub fn finalize_course(ctx: Context<FinalizeCourse>) -> Result<()> {
    require_keys_eq!(
        ctx.accounts.backend_signer.key(),
        ctx.accounts.config.backend_signer,
        AcademyError::BackendSignerMismatch
    );
    require_keys_eq!(
        ctx.accounts.xp_mint.key(),
        ctx.accounts.config.xp_mint,
        AcademyError::MintMismatch
    );

    let course = &mut ctx.accounts.course;
    let enrollment = &mut ctx.accounts.enrollment;

    require!(course.is_active, AcademyError::CourseNotActive);
    require!(
        enrollment.course_id == course.course_id,
        AcademyError::InvalidCourseId
    );
    require_keys_eq!(
        enrollment.learner,
        ctx.accounts.learner.key(),
        AcademyError::Unauthorized
    );
    require!(
        enrollment.completed_at.is_none(),
        AcademyError::CourseAlreadyFinalized
    );
    require!(
        enrollment.all_lessons_complete(course.lesson_count),
        AcademyError::CourseNotCompleted
    );

    require_keys_eq!(
        ctx.accounts.learner_token_account.owner,
        ctx.accounts.learner.key(),
        AcademyError::InvalidTokenAccount
    );
    require_keys_eq!(
        ctx.accounts.learner_token_account.mint,
        ctx.accounts.xp_mint.key(),
        AcademyError::MintMismatch
    );

    let per_lesson = u64::from(course.xp_per_lesson);
    let lesson_count = u64::from(course.lesson_count);
    let base_xp = per_lesson
        .checked_mul(lesson_count)
        .ok_or_else(|| error!(AcademyError::Overflow))?;
    let bonus_xp = base_xp / 2;

    mint_xp(
        &ctx.accounts.config,
        &ctx.accounts.xp_mint,
        &ctx.accounts.learner_token_account,
        &ctx.accounts.token_program,
        bonus_xp,
    )?;

    let new_completion_count = course
        .completion_count
        .checked_add(1)
        .ok_or_else(|| error!(AcademyError::Overflow))?;
    course.completion_count = new_completion_count;

    let creator_xp = if new_completion_count >= course.min_completions_for_reward {
        course.creator_reward_xp
    } else {
        0
    };

    if creator_xp > 0 {
        require_keys_eq!(ctx.accounts.creator.key(), course.creator, AcademyError::Unauthorized);
        require_keys_eq!(
            ctx.accounts.creator_token_account.owner,
            ctx.accounts.creator.key(),
            AcademyError::InvalidTokenAccount
        );
        require_keys_eq!(
            ctx.accounts.creator_token_account.mint,
            ctx.accounts.xp_mint.key(),
            AcademyError::MintMismatch
        );

        mint_xp(
            &ctx.accounts.config,
            &ctx.accounts.xp_mint,
            &ctx.accounts.creator_token_account,
            &ctx.accounts.token_program,
            u64::from(creator_xp),
        )?;
    }

    enrollment.completed_at = Some(Clock::get()?.unix_timestamp);

    emit!(CourseFinalized {
        learner: ctx.accounts.learner.key(),
        course_id: course.course_id.clone(),
        total_xp: u32::try_from(base_xp).map_err(|_| error!(AcademyError::Overflow))?,
        bonus_xp: u32::try_from(bonus_xp).map_err(|_| error!(AcademyError::Overflow))?,
        creator: course.creator,
        creator_xp,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct FinalizeCourse<'info> {
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,
    #[account(mut, seeds = [b"course", course.course_id.as_bytes()], bump = course.bump)]
    pub course: Account<'info, Course>,
    #[account(
        mut,
        seeds = [b"enrollment", enrollment.course_id.as_bytes(), learner.key().as_ref()],
        bump = enrollment.bump
    )]
    pub enrollment: Account<'info, Enrollment>,
    /// CHECK: Learner pubkey used for ownership checks and enrollment seed validation.
    pub learner: UncheckedAccount<'info>,
    #[account(mut)]
    pub learner_token_account: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub creator_token_account: InterfaceAccount<'info, TokenAccount>,
    /// CHECK: Verified against `course.creator` in handler.
    pub creator: UncheckedAccount<'info>,
    #[account(mut)]
    pub xp_mint: InterfaceAccount<'info, Mint>,
    pub backend_signer: Signer<'info>,
    pub token_program: Interface<'info, TokenInterface>,
}

#[event]
pub struct CourseFinalized {
    pub learner: Pubkey,
    pub course_id: String,
    pub total_xp: u32,
    pub bonus_xp: u32,
    pub creator: Pubkey,
    pub creator_xp: u32,
}
