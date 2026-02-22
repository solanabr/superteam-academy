import type { Course, CourseCardData } from "@/types/course";

export const TRACKS = [
  {
    id: "solana-core",
    name: "Solana Core",
    slug: "solana-core",
    description: "Core Solana development fundamentals",
    icon: "cpu",
    color: "#9945FF",
  },
  {
    id: "defi",
    name: "DeFi",
    slug: "defi",
    description: "Decentralized finance protocols",
    icon: "banknote",
    color: "#14F195",
  },
  {
    id: "nft",
    name: "NFTs",
    slug: "nft",
    description: "Non-fungible tokens and digital assets",
    icon: "image",
    color: "#ffd23f",
  },
  {
    id: "anchor",
    name: "Anchor",
    slug: "anchor",
    description: "Anchor framework for Solana programs",
    icon: "anchor",
    color: "#00D1FF",
  },
  {
    id: "web3",
    name: "Web3 Integration",
    slug: "web3",
    description: "Integrating Solana into web applications",
    icon: "globe",
    color: "#FF6B6B",
  },
];

export const INSTRUCTORS = [
  {
    id: "i1",
    name: "Ana Rodrigues",
    avatar: "",
    bio: "Solana core contributor and educator. 5+ years in blockchain development.",
    twitter: "@ana_sol",
    github: "anarodrigues",
  },
  {
    id: "i2",
    name: "Carlos Mendes",
    avatar: "",
    bio: "DeFi researcher and Anchor framework expert.",
    twitter: "@carlos_defi",
    github: "carlosmendes",
  },
  {
    id: "i3",
    name: "Lucia Santos",
    avatar: "",
    bio: "NFT developer and digital art pioneer on Solana.",
    twitter: "@lucia_nft",
    github: "luciasantos",
  },
];

