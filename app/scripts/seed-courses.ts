/**
 * Sanity seed script — creates 5 courses with lessons across 2 modules.
 *
 * Usage:
 *   SANITY_TOKEN=<write-token> npx tsx scripts/seed-courses.ts
 *
 * Course structure:
 *   Module 1: "Solana Fundamentals" → 3 courses (beginner → intermediate)
 *   Module 2: "Anchor & Program Development" → 2 courses (intermediate → advanced)
 *
 * Each course has 4–6 lessons of mixed types: reading, code, video, quiz, game.
 */

import { createClient } from "@sanity/client";

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "w6jf4efn",
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "dev",
    token: process.env.SANITY_TOKEN,
    useCdn: false,
    apiVersion: "2024-01-01",
});

// ─── Helpers ────────────────────────────────────────────

function slug(str: string) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function ref(id: string) {
    return { _type: "reference", _ref: id };
}

function key() {
    return Math.random().toString(36).slice(2, 10);
}

// ─── Instructor ─────────────────────────────────────────

const instructor = {
    _id: "instructor-superteam",
    _type: "instructor",
    name: "Superteam Brazil",
    bio: "The Superteam Brazil collective — builders, educators, and Solana core contributors driving Web3 adoption across Latin America.",
};

// ─── Games ──────────────────────────────────────────────

const games = [
    {
        _id: "game-token-toss",
        _type: "game",
        gameId: { _type: "slug", current: "token-toss" },
        title: "Token Toss",
        description: "A physics-based game where you learn SPL token mechanics by tossing tokens at targets.",
        engineType: "scriblmotion",
        configJson: JSON.stringify({ scene: "token-toss-v1", difficulty: "easy" }),
        xpReward: 30,
        difficulty: "beginner",
        requiredScore: 60,
        tags: ["tokens", "spl", "interactive"],
    },
    {
        _id: "game-pda-maze",
        _type: "game",
        gameId: { _type: "slug", current: "pda-maze" },
        title: "PDA Maze",
        description: "Navigate a maze where each door opens only with the correct PDA derivation.",
        engineType: "iframe",
        embedUrl: "https://superteam-games.vercel.app/pda-maze",
        xpReward: 50,
        difficulty: "intermediate",
        requiredScore: 70,
        tags: ["pda", "accounts", "puzzle"],
    },
];

// ─── Lessons ────────────────────────────────────────────
// COURSE 1: Blockchain Basics
const c1Lessons = [
    {
        _id: "lesson-c1-1",
        _type: "lesson",
        id: { _type: "slug", current: "what-is-blockchain" },
        title: "What is Blockchain?",
        type: "reading",
        duration: "8min",
        xp: 15,
        content: `# What is Blockchain?

A blockchain is a distributed, immutable ledger that records transactions across a network of computers.

## Key Properties

- **Decentralization** — No single point of control
- **Immutability** — Once written, data cannot be altered
- **Transparency** — All participants can verify transactions
- **Consensus** — Network agrees on the state through algorithms

## How Solana Differs

Solana introduces **Proof of History (PoH)**, a cryptographic clock that sequences events before consensus, enabling ~400ms block times and 65,000 TPS.

> Think of PoH as a verifiable timestamp that proves a specific moment in time occurred before another — without waiting for the whole network to agree first.`,
    },
    {
        _id: "lesson-c1-2",
        _type: "lesson",
        id: { _type: "slug", current: "solana-architecture-video" },
        title: "Solana Architecture Deep Dive",
        type: "video",
        duration: "15min",
        xp: 20,
        content: `# Solana Architecture

Watch this overview of Solana's architecture, then answer the quiz below.

📺 **Video**: [Solana Architecture Explained](https://www.youtube.com/watch?v=AYDL0cVGuGo)

## Key Takeaways
- Validators, leaders, and the Tower BFT consensus
- How Gulf Stream eliminates the mempool
- Turbine — block propagation protocol
- Sealevel — parallel smart contract runtime`,
    },
    {
        _id: "lesson-c1-3",
        _type: "lesson",
        id: { _type: "slug", current: "first-transaction" },
        title: "Your First Transaction",
        type: "code",
        duration: "12min",
        xp: 25,
        content: `# Send Your First SOL Transaction

In this challenge, you'll write code to send SOL from one wallet to another on devnet.`,
        language: "typescript",
        initialCode: `import { Connection, PublicKey, SystemProgram, Transaction, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com");

// TODO: Create a transaction that sends 0.01 SOL to the recipient
const sender = Keypair.generate();
const recipient = new PublicKey("11111111111111111111111111111111");

async function sendSol() {
    // Your code here

}

sendSol();`,
        solutionCode: `import { Connection, PublicKey, SystemProgram, Transaction, Keypair, LAMPORTS_PER_SOL, sendAndConfirmTransaction } from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com");
const sender = Keypair.generate();
const recipient = new PublicKey("11111111111111111111111111111111");

async function sendSol() {
    // Airdrop SOL to sender
    const airdropSig = await connection.requestAirdrop(sender.publicKey, LAMPORTS_PER_SOL);
    await connection.confirmTransaction(airdropSig);

    // Create transfer transaction
    const tx = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: sender.publicKey,
            toPubkey: recipient,
            lamports: 0.01 * LAMPORTS_PER_SOL,
        })
    );

    const sig = await sendAndConfirmTransaction(connection, tx, [sender]);
    console.log("Transaction signature:", sig);
}

sendSol();`,
        testCases: [
            "Transaction should include a SystemProgram.transfer instruction",
            "Transfer amount should be 0.01 SOL (10_000_000 lamports)",
            "Transaction should be signed by the sender",
        ],
        hints: [
            "Use SystemProgram.transfer() to create the instruction",
            "1 SOL = 1_000_000_000 lamports (LAMPORTS_PER_SOL)",
        ],
    },
    {
        _id: "lesson-c1-4",
        _type: "lesson",
        id: { _type: "slug", current: "token-toss-game" },
        title: "Token Toss Challenge",
        type: "game",
        duration: "10min",
        xp: 30,
        content: `# Token Toss 🎯

Put your SPL token knowledge to the test! Toss tokens at the right targets to earn points.

Complete the game with a score of 60% or higher to earn XP.`,
        game: ref("game-token-toss"),
    },
];

