/**
 * Mock Sanity CMS course data.
 *
 * Two complete SanityCourse objects matching the CMS schema exactly,
 * with modules, lessons (content, challenge, quiz, video), and challenges.
 *
 * Designed to feel like a real production course catalog with
 * comprehensive content, varied lesson types, and realistic challenges.
 *
 * Only loaded when NEXT_PUBLIC_USE_MOCK_DATA=true.
 */

import type {
    SanityCourse,
    SanityModule,
    SanityLesson,
    SanityChallenge,
    SanityQuiz,
    SanityTrack,
    SanityInstructor,
    SanityCodeBlock,
} from '@/context/types/course';

// ─── Instructors ────────────────────────────────────────────────────────────

const MOCK_INSTRUCTOR_1: SanityInstructor = {
    _id: 'mock-instructor-1',
    _type: 'instructor',
    name: 'Alex Solana',
    bio: 'Core Solana developer and educator with 5+ years of blockchain experience. Built multiple production dApps and contributed to the Anchor framework.',
    avatar: null,
    walletAddress: '11111111111111111111111111111111',
    socialLinks: {
        twitter: 'https://twitter.com/alexsolana',
        github: 'https://github.com/alexsolana',
    },
};

const MOCK_INSTRUCTOR_2: SanityInstructor = {
    _id: 'mock-instructor-2',
    _type: 'instructor',
    name: 'Maria DeFi',
    bio: 'DeFi researcher and protocol engineer. Previously at Raydium and Orca. Passionate about financial inclusion through decentralized protocols.',
    avatar: null,
    walletAddress: '22222222222222222222222222222222',
    socialLinks: {
        twitter: 'https://twitter.com/mariadefi',
        github: 'https://github.com/mariadefi',
    },
};

// ─── Tracks ─────────────────────────────────────────────────────────────────

const MOCK_TRACK_1: SanityTrack = {
    _id: 'mock-track-solana-dev',
    _type: 'track',
    name: 'Solana Developer',
    slug: { current: 'solana-developer' },
    onChainTrackId: 1,
    description: 'Build Solana programs with Anchor',
    icon: '◎',
    color: '#9945FF',
};

const MOCK_TRACK_2: SanityTrack = {
    _id: 'mock-track-defi',
    _type: 'track',
    name: 'DeFi Specialist',
    slug: { current: 'defi-specialist' },
    onChainTrackId: 2,
    description: 'Learn DeFi protocols and token mechanics',
    icon: '💰',
    color: '#14F195',
};

// ─── Challenge: Hello Solana (Rust) ────────────────────────────────────────

const HELLO_SOLANA_CHALLENGE: SanityChallenge = {
    language: 'rust',
    instructions: `# Hello Solana! 🚀

Write a function called \`hello_solana\` that returns the string \`"Hello, Solana!"\`.

## Requirements
- The function should take no arguments
- It should return a \`String\`
- The returned value must be exactly \`"Hello, Solana!"\`

## Example
\`\`\`rust
let result = hello_solana();
assert_eq!(result, "Hello, Solana!");
\`\`\`

> **Hint:** Use \`String::from()\` or \`.to_string()\` to create a String from a string literal.`,
    starterCode: {
        _type: 'code',
        language: 'rust',
        code: `// Write your hello_solana function here
// It should return a String with the value "Hello, Solana!"

fn hello_solana() -> String {
    // TODO: implement this function
    todo!()
}

fn main() {
    let result = hello_solana();
    println!("{}", result);
}`,
    },
    solutionCode: {
        _type: 'code',
        language: 'rust',
        code: `fn hello_solana() -> String {
    String::from("Hello, Solana!")
}

fn main() {
    let result = hello_solana();
    println!("{}", result);
}`,
    },
    testCases: [
        {
            name: 'Returns correct greeting',
            input: '',
            expectedOutput: 'Hello, Solana!',
            isHidden: false,
        },
        {
            name: 'Returns a String type',
            input: '',
            expectedOutput: 'Hello, Solana!',
            isHidden: false,
        },
        {
            name: 'Does not return empty string',
            input: '',
            expectedOutput: 'Hello, Solana!',
            isHidden: true,
        },
    ],
};

// ─── Challenge: PDA Derivation (Rust) ──────────────────────────────────────

