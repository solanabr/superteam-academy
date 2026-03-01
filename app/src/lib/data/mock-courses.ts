import type {
  Achievement,
  Course,
  Credential,
  LeaderboardEntry,
  UserProfile,
} from "@/types";

export const mockCourses: Course[] = [
  {
    id: "solana-mock-test",
    slug: "solana-mock-test",
    title: "Solana Development Fundamentals",
    subtitle: "Build on Solana from accounts to transactions",
    description:
      "A hands-on introduction to Solana development. Learn the account model, write transactions, derive PDAs, and work with the Anchor framework.",
    instructor: "Superteam Academy",
    difficulty: "intermediate",
    durationHours: 3.5,
    enrolledCount: 0,
    tags: ["Solana", "Anchor", "Rust"],
    prerequisites: ["Basic JavaScript or TypeScript familiarity", "Command-line basics"],
    outcomes: [
      "Understand Solana's account model and transaction lifecycle",
      "Derive and use PDAs in programs and clients",
      "Build and test an Anchor program end-to-end",
    ],
    gradient: "from-[#2f6b3f] via-[#3a7d4a] to-[#ffd23f]",
    modules: [
      {
        id: "solana-mock-test-m1",
        title: "Solana Core Concepts",
        description: "Accounts, transactions, and the Solana runtime",
        lessons: [
          {
            id: "lesson-0",
            title: "The Solana Account Model",
            kind: "content",
            durationMinutes: 25,
            objective: "Understand how Solana stores all state in accounts and how programs interact with them.",
            markdown: `### Accounts Are Everything

On Solana, **everything is an account**. Programs, token balances, NFT metadata — all stored in accounts on the ledger.

Each account has:
- \`pubkey\` — unique 32-byte address
- \`lamports\` — SOL balance (1 SOL = 1 billion lamports)
- \`owner\` — the program that controls this account
- \`data\` — arbitrary byte array (up to 10 MB)
- \`executable\` — whether this account is a program

### Key Rules

1. Only the **owner program** can modify an account's data
2. Anyone can **credit** lamports to an account
3. Only the owner can **debit** lamports
4. Account data is allocated at creation and cannot grow (without realloc)

### System Program

The System Program (\`11111111111111111111111111111111\`) owns all basic wallet accounts. When you "create" a new account, you're asking the System Program to allocate space and assign ownership.

\`\`\`typescript
const createAccountIx = SystemProgram.createAccount({
  fromPubkey: payer.publicKey,
  newAccountPubkey: newAccount.publicKey,
  lamports: rentExemptAmount,
  space: 100, // bytes
  programId: myProgramId,
});
\`\`\`

### Rent Exemption

Accounts must maintain a minimum lamport balance proportional to their data size. This is called **rent exemption**. If an account falls below this threshold, it gets garbage collected by the runtime.`,
          },
          {
            id: "lesson-1",
            title: "Transactions and Instructions",
            kind: "content",
            durationMinutes: 20,
            objective: "Learn how transactions bundle instructions and get processed by the runtime.",
            markdown: `### Transaction Structure

A Solana transaction contains:
- **Message**: one or more instructions + recent blockhash + fee payer
- **Signatures**: ed25519 signatures from required signers

### Instructions

Each instruction specifies:
- \`programId\` — which program to invoke
- \`keys\` — list of accounts the instruction reads/writes
- \`data\` — serialized arguments

\`\`\`typescript
const instruction = new TransactionInstruction({
  programId: PROGRAM_ID,
  keys: [
    { pubkey: account1, isSigner: true, isWritable: true },
    { pubkey: account2, isSigner: false, isWritable: false },
  ],
  data: Buffer.from([1, 0, 0, 0]),
});
\`\`\`

### Transaction Lifecycle

1. Client builds transaction with instructions
2. Client signs with required keypairs
3. Transaction sent to an RPC node
4. Leader validator executes all instructions atomically
5. If any instruction fails, **entire transaction reverts**

### Compute Units

Each transaction gets a compute budget (default 200,000 CU). Complex operations consume more CU. You can request up to 1.4M CU with a \`ComputeBudgetProgram.setComputeUnitLimit\` instruction.`,
          },
          {
            id: "lesson-2",
            title: "Challenge: Build a Transfer Instruction",
            kind: "challenge",
            durationMinutes: 30,
            objective: "Write a function that creates a SOL transfer instruction using @solana/web3.js.",
            markdown: `### Challenge

Write a function \`buildTransfer\` that takes a sender public key, recipient public key, and amount in lamports, and returns a \`TransactionInstruction\` for a SOL transfer.

### Requirements

- Use \`SystemProgram.transfer()\` from \`@solana/web3.js\`
- The sender must be marked as a signer and writable
- Return the instruction (not a full transaction)

### Hints

- \`SystemProgram.transfer()\` takes \`{ fromPubkey, toPubkey, lamports }\`
- Remember: 1 SOL = 1_000_000_000 lamports`,
            starterCode: `import { SystemProgram, PublicKey, TransactionInstruction } from "@solana/web3.js";

/**
 * Build a SOL transfer instruction.
 */
function buildTransfer(
  sender: PublicKey,
  recipient: PublicKey,
  lamports: number
): TransactionInstruction {
  // Your code here
}
`,
            expectedOutput: "buildTransfer returns TransactionInstruction: PASS\nbuildTransfer sets correct lamports: PASS",
          },
        ],
      },
      {
        id: "solana-mock-test-m2",
        title: "PDAs and Anchor Basics",
        description: "Program Derived Addresses and the Anchor framework",
        lessons: [
          {
            id: "lesson-3",
            title: "Program Derived Addresses (PDAs)",
            kind: "content",
            durationMinutes: 25,
            objective: "Understand how PDAs provide deterministic account addresses controlled by programs.",
            markdown: `### What Are PDAs?

Program Derived Addresses (PDAs) are special addresses that:
- Are **deterministic** — derived from seeds + program ID
- **Cannot** have a private key (they fall off the ed25519 curve)
- Can only be "signed for" by the owning program via \`invoke_signed\`

### Deriving PDAs

\`\`\`typescript
const [pda, bump] = PublicKey.findProgramAddressSync(
  [Buffer.from("enrollment"), courseId, learner.toBuffer()],
  programId
);
\`\`\`

The \`bump\` (0-255) is the first value that, when appended to the seeds, produces an address off the curve. Store it to avoid recomputing.

### Why PDAs Matter

1. **Deterministic lookups** — clients can derive the same address without querying
2. **Program authority** — programs can sign CPIs using PDA seeds
3. **Namespacing** — seeds create natural key-value mappings

### Common PDA Patterns

- Config: \`["config"]\`
- User profile: \`["user", wallet.toBuffer()]\`
- Enrollment: \`["enrollment", courseIdBytes, learner.toBuffer()]\`
- Vault: \`["vault", mint.toBuffer()]\``,
          },
          {
            id: "lesson-4",
            title: "Challenge: Derive a PDA",
            kind: "challenge",
            durationMinutes: 30,
            objective: "Write a function that derives an enrollment PDA from a course ID and learner public key.",
            markdown: `### Challenge

Write a function \`deriveEnrollmentPda\` that takes a course ID string and a learner PublicKey, and returns the PDA address and bump.

### Requirements

- Seeds: \`["enrollment", courseIdBytes, learnerPubkeyBytes]\`
- Use \`PublicKey.findProgramAddressSync()\`
- Return a tuple of \`[PublicKey, number]\``,
            starterCode: `import { PublicKey } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("5bzKJ9GdnR6FmnF4Udcza64Hgdiz5vtsX35szuKzXp7c");

function deriveEnrollmentPda(
  courseId: string,
  learner: PublicKey
): [PublicKey, number] {
  // Your code here
}
`,
            expectedOutput: "deriveEnrollmentPda returns valid PDA: PASS\nderiveEnrollmentPda bump is number 0-255: PASS",
          },
        ],
      },
    ],
  },
  {
    id: "token-2022-essentials",
    slug: "token-2022-essentials",
    title: "Token-2022 & SPL Tokens",
    subtitle: "Mint, transfer, and extend tokens on Solana",
    description:
      "Master the SPL Token program and Token-2022 extensions. Learn to create fungible tokens, set up mint authorities, and use extensions like NonTransferable and PermanentDelegate.",
    instructor: "Superteam Academy",
    difficulty: "intermediate",
    durationHours: 2.5,
    enrolledCount: 0,
    tags: ["Token-2022", "SPL", "DeFi"],
    prerequisites: ["Solana Development Fundamentals or equivalent"],
    outcomes: [
      "Create and manage SPL token mints",
      "Understand Associated Token Accounts (ATAs)",
      "Use Token-2022 extensions for soulbound tokens",
    ],
    gradient: "from-[#008c4c] via-[#2f6b3f] to-[#ffd23f]",
    modules: [
      {
        id: "token-2022-m1",
        title: "SPL Token Basics",
        description: "Mints, token accounts, and the token program",
        lessons: [
          {
            id: "t22-lesson-0",
            title: "Token Program Architecture",
            kind: "content",
            durationMinutes: 20,
            objective: "Understand how Solana's token programs manage fungible and non-fungible assets.",
            markdown: `### Two Token Programs

Solana has two token programs:
- **SPL Token** (\`TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA\`) — the original
- **Token-2022** (\`TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb\`) — extended version with built-in features

### Core Concepts

**Mint Account** — defines a token type: supply, decimals, mint authority, freeze authority.

**Token Account** — holds a balance of a specific mint for a specific owner. One owner can have multiple token accounts for the same mint.

**Associated Token Account (ATA)** — a deterministic token account derived from the owner's wallet and the mint address. Convention: one ATA per mint per wallet.

\`\`\`typescript
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

const ata = getAssociatedTokenAddressSync(
  mintPubkey,
  ownerPubkey,
  false,
  TOKEN_2022_PROGRAM_ID
);
\`\`\`

### Mint vs Transfer vs Burn

- **Mint** — create new tokens (requires mint authority)
- **Transfer** — move tokens between accounts (requires owner signature)
- **Burn** — destroy tokens (requires owner signature or delegate)`,
          },
          {
            id: "t22-lesson-1",
            title: "Token-2022 Extensions",
            kind: "content",
            durationMinutes: 25,
            objective: "Learn how Token-2022 extensions add functionality without CPIs.",
            markdown: `### Why Token-2022?

The original SPL Token program is frozen — no new features. Token-2022 adds **extensions** that are configured at mint creation time.

### Key Extensions

**NonTransferable** — tokens cannot be transferred between wallets. Perfect for XP, reputation, or soulbound tokens.

**PermanentDelegate** — a delegate that cannot be revoked. The program authority can always burn or transfer. Used for soulbound tokens where the program needs to manage lifecycle.

**TransferFee** — automatically collects a fee on every transfer.

**InterestBearing** — tokens accrue interest over time based on a configurable rate.

**DefaultAccountState** — new token accounts start frozen (require authority to unfreeze).

### Superteam Academy XP Token

The academy's XP token uses Token-2022 with:
- \`NonTransferable\` — XP cannot be sent to other wallets
- \`PermanentDelegate\` — the program can manage XP lifecycle
- \`0 decimals\` — XP is always a whole number

\`\`\`typescript
const balance = await connection.getTokenAccountBalance(xpAta);
const xpAmount = Number(balance.value.amount);
\`\`\``,
          },
          {
            id: "t22-lesson-2",
            title: "Creating a Token Mint",
            kind: "content",
            durationMinutes: 20,
            objective: "Walk through the process of creating a Token-2022 mint with extensions.",
            markdown: `### Creating a Mint

Creating a Token-2022 mint with extensions requires calculating the space needed for the extensions, then initializing the mint in the correct order.

\`\`\`typescript
import {
  createInitializeMintInstruction,
  getMintLen,
  ExtensionType,
  createInitializeNonTransferableMintInstruction,
  createInitializePermanentDelegateInstruction,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";

const extensions = [
  ExtensionType.NonTransferable,
  ExtensionType.PermanentDelegate,
];
const mintLen = getMintLen(extensions);
const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);
\`\`\`

### Instruction Order Matters

1. \`SystemProgram.createAccount\` — allocate space
2. Extension init instructions (NonTransferable, PermanentDelegate, etc.)
3. \`createInitializeMintInstruction\` — initialize the mint last

The mint authority is the account that can mint new tokens. For the academy, this is the Config PDA — meaning only the program can mint XP.`,
          },
        ],
      },
    ],
  },
  {
    id: "anchor-101",
    slug: "anchor-101",
    title: "Anchor Framework 101",
    subtitle: "Build programs faster with Anchor macros",
    description:
      "Learn the Anchor framework for Solana program development. Cover account validation macros, instruction handlers, error handling, events, and testing patterns.",
    instructor: "Superteam Academy",
    difficulty: "intermediate",
    durationHours: 4,
    enrolledCount: 0,
    tags: ["Anchor", "Rust", "Programs"],
    prerequisites: ["Solana Development Fundamentals", "Basic Rust syntax"],
    outcomes: [
      "Structure an Anchor program with accounts, instructions, and state",
      "Use Anchor constraints for account validation",
      "Write and run Anchor integration tests",
    ],
    gradient: "from-[#1a3a5c] via-[#2f6b3f] to-[#008c4c]",
    modules: [
      {
        id: "anchor-101-m1",
        title: "Anchor Program Structure",
        description: "Program layout, accounts, and instruction handlers",
        lessons: [
          {
            id: "a101-lesson-0",
            title: "Anatomy of an Anchor Program",
            kind: "content",
            durationMinutes: 25,
            objective: "Understand how Anchor programs are structured with declare_id, #[program], and account structs.",
            markdown: `### Anchor Overview

Anchor is a framework that reduces Solana program boilerplate. It provides:
- **Macros** for account validation (\`#[account]\`, \`#[derive(Accounts)]\`)
- **Auto-generated IDL** — interface definition for clients
- **Built-in serialization** via Borsh
- **Error handling** with custom error codes

### Program Structure

\`\`\`rust
use anchor_lang::prelude::*;

declare_id!("YourProgramIdHere");

#[program]
pub mod my_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.authority = ctx.accounts.authority.key();
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + Config::INIT_SPACE)]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Config {
    pub authority: Pubkey,
}
\`\`\`

### Key Components

- \`declare_id!\` — sets the program's public key
- \`#[program]\` — marks the instruction handler module
- \`Context<T>\` — provides validated accounts to each handler
- \`#[account]\` — marks a struct as a Solana account (auto-adds 8-byte discriminator)`,
          },
          {
            id: "a101-lesson-1",
            title: "Account Constraints",
            kind: "content",
            durationMinutes: 25,
            objective: "Learn Anchor's constraint system for secure account validation.",
            markdown: `### Constraint Macros

Anchor validates accounts before your instruction logic runs. If any constraint fails, the transaction reverts.

### Common Constraints

\`\`\`rust
#[derive(Accounts)]
pub struct Enroll<'info> {
    // PDA derivation + initialization
    #[account(
        init,
        payer = learner,
        space = 8 + Enrollment::INIT_SPACE,
        seeds = [b"enrollment", course.course_id.as_bytes(), learner.key().as_ref()],
        bump,
    )]
    pub enrollment: Account<'info, Enrollment>,

    // Read-only, validate it's active
    #[account(constraint = course.is_active @ ErrorCode::CourseNotActive)]
    pub course: Account<'info, Course>,

    // Must be a signer and mutable (pays rent)
    #[account(mut)]
    pub learner: Signer<'info>,

    pub system_program: Program<'info, System>,
}
\`\`\`

### Constraint Types

- \`init\` — create and initialize the account
- \`mut\` — account must be writable
- \`seeds\` + \`bump\` — PDA derivation and verification
- \`has_one\` — field must match another account's key
- \`constraint\` — arbitrary boolean expression
- \`close\` — close account and return lamports
- \`realloc\` — resize account data`,
          },
          {
            id: "a101-lesson-2",
            title: "Errors and Events",
            kind: "content",
            durationMinutes: 20,
            objective: "Define custom errors and emit events for off-chain indexing.",
            markdown: `### Custom Errors

\`\`\`rust
#[error_code]
pub enum ErrorCode {
    #[msg("Course is not active")]
    CourseNotActive,
    #[msg("Lesson already completed")]
    LessonAlreadyCompleted,
    #[msg("Arithmetic overflow")]
    Overflow,
}
\`\`\`

Use errors in constraints: \`@ ErrorCode::CourseNotActive\`

Or in handlers: \`require!(condition, ErrorCode::Overflow)\`

### Events

Events are emitted via transaction logs and indexed off-chain:

\`\`\`rust
#[event]
pub struct LessonCompleted {
    pub learner: Pubkey,
    pub course: Pubkey,
    pub lesson_index: u8,
    pub xp_earned: u64,
    pub timestamp: i64,
}

// In handler:
emit!(LessonCompleted {
    learner: ctx.accounts.learner.key(),
    course: ctx.accounts.course.key(),
    lesson_index,
    xp_earned: course.xp_per_lesson as u64,
    timestamp: Clock::get()?.unix_timestamp,
});
\`\`\`

### Client-Side Listening

\`\`\`typescript
program.addEventListener("LessonCompleted", (event) => {
  console.log("Lesson completed:", event.lessonIndex);
});
\`\`\``,
          },
        ],
      },
    ],
  },
  {
    id: "solana-security-basics",
    slug: "solana-security-basics",
    title: "Solana Security Essentials",
    subtitle: "Write secure programs from day one",
    description:
      "Learn common Solana program vulnerabilities, secure coding patterns, and audit checklists. Covers missing signer checks, account validation, arithmetic safety, and CPI guards.",
    instructor: "Superteam Academy",
    difficulty: "advanced",
    durationHours: 3,
    enrolledCount: 0,
    tags: ["Security", "Auditing", "Rust"],
    prerequisites: ["Anchor Framework 101 or equivalent", "Experience writing Solana programs"],
    outcomes: [
      "Identify and prevent common Solana vulnerabilities",
      "Apply secure arithmetic and account validation patterns",
      "Conduct a basic security review of an Anchor program",
    ],
    gradient: "from-[#7c2d12] via-[#991b1b] to-[#ffd23f]",
    modules: [
      {
        id: "security-m1",
        title: "Common Vulnerabilities",
        description: "Missing checks, overflows, and CPI exploits",
        lessons: [
          {
            id: "sec-lesson-0",
            title: "Missing Signer and Owner Checks",
            kind: "content",
            durationMinutes: 25,
            objective: "Understand why every account must be validated and how missing checks lead to exploits.",
            markdown: `### The #1 Solana Vulnerability

Missing account validation is the most common vulnerability in Solana programs. Without Anchor's constraints, you must manually verify:

1. **Is the signer correct?** — anyone can call your instruction
2. **Is the account owned by the expected program?** — someone can pass a fake account
3. **Is the account data in the expected state?** — stale or manipulated data

### Example: Missing Signer Check

\`\`\`rust
// VULNERABLE — anyone can call this
pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    // transfers without verifying authority
    transfer_tokens(ctx.accounts.vault, ctx.accounts.destination, amount)?;
    Ok(())
}
\`\`\`

### Fixed with Anchor

\`\`\`rust
#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(
        has_one = authority,
        seeds = [b"vault"],
        bump = vault.bump,
    )]
    pub vault: Account<'info, Vault>,
    pub authority: Signer<'info>,  // MUST sign
    #[account(mut)]
    pub destination: AccountInfo<'info>,
}
\`\`\`

### Owner Check

Always verify the owner program. Anchor does this automatically for \`Account<'info, T>\` but NOT for \`AccountInfo<'info>\` or \`UncheckedAccount<'info>\`.

\`\`\`rust
// Manual owner check for raw accounts
require!(
    account.owner == &expected_program_id,
    ErrorCode::InvalidOwner
);
\`\`\``,
          },
          {
            id: "sec-lesson-1",
            title: "Arithmetic Safety",
            kind: "content",
            durationMinutes: 20,
            objective: "Prevent integer overflow/underflow using checked math operations.",
            markdown: `### The Problem

Rust integers wrap on overflow in release mode. A u64 wrapping from \`u64::MAX + 1\` back to \`0\` can drain a vault or mint infinite tokens.

### Safe Arithmetic

**Always use checked operations:**

\`\`\`rust
let total = amount_a
    .checked_add(amount_b)
    .ok_or(ErrorCode::Overflow)?;

let share = total_xp
    .checked_mul(user_share)
    .ok_or(ErrorCode::Overflow)?
    .checked_div(total_shares)
    .ok_or(ErrorCode::Overflow)?;
\`\`\`

### Superteam Academy Pattern

The academy program computes the completion bonus as:

\`\`\`rust
let bonus = (course.xp_per_lesson as u64)
    .checked_mul(course.lesson_count as u64)
    .ok_or(ErrorCode::Overflow)?
    .checked_div(2)
    .ok_or(ErrorCode::Overflow)?;
\`\`\`

### Rules

- **Never** use \`+\`, \`-\`, \`*\`, \`/\` on untrusted values
- **Never** cast with \`as\` without bounds checking
- Use \`checked_add\`, \`checked_sub\`, \`checked_mul\`, \`checked_div\`
- For percentages, multiply before dividing to minimize rounding loss`,
          },
          {
            id: "sec-lesson-2",
            title: "CPI Safety and Reentrancy",
            kind: "content",
            durationMinutes: 25,
            objective: "Understand Cross-Program Invocation risks and how to guard against reentrancy.",
            markdown: `### What is CPI?

Cross-Program Invocation (CPI) lets your program call another program. Common CPIs:
- Token transfers (SPL Token / Token-2022)
- NFT minting (Metaplex Core)
- System program account creation

### CPI Risks

**1. Fake Program ID** — always verify the target program:

\`\`\`rust
// Anchor handles this with Program<'info, Token2022>
// For manual CPI:
require!(
    ctx.accounts.token_program.key() == &spl_token_2022::ID,
    ErrorCode::InvalidProgram
);
\`\`\`

**2. Stale Account Data** — after a CPI that modifies an account, your local copy is stale. Reload it:

\`\`\`rust
ctx.accounts.enrollment.reload()?;
\`\`\`

**3. Reentrancy** — a called program could call back into your program. Solana's runtime prevents direct reentrancy (a program cannot call itself), but indirect reentrancy through a third program is possible. Guard with state flags:

\`\`\`rust
require!(!config.locked, ErrorCode::Reentrancy);
config.locked = true;
// ... perform CPI ...
config.locked = false;
\`\`\`

### Audit Checklist

- [ ] All CPIs target verified program IDs
- [ ] Accounts are reloaded after mutable CPIs
- [ ] PDA signers use stored bumps (not recomputed)
- [ ] No arithmetic overflow in fee/reward calculations
- [ ] All signer checks enforced
- [ ] Token account owners match expected wallets`,
          },
        ],
      },
    ],
  },
];

