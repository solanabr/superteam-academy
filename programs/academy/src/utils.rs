use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, Mint, MintTo, TokenAccount, TokenInterface};

use crate::state::{Config, I80F48};

pub fn mint_xp<'info>(
    config: &Account<'info, Config>,
    xp_mint: &InterfaceAccount<'info, Mint>,
    recipient_token_account: &InterfaceAccount<'info, TokenAccount>,
    token_program: &Interface<'info, TokenInterface>,
    amount: u64,
) -> Result<()> {
    let signer_seeds: &[&[u8]] = &[b"config", &[config.bump]];
    let signer: &[&[&[u8]]] = &[signer_seeds];

    token_interface::mint_to(
        CpiContext::new_with_signer(
            token_program.to_account_info(),
            MintTo {
                mint: xp_mint.to_account_info(),
                to: recipient_token_account.to_account_info(),
                authority: config.to_account_info(),
            },
            signer,
        ),
        amount,
    )
}

pub fn checked_add_i80(lhs: I80F48, rhs: I80F48) -> Result<I80F48> {
    lhs.checked_add(rhs)
}

pub fn i80_to_u32(amount: I80F48) -> Result<u32> {
    let raw = amount.as_u64()?;
    u32::try_from(raw).map_err(|_| error!(crate::errors::AcademyError::InvalidAmount))
}
