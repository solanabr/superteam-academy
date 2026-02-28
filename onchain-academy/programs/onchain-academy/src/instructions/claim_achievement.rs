use anchor_lang::prelude::*;

use crate::errors::AcademyError;
use crate::events::AchievementClaimed;
use crate::state::{Config, LearnerProfile};
use crate::utils;

#[derive(Accounts)]
pub struct ClaimAchievement<'info> {
    #[account(
        seeds = [b"config"],
        bump = config.bump,
        constraint = config.backend_signer == backend_signer.key() @ AcademyError::Unauthorized,
    )]
    pub config: Account<'info, Config>,

    #[account(
        mut,
        seeds = [b"learner", learner.key().as_ref()],
        bump = learner_profile.bump,
    )]
    pub learner_profile: Account<'info, LearnerProfile>,

    /// CHECK: XP mint. Validated by Config.xp_mint constraint.
    #[account(
        mut,
        constraint = xp_mint.key() == config.xp_mint @ AcademyError::Unauthorized,
    )]
    pub xp_mint: AccountInfo<'info>,

    /// CHECK: Learner's token account for XP. Validated by Token-2022 CPI.
    #[account(
        mut,
        constraint = learner_token_account.owner == &spl_token_2022::id() @ AcademyError::Unauthorized,
    )]
    pub learner_token_account: AccountInfo<'info>,

    /// CHECK: The learner wallet. Validated via PDA seeds.
    pub learner: AccountInfo<'info>,

    pub backend_signer: Signer<'info>,

    /// CHECK: Validated by address constraint.
    #[account(address = spl_token_2022::id())]
    pub token_program: AccountInfo<'info>,
}

pub fn handler(
    ctx: Context<ClaimAchievement>,
    achievement_index: u8,
    xp_reward: u32,
) -> Result<()> {
    let config = &ctx.accounts.config;
    let learner_profile = &mut ctx.accounts.learner_profile;

    // Cap XP reward
    let capped_reward = xp_reward.min(config.max_achievement_xp);

    // Check not already claimed
    let word = (achievement_index / 64) as usize;
    let bit = achievement_index % 64;
    require!(word < 4, AcademyError::LessonOutOfBounds);
    require!(
        learner_profile.achievement_flags[word] & (1u64 << bit) == 0,
        AcademyError::AchievementAlreadyClaimed
    );

    // Check daily rate limit
    utils::check_and_update_daily_xp(learner_profile, capped_reward, config.max_daily_xp)?;

    // Mark claimed
    learner_profile.achievement_flags[word] |= 1u64 << bit;

    // Mint XP to learner
    let config_seeds: &[&[u8]] = &[b"config", &[config.bump]];

    utils::mint_xp(
        &ctx.accounts.xp_mint,
        &ctx.accounts.learner_token_account,
        &ctx.accounts.config.to_account_info(),
        &ctx.accounts.token_program,
        config_seeds,
        capped_reward as u64,
    )?;

    let now = Clock::get()?.unix_timestamp;

    emit!(AchievementClaimed {
        learner: learner_profile.authority,
        achievement_index,
        xp_reward: capped_reward,
        timestamp: now,
    });

    Ok(())
}