export const SAMPLE_COURSES: Course[] = [
  {
    id: "intro-to-solana",
    title: "Introduction to Solana",
    slug: "introduction-to-solana",
    description:
      "Learn the fundamentals of Solana blockchain development from scratch.",
    longDescription:
      "This comprehensive course covers everything you need to know to start building on Solana. From understanding the architecture to writing your first program, you'll gain hands-on experience with the fastest blockchain in the world.",
    thumbnail: "",
    difficulty: "beginner",
    track: TRACKS[0],
    instructor: INSTRUCTORS[0],
    totalLessons: 10,
    totalDuration: 480,
    totalXP: 2500,
    bonusXP: 1250,
    prerequisites: [],
    tags: ["solana", "blockchain", "beginner", "rust"],
    published: true,
    createdAt: "2026-01-15T00:00:00Z",
    updatedAt: "2026-02-01T00:00:00Z",
    modules: [
      {
        id: "m1",
        title: "Getting Started with Solana",
        description:
          "Set up your development environment and understand Solana's architecture.",
        order: 0,
        lessons: [
          {
            id: "l1",
            title: "What is Solana?",
            slug: "what-is-solana",
            type: "content",
            duration: 20,
            order: 0,
            videoUrl: "https://www.youtube.com/embed/1jzROE6EhxM",
            content: `## Welcome to Solana

Solana is a high-performance blockchain designed for mass adoption. It processes thousands of transactions per second at a fraction of a cent — making it ideal for consumer apps, DeFi, NFTs, and more.

### Why Solana?

| Feature | Solana | Ethereum |
|---------|--------|----------|
| Block time | ~400ms | ~12s |
| Tx cost | ~$0.00025 | $1-50+ |
| TPS | 65,000+ | ~15 |
| Consensus | PoS + PoH | PoS |

### Architecture Overview

Solana's speed comes from several innovations:

- **Proof of History (PoH)** — A cryptographic clock that orders transactions *before* consensus, eliminating the need for validators to agree on time
- **Tower BFT** — A PoH-optimized version of PBFT consensus
- **Gulf Stream** — Transaction forwarding without mempools
- **Turbine** — Block propagation protocol inspired by BitTorrent
- **Sealevel** — Parallel smart contract runtime

### The Accounts Model

Unlike Ethereum where contracts own their state, Solana **separates code from data**:

\`\`\`
Programs (code) → stateless, executable
Accounts (data) → store state, owned by programs
\`\`\`

This separation enables Sealevel to run transactions in parallel — if two transactions touch different accounts, they execute simultaneously.

> **Key takeaway:** Solana is fast because it parallelizes everything. Understanding the accounts model is foundational to building on Solana.`,
          },
          {
            id: "l2",
            title: "Setting Up Your Environment",
            slug: "setup-environment",
            type: "content",
            duration: 30,
            order: 1,
            content: `## Development Environment Setup

Before writing any Solana code, you need three tools: **Rust**, the **Solana CLI**, and the **Anchor framework**.

### 1. Install Rust

Rust is the primary language for Solana programs:

\`\`\`bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
rustc --version
\`\`\`

### 2. Install Solana CLI

The Solana CLI lets you interact with the network:

\`\`\`bash
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
solana --version
\`\`\`

Configure for devnet:

\`\`\`bash
solana config set --url devnet
solana-keygen new   # Creates ~/.config/solana/id.json
solana airdrop 2    # Get free devnet SOL
\`\`\`

### 3. Install Anchor

Anchor is a framework that makes Solana development much easier:

\`\`\`bash
cargo install --git https://github.com/coral-xyz/anchor avm --force
avm install latest
avm use latest
anchor --version
\`\`\`

### Create Your First Project

\`\`\`bash
anchor init my-first-project
cd my-first-project
\`\`\`

This creates a project with the following structure:

\`\`\`
my-first-project/
├── Anchor.toml          # Project config
├── Cargo.toml           # Rust workspace
├── programs/            # Your Solana programs
│   └── my-first-project/
│       └── src/
│           └── lib.rs   # Program code
├── tests/               # TypeScript tests
│   └── my-first-project.ts
└── app/                 # Frontend (optional)
\`\`\`

> **Verify everything works** by running \`anchor build\`. If it compiles without errors, you're ready to go!`,
          },
          {
            id: "l3",
            title: "Understanding Accounts",
            slug: "understanding-accounts",
            type: "content",
            duration: 25,
            order: 2,
            videoUrl: "https://www.youtube.com/embed/pKzGSMVRsKE",
            content: `## The Solana Accounts Model

Everything in Solana is an account. Programs, tokens, NFTs, user wallets — they're all accounts with different properties.

### Account Structure

Every account on Solana has these fields:

\`\`\`rust
pub struct Account {
    pub lamports: u64,      // Balance (1 SOL = 1B lamports)
    pub data: Vec<u8>,      // Arbitrary data storage
    pub owner: Pubkey,      // Program that controls this account
    pub executable: bool,   // Is this account a program?
    pub rent_epoch: u64,    // Rent tracking
}
\`\`\`

### Three Rules of Account Ownership

1. **Only the owner program can modify an account's data**
2. **Only the owner program can debit lamports** from an account
3. **Anyone can credit lamports** to any account

### Rent

Accounts must hold a minimum SOL balance to exist on-chain. This is called being **rent-exempt**:

\`\`\`typescript
// Minimum balance for a 100-byte account
const rent = await connection.getMinimumBalanceForRentExemption(100);
// ≈ 0.00156 SOL
\`\`\`

### Program Derived Addresses (PDAs)

PDAs are deterministic addresses that no private key can sign for — only the program can:

\`\`\`rust
let (pda, bump) = Pubkey::find_program_address(
    &[b"user-profile", user.key().as_ref()],
    program_id,
);
\`\`\`

PDAs are the backbone of Solana program design. They let programs "own" accounts deterministically.

> **Think of it this way:** accounts are like database rows, programs are like server code, and PDAs are like auto-generated primary keys.`,
          },
        ],
      },
      {
        id: "m2",
        title: "Your First Solana Program",
        description: "Write, deploy, and interact with a Solana program.",
        order: 1,
        lessons: [
          {
            id: "l4",
            title: "Hello World Program",
            slug: "hello-world",
            type: "content",
            duration: 35,
            order: 3,
            content: `## Hello World on Solana

Let's write our first Solana program using Anchor.

### The Program

Open \`programs/my-first-project/src/lib.rs\` and replace it with:

\`\`\`rust
use anchor_lang::prelude::*;

declare_id!("YourProgramIdHere");

#[program]
mod hello_world {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Hello, Solana!");
        msg!("Signer: {}", ctx.accounts.signer.key());
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
}
\`\`\`

### What Each Part Does

- **\`declare_id!\`** — Your program's on-chain address (auto-generated by \`anchor build\`)
- **\`#[program]\`** — The instruction handlers (like API endpoints)
- **\`#[derive(Accounts)]\`** — Account validation (like middleware)
- **\`msg!\`** — Logging (visible in transaction logs)

### Build and Deploy

\`\`\`bash
anchor build
anchor deploy
\`\`\`

### Test It

\`\`\`typescript
import * as anchor from "@coral-xyz/anchor";

describe("hello_world", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.HelloWorld;

  it("initializes", async () => {
    const tx = await program.methods
      .initialize()
      .accounts({ signer: provider.wallet.publicKey })
      .rpc();
    console.log("Transaction:", tx);
  });
});
\`\`\`

Run with \`anchor test\` and check the logs for "Hello, Solana!".`,
          },
          {
            id: "l5",
            title: "Program State",
            slug: "program-state",
            type: "content",
            duration: 40,
            order: 4,
            content: `## Working with Program State

Solana programs are **stateless** — they read and write data to separate accounts. Let's build a counter program.

### Define the Account

\`\`\`rust
#[account]
pub struct Counter {
    pub count: u64,
    pub authority: Pubkey,
    pub bump: u8,
}
\`\`\`

The \`#[account]\` macro adds 8-byte discriminator, serialization, and deserialization.

### Space Calculation

Every account needs pre-allocated space:

\`\`\`rust
// 8 (discriminator) + 8 (u64) + 32 (Pubkey) + 1 (u8) = 49 bytes
const COUNTER_SIZE: usize = 8 + 8 + 32 + 1;
\`\`\`

### Create Account Instruction

\`\`\`rust
#[derive(Accounts)]
pub struct CreateCounter<'info> {
    #[account(
        init,
        payer = authority,
        space = COUNTER_SIZE,
        seeds = [b"counter", authority.key().as_ref()],
        bump,
    )]
    pub counter: Account<'info, Counter>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}
\`\`\`

### Increment Instruction

\`\`\`rust
pub fn increment(ctx: Context<Increment>) -> Result<()> {
    let counter = &mut ctx.accounts.counter;
    counter.count = counter.count.checked_add(1)
        .ok_or(ProgramError::ArithmeticOverflow)?;
    Ok(())
}

#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(
        mut,
        seeds = [b"counter", authority.key().as_ref()],
        bump = counter.bump,
        has_one = authority,
    )]
    pub counter: Account<'info, Counter>,
    pub authority: Signer<'info>,
}
\`\`\`

> **Important:** Always use \`checked_add\`, \`checked_sub\`, etc. for arithmetic. Overflow in production programs is a security vulnerability.`,
          },
          {
            id: "l6",
            title: "Counter Challenge",
            slug: "counter-challenge",
            type: "challenge",
            duration: 45,
            order: 5,
            challenge: {
              prompt:
                "Create a function called `incrementCounter` that takes the current count (a number) and returns the new count incremented by 1.\n\n**Example:**\n- `incrementCounter(0)` → `1`\n- `incrementCounter(99)` → `100`",
              language: "typescript",
              starterCode:
                "function incrementCounter(currentCount: number): number {\n  // Your code here\n}",
              solution:
                "function incrementCounter(currentCount: number): number {\n  return currentCount + 1;\n}",
              testCases: [
                { input: "0", expectedOutput: "1", label: "Increment from 0" },
                { input: "5", expectedOutput: "6", label: "Increment from 5" },
                {
                  input: "99",
                  expectedOutput: "100",
                  label: "Increment from 99",
                },
              ],
              hints: [
                "Think about what operation increases a number by 1",
                "Use the + operator: return currentCount + 1",
              ],
            },
          },
        ],
      },
      {
        id: "m3",
        title: "Advanced Concepts",
        description: "PDAs, CPIs, and token interactions.",
        order: 2,
        lessons: [
          {
            id: "l7",
            title: "Program Derived Addresses",
            slug: "pdas",
            type: "content",
            duration: 35,
            order: 6,
            content: `## Program Derived Addresses (PDAs)

PDAs are deterministic addresses that fall **off** the Ed25519 curve — meaning no private key exists for them. Only the owning program can sign on their behalf.

### Finding a PDA

\`\`\`rust
let (pda, bump) = Pubkey::find_program_address(
    &[b"vault", user.key().as_ref()],
    program_id,
);
\`\`\`

The \`bump\` is a single byte (0-255) that ensures the address falls off the curve. Anchor stores it automatically.

### Common PDA Patterns

**Singleton (one per program):**
\`\`\`rust
seeds = [b"config"]
\`\`\`

**Per-user:**
\`\`\`rust
seeds = [b"profile", user.key().as_ref()]
\`\`\`

**Per-user-per-entity:**
\`\`\`rust
seeds = [b"enrollment", course_id.as_bytes(), user.key().as_ref()]
\`\`\`

### In Anchor

\`\`\`rust
#[account(
    init,
    payer = user,
    space = 8 + UserProfile::INIT_SPACE,
    seeds = [b"profile", user.key().as_ref()],
    bump,
)]
pub profile: Account<'info, UserProfile>,
\`\`\`

> **Best practice:** Store the bump in your account and reuse it. Recalculating bumps on every call wastes compute units.`,
          },
          {
            id: "l8",
            title: "Cross-Program Invocations",
            slug: "cpis",
            type: "content",
            duration: 40,
            order: 7,
            videoUrl: "https://www.youtube.com/embed/H81XgMnkVAA",
            content: `## Cross-Program Invocations (CPIs)

Programs can call other programs. This is how composability works on Solana.

### Basic CPI: Transfer SOL

\`\`\`rust
use anchor_lang::system_program;

pub fn pay(ctx: Context<Pay>, amount: u64) -> Result<()> {
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.payer.to_account_info(),
                to: ctx.accounts.recipient.to_account_info(),
            },
        ),
        amount,
    )?;
    Ok(())
}
\`\`\`

### CPI with PDA Signer

When a PDA needs to sign a CPI, use \`CpiContext::new_with_signer\`:

\`\`\`rust
let seeds = &[b"vault", user.key().as_ref(), &[bump]];
let signer_seeds = &[&seeds[..]];

token::transfer(
    CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        token::Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to: ctx.accounts.user_ata.to_account_info(),
            authority: ctx.accounts.vault_authority.to_account_info(),
        },
        signer_seeds,
    ),
    amount,
)?;
\`\`\`

### Security Rules

1. **Always validate CPI target program IDs** — don't let attackers substitute a malicious program
2. **Reload accounts after CPIs** if you read their data again
3. **Watch for re-entrancy** — Solana programs can call back into your program`,
          },
          {
            id: "l9",
            title: "PDA Challenge",
            slug: "pda-challenge",
            type: "challenge",
            duration: 30,
            order: 8,
            challenge: {
              prompt:
                'Write a function called `derivePDA` that takes a base seed string and a user ID string, and returns them combined with a colon separator.\n\n**Example:**\n- `derivePDA("vault", "user1")` → `"vault:user1"`\n- `derivePDA("config", "admin")` → `"config:admin"`',
              language: "typescript",
              starterCode:
                "function derivePDA(base: string, userId: string): string {\n  // Combine base and userId with a colon separator\n}",
              solution:
                "function derivePDA(base: string, userId: string): string {\n  return `${base}:${userId}`;\n}",
              testCases: [
                {
                  input: '"vault", "user1"',
                  expectedOutput: "vault:user1",
                  label: "Basic PDA derivation",
                },
                {
                  input: '"config", "admin"',
                  expectedOutput: "config:admin",
                  label: "Config PDA",
                },
              ],
              hints: [
                "Use template literals to combine strings",
                "The separator is a colon (:) — return `${base}:${userId}`",
              ],
            },
          },
          {
            id: "l10",
            title: "Course Recap & Next Steps",
            slug: "course-recap",
            type: "content",
            duration: 60,
            order: 9,
            content: `## Course Recap

Congratulations! You've learned the foundations of Solana development. Here's what you covered:

### Module 1: Foundations
- Solana's architecture: PoH, accounts model, parallel execution
- Dev environment: Rust, Solana CLI, Anchor
- The accounts model: ownership, rent, PDAs

### Module 2: Your First Program
- Hello World with Anchor
- Storing and modifying state
- Account constraints and validation

### Module 3: Advanced Concepts
- PDA patterns: singleton, per-user, per-entity
- Cross-Program Invocations
- Security best practices

### What's Next?

Now that you understand the basics, we recommend:

1. **Anchor Framework Fundamentals** — Deep dive into Anchor's constraint system, testing, and deployment
2. **DeFi on Solana** — Build AMMs, lending protocols, and yield strategies
3. **NFT Development** — Create, manage, and trade NFTs with Metaplex

### Resources

- [Solana Cookbook](https://solanacookbook.com/) — Practical recipes
- [Anchor Book](https://www.anchor-lang.com/) — Official Anchor docs
- [Solana Stack Exchange](https://solana.stackexchange.com/) — Q&A community

> **Keep your streak going!** Continue to the next course to earn more XP and unlock achievements.`,
          },
        ],
      },
    ],
  },
  {
    id: "anchor-fundamentals",
    title: "Anchor Framework Fundamentals",
    slug: "anchor-fundamentals",
    description:
      "Master the Anchor framework for building Solana programs efficiently.",
    longDescription:
      "Deep dive into the Anchor framework — the most popular framework for building Solana programs. Learn account validation, error handling, testing, and deployment best practices.",
    thumbnail: "",
    difficulty: "intermediate",
    track: TRACKS[3],
    instructor: INSTRUCTORS[1],
    totalLessons: 8,
    totalDuration: 420,
    totalXP: 2000,
    bonusXP: 1000,
    prerequisites: ["intro-to-solana"],
    tags: ["anchor", "rust", "solana", "smart-contracts"],
    published: true,
    createdAt: "2026-01-20T00:00:00Z",
    updatedAt: "2026-02-05T00:00:00Z",
    modules: [
      {
        id: "m4",
        title: "Anchor Basics",
        description: "Core Anchor concepts and macros.",
        order: 0,
        lessons: [
          {
            id: "l11",
            title: "Anchor Overview",
            slug: "anchor-overview",
            type: "content",
            duration: 25,
            order: 0,
            videoUrl: "https://www.youtube.com/embed/EvryHUjEmBc",
            content: `## The Anchor Framework

Anchor is a framework for Solana that dramatically reduces boilerplate. It handles account serialization, validation, and instruction dispatch — so you can focus on business logic.

### What Anchor Gives You

- **\`#[program]\`** — Macro that generates instruction dispatch
- **\`#[derive(Accounts)]\`** — Declarative account validation
- **\`#[account]\`** — Auto serialize/deserialize with 8-byte discriminator
- **IDL generation** — TypeScript client auto-generated from your Rust code
- **Testing harness** — Built-in test framework with TypeScript

### Without Anchor vs. With Anchor

**Without (native):**
\`\`\`rust
fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let account = next_account_info(accounts_iter)?;
    // Manual deserialization, validation, ownership checks...
}
\`\`\`

**With Anchor:**
\`\`\`rust
#[program]
mod my_program {
    pub fn initialize(ctx: Context<Init>, data: u64) -> Result<()> {
        ctx.accounts.my_account.data = data;
        Ok(())
    }
}
\`\`\`

> Anchor handles the boring parts. You write the interesting parts.`,
          },
          {
            id: "l12",
            title: "Account Constraints",
            slug: "account-constraints",
            type: "content",
            duration: 35,
            order: 1,
            content: `## Account Constraints

Anchor's constraint system validates accounts at the instruction level. If any check fails, the instruction aborts before your code runs.

### Common Constraints

\`\`\`rust
#[derive(Accounts)]
pub struct UpdateProfile<'info> {
    // Must be a signer
    #[account(mut)]
    pub user: Signer<'info>,

    // PDA with seeds, must exist, must be owned by user
    #[account(
        mut,
        seeds = [b"profile", user.key().as_ref()],
        bump = profile.bump,
        has_one = user,
    )]
    pub profile: Account<'info, UserProfile>,

    // Read-only config account
    #[account(
        seeds = [b"config"],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,
}
\`\`\`

### Constraint Reference

| Constraint | Purpose |
|-----------|---------|
| \`init\` | Create account, set owner/discriminator |
| \`mut\` | Account is writable |
| \`seeds\` | PDA derivation seeds |
| \`bump\` | PDA bump seed |
| \`has_one\` | Field must match another account |
| \`constraint\` | Custom boolean expression |
| \`close\` | Close account, reclaim rent |
| \`realloc\` | Resize account data |

### Custom Constraints

\`\`\`rust
#[account(
    constraint = profile.xp >= 1000 @ ErrorCode::InsufficientXP,
)]
pub profile: Account<'info, UserProfile>,
\`\`\``,
          },
          {
            id: "l13",
            title: "Error Handling",
            slug: "error-handling",
            type: "content",
            duration: 30,
            order: 2,
            content: `## Custom Errors in Anchor

Anchor lets you define program-specific errors for clear error reporting.

### Defining Errors

\`\`\`rust
#[error_code]
pub enum AcademyError {
    #[msg("Course is not published")]
    CourseNotPublished,

    #[msg("Lesson already completed")]
    LessonAlreadyCompleted,

    #[msg("Daily XP cap exceeded")]
    DailyXPCapExceeded,

    #[msg("Unauthorized: not course creator")]
    Unauthorized,
}
\`\`\`

### Using Errors

\`\`\`rust
pub fn complete_lesson(ctx: Context<CompleteLesson>) -> Result<()> {
    let enrollment = &mut ctx.accounts.enrollment;

    require!(
        !enrollment.is_lesson_complete(lesson_index),
        AcademyError::LessonAlreadyCompleted,
    );

    enrollment.mark_lesson_complete(lesson_index);
    Ok(())
}
\`\`\`

### Error Codes

Anchor errors map to numeric codes starting at 6000. Your custom errors start at 6000 + your index:

\`\`\`
CourseNotPublished     → 6000
LessonAlreadyCompleted → 6001
DailyXPCapExceeded     → 6002
Unauthorized           → 6003
\`\`\`

> In your TypeScript client, catch these errors by code to show user-friendly messages.`,
          },
          {
            id: "l14",
            title: "Constraint Challenge",
            slug: "constraint-challenge",
            type: "challenge",
            duration: 35,
            order: 3,
            challenge: {
              prompt:
                "Write a function called `validateBounds` that checks if a value is within a given min/max range (inclusive).\n\n**Example:**\n- `validateBounds(5, 1, 10)` → `true`\n- `validateBounds(0, 1, 10)` → `false`",
              language: "typescript",
              starterCode:
                "function validateBounds(value: number, min: number, max: number): boolean {\n  // Return true if value is between min and max (inclusive)\n}",
              solution:
                "function validateBounds(value: number, min: number, max: number): boolean {\n  return value >= min && value <= max;\n}",
              testCases: [
                {
                  input: "5, 1, 10",
                  expectedOutput: "true",
                  label: "Value in bounds",
                },
                {
                  input: "0, 1, 10",
                  expectedOutput: "false",
                  label: "Value below min",
                },
                {
                  input: "15, 1, 10",
                  expectedOutput: "false",
                  label: "Value above max",
                },
              ],
              hints: [
                "Check both minimum and maximum bounds",
                "Use >= and <= with the && operator",
              ],
            },
          },
        ],
      },
      {
        id: "m5",
        title: "Advanced Anchor",
        description: "Testing, deployment, and best practices.",
        order: 1,
        lessons: [
          {
            id: "l15",
            title: "Testing with Anchor",
            slug: "testing-anchor",
            type: "content",
            duration: 40,
            order: 4,
            content: `## Testing Anchor Programs

Anchor generates a TypeScript client from your IDL, making testing ergonomic.

### Test Structure

\`\`\`typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MyProgram } from "../target/types/my_program";
import { expect } from "chai";

describe("my-program", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.MyProgram as Program<MyProgram>;

  it("creates a counter", async () => {
    const [counterPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("counter"), provider.wallet.publicKey.toBuffer()],
      program.programId,
    );

    await program.methods
      .createCounter()
      .accounts({ authority: provider.wallet.publicKey })
      .rpc();

    const counter = await program.account.counter.fetch(counterPda);
    expect(counter.count.toNumber()).to.equal(0);
  });
});
\`\`\`

### Running Tests

\`\`\`bash
anchor test                    # Build + test
anchor test --skip-build       # Test only (faster iteration)
anchor test --skip-local-validator  # Use running validator
\`\`\`

> Write tests for every instruction. Test both happy paths and error cases.`,
          },
          {
            id: "l16",
            title: "Deployment",
            slug: "deployment",
            type: "content",
            duration: 30,
            order: 5,
            content: `## Deploying Solana Programs

### Deployment Targets

| Network | URL | Use Case |
|---------|-----|----------|
| Localhost | \`http://localhost:8899\` | Development |
| Devnet | \`https://api.devnet.solana.com\` | Testing |
| Mainnet | \`https://api.mainnet-beta.solana.com\` | Production |

### Deploy to Devnet

\`\`\`bash
solana config set --url devnet
solana airdrop 5                 # Get SOL for deployment
anchor build
anchor deploy
\`\`\`

### Verifiable Builds

For mainnet, use verifiable builds so anyone can confirm on-chain code matches source:

\`\`\`bash
anchor build --verifiable
anchor verify <PROGRAM_ID>
\`\`\`

### Program Upgrades

By default, Anchor programs are upgradeable. The upgrade authority can push new code:

\`\`\`bash
anchor upgrade target/deploy/my_program.so \\
  --program-id <PROGRAM_ID>
\`\`\`

To make a program immutable (no more upgrades):

\`\`\`bash
solana program set-upgrade-authority <PROGRAM_ID> --final
\`\`\`

> **Warning:** Making a program immutable is irreversible. Only do this after thorough testing.`,
          },
          {
            id: "l17",
            title: "Security Best Practices",
            slug: "security",
            type: "content",
            duration: 45,
            order: 6,
            content: `## Security Best Practices for Solana Programs

### The Big 5 Vulnerabilities

**1. Missing Signer Checks**
\`\`\`rust
// BAD: Anyone can call this
pub authority: AccountInfo<'info>,

// GOOD: Must be signed
pub authority: Signer<'info>,
\`\`\`

**2. Missing Owner Checks**
\`\`\`rust
// BAD: Accepts any account
pub data: AccountInfo<'info>,

// GOOD: Validates program ownership + deserialization
pub data: Account<'info, MyData>,
\`\`\`

**3. Arithmetic Overflow**
\`\`\`rust
// BAD: Can overflow
counter.count += 1;

// GOOD: Checked arithmetic
counter.count = counter.count.checked_add(1)
    .ok_or(ErrorCode::Overflow)?;
\`\`\`

**4. PDA Bump Reuse**
\`\`\`rust
// BAD: Recalculates bump every time (wastes CU)
seeds = [b"data"],
bump,

// GOOD: Uses stored bump
seeds = [b"data"],
bump = data.bump,
\`\`\`

**5. Missing Re-initialization Check**
\`\`\`rust
// BAD: Can be called multiple times
#[account(init, ...)]

// GOOD: Anchor's init already prevents re-init
// But for manual code, check a flag
require!(!account.is_initialized, ErrorCode::AlreadyInitialized);
\`\`\`

> **Rule of thumb:** If Anchor provides a constraint for it, use it. Anchor's macro system prevents most common vulnerabilities automatically.`,
          },
          {
            id: "l18",
            title: "Build a Token Vault",
            slug: "token-vault",
            type: "challenge",
            duration: 60,
            order: 7,
            challenge: {
              prompt:
                "Implement a `deposit` function for a token vault. The function takes the current vault balance and deposit amount, and returns the new balance.\n\n**Example:**\n- `deposit(0, 100)` → `100`\n- `deposit(500, 250)` → `750`",
              language: "typescript",
              starterCode:
                "function deposit(vault: number, amount: number): number {\n  // Add amount to vault and return new balance\n}",
              solution:
                "function deposit(vault: number, amount: number): number {\n  return vault + amount;\n}",
              testCases: [
                {
                  input: "0, 100",
                  expectedOutput: "100",
                  label: "Deposit to empty vault",
                },
                {
                  input: "500, 250",
                  expectedOutput: "750",
                  label: "Deposit to existing vault",
                },
              ],
              hints: ["Add the deposit amount to the current vault balance"],
            },
          },
        ],
      },
    ],
  },
  {
    id: "defi-on-solana",
    title: "DeFi on Solana",
    slug: "defi-on-solana",
    description: "Build decentralized finance applications on Solana.",
    longDescription:
      "Learn to build AMMs, lending protocols, and yield farms on Solana. Understand token economics, liquidity pools, and oracle integration.",
    thumbnail: "",
    difficulty: "advanced",
    track: TRACKS[1],
    instructor: INSTRUCTORS[1],
    totalLessons: 6,
    totalDuration: 360,
    totalXP: 3000,
    bonusXP: 1500,
    prerequisites: ["intro-to-solana", "anchor-fundamentals"],
    tags: ["defi", "amm", "lending", "solana"],
    published: true,
    createdAt: "2026-02-01T00:00:00Z",
    updatedAt: "2026-02-10T00:00:00Z",
    modules: [
      {
        id: "m6",
        title: "DeFi Fundamentals",
        description: "Core DeFi concepts on Solana.",
        order: 0,
        lessons: [
          {
            id: "l19",
            title: "DeFi Overview",
            slug: "defi-overview",
            type: "content",
            duration: 30,
            order: 0,
            videoUrl: "https://www.youtube.com/embed/17GkLB8VsIA",
            content: `## DeFi on Solana

Solana's high throughput and low fees make it ideal for DeFi. The ecosystem includes DEXs, lending protocols, yield aggregators, and perpetual exchanges.

### Key DeFi Protocols on Solana

- **Jupiter** — DEX aggregator (routes across 20+ AMMs)
- **Raydium** — AMM with concentrated liquidity
- **Marinade** — Liquid staking (mSOL)
- **Drift** — Perpetual DEX
- **Kamino** — Lending and liquidity management

### DeFi Building Blocks

To build DeFi on Solana, you need to understand:

1. **SPL Token Program** — Creating and managing fungible tokens
2. **Token-2022** — Extended token features (transfer fees, interest, non-transferable)
3. **Associated Token Accounts (ATAs)** — Deterministic token accounts per wallet
4. **Oracles** — Price feeds from Pyth, Switchboard

> This course covers building an AMM from scratch — the most fundamental DeFi primitive.`,
          },
          {
            id: "l20",
            title: "Token Program Deep Dive",
            slug: "token-program",
            type: "content",
            duration: 40,
            order: 1,
            content: `## The SPL Token Program

SPL tokens are Solana's standard for fungible and non-fungible tokens.

### Token Architecture

\`\`\`
Mint Account          Token Account (ATA)
├── supply            ├── mint (which token)
├── decimals          ├── owner (who owns it)
├── mint_authority    ├── amount (balance)
└── freeze_authority  └── delegate (optional)
\`\`\`

### Creating a Token

\`\`\`typescript
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";

// Create the mint
const mint = await createMint(
  connection,
  payer,
  mintAuthority.publicKey,
  freezeAuthority.publicKey,
  9, // 9 decimals (like SOL)
);

// Create a token account for the user
const ata = await getOrCreateAssociatedTokenAccount(
  connection, payer, mint, user.publicKey,
);

// Mint tokens
await mintTo(connection, payer, mint, ata.address, mintAuthority, 1_000_000_000);
\`\`\`

### Token-2022 Extensions

Token-2022 adds powerful features:

| Extension | Use Case |
|-----------|----------|
| Transfer Fee | Royalties on every transfer |
| Non-Transferable | Soulbound tokens (like XP!) |
| Interest Bearing | Yield tokens |
| Permanent Delegate | Protocol-controlled burning |
| Metadata | On-token metadata |

> Superteam Academy uses Token-2022 with NonTransferable + PermanentDelegate for XP tokens — they can't be transferred or self-burned.`,
          },
          {
            id: "l21",
            title: "AMM Design",
            slug: "amm-design",
            type: "content",
            duration: 50,
            order: 2,
            content: `## Automated Market Makers

An AMM replaces order books with a mathematical formula that determines prices.

### Constant Product Formula

The simplest AMM uses the formula:

\`\`\`
x * y = k
\`\`\`

Where:
- \`x\` = reserve of token A
- \`y\` = reserve of token B
- \`k\` = constant (product of reserves)

### How a Swap Works

If a pool has **1000 SOL** and **1000 USDC** (k = 1,000,000):

1. User wants to swap **100 SOL** for USDC
2. New SOL reserve: 1000 + 100 = 1100
3. New USDC reserve: k / 1100 = 909.09
4. User receives: 1000 - 909.09 = **90.91 USDC**

Notice the user gets less than 100 USDC — this is **slippage** caused by the constant product formula.

### Price Impact

\`\`\`typescript
function calculateOutput(
  inputAmount: number,
  inputReserve: number,
  outputReserve: number,
): number {
  const k = inputReserve * outputReserve;
  const newInputReserve = inputReserve + inputAmount;
  return outputReserve - k / newInputReserve;
}
\`\`\`

### Liquidity Provider (LP) Tokens

When users deposit liquidity, they receive LP tokens proportional to their share:

\`\`\`
LP tokens = sqrt(deposit_a * deposit_b)
\`\`\`

> In the next lesson, we'll implement a full liquidity pool on Solana.`,
          },
        ],
      },
      {
        id: "m7",
        title: "Building a DEX",
        description: "Build your own decentralized exchange.",
        order: 1,
        lessons: [
          {
            id: "l22",
            title: "Liquidity Pools",
            slug: "liquidity-pools",
            type: "content",
            duration: 45,
            order: 3,
            content: `## Implementing Liquidity Pools

A liquidity pool holds reserves of two tokens and enables trustless swaps.

### Pool Account Structure

\`\`\`rust
#[account]
pub struct LiquidityPool {
    pub token_a_mint: Pubkey,
    pub token_b_mint: Pubkey,
    pub token_a_reserve: u64,
    pub token_b_reserve: u64,
    pub lp_mint: Pubkey,
    pub total_lp_supply: u64,
    pub fee_bps: u16,  // Fee in basis points (30 = 0.3%)
    pub bump: u8,
}
\`\`\`

### Adding Liquidity

\`\`\`rust
pub fn add_liquidity(
    ctx: Context<AddLiquidity>,
    amount_a: u64,
    amount_b: u64,
) -> Result<()> {
    let pool = &mut ctx.accounts.pool;

    // First deposit: LP = sqrt(a * b)
    // Subsequent: LP proportional to deposit ratio
    let lp_tokens = if pool.total_lp_supply == 0 {
        (amount_a as f64 * amount_b as f64).sqrt() as u64
    } else {
        std::cmp::min(
            amount_a * pool.total_lp_supply / pool.token_a_reserve,
            amount_b * pool.total_lp_supply / pool.token_b_reserve,
        )
    };

    pool.token_a_reserve += amount_a;
    pool.token_b_reserve += amount_b;
    pool.total_lp_supply += lp_tokens;

    // Mint LP tokens to provider...
    Ok(())
}
\`\`\`

> **Note:** Production AMMs use fixed-point math (u128) to avoid floating point imprecision.`,
          },
          {
            id: "l23",
            title: "Swap Implementation",
            slug: "swap-implementation",
            type: "content",
            duration: 50,
            order: 4,
            content: `## Implementing Token Swaps

The swap function is the core of any DEX.

### Swap with Fees

\`\`\`rust
pub fn swap(
    ctx: Context<Swap>,
    amount_in: u64,
    min_amount_out: u64,
) -> Result<()> {
    let pool = &mut ctx.accounts.pool;

    // Apply fee (0.3% = 30 bps)
    let fee = amount_in * pool.fee_bps as u64 / 10_000;
    let amount_in_after_fee = amount_in - fee;

    // Constant product: x * y = k
    let k = pool.token_a_reserve as u128
        * pool.token_b_reserve as u128;
    let new_reserve_in = pool.token_a_reserve as u128
        + amount_in_after_fee as u128;
    let new_reserve_out = k / new_reserve_in;
    let amount_out = pool.token_b_reserve as u128
        - new_reserve_out;

    // Slippage protection
    require!(
        amount_out >= min_amount_out as u128,
        DexError::SlippageExceeded,
    );

    // Update reserves
    pool.token_a_reserve += amount_in;
    pool.token_b_reserve -= amount_out as u64;

    // Transfer tokens via CPIs...
    Ok(())
}
\`\`\`

### Key Concepts

- **Fees** protect LPs from impermanent loss
- **Slippage protection** (\`min_amount_out\`) prevents front-running
- **Use u128** for intermediate math to prevent overflow

> In the challenge, you'll implement the core swap calculation yourself.`,
          },
          {
            id: "l24",
            title: "AMM Challenge",
            slug: "amm-challenge",
            type: "challenge",
            duration: 60,
            order: 5,
            challenge: {
              prompt:
                "Implement `calculateSwapOutput` using the constant product formula (x * y = k). Given an input amount and both reserves, return how many output tokens the user receives.\n\n**Formula:** `output = outputReserve - (inputReserve * outputReserve) / (inputReserve + inputAmount)`\n\n**Example:** `calculateSwapOutput(100, 1000, 1000)` → `90.90909090909091`",
              language: "typescript",
              starterCode:
                "function calculateSwapOutput(inputAmount: number, inputReserve: number, outputReserve: number): number {\n  // Implement x * y = k formula\n}",
              solution:
                "function calculateSwapOutput(inputAmount: number, inputReserve: number, outputReserve: number): number {\n  const k = inputReserve * outputReserve;\n  const newInputReserve = inputReserve + inputAmount;\n  return outputReserve - k / newInputReserve;\n}",
              testCases: [
                {
                  input: "100, 1000, 1000",
                  expectedOutput: "90.90909090909091",
                  label: "Equal reserves swap",
                },
                {
                  input: "50, 500, 1000",
                  expectedOutput: "90.90909090909091",
                  label: "Unequal reserves swap",
                },
              ],
              hints: [
                "First calculate k = inputReserve * outputReserve",
                "Then: output = outputReserve - k / (inputReserve + inputAmount)",
              ],
            },
          },
        ],
      },
    ],
  },
  {
    id: "nft-development",
    title: "NFT Development on Solana",
    slug: "nft-development",
    description: "Create, manage, and trade NFTs on Solana using Metaplex.",
    longDescription:
      "From minting your first NFT to building a full marketplace. Learn Metaplex standards, metadata, collections, and compressed NFTs.",
    thumbnail: "",
    difficulty: "intermediate",
    track: TRACKS[2],
    instructor: INSTRUCTORS[2],
    totalLessons: 7,
    totalDuration: 350,
    totalXP: 1800,
    bonusXP: 900,
    prerequisites: ["intro-to-solana"],
    tags: ["nft", "metaplex", "solana", "digital-assets"],
    published: true,
    createdAt: "2026-01-25T00:00:00Z",
    updatedAt: "2026-02-08T00:00:00Z",
    modules: [
      {
        id: "m8",
        title: "NFT Basics",
        description: "Understanding NFTs on Solana.",
        order: 0,
        lessons: [
          {
            id: "l25",
            title: "NFT Standards on Solana",
            slug: "nft-standards",
            type: "content",
            duration: 25,
            order: 0,
            content: `## NFT Standards on Solana

Solana NFTs use the SPL Token Program with supply = 1 and decimals = 0. Metaplex adds metadata, collections, and creator verification.

### Anatomy of a Solana NFT

\`\`\`
Mint Account (SPL Token)
├── supply: 1
├── decimals: 0
└── mint_authority: null (after minting)

Metadata Account (Metaplex)
├── name, symbol, uri
├── creators[]
├── collection
└── uses, programmable config

Master Edition Account
└── max_supply (optional)
\`\`\`

### Token Standards

| Standard | Use Case |
|----------|----------|
| NonFungible | Classic 1/1 NFTs |
| FungibleAsset | Semi-fungible (editions) |
| ProgrammableNonFungible | pNFTs with enforced royalties |
| NonFungibleEdition | Prints from master edition |

> Superteam Academy credentials use **compressed NFTs** — 1000x cheaper to mint than regular NFTs.`,
          },
          {
            id: "l26",
            title: "Minting Your First NFT",
            slug: "minting-nfts",
            type: "content",
            duration: 40,
            order: 1,
            videoUrl: "https://www.youtube.com/embed/RBQVkLQ_bvI",
            content: `## Minting NFTs with Metaplex

### Using the Metaplex JS SDK

\`\`\`typescript
import { createNft } from "@metaplex-foundation/mpl-token-metadata";
import { generateSigner, percentAmount } from "@metaplex-foundation/umi";

const mint = generateSigner(umi);

await createNft(umi, {
  mint,
  name: "Superteam Certificate",
  symbol: "STCERT",
  uri: "https://arweave.net/metadata.json",
  sellerFeeBasisPoints: percentAmount(5), // 5% royalty
  collection: { key: collectionMint, verified: false },
  creators: [
    { address: creator.publicKey, share: 100, verified: true },
  ],
}).sendAndConfirm(umi);
\`\`\`

### Metadata JSON (off-chain)

\`\`\`json
{
  "name": "Superteam Certificate - Solana Core",
  "symbol": "STCERT",
  "description": "Proof of completion for the Solana Core track",
  "image": "https://arweave.net/image.png",
  "attributes": [
    { "trait_type": "Track", "value": "Solana Core" },
    { "trait_type": "Level", "value": "Silver" },
    { "trait_type": "XP", "value": "2500" }
  ],
  "properties": {
    "category": "image",
    "files": [{ "uri": "https://arweave.net/image.png", "type": "image/png" }]
  }
}
\`\`\`

> Store metadata JSON on Arweave for permanent, immutable storage.`,
          },
          {
            id: "l27",
            title: "NFT Metadata & Collections",
            slug: "metadata",
            type: "content",
            duration: 35,
            order: 2,
            content: `## NFT Metadata & Collections

### Collections

Collections group related NFTs under a parent:

\`\`\`typescript
// Create collection NFT
const collectionMint = generateSigner(umi);
await createNft(umi, {
  mint: collectionMint,
  name: "Superteam Certificates",
  symbol: "STCERT",
  uri: "https://arweave.net/collection.json",
  isCollection: true,
}).sendAndConfirm(umi);

// Verify an NFT as part of the collection
await verifyCollectionV1(umi, {
  metadata: nftMetadata,
  collectionMint: collectionMint.publicKey,
  authority: collectionAuthority,
}).sendAndConfirm(umi);
\`\`\`

### Updating Metadata

NFTs with an update authority can have their metadata changed:

\`\`\`typescript
await updateV1(umi, {
  mint: nftMint.publicKey,
  data: {
    name: "Superteam Certificate - Gold",
    uri: "https://arweave.net/updated-metadata.json",
  },
}).sendAndConfirm(umi);
\`\`\`

This is how Superteam Academy **evolves credentials** — when a learner levels up, the cNFT metadata is updated to reflect the new level.`,
          },
        ],
      },
      {
        id: "m9",
        title: "Advanced NFTs",
        description: "Compressed NFTs and marketplace mechanics.",
        order: 1,
        lessons: [
          {
            id: "l28",
            title: "Compressed NFTs",
            slug: "compressed-nfts",
            type: "content",
            duration: 45,
            order: 3,
            content: `## Compressed NFTs (cNFTs)

Compressed NFTs use state compression (Merkle trees) to store NFT data off-chain while keeping a proof on-chain. This reduces minting cost from ~$2 to ~$0.001.

### How It Works

\`\`\`
Merkle Tree (on-chain)
├── Root hash (32 bytes)
└── Verified by concurrent proofs

Leaf Data (off-chain, indexed)
├── NFT metadata
├── Owner
├── Delegate
└── Creator array
\`\`\`

### Minting cNFTs

\`\`\`typescript
import { mintToCollectionV1 } from "@metaplex-foundation/mpl-bubblegum";

await mintToCollectionV1(umi, {
  leafOwner: learner.publicKey,
  merkleTree: treeAddress,
  collectionMint: collectionMint.publicKey,
  metadata: {
    name: "Superteam Credential",
    symbol: "STCRED",
    uri: "https://arweave.net/cred-metadata.json",
    sellerFeeBasisPoints: 0,
    collection: { key: collectionMint.publicKey, verified: false },
    creators: [{ address: authority, share: 100, verified: false }],
  },
}).sendAndConfirm(umi);
\`\`\`

### Reading cNFTs

Use the DAS (Digital Asset Standard) API to read compressed NFTs:

\`\`\`typescript
const response = await fetch(heliusUrl, {
  method: "POST",
  body: JSON.stringify({
    jsonrpc: "2.0",
    method: "getAssetsByOwner",
    params: { ownerAddress: wallet.publicKey.toString() },
  }),
});
\`\`\`

> Superteam Academy issues one cNFT per track that **upgrades** as the learner progresses — no wallet clutter.`,
          },
          {
            id: "l29",
            title: "Marketplace Mechanics",
            slug: "listing-buying",
            type: "content",
            duration: 50,
            order: 4,
            content: `## NFT Marketplace: Listing & Buying

### Listing Flow

1. Seller creates a **listing PDA** with price and expiry
2. NFT is **delegated** to the marketplace program (or transferred to escrow)
3. Buyer pays SOL/token → marketplace transfers NFT → pays seller minus fee

### Listing Account

\`\`\`rust
#[account]
pub struct Listing {
    pub seller: Pubkey,
    pub nft_mint: Pubkey,
    pub price: u64,        // In lamports
    pub created_at: i64,
    pub expires_at: i64,
    pub bump: u8,
}
\`\`\`

### Buy Instruction

\`\`\`rust
pub fn buy(ctx: Context<Buy>) -> Result<()> {
    let listing = &ctx.accounts.listing;
    let fee = listing.price * 250 / 10_000; // 2.5% fee

    // Transfer payment to seller
    system_program::transfer(
        CpiContext::new(/*...*/),
        listing.price - fee,
    )?;

    // Transfer fee to treasury
    system_program::transfer(
        CpiContext::new(/*...*/),
        fee,
    )?;

    // Transfer NFT to buyer
    token::transfer(
        CpiContext::new_with_signer(/*...*/),
        1,
    )?;

    Ok(())
}
\`\`\`

> Marketplace programs are the most complex DeFi/NFT programs to build — they combine CPIs, PDAs, and token operations.`,
          },
          {
            id: "l30",
            title: "NFT Collections & Royalties",
            slug: "collections",
            type: "content",
            duration: 35,
            order: 5,
            content: `## NFT Collections & Enforced Royalties

### Programmable NFTs (pNFTs)

Metaplex pNFTs enforce royalties at the protocol level:

\`\`\`typescript
await createProgrammableNft(umi, {
  mint,
  name: "My pNFT",
  uri: "...",
  sellerFeeBasisPoints: percentAmount(5),
  ruleSet: ruleSetAddress, // Authorization rules
}).sendAndConfirm(umi);
\`\`\`

### Royalty Calculation

\`\`\`typescript
function calculateRoyalty(salePrice: number, royaltyBps: number): number {
  return (salePrice * royaltyBps) / 10_000;
}

// 5% royalty on 100 SOL = 5 SOL
calculateRoyalty(100, 500); // → 5
\`\`\`

### Creator Splits

Royalties can be split between multiple creators:

\`\`\`json
{
  "creators": [
    { "address": "Artist...", "share": 70 },
    { "address": "Platform...", "share": 30 }
  ]
}
\`\`\`

> pNFTs guarantee creators get paid on every sale — solving one of the biggest problems in the NFT space.`,
          },
          {
            id: "l31",
            title: "Royalty Challenge",
            slug: "nft-challenge",
            type: "challenge",
            duration: 45,
            order: 6,
            challenge: {
              prompt:
                "Calculate the royalty amount for an NFT sale. Royalties are specified in basis points (BPS), where 10,000 BPS = 100%.\n\n**Example:**\n- `calculateRoyalty(100, 500)` → `5` (5% of 100)\n- `calculateRoyalty(250, 1000)` → `25` (10% of 250)",
              language: "typescript",
              starterCode:
                "function calculateRoyalty(salePrice: number, royaltyBps: number): number {\n  // BPS = basis points (100 bps = 1%, 10000 bps = 100%)\n}",
              solution:
                "function calculateRoyalty(salePrice: number, royaltyBps: number): number {\n  return (salePrice * royaltyBps) / 10000;\n}",
              testCases: [
                {
                  input: "100, 500",
                  expectedOutput: "5",
                  label: "5% royalty on 100 SOL",
                },
                {
                  input: "250, 1000",
                  expectedOutput: "25",
                  label: "10% royalty on 250 SOL",
                },
              ],
              hints: [
                "Basis points: 10,000 BPS = 100%",
                "Formula: salePrice * royaltyBps / 10000",
              ],
            },
          },
        ],
      },
    ],
  },
  {
    id: "web3-frontend",
    title: "Web3 Frontend with Solana",
    slug: "web3-frontend",
    description: "Build modern web applications that interact with Solana.",
    longDescription:
      "Learn to build production-ready web3 frontends using Next.js, wallet adapters, and Solana web3.js. From connecting wallets to sending transactions.",
    thumbnail: "",
    difficulty: "beginner",
    track: TRACKS[4],
    instructor: INSTRUCTORS[0],
    totalLessons: 8,
    totalDuration: 400,
    totalXP: 2200,
    bonusXP: 1100,
    prerequisites: [],
    tags: ["frontend", "nextjs", "wallet", "web3"],
    published: true,
    createdAt: "2026-02-05T00:00:00Z",
    updatedAt: "2026-02-12T00:00:00Z",
    modules: [
      {
        id: "m10",
        title: "Web3 Frontend Basics",
        description: "Setting up a web3 frontend with Next.js.",
        order: 0,
        lessons: [
          {
            id: "l32",
            title: "Web3 Frontend Overview",
            slug: "web3-overview",
            type: "content",
            duration: 20,
            order: 0,
            content: `## Web3 Frontend Development

Building a web3 frontend means connecting a traditional web app to blockchain data and user wallets.

### Architecture

\`\`\`
User Browser
├── React/Next.js App
│   ├── Wallet Adapter (connect wallets)
│   ├── @solana/web3.js (RPC calls)
│   └── Anchor Client (program interaction)
└── Solana RPC Node
    ├── Read accounts
    ├── Send transactions
    └── Subscribe to changes
\`\`\`

### Key Libraries

\`\`\`bash
npm install @solana/web3.js @solana/wallet-adapter-react \\
  @solana/wallet-adapter-wallets @solana/wallet-adapter-react-ui
\`\`\`

### Wallet Adapter Setup (Next.js)

\`\`\`typescript
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";

const network = WalletAdapterNetwork.Devnet;
const endpoint = clusterApiUrl(network);
const wallets = [new PhantomWalletAdapter()];

function App({ children }) {
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
\`\`\`

> The wallet adapter supports 15+ wallets (Phantom, Solflare, Backpack, etc.) with a single integration.`,
          },
          {
            id: "l33",
            title: "Connecting Wallets",
            slug: "wallet-connection",
            type: "content",
            duration: 35,
            order: 1,
            content: `## Wallet Connection

### The WalletMultiButton

\`\`\`tsx
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

function Header() {
  return (
    <nav>
      <WalletMultiButton />
    </nav>
  );
}
\`\`\`

This renders a button that handles: wallet selection, connect, disconnect, and displays the connected address.

### Using Wallet State

\`\`\`tsx
import { useWallet, useConnection } from "@solana/wallet-adapter-react";

function WalletInfo() {
  const { publicKey, connected, disconnect } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (!publicKey) return;
    connection.getBalance(publicKey).then((bal) => {
      setBalance(bal / 1e9); // Convert lamports to SOL
    });
  }, [publicKey, connection]);

  if (!connected) return <p>Connect your wallet</p>;

  return (
    <div>
      <p>Address: {publicKey.toString()}</p>
      <p>Balance: {balance} SOL</p>
      <button onClick={disconnect}>Disconnect</button>
    </div>
  );
}
\`\`\`

### Shortening Addresses

\`\`\`typescript
function formatAddress(address: string): string {
  return \`\${address.slice(0, 4)}...\${address.slice(-4)}\`;
}
// "HN7cABqL...YWrH"
\`\`\``,
          },
          {
            id: "l34",
            title: "Reading On-Chain Data",
            slug: "reading-data",
            type: "content",
            duration: 30,
            order: 2,
            content: `## Reading On-Chain Data

### Account Data

\`\`\`typescript
import { Connection, PublicKey } from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com");

// Get SOL balance
const balance = await connection.getBalance(publicKey);

// Get account info (raw)
const accountInfo = await connection.getAccountInfo(publicKey);
console.log(accountInfo?.data);  // Buffer of bytes
console.log(accountInfo?.owner); // Owning program
\`\`\`

### Anchor Account Deserialization

\`\`\`typescript
import { Program } from "@coral-xyz/anchor";

const program = new Program(idl, provider);

// Fetch a single account
const counter = await program.account.counter.fetch(counterPda);
console.log(counter.count.toNumber());

// Fetch all accounts of a type
const allCounters = await program.account.counter.all();

// Fetch with filters
const myCounters = await program.account.counter.all([
  { memcmp: { offset: 8 + 8, bytes: wallet.publicKey.toBase58() } },
]);
\`\`\`

### Token Balances

\`\`\`typescript
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token";

const ata = await getAssociatedTokenAddress(mintAddress, walletAddress);
const tokenAccount = await getAccount(connection, ata);
console.log(tokenAccount.amount); // BigInt
\`\`\``,
          },
          {
            id: "l35",
            title: "Sending Transactions",
            slug: "sending-transactions",
            type: "content",
            duration: 40,
            order: 3,
            content: `## Sending Transactions

### Basic SOL Transfer

\`\`\`typescript
import { Transaction, SystemProgram } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";

function SendSol() {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();

  const handleSend = async () => {
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: publicKey!,
        toPubkey: new PublicKey("recipient..."),
        lamports: 0.1 * 1e9, // 0.1 SOL
      }),
    );

    const signature = await sendTransaction(tx, connection);
    await connection.confirmTransaction(signature, "confirmed");
    console.log("Sent!", signature);
  };

  return <button onClick={handleSend}>Send 0.1 SOL</button>;
}
\`\`\`

### Program Interaction with Anchor

\`\`\`typescript
const tx = await program.methods
  .increment()
  .accounts({
    counter: counterPda,
    authority: wallet.publicKey,
  })
  .rpc();
\`\`\`

### Transaction Confirmation

\`\`\`typescript
// Wait for confirmation
const latestBlockhash = await connection.getLatestBlockhash();
await connection.confirmTransaction({
  signature,
  blockhash: latestBlockhash.blockhash,
  lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
});
\`\`\`

> Always confirm transactions before updating UI state. Use "confirmed" for speed or "finalized" for safety.`,
          },
        ],
      },
      {
        id: "m11",
        title: "Production Patterns",
        description: "Error handling, real-time updates, and best practices.",
        order: 1,
        lessons: [
          {
            id: "l36",
            title: "Error Handling",
            slug: "frontend-errors",
            type: "content",
            duration: 30,
            order: 4,
            content: `## Error Handling in Web3 Apps

### Common Error Types

\`\`\`typescript
try {
  await sendTransaction(tx, connection);
} catch (error) {
  if (error instanceof WalletNotConnectedError) {
    toast.error("Please connect your wallet");
  } else if (error.message.includes("User rejected")) {
    toast.info("Transaction cancelled");
  } else if (error.message.includes("insufficient funds")) {
    toast.error("Not enough SOL for transaction");
  } else if (error.logs) {
    // Program error — parse the logs
    const customError = parseAnchorError(error);
    toast.error(customError?.message ?? "Transaction failed");
  }
}
\`\`\`

### Parsing Anchor Errors

\`\`\`typescript
function parseAnchorError(error: any): { code: number; message: string } | null {
  const logs = error.logs as string[];
  const errorLog = logs?.find((log) => log.includes("AnchorError"));
  if (!errorLog) return null;

  const codeMatch = errorLog.match(/Error Code: (\\w+)/);
  const msgMatch = errorLog.match(/Error Message: (.+)/);
  return {
    code: parseInt(codeMatch?.[1] ?? "0"),
    message: msgMatch?.[1] ?? "Unknown error",
  };
}
\`\`\`

> Use toast notifications (like Sonner) for transaction feedback — users need to know what happened.`,
          },
          {
            id: "l37",
            title: "Real-time Updates",
            slug: "realtime-updates",
            type: "content",
            duration: 35,
            order: 5,
            content: `## Real-time Updates with WebSockets

### Account Subscriptions

\`\`\`typescript
useEffect(() => {
  if (!counterPda) return;

  const subscriptionId = connection.onAccountChange(
    counterPda,
    (accountInfo) => {
      const decoded = program.coder.accounts.decode(
        "Counter",
        accountInfo.data,
      );
      setCount(decoded.count.toNumber());
    },
    "confirmed",
  );

  return () => {
    connection.removeAccountChangeListener(subscriptionId);
  };
}, [counterPda, connection]);
\`\`\`

### Log Subscriptions

\`\`\`typescript
connection.onLogs(
  programId,
  (logs) => {
    if (logs.logs.some((l) => l.includes("LessonCompleted"))) {
      // Refresh user progress
      refetchProgress();
    }
  },
  "confirmed",
);
\`\`\`

### Polling Alternative

For simpler cases, polling works well:

\`\`\`typescript
const { data, refetch } = useQuery({
  queryKey: ["counter", counterPda],
  queryFn: () => program.account.counter.fetch(counterPda),
  refetchInterval: 5000, // Every 5 seconds
});
\`\`\``,
          },
          {
            id: "l38",
            title: "Production Best Practices",
            slug: "production-patterns",
            type: "content",
            duration: 40,
            order: 6,
            content: `## Production Best Practices

### 1. Use a Premium RPC

Free public RPCs have rate limits. Use Helius, QuickNode, or Triton:

\`\`\`typescript
const connection = new Connection(
  process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com",
);
\`\`\`

### 2. Priority Fees

During congestion, add priority fees for faster inclusion:

\`\`\`typescript
import { ComputeBudgetProgram } from "@solana/web3.js";

const tx = new Transaction()
  .add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 5000 }))
  .add(yourInstruction);
\`\`\`

### 3. Optimistic Updates

Update UI before confirmation, revert on failure:

\`\`\`typescript
// Optimistic: update immediately
setCount((prev) => prev + 1);

try {
  await program.methods.increment().accounts({...}).rpc();
} catch {
  // Revert on failure
  setCount((prev) => prev - 1);
  toast.error("Transaction failed");
}
\`\`\`

### 4. Bundle Transactions

Combine multiple instructions in one transaction:

\`\`\`typescript
const tx = new Transaction()
  .add(createAccountIx)
  .add(initializeIx)
  .add(setDataIx);
// One signature, one confirmation
await sendTransaction(tx, connection);
\`\`\`

> These patterns reduce costs, improve UX, and handle edge cases that trip up most web3 apps.`,
          },
          {
            id: "l39",
            title: "Format Address Challenge",
            slug: "build-dapp",
            type: "challenge",
            duration: 50,
            order: 7,
            challenge: {
              prompt:
                'Write a function called `formatAddress` that shortens a Solana public key for display. Return the first 4 characters, then "...", then the last 4 characters.\n\n**Example:**\n- `formatAddress("HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH")` → `"HN7c...YWrH"`',
              language: "typescript",
              starterCode:
                'function formatAddress(address: string): string {\n  // Return "first4...last4"\n}',
              solution:
                "function formatAddress(address: string): string {\n  return `${address.slice(0, 4)}...${address.slice(-4)}`;\n}",
              testCases: [
                {
                  input: '"HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH"',
                  expectedOutput: "HN7c...YWrH",
                  label: "Format Solana address",
                },
              ],
              hints: [
                "Use string slice to get first and last characters",
                "address.slice(0, 4) gives the first 4, address.slice(-4) gives the last 4",
              ],
            },
          },
        ],
      },
    ],
  },
];

