use anchor_lang::prelude::*;

use crate::errors::AcademyError;
use crate::events::CourseFinalized;
use crate::state::{Config, Course, Enrollment};
use crate::utils;

pub fn handler(ctx: Context<FinalizeCourse>) -> Result<()> {
    let enrollment = &mut ctx.accounts.enrollment;
    let course = &mut ctx.accounts.course;
    let config = &ctx.accounts.config;
    let now = Clock::get()?.unix_timestamp;

    require!(
        enrollment.completed_at.is_none(),
        AcademyError::CourseAlreadyFinalized
    );

    let completed: u32 = enrollment.lesson_flags.iter().map(|w| w.count_ones()).sum();
    require!(
        completed == course.lesson_count as u32,
        AcademyError::CourseNotCompleted
    );

    enrollment.completed_at = Some(now);

    course.total_completions = course
        .total_completions
        .checked_add(1)
        .ok_or(AcademyError::Overflow)?;

    let config_seeds: &[&[u8]] = &[b"config", &[config.bump]];

    // Completion bonus = 50% of total lesson XP (rounded down)
    let total_lesson_xp = (course.xp_per_lesson as u64)
        .checked_mul(course.lesson_count as u64)
        .ok_or(AcademyError::Overflow)?;
    let bonus_xp = total_lesson_xp / 2;

    if bonus_xp > 0 {
        utils::mint_xp(
            &ctx.accounts.xp_mint.to_account_info(),
            &ctx.accounts.learner_token_account.to_account_info(),
            &ctx.accounts.config.to_account_info(),
            &ctx.accounts.token_program.to_account_info(),
            config_seeds,
            bonus_xp,
        )?;
    }

    // Mint creator reward if threshold met
    let mut creator_xp: u32 = 0;
    if course.total_completions >= course.min_completions_for_reward as u32
        && course.creator_reward_xp > 0
    {
        utils::mint_xp(
            &ctx.accounts.xp_mint.to_account_info(),
            &ctx.accounts.creator_token_account.to_account_info(),
            &ctx.accounts.config.to_account_info(),
            &ctx.accounts.token_program.to_account_info(),
            config_seeds,
            course.creator_reward_xp as u64,
        )?;
        creator_xp = course.creator_reward_xp;
    }

    emit!(CourseFinalized {
        learner: ctx.accounts.learner.key(),
        course: course.key(),
        total_xp: completed
            .checked_mul(course.xp_per_lesson)
            .ok_or(AcademyError::Overflow)?,
        bonus_xp,
        creator: ctx.accounts.creator.key(),
        creator_xp,
        timestamp: now,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct FinalizeCourse<'info> {
    #[account(
        seeds = [b"config"],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,

    #[account(
        mut,
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

    /// CHECK: Token-2022 ATA for learner's XP. Validated by Token-2022 CPI + owner derivation.
    #[account(
        mut,
        constraint = learner_token_account.owner == &spl_token_2022::id() @ AcademyError::Unauthorized,
    )]
    pub learner_token_account: AccountInfo<'info>,

    /// CHECK: Token-2022 ATA for creator's XP. Validated by Token-2022 CPI + owner derivation.
    #[account(
        mut,
        constraint = creator_token_account.owner == &spl_token_2022::id() @ AcademyError::Unauthorized,
    )]
    pub creator_token_account: AccountInfo<'info>,

    /// CHECK: Creator pubkey. Validated against course.creator.
    #[account(
        constraint = creator.key() == course.creator @ AcademyError::Unauthorized,
    )]
    pub creator: AccountInfo<'info>,

    /// CHECK: XP mint. Validated against config.xp_mint.
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
