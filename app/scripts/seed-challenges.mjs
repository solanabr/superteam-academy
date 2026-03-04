/**
 * Sanity CMS Seed Script — Superteam Academy Coding Challenges
 *
 * Creates 12 coding challenges (8 TypeScript + 4 Rust) covering Solana development
 * from beginner to advanced. Challenges are language-agnostic (no locale field)
 * and referenced by lessons across all locale variants.
 *
 * HOW TO RUN:
 *   node scripts/seed-challenges.mjs
 *
 * The script is IDEMPOTENT — safe to run multiple times.
 * It uses createOrReplace with deterministic document IDs.
 */

import { createClient } from "@sanity/client";

// ---------------------------------------------------------------------------
// Client — mirrors credentials from seed-sanity.mjs
// ---------------------------------------------------------------------------

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "vc90yp9o";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
const token =
  process.env.SANITY_API_TOKEN ??
  "skOyUu38r3j0oXDy6XDgRMJ9NsQWpcbUZBiYLgLvkZgqoTqEgyAmD3YqLNCFfev3g8A4mqgZn59hXbJxvKHKr8xTjBUG6yl4D6dB2LkgEkwEdD5jjsTiQp687KjB4XAjJQS1MVNvayBtpPcdqBH6iHVdpltbx0UfkLo9MjVTX2BmAeGQGqFl";

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2024-01-01",
  token,
  useCdn: false,
});

// ===========================================================================
// TypeScript Challenges
// ===========================================================================

// ---------------------------------------------------------------------------
// 1. Hello Solana (TS, difficulty 1)
// ---------------------------------------------------------------------------

const challenge_hello_solana = {
  _id: "challenge-hello-solana",
  _type: "challenge",
  title: "Hello Solana",
  language: "ts",
  difficulty: 1,
  hints: [
    "A function in TypeScript is declared with the `function` keyword or as an arrow function.",
    "The function should return a plain string — no async, no network calls needed.",
    "String literals in TypeScript use single or double quotes.",
  ],
  starterCode: `// Return the string "Hello, Solana!" from this function.
// This is your first step into Solana development!

export function helloSolana(): string {
  // TODO: return the greeting string
}
`,
  solutionCode: `export function helloSolana(): string {
  return "Hello, Solana!";
}
`,
  testCode: `import { helloSolana } from "./solution";

const result = helloSolana();
console.assert(result === "Hello, Solana!", \`Expected "Hello, Solana!" but got "\${result}"\`);
console.log("PASS: helloSolana returns correct greeting");
`,
};

// ---------------------------------------------------------------------------
// 2. Keypair Generator (TS, difficulty 1)
// ---------------------------------------------------------------------------

const challenge_keypair_generator = {
  _id: "challenge-keypair-generator",
  _type: "challenge",
  title: "Keypair Generator",
  language: "ts",
  difficulty: 1,
  hints: [
    "Import Keypair from \"@solana/web3.js\" — it has a static `generate()` method.",
    "A Keypair has a `.publicKey` property of type PublicKey.",
    "Call `.toBase58()` on the PublicKey to get the human-readable string.",
  ],
  starterCode: `import { Keypair } from "@solana/web3.js";

/**
 * Generate a new Solana keypair and return its public key as a base58 string.
 * The public key is the wallet's address — safe to share publicly.
 */
export function generateKeypair(): string {
  // TODO: generate a keypair and return the public key as base58
}
`,
  solutionCode: `import { Keypair } from "@solana/web3.js";

export function generateKeypair(): string {
  const keypair = Keypair.generate();
  return keypair.publicKey.toBase58();
}
`,
  testCode: `import { generateKeypair } from "./solution";
import { PublicKey } from "@solana/web3.js";

const pubkey = generateKeypair();

// A base58 Solana public key is 32-44 characters long
console.assert(typeof pubkey === "string", "Result must be a string");
console.assert(pubkey.length >= 32 && pubkey.length <= 44, \`Invalid base58 length: \${pubkey.length}\`);

// Must be a valid PublicKey (no exception thrown)
try {
  new PublicKey(pubkey);
  console.log("PASS: generateKeypair returns a valid base58 public key");
} catch {
  console.error("FAIL: returned string is not a valid Solana public key");
}
`,
};

// ---------------------------------------------------------------------------
// 3. Lamports to SOL (TS, difficulty 1)
// ---------------------------------------------------------------------------

