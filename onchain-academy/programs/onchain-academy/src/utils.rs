use anchor_lang::prelude::*;
use anchor_lang::solana_program;
use anchor_lang::solana_program::program::invoke_signed;

/// Token-2022 program ID
pub const TOKEN_2022_PROGRAM_ID: Pubkey =
    solana_program::pubkey!("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");

/// Mints XP tokens via Token-2022 CPI. The authority (Config PDA) signs
/// using the provided seeds.
pub fn mint_xp<'info>(
    mint: &AccountInfo<'info>,
    to: &AccountInfo<'info>,
    authority: &AccountInfo<'info>,
    _token_program: &AccountInfo<'info>,
    authority_seeds: &[&[u8]],
    amount: u64,
) -> Result<()> {
    if amount == 0 {
        return Ok(());
    }

    // MintTo instruction: discriminator 7, then u64 amount LE
    let mut data = vec![7u8];
    data.extend_from_slice(&amount.to_le_bytes());

    let ix = solana_program::instruction::Instruction {
        program_id: TOKEN_2022_PROGRAM_ID,
        accounts: vec![
            solana_program::instruction::AccountMeta::new(*mint.key, false),
            solana_program::instruction::AccountMeta::new(*to.key, false),
            solana_program::instruction::AccountMeta::new_readonly(*authority.key, true),
        ],
        data,
    };

    invoke_signed(
        &ix,
        &[mint.clone(), to.clone(), authority.clone()],
        &[authority_seeds],
    )?;

    Ok(())
}
