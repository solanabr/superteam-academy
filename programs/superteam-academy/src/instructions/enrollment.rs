use anchor_lang::prelude::*;
use anchor_spl::{
    token_2022::Token2022,
    token_interface::{Mint, TokenAccount},
};
use crate::{
    errors::AcademyError,
    state::{Config, Course, Enrollment, LearnerProfile},
    events::*,
    utils::{check_and_update_daily_xp, update_streak},
};

#[derive(Accounts)]
pub struct Enroll<'info> {
    #[account(mut)]
    pub learner: Signer<'info>,
    #[account(
        seeds = [Config::SEED],
        bump = config.bump
    )]
    pub config: Account<'info, Config>,
    #[account(
        mut,
        constraint = course.is_active @ AcademyError::CourseNotActive
    )]
    pub course: Account<'info, Course>,
    #[account(
        seeds = [b"learner", learner.key().as_ref()],
        bump = learner_profile.bump
    )]
    pub learner_profile: Account<'info, LearnerProfile>,
    /// CHECK: Optional prerequisite course enrollment
    pub prerequisite_enrollment: Option<Account<'info, Enrollment>>,
    #[account(
        init,
        payer = learner,
        space = Enrollment::SIZE,
        seeds = [b"enrollment", course.course_id.as_bytes(), learner.key().as_ref()],
        bump
    )]
    pub enrollment: Account<'info, Enrollment>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Unenroll<'info> {
    #[account(mut)]
    pub learner: Signer<'info>,
    #[account(
        mut,
        seeds = [b"enrollment", course.course_id.as_bytes(), learner.key().as_ref()],
        bump = enrollment.bump,
        constraint = enrollment.course == course.key() @ AcademyError::EnrollmentCourseMismatch,
        close = learner
    )]
    pub enrollment: Account<'info, Enrollment>,
    pub course: Account<'info, Course>,
}

#[derive(Accounts)]
pub struct CompleteLesson<'info> {
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
    pub token_program: Program<'info, Token2022>,
}

pub fn handler_enroll(ctx: Context<Enroll>) -> Result<()> {
    let enrollment = &mut ctx.accounts.enrollment;
    let bump = ctx.bumps.enrollment;
    let now = Clock::get()?.unix_timestamp;

    // Check prerequisite if set
    if let Some(_prerequisite) = ctx.accounts.course.prerequisite {
        let prereq_enrollment = ctx.accounts.prerequisite_enrollment.as_ref()
            .ok_or(AcademyError::PrerequisiteNotMet)?;
        require!(
            prereq_enrollment.completed_at.is_some(),
            AcademyError::PrerequisiteNotMet
        );
    }

    // Store values we need before mutable borrow
    let course_key = ctx.accounts.course.key();
    let course_version = ctx.accounts.course.version;
    let course_id = ctx.accounts.course.course_id.clone();
    
    enrollment.course = course_key;
    enrollment.enrolled_version = course_version;
    enrollment.enrolled_at = now;
    enrollment.completed_at = None;
    enrollment.lesson_flags = [0u64; 4];
    enrollment.bump = bump;

    // Update course stats
    ctx.accounts.course.total_enrollments = ctx.accounts.course.total_enrollments
        .checked_add(1)
        .ok_or(AcademyError::MathOverflow)?;

    emit!(Enrolled {
        learner: ctx.accounts.learner.key(),
        course: course_key,
        course_version: course_version,
        timestamp: now,
    });

    msg!("Learner {} enrolled in course {}", ctx.accounts.learner.key(), course_id);

    Ok(())
}

pub fn handler_unenroll(ctx: Context<Unenroll>) -> Result<()> {
    let enrollment = &ctx.accounts.enrollment;
    
    require!(
        enrollment.completed_at.is_none(),
        AcademyError::CourseAlreadyCompleted
    );

    // 24-hour cooldown
    let now = Clock::get()?.unix_timestamp;
    require!(
        now.saturating_sub(enrollment.enrolled_at) > 86400,
        AcademyError::UnenrollCooldown
    );

    emit!(Unenrolled {
        learner: ctx.accounts.learner.key(),
        course: ctx.accounts.course.key(),
        timestamp: now,
    });

    msg!("Learner {} unenrolled from course {}", 
        ctx.accounts.learner.key(), 
        ctx.accounts.course.course_id
    );

    Ok(())
}

pub fn handler_complete_lesson(
    ctx: Context<CompleteLesson>,
    lesson_index: u8,
    xp_amount: u32,
) -> Result<()> {
    let course = &ctx.accounts.course;
    let enrollment = &mut ctx.accounts.enrollment;
    let learner_profile = &mut ctx.accounts.learner_profile;
    let config = &ctx.accounts.config;

    // Validate lesson index
    require!(
        lesson_index < course.lesson_count,
        AcademyError::LessonOutOfBounds
    );

    // Check not already completed
    require!(
        !enrollment.is_lesson_completed(lesson_index),
        AcademyError::LessonAlreadyCompleted
    );

    // Check daily XP cap
    check_and_update_daily_xp(learner_profile, xp_amount, config.max_daily_xp)?;

    // Mark lesson complete
    enrollment.complete_lesson(lesson_index);

    // Update streak
    update_streak(learner_profile)?;

    // Mint XP
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
        xp_amount as u64,
    )?;

    emit!(LessonCompleted {
        learner: ctx.accounts.learner.key(),
        course: course.key(),
        lesson_index,
        xp_earned: xp_amount,
        current_streak: learner_profile.current_streak,
        timestamp: Clock::get()?.unix_timestamp,
    });

    msg!(
        "Lesson {} completed for learner {} in course {} (+{} XP, streak: {})",
        lesson_index,
        ctx.accounts.learner.key(),
        course.course_id,
        xp_amount,
        learner_profile.current_streak
    );

    Ok(())
}