const challenge_lamports_to_sol = {
  _id: "challenge-lamports-to-sol",
  _type: "challenge",
  title: "Lamports to SOL",
  language: "ts",
  difficulty: 1,
  hints: [
    "1 SOL = 1,000,000,000 lamports (1e9). Divide lamports by LAMPORTS_PER_SOL.",
    "LAMPORTS_PER_SOL is exported from \"@solana/web3.js\" — use it instead of a magic number.",
    "Return a number (float), not a string.",
  ],
  starterCode: `import { LAMPORTS_PER_SOL } from "@solana/web3.js";

/**
 * Convert a lamport amount to SOL.
 * 1 SOL = 1,000,000,000 lamports (LAMPORTS_PER_SOL).
 *
 * @param lamports - Amount in lamports (smallest SOL unit)
 * @returns Amount in SOL as a floating-point number
 */
export function lamportsToSol(lamports: number): number {
  // TODO: convert lamports to SOL
}
`,
  solutionCode: `import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export function lamportsToSol(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL;
}
`,
  testCode: `import { lamportsToSol } from "./solution";

const cases = [
  { input: 1_000_000_000, expected: 1 },
  { input: 500_000_000,   expected: 0.5 },
  { input: 1_000_000,     expected: 0.001 },
  { input: 0,             expected: 0 },
];

for (const { input, expected } of cases) {
  const result = lamportsToSol(input);
  const ok = Math.abs(result - expected) < 1e-12;
  console.assert(ok, \`lamportsToSol(\${input}) => \${result}, expected \${expected}\`);
}
console.log("PASS: lamportsToSol converts correctly for all test cases");
`,
};

// ---------------------------------------------------------------------------
// 4. SOL Transfer (TS, difficulty 2)
// ---------------------------------------------------------------------------

const challenge_sol_transfer = {
  _id: "challenge-sol-transfer",
  _type: "challenge",
  title: "SOL Transfer",
  language: "ts",
  difficulty: 2,
  hints: [
    "Use SystemProgram.transfer() to create a transfer instruction — it takes fromPubkey, toPubkey, and lamports.",
    "Wrap the instruction in a new Transaction() using .add(instruction).",
    "LAMPORTS_PER_SOL (1e9) is the conversion factor — multiply SOL amount by it to get lamports.",
  ],
  starterCode: `import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

/**
 * Build a SOL transfer transaction (unsigned).
 * Returns the Transaction object ready to be signed and sent.
 *
 * @param from   - Sender's public key
 * @param to     - Recipient's public key
 * @param sol    - Amount of SOL to transfer
 * @returns      - Unsigned Transaction containing the transfer instruction
 */
export function buildSolTransfer(
  from: PublicKey,
  to: PublicKey,
  sol: number
): Transaction {
  // TODO: create a SystemProgram.transfer instruction and return a Transaction
}
`,
  solutionCode: `import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

export function buildSolTransfer(
  from: PublicKey,
  to: PublicKey,
  sol: number
): Transaction {
  const lamports = Math.round(sol * LAMPORTS_PER_SOL);
  const instruction = SystemProgram.transfer({
    fromPubkey: from,
    toPubkey: to,
    lamports,
  });
  return new Transaction().add(instruction);
}
`,
  testCode: `import { buildSolTransfer } from "./solution";
import { Keypair, LAMPORTS_PER_SOL, Transaction } from "@solana/web3.js";

const sender = Keypair.generate();
const recipient = Keypair.generate();
const sol = 0.5;

const tx = buildSolTransfer(sender.publicKey, recipient.publicKey, sol);

console.assert(tx instanceof Transaction, "Result must be a Transaction");
console.assert(tx.instructions.length === 1, "Transaction must have exactly 1 instruction");

const ix = tx.instructions[0];
// SystemProgram.transfer encodes lamports in the data buffer — verify the instruction exists
console.assert(ix.data.length > 0, "Instruction must have data");
console.assert(
  ix.programId.toBase58() === "11111111111111111111111111111111",
  "Instruction must target the System Program"
);
console.log("PASS: buildSolTransfer returns a valid Transaction with a SystemProgram.transfer instruction");
`,
};

// ---------------------------------------------------------------------------
// 5. PDA Derivation (TS, difficulty 2)
// ---------------------------------------------------------------------------