export const COURSE_CARDS: CourseCardData[] = SAMPLE_COURSES.map((c) => ({
  id: c.id,
  title: c.title,
  slug: c.slug,
  description: c.description,
  thumbnail: c.thumbnail,
  difficulty: c.difficulty,
  trackName: c.track.name,
  trackColor: c.track.color,
  instructorName: c.instructor.name,
  instructorAvatar: c.instructor.avatar,
  totalLessons: c.totalLessons,
  totalDuration: c.totalDuration,
  totalXP: c.totalXP,
  bonusXP: c.bonusXP,
}));

export function getCourseBySlug(slug: string): Course | undefined {
  return SAMPLE_COURSES.find((c) => c.slug === slug);
}

export function getLessonById(courseSlug: string, lessonId: string) {
  const course = getCourseBySlug(courseSlug);
  if (!course) return null;
  for (const mod of course.modules) {
    const lesson = mod.lessons.find((l) => l.id === lessonId);
    if (lesson) return { lesson, module: mod, course };
  }
  return null;
}

export const TESTIMONIALS = [
  {
    name: "Rafael Costa",
    role: "Full Stack Developer",
    quote:
      "Superteam Academy transformed my career. I went from zero Solana knowledge to deploying my first program in just 2 weeks.",
    avatar: "https://img-cdn.magiceden.dev/rs:fill:800:0:0/plain/https%3A%2F%2Fmetadata.degods.com%2Fg%2F5124-dead-rm.png",
  },
  {
    name: "Camila Souza",
    role: "DeFi Developer",
    quote:
      "The interactive challenges and on-chain credentials make this the best learning platform for Solana. Highly recommend!",
    avatar: "https://img-cdn.magiceden.dev/rs:fill:800:0:0/plain/https%3A%2F%2Ffamousfoxes.com%2Fhd%2F1024.png",
  },
  {
    name: "Diego Lima",
    role: "Web3 Founder",
    quote:
      "The gamification keeps me coming back every day. My 45-day streak is proof that learning can be fun and addictive.",
    avatar: "https://img-cdn.magiceden.dev/rs:fill:800:0:0/plain/https%3A%2F%2Farweave.net%2FU6K-xxNBlhdwB3sSsiFdCDimWOz1n0BtU1mieuTJ-qc",
  },
];
