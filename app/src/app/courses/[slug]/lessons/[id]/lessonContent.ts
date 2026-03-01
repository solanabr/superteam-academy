import { TestCase } from "./page";

export interface LessonContentData {
  content: string;
  code?: string;
  solution?: string;
  testCases?: TestCase[];
}

// Comprehensive lesson content for all courses
export const LESSON_DATABASE: Record<string, Record<string, LessonContentData>> = {
  // ANCHOR FUNDAMENTALS COURSE
  "anchor-fundamentals": {
    "1": {
      content: `# Introduction to Anchor

Welcome to **Anchor Fundamentals**! This comprehensive course will transform you from a blockchain beginner into a confident Solana program developer.

## What is Anchor?

Anchor is a powerful framework for Solana program development that dramatically simplifies the development process. Think of it as the Rails or Django of Solana - it provides:

### Key Benefits

**🛡️ Safety First**
- Automatic account validation prevents common security vulnerabilities
- Type-safe cross-program invocations (CPI)
- Built-in checks for proper account ownership and signers

**⚡ Developer Experience**
- IDL (Interface Definition Language) generation for easy frontend integration
- Simplified account initialization and management
- Clean, declarative Rust macros that reduce boilerplate code

**🚀 Production Ready**
- Battle-tested by top Solana protocols (Jupiter, Marinade, Drift)
- Optimized compute unit usage
- Comprehensive testing utilities

## Course Overview

This course contains **12 lessons** across 4 carefully crafted modules:

### Module 1: Getting Started
Learn the fundamentals of Anchor development, from setup to your first deployed program.

### Module 2: PDAs and Accounts
Master Program Derived Addresses (PDAs) - the backbone of Solana's account model.

### Module 3: Instructions and CPI
Build complex interactions between programs using Cross-Program Invocations.

### Module 4: Advanced Topics
Dive into events, custom errors, and production best practices.

## Prerequisites

- Basic Rust syntax knowledge
- Solana CLI installed on your machine
- Node.js for frontend development (optional but recommended)

## What You'll Build

By the end of this course, you'll have built:
1. A token vault program
2. A decentralized voting system
3. A staking mechanism
4. Cross-program integrations

Ready to become a Solana developer? Let's dive in!`,
    },
    "2": {
      content: `# Setting Up Your Development Environment

Before we write any code, let's ensure your development environment is properly configured. This is a one-time setup that will serve you throughout your Solana journey.

## Step 1: Install Rust

Rust is the primary language for Solana program development. Anchor builds on top of Rust to provide its abstractions.

**macOS/Linux:**
\`\`\`bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
\`\`\`

**Windows:**
Download and run [rustup-init.exe](https://win.rustup.rs)

Verify installation:
\`\`\`bash
rustc --version
# Should show something like: rustc 1.75.0
\`\`\`

## Step 2: Install Solana CLI

The Solana CLI is your interface to the Solana blockchain.

\`\`\`bash
sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"
\`\`\`

Add to your PATH:
\`\`\`bash
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
\`\`\`

Configure for devnet:
\`\`\`bash
solana config set --url devnet
solana-keygen new --outfile ~/.config/solana/id.json
solana airdrop 2  # Get 2 SOL for testing
\`\`\`

## Step 3: Install Anchor

Anchor Version Manager (AVM) makes it easy to manage Anchor versions.

\`\`\`bash
cargo install --git https://github.com/coral-xyz/anchor avm
avm install latest
avm use latest
\`\`\`

**Verify:**
\`\`\`bash
anchor --version
# Output: anchor-cli 0.29.0
\`\`\`

## Step 4: Node.js and Yarn

For frontend integration, you'll need:

\`\`\`bash
# Install Node.js 18+ from nodejs.org
npm install -g yarn
\`\`\`

## Creating Your First Project

Let's create a test project to verify everything works:

\`\`\`bash
anchor init hello-world
cd hello-world
anchor build
anchor test
\`\`\`

If you see passing tests, you're ready to go!`,
    },
    "3": {
      content: `# Your First Program: Building a Counter

It's time to write your first Anchor program! We'll create a simple counter that demonstrates the core concepts of Solana program development.

## The Challenge

Build a counter program with:
1. **Initialize** function - Sets the counter to 0
2. **Increment** function - Adds 1 to the current count
3. **Get** function - Returns the current count value

## Key Concepts

### Accounts
On Solana, data lives in accounts. Unlike traditional databases, accounts:
- Are owned by programs
- Have a fixed size determined at creation
- Must be rent-exempt (hold enough SOL to exist)

### Instructions
These are the functions users call to interact with your program. Each instruction:
- Receives a Context with accounts and metadata
- Can modify account data
- Must complete within compute unit limits

### Context
The Context provides access to:
- Accounts passed by the user
- The instruction signer
- System programs for account creation

## The Code Editor

Use the editor on the right to complete this challenge. Your task:

1. In \`initialize\`, set \`ctx.accounts.counter.count = 0\`
2. In \`increment\`, use \`ctx.accounts.counter.count += 1\`

**Hints:**
- Access accounts through \`ctx.accounts\`
- The counter account is mutable (marked with #[account(mut)])
- Don't forget to end statements with semicolons!

Good luck - you've got this! 🚀`,
      code: `use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod counter {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        // TODO: Initialize counter.count to 0
        
        Ok(())
    }

    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        // TODO: Increment counter.count by 1
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + 8)]
    pub counter: Account<'info, Counter>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(mut)]
    pub counter: Account<'info, Counter>,
}

#[account]
pub struct Counter {
    pub count: u64,
}`,
      solution: `use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod counter {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        ctx.accounts.counter.count = 0;
        Ok(())
    }

    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        ctx.accounts.counter.count += 1;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + 8)]
    pub counter: Account<'info, Counter>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(mut)]
    pub counter: Account<'info, Counter>,
}

#[account]
pub struct Counter {
    pub count: u64,
}`,
      testCases: [
        {
          id: "1",
          name: "Initialize Counter",
          description: "Sets counter to 0",
          check: (code: string) => code.includes("ctx.accounts.counter.count = 0"),
          errorMessage: "Initialize function should set counter.count to 0",
        },
        {
          id: "2",
          name: "Increment Counter",
          description: "Adds 1 to counter",
          check: (code: string) => 
            code.includes("ctx.accounts.counter.count += 1") || 
            code.includes("count = count + 1"),
          errorMessage: "Increment function should increase counter.count by 1",
        },
        {
          id: "3",
          name: "Proper Context Access",
          description: "Uses ctx.accounts.counter",
          check: (code: string) => code.includes("ctx.accounts.counter"),
          errorMessage: "Should use ctx.accounts.counter to access the counter account",
        },
      ],
    },
    "4": {
      content: `# Understanding PDAs (Program Derived Addresses)

Program Derived Addresses (PDAs) are one of Solana's most powerful features. They allow programs to own accounts and sign for instructions, enabling sophisticated smart contract architectures.

## What are PDAs?

PDAs are special accounts that:
- Are derived deterministically from seeds
- Are owned by the program that created them
- Can sign transactions on behalf of the program
- Don't have a private key (can't be controlled by external users)

## Why Use PDAs?

**Data Organization**: Store user-specific data in predictable locations
**Security**: Only your program can modify PDA-owned accounts
**Composability**: Other programs can easily interact with your PDAs

## Deriving PDAs

PDAs are found using the \`find_program_address\` function:

\`\`\`rust
let (pda, bump_seed) = Pubkey::find_program_address(
    &[b"user-stats", user.key().as_ref()],
    program_id
);
\`\`\`

The bump seed ensures the address is valid (off the Ed25519 curve).

## Real-World Example

In a lending protocol, you might have:
- PDA for each user's collateral account
- PDA for the protocol's fee vault
- PDA for price oracle data

## Best Practices

1. **Use descriptive seeds** - Makes debugging easier
2. **Include user public key** - Prevents collisions
3. **Document your PDA structure** - Essential for integrations
4. **Validate PDAs in every instruction** - Security critical

Next, we'll implement PDAs in our counter program to support multiple users!`,
    },
    "5": {
      content: `# Account Validation Deep Dive

Account validation is the foundation of Solana security. Anchor's constraints system makes it easy to implement proper validation, but understanding the underlying principles is crucial.

## The Account Model

On Solana, accounts can be:
- **Owned by System Program**: Regular wallets
- **Owned by Your Program**: Data accounts created by your program
- **Owned by Other Programs**: SPL tokens, NFTs, etc.

## Common Validation Patterns

### 1. Ownership Checks

\`\`\`rust
#[account(
    constraint = token_account.owner == token_program.key()
)]
pub token_account: Account<'info, TokenAccount>,
\`\`\`

### 2. Signer Verification

\`\`\`rust
#[account(signer)]
pub authority: AccountInfo<'info>,
\`\`\`

### 3. State Constraints

\`\`\`rust
#[account(
    constraint = vault.amount >= amount,
    constraint = vault.mint == expected_mint
)]
pub vault: Account<'info, TokenAccount>,
\`\`\`

## Anchor Constraint Macros

Anchor provides powerful macros for validation:

\`\`\`rust
#[derive(Accounts)]
pub struct Transfer<'info> {
    #[account(mut, has_one = authority)]
    pub from: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub to: Account<'info, TokenAccount>,
    
    pub authority: Signer<'info>,
}
\`\`\`

## Security Checklist

- ✅ Always verify account ownership
- ✅ Check signers for privileged operations
- ✅ Validate account state before modifications
- ✅ Use \`has_one\` for one-to-one relationships
- ✅ Verify PDAs with proper seeds

Understanding these patterns will protect your programs from common exploits!`,
    },
    "6": {
      content: `# PDA Challenge: Multi-User Counter

Now it's time to apply what you've learned! Extend the counter program to support multiple users, each with their own counter stored in a PDA.

## The Challenge

Modify the counter program to:
1. Create a PDA for each user using their public key as a seed
2. Each user can only increment their own counter
3. Add a \`get_count\` function to read any user's count

## Requirements

**InitializeUser Counter:**
- Derive PDA using seeds: \`[b"counter", user.key().as_ref()]\`
- Store the counter in this PDA

**Increment:**
- Only the PDA owner can increment
- Must verify the signer matches the PDA owner

**GetCount:**
- Anyone can read any user's count
- Takes a user public key as parameter

## Hints

1. Use \`seeds = [b"counter", user.key().as_ref()]\` in your account validation
2. Access the bump seed with \`bump = bump\`
3. For GetCount, use \`&[b"counter", user.as_ref()]\` with the passed public key

This pattern is used in countless Solana programs - master it and you're on your way to becoming a pro!`,
      code: `use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod multi_counter {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        // TODO: Set the user's counter to 0
        // Hint: Use ctx.accounts.user_counter
        
        Ok(())
    }

    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        // TODO: Increment the user's counter by 1
        // Hint: Access through ctx.accounts.user_counter
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 8,
        // TODO: Add seeds constraint
        // seeds = [b"counter", user.key().as_ref()],
        // bump
    )]
    pub user_counter: Account<'info, UserCounter>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(
        mut,
        // TODO: Add seeds constraint with has_one for security
        // seeds = [b"counter", user.key().as_ref()],
        // bump,
        // has_one = user
    )]
    pub user_counter: Account<'info, UserCounter>,
    
    pub user: Signer<'info>,
}

#[account]
pub struct UserCounter {
    pub count: u64,
    pub user: Pubkey, // Track who owns this counter
}`,
      solution: `use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod multi_counter {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        ctx.accounts.user_counter.count = 0;
        ctx.accounts.user_counter.user = ctx.accounts.user.key();
        Ok(())
    }

    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        ctx.accounts.user_counter.count += 1;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 8 + 32,
        seeds = [b"counter", user.key().as_ref()],
        bump
    )]
    pub user_counter: Account<'info, UserCounter>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(
        mut,
        seeds = [b"counter", user.key().as_ref()],
        bump,
        has_one = user
    )]
    pub user_counter: Account<'info, UserCounter>,
    
    pub user: Signer<'info>,
}

#[account]
pub struct UserCounter {
    pub count: u64,
    pub user: Pubkey,
}`,
      testCases: [
        {
          id: "1",
          name: "Initialize Counter",
          description: "Sets count to 0",
          check: (code: string) => code.includes("count = 0"),
          errorMessage: "Should initialize count to 0",
        },
        {
          id: "2",
          name: "Store User Key",
          description: "Saves user pubkey",
          check: (code: string) => code.includes("user = ctx.accounts.user.key()"),
          errorMessage: "Should store the user's public key",
        },
        {
          id: "3",
          name: "PDA Seeds",
          description: "Uses correct seeds",
          check: (code: string) => code.includes('seeds = [b"counter"'),
          errorMessage: "Must use correct PDA seeds",
        },
        {
          id: "4",
          name: "Security Check",
          description: "Uses has_one constraint",
          check: (code: string) => code.includes("has_one = user"),
          errorMessage: "Must verify user ownership with has_one",
        },
      ],
    },
  },

  // TOKEN-2022 MASTERY COURSE
  "token-2022-mastery": {
    "1": {
      content: `# Introduction to Token-2022

Welcome to Token-2022 Mastery! This course explores the next generation of Solana's token standard, packed with powerful new extensions.

## What is Token-2022?

Token-2022 is an evolution of the original SPL Token standard, introducing:
- **Transfer Hooks**: Execute custom logic on every transfer
- **Metadata Pointers**: On-chain metadata references
- **Non-Transferable Tokens**: Soulbound tokens for credentials
- **Confidential Transfers**: Privacy-preserving transactions
- **Interest Bearing Tokens**: Automatic yield accrual

## Why Upgrade?

**More Features**: Native support for use cases that previously required complex workarounds
**Better Composability**: Extensions work together seamlessly
**Future-Proof**: Foundation for upcoming Solana features
**Backward Compatible**: Existing tools work with Token-2022

## Token Program vs Token-2022

| Feature | Token Program | Token-2022 |
|---------|--------------|------------|
| Basic transfers | ✅ | ✅ |
| Transfer hooks | ❌ | ✅ |
| Metadata pointer | ❌ | ✅ |
| Non-transferable | ❌ | ✅ |
| Confidential txs | ❌ | ✅ |

## Prerequisites

- Anchor Fundamentals completion
- Understanding of SPL tokens
- Familiarity with account validation

## What You'll Build

1. Soulbound achievement tokens
2. Transfer-restricted governance tokens
3. Metadata-rich NFT collections
4. Custom transfer hook implementations

Let's dive into the future of Solana tokens!`,
    },
    "2": {
      content: `# Creating Your First Token-2022 Mint

Let's create a basic Token-2022 mint and understand the fundamental differences from the original token program.

## Key Differences

Token-2022 uses a different program ID:
- **Token Program**: \`TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA\`
- **Token-2022**: \`TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb\`

## Creating a Mint

\`\`\`rust
use anchor_spl::token_2022::{self, Token2022};

let cpi_accounts = CreateMint {
    mint: ctx.accounts.mint.to_account_info(),
    payer: ctx.accounts.payer.to_account_info(),
    system_program: ctx.accounts.system_program.to_account_info(),
    token_program: ctx.accounts.token_program.to_account_info(),
};

token_2022::create_mint(
    CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts),
    9, // decimals
    ctx.accounts.mint_authority.key(),
    Some(ctx.accounts.freeze_authority.key()),
)?;
\`\`\`

## Adding Extensions

Extensions are added during mint creation:

\`\`\`rust
use anchor_spl::token_2022::extension::{
    metadata_pointer::instruction::initialize_metadata_pointer,
    transfer_hook::instruction::initialize_transfer_hook,
};
\`\`\`

## Best Practices

1. **Always specify extensions upfront** - Can't be changed later
2. **Plan for metadata** - Even if you don't use it immediately
3. **Consider hooks carefully** - Affect every transfer
4. **Test on devnet** - Extensions have different compute costs

## Migration from Token Program

Most operations are identical:
- Minting tokens: Same CPI calls
- Transferring: Same account structure
- Account creation: Slightly different (extensions add space)

Ready to add your first extension?`,
    },
  },

  // Add more courses as needed...
  "zk-compression": {
    "1": {
      content: `# What is ZK Compression?

Welcome to the cutting edge of Solana scaling! Zero-Knowledge (ZK) Compression allows you to store massive amounts of data on-chain at a fraction of the cost.

## The Problem

Traditional Solana storage:
- 128 bytes of account data = ~0.002 SOL rent
- 1 million NFTs = ~2000 SOL in rent
- Limits scale of applications

## The Solution: ZK Compression

Using Light Protocol, we can:
- Store data in **state trees** (compressed format)
- Verify ownership with **zero-knowledge proofs**
- Pay ~100x less for storage
- Retain full security guarantees

## How It Works

### State Trees
- Merkle trees containing compressed account data
- Only the root hash stored on-chain
- Proofs verify inclusion without revealing data

### Proof Generation
- Off-chain: Generate proof of account ownership
- On-chain: Verify proof, execute instruction
- Result: Same security, fraction of the cost

## Real-World Impact

**Before ZK Compression:**
- 1 million cNFTs: ~$100,000 in rent
- Complex apps: Prohibitively expensive

**After ZK Compression:**
- 1 million cNFTs: ~$1,000 in rent
- New use cases: Mass adoption possible

## Use Cases

- **Compressed NFTs**: Million-item collections
- **Gaming**: Player inventories, achievements
- **DeFi**: Order books, liquidity positions
- **Identity**: Credentials, reputation systems

## Prerequisites

- Advanced Anchor knowledge
- Understanding of Merkle trees
- Familiarity with zero-knowledge concepts (helpful but not required)

## What You'll Build

1. Compressed NFT minting platform
2. Gaming inventory system
3. Verifiable credentials protocol
4. High-frequency trading records

Let's revolutionize Solana scaling together!`,
    },
    "2": {
      content: `# Setting Up Light Protocol

Light Protocol is the infrastructure that powers ZK Compression on Solana. Let's get it set up for development.

## Installation

Add Light Protocol dependencies to your Anchor project:

\`\`\`toml
[dependencies]
light-hasher = "0.3.0"
light-merkle-tree-reference = "0.3.0"
light-verifier = "0.3.0"
\`\`\`

## Project Structure

A typical Light Protocol project has:

\`\`\`
project/
├── programs/
│   └── my_program/
│       ├── src/
│       │   ├── lib.rs
│       │   ├── state.rs      # Compressed state definitions
│       │   └── instructions/
│       └── Cargo.toml
├── light-accounts/           # Off-chain account management
│   └── src/
└── tests/
    └── integration_tests.rs
\`\`\`

## Key Concepts

### Merkle Tree Accounts
Store the compressed state tree. Each tree has:
- **Root**: Current state hash
- **Leaf Changelog**: History of changes
- **Depth**: Determines max capacity

### Compressed Accounts
Data stored as leaves in the tree:
- Hashed for privacy
- Proven with Merkle proofs
- Updated by modifying the tree

## Configuration

\`\`\`rust
use light_merkle_tree_reference::MerkleTreeConfig;

let config = MerkleTreeConfig {
    height: 26,           // Supports ~67M leaves
    canopy_depth: 10,     // Recent history cache
    ..Default::default()
};
\`\`\`

## Devnet Testing

Light Protocol provides devnet trees for testing:

\`\`\`bash
# Use official Light Protocol devnet
anchor test --provider.cluster devnet
\`\`\`

## Next Steps

Now that you're set up, we'll create your first compressed account and learn to prove ownership with zero-knowledge proofs!`,
    },
  },
};