const challenge_pda_derivation = {
  _id: "challenge-pda-derivation",
  _type: "challenge",
  title: "PDA Derivation",
  language: "ts",
  difficulty: 2,
  hints: [
    "Use PublicKey.findProgramAddressSync(seeds, programId) — it returns [publicKey, bump].",
    "Seeds must be arrays of Uint8Array or Buffer. Convert strings with Buffer.from(\"user\") and publicKeys with publicKey.toBuffer().",
    "The bump is a number 0-255. findProgramAddressSync finds the canonical bump automatically.",
  ],
  starterCode: `import { PublicKey } from "@solana/web3.js";

/**
 * Derive a Program Derived Address (PDA) for a user account.
 * Seeds: ["user", userPublicKey]
 *
 * PDAs are deterministic addresses owned by a program. They have no private key —
 * only the program can sign on their behalf (via invoke_signed in Rust).
 *
 * @param programId  - The program that will own this PDA
 * @param userPubkey - The user's public key (used as a seed)
 * @returns          - [pda, bump] tuple
 */
export function deriveUserPda(
  programId: PublicKey,
  userPubkey: PublicKey
): [PublicKey, number] {
  // TODO: derive PDA using seeds ["user", userPubkey]
}
`,
  solutionCode: `import { PublicKey } from "@solana/web3.js";

export function deriveUserPda(
  programId: PublicKey,
  userPubkey: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("user"), userPubkey.toBuffer()],
    programId
  );
}
`,
  testCode: `import { deriveUserPda } from "./solution";
import { Keypair, PublicKey } from "@solana/web3.js";

const programId = new PublicKey("AcadXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
const user = Keypair.generate();

const [pda, bump] = deriveUserPda(programId, user.publicKey);

console.assert(pda instanceof PublicKey, "PDA must be a PublicKey");
console.assert(typeof bump === "number" && bump >= 0 && bump <= 255, \`Bump \${bump} is out of range\`);

// Verify it's a valid PDA (off the ed25519 curve — no private key)
console.assert(!PublicKey.isOnCurve(pda.toBytes()), "PDA must not be on the ed25519 curve");

// Verify determinism
const [pda2, bump2] = deriveUserPda(programId, user.publicKey);
console.assert(pda.equals(pda2) && bump === bump2, "PDA derivation must be deterministic");

console.log("PASS: deriveUserPda returns a valid off-curve PDA with canonical bump");
`,
};

// ---------------------------------------------------------------------------
// 6. Token Account Check (TS, difficulty 2)
// ---------------------------------------------------------------------------

const challenge_token_account_check = {
  _id: "challenge-token-account-check",
  _type: "challenge",
  title: "Token Account Check",
  language: "ts",
  difficulty: 2,
  hints: [
    "Use getAssociatedTokenAddressSync(mint, owner) to compute the expected ATA address.",
    "Then call connection.getAccountInfo(ata) — it returns null if the account doesn't exist.",
    "An ATA exists when getAccountInfo returns a non-null object.",
  ],
  starterCode: `import { Connection, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

/**
 * Check whether an Associated Token Account (ATA) exists for a given
 * owner and mint. Returns the ATA address and whether it exists.
 *
 * @param connection - Active RPC connection
 * @param mint       - The token mint address
 * @param owner      - The wallet that would own the ATA
 * @returns          - { ata: PublicKey, exists: boolean }
 */
export async function checkTokenAccount(
  connection: Connection,
  mint: PublicKey,
  owner: PublicKey
): Promise<{ ata: PublicKey; exists: boolean }> {
  // TODO: compute the ATA address and check if the account exists on-chain
}
`,
  solutionCode: `import { Connection, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

export async function checkTokenAccount(
  connection: Connection,
  mint: PublicKey,
  owner: PublicKey
): Promise<{ ata: PublicKey; exists: boolean }> {
  const ata = getAssociatedTokenAddressSync(mint, owner);
  const accountInfo = await connection.getAccountInfo(ata);
  return { ata, exists: accountInfo !== null };
}
`,
  testCode: `import { checkTokenAccount } from "./solution";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

// We can't make real RPC calls in the test runner, so verify structure.
// A mock connection that returns null (account doesn't exist).
const mockConnection = {
  getAccountInfo: async () => null,
} as unknown as Connection;

const mint = Keypair.generate().publicKey;
const owner = Keypair.generate().publicKey;

const result = await checkTokenAccount(mockConnection, mint, owner);

console.assert("ata" in result, "Result must have 'ata' field");
console.assert("exists" in result, "Result must have 'exists' field");
console.assert(result.ata instanceof PublicKey, "ata must be a PublicKey");
console.assert(result.exists === false, "exists must be false when account is null");

// Verify ATA address is computed correctly
const expectedAta = getAssociatedTokenAddressSync(mint, owner);
console.assert(result.ata.equals(expectedAta), "ATA address must match getAssociatedTokenAddressSync");

console.log("PASS: checkTokenAccount returns correct ATA address and existence flag");
`,
};

