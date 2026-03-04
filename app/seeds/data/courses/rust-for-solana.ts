export function getRustForSolanaCourse() {
  return {
    slug: "rust-for-solana",
    title: "Rust for Solana Developers",
    description:
      "Master Rust from the ground up — ownership, borrowing, error handling, and Borsh serialization — building toward your first on-chain Solana program.",
    difficulty: "beginner",
    duration: "6 hours",
    xpTotal: 600,
    trackId: 2,
    trackLevel: 1,
    trackName: "Rust for Solana",
    creator: "Superteam Brazil",
    tags: ["rust", "ownership", "borsh", "solana", "programs"],
    prerequisites: ["intro-to-solana"],
    modules: {
      create: [
        // ────────────────────────────────────────────────────────────────────
        // Module 1: Rust Foundations
        // ────────────────────────────────────────────────────────────────────
        {
          title: "Rust Foundations",
          description:
            "Core Rust syntax, types, and functions — the building blocks you need before writing on-chain code.",
          order: 0,
          lessons: {
            create: [
              // Lesson 1.1 — Why Rust for Solana? (content)
              {
                title: "Why Rust for Solana?",
                description:
                  "Understanding why Solana chose Rust and what that means for you",
                type: "content",
                order: 0,
                xpReward: 20,
                duration: "15 min",
                content: `# Why Rust for Solana?

Solana programs are written in Rust — not TypeScript, not Go, not C++. This is a deliberate choice that shapes everything about the Solana developer experience. Understanding *why* will help you appreciate the constraints you'll encounter.

## The Core Requirement: Safety Without a GC

Solana's runtime executes programs in a sandboxed BPF (Berkeley Packet Filter) virtual machine. Every on-chain program must:

- **Run deterministically** — the same inputs always produce the same outputs
- **Respect a compute unit budget** — no unbounded loops or allocations
- **Never panic unexpectedly** — a panic halts the transaction

These constraints rule out languages with garbage collectors (Go, Java, Python). A GC pause in a transaction would be unpredictable and impossible to bound within a compute budget.

Rust gives Solana exactly what it needs:

\`\`\`
Memory Safety ─── No GC, no null pointer dereferences, no data races
Performance  ─── Zero-cost abstractions, no runtime overhead
Determinism  ─── No hidden allocation or GC pauses
Control      ─── Fine-grained memory layout for Borsh serialization
\`\`\`

## The BPF Target

Solana compiles Rust to **BPF bytecode** via the \`bpfel-unknown-unknown\` target:

\`\`\`bash
# What anchor build does under the hood:
cargo build-bpf --manifest-path programs/my_program/Cargo.toml

# Produces: target/deploy/my_program.so (ELF shared object, BPF ISA)
\`\`\`

The BPF VM provides a restricted environment:
- **No OS syscalls** — no file I/O, no network, no threads
- **Stack size limit** — 4 KB default stack frame
- **Compute budget** — 200,000 CU default per transaction (configurable up to 1.4M)
- **Heap** — 32 KB bump allocator (no \`free\`)

These constraints drive Rust idioms you'll use constantly in Solana programs: stack-allocated structs, avoiding deep recursion, and being explicit about memory layout.

## What You Will Build

Over this course, you will write progressively more complex Rust programs, culminating in a fully functional on-chain counter program. Here is the arc:

\`\`\`
Module 1: Rust syntax, types, functions, control flow
Module 2: Ownership, borrowing, structs, enums
Module 3: Result/Option, custom errors, safe arithmetic
Module 4: Borsh serialization, minimal Solana program
\`\`\`

By the end, you will understand not just how to write Rust, but *why* it is written the way it is in the Solana ecosystem.

## Rust vs TypeScript: A Mental Model Shift

If you come from JavaScript/TypeScript, the biggest shift is that **Rust requires you to think about memory at compile time**:

| TypeScript | Rust |
|-----------|------|
| Variables are references by default | Variables own their values by default |
| Garbage collector frees memory | You control lifetimes explicitly |
| Runtime null checks | \`Option<T>\` encoded in the type system |
| Runtime errors throw exceptions | Errors are values (\`Result<T, E>\`) |
| Any type assignable | Strict nominal typing |

This strictness feels like friction at first. But it's exactly why Rust programs on Solana are safe to deploy with real money at stake.

In the next lesson, we'll get hands-on with variables, types, and functions.`,
              },

              // Lesson 1.2 — Variables, Types, and Functions (content)
              {
                title: "Variables, Types, and Functions",
                description:
                  "Rust's type system, variable bindings, and function signatures",
                type: "content",
                order: 1,
                xpReward: 25,
                duration: "20 min",
                content: `# Variables, Types, and Functions

Rust's type system is strict and expressive. Every variable has a known type at compile time, and the compiler catches a wide range of bugs before your code ever runs — let alone reaches mainnet.

## Variable Bindings

\`\`\`rust
// Immutable by default
let x = 5;
// x = 6; // ERROR: cannot assign twice to immutable variable

// Explicit mutability
let mut count: u64 = 0;
count += 1;

// Shadowing (useful for transformations)
let balance = "1000";
let balance: u64 = balance.parse().unwrap(); // same name, new type
\`\`\`

In Solana programs, you'll almost always want **explicit type annotations** for clarity:

\`\`\`rust
let lamports: u64 = 1_000_000; // 0.001 SOL (underscore separators are allowed)
let slot: u64 = ctx.accounts.clock.slot;
let pubkey: Pubkey = ctx.accounts.authority.key();
\`\`\`

## Primitive Types

| Type | Bits | Range | Solana Use |
|------|------|-------|------------|
| \`u8\` | 8 | 0–255 | Bump seeds, flags |
| \`u32\` | 32 | 0–4B | Counts, indices |
| \`u64\` | 64 | 0–18.4 quintillion | Lamports, XP amounts |
| \`i64\` | 64 | ±9.2 quintillion | Timestamps |
| \`bool\` | 8 | true/false | Feature flags |
| \`[u8; 32]\` | 256 | — | Raw pubkeys |

**Critical:** Never use \`usize\` in on-chain code. Its size differs between 32-bit and 64-bit targets, which can break Borsh serialization and cross-platform account parsing.

## The Pubkey Type

\`Pubkey\` is a 32-byte type from \`solana_program\`:

\`\`\`rust
use solana_program::pubkey::Pubkey;

// From a literal (base58)
let mint: Pubkey = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
    .parse()
    .unwrap();

// Derive a PDA
let seeds = &[b"vault", authority.key().as_ref()];
let (vault_pda, bump) = Pubkey::find_program_address(seeds, &program_id);
\`\`\`

## Functions

Rust functions are declared with \`fn\`. The last expression in a block is the return value (no semicolon needed):

\`\`\`rust
// Explicit return type
fn lamports_to_sol(lamports: u64) -> f64 {
    lamports as f64 / 1_000_000_000.0
}

// Returning from a block expression
fn checked_add(a: u64, b: u64) -> Option<u64> {
    a.checked_add(b) // returns None on overflow
}

// Unit return (no meaningful value)
fn log_amount(label: &str, amount: u64) {
    msg!("{}: {} lamports", label, amount);
} // implicit ()
\`\`\`

**In Solana programs, always use checked arithmetic:**

\`\`\`rust
// BAD: can overflow silently in release builds
let new_balance = current + deposit;

// GOOD: returns Result, propagate the error
let new_balance = current
    .checked_add(deposit)
    .ok_or(MyError::Overflow)?;
\`\`\`

## Type Inference

The compiler infers types from context:

\`\`\`rust
let balances = vec![100u64, 200, 300]; // compiler infers Vec<u64>
let total: u64 = balances.iter().sum(); // infers u64 from annotation
\`\`\`

## Constants and Statics

\`\`\`rust
// Constants are inlined at every use site
const XP_PER_LESSON: u64 = 50;
const MAX_USERNAME_LEN: usize = 32;

// Statics have a fixed memory address (rare in programs)
static PLATFORM_FEE_BPS: u64 = 250; // 2.5%
\`\`\`

In the next lesson, we'll cover control flow and pattern matching — where Rust's expressiveness really shines.`,
              },

              // Lesson 1.3 — Control Flow and Pattern Matching (content)
              {
                title: "Control Flow and Pattern Matching",
                description:
                  "if/else, loops, and Rust's powerful match expression",
                type: "content",
                order: 2,
                xpReward: 25,
                duration: "20 min",
                content: `# Control Flow and Pattern Matching

Rust's control flow looks familiar, but \`match\` and \`if let\` are significantly more powerful than their equivalents in most languages. You'll use them constantly in Solana programs for error handling and account inspection.

## if / else

\`if\` is an expression in Rust — it returns a value:

\`\`\`rust
let fee = if amount > 1_000_000 {
    amount / 100 // 1%
} else {
    5_000 // flat 5000 lamports
};

// Or as a statement
if slot > deadline {
    return Err(MyError::ChallengeExpired.into());
}
\`\`\`

## Loops

\`\`\`rust
// Infinite loop with early return
let result = loop {
    let attempt = try_something();
    if attempt.is_ok() {
        break attempt.unwrap();
    }
};

// Iterator-based (preferred in on-chain code — bounded)
let total_xp: u64 = lessons
    .iter()
    .filter(|l| l.completed)
    .map(|l| l.xp_reward)
    .sum();

// for loop over a range
for i in 0..MAX_RETRIES {
    if validate(i).is_ok() {
        break;
    }
}
\`\`\`

**Avoid \`while true\` loops** in on-chain code — they can burn compute units unpredictably. Always use bounded iteration.

## match

\`match\` is exhaustive pattern matching — the compiler ensures every case is handled:

\`\`\`rust
#[derive(Debug)]
enum LessonType {
    Content,
    Challenge { language: String },
    Quiz,
}

fn compute_units_estimate(lesson: &LessonType) -> u32 {
    match lesson {
        LessonType::Content => 5_000,
        LessonType::Challenge { language } if language == "rust" => 20_000,
        LessonType::Challenge { .. } => 15_000,
        LessonType::Quiz => 8_000,
    }
}
\`\`\`

In Solana programs, \`match\` is the idiomatic way to handle \`Result\` and \`Option\`:

\`\`\`rust
match account.try_borrow_data() {
    Ok(data) if data.len() >= 8 => {
        // valid account data
    }
    Ok(_) => return Err(MyError::InvalidAccountData.into()),
    Err(e) => return Err(e.into()),
}
\`\`\`

## if let and while let

When you only care about one variant:

\`\`\`rust
// Instead of:
match enrollment {
    Some(e) => process(e),
    None => {}
}

// Use:
if let Some(enrollment) = enrollment {
    process(enrollment);
}

// Drain a queue until empty
while let Some(item) = queue.pop_front() {
    handle(item)?;
}
\`\`\`

## The ? Operator

The \`?\` operator is syntactic sugar for early-return on error. It is the most common control flow idiom in Solana programs:

\`\`\`rust
fn transfer_lamports(
    from: &AccountInfo,
    to: &AccountInfo,
    amount: u64,
) -> Result<()> {
    let balance = from.lamports();

    // Each ? either unwraps the Ok or returns the Err early
    let new_from = balance.checked_sub(amount).ok_or(MyError::InsufficientFunds)?;
    let new_to = to.lamports().checked_add(amount).ok_or(MyError::Overflow)?;

    **from.try_borrow_mut_lamports()? = new_from;
    **to.try_borrow_mut_lamports()? = new_to;

    Ok(())
}
\`\`\`

Mastering \`?\` will make your program code significantly cleaner. In the next lesson, you'll apply everything with a challenge.`,
              },

              // Lesson 1.4 — Challenge: Token Amount Calculator (challenge, typescript)
              {
                title: "Challenge: Token Amount Calculator",
                description:
                  "Write TypeScript functions to convert between token amounts and decimals",
                type: "challenge",
                order: 3,
                xpReward: 60,
                duration: "25 min",
                content: null,
                challenge: {
                  create: {
                    prompt:
                      "Implement a token amount calculator library. On Solana, token amounts are stored as raw integers without decimals. For example, 1 USDC (6 decimals) is stored as 1,000,000 on-chain. Write three functions:\n\n1. `toRawAmount(uiAmount: number, decimals: number): bigint` — converts a human-readable amount to its on-chain raw representation\n2. `toUiAmount(rawAmount: bigint, decimals: number): number` — converts a raw on-chain amount to a human-readable number\n3. `formatTokenAmount(rawAmount: bigint, decimals: number, symbol: string): string` — returns a formatted string like '1.50 USDC'\n\nAll functions must handle edge cases: zero amounts, very large amounts (u64 max), and rounding correctly.",
                    starterCode: `// Token Amount Calculator
// Solana stores all token amounts as raw integers (no decimals)
// 1 USDC = 1_000_000 (6 decimals)
// 1 SOL  = 1_000_000_000 (9 decimals, lamports)

/**
 * Convert a UI amount (e.g. 1.5) to its raw on-chain representation.
 * @param uiAmount - Human-readable amount (e.g. 1.5)
 * @param decimals - Token decimal places (e.g. 6 for USDC, 9 for SOL)
 * @returns Raw on-chain amount as bigint
 */
export function toRawAmount(uiAmount: number, decimals: number): bigint {
  // TODO: Multiply uiAmount by 10^decimals and return as bigint
  // Hint: Use Math.round() to handle floating point imprecision
}

/**
 * Convert a raw on-chain amount to a UI amount.
 * @param rawAmount - Raw on-chain amount (bigint)
 * @param decimals - Token decimal places
 * @returns Human-readable number
 */
export function toUiAmount(rawAmount: bigint, decimals: number): number {
  // TODO: Divide rawAmount by 10^decimals
  // Hint: Convert bigint to number before dividing
}

/**
 * Format a raw token amount as a human-readable string.
 * @param rawAmount - Raw on-chain amount
 * @param decimals - Token decimal places
 * @param symbol - Token symbol (e.g. "USDC", "SOL")
 * @returns Formatted string, e.g. "1.500000 USDC"
 */
export function formatTokenAmount(
  rawAmount: bigint,
  decimals: number,
  symbol: string
): string {
  // TODO: Convert to UI amount and format with \`decimals\` decimal places
  // Example output: "1.500000 USDC" for 1_500_000 raw USDC
}`,
                    language: "typescript",
                    hints: [
                      "For `toRawAmount`, use `BigInt(Math.round(uiAmount * Math.pow(10, decimals)))` to avoid floating-point drift.",
                      "For `toUiAmount`, cast the bigint to Number first: `Number(rawAmount) / Math.pow(10, decimals)`.",
                      "For `formatTokenAmount`, use `.toFixed(decimals)` to get the right number of decimal places, then append a space and the symbol.",
                      "The maximum safe u64 value is 18_446_744_073_709_551_615n — make sure your bigint conversion handles values this large.",
                    ],
                    solution: `export function toRawAmount(uiAmount: number, decimals: number): bigint {
  return BigInt(Math.round(uiAmount * Math.pow(10, decimals)));
}

export function toUiAmount(rawAmount: bigint, decimals: number): number {
  return Number(rawAmount) / Math.pow(10, decimals);
}

export function formatTokenAmount(
  rawAmount: bigint,
  decimals: number,
  symbol: string
): string {
  const ui = toUiAmount(rawAmount, decimals);
  return \`\${ui.toFixed(decimals)} \${symbol}\`;
}`,
                    testCases: {
                      create: [
                        {
                          name: "toRawAmount: 1.5 USDC → 1_500_000",
                          input: "toRawAmount(1.5, 6)",
                          expectedOutput: "1500000n",
                          order: 0,
                        },
                        {
                          name: "toUiAmount: 1_000_000_000 lamports → 1 SOL",
                          input: "toUiAmount(1000000000n, 9)",
                          expectedOutput: "1",
                          order: 1,
                        },
                        {
                          name: "formatTokenAmount: 2_500_000 → '2.500000 USDC'",
                          input: "formatTokenAmount(2500000n, 6, 'USDC')",
                          expectedOutput: "2.500000 USDC",
                          order: 2,
                        },
                        {
                          name: "toRawAmount: zero amount",
                          input: "toRawAmount(0, 9)",
                          expectedOutput: "0n",
                          order: 3,
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
        // Module 2: Ownership and Borrowing
        // ────────────────────────────────────────────────────────────────────
        {
          title: "Ownership and Borrowing",
          description:
            "The ownership system is Rust's most distinctive feature — and the key to safe on-chain memory management.",
          order: 1,
          lessons: {
            create: [
              // Lesson 2.1 — Ownership Rules (content)
              {
                title: "Ownership Rules",
                description:
                  "Rust's three ownership rules and why they matter on Solana",
                type: "content",
                order: 0,
                xpReward: 30,
                duration: "25 min",
                content: `# Ownership Rules

Rust's ownership system is the language's most distinctive feature. It enables memory safety without a garbage collector — and it is precisely why Solana chose Rust for on-chain programs.

## The Three Rules

Every Rust value has exactly one owner at any time. When ownership is clear, memory management is automatic and safe:

\`\`\`
Rule 1: Each value has exactly one owner (variable).
Rule 2: When the owner goes out of scope, the value is dropped (freed).
Rule 3: A value can be moved to a new owner, but the old owner becomes invalid.
\`\`\`

Let's see these rules in action:

\`\`\`rust
{
    let s = String::from("hello"); // s owns the String

    let t = s; // Ownership MOVES to t; s is now invalid

    // println!("{}", s); // COMPILE ERROR: value moved
    println!("{}", t); // OK: t owns the String

} // t goes out of scope here; String is freed automatically
\`\`\`

## Why This Matters On-Chain

In Solana programs, you frequently work with \`AccountInfo\` structures borrowed from the runtime. The ownership rules prevent double-borrows, use-after-free, and other memory bugs that could compromise program correctness:

\`\`\`rust
pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo], // borrowed slice — we don't own these
    data: &[u8],
) -> ProgramResult {
    let account = &accounts[0]; // borrow the first account

    // We can read from the borrowed account
    let lamports = account.lamports();

    // We cannot move accounts[0] out of the slice
    // — it would invalidate the runtime's reference

    Ok(())
}
\`\`\`

## Stack vs Heap

Understanding where data lives helps you reason about ownership:

\`\`\`
Stack                          Heap
─────────────────────          ──────────────────────────────
Fixed size, fast access        Dynamic size, pointer access
Owned by the current frame     Shared via Box<T>, Vec<T>, etc.

let x: u64 = 42;      ──────► stored on stack (8 bytes)
let v: Vec<u8> = ...; ──────► pointer on stack → data on heap
\`\`\`

In BPF programs, prefer **stack-allocated types**:
- Use arrays \`[u8; 32]\` instead of \`Vec<u8>\` where the size is known
- Use \`&str\` slices instead of \`String\`
- Avoid deep \`Box<T>\` nesting

The BPF heap is only 32 KB and does not support \`free\` — every allocation is permanent for the transaction.

## Clone vs Copy

Types that implement \`Copy\` are duplicated bitwise when assigned — no ownership transfer:

\`\`\`rust
// u64 is Copy — no ownership transfer
let x: u64 = 100;
let y = x; // x is still valid
println!("{} {}", x, y); // OK

// [u8; 32] is Copy (all fixed-size arrays of Copy types are Copy)
let pubkey_bytes: [u8; 32] = [0u8; 32];
let copy = pubkey_bytes; // independent copy

// String is NOT Copy — it moves
let s = String::from("hello");
let t = s.clone(); // explicit deep copy — heap allocation
\`\`\`

\`Pubkey\` implements \`Copy\`, which is why you can pass pubkeys around freely without explicit clones. In the next lesson, we'll see how references and slices let you share data without transferring ownership.`,
              },

              // Lesson 2.2 — References and Slices (content)
              {
                title: "References and Slices",
                description:
                  "Borrowing data with references without transferring ownership",
                type: "content",
                order: 1,
                xpReward: 30,
                duration: "25 min",
                content: `# References and Slices

Borrowing lets you use a value without taking ownership. This is how Solana programs pass account data around — the runtime owns the accounts, and your program borrows them for the duration of the instruction.

## Immutable References

\`\`\`rust
fn print_balance(account: &AccountInfo) { // borrows, does not own
    println!("Balance: {}", account.lamports());
} // account is dropped here, but the AccountInfo lives on

let my_account = &accounts[0]; // borrow
print_balance(my_account);     // passes the borrow
print_balance(my_account);     // can borrow multiple times!
\`\`\`

The borrow checker enforces that the original data outlives all references to it:

\`\`\`rust
let r: &u64;
{
    let x: u64 = 42;
    r = &x; // ERROR: x will be dropped before r is used
}
// r would be a dangling pointer — Rust rejects this at compile time
\`\`\`

## Mutable References

You can have exactly **one mutable reference** to a value at a time, with no other references active:

\`\`\`rust
let mut count: u64 = 0;

let r1 = &mut count;
// let r2 = &mut count; // COMPILE ERROR: cannot borrow mutably twice
// let r3 = &count;     // COMPILE ERROR: cannot mix with immutable ref

*r1 += 1; // dereference to modify
\`\`\`

In Solana programs, this rule prevents a common bug class: simultaneous mutable access to the same account data.

## RefCell and Runtime Borrow Checking

Anchor and the Solana runtime use \`RefCell\` internally for account data — borrowing is checked at runtime rather than compile time:

\`\`\`rust
// Anchor account fields use RefCell internally
// You access them via .try_borrow() and .try_borrow_mut()

let data = account.try_borrow_data()?;       // runtime immutable borrow
let mut data = account.try_borrow_mut_data()?; // runtime mutable borrow

// CAUTION: This panics at runtime:
let _a = account.try_borrow_data()?;
let _b = account.try_borrow_mut_data()?; // already borrowed!
\`\`\`

## Slices

A slice is a view into a contiguous sequence — a reference to a portion of an array or \`Vec\`:

\`\`\`rust
let data: Vec<u8> = vec![0, 1, 2, 3, 4, 5, 6, 7];

let discriminator: &[u8] = &data[0..8];   // first 8 bytes
let payload: &[u8] = &data[8..];          // the rest

// &str is just a &[u8] slice that is valid UTF-8
let s: &str = "hello";                    // string slice — no heap allocation
\`\`\`

Slices are the idiomatic way to pass account data in raw Solana programs:

\`\`\`rust
pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo], // slice of all accounts
    instruction_data: &[u8],  // slice of serialized instruction
) -> ProgramResult {
    // Parse the first byte as an instruction discriminator
    let instruction = instruction_data
        .first()
        .ok_or(ProgramError::InvalidInstructionData)?;

    match instruction {
        0 => initialize(accounts, &instruction_data[1..]),
        1 => increment(accounts),
        _ => Err(ProgramError::InvalidInstructionData),
    }
}
\`\`\`

## Lifetime Annotations

Lifetimes tell the compiler how long references are valid. In most cases, the compiler infers them. In Anchor programs, you'll see the \`'info\` lifetime frequently:

\`\`\`rust
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + MyAccount::INIT_SPACE)]
    pub my_account: Account<'info, MyAccount>, // 'info: lives as long as the instruction

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}
\`\`\`

The \`'info\` lifetime ensures all account references are valid for the duration of your instruction handler.`,
              },

              // Lesson 2.3 — Structs and Enums (content)
              {
                title: "Structs and Enums",
                description:
                  "Defining custom data types that map directly to on-chain account layouts",
                type: "content",
                order: 2,
                xpReward: 30,
                duration: "20 min",
                content: `# Structs and Enums

Structs and enums are the backbone of Solana account layouts. Every on-chain account stores data that maps directly to a Rust struct, serialized with Borsh.

## Structs

A struct is a named collection of fields:

\`\`\`rust
// A simple on-chain account for a learner's progress
#[derive(Debug, Clone)]
pub struct LearnerProfile {
    pub authority: Pubkey,    // 32 bytes
    pub xp_balance: u64,      // 8 bytes
    pub lessons_completed: u32, // 4 bytes
    pub streak_days: u16,     // 2 bytes
    pub is_active: bool,      // 1 byte
    pub bump: u8,             // 1 byte — PDA bump seed
}
// Total: 48 bytes + 8-byte Anchor discriminator = 56 bytes
\`\`\`

In Anchor, you annotate structs with \`#[account]\` and \`#[derive(InitSpace)]\` to automatically calculate the required allocation size:

\`\`\`rust
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct LearnerProfile {
    pub authority: Pubkey,
    pub xp_balance: u64,
    pub lessons_completed: u32,
    pub streak_days: u16,
    pub is_active: bool,
    pub bump: u8,
}
// Space required: 8 (discriminator) + LearnerProfile::INIT_SPACE
\`\`\`

## Struct Methods

Implement methods on structs with \`impl\`:

\`\`\`rust
impl LearnerProfile {
    // Associated function (no self) — like a constructor
    pub fn new(authority: Pubkey, bump: u8) -> Self {
        Self {
            authority,
            xp_balance: 0,
            lessons_completed: 0,
            streak_days: 0,
            is_active: true,
            bump,
        }
    }

    // Method (takes &self or &mut self)
    pub fn add_xp(&mut self, amount: u64) -> Result<()> {
        self.xp_balance = self.xp_balance
            .checked_add(amount)
            .ok_or(error!(MyError::XpOverflow))?;
        Ok(())
    }
}
\`\`\`

## Enums

Enums in Rust are **algebraic data types** — each variant can carry different data:

\`\`\`rust
#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub enum CourseStatus {
    Draft,
    Active,
    Archived { reason: [u8; 32] }, // carries a message
}

#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub enum LessonType {
    Content,
    Challenge,
    Quiz { pass_threshold: u8 }, // minimum score to pass
}
\`\`\`

## Enums as Error Codes

Anchor uses enums for error codes, which is idiomatic Rust:

\`\`\`rust
#[error_code]
pub enum AcademyError {
    #[msg("Enrollment not found")]
    EnrollmentNotFound,

    #[msg("Insufficient XP balance")]
    InsufficientXp,

    #[msg("Arithmetic overflow")]
    Overflow,

    #[msg("Challenge deadline exceeded")]
    ChallengeExpired,
}
\`\`\`

Using errors:

\`\`\`rust
// Return an error
return Err(AcademyError::InsufficientXp.into());

// Return with context (Anchor macro)
require!(balance >= cost, AcademyError::InsufficientXp);

// With the error! macro
return Err(error!(AcademyError::ChallengeExpired));
\`\`\`

## Tuple Structs

Tuple structs are useful for newtype wrappers — adding type safety to primitive values:

\`\`\`rust
pub struct Lamports(pub u64);
pub struct XpAmount(pub u64);

fn transfer(from: Lamports, to_account: &AccountInfo) {
    // Now you can't accidentally pass XpAmount where Lamports is expected
}
\`\`\`

In the next lesson, you'll apply structs and data types in a real challenge.`,
              },

              // Lesson 2.4 — Challenge: Account Data Parser (challenge, rust)
              {
                title: "Challenge: Account Data Parser",
                description:
                  "Deserialize raw account bytes into a typed Rust struct",
                type: "challenge",
                order: 3,
                xpReward: 75,
                duration: "30 min",
                content: null,
                challenge: {
                  create: {
                    prompt:
                      "Implement an account data parser for a simple on-chain voting account. You are given raw bytes (as a `&[u8]` slice) that represent a serialized `VoteAccount` struct. The layout is:\n\n```\nBytes 0..8:   u64 — yes_votes\nBytes 8..16:  u64 — no_votes  \nBytes 16..17: u8  — is_active (1 = true, 0 = false)\nBytes 17..49: [u8; 32] — authority pubkey\n```\n\nWrite two functions:\n1. `parse_vote_account(data: &[u8]) -> Result<VoteAccount, &'static str>` — parses the bytes into a `VoteAccount` struct, returning an error string if the data is malformed\n2. `total_votes(account: &VoteAccount) -> Option<u64>` — returns the total vote count, or `None` if it would overflow",
                    starterCode: `#[derive(Debug, PartialEq)]
pub struct VoteAccount {
    pub yes_votes: u64,
    pub no_votes: u64,
    pub is_active: bool,
    pub authority: [u8; 32],
}

/// Parse a raw byte slice into a VoteAccount.
/// Returns Err with a description if the data is invalid.
pub fn parse_vote_account(data: &[u8]) -> Result<VoteAccount, &'static str> {
    // TODO: Check that data is at least 49 bytes long
    // TODO: Parse yes_votes from bytes 0..8 (little-endian u64)
    // TODO: Parse no_votes from bytes 8..16 (little-endian u64)
    // TODO: Parse is_active from byte 16 (1 = true, 0 = false, anything else = error)
    // TODO: Parse authority from bytes 17..49
    // Hint: use u64::from_le_bytes([data[0], data[1], ...]) or try_into()
    todo!()
}

/// Returns the total vote count, or None if it would overflow u64.
pub fn total_votes(account: &VoteAccount) -> Option<u64> {
    // TODO: Use checked_add to safely sum yes_votes + no_votes
    todo!()
}`,
                    language: "rust",
                    hints: [
                      'Use `data.get(0..8).ok_or("data too short")?` to safely slice the bytes, then convert: `u64::from_le_bytes(slice.try_into().unwrap())`.',
                      'For `is_active`, match on byte 16: `match data[16] { 1 => true, 0 => false, _ => return Err("invalid bool") }`.',
                      "For the authority field, use `let mut auth = [0u8; 32]; auth.copy_from_slice(&data[17..49]); auth`.",
                      "For `total_votes`, use `account.yes_votes.checked_add(account.no_votes)` — this returns `None` on overflow.",
                    ],
                    solution: `#[derive(Debug, PartialEq)]
pub struct VoteAccount {
    pub yes_votes: u64,
    pub no_votes: u64,
    pub is_active: bool,
    pub authority: [u8; 32],
}

pub fn parse_vote_account(data: &[u8]) -> Result<VoteAccount, &'static str> {
    if data.len() < 49 {
        return Err("data too short: expected at least 49 bytes");
    }

    let yes_votes = u64::from_le_bytes(
        data[0..8].try_into().map_err(|_| "failed to parse yes_votes")?
    );
    let no_votes = u64::from_le_bytes(
        data[8..16].try_into().map_err(|_| "failed to parse no_votes")?
    );
    let is_active = match data[16] {
        1 => true,
        0 => false,
        _ => return Err("invalid boolean value for is_active"),
    };
    let mut authority = [0u8; 32];
    authority.copy_from_slice(&data[17..49]);

    Ok(VoteAccount { yes_votes, no_votes, is_active, authority })
}

pub fn total_votes(account: &VoteAccount) -> Option<u64> {
    account.yes_votes.checked_add(account.no_votes)
}`,
                    testCases: {
                      create: [
                        {
                          name: "Parses valid account data correctly",
                          input:
                            "parse_vote_account(&[100,0,0,0,0,0,0,0, 50,0,0,0,0,0,0,0, 1, 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0])",
                          expectedOutput:
                            "Ok(VoteAccount { yes_votes: 100, no_votes: 50, is_active: true, authority: [0u8; 32] })",
                          order: 0,
                        },
                        {
                          name: "Returns error for data that is too short",
                          input: "parse_vote_account(&[0u8; 10])",
                          expectedOutput:
                            'Err("data too short: expected at least 49 bytes")',
                          order: 1,
                        },
                        {
                          name: "total_votes sums yes + no correctly",
                          input:
                            "total_votes(&VoteAccount { yes_votes: 300, no_votes: 200, is_active: true, authority: [0u8;32] })",
                          expectedOutput: "Some(500)",
                          order: 2,
                        },
                        {
                          name: "total_votes returns None on overflow",
                          input:
                            "total_votes(&VoteAccount { yes_votes: u64::MAX, no_votes: 1, is_active: true, authority: [0u8;32] })",
                          expectedOutput: "None",
                          order: 3,
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
        // Module 3: Error Handling
        // ────────────────────────────────────────────────────────────────────
        {
          title: "Error Handling",
          description:
            "Rust's approach to errors — Result, Option, and custom error types — keeps Solana programs from panicking on-chain.",
          order: 2,
          lessons: {
            create: [
              // Lesson 3.1 — Result and Option Types (content)
              {
                title: "Result and Option Types",
                description:
                  "Using Rust's built-in error handling types effectively in on-chain code",
                type: "content",
                order: 0,
                xpReward: 30,
                duration: "20 min",
                content: `# Result and Option Types

Rust has no exceptions. Instead, errors are values expressed through two standard library enums: \`Result<T, E>\` and \`Option<T>\`. This makes error handling explicit, composable, and impossible to accidentally ignore.

## Option<T>

\`Option<T>\` represents a value that may or may not be present — Rust's replacement for null:

\`\`\`rust
pub enum Option<T> {
    Some(T), // value is present
    None,    // value is absent
}
\`\`\`

Common use in Solana programs:

\`\`\`rust
// Checked arithmetic returns Option
let new_balance: Option<u64> = balance.checked_sub(withdrawal);

// Getting the first element of a slice
let discriminator: Option<&u8> = data.first();

// Finding an account by key
let vault = accounts
    .iter()
    .find(|a| a.key == &expected_vault_pda);
\`\`\`

Transforming \`Option\` values:

\`\`\`rust
// map: transform the inner value if Some
let half: Option<u64> = balance.checked_div(2);
let lamports: Option<u64> = half.map(|v| v * 1_000_000_000);

// unwrap_or: provide a default value
let fee = calculated_fee.unwrap_or(5_000);

// ok_or: convert None to an Err
let amount = checked_result.ok_or(MyError::Overflow)?;
\`\`\`

## Result<T, E>

\`Result<T, E>\` represents success (\`Ok(T)\`) or failure (\`Err(E)\`):

\`\`\`rust
pub enum Result<T, E> {
    Ok(T),   // success with value
    Err(E),  // failure with error
}
\`\`\`

In Anchor programs, the error type is always \`anchor_lang::error::Error\`:

\`\`\`rust
// Every instruction handler returns Result<()>
pub fn transfer(ctx: Context<Transfer>, amount: u64) -> Result<()> {
    let balance = ctx.accounts.vault.lamports();

    // ok_or converts Option to Result with a specific error
    let new_balance = balance
        .checked_sub(amount)
        .ok_or(error!(AcademyError::InsufficientFunds))?;

    // ? propagates the error if Err, unwraps if Ok
    ctx.accounts.vault.sub_lamports(amount)?;
    ctx.accounts.recipient.add_lamports(amount)?;

    Ok(())
}
\`\`\`

## The ? Operator in Depth

The \`?\` operator expands to roughly:

\`\`\`rust
// This:
let value = some_result?;

// Expands to:
let value = match some_result {
    Ok(v) => v,
    Err(e) => return Err(e.into()),
};
\`\`\`

The \`.into()\` call converts the error type if needed, which is why Anchor errors work with \`?\` even though the underlying type may differ.

## Chaining Results

\`\`\`rust
// Sequential operations — any step can fail
fn process_transfer(
    from_balance: u64,
    to_balance: u64,
    amount: u64,
) -> Result<(u64, u64), &'static str> {
    let new_from = from_balance
        .checked_sub(amount)
        .ok_or("insufficient funds")?;

    let new_to = to_balance
        .checked_add(amount)
        .ok_or("recipient overflow")?;

    Ok((new_from, new_to))
}
\`\`\`

## map_err and and_then

\`\`\`rust
// Convert one error type to another
let result = parse_instruction(data)
    .map_err(|_| ProgramError::InvalidInstructionData)?;

// Chain fallible operations
let signature = get_account(accounts)?
    .and_then(|acc| validate_signer(acc))
    .and_then(|acc| extract_signature(acc))?;
\`\`\`

Mastering \`Result\` and \`Option\` is the single biggest step toward writing production-quality Solana programs. In the next lesson, we'll build custom error types that give users meaningful feedback.`,
              },

              // Lesson 3.2 — Custom Error Types (content)
              {
                title: "Custom Error Types",
                description:
                  "Defining meaningful on-chain error variants with Anchor's error_code macro",
                type: "content",
                order: 1,
                xpReward: 30,
                duration: "20 min",
                content: `# Custom Error Types

Production Solana programs return meaningful error codes that frontends and explorers can interpret. Anchor provides the \`#[error_code]\` macro to turn a Rust enum into a set of numbered program errors.

## Defining Custom Errors

\`\`\`rust
use anchor_lang::prelude::*;

#[error_code]
pub enum AcademyError {
    // Enrollment errors (6000–6009)
    #[msg("Course enrollment not found for this wallet")]
    EnrollmentNotFound,

    #[msg("Already enrolled in this course")]
    AlreadyEnrolled,

    #[msg("Course is not accepting new enrollments")]
    EnrollmentClosed,

    // Progress errors (6010–6019)
    #[msg("Lesson has already been completed")]
    LessonAlreadyCompleted,

    #[msg("Previous lesson must be completed first")]
    LessonNotUnlocked,

    // XP and arithmetic errors (6020–6029)
    #[msg("XP amount would overflow u64")]
    XpOverflow,

    #[msg("Insufficient XP balance for this operation")]
    InsufficientXp,

    // Authority errors (6030+)
    #[msg("Signer is not the expected authority")]
    Unauthorized,

    #[msg("Backend signer does not match config")]
    InvalidBackendSigner,
}
\`\`\`

Anchor automatically assigns error codes starting at 6000. The \`#[msg]\` attribute sets the human-readable message returned in logs.

## Using Custom Errors

\`\`\`rust
// Direct return
if ctx.accounts.authority.key() != enrollment.authority {
    return Err(AcademyError::Unauthorized.into());
}

// require! macro — most common pattern
require!(
    ctx.accounts.authority.key() == enrollment.authority,
    AcademyError::Unauthorized
);

// require_eq! and require_keys_eq!
require_keys_eq!(
    ctx.accounts.mint.key(),
    ctx.accounts.config.xp_mint,
    AcademyError::InvalidMint
);

// require_gte! for numeric comparisons
require_gte!(
    ctx.accounts.enrollment.xp_balance,
    course.xp_cost,
    AcademyError::InsufficientXp
);
\`\`\`

## Error Propagation Patterns

\`\`\`rust
// Pattern 1: Convert from std library errors
fn parse_amount(data: &[u8]) -> Result<u64> {
    data.get(0..8)
        .ok_or(error!(AcademyError::InvalidInstructionData))?
        .try_into()
        .map(u64::from_le_bytes)
        .map_err(|_| error!(AcademyError::InvalidInstructionData))
}

// Pattern 2: Add context to errors (similar to anyhow)
fn validate_enrollment(enrollment: &Account<Enrollment>) -> Result<()> {
    require!(enrollment.is_active, AcademyError::EnrollmentClosed);
    require!(
        enrollment.xp_earned < MAX_COURSE_XP,
        AcademyError::XpOverflow
    );
    Ok(())
}

// Pattern 3: Custom error with data
// (Anchor doesn't support error payloads natively, use msg! for context)
pub fn complete_lesson(ctx: Context<CompleteLesson>) -> Result<()> {
    let lesson_id = ctx.accounts.lesson.id;

    if ctx.accounts.completion.exists {
        msg!("Lesson {} already completed", lesson_id);
        return Err(AcademyError::LessonAlreadyCompleted.into());
    }

    Ok(())
}
\`\`\`

## Error Codes in Explorer

When a transaction fails, the error code appears in block explorers:

\`\`\`
Error: 0x1774
       ↑ 0x1770 = 6000 decimal — Anchor error base
       ↑ 0x1774 = 6004 decimal — fourth variant in your enum
\`\`\`

Frontends can decode these with the program's IDL to show users a meaningful message.

## Comparison: require! vs if/return

\`\`\`rust
// Long form
if !(a == b) {
    return Err(AcademyError::Mismatch.into());
}

// Anchor require! (preferred — matches the require assert style)
require!(a == b, AcademyError::Mismatch);

// require_eq! (even clearer for equality checks)
require_eq!(a, b, AcademyError::Mismatch);
\`\`\`

Use \`require!\` and its variants consistently — they produce cleaner programs and match idiomatic Anchor style.`,
              },

              // Lesson 3.3 — Challenge: Safe Balance Transfer (challenge, typescript)
              {
                title: "Challenge: Safe Balance Transfer",
                description:
                  "Implement safe lamport transfer logic with overflow and underflow protection",
                type: "challenge",
                order: 2,
                xpReward: 75,
                duration: "30 min",
                content: null,
                challenge: {
                  create: {
                    prompt:
                      "Implement a safe balance transfer simulator in TypeScript. The function should mirror what a Solana program does when moving lamports between accounts — with explicit protection against all arithmetic errors.\n\nWrite the function:\n```ts\nfunction safeTransfer(\n  fromBalance: bigint,\n  toBalance: bigint,\n  amount: bigint\n): { success: true; from: bigint; to: bigint } | { success: false; error: string }\n```\n\nIt must validate:\n1. `amount > 0n` — cannot transfer zero or negative\n2. `fromBalance >= amount` — sender has sufficient funds (underflow protection)\n3. `toBalance + amount <= MAX_U64` — recipient won't overflow\n4. Both input balances are non-negative\n\nReturn the new balances on success, or an error string describing the violation.",
                    starterCode: `const MAX_U64 = 18_446_744_073_709_551_615n;

type TransferResult =
  | { success: true; from: bigint; to: bigint }
  | { success: false; error: string };

/**
 * Safely transfer lamports between two account balances.
 * Returns the updated balances or a descriptive error.
 */
export function safeTransfer(
  fromBalance: bigint,
  toBalance: bigint,
  amount: bigint
): TransferResult {
  // TODO: Validate amount > 0
  // TODO: Validate fromBalance >= 0 and toBalance >= 0
  // TODO: Check fromBalance >= amount (no underflow)
  // TODO: Check toBalance + amount <= MAX_U64 (no overflow)
  // TODO: Return success with updated balances
}`,
                    language: "typescript",
                    hints: [
                      "Check `amount <= 0n` first — in BigInt arithmetic, comparisons work normally with the `n` suffix.",
                      "For underflow: if `fromBalance < amount`, return `{ success: false, error: 'insufficient funds' }`.",
                      "For overflow: check `toBalance + amount > MAX_U64` before doing the addition.",
                      "On success, return `{ success: true, from: fromBalance - amount, to: toBalance + amount }`.",
                    ],
                    solution: `const MAX_U64 = 18_446_744_073_709_551_615n;

type TransferResult =
  | { success: true; from: bigint; to: bigint }
  | { success: false; error: string };

export function safeTransfer(
  fromBalance: bigint,
  toBalance: bigint,
  amount: bigint
): TransferResult {
  if (fromBalance < 0n || toBalance < 0n) {
    return { success: false, error: 'negative balance is invalid' };
  }
  if (amount <= 0n) {
    return { success: false, error: 'transfer amount must be greater than zero' };
  }
  if (fromBalance < amount) {
    return { success: false, error: 'insufficient funds' };
  }
  if (toBalance + amount > MAX_U64) {
    return { success: false, error: 'recipient balance would overflow u64' };
  }
  return {
    success: true,
    from: fromBalance - amount,
    to: toBalance + amount,
  };
}`,
                    testCases: {
                      create: [
                        {
                          name: "Valid transfer succeeds",
                          input: "safeTransfer(1_000_000n, 500_000n, 200_000n)",
                          expectedOutput:
                            "{ success: true, from: 800000n, to: 700000n }",
                          order: 0,
                        },
                        {
                          name: "Insufficient funds returns error",
                          input: "safeTransfer(100n, 0n, 200n)",
                          expectedOutput:
                            "{ success: false, error: 'insufficient funds' }",
                          order: 1,
                        },
                        {
                          name: "Zero amount is rejected",
                          input: "safeTransfer(1000n, 1000n, 0n)",
                          expectedOutput:
                            "{ success: false, error: 'transfer amount must be greater than zero' }",
                          order: 2,
                        },
                        {
                          name: "Overflow is caught",
                          input:
                            "safeTransfer(1_000_000n, 18_446_744_073_709_551_615n, 1n)",
                          expectedOutput:
                            "{ success: false, error: 'recipient balance would overflow u64' }",
                          order: 3,
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
        // Module 4: Borsh and Solana Rust
        // ────────────────────────────────────────────────────────────────────
        {
          title: "Borsh and Solana Rust",
          description:
            "Learn Borsh binary serialization and write your first minimal Solana program from scratch.",
          order: 3,
          lessons: {
            create: [
              // Lesson 4.1 — Borsh Serialization (content)
              {
                title: "Borsh Serialization",
                description:
                  "How Borsh encodes Rust types to bytes for on-chain storage",
                type: "content",
                order: 0,
                xpReward: 35,
                duration: "25 min",
                content: `# Borsh Serialization

Every on-chain account is ultimately a byte array. When a Solana program reads or writes account data, it must serialize and deserialize Rust types to/from raw bytes. **Borsh** (Binary Object Representation Serializer for Hashing) is the standard serialization format used by Anchor and the Solana ecosystem.

## Why Borsh?

\`\`\`
Borsh properties:
  ✓ Deterministic — same input always produces same bytes
  ✓ Compact — no field names, just bytes in order
  ✓ Fast — no schema needed for deserialization
  ✓ Canonical — only one valid encoding per value
  ✓ Hash-friendly — determinism makes it safe to hash
\`\`\`

Compared to JSON or MessagePack, Borsh is purpose-built for blockchain use cases where determinism and compactness are critical.

## Encoding Rules

Borsh encodes types in little-endian byte order:

\`\`\`
Type        Bytes   Encoding
────────────────────────────────────────
bool        1       0 = false, 1 = true
u8          1       direct
u16         2       little-endian
u32         4       little-endian
u64         8       little-endian
u128        16      little-endian
[u8; N]     N       direct copy
String      4+N     u32 length prefix + UTF-8 bytes
Vec<T>      4+N*S   u32 length + serialized elements
Option<T>   1+?     0 = None, 1+T = Some
\`\`\`

## Example: Encoding a Struct

\`\`\`rust
use borsh::{BorshSerialize, BorshDeserialize};

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct Counter {
    pub count: u64,        // 8 bytes
    pub authority: [u8; 32], // 32 bytes
}

// Encoding
let counter = Counter {
    count: 42,
    authority: [1u8; 32],
};

let bytes = counter.try_to_vec()?;
// bytes[0..8]   = 42u64 in little-endian = [42, 0, 0, 0, 0, 0, 0, 0]
// bytes[8..40]  = [1, 1, 1, ..., 1] (32 bytes)

// Decoding
let decoded = Counter::try_from_slice(&bytes)?;
assert_eq!(decoded.count, 42);
\`\`\`

## Anchor Discriminators

Anchor prepends an 8-byte **discriminator** to every account — a hash of the account type name:

\`\`\`rust
// Anchor account layout in memory:
//
// [0..8]   = discriminator (sha256("account:Counter")[..8])
// [8..16]  = count (u64)
// [16..48] = authority ([u8; 32])
//
// Total: 48 bytes
// When allocating: space = 8 + Counter::INIT_SPACE
\`\`\`

The discriminator prevents account confusion — Anchor rejects any account whose first 8 bytes don't match the expected type.

## Calculating Account Space

\`\`\`rust
// Manual calculation
const COUNTER_SPACE: usize =
    8       // discriminator
    + 8     // count: u64
    + 32    // authority: Pubkey
    + 1     // is_active: bool
    + 1;    // bump: u8

// Anchor's InitSpace derive (preferred)
#[account]
#[derive(InitSpace)]
pub struct Counter {
    pub count: u64,           // 8
    pub authority: Pubkey,    // 32
    pub is_active: bool,      // 1
    pub bump: u8,             // 1
}
// Counter::INIT_SPACE == 42
// total space = 8 + Counter::INIT_SPACE == 50
\`\`\`

## Strings and Variable-Length Data

Strings use a u32 length prefix, which makes them tricky to store in accounts:

\`\`\`rust
// In Anchor, use InitSpace with max_len for strings
#[account]
#[derive(InitSpace)]
pub struct Profile {
    pub authority: Pubkey,  // 32 bytes
    #[max_len(64)]
    pub username: String,   // 4 (length prefix) + 64 bytes = 68 bytes
    pub xp: u64,            // 8 bytes
}
// Profile::INIT_SPACE == 32 + 68 + 8 = 108
\`\`\`

Always allocate the maximum possible size for variable-length fields at account creation time — account space cannot be increased after creation without reallocating (a complex operation).

## Borsh in the Solana Runtime

\`\`\`rust
// Reading account data manually (without Anchor)
use borsh::BorshDeserialize;

pub fn process(accounts: &[AccountInfo], _data: &[u8]) -> ProgramResult {
    let account = &accounts[0];
    let data = account.try_borrow_data()?;

    // Skip the 8-byte discriminator
    let counter = Counter::try_from_slice(&data[8..])?;

    msg!("Counter value: {}", counter.count);
    Ok(())
}
\`\`\`

In the next lesson, we'll use everything we've learned to write a complete, working Solana program.`,
              },

              // Lesson 4.2 — Writing a Minimal Solana Program (content)
              {
                title: "Writing a Minimal Solana Program",
                description:
                  "Structure and implement a complete on-chain program using raw Solana primitives",
                type: "content",
                order: 1,
                xpReward: 35,
                duration: "30 min",
                content: `# Writing a Minimal Solana Program

Now we bring everything together. A minimal Solana program processes instructions, validates accounts, modifies on-chain state, and returns results to the runtime.

## Program Entry Point

Every Solana program exposes a single entry point via the \`entrypoint!\` macro:

\`\`\`rust
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
};
use borsh::{BorshDeserialize, BorshSerialize};

// Register the entry point
entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,       // this program's address
    accounts: &[AccountInfo],  // accounts passed by the client
    instruction_data: &[u8],   // serialized instruction arguments
) -> ProgramResult {
    // Dispatch based on first byte
    let instruction = instruction_data
        .first()
        .ok_or(ProgramError::InvalidInstructionData)?;

    match instruction {
        0 => initialize(program_id, accounts),
        1 => increment(accounts),
        _ => Err(ProgramError::InvalidInstructionData),
    }
}
\`\`\`

## Account Validation

**Always validate accounts** — never assume the client passed the right accounts:

\`\`\`rust
fn initialize(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let account_iter = &mut accounts.iter();

    let counter_account = next_account_info(account_iter)?;
    let authority = next_account_info(account_iter)?;
    let system_program = next_account_info(account_iter)?;

    // Validate ownership
    if counter_account.owner != program_id {
        msg!("Counter account is not owned by this program");
        return Err(ProgramError::IncorrectProgramId);
    }

    // Validate signer
    if !authority.is_signer {
        msg!("Authority must be a signer");
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Validate writable
    if !counter_account.is_writable {
        msg!("Counter account must be writable");
        return Err(ProgramError::InvalidAccountData);
    }

    Ok(())
}
\`\`\`

## State Layout: Counter Program

\`\`\`rust
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct CounterState {
    pub count: u64,           // 8 bytes
    pub authority: Pubkey,    // 32 bytes
    pub is_initialized: bool, // 1 byte
}
// Total: 41 bytes per counter account

impl CounterState {
    pub const SIZE: usize = 8 + 32 + 1; // 41 bytes
}
\`\`\`

## Modifying On-Chain State

\`\`\`rust
fn increment(accounts: &[AccountInfo]) -> ProgramResult {
    let account_iter = &mut accounts.iter();
    let counter_account = next_account_info(account_iter)?;
    let authority = next_account_info(account_iter)?;

    if !authority.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Borrow the account data mutably
    let mut data = counter_account.try_borrow_mut_data()?;
    let mut state = CounterState::try_from_slice(&data)?;

    // Validate authority
    if state.authority != *authority.key {
        return Err(ProgramError::InvalidAccountData);
    }

    // Checked arithmetic — never panic on-chain
    state.count = state.count
        .checked_add(1)
        .ok_or(ProgramError::InvalidInstructionData)?; // overflow

    // Serialize back to bytes
    state.serialize(&mut &mut data[..])?;

    msg!("Counter incremented to: {}", state.count);
    Ok(())
}
\`\`\`

## The Complete Program Structure

\`\`\`
my_counter/
├── Cargo.toml
└── src/
    ├── lib.rs          ← entrypoint!, process_instruction
    ├── instruction.rs  ← instruction enum, arg parsing
    ├── state.rs        ← CounterState struct
    ├── processor.rs    ← initialize, increment handlers
    └── error.rs        ← custom ProgramError variants
\`\`\`

## Client Interaction

From TypeScript, a client builds and sends a transaction:

\`\`\`typescript
import { Connection, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com");

// Instruction data: [1] = increment instruction
const instruction = new TransactionInstruction({
  programId: COUNTER_PROGRAM_ID,
  keys: [
    { pubkey: counterPda, isSigner: false, isWritable: true },
    { pubkey: wallet.publicKey, isSigner: true, isWritable: false },
  ],
  data: Buffer.from([1]), // discriminator: 1 = increment
});

const tx = new Transaction().add(instruction);
const sig = await connection.sendTransaction(tx, [wallet]);
console.log("Transaction:", sig);
\`\`\`

Anchor automates all of this — the IDL generates a TypeScript client that handles serialization, account resolution, and PDA derivation. In the final challenge, you'll write the complete counter program using Anchor.`,
              },

              // Lesson 4.3 — Challenge: Counter Program (challenge, rust)
              {
                title: "Challenge: Counter Program",
                description:
                  "Write a complete Anchor counter program with initialize and increment instructions",
                type: "challenge",
                order: 2,
                xpReward: 100,
                duration: "40 min",
                content: null,
                challenge: {
                  create: {
                    prompt:
                      'Implement a complete Anchor counter program. The program must support two instructions:\n\n1. `initialize(ctx: Context<Initialize>)` — creates a new `Counter` account with `count = 0` and stores the `authority` public key and the PDA `bump`.\n\n2. `increment(ctx: Context<Increment>)` — increments `counter.count` by 1 using checked arithmetic, and emits a `CounterIncremented` event with the new count.\n\nConstraints:\n- The `Counter` PDA is derived from seeds `[b"counter", authority.key().as_ref()]`\n- Only the stored `authority` can call `increment`\n- `increment` must fail with `CounterError::Overflow` if count would overflow u64\n- The `Counter` account must use `#[derive(InitSpace)]`',
                    starterCode: `use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod counter {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        // TODO: Set counter.count = 0
        // TODO: Set counter.authority = ctx.accounts.authority.key()
        // TODO: Set counter.bump = ctx.bumps.counter
        Ok(())
    }

    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        // TODO: Increment counter.count by 1 using checked_add
        //       Return CounterError::Overflow if it would overflow
        // TODO: Emit a CounterIncremented event with the new count
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    // TODO: Add the counter PDA account
    //   seeds: [b"counter", authority.key().as_ref()]
    //   bump, init, payer = authority, space = 8 + Counter::INIT_SPACE

    // TODO: Add authority (mutable signer)

    // TODO: Add system_program
}

#[derive(Accounts)]
pub struct Increment<'info> {
    // TODO: Add the counter account (mutable)
    //   seeds: [b"counter", authority.key().as_ref()], bump = counter.bump
    //   constraint: counter.authority == authority.key()

    // TODO: Add authority (signer, not mutable)
}

#[account]
#[derive(InitSpace)]
pub struct Counter {
    // TODO: Add count: u64
    // TODO: Add authority: Pubkey
    // TODO: Add bump: u8
}

#[event]
pub struct CounterIncremented {
    // TODO: Add new_count: u64
    // TODO: Add authority: Pubkey
}

#[error_code]
pub enum CounterError {
    #[msg("Counter has reached its maximum value")]
    Overflow,
}`,
                    language: "rust",
                    hints: [
                      'For the Counter PDA in Initialize: `#[account(init, payer = authority, space = 8 + Counter::INIT_SPACE, seeds = [b"counter", authority.key().as_ref()], bump)]`.',
                      "For Increment, add `has_one = authority` or a manual `constraint = counter.authority == authority.key() @ CounterError::Unauthorized`.",
                      "Use `counter.count.checked_add(1).ok_or(CounterError::Overflow)?` for safe increment.",
                      "Emit an event with `emit!(CounterIncremented { new_count: counter.count, authority: counter.authority });`.",
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
        counter.bump = ctx.bumps.counter;
        Ok(())
    }

    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count = counter.count
            .checked_add(1)
            .ok_or(CounterError::Overflow)?;
        emit!(CounterIncremented {
            new_count: counter.count,
            authority: counter.authority,
        });
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Counter::INIT_SPACE,
        seeds = [b"counter", authority.key().as_ref()],
        bump,
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
        seeds = [b"counter", authority.key().as_ref()],
        bump = counter.bump,
        has_one = authority,
    )]
    pub counter: Account<'info, Counter>,

    pub authority: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Counter {
    pub count: u64,
    pub authority: Pubkey,
    pub bump: u8,
}

#[event]
pub struct CounterIncremented {
    pub new_count: u64,
    pub authority: Pubkey,
}

#[error_code]
pub enum CounterError {
    #[msg("Counter has reached its maximum value")]
    Overflow,
}`,
                    testCases: {
                      create: [
                        {
                          name: "initialize sets count to 0",
                          input: "initialize(ctx)",
                          expectedOutput: "counter.count == 0",
                          order: 0,
                        },
                        {
                          name: "increment increases count by 1",
                          input: "increment(ctx) after initialize",
                          expectedOutput: "counter.count == 1",
                          order: 1,
                        },
                        {
                          name: "increment emits CounterIncremented event",
                          input: "increment(ctx)",
                          expectedOutput:
                            "CounterIncremented { new_count: 1, authority: <wallet> } emitted",
                          order: 2,
                        },
                        {
                          name: "wrong authority is rejected",
                          input: "increment(ctx) with different signer",
                          expectedOutput:
                            "Error: ConstraintHasOne (authority mismatch)",
                          order: 3,
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