// COURSE 2: Wallets & Accounts
const c2Lessons = [
    {
        _id: "lesson-c2-1",
        _type: "lesson",
        id: { _type: "slug", current: "solana-account-model" },
        title: "The Solana Account Model",
        type: "reading",
        duration: "10min",
        xp: 15,
        content: `# The Solana Account Model

Everything on Solana is an **account**. Understanding the account model is fundamental.

## Account Types

| Type | Owner | Purpose |
|---|---|---|
| System Account | System Program | Holds SOL balance |
| Program Account | BPF Loader | Contains executable code |
| Data Account | A Program | Stores program state |
| Token Account | Token Program | Holds SPL tokens |

## Key Concepts

- Accounts have a fixed size set at creation
- Programs are stateless — they read/write to separate data accounts
- Every account has an **owner** program that controls it
- Rent: accounts must maintain a minimum SOL balance (rent-exempt threshold)`,
    },
    {
        _id: "lesson-c2-2",
        _type: "lesson",
        id: { _type: "slug", current: "wallets-keypairs-video" },
        title: "Wallets & Keypairs",
        type: "video",
        duration: "12min",
        xp: 20,
        content: `# Wallets & Keypairs

Learn how Solana wallets work under the hood.

📺 **Video**: [Understanding Solana Wallets](https://www.youtube.com/watch?v=pNzT3hgFbpg)

## What You'll Learn
- Ed25519 key pairs (public key + secret key)
- How Phantom and Solflare derive wallet addresses
- HD wallets and derivation paths (BIP-44)
- Message signing for authentication`,
    },
    {
        _id: "lesson-c2-3",
        _type: "lesson",
        id: { _type: "slug", current: "create-token-account" },
        title: "Create a Token Account",
        type: "code",
        duration: "15min",
        xp: 30,
        content: `# Create an SPL Token Account

Write code to create an associated token account (ATA) for a given mint.`,
        language: "typescript",
        initialCode: `import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";

const connection = new Connection("https://api.devnet.solana.com");
const payer = Keypair.generate();
const mint = new PublicKey("So11111111111111111111111111111111111111112"); // Wrapped SOL

// TODO: Create an associated token account for this mint

async function createATA() {
    // Your code here
}

createATA();`,
        solutionCode: `import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";

const connection = new Connection("https://api.devnet.solana.com");
const payer = Keypair.generate();
const mint = new PublicKey("So11111111111111111111111111111111111111112");

async function createATA() {
    const airdropSig = await connection.requestAirdrop(payer.publicKey, LAMPORTS_PER_SOL);
    await connection.confirmTransaction(airdropSig);

    const ata = await getOrCreateAssociatedTokenAccount(
        connection,
        payer,
        mint,
        payer.publicKey
    );

    console.log("ATA Address:", ata.address.toBase58());
    return ata;
}

createATA();`,
        testCases: [
            "Should call getOrCreateAssociatedTokenAccount",
            "Should pass the correct mint address",
            "Should return an account with a valid address",
        ],
        hints: [
            "Import getOrCreateAssociatedTokenAccount from @solana/spl-token",
            "The function needs: connection, payer, mint, and owner",
        ],
    },
    {
        _id: "lesson-c2-4",
        _type: "lesson",
        id: { _type: "slug", current: "account-quiz" },
        title: "Account Model Quiz",
        type: "quiz",
        duration: "5min",
        xp: 15,
        content: `# Test Your Knowledge

Answer these questions about the Solana account model.`,
        quiz: {
            isRequired: true,
            timerSeconds: 120,
            xpReward: 15,
            questions: [
                {
                    _key: key(),
                    question: "What is the minimum size an account can be on Solana?",
                    options: ["0 bytes", "8 bytes", "32 bytes", "128 bytes"],
                    correctOptionIndex: 0,
                    explanation: "Accounts can be 0 bytes — they just hold SOL. But data accounts need space for their data schema.",
                },
                {
                    _key: key(),
                    question: "Who 'owns' a token account?",
                    options: ["The wallet holder", "The Token Program", "The System Program", "The BPF Loader"],
                    correctOptionIndex: 1,
                    explanation: "Token accounts are owned by the Token Program (or Token-2022 Program). The wallet holder is the 'authority' — a separate concept from the account owner.",
                },
                {
                    _key: key(),
                    question: "What makes an account rent-exempt?",
                    options: [
                        "Having more than 1 SOL",
                        "Being owned by the System Program",
                        "Holding enough SOL to cover 2 years of rent",
                        "Being a program account",
                    ],
                    correctOptionIndex: 2,
                    explanation: "An account is rent-exempt when its lamport balance meets or exceeds the rent-exempt threshold, which is calculated as 2 years of rent based on the account's data size.",
                },
            ],
        },
    },
];

