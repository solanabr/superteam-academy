import type { CodingChallenge } from './types';

export const securityChallenges: CodingChallenge[] = [
  {
    id: 'sec-001',
    title: 'Validate Account Owner',
    description:
      'Implement a function that validates whether an account is owned by the expected program. On Solana, any account can be passed to an instruction — failing to verify the owner allows attackers to substitute forged accounts with arbitrary data.',
    difficulty: 'beginner',
    category: 'security',
    language: 'rust',
    starterCode: `use solana_program::{account_info::AccountInfo, program_error::ProgramError, pubkey::Pubkey};

/// Validates that the given account is owned by the expected program.
/// Returns Ok(()) if valid, or Err(ProgramError::IncorrectProgramId) otherwise.
pub fn validate_account_owner(
    account: &AccountInfo,
    expected_owner: &Pubkey,
) -> Result<(), ProgramError> {
    // TODO: Compare account.owner with expected_owner
    // TODO: Return IncorrectProgramId error if they don't match
    Ok(())
}`,
    solution: `use solana_program::{account_info::AccountInfo, program_error::ProgramError, pubkey::Pubkey};

pub fn validate_account_owner(
    account: &AccountInfo,
    expected_owner: &Pubkey,
) -> Result<(), ProgramError> {
    if account.owner != expected_owner {
        return Err(ProgramError::IncorrectProgramId);
    }
    Ok(())
}`,
    testCases: [
      {
        input: 'account owned by expected_program',
        expectedOutput: 'Ok(())',
        description: 'Returns Ok when the account owner matches the expected program',
      },
      {
        input: 'account owned by system_program, expected token_program',
        expectedOutput: 'Err(IncorrectProgramId)',
        description: 'Returns error when account owner does not match',
      },
      {
        input: 'account owned by attacker_program',
        expectedOutput: 'Err(IncorrectProgramId)',
        description: 'Rejects an account forged by a different program',
      },
    ],
    hints: [
      'AccountInfo has an `owner` field that is a reference to the program that owns the account.',
      'Use a simple equality check: `account.owner != expected_owner`.',
      'Return `ProgramError::IncorrectProgramId` when the check fails.',
    ],
    xpReward: 50,
    estimatedMinutes: 10,
  },
  {
    id: 'sec-002',
    title: 'Verify Transaction Signer',
    description:
      'Write a function that verifies an account has signed the transaction. Without signer verification, anyone can invoke privileged instructions by passing an unsigned authority account.',
    difficulty: 'beginner',
    category: 'security',
    language: 'rust',
    starterCode: `use solana_program::{account_info::AccountInfo, program_error::ProgramError};

/// Verifies that the given account is a signer of the current transaction.
/// Returns Ok(()) if signed, or Err(ProgramError::MissingRequiredSignature).
pub fn verify_signer(account: &AccountInfo) -> Result<(), ProgramError> {
    // TODO: Check account.is_signer
    // TODO: Return MissingRequiredSignature error if not a signer
    Ok(())
}`,
    solution: `use solana_program::{account_info::AccountInfo, program_error::ProgramError};

pub fn verify_signer(account: &AccountInfo) -> Result<(), ProgramError> {
    if !account.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    Ok(())
}`,
    testCases: [
      {
        input: 'account with is_signer = true',
        expectedOutput: 'Ok(())',
        description: 'Passes when account has signed the transaction',
      },
      {
        input: 'account with is_signer = false',
        expectedOutput: 'Err(MissingRequiredSignature)',
        description: 'Fails when account has not signed the transaction',
      },
      {
        input: 'PDA account (is_signer = false, no keypair)',
        expectedOutput: 'Err(MissingRequiredSignature)',
        description: 'Rejects PDA accounts passed as authority without CPI signer seeds',
      },
    ],
    hints: [
      'The `AccountInfo` struct has a boolean field `is_signer`.',
      'If `is_signer` is false, the account did not authorize this transaction.',
      'Use `ProgramError::MissingRequiredSignature` for the error variant.',
    ],
    xpReward: 50,
    estimatedMinutes: 10,
  },
  {
    id: 'sec-003',
    title: 'PDA Seed Validation',
    description:
      'Implement a function that validates a PDA account by re-deriving it from expected seeds and comparing the result. Failing to verify PDA derivation lets attackers substitute a PDA from a different seed set to bypass access control.',
    difficulty: 'beginner',
    category: 'security',
    language: 'rust',
    starterCode: `use solana_program::{
    account_info::AccountInfo, program_error::ProgramError, pubkey::Pubkey,
};

/// Validates that the account key matches the PDA derived from the given seeds and program_id.
/// Returns the bump seed on success, or Err(ProgramError::InvalidSeeds) on failure.
pub fn validate_pda(
    account: &AccountInfo,
    seeds: &[&[u8]],
    program_id: &Pubkey,
) -> Result<u8, ProgramError> {
    // TODO: Use Pubkey::find_program_address to derive the expected PDA
    // TODO: Compare derived key with account.key
    // TODO: Return the bump seed if valid, or InvalidSeeds error if not
    Ok(0)
}`,
    solution: `use solana_program::{
    account_info::AccountInfo, program_error::ProgramError, pubkey::Pubkey,
};

pub fn validate_pda(
    account: &AccountInfo,
    seeds: &[&[u8]],
    program_id: &Pubkey,
) -> Result<u8, ProgramError> {
    let (expected_key, bump) = Pubkey::find_program_address(seeds, program_id);
    if *account.key != expected_key {
        return Err(ProgramError::InvalidSeeds);
    }
    Ok(bump)
}`,
    testCases: [
      {
        input: 'account matching PDA from seeds ["vault", user_pubkey]',
        expectedOutput: 'Ok(bump_seed)',
        description: 'Returns bump seed when account matches the derived PDA',
      },
      {
        input: 'random account key, seeds ["vault", user_pubkey]',
        expectedOutput: 'Err(InvalidSeeds)',
        description: 'Returns error when account key does not match derived PDA',
      },
      {
        input: 'PDA from different seeds ["pool", user_pubkey]',
        expectedOutput: 'Err(InvalidSeeds)',
        description: 'Rejects a valid PDA derived from different seeds',
      },
    ],
    hints: [
      '`Pubkey::find_program_address(seeds, program_id)` returns `(Pubkey, u8)` — the derived address and its bump seed.',
      'Compare the derived Pubkey against `*account.key` (dereference the reference).',
      'Return `ProgramError::InvalidSeeds` if the keys do not match.',
    ],
    xpReward: 50,
    estimatedMinutes: 12,
  },
  {
    id: 'sec-004',
    title: 'Detect Arithmetic Overflow',
    description:
      'Implement safe arithmetic operations that detect overflow instead of silently wrapping. Unchecked math in token/balance logic can lead to catastrophic fund loss — e.g., wrapping u64::MAX + 1 back to 0.',
    difficulty: 'beginner',
    category: 'security',
    language: 'rust',
    starterCode: `use solana_program::program_error::ProgramError;

/// Safely adds two u64 values, returning an error on overflow.
pub fn safe_add(a: u64, b: u64) -> Result<u64, ProgramError> {
    // TODO: Use checked_add to prevent overflow
    // TODO: Return ProgramError::ArithmeticOverflow on failure
    Ok(a + b) // UNSAFE: wraps on overflow
}

/// Safely multiplies two u64 values, returning an error on overflow.
pub fn safe_mul(a: u64, b: u64) -> Result<u64, ProgramError> {
    // TODO: Use checked_mul to prevent overflow
    // TODO: Return ProgramError::ArithmeticOverflow on failure
    Ok(a * b) // UNSAFE: wraps on overflow
}

/// Safely subtracts b from a, returning an error on underflow.
pub fn safe_sub(a: u64, b: u64) -> Result<u64, ProgramError> {
    // TODO: Use checked_sub to prevent underflow
    // TODO: Return ProgramError::ArithmeticOverflow on failure
    Ok(a - b) // UNSAFE: panics on underflow
}`,
    solution: `use solana_program::program_error::ProgramError;

pub fn safe_add(a: u64, b: u64) -> Result<u64, ProgramError> {
    a.checked_add(b)
        .ok_or(ProgramError::ArithmeticOverflow)
}

pub fn safe_mul(a: u64, b: u64) -> Result<u64, ProgramError> {
    a.checked_mul(b)
        .ok_or(ProgramError::ArithmeticOverflow)
}

pub fn safe_sub(a: u64, b: u64) -> Result<u64, ProgramError> {
    a.checked_sub(b)
        .ok_or(ProgramError::ArithmeticOverflow)
}`,
    testCases: [
      {
        input: 'safe_add(u64::MAX, 1)',
        expectedOutput: 'Err(ArithmeticOverflow)',
        description: 'Detects overflow when adding to u64::MAX',
      },
      {
        input: 'safe_sub(0, 1)',
        expectedOutput: 'Err(ArithmeticOverflow)',
        description: 'Detects underflow when subtracting from zero',
      },
      {
        input: 'safe_mul(u64::MAX, 2)',
        expectedOutput: 'Err(ArithmeticOverflow)',
        description: 'Detects overflow on large multiplication',
      },
    ],
    hints: [
      'Rust provides `checked_add`, `checked_sub`, and `checked_mul` on integer types that return `Option<T>`.',
      'Use `.ok_or(error)` to convert `None` into your desired error variant.',
      '`ProgramError::ArithmeticOverflow` is the standard error for math overflows in Solana programs.',
    ],
    xpReward: 50,
    estimatedMinutes: 10,
  },
  {
    id: 'sec-005',
    title: 'Reinitialization Guard',
    description:
      'Implement a guard that prevents an already-initialized account from being reinitialized. Without this check, an attacker can call the initialize instruction again to overwrite critical state such as the authority pubkey.',
    difficulty: 'intermediate',
    category: 'security',
    language: 'rust',
    starterCode: `use anchor_lang::prelude::*;

#[account]
pub struct VaultConfig {
    pub authority: Pubkey,
    pub total_deposits: u64,
    pub is_initialized: bool,
}

/// Initializes the vault config. Must prevent reinitialization.
pub fn initialize_vault(
    config: &mut VaultConfig,
    authority: Pubkey,
) -> Result<()> {
    // TODO: Check if config.is_initialized is already true
    // TODO: If so, return an error to prevent overwriting existing state
    // TODO: Set authority, total_deposits = 0, is_initialized = true
    config.authority = authority;
    config.total_deposits = 0;
    config.is_initialized = true;
    Ok(())
}`,
    solution: `use anchor_lang::prelude::*;

#[account]
pub struct VaultConfig {
    pub authority: Pubkey,
    pub total_deposits: u64,
    pub is_initialized: bool,
}

pub fn initialize_vault(
    config: &mut VaultConfig,
    authority: Pubkey,
) -> Result<()> {
    require!(!config.is_initialized, VaultError::AlreadyInitialized);
    config.authority = authority;
    config.total_deposits = 0;
    config.is_initialized = true;
    Ok(())
}

#[error_code]
pub enum VaultError {
    #[msg("Vault has already been initialized")]
    AlreadyInitialized,
}`,
    testCases: [
      {
        input: 'config.is_initialized = false, authority = new_authority',
        expectedOutput: 'Ok(()), config.authority = new_authority, config.is_initialized = true',
        description: 'Successfully initializes a fresh vault config',
      },
      {
        input: 'config.is_initialized = true, authority = attacker_authority',
        expectedOutput: 'Err(AlreadyInitialized)',
        description: 'Rejects reinitialization attempt by an attacker',
      },
      {
        input: 'config.is_initialized = true, authority = original_authority',
        expectedOutput: 'Err(AlreadyInitialized)',
        description: 'Rejects reinitialization even by the original authority',
      },
    ],
    hints: [
      'Check `config.is_initialized` at the top of the function before modifying any state.',
      'Use `require!(!config.is_initialized, ErrorVariant)` for a clean Anchor-style guard.',
      'In Anchor, the `init` constraint on account creation already prevents reinitialization for new accounts, but explicit guards protect against logic-level re-entry.',
    ],
    xpReward: 100,
    estimatedMinutes: 20,
  },
  {
    id: 'sec-006',
    title: 'Closing Account Drain Prevention',
    description:
      'Implement secure account closing logic that zeroes out account data and transfers all lamports to the recipient atomically. Improper closing allows attackers to exploit the account before it is garbage-collected by the runtime, or to intercept the lamport transfer.',
    difficulty: 'intermediate',
    category: 'security',
    language: 'rust',
    starterCode: `use anchor_lang::prelude::*;

#[account]
pub struct UserAccount {
    pub authority: Pubkey,
    pub balance: u64,
    pub bump: u8,
}

/// Securely closes a user account:
/// 1. Validate the signer is the authority
/// 2. Zero out account data to prevent resurrection attacks
/// 3. Transfer all lamports to the destination
pub fn close_user_account<'info>(
    user_account: &mut Account<'info, UserAccount>,
    authority: &Signer<'info>,
    destination: &mut AccountInfo<'info>,
) -> Result<()> {
    // TODO: Verify authority matches user_account.authority
    // TODO: Zero out the account data
    // TODO: Transfer all lamports from user_account to destination
    Ok(())
}`,
    solution: `use anchor_lang::prelude::*;

#[account]
pub struct UserAccount {
    pub authority: Pubkey,
    pub balance: u64,
    pub bump: u8,
}

pub fn close_user_account<'info>(
    user_account: &mut Account<'info, UserAccount>,
    authority: &Signer<'info>,
    destination: &mut AccountInfo<'info>,
) -> Result<()> {
    require_keys_eq!(
        user_account.authority,
        authority.key(),
        CloseError::UnauthorizedClose
    );

    let account_info = user_account.to_account_info();

    // Zero out data to prevent resurrection attacks
    let mut data = account_info.try_borrow_mut_data()?;
    for byte in data.iter_mut() {
        *byte = 0;
    }
    drop(data);

    // Transfer all lamports to destination
    let dest_starting_lamports = destination.lamports();
    **destination.lamports.borrow_mut() = dest_starting_lamports
        .checked_add(account_info.lamports())
        .ok_or(CloseError::ArithmeticOverflow)?;
    **account_info.lamports.borrow_mut() = 0;

    Ok(())
}

#[error_code]
pub enum CloseError {
    #[msg("Signer is not the account authority")]
    UnauthorizedClose,
    #[msg("Arithmetic overflow during lamport transfer")]
    ArithmeticOverflow,
}`,
    testCases: [
      {
        input: 'authority = user_account.authority, destination = valid_wallet',
        expectedOutput: 'Ok(()), account data zeroed, lamports transferred to destination',
        description: 'Successfully closes account and transfers lamports to destination',
      },
      {
        input: 'authority = attacker_key (not matching user_account.authority)',
        expectedOutput: 'Err(UnauthorizedClose)',
        description: 'Rejects close attempt from unauthorized signer',
      },
      {
        input: 'authority = user_account.authority, check data after close',
        expectedOutput: 'all data bytes = 0, account lamports = 0',
        description: 'Verifies account data is zeroed to prevent resurrection attacks',
      },
    ],
    hints: [
      'Always verify the signer matches the stored authority before closing.',
      'Zero out account data using `try_borrow_mut_data()` to prevent the account from being reused before garbage collection.',
      'Transfer lamports by directly modifying the lamport balances of both accounts — set the source to 0 and add the amount to the destination.',
    ],
    xpReward: 100,
    estimatedMinutes: 25,
  },
  {
    id: 'sec-007',
    title: 'Type Confusion Detection',
    description:
      'Write a validation function that checks an account discriminator to prevent type confusion attacks. In Anchor, every account type has an 8-byte discriminator prefix. If you skip this check when using raw AccountInfo, an attacker can pass a VaultAccount where a UserAccount is expected.',
    difficulty: 'intermediate',
    category: 'security',
    language: 'rust',
    starterCode: `use anchor_lang::prelude::*;
use std::io::Write;

const USER_DISCRIMINATOR: [u8; 8] = [0x15, 0xb4, 0xc2, 0xe6, 0x72, 0x3c, 0xa1, 0xdf];
const VAULT_DISCRIMINATOR: [u8; 8] = [0x8a, 0x21, 0xf3, 0xb7, 0x59, 0xe4, 0xc8, 0x12];

/// Validates that the account data starts with the expected discriminator.
/// Returns Ok(()) if the discriminator matches, or an error if it doesn't.
pub fn validate_account_type(
    account_data: &[u8],
    expected_discriminator: &[u8; 8],
) -> Result<()> {
    // TODO: Check that account_data is at least 8 bytes long
    // TODO: Compare the first 8 bytes against expected_discriminator
    // TODO: Return an error on mismatch
    Ok(())
}`,
    solution: `use anchor_lang::prelude::*;
use std::io::Write;

const USER_DISCRIMINATOR: [u8; 8] = [0x15, 0xb4, 0xc2, 0xe6, 0x72, 0x3c, 0xa1, 0xdf];
const VAULT_DISCRIMINATOR: [u8; 8] = [0x8a, 0x21, 0xf3, 0xb7, 0x59, 0xe4, 0xc8, 0x12];

pub fn validate_account_type(
    account_data: &[u8],
    expected_discriminator: &[u8; 8],
) -> Result<()> {
    require!(
        account_data.len() >= 8,
        TypeConfusionError::AccountDataTooSmall
    );
    require!(
        account_data[..8] == *expected_discriminator,
        TypeConfusionError::InvalidDiscriminator
    );
    Ok(())
}

#[error_code]
pub enum TypeConfusionError {
    #[msg("Account data is too small to contain a discriminator")]
    AccountDataTooSmall,
    #[msg("Account discriminator does not match expected type")]
    InvalidDiscriminator,
}`,
    testCases: [
      {
        input: 'account_data starts with USER_DISCRIMINATOR, expected = USER_DISCRIMINATOR',
        expectedOutput: 'Ok(())',
        description: 'Passes when discriminator matches the expected account type',
      },
      {
        input: 'account_data starts with VAULT_DISCRIMINATOR, expected = USER_DISCRIMINATOR',
        expectedOutput: 'Err(InvalidDiscriminator)',
        description: 'Rejects when a vault account is passed where a user account is expected',
      },
      {
        input: 'account_data has only 4 bytes',
        expectedOutput: 'Err(AccountDataTooSmall)',
        description: 'Rejects accounts with insufficient data for discriminator check',
      },
    ],
    hints: [
      'Anchor automatically prepends an 8-byte SHA256 discriminator to each account type — raw AccountInfo access skips this validation.',
      'Always check data length before slicing: `account_data.len() >= 8`.',
      'Compare the first 8 bytes using slice comparison: `account_data[..8] == *expected_discriminator`.',
    ],
    xpReward: 100,
    estimatedMinutes: 20,
  },
  {
    id: 'sec-008',
    title: 'CPI Privilege Escalation Check',
    description:
      'Implement a function that validates the target program of a CPI call before invoking it. Without this check, an attacker can substitute a malicious program ID in the CPI accounts, causing your program to invoke attacker-controlled code with elevated privileges.',
    difficulty: 'intermediate',
    category: 'security',
    language: 'rust',
    starterCode: `use solana_program::{
    account_info::AccountInfo,
    entrypoint::ProgramResult,
    instruction::{AccountMeta, Instruction},
    program::invoke,
    program_error::ProgramError,
    pubkey::Pubkey,
};

/// Validates the CPI target program and invokes the instruction.
/// Prevents privilege escalation by ensuring the target is the expected program.
pub fn safe_cpi_invoke<'info>(
    target_program: &AccountInfo<'info>,
    expected_program_id: &Pubkey,
    instruction: Instruction,
    account_infos: &[AccountInfo<'info>],
) -> ProgramResult {
    // TODO: Verify target_program.key matches expected_program_id
    // TODO: Verify target_program.executable is true
    // TODO: Invoke the instruction only after validation passes
    invoke(&instruction, account_infos)
}`,
    solution: `use solana_program::{
    account_info::AccountInfo,
    entrypoint::ProgramResult,
    instruction::{AccountMeta, Instruction},
    program::invoke,
    program_error::ProgramError,
    pubkey::Pubkey,
};

pub fn safe_cpi_invoke<'info>(
    target_program: &AccountInfo<'info>,
    expected_program_id: &Pubkey,
    instruction: Instruction,
    account_infos: &[AccountInfo<'info>],
) -> ProgramResult {
    if target_program.key != expected_program_id {
        return Err(ProgramError::IncorrectProgramId);
    }
    if !target_program.executable {
        return Err(ProgramError::InvalidAccountData);
    }
    invoke(&instruction, account_infos)
}`,
    testCases: [
      {
        input: 'target_program.key = token_program_id, expected = token_program_id, executable = true',
        expectedOutput: 'Ok(()) — CPI invoked successfully',
        description: 'Allows CPI when target program matches and is executable',
      },
      {
        input: 'target_program.key = attacker_program, expected = token_program_id',
        expectedOutput: 'Err(IncorrectProgramId)',
        description: 'Blocks CPI to substituted malicious program',
      },
      {
        input: 'target_program.key = token_program_id, executable = false',
        expectedOutput: 'Err(InvalidAccountData)',
        description: 'Blocks CPI to non-executable account even if key matches',
      },
    ],
    hints: [
      'Always validate `target_program.key` against a known constant before CPI — never trust the caller.',
      'Check `target_program.executable` — a non-executable account with the right key could be a data account at the same address.',
      'The runtime does its own checks, but explicit validation prevents wasted CU and provides clearer error messages.',
    ],
    xpReward: 100,
    estimatedMinutes: 25,
  },
  {
    id: 'sec-009',
    title: 'Duplicate Mutable Accounts',
    description:
      'Implement a check that detects when the same account is passed twice in mutable positions. If two mutable references alias the same account, the second write silently overwrites the first — enabling double-spend attacks on vaults.',
    difficulty: 'intermediate',
    category: 'security',
    language: 'rust',
    starterCode: `use anchor_lang::prelude::*;

#[account]
pub struct TokenVault {
    pub authority: Pubkey,
    pub balance: u64,
}

/// Transfers tokens between two vaults. Must prevent the same vault
/// from being passed as both source and destination.
pub fn transfer_between_vaults(
    source: &mut Account<TokenVault>,
    destination: &mut Account<TokenVault>,
    amount: u64,
) -> Result<()> {
    // TODO: Check that source and destination are different accounts
    // TODO: Verify source has sufficient balance
    // TODO: Perform the transfer using checked arithmetic
    source.balance -= amount;
    destination.balance += amount;
    Ok(())
}`,
    solution: `use anchor_lang::prelude::*;

#[account]
pub struct TokenVault {
    pub authority: Pubkey,
    pub balance: u64,
}

pub fn transfer_between_vaults(
    source: &mut Account<TokenVault>,
    destination: &mut Account<TokenVault>,
    amount: u64,
) -> Result<()> {
    require_keys_neq!(
        source.key(),
        destination.key(),
        DuplicateError::DuplicateAccounts
    );
    require!(
        source.balance >= amount,
        DuplicateError::InsufficientBalance
    );
    source.balance = source.balance
        .checked_sub(amount)
        .ok_or(DuplicateError::ArithmeticError)?;
    destination.balance = destination.balance
        .checked_add(amount)
        .ok_or(DuplicateError::ArithmeticError)?;
    Ok(())
}

#[error_code]
pub enum DuplicateError {
    #[msg("Source and destination accounts must be different")]
    DuplicateAccounts,
    #[msg("Insufficient balance in source vault")]
    InsufficientBalance,
    #[msg("Arithmetic error during transfer")]
    ArithmeticError,
}`,
    testCases: [
      {
        input: 'source = vault_A (balance: 1000), destination = vault_B (balance: 500), amount = 200',
        expectedOutput: 'Ok(()), source.balance = 800, destination.balance = 700',
        description: 'Successful transfer between two distinct vaults',
      },
      {
        input: 'source = vault_A, destination = vault_A (same key), amount = 100',
        expectedOutput: 'Err(DuplicateAccounts)',
        description: 'Rejects transfer when source and destination are the same account',
      },
      {
        input: 'source = vault_A (balance: 50), destination = vault_B, amount = 100',
        expectedOutput: 'Err(InsufficientBalance)',
        description: 'Rejects transfer when source has insufficient balance',
      },
    ],
    hints: [
      'Use `require_keys_neq!` to compare account keys — this is the idiomatic Anchor way.',
      'Always check for duplicate accounts before any state mutation.',
      'Without this check, passing the same account as both source and destination can create tokens from nothing due to aliased mutable references.',
    ],
    xpReward: 100,
    estimatedMinutes: 20,
  },
  {
    id: 'sec-010',
    title: 'Bump Seed Canonicalization',
    description:
      'Implement PDA creation and validation that stores and reuses the canonical bump seed. Recalculating bumps on every call wastes CU, and using a non-canonical bump can create a different PDA than expected — breaking account lookups and enabling subtle substitution attacks.',
    difficulty: 'intermediate',
    category: 'security',
    language: 'rust',
    starterCode: `use anchor_lang::prelude::*;

#[account]
pub struct VaultState {
    pub authority: Pubkey,
    pub bump: u8,
}

/// Creates a new vault PDA with canonical bump storage.
/// The bump must be stored at creation and reused in all subsequent validations.
pub fn create_vault(
    vault: &mut Account<VaultState>,
    authority: Pubkey,
    bump: u8,
) -> Result<()> {
    // TODO: Store the authority and canonical bump
    Ok(())
}

/// Validates the vault PDA using the stored bump instead of recalculating.
pub fn validate_vault_pda(
    vault: &Account<VaultState>,
    authority: &Pubkey,
    program_id: &Pubkey,
) -> Result<()> {
    // TODO: Reconstruct the PDA using create_program_address with the stored bump
    // TODO: Compare against vault.key()
    // TODO: Return InvalidSeeds if mismatch
    Ok(())
}`,
    solution: `use anchor_lang::prelude::*;

#[account]
pub struct VaultState {
    pub authority: Pubkey,
    pub bump: u8,
}

pub fn create_vault(
    vault: &mut Account<VaultState>,
    authority: Pubkey,
    bump: u8,
) -> Result<()> {
    vault.authority = authority;
    vault.bump = bump;
    Ok(())
}

pub fn validate_vault_pda(
    vault: &Account<VaultState>,
    authority: &Pubkey,
    program_id: &Pubkey,
) -> Result<()> {
    let seeds = &[
        b"vault".as_ref(),
        authority.as_ref(),
        &[vault.bump],
    ];
    let expected_key = Pubkey::create_program_address(seeds, program_id)
        .map_err(|_| error!(BumpError::InvalidBump))?;
    require_keys_eq!(
        vault.key(),
        expected_key,
        BumpError::InvalidPda
    );
    Ok(())
}

#[error_code]
pub enum BumpError {
    #[msg("Stored bump seed does not produce a valid PDA")]
    InvalidBump,
    #[msg("Vault PDA does not match expected address")]
    InvalidPda,
}`,
    testCases: [
      {
        input: 'vault created with canonical bump from find_program_address',
        expectedOutput: 'Ok(()) — validate_vault_pda succeeds',
        description: 'Validates a PDA using the correctly stored canonical bump',
      },
      {
        input: 'vault.bump manually set to non-canonical value (e.g., canonical - 1)',
        expectedOutput: 'Err(InvalidPda) or Err(InvalidBump)',
        description: 'Rejects PDA validation when a non-canonical bump produces a different address',
      },
      {
        input: 'vault.key() does not match reconstructed PDA (authority swapped)',
        expectedOutput: 'Err(InvalidPda)',
        description: 'Rejects when stored authority does not match the one used for derivation',
      },
    ],
    hints: [
      '`find_program_address` returns the canonical (highest valid) bump — store this at account creation.',
      'Use `create_program_address` with the stored bump for O(1) validation instead of re-running the search loop.',
      'Non-canonical bumps may still produce valid PDAs at different addresses — always verify the result matches the expected key.',
    ],
    xpReward: 100,
    estimatedMinutes: 25,
  },
  {
    id: 'sec-011',
    title: 'Authority Validation Pattern',
    description:
      'Implement a multi-level authority validation system that supports both a primary authority and an optional delegate, with different permission levels. This pattern is common in DeFi protocols where operations need tiered access control.',
    difficulty: 'intermediate',
    category: 'security',
    language: 'typescript',
    starterCode: `import { PublicKey, TransactionInstruction } from '@solana/web3.js';

interface ProtocolConfig {
  authority: PublicKey;
  delegate: PublicKey | null;
  isPaused: boolean;
}

type PermissionLevel = 'admin' | 'operator' | 'readonly';

/**
 * Determines the permission level of a signer relative to the protocol config.
 * - authority => 'admin'
 * - delegate => 'operator'
 * - anyone else => 'readonly'
 */
function getPermissionLevel(
  signer: PublicKey,
  config: ProtocolConfig,
): PermissionLevel {
  // TODO: Check if signer matches authority (admin)
  // TODO: Check if signer matches delegate (operator)
  // TODO: Return 'readonly' for unrecognized signers
  return 'readonly';
}

/**
 * Validates that the signer has the required permission level.
 * Admin satisfies all levels. Operator satisfies operator and readonly.
 * Throws if the protocol is paused (only admin can act when paused).
 */
function validateAuthority(
  signer: PublicKey,
  config: ProtocolConfig,
  requiredLevel: PermissionLevel,
): void {
  // TODO: Check if paused — only admin can operate when paused
  // TODO: Get signer's permission level
  // TODO: Validate it meets or exceeds the required level
  // TODO: Throw descriptive errors on failure
}

export { getPermissionLevel, validateAuthority, PermissionLevel, ProtocolConfig };`,
    solution: `import { PublicKey, TransactionInstruction } from '@solana/web3.js';

interface ProtocolConfig {
  authority: PublicKey;
  delegate: PublicKey | null;
  isPaused: boolean;
}

type PermissionLevel = 'admin' | 'operator' | 'readonly';

const PERMISSION_RANK: Record<PermissionLevel, number> = {
  readonly: 0,
  operator: 1,
  admin: 2,
};

function getPermissionLevel(
  signer: PublicKey,
  config: ProtocolConfig,
): PermissionLevel {
  if (signer.equals(config.authority)) {
    return 'admin';
  }
  if (config.delegate && signer.equals(config.delegate)) {
    return 'operator';
  }
  return 'readonly';
}

function validateAuthority(
  signer: PublicKey,
  config: ProtocolConfig,
  requiredLevel: PermissionLevel,
): void {
  const signerLevel = getPermissionLevel(signer, config);

  if (config.isPaused && signerLevel !== 'admin') {
    throw new Error('Protocol is paused: only admin can perform operations');
  }

  if (PERMISSION_RANK[signerLevel] < PERMISSION_RANK[requiredLevel]) {
    throw new Error(
      \`Insufficient permissions: required \${requiredLevel}, got \${signerLevel}\`,
    );
  }
}

export { getPermissionLevel, validateAuthority, PermissionLevel, ProtocolConfig };`,
    testCases: [
      {
        input: 'signer = authority, requiredLevel = "admin", isPaused = false',
        expectedOutput: 'no error — admin has full access',
        description: 'Admin signer passes admin-level validation',
      },
      {
        input: 'signer = delegate, requiredLevel = "admin", isPaused = false',
        expectedOutput: 'throws "Insufficient permissions: required admin, got operator"',
        description: 'Operator signer fails admin-level validation',
      },
      {
        input: 'signer = delegate, requiredLevel = "operator", isPaused = true',
        expectedOutput: 'throws "Protocol is paused: only admin can perform operations"',
        description: 'Non-admin signer is blocked when protocol is paused',
      },
    ],
    hints: [
      'Use a numeric rank map (readonly=0, operator=1, admin=2) to simplify permission level comparisons.',
      'Check the paused state first — when paused, only admin should proceed regardless of required level.',
      'Use `PublicKey.equals()` for key comparison — never compare with `===` or `toString()`.',
    ],
    xpReward: 100,
    estimatedMinutes: 25,
  },
  {
    id: 'sec-012',
    title: 'Rent Exemption Verification',
    description:
      'Implement a function that verifies an account holds enough lamports to be rent-exempt. Accounts below the rent-exempt threshold are gradually drained by the runtime and eventually garbage-collected, causing unexpected data loss mid-protocol.',
    difficulty: 'intermediate',
    category: 'security',
    language: 'typescript',
    starterCode: `import { Connection, PublicKey, AccountInfo } from '@solana/web3.js';

interface RentCheckResult {
  isExempt: boolean;
  currentLamports: number;
  requiredLamports: number;
  deficit: number;
}

/**
 * Checks whether an account is rent-exempt given its data size.
 * Returns a detailed result including the deficit if not exempt.
 */
async function checkRentExemption(
  connection: Connection,
  accountPubkey: PublicKey,
): Promise<RentCheckResult> {
  // TODO: Fetch the account info
  // TODO: Get the minimum balance for rent exemption based on data length
  // TODO: Compare current lamports against the minimum
  // TODO: Return detailed result with isExempt, currentLamports, requiredLamports, deficit
  return {
    isExempt: false,
    currentLamports: 0,
    requiredLamports: 0,
    deficit: 0,
  };
}

/**
 * Validates that an account is rent-exempt, throwing if not.
 */
async function requireRentExempt(
  connection: Connection,
  accountPubkey: PublicKey,
): Promise<void> {
  // TODO: Use checkRentExemption and throw if not exempt
}

export { checkRentExemption, requireRentExempt, RentCheckResult };`,
    solution: `import { Connection, PublicKey, AccountInfo } from '@solana/web3.js';

interface RentCheckResult {
  isExempt: boolean;
  currentLamports: number;
  requiredLamports: number;
  deficit: number;
}

async function checkRentExemption(
  connection: Connection,
  accountPubkey: PublicKey,
): Promise<RentCheckResult> {
  const accountInfo = await connection.getAccountInfo(accountPubkey);
  if (!accountInfo) {
    throw new Error(\`Account \${accountPubkey.toBase58()} not found\`);
  }

  const requiredLamports = await connection.getMinimumBalanceForRentExemption(
    accountInfo.data.length,
  );
  const currentLamports = accountInfo.lamports;
  const isExempt = currentLamports >= requiredLamports;
  const deficit = isExempt ? 0 : requiredLamports - currentLamports;

  return { isExempt, currentLamports, requiredLamports, deficit };
}

async function requireRentExempt(
  connection: Connection,
  accountPubkey: PublicKey,
): Promise<void> {
  const result = await checkRentExemption(connection, accountPubkey);
  if (!result.isExempt) {
    throw new Error(
      \`Account \${accountPubkey.toBase58()} is not rent-exempt: needs \${result.deficit} more lamports (\${result.currentLamports}/\${result.requiredLamports})\`,
    );
  }
}

export { checkRentExemption, requireRentExempt, RentCheckResult };`,
    testCases: [
      {
        input: 'account with 2_000_000 lamports, data size 165 bytes (rent min ~1_461_600)',
        expectedOutput: '{ isExempt: true, currentLamports: 2000000, requiredLamports: 1461600, deficit: 0 }',
        description: 'Account with sufficient lamports is marked rent-exempt',
      },
      {
        input: 'account with 500_000 lamports, data size 165 bytes',
        expectedOutput: '{ isExempt: false, deficit: 961600 }',
        description: 'Account below threshold shows correct deficit',
      },
      {
        input: 'non-existent account (getAccountInfo returns null)',
        expectedOutput: 'throws "Account <pubkey> not found"',
        description: 'Throws descriptive error for accounts that do not exist',
      },
    ],
    hints: [
      'Use `connection.getAccountInfo()` to fetch account data and lamports.',
      '`connection.getMinimumBalanceForRentExemption(dataLength)` returns the threshold for a given data size.',
      'Calculate deficit as `requiredLamports - currentLamports` only when not exempt — return 0 if already exempt.',
    ],
    xpReward: 100,
    estimatedMinutes: 20,
  },
  {
    id: 'sec-013',
    title: 'Instruction Introspection',
    description:
      'Implement instruction introspection to verify that a specific instruction exists in the current transaction. This technique is used to enforce that certain safety instructions (e.g., a price oracle refresh) are called in the same transaction, preventing stale data exploits.',
    difficulty: 'advanced',
    category: 'security',
    language: 'rust',
    starterCode: `use solana_program::{
    account_info::AccountInfo,
    instruction::Instruction,
    program_error::ProgramError,
    pubkey::Pubkey,
    sysvar::{instructions, Sysvar},
};

/// Verifies that a specific program instruction exists in the current transaction.
/// Uses the Instructions sysvar to introspect the full transaction.
///
/// # Arguments
/// * \`instructions_sysvar\` - The Instructions sysvar account
/// * \`expected_program_id\` - The program that must have an instruction in the tx
/// * \`expected_discriminator\` - The first 8 bytes of the expected instruction data
///
/// Returns Ok(index) with the instruction index if found, or an error.
pub fn require_instruction_in_transaction(
    instructions_sysvar: &AccountInfo,
    expected_program_id: &Pubkey,
    expected_discriminator: &[u8; 8],
) -> Result<usize, ProgramError> {
    // TODO: Verify instructions_sysvar is the correct sysvar account
    // TODO: Load the number of instructions in the transaction
    // TODO: Iterate through each instruction
    // TODO: Check if any instruction matches the expected program_id and discriminator
    // TODO: Return the index if found, or an error if not
    Err(ProgramError::InvalidInstructionData)
}`,
    solution: `use solana_program::{
    account_info::AccountInfo,
    instruction::Instruction,
    program_error::ProgramError,
    pubkey::Pubkey,
    sysvar::{instructions, Sysvar},
};

pub fn require_instruction_in_transaction(
    instructions_sysvar: &AccountInfo,
    expected_program_id: &Pubkey,
    expected_discriminator: &[u8; 8],
) -> Result<usize, ProgramError> {
    if *instructions_sysvar.key != instructions::ID {
        return Err(ProgramError::InvalidAccountData);
    }

    let data = instructions_sysvar.try_borrow_data()?;
    let num_instructions = instructions::load_current_index_checked(instructions_sysvar)?;

    for i in 0..num_instructions {
        let ix = instructions::load_instruction_at_checked(i as usize, instructions_sysvar)?;
        if ix.program_id == *expected_program_id
            && ix.data.len() >= 8
            && ix.data[..8] == *expected_discriminator
        {
            return Ok(i as usize);
        }
    }

    Err(ProgramError::InvalidInstructionData)
}`,
    testCases: [
      {
        input: 'transaction contains oracle refresh (matching program_id + discriminator) at index 0',
        expectedOutput: 'Ok(0)',
        description: 'Finds the required instruction and returns its index',
      },
      {
        input: 'transaction contains no instructions matching the expected program_id',
        expectedOutput: 'Err(InvalidInstructionData)',
        description: 'Returns error when the required instruction is missing from the transaction',
      },
      {
        input: 'instructions_sysvar.key is not the Instructions sysvar ID',
        expectedOutput: 'Err(InvalidAccountData)',
        description: 'Rejects a spoofed Instructions sysvar account',
      },
    ],
    hints: [
      'The Instructions sysvar (address `Sysvar1nstructions1111111111111111111111111`) stores all instructions in the current transaction.',
      'Use `instructions::load_current_index_checked` to get the count and `load_instruction_at_checked` to read each instruction.',
      'Always verify the sysvar account key matches `instructions::ID` to prevent spoofing.',
    ],
    xpReward: 200,
    estimatedMinutes: 35,
  },
  {
    id: 'sec-014',
    title: 'Cross-Program Signer Verification',
    description:
      'Implement verification logic for cross-program invocations that ensures a PDA signer from the calling program is legitimate. When program A invokes program B via CPI with PDA signer seeds, program B must verify that the signer PDA is actually owned by program A and derived from expected seeds.',
    difficulty: 'advanced',
    category: 'security',
    language: 'rust',
    starterCode: `use solana_program::{
    account_info::AccountInfo,
    entrypoint::ProgramResult,
    program::invoke_signed,
    program_error::ProgramError,
    pubkey::Pubkey,
    instruction::Instruction,
};

/// Verifies a CPI signer PDA belongs to the expected calling program,
/// then invokes the target instruction with signer seeds.
///
/// # Arguments
/// * \`calling_program_id\` - The program that should own the PDA signer
/// * \`pda_signer\` - The PDA account that will sign the CPI
/// * \`expected_seeds_without_bump\` - The seeds (minus bump) used to derive the PDA
/// * \`instruction\` - The CPI instruction to invoke
/// * \`account_infos\` - All accounts for the CPI
pub fn verified_cpi_with_pda_signer<'info>(
    calling_program_id: &Pubkey,
    pda_signer: &AccountInfo<'info>,
    expected_seeds_without_bump: &[&[u8]],
    instruction: Instruction,
    account_infos: &[AccountInfo<'info>],
) -> ProgramResult {
    // TODO: Derive the PDA from expected seeds to get the canonical bump
    // TODO: Verify the derived PDA matches pda_signer.key
    // TODO: Build the full signer seeds (including bump)
    // TODO: Invoke the instruction with signer seeds
    invoke_signed(&instruction, account_infos, &[])
}`,
    solution: `use solana_program::{
    account_info::AccountInfo,
    entrypoint::ProgramResult,
    program::invoke_signed,
    program_error::ProgramError,
    pubkey::Pubkey,
    instruction::Instruction,
};

pub fn verified_cpi_with_pda_signer<'info>(
    calling_program_id: &Pubkey,
    pda_signer: &AccountInfo<'info>,
    expected_seeds_without_bump: &[&[u8]],
    instruction: Instruction,
    account_infos: &[AccountInfo<'info>],
) -> ProgramResult {
    let (expected_pda, bump) =
        Pubkey::find_program_address(expected_seeds_without_bump, calling_program_id);

    if *pda_signer.key != expected_pda {
        return Err(ProgramError::InvalidSeeds);
    }

    let bump_slice = &[bump];
    let mut signer_seeds: Vec<&[u8]> = expected_seeds_without_bump.to_vec();
    signer_seeds.push(bump_slice);

    invoke_signed(&instruction, account_infos, &[&signer_seeds])
}`,
    testCases: [
      {
        input: 'pda_signer derived from ["vault", user_key] via calling_program_id',
        expectedOutput: 'Ok(()) — CPI invoked with correct signer seeds',
        description: 'Successfully invokes CPI when PDA signer matches expected derivation',
      },
      {
        input: 'pda_signer key does not match derivation from expected seeds',
        expectedOutput: 'Err(InvalidSeeds)',
        description: 'Rejects CPI when PDA signer is from a different derivation',
      },
      {
        input: 'pda_signer derived from different program_id (attacker program)',
        expectedOutput: 'Err(InvalidSeeds)',
        description: 'Rejects PDA signer derived from a malicious program',
      },
    ],
    hints: [
      'Use `Pubkey::find_program_address` with the calling program ID to derive the expected PDA and canonical bump.',
      'Build the full signer seeds by appending the bump byte to the original seeds slice.',
      'Pass the signer seeds to `invoke_signed` as a slice of slices: `&[&signer_seeds]`.',
    ],
    xpReward: 200,
    estimatedMinutes: 35,
  },
  {
    id: 'sec-015',
    title: 'Account Data Matching',
    description:
      'Implement validation that cross-references data between multiple accounts to detect inconsistencies. For example, verifying that a token account belongs to the expected mint and owner — preventing an attacker from substituting a token account they control.',
    difficulty: 'advanced',
    category: 'security',
    language: 'typescript',
    starterCode: `import { PublicKey, AccountInfo } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, AccountLayout } from '@solana/spl-token';

interface TokenAccountData {
  mint: PublicKey;
  owner: PublicKey;
  amount: bigint;
}

/**
 * Decodes and validates a token account against expected constraints.
 * Checks: correct program owner, correct mint, correct owner, non-zero balance.
 */
function validateTokenAccount(
  accountKey: PublicKey,
  accountInfo: AccountInfo<Buffer>,
  expectedMint: PublicKey,
  expectedOwner: PublicKey,
  requireNonZeroBalance: boolean,
): TokenAccountData {
  // TODO: Verify the account is owned by TOKEN_PROGRAM_ID
  // TODO: Verify data length matches TokenAccount layout (165 bytes)
  // TODO: Decode the account data
  // TODO: Verify mint matches expectedMint
  // TODO: Verify owner matches expectedOwner
  // TODO: If requireNonZeroBalance, verify amount > 0
  // TODO: Return the decoded data
  throw new Error('Not implemented');
}

export { validateTokenAccount, TokenAccountData };`,
    solution: `import { PublicKey, AccountInfo } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, AccountLayout } from '@solana/spl-token';

interface TokenAccountData {
  mint: PublicKey;
  owner: PublicKey;
  amount: bigint;
}

function validateTokenAccount(
  accountKey: PublicKey,
  accountInfo: AccountInfo<Buffer>,
  expectedMint: PublicKey,
  expectedOwner: PublicKey,
  requireNonZeroBalance: boolean,
): TokenAccountData {
  if (!accountInfo.owner.equals(TOKEN_PROGRAM_ID)) {
    throw new Error(
      \`Account \${accountKey.toBase58()} is not owned by the Token Program\`,
    );
  }

  if (accountInfo.data.length !== AccountLayout.span) {
    throw new Error(
      \`Account \${accountKey.toBase58()} data length \${accountInfo.data.length} does not match expected \${AccountLayout.span}\`,
    );
  }

  const decoded = AccountLayout.decode(accountInfo.data);
  const mint = new PublicKey(decoded.mint);
  const owner = new PublicKey(decoded.owner);
  const amount = decoded.amount;

  if (!mint.equals(expectedMint)) {
    throw new Error(
      \`Token account mint \${mint.toBase58()} does not match expected \${expectedMint.toBase58()}\`,
    );
  }

  if (!owner.equals(expectedOwner)) {
    throw new Error(
      \`Token account owner \${owner.toBase58()} does not match expected \${expectedOwner.toBase58()}\`,
    );
  }

  if (requireNonZeroBalance && amount === BigInt(0)) {
    throw new Error(
      \`Token account \${accountKey.toBase58()} has zero balance\`,
    );
  }

  return { mint, owner, amount };
}

export { validateTokenAccount, TokenAccountData };`,
    testCases: [
      {
        input: 'valid token account: owner=TOKEN_PROGRAM, mint=expected, owner=expected, amount=1000',
        expectedOutput: '{ mint: expectedMint, owner: expectedOwner, amount: 1000n }',
        description: 'Returns decoded data when all validations pass',
      },
      {
        input: 'token account with wrong mint (attacker substituted their token account)',
        expectedOutput: 'throws "Token account mint ... does not match expected ..."',
        description: 'Rejects token account with a different mint than expected',
      },
      {
        input: 'account owned by System Program instead of Token Program',
        expectedOutput: 'throws "Account ... is not owned by the Token Program"',
        description: 'Rejects accounts not owned by the Token Program',
      },
    ],
    hints: [
      'Always check `accountInfo.owner` (the program that owns the account) — this is separate from the token account owner field in the data.',
      'Use `AccountLayout.decode()` from @solana/spl-token to deserialize the raw buffer.',
      'Use `PublicKey.equals()` for all key comparisons — JavaScript `===` compares references, not values.',
    ],
    xpReward: 200,
    estimatedMinutes: 30,
  },
  {
    id: 'sec-016',
    title: 'Deserialization Attack Prevention',
    description:
      'Implement safe deserialization that validates data integrity before processing. Malformed or truncated data passed to unchecked deserialization can cause panics, read out-of-bounds memory, or produce silently incorrect values that corrupt protocol state.',
    difficulty: 'advanced',
    category: 'security',
    language: 'rust',
    starterCode: `use anchor_lang::prelude::*;
use std::convert::TryFrom;

const EXPECTED_DATA_LEN: usize = 73; // 8 discriminator + 32 authority + 8 balance + 8 timestamp + 16 name + 1 bump

#[derive(Clone)]
pub struct VaultData {
    pub authority: Pubkey,
    pub balance: u64,
    pub last_updated: i64,
    pub name: [u8; 16],
    pub bump: u8,
}

/// Safely deserializes vault data from a raw byte slice.
/// Validates: discriminator, data length, authority is not default, name is valid UTF-8.
pub fn safe_deserialize_vault(
    data: &[u8],
    expected_discriminator: &[u8; 8],
) -> Result<VaultData> {
    // TODO: Validate minimum data length
    // TODO: Validate discriminator (first 8 bytes)
    // TODO: Deserialize each field from the correct byte offsets
    // TODO: Validate authority is not Pubkey::default()
    // TODO: Validate name contains valid UTF-8 (trimming null bytes)
    // TODO: Return the validated VaultData
    Err(error!(DeserializeError::InvalidData))
}`,
    solution: `use anchor_lang::prelude::*;
use std::convert::TryFrom;

const EXPECTED_DATA_LEN: usize = 73;

#[derive(Clone)]
pub struct VaultData {
    pub authority: Pubkey,
    pub balance: u64,
    pub last_updated: i64,
    pub name: [u8; 16],
    pub bump: u8,
}

pub fn safe_deserialize_vault(
    data: &[u8],
    expected_discriminator: &[u8; 8],
) -> Result<VaultData> {
    require!(
        data.len() >= EXPECTED_DATA_LEN,
        DeserializeError::DataTooShort
    );

    require!(
        data[..8] == *expected_discriminator,
        DeserializeError::InvalidDiscriminator
    );

    let authority = Pubkey::try_from(&data[8..40])
        .map_err(|_| error!(DeserializeError::InvalidData))?;

    require!(
        authority != Pubkey::default(),
        DeserializeError::DefaultAuthority
    );

    let balance = u64::from_le_bytes(
        <[u8; 8]>::try_from(&data[40..48])
            .map_err(|_| error!(DeserializeError::InvalidData))?,
    );

    let last_updated = i64::from_le_bytes(
        <[u8; 8]>::try_from(&data[48..56])
            .map_err(|_| error!(DeserializeError::InvalidData))?,
    );

    let mut name = [0u8; 16];
    name.copy_from_slice(&data[56..72]);

    let name_trimmed: Vec<u8> = name.iter().copied().take_while(|&b| b != 0).collect();
    require!(
        std::str::from_utf8(&name_trimmed).is_ok(),
        DeserializeError::InvalidName
    );

    let bump = data[72];

    Ok(VaultData {
        authority,
        balance,
        last_updated,
        name,
        bump,
    })
}

#[error_code]
pub enum DeserializeError {
    #[msg("Account data is too short for deserialization")]
    DataTooShort,
    #[msg("Account discriminator does not match")]
    InvalidDiscriminator,
    #[msg("Authority cannot be the default public key")]
    DefaultAuthority,
    #[msg("Name field contains invalid UTF-8")]
    InvalidName,
    #[msg("Failed to deserialize account data")]
    InvalidData,
}`,
    testCases: [
      {
        input: 'valid 73-byte data with correct discriminator, valid authority, valid UTF-8 name',
        expectedOutput: 'Ok(VaultData { authority, balance, last_updated, name, bump })',
        description: 'Successfully deserializes well-formed vault data',
      },
      {
        input: '50-byte truncated data (less than EXPECTED_DATA_LEN)',
        expectedOutput: 'Err(DataTooShort)',
        description: 'Rejects truncated data that would cause out-of-bounds reads',
      },
      {
        input: '73-byte data with authority = Pubkey::default() (all zeros)',
        expectedOutput: 'Err(DefaultAuthority)',
        description: 'Rejects data with an uninitialized (default) authority key',
      },
    ],
    hints: [
      'Always validate data length before any slice indexing to prevent panics.',
      'Deserialize integers with `from_le_bytes` — Solana uses little-endian byte order.',
      'Check for `Pubkey::default()` (all zeros) to catch uninitialized or zeroed-out authority fields.',
    ],
    xpReward: 200,
    estimatedMinutes: 35,
  },
  {
    id: 'sec-017',
    title: 'Time-Based Attack Vector Check',
    description:
      'Implement a time-lock mechanism with validation against clock manipulation attacks. Validators control the Clock sysvar, so on-chain timestamps can drift. Your implementation must account for reasonable clock skew while still enforcing time-based constraints like cooldowns and vesting schedules.',
    difficulty: 'advanced',
    category: 'security',
    language: 'rust',
    starterCode: `use anchor_lang::prelude::*;

const MAX_CLOCK_DRIFT_SECONDS: i64 = 30;
const MIN_COOLDOWN_SECONDS: i64 = 3600; // 1 hour

#[account]
pub struct TimeLock {
    pub authority: Pubkey,
    pub last_action: i64,
    pub cooldown_seconds: i64,
    pub unlock_timestamp: i64,
    pub bump: u8,
}

/// Validates that the current clock time is reasonable (not too far in the future)
/// and that the cooldown period has elapsed since the last action.
pub fn validate_timelock(
    timelock: &TimeLock,
    current_timestamp: i64,
) -> Result<()> {
    // TODO: Validate current_timestamp is not unreasonably far in the future
    //       (compare against last_action + reasonable drift)
    // TODO: Validate the cooldown period has elapsed
    // TODO: Validate the unlock_timestamp has been reached
    // TODO: Validate cooldown_seconds meets the minimum
    Ok(())
}

/// Updates the last_action timestamp after a successful action.
pub fn record_action(
    timelock: &mut TimeLock,
    current_timestamp: i64,
) -> Result<()> {
    // TODO: Validate timelock first
    // TODO: Update last_action to current_timestamp
    Ok(())
}`,
    solution: `use anchor_lang::prelude::*;

const MAX_CLOCK_DRIFT_SECONDS: i64 = 30;
const MIN_COOLDOWN_SECONDS: i64 = 3600;

#[account]
pub struct TimeLock {
    pub authority: Pubkey,
    pub last_action: i64,
    pub cooldown_seconds: i64,
    pub unlock_timestamp: i64,
    pub bump: u8,
}

pub fn validate_timelock(
    timelock: &TimeLock,
    current_timestamp: i64,
) -> Result<()> {
    require!(
        current_timestamp > 0,
        TimeLockError::InvalidTimestamp
    );

    if timelock.last_action > 0 {
        let max_expected = timelock
            .last_action
            .checked_add(timelock.cooldown_seconds)
            .ok_or(error!(TimeLockError::ArithmeticOverflow))?
            .checked_add(MAX_CLOCK_DRIFT_SECONDS)
            .ok_or(error!(TimeLockError::ArithmeticOverflow))?;

        require!(
            current_timestamp <= max_expected,
            TimeLockError::ClockDriftTooLarge
        );
    }

    require!(
        timelock.cooldown_seconds >= MIN_COOLDOWN_SECONDS,
        TimeLockError::CooldownTooShort
    );

    if timelock.last_action > 0 {
        let earliest_next_action = timelock
            .last_action
            .checked_add(timelock.cooldown_seconds)
            .ok_or(error!(TimeLockError::ArithmeticOverflow))?;
        require!(
            current_timestamp >= earliest_next_action,
            TimeLockError::CooldownNotElapsed
        );
    }

    require!(
        current_timestamp >= timelock.unlock_timestamp,
        TimeLockError::TimeLockActive
    );

    Ok(())
}

pub fn record_action(
    timelock: &mut TimeLock,
    current_timestamp: i64,
) -> Result<()> {
    validate_timelock(timelock, current_timestamp)?;
    timelock.last_action = current_timestamp;
    Ok(())
}

#[error_code]
pub enum TimeLockError {
    #[msg("Timestamp must be positive")]
    InvalidTimestamp,
    #[msg("Clock drift exceeds maximum allowed")]
    ClockDriftTooLarge,
    #[msg("Cooldown period has not elapsed since last action")]
    CooldownNotElapsed,
    #[msg("Time lock has not been unlocked yet")]
    TimeLockActive,
    #[msg("Cooldown duration is below the minimum threshold")]
    CooldownTooShort,
    #[msg("Arithmetic overflow in timestamp calculation")]
    ArithmeticOverflow,
}`,
    testCases: [
      {
        input: 'last_action = 1000, cooldown = 3600, current = 5000, unlock = 0',
        expectedOutput: 'Ok(()) — cooldown elapsed, no time lock',
        description: 'Passes when cooldown has elapsed and no active time lock',
      },
      {
        input: 'last_action = 1000, cooldown = 3600, current = 2000',
        expectedOutput: 'Err(CooldownNotElapsed)',
        description: 'Rejects action during active cooldown period',
      },
      {
        input: 'last_action = 1000, cooldown = 3600, current = 1000 + 3600 + 3600 + 31',
        expectedOutput: 'Err(ClockDriftTooLarge)',
        description: 'Rejects suspiciously large timestamp that exceeds drift tolerance',
      },
    ],
    hints: [
      'Solana Clock sysvar timestamps come from validator consensus — they can drift by a few seconds from real-world time.',
      'Use `checked_add` for all timestamp arithmetic to prevent overflow on i64.',
      'Define a `MAX_CLOCK_DRIFT_SECONDS` constant to bound how far into the future a timestamp can be relative to the expected window.',
    ],
    xpReward: 200,
    estimatedMinutes: 40,
  },
  {
    id: 'sec-018',
    title: 'Front-Running Prevention',
    description:
      'Implement a commit-reveal scheme to prevent front-running on Solana. In a commit phase, users submit a hash of their action. In the reveal phase, they provide the preimage. This prevents validators or MEV bots from seeing the action and inserting their own transaction first.',
    difficulty: 'advanced',
    category: 'security',
    language: 'typescript',
    starterCode: `import { PublicKey } from '@solana/web3.js';
import { createHash } from 'crypto';

interface Commitment {
  commitHash: string;
  commitSlot: number;
  revealed: boolean;
}

const MIN_REVEAL_DELAY_SLOTS = 10;
const MAX_REVEAL_DELAY_SLOTS = 100;

/**
 * Creates a commitment hash from an action, amount, and random nonce.
 * The nonce prevents brute-force preimage attacks on small action spaces.
 */
function createCommitment(
  userPubkey: PublicKey,
  action: string,
  amount: number,
  nonce: string,
): string {
  // TODO: Concatenate userPubkey + action + amount + nonce
  // TODO: Hash with SHA-256
  // TODO: Return the hex digest
  return '';
}

/**
 * Verifies a reveal against a stored commitment.
 * Checks: hash matches, timing window is valid, not already revealed.
 */
function verifyReveal(
  commitment: Commitment,
  userPubkey: PublicKey,
  action: string,
  amount: number,
  nonce: string,
  currentSlot: number,
): { valid: boolean; error?: string } {
  // TODO: Check if already revealed
  // TODO: Verify timing window (MIN_REVEAL_DELAY <= elapsed <= MAX_REVEAL_DELAY)
  // TODO: Recompute the hash from reveal params
  // TODO: Compare against stored commitHash
  return { valid: false, error: 'Not implemented' };
}

export { createCommitment, verifyReveal, Commitment, MIN_REVEAL_DELAY_SLOTS, MAX_REVEAL_DELAY_SLOTS };`,
    solution: `import { PublicKey } from '@solana/web3.js';
import { createHash } from 'crypto';

interface Commitment {
  commitHash: string;
  commitSlot: number;
  revealed: boolean;
}

const MIN_REVEAL_DELAY_SLOTS = 10;
const MAX_REVEAL_DELAY_SLOTS = 100;

function createCommitment(
  userPubkey: PublicKey,
  action: string,
  amount: number,
  nonce: string,
): string {
  const preimage = \`\${userPubkey.toBase58()}:\${action}:\${amount}:\${nonce}\`;
  return createHash('sha256').update(preimage).digest('hex');
}

function verifyReveal(
  commitment: Commitment,
  userPubkey: PublicKey,
  action: string,
  amount: number,
  nonce: string,
  currentSlot: number,
): { valid: boolean; error?: string } {
  if (commitment.revealed) {
    return { valid: false, error: 'Commitment has already been revealed' };
  }

  const elapsedSlots = currentSlot - commitment.commitSlot;

  if (elapsedSlots < MIN_REVEAL_DELAY_SLOTS) {
    return {
      valid: false,
      error: \`Reveal too early: \${elapsedSlots} slots elapsed, minimum is \${MIN_REVEAL_DELAY_SLOTS}\`,
    };
  }

  if (elapsedSlots > MAX_REVEAL_DELAY_SLOTS) {
    return {
      valid: false,
      error: \`Reveal too late: \${elapsedSlots} slots elapsed, maximum is \${MAX_REVEAL_DELAY_SLOTS}\`,
    };
  }

  const revealHash = createCommitment(userPubkey, action, amount, nonce);

  if (revealHash !== commitment.commitHash) {
    return { valid: false, error: 'Reveal does not match commitment hash' };
  }

  return { valid: true };
}

export { createCommitment, verifyReveal, Commitment, MIN_REVEAL_DELAY_SLOTS, MAX_REVEAL_DELAY_SLOTS };`,
    testCases: [
      {
        input: 'commit with (user, "swap", 1000, nonce), reveal same params at commitSlot + 20',
        expectedOutput: '{ valid: true }',
        description: 'Valid reveal within timing window with matching preimage',
      },
      {
        input: 'commit with (user, "swap", 1000, nonce), reveal at commitSlot + 5',
        expectedOutput: '{ valid: false, error: "Reveal too early: 5 slots elapsed, minimum is 10" }',
        description: 'Rejects reveal before minimum delay to ensure block finality',
      },
      {
        input: 'commit with (user, "swap", 1000, nonce_A), reveal with nonce_B at commitSlot + 20',
        expectedOutput: '{ valid: false, error: "Reveal does not match commitment hash" }',
        description: 'Rejects reveal with wrong nonce (preimage mismatch)',
      },
    ],
    hints: [
      'Include the user pubkey in the hash preimage to prevent one user from replaying another user\'s commitment.',
      'The nonce is critical — without it, an attacker can brute-force a small action space (e.g., buy/sell) to determine the committed action.',
      'Enforce both minimum and maximum reveal delays — too early allows front-running, too late allows indefinite option value.',
    ],
    xpReward: 200,
    estimatedMinutes: 35,
  },
  {
    id: 'sec-019',
    title: 'Sandwich Attack Detection',
    description:
      'Implement a client-side sandwich attack detector that analyzes a transaction\'s surrounding transactions in a block to identify potential sandwich patterns. A sandwich attack places a buy before and a sell after a victim\'s swap to extract value.',
    difficulty: 'advanced',
    category: 'security',
    language: 'typescript',
    starterCode: `import { PublicKey } from '@solana/web3.js';

interface SwapTransaction {
  signature: string;
  signer: PublicKey;
  inputMint: PublicKey;
  outputMint: PublicKey;
  inputAmount: number;
  outputAmount: number;
  blockIndex: number; // Position within the block
}

interface SandwichDetectionResult {
  isSandwiched: boolean;
  confidence: 'high' | 'medium' | 'low' | 'none';
  frontRunTx?: SwapTransaction;
  backRunTx?: SwapTransaction;
  estimatedExtraction?: number;
  details: string;
}

/**
 * Analyzes surrounding transactions to detect sandwich attack patterns.
 *
 * A sandwich has:
 * 1. Front-run: same pair, same direction, from attacker, BEFORE victim
 * 2. Victim: the target transaction
 * 3. Back-run: same pair, OPPOSITE direction, same attacker, AFTER victim
 */
function detectSandwich(
  victimTx: SwapTransaction,
  blockTransactions: SwapTransaction[],
): SandwichDetectionResult {
  // TODO: Filter transactions on the same trading pair
  // TODO: Find potential front-run (same direction, before victim)
  // TODO: Find potential back-run (opposite direction, after victim, same signer as front-run)
  // TODO: Calculate confidence based on timing proximity and extraction amount
  // TODO: Return detection result
  return {
    isSandwiched: false,
    confidence: 'none',
    details: 'Not implemented',
  };
}

export { detectSandwich, SwapTransaction, SandwichDetectionResult };`,
    solution: `import { PublicKey } from '@solana/web3.js';

interface SwapTransaction {
  signature: string;
  signer: PublicKey;
  inputMint: PublicKey;
  outputMint: PublicKey;
  inputAmount: number;
  outputAmount: number;
  blockIndex: number;
}

interface SandwichDetectionResult {
  isSandwiched: boolean;
  confidence: 'high' | 'medium' | 'low' | 'none';
  frontRunTx?: SwapTransaction;
  backRunTx?: SwapTransaction;
  estimatedExtraction?: number;
  details: string;
}

function isSamePair(a: SwapTransaction, b: SwapTransaction): boolean {
  return (
    (a.inputMint.equals(b.inputMint) && a.outputMint.equals(b.outputMint)) ||
    (a.inputMint.equals(b.outputMint) && a.outputMint.equals(b.inputMint))
  );
}

function isSameDirection(a: SwapTransaction, b: SwapTransaction): boolean {
  return a.inputMint.equals(b.inputMint) && a.outputMint.equals(b.outputMint);
}

function isOppositeDirection(a: SwapTransaction, b: SwapTransaction): boolean {
  return a.inputMint.equals(b.outputMint) && a.outputMint.equals(b.inputMint);
}

function detectSandwich(
  victimTx: SwapTransaction,
  blockTransactions: SwapTransaction[],
): SandwichDetectionResult {
  const samePairTxs = blockTransactions.filter(
    (tx) =>
      tx.signature !== victimTx.signature &&
      !tx.signer.equals(victimTx.signer) &&
      isSamePair(tx, victimTx),
  );

  const potentialFrontRuns = samePairTxs.filter(
    (tx) => tx.blockIndex < victimTx.blockIndex && isSameDirection(tx, victimTx),
  );

  if (potentialFrontRuns.length === 0) {
    return { isSandwiched: false, confidence: 'none', details: 'No front-run candidates found' };
  }

  for (const frontRun of potentialFrontRuns) {
    const backRuns = samePairTxs.filter(
      (tx) =>
        tx.blockIndex > victimTx.blockIndex &&
        tx.signer.equals(frontRun.signer) &&
        isOppositeDirection(tx, victimTx),
    );

    if (backRuns.length === 0) continue;

    const backRun = backRuns[0];
    const extraction = backRun.outputAmount - frontRun.inputAmount;
    const frontDistance = victimTx.blockIndex - frontRun.blockIndex;
    const backDistance = backRun.blockIndex - victimTx.blockIndex;
    const totalDistance = frontDistance + backDistance;

    let confidence: 'high' | 'medium' | 'low';
    if (totalDistance <= 4 && extraction > 0) {
      confidence = 'high';
    } else if (totalDistance <= 10 && extraction > 0) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }

    return {
      isSandwiched: true,
      confidence,
      frontRunTx: frontRun,
      backRunTx: backRun,
      estimatedExtraction: Math.max(0, extraction),
      details: \`Sandwich detected: front-run at index \${frontRun.blockIndex}, victim at \${victimTx.blockIndex}, back-run at \${backRun.blockIndex}. Estimated extraction: \${Math.max(0, extraction)} lamports.\`,
    };
  }

  return { isSandwiched: false, confidence: 'none', details: 'No matching front-run/back-run pairs found' };
}

export { detectSandwich, SwapTransaction, SandwichDetectionResult };`,
    testCases: [
      {
        input: 'frontRun(SOL->USDC, idx=5, attacker), victim(SOL->USDC, idx=6), backRun(USDC->SOL, idx=7, attacker)',
        expectedOutput: '{ isSandwiched: true, confidence: "high", estimatedExtraction > 0 }',
        description: 'Detects a classic sandwich with adjacent transactions from the same attacker',
      },
      {
        input: 'victim(SOL->USDC, idx=10), no same-pair transactions nearby',
        expectedOutput: '{ isSandwiched: false, confidence: "none" }',
        description: 'No detection when there are no same-pair transactions',
      },
      {
        input: 'frontRun(SOL->USDC, idx=3, attacker_A), victim(SOL->USDC, idx=6), backRun(USDC->SOL, idx=9, attacker_B)',
        expectedOutput: '{ isSandwiched: false, confidence: "none" }',
        description: 'No detection when front-run and back-run have different signers',
      },
    ],
    hints: [
      'A sandwich requires the same signer for both the front-run and back-run — different signers is likely just normal trading.',
      'The front-run mirrors the victim direction (buy before buy), while the back-run is the opposite direction (sell after victim buys).',
      'Proximity matters for confidence: transactions immediately adjacent to the victim are more suspicious than those several positions away.',
    ],
    xpReward: 200,
    estimatedMinutes: 40,
  },
  {
    id: 'sec-020',
    title: 'Remaining Accounts Privilege Check',
    description:
      'Implement validation for Anchor\'s `remaining_accounts` — the untyped escape hatch that bypasses Anchor\'s automatic account validation. Without manual checks, remaining accounts are a common attack vector where an attacker passes unauthorized or malicious accounts.',
    difficulty: 'advanced',
    category: 'security',
    language: 'rust',
    starterCode: `use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct AccountConstraint {
    pub expected_owner: Pubkey,
    pub must_be_signer: bool,
    pub must_be_writable: bool,
}

/// Validates remaining_accounts against a set of expected constraints.
/// Each constraint corresponds to the account at the same index.
///
/// This prevents attackers from passing arbitrary accounts through
/// the untyped remaining_accounts vector.
pub fn validate_remaining_accounts<'info>(
    remaining_accounts: &[AccountInfo<'info>],
    constraints: &[AccountConstraint],
) -> Result<()> {
    // TODO: Verify remaining_accounts length matches constraints length
    // TODO: For each account, validate:
    //   - Owner matches expected_owner
    //   - is_signer if must_be_signer is true
    //   - is_writable if must_be_writable is true
    // TODO: Check for duplicate account keys in remaining_accounts
    Ok(())
}`,
    solution: `use anchor_lang::prelude::*;
use std::collections::HashSet;

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct AccountConstraint {
    pub expected_owner: Pubkey,
    pub must_be_signer: bool,
    pub must_be_writable: bool,
}

pub fn validate_remaining_accounts<'info>(
    remaining_accounts: &[AccountInfo<'info>],
    constraints: &[AccountConstraint],
) -> Result<()> {
    require!(
        remaining_accounts.len() == constraints.len(),
        RemainingAccountsError::LengthMismatch
    );

    let mut seen_keys = HashSet::with_capacity(remaining_accounts.len());

    for (i, (account, constraint)) in remaining_accounts
        .iter()
        .zip(constraints.iter())
        .enumerate()
    {
        require!(
            seen_keys.insert(*account.key),
            RemainingAccountsError::DuplicateAccount
        );

        require!(
            *account.owner == constraint.expected_owner,
            RemainingAccountsError::InvalidOwner
        );

        if constraint.must_be_signer {
            require!(
                account.is_signer,
                RemainingAccountsError::MissingSigner
            );
        }

        if constraint.must_be_writable {
            require!(
                account.is_writable,
                RemainingAccountsError::NotWritable
            );
        }
    }

    Ok(())
}

#[error_code]
pub enum RemainingAccountsError {
    #[msg("Number of remaining accounts does not match expected constraints")]
    LengthMismatch,
    #[msg("Duplicate account key found in remaining accounts")]
    DuplicateAccount,
    #[msg("Account owner does not match expected owner")]
    InvalidOwner,
    #[msg("Account must be a signer but is not")]
    MissingSigner,
    #[msg("Account must be writable but is not")]
    NotWritable,
}`,
    testCases: [
      {
        input: '2 remaining accounts matching 2 constraints (correct owner, signer, writable)',
        expectedOutput: 'Ok(())',
        description: 'Passes when all remaining accounts satisfy their constraints',
      },
      {
        input: '3 remaining accounts but only 2 constraints',
        expectedOutput: 'Err(LengthMismatch)',
        description: 'Rejects when attacker passes extra unchecked accounts',
      },
      {
        input: 'same account passed twice in remaining_accounts',
        expectedOutput: 'Err(DuplicateAccount)',
        description: 'Detects duplicate accounts that could enable aliased mutable access',
      },
    ],
    hints: [
      'Anchor\'s `remaining_accounts` skips all automatic validation — every check must be manual.',
      'Use a `HashSet` to detect duplicate account keys in O(n) time.',
      'Match constraints by index: `constraints[i]` defines the requirements for `remaining_accounts[i]`.',
    ],
    xpReward: 200,
    estimatedMinutes: 35,
  },
];
