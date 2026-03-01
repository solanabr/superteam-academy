use anchor_lang::prelude::*;
use anchor_spl::{
    token_2022::Token2022,
    token_interface::{Mint, TokenAccount},
};
use crate::{
    errors::AcademyError,
    state::{Config, LearnerProfile},
    events::*,
    utils::check_and_update_daily_xp,
};

#[derive(Accounts)]
pub struct ClaimAchievement<'info> {
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

pub fn handler_claim_achievement(
    ctx: Context<ClaimAchievement>,
    achievement_index: u8,
    xp_reward: u32,
) -> Result<()> {
    let config = &ctx.accounts.config;
    let learner_profile = &mut ctx.accounts.learner_profile;

    // Cap XP reward
    let capped_reward = xp_reward.min(config.max_achievement_xp);

    // Check not already claimed
    require!(
        !learner_profile.is_achievement_claimed(achievement_index),
        AcademyError::AchievementAlreadyClaimed
    );

    // Check daily rate limit
    check_and_update_daily_xp(learner_profile, capped_reward, config.max_daily_xp)?;

    // Mark claimed
    learner_profile.claim_achievement(achievement_index);

    // Mint XP
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
        capped_reward as u64,
    )?;

    emit!(AchievementClaimed {
        learner: ctx.accounts.learner.key(),
        achievement_index,
        xp_reward: capped_reward,
        timestamp: Clock::get()?.unix_timestamp,
    });

    msg!(
        "Achievement {} claimed by learner {} ({} XP)",
        achievement_index,
        ctx.accounts.learner.key(),
        capped_reward
    );

    Ok(())
}

#[derive(Accounts)]
pub struct AwardStreakFreeze<'info> {
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
}

pub fn handler_award_streak_freeze(ctx: Context<AwardStreakFreeze>) -> Result<()> {
    let learner_profile = &mut ctx.accounts.learner_profile;

    // Cap at 255 (u8 max)
    if learner_profile.streak_freezes < u8::MAX {
        learner_profile.streak_freezes = learner_profile.streak_freezes.saturating_add(1);
    }

    emit!(StreakFreezeAwarded {
        learner: ctx.accounts.learner.key(),
        freezes_remaining: learner_profile.streak_freezes,
        timestamp: Clock::get()?.unix_timestamp,
    });

    msg!(
        "Awarded streak freeze to learner {} (total: {})",
        ctx.accounts.learner.key(),
        learner_profile.streak_freezes
    );

    Ok(())
}