// ---------------------------------------------------------------------------
// 7. Anchor Instruction (TS, difficulty 3)
// ---------------------------------------------------------------------------

const challenge_anchor_instruction = {
  _id: "challenge-anchor-instruction",
  _type: "challenge",
  title: "Anchor Instruction Builder",
  language: "ts",
  difficulty: 3,
  hints: [
    "Use program.methods.initialize(args).accounts({...}).instruction() to build a TransactionInstruction.",
    "The program object comes from new Program(idl, programId, provider) — AnchorProvider wraps Connection + Wallet.",
    "Call .instruction() (not .rpc() or .transaction()) to get the raw instruction without sending.",
  ],
  starterCode: `import { AnchorProvider, Program, web3 } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";

// Minimal IDL for a counter program
const IDL = {
  version: "0.1.0",
  name: "counter",
  instructions: [
    {
      name: "initialize",
      accounts: [
        { name: "counter", isMut: true, isSigner: true },
        { name: "authority", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [{ name: "startValue", type: "u64" }],
    },
  ],
  accounts: [
    { name: "Counter", type: { kind: "struct", fields: [{ name: "value", type: "u64" }] } },
  ],
} as const;

/**
 * Build an Anchor 'initialize' instruction for the counter program.
 * Does NOT send the transaction — returns the instruction for composability.
 *
 * @param provider    - AnchorProvider (connection + wallet)
 * @param programId   - Deployed counter program ID
 * @param counter     - Keypair for the new counter account
 * @param startValue  - Initial counter value
 * @returns           - TransactionInstruction ready to be added to a Transaction
 */
export async function buildInitializeInstruction(
  provider: AnchorProvider,
  programId: PublicKey,
  counter: Keypair,
  startValue: number
): Promise<TransactionInstruction> {
  // TODO: create an Anchor Program instance and build the initialize instruction
}
`,
  solutionCode: `import { AnchorProvider, Program, BN } from "@coral-xyz/anchor";
import { PublicKey, Keypair, TransactionInstruction, SystemProgram } from "@solana/web3.js";

const IDL = {
  version: "0.1.0",
  name: "counter",
  instructions: [
    {
      name: "initialize",
      accounts: [
        { name: "counter", isMut: true, isSigner: true },
        { name: "authority", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [{ name: "startValue", type: "u64" }],
    },
  ],
  accounts: [
    { name: "Counter", type: { kind: "struct", fields: [{ name: "value", type: "u64" }] } },
  ],
} as const;

export async function buildInitializeInstruction(
  provider: AnchorProvider,
  programId: PublicKey,
  counter: Keypair,
  startValue: number
): Promise<TransactionInstruction> {
  const program = new Program(IDL as any, programId, provider);
  return program.methods
    .initialize(new BN(startValue))
    .accounts({
      counter: counter.publicKey,
      authority: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
}
`,
  testCode: `import { buildInitializeInstruction } from "./solution";
import {
  AnchorProvider,
  Wallet,
} from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com", "confirmed");
const payer = Keypair.generate();
const provider = new AnchorProvider(connection, new Wallet(payer), {});
const programId = new PublicKey("CounterXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
const counter = Keypair.generate();

const ix = await buildInitializeInstruction(provider, programId, counter, 0);

console.assert(ix instanceof TransactionInstruction, "Must return a TransactionInstruction");
console.assert(
  ix.programId.equals(programId),
  \`Instruction programId must match. Got: \${ix.programId.toBase58()}\`
);
console.assert(ix.keys.length >= 3, "Must have at least 3 account metas (counter, authority, systemProgram)");
console.assert(ix.data.length > 0, "Instruction data must be non-empty (contains method discriminator + args)");

console.log("PASS: buildInitializeInstruction returns a valid Anchor TransactionInstruction");
`,
};

// ---------------------------------------------------------------------------
// 8. Transaction Builder (TS, difficulty 3)
// ---------------------------------------------------------------------------

