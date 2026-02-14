use anchor_lang::prelude::*;
use anchor_spl::token_2022;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

use crate::errors::AcademyError;
use crate::state::{Config, LearnerProfile};
use crate::utils::check_and_update_daily_xp;

#[derive(Accounts)]
pub struct ClaimAchievement<'info> {
    #[account(
        seeds = [b"config"],
        bump = config.bump,
        constraint = !config.season_closed @ AcademyError::SeasonClosed,
        constraint = config.backend_signer == backend_signer.key() @ AcademyError::Unauthorized,
    )]
    pub config: Account<'info, Config>,

    #[account(
        mut,
        seeds = [b"learner", learner.key().as_ref()],
        bump = learner_profile.bump,
    )]
    pub learner_profile: Account<'info, LearnerProfile>,

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

    /// CHECK: The learner wallet. Validated via PDA seeds.
    pub learner: AccountInfo<'info>,

    pub backend_signer: Signer<'info>,

    pub token_program: Interface<'info, TokenInterface>,
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
    require!(
        word < 4,
        AcademyError::LessonOutOfBounds
    );
    require!(
        learner_profile.achievement_flags[word] & (1u64 << bit) == 0,
        AcademyError::AchievementAlreadyClaimed
    );

    // Check daily rate limit
    check_and_update_daily_xp(learner_profile, capped_reward, config.max_daily_xp)?;

    // Mark claimed
    learner_profile.achievement_flags[word] |= 1u64 << bit;

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

#[event]
pub struct AchievementClaimed {
    pub learner: Pubkey,
    pub achievement_index: u8,
    pub xp_reward: u32,
    pub timestamp: i64,
}
