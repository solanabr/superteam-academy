import type { CodingChallenge } from './types';

export const solanaFundamentalsChallenges: CodingChallenge[] = [
  // ── sf-001: Generate a Solana Keypair (beginner, typescript) ──
  {
    id: 'sf-001',
    title: 'Generate a Solana Keypair',
    description:
      'Create a function that generates a new Solana keypair and returns the public key as a base58 string. Use the @solana/web3.js Keypair class to generate a random keypair.',
    difficulty: 'beginner',
    category: 'solana-fundamentals',
    language: 'typescript',
    starterCode: `import { Keypair } from '@solana/web3.js';

/**
 * Generate a new random Solana keypair and return the
 * public key as a base58-encoded string.
 */
export function generateKeypair(): string {
  // TODO: Generate a new Keypair
  // TODO: Return the public key as a base58 string
}`,
    solution: `import { Keypair } from '@solana/web3.js';

export function generateKeypair(): string {
  const keypair = Keypair.generate();
  return keypair.publicKey.toBase58();
}`,
    testCases: [
      {
        input: 'generateKeypair()',
        expectedOutput: 'A 32-44 character base58 string',
        description: 'Returns a valid base58-encoded public key',
      },
      {
        input: 'generateKeypair().length',
        expectedOutput: 'Between 32 and 44',
        description: 'Public key string has correct length for base58',
      },
      {
        input: 'generateKeypair() !== generateKeypair()',
        expectedOutput: 'true',
        description: 'Each call produces a unique keypair',
      },
    ],
    hints: [
      'Use Keypair.generate() to create a new random keypair.',
      'Access the publicKey property on the generated keypair.',
      'Call .toBase58() on the PublicKey to get the string representation.',
    ],
    xpReward: 50,
    estimatedMinutes: 10,
  },

  // ── sf-002: Derive a PDA from seeds (intermediate, typescript) ──
  {
    id: 'sf-002',
    title: 'Derive a PDA from Seeds',
    description:
      'Write a function that derives a Program Derived Address (PDA) given a program ID and an array of seed buffers. Return both the PDA public key (base58) and the bump seed.',
    difficulty: 'intermediate',
    category: 'solana-fundamentals',
    language: 'typescript',
    starterCode: `import { PublicKey } from '@solana/web3.js';

/**
 * Derive a PDA from the given seeds and program ID.
 * @returns {{ address: string; bump: number }}
 */
export function derivePda(
  seeds: Buffer[],
  programId: PublicKey,
): { address: string; bump: number } {
  // TODO: Use PublicKey.findProgramAddressSync to derive the PDA
  // TODO: Return the address as base58 and the bump seed
}`,
    solution: `import { PublicKey } from '@solana/web3.js';

export function derivePda(
  seeds: Buffer[],
  programId: PublicKey,
): { address: string; bump: number } {
  const [pda, bump] = PublicKey.findProgramAddressSync(seeds, programId);
  return { address: pda.toBase58(), bump };
}`,
    testCases: [
      {
        input: 'derivePda([Buffer.from("test")], programId)',
        expectedOutput: '{ address: "<base58>", bump: <number> }',
        description: 'Derives a PDA with a single seed',
      },
      {
        input: 'derivePda([Buffer.from("user"), pubkey.toBuffer()], programId)',
        expectedOutput: '{ address: "<base58>", bump: <0-255> }',
        description: 'Derives a PDA with multiple seeds including a pubkey',
      },
      {
        input: 'derivePda([Buffer.from("test")], programId).bump',
        expectedOutput: 'A number between 0 and 255',
        description: 'Bump seed is within valid range',
      },
    ],
    hints: [
      'PublicKey.findProgramAddressSync takes an array of seed Buffers and a program PublicKey.',
      'The function returns a tuple [PublicKey, number] where the second element is the bump.',
      'Convert the PDA PublicKey to base58 with .toBase58() before returning.',
    ],
    xpReward: 100,
    estimatedMinutes: 20,
  },

  // ── sf-003: Build a transfer instruction (beginner, typescript) ──
  {
    id: 'sf-003',
    title: 'Build a Transfer Instruction',
    description:
      'Create a function that builds a SystemProgram transfer instruction to send SOL from one account to another. Return the TransactionInstruction object.',
    difficulty: 'beginner',
    category: 'solana-fundamentals',
    language: 'typescript',
    starterCode: `import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from '@solana/web3.js';

/**
 * Build a SystemProgram transfer instruction.
 * @param from - Sender public key
 * @param to - Recipient public key
 * @param lamports - Amount in lamports
 */
export function buildTransferIx(
  from: PublicKey,
  to: PublicKey,
  lamports: number,
): TransactionInstruction {
  // TODO: Use SystemProgram.transfer to create the instruction
  // TODO: Return the instruction
}`,
    solution: `import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from '@solana/web3.js';

export function buildTransferIx(
  from: PublicKey,
  to: PublicKey,
  lamports: number,
): TransactionInstruction {
  return SystemProgram.transfer({
    fromPubkey: from,
    toPubkey: to,
    lamports,
  });
}`,
    testCases: [
      {
        input: 'buildTransferIx(from, to, 1_000_000_000)',
        expectedOutput: 'TransactionInstruction with SystemProgram programId',
        description: 'Returns a valid TransactionInstruction for 1 SOL transfer',
      },
      {
        input: 'buildTransferIx(from, to, 500_000).keys.length',
        expectedOutput: '2',
        description: 'Instruction has exactly 2 account keys (from and to)',
      },
      {
        input: 'buildTransferIx(from, to, 100).programId.toBase58()',
        expectedOutput: '11111111111111111111111111111111',
        description: 'Instruction uses the SystemProgram program ID',
      },
    ],
    hints: [
      'SystemProgram.transfer() accepts an object with fromPubkey, toPubkey, and lamports.',
      'The returned object is already a TransactionInstruction — no wrapping needed.',
      '1 SOL = 1_000_000_000 lamports.',
    ],
    xpReward: 50,
    estimatedMinutes: 10,
  },

  // ── sf-004: Create a new account (intermediate, typescript) ──
  {
    id: 'sf-004',
    title: 'Create a New Account',
    description:
      'Write a function that builds a SystemProgram.createAccount instruction to allocate a new account with a given space and owner program. You must calculate the minimum rent-exempt balance.',
    difficulty: 'intermediate',
    category: 'solana-fundamentals',
    language: 'typescript',
    starterCode: `import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from '@solana/web3.js';

/**
 * Build a createAccount instruction.
 * @param payer - Account funding the creation
 * @param newAccount - The new account's public key
 * @param space - Bytes to allocate
 * @param owner - Program that will own the account
 * @param lamports - Rent-exempt minimum lamports
 */
export function buildCreateAccountIx(
  payer: PublicKey,
  newAccount: PublicKey,
  space: number,
  owner: PublicKey,
  lamports: number,
): TransactionInstruction {
  // TODO: Use SystemProgram.createAccount to build the instruction
  // TODO: Pass lamports, space, and programId (owner)
}`,
    solution: `import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from '@solana/web3.js';

export function buildCreateAccountIx(
  payer: PublicKey,
  newAccount: PublicKey,
  space: number,
  owner: PublicKey,
  lamports: number,
): TransactionInstruction {
  return SystemProgram.createAccount({
    fromPubkey: payer,
    newAccountPubkey: newAccount,
    lamports,
    space,
    programId: owner,
  });
}`,
    testCases: [
      {
        input: 'buildCreateAccountIx(payer, newAcct, 165, tokenProgram, 2039280)',
        expectedOutput: 'TransactionInstruction with SystemProgram programId',
        description: 'Creates a valid createAccount instruction for a token account',
      },
      {
        input: 'buildCreateAccountIx(payer, newAcct, 82, owner, rent).keys.length',
        expectedOutput: '2',
        description: 'Instruction has 2 account keys (payer and new account)',
      },
      {
        input: 'buildCreateAccountIx(payer, newAcct, 0, owner, 890880).keys[0].isSigner',
        expectedOutput: 'true',
        description: 'Payer account is marked as a signer',
      },
    ],
    hints: [
      'SystemProgram.createAccount takes fromPubkey, newAccountPubkey, lamports, space, and programId.',
      'The programId field is the owner of the new account, not the SystemProgram.',
      'Both the payer and the new account must sign the transaction.',
    ],
    xpReward: 100,
    estimatedMinutes: 20,
  },

  // ── sf-005: Send SOL to an address (beginner, typescript) ──
  {
    id: 'sf-005',
    title: 'Send SOL to an Address',
    description:
      'Create a function that builds a complete Transaction containing a SOL transfer instruction. The transaction should be ready to sign and send (minus the recent blockhash).',
    difficulty: 'beginner',
    category: 'solana-fundamentals',
    language: 'typescript',
    starterCode: `import {
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';

/**
 * Build a Transaction that transfers SOL.
 * @param from - Sender
 * @param to - Recipient
 * @param solAmount - Amount in SOL (not lamports)
 */
export function buildSolTransferTx(
  from: PublicKey,
  to: PublicKey,
  solAmount: number,
): Transaction {
  // TODO: Convert SOL to lamports (1 SOL = 1e9 lamports)
  // TODO: Create a transfer instruction
  // TODO: Add the instruction to a new Transaction and return it
}`,
    solution: `import {
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';

export function buildSolTransferTx(
  from: PublicKey,
  to: PublicKey,
  solAmount: number,
): Transaction {
  const lamports = solAmount * 1_000_000_000;
  const ix = SystemProgram.transfer({
    fromPubkey: from,
    toPubkey: to,
    lamports,
  });
  const tx = new Transaction().add(ix);
  return tx;
}`,
    testCases: [
      {
        input: 'buildSolTransferTx(from, to, 1)',
        expectedOutput: 'Transaction with 1 instruction',
        description: 'Returns a Transaction with a single transfer instruction',
      },
      {
        input: 'buildSolTransferTx(from, to, 0.5).instructions.length',
        expectedOutput: '1',
        description: 'Transaction contains exactly one instruction',
      },
      {
        input: 'buildSolTransferTx(from, to, 2).instructions[0].programId.toBase58()',
        expectedOutput: '11111111111111111111111111111111',
        description: 'The instruction targets the SystemProgram',
      },
    ],
    hints: [
      'Multiply the SOL amount by 1_000_000_000 to convert to lamports.',
      'Use SystemProgram.transfer to create the instruction.',
      'Call new Transaction().add(instruction) to build the transaction.',
    ],
    xpReward: 50,
    estimatedMinutes: 10,
  },

  // ── sf-006: Parse a transaction signature (beginner, typescript) ──
  {
    id: 'sf-006',
    title: 'Parse a Transaction Signature',
    description:
      'Write a function that validates a Solana transaction signature. A valid signature is a base58-encoded string of 64 bytes (typically 87-88 characters). Return an object with isValid and the byte length.',
    difficulty: 'beginner',
    category: 'solana-fundamentals',
    language: 'typescript',
    starterCode: `import bs58 from 'bs58';

/**
 * Validate a Solana transaction signature string.
 * @returns {{ isValid: boolean; byteLength: number }}
 */
export function parseSignature(
  signature: string,
): { isValid: boolean; byteLength: number } {
  // TODO: Decode the base58 string to bytes
  // TODO: Check if the decoded length is 64 bytes
  // TODO: Return isValid and byteLength
}`,
    solution: `import bs58 from 'bs58';

export function parseSignature(
  signature: string,
): { isValid: boolean; byteLength: number } {
  try {
    const bytes = bs58.decode(signature);
    const byteLength = bytes.length;
    return { isValid: byteLength === 64, byteLength };
  } catch {
    return { isValid: false, byteLength: 0 };
  }
}`,
    testCases: [
      {
        input: 'parseSignature("5VERv8NMhPwV...") // valid 64-byte sig',
        expectedOutput: '{ isValid: true, byteLength: 64 }',
        description: 'Correctly identifies a valid 64-byte transaction signature',
      },
      {
        input: 'parseSignature("abc")',
        expectedOutput: '{ isValid: false, byteLength: 3 }',
        description: 'Rejects a string that decodes to fewer than 64 bytes',
      },
      {
        input: 'parseSignature("!!!invalid!!!")',
        expectedOutput: '{ isValid: false, byteLength: 0 }',
        description: 'Handles invalid base58 characters gracefully',
      },
    ],
    hints: [
      'Use bs58.decode() to convert the base58 string into a Uint8Array.',
      'A Solana signature is exactly 64 bytes when decoded.',
      'Wrap the decode in a try-catch to handle invalid base58 input.',
    ],
    xpReward: 50,
    estimatedMinutes: 10,
  },

  // ── sf-007: Serialize instruction data (intermediate, rust) ──
  {
    id: 'sf-007',
    title: 'Serialize Instruction Data',
    description:
      'Implement a Rust function that serializes instruction data using Borsh. Define a struct with a variant (u8) and an amount (u64), then serialize it into a byte vector for use as instruction data.',
    difficulty: 'intermediate',
    category: 'solana-fundamentals',
    language: 'rust',
    starterCode: `use borsh::{BorshSerialize, BorshDeserialize};

#[derive(BorshSerialize, BorshDeserialize)]
pub struct InstructionData {
    // TODO: Add a variant field (u8) and an amount field (u64)
}

/// Serialize instruction data into a byte vector.
pub fn serialize_ix_data(variant: u8, amount: u64) -> Vec<u8> {
    // TODO: Create an InstructionData instance
    // TODO: Serialize it using Borsh and return the bytes
}`,
    solution: `use borsh::{BorshSerialize, BorshDeserialize};

#[derive(BorshSerialize, BorshDeserialize)]
pub struct InstructionData {
    pub variant: u8,
    pub amount: u64,
}

pub fn serialize_ix_data(variant: u8, amount: u64) -> Vec<u8> {
    let data = InstructionData { variant, amount };
    data.try_to_vec().expect("serialization failed")
}`,
    testCases: [
      {
        input: 'serialize_ix_data(0, 1_000_000_000)',
        expectedOutput: '[0, 0, 202, 154, 59, 0, 0, 0, 0]',
        description: 'Serializes variant=0, amount=1 SOL to correct Borsh bytes',
      },
      {
        input: 'serialize_ix_data(1, 0)',
        expectedOutput: '[1, 0, 0, 0, 0, 0, 0, 0, 0]',
        description: 'Serializes variant=1, amount=0 to 9 bytes (1 + 8)',
      },
      {
        input: 'serialize_ix_data(255, u64::MAX).len()',
        expectedOutput: '9',
        description: 'Output is always 9 bytes (1 for u8 + 8 for u64)',
      },
    ],
    hints: [
      'Derive BorshSerialize on your struct to enable .try_to_vec().',
      'Borsh serializes u8 as 1 byte and u64 as 8 little-endian bytes.',
      'Use .try_to_vec().expect("msg") or handle the Result properly.',
    ],
    xpReward: 100,
    estimatedMinutes: 20,
  },

  // ── sf-008: Calculate rent exemption (beginner, typescript) ──
  {
    id: 'sf-008',
    title: 'Calculate Rent Exemption',
    description:
      'Write a function that calculates the minimum balance for rent exemption given the account data size. Use the formula: the rent-exempt minimum is roughly (account_size + 128) * 2 years of rent at 3.48 SOL/year per MB, approximated by the constant 6960 lamports per byte.',
    difficulty: 'beginner',
    category: 'solana-fundamentals',
    language: 'typescript',
    starterCode: `/**
 * Calculate approximate rent-exempt minimum in lamports.
 * Uses the simplified formula: (dataSize + 128) * 6960
 * The 128 bytes is the account metadata overhead.
 * @param dataSize - The data size in bytes
 */
export function calculateRentExemption(dataSize: number): number {
  // TODO: Add the 128-byte account overhead
  // TODO: Multiply by the per-byte rent constant (6960)
  // TODO: Return the result in lamports
}`,
    solution: `export function calculateRentExemption(dataSize: number): number {
  const ACCOUNT_OVERHEAD = 128;
  const LAMPORTS_PER_BYTE = 6960;
  return (dataSize + ACCOUNT_OVERHEAD) * LAMPORTS_PER_BYTE;
}`,
    testCases: [
      {
        input: 'calculateRentExemption(0)',
        expectedOutput: '890880',
        description: 'Empty account (0 data bytes) requires rent for 128 bytes of overhead',
      },
      {
        input: 'calculateRentExemption(165)',
        expectedOutput: '2039280',
        description: 'Token account (165 bytes) matches expected rent-exempt minimum',
      },
      {
        input: 'calculateRentExemption(82)',
        expectedOutput: '1461600',
        description: 'Mint account (82 bytes) returns correct rent-exempt balance',
      },
    ],
    hints: [
      'Every Solana account has 128 bytes of metadata overhead added to the data size.',
      'The per-byte cost for two years of rent at current rates is approximately 6960 lamports.',
      'Simply compute (dataSize + 128) * 6960 to get the lamport amount.',
    ],
    xpReward: 50,
    estimatedMinutes: 10,
  },

  // ── sf-009: Check account ownership (beginner, rust) ──
  {
    id: 'sf-009',
    title: 'Check Account Ownership',
    description:
      'Write a Rust function that verifies whether a given account is owned by the expected program. This is a fundamental security check in Solana programs to prevent spoofed accounts.',
    difficulty: 'beginner',
    category: 'solana-fundamentals',
    language: 'rust',
    starterCode: `use solana_program::pubkey::Pubkey;
use solana_program::account_info::AccountInfo;
use solana_program::program_error::ProgramError;

/// Verify that the account is owned by the expected program.
/// Returns Ok(()) if ownership matches, Err otherwise.
pub fn check_owner(
    account: &AccountInfo,
    expected_owner: &Pubkey,
) -> Result<(), ProgramError> {
    // TODO: Compare account.owner with expected_owner
    // TODO: Return ProgramError::IncorrectProgramId on mismatch
}`,
    solution: `use solana_program::pubkey::Pubkey;
use solana_program::account_info::AccountInfo;
use solana_program::program_error::ProgramError;

pub fn check_owner(
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
        input: 'check_owner(&acct_owned_by_program, &program_id)',
        expectedOutput: 'Ok(())',
        description: 'Returns Ok when the account owner matches the expected program',
      },
      {
        input: 'check_owner(&acct_owned_by_system, &program_id)',
        expectedOutput: 'Err(ProgramError::IncorrectProgramId)',
        description: 'Returns IncorrectProgramId when owner does not match',
      },
      {
        input: 'check_owner(&acct_owned_by_program, &Pubkey::default())',
        expectedOutput: 'Err(ProgramError::IncorrectProgramId)',
        description: 'Rejects when expected_owner is the default (zero) pubkey',
      },
    ],
    hints: [
      'AccountInfo has an `owner` field that is a reference to the program Pubkey that owns it.',
      'Compare account.owner with expected_owner using != for inequality.',
      'Return ProgramError::IncorrectProgramId for the error variant.',
    ],
    xpReward: 50,
    estimatedMinutes: 10,
  },

  // ── sf-010: Verify a transaction signer (beginner, rust) ──
  {
    id: 'sf-010',
    title: 'Verify a Transaction Signer',
    description:
      'Write a Rust function that checks whether an AccountInfo is a signer of the current transaction. This is critical for authorization checks in on-chain programs.',
    difficulty: 'beginner',
    category: 'solana-fundamentals',
    language: 'rust',
    starterCode: `use solana_program::account_info::AccountInfo;
use solana_program::program_error::ProgramError;

/// Verify that the given account has signed the transaction.
/// Returns Ok(()) if it is a signer, Err(MissingRequiredSignature) otherwise.
pub fn verify_signer(account: &AccountInfo) -> Result<(), ProgramError> {
    // TODO: Check the is_signer field on the AccountInfo
    // TODO: Return appropriate error if not a signer
}`,
    solution: `use solana_program::account_info::AccountInfo;
use solana_program::program_error::ProgramError;

pub fn verify_signer(account: &AccountInfo) -> Result<(), ProgramError> {
    if !account.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    Ok(())
}`,
    testCases: [
      {
        input: 'verify_signer(&signer_account)',
        expectedOutput: 'Ok(())',
        description: 'Returns Ok when the account is a signer',
      },
      {
        input: 'verify_signer(&non_signer_account)',
        expectedOutput: 'Err(ProgramError::MissingRequiredSignature)',
        description: 'Returns MissingRequiredSignature for non-signers',
      },
      {
        input: 'verify_signer(&pda_account)',
        expectedOutput: 'Err(ProgramError::MissingRequiredSignature)',
        description: 'PDA accounts are not signers unless invoked via CPI with seeds',
      },
    ],
    hints: [
      'AccountInfo has a boolean field called `is_signer`.',
      'Use ProgramError::MissingRequiredSignature for the error case.',
      'PDAs can only sign via invoke_signed in CPIs, not as direct transaction signers.',
    ],
    xpReward: 50,
    estimatedMinutes: 10,
  },

  // ── sf-011: Build a versioned transaction (intermediate, typescript) ──
  {
    id: 'sf-011',
    title: 'Build a Versioned Transaction',
    description:
      'Create a function that constructs a V0 VersionedTransaction from an array of instructions, a payer, and a recent blockhash. Versioned transactions support address lookup tables and are the modern standard.',
    difficulty: 'intermediate',
    category: 'solana-fundamentals',
    language: 'typescript',
    starterCode: `import {
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';

/**
 * Build a V0 versioned transaction.
 * @param instructions - Array of instructions to include
 * @param payer - Fee payer public key
 * @param blockhash - Recent blockhash string
 */
export function buildVersionedTx(
  instructions: TransactionInstruction[],
  payer: PublicKey,
  blockhash: string,
): VersionedTransaction {
  // TODO: Create a TransactionMessage with V0 compile
  // TODO: Wrap in a VersionedTransaction and return
}`,
    solution: `import {
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';

export function buildVersionedTx(
  instructions: TransactionInstruction[],
  payer: PublicKey,
  blockhash: string,
): VersionedTransaction {
  const message = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message();
  return new VersionedTransaction(message);
}`,
    testCases: [
      {
        input: 'buildVersionedTx([transferIx], payer, blockhash)',
        expectedOutput: 'VersionedTransaction with version 0',
        description: 'Returns a VersionedTransaction with V0 message format',
      },
      {
        input: 'buildVersionedTx([ix1, ix2], payer, blockhash).message.compiledInstructions.length',
        expectedOutput: '2',
        description: 'Compiled message includes all provided instructions',
      },
      {
        input: 'buildVersionedTx([], payer, blockhash).version',
        expectedOutput: '0',
        description: 'Transaction version is 0 (V0)',
      },
    ],
    hints: [
      'TransactionMessage takes payerKey, recentBlockhash, and instructions in its constructor.',
      'Call .compileToV0Message() on the TransactionMessage to get a V0 compiled message.',
      'Pass the compiled message to the VersionedTransaction constructor.',
    ],
    xpReward: 100,
    estimatedMinutes: 20,
  },

  // ── sf-012: Use compute budget instructions (intermediate, typescript) ──
  {
    id: 'sf-012',
    title: 'Use Compute Budget Instructions',
    description:
      'Write a function that prepends compute budget instructions to a transaction — one to set the compute unit limit and one to set the priority fee (price per compute unit in micro-lamports).',
    difficulty: 'intermediate',
    category: 'solana-fundamentals',
    language: 'typescript',
    starterCode: `import {
  ComputeBudgetProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';

/**
 * Prepend compute budget instructions to a transaction.
 * @param tx - Existing transaction with instructions
 * @param computeUnits - Max compute units to request
 * @param microLamportsPerCu - Priority fee in micro-lamports per CU
 */
export function addComputeBudget(
  tx: Transaction,
  computeUnits: number,
  microLamportsPerCu: number,
): Transaction {
  // TODO: Create a setComputeUnitLimit instruction
  // TODO: Create a setComputeUnitPrice instruction
  // TODO: Prepend both to the transaction's instructions
  // TODO: Return the modified transaction
}`,
    solution: `import {
  ComputeBudgetProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';

export function addComputeBudget(
  tx: Transaction,
  computeUnits: number,
  microLamportsPerCu: number,
): Transaction {
  const limitIx = ComputeBudgetProgram.setComputeUnitLimit({
    units: computeUnits,
  });
  const priceIx = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: microLamportsPerCu,
  });
  tx.instructions = [limitIx, priceIx, ...tx.instructions];
  return tx;
}`,
    testCases: [
      {
        input: 'addComputeBudget(txWith1Ix, 400_000, 1000).instructions.length',
        expectedOutput: '3',
        description: 'Adds 2 compute budget instructions to existing transaction',
      },
      {
        input: 'addComputeBudget(txWith1Ix, 200_000, 500).instructions[0].programId.toBase58()',
        expectedOutput: 'ComputeBudget111111111111111111111111111111',
        description: 'First instruction targets the ComputeBudget program',
      },
      {
        input: 'addComputeBudget(txWith1Ix, 200_000, 500).instructions[1].programId.toBase58()',
        expectedOutput: 'ComputeBudget111111111111111111111111111111',
        description: 'Second instruction also targets the ComputeBudget program',
      },
    ],
    hints: [
      'ComputeBudgetProgram.setComputeUnitLimit({ units }) sets the CU limit.',
      'ComputeBudgetProgram.setComputeUnitPrice({ microLamports }) sets the priority fee.',
      'Prepend the budget instructions before existing instructions using array spread.',
    ],
    xpReward: 100,
    estimatedMinutes: 20,
  },

  // ── sf-013: Create an address lookup table entry (advanced, typescript) ──
  {
    id: 'sf-013',
    title: 'Create an Address Lookup Table Entry',
    description:
      'Write a function that builds the instructions to create a new address lookup table (ALT) and extend it with a list of addresses. ALTs reduce transaction size by replacing repeated pubkeys with indices.',
    difficulty: 'advanced',
    category: 'solana-fundamentals',
    language: 'typescript',
    starterCode: `import {
  AddressLookupTableProgram,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';

/**
 * Build instructions to create and extend an address lookup table.
 * @param authority - ALT authority
 * @param payer - Fee payer
 * @param recentSlot - Slot for ALT derivation
 * @param addresses - Addresses to add to the table
 * @returns {{ createIx: TransactionInstruction; extendIx: TransactionInstruction; lutAddress: PublicKey }}
 */
export function buildLookupTableIxs(
  authority: PublicKey,
  payer: PublicKey,
  recentSlot: number,
  addresses: PublicKey[],
): {
  createIx: TransactionInstruction;
  extendIx: TransactionInstruction;
  lutAddress: PublicKey;
} {
  // TODO: Use AddressLookupTableProgram.createLookupTable
  // TODO: Use AddressLookupTableProgram.extendLookupTable
  // TODO: Return both instructions and the LUT address
}`,
    solution: `import {
  AddressLookupTableProgram,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';

export function buildLookupTableIxs(
  authority: PublicKey,
  payer: PublicKey,
  recentSlot: number,
  addresses: PublicKey[],
): {
  createIx: TransactionInstruction;
  extendIx: TransactionInstruction;
  lutAddress: PublicKey;
} {
  const [createIx, lutAddress] = AddressLookupTableProgram.createLookupTable({
    authority,
    payer,
    recentSlot,
  });
  const extendIx = AddressLookupTableProgram.extendLookupTable({
    payer,
    authority,
    lookupTable: lutAddress,
    addresses,
  });
  return { createIx, extendIx, lutAddress };
}`,
    testCases: [
      {
        input: 'buildLookupTableIxs(auth, payer, 100, [addr1, addr2])',
        expectedOutput: '{ createIx: TransactionInstruction, extendIx: TransactionInstruction, lutAddress: PublicKey }',
        description: 'Returns create and extend instructions with the derived LUT address',
      },
      {
        input: 'buildLookupTableIxs(auth, payer, 100, [addr1]).createIx.programId.toBase58()',
        expectedOutput: 'AddressLookupTab1e1111111111111111111111111',
        description: 'Create instruction targets the AddressLookupTable program',
      },
      {
        input: 'buildLookupTableIxs(auth, payer, 100, [addr1]).lutAddress',
        expectedOutput: 'PublicKey (deterministic from authority + recentSlot)',
        description: 'LUT address is deterministically derived from authority and slot',
      },
    ],
    hints: [
      'AddressLookupTableProgram.createLookupTable returns a tuple [instruction, lutAddress].',
      'AddressLookupTableProgram.extendLookupTable needs the lookupTable address from creation.',
      'The LUT address is derived from the authority and the recentSlot — it is deterministic.',
    ],
    xpReward: 200,
    estimatedMinutes: 30,
  },

  // ── sf-014: Multi-instruction transaction (beginner, typescript) ──
  {
    id: 'sf-014',
    title: 'Multi-Instruction Transaction',
    description:
      'Build a function that creates a transaction containing multiple instructions atomically. If any instruction fails, the entire transaction rolls back. Combine a memo instruction with a SOL transfer.',
    difficulty: 'beginner',
    category: 'solana-fundamentals',
    language: 'typescript',
    starterCode: `import {
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';

const MEMO_PROGRAM_ID = new PublicKey(
  'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'
);

/**
 * Build a transaction with a SOL transfer and a memo.
 * @param from - Sender
 * @param to - Recipient
 * @param lamports - Transfer amount
 * @param memo - Memo string to include
 */
export function buildTransferWithMemo(
  from: PublicKey,
  to: PublicKey,
  lamports: number,
  memo: string,
): Transaction {
  // TODO: Create the transfer instruction
  // TODO: Create the memo instruction (data = memo encoded as UTF-8)
  // TODO: Add both to a single Transaction
}`,
    solution: `import {
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';

const MEMO_PROGRAM_ID = new PublicKey(
  'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'
);

export function buildTransferWithMemo(
  from: PublicKey,
  to: PublicKey,
  lamports: number,
  memo: string,
): Transaction {
  const transferIx = SystemProgram.transfer({
    fromPubkey: from,
    toPubkey: to,
    lamports,
  });
  const memoIx = new TransactionInstruction({
    keys: [{ pubkey: from, isSigner: true, isWritable: false }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memo, 'utf-8'),
  });
  return new Transaction().add(transferIx, memoIx);
}`,
    testCases: [
      {
        input: 'buildTransferWithMemo(from, to, 1e9, "hello").instructions.length',
        expectedOutput: '2',
        description: 'Transaction contains exactly 2 instructions (transfer + memo)',
      },
      {
        input: 'buildTransferWithMemo(from, to, 1e9, "gm").instructions[1].programId.toBase58()',
        expectedOutput: 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
        description: 'Second instruction uses the Memo program ID',
      },
      {
        input: 'buildTransferWithMemo(from, to, 1e9, "test").instructions[1].data.toString()',
        expectedOutput: 'test',
        description: 'Memo instruction data contains the encoded memo string',
      },
    ],
    hints: [
      'The memo instruction takes the memo text as UTF-8 encoded buffer in the data field.',
      'The memo signer should be the sender (from) marked as isSigner: true.',
      'Transaction.add() accepts multiple instructions in a single call.',
    ],
    xpReward: 50,
    estimatedMinutes: 15,
  },

  // ── sf-015: Deserialize account data (intermediate, rust) ──
  {
    id: 'sf-015',
    title: 'Deserialize Account Data',
    description:
      'Write a Rust function that deserializes raw account data bytes into a typed struct using Borsh. The struct represents a simple counter account with an authority (Pubkey) and a count (u64).',
    difficulty: 'intermediate',
    category: 'solana-fundamentals',
    language: 'rust',
    starterCode: `use borsh::{BorshSerialize, BorshDeserialize};
use solana_program::pubkey::Pubkey;
use solana_program::program_error::ProgramError;

#[derive(BorshSerialize, BorshDeserialize, Debug, PartialEq)]
pub struct CounterAccount {
    // TODO: Add authority (Pubkey) and count (u64) fields
}

/// Deserialize raw bytes into a CounterAccount.
pub fn deserialize_counter(data: &[u8]) -> Result<CounterAccount, ProgramError> {
    // TODO: Use BorshDeserialize::try_from_slice
    // TODO: Map the error to ProgramError::InvalidAccountData
}`,
    solution: `use borsh::{BorshSerialize, BorshDeserialize};
use solana_program::pubkey::Pubkey;
use solana_program::program_error::ProgramError;

#[derive(BorshSerialize, BorshDeserialize, Debug, PartialEq)]
pub struct CounterAccount {
    pub authority: Pubkey,
    pub count: u64,
}

pub fn deserialize_counter(data: &[u8]) -> Result<CounterAccount, ProgramError> {
    CounterAccount::try_from_slice(data)
        .map_err(|_| ProgramError::InvalidAccountData)
}`,
    testCases: [
      {
        input: 'deserialize_counter(&valid_40_bytes)',
        expectedOutput: 'Ok(CounterAccount { authority: <pubkey>, count: 42 })',
        description: 'Successfully deserializes valid 40-byte data (32 pubkey + 8 u64)',
      },
      {
        input: 'deserialize_counter(&[0u8; 10])',
        expectedOutput: 'Err(ProgramError::InvalidAccountData)',
        description: 'Returns error for data shorter than expected struct size',
      },
      {
        input: 'deserialize_counter(&[])',
        expectedOutput: 'Err(ProgramError::InvalidAccountData)',
        description: 'Returns error for empty byte slice',
      },
    ],
    hints: [
      'CounterAccount is 40 bytes: 32 for Pubkey + 8 for u64.',
      'Use CounterAccount::try_from_slice(data) to deserialize with Borsh.',
      'Map the Borsh error to ProgramError::InvalidAccountData using .map_err().',
    ],
    xpReward: 100,
    estimatedMinutes: 25,
  },

  // ── sf-016: Handle blockhash expiry (intermediate, typescript) ──
  {
    id: 'sf-016',
    title: 'Handle Blockhash Expiry',
    description:
      'Write a function that checks whether a transaction blockhash is still valid by comparing the current slot against the blockhash slot plus the max age (default 150 blocks). Return status and blocks remaining.',
    difficulty: 'intermediate',
    category: 'solana-fundamentals',
    language: 'typescript',
    starterCode: `/**
 * Check if a blockhash is still valid based on slot age.
 * @param blockhashSlot - The slot when the blockhash was fetched
 * @param currentSlot - The current confirmed slot
 * @param maxAge - Maximum block age (default 150)
 * @returns {{ isValid: boolean; blocksRemaining: number }}
 */
export function checkBlockhashValidity(
  blockhashSlot: number,
  currentSlot: number,
  maxAge: number = 150,
): { isValid: boolean; blocksRemaining: number } {
  // TODO: Calculate how many blocks have elapsed
  // TODO: Determine if the blockhash is still valid
  // TODO: Return isValid and the number of blocks remaining (min 0)
}`,
    solution: `export function checkBlockhashValidity(
  blockhashSlot: number,
  currentSlot: number,
  maxAge: number = 150,
): { isValid: boolean; blocksRemaining: number } {
  const elapsed = currentSlot - blockhashSlot;
  const blocksRemaining = Math.max(0, maxAge - elapsed);
  return {
    isValid: elapsed < maxAge,
    blocksRemaining,
  };
}`,
    testCases: [
      {
        input: 'checkBlockhashValidity(1000, 1050)',
        expectedOutput: '{ isValid: true, blocksRemaining: 100 }',
        description: 'Blockhash at slot 1000 is valid at slot 1050 with 100 blocks remaining',
      },
      {
        input: 'checkBlockhashValidity(1000, 1150)',
        expectedOutput: '{ isValid: false, blocksRemaining: 0 }',
        description: 'Blockhash expires after exactly 150 blocks',
      },
      {
        input: 'checkBlockhashValidity(500, 500)',
        expectedOutput: '{ isValid: true, blocksRemaining: 150 }',
        description: 'Blockhash fetched at current slot has full lifetime remaining',
      },
    ],
    hints: [
      'Subtract blockhashSlot from currentSlot to get the elapsed blocks.',
      'The blockhash is valid when elapsed < maxAge (strictly less than).',
      'Use Math.max(0, maxAge - elapsed) to prevent negative remaining blocks.',
    ],
    xpReward: 100,
    estimatedMinutes: 15,
  },

  // ── sf-017: Cross-program invocation basics (advanced, rust) ──
  {
    id: 'sf-017',
    title: 'Cross-Program Invocation Basics',
    description:
      'Write a Rust function that performs a CPI to transfer SOL via the System Program. This is the foundation for program composability on Solana — one program invoking another.',
    difficulty: 'advanced',
    category: 'solana-fundamentals',
    language: 'rust',
    starterCode: `use solana_program::{
    account_info::AccountInfo,
    entrypoint::ProgramResult,
    program::invoke,
    system_instruction,
};

/// Transfer SOL from one account to another via CPI.
/// Both accounts must be passed as AccountInfos.
pub fn transfer_sol_cpi<'a>(
    from: &AccountInfo<'a>,
    to: &AccountInfo<'a>,
    system_program: &AccountInfo<'a>,
    lamports: u64,
) -> ProgramResult {
    // TODO: Build a system_instruction::transfer
    // TODO: Collect the account infos into a slice
    // TODO: Call invoke() with the instruction and accounts
}`,
    solution: `use solana_program::{
    account_info::AccountInfo,
    entrypoint::ProgramResult,
    program::invoke,
    system_instruction,
};

pub fn transfer_sol_cpi<'a>(
    from: &AccountInfo<'a>,
    to: &AccountInfo<'a>,
    system_program: &AccountInfo<'a>,
    lamports: u64,
) -> ProgramResult {
    let ix = system_instruction::transfer(from.key, to.key, lamports);
    invoke(
        &ix,
        &[from.clone(), to.clone(), system_program.clone()],
    )
}`,
    testCases: [
      {
        input: 'transfer_sol_cpi(&from, &to, &sys, 1_000_000)',
        expectedOutput: 'Ok(())',
        description: 'Successfully transfers 0.001 SOL via CPI when from has sufficient balance',
      },
      {
        input: 'transfer_sol_cpi(&from_no_funds, &to, &sys, 1_000_000)',
        expectedOutput: 'Err(InsufficientFunds)',
        description: 'Fails when the sender has insufficient lamports',
      },
      {
        input: 'transfer_sol_cpi(&from, &to, &sys, 0)',
        expectedOutput: 'Ok(())',
        description: 'Transferring 0 lamports succeeds without error',
      },
    ],
    hints: [
      'Use system_instruction::transfer(from_pubkey, to_pubkey, lamports) to build the instruction.',
      'invoke() takes a reference to the instruction and a slice of AccountInfo references.',
      'You need to clone() the AccountInfos when passing them to invoke.',
    ],
    xpReward: 200,
    estimatedMinutes: 30,
  },

  // ── sf-018: Simulate a transaction (advanced, typescript) ──
  {
    id: 'sf-018',
    title: 'Simulate a Transaction',
    description:
      'Write a function that prepares a transaction for simulation using a Connection. Simulation lets you dry-run a transaction to check for errors and estimate compute units without actually submitting it to the network.',
    difficulty: 'advanced',
    category: 'solana-fundamentals',
    language: 'typescript',
    starterCode: `import {
  Connection,
  PublicKey,
  Transaction,
  SimulatedTransactionResponse,
} from '@solana/web3.js';

/**
 * Simulate a transaction and return the result.
 * @param connection - RPC connection
 * @param tx - Transaction to simulate
 * @param signers - Public keys of signers (for simulation account override)
 * @returns The simulation response with logs and units consumed
 */
export async function simulateTransaction(
  connection: Connection,
  tx: Transaction,
  signers: PublicKey[],
): Promise<{
  success: boolean;
  logs: string[];
  unitsConsumed: number;
}> {
  // TODO: Call connection.simulateTransaction with sigVerify disabled
  // TODO: Extract err, logs, and unitsConsumed from the response
  // TODO: Return a structured result object
}`,
    solution: `import {
  Connection,
  PublicKey,
  Transaction,
  SimulatedTransactionResponse,
} from '@solana/web3.js';

export async function simulateTransaction(
  connection: Connection,
  tx: Transaction,
  signers: PublicKey[],
): Promise<{
  success: boolean;
  logs: string[];
  unitsConsumed: number;
}> {
  const result = await connection.simulateTransaction(tx, signers);
  return {
    success: result.value.err === null,
    logs: result.value.logs ?? [],
    unitsConsumed: result.value.unitsConsumed ?? 0,
  };
}`,
    testCases: [
      {
        input: 'await simulateTransaction(conn, validTx, [payer])',
        expectedOutput: '{ success: true, logs: [...], unitsConsumed: 150 }',
        description: 'Returns success=true with logs and CU for a valid transaction',
      },
      {
        input: 'await simulateTransaction(conn, invalidTx, [payer])',
        expectedOutput: '{ success: false, logs: ["Program log: Error..."], unitsConsumed: 0 }',
        description: 'Returns success=false with error logs for a failing transaction',
      },
      {
        input: '(await simulateTransaction(conn, tx, [payer])).logs',
        expectedOutput: 'string[]',
        description: 'Logs array is always present (empty array if none)',
      },
    ],
    hints: [
      'connection.simulateTransaction(tx, signers) skips signature verification when given signer pubkeys.',
      'The result is in result.value with fields err, logs, and unitsConsumed.',
      'Use nullish coalescing (??) to provide defaults for logs (empty array) and unitsConsumed (0).',
    ],
    xpReward: 200,
    estimatedMinutes: 30,
  },

  // ── sf-019: Parse transaction logs (advanced, typescript) ──
  {
    id: 'sf-019',
    title: 'Parse Transaction Logs',
    description:
      'Write a function that parses Solana transaction log messages to extract program invocations, log messages, and compute unit consumption. This is essential for debugging and monitoring on-chain programs.',
    difficulty: 'advanced',
    category: 'solana-fundamentals',
    language: 'typescript',
    starterCode: `interface ParsedLog {
  programId: string;
  logs: string[];
  computeUnits: number | null;
}

/**
 * Parse raw Solana transaction log lines into structured data.
 * Log patterns:
 *   "Program <id> invoke [<depth>]"
 *   "Program log: <message>"
 *   "Program <id> consumed <n> of <m> compute units"
 *   "Program <id> success"
 *   "Program <id> failed: <error>"
 */
export function parseTransactionLogs(logMessages: string[]): ParsedLog[] {
  // TODO: Iterate through log messages
  // TODO: Track current program invocation
  // TODO: Collect logs and compute units per program
  // TODO: Return array of ParsedLog objects
}`,
    solution: `interface ParsedLog {
  programId: string;
  logs: string[];
  computeUnits: number | null;
}

export function parseTransactionLogs(logMessages: string[]): ParsedLog[] {
  const results: ParsedLog[] = [];
  let current: ParsedLog | null = null;

  for (const line of logMessages) {
    const invokeMatch = line.match(/^Program (\w+) invoke \[(\d+)\]$/);
    if (invokeMatch) {
      if (current) {
        results.push(current);
      }
      current = { programId: invokeMatch[1], logs: [], computeUnits: null };
      continue;
    }

    if (!current) continue;

    const logMatch = line.match(/^Program log: (.+)$/);
    if (logMatch) {
      current.logs.push(logMatch[1]);
      continue;
    }

    const cuMatch = line.match(/^Program \w+ consumed (\d+) of \d+ compute units$/);
    if (cuMatch) {
      current.computeUnits = parseInt(cuMatch[1], 10);
      continue;
    }

    const endMatch = line.match(/^Program \w+ (success|failed)/);
    if (endMatch) {
      results.push(current);
      current = null;
    }
  }

  if (current) {
    results.push(current);
  }

  return results;
}`,
    testCases: [
      {
        input: 'parseTransactionLogs(["Program ABC invoke [1]", "Program log: hello", "Program ABC consumed 500 of 200000 compute units", "Program ABC success"])',
        expectedOutput: '[{ programId: "ABC", logs: ["hello"], computeUnits: 500 }]',
        description: 'Parses a single program invocation with log and compute units',
      },
      {
        input: 'parseTransactionLogs(["Program A invoke [1]", "Program A success", "Program B invoke [1]", "Program B success"])',
        expectedOutput: '[{ programId: "A", logs: [], computeUnits: null }, { programId: "B", logs: [], computeUnits: null }]',
        description: 'Parses multiple sequential program invocations',
      },
      {
        input: 'parseTransactionLogs([])',
        expectedOutput: '[]',
        description: 'Returns empty array for empty log input',
      },
    ],
    hints: [
      'Use regex to match the different log line patterns: invoke, log, consumed, success/failed.',
      'Track the current program context and push it to results when you see success or failed.',
      'Handle edge cases: empty logs, nested invocations, and missing compute unit lines.',
    ],
    xpReward: 200,
    estimatedMinutes: 35,
  },

  // ── sf-020: Build an Anchor instruction (advanced, typescript) ──
  {
    id: 'sf-020',
    title: 'Build an Anchor Instruction',
    description:
      'Write a function that manually constructs an Anchor instruction using the 8-byte discriminator hash, Borsh-serialized arguments, and an accounts array. This teaches the low-level mechanics behind Anchor\'s generated client code.',
    difficulty: 'advanced',
    category: 'solana-fundamentals',
    language: 'typescript',
    starterCode: `import {
  PublicKey,
  TransactionInstruction,
  AccountMeta,
} from '@solana/web3.js';
import { createHash } from 'crypto';

/**
 * Build an Anchor instruction from scratch.
 * @param programId - The on-chain program ID
 * @param instructionName - The snake_case instruction name (e.g., "initialize")
 * @param args - Borsh-serialized argument data (Buffer)
 * @param accounts - Array of AccountMeta for the instruction
 * @returns TransactionInstruction ready for a transaction
 */
export function buildAnchorInstruction(
  programId: PublicKey,
  instructionName: string,
  args: Buffer,
  accounts: AccountMeta[],
): TransactionInstruction {
  // TODO: Generate the 8-byte Anchor discriminator
  //       SHA256("global:<instruction_name>")[0..8]
  // TODO: Concatenate the discriminator with the serialized args
  // TODO: Create and return a TransactionInstruction
}`,
    solution: `import {
  PublicKey,
  TransactionInstruction,
  AccountMeta,
} from '@solana/web3.js';
import { createHash } from 'crypto';

export function buildAnchorInstruction(
  programId: PublicKey,
  instructionName: string,
  args: Buffer,
  accounts: AccountMeta[],
): TransactionInstruction {
  const discriminator = createHash('sha256')
    .update(\`global:\${instructionName}\`)
    .digest()
    .subarray(0, 8);
  const data = Buffer.concat([discriminator, args]);
  return new TransactionInstruction({
    keys: accounts,
    programId,
    data,
  });
}`,
    testCases: [
      {
        input: 'buildAnchorInstruction(progId, "initialize", Buffer.alloc(0), accounts).data.length',
        expectedOutput: '8',
        description: 'Instruction with no args has exactly 8 bytes (discriminator only)',
      },
      {
        input: 'buildAnchorInstruction(progId, "transfer", Buffer.alloc(8), accounts).data.length',
        expectedOutput: '16',
        description: 'Instruction with 8-byte args has 16 bytes (8 discriminator + 8 args)',
      },
      {
        input: 'buildAnchorInstruction(progId, "initialize", Buffer.alloc(0), accounts).data.subarray(0, 8)',
        expectedOutput: 'SHA256("global:initialize")[0..8]',
        description: 'First 8 bytes match the SHA256 discriminator for the instruction name',
      },
    ],
    hints: [
      'The Anchor discriminator is the first 8 bytes of SHA256("global:<instruction_name>").',
      'Use createHash("sha256").update("global:" + name).digest().subarray(0, 8) for the discriminator.',
      'Concatenate the discriminator and args with Buffer.concat([discriminator, args]).',
    ],
    xpReward: 200,
    estimatedMinutes: 45,
  },
];
