use anchor_lang::prelude::*;
use anchor_spl::token_2022;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

use crate::errors::AcademyError;
use crate::state::{Config, Course, Enrollment, LearnerProfile};
use crate::utils::{check_and_update_daily_xp, popcount_bitmap};

#[derive(Accounts)]
pub struct FinalizeCourse<'info> {
    #[account(
        seeds = [b"config"],
        bump = config.bump,
        constraint = !config.season_closed @ AcademyError::SeasonClosed,
        constraint = config.backend_signer == backend_signer.key() @ AcademyError::Unauthorized,
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

    /// Learner's token account for current season XP
    #[account(
        mut,
        token::mint = xp_mint,
        token::authority = learner,
        token::token_program = token_program,
    )]
    pub learner_token_account: InterfaceAccount<'info, TokenAccount>,

    /// Creator's token account for current season XP
    #[account(
        mut,
        token::mint = xp_mint,
        token::authority = creator,
        token::token_program = token_program,
    )]
    pub creator_token_account: InterfaceAccount<'info, TokenAccount>,

    /// CHECK: The learner wallet. Validated via PDA seeds.
    pub learner: AccountInfo<'info>,

    /// CHECK: The course creator. Validated against course.creator.
    #[account(
        constraint = creator.key() == course.creator @ AcademyError::Unauthorized,
    )]
    pub creator: AccountInfo<'info>,

    pub backend_signer: Signer<'info>,

    pub token_program: Interface<'info, TokenInterface>,
}

pub fn handler(ctx: Context<FinalizeCourse>) -> Result<()> {
    let course = &mut ctx.accounts.course;
    let enrollment = &mut ctx.accounts.enrollment;
    let learner_profile = &mut ctx.accounts.learner_profile;
    let config = &ctx.accounts.config;

    // Verify all lessons completed
    let completed_count = popcount_bitmap(&enrollment.lesson_flags);
    require!(
        completed_count == course.lesson_count as u32,
        AcademyError::CourseNotCompleted
    );

    let now = Clock::get()?.unix_timestamp;

    // Check daily XP rate limit for the course completion bonus
    check_and_update_daily_xp(learner_profile, course.xp_total, config.max_daily_xp)?;

    // Mint XP to learner
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
        course.xp_total as u64,
    )?;

    // Increment total completions
    course.total_completions = course
        .total_completions
        .checked_add(1)
        .ok_or(AcademyError::ArithmeticOverflow)?;

    // Creator reward gated by minimum completions
    let mut creator_xp: u32 = 0;
    if course.total_completions >= course.min_completions_for_reward as u32
        && course.completion_reward_xp > 0
    {
        creator_xp = course.completion_reward_xp;
        token_2022::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token_2022::MintTo {
                    mint: ctx.accounts.xp_mint.to_account_info(),
                    to: ctx.accounts.creator_token_account.to_account_info(),
                    authority: ctx.accounts.config.to_account_info(),
                },
                signer_seeds,
            ),
            creator_xp as u64,
        )?;
    }

    // Mark enrollment as completed
    enrollment.completed_at = Some(now);

    emit!(CourseFinalized {
        learner: ctx.accounts.learner.key(),
        course: course.key(),
        total_xp: course.xp_total,
        creator: course.creator,
        creator_xp,
        timestamp: now,
    });

    Ok(())
}

#[event]
pub struct CourseFinalized {
    pub learner: Pubkey,
    pub course: Pubkey,
    pub total_xp: u32,
    pub creator: Pubkey,
    pub creator_xp: u32,
    pub timestamp: i64,
}
