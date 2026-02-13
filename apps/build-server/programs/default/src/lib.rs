use anchor_lang::prelude::*;

// Placeholder — students replace with: `solana-keygen grind --starts-with Sol:1`
declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod solarium_program {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        msg!("Solarium default program");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
