export function getCourse1() {
  return {
    slug: "intro-to-solana",
    title: "Introduction to Solana",
    description:
      "Learn the fundamentals of Solana blockchain — accounts, transactions, programs, and the runtime model that makes Solana the fastest blockchain.",
    difficulty: "beginner",
    duration: "4 hours",
    xpTotal: 600,
    trackId: 0,
    trackLevel: 1,
    trackName: "Standalone",
    creator: "Superteam Brazil",
    tags: ["solana", "blockchain", "fundamentals"],
    prerequisites: [],
    modules: {
      create: [
        // ────────────────────────────────────────────────────────────────────
        // Module 1: Getting Started
        // ────────────────────────────────────────────────────────────────────
        {
          title: "Getting Started",
          description:
            "Set up your development environment and send your first on-chain transaction.",
          order: 0,
          lessons: {
            create: [
              // Lesson 1.1 — What is Solana? (content)
              {
                title: "What is Solana?",
                description: "Understanding Solana's architecture and what makes it unique",
                type: "content",
                order: 0,
                xpReward: 20,
                duration: "15 min",
                content: `# What is Solana?

Solana is a high-performance, permissionless blockchain designed for decentralized applications and crypto-native products. It was founded by Anatoly Yakovenko in 2017 and launched its mainnet beta in March 2020. Unlike many other Layer 1 blockchains, Solana achieves high throughput without relying on sharding or Layer 2 rollups.

## Key Performance Characteristics

Solana's design targets **400ms block times** and theoretical throughput of **65,000 transactions per second**. In practice, mainnet consistently processes 2,000-4,000 TPS with sub-second finality. This performance comes from several core innovations working together:

- **Proof of History (PoH):** A verifiable delay function that creates a cryptographic timestamp before consensus. Validators don't need to communicate to agree on time ordering, dramatically reducing message overhead.
- **Tower BFT:** Solana's consensus mechanism built on top of PoH. It uses the PoH clock as a source of time, reducing the voting overhead in traditional PBFT from O(n^2) to O(n).
- **Gulf Stream:** A mempool-less transaction forwarding protocol. Validators forward transactions to the expected leader before the current slot ends, allowing the next leader to begin executing transactions immediately.
- **Turbine:** A block propagation protocol inspired by BitTorrent. Blocks are broken into smaller packets called "shreds" and propagated through a fanout tree of validators.

## The Account Model

Everything on Solana is an **account**. Programs (smart contracts), token balances, NFT metadata, and user data all live in accounts. Each account has:

\`\`\`
- Address (32-byte public key)
- Owner (the program that controls this account)
- Lamports (balance in SOL's smallest unit; 1 SOL = 1 billion lamports)
- Data (arbitrary byte array)
- Executable flag (true for programs, false for data accounts)
\`\`\`

This is fundamentally different from Ethereum's model where smart contracts hold both code and state. On Solana, **programs are stateless** — they read and write to separate data accounts passed in as instruction arguments.

## Programs, Not Smart Contracts

On Solana, what Ethereum calls "smart contracts" are called **programs**. Programs are compiled to BPF bytecode and deployed on-chain. They are stateless: they don't store data internally. Instead, all state is stored in accounts that the program owns. When a user invokes a program, they must pass in every account the program needs to read from or write to.

## Why Solana for Developers?

- **Low fees:** Transactions cost approximately 0.000005 SOL (~$0.001).
- **Fast finality:** Transactions confirm in under 500ms, enabling real-time applications.
- **Composability:** Programs can call other programs (CPI — Cross-Program Invocation) within a single transaction.
- **Rich ecosystem:** Tooling includes Anchor (program framework), Metaplex (NFTs), and SPL Token (fungible tokens).

In the next lesson, you'll install the Solana CLI and set up your local development environment.`,
              },

              // Lesson 1.2 — Install the Solana CLI (content)
              {
                title: "Install the Solana CLI",
                description: "Set up the Solana tool suite and configure your local environment",
                type: "content",
                order: 1,
                xpReward: 30,
                duration: "20 min",
                content: `# Install the Solana CLI

The Solana CLI (Command Line Interface) is your primary tool for interacting with the Solana blockchain. It includes the \`solana\` command for network interactions, \`solana-keygen\` for wallet management, and \`solana-test-validator\` for running a local cluster.

## Installation

The recommended way to install is using the Solana install tool. Open a terminal and run:

\`\`\`bash
# macOS / Linux
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"

# After installation, add to your PATH
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
\`\`\`

On Windows, use WSL (Windows Subsystem for Linux) and follow the same steps. Verify the installation:

\`\`\`bash
solana --version
# solana-cli 1.18.x (or later)
\`\`\`

## Configure the CLI

By default, the CLI points at mainnet-beta. For development, switch to **devnet**:

\`\`\`bash
solana config set --url devnet

# Verify your config
solana config get
# Config File: ~/.config/solana/cli/config.yml
# RPC URL: https://api.devnet.solana.com
# WebSocket URL: wss://api.devnet.solana.com/
# Keypair Path: ~/.config/solana/id.json
\`\`\`

## Generate a Keypair

If you don't already have a keypair, generate one:

\`\`\`bash
solana-keygen new --outfile ~/.config/solana/id.json
# Wrote new keypair to ~/.config/solana/id.json
# pubkey: <YOUR_PUBLIC_KEY>
\`\`\`

This creates a file-system wallet. **Never use this keypair on mainnet for real funds** — it's intended for development only.

## Fund Your Devnet Wallet

Devnet SOL is free. Request an airdrop:

\`\`\`bash
solana airdrop 2
# Requesting airdrop of 2 SOL
# Signature: <TX_SIGNATURE>
# 2 SOL

solana balance
# 2 SOL
\`\`\`

## Local Test Validator

For fully offline development, run a local cluster:

\`\`\`bash
solana-test-validator
# Ledger location: test-ledger
# Log: test-ledger/validator.log
# Identity: <VALIDATOR_PUBKEY>
# ...
\`\`\`

In a separate terminal, point the CLI to localhost:

\`\`\`bash
solana config set --url localhost
solana airdrop 10
\`\`\`

## Node.js and TypeScript Setup

Most Solana client code is written in TypeScript. Make sure you have Node.js 18+ installed, then set up a project:

\`\`\`bash
mkdir solana-lab && cd solana-lab
npm init -y
npm install @solana/web3.js @solana/spl-token
npm install -D typescript ts-node @types/node
npx tsc --init
\`\`\`

You now have a fully configured Solana development environment. In the next lesson, you'll send your first transaction on devnet.`,
              },

              // Lesson 1.3 — Your First Transaction (challenge)
              {
                title: "Your First Transaction",
                description: "Send SOL on devnet using @solana/web3.js",
                type: "challenge",
                order: 2,
                xpReward: 50,
                duration: "25 min",
                content: `# Your First Transaction

Now that your environment is configured, it's time to send your first transaction on Solana's devnet. You'll use the \`@solana/web3.js\` library to create a connection, build a transfer instruction, and submit it to the network.

## How Transactions Work

A Solana transaction contains one or more **instructions**. Each instruction specifies:

1. **Program ID** — which on-chain program to invoke
2. **Accounts** — the accounts the instruction reads from or writes to
3. **Data** — serialized arguments passed to the program

For a simple SOL transfer, you invoke the **System Program** (\`11111111111111111111111111111111\`) with a \`Transfer\` instruction.

## Building a Transfer

\`\`\`typescript
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

// 1. Establish a connection to devnet
const connection = new Connection("https://api.devnet.solana.com", "confirmed");

// 2. Generate sender and receiver keypairs
const sender = Keypair.generate();
const receiver = Keypair.generate();

// 3. Airdrop SOL to the sender
const airdropSig = await connection.requestAirdrop(sender.publicKey, 2 * LAMPORTS_PER_SOL);
await connection.confirmTransaction(airdropSig);

// 4. Create a transfer instruction
const transferIx = SystemProgram.transfer({
  fromPubkey: sender.publicKey,
  toPubkey: receiver.publicKey,
  lamports: 0.5 * LAMPORTS_PER_SOL,
});

// 5. Build, sign, and send the transaction
const tx = new Transaction().add(transferIx);
const signature = await sendAndConfirmTransaction(connection, tx, [sender]);

console.log("Transaction signature:", signature);
\`\`\`

## Confirming Transactions

Solana has several commitment levels that determine how "final" a transaction is:

- **\`processed\`** — the transaction has been received and processed by the RPC node
- **\`confirmed\`** — the transaction has been confirmed by a supermajority of the cluster (most common for dApps)
- **\`finalized\`** — the transaction is on a block that has been finalized (maximum security, ~30 slots behind tip)

When you use \`sendAndConfirmTransaction\`, it waits for the specified commitment level (defaulting to \`finalized\`). For faster development feedback, use \`"confirmed"\`.

## Checking Balances

After sending, verify the transfer:

\`\`\`typescript
const senderBalance = await connection.getBalance(sender.publicKey);
const receiverBalance = await connection.getBalance(receiver.publicKey);

console.log("Sender:", senderBalance / LAMPORTS_PER_SOL, "SOL");
console.log("Receiver:", receiverBalance / LAMPORTS_PER_SOL, "SOL");
\`\`\`

## Your Challenge

Write a function \`sendSol\` that takes a connection, a sender keypair, a receiver public key, and an amount in SOL. It should build and send a transfer transaction, returning the transaction signature.`,
                challenge: {
                  create: {
                    prompt:
                      "Write a function `sendSol` that transfers SOL from a sender to a receiver on Solana devnet. The function should accept a Connection, a sender Keypair, a receiver PublicKey, and an amount in SOL (number). It must return the transaction signature string.",
                    starterCode: `import {
  Connection,
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

export async function sendSol(
  connection: Connection,
  sender: Keypair,
  receiver: PublicKey,
  amountInSol: number
): Promise<string> {
  // TODO: Create a transfer instruction using SystemProgram.transfer
  // TODO: Build a transaction and add the instruction
  // TODO: Send and confirm the transaction
  // TODO: Return the transaction signature
}`,
                    language: "typescript",
                    hints: [
                      "Use SystemProgram.transfer({ fromPubkey, toPubkey, lamports }) to create the instruction.",
                      "Convert SOL to lamports by multiplying by LAMPORTS_PER_SOL.",
                      "Use sendAndConfirmTransaction(connection, transaction, [signer]) to submit.",
                    ],
                    solution: `import {
  Connection,
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

export async function sendSol(
  connection: Connection,
  sender: Keypair,
  receiver: PublicKey,
  amountInSol: number
): Promise<string> {
  const transferIx = SystemProgram.transfer({
    fromPubkey: sender.publicKey,
    toPubkey: receiver,
    lamports: amountInSol * LAMPORTS_PER_SOL,
  });

  const tx = new Transaction().add(transferIx);
  const signature = await sendAndConfirmTransaction(connection, tx, [sender]);
  return signature;
}`,
                    testCases: {
                      create: [
                        {
                          name: "Returns a valid transaction signature",
                          input: "connection, senderKeypair, receiverPubkey, 0.5",
                          expectedOutput: "string (base-58 transaction signature)",
                          order: 0,
                        },
                        {
                          name: "Receiver balance increases by the correct amount",
                          input: "connection, senderKeypair, receiverPubkey, 1.0",
                          expectedOutput: "receiver balance increases by 1_000_000_000 lamports",
                          order: 1,
                        },
                        {
                          name: "Sender balance decreases by amount plus fees",
                          input: "connection, senderKeypair, receiverPubkey, 0.1",
                          expectedOutput:
                            "sender balance decreases by at least 100_000_000 lamports",
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

        // ────────────────────────────────────────────────────────────────────
        // Module 2: Accounts & Programs
        // ────────────────────────────────────────────────────────────────────
        {
          title: "Accounts & Programs",
          description:
            "Understand the Solana account model, program-derived addresses, and built-in programs.",
          order: 1,
          lessons: {
            create: [
              // Lesson 2.1 — The Account Model (content)
              {
                title: "The Account Model",
                description: "Deep dive into how Solana stores all on-chain state as accounts",
                type: "content",
                order: 0,
                xpReward: 25,
                duration: "20 min",
                content: `# The Account Model

Solana's account model is one of its most distinctive design decisions. Unlike Ethereum, where a smart contract bundles code and state together, Solana separates **programs** (code) from **accounts** (state). This separation enables parallel transaction execution and is central to Solana's performance.

## Account Structure

Every account on Solana has these fields:

| Field | Type | Description |
|-------|------|-------------|
| \`key\` | \`PublicKey\` (32 bytes) | The unique address of this account |
| \`lamports\` | \`u64\` | Balance in lamports (1 SOL = 10^9 lamports) |
| \`data\` | \`[u8]\` | Arbitrary byte array storing the account's state |
| \`owner\` | \`PublicKey\` | The program that controls this account |
| \`executable\` | \`bool\` | Whether this account contains executable program code |
| \`rent_epoch\` | \`u64\` | The epoch at which rent was last collected |

## Ownership Rules

The ownership model enforces strict access control:

1. **Only the owner program can modify an account's data.** If Account A is owned by Program X, only Program X's instructions can write to Account A's data field.
2. **Only the System Program can change the owner.** Account ownership transfers go through the System Program.
3. **Only the owner can debit lamports.** Any program can *credit* lamports to an account, but only the owner can debit.
4. **Executable accounts are immutable.** Once an account is marked executable, its data cannot be changed (except through upgrade authority mechanisms).

\`\`\`typescript
import { Connection, PublicKey } from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com");
const accountInfo = await connection.getAccountInfo(new PublicKey("..."));

if (accountInfo) {
  console.log("Owner:", accountInfo.owner.toBase58());
  console.log("Lamports:", accountInfo.lamports);
  console.log("Data length:", accountInfo.data.length);
  console.log("Executable:", accountInfo.executable);
}
\`\`\`

## Rent

Solana charges **rent** for storing data on-chain. Accounts must maintain a minimum lamport balance proportional to their data size. The minimum balance for an account to be **rent-exempt** is approximately 0.00089 SOL per byte per year, but accounts with enough lamports to cover two years of rent are permanently rent-exempt.

\`\`\`typescript
const rentExemptBalance = await connection.getMinimumBalanceForRentExemption(
  165 // bytes of data
);
console.log("Minimum balance:", rentExemptBalance, "lamports");
// ~2,039,280 lamports for a token account (165 bytes)
\`\`\`

## System-Owned vs Program-Owned Accounts

- **System-owned accounts** (owner = System Program): plain SOL wallets, newly created accounts before ownership transfer.
- **Program-owned accounts** (owner = some deployed program): data accounts for DeFi protocols, NFT metadata, governance proposals, etc.

## Why This Matters

The account model enables Solana's **Sealevel** runtime to execute transactions in parallel. Because each transaction declares which accounts it reads and writes, the runtime can identify non-overlapping transactions and process them simultaneously across multiple CPU cores. This is fundamentally different from Ethereum's sequential execution model and is a key reason Solana achieves high throughput.

Understanding accounts is essential for everything else in Solana development — from PDA derivation to token management to program design.`,
              },

              // Lesson 2.2 — Program Derived Addresses (content)
              {
                title: "Program Derived Addresses",
                description:
                  "Learn how PDAs create deterministic, program-controlled account addresses",
                type: "content",
                order: 1,
                xpReward: 30,
                duration: "25 min",
                content: `# Program Derived Addresses (PDAs)

Program Derived Addresses are one of the most important concepts in Solana development. A PDA is a public key that is **deterministically derived** from a program ID and a set of seeds, and it is guaranteed to **not lie on the Ed25519 curve** — meaning no private key exists for it. This makes PDAs ideal for accounts that should be controlled exclusively by a program.

## How PDAs Work

PDAs are derived using \`PublicKey.findProgramAddressSync(seeds, programId)\`. Under the hood, this function:

1. Hashes the seeds together with the program ID and a **bump seed** (starting at 255)
2. Checks if the resulting point lies on the Ed25519 curve
3. If it does, decrements the bump and tries again
4. Returns the first off-curve address and its bump seed

\`\`\`typescript
import { PublicKey } from "@solana/web3.js";

const programId = new PublicKey("YourProgramId111111111111111111111111111111");

// Derive a PDA from seeds
const [pda, bump] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("user-profile"),
    userPublicKey.toBuffer(),
  ],
  programId
);

console.log("PDA:", pda.toBase58());
console.log("Bump:", bump);
\`\`\`

## Why PDAs Are Off-Curve

Solana uses Ed25519 for its cryptographic signatures. A valid public key is a point on the Ed25519 curve. When we derive a PDA, we intentionally produce a key that does **not** correspond to any point on this curve. This guarantees:

- **No one holds the private key** — the account cannot sign transactions
- **Only the program can authorize writes** — through CPI with \`invoke_signed\`
- **The address is deterministic** — anyone can re-derive it from the same seeds

## Common PDA Patterns

### 1. Singleton (Config / Global State)
\`\`\`typescript
const [configPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("config")],
  programId
);
\`\`\`

### 2. Per-User Account
\`\`\`typescript
const [profilePda] = PublicKey.findProgramAddressSync(
  [Buffer.from("profile"), userKey.toBuffer()],
  programId
);
\`\`\`

### 3. Association (User + Resource)
\`\`\`typescript
const [enrollmentPda] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("enrollment"),
    Buffer.from(courseId),
    userKey.toBuffer(),
  ],
  programId
);
\`\`\`

## Bump Seed Best Practices

The bump seed ensures the derived address is off-curve. Best practices:

- **Store the canonical bump** on-chain when the PDA is first created
- **Never recalculate** the bump on every instruction — read it from the account
- **Use \`findProgramAddressSync\`** on the client, which always returns the canonical (highest valid) bump

## Signing with PDAs

Programs can "sign" for their PDAs using \`invoke_signed\` in on-chain code:

\`\`\`rust
invoke_signed(
    &instruction,
    &[account_infos],
    &[&[b"user-profile", user.key.as_ref(), &[bump]]],
)?;
\`\`\`

The runtime verifies that the seeds + bump + program ID reproduce the expected PDA address. This is how programs authorize operations on PDA-owned accounts (like transferring tokens from a vault).

PDAs are the backbone of Solana program architecture. Almost every non-trivial program uses them for state management, token vaults, and access control.`,
              },

              // Lesson 2.3 — Create a PDA (challenge)
              {
                title: "Create a PDA",
                description: "Derive a PDA using findProgramAddressSync",
                type: "challenge",
                order: 2,
                xpReward: 50,
                duration: "30 min",
                content: `# Create a PDA

In this challenge, you'll put your PDA knowledge into practice by writing a function that derives a Program Derived Address from a set of seeds.

## Recap

A PDA is derived from:
1. **Seeds** — one or more byte arrays that uniquely identify the account
2. **Program ID** — the public key of the program that will own the account
3. **Bump seed** — an additional byte (found by \`findProgramAddressSync\`) that pushes the address off the Ed25519 curve

\`\`\`typescript
import { PublicKey } from "@solana/web3.js";

const [pda, bump] = PublicKey.findProgramAddressSync(
  [Buffer.from("seed1"), Buffer.from("seed2")],
  programId
);
\`\`\`

## Real-World Example: User Profile PDA

Many Solana programs store per-user state in PDA accounts. For example, a learning platform might store a learner's profile at:

\`\`\`
seeds = ["learner", user_pubkey]
\`\`\`

This ensures:
- Each user has exactly one profile account (deterministic)
- The program controls the account (no private key)
- Anyone can compute the address given the user's public key

## Encoding Different Seed Types

Seeds must be \`Buffer\` or \`Uint8Array\`. Here's how to encode common types:

\`\`\`typescript
// String seed
Buffer.from("my-seed")

// PublicKey seed
userPublicKey.toBuffer()

// Number seed (u32, little-endian)
const buf = Buffer.alloc(4);
buf.writeUInt32LE(42);
// Or: new Uint8Array(new Uint32Array([42]).buffer)

// Number seed (u64, using BigInt)
const buf64 = Buffer.alloc(8);
buf64.writeBigUInt64LE(BigInt(12345));
\`\`\`

## Your Challenge

Write a function \`deriveProfilePDA\` that takes a user's public key and a program ID, and returns both the PDA address and the bump seed. Use the seeds \`["learner", <user_pubkey_bytes>]\`.

Then write a second function \`deriveEnrollmentPDA\` that takes a course ID string, a user's public key, and a program ID. Use the seeds \`["enrollment", <course_id_bytes>, <user_pubkey_bytes>]\`.`,
                challenge: {
                  create: {
                    prompt:
                      'Write two functions: `deriveProfilePDA(userPubkey, programId)` returns `[PublicKey, number]` using seeds `["learner", userPubkey]`. `deriveEnrollmentPDA(courseId, userPubkey, programId)` returns `[PublicKey, number]` using seeds `["enrollment", courseId, userPubkey]`.',
                    starterCode: `import { PublicKey } from "@solana/web3.js";

export function deriveProfilePDA(
  userPubkey: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  // TODO: Use PublicKey.findProgramAddressSync with seeds ["learner", userPubkey]
  // TODO: Return [pda, bump]
}

export function deriveEnrollmentPDA(
  courseId: string,
  userPubkey: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  // TODO: Use PublicKey.findProgramAddressSync with seeds ["enrollment", courseId, userPubkey]
  // TODO: Return [pda, bump]
}`,
                    language: "typescript",
                    hints: [
                      'Convert string seeds with Buffer.from("learner"), and use .toBuffer() for PublicKey seeds.',
                      "findProgramAddressSync returns a tuple [PublicKey, number] — the PDA and its bump.",
                      "For deriveEnrollmentPDA, you need three seed buffers: the label, the courseId string, and the user pubkey.",
                    ],
                    solution: `import { PublicKey } from "@solana/web3.js";

export function deriveProfilePDA(
  userPubkey: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("learner"), userPubkey.toBuffer()],
    programId
  );
}

export function deriveEnrollmentPDA(
  courseId: string,
  userPubkey: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("enrollment"), Buffer.from(courseId), userPubkey.toBuffer()],
    programId
  );
}`,
                    testCases: {
                      create: [
                        {
                          name: "deriveProfilePDA returns a valid PDA off the Ed25519 curve",
                          input: "userPubkey, programId",
                          expectedOutput:
                            "[PublicKey, number] where the PublicKey is a valid off-curve address",
                          order: 0,
                        },
                        {
                          name: "deriveProfilePDA is deterministic for the same inputs",
                          input: "same userPubkey and programId called twice",
                          expectedOutput: "both calls return identical PDA and bump",
                          order: 1,
                        },
                        {
                          name: "deriveEnrollmentPDA returns different PDAs for different courseIds",
                          input: 'courseId "course-a" vs "course-b", same user and program',
                          expectedOutput: "two distinct PDA addresses",
                          order: 2,
                        },
                        {
                          name: "Bump seed is between 0 and 255",
                          input: "any valid inputs",
                          expectedOutput: "bump >= 0 && bump <= 255",
                          order: 3,
                        },
                      ],
                    },
                  },
                },
              },

              // Lesson 2.4 — Solana Programs Overview (content)
              {
                title: "Solana Programs Overview",
                description:
                  "How programs work on Solana: deployment, execution, and cross-program invocation",
                type: "content",
                order: 3,
                xpReward: 25,
                duration: "20 min",
                content: `# Solana Programs Overview

Programs on Solana are the equivalent of smart contracts on other blockchains. They contain executable logic that processes instructions and modifies account state. Understanding how programs work is essential before you start writing or interacting with them.

## Program Basics

A Solana program is an account whose \`executable\` flag is set to \`true\`. The account's data field contains the compiled BPF (Berkeley Packet Filter) bytecode. Programs are most commonly written in Rust using the **Anchor** framework, though you can also use raw Rust with the \`solana-program\` crate, or even C.

Key properties of programs:

- **Stateless**: Programs don't store state internally. All state is in separate accounts passed as instruction arguments.
- **Deterministic**: Given the same inputs, a program always produces the same outputs.
- **Upgradeable**: By default, programs can be upgraded by their upgrade authority. Immutable programs have their upgrade authority revoked.

## Instruction Processing

When a transaction reaches a validator, the runtime processes each instruction sequentially:

\`\`\`
Transaction
  ├── Instruction 1 → Program A (accounts: [a1, a2, a3])
  ├── Instruction 2 → Program B (accounts: [a4, a5])
  └── Instruction 3 → Program A (accounts: [a1, a6])
\`\`\`

For each instruction, the runtime:
1. Loads the program's BPF bytecode
2. Passes the instruction data and account references to the program's entrypoint
3. The program validates accounts, deserializes data, executes logic, and serializes updated state
4. If the program returns an error, the **entire transaction** is rolled back

## Cross-Program Invocation (CPI)

Programs can call other programs within the same transaction using CPI. This is how composability works on Solana:

\`\`\`rust
// Inside a Solana program (Rust)
use anchor_lang::prelude::*;

// Transfer SOL via CPI to the System Program
let transfer_ix = system_instruction::transfer(
    &ctx.accounts.sender.key(),
    &ctx.accounts.receiver.key(),
    amount,
);

invoke(
    &transfer_ix,
    &[
        ctx.accounts.sender.to_account_info(),
        ctx.accounts.receiver.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
    ],
)?;
\`\`\`

CPI depth is limited to **4 levels** (a program can call a program that calls a program, up to 4 deep).

## Compute Units

Every instruction has a **compute budget**. The default is 200,000 compute units (CU) per instruction, with a maximum of 1.4 million CU per transaction. Complex operations consume more CU:

| Operation | Approximate CU |
|-----------|---------------|
| SHA256 hash | ~90 CU per 32 bytes |
| Ed25519 verify | ~25,000 CU |
| CPI call | ~1,000 CU overhead |
| Account creation | ~5,000 CU |

If a program exceeds its compute budget, the transaction fails. You can request additional CU with a \`ComputeBudgetInstruction\`.

## The Anchor Framework

Most Solana programs today use **Anchor**, which provides:

- **Account validation macros**: Automatically verify account ownership, PDA derivation, and constraints
- **Serialization/deserialization**: Borsh-based, with \`#[account]\` and \`#[derive(Accounts)]\` macros
- **IDL generation**: Produces a JSON interface definition for client-side code generation
- **Testing utilities**: TypeScript test harness with built-in provider setup

Anchor dramatically reduces boilerplate and eliminates entire classes of security bugs that are common in raw Solana programs.`,
              },

              // Lesson 2.5 — System Program & Built-ins (content)
              {
                title: "System Program & Built-ins",
                description:
                  "Explore the System Program, SPL Token program, and other core built-in programs",
                type: "content",
                order: 4,
                xpReward: 25,
                duration: "15 min",
                content: `# System Program & Built-in Programs

Solana ships with several built-in programs (sometimes called "native programs") that provide fundamental functionality. These programs are deployed at well-known addresses and are available on every Solana cluster.

## The System Program

The **System Program** (\`11111111111111111111111111111111\`) is the most fundamental program on Solana. It handles:

- **Creating new accounts**: Allocating space and assigning ownership
- **Transferring SOL**: Moving lamports between accounts
- **Assigning ownership**: Changing which program owns an account
- **Allocating space**: Resizing an account's data field

\`\`\`typescript
import { SystemProgram, Transaction, Keypair } from "@solana/web3.js";

// Create a new account
const newAccount = Keypair.generate();
const createAccountIx = SystemProgram.createAccount({
  fromPubkey: payer.publicKey,
  newAccountPubkey: newAccount.publicKey,
  lamports: rentExemptBalance,
  space: 165, // bytes of data
  programId: ownerProgramId,
});

// Transfer SOL
const transferIx = SystemProgram.transfer({
  fromPubkey: sender.publicKey,
  toPubkey: receiver.publicKey,
  lamports: 1_000_000_000, // 1 SOL
});
\`\`\`

## SPL Token Program

The **SPL Token Program** (\`TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA\`) manages fungible and non-fungible tokens on Solana. It defines the standard for:

- **Mints**: Token definitions (supply, decimals, mint authority)
- **Token accounts**: Per-user balances for a specific mint
- **Transfers**: Moving tokens between accounts
- **Minting/Burning**: Creating or destroying token supply

There's also **Token-2022** (\`TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb\`), an extended version with features like transfer fees, non-transferable tokens, confidential transfers, and metadata extensions.

## Associated Token Account Program

The **ATA Program** (\`ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL\`) provides a deterministic way to find a user's token account for any given mint:

\`\`\`typescript
import { getAssociatedTokenAddress } from "@solana/spl-token";

const ata = await getAssociatedTokenAddress(
  mintPublicKey,    // which token
  ownerPublicKey    // whose account
);
// ATA address is derived from: [owner, TOKEN_PROGRAM_ID, mint]
\`\`\`

This eliminates the need for users to manually create token accounts — the ATA can be created on their behalf.

## Other Important Programs

| Program | Address | Purpose |
|---------|---------|---------|
| **BPF Loader** | \`BPFLoaderUpgradeab1e...\` | Deploys and upgrades programs |
| **Stake Program** | \`Stake11111111111111...\` | Manages SOL staking |
| **Vote Program** | \`Vote111111111111111...\` | Validator voting |
| **Compute Budget** | \`ComputeBudget111111...\` | Sets CU limits and priority fees |
| **Address Lookup Table** | \`AddressLookupTab1e1...\` | Stores account lists for versioned transactions |
| **Memo Program** | \`MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr\` | Attaches arbitrary text to transactions |

## Interacting from TypeScript

\`\`\`typescript
import { Connection, PublicKey } from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com");

// Fetch a program account to verify it's executable
const programInfo = await connection.getAccountInfo(
  new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
);

console.log("Executable:", programInfo?.executable); // true
console.log("Owner:", programInfo?.owner.toBase58()); // BPF Loader
\`\`\`

Understanding these built-in programs is essential because virtually every Solana application interacts with them — whether you're transferring SOL, managing tokens, or deploying your own programs.`,
              },
            ],
          },
        },

        // ────────────────────────────────────────────────────────────────────
        // Module 3: Transactions Deep Dive
        // ────────────────────────────────────────────────────────────────────
        {
          title: "Transactions Deep Dive",
          description:
            "Master Solana transaction structure, versioned transactions, multi-instruction patterns, and error handling.",
          order: 2,
          lessons: {
            create: [
              // Lesson 3.1 — Transaction Anatomy (content)
              {
                title: "Transaction Anatomy",
                description:
                  "Understand the full structure of a Solana transaction: headers, instructions, and signatures",
                type: "content",
                order: 0,
                xpReward: 30,
                duration: "20 min",
                content: `# Transaction Anatomy

A Solana transaction is a compact, binary-serialized message that contains one or more instructions, references to all required accounts, a recent blockhash, and one or more signatures. Understanding this structure is critical for debugging, optimizing, and building advanced transaction workflows.

## Transaction Structure

At the binary level, a transaction consists of:

\`\`\`
Transaction
├── Signatures: [Signature, ...]        // 64 bytes each
└── Message
    ├── Header
    │   ├── num_required_signatures: u8
    │   ├── num_readonly_signed: u8
    │   └── num_readonly_unsigned: u8
    ├── Account Keys: [PublicKey, ...]   // 32 bytes each
    ├── Recent Blockhash: Hash           // 32 bytes
    └── Instructions: [CompiledInstruction, ...]
        ├── program_id_index: u8
        ├── account_indexes: [u8, ...]
        └── data: [u8, ...]
\`\`\`

## The Message Header

The header tells the runtime how to interpret the account keys array:

- **num_required_signatures**: How many accounts at the start of the array must sign the transaction
- **num_readonly_signed**: Of those signers, how many are read-only (e.g., a program signer via PDA)
- **num_readonly_unsigned**: How many accounts at the end of the array are read-only

Account keys are ordered: writable signers first, then read-only signers, then writable non-signers, then read-only non-signers.

## Instructions

Each compiled instruction references accounts by their **index** in the account keys array, not by their full public key. This deduplication saves space — if multiple instructions reference the same account, its key appears only once.

\`\`\`typescript
import {
  Connection,
  Transaction,
  SystemProgram,
  Keypair,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

const tx = new Transaction();

// Add multiple instructions to one transaction
tx.add(
  SystemProgram.transfer({
    fromPubkey: sender.publicKey,
    toPubkey: receiver1.publicKey,
    lamports: 0.1 * LAMPORTS_PER_SOL,
  })
);
tx.add(
  SystemProgram.transfer({
    fromPubkey: sender.publicKey,
    toPubkey: receiver2.publicKey,
    lamports: 0.2 * LAMPORTS_PER_SOL,
  })
);

// The sender's key appears once in the compiled message
\`\`\`

## Recent Blockhash

Every transaction includes a **recent blockhash** which serves two purposes:

1. **Replay protection**: Transactions with the same blockhash and signatures are deduplicated
2. **Expiration**: A blockhash is valid for approximately 60-90 seconds (~150 slots). After that, the transaction is rejected

\`\`\`typescript
const { blockhash, lastValidBlockHeight } =
  await connection.getLatestBlockhash();

tx.recentBlockhash = blockhash;
tx.lastValidBlockHeight = lastValidBlockHeight;
\`\`\`

## Transaction Size Limits

A serialized transaction must fit within **1,232 bytes** (one IPv6 MTU). This limits:

- Maximum ~20-35 accounts per transaction (depending on instruction data)
- Maximum instruction data size (shared across all instructions)
- Number of instructions per transaction

This size limit is why **versioned transactions** with Address Lookup Tables were introduced — they allow referencing more accounts by using shorter indices instead of full 32-byte public keys.

## Fees

Transaction fees on Solana have two components:

1. **Base fee**: 5,000 lamports per signature (typically 1 signature = 5,000 lamports = ~$0.001)
2. **Priority fee**: Optional additional fee per compute unit to get faster inclusion during network congestion

\`\`\`typescript
import { ComputeBudgetProgram } from "@solana/web3.js";

tx.add(
  ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: 50_000, // priority fee per CU
  })
);
\`\`\`

Understanding transaction anatomy helps you debug serialization errors, optimize for the 1,232-byte limit, and build efficient multi-instruction workflows.`,
              },

              // Lesson 3.2 — Versioned Transactions (content)
              {
                title: "Versioned Transactions",
                description:
                  "Learn about v0 transactions, Address Lookup Tables, and when to use them",
                type: "content",
                order: 1,
                xpReward: 35,
                duration: "25 min",
                content: `# Versioned Transactions

Solana introduced **Versioned Transactions** to overcome the account limit imposed by the 1,232-byte transaction size cap. The key innovation is **Address Lookup Tables (ALTs)**, which allow transactions to reference accounts by compact indices rather than full 32-byte public keys.

## Legacy vs Versioned Transactions

**Legacy transactions** (the original format) include every account's full public key in the transaction message. With a 1,232-byte limit, this restricts you to roughly 20-35 accounts per transaction.

**Version 0 (v0) transactions** split account references into two categories:

1. **Static accounts**: Full 32-byte keys included in the message (same as legacy)
2. **Lookup table accounts**: Referenced by a 1-byte index into a previously created ALT

This means a single v0 transaction can reference up to **256 accounts** from each lookup table, dramatically expanding what's possible in a single atomic transaction.

## Address Lookup Tables

An ALT is an on-chain account that stores a list of public keys. Once created and populated, any transaction can reference it:

\`\`\`typescript
import {
  AddressLookupTableProgram,
  Connection,
  Keypair,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";

// Step 1: Create a lookup table
const [createIx, lookupTableAddress] =
  AddressLookupTableProgram.createLookupTable({
    authority: payer.publicKey,
    payer: payer.publicKey,
    recentSlot: await connection.getSlot(),
  });

// Step 2: Add addresses to the table
const extendIx = AddressLookupTableProgram.extendLookupTable({
  payer: payer.publicKey,
  authority: payer.publicKey,
  lookupTable: lookupTableAddress,
  addresses: [account1, account2, account3, /* ...many more */],
});
\`\`\`

ALTs need to be **activated** (warm-up period of ~1 slot) before they can be used in transactions.

## Building v0 Transactions

The API for v0 transactions uses \`TransactionMessage\` and \`VersionedTransaction\` instead of the legacy \`Transaction\` class:

\`\`\`typescript
// Fetch the lookup table account
const lookupTableAccount = (
  await connection.getAddressLookupTable(lookupTableAddress)
).value;

// Build the v0 message
const messageV0 = new TransactionMessage({
  payerKey: payer.publicKey,
  recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
  instructions: [instruction1, instruction2, instruction3],
}).compileToV0Message([lookupTableAccount]); // pass ALTs here

// Create and sign the versioned transaction
const versionedTx = new VersionedTransaction(messageV0);
versionedTx.sign([payer]);

// Send
const signature = await connection.sendTransaction(versionedTx);
\`\`\`

## When to Use Versioned Transactions

Use v0 transactions when:

- **DeFi routing**: Swapping through multiple pools in a single transaction (Jupiter aggregator uses this)
- **Batch operations**: Transferring tokens to many recipients at once
- **Complex CPI chains**: Programs that touch many accounts across multiple CPIs
- **NFT operations**: Interacting with Metaplex programs that require many accounts

For simple transactions (1-2 instructions, <10 accounts), legacy transactions work fine.

## Compatibility Notes

- **Wallets**: Most modern wallets (Phantom, Backpack, Solflare) support v0 transactions
- **RPC**: All modern RPC providers support v0
- **Programs**: Programs don't need to change — versioned transactions are a message format, not a program-level concept
- **Simulation**: \`connection.simulateTransaction()\` works with \`VersionedTransaction\`

\`\`\`typescript
// Simulate before sending
const simulation = await connection.simulateTransaction(versionedTx);
if (simulation.value.err) {
  console.error("Simulation failed:", simulation.value.err);
  console.log("Logs:", simulation.value.logs);
}
\`\`\`

Versioned transactions are now the standard for any production Solana application that interacts with DeFi protocols or performs complex on-chain operations.`,
              },

              // Lesson 3.3 — Build a Multi-Instruction TX (challenge)
              {
                title: "Build a Multi-Instruction TX",
                description:
                  "Construct a transaction with multiple instructions executed atomically",
                type: "challenge",
                order: 2,
                xpReward: 75,
                duration: "35 min",
                content: `# Build a Multi-Instruction Transaction

One of Solana's most powerful features is the ability to bundle multiple instructions into a single atomic transaction. If any instruction fails, the entire transaction is rolled back — no partial state changes. This enables complex operations like "create account + initialize data + transfer tokens" in one step.

## Why Multi-Instruction Transactions?

Consider creating a new SPL token account and transferring tokens to it. In a naive approach, you'd need two separate transactions — but if the second one fails, you're left with an empty token account. With multi-instruction transactions, both operations succeed or neither does:

\`\`\`typescript
import {
  Connection,
  Keypair,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

const tx = new Transaction();

// Instruction 1: Transfer to Alice
tx.add(SystemProgram.transfer({
  fromPubkey: sender.publicKey,
  toPubkey: alice.publicKey,
  lamports: 0.5 * LAMPORTS_PER_SOL,
}));

// Instruction 2: Transfer to Bob
tx.add(SystemProgram.transfer({
  fromPubkey: sender.publicKey,
  toPubkey: bob.publicKey,
  lamports: 0.3 * LAMPORTS_PER_SOL,
}));

// Instruction 3: Memo
tx.add(/* memo instruction */);

// All three execute atomically
const sig = await sendAndConfirmTransaction(connection, tx, [sender]);
\`\`\`

## Instruction Ordering

Instructions within a transaction execute **sequentially**, in the order they're added. This matters because:

- An account created in instruction 1 can be used in instruction 2
- State modified in instruction 1 is visible to instruction 2
- If instruction 2 fails, instruction 1's changes are also rolled back

## Compute Budget Considerations

Each instruction has its own compute budget, but the **total transaction compute budget** is shared. The default per-transaction limit is 200,000 CU, but you can request up to 1.4 million:

\`\`\`typescript
import { ComputeBudgetProgram } from "@solana/web3.js";

tx.add(
  ComputeBudgetProgram.setComputeUnitLimit({
    units: 400_000,
  })
);
\`\`\`

Always add compute budget instructions **first** in the transaction.

## Practical Pattern: Batch Transfers

A common pattern is distributing SOL or tokens to multiple recipients in a single transaction:

\`\`\`typescript
function buildBatchTransfer(
  sender: PublicKey,
  recipients: { address: PublicKey; amount: number }[]
): Transaction {
  const tx = new Transaction();

  for (const recipient of recipients) {
    tx.add(
      SystemProgram.transfer({
        fromPubkey: sender,
        toPubkey: recipient.address,
        lamports: recipient.amount * LAMPORTS_PER_SOL,
      })
    );
  }

  return tx;
}
\`\`\`

## Your Challenge

Write a function that builds a multi-instruction transaction to transfer SOL to multiple recipients. The function should accept a connection, a sender keypair, and an array of recipients (each with an address and amount). It should send the transaction and return the signature.`,
                challenge: {
                  create: {
                    prompt:
                      "Write a function `batchTransfer` that takes a Connection, a sender Keypair, and an array of `{ address: PublicKey, amountInSol: number }` recipients. Build a single transaction with one SystemProgram.transfer instruction per recipient, send it, and return the transaction signature.",
                    starterCode: `import {
  Connection,
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

interface Recipient {
  address: PublicKey;
  amountInSol: number;
}

export async function batchTransfer(
  connection: Connection,
  sender: Keypair,
  recipients: Recipient[]
): Promise<string> {
  // TODO: Create a new Transaction
  // TODO: For each recipient, add a SystemProgram.transfer instruction
  // TODO: Send and confirm the transaction
  // TODO: Return the signature
}`,
                    language: "typescript",
                    hints: [
                      "Loop through the recipients array and call tx.add() for each one with SystemProgram.transfer.",
                      "Convert amountInSol to lamports by multiplying by LAMPORTS_PER_SOL.",
                      "Use sendAndConfirmTransaction(connection, tx, [sender]) — only the sender needs to sign since all transfers debit from the sender.",
                    ],
                    solution: `import {
  Connection,
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

interface Recipient {
  address: PublicKey;
  amountInSol: number;
}

export async function batchTransfer(
  connection: Connection,
  sender: Keypair,
  recipients: Recipient[]
): Promise<string> {
  const tx = new Transaction();

  for (const recipient of recipients) {
    tx.add(
      SystemProgram.transfer({
        fromPubkey: sender.publicKey,
        toPubkey: recipient.address,
        lamports: recipient.amountInSol * LAMPORTS_PER_SOL,
      })
    );
  }

  const signature = await sendAndConfirmTransaction(connection, tx, [sender]);
  return signature;
}`,
                    testCases: {
                      create: [
                        {
                          name: "Returns a valid transaction signature",
                          input:
                            "connection, sender, [{address: pubkey1, amountInSol: 0.1}, {address: pubkey2, amountInSol: 0.2}]",
                          expectedOutput: "string (base-58 transaction signature)",
                          order: 0,
                        },
                        {
                          name: "All recipients receive correct amounts",
                          input:
                            "connection, sender, [{address: pubkey1, amountInSol: 0.5}, {address: pubkey2, amountInSol: 0.3}]",
                          expectedOutput:
                            "pubkey1 balance +500_000_000 lamports, pubkey2 balance +300_000_000 lamports",
                          order: 1,
                        },
                        {
                          name: "Transaction is atomic — single signature for all transfers",
                          input: "connection, sender, 3 recipients",
                          expectedOutput:
                            "one transaction signature (not multiple separate transactions)",
                          order: 2,
                        },
                      ],
                    },
                  },
                },
              },

              // Lesson 3.4 — Error Handling & Retries (challenge)
              {
                title: "Error Handling & Retries",
                description:
                  "Implement robust transaction sending with error handling and retry logic",
                type: "challenge",
                order: 3,
                xpReward: 75,
                duration: "30 min",
                content: `# Error Handling & Retries

In production Solana applications, transactions can fail for many reasons: network congestion, expired blockhashes, insufficient compute units, or transient RPC errors. Robust applications need proper error handling and retry logic to handle these cases gracefully.

## Common Transaction Errors

| Error | Cause | Solution |
|-------|-------|----------|
| \`BlockhashNotFound\` | Blockhash expired before landing | Retry with a fresh blockhash |
| \`InsufficientFundsForRent\` | Account doesn't have enough for rent exemption | Fund the account first |
| \`InstructionError\` | Program returned an error | Check program logs for details |
| \`TransactionExpiredBlockheightExceededError\` | Block height exceeded \`lastValidBlockHeight\` | Retry with new blockhash |

## Handling Transaction Errors

\`\`\`typescript
import {
  Connection,
  Transaction,
  sendAndConfirmTransaction,
  TransactionExpiredBlockheightExceededError,
} from "@solana/web3.js";

try {
  const signature = await sendAndConfirmTransaction(connection, tx, [signer]);
  console.log("Success:", signature);
} catch (error) {
  if (error instanceof TransactionExpiredBlockheightExceededError) {
    console.log("Transaction expired, retrying...");
  } else if (error instanceof Error && error.message.includes("Blockhash not found")) {
    console.log("Blockhash expired, fetching new one...");
  } else {
    console.error("Unexpected error:", error);
  }
}
\`\`\`

## Confirmation Strategy

The \`sendAndConfirmTransaction\` helper internally sends the transaction and polls for confirmation. For more control, separate sending from confirmation:

\`\`\`typescript
// Send without waiting for confirmation
const signature = await connection.sendRawTransaction(tx.serialize(), {
  skipPreflight: false,
  maxRetries: 3,
});

// Confirm with timeout
const latestBlockhash = await connection.getLatestBlockhash();
const confirmation = await connection.confirmTransaction({
  signature,
  blockhash: latestBlockhash.blockhash,
  lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
});

if (confirmation.value.err) {
  throw new Error(\`Transaction failed: \${JSON.stringify(confirmation.value.err)}\`);
}
\`\`\`

## Retry Pattern with Exponential Backoff

A production-grade retry function should:

1. Fetch a fresh blockhash on each attempt
2. Use exponential backoff between retries
3. Set a maximum number of attempts
4. Distinguish retryable errors from permanent failures

\`\`\`typescript
async function sendWithRetry(
  connection: Connection,
  buildTx: (blockhash: string) => Transaction,
  signers: Keypair[],
  maxRetries: number = 3
): Promise<string> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const { blockhash } = await connection.getLatestBlockhash();
      const tx = buildTx(blockhash);
      return await sendAndConfirmTransaction(connection, tx, signers);
    } catch (error) {
      const isRetryable =
        error instanceof TransactionExpiredBlockheightExceededError ||
        (error instanceof Error && error.message.includes("Blockhash not found"));

      if (!isRetryable || attempt === maxRetries - 1) {
        throw error;
      }

      const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Max retries exceeded");
}
\`\`\`

## Simulation Before Sending

Always simulate transactions before sending to catch errors early:

\`\`\`typescript
const simulation = await connection.simulateTransaction(tx);

if (simulation.value.err) {
  console.error("Simulation error:", simulation.value.err);
  console.log("Program logs:", simulation.value.logs);
  throw new Error("Transaction would fail");
}
\`\`\`

## Your Challenge

Write a function \`sendWithRetry\` that accepts a connection, a transaction-builder function, signers, and a max retry count. It should retry on blockhash expiration errors with exponential backoff, and throw on non-retryable errors.`,
                challenge: {
                  create: {
                    prompt:
                      "Write a function `sendWithRetry` that takes a Connection, a `buildTx` callback `(blockhash: string) => Transaction`, a signers array `Keypair[]`, and `maxRetries` (default 3). On each attempt, fetch a fresh blockhash, call `buildTx(blockhash)`, and send. If the error is a blockhash/expiration error, retry with exponential backoff (2^attempt * 1000ms). For non-retryable errors, throw immediately. Return the signature on success.",
                    starterCode: `import {
  Connection,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
  TransactionExpiredBlockheightExceededError,
} from "@solana/web3.js";

export async function sendWithRetry(
  connection: Connection,
  buildTx: (blockhash: string) => Transaction,
  signers: Keypair[],
  maxRetries: number = 3
): Promise<string> {
  // TODO: Loop up to maxRetries times
  // TODO: On each attempt, fetch a fresh blockhash from the connection
  // TODO: Call buildTx(blockhash) to get a transaction
  // TODO: Try sendAndConfirmTransaction
  // TODO: If the error is retryable (blockhash/expiration), wait with exponential backoff
  // TODO: If the error is NOT retryable, throw immediately
  // TODO: If all retries exhausted, throw an error
}`,
                    language: "typescript",
                    hints: [
                      "Use connection.getLatestBlockhash() to get a fresh blockhash on each attempt.",
                      "Check for TransactionExpiredBlockheightExceededError or error messages containing 'Blockhash not found' to identify retryable errors.",
                      "Compute delay as Math.pow(2, attempt) * 1000 and use await new Promise(resolve => setTimeout(resolve, delay)) for the backoff.",
                    ],
                    solution: `import {
  Connection,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
  TransactionExpiredBlockheightExceededError,
} from "@solana/web3.js";

export async function sendWithRetry(
  connection: Connection,
  buildTx: (blockhash: string) => Transaction,
  signers: Keypair[],
  maxRetries: number = 3
): Promise<string> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const { blockhash } = await connection.getLatestBlockhash();
      const tx = buildTx(blockhash);
      const signature = await sendAndConfirmTransaction(connection, tx, signers);
      return signature;
    } catch (error) {
      const isRetryable =
        error instanceof TransactionExpiredBlockheightExceededError ||
        (error instanceof Error &&
          error.message.includes("Blockhash not found"));

      if (!isRetryable || attempt === maxRetries - 1) {
        throw error;
      }

      const delay = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error("Max retries exceeded");
}`,
                    testCases: {
                      create: [
                        {
                          name: "Returns signature on first successful attempt",
                          input: "connection, buildTx (succeeds), [signer], maxRetries=3",
                          expectedOutput: "string (base-58 transaction signature)",
                          order: 0,
                        },
                        {
                          name: "Retries on blockhash expiration and succeeds on second attempt",
                          input:
                            "connection, buildTx (fails once with BlockhashNotFound, then succeeds), [signer], maxRetries=3",
                          expectedOutput: "string (signature from second attempt)",
                          order: 1,
                        },
                        {
                          name: "Throws immediately on non-retryable errors",
                          input:
                            "connection, buildTx (fails with InsufficientFunds), [signer], maxRetries=3",
                          expectedOutput: "throws InsufficientFunds error without retrying",
                          order: 2,
                        },
                        {
                          name: "Throws after exhausting all retries",
                          input:
                            "connection, buildTx (always fails with BlockhashNotFound), [signer], maxRetries=2",
                          expectedOutput: "throws error after 2 attempts",
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