const PDA_DERIVATION_CHALLENGE: SanityChallenge = {
    language: 'rust',
    instructions: `# Derive a PDA Seed 🔑

Write a function called \`derive_enrollment_seed\` that constructs the seed bytes used to derive a Program Derived Address (PDA) for a student enrollment.

## Requirements
- Takes a \`course_id: &str\` and \`student_id: &str\`
- Returns a \`Vec<Vec<u8>>\` containing three seed byte arrays:
  1. The literal string \`"enrollment"\` as bytes
  2. The \`course_id\` as bytes
  3. The \`student_id\` as bytes

## Example
\`\`\`rust
let seeds = derive_enrollment_seed("solana-101", "student-abc");
// seeds[0] == b"enrollment"
// seeds[1] == b"solana-101"
// seeds[2] == b"student-abc"
\`\`\`

> **Hint:** Use \`.as_bytes()\` to convert a \`&str\` to \`&[u8]\`, then \`.to_vec()\` to own it.`,
    starterCode: {
        _type: 'code',
        language: 'rust',
        code: `// Derive the PDA seeds for an enrollment account
// Seeds: ["enrollment", course_id, student_id]

fn derive_enrollment_seed(course_id: &str, student_id: &str) -> Vec<Vec<u8>> {
    // TODO: return a vec of three byte vectors
    todo!()
}

fn main() {
    let seeds = derive_enrollment_seed("solana-101", "student-abc");
    for (i, seed) in seeds.iter().enumerate() {
        println!("Seed {}: {:?}", i, String::from_utf8_lossy(seed));
    }
}`,
    },
    solutionCode: {
        _type: 'code',
        language: 'rust',
        code: `fn derive_enrollment_seed(course_id: &str, student_id: &str) -> Vec<Vec<u8>> {
    vec![
        b"enrollment".to_vec(),
        course_id.as_bytes().to_vec(),
        student_id.as_bytes().to_vec(),
    ]
}

fn main() {
    let seeds = derive_enrollment_seed("solana-101", "student-abc");
    for (i, seed) in seeds.iter().enumerate() {
        println!("Seed {}: {:?}", i, String::from_utf8_lossy(seed));
    }
}`,
    },
    testCases: [
        {
            name: 'Returns 3 seed arrays',
            input: 'solana-101,student-abc',
            expectedOutput: '3',
            isHidden: false,
        },
        {
            name: 'First seed is "enrollment"',
            input: 'solana-101,student-abc',
            expectedOutput: 'enrollment',
            isHidden: false,
        },
        {
            name: 'Seeds contain course and student IDs',
            input: 'defi-201,student-xyz',
            expectedOutput: 'defi-201',
            isHidden: true,
        },
    ],
};

// ─── Challenge: Token Swap Calculator (TypeScript) ─────────────────────────

const TOKEN_SWAP_CHALLENGE: SanityChallenge = {
    language: 'typescript',
    instructions: `# Token Swap Calculator 💱

Implement a \`calculateSwap\` function that uses the **constant product formula** (x * y = k) to calculate the output amount for a token swap.

## Requirements
- Takes \`inputAmount\`, \`inputReserve\`, and \`outputReserve\` as numbers
- Applies a **0.3% fee** on the input (fee = 0.003)
- Uses the constant product formula: \`outputAmount = (inputAfterFee * outputReserve) / (inputReserve + inputAfterFee)\`
- Returns the \`outputAmount\` **rounded down** to the nearest integer

## Example
\`\`\`typescript
calculateSwap(100, 1000, 2000);
// inputAfterFee = 100 * 0.997 = 99.7
// output = (99.7 * 2000) / (1000 + 99.7) = 181.32...
// Returns: 181
\`\`\`

> **Hint:** Use \`Math.floor()\` to round down.`,
    starterCode: {
        _type: 'code',
        language: 'typescript',
        code: `// Implement the constant product swap formula
// Fee: 0.3% (multiply input by 0.997)
// Formula: output = (inputAfterFee * outputReserve) / (inputReserve + inputAfterFee)
// Round down to nearest integer

function calculateSwap(
  inputAmount: number,
  inputReserve: number,
  outputReserve: number
): number {
  // TODO: implement this function
  return 0;
}

// Test your implementation
console.log(calculateSwap(100, 1000, 2000));`,
    },
    solutionCode: {
        _type: 'code',
        language: 'typescript',
        code: `function calculateSwap(
  inputAmount: number,
  inputReserve: number,
  outputReserve: number
): number {
  const fee = 0.003;
  const inputAfterFee = inputAmount * (1 - fee);
  const outputAmount = (inputAfterFee * outputReserve) / (inputReserve + inputAfterFee);
  return Math.floor(outputAmount);
}

console.log(calculateSwap(100, 1000, 2000));`,
    },
    testCases: [
        {
            name: 'Basic swap: 100 tokens (1000/2000 pool)',
            input: '100,1000,2000',
            expectedOutput: '181',
            isHidden: false,
        },
        {
            name: 'Small swap: 10 tokens (500/500 pool)',
            input: '10,500,500',
            expectedOutput: '9',
            isHidden: false,
        },
        {
            name: 'Large swap: 5000 tokens (10000/20000 pool)',
            input: '5000,10000,20000',
            expectedOutput: '6644',
            isHidden: false,
        },
        {
            name: 'Edge case: 1 token swap',
            input: '1,1000,1000',
            expectedOutput: '0',
            isHidden: true,
        },
    ],
};

