use anchor_lang::prelude::*;

pub fn unenroll(_ctx: Context<UnenrollAccounts>) -> Result<()> {
    msg!("✅ User unenrolled from course");
    Ok(())
}

pub struct Unenroll;

#[derive(Accounts)]
pub struct UnenrollAccounts<'info> {
    #[account(
        mut,
        close = user
    )]
    pub enrollment: Account<'info, crate::state::Enrollment>,
    pub user: Signer<'info>,
}
