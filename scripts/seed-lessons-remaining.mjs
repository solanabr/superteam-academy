/**
 * Seed full lesson content for 4 remaining courses:
 * anchor-basics, defi-amm, program-security, token-2022
 * Run: node scripts/seed-lessons-remaining.mjs
 */

const TOKEN = 'skfRfU3FegWfLuXfwxUhcbg8OpneMQeOv2SmYcYAWYNoQP3AeBgCTtDmDw4hlblzMwHGsl1Exyp9UTZrD';
const PROJECT_ID = 'k9esrahg';
const DATASET = 'production';
const API = `https://${PROJECT_ID}.api.sanity.io/v2021-10-21/data/mutate/${DATASET}`;

let _k = 0;
const key = () => `k${++_k}${Math.random().toString(36).slice(2,5)}`;
const block = (text, style = 'normal') => ({
  _type: 'block', _key: key(), style, markDefs: [],
  children: [{ _type: 'span', _key: key(), marks: [], text }]
});
const code = (codeText, language = 'rust') => ({ _type: 'code', _key: key(), language, code: codeText });

// ══════════════════════════════════════════════════════════════════════════════
// ANCHOR BASICS
// ══════════════════════════════════════════════════════════════════════════════

const anchorLessons = [
  {
    _id: 'lesson-what-is-anchor',
    _type: 'lesson',
    title: 'What is Anchor?',
    lessonType: 'content',
    order: 1,
    xpReward: 50,
    estimatedMinutes: 12,
    content: [
      block('Anchor is the standard framework for building Solana programs in Rust. It provides a macro system that eliminates 80% of the boilerplate required in raw Solana programs, enforces account validation automatically, and generates TypeScript IDLs for client-side use.'),
      block('Why Anchor?', 'h2'),
      code(`// RAW SOLANA — 60+ lines for a simple counter increment:
pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let counter_account = next_account_info(accounts_iter)?;
    let authority = next_account_info(accounts_iter)?;

    // Manual ownership check
    if counter_account.owner != program_id {
        return Err(ProgramError::IncorrectProgramId);
    }
    // Manual signer check
    if !authority.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    // Manual deserialization
    let mut counter = Counter::try_from_slice(&counter_account.data.borrow())?;
    counter.count += 1;
    counter.serialize(&mut *counter_account.data.borrow_mut())?;
    Ok(())
}

// ANCHOR — same logic in 8 lines:
pub fn increment(ctx: Context<Increment>) -> Result<()> {
    ctx.accounts.counter.count += 1;
    Ok(())
}`, 'rust'),
      block('Core Concepts', 'h2'),
      block('Anchor has three main pieces: the #[program] macro (marks instruction handlers), #[derive(Accounts)] (validates accounts declaratively), and #[account] (derives Borsh serialization + 8-byte discriminator).'),
      code(`use anchor_lang::prelude::*;

declare_id!("YourProgramIdHere");  // deployed program address

#[program]
pub mod my_program {               // instruction handlers live here
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, initial: u64) -> Result<()> {
        ctx.accounts.counter.count = initial;
        ctx.accounts.counter.authority = ctx.accounts.authority.key();
        Ok(())
    }

    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        ctx.accounts.counter.count += 1;
        Ok(())
    }
}

#[derive(Accounts)]               // account validation struct
pub struct Initialize<'info> {
    #[account(
        init,                     // create the account
        payer = authority,        // authority pays rent
        space = 8 + 8 + 32,      // discriminator + count + authority pubkey
    )]
    pub counter: Account<'info, Counter>,

    #[account(mut)]
    pub authority: Signer<'info>, // must sign the tx

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(
        mut,
        has_one = authority,      // counter.authority must match signer
    )]
    pub counter: Account<'info, Counter>,
    pub authority: Signer<'info>,
}

#[account]                        // data struct stored on-chain
pub struct Counter {
    pub count: u64,
    pub authority: Pubkey,
}`, 'rust'),
      block('Error Handling', 'h2'),
      code(`// Define custom errors with #[error_code]
#[error_code]
pub enum MyError {
    #[msg("Count has exceeded maximum value")]
    Overflow,
    #[msg("Unauthorized: only the creator can call this")]
    Unauthorized,
}

// Use in instruction:
pub fn safe_increment(ctx: Context<Increment>) -> Result<()> {
    let counter = &mut ctx.accounts.counter;
    counter.count = counter.count.checked_add(1)
        .ok_or(MyError::Overflow)?;
    Ok(())
}`, 'rust'),
      block('The IDL', 'h2'),
      block('After anchor build, Anchor generates a JSON IDL (Interface Definition Language) at target/idl/my_program.json. This file describes all instructions, accounts, and types. Your frontend uses this IDL with @coral-xyz/anchor to call your program with full TypeScript types — no manual instruction encoding needed.'),
    ],
  },
  {
    _id: 'lesson-project-structure',
    _type: 'lesson',
    title: 'Project Structure & Workspace',
    lessonType: 'content',
    order: 2,
    xpReward: 50,
    estimatedMinutes: 10,
    content: [
      block('anchor init my-project creates a workspace with a specific structure. Understanding this layout is essential before you start writing program logic.'),
      code(`my-project/
├── Anchor.toml          ← workspace config (cluster, programs, seeds)
├── Cargo.toml           ← Rust workspace manifest
├── package.json         ← Node.js deps (@coral-xyz/anchor, mocha, chai)
├── programs/
│   └── my-project/
│       ├── Cargo.toml   ← program crate (anchor-lang dependency)
│       └── src/
│           └── lib.rs   ← your program code
├── tests/
│   └── my-project.ts   ← TypeScript integration tests
└── target/
    ├── deploy/          ← compiled .so files (BPF bytecode)
    ├── idl/             ← generated JSON IDL
    └── types/           ← generated TypeScript types`, 'bash'),
      block('Anchor.toml Explained', 'h2'),
      code(`[toolchain]
anchor_version = "0.31.1"
solana_version = "1.18.26"

[features]
seeds = true        # enables seeds constraint in #[derive(Accounts)]
resolution = true   # resolves accounts from IDL automatically

[programs.localnet]
my_project = "GrpF...xyz"  # program ID for local testing

[programs.devnet]
my_project = "GrpF...xyz"  # same program ID on devnet

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "Localnet"        # default cluster for anchor test
wallet = "~/.config/solana/id.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"`, 'bash'),
      block('Multiple Programs in One Workspace', 'h2'),
      code(`# Add a second program to the workspace
anchor new my-second-program

# Workspace structure becomes:
programs/
├── my-project/
│   └── src/lib.rs
└── my-second-program/
    └── src/lib.rs

# Cargo.toml (workspace root) lists all members:
[workspace]
members = [
    "programs/my-project",
    "programs/my-second-program",
]`, 'bash'),
      block('Testing Setup', 'h2'),
      code(`// tests/my-project.ts
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MyProject } from "../target/types/my_project";

describe("my-project", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.MyProject as Program<MyProject>;

  it("Initializes counter", async () => {
    const counter = anchor.web3.Keypair.generate();

    await program.methods
      .initialize(new anchor.BN(0))    // call initialize with initial=0
      .accounts({
        counter: counter.publicKey,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([counter])
      .rpc();

    const account = await program.account.counter.fetch(counter.publicKey);
    console.log("Count:", account.count.toNumber()); // 0
  });
});`, 'typescript'),
      block('Build & Test Commands', 'h2'),
      code(`# Build all programs in workspace
anchor build

# Run tests (spins up local validator automatically)
anchor test

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Build + run tests against existing validator
anchor test --skip-local-validator

# Format Rust code
cargo fmt

# Lint
cargo clippy -- -W clippy::all`, 'bash'),
    ],
  },
  {
    _id: 'lesson-challenge-first-anchor',
    _type: 'lesson',
    title: 'Challenge: Your First Anchor Program',
    lessonType: 'challenge',
    order: 3,
    xpReward: 200,
    estimatedMinutes: 30,
    content: [
      block('Write a complete Anchor program that implements a voting system. Users can cast a vote for "yes" or "no" on a proposal. The program tracks total yes votes and no votes on-chain.'),
      block('Requirements', 'h2'),
      block('Define a Proposal account with yes_votes (u64), no_votes (u64), and is_active (bool). Write an initialize instruction that creates the proposal (is_active = true). Write a vote instruction that increments either yes_votes or no_votes based on a boolean parameter. Guard the vote instruction to only work when is_active is true.'),
    ],
    starterCode: `use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod voting {
    use super::*;

    // TODO: implement initialize instruction
    // Should create a Proposal account with is_active = true

    // TODO: implement vote instruction
    // Parameters: vote_yes: bool
    // Should increment yes_votes or no_votes
    // Should fail if proposal is not active
}

// TODO: define Initialize accounts struct
// Hint: use #[account(init, payer = authority, space = ...)]

// TODO: define Vote accounts struct

// TODO: define Proposal data struct with #[account]
// Fields: yes_votes: u64, no_votes: u64, is_active: bool

// TODO: define custom error for InactiveProposal`,
    solutionCode: `use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod voting {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        proposal.yes_votes = 0;
        proposal.no_votes = 0;
        proposal.is_active = true;
        Ok(())
    }

    pub fn vote(ctx: Context<Vote>, vote_yes: bool) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        require!(proposal.is_active, VotingError::InactiveProposal);
        if vote_yes {
            proposal.yes_votes = proposal.yes_votes.checked_add(1)
                .ok_or(VotingError::Overflow)?;
        } else {
            proposal.no_votes = proposal.no_votes.checked_add(1)
                .ok_or(VotingError::Overflow)?;
        }
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 8 + 8 + 1, // discriminator + yes + no + is_active
    )]
    pub proposal: Account<'info, Proposal>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Vote<'info> {
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,
    pub voter: Signer<'info>,
}

#[account]
pub struct Proposal {
    pub yes_votes: u64,
    pub no_votes: u64,
    pub is_active: bool,
}

#[error_code]
pub enum VotingError {
    #[msg("This proposal is no longer active")]
    InactiveProposal,
    #[msg("Vote count overflow")]
    Overflow,
}`,
    testCases: [
      { description: 'Define a Proposal struct with #[account]', input: '#[account]', expectedOutput: 'true' },
      { description: 'Proposal has yes_votes field', input: 'yes_votes', expectedOutput: 'true' },
      { description: 'Proposal has no_votes field', input: 'no_votes', expectedOutput: 'true' },
      { description: 'Proposal has is_active field', input: 'is_active', expectedOutput: 'true' },
      { description: 'Use require! to check is_active in vote', input: 'require!', expectedOutput: 'true' },
      { description: 'Use checked_add for safe arithmetic', input: 'checked_add', expectedOutput: 'true' },
    ],
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// PROGRAM SECURITY
// ══════════════════════════════════════════════════════════════════════════════

const securityLessons = [
  {
    _id: 'lesson-solana-security-model',
    _type: 'lesson',
    title: 'Solana Security Model',
    lessonType: 'content',
    order: 1,
    xpReward: 75,
    estimatedMinutes: 15,
    content: [
      block('Solana program security is fundamentally different from EVM security. The account model, parallel execution, and explicit account declaration create a unique attack surface. Most Solana hacks come from account validation failures, not logic bugs.'),
      block('The Security Model', 'h2'),
      code(`// Every instruction receives a list of accounts.
// YOUR PROGRAM MUST VERIFY:
// 1. Each account has the expected OWNER (program)
// 2. Each account that should sign IS a signer
// 3. Each PDA derives from the expected seeds
// 4. Writable accounts are the intended ones (not attacker-controlled)
// 5. Executable accounts (programs) are the expected programs
// 6. Numeric operations cannot overflow/underflow

// What Anchor checks AUTOMATICALLY via #[derive(Accounts)]:
// ✅ Account discriminator (prevents wrong account type)
// ✅ Account ownership (Account<T> checks owner = program_id)
// ✅ Signer constraint (Signer<T> checks is_signer)
// ✅ PDA derivation (seeds + bump constraints)

// What YOU must still verify:
// ⚠️  Business logic (who can call what, when)
// ⚠️  Numeric bounds (use checked arithmetic)
// ⚠️  CPI target program IDs
// ⚠️  Cross-account relationships (has_one, constraint)`, 'rust'),
      block('The Most Dangerous Assumptions', 'h2'),
      code(`// ❌ DANGEROUS: assuming account data is valid because tx was signed
// An attacker can craft any account layout and pass it to your program
pub fn process(ctx: Context<Process>) -> Result<()> {
    // If you use AccountInfo instead of Account<T>,
    // Anchor doesn't check the discriminator!
    let data = ctx.accounts.vault.data.borrow();
    let vault = Vault::try_from_slice(&data)?;  // could be ANY account
    // ...
}

// ✅ SAFE: use typed accounts — Anchor checks owner + discriminator
pub struct Process<'info> {
    pub vault: Account<'info, Vault>,  // owner = program_id, discriminator checked
}`, 'rust'),
      block('Solana Exploit History', 'h2'),
      block('The largest Solana exploits all came from account validation failures. Wormhole ($320M, 2022): missing signer verification on a legacy function that bypassed the main validator. Mango Markets ($114M, 2022): price oracle manipulation — not a code bug but economic attack. Cashio ($52M, 2022): missing account ownership check on the collateral vault. Crema Finance ($8.7M, 2022): passing a fake tick account that wasn\'t owned by the program.'),
      block('Defense in Depth', 'h2'),
      code(`// Layer 1: Use Anchor (auto-validates discriminator + owner + signer)
// Layer 2: Add explicit constraints (has_one, constraint = ...)
// Layer 3: Custom validation in instruction body
// Layer 4: Economic design (make attacks unprofitable)

// Example of all layers:
#[derive(Accounts)]
pub struct WithdrawFunds<'info> {
    #[account(
        mut,
        has_one = authority,         // Layer 2: vault.authority must match signer
        has_one = token_account,     // Layer 2: vault.token_account must match
        constraint = vault.is_active @ VaultError::Inactive,  // Layer 2: custom
    )]
    pub vault: Account<'info, Vault>,

    pub authority: Signer<'info>,    // Layer 1+2: must sign + matches has_one

    #[account(
        mut,
        token::mint = vault.mint,    // Layer 2: token account holds correct mint
    )]
    pub token_account: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
}

pub fn withdraw_funds(ctx: Context<WithdrawFunds>, amount: u64) -> Result<()> {
    // Layer 3: business logic validation
    let vault = &ctx.accounts.vault;
    require!(amount <= vault.balance, VaultError::InsufficientFunds);
    require!(amount > 0, VaultError::ZeroAmount);
    // ...
}`, 'rust'),
    ],
  },
  {
    _id: 'lesson-missing-owner-checks',
    _type: 'lesson',
    title: 'Missing Owner Checks',
    lessonType: 'content',
    order: 4,
    xpReward: 100,
    estimatedMinutes: 20,
    content: [
      block('The missing owner check is the most common Solana vulnerability. When a program accepts an account without verifying who owns it, an attacker can substitute a malicious account with the same layout to steal funds or manipulate state.'),
      block('The Vulnerability', 'h2'),
      code(`// VULNERABLE: Using AccountInfo directly
#[derive(Accounts)]
pub struct VulnerableWithdraw<'info> {
    pub vault: AccountInfo<'info>,      // ← NO owner check!
    pub authority: Signer<'info>,
    pub destination: AccountInfo<'info>, // ← NO owner check!
}

pub fn withdraw(ctx: Context<VulnerableWithdraw>, amount: u64) -> Result<()> {
    let vault_data = Vault::try_from_slice(
        &ctx.accounts.vault.data.borrow()
    )?;
    // vault_data was deserialized — but the ACCOUNT might be attacker-controlled!
    // An attacker creates an account with the same layout but different authority
    // pointing to themselves
    if vault_data.authority != ctx.accounts.authority.key() {
        return err!(VaultError::Unauthorized);
    }
    // Transfer lamports... to attacker-controlled destination
}`, 'rust'),
      block('The Exploit', 'h2'),
      code(`// Attacker creates a fake vault account:
const fakeVault = anchor.web3.Keypair.generate();
// Manually writes vault data with attacker's authority
const fakeData = Buffer.alloc(VAULT_SIZE);
fakeData.writeUInt32LE(/* ... craft matching layout ... */);
// Funds the fake account with enough rent
await SystemProgram.createAccount({ ..., owner: PROGRAM_ID });
// Now calls withdraw with fakeVault — passes authority check!
await program.methods.withdraw(amount)
  .accounts({ vault: fakeVault.publicKey, ... })
  .rpc();
// Program reads fake data, thinks authority matches, sends funds to attacker`, 'typescript'),
      block('The Fix', 'h2'),
      code(`// SAFE: Use Account<T> — Anchor checks:
// 1. account.owner == program_id
// 2. account.data starts with Vault discriminator
#[derive(Accounts)]
pub struct SafeWithdraw<'info> {
    #[account(
        mut,
        has_one = authority @ VaultError::Unauthorized,
    )]
    pub vault: Account<'info, Vault>,      // ← Anchor checks owner!

    pub authority: Signer<'info>,

    /// CHECK: destination is any account — caller responsibility
    #[account(mut)]
    pub destination: AccountInfo<'info>,
}

// Anchor automatically rejects:
// - Accounts not owned by this program
// - Accounts with wrong discriminator (different account type)
// No changes needed in instruction body!`, 'rust'),
      block('When AccountInfo is Necessary', 'h2'),
      code(`// Sometimes you need raw AccountInfo — e.g., for CPI targets or unknown account types
// Use /// CHECK: comments to document WHY it's safe and what you verify manually

#[derive(Accounts)]
pub struct WithCPI<'info> {
    /// CHECK: This is the System Program — verified by executable check
    #[account(executable, address = anchor_lang::system_program::ID)]
    pub system_program: AccountInfo<'info>,

    /// CHECK: Recipient can be any wallet — we only deposit, never read data
    #[account(mut)]
    pub recipient: AccountInfo<'info>,
}

// Without /// CHECK: comment, Anchor will refuse to compile
// It's a forcing function to document your security reasoning`, 'rust'),
    ],
  },
  {
    _id: 'lesson-integer-overflow',
    _type: 'lesson',
    title: 'Integer Overflow & Underflow',
    lessonType: 'content',
    order: 7,
    xpReward: 100,
    estimatedMinutes: 18,
    content: [
      block('Rust prevents integer overflow in debug mode (panics), but Solana programs compile with overflow-checks = false for performance. In release mode, overflow wraps around silently — just like Solidity before Solidity 0.8. This creates critical vulnerabilities in DeFi programs.'),
      block('The Problem', 'h2'),
      code(`// Solana BPF target: overflow wraps silently in release mode
pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    // VULNERABLE: if balance is u64::MAX and amount = 1
    // this wraps to 0 instead of erroring!
    ctx.accounts.vault.balance += amount;  // ← silent overflow
    Ok(())
}

// Underflow is worse — often drains accounts
pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    // VULNERABLE: if balance = 5 and amount = 10
    // balance wraps to u64::MAX = 18,446,744,073,709,551,615
    ctx.accounts.vault.balance -= amount;  // ← silent underflow!
    // Attacker now has "infinite" credit
    Ok(())
}`, 'rust'),
      block('The Fix: Checked Arithmetic', 'h2'),
      code(`use anchor_lang::prelude::*;

pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    let vault = &mut ctx.accounts.vault;

    // checked_add returns None on overflow — map to program error
    vault.balance = vault.balance
        .checked_add(amount)
        .ok_or(VaultError::Overflow)?;

    Ok(())
}

pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    let vault = &mut ctx.accounts.vault;

    // checked_sub returns None if amount > balance
    vault.balance = vault.balance
        .checked_sub(amount)
        .ok_or(VaultError::InsufficientFunds)?;

    Ok(())
}

pub fn calculate_fee(amount: u64, fee_bps: u64) -> Result<u64> {
    // For multiplication: always check before dividing
    amount
        .checked_mul(fee_bps)
        .ok_or(VaultError::Overflow)?
        .checked_div(10_000)
        .ok_or(VaultError::DivisionByZero)
        .map_err(Into::into)
}`, 'rust'),
      block('Saturating vs Checked', 'h2'),
      code(`// checked_*: returns None on overflow (usually what you want for financial ops)
let result = a.checked_add(b).ok_or(MyError::Overflow)?;

// saturating_*: clamps to min/max instead of wrapping (rarely correct for finance)
let clamped = a.saturating_add(b);  // silently caps at u64::MAX — dangerous for balances

// wrapping_*: wraps explicitly (almost never what you want)
let wrapped = a.wrapping_add(b);

// In Anchor programs: ALWAYS use checked_* for any balance/amount math
// saturating_* and wrapping_* are almost never the right choice`, 'rust'),
      block('The u128 Pattern', 'h2'),
      code(`// For intermediate calculations that might overflow u64,
// cast to u128, compute, then cast back:
pub fn calculate_reward(stake: u64, rate: u64, duration: u64) -> Result<u64> {
    // stake * rate * duration might overflow u64 if all are large
    let reward = (stake as u128)
        .checked_mul(rate as u128)
        .ok_or(MyError::Overflow)?
        .checked_mul(duration as u128)
        .ok_or(MyError::Overflow)?
        .checked_div(1_000_000u128)  // normalize the rate
        .ok_or(MyError::DivisionByZero)?;

    // Cast back — ensure it fits in u64
    u64::try_from(reward).map_err(|_| error!(MyError::Overflow))
}`, 'rust'),
    ],
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// DEFI AMM
// ══════════════════════════════════════════════════════════════════════════════

const defiLessons = [
  {
    _id: 'lesson-constant-product-formula',
    _type: 'lesson',
    title: 'Constant Product Formula (x·y=k)',
    lessonType: 'content',
    order: 1,
    xpReward: 75,
    estimatedMinutes: 20,
    content: [
      block('Automated Market Makers (AMMs) replace order books with a mathematical formula. Uniswap popularized the constant product formula x·y=k, where x and y are token reserves and k is a constant that never changes (except when liquidity is added/removed).'),
      block('The Formula', 'h2'),
      code(`// The invariant: x * y = k must hold before and after every swap
//
// Pool has 1000 SOL (x) and 100,000 USDC (y)
// k = 1000 * 100,000 = 100,000,000
//
// User wants to swap 10 SOL for USDC:
// After swap: x' = 1010 SOL (pool receives 10 SOL)
// Solve for y': y' = k / x' = 100,000,000 / 1010 ≈ 99,010 USDC
// USDC out = 100,000 - 99,010 = 990 USDC
//
// Effective price: 990 USDC / 10 SOL = 99 USDC/SOL
// vs initial: 100,000 / 1000 = 100 USDC/SOL (1% price impact)

function calculateSwapOut(
  amountIn: number,
  reserveIn: number,
  reserveOut: number,
  feeBps: number = 30  // 0.3% fee
): number {
  const amountInAfterFee = amountIn * (10000 - feeBps) / 10000;
  const newReserveIn = reserveIn + amountInAfterFee;
  const newReserveOut = (reserveIn * reserveOut) / newReserveIn;
  return reserveOut - newReserveOut;
}

// Test:
const out = calculateSwapOut(10, 1000, 100000, 30);
console.log(out.toFixed(2)); // ≈ 987.16 USDC (after 0.3% fee)`, 'typescript'),
      block('Price Impact & Slippage', 'h2'),
      code(`// Price impact: how much your trade moves the price
// Small pool = high impact, Large pool = low impact

function priceImpact(amountIn: number, reserveIn: number): number {
  // As a percentage of the pool reserve
  return (amountIn / reserveIn) * 100;
}

// Slippage: difference between expected price and execution price
// You set a slippage tolerance (e.g., 1%) in the swap UI
// If market moves more than that between signing and execution → TX fails
// This protects you from sandwich attacks

// Minimum out with 1% slippage tolerance:
const expectedOut = calculateSwapOut(100, 10000, 1000000);
const minOut = expectedOut * 0.99;  // accept up to 1% worse
// Pass minOut to swap instruction — program reverts if actualOut < minOut`, 'typescript'),
      block('Why x·y=k Works', 'h2'),
      code(`// Key properties of constant product AMM:
// 1. Always has liquidity (reserves never reach 0 — asymptote)
// 2. Price adjusts automatically with supply/demand
// 3. Arbitrageurs keep pool price aligned with external markets
// 4. No order books, no market makers, fully permissionless

// Arbitrage example:
// External price: 1 SOL = 110 USDC
// Pool price: 1 SOL = 100 USDC (pool is cheap!)
// Arbitrageur buys SOL from pool, sells on external exchange
// → Pool SOL reserves decrease, USDC reserves increase
// → Pool price rises toward 110 USDC/SOL
// → Arbitrageur profits the spread`, 'typescript'),
    ],
  },
  {
    _id: 'lesson-challenge-swap-math',
    _type: 'lesson',
    title: 'Challenge: Swap Math',
    lessonType: 'challenge',
    order: 3,
    xpReward: 200,
    estimatedMinutes: 25,
    content: [
      block('Implement the core AMM swap calculation functions in TypeScript. You\'ll write calculateAmountOut (the constant product formula with fee), calculatePriceImpact, and validateSlippage.'),
      block('Details', 'h2'),
      block('The fee is expressed in basis points (1 bps = 0.01%). A 30 bps fee means 0.3% is taken from the input before applying the formula. Price impact is amountIn / reserveIn as a percentage. Slippage validation should throw if actualOut < minAmountOut.'),
    ],
    starterCode: `const FEE_BPS = 30; // 0.3% swap fee

/**
 * Calculate how many tokens you receive when swapping amountIn tokens.
 * Uses constant product formula: x * y = k
 * Fee is deducted from amountIn before the swap calculation.
 */
export function calculateAmountOut(
  amountIn: number,
  reserveIn: number,
  reserveOut: number,
  feeBps: number = FEE_BPS
): number {
  // TODO: implement constant product swap math with fee
  return 0;
}

/**
 * Calculate price impact as a percentage (0-100).
 * Price impact = how much your trade moves the pool price.
 */
export function calculatePriceImpact(
  amountIn: number,
  reserveIn: number
): number {
  // TODO: return (amountIn / reserveIn) * 100
  return 0;
}

/**
 * Validate slippage — throw if actual output is below minimum.
 */
export function validateSlippage(
  actualOut: number,
  minAmountOut: number
): void {
  // TODO: throw Error("Slippage exceeded") if actualOut < minAmountOut
}`,
    solutionCode: `const FEE_BPS = 30;

export function calculateAmountOut(
  amountIn: number,
  reserveIn: number,
  reserveOut: number,
  feeBps: number = FEE_BPS
): number {
  const amountInAfterFee = amountIn * (10000 - feeBps) / 10000;
  const newReserveIn = reserveIn + amountInAfterFee;
  const newReserveOut = (reserveIn * reserveOut) / newReserveIn;
  return reserveOut - newReserveOut;
}

export function calculatePriceImpact(
  amountIn: number,
  reserveIn: number
): number {
  return (amountIn / reserveIn) * 100;
}

export function validateSlippage(
  actualOut: number,
  minAmountOut: number
): void {
  if (actualOut < minAmountOut) {
    throw new Error("Slippage exceeded");
  }
}`,
    testCases: [
      { description: 'Implement calculateAmountOut function', input: 'calculateAmountOut', expectedOutput: 'true' },
      { description: 'Apply fee before swap calculation', input: '10000 - feeBps', expectedOutput: 'true' },
      { description: 'Implement calculatePriceImpact', input: 'calculatePriceImpact', expectedOutput: 'true' },
      { description: 'Implement validateSlippage with throw', input: 'throw', expectedOutput: 'true' },
      { description: 'Use minAmountOut in slippage validation', input: 'minAmountOut', expectedOutput: 'true' },
    ],
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// TOKEN-2022
// ══════════════════════════════════════════════════════════════════════════════

const token2022Lessons = [
  {
    _id: 'lesson-spl-to-token2022',
    _type: 'lesson',
    title: 'From SPL Token to Token-2022',
    lessonType: 'content',
    order: 1,
    xpReward: 50,
    estimatedMinutes: 12,
    content: [
      block('The original SPL Token program (TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA) launched in 2020. It\'s battle-tested and powers USDC, SOL wrapped, and most DeFi tokens. But it lacks features that modern DeFi needs: transfer fees, permanent account freezing, confidential transfers, and custom transfer logic.'),
      block('Token-2022 (also called Token Extensions) is the successor program deployed at Token2022... address. It\'s backwards-compatible — all SPL Token instructions work — but adds 16 extensions that mint creators can activate at mint creation time.'),
      block('Key Differences', 'h2'),
      code(`// SPL Token mint account layout (82 bytes fixed):
struct Mint {
    mint_authority: COption<Pubkey>,  // 36 bytes
    supply: u64,                       // 8 bytes
    decimals: u8,                      // 1 byte
    is_initialized: bool,              // 1 byte
    freeze_authority: COption<Pubkey>, // 36 bytes
}  // Total: 82 bytes, ALWAYS

// Token-2022 mint account layout (variable):
struct Mint {
    // same base fields: 82 bytes
    account_type: u8,        // +1 byte: marks as Token-2022 account
    // optional extension data appended after:
    // TransferFeeConfig, PermanentDelegate, NonTransferable, etc.
}  // Total: 82+ bytes depending on extensions enabled`, 'rust'),
      block('The Extension System', 'h2'),
      code(`// Extensions are enabled at MINT CREATION time — cannot be added later!
// Each extension adds data to the mint account and changes behavior

use spl_token_2022::extension::ExtensionType;

// Common extensions:
ExtensionType::TransferFeeConfig      // take fee on every transfer
ExtensionType::PermanentDelegate      // program can always move/burn tokens
ExtensionType::NonTransferable        // tokens cannot be transferred (soulbound)
ExtensionType::MintCloseAuthority     // mint can be closed to reclaim rent
ExtensionType::DefaultAccountState    // new accounts start frozen
ExtensionType::TransferHook           // call custom program on every transfer
ExtensionType::MetadataPointer        // point to on-chain metadata
ExtensionType::TokenMetadata          // store metadata IN the mint account
ExtensionType::ConfidentialTransfers  // private balances (zk-proof)
ExtensionType::InterestBearingConfig  // automatically accumulating interest`, 'rust'),
      block('Creating a Token-2022 Mint', 'h2'),
      code(`import {
  createInitializeMintInstruction,
  createInitializeNonTransferableMintInstruction,
  getMintLen,
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";

const extensions = [ExtensionType.NonTransferable];

// Calculate space needed for mint + extensions
const mintLen = getMintLen(extensions);
const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);

const tx = new Transaction().add(
  // 1. Create the account with correct size
  SystemProgram.createAccount({
    fromPubkey: payer.publicKey,
    newAccountPubkey: mintKeypair.publicKey,
    space: mintLen,
    lamports,
    programId: TOKEN_2022_PROGRAM_ID,  // ← key difference from SPL Token
  }),
  // 2. Initialize the NonTransferable extension FIRST
  createInitializeNonTransferableMintInstruction(
    mintKeypair.publicKey,
    TOKEN_2022_PROGRAM_ID,
  ),
  // 3. Initialize the mint itself
  createInitializeMintInstruction(
    mintKeypair.publicKey,
    9,                    // decimals
    mintAuthority,
    null,                 // freeze authority (none)
    TOKEN_2022_PROGRAM_ID,
  ),
);
await sendAndConfirmTransaction(connection, tx, [payer, mintKeypair]);`, 'typescript'),
    ],
  },
  {
    _id: 'lesson-challenge-soulbound-xp',
    _type: 'lesson',
    title: 'Challenge: Build a Soulbound XP Token',
    lessonType: 'challenge',
    order: 6,
    xpReward: 250,
    estimatedMinutes: 35,
    content: [
      block('Build the TypeScript setup code for a soulbound XP token using Token-2022. Soulbound means: NonTransferable + PermanentDelegate (so the program can burn but users can\'t transfer).'),
      block('Requirements', 'h2'),
      block('Write a function createSoulboundMint(connection, payer, mintKeypair, mintAuthority, programAuthority) that creates a Token-2022 mint with both NonTransferable and PermanentDelegate extensions enabled. The permanentDelegate should be set to programAuthority (so the on-chain program can manage tokens). Return the transaction signature.'),
    ],
    starterCode: `import {
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
  getMintLen,
  createInitializeMintInstruction,
  createInitializeNonTransferableMintInstruction,
  createInitializePermanentDelegateInstruction,
} from "@solana/spl-token";
import {
  Connection, Keypair, PublicKey,
  SystemProgram, Transaction, sendAndConfirmTransaction,
} from "@solana/web3.js";

/**
 * Create a soulbound Token-2022 mint with NonTransferable + PermanentDelegate.
 * Returns the transaction signature.
 */
export async function createSoulboundMint(
  connection: Connection,
  payer: Keypair,
  mintKeypair: Keypair,
  mintAuthority: PublicKey,
  programAuthority: PublicKey, // permanent delegate (can burn via program)
): Promise<string> {
  // TODO: define extensions array with NonTransferable + PermanentDelegate
  const extensions: ExtensionType[] = [];

  // TODO: calculate mint account size with getMintLen(extensions)

  // TODO: get rent-exempt balance

  // TODO: build transaction:
  //   1. SystemProgram.createAccount (with TOKEN_2022_PROGRAM_ID as programId)
  //   2. createInitializeNonTransferableMintInstruction
  //   3. createInitializePermanentDelegateInstruction (delegate = programAuthority)
  //   4. createInitializeMintInstruction (decimals=9, TOKEN_2022_PROGRAM_ID)

  // TODO: send and return signature
  return "";
}`,
    solutionCode: `import {
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
  getMintLen,
  createInitializeMintInstruction,
  createInitializeNonTransferableMintInstruction,
  createInitializePermanentDelegateInstruction,
} from "@solana/spl-token";
import {
  Connection, Keypair, PublicKey,
  SystemProgram, Transaction, sendAndConfirmTransaction,
} from "@solana/web3.js";

export async function createSoulboundMint(
  connection: Connection,
  payer: Keypair,
  mintKeypair: Keypair,
  mintAuthority: PublicKey,
  programAuthority: PublicKey,
): Promise<string> {
  const extensions = [
    ExtensionType.NonTransferable,
    ExtensionType.PermanentDelegate,
  ];

  const mintLen = getMintLen(extensions);
  const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);

  const tx = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      space: mintLen,
      lamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    createInitializeNonTransferableMintInstruction(
      mintKeypair.publicKey,
      TOKEN_2022_PROGRAM_ID,
    ),
    createInitializePermanentDelegateInstruction(
      mintKeypair.publicKey,
      programAuthority,
      TOKEN_2022_PROGRAM_ID,
    ),
    createInitializeMintInstruction(
      mintKeypair.publicKey,
      9,
      mintAuthority,
      null,
      TOKEN_2022_PROGRAM_ID,
    ),
  );

  return sendAndConfirmTransaction(connection, tx, [payer, mintKeypair]);
}`,
    testCases: [
      { description: 'Import TOKEN_2022_PROGRAM_ID', input: 'TOKEN_2022_PROGRAM_ID', expectedOutput: 'true' },
      { description: 'Use ExtensionType.NonTransferable', input: 'NonTransferable', expectedOutput: 'true' },
      { description: 'Use ExtensionType.PermanentDelegate', input: 'PermanentDelegate', expectedOutput: 'true' },
      { description: 'Call getMintLen with extensions', input: 'getMintLen', expectedOutput: 'true' },
      { description: 'Initialize NonTransferable extension', input: 'createInitializeNonTransferableMintInstruction', expectedOutput: 'true' },
      { description: 'Initialize PermanentDelegate extension', input: 'createInitializePermanentDelegateInstruction', expectedOutput: 'true' },
      { description: 'Use TOKEN_2022_PROGRAM_ID as programId in createAccount', input: 'programId: TOKEN_2022_PROGRAM_ID', expectedOutput: 'true' },
    ],
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// SEND ALL
// ══════════════════════════════════════════════════════════════════════════════

const allLessons = [
  ...anchorLessons,
  ...securityLessons,
  ...defiLessons,
  ...token2022Lessons,
];

const mutations = allLessons.map(l => ({ createOrReplace: l }));

console.log(`Seeding ${allLessons.length} lessons across 4 courses:\n`);
const courses = { 'anchor-basics': anchorLessons, 'program-security': securityLessons, 'defi-amm': defiLessons, 'token-2022': token2022Lessons };
for (const [course, lessons] of Object.entries(courses)) {
  console.log(`[${course}]`);
  lessons.forEach(l => console.log(`  - [${l.lessonType}] ${l.title} (${l.xpReward} XP, ${l.estimatedMinutes}min)`));
}
console.log('');

const response = await fetch(API, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
  body: JSON.stringify({ mutations }),
});

const result = await response.json();
if (result.error) { console.error('Error:', result.error); process.exit(1); }
console.log(`\n✓ Done! ${result.results?.length ?? 0} documents created/updated.`);
