use anchor_lang::prelude::*;
use anchor_spl::{
    token_2022::Token2022,
    token_interface::{Mint, TokenAccount},
};
use crate::{
    errors::AcademyError,
    state::{Config, Course, Enrollment, LearnerProfile},
    events::*,
    utils::check_and_update_daily_xp,
};

#[derive(Accounts)]
pub struct FinalizeCourse<'info> {
    /// CHECK: Verified against config.backend_signer
    pub backend_signer: Signer<'info>,
    #[account(
        seeds = [Config::SEED],
        bump = config.bump,
        has_one = backend_signer @ AcademyError::Unauthorized
    )]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub learner: SystemAccount<'info>,
    #[account(
        mut,
        seeds = [b"learner", learner.key().as_ref()],
        bump = learner_profile.bump
    )]
    pub learner_profile: Account<'info, LearnerProfile>,
    #[account(mut)]
    pub creator: SystemAccount<'info>,
    #[account(
        mut,
        constraint = course.is_active @ AcademyError::CourseNotActive
    )]
    pub course: Account<'info, Course>,
    #[account(
        mut,
        seeds = [b"enrollment", course.course_id.as_bytes(), learner.key().as_ref()],
        bump = enrollment.bump,
        constraint = enrollment.course == course.key() @ AcademyError::EnrollmentCourseMismatch,
        constraint = enrollment.completed_at.is_none() @ AcademyError::CourseAlreadyCompleted
    )]
    pub enrollment: Account<'info, Enrollment>,
    #[account(
        mut,
        constraint = xp_mint.key() == config.current_mint @ AcademyError::SeasonClosed,
        constraint = !config.season_closed @ AcademyError::SeasonClosed
    )]
    pub xp_mint: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = xp_mint,
        associated_token::authority = learner,
        associated_token::token_program = token_program
    )]
    pub learner_token_account: InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = xp_mint,
        associated_token::authority = creator,
        associated_token::token_program = token_program
    )]
    pub creator_token_account: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Program<'info, Token2022>,
}

pub fn handler_finalize_course(ctx: Context<FinalizeCourse>) -> Result<()> {
    let course = &mut ctx.accounts.course;
    let enrollment = &mut ctx.accounts.enrollment;
    let learner_profile = &mut ctx.accounts.learner_profile;
    let config = &ctx.accounts.config;

    // Verify all lessons completed
    require!(
        enrollment.is_course_completed(course.lesson_count),
        AcademyError::CourseNotCompleted
    );

    // Check daily XP cap for learner's final XP award
    check_and_update_daily_xp(learner_profile, course.xp_total, config.max_daily_xp)?;

    let now = Clock::get()?.unix_timestamp;

    // Mark enrollment complete
    enrollment.completed_at = Some(now);

    // Update course stats
    course.total_completions = course.total_completions
        .checked_add(1)
        .ok_or(AcademyError::MathOverflow)?;

    // Mint XP to learner
    let config_key = config.key();
    let seeds = &[Config::SEED, &[config.bump]];
    let signer_seeds = &[&seeds[..]];

    anchor_spl::token_interface::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.key(),
            anchor_spl::token_interface::MintTo {
                mint: ctx.accounts.xp_mint.to_account_info(),
                to: ctx.accounts.learner_token_account.to_account_info(),
                authority: config.to_account_info(),
            },
            signer_seeds,
        ),
        course.xp_total as u64,
    )?;

    msg!(
        "Awarded {} XP to learner {} for completing course {}",
        course.xp_total,
        ctx.accounts.learner.key(),
        course.course_id
    );

    // Calculate and award creator XP if threshold met
    let mut creator_xp = 0u32;
    if course.total_completions >= course.min_completions_for_reward as u32 {
        creator_xp = course.completion_reward_xp;
        
        anchor_spl::token_interface::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.key(),
                anchor_spl::token_interface::MintTo {
                    mint: ctx.accounts.xp_mint.to_account_info(),
                    to: ctx.accounts.creator_token_account.to_account_info(),
                    authority: config.to_account_info(),
                },
                signer_seeds,
            ),
            creator_xp as u64,
        )?;

        msg!(
            "Awarded {} XP to creator {} for course completion",
            creator_xp,
            course.creator
        );
    }

    emit!(CourseFinalized {
        learner: ctx.accounts.learner.key(),
        course: course.key(),
        total_xp: course.xp_total,
        creator: course.creator,
        creator_xp,
        timestamp: now,
    });

    msg!(
        "Course {} finalized for learner {} (total completions: {})",
        course.course_id,
        ctx.accounts.learner.key(),
        course.total_completions
    );

    Ok(())
}