// ─── Challenge: Liquidity Pool Share (TypeScript) ──────────────────────────

const LIQUIDITY_POOL_CHALLENGE: SanityChallenge = {
    language: 'typescript',
    instructions: `# Liquidity Pool Share Calculator 🏊

Calculate a liquidity provider's share of a pool and the value of their position.

## Requirements
Implement \`calculatePoolShare\` that takes:
- \`lpTokens\`: number of LP tokens the user holds
- \`totalLpSupply\`: total LP tokens in circulation
- \`reserveA\`: total Token A in the pool
- \`reserveB\`: total Token B in the pool
- \`priceA\`: price of Token A in USD
- \`priceB\`: price of Token B in USD

Returns an object with:
- \`sharePercent\`: their share of the pool (as a percentage, 2 decimal places)
- \`tokenA\`: their share of Token A (rounded down)
- \`tokenB\`: their share of Token B (rounded down)
- \`totalValueUsd\`: total USD value of their position (rounded to 2 decimal places)

## Example
\`\`\`typescript
calculatePoolShare(50, 1000, 10000, 20000, 150, 1);
// sharePercent: 5.00
// tokenA: 500, tokenB: 1000
// totalValueUsd: 76000.00
\`\`\``,
    starterCode: {
        _type: 'code',
        language: 'typescript',
        code: `interface PoolPosition {
  sharePercent: number;
  tokenA: number;
  tokenB: number;
  totalValueUsd: number;
}

function calculatePoolShare(
  lpTokens: number,
  totalLpSupply: number,
  reserveA: number,
  reserveB: number,
  priceA: number,
  priceB: number
): PoolPosition {
  // TODO: implement
  return { sharePercent: 0, tokenA: 0, tokenB: 0, totalValueUsd: 0 };
}

const result = calculatePoolShare(50, 1000, 10000, 20000, 150, 1);
console.log(JSON.stringify(result));`,
    },
    solutionCode: {
        _type: 'code',
        language: 'typescript',
        code: `interface PoolPosition {
  sharePercent: number;
  tokenA: number;
  tokenB: number;
  totalValueUsd: number;
}

function calculatePoolShare(
  lpTokens: number,
  totalLpSupply: number,
  reserveA: number,
  reserveB: number,
  priceA: number,
  priceB: number
): PoolPosition {
  const share = lpTokens / totalLpSupply;
  const tokenA = Math.floor(share * reserveA);
  const tokenB = Math.floor(share * reserveB);
  const totalValueUsd = Math.round((tokenA * priceA + tokenB * priceB) * 100) / 100;
  return {
    sharePercent: Math.round(share * 100 * 100) / 100,
    tokenA,
    tokenB,
    totalValueUsd,
  };
}

const result = calculatePoolShare(50, 1000, 10000, 20000, 150, 1);
console.log(JSON.stringify(result));`,
    },
    testCases: [
        {
            name: '5% pool share calculation',
            input: '50,1000,10000,20000,150,1',
            expectedOutput: '76000',
            isHidden: false,
        },
        {
            name: '10% share of equal pool',
            input: '100,1000,5000,5000,2,2',
            expectedOutput: '2000',
            isHidden: false,
        },
        {
            name: '1% micro share',
            input: '1,100,50000,100000,100,50',
            expectedOutput: '100000',
            isHidden: true,
        },
    ],
};

// ─── Quiz Data ──────────────────────────────────────────────────────────────