// COURSE 3: SPL Tokens & Token-2022
const c3Lessons = [
    {
        _id: "lesson-c3-1",
        _type: "lesson",
        id: { _type: "slug", current: "spl-token-overview" },
        title: "SPL Tokens Overview",
        type: "reading",
        duration: "10min",
        xp: 15,
        content: `# SPL Tokens

The **SPL Token Program** is Solana's standard for fungible and non-fungible tokens.

## Token Program vs Token-2022

| Feature | Token Program | Token-2022 |
|---|---|---|
| Transfer fees | ❌ | ✅ |
| Interest-bearing | ❌ | ✅ |
| Non-transferable (soulbound) | ❌ | ✅ |
| Confidential transfers | ❌ | ✅ |
| Memo required | ❌ | ✅ |

## Superteam Academy uses Token-2022

Our XP token is a **non-transferable (soulbound)** Token-2022 mint. This means:
- XP can only be minted to learners by the program
- XP cannot be transferred between wallets
- XP balance is a true measure of individual effort`,
    },
    {
        _id: "lesson-c3-2",
        _type: "lesson",
        id: { _type: "slug", current: "token-2022-video" },
        title: "Token-2022 Extensions Explained",
        type: "video",
        duration: "18min",
        xp: 20,
        content: `# Token-2022 Extensions

Deep dive into Token-2022 and its extension framework.

📺 **Video**: [Token-2022 Extensions Walkthrough](https://www.youtube.com/watch?v=Gc2gRV0UMCI)

## Extensions Covered
- Transfer fees
- Non-transferable tokens (soulbound)
- Interest-bearing tokens
- Confidential transfers
- Default account state
- Metadata pointer`,
    },
    {
        _id: "lesson-c3-3",
        _type: "lesson",
        id: { _type: "slug", current: "mint-soulbound-token" },
        title: "Mint a Soulbound Token",
        type: "code",
        duration: "20min",
        xp: 40,
        content: `# Mint a Soulbound XP Token

Create a non-transferable Token-2022 mint and issue tokens to a learner.`,
        language: "typescript",
        initialCode: `import { Connection, Keypair, SystemProgram, Transaction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { ExtensionType, TOKEN_2022_PROGRAM_ID, createInitializeMintInstruction, createInitializeNonTransferableMintInstruction, getMintLen } from "@solana/spl-token";

const connection = new Connection("https://api.devnet.solana.com");
const payer = Keypair.generate();
const mintKeypair = Keypair.generate();

// TODO: Create a non-transferable mint using Token-2022

async function createSoulboundMint() {
    // Your code here
}

createSoulboundMint();`,
        solutionCode: `import { Connection, Keypair, SystemProgram, Transaction, LAMPORTS_PER_SOL, sendAndConfirmTransaction } from "@solana/web3.js";
import { ExtensionType, TOKEN_2022_PROGRAM_ID, createInitializeMintInstruction, createInitializeNonTransferableMintInstruction, getMintLen } from "@solana/spl-token";

const connection = new Connection("https://api.devnet.solana.com");
const payer = Keypair.generate();
const mintKeypair = Keypair.generate();

async function createSoulboundMint() {
    const airdropSig = await connection.requestAirdrop(payer.publicKey, 2 * LAMPORTS_PER_SOL);
    await connection.confirmTransaction(airdropSig);

    const extensions = [ExtensionType.NonTransferable];
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
        createInitializeNonTransferableMintInstruction(mintKeypair.publicKey, TOKEN_2022_PROGRAM_ID),
        createInitializeMintInstruction(mintKeypair.publicKey, 0, payer.publicKey, null, TOKEN_2022_PROGRAM_ID)
    );

    await sendAndConfirmTransaction(connection, tx, [payer, mintKeypair]);
    console.log("Soulbound Mint:", mintKeypair.publicKey.toBase58());
}

createSoulboundMint();`,
        testCases: [
            "Mint should use TOKEN_2022_PROGRAM_ID",
            "NonTransferable extension must be initialized before the mint",
            "Mint decimals should be 0 for XP-like tokens",
        ],
        hints: [
            "Order matters: createAccount → initNonTransferable → initMint",
            "Use getMintLen([ExtensionType.NonTransferable]) for account size",
        ],
    },
    {
        _id: "lesson-c3-4",
        _type: "lesson",
        id: { _type: "slug", current: "token-quiz" },
        title: "Token Knowledge Check",
        type: "quiz",
        duration: "5min",
        xp: 15,
        content: `# Token Quiz`,
        quiz: {
            isRequired: true,
            timerSeconds: 90,
            xpReward: 15,
            questions: [
                {
                    _key: key(),
                    question: "What makes a Token-2022 token 'soulbound'?",
                    options: [
                        "Setting transfer fees to 100%",
                        "Using the NonTransferable extension",
                        "Making the freeze authority the only signer",
                        "Burning the mint authority",
                    ],
                    correctOptionIndex: 1,
                    explanation: "The NonTransferable extension prevents any transfer of the token, making it soulbound to the original recipient.",
                },
                {
                    _key: key(),
                    question: "Which program ID should soulbound XP tokens use?",
                    options: ["TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb", "11111111111111111111111111111111", "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"],
                    correctOptionIndex: 1,
                    explanation: "Token-2022 (TokenzQd...) supports extensions like NonTransferable. The original Token Program (Tokenkeg...) does not.",
                },
            ],
        },
    },
];

