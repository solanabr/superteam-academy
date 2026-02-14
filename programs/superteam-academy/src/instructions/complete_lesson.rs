use anchor_lang::prelude::*;
use anchor_spl::token_2022;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

use crate::errors::AcademyError;
use crate::state::{Config, Course, Enrollment, LearnerProfile};
use crate::utils::{check_and_update_daily_xp, update_streak};

#[derive(Accounts)]
#[instruction(lesson_index: u8, xp_amount: u32)]
pub struct CompleteLesson<'info> {
    #[account(
        seeds = [b"config"],
        bump = config.bump,
        constraint = !config.season_closed @ AcademyError::SeasonClosed,
        constraint = config.backend_signer == backend_signer.key() @ AcademyError::Unauthorized,
    )]
    pub config: Account<'info, Config>,

    #[account(
        seeds = [b"course", course.course_id.as_bytes()],
        bump = course.bump,
    )]
    pub course: Account<'info, Course>,

    #[account(
        mut,
        seeds = [b"learner", learner.key().as_ref()],
        bump = learner_profile.bump,
    )]
    pub learner_profile: Account<'info, LearnerProfile>,

    #[account(
        mut,
        seeds = [b"enrollment", course.course_id.as_bytes(), learner.key().as_ref()],
        bump = enrollment.bump,
        constraint = enrollment.course == course.key() @ AcademyError::EnrollmentCourseMismatch,
        constraint = enrollment.completed_at.is_none() @ AcademyError::CourseAlreadyCompleted,
    )]
    pub enrollment: Account<'info, Enrollment>,

    /// The current season XP mint
    #[account(
        mut,
        address = config.current_mint,
    )]
    pub xp_mint: InterfaceAccount<'info, Mint>,

    /// Learner's token account for the current season XP mint
    #[account(
        mut,
        token::mint = xp_mint,
        token::authority = learner,
        token::token_program = token_program,
    )]
    pub learner_token_account: InterfaceAccount<'info, TokenAccount>,

    /// CHECK: The learner wallet. Not a signer for backend-signed completions.
    pub learner: AccountInfo<'info>,

    pub backend_signer: Signer<'info>,

    pub token_program: Interface<'info, TokenInterface>,
}

pub fn handler(ctx: Context<CompleteLesson>, lesson_index: u8, xp_amount: u32) -> Result<()> {
    let course = &ctx.accounts.course;
    let enrollment = &mut ctx.accounts.enrollment;
    let learner_profile = &mut ctx.accounts.learner_profile;
    let config = &ctx.accounts.config;

    // Validate lesson index
    require!(
        lesson_index < course.lesson_count,
        AcademyError::LessonOutOfBounds
    );

    // Check bitmap: lesson not already completed
    let word = (lesson_index / 64) as usize;
    let bit = lesson_index % 64;
    require!(
        enrollment.lesson_flags[word] & (1u64 << bit) == 0,
        AcademyError::LessonAlreadyCompleted
    );

    // Check and update daily XP rate limit
    check_and_update_daily_xp(learner_profile, xp_amount, config.max_daily_xp)?;

    // Set the lesson bit
    enrollment.lesson_flags[word] |= 1u64 << bit;

    // Update streak
    update_streak(learner_profile)?;

    // Mint XP to learner via Token-2022 CPI
    let config_seeds: &[&[u8]] = &[b"config", &[config.bump]];
    let signer_seeds = &[config_seeds];

    token_2022::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token_2022::MintTo {
                mint: ctx.accounts.xp_mint.to_account_info(),
                to: ctx.accounts.learner_token_account.to_account_info(),
                authority: ctx.accounts.config.to_account_info(),
            },
            signer_seeds,
        ),
        xp_amount as u64,
    )?;

    let now = Clock::get()?.unix_timestamp;

    emit!(LessonCompleted {
        learner: ctx.accounts.learner.key(),
        course: course.key(),
        lesson_index,
        xp_earned: xp_amount,
        current_streak: learner_profile.current_streak,
        timestamp: now,
    });

    Ok(())
}

#[event]
pub struct LessonCompleted {
    pub learner: Pubkey,
    pub course: Pubkey,
    pub lesson_index: u8,
    pub xp_earned: u32,
    pub current_streak: u16,
    pub timestamp: i64,
}
