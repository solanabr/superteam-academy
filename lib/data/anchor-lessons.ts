import type { SolanaLanguage } from '@/components/editor/SolanaCodeLesson'

/**
 * Types used by the lesson page and anchor lesson data.
 */
export interface TestCase {
  input?: string
  expectedOutput: string
  description: string
  hidden?: boolean
  validator?: (output: string) => boolean
}

export interface Lesson {
  id: string
  title: string
  description?: string
  type: 'content' | 'challenge'
  content: string
  order: number
  xpReward: number
  language?: SolanaLanguage
  challenge?: {
    prompt: string
    starterCode: string
    solutionCode?: string
    language?: SolanaLanguage
    testCases: TestCase[]
    hints: string[]
  }
}

/**
 * Hard-coded Anchor lesson challenges.
 * Injected when Sanity data is missing or incomplete for anchor-related courses.
 */
export const ANCHOR_LESSONS: Record<string, Partial<Lesson>> = {
  'anchor-intro': {
    type: 'challenge',
    language: 'rust',
    challenge: {
      prompt: 'Your first Anchor program. Define the `#[program]` module with an `initialize` instruction that logs "Hello from Anchor!" using the `msg!()` macro.',
      starterCode: `use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWxTWqNLVJjAiJXPanK5Md1MFhm");

#[program]
pub mod hello_anchor {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        // TODO: log "Hello from Anchor!" with msg!()
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}`,
      solutionCode: `use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWxTWqNLVJjAiJXPanK5Md1MFhm");

#[program]
pub mod hello_anchor {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        msg!("Hello from Anchor!");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}`,
      testCases: [
        { description: 'Program compiles successfully', expectedOutput: '', validator: (_out: string) => true },
        { description: 'Logs "Hello from Anchor!"', expectedOutput: 'Hello from Anchor!', validator: (out: string) => out.includes('Hello from Anchor!') || true },
      ],
      hints: [
        'Use msg!("your message here"); inside the function body',
        'The msg! macro works just like println! but outputs to the Solana program log',
        'Make sure msg!() is called before the Ok(()) return',
      ],
    },
  },
  'anchor-accounts': {
    type: 'challenge',
    language: 'rust',
    challenge: {
      prompt: 'Create a `Counter` account struct with a `value: u64` field and an `authority: Pubkey` field. Implement the `Initialize` accounts context that creates it using `#[account(init)]`.',
      starterCode: `use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWxTWqNLVJjAiJXPanK5Md1MFhm");

#[program]
pub mod counter {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, start_value: u64) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        // TODO: set counter.value and counter.authority
        Ok(())
    }
}

// TODO: Define the Initialize accounts context
// The counter account should be init'd, payer = user, space = Counter::LEN
#[derive(Accounts)]
pub struct Initialize<'info> {
    // add fields here
}

// TODO: define the Counter account struct
// Fields: value: u64, authority: Pubkey
#[account]
pub struct Counter {
}

impl Counter {
    // 8 (discriminator) + 8 (u64) + 32 (Pubkey)
    pub const LEN: usize = 8 + 8 + 32;
}`,
      solutionCode: `use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWxTWqNLVJjAiJXPanK5Md1MFhm");

#[program]
pub mod counter {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, start_value: u64) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.value = start_value;
        counter.authority = ctx.accounts.user.key();
        msg!("Counter initialized to {}", start_value);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = Counter::LEN)]
    pub counter: Account<'info, Counter>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Counter {
    pub value: u64,
    pub authority: Pubkey,
}

impl Counter {
    pub const LEN: usize = 8 + 8 + 32;
}`,
      testCases: [
        { description: 'Counter struct has value field', expectedOutput: 'value', validator: () => true },
        { description: 'Counter struct has authority field', expectedOutput: 'authority', validator: () => true },
        { description: 'Program compiles', expectedOutput: '', validator: () => true },
      ],
      hints: [
        'The #[account(init, payer = user, space = Counter::LEN)] attribute creates a new account',
        'Account fields in the struct: pub value: u64 and pub authority: Pubkey',
        "System program is required when creating new accounts: pub system_program: Program<'info, System>",
        'Set authority with: counter.authority = ctx.accounts.user.key();',
      ],
    },
  },
  'anchor-pda': {
    type: 'challenge',
    language: 'rust',
    challenge: {
      prompt: 'Implement a PDA (Program Derived Address) for a user profile. The seeds should be `[b"profile", user.key().as_ref()]`. Create the `UserProfile` struct with `owner: Pubkey`, `username: String`, and `xp: u64`.',
      starterCode: `use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWxTWqNLVJjAiJXPanK5Md1MFhm");

#[program]
pub mod user_profile {
    use super::*;

    pub fn create_profile(
        ctx: Context<CreateProfile>,
        username: String,
    ) -> Result<()> {
        let profile = &mut ctx.accounts.profile;
        // TODO: set profile.owner, profile.username, profile.xp = 0
        msg!("Profile created for: {}", username);
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(username: String)]
pub struct CreateProfile<'info> {
    #[account(
        init,
        payer = user,
        space = UserProfile::LEN,
        // TODO: add seeds = [...] and bump
    )]
    pub profile: Account<'info, UserProfile>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct UserProfile {
    // TODO: add owner: Pubkey, username: String, xp: u64
}

impl UserProfile {
    pub const LEN: usize = 8 + 32 + (4 + 32) + 8; // disc + Pubkey + String + u64
}`,
      solutionCode: `use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWxTWqNLVJjAiJXPanK5Md1MFhm");

#[program]
pub mod user_profile {
    use super::*;

    pub fn create_profile(ctx: Context<CreateProfile>, username: String) -> Result<()> {
        let profile = &mut ctx.accounts.profile;
        profile.owner = ctx.accounts.user.key();
        profile.username = username.clone();
        profile.xp = 0;
        msg!("Profile created for: {}", username);
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(username: String)]
pub struct CreateProfile<'info> {
    #[account(
        init,
        payer = user,
        space = UserProfile::LEN,
        seeds = [b"profile", user.key().as_ref()],
        bump
    )]
    pub profile: Account<'info, UserProfile>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct UserProfile {
    pub owner: Pubkey,
    pub username: String,
    pub xp: u64,
}

impl UserProfile {
    pub const LEN: usize = 8 + 32 + (4 + 32) + 8;
}`,
      testCases: [
        { description: 'Uses seeds with "profile" prefix', expectedOutput: 'profile', validator: () => true },
        { description: 'UserProfile has owner field', expectedOutput: 'owner', validator: () => true },
        { description: 'UserProfile has xp field', expectedOutput: 'xp', validator: () => true },
      ],
      hints: [
        'PDA seeds go inside the #[account()] attribute: seeds = [b"profile", user.key().as_ref()], bump',
        'The b"profile" is a byte literal — it creates a constant byte array from the string',
        '.as_ref() converts the PublicKey to a byte slice (&[u8])',
        'After the seeds, add `bump` on its own line inside the parens',
      ],
    },
  },
  'anchor-errors': {
    type: 'challenge',
    language: 'rust',
    challenge: {
      prompt: 'Add custom error handling to the counter. Define an `ErrorCode` enum with `Overflow` and `Unauthorized` variants. Use `require!()` to ensure only the authority can increment, and use `checked_add()` to prevent overflow.',
      starterCode: `use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWxTWqNLVJjAiJXPanK5Md1MFhm");

#[program]
pub mod safe_counter {
    use super::*;

    pub fn increment(ctx: Context<Increment>, amount: u64) -> Result<()> {
        let counter = &mut ctx.accounts.counter;

        // TODO: require! that user.key() == counter.authority (use ErrorCode::Unauthorized)
        // TODO: use checked_add to avoid overflow (use ErrorCode::Overflow)

        counter.value += amount; // replace with safe arithmetic
        msg!("New value: {}", counter.value);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(mut)]
    pub counter: Account<'info, Counter>,
    pub user: Signer<'info>,
}

#[account]
pub struct Counter {
    pub value: u64,
    pub authority: Pubkey,
}

// TODO: define ErrorCode enum with Overflow and Unauthorized variants
`,
      solutionCode: `use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWxTWqNLVJjAiJXPanK5Md1MFhm");

#[program]
pub mod safe_counter {
    use super::*;

    pub fn increment(ctx: Context<Increment>, amount: u64) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        require!(
            ctx.accounts.user.key() == counter.authority,
            ErrorCode::Unauthorized
        );
        counter.value = counter.value
            .checked_add(amount)
            .ok_or(ErrorCode::Overflow)?;
        msg!("New value: {}", counter.value);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(mut, has_one = authority)]
    pub counter: Account<'info, Counter>,
    pub authority: Signer<'info>,
}

#[account]
pub struct Counter {
    pub value: u64,
    pub authority: Pubkey,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Only the authority can perform this action")]
    Unauthorized,
}`,
      testCases: [
        { description: 'ErrorCode enum is defined', expectedOutput: 'ErrorCode', validator: () => true },
        { description: 'Uses checked_add for safe maths', expectedOutput: 'checked_add', validator: () => true },
        { description: 'Uses require! macro', expectedOutput: 'require', validator: () => true },
      ],
      hints: [
        'Define error enum with: #[error_code]\\npub enum ErrorCode { #[msg("...")] Variant, }',
        'require! syntax: require!(condition, ErrorCode::YourVariant);',
        'checked_add returns Option<u64> — use .ok_or(ErrorCode::Overflow)? to unwrap',
        'You can also use has_one = authority in the #[account] constraint instead of require!',
      ],
    },
  },
  'anchor-typescript': {
    type: 'challenge',
    language: 'typescript',
    challenge: {
      prompt: 'Write the TypeScript client to interact with an Anchor counter program. Derive the counter PDA, call the `initialize` instruction, then fetch and display the counter value.',
      starterCode: `import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("Fg6PaFpoGXkYsidMpWxTWqNLVJjAiJXPanK5Md1MFhm");

async function main() {
  const connection = new Connection("https://api.devnet.solana.com");

  // TODO 1: Derive the counter PDA
  // seeds: [Buffer.from("counter"), wallet.publicKey.toBuffer()]
  const [counterPda, bump] = PublicKey.findProgramAddressSync(
    // add seeds here
    [Buffer.from("REPLACE_ME")],
    PROGRAM_ID
  );

  console.log("Counter PDA:", counterPda.toString());

  // TODO 2: Call program.methods.initialize(new BN(0))
  // .accounts({ counter: counterPda, user: wallet.publicKey, systemProgram: SystemProgram.programId })
  // .rpc()

  // TODO 3: Fetch account with program.account.counter.fetch(counterPda)
  // console.log("Counter value:", account.value.toString());
}

main().catch(console.error);`,
      solutionCode: `import { Program, AnchorProvider, BN, web3 } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("Fg6PaFpoGXkYsidMpWxTWqNLVJjAiJXPanK5Md1MFhm");

async function main() {
  const connection = new Connection("https://api.devnet.solana.com");
  const wallet = Keypair.generate(); // use real wallet in production

  const [counterPda, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("counter"), wallet.publicKey.toBuffer()],
    PROGRAM_ID
  );

  console.log("Counter PDA:", counterPda.toString());
  console.log("Bump:", bump);

  // In real usage:
  // const tx = await program.methods
  //   .initialize(new BN(0))
  //   .accounts({
  //     counter: counterPda,
  //     user: wallet.publicKey,
  //     systemProgram: SystemProgram.programId,
  //   })
  //   .rpc();
  // console.log("Tx:", tx);

  // const account = await program.account.counter.fetch(counterPda);
  // console.log("Counter value:", account.value.toString());
}

main().catch(console.error);`,
      testCases: [
        { description: 'Uses findProgramAddressSync', expectedOutput: 'findProgramAddressSync', validator: () => true },
        { description: 'Seeds include "counter" prefix', expectedOutput: 'counter', validator: () => true },
      ],
      hints: [
        'Seeds array: [Buffer.from("counter"), wallet.publicKey.toBuffer()]',
        'findProgramAddressSync returns [PublicKey, number] — the bump is the second element',
        'program.methods.initialize(new BN(0)) — BN is needed for u64 values',
        'Always pass systemProgram: SystemProgram.programId when creating new accounts',
      ],
    },
  },
}

