use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke_signed;
use anchor_lang::solana_program::program::invoke;
use spl_token_metadata_interface::instruction::initialize as init_token_metadata;

use crate::state::Config;

pub fn handler(
    ctx: Context<InitXpMetadata>,
    name: String,
    symbol: String,
    uri: String,
) -> Result<()> {
    let config = &ctx.accounts.config;
    let seeds: &[&[u8]] = &[b"config", &[config.bump]];

    // Calculate the extra space needed for metadata TLV entry:
    // TLV header (2 type + 4 length) + update_authority (33) + mint (32) +
    // name (4 + len) + symbol (4 + len) + uri (4 + len) + additional_metadata vec (4)
    let metadata_size = 2 + 4 + 33 + 32
        + 4 + name.len()
        + 4 + symbol.len()
        + 4 + uri.len()
        + 4
        + 64; // padding buffer for alignment
    let mint_info = ctx.accounts.xp_mint.to_account_info();
    let current_len = mint_info.data_len();
    let new_len = current_len + metadata_size;
    let rent = Rent::get()?;
    let new_min_balance = rent.minimum_balance(new_len);
    let lamports_needed = new_min_balance.saturating_sub(mint_info.lamports());

    if lamports_needed > 0 {
        invoke(
            &anchor_lang::solana_program::system_instruction::transfer(
                &ctx.accounts.authority.key(),
                &ctx.accounts.xp_mint.key(),
                lamports_needed,
            ),
            &[
                ctx.accounts.authority.to_account_info(),
                ctx.accounts.xp_mint.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;
    }

    let ix = init_token_metadata(
        &spl_token_2022::id(),
        &config.xp_mint,
        &config.key(),
        &config.xp_mint,
        &config.key(),
        name,
        symbol,
        uri,
    );

    invoke_signed(
        &ix,
        &[
            ctx.accounts.xp_mint.to_account_info(),
            ctx.accounts.config.to_account_info(),
        ],
        &[seeds],
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct InitXpMetadata<'info> {
    #[account(
        seeds = [b"config"],
        bump = config.bump,
        has_one = authority,
    )]
    pub config: Account<'info, Config>,

    /// CHECK: Validated via config.xp_mint constraint.
    #[account(
        mut,
        address = config.xp_mint,
    )]
    pub xp_mint: AccountInfo<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,

    /// CHECK: Validated by address constraint.
    #[account(address = spl_token_2022::id())]
    pub token_program: AccountInfo<'info>,
}
