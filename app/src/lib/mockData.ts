export type LessonType = 'content' | 'challenge';

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Lesson {
  id: string;
  title: string;
  type: LessonType;
  content: string;
  starterCode?: string;
  solutionCode?: string;
  xpReward: number;
  duration: string; // "5 min", "15 min"
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  category: string;
  image: string;
  totalXP: number;
  duration: string;
  students: number;
  modules: Module[];
  tags: string[];
}

export const COURSES: Course[] = [
  {
    id: 'solana-101',
    title: 'Solana 101: Blockchain Fundamentals',
    description: 'Master the core concepts of Solana — accounts, transactions, and the Proof of History consensus mechanism.',
    difficulty: 'Beginner',
    category: 'Fundamentals',
    image: 'gradient-purple',
    totalXP: 350,
    duration: '4h 30m',
    students: 12840,
    tags: ['Solana', 'Blockchain', 'Web3', 'Beginner'],
    modules: [
      {
        id: 'sol101-m1',
        title: 'Introduction to Solana',
        lessons: [
          {
            id: 'sol101-l1',
            title: 'What is Solana?',
            type: 'content',
            xpReward: 10,
            duration: '8 min',
            content: `# What is Solana?

Solana is a **high-performance Layer 1 blockchain** designed for decentralized applications and crypto-currencies.

## Key Characteristics

- **Speed**: Solana can process **65,000+ transactions per second (TPS)**
- **Low Cost**: Average transaction fee of **$0.00025**
- **Decentralized**: Over 2,000 validators worldwide

## The Proof of History (PoH) Consensus

Solana's breakthrough innovation is **Proof of History** — a cryptographic clock that enables validators to agree on the order of events without communicating with each other.

\`\`\`
Traditional: All validators must communicate → SLOW
Solana PoH: Time is encoded into the blockchain → FAST
\`\`\`

## Solana vs. Ethereum

| Feature | Solana | Ethereum |
|---------|--------|----------|
| TPS | 65,000+ | ~15 |
| Avg Fee | $0.00025 | $5-50 |
| Block Time | 400ms | 12s |

## Why Solana for Developers?

Solana uses **Rust** and **TypeScript** (via Anchor framework), making it accessible to modern developers while providing system-level performance.

> 💡 **Key takeaway**: Solana achieves speed through innovative consensus mechanisms, not by sacrificing decentralization.`
          },
          {
            id: 'sol101-l2',
            title: 'Solana Accounts Model',
            type: 'content',
            xpReward: 10,
            duration: '10 min',
            content: `# The Solana Account Model

Everything in Solana is an **account**. Understanding accounts is fundamental to building on Solana.

## Types of Accounts

### 1. System Accounts (Wallets)
Regular user wallets that hold SOL and can sign transactions.

### 2. Program Accounts
Smart contracts deployed on Solana. They are **executable** and **immutable** after deployment.

### 3. Data Accounts
Store data on-chain. Programs own these accounts to persist state.

### 4. Token Accounts
Hold SPL tokens (Solana's token standard, equivalent to ERC-20).

## Account Structure

\`\`\`typescript
interface Account {
  lamports: number;     // Balance in lamports (1 SOL = 1B lamports)
  owner: PublicKey;     // Program that owns this account
  executable: boolean;  // Is this a program?
  data: Buffer;         // Raw data stored in the account
  rentEpoch: number;    // When rent is next due
}
\`\`\`

## Rent

Accounts pay **rent** to stay alive on-chain. To make an account **rent-exempt**, you must deposit a minimum balance (~0.002 SOL for small accounts).

> 🔑 **Key insight**: The Solana account model is more complex than Ethereum's but enables parallel transaction processing, which is the source of Solana's speed.`
          },
          {
            id: 'sol101-c1',
            title: 'Challenge: Identify Account Types',
            type: 'challenge',
            xpReward: 25,
            duration: '15 min',
            content: `# Challenge: Working with Solana Accounts

In this challenge, you'll write a TypeScript function that identifies different Solana account types based on their properties.

## Task

Complete the \`identifyAccountType\` function that returns the account type based on the account's properties.`,
            starterCode: `import { PublicKey } from "@solana/web3.js";

interface AccountInfo {
  executable: boolean;
  owner: string;
  lamports: number;
  data: Uint8Array;
}

// Complete this function to identify account types
function identifyAccountType(account: AccountInfo): string {
  // TODO: Return "program" if account is executable
  // TODO: Return "system" if owned by System Program (11111111111111111111111111111111)
  // TODO: Return "token" if owned by Token Program
  // TODO: Return "data" for other accounts
  
  const SYSTEM_PROGRAM = "11111111111111111111111111111111";
  const TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
  
  // Your code here
  
}

// Test it
const testAccount: AccountInfo = {
  executable: false,
  owner: "11111111111111111111111111111111",
  lamports: 1000000,
  data: new Uint8Array(0)
};

console.log(identifyAccountType(testAccount)); // Should print "system"`,
            solutionCode: `import { PublicKey } from "@solana/web3.js";

interface AccountInfo {
  executable: boolean;
  owner: string;
  lamports: number;
  data: Uint8Array;
}

function identifyAccountType(account: AccountInfo): string {
  const SYSTEM_PROGRAM = "11111111111111111111111111111111";
  const TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
  
  if (account.executable) return "program";
  if (account.owner === SYSTEM_PROGRAM) return "system";
  if (account.owner === TOKEN_PROGRAM) return "token";
  return "data";
}

const testAccount: AccountInfo = {
  executable: false,
  owner: "11111111111111111111111111111111",
  lamports: 1000000,
  data: new Uint8Array(0)
};

console.log(identifyAccountType(testAccount)); // "system"`
          }
        ]
      },
      {
        id: 'sol101-m2',
        title: 'Transactions & Instructions',
        lessons: [
          {
            id: 'sol101-l3',
            title: 'Building Transactions',
            type: 'content',
            xpReward: 10,
            duration: '12 min',
            content: `# Building Solana Transactions

A **transaction** is the atomic unit of work on Solana. It contains one or more **instructions**.

## Transaction Structure

\`\`\`typescript
import { Transaction, TransactionInstruction } from "@solana/web3.js";

const transaction = new Transaction();
transaction.add(instruction1, instruction2);
transaction.feePayer = wallet.publicKey;
transaction.recentBlockhash = (
  await connection.getLatestBlockhash()
).blockhash;
\`\`\`

## Key Concepts

### Instructions
Each instruction specifies:
- **Program ID**: Which program to call
- **Accounts**: Which accounts the program can read/write
- **Data**: What to do (encoded as bytes)

### Signatures
A transaction must be signed by all required signers before being submitted.

## Example: SOL Transfer

\`\`\`typescript
import {
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

const instruction = SystemProgram.transfer({
  fromPubkey: sender.publicKey,
  toPubkey: receiver,
  lamports: 0.1 * LAMPORTS_PER_SOL,
});
\`\`\`

> 💡 Transactions on Solana are processed in **~400ms** and cost fractions of a cent.`
          },
          {
            id: 'sol101-c2',
            title: 'Challenge: Create a Transfer Transaction',
            type: 'challenge',
            xpReward: 30,
            duration: '20 min',
            content: `# Challenge: Build a SOL Transfer

Write a function that creates a SOL transfer transaction using the Solana web3.js SDK.`,
            starterCode: `import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

// Create a function that builds a SOL transfer transaction
async function createTransfer(
  connection: Connection,
  from: PublicKey,
  to: PublicKey,
  solAmount: number
): Promise<Transaction> {
  // TODO: Create the transfer instruction using SystemProgram.transfer
  // TODO: Create a new Transaction and add the instruction
  // TODO: Set the feePayer and recentBlockhash
  // TODO: Return the transaction
  
  const transaction = new Transaction();
  
  // Your code here
  
  return transaction;
}

// Usage example (won't run without a real connection)
console.log("Transfer function created!");`,
            solutionCode: `import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

async function createTransfer(
  connection: Connection,
  from: PublicKey,
  to: PublicKey,
  solAmount: number
): Promise<Transaction> {
  const instruction = SystemProgram.transfer({
    fromPubkey: from,
    toPubkey: to,
    lamports: solAmount * LAMPORTS_PER_SOL,
  });

  const transaction = new Transaction();
  transaction.add(instruction);
  transaction.feePayer = from;
  
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;

  return transaction;
}

console.log("Transfer function created!");`
          }
        ]
      }
    ]
  },
  {
    id: 'anchor-dev',
    title: 'Anchor Framework: Smart Contract Development',
    description: 'Build production-grade Solana programs using the Anchor framework. Learn PDAs, CPIs, and security best practices.',
    difficulty: 'Intermediate',
    category: 'Smart Contracts',
    image: 'gradient-green',
    totalXP: 600,
    duration: '8h 15m',
    students: 7230,
    tags: ['Anchor', 'Rust', 'Smart Contracts', 'PDAs'],
    modules: [
      {
        id: 'anchor-m1',
        title: 'Getting Started with Anchor',
        lessons: [
          {
            id: 'anchor-l1',
            title: 'Introduction to Anchor Framework',
            type: 'content',
            xpReward: 10,
            duration: '10 min',
            content: `# Anchor Framework

Anchor is the **de facto standard** framework for Solana smart contract development. It abstracts away low-level Solana complexity.

## Why Anchor?

- **Type safety**: IDL (Interface Definition Language) auto-generates TypeScript clients
- **Security**: Built-in account validation and ownership checks
- **Productivity**: Macros reduce boilerplate by ~80%

## Anchor Program Structure

\`\`\`rust
use anchor_lang::prelude::*;

declare_id!("YourProgramIdHere");

#[program]
pub mod my_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, data: u64) -> Result<()> {
        ctx.accounts.my_account.data = data;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + 8)]
    pub my_account: Account<'info, MyAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct MyAccount {
    pub data: u64,
}
\`\`\`

> 🚀 Anchor turns what would be 200 lines of raw Solana code into 20 lines of clean, safe Rust.`
          },
          {
            id: 'anchor-c1',
            title: 'Challenge: Initialize an Anchor Program',
            type: 'challenge',
            xpReward: 40,
            duration: '25 min',
            content: `# Challenge: Write Your First Anchor Program

Complete the Anchor program that initializes a counter account and increments it.`,
            starterCode: `use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod counter {
    use super::*;

    // TODO: Implement initialize function
    // It should set the counter's count to 0
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        // Your code here
        Ok(())
    }

    // TODO: Implement increment function  
    // It should add 1 to the counter
    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        // Your code here
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    // TODO: Add counter account (init, payer = user, space = 8 + 8)
    // TODO: Add user signer (mut)
    // TODO: Add system_program
}

#[derive(Accounts)]
pub struct Increment<'info> {
    // TODO: Add counter account (mut)
}

#[account]
pub struct Counter {
    pub count: u64,
}`,
            solutionCode: `use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod counter {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        ctx.accounts.counter.count = 0;
        Ok(())
    }

    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        ctx.accounts.counter.count += 1;
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
}`
          }
        ]
      },
      {
        id: 'anchor-m2',
        title: 'Program Derived Addresses (PDAs)',
        lessons: [
          {
            id: 'anchor-l2',
            title: 'Understanding PDAs',
            type: 'content',
            xpReward: 15,
            duration: '15 min',
            content: `# Program Derived Addresses (PDAs)

PDAs are one of Solana's most powerful features — **deterministic account addresses** derived from seeds and a program ID.

## What Makes PDAs Special?

- **No private key**: PDAs cannot sign transactions like normal wallets
- **Deterministic**: Same seeds always produce the same address
- **Program-controlled**: Only the owning program can sign for a PDA

## Creating a PDA

\`\`\`rust
// In your Anchor program
#[derive(Accounts)]
#[instruction(user_seed: String)]
pub struct CreatePDA<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 256,
        seeds = [b"user-data", user.key().as_ref()],
        bump
    )]
    pub user_data: Account<'info, UserData>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}
\`\`\`

## Finding a PDA in TypeScript

\`\`\`typescript
const [userDataPDA, bump] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("user-data"),
    wallet.publicKey.toBuffer(),
  ],
  programId
);
\`\`\`

## Common PDA Use Cases

1. **User profiles** — one unique account per user per program
2. **Escrow accounts** — trustless token custody
3. **NFT metadata** — predictable metadata addresses
4. **DAO vaults** — program-controlled treasuries

> 🔑 PDAs are the foundation of almost every production Solana program.`
          }
        ]
      }
    ]
  },
  {
    id: 'defi-protocols',
    title: 'DeFi Protocol Development on Solana',
    description: 'Build real DeFi protocols — AMMs, lending markets, and yield strategies using Solana and Anchor.',
    difficulty: 'Advanced',
    category: 'DeFi',
    image: 'gradient-cyan',
    totalXP: 1000,
    duration: '12h 00m',
    students: 3450,
    tags: ['DeFi', 'AMM', 'Lending', 'Advanced', 'Anchor'],
    modules: [
      {
        id: 'defi-m1',
        title: 'Token Swaps & AMMs',
        lessons: [
          {
            id: 'defi-l1',
            title: 'How AMMs Work',
            type: 'content',
            xpReward: 20,
            duration: '20 min',
            content: `# Automated Market Makers (AMMs)

AMMs are the backbone of DeFi — they enable trustless token swaps without order books.

## The Constant Product Formula

The most famous AMM formula from Uniswap:

\`\`\`
x * y = k
\`\`\`

Where:
- \`x\` = reserve of token A
- \`y\` = reserve of token B  
- \`k\` = constant (never changes during swaps)

## Example Swap Calculation

\`\`\`typescript
function calculateSwapOutput(
  inputAmount: number,
  inputReserve: number,
  outputReserve: number,
  feeBps: number = 30 // 0.3%
): number {
  const feeMultiplier = 10000 - feeBps;
  const inputWithFee = inputAmount * feeMultiplier;
  const numerator = inputWithFee * outputReserve;
  const denominator = inputReserve * 10000 + inputWithFee;
  return numerator / denominator;
}

// Example: Swap 100 USDC for SOL
// Pool: 1,000,000 USDC, 10,000 SOL
const solOut = calculateSwapOutput(100, 1_000_000, 10_000);
console.log(\`You receive: \${solOut.toFixed(4)} SOL\`);
\`\`\`

## On Solana: Orca, Raydium, Jupiter

Major Solana DEXes use variants of this formula with optimizations:
- **Concentrated liquidity** (Orca Whirlpools)
- **Order book hybrid** (Raydium)
- **Route aggregation** (Jupiter)

> 🚀 Solana's speed makes AMMs significantly more capital-efficient than Ethereum equivalents.`
          },
          {
            id: 'defi-c1',
            title: 'Challenge: Implement AMM Price Calculation',
            type: 'challenge',
            xpReward: 60,
            duration: '30 min',
            content: `# Challenge: AMM Price Calculator

Implement a complete AMM price calculation system with slippage and price impact calculations.`,
            starterCode: `// AMM Price Calculation Challenge
// Implement the constant product AMM formula

interface Pool {
  tokenAReserve: number;
  tokenBReserve: number;
  feeBps: number; // basis points (30 = 0.3%)
}

interface SwapResult {
  outputAmount: number;
  priceImpact: number; // percentage
  fee: number;
  newPrice: number;
}

// TODO: Implement this function
function calculateSwap(
  pool: Pool,
  inputAmount: number,
  isAtoB: boolean
): SwapResult {
  // Calculate using x * y = k formula
  // Account for fees
  // Calculate price impact
  
  return {
    outputAmount: 0,
    priceImpact: 0,
    fee: 0,
    newPrice: 0,
  };
}

// TODO: Implement spot price calculation
function getSpotPrice(pool: Pool): number {
  // Price of token A in terms of token B
  return 0;
}

// Test
const pool: Pool = {
  tokenAReserve: 1_000_000, // USDC
  tokenBReserve: 10_000,    // SOL
  feeBps: 30,
};

const result = calculateSwap(pool, 1000, true);
console.log("Swap result:", result);`,
            solutionCode: `interface Pool {
  tokenAReserve: number;
  tokenBReserve: number;
  feeBps: number;
}

interface SwapResult {
  outputAmount: number;
  priceImpact: number;
  fee: number;
  newPrice: number;
}

function calculateSwap(
  pool: Pool,
  inputAmount: number,
  isAtoB: boolean
): SwapResult {
  const inputReserve = isAtoB ? pool.tokenAReserve : pool.tokenBReserve;
  const outputReserve = isAtoB ? pool.tokenBReserve : pool.tokenAReserve;
  
  const fee = inputAmount * pool.feeBps / 10000;
  const inputWithFee = inputAmount - fee;
  
  const outputAmount = (inputWithFee * outputReserve) / (inputReserve + inputWithFee);
  
  const spotPriceBefore = outputReserve / inputReserve;
  const priceImpact = ((spotPriceBefore * inputAmount - outputAmount) / (spotPriceBefore * inputAmount)) * 100;
  
  const newInputReserve = inputReserve + inputAmount;
  const newOutputReserve = outputReserve - outputAmount;
  const newPrice = newOutputReserve / newInputReserve;
  
  return { outputAmount, priceImpact, fee, newPrice };
}

function getSpotPrice(pool: Pool): number {
  return pool.tokenBReserve / pool.tokenAReserve;
}

const pool: Pool = {
  tokenAReserve: 1_000_000,
  tokenBReserve: 10_000,
  feeBps: 30,
};

const result = calculateSwap(pool, 1000, true);
console.log("Swap result:", result);`
          }
        ]
      }
    ]
  },
  {
    id: 'nft-dev',
    title: 'NFT Development: Metaplex & Collections',
    description: 'Create and manage NFT collections using Metaplex. Build minting mechanisms, royalties, and on-chain metadata.',
    difficulty: 'Intermediate',
    category: 'NFTs',
    image: 'gradient-pink',
    totalXP: 500,
    duration: '6h 00m',
    students: 9870,
    tags: ['NFT', 'Metaplex', 'Candy Machine', 'Metadata'],
    modules: [
      {
        id: 'nft-m1',
        title: 'NFT Fundamentals',
        lessons: [
          {
            id: 'nft-l1',
            title: 'Solana NFT Standards',
            type: 'content',
            xpReward: 10,
            duration: '8 min',
            content: `# Solana NFT Standards

Solana NFTs are built on the **Metaplex Token Metadata Standard** — the ecosystem's canonical NFT specification.

## How Solana NFTs Work

An NFT on Solana is just a **SPL Token** with:
- Supply of exactly **1**
- **0 decimals**
- A linked **Metadata Account** (via Metaplex)

## NFT Account Structure

\`\`\`
Mint Account (the NFT itself)
    └── Token Account (who holds it)
    └── Metadata Account (title, image, attributes)
        └── Master Edition Account (tracks supply)
\`\`\`

## Token Metadata Standard

\`\`\`typescript
interface NFTMetadata {
  name: string;           // "Cool Monkey #1234"
  symbol: string;         // "MONKEY"
  uri: string;            // Points to JSON on IPFS/Arweave
  sellerFeeBasisPoints: number; // Royalty in bps (500 = 5%)
  creators: Creator[];    // Revenue share
}
\`\`\`

## The Metaplex Ecosystem

- **Token Metadata**: Core NFT standard
- **Candy Machine**: Fair-launch minting tool
- **Auction House**: Marketplace protocol
- **Bubblegum**: Compressed NFTs (100x cheaper)

> 💡 **Compressed NFTs** on Solana can cost as little as $0.0001 per NFT, enabling truly scalable NFT applications.`
          }
        ]
      }
    ]
  }
];

export function getCourse(id: string): Course | undefined {
  return COURSES.find(c => c.id === id);
}

export function getLesson(lessonId: string): { lesson: Lesson; course: Course; module: Module } | undefined {
  for (const course of COURSES) {
    for (const module of course.modules) {
      const lesson = module.lessons.find(l => l.id === lessonId);
      if (lesson) return { lesson, course, module };
    }
  }
  return undefined;
}

export function getAllLessons(): Array<{ lesson: Lesson; course: Course; module: Module }> {
  const lessons: Array<{ lesson: Lesson; course: Course; module: Module }> = [];
  for (const course of COURSES) {
    for (const module of course.modules) {
      for (const lesson of module.lessons) {
        lessons.push({ lesson, course, module });
      }
    }
  }
  return lessons;
}
