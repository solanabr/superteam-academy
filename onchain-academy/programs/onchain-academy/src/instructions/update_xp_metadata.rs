use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke_signed;
use spl_token_metadata_interface::instruction::update_field;
use spl_token_metadata_interface::state::Field;

use crate::state::Config;

pub fn handler(
    ctx: Context<UpdateXpMetadata>,
    field: String,
    value: String,
) -> Result<()> {
    let config = &ctx.accounts.config;
    let seeds: &[&[u8]] = &[b"config", &[config.bump]];

    // Map field name to the enum variant
    let token_field = match field.as_str() {
        "name" | "Name" => Field::Name,
        "symbol" | "Symbol" => Field::Symbol,
        "uri" | "Uri" | "URI" => Field::Uri,
        other => Field::Key(other.to_string()),
    };

    // Fund extra rent if the account needs more space
    let mint_info = ctx.accounts.xp_mint.to_account_info();
    let current_lamports = mint_info.lamports();
    let current_len = mint_info.data_len();
    let extra = value.len() + 64; // generous padding
    let rent = Rent::get()?;
    let new_min = rent.minimum_balance(current_len + extra);

    if new_min > current_lamports {
        let diff = new_min - current_lamports;
        anchor_lang::solana_program::program::invoke(
            &anchor_lang::solana_program::system_instruction::transfer(
                &ctx.accounts.authority.key(),
                &ctx.accounts.xp_mint.key(),
                diff,
            ),
            &[
                ctx.accounts.authority.to_account_info(),
                ctx.accounts.xp_mint.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;
    }

    let ix = update_field(
        &spl_token_2022::id(),
        &config.xp_mint,    // metadata account
        &config.key(),       // update authority
        token_field,
        value,
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
pub struct UpdateXpMetadata<'info> {
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