export const mockLeaderboard: LeaderboardEntry[] = [
  {
    userId: "u-camila",
    username: "camila.sol",
    avatar: "https://api.dicebear.com/9.x/glass/svg?seed=camila",
    country: "BR",
    xp: 28400,
    level: 16,
    weeklyGain: 1450,
    badges: ["Audit Ace", "Anchor Veteran"],
  },
  {
    userId: "u-diego",
    username: "diego.dev",
    avatar: "https://api.dicebear.com/9.x/glass/svg?seed=diego",
    country: "AR",
    xp: 27100,
    level: 16,
    weeklyGain: 1280,
    badges: ["cNFT Builder", "Streak 30"],
  },
  {
    userId: "u-luana",
    username: "luana.anchor",
    avatar: "https://api.dicebear.com/9.x/glass/svg?seed=luana",
    country: "BR",
    xp: 25220,
    level: 15,
    weeklyGain: 1120,
    badges: ["Mentor", "Bug Hunter"],
  },
  {
    userId: "u-max",
    username: "maxxvalidator",
    avatar: "https://api.dicebear.com/9.x/glass/svg?seed=max",
    country: "US",
    xp: 24110,
    level: 15,
    weeklyGain: 970,
    badges: ["Runtime Expert"],
  },
  {
    userId: "u-sofia",
    username: "sofia.nft",
    avatar: "https://api.dicebear.com/9.x/glass/svg?seed=sofia",
    country: "MX",
    xp: 22980,
    level: 15,
    weeklyGain: 900,
    badges: ["Creator", "Collection Lead"],
  },
];