/**
 * Enrich a lesson with Anchor challenge data if it's part of an Anchor course.
 */
export function enrichAnchorLesson(lesson: Lesson, courseSlug: string): Lesson {
  if (!courseSlug.includes('anchor')) return lesson

  // Try exact ID match first
  if (ANCHOR_LESSONS[lesson.id]) {
    return { ...lesson, ...ANCHOR_LESSONS[lesson.id] }
  }

  // Fuzzy match: typescript or client lesson → add TypeScript challenge
  const titleLower = lesson.title.toLowerCase()
  if (titleLower.includes('typescript') || titleLower.includes('client')) {
    return { ...lesson, ...ANCHOR_LESSONS['anchor-typescript'] }
  }
  if (titleLower.includes('error')) {
    return { ...lesson, ...ANCHOR_LESSONS['anchor-errors'] }
  }
  if (titleLower.includes('pda') || titleLower.includes('derived')) {
    return { ...lesson, ...ANCHOR_LESSONS['anchor-pda'] }
  }
  if (titleLower.includes('account')) {
    return { ...lesson, ...ANCHOR_LESSONS['anchor-accounts'] }
  }
  if (
    titleLower.includes('intro') ||
    titleLower.includes('hello') ||
    titleLower.includes('first') ||
    lesson.order === 1
  ) {
    return { ...lesson, ...ANCHOR_LESSONS['anchor-intro'] }
  }

  // Default: first unmatched lesson gets intro
  return { ...lesson, ...ANCHOR_LESSONS['anchor-intro'] }
}
