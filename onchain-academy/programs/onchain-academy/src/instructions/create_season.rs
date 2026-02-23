use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke;
use spl_token_2022::{
    extension::ExtensionType,
    instruction::{initialize_mint2, initialize_non_transferable_mint, initialize_permanent_delegate},
    state::Mint as MintState,
};

use crate::errors::AcademyError;
use crate::events::SeasonCreated;
use crate::state::Config;

#[derive(Accounts)]
pub struct CreateSeason<'info> {
    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump,
        has_one = authority @ AcademyError::Unauthorized,
    )]
    pub config: Account<'info, Config>,

    #[account(mut)]
    pub authority: Signer<'info>,

    /// The new Token-2022 mint account. Must be uninitialized.
    /// CHECK: Initialized via CPI in handler.
    #[account(mut)]
    pub mint: Signer<'info>,

    /// CHECK: Token-2022 program.
    #[account(address = spl_token_2022::ID)]
    pub token_program: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<CreateSeason>, season: u16) -> Result<()> {
    let config = &mut ctx.accounts.config;

    // Season must be exactly current_season + 1
    let expected = config
        .current_season
        .checked_add(1)
        .ok_or(AcademyError::ArithmeticOverflow)?;
    require!(season == expected, AcademyError::InvalidSeasonNumber);

    let mint_info = ctx.accounts.mint.to_account_info();
    let config_key = config.key();

    // Calculate exact space for mint with extensions (no extra metadata space)
    let extensions = &[
        ExtensionType::NonTransferable,
        ExtensionType::PermanentDelegate,
        ExtensionType::MetadataPointer,
    ];
    let mint_space = ExtensionType::try_calculate_account_len::<MintState>(extensions)
        .map_err(|_| AcademyError::ArithmeticOverflow)?;

    let lamports = ctx.accounts.rent.minimum_balance(mint_space);

    // Create the account owned by Token-2022
    anchor_lang::system_program::create_account(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::CreateAccount {
                from: ctx.accounts.authority.to_account_info(),
                to: mint_info.clone(),
            },
        ),
        lamports,
        mint_space as u64,
        &spl_token_2022::ID,
    )?;

    // Initialize extensions BEFORE initialize_mint2

    // 1. NonTransferable
    invoke(
        &initialize_non_transferable_mint(&spl_token_2022::ID, &ctx.accounts.mint.key())?,
        &[mint_info.clone()],
    )?;

    // 2. PermanentDelegate (Config PDA is the permanent delegate)
    invoke(
        &initialize_permanent_delegate(&spl_token_2022::ID, &ctx.accounts.mint.key(), &config_key)?,
        &[mint_info.clone()],
    )?;

    // 3. MetadataPointer (points metadata to the mint itself)
    invoke(
        &spl_token_2022::extension::metadata_pointer::instruction::initialize(
            &spl_token_2022::ID,
            &ctx.accounts.mint.key(),
            Some(config_key),
            Some(ctx.accounts.mint.key()),
        )?,
        &[mint_info.clone()],
    )?;

    // 4. Initialize the mint (0 decimals for XP, Config PDA = mint authority)
    invoke(
        &initialize_mint2(
            &spl_token_2022::ID,
            &ctx.accounts.mint.key(),
            &config_key,
            None, // no freeze authority
            0,    // 0 decimals
        )?,
        &[mint_info.clone()],
    )?;

    // NOTE: TokenMetadata initialization is deferred to client-side due to
    // Agave 3.0 CPI realloc restrictions. The MetadataPointer extension is set
    // above, pointing to the mint itself. A separate client transaction should
    // call spl_token_metadata_interface::initialize after this instruction.

    // Update Config
    config.current_season = season;
    config.season_closed = false;
    config.season_started_at = Clock::get()?.unix_timestamp;

    emit!(SeasonCreated {
        season,
        mint: ctx.accounts.mint.key(),
        timestamp: config.season_started_at,
    });

    Ok(())
}