// COURSE 4: Anchor Framework Introduction
const c4Lessons = [
    {
        _id: "lesson-c4-1",
        _type: "lesson",
        id: { _type: "slug", current: "what-is-anchor" },
        title: "What is Anchor?",
        type: "reading",
        duration: "8min",
        xp: 15,
        content: `# Anchor Framework

Anchor is the most popular framework for building Solana programs. It provides:

## Why Anchor?

1. **Account validation macros** — \`#[account]\` and \`#[derive(Accounts)]\`
2. **Auto-generated IDL** — Type-safe clients from your program
3. **Error codes** — Custom error types with clear messages
4. **CPI helpers** — Easy cross-program invocations
5. **Testing framework** — Integrated test runner

## Program Structure

\`\`\`rust
use anchor_lang::prelude::*;

declare_id!("YourProgramId11111111111111111111111111111");

#[program]
pub mod my_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
\`\`\``,
    },
    {
        _id: "lesson-c4-2",
        _type: "lesson",
        id: { _type: "slug", current: "anchor-setup-video" },
        title: "Anchor Project Setup",
        type: "video",
        duration: "14min",
        xp: 20,
        content: `# Setting Up an Anchor Project

Follow along to scaffold and configure your first Anchor project.

📺 **Video**: [Anchor from Scratch](https://www.youtube.com/watch?v=oD5WIbkH8CU)

## Steps Covered
1. Installing Anchor CLI
2. \`anchor init my-project\`
3. Project structure walkthrough
4. Running \`anchor test\` on localnet
5. Deploying to devnet`,
    },
    {
        _id: "lesson-c4-3",
        _type: "lesson",
        id: { _type: "slug", current: "write-anchor-counter" },
        title: "Build a Counter Program",
        type: "code",
        duration: "20min",
        xp: 35,
        content: `# Build a Counter with Anchor

Write an Anchor program that initializes a counter account and increments it.`,
        language: "rust",
        initialCode: `use anchor_lang::prelude::*;

declare_id!("CounterProgram1111111111111111111111111");

#[program]
pub mod counter {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        // TODO: Initialize the counter to 0
        Ok(())
    }

    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        // TODO: Increment the counter by 1
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {
    // TODO: Define accounts
}

#[derive(Accounts)]
pub struct Increment {
    // TODO: Define accounts
}

#[account]
pub struct Counter {
    pub count: u64,
}`,
        solutionCode: `use anchor_lang::prelude::*;

declare_id!("CounterProgram1111111111111111111111111");

#[program]
pub mod counter {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count = 0;
        msg!("Counter initialized to 0");
        Ok(())
    }

    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count += 1;
        msg!("Counter incremented to {}", counter.count);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + 8)]
    pub counter: Account<'info, Counter>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(mut)]
    pub counter: Account<'info, Counter>,
}

#[account]
pub struct Counter {
    pub count: u64,
}`,
        testCases: [
            "Initialize should set counter.count to 0",
            "Increment should increase counter.count by 1",
            "Initialize accounts should include init, payer, and system_program",
            "Counter account space should be 8 + 8 (discriminator + u64)",
        ],
        hints: [
            "Use #[account(init, payer = user, space = 8 + 8)] for initialization",
            "Access the account via ctx.accounts.counter",
            "Don't forget the system_program in Initialize accounts",
        ],
    },
    {
        _id: "lesson-c4-4",
        _type: "lesson",
        id: { _type: "slug", current: "pda-maze-game" },
        title: "PDA Maze Challenge",
        type: "game",
        duration: "12min",
        xp: 50,
        content: `# PDA Maze 🧩

Navigate the maze by deriving the correct PDA seeds at each checkpoint!

Each door requires a specific seed combination. Get 70%+ to pass.`,
        game: ref("game-pda-maze"),
    },
    {
        _id: "lesson-c4-5",
        _type: "lesson",
        id: { _type: "slug", current: "anchor-quiz" },
        title: "Anchor Framework Quiz",
        type: "quiz",
        duration: "5min",
        xp: 15,
        content: `# Anchor Quiz`,
        quiz: {
            isRequired: true,
            timerSeconds: 120,
            xpReward: 15,
            questions: [
                {
                    _key: key(),
                    question: "What does the #[account(init)] constraint do?",
                    options: [
                        "Reads an existing account",
                        "Creates a new account via CPI to the System Program",
                        "Closes an account and reclaims rent",
                        "Verifies an account's owner",
                    ],
                    correctOptionIndex: 1,
                    explanation: "The init constraint creates a new account by CPIing into the System Program's create_account instruction.",
                },
                {
                    _key: key(),
                    question: "What is the 8 in `space = 8 + 8`?",
                    options: ["The anchor version number", "Padding bytes", "The account discriminator", "The rent amount"],
                    correctOptionIndex: 2,
                    explanation: "Anchor reserves the first 8 bytes of every account for the discriminator — a SHA256 hash prefix that identifies the account type.",
                },
            ],
        },
    },
];

