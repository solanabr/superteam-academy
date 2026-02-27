use anchor_lang::prelude::*;
use anchor_lang::solana_program;
use anchor_lang::solana_program::program::invoke;

use crate::state::{Config, MinterRole};
use crate::utils::TOKEN_2022_PROGRAM_ID;

/// Mint account space: Token-2022 base mint (82) + account type (1) + extension padding
/// Extensions: NonTransferable(3) + PermanentDelegate(36) + MetadataPointer(72)
/// Total with TLV headers and padding = 274 bytes
const MINT_SPACE: usize = 274;

pub fn handler(ctx: Context<Initialize>) -> Result<()> {
    let bump = ctx.bumps.config;
    let config_key = ctx.accounts.config.key();
    let mint_key = ctx.accounts.xp_mint.key();

    let rent = Rent::get()?;
    let lamports = rent.minimum_balance(MINT_SPACE);

    // Create mint account owned by Token-2022
    invoke(
        &solana_program::system_instruction::create_account(
            &ctx.accounts.authority.key(),
            &mint_key,
            lamports,
            MINT_SPACE as u64,
            &TOKEN_2022_PROGRAM_ID,
        ),
        &[
            ctx.accounts.authority.to_account_info(),
            ctx.accounts.xp_mint.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;

    // Initialize NonTransferable extension (instruction discriminator = 32)
    invoke(
        &solana_program::instruction::Instruction {
            program_id: TOKEN_2022_PROGRAM_ID,
            accounts: vec![solana_program::instruction::AccountMeta::new(
                mint_key, false,
            )],
            data: vec![32],
        },
        &[ctx.accounts.xp_mint.to_account_info()],
    )?;

    // Initialize PermanentDelegate extension (instruction discriminator = 35)
    let mut permanent_delegate_data = vec![35u8];
    permanent_delegate_data.extend_from_slice(config_key.as_ref());
    invoke(
        &solana_program::instruction::Instruction {
            program_id: TOKEN_2022_PROGRAM_ID,
            accounts: vec![solana_program::instruction::AccountMeta::new(
                mint_key, false,
            )],
            data: permanent_delegate_data,
        },
        &[ctx.accounts.xp_mint.to_account_info()],
    )?;

    // Initialize MetadataPointer extension (instruction [39, 0])
    let mut metadata_pointer_data = vec![39u8, 0u8];
    // authority = config PDA (OptionalNonZeroPubkey: raw 32 bytes)
    metadata_pointer_data.extend_from_slice(config_key.as_ref());
    // metadata_address = mint itself
    metadata_pointer_data.extend_from_slice(mint_key.as_ref());
    invoke(
        &solana_program::instruction::Instruction {
            program_id: TOKEN_2022_PROGRAM_ID,
            accounts: vec![solana_program::instruction::AccountMeta::new(
                mint_key, false,
            )],
            data: metadata_pointer_data,
        },
        &[ctx.accounts.xp_mint.to_account_info()],
    )?;

    // InitializeMint2 (instruction discriminator = 20, 0 decimals, Config PDA as authority)
    let mut init_mint_data = vec![20u8];
    init_mint_data.push(0u8); // decimals = 0
    init_mint_data.extend_from_slice(config_key.as_ref()); // mint_authority
                                                           // freeze_authority: COption<Pubkey> = None
    init_mint_data.extend_from_slice(&[0u8; 4]); // COption tag = None
    init_mint_data.extend_from_slice(&[0u8; 32]); // padding for None pubkey
    invoke(
        &solana_program::instruction::Instruction {
            program_id: TOKEN_2022_PROGRAM_ID,
            accounts: vec![solana_program::instruction::AccountMeta::new(
                mint_key, false,
            )],
            data: init_mint_data,
        },
        &[ctx.accounts.xp_mint.to_account_info()],
    )?;

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
    #[account(address = TOKEN_2022_PROGRAM_ID)]
    pub token_program: AccountInfo<'info>,
}
