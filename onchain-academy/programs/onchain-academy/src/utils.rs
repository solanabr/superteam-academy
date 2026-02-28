use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke_signed;

/// Mints XP tokens via Token-2022 CPI. The authority (Config PDA) signs
/// using the provided seeds.
pub fn mint_xp<'info>(
    mint: &AccountInfo<'info>,
    to: &AccountInfo<'info>,
    authority: &AccountInfo<'info>,
    token_program: &AccountInfo<'info>,
    authority_seeds: &[&[u8]],
    amount: u64,
) -> Result<()> {
    let ix = spl_token_2022::instruction::mint_to(
        token_program.key,
        mint.key,
        to.key,
        authority.key,
        &[],
        amount,
    )?;

    invoke_signed(
        &ix,
        &[mint.clone(), to.clone(), authority.clone()],
        &[authority_seeds],
    )?;

    Ok(())
}
