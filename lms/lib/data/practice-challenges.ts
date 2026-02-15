import type { PracticeChallenge } from "@/types/practice";

export const PRACTICE_CHALLENGES: PracticeChallenge[] = [
  // ═══════════════════════════════════════
  // ACCOUNTS (5)
  // ═══════════════════════════════════════
  {
    id: "acc-1",
    title: "Generate a Keypair",
    description: "Create a new Solana keypair and return the public key as a base58 string.",
    difficulty: "easy",
    category: "accounts",
    language: "typescript",
    xpReward: 10,
    tags: ["keypair", "web3.js"],
    challenge: {
      language: "typescript",
      prompt: "Write a function that generates a new Solana Keypair using @solana/web3.js and returns an object with the publicKey (base58 string) and secretKey (Uint8Array).",
      starterCode: `import { Keypair } from "@solana/web3.js";

function generateKeypair(): { publicKey: string; secretKey: Uint8Array } {
  // Your code here
}`,
      solution: `import { Keypair } from "@solana/web3.js";

function generateKeypair(): { publicKey: string; secretKey: Uint8Array } {
  const keypair = Keypair.generate();
  return {
    publicKey: keypair.publicKey.toBase58(),
    secretKey: keypair.secretKey,
  };
}`,
      testCases: [
        { id: "t1", name: "Uses Keypair.generate()", input: "", expectedOutput: "" },
        { id: "t2", name: "Returns publicKey as base58", input: "", expectedOutput: "" },
        { id: "t3", name: "Returns secretKey", input: "", expectedOutput: "" },
      ],
      hints: [
        "Use Keypair.generate() to create a new random keypair",
        "Access .publicKey.toBase58() for the string representation",
        "Access .secretKey for the Uint8Array",
      ],
    },
  },
  {
    id: "acc-2",
    title: "Validate a Public Key",
    description: "Check if a given string is a valid Solana public key.",
    difficulty: "easy",
    category: "accounts",
    language: "typescript",
    xpReward: 10,
    tags: ["publickey", "validation"],
    challenge: {
      language: "typescript",
      prompt: "Write a function that takes a string and returns true if it's a valid Solana public key, false otherwise. Use a try/catch around new PublicKey().",
      starterCode: `import { PublicKey } from "@solana/web3.js";

function isValidPublicKey(address: string): boolean {
  // Your code here
}`,
      solution: `import { PublicKey } from "@solana/web3.js";

function isValidPublicKey(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}`,
      testCases: [
        { id: "t1", name: "Uses new PublicKey()", input: "", expectedOutput: "" },
        { id: "t2", name: "Returns boolean", input: "", expectedOutput: "" },
      ],
      hints: [
        "new PublicKey() throws if the string is invalid",
        "Wrap it in try/catch and return true/false",
      ],
    },
  },
  {
    id: "acc-3",
    title: "Account Info Decoder",
    description: "Parse account info and extract the owner, lamports, and data length.",
    difficulty: "medium",
    category: "accounts",
    language: "typescript",
    xpReward: 25,
    tags: ["account-info", "rpc"],
    challenge: {
      language: "typescript",
      prompt: "Write a function that takes an AccountInfo object and returns an object with owner (base58), lamports (number), and dataSize (number of bytes in the data buffer).",
      starterCode: `import { AccountInfo, PublicKey } from "@solana/web3.js";

interface AccountSummary {
  owner: string;
  lamports: number;
  dataSize: number;
}

function summarizeAccount(info: AccountInfo<Buffer>): AccountSummary {
  // Your code here
}`,
      solution: `import { AccountInfo, PublicKey } from "@solana/web3.js";

interface AccountSummary {
  owner: string;
  lamports: number;
  dataSize: number;
}

function summarizeAccount(info: AccountInfo<Buffer>): AccountSummary {
  return {
    owner: info.owner.toBase58(),
    lamports: info.lamports,
    dataSize: info.data.length,
  };
}`,
      testCases: [
        { id: "t1", name: "Extracts owner as base58", input: "", expectedOutput: "" },
        { id: "t2", name: "Extracts lamports", input: "", expectedOutput: "" },
        { id: "t3", name: "Extracts data length", input: "", expectedOutput: "" },
      ],
      hints: [
        "AccountInfo has .owner (PublicKey), .lamports (number), .data (Buffer)",
        "Use .toBase58() on the owner PublicKey",
        "Use .data.length for the data size",
      ],
    },
  },
  {
    id: "acc-4",
    title: "Calculate Rent Exemption",
    description: "Calculate the minimum rent-exempt balance for a given data size.",
    difficulty: "medium",
    category: "accounts",
    language: "typescript",
    xpReward: 25,
    tags: ["rent", "lamports"],
    challenge: {
      language: "typescript",
      prompt: "Write an async function that calculates the minimum balance needed for rent exemption for a given data size in bytes using connection.getMinimumBalanceForRentExemption().",
      starterCode: `import { Connection } from "@solana/web3.js";

async function getRentExemptBalance(connection: Connection, dataSize: number): Promise<number> {
  // Your code here
}`,
      solution: `import { Connection } from "@solana/web3.js";

async function getRentExemptBalance(connection: Connection, dataSize: number): Promise<number> {
  const lamports = await connection.getMinimumBalanceForRentExemption(dataSize);
  return lamports;
}`,
      testCases: [
        { id: "t1", name: "Calls getMinimumBalanceForRentExemption", input: "", expectedOutput: "" },
        { id: "t2", name: "Returns lamports value", input: "", expectedOutput: "" },
      ],
      hints: [
        "Use connection.getMinimumBalanceForRentExemption(dataSize)",
        "This is an async RPC call that returns a number in lamports",
      ],
    },
  },
  {
    id: "acc-5",
    title: "Account Ownership Check",
    description: "Implement a Rust function to verify account ownership in a Solana program.",
    difficulty: "hard",
    category: "accounts",
    language: "rust",
    xpReward: 50,
    tags: ["ownership", "validation", "native"],
    challenge: {
      language: "rust",
      prompt: "Write a Rust function that checks if an account is owned by the expected program. Return an error if the owner doesn't match. Use solana_program types.",
      starterCode: `use solana_program::{
    account_info::AccountInfo,
    program_error::ProgramError,
    pubkey::Pubkey,
};

pub fn verify_account_owner(
    account: &AccountInfo,
    expected_owner: &Pubkey,
) -> Result<(), ProgramError> {
    // Your code here
}`,
      solution: `use solana_program::{
    account_info::AccountInfo,
    program_error::ProgramError,
    pubkey::Pubkey,
};

pub fn verify_account_owner(
    account: &AccountInfo,
    expected_owner: &Pubkey,
) -> Result<(), ProgramError> {
    if account.owner != expected_owner {
        return Err(ProgramError::IncorrectProgramId);
    }
    Ok(())
}`,
      testCases: [
        { id: "t1", name: "Compares account.owner to expected", input: "", expectedOutput: "" },
        { id: "t2", name: "Returns ProgramError on mismatch", input: "", expectedOutput: "" },
        { id: "t3", name: "Returns Ok on match", input: "", expectedOutput: "" },
      ],
      hints: [
        "Compare account.owner with expected_owner",
        "Use ProgramError::IncorrectProgramId for the error",
        "Return Ok(()) on success",
      ],
    },
  },

  // ═══════════════════════════════════════
  // TRANSACTIONS (5)
  // ═══════════════════════════════════════
  {
    id: "tx-1",
    title: "Build a Transfer Transaction",
    description: "Create a SOL transfer transaction using SystemProgram.",
    difficulty: "easy",
    category: "transactions",
    language: "typescript",
    xpReward: 10,
    tags: ["transfer", "system-program"],
    challenge: {
      language: "typescript",
      prompt: "Write a function that creates a Transaction with a SystemProgram.transfer instruction to send lamports from one public key to another.",
      starterCode: `import { Transaction, SystemProgram, PublicKey } from "@solana/web3.js";

function createTransferTx(from: PublicKey, to: PublicKey, lamports: number): Transaction {
  // Your code here
}`,
      solution: `import { Transaction, SystemProgram, PublicKey } from "@solana/web3.js";

function createTransferTx(from: PublicKey, to: PublicKey, lamports: number): Transaction {
  return new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: from,
      toPubkey: to,
      lamports,
    })
  );
}`,
      testCases: [
        { id: "t1", name: "Creates a Transaction", input: "", expectedOutput: "" },
        { id: "t2", name: "Uses SystemProgram.transfer", input: "", expectedOutput: "" },
      ],
      hints: [
        "Use new Transaction().add(...) to build the transaction",
        "SystemProgram.transfer takes fromPubkey, toPubkey, and lamports",
      ],
    },
  },
  {
    id: "tx-2",
    title: "Get Recent Blockhash",
    description: "Fetch and return the latest blockhash from the cluster.",
    difficulty: "easy",
    category: "transactions",
    language: "typescript",
    xpReward: 10,
    tags: ["blockhash", "rpc"],
    challenge: {
      language: "typescript",
      prompt: "Write an async function that gets the latest blockhash from a connection and returns just the blockhash string.",
      starterCode: `import { Connection } from "@solana/web3.js";

async function getBlockhash(connection: Connection): Promise<string> {
  // Your code here
}`,
      solution: `import { Connection } from "@solana/web3.js";

async function getBlockhash(connection: Connection): Promise<string> {
  const { blockhash } = await connection.getLatestBlockhash();
  return blockhash;
}`,
      testCases: [
        { id: "t1", name: "Calls getLatestBlockhash", input: "", expectedOutput: "" },
        { id: "t2", name: "Returns blockhash string", input: "", expectedOutput: "" },
      ],
      hints: [
        "Use connection.getLatestBlockhash() — it's async",
        "Destructure { blockhash } from the result",
      ],
    },
  },
  {
    id: "tx-3",
    title: "Multi-Instruction Transaction",
    description: "Build a transaction with multiple instructions.",
    difficulty: "medium",
    category: "transactions",
    language: "typescript",
    xpReward: 25,
    tags: ["multi-ix", "transaction"],
    challenge: {
      language: "typescript",
      prompt: "Write a function that creates a single transaction with two SystemProgram.transfer instructions — one sending to recipient1 and one sending to recipient2.",
      starterCode: `import { Transaction, SystemProgram, PublicKey } from "@solana/web3.js";

function createMultiTransferTx(
  from: PublicKey,
  recipient1: PublicKey,
  recipient2: PublicKey,
  amount1: number,
  amount2: number,
): Transaction {
  // Your code here
}`,
      solution: `import { Transaction, SystemProgram, PublicKey } from "@solana/web3.js";

function createMultiTransferTx(
  from: PublicKey,
  recipient1: PublicKey,
  recipient2: PublicKey,
  amount1: number,
  amount2: number,
): Transaction {
  return new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: from,
      toPubkey: recipient1,
      lamports: amount1,
    }),
    SystemProgram.transfer({
      fromPubkey: from,
      toPubkey: recipient2,
      lamports: amount2,
    })
  );
}`,
      testCases: [
        { id: "t1", name: "Creates Transaction with .add()", input: "", expectedOutput: "" },
        { id: "t2", name: "Includes two SystemProgram.transfer calls", input: "", expectedOutput: "" },
      ],
      hints: [
        "You can pass multiple instructions to .add()",
        "Each transfer needs its own fromPubkey, toPubkey, lamports",
      ],
    },
  },
  {
    id: "tx-4",
    title: "Send and Confirm Transaction",
    description: "Send a signed transaction and wait for confirmation.",
    difficulty: "medium",
    category: "transactions",
    language: "typescript",
    xpReward: 25,
    tags: ["send", "confirm"],
    challenge: {
      language: "typescript",
      prompt: "Write an async function that sends a SOL transfer and confirms it using sendAndConfirmTransaction. Return the transaction signature.",
      starterCode: `import { Connection, Keypair, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction } from "@solana/web3.js";

async function transferSOL(
  connection: Connection,
  sender: Keypair,
  recipient: PublicKey,
  lamports: number,
): Promise<string> {
  // Your code here
}`,
      solution: `import { Connection, Keypair, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction } from "@solana/web3.js";

async function transferSOL(
  connection: Connection,
  sender: Keypair,
  recipient: PublicKey,
  lamports: number,
): Promise<string> {
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: sender.publicKey,
      toPubkey: recipient,
      lamports,
    })
  );
  const signature = await sendAndConfirmTransaction(connection, tx, [sender]);
  return signature;
}`,
      testCases: [
        { id: "t1", name: "Builds transfer transaction", input: "", expectedOutput: "" },
        { id: "t2", name: "Uses sendAndConfirmTransaction", input: "", expectedOutput: "" },
        { id: "t3", name: "Returns signature string", input: "", expectedOutput: "" },
      ],
      hints: [
        "Build the transaction with SystemProgram.transfer",
        "sendAndConfirmTransaction(connection, tx, [signerKeypair]) returns a signature",
      ],
    },
  },
  {
    id: "tx-5",
    title: "Instruction Data Encoding",
    description: "Manually encode instruction data using a buffer for a native program.",
    difficulty: "hard",
    category: "transactions",
    language: "typescript",
    xpReward: 50,
    tags: ["instruction", "buffer", "encoding"],
    challenge: {
      language: "typescript",
      prompt: "Write a function that creates a TransactionInstruction with manually encoded data: a 1-byte instruction index followed by a u64 amount in little-endian. This simulates how native programs encode instruction data.",
      starterCode: `import { TransactionInstruction, PublicKey } from "@solana/web3.js";

function createCustomInstruction(
  programId: PublicKey,
  accounts: { pubkey: PublicKey; isSigner: boolean; isWritable: boolean }[],
  instructionIndex: number,
  amount: bigint,
): TransactionInstruction {
  // Your code here
}`,
      solution: `import { TransactionInstruction, PublicKey } from "@solana/web3.js";

function createCustomInstruction(
  programId: PublicKey,
  accounts: { pubkey: PublicKey; isSigner: boolean; isWritable: boolean }[],
  instructionIndex: number,
  amount: bigint,
): TransactionInstruction {
  const data = Buffer.alloc(9);
  data.writeUInt8(instructionIndex, 0);
  data.writeBigUInt64LE(amount, 1);
  return new TransactionInstruction({
    keys: accounts,
    programId,
    data,
  });
}`,
      testCases: [
        { id: "t1", name: "Creates Buffer with correct size", input: "", expectedOutput: "" },
        { id: "t2", name: "Writes instruction index byte", input: "", expectedOutput: "" },
        { id: "t3", name: "Writes u64 in little-endian", input: "", expectedOutput: "" },
      ],
      hints: [
        "Buffer.alloc(9) for 1 byte index + 8 byte u64",
        "writeUInt8 for the instruction index at offset 0",
        "writeBigUInt64LE for the amount at offset 1",
      ],
    },
  },

  // ═══════════════════════════════════════
  // PDAs (5)
  // ═══════════════════════════════════════
  {
    id: "pda-1",
    title: "Derive a Basic PDA",
    description: "Derive a Program Derived Address from a single string seed.",
    difficulty: "easy",
    category: "pdas",
    language: "typescript",
    xpReward: 10,
    tags: ["pda", "seeds"],
    challenge: {
      language: "typescript",
      prompt: "Write a function that derives a PDA using PublicKey.findProgramAddressSync with a single string seed (\"vault\"). Return both the address and bump.",
      starterCode: `import { PublicKey } from "@solana/web3.js";

function deriveVaultPda(programId: PublicKey): { address: PublicKey; bump: number } {
  // Your code here
}`,
      solution: `import { PublicKey } from "@solana/web3.js";

function deriveVaultPda(programId: PublicKey): { address: PublicKey; bump: number } {
  const [address, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault")],
    programId,
  );
  return { address, bump };
}`,
      testCases: [
        { id: "t1", name: "Uses findProgramAddressSync", input: "", expectedOutput: "" },
        { id: "t2", name: "Uses Buffer.from for seed", input: "", expectedOutput: "" },
        { id: "t3", name: "Returns address and bump", input: "", expectedOutput: "" },
      ],
      hints: [
        "PublicKey.findProgramAddressSync(seeds, programId) returns [PublicKey, number]",
        "Seeds must be Buffer/Uint8Array — use Buffer.from(\"vault\")",
      ],
    },
  },
  {
    id: "pda-2",
    title: "PDA with User Seed",
    description: "Derive a PDA using both a string seed and a user's public key.",
    difficulty: "easy",
    category: "pdas",
    language: "typescript",
    xpReward: 10,
    tags: ["pda", "seeds", "user"],
    challenge: {
      language: "typescript",
      prompt: "Write a function that derives a PDA with seeds [\"profile\", userPubkey.toBuffer()]. Return the address and bump.",
      starterCode: `import { PublicKey } from "@solana/web3.js";

function deriveProfilePda(user: PublicKey, programId: PublicKey): { address: PublicKey; bump: number } {
  // Your code here
}`,
      solution: `import { PublicKey } from "@solana/web3.js";

function deriveProfilePda(user: PublicKey, programId: PublicKey): { address: PublicKey; bump: number } {
  const [address, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("profile"), user.toBuffer()],
    programId,
  );
  return { address, bump };
}`,
      testCases: [
        { id: "t1", name: "Uses findProgramAddressSync", input: "", expectedOutput: "" },
        { id: "t2", name: "Seeds include Buffer.from and toBuffer", input: "", expectedOutput: "" },
      ],
      hints: [
        "Combine multiple seeds: [Buffer.from(\"profile\"), user.toBuffer()]",
        "toBuffer() converts a PublicKey to a 32-byte Buffer",
      ],
    },
  },
  {
    id: "pda-3",
    title: "PDA with Numeric Seed",
    description: "Derive a PDA that includes a numeric ID as a seed.",
    difficulty: "medium",
    category: "pdas",
    language: "typescript",
    xpReward: 25,
    tags: ["pda", "numeric-seed"],
    challenge: {
      language: "typescript",
      prompt: "Write a function that derives a PDA with seeds [\"order\", u32 orderId as little-endian bytes]. Use a 4-byte buffer for the number.",
      starterCode: `import { PublicKey } from "@solana/web3.js";

function deriveOrderPda(orderId: number, programId: PublicKey): { address: PublicKey; bump: number } {
  // Your code here
}`,
      solution: `import { PublicKey } from "@solana/web3.js";

function deriveOrderPda(orderId: number, programId: PublicKey): { address: PublicKey; bump: number } {
  const orderIdBuffer = Buffer.alloc(4);
  orderIdBuffer.writeUInt32LE(orderId);
  const [address, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("order"), orderIdBuffer],
    programId,
  );
  return { address, bump };
}`,
      testCases: [
        { id: "t1", name: "Creates a 4-byte buffer for orderId", input: "", expectedOutput: "" },
        { id: "t2", name: "Uses findProgramAddressSync", input: "", expectedOutput: "" },
        { id: "t3", name: "Returns address and bump", input: "", expectedOutput: "" },
      ],
      hints: [
        "Buffer.alloc(4) creates a 4-byte buffer",
        "writeUInt32LE writes the number in little-endian format",
        "Pass the buffer as a seed alongside the string seed",
      ],
    },
  },
  {
    id: "pda-4",
    title: "Verify PDA On-Chain",
    description: "Verify a PDA matches expected seeds and bump in a Rust program.",
    difficulty: "medium",
    category: "pdas",
    language: "rust",
    xpReward: 25,
    tags: ["pda", "verification", "native"],
    challenge: {
      language: "rust",
      prompt: "Write a Rust function that verifies a PDA by re-deriving it with Pubkey::create_program_address using the provided seeds and bump, then comparing to the expected key.",
      starterCode: `use solana_program::{
    program_error::ProgramError,
    pubkey::Pubkey,
};

pub fn verify_pda(
    expected_key: &Pubkey,
    seeds: &[&[u8]],
    bump: u8,
    program_id: &Pubkey,
) -> Result<(), ProgramError> {
    // Your code here
}`,
      solution: `use solana_program::{
    program_error::ProgramError,
    pubkey::Pubkey,
};

pub fn verify_pda(
    expected_key: &Pubkey,
    seeds: &[&[u8]],
    bump: u8,
    program_id: &Pubkey,
) -> Result<(), ProgramError> {
    let bump_seed = [bump];
    let mut seeds_with_bump = seeds.to_vec();
    seeds_with_bump.push(&bump_seed);
    let derived = Pubkey::create_program_address(&seeds_with_bump, program_id)
        .map_err(|_| ProgramError::InvalidSeeds)?;
    if derived != *expected_key {
        return Err(ProgramError::InvalidSeeds);
    }
    Ok(())
}`,
      testCases: [
        { id: "t1", name: "Uses Pubkey::create_program_address", input: "", expectedOutput: "" },
        { id: "t2", name: "Appends bump to seeds", input: "", expectedOutput: "" },
        { id: "t3", name: "Compares derived key to expected", input: "", expectedOutput: "" },
      ],
      hints: [
        "Append the bump byte as a single-element slice to the seeds",
        "Pubkey::create_program_address returns Result<Pubkey, PubkeyError>",
        "Compare the derived address against expected_key",
      ],
    },
  },
  {
    id: "pda-5",
    title: "Multi-Seed PDA Derivation",
    description: "Derive a complex PDA with string, pubkey, and u64 seeds.",
    difficulty: "hard",
    category: "pdas",
    language: "typescript",
    xpReward: 50,
    tags: ["pda", "complex-seeds"],
    challenge: {
      language: "typescript",
      prompt: "Write a function that derives a PDA with seeds [\"escrow\", sellerPubkey.toBuffer(), u64 amount as 8-byte LE buffer]. Return address, bump, and the seeds array for later CPI use.",
      starterCode: `import { PublicKey } from "@solana/web3.js";

function deriveEscrowPda(
  seller: PublicKey,
  amount: bigint,
  programId: PublicKey,
): { address: PublicKey; bump: number; seeds: Buffer[] } {
  // Your code here
}`,
      solution: `import { PublicKey } from "@solana/web3.js";

function deriveEscrowPda(
  seller: PublicKey,
  amount: bigint,
  programId: PublicKey,
): { address: PublicKey; bump: number; seeds: Buffer[] } {
  const amountBuffer = Buffer.alloc(8);
  amountBuffer.writeBigUInt64LE(amount);
  const seeds = [Buffer.from("escrow"), seller.toBuffer(), amountBuffer];
  const [address, bump] = PublicKey.findProgramAddressSync(seeds, programId);
  return { address, bump, seeds };
}`,
      testCases: [
        { id: "t1", name: "Creates 8-byte buffer for amount", input: "", expectedOutput: "" },
        { id: "t2", name: "Uses findProgramAddressSync with 3 seeds", input: "", expectedOutput: "" },
        { id: "t3", name: "Returns seeds array for CPI", input: "", expectedOutput: "" },
      ],
      hints: [
        "Buffer.alloc(8) for a u64 value",
        "writeBigUInt64LE writes a BigInt as little-endian bytes",
        "Store the seeds array so it can be reused for CPI signing",
      ],
    },
  },

  // ═══════════════════════════════════════
  // TOKENS (5)
  // ═══════════════════════════════════════
  {
    id: "tok-1",
    title: "Create Mint Account",
    description: "Build the instruction to create an SPL Token mint.",
    difficulty: "easy",
    category: "tokens",
    language: "typescript",
    xpReward: 10,
    tags: ["spl-token", "mint"],
    challenge: {
      language: "typescript",
      prompt: "Write a function that returns the parameters needed to create a new SPL token mint: decimals, mintAuthority, and freezeAuthority (null). Return them as an object.",
      starterCode: `import { PublicKey } from "@solana/web3.js";

interface MintConfig {
  decimals: number;
  mintAuthority: PublicKey;
  freezeAuthority: PublicKey | null;
}

function createMintConfig(authority: PublicKey, decimals: number): MintConfig {
  // Your code here
}`,
      solution: `import { PublicKey } from "@solana/web3.js";

interface MintConfig {
  decimals: number;
  mintAuthority: PublicKey;
  freezeAuthority: PublicKey | null;
}

function createMintConfig(authority: PublicKey, decimals: number): MintConfig {
  return {
    decimals,
    mintAuthority: authority,
    freezeAuthority: null,
  };
}`,
      testCases: [
        { id: "t1", name: "Returns correct decimals", input: "", expectedOutput: "" },
        { id: "t2", name: "Sets mintAuthority", input: "", expectedOutput: "" },
        { id: "t3", name: "Sets freezeAuthority to null", input: "", expectedOutput: "" },
      ],
      hints: [
        "Simply return an object with the three fields",
        "freezeAuthority should be null to disable freezing",
      ],
    },
  },
  {
    id: "tok-2",
    title: "Derive Associated Token Address",
    description: "Find the Associated Token Account address for a wallet and mint.",
    difficulty: "easy",
    category: "tokens",
    language: "typescript",
    xpReward: 10,
    tags: ["ata", "spl-token"],
    challenge: {
      language: "typescript",
      prompt: "Write a function that derives the Associated Token Account address for a given wallet and mint using PublicKey.findProgramAddressSync with the standard ATA seeds.",
      starterCode: `import { PublicKey } from "@solana/web3.js";

const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

function getATAAddress(wallet: PublicKey, mint: PublicKey): PublicKey {
  // Your code here
}`,
      solution: `import { PublicKey } from "@solana/web3.js";

const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

function getATAAddress(wallet: PublicKey, mint: PublicKey): PublicKey {
  const [address] = PublicKey.findProgramAddressSync(
    [wallet.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );
  return address;
}`,
      testCases: [
        { id: "t1", name: "Uses findProgramAddressSync", input: "", expectedOutput: "" },
        { id: "t2", name: "Uses correct ATA seeds", input: "", expectedOutput: "" },
      ],
      hints: [
        "ATA seeds are: [wallet, TOKEN_PROGRAM_ID, mint]",
        "The program ID for derivation is ASSOCIATED_TOKEN_PROGRAM_ID",
      ],
    },
  },
  {
    id: "tok-3",
    title: "Token Balance Formatter",
    description: "Convert raw token amount to human-readable format using decimals.",
    difficulty: "medium",
    category: "tokens",
    language: "typescript",
    xpReward: 25,
    tags: ["token-amount", "decimals"],
    challenge: {
      language: "typescript",
      prompt: "Write a function that converts a raw token amount (bigint) to a human-readable decimal string given the token's decimals. For example, 1000000n with 6 decimals = \"1.000000\".",
      starterCode: `function formatTokenAmount(rawAmount: bigint, decimals: number): string {
  // Your code here
}`,
      solution: `function formatTokenAmount(rawAmount: bigint, decimals: number): string {
  const divisor = BigInt(10 ** decimals);
  const whole = rawAmount / divisor;
  const fraction = rawAmount % divisor;
  const fractionStr = fraction.toString().padStart(decimals, "0");
  return \`\${whole}.\${fractionStr}\`;
}`,
      testCases: [
        { id: "t1", name: "Handles whole and fractional parts", input: "", expectedOutput: "" },
        { id: "t2", name: "Pads fraction with leading zeros", input: "", expectedOutput: "" },
        { id: "t3", name: "Returns correct decimal string", input: "", expectedOutput: "" },
      ],
      hints: [
        "Divide by 10^decimals for the whole part",
        "Use modulo for the fractional part",
        "padStart to ensure correct number of decimal places",
      ],
    },
  },
  {
    id: "tok-4",
    title: "SPL Token Transfer Instruction",
    description: "Build an SPL Token transfer instruction.",
    difficulty: "medium",
    category: "tokens",
    language: "rust",
    xpReward: 25,
    tags: ["spl-token", "transfer", "cpi"],
    challenge: {
      language: "rust",
      prompt: "Write a Rust function that creates an SPL Token transfer instruction using spl_token::instruction::transfer. Return the Instruction struct.",
      starterCode: `use solana_program::{
    instruction::Instruction,
    pubkey::Pubkey,
};

pub fn create_token_transfer_ix(
    source: &Pubkey,
    destination: &Pubkey,
    authority: &Pubkey,
    amount: u64,
) -> Instruction {
    // Your code here
}`,
      solution: `use solana_program::{
    instruction::Instruction,
    pubkey::Pubkey,
};

pub fn create_token_transfer_ix(
    source: &Pubkey,
    destination: &Pubkey,
    authority: &Pubkey,
    amount: u64,
) -> Instruction {
    spl_token::instruction::transfer(
        &spl_token::id(),
        source,
        destination,
        authority,
        &[],
        amount,
    )
    .unwrap()
}`,
      testCases: [
        { id: "t1", name: "Uses spl_token::instruction::transfer", input: "", expectedOutput: "" },
        { id: "t2", name: "Passes correct arguments", input: "", expectedOutput: "" },
      ],
      hints: [
        "spl_token::instruction::transfer takes (token_program, source, dest, authority, signers, amount)",
        "Use spl_token::id() for the token program ID",
        "Pass empty slice &[] for multisig signers",
      ],
    },
  },
  {
    id: "tok-5",
    title: "Token-2022 NonTransferable Mint",
    description: "Configure a Token-2022 mint with the NonTransferable extension.",
    difficulty: "hard",
    category: "tokens",
    language: "rust",
    xpReward: 50,
    tags: ["token-2022", "extensions", "soulbound"],
    challenge: {
      language: "rust",
      prompt: "Write a Rust struct and impl for a soulbound token configuration. The struct should hold mint authority, decimals, and a flag for non-transferable. Implement a method to validate the config.",
      starterCode: `pub struct SoulboundMintConfig {
    // Your fields here
}

impl SoulboundMintConfig {
    pub fn new(mint_authority: [u8; 32], decimals: u8) -> Self {
        // Your code here
    }

    pub fn is_valid(&self) -> bool {
        // Your code here
    }
}`,
      solution: `pub struct SoulboundMintConfig {
    pub mint_authority: [u8; 32],
    pub decimals: u8,
    pub non_transferable: bool,
}

impl SoulboundMintConfig {
    pub fn new(mint_authority: [u8; 32], decimals: u8) -> Self {
        Self {
            mint_authority,
            decimals,
            non_transferable: true,
        }
    }

    pub fn is_valid(&self) -> bool {
        self.non_transferable && self.decimals <= 9
    }
}`,
      testCases: [
        { id: "t1", name: "Defines struct with required fields", input: "", expectedOutput: "" },
        { id: "t2", name: "new() sets non_transferable to true", input: "", expectedOutput: "" },
        { id: "t3", name: "is_valid checks non_transferable", input: "", expectedOutput: "" },
      ],
      hints: [
        "Soulbound tokens must always be non-transferable",
        "Store mint_authority, decimals, and non_transferable fields",
        "is_valid should check that non_transferable is true",
      ],
    },
  },

  // ═══════════════════════════════════════
  // CPI (5)
  // ═══════════════════════════════════════
  {
    id: "cpi-1",
    title: "System Program CPI Transfer",
    description: "Invoke the System Program to transfer SOL via CPI.",
    difficulty: "easy",
    category: "cpi",
    language: "rust",
    xpReward: 10,
    tags: ["cpi", "system-program", "transfer"],
    challenge: {
      language: "rust",
      prompt: "Write a Rust function that performs a CPI to transfer SOL using system_program::transfer and invoke.",
      starterCode: `use solana_program::{
    account_info::AccountInfo,
    entrypoint::ProgramResult,
    program::invoke,
    system_instruction,
};

pub fn transfer_sol<'a>(
    from: &AccountInfo<'a>,
    to: &AccountInfo<'a>,
    system_program: &AccountInfo<'a>,
    amount: u64,
) -> ProgramResult {
    // Your code here
}`,
      solution: `use solana_program::{
    account_info::AccountInfo,
    entrypoint::ProgramResult,
    program::invoke,
    system_instruction,
};

pub fn transfer_sol<'a>(
    from: &AccountInfo<'a>,
    to: &AccountInfo<'a>,
    system_program: &AccountInfo<'a>,
    amount: u64,
) -> ProgramResult {
    invoke(
        &system_instruction::transfer(from.key, to.key, amount),
        &[from.clone(), to.clone(), system_program.clone()],
    )
}`,
      testCases: [
        { id: "t1", name: "Uses system_instruction::transfer", input: "", expectedOutput: "" },
        { id: "t2", name: "Calls invoke with correct accounts", input: "", expectedOutput: "" },
      ],
      hints: [
        "system_instruction::transfer(from_pubkey, to_pubkey, lamports) creates the instruction",
        "invoke(&instruction, &[accounts...]) executes the CPI",
        "Pass from, to, and system_program as account infos",
      ],
    },
  },
  {
    id: "cpi-2",
    title: "CPI with PDA Signer",
    description: "Perform a CPI signed by a PDA using invoke_signed.",
    difficulty: "medium",
    category: "cpi",
    language: "rust",
    xpReward: 25,
    tags: ["cpi", "pda-signer", "invoke-signed"],
    challenge: {
      language: "rust",
      prompt: "Write a Rust function that transfers SOL from a PDA to a recipient using invoke_signed. The PDA is derived from seeds [\"vault\"] with a bump.",
      starterCode: `use solana_program::{
    account_info::AccountInfo,
    entrypoint::ProgramResult,
    program::invoke_signed,
    system_instruction,
};

pub fn transfer_from_pda<'a>(
    pda: &AccountInfo<'a>,
    recipient: &AccountInfo<'a>,
    system_program: &AccountInfo<'a>,
    amount: u64,
    bump: u8,
) -> ProgramResult {
    // Your code here
}`,
      solution: `use solana_program::{
    account_info::AccountInfo,
    entrypoint::ProgramResult,
    program::invoke_signed,
    system_instruction,
};

pub fn transfer_from_pda<'a>(
    pda: &AccountInfo<'a>,
    recipient: &AccountInfo<'a>,
    system_program: &AccountInfo<'a>,
    amount: u64,
    bump: u8,
) -> ProgramResult {
    invoke_signed(
        &system_instruction::transfer(pda.key, recipient.key, amount),
        &[pda.clone(), recipient.clone(), system_program.clone()],
        &[&[b"vault", &[bump]]],
    )
}`,
      testCases: [
        { id: "t1", name: "Uses invoke_signed", input: "", expectedOutput: "" },
        { id: "t2", name: "Passes signer seeds with bump", input: "", expectedOutput: "" },
        { id: "t3", name: "Creates system_instruction::transfer", input: "", expectedOutput: "" },
      ],
      hints: [
        "invoke_signed is like invoke but with signer_seeds parameter",
        "Signer seeds: &[&[b\"vault\", &[bump]]]",
        "The bump byte must be the last seed",
      ],
    },
  },
  {
    id: "cpi-3",
    title: "CPI Account Validation",
    description: "Validate accounts before performing a CPI call.",
    difficulty: "easy",
    category: "cpi",
    language: "rust",
    xpReward: 10,
    tags: ["cpi", "validation"],
    challenge: {
      language: "rust",
      prompt: "Write a function that validates the system program account before a CPI. Check that the account key matches the known system program ID.",
      starterCode: `use solana_program::{
    account_info::AccountInfo,
    program_error::ProgramError,
    system_program,
};

pub fn validate_system_program(account: &AccountInfo) -> Result<(), ProgramError> {
    // Your code here
}`,
      solution: `use solana_program::{
    account_info::AccountInfo,
    program_error::ProgramError,
    system_program,
};

pub fn validate_system_program(account: &AccountInfo) -> Result<(), ProgramError> {
    if account.key != &system_program::id() {
        return Err(ProgramError::IncorrectProgramId);
    }
    Ok(())
}`,
      testCases: [
        { id: "t1", name: "Compares key to system_program::id()", input: "", expectedOutput: "" },
        { id: "t2", name: "Returns error on mismatch", input: "", expectedOutput: "" },
      ],
      hints: [
        "Use system_program::id() to get the expected program ID",
        "Compare with account.key (which is a &Pubkey)",
      ],
    },
  },
  {
    id: "cpi-4",
    title: "Token Mint CPI",
    description: "Invoke SPL Token program to mint tokens to an account via CPI.",
    difficulty: "medium",
    category: "cpi",
    language: "rust",
    xpReward: 25,
    tags: ["cpi", "spl-token", "mint-to"],
    challenge: {
      language: "rust",
      prompt: "Write a Rust function that mints tokens by calling spl_token::instruction::mint_to and invoking the instruction via CPI.",
      starterCode: `use solana_program::{
    account_info::AccountInfo,
    entrypoint::ProgramResult,
    program::invoke,
};

pub fn mint_tokens<'a>(
    mint: &AccountInfo<'a>,
    destination: &AccountInfo<'a>,
    authority: &AccountInfo<'a>,
    token_program: &AccountInfo<'a>,
    amount: u64,
) -> ProgramResult {
    // Your code here
}`,
      solution: `use solana_program::{
    account_info::AccountInfo,
    entrypoint::ProgramResult,
    program::invoke,
};

pub fn mint_tokens<'a>(
    mint: &AccountInfo<'a>,
    destination: &AccountInfo<'a>,
    authority: &AccountInfo<'a>,
    token_program: &AccountInfo<'a>,
    amount: u64,
) -> ProgramResult {
    invoke(
        &spl_token::instruction::mint_to(
            token_program.key,
            mint.key,
            destination.key,
            authority.key,
            &[],
            amount,
        )?,
        &[mint.clone(), destination.clone(), authority.clone(), token_program.clone()],
    )
}`,
      testCases: [
        { id: "t1", name: "Uses spl_token::instruction::mint_to", input: "", expectedOutput: "" },
        { id: "t2", name: "Invokes with all required accounts", input: "", expectedOutput: "" },
      ],
      hints: [
        "spl_token::instruction::mint_to returns a Result<Instruction>",
        "Use ? to unwrap it, then pass to invoke",
        "Include mint, destination, authority, and token_program in accounts",
      ],
    },
  },
  {
    id: "cpi-5",
    title: "Cross-Program Return Data",
    description: "Read return data from a CPI call in a Solana program.",
    difficulty: "hard",
    category: "cpi",
    language: "rust",
    xpReward: 50,
    tags: ["cpi", "return-data", "advanced"],
    challenge: {
      language: "rust",
      prompt: "Write a Rust function that invokes a program via CPI and reads the return data using sol_get_return_data. Parse the returned bytes as a u64.",
      starterCode: `use solana_program::{
    account_info::AccountInfo,
    entrypoint::ProgramResult,
    instruction::Instruction,
    program::{invoke, get_return_data},
    program_error::ProgramError,
    pubkey::Pubkey,
};

pub fn invoke_and_read_u64(
    instruction: &Instruction,
    accounts: &[AccountInfo],
    expected_program: &Pubkey,
) -> Result<u64, ProgramError> {
    // Your code here
}`,
      solution: `use solana_program::{
    account_info::AccountInfo,
    entrypoint::ProgramResult,
    instruction::Instruction,
    program::{invoke, get_return_data},
    program_error::ProgramError,
    pubkey::Pubkey,
};

pub fn invoke_and_read_u64(
    instruction: &Instruction,
    accounts: &[AccountInfo],
    expected_program: &Pubkey,
) -> Result<u64, ProgramError> {
    invoke(instruction, accounts)?;
    let (program_id, data) = get_return_data().ok_or(ProgramError::InvalidInstructionData)?;
    if &program_id != expected_program {
        return Err(ProgramError::IncorrectProgramId);
    }
    if data.len() < 8 {
        return Err(ProgramError::InvalidInstructionData);
    }
    let value = u64::from_le_bytes(data[..8].try_into().unwrap());
    Ok(value)
}`,
      testCases: [
        { id: "t1", name: "Calls invoke then get_return_data", input: "", expectedOutput: "" },
        { id: "t2", name: "Validates returned program_id", input: "", expectedOutput: "" },
        { id: "t3", name: "Parses u64 from bytes", input: "", expectedOutput: "" },
      ],
      hints: [
        "Call invoke first, then get_return_data()",
        "get_return_data() returns Option<(Pubkey, Vec<u8>)>",
        "Parse the first 8 bytes as u64 with from_le_bytes",
      ],
    },
  },

  // ═══════════════════════════════════════
  // SERIALIZATION (5)
  // ═══════════════════════════════════════
  {
    id: "ser-1",
    title: "Borsh Serialize a Struct",
    description: "Define a Rust struct with Borsh serialization.",
    difficulty: "easy",
    category: "serialization",
    language: "rust",
    xpReward: 10,
    tags: ["borsh", "serialize"],
    challenge: {
      language: "rust",
      prompt: "Define a Rust struct called GameState with fields: player (Pubkey as [u8;32]), score (u64), and level (u8). Derive BorshSerialize and BorshDeserialize.",
      starterCode: `use borsh::{BorshDeserialize, BorshSerialize};

// Define GameState struct here`,
      solution: `use borsh::{BorshDeserialize, BorshSerialize};

#[derive(BorshSerialize, BorshDeserialize)]
pub struct GameState {
    pub player: [u8; 32],
    pub score: u64,
    pub level: u8,
}`,
      testCases: [
        { id: "t1", name: "Defines struct GameState", input: "", expectedOutput: "" },
        { id: "t2", name: "Derives BorshSerialize and BorshDeserialize", input: "", expectedOutput: "" },
        { id: "t3", name: "Has correct fields", input: "", expectedOutput: "" },
      ],
      hints: [
        "Use #[derive(BorshSerialize, BorshDeserialize)]",
        "Store Pubkey as [u8; 32] for Borsh compatibility",
        "Fields: player, score, level with correct types",
      ],
    },
  },
  {
    id: "ser-2",
    title: "Decode Account Data",
    description: "Deserialize account data from a Buffer in TypeScript.",
    difficulty: "easy",
    category: "serialization",
    language: "typescript",
    xpReward: 10,
    tags: ["deserialize", "buffer"],
    challenge: {
      language: "typescript",
      prompt: "Write a function that reads a simple counter account: first 8 bytes are a u64 count (little-endian), next 32 bytes are the authority pubkey. Return both values.",
      starterCode: `import { PublicKey } from "@solana/web3.js";

interface CounterData {
  count: bigint;
  authority: PublicKey;
}

function decodeCounter(data: Buffer): CounterData {
  // Your code here
}`,
      solution: `import { PublicKey } from "@solana/web3.js";

interface CounterData {
  count: bigint;
  authority: PublicKey;
}

function decodeCounter(data: Buffer): CounterData {
  const count = data.readBigUInt64LE(0);
  const authority = new PublicKey(data.subarray(8, 40));
  return { count, authority };
}`,
      testCases: [
        { id: "t1", name: "Reads u64 count from offset 0", input: "", expectedOutput: "" },
        { id: "t2", name: "Reads PublicKey from offset 8", input: "", expectedOutput: "" },
        { id: "t3", name: "Returns CounterData object", input: "", expectedOutput: "" },
      ],
      hints: [
        "readBigUInt64LE(0) reads 8 bytes as u64",
        "subarray(8, 40) gets the next 32 bytes for the pubkey",
        "new PublicKey(bytes) constructs a PublicKey from 32 bytes",
      ],
    },
  },
  {
    id: "ser-3",
    title: "Encode Instruction Data",
    description: "Serialize instruction data with a discriminator and parameters.",
    difficulty: "medium",
    category: "serialization",
    language: "typescript",
    xpReward: 25,
    tags: ["serialize", "instruction-data"],
    challenge: {
      language: "typescript",
      prompt: "Write a function that encodes instruction data for an 'initialize' instruction: 1-byte discriminator (0), followed by a u16 max_supply (LE), followed by a u8 decimals.",
      starterCode: `function encodeInitializeData(maxSupply: number, decimals: number): Buffer {
  // Your code here
}`,
      solution: `function encodeInitializeData(maxSupply: number, decimals: number): Buffer {
  const data = Buffer.alloc(4);
  data.writeUInt8(0, 0);
  data.writeUInt16LE(maxSupply, 1);
  data.writeUInt8(decimals, 3);
  return data;
}`,
      testCases: [
        { id: "t1", name: "Allocates correct buffer size", input: "", expectedOutput: "" },
        { id: "t2", name: "Writes discriminator at offset 0", input: "", expectedOutput: "" },
        { id: "t3", name: "Writes u16 and u8 at correct offsets", input: "", expectedOutput: "" },
      ],
      hints: [
        "Total size: 1 (discriminator) + 2 (u16) + 1 (u8) = 4 bytes",
        "writeUInt8 for single byte values",
        "writeUInt16LE for 2-byte little-endian values",
      ],
    },
  },
  {
    id: "ser-4",
    title: "Borsh Enum Serialization",
    description: "Define and serialize a Rust enum with variants using Borsh.",
    difficulty: "medium",
    category: "serialization",
    language: "rust",
    xpReward: 25,
    tags: ["borsh", "enum"],
    challenge: {
      language: "rust",
      prompt: "Define a Borsh-serializable Rust enum called Instruction with variants: Initialize (no data), Deposit { amount: u64 }, and Withdraw { amount: u64, recipient: [u8; 32] }.",
      starterCode: `use borsh::{BorshDeserialize, BorshSerialize};

// Define Instruction enum here`,
      solution: `use borsh::{BorshDeserialize, BorshSerialize};

#[derive(BorshSerialize, BorshDeserialize)]
pub enum Instruction {
    Initialize,
    Deposit { amount: u64 },
    Withdraw { amount: u64, recipient: [u8; 32] },
}`,
      testCases: [
        { id: "t1", name: "Defines enum Instruction", input: "", expectedOutput: "" },
        { id: "t2", name: "Has three variants", input: "", expectedOutput: "" },
        { id: "t3", name: "Derives Borsh traits", input: "", expectedOutput: "" },
      ],
      hints: [
        "Use #[derive(BorshSerialize, BorshDeserialize)] on the enum",
        "Borsh enums use a u8 variant index automatically",
        "Named fields in variants work like struct fields",
      ],
    },
  },
  {
    id: "ser-5",
    title: "Zero-Copy Account Parsing",
    description: "Implement zero-copy deserialization for a large account.",
    difficulty: "hard",
    category: "serialization",
    language: "rust",
    xpReward: 50,
    tags: ["zero-copy", "bytemuck", "performance"],
    challenge: {
      language: "rust",
      prompt: "Define a zero-copy struct using #[repr(C)] and bytemuck derives for an order book entry: price (u64), quantity (u64), owner ([u8;32]), and timestamp (i64). Implement a method to check if the order is expired.",
      starterCode: `// Define OrderEntry as a zero-copy struct
// Implement is_expired method`,
      solution: `#[repr(C)]
#[derive(Clone, Copy)]
pub struct OrderEntry {
    pub price: u64,
    pub quantity: u64,
    pub owner: [u8; 32],
    pub timestamp: i64,
}

impl OrderEntry {
    pub fn is_expired(&self, current_time: i64, ttl_seconds: i64) -> bool {
        current_time > self.timestamp + ttl_seconds
    }
}`,
      testCases: [
        { id: "t1", name: "Uses #[repr(C)] for zero-copy layout", input: "", expectedOutput: "" },
        { id: "t2", name: "Defines all required fields", input: "", expectedOutput: "" },
        { id: "t3", name: "Implements is_expired method", input: "", expectedOutput: "" },
      ],
      hints: [
        "#[repr(C)] ensures C-compatible memory layout",
        "Zero-copy structs need Clone + Copy",
        "is_expired compares current_time > timestamp + ttl_seconds",
      ],
    },
  },

  // ═══════════════════════════════════════
  // SECURITY (5)
  // ═══════════════════════════════════════
  {
    id: "sec-1",
    title: "Signer Verification",
    description: "Check that an account is a signer before proceeding.",
    difficulty: "easy",
    category: "security",
    language: "rust",
    xpReward: 10,
    tags: ["signer", "validation"],
    challenge: {
      language: "rust",
      prompt: "Write a function that verifies an account is a signer. Return MissingRequiredSignature error if not.",
      starterCode: `use solana_program::{
    account_info::AccountInfo,
    program_error::ProgramError,
};

pub fn require_signer(account: &AccountInfo) -> Result<(), ProgramError> {
    // Your code here
}`,
      solution: `use solana_program::{
    account_info::AccountInfo,
    program_error::ProgramError,
};

pub fn require_signer(account: &AccountInfo) -> Result<(), ProgramError> {
    if !account.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    Ok(())
}`,
      testCases: [
        { id: "t1", name: "Checks account.is_signer", input: "", expectedOutput: "" },
        { id: "t2", name: "Returns MissingRequiredSignature on failure", input: "", expectedOutput: "" },
      ],
      hints: [
        "AccountInfo has an is_signer boolean field",
        "Use ProgramError::MissingRequiredSignature",
      ],
    },
  },
  {
    id: "sec-2",
    title: "Checked Arithmetic",
    description: "Use checked math operations to prevent overflow.",
    difficulty: "easy",
    category: "security",
    language: "rust",
    xpReward: 10,
    tags: ["overflow", "checked-math"],
    challenge: {
      language: "rust",
      prompt: "Write a function that safely adds two u64 values using checked_add. Return an ArithmeticOverflow error on overflow.",
      starterCode: `use solana_program::program_error::ProgramError;

pub fn safe_add(a: u64, b: u64) -> Result<u64, ProgramError> {
    // Your code here
}`,
      solution: `use solana_program::program_error::ProgramError;

pub fn safe_add(a: u64, b: u64) -> Result<u64, ProgramError> {
    a.checked_add(b).ok_or(ProgramError::ArithmeticOverflow)
}`,
      testCases: [
        { id: "t1", name: "Uses checked_add", input: "", expectedOutput: "" },
        { id: "t2", name: "Returns ArithmeticOverflow on overflow", input: "", expectedOutput: "" },
      ],
      hints: [
        "checked_add returns Option<u64>",
        "Use .ok_or() to convert None to an error",
      ],
    },
  },
  {
    id: "sec-3",
    title: "Reinitialization Guard",
    description: "Prevent account reinitialization attacks.",
    difficulty: "medium",
    category: "security",
    language: "rust",
    xpReward: 25,
    tags: ["reinitialization", "guard"],
    challenge: {
      language: "rust",
      prompt: "Write a function that checks if an account has already been initialized by reading a boolean flag at byte offset 0. Return AccountAlreadyInitialized error if set.",
      starterCode: `use solana_program::{
    account_info::AccountInfo,
    program_error::ProgramError,
};

pub fn require_uninitialized(account: &AccountInfo) -> Result<(), ProgramError> {
    // Your code here
}`,
      solution: `use solana_program::{
    account_info::AccountInfo,
    program_error::ProgramError,
};

pub fn require_uninitialized(account: &AccountInfo) -> Result<(), ProgramError> {
    let data = account.try_borrow_data()?;
    if data.len() > 0 && data[0] != 0 {
        return Err(ProgramError::AccountAlreadyInitialized);
    }
    Ok(())
}`,
      testCases: [
        { id: "t1", name: "Borrows account data", input: "", expectedOutput: "" },
        { id: "t2", name: "Checks first byte for initialization flag", input: "", expectedOutput: "" },
        { id: "t3", name: "Returns AccountAlreadyInitialized if set", input: "", expectedOutput: "" },
      ],
      hints: [
        "Use account.try_borrow_data()? to get a reference to the data",
        "Check if the first byte is non-zero (initialized flag)",
        "ProgramError::AccountAlreadyInitialized for the error",
      ],
    },
  },
  {
    id: "sec-4",
    title: "Authority Validation Pattern",
    description: "Validate that an operation is authorized by the correct authority.",
    difficulty: "medium",
    category: "security",
    language: "rust",
    xpReward: 25,
    tags: ["authority", "access-control"],
    challenge: {
      language: "rust",
      prompt: "Write a function that validates: (1) the authority account is a signer, and (2) the authority's pubkey matches the stored authority in the account data at offset 8 (32 bytes).",
      starterCode: `use solana_program::{
    account_info::AccountInfo,
    program_error::ProgramError,
    pubkey::Pubkey,
};

pub fn validate_authority(
    authority: &AccountInfo,
    data_account: &AccountInfo,
) -> Result<(), ProgramError> {
    // Your code here
}`,
      solution: `use solana_program::{
    account_info::AccountInfo,
    program_error::ProgramError,
    pubkey::Pubkey,
};

pub fn validate_authority(
    authority: &AccountInfo,
    data_account: &AccountInfo,
) -> Result<(), ProgramError> {
    if !authority.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    let data = data_account.try_borrow_data()?;
    let stored_authority = Pubkey::new_from_array(data[8..40].try_into().unwrap());
    if *authority.key != stored_authority {
        return Err(ProgramError::InvalidAccountData);
    }
    Ok(())
}`,
      testCases: [
        { id: "t1", name: "Checks authority is signer", input: "", expectedOutput: "" },
        { id: "t2", name: "Reads stored authority from data", input: "", expectedOutput: "" },
        { id: "t3", name: "Compares pubkeys", input: "", expectedOutput: "" },
      ],
      hints: [
        "First check is_signer on the authority account",
        "Read 32 bytes at offset 8 from the data account",
        "Pubkey::new_from_array converts [u8; 32] to Pubkey",
      ],
    },
  },
  {
    id: "sec-5",
    title: "Closing Account Safely",
    description: "Implement safe account closure that drains lamports and zeros data.",
    difficulty: "hard",
    category: "security",
    language: "rust",
    xpReward: 50,
    tags: ["close-account", "drain", "security"],
    challenge: {
      language: "rust",
      prompt: "Write a function that safely closes an account: transfer all lamports to the destination, then zero out the account data to prevent revival attacks.",
      starterCode: `use solana_program::{
    account_info::AccountInfo,
    entrypoint::ProgramResult,
};

pub fn close_account<'a>(
    account_to_close: &AccountInfo<'a>,
    destination: &AccountInfo<'a>,
) -> ProgramResult {
    // Your code here
}`,
      solution: `use solana_program::{
    account_info::AccountInfo,
    entrypoint::ProgramResult,
};

pub fn close_account<'a>(
    account_to_close: &AccountInfo<'a>,
    destination: &AccountInfo<'a>,
) -> ProgramResult {
    let lamports = account_to_close.lamports();
    **account_to_close.try_borrow_mut_lamports()? = 0;
    **destination.try_borrow_mut_lamports()? = destination.lamports().checked_add(lamports).unwrap();

    let mut data = account_to_close.try_borrow_mut_data()?;
    data.fill(0);

    Ok(())
}`,
      testCases: [
        { id: "t1", name: "Drains all lamports to destination", input: "", expectedOutput: "" },
        { id: "t2", name: "Zeros account data", input: "", expectedOutput: "" },
        { id: "t3", name: "Uses checked_add for lamports", input: "", expectedOutput: "" },
      ],
      hints: [
        "Set source lamports to 0, add to destination",
        "Use try_borrow_mut_lamports and try_borrow_mut_data",
        "data.fill(0) zeros out the entire buffer",
      ],
    },
  },

  // ═══════════════════════════════════════
  // ANCHOR (5)
  // ═══════════════════════════════════════
  {
    id: "anc-1",
    title: "Anchor Account Struct",
    description: "Define an Anchor account struct with the Account attribute.",
    difficulty: "easy",
    category: "anchor",
    language: "rust",
    xpReward: 10,
    tags: ["anchor", "account"],
    challenge: {
      language: "rust",
      prompt: "Define an Anchor account struct called Counter with an authority (Pubkey) and count (u64) field. Use the #[account] attribute.",
      starterCode: `use anchor_lang::prelude::*;

// Define Counter account struct here`,
      solution: `use anchor_lang::prelude::*;

#[account]
pub struct Counter {
    pub authority: Pubkey,
    pub count: u64,
}`,
      testCases: [
        { id: "t1", name: "Uses #[account] attribute", input: "", expectedOutput: "" },
        { id: "t2", name: "Has authority and count fields", input: "", expectedOutput: "" },
      ],
      hints: [
        "#[account] adds Borsh serialization + discriminator",
        "Pubkey is 32 bytes, u64 is 8 bytes",
      ],
    },
  },
  {
    id: "anc-2",
    title: "Anchor Initialize Context",
    description: "Create an Anchor Accounts struct for initializing an account.",
    difficulty: "easy",
    category: "anchor",
    language: "rust",
    xpReward: 10,
    tags: ["anchor", "context", "init"],
    challenge: {
      language: "rust",
      prompt: "Define an Anchor Accounts struct called Initialize that creates a new Counter account with init, sets the payer, and allocates space.",
      starterCode: `use anchor_lang::prelude::*;

#[account]
pub struct Counter {
    pub authority: Pubkey,
    pub count: u64,
}

// Define Initialize accounts struct here`,
      solution: `use anchor_lang::prelude::*;

#[account]
pub struct Counter {
    pub authority: Pubkey,
    pub count: u64,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + 32 + 8)]
    pub counter: Account<'info, Counter>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}`,
      testCases: [
        { id: "t1", name: "Derives Accounts", input: "", expectedOutput: "" },
        { id: "t2", name: "Uses init constraint with payer and space", input: "", expectedOutput: "" },
        { id: "t3", name: "Includes system_program", input: "", expectedOutput: "" },
      ],
      hints: [
        "#[derive(Accounts)] on the struct",
        "init requires payer and space",
        "Space = 8 (discriminator) + 32 (Pubkey) + 8 (u64)",
      ],
    },
  },
  {
    id: "anc-3",
    title: "Anchor Constraint Validation",
    description: "Use Anchor's has_one and constraint attributes for validation.",
    difficulty: "medium",
    category: "anchor",
    language: "rust",
    xpReward: 25,
    tags: ["anchor", "constraints", "has_one"],
    challenge: {
      language: "rust",
      prompt: "Define an Anchor Accounts struct for an Increment instruction. Use has_one to verify the authority matches the Counter's authority field. Mark counter as mutable.",
      starterCode: `use anchor_lang::prelude::*;

#[account]
pub struct Counter {
    pub authority: Pubkey,
    pub count: u64,
}

// Define Increment accounts struct here`,
      solution: `use anchor_lang::prelude::*;

#[account]
pub struct Counter {
    pub authority: Pubkey,
    pub count: u64,
}

#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(mut, has_one = authority)]
    pub counter: Account<'info, Counter>,
    pub authority: Signer<'info>,
}`,
      testCases: [
        { id: "t1", name: "Uses has_one = authority constraint", input: "", expectedOutput: "" },
        { id: "t2", name: "Marks counter as mut", input: "", expectedOutput: "" },
        { id: "t3", name: "Authority is Signer type", input: "", expectedOutput: "" },
      ],
      hints: [
        "has_one = authority checks counter.authority == authority.key()",
        "Mark counter as #[account(mut)] since we'll modify it",
        "authority should be Signer<'info> to verify signature",
      ],
    },
  },
  {
    id: "anc-4",
    title: "Anchor PDA Seeds",
    description: "Define a PDA account with seeds and bump in Anchor.",
    difficulty: "medium",
    category: "anchor",
    language: "rust",
    xpReward: 25,
    tags: ["anchor", "pda", "seeds"],
    challenge: {
      language: "rust",
      prompt: "Define an Anchor Accounts struct that initializes a user profile PDA with seeds [\"profile\", user.key()]. Store the bump in the account.",
      starterCode: `use anchor_lang::prelude::*;

#[account]
pub struct UserProfile {
    pub user: Pubkey,
    pub xp: u64,
    pub bump: u8,
}

// Define CreateProfile accounts struct here`,
      solution: `use anchor_lang::prelude::*;

#[account]
pub struct UserProfile {
    pub user: Pubkey,
    pub xp: u64,
    pub bump: u8,
}

#[derive(Accounts)]
pub struct CreateProfile<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 32 + 8 + 1,
        seeds = [b"profile", user.key().as_ref()],
        bump,
    )]
    pub profile: Account<'info, UserProfile>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}`,
      testCases: [
        { id: "t1", name: "Uses seeds constraint with user key", input: "", expectedOutput: "" },
        { id: "t2", name: "Includes bump in constraints", input: "", expectedOutput: "" },
        { id: "t3", name: "Correct space calculation", input: "", expectedOutput: "" },
      ],
      hints: [
        "seeds = [b\"profile\", user.key().as_ref()] for the PDA seeds",
        "bump tells Anchor to find and verify the canonical bump",
        "Space: 8 (disc) + 32 (Pubkey) + 8 (u64) + 1 (u8) = 49",
      ],
    },
  },
  {
    id: "anc-5",
    title: "Anchor Error Codes",
    description: "Define custom error codes and use them in Anchor programs.",
    difficulty: "hard",
    category: "anchor",
    language: "rust",
    xpReward: 50,
    tags: ["anchor", "errors", "custom"],
    challenge: {
      language: "rust",
      prompt: "Define an Anchor error enum with 3 variants: Unauthorized, InsufficientFunds, and AlreadyClaimed. Then write an instruction handler that uses require! macro with these errors.",
      starterCode: `use anchor_lang::prelude::*;

// Define error enum and instruction handler`,
      solution: `use anchor_lang::prelude::*;

#[error_code]
pub enum GameError {
    #[msg("You are not authorized to perform this action")]
    Unauthorized,
    #[msg("Insufficient funds for this operation")]
    InsufficientFunds,
    #[msg("This reward has already been claimed")]
    AlreadyClaimed,
}

pub fn claim_reward(ctx: Context<ClaimReward>, amount: u64) -> Result<()> {
    let profile = &mut ctx.accounts.profile;
    require!(ctx.accounts.authority.key() == profile.authority, GameError::Unauthorized);
    require!(profile.balance >= amount, GameError::InsufficientFunds);
    require!(!profile.claimed, GameError::AlreadyClaimed);
    profile.balance -= amount;
    profile.claimed = true;
    Ok(())
}`,
      testCases: [
        { id: "t1", name: "Uses #[error_code] attribute", input: "", expectedOutput: "" },
        { id: "t2", name: "Defines three error variants with messages", input: "", expectedOutput: "" },
        { id: "t3", name: "Uses require! macro for validation", input: "", expectedOutput: "" },
      ],
      hints: [
        "#[error_code] creates an enum with error codes starting at 6000",
        "#[msg(\"...\")] adds a human-readable message",
        "require!(condition, ErrorType::Variant) is Anchor's assert macro",
      ],
    },
  },

  // ═══════════════════════════════════════
  // DEFI (5)
  // ═══════════════════════════════════════
  {
    id: "defi-1",
    title: "Constant Product Formula",
    description: "Implement the x * y = k AMM formula.",
    difficulty: "easy",
    category: "defi",
    language: "typescript",
    xpReward: 10,
    tags: ["amm", "constant-product"],
    challenge: {
      language: "typescript",
      prompt: "Write a function that calculates the output amount for a swap using the constant product formula: dy = (y * dx) / (x + dx). No fees.",
      starterCode: `function calculateSwapOutput(
  reserveIn: bigint,
  reserveOut: bigint,
  amountIn: bigint,
): bigint {
  // Your code here
}`,
      solution: `function calculateSwapOutput(
  reserveIn: bigint,
  reserveOut: bigint,
  amountIn: bigint,
): bigint {
  const numerator = reserveOut * amountIn;
  const denominator = reserveIn + amountIn;
  return numerator / denominator;
}`,
      testCases: [
        { id: "t1", name: "Implements constant product formula", input: "", expectedOutput: "" },
        { id: "t2", name: "Returns correct output amount", input: "", expectedOutput: "" },
      ],
      hints: [
        "dy = (y * dx) / (x + dx) where x=reserveIn, y=reserveOut, dx=amountIn",
        "Use BigInt arithmetic to avoid overflow",
      ],
    },
  },
  {
    id: "defi-2",
    title: "Swap with Fee",
    description: "Add a fee to the constant product swap calculation.",
    difficulty: "easy",
    category: "defi",
    language: "typescript",
    xpReward: 10,
    tags: ["amm", "fees"],
    challenge: {
      language: "typescript",
      prompt: "Modify the swap formula to include a 0.3% fee. The fee is taken from the input amount before the swap calculation. Fee = amountIn * 3 / 1000.",
      starterCode: `function calculateSwapWithFee(
  reserveIn: bigint,
  reserveOut: bigint,
  amountIn: bigint,
): { amountOut: bigint; fee: bigint } {
  // Your code here
}`,
      solution: `function calculateSwapWithFee(
  reserveIn: bigint,
  reserveOut: bigint,
  amountIn: bigint,
): { amountOut: bigint; fee: bigint } {
  const fee = amountIn * 3n / 1000n;
  const amountInAfterFee = amountIn - fee;
  const numerator = reserveOut * amountInAfterFee;
  const denominator = reserveIn + amountInAfterFee;
  return { amountOut: numerator / denominator, fee };
}`,
      testCases: [
        { id: "t1", name: "Calculates 0.3% fee", input: "", expectedOutput: "" },
        { id: "t2", name: "Applies fee before swap calculation", input: "", expectedOutput: "" },
        { id: "t3", name: "Returns both amountOut and fee", input: "", expectedOutput: "" },
      ],
      hints: [
        "Fee = amountIn * 3n / 1000n (0.3%)",
        "Subtract fee from amountIn before the swap formula",
        "Use the same constant product formula with the reduced input",
      ],
    },
  },
  {
    id: "defi-3",
    title: "LP Token Calculation",
    description: "Calculate LP tokens to mint for a liquidity deposit.",
    difficulty: "medium",
    category: "defi",
    language: "typescript",
    xpReward: 25,
    tags: ["liquidity", "lp-tokens"],
    challenge: {
      language: "typescript",
      prompt: "Write a function to calculate LP tokens for a deposit. For the first deposit, LP = sqrt(amountA * amountB). For subsequent deposits, LP = min(amountA * totalLP / reserveA, amountB * totalLP / reserveB).",
      starterCode: `function calculateLPTokens(
  amountA: bigint,
  amountB: bigint,
  reserveA: bigint,
  reserveB: bigint,
  totalLPSupply: bigint,
): bigint {
  // Your code here
}

function sqrt(value: bigint): bigint {
  if (value < 0n) throw new Error("negative");
  if (value < 2n) return value;
  let x = value;
  let y = (x + 1n) / 2n;
  while (y < x) { x = y; y = (x + value / x) / 2n; }
  return x;
}`,
      solution: `function calculateLPTokens(
  amountA: bigint,
  amountB: bigint,
  reserveA: bigint,
  reserveB: bigint,
  totalLPSupply: bigint,
): bigint {
  if (totalLPSupply === 0n) {
    return sqrt(amountA * amountB);
  }
  const lpFromA = amountA * totalLPSupply / reserveA;
  const lpFromB = amountB * totalLPSupply / reserveB;
  return lpFromA < lpFromB ? lpFromA : lpFromB;
}

function sqrt(value: bigint): bigint {
  if (value < 0n) throw new Error("negative");
  if (value < 2n) return value;
  let x = value;
  let y = (x + 1n) / 2n;
  while (y < x) { x = y; y = (x + value / x) / 2n; }
  return x;
}`,
      testCases: [
        { id: "t1", name: "Handles first deposit with sqrt", input: "", expectedOutput: "" },
        { id: "t2", name: "Uses min() for subsequent deposits", input: "", expectedOutput: "" },
        { id: "t3", name: "Returns correct LP amount", input: "", expectedOutput: "" },
      ],
      hints: [
        "Check if totalLPSupply === 0n for first deposit",
        "First deposit: sqrt(amountA * amountB)",
        "Subsequent: min of (amountA * totalLP / reserveA, amountB * totalLP / reserveB)",
      ],
    },
  },
  {
    id: "defi-4",
    title: "Price Impact Calculator",
    description: "Calculate the price impact of a swap on an AMM.",
    difficulty: "medium",
    category: "defi",
    language: "typescript",
    xpReward: 25,
    tags: ["price-impact", "slippage"],
    challenge: {
      language: "typescript",
      prompt: "Write a function that calculates price impact as a percentage. Spot price = reserveOut/reserveIn. Execution price = amountOut/amountIn. Impact = (spotPrice - executionPrice) / spotPrice * 100.",
      starterCode: `function calculatePriceImpact(
  reserveIn: number,
  reserveOut: number,
  amountIn: number,
  amountOut: number,
): number {
  // Your code here — return percentage
}`,
      solution: `function calculatePriceImpact(
  reserveIn: number,
  reserveOut: number,
  amountIn: number,
  amountOut: number,
): number {
  const spotPrice = reserveOut / reserveIn;
  const executionPrice = amountOut / amountIn;
  return ((spotPrice - executionPrice) / spotPrice) * 100;
}`,
      testCases: [
        { id: "t1", name: "Calculates spot price", input: "", expectedOutput: "" },
        { id: "t2", name: "Calculates execution price", input: "", expectedOutput: "" },
        { id: "t3", name: "Returns impact as percentage", input: "", expectedOutput: "" },
      ],
      hints: [
        "Spot price = reserveOut / reserveIn (price before trade)",
        "Execution price = amountOut / amountIn (actual price paid)",
        "Impact = (spot - execution) / spot * 100",
      ],
    },
  },
  {
    id: "defi-5",
    title: "Liquidation Threshold Check",
    description: "Implement a lending protocol liquidation check.",
    difficulty: "hard",
    category: "defi",
    language: "rust",
    xpReward: 50,
    tags: ["lending", "liquidation", "health-factor"],
    challenge: {
      language: "rust",
      prompt: "Write a Rust struct and impl for a lending position. Track collateral_value and debt_value (both u64, in USD cents). Implement health_factor() that returns collateral * 100 / debt, and is_liquidatable() that returns true if health factor < 150 (150%).",
      starterCode: `pub struct LendingPosition {
    // Your fields here
}

impl LendingPosition {
    pub fn new(collateral_value: u64, debt_value: u64) -> Self {
        // Your code here
    }

    pub fn health_factor(&self) -> u64 {
        // Your code here
    }

    pub fn is_liquidatable(&self) -> bool {
        // Your code here
    }
}`,
      solution: `pub struct LendingPosition {
    pub collateral_value: u64,
    pub debt_value: u64,
}

impl LendingPosition {
    pub fn new(collateral_value: u64, debt_value: u64) -> Self {
        Self { collateral_value, debt_value }
    }

    pub fn health_factor(&self) -> u64 {
        if self.debt_value == 0 {
            return u64::MAX;
        }
        self.collateral_value.checked_mul(100).unwrap() / self.debt_value
    }

    pub fn is_liquidatable(&self) -> bool {
        self.health_factor() < 150
    }
}`,
      testCases: [
        { id: "t1", name: "Defines struct with collateral and debt fields", input: "", expectedOutput: "" },
        { id: "t2", name: "health_factor returns collateral*100/debt", input: "", expectedOutput: "" },
        { id: "t3", name: "is_liquidatable checks < 150", input: "", expectedOutput: "" },
      ],
      hints: [
        "Health factor = collateral_value * 100 / debt_value",
        "Handle zero debt by returning u64::MAX",
        "Liquidatable when health factor < 150 (150%)",
      ],
    },
  },

  // ═══════════════════════════════════════
  // ADVANCED (5)
  // ═══════════════════════════════════════
  {
    id: "adv-1",
    title: "Versioned Transaction Builder",
    description: "Create a versioned transaction with an address lookup table.",
    difficulty: "easy",
    category: "advanced",
    language: "typescript",
    xpReward: 10,
    tags: ["versioned-tx", "v0"],
    challenge: {
      language: "typescript",
      prompt: "Write a function that creates a VersionedTransaction (V0) message. Use TransactionMessage.compile with the provided lookup table.",
      starterCode: `import { PublicKey, TransactionMessage, VersionedTransaction, TransactionInstruction, AddressLookupTableAccount } from "@solana/web3.js";

function createV0Transaction(
  payer: PublicKey,
  instructions: TransactionInstruction[],
  recentBlockhash: string,
  lookupTable: AddressLookupTableAccount,
): VersionedTransaction {
  // Your code here
}`,
      solution: `import { PublicKey, TransactionMessage, VersionedTransaction, TransactionInstruction, AddressLookupTableAccount } from "@solana/web3.js";

function createV0Transaction(
  payer: PublicKey,
  instructions: TransactionInstruction[],
  recentBlockhash: string,
  lookupTable: AddressLookupTableAccount,
): VersionedTransaction {
  const messageV0 = new TransactionMessage({
    payerKey: payer,
    recentBlockhash,
    instructions,
  }).compileToV0Message([lookupTable]);
  return new VersionedTransaction(messageV0);
}`,
      testCases: [
        { id: "t1", name: "Creates TransactionMessage", input: "", expectedOutput: "" },
        { id: "t2", name: "Compiles to V0 with lookup table", input: "", expectedOutput: "" },
        { id: "t3", name: "Returns VersionedTransaction", input: "", expectedOutput: "" },
      ],
      hints: [
        "TransactionMessage takes payerKey, recentBlockhash, instructions",
        ".compileToV0Message([lookupTables]) creates a V0 message",
        "Wrap in new VersionedTransaction(messageV0)",
      ],
    },
  },
  {
    id: "adv-2",
    title: "Compute Budget Instructions",
    description: "Set compute unit limit and price for a transaction.",
    difficulty: "easy",
    category: "advanced",
    language: "typescript",
    xpReward: 10,
    tags: ["compute-budget", "priority-fees"],
    challenge: {
      language: "typescript",
      prompt: "Write a function that creates two ComputeBudgetProgram instructions: one to set the compute unit limit and one to set the compute unit price (priority fee).",
      starterCode: `import { ComputeBudgetProgram, TransactionInstruction } from "@solana/web3.js";

function createComputeBudgetIxs(
  units: number,
  microLamportsPerUnit: number,
): TransactionInstruction[] {
  // Your code here
}`,
      solution: `import { ComputeBudgetProgram, TransactionInstruction } from "@solana/web3.js";

function createComputeBudgetIxs(
  units: number,
  microLamportsPerUnit: number,
): TransactionInstruction[] {
  return [
    ComputeBudgetProgram.setComputeUnitLimit({ units }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: microLamportsPerUnit }),
  ];
}`,
      testCases: [
        { id: "t1", name: "Uses ComputeBudgetProgram.setComputeUnitLimit", input: "", expectedOutput: "" },
        { id: "t2", name: "Uses ComputeBudgetProgram.setComputeUnitPrice", input: "", expectedOutput: "" },
        { id: "t3", name: "Returns array of two instructions", input: "", expectedOutput: "" },
      ],
      hints: [
        "ComputeBudgetProgram.setComputeUnitLimit({ units })",
        "ComputeBudgetProgram.setComputeUnitPrice({ microLamports })",
        "Return both as an array",
      ],
    },
  },
  {
    id: "adv-3",
    title: "Bitmap Operations",
    description: "Implement a bitmap for tracking completed items on-chain.",
    difficulty: "medium",
    category: "advanced",
    language: "rust",
    xpReward: 25,
    tags: ["bitmap", "bit-manipulation"],
    challenge: {
      language: "rust",
      prompt: "Implement a bitmap tracker using a u64. Write functions to set a bit, check a bit, and count the number of set bits.",
      starterCode: `pub struct Bitmap {
    pub bits: u64,
}

impl Bitmap {
    pub fn new() -> Self {
        // Your code here
    }

    pub fn set(&mut self, index: u8) {
        // Your code here
    }

    pub fn is_set(&self, index: u8) -> bool {
        // Your code here
    }

    pub fn count(&self) -> u32 {
        // Your code here
    }
}`,
      solution: `pub struct Bitmap {
    pub bits: u64,
}

impl Bitmap {
    pub fn new() -> Self {
        Self { bits: 0 }
    }

    pub fn set(&mut self, index: u8) {
        self.bits |= 1u64 << index;
    }

    pub fn is_set(&self, index: u8) -> bool {
        (self.bits & (1u64 << index)) != 0
    }

    pub fn count(&self) -> u32 {
        self.bits.count_ones()
    }
}`,
      testCases: [
        { id: "t1", name: "Implements set with bitwise OR", input: "", expectedOutput: "" },
        { id: "t2", name: "Implements is_set with bitwise AND", input: "", expectedOutput: "" },
        { id: "t3", name: "Implements count with count_ones", input: "", expectedOutput: "" },
      ],
      hints: [
        "Set bit: bits |= 1u64 << index",
        "Check bit: (bits & (1u64 << index)) != 0",
        "Count: u64 has a built-in count_ones() method",
      ],
    },
  },
  {
    id: "adv-4",
    title: "Rate Limiter",
    description: "Implement a UTC-day-based rate limiter for on-chain operations.",
    difficulty: "medium",
    category: "advanced",
    language: "rust",
    xpReward: 25,
    tags: ["rate-limiting", "utc", "clock"],
    challenge: {
      language: "rust",
      prompt: "Implement a rate limiter struct that tracks actions per UTC day. It should have a method to check if an action is allowed (max N per day) and a method to record an action.",
      starterCode: `pub struct RateLimiter {
    // Your fields here
}

impl RateLimiter {
    pub fn new(max_per_day: u16) -> Self {
        // Your code here
    }

    pub fn is_allowed(&self, current_timestamp: i64) -> bool {
        // Your code here
    }

    pub fn record_action(&mut self, current_timestamp: i64) {
        // Your code here
    }
}`,
      solution: `pub struct RateLimiter {
    pub max_per_day: u16,
    pub last_day: u32,
    pub count_today: u16,
}

impl RateLimiter {
    pub fn new(max_per_day: u16) -> Self {
        Self { max_per_day, last_day: 0, count_today: 0 }
    }

    pub fn is_allowed(&self, current_timestamp: i64) -> bool {
        let today = (current_timestamp / 86400) as u32;
        if today != self.last_day {
            return true;
        }
        self.count_today < self.max_per_day
    }

    pub fn record_action(&mut self, current_timestamp: i64) {
        let today = (current_timestamp / 86400) as u32;
        if today != self.last_day {
            self.last_day = today;
            self.count_today = 1;
        } else {
            self.count_today += 1;
        }
    }
}`,
      testCases: [
        { id: "t1", name: "Tracks count per UTC day", input: "", expectedOutput: "" },
        { id: "t2", name: "Resets count on new day", input: "", expectedOutput: "" },
        { id: "t3", name: "Enforces max_per_day limit", input: "", expectedOutput: "" },
      ],
      hints: [
        "UTC day = timestamp / 86400",
        "Reset counter when the day changes",
        "is_allowed: return true if new day OR count < max",
      ],
    },
  },
  {
    id: "adv-5",
    title: "Merkle Tree Verification",
    description: "Verify a Merkle proof for an allowlist.",
    difficulty: "hard",
    category: "advanced",
    language: "typescript",
    xpReward: 50,
    tags: ["merkle", "proof", "allowlist"],
    challenge: {
      language: "typescript",
      prompt: "Write a function that verifies a Merkle proof. Given a leaf hash, an array of proof hashes, and a root hash, verify the leaf is in the tree. At each level, sort the pair before hashing (smaller first).",
      starterCode: `function verifyMerkleProof(
  leaf: Uint8Array,
  proof: Uint8Array[],
  root: Uint8Array,
  hashFn: (data: Uint8Array) => Uint8Array,
): boolean {
  // Your code here
}`,
      solution: `function verifyMerkleProof(
  leaf: Uint8Array,
  proof: Uint8Array[],
  root: Uint8Array,
  hashFn: (data: Uint8Array) => Uint8Array,
): boolean {
  let current = leaf;
  for (const proofElement of proof) {
    const combined = new Uint8Array(current.length + proofElement.length);
    if (Buffer.compare(Buffer.from(current), Buffer.from(proofElement)) <= 0) {
      combined.set(current, 0);
      combined.set(proofElement, current.length);
    } else {
      combined.set(proofElement, 0);
      combined.set(current, proofElement.length);
    }
    current = hashFn(combined);
  }
  return Buffer.compare(Buffer.from(current), Buffer.from(root)) === 0;
}`,
      testCases: [
        { id: "t1", name: "Iterates through proof elements", input: "", expectedOutput: "" },
        { id: "t2", name: "Sorts pairs before hashing", input: "", expectedOutput: "" },
        { id: "t3", name: "Compares final hash to root", input: "", expectedOutput: "" },
      ],
      hints: [
        "Walk up the tree: at each level, combine current + proof element",
        "Sort the pair (smaller first) before hashing to ensure deterministic ordering",
        "Final computed hash should equal the root",
      ],
    },
  },

  // ═══════════════════════════════════════════════
  // HARD CHALLENGES (25) — Expert-level problems
  // ═══════════════════════════════════════════════

  // --- ACCOUNTS HARD ---
  {
    id: "hard-1",
    title: "Reallocate Account Data",
    description: "Resize an existing account's data buffer using realloc while preserving content and adjusting rent.",
    difficulty: "hard",
    category: "accounts",
    language: "rust",
    xpReward: 50,
    tags: ["realloc", "rent", "resize"],
    challenge: {
      language: "rust",
      prompt: "Write a Rust function that reallocates an account's data to a new size. Transfer lamports to/from a payer to maintain rent exemption. Use account.realloc() and handle both growing and shrinking.",
      starterCode: `use solana_program::{
    account_info::AccountInfo,
    entrypoint::ProgramResult,
    program_error::ProgramError,
    rent::Rent,
    sysvar::Sysvar,
};

pub fn realloc_account<'a>(
    account: &AccountInfo<'a>,
    payer: &AccountInfo<'a>,
    new_size: usize,
) -> ProgramResult {
    // Your code here
}`,
      solution: `use solana_program::{
    account_info::AccountInfo,
    entrypoint::ProgramResult,
    program_error::ProgramError,
    rent::Rent,
    sysvar::Sysvar,
};

pub fn realloc_account<'a>(
    account: &AccountInfo<'a>,
    payer: &AccountInfo<'a>,
    new_size: usize,
) -> ProgramResult {
    let rent = Rent::get()?;
    let old_lamports = account.lamports();
    let new_minimum = rent.minimum_balance(new_size);

    if new_minimum > old_lamports {
        let diff = new_minimum.checked_sub(old_lamports).ok_or(ProgramError::ArithmeticOverflow)?;
        **payer.try_borrow_mut_lamports()? = payer.lamports().checked_sub(diff).ok_or(ProgramError::InsufficientFunds)?;
        **account.try_borrow_mut_lamports()? = new_minimum;
    } else if new_minimum < old_lamports {
        let diff = old_lamports.checked_sub(new_minimum).ok_or(ProgramError::ArithmeticOverflow)?;
        **account.try_borrow_mut_lamports()? = new_minimum;
        **payer.try_borrow_mut_lamports()? = payer.lamports().checked_add(diff).ok_or(ProgramError::ArithmeticOverflow)?;
    }

    account.realloc(new_size, false)?;
    Ok(())
}`,
      testCases: [
        { id: "t1", name: "Uses Rent::get() for minimum balance", input: "", expectedOutput: "" },
        { id: "t2", name: "Handles growing (transfer lamports from payer)", input: "", expectedOutput: "" },
        { id: "t3", name: "Handles shrinking (refund lamports to payer)", input: "", expectedOutput: "" },
        { id: "t4", name: "Calls account.realloc()", input: "", expectedOutput: "" },
      ],
      hints: [
        "Rent::get()?.minimum_balance(size) returns required lamports",
        "Growing: move lamports from payer to account",
        "Shrinking: refund excess lamports to payer",
        "account.realloc(new_size, false) — false means don't zero-init",
      ],
    },
  },
  {
    id: "hard-2",
    title: "Multi-Account Atomic Swap",
    description: "Implement an atomic swap between two token accounts with escrow logic, rollback on failure.",
    difficulty: "hard",
    category: "accounts",
    language: "rust",
    xpReward: 50,
    tags: ["escrow", "atomic", "swap"],
    challenge: {
      language: "rust",
      prompt: "Write a Rust struct and methods for an escrow that tracks maker, taker, amounts, mint addresses, and state (Open/Filled/Cancelled). Implement accept() which validates both sides match, and cancel() which can only be called by the maker.",
      starterCode: `use solana_program::pubkey::Pubkey;

#[derive(Clone, Copy, PartialEq)]
pub enum EscrowState {
    Open,
    Filled,
    Cancelled,
}

pub struct Escrow {
    // Your fields here
}

impl Escrow {
    pub fn new(maker: Pubkey, offer_mint: Pubkey, offer_amount: u64, want_mint: Pubkey, want_amount: u64) -> Self {
        // Your code here
    }

    pub fn accept(&mut self, taker: &Pubkey, taker_mint: &Pubkey, taker_amount: u64) -> Result<(), &'static str> {
        // Your code here
    }

    pub fn cancel(&mut self, caller: &Pubkey) -> Result<(), &'static str> {
        // Your code here
    }
}`,
      solution: `use solana_program::pubkey::Pubkey;

#[derive(Clone, Copy, PartialEq)]
pub enum EscrowState {
    Open,
    Filled,
    Cancelled,
}

pub struct Escrow {
    pub maker: Pubkey,
    pub offer_mint: Pubkey,
    pub offer_amount: u64,
    pub want_mint: Pubkey,
    pub want_amount: u64,
    pub state: EscrowState,
}

impl Escrow {
    pub fn new(maker: Pubkey, offer_mint: Pubkey, offer_amount: u64, want_mint: Pubkey, want_amount: u64) -> Self {
        Self { maker, offer_mint, offer_amount, want_mint, want_amount, state: EscrowState::Open }
    }

    pub fn accept(&mut self, taker: &Pubkey, taker_mint: &Pubkey, taker_amount: u64) -> Result<(), &'static str> {
        if self.state != EscrowState::Open {
            return Err("Escrow is not open");
        }
        if *taker == self.maker {
            return Err("Maker cannot accept own escrow");
        }
        if *taker_mint != self.want_mint {
            return Err("Wrong mint provided by taker");
        }
        if taker_amount < self.want_amount {
            return Err("Insufficient amount from taker");
        }
        self.state = EscrowState::Filled;
        Ok(())
    }

    pub fn cancel(&mut self, caller: &Pubkey) -> Result<(), &'static str> {
        if self.state != EscrowState::Open {
            return Err("Escrow is not open");
        }
        if *caller != self.maker {
            return Err("Only maker can cancel");
        }
        self.state = EscrowState::Cancelled;
        Ok(())
    }
}`,
      testCases: [
        { id: "t1", name: "Defines Escrow struct with all fields", input: "", expectedOutput: "" },
        { id: "t2", name: "accept() validates state, mint, and amount", input: "", expectedOutput: "" },
        { id: "t3", name: "cancel() only allows maker", input: "", expectedOutput: "" },
        { id: "t4", name: "State transitions are correct", input: "", expectedOutput: "" },
      ],
      hints: [
        "Track state as an enum: Open, Filled, Cancelled",
        "accept() must verify: state is Open, taker != maker, mint matches, amount sufficient",
        "cancel() must verify: state is Open, caller is maker",
      ],
    },
  },

  // --- TRANSACTIONS HARD ---
  {
    id: "hard-3",
    title: "Durable Nonce Transaction",
    description: "Build a transaction using a durable nonce instead of a recent blockhash.",
    difficulty: "hard",
    category: "transactions",
    language: "typescript",
    xpReward: 50,
    tags: ["durable-nonce", "offline-signing"],
    challenge: {
      language: "typescript",
      prompt: "Write a function that builds a transaction using a durable nonce. The first instruction must be NonceAdvance, the nonce value replaces the blockhash, and the nonce authority signs.",
      starterCode: `import {
  Transaction, SystemProgram, PublicKey, NonceAccount,
  NONCE_ACCOUNT_LENGTH, TransactionInstruction,
} from "@solana/web3.js";

function buildDurableNonceTx(
  nonceAccountPubkey: PublicKey,
  nonceAuthority: PublicKey,
  nonceValue: string,
  instructions: TransactionInstruction[],
): Transaction {
  // Your code here
}`,
      solution: `import {
  Transaction, SystemProgram, PublicKey, NonceAccount,
  NONCE_ACCOUNT_LENGTH, TransactionInstruction,
} from "@solana/web3.js";

function buildDurableNonceTx(
  nonceAccountPubkey: PublicKey,
  nonceAuthority: PublicKey,
  nonceValue: string,
  instructions: TransactionInstruction[],
): Transaction {
  const advanceNonceIx = SystemProgram.nonceAdvance({
    noncePubkey: nonceAccountPubkey,
    authorizedPubkey: nonceAuthority,
  });
  const tx = new Transaction();
  tx.recentBlockhash = nonceValue;
  tx.feePayer = nonceAuthority;
  tx.add(advanceNonceIx, ...instructions);
  return tx;
}`,
      testCases: [
        { id: "t1", name: "Uses SystemProgram.nonceAdvance as first instruction", input: "", expectedOutput: "" },
        { id: "t2", name: "Sets recentBlockhash to nonce value", input: "", expectedOutput: "" },
        { id: "t3", name: "Appends user instructions after nonce advance", input: "", expectedOutput: "" },
      ],
      hints: [
        "SystemProgram.nonceAdvance({ noncePubkey, authorizedPubkey }) creates the advance ix",
        "Set tx.recentBlockhash = nonceValue (the nonce replaces the blockhash)",
        "Nonce advance MUST be the first instruction in the transaction",
      ],
    },
  },
  {
    id: "hard-4",
    title: "Transaction Size Estimator",
    description: "Calculate the exact byte size of a Solana transaction before sending.",
    difficulty: "hard",
    category: "transactions",
    language: "typescript",
    xpReward: 50,
    tags: ["tx-size", "optimization", "limits"],
    challenge: {
      language: "typescript",
      prompt: "Write a function that estimates the serialized size of a legacy transaction. Formula: 1 (num_signatures) + 64*num_signers + 3 (header) + 32*num_accounts + 32 (blockhash) + compact_len(num_instructions) + sum of instruction sizes. Each instruction: 1 (program_id_index) + compact_len(num_keys) + num_keys + compact_len(data_len) + data_len.",
      starterCode: `interface TxSizeInput {
  numSigners: number;
  numAccounts: number;
  instructions: { numKeys: number; dataLength: number }[];
}

function estimateTransactionSize(input: TxSizeInput): number {
  // Your code here
}

function compactLen(n: number): number {
  // Your code here — return bytes needed for compact-u16 encoding
}`,
      solution: `interface TxSizeInput {
  numSigners: number;
  numAccounts: number;
  instructions: { numKeys: number; dataLength: number }[];
}

function estimateTransactionSize(input: TxSizeInput): number {
  const signaturesSize = 1 + 64 * input.numSigners;
  const headerSize = 3;
  const accountKeysSize = compactLen(input.numAccounts) + 32 * input.numAccounts;
  const blockhashSize = 32;
  let instructionsSize = compactLen(input.instructions.length);
  for (const ix of input.instructions) {
    instructionsSize += 1;
    instructionsSize += compactLen(ix.numKeys) + ix.numKeys;
    instructionsSize += compactLen(ix.dataLength) + ix.dataLength;
  }
  return signaturesSize + headerSize + accountKeysSize + blockhashSize + instructionsSize;
}

function compactLen(n: number): number {
  if (n <= 0x7f) return 1;
  if (n <= 0x3fff) return 2;
  return 3;
}`,
      testCases: [
        { id: "t1", name: "Calculates signature section size", input: "", expectedOutput: "" },
        { id: "t2", name: "Implements compact-u16 encoding length", input: "", expectedOutput: "" },
        { id: "t3", name: "Sums all instruction sizes correctly", input: "", expectedOutput: "" },
        { id: "t4", name: "Returns total byte count", input: "", expectedOutput: "" },
      ],
      hints: [
        "Compact-u16: 1 byte if <= 127, 2 bytes if <= 16383, else 3 bytes",
        "Signatures section: 1 byte count + 64 bytes per signer",
        "Each instruction: 1 (program index) + compact(numKeys) + keys + compact(dataLen) + data",
        "Max legacy tx size is 1232 bytes",
      ],
    },
  },

  // --- PDAs HARD ---
  {
    id: "hard-5",
    title: "PDA Collision Detector",
    description: "Check for PDA seed collisions across different derivation schemes.",
    difficulty: "hard",
    category: "pdas",
    language: "typescript",
    xpReward: 50,
    tags: ["pda", "collision", "security"],
    challenge: {
      language: "typescript",
      prompt: "Write a function that takes two different seed arrays and a program ID, derives PDAs for both, and returns whether they collide (same address). Also return both addresses and bumps. This tests understanding that different seeds can theoretically produce the same PDA.",
      starterCode: `import { PublicKey } from "@solana/web3.js";

interface PDADerivation {
  address: PublicKey;
  bump: number;
}

interface CollisionResult {
  pda1: PDADerivation;
  pda2: PDADerivation;
  collides: boolean;
}

function checkPDACollision(
  seeds1: Buffer[],
  seeds2: Buffer[],
  programId: PublicKey,
): CollisionResult {
  // Your code here
}`,
      solution: `import { PublicKey } from "@solana/web3.js";

interface PDADerivation {
  address: PublicKey;
  bump: number;
}

interface CollisionResult {
  pda1: PDADerivation;
  pda2: PDADerivation;
  collides: boolean;
}

function checkPDACollision(
  seeds1: Buffer[],
  seeds2: Buffer[],
  programId: PublicKey,
): CollisionResult {
  const [addr1, bump1] = PublicKey.findProgramAddressSync(seeds1, programId);
  const [addr2, bump2] = PublicKey.findProgramAddressSync(seeds2, programId);
  return {
    pda1: { address: addr1, bump: bump1 },
    pda2: { address: addr2, bump: bump2 },
    collides: addr1.equals(addr2),
  };
}`,
      testCases: [
        { id: "t1", name: "Derives both PDAs with findProgramAddressSync", input: "", expectedOutput: "" },
        { id: "t2", name: "Uses .equals() to compare PublicKeys", input: "", expectedOutput: "" },
        { id: "t3", name: "Returns full CollisionResult", input: "", expectedOutput: "" },
      ],
      hints: [
        "Derive each PDA independently with findProgramAddressSync",
        "Use addr1.equals(addr2) — not === — to compare PublicKey objects",
        "In practice collisions should never happen with well-designed seeds",
      ],
    },
  },
  {
    id: "hard-6",
    title: "PDA Signer Seeds Builder",
    description: "Build a generic signer seeds array for CPIs with arbitrary seed patterns.",
    difficulty: "hard",
    category: "pdas",
    language: "rust",
    xpReward: 50,
    tags: ["pda", "signer-seeds", "generic"],
    challenge: {
      language: "rust",
      prompt: "Write a Rust function that takes a variable number of seed components (prefix string, pubkey bytes, u64 id, bump) and constructs the signer seeds array. The challenge is handling lifetime references correctly so the seeds can be used with invoke_signed.",
      starterCode: `use solana_program::{
    account_info::AccountInfo,
    entrypoint::ProgramResult,
    program::invoke_signed,
    instruction::Instruction,
};

pub fn invoke_with_pda_signer<'a>(
    instruction: &Instruction,
    accounts: &[AccountInfo<'a>],
    seed_prefix: &[u8],
    pubkey_seed: &[u8; 32],
    id_seed: u64,
    bump: u8,
) -> ProgramResult {
    // Your code here — build signer seeds and call invoke_signed
}`,
      solution: `use solana_program::{
    account_info::AccountInfo,
    entrypoint::ProgramResult,
    program::invoke_signed,
    instruction::Instruction,
};

pub fn invoke_with_pda_signer<'a>(
    instruction: &Instruction,
    accounts: &[AccountInfo<'a>],
    seed_prefix: &[u8],
    pubkey_seed: &[u8; 32],
    id_seed: u64,
    bump: u8,
) -> ProgramResult {
    let id_bytes = id_seed.to_le_bytes();
    let bump_bytes = [bump];
    let signer_seeds: &[&[u8]] = &[
        seed_prefix,
        pubkey_seed,
        &id_bytes,
        &bump_bytes,
    ];
    invoke_signed(instruction, accounts, &[signer_seeds])
}`,
      testCases: [
        { id: "t1", name: "Converts u64 to le_bytes for seed", input: "", expectedOutput: "" },
        { id: "t2", name: "Constructs signer_seeds with all components", input: "", expectedOutput: "" },
        { id: "t3", name: "Calls invoke_signed with correct seeds", input: "", expectedOutput: "" },
      ],
      hints: [
        "Store id_seed.to_le_bytes() in a local variable so the reference lives long enough",
        "Bump must also be in a local [u8; 1] array",
        "Signer seeds: &[&[u8]] with prefix, pubkey, id_bytes, bump_bytes",
      ],
    },
  },

  // --- TOKENS HARD ---
  {
    id: "hard-7",
    title: "Token-2022 Transfer Hook Validator",
    description: "Implement validation logic for a Token-2022 transfer hook program.",
    difficulty: "hard",
    category: "tokens",
    language: "rust",
    xpReward: 50,
    tags: ["token-2022", "transfer-hook", "extension"],
    challenge: {
      language: "rust",
      prompt: "Write a Rust struct for a transfer hook config and a validate_transfer function. The hook should enforce: (1) transfers only during business hours (9-17 UTC), (2) maximum single transfer amount of 1_000_000, (3) sender is not in a blocklist (stored as array of [u8;32]).",
      starterCode: `pub struct TransferHookConfig {
    // Your fields here
}

impl TransferHookConfig {
    pub fn new(max_amount: u64, blocklist: Vec<[u8; 32]>) -> Self {
        // Your code here
    }

    pub fn validate_transfer(
        &self,
        sender: &[u8; 32],
        amount: u64,
        unix_timestamp: i64,
    ) -> Result<(), &'static str> {
        // Your code here
    }
}`,
      solution: `pub struct TransferHookConfig {
    pub max_amount: u64,
    pub blocklist: Vec<[u8; 32]>,
}

impl TransferHookConfig {
    pub fn new(max_amount: u64, blocklist: Vec<[u8; 32]>) -> Self {
        Self { max_amount, blocklist }
    }

    pub fn validate_transfer(
        &self,
        sender: &[u8; 32],
        amount: u64,
        unix_timestamp: i64,
    ) -> Result<(), &'static str> {
        let hour = ((unix_timestamp % 86400) / 3600) as u8;
        if hour < 9 || hour >= 17 {
            return Err("Transfers only allowed during business hours (9-17 UTC)");
        }
        if amount > self.max_amount {
            return Err("Transfer exceeds maximum allowed amount");
        }
        if self.blocklist.iter().any(|blocked| blocked == sender) {
            return Err("Sender is blocklisted");
        }
        Ok(())
    }
}`,
      testCases: [
        { id: "t1", name: "Enforces business hours (9-17 UTC)", input: "", expectedOutput: "" },
        { id: "t2", name: "Enforces max transfer amount", input: "", expectedOutput: "" },
        { id: "t3", name: "Checks sender against blocklist", input: "", expectedOutput: "" },
        { id: "t4", name: "Returns Ok for valid transfers", input: "", expectedOutput: "" },
      ],
      hints: [
        "UTC hour = (timestamp % 86400) / 3600",
        "Check hour >= 9 && hour < 17 for business hours",
        "Iterate blocklist and compare sender bytes",
      ],
    },
  },
  {
    id: "hard-8",
    title: "Weighted Token Distribution",
    description: "Calculate proportional token distribution to multiple recipients based on shares.",
    difficulty: "hard",
    category: "tokens",
    language: "typescript",
    xpReward: 50,
    tags: ["distribution", "rounding", "precision"],
    challenge: {
      language: "typescript",
      prompt: "Write a function that distributes an exact total token amount to recipients by weight. Handle rounding so no tokens are lost or created — give remainder dust to the largest share holder. All values are bigint.",
      starterCode: `interface Recipient {
  address: string;
  weight: bigint;
}

interface Distribution {
  address: string;
  amount: bigint;
}

function distributeTokens(
  totalAmount: bigint,
  recipients: Recipient[],
): Distribution[] {
  // Your code here — total of amounts must equal totalAmount exactly
}`,
      solution: `interface Recipient {
  address: string;
  weight: bigint;
}

interface Distribution {
  address: string;
  amount: bigint;
}

function distributeTokens(
  totalAmount: bigint,
  recipients: Recipient[],
): Distribution[] {
  const totalWeight = recipients.reduce((sum, r) => sum + r.weight, 0n);
  if (totalWeight === 0n) return recipients.map((r) => ({ address: r.address, amount: 0n }));

  const results: Distribution[] = recipients.map((r) => ({
    address: r.address,
    amount: (totalAmount * r.weight) / totalWeight,
  }));

  const distributed = results.reduce((sum, r) => sum + r.amount, 0n);
  const remainder = totalAmount - distributed;

  if (remainder > 0n) {
    let maxIdx = 0;
    for (let i = 1; i < recipients.length; i++) {
      if (recipients[i].weight > recipients[maxIdx].weight) maxIdx = i;
    }
    results[maxIdx].amount += remainder;
  }

  return results;
}`,
      testCases: [
        { id: "t1", name: "Distributes proportionally by weight", input: "", expectedOutput: "" },
        { id: "t2", name: "Sum of distributions equals totalAmount exactly", input: "", expectedOutput: "" },
        { id: "t3", name: "Assigns remainder to largest weight holder", input: "", expectedOutput: "" },
      ],
      hints: [
        "Each share = totalAmount * weight / totalWeight (integer division floors)",
        "Calculate remainder = totalAmount - sum of all shares",
        "Give remainder to the recipient with the largest weight",
      ],
    },
  },

  // --- CPI HARD ---
  {
    id: "hard-9",
    title: "CPI Guard: Validate Target Program",
    description: "Implement a CPI safety wrapper that validates the target program before invoking.",
    difficulty: "hard",
    category: "cpi",
    language: "rust",
    xpReward: 50,
    tags: ["cpi", "guard", "safety"],
    challenge: {
      language: "rust",
      prompt: "Write a safe_invoke wrapper that: (1) validates the instruction's program_id matches the expected program account, (2) checks that none of the passed accounts are owned by the invoking program (prevent re-entrancy into self), (3) then calls invoke.",
      starterCode: `use solana_program::{
    account_info::AccountInfo,
    entrypoint::ProgramResult,
    instruction::Instruction,
    program::invoke,
    program_error::ProgramError,
    pubkey::Pubkey,
};

pub fn safe_invoke<'a>(
    instruction: &Instruction,
    accounts: &[AccountInfo<'a>],
    expected_program: &Pubkey,
    self_program_id: &Pubkey,
) -> ProgramResult {
    // Your code here
}`,
      solution: `use solana_program::{
    account_info::AccountInfo,
    entrypoint::ProgramResult,
    instruction::Instruction,
    program::invoke,
    program_error::ProgramError,
    pubkey::Pubkey,
};

pub fn safe_invoke<'a>(
    instruction: &Instruction,
    accounts: &[AccountInfo<'a>],
    expected_program: &Pubkey,
    self_program_id: &Pubkey,
) -> ProgramResult {
    if instruction.program_id != *expected_program {
        return Err(ProgramError::IncorrectProgramId);
    }
    for account in accounts.iter() {
        if account.owner == self_program_id && account.is_writable {
            return Err(ProgramError::InvalidAccountData);
        }
    }
    invoke(instruction, accounts)
}`,
      testCases: [
        { id: "t1", name: "Validates instruction program_id", input: "", expectedOutput: "" },
        { id: "t2", name: "Checks for self-owned writable accounts (re-entrancy)", input: "", expectedOutput: "" },
        { id: "t3", name: "Calls invoke on success", input: "", expectedOutput: "" },
      ],
      hints: [
        "Compare instruction.program_id with expected_program",
        "A CPI can re-enter your program if it passes your accounts as writable",
        "Check account.owner == self_program_id && account.is_writable",
      ],
    },
  },
  {
    id: "hard-10",
    title: "Recursive CPI Depth Tracker",
    description: "Track CPI depth to prevent excessive recursion in composed programs.",
    difficulty: "hard",
    category: "cpi",
    language: "rust",
    xpReward: 50,
    tags: ["cpi", "recursion", "depth"],
    challenge: {
      language: "rust",
      prompt: "Write a struct that tracks CPI invocation depth stored in account data. Implement enter() which increments depth and fails if > max_depth, and exit() which decrements. This prevents deep CPI chains from exhausting compute budget.",
      starterCode: `use solana_program::program_error::ProgramError;

pub struct CpiDepthTracker {
    // Your fields here
}

impl CpiDepthTracker {
    pub fn new(max_depth: u8) -> Self {
        // Your code here
    }

    pub fn enter(&mut self) -> Result<(), ProgramError> {
        // Your code here
    }

    pub fn exit(&mut self) -> Result<(), ProgramError> {
        // Your code here
    }

    pub fn current_depth(&self) -> u8 {
        // Your code here
    }
}`,
      solution: `use solana_program::program_error::ProgramError;

pub struct CpiDepthTracker {
    pub current: u8,
    pub max_depth: u8,
}

impl CpiDepthTracker {
    pub fn new(max_depth: u8) -> Self {
        Self { current: 0, max_depth }
    }

    pub fn enter(&mut self) -> Result<(), ProgramError> {
        self.current = self.current.checked_add(1).ok_or(ProgramError::ArithmeticOverflow)?;
        if self.current > self.max_depth {
            return Err(ProgramError::InvalidInstructionData);
        }
        Ok(())
    }

    pub fn exit(&mut self) -> Result<(), ProgramError> {
        self.current = self.current.checked_sub(1).ok_or(ProgramError::ArithmeticOverflow)?;
        Ok(())
    }

    pub fn current_depth(&self) -> u8 {
        self.current
    }
}`,
      testCases: [
        { id: "t1", name: "enter() increments depth with checked_add", input: "", expectedOutput: "" },
        { id: "t2", name: "enter() fails when exceeding max_depth", input: "", expectedOutput: "" },
        { id: "t3", name: "exit() decrements with checked_sub", input: "", expectedOutput: "" },
      ],
      hints: [
        "Use checked_add and checked_sub to prevent overflow",
        "Return error if current > max_depth after increment",
        "Solana has a max CPI depth of 4 natively",
      ],
    },
  },

  // --- SERIALIZATION HARD ---
  {
    id: "hard-11",
    title: "TLV (Type-Length-Value) Parser",
    description: "Parse a TLV-encoded account data buffer used by Token-2022 extensions.",
    difficulty: "hard",
    category: "serialization",
    language: "typescript",
    xpReward: 50,
    tags: ["tlv", "token-2022", "parsing"],
    challenge: {
      language: "typescript",
      prompt: "Write a TLV parser that reads extension data from a Token-2022 account. Each TLV entry has: 2-byte type (u16 LE), 2-byte length (u16 LE), then `length` bytes of value. Parse all entries from a buffer and return them as an array.",
      starterCode: `interface TLVEntry {
  type: number;
  length: number;
  value: Uint8Array;
}

function parseTLV(data: Buffer, startOffset: number): TLVEntry[] {
  // Your code here
}`,
      solution: `interface TLVEntry {
  type: number;
  length: number;
  value: Uint8Array;
}

function parseTLV(data: Buffer, startOffset: number): TLVEntry[] {
  const entries: TLVEntry[] = [];
  let offset = startOffset;

  while (offset + 4 <= data.length) {
    const type = data.readUInt16LE(offset);
    const length = data.readUInt16LE(offset + 2);
    offset += 4;

    if (offset + length > data.length) break;

    const value = data.subarray(offset, offset + length);
    entries.push({ type, length, value });
    offset += length;
  }

  return entries;
}`,
      testCases: [
        { id: "t1", name: "Reads u16 LE type and length", input: "", expectedOutput: "" },
        { id: "t2", name: "Extracts value bytes correctly", input: "", expectedOutput: "" },
        { id: "t3", name: "Handles multiple TLV entries", input: "", expectedOutput: "" },
        { id: "t4", name: "Stops gracefully at buffer boundary", input: "", expectedOutput: "" },
      ],
      hints: [
        "Each entry header is 4 bytes: u16 type + u16 length",
        "Read values with data.subarray(offset, offset + length)",
        "Break if remaining buffer is too small for another header or value",
      ],
    },
  },
  {
    id: "hard-12",
    title: "Account Discriminator Verification",
    description: "Implement Anchor-style 8-byte discriminator calculation and verification.",
    difficulty: "hard",
    category: "serialization",
    language: "typescript",
    xpReward: 50,
    tags: ["discriminator", "anchor", "sha256"],
    challenge: {
      language: "typescript",
      prompt: "Write functions that: (1) compute an Anchor account discriminator (first 8 bytes of SHA-256 of 'account:<AccountName>'), and (2) verify that account data starts with the expected discriminator. Use the provided sha256 hash function.",
      starterCode: `function computeDiscriminator(
  accountName: string,
  sha256: (input: string) => Uint8Array,
): Uint8Array {
  // Your code here
}

function verifyDiscriminator(
  data: Buffer,
  expectedDiscriminator: Uint8Array,
): boolean {
  // Your code here
}`,
      solution: `function computeDiscriminator(
  accountName: string,
  sha256: (input: string) => Uint8Array,
): Uint8Array {
  const hash = sha256(\`account:\${accountName}\`);
  return hash.slice(0, 8);
}

function verifyDiscriminator(
  data: Buffer,
  expectedDiscriminator: Uint8Array,
): boolean {
  if (data.length < 8) return false;
  for (let i = 0; i < 8; i++) {
    if (data[i] !== expectedDiscriminator[i]) return false;
  }
  return true;
}`,
      testCases: [
        { id: "t1", name: "Hashes 'account:<Name>' prefix", input: "", expectedOutput: "" },
        { id: "t2", name: "Takes first 8 bytes of hash", input: "", expectedOutput: "" },
        { id: "t3", name: "Byte-compares data[0..8] with discriminator", input: "", expectedOutput: "" },
      ],
      hints: [
        "Anchor discriminator = SHA-256('account:<StructName>')[0..8]",
        "Note the prefix is 'account:' (with colon)",
        "Compare byte-by-byte; Buffer length must be >= 8",
      ],
    },
  },

  // --- SECURITY HARD ---
  {
    id: "hard-13",
    title: "Flash Loan Attack Detector",
    description: "Implement checks to detect and prevent flash loan manipulation in a DeFi program.",
    difficulty: "hard",
    category: "security",
    language: "rust",
    xpReward: 50,
    tags: ["flash-loan", "oracle", "manipulation"],
    challenge: {
      language: "rust",
      prompt: "Write a function that detects potential flash loan attacks by comparing a spot price against a TWAP (time-weighted average price). If the deviation exceeds a threshold (e.g., 10%), reject the transaction. Track last_price, cumulative_price, and last_update_time.",
      starterCode: `pub struct PriceOracle {
    // Your fields here
}

impl PriceOracle {
    pub fn new(initial_price: u64, timestamp: i64) -> Self {
        // Your code here
    }

    pub fn update(&mut self, new_price: u64, timestamp: i64) {
        // Your code here
    }

    pub fn twap(&self, current_timestamp: i64) -> u64 {
        // Your code here
    }

    pub fn is_price_valid(&self, spot_price: u64, current_timestamp: i64, max_deviation_bps: u64) -> bool {
        // Your code here — max_deviation_bps is in basis points (100 = 1%)
    }
}`,
      solution: `pub struct PriceOracle {
    pub last_price: u64,
    pub cumulative_price: u128,
    pub last_update_time: i64,
    pub start_time: i64,
}

impl PriceOracle {
    pub fn new(initial_price: u64, timestamp: i64) -> Self {
        Self {
            last_price: initial_price,
            cumulative_price: 0,
            last_update_time: timestamp,
            start_time: timestamp,
        }
    }

    pub fn update(&mut self, new_price: u64, timestamp: i64) {
        let elapsed = (timestamp - self.last_update_time) as u128;
        self.cumulative_price += self.last_price as u128 * elapsed;
        self.last_price = new_price;
        self.last_update_time = timestamp;
    }

    pub fn twap(&self, current_timestamp: i64) -> u64 {
        let elapsed_since_update = (current_timestamp - self.last_update_time) as u128;
        let total_cumulative = self.cumulative_price + self.last_price as u128 * elapsed_since_update;
        let total_time = (current_timestamp - self.start_time) as u128;
        if total_time == 0 {
            return self.last_price;
        }
        (total_cumulative / total_time) as u64
    }

    pub fn is_price_valid(&self, spot_price: u64, current_timestamp: i64, max_deviation_bps: u64) -> bool {
        let twap = self.twap(current_timestamp);
        if twap == 0 { return false; }
        let diff = if spot_price > twap { spot_price - twap } else { twap - spot_price };
        let deviation_bps = diff.checked_mul(10_000).unwrap_or(u64::MAX) / twap;
        deviation_bps <= max_deviation_bps
    }
}`,
      testCases: [
        { id: "t1", name: "Tracks cumulative price over time", input: "", expectedOutput: "" },
        { id: "t2", name: "Computes TWAP correctly", input: "", expectedOutput: "" },
        { id: "t3", name: "Detects deviation exceeding threshold", input: "", expectedOutput: "" },
        { id: "t4", name: "Uses basis points for precision", input: "", expectedOutput: "" },
      ],
      hints: [
        "TWAP = cumulative_price / total_elapsed_time",
        "Update cumulative_price by adding last_price * time_since_last_update",
        "Deviation in bps = |spot - twap| * 10000 / twap",
        "Flash loans cause spot price to deviate sharply from TWAP",
      ],
    },
  },
  {
    id: "hard-14",
    title: "Sandwich Attack Protection",
    description: "Implement slippage protection to guard against sandwich attacks.",
    difficulty: "hard",
    category: "security",
    language: "rust",
    xpReward: 50,
    tags: ["sandwich", "slippage", "mev"],
    challenge: {
      language: "rust",
      prompt: "Write a swap execution function that enforces minimum output (slippage tolerance). Given a pre-computed expected_output and a user-specified max_slippage_bps (basis points), calculate minimum_output and reject if actual output is below it.",
      starterCode: `use solana_program::program_error::ProgramError;

pub struct SwapParams {
    pub amount_in: u64,
    pub expected_output: u64,
    pub max_slippage_bps: u16,
}

pub fn execute_swap(
    params: &SwapParams,
    actual_output: u64,
) -> Result<u64, ProgramError> {
    // Your code here — return actual_output if valid
}`,
      solution: `use solana_program::program_error::ProgramError;

pub struct SwapParams {
    pub amount_in: u64,
    pub expected_output: u64,
    pub max_slippage_bps: u16,
}

pub fn execute_swap(
    params: &SwapParams,
    actual_output: u64,
) -> Result<u64, ProgramError> {
    let slippage_amount = params.expected_output
        .checked_mul(params.max_slippage_bps as u64)
        .ok_or(ProgramError::ArithmeticOverflow)?
        / 10_000;
    let minimum_output = params.expected_output
        .checked_sub(slippage_amount)
        .ok_or(ProgramError::ArithmeticOverflow)?;

    if actual_output < minimum_output {
        return Err(ProgramError::Custom(6001));
    }
    Ok(actual_output)
}`,
      testCases: [
        { id: "t1", name: "Calculates minimum output from slippage bps", input: "", expectedOutput: "" },
        { id: "t2", name: "Rejects swap below minimum output", input: "", expectedOutput: "" },
        { id: "t3", name: "Uses checked arithmetic", input: "", expectedOutput: "" },
        { id: "t4", name: "Returns actual_output on success", input: "", expectedOutput: "" },
      ],
      hints: [
        "minimum_output = expected * (10000 - slippage_bps) / 10000",
        "Or equivalently: minimum = expected - (expected * slippage_bps / 10000)",
        "Use checked_mul and checked_sub to prevent overflow",
        "Return a custom error code for slippage exceeded",
      ],
    },
  },
  {
    id: "hard-15",
    title: "Type Cosplay Attack Prevention",
    description: "Implement discriminator-based type checking to prevent account type confusion.",
    difficulty: "hard",
    category: "security",
    language: "rust",
    xpReward: 50,
    tags: ["type-cosplay", "discriminator", "defense"],
    challenge: {
      language: "rust",
      prompt: "Write a generic deserialization function that first checks an 8-byte discriminator at the start of account data, then deserializes the remaining bytes. This prevents an attacker from passing a different account type that has the same data layout.",
      starterCode: `use solana_program::program_error::ProgramError;
use borsh::BorshDeserialize;

pub trait Discriminator {
    const DISCRIMINATOR: [u8; 8];
}

pub fn deserialize_checked<T: BorshDeserialize + Discriminator>(
    data: &[u8],
) -> Result<T, ProgramError> {
    // Your code here
}`,
      solution: `use solana_program::program_error::ProgramError;
use borsh::BorshDeserialize;

pub trait Discriminator {
    const DISCRIMINATOR: [u8; 8];
}

pub fn deserialize_checked<T: BorshDeserialize + Discriminator>(
    data: &[u8],
) -> Result<T, ProgramError> {
    if data.len() < 8 {
        return Err(ProgramError::InvalidAccountData);
    }
    let disc = &data[..8];
    if disc != T::DISCRIMINATOR {
        return Err(ProgramError::InvalidAccountData);
    }
    T::try_from_slice(&data[8..]).map_err(|_| ProgramError::InvalidAccountData)
}`,
      testCases: [
        { id: "t1", name: "Checks data length >= 8", input: "", expectedOutput: "" },
        { id: "t2", name: "Compares discriminator bytes", input: "", expectedOutput: "" },
        { id: "t3", name: "Deserializes from offset 8 on match", input: "", expectedOutput: "" },
        { id: "t4", name: "Returns InvalidAccountData on mismatch", input: "", expectedOutput: "" },
      ],
      hints: [
        "First 8 bytes = discriminator, remaining bytes = Borsh data",
        "Compare &data[..8] with T::DISCRIMINATOR",
        "Use T::try_from_slice(&data[8..]) for deserialization",
        "Type cosplay: attacker crafts data of type A to match type B's layout",
      ],
    },
  },

  // --- ANCHOR HARD ---
  {
    id: "hard-16",
    title: "Anchor Remaining Accounts Iterator",
    description: "Process a variable number of remaining_accounts in an Anchor instruction.",
    difficulty: "hard",
    category: "anchor",
    language: "rust",
    xpReward: 50,
    tags: ["anchor", "remaining-accounts", "dynamic"],
    challenge: {
      language: "rust",
      prompt: "Write an Anchor instruction handler that processes remaining_accounts as pairs of (token_account, destination). Iterate in pairs, validate each token account is owned by SPL Token, and build a list of transfer amounts. Return error if odd number of remaining accounts.",
      starterCode: `use anchor_lang::prelude::*;

pub fn process_batch_transfers(ctx: Context<BatchTransfer>) -> Result<Vec<(Pubkey, Pubkey, u64)>> {
    // Your code here
    // remaining_accounts come in pairs: [source_token, dest_token, source_token, dest_token, ...]
    // Read the balance from each source (first 8 bytes after 32-byte discriminator area = offset 64)
    // Return Vec of (source, dest, amount)
}`,
      solution: `use anchor_lang::prelude::*;

pub fn process_batch_transfers(ctx: Context<BatchTransfer>) -> Result<Vec<(Pubkey, Pubkey, u64)>> {
    let remaining = &ctx.remaining_accounts;
    if remaining.len() % 2 != 0 {
        return Err(error!(ErrorCode::InvalidRemainingAccounts));
    }

    let spl_token_id = anchor_spl::token::ID;
    let mut transfers = Vec::new();

    for chunk in remaining.chunks(2) {
        let source = &chunk[0];
        let dest = &chunk[1];

        require!(source.owner == &spl_token_id, ErrorCode::InvalidTokenAccount);
        require!(dest.owner == &spl_token_id, ErrorCode::InvalidTokenAccount);

        let data = source.try_borrow_data()?;
        let amount = u64::from_le_bytes(data[64..72].try_into().unwrap());

        transfers.push((*source.key, *dest.key, amount));
    }

    Ok(transfers)
}`,
      testCases: [
        { id: "t1", name: "Validates remaining_accounts length is even", input: "", expectedOutput: "" },
        { id: "t2", name: "Checks token account ownership", input: "", expectedOutput: "" },
        { id: "t3", name: "Reads amount from account data", input: "", expectedOutput: "" },
        { id: "t4", name: "Returns Vec of (source, dest, amount) tuples", input: "", expectedOutput: "" },
      ],
      hints: [
        "Use remaining_accounts.chunks(2) to iterate in pairs",
        "Verify each account's owner is the SPL Token program",
        "Token account amount is at byte offset 64 (after mint + owner)",
        "Return error if odd number of accounts",
      ],
    },
  },
  {
    id: "hard-17",
    title: "Anchor Close Account with Constraints",
    description: "Implement a close instruction with multi-condition constraints in Anchor.",
    difficulty: "hard",
    category: "anchor",
    language: "rust",
    xpReward: 50,
    tags: ["anchor", "close", "constraints"],
    challenge: {
      language: "rust",
      prompt: "Define an Anchor Accounts struct for closing a vault account. Constraints: (1) vault must have zero token balance, (2) only the vault's authority can close it, (3) lamports refund to the authority, (4) use Anchor's close constraint.",
      starterCode: `use anchor_lang::prelude::*;

#[account]
pub struct Vault {
    pub authority: Pubkey,
    pub token_balance: u64,
    pub created_at: i64,
    pub bump: u8,
}

// Define CloseVault accounts struct with all constraints`,
      solution: `use anchor_lang::prelude::*;

#[account]
pub struct Vault {
    pub authority: Pubkey,
    pub token_balance: u64,
    pub created_at: i64,
    pub bump: u8,
}

#[derive(Accounts)]
pub struct CloseVault<'info> {
    #[account(
        mut,
        has_one = authority,
        constraint = vault.token_balance == 0 @ VaultError::NonZeroBalance,
        close = authority,
    )]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

#[error_code]
pub enum VaultError {
    #[msg("Cannot close vault with non-zero token balance")]
    NonZeroBalance,
}`,
      testCases: [
        { id: "t1", name: "Uses has_one = authority constraint", input: "", expectedOutput: "" },
        { id: "t2", name: "Checks token_balance == 0 with custom error", input: "", expectedOutput: "" },
        { id: "t3", name: "Uses close = authority for rent refund", input: "", expectedOutput: "" },
        { id: "t4", name: "Defines custom error enum", input: "", expectedOutput: "" },
      ],
      hints: [
        "close = authority automatically drains lamports and zeros data",
        "constraint = expr @ ErrorType::Variant for custom error messages",
        "has_one = authority verifies vault.authority == authority.key()",
        "Define a custom error enum with #[error_code]",
      ],
    },
  },

  // --- DEFI HARD ---
  {
    id: "hard-18",
    title: "Concentrated Liquidity Position",
    description: "Calculate liquidity for a concentrated position within a price range (Uniswap V3 style).",
    difficulty: "hard",
    category: "defi",
    language: "typescript",
    xpReward: 50,
    tags: ["clmm", "concentrated-liquidity", "tick-math"],
    challenge: {
      language: "typescript",
      prompt: "Write a function that calculates the liquidity value for a concentrated position given: current price (sqrtPriceX64), lower tick price, upper tick price, and token amounts. Use the formula: L = amountA * (sqrtUpper * sqrtLower) / (sqrtUpper - sqrtLower) when price is below range.",
      starterCode: `function calculateLiquidity(
  sqrtPriceCurrent: bigint,
  sqrtPriceLower: bigint,
  sqrtPriceUpper: bigint,
  amountA: bigint,
  amountB: bigint,
): bigint {
  // Your code here
  // If current < lower: all token A, use amountA formula
  // If current > upper: all token B, use amountB formula
  // If between: use min of both
}`,
      solution: `function calculateLiquidity(
  sqrtPriceCurrent: bigint,
  sqrtPriceLower: bigint,
  sqrtPriceUpper: bigint,
  amountA: bigint,
  amountB: bigint,
): bigint {
  if (sqrtPriceCurrent <= sqrtPriceLower) {
    return amountA * sqrtPriceUpper * sqrtPriceLower / (sqrtPriceUpper - sqrtPriceLower);
  }
  if (sqrtPriceCurrent >= sqrtPriceUpper) {
    return amountB / (sqrtPriceUpper - sqrtPriceLower);
  }
  const liqA = amountA * sqrtPriceUpper * sqrtPriceCurrent / (sqrtPriceUpper - sqrtPriceCurrent);
  const liqB = amountB / (sqrtPriceCurrent - sqrtPriceLower);
  return liqA < liqB ? liqA : liqB;
}`,
      testCases: [
        { id: "t1", name: "Handles price below range (all token A)", input: "", expectedOutput: "" },
        { id: "t2", name: "Handles price above range (all token B)", input: "", expectedOutput: "" },
        { id: "t3", name: "Handles price within range (min of both)", input: "", expectedOutput: "" },
      ],
      hints: [
        "Below range: position is entirely token A",
        "Above range: position is entirely token B",
        "In range: take the minimum of both liquidity calculations",
        "L_a = amountA * sqrtUpper * sqrtCurrent / (sqrtUpper - sqrtCurrent)",
      ],
    },
  },
  {
    id: "hard-19",
    title: "Oracle-Based Liquidation Engine",
    description: "Build a multi-collateral liquidation engine with oracle price feeds.",
    difficulty: "hard",
    category: "defi",
    language: "typescript",
    xpReward: 50,
    tags: ["liquidation", "oracle", "multi-collateral"],
    challenge: {
      language: "typescript",
      prompt: "Write a function that evaluates a multi-collateral lending position. Given arrays of collateral (amount, price, LTV%) and debts (amount, price), compute total collateral value (adjusted by LTV), total debt, health factor, and whether it's liquidatable. Health factor < 1.0 = liquidatable.",
      starterCode: `interface Collateral {
  amount: bigint;
  priceUsd: bigint;  // 6 decimal precision (1 USD = 1_000_000)
  ltvBps: number;    // basis points (8000 = 80%)
}

interface Debt {
  amount: bigint;
  priceUsd: bigint;
}

interface PositionHealth {
  totalCollateralUsd: bigint;
  adjustedCollateralUsd: bigint;
  totalDebtUsd: bigint;
  healthFactor: number;
  isLiquidatable: boolean;
}

function evaluatePosition(collaterals: Collateral[], debts: Debt[]): PositionHealth {
  // Your code here
}`,
      solution: `interface Collateral {
  amount: bigint;
  priceUsd: bigint;
  ltvBps: number;
}

interface Debt {
  amount: bigint;
  priceUsd: bigint;
}

interface PositionHealth {
  totalCollateralUsd: bigint;
  adjustedCollateralUsd: bigint;
  totalDebtUsd: bigint;
  healthFactor: number;
  isLiquidatable: boolean;
}

function evaluatePosition(collaterals: Collateral[], debts: Debt[]): PositionHealth {
  let totalCollateralUsd = 0n;
  let adjustedCollateralUsd = 0n;
  for (const c of collaterals) {
    const value = c.amount * c.priceUsd / 1_000_000n;
    totalCollateralUsd += value;
    adjustedCollateralUsd += value * BigInt(c.ltvBps) / 10_000n;
  }

  let totalDebtUsd = 0n;
  for (const d of debts) {
    totalDebtUsd += d.amount * d.priceUsd / 1_000_000n;
  }

  const healthFactor = totalDebtUsd === 0n
    ? Infinity
    : Number(adjustedCollateralUsd * 10_000n / totalDebtUsd) / 10_000;

  return {
    totalCollateralUsd,
    adjustedCollateralUsd,
    totalDebtUsd,
    healthFactor,
    isLiquidatable: healthFactor < 1.0,
  };
}`,
      testCases: [
        { id: "t1", name: "Sums collateral values with LTV adjustment", input: "", expectedOutput: "" },
        { id: "t2", name: "Sums debt values", input: "", expectedOutput: "" },
        { id: "t3", name: "Computes health factor = adjustedCollateral / debt", input: "", expectedOutput: "" },
        { id: "t4", name: "isLiquidatable when health factor < 1.0", input: "", expectedOutput: "" },
      ],
      hints: [
        "Collateral USD value = amount * price / 1_000_000 (normalize decimals)",
        "Adjusted = value * ltvBps / 10000 (e.g., 80% LTV = 8000 bps)",
        "Health factor = adjusted_collateral / total_debt",
        "Liquidatable when health factor < 1.0",
      ],
    },
  },

  // --- ADVANCED HARD ---
  {
    id: "hard-20",
    title: "Custom Account Compression",
    description: "Implement a compact serialization format that packs multiple small values into minimal bytes.",
    difficulty: "hard",
    category: "advanced",
    language: "rust",
    xpReward: 50,
    tags: ["compression", "packing", "optimization"],
    challenge: {
      language: "rust",
      prompt: "Write pack and unpack functions for a UserStats struct that compresses: level (u8, max 255), streak (u16, max 65535), achievements (u32 bitmap), and last_active (u32 UTC day) into exactly 9 bytes. Use bit-level packing.",
      starterCode: `pub struct UserStats {
    pub level: u8,
    pub streak: u16,
    pub achievements: u32,
    pub last_active: u32,
}

impl UserStats {
    pub fn pack(&self) -> [u8; 9] {
        // Your code here
    }

    pub fn unpack(data: &[u8; 9]) -> Self {
        // Your code here
    }
}`,
      solution: `pub struct UserStats {
    pub level: u8,
    pub streak: u16,
    pub achievements: u32,
    pub last_active: u32,
}

impl UserStats {
    pub fn pack(&self) -> [u8; 9] {
        let mut buf = [0u8; 9];
        buf[0] = self.level;
        buf[1..3].copy_from_slice(&self.streak.to_le_bytes());
        buf[3..7].copy_from_slice(&self.achievements.to_le_bytes());
        let day_bytes = &self.last_active.to_le_bytes();
        buf[7] = day_bytes[0];
        buf[8] = day_bytes[1];
        buf
    }

    pub fn unpack(data: &[u8; 9]) -> Self {
        let level = data[0];
        let streak = u16::from_le_bytes([data[1], data[2]]);
        let achievements = u32::from_le_bytes([data[3], data[4], data[5], data[6]]);
        let last_active = u16::from_le_bytes([data[7], data[8]]) as u32;
        Self { level, streak, achievements, last_active }
    }
}`,
      testCases: [
        { id: "t1", name: "pack() produces exactly 9 bytes", input: "", expectedOutput: "" },
        { id: "t2", name: "unpack() reconstructs all fields", input: "", expectedOutput: "" },
        { id: "t3", name: "Uses little-endian byte order", input: "", expectedOutput: "" },
      ],
      hints: [
        "1 byte level + 2 bytes streak + 4 bytes achievements + 2 bytes last_active = 9",
        "Use to_le_bytes() and from_le_bytes() for multi-byte fields",
        "copy_from_slice for writing into the buffer",
        "last_active only needs 2 bytes if stored as days since epoch (fits ~179 years)",
      ],
    },
  },
  {
    id: "hard-21",
    title: "Concurrent Merkle Tree Append",
    description: "Implement the append logic for a concurrent Merkle tree used by Bubblegum.",
    difficulty: "hard",
    category: "advanced",
    language: "typescript",
    xpReward: 50,
    tags: ["merkle", "concurrent", "bubblegum"],
    challenge: {
      language: "typescript",
      prompt: "Write a function that appends a leaf to a Merkle tree by computing the new root. Given the leaf, the tree depth, and the current rightmost proof (sibling hashes from leaf to root), compute the new root by hashing up from the leaf. At each level, the new leaf is on the right if the index is odd, left if even.",
      starterCode: `function appendToMerkleTree(
  leaf: Uint8Array,
  index: number,
  proof: Uint8Array[],
  depth: number,
  hashFn: (left: Uint8Array, right: Uint8Array) => Uint8Array,
): Uint8Array {
  // Your code here — return the new root
}`,
      solution: `function appendToMerkleTree(
  leaf: Uint8Array,
  index: number,
  proof: Uint8Array[],
  depth: number,
  hashFn: (left: Uint8Array, right: Uint8Array) => Uint8Array,
): Uint8Array {
  let node = leaf;
  let idx = index;
  for (let level = 0; level < depth; level++) {
    const sibling = proof[level];
    if (idx % 2 === 0) {
      node = hashFn(node, sibling);
    } else {
      node = hashFn(sibling, node);
    }
    idx = Math.floor(idx / 2);
  }
  return node;
}`,
      testCases: [
        { id: "t1", name: "Hashes leaf with siblings up to root", input: "", expectedOutput: "" },
        { id: "t2", name: "Correctly determines left/right position from index", input: "", expectedOutput: "" },
        { id: "t3", name: "Handles full tree depth", input: "", expectedOutput: "" },
      ],
      hints: [
        "At each level: if index is even, node is left child; if odd, right child",
        "Hash(left, right) — order matters!",
        "Divide index by 2 at each level to get parent index",
        "This is the core of Solana's compressed NFT (Bubblegum) design",
      ],
    },
  },
  {
    id: "hard-22",
    title: "CU-Optimized Account Lookup",
    description: "Implement a binary search over sorted on-chain data to minimize compute units.",
    difficulty: "hard",
    category: "advanced",
    language: "rust",
    xpReward: 50,
    tags: ["optimization", "compute-units", "binary-search"],
    challenge: {
      language: "rust",
      prompt: "Write a function that performs binary search on a sorted array of 32-byte entries stored in account data. Each entry is a pubkey. Find the index of a target pubkey, or return None. The data starts at a given offset, entries are contiguous.",
      starterCode: `use solana_program::pubkey::Pubkey;

pub fn binary_search_pubkeys(
    data: &[u8],
    offset: usize,
    count: usize,
    target: &Pubkey,
) -> Option<usize> {
    // Your code here
}`,
      solution: `use solana_program::pubkey::Pubkey;

pub fn binary_search_pubkeys(
    data: &[u8],
    offset: usize,
    count: usize,
    target: &Pubkey,
) -> Option<usize> {
    if count == 0 { return None; }
    let target_bytes = target.to_bytes();
    let mut low = 0usize;
    let mut high = count;

    while low < high {
        let mid = low + (high - low) / 2;
        let entry_start = offset + mid * 32;
        let entry = &data[entry_start..entry_start + 32];

        match entry.cmp(&target_bytes) {
            std::cmp::Ordering::Equal => return Some(mid),
            std::cmp::Ordering::Less => low = mid + 1,
            std::cmp::Ordering::Greater => high = mid,
        }
    }
    None
}`,
      testCases: [
        { id: "t1", name: "Performs binary search (O(log n))", input: "", expectedOutput: "" },
        { id: "t2", name: "Reads 32-byte entries at correct offsets", input: "", expectedOutput: "" },
        { id: "t3", name: "Returns Some(index) on match, None on miss", input: "", expectedOutput: "" },
      ],
      hints: [
        "Each entry is 32 bytes (Pubkey size), so entry_start = offset + index * 32",
        "Use slice comparison: entry.cmp(&target_bytes)",
        "Binary search is O(log n) — crucial for staying within CU limits",
        "Avoid linear scan — 1000 entries would cost ~100K CU linearly vs ~10K binary",
      ],
    },
  },
  {
    id: "hard-23",
    title: "On-Chain Proposal State Machine",
    description: "Build a Solana program instruction processor that transitions proposal state on-chain with PDA validation, time guards, and vote quorum checks.",
    difficulty: "hard",
    category: "advanced",
    language: "rust",
    xpReward: 50,
    tags: ["state-machine", "governance", "on-chain", "pda"],
    challenge: {
      language: "rust",
      prompt: "Implement process_transition(): a Solana program instruction processor that transitions a proposal account between states on-chain. The proposal PDA is derived from [\"proposal\", proposal_id]. Deserialize the account, validate the authority signer, enforce valid state transitions with time-based guards (Clock sysvar) and quorum checks from instruction data, then serialize the updated state back.",
      starterCode: `use solana_program::{
    account_info::{next_account_info, AccountInfo},
    clock::Clock,
    entrypoint::ProgramResult,
    program_error::ProgramError,
    pubkey::Pubkey,
    sysvar::Sysvar,
};

#[repr(u8)]
#[derive(Clone, Copy, PartialEq)]
pub enum ProposalState {
    Draft = 0,
    Active = 1,
    Succeeded = 2,
    Defeated = 3,
    Executed = 4,
    Cancelled = 5,
}

impl ProposalState {
    fn from_u8(v: u8) -> Result<Self, ProgramError> {
        match v {
            0 => Ok(Self::Draft),
            1 => Ok(Self::Active),
            2 => Ok(Self::Succeeded),
            3 => Ok(Self::Defeated),
            4 => Ok(Self::Executed),
            5 => Ok(Self::Cancelled),
            _ => Err(ProgramError::InvalidInstructionData),
        }
    }
}

// Proposal account data layout (88 bytes):
//   [0]      state: u8
//   [1..9]   activated_at: i64 (LE)
//   [9..17]  voting_period: i64 (LE)
//   [17..25] execution_delay: i64 (LE)
//   [25..33] yes_votes: u64 (LE)
//   [33..41] no_votes: u64 (LE)
//   [41..49] quorum: u64 (LE)
//   [49..81] authority: Pubkey
//   [81..85] proposal_id: u32 (LE)
//   [85..86] bump: u8
//   [86..88] reserved

// Instruction data: [0] = target_state: u8

// Accounts:
//   0: proposal (writable, PDA)
//   1: authority (signer)
//   2: clock sysvar

pub fn process_transition(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    // Your code here
}`,
      solution: `use solana_program::{
    account_info::{next_account_info, AccountInfo},
    clock::Clock,
    entrypoint::ProgramResult,
    program_error::ProgramError,
    pubkey::Pubkey,
    sysvar::Sysvar,
};

#[repr(u8)]
#[derive(Clone, Copy, PartialEq)]
pub enum ProposalState {
    Draft = 0,
    Active = 1,
    Succeeded = 2,
    Defeated = 3,
    Executed = 4,
    Cancelled = 5,
}

impl ProposalState {
    fn from_u8(v: u8) -> Result<Self, ProgramError> {
        match v {
            0 => Ok(Self::Draft),
            1 => Ok(Self::Active),
            2 => Ok(Self::Succeeded),
            3 => Ok(Self::Defeated),
            4 => Ok(Self::Executed),
            5 => Ok(Self::Cancelled),
            _ => Err(ProgramError::InvalidInstructionData),
        }
    }
}

pub fn process_transition(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    if instruction_data.is_empty() {
        return Err(ProgramError::InvalidInstructionData);
    }

    let accounts_iter = &mut accounts.iter();
    let proposal_info = next_account_info(accounts_iter)?;
    let authority_info = next_account_info(accounts_iter)?;
    let clock_info = next_account_info(accounts_iter)?;

    if !authority_info.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    if proposal_info.owner != program_id {
        return Err(ProgramError::IncorrectProgramId);
    }

    let clock = Clock::from_account_info(clock_info)?;
    let current_time = clock.unix_timestamp;

    let data = proposal_info.try_borrow_data()?;
    if data.len() < 88 {
        return Err(ProgramError::InvalidAccountData);
    }

    let current_state = ProposalState::from_u8(data[0])?;
    let activated_at = i64::from_le_bytes(data[1..9].try_into().unwrap());
    let voting_period = i64::from_le_bytes(data[9..17].try_into().unwrap());
    let execution_delay = i64::from_le_bytes(data[17..25].try_into().unwrap());
    let yes_votes = u64::from_le_bytes(data[25..33].try_into().unwrap());
    let no_votes = u64::from_le_bytes(data[33..41].try_into().unwrap());
    let quorum = u64::from_le_bytes(data[41..49].try_into().unwrap());
    let authority = Pubkey::try_from(&data[49..81]).unwrap();
    let proposal_id = u32::from_le_bytes(data[81..85].try_into().unwrap());
    let bump = data[85];
    drop(data);

    if authority != *authority_info.key {
        return Err(ProgramError::InvalidAccountData);
    }

    let seeds = [b"proposal", &proposal_id.to_le_bytes()[..], &[bump]];
    let expected_pda = Pubkey::create_program_address(&seeds, program_id)?;
    if expected_pda != *proposal_info.key {
        return Err(ProgramError::InvalidSeeds);
    }

    let target_state = ProposalState::from_u8(instruction_data[0])?;

    let new_activated_at = match (current_state, target_state) {
        (ProposalState::Draft, ProposalState::Active) => {
            current_time
        }
        (ProposalState::Draft, ProposalState::Cancelled) => {
            activated_at
        }
        (ProposalState::Active, ProposalState::Succeeded) => {
            if current_time < activated_at.checked_add(voting_period)
                .ok_or(ProgramError::ArithmeticOverflow)? {
                return Err(ProgramError::Custom(1));
            }
            if yes_votes.checked_add(no_votes)
                .ok_or(ProgramError::ArithmeticOverflow)? < quorum {
                return Err(ProgramError::Custom(2));
            }
            if yes_votes <= no_votes {
                return Err(ProgramError::Custom(3));
            }
            activated_at
        }
        (ProposalState::Active, ProposalState::Defeated) => {
            if current_time < activated_at.checked_add(voting_period)
                .ok_or(ProgramError::ArithmeticOverflow)? {
                return Err(ProgramError::Custom(1));
            }
            activated_at
        }
        (ProposalState::Succeeded, ProposalState::Executed) => {
            let deadline = activated_at
                .checked_add(voting_period)
                .and_then(|v| v.checked_add(execution_delay))
                .ok_or(ProgramError::ArithmeticOverflow)?;
            if current_time < deadline {
                return Err(ProgramError::Custom(4));
            }
            activated_at
        }
        _ => return Err(ProgramError::InvalidInstructionData),
    };

    let mut data = proposal_info.try_borrow_mut_data()?;
    data[0] = target_state as u8;
    data[1..9].copy_from_slice(&new_activated_at.to_le_bytes());

    Ok(())
}`,
      testCases: [
        { id: "t1", name: "Validates PDA derivation and authority signer", input: "", expectedOutput: "" },
        { id: "t2", name: "Transitions Draft -> Active and stores activated_at from Clock", input: "", expectedOutput: "" },
        { id: "t3", name: "Rejects Active -> Succeeded before voting period ends", input: "", expectedOutput: "" },
        { id: "t4", name: "Validates quorum and yes > no votes for Succeeded", input: "", expectedOutput: "" },
        { id: "t5", name: "Enforces execution delay for Succeeded -> Executed", input: "", expectedOutput: "" },
        { id: "t6", name: "Rejects invalid transitions with ProgramError", input: "", expectedOutput: "" },
      ],
      hints: [
        "Parse accounts with next_account_info(): proposal (writable PDA), authority (signer), clock sysvar",
        "Verify proposal_info.owner == program_id and authority_info.is_signer",
        "Derive PDA with seeds [\"proposal\", proposal_id.to_le_bytes(), bump] and compare to proposal_info.key",
        "Use Clock::from_account_info() for current_time, then match (current_state, target_state) for transitions",
        "Use checked_add() for all arithmetic — never raw + in on-chain code",
        "Write updated state and activated_at back via try_borrow_mut_data()",
      ],
    },
  },
  {
    id: "hard-24",
    title: "Jito Bundle Builder",
    description: "Construct a Jito MEV bundle with tip transaction for priority execution.",
    difficulty: "hard",
    category: "advanced",
    language: "typescript",
    xpReward: 50,
    tags: ["jito", "mev", "bundle", "tips"],
    challenge: {
      language: "typescript",
      prompt: "Write a function that constructs a Jito bundle: an array of serialized transactions where the last transaction includes a SOL tip to a Jito tip account. The tip transaction transfers lamports from the payer to one of Jito's 8 tip accounts. Return the bundle as base58-encoded strings.",
      starterCode: `import { Transaction, SystemProgram, PublicKey, Keypair } from "@solana/web3.js";
import bs58 from "bs58";

const JITO_TIP_ACCOUNTS = [
  "96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5",
  "HFqU5x63VTqvQss8hp11i4bVqkfRtQ7NmXwkiLtDhSz9",
  "Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY",
  "ADaUMid9yfUytqMBgopwjb2DTLSLw2beT1wBBaquq7E1",
  "DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh",
  "ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt",
  "DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL",
  "3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT",
];

interface BundleResult {
  encodedTransactions: string[];
  tipAccount: string;
  tipAmount: number;
}

function buildJitoBundle(
  transactions: Transaction[],
  payer: Keypair,
  tipLamports: number,
  recentBlockhash: string,
): BundleResult {
  // Your code here
}`,
      solution: `import { Transaction, SystemProgram, PublicKey, Keypair } from "@solana/web3.js";
import bs58 from "bs58";

const JITO_TIP_ACCOUNTS = [
  "96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5",
  "HFqU5x63VTqvQss8hp11i4bVqkfRtQ7NmXwkiLtDhSz9",
  "Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY",
  "ADaUMid9yfUytqMBgopwjb2DTLSLw2beT1wBBaquq7E1",
  "DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh",
  "ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt",
  "DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL",
  "3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT",
];

interface BundleResult {
  encodedTransactions: string[];
  tipAccount: string;
  tipAmount: number;
}

function buildJitoBundle(
  transactions: Transaction[],
  payer: Keypair,
  tipLamports: number,
  recentBlockhash: string,
): BundleResult {
  const tipAccountIdx = Math.floor(Math.random() * JITO_TIP_ACCOUNTS.length);
  const tipAccount = JITO_TIP_ACCOUNTS[tipAccountIdx];

  const tipTx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: new PublicKey(tipAccount),
      lamports: tipLamports,
    })
  );
  tipTx.recentBlockhash = recentBlockhash;
  tipTx.feePayer = payer.publicKey;
  tipTx.sign(payer);

  const allTxs = [...transactions, tipTx];
  const encodedTransactions = allTxs.map((tx) => bs58.encode(tx.serialize()));

  return { encodedTransactions, tipAccount, tipAmount: tipLamports };
}`,
      testCases: [
        { id: "t1", name: "Selects a random Jito tip account", input: "", expectedOutput: "" },
        { id: "t2", name: "Creates tip transaction with SystemProgram.transfer", input: "", expectedOutput: "" },
        { id: "t3", name: "Appends tip tx as last in bundle", input: "", expectedOutput: "" },
        { id: "t4", name: "Returns base58-encoded serialized transactions", input: "", expectedOutput: "" },
      ],
      hints: [
        "Pick a random tip account from the 8 Jito addresses",
        "Tip transaction is a simple SOL transfer to the tip account",
        "Tip tx must be the LAST transaction in the bundle",
        "Serialize each tx and encode as base58",
      ],
    },
  },
  {
    id: "hard-25",
    title: "Cross-Program Composability Router",
    description: "Build a router that dispatches to different program CPIs based on a route config.",
    difficulty: "hard",
    category: "advanced",
    language: "rust",
    xpReward: 50,
    tags: ["router", "composability", "dispatch"],
    challenge: {
      language: "rust",
      prompt: "Implement a route dispatcher struct in Rust. It holds a list of routes (program_id, instruction_discriminator). Implement dispatch() which finds the matching route by discriminator, validates the target program account matches, then builds a CPI call. Return error for unknown routes.",
      starterCode: `use solana_program::{
    account_info::AccountInfo,
    entrypoint::ProgramResult,
    instruction::{AccountMeta, Instruction},
    program::invoke,
    program_error::ProgramError,
    pubkey::Pubkey,
};

pub struct Route {
    pub program_id: Pubkey,
    pub discriminator: [u8; 8],
}

pub struct Router {
    // Your fields here
}

impl Router {
    pub fn new(routes: Vec<Route>) -> Self {
        // Your code here
    }

    pub fn dispatch<'a>(
        &self,
        data: &[u8],
        accounts: &[AccountInfo<'a>],
        target_program: &AccountInfo<'a>,
    ) -> ProgramResult {
        // Your code here
    }
}`,
      solution: `use solana_program::{
    account_info::AccountInfo,
    entrypoint::ProgramResult,
    instruction::{AccountMeta, Instruction},
    program::invoke,
    program_error::ProgramError,
    pubkey::Pubkey,
};

pub struct Route {
    pub program_id: Pubkey,
    pub discriminator: [u8; 8],
}

pub struct Router {
    pub routes: Vec<Route>,
}

impl Router {
    pub fn new(routes: Vec<Route>) -> Self {
        Self { routes }
    }

    pub fn dispatch<'a>(
        &self,
        data: &[u8],
        accounts: &[AccountInfo<'a>],
        target_program: &AccountInfo<'a>,
    ) -> ProgramResult {
        if data.len() < 8 {
            return Err(ProgramError::InvalidInstructionData);
        }
        let disc: [u8; 8] = data[..8].try_into().unwrap();

        let route = self.routes.iter().find(|r| r.discriminator == disc)
            .ok_or(ProgramError::InvalidInstructionData)?;

        if *target_program.key != route.program_id {
            return Err(ProgramError::IncorrectProgramId);
        }

        let account_metas: Vec<AccountMeta> = accounts.iter().map(|a| {
            if a.is_writable {
                AccountMeta::new(*a.key, a.is_signer)
            } else {
                AccountMeta::new_readonly(*a.key, a.is_signer)
            }
        }).collect();

        let ix = Instruction {
            program_id: route.program_id,
            accounts: account_metas,
            data: data.to_vec(),
        };

        invoke(&ix, accounts)
    }
}`,
      testCases: [
        { id: "t1", name: "Matches route by 8-byte discriminator", input: "", expectedOutput: "" },
        { id: "t2", name: "Validates target_program matches route", input: "", expectedOutput: "" },
        { id: "t3", name: "Builds Instruction with correct AccountMetas", input: "", expectedOutput: "" },
        { id: "t4", name: "Calls invoke for CPI dispatch", input: "", expectedOutput: "" },
      ],
      hints: [
        "Extract first 8 bytes as the discriminator",
        "Find the matching route by comparing discriminator arrays",
        "Validate that the provided program account matches the route's program_id",
        "Build AccountMeta list preserving is_writable and is_signer flags",
      ],
    },
  },
];

/**
 * On-chain mapping: practice challenge IDs → achievement bitmap indices.
 * Regular achievements use indices 0-63; practice uses 64-138.
 * This must stay in sync with PRACTICE_CHALLENGES order.
 */
const PRACTICE_ACHIEVEMENT_OFFSET = 64;
const _practiceIndexMap = new Map<string, number>(
  PRACTICE_CHALLENGES.map((c, i) => [c.id, PRACTICE_ACHIEVEMENT_OFFSET + i])
);

export function practiceIdToAchievementIndex(challengeId: string): number | null {
  return _practiceIndexMap.get(challengeId) ?? null;
}

export function achievementIndexToPracticeId(index: number): string | null {
  const offset = index - PRACTICE_ACHIEVEMENT_OFFSET;
  if (offset < 0 || offset >= PRACTICE_CHALLENGES.length) return null;
  return PRACTICE_CHALLENGES[offset].id;
}