const ACCOUNTS_QUIZ: SanityQuiz = {
    passThreshold: 70,
    questions: [
        {
            question: 'What is the minimum balance required to keep a Solana account alive?',
            options: ['Gas fee', 'Rent-exempt minimum', 'Staking minimum', 'Transaction fee'],
            correctIndex: 1,
        },
        {
            question: 'Who owns a Solana account?',
            options: ['The user who created it', 'The program that owns it', 'The validator', 'The Solana Foundation'],
            correctIndex: 1,
        },
        {
            question: 'What are PDAs (Program Derived Addresses)?',
            options: [
                'Public wallet addresses',
                'Addresses derived from a program ID and seeds, with no private key',
                'Random addresses for testing',
                'Encrypted addresses for privacy',
            ],
            correctIndex: 1,
        },
    ],
};

const DEFI_QUIZ: SanityQuiz = {
    passThreshold: 70,
    questions: [
        {
            question: 'What does AMM stand for?',
            options: ['Automated Money Maker', 'Automated Market Maker', 'Advanced Market Model', 'Atomic Money Manager'],
            correctIndex: 1,
        },
        {
            question: 'What is impermanent loss?',
            options: [
                'A bug in smart contracts',
                'Loss from providing liquidity when token prices diverge from the initial ratio',
                'Transaction fees paid to validators',
                'Loss from network downtime',
            ],
            correctIndex: 1,
        },
        {
            question: 'In the constant product formula (x * y = k), what does k represent?',
            options: [
                'The number of tokens',
                'The liquidity constant that must be maintained',
                'The swap fee',
                'The pool address',
            ],
            correctIndex: 1,
        },
    ],
};

const SOLANA_BASICS_QUIZ: SanityQuiz = {
    passThreshold: 70,
    questions: [
        {
            question: 'What consensus mechanism does Solana use alongside Tower BFT?',
            options: ['Proof of Work', 'Proof of Stake', 'Proof of History', 'Delegated Proof of Stake'],
            correctIndex: 2,
        },
        {
            question: 'What is the typical transaction cost on Solana?',
            options: ['$5-10', '$0.50-1.00', '$0.01-0.05', 'Less than $0.001'],
            correctIndex: 3,
        },
        {
            question: 'What language are Solana programs primarily written in?',
            options: ['JavaScript', 'Python', 'Rust', 'Go'],
            correctIndex: 2,
        },
    ],
};

// ─── Lessons ────────────────────────────────────────────────────────────────