// COURSE 5: PDAs and CPIs
const c5Lessons = [
    {
        _id: "lesson-c5-1",
        _type: "lesson",
        id: { _type: "slug", current: "understanding-pdas" },
        title: "Understanding PDAs",
        type: "reading",
        duration: "12min",
        xp: 20,
        content: `# Program Derived Addresses (PDAs)

PDAs are deterministic addresses **derived from seeds** that only a program can sign for.

## How PDAs Work

\`\`\`
PDA = findProgramAddress([seed1, seed2, ...], programId)
    → Returns (address, bump)
\`\`\`

The bump is a single byte (0–255) that ensures the resulting address is NOT on the Ed25519 curve — meaning no private key exists for it.

## Common PDA Patterns

| Pattern | Seeds | Use Case |
|---|---|---|
| User state | \`["user", wallet]\` | Per-user data |
| Enrollment | \`["enrollment", wallet, course_id]\` | Course enrollment tracker |
| Config | \`["config"]\` | Global program settings |

## In Superteam Academy

- **Learner PDA**: \`["learner", wallet]\` — tracks enrollment count and total XP
- **Enrollment PDA**: \`["enrollment", wallet, course_id]\` — lesson bitmap + progress
- **Config PDA**: \`["config"]\` — authority, XP mint, counters`,
    },
    {
        _id: "lesson-c5-2",
        _type: "lesson",
        id: { _type: "slug", current: "cpis-explained-video" },
        title: "Cross-Program Invocations (CPIs)",
        type: "video",
        duration: "16min",
        xp: 20,
        content: `# Cross-Program Invocations

Learn how Solana programs call each other.

📺 **Video**: [Understanding CPIs in Solana](https://www.youtube.com/watch?v=Vy7W7cMgKPQ)

## What You'll Learn
- invoke() vs invoke_signed()
- CPI context in Anchor
- Security considerations (signer seeds, privilege escalation)
- Real-world CPI examples (minting tokens from a program)`,
    },
    {
        _id: "lesson-c5-3",
        _type: "lesson",
        id: { _type: "slug", current: "derive-pda-code" },
        title: "Derive a PDA in Code",
        type: "code",
        duration: "15min",
        xp: 30,
        content: `# Derive a Learner PDA

Write TypeScript to derive the Superteam Academy learner PDA for a given wallet.`,
        language: "typescript",
        initialCode: `import { PublicKey } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf");

// TODO: Derive the learner PDA using seeds: ["learner", walletPubkey]
function deriveLearnerPDA(walletPubkey: PublicKey): [PublicKey, number] {
    // Your code here
    return [PublicKey.default, 0];
}

const wallet = new PublicKey("11111111111111111111111111111111");
const [pda, bump] = deriveLearnerPDA(wallet);
console.log("Learner PDA:", pda.toBase58(), "Bump:", bump);`,
        solutionCode: `import { PublicKey } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf");

function deriveLearnerPDA(walletPubkey: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("learner"), walletPubkey.toBuffer()],
        PROGRAM_ID
    );
}

const wallet = new PublicKey("11111111111111111111111111111111");
const [pda, bump] = deriveLearnerPDA(wallet);
console.log("Learner PDA:", pda.toBase58(), "Bump:", bump);`,
        testCases: [
            "Should use PublicKey.findProgramAddressSync",
            "Seeds should be [Buffer.from('learner'), walletPubkey.toBuffer()]",
            "Program ID should be the Academy program",
        ],
        hints: [
            "Use PublicKey.findProgramAddressSync(seeds, programId)",
            "Seeds must be Buffer instances — use Buffer.from() for strings",
        ],
    },
    {
        _id: "lesson-c5-4",
        _type: "lesson",
        id: { _type: "slug", current: "pda-cpi-quiz" },
        title: "PDAs & CPIs Final Quiz",
        type: "quiz",
        duration: "5min",
        xp: 20,
        content: `# Final Knowledge Check`,
        quiz: {
            isRequired: true,
            timerSeconds: 120,
            xpReward: 20,
            questions: [
                {
                    _key: key(),
                    question: "Why can't a PDA sign transactions like a normal keypair?",
                    options: [
                        "PDAs are too large",
                        "PDAs don't have a corresponding private key",
                        "PDAs can only exist on devnet",
                        "PDAs require multisig approval",
                    ],
                    correctOptionIndex: 1,
                    explanation: "PDAs are explicitly computed to NOT lie on the Ed25519 curve, so no private key can ever exist for them. Only the owning program can 'sign' for a PDA via invoke_signed.",
                },
                {
                    _key: key(),
                    question: "What is invoke_signed used for?",
                    options: [
                        "Creating a new keypair",
                        "Making a CPI where the program signs with PDA seeds",
                        "Verifying a user's wallet signature",
                        "Encrypting transaction data",
                    ],
                    correctOptionIndex: 1,
                    explanation: "invoke_signed allows a program to include PDA signer seeds in a CPI, proving to the callee that the PDA's owning program authorized the call.",
                },
            ],
        },
    },
];

