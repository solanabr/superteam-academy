import { CourseModule } from "../anchor-course/types";

export const MODULE_RUST_PROGRAMS: CourseModule = {
  title: "Rust Program Development",
  description:
    "Write native Solana programs in Rust — program structure, entrypoints, and serialization",
  lessons: [
    {
      title: "Rust Programs Overview",
      description: "Introduction to writing Solana programs in native Rust without frameworks",
      type: "content",
      content: `<h2>Rust Programs Overview</h2><p>Solana programs can be written in native Rust (without Anchor) for maximum control. This is useful for understanding the low-level mechanics and for advanced use cases.</p><h3>Program Entrypoint</h3><pre><code>use solana_program::{
    account_info::AccountInfo,
    entrypoint,
    entrypoint::ProgramResult,
    pubkey::Pubkey,
    msg,
};

entrypoint!(process_instruction);

fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    msg!("Hello, Solana!");
    Ok(())
}</code></pre><h3>Key Crates</h3><ul><li><code>solana-program</code> — core types (AccountInfo, Pubkey, etc.)</li><li><code>borsh</code> — serialization/deserialization</li><li><code>spl-token</code> — token operations</li><li><code>thiserror</code> — custom error types</li></ul><h3>When to Use Native Rust</h3><ul><li>Maximum CU efficiency needed</li><li>Custom serialization formats</li><li>Understanding low-level mechanics</li><li>Programs that don't fit Anchor's patterns</li></ul>`,
      xp: 30,
    },
    {
      title: "Program Structure",
      description: "Account validation, instruction dispatch, and state management in native Rust",
      type: "content",
      content: `<h2>Program Structure</h2><p>A well-structured Solana program separates concerns into distinct modules.</p><h3>Typical Layout</h3><pre><code>src/
├── lib.rs           // entrypoint
├── instruction.rs   // instruction enum + deserialization
├── processor.rs     // instruction handlers
├── state.rs         // account data structs
└── error.rs         // custom errors</code></pre><h3>Instruction Dispatch</h3><pre><code>// instruction.rs
use borsh::BorshDeserialize;

#[derive(BorshDeserialize)]
pub enum MyInstruction {
    Initialize { data: u64 },
    Update { new_data: u64 },
}

// processor.rs
pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    data: &[u8],
) -> ProgramResult {
    let instruction = MyInstruction::try_from_slice(data)?;
    match instruction {
        MyInstruction::Initialize { data } => initialize(program_id, accounts, data),
        MyInstruction::Update { new_data } => update(program_id, accounts, new_data),
    }
}</code></pre><h3>Account Validation</h3><pre><code>// Manual validation (native Rust)
let account_iter = &mut accounts.iter();
let signer = next_account_info(account_iter)?;

if !signer.is_signer {
    return Err(ProgramError::MissingRequiredSignature);
}
if signer.owner != &system_program::ID {
    return Err(ProgramError::InvalidAccountOwner);
}</code></pre><p>Anchor automates most of this validation. Native Rust requires explicit checks.</p>`,
      xp: 30,
    },
  ],
};