// Course 1 Lessons — Intro to Solana Development
const COURSE_1_LESSONS: SanityLesson[] = [
    {
        _id: 'mock-lesson-1-1',
        _type: 'lesson',
        title: 'What is Solana?',
        slug: { current: 'what-is-solana' },
        type: 'content',
        order: 0,
        duration: 900,
        xpReward: 100,
        content: `# What is Solana? ◎

Solana is a high-performance blockchain designed for mass adoption. It processes thousands of transactions per second (TPS) with sub-second finality, all while keeping costs incredibly low.

## Key Features

### ⚡ Speed
Solana can process **65,000+ TPS** thanks to its unique **Proof of History (PoH)** consensus mechanism. Each transaction costs a fraction of a cent.

### 🏗️ Architecture
- **Proof of History (PoH):** A cryptographic clock that orders transactions before consensus
- **Tower BFT:** An optimized Byzantine Fault Tolerance consensus
- **Gulf Stream:** Mempool-less transaction forwarding protocol
- **Sealevel:** Parallel smart contract runtime
- **Turbine:** Block propagation protocol

### 💻 Programs
On Solana, smart contracts are called **Programs**. They're written in **Rust** (or C) and compiled to BPF bytecode. Programs are stateless — all state is stored in separate **Accounts**.

\`\`\`rust
use anchor_lang::prelude::*;

declare_id!("YourProgramId");

#[program]
pub mod hello_world {
    use super::*;
    
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Hello, Solana!");
        Ok(())
    }
}
\`\`\`

### 🔑 Key Concepts
| Concept | Description |
|---------|-------------|
| **Accounts** | On-chain storage containers that hold data and SOL |
| **Programs** | Stateless executable code deployed on-chain |
| **Instructions** | Operations that programs can execute |
| **Transactions** | Bundles of instructions signed by one or more wallets |
| **PDAs** | Program-derived addresses for deterministic account creation |

## Why Build on Solana?

1. **Low costs** — Transactions cost ~$0.00025
2. **Fast finality** — ~400ms confirmation time
3. **Composability** — Programs can call other programs
4. **Growing ecosystem** — DeFi, NFTs, Gaming, DePIN, and more

> 💡 **Next up:** Test your understanding with a quick quiz!`,
    },
    {
        _id: 'mock-lesson-1-2',
        _type: 'lesson',
        title: 'Solana Basics Quiz',
        slug: { current: 'solana-basics-quiz' },
        type: 'content',
        order: 1,
        duration: 300,
        xpReward: 100,
        quiz: SOLANA_BASICS_QUIZ,
    },
    {
        _id: 'mock-lesson-1-3',
        _type: 'lesson',
        title: 'Hello Solana — Your First Function',
        slug: { current: 'hello-solana' },
        type: 'challenge',
        order: 2,
        duration: 1200,
        xpReward: 150,
        challenge: HELLO_SOLANA_CHALLENGE,
        hints: [
            'A Rust String can be created with String::from("text")',
            'The function signature should be: fn hello_solana() -> String',
            'Make sure there are no typos in "Hello, Solana!" — including the comma and exclamation mark',
        ],
    },
    {
        _id: 'mock-lesson-1-4',
        _type: 'lesson',
        title: 'Understanding Accounts',
        slug: { current: 'understanding-accounts' },
        type: 'content',
        order: 3,
        duration: 900,
        xpReward: 100,
        content: `# Understanding Solana Accounts 🏦

On Solana, **everything is an account**. Accounts are the fundamental building blocks that store data, hold SOL balances, and define program state.

## Account Structure

Every Solana account has these fields:

\`\`\`
┌─────────────────────────────────────┐
│  lamports: u64      (SOL balance)   │
│  data: Vec<u8>      (arbitrary data)│
│  owner: Pubkey      (program owner) │
│  executable: bool   (is a program?) │
│  rent_epoch: u64    (rent tracking) │
└─────────────────────────────────────┘
\`\`\`

## Key Rules

### 1. Ownership
Only the **owner program** can modify an account's data. However, anyone can credit lamports to an account.

### 2. Rent
Accounts must maintain a minimum balance (rent-exempt minimum) to persist on-chain. For most accounts, this is about **0.00089 SOL** per KB.

### 3. Data Size
Account data size is **fixed at creation**. You cannot resize an account after it's created (unless using the \`realloc\` instruction).

## Program Derived Addresses (PDAs)

PDAs are special addresses derived deterministically from:
- A **program ID**
- One or more **seeds** (byte arrays)

\`\`\`rust
let (pda, bump) = Pubkey::find_program_address(
    &[b"user", user_wallet.as_ref()],
    &program_id,
);
\`\`\`

PDAs are powerful because:
- 🔒 No private key exists — only the program can sign
- 📍 Deterministic — same seeds always produce the same address
- 🗄️ Perfect for storing program state

## Account Types in Superteam Academy

| Account | Seeds | Purpose |
|---------|-------|---------|
| Config | \`["config"]\` | Global program settings |
| Course | \`["course", course_id]\` | Course metadata |
| Enrollment | \`["enrollment", course, learner]\` | Tracks progress |

> 📝 **Next up:** Put your PDA knowledge to practice with a coding challenge!`,
    },
    {
        _id: 'mock-lesson-1-5',
        _type: 'lesson',
        title: 'PDA Derivation Challenge',
        slug: { current: 'pda-derivation' },
        type: 'challenge',
        order: 4,
        duration: 1500,
        xpReward: 150,
        challenge: PDA_DERIVATION_CHALLENGE,
        hints: [
            'Use .as_bytes() to convert a &str to &[u8]',
            'Use .to_vec() to own the byte slice into a Vec<u8>',
            'Return vec![...] with three elements: the literal, course_id bytes, student_id bytes',
        ],
    },
    {
        _id: 'mock-lesson-1-6',
        _type: 'lesson',
        title: 'Accounts & PDAs Quiz',
        slug: { current: 'accounts-quiz' },
        type: 'content',
        order: 5,
        duration: 300,
        xpReward: 100,
        quiz: ACCOUNTS_QUIZ,
    },
];