// ─── Modules ────────────────────────────────────────────

const module1 = {
    _id: "module-solana-fundamentals",
    _type: "courseModule",
    title: "Solana Fundamentals",
    lessons: [
        { _key: key(), ...ref("lesson-c1-1") },
        { _key: key(), ...ref("lesson-c1-2") },
        { _key: key(), ...ref("lesson-c1-3") },
        { _key: key(), ...ref("lesson-c1-4") },
        { _key: key(), ...ref("lesson-c2-1") },
        { _key: key(), ...ref("lesson-c2-2") },
        { _key: key(), ...ref("lesson-c2-3") },
        { _key: key(), ...ref("lesson-c2-4") },
        { _key: key(), ...ref("lesson-c3-1") },
        { _key: key(), ...ref("lesson-c3-2") },
        { _key: key(), ...ref("lesson-c3-3") },
        { _key: key(), ...ref("lesson-c3-4") },
    ],
};

const module2 = {
    _id: "module-anchor-development",
    _type: "courseModule",
    title: "Anchor & Program Development",
    lessons: [
        { _key: key(), ...ref("lesson-c4-1") },
        { _key: key(), ...ref("lesson-c4-2") },
        { _key: key(), ...ref("lesson-c4-3") },
        { _key: key(), ...ref("lesson-c4-4") },
        { _key: key(), ...ref("lesson-c4-5") },
        { _key: key(), ...ref("lesson-c5-1") },
        { _key: key(), ...ref("lesson-c5-2") },
        { _key: key(), ...ref("lesson-c5-3") },
        { _key: key(), ...ref("lesson-c5-4") },
    ],
};