export const mockProfiles: UserProfile[] = [
  {
    id: "u-camila",
    username: "camila.sol",
    displayName: "Camila Silva",
    bio: "Solana educator focused on secure protocol design and developer enablement.",
    location: "Sao Paulo, BR",
    avatar: "https://api.dicebear.com/9.x/glass/svg?seed=camila",
    walletAddress: "5XnVjQYw2vV5xB7BnzH4JDuwxb9fADUan6P6Jg6A8Wdp",
    xp: 28400,
    level: 16,
    enrolledCourseIds: ["solana-mock-test"],
    interests: ["Auditing", "Anchor", "Protocol Design"],
    skills: {
      "Smart Contract Security": 94,
      Anchor: 89,
      DeFi: 83,
      "Token Engineering": 71,
      "Frontend dApps": 64,
    },
  },
];

export const mockAchievements: Achievement[] = [
  {
    id: "ach-first-lesson",
    title: "Genesis Step",
    description: "Complete your first lesson",
    icon: "Rocket",
    xpReward: 40,
    rarity: "common",
    unlocked: true,
  },
  {
    id: "ach-7-day",
    title: "Relentless",
    description: "Keep a 7-day learning streak",
    icon: "Flame",
    xpReward: 120,
    rarity: "rare",
    unlocked: false,
  },
  {
    id: "ach-audit",
    title: "Exploit Hunter",
    description: "Finish Security Auditing track",
    icon: "Shield",
    xpReward: 320,
    rarity: "epic",
    unlocked: false,
  },
];

export const mockCredentials: Credential[] = [
  {
    id: "cred-solana-dev",
    courseId: "solana-mock-test",
    title: "Solana Development Fundamentals Credential",
    issuedAt: "2026-02-20T11:20:00.000Z",
    issuer: "Superteam Academy",
    imageUri: "https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&w=600&q=80",
    txSignature: "4hM3mkY7fH9U1UGMDCbLEoyTj2r6n8yNEQ5rxpVwq2pTfY4q3d4qFVeV8wHzqAdDk8xqWm3w2BPfQ5",
  },
];

export const landingTestimonials = [
  {
    name: "Fernanda Costa",
    role: "Protocol Engineer at Solana Startup",
    quote: "Superteam Academy helped me move from Solidity to shipping Anchor programs with confidence.",
  },
  {
    name: "Tiago Mendes",
    role: "Security Researcher",
    quote: "The auditing track mirrors real engagements. I used the checklist in two paid reviews already.",
  },
  {
    name: "Daniel Ortiz",
    role: "DevRel Lead",
    quote: "The curriculum is practical, not generic. Every module ends with something you can demo.",
  },
];
