export interface Course {
  slug: string;
  title: string;
  description: string;
  instructor: string;
  instructorAvatar: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  lessons: number;
  modules: Module[];
  rating: number;
  enrolled: number;
  tags: string[];
  progress: number;
  xp: number;
  thumbnail: string;
}

/** Lightweight type for course cards — no modules/content */
export type CourseCardData = Omit<Course, "modules">;

export interface Module {
  title: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  type: "video" | "reading" | "challenge";
  duration: string;
  completed: boolean;
  content?: string;
  starterCode?: string;
  testCases?: Array<{ name: string; expected: string }>;
}

export const courses: Course[] = [
  {
    slug: "solana-fundamentals",
    title: "Solana Fundamentals",
    description:
      "Master the basics of Solana blockchain development. Learn about accounts, transactions, programs, and the Solana runtime from scratch.",
    instructor: "Ana Silva",
    instructorAvatar: "AS",
    difficulty: "Beginner",
    duration: "12h 30m",
    lessons: 42,
    rating: 4.9,
    enrolled: 0,
    tags: ["Solana", "Blockchain", "Rust"],
    progress: 0,
    xp: 2400,
    thumbnail: "/solana.jpg",
    modules: [
      {
        title: "Introduction to Solana",
        lessons: [
          {
            id: "1-1",
            title: "What is Solana?",
            type: "reading",
            duration: "8m",
            completed: false,
            content: `## What is Solana?

Solana is a high-performance Layer 1 blockchain designed for mass adoption. Unlike Ethereum's sequential transaction processing, Solana uses a combination of **Proof of History (PoH)** and **Tower BFT consensus** to achieve throughput exceeding 4,000 transactions per second with sub-second finality.

### Key Differentiators

- **Proof of History**: A cryptographic clock that orders events before consensus, eliminating the need for validators to communicate timestamps. Each validator maintains a SHA-256 hash chain that proves time has passed between events.
- **Parallel Execution (Sealevel)**: Solana's runtime can process thousands of smart contracts in parallel by analyzing transaction account dependencies at the scheduler level. If two transactions touch different accounts, they run simultaneously across available cores.
- **Low Fees**: Transaction fees are typically under $0.001, making micro-transactions and high-frequency interactions economically viable.

### The Account Model

Everything on Solana is an **account**. Programs (smart contracts), user wallets, token balances, and application state all live in accounts. Each account has an owner program, a lamport balance, and a data field. This is fundamentally different from Ethereum's contract storage model and is one of the first concepts you need to internalize.

### Why Build on Solana?

Solana's architecture enables use cases impossible on slower chains: order-book DEXes (Phoenix, OpenBook), real-time gaming (Star Atlas), high-frequency DeFi (Jupiter, Marinade), and compressed NFT collections with millions of items. The developer ecosystem includes Anchor (Rust framework), robust TypeScript SDKs, and tools like Solana Explorer and Helius for indexing.`,
          },
          {
            id: "1-2",
            title: "Architecture Overview",
            type: "video",
            duration: "15m",
            completed: false,
            content: `## Solana Architecture Overview

This video lesson walks through the eight core innovations that make Solana's performance possible. Follow along as we trace a transaction from submission to finality.

### The Eight Innovations

1. **Proof of History (PoH)** -- Cryptographic timestamps before consensus
2. **Tower BFT** -- PoH-optimized version of PBFT consensus
3. **Turbine** -- Block propagation protocol inspired by BitTorrent
4. **Gulf Stream** -- Mempool-less transaction forwarding to validators
5. **Sealevel** -- Parallel smart contract runtime
6. **Pipelining** -- Transaction processing pipeline for hardware optimization
7. **Cloudbreak** -- Horizontally-scaled account database
8. **Archivers** -- Distributed ledger storage

### Transaction Lifecycle

When you submit a transaction, it goes through these stages:
- Your RPC node forwards it to the current **leader validator** via Gulf Stream
- The leader orders it using the PoH clock and packs it into an **entry**
- Entries are batched into **shreds** and propagated via Turbine
- Validators verify the PoH proof and vote on the block via Tower BFT
- After 31 confirmations (~12 seconds), the block reaches **finality**

### Slots, Blocks, and Epochs

A **slot** is a ~400ms window where a leader can produce a block. An **epoch** is 432,000 slots (~2-3 days). Leader schedules rotate each epoch based on stake weight. Understanding this timing is essential for building reliable applications.`,
          },
          {
            id: "1-3",
            title: "Setting Up Your Environment",
            type: "challenge",
            duration: "20m",
            completed: false,
            content: `## Challenge: Setting Up Your Environment

Install the Solana CLI toolchain, create a file-system wallet, and verify connectivity to devnet. Then write a small script that requests an airdrop and checks your balance.

### Objectives

1. Generate a new keypair using the Solana CLI
2. Configure the CLI to use devnet
3. Request a 2 SOL airdrop and confirm the balance

### Instructions

Complete the TypeScript function below that connects to devnet, requests an airdrop, and returns the wallet balance in SOL.`,
            starterCode: `import { Connection, Keypair, LAMPORTS_PER_SOL, clusterApiUrl } from "@solana/web3.js";

async function setupAndFund(): Promise<number> {
  // 1. Create a connection to devnet
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  // 2. Generate a new keypair
  // TODO: Generate keypair

  // 3. Request a 2 SOL airdrop
  // TODO: Request airdrop and confirm transaction

  // 4. Fetch and return the balance in SOL
  // TODO: Get balance and convert from lamports to SOL
  return 0;
}

setupAndFund().then(console.log);`,
            testCases: [
              { name: "Returns numeric balance", expected: "2" },
              {
                name: "Balance is in SOL (not lamports)",
                expected: "Balance <= 5 SOL",
              },
              {
                name: "Connection targets devnet",
                expected: "Cluster: devnet",
              },
            ],
          },
        ],
      },
      {
        title: "Accounts & Data",
        lessons: [
          {
            id: "2-1",
            title: "Account Model Deep Dive",
            type: "reading",
            duration: "12m",
            completed: false,
            content: `## Account Model Deep Dive

On Solana, **everything is an account**. There is no separate concept of "contract storage" like on Ethereum. Programs, wallets, token mints, token balances, and application data all exist as accounts in a flat global address space.

### Account Structure

Every account contains four fields:

| Field | Size | Description |
|-------|------|-------------|
| \`lamports\` | 8 bytes | Balance in lamports (1 SOL = 1 billion lamports) |
| \`data\` | variable | Arbitrary byte array storing program state |
| \`owner\` | 32 bytes | The program that has write authority over this account |
| \`executable\` | 1 byte | Whether this account contains executable program code |

### Ownership Rules

The \`owner\` field is critical for security. Only the owning program can modify an account's \`data\` field. The System Program owns all wallet accounts. When you deploy a program, the BPF Loader becomes the owner of the program account. When your program creates data accounts, your program becomes their owner.

### Rent and Rent Exemption

Accounts must maintain a minimum lamport balance proportional to their data size to remain alive. This is called **rent exemption** -- roughly 0.00089 SOL per kilobyte. If an account falls below rent-exempt minimum, it is purged by the runtime. In practice, all accounts are created with enough lamports to be rent-exempt, making the cost a one-time deposit that is recoverable when the account is closed.

### Data Serialization

Account data is raw bytes. Programs choose how to serialize state into these bytes. Anchor uses Borsh serialization with an 8-byte discriminator prefix. Native programs often use \`Pack\` trait or manual byte manipulation. Understanding how your data maps to bytes is essential for debugging and for writing efficient programs.`,
          },
          {
            id: "2-2",
            title: "Creating Accounts",
            type: "challenge",
            duration: "25m",
            completed: false,
            content: `## Challenge: Creating Accounts

Write a TypeScript function that creates a new account on Solana using the System Program's \`createAccount\` instruction. You need to calculate the rent-exempt minimum, allocate the correct space, and assign ownership to your program.

### Objectives

1. Calculate rent-exempt minimum for a given data size
2. Build a \`createAccount\` instruction with the correct parameters
3. Send and confirm the transaction

### Key Concepts

- \`SystemProgram.createAccount\` requires: \`fromPubkey\`, \`newAccountPubkey\`, \`lamports\`, \`space\`, and \`programId\` (owner)
- The payer must sign (to debit lamports) and the new account must also sign (to prove ownership of the keypair)`,
            starterCode: `import {
  Connection, Keypair, SystemProgram, Transaction,
  sendAndConfirmTransaction, LAMPORTS_PER_SOL, clusterApiUrl,
} from "@solana/web3.js";

const PROGRAM_ID = Keypair.generate().publicKey; // mock program
const DATA_SIZE = 128; // bytes

async function createDataAccount(payer: Keypair): Promise<string> {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  // 1. Generate a keypair for the new account
  // TODO

  // 2. Calculate minimum lamports for rent exemption
  // TODO

  // 3. Build the createAccount instruction
  // TODO

  // 4. Send and confirm the transaction
  // TODO

  return "account_pubkey_here";
}`,
            testCases: [
              {
                name: "Account is created on-chain",
                expected: "Account exists: true",
              },
              {
                name: "Account has correct data size",
                expected: "Data length: 128",
              },
              {
                name: "Account owner matches program",
                expected: "Owner matches: true",
              },
            ],
          },
          {
            id: "2-3",
            title: "Program Derived Addresses",
            type: "video",
            duration: "18m",
            completed: false,
            content: `## Program Derived Addresses (PDAs)

PDAs are one of Solana's most powerful primitives. This video explains how they work, why they exist, and the patterns you'll use in every program you build.

### What is a PDA?

A PDA is an address derived from a set of **seeds** and a **program ID** that is guaranteed to not lie on the Ed25519 curve. This means no private key exists for this address -- only the program that derived it can sign for it via \`invoke_signed\`.

\`\`\`
PDA = findProgramAddress([seed1, seed2, ...], programId)
    → returns (address, bump)
\`\`\`

The runtime tries bump values from 255 down to 0 until it finds an address off the curve. This bump is called the **canonical bump** and should be stored on-chain to avoid recomputation.

### Why PDAs Matter

1. **Deterministic addressing**: Given the same seeds and program ID, anyone can derive the same PDA. This means clients can compute account addresses without querying on-chain state.
2. **Program signing**: PDAs let programs "sign" CPIs. When your program calls another program and passes a PDA it owns, it can include the seeds + bump as signer seeds.
3. **Uniqueness constraints**: Seeds like \`["user_profile", user_pubkey]\` guarantee one profile per user. The runtime rejects duplicate account creation at the same address.

### Common PDA Patterns

- **Config singletons**: \`["config"]\` -- one global config per program
- **User-scoped data**: \`["profile", user.key()]\` -- one per user
- **Relationship mappings**: \`["enrollment", course_id, user.key()]\` -- links two entities
- **Vault authorities**: \`["vault_auth"]\` -- PDA that owns token accounts for escrow patterns`,
          },
        ],
      },
      {
        title: "Transactions & Instructions",
        lessons: [
          {
            id: "3-1",
            title: "Transaction Anatomy",
            type: "reading",
            duration: "10m",
            completed: false,
            content: `## Transaction Anatomy

Every interaction with Solana is a **transaction**. Understanding their structure is essential for building, debugging, and optimizing your applications.

### Transaction Structure

A Solana transaction contains:

- **Signatures**: One or more Ed25519 signatures from required signers
- **Message**: The actual payload, which contains:
  - **Header**: Counts of required signers, read-only signers, and read-only non-signers
  - **Account keys**: Ordered array of all accounts referenced by the transaction
  - **Recent blockhash**: A ~60-second validity window to prevent replay attacks
  - **Instructions**: One or more instructions to execute atomically

### Instructions

Each instruction specifies:

\`\`\`typescript
{
  programId: PublicKey,    // which program to invoke
  keys: AccountMeta[],    // accounts the program needs (pubkey + isSigner + isWritable)
  data: Buffer,           // serialized instruction arguments
}
\`\`\`

The \`keys\` array order matters -- it must match what the program expects. The \`isWritable\` flag determines whether the runtime locks the account for writing, which affects parallel execution.

### Atomicity and Compute Units

All instructions in a transaction execute **atomically**: if any instruction fails, the entire transaction reverts. Each transaction has a compute budget (default 200,000 CU, max 1.4M CU). Complex operations like CPIs and cryptographic operations consume more CU. You can request additional compute with the \`ComputeBudgetProgram.setComputeUnitLimit\` instruction.

### Transaction Size Limit

Transactions are capped at **1,232 bytes** after serialization. This includes all signatures, account keys, and instruction data. For larger payloads, you must split across multiple transactions or use techniques like lookup tables (ALTs) to compress the account key list.`,
          },
          {
            id: "3-2",
            title: "Building Transactions",
            type: "challenge",
            duration: "30m",
            completed: false,
            content: `## Challenge: Building Transactions

Build a transaction that transfers SOL to two different recipients in a single atomic operation. This exercises your understanding of multi-instruction transactions, account metas, and transaction signing.

### Objectives

1. Create a transaction with two \`SystemProgram.transfer\` instructions
2. Send 0.1 SOL to recipient A and 0.05 SOL to recipient B
3. Confirm the transaction and verify both balances changed

### Key Concepts

- A single transaction can contain multiple instructions that execute atomically
- If either transfer fails, neither takes effect
- The payer pays the transaction fee (~5000 lamports)`,
            starterCode: `import {
  Connection, Keypair, SystemProgram, Transaction,
  sendAndConfirmTransaction, LAMPORTS_PER_SOL, clusterApiUrl, PublicKey,
} from "@solana/web3.js";

async function multiTransfer(payer: Keypair): Promise<{ balanceA: number; balanceB: number }> {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  const recipientA = Keypair.generate().publicKey;
  const recipientB = Keypair.generate().publicKey;

  // 1. Create transfer instruction to recipientA (0.1 SOL)
  // TODO

  // 2. Create transfer instruction to recipientB (0.05 SOL)
  // TODO

  // 3. Build transaction with both instructions
  // TODO

  // 4. Send, confirm, and return both balances in SOL
  // TODO

  return { balanceA: 0, balanceB: 0 };
}`,
            testCases: [
              {
                name: "Recipient A receives 0.1 SOL",
                expected: "Balance A: 0.1",
              },
              {
                name: "Recipient B receives 0.05 SOL",
                expected: "Balance B: 0.05",
              },
              { name: "Transaction is atomic", expected: "Tx confirmed: true" },
            ],
          },
          {
            id: "3-3",
            title: "Error Handling",
            type: "video",
            duration: "14m",
            completed: false,
            content: `## Error Handling on Solana

This video covers how errors propagate through the Solana runtime, how to interpret transaction logs, and how to build user-friendly error handling in your clients.

### Program Errors

Solana programs return errors as \`ProgramError\` variants or custom error codes. When a program returns an error, the runtime:

1. Reverts all account state changes from the current transaction
2. Logs the error to the transaction logs
3. Returns the error code to the client

Anchor programs define custom errors with the \`#[error_code]\` attribute:

\`\`\`rust
#[error_code]
pub enum MyError {
    #[msg("Insufficient funds for this operation")]
    InsufficientFunds,
    #[msg("Account already initialized")]
    AlreadyInitialized,
}
\`\`\`

### Client-Side Error Handling

On the client, transaction errors come through as \`SendTransactionError\` with logs attached. Parse the logs to extract the custom error code:

\`\`\`typescript
try {
  await sendAndConfirmTransaction(connection, tx, [payer]);
} catch (err) {
  if (err instanceof SendTransactionError) {
    console.log(err.logs); // program logs with error details
  }
}
\`\`\`

### Common Runtime Errors

- **0x1**: Insufficient funds -- not enough lamports for the operation
- **0x0**: Custom program error at index 0 -- check the program's error enum
- **AccountNotFound**: The account doesn't exist or hasn't been created
- **AccountOwnedByWrongProgram**: You passed an account owned by a different program
- **Missing signature**: A required signer didn't sign the transaction

### Simulation

Always **simulate** transactions before sending to catch errors early. \`connection.simulateTransaction(tx)\` returns logs and error info without submitting to the network.`,
          },
        ],
      },
      {
        title: "Building Your First Program",
        lessons: [
          {
            id: "4-1",
            title: "Hello World Program",
            type: "challenge",
            duration: "35m",
            completed: false,
            content: `## Challenge: Hello World Program

Write your first Solana program using Anchor. This program will initialize a counter account and provide an increment instruction. It's the "Hello World" of Solana development.

### Objectives

1. Define a \`Counter\` account struct with a \`count\` field and an \`authority\` field
2. Implement an \`initialize\` instruction that sets count to 0
3. Implement an \`increment\` instruction that adds 1 to count, restricted to the authority

### Key Concepts

- The \`#[account]\` attribute tells Anchor to handle serialization and discriminator
- \`init\` constraint allocates and initializes the account
- \`has_one = authority\` ensures the signer matches the stored authority`,
            starterCode: `use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod hello_solana {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        // TODO: Set counter.count = 0 and counter.authority = signer
        Ok(())
    }

    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        // TODO: Increment counter.count by 1 using checked_add
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    // TODO: Define accounts (counter with init, authority as signer, system_program)
}

#[derive(Accounts)]
pub struct Increment<'info> {
    // TODO: Define accounts (counter as mut with has_one = authority, authority as signer)
}

#[account]
pub struct Counter {
    // TODO: Define fields (count: u64, authority: Pubkey)
}`,
            testCases: [
              { name: "Counter initializes to 0", expected: "count: 0" },
              { name: "Increment increases count", expected: "count: 1" },
              {
                name: "Only authority can increment",
                expected: "Error: ConstraintHasOne",
              },
            ],
          },
          {
            id: "4-2",
            title: "Testing Programs",
            type: "reading",
            duration: "15m",
            completed: false,
            content: `## Testing Solana Programs

Testing is non-negotiable in blockchain development. Bugs in deployed programs can result in permanent loss of funds. Solana offers multiple testing layers, each with different trade-offs.

### Testing Pyramid

1. **Unit Tests (Rust)**: Test individual functions in isolation using \`cargo test\`. Fastest feedback loop. Use \`solana-program-test\` or **Mollusk** for lightweight program execution without a full validator.

2. **Integration Tests (TypeScript)**: Test full instruction flows using Anchor's testing framework or **LiteSVM**. Spawn a local validator, deploy your program, and execute real transactions.

3. **Fuzz Tests**: Use **Trident** to generate random instruction sequences and catch edge cases. Run for 10+ minutes before any deployment.

### Anchor Testing Pattern

\`\`\`typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { HelloSolana } from "../target/types/hello_solana";

describe("hello_solana", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.HelloSolana as Program<HelloSolana>;

  it("Initializes counter", async () => {
    const counter = anchor.web3.Keypair.generate();
    await program.methods.initialize()
      .accounts({ counter: counter.publicKey })
      .signers([counter])
      .rpc();

    const account = await program.account.counter.fetch(counter.publicKey);
    expect(account.count.toNumber()).to.equal(0);
  });
});
\`\`\`

### Common Testing Mistakes

- **Not testing failure paths**: Always verify that unauthorized users get rejected, that duplicate initialization fails, and that arithmetic overflow is handled.
- **Shared state between tests**: Each test should create its own accounts. Never rely on ordering between test cases.
- **Ignoring compute units**: A test passing locally doesn't mean it'll pass on mainnet. Monitor CU usage with \`solana logs\` or the explorer.`,
          },
          {
            id: "4-3",
            title: "Deploying to Devnet",
            type: "challenge",
            duration: "20m",
            completed: false,
            content: `## Challenge: Deploying to Devnet

Take the Hello World program from the previous lesson and deploy it to Solana devnet. Then interact with it from a TypeScript client to verify the deployment works end-to-end.

### Objectives

1. Build the Anchor program with \`anchor build\`
2. Deploy to devnet using the Anchor CLI
3. Write a client script that calls \`initialize\` and \`increment\` on the deployed program

### Key Steps

- Set your Anchor.toml cluster to \`devnet\`
- Ensure your wallet has devnet SOL (\`solana airdrop 2\`)
- After deployment, the program ID is printed -- update your \`declare_id!\` macro`,
            starterCode: `import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";

// After deploying, paste your program ID here
const PROGRAM_ID = "YOUR_PROGRAM_ID";

async function interactWithProgram() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // TODO: Load the program using the IDL and program ID

  // TODO: Generate a PDA or keypair for the counter account

  // TODO: Call initialize instruction

  // TODO: Call increment instruction

  // TODO: Fetch and log the counter value

  console.log("Deployment verification complete!");
}

interactWithProgram();`,
            testCases: [
              {
                name: "Program deploys successfully",
                expected: "Deploy success: true",
              },
              {
                name: "Initialize instruction works",
                expected: "Initialized: count = 0",
              },
              {
                name: "Increment instruction works",
                expected: "Incremented: count = 1",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "anchor-framework",
    title: "Anchor Framework Mastery",
    description:
      "Build production-ready Solana programs with Anchor. Cover PDAs, CPIs, token management, and security patterns.",
    instructor: "Carlos Mendes",
    instructorAvatar: "CM",
    difficulty: "Intermediate",
    duration: "18h 45m",
    lessons: 56,
    rating: 4.8,
    enrolled: 0,
    tags: ["Anchor", "Solana", "Rust"],
    progress: 0,
    xp: 3600,
    thumbnail: "/anchor.jpg",
    modules: [
      {
        title: "Getting Started with Anchor",
        lessons: [
          {
            id: "a-1-1",
            title: "Why Anchor?",
            type: "reading",
            duration: "10m",
            completed: false,
            content: `## Why Anchor?

Writing native Solana programs means manually deserializing accounts, validating ownership, checking signers, computing PDAs, and serializing state back to bytes. Anchor abstracts all of this into a declarative Rust framework that dramatically reduces boilerplate while maintaining full control.

### What Anchor Provides

- **Account deserialization & validation**: The \`#[derive(Accounts)]\` macro generates all account checks at compile time. Constraints like \`#[account(init, payer = user, space = 8 + 32)]\` handle creation, rent calculation, and ownership in a single line.
- **8-byte discriminator**: Every Anchor account and instruction is prefixed with a SHA256 hash of its name. This prevents accidental misuse of accounts across instructions.
- **IDL generation**: Anchor generates a JSON Interface Definition Language file from your program, enabling automatic TypeScript client generation.
- **Error handling**: Custom error enums with human-readable messages, automatically mapped to error codes.
- **CPI helpers**: Type-safe cross-program invocation wrappers.

### Anchor vs Native

| Feature | Native | Anchor |
|---------|--------|--------|
| Account validation | Manual checks | Declarative constraints |
| Serialization | Manual Pack/Borsh | Automatic Borsh |
| Client SDK | Build from scratch | Auto-generated from IDL |
| Program size | Smaller binary | ~15% larger binary |
| Learning curve | Steep | Moderate |

For most production programs, Anchor is the right choice. The binary size overhead is negligible compared to the security and development speed benefits. The Solana ecosystem has converged on Anchor as the standard framework.`,
          },
          {
            id: "a-1-2",
            title: "Project Setup",
            type: "challenge",
            duration: "20m",
            completed: false,
            content: `## Challenge: Anchor Project Setup

Initialize a new Anchor project from scratch, configure it for devnet, and verify that the default program builds and tests successfully.

### Objectives

1. Initialize a new Anchor workspace using the CLI
2. Configure \`Anchor.toml\` for devnet deployment
3. Build the program and run the default test suite

### Instructions

Complete the configuration below to set up a proper Anchor workspace. Pay attention to the cluster setting, wallet path, and program keypair configuration.`,
            starterCode: `# Anchor.toml - Complete the configuration

[features]
seeds = false
skip-lint = false

[programs.devnet]
# TODO: Add your program with its keypair path
# my_program = "keypairs/my_program-keypair.json"

[registry]
url = "https://api.apr.dev"

[provider]
# TODO: Set cluster to devnet
# TODO: Set wallet path to your local keypair

[scripts]
# TODO: Set the test command
# test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"`,
            testCases: [
              { name: "anchor build succeeds", expected: "Build: success" },
              { name: "anchor test passes", expected: "Tests: 1 passing" },
              {
                name: "Cluster configured correctly",
                expected: "Cluster: devnet",
              },
            ],
          },
          {
            id: "a-1-3",
            title: "Anchor Account Types",
            type: "video",
            duration: "22m",
            completed: false,
            content: `## Anchor Account Types

This video covers every account type Anchor provides and when to use each one. Mastering these types is the key to writing secure and concise programs.

### Core Account Types

**\`Account<'info, T>\`** -- The workhorse type. Deserializes the account data into struct \`T\`, verifies the discriminator, and checks the owner matches your program. Use this for all program-owned data accounts.

**\`Signer<'info>\`** -- Validates that the account signed the transaction. Does not deserialize data. Use for authority checks.

**\`SystemAccount<'info>\`** -- A plain wallet account owned by the System Program. Use when you need to reference a user's SOL balance.

**\`Program<'info, T>\`** -- Validates that the account is executable and matches program \`T\`. Use for CPI targets like \`System\`, \`Token\`, or \`AssociatedToken\`.

**\`UncheckedAccount<'info>\`** -- No validation at all. Requires a \`/// CHECK:\` doc comment explaining why safety is maintained. Use only when you need raw account access and handle validation manually.

### Account Constraints

Constraints are the declarative rules in \`#[account(...)]\`:

\`\`\`rust
#[account(
    init,                              // create the account
    payer = user,                      // who pays rent
    space = 8 + MyStruct::INIT_SPACE,  // discriminator + data
    seeds = [b"profile", user.key().as_ref()],
    bump,                              // find canonical bump
)]
pub profile: Account<'info, UserProfile>,
\`\`\`

Common constraints: \`mut\`, \`has_one\`, \`constraint\`, \`close\`, \`realloc\`, \`seeds\`, \`bump\`, \`token::mint\`, \`token::authority\`. Each generates validation code at compile time.`,
          },
        ],
      },
      {
        title: "Advanced Account Management",
        lessons: [
          {
            id: "a-2-1",
            title: "PDAs in Anchor",
            type: "reading",
            duration: "15m",
            completed: false,
            content: `## PDAs in Anchor

Anchor makes PDA usage almost trivial compared to native programs. The \`seeds\` and \`bump\` constraints handle derivation, validation, and signing automatically.

### Declaring PDA Accounts

\`\`\`rust
#[derive(Accounts)]
#[instruction(course_id: String)]
pub struct Enroll<'info> {
    #[account(
        init,
        payer = learner,
        space = 8 + Enrollment::INIT_SPACE,
        seeds = [b"enrollment", course_id.as_bytes(), learner.key().as_ref()],
        bump,
    )]
    pub enrollment: Account<'info, Enrollment>,

    #[account(mut)]
    pub learner: Signer<'info>,
    pub system_program: Program<'info, System>,
}
\`\`\`

The \`seeds\` constraint tells Anchor to derive the PDA and verify it matches. The \`bump\` constraint finds the canonical bump and stores it. On subsequent instructions, use \`bump = enrollment.bump\` to skip recomputation.

### Storing the Bump

Always store the canonical bump in your account struct:

\`\`\`rust
#[account]
pub struct Enrollment {
    pub bump: u8,
    pub learner: Pubkey,
    pub course_id: String,
    pub completed_lessons: u64,
}
\`\`\`

On init, Anchor automatically populates \`bump\`. On future access, pass it back: \`seeds = [...], bump = enrollment.bump\`. This saves ~3,000 CU per instruction by avoiding the loop to find the bump.

### PDA Signing for CPIs

When your program needs to sign a CPI as a PDA, Anchor's \`CpiContext::new_with_signer\` takes the seeds and bump. The runtime verifies that the seeds + bump + your program ID derive to the signer address.`,
          },
          {
            id: "a-2-2",
            title: "Account Constraints",
            type: "challenge",
            duration: "30m",
            completed: false,
            content: `## Challenge: Account Constraints

Build a program with a \`Vault\` account that only the designated authority can deposit into or withdraw from. Use Anchor constraints to enforce all access control declaratively.

### Objectives

1. Define a \`Vault\` struct with \`authority\`, \`balance\`, and \`bump\` fields
2. Use \`has_one = authority\` to restrict access
3. Use \`constraint\` for custom validation (e.g., sufficient balance on withdraw)
4. Use \`seeds\` and \`bump\` for deterministic PDA addressing`,
            starterCode: `use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod vault_program {
    use super::*;

    pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.authority = ctx.accounts.authority.key();
        vault.balance = 0;
        vault.bump = ctx.bumps.vault;
        Ok(())
    }

    pub fn deposit(ctx: Context<VaultAction>, amount: u64) -> Result<()> {
        // TODO: Add amount to vault.balance using checked_add
        Ok(())
    }

    pub fn withdraw(ctx: Context<VaultAction>, amount: u64) -> Result<()> {
        // TODO: Subtract amount from vault.balance using checked_sub
        // Return error if insufficient balance
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Vault::INIT_SPACE,
        seeds = [b"vault", authority.key().as_ref()],
        bump,
    )]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct VaultAction<'info> {
    // TODO: Add mut constraint, has_one = authority,
    // seeds and bump = vault.bump
    pub vault: Account<'info, Vault>,
    pub authority: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Vault {
    pub authority: Pubkey,
    pub balance: u64,
    pub bump: u8,
}`,
            testCases: [
              {
                name: "Vault initializes with 0 balance",
                expected: "balance: 0",
              },
              { name: "Deposit increases balance", expected: "balance: 100" },
              {
                name: "Unauthorized withdraw rejected",
                expected: "Error: ConstraintHasOne",
              },
            ],
          },
          {
            id: "a-2-3",
            title: "Cross-Program Invocations",
            type: "video",
            duration: "25m",
            completed: false,
            content: `## Cross-Program Invocations in Anchor

This video demonstrates how to call other programs from your Anchor program. CPIs are the foundation of composability on Solana -- your program can transfer tokens, create accounts, and interact with any deployed program.

### Basic CPI Pattern

\`\`\`rust
use anchor_spl::token::{self, Transfer, Token};

pub fn transfer_tokens(ctx: Context<TransferCtx>, amount: u64) -> Result<()> {
    let cpi_accounts = Transfer {
        from: ctx.accounts.source.to_account_info(),
        to: ctx.accounts.destination.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token::transfer(cpi_ctx, amount)?;
    Ok(())
}
\`\`\`

### PDA-Signed CPIs

When your program's PDA needs to sign a CPI (e.g., a vault transferring tokens), use \`CpiContext::new_with_signer\`:

\`\`\`rust
let seeds = &[b"vault", user.key.as_ref(), &[vault.bump]];
let signer_seeds = &[&seeds[..]];
let cpi_ctx = CpiContext::new_with_signer(program, accounts, signer_seeds);
\`\`\`

### CPI Safety Rules

1. **Always validate the CPI target** -- use \`Program<'info, Token>\` not \`UncheckedAccount\`
2. **Reload accounts after CPI** if they were modified -- \`account.reload()?;\`
3. **CPI depth limit is 4** -- program A calls B calls C calls D (no deeper)
4. **Compute budget is shared** across the entire call chain. Plan for CPI overhead (~25,000 CU per hop).`,
          },
        ],
      },
    ],
  },
  {
    slug: "defi-development",
    title: "DeFi Protocol Development",
    description:
      "Design and implement decentralized finance protocols. AMMs, lending platforms, yield aggregators, and oracle integration.",
    instructor: "Lucia Oliveira",
    instructorAvatar: "LO",
    difficulty: "Advanced",
    duration: "24h 10m",
    lessons: 64,
    rating: 4.7,
    enrolled: 0,
    tags: ["DeFi", "Solana", "Smart Contracts"],
    progress: 0,
    xp: 5200,
    thumbnail: "/defi.jpg",
    modules: [
      {
        title: "DeFi Fundamentals",
        lessons: [
          {
            id: "d-1-1",
            title: "What is DeFi?",
            type: "reading",
            duration: "12m",
            completed: false,
            content: `## What is DeFi?

Decentralized Finance (DeFi) replaces traditional financial intermediaries with on-chain programs. Instead of a bank processing your loan or a broker executing your trade, smart contracts handle settlement, custody, and risk management transparently and permissionlessly.

### Core DeFi Primitives

1. **Automated Market Makers (AMMs)**: Algorithms that provide liquidity for token swaps using mathematical formulas instead of order books. The constant product formula \`x * y = k\` (Uniswap V2 style) is the simplest. Solana AMMs like Orca (concentrated liquidity) and Raydium achieve capital efficiency through more sophisticated curves.

2. **Lending Protocols**: Users deposit collateral and borrow other assets. Interest rates adjust algorithmically based on utilization. Solana implementations like Marginfi and Kamino handle liquidation via cranks or keepers.

3. **Yield Aggregators**: Protocols that automatically route capital to the highest-yielding opportunities. They compose on top of AMMs and lending pools.

4. **Oracles**: Price feeds from off-chain sources (Pyth, Switchboard) that DeFi protocols depend on for collateral valuation and liquidation thresholds.

### Why Solana for DeFi?

Solana's sub-second finality and low fees enable DeFi primitives impossible on slower chains: **central limit order books** (Phoenix, OpenBook), **real-time liquidations** without MEV auctions, and **high-frequency rebalancing** strategies. The parallel execution engine means a DEX trade doesn't block a lending liquidation.

### Risks to Understand

- **Smart contract risk**: Bugs in code = loss of funds. Audits are necessary but not sufficient.
- **Oracle manipulation**: Stale or manipulated price feeds can trigger incorrect liquidations.
- **Impermanent loss**: LPs lose value when token prices diverge. Understanding this math is critical.
- **Economic exploits**: Flash loans, sandwich attacks, and share price manipulation are real threats.`,
          },
          {
            id: "d-1-2",
            title: "AMM Mathematics",
            type: "video",
            duration: "30m",
            completed: false,
            content: `## AMM Mathematics

This video walks through the mathematical foundations of automated market makers, from the constant product formula to concentrated liquidity. Understanding these formulas is essential for building or auditing any DEX.

### Constant Product AMM (x * y = k)

The simplest AMM model. Given a pool with token X balance \`x\` and token Y balance \`y\`, the invariant \`k = x * y\` must hold after every swap.

When a user swaps \`dx\` of token X for token Y:
- New X balance: \`x + dx\`
- New Y balance: \`k / (x + dx)\`
- Amount out: \`y - k / (x + dx)\` = \`y * dx / (x + dx)\`

The **price impact** grows with trade size relative to pool depth. A $1,000 swap in a $1M pool has minimal impact; the same swap in a $10K pool is catastrophic.

### Fees

Real AMMs charge a fee (typically 0.3%) applied to the input:
\`\`\`
effective_dx = dx * (1 - fee_rate)
amount_out = y * effective_dx / (x + effective_dx)
\`\`\`

Fees accumulate in the pool, increasing \`k\` over time. This is how LPs earn yield.

### Concentrated Liquidity

Uniswap V3 (and Orca Whirlpools on Solana) let LPs provide liquidity within a specific price range. This amplifies capital efficiency -- instead of spreading liquidity across 0 to infinity, LPs focus on the active trading range. The math uses virtual reserves and tick spacing to create piecewise constant product curves.

### Solana-Specific Considerations

- All AMM math must use **checked integer arithmetic** -- no floating point in programs
- Token amounts are integers in smallest units (e.g., 6 decimals for USDC)
- **Round in favor of the pool** to prevent rounding exploits
- CU budget matters: complex math can consume significant compute units`,
          },
          {
            id: "d-1-3",
            title: "Liquidity Pools",
            type: "challenge",
            duration: "40m",
            completed: false,
            content: `## Challenge: Liquidity Pools

Implement the core swap logic for a constant product AMM pool. Given two token reserves and an input amount, calculate the output with fees using only integer arithmetic.

### Objectives

1. Implement the \`calculate_swap_output\` function using the constant product formula
2. Apply a 0.3% fee on the input amount
3. Use checked arithmetic to prevent overflow
4. Always round down the output (favor the pool)`,
            starterCode: `use anchor_lang::prelude::*;

/// Calculate swap output using constant product formula with fees.
/// fee_bps = 30 (0.3%)
///
/// Formula: output = (reserve_out * input_after_fee) / (reserve_in + input_after_fee)
/// Where input_after_fee = input * (10000 - fee_bps) / 10000
pub fn calculate_swap_output(
    reserve_in: u64,
    reserve_out: u64,
    amount_in: u64,
    fee_bps: u16,
) -> Result<u64> {
    // TODO: Validate inputs are non-zero

    // TODO: Calculate amount_in after fee (using u128 for intermediate math)

    // TODO: Calculate output using constant product formula

    // TODO: Verify output < reserve_out (can't drain the pool)

    // TODO: Return output amount (rounded down)
    Ok(0)
}

/// Calculate LP tokens to mint when depositing both tokens.
/// Uses the minimum ratio to maintain pool balance.
pub fn calculate_deposit(
    reserve_a: u64,
    reserve_b: u64,
    amount_a: u64,
    amount_b: u64,
    lp_supply: u64,
) -> Result<u64> {
    // TODO: If pool is empty, return sqrt(amount_a * amount_b)
    // TODO: Otherwise, return min(amount_a * lp_supply / reserve_a,
    //                              amount_b * lp_supply / reserve_b)
    Ok(0)
}`,
            testCases: [
              {
                name: "Swap 1000 with equal reserves of 1M",
                expected: "Output: 996",
              },
              {
                name: "Fee is deducted from input",
                expected: "Fee: 3 tokens (0.3%)",
              },
              {
                name: "Zero input returns error",
                expected: "Error: InvalidInput",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "nft-marketplace",
    title: "NFT Marketplace Builder",
    description:
      "Build a full-featured NFT marketplace on Solana. Minting, listing, bidding, and collection management with Metaplex.",
    instructor: "Rafael Costa",
    instructorAvatar: "RC",
    difficulty: "Intermediate",
    duration: "16h 20m",
    lessons: 48,
    rating: 4.6,
    enrolled: 0,
    tags: ["NFT", "Metaplex", "Solana"],
    progress: 0,
    xp: 3200,
    thumbnail: "/nft.jpg",
    modules: [
      {
        title: "NFT Standards on Solana",
        lessons: [
          {
            id: "n-1-1",
            title: "Token Metadata Program",
            type: "reading",
            duration: "15m",
            completed: false,
            content: `## Token Metadata Program

Metaplex's Token Metadata Program is the standard for attaching rich metadata to SPL tokens on Solana. Every NFT, fungible token with a name/symbol, and collection uses this program.

### How It Works

For any SPL token mint, you can create a **Metadata account** at a PDA derived from \`["metadata", metadata_program_id, mint]\`. This account stores:

- **Name**: Display name (max 32 bytes)
- **Symbol**: Ticker symbol (max 10 bytes)
- **URI**: Link to off-chain JSON (typically on Arweave or IPFS) containing image, description, attributes
- **Creators**: Array of creator addresses with share percentages and verification status
- **Collection**: Optional link to a parent collection NFT
- **Uses**: Optional consumable uses (for gaming items, tickets, etc.)

### Master Editions

For NFTs (supply = 1), a **Master Edition** account is created at \`["metadata", metadata_program_id, mint, "edition"]\`. This account:

- Sets the supply to exactly 1 (or allows prints up to a max supply)
- Prevents the mint authority from creating more tokens
- Enables the print edition system for numbered copies

### The Off-Chain JSON Standard

The URI points to a JSON file following the Metaplex standard:

\`\`\`json
{
  "name": "My NFT #1",
  "symbol": "MYNFT",
  "description": "A unique digital collectible",
  "image": "https://arweave.net/...",
  "attributes": [
    { "trait_type": "Background", "value": "Blue" },
    { "trait_type": "Rarity", "value": "Legendary" }
  ]
}
\`\`\`

### Token Standard Evolution

The ecosystem is moving toward **Token-2022** with the MetadataPointer and TokenMetadata extensions, which store metadata directly on the mint account without a separate PDA. Metaplex's Core standard also simplifies the account model for NFTs. Understanding the legacy Token Metadata program remains essential since the majority of existing NFTs use it.`,
          },
          {
            id: "n-1-2",
            title: "Minting NFTs",
            type: "challenge",
            duration: "25m",
            completed: false,
            content: `## Challenge: Minting NFTs

Write a TypeScript function that mints a new NFT on Solana using the Metaplex JS SDK. Create the mint, metadata, and master edition in a single transaction.

### Objectives

1. Create a new token mint with 0 decimals and supply of 1
2. Create the metadata account with name, symbol, and URI
3. Create the master edition to lock the supply

### Key Concepts

- NFTs are SPL tokens with 0 decimals and supply of exactly 1
- The Metaplex SDK provides high-level helpers that bundle the required instructions
- The payer needs enough SOL to cover rent for all three accounts (~0.01 SOL)`,
            starterCode: `import { Metaplex, keypairIdentity } from "@metaplex-foundation/js";
import { Connection, Keypair, clusterApiUrl } from "@solana/web3.js";

async function mintNFT(payer: Keypair): Promise<string> {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const metaplex = Metaplex.make(connection).use(keypairIdentity(payer));

  // TODO: Use metaplex.nfts().create() to mint an NFT
  // Parameters:
  //   uri: "https://arweave.net/example-metadata.json"
  //   name: "Superteam Academy Badge"
  //   symbol: "SAB"
  //   sellerFeeBasisPoints: 500 (5% royalty)
  //   creators: [{ address: payer.publicKey, share: 100 }]

  // TODO: Return the mint address as a string
  return "mint_address_here";
}`,
            testCases: [
              {
                name: "NFT mint is created",
                expected: "Mint exists: true",
              },
              {
                name: "Supply is exactly 1",
                expected: "Supply: 1",
              },
              {
                name: "Metadata name matches",
                expected: "Name: Superteam Academy Badge",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "web3-security",
    title: "Web3 Security Auditing",
    description:
      "Learn to identify and prevent vulnerabilities in smart contracts. Reentrancy, overflow, access control, and formal verification.",
    instructor: "Mariana Santos",
    instructorAvatar: "MS",
    difficulty: "Advanced",
    duration: "20h 15m",
    lessons: 52,
    rating: 4.9,
    enrolled: 0,
    tags: ["Security", "Auditing", "Smart Contracts"],
    progress: 0,
    xp: 4800,
    thumbnail: "/security.jpg",
    modules: [
      {
        title: "Common Vulnerabilities",
        lessons: [
          {
            id: "s-1-1",
            title: "Reentrancy Attacks",
            type: "reading",
            duration: "20m",
            completed: false,
            content: `## Reentrancy Attacks

Reentrancy is one of the most devastating vulnerability classes in smart contract development. While Solana's architecture provides some natural protections, reentrancy-like attacks are still possible through CPIs.

### Classic Reentrancy (Ethereum)

On Ethereum, a contract calls an external contract which calls back into the original before state updates are committed. The classic DAO hack exploited this: the attacker's contract recursively called \`withdraw()\` before the balance was decremented.

### Solana's CPI Reentrancy

Solana prevents direct reentrancy -- a program cannot CPI into itself. However, **cross-program reentrancy** is possible:

\`\`\`
Program A -> CPI -> Program B -> CPI -> Program A
\`\`\`

This is blocked by the runtime since Solana 1.16. But a subtler variant exists: **state inconsistency after CPI**. If Program A modifies an account, then CPIs to Program B which modifies the same account, Program A's in-memory copy is stale.

### The Real Danger: Stale Account State

\`\`\`rust
// VULNERABLE: reading account data after CPI
pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    // CPI to token program to transfer tokens
    token::transfer(cpi_ctx, amount)?;

    // BUG: vault_account still has the OLD balance in memory
    let vault = &ctx.accounts.vault_account;
    vault.total -= amount; // uses stale data!
    Ok(())
}
\`\`\`

### Prevention

1. **Reload after CPI**: Call \`account.reload()?\` after any CPI that modifies accounts you subsequently read
2. **Update state before CPI**: Follow the checks-effects-interactions pattern. Update your program's state before making external calls
3. **Use Anchor's \`reload()\`**: \`ctx.accounts.vault.reload()?;\` refreshes the deserialized data from the account's current lamport balance and data

### Audit Checklist

- Does the program read account state after a CPI? If so, is it reloaded?
- Can the CPI target modify accounts that the caller depends on?
- Are state updates performed before or after external calls?`,
          },
          {
            id: "s-1-2",
            title: "Integer Overflow",
            type: "challenge",
            duration: "30m",
            completed: false,
            content: `## Challenge: Integer Overflow

Identify and fix integer overflow vulnerabilities in a reward distribution program. Unchecked arithmetic in token amount calculations can lead to wrapping, allowing attackers to mint or withdraw far more than intended.

### Objectives

1. Find the overflow vulnerability in the provided code
2. Replace unsafe arithmetic with checked operations
3. Add proper error handling for arithmetic failures

### Background

Rust's \`u64\` wraps on overflow in release mode. A multiplication like \`amount * rate\` can wrap to a small number if the result exceeds \`u64::MAX\` (18.4 quintillion). In token programs, this means an attacker could receive nearly zero tokens -- or exploit intermediate calculations to get far too many.`,
            starterCode: `use anchor_lang::prelude::*;

#[error_code]
pub enum VaultError {
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Insufficient balance")]
    InsufficientBalance,
}

/// VULNERABLE: Find and fix the overflow bugs
pub fn calculate_rewards(
    staked_amount: u64,
    reward_rate: u64,    // basis points (e.g., 500 = 5%)
    duration_days: u64,
) -> Result<u64> {
    // BUG 1: This multiplication can overflow for large staked_amount * reward_rate
    let annual_reward = staked_amount * reward_rate / 10_000;

    // BUG 2: This multiplication can overflow for large annual_reward * duration_days
    let reward = annual_reward * duration_days / 365;

    Ok(reward)
}

/// VULNERABLE: Find and fix the underflow bug
pub fn process_withdrawal(
    vault_balance: u64,
    user_shares: u64,
    total_shares: u64,
) -> Result<u64> {
    // BUG 3: No validation that total_shares > 0 (division by zero)
    // BUG 4: No validation that result <= vault_balance
    let withdrawal_amount = vault_balance * user_shares / total_shares;
    Ok(withdrawal_amount)
}`,
            testCases: [
              {
                name: "Large staked_amount does not overflow",
                expected: "Uses checked_mul: true",
              },
              {
                name: "Zero total_shares returns error",
                expected: "Error: Overflow",
              },
              {
                name: "All arithmetic uses checked ops",
                expected: "No unchecked math: true",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "rust-for-blockchain",
    title: "Rust for Blockchain Devs",
    description:
      "Learn Rust programming language specifically tailored for blockchain development. Ownership, lifetimes, and async patterns.",
    instructor: "Pedro Almeida",
    instructorAvatar: "PA",
    difficulty: "Beginner",
    duration: "15h 40m",
    lessons: 50,
    rating: 4.8,
    enrolled: 0,
    tags: ["Rust", "Programming", "Blockchain"],
    progress: 0,
    xp: 2800,
    thumbnail: "/rust.jpg",
    modules: [
      {
        title: "Rust Basics",
        lessons: [
          {
            id: "r-1-1",
            title: "Variables and Types",
            type: "reading",
            duration: "10m",
            completed: false,
            content: `## Variables and Types in Rust

Rust is a statically typed systems language where the compiler enforces memory safety at compile time. Understanding Rust's type system is foundational for writing Solana programs.

### Variable Bindings

Variables in Rust are **immutable by default**. Use \`mut\` to make them mutable:

\`\`\`rust
let x = 5;          // immutable
let mut y = 10;     // mutable
y += 1;             // ok
// x += 1;          // compile error!
\`\`\`

This default immutability prevents entire classes of bugs. In Solana programs, you explicitly mark account references as mutable only when they need to change.

### Integer Types for Blockchain

Solana programs primarily use unsigned integers:

| Type | Size | Range | Common Use |
|------|------|-------|------------|
| \`u8\` | 1 byte | 0 to 255 | Bumps, flags, small counters |
| \`u16\` | 2 bytes | 0 to 65,535 | Basis points, small IDs |
| \`u32\` | 4 bytes | 0 to ~4.2B | Timestamps (Unix), medium counters |
| \`u64\` | 8 bytes | 0 to ~18.4Q | Token amounts, lamports |
| \`u128\` | 16 bytes | Huge | Intermediate math to prevent overflow |

Always use \`u64\` for token amounts and lamports. Use \`u128\` for intermediate calculations in AMM math or reward computations to avoid overflow.

### The Pubkey Type

Solana's \`Pubkey\` is a 32-byte array representing an Ed25519 public key or PDA. It implements \`Copy\`, \`Clone\`, \`PartialEq\`, and serialization traits. In Anchor, most account validation is done at the type level using \`Pubkey\` comparisons.

### Strings and Byte Arrays

On-chain data uses fixed-size byte arrays, not heap-allocated \`String\`. Anchor's \`#[max_len(32)]\` attribute on \`String\` fields handles the bounded allocation. For PDAs, you convert strings to bytes with \`.as_bytes()\`.`,
          },
          {
            id: "r-1-2",
            title: "Ownership & Borrowing",
            type: "video",
            duration: "25m",
            completed: false,
            content: `## Ownership & Borrowing

This video covers Rust's most distinctive feature -- the ownership system. Every value in Rust has exactly one owner, and when the owner goes out of scope, the value is dropped. This eliminates garbage collection and prevents memory leaks.

### The Three Rules

1. Each value has exactly one **owner**
2. When the owner goes out of scope, the value is **dropped**
3. Ownership can be **moved** (transferred) but not duplicated (for non-Copy types)

\`\`\`rust
let s1 = String::from("hello");
let s2 = s1;          // s1 is MOVED to s2
// println!("{}", s1); // compile error: s1 no longer valid
\`\`\`

### References and Borrowing

Instead of transferring ownership, you can **borrow** a value with references:

- \`&T\` -- shared (immutable) reference. Many can exist simultaneously.
- \`&mut T\` -- exclusive (mutable) reference. Only one at a time.

\`\`\`rust
fn calculate_fee(amount: &u64) -> u64 {  // borrows amount
    *amount / 100  // dereference to use the value
}

let balance: u64 = 1000;
let fee = calculate_fee(&balance);  // balance is still valid here
\`\`\`

### Why This Matters for Solana

In Anchor programs, the \`Context\` struct borrows account data for the duration of the instruction. The lifetime \`'info\` ties account references to the instruction's execution scope. When you see \`Account<'info, MyStruct>\`, the \`'info\` lifetime means "this reference is valid for the entire instruction processing."

Understanding borrowing also explains why you need \`to_account_info()\` when building CPI contexts -- you're creating a new reference type that the CPI infrastructure expects.`,
          },
          {
            id: "r-1-3",
            title: "Structs & Enums",
            type: "challenge",
            duration: "20m",
            completed: false,
            content: `## Challenge: Structs & Enums

Build a set of data structures that model a simple on-chain voting system. Define an enum for proposal status, a struct for proposals, and implement methods for state transitions.

### Objectives

1. Define a \`ProposalStatus\` enum with \`Draft\`, \`Active\`, \`Passed\`, and \`Rejected\` variants
2. Define a \`Proposal\` struct with title, description, vote counts, and status
3. Implement methods to vote and transition status based on vote thresholds`,
            starterCode: `use anchor_lang::prelude::*;

// TODO: Define a ProposalStatus enum with variants:
//   Draft, Active, Passed, Rejected
// Derive: AnchorSerialize, AnchorDeserialize, Clone, PartialEq, InitSpace

// TODO: Define a Proposal struct with fields:
//   pub title: String,        // #[max_len(64)]
//   pub description: String,  // #[max_len(256)]
//   pub votes_for: u64,
//   pub votes_against: u64,
//   pub status: ProposalStatus,
//   pub authority: Pubkey,
// Derive: account, InitSpace

impl Proposal {
    pub fn activate(&mut self) -> Result<()> {
        // TODO: Only allow transitioning from Draft to Active
        // Return error if current status is not Draft
        Ok(())
    }

    pub fn cast_vote(&mut self, approve: bool) -> Result<()> {
        // TODO: Only allow voting when status is Active
        // Increment votes_for or votes_against using checked_add
        Ok(())
    }

    pub fn finalize(&mut self, quorum: u64) -> Result<()> {
        // TODO: Only finalize Active proposals
        // If total votes >= quorum:
        //   votes_for > votes_against -> Passed
        //   otherwise -> Rejected
        // If total votes < quorum -> Rejected
        Ok(())
    }
}`,
            testCases: [
              {
                name: "Draft proposal can be activated",
                expected: "Status: Active",
              },
              {
                name: "Active proposal accepts votes",
                expected: "votes_for: 1",
              },
              {
                name: "Proposal finalizes correctly with quorum",
                expected: "Status: Passed",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "token-extensions",
    title: "Token Extensions (Token-2022)",
    description:
      "Master Solana's Token-2022 program with extensions like transfer fees, non-transferable tokens, metadata pointers, and confidential transfers.",
    instructor: "Beatriz Ferreira",
    instructorAvatar: "BF",
    difficulty: "Intermediate",
    duration: "14h 20m",
    lessons: 44,
    rating: 4.7,
    enrolled: 0,
    tags: ["Token-2022", "SPL", "Solana"],
    progress: 0,
    xp: 3400,
    thumbnail: "/solana.jpg",
    modules: [
      {
        title: "Token-2022 Overview",
        lessons: [
          {
            id: "te-1-1",
            title: "SPL Token vs Token-2022",
            type: "reading",
            duration: "10m",
            completed: false,
            content: `## SPL Token vs Token-2022

Token-2022 (also called Token Extensions) is the next-generation token program on Solana. It is a superset of the original SPL Token program with a modular extension system that adds functionality directly at the protocol level.

### Why Token-2022?

The original SPL Token program is immutable and cannot be upgraded. Adding new features (like transfer fees or metadata) required separate programs and workarounds. Token-2022 solves this with an **extension architecture** -- new capabilities are baked into the token program itself.

### Key Differences

| Feature | SPL Token | Token-2022 |
|---------|-----------|------------|
| Program ID | \`TokenkegQ...\` | \`TokenzQd...\` |
| Extensions | None | 16+ extensions |
| Metadata | Requires Metaplex | Built-in TokenMetadata |
| Transfer hooks | Not possible | Custom logic per transfer |
| Confidential transfers | Not possible | Encrypted amounts via ZK proofs |
| Non-transferable | Not enforceable | Native extension |

### Compatibility

Token-2022 mints and SPL Token mints are separate. A DEX or wallet must explicitly support Token-2022 to handle its tokens. Most modern Solana infrastructure (Jupiter, Phantom, Solflare) supports Token-2022. When building programs, use the \`spl_token_2022\` crate and be aware that account sizes differ due to extension data appended after the base account fields.

### When to Use Token-2022

Use Token-2022 when you need any extension. For simple fungible tokens without special requirements, SPL Token is still lighter and has universal compatibility. For soulbound tokens, tokens with royalty enforcement, or anything requiring transfer hooks, Token-2022 is the right choice.`,
          },
          {
            id: "te-1-2",
            title: "Extension Architecture",
            type: "video",
            duration: "18m",
            completed: false,
            content: `## Extension Architecture

This video explains how Token-2022 extensions work under the hood. Extensions are additional data appended to the base mint or token account, with a type-length-value (TLV) encoding.

### How Extensions Are Stored

A Token-2022 mint account looks like:

\`\`\`
[Base Mint Data (82 bytes)] [Account Type (1 byte)] [Extension 1 TLV] [Extension 2 TLV] ...
\`\`\`

Each extension is encoded as:
- **Type** (2 bytes): Identifies the extension (e.g., TransferFee = 1, NonTransferable = 3)
- **Length** (2 bytes): Size of the extension data
- **Value** (variable): The extension-specific data

### Initializing Extensions

Extensions must be configured **before** the mint is initialized. The sequence is:

1. Calculate total space needed (base + all extensions)
2. Create the account with enough space
3. Initialize each extension with its specific instruction
4. Initialize the mint (base fields: decimals, mint authority, freeze authority)

This ordering matters because the mint initialization locks the account layout.

### Available Extensions

**Mint extensions**: TransferFee, NonTransferable, PermanentDelegate, TransferHook, MetadataPointer, TokenMetadata, ConfidentialTransferMint, InterestBearingMint, DefaultAccountState, MintCloseAuthority, GroupPointer, GroupMemberPointer

**Account extensions**: ImmutableOwner, MemoTransfer, CpiGuard, ConfidentialTransferAccount

### Space Calculation

You must calculate exact space upfront. Each extension adds a fixed or variable amount. The \`ExtensionType::try_calculate_account_len\` helper computes the total bytes needed given a list of extensions. Getting this wrong means your mint creation will fail.`,
          },
          {
            id: "te-1-3",
            title: "Creating a Token-2022 Mint",
            type: "challenge",
            duration: "25m",
            completed: false,
            content: `## Challenge: Creating a Token-2022 Mint

Create a Token-2022 mint with the MintCloseAuthority extension. This extension allows the mint authority to close the mint account and reclaim its rent, which is impossible with the original SPL Token program.

### Objectives

1. Calculate the space required for a mint with MintCloseAuthority
2. Create the account and initialize the extension before the mint
3. Initialize the mint with the correct parameters
4. Verify the extension is present by reading the account data`,
            starterCode: `import {
  Connection, Keypair, SystemProgram, Transaction,
  sendAndConfirmTransaction, clusterApiUrl,
} from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID, createInitializeMintInstruction,
  createInitializeMintCloseAuthorityInstruction,
  getMintLen, ExtensionType,
} from "@solana/spl-token";

async function createMintWithCloseAuthority(
  payer: Keypair
): Promise<string> {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const mintKeypair = Keypair.generate();

  // 1. Calculate space for mint + MintCloseAuthority extension
  // TODO: Use getMintLen([ExtensionType.MintCloseAuthority])

  // 2. Get rent exemption for that space
  // TODO

  // 3. Build transaction with 3 instructions in order:
  //    a. SystemProgram.createAccount (with TOKEN_2022_PROGRAM_ID as owner)
  //    b. createInitializeMintCloseAuthorityInstruction
  //    c. createInitializeMintInstruction (decimals: 9)
  // TODO

  // 4. Send and confirm
  // TODO

  return mintKeypair.publicKey.toBase58();
}`,
            testCases: [
              {
                name: "Mint is created with Token-2022",
                expected: "Owner: TokenzQd...",
              },
              {
                name: "MintCloseAuthority extension present",
                expected: "Extension: MintCloseAuthority",
              },
              {
                name: "Mint has 9 decimals",
                expected: "Decimals: 9",
              },
            ],
          },
        ],
      },
      {
        title: "Core Extensions",
        lessons: [
          {
            id: "te-2-1",
            title: "Transfer Fees",
            type: "reading",
            duration: "12m",
            completed: false,
            content: `## Transfer Fees

The TransferFee extension enables protocol-level fee collection on every token transfer. Unlike application-level fees that can be bypassed, transfer fees are enforced by the token program itself.

### How Transfer Fees Work

When configured, every \`transfer\` or \`transfer_checked\` instruction automatically withholds a percentage of the transferred amount in the destination token account. The withheld fees accumulate and can be harvested by the withdraw authority.

### Configuration

Transfer fees are set on the mint with two parameters:

- **\`transfer_fee_basis_points\`**: Fee percentage in basis points (100 = 1%)
- **\`maximum_fee\`**: Cap on the absolute fee amount (in token smallest units)

\`\`\`
Fee = min(amount * basis_points / 10000, maximum_fee)
\`\`\`

### Fee Epochs

Token-2022 supports **scheduled fee changes** using a two-epoch system. You can set a new fee configuration that takes effect at a future epoch. This prevents surprise fee changes and gives holders time to react.

### Harvesting Fees

Withheld fees sit in individual token accounts. The harvest process:

1. Call \`harvest_withheld_tokens_to_mint\` to move fees from token accounts to the mint
2. Call \`withdraw_withheld_tokens_from_mint\` to transfer collected fees to a destination account

This two-step process is gas-efficient: anyone can call harvest (it's permissionless), but only the withdraw authority can claim the accumulated fees.

### Use Cases

- **Protocol revenue**: DeFi tokens that fund treasury on every transfer
- **Burn mechanisms**: Transfer fees routed to a burn address for deflationary mechanics
- **Creator royalties**: Enforceable royalties at the token level, not just marketplace-level`,
          },
          {
            id: "te-2-2",
            title: "Non-Transferable Tokens",
            type: "video",
            duration: "15m",
            completed: false,
            content: `## Non-Transferable Tokens

This video covers the NonTransferable extension -- a mechanism for creating soulbound tokens that cannot be moved between wallets. This is foundational for credentials, reputation systems, and identity primitives.

### What NonTransferable Does

When a mint has the NonTransferable extension, any attempt to call \`transfer\` or \`transfer_checked\` on tokens of that mint will fail at the program level. The tokens are permanently bound to the token account they were minted to.

### Soulbound Token Pattern

The combination of NonTransferable + PermanentDelegate creates a true soulbound token:

- **NonTransferable**: Users cannot transfer the token to another wallet
- **PermanentDelegate**: The issuing authority can burn or revoke the token regardless of whose account it's in

This is exactly the pattern Superteam Academy uses for XP tokens. Learners earn XP that is bound to their wallet, and the platform authority (via PermanentDelegate) can manage tokens for season resets.

### Implementation

\`\`\`typescript
// Extensions must be initialized before the mint
const extensions = [ExtensionType.NonTransferable];
const mintLen = getMintLen(extensions);
// ... create account with mintLen space ...
// Initialize NonTransferable extension (no parameters needed)
createInitializeNonTransferableMintInstruction(mint, TOKEN_2022_PROGRAM_ID);
// Then initialize the mint
createInitializeMintInstruction(mint, decimals, authority, null, TOKEN_2022_PROGRAM_ID);
\`\`\`

### Use Cases Beyond XP

- **Proof of attendance**: Event badges that prove you were there
- **Governance credentials**: Voting power tied to reputation, not tradeable
- **Compliance tokens**: KYC attestations that can't be sold or transferred
- **Achievement NFTs**: Gaming achievements that represent genuine accomplishment`,
          },
          {
            id: "te-2-3",
            title: "Permanent Delegate",
            type: "challenge",
            duration: "20m",
            completed: false,
            content: `## Challenge: Permanent Delegate

Create a Token-2022 mint with the PermanentDelegate extension and demonstrate that the delegate can burn tokens from any holder's account without their approval.

### Objectives

1. Create a mint with PermanentDelegate extension
2. Mint tokens to a user's token account
3. Use the permanent delegate to burn tokens from the user's account
4. Verify the balance decreased

### Key Concept

PermanentDelegate grants an irrevocable delegate authority over all token accounts of the mint. The delegate can transfer or burn tokens from any holder. This is powerful for revocable credentials, subscription tokens, and platform-managed tokens.`,
            starterCode: `import {
  Connection, Keypair, Transaction, SystemProgram,
  sendAndConfirmTransaction, clusterApiUrl,
} from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID, createInitializeMintInstruction,
  createInitializePermanentDelegateInstruction,
  createMintToInstruction, createBurnInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync, getMintLen, ExtensionType,
} from "@solana/spl-token";

async function permanentDelegateDemo(
  authority: Keypair
): Promise<{ balanceBefore: number; balanceAfter: number }> {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const mintKeypair = Keypair.generate();
  const user = Keypair.generate();

  // 1. Calculate space for mint with PermanentDelegate
  // TODO: getMintLen([ExtensionType.PermanentDelegate])

  // 2. Create mint account, init PermanentDelegate, init mint
  //    PermanentDelegate = authority.publicKey
  // TODO

  // 3. Create ATA for user and mint 100 tokens
  // TODO

  // 4. As permanent delegate, burn 30 tokens from user's account
  // TODO

  return { balanceBefore: 100, balanceAfter: 70 };
}`,
            testCases: [
              {
                name: "Mint has PermanentDelegate extension",
                expected: "Delegate set: true",
              },
              {
                name: "User starts with 100 tokens",
                expected: "Balance before: 100",
              },
              {
                name: "Delegate burns 30 tokens",
                expected: "Balance after: 70",
              },
            ],
          },
        ],
      },
      {
        title: "Metadata Extensions",
        lessons: [
          {
            id: "te-3-1",
            title: "MetadataPointer Extension",
            type: "reading",
            duration: "10m",
            completed: false,
            content: `## MetadataPointer Extension

The MetadataPointer extension tells clients where to find the metadata for a Token-2022 mint. It can point to the mint itself (when using TokenMetadata extension) or to an external account.

### The Problem It Solves

With the original SPL Token program, metadata was stored in a separate Metaplex Metadata PDA. Clients needed to know the Metaplex program ID and derive the PDA to find the name, symbol, and URI. This created a tight coupling to the Metaplex ecosystem.

MetadataPointer provides a standardized way for any mint to declare where its metadata lives, independent of any specific metadata program.

### How It Works

The MetadataPointer stores a single \`Pubkey\` pointing to the account that contains metadata. There are two common patterns:

**Self-referencing** (most common): The pointer points to the mint itself, and the TokenMetadata extension on the same account holds the data:

\`\`\`
MetadataPointer { metadata_address: mint_pubkey }
+ TokenMetadata { name, symbol, uri, additional_metadata }
\`\`\`

**External reference**: The pointer points to a different account (e.g., a Metaplex Metadata PDA or a custom metadata account):

\`\`\`
MetadataPointer { metadata_address: external_metadata_pubkey }
\`\`\`

### Setting the Pointer

The pointer must be set before mint initialization:

\`\`\`typescript
createInitializeMetadataPointerInstruction(
  mint,
  updateAuthority,  // who can change the pointer
  mint,             // metadata_address (self-referencing)
  TOKEN_2022_PROGRAM_ID
)
\`\`\`

### Client Integration

Wallets and explorers use \`getMetadataPointerState()\` to find metadata. This standard interface means Token-2022 tokens automatically show names and images in any compliant wallet without custom integrations.`,
          },
          {
            id: "te-3-2",
            title: "TokenMetadata Extension",
            type: "video",
            duration: "20m",
            completed: false,
            content: `## TokenMetadata Extension

This video covers the TokenMetadata extension, which stores metadata directly on the mint account. Combined with MetadataPointer, it eliminates the need for separate metadata accounts.

### What TokenMetadata Stores

The extension holds these fields directly on the mint:

- **\`name\`**: Token display name (variable length)
- **\`symbol\`**: Token ticker symbol (variable length)
- **\`uri\`**: URL to off-chain JSON (variable length)
- **\`update_authority\`**: Who can modify the metadata (Option<Pubkey>)
- **\`additional_metadata\`**: Key-value pairs for arbitrary extra data

Unlike the Metaplex standard which has fixed-size fields, TokenMetadata uses variable-length strings. This means account space must be calculated carefully.

### Initialize vs Update

\`\`\`typescript
// Initialize metadata (only once, after mint init)
createInitializeInstruction({
  programId: TOKEN_2022_PROGRAM_ID,
  mint: mintPubkey,
  metadata: mintPubkey,  // self-referencing
  name: "XP Token",
  symbol: "XP",
  uri: "https://arweave.net/...",
  mintAuthority: authority,
  updateAuthority: authority,
});

// Update a field later
createUpdateFieldInstruction({
  metadata: mintPubkey,
  updateAuthority: authority,
  field: "name",
  value: "New Name",
  programId: TOKEN_2022_PROGRAM_ID,
});
\`\`\`

### Additional Metadata

The \`additional_metadata\` field stores arbitrary key-value pairs:

\`\`\`typescript
createUpdateFieldInstruction({
  metadata: mintPubkey,
  updateAuthority: authority,
  field: "season",      // custom key
  value: "Season 1",   // custom value
  programId: TOKEN_2022_PROGRAM_ID,
});
\`\`\`

This is used for on-chain attributes, season tags, and any application-specific data without needing off-chain JSON.

### Space Considerations

TokenMetadata is variable-length. When the update authority changes the name or adds metadata, the account may need reallocation. Use \`createReallocInstruction\` to resize if needed.`,
          },
          {
            id: "te-3-3",
            title: "Build a Soulbound Token",
            type: "challenge",
            duration: "35m",
            completed: false,
            content: `## Challenge: Build a Soulbound Token

Combine NonTransferable, PermanentDelegate, MetadataPointer, and TokenMetadata to create a fully-featured soulbound token. This is the exact pattern used for Superteam Academy XP tokens.

### Objectives

1. Create a mint with all four extensions
2. Initialize metadata with name "Academy XP", symbol "AXP"
3. Mint tokens to a learner's wallet
4. Verify the token is non-transferable (transfer should fail)
5. Verify the permanent delegate can burn tokens

### Architecture

This challenge ties together everything you learned in this module. The extensions must be initialized in the correct order: create account, init all extensions, init mint, init metadata.`,
            starterCode: `import {
  Connection, Keypair, Transaction, SystemProgram,
  sendAndConfirmTransaction, clusterApiUrl,
} from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  createInitializeMintInstruction,
  createInitializeNonTransferableMintInstruction,
  createInitializePermanentDelegateInstruction,
  createInitializeMetadataPointerInstruction,
  createMintToInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
  getMintLen, ExtensionType,
} from "@solana/spl-token";
import {
  createInitializeInstruction,
} from "@solana/spl-token-metadata";

async function createSoulboundToken(authority: Keypair): Promise<{
  mint: string;
  isNonTransferable: boolean;
}> {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const mintKeypair = Keypair.generate();

  // 1. Calculate space for mint with all extensions
  //    NonTransferable, PermanentDelegate, MetadataPointer
  //    (TokenMetadata space is added separately)
  // TODO

  // 2. Create account instruction
  // TODO

  // 3. Initialize extensions (order: NonTransferable, PermanentDelegate, MetadataPointer)
  // TODO

  // 4. Initialize mint (0 decimals for XP)
  // TODO

  // 5. Initialize TokenMetadata: name="Academy XP", symbol="AXP"
  // TODO

  // 6. Mint 100 tokens to a learner
  // TODO

  // 7. Attempt transfer (should fail) and return result
  // TODO

  return { mint: mintKeypair.publicKey.toBase58(), isNonTransferable: true };
}`,
            testCases: [
              {
                name: "Mint created with all 4 extensions",
                expected: "Extensions: 4",
              },
              {
                name: "Transfer attempt fails",
                expected: "Error: NonTransferable",
              },
              {
                name: "Metadata name is correct",
                expected: "Name: Academy XP",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "compressed-nfts",
    title: "Compressed NFTs & State Compression",
    description:
      "Learn ZK Compression and Bubblegum for minting millions of NFTs at a fraction of the cost using concurrent Merkle trees.",
    instructor: "Diego Martinez",
    instructorAvatar: "DM",
    difficulty: "Advanced",
    duration: "16h 50m",
    lessons: 40,
    rating: 4.6,
    enrolled: 0,
    tags: ["cNFT", "ZK Compression", "Metaplex"],
    progress: 0,
    xp: 4200,
    thumbnail: "/nft.jpg",
    modules: [
      {
        title: "State Compression Fundamentals",
        lessons: [
          {
            id: "cn-1-1",
            title: "Merkle Trees Explained",
            type: "reading",
            duration: "15m",
            completed: false,
            content: `## Merkle Trees Explained

Merkle trees are the core data structure behind state compression on Solana. They allow you to prove the existence of millions of data items by storing only a single 32-byte root hash on-chain.

### Structure

A Merkle tree is a binary tree where each leaf contains a hash of some data, and each internal node contains the hash of its two children. The root hash is a single 32-byte value that commits to the entire dataset.

\`\`\`
        Root (H(AB + CD))
       /              \\
    H(AB)            H(CD)
   /     \\         /     \\
  H(A)   H(B)   H(C)   H(D)
   |       |      |       |
  Leaf A  Leaf B  Leaf C  Leaf D
\`\`\`

### Merkle Proofs

To prove that Leaf C exists in the tree, you provide a **proof path**: \`[H(D), H(AB)]\`. The verifier computes:
1. \`H(CD) = hash(H(C), H(D))\`
2. \`Root = hash(H(AB), H(CD))\`
3. Compare computed root with stored root

The proof size is \`O(log n)\` -- for a tree with 1 million leaves, the proof is only 20 hashes (640 bytes).

### Why This Matters for Solana

Solana charges rent for on-chain storage (~6.96 SOL per MB). Storing 1 million NFTs as individual accounts would cost thousands of SOL in rent. With a Merkle tree, you store one root hash on-chain and keep the leaves off-chain (indexed by RPC providers like Helius). The cost drops from thousands of SOL to under 10 SOL for the tree account.

### Trade-offs

- **Reads require an indexer**: You need a service (DAS API) to look up leaf data and generate proofs
- **Writes require current proof**: To modify a leaf, you must provide a valid proof at the time of the transaction
- **Concurrency challenges**: If two transactions modify different leaves simultaneously, they may conflict because both change the root`,
          },
          {
            id: "cn-1-2",
            title: "Concurrent Merkle Trees",
            type: "video",
            duration: "22m",
            completed: false,
            content: `## Concurrent Merkle Trees

This video explains how Solana's concurrent Merkle tree solves the concurrency problem of standard Merkle trees. This is the key innovation that makes state compression practical for high-throughput applications.

### The Concurrency Problem

With a standard Merkle tree, updating leaf A changes the root. If leaf B was being updated simultaneously using a proof generated against the old root, it fails because the root changed. This serializes all writes.

### The Solution: Changelogs

A concurrent Merkle tree stores a **changelog** -- a buffer of recent root changes. When a transaction arrives with a proof against a slightly stale root, the program can "fast-forward" the proof by replaying changelog entries. The parameter \`maxBufferSize\` controls how many concurrent writes are supported.

\`\`\`
maxBufferSize = 64 means 64 transactions can modify different
leaves in the same slot without conflicts
\`\`\`

### Tree Parameters

Two parameters define a concurrent Merkle tree:

- **\`maxDepth\`**: Maximum number of leaves = \`2^maxDepth\`. A depth of 20 supports ~1 million leaves.
- **\`maxBufferSize\`**: Number of concurrent modifications supported. Higher = more throughput but more rent.

| maxDepth | Max Leaves | maxBufferSize | Approx Rent |
|----------|-----------|---------------|-------------|
| 14 | 16,384 | 64 | ~1.1 SOL |
| 20 | 1,048,576 | 256 | ~5.3 SOL |
| 24 | 16,777,216 | 1024 | ~63 SOL |
| 30 | 1,073,741,824 | 2048 | ~1,600 SOL |

### Canopy

The **canopy** is an optional optimization that stores the top \`N\` levels of the tree on-chain. This reduces the proof size that clients must submit, saving transaction space. A canopy depth of 10 means clients only need to provide the bottom \`maxDepth - 10\` hashes in the proof.`,
          },
          {
            id: "cn-1-3",
            title: "Creating a Merkle Tree",
            type: "challenge",
            duration: "30m",
            completed: false,
            content: `## Challenge: Creating a Merkle Tree

Create an on-chain concurrent Merkle tree account suitable for minting compressed NFTs. Configure it with appropriate depth, buffer size, and canopy.

### Objectives

1. Calculate the space and rent for a tree with maxDepth=14, maxBufferSize=64, canopyDepth=10
2. Create the tree account using the SPL Account Compression program
3. Verify the tree was created by reading its header data`,
            starterCode: `import {
  Connection, Keypair, Transaction, SystemProgram,
  sendAndConfirmTransaction, clusterApiUrl,
} from "@solana/web3.js";
import {
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
  createAllocTreeIx,
  ValidDepthSizePair,
  getConcurrentMerkleTreeAccountSize,
} from "@solana/spl-account-compression";

const MAX_DEPTH = 14;
const MAX_BUFFER_SIZE = 64;
const CANOPY_DEPTH = 10;

async function createMerkleTree(payer: Keypair): Promise<string> {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const treeKeypair = Keypair.generate();

  // 1. Calculate required space
  // TODO: Use getConcurrentMerkleTreeAccountSize(MAX_DEPTH, MAX_BUFFER_SIZE, CANOPY_DEPTH)

  // 2. Get rent-exempt balance for that space
  // TODO

  // 3. Create the account (owner = SPL_ACCOUNT_COMPRESSION_PROGRAM_ID)
  // TODO

  // 4. Create the allocTreeIx instruction
  // TODO: createAllocTreeIx(treeKeypair.publicKey, payer.publicKey,
  //        { maxDepth: MAX_DEPTH, maxBufferSize: MAX_BUFFER_SIZE },
  //        CANOPY_DEPTH)

  // 5. Send transaction with both instructions
  // TODO

  return treeKeypair.publicKey.toBase58();
}`,
            testCases: [
              {
                name: "Tree account is created",
                expected: "Account exists: true",
              },
              {
                name: "Max depth is 14",
                expected: "maxDepth: 14",
              },
              {
                name: "Canopy depth is 10",
                expected: "canopyDepth: 10",
              },
            ],
          },
        ],
      },
      {
        title: "Bubblegum Protocol",
        lessons: [
          {
            id: "cn-2-1",
            title: "Bubblegum Architecture",
            type: "reading",
            duration: "12m",
            completed: false,
            content: `## Bubblegum Architecture

Bubblegum is Metaplex's program for creating and managing compressed NFTs (cNFTs) on Solana's state compression infrastructure. It sits on top of the SPL Account Compression program and implements the Metaplex metadata standard for compressed tokens.

### How Bubblegum Works

Instead of creating individual mint + metadata + master edition accounts for each NFT (~0.012 SOL each), Bubblegum hashes the NFT data and stores it as a leaf in a concurrent Merkle tree. The NFT data itself is emitted in transaction logs and indexed off-chain by the DAS API.

### Account Structure

Bubblegum uses three key accounts:

- **Tree Config PDA**: \`["tree_config", merkle_tree]\` -- stores the tree creator, total minted count, and collection configuration
- **Merkle Tree**: The SPL Account Compression tree that stores leaf hashes
- **Voucher (optional)**: Used when decompressing a cNFT back to a regular NFT

### The Leaf Schema

Each cNFT leaf contains:

\`\`\`
leaf_hash = hash(
  id,           // unique asset ID
  owner,        // current owner pubkey
  delegate,     // approved delegate pubkey
  nonce,        // leaf index
  data_hash,    // hash of metadata (name, symbol, uri, creators, etc.)
  creator_hash  // hash of creator array
)
\`\`\`

### Cost Comparison

| Approach | 10K NFTs | 1M NFTs |
|----------|----------|---------|
| Regular NFTs | ~120 SOL | ~12,000 SOL |
| cNFTs (depth 14) | ~1.1 SOL | N/A (max 16K) |
| cNFTs (depth 20) | ~5.3 SOL | ~5.3 SOL |

The savings are dramatic for large collections. The trade-off is dependence on indexers for reading NFT data.`,
          },
          {
            id: "cn-2-2",
            title: "Minting cNFTs",
            type: "challenge",
            duration: "35m",
            completed: false,
            content: `## Challenge: Minting cNFTs

Mint a batch of compressed NFTs to a Merkle tree using the Bubblegum program. This exercise uses the Metaplex Bubblegum SDK to mint cNFTs with metadata.

### Objectives

1. Create a tree config for Bubblegum
2. Mint a compressed NFT with name, symbol, URI, and creator data
3. Verify the cNFT exists by querying the DAS API

### Key Concept

Bubblegum's \`mintV1\` instruction takes the metadata as instruction arguments, hashes it into a leaf, and appends it to the Merkle tree. The raw metadata is emitted via the Noop program in transaction logs for indexers to capture.`,
            starterCode: `import { Connection, Keypair, clusterApiUrl, PublicKey } from "@solana/web3.js";
import {
  mplBubblegum, mintV1, createTree,
  parseLeafFromMintV1Transaction,
} from "@metaplex-foundation/mpl-bubblegum";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { keypairIdentity, generateSigner } from "@metaplex-foundation/umi";

async function mintCompressedNFT(payerSecret: Uint8Array): Promise<string> {
  const umi = createUmi(clusterApiUrl("devnet"))
    .use(mplBubblegum());

  // TODO: Set up keypair identity from payerSecret

  // TODO: Generate a merkle tree signer
  const merkleTree = generateSigner(umi);

  // TODO: Create the tree (maxDepth: 14, maxBufferSize: 64, canopyDepth: 10)
  // await createTree(umi, { merkleTree, maxDepth: 14, ... }).sendAndConfirm(umi);

  // TODO: Mint a cNFT using mintV1
  // await mintV1(umi, {
  //   leafOwner: umi.identity.publicKey,
  //   merkleTree: merkleTree.publicKey,
  //   metadata: {
  //     name: "Superteam Badge #1",
  //     symbol: "STB",
  //     uri: "https://arweave.net/example",
  //     sellerFeeBasisPoints: 0,
  //     creators: [{ address: umi.identity.publicKey, share: 100, verified: false }],
  //     collection: null,
  //     uses: null,
  //   },
  // }).sendAndConfirm(umi);

  return merkleTree.publicKey.toString();
}`,
            testCases: [
              {
                name: "Tree is created successfully",
                expected: "Tree exists: true",
              },
              {
                name: "cNFT is minted to tree",
                expected: "Leaf index: 0",
              },
              {
                name: "DAS API returns the cNFT",
                expected: "Asset found: Superteam Badge #1",
              },
            ],
          },
          {
            id: "cn-2-3",
            title: "Transferring & Burning cNFTs",
            type: "video",
            duration: "18m",
            completed: false,
            content: `## Transferring & Burning cNFTs

This video covers how to transfer and burn compressed NFTs. Since cNFTs don't have individual accounts, these operations work differently from regular NFTs -- they modify leaves in the Merkle tree.

### Transfer Flow

To transfer a cNFT, you need:

1. **Asset ID**: The unique identifier of the cNFT
2. **Current proof**: A Merkle proof from the DAS API showing the leaf's position
3. **Leaf data**: Owner, delegate, data hash, creator hash, nonce

The \`transfer\` instruction verifies the proof against the on-chain root, updates the owner in the leaf hash, and writes the new root.

\`\`\`typescript
// Fetch the asset and proof from DAS API
const asset = await umi.rpc.getAsset(assetId);
const proof = await umi.rpc.getAssetProof(assetId);

// Transfer
await transfer(umi, {
  leafOwner: currentOwner,
  newLeafOwner: newOwner.publicKey,
  merkleTree: proof.tree_id,
  root: proof.root,
  dataHash: asset.compression.data_hash,
  creatorHash: asset.compression.creator_hash,
  nonce: asset.compression.leaf_id,
  index: asset.compression.leaf_id,
  proof: proof.proof,
}).sendAndConfirm(umi);
\`\`\`

### Burning cNFTs

Burning replaces the leaf with an empty hash, effectively removing it from the tree:

\`\`\`typescript
await burn(umi, {
  leafOwner: owner,
  merkleTree: treeAddress,
  // ... same proof data as transfer
}).sendAndConfirm(umi);
\`\`\`

### Proof Freshness

The proof must be recent. If other leaves were modified between when you fetched the proof and when your transaction processes, the concurrent Merkle tree's changelog will attempt to reconcile. If more changes occurred than the \`maxBufferSize\`, the transaction will fail and you need to re-fetch the proof.`,
          },
        ],
      },
      {
        title: "DAS API & Indexing",
        lessons: [
          {
            id: "cn-3-1",
            title: "Digital Asset Standard API",
            type: "reading",
            duration: "10m",
            completed: false,
            content: `## Digital Asset Standard API

The DAS API is a standardized RPC interface for querying NFTs and compressed NFTs on Solana. Providers like Helius, Triton, and others implement this API, making it the universal way to fetch asset data.

### Why DAS?

Compressed NFTs don't have on-chain accounts you can read directly. Their data exists in transaction logs and Merkle tree leaves. The DAS API indexes this data and provides a clean query interface that works identically for both regular and compressed NFTs.

### Core Methods

**\`getAsset(id)\`** -- Fetch a single asset by its ID. Returns metadata, ownership, compression info, and grouping.

**\`getAssetsByOwner(owner)\`** -- Fetch all assets owned by a wallet. Supports pagination.

**\`getAssetsByGroup(groupKey, groupValue)\`** -- Fetch assets by collection. Example: all NFTs in a specific collection.

**\`getAssetProof(id)\`** -- Get the Merkle proof for a compressed NFT. Required for transfers and burns.

**\`searchAssets(query)\`** -- Full-text search with filters for owner, collection, creator, and more.

### Response Format

\`\`\`json
{
  "id": "asset_pubkey",
  "content": {
    "metadata": { "name": "Badge #1", "symbol": "STB" },
    "links": { "image": "https://..." }
  },
  "ownership": { "owner": "wallet_pubkey", "delegate": null },
  "compression": {
    "compressed": true,
    "tree": "tree_pubkey",
    "leaf_id": 0,
    "data_hash": "...",
    "creator_hash": "..."
  }
}
\`\`\`

### Integration Tips

- Use \`getAssetsByOwner\` for wallet NFT galleries
- Cache results client-side; DAS data updates within seconds of on-chain changes
- For transfers, always fetch a fresh proof right before building the transaction
- Helius provides the most comprehensive DAS implementation with additional methods like \`getSignaturesForAsset\``,
          },
          {
            id: "cn-3-2",
            title: "Querying cNFT Collections",
            type: "challenge",
            duration: "25m",
            completed: false,
            content: `## Challenge: Querying cNFT Collections

Write a TypeScript function that queries the DAS API to fetch all compressed NFTs in a collection, display their metadata, and verify ownership.

### Objectives

1. Use the DAS API to fetch assets by collection
2. Handle pagination for large collections
3. Display name, image, and owner for each asset`,
            starterCode: `import { PublicKey } from "@solana/web3.js";

const HELIUS_RPC = "https://devnet.helius-rpc.com/?api-key=YOUR_KEY";

interface DASAsset {
  id: string;
  content: {
    metadata: { name: string; symbol: string };
    links: { image: string };
  };
  ownership: { owner: string };
  compression: { compressed: boolean; tree: string; leaf_id: number };
}

async function getCollectionAssets(
  collectionMint: string,
  page: number = 1,
  limit: number = 20
): Promise<{ assets: DASAsset[]; total: number }> {
  // TODO: Call DAS API getAssetsByGroup
  // Method: "getAssetsByGroup"
  // Params: {
  //   groupKey: "collection",
  //   groupValue: collectionMint,
  //   page, limit,
  //   sortBy: { sortBy: "created", sortDirection: "desc" }
  // }

  const response = await fetch(HELIUS_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "collection-query",
      method: "getAssetsByGroup",
      params: {
        // TODO: Fill in parameters
      },
    }),
  });

  // TODO: Parse response and return assets + total count
  const data = await response.json();
  return { assets: [], total: 0 };
}

// Bonus: Get proof for a specific asset
async function getAssetProof(assetId: string): Promise<string[]> {
  // TODO: Call DAS API getAssetProof and return proof path
  return [];
}`,
            testCases: [
              {
                name: "Returns collection assets",
                expected: "Assets returned: > 0",
              },
              {
                name: "Assets have metadata",
                expected: "All assets have name: true",
              },
              {
                name: "Pagination works",
                expected: "Page 1 limit 10: 10 results",
              },
            ],
          },
          {
            id: "cn-3-3",
            title: "Building a cNFT Gallery",
            type: "challenge",
            duration: "40m",
            completed: false,
            content: `## Challenge: Building a cNFT Gallery

Build a React component that displays a wallet's compressed NFTs in a grid layout. Fetch data from the DAS API, handle loading states, and make each NFT clickable to show details.

### Objectives

1. Fetch all cNFTs owned by a connected wallet using DAS API
2. Render a responsive grid of NFT cards with images and names
3. Handle empty states, loading, and errors gracefully
4. Show compression details (tree address, leaf index) on click`,
            starterCode: `import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

interface CompressedNFT {
  id: string;
  name: string;
  image: string;
  compressed: boolean;
  tree: string;
  leafIndex: number;
}

export function CNFTGallery() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [nfts, setNfts] = useState<CompressedNFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<CompressedNFT | null>(null);

  useEffect(() => {
    if (!publicKey) return;
    // TODO: Fetch NFTs using DAS getAssetsByOwner
    // Filter to only compressed NFTs
    // Map response to CompressedNFT interface
    // Set loading states appropriately
  }, [publicKey]);

  if (!publicKey) return <div>Connect your wallet to view NFTs</div>;
  if (loading) return <div>Loading compressed NFTs...</div>;
  if (nfts.length === 0) return <div>No compressed NFTs found</div>;

  return (
    <div>
      {/* TODO: Grid layout of NFT cards */}
      {/* TODO: Each card shows image + name */}
      {/* TODO: Click handler sets selected NFT */}
      {/* TODO: Modal or panel showing compression details for selected NFT */}
    </div>
  );
}`,
            testCases: [
              {
                name: "Gallery renders NFT cards",
                expected: "Cards rendered: > 0",
              },
              {
                name: "Compressed NFTs show tree address",
                expected: "Tree address displayed: true",
              },
              {
                name: "Empty wallet shows message",
                expected: "Message: No compressed NFTs found",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "solana-mobile",
    title: "Solana Mobile Development",
    description:
      "Build mobile dApps with the Solana Mobile Stack. Mobile Wallet Adapter, dApp Store, and React Native integration.",
    instructor: "Sofia Rodrigues",
    instructorAvatar: "SR",
    difficulty: "Intermediate",
    duration: "13h 15m",
    lessons: 36,
    rating: 4.5,
    enrolled: 0,
    tags: ["Mobile", "React Native", "Solana"],
    progress: 0,
    xp: 3000,
    thumbnail: "/solana.jpg",
    modules: [
      {
        title: "Solana Mobile Stack",
        lessons: [
          {
            id: "sm-1-1",
            title: "SMS Overview",
            type: "reading",
            duration: "8m",
            completed: false,
            content: `## Solana Mobile Stack Overview

The Solana Mobile Stack (SMS) is a set of libraries and tools for building mobile dApps on Solana. It includes the Mobile Wallet Adapter protocol, a Seed Vault for secure key storage, and the Solana dApp Store for distribution.

### Components

- **Mobile Wallet Adapter (MWA)**: A protocol that lets mobile dApps communicate with wallet apps. Unlike WalletConnect, MWA is local-first -- it uses Android intents or local WebSockets, so transactions are signed without network round-trips.
- **Seed Vault**: A secure enclave-based key storage system available on Saga devices. Private keys never leave the hardware security module.
- **dApp Store**: An alternative app marketplace specifically for crypto applications, free from app store restrictions on Web3 functionality.

### Architecture

Mobile dApps on Solana follow this flow:

1. Your dApp requests a wallet connection via MWA
2. The user's installed wallet app (Phantom, Solflare, etc.) handles the request
3. The wallet prompts the user to approve the connection
4. Your dApp sends transactions to the wallet for signing
5. The wallet returns signed transactions to your dApp for submission

### Why Mobile Matters

Over 60% of crypto users access their wallets primarily on mobile. Native mobile dApps provide better UX than mobile web: push notifications, background processing, camera access for QR scanning, and biometric authentication for transaction signing.`,
          },
          {
            id: "sm-1-2",
            title: "Mobile Wallet Adapter",
            type: "video",
            duration: "20m",
            completed: false,
            content: `## Mobile Wallet Adapter

This video dives deep into the Mobile Wallet Adapter (MWA) protocol -- how it works under the hood, how to integrate it in your React Native app, and how to handle the authorization lifecycle.

### Protocol Flow

MWA uses a local communication channel between your dApp and the wallet:

1. **Discovery**: Your dApp broadcasts an MWA intent. The OS routes it to installed wallet apps.
2. **Authorization**: The wallet presents a consent UI. The user approves, and the wallet returns an auth token and the user's public key.
3. **Signing**: Your dApp sends serialized transactions to the wallet. The wallet signs and returns them.
4. **Deauthorization**: Either side can end the session.

### Integration with React Native

\`\`\`typescript
import { transact } from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";

const result = await transact(async (wallet) => {
  // Authorize
  const auth = await wallet.authorize({
    cluster: "devnet",
    identity: { name: "My dApp", uri: "https://mydapp.com" },
  });

  // Sign a transaction
  const signedTx = await wallet.signTransactions({
    transactions: [serializedTx],
  });

  return { publicKey: auth.publicKey, signedTx };
});
\`\`\`

### Authorization Tokens

After initial authorization, the wallet returns a reauthorization token. Store this securely (e.g., in encrypted async storage) to skip the consent UI on subsequent sessions. Tokens expire, so handle reauthorization gracefully.

### Error Handling

Common MWA errors:
- **WalletNotFound**: No compatible wallet is installed
- **UserDeclined**: User rejected the authorization or signing request
- **SessionTimeout**: The wallet session expired before the operation completed`,
          },
          {
            id: "sm-1-3",
            title: "Setting Up React Native",
            type: "challenge",
            duration: "30m",
            completed: false,
            content: `## Challenge: Setting Up React Native for Solana

Set up a new React Native project with all the dependencies needed for a Solana mobile dApp. Configure polyfills, install the Mobile Wallet Adapter library, and verify the setup compiles and runs.

### Objectives

1. Initialize a React Native project with the correct template
2. Install Solana and MWA dependencies
3. Configure the necessary polyfills (crypto, Buffer, URL)
4. Verify the project builds on Android`,
            starterCode: `// metro.config.js - Configure polyfills for Solana libraries
const { getDefaultConfig } = require("metro-config");

module.exports = (async () => {
  const defaultConfig = await getDefaultConfig();
  return {
    ...defaultConfig,
    resolver: {
      ...defaultConfig.resolver,
      extraNodeModules: {
        // TODO: Add polyfills for:
        // crypto: require.resolve("react-native-quick-crypto"),
        // buffer: require.resolve("buffer"),
        // url: require.resolve("react-native-url-polyfill"),
      },
    },
  };
})();

// App.tsx - Basic Solana mobile app structure
// TODO: Complete the setup
import React from "react";
import { View, Text, Button } from "react-native";
import { ConnectionProvider } from "@solana/wallet-adapter-react";
// import { transact } from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";

export default function App() {
  // TODO: Add state for connected wallet public key
  // TODO: Add connect function using transact()
  // TODO: Add disconnect function

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Solana Mobile dApp</Text>
      {/* TODO: Show connect/disconnect button */}
      {/* TODO: Display connected wallet address */}
    </View>
  );
}`,
            testCases: [
              {
                name: "Project compiles for Android",
                expected: "Build: success",
              },
              {
                name: "Polyfills configured correctly",
                expected: "Buffer available: true",
              },
              {
                name: "MWA library imported",
                expected: "transact function: defined",
              },
            ],
          },
        ],
      },
      {
        title: "Building Mobile dApps",
        lessons: [
          {
            id: "sm-2-1",
            title: "Connecting Wallets on Mobile",
            type: "reading",
            duration: "12m",
            completed: false,
            content: `## Connecting Wallets on Mobile

Mobile wallet connections on Solana differ significantly from web. Instead of browser extensions injecting a \`window.solana\` object, mobile uses the Mobile Wallet Adapter protocol for inter-app communication.

### The Connection Flow

1. Your dApp calls \`transact()\` which opens the MWA session
2. Inside the callback, call \`wallet.authorize()\` to request connection
3. The OS switches to the wallet app which shows a consent screen
4. After approval, control returns to your app with the user's public key and an auth token
5. Store the auth token for future sessions using \`wallet.reauthorize()\`

### Managing Connection State

\`\`\`typescript
import AsyncStorage from "@react-native-async-storage/async-storage";

// Store auth token after first connection
await AsyncStorage.setItem("mwa_auth_token", auth.auth_token);

// On subsequent launches, try reauthorization
const storedToken = await AsyncStorage.getItem("mwa_auth_token");
if (storedToken) {
  const reauth = await wallet.reauthorize({
    auth_token: storedToken,
    identity: appIdentity,
  });
}
\`\`\`

### Multiple Wallet Support

Users may have multiple wallet apps installed. MWA handles this gracefully -- if multiple wallets respond to the intent, the OS presents a chooser. Your dApp doesn't need to enumerate wallets; the protocol handles discovery.

### Platform Differences

- **Android**: MWA uses custom URI schemes and intents for communication
- **iOS**: Currently more limited; some wallets use deep links or universal links. Full MWA support on iOS is an active area of development.`,
          },
          {
            id: "sm-2-2",
            title: "Signing Transactions",
            type: "challenge",
            duration: "25m",
            completed: false,
            content: `## Challenge: Signing Transactions on Mobile

Build a mobile transaction flow that creates a SOL transfer, sends it to the wallet for signing via MWA, and submits it to the network.

### Objectives

1. Build a transfer transaction within the MWA \`transact\` callback
2. Sign it using the wallet adapter
3. Submit the signed transaction and display the result to the user`,
            starterCode: `import { transact } from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import {
  Connection, PublicKey, Transaction, SystemProgram,
  LAMPORTS_PER_SOL, clusterApiUrl,
} from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

async function sendSOLMobile(
  recipientAddress: string,
  amountSOL: number
): Promise<string> {
  const recipient = new PublicKey(recipientAddress);

  const txSignature = await transact(async (wallet) => {
    // 1. Authorize (or reauthorize) the session
    // TODO: await wallet.authorize({ cluster: "devnet", identity: { ... } })

    // 2. Get the sender's public key from auth result
    // TODO

    // 3. Build a transfer instruction
    // TODO: SystemProgram.transfer({
    //   fromPubkey: senderPubkey,
    //   toPubkey: recipient,
    //   lamports: amountSOL * LAMPORTS_PER_SOL,
    // })

    // 4. Create and populate the transaction
    // TODO: Get recent blockhash, set feePayer

    // 5. Sign with wallet
    // TODO: await wallet.signTransactions({ transactions: [...] })

    // 6. Send raw transaction to network
    // TODO: connection.sendRawTransaction(signedTx.serialize())

    return "tx_signature_here";
  });

  return txSignature;
}`,
            testCases: [
              {
                name: "Transaction is built correctly",
                expected: "Instructions: 1 (transfer)",
              },
              {
                name: "Wallet signs the transaction",
                expected: "Signatures: 1",
              },
              {
                name: "Transaction confirms on devnet",
                expected: "Status: confirmed",
              },
            ],
          },
          {
            id: "sm-2-3",
            title: "Displaying On-Chain Data",
            type: "video",
            duration: "18m",
            completed: false,
            content: `## Displaying On-Chain Data on Mobile

This video covers patterns for fetching, caching, and displaying on-chain data in React Native. Mobile apps have unique constraints: limited bandwidth, battery considerations, and the need for offline-capable caching.

### Fetching Account Data

Use \`connection.getAccountInfo()\` for individual accounts or \`connection.getMultipleAccountsInfo()\` for batch fetching. On mobile, batch fetches are preferred to reduce network round-trips.

\`\`\`typescript
import { useEffect, useState } from "react";
import { Connection, PublicKey } from "@solana/web3.js";

function useAccountBalance(pubkey: PublicKey | null) {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!pubkey) return;
    const connection = new Connection(clusterApiUrl("devnet"));
    connection.getBalance(pubkey).then((lamports) => {
      setBalance(lamports / LAMPORTS_PER_SOL);
    });
  }, [pubkey]);

  return balance;
}
\`\`\`

### WebSocket Subscriptions

For real-time updates, use account subscriptions. Be mindful of battery drain -- subscribe only to accounts the user is actively viewing and unsubscribe when the component unmounts or the app goes to background.

\`\`\`typescript
const subId = connection.onAccountChange(pubkey, (accountInfo) => {
  // Update UI with new data
  const newBalance = accountInfo.lamports / LAMPORTS_PER_SOL;
  setBalance(newBalance);
});
// Cleanup: connection.removeAccountChangeListener(subId);
\`\`\`

### Caching Strategies

- **AsyncStorage**: Persist last-known balances and token lists for instant display on app launch
- **SWR/React Query**: Use stale-while-revalidate pattern -- show cached data immediately, fetch fresh data in background
- **Optimistic updates**: When user sends a transaction, update the UI immediately and reconcile when the transaction confirms`,
          },
        ],
      },
      {
        title: "dApp Store & Distribution",
        lessons: [
          {
            id: "sm-3-1",
            title: "dApp Store Submission",
            type: "reading",
            duration: "10m",
            completed: false,
            content: `## dApp Store Submission

The Solana dApp Store is a permissionless, on-chain app marketplace. Unlike Google Play or the App Store, it doesn't restrict crypto functionality. Listing your app involves publishing metadata on-chain.

### Why the dApp Store?

Traditional app stores have restrictive policies around cryptocurrency: Apple takes a 30% cut of in-app NFT purchases, Google limits crypto wallet functionality, and both can delist apps arbitrarily. The dApp Store removes these gatekeepers.

### Submission Process

1. **Build your APK/AAB**: Standard Android build process
2. **Upload assets**: App icon, screenshots, and description to a permanent storage layer (Arweave or IPFS)
3. **Create the listing**: Publish metadata on-chain using the dApp Store publisher CLI
4. **Stake SOL**: A small SOL deposit is required to prevent spam listings

### Listing Metadata

Your dApp Store listing includes:
- App name and description
- Version info and release notes
- Download URL (pointing to your APK host)
- Screenshots and icon URIs
- Category tags
- Publisher info (linked to your Solana wallet)

### Content Policy

The dApp Store has minimal content restrictions compared to traditional stores. However, it does require apps to be functional, non-malicious, and accurately described. The community can flag fraudulent listings.

### Distribution Beyond the dApp Store

You can also distribute via direct APK download, alternative stores, or PWA. The dApp Store is one distribution channel, not the only one.`,
          },
          {
            id: "sm-3-2",
            title: "Testing on Device",
            type: "challenge",
            duration: "20m",
            completed: false,
            content: `## Challenge: Testing on Device

Set up a complete testing workflow for your Solana mobile dApp. Configure devnet testing, use the MWA fake wallet for automated tests, and verify end-to-end transaction flows on a physical device.

### Objectives

1. Configure the fake wallet adapter for unit tests
2. Run the app on a physical Android device with USB debugging
3. Test the full connection and transaction flow against devnet`,
            starterCode: `// test/transfer.test.ts - Integration test with fake wallet
import { transact } from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";

// Mock the wallet adapter for testing
jest.mock("@solana-mobile/mobile-wallet-adapter-protocol-web3js", () => ({
  transact: jest.fn(),
}));

const mockTransact = transact as jest.MockedFunction<typeof transact>;

describe("SOL Transfer Flow", () => {
  it("should build a valid transfer transaction", async () => {
    // TODO: Mock the wallet's authorize response
    // mockTransact.mockImplementation(async (callback) => {
    //   const mockWallet = {
    //     authorize: async () => ({
    //       publicKey: new Uint8Array(32), // mock pubkey
    //       auth_token: "test-token",
    //     }),
    //     signTransactions: async ({ transactions }) => transactions,
    //   };
    //   return callback(mockWallet);
    // });

    // TODO: Call your sendSOL function
    // TODO: Assert the transaction was built with correct recipient and amount
    // TODO: Assert signTransactions was called
  });

  it("should handle user rejection gracefully", async () => {
    // TODO: Mock wallet.authorize to throw UserDeclined error
    // TODO: Assert your function handles the error and returns appropriate message
  });
});`,
            testCases: [
              {
                name: "Fake wallet mock works",
                expected: "Mock authorize: success",
              },
              {
                name: "Transfer test passes",
                expected: "Transaction built: true",
              },
              {
                name: "Error handling test passes",
                expected: "UserDeclined caught: true",
              },
            ],
          },
          {
            id: "sm-3-3",
            title: "Publishing Your dApp",
            type: "video",
            duration: "15m",
            completed: false,
            content: `## Publishing Your dApp

This video walks through the complete process of packaging and publishing your Solana mobile dApp, from building a release APK to listing it on the dApp Store.

### Build Process

1. **Generate a signing key**: Use Android Studio or \`keytool\` to create a release keystore
2. **Configure signing in gradle**: Add signing config to \`app/build.gradle\`
3. **Build the release APK**: \`cd android && ./gradlew assembleRelease\`
4. **Test the release build**: Install on a device to verify everything works in release mode

### Release Checklist

Before publishing:
- Test all wallet connection flows on release build
- Verify transaction signing works (release mode has different crypto behavior)
- Test deep links and intent handling
- Verify polyfills work in release mode (crypto, Buffer)
- Check app size and optimize if needed (ProGuard/R8 shrinking)
- Test on multiple Android versions (minimum API 26)

### dApp Store Publishing

\`\`\`bash
# Install the publishing CLI
npm install -g @solana-mobile/dapp-store-cli

# Create your publisher account (one-time)
dapp-store create-publisher

# Upload your app assets to Arweave
dapp-store upload-assets --icon ./icon.png --screenshots ./screenshots/

# Publish the listing
dapp-store publish --apk ./app-release.apk --name "My Solana dApp"
\`\`\`

### Updating Your App

To push updates, increment the version in your listing and publish a new release. The dApp Store tracks version history. Users with auto-update enabled will receive the new version automatically.`,
          },
        ],
      },
    ],
  },
  {
    slug: "cross-program-invocations",
    title: "Cross-Program Invocations",
    description:
      "Master composability on Solana. Learn CPI patterns, PDA signing, token transfers between programs, and building modular architectures.",
    instructor: "Thiago Nascimento",
    instructorAvatar: "TN",
    difficulty: "Advanced",
    duration: "11h 30m",
    lessons: 32,
    rating: 4.8,
    enrolled: 0,
    tags: ["CPI", "Composability", "Anchor"],
    progress: 0,
    xp: 4000,
    thumbnail: "/anchor.jpg",
    modules: [
      {
        title: "CPI Fundamentals",
        lessons: [
          {
            id: "cpi-1-1",
            title: "What Are CPIs?",
            type: "reading",
            duration: "10m",
            completed: false,
            content: `## What Are Cross-Program Invocations?

Cross-Program Invocations (CPIs) allow one Solana program to call instructions on another program within the same transaction. This is the foundation of composability -- your program can transfer tokens, create accounts, interact with DeFi protocols, and compose with any on-chain program.

### How CPIs Work

When your program executes a CPI, it constructs an instruction (program ID, accounts, data) and calls \`invoke\` or \`invoke_signed\`. The runtime pauses your program, executes the target program, and returns control to your program with the result.

\`\`\`rust
// Your Program A calls the System Program to transfer SOL
solana_program::program::invoke(
    &system_instruction::transfer(&from, &to, lamports),
    &[from_account.clone(), to_account.clone()],
)?;
\`\`\`

### Key Properties

- **Privilege extension**: If a signer signed the original transaction, that signature extends through CPIs. The called program sees the account as a signer.
- **Atomicity**: If the CPI fails, your entire instruction fails and all state changes revert.
- **Depth limit**: CPI depth is capped at 4 levels (A -> B -> C -> D). Going deeper fails.
- **Compute budget sharing**: The called program consumes CU from the same transaction budget.

### Common CPI Targets

- **System Program**: Create accounts, transfer SOL, assign ownership
- **SPL Token / Token-2022**: Mint, transfer, burn, freeze tokens
- **Associated Token Account**: Create ATAs for users
- **Metaplex**: Create metadata, verify creators
- **Custom programs**: Any deployed program with a known interface`,
          },
          {
            id: "cpi-1-2",
            title: "invoke vs invoke_signed",
            type: "video",
            duration: "20m",
            completed: false,
            content: `## invoke vs invoke_signed

This video explains the two CPI functions and when to use each. Understanding this distinction is critical for writing secure programs that interact with other protocols.

### invoke

\`invoke\` passes through existing transaction signatures. Use it when a user or other signer has already signed the transaction and the target program needs that signature.

\`\`\`rust
use solana_program::program::invoke;

invoke(
    &instruction,       // the instruction to execute
    &[account1, account2],  // accounts required by the instruction
)?;
\`\`\`

Example: A user wants to transfer tokens through your program. The user signed the transaction, and you invoke the Token program's transfer instruction. The Token program sees the user as a signer because their signature was on the original transaction.

### invoke_signed

\`invoke_signed\` allows a PDA to act as a signer. Since PDAs have no private key, the only way they can "sign" is through this function. You provide the seeds and bump that derive the PDA, and the runtime verifies they produce the correct address.

\`\`\`rust
use solana_program::program::invoke_signed;

let seeds = &[b"vault", user_key.as_ref(), &[bump]];
invoke_signed(
    &instruction,
    &[vault_account, destination_account],
    &[seeds],  // signer seeds
)?;
\`\`\`

Example: Your program's vault PDA holds tokens. When a user withdraws, your program invokes the Token program's transfer instruction with the vault PDA as the authority. The seeds prove your program owns this PDA.

### Decision Matrix

| Scenario | Function |
|----------|----------|
| User signed the transaction, passing through to CPI | \`invoke\` |
| PDA needs to sign the CPI | \`invoke_signed\` |
| Both user and PDA must sign | Two CPIs or combine signer lists |`,
          },
          {
            id: "cpi-1-3",
            title: "Your First CPI",
            type: "challenge",
            duration: "30m",
            completed: false,
            content: `## Challenge: Your First CPI

Write an Anchor program that uses a CPI to transfer SOL from a user to a vault PDA. This is the most common CPI pattern in DeFi programs.

### Objectives

1. Define a vault PDA with seeds \`["vault"]\`
2. Implement a \`deposit\` instruction that CPIs to the System Program to transfer SOL
3. Implement a \`withdraw\` instruction that CPIs with PDA signing to return SOL`,
            starterCode: `use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod sol_vault {
    use super::*;

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        // TODO: CPI to System Program to transfer SOL from user to vault
        // Use system_program::transfer with CpiContext::new
        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        // TODO: CPI to System Program to transfer SOL from vault to user
        // Use system_program::transfer with CpiContext::new_with_signer
        // Seeds: [b"vault", &[ctx.bumps.vault]]
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    /// CHECK: PDA vault account
    #[account(
        mut,
        seeds = [b"vault"],
        bump,
    )]
    pub vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    // TODO: Add vault account with seeds, bump, and mut
    // TODO: Add constraint to verify user is authorized
    pub vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}`,
            testCases: [
              {
                name: "Deposit transfers SOL to vault",
                expected: "Vault balance: 1 SOL",
              },
              {
                name: "Withdraw returns SOL to user",
                expected: "User balance increased: true",
              },
              {
                name: "PDA signing works correctly",
                expected: "invoke_signed: success",
              },
            ],
          },
        ],
      },
      {
        title: "PDA Signing & Token CPIs",
        lessons: [
          {
            id: "cpi-2-1",
            title: "PDA Signers in CPIs",
            type: "reading",
            duration: "12m",
            completed: false,
            content: `## PDA Signers in CPIs

PDA signing is the mechanism that lets programs control assets. Without it, programs couldn't hold tokens, manage vaults, or act autonomously. Understanding PDA signing deeply is essential for any non-trivial Solana program.

### How PDA Signing Works

When you call \`invoke_signed\`, you pass signer seeds:

\`\`\`rust
let signer_seeds: &[&[&[u8]]] = &[
    &[b"vault", user.key.as_ref(), &[bump]],
];
\`\`\`

The runtime takes each seed array, appends the program ID, and derives the PDA. If the resulting address matches one of the accounts in the instruction, that account is marked as a signer for the CPI.

### Multiple PDA Signers

You can sign with multiple PDAs in a single CPI by providing multiple seed arrays:

\`\`\`rust
let signer_seeds: &[&[&[u8]]] = &[
    &[b"vault_a", &[bump_a]],
    &[b"vault_b", &[bump_b]],
];
invoke_signed(&ix, &accounts, signer_seeds)?;
\`\`\`

### Common Patterns

**Token vault**: A PDA owns a token account. When users withdraw, the program signs a transfer CPI with the vault's seeds.

**Mint authority**: A PDA is set as the mint authority of a token. The program signs mint instructions to issue new tokens.

**Escrow**: Two PDAs hold assets from different parties. The program signs both transfers when the escrow conditions are met.

### Security Considerations

- **Always store the canonical bump**: Recomputing bumps wastes ~3,000 CU and risks inconsistency
- **Verify PDA derivation in tests**: Ensure the seeds you use on-chain match what clients compute
- **Be careful with seed choices**: Seeds must uniquely identify the PDA. Using only \`[b"vault"]\` means one vault per program. Using \`[b"vault", user.key()]\` gives one per user.`,
          },
          {
            id: "cpi-2-2",
            title: "Token Transfer via CPI",
            type: "challenge",
            duration: "35m",
            completed: false,
            content: `## Challenge: Token Transfer via CPI

Build an escrow program that holds SPL tokens in a PDA-owned token account and releases them when conditions are met. This exercises PDA signing with the Token program.

### Objectives

1. Create a PDA-owned token account to hold escrowed tokens
2. Implement a \`deposit\` instruction that transfers tokens from user to escrow via CPI
3. Implement a \`release\` instruction that transfers tokens from escrow to recipient using PDA signing`,
            starterCode: `use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};
use anchor_spl::associated_token::AssociatedToken;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod token_escrow {
    use super::*;

    pub fn deposit(ctx: Context<DepositTokens>, amount: u64) -> Result<()> {
        // TODO: CPI to token::transfer
        // Transfer tokens from user's ATA to escrow vault
        // Use CpiContext::new (user signs the transfer)
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.escrow_vault.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
        );
        token::transfer(cpi_ctx, amount)?;
        Ok(())
    }

    pub fn release(ctx: Context<ReleaseTokens>, amount: u64) -> Result<()> {
        // TODO: CPI to token::transfer with PDA signer
        // Transfer tokens from escrow vault to recipient
        // Use CpiContext::new_with_signer
        // Seeds: [b"escrow", depositor.key().as_ref(), &[bump]]
        Ok(())
    }
}

#[derive(Accounts)]
pub struct DepositTokens<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    pub mint: Account<'info, Mint>,
    #[account(mut, associated_token::mint = mint, associated_token::authority = user)]
    pub user_token_account: Account<'info, TokenAccount>,
    // TODO: Define escrow_vault as PDA-owned token account
    // seeds = [b"escrow", user.key().as_ref()]
    pub escrow_vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ReleaseTokens<'info> {
    pub authority: Signer<'info>,
    // TODO: Define accounts for release (escrow_vault, recipient ATA, token_program)
}`,
            testCases: [
              {
                name: "Deposit moves tokens to escrow",
                expected: "Escrow balance: 100",
              },
              {
                name: "Release moves tokens to recipient",
                expected: "Recipient balance: 100",
              },
              {
                name: "PDA signs the release transfer",
                expected: "Signer: escrow PDA",
              },
            ],
          },
          {
            id: "cpi-2-3",
            title: "Mint & Burn via CPI",
            type: "video",
            duration: "22m",
            completed: false,
            content: `## Mint & Burn via CPI

This video covers how to mint new tokens and burn existing ones through CPIs. These operations require the mint authority (for minting) or the token account authority (for burning) to sign the CPI.

### Minting Tokens via CPI

To mint tokens, your program's PDA must be the mint authority:

\`\`\`rust
use anchor_spl::token::{self, MintTo, Token, Mint, TokenAccount};

pub fn mint_tokens(ctx: Context<MintTokens>, amount: u64) -> Result<()> {
    let seeds = &[b"mint_authority", &[ctx.bumps.mint_authority]];
    let signer_seeds = &[&seeds[..]];

    let cpi_accounts = MintTo {
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.destination.to_account_info(),
        authority: ctx.accounts.mint_authority.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
        signer_seeds,
    );
    token::mint_to(cpi_ctx, amount)?;
    Ok(())
}
\`\`\`

### Burning Tokens via CPI

Burning requires the token account owner (or delegate) to sign:

\`\`\`rust
use anchor_spl::token::{self, Burn, Token, Mint, TokenAccount};

pub fn burn_tokens(ctx: Context<BurnTokens>, amount: u64) -> Result<()> {
    let cpi_accounts = Burn {
        mint: ctx.accounts.mint.to_account_info(),
        from: ctx.accounts.token_account.to_account_info(),
        authority: ctx.accounts.owner.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
    );
    token::burn(cpi_ctx, amount)?;
    Ok(())
}
\`\`\`

### Practical Applications

- **XP minting**: Superteam Academy mints XP tokens to learners when they complete lessons. The mint authority is a PDA.
- **Season resets**: The PermanentDelegate (PDA) burns old season tokens.
- **Reward distribution**: DeFi protocols mint reward tokens proportional to staking duration.
- **Deflationary mechanics**: Protocols burn tokens on specific actions (e.g., burn-to-mint swaps).`,
          },
        ],
      },
      {
        title: "Advanced Patterns",
        lessons: [
          {
            id: "cpi-3-1",
            title: "Reloading Accounts After CPI",
            type: "reading",
            duration: "10m",
            completed: false,
            content: `## Reloading Accounts After CPI

One of the most common security issues in Solana programs is reading stale account data after a CPI. When a CPI modifies an account, your program's deserialized copy doesn't automatically update. You must explicitly reload it.

### The Problem

\`\`\`rust
// BEFORE CPI: vault has 1000 tokens
let vault_balance_before = ctx.accounts.vault.amount; // 1000

// CPI transfers 500 tokens OUT of vault
token::transfer(cpi_ctx, 500)?;

// AFTER CPI: vault still shows 1000 in our deserialized copy!
let vault_balance_after = ctx.accounts.vault.amount; // STILL 1000 (stale!)
\`\`\`

The Anchor \`Account<'info, T>\` type deserializes data when the instruction starts. CPIs modify the raw account data bytes, but the deserialized Rust struct isn't updated.

### The Solution: reload()

\`\`\`rust
// After CPI, reload the account data
ctx.accounts.vault.reload()?;
let vault_balance_after = ctx.accounts.vault.amount; // 500 (correct!)
\`\`\`

\`reload()\` re-reads the raw bytes from the account and deserializes them again. Always call it when you need to read an account that was modified by a CPI.

### When to Reload

- After a token transfer CPI where you read the source or destination balance
- After a mint CPI where you read the supply
- After any CPI that modifies an account your program subsequently reads
- NOT needed if you don't read the account after the CPI

### Performance Impact

Each \`reload()\` call costs ~1,000-2,000 CU for deserialization. This is negligible compared to the security risk of reading stale data. Never skip reloads to save compute.`,
          },
          {
            id: "cpi-3-2",
            title: "CPI Depth Limits",
            type: "video",
            duration: "15m",
            completed: false,
            content: `## CPI Depth Limits

This video explains Solana's CPI depth limit, why it exists, and strategies for designing within it.

### The 4-Level Limit

Solana allows CPI chains up to 4 programs deep:

\`\`\`
Transaction
  -> Program A (depth 1)
    -> CPI to Program B (depth 2)
      -> CPI to Program C (depth 3)
        -> CPI to Program D (depth 4)
          -> CPI to Program E (FAILS: depth exceeded)
\`\`\`

This means if your program (A) calls another program (B), program B can still CPI to depth 4. But if a user calls through a proxy program first, your available depth is reduced.

### Why the Limit Exists

- **Stack safety**: Each CPI level uses stack memory. Deep chains risk stack overflow.
- **Compute predictability**: Deeply nested CPIs make compute usage hard to predict and optimize.
- **Reentrancy prevention**: The depth limit bounds the complexity of cross-program call graphs.

### Practical Impact

Most programs only need 1-2 CPI levels:
- Your program -> Token Program (1 level) -- covers 90% of use cases
- Your program -> Lending Protocol -> Token Program (2 levels) -- complex DeFi

### Design Strategies

1. **Flatten CPI chains**: If Program A calls Program B which calls Program C, consider having Program A call B and C directly in sequence.
2. **Batch operations**: Instead of CPI-per-item, design instructions that handle multiple items in a single call.
3. **Split transactions**: If depth is a real constraint, split operations across multiple transactions.

### Compute Budget Considerations

CPI overhead is ~25,000 CU per hop plus the target program's actual execution cost. With a default budget of 200,000 CU, 4 levels of overhead alone consume 100,000 CU. Use \`ComputeBudgetProgram.setComputeUnitLimit\` to request up to 1.4M CU when needed.`,
          },
          {
            id: "cpi-3-3",
            title: "Building a Modular Protocol",
            type: "challenge",
            duration: "45m",
            completed: false,
            content: `## Challenge: Building a Modular Protocol

Design and implement a two-program system: a core program that manages user profiles, and a rewards program that CPIs into the core program to update user data and mints reward tokens.

### Objectives

1. Build the core program with a user profile account and an \`update_xp\` instruction
2. Build the rewards program that CPIs into the core program when granting rewards
3. Use PDA signing in the rewards program to authorize the CPI
4. Test the full cross-program flow end-to-end`,
            starterCode: `use anchor_lang::prelude::*;

// ===== CORE PROGRAM =====
declare_id!("Core111111111111111111111111111111");

#[program]
pub mod core_program {
    use super::*;

    pub fn init_profile(ctx: Context<InitProfile>) -> Result<()> {
        let profile = &mut ctx.accounts.profile;
        profile.user = ctx.accounts.user.key();
        profile.xp = 0;
        profile.bump = ctx.bumps.profile;
        Ok(())
    }

    pub fn update_xp(ctx: Context<UpdateXp>, amount: u64) -> Result<()> {
        // TODO: Add amount to profile.xp using checked_add
        // The caller must be an authorized program (rewards_authority)
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitProfile<'info> {
    #[account(
        init, payer = user, space = 8 + UserProfile::INIT_SPACE,
        seeds = [b"profile", user.key().as_ref()], bump,
    )]
    pub profile: Account<'info, UserProfile>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateXp<'info> {
    #[account(mut, seeds = [b"profile", profile.user.as_ref()], bump = profile.bump)]
    pub profile: Account<'info, UserProfile>,
    // TODO: Verify the signer is an authorized rewards program PDA
    pub authority: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct UserProfile {
    pub user: Pubkey,
    pub xp: u64,
    pub bump: u8,
}

// ===== REWARDS PROGRAM (separate program) =====
// TODO: Implement a rewards program that:
// 1. Has a PDA authority that is recognized by the core program
// 2. Implements a grant_reward instruction that CPIs to core_program::update_xp
// 3. Uses invoke_signed with the PDA seeds to authorize the CPI`,
            testCases: [
              {
                name: "Core profile initializes with 0 XP",
                expected: "XP: 0",
              },
              {
                name: "Rewards program CPIs to update XP",
                expected: "XP after reward: 100",
              },
              {
                name: "Unauthorized CPI is rejected",
                expected: "Error: Unauthorized",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "solana-pay",
    title: "Solana Pay Integration",
    description:
      "Integrate Solana Pay for instant, fee-less payments. QR codes, transaction requests, and point-of-sale systems.",
    instructor: "Camila Rocha",
    instructorAvatar: "CR",
    difficulty: "Beginner",
    duration: "8h 45m",
    lessons: 28,
    rating: 4.7,
    enrolled: 0,
    tags: ["Solana Pay", "Payments", "Commerce"],
    progress: 0,
    xp: 2000,
    thumbnail: "/solana.jpg",
    modules: [
      {
        title: "Solana Pay Basics",
        lessons: [
          {
            id: "sp-1-1",
            title: "How Solana Pay Works",
            type: "reading",
            duration: "8m",
            completed: false,
            content: `## How Solana Pay Works

Solana Pay is an open protocol for instant, fee-less payments on Solana. It enables merchants and applications to accept SOL and SPL token payments through QR codes and deep links, with transaction finality in under a second.

### Two Types of Requests

1. **Transfer Requests**: Simple point-to-point transfers. The QR code encodes the recipient address, amount, and token. The wallet constructs and signs the transfer transaction.

2. **Transaction Requests**: The QR code contains a URL. The wallet fetches a server-generated transaction from that URL, displays it for approval, signs it, and sends it back. This enables arbitrary on-chain logic (loyalty points, NFT minting, coupon redemption).

### The URL Scheme

Solana Pay URLs use the \`solana:\` scheme:

\`\`\`
solana:<recipient>?amount=<amount>&spl-token=<mint>&reference=<reference>&label=<label>&memo=<memo>
\`\`\`

- **recipient**: The merchant's wallet address
- **amount**: Payment amount in token units
- **spl-token**: (optional) SPL token mint. If omitted, payment is in SOL
- **reference**: A unique public key used to find the transaction on-chain
- **label**: Merchant name shown in wallet
- **memo**: Arbitrary data stored in the transaction

### Why Solana Pay?

- **No intermediaries**: Payments go directly from buyer to seller
- **Instant settlement**: Sub-second finality vs days for credit cards
- **Near-zero fees**: Transaction fees are fractions of a cent
- **Programmable**: Transaction Requests enable loyalty programs, discounts, and on-chain receipts as part of the payment flow`,
          },
          {
            id: "sp-1-2",
            title: "Transfer Requests",
            type: "video",
            duration: "15m",
            completed: false,
            content: `## Transfer Requests

This video demonstrates how Transfer Requests work -- the simplest form of Solana Pay. We'll trace the flow from QR code generation to payment verification.

### Creating a Transfer Request

\`\`\`typescript
import { createQR, encodeURL, TransferRequestURLFields } from "@solana/pay";
import { PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";

const recipient = new PublicKey("merchant_wallet_address");
const amount = new BigNumber(4.20);  // 4.20 SOL
const reference = Keypair.generate().publicKey;  // unique identifier
const label = "Superteam Store";
const memo = "Order #1234";

const url = encodeURL({
  recipient,
  amount,
  reference,
  label,
  memo,
});

// Generate QR code from the URL
const qr = createQR(url, 400, "white", "black");
\`\`\`

### The Wallet Flow

1. User scans QR code with a Solana Pay-compatible wallet (Phantom, Solflare)
2. Wallet parses the \`solana:\` URL and extracts payment details
3. Wallet displays: "Pay 4.20 SOL to Superteam Store"
4. User approves; wallet constructs a System Program transfer (or SPL transfer for tokens)
5. Wallet adds the \`reference\` public key as a non-signer account on the transaction
6. Wallet submits the transaction

### Finding the Transaction

The \`reference\` key is the magic that lets merchants find payments:

\`\`\`typescript
import { findReference } from "@solana/pay";

const signatureInfo = await findReference(connection, reference, { finality: "confirmed" });
// signatureInfo.signature contains the transaction hash
\`\`\`

The Solana RPC can search for transactions containing a specific account, and the reference key serves as a unique lookup key.`,
          },
          {
            id: "sp-1-3",
            title: "Generating Payment QR Codes",
            type: "challenge",
            duration: "20m",
            completed: false,
            content: `## Challenge: Generating Payment QR Codes

Build a function that generates Solana Pay QR codes for both SOL and USDC payments, with support for memo and reference tracking.

### Objectives

1. Generate a Solana Pay URL for a SOL payment
2. Generate a Solana Pay URL for a USDC payment (include spl-token mint)
3. Create a QR code from the URL
4. Poll for the payment using the reference key`,
            starterCode: `import { encodeURL, createQR, findReference } from "@solana/pay";
import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import BigNumber from "bignumber.js";

const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"); // devnet USDC

interface PaymentRequest {
  recipient: PublicKey;
  amount: number;
  token?: "SOL" | "USDC";
  label: string;
  orderId: string;
}

function createPaymentQR(request: PaymentRequest): {
  qrCode: ReturnType<typeof createQR>;
  reference: PublicKey;
} {
  // 1. Generate a unique reference key for this payment
  // TODO: const reference = Keypair.generate().publicKey;

  // 2. Build the URL fields
  // TODO: Include spl-token mint if token is "USDC"

  // 3. Encode the URL
  // TODO: const url = encodeURL({ ... });

  // 4. Create the QR code (400px, white bg, black fg)
  // TODO: const qrCode = createQR(url, 400, "white", "black");

  // TODO: return { qrCode, reference };
  throw new Error("Not implemented");
}

async function waitForPayment(
  reference: PublicKey,
  timeoutMs: number = 60000
): Promise<string> {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  // TODO: Poll findReference every 2 seconds until payment is found
  // Return the transaction signature
  // Throw error if timeout is reached

  throw new Error("Not implemented");
}`,
            testCases: [
              {
                name: "SOL payment URL is valid",
                expected: "URL starts with: solana:",
              },
              {
                name: "USDC payment includes mint",
                expected: "URL contains spl-token param",
              },
              {
                name: "Reference key is unique per payment",
                expected: "References differ: true",
              },
            ],
          },
        ],
      },
      {
        title: "Transaction Requests",
        lessons: [
          {
            id: "sp-2-1",
            title: "Transaction Request Spec",
            type: "reading",
            duration: "10m",
            completed: false,
            content: `## Transaction Request Spec

Transaction Requests are the advanced mode of Solana Pay. Instead of encoding a simple transfer in the QR code, the QR code contains a URL that the wallet fetches. Your server returns a fully-formed transaction for the wallet to sign.

### How It Works

1. QR code encodes: \`solana:https://your-api.com/pay?order=1234\`
2. Wallet sends GET request to the URL (to display context info)
3. Wallet sends POST request with the user's public key in the body
4. Your server builds a transaction, partially signs it if needed, serializes it, and returns it
5. Wallet signs the transaction and submits it

### GET Response (Display Info)

\`\`\`json
{
  "label": "Superteam Store",
  "icon": "https://your-store.com/icon.png"
}
\`\`\`

### POST Request

\`\`\`json
{
  "account": "user_wallet_public_key"
}
\`\`\`

### POST Response

\`\`\`json
{
  "transaction": "base64_encoded_serialized_transaction",
  "message": "Pay 4.20 USDC for Order #1234"
}
\`\`\`

### Why Transaction Requests?

They enable rich payment flows:
- **Loyalty points**: Mint an NFT receipt alongside the payment
- **Dynamic pricing**: Calculate price at request time (currency conversion)
- **Coupons**: Apply on-chain discount codes
- **Multi-instruction**: Payment + metadata + custom program calls in one transaction
- **Partial signing**: Server can pre-sign with a backend keypair for co-signed operations`,
          },
          {
            id: "sp-2-2",
            title: "Building a Payment API",
            type: "challenge",
            duration: "30m",
            completed: false,
            content: `## Challenge: Building a Payment API

Build a Next.js API route that implements the Solana Pay Transaction Request spec. The endpoint should create a transaction that transfers USDC from the buyer and mints a receipt token.

### Objectives

1. Implement GET handler returning label and icon
2. Implement POST handler that receives buyer's public key
3. Build a transaction with USDC transfer + memo instruction
4. Return the serialized transaction in the correct format`,
            starterCode: `// pages/api/pay.ts (Next.js API Route)
import { NextApiRequest, NextApiResponse } from "next";
import {
  Connection, Keypair, PublicKey, Transaction,
  clusterApiUrl, SystemProgram,
} from "@solana/web3.js";
import {
  createTransferCheckedInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";

const MERCHANT = new PublicKey("MERCHANT_WALLET_ADDRESS");
const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
const USDC_DECIMALS = 6;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    // TODO: Return label and icon
    // { label: "Superteam Store", icon: "https://..." }
    return res.status(200).json({});
  }

  if (req.method === "POST") {
    const { account } = req.body;
    if (!account) return res.status(400).json({ error: "Missing account" });

    const buyer = new PublicKey(account);
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

    // TODO: Get buyer's USDC ATA
    // TODO: Get merchant's USDC ATA
    // TODO: Build transfer instruction (1 USDC = 1_000_000 units)
    // TODO: Add a memo instruction with order details
    // TODO: Set recent blockhash and fee payer (buyer)
    // TODO: Serialize and return base64 transaction

    const tx = new Transaction();
    // ... build transaction ...

    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    tx.feePayer = buyer;

    const serialized = tx.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });

    return res.status(200).json({
      transaction: serialized.toString("base64"),
      message: "Pay 1 USDC to Superteam Store",
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
}`,
            testCases: [
              {
                name: "GET returns label and icon",
                expected: "label: Superteam Store",
              },
              {
                name: "POST returns base64 transaction",
                expected: "transaction: base64 string",
              },
              {
                name: "Transaction includes USDC transfer",
                expected: "Instructions: transfer_checked",
              },
            ],
          },
          {
            id: "sp-2-3",
            title: "Verifying Payments",
            type: "video",
            duration: "18m",
            completed: false,
            content: `## Verifying Payments

This video covers how to reliably verify that a Solana Pay payment was completed. Payment verification is critical for any merchant integration -- you need to confirm the right amount was paid to the right address before fulfilling an order.

### Verification Methods

**Method 1: Reference Key Lookup**

For Transfer Requests, use the reference key included in the payment URL:

\`\`\`typescript
import { findReference, validateTransfer } from "@solana/pay";

// Find the transaction containing our reference
const signatureInfo = await findReference(connection, reference, {
  finality: "confirmed",
});

// Validate the transfer details match expectations
await validateTransfer(connection, signatureInfo.signature, {
  recipient: merchantWallet,
  amount: expectedAmount,
  splToken: USDC_MINT,  // omit for SOL
});
\`\`\`

**Method 2: Transaction Parsing**

For Transaction Requests, parse the confirmed transaction to verify instructions:

\`\`\`typescript
const tx = await connection.getTransaction(signature, {
  commitment: "confirmed",
  maxSupportedTransactionVersion: 0,
});
// Parse instruction data to verify transfer amount, recipient, etc.
\`\`\`

### Polling Pattern

Implement a polling loop that checks for payment confirmation:

1. Start polling when QR code is displayed
2. Call \`findReference\` every 2-5 seconds
3. On success, validate the transfer details
4. Set a timeout (e.g., 10 minutes) for abandoned payments
5. Show success UI and fulfill the order

### Finality Considerations

- **Processed**: Transaction was included but not yet confirmed by the cluster. Not safe to fulfill.
- **Confirmed**: Voted on by supermajority of stake. Safe for most use cases.
- **Finalized**: Rooted (31+ confirmations). Maximum safety for high-value transactions.

For typical retail payments, \`confirmed\` finality is sufficient (~400ms). For high-value B2B transactions, wait for \`finalized\` (~12 seconds).`,
          },
        ],
      },
      {
        title: "Point of Sale",
        lessons: [
          {
            id: "sp-3-1",
            title: "Building a POS Terminal",
            type: "challenge",
            duration: "35m",
            completed: false,
            content: `## Challenge: Building a POS Terminal

Build a simple point-of-sale interface that generates Solana Pay QR codes for items, displays payment status in real-time, and shows confirmation when payment is received.

### Objectives

1. Create a product grid with items and prices
2. Generate a Solana Pay QR code when an item is selected
3. Poll for payment confirmation and display success state
4. Handle payment timeout and retry logic`,
            starterCode: `import { useState, useEffect, useCallback } from "react";
import { createQR, encodeURL, findReference } from "@solana/pay";
import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import BigNumber from "bignumber.js";

interface Product {
  name: string;
  price: number; // in SOL
  image: string;
}

const PRODUCTS: Product[] = [
  { name: "Coffee", price: 0.05, image: "/coffee.png" },
  { name: "Sticker Pack", price: 0.1, image: "/stickers.png" },
  { name: "T-Shirt", price: 1.0, image: "/tshirt.png" },
];

const MERCHANT = new PublicKey("MERCHANT_ADDRESS_HERE");

export function POSTerminal() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [reference, setReference] = useState<PublicKey | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "pending" | "confirmed" | "timeout"
  >("idle");

  // TODO: When product is selected:
  // 1. Generate new reference keypair
  // 2. Build Solana Pay URL with product price
  // 3. Create QR code and display it
  // 4. Start polling for payment

  const startPayment = useCallback((product: Product) => {
    // TODO: Generate reference, encode URL, create QR
    setSelectedProduct(product);
    setPaymentStatus("pending");
  }, []);

  useEffect(() => {
    if (paymentStatus !== "pending" || !reference) return;
    // TODO: Poll findReference every 2 seconds
    // On success: setPaymentStatus("confirmed")
    // After 5 minutes: setPaymentStatus("timeout")
  }, [paymentStatus, reference]);

  return (
    <div>
      {/* TODO: Product grid */}
      {/* TODO: QR code display */}
      {/* TODO: Payment status indicator */}
    </div>
  );
}`,
            testCases: [
              {
                name: "QR code generated for product",
                expected: "QR element rendered: true",
              },
              {
                name: "Payment polling starts on selection",
                expected: "Status: pending",
              },
              {
                name: "Timeout after 5 minutes",
                expected: "Status: timeout",
              },
            ],
          },
          {
            id: "sp-3-2",
            title: "Receipt Tokens",
            type: "reading",
            duration: "12m",
            completed: false,
            content: `## Receipt Tokens

Receipt tokens are on-chain proof of purchase. By minting a compressed NFT or soulbound token at the time of payment, merchants can create verifiable, immutable records that enable loyalty programs, returns, and analytics.

### Why On-Chain Receipts?

- **Verifiable**: Anyone can confirm a purchase happened without trusting the merchant's database
- **Portable**: Receipts live in the buyer's wallet, not in an email inbox
- **Programmable**: Smart contracts can check for receipt tokens to gate access (e.g., "only customers who bought in Season 1 get this discount")
- **Composable**: Other protocols can build on top of receipts (loyalty programs, cashback, reviews)

### Implementation Patterns

**Compressed NFTs** (cheapest): Use Bubblegum to mint a cNFT receipt. Cost is negligible (~$0.0001 per receipt). Metadata includes purchase details.

**Soulbound Token-2022**: Use NonTransferable extension. Receipt is permanently in the buyer's wallet. Good for warranty claims and loyalty status.

**Fungible loyalty points**: Mint SPL tokens proportional to purchase amount. Redeemable for discounts. Can use Transfer Fee extension for decay mechanics.

### Receipt Metadata Standard

\`\`\`json
{
  "name": "Superteam Store Receipt #4521",
  "symbol": "RCPT",
  "description": "Purchase receipt for Order #4521",
  "attributes": [
    { "trait_type": "merchant", "value": "Superteam Store" },
    { "trait_type": "amount", "value": "4.20 USDC" },
    { "trait_type": "date", "value": "2026-02-18" },
    { "trait_type": "items", "value": "2x Coffee, 1x Sticker Pack" }
  ]
}
\`\`\`

### Integration with Payment Flow

In a Transaction Request handler, include the receipt mint instruction alongside the payment transfer. Both execute atomically -- if payment fails, no receipt is minted.`,
          },
          {
            id: "sp-3-3",
            title: "Production Deployment",
            type: "video",
            duration: "15m",
            completed: false,
            content: `## Production Deployment

This video covers the operational considerations for deploying Solana Pay in a production merchant environment. We address RPC reliability, error recovery, reconciliation, and compliance.

### RPC Infrastructure

- **Use a dedicated RPC provider** (Helius, Triton, QuickNode) -- public endpoints have rate limits and may drop requests under load
- **Configure retry logic**: RPC calls can fail transiently. Retry with exponential backoff for \`findReference\` polling
- **Multiple providers**: For critical payment flows, failover to a secondary RPC provider if the primary is down

### Transaction Reliability

\`\`\`typescript
// Send with preflight and retry
const signature = await connection.sendRawTransaction(signedTx.serialize(), {
  skipPreflight: false,
  preflightCommitment: "confirmed",
  maxRetries: 3,
});

// Confirm with timeout
const confirmation = await connection.confirmTransaction({
  signature,
  blockhash: latestBlockhash.blockhash,
  lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
}, "confirmed");
\`\`\`

### Reconciliation

Run a daily reconciliation job that:
1. Queries all transactions to your merchant wallet in the last 24 hours
2. Matches them against your order database using reference keys or memos
3. Flags unmatched transactions (overpayments, test transactions, unknown sources)
4. Calculates total revenue per token type

### Error Handling Checklist

- Buyer's token account doesn't exist (create ATA in Transaction Request)
- Insufficient balance (return clear error message)
- Blockhash expired (rebuild transaction with fresh blockhash)
- Network congestion (increase priority fee dynamically)
- RPC timeout (retry with backoff)

### Compliance Notes

- Keep transaction hashes as proof of payment for accounting
- USDC amounts are exact (6 decimals); SOL amounts fluctuate in fiat value
- Consider using USDC for price stability in merchant applications`,
          },
        ],
      },
    ],
  },
  {
    slug: "dao-governance",
    title: "DAO Governance on Solana",
    description:
      "Build decentralized governance systems with SPL Governance. Proposals, voting, treasury management, and council-based DAOs.",
    instructor: "Fernando Lima",
    instructorAvatar: "FL",
    difficulty: "Intermediate",
    duration: "15h 10m",
    lessons: 38,
    rating: 4.5,
    enrolled: 0,
    tags: ["DAO", "Governance", "SPL"],
    progress: 0,
    xp: 3200,
    thumbnail: "/defi.jpg",
    modules: [
      {
        title: "Governance Fundamentals",
        lessons: [
          {
            id: "dao-1-1",
            title: "What is a DAO?",
            type: "reading",
            duration: "10m",
            completed: false,
            content: `## What is a DAO?

A Decentralized Autonomous Organization (DAO) is an entity governed by smart contracts and token holder votes rather than a centralized board or CEO. Members collectively make decisions about treasury allocation, protocol upgrades, and operational strategy through on-chain proposals and voting.

### DAO Structure

- **Token holders**: Members who hold governance tokens. Their voting power is typically proportional to their token holdings.
- **Proposals**: Formal suggestions for the DAO to take action -- spending treasury funds, changing protocol parameters, or approving partnerships.
- **Voting**: Token holders cast votes (for, against, abstain) during a defined voting period.
- **Execution**: If a proposal passes (meets quorum and approval threshold), the proposed transactions execute on-chain.

### Types of DAOs

1. **Protocol DAOs**: Govern DeFi protocols. Token holders vote on fee structures, supported collateral, and protocol upgrades. Examples: Jupiter DAO, Marinade.
2. **Investment DAOs**: Pool capital and collectively decide on investments. Members vote on which projects to fund.
3. **Service DAOs**: Coordinate contributor work. Treasury pays contributors approved by community votes.
4. **Social DAOs**: Community-focused with token-gated access and collective decision-making. Superteam operates as a service/social DAO hybrid.

### Why On-Chain Governance?

- **Transparency**: Every vote and treasury transaction is publicly verifiable
- **Permissionless participation**: Anyone holding tokens can propose and vote
- **Trustless execution**: Approved proposals execute automatically -- no reliance on a single admin
- **Accountability**: Vote history is permanent and auditable`,
          },
          {
            id: "dao-1-2",
            title: "SPL Governance Overview",
            type: "video",
            duration: "22m",
            completed: false,
            content: `## SPL Governance Overview

This video covers SPL Governance -- the standard governance program on Solana used by hundreds of DAOs, including the Solana Foundation, Marinade, and Mango Markets.

### Core Concepts

**Realm**: The top-level governance entity. Each DAO creates a Realm that defines the governance token(s) and rules.

**Governance**: A sub-entity within a Realm that controls a specific governed account (e.g., a treasury wallet, a program upgrade authority, or a token mint). A Realm can have multiple Governances.

**Proposal**: A suggested action within a Governance. Contains one or more transactions to execute if approved.

**Token Owner Record**: Tracks how many governance tokens a user has deposited for voting.

### Account Hierarchy

\`\`\`
Realm
├── Community Token Mint (voting token)
├── Council Token Mint (optional, for council votes)
├── Governance A (controls Treasury Wallet)
│   ├── Proposal 1 (transfer 100 SOL to contributor)
│   └── Proposal 2 (fund marketing campaign)
└── Governance B (controls Program Upgrade Authority)
    └── Proposal 3 (upgrade program to v2)
\`\`\`

### Voting Configuration

Each Governance has configurable parameters:
- **Vote threshold**: Percentage of "yes" votes needed (e.g., 60%)
- **Quorum**: Minimum participation required (e.g., 1% of total supply)
- **Voting period**: How long voting stays open (e.g., 3 days)
- **Cool-off period**: Time after voting ends before execution
- **Min tokens to create proposal**: Prevents spam proposals

### Realms UI

[Realms](https://app.realms.today) is the standard frontend for SPL Governance. It provides a ready-made interface for creating DAOs, proposals, and voting. Most DAOs use Realms directly rather than building custom governance UIs.`,
          },
          {
            id: "dao-1-3",
            title: "Creating a Realm",
            type: "challenge",
            duration: "25m",
            completed: false,
            content: `## Challenge: Creating a Realm

Create a new DAO Realm using the SPL Governance SDK. Configure it with a community token for voting and set up basic governance rules.

### Objectives

1. Create a governance token mint (or use an existing one)
2. Create a Realm with the community token
3. Set governance parameters (vote threshold, voting period, quorum)
4. Deposit tokens and verify your Token Owner Record`,
            starterCode: `import {
  Connection, Keypair, PublicKey, Transaction,
  sendAndConfirmTransaction, clusterApiUrl,
} from "@solana/web3.js";
import {
  createMint, getOrCreateAssociatedTokenAccount, mintTo,
} from "@solana/spl-token";

// SPL Governance Program ID
const GOVERNANCE_PROGRAM_ID = new PublicKey(
  "GovER5Lthms3bLBqWub97yVRs6buSNerBLUsGY7gvQ7e"
);

async function createDAO(authority: Keypair): Promise<{
  realm: string;
  communityMint: string;
}> {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  // 1. Create a community governance token mint
  // TODO: createMint with authority as mint authority, 6 decimals

  // 2. Mint tokens to the authority's wallet
  // TODO: Mint 1,000,000 tokens for initial governance

  // 3. Create the Realm
  // TODO: Use SPL Governance instructions to create realm
  // Parameters:
  //   name: "Superteam Academy DAO"
  //   communityMint: the mint from step 1
  //   minCommunityTokensToCreateGovernance: 100_000
  //   communityMintMaxVoterWeightSource: FULL_SUPPLY

  // 4. Deposit governance tokens
  // TODO: Create Token Owner Record and deposit tokens

  return {
    realm: "realm_address_here",
    communityMint: "mint_address_here",
  };
}`,
            testCases: [
              {
                name: "Realm is created on-chain",
                expected: "Realm exists: true",
              },
              {
                name: "Community mint is set correctly",
                expected: "Realm community mint matches",
              },
              {
                name: "Tokens deposited for voting",
                expected: "Token Owner Record: 1000000",
              },
            ],
          },
        ],
      },
      {
        title: "Proposals & Voting",
        lessons: [
          {
            id: "dao-2-1",
            title: "Proposal Lifecycle",
            type: "reading",
            duration: "12m",
            completed: false,
            content: `## Proposal Lifecycle

Proposals in SPL Governance follow a strict state machine with defined transitions. Understanding this lifecycle is essential for both building governance UIs and writing programs that integrate with governance.

### States

1. **Draft**: Proposal created but not yet submitted for voting. The creator can add transactions (instructions to execute) and edit the proposal.

2. **SigningOff**: The proposal is finalized and awaiting required signatories. If the governance requires additional approvers before voting opens, they sign off here.

3. **Voting**: The voting period is active. Token holders can cast votes (yes/no/abstain). The voting period is defined per governance (e.g., 3 days).

4. **Succeeded**: Voting ended, and the proposal met both the quorum requirement and the vote threshold. Transactions are ready to execute.

5. **Defeated**: Voting ended, and the proposal did not meet the required threshold or quorum.

6. **Executing**: Transactions from the proposal are being executed. For multi-transaction proposals, they execute in sequence.

7. **Completed**: All transactions executed successfully.

8. **Cancelled**: The proposal was cancelled by the creator or the DAO before it completed.

### Tipping

SPL Governance supports **tipping** -- if enough votes are cast to make the outcome mathematically certain before the voting period ends, the proposal tips immediately. For example, if 60% threshold is required and 61% of all possible votes are "yes", the proposal tips to Succeeded even though time remains.

### Execution Delay

After a proposal succeeds, there's a configurable **hold-up time** before transactions can execute. This gives the community time to react. Typical delays range from 0 (immediate) to several days for critical operations like program upgrades.`,
          },
          {
            id: "dao-2-2",
            title: "Token-Weighted Voting",
            type: "video",
            duration: "18m",
            completed: false,
            content: `## Token-Weighted Voting

This video covers how voting power works in SPL Governance, including community tokens, council tokens, and voter weight plugins.

### Basic Token-Weighted Voting

By default, 1 token = 1 vote. A holder with 100,000 tokens has 100x the voting power of someone with 1,000 tokens. Tokens must be deposited into the governance system before voting -- they're held in escrow for the voting period.

### Community vs Council

SPL Governance supports two tiers of governance:

- **Community**: Large token holder base. Used for major decisions (treasury allocation, protocol changes).
- **Council**: Small group of trusted members. Used for operational decisions (hiring, small expenses). Council can also veto community proposals.

A Realm can be configured as community-only, council-only, or both.

### Voter Weight Plugins

The raw "1 token = 1 vote" model has limitations (plutocracy). Voter Weight Addin plugins modify voting power:

- **VSR (Voter Stake Registry)**: Lock tokens for longer = more weight. 1-year lockup might give 4x voting power.
- **NFT Voter**: Each NFT from a specific collection = 1 vote. Enables 1-person-1-vote with NFT-based identity.
- **Quadratic**: Vote weight = sqrt(tokens). Reduces the power of whales.

### Voting Mechanics

\`\`\`typescript
// Cast a vote
await castVote(
  connection,
  programId,
  realm,
  governance,
  proposal,
  proposalOwnerRecord,
  tokenOwnerRecord,
  authority,
  Vote.Yes,  // or Vote.No, Vote.Abstain
);
\`\`\`

### Relinquish Vote

After the voting period ends, token holders can relinquish their vote to unlock their deposited tokens. Unrelinquished votes don't affect the outcome but keep tokens locked.`,
          },
          {
            id: "dao-2-3",
            title: "Creating & Executing Proposals",
            type: "challenge",
            duration: "35m",
            completed: false,
            content: `## Challenge: Creating & Executing Proposals

Create a governance proposal that transfers SOL from the DAO treasury, vote on it, and execute it after approval. This exercises the full proposal lifecycle.

### Objectives

1. Create a proposal with a treasury transfer transaction
2. Sign off on the proposal to start voting
3. Cast votes to approve the proposal
4. Execute the proposal's transaction after the voting period`,
            starterCode: `import {
  Connection, Keypair, PublicKey, Transaction, SystemProgram,
  sendAndConfirmTransaction, clusterApiUrl,
} from "@solana/web3.js";

// SPL Governance helpers (pseudocode - actual SDK usage)
const GOVERNANCE_PROGRAM_ID = new PublicKey(
  "GovER5Lthms3bLBqWub97yVRs6buSNerBLUsGY7gvQ7e"
);

interface ProposalConfig {
  realm: PublicKey;
  governance: PublicKey;
  tokenOwnerRecord: PublicKey;
  title: string;
  description: string;
}

async function createAndExecuteProposal(
  authority: Keypair,
  config: ProposalConfig,
  treasuryTransfer: { recipient: PublicKey; lamports: number },
): Promise<{ proposal: string; executionTx: string }> {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  // 1. Create the proposal
  // TODO: Use createProposal instruction
  // Set name, description, and vote type

  // 2. Add the treasury transfer transaction to the proposal
  // TODO: Use insertTransaction instruction
  // The transaction should be a SystemProgram.transfer from governance treasury

  // 3. Sign off on the proposal (moves to Voting state)
  // TODO: Use signOffProposal instruction

  // 4. Cast a "Yes" vote
  // TODO: Use castVote instruction with Vote.Yes

  // 5. Wait for voting period to end (or tip)
  // In testing: the proposal tips immediately if you hold enough tokens

  // 6. Execute the proposal's transaction
  // TODO: Use executeTransaction instruction

  return {
    proposal: "proposal_address",
    executionTx: "execution_signature",
  };
}`,
            testCases: [
              {
                name: "Proposal is created",
                expected: "State: Voting",
              },
              {
                name: "Vote tips the proposal",
                expected: "State: Succeeded",
              },
              {
                name: "Treasury transfer executes",
                expected: "Recipient balance increased: true",
              },
            ],
          },
        ],
      },
      {
        title: "Treasury & Advanced Patterns",
        lessons: [
          {
            id: "dao-3-1",
            title: "Treasury Management",
            type: "reading",
            duration: "10m",
            completed: false,
            content: `## Treasury Management

A DAO's treasury is its economic engine. Proper treasury management involves secure custody, diversification, and transparent governance-controlled spending. On Solana, the SPL Governance program provides native treasury support.

### How DAO Treasuries Work

Each Governance in SPL Governance controls a **native treasury** -- a PDA that can hold SOL and SPL tokens. Funds can only leave the treasury through executed governance proposals. No single person can unilaterally withdraw.

### Treasury Account Structure

\`\`\`
Governance PDA
├── Native Treasury (holds SOL)
├── Token Account A (holds USDC)
├── Token Account B (holds custom token)
└── Program Upgrade Authority (controls deployed programs)
\`\`\`

### Best Practices

1. **Diversify holdings**: Don't keep the entire treasury in one volatile token. Hold a mix of SOL, stablecoins (USDC), and the native governance token.

2. **Streaming payments**: For ongoing contributor payments, use streaming protocols (Streamflow, Mean Finance) approved via governance. This avoids large lump-sum proposals.

3. **Spending limits**: Configure separate Governances with different thresholds. A "small grants" governance might require only council approval for amounts under 100 SOL, while a "major expense" governance needs full community vote.

4. **Earmarking**: Use multiple token accounts to earmark funds for specific purposes (marketing, development, operations).

### Treasury Reporting

Build transparency dashboards that show:
- Current balances across all treasury accounts
- Historical inflows and outflows
- Proposal-linked spending (tie each outflow to the governance proposal that approved it)
- Burn rate and runway projections`,
          },
          {
            id: "dao-3-2",
            title: "Multi-sig Councils",
            type: "video",
            duration: "20m",
            completed: false,
            content: `## Multi-sig Councils

This video covers how to set up and manage a council-based DAO using SPL Governance and Squads multisig. Councils provide fast execution for operational decisions while maintaining decentralization.

### Council vs Community Governance

| Aspect | Community | Council |
|--------|-----------|---------|
| Voters | All token holders | Selected council members |
| Speed | Days (voting period) | Hours (fewer voters) |
| Use case | Major decisions | Day-to-day operations |
| Token | Tradeable governance token | Non-tradeable council token |
| Threshold | % of supply | M-of-N council members |

### Setting Up a Council

In SPL Governance:
1. Create a council token mint (usually non-transferable, one per council member)
2. Mint one token to each council member's wallet
3. Create the Realm with both community and council token mints
4. Configure council governance rules (e.g., 3-of-5 council approval)

### Squads Protocol

For pure multisig operations without full governance overhead, **Squads** is the standard on Solana:

\`\`\`
Squads Multisig
├── Members: [Alice, Bob, Carol, Dave, Eve]
├── Threshold: 3 of 5
├── Vault (PDA): Holds SOL and tokens
└── Transactions: Proposed, approved, executed
\`\`\`

Squads is used by major Solana projects for program authority, treasury management, and operational security.

### Hybrid Pattern

The most robust setup combines both:
- **Community governance** for protocol parameters, major spending, and upgrades
- **Council/Squads multisig** for operational decisions, emergency actions, and daily operations
- **Veto rights** where the council can veto dangerous community proposals (or vice versa)`,
          },
          {
            id: "dao-3-3",
            title: "Building a Full DAO",
            type: "challenge",
            duration: "45m",
            completed: false,
            content: `## Challenge: Building a Full DAO

Build a complete DAO setup with a community token, council, treasury, and a working proposal flow. This capstone challenge integrates everything from the course.

### Objectives

1. Create a governance token and distribute it to mock community members
2. Set up a Realm with both community and council governance
3. Fund the treasury with SOL and USDC
4. Create, vote on, and execute a treasury spending proposal
5. Test that unauthorized actions are rejected`,
            starterCode: `import {
  Connection, Keypair, PublicKey, Transaction,
  sendAndConfirmTransaction, clusterApiUrl, LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { createMint, mintTo, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";

async function buildFullDAO(): Promise<{
  realm: string;
  treasury: string;
  communityMint: string;
  councilMint: string;
}> {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  // DAO participants
  const founder = Keypair.generate();
  const councilMember1 = Keypair.generate();
  const councilMember2 = Keypair.generate();
  const communityMember = Keypair.generate();

  // TODO: Airdrop SOL to all participants

  // 1. Create community governance token (6 decimals)
  // TODO: createMint and distribute:
  //   founder: 500,000 tokens
  //   communityMember: 100,000 tokens

  // 2. Create council token (0 decimals, non-transferable if using Token-2022)
  // TODO: createMint and distribute:
  //   founder: 1 token
  //   councilMember1: 1 token
  //   councilMember2: 1 token

  // 3. Create the Realm
  // TODO: Create realm with:
  //   name: "Academy DAO"
  //   community mint, council mint
  //   community threshold: 60%
  //   council threshold: 2-of-3

  // 4. Create governance and fund treasury
  // TODO: Create governance controlling a native treasury
  //   Transfer 5 SOL to treasury

  // 5. Create a proposal to send 1 SOL to a contributor
  // TODO: Full proposal lifecycle:
  //   createProposal -> insertTransaction -> signOff -> vote -> execute

  // 6. Verify the contributor received 1 SOL
  // TODO: Check balance

  return {
    realm: "realm_address",
    treasury: "treasury_address",
    communityMint: "community_mint",
    councilMint: "council_mint",
  };
}`,
            testCases: [
              {
                name: "Realm created with community + council",
                expected: "Both mints configured: true",
              },
              {
                name: "Treasury funded with 5 SOL",
                expected: "Treasury balance: 5 SOL",
              },
              {
                name: "Proposal executes treasury transfer",
                expected: "Contributor received: 1 SOL",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "solana-blinks",
    title: "Solana Blinks & Actions",
    description:
      "Build shareable blockchain interactions with Solana Actions and Blinks. Create one-click experiences that work anywhere — social media, messaging apps, and websites.",
    instructor: "Diego Reyes",
    instructorAvatar: "DR",
    difficulty: "Intermediate",
    duration: "6h 15m",
    lessons: 6,
    rating: 4.7,
    enrolled: 0,
    tags: ["Blinks", "Actions", "UX"],
    progress: 0,
    xp: 1200,
    thumbnail: "/blinks.jpg",
    modules: [
      {
        title: "Solana Actions",
        lessons: [
          {
            id: "bl-1-1",
            title: "Actions Protocol Overview",
            type: "reading",
            duration: "10m",
            completed: false,
            content: `## Actions Protocol Overview\n\nSolana Actions are specification-compliant APIs that return signable transactions from an HTTP endpoint. Any application can construct a URL that encodes an on-chain action, and any client that supports the Actions protocol can display it as a signable interaction.\n\n### How It Works\n\n1. A client fetches a GET request to the Action URL\n2. The server responds with metadata (title, icon, description, buttons)\n3. The user selects an option, triggering a POST request\n4. The server returns a serialized transaction for the user to sign`,
          },
          {
            id: "bl-1-2",
            title: "Building Your First Action",
            type: "video",
            duration: "18m",
            completed: false,
            content: `## Building Your First Action\n\nThis video walks through creating a Solana Action endpoint from scratch using Next.js API routes. You'll implement the GET handler for metadata and the POST handler that returns a serialized transaction.`,
          },
          {
            id: "bl-1-3",
            title: "Create a Tip Action",
            type: "challenge",
            duration: "25m",
            completed: false,
            content: `## Challenge: Create a Tip Action\n\nBuild a Solana Action that lets anyone tip a creator with SOL. The Action should display the creator's name and offer preset tip amounts.\n\n### Objectives\n\n1. Implement GET handler returning action metadata with 3 tip options\n2. Implement POST handler that builds a SOL transfer transaction\n3. Return the serialized transaction for signing`,
            starterCode: `import { ActionGetResponse, ActionPostRequest, ActionPostResponse } from "@solana/actions";\nimport { Connection, PublicKey, SystemProgram, Transaction, clusterApiUrl } from "@solana/web3.js";\n\nconst CREATOR_WALLET = "YOUR_WALLET_HERE";\n\n// GET handler - return action metadata\nexport async function GET(): Promise<ActionGetResponse> {\n  // TODO: Return { title, icon, description, label, links: { actions: [...] } }\n  throw new Error("Not implemented");\n}\n\n// POST handler - build and return transaction\nexport async function POST(req: ActionPostRequest): Promise<ActionPostResponse> {\n  // TODO: Parse account from request, build SOL transfer, serialize and return\n  throw new Error("Not implemented");\n}`,
            testCases: [
              {
                name: "GET returns valid metadata",
                expected: "title: Tip Creator",
              },
              {
                name: "POST returns serialized transaction",
                expected: "transaction: base64 string",
              },
              {
                name: "Transfer amount matches selection",
                expected: "amount: 0.1 SOL",
              },
            ],
          },
        ],
      },
      {
        title: "Blinks",
        lessons: [
          {
            id: "bl-2-1",
            title: "What Are Blinks?",
            type: "reading",
            duration: "8m",
            completed: false,
            content: `## What Are Blinks?\n\nBlinks (Blockchain Links) are URLs that unfurl into interactive Solana Action interfaces when shared on supporting platforms. They turn any link into a signable on-chain interaction — no dApp visit required.\n\n### The Blink Lifecycle\n\n1. User shares a Blink URL (e.g., on Twitter/X)\n2. The platform detects it as a Solana Action URL\n3. The platform renders a card with action metadata (title, image, buttons)\n4. Another user clicks a button directly in the feed\n5. Their wallet prompts them to sign the transaction\n6. The transaction is submitted to Solana`,
          },
          {
            id: "bl-2-2",
            title: "Blinks in Production",
            type: "video",
            duration: "15m",
            completed: false,
            content: `## Blinks in Production\n\nThis video covers deploying Blinks to production: registering your Action on the Dialect registry, configuring CORS and headers for cross-origin wallets, and testing across multiple platforms.`,
          },
          {
            id: "bl-2-3",
            title: "Build a Voting Blink",
            type: "challenge",
            duration: "30m",
            completed: false,
            content: `## Challenge: Build a Voting Blink\n\nCreate a Blink that lets users vote on a proposal directly from social media. The Action should display the proposal text and offer Yes/No vote buttons.\n\n### Objectives\n\n1. Implement Action metadata with proposal description and two vote buttons\n2. Build a transaction that writes the vote to an on-chain program\n3. Handle the actions.json manifest for Blink registration`,
            starterCode: `import { ActionGetResponse, ActionPostRequest } from "@solana/actions";\n\nconst PROPOSAL = {\n  id: "prop-001",\n  title: "Should we fund the community pool?",\n  options: ["Yes", "No"],\n};\n\nexport async function GET(): Promise<ActionGetResponse> {\n  // TODO: Return action metadata with vote buttons\n  throw new Error("Not implemented");\n}\n\nexport async function POST(req: ActionPostRequest & { option: string }) {\n  // TODO: Build vote transaction based on selected option\n  throw new Error("Not implemented");\n}`,
            testCases: [
              {
                name: "GET returns proposal metadata",
                expected: "title: Should we fund the community pool?",
              },
              {
                name: "Vote Yes builds correct instruction",
                expected: "vote: Yes",
              },
              {
                name: "Vote No builds correct instruction",
                expected: "vote: No",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "zk-compression",
    title: "ZK Compression on Solana",
    description:
      "Learn how ZK Compression dramatically reduces on-chain storage costs using zero-knowledge proofs. Build applications that scale to millions of accounts for pennies.",
    instructor: "Mert Mumtaz",
    instructorAvatar: "MM",
    difficulty: "Advanced",
    duration: "9h 45m",
    lessons: 6,
    rating: 4.8,
    enrolled: 0,
    tags: ["ZK", "Compression", "Light Protocol"],
    progress: 0,
    xp: 1800,
    thumbnail: "/zk-compression.jpg",
    modules: [
      {
        title: "Compression Fundamentals",
        lessons: [
          {
            id: "zk-1-1",
            title: "Why ZK Compression?",
            type: "reading",
            duration: "12m",
            completed: false,
            content: `## Why ZK Compression?\n\nOn Solana, every account costs rent — roughly 0.002 SOL for a basic account. For applications managing millions of user records, this becomes prohibitively expensive. ZK Compression solves this by storing account data in a compressed format validated by zero-knowledge proofs.\n\n### Cost Comparison\n\n| Accounts | Regular Cost | Compressed Cost | Savings |\n|----------|-------------|----------------|---------|\n| 1,000 | 2 SOL | 0.0005 SOL | 4,000x |\n| 1,000,000 | 2,000 SOL | 0.5 SOL | 4,000x |\n| 100,000,000 | 200,000 SOL | 50 SOL | 4,000x |`,
          },
          {
            id: "zk-1-2",
            title: "Light Protocol Architecture",
            type: "video",
            duration: "22m",
            completed: false,
            content: `## Light Protocol Architecture\n\nThis video dives into how Light Protocol implements ZK Compression on Solana. You'll learn about state trees, the Photon indexer, and how compressed accounts are created, read, and modified using validity proofs.`,
          },
          {
            id: "zk-1-3",
            title: "Create Compressed Accounts",
            type: "challenge",
            duration: "35m",
            completed: false,
            content: `## Challenge: Create Compressed Accounts\n\nUse the Light Protocol SDK to create compressed accounts that store user profile data at a fraction of the cost of regular accounts.\n\n### Objectives\n\n1. Initialize a state tree for compression\n2. Create a compressed account with user profile data\n3. Read the compressed account back using the Photon indexer`,
            starterCode: `import { Rpc, createRpc, LightSystemProgram } from "@lightprotocol/stateless.js";\nimport { Keypair } from "@solana/web3.js";\n\nasync function createCompressedProfile(payer: Keypair) {\n  const connection = createRpc();\n\n  // TODO: Create a compressed account with profile data\n  // { name: "Alice", level: 1, xp: 0 }\n\n  // TODO: Read the compressed account back\n\n  throw new Error("Not implemented");\n}`,
            testCases: [
              {
                name: "Compressed account created",
                expected: "Account exists: true",
              },
              {
                name: "Profile data is correct",
                expected: "name: Alice, level: 1",
              },
              {
                name: "Cost is under 0.001 SOL",
                expected: "Cost: < 0.001 SOL",
              },
            ],
          },
        ],
      },
      {
        title: "Building with Compression",
        lessons: [
          {
            id: "zk-2-1",
            title: "Compressed Token Accounts",
            type: "reading",
            duration: "10m",
            completed: false,
            content: `## Compressed Token Accounts\n\nZK Compression extends to SPL tokens. Instead of creating a regular token account per user, compressed token accounts store balances in the state tree. This enables airdropping tokens to millions of wallets for nearly zero cost.\n\n### How It Works\n\nA compressed token mint stores the mint authority and supply on-chain. Individual token balances exist as leaves in the state tree, validated by inclusion proofs when transfers occur.`,
          },
          {
            id: "zk-2-2",
            title: "Indexing Compressed State",
            type: "video",
            duration: "18m",
            completed: false,
            content: `## Indexing Compressed State\n\nThis video covers how the Photon indexer tracks compressed state. You'll learn how to query compressed accounts, subscribe to changes, and handle proof generation for transactions that modify compressed data.`,
          },
          {
            id: "zk-2-3",
            title: "Compressed Token Airdrop",
            type: "challenge",
            duration: "40m",
            completed: false,
            content: `## Challenge: Compressed Token Airdrop\n\nBuild an airdrop system that distributes tokens to 1,000 wallets using compressed token accounts.\n\n### Objectives\n\n1. Create a compressed token mint\n2. Airdrop tokens to a list of wallets using compressed transfers\n3. Verify recipients can query their compressed balances`,
            starterCode: `import { createRpc, LightSystemProgram } from "@lightprotocol/stateless.js";\nimport { createMint, mintTo, transfer } from "@lightprotocol/compressed-token";\nimport { Keypair, PublicKey } from "@solana/web3.js";\n\nconst RECIPIENTS = Array.from({ length: 1000 }, () => Keypair.generate().publicKey);\n\nasync function compressedAirdrop(payer: Keypair) {\n  const connection = createRpc();\n\n  // TODO: Create compressed token mint\n  // TODO: Mint tokens to payer\n  // TODO: Transfer tokens to all recipients\n\n  throw new Error("Not implemented");\n}`,
            testCases: [
              {
                name: "Mint created successfully",
                expected: "Mint: compressed",
              },
              {
                name: "All 1000 recipients received tokens",
                expected: "Recipients with balance: 1000",
              },
              {
                name: "Total cost under 1 SOL",
                expected: "Total cost: < 1 SOL",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "jupiter-integration",
    title: "Jupiter DEX Aggregation",
    description:
      "Integrate Jupiter — Solana's leading DEX aggregator — into your applications. Build swap UIs, implement limit orders, and leverage DCA strategies programmatically.",
    instructor: "Meow",
    instructorAvatar: "MW",
    difficulty: "Intermediate",
    duration: "7h 30m",
    lessons: 6,
    rating: 4.9,
    enrolled: 0,
    tags: ["DeFi", "Jupiter", "DEX"],
    progress: 0,
    xp: 1500,
    thumbnail: "/jupiter.jpg",
    modules: [
      {
        title: "Jupiter Swap API",
        lessons: [
          {
            id: "jup-1-1",
            title: "Jupiter Architecture",
            type: "reading",
            duration: "10m",
            completed: false,
            content: `## Jupiter Architecture\n\nJupiter aggregates liquidity across Solana DEXes (Raydium, Orca, Phoenix, Lifinity, and more) to find the best swap routes. It splits trades across multiple pools and uses multi-hop routing to minimize price impact.\n\n### Key Concepts\n\n- **Quote API**: Returns the best route and expected output for a given input\n- **Swap API**: Returns a serialized transaction for the best route\n- **Exact In vs Exact Out**: Choose whether input or output amount is fixed\n- **Slippage**: Maximum acceptable price deviation from the quote`,
          },
          {
            id: "jup-1-2",
            title: "Fetching Quotes & Swaps",
            type: "video",
            duration: "20m",
            completed: false,
            content: `## Fetching Quotes & Swaps\n\nThis video demonstrates how to use the Jupiter Quote API and Swap API to build a complete swap flow. You'll see how to handle token selection, quote fetching, slippage configuration, and transaction signing.`,
          },
          {
            id: "jup-1-3",
            title: "Build a Swap Interface",
            type: "challenge",
            duration: "30m",
            completed: false,
            content: `## Challenge: Build a Swap Interface\n\nBuild a minimal swap interface using the Jupiter API. Fetch a quote, display the route, and execute the swap.\n\n### Objectives\n\n1. Fetch a quote for SOL → USDC swap\n2. Display the route details (price impact, fees)\n3. Execute the swap transaction`,
            starterCode: `const JUPITER_API = "https://quote-api.jup.ag/v6";\n\nasync function getQuote(inputMint: string, outputMint: string, amount: number) {\n  // TODO: Fetch quote from Jupiter API\n  // GET /quote?inputMint=...&outputMint=...&amount=...\n  throw new Error("Not implemented");\n}\n\nasync function executeSwap(quoteResponse: any, userPublicKey: string) {\n  // TODO: POST to /swap with quoteResponse and userPublicKey\n  // Returns serialized transaction to sign\n  throw new Error("Not implemented");\n}`,
            testCases: [
              { name: "Quote returns valid route", expected: "outAmount > 0" },
              { name: "Price impact under 1%", expected: "priceImpact < 1%" },
              {
                name: "Swap transaction is valid",
                expected: "transaction: base64 string",
              },
            ],
          },
        ],
      },
      {
        title: "Advanced Jupiter Features",
        lessons: [
          {
            id: "jup-2-1",
            title: "Limit Orders & DCA",
            type: "reading",
            duration: "12m",
            completed: false,
            content: `## Limit Orders & DCA\n\nBeyond instant swaps, Jupiter offers limit orders and dollar-cost averaging (DCA) as on-chain programs.\n\n### Limit Orders\n\nLimit orders are placed on-chain and executed by Jupiter's keeper network when the market price reaches the target. They don't expire unless cancelled.\n\n### DCA (Dollar-Cost Averaging)\n\nJupiter DCA lets users set up recurring swaps on a schedule — e.g., swap 10 USDC to SOL every day for 30 days. The program holds funds in an escrow and executes swaps at each interval.`,
          },
          {
            id: "jup-2-2",
            title: "Jupiter Perpetuals & JLP",
            type: "video",
            duration: "15m",
            completed: false,
            content: `## Jupiter Perpetuals & JLP\n\nThis video covers Jupiter's perpetuals trading platform and the JLP (Jupiter Liquidity Provider) pool. You'll learn how the oracle-based pricing model works and how JLP holders earn fees from leveraged trading.`,
          },
          {
            id: "jup-2-3",
            title: "Build a DCA Bot",
            type: "challenge",
            duration: "35m",
            completed: false,
            content: `## Challenge: Build a DCA Bot\n\nCreate a DCA position using Jupiter's DCA program that automatically swaps USDC to SOL on a recurring schedule.\n\n### Objectives\n\n1. Create a DCA position with configured parameters\n2. Query active DCA positions for a wallet\n3. Close/cancel a DCA position`,
            starterCode: `import { Connection, PublicKey, Keypair } from "@solana/web3.js";\n\nconst DCA_PROGRAM = new PublicKey("DCA265Vj8a9CEuX1eb1LWRnDT7uK6q1xMipnNyatn23M");\n\nasync function createDCA(\n  payer: Keypair,\n  inputMint: PublicKey,\n  outputMint: PublicKey,\n  amountPerCycle: number,\n  cycleFrequency: number,\n  totalCycles: number\n) {\n  // TODO: Create DCA position\n  throw new Error("Not implemented");\n}`,
            testCases: [
              {
                name: "DCA position created",
                expected: "DCA account exists: true",
              },
              {
                name: "Cycle frequency is correct",
                expected: "frequency: 86400s",
              },
              {
                name: "DCA cancelled successfully",
                expected: "DCA closed: true",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "solana-gaming",
    title: "On-Chain Gaming with Solana",
    description:
      "Build fully on-chain games on Solana. Learn about game state management, randomness, matchmaking, and real-time multiplayer using clockwork automation.",
    instructor: "Brian Lee",
    instructorAvatar: "BL",
    difficulty: "Advanced",
    duration: "11h 00m",
    lessons: 6,
    rating: 4.6,
    enrolled: 0,
    tags: ["Gaming", "Clockwork", "NFT"],
    progress: 0,
    xp: 2100,
    thumbnail: "/gaming.jpg",
    modules: [
      {
        title: "Game State Design",
        lessons: [
          {
            id: "gm-1-1",
            title: "On-Chain Game Architecture",
            type: "reading",
            duration: "15m",
            completed: false,
            content: `## On-Chain Game Architecture\n\nOn-chain games store all game state in Solana accounts. Unlike traditional game servers, every action is a transaction, every state change is verifiable, and game assets are real tokens/NFTs owned by players.\n\n### Design Patterns\n\n- **Player Account**: PDA seeded by game + player wallet. Stores stats, inventory, position.\n- **Game Session**: PDA seeded by game + session ID. Stores turn state, participants, outcome.\n- **Global State**: Singleton PDA for leaderboards, matchmaking queues, configuration.`,
          },
          {
            id: "gm-1-2",
            title: "Randomness on Solana",
            type: "video",
            duration: "20m",
            completed: false,
            content: `## Randomness on Solana\n\nThis video covers how to implement verifiable randomness for on-chain games. You'll learn about Switchboard VRF, slot-hash based randomness, and commit-reveal schemes to prevent frontrunning.`,
          },
          {
            id: "gm-1-3",
            title: "Build a Coin Flip Game",
            type: "challenge",
            duration: "40m",
            completed: false,
            content: `## Challenge: Build a Coin Flip Game\n\nCreate a provably fair coin flip game where two players wager SOL. The outcome is determined by verifiable randomness.\n\n### Objectives\n\n1. Create a game session account with wager amount\n2. Allow a second player to join and match the wager\n3. Determine winner using commit-reveal randomness`,
            starterCode: `use anchor_lang::prelude::*;\n\n#[account]\npub struct GameSession {\n    pub player_one: Pubkey,\n    pub player_two: Option<Pubkey>,\n    pub wager: u64,\n    pub player_one_commitment: [u8; 32],\n    pub player_two_choice: Option<bool>,\n    pub state: GameState,\n    pub bump: u8,\n}\n\n#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]\npub enum GameState {\n    WaitingForOpponent,\n    WaitingForReveal,\n    Settled,\n}\n\n// TODO: Implement create_game, join_game, reveal_and_settle instructions`,
            testCases: [
              {
                name: "Game session created with wager",
                expected: "wager: 1 SOL",
              },
              {
                name: "Second player joins",
                expected: "state: WaitingForReveal",
              },
              {
                name: "Winner receives pot",
                expected: "winner balance increased by 2 SOL",
              },
            ],
          },
        ],
      },
      {
        title: "Multiplayer & Automation",
        lessons: [
          {
            id: "gm-2-1",
            title: "Matchmaking Systems",
            type: "reading",
            duration: "12m",
            completed: false,
            content: `## Matchmaking Systems\n\nOn-chain matchmaking uses queue accounts where players register intent to play. A crank or automation layer matches players based on criteria (skill rating, wager amount, game mode) and creates game sessions.\n\n### Queue Design\n\n- **FIFO Queue**: Simple first-come-first-served matching\n- **Elo-Based**: Match players within a skill range\n- **Wager Tiers**: Group players by bet amount`,
          },
          {
            id: "gm-2-2",
            title: "Clockwork Automation",
            type: "video",
            duration: "18m",
            completed: false,
            content: `## Clockwork Automation\n\nThis video covers using Clockwork threads to automate game actions — turn timeouts, matchmaking cranks, and reward distributions. You'll learn how to set up recurring and conditional triggers.`,
          },
          {
            id: "gm-2-3",
            title: "Build Turn-Based Combat",
            type: "challenge",
            duration: "45m",
            completed: false,
            content: `## Challenge: Build Turn-Based Combat\n\nCreate a turn-based combat system where players submit moves and damage is calculated on-chain. Include a turn timeout enforced by automation.\n\n### Objectives\n\n1. Design player and battle state accounts\n2. Implement attack/defend/heal move submissions\n3. Add turn timeout that forfeits inactive players`,
            starterCode: `use anchor_lang::prelude::*;\n\n#[account]\npub struct Battle {\n    pub player_one: Pubkey,\n    pub player_two: Pubkey,\n    pub hp_one: u16,\n    pub hp_two: u16,\n    pub current_turn: Pubkey,\n    pub last_move_slot: u64,\n    pub state: BattleState,\n}\n\n#[derive(AnchorSerialize, AnchorDeserialize, Clone)]\npub enum Move { Attack, Defend, Heal }\n\n#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]\npub enum BattleState { Active, Finished }\n\n// TODO: Implement submit_move and check_timeout instructions`,
            testCases: [
              {
                name: "Battle initialized with 100 HP each",
                expected: "hp_one: 100, hp_two: 100",
              },
              { name: "Attack reduces opponent HP", expected: "hp_two: 80" },
              {
                name: "Timeout forfeits inactive player",
                expected: "winner: player_one",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "helius-rpc-indexing",
    title: "Helius RPC & Indexing",
    description:
      "Master Helius APIs for building production Solana applications. Learn DAS API, webhooks, enhanced transactions, and real-time indexing patterns.",
    instructor: "Vibhu Norby",
    instructorAvatar: "VN",
    difficulty: "Intermediate",
    duration: "5h 45m",
    lessons: 6,
    rating: 4.8,
    enrolled: 0,
    tags: ["Helius", "RPC", "Indexing"],
    progress: 0,
    xp: 1200,
    thumbnail: "/helius.jpg",
    modules: [
      {
        title: "Helius APIs",
        lessons: [
          {
            id: "hel-1-1",
            title: "DAS API & Enhanced RPCs",
            type: "reading",
            duration: "10m",
            completed: false,
            content: `## DAS API & Enhanced RPCs\n\nThe Digital Asset Standard (DAS) API provides a unified interface for reading NFT data across regular, compressed, and programmable NFTs. Helius extends standard Solana RPCs with enhanced methods for parsing transactions, fetching token metadata, and searching assets.\n\n### Key Endpoints\n\n- **getAsset**: Fetch metadata for any NFT by ID\n- **getAssetsByOwner**: List all NFTs owned by a wallet\n- **searchAssets**: Search NFTs by collection, creator, or attributes\n- **getSignaturesForAsset**: Transaction history for an NFT`,
          },
          {
            id: "hel-1-2",
            title: "Enhanced Transactions",
            type: "video",
            duration: "15m",
            completed: false,
            content: `## Enhanced Transactions\n\nThis video covers Helius's enhanced transaction parsing. Instead of raw instruction data, you get human-readable transaction descriptions with token transfers, NFT sales, swaps, and program interactions already decoded.`,
          },
          {
            id: "hel-1-3",
            title: "Build an NFT Gallery",
            type: "challenge",
            duration: "25m",
            completed: false,
            content: `## Challenge: Build an NFT Gallery\n\nUse the DAS API to build an NFT gallery that displays all NFTs owned by a wallet, grouped by collection.\n\n### Objectives\n\n1. Fetch all assets for a wallet using getAssetsByOwner\n2. Group assets by collection\n3. Display metadata including name, image, and attributes`,
            starterCode: `const HELIUS_API = "https://mainnet.helius-rpc.com/?api-key=YOUR_KEY";\n\nasync function fetchNFTs(wallet: string) {\n  // TODO: Call DAS API getAssetsByOwner\n  // TODO: Group by collection\n  // TODO: Return structured gallery data\n  throw new Error("Not implemented");\n}`,
            testCases: [
              {
                name: "Fetches assets successfully",
                expected: "assets.length > 0",
              },
              {
                name: "Assets grouped by collection",
                expected: "collections: Map",
              },
              {
                name: "Metadata includes image URLs",
                expected: "image: https://...",
              },
            ],
          },
        ],
      },
      {
        title: "Webhooks & Real-Time",
        lessons: [
          {
            id: "hel-2-1",
            title: "Helius Webhooks",
            type: "reading",
            duration: "8m",
            completed: false,
            content: `## Helius Webhooks\n\nHelius webhooks push transaction data to your server in real-time. Instead of polling for changes, you register a webhook URL and specify which accounts or transaction types to watch.\n\n### Webhook Types\n\n- **Enhanced**: Parsed transaction data with human-readable descriptions\n- **Raw**: Raw transaction data for custom parsing\n- **Discord**: Formatted notifications sent directly to a Discord channel`,
          },
          {
            id: "hel-2-2",
            title: "Real-Time Event Processing",
            type: "video",
            duration: "18m",
            completed: false,
            content: `## Real-Time Event Processing\n\nThis video demonstrates building a real-time event processing pipeline with Helius webhooks. You'll see how to handle webhook payloads, process events asynchronously, and update your application state in response to on-chain changes.`,
          },
          {
            id: "hel-2-3",
            title: "Build a Transaction Monitor",
            type: "challenge",
            duration: "30m",
            completed: false,
            content: `## Challenge: Build a Transaction Monitor\n\nCreate a webhook endpoint that monitors a program's transactions and stores parsed events in a database.\n\n### Objectives\n\n1. Set up a Helius webhook for a program address\n2. Parse incoming webhook payloads\n3. Store events and trigger notifications`,
            starterCode: `import express from "express";\n\nconst app = express();\napp.use(express.json());\n\n// TODO: POST /webhook endpoint\n// Parse Helius enhanced transaction payload\n// Extract relevant events\n// Store in database\n\napp.post("/webhook", (req, res) => {\n  const transactions = req.body;\n  // TODO: Process transactions\n  res.status(200).send("OK");\n});\n\napp.listen(3000);`,
            testCases: [
              {
                name: "Webhook receives transactions",
                expected: "transactions.length > 0",
              },
              { name: "Events parsed correctly", expected: "event.type: SWAP" },
              {
                name: "Events stored in database",
                expected: "db.events.count > 0",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "metaplex-core",
    title: "Metaplex Core NFTs",
    description:
      "Build with Metaplex Core — the next-generation NFT standard on Solana. Single-account NFTs with plugins for royalties, freezing, attributes, and more.",
    instructor: "Stephen Hess",
    instructorAvatar: "SH",
    difficulty: "Intermediate",
    duration: "8h 00m",
    lessons: 6,
    rating: 4.7,
    enrolled: 0,
    tags: ["NFT", "Metaplex", "Core"],
    progress: 0,
    xp: 1500,
    thumbnail: "/metaplex-core.jpg",
    modules: [
      {
        title: "Core Standard",
        lessons: [
          {
            id: "mc-1-1",
            title: "Core vs Token Metadata",
            type: "reading",
            duration: "10m",
            completed: false,
            content: `## Core vs Token Metadata\n\nMetaplex Core is a new NFT standard that replaces the multi-account model (mint + metadata + master edition + token account) with a single account per NFT. This reduces minting costs by ~80% and simplifies the developer experience.\n\n### Key Differences\n\n| Feature | Token Metadata | Core |\n|---------|---------------|------|\n| Accounts per NFT | 4-5 | 1 |\n| Mint cost | ~0.012 SOL | ~0.003 SOL |\n| Extensibility | Limited | Plugin system |\n| Royalty enforcement | Creator choice | Built-in |\n| Collection management | Separate | Integrated |`,
          },
          {
            id: "mc-1-2",
            title: "The Plugin System",
            type: "video",
            duration: "20m",
            completed: false,
            content: `## The Plugin System\n\nThis video explores Core's plugin architecture. Plugins are modular extensions that add behavior to NFTs — royalties, freeze authority, burn delegates, attributes, and custom data. You'll see how to compose plugins at creation time and add them later.`,
          },
          {
            id: "mc-1-3",
            title: "Mint a Core NFT Collection",
            type: "challenge",
            duration: "30m",
            completed: false,
            content: `## Challenge: Mint a Core NFT Collection\n\nCreate a Core NFT collection and mint NFTs with plugins for royalties and on-chain attributes.\n\n### Objectives\n\n1. Create a collection with royalty plugin\n2. Mint an NFT into the collection with attributes plugin\n3. Update an attribute on the minted NFT`,
            starterCode: `import { createCollection, create, addPlugin } from "@metaplex-foundation/mpl-core";\nimport { createUmi } from "@metaplex-foundation/umi-bundle-defaults";\nimport { generateSigner, keypairIdentity } from "@metaplex-foundation/umi";\n\nasync function mintCoreNFT(payerSecret: Uint8Array) {\n  const umi = createUmi("https://api.devnet.solana.com");\n\n  // TODO: Create collection with royalty plugin (5%)\n  // TODO: Mint NFT with attributes plugin { level: "1", class: "warrior" }\n  // TODO: Update level attribute to "2"\n\n  throw new Error("Not implemented");\n}`,
            testCases: [
              {
                name: "Collection created",
                expected: "collection exists: true",
              },
              {
                name: "NFT minted with attributes",
                expected: "level: 1, class: warrior",
              },
              { name: "Attribute updated", expected: "level: 2" },
            ],
          },
        ],
      },
      {
        title: "Advanced Core Patterns",
        lessons: [
          {
            id: "mc-2-1",
            title: "Oracle & App Data Plugins",
            type: "reading",
            duration: "12m",
            completed: false,
            content: `## Oracle & App Data Plugins\n\nCore's oracle plugin enables external programs to validate or reject NFT lifecycle events (transfers, burns, updates). The app data plugin stores arbitrary program-specific data directly on the NFT account.\n\n### Use Cases\n\n- **Oracle Plugin**: Enforce transfer rules (KYC, cooldowns, game logic)\n- **App Data Plugin**: Store game stats, loyalty points, or provenance data on the NFT itself`,
          },
          {
            id: "mc-2-2",
            title: "Collections & Candy Machine",
            type: "video",
            duration: "18m",
            completed: false,
            content: `## Collections & Candy Machine\n\nThis video covers using Candy Machine v3 with Core NFTs. You'll learn about candy guards (allowlists, payment, limits), reveal mechanics, and collection-level management operations.`,
          },
          {
            id: "mc-2-3",
            title: "Build a Dynamic NFT",
            type: "challenge",
            duration: "35m",
            completed: false,
            content: `## Challenge: Build a Dynamic NFT\n\nCreate a dynamic NFT that evolves based on on-chain actions. Use the oracle plugin to control when evolution is allowed.\n\n### Objectives\n\n1. Mint a base NFT with initial attributes (stage: egg)\n2. Implement an oracle that validates evolution conditions\n3. Evolve the NFT through stages: egg → hatchling → adult`,
            starterCode: `import { create, updatePlugin } from "@metaplex-foundation/mpl-core";\nimport { createUmi } from "@metaplex-foundation/umi-bundle-defaults";\nimport { generateSigner } from "@metaplex-foundation/umi";\n\nconst STAGES = ["egg", "hatchling", "adult"];\n\nasync function evolveNFT(umi: any, nftAddress: string, currentStage: number) {\n  // TODO: Verify current stage from on-chain attributes\n  // TODO: Check oracle validation (e.g., time-based or action-based)\n  // TODO: Update attributes to next stage\n  // TODO: Update URI to new metadata\n\n  throw new Error("Not implemented");\n}`,
            testCases: [
              { name: "NFT starts at egg stage", expected: "stage: egg" },
              {
                name: "Evolution to hatchling succeeds",
                expected: "stage: hatchling",
              },
              {
                name: "Invalid evolution rejected by oracle",
                expected: "Error: Evolution not allowed",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "switchboard-oracles",
    title: "Switchboard Oracles",
    description:
      "Integrate real-world data feeds into your Solana programs using Switchboard. Build price feeds, VRF randomness, and custom data oracles for DeFi and gaming.",
    instructor: "Chris Marley",
    instructorAvatar: "CM",
    difficulty: "Advanced",
    duration: "8h 30m",
    lessons: 6,
    rating: 4.5,
    enrolled: 0,
    tags: ["Oracles", "DeFi", "Switchboard"],
    progress: 0,
    xp: 1800,
    thumbnail: "/switchboard.jpg",
    modules: [
      {
        title: "Oracle Fundamentals",
        lessons: [
          {
            id: "sw-1-1",
            title: "Oracle Design on Solana",
            type: "reading",
            duration: "12m",
            completed: false,
            content: `## Oracle Design on Solana\n\nOracles bridge off-chain data to on-chain programs. Switchboard is a decentralized oracle network where data feeds are maintained by a permissionless set of oracle operators.\n\n### Architecture\n\n- **Aggregator**: An account that defines what data to fetch, how many oracles to query, and how to reconcile responses\n- **Oracle Queue**: A pool of oracle operators that service data feed requests\n- **Crank**: Automation that periodically triggers oracle updates`,
          },
          {
            id: "sw-1-2",
            title: "Price Feeds Deep Dive",
            type: "video",
            duration: "18m",
            completed: false,
            content: `## Price Feeds Deep Dive\n\nThis video covers how Switchboard price feeds work end-to-end. You'll learn about aggregator configuration, oracle consensus, confidence intervals, and how to read feed data in your Solana program.`,
          },
          {
            id: "sw-1-3",
            title: "Read a Price Feed On-Chain",
            type: "challenge",
            duration: "30m",
            completed: false,
            content: `## Challenge: Read a Price Feed On-Chain\n\nBuild a Solana program that reads the SOL/USD price from a Switchboard aggregator and uses it to determine a dynamic fee.\n\n### Objectives\n\n1. Deserialize a Switchboard aggregator account\n2. Read the latest price result\n3. Calculate a fee based on the current SOL price`,
            starterCode: `use anchor_lang::prelude::*;\nuse switchboard_solana::AggregatorAccountData;\n\n#[program]\npub mod price_reader {\n    use super::*;\n\n    pub fn calculate_fee(ctx: Context<CalculateFee>) -> Result<()> {\n        let feed = &ctx.accounts.price_feed;\n        // TODO: Deserialize aggregator data\n        // TODO: Get latest result as f64\n        // TODO: Calculate fee = 1_000_000 / sol_price (lamports)\n        Ok(())\n    }\n}\n\n#[derive(Accounts)]\npub struct CalculateFee<'info> {\n    /// CHECK: Switchboard aggregator\n    pub price_feed: AccountInfo<'info>,\n}`,
            testCases: [
              { name: "Reads SOL/USD price", expected: "price > 0" },
              {
                name: "Fee calculated correctly",
                expected: "fee: dynamic lamports",
              },
              { name: "Stale feed rejected", expected: "Error: StaleData" },
            ],
          },
        ],
      },
      {
        title: "VRF & Custom Feeds",
        lessons: [
          {
            id: "sw-2-1",
            title: "Verifiable Random Functions",
            type: "reading",
            duration: "10m",
            completed: false,
            content: `## Verifiable Random Functions\n\nSwitchboard VRF provides provably fair randomness for on-chain applications. Unlike slot-hash randomness, VRF is unpredictable before generation and verifiable after — making it suitable for lotteries, gaming, and NFT reveals.\n\n### How VRF Works\n\n1. Your program requests randomness from a VRF account\n2. An oracle generates a random value using its private key\n3. The result includes a proof that anyone can verify\n4. Your program's callback receives the verified random bytes`,
          },
          {
            id: "sw-2-2",
            title: "Building Custom Data Feeds",
            type: "video",
            duration: "20m",
            completed: false,
            content: `## Building Custom Data Feeds\n\nThis video shows how to create custom Switchboard data feeds for any API. You'll write a job definition that specifies HTTP endpoints, JSON parsing, and mathematical operations to produce an on-chain value.`,
          },
          {
            id: "sw-2-3",
            title: "Build a Lottery with VRF",
            type: "challenge",
            duration: "40m",
            completed: false,
            content: `## Challenge: Build a Lottery with VRF\n\nCreate a lottery program that uses Switchboard VRF for provably fair winner selection.\n\n### Objectives\n\n1. Create a lottery pool that accepts ticket purchases\n2. Request randomness from Switchboard VRF\n3. Select a winner based on the VRF result and distribute the pot`,
            starterCode: `use anchor_lang::prelude::*;\n\n#[account]\npub struct Lottery {\n    pub authority: Pubkey,\n    pub ticket_price: u64,\n    pub participants: Vec<Pubkey>,\n    pub pot: u64,\n    pub winner: Option<Pubkey>,\n    pub vrf_account: Pubkey,\n    pub state: LotteryState,\n}\n\n#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]\npub enum LotteryState { Open, Drawing, Settled }\n\n// TODO: Implement buy_ticket, request_draw, settle_lottery instructions`,
            testCases: [
              {
                name: "Tickets purchased successfully",
                expected: "participants: 5",
              },
              { name: "VRF randomness requested", expected: "state: Drawing" },
              {
                name: "Winner selected and paid",
                expected: "winner received pot",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "token-gating",
    title: "Token Gating & Access Control",
    description:
      "Build token-gated applications on Solana. Implement NFT-based access control, membership tiers, subscription models, and permissioned content delivery.",
    instructor: "Priya Sharma",
    instructorAvatar: "PS",
    difficulty: "Beginner",
    duration: "5h 00m",
    lessons: 6,
    rating: 4.6,
    enrolled: 0,
    tags: ["Access Control", "NFT", "Membership"],
    progress: 0,
    xp: 1000,
    thumbnail: "/token-gating.jpg",
    modules: [
      {
        title: "Token Gating Basics",
        lessons: [
          {
            id: "tg-1-1",
            title: "Token Gating Patterns",
            type: "reading",
            duration: "8m",
            completed: false,
            content: `## Token Gating Patterns\n\nToken gating restricts access to resources based on token ownership. On Solana, this can use fungible tokens, NFTs, or compressed NFTs as access credentials.\n\n### Common Patterns\n\n- **Hold-to-Access**: User must hold an NFT from a specific collection\n- **Burn-to-Access**: User burns a token to gain one-time access\n- **Stake-to-Access**: User stakes tokens for ongoing access\n- **Tiered Access**: Different NFT traits unlock different content levels`,
          },
          {
            id: "tg-1-2",
            title: "Verifying Ownership",
            type: "video",
            duration: "15m",
            completed: false,
            content: `## Verifying Ownership\n\nThis video demonstrates multiple approaches to verifying token ownership: on-chain account checks, DAS API queries for compressed NFTs, and server-side verification using signed messages.`,
          },
          {
            id: "tg-1-3",
            title: "Build a Gated API",
            type: "challenge",
            duration: "25m",
            completed: false,
            content: `## Challenge: Build a Gated API\n\nCreate an API endpoint that verifies NFT ownership before returning protected data.\n\n### Objectives\n\n1. Accept a wallet signature for authentication\n2. Verify the wallet owns an NFT from the required collection\n3. Return gated content or 403 Forbidden`,
            starterCode: `import { Connection, PublicKey } from "@solana/web3.js";\nimport nacl from "tweetnacl";\n\nconst REQUIRED_COLLECTION = new PublicKey("YOUR_COLLECTION_ADDRESS");\n\nasync function verifyAccess(walletAddress: string, signature: string, message: string) {\n  // TODO: Verify the signature matches the wallet\n  // TODO: Check if wallet owns an NFT from REQUIRED_COLLECTION using DAS API\n  // TODO: Return { authorized: boolean, nft?: { name, image } }\n  throw new Error("Not implemented");\n}`,
            testCases: [
              {
                name: "Valid signature accepted",
                expected: "signature: valid",
              },
              {
                name: "NFT holder granted access",
                expected: "authorized: true",
              },
              { name: "Non-holder rejected", expected: "authorized: false" },
            ],
          },
        ],
      },
      {
        title: "Membership Systems",
        lessons: [
          {
            id: "tg-2-1",
            title: "Subscription NFTs",
            type: "reading",
            duration: "10m",
            completed: false,
            content: `## Subscription NFTs\n\nSubscription NFTs combine time-based access with token ownership. The NFT includes an expiration timestamp as an on-chain attribute. Access is granted only while the subscription is active.\n\n### Implementation\n\n- Mint NFT with expiry attribute (unix timestamp)\n- Renewal extends the expiry by paying the subscription fee\n- On-chain program validates current_time < expiry for access checks`,
          },
          {
            id: "tg-2-2",
            title: "Multi-Tier Memberships",
            type: "video",
            duration: "18m",
            completed: false,
            content: `## Multi-Tier Memberships\n\nThis video covers designing membership systems with bronze/silver/gold tiers. Each tier is a different NFT collection or trait, granting progressively more access. You'll see upgrade mechanics and tier-specific content delivery.`,
          },
          {
            id: "tg-2-3",
            title: "Build a Membership Program",
            type: "challenge",
            duration: "35m",
            completed: false,
            content: `## Challenge: Build a Membership Program\n\nCreate a membership program that mints subscription NFTs with expiration dates and supports renewals.\n\n### Objectives\n\n1. Mint a membership NFT with a 30-day expiry attribute\n2. Implement a renew instruction that extends the expiry\n3. Validate membership is active before granting access`,
            starterCode: `use anchor_lang::prelude::*;\n\n#[account]\npub struct Membership {\n    pub owner: Pubkey,\n    pub tier: MemberTier,\n    pub expires_at: i64,\n    pub mint: Pubkey,\n    pub bump: u8,\n}\n\n#[derive(AnchorSerialize, AnchorDeserialize, Clone)]\npub enum MemberTier { Bronze, Silver, Gold }\n\n// TODO: Implement mint_membership, renew_membership, check_access instructions`,
            testCases: [
              {
                name: "Membership minted with expiry",
                expected: "expires_at: +30 days",
              },
              {
                name: "Renewal extends by 30 days",
                expected: "expires_at: +60 days",
              },
              {
                name: "Expired membership rejected",
                expected: "Error: MembershipExpired",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "solana-testing-mastery",
    title: "Solana Testing Mastery",
    description:
      "Master testing Solana programs with Bankrun, Mollusk, and Trident. Write unit tests, integration tests, and fuzz tests for bulletproof smart contracts.",
    instructor: "Kevin Galler",
    instructorAvatar: "KG",
    difficulty: "Intermediate",
    duration: "7h 15m",
    lessons: 6,
    rating: 4.8,
    enrolled: 0,
    tags: ["Testing", "Security", "Rust"],
    progress: 0,
    xp: 1400,
    thumbnail: "/testing.jpg",
    modules: [
      {
        title: "Unit & Integration Tests",
        lessons: [
          {
            id: "tm-1-1",
            title: "Testing Frameworks Overview",
            type: "reading",
            duration: "10m",
            completed: false,
            content: `## Testing Frameworks Overview\n\nSolana has multiple testing approaches, each suited to different needs:\n\n- **Bankrun / LiteSVM**: Lightweight local validators for fast integration tests\n- **Mollusk**: Instruction-level unit testing without a full runtime\n- **Anchor Test (TS)**: TypeScript integration tests using the Anchor framework\n- **Trident**: Fuzz testing that generates random inputs to find edge cases\n\n### Choosing the Right Tool\n\n| Need | Tool |\n|------|------|\n| Fast instruction testing | Mollusk |\n| Full program flow testing | Bankrun / LiteSVM |\n| Client integration testing | Anchor TS tests |\n| Finding edge cases | Trident fuzzer |`,
          },
          {
            id: "tm-1-2",
            title: "Bankrun Deep Dive",
            type: "video",
            duration: "20m",
            completed: false,
            content: `## Bankrun Deep Dive\n\nThis video covers solana-bankrun for fast, deterministic testing. You'll learn how to set up a BanksClient, create accounts with specific state, warp slots/time, and assert on account data after transactions.`,
          },
          {
            id: "tm-1-3",
            title: "Test a Token Vault",
            type: "challenge",
            duration: "35m",
            completed: false,
            content: `## Challenge: Test a Token Vault\n\nWrite a comprehensive test suite for a token vault program that handles deposits, withdrawals, and access control.\n\n### Objectives\n\n1. Test successful deposit updates vault balance\n2. Test withdrawal respects authority check\n3. Test unauthorized withdrawal is rejected`,
            starterCode: `import { start } from "solana-bankrun";\nimport { PublicKey, Transaction, SystemProgram } from "@solana/web3.js";\n\ndescribe("Token Vault", () => {\n  it("should accept deposits", async () => {\n    const context = await start([], []);\n    const client = context.banksClient;\n    const payer = context.payer;\n\n    // TODO: Create vault account\n    // TODO: Send deposit transaction\n    // TODO: Assert vault balance increased\n  });\n\n  it("should reject unauthorized withdrawal", async () => {\n    // TODO: Attempt withdrawal with wrong authority\n    // TODO: Assert transaction fails\n  });\n});`,
            testCases: [
              { name: "Deposit test passes", expected: "vault balance: 1000" },
              {
                name: "Withdrawal test passes",
                expected: "authority balance: 1000",
              },
              {
                name: "Unauthorized withdrawal rejected",
                expected: "Error: Unauthorized",
              },
            ],
          },
        ],
      },
      {
        title: "Fuzz Testing",
        lessons: [
          {
            id: "tm-2-1",
            title: "Fuzz Testing Theory",
            type: "reading",
            duration: "8m",
            completed: false,
            content: `## Fuzz Testing Theory\n\nFuzz testing generates random inputs to your program to discover unexpected behaviors. For Solana programs, this means random account configurations, instruction data, and signer combinations.\n\n### What Fuzzers Find\n\n- Integer overflow/underflow\n- Missing account validation\n- Incorrect PDA seeds\n- State corruption from unexpected instruction ordering\n- Panics from unhandled edge cases`,
          },
          {
            id: "tm-2-2",
            title: "Trident Fuzzer Setup",
            type: "video",
            duration: "18m",
            completed: false,
            content: `## Trident Fuzzer Setup\n\nThis video walks through setting up Trident for fuzz testing an Anchor program. You'll configure fuzz targets, define account snapshots, and interpret crash reports to fix vulnerabilities.`,
          },
          {
            id: "tm-2-3",
            title: "Fuzz Test a Staking Program",
            type: "challenge",
            duration: "40m",
            completed: false,
            content: `## Challenge: Fuzz Test a Staking Program\n\nSet up Trident fuzz tests for a staking program to find edge cases in stake/unstake/claim reward flows.\n\n### Objectives\n\n1. Define fuzz test accounts and instructions for the staking program\n2. Write invariant checks (total staked == sum of user stakes)\n3. Run the fuzzer and fix any discovered issues`,
            starterCode: `use trident_client::fuzzing::*;\n\n// TODO: Define FuzzInstruction enum for Stake, Unstake, ClaimReward\n// TODO: Implement IxOps for each instruction variant\n// TODO: Define invariant: total_staked == sum(user_stakes)\n\n#[derive(Default)]\nstruct StakingFuzzData {\n    // TODO: Define fuzz accounts\n}\n\nimpl FuzzDataBuilder<StakingFuzzData> for StakingFuzzData {}`,
            testCases: [
              {
                name: "Fuzzer runs without panics",
                expected: "iterations: 10000",
              },
              {
                name: "Invariant holds across all paths",
                expected: "invariant: passed",
              },
              {
                name: "No arithmetic overflows found",
                expected: "overflows: 0",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "pyth-price-feeds",
    title: "Pyth Price Feeds for DeFi",
    description:
      "Integrate Pyth Network's high-frequency price feeds into DeFi protocols. Build liquidation engines, dynamic pricing, and cross-chain oracle consumers.",
    instructor: "Jayant Krishnamurthy",
    instructorAvatar: "JK",
    difficulty: "Advanced",
    duration: "6h 30m",
    lessons: 6,
    rating: 4.7,
    enrolled: 0,
    tags: ["Pyth", "Oracles", "DeFi"],
    progress: 0,
    xp: 1500,
    thumbnail: "/pyth.jpg",
    modules: [
      {
        title: "Pyth Fundamentals",
        lessons: [
          {
            id: "py-1-1",
            title: "Pyth Architecture",
            type: "reading",
            duration: "10m",
            completed: false,
            content: `## Pyth Architecture\n\nPyth Network delivers high-frequency price data from first-party sources (exchanges, market makers, trading firms). Unlike push-based oracles, Pyth uses a pull-based model where consumers fetch the latest price and submit it with their transaction.\n\n### Key Concepts\n\n- **Price Feed**: An account containing the current price, confidence interval, and EMA\n- **Price Update**: A signed VAA (Verified Action Approval) from Wormhole containing fresh prices\n- **Confidence Interval**: The uncertainty range around the price (e.g., SOL = $150 ± $0.10)\n- **TWAP/EMA**: Exponential moving average for smoothed pricing`,
          },
          {
            id: "py-1-2",
            title: "Pull-Based Oracle Model",
            type: "video",
            duration: "15m",
            completed: false,
            content: `## Pull-Based Oracle Model\n\nThis video explains Pyth's pull-based oracle design and why it offers advantages over push oracles for DeFi: sub-second updates, lower costs, and price data exactly when you need it.`,
          },
          {
            id: "py-1-3",
            title: "Read Pyth Prices On-Chain",
            type: "challenge",
            duration: "30m",
            completed: false,
            content: `## Challenge: Read Pyth Prices On-Chain\n\nBuild a Solana program that reads SOL/USD price from Pyth and uses it to calculate collateral requirements.\n\n### Objectives\n\n1. Fetch the latest Pyth price update off-chain\n2. Submit it with your transaction\n3. Read and validate the price in your program`,
            starterCode: `use anchor_lang::prelude::*;\nuse pyth_solana_receiver_sdk::price_update::PriceUpdateV2;\n\n#[program]\npub mod collateral_calc {\n    use super::*;\n\n    pub fn check_collateral(\n        ctx: Context<CheckCollateral>,\n        deposit_lamports: u64,\n    ) -> Result<()> {\n        let price_update = &ctx.accounts.price_feed;\n        // TODO: Get SOL/USD price from Pyth\n        // TODO: Calculate USD value of deposit\n        // TODO: Check if collateral meets minimum (e.g., $100)\n        Ok(())\n    }\n}\n\n#[derive(Accounts)]\npub struct CheckCollateral<'info> {\n    pub price_feed: Account<'info, PriceUpdateV2>,\n}`,
            testCases: [
              { name: "Reads SOL/USD price", expected: "price > 0" },
              {
                name: "Sufficient collateral accepted",
                expected: "collateral: sufficient",
              },
              {
                name: "Insufficient collateral rejected",
                expected: "Error: InsufficientCollateral",
              },
            ],
          },
        ],
      },
      {
        title: "DeFi Applications",
        lessons: [
          {
            id: "py-2-1",
            title: "Liquidation Engines",
            type: "reading",
            duration: "12m",
            completed: false,
            content: `## Liquidation Engines\n\nLiquidation engines monitor collateralized positions and trigger liquidations when the collateral ratio drops below a threshold. Pyth's high-frequency updates are essential for timely liquidations.\n\n### Design\n\n1. **Monitor**: Continuously check position health using Pyth prices\n2. **Trigger**: When health factor < 1.0, initiate liquidation\n3. **Execute**: Seize collateral, repay debt, pay liquidator bonus\n4. **Settle**: Update position state, emit events`,
          },
          {
            id: "py-2-2",
            title: "Confidence-Aware Pricing",
            type: "video",
            duration: "18m",
            completed: false,
            content: `## Confidence-Aware Pricing\n\nThis video shows how to use Pyth's confidence intervals for safer DeFi. You'll learn to use the lower bound for collateral valuation and the upper bound for debt valuation — protecting protocols during volatile markets.`,
          },
          {
            id: "py-2-3",
            title: "Build a Liquidation Bot",
            type: "challenge",
            duration: "35m",
            completed: false,
            content: `## Challenge: Build a Liquidation Bot\n\nCreate a bot that monitors lending positions and executes liquidations when positions become undercollateralized.\n\n### Objectives\n\n1. Fetch current Pyth prices for collateral and debt assets\n2. Calculate health factor for monitored positions\n3. Execute liquidation transaction when health < 1.0`,
            starterCode: `import { Connection, PublicKey } from "@solana/web3.js";\nimport { PythSolanaReceiver } from "@pythnetwork/pyth-solana-receiver";\n\ninterface Position {\n  owner: PublicKey;\n  collateralMint: PublicKey;\n  collateralAmount: number;\n  debtMint: PublicKey;\n  debtAmount: number;\n}\n\nasync function monitorPositions(positions: Position[]) {\n  // TODO: Fetch Pyth prices for all relevant mints\n  // TODO: Calculate health factor for each position\n  // TODO: Liquidate unhealthy positions\n  throw new Error("Not implemented");\n}`,
            testCases: [
              {
                name: "Healthy position not liquidated",
                expected: "health: 1.5 (safe)",
              },
              {
                name: "Undercollateralized position liquidated",
                expected: "health: 0.8 (liquidated)",
              },
              { name: "Liquidator receives bonus", expected: "bonus: 5%" },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "marinade-staking",
    title: "Marinade Finance & Liquid Staking",
    description:
      "Understand liquid staking on Solana through Marinade Finance. Learn how mSOL works, stake pool mechanics, and how to integrate liquid staking into DeFi protocols.",
    instructor: "Lucio Tato",
    instructorAvatar: "LT",
    difficulty: "Intermediate",
    duration: "7h 00m",
    lessons: 6,
    rating: 4.7,
    enrolled: 0,
    tags: ["DeFi", "Staking", "Marinade"],
    progress: 0,
    xp: 1400,
    thumbnail: "/defi.jpg",
    modules: [
      {
        title: "Liquid Staking Fundamentals",
        lessons: [
          {
            id: "ms-1-1",
            title: "What is Liquid Staking?",
            type: "reading",
            duration: "10m",
            completed: false,
            content: `## What is Liquid Staking?\n\nLiquid staking lets you stake SOL and receive a liquid derivative token (mSOL) that accrues staking rewards while remaining usable in DeFi. Unlike native staking, your capital isn't locked.\n\n### How Marinade Works\n\n- **Stake Pool**: Aggregates SOL from depositors and delegates to hundreds of validators\n- **mSOL**: A receipt token whose value appreciates relative to SOL as staking rewards accumulate\n- **Instant Unstake**: Swap mSOL → SOL via liquidity pools without waiting for epoch boundaries\n- **Directed Stake**: Users can direct their stake to specific validators while still receiving mSOL`,
          },
          {
            id: "ms-1-2",
            title: "mSOL Price Mechanics",
            type: "video",
            duration: "15m",
            completed: false,
            content: `## mSOL Price Mechanics\n\nThis video explains how mSOL's exchange rate works, why it continuously appreciates against SOL, and how the stake pool contract tracks validator performance and rewards distribution.`,
          },
          {
            id: "ms-1-3",
            title: "Integrate Marinade Staking",
            type: "challenge",
            duration: "30m",
            completed: false,
            content: `## Challenge: Integrate Marinade Staking\n\nBuild a client that deposits SOL into Marinade and tracks the mSOL balance over time.\n\n### Objectives\n\n1. Deposit SOL into Marinade stake pool\n2. Verify mSOL receipt token balance\n3. Calculate the effective APY from the exchange rate`,
            starterCode: `import { Connection, PublicKey, Keypair } from "@solana/web3.js";\n\nconst MARINADE_PROGRAM = new PublicKey("MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD");\n\nasync function depositToMarinade(connection: Connection, payer: Keypair, lamports: number) {\n  // TODO: Create deposit instruction to Marinade stake pool\n  // TODO: Send transaction and confirm\n  // TODO: Return mSOL balance after deposit\n  throw new Error("Not implemented");\n}\n\nasync function calculateAPY(connection: Connection) {\n  // TODO: Fetch current mSOL/SOL exchange rate\n  // TODO: Compare with rate from 1 epoch ago\n  // TODO: Annualize the rate difference\n  throw new Error("Not implemented");\n}`,
            testCases: [
              {
                name: "SOL deposited successfully",
                expected: "mSOL balance > 0",
              },
              { name: "Exchange rate fetched", expected: "rate > 1.0" },
              { name: "APY calculated", expected: "apy: ~7%" },
            ],
          },
        ],
      },
      {
        title: "DeFi Composability",
        lessons: [
          {
            id: "ms-2-1",
            title: "mSOL in DeFi Protocols",
            type: "reading",
            duration: "10m",
            completed: false,
            content: `## mSOL in DeFi Protocols\n\nmSOL can be used as collateral in lending protocols, paired in AMM pools, or leveraged for yield farming — all while earning staking rewards underneath.\n\n### Composability Patterns\n\n- **Lending**: Supply mSOL as collateral on Solend/Kamino for borrowing\n- **LP**: Provide mSOL/SOL liquidity for near-zero impermanent loss\n- **Leverage**: Borrow SOL against mSOL, restake for leveraged yield`,
          },
          {
            id: "ms-2-2",
            title: "Building on Stake Pools",
            type: "video",
            duration: "18m",
            completed: false,
            content: `## Building on Stake Pools\n\nThis video covers how to build DeFi products on top of Marinade's stake pool — reading pool state, calculating exchange rates programmatically, and integrating deposits/withdrawals into your own protocol.`,
          },
          {
            id: "ms-2-3",
            title: "Build a Yield Aggregator",
            type: "challenge",
            duration: "35m",
            completed: false,
            content: `## Challenge: Build a Yield Aggregator\n\nCreate a program that stakes SOL via Marinade and then supplies the mSOL to a lending protocol for compound yield.\n\n### Objectives\n\n1. Deposit SOL → receive mSOL from Marinade\n2. Supply mSOL to a lending protocol\n3. Calculate the combined yield (staking + lending)`,
            starterCode: `import { Connection, Keypair, PublicKey } from "@solana/web3.js";\n\nasync function aggregateYield(connection: Connection, payer: Keypair, solAmount: number) {\n  // TODO: Deposit SOL into Marinade → get mSOL\n  // TODO: Supply mSOL to lending protocol\n  // TODO: Return combined APY\n  throw new Error("Not implemented");\n}`,
            testCases: [
              {
                name: "SOL staked via Marinade",
                expected: "mSOL received: true",
              },
              {
                name: "mSOL supplied to lending",
                expected: "position: active",
              },
              {
                name: "Combined yield calculated",
                expected: "combined apy > staking apy",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "openbook-dex",
    title: "OpenBook & On-Chain Order Books",
    description:
      "Master on-chain order book trading with OpenBook. Build market makers, order management systems, and trading bots on Solana's premier CLOB.",
    instructor: "Max Schneider",
    instructorAvatar: "MS",
    difficulty: "Advanced",
    duration: "9h 00m",
    lessons: 6,
    rating: 4.6,
    enrolled: 0,
    tags: ["DeFi", "Trading", "OpenBook"],
    progress: 0,
    xp: 1800,
    thumbnail: "/defi.jpg",
    modules: [
      {
        title: "Order Book Architecture",
        lessons: [
          {
            id: "ob-1-1",
            title: "CLOB Design on Solana",
            type: "reading",
            duration: "12m",
            completed: false,
            content: `## CLOB Design on Solana\n\nOpenBook implements a Central Limit Order Book (CLOB) entirely on-chain. Every bid and ask is stored in a Slab data structure — a critbit tree optimized for fast insertion, cancellation, and matching.\n\n### Key Components\n\n- **Market**: Configuration account with base/quote mints, lot sizes, and fee tiers\n- **Bids/Asks**: Slab accounts containing all open orders sorted by price-time priority\n- **Event Queue**: Stores fill and out events for asynchronous settlement\n- **Open Orders**: Per-user account tracking unsettled balances`,
          },
          {
            id: "ob-1-2",
            title: "Order Lifecycle",
            type: "video",
            duration: "20m",
            completed: false,
            content: `## Order Lifecycle\n\nThis video walks through the complete lifecycle of an order: placement, matching against the opposite side, partial fills, the event queue, and settlement. You'll see how the critbit tree enables O(log n) operations.`,
          },
          {
            id: "ob-1-3",
            title: "Place and Cancel Orders",
            type: "challenge",
            duration: "35m",
            completed: false,
            content: `## Challenge: Place and Cancel Orders\n\nBuild a client that places limit orders on an OpenBook market and cancels unfilled orders.\n\n### Objectives\n\n1. Create an open orders account\n2. Place a limit bid order\n3. Cancel the order and settle funds back to wallet`,
            starterCode: `import { Connection, Keypair, PublicKey } from "@solana/web3.js";\nimport { Market } from "@openbook-dex/openbook-v2";\n\nasync function placeLimitOrder(\n  connection: Connection,\n  payer: Keypair,\n  marketAddress: PublicKey,\n  side: "buy" | "sell",\n  price: number,\n  size: number\n) {\n  // TODO: Load market\n  // TODO: Create open orders account if needed\n  // TODO: Place limit order\n  // TODO: Return order ID\n  throw new Error("Not implemented");\n}\n\nasync function cancelOrder(connection: Connection, payer: Keypair, orderId: bigint) {\n  // TODO: Cancel order by ID\n  // TODO: Settle funds\n  throw new Error("Not implemented");\n}`,
            testCases: [
              {
                name: "Open orders account created",
                expected: "account exists: true",
              },
              { name: "Limit order placed", expected: "order id > 0" },
              {
                name: "Order cancelled and settled",
                expected: "funds returned: true",
              },
            ],
          },
        ],
      },
      {
        title: "Market Making",
        lessons: [
          {
            id: "ob-2-1",
            title: "Market Making Strategies",
            type: "reading",
            duration: "10m",
            completed: false,
            content: `## Market Making Strategies\n\nMarket makers provide liquidity by continuously quoting bid and ask prices. On OpenBook, this means maintaining a spread of limit orders and refreshing them as the market moves.\n\n### Key Concepts\n\n- **Spread**: The difference between best bid and best ask\n- **Inventory Risk**: Accumulating too much of one asset\n- **Quote Refresh**: Cancelling stale orders and placing new ones at updated prices\n- **Latency**: Solana's ~400ms block time enables competitive market making`,
          },
          {
            id: "ob-2-2",
            title: "Building a Market Maker",
            type: "video",
            duration: "22m",
            completed: false,
            content: `## Building a Market Maker\n\nThis video demonstrates building a basic market maker that reads the order book state, calculates fair value, places symmetric bid/ask orders, and manages inventory.`,
          },
          {
            id: "ob-2-3",
            title: "Build a Simple Market Maker",
            type: "challenge",
            duration: "40m",
            completed: false,
            content: `## Challenge: Build a Simple Market Maker\n\nCreate a market making bot that maintains two-sided quotes on an OpenBook market.\n\n### Objectives\n\n1. Read current order book state (best bid/ask)\n2. Place symmetric orders around mid price with configurable spread\n3. Refresh quotes when price moves beyond threshold`,
            starterCode: `import { Connection, Keypair, PublicKey } from "@solana/web3.js";\n\ninterface MMConfig {\n  spread: number;\n  orderSize: number;\n  refreshThreshold: number;\n}\n\nasync function runMarketMaker(\n  connection: Connection,\n  payer: Keypair,\n  market: PublicKey,\n  config: MMConfig\n) {\n  // TODO: Load order book\n  // TODO: Calculate mid price\n  // TODO: Place bid at mid - spread/2, ask at mid + spread/2\n  // TODO: Monitor and refresh when price moves\n  throw new Error("Not implemented");\n}`,
            testCases: [
              { name: "Two-sided quotes placed", expected: "bids: 1, asks: 1" },
              { name: "Spread maintained correctly", expected: "spread: 0.1%" },
              {
                name: "Quotes refreshed on price move",
                expected: "refreshed: true",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "clockwork-automation",
    title: "On-Chain Automation with Clockwork",
    description:
      "Automate on-chain tasks with Clockwork threads. Schedule recurring transactions, build keeper networks, and create self-sustaining protocols on Solana.",
    instructor: "Nick Garfield",
    instructorAvatar: "NG",
    difficulty: "Intermediate",
    duration: "6h 30m",
    lessons: 6,
    rating: 4.5,
    enrolled: 0,
    tags: ["Automation", "Infrastructure", "Clockwork"],
    progress: 0,
    xp: 1400,
    thumbnail: "/anchor.jpg",
    modules: [
      {
        title: "Clockwork Fundamentals",
        lessons: [
          {
            id: "cw-1-1",
            title: "On-Chain Automation Patterns",
            type: "reading",
            duration: "10m",
            completed: false,
            content: `## On-Chain Automation Patterns\n\nBlockchains don't have cron jobs. Clockwork solves this by providing a decentralized thread network that executes transactions on a schedule or in response to triggers.\n\n### Thread Types\n\n- **Cron Threads**: Execute on a cron schedule (e.g., every hour, daily at UTC midnight)\n- **Account Trigger**: Execute when a specific account's data changes\n- **Immediate**: Execute as soon as possible, repeating until stopped\n\n### Why On-Chain Automation?\n\n- No centralized keeper infrastructure to maintain\n- Automated liquidations, reward distributions, oracle updates\n- Self-sustaining protocols that don't depend on off-chain bots`,
          },
          {
            id: "cw-1-2",
            title: "Thread Architecture",
            type: "video",
            duration: "18m",
            completed: false,
            content: `## Thread Architecture\n\nThis video explains Clockwork's architecture: thread accounts, the worker network, trigger conditions, and how threads pay for their own execution using pre-funded SOL balances.`,
          },
          {
            id: "cw-1-3",
            title: "Create a Scheduled Thread",
            type: "challenge",
            duration: "30m",
            completed: false,
            content: `## Challenge: Create a Scheduled Thread\n\nBuild a Clockwork thread that executes a counter increment every minute.\n\n### Objectives\n\n1. Deploy a simple counter program\n2. Create a Clockwork thread with a cron trigger\n3. Verify the counter increments automatically`,
            starterCode: `use anchor_lang::prelude::*;\nuse clockwork_sdk::state::Thread;\n\n#[account]\npub struct Counter {\n    pub authority: Pubkey,\n    pub count: u64,\n    pub last_update: i64,\n}\n\n// TODO: Implement initialize (create counter + thread)\n// TODO: Implement increment (called by Clockwork thread)\n// TODO: Thread trigger: cron "*/60 * * * * * *"`,
            testCases: [
              { name: "Counter initialized", expected: "count: 0" },
              {
                name: "Thread created with cron trigger",
                expected: "trigger: cron",
              },
              { name: "Counter incremented by thread", expected: "count: 1" },
            ],
          },
        ],
      },
      {
        title: "Advanced Automation",
        lessons: [
          {
            id: "cw-2-1",
            title: "Account-Triggered Automation",
            type: "reading",
            duration: "10m",
            completed: false,
            content: `## Account-Triggered Automation\n\nAccount triggers execute when data at a specific account address changes. This enables reactive automation — liquidate when a position becomes unhealthy, distribute rewards when a pool reaches a threshold.\n\n### Implementation\n\n- Specify the account to watch and the byte offset/size for comparison\n- The thread fires when the monitored bytes change\n- Combine with instruction data to pass context to your handler`,
          },
          {
            id: "cw-2-2",
            title: "Self-Paying Protocols",
            type: "video",
            duration: "20m",
            completed: false,
            content: `## Self-Paying Protocols\n\nThis video demonstrates how to build protocols that fund their own automation. Threads are pre-funded with SOL, and you'll learn strategies for sustainable funding: protocol fees, user deposits, and treasury management.`,
          },
          {
            id: "cw-2-3",
            title: "Build an Auto-Compounder",
            type: "challenge",
            duration: "35m",
            completed: false,
            content: `## Challenge: Build an Auto-Compounder\n\nCreate a protocol that automatically compounds LP rewards every hour using a Clockwork thread.\n\n### Objectives\n\n1. Claim pending LP rewards\n2. Swap rewards back to LP tokens\n3. Re-deposit into the pool, all triggered by Clockwork`,
            starterCode: `use anchor_lang::prelude::*;\nuse clockwork_sdk::state::Thread;\n\n#[account]\npub struct Vault {\n    pub authority: Pubkey,\n    pub lp_mint: Pubkey,\n    pub reward_mint: Pubkey,\n    pub total_deposited: u64,\n    pub last_compound: i64,\n    pub bump: u8,\n}\n\n// TODO: Implement compound instruction\n// 1. Claim rewards from LP pool\n// 2. Swap rewards to LP tokens\n// 3. Re-deposit LP tokens\n// Called by Clockwork thread on hourly cron schedule`,
            testCases: [
              { name: "Rewards claimed", expected: "rewards > 0" },
              {
                name: "Rewards swapped to LP",
                expected: "lp tokens received: true",
              },
              {
                name: "LP re-deposited",
                expected: "total_deposited increased: true",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "wormhole-bridging",
    title: "Cross-Chain Bridging with Wormhole",
    description:
      "Build cross-chain applications using Wormhole. Bridge tokens between Solana and EVM chains, verify cross-chain messages, and design multi-chain architectures.",
    instructor: "Robinson Burkey",
    instructorAvatar: "RB",
    difficulty: "Advanced",
    duration: "10h 00m",
    lessons: 6,
    rating: 4.6,
    enrolled: 0,
    tags: ["Cross-Chain", "Wormhole", "Bridging"],
    progress: 0,
    xp: 2000,
    thumbnail: "/solana.jpg",
    modules: [
      {
        title: "Wormhole Protocol",
        lessons: [
          {
            id: "wh-1-1",
            title: "Cross-Chain Messaging",
            type: "reading",
            duration: "12m",
            completed: false,
            content: `## Cross-Chain Messaging\n\nWormhole is a generic message-passing protocol. Guardian nodes observe messages emitted on one chain and produce a Verified Action Approval (VAA) — a signed attestation that can be verified on any connected chain.\n\n### Architecture\n\n- **Core Bridge**: Emits and verifies messages (VAAs)\n- **Token Bridge**: Wraps/unwraps tokens across chains using lock-and-mint\n- **Guardians**: 19 validator nodes that sign VAAs with supermajority (13/19)\n- **Relayers**: Off-chain services that deliver VAAs to destination chains`,
          },
          {
            id: "wh-1-2",
            title: "VAA Verification Flow",
            type: "video",
            duration: "20m",
            completed: false,
            content: `## VAA Verification Flow\n\nThis video traces a cross-chain message from emission through guardian observation, signing, and verification on the destination chain. You'll understand the security model and trust assumptions.`,
          },
          {
            id: "wh-1-3",
            title: "Verify a Cross-Chain Message",
            type: "challenge",
            duration: "35m",
            completed: false,
            content: `## Challenge: Verify a Cross-Chain Message\n\nBuild a Solana program that receives and verifies a Wormhole VAA to process a cross-chain instruction.\n\n### Objectives\n\n1. Post a VAA to Solana's Wormhole core bridge\n2. Verify the VAA signatures and parse the payload\n3. Execute an action based on the cross-chain message`,
            starterCode: `use anchor_lang::prelude::*;\n\n#[account]\npub struct CrossChainMessage {\n    pub source_chain: u16,\n    pub source_address: [u8; 32],\n    pub payload: Vec<u8>,\n    pub verified: bool,\n    pub bump: u8,\n}\n\n// TODO: Implement receive_message instruction\n// 1. Verify VAA via Wormhole core bridge CPI\n// 2. Parse emitter chain and address\n// 3. Deserialize payload and store message`,
            testCases: [
              { name: "VAA verified successfully", expected: "verified: true" },
              {
                name: "Source chain parsed",
                expected: "source_chain: 2 (Ethereum)",
              },
              { name: "Invalid VAA rejected", expected: "Error: InvalidVAA" },
            ],
          },
        ],
      },
      {
        title: "Token Bridging",
        lessons: [
          {
            id: "wh-2-1",
            title: "Lock-and-Mint Architecture",
            type: "reading",
            duration: "10m",
            completed: false,
            content: `## Lock-and-Mint Architecture\n\nWormhole's token bridge locks tokens on the source chain and mints wrapped versions on the destination. When bridging back, wrapped tokens are burned and originals are released.\n\n### Flow\n\n1. User locks ETH on Ethereum token bridge contract\n2. Guardians observe and sign a transfer VAA\n3. VAA is submitted to Solana token bridge program\n4. Wrapped wETH is minted to user's Solana wallet`,
          },
          {
            id: "wh-2-2",
            title: "Bridging Tokens in Practice",
            type: "video",
            duration: "22m",
            completed: false,
            content: `## Bridging Tokens in Practice\n\nThis video demonstrates bridging tokens end-to-end: initiating a transfer on Ethereum, waiting for guardian signatures, redeeming on Solana, and bridging back. Includes handling of wrapped token metadata.`,
          },
          {
            id: "wh-2-3",
            title: "Build a Bridge Integration",
            type: "challenge",
            duration: "40m",
            completed: false,
            content: `## Challenge: Build a Bridge Integration\n\nCreate a client that bridges USDC from Ethereum to Solana using Wormhole's token bridge.\n\n### Objectives\n\n1. Initiate a token transfer on the source chain\n2. Fetch the signed VAA from the Wormhole guardian network\n3. Redeem the transfer on Solana`,
            starterCode: `import { Connection, PublicKey, Keypair } from "@solana/web3.js";\n\ninterface BridgeTransfer {\n  sourceChain: number;\n  amount: bigint;\n  recipient: PublicKey;\n  vaaBytes?: Uint8Array;\n}\n\nasync function bridgeToSolana(transfer: BridgeTransfer) {\n  // TODO: Fetch signed VAA from Wormhole API\n  // TODO: Post VAA to Solana core bridge\n  // TODO: Redeem transfer via token bridge\n  // TODO: Return wrapped token mint and balance\n  throw new Error("Not implemented");\n}`,
            testCases: [
              {
                name: "VAA fetched from guardians",
                expected: "vaa.length > 0",
              },
              { name: "Transfer redeemed on Solana", expected: "balance > 0" },
              {
                name: "Wrapped mint matches expected",
                expected: "mint: correct",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "solana-program-security",
    title: "Solana Program Security Auditing",
    description:
      "Learn to identify and exploit common vulnerabilities in Solana programs. Master security auditing techniques used by top firms to protect DeFi protocols.",
    instructor: "Neodyme Labs",
    instructorAvatar: "NL",
    difficulty: "Advanced",
    duration: "10h 00m",
    lessons: 6,
    rating: 4.9,
    enrolled: 0,
    tags: ["Security", "Auditing", "Rust"],
    progress: 0,
    xp: 2000,
    thumbnail: "/security.jpg",
    modules: [
      {
        title: "Common Vulnerabilities",
        lessons: [
          {
            id: "sa-1-1",
            title: "Solana Vulnerability Taxonomy",
            type: "reading",
            duration: "15m",
            completed: false,
            content: `## Solana Vulnerability Taxonomy\n\nSolana programs face unique security challenges due to the account model. Understanding common vulnerability classes is essential for both builders and auditors.\n\n### Critical Vulnerabilities\n\n- **Missing Signer Check**: Failing to verify instruction signers allows anyone to execute privileged operations\n- **Missing Owner Check**: Not validating account ownership lets attackers pass fake accounts\n- **Integer Overflow**: Unchecked arithmetic can wrap around, enabling theft\n- **PDA Substitution**: Accepting arbitrary accounts where a PDA is expected\n- **Reinitialization**: Allowing account re-initialization overwrites existing state\n- **Closing Account Draining**: Improper account closing leaves lamports accessible`,
          },
          {
            id: "sa-1-2",
            title: "Exploit Walkthroughs",
            type: "video",
            duration: "25m",
            completed: false,
            content: `## Exploit Walkthroughs\n\nThis video walks through real-world exploits on Solana: the Wormhole bridge exploit, Cashio infinite mint, and Mango Markets oracle manipulation. You'll see the vulnerable code, the attack transactions, and the fixes.`,
          },
          {
            id: "sa-1-3",
            title: "Find the Vulnerability",
            type: "challenge",
            duration: "30m",
            completed: false,
            content: `## Challenge: Find the Vulnerability\n\nAudit a vulnerable token vault program and identify the security issues.\n\n### Objectives\n\n1. Identify the missing signer check in the withdraw function\n2. Find the integer overflow in the deposit calculation\n3. Exploit the vulnerability in a test to prove impact`,
            starterCode: `use anchor_lang::prelude::*;\n\n#[program]\npub mod vulnerable_vault {\n    use super::*;\n\n    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {\n        let vault = &mut ctx.accounts.vault;\n        vault.total_deposits = vault.total_deposits + amount; // Bug: unchecked add\n        Ok(())\n    }\n\n    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {\n        // Bug: no signer check on authority\n        let vault = &mut ctx.accounts.vault;\n        vault.total_deposits -= amount;\n        Ok(())\n    }\n}\n\n// TODO: Identify all vulnerabilities\n// TODO: Write exploit test\n// TODO: Fix each vulnerability`,
            testCases: [
              {
                name: "Missing signer check identified",
                expected: "vulnerability: signer",
              },
              {
                name: "Integer overflow identified",
                expected: "vulnerability: overflow",
              },
              {
                name: "Exploit test demonstrates impact",
                expected: "unauthorized withdrawal: true",
              },
            ],
          },
        ],
      },
      {
        title: "Auditing Methodology",
        lessons: [
          {
            id: "sa-2-1",
            title: "Systematic Audit Process",
            type: "reading",
            duration: "12m",
            completed: false,
            content: `## Systematic Audit Process\n\nA structured audit process ensures no vulnerability class is missed. Professional auditors follow a checklist-driven approach combined with creative attack exploration.\n\n### Audit Phases\n\n1. **Scoping**: Understand program architecture, trust assumptions, and admin powers\n2. **Static Analysis**: Review all instructions for missing checks using a vulnerability checklist\n3. **Dynamic Testing**: Write exploit PoCs for suspected issues\n4. **Economic Analysis**: Model token flows and invariants\n5. **Reporting**: Document findings with severity, impact, and remediation`,
          },
          {
            id: "sa-2-2",
            title: "Using Audit Tools",
            type: "video",
            duration: "20m",
            completed: false,
            content: `## Using Audit Tools\n\nThis video covers the auditor's toolkit: cargo-audit for dependency vulnerabilities, Trident for fuzz testing, Soteria for static analysis, and manual techniques for reviewing CPI targets and PDA derivations.`,
          },
          {
            id: "sa-2-3",
            title: "Audit a Lending Protocol",
            type: "challenge",
            duration: "45m",
            completed: false,
            content: `## Challenge: Audit a Lending Protocol\n\nPerform a security audit on a simplified lending protocol. Find all vulnerabilities and write a report.\n\n### Objectives\n\n1. Review the deposit, borrow, and liquidate instructions\n2. Identify at least 3 security issues\n3. Write remediation recommendations for each finding`,
            starterCode: `// Audit target: SimpleLend protocol\n// Instructions: deposit, borrow, repay, liquidate\n// Known accounts: LendingPool, UserPosition, OracleFeed\n\n// Your audit report format:\ninterface AuditFinding {\n  severity: "Critical" | "High" | "Medium" | "Low";\n  title: string;\n  description: string;\n  location: string;\n  remediation: string;\n}\n\nfunction auditSimpleLend(): AuditFinding[] {\n  // TODO: Review each instruction\n  // TODO: Check for missing validations\n  // TODO: Analyze economic invariants\n  // TODO: Return findings array\n  return [];\n}`,
            testCases: [
              {
                name: "Critical finding identified",
                expected: "severity: Critical",
              },
              { name: "At least 3 findings", expected: "findings.length >= 3" },
              {
                name: "Remediation provided",
                expected: "remediation: non-empty",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "react-dapp-development",
    title: "Building dApps with React & Wallet Adapter",
    description:
      "Build production-ready Solana dApps with React, Next.js, and Wallet Adapter. Connect wallets, sign transactions, and create polished Web3 user experiences.",
    instructor: "Sarah Chen",
    instructorAvatar: "SC",
    difficulty: "Beginner",
    duration: "6h 00m",
    lessons: 6,
    rating: 4.8,
    enrolled: 0,
    tags: ["React", "Frontend", "Wallet Adapter"],
    progress: 0,
    xp: 1200,
    thumbnail: "/solana.jpg",
    modules: [
      {
        title: "Wallet Integration",
        lessons: [
          {
            id: "rd-1-1",
            title: "Wallet Adapter Setup",
            type: "reading",
            duration: "10m",
            completed: false,
            content: `## Wallet Adapter Setup\n\nSolana Wallet Adapter is the standard library for connecting wallets in React apps. It provides a unified interface for Phantom, Solflare, Backpack, and other wallets.\n\n### Setup\n\n1. Install @solana/wallet-adapter-react and wallet-specific adapters\n2. Wrap your app in ConnectionProvider and WalletProvider\n3. Add WalletModalProvider for the connect dialog\n4. Use useWallet() hook to access connection state and signing`,
          },
          {
            id: "rd-1-2",
            title: "Transaction Signing UX",
            type: "video",
            duration: "15m",
            completed: false,
            content: `## Transaction Signing UX\n\nThis video covers building great transaction UX: showing pending states, handling wallet pop-ups, confirming transactions with proper commitment levels, and displaying success/error feedback.`,
          },
          {
            id: "rd-1-3",
            title: "Build a Token Sender",
            type: "challenge",
            duration: "25m",
            completed: false,
            content: `## Challenge: Build a Token Sender\n\nCreate a React component that lets users send SOL to any address with proper wallet integration.\n\n### Objectives\n\n1. Connect wallet using Wallet Adapter\n2. Build a form with recipient address and amount inputs\n3. Sign and send transaction, showing confirmation status`,
            starterCode: `import { useWallet, useConnection } from "@solana/wallet-adapter-react";\nimport { SystemProgram, Transaction, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";\nimport { useState } from "react";\n\nexport function TokenSender() {\n  const { publicKey, sendTransaction } = useWallet();\n  const { connection } = useConnection();\n  const [recipient, setRecipient] = useState("");\n  const [amount, setAmount] = useState("");\n\n  async function handleSend() {\n    // TODO: Validate inputs\n    // TODO: Create transfer transaction\n    // TODO: Send and confirm\n  }\n\n  // TODO: Render form with connect button, inputs, and send button\n  return <div>Token Sender</div>;\n}`,
            testCases: [
              {
                name: "Wallet connects successfully",
                expected: "publicKey: set",
              },
              {
                name: "Transaction sent and confirmed",
                expected: "signature: valid",
              },
              {
                name: "Invalid address shows error",
                expected: "error: invalid address",
              },
            ],
          },
        ],
      },
      {
        title: "Reading On-Chain Data",
        lessons: [
          {
            id: "rd-2-1",
            title: "Fetching Account Data",
            type: "reading",
            duration: "8m",
            completed: false,
            content: `## Fetching Account Data\n\nReading on-chain state in React requires understanding account fetching, deserialization, and reactive updates.\n\n### Patterns\n\n- **getAccountInfo**: Fetch raw account data and deserialize manually\n- **getProgramAccounts**: Query all accounts owned by a program with optional filters\n- **Anchor Provider**: Use program.account to fetch and deserialize typed accounts\n- **Subscriptions**: Use onAccountChange for real-time updates via WebSocket`,
          },
          {
            id: "rd-2-2",
            title: "Real-Time Account Updates",
            type: "video",
            duration: "18m",
            completed: false,
            content: `## Real-Time Account Updates\n\nThis video demonstrates subscribing to account changes with WebSockets, implementing optimistic UI updates, and caching strategies for reducing RPC calls in production dApps.`,
          },
          {
            id: "rd-2-3",
            title: "Build an Account Dashboard",
            type: "challenge",
            duration: "30m",
            completed: false,
            content: `## Challenge: Build an Account Dashboard\n\nCreate a dashboard that displays a wallet's SOL balance, token balances, and recent transactions with real-time updates.\n\n### Objectives\n\n1. Display SOL balance with auto-refresh\n2. List all SPL token balances\n3. Show recent transaction history`,
            starterCode: `import { useWallet, useConnection } from "@solana/wallet-adapter-react";\nimport { useEffect, useState } from "react";\nimport { LAMPORTS_PER_SOL } from "@solana/web3.js";\n\nexport function AccountDashboard() {\n  const { publicKey } = useWallet();\n  const { connection } = useConnection();\n  const [balance, setBalance] = useState<number | null>(null);\n\n  useEffect(() => {\n    if (!publicKey) return;\n    // TODO: Fetch SOL balance\n    // TODO: Subscribe to balance changes\n    // TODO: Fetch token balances\n    // TODO: Fetch recent transactions\n  }, [publicKey, connection]);\n\n  // TODO: Render dashboard with balance, tokens, and transactions\n  return <div>Dashboard</div>;\n}`,
            testCases: [
              { name: "SOL balance displayed", expected: "balance: number" },
              { name: "Token balances listed", expected: "tokens.length >= 0" },
              {
                name: "Transactions loaded",
                expected: "transactions.length > 0",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "raydium-amm",
    title: "Raydium AMM & Concentrated Liquidity",
    description:
      "Master Raydium's AMM and concentrated liquidity pools. Build swap interfaces, provide liquidity, and integrate Raydium into DeFi protocols on Solana.",
    instructor: "David Wu",
    instructorAvatar: "DW",
    difficulty: "Advanced",
    duration: "9h 30m",
    lessons: 6,
    rating: 4.6,
    enrolled: 0,
    tags: ["DeFi", "AMM", "Raydium"],
    progress: 0,
    xp: 1800,
    thumbnail: "/defi.jpg",
    modules: [
      {
        title: "AMM Mechanics",
        lessons: [
          {
            id: "ry-1-1",
            title: "Constant Product AMM",
            type: "reading",
            duration: "12m",
            completed: false,
            content: `## Constant Product AMM\n\nRaydium's standard pools use the x*y=k constant product formula. Understanding the math behind AMMs is essential for building swap interfaces and analyzing impermanent loss.\n\n### Key Concepts\n\n- **Invariant**: x * y = k remains constant after every swap\n- **Price Impact**: Larger swaps relative to pool depth incur more slippage\n- **Impermanent Loss**: LP value diverges from holding when token prices change\n- **Fee Structure**: Swap fees (25bps) are added to the pool, increasing k over time`,
          },
          {
            id: "ry-1-2",
            title: "Raydium Pool Architecture",
            type: "video",
            duration: "20m",
            completed: false,
            content: `## Raydium Pool Architecture\n\nThis video explores Raydium's pool accounts: the AMM config, pool state, token vaults, LP mint, and the OpenBook market integration that combines AMM liquidity with order book depth.`,
          },
          {
            id: "ry-1-3",
            title: "Build a Swap Interface",
            type: "challenge",
            duration: "35m",
            completed: false,
            content: `## Challenge: Build a Swap Interface\n\nCreate a client that executes token swaps on a Raydium AMM pool with proper slippage protection.\n\n### Objectives\n\n1. Fetch pool state and calculate output amount\n2. Execute swap with minimum output amount (slippage protection)\n3. Handle the associated token account creation if needed`,
            starterCode: `import { Connection, PublicKey, Keypair } from "@solana/web3.js";\n\ninterface SwapParams {\n  pool: PublicKey;\n  inputMint: PublicKey;\n  outputMint: PublicKey;\n  amountIn: bigint;\n  slippageBps: number;\n}\n\nasync function swap(connection: Connection, payer: Keypair, params: SwapParams) {\n  // TODO: Fetch pool state (reserves, fee rate)\n  // TODO: Calculate expected output amount\n  // TODO: Apply slippage to get minimum output\n  // TODO: Build and send swap transaction\n  throw new Error("Not implemented");\n}`,
            testCases: [
              { name: "Output amount calculated", expected: "output > 0" },
              {
                name: "Swap executed successfully",
                expected: "signature: valid",
              },
              {
                name: "Slippage protection works",
                expected: "Error: SlippageExceeded",
              },
            ],
          },
        ],
      },
      {
        title: "Concentrated Liquidity",
        lessons: [
          {
            id: "ry-2-1",
            title: "CLMM Theory",
            type: "reading",
            duration: "12m",
            completed: false,
            content: `## CLMM Theory\n\nConcentrated Liquidity Market Makers (CLMM) let LPs focus their capital within a specific price range, dramatically improving capital efficiency compared to constant product pools.\n\n### How It Works\n\n- **Tick Ranges**: LPs choose a lower and upper price bound for their position\n- **Capital Efficiency**: 100x+ improvement when price stays in range\n- **Active Liquidity**: Only positions covering the current price earn fees\n- **Rebalancing**: LPs must adjust ranges as prices move or risk going inactive`,
          },
          {
            id: "ry-2-2",
            title: "Managing CLMM Positions",
            type: "video",
            duration: "22m",
            completed: false,
            content: `## Managing CLMM Positions\n\nThis video covers creating CLMM positions on Raydium: selecting tick ranges, calculating liquidity amounts, collecting fees, and closing positions. Includes strategies for range selection.`,
          },
          {
            id: "ry-2-3",
            title: "Build a CLMM Position Manager",
            type: "challenge",
            duration: "40m",
            completed: false,
            content: `## Challenge: Build a CLMM Position Manager\n\nCreate a tool that opens, monitors, and rebalances concentrated liquidity positions on Raydium.\n\n### Objectives\n\n1. Open a CLMM position with a specified price range\n2. Monitor when price moves outside the range\n3. Close and reopen at a new range (rebalance)`,
            starterCode: `import { Connection, PublicKey, Keypair } from "@solana/web3.js";\n\ninterface CLMMPosition {\n  pool: PublicKey;\n  lowerPrice: number;\n  upperPrice: number;\n  liquidity: bigint;\n}\n\nasync function openPosition(\n  connection: Connection,\n  payer: Keypair,\n  pool: PublicKey,\n  lowerPrice: number,\n  upperPrice: number,\n  amount: number\n): Promise<CLMMPosition> {\n  // TODO: Calculate tick indices from prices\n  // TODO: Calculate token amounts for the range\n  // TODO: Open position transaction\n  throw new Error("Not implemented");\n}\n\nasync function rebalance(connection: Connection, payer: Keypair, position: CLMMPosition) {\n  // TODO: Check if current price is outside range\n  // TODO: Close existing position\n  // TODO: Open new position centered on current price\n  throw new Error("Not implemented");\n}`,
            testCases: [
              { name: "Position opened in range", expected: "liquidity > 0" },
              {
                name: "Out-of-range detected",
                expected: "needsRebalance: true",
              },
              { name: "Rebalance executed", expected: "new range: centered" },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "spl-deep-dive",
    title: "Solana Program Library (SPL) Deep Dive",
    description:
      "Deep dive into the Solana Program Library. Master Token, Token-2022, Associated Token Account, Memo, and Name Service programs for production use.",
    instructor: "Jon Wong",
    instructorAvatar: "JW",
    difficulty: "Intermediate",
    duration: "8h 00m",
    lessons: 6,
    rating: 4.7,
    enrolled: 0,
    tags: ["SPL", "Token-2022", "Solana"],
    progress: 0,
    xp: 1500,
    thumbnail: "/anchor.jpg",
    modules: [
      {
        title: "Token Programs",
        lessons: [
          {
            id: "sd-1-1",
            title: "SPL Token vs Token-2022",
            type: "reading",
            duration: "12m",
            completed: false,
            content: `## SPL Token vs Token-2022\n\nSolana has two token programs: the original SPL Token and the newer Token-2022 (Token Extensions). Token-2022 adds powerful extensions while maintaining backward compatibility.\n\n### Token-2022 Extensions\n\n- **Transfer Fee**: Automatic fee on every transfer\n- **NonTransferable**: Soulbound tokens that can't be transferred\n- **Confidential Transfers**: Encrypted balances using ZK proofs\n- **Transfer Hook**: Custom program invoked on every transfer\n- **Metadata**: On-chain metadata without Metaplex\n- **Permanent Delegate**: Authority that can always transfer/burn`,
          },
          {
            id: "sd-1-2",
            title: "Token-2022 Extensions in Practice",
            type: "video",
            duration: "20m",
            completed: false,
            content: `## Token-2022 Extensions in Practice\n\nThis video demonstrates creating Token-2022 mints with extensions, minting tokens, and interacting with extended tokens in practice. Includes transfer fee collection and confidential transfer setup.`,
          },
          {
            id: "sd-1-3",
            title: "Create a Token with Extensions",
            type: "challenge",
            duration: "30m",
            completed: false,
            content: `## Challenge: Create a Token with Extensions\n\nCreate a Token-2022 mint with transfer fees and non-transferable properties for a soulbound achievement token.\n\n### Objectives\n\n1. Create a mint with NonTransferable and MetadataPointer extensions\n2. Mint tokens to a user's associated token account\n3. Verify the token cannot be transferred`,
            starterCode: `import { Connection, Keypair } from "@solana/web3.js";\nimport {\n  ExtensionType,\n  createInitializeMintInstruction,\n  createInitializeNonTransferableMintInstruction,\n  getMintLen,\n  TOKEN_2022_PROGRAM_ID,\n} from "@solana/spl-token";\n\nasync function createSoulboundToken(connection: Connection, payer: Keypair) {\n  const mint = Keypair.generate();\n  const extensions = [ExtensionType.NonTransferable];\n  const mintLen = getMintLen(extensions);\n\n  // TODO: Create mint account with space for extensions\n  // TODO: Initialize non-transferable extension\n  // TODO: Initialize mint\n  // TODO: Mint to user\n  throw new Error("Not implemented");\n}`,
            testCases: [
              {
                name: "Mint created with extensions",
                expected: "extensions: NonTransferable",
              },
              { name: "Tokens minted to user", expected: "balance: 1" },
              { name: "Transfer rejected", expected: "Error: NonTransferable" },
            ],
          },
        ],
      },
      {
        title: "Advanced SPL Programs",
        lessons: [
          {
            id: "sd-2-1",
            title: "Associated Token Accounts & Memo",
            type: "reading",
            duration: "10m",
            completed: false,
            content: `## Associated Token Accounts & Memo\n\nThe ATA program provides deterministic token account addresses. The Memo program attaches arbitrary text to transactions for compliance and record-keeping.\n\n### ATA Derivation\n\nAn ATA address is derived from: [wallet, TOKEN_PROGRAM_ID, mint]. This means every wallet has exactly one predictable token account per mint.\n\n### Memo Program\n\nAttach human-readable notes to transactions. Used by exchanges for deposit identification and by protocols for compliance reporting.`,
          },
          {
            id: "sd-2-2",
            title: "Transfer Hooks Deep Dive",
            type: "video",
            duration: "22m",
            completed: false,
            content: `## Transfer Hooks Deep Dive\n\nThis video covers Token-2022's transfer hook extension: a custom program that gets invoked on every token transfer. You'll learn the interface, account resolution, and patterns for royalties, allowlists, and transfer restrictions.`,
          },
          {
            id: "sd-2-3",
            title: "Build a Transfer Hook",
            type: "challenge",
            duration: "40m",
            completed: false,
            content: `## Challenge: Build a Transfer Hook\n\nCreate a transfer hook program that enforces an allowlist — only approved wallets can receive the token.\n\n### Objectives\n\n1. Implement the transfer hook interface\n2. Maintain an on-chain allowlist of approved recipients\n3. Reject transfers to non-approved wallets`,
            starterCode: `use anchor_lang::prelude::*;\nuse anchor_spl::token_2022;\n\n#[account]\npub struct AllowList {\n    pub authority: Pubkey,\n    pub approved: Vec<Pubkey>,\n    pub bump: u8,\n}\n\n// TODO: Implement transfer_hook instruction\n// Check if destination wallet is in AllowList\n// Return error if not approved\n\n// TODO: Implement add_to_allowlist instruction\n// Only authority can add wallets`,
            testCases: [
              {
                name: "Approved transfer succeeds",
                expected: "transfer: success",
              },
              {
                name: "Unapproved transfer rejected",
                expected: "Error: NotApproved",
              },
              {
                name: "Authority can update allowlist",
                expected: "approved.length: 2",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "neon-evm",
    title: "Neon EVM: Running EVM on Solana",
    description:
      "Deploy Solidity smart contracts on Solana via Neon EVM. Bridge the gap between Ethereum and Solana ecosystems by running EVM bytecode with Solana's speed.",
    instructor: "Marina Guryeva",
    instructorAvatar: "MG",
    difficulty: "Intermediate",
    duration: "7h 30m",
    lessons: 6,
    rating: 4.5,
    enrolled: 0,
    tags: ["EVM", "Solidity", "Neon"],
    progress: 0,
    xp: 1500,
    thumbnail: "/solana.jpg",
    modules: [
      {
        title: "Neon EVM Basics",
        lessons: [
          {
            id: "ne-1-1",
            title: "EVM on Solana Architecture",
            type: "reading",
            duration: "12m",
            completed: false,
            content: `## EVM on Solana Architecture\n\nNeon EVM runs an Ethereum Virtual Machine inside a Solana program. This lets you deploy unmodified Solidity contracts on Solana, accessing Solana's speed and low fees while using familiar Ethereum tooling.\n\n### How It Works\n\n- **Neon Proxy**: Translates Ethereum JSON-RPC calls to Solana transactions\n- **Neon EVM Program**: A Solana program that executes EVM bytecode\n- **Account Mapping**: Ethereum addresses map to Solana accounts deterministically\n- **Token Bridging**: SPL tokens are accessible as ERC-20s within the EVM context`,
          },
          {
            id: "ne-1-2",
            title: "Setting Up Neon Development",
            type: "video",
            duration: "18m",
            completed: false,
            content: `## Setting Up Neon Development\n\nThis video shows how to configure Hardhat/Foundry for Neon EVM: setting up the proxy endpoint, configuring the Neon network in your framework, deploying contracts, and using block explorers.`,
          },
          {
            id: "ne-1-3",
            title: "Deploy a Solidity Contract on Solana",
            type: "challenge",
            duration: "25m",
            completed: false,
            content: `## Challenge: Deploy a Solidity Contract on Solana\n\nDeploy an ERC-20 token contract on Neon EVM and interact with it using standard Ethereum tooling.\n\n### Objectives\n\n1. Write an ERC-20 contract in Solidity\n2. Deploy it to Neon EVM devnet\n3. Mint tokens and transfer them using ethers.js`,
            starterCode: `// SPDX-License-Identifier: MIT\npragma solidity ^0.8.20;\n\nimport "@openzeppelin/contracts/token/ERC20/ERC20.sol";\n\ncontract MyToken is ERC20 {\n    address public owner;\n\n    constructor() ERC20("MyToken", "MTK") {\n        owner = msg.sender;\n    }\n\n    // TODO: Implement mint function (only owner)\n    // TODO: Deploy to Neon EVM devnet\n    // TODO: Interact with ethers.js\n}`,
            testCases: [
              { name: "Contract deployed on Neon", expected: "address: 0x..." },
              { name: "Tokens minted", expected: "balance: 1000" },
              { name: "Transfer works", expected: "recipient balance: 100" },
            ],
          },
        ],
      },
      {
        title: "Composability",
        lessons: [
          {
            id: "ne-2-1",
            title: "Calling Solana from EVM",
            type: "reading",
            duration: "10m",
            completed: false,
            content: `## Calling Solana from EVM\n\nNeon EVM provides precompiled contracts that let Solidity code interact with native Solana programs. This enables composability between EVM contracts and SPL tokens, PDAs, and custom Solana programs.\n\n### Precompiles\n\n- **SPL Token Precompile**: Transfer and query SPL tokens from Solidity\n- **System Program Precompile**: Create accounts and transfer SOL\n- **Arbitrary CPI**: Call any Solana program from EVM via the call precompile`,
          },
          {
            id: "ne-2-2",
            title: "Cross-Runtime Composability",
            type: "video",
            duration: "20m",
            completed: false,
            content: `## Cross-Runtime Composability\n\nThis video demonstrates building hybrid dApps that combine Solidity contracts on Neon with native Solana programs. You'll see how to call SPL Token from Solidity and how to trigger EVM logic from a Solana transaction.`,
          },
          {
            id: "ne-2-3",
            title: "Build a Hybrid dApp",
            type: "challenge",
            duration: "35m",
            completed: false,
            content: `## Challenge: Build a Hybrid dApp\n\nCreate a dApp that uses a Solidity contract on Neon EVM to interact with an SPL token on Solana.\n\n### Objectives\n\n1. Deploy an EVM contract that wraps SPL token operations\n2. Call the SPL token precompile to transfer tokens\n3. Read token balances from both EVM and Solana perspectives`,
            starterCode: `// SPDX-License-Identifier: MIT\npragma solidity ^0.8.20;\n\ninterface ISPLToken {\n    function transfer(bytes32 to, uint64 amount) external;\n    function balanceOf(bytes32 account) external view returns (uint64);\n}\n\ncontract HybridDApp {\n    ISPLToken public splToken;\n\n    constructor(address _splTokenPrecompile) {\n        splToken = ISPLToken(_splTokenPrecompile);\n    }\n\n    // TODO: Implement wrapTransfer that calls SPL token precompile\n    // TODO: Implement getBalance that reads SPL balance\n}`,
            testCases: [
              {
                name: "SPL token transfer via EVM",
                expected: "transfer: success",
              },
              { name: "Balance readable from EVM", expected: "balance > 0" },
              {
                name: "Unauthorized transfer rejected",
                expected: "Error: Unauthorized",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "solana-validator",
    title: "Running a Solana Validator",
    description:
      "Learn to set up, configure, and operate a Solana validator node. Understand consensus, vote accounts, commission structures, and monitoring for reliable operation.",
    instructor: "Zantetsu",
    instructorAvatar: "ZT",
    difficulty: "Advanced",
    duration: "10h 00m",
    lessons: 6,
    rating: 4.7,
    enrolled: 0,
    tags: ["Validator", "Infrastructure", "Operations"],
    progress: 0,
    xp: 2000,
    thumbnail: "/security.jpg",
    modules: [
      {
        title: "Validator Setup",
        lessons: [
          {
            id: "sv-1-1",
            title: "Validator Architecture",
            type: "reading",
            duration: "15m",
            completed: false,
            content: `## Validator Architecture\n\nA Solana validator participates in consensus by voting on blocks and producing blocks when selected as leader. Understanding the hardware requirements and network architecture is critical.\n\n### Requirements\n\n- **CPU**: 16+ cores, high single-thread performance\n- **RAM**: 512GB+ recommended\n- **Storage**: NVMe SSDs, 2TB+ for accounts and ledger\n- **Network**: 1Gbps+ with low latency to other validators\n\n### Key Processes\n\n- **TPU**: Transaction Processing Unit — receives and processes transactions\n- **TVU**: Transaction Validation Unit — replays and validates blocks from the leader\n- **Gossip**: Peer discovery and cluster state propagation`,
          },
          {
            id: "sv-1-2",
            title: "Initial Setup Walkthrough",
            type: "video",
            duration: "25m",
            completed: false,
            content: `## Initial Setup Walkthrough\n\nThis video walks through setting up a Solana validator from scratch: system configuration, Solana CLI installation, key generation, vote account creation, and joining the testnet cluster.`,
          },
          {
            id: "sv-1-3",
            title: "Configure a Testnet Validator",
            type: "challenge",
            duration: "30m",
            completed: false,
            content: `## Challenge: Configure a Testnet Validator\n\nWrite the configuration scripts for a Solana testnet validator with proper key management and startup parameters.\n\n### Objectives\n\n1. Generate validator identity, vote, and authorized withdrawer keypairs\n2. Create the validator startup script with required flags\n3. Configure log rotation and monitoring`,
            starterCode: `#!/bin/bash\n# Solana Validator Configuration Script\n\n# TODO: Generate keypairs\n# solana-keygen new -o validator-keypair.json\n# solana-keygen new -o vote-account-keypair.json\n# solana-keygen new -o authorized-withdrawer-keypair.json\n\n# TODO: Create vote account\n# solana create-vote-account ...\n\n# TODO: Configure validator startup command\n# solana-validator \\\n#   --identity validator-keypair.json \\\n#   --vote-account vote-account-keypair.json \\\n#   --known-validator <PUBKEY> \\\n#   --expected-genesis-hash <HASH> \\\n#   ...`,
            testCases: [
              { name: "Keypairs generated", expected: "files: 3 keypairs" },
              {
                name: "Vote account created",
                expected: "vote account: active",
              },
              {
                name: "Validator startup configured",
                expected: "flags: valid",
              },
            ],
          },
        ],
      },
      {
        title: "Operations & Monitoring",
        lessons: [
          {
            id: "sv-2-1",
            title: "Validator Monitoring",
            type: "reading",
            duration: "12m",
            completed: false,
            content: `## Validator Monitoring\n\nReliable validator operation requires continuous monitoring. Key metrics include vote success rate, skip rate, delinquency, and hardware utilization.\n\n### Essential Metrics\n\n- **Vote Success**: Percentage of slots where your validator successfully voted\n- **Skip Rate**: Percentage of your leader slots with no block produced\n- **Credit Score**: Accumulated vote credits determining staking rewards\n- **Delinquency**: Whether your validator is behind the cluster\n\n### Monitoring Tools\n\n- Solana CLI: solana validators, solana catchup\n- Grafana + InfluxDB for metrics dashboards\n- PagerDuty/OpsGenie for alerting on delinquency`,
          },
          {
            id: "sv-2-2",
            title: "Troubleshooting Common Issues",
            type: "video",
            duration: "22m",
            completed: false,
            content: `## Troubleshooting Common Issues\n\nThis video covers the most common validator issues and their solutions: falling behind on votes, snapshot download failures, ledger corruption, memory pressure, and network connectivity problems.`,
          },
          {
            id: "sv-2-3",
            title: "Build a Monitoring Dashboard",
            type: "challenge",
            duration: "40m",
            completed: false,
            content: `## Challenge: Build a Monitoring Dashboard\n\nCreate a monitoring script that tracks your validator's health metrics and sends alerts on issues.\n\n### Objectives\n\n1. Query validator vote account status and credits\n2. Calculate skip rate and vote success percentage\n3. Send alerts when metrics drop below thresholds`,
            starterCode: `import { Connection, PublicKey } from "@solana/web3.js";\n\ninterface ValidatorHealth {\n  voteSuccess: number;\n  skipRate: number;\n  behindBy: number;\n  credits: number;\n  delinquent: boolean;\n}\n\nasync function checkValidatorHealth(\n  connection: Connection,\n  voteAccount: PublicKey\n): Promise<ValidatorHealth> {\n  // TODO: Fetch vote account info\n  // TODO: Calculate vote success rate\n  // TODO: Check delinquency status\n  // TODO: Get leader schedule and calculate skip rate\n  throw new Error("Not implemented");\n}\n\nasync function alertIfUnhealthy(health: ValidatorHealth) {\n  // TODO: Define thresholds (vote success < 95%, skip > 5%)\n  // TODO: Send alert via webhook if thresholds breached\n  throw new Error("Not implemented");\n}`,
            testCases: [
              {
                name: "Vote success calculated",
                expected: "voteSuccess: percentage",
              },
              {
                name: "Delinquency detected",
                expected: "delinquent: true/false",
              },
              {
                name: "Alert sent on threshold breach",
                expected: "alert: sent",
              },
            ],
          },
        ],
      },
    ],
  },
];