// ─── Courses ────────────────────────────────────────────

const courses = [
    {
        _id: "course-blockchain-basics",
        _type: "course",
        id: { _type: "slug", current: "blockchain-basics" },
        slug: { _type: "slug", current: "blockchain-basics" },
        title: "Blockchain Basics",
        description: "Start your Web3 journey by understanding how blockchains work, what makes Solana unique, and how to send your first on-chain transaction. Includes an interactive game to solidify your understanding.",
        shortDescription: "Foundations of blockchain and Solana architecture.",
        difficulty: "beginner",
        track: "Fundamentals",
        duration: "45min",
        lessonCount: 4,
        xpReward: 90,
        tags: ["blockchain", "solana", "beginner", "transactions"],
        outcomes: [
            "Understand blockchain fundamentals",
            "Explain Solana's Proof of History",
            "Send a SOL transaction on devnet",
        ],
        prerequisites: [],
        instructor: ref("instructor-superteam"),
        modules: [{ _key: key(), ...ref("module-solana-fundamentals") }],
    },
    {
        _id: "course-wallets-accounts",
        _type: "course",
        id: { _type: "slug", current: "wallets-and-accounts" },
        slug: { _type: "slug", current: "wallets-and-accounts" },
        title: "Wallets & Accounts",
        description: "Master the Solana account model — the foundation of everything on-chain. Learn how wallets, keypairs, token accounts, and PDAs fit together. Finish with a quiz to test your understanding.",
        shortDescription: "Deep dive into Solana's account model and wallets.",
        difficulty: "beginner",
        track: "Fundamentals",
        duration: "42min",
        lessonCount: 4,
        xpReward: 80,
        tags: ["accounts", "wallets", "keypairs", "spl-token"],
        outcomes: [
            "Navigate the Solana account model",
            "Create associated token accounts",
            "Understand rent and rent-exemption",
        ],
        prerequisites: ["Blockchain Basics"],
        instructor: ref("instructor-superteam"),
        modules: [{ _key: key(), ...ref("module-solana-fundamentals") }],
    },
    {
        _id: "course-spl-tokens",
        _type: "course",
        id: { _type: "slug", current: "spl-tokens-and-token-2022" },
        slug: { _type: "slug", current: "spl-tokens-and-token-2022" },
        title: "SPL Tokens & Token-2022",
        description: "Learn the SPL Token standard and the powerful Token-2022 extensions. Build a soulbound (non-transferable) token — the same technology Superteam Academy uses for XP tracking.",
        shortDescription: "Token standards, extensions, and soulbound mechanics.",
        difficulty: "intermediate",
        track: "Fundamentals",
        duration: "53min",
        lessonCount: 4,
        xpReward: 90,
        tags: ["tokens", "token-2022", "soulbound", "spl"],
        outcomes: [
            "Differentiate Token Program vs Token-2022",
            "Use Token-2022 extensions",
            "Mint a non-transferable (soulbound) token",
        ],
        prerequisites: ["Wallets & Accounts"],
        instructor: ref("instructor-superteam"),
        modules: [{ _key: key(), ...ref("module-solana-fundamentals") }],
    },
    {
        _id: "course-anchor-intro",
        _type: "course",
        id: { _type: "slug", current: "anchor-framework-intro" },
        slug: { _type: "slug", current: "anchor-framework-intro" },
        title: "Anchor Framework Introduction",
        description: "Get started with Anchor — the most popular Solana program framework. Build a counter program from scratch, explore account validation macros, and test your skills with the PDA Maze game.",
        shortDescription: "Build your first Anchor program step by step.",
        difficulty: "intermediate",
        track: "Anchor",
        duration: "59min",
        lessonCount: 5,
        xpReward: 135,
        tags: ["anchor", "rust", "programs", "counter"],
        outcomes: [
            "Set up an Anchor development environment",
            "Write and deploy an Anchor program",
            "Understand account validation with macros",
        ],
        prerequisites: ["SPL Tokens & Token-2022"],
        instructor: ref("instructor-superteam"),
        modules: [{ _key: key(), ...ref("module-anchor-development") }],
    },
    {
        _id: "course-pdas-cpis",
        _type: "course",
        id: { _type: "slug", current: "pdas-and-cpis" },
        slug: { _type: "slug", current: "pdas-and-cpis" },
        title: "PDAs & Cross-Program Invocations",
        description: "Master Program Derived Addresses (PDAs) and Cross-Program Invocations (CPIs) — the two most important advanced concepts in Solana program development. Derive the actual PDAs used by Superteam Academy.",
        shortDescription: "Advanced on-chain patterns for Solana programs.",
        difficulty: "advanced",
        track: "Anchor",
        duration: "48min",
        lessonCount: 4,
        xpReward: 90,
        tags: ["pda", "cpi", "advanced", "security"],
        outcomes: [
            "Derive and use PDAs in programs",
            "Implement CPIs with invoke_signed",
            "Understand PDA security implications",
        ],
        prerequisites: ["Anchor Framework Introduction"],
        instructor: ref("instructor-superteam"),
        modules: [{ _key: key(), ...ref("module-anchor-development") }],
    },
];

// ─── Seed Runner ────────────────────────────────────────

async function seed() {
    if (!process.env.SANITY_TOKEN) {
        console.error("❌ Missing SANITY_TOKEN. Run with: SANITY_TOKEN=<token> npx tsx scripts/seed-courses.ts");
        process.exit(1);
    }

    console.log("🌱 Seeding Superteam Academy content...\n");

    const allDocs = [
        instructor,
        ...games,
        ...c1Lessons,
        ...c2Lessons,
        ...c3Lessons,
        ...c4Lessons,
        ...c5Lessons,
        module1,
        module2,
        ...courses,
    ];

    let transaction = client.transaction();
    for (const doc of allDocs) {
        transaction = transaction.createOrReplace(doc as any);
    }

    const result = await transaction.commit();
    console.log(`✅ Seeded ${allDocs.length} documents`);
    console.log(`   - 1 instructor`);
    console.log(`   - ${games.length} games`);
    console.log(`   - ${c1Lessons.length + c2Lessons.length + c3Lessons.length + c4Lessons.length + c5Lessons.length} lessons`);
    console.log(`   - 2 modules`);
    console.log(`   - ${courses.length} courses`);
    console.log(`\n📊 Transaction ID: ${result.transactionId}`);
}

seed().catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
});