// Course 2 Lessons — DeFi Fundamentals
const COURSE_2_LESSONS: SanityLesson[] = [
    {
        _id: 'mock-lesson-2-1',
        _type: 'lesson',
        title: 'SPL Tokens Overview',
        slug: { current: 'spl-tokens-overview' },
        type: 'content',
        order: 0,
        duration: 1200,
        xpReward: 150,
        content: `# SPL Tokens on Solana 🪙

The **Solana Program Library (SPL)** Token program is the standard for creating fungible and non-fungible tokens on Solana. It's the equivalent of ERC-20 on Ethereum, but with significantly lower costs.

## Token Architecture

\`\`\`
┌──────────────┐     ┌────────────────────┐
│  Mint Account │────▶│  Token Account(s)  │
│  (defines     │     │  (hold balances)   │
│   the token)  │     └────────────────────┘
└──────────────┘
      │
      ▼
┌──────────────┐
│  Mint        │
│  Authority   │  ← Can mint new tokens
└──────────────┘
\`\`\`

### Mint Account
Defines the token: supply, decimals, and authorities.

### Token Account (ATA)
Holds a user's balance for a specific mint. Each wallet gets an **Associated Token Account (ATA)** per token.

## Token-2022 Extensions

The newer **Token-2022** program adds powerful extensions:

| Extension | Purpose |
|-----------|---------|
| **Transfer Fee** | Automatic fee on every transfer |
| **Non-Transferable** | Soulbound tokens (like XP!) |
| **Confidential Transfers** | Zero-knowledge balances |
| **Interest Bearing** | Built-in yield |
| **Metadata** | On-chain token metadata |

## Superteam Academy XP Token

Our XP token uses Token-2022 with the **non-transferable** extension:

\`\`\`typescript
// XP is soulbound — cannot be transferred between wallets
const xpMint = new PublicKey("HA5ZraV52nBSGdnDfEFvi8683qXHPvaR14NTBhBzxe8a");
\`\`\`

> 💡 **Next:** Build a token swap calculator using the constant product formula!`,
    },
    {
        _id: 'mock-lesson-2-2',
        _type: 'lesson',
        title: 'Token Swap Calculator',
        slug: { current: 'token-swap-calculator' },
        type: 'challenge',
        order: 1,
        duration: 1500,
        xpReward: 200,
        challenge: TOKEN_SWAP_CHALLENGE,
        hints: [
            'The fee is 0.3%, so inputAfterFee = inputAmount * 0.997',
            'Use the formula: output = (inputAfterFee * outputReserve) / (inputReserve + inputAfterFee)',
            'Don\'t forget to Math.floor() the result!',
        ],
    },
    {
        _id: 'mock-lesson-2-3',
        _type: 'lesson',
        title: 'AMM Mechanics',
        slug: { current: 'amm-mechanics' },
        type: 'content',
        order: 2,
        duration: 1200,
        xpReward: 150,
        content: `# Automated Market Makers (AMMs) 🤖

AMMs replaced traditional order books with mathematical pricing formulas. Instead of matching buyers and sellers, AMMs use **liquidity pools** and bonding curves.

## How AMMs Work

\`\`\`
┌───────────────────────────────────────┐
│         Liquidity Pool                │
│                                       │
│   Token A: 1000    Token B: 2000      │
│                                       │
│   k = 1000 * 2000 = 2,000,000        │
│                                       │
│   Swap 100 A → receive ~181 B        │
│                                       │
└───────────────────────────────────────┘
\`\`\`

## Constant Product Formula

The most common AMM formula: **x × y = k**

- **x** = reserve of Token A
- **y** = reserve of Token B  
- **k** = constant product (must be maintained after every swap)

### Price Impact
Larger trades have more **price impact** (slippage). Trading 10% of the pool moves the price significantly more than 0.1%.

## Impermanent Loss

When you provide liquidity, the pool rebalances as prices change:

| Scenario | Your Position | If You HODL'd | Loss |
|----------|--------------|----------------|------|
| Price 2× | $1,414 | $1,500 | 5.7% |
| Price 5× | $2,236 | $3,000 | 25.4% |
| Price 10× | $3,162 | $5,500 | 42.5% |

## Popular Solana DEXes

- **Raydium** — Hybrid AMM + order book
- **Orca** — Concentrated liquidity (Whirlpools)
- **Jupiter** — Aggregator (routes across all DEXes)

> 📝 **Next:** Calculate your pool position value!`,
    },
    {
        _id: 'mock-lesson-2-4',
        _type: 'lesson',
        title: 'Liquidity Pool Share Calculator',
        slug: { current: 'liquidity-pool-share' },
        type: 'challenge',
        order: 3,
        duration: 1800,
        xpReward: 200,
        challenge: LIQUIDITY_POOL_CHALLENGE,
        hints: [
            'Share = lpTokens / totalLpSupply',
            'Token amounts = share * reserve (round down with Math.floor)',
            'Total value = (tokenA * priceA) + (tokenB * priceB), rounded to 2 decimal places',
        ],
    },
    {
        _id: 'mock-lesson-2-5',
        _type: 'lesson',
        title: 'DeFi Knowledge Check',
        slug: { current: 'defi-quiz' },
        type: 'content',
        order: 4,
        duration: 300,
        xpReward: 150,
        quiz: DEFI_QUIZ,
    },
];

