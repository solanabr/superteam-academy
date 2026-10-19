// A vault only its program can open — finish wiring it.
//
// A PDA has no private key, so the only way the program can sign the vault's own
// withdrawal is with the vault's SEEDS and its canonical BUMP — and the only way to
// do that cheaply is to STORE the bump at initialization rather than re-derive it.
// `VaultState` below is missing the two bump fields it must persist, so `initialize`
// (which writes them), `withdraw` (which signs with one), and the verification
// harness all fail to compile. Add them:
//
//   pub vault_bump: u8,
//   pub state_bump: u8,
//
// Field ORDER does not matter to Anchor; the names must match exactly.
use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

declare_id!("CgYNgxLx1v3LrvAf6tnpntSDccPGgH71qStWTKEWqk3h"); // replace with `anchor keys list`

#[program]
pub mod vault {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let state = &mut ctx.accounts.vault_state;
        state.authority = ctx.accounts.owner.key();
        state.balance = 0;
        state.vault_bump = ctx.bumps.vault;
        state.state_bump = ctx.bumps.vault_state;
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        transfer(
            CpiContext::new(
                ctx.accounts.system_program.key(),
                Transfer {
                    from: ctx.accounts.owner.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                },
            ),
            amount,
        )?;
        let state = &mut ctx.accounts.vault_state;
        state.balance = state.balance.checked_add(amount).ok_or(VaultError::Overflow)?;
        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let authority_key = ctx.accounts.vault_state.authority;
        let bump = ctx.accounts.vault_state.vault_bump;
        let signer_seeds: &[&[&[u8]]] = &[&[b"vault", authority_key.as_ref(), &[bump]]];
        transfer(
            CpiContext::new(
                ctx.accounts.system_program.key(),
                Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: ctx.accounts.authority.to_account_info(),
                },
            )
            .with_signer(signer_seeds),
            amount,
        )?;
        let state = &mut ctx.accounts.vault_state;
        state.balance = state.balance.checked_sub(amount).ok_or(VaultError::Overflow)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        init,
        payer = owner,
        space = VaultState::DISCRIMINATOR.len() + VaultState::INIT_SPACE,
        seeds = [b"state", owner.key().as_ref()],
        bump
    )]
    pub vault_state: Account<'info, VaultState>,
    #[account(seeds = [b"vault", owner.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut, seeds = [b"state", owner.key().as_ref()], bump = vault_state.state_bump)]
    pub vault_state: Account<'info, VaultState>,
    #[account(mut, seeds = [b"vault", owner.key().as_ref()], bump = vault_state.vault_bump)]
    pub vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut, has_one = authority @ VaultError::Unauthorized)]
    pub vault_state: Account<'info, VaultState>,
    #[account(
        mut,
        seeds = [b"vault", vault_state.authority.as_ref()],
        bump = vault_state.vault_bump
    )]
    pub vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct VaultState {
    pub authority: Pubkey,
    pub balance: u64,
    // TODO: store the two canonical bumps the program needs to sign for the vault.
}

#[error_code]
pub enum VaultError {
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Unauthorized: caller is not the vault authority")]
    Unauthorized,
}

// ─────────────────────────────────────────────────────────────────────────────
// VERIFICATION HARNESS — DO NOT EDIT ANYTHING BELOW THIS LINE.
// A TYPE check: it compiles only if `VaultState` stores the authority, the balance,
// and BOTH canonical bumps — the fields `initialize` writes and `withdraw` signs with.
// ─────────────────────────────────────────────────────────────────────────────
#[doc(hidden)]
#[allow(dead_code)]
mod verify {
    use super::*;

    fn vault_state_fields(s: &VaultState) -> (Pubkey, u64, u8, u8) {
        (s.authority, s.balance, s.vault_bump, s.state_bump)
    }
}
