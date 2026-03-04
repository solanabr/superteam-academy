export function getCourse5() {
  return {
    slug: "solana-security",
    title: "Solana Program Security",
    description:
      "Identify and prevent common vulnerabilities in Solana programs. Reentrancy, owner validation, PDA attacks, and more.",
    difficulty: "advanced",
    duration: "10 hours",
    xpTotal: 1800,
    trackId: 4,
    trackLevel: 1,
    trackName: "Program Security",
    creator: "Superteam Brazil",
    tags: ["security", "audit", "vulnerabilities"],
    prerequisites: ["anchor-fundamentals"],
    modules: {
      create: [
        // ── Module 1: Security Fundamentals ──────────────────────────────────
        {
          title: "Security Fundamentals",
          description:
            "Understand why security matters on Solana and survey the most common vulnerability classes that plague on-chain programs.",
          order: 0,
          lessons: {
            create: [
              {
                title: "Why Security Matters",
                description:
                  "Explore the unique security landscape of Solana programs and why even small bugs can lead to catastrophic fund loss.",
                type: "content",
                order: 0,
                xpReward: 25,
                duration: "20 min",
                content: `# Why Security Matters

## The Stakes of On-Chain Code

When you deploy a Solana program, you are deploying immutable financial infrastructure. Unlike traditional web applications where you can roll back a database or patch a server, on-chain exploits are irreversible. Once an attacker drains a vault or mints unauthorized tokens, those transactions are final. The Solana blockchain processes thousands of transactions per second, meaning an exploit can be repeated at machine speed before anyone notices.

## A History of Costly Bugs

The Solana ecosystem has seen hundreds of millions of dollars lost to program vulnerabilities. The Wormhole bridge exploit ($320M) stemmed from a missing signature verification. The Cashio stablecoin ($48M) collapsed because of insufficient account validation. Mango Markets ($114M) fell to an oracle manipulation attack. These were not obscure, complex attacks -- they exploited fundamental validation gaps that any security-conscious developer should catch.

## Why Solana Is Different

Solana's account model creates a unique attack surface compared to EVM chains:

- **Accounts are passed in externally.** The runtime does not enforce which accounts your program receives. If you forget to verify an account's owner, type, or address, an attacker can substitute a malicious account.
- **Programs are stateless.** All state lives in accounts, and any program can read any account. This means your program must defensively validate every piece of data it reads.
- **CPIs change the game.** Cross-Program Invocations let one program call another, but if you do not verify the target program ID, an attacker can redirect your CPI to a fake program.
- **PDAs are powerful but tricky.** Program Derived Addresses provide deterministic, off-curve addresses, but incorrect seed construction or missing bump validation can let attackers forge PDAs.

## The Cost of "Ship Fast, Fix Later"

In traditional software, technical debt accumulates gradually. In on-chain programs, a single missing check is not debt -- it is a live vulnerability with a direct financial incentive for exploitation. MEV searchers and black-hat actors continuously scan new program deployments for common vulnerability patterns using automated tools.

## What This Course Covers

Over the next four modules, you will learn to identify and prevent the most common vulnerability classes in Solana programs:

1. **Account validation** -- owner checks, signer verification, PDA validation
2. **Arithmetic bugs** -- overflow, underflow, precision loss, type confusion
3. **Advanced attacks** -- reentrancy, frontrunning, sandwich attacks
4. **Audit methodology** -- systematic approaches to reviewing program security

Each module pairs conceptual lessons with hands-on challenges where you will fix real vulnerable code. By the end, you will have the skills to audit your own programs and catch bugs before attackers do.`,
              },
              {
                title: "Solana's Security Model",
                description:
                  "Learn how the Solana runtime enforces security boundaries and where programs must provide their own validation.",
                type: "content",
                order: 1,
                xpReward: 30,
                duration: "25 min",
                content: `# Solana's Security Model

## Runtime Guarantees

The Solana runtime provides certain security guarantees automatically. Understanding exactly what the runtime does and does not enforce is critical for writing secure programs.

**What the runtime guarantees:**

- **Signature verification.** If a transaction includes a signature for a given public key, the runtime verifies it is valid before your program executes. You can trust \`AccountInfo::is_signer\`.
- **Lamport balance conservation.** The total lamports across all accounts in a transaction must be conserved. Programs cannot create or destroy SOL, only transfer it between accounts.
- **Account data ownership.** Only the owning program can modify an account's data. If your program owns an account, no other program can write to it.
- **Program isolation.** Programs execute in their own BPF virtual machine sandbox. One program cannot access another program's memory directly.

## What the Runtime Does NOT Guarantee

**Account identity.** The runtime does not verify that the accounts passed to your program are the ones you expect. An attacker can pass any account as any instruction argument. Your program must validate:

\`\`\`rust
// BAD: trusting the account is what the client says it is
let vault = &ctx.accounts.vault;

// GOOD: verifying the account's identity
require!(vault.owner == &spl_token::ID, SecurityError::InvalidOwner);
require!(vault.key() == expected_vault_pda, SecurityError::InvalidAccount);
\`\`\`

**Data deserialization safety.** The runtime does not verify that account data matches your expected struct layout. If you deserialize an account that was created by a different program or has been tampered with, you may read garbage data.

**PDA uniqueness enforcement.** While PDAs are deterministic, the runtime does not prevent you from deriving the wrong PDA. If your seeds are incorrect or you omit a seed, you might derive a PDA that collides with another account or that an attacker can predict and pre-create.

## The Anchor Safety Net

Anchor provides substantial security scaffolding through its account validation macros:

\`\`\`rust
#[derive(Accounts)]
pub struct SecureInstruction<'info> {
    #[account(mut, signer)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault", authority.key().as_ref()],
        bump = vault.bump,
        has_one = authority @ SecurityError::Unauthorized,
    )]
    pub vault: Account<'info, Vault>,
}
\`\`\`

Anchor's \`Account<'info, T>\` automatically checks the account owner and deserializes data. The \`seeds\` constraint verifies the PDA derivation. The \`has_one\` constraint checks that the \`authority\` field on the vault matches the signer. The \`Signer\` type enforces that the account signed the transaction.

## Defense in Depth

Even with Anchor, security requires a defense-in-depth approach. Anchor checks happen at the account validation layer, but your business logic must also be secure. For example, Anchor cannot prevent arithmetic overflow inside your instruction handler, nor can it verify that your token math rounds correctly. Every layer of your program -- validation, deserialization, computation, and CPI -- must be independently secure.`,
              },
              {
                title: "Common Vulnerability Classes",
                description:
                  "Survey the major categories of Solana program vulnerabilities including missing checks, arithmetic bugs, and logic errors.",
                type: "content",
                order: 2,
                xpReward: 35,
                duration: "25 min",
                content: `# Common Vulnerability Classes

## Overview

Solana program vulnerabilities fall into several well-known categories. Understanding these categories helps you systematically review code and catch bugs before deployment. This lesson surveys each class; later modules dive deep into each one.

## 1. Missing Account Validation

The most common class of vulnerability. Programs fail to verify one or more of:

- **Owner check** -- Is this account owned by the expected program?
- **Signer check** -- Did the correct authority sign this transaction?
- **Address check** -- Is this the specific account we expect (PDA verification)?
- **Type check** -- Does the account data match the expected struct?

\`\`\`rust
// VULNERABLE: No owner check -- attacker passes fake token account
pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    let vault = &ctx.accounts.vault;
    // Missing: require!(vault.owner == &spl_token::ID)
    transfer_tokens(vault, amount)?;
    Ok(())
}
\`\`\`

## 2. Arithmetic Bugs

Rust integers silently wrap on overflow in release mode. This leads to:

- **Integer overflow** -- Adding to \`u64::MAX\` wraps to zero
- **Integer underflow** -- Subtracting from zero wraps to \`u64::MAX\`
- **Precision loss** -- Dividing before multiplying loses decimal precision
- **Truncation** -- Casting \`u64\` to \`u32\` silently drops high bits

\`\`\`rust
// VULNERABLE: Overflow wraps to a small number in release mode
let new_balance = user.balance + deposit_amount; // Could wrap!

// SAFE: checked_add returns None on overflow
let new_balance = user.balance
    .checked_add(deposit_amount)
    .ok_or(ErrorCode::MathOverflow)?;
\`\`\`

## 3. PDA Derivation Errors

PDAs are deterministic addresses derived from seeds and a program ID. Common mistakes:

- **Missing seeds** -- Omitting a seed lets different users share a PDA
- **Wrong seed order** -- Changing seed order produces a different address
- **Bump recomputation** -- Recalculating the bump on every call wastes CU and can produce non-canonical bumps
- **Missing bump validation** -- Not verifying the stored bump matches the derived one

\`\`\`rust
// VULNERABLE: Missing user key in seeds -- all users share the same vault
seeds = [b"vault"]

// SECURE: Each user gets their own vault
seeds = [b"vault", user.key().as_ref()]
\`\`\`

## 4. Cross-Program Invocation (CPI) Attacks

When your program invokes another program via CPI:

- **Unverified program ID** -- Attacker substitutes a fake program
- **Missing signer seeds** -- PDA signer authority not properly derived
- **State mutation after CPI** -- Account data may have changed during the CPI

## 5. Logic Bugs

These are application-specific errors that no framework can prevent:

- **Incorrect state transitions** -- Allowing operations in invalid states
- **Missing reentrancy guards** -- Account data read before a CPI is stale after
- **Time-of-check vs time-of-use** -- Validating data that changes between check and use
- **Incorrect access control** -- Allowing unauthorized users to call admin functions

## 6. Oracle Manipulation

Programs that rely on external price data are vulnerable to:

- **Stale prices** -- Using prices that have not been updated recently
- **Single oracle reliance** -- One compromised feed controls your program
- **Flash loan attacks** -- Manipulating spot prices within a single transaction

Each of these vulnerability classes will be explored in detail with hands-on code challenges in the following modules.`,
              },
              {
                title: "Spot the Bug: Missing Signer",
                description:
                  "Your first security challenge: find and fix a missing signer check in an Anchor program.",
                type: "challenge",
                order: 3,
                xpReward: 100,
                duration: "30 min",
                content: `# Spot the Bug: Missing Signer

## Introduction

In this challenge, you will fix a real vulnerability pattern: a missing signer check. This is the most basic and most commonly exploited bug class in Solana programs.

## The Vulnerability

When a program modifies state that belongs to a specific user, it must verify that the user actually signed the transaction. Without this check, anyone can modify anyone else's state.

Consider a simple vault withdrawal instruction. The program should verify that the person requesting the withdrawal is actually the vault owner. If it does not, any account can drain any vault.

## Anchor's Signer Enforcement

Anchor provides the \`Signer<'info>\` type which automatically verifies that an account signed the transaction. Additionally, the \`has_one\` constraint can verify that a stored authority field matches the signer.

\`\`\`rust
#[derive(Accounts)]
pub struct SecureWithdraw<'info> {
    #[account(mut)]
    pub authority: Signer<'info>, // Enforces signature

    #[account(
        mut,
        has_one = authority, // Enforces vault.authority == authority.key()
    )]
    pub vault: Account<'info, Vault>,
}
\`\`\`

Without the \`Signer\` type, Anchor treats the account as a plain \`AccountInfo\` or \`UncheckedAccount\` and does not verify the signature. Without \`has_one\`, anyone who signs the transaction (even someone who is not the vault owner) can call the instruction.

## The Pattern

Missing signer checks often appear when developers:

1. Use \`UncheckedAccount\` or \`AccountInfo\` instead of \`Signer\` for authority accounts
2. Forget the \`has_one\` constraint linking the authority to the state account
3. Add a signer check in the instruction handler but not in the account validation struct (where Anchor can enforce it declaratively)

## Your Task

The starter code below contains a vault program with a \`withdraw\` instruction. The vault has an \`authority\` field, but the account validation struct does not properly enforce that the caller is the vault's authority. Fix the account validation to ensure only the vault owner can withdraw.

## Hints

- Look at the type of the \`authority\` account in the \`Withdraw\` struct
- Consider what constraints are missing on the \`vault\` account
- Anchor's \`Signer<'info>\` type and \`has_one\` constraint are your primary tools`,
                challenge: {
                  create: {
                    prompt:
                      "Fix the Withdraw account struct so that only the vault's authority can withdraw funds. The current code allows anyone to drain any vault.",
                    starterCode: `use anchor_lang::prelude::*;

declare_id!("Sec1111111111111111111111111111111111111111");

#[program]
pub mod insecure_vault {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.authority = ctx.accounts.authority.key();
        vault.balance = 0;
        vault.bump = ctx.bumps.vault;
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.balance = vault.balance.checked_add(amount).unwrap();
        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        require!(vault.balance >= amount, VaultError::InsufficientBalance);
        vault.balance = vault.balance.checked_sub(amount).unwrap();
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + Vault::INIT_SPACE,
        seeds = [b"vault", authority.key().as_ref()],
        bump,
    )]
    pub vault: Account<'info, Vault>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub depositor: Signer<'info>,

    #[account(mut)]
    pub vault: Account<'info, Vault>,
}

// BUG: This struct does not properly validate the authority
#[derive(Accounts)]
pub struct Withdraw<'info> {
    /// CHECK: This should be a Signer and linked to the vault
    pub authority: UncheckedAccount<'info>,

    #[account(mut)]
    pub vault: Account<'info, Vault>,
}

#[account]
#[derive(InitSpace)]
pub struct Vault {
    pub authority: Pubkey,
    pub balance: u64,
    pub bump: u8,
}

#[error_code]
pub enum VaultError {
    #[msg("Insufficient balance")]
    InsufficientBalance,
}`,
                    language: "rust",
                    hints: [
                      "Change UncheckedAccount to Signer<'info> on the authority field to enforce that the account signed the transaction.",
                      "Add has_one = authority to the vault account constraint so Anchor verifies vault.authority == authority.key().",
                      "You can also add the seeds and bump constraints to the vault in Withdraw to verify the PDA derivation.",
                    ],
                    solution: `use anchor_lang::prelude::*;

declare_id!("Sec1111111111111111111111111111111111111111");

#[program]
pub mod insecure_vault {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.authority = ctx.accounts.authority.key();
        vault.balance = 0;
        vault.bump = ctx.bumps.vault;
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.balance = vault.balance.checked_add(amount).unwrap();
        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        require!(vault.balance >= amount, VaultError::InsufficientBalance);
        vault.balance = vault.balance.checked_sub(amount).unwrap();
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + Vault::INIT_SPACE,
        seeds = [b"vault", authority.key().as_ref()],
        bump,
    )]
    pub vault: Account<'info, Vault>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub depositor: Signer<'info>,

    #[account(mut)]
    pub vault: Account<'info, Vault>,
}

// FIXED: authority is now Signer and vault has has_one constraint
#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        has_one = authority @ VaultError::Unauthorized,
        seeds = [b"vault", authority.key().as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, Vault>,
}

#[account]
#[derive(InitSpace)]
pub struct Vault {
    pub authority: Pubkey,
    pub balance: u64,
    pub bump: u8,
}

#[error_code]
pub enum VaultError {
    #[msg("Insufficient balance")]
    InsufficientBalance,
    #[msg("Unauthorized access")]
    Unauthorized,
}`,
                    testCases: {
                      create: [
                        {
                          name: "authority is Signer type",
                          input:
                            "Check that Withdraw struct uses Signer<'info> for the authority field",
                          expectedOutput:
                            "authority field has type Signer<'info>",
                          order: 0,
                        },
                        {
                          name: "vault has has_one constraint",
                          input:
                            "Check that vault account has has_one = authority constraint",
                          expectedOutput:
                            "vault account includes has_one = authority",
                          order: 1,
                        },
                        {
                          name: "vault verifies PDA seeds",
                          input:
                            "Check that vault account has seeds and bump constraints",
                          expectedOutput:
                            "vault account includes seeds and bump validation",
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

        // ── Module 2: Account Validation ─────────────────────────────────────
        {
          title: "Account Validation",
          description:
            "Deep dive into account validation patterns: owner checks, signer verification, and PDA security.",
          order: 1,
          lessons: {
            create: [
              {
                title: "Owner Checks",
                description:
                  "Learn why verifying account ownership is critical and how to implement owner checks correctly in Anchor.",
                type: "content",
                order: 0,
                xpReward: 30,
                duration: "25 min",
                content: `# Owner Checks

## Why Owner Checks Matter

Every account on Solana has an \`owner\` field that specifies which program is allowed to modify its data. When your program receives an account, you must verify that the account is owned by the expected program. Without this check, an attacker can create a fake account with arbitrary data under a program they control, then pass it to your program as if it were legitimate.

## The Attack

Consider a lending protocol that accepts collateral token accounts. The program reads the token account's \`amount\` field to determine how much collateral the user has deposited:

\`\`\`rust
// VULNERABLE: No owner check
pub fn borrow(ctx: Context<Borrow>) -> Result<()> {
    let collateral = &ctx.accounts.collateral_account;
    // Reads the 'amount' field at a known byte offset
    let collateral_amount = read_amount(collateral)?;
    let borrow_limit = collateral_amount * 80 / 100;
    // ... issue loan up to borrow_limit ...
    Ok(())
}
\`\`\`

An attacker creates a fake account under their own program with data carefully laid out so the bytes at the \`amount\` offset contain \`u64::MAX\`. They pass this fake account as \`collateral_account\`. The program happily reads the fake amount and issues an enormous loan.

## The Fix: Owner Verification

The simplest fix is to verify the account's owner field:

\`\`\`rust
require!(
    collateral_account.owner == &spl_token::ID,
    LendingError::InvalidAccountOwner
);
\`\`\`

In Anchor, the \`Account<'info, T>\` type automatically performs this check. When you declare an account as \`Account<'info, TokenAccount>\`, Anchor verifies that:

1. The account is owned by the SPL Token program
2. The account data deserializes correctly as a \`TokenAccount\`
3. The discriminator (for Anchor accounts) matches the expected type

## Anchor's Built-in Protection

\`\`\`rust
#[derive(Accounts)]
pub struct SecureBorrow<'info> {
    // Anchor verifies: owner == spl_token::ID && deserializes as TokenAccount
    #[account(
        constraint = collateral.mint == ACCEPTED_MINT @ LendingError::WrongMint,
        constraint = collateral.owner == borrower.key() @ LendingError::WrongOwner,
    )]
    pub collateral: Account<'info, TokenAccount>,

    #[account(mut)]
    pub borrower: Signer<'info>,
}
\`\`\`

## When Owner Checks Are Not Enough

Owner checks verify that the correct program created the account, but they do not verify the account's identity. An attacker could pass a different token account that is legitimately owned by the SPL Token program but belongs to someone else or holds a different token. This is why you must combine owner checks with additional constraints:

- **Mint check** -- Verify the token account holds the correct token type
- **Authority check** -- Verify the token account belongs to the expected user
- **Address check** -- Verify the account's public key matches the expected PDA

## The UncheckedAccount Trap

Anchor's \`UncheckedAccount\` (aliased as \`AccountInfo\`) skips all validation. It is sometimes necessary (for accounts owned by other programs that Anchor cannot deserialize), but it shifts the validation burden entirely to you. Every use of \`UncheckedAccount\` should include a \`/// CHECK:\` comment explaining what manual validation you perform.

Always prefer typed accounts (\`Account\`, \`Program\`, \`Signer\`) over \`UncheckedAccount\` unless you have a specific reason to opt out of automatic validation.`,
              },
              {
                title: "Signer Verification",
                description:
                  "Understand the different patterns for verifying transaction signers and common pitfalls.",
                type: "content",
                order: 1,
                xpReward: 30,
                duration: "20 min",
                content: `# Signer Verification

## The Fundamentals

A signature on Solana proves that the holder of a private key authorized a transaction. The runtime verifies all signatures before any program executes. Your program can then check the \`is_signer\` flag on each \`AccountInfo\` to determine who authorized the transaction.

## Signer vs. Authority

These are different concepts that are often conflated:

- **Signer** -- An account that signed the current transaction (\`is_signer == true\`)
- **Authority** -- A public key stored in an account's data that represents who is allowed to perform an action

A secure instruction must verify both:

\`\`\`rust
// Step 1: Verify the account signed the transaction (Signer type does this)
// Step 2: Verify the signer matches the stored authority (has_one does this)
\`\`\`

## Common Pitfalls

### Pitfall 1: Checking Signer but Not Authority

\`\`\`rust
// VULNERABLE: Any signer can call this, not just the vault owner
#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub caller: Signer<'info>, // Enforces signature...

    #[account(mut)]
    pub vault: Account<'info, Vault>, // ...but doesn't check vault.authority == caller
}
\`\`\`

The \`Signer\` type only verifies that the account signed the transaction. It does not verify that this signer has any relationship to the vault. You must add \`has_one = caller\` (or a custom \`constraint\`) on the vault.

### Pitfall 2: Checking Authority but Not Signer

\`\`\`rust
// VULNERABLE: Verifies the right key but not that they signed
#[derive(Accounts)]
pub struct Withdraw<'info> {
    /// CHECK: authority account
    pub authority: UncheckedAccount<'info>, // No signer check!

    #[account(mut, has_one = authority)]
    pub vault: Account<'info, Vault>,
}
\`\`\`

Here, \`has_one\` verifies that the authority's key matches \`vault.authority\`, but since \`authority\` is an \`UncheckedAccount\`, Anchor does not verify the signature. An attacker can pass the vault owner's public key without their signature.

### Pitfall 3: Multi-Signer Requirements

Some instructions require multiple signers (e.g., both a user and an admin):

\`\`\`rust
#[derive(Accounts)]
pub struct AdminTransfer<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        has_one = admin @ AdminError::NotAdmin,
    )]
    pub config: Account<'info, Config>,
}
\`\`\`

## PDA Signers

PDAs cannot sign transactions normally because they have no private key. Instead, programs use \`invoke_signed\` to have the runtime verify PDA ownership during CPIs. The seeds used to derive the PDA serve as the "signature":

\`\`\`rust
let signer_seeds = &[b"vault", user.key().as_ref(), &[vault.bump]];
let signer = &[&signer_seeds[..]];
transfer(CpiContext::new_with_signer(token_program, accounts, signer), amount)?;
\`\`\`

If you use the wrong seeds or wrong bump, the CPI will fail with a "signer privilege escalated" error. This is a common debugging headache but is actually a security feature -- it means the runtime strictly enforces PDA signer derivation.

## Best Practice Summary

1. Always use \`Signer<'info>\` for accounts that must sign
2. Always pair \`Signer\` with \`has_one\` or a \`constraint\` linking the signer to the state
3. Store the canonical bump in account data and reuse it for PDA signers
4. Never use \`UncheckedAccount\` for accounts that must sign`,
              },
              {
                title: "Fix the Owner Check",
                description:
                  "Fix a vulnerable lending program that fails to validate the owner of a collateral token account.",
                type: "challenge",
                order: 2,
                xpReward: 100,
                duration: "35 min",
                content: `# Fix the Owner Check

## The Scenario

You are reviewing a simple lending protocol. Users deposit collateral (an SPL token account) and borrow against it. The program reads the collateral token account's balance to determine the borrow limit.

## The Vulnerability

The current implementation uses \`UncheckedAccount\` for the collateral account and manually reads the balance at a byte offset. It does not verify that the account is actually owned by the SPL Token program, nor does it verify the mint or the token account's owner field.

An attacker can create a fake account under a program they control, lay out the bytes so the balance field reads \`u64::MAX\`, and pass it as the collateral account. The program will happily compute an enormous borrow limit.

## What You Need to Fix

1. Replace the \`UncheckedAccount\` with a properly typed \`Account<'info, TokenAccount>\`
2. Add constraints to verify the token mint matches the accepted collateral mint
3. Add a constraint to verify the token account's owner (the wallet) matches the borrower
4. Remove the manual byte-offset reading and use the deserialized struct fields instead

## Key Concepts

- Anchor's \`Account<'info, TokenAccount>\` automatically verifies the SPL Token program owns the account
- The \`constraint\` attribute lets you add custom runtime checks
- Using typed accounts eliminates entire classes of deserialization bugs

## Why This Matters

The Cashio stablecoin exploit ($48M) was fundamentally an account validation failure. The program did not properly verify that the accounts passed in were legitimate, allowing an attacker to substitute fake accounts with manipulated data. This exact pattern -- trusting unvalidated account data -- is responsible for more dollar losses than any other vulnerability class in Solana.`,
                challenge: {
                  create: {
                    prompt:
                      "Fix the Borrow account struct to properly validate the collateral token account. Replace UncheckedAccount with typed Account<TokenAccount> and add appropriate constraints for mint and ownership.",
                    starterCode: `use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Mint};

declare_id!("Lend111111111111111111111111111111111111111");

// The accepted collateral mint (e.g., USDC)
pub const ACCEPTED_MINT: Pubkey = pubkey!("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

#[program]
pub mod insecure_lending {
    use super::*;

    pub fn borrow(ctx: Context<Borrow>, amount: u64) -> Result<()> {
        // Read balance from raw bytes (DANGEROUS -- no type safety)
        let collateral_data = ctx.accounts.collateral.try_borrow_data()?;
        let balance = u64::from_le_bytes(
            collateral_data[64..72].try_into().unwrap()
        );

        let borrow_limit = balance
            .checked_mul(80).unwrap()
            .checked_div(100).unwrap();

        require!(amount <= borrow_limit, LendingError::ExceedsBorrowLimit);

        let loan = &mut ctx.accounts.loan;
        loan.borrower = ctx.accounts.borrower.key();
        loan.amount = amount;
        loan.collateral_amount = balance;
        Ok(())
    }
}

// BUG: collateral account is not validated
#[derive(Accounts)]
pub struct Borrow<'info> {
    #[account(mut)]
    pub borrower: Signer<'info>,

    /// CHECK: This should be a typed token account with proper constraints
    pub collateral: UncheckedAccount<'info>,

    #[account(
        init,
        payer = borrower,
        space = 8 + Loan::INIT_SPACE,
    )]
    pub loan: Account<'info, Loan>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Loan {
    pub borrower: Pubkey,
    pub amount: u64,
    pub collateral_amount: u64,
}

#[error_code]
pub enum LendingError {
    #[msg("Amount exceeds borrow limit")]
    ExceedsBorrowLimit,
}`,
                    language: "rust",
                    hints: [
                      "Replace UncheckedAccount<'info> with Account<'info, TokenAccount> to get automatic owner and deserialization checks.",
                      "Add constraint = collateral.mint == ACCEPTED_MINT to verify the correct token type.",
                      "Add constraint = collateral.owner == borrower.key() to verify the token account belongs to the borrower.",
                      "In the instruction handler, use ctx.accounts.collateral.amount instead of raw byte reading.",
                    ],
                    solution: `use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Mint};

declare_id!("Lend111111111111111111111111111111111111111");

pub const ACCEPTED_MINT: Pubkey = pubkey!("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

#[program]
pub mod insecure_lending {
    use super::*;

    pub fn borrow(ctx: Context<Borrow>, amount: u64) -> Result<()> {
        // FIXED: Use typed access instead of raw byte reading
        let balance = ctx.accounts.collateral.amount;

        let borrow_limit = balance
            .checked_mul(80).unwrap()
            .checked_div(100).unwrap();

        require!(amount <= borrow_limit, LendingError::ExceedsBorrowLimit);

        let loan = &mut ctx.accounts.loan;
        loan.borrower = ctx.accounts.borrower.key();
        loan.amount = amount;
        loan.collateral_amount = balance;
        Ok(())
    }
}

// FIXED: collateral account is now properly validated
#[derive(Accounts)]
pub struct Borrow<'info> {
    #[account(mut)]
    pub borrower: Signer<'info>,

    #[account(
        constraint = collateral.mint == ACCEPTED_MINT @ LendingError::InvalidMint,
        constraint = collateral.owner == borrower.key() @ LendingError::NotCollateralOwner,
    )]
    pub collateral: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = borrower,
        space = 8 + Loan::INIT_SPACE,
    )]
    pub loan: Account<'info, Loan>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Loan {
    pub borrower: Pubkey,
    pub amount: u64,
    pub collateral_amount: u64,
}

#[error_code]
pub enum LendingError {
    #[msg("Amount exceeds borrow limit")]
    ExceedsBorrowLimit,
    #[msg("Invalid collateral mint")]
    InvalidMint,
    #[msg("Collateral account not owned by borrower")]
    NotCollateralOwner,
}`,
                    testCases: {
                      create: [
                        {
                          name: "collateral uses typed Account<TokenAccount>",
                          input:
                            "Check that collateral field uses Account<'info, TokenAccount> type",
                          expectedOutput:
                            "collateral field is Account<'info, TokenAccount>",
                          order: 0,
                        },
                        {
                          name: "mint constraint present",
                          input:
                            "Check that collateral has a constraint verifying mint == ACCEPTED_MINT",
                          expectedOutput:
                            "collateral has mint validation constraint",
                          order: 1,
                        },
                        {
                          name: "owner constraint present",
                          input:
                            "Check that collateral has a constraint verifying owner == borrower.key()",
                          expectedOutput:
                            "collateral has token owner validation constraint",
                          order: 2,
                        },
                      ],
                    },
                  },
                },
              },
              {
                title: "PDA Validation Patterns",
                description:
                  "Master PDA derivation security: seed construction, bump canonicality, and address verification patterns.",
                type: "content",
                order: 3,
                xpReward: 35,
                duration: "25 min",
                content: `# PDA Validation Patterns

## How PDAs Work

Program Derived Addresses (PDAs) are deterministic addresses derived from a set of seeds and a program ID using \`Pubkey::find_program_address\`. The function iterates through bump values (255 down to 0) until it finds one that produces an off-curve point (not a valid public key on the Ed25519 curve). This ensures no private key exists for the address.

\`\`\`rust
let (pda, bump) = Pubkey::find_program_address(
    &[b"vault", user_key.as_ref()],
    &program_id,
);
\`\`\`

## Vulnerability: Missing Seed Components

The most common PDA vulnerability is missing a critical seed component. If you derive a vault PDA using only a static seed:

\`\`\`rust
// VULNERABLE: All users share the same vault PDA
seeds = [b"vault"]
\`\`\`

Every user gets the same vault address. The first user to initialize it owns it, but the address collision means the program cannot create separate vaults per user. Worse, if the program logic does not check the vault owner, any user can access the shared vault.

The fix is to include a user-specific seed:

\`\`\`rust
// SECURE: Each user gets a unique vault PDA
seeds = [b"vault", user.key().as_ref()]
\`\`\`

## Vulnerability: Bump Canonicality

\`find_program_address\` returns the canonical bump -- the highest bump value that produces a valid PDA. However, lower bumps may also produce valid off-curve points. If your program accepts arbitrary bumps:

\`\`\`rust
// VULNERABLE: Attacker can use a non-canonical bump
let (pda, _) = Pubkey::create_program_address(
    &[b"vault", user.as_ref(), &[attacker_chosen_bump]],
    &program_id,
)?;
\`\`\`

This can create a different PDA than the one your program initialized, potentially bypassing access controls. Always store the canonical bump from \`find_program_address\` and verify it on subsequent calls:

\`\`\`rust
#[account(
    seeds = [b"vault", user.key().as_ref()],
    bump = vault.bump, // Uses stored canonical bump
)]
pub vault: Account<'info, Vault>,
\`\`\`

## Vulnerability: Seed Order Dependence

PDA derivation is order-sensitive. \`[b"vault", user.as_ref()]\` produces a completely different address than \`[user.as_ref(), b"vault"]\`. If your program inconsistently orders seeds between initialization and subsequent access, the addresses will not match.

## Vulnerability: Cross-Program PDA Confusion

A PDA derived by Program A is different from a PDA derived with the same seeds by Program B (because the program ID is part of the derivation). If your program accepts a PDA derived by another program without verifying the derivation, an attacker can create a PDA under a malicious program that happens to have the right data layout.

Anchor handles this automatically when you use \`seeds\` and \`bump\` constraints -- it always derives using the current program's ID and verifies the result matches the provided account.

## Best Practices

1. **Always include user-specific seeds** for per-user accounts
2. **Store and reuse the canonical bump** -- never recompute it
3. **Use consistent seed ordering** across all instructions
4. **Let Anchor verify PDA derivation** with \`seeds\` and \`bump\` constraints
5. **Document your seed scheme** so auditors can verify completeness
6. **Include the entity type in seeds** (e.g., \`b"vault"\`, \`b"loan"\`) to prevent cross-type collisions

\`\`\`rust
// Gold standard PDA pattern in Anchor
#[account(
    init,
    payer = user,
    space = 8 + Vault::INIT_SPACE,
    seeds = [b"vault", user.key().as_ref()],
    bump,
)]
pub vault: Account<'info, Vault>,
\`\`\`

On subsequent access:

\`\`\`rust
#[account(
    mut,
    seeds = [b"vault", user.key().as_ref()],
    bump = vault.bump, // stored canonical bump
    has_one = user @ VaultError::Unauthorized,
)]
pub vault: Account<'info, Vault>,
\`\`\``,
              },
              {
                title: "Secure PDA Derivation",
                description:
                  "Fix a program with flawed PDA seed construction that allows account collision attacks.",
                type: "challenge",
                order: 4,
                xpReward: 100,
                duration: "35 min",
                content: `# Secure PDA Derivation

## The Scenario

You are reviewing a staking program where users can create staking positions for different token mints. Each user should have a unique staking account per mint. The program derives staking account PDAs, but the seed construction is flawed.

## The Vulnerability

The current implementation has two PDA-related bugs:

1. **Missing seed component**: The staking account PDA does not include the mint address in its seeds, meaning a user can only have one staking position regardless of which token they stake. Worse, if the program allows re-initialization, an attacker could overwrite an existing position.

2. **Bump recomputation**: Instead of storing and reusing the canonical bump, the program recomputes it on every instruction call, wasting compute units and potentially allowing non-canonical bump attacks.

## What You Need to Fix

1. Add the mint public key to the PDA seeds so each (user, mint) pair gets a unique staking account
2. Store the canonical bump in the staking account data during initialization
3. Use the stored bump on subsequent access instead of recomputing it
4. Ensure all instructions that reference the staking PDA use consistent seed construction

## Why This Matters

PDA seed construction bugs have been exploited in multiple DeFi protocols. When users share a PDA that should be unique, or when attackers can derive alternate PDAs that bypass validation, funds are at risk. The Solana runtime guarantees PDA determinism, but only if your program uses seeds correctly.`,
                challenge: {
                  create: {
                    prompt:
                      "Fix the PDA seed construction in the staking program. Add the mint to the seeds, store the canonical bump, and reuse it on subsequent access.",
                    starterCode: `use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Mint};

declare_id!("Stak111111111111111111111111111111111111111");

#[program]
pub mod insecure_staking {
    use super::*;

    pub fn create_position(ctx: Context<CreatePosition>, amount: u64) -> Result<()> {
        let position = &mut ctx.accounts.position;
        position.owner = ctx.accounts.user.key();
        position.mint = ctx.accounts.mint.key();
        position.staked_amount = amount;
        position.created_at = Clock::get()?.unix_timestamp;
        // BUG: bump is not stored
        Ok(())
    }

    pub fn add_stake(ctx: Context<ModifyPosition>, amount: u64) -> Result<()> {
        let position = &mut ctx.accounts.position;
        position.staked_amount = position.staked_amount
            .checked_add(amount)
            .ok_or(StakingError::MathOverflow)?;
        Ok(())
    }

    pub fn unstake(ctx: Context<ModifyPosition>, amount: u64) -> Result<()> {
        let position = &mut ctx.accounts.position;
        require!(position.staked_amount >= amount, StakingError::InsufficientStake);
        position.staked_amount = position.staked_amount
            .checked_sub(amount)
            .ok_or(StakingError::MathOverflow)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreatePosition<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    pub mint: Account<'info, Mint>,

    // BUG: seeds do not include mint -- all mints share one PDA per user
    #[account(
        init,
        payer = user,
        space = 8 + StakePosition::INIT_SPACE,
        seeds = [b"stake", user.key().as_ref()],
        bump,
    )]
    pub position: Account<'info, StakePosition>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ModifyPosition<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    // BUG: seeds do not include mint, bump is recomputed
    #[account(
        mut,
        seeds = [b"stake", user.key().as_ref()],
        bump,
        has_one = owner @ StakingError::Unauthorized,
    )]
    pub position: Account<'info, StakePosition>,
}

#[account]
#[derive(InitSpace)]
pub struct StakePosition {
    pub owner: Pubkey,
    pub mint: Pubkey,
    pub staked_amount: u64,
    pub created_at: i64,
    // Missing: bump field
}

#[error_code]
pub enum StakingError {
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Insufficient stake")]
    InsufficientStake,
    #[msg("Unauthorized")]
    Unauthorized,
}`,
                    language: "rust",
                    hints: [
                      "Add mint.key().as_ref() to the seeds array in both CreatePosition and ModifyPosition.",
                      "Add a bump: u8 field to the StakePosition struct and store ctx.bumps.position during initialization.",
                      "In ModifyPosition, use bump = position.bump instead of bare bump to use the stored canonical bump.",
                    ],
                    solution: `use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Mint};

declare_id!("Stak111111111111111111111111111111111111111");

#[program]
pub mod insecure_staking {
    use super::*;

    pub fn create_position(ctx: Context<CreatePosition>, amount: u64) -> Result<()> {
        let position = &mut ctx.accounts.position;
        position.owner = ctx.accounts.user.key();
        position.mint = ctx.accounts.mint.key();
        position.staked_amount = amount;
        position.created_at = Clock::get()?.unix_timestamp;
        position.bump = ctx.bumps.position; // FIXED: store canonical bump
        Ok(())
    }

    pub fn add_stake(ctx: Context<ModifyPosition>, amount: u64) -> Result<()> {
        let position = &mut ctx.accounts.position;
        position.staked_amount = position.staked_amount
            .checked_add(amount)
            .ok_or(StakingError::MathOverflow)?;
        Ok(())
    }

    pub fn unstake(ctx: Context<ModifyPosition>, amount: u64) -> Result<()> {
        let position = &mut ctx.accounts.position;
        require!(position.staked_amount >= amount, StakingError::InsufficientStake);
        position.staked_amount = position.staked_amount
            .checked_sub(amount)
            .ok_or(StakingError::MathOverflow)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreatePosition<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    pub mint: Account<'info, Mint>,

    // FIXED: include mint in seeds for unique PDA per (user, mint)
    #[account(
        init,
        payer = user,
        space = 8 + StakePosition::INIT_SPACE,
        seeds = [b"stake", user.key().as_ref(), mint.key().as_ref()],
        bump,
    )]
    pub position: Account<'info, StakePosition>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ModifyPosition<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    pub mint: Account<'info, Mint>,

    // FIXED: include mint in seeds, use stored bump
    #[account(
        mut,
        seeds = [b"stake", user.key().as_ref(), mint.key().as_ref()],
        bump = position.bump,
        has_one = owner @ StakingError::Unauthorized,
    )]
    pub position: Account<'info, StakePosition>,
}

#[account]
#[derive(InitSpace)]
pub struct StakePosition {
    pub owner: Pubkey,
    pub mint: Pubkey,
    pub staked_amount: u64,
    pub created_at: i64,
    pub bump: u8, // FIXED: store canonical bump
}

#[error_code]
pub enum StakingError {
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Insufficient stake")]
    InsufficientStake,
    #[msg("Unauthorized")]
    Unauthorized,
}`,
                    testCases: {
                      create: [
                        {
                          name: "seeds include mint in CreatePosition",
                          input:
                            "Check that CreatePosition seeds include mint.key().as_ref()",
                          expectedOutput: "seeds contain user key and mint key",
                          order: 0,
                        },
                        {
                          name: "seeds include mint in ModifyPosition",
                          input:
                            "Check that ModifyPosition seeds include mint.key().as_ref()",
                          expectedOutput: "seeds contain user key and mint key",
                          order: 1,
                        },
                        {
                          name: "bump is stored and reused",
                          input:
                            "Check that StakePosition has bump field and ModifyPosition uses bump = position.bump",
                          expectedOutput:
                            "bump stored in account data and reused via bump = position.bump",
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

        // ── Module 3: Arithmetic & Logic Bugs ────────────────────────────────
        {
          title: "Arithmetic & Logic Bugs",
          description:
            "Master safe arithmetic in Rust: checked math, precision handling, type safety, and common token math pitfalls.",
          order: 2,
          lessons: {
            create: [
              {
                title: "Integer Overflow & Underflow",
                description:
                  "Understand how Rust handles integer overflow in debug vs release mode and why this matters for Solana programs.",
                type: "content",
                order: 0,
                xpReward: 30,
                duration: "20 min",
                content: `# Integer Overflow & Underflow

## The Silent Killer

Rust behaves differently with integer overflow depending on the build profile:

- **Debug mode** (\`cargo build\`): Overflow panics at runtime
- **Release mode** (\`cargo build --release\`): Overflow wraps silently

Solana programs are compiled in release mode for deployment. This means integer overflow does not panic -- it wraps around silently, producing completely wrong results.

\`\`\`rust
// In release mode on Solana:
let a: u64 = u64::MAX; // 18446744073709551615
let b: u64 = a + 1;     // Wraps to 0 (no panic!)
let c: u64 = 0u64 - 1;  // Wraps to u64::MAX (no panic!)
\`\`\`

## Real-World Impact

Consider a token vault that tracks deposited amounts:

\`\`\`rust
// VULNERABLE: overflow wraps balance to a small number
pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    vault.total_deposited = vault.total_deposited + amount; // Could wrap!
    Ok(())
}
\`\`\`

If \`total_deposited\` is close to \`u64::MAX\` and an attacker deposits a carefully chosen amount, the sum wraps to a small number. The vault now reports far less deposited than the actual token balance, potentially allowing the attacker to manipulate withdrawal calculations.

Underflow is equally dangerous:

\`\`\`rust
// VULNERABLE: underflow wraps to u64::MAX
pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    vault.total_deposited = vault.total_deposited - amount; // Could wrap!
    // Now total_deposited might be u64::MAX
    Ok(())
}
\`\`\`

## The Fix: Checked Arithmetic

Rust provides checked arithmetic methods that return \`Option<T>\` -- \`None\` on overflow, \`Some(result)\` on success:

\`\`\`rust
// SAFE: returns error on overflow
vault.total_deposited = vault.total_deposited
    .checked_add(amount)
    .ok_or(VaultError::MathOverflow)?;

// SAFE: returns error on underflow
vault.total_deposited = vault.total_deposited
    .checked_sub(amount)
    .ok_or(VaultError::MathUnderflow)?;

// SAFE: returns error on multiplication overflow
let total = price
    .checked_mul(quantity)
    .ok_or(VaultError::MathOverflow)?;
\`\`\`

## Available Checked Methods

| Method | Purpose |
|--------|---------|
| \`checked_add\` | Addition with overflow check |
| \`checked_sub\` | Subtraction with underflow check |
| \`checked_mul\` | Multiplication with overflow check |
| \`checked_div\` | Division with divide-by-zero check |
| \`checked_pow\` | Exponentiation with overflow check |
| \`checked_shl\` | Left shift with overflow check |
| \`checked_shr\` | Right shift with overflow check |

## Saturating and Wrapping Alternatives

Sometimes you want overflow to clamp to the maximum value rather than error:

\`\`\`rust
// Clamps to u64::MAX instead of wrapping or erroring
let result = a.saturating_add(b);
let result = a.saturating_sub(b); // Clamps to 0
\`\`\`

Use saturating arithmetic only when clamping is the correct business logic (e.g., display-only counters). For financial calculations, always use \`checked_*\` and propagate the error.

## The Rule

In Solana programs: **never use +, -, *, / on integers that could overflow**. Always use \`checked_add\`, \`checked_sub\`, \`checked_mul\`, \`checked_div\`. This is non-negotiable for any value derived from user input or on-chain state.`,
              },
              {
                title: "Checked Math in Rust",
                description:
                  "Fix a token swap program that uses unchecked arithmetic vulnerable to overflow attacks.",
                type: "challenge",
                order: 1,
                xpReward: 100,
                duration: "30 min",
                content: `# Checked Math in Rust

## The Scenario

You are reviewing a constant-product AMM (automated market maker) that uses the formula \`x * y = k\`. The program calculates swap outputs and updates pool reserves, but all arithmetic uses standard operators (\`+\`, \`-\`, \`*\`, \`/\`) that silently wrap on overflow in release mode.

## The Vulnerability

The swap calculation multiplies two u64 values to compute the constant product. If the pool has large reserves, this multiplication can overflow u64, wrapping to a small number. An attacker can exploit this to receive far more output tokens than they should.

Similarly, the reserve updates after a swap use unchecked addition and subtraction. A carefully crafted swap amount could cause the input reserve addition to overflow or the output reserve subtraction to underflow.

## What You Need to Fix

Replace all arithmetic operators with their checked equivalents:
- \`+\` becomes \`checked_add\`
- \`-\` becomes \`checked_sub\`
- \`*\` becomes \`checked_mul\`
- \`/\` becomes \`checked_div\`

Each checked operation should propagate an appropriate error using \`.ok_or(ErrorCode)\` and the \`?\` operator.

## Learning Objective

After this challenge, using unchecked arithmetic in a Solana program should feel as wrong as using \`unwrap()\` on user input. Checked math is the default; unchecked math requires explicit justification.`,
                challenge: {
                  create: {
                    prompt:
                      "Fix all arithmetic in the swap function to use checked operations (checked_add, checked_sub, checked_mul, checked_div). Every arithmetic operation must handle overflow/underflow by returning an error.",
                    starterCode: `use anchor_lang::prelude::*;

declare_id!("Swap111111111111111111111111111111111111111");

#[program]
pub mod insecure_swap {
    use super::*;

    pub fn swap(ctx: Context<Swap>, amount_in: u64) -> Result<()> {
        require!(amount_in > 0, SwapError::ZeroAmount);

        let pool = &mut ctx.accounts.pool;

        // BUG: All arithmetic is unchecked -- can overflow/underflow
        let k = pool.reserve_a * pool.reserve_b; // Can overflow u64

        let new_reserve_a = pool.reserve_a + amount_in; // Can overflow
        let new_reserve_b = k / new_reserve_a; // k might be wrong from overflow
        let amount_out = pool.reserve_b - new_reserve_b; // Can underflow

        require!(amount_out > 0, SwapError::ZeroOutput);
        require!(amount_out <= pool.reserve_b, SwapError::InsufficientLiquidity);

        // Apply fee (0.3%)
        let fee = amount_out * 3 / 1000; // Can overflow
        let amount_out_after_fee = amount_out - fee; // Can underflow

        pool.reserve_a = new_reserve_a;
        pool.reserve_b = pool.reserve_b - amount_out; // Can underflow
        pool.total_fees = pool.total_fees + fee; // Can overflow

        msg!("Swapped {} for {}", amount_in, amount_out_after_fee);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Swap<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub pool: Account<'info, Pool>,
}

#[account]
#[derive(InitSpace)]
pub struct Pool {
    pub reserve_a: u64,
    pub reserve_b: u64,
    pub total_fees: u64,
}

#[error_code]
pub enum SwapError {
    #[msg("Amount must be greater than zero")]
    ZeroAmount,
    #[msg("Output amount is zero")]
    ZeroOutput,
    #[msg("Insufficient liquidity")]
    InsufficientLiquidity,
    #[msg("Math overflow")]
    MathOverflow,
}`,
                    language: "rust",
                    hints: [
                      "Use u128 for the k = reserve_a * reserve_b multiplication to avoid u64 overflow, then cast back to u64 for the result.",
                      "Replace pool.reserve_a + amount_in with pool.reserve_a.checked_add(amount_in).ok_or(SwapError::MathOverflow)?",
                      "Apply the same pattern to every -, *, / operation in the function.",
                    ],
                    solution: `use anchor_lang::prelude::*;

declare_id!("Swap111111111111111111111111111111111111111");

#[program]
pub mod insecure_swap {
    use super::*;

    pub fn swap(ctx: Context<Swap>, amount_in: u64) -> Result<()> {
        require!(amount_in > 0, SwapError::ZeroAmount);

        let pool = &mut ctx.accounts.pool;

        // FIXED: Use u128 for intermediate product to avoid overflow
        let k = (pool.reserve_a as u128)
            .checked_mul(pool.reserve_b as u128)
            .ok_or(SwapError::MathOverflow)?;

        let new_reserve_a = pool.reserve_a
            .checked_add(amount_in)
            .ok_or(SwapError::MathOverflow)?;

        let new_reserve_b = k
            .checked_div(new_reserve_a as u128)
            .ok_or(SwapError::MathOverflow)? as u64;

        let amount_out = pool.reserve_b
            .checked_sub(new_reserve_b)
            .ok_or(SwapError::MathOverflow)?;

        require!(amount_out > 0, SwapError::ZeroOutput);
        require!(amount_out <= pool.reserve_b, SwapError::InsufficientLiquidity);

        // Apply fee (0.3%)
        let fee = amount_out
            .checked_mul(3)
            .ok_or(SwapError::MathOverflow)?
            .checked_div(1000)
            .ok_or(SwapError::MathOverflow)?;

        let amount_out_after_fee = amount_out
            .checked_sub(fee)
            .ok_or(SwapError::MathOverflow)?;

        pool.reserve_a = new_reserve_a;
        pool.reserve_b = pool.reserve_b
            .checked_sub(amount_out)
            .ok_or(SwapError::MathOverflow)?;
        pool.total_fees = pool.total_fees
            .checked_add(fee)
            .ok_or(SwapError::MathOverflow)?;

        msg!("Swapped {} for {}", amount_in, amount_out_after_fee);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Swap<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub pool: Account<'info, Pool>,
}

#[account]
#[derive(InitSpace)]
pub struct Pool {
    pub reserve_a: u64,
    pub reserve_b: u64,
    pub total_fees: u64,
}

#[error_code]
pub enum SwapError {
    #[msg("Amount must be greater than zero")]
    ZeroAmount,
    #[msg("Output amount is zero")]
    ZeroOutput,
    #[msg("Insufficient liquidity")]
    InsufficientLiquidity,
    #[msg("Math overflow")]
    MathOverflow,
}`,
                    testCases: {
                      create: [
                        {
                          name: "k computation uses u128 or checked_mul",
                          input:
                            "Check that reserve_a * reserve_b uses u128 widening or checked_mul",
                          expectedOutput:
                            "multiplication uses u128 intermediate or checked_mul",
                          order: 0,
                        },
                        {
                          name: "all additions use checked_add",
                          input:
                            "Check that all + operations are replaced with checked_add",
                          expectedOutput:
                            "no unchecked addition operators on u64 values",
                          order: 1,
                        },
                        {
                          name: "all subtractions use checked_sub",
                          input:
                            "Check that all - operations are replaced with checked_sub",
                          expectedOutput:
                            "no unchecked subtraction operators on u64 values",
                          order: 2,
                        },
                      ],
                    },
                  },
                },
              },
              {
                title: "Type Confusion Attacks",
                description:
                  "Learn how type confusion allows attackers to reinterpret account data as a different struct and bypass validation.",
                type: "content",
                order: 2,
                xpReward: 35,
                duration: "25 min",
                content: `# Type Confusion Attacks

## What Is Type Confusion?

Type confusion occurs when a program interprets account data as the wrong type. On Solana, all account data is raw bytes. If your program deserializes an account without verifying its type, an attacker can pass an account of type A where type B is expected, and the bytes will be reinterpreted according to the wrong struct layout.

## How Anchor Prevents Type Confusion

Anchor adds an 8-byte discriminator to the beginning of every account. This discriminator is the first 8 bytes of the SHA256 hash of the account type name. When you use \`Account<'info, MyStruct>\`, Anchor automatically:

1. Reads the first 8 bytes of the account data
2. Computes the expected discriminator for \`MyStruct\`
3. Compares them -- if they do not match, the instruction fails

\`\`\`rust
// Anchor verifies the discriminator automatically
pub vault: Account<'info, Vault>,     // Only accepts Vault accounts
pub config: Account<'info, Config>,   // Only accepts Config accounts
\`\`\`

## When Type Confusion Still Happens

### 1. Using UncheckedAccount

\`\`\`rust
/// CHECK: we read data manually
pub data_account: UncheckedAccount<'info>,
\`\`\`

If you use \`UncheckedAccount\` and deserialize manually, there is no discriminator check. An attacker can pass any account.

### 2. Cross-Program Accounts

When your program reads accounts created by another program (e.g., SPL Token accounts), there is no Anchor discriminator. You must rely on the owner check (\`Account<'info, TokenAccount>\` checks that the SPL Token program owns the account) and the data layout.

### 3. Same-Program Type Confusion

Even with Anchor, if two account types in your program have similar layouts, a bug in your constraints could allow substituting one for the other. Anchor's discriminator prevents this at the type level, but if you bypass it (e.g., with raw deserialization), you are vulnerable.

## A Concrete Attack

Consider a program with two account types:

\`\`\`rust
#[account]
pub struct UserProfile {
    pub authority: Pubkey,  // offset 8
    pub level: u64,         // offset 40
    pub xp: u64,            // offset 48
}

#[account]
pub struct Reward {
    pub recipient: Pubkey,  // offset 8
    pub amount: u64,        // offset 40
    pub claimed: bool,      // offset 48
}
\`\`\`

If the program reads a "Reward" account but an attacker passes a "UserProfile" account (bypassing the discriminator check), the \`amount\` field (at offset 40) would be read from the \`level\` field of the UserProfile. A user with level 1000000 would appear to have a reward of 1000000 tokens.

## Prevention Strategies

1. **Always use typed accounts** -- \`Account<'info, T>\` instead of \`UncheckedAccount\`
2. **Never skip discriminator checks** -- if you must deserialize manually, verify the discriminator first
3. **Validate account addresses** -- even with correct types, verify the account is the specific one you expect (PDA seeds, stored references)
4. **Add explicit type tags** -- for non-Anchor accounts, include a type field in your struct and check it

\`\`\`rust
#[account]
pub struct Vault {
    pub account_type: u8, // 0 = Vault, 1 = Config, etc.
    pub authority: Pubkey,
    // ...
}
\`\`\`

5. **Audit cross-program interactions** -- when reading accounts from other programs, verify the owner and validate the data layout matches your expectations

Type confusion is a subtle bug class because it does not show up in normal testing (you always pass the right account types). It only manifests when an attacker deliberately substitutes account types. Thorough security testing must include negative test cases that attempt type confusion.`,
              },
              {
                title: "Precision Loss in Token Math",
                description:
                  "Understand how division ordering and decimal handling cause precision loss in token calculations.",
                type: "content",
                order: 3,
                xpReward: 35,
                duration: "25 min",
                content: `# Precision Loss in Token Math

## The Problem

Integer division in Rust truncates (rounds toward zero). When you divide before multiplying, you lose precision that can never be recovered:

\`\`\`rust
// WRONG ORDER: divide first, then multiply -- loses precision
let share_price = total_value / total_shares; // Truncates!
let user_value = share_price * user_shares;   // Precision already lost

// Example: total_value = 1000, total_shares = 3
// share_price = 1000 / 3 = 333 (lost 0.333...)
// user_value = 333 * 2 = 666 (should be 666.666...)
// User lost 0.666... tokens
\`\`\`

\`\`\`rust
// RIGHT ORDER: multiply first, then divide -- maximizes precision
let user_value = total_value
    .checked_mul(user_shares).unwrap()
    .checked_div(total_shares).unwrap();

// Example: total_value = 1000, user_shares = 2, total_shares = 3
// user_value = (1000 * 2) / 3 = 2000 / 3 = 666
// Only 0.666... lost (unavoidable with integers), not compounded
\`\`\`

## Rounding Direction Matters

When precision loss is unavoidable, the direction of rounding determines who benefits:

- **Round down (truncation)**: The protocol keeps the remainder. This is the safe default.
- **Round up**: The user gets an extra unit. This can be exploited.

\`\`\`rust
// Round down (default) -- favors the protocol
let tokens_out = (amount_in * reserve_out) / reserve_in;

// Round up -- favors the user (DANGEROUS for withdrawals)
let tokens_out = (amount_in * reserve_out + reserve_in - 1) / reserve_in;
\`\`\`

## The Rule: Round Against the User

In DeFi programs, always round in a direction that protects existing depositors and the protocol:

| Operation | Round Direction | Why |
|-----------|----------------|-----|
| Deposit (shares minted) | Down | User gets slightly fewer shares |
| Withdraw (tokens returned) | Down | User gets slightly fewer tokens |
| Borrow (amount granted) | Down | User borrows slightly less |
| Repay (interest owed) | Up | User pays slightly more interest |
| Fees collected | Up | Protocol collects slightly more |

## Decimal Handling with Token Amounts

SPL tokens use integer amounts with a decimal configuration. USDC has 6 decimals, meaning 1 USDC = 1,000,000 token units. SOL has 9 decimals (lamports). When performing math across tokens with different decimals:

\`\`\`rust
// WRONG: Mixing decimal scales
let usdc_amount: u64 = 1_000_000; // 1 USDC (6 decimals)
let sol_amount: u64 = 1_000_000_000; // 1 SOL (9 decimals)
let ratio = usdc_amount / sol_amount; // 0 (truncated to zero!)

// CORRECT: Normalize to a common scale
let usdc_scaled = (usdc_amount as u128) * 1_000_000_000; // Scale to 15 decimals
let sol_scaled = (sol_amount as u128) * 1_000_000; // Scale to 15 decimals
let ratio = usdc_scaled / sol_scaled; // 1_000_000_000 (represents 1.0)
\`\`\`

## The u128 Pattern

For intermediate calculations involving large token amounts, always widen to u128 before multiplying, then narrow back to u64 for the final result:

\`\`\`rust
let result = (a as u128)
    .checked_mul(b as u128)
    .ok_or(MathError)?
    .checked_div(c as u128)
    .ok_or(MathError)?;

require!(result <= u64::MAX as u128, MathError);
let result = result as u64;
\`\`\`

This prevents intermediate overflow when multiplying two large u64 values. The maximum u64 value squared fits comfortably in u128 (2^128 > (2^64)^2).

## Common Precision Loss Patterns

1. **Repeated small operations** -- Rounding error accumulates over many transactions
2. **Dust attacks** -- Attacker makes many tiny transactions to exploit rounding in their favor
3. **Share price manipulation** -- First depositor sets share price; tiny deposits with rounding can steal from later depositors
4. **Fee calculation** -- Fees computed on small amounts may round to zero, allowing fee-free transactions

Always test your math with extreme values: very small amounts (dust), very large amounts (close to u64::MAX), and edge cases like the first and last depositor in a pool.`,
              },
              {
                title: "Fix the Rounding Bug",
                description:
                  "Fix a vault share calculation that rounds in the wrong direction, allowing attackers to drain funds.",
                type: "challenge",
                order: 4,
                xpReward: 100,
                duration: "35 min",
                content: `# Fix the Rounding Bug

## The Scenario

You are reviewing a yield vault program. Users deposit tokens and receive shares. When withdrawing, shares are converted back to tokens based on the current share price (total tokens / total shares). The share calculation has precision loss bugs that allow an attacker to extract more tokens than they deposited.

## The Vulnerability

The current implementation has three bugs:

1. **Divides before multiplying** in the share calculation, losing precision
2. **Rounds up on deposits** (minting too many shares) instead of down
3. **Rounds up on withdrawals** (returning too many tokens) instead of down

The combined effect: an attacker can deposit and withdraw repeatedly, extracting a small amount of excess tokens each time. With enough iterations, the vault is drained.

## What You Need to Fix

1. Reorder arithmetic to multiply before dividing
2. Round share minting DOWN (fewer shares to the depositor)
3. Round token withdrawal DOWN (fewer tokens to the withdrawer)
4. Use u128 for intermediate calculations to prevent overflow
5. Add a minimum deposit to prevent dust-amount share manipulation

## Why This Matters

Share price manipulation through rounding bugs is one of the most common DeFi vulnerabilities. The "inflation attack" on ERC-4626 vaults (which applies equally to Solana vaults) exploits exactly this pattern. First depositor donates tokens to inflate the share price, then subsequent depositors receive zero shares due to rounding.`,
                challenge: {
                  create: {
                    prompt:
                      "Fix the share calculation math in the vault program. Ensure deposits round shares DOWN, withdrawals round tokens DOWN, and use u128 for intermediate calculations.",
                    starterCode: `use anchor_lang::prelude::*;

declare_id!("Vlt1111111111111111111111111111111111111111");

#[program]
pub mod insecure_vault {
    use super::*;

    pub fn deposit(ctx: Context<VaultAction>, amount: u64) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let user = &mut ctx.accounts.user_position;

        let shares_to_mint = if vault.total_shares == 0 {
            amount
        } else {
            // BUG: divides before multiplying, rounds incorrectly
            let share_price = vault.total_tokens / vault.total_shares;
            amount / share_price + 1 // +1 rounds UP (bad for protocol)
        };

        vault.total_tokens = vault.total_tokens + amount;
        vault.total_shares = vault.total_shares + shares_to_mint;
        user.shares = user.shares + shares_to_mint;

        Ok(())
    }

    pub fn withdraw(ctx: Context<VaultAction>, shares: u64) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let user = &mut ctx.accounts.user_position;

        require!(user.shares >= shares, VaultError::InsufficientShares);

        // BUG: divides before multiplying, rounds incorrectly
        let share_price = vault.total_tokens / vault.total_shares;
        let tokens_to_return = share_price * shares + 1; // +1 rounds UP (bad for protocol)

        vault.total_tokens = vault.total_tokens - tokens_to_return;
        vault.total_shares = vault.total_shares - shares;
        user.shares = user.shares - shares;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct VaultAction<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub vault: Account<'info, Vault>,

    #[account(mut, has_one = authority)]
    pub user_position: Account<'info, UserPosition>,
}

#[account]
#[derive(InitSpace)]
pub struct Vault {
    pub total_tokens: u64,
    pub total_shares: u64,
}

#[account]
#[derive(InitSpace)]
pub struct UserPosition {
    pub authority: Pubkey,
    pub shares: u64,
}

#[error_code]
pub enum VaultError {
    #[msg("Insufficient shares")]
    InsufficientShares,
    #[msg("Math overflow")]
    MathOverflow,
}`,
                    language: "rust",
                    hints: [
                      "For deposit shares: shares = (amount * total_shares) / total_tokens -- multiply first, divide second. Integer truncation rounds down automatically.",
                      "For withdrawal tokens: tokens = (shares * total_tokens) / total_shares -- same pattern. Remove the + 1 to round down.",
                      "Cast to u128 before multiplying to prevent overflow: (amount as u128).checked_mul(total_shares as u128)",
                      "Add a minimum deposit check to prevent the first depositor from manipulating the share price with a dust amount.",
                    ],
                    solution: `use anchor_lang::prelude::*;

declare_id!("Vlt1111111111111111111111111111111111111111");

const MIN_INITIAL_DEPOSIT: u64 = 1_000; // Prevent dust manipulation

#[program]
pub mod insecure_vault {
    use super::*;

    pub fn deposit(ctx: Context<VaultAction>, amount: u64) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let user = &mut ctx.accounts.user_position;

        let shares_to_mint = if vault.total_shares == 0 {
            require!(amount >= MIN_INITIAL_DEPOSIT, VaultError::DepositTooSmall);
            amount
        } else {
            // FIXED: multiply first, divide second, rounds DOWN (truncation)
            let shares = (amount as u128)
                .checked_mul(vault.total_shares as u128)
                .ok_or(VaultError::MathOverflow)?
                .checked_div(vault.total_tokens as u128)
                .ok_or(VaultError::MathOverflow)?;
            require!(shares > 0, VaultError::DepositTooSmall);
            require!(shares <= u64::MAX as u128, VaultError::MathOverflow);
            shares as u64
        };

        vault.total_tokens = vault.total_tokens
            .checked_add(amount)
            .ok_or(VaultError::MathOverflow)?;
        vault.total_shares = vault.total_shares
            .checked_add(shares_to_mint)
            .ok_or(VaultError::MathOverflow)?;
        user.shares = user.shares
            .checked_add(shares_to_mint)
            .ok_or(VaultError::MathOverflow)?;

        Ok(())
    }

    pub fn withdraw(ctx: Context<VaultAction>, shares: u64) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let user = &mut ctx.accounts.user_position;

        require!(user.shares >= shares, VaultError::InsufficientShares);

        // FIXED: multiply first, divide second, rounds DOWN (truncation)
        let tokens_to_return = (shares as u128)
            .checked_mul(vault.total_tokens as u128)
            .ok_or(VaultError::MathOverflow)?
            .checked_div(vault.total_shares as u128)
            .ok_or(VaultError::MathOverflow)?;

        require!(tokens_to_return <= u64::MAX as u128, VaultError::MathOverflow);
        let tokens_to_return = tokens_to_return as u64;

        vault.total_tokens = vault.total_tokens
            .checked_sub(tokens_to_return)
            .ok_or(VaultError::MathOverflow)?;
        vault.total_shares = vault.total_shares
            .checked_sub(shares)
            .ok_or(VaultError::MathOverflow)?;
        user.shares = user.shares
            .checked_sub(shares)
            .ok_or(VaultError::MathOverflow)?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct VaultAction<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub vault: Account<'info, Vault>,

    #[account(mut, has_one = authority)]
    pub user_position: Account<'info, UserPosition>,
}

#[account]
#[derive(InitSpace)]
pub struct Vault {
    pub total_tokens: u64,
    pub total_shares: u64,
}

#[account]
#[derive(InitSpace)]
pub struct UserPosition {
    pub authority: Pubkey,
    pub shares: u64,
}

#[error_code]
pub enum VaultError {
    #[msg("Insufficient shares")]
    InsufficientShares,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Deposit too small")]
    DepositTooSmall,
}`,
                    testCases: {
                      create: [
                        {
                          name: "deposit shares multiply before divide",
                          input:
                            "Check that share calculation does amount * total_shares / total_tokens (not divide first)",
                          expectedOutput:
                            "deposit uses multiply-first-divide-second pattern",
                          order: 0,
                        },
                        {
                          name: "withdraw tokens multiply before divide",
                          input:
                            "Check that token calculation does shares * total_tokens / total_shares (not divide first)",
                          expectedOutput:
                            "withdrawal uses multiply-first-divide-second pattern",
                          order: 1,
                        },
                        {
                          name: "no round-up bias",
                          input:
                            "Check that neither deposit nor withdrawal adds +1 or rounds up",
                          expectedOutput:
                            "both calculations round down via integer truncation",
                          order: 2,
                        },
                        {
                          name: "uses u128 for intermediate math",
                          input:
                            "Check that multiplications cast to u128 before computing",
                          expectedOutput:
                            "u128 used for intermediate multiplication",
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

        // ── Module 4: Advanced Attacks ───────────────────────────────────────
        {
          title: "Advanced Attacks",
          description:
            "Explore advanced attack vectors: reentrancy on Solana, frontrunning, sandwich attacks, and systematic audit methodology.",
          order: 3,
          lessons: {
            create: [
              {
                title: "Reentrancy on Solana",
                description:
                  "Understand how reentrancy works differently on Solana compared to EVM and when Solana programs are vulnerable.",
                type: "content",
                order: 0,
                xpReward: 35,
                duration: "25 min",
                content: `# Reentrancy on Solana

## Is Reentrancy Possible on Solana?

The short answer: yes, but differently from Ethereum.

On Ethereum, reentrancy occurs when Contract A calls Contract B, and Contract B calls back into Contract A before A finishes updating its state. The classic DAO hack exploited this: the withdrawal function sent ETH (triggering a callback) before updating the balance.

Solana's runtime prevents the exact same attack pattern through its account locking model: **if a program writes to an account, that account is exclusively locked for the duration of the instruction**. Another program cannot write to it simultaneously.

However, reentrancy-like vulnerabilities still exist on Solana through a different mechanism.

## The Solana Reentrancy Pattern

The vulnerability occurs when:

1. Your program reads state from Account X
2. Your program makes a CPI to another program
3. The other program modifies Account Y (not X) in a way that invalidates assumptions made in step 1
4. Your program continues executing with stale assumptions

\`\`\`rust
// VULNERABLE: Read state, CPI, then use stale state
pub fn redeem(ctx: Context<Redeem>) -> Result<()> {
    let vault = &ctx.accounts.vault;
    let user_shares = vault.user_shares; // Read BEFORE CPI

    // CPI: Transfer tokens based on shares
    transfer_tokens(vault, user_shares)?; // External call

    // The CPI could have changed conditions that affect share value
    // but we already read user_shares before the CPI

    let vault = &mut ctx.accounts.vault;
    vault.user_shares = 0; // Update AFTER CPI
    vault.total_shares -= user_shares;
    Ok(())
}
\`\`\`

## CPI Callback Attacks

A more direct reentrancy vector exists when:

1. Program A CPIs into Program B
2. Program B CPIs back into Program A
3. Program A's second invocation reads state that was not yet updated by the first invocation

Solana allows recursive CPI calls (up to a depth limit of 4), so this is technically possible. The account locking prevents simultaneous writes, but if the reentrant call reads from a different account or uses data that the first call has not yet updated, the attack succeeds.

## The Checks-Effects-Interactions Pattern

The solution is the same pattern used in Solidity: **Checks-Effects-Interactions (CEI)**:

1. **Checks**: Validate all preconditions
2. **Effects**: Update all state
3. **Interactions**: Make external calls (CPIs) last

\`\`\`rust
// SECURE: CEI pattern
pub fn redeem(ctx: Context<Redeem>) -> Result<()> {
    let vault = &mut ctx.accounts.vault;

    // CHECKS
    require!(vault.user_shares > 0, VaultError::NoShares);
    let shares = vault.user_shares;

    // EFFECTS (update state BEFORE external call)
    vault.user_shares = 0;
    vault.total_shares = vault.total_shares.checked_sub(shares).unwrap();

    // INTERACTIONS (CPI last)
    transfer_tokens(&ctx.accounts, shares)?;

    Ok(())
}
\`\`\`

## Anchor's reload() Method

After a CPI, account data cached in your instruction context may be stale. Anchor provides the \`reload()\` method to re-read account data from the runtime:

\`\`\`rust
// After CPI, reload if you need to read updated state
ctx.accounts.token_account.reload()?;
let updated_balance = ctx.accounts.token_account.amount;
\`\`\`

This is critical when your logic depends on state that may have been modified during a CPI.

## Reentrancy Guards

For defense in depth, you can add an explicit reentrancy guard:

\`\`\`rust
#[account]
pub struct Vault {
    pub locked: bool,
    // ... other fields
}

pub fn redeem(ctx: Context<Redeem>) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    require!(!vault.locked, VaultError::Reentrancy);
    vault.locked = true;

    // ... perform operation with CPI ...

    vault.locked = false;
    Ok(())
}
\`\`\`

This provides a second layer of protection even if you accidentally violate the CEI pattern.

## Key Takeaways

1. Solana's account locking prevents classic reentrancy but not all reentrancy-like attacks
2. Always follow the Checks-Effects-Interactions pattern
3. Update state before making CPIs
4. Use \`reload()\` after CPIs if you need to read potentially-modified state
5. Consider explicit reentrancy guards for high-value operations`,
              },
              {
                title: "Prevent Reentrancy",
                description:
                  "Fix a lending protocol that is vulnerable to a reentrancy-like attack through CPI ordering.",
                type: "challenge",
                order: 1,
                xpReward: 100,
                duration: "40 min",
                content: `# Prevent Reentrancy

## The Scenario

You are reviewing a lending protocol's liquidation function. When a borrower's collateral falls below the required ratio, a liquidator can repay part of the debt and seize the collateral. The current implementation updates state after the CPI transfers, creating a reentrancy-like vulnerability.

## The Vulnerability

The liquidation function:
1. Reads the borrower's debt and collateral amounts
2. Calculates the liquidation amounts
3. Makes a CPI to transfer collateral tokens to the liquidator
4. THEN updates the borrower's debt and collateral balances

Because the state update happens after the CPI, if the CPI triggers a callback (e.g., through a token transfer hook or an intermediary program), the callback can re-enter the liquidation function. Since the borrower's state has not been updated yet, the second call sees the original (unliquidated) debt and collateral, allowing double liquidation.

## What You Need to Fix

1. Reorder the function to follow Checks-Effects-Interactions (CEI)
2. Add a reentrancy guard flag on the loan account
3. Ensure all state mutations happen before any CPI
4. Add proper checked arithmetic throughout

## Why This Matters

Reentrancy attacks on lending protocols have caused some of the largest DeFi exploits in history. While Solana's account model provides some protection, the CEI pattern and explicit reentrancy guards remain essential for any program that makes CPIs.`,
                challenge: {
                  create: {
                    prompt:
                      "Reorder the liquidation function to follow Checks-Effects-Interactions pattern. Add a reentrancy guard and move all state updates before the CPI call.",
                    starterCode: `use anchor_lang::prelude::*;

declare_id!("Liq1111111111111111111111111111111111111111");

const LIQUIDATION_THRESHOLD: u64 = 150; // 150% collateral ratio
const LIQUIDATION_BONUS: u64 = 5; // 5% bonus for liquidator

#[program]
pub mod insecure_lending {
    use super::*;

    pub fn liquidate(ctx: Context<Liquidate>, repay_amount: u64) -> Result<()> {
        let loan = &ctx.accounts.loan;
        let price = ctx.accounts.price_feed.price;

        // CHECKS
        let collateral_value = loan.collateral_amount
            .checked_mul(price).unwrap()
            .checked_div(1_000_000).unwrap();

        let required_collateral = loan.debt_amount
            .checked_mul(LIQUIDATION_THRESHOLD).unwrap()
            .checked_div(100).unwrap();

        require!(collateral_value < required_collateral, LendingError::NotLiquidatable);
        require!(repay_amount <= loan.debt_amount, LendingError::RepayExceedsDebt);

        // Calculate collateral to seize (repay value + bonus)
        let seize_value = repay_amount
            .checked_mul(100 + LIQUIDATION_BONUS).unwrap()
            .checked_div(100).unwrap();
        let seize_amount = seize_value
            .checked_mul(1_000_000).unwrap()
            .checked_div(price).unwrap();

        // BUG: CPI BEFORE state update -- reentrancy risk!
        // INTERACTIONS (should be last)
        transfer_collateral(&ctx, seize_amount)?;

        // EFFECTS (should be before CPI)
        let loan = &mut ctx.accounts.loan;
        loan.debt_amount = loan.debt_amount
            .checked_sub(repay_amount).unwrap();
        loan.collateral_amount = loan.collateral_amount
            .checked_sub(seize_amount).unwrap();

        Ok(())
    }
}

fn transfer_collateral(ctx: &Context<Liquidate>, amount: u64) -> Result<()> {
    // Simulated CPI -- transfers collateral tokens to liquidator
    msg!("Transferring {} collateral to liquidator", amount);
    Ok(())
}

#[derive(Accounts)]
pub struct Liquidate<'info> {
    #[account(mut)]
    pub liquidator: Signer<'info>,

    #[account(mut)]
    pub loan: Account<'info, Loan>,

    pub price_feed: Account<'info, PriceFeed>,
}

#[account]
#[derive(InitSpace)]
pub struct Loan {
    pub borrower: Pubkey,
    pub debt_amount: u64,
    pub collateral_amount: u64,
    // Missing: reentrancy guard
}

#[account]
#[derive(InitSpace)]
pub struct PriceFeed {
    pub price: u64,
    pub last_updated: i64,
}

#[error_code]
pub enum LendingError {
    #[msg("Loan is not liquidatable")]
    NotLiquidatable,
    #[msg("Repay amount exceeds debt")]
    RepayExceedsDebt,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Reentrancy detected")]
    Reentrancy,
}`,
                    language: "rust",
                    hints: [
                      "Move the state updates (loan.debt_amount and loan.collateral_amount) BEFORE the transfer_collateral CPI call.",
                      "Add a 'locked: bool' field to the Loan struct and check it at the start of liquidate, set it to true, then false after completion.",
                      "Read all values you need from the loan before making it mutable and updating state.",
                    ],
                    solution: `use anchor_lang::prelude::*;

declare_id!("Liq1111111111111111111111111111111111111111");

const LIQUIDATION_THRESHOLD: u64 = 150;
const LIQUIDATION_BONUS: u64 = 5;

#[program]
pub mod insecure_lending {
    use super::*;

    pub fn liquidate(ctx: Context<Liquidate>, repay_amount: u64) -> Result<()> {
        let loan = &mut ctx.accounts.loan;
        let price = ctx.accounts.price_feed.price;

        // REENTRANCY GUARD
        require!(!loan.locked, LendingError::Reentrancy);
        loan.locked = true;

        // CHECKS
        let collateral_value = loan.collateral_amount
            .checked_mul(price)
            .ok_or(LendingError::MathOverflow)?
            .checked_div(1_000_000)
            .ok_or(LendingError::MathOverflow)?;

        let required_collateral = loan.debt_amount
            .checked_mul(LIQUIDATION_THRESHOLD)
            .ok_or(LendingError::MathOverflow)?
            .checked_div(100)
            .ok_or(LendingError::MathOverflow)?;

        require!(collateral_value < required_collateral, LendingError::NotLiquidatable);
        require!(repay_amount <= loan.debt_amount, LendingError::RepayExceedsDebt);

        let seize_value = repay_amount
            .checked_mul(100 + LIQUIDATION_BONUS)
            .ok_or(LendingError::MathOverflow)?
            .checked_div(100)
            .ok_or(LendingError::MathOverflow)?;
        let seize_amount = seize_value
            .checked_mul(1_000_000)
            .ok_or(LendingError::MathOverflow)?
            .checked_div(price)
            .ok_or(LendingError::MathOverflow)?;

        // EFFECTS (update state BEFORE CPI)
        loan.debt_amount = loan.debt_amount
            .checked_sub(repay_amount)
            .ok_or(LendingError::MathOverflow)?;
        loan.collateral_amount = loan.collateral_amount
            .checked_sub(seize_amount)
            .ok_or(LendingError::MathOverflow)?;

        // INTERACTIONS (CPI last)
        transfer_collateral(&ctx, seize_amount)?;

        // Release reentrancy guard
        ctx.accounts.loan.locked = false;

        Ok(())
    }
}

fn transfer_collateral(ctx: &Context<Liquidate>, amount: u64) -> Result<()> {
    msg!("Transferring {} collateral to liquidator", amount);
    Ok(())
}

#[derive(Accounts)]
pub struct Liquidate<'info> {
    #[account(mut)]
    pub liquidator: Signer<'info>,

    #[account(mut)]
    pub loan: Account<'info, Loan>,

    pub price_feed: Account<'info, PriceFeed>,
}

#[account]
#[derive(InitSpace)]
pub struct Loan {
    pub borrower: Pubkey,
    pub debt_amount: u64,
    pub collateral_amount: u64,
    pub locked: bool, // FIXED: reentrancy guard
}

#[account]
#[derive(InitSpace)]
pub struct PriceFeed {
    pub price: u64,
    pub last_updated: i64,
}

#[error_code]
pub enum LendingError {
    #[msg("Loan is not liquidatable")]
    NotLiquidatable,
    #[msg("Repay amount exceeds debt")]
    RepayExceedsDebt,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Reentrancy detected")]
    Reentrancy,
}`,
                    testCases: {
                      create: [
                        {
                          name: "state updates before CPI",
                          input:
                            "Check that debt_amount and collateral_amount are updated before transfer_collateral is called",
                          expectedOutput:
                            "state mutations occur before CPI call",
                          order: 0,
                        },
                        {
                          name: "reentrancy guard present",
                          input:
                            "Check that Loan has a locked field and liquidate checks and sets it",
                          expectedOutput:
                            "locked field exists and is checked at function start",
                          order: 1,
                        },
                        {
                          name: "reentrancy guard released",
                          input:
                            "Check that locked is set back to false after the operation completes",
                          expectedOutput: "locked is set to false after CPI",
                          order: 2,
                        },
                      ],
                    },
                  },
                },
              },
              {
                title: "Frontrunning & Sandwich",
                description:
                  "Understand how transaction ordering attacks work on Solana and strategies to protect users.",
                type: "content",
                order: 2,
                xpReward: 35,
                duration: "25 min",
                content: `# Frontrunning & Sandwich Attacks

## Transaction Ordering on Solana

Unlike Ethereum where miners/validators select and order transactions from a mempool, Solana uses a leader-based model. The current leader receives transactions and orders them into blocks. However, this does not eliminate ordering attacks -- it changes how they work.

## How Frontrunning Works on Solana

Frontrunning occurs when an attacker sees a pending transaction and submits their own transaction to execute before it. On Solana, this happens through:

1. **Validator-side ordering**: Validators (leaders) can reorder transactions within their slots. A validator running MEV software can insert their own transactions before user transactions.
2. **Network observation**: Transactions propagate through the QUIC network layer. Nodes between the user and the leader can observe and react to pending transactions.
3. **Jito bundles**: The Jito block engine (used by most Solana validators) allows searchers to submit transaction bundles with priority fees, guaranteeing execution order.

\`\`\`
User submits: Buy 100 SOL at market price
Attacker sees this and submits BEFORE:
  1. Buy SOL (pushes price up)
User's transaction executes at higher price
Attacker submits AFTER:
  2. Sell SOL (profits from price increase)
\`\`\`

## Sandwich Attacks

A sandwich attack wraps a victim's transaction between two attacker transactions:

1. **Front-run**: Attacker buys the asset, increasing the price
2. **Victim**: User's swap executes at a worse price
3. **Back-run**: Attacker sells the asset at the inflated price

The attacker profits from the price impact of the victim's trade.

## Protection Strategies

### 1. Slippage Protection

The most important defense. Every swap or trade instruction should include a minimum output amount:

\`\`\`rust
pub fn swap(
    ctx: Context<Swap>,
    amount_in: u64,
    minimum_amount_out: u64, // User specifies minimum acceptable output
) -> Result<()> {
    let amount_out = calculate_output(amount_in, &ctx.accounts.pool)?;

    require!(
        amount_out >= minimum_amount_out,
        SwapError::SlippageExceeded
    );

    // ... execute swap ...
    Ok(())
}
\`\`\`

If the attacker front-runs and moves the price, the victim's transaction fails because the output falls below the minimum. The attacker's front-run transaction is wasted.

### 2. Commit-Reveal Schemes

For actions where the intent must be hidden (e.g., auctions, liquidations), use a two-phase approach:

- **Phase 1 (Commit)**: User submits a hash of their action (\`hash(action + nonce)\`)
- **Phase 2 (Reveal)**: User reveals the actual action after the commit is on-chain

This prevents frontrunning because the attacker cannot see the action details during the commit phase.

### 3. Time-Weighted Average Price (TWAP)

Instead of using spot prices for critical calculations, use time-weighted averages that are harder to manipulate within a single transaction:

\`\`\`rust
pub fn get_twap_price(oracle: &OracleAccount) -> Result<u64> {
    let current_time = Clock::get()?.unix_timestamp;
    let time_elapsed = current_time - oracle.last_update_time;

    require!(time_elapsed <= MAX_STALENESS, OracleError::StalePrice);

    // TWAP is harder to manipulate than spot price
    Ok(oracle.twap_price)
}
\`\`\`

### 4. Batch Auctions

Instead of processing swaps individually, batch them together and execute at a uniform clearing price. This eliminates ordering advantages because all trades in the batch get the same price.

### 5. Private Transaction Submission

Users can submit transactions directly to the leader validator (skipping the public mempool) or use services that provide private transaction channels. On Solana, Jito provides a "private transaction" feature that prevents transaction content from being visible to searchers.

## Solana-Specific Considerations

- **Priority fees**: Higher priority fees increase the chance of being ordered first, but also increase the cost of an attack
- **Compute unit limits**: Solana's per-transaction compute limits constrain how much an attacker can do in a single transaction
- **Slot timing**: Solana's 400ms slot times give less time for observation and reaction compared to Ethereum's 12-second blocks
- **QUIC protocol**: Solana's use of QUIC for transaction submission provides some protection against network-level observation

The most practical defense for most programs is robust slippage protection combined with accurate oracle prices. These two measures together prevent the vast majority of frontrunning and sandwich attacks.`,
              },
              {
                title: "Audit Checklist",
                description:
                  "Apply everything you have learned in a comprehensive security audit challenge covering all vulnerability classes.",
                type: "challenge",
                order: 3,
                xpReward: 100,
                duration: "45 min",
                content: `# Audit Checklist

## The Final Challenge

This is a comprehensive security review challenge. You are presented with a token swap program that contains multiple vulnerabilities spanning every category covered in this course. Your task is to identify and fix all of them.

## Audit Methodology

Systematic auditing follows a checklist approach. For each instruction in a program, verify:

**Account Validation:**
- [ ] All accounts have correct owner checks
- [ ] All authority accounts are signers
- [ ] Signer accounts are linked to state via has_one or constraint
- [ ] PDAs are derived with correct seeds and stored bumps
- [ ] No UncheckedAccount used without manual validation

**Arithmetic Safety:**
- [ ] All arithmetic uses checked operations
- [ ] Multiplication happens before division
- [ ] u128 used for intermediate products of large values
- [ ] Rounding favors the protocol
- [ ] No truncation on type casts

**CPI Safety:**
- [ ] State updates happen before CPIs (CEI pattern)
- [ ] CPI target program IDs are verified
- [ ] Account data is reloaded after CPIs if needed

**Business Logic:**
- [ ] State transitions are valid
- [ ] Access control is correct for each instruction
- [ ] Edge cases handled (zero amounts, first/last user, empty pools)
- [ ] Slippage protection for price-sensitive operations

## The Program Under Audit

The starter code is a simplified token swap program. It contains at least six distinct vulnerabilities. Find them all and fix them.

## What You Need to Fix

Apply the full audit checklist to the program. Look for missing signer checks, unchecked arithmetic, missing owner validation, incorrect PDA usage, CEI violations, and missing slippage protection. Each fix should include the appropriate error variant.`,
                challenge: {
                  create: {
                    prompt:
                      "Audit and fix the token swap program. It contains at least six vulnerabilities: missing signer check, unchecked arithmetic, missing owner validation, incorrect PDA seeds, CEI violation, and missing slippage protection. Fix all of them.",
                    starterCode: `use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};

declare_id!("Aud1111111111111111111111111111111111111111");

#[program]
pub mod insecure_swap {
    use super::*;

    pub fn initialize_pool(ctx: Context<InitializePool>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        pool.authority = ctx.accounts.authority.key();
        pool.reserve_a = 0;
        pool.reserve_b = 0;
        pool.total_fees = 0;
        pool.locked = false;
        // BUG 4: bump not stored
        Ok(())
    }

    pub fn swap_a_to_b(
        ctx: Context<SwapTokens>,
        amount_in: u64,
        // BUG 6: no minimum_out parameter
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;

        require!(amount_in > 0, SwapError::ZeroAmount);

        // BUG 3: unchecked arithmetic throughout
        let k = pool.reserve_a * pool.reserve_b;
        let new_reserve_a = pool.reserve_a + amount_in;
        let new_reserve_b = k / new_reserve_a;
        let amount_out = pool.reserve_b - new_reserve_b;

        let fee = amount_out * 3 / 1000;
        let amount_out_after_fee = amount_out - fee;

        // BUG 5: CPI before state update
        transfer_tokens_out(&ctx, amount_out_after_fee)?;

        pool.reserve_a = new_reserve_a;
        pool.reserve_b = pool.reserve_b - amount_out;
        pool.total_fees = pool.total_fees + fee;

        Ok(())
    }

    pub fn withdraw_fees(ctx: Context<WithdrawFees>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let fees = pool.total_fees;
        pool.total_fees = 0;
        msg!("Withdrew {} in fees", fees);
        Ok(())
    }
}

fn transfer_tokens_out(ctx: &Context<SwapTokens>, amount: u64) -> Result<()> {
    msg!("Transferring {} tokens out", amount);
    Ok(())
}

#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + Pool::INIT_SPACE,
        // BUG 4: missing authority in seeds
        seeds = [b"pool"],
        bump,
    )]
    pub pool: Account<'info, Pool>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SwapTokens<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    // BUG 2: no owner/type validation on token accounts
    /// CHECK: should be typed token account
    pub user_token_a: UncheckedAccount<'info>,
    /// CHECK: should be typed token account
    pub user_token_b: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [b"pool"],
        bump,
    )]
    pub pool: Account<'info, Pool>,
}

// BUG 1: no signer check on authority
#[derive(Accounts)]
pub struct WithdrawFees<'info> {
    /// CHECK: should be signer and linked to pool
    pub authority: UncheckedAccount<'info>,

    #[account(mut)]
    pub pool: Account<'info, Pool>,
}

#[account]
#[derive(InitSpace)]
pub struct Pool {
    pub authority: Pubkey,
    pub reserve_a: u64,
    pub reserve_b: u64,
    pub total_fees: u64,
    pub locked: bool,
    // Missing: bump field
}

#[error_code]
pub enum SwapError {
    #[msg("Amount must be greater than zero")]
    ZeroAmount,
}`,
                    language: "rust",
                    hints: [
                      "BUG 1: Change authority in WithdrawFees to Signer<'info> and add has_one = authority on the pool.",
                      "BUG 2: Replace UncheckedAccount with Account<'info, TokenAccount> for the user token accounts.",
                      "BUG 3: Replace all * + - / with checked_mul, checked_add, checked_sub, checked_div. Use u128 for k.",
                      "BUG 4: Add authority.key().as_ref() to pool seeds and add a bump field to Pool struct.",
                      "BUG 5: Move the state updates (pool.reserve_a, pool.reserve_b, pool.total_fees) BEFORE transfer_tokens_out.",
                      "BUG 6: Add a minimum_out: u64 parameter to swap_a_to_b and require amount_out_after_fee >= minimum_out.",
                    ],
                    solution: `use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};

declare_id!("Aud1111111111111111111111111111111111111111");

#[program]
pub mod insecure_swap {
    use super::*;

    pub fn initialize_pool(ctx: Context<InitializePool>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        pool.authority = ctx.accounts.authority.key();
        pool.reserve_a = 0;
        pool.reserve_b = 0;
        pool.total_fees = 0;
        pool.locked = false;
        pool.bump = ctx.bumps.pool; // FIX 4: store bump
        Ok(())
    }

    pub fn swap_a_to_b(
        ctx: Context<SwapTokens>,
        amount_in: u64,
        minimum_out: u64, // FIX 6: slippage protection
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;

        require!(amount_in > 0, SwapError::ZeroAmount);

        // FIX 3: all checked arithmetic with u128 intermediate
        let k = (pool.reserve_a as u128)
            .checked_mul(pool.reserve_b as u128)
            .ok_or(SwapError::MathOverflow)?;

        let new_reserve_a = pool.reserve_a
            .checked_add(amount_in)
            .ok_or(SwapError::MathOverflow)?;

        let new_reserve_b = k
            .checked_div(new_reserve_a as u128)
            .ok_or(SwapError::MathOverflow)? as u64;

        let amount_out = pool.reserve_b
            .checked_sub(new_reserve_b)
            .ok_or(SwapError::MathOverflow)?;

        let fee = amount_out
            .checked_mul(3)
            .ok_or(SwapError::MathOverflow)?
            .checked_div(1000)
            .ok_or(SwapError::MathOverflow)?;

        let amount_out_after_fee = amount_out
            .checked_sub(fee)
            .ok_or(SwapError::MathOverflow)?;

        // FIX 6: enforce slippage protection
        require!(amount_out_after_fee >= minimum_out, SwapError::SlippageExceeded);

        // FIX 5: EFFECTS before INTERACTIONS (CEI pattern)
        pool.reserve_a = new_reserve_a;
        pool.reserve_b = pool.reserve_b
            .checked_sub(amount_out)
            .ok_or(SwapError::MathOverflow)?;
        pool.total_fees = pool.total_fees
            .checked_add(fee)
            .ok_or(SwapError::MathOverflow)?;

        // INTERACTIONS last
        transfer_tokens_out(&ctx, amount_out_after_fee)?;

        Ok(())
    }

    pub fn withdraw_fees(ctx: Context<WithdrawFees>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let fees = pool.total_fees;
        pool.total_fees = 0;
        msg!("Withdrew {} in fees", fees);
        Ok(())
    }
}

fn transfer_tokens_out(ctx: &Context<SwapTokens>, amount: u64) -> Result<()> {
    msg!("Transferring {} tokens out", amount);
    Ok(())
}

// FIX 4: include authority in seeds
#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + Pool::INIT_SPACE,
        seeds = [b"pool", authority.key().as_ref()],
        bump,
    )]
    pub pool: Account<'info, Pool>,
    pub system_program: Program<'info, System>,
}

// FIX 2: typed token accounts
#[derive(Accounts)]
pub struct SwapTokens<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        constraint = user_token_a.owner == user.key() @ SwapError::InvalidTokenOwner,
    )]
    pub user_token_a: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = user_token_b.owner == user.key() @ SwapError::InvalidTokenOwner,
    )]
    pub user_token_b: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"pool", pool.authority.as_ref()],
        bump = pool.bump,
    )]
    pub pool: Account<'info, Pool>,
}

// FIX 1: signer check and has_one
#[derive(Accounts)]
pub struct WithdrawFees<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        has_one = authority @ SwapError::Unauthorized,
    )]
    pub pool: Account<'info, Pool>,
}

#[account]
#[derive(InitSpace)]
pub struct Pool {
    pub authority: Pubkey,
    pub reserve_a: u64,
    pub reserve_b: u64,
    pub total_fees: u64,
    pub locked: bool,
    pub bump: u8, // FIX 4: store bump
}

#[error_code]
pub enum SwapError {
    #[msg("Amount must be greater than zero")]
    ZeroAmount,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Invalid token account owner")]
    InvalidTokenOwner,
    #[msg("Slippage tolerance exceeded")]
    SlippageExceeded,
}`,
                    testCases: {
                      create: [
                        {
                          name: "authority is Signer in WithdrawFees",
                          input:
                            "Check that WithdrawFees uses Signer<'info> for authority and has_one on pool",
                          expectedOutput:
                            "authority is Signer with has_one constraint",
                          order: 0,
                        },
                        {
                          name: "token accounts are typed",
                          input:
                            "Check that SwapTokens uses Account<'info, TokenAccount> instead of UncheckedAccount",
                          expectedOutput:
                            "token accounts use typed Account<TokenAccount>",
                          order: 1,
                        },
                        {
                          name: "arithmetic is checked",
                          input:
                            "Check that all arithmetic in swap_a_to_b uses checked operations",
                          expectedOutput:
                            "all operations use checked_mul, checked_add, checked_sub, checked_div",
                          order: 2,
                        },
                        {
                          name: "PDA seeds include authority",
                          input:
                            "Check that pool PDA seeds include authority key and bump is stored",
                          expectedOutput:
                            "seeds include authority and bump is stored in Pool struct",
                          order: 3,
                        },
                        {
                          name: "CEI pattern followed",
                          input:
                            "Check that state updates happen before transfer_tokens_out CPI",
                          expectedOutput:
                            "reserve and fee updates occur before CPI call",
                          order: 4,
                        },
                        {
                          name: "slippage protection present",
                          input:
                            "Check that swap_a_to_b has a minimum_out parameter with a require check",
                          expectedOutput:
                            "minimum_out parameter enforced with SlippageExceeded error",
                          order: 5,
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