const challenge_transaction_builder = {
  _id: "challenge-transaction-builder",
  _type: "challenge",
  title: "Transaction Builder",
  language: "ts",
  difficulty: 3,
  hints: [
    "Fetch a fresh blockhash with connection.getLatestBlockhash() — transactions are only valid for ~90 seconds.",
    "Set tx.recentBlockhash and tx.feePayer before returning. The fee payer pays for transaction execution.",
    "Add instructions in order using tx.add(...instructions). Multiple instructions execute atomically.",
  ],
  starterCode: `import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";

/**
 * Build a versioned transaction from multiple instructions.
 *
 * A well-formed Transaction needs:
 * 1. A recent blockhash (prevents replay attacks, expires in ~90s)
 * 2. A fee payer (the account that pays for compute and storage)
 * 3. One or more instructions to execute atomically
 *
 * @param connection   - Active RPC connection (used to fetch blockhash)
 * @param feePayer     - Public key of the account paying fees
 * @param instructions - Array of instructions to include
 * @returns            - Transaction with blockhash and fee payer set
 */
export async function buildTransaction(
  connection: Connection,
  feePayer: PublicKey,
  instructions: TransactionInstruction[]
): Promise<Transaction> {
  // TODO: fetch a recent blockhash, create a Transaction, set feePayer and
  //       recentBlockhash, add all instructions, and return it
}
`,
  solutionCode: `import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";

export async function buildTransaction(
  connection: Connection,
  feePayer: PublicKey,
  instructions: TransactionInstruction[]
): Promise<Transaction> {
  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  const tx = new Transaction();
  tx.recentBlockhash = blockhash;
  tx.feePayer = feePayer;
  tx.add(...instructions);
  return tx;
}
`,
  testCode: `import { buildTransaction } from "./solution";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";

// Mock connection returning a deterministic blockhash
const MOCK_BLOCKHASH = "EkSnNWid2cvwEVnVx9aBqawnmiCNiDgp3gUdkDPTKN1N";
const mockConnection = {
  getLatestBlockhash: async () => ({
    blockhash: MOCK_BLOCKHASH,
    lastValidBlockHeight: 100,
  }),
} as unknown as Connection;

const feePayer = Keypair.generate().publicKey;
const from = Keypair.generate().publicKey;
const to = Keypair.generate().publicKey;

const ix1 = SystemProgram.transfer({ fromPubkey: from, toPubkey: to, lamports: LAMPORTS_PER_SOL });
const ix2 = SystemProgram.transfer({ fromPubkey: from, toPubkey: to, lamports: 500_000_000 });

const tx = await buildTransaction(mockConnection, feePayer, [ix1, ix2]);

console.assert(tx instanceof Transaction, "Must return a Transaction");
console.assert(tx.recentBlockhash === MOCK_BLOCKHASH, \`recentBlockhash must be set. Got: \${tx.recentBlockhash}\`);
console.assert(tx.feePayer?.equals(feePayer), "feePayer must be set correctly");
console.assert(tx.instructions.length === 2, \`Must contain 2 instructions. Got: \${tx.instructions.length}\`);

console.log("PASS: buildTransaction returns a fully formed Transaction with blockhash, feePayer, and all instructions");
`,
};

// ===========================================================================
// Rust / Anchor Challenges
// ===========================================================================

// ---------------------------------------------------------------------------
// 9. Hello Anchor (Rust, difficulty 1)
// ---------------------------------------------------------------------------