// Fallback content generator for missing lessons
export function generateFallbackContent(courseId: string, lessonId: string, lessonTitle: string): string {
  return `# ${lessonTitle}

Welcome to this lesson in the ${courseId} course! 

## Overview

This lesson covers essential concepts in Solana development. You'll learn practical skills that you can apply immediately to build decentralized applications.

## Key Topics

- Understanding the Solana ecosystem
- Building secure and efficient programs
- Best practices for production deployments

## Learning Objectives

By the end of this lesson, you'll be able to:
1. Explain core Solana concepts
2. Implement basic program functionality
3. Test and deploy your code

## Let's Get Started

This course is designed to take you from beginner to expert. Each lesson builds on the previous one, so make sure to complete them in order.

**Pro Tip**: Practice coding along with the examples. The best way to learn is by doing!

Ready to continue? Click "Next Lesson" or "Mark as Complete" to earn your XP!`;
}

// Get lesson content with fallback
export function getLessonContent(courseId: string, lessonId: string, lessonTitle: string = "Lesson"): LessonContentData {
  const courseContent = LESSON_DATABASE[courseId];
  
  if (courseContent && courseContent[lessonId]) {
    return courseContent[lessonId];
  }
  
  // Return fallback content if specific content doesn't exist
  return {
    content: generateFallbackContent(courseId, lessonId, lessonTitle),
  };
}
