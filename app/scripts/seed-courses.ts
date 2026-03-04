import { db } from "@/drizzle/db"
import { AssignmentTable, CourseSectionTable, CourseTable, LessonTable } from "@/drizzle/schema"
import { getQuizTotalPoints, serializeQuizConfig, type QuizConfig } from "@/features/quizzes/lib/quiz"
import { inArray } from "drizzle-orm"

type SeedLesson = {
  name: string
  description: string
  xpReward: number
}

type SeedSection = {
  name: string
  lessons: SeedLesson[]
}

type SeedCourse = {
  name: string
  slug: string
  onchainCourseId?: string
  description: string
  difficulty: "beginner" | "intermediate" | "advanced"
  track: "fundamentals" | "defi" | "nft" | "security" | "frontend"
  durationHours: number
  instructorName: string
  sections: SeedSection[]
  quiz: {
    name: string
    description: string
    xpReward: number
    config: QuizConfig
  }
}

const courses: SeedCourse[] = [
  // ─────────────────────────────────────────────────────────────────────────────
  // 1. SOLANA FUNDAMENTALS
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: "Solana Fundamentals: Accounts & Programs",
    slug: "solana-fundamentals-accounts-programs",
    onchainCourseId: "solana-fundamentals-accounts-pro",
    description:
      "Master Solana's account model, program architecture, PDAs, and the transaction lifecycle. This course takes you from zero to writing your first on-chain interactions with confidence.",
    difficulty: "beginner",
    track: "fundamentals",
    durationHours: 8,
    instructorName: "Ana Costa",
    sections: [
      {
        name: "The Solana Architecture",
        lessons: [
          {
            name: "Why Solana? Speed, Cost, and Design Philosophy",
            xpReward: 50,
            description: `# Why Solana?

Solana is a high-performance Layer-1 blockchain designed from the ground up for speed and low cost. Unlike chains that bolt scalability on top of existing designs, Solana rethinks every layer.

## Key Innovations

### Proof of History (PoH)
PoH is a cryptographic clock that allows validators to agree on time without communicating. Each validator keeps a SHA-256 hash chain — every output is the input to the next hash — creating a verifiable, ordered sequence of events.

\`\`\`
hash(n) = sha256(hash(n-1) + event_data)
\`\`\`

This eliminates the need for validators to exchange timestamps, dramatically reducing consensus overhead.

### Parallel Transaction Processing
Solana executes non-overlapping transactions in parallel using **Sealevel**, its parallel runtime. Transactions declare upfront which accounts they will read or write, so the runtime can schedule them concurrently on multi-core hardware.

### Gulf Stream
Instead of a mempool, Solana forwards transactions to the *next* expected leader before the current slot ends — removing the global mempool bottleneck entirely.

## Performance Numbers (Mainnet)
| Metric | Value |
|--------|-------|
| Block time | ~400ms |
| Theoretical TPS | 65,000 |
| Avg transaction fee | < $0.001 |
| Finality | ~1–2 seconds |

## Why It Matters for Developers
Low fees mean you can build products that weren't economically viable on other chains — frequent micro-transactions, on-chain game state, real-time data feeds, soulbound credentials.

## Key Takeaways
- PoH is a verifiable delay function used as a decentralised clock
- Parallel execution via Sealevel is why Solana is fast
- Low fees unlock use-cases impossible on other L1s
`,
          },
          {
            name: "The Account Model: Everything Is an Account",
            xpReward: 60,
            description: `# The Account Model

On Solana, **everything** is an account — your wallet balance, program code, program state, token holdings, and NFT metadata. Understanding accounts is the foundation of all Solana development.

## Anatomy of an Account

\`\`\`
Account {
  lamports:   u64,       // balance in lamports (1 SOL = 1_000_000_000 lamports)
  data:       Vec<u8>,   // arbitrary byte array — program state lives here
  owner:      Pubkey,    // which program controls this account
  executable: bool,      // true only for program accounts
  rent_epoch: u64,       // legacy field (mostly irrelevant post rent-exemption)
}
\`\`\`

## Key Rules

### 1. Owner Controls Writes
Only the **owner program** can modify an account's data or debit its lamports. The System Program owns regular wallets.

### 2. Anyone Can Read
Account data is public. Any program or off-chain client can read any account's data.

### 3. Rent Exemption
Accounts must hold enough lamports to be **rent-exempt** — the minimum deposit to keep an account alive indefinitely.

\`\`\`typescript
// Minimum lamports for a given data size
const rentExempt = await connection.getMinimumBalanceForRentExemption(dataSize);
\`\`\`

## Account Types in Practice

| Type | Owner | executable |
|------|-------|-----------|
| Wallet | System Program | false |
| Token Account | Token Program | false |
| Program | BPF Loader | true |
| PDA | Your Program | false |

## Practical Example
When you send SOL to a friend:
1. Your wallet (owned by System Program) signs the transaction
2. System Program debits lamports from your account
3. System Program credits lamports to the recipient's account

No program you wrote is involved — the System Program handles native SOL transfers.

## Key Takeaways
- Every piece of state on Solana is an account
- The owner field is the security boundary — only the owner program can write
- Rent exemption requires a minimum balance proportional to data size
`,
          },
          {
            name: "Transactions and Instructions",
            xpReward: 60,
            description: `# Transactions and Instructions

A Solana **transaction** is the atomic unit of state change. Understanding its structure lets you read, debug, and construct interactions confidently.

## Transaction Structure

\`\`\`
Transaction {
  signatures:    Vec<Signature>,   // one per required signer
  message: {
    header:        MessageHeader,
    account_keys:  Vec<Pubkey>,    // all accounts involved
    recent_blockhash: Hash,        // prevents replay attacks (~60s window)
    instructions:  Vec<Instruction>,
  }
}
\`\`\`

## Instruction Structure

\`\`\`
Instruction {
  program_id:       Pubkey,           // which program to call
  accounts:         Vec<AccountMeta>, // accounts this instruction reads/writes
  data:             Vec<u8>,          // encoded instruction data (args)
}

AccountMeta {
  pubkey:     Pubkey,
  is_signer:  bool,   // must this account sign the transaction?
  is_writable: bool,  // will this account's state change?
}
\`\`\`

## Transaction Lifecycle

\`\`\`
Client builds tx → Signs tx → Sends to RPC → Leader receives →
Validates → Executes instructions → Updates accounts →
Includes in block → Confirmed
\`\`\`

## Building a Transaction in TypeScript

\`\`\`typescript
import { Transaction, SystemProgram, Connection, PublicKey } from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com");
const { blockhash } = await connection.getLatestBlockhash();

const tx = new Transaction({
  recentBlockhash: blockhash,
  feePayer: payer.publicKey,
}).add(
  SystemProgram.transfer({
    fromPubkey: payer.publicKey,
    toPubkey: recipient,
    lamports: 0.01 * LAMPORTS_PER_SOL,
  })
);

tx.sign(payer);
const sig = await connection.sendRawTransaction(tx.serialize());
\`\`\`

## Atomicity
All instructions in a transaction succeed or fail together. If any instruction errors, the entire transaction reverts — no partial state changes.

## Key Takeaways
- Transactions contain one or more instructions
- Instructions specify: which program, which accounts, and what data
- Transactions are atomic — all-or-nothing execution
- The recent blockhash (expiry: ~60s) prevents replay attacks
`,
          },
        ],
      },
      {
        name: "Program Derived Addresses",
        lessons: [
          {
            name: "What Are PDAs and Why Do They Exist?",
            xpReward: 70,
            description: `# Program Derived Addresses (PDAs)

PDAs are the mechanism by which Solana programs own and control accounts deterministically. They are arguably the most important concept in Solana development.

## The Problem PDAs Solve

Programs cannot hold a private key — they are just code. But programs need to **own accounts** and **sign transactions** to manage state. PDAs solve this by creating addresses that:

1. Are deterministically derived from seeds
2. Do NOT exist on the Ed25519 elliptic curve (no private key)
3. Can be "signed for" by the owning program

## How a PDA Is Derived

\`\`\`typescript
const [pda, bump] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("my-seed"),     // static seed
    user.publicKey.toBuffer(),  // dynamic seed
  ],
  programId
);
\`\`\`

The runtime repeatedly hashes \`seeds + programId + bump\` (starting at 255) until the result falls **off** the Ed25519 curve. The first off-curve result is the canonical PDA.

## Canonical Bump
\`findProgramAddressSync\` tries bump = 255, 254, 253 ... until it finds an off-curve point. The first valid bump is the **canonical bump**. Always store it in your account to avoid recomputing.

## Program Signing (CPI)
In a Cross-Program Invocation, programs can sign for their PDAs:

\`\`\`rust
// Anchor
let seeds = &[b"my-seed", user.key.as_ref(), &[ctx.bumps.my_pda]];
let signer_seeds = &[&seeds[..]];

token::transfer(
    CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer { from, to, authority: ctx.accounts.my_pda.to_account_info() },
        signer_seeds,
    ),
    amount,
)?;
\`\`\`

## Real-World PDA Patterns

| Seed Pattern | Use Case |
|---|---|
| \`["config"]\` | Single global config account |
| \`["user", user_pubkey]\` | Per-user profile |
| \`["vault", mint_pubkey]\` | Token vault per mint |
| \`["order", market, order_id]\` | Individual order in a DEX |

## Key Takeaways
- PDAs are off-curve — no private key exists
- Derived deterministically from seeds + program ID + bump
- Programs sign for their PDAs using \`invoke_signed\`
- Always store the canonical bump to avoid expensive re-derivation
`,
          },
          {
            name: "Cross-Program Invocations (CPI)",
            xpReward: 80,
            description: `# Cross-Program Invocations (CPI)

CPIs allow one Solana program to call another. This is how composability works on Solana — your protocol can call the Token Program, the System Program, or any other on-chain program.

## CPI Basics

\`\`\`rust
// Native Solana CPI
use solana_program::program::invoke;

invoke(
    &system_instruction::create_account(
        payer.key,
        new_account.key,
        rent_lamports,
        space as u64,
        &program_id,
    ),
    &[payer.clone(), new_account.clone(), system_program.clone()],
)?;
\`\`\`

## CPI with Signer Seeds (for PDAs)

\`\`\`rust
use solana_program::program::invoke_signed;

let seeds = &[b"vault", mint.key.as_ref(), &[bump]];

invoke_signed(
    &token_instruction::transfer(
        token_program.key,
        vault_token_account.key,
        destination.key,
        vault_pda.key,  // authority = PDA
        &[],
        amount,
    )?,
    &[vault_token_account.clone(), destination.clone(), vault_pda.clone()],
    &[seeds],
)?;
\`\`\`

## Anchor CPI (Cleaner Syntax)

\`\`\`rust
use anchor_spl::token::{self, Transfer};

token::transfer(
    CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.user_token.to_account_info(),
            to: ctx.accounts.vault_token.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        },
    ),
    amount,
)?;
\`\`\`

## Important CPI Rules

| Rule | Explanation |
|------|-------------|
| Stack depth limit | Max 4 levels of CPI nesting |
| Account ownership | CPI cannot create accounts owned by the caller by default |
| Privilege escalation prevention | A CPI cannot grant signer privileges the caller doesn't have |
| Return values | Programs can return data via \`set_return_data\` / \`get_return_data\` |

## Key Takeaways
- CPIs let programs compose with other on-chain programs
- Use \`invoke\` for regular CPIs, \`invoke_signed\` when a PDA must sign
- Anchor's \`CpiContext\` and \`CpiContext::new_with_signer\` wrap the native calls
- Max CPI depth is 4 to prevent stack overflows
`,
          },
        ],
      },
      {
        name: "Building with Anchor",
        lessons: [
          {
            name: "Anchor Framework: Accounts, Constraints, and Instructions",
            xpReward: 90,
            description: `# Anchor Framework

Anchor is the dominant framework for writing Solana programs. It provides macros and abstractions that eliminate most of the boilerplate in native Rust programs.

## A Minimal Anchor Program

\`\`\`rust
use anchor_lang::prelude::*;

declare_id!("YourProgramIdHere...");

#[program]
pub mod counter {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, start: u64) -> Result<()> {
        ctx.accounts.counter.count = start;
        Ok(())
    }

    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        ctx.accounts.counter.count += 1;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 8,  // discriminator + u64
        seeds = [b"counter", user.key().as_ref()],
        bump,
    )]
    pub counter: Account<'info, Counter>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(
        mut,
        seeds = [b"counter", user.key().as_ref()],
        bump = counter.bump,
    )]
    pub counter: Account<'info, Counter>,

    pub user: Signer<'info>,
}

#[account]
pub struct Counter {
    pub count: u64,
    pub bump: u8,
}
\`\`\`

## Key Anchor Concepts

### \`#[account]\` macro
Adds an 8-byte **discriminator** prefix to account data. Anchor uses this to verify you're deserialising the correct account type.

### Account Constraints
| Constraint | Effect |
|---|---|
| \`init\` | Creates the account, sets owner to the program |
| \`mut\` | Marks the account as writable |
| \`seeds, bump\` | Derives and verifies a PDA |
| \`has_one = field\` | Asserts \`account.field == ctx.accounts.field.key()\` |
| \`constraint = expr\` | Custom boolean constraint |
| \`close = target\` | Closes the account, sends lamports to target |

### Space Calculation
\`\`\`
space = 8           // anchor discriminator
      + 8           // u64 field
      + 32          // Pubkey field
      + 1 + 4 + 50  // Option<String> with max 50 chars
\`\`\`

## Calling from TypeScript

\`\`\`typescript
const program = new Program(idl, provider);

await program.methods
  .initialize(new BN(0))
  .accounts({
    counter: counterPda,
    user: wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
\`\`\`

## Key Takeaways
- Anchor \`#[derive(Accounts)]\` handles account validation automatically
- Constraints like \`init\`, \`mut\`, \`seeds\` replace manual checks
- The 8-byte discriminator prevents account type confusion attacks
- Use \`anchor test\` and \`anchor deploy\` for the full development lifecycle
`,
          },
        ],
      },
    ],
    quiz: {
      name: "Solana Fundamentals Quiz",
      description: "Validate your understanding of accounts, PDAs, transactions, and the Anchor framework.",
      xpReward: 300,
      config: {
        type: "quiz",
        version: 1,
        intro: "This quiz covers Solana's account model, PDAs, transactions, and Anchor. Each question has one correct answer.",
        timeLimitMinutes: 15,
        passingScore: 40,
        questions: [
          {
            id: "q1",
            prompt: "Which field in a Solana account determines which program can modify its data?",
            options: [
              { id: "a", text: "lamports" },
              { id: "b", text: "executable" },
              { id: "c", text: "owner" },
              { id: "d", text: "rent_epoch" },
            ],
            correctOptionId: "c",
            points: 10,
            explanation: "The 'owner' field stores the program ID that has write access. Only the owning program can modify the account's data or debit lamports.",
          },
          {
            id: "q2",
            prompt: "What is the main purpose of Proof of History (PoH) in Solana?",
            options: [
              { id: "a", text: "To store user transaction history on-chain" },
              { id: "b", text: "To provide a cryptographic clock that validators agree on without communication" },
              { id: "c", text: "To replace the need for validators entirely" },
              { id: "d", text: "To encrypt account data at rest" },
            ],
            correctOptionId: "b",
            points: 10,
            explanation: "PoH is a SHA-256 hash chain that creates a verifiable, ordered sequence of events — acting as a decentralised clock for validators.",
          },
          {
            id: "q3",
            prompt: "When findProgramAddressSync searches for a PDA, what is it looking for?",
            options: [
              { id: "a", text: "A hash that exists on the Ed25519 curve" },
              { id: "b", text: "An address registered in the System Program" },
              { id: "c", text: "A hash that falls OFF the Ed25519 curve" },
              { id: "d", text: "An address with zero lamports" },
            ],
            correctOptionId: "c",
            points: 15,
            explanation: "PDAs must be off-curve — they cannot be on the Ed25519 curve — so no private key can be derived for them. This is what makes them safe for programs to control.",
          },
          {
            id: "q4",
            prompt: "What happens to ALL instructions in a transaction when one instruction fails?",
            options: [
              { id: "a", text: "Only the failed instruction is rolled back; others commit" },
              { id: "b", text: "The entire transaction is rolled back" },
              { id: "c", text: "The transaction is retried automatically" },
              { id: "d", text: "Completed instructions commit, pending ones are skipped" },
            ],
            correctOptionId: "b",
            points: 10,
            explanation: "Transactions are atomic. If any instruction fails, the entire transaction reverts — there are no partial state changes.",
          },
          {
            id: "q5",
            prompt: "In Anchor, what does the 8-byte discriminator prefix added by #[account] do?",
            options: [
              { id: "a", text: "Stores the creation timestamp of the account" },
              { id: "b", text: "Encodes the owner's public key" },
              { id: "c", text: "Identifies the account type to prevent type confusion attacks" },
              { id: "d", text: "Stores the bump seed for PDA derivation" },
            ],
            correctOptionId: "c",
            points: 15,
            explanation: "Anchor prepends an 8-byte hash of the account struct name. When deserialising, Anchor checks this discriminator to ensure you're reading the correct account type.",
          },
          {
            id: "q6",
            prompt: "What is the maximum depth of Cross-Program Invocations (CPI) in Solana?",
            options: [
              { id: "a", text: "2" },
              { id: "b", text: "4" },
              { id: "c", text: "8" },
              { id: "d", text: "Unlimited" },
            ],
            correctOptionId: "b",
            points: 10,
            explanation: "Solana enforces a maximum CPI depth of 4 to prevent stack overflows during execution.",
          },
        ],
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. NFT ESSENTIALS
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: "NFT Essentials on Solana",
    slug: "nft-essentials-solana",
    description:
      "Learn to mint, manage, and transfer Metaplex Core NFTs on Solana. Covers metadata standards, collection management, and soulbound credentials for on-chain identity.",
    difficulty: "beginner",
    track: "nft",
    durationHours: 6,
    instructorName: "Lucas Ribeiro",
    sections: [
      {
        name: "NFT Fundamentals",
        lessons: [
          {
            name: "NFTs on Solana: Ownership, Metadata, and Standards",
            xpReward: 50,
            description: `# NFTs on Solana

Solana NFTs are non-fungible tokens where each token has a unique mint address. Over time, the ecosystem standardised around **Metaplex** for metadata and collection management.

## What Makes an NFT?

At the token level, a Solana NFT is a SPL token with:
- **Supply = 1** (exactly one exists)
- **Decimals = 0** (cannot be fractioned)
- **Mint authority = null** (cannot mint more)

## Metadata Standards

### Token Metadata (Legacy Standard)
The original Metaplex standard stores metadata in a separate **Metadata PDA** account:

\`\`\`
Metadata PDA = find_program_address(
  ["metadata", token_metadata_program, mint],
  token_metadata_program
)
\`\`\`

Fields stored on-chain:
\`\`\`json
{
  "name": "Superteam Academy #001",
  "symbol": "STA",
  "uri": "https://arweave.net/...",
  "seller_fee_basis_points": 500,
  "creators": [{ "address": "...", "share": 100 }]
}
\`\`\`

## Metaplex Core (2024+)
Metaplex Core is a new, cheaper, and more composable NFT standard. Instead of multiple accounts per NFT, Core stores everything in a single account — reducing minting cost by ~80%.

\`\`\`
Core Asset Account = {
  owner: Pubkey,
  update_authority: Pubkey,
  name: String,
  uri: String,
  plugins: Vec<Plugin>,
}
\`\`\`

## Collections
Collections group related NFTs. In Metaplex Core, a **Collection** is itself an asset that individual assets point to:

\`\`\`typescript
const collection = await createCollection(umi, {
  name: "Superteam Academy Credentials",
  uri: "https://...",
});

const nft = await create(umi, {
  name: "Builder Path — Completed",
  uri: "https://...",
  collection: { key: collection.publicKey, verified: true },
});
\`\`\`

## Key Takeaways
- Solana NFTs are SPL tokens with supply=1, decimals=0, mint authority=null
- Metaplex Core is the modern standard: one account per NFT, cheaper, composable via plugins
- On-chain data is minimal; rich metadata lives in an off-chain JSON file pointed to by URI
`,
          },
          {
            name: "Metaplex Core: Plugins and Composability",
            xpReward: 60,
            description: `# Metaplex Core Plugins

Metaplex Core's defining feature is its **plugin system**. Instead of baking every behaviour into the base standard, plugins are modular capabilities you attach to assets or collections.

## Plugin Architecture

Plugins can be added to:
- **Individual assets** — affects only that NFT
- **Collections** — inherited by all NFTs in the collection

\`\`\`typescript
import { create, addPlugin } from "@metaplex-foundation/mpl-core";

const asset = await create(umi, {
  name: "Credential",
  uri: "https://...",
  plugins: [
    {
      type: "FreezeDelegate",
      frozen: true,
      authority: { type: "UpdateAuthority" },
    },
  ],
});
\`\`\`

## Essential Plugins

### FreezeDelegate
Prevents transfers. Critical for soulbound/non-transferable assets.

### PermanentFreezeDelegate
**Permanently** prevents transfers — even the update authority cannot unfreeze. Perfect for credentials that must never move.

\`\`\`typescript
{
  type: "PermanentFreezeDelegate",
  frozen: true,
}
\`\`\`

### Royalties
Enforces creator royalties at the protocol level.

### Attributes
Stores on-chain attributes directly — no off-chain JSON needed for simple metadata:

\`\`\`typescript
{
  type: "Attributes",
  attributeList: [
    { key: "track", value: "Builder" },
    { key: "xp", value: "2500" },
    { key: "completed_at", value: "2025-01-15" },
  ],
}
\`\`\`

## In-Place Upgrades
You can **update plugin values** on existing NFTs. This enables dynamic NFTs that evolve:

\`\`\`typescript
await updatePluginV1(umi, {
  asset: assetPublicKey,
  plugin: {
    type: "Attributes",
    attributeList: [{ key: "xp", value: "5000" }],
  },
});
\`\`\`

## Key Takeaways
- Core plugins are modular extensions attached to assets or collections
- \`PermanentFreezeDelegate\` creates truly soulbound, non-transferable assets
- \`Attributes\` plugin enables on-chain metadata without off-chain JSON
- Plugins on collections are inherited by all member assets
`,
          },
        ],
      },
      {
        name: "Minting and Soulbound Credentials",
        lessons: [
          {
            name: "Minting NFTs with Metaplex Core",
            xpReward: 70,
            description: `# Minting NFTs with Metaplex Core

This lesson walks through the complete minting flow — from setting up the Metaplex UMI client to minting an NFT with plugins on Devnet.

## Setting Up UMI

\`\`\`typescript
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplCore } from "@metaplex-foundation/mpl-core";
import { keypairIdentity } from "@metaplex-foundation/umi";

const umi = createUmi("https://api.devnet.solana.com")
  .use(mplCore())
  .use(keypairIdentity(umiKeypair));
\`\`\`

## Creating a Collection

\`\`\`typescript
import { createCollection, generateSigner } from "@metaplex-foundation/mpl-core";

const collectionSigner = generateSigner(umi);

await createCollection(umi, {
  collection: collectionSigner,
  name: "Superteam Brazil — Builder Track",
  uri: "https://arweave.net/collection-metadata.json",
}).sendAndConfirm(umi);
\`\`\`

## Minting an Asset

\`\`\`typescript
import { create, ruleSet } from "@metaplex-foundation/mpl-core";

const assetSigner = generateSigner(umi);

await create(umi, {
  asset: assetSigner,
  collection: collectionSigner.publicKey,
  name: "Builder Path Credential",
  uri: "https://arweave.net/credential-metadata.json",
  plugins: [
    {
      type: "Royalties",
      basisPoints: 0,
      creators: [{ address: umi.identity.publicKey, percentage: 100 }],
      ruleSet: ruleSet("None"),
    },
    {
      type: "Attributes",
      attributeList: [
        { key: "track", value: "Builder" },
        { key: "issued_to", value: recipientAddress },
        { key: "issued_at", value: new Date().toISOString() },
      ],
    },
  ],
}).sendAndConfirm(umi);
\`\`\`

## Reading and Transferring

\`\`\`typescript
import { fetchAsset, transferV1 } from "@metaplex-foundation/mpl-core";

// Read
const asset = await fetchAsset(umi, assetPublicKey);
console.log(asset.name, asset.owner, asset.plugins);

// Transfer
await transferV1(umi, {
  asset: assetPublicKey,
  collection: collectionPublicKey,
  newOwner: recipientPublicKey,
}).sendAndConfirm(umi);
\`\`\`

## Off-chain Metadata JSON Format

\`\`\`json
{
  "name": "Builder Path Credential",
  "description": "Awarded for completing the Solana Builder Path.",
  "image": "https://arweave.net/image.png",
  "attributes": [
    { "trait_type": "Track", "value": "Builder" },
    { "trait_type": "Tier", "value": "Gold" }
  ]
}
\`\`\`

## Key Takeaways
- UMI is the modern Metaplex SDK — replaces the older JS SDK
- Always create a collection before minting individual assets
- \`create()\` mints an asset; add plugins in the same transaction
- Assets and collections have separate signers; both need to be generated
`,
          },
          {
            name: "Soulbound Credentials: Design and Implementation",
            xpReward: 80,
            description: `# Soulbound Credentials

A **soulbound** credential is a non-transferable on-chain token permanently tied to a wallet. Superteam Brazil Academy awards these upon completing learning tracks.

## What Makes a Credential Soulbound?

1. **Non-transferable** — owner cannot send it to another wallet
2. **Non-burnable** (optional) — owner cannot destroy it
3. **Updatable** — issuer can update metadata (e.g., XP score, completion date)

## Implementation with PermanentFreezeDelegate

\`\`\`typescript
await create(umi, {
  asset: assetSigner,
  collection: collectionKey,
  name: \`\${track} Credential\`,
  uri: metadataUri,
  owner: toPublicKey(recipientAddress),  // mint directly to recipient
  plugins: [
    {
      type: "PermanentFreezeDelegate",
      frozen: true,
      authority: { type: "UpdateAuthority" },
    },
    {
      type: "Attributes",
      attributeList: [
        { key: "track",       value: track },
        { key: "wallet",      value: recipientAddress },
        { key: "xp_earned",  value: String(xpEarned) },
        { key: "issued_at",  value: new Date().toISOString() },
      ],
    },
  ],
}).sendAndConfirm(umi);
\`\`\`

## Updating Credential Metadata

\`\`\`typescript
import { updatePluginV1 } from "@metaplex-foundation/mpl-core";

await updatePluginV1(umi, {
  asset: credentialPublicKey,
  collection: collectionPublicKey,
  plugin: {
    type: "Attributes",
    attributeList: [
      { key: "xp_earned", value: "5000" },
      { key: "tier",      value: "Gold" },
    ],
  },
}).sendAndConfirm(umi);
\`\`\`

## Verifying a Credential On-Chain

\`\`\`typescript
const asset = await fetchAsset(umi, credentialPublicKey);

const hasPermanentFreeze = asset.plugins.some(
  p => p.type === "PermanentFreezeDelegate" && p.frozen
);

const attributes = asset.plugins
  .find(p => p.type === "Attributes")
  ?.attributeList ?? [];

console.log({ hasPermanentFreeze, attributes });
\`\`\`

## Design Considerations

| Decision | Recommendation |
|---|---|
| Who mints? | Backend signer (not user) — issuer controls issuance |
| When to mint? | On course completion, after verification |
| Privacy | Use hashed wallet addresses in URI if needed |

## Key Takeaways
- \`PermanentFreezeDelegate\` with \`frozen: true\` makes an asset permanently non-transferable
- Mint directly to the recipient's wallet using the \`owner\` field in \`create()\`
- Use \`Attributes\` plugin to store credential metadata fully on-chain
- Credentials can still be updated by the update authority — enabling dynamic credentials
`,
          },
        ],
      },
    ],
    quiz: {
      name: "NFT Essentials Quiz",
      description: "Test your knowledge of Metaplex Core, plugins, and soulbound credential design.",
      xpReward: 250,
      config: {
        type: "quiz",
        version: 1,
        intro: "Answer all questions. Each question tests a concept from the NFT Essentials course.",
        timeLimitMinutes: 12,
        passingScore: 35,
        questions: [
          {
            id: "q1",
            prompt: "What three token properties define a Solana NFT at the SPL level?",
            options: [
              { id: "a", text: "Supply=1, Decimals=0, Mint authority=null" },
              { id: "b", text: "Supply=1, Decimals=18, Freeze authority=null" },
              { id: "c", text: "Supply=1000, Decimals=0, Mint authority=null" },
              { id: "d", text: "Supply=1, Decimals=6, Transfer hook enabled" },
            ],
            correctOptionId: "a",
            points: 10,
            explanation: "An NFT is a token with exactly one unit (supply=1), no fractional units (decimals=0), and no ability to mint more (mint authority=null).",
          },
          {
            id: "q2",
            prompt: "What plugin permanently prevents an NFT from ever being transferred?",
            options: [
              { id: "a", text: "FreezeDelegate" },
              { id: "b", text: "PermanentFreezeDelegate" },
              { id: "c", text: "TransferGuard" },
              { id: "d", text: "Royalties" },
            ],
            correctOptionId: "b",
            points: 10,
            explanation: "PermanentFreezeDelegate with frozen=true is immutable — even the update authority cannot unfreeze the asset, making it truly soulbound.",
          },
          {
            id: "q3",
            prompt: "Where is the rich metadata (image, attributes) of a Metaplex NFT typically stored?",
            options: [
              { id: "a", text: "Entirely on-chain in the account data" },
              { id: "b", text: "In a Solana database alongside the mint" },
              { id: "c", text: "Off-chain (Arweave/IPFS) pointed to by an on-chain URI" },
              { id: "d", text: "In the token program's metadata store" },
            ],
            correctOptionId: "c",
            points: 10,
            explanation: "On-chain data is minimal (name, symbol, URI). The URI points to an off-chain JSON file containing image and attributes.",
          },
          {
            id: "q4",
            prompt: "What is the key advantage of Metaplex Core over the legacy Token Metadata standard?",
            options: [
              { id: "a", text: "Core NFTs can be fractionalised" },
              { id: "b", text: "Core stores everything in one account, reducing minting cost by ~80%" },
              { id: "c", text: "Core NFTs are automatically listed on marketplaces" },
              { id: "d", text: "Core uses a separate chain for metadata storage" },
            ],
            correctOptionId: "b",
            points: 10,
            explanation: "Metaplex Core consolidates all NFT data into a single account, eliminating the separate Metadata PDA and Edition accounts — cutting mint cost dramatically.",
          },
          {
            id: "q5",
            prompt: "How can a credential issuer update the XP score stored in an on-chain Attributes plugin?",
            options: [
              { id: "a", text: "By burning and re-minting the credential" },
              { id: "b", text: "By calling updatePluginV1 with the new attribute list" },
              { id: "c", text: "By transferring the credential to a new wallet" },
              { id: "d", text: "On-chain attributes cannot be updated after minting" },
            ],
            correctOptionId: "b",
            points: 15,
            explanation: "updatePluginV1 lets the update authority modify plugin data on an existing asset. This enables dynamic credentials that evolve as a user progresses.",
          },
          {
            id: "q6",
            prompt: "When minting a soulbound credential directly to a recipient's wallet, which field do you set in create()?",
            options: [
              { id: "a", text: "recipient" },
              { id: "b", text: "transferTo" },
              { id: "c", text: "owner" },
              { id: "d", text: "destination" },
            ],
            correctOptionId: "c",
            points: 15,
            explanation: "The 'owner' field in create() sets the initial owner of the asset. By setting this to the recipient's address, you mint directly to their wallet.",
          },
        ],
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. DEFI BUILDING BLOCKS
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: "DeFi Building Blocks on Solana",
    slug: "defi-building-blocks-solana",
    description:
      "Deep dive into Token-2022, associated token accounts, AMM mechanics, and liquidity pool design. Build the mental models needed to work with Solana's DeFi ecosystem.",
    difficulty: "intermediate",
    track: "defi",
    durationHours: 9,
    instructorName: "Marina Silva",
    sections: [
      {
        name: "Token-2022 and the SPL Token Program",
        lessons: [
          {
            name: "Token-2022: The New Token Standard",
            xpReward: 75,
            description: `# Token-2022: The New Standard

Token-2022 (also called Token Extensions) is a superset of the original SPL Token Program. It adds powerful extensions to the mint and token account level without breaking backwards compatibility.

## Why Token-2022?

The original SPL Token Program is minimal by design. Extensions were impossible without deploying a new program. Token-2022 bakes extensibility into the protocol.

## Mint-Level Extensions
| Extension | Description |
|---|---|
| \`TransferFee\` | Deducts a fee on every transfer |
| \`NonTransferable\` | Makes a mint non-transferable (soulbound) |
| \`PermanentDelegate\` | An authority that can transfer/burn any holder's tokens |
| \`InterestBearingMint\` | Continuously accruing interest |
| \`MetadataPointer\` | Points to an on-chain metadata account |
| \`TransferHook\` | Executes a custom program on every transfer |
| \`ConfidentialTransfer\` | Hides transfer amounts using ZK proofs |

## Creating a Token-2022 Mint

\`\`\`typescript
import {
  TOKEN_2022_PROGRAM_ID,
  ExtensionType,
  getMintLen,
  createInitializeTransferFeeConfigInstruction,
  createInitializeMintInstruction,
} from "@solana/spl-token";

const extensions = [ExtensionType.TransferFeeConfig];
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
  createInitializeTransferFeeConfigInstruction(
    mintKeypair.publicKey,
    feeAuthority,
    withdrawAuthority,
    100,            // 1% fee in basis points
    BigInt(1_000_000),
    TOKEN_2022_PROGRAM_ID,
  ),
  createInitializeMintInstruction(
    mintKeypair.publicKey,
    6,
    mintAuthority,
    null,
    TOKEN_2022_PROGRAM_ID,
  ),
);
\`\`\`

## XP Token as NonTransferable

\`\`\`typescript
const extensions = [ExtensionType.NonTransferable];
// ...
createInitializeNonTransferableMintInstruction(
  mintKeypair.publicKey,
  TOKEN_2022_PROGRAM_ID,
)
\`\`\`

This makes the XP token soulbound — gamification that cannot be gamed by trading XP.

## Key Takeaways
- Token-2022 is backwards-compatible with SPL Token but adds mint/account extensions
- \`NonTransferable\` enables soulbound fungible tokens (perfect for XP)
- \`TransferHook\` enables custom logic on every transfer — very powerful for compliance and games
`,
          },
          {
            name: "Associated Token Accounts and Token Flows",
            xpReward: 65,
            description: `# Associated Token Accounts (ATAs)

Every user needs a token account for each mint they hold. An **Associated Token Account** is a deterministic token account address derived from the owner's wallet and the mint.

## ATA Derivation

\`\`\`typescript
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

const ata = getAssociatedTokenAddressSync(
  mintAddress,
  ownerAddress,
  false,               // allowOwnerOffCurve — true for PDAs
  TOKEN_2022_PROGRAM_ID,
);
\`\`\`

## Creating an ATA

\`\`\`typescript
import { createAssociatedTokenAccountIdempotentInstruction } from "@solana/spl-token";

const createAtaIx = createAssociatedTokenAccountIdempotentInstruction(
  payer.publicKey,
  ata,
  owner,
  mint,
  TOKEN_2022_PROGRAM_ID,
);
\`\`\`

Use \`idempotent\` — it won't fail if the ATA already exists.

## Token Transfer Flow

\`\`\`
Sender ATA ──transferChecked──▶ Recipient ATA
\`\`\`

\`\`\`typescript
import { transferChecked } from "@solana/spl-token";

await transferChecked(
  connection,
  payer,
  senderAta,
  mint,
  recipientAta,
  senderWallet,
  amount,
  decimals,      // prevents decimal mistakes
  [],
  { commitment: "confirmed" },
  TOKEN_2022_PROGRAM_ID,
);
\`\`\`

## ATA for PDAs

\`\`\`typescript
const vaultAta = getAssociatedTokenAddressSync(
  mint,
  vaultPda,
  true,  // PDA owner — off-curve
  TOKEN_2022_PROGRAM_ID,
);
\`\`\`

## Key Takeaways
- ATAs are deterministic — anyone can compute the address given wallet + mint
- Use \`createAssociatedTokenAccountIdempotent\` to safely create ATAs
- Always use \`transferChecked\` — it validates decimals
- PDAs can own ATAs; set \`allowOwnerOffCurve = true\`
`,
          },
        ],
      },
      {
        name: "AMMs and Liquidity",
        lessons: [
          {
            name: "Automated Market Makers: How They Work",
            xpReward: 85,
            description: `# Automated Market Makers (AMMs)

An AMM is a smart contract that prices assets algorithmically. Raydium, Orca, and Meteora are the dominant AMMs on Solana.

## The Constant Product Formula

The most common AMM formula is \`x * y = k\`:

\`\`\`
x = reserve of Token A
y = reserve of Token B
k = constant (invariant)
\`\`\`

When a trader swaps \`dx\` of Token A for \`dy\` of Token B:

\`\`\`
(x + dx) * (y - dy) = k
dy = (y * dx) / (x + dx)
\`\`\`

## Price Impact

Larger trades relative to pool size cause more **price impact** (slippage):

\`\`\`typescript
function priceImpact(dx: number, x: number, y: number): number {
  const dy = (y * dx) / (x + dx);
  const spotPrice = y / x;
  const executionPrice = dy / dx;
  return (spotPrice - executionPrice) / spotPrice;
}
\`\`\`

## Fees

Most AMMs charge 0.25–0.30% on every swap. Fees accrue to the pool reserves, increasing LP token value.

\`\`\`
effective_dx = dx * (1 - fee_rate)
dy = (y * effective_dx) / (x + effective_dx)
\`\`\`

## Impermanent Loss

LPs face **impermanent loss** when token prices diverge from deposit ratios:

\`\`\`
IL = 2 * sqrt(price_ratio) / (1 + price_ratio) - 1
\`\`\`

At 2x price divergence, IL ≈ -5.7%. At 4x, IL ≈ -20%.

## Concentrated Liquidity (CLMM)

Modern AMMs like Orca Whirlpools allow LPs to concentrate liquidity within a price range — earning more fees per dollar when price stays in range.

## Key Takeaways
- Constant product \`x * y = k\` is the foundation of most AMMs
- Larger trades cause more slippage; deep pools have less impact
- LPs earn fees but face impermanent loss risk
- CLMMs concentrate liquidity in ranges for higher capital efficiency
`,
          },
          {
            name: "Building a Token Vault and LP Position",
            xpReward: 80,
            description: `# Token Vaults and LP Positions

This lesson covers how to interact with Solana AMMs programmatically and how to build a simple token vault with Anchor.

## Reading Pool State (Orca Whirlpool)

\`\`\`typescript
import { WhirlpoolContext, buildWhirlpoolClient, ORCA_WHIRLPOOL_PROGRAM_ID } from "@orca-so/whirlpools-sdk";

const ctx = WhirlpoolContext.from(connection, wallet, ORCA_WHIRLPOOL_PROGRAM_ID);
const client = buildWhirlpoolClient(ctx);

const whirlpool = await client.getPool(whirlpoolAddress);
const poolData = whirlpool.getData();

console.log({
  sqrtPrice: poolData.sqrtPrice.toString(),
  liquidity: poolData.liquidity.toString(),
  feeRate: poolData.feeRate / 10000 + "%",
});
\`\`\`

## Building a Simple Token Vault (Anchor)

\`\`\`rust
#[program]
pub mod simple_vault {
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from:      ctx.accounts.user_token.to_account_info(),
                    to:        ctx.accounts.vault_token.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            amount,
        )?;
        ctx.accounts.vault_state.total_deposited += amount;
        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let seeds = &[b"vault", &[ctx.bumps.vault_authority]];
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from:      ctx.accounts.vault_token.to_account_info(),
                    to:        ctx.accounts.user_token.to_account_info(),
                    authority: ctx.accounts.vault_authority.to_account_info(),
                },
                &[seeds],
            ),
            amount,
        )?;
        ctx.accounts.vault_state.total_deposited -= amount;
        Ok(())
    }
}
\`\`\`

## Key Takeaways
- AMM SDKs abstract pool math; read pool state before interacting
- Liquidity positions have a tick range — wider = less fee income, lower IL risk
- Token vaults use PDA-controlled token accounts; the PDA signs via \`invoke_signed\`
- Always set slippage tolerance on swaps and deposits
`,
          },
        ],
      },
    ],
    quiz: {
      name: "DeFi Building Blocks Quiz",
      description: "Test your knowledge of Token-2022, ATAs, AMMs, and liquidity mechanics.",
      xpReward: 300,
      config: {
        type: "quiz",
        version: 1,
        intro: "Answer all questions. This quiz covers Token-2022 extensions, ATAs, AMM math, and vault design.",
        timeLimitMinutes: 15,
        passingScore: 45,
        questions: [
          {
            id: "q1",
            prompt: "Which Token-2022 extension makes a fungible token non-transferable?",
            options: [
              { id: "a", text: "TransferFee" },
              { id: "b", text: "NonTransferable" },
              { id: "c", text: "ImmutableOwner" },
              { id: "d", text: "PermanentDelegate" },
            ],
            correctOptionId: "b",
            points: 10,
            explanation: "NonTransferable is a mint-level extension that prevents all transfers — making it soulbound. Superteam Academy uses this for XP tokens.",
          },
          {
            id: "q2",
            prompt: "How is an Associated Token Account (ATA) address derived?",
            options: [
              { id: "a", text: "Randomly at creation time" },
              { id: "b", text: "From the owner's wallet address + mint address" },
              { id: "c", text: "From the owner's wallet address only" },
              { id: "d", text: "From the token program ID + mint address" },
            ],
            correctOptionId: "b",
            points: 10,
            explanation: "ATAs are PDAs derived from [owner, token_program_id, mint]. Given a wallet and mint, anyone can deterministically compute the ATA address.",
          },
          {
            id: "q3",
            prompt: "In a constant-product AMM, what happens to price impact as trade size increases relative to pool size?",
            options: [
              { id: "a", text: "Price impact decreases" },
              { id: "b", text: "Price impact stays constant" },
              { id: "c", text: "Price impact increases" },
              { id: "d", text: "Price impact becomes negative" },
            ],
            correctOptionId: "c",
            points: 15,
            explanation: "In x*y=k, larger trades shift the pool ratio more, meaning each token is priced progressively worse for the buyer — larger trade = higher price impact.",
          },
          {
            id: "q4",
            prompt: "What does 'impermanent loss' refer to in the context of AMM liquidity provision?",
            options: [
              { id: "a", text: "The fees paid on every swap" },
              { id: "b", text: "The value loss compared to simply holding when token prices diverge" },
              { id: "c", text: "The gas cost of opening a position" },
              { id: "d", text: "The loss from a smart contract exploit" },
            ],
            correctOptionId: "b",
            points: 15,
            explanation: "Impermanent loss is the opportunity cost compared to holding when prices diverge from the deposit ratio. It reverses if prices return to the original ratio.",
          },
          {
            id: "q5",
            prompt: "When a program PDA needs to own a token account (ATA), what must you set?",
            options: [
              { id: "a", text: "allowOwnerOffCurve = true" },
              { id: "b", text: "allowOwnerOffCurve = false" },
              { id: "c", text: "executable = true on the PDA" },
              { id: "d", text: "Nothing — ATAs always support PDA owners" },
            ],
            correctOptionId: "a",
            points: 10,
            explanation: "PDAs are off-curve addresses. Setting allowOwnerOffCurve = true tells the ATA derivation function to allow off-curve owners.",
          },
          {
            id: "q6",
            prompt: "Why use createAssociatedTokenAccountIdempotent instead of createAssociatedTokenAccount?",
            options: [
              { id: "a", text: "It creates the account with more lamports" },
              { id: "b", text: "It succeeds even if the ATA already exists, preventing transaction failures" },
              { id: "c", text: "It works with the legacy Token Program only" },
              { id: "d", text: "It skips rent-exemption checks" },
            ],
            correctOptionId: "b",
            points: 10,
            explanation: "createAssociatedTokenAccountIdempotent doesn't fail if the ATA already exists — essential for production code where you can't guarantee account state.",
          },
        ],
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. SOLANA SECURITY
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: "Solana Security Essentials",
    slug: "solana-security-essentials",
    description:
      "Learn to identify and prevent the most critical Solana program vulnerabilities. Covers account validation, authority checks, arithmetic safety, CPI risks, and a security-first audit mindset.",
    difficulty: "advanced",
    track: "security",
    durationHours: 7,
    instructorName: "Rafael Moreira",
    sections: [
      {
        name: "Account Validation Vulnerabilities",
        lessons: [
          {
            name: "Missing Signer and Ownership Checks",
            xpReward: 80,
            description: `# Missing Signer and Ownership Checks

The most exploited class of Solana vulnerabilities involves failing to validate accounts passed into an instruction.

## Vulnerability 1: Missing Signer Check

\`\`\`rust
// ❌ VULNERABLE — anyone can call this
pub struct Withdraw<'info> {
    pub authority: AccountInfo<'info>,  // NOT enforced as signer
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
}
\`\`\`

\`\`\`rust
// ✅ FIXED
pub struct Withdraw<'info> {
    pub authority: Signer<'info>,                // enforces signature
    #[account(mut, has_one = authority)]
    pub vault_state: Account<'info, VaultState>, // validates relationship
}
\`\`\`

## Vulnerability 2: Missing Owner Check

\`\`\`rust
// ❌ VULNERABLE — attacker can pass a fake config account
pub state: AccountInfo<'info>,

// ✅ FIXED — Anchor checks owner = this program
pub state: Account<'info, Config>,
\`\`\`

## Vulnerability 3: Arbitrary CPI

\`\`\`rust
// ❌ VULNERABLE — token_program can be any account
pub token_program: AccountInfo<'info>,

// ✅ FIXED — verifies it's the real Token Program
pub token_program: Program<'info, Token>,
\`\`\`

## Anchor's Built-in Protections
- \`Signer<'info>\` — verifies the account signed the transaction
- \`Account<'info, T>\` — verifies owner is the program + checks discriminator
- \`Program<'info, T>\` — verifies it's the correct program
- \`has_one = field\` — verifies cross-account relationships
- \`constraint = expr\` — custom validation logic

## Key Takeaways
- Always use \`Signer<'info>\` for accounts that must sign
- Use \`Account<'info, T>\` not \`AccountInfo\` for program-owned accounts
- Use \`Program<'info, T>\` for program references
- \`has_one\` constraints verify relationships between accounts
`,
          },
          {
            name: "PDA Bumps, Re-Initialisation, and Account Confusion",
            xpReward: 85,
            description: `# PDA Security: Bumps, Re-Init, and Confusion

## Vulnerability 1: Non-Canonical Bump

\`\`\`rust
// ❌ VULNERABLE — accepts caller-supplied bump
pub fn initialize(ctx: Context<Init>, bump: u8) -> Result<()> {
    ctx.accounts.state.bump = bump; // attacker controls this
    Ok(())
}
\`\`\`

\`\`\`rust
// ✅ FIXED — Anchor finds and stores canonical bump
#[account(
    init, payer = authority, space = 8 + State::LEN,
    seeds = [b"state"], bump,
)]
pub state: Account<'info, State>,

// In handler:
ctx.accounts.state.bump = ctx.bumps.state;
\`\`\`

## Vulnerability 2: Re-Initialisation Attack

If init seeds are not unique per user, an attacker can create a collision. Always use user-specific seeds:

\`\`\`rust
// ✅ unique per user
#[account(
    init, payer = user,
    seeds = [b"vault", user.key().as_ref()],
    bump,
    space = 8 + Vault::LEN,
)]
pub vault: Account<'info, Vault>,
\`\`\`

## Vulnerability 3: Account Type Confusion

Two structs with identical first fields — attacker passes the wrong type.

Anchor's discriminator prevents this when using \`Account<'info, T>\`:
\`\`\`
discriminator = sha256("account:Position")[..8]
\`\`\`

Never deserialise raw \`AccountInfo\` unless you manually check the discriminator.

## Security Checklist for PDAs
- [ ] Use canonical bump (\`ctx.bumps.account_name\`)
- [ ] Store canonical bump in account data
- [ ] Verify bump on re-use: \`bump = state.bump\`
- [ ] Seeds unique enough to prevent collisions between users
- [ ] Use \`Account<'info, T>\` not \`AccountInfo\`

## Key Takeaways
- The canonical bump is the security boundary — non-canonical bumps create separate, attacker-controlled accounts
- Store and verify the canonical bump on every instruction
- Anchor's typed \`Account<'info, T>\` prevents type confusion via discriminator checks
`,
          },
        ],
      },
      {
        name: "Arithmetic and Logic Safety",
        lessons: [
          {
            name: "Integer Overflow, Rounding, and Arithmetic Safety",
            xpReward: 80,
            description: `# Arithmetic Safety in Solana Programs

## Rust's Default Behaviour

In **release** builds (what you deploy), Rust **wraps** on overflow by default:

\`\`\`rust
let x: u64 = u64::MAX;
let y = x + 1;  // wraps to 0 — no panic!
\`\`\`

## Safe Arithmetic

\`\`\`rust
// ❌ RISKY
let total = user_amount + fee_amount;

// ✅ SAFE
let total = user_amount
    .checked_add(fee_amount)
    .ok_or(ErrorCode::MathOverflow)?;

let fee = amount
    .checked_mul(fee_rate)?
    .checked_div(10_000)?;
\`\`\`

## Rounding Direction Matters

In DeFi, always round in the **protocol's favour**:

\`\`\`rust
// When collecting fees: round UP
let fee = (amount * fee_rate + 9_999) / 10_000;

// When paying out: round DOWN
let payout = (shares * total_assets) / total_shares;
\`\`\`

## Use u128 for Intermediate Values

\`\`\`rust
// ❌ OVERFLOW for large amounts
let reward = user_shares * reward_per_share / PRECISION;

// ✅ Safe intermediate u128
let reward = (user_shares as u128)
    .checked_mul(reward_per_share as u128)?
    .checked_div(PRECISION)?
    as u64;
\`\`\`

## Key Takeaways
- Release builds wrap on overflow — use checked arithmetic everywhere
- Round fees up, payouts down — always in the protocol's favour
- Use u128 fixed-point for DeFi math; never use floats
`,
          },
          {
            name: "Reentrancy, CPI Risks, and State Machine Design",
            xpReward: 90,
            description: `# Reentrancy and CPI Risks

## Checks-Effects-Interactions Pattern

The universal defence: perform all state changes **before** external calls:

\`\`\`rust
// ✅ SAFE — Checks → Effects → Interactions
pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    // 1. CHECKS
    require!(amount > 0, ErrorCode::ZeroAmount);
    require!(ctx.accounts.state.deposited >= amount, ErrorCode::InsufficientFunds);

    // 2. EFFECTS — update state BEFORE external transfer
    ctx.accounts.state.deposited = ctx.accounts.state.deposited
        .checked_sub(amount)
        .ok_or(ErrorCode::MathOverflow)?;

    // 3. INTERACTIONS — external call LAST
    token::transfer(ctx.accounts.into_transfer_cpi(), amount)?;

    Ok(())
}
\`\`\`

## Flash Loan / Oracle Manipulation

\`\`\`rust
// ❌ VULNERABLE — spot price can be manipulated in same tx
let price = get_spot_price_from_amm(pool)?;

// ✅ FIXED — use TWAP (time-weighted average)
let price = get_twap_price(oracle)?;
\`\`\`

## State Machine Design

Model your program state as an explicit state machine:

\`\`\`rust
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum AuctionState { Active, Ended, Claimed }

pub fn claim(ctx: Context<Claim>) -> Result<()> {
    require!(
        ctx.accounts.auction.state == AuctionState::Ended,
        ErrorCode::InvalidState
    );
    ctx.accounts.auction.state = AuctionState::Claimed;
    // ... transfer
}
\`\`\`

## Security Checklist
- [ ] Checks-Effects-Interactions order in every instruction
- [ ] State updated before any CPI
- [ ] No oracle reads from AMM spot price in same transaction
- [ ] Explicit state machine for multi-step flows

## Key Takeaways
- Always: validate → update state → call external programs
- Flash loans manipulate spot prices within a single tx; use TWAPs
- Model complex flows as state machines with explicit valid transitions
`,
          },
        ],
      },
    ],
    quiz: {
      name: "Solana Security Quiz",
      description: "Test your knowledge of common Solana vulnerabilities and mitigation strategies.",
      xpReward: 350,
      config: {
        type: "quiz",
        version: 1,
        intro: "This quiz covers account validation, PDA security, arithmetic safety, and reentrancy. One correct answer per question.",
        timeLimitMinutes: 18,
        passingScore: 50,
        questions: [
          {
            id: "q1",
            prompt: "What is the primary difference between Signer<'info> and AccountInfo<'info> in Anchor?",
            options: [
              { id: "a", text: "Signer accounts are read-only; AccountInfo can be written to" },
              { id: "b", text: "Signer enforces that the account signed the transaction; AccountInfo has no such check" },
              { id: "c", text: "Signer accounts must be owned by the program; AccountInfo can be owned by anyone" },
              { id: "d", text: "There is no difference — they are interchangeable" },
            ],
            correctOptionId: "b",
            points: 10,
            explanation: "Signer<'info> verifies the account's signature is present in the transaction. AccountInfo does no validation — it's just a raw account reference.",
          },
          {
            id: "q2",
            prompt: "How does Anchor's Account<'info, T> prevent account type confusion attacks?",
            options: [
              { id: "a", text: "It checks the account's lamport balance" },
              { id: "b", text: "It verifies the 8-byte discriminator matches the expected struct type" },
              { id: "c", text: "It checks the account's data length" },
              { id: "d", text: "It compares the account's public key to a whitelist" },
            ],
            correctOptionId: "b",
            points: 15,
            explanation: "Anchor prepends an 8-byte hash of the type name as a discriminator. Account<'info, T> checks this before deserialising, preventing a malicious actor from passing a different account type.",
          },
          {
            id: "q3",
            prompt: "What is the non-canonical bump vulnerability?",
            options: [
              { id: "a", text: "Using bump=255 always, ignoring the search" },
              { id: "b", text: "Accepting a caller-supplied bump that creates a different PDA from the same seeds" },
              { id: "c", text: "Forgetting to store the bump in account data" },
              { id: "d", text: "Deriving PDAs with too many seeds" },
            ],
            correctOptionId: "b",
            points: 15,
            explanation: "If your program accepts a bump argument from the caller, they can pass a non-canonical bump to derive a different valid off-curve PDA with the same seeds — effectively a second attacker-controlled 'state' account.",
          },
          {
            id: "q4",
            prompt: "In Rust release builds, what happens when a u64 overflows without checked arithmetic?",
            options: [
              { id: "a", text: "The program panics and the transaction fails" },
              { id: "b", text: "The value wraps around (e.g., u64::MAX + 1 = 0)" },
              { id: "c", text: "The value saturates at u64::MAX" },
              { id: "d", text: "The compiler rejects the code" },
            ],
            correctOptionId: "b",
            points: 10,
            explanation: "In Rust release builds, integer overflow wraps silently. This is why checked_add, checked_mul, etc. are essential for all arithmetic in Solana programs.",
          },
          {
            id: "q5",
            prompt: "What is the Checks-Effects-Interactions pattern?",
            options: [
              { id: "a", text: "A UI design pattern for Solana frontends" },
              { id: "b", text: "Validate inputs → update state → make external calls; prevents stale state after CPIs" },
              { id: "c", text: "A Rust macro for account validation" },
              { id: "d", text: "A testing methodology for Anchor programs" },
            ],
            correctOptionId: "b",
            points: 20,
            explanation: "CEI means: (1) validate all conditions, (2) update internal state, (3) make external CPIs. This ensures state reflects the change before any external call.",
          },
          {
            id: "q6",
            prompt: "Why should you use TWAP instead of AMM spot price in lending protocols?",
            options: [
              { id: "a", text: "TWAP is cheaper to compute on-chain" },
              { id: "b", text: "Spot price can be manipulated within a single transaction using flash loans" },
              { id: "c", text: "TWAP is more accurate for very small trades" },
              { id: "d", text: "AMM spot price doesn't include fees" },
            ],
            correctOptionId: "b",
            points: 20,
            explanation: "A flash loan can manipulate an AMM's spot price within the same transaction. TWAP uses an average over many blocks, making manipulation prohibitively expensive.",
          },
        ],
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. SOLANA FRONTEND
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: "Solana Frontend Integrations",
    slug: "solana-frontend-integrations",
    description:
      "Build production-ready Solana frontends with wallet adapters, transaction feedback, RPC data fetching, and real-time account subscriptions. Learn patterns used in top Solana dApps.",
    difficulty: "intermediate",
    track: "frontend",
    durationHours: 6,
    instructorName: "Camila Souza",
    sections: [
      {
        name: "Wallet Adapter and Connection",
        lessons: [
          {
            name: "Wallet Adapter: Setup, Connection, and Signing",
            xpReward: 65,
            description: `# Wallet Adapter

The Solana Wallet Adapter is the standard library for connecting browser wallets (Phantom, Solflare, Backpack, etc.) to your dApp.

## Provider Setup (Next.js App Router)

\`\`\`tsx
"use client";
import { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import "@solana/wallet-adapter-react-ui/styles.css";

export function WalletProviders({ children }: { children: React.ReactNode }) {
  const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL!;
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
\`\`\`

## Using Wallet State

\`\`\`tsx
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export function WalletStatus() {
  const { publicKey, connected, disconnect } = useWallet();

  if (!connected) return <WalletMultiButton />;

  return (
    <div>
      <p>Connected: {publicKey!.toBase58().slice(0, 8)}...</p>
      <button onClick={disconnect}>Disconnect</button>
    </div>
  );
}
\`\`\`

## Signing a Transaction

\`\`\`tsx
const { publicKey, sendTransaction } = useWallet();
const { connection } = useConnection();

async function handleSend() {
  if (!publicKey) return;
  const { blockhash } = await connection.getLatestBlockhash();
  const tx = new Transaction({ recentBlockhash: blockhash, feePayer: publicKey })
    .add(SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: recipient, lamports: 0.01 * LAMPORTS_PER_SOL }));

  const signature = await sendTransaction(tx, connection);
  await connection.confirmTransaction(signature, "confirmed");
}
\`\`\`

## Signing a Message (Auth)

\`\`\`tsx
const { signMessage } = useWallet();

async function signForAuth(nonce: string) {
  const message = new TextEncoder().encode(\`Sign in\\n\\nNonce: \${nonce}\`);
  const signature = await signMessage!(message);
  return bs58.encode(signature);
}
\`\`\`

## Key Takeaways
- \`ConnectionProvider\` manages RPC; \`WalletProvider\` manages wallet state
- \`useWallet()\` exposes \`publicKey\`, \`sendTransaction\`, \`signMessage\`, etc.
- \`sendTransaction\` handles signing + submission; you handle confirmation
- Always check \`publicKey\` before use — user may disconnect
`,
          },
          {
            name: "Transaction UX: Feedback, Errors, and Confirmation",
            xpReward: 65,
            description: `# Transaction UX

Great transaction UX is the difference between a dApp users trust and one they abandon.

## Transaction States

\`\`\`
IDLE → PREPARING → AWAITING_SIGNATURE → SUBMITTED → CONFIRMING → CONFIRMED / FAILED
\`\`\`

## Confirmation with Expiry Detection

\`\`\`typescript
const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("finalized");

const signature = await sendTransaction(tx, connection);

const result = await connection.confirmTransaction({
  signature,
  blockhash,
  lastValidBlockHeight,  // SDK detects expiry without hanging
}, "confirmed");

if (result.value.err) throw new Error("Transaction failed");
\`\`\`

## React Hook for Transaction State

\`\`\`tsx
type TxStatus = "idle" | "signing" | "confirming" | "success" | "error";

export function useTransaction() {
  const [status, setStatus] = useState<TxStatus>("idle");
  const { sendTransaction } = useWallet();
  const { connection } = useConnection();

  async function execute(buildTx: () => Promise<Transaction>) {
    setStatus("signing");
    try {
      const tx = await buildTx();
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      setStatus("confirming");
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight });
      setStatus("success");
      return sig;
    } catch (err) {
      setStatus("error");
      throw err;
    } finally {
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  return { status, execute };
}
\`\`\`

## Parsing Error Messages

\`\`\`typescript
function parseTransactionError(err: unknown): string {
  if (err instanceof Error) {
    if (err.message.includes("User rejected")) return "Transaction cancelled";
    if (err.message.includes("Blockhash not found")) return "Transaction expired — please retry";
    const match = err.message.match(/custom program error: (0x[0-9a-f]+)/i);
    if (match) return \`Program error: \${parseInt(match[1])}\`;
  }
  return "Unknown error";
}
\`\`\`

## Key Takeaways
- Use \`{ signature, blockhash, lastValidBlockHeight }\` to detect expiry correctly
- Parse error messages to give actionable feedback, not raw hex codes
- "Blockhash not found" = expired; guide user to retry
`,
          },
        ],
      },
      {
        name: "Data Fetching and Real-Time Updates",
        lessons: [
          {
            name: "Reading On-Chain Data: RPC, Subscriptions, and Indexers",
            xpReward: 75,
            description: `# Reading On-Chain Data

## Direct RPC Reads

\`\`\`typescript
// SOL balance
const lamports = await connection.getBalance(publicKey);

// Account data
const accountInfo = await connection.getAccountInfo(publicKey);

// Batch read multiple accounts
const accounts = await connection.getMultipleAccountsInfo([addr1, addr2, addr3]);
\`\`\`

## Reading Token Balances (Token-2022)

\`\`\`typescript
import { getAccount, getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

const ata = getAssociatedTokenAddressSync(mint, owner, false, TOKEN_2022_PROGRAM_ID);
const tokenAccount = await getAccount(connection, ata, "confirmed", TOKEN_2022_PROGRAM_ID);
console.log("Balance:", tokenAccount.amount.toString());
\`\`\`

## Reading Anchor Program Accounts

\`\`\`typescript
const program = new Program(idl, provider);

// Single account
const [pda] = PublicKey.findProgramAddressSync([Buffer.from("state"), user.toBuffer()], program.programId);
const state = await program.account.userState.fetch(pda);

// All accounts with filter
const allStates = await program.account.userState.all([
  { memcmp: { offset: 8, bytes: user.toBase58() } },
]);
\`\`\`

## Real-Time Account Subscriptions

\`\`\`tsx
useEffect(() => {
  if (!wallet) return;

  // Subscribe to account changes
  const id = connection.onAccountChange(tokenAccount, (info) => {
    const parsed = AccountLayout.decode(info.data);
    setBalance(parsed.amount);
  });

  return () => { connection.removeAccountChangeListener(id); };
}, [wallet, connection]);
\`\`\`

## Helius Indexer (Complex Queries)

\`\`\`typescript
// Get all NFTs owned by a wallet (DAS API)
const response = await fetch(\`https://mainnet.helius-rpc.com/?api-key=\${API_KEY}\`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    jsonrpc: "2.0", id: "1", method: "getAssetsByOwner",
    params: { ownerAddress: wallet.toBase58(), page: 1, limit: 100 },
  }),
});
\`\`\`

## Key Takeaways
- \`getMultipleAccountsInfo\` batches N reads into one RPC request
- \`connection.onAccountChange\` provides WebSocket subscriptions for real-time updates
- Use Anchor's \`program.account.Type.all()\` with \`memcmp\` filters for efficient queries
- For complex queries (all NFTs, history), Helius DAS API is far more efficient than RPC
`,
          },
        ],
      },
    ],
    quiz: {
      name: "Solana Frontend Quiz",
      description: "Test your knowledge of wallet adapters, transaction UX, and on-chain data fetching.",
      xpReward: 250,
      config: {
        type: "quiz",
        version: 1,
        intro: "One correct answer per question. This quiz covers Solana frontend patterns.",
        timeLimitMinutes: 12,
        passingScore: 35,
        questions: [
          {
            id: "q1",
            prompt: "Which hook provides the Solana RPC connection in a wallet-adapter component?",
            options: [
              { id: "a", text: "useWallet()" },
              { id: "b", text: "useConnection()" },
              { id: "c", text: "useRpc()" },
              { id: "d", text: "useSolana()" },
            ],
            correctOptionId: "b",
            points: 10,
            explanation: "useConnection() returns { connection } from the ConnectionProvider. useWallet() gives wallet state — they are separate concerns.",
          },
          {
            id: "q2",
            prompt: "Why should you use { signature, blockhash, lastValidBlockHeight } when calling confirmTransaction?",
            options: [
              { id: "a", text: "It's required by the TypeScript types" },
              { id: "b", text: "It allows the SDK to detect transaction expiry and avoid hanging indefinitely" },
              { id: "c", text: "It speeds up confirmation by skipping finality checks" },
              { id: "d", text: "It works with legacy transactions only" },
            ],
            correctOptionId: "b",
            points: 10,
            explanation: "This form monitors the blockhash expiry. If block height exceeds lastValidBlockHeight before confirmation, it throws — preventing UI from hanging on expired transactions.",
          },
          {
            id: "q3",
            prompt: "What does getMultipleAccountsInfo offer over multiple getAccountInfo calls?",
            options: [
              { id: "a", text: "It returns decoded Anchor account data automatically" },
              { id: "b", text: "It batches all reads into a single RPC request, reducing latency and rate-limit usage" },
              { id: "c", text: "It subscribes to account changes automatically" },
              { id: "d", text: "It bypasses the need for an RPC URL" },
            ],
            correctOptionId: "b",
            points: 10,
            explanation: "getMultipleAccountsInfo sends one HTTP request for N accounts versus N separate requests, dramatically reducing latency and rate-limit pressure.",
          },
          {
            id: "q4",
            prompt: "When should you set autoConnect=true on WalletProvider?",
            options: [
              { id: "a", text: "Never — it breaks wallet sign-out" },
              { id: "b", text: "Always — it's required for the provider to work" },
              { id: "c", text: "When you want the wallet to reconnect automatically on page reload if previously connected" },
              { id: "d", text: "Only on localhost development" },
            ],
            correctOptionId: "c",
            points: 10,
            explanation: "autoConnect=true causes the WalletProvider to automatically reconnect to the previously used wallet on page load if permission was granted — improves UX for returning users.",
          },
          {
            id: "q5",
            prompt: "How do you subscribe to real-time changes on a Solana account?",
            options: [
              { id: "a", text: "connection.pollAccount() with an interval" },
              { id: "b", text: "connection.onAccountChange(address, callback)" },
              { id: "c", text: "useAccountQuery(address)" },
              { id: "d", text: "connection.watchAccount(address)" },
            ],
            correctOptionId: "b",
            points: 10,
            explanation: "connection.onAccountChange opens a WebSocket subscription. Always return connection.removeAccountChangeListener(id) in useEffect cleanup.",
          },
          {
            id: "q6",
            prompt: "What user-facing error message should you show when a transaction fails with 'Blockhash not found'?",
            options: [
              { id: "a", text: "'Transaction failed — contact support'" },
              { id: "b", text: "'Incorrect blockhash — check your wallet'" },
              { id: "c", text: "'Transaction expired — please retry'" },
              { id: "d", text: "'Network congestion — wait 10 minutes'" },
            ],
            correctOptionId: "c",
            points: 10,
            explanation: "'Blockhash not found' means the transaction wasn't included before the blockhash expired (~60s). The user should simply retry — it's not an error they caused.",
          },
        ],
      },
    },
  },
]

async function seedCourses() {
  console.log("Seeding courses...")

  try {
    const slugs = courses.map((course) => course.slug)
    await db.delete(CourseTable).where(inArray(CourseTable.slug, slugs))

    for (const course of courses) {
      const lessonXpTotal = course.sections.reduce(
        (total, section) =>
          total + section.lessons.reduce((sum, lesson) => sum + lesson.xpReward, 0),
        0
      )
      const totalXp = lessonXpTotal + course.quiz.xpReward

      const [insertedCourse] = await db
        .insert(CourseTable)
        .values({
          name: course.name,
          slug: course.slug,
          onchainCourseId: (course.onchainCourseId ?? course.slug).slice(0, 32),
          description: course.description,
          difficulty: course.difficulty,
          track: course.track,
          durationHours: course.durationHours,
          xpReward: totalXp,
          instructorName: course.instructorName,
          thumbnailUrl: null,
        })
        .returning()

      if (!insertedCourse) {
        throw new Error(`Failed to insert course: ${course.name}`)
      }

      for (const [sectionIndex, section] of course.sections.entries()) {
        const [insertedSection] = await db
          .insert(CourseSectionTable)
          .values({
            name: section.name,
            status: "public",
            order: sectionIndex,
            courseId: insertedCourse.id,
          })
          .returning()

        if (!insertedSection) {
          throw new Error(`Failed to insert section: ${section.name}`)
        }

        for (const [lessonIndex, lesson] of section.lessons.entries()) {
          await db.insert(LessonTable).values({
            name: lesson.name,
            description: lesson.description,
            xpReward: lesson.xpReward,
            order: lessonIndex,
            status: "public",
            sectionId: insertedSection.id,
            youtubeVideoId: null,
          })
        }
      }

      const quizPoints = getQuizTotalPoints(course.quiz.config)
      await db.insert(AssignmentTable).values({
        name: course.quiz.name,
        description: course.quiz.description,
        instructions: serializeQuizConfig(course.quiz.config),
        dueDate: null,
        maxScore: quizPoints,
        xpReward: course.quiz.xpReward,
        status: "published",
        courseId: insertedCourse.id,
        sectionId: null,
        allowLateSubmissions: true,
        order: 0,
      })

      console.log(`✅ ${course.name} — ${totalXp} XP total`)
    }

    console.log("\n✅ All courses, lessons, and quizzes seeded successfully!")
  } catch (error) {
    console.error("❌ Error seeding courses:", error)
  } finally {
    process.exit(0)
  }
}

seedCourses()