const challenge_hello_anchor = {
  _id: "challenge-hello-anchor",
  _type: "challenge",
  title: "Hello Anchor",
  language: "rust",
  difficulty: 1,
  hints: [
    "Anchor instruction handlers take a Context<T> as their first argument and return Result<()>.",
    "Use msg!(\"...\") to log a message — it writes to the program's transaction log.",
    "An instruction that does nothing else just needs to return Ok(()).",
  ],
  starterCode: `use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWxTWqFd5TdkHWC8xQGRi6nifn");

#[program]
pub mod hello_anchor {
    use super::*;

    /// Write an instruction handler that logs "Hello, Anchor!" to the
    /// transaction log and returns Ok(()).
    pub fn say_hello(ctx: Context<SayHello>) -> Result<()> {
        // TODO: log "Hello, Anchor!" and return Ok(())
        todo!()
    }
}

#[derive(Accounts)]
pub struct SayHello<'info> {
    pub signer: Signer<'info>,
}
`,
  solutionCode: `use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWxTWqFd5TdkHWC8xQGRi6nifn");

#[program]
pub mod hello_anchor {
    use super::*;

    pub fn say_hello(_ctx: Context<SayHello>) -> Result<()> {
        msg!("Hello, Anchor!");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct SayHello<'info> {
    pub signer: Signer<'info>,
}
`,
  testCode: `// Test checks that the instruction handler:
// 1. Calls msg!() with "Hello, Anchor!"
// 2. Returns Ok(())
// Pattern: solution contains msg!("Hello, Anchor!") and Ok(())

#[cfg(test)]
mod tests {
    // In a real Anchor test environment this would invoke the instruction.
    // Here we verify the key patterns exist in the solution.

    #[test]
    fn test_say_hello_logs_message() {
        // Verify: msg!("Hello, Anchor!") appears in the handler
        let source = include_str!("./solution.rs");
        assert!(
            source.contains(r#"msg!("Hello, Anchor!")"#),
            "Handler must call msg!(\"Hello, Anchor!\")"
        );
        assert!(
            source.contains("Ok(())"),
            "Handler must return Ok(())"
        );
    }
}
`,
};

// ---------------------------------------------------------------------------
// 10. Account Validation (Rust, difficulty 2)
// ---------------------------------------------------------------------------

const challenge_account_validation = {
  _id: "challenge-account-validation",
  _type: "challenge",
  title: "Account Validation",
  language: "rust",
  difficulty: 2,
  hints: [
    "Use #[account(mut)] to mark an account as writable within the instruction.",
    "Use #[account(has_one = authority)] to verify a stored Pubkey field matches a signer.",
    "Use #[account(constraint = ...)] with a require! macro inside the handler for custom checks.",
  ],
  starterCode: `use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWxTWqFd5TdkHWC8xQGRi6nifn");

/// A simple vault account that stores SOL and tracks its authority.
#[account]
pub struct Vault {
    pub authority: Pubkey,
    pub balance: u64,
    pub bump: u8,
}

impl Vault {
    pub const INIT_SPACE: usize = 32 + 8 + 1; // Pubkey + u64 + u8
}

#[program]
pub mod vault_program {
    use super::*;

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        // TODO: validate amount > 0 using require!, then update the balance
        // with checked_sub, returning an error if balance is insufficient.
        todo!()
    }
}

/// Complete the Withdraw accounts struct with proper constraints:
/// - vault must be mutable
/// - vault.authority must match the authority signer (has_one constraint)
/// - authority must be a signer
#[derive(Accounts)]
pub struct Withdraw<'info> {
    // TODO: add constraints
    pub vault: Account<'info, Vault>,
    pub authority: Signer<'info>,
}
`,
  solutionCode: `use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWxTWqFd5TdkHWC8xQGRi6nifn");

#[error_code]
pub enum VaultError {
    #[msg("Withdrawal amount must be greater than zero")]
    ZeroAmount,
    #[msg("Insufficient vault balance")]
    InsufficientBalance,
}

#[account]
pub struct Vault {
    pub authority: Pubkey,
    pub balance: u64,
    pub bump: u8,
}

impl Vault {
    pub const INIT_SPACE: usize = 32 + 8 + 1;
}

#[program]
pub mod vault_program {
    use super::*;

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        require!(amount > 0, VaultError::ZeroAmount);
        let vault = &mut ctx.accounts.vault;
        vault.balance = vault
            .balance
            .checked_sub(amount)
            .ok_or(VaultError::InsufficientBalance)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut, has_one = authority)]
    pub vault: Account<'info, Vault>,
    pub authority: Signer<'info>,
}
`,
  testCode: `// Test verifies the following patterns in the solution:
// 1. #[account(mut, has_one = authority)] on vault
// 2. require!(amount > 0, ...) guard
// 3. checked_sub used for balance update

#[cfg(test)]
mod tests {
    #[test]
    fn test_account_constraints() {
        let source = include_str!("./solution.rs");
        assert!(
            source.contains("has_one = authority"),
            "Vault must have has_one = authority constraint"
        );
        assert!(
            source.contains("#[account(mut"),
            "Vault must be marked mutable"
        );
        assert!(
            source.contains("checked_sub"),
            "Balance update must use checked_sub to prevent underflow"
        );
        assert!(
            source.contains("require!"),
            "Handler must use require! macro for input validation"
        );
    }
}
`,
};

