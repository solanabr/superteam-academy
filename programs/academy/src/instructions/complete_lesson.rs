use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

use crate::{
    errors::AcademyError,
    state::{Config, Course, Enrollment},
    utils::mint_xp,
};

pub fn complete_lesson(ctx: Context<CompleteLesson>, lesson_index: u8) -> Result<()> {
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

    let course = &ctx.accounts.course;
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
        lesson_index < course.lesson_count,
        AcademyError::LessonOutOfBounds
    );
    require!(
        !enrollment.is_lesson_complete(lesson_index),
        AcademyError::LessonAlreadyCompleted
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

    enrollment.set_lesson_complete(lesson_index)?;
    mint_xp(
        &ctx.accounts.config,
        &ctx.accounts.xp_mint,
        &ctx.accounts.learner_token_account,
        &ctx.accounts.token_program,
        course.xp_per_lesson as u64,
    )?;

    emit!(LessonCompleted {
        learner: ctx.accounts.learner.key(),
        course_id: course.course_id.clone(),
        lesson_index,
        xp_earned: course.xp_per_lesson,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct CompleteLesson<'info> {
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,
    #[account(seeds = [b"course", course.course_id.as_bytes()], bump = course.bump)]
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
    pub xp_mint: InterfaceAccount<'info, Mint>,
    pub backend_signer: Signer<'info>,
    pub token_program: Interface<'info, TokenInterface>,
}

#[event]
pub struct LessonCompleted {
    pub learner: Pubkey,
    pub course_id: String,
    pub lesson_index: u8,
    pub xp_earned: u32,
    pub timestamp: i64,
}
