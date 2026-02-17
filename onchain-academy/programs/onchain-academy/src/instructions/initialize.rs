use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke;
use spl_token_2022::{
    extension::{
        metadata_pointer::instruction::initialize as init_metadata_pointer, ExtensionType,
    },
    instruction::{
        initialize_mint2, initialize_non_transferable_mint, initialize_permanent_delegate,
    },
    state::Mint,
};

use crate::state::{Config, MinterRole};

pub fn handler(ctx: Context<Initialize>) -> Result<()> {
    let bump = ctx.bumps.config;
    let config_key = ctx.accounts.config.key();
    let mint_key = ctx.accounts.xp_mint.key();
    let token_program_id = &spl_token_2022::id();

    // Calculate space for fixed extensions only
    let extension_types = &[
        ExtensionType::NonTransferable,
        ExtensionType::PermanentDelegate,
        ExtensionType::MetadataPointer,
    ];
    let mint_space = ExtensionType::try_calculate_account_len::<Mint>(extension_types)?;

    let rent = Rent::get()?;
    let lamports = rent.minimum_balance(mint_space);

    invoke(
        &anchor_lang::solana_program::system_instruction::create_account(
            &ctx.accounts.authority.key(),
            &mint_key,
            lamports,
            mint_space as u64,
            token_program_id,
        ),
        &[
            ctx.accounts.authority.to_account_info(),
            ctx.accounts.xp_mint.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;

    // Initialize extensions BEFORE InitializeMint2
    invoke(
        &initialize_non_transferable_mint(token_program_id, &mint_key)?,
        &[ctx.accounts.xp_mint.to_account_info()],
    )?;

    invoke(
        &initialize_permanent_delegate(token_program_id, &mint_key, &config_key)?,
        &[ctx.accounts.xp_mint.to_account_info()],
    )?;

    invoke(
        &init_metadata_pointer(
            token_program_id,
            &mint_key,
            Some(config_key),
            Some(mint_key),
        )?,
        &[ctx.accounts.xp_mint.to_account_info()],
    )?;

    invoke(
        &initialize_mint2(token_program_id, &mint_key, &config_key, None, 0)?,
        &[ctx.accounts.xp_mint.to_account_info()],
    )?;

    // NOTE: TokenMetadata initialization is deferred to client-side due to
    // Agave 3.0 CPI realloc restrictions. The MetadataPointer extension is set
    // above, pointing to the mint itself. A separate client transaction should
    // call spl_token_metadata_interface::initialize after this instruction.

    let config = &mut ctx.accounts.config;
    config.authority = ctx.accounts.authority.key();
    config.backend_signer = ctx.accounts.authority.key();
    config.xp_mint = mint_key;
    config._reserved = [0u8; 8];
    config.bump = bump;

    // Auto-register authority as a minter (backend_signer defaults to authority)
    let minter_role = &mut ctx.accounts.backend_minter_role;
    minter_role.minter = ctx.accounts.authority.key();
    minter_role.label = "backend".to_string();
    minter_role.max_xp_per_call = 0; // unlimited
    minter_role.total_xp_minted = 0;
    minter_role.is_active = true;
    minter_role.created_at = Clock::get()?.unix_timestamp;
    minter_role._reserved = [0u8; 8];
    minter_role.bump = ctx.bumps.backend_minter_role;

    Ok(())
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = Config::SIZE,
        seeds = [b"config"],
        bump,
    )]
    pub config: Account<'info, Config>,

    /// CHECK: Created as a Token-2022 mint in this instruction via CPI.
    /// Passed as a signer (new keypair) so create_account can assign ownership
    /// to the Token-2022 program.
    #[account(mut)]
    pub xp_mint: Signer<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    /// Auto-registered MinterRole for the backend signer (defaults to authority)
    #[account(
        init,
        payer = authority,
        space = MinterRole::SIZE,
        seeds = [b"minter", authority.key().as_ref()],
        bump,
    )]
    pub backend_minter_role: Account<'info, MinterRole>,

    pub system_program: Program<'info, System>,

    /// CHECK: Validated by address constraint.
    #[account(address = spl_token_2022::id())]
    pub token_program: AccountInfo<'info>,
}
