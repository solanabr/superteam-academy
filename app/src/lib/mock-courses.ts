import type { Course } from "@/types";

/** Sample courses with realistic Solana content (6 courses, 124 total lessons, 41 challenges). */
export const MOCK_COURSES: Course[] = [
  {
    id: "1",
    slug: "intro-to-solana",
    title: "Introduction to Solana",
    description:
      "Learn the fundamentals of Solana blockchain — accounts, transactions, programs, and the runtime model that makes Solana the fastest blockchain.",
    thumbnail: "/images/courses/intro-solana.jpg",
    difficulty: "beginner",
    duration: "4 hours",
    lessonCount: 12,
    challengeCount: 4,
    xpTotal: 600,
    trackId: 0,
    trackLevel: 1,
    trackName: "Standalone",
    creator: "Superteam Brazil",
    isActive: true,
    totalEnrollments: 1247,
    totalCompletions: 832,
    tags: ["solana", "blockchain", "fundamentals"],
    modules: [
      {
        id: "m1",
        title: "Getting Started",
        description: "Set up your development environment",
        order: 0,
        lessons: [
          {
            id: "l1",
            title: "What is Solana?",
            description: "Understanding Solana's architecture and design philosophy",
            type: "content",
            order: 0,
            xpReward: 20,
            duration: "15 min",
          },
          {
            id: "l2",
            title: "Install the Solana CLI",
            description: "Set up Solana CLI tools on your machine",
            type: "content",
            order: 1,
            xpReward: 30,
            duration: "20 min",
          },
          {
            id: "l3",
            title: "Your First Transaction",
            description: "Send SOL on devnet",
            type: "challenge",
            order: 2,
            xpReward: 50,
            duration: "25 min",
            challenge: {
              id: "c1",
              prompt: "Write a function that creates a transfer instruction and sends 0.1 SOL from one keypair to another on devnet.",
              starterCode: `import { Connection, Keypair, LAMPORTS_PER_SOL, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";

async function transferSol(from: Keypair, to: Keypair, amount: number): Promise<string> {
  const connection = new Connection("https://api.devnet.solana.com");

  // TODO: Create a transfer instruction
  // TODO: Create a transaction and add the instruction
  // TODO: Send and confirm the transaction
  // TODO: Return the transaction signature
}`,
              language: "typescript",
              testCases: [
                {
                  id: "t1",
                  name: "Transfer completes successfully",
                  input: "0.1 SOL",
                  expectedOutput: "Transaction signature string",
                },
                {
                  id: "t2",
                  name: "Recipient balance increases",
                  input: "Check balance after transfer",
                  expectedOutput: "Balance increased by 0.1 SOL",
                },
              ],
              hints: [
                "Use SystemProgram.transfer() to create the instruction",
                "A transaction needs a recent blockhash — use connection.getLatestBlockhash()",
              ],
              solution: `import { Connection, Keypair, LAMPORTS_PER_SOL, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";

async function transferSol(from: Keypair, to: Keypair, amount: number): Promise<string> {
  const connection = new Connection("https://api.devnet.solana.com");

  const instruction = SystemProgram.transfer({
    fromPubkey: from.publicKey,
    toPubkey: to.publicKey,
    lamports: amount * LAMPORTS_PER_SOL,
  });

  const transaction = new Transaction().add(instruction);
  const signature = await sendAndConfirmTransaction(connection, transaction, [from]);
  return signature;
}`,
            },
          },
        ],
      },
      {
        id: "m2",
        title: "Accounts & Programs",
        description: "Deep dive into Solana's account model",
        order: 1,
        lessons: [
          {
            id: "l4",
            title: "The Account Model",
            description: "How Solana stores data in accounts",
            type: "content",
            order: 0,
            xpReward: 25,
            duration: "20 min",
          },
          {
            id: "l5",
            title: "Program Derived Addresses",
            description: "Understanding PDAs and their role",
            type: "content",
            order: 1,
            xpReward: 30,
            duration: "25 min",
          },
          {
            id: "l6",
            title: "Create a PDA",
            description: "Derive and use a PDA in code",
            type: "challenge",
            order: 2,
            xpReward: 50,
            duration: "30 min",
            challenge: {
              id: "c2",
              prompt: "Write a function that derives a PDA from a program ID and seeds, then verifies the bump seed.",
              starterCode: `import { PublicKey } from "@solana/web3.js";

function derivePDA(programId: PublicKey, seeds: Buffer[]): [PublicKey, number] {
  // TODO: Use PublicKey.findProgramAddressSync to derive the PDA
  // TODO: Return [pda, bump]
}`,
              language: "typescript",
              testCases: [
                {
                  id: "t1",
                  name: "PDA derived correctly",
                  input: "Program ID + seeds",
                  expectedOutput: "Valid PDA and bump",
                },
              ],
              hints: ["PublicKey.findProgramAddressSync takes an array of Buffer seeds and the programId"],
              solution: `import { PublicKey } from "@solana/web3.js";

function derivePDA(programId: PublicKey, seeds: Buffer[]): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(seeds, programId);
}`,
            },
          },
        ],
      },
    ],
    prerequisites: [],
    createdAt: "2026-01-15T00:00:00Z",
    updatedAt: "2026-02-01T00:00:00Z",
  },
  {
    id: "2",
    slug: "anchor-fundamentals",
    title: "Anchor Framework Fundamentals",
    description:
      "Build Solana programs with Anchor — the most popular framework for Solana smart contract development. PDAs, CPIs, testing, and deployment.",
    thumbnail: "/images/courses/anchor.jpg",
    difficulty: "intermediate",
    duration: "8 hours",
    lessonCount: 20,
    challengeCount: 8,
    xpTotal: 1200,
    trackId: 1,
    trackLevel: 1,
    trackName: "Anchor Framework",
    creator: "Superteam Brazil",
    isActive: true,
    totalEnrollments: 856,
    totalCompletions: 412,
    tags: ["anchor", "rust", "programs"],
    modules: [
      {
        id: "m1",
        title: "Anchor Basics",
        description: "Your first Anchor program",
        order: 0,
        lessons: [
          {
            id: "l1",
            title: "What is Anchor?",
            description: "Why Anchor and how it simplifies Solana development",
            type: "content",
            order: 0,
            xpReward: 20,
            duration: "15 min",
          },
          {
            id: "l2",
            title: "Hello World Program",
            description: "Write, build, and deploy your first Anchor program",
            type: "challenge",
            order: 1,
            xpReward: 75,
            duration: "40 min",
            challenge: {
              id: "c1",
              prompt: "Write an Anchor program with an 'initialize' instruction that creates a counter account and sets it to 0.",
              starterCode: `use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod counter {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        // TODO: Set the counter to 0
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    // TODO: Define the accounts needed
}

#[account]
pub struct Counter {
    pub count: u64,
}`,
              language: "rust",
              testCases: [
                {
                  id: "t1",
                  name: "Counter initialized to 0",
                  input: "Call initialize",
                  expectedOutput: "counter.count == 0",
                },
              ],
              hints: [
                "You need a #[account(init, ...)] attribute for the counter",
                "Don't forget the payer and system_program accounts",
              ],
              solution: `use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod counter {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count = 0;
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

#[account]
pub struct Counter {
    pub count: u64,
}`,
            },
          },
        ],
      },
    ],
    prerequisites: ["intro-to-solana"],
    createdAt: "2026-01-20T00:00:00Z",
    updatedAt: "2026-02-05T00:00:00Z",
  },
  {
    id: "3",
    slug: "token-engineering",
    title: "Token Engineering on Solana",
    description:
      "Master SPL tokens, Token-2022 extensions, and token economics. Build fungible tokens, NFTs, and soulbound tokens.",
    thumbnail: "/images/courses/tokens.jpg",
    difficulty: "intermediate",
    duration: "6 hours",
    lessonCount: 16,
    challengeCount: 6,
    xpTotal: 1000,
    trackId: 6,
    trackLevel: 1,
    trackName: "Token Engineering",
    creator: "Superteam Brazil",
    isActive: true,
    totalEnrollments: 634,
    totalCompletions: 298,
    tags: ["tokens", "spl", "token-2022", "nft"],
    modules: [],
    prerequisites: ["intro-to-solana"],
    createdAt: "2026-01-25T00:00:00Z",
    updatedAt: "2026-02-08T00:00:00Z",
  },
  {
    id: "4",
    slug: "defi-fundamentals",
    title: "DeFi on Solana",
    description:
      "Learn how decentralized finance works on Solana. Build AMMs, lending protocols, and understand liquidity mechanics.",
    thumbnail: "/images/courses/defi.jpg",
    difficulty: "advanced",
    duration: "12 hours",
    lessonCount: 24,
    challengeCount: 10,
    xpTotal: 2000,
    trackId: 3,
    trackLevel: 2,
    trackName: "DeFi Development",
    creator: "Superteam Brazil",
    isActive: true,
    totalEnrollments: 423,
    totalCompletions: 156,
    tags: ["defi", "amm", "lending", "liquidity"],
    modules: [],
    prerequisites: ["anchor-fundamentals", "token-engineering"],
    createdAt: "2026-02-01T00:00:00Z",
    updatedAt: "2026-02-10T00:00:00Z",
  },
  {
    id: "5",
    slug: "solana-security",
    title: "Solana Program Security",
    description:
      "Identify and prevent common vulnerabilities in Solana programs. Reentrancy, owner validation, PDA attacks, and more.",
    thumbnail: "/images/courses/security.jpg",
    difficulty: "advanced",
    duration: "10 hours",
    lessonCount: 18,
    challengeCount: 8,
    xpTotal: 1800,
    trackId: 4,
    trackLevel: 1,
    trackName: "Program Security",
    creator: "Superteam Brazil",
    isActive: true,
    totalEnrollments: 312,
    totalCompletions: 98,
    tags: ["security", "audit", "vulnerabilities"],
    modules: [],
    prerequisites: ["anchor-fundamentals"],
    createdAt: "2026-02-05T00:00:00Z",
    updatedAt: "2026-02-11T00:00:00Z",
  },
  {
    id: "6",
    slug: "nextjs-solana-dapps",
    title: "Full Stack Solana with Next.js",
    description:
      "Build production-ready dApps using Next.js, Wallet Adapter, and Anchor client. From wallet connection to transaction signing.",
    thumbnail: "/images/courses/fullstack.jpg",
    difficulty: "intermediate",
    duration: "7 hours",
    lessonCount: 14,
    challengeCount: 5,
    xpTotal: 900,
    trackId: 5,
    trackLevel: 1,
    trackName: "Frontend & dApps",
    creator: "Superteam Brazil",
    isActive: true,
    totalEnrollments: 567,
    totalCompletions: 234,
    tags: ["nextjs", "react", "frontend", "dapp"],
    modules: [],
    prerequisites: ["intro-to-solana"],
    createdAt: "2026-01-28T00:00:00Z",
    updatedAt: "2026-02-09T00:00:00Z",
  },
];
