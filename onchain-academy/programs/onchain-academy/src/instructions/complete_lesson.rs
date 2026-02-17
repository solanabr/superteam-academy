use anchor_lang::prelude::*;

use crate::errors::AcademyError;
use crate::events::LessonCompleted;
use crate::state::{Config, Course, Enrollment};
use crate::utils;

pub fn handler(ctx: Context<CompleteLesson>, lesson_index: u8) -> Result<()> {
    let course = &ctx.accounts.course;
    let enrollment = &mut ctx.accounts.enrollment;
    let config = &ctx.accounts.config;

    require!(
        lesson_index < course.lesson_count,
        AcademyError::LessonOutOfBounds
    );

    let word_index = (lesson_index / 64) as usize;
    let bit_index = lesson_index % 64;
    let mask = 1u64 << bit_index;

    require!(
        enrollment.lesson_flags[word_index] & mask == 0,
        AcademyError::LessonAlreadyCompleted
    );
    enrollment.lesson_flags[word_index] |= mask;

    let config_seeds: &[&[u8]] = &[b"config", &[config.bump]];

    utils::mint_xp(
        &ctx.accounts.xp_mint.to_account_info(),
        &ctx.accounts.learner_token_account.to_account_info(),
        &ctx.accounts.config.to_account_info(),
        &ctx.accounts.token_program.to_account_info(),
        config_seeds,
        course.xp_per_lesson as u64,
    )?;

    emit!(LessonCompleted {
        learner: ctx.accounts.learner.key(),
        course: course.key(),
        lesson_index,
        xp_earned: course.xp_per_lesson,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct CompleteLesson<'info> {
    #[account(
        seeds = [b"config"],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,

    #[account(
        seeds = [b"course", course.course_id.as_bytes()],
        bump = course.bump,
    )]
    pub course: Account<'info, Course>,

    #[account(
        mut,
        seeds = [b"enrollment", course.course_id.as_bytes(), learner.key().as_ref()],
        bump = enrollment.bump,
        constraint = enrollment.course == course.key() @ AcademyError::EnrollmentCourseMismatch,
    )]
    pub enrollment: Account<'info, Enrollment>,

    /// CHECK: Tied to enrollment PDA via seeds constraint.
    pub learner: AccountInfo<'info>,

    /// CHECK: Token-2022 ATA for learner's XP. Validated by Token-2022 CPI + program owner check.
    #[account(
        mut,
        constraint = learner_token_account.owner == &spl_token_2022::id() @ AcademyError::Unauthorized,
    )]
    pub learner_token_account: AccountInfo<'info>,

    /// CHECK: XP mint. Validated by Config.xp_mint constraint.
    #[account(
        mut,
        constraint = xp_mint.key() == config.xp_mint @ AcademyError::Unauthorized,
    )]
    pub xp_mint: AccountInfo<'info>,

    #[account(
        constraint = backend_signer.key() == config.backend_signer @ AcademyError::Unauthorized,
    )]
    pub backend_signer: Signer<'info>,

    /// CHECK: Validated by address constraint.
    #[account(address = spl_token_2022::id())]
    pub token_program: AccountInfo<'info>,
}