// ─── Modules ────────────────────────────────────────────────────────────────

const COURSE_1_MODULES: SanityModule[] = [
    {
        _id: 'mock-module-1-1',
        _type: 'module',
        title: 'Getting Started with Solana',
        description: 'Learn the basics of Solana blockchain — architecture, consensus, and why developers choose it.',
        order: 0,
        lessons: [COURSE_1_LESSONS[0], COURSE_1_LESSONS[1], COURSE_1_LESSONS[2]],
    },
    {
        _id: 'mock-module-1-2',
        _type: 'module',
        title: 'Accounts & Program Derived Addresses',
        description: 'Master how Solana stores data on-chain using accounts and deterministic PDA derivation.',
        order: 1,
        lessons: [COURSE_1_LESSONS[3], COURSE_1_LESSONS[4], COURSE_1_LESSONS[5]],
    },
];

const COURSE_2_MODULES: SanityModule[] = [
    {
        _id: 'mock-module-2-1',
        _type: 'module',
        title: 'Token Fundamentals',
        description: 'Understand SPL tokens, Token-2022 extensions, and build a swap calculator from scratch.',
        order: 0,
        lessons: [COURSE_2_LESSONS[0], COURSE_2_LESSONS[1]],
    },
    {
        _id: 'mock-module-2-2',
        _type: 'module',
        title: 'Liquidity & DeFi Mechanics',
        description: 'Learn how AMMs work, calculate pool positions, understand impermanent loss, and test your DeFi knowledge.',
        order: 1,
        lessons: [COURSE_2_LESSONS[2], COURSE_2_LESSONS[3], COURSE_2_LESSONS[4]],
    },
];

// ─── Full Courses ───────────────────────────────────────────────────────────

export const MOCK_SANITY_COURSES: SanityCourse[] = [
    {
        _id: 'mock-sanity-course-1',
        _type: 'course',
        title: 'Intro to Solana Development',
        slug: { current: 'intro-to-solana' },
        onChainCourseId: 'mock-course-1',
        description: 'Start your Solana journey! Learn the fundamentals of blockchain development, write your first Rust program, understand the account model, and derive Program Derived Addresses.',
        thumbnail: null,
        difficulty: 'easy',
        xpPerLesson: 100,
        estimatedDuration: 90,
        isPublished: true,
        publishedAt: '2026-01-15T00:00:00Z',
        tags: ['solana', 'rust', 'beginner', 'blockchain', 'anchor', 'accounts', 'pda'],
        instructor: MOCK_INSTRUCTOR_1,
        track: MOCK_TRACK_1,
        modules: COURSE_1_MODULES,
    },
    {
        _id: 'mock-sanity-course-2',
        _type: 'course',
        title: 'DeFi Fundamentals on Solana',
        slug: { current: 'defi-fundamentals' },
        onChainCourseId: 'mock-course-2',
        description: 'Master decentralized finance on Solana. Learn about SPL tokens, Token-2022 extensions, AMM mechanics, build a token swap calculator, and compute liquidity pool positions.',
        thumbnail: null,
        difficulty: 'medium',
        xpPerLesson: 150,
        estimatedDuration: 120,
        isPublished: true,
        publishedAt: '2026-02-01T00:00:00Z',
        tags: ['defi', 'typescript', 'intermediate', 'tokens', 'amm', 'liquidity', 'spl'],
        instructor: MOCK_INSTRUCTOR_2,
        track: MOCK_TRACK_2,
        modules: COURSE_2_MODULES,
    },
];