// ---------------------------------------------------------------------------
// 11. PDA Seeds (Rust, difficulty 2)
// ---------------------------------------------------------------------------

const challenge_pda_seeds = {
  _id: "challenge-pda-seeds",
  _type: "challenge",
  title: "PDA Seeds",
  language: "rust",
  difficulty: 2,
  hints: [
    "Use #[account(seeds = [...], bump)] to declare a PDA account in an Anchor Accounts struct.",
    "Seeds are byte slices: b\"user\" for a string seed, user.key().as_ref() for a Pubkey seed.",
    "Store the canonical bump inside the account during init with account.bump = ctx.bumps.account_name.",
  ],
  starterCode: `use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWxTWqFd5TdkHWC8xQGRi6nifn");

/// A user profile stored at a PDA derived from ["user", user_pubkey].
#[account]
pub struct UserProfile {
    pub owner: Pubkey,
    pub xp: u64,
    pub bump: u8,
}

impl UserProfile {
    pub const INIT_SPACE: usize = 32 + 8 + 1;
}

#[program]
pub mod academy {
    use super::*;

    pub fn create_profile(ctx: Context<CreateProfile>) -> Result<()> {
        let profile = &mut ctx.accounts.profile;
        profile.owner = ctx.accounts.user.key();
        profile.xp = 0;
        // TODO: store the canonical bump from ctx.bumps
        Ok(())
    }
}

/// Complete the CreateProfile accounts struct.
/// The profile PDA must:
/// - Be initialized (init) with the user as payer
/// - Use seeds: [b"user", user.key().as_ref()]
/// - Store bump = ctx.bumps.profile
/// - Have space for UserProfile::INIT_SPACE + discriminator (8 bytes)
#[derive(Accounts)]
pub struct CreateProfile<'info> {
    // TODO: add profile PDA with correct seeds and init constraint
    pub profile: Account<'info, UserProfile>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}
`,
  solutionCode: `use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWxTWqFd5TdkHWC8xQGRi6nifn");

#[account]
pub struct UserProfile {
    pub owner: Pubkey,
    pub xp: u64,
    pub bump: u8,
}

impl UserProfile {
    pub const INIT_SPACE: usize = 32 + 8 + 1;
}

#[program]
pub mod academy {
    use super::*;

    pub fn create_profile(ctx: Context<CreateProfile>) -> Result<()> {
        let profile = &mut ctx.accounts.profile;
        profile.owner = ctx.accounts.user.key();
        profile.xp = 0;
        profile.bump = ctx.bumps.profile;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateProfile<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + UserProfile::INIT_SPACE,
        seeds = [b"user", user.key().as_ref()],
        bump
    )]
    pub profile: Account<'info, UserProfile>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}
`,
  testCode: `// Test verifies PDA seeds macro usage patterns:
// 1. seeds = [b"user", user.key().as_ref()] on the profile account
// 2. bump stored from ctx.bumps.profile
// 3. init + payer + space constraints

#[cfg(test)]
mod tests {
    #[test]
    fn test_pda_seeds_definition() {
        let source = include_str!("./solution.rs");
        assert!(
            source.contains(r#"b"user""#),
            "Seeds must include b\"user\" prefix"
        );
        assert!(
            source.contains("user.key().as_ref()"),
            "Seeds must include user.key().as_ref()"
        );
        assert!(
            source.contains("ctx.bumps.profile"),
            "Canonical bump must be stored from ctx.bumps.profile"
        );
        assert!(
            source.contains("init,") || source.contains("init\n"),
            "Account must use init constraint"
        );
        assert!(
            source.contains("payer = user"),
            "Account must specify payer = user"
        );
    }
}
`,
};

// ---------------------------------------------------------------------------
// 12. CPI Transfer (Rust, difficulty 3)
// ---------------------------------------------------------------------------

