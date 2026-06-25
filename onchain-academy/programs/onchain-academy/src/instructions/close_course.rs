use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_lang::Discriminator;

use crate::errors::AcademyError;
use crate::events::CourseClosed;
use crate::state::{Config, Course};

/// Authority-gated close of a `Course` PDA.
///
/// Migration tool: #184 resized `Course` (192 -> 224) with no migration path, so
/// pre-resize 192-byte accounts can no longer be loaded as `Account<Course>`.
/// This instruction takes the course as an `UncheckedAccount` so it can touch a
/// stale / size-mismatched account, validates it is the genuine Course PDA owned
/// by this program, then manually drains its lamports to the authority and frees
/// the PDA so `create_course` can recreate it (at the new size) in a later tx.
///
/// Enrollments are separate PDAs keyed by `course_id` and are untouched here.
pub fn handler(ctx: Context<CloseCourse>, course_id: String) -> Result<()> {
    let course_ai = ctx.accounts.course.to_account_info();

    // Defensive: ensure this is a genuine Course PDA, not some other
    // program-owned account whose address happens to collide with the seeds.
    // The discriminator is derived from the account name and is stable across
    // the 192 -> 224 resize, so this check holds for the stale accounts too.
    {
        let data = course_ai.try_borrow_data()?;
        require!(
            data.len() >= Course::DISCRIMINATOR.len(),
            AcademyError::InvalidCourseAccount
        );
        require!(
            data[..Course::DISCRIMINATOR.len()] == *Course::DISCRIMINATOR,
            AcademyError::InvalidCourseAccount
        );
    }

    let course_key = course_ai.key();
    let now = Clock::get()?.unix_timestamp;

    // Drain all lamports to the authority with checked math.
    let authority_ai = ctx.accounts.authority.to_account_info();
    let course_lamports = course_ai.lamports();

    let new_authority_lamports = authority_ai
        .lamports()
        .checked_add(course_lamports)
        .ok_or(AcademyError::Overflow)?;

    **authority_ai.try_borrow_mut_lamports()? = new_authority_lamports;
    **course_ai.try_borrow_mut_lamports()? = 0;

    // Free the PDA: zero the data and hand ownership back to the System Program
    // so the address is a plain (empty, 0-lamport) system account that
    // `create_course` / Anchor `init` can re-create in a later transaction.
    course_ai.realloc(0, false)?;
    course_ai.assign(&system_program::ID);

    emit!(CourseClosed {
        course: course_key,
        course_id,
        timestamp: now,
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(course_id: String)]
pub struct CloseCourse<'info> {
    #[account(
        seeds = [b"config"],
        bump = config.bump,
        has_one = authority @ AcademyError::Unauthorized,
    )]
    pub config: Account<'info, Config>,

    /// CHECK: Validated by the PDA `seeds`/`bump` constraint (correct Course PDA
    /// for `course_id`) and `owner = crate::ID` (program-owned). Loaded as
    /// `UncheckedAccount` rather than `Account<Course>` so a stale, size-mismatched
    /// (pre-resize, 192-byte) account can still be closed. The handler also
    /// verifies the `Course` discriminator before draining/freeing it.
    #[account(
        mut,
        seeds = [b"course", course_id.as_bytes()],
        bump,
        owner = crate::ID @ AcademyError::InvalidCourseAccount,
    )]
    pub course: UncheckedAccount<'info>,

    pub authority: Signer<'info>,
}
