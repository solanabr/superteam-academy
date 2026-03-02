export function getCourse2() {
  return {
    slug: "anchor-fundamentals",
    title: "Anchor Framework Fundamentals",
    description:
      "Master the Anchor framework for Solana program development — from project setup to complex state management and testing.",
    difficulty: "intermediate",
    duration: "10 hours",
    xpTotal: 1200,
    trackId: 1,
    trackLevel: 1,
    trackName: "Anchor",
    creator: "Superteam Brazil",
    tags: ["anchor", "rust", "programs", "solana"],
    prerequisites: ["intro-to-solana"],
    modules: {
      create: [
        // ────────────────────────────────────────────────────────────────────
        // Module 1: Anchor Project Setup
        // ────────────────────────────────────────────────────────────────────
        {
          title: "Anchor Project Setup",
          description:
            "Initialize an Anchor workspace, understand the project structure, and generate your first IDL.",
          order: 0,
          lessons: {
            create: [
              // Lesson 1.1 — Workspace Initialization (content)
              {
                title: "Workspace Initialization",
                description:
                  "Create and explore a new Anchor project from scratch",
                type: "content",
                order: 0,
                xpReward: 20,
                duration: "15 min",
                content: `# Workspace Initialization

Anchor is the dominant framework for Solana program development. It provides a Rust eDSL (embedded Domain Specific Language) that abstracts away much of the boilerplate involved in writing raw Solana programs — account validation, serialization, instruction dispatch, and error handling.

## Prerequisites

Before creating an Anchor workspace, ensure you have:

- **Rust** (1.75+): Install via \`rustup\` at https://rustup.rs
- **Solana CLI** (1.18+): Installed and configured for devnet
- **Anchor CLI** (0.30+): Install with \`cargo install --git https://github.com/coral-xyz/anchor avm --force\`
- **Node.js** (18+): For client-side testing

Install Anchor Version Manager (AVM) and the latest Anchor:

\`\`\`bash
cargo install --git https://github.com/coral-xyz/anchor avm --force
avm install latest
avm use latest
anchor --version
# anchor-cli 0.30.1
\`\`\`

## Creating a New Workspace

\`\`\`bash
anchor init my-program
cd my-program
\`\`\`

This generates the following directory structure:

\`\`\`
my-program/
├── Anchor.toml          # Workspace configuration
├── Cargo.toml           # Rust workspace root
├── package.json         # Node.js dependencies for tests
├── tsconfig.json        # TypeScript config
├── app/                 # Frontend scaffold (optional)
├── programs/
│   └── my-program/
│       ├── Cargo.toml   # Program crate dependencies
│       └── src/
│           └── lib.rs   # Program entrypoint
├── migrations/
│   └── deploy.ts        # Deployment script
└── tests/
    └── my-program.ts    # Integration tests
\`\`\`

## The Program Entrypoint

Open \`programs/my-program/src/lib.rs\`. You will see:

\`\`\`rust
use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod my_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
\`\`\`

Key elements:
- **\`declare_id!\`** — sets the program's on-chain address. Updated after first deploy.
- **\`#[program]\`** — marks the module containing all instruction handlers.
- **\`Context<T>\`** — wraps the accounts struct \`T\` that Anchor validates before your handler runs.
- **\`#[derive(Accounts)]\`** — tells Anchor to generate account validation logic.

## Building the Program

\`\`\`bash
anchor build
\`\`\`

This compiles the Rust program to BPF bytecode at \`target/deploy/my_program.so\` and generates an IDL at \`target/idl/my_program.json\`. The IDL (Interface Definition Language) is a JSON file describing your program's instructions, accounts, and types — similar to an ABI in Ethereum.

In the next lesson, we will explore the \`Anchor.toml\` configuration file in detail.`,
              },

              // Lesson 1.2 — Anchor.toml Configuration (content)
              {
                title: "Anchor.toml Configuration",
                description:
                  "Understand and configure your Anchor workspace settings",
                type: "content",
                order: 1,
                xpReward: 20,
                duration: "15 min",
                content: `# Anchor.toml Configuration

The \`Anchor.toml\` file is the central configuration for your Anchor workspace. It controls which cluster you deploy to, program IDs, wallet paths, test commands, and more.

## Default Configuration

After \`anchor init\`, the file looks like:

\`\`\`toml
[features]
seeds = false
skip-lint = false

[programs.localnet]
my_program = "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "Localnet"
wallet = "~/.config/solana/id.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
\`\`\`

## Section Breakdown

### \`[features]\`

- **\`seeds = true\`** — Enables automatic PDA resolution in the IDL. When set, Anchor includes seed definitions in the IDL so clients can derive PDAs automatically.
- **\`skip-lint = false\`** — When false, Anchor runs security lints during build (recommended to keep enabled).

### \`[programs.<cluster>]\`

Maps program names to their deployed addresses per cluster:

\`\`\`toml
[programs.localnet]
my_program = "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"

[programs.devnet]
my_program = "DevNet111111111111111111111111111111111111111"

[programs.mainnet]
my_program = "MainNet22222222222222222222222222222222222222"
\`\`\`

After your first deploy to devnet, update the devnet program ID here. The program ID is also set in your Rust code via \`declare_id!\` — both must match.

### \`[provider]\`

- **\`cluster\`** — Target cluster: \`"Localnet"\`, \`"Devnet"\`, or \`"Mainnet"\`.
- **\`wallet\`** — Path to the deployer's keypair file. This wallet pays for deployment and is the initial upgrade authority.

### \`[scripts]\`

Custom scripts invoked via \`anchor run <name>\`:

\`\`\`toml
[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
migrate = "npx ts-node migrations/deploy.ts"
\`\`\`

## Multi-Program Workspaces

Anchor supports multiple programs in a single workspace:

\`\`\`toml
[programs.localnet]
program_a = "Addr1111111111111111111111111111111111111111"
program_b = "Addr2222222222222222222222222222222222222222"
\`\`\`

Each program lives in its own directory under \`programs/\`. The workspace \`Cargo.toml\` lists them as members:

\`\`\`toml
[workspace]
members = ["programs/program_a", "programs/program_b"]
\`\`\`

## Common Configuration Patterns

For development, a typical configuration:

\`\`\`toml
[features]
seeds = true

[provider]
cluster = "Localnet"
wallet = "~/.config/solana/id.json"

[scripts]
test = "npx jest --config jest.config.ts"
\`\`\`

For deployment to devnet:

\`\`\`toml
[provider]
cluster = "Devnet"
wallet = "./deploy-keypair.json"
\`\`\`

Understanding this file is essential because it governs how \`anchor build\`, \`anchor test\`, and \`anchor deploy\` behave.`,
              },

              // Lesson 1.3 — Program Structure Deep Dive (content)
              {
                title: "Program Structure Deep Dive",
                description: "Explore the anatomy of an Anchor program module",
                type: "content",
                order: 2,
                xpReward: 25,
                duration: "20 min",
                content: `# Program Structure Deep Dive

An Anchor program has a well-defined structure. Understanding each component is essential before writing real instructions.

## The Program Module

The \`#[program]\` attribute macro transforms your module into a Solana program. Behind the scenes, Anchor generates:

1. An **instruction dispatcher** that reads the 8-byte discriminator from incoming instruction data and routes to the correct handler.
2. **Account deserialization and validation** for each handler's \`Context<T>\`.
3. **Error handling** that maps Rust errors to Solana program errors.

\`\`\`rust
use anchor_lang::prelude::*;

declare_id!("YourProgramId1111111111111111111111111111111");

#[program]
pub mod counter {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, start: u64) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count = start;
        counter.authority = ctx.accounts.authority.key();
        Ok(())
    }

    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count = counter.count.checked_add(1)
            .ok_or(ErrorCode::Overflow)?;
        Ok(())
    }
}
\`\`\`

## Instruction Discriminators

Anchor generates an 8-byte discriminator for each instruction by hashing \`"global:<instruction_name>"\` with SHA-256 and taking the first 8 bytes. For example:

- \`initialize\` → \`sha256("global:initialize")[0..8]\`
- \`increment\` → \`sha256("global:increment")[0..8]\`

This discriminator is prepended to the instruction data by the client SDK. On-chain, Anchor reads it to determine which handler to invoke.

## Accounts Structs

Each instruction requires an **accounts struct** decorated with \`#[derive(Accounts)]\`:

\`\`\`rust
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Counter::INIT_SPACE,
    )]
    pub counter: Account<'info, Counter>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(
        mut,
        has_one = authority,
    )]
    pub counter: Account<'info, Counter>,
    pub authority: Signer<'info>,
}
\`\`\`

Key points:
- **\`Account<'info, T>\`** — Deserializes and validates that the account data matches type \`T\`.
- **\`Signer<'info>\`** — Validates that this account signed the transaction.
- **\`Program<'info, System>\`** — Validates that this is the System Program.
- **\`#[account(init, ...)]\`** — Creates the account via a CPI to the System Program.
- **\`#[account(mut)]\`** — Marks the account as mutable.
- **\`has_one = authority\`** — Checks that \`counter.authority == authority.key()\`.

## State Accounts

Data accounts are defined with \`#[account]\`:

\`\`\`rust
#[account]
#[derive(InitSpace)]
pub struct Counter {
    pub count: u64,
    pub authority: Pubkey,
}
\`\`\`

The \`#[account]\` macro implements:
- Borsh serialization/deserialization
- An 8-byte discriminator (hash of \`"account:<AccountName>"\`)
- \`AccountSerialize\` and \`AccountDeserialize\` traits

The \`#[derive(InitSpace)]\` macro calculates the space required for the account data (excluding the 8-byte discriminator). You reference it as \`8 + Counter::INIT_SPACE\` when initializing.

## Error Handling

Define custom errors with \`#[error_code]\`:

\`\`\`rust
#[error_code]
pub enum ErrorCode {
    #[msg("Counter overflow")]
    Overflow,
    #[msg("Unauthorized")]
    Unauthorized,
}
\`\`\`

These become Solana program errors with unique error codes that clients can parse. Use them with the \`?\ operator or \`require!\` macro:

\`\`\`rust
require!(condition, ErrorCode::Unauthorized);
\`\`\`

## File Organization

For larger programs, split into multiple files:

\`\`\`
src/
├── lib.rs           # declare_id!, #[program] module
├── state/
│   ├── mod.rs
│   └── counter.rs   # #[account] structs
├── instructions/
│   ├── mod.rs
│   ├── initialize.rs
│   └── increment.rs
└── errors.rs         # #[error_code] enum
\`\`\`

In the next lesson, we cover IDL generation — the bridge between your on-chain program and off-chain clients.`,
              },

              // Lesson 1.4 — IDL Generation (content)
              {
                title: "IDL Generation",
                description:
                  "Understand how Anchor generates IDLs and how clients consume them",
                type: "content",
                order: 3,
                xpReward: 20,
                duration: "15 min",
                content: `# IDL Generation

The **IDL (Interface Definition Language)** is a JSON file that describes your Anchor program's public interface — its instructions, accounts, types, events, and errors. It is the bridge between your on-chain Rust program and off-chain TypeScript clients.

## Generating the IDL

Every time you run \`anchor build\`, the IDL is regenerated at:

\`\`\`
target/idl/my_program.json
\`\`\`

A corresponding TypeScript type file is also generated at:

\`\`\`
target/types/my_program.ts
\`\`\`

## IDL Structure

For a simple counter program, the IDL looks like:

\`\`\`json
{
  "version": "0.1.0",
  "name": "my_program",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        { "name": "counter", "isMut": true, "isSigner": false },
        { "name": "authority", "isMut": true, "isSigner": true },
        { "name": "systemProgram", "isMut": false, "isSigner": false }
      ],
      "args": [
        { "name": "start", "type": "u64" }
      ]
    },
    {
      "name": "increment",
      "accounts": [
        { "name": "counter", "isMut": true, "isSigner": false },
        { "name": "authority", "isMut": false, "isSigner": true }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "Counter",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "count", "type": "u64" },
          { "name": "authority", "type": "publicKey" }
        ]
      }
    }
  ]
}
\`\`\`

## Using the IDL in TypeScript

The \`@coral-xyz/anchor\` library uses the IDL to create a type-safe program client:

\`\`\`typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MyProgram } from "../target/types/my_program";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

const program = anchor.workspace.MyProgram as Program<MyProgram>;

// Call initialize — Anchor handles serialization automatically
await program.methods
  .initialize(new anchor.BN(0))
  .accounts({
    counter: counterKeypair.publicKey,
    authority: provider.wallet.publicKey,
    systemProgram: anchor.web3.SystemProgram.programId,
  })
  .signers([counterKeypair])
  .rpc();

// Fetch the account data — Anchor handles deserialization
const counterData = await program.account.counter.fetch(counterKeypair.publicKey);
console.log("Count:", counterData.count.toNumber()); // 0
\`\`\`

## IDL on Chain

You can publish your IDL on-chain so anyone can discover it:

\`\`\`bash
anchor idl init <program-id> --filepath target/idl/my_program.json
\`\`\`

To update after upgrades:

\`\`\`bash
anchor idl upgrade <program-id> --filepath target/idl/my_program.json
\`\`\`

Explorers like Solana Explorer and SolanaFM read on-chain IDLs to decode transactions and display account data in human-readable format.

## Anchor 0.30+ IDL Changes

Starting in Anchor 0.30, the IDL format was updated to be more expressive:
- Account types now include discriminator values.
- PDA seeds can be encoded in the IDL when \`seeds = true\` is set in \`Anchor.toml\`.
- Events and error codes are more precisely typed.

The IDL is what makes Anchor programs so developer-friendly. Clients never have to manually serialize instruction data or parse raw account bytes — the IDL encodes all that information.`,
              },

              // Lesson 1.5 — Challenge: Initialize a Counter Program (challenge)
              {
                title: "Initialize a Counter Program",
                description: "Set up a basic Anchor counter program with state",
                type: "challenge",
                order: 4,
                xpReward: 60,
                duration: "25 min",
                content: `# Challenge: Initialize a Counter Program

Now it is time to put your Anchor knowledge into practice. You will write a complete Anchor program that initializes a counter account.

## Requirements

1. Define a \`Counter\` account struct with two fields: \`count\` (u64) and \`authority\` (Pubkey).
2. Implement an \`initialize\` instruction that creates the counter account with an initial count of 0 and stores the authority.
3. Use the \`#[account(init, ...)]\` constraint with correct space allocation.

## Key Concepts

- Use \`#[derive(InitSpace)]\` to automatically calculate account space.
- The total space is \`8 + Counter::INIT_SPACE\` (8 bytes for the discriminator).
- The \`payer\` must be a mutable signer.
- The \`system_program\` is required for account creation.

## Example Usage

After deploying, a client would call:

\`\`\`typescript
await program.methods
  .initialize()
  .accounts({
    counter: counterPda,
    authority: wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
\`\`\`

Write the program below.`,
                challenge: {
                  create: {
                    prompt:
                      "Complete the Anchor program that initializes a Counter account. The Counter should store a `count` (u64, starting at 0) and an `authority` (Pubkey). Use proper account constraints including `init`, `payer`, and `space`.",
                    starterCode: `use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod counter {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        // TODO: Set counter.count to 0
        // TODO: Set counter.authority to the authority's key
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    // TODO: Add the counter account with init constraint
    //       payer = authority, space = 8 + Counter::INIT_SPACE

    // TODO: Add the authority as a mutable signer

    // TODO: Add the system_program
}

#[account]
#[derive(InitSpace)]
pub struct Counter {
    // TODO: Add count field (u64)
    // TODO: Add authority field (Pubkey)
}`,
                    language: "rust",
                    hints: [
                      "Use #[account(init, payer = authority, space = 8 + Counter::INIT_SPACE)] for the counter account.",
                      "The authority field should be `pub authority: Signer<'info>` with `#[account(mut)]`.",
                      "Access accounts via ctx.accounts.counter and ctx.accounts.authority.",
                    ],
                    solution: `use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod counter {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count = 0;
        counter.authority = ctx.accounts.authority.key();
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Counter::INIT_SPACE,
    )]
    pub counter: Account<'info, Counter>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Counter {
    pub count: u64,
    pub authority: Pubkey,
}`,
                    testCases: {
                      create: [
                        {
                          name: "Counter account is created with count = 0",
                          input: "initialize()",
                          expectedOutput: "counter.count == 0",
                          order: 0,
                        },
                        {
                          name: "Authority is stored correctly",
                          input: "initialize()",
                          expectedOutput:
                            "counter.authority == authority.key()",
                          order: 1,
                        },
                        {
                          name: "Account space is allocated correctly",
                          input: "initialize()",
                          expectedOutput:
                            "account data length == 8 + 8 + 32 = 48 bytes",
                          order: 2,
                        },
                      ],
                    },
                  },
                },
              },
            ],
          },
        },

        // ────────────────────────────────────────────────────────────────────
        // Module 2: Account Management
        // ────────────────────────────────────────────────────────────────────
        {
          title: "Account Management",
          description:
            "Master Anchor account types, initialization patterns, constraints, and validation.",
          order: 1,
          lessons: {
            create: [
              // Lesson 2.1 — The #[account] Attribute (content)
              {
                title: "The #[account] Attribute",
                description:
                  "Define and configure on-chain data accounts with Anchor",
                type: "content",
                order: 0,
                xpReward: 25,
                duration: "20 min",
                content: `# The #[account] Attribute

The \`#[account]\` attribute is how Anchor defines on-chain data structures. When you decorate a struct with \`#[account]\`, Anchor generates serialization, deserialization, and discriminator logic automatically.

## Basic Account Definition

\`\`\`rust
#[account]
#[derive(InitSpace)]
pub struct UserProfile {
    pub authority: Pubkey,     // 32 bytes
    pub username: String,      // 4 + len bytes (Borsh prefixes with u32 length)
    pub xp: u64,               // 8 bytes
    pub level: u8,             // 1 byte
    pub created_at: i64,       // 8 bytes (Unix timestamp)
}
\`\`\`

## Discriminators

Every Anchor account begins with an 8-byte discriminator, computed as \`sha256("account:<StructName>")[0..8]\`. When Anchor deserializes an account, it checks the first 8 bytes to ensure the account type matches what the instruction expects.

This prevents a critical class of bugs: passing an account of type \`TokenVault\` where a \`UserProfile\` is expected. Without discriminators, both might accidentally deserialize if they have overlapping byte layouts.

## Space Calculation

When creating an account, you must specify the exact space to allocate. Anchor's \`InitSpace\` derive macro calculates this automatically:

\`\`\`rust
#[account]
#[derive(InitSpace)]
pub struct GameState {
    pub player: Pubkey,          // 32
    pub score: u64,              // 8
    pub is_active: bool,         // 1
    #[max_len(32)]
    pub nickname: String,        // 4 + 32 = 36
    #[max_len(10)]
    pub inventory: Vec<u64>,     // 4 + (10 * 8) = 84
}
// Total: 32 + 8 + 1 + 36 + 84 = 161
// With discriminator: 8 + 161 = 169
\`\`\`

For dynamic types like \`String\` and \`Vec\`, use \`#[max_len(n)]\` to specify the maximum length.

## Manual Space Calculation

If you prefer manual control:

| Type | Size |
|------|------|
| \`bool\` | 1 byte |
| \`u8\` / \`i8\` | 1 byte |
| \`u16\` / \`i16\` | 2 bytes |
| \`u32\` / \`i32\` | 4 bytes |
| \`u64\` / \`i64\` | 8 bytes |
| \`u128\` / \`i128\` | 16 bytes |
| \`Pubkey\` | 32 bytes |
| \`String\` | 4 + content length |
| \`Vec<T>\` | 4 + (count * size_of::<T>()) |
| \`Option<T>\` | 1 + size_of::<T>() |

## Account Lifecycle

1. **Creation** — An \`init\` constraint creates the account via CPI to the System Program, allocating space and transferring rent-exempt lamports.
2. **Usage** — The account is read/written during instruction execution.
3. **Closure** — When no longer needed, the \`close\` constraint transfers remaining lamports to a recipient and zeroes the data.

\`\`\`rust
#[derive(Accounts)]
pub struct CloseProfile<'info> {
    #[account(
        mut,
        close = authority,
        has_one = authority,
    )]
    pub profile: Account<'info, UserProfile>,
    #[account(mut)]
    pub authority: Signer<'info>,
}
\`\`\`

The \`close = authority\` constraint transfers all remaining lamports to the \`authority\` account and sets the account data to the \`CLOSED_ACCOUNT_DISCRIMINATOR\`, preventing reuse.`,
              },

              // Lesson 2.2 — Init and Init If Needed (content)
              {
                title: "Init and Init If Needed",
                description:
                  "Account creation patterns with init and init_if_needed",
                type: "content",
                order: 1,
                xpReward: 25,
                duration: "20 min",
                content: `# Init and Init If Needed

Anchor provides two account initialization constraints: \`init\` and \`init_if_needed\`. Understanding when to use each is critical for writing correct programs.

## The \`init\` Constraint

\`init\` creates a brand-new account. It will **fail** if the account already exists:

\`\`\`rust
#[derive(Accounts)]
pub struct CreateVault<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Vault::INIT_SPACE,
    )]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}
\`\`\`

Behind the scenes, Anchor:
1. Calls \`system_program::create_account\` with the specified space and rent-exempt lamports.
2. Sets the account owner to the current program.
3. Writes the 8-byte discriminator.

### Init with Seeds (PDA)

To create a PDA (Program Derived Address), combine \`init\` with \`seeds\` and \`bump\`:

\`\`\`rust
#[derive(Accounts)]
pub struct CreateUserProfile<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + UserProfile::INIT_SPACE,
        seeds = [b"profile", user.key().as_ref()],
        bump,
    )]
    pub profile: Account<'info, UserProfile>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}
\`\`\`

Anchor derives the PDA address from the given seeds and verifies it matches the account passed in. The \`bump\` is automatically found and you should store it in the account data for future use:

\`\`\`rust
pub fn create_profile(ctx: Context<CreateUserProfile>, username: String) -> Result<()> {
    let profile = &mut ctx.accounts.profile;
    profile.authority = ctx.accounts.user.key();
    profile.username = username;
    profile.bump = ctx.bumps.profile;  // Store the bump!
    Ok(())
}
\`\`\`

## The \`init_if_needed\` Constraint

\`init_if_needed\` creates the account if it does not exist, or opens it if it does:

\`\`\`rust
#[derive(Accounts)]
pub struct EnsureProfile<'info> {
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + UserProfile::INIT_SPACE,
        seeds = [b"profile", user.key().as_ref()],
        bump,
    )]
    pub profile: Account<'info, UserProfile>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}
\`\`\`

### When to Use init_if_needed

Use it when:
- You want an idempotent instruction (safe to call multiple times).
- A single instruction should both initialize and update state.

### Security Warning

\`init_if_needed\` requires the feature flag in \`Cargo.toml\`:

\`\`\`toml
[dependencies]
anchor-lang = { version = "0.30.1", features = ["init-if-needed"] }
\`\`\`

This exists as a safeguard because \`init_if_needed\` introduces a **re-initialization attack vector**. If your instruction sets fields on the account without checking whether it was freshly created, an attacker could call it again to overwrite data. Always ensure your handler logic is idempotent or includes an \`is_initialized\` check:

\`\`\`rust
pub fn ensure_profile(ctx: Context<EnsureProfile>, username: String) -> Result<()> {
    let profile = &mut ctx.accounts.profile;
    if profile.authority == Pubkey::default() {
        // First-time initialization
        profile.authority = ctx.accounts.user.key();
        profile.username = username;
        profile.bump = ctx.bumps.profile;
    }
    // If already initialized, do nothing (idempotent)
    Ok(())
}
\`\`\`

## Realloc

When an account needs to grow (e.g., adding items to a Vec), use \`realloc\`:

\`\`\`rust
#[account(
    mut,
    realloc = 8 + new_space,
    realloc::payer = authority,
    realloc::zero = false,
    seeds = [b"profile", authority.key().as_ref()],
    bump = profile.bump,
)]
pub profile: Account<'info, UserProfile>,
\`\`\`

If the account grows, the payer funds the additional rent. If it shrinks, lamports are returned to the payer.`,
              },

              // Lesson 2.3 — Account Constraints (content)
              {
                title: "Account Constraints",
                description:
                  "Use Anchor constraints for powerful account validation",
                type: "content",
                order: 2,
                xpReward: 25,
                duration: "20 min",
                content: `# Account Constraints

Anchor constraints are declarative validation rules applied to accounts. They eliminate the need for manual checks in your instruction handler, reducing boilerplate and preventing common security bugs.

## Core Constraints Reference

### \`mut\` — Mark as Writable

\`\`\`rust
#[account(mut)]
pub counter: Account<'info, Counter>,
\`\`\`

The runtime requires accounts to be marked writable if the instruction modifies them. Anchor enforces this at compile time.

### \`has_one\` — Field Equality Check

\`\`\`rust
#[account(
    mut,
    has_one = authority,
)]
pub vault: Account<'info, Vault>,
pub authority: Signer<'info>,
\`\`\`

This checks that \`vault.authority == authority.key()\`. The field name in the struct must match the account name in the accounts struct. If the names differ, use \`constraint\`.

### \`constraint\` — Custom Validation

\`\`\`rust
#[account(
    constraint = vault.amount > 0 @ ErrorCode::VaultEmpty,
)]
pub vault: Account<'info, Vault>,
\`\`\`

The \`@\` syntax attaches a custom error. Without it, Anchor returns a generic \`ConstraintRaw\` error.

### \`seeds\` and \`bump\` — PDA Validation

\`\`\`rust
#[account(
    seeds = [b"vault", authority.key().as_ref()],
    bump = vault.bump,
)]
pub vault: Account<'info, Vault>,
\`\`\`

Verifies that the account address matches the PDA derived from the given seeds and bump. Always store and reuse bumps rather than searching for them on every call.

### \`close\` — Close Account

\`\`\`rust
#[account(
    mut,
    close = receiver,
    has_one = authority,
)]
pub escrow: Account<'info, Escrow>,
\`\`\`

Transfers all lamports to \`receiver\`, zeros the data, and sets the discriminator to \`CLOSED_ACCOUNT_DISCRIMINATOR\`.

### \`token\` and \`associated_token\` — SPL Token Validation

\`\`\`rust
#[account(
    mut,
    token::mint = mint,
    token::authority = authority,
)]
pub token_account: Account<'info, TokenAccount>,

#[account(
    init_if_needed,
    payer = authority,
    associated_token::mint = mint,
    associated_token::authority = authority,
)]
pub ata: Account<'info, TokenAccount>,
\`\`\`

These validate SPL Token accounts' mint and authority. The \`associated_token\` constraint derives the ATA address deterministically.

## Combining Constraints

Constraints compose naturally:

\`\`\`rust
#[account(
    mut,
    seeds = [b"game", player.key().as_ref()],
    bump = game.bump,
    has_one = player,
    constraint = game.is_active @ ErrorCode::GameInactive,
)]
pub game: Account<'info, GameState>,
\`\`\`

Anchor checks all constraints before your instruction handler executes. If any constraint fails, the transaction is rejected with the appropriate error.

## Account Types

| Type | Validates |
|------|-----------|
| \`Account<'info, T>\` | Owner is current program, deserializes as \`T\` |
| \`Signer<'info>\` | Account signed the transaction |
| \`Program<'info, T>\` | Account is the expected program |
| \`SystemAccount<'info>\` | Account is owned by System Program |
| \`UncheckedAccount<'info>\` | No validation (document why with \`/// CHECK:\`) |
| \`AccountInfo<'info>\` | Raw account info, no validation |

When using \`UncheckedAccount\` or \`AccountInfo\`, you MUST add a \`/// CHECK:\` doc comment explaining why validation is unnecessary, or your build will fail with a lint error.`,
              },

              // Lesson 2.4 — Challenge: Account Validation (challenge)
              {
                title: "Account Validation Challenge",
                description:
                  "Build a vault program with proper account constraints",
                type: "challenge",
                order: 3,
                xpReward: 60,
                duration: "25 min",
                content: `# Challenge: Account Validation

Build a simple vault program using Anchor constraints. The vault should be a PDA that stores an authority and a balance. Only the authority should be able to withdraw.

## Requirements

1. Define a \`Vault\` account with \`authority\` (Pubkey), \`balance\` (u64), and \`bump\` (u8).
2. Implement \`initialize_vault\` that creates a PDA vault with seeds \`[b"vault", authority.key()]\`.
3. Implement \`withdraw\` that transfers lamports from the vault to the authority, validating ownership via \`has_one\`.

The withdraw instruction should use the \`constraint\` attribute to ensure the vault has sufficient balance.`,
                challenge: {
                  create: {
                    prompt:
                      'Complete the vault program with proper PDA initialization and withdrawal. The vault uses seeds [b"vault", authority.key()] and only the authority can withdraw. Use has_one and constraint attributes for validation.',
                    starterCode: `use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod vault {
    use super::*;

    pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
        // TODO: Set vault.authority to the authority's key
        // TODO: Set vault.balance to 0
        // TODO: Store the bump from ctx.bumps.vault
        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        // TODO: Decrease vault.balance by amount
        // TODO: Transfer lamports from vault to authority
        // Hint: Use vault.sub_lamports(amount) and authority.add_lamports(amount)
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    // TODO: Add vault account with init, seeds, bump, payer, space

    // TODO: Add authority as mutable signer

    // TODO: Add system_program
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    // TODO: Add vault with mut, seeds, bump, has_one = authority
    //       and constraint that vault.balance >= amount

    // TODO: Add authority as mutable signer
}

#[account]
#[derive(InitSpace)]
pub struct Vault {
    // TODO: Add authority (Pubkey), balance (u64), bump (u8)
}`,
                    language: "rust",
                    hints: [
                      'For InitializeVault, use seeds = [b"vault", authority.key().as_ref()] and bump.',
                      "For Withdraw, reuse the stored bump: bump = vault.bump, and add constraint = vault.balance >= amount @ ErrorCode::InsufficientFunds.",
                      "Transfer lamports with vault.sub_lamports(amount)? and ctx.accounts.authority.add_lamports(amount)?.",
                    ],
                    solution: `use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod vault {
    use super::*;

    pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.authority = ctx.accounts.authority.key();
        vault.balance = 0;
        vault.bump = ctx.bumps.vault;
        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.balance = vault.balance.checked_sub(amount)
            .ok_or(error!(ErrorCode::InsufficientFunds))?;
        vault.sub_lamports(amount)?;
        ctx.accounts.authority.add_lamports(amount)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Vault::INIT_SPACE,
        seeds = [b"vault", authority.key().as_ref()],
        bump,
    )]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(
        mut,
        seeds = [b"vault", authority.key().as_ref()],
        bump = vault.bump,
        has_one = authority,
        constraint = vault.balance >= amount @ ErrorCode::InsufficientFunds,
    )]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Vault {
    pub authority: Pubkey,
    pub balance: u64,
    pub bump: u8,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Insufficient funds in vault")]
    InsufficientFunds,
}`,
                    testCases: {
                      create: [
                        {
                          name: "Vault PDA is created with correct authority and zero balance",
                          input: "initialize_vault()",
                          expectedOutput:
                            "vault.authority == authority.key() && vault.balance == 0",
                          order: 0,
                        },
                        {
                          name: "Withdraw decreases vault balance and transfers lamports",
                          input: "withdraw(amount=1000)",
                          expectedOutput:
                            "vault.balance decreased by 1000, authority lamports increased",
                          order: 1,
                        },
                        {
                          name: "Withdraw fails when amount exceeds balance",
                          input: "withdraw(amount=999999999)",
                          expectedOutput: "Error: InsufficientFunds",
                          order: 2,
                        },
                      ],
                    },
                  },
                },
              },

              // Lesson 2.5 — Challenge: Multi-Account Relationships (challenge)
              {
                title: "Multi-Account Relationships",
                description:
                  "Build a program with related accounts and cross-references",
                type: "challenge",
                order: 4,
                xpReward: 60,
                duration: "25 min",
                content: `# Challenge: Multi-Account Relationships

In real programs, accounts often reference each other. A \`Project\` might reference a \`Team\`, and a \`Task\` might reference both. Anchor's \`has_one\` and \`constraint\` attributes help enforce these relationships on-chain.

## Requirements

1. Define a \`Project\` account with \`authority\` (Pubkey), \`name\` (String, max 32), \`task_count\` (u64), and \`bump\` (u8).
2. Define a \`Task\` account with \`project\` (Pubkey), \`creator\` (Pubkey), \`title\` (String, max 64), \`completed\` (bool), and \`bump\` (u8).
3. Implement \`create_project\` with PDA seeds \`[b"project", authority.key()]\`.
4. Implement \`add_task\` that creates a Task PDA with seeds \`[b"task", project.key(), &project.task_count.to_le_bytes()]\` and increments \`project.task_count\`.

Use \`has_one\` to validate the project-authority relationship in add_task.`,
                challenge: {
                  create: {
                    prompt:
                      "Build a project management program with Project and Task accounts. Tasks are PDAs derived from the project key and an incrementing counter. Validate relationships with has_one constraints.",
                    starterCode: `use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod project_manager {
    use super::*;

    pub fn create_project(ctx: Context<CreateProject>, name: String) -> Result<()> {
        // TODO: Initialize project fields (authority, name, task_count=0, bump)
        Ok(())
    }

    pub fn add_task(ctx: Context<AddTask>, title: String) -> Result<()> {
        // TODO: Initialize task fields (project, creator, title, completed=false, bump)
        // TODO: Increment project.task_count
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(name: String)]
pub struct CreateProject<'info> {
    // TODO: project PDA with seeds [b"project", authority.key()]

    // TODO: authority as mutable signer

    // TODO: system_program
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct AddTask<'info> {
    // TODO: project (mut, has_one = authority)

    // TODO: task PDA with seeds [b"task", project.key(), &project.task_count.to_le_bytes()]

    // TODO: authority as mutable signer

    // TODO: system_program
}

#[account]
#[derive(InitSpace)]
pub struct Project {
    // TODO: authority, name (max 32), task_count, bump
}

#[account]
#[derive(InitSpace)]
pub struct Task {
    // TODO: project, creator, title (max 64), completed, bump
}`,
                    language: "rust",
                    hints: [
                      "Use #[instruction(name: String)] on CreateProject to access the instruction arg in seeds if needed.",
                      "For the Task PDA, use project.task_count.to_le_bytes() as part of the seed to create unique task accounts.",
                      "Remember to increment project.task_count after creating the task.",
                    ],
                    solution: `use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod project_manager {
    use super::*;

    pub fn create_project(ctx: Context<CreateProject>, name: String) -> Result<()> {
        let project = &mut ctx.accounts.project;
        project.authority = ctx.accounts.authority.key();
        project.name = name;
        project.task_count = 0;
        project.bump = ctx.bumps.project;
        Ok(())
    }

    pub fn add_task(ctx: Context<AddTask>, title: String) -> Result<()> {
        let task = &mut ctx.accounts.task;
        task.project = ctx.accounts.project.key();
        task.creator = ctx.accounts.authority.key();
        task.title = title;
        task.completed = false;
        task.bump = ctx.bumps.task;

        let project = &mut ctx.accounts.project;
        project.task_count = project.task_count.checked_add(1).unwrap();
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(name: String)]
pub struct CreateProject<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Project::INIT_SPACE,
        seeds = [b"project", authority.key().as_ref()],
        bump,
    )]
    pub project: Account<'info, Project>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct AddTask<'info> {
    #[account(
        mut,
        seeds = [b"project", authority.key().as_ref()],
        bump = project.bump,
        has_one = authority,
    )]
    pub project: Account<'info, Project>,

    #[account(
        init,
        payer = authority,
        space = 8 + Task::INIT_SPACE,
        seeds = [b"task", project.key().as_ref(), &project.task_count.to_le_bytes()],
        bump,
    )]
    pub task: Account<'info, Task>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Project {
    pub authority: Pubkey,
    #[max_len(32)]
    pub name: String,
    pub task_count: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Task {
    pub project: Pubkey,
    pub creator: Pubkey,
    #[max_len(64)]
    pub title: String,
    pub completed: bool,
    pub bump: u8,
}`,
                    testCases: {
                      create: [
                        {
                          name: "Project is created with correct authority and zero task count",
                          input: "create_project(name='My Project')",
                          expectedOutput:
                            "project.authority == authority.key() && project.task_count == 0",
                          order: 0,
                        },
                        {
                          name: "Task is created and project task_count increments",
                          input: "add_task(title='First Task')",
                          expectedOutput:
                            "task.title == 'First Task' && project.task_count == 1",
                          order: 1,
                        },
                        {
                          name: "Second task uses incremented counter for unique PDA",
                          input: "add_task(title='Second Task')",
                          expectedOutput:
                            "task PDA derived from task_count=1, project.task_count == 2",
                          order: 2,
                        },
                      ],
                    },
                  },
                },
              },
            ],
          },
        },

        // ────────────────────────────────────────────────────────────────────
        // Module 3: Instructions & Context
        // ────────────────────────────────────────────────────────────────────
        {
          title: "Instructions & Context",
          description:
            "Build complex instructions with custom data, signer validation, and cross-program invocations.",
          order: 2,
          lessons: {
            create: [
              // Lesson 3.1 — #[derive(Accounts)] Deep Dive (content)
              {
                title: "#[derive(Accounts)] Deep Dive",
                description:
                  "Master the accounts struct and how Anchor validates instruction contexts",
                type: "content",
                order: 0,
                xpReward: 25,
                duration: "20 min",
                content: `# #[derive(Accounts)] Deep Dive

The accounts struct is the heart of every Anchor instruction. When you write \`#[derive(Accounts)]\`, Anchor generates a complete validation pipeline that runs before your handler executes.

## What Anchor Generates

For each field in the struct, Anchor generates code that:

1. **Deserializes** the account from the accounts array passed to the program.
2. **Checks ownership** — verifies the account is owned by the expected program.
3. **Checks the discriminator** — confirms the account type matches.
4. **Applies constraints** — runs all \`#[account(...)]\` validations.
5. **Provides typed access** — gives you a fully deserialized, validated struct.

If any check fails, the instruction is rejected before your handler runs.

## Lifetime Annotations

\`\`\`rust
#[derive(Accounts)]
pub struct Transfer<'info> {
    #[account(mut)]
    pub from: Account<'info, Wallet>,
    #[account(mut)]
    pub to: Account<'info, Wallet>,
    pub authority: Signer<'info>,
}
\`\`\`

The \`'info\` lifetime ties account references to the underlying \`AccountInfo\` data provided by the Solana runtime. Every account type in the struct must carry this lifetime.

## The #[instruction] Attribute

Sometimes your accounts struct needs access to instruction arguments to compute seeds or validate constraints:

\`\`\`rust
#[derive(Accounts)]
#[instruction(id: u64, name: String)]
pub struct CreateItem<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + Item::INIT_SPACE,
        seeds = [b"item", creator.key().as_ref(), &id.to_le_bytes()],
        bump,
    )]
    pub item: Account<'info, Item>,

    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}
\`\`\`

The \`#[instruction(id: u64, name: String)]\` must list arguments in the same order as the handler function. You only need to list the ones you actually use in constraints.

## Remaining Accounts

Some instructions need a variable number of accounts. Use \`ctx.remaining_accounts\`:

\`\`\`rust
pub fn batch_process(ctx: Context<BatchProcess>) -> Result<()> {
    for account_info in ctx.remaining_accounts.iter() {
        // Process each additional account
        let mut data = account_info.try_borrow_mut_data()?;
        // ...
    }
    Ok(())
}
\`\`\`

Remaining accounts are not validated by Anchor — you must validate them manually.

## Nested Account Structs

For complex instructions, you can nest account groups, though this is less common:

\`\`\`rust
#[derive(Accounts)]
pub struct ComplexIx<'info> {
    pub authority: Signer<'info>,
    pub token_ctx: TokenContext<'info>,
}

#[derive(Accounts)]
pub struct TokenContext<'info> {
    pub mint: Account<'info, Mint>,
    pub token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}
\`\`\`

## Account Ordering

The order of accounts in the struct determines the order clients must pass them. Convention is:
1. The primary state account(s) being modified
2. Related data accounts
3. Authority / signer accounts
4. Program accounts (system_program, token_program, etc.)

Consistent ordering makes your program more readable and easier to integrate.`,
              },

              // Lesson 3.2 — Instruction Data (content)
              {
                title: "Instruction Data",
                description:
                  "Pass and validate arguments to Anchor instructions",
                type: "content",
                order: 1,
                xpReward: 25,
                duration: "20 min",
                content: `# Instruction Data

Anchor instructions can accept typed arguments that are automatically serialized by the client and deserialized on-chain. This lesson covers how to define, validate, and work with instruction data.

## Basic Arguments

Arguments are function parameters after the \`Context\`:

\`\`\`rust
pub fn create_listing(
    ctx: Context<CreateListing>,
    title: String,
    price: u64,
    quantity: u32,
) -> Result<()> {
    let listing = &mut ctx.accounts.listing;
    listing.title = title;
    listing.price = price;
    listing.quantity = quantity;
    listing.seller = ctx.accounts.seller.key();
    Ok(())
}
\`\`\`

Anchor uses Borsh serialization. The TypeScript client serializes args automatically:

\`\`\`typescript
await program.methods
  .createListing("Rare Sword", new BN(1_000_000), 5)
  .accounts({ listing: listingPda, seller: wallet.publicKey, systemProgram })
  .rpc();
\`\`\`

## Supported Types

| Rust Type | TypeScript Equivalent | Borsh Size |
|-----------|----------------------|------------|
| \`u8\`, \`i8\` | \`number\` | 1 byte |
| \`u16\`, \`i16\` | \`number\` | 2 bytes |
| \`u32\`, \`i32\` | \`number\` | 4 bytes |
| \`u64\`, \`i64\` | \`BN\` | 8 bytes |
| \`u128\`, \`i128\` | \`BN\` | 16 bytes |
| \`bool\` | \`boolean\` | 1 byte |
| \`String\` | \`string\` | 4 + len |
| \`Pubkey\` | \`PublicKey\` | 32 bytes |
| \`Vec<T>\` | \`T[]\` | 4 + items |
| \`Option<T>\` | \`T \\| null\` | 1 + value |

## Custom Types with #[derive(AnchorSerialize, AnchorDeserialize)]

You can define complex argument types:

\`\`\`rust
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ListingParams {
    pub title: String,
    pub price: u64,
    pub quantity: u32,
    pub category: Category,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum Category {
    Weapon,
    Armor,
    Consumable,
}

pub fn create_listing(
    ctx: Context<CreateListing>,
    params: ListingParams,
) -> Result<()> {
    let listing = &mut ctx.accounts.listing;
    listing.title = params.title;
    listing.price = params.price;
    // ...
    Ok(())
}
\`\`\`

On the TypeScript side:

\`\`\`typescript
await program.methods
  .createListing({
    title: "Rare Sword",
    price: new BN(1_000_000),
    quantity: 5,
    category: { weapon: {} },
  })
  .accounts({ ... })
  .rpc();
\`\`\`

Anchor enums in TypeScript are represented as objects with a single key matching the variant name.

## Input Validation

Always validate instruction data in your handler or via constraints:

\`\`\`rust
pub fn create_listing(
    ctx: Context<CreateListing>,
    title: String,
    price: u64,
) -> Result<()> {
    require!(title.len() <= 64, ErrorCode::TitleTooLong);
    require!(title.len() > 0, ErrorCode::TitleEmpty);
    require!(price > 0, ErrorCode::InvalidPrice);

    let listing = &mut ctx.accounts.listing;
    listing.title = title;
    listing.price = price;
    Ok(())
}
\`\`\`

The \`require!\` macro returns an error if the condition is false. For simple comparisons, \`require_eq!\` and \`require_keys_eq!\` are also available:

\`\`\`rust
require_eq!(amount, expected, ErrorCode::AmountMismatch);
require_keys_eq!(account.authority, signer.key(), ErrorCode::Unauthorized);
\`\`\`

## Transaction Size Limits

Solana transactions have a 1232-byte limit. Instruction data counts toward this. For large data (e.g., storing long strings), consider:
- Breaking data across multiple transactions.
- Using account \`realloc\` with incremental writes.
- Storing data off-chain (Arweave, IPFS) and keeping only a hash on-chain.`,
              },

              // Lesson 3.3 — Signers and Access Control (content)
              {
                title: "Signers and Access Control",
                description:
                  "Implement authorization patterns in Anchor programs",
                type: "content",
                order: 2,
                xpReward: 25,
                duration: "20 min",
                content: `# Signers and Access Control

Proper access control is the foundation of secure on-chain programs. Anchor provides multiple patterns for verifying who can execute an instruction.

## The Signer Type

\`\`\`rust
#[derive(Accounts)]
pub struct AdminAction<'info> {
    pub admin: Signer<'info>,
    // ...
}
\`\`\`

\`Signer<'info>\` verifies that this account's public key appears in the transaction's signature list. If the account did not sign the transaction, the instruction fails before your handler runs.

## has_one for Ownership

The most common pattern is storing an authority in an account and checking it:

\`\`\`rust
#[account]
pub struct Config {
    pub admin: Pubkey,
    pub fee_bps: u16,
}

#[derive(Accounts)]
pub struct UpdateFee<'info> {
    #[account(
        mut,
        has_one = admin,
    )]
    pub config: Account<'info, Config>,
    pub admin: Signer<'info>,
}
\`\`\`

\`has_one = admin\` checks that \`config.admin == admin.key()\`. Combined with \`Signer\`, this ensures only the stored admin can call this instruction.

## Multi-Signature Patterns

For critical operations, require multiple signers:

\`\`\`rust
#[derive(Accounts)]
pub struct CriticalAction<'info> {
    #[account(
        mut,
        has_one = admin,
        has_one = operator,
    )]
    pub config: Account<'info, Config>,
    pub admin: Signer<'info>,
    pub operator: Signer<'info>,
}
\`\`\`

Both \`admin\` and \`operator\` must sign the transaction.

## Role-Based Access Control

For programs with multiple roles, use an enum:

\`\`\`rust
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum Role {
    Admin,
    Moderator,
    User,
}

#[account]
pub struct UserRole {
    pub user: Pubkey,
    pub role: Role,
    pub bump: u8,
}

#[derive(Accounts)]
pub struct ModeratorAction<'info> {
    #[account(
        seeds = [b"role", authority.key().as_ref()],
        bump = user_role.bump,
        constraint = user_role.role == Role::Moderator
            || user_role.role == Role::Admin
            @ ErrorCode::Unauthorized,
    )]
    pub user_role: Account<'info, UserRole>,
    pub authority: Signer<'info>,
}
\`\`\`

## PDA Signing

PDAs can sign CPIs using \`invoke_signed\`. This is how programs act as authorities:

\`\`\`rust
pub fn transfer_from_vault(ctx: Context<TransferFromVault>, amount: u64) -> Result<()> {
    let vault = &ctx.accounts.vault;
    let seeds = &[
        b"vault",
        vault.authority.as_ref(),
        &[vault.bump],
    ];
    let signer_seeds = &[&seeds[..]];

    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.system_program.to_account_info(),
        anchor_lang::system_program::Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to: ctx.accounts.recipient.to_account_info(),
        },
        signer_seeds,
    );

    anchor_lang::system_program::transfer(cpi_ctx, amount)?;
    Ok(())
}
\`\`\`

The PDA does not have a private key. Instead, the runtime verifies the seeds + bump produce the PDA's address, then allows it to sign the CPI.

## Common Security Mistakes

1. **Forgetting Signer** — Using \`SystemAccount\` instead of \`Signer\` allows anyone to call the instruction.
2. **Missing has_one** — Not linking the signer to the account's stored authority.
3. **Wrong PDA seeds** — Using different seeds than what was used to create the PDA.
4. **Not checking program IDs in CPI** — An attacker could pass a fake program.`,
              },

              // Lesson 3.4 — Cross-Program Invocations (content)
              {
                title: "Cross-Program Invocations",
                description:
                  "Call other Solana programs from within your Anchor program",
                type: "content",
                order: 3,
                xpReward: 25,
                duration: "20 min",
                content: `# Cross-Program Invocations (CPI)

A CPI allows one Solana program to call another. This is how programs compose: a DEX calls the Token Program to transfer tokens, a lending protocol calls an oracle program for price data, and so on.

## CPI Basics

A CPI is essentially an instruction executed by Program A that targets Program B. The Solana runtime handles:
1. Routing the instruction to Program B.
2. Passing the required accounts.
3. Propagating signer privileges from the original transaction.

## CPI with Anchor

Anchor provides \`CpiContext\` to simplify CPIs. Here is a SOL transfer via the System Program:

\`\`\`rust
use anchor_lang::system_program;

pub fn pay(ctx: Context<Pay>, amount: u64) -> Result<()> {
    let cpi_context = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        system_program::Transfer {
            from: ctx.accounts.payer.to_account_info(),
            to: ctx.accounts.recipient.to_account_info(),
        },
    );
    system_program::transfer(cpi_context, amount)?;
    Ok(())
}

#[derive(Accounts)]
pub struct Pay<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut)]
    /// CHECK: Any account can receive SOL
    pub recipient: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}
\`\`\`

## CPI to the Token Program

Token transfers are the most common CPI:

\`\`\`rust
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

pub fn transfer_tokens(ctx: Context<TransferTokens>, amount: u64) -> Result<()> {
    let cpi_accounts = Transfer {
        from: ctx.accounts.from_ata.to_account_info(),
        to: ctx.accounts.to_ata.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
    );
    token::transfer(cpi_ctx, amount)?;
    Ok(())
}
\`\`\`

## PDA-Signed CPIs

When a PDA needs to sign a CPI, use \`CpiContext::new_with_signer\`:

\`\`\`rust
pub fn vault_transfer(ctx: Context<VaultTransfer>, amount: u64) -> Result<()> {
    let vault = &ctx.accounts.vault;

    let seeds = &[
        b"vault".as_ref(),
        vault.authority.as_ref(),
        &[vault.bump],
    ];
    let signer_seeds = &[&seeds[..]];

    let cpi_accounts = Transfer {
        from: ctx.accounts.vault_ata.to_account_info(),
        to: ctx.accounts.user_ata.to_account_info(),
        authority: ctx.accounts.vault.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
        signer_seeds,
    );
    token::transfer(cpi_ctx, amount)?;
    Ok(())
}
\`\`\`

The \`signer_seeds\` array tells the runtime how to derive the PDA, allowing it to sign.

## CPI Depth Limit

Solana supports up to **4 levels of CPI depth**. Program A can call B, B can call C, C can call D, but D cannot call another program. Design your architecture to stay within this limit.

## Account Reloading After CPI

After a CPI modifies an account, the local copy in your program is stale. Reload it:

\`\`\`rust
ctx.accounts.vault_ata.reload()?;
let new_balance = ctx.accounts.vault_ata.amount;
\`\`\`

This is critical when you read an account's state after a CPI that modified it.

## Security Considerations

1. **Always validate the target program ID.** Use \`Program<'info, Token>\` instead of passing a raw \`AccountInfo\` for the program.
2. **Check return values.** CPI calls return \`Result\` — always use \`?\` to propagate errors.
3. **Recheck state after CPI.** Do not assume account state is unchanged.
4. **Be aware of reentrancy.** While Solana's single-threaded execution prevents Ethereum-style reentrancy, a called program can invoke your program back if you pass it the right accounts.`,
              },

              // Lesson 3.5 — Challenge: Build a Payment Splitter (challenge)
              {
                title: "Build a Payment Splitter",
                description:
                  "Create an instruction that splits a SOL payment between two recipients",
                type: "challenge",
                order: 4,
                xpReward: 60,
                duration: "25 min",
                content: `# Challenge: Build a Payment Splitter

Build an Anchor program that splits a SOL payment between two recipients based on configured percentages. This exercise combines instruction data, signer validation, and CPIs.

## Requirements

1. Define a \`SplitConfig\` account with \`authority\` (Pubkey), \`recipient_a\` (Pubkey), \`recipient_b\` (Pubkey), \`share_a_bps\` (u16, basis points 0-10000), and \`bump\` (u8).
2. Implement \`initialize_split\` that creates the config PDA.
3. Implement \`split_payment\` that takes an \`amount\` and transfers the correct shares to each recipient via CPI to the System Program.

Share calculation: \`amount_a = amount * share_a_bps / 10000\`, \`amount_b = amount - amount_a\`.`,
                challenge: {
                  create: {
                    prompt:
                      "Complete the payment splitter program. Initialize a SplitConfig PDA and implement split_payment that divides SOL between two recipients using CPI transfers to the System Program.",
                    starterCode: `use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod payment_splitter {
    use super::*;

    pub fn initialize_split(
        ctx: Context<InitializeSplit>,
        recipient_a: Pubkey,
        recipient_b: Pubkey,
        share_a_bps: u16,
    ) -> Result<()> {
        // TODO: Validate share_a_bps <= 10000
        // TODO: Set all config fields
        Ok(())
    }

    pub fn split_payment(ctx: Context<SplitPayment>, amount: u64) -> Result<()> {
        // TODO: Calculate amount_a = amount * share_a_bps / 10000
        // TODO: Calculate amount_b = amount - amount_a
        // TODO: CPI transfer amount_a to recipient_a
        // TODO: CPI transfer amount_b to recipient_b
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeSplit<'info> {
    // TODO: config PDA with seeds [b"split", authority.key()]

    // TODO: authority as mutable signer

    // TODO: system_program
}

#[derive(Accounts)]
pub struct SplitPayment<'info> {
    // TODO: config (not mut, just read)
    //       with seeds and has_one = authority

    // TODO: authority as mutable signer (payer)

    /// CHECK: Validated against config.recipient_a
    // TODO: recipient_a (mut)

    /// CHECK: Validated against config.recipient_b
    // TODO: recipient_b (mut)

    // TODO: system_program
}

#[account]
#[derive(InitSpace)]
pub struct SplitConfig {
    // TODO: authority, recipient_a, recipient_b, share_a_bps, bump
}`,
                    language: "rust",
                    hints: [
                      "Use require!(share_a_bps <= 10000, ErrorCode::InvalidShare) to validate basis points.",
                      "For CPI, create a CpiContext::new with system_program::Transfer { from, to } and call system_program::transfer(cpi_ctx, amount).",
                      "Add constraint = config.recipient_a == recipient_a.key() to validate recipients in SplitPayment.",
                    ],
                    solution: `use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod payment_splitter {
    use super::*;

    pub fn initialize_split(
        ctx: Context<InitializeSplit>,
        recipient_a: Pubkey,
        recipient_b: Pubkey,
        share_a_bps: u16,
    ) -> Result<()> {
        require!(share_a_bps <= 10000, ErrorCode::InvalidShare);
        let config = &mut ctx.accounts.config;
        config.authority = ctx.accounts.authority.key();
        config.recipient_a = recipient_a;
        config.recipient_b = recipient_b;
        config.share_a_bps = share_a_bps;
        config.bump = ctx.bumps.config;
        Ok(())
    }

    pub fn split_payment(ctx: Context<SplitPayment>, amount: u64) -> Result<()> {
        let config = &ctx.accounts.config;
        let amount_a = (amount as u128)
            .checked_mul(config.share_a_bps as u128)
            .unwrap()
            .checked_div(10000)
            .unwrap() as u64;
        let amount_b = amount.checked_sub(amount_a).unwrap();

        // Transfer to recipient A
        let cpi_ctx_a = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.authority.to_account_info(),
                to: ctx.accounts.recipient_a.to_account_info(),
            },
        );
        system_program::transfer(cpi_ctx_a, amount_a)?;

        // Transfer to recipient B
        let cpi_ctx_b = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.authority.to_account_info(),
                to: ctx.accounts.recipient_b.to_account_info(),
            },
        );
        system_program::transfer(cpi_ctx_b, amount_b)?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeSplit<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + SplitConfig::INIT_SPACE,
        seeds = [b"split", authority.key().as_ref()],
        bump,
    )]
    pub config: Account<'info, SplitConfig>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SplitPayment<'info> {
    #[account(
        seeds = [b"split", authority.key().as_ref()],
        bump = config.bump,
        has_one = authority,
        constraint = config.recipient_a == recipient_a.key() @ ErrorCode::InvalidRecipient,
        constraint = config.recipient_b == recipient_b.key() @ ErrorCode::InvalidRecipient,
    )]
    pub config: Account<'info, SplitConfig>,

    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: Validated against config.recipient_a
    #[account(mut)]
    pub recipient_a: UncheckedAccount<'info>,

    /// CHECK: Validated against config.recipient_b
    #[account(mut)]
    pub recipient_b: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct SplitConfig {
    pub authority: Pubkey,
    pub recipient_a: Pubkey,
    pub recipient_b: Pubkey,
    pub share_a_bps: u16,
    pub bump: u8,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Share basis points must be <= 10000")]
    InvalidShare,
    #[msg("Recipient does not match config")]
    InvalidRecipient,
}`,
                    testCases: {
                      create: [
                        {
                          name: "SplitConfig is initialized with correct shares",
                          input:
                            "initialize_split(recipient_a, recipient_b, 7000)",
                          expectedOutput:
                            "config.share_a_bps == 7000 && config.authority == authority.key()",
                          order: 0,
                        },
                        {
                          name: "Payment is split correctly (70/30)",
                          input: "split_payment(amount=1_000_000_000)",
                          expectedOutput:
                            "recipient_a receives 700_000_000, recipient_b receives 300_000_000",
                          order: 1,
                        },
                        {
                          name: "Initialization fails with invalid share > 10000",
                          input:
                            "initialize_split(recipient_a, recipient_b, 15000)",
                          expectedOutput: "Error: InvalidShare",
                          order: 2,
                        },
                      ],
                    },
                  },
                },
              },

              // Lesson 3.6 — Challenge: CPI Token Transfer (challenge)
              {
                title: "CPI Token Transfer",
                description:
                  "Implement a program that performs CPI to transfer SPL tokens",
                type: "challenge",
                order: 5,
                xpReward: 60,
                duration: "25 min",
                content: `# Challenge: CPI Token Transfer

Build an Anchor instruction that transfers SPL tokens from a user's token account to a vault token account. This is the foundational pattern used in DEXs, lending protocols, and staking programs.

## Requirements

1. Define a \`DepositConfig\` account with \`authority\` (Pubkey), \`vault\` (Pubkey, the vault token account address), \`mint\` (Pubkey), \`total_deposited\` (u64), and \`bump\` (u8).
2. Implement \`initialize_deposit\` that creates the config.
3. Implement \`deposit\` that performs a CPI to the Token Program to transfer tokens from the user's ATA to the vault, and updates \`total_deposited\`.

Use \`anchor_spl::token\` for the CPI.`,
                challenge: {
                  create: {
                    prompt:
                      "Complete the deposit program that transfers SPL tokens from a user's token account to a vault via CPI. Use anchor_spl::token::transfer and validate token account mints and authorities.",
                    starterCode: `use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("11111111111111111111111111111111");

#[program]
pub mod token_deposit {
    use super::*;

    pub fn initialize_deposit(ctx: Context<InitializeDeposit>) -> Result<()> {
        // TODO: Set config fields (authority, vault address, mint, total_deposited=0, bump)
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        // TODO: CPI to token::transfer from user_ata to vault_ata
        // TODO: Update config.total_deposited
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeDeposit<'info> {
    // TODO: config PDA with seeds [b"deposit", authority.key()]

    // TODO: vault_ata as token account

    // TODO: mint account

    // TODO: authority as mutable signer

    // TODO: system_program
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    // TODO: config (mut, seeds, bump, has_one = authority)

    // TODO: user_ata (mut, token account with correct mint and authority)

    // TODO: vault_ata (mut, address must match config.vault)

    // TODO: authority as signer

    // TODO: token_program
}

#[account]
#[derive(InitSpace)]
pub struct DepositConfig {
    // TODO: authority, vault, mint, total_deposited, bump
}`,
                    language: "rust",
                    hints: [
                      "Use token::transfer(CpiContext::new(token_program, Transfer { from, to, authority }), amount) for the CPI.",
                      "Validate user_ata with token::mint = mint and token::authority = authority constraints.",
                      "Use constraint = vault_ata.key() == config.vault to ensure the correct vault is used.",
                    ],
                    solution: `use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("11111111111111111111111111111111");

#[program]
pub mod token_deposit {
    use super::*;

    pub fn initialize_deposit(ctx: Context<InitializeDeposit>) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.authority = ctx.accounts.authority.key();
        config.vault = ctx.accounts.vault_ata.key();
        config.mint = ctx.accounts.mint.key();
        config.total_deposited = 0;
        config.bump = ctx.bumps.config;
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_ata.to_account_info(),
            to: ctx.accounts.vault_ata.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
        );
        token::transfer(cpi_ctx, amount)?;

        let config = &mut ctx.accounts.config;
        config.total_deposited = config.total_deposited
            .checked_add(amount)
            .ok_or(error!(ErrorCode::Overflow))?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeDeposit<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + DepositConfig::INIT_SPACE,
        seeds = [b"deposit", authority.key().as_ref()],
        bump,
    )]
    pub config: Account<'info, DepositConfig>,

    pub vault_ata: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(
        mut,
        seeds = [b"deposit", authority.key().as_ref()],
        bump = config.bump,
        has_one = authority,
    )]
    pub config: Account<'info, DepositConfig>,

    #[account(
        mut,
        token::mint = config.mint,
        token::authority = authority,
    )]
    pub user_ata: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = vault_ata.key() == config.vault @ ErrorCode::InvalidVault,
    )]
    pub vault_ata: Account<'info, TokenAccount>,

    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[account]
#[derive(InitSpace)]
pub struct DepositConfig {
    pub authority: Pubkey,
    pub vault: Pubkey,
    pub mint: Pubkey,
    pub total_deposited: u64,
    pub bump: u8,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Invalid vault account")]
    InvalidVault,
}`,
                    testCases: {
                      create: [
                        {
                          name: "Config is initialized with correct vault and mint",
                          input: "initialize_deposit()",
                          expectedOutput:
                            "config.vault == vault_ata.key() && config.mint == mint.key()",
                          order: 0,
                        },
                        {
                          name: "Deposit transfers tokens and updates total",
                          input: "deposit(amount=1000)",
                          expectedOutput:
                            "vault_ata.amount increases by 1000, config.total_deposited == 1000",
                          order: 1,
                        },
                        {
                          name: "Multiple deposits accumulate total_deposited",
                          input: "deposit(500) then deposit(300)",
                          expectedOutput: "config.total_deposited == 800",
                          order: 2,
                        },
                      ],
                    },
                  },
                },
              },
            ],
          },
        },

        // ────────────────────────────────────────────────────────────────────
        // Module 4: State & Events
        // ────────────────────────────────────────────────────────────────────
        {
          title: "State & Events",
          description:
            "Master account serialization, Anchor events, and PDA patterns with seeds and bumps.",
          order: 3,
          lessons: {
            create: [
              // Lesson 4.1 — Account Serialization (content)
              {
                title: "Account Serialization",
                description:
                  "Understand Borsh serialization and how Anchor stores data on-chain",
                type: "content",
                order: 0,
                xpReward: 25,
                duration: "20 min",
                content: `# Account Serialization

Anchor uses **Borsh** (Binary Object Representation Serializer for Hashing) to serialize and deserialize account data. Understanding how this works helps you optimize account space, debug issues, and work with raw account data.

## How Borsh Works

Borsh is a deterministic, non-self-describing binary format. "Deterministic" means the same data always produces the same bytes. "Non-self-describing" means you need the schema to interpret the bytes — the data alone does not contain type information.

\`\`\`rust
#[account]
pub struct Player {
    pub name: String,    // 4 bytes (length) + N bytes (content)
    pub score: u64,      // 8 bytes
    pub level: u8,       // 1 byte
    pub is_active: bool, // 1 byte
}
\`\`\`

For a player with name "Alice" (5 chars), the serialized layout is:

\`\`\`
[discriminator: 8 bytes]
[name_len: 05 00 00 00]  // u32 little-endian = 5
[name: 41 6C 69 63 65]   // "Alice" in UTF-8
[score: 00 00 00 00 00 00 00 00]  // u64 = 0
[level: 01]               // u8 = 1
[is_active: 01]           // bool = true
\`\`\`

## The 8-Byte Discriminator

Every Anchor account starts with 8 bytes that identify the account type:

\`\`\`
sha256("account:<StructName>")[0..8]
\`\`\`

For \`Player\`: \`sha256("account:Player")[0..8]\`

Anchor checks this discriminator during deserialization. If it does not match, the account is rejected. This prevents type confusion attacks.

## Zero Copy Deserialization

For large accounts (>1KB), standard Borsh deserialization copies data into a new Rust struct. **Zero-copy** avoids this allocation by mapping the account data directly to a Rust struct:

\`\`\`rust
#[account(zero_copy)]
#[repr(C)]
pub struct LargeState {
    pub data: [u64; 128],  // 1024 bytes
    pub owner: Pubkey,      // 32 bytes
    pub counter: u64,       // 8 bytes
}
\`\`\`

Requirements for zero-copy:
- \`#[repr(C)]\` ensures C-compatible memory layout.
- All fields must be plain data types (no String, Vec, or Option).
- Use \`AccountLoader<'info, LargeState>\` instead of \`Account<'info, LargeState>\`.

\`\`\`rust
#[derive(Accounts)]
pub struct UpdateLargeState<'info> {
    #[account(mut)]
    pub state: AccountLoader<'info, LargeState>,
}

pub fn update(ctx: Context<UpdateLargeState>) -> Result<()> {
    let mut state = ctx.accounts.state.load_mut()?;
    state.counter += 1;
    Ok(())
}
\`\`\`

## Reserved Space

For future-proofing, add reserved bytes:

\`\`\`rust
#[account]
#[derive(InitSpace)]
pub struct Config {
    pub admin: Pubkey,
    pub fee_bps: u16,
    pub version: u8,
    pub _reserved: [u8; 64],  // 64 bytes reserved for future fields
}
\`\`\`

When you add a new field later, carve it from the reserved space instead of requiring a migration. This is a common pattern in production Solana programs.

## Debugging Serialization

Use \`solana account <address> --output json\` to see raw account data. The \`data\` field contains the base64-encoded bytes. You can decode them manually using the Borsh layout.

For programmatic access:

\`\`\`typescript
const accountInfo = await connection.getAccountInfo(address);
const data = accountInfo.data;
// First 8 bytes are the discriminator
const discriminator = data.slice(0, 8);
// Remaining bytes are Borsh-encoded fields
\`\`\``,
              },

              // Lesson 4.2 — Anchor Events (content)
              {
                title: "Anchor Events",
                description:
                  "Emit and consume events for off-chain indexing and monitoring",
                type: "content",
                order: 1,
                xpReward: 25,
                duration: "20 min",
                content: `# Anchor Events

Events are a mechanism for programs to communicate information to off-chain observers. They are emitted as part of transaction logs and can be indexed by services like Helius, Triton, or your own infrastructure.

## Defining Events

\`\`\`rust
#[event]
pub struct TradeExecuted {
    pub trader: Pubkey,
    pub mint_in: Pubkey,
    pub mint_out: Pubkey,
    pub amount_in: u64,
    pub amount_out: u64,
    pub timestamp: i64,
}
\`\`\`

The \`#[event]\` attribute generates a unique event discriminator (similar to account discriminators) and implements serialization.

## Emitting Events

Use the \`emit!\` macro inside your instruction handler:

\`\`\`rust
pub fn execute_trade(ctx: Context<ExecuteTrade>, amount_in: u64) -> Result<()> {
    // ... trade logic ...

    emit!(TradeExecuted {
        trader: ctx.accounts.trader.key(),
        mint_in: ctx.accounts.mint_in.key(),
        mint_out: ctx.accounts.mint_out.key(),
        amount_in,
        amount_out: calculated_amount,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
\`\`\`

The event data is serialized and written to the transaction log via \`sol_log_data\`.

## Consuming Events in TypeScript

The Anchor client SDK can parse events from transaction logs:

\`\`\`typescript
// Listen to events in real-time
const listener = program.addEventListener("TradeExecuted", (event, slot) => {
  console.log("Trade:", event.trader.toBase58());
  console.log("Amount In:", event.amountIn.toNumber());
  console.log("Amount Out:", event.amountOut.toNumber());
  console.log("Slot:", slot);
});

// Later, remove the listener
program.removeEventListener(listener);
\`\`\`

You can also parse events from historical transactions:

\`\`\`typescript
const tx = await provider.connection.getTransaction(signature, {
  commitment: "confirmed",
});

const events = program.coder.events.decode(
  tx.meta.logMessages.join("\\n")
);
\`\`\`

## Event Best Practices

1. **Include all relevant data.** Events are for off-chain consumption. Include pubkeys, amounts, and timestamps so indexers do not need to fetch additional account data.
2. **Keep events small.** Event data is stored in transaction logs, which have a 10KB limit per transaction. Avoid large strings or arrays.
3. **Use events for state changes.** Emit events when meaningful state transitions occur — trades, deposits, withdrawals, ownership transfers.
4. **Do not rely on events for on-chain logic.** Events cannot be read by other instructions or programs. They are strictly for off-chain use.

## Event vs. Account Data

| Aspect | Events | Account Data |
|--------|--------|-------------|
| Persistence | Stored in tx logs (historical) | Stored on-chain (live) |
| Accessibility | Off-chain only | On-chain and off-chain |
| Cost | Minimal (log data) | Rent-exempt deposit |
| Queryability | Requires indexer | Direct RPC fetch |

For data that clients need to react to in real-time (trades, notifications), use events. For data that programs need to read (balances, config), use accounts.`,
              },

              // Lesson 4.3 — PDAs with Seeds and Bumps (content)
              {
                title: "PDAs with Seeds and Bumps",
                description:
                  "Master Program Derived Addresses for deterministic account addressing",
                type: "content",
                order: 2,
                xpReward: 25,
                duration: "20 min",
                content: `# PDAs with Seeds and Bumps

Program Derived Addresses (PDAs) are deterministic addresses derived from a combination of seeds, a bump, and a program ID. They are the standard way to create accounts that your program controls.

## How PDAs Work

A PDA is an address that falls **off** the Ed25519 elliptic curve. This means no private key exists for it, so only the program that derived it can sign for it (via CPI).

\`\`\`rust
// Derive a PDA
let (pda, bump) = Pubkey::find_program_address(
    &[b"user", user_key.as_ref()],
    &program_id,
);
\`\`\`

\`find_program_address\` internally calls \`create_program_address\` with decreasing bump values (255, 254, 253, ...) until it finds an address that is NOT on the curve. The first valid bump is the **canonical bump**.

## Seed Patterns

Seeds are arbitrary byte arrays that make PDAs unique and predictable:

\`\`\`rust
// Global singleton
seeds = [b"config"]

// Per-user account
seeds = [b"profile", user.key().as_ref()]

// Per-user, per-entity
seeds = [b"enrollment", course_id.as_ref(), user.key().as_ref()]

// With numeric identifiers
seeds = [b"item", &item_id.to_le_bytes()]

// Compound seeds
seeds = [b"bid", auction.key().as_ref(), bidder.key().as_ref()]
\`\`\`

## Storing and Reusing Bumps

Finding the canonical bump requires iterating from 255 downward, which costs compute units. Always store the bump and reuse it:

\`\`\`rust
#[account]
#[derive(InitSpace)]
pub struct Vault {
    pub authority: Pubkey,
    pub balance: u64,
    pub bump: u8,  // Store the bump!
}

// During initialization:
pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    vault.bump = ctx.bumps.vault;  // Anchor provides the bump
    Ok(())
}

// Later, when validating:
#[account(
    seeds = [b"vault", authority.key().as_ref()],
    bump = vault.bump,  // Use stored bump (no search needed)
)]
pub vault: Account<'info, Vault>,
\`\`\`

Using the stored bump instead of \`bump\` (which searches) saves approximately 3,000 compute units per validation.

## PDA Signing

PDAs sign CPIs using the seeds + bump that derive their address:

\`\`\`rust
pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    let authority_key = ctx.accounts.authority.key();
    let seeds = &[
        b"vault".as_ref(),
        authority_key.as_ref(),
        &[ctx.accounts.vault.bump],
    ];
    let signer_seeds = &[&seeds[..]];

    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.system_program.to_account_info(),
        system_program::Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to: ctx.accounts.authority.to_account_info(),
        },
        signer_seeds,
    );
    system_program::transfer(cpi_ctx, amount)?;
    Ok(())
}
\`\`\`

## Common PDA Patterns

### One-to-One Mapping
\`\`\`rust
// Each user has exactly one profile
seeds = [b"profile", user.key().as_ref()]
\`\`\`

### One-to-Many with Counter
\`\`\`rust
// User can have many posts, indexed by counter
seeds = [b"post", user.key().as_ref(), &post_count.to_le_bytes()]
\`\`\`

### Relationship Accounts
\`\`\`rust
// Tracks relationship between two entities
seeds = [b"follow", follower.key().as_ref(), followee.key().as_ref()]
\`\`\`

### Scoped Configuration
\`\`\`rust
// Config per marketplace
seeds = [b"config", marketplace_id.as_ref()]
\`\`\`

## PDA Address Collisions

Because PDAs are deterministic, two programs using the same seeds produce different addresses (the program ID is part of the derivation). However, within a single program, ensure your seed patterns do not collide. Use unique prefixes for each account type.`,
              },

              // Lesson 4.4 — Challenge: Event-Driven State Machine (challenge)
              {
                title: "Event-Driven State Machine",
                description:
                  "Build a program with state transitions and event emissions",
                type: "challenge",
                order: 3,
                xpReward: 60,
                duration: "25 min",
                content: `# Challenge: Event-Driven State Machine

Build an escrow-style program with distinct states and events. The escrow goes through three states: Created, Funded, and Completed. Each transition emits an event for off-chain indexers.

## Requirements

1. Define an \`Escrow\` account with \`seller\` (Pubkey), \`buyer\` (Pubkey), \`amount\` (u64), \`state\` (EscrowState enum), and \`bump\` (u8).
2. Define \`EscrowState\` as an enum: \`Created\`, \`Funded\`, \`Completed\`.
3. Implement \`create_escrow\` — initializes the escrow in \`Created\` state and emits \`EscrowCreated\`.
4. Implement \`fund_escrow\` — transitions to \`Funded\` and emits \`EscrowFunded\`. Only works in \`Created\` state.
5. Define events: \`EscrowCreated { escrow, seller, buyer, amount }\` and \`EscrowFunded { escrow, buyer, amount }\`.`,
                challenge: {
                  create: {
                    prompt:
                      "Complete the escrow state machine with state transitions and event emissions. Each transition must validate the current state before proceeding, and emit the appropriate Anchor event.",
                    starterCode: `use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod escrow {
    use super::*;

    pub fn create_escrow(
        ctx: Context<CreateEscrow>,
        buyer: Pubkey,
        amount: u64,
    ) -> Result<()> {
        // TODO: Initialize escrow fields (seller, buyer, amount, state=Created, bump)
        // TODO: Emit EscrowCreated event
        Ok(())
    }

    pub fn fund_escrow(ctx: Context<FundEscrow>) -> Result<()> {
        // TODO: Validate state is Created
        // TODO: Transition state to Funded
        // TODO: Emit EscrowFunded event
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(buyer: Pubkey, amount: u64)]
pub struct CreateEscrow<'info> {
    // TODO: escrow PDA with seeds [b"escrow", seller.key(), buyer.as_ref()]

    // TODO: seller as mutable signer

    // TODO: system_program
}

#[derive(Accounts)]
pub struct FundEscrow<'info> {
    // TODO: escrow (mut, has_one = buyer)

    // TODO: buyer as signer
}

#[account]
#[derive(InitSpace)]
pub struct Escrow {
    // TODO: seller, buyer, amount, state (EscrowState), bump
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, InitSpace)]
pub enum EscrowState {
    Created,
    Funded,
    Completed,
}

// TODO: Define EscrowCreated event
// TODO: Define EscrowFunded event`,
                    language: "rust",
                    hints: [
                      "Use require!(escrow.state == EscrowState::Created, ErrorCode::InvalidState) to validate transitions.",
                      "Emit events with emit!(EscrowCreated { escrow: escrow_key, seller, buyer, amount }).",
                      "The EscrowState enum uses 1 byte (Borsh enum discriminant). Include it in space calculation via InitSpace.",
                    ],
                    solution: `use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod escrow {
    use super::*;

    pub fn create_escrow(
        ctx: Context<CreateEscrow>,
        buyer: Pubkey,
        amount: u64,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        escrow.seller = ctx.accounts.seller.key();
        escrow.buyer = buyer;
        escrow.amount = amount;
        escrow.state = EscrowState::Created;
        escrow.bump = ctx.bumps.escrow;

        emit!(EscrowCreated {
            escrow: escrow.key(),
            seller: escrow.seller,
            buyer: escrow.buyer,
            amount: escrow.amount,
        });

        Ok(())
    }

    pub fn fund_escrow(ctx: Context<FundEscrow>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(
            escrow.state == EscrowState::Created,
            ErrorCode::InvalidState
        );

        escrow.state = EscrowState::Funded;

        emit!(EscrowFunded {
            escrow: escrow.key(),
            buyer: escrow.buyer,
            amount: escrow.amount,
        });

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(buyer: Pubkey, amount: u64)]
pub struct CreateEscrow<'info> {
    #[account(
        init,
        payer = seller,
        space = 8 + Escrow::INIT_SPACE,
        seeds = [b"escrow", seller.key().as_ref(), buyer.as_ref()],
        bump,
    )]
    pub escrow: Account<'info, Escrow>,

    #[account(mut)]
    pub seller: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FundEscrow<'info> {
    #[account(
        mut,
        has_one = buyer,
    )]
    pub escrow: Account<'info, Escrow>,

    pub buyer: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Escrow {
    pub seller: Pubkey,
    pub buyer: Pubkey,
    pub amount: u64,
    pub state: EscrowState,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, InitSpace)]
pub enum EscrowState {
    Created,
    Funded,
    Completed,
}

#[event]
pub struct EscrowCreated {
    pub escrow: Pubkey,
    pub seller: Pubkey,
    pub buyer: Pubkey,
    pub amount: u64,
}

#[event]
pub struct EscrowFunded {
    pub escrow: Pubkey,
    pub buyer: Pubkey,
    pub amount: u64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid escrow state for this operation")]
    InvalidState,
}`,
                    testCases: {
                      create: [
                        {
                          name: "Escrow is created in Created state with correct fields",
                          input: "create_escrow(buyer, amount=1_000_000)",
                          expectedOutput:
                            "escrow.state == Created && escrow.amount == 1_000_000",
                          order: 0,
                        },
                        {
                          name: "Fund transitions escrow to Funded state",
                          input: "fund_escrow() on Created escrow",
                          expectedOutput: "escrow.state == Funded",
                          order: 1,
                        },
                        {
                          name: "Fund fails on already-funded escrow",
                          input: "fund_escrow() on Funded escrow",
                          expectedOutput: "Error: InvalidState",
                          order: 2,
                        },
                      ],
                    },
                  },
                },
              },
            ],
          },
        },

        // ────────────────────────────────────────────────────────────────────
        // Module 5: Testing & Deployment
        // ────────────────────────────────────────────────────────────────────
        {
          title: "Testing & Deployment",
          description:
            "Write comprehensive tests with Bankrun and integration tests, then deploy and publish your program.",
          order: 4,
          lessons: {
            create: [
              // Lesson 5.1 — Bankrun Tests (content)
              {
                title: "Bankrun Tests",
                description:
                  "Write fast, lightweight tests using solana-bankrun",
                type: "content",
                order: 0,
                xpReward: 25,
                duration: "20 min",
                content: `# Bankrun Tests

**Bankrun** (solana-bankrun) provides a lightweight, in-process Solana runtime for testing. Unlike \`anchor test\` which spins up a full local validator, Bankrun runs a minimal BanksServer that processes transactions in-memory. Tests run significantly faster — often 10-100x compared to a local validator.

## Setup

Install the bankrun package:

\`\`\`bash
npm install solana-bankrun @coral-xyz/anchor
\`\`\`

## Basic Test Structure

\`\`\`typescript
import { startAnchor } from "solana-bankrun";
import { BankrunProvider } from "anchor-bankrun";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import { MyProgram } from "../target/types/my_program";

describe("my_program", () => {
  let provider: BankrunProvider;
  let program: Program<MyProgram>;

  beforeAll(async () => {
    // Start Bankrun with your program loaded
    const context = await startAnchor(".", [], []);
    provider = new BankrunProvider(context);
    program = new Program<MyProgram>(
      require("../target/idl/my_program.json"),
      provider
    );
  });

  it("initializes the counter", async () => {
    const counter = Keypair.generate();

    await program.methods
      .initialize()
      .accounts({
        counter: counter.publicKey,
        authority: provider.wallet.publicKey,
        systemProgram: PublicKey.default,
      })
      .signers([counter])
      .rpc();

    const account = await program.account.counter.fetch(counter.publicKey);
    expect(account.count.toNumber()).toBe(0);
    expect(account.authority.toBase58()).toBe(
      provider.wallet.publicKey.toBase58()
    );
  });
});
\`\`\`

## Key Bankrun Features

### Time Manipulation

Bankrun lets you warp the clock forward, which is essential for testing time-dependent logic:

\`\`\`typescript
const context = await startAnchor(".", [], []);
const clock = await context.banksClient.getClock();

// Advance time by 24 hours
context.setClock({
  ...clock,
  unixTimestamp: clock.unixTimestamp + BigInt(86400),
});
\`\`\`

### Account Injection

Pre-populate accounts with specific data before tests:

\`\`\`typescript
const context = await startAnchor(".", [], [
  {
    address: somePublicKey,
    info: {
      lamports: 1_000_000_000,
      data: Buffer.alloc(100),
      owner: myProgramId,
      executable: false,
    },
  },
]);
\`\`\`

### Transaction Metadata

Access detailed transaction results:

\`\`\`typescript
const tx = await program.methods
  .increment()
  .accounts({ counter: counterPda, authority: wallet.publicKey })
  .rpc();

const txMeta = await context.banksClient.getTransaction(tx);
console.log("Compute units used:", txMeta.meta.computeUnitsConsumed);
console.log("Logs:", txMeta.meta.logMessages);
\`\`\`

## Bankrun vs Local Validator

| Feature | Bankrun | Local Validator |
|---------|---------|-----------------|
| Startup time | ~100ms | ~5-10 seconds |
| Transaction time | ~1ms | ~500ms |
| Clock control | Yes | No |
| Account injection | Yes | Limited |
| Full network simulation | No | Yes |
| CPI to deployed programs | Via account injection | Yes |

Use Bankrun for unit tests and fast iteration. Use the local validator for integration tests that need full network behavior.`,
              },

              // Lesson 5.2 — Integration Tests (content)
              {
                title: "Integration Tests",
                description:
                  "Write end-to-end tests with the Anchor test framework",
                type: "content",
                order: 1,
                xpReward: 25,
                duration: "20 min",
                content: `# Integration Tests

While Bankrun excels at unit testing, integration tests verify your program works correctly in a full validator environment with real network behavior — transaction ordering, slot advancement, and cross-program invocations.

## Anchor Test Setup

\`\`\`bash
anchor test
\`\`\`

This command:
1. Builds all programs (\`anchor build\`).
2. Starts a local validator (\`solana-test-validator\`).
3. Deploys your programs.
4. Runs the test script from \`Anchor.toml\`.
5. Shuts down the validator.

## Test File Structure

\`\`\`typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Counter } from "../target/types/counter";
import { assert } from "chai";

describe("counter", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Counter as Program<Counter>;
  const authority = provider.wallet;

  let counterPda: anchor.web3.PublicKey;
  let counterBump: number;

  before(async () => {
    [counterPda, counterBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("counter"), authority.publicKey.toBuffer()],
      program.programId
    );
  });

  it("Initializes the counter", async () => {
    await program.methods
      .initialize()
      .accounts({
        counter: counterPda,
        authority: authority.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const account = await program.account.counter.fetch(counterPda);
    assert.equal(account.count.toNumber(), 0);
    assert.equal(
      account.authority.toBase58(),
      authority.publicKey.toBase58()
    );
  });

  it("Increments the counter", async () => {
    await program.methods
      .increment()
      .accounts({
        counter: counterPda,
        authority: authority.publicKey,
      })
      .rpc();

    const account = await program.account.counter.fetch(counterPda);
    assert.equal(account.count.toNumber(), 1);
  });

  it("Fails when non-authority tries to increment", async () => {
    const attacker = anchor.web3.Keypair.generate();

    // Airdrop SOL to attacker
    const sig = await provider.connection.requestAirdrop(
      attacker.publicKey,
      1_000_000_000
    );
    await provider.connection.confirmTransaction(sig);

    try {
      await program.methods
        .increment()
        .accounts({
          counter: counterPda,
          authority: attacker.publicKey,
        })
        .signers([attacker])
        .rpc();

      assert.fail("Expected error");
    } catch (err) {
      assert.include(err.message, "has_one");
    }
  });
});
\`\`\`

## Testing Error Cases

Always test that your program rejects invalid inputs:

\`\`\`typescript
it("Rejects invalid amount", async () => {
  try {
    await program.methods
      .withdraw(new anchor.BN(999_999_999_999))
      .accounts({ vault: vaultPda, authority: authority.publicKey })
      .rpc();
    assert.fail("Should have thrown");
  } catch (err) {
    const anchorError = anchor.AnchorError.parse(err.logs);
    assert.equal(anchorError.error.errorCode.code, "InsufficientFunds");
  }
});
\`\`\`

## Testing Events

\`\`\`typescript
it("Emits TradeExecuted event", async () => {
  const listener = program.addEventListener(
    "TradeExecuted",
    (event) => {
      assert.equal(event.amountIn.toNumber(), 1000);
      assert.equal(event.amountOut.toNumber(), 950);
    }
  );

  await program.methods
    .executeTrade(new anchor.BN(1000))
    .accounts({ /* ... */ })
    .rpc();

  // Give event time to propagate
  await new Promise((resolve) => setTimeout(resolve, 1000));
  program.removeEventListener(listener);
});
\`\`\`

## Test Organization

For larger programs, organize tests by feature:

\`\`\`
tests/
├── setup.ts        # Shared setup (deploy, airdrop, PDA derivation)
├── initialize.ts   # Initialization tests
├── deposit.ts      # Deposit flow tests
├── withdraw.ts     # Withdrawal tests
└── admin.ts        # Admin function tests
\`\`\`

Each file imports shared context from \`setup.ts\` and focuses on one instruction or feature.`,
              },

              // Lesson 5.3 — Deployment (content)
              {
                title: "Deployment",
                description: "Deploy your Anchor program to devnet and mainnet",
                type: "content",
                order: 2,
                xpReward: 25,
                duration: "20 min",
                content: `# Deployment

Deploying an Anchor program involves building the BPF bytecode, uploading it to the Solana cluster, and managing program upgrades. This lesson walks through the full deployment workflow.

## Pre-Deployment Checklist

Before deploying, ensure:

1. **All tests pass**: \`anchor test\`
2. **Build is clean**: \`anchor build\`
3. **Program IDs match**: The \`declare_id!\` in your Rust code matches the address in \`Anchor.toml\`
4. **Wallet has funds**: The deployer wallet needs SOL for rent and transaction fees

## Generating a Program Keypair

Each program has a unique keypair. Generate one:

\`\`\`bash
solana-keygen new -o target/deploy/my_program-keypair.json
\`\`\`

Get the public key:

\`\`\`bash
solana address -k target/deploy/my_program-keypair.json
# Outputs: <PROGRAM_ID>
\`\`\`

Update \`declare_id!\` in \`lib.rs\` and the program ID in \`Anchor.toml\` to match this address.

## Deploy to Devnet

\`\`\`bash
# Configure for devnet
solana config set --url devnet

# Ensure your wallet has SOL
solana airdrop 5

# Build and deploy
anchor build
anchor deploy --provider.cluster devnet
\`\`\`

The deploy command uploads the \`.so\` file and creates the program account on-chain. The output shows:

\`\`\`
Deploying program "my_program"...
Program path: target/deploy/my_program.so
Program Id: <PROGRAM_ID>
Deploy success
\`\`\`

## Deploy Cost

Program deployment cost depends on the binary size. The program account must be rent-exempt, which requires:

\`\`\`
rent = binary_size * 2 * rent_rate_per_byte_year * 2_years
\`\`\`

A typical Anchor program (100-300KB) costs 1-5 SOL to deploy on mainnet. On devnet, use airdrops.

## Program Upgrades

Anchor programs are upgradeable by default. The deployer wallet is the **upgrade authority**:

\`\`\`bash
# After making changes
anchor build
anchor upgrade target/deploy/my_program.so --program-id <PROGRAM_ID>
\`\`\`

## Transferring Upgrade Authority

For production, transfer upgrade authority to a multisig:

\`\`\`bash
solana program set-upgrade-authority <PROGRAM_ID> \\
  --new-upgrade-authority <MULTISIG_ADDRESS>
\`\`\`

To make a program **immutable** (no further upgrades):

\`\`\`bash
solana program set-upgrade-authority <PROGRAM_ID> --final
\`\`\`

This is irreversible. Only do this when the program is fully audited and battle-tested.

## Verifiable Builds

For trust and transparency, use verifiable builds:

\`\`\`bash
anchor build --verifiable
\`\`\`

This builds inside a Docker container with a deterministic environment, so anyone can reproduce the exact same binary. You can then publish the build hash:

\`\`\`bash
anchor verify <PROGRAM_ID>
\`\`\`

## Deployment Environments

| Environment | Use Case | Cost |
|-------------|----------|------|
| Localnet | Development | Free |
| Devnet | Testing, demos | Free (airdrops) |
| Mainnet | Production | Real SOL |

Always deploy to devnet first and run a full test suite before touching mainnet.

## Common Deployment Issues

1. **Insufficient funds**: Ensure your wallet has enough SOL for rent.
2. **Program ID mismatch**: \`declare_id!\` must match the keypair.
3. **Binary too large**: Solana has a 10MB limit for program binaries. Optimize with \`solana-program\` features.
4. **Upgrade authority mismatch**: Only the current authority can upgrade.`,
              },

              // Lesson 5.4 — IDL Publishing (content)
              {
                title: "IDL Publishing",
                description:
                  "Publish your IDL on-chain for discoverability and client generation",
                type: "content",
                order: 3,
                xpReward: 20,
                duration: "15 min",
                content: `# IDL Publishing

Publishing your IDL on-chain allows anyone to discover your program's interface, decode transactions, and build clients without needing your source code. Block explorers, wallets, and developer tools all benefit from on-chain IDLs.

## Publishing the IDL

After deploying your program, publish the IDL:

\`\`\`bash
# Initial publish
anchor idl init <PROGRAM_ID> --filepath target/idl/my_program.json

# After program upgrades
anchor idl upgrade <PROGRAM_ID> --filepath target/idl/my_program.json
\`\`\`

The IDL is stored in a PDA derived from the program ID. The upgrade authority of the program controls the IDL account.

## How On-Chain IDLs Work

The IDL is stored as a compressed JSON blob in a PDA account:

\`\`\`
IDL Account PDA = findProgramAddress(["anchor:idl"], programId)
\`\`\`

The account stores:
- The authority (who can update it)
- The compressed IDL data (gzipped JSON)

## Fetching an On-Chain IDL

Anyone can fetch and decode a published IDL:

\`\`\`typescript
import { Program } from "@coral-xyz/anchor";

// Fetch IDL from on-chain
const idl = await Program.fetchIdl(programId, provider);

if (idl) {
  const program = new Program(idl, provider);
  // Now you can interact with the program
  const accounts = await program.account.counter.all();
}
\`\`\`

## IDL Authority Management

The IDL authority defaults to the deployer. Transfer it to a multisig for production:

\`\`\`bash
anchor idl set-authority <PROGRAM_ID> --new-authority <NEW_AUTHORITY>
\`\`\`

## Explorer Integration

Once your IDL is published, explorers can:
- **Decode instructions**: Show human-readable instruction names and arguments instead of raw hex.
- **Parse account data**: Display account fields with their types and values.
- **Generate documentation**: Auto-generate API docs from the IDL.

For example, on Solana Explorer, transactions to your program will show "initialize" instead of "Instruction #0" and display decoded arguments.

## TypeScript Client Generation

The IDL also enables automatic client generation:

\`\`\`typescript
// With a local IDL file
import idl from "../target/idl/my_program.json";
import { MyProgram } from "../target/types/my_program";

const program = new Program<MyProgram>(idl as any, provider);
\`\`\`

The generated TypeScript types provide full autocomplete and type checking for:
- Instruction methods (\`program.methods.initialize()\`)
- Account fetching (\`program.account.counter.fetch()\`)
- Event parsing (\`program.addEventListener()\`)
- Custom types and enums

## Best Practices

1. **Always publish after deploy**: Make your program discoverable.
2. **Keep IDL in sync**: Publish after every upgrade.
3. **Version your IDL**: Use the \`version\` field in the IDL to track changes.
4. **Transfer authority for production**: Use multisig for mainnet IDL management.
5. **Include in CI/CD**: Automate IDL publishing as part of your deployment pipeline.`,
              },

              // Lesson 5.5 — Challenge: Write Bankrun Tests (challenge)
              {
                title: "Write Bankrun Tests",
                description:
                  "Write comprehensive tests for a counter program using Bankrun",
                type: "challenge",
                order: 4,
                xpReward: 60,
                duration: "25 min",
                content: `# Challenge: Write Bankrun Tests

Write a complete test suite for a counter program using Bankrun. The counter has \`initialize\`, \`increment\`, and \`reset\` instructions. Your tests should cover happy paths and error cases.

## The Program Interface

\`\`\`rust
// Instructions:
// initialize() -> creates counter PDA, sets count=0
// increment() -> count += 1, only authority
// reset() -> count = 0, only authority

// Account:
// Counter { count: u64, authority: Pubkey, bump: u8 }
// PDA seeds: [b"counter", authority.key()]
\`\`\`

## Requirements

1. Test that \`initialize\` creates a counter with count=0.
2. Test that \`increment\` increases count by 1.
3. Test that calling \`increment\` 3 times results in count=3.
4. Test that a non-authority signer cannot call \`increment\`.
5. Test that \`reset\` sets count back to 0.`,
                challenge: {
                  create: {
                    prompt:
                      "Write Bankrun tests for a counter program with initialize, increment, and reset instructions. Cover happy paths and test that non-authority users are rejected.",
                    starterCode: `import { startAnchor } from "solana-bankrun";
import { BankrunProvider } from "anchor-bankrun";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";

describe("counter", () => {
  let provider: BankrunProvider;
  let program: Program;
  let counterPda: PublicKey;

  beforeAll(async () => {
    // TODO: Start Bankrun with startAnchor
    // TODO: Create BankrunProvider
    // TODO: Load the program
    // TODO: Derive the counter PDA
  });

  it("initializes the counter with count = 0", async () => {
    // TODO: Call initialize
    // TODO: Fetch the counter account
    // TODO: Assert count == 0 and authority matches
  });

  it("increments the counter", async () => {
    // TODO: Call increment
    // TODO: Fetch and assert count == 1
  });

  it("increments multiple times", async () => {
    // TODO: Call increment twice more
    // TODO: Fetch and assert count == 3
  });

  it("rejects non-authority increment", async () => {
    // TODO: Create a new keypair (attacker)
    // TODO: Try to call increment with attacker as signer
    // TODO: Expect the transaction to fail
  });

  it("resets the counter to 0", async () => {
    // TODO: Call reset
    // TODO: Fetch and assert count == 0
  });
});`,
                    language: "typescript",
                    hints: [
                      "Use PublicKey.findProgramAddressSync([Buffer.from('counter'), authority.toBuffer()], programId) to derive the PDA.",
                      "For error testing, wrap the call in try/catch and assert that an error was thrown.",
                      "After each instruction call, fetch the account with program.account.counter.fetch(counterPda).",
                    ],
                    solution: `import { startAnchor } from "solana-bankrun";
import { BankrunProvider } from "anchor-bankrun";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";

describe("counter", () => {
  let provider: BankrunProvider;
  let program: Program;
  let counterPda: PublicKey;

  beforeAll(async () => {
    const context = await startAnchor(".", [], []);
    provider = new BankrunProvider(context);
    program = new Program(
      require("../target/idl/counter.json"),
      provider
    );

    [counterPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("counter"), provider.wallet.publicKey.toBuffer()],
      program.programId
    );
  });

  it("initializes the counter with count = 0", async () => {
    await program.methods
      .initialize()
      .accounts({
        counter: counterPda,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const account = await program.account.counter.fetch(counterPda);
    expect(account.count.toNumber()).toBe(0);
    expect(account.authority.toBase58()).toBe(
      provider.wallet.publicKey.toBase58()
    );
  });

  it("increments the counter", async () => {
    await program.methods
      .increment()
      .accounts({
        counter: counterPda,
        authority: provider.wallet.publicKey,
      })
      .rpc();

    const account = await program.account.counter.fetch(counterPda);
    expect(account.count.toNumber()).toBe(1);
  });

  it("increments multiple times", async () => {
    await program.methods
      .increment()
      .accounts({
        counter: counterPda,
        authority: provider.wallet.publicKey,
      })
      .rpc();

    await program.methods
      .increment()
      .accounts({
        counter: counterPda,
        authority: provider.wallet.publicKey,
      })
      .rpc();

    const account = await program.account.counter.fetch(counterPda);
    expect(account.count.toNumber()).toBe(3);
  });

  it("rejects non-authority increment", async () => {
    const attacker = Keypair.generate();

    try {
      await program.methods
        .increment()
        .accounts({
          counter: counterPda,
          authority: attacker.publicKey,
        })
        .signers([attacker])
        .rpc();

      throw new Error("Expected error");
    } catch (err) {
      expect(err.message).not.toBe("Expected error");
    }
  });

  it("resets the counter to 0", async () => {
    await program.methods
      .reset()
      .accounts({
        counter: counterPda,
        authority: provider.wallet.publicKey,
      })
      .rpc();

    const account = await program.account.counter.fetch(counterPda);
    expect(account.count.toNumber()).toBe(0);
  });
});`,
                    testCases: {
                      create: [
                        {
                          name: "All 5 test cases are defined and structured",
                          input: "test suite structure",
                          expectedOutput:
                            "5 it() blocks covering init, increment, multi-increment, auth check, reset",
                          order: 0,
                        },
                        {
                          name: "PDA is correctly derived in beforeAll",
                          input: "beforeAll setup",
                          expectedOutput:
                            "counterPda derived with seeds [b'counter', authority.key()]",
                          order: 1,
                        },
                        {
                          name: "Error case properly catches and validates rejection",
                          input: "non-authority increment test",
                          expectedOutput:
                            "try/catch block that asserts error is thrown for unauthorized signer",
                          order: 2,
                        },
                      ],
                    },
                  },
                },
              },

              // Lesson 5.6 — Challenge: Deployment Script (challenge)
              {
                title: "Deployment Script",
                description:
                  "Write an automated deployment and verification script",
                type: "challenge",
                order: 5,
                xpReward: 60,
                duration: "25 min",
                content: `# Challenge: Deployment Script

Write a TypeScript deployment script that automates building, deploying, and verifying an Anchor program. The script should handle both devnet and mainnet deployments with safety checks.

## Requirements

1. Accept a \`--cluster\` argument (\`devnet\` or \`mainnet\`).
2. Run \`anchor build\` and verify it succeeds.
3. Check the deployer wallet balance is sufficient (at least 5 SOL for devnet, 10 SOL for mainnet).
4. Deploy using \`anchor deploy\`.
5. Verify deployment by fetching the program account.
6. Publish the IDL.
7. Log all steps with timestamps.`,
                challenge: {
                  create: {
                    prompt:
                      "Complete the deployment script that automates anchor build, balance check, deploy, program verification, and IDL publishing. Include proper error handling and logging.",
                    starterCode: `import { execSync } from "child_process";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

interface DeployConfig {
  cluster: "devnet" | "mainnet";
  programId: string;
  walletPath: string;
}

function log(message: string) {
  console.log(\`[\${new Date().toISOString()}] \${message}\`);
}

async function deploy(config: DeployConfig) {
  const { cluster, programId, walletPath } = config;

  // TODO: Step 1 — Build the program
  // Run "anchor build" and check exit code

  // TODO: Step 2 — Check wallet balance
  // Connect to cluster RPC, fetch balance
  // Require >= 5 SOL (devnet) or >= 10 SOL (mainnet)

  // TODO: Step 3 — Deploy
  // Run "anchor deploy --provider.cluster <cluster>"

  // TODO: Step 4 — Verify deployment
  // Fetch the program account and check it exists + is executable

  // TODO: Step 5 — Publish IDL
  // Run "anchor idl init" or "anchor idl upgrade"

  log("Deployment complete!");
}

// Parse args and run
// TODO: Parse --cluster from process.argv
// TODO: Call deploy with config`,
                    language: "typescript",
                    hints: [
                      "Use execSync('anchor build', { stdio: 'inherit' }) to run shell commands and inherit output.",
                      "Get the RPC URL with cluster === 'devnet' ? 'https://api.devnet.solana.com' : 'https://api.mainnet-beta.solana.com'.",
                      "Check program existence with connection.getAccountInfo(new PublicKey(programId)) and verify accountInfo.executable === true.",
                    ],
                    solution: `import { execSync } from "child_process";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

interface DeployConfig {
  cluster: "devnet" | "mainnet";
  programId: string;
  walletPath: string;
}

function log(message: string) {
  console.log(\`[\${new Date().toISOString()}] \${message}\`);
}

async function deploy(config: DeployConfig) {
  const { cluster, programId, walletPath } = config;
  const rpcUrl = cluster === "devnet"
    ? "https://api.devnet.solana.com"
    : "https://api.mainnet-beta.solana.com";
  const minBalance = cluster === "devnet" ? 5 : 10;

  // Step 1 — Build
  log("Building program...");
  try {
    execSync("anchor build", { stdio: "inherit" });
    log("Build successful.");
  } catch {
    throw new Error("Build failed. Fix errors before deploying.");
  }

  // Step 2 — Check balance
  log(\`Checking wallet balance on \${cluster}...\`);
  const connection = new Connection(rpcUrl, "confirmed");
  const walletKey = JSON.parse(
    require("fs").readFileSync(walletPath, "utf8")
  );
  const walletPubkey = require("@solana/web3.js").Keypair.fromSecretKey(
    Uint8Array.from(walletKey)
  ).publicKey;
  const balance = await connection.getBalance(walletPubkey);
  const balanceSol = balance / LAMPORTS_PER_SOL;
  log(\`Wallet balance: \${balanceSol} SOL\`);

  if (balanceSol < minBalance) {
    throw new Error(
      \`Insufficient balance: \${balanceSol} SOL. Need at least \${minBalance} SOL.\`
    );
  }

  // Step 3 — Deploy
  log(\`Deploying to \${cluster}...\`);
  try {
    execSync(\`anchor deploy --provider.cluster \${cluster}\`, {
      stdio: "inherit",
    });
    log("Deploy transaction sent.");
  } catch {
    throw new Error("Deployment failed.");
  }

  // Step 4 — Verify deployment
  log("Verifying deployment...");
  const programInfo = await connection.getAccountInfo(
    new PublicKey(programId)
  );
  if (!programInfo) {
    throw new Error("Program account not found after deploy.");
  }
  if (!programInfo.executable) {
    throw new Error("Program account is not executable.");
  }
  log(\`Program \${programId} verified: executable=true, size=\${programInfo.data.length} bytes\`);

  // Step 5 — Publish IDL
  log("Publishing IDL...");
  try {
    execSync(
      \`anchor idl init \${programId} --filepath target/idl/*.json --provider.cluster \${cluster}\`,
      { stdio: "inherit" }
    );
    log("IDL published.");
  } catch {
    log("IDL init failed, attempting upgrade...");
    execSync(
      \`anchor idl upgrade \${programId} --filepath target/idl/*.json --provider.cluster \${cluster}\`,
      { stdio: "inherit" }
    );
    log("IDL upgraded.");
  }

  log("Deployment complete!");
}

// Parse args
const args = process.argv.slice(2);
const clusterIdx = args.indexOf("--cluster");
const cluster = clusterIdx !== -1 ? args[clusterIdx + 1] : "devnet";

if (cluster !== "devnet" && cluster !== "mainnet") {
  console.error("Usage: ts-node deploy.ts --cluster <devnet|mainnet>");
  process.exit(1);
}

deploy({
  cluster: cluster as "devnet" | "mainnet",
  programId: "YOUR_PROGRAM_ID_HERE",
  walletPath: "~/.config/solana/id.json",
}).catch((err) => {
  console.error("Deployment failed:", err.message);
  process.exit(1);
});`,
                    testCases: {
                      create: [
                        {
                          name: "Script accepts --cluster argument and validates it",
                          input: "--cluster devnet",
                          expectedOutput:
                            "cluster = 'devnet', proceeds with deployment",
                          order: 0,
                        },
                        {
                          name: "Balance check rejects insufficient funds",
                          input: "wallet with 0.5 SOL on mainnet",
                          expectedOutput: "Error: Insufficient balance",
                          order: 1,
                        },
                        {
                          name: "Verification confirms program is executable",
                          input: "after successful deploy",
                          expectedOutput:
                            "programInfo.executable === true logged",
                          order: 2,
                        },
                      ],
                    },
                  },
                },
              },
            ],
          },
        },
      ],
    },
  };
}
