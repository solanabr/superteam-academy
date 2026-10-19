// Your first Solana program — make it build.
//
// An Anchor program has four parts. Three are here: the prelude, the program id,
// and an (empty) #[program] module. TWO pieces are missing, and the verification
// harness at the bottom already refers to both, so this file does NOT compile as
// shipped. Add them from the pool:
//
//   (p1) a `ping` handler INSIDE `#[program] pub mod first_program`:
//          pub fn ping(_ctx: Context<Ping>) -> Result<()> { msg!("pong from {}", ID); Ok(()) }
//   (p2) the accounts struct it names, at module scope:
//          #[derive(Accounts)] pub struct Ping {}
//
// Put each in the right place; the order inside the module is not graded.

use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"); // replace with `anchor keys list`

#[program]
pub mod first_program {
    use super::*;

    // TODO (p1): add the `ping` handler here.
}

// TODO (p2): add the `Ping` accounts struct here.

// ─────────────────────────────────────────────────────────────────────────────
// VERIFICATION HARNESS — DO NOT EDIT ANYTHING BELOW THIS LINE.
// It is a TYPE check: it compiles only if `ping` and `Ping` exist with exactly the
// names and signatures the lesson asks for. It never runs your instruction.
// ─────────────────────────────────────────────────────────────────────────────
#[doc(hidden)]
#[allow(dead_code)]
mod verify {
    use super::*;

    fn accounts() -> Ping {
        Ping {}
    }

    const PING: for<'info> fn(Context<'info, Ping>) -> Result<()> = first_program::ping;
}