const challenge_cpi_transfer = {
  _id: "challenge-cpi-transfer",
  _type: "challenge",
  title: "CPI Transfer",
  language: "rust",
  difficulty: 3,
  hints: [
    "Use anchor_lang::system_program::transfer(CpiContext::new(...), amount) to transfer SOL via CPI.",
    "CpiContext::new takes (program_account, accounts_struct). For system_program::transfer use system_program::Transfer { from, to }.",
    "The 'from' account must be a Signer or a PDA. To transfer from a PDA use CpiContext::new_with_signer with signer_seeds.",
  ],
  starterCode: `use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("Fg6PaFpoGXkYsidMpWxTWqFd5TdkHWC8xQGRi6nifn");

#[program]
pub mod cpi_example {
    use super::*;

    /// Transfer SOL from the user to a recipient via a Cross-Program Invocation
    /// (CPI) to the System Program.
    ///
    /// CPIs let your program call other programs' instructions, enabling
    /// composability. The System Program owns all regular SOL accounts and
    /// handles native SOL transfers.
    pub fn transfer_sol(ctx: Context<TransferSol>, amount: u64) -> Result<()> {
        // TODO: perform a CPI to System Program's transfer instruction
        // Transfer 'amount' lamports from ctx.accounts.from to ctx.accounts.to
        todo!()
    }
}

#[derive(Accounts)]
pub struct TransferSol<'info> {
    #[account(mut)]
    pub from: Signer<'info>,
    /// CHECK: recipient wallet — no ownership check needed for SOL transfers
    #[account(mut)]
    pub to: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}
`,
  solutionCode: `use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("Fg6PaFpoGXkYsidMpWxTWqFd5TdkHWC8xQGRi6nifn");

#[program]
pub mod cpi_example {
    use super::*;

    pub fn transfer_sol(ctx: Context<TransferSol>, amount: u64) -> Result<()> {
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.from.to_account_info(),
                to: ctx.accounts.to.to_account_info(),
            },
        );
        system_program::transfer(cpi_context, amount)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct TransferSol<'info> {
    #[account(mut)]
    pub from: Signer<'info>,
    /// CHECK: recipient wallet — no ownership check needed for SOL transfers
    #[account(mut)]
    pub to: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}
`,
  testCode: `// Test verifies CPI patterns:
// 1. CpiContext::new is used (not raw invoke)
// 2. system_program::transfer is called
// 3. from and to account infos are passed correctly

#[cfg(test)]
mod tests {
    #[test]
    fn test_cpi_transfer_patterns() {
        let source = include_str!("./solution.rs");
        assert!(
            source.contains("CpiContext::new"),
            "Must use CpiContext::new to build the CPI context"
        );
        assert!(
            source.contains("system_program::transfer"),
            "Must call system_program::transfer for the CPI"
        );
        assert!(
            source.contains("system_program::Transfer"),
            "Must use the system_program::Transfer accounts struct"
        );
        assert!(
            source.contains("to_account_info()"),
            "Must convert accounts to AccountInfo using to_account_info()"
        );
        assert!(
            !source.contains("todo!()"),
            "Solution must not contain todo!()"
        );
    }
}
`,
};

// ===========================================================================
// Seed execution
// ===========================================================================

const ALL_CHALLENGES = [
  // TypeScript — difficulty 1
  challenge_hello_solana,
  challenge_keypair_generator,
  challenge_lamports_to_sol,
  // TypeScript — difficulty 2
  challenge_sol_transfer,
  challenge_pda_derivation,
  challenge_token_account_check,
  // TypeScript — difficulty 3
  challenge_anchor_instruction,
  challenge_transaction_builder,
  // Rust — difficulty 1
  challenge_hello_anchor,
  // Rust — difficulty 2
  challenge_account_validation,
  challenge_pda_seeds,
  // Rust — difficulty 3
  challenge_cpi_transfer,
];

async function seed() {
  console.log("\nSuperteam Academy — Challenge Seed Script");
  console.log(`Project: ${projectId} | Dataset: ${dataset}`);
  console.log(`Challenges to upsert: ${ALL_CHALLENGES.length}\n`);

  let created = 0;
  let errors = 0;

  for (const doc of ALL_CHALLENGES) {
    try {
      const result = await client.createOrReplace(doc);
      console.log(
        `  [OK] ${result._type.padEnd(12)} ${result._id.padEnd(42)} (difficulty ${result.difficulty}, ${result.language})`
      );
      created++;
    } catch (err) {
      console.error(`  [ERR] ${doc._type} ${doc._id}:`, err.message);
      errors++;
    }
  }

  console.log(`\n--- Done ---`);
  console.log(`  Created/updated: ${created}`);
  if (errors > 0) {
    console.log(`  Errors:          ${errors}`);
    process.exit(1);
  }
}

seed().catch((err) => {
  console.error("\nFatal error:", err);
  process.exit(1);
});
