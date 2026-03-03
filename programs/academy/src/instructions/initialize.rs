use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenInterface};

use crate::{errors::AcademyError, state::{Config, I80F48, MinterRole, MAX_MINTER_LABEL_LEN}};

pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    let config = &mut ctx.accounts.config;
    let authority = ctx.accounts.authority.key();

    config.authority = authority;
    config.backend_signer = authority;
    config.xp_mint = ctx.accounts.xp_mint.key();
    config.bump = ctx.bumps.config;

    let minter_role = &mut ctx.accounts.backend_minter_role;
    minter_role.minter = authority;
    minter_role.label = "backend".to_string();
    require!(
        minter_role.label.len() <= MAX_MINTER_LABEL_LEN,
        AcademyError::InvalidMetadata
    );
    minter_role.max_xp_per_call = I80F48 { value: i128::MAX };
    minter_role.total_xp_minted = I80F48 { value: 0 };
    minter_role.is_active = true;
    minter_role.created_at = Clock::get()?.unix_timestamp;
    minter_role.bump = ctx.bumps.backend_minter_role;

    emit!(ConfigUpdated { authority });
    emit!(crate::instructions::register_minter::MinterRegistered {
        minter: authority,
        label: minter_role.label.clone(),
    });

    Ok(())
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Config::LEN,
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, Config>,
    #[account(
        init,
        payer = authority,
        mint::decimals = 0,
        mint::authority = config,
        mint::freeze_authority = config,
        mint::token_program = token_program,
    )]
    pub xp_mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + MinterRole::LEN,
        seeds = [b"minter", authority.key().as_ref()],
        bump
    )]
    pub backend_minter_role: Account<'info, MinterRole>,
    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
}

#[event]
pub struct ConfigUpdated {
    pub authority: Pubkey,
}
