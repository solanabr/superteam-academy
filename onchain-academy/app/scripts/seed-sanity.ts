/**
 * Sanity CMS Seed Script — Superteam Academy
 *
 * Populates Sanity with 6 real Solana courses, complete with modules,
 * lessons (content + code challenges), and instructor profiles.
 *
 * Usage:
 *   1. Set NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN in .env.local
 *   2. Run: npx tsx scripts/seed-sanity.ts
 */

import { createClient } from "@sanity/client";
import * as fs from "fs";
import * as path from "path";

// Load .env.local
const envPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const token = process.env.SANITY_API_TOKEN;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

if (!projectId || !token) {
  console.error(
    "Missing NEXT_PUBLIC_SANITY_PROJECT_ID or SANITY_API_TOKEN in .env.local",
  );
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  token,
  useCdn: false,
  apiVersion: "2024-01-01",
});

// ── Helpers ──────────────────────────────────────────────────────────────────

interface LessonDef {
  title: string;
  slug: string;
  type: "content" | "challenge";
  markdownContent?: string;
  challenge?: {
    prompt: string;
    language: string;
    starterCode: string;
    solutionCode: string;
    testCases: { name: string; input: string; expectedOutput: string }[];
    hints: string[];
  };
  xpReward: number;
  estimatedMinutes: number;
  order: number;
}

interface ModuleDef {
  title: string;
  description: string;
  order: number;
  lessons: LessonDef[];
}

interface CourseDef {
  title: string;
  slug: string;
  description: string;
  track: string;
  difficulty: string;
  estimatedHours: number;
  xpReward: number;
  learningOutcomes: string[];
  order: number;
  modules: ModuleDef[];
}

async function createLesson(lesson: LessonDef): Promise<string> {
  const doc: { _type: string; [key: string]: unknown } = {
    _type: "lesson",
    title: lesson.title,
    slug: { _type: "slug", current: lesson.slug },
    type: lesson.type,
    xpReward: lesson.xpReward,
    estimatedMinutes: lesson.estimatedMinutes,
    order: lesson.order,
  };
  if (lesson.markdownContent) doc.markdownContent = lesson.markdownContent;
  if (lesson.challenge) doc.challenge = lesson.challenge;
  const created = await client.create(doc);
  return created._id;
}

async function createModule(mod: ModuleDef): Promise<string> {
  const lessonIds: string[] = [];
  for (const lesson of mod.lessons) {
    const id = await createLesson(lesson);
    lessonIds.push(id);
    process.stdout.write(".");
  }
  const created = await client.create({
    _type: "module",
    title: mod.title,
    description: mod.description,
    order: mod.order,
    lessons: lessonIds.map((id) => ({
      _type: "reference",
      _ref: id,
      _key: id.slice(-8),
    })),
  });
  return created._id;
}

async function createCourse(
  course: CourseDef,
  instructorId: string,
  prerequisiteId?: string,
): Promise<string> {
  console.log(`\n  Creating: ${course.title}`);
  const moduleIds: string[] = [];
  for (const mod of course.modules) {
    const id = await createModule(mod);
    moduleIds.push(id);
  }
  const doc: { _type: string; [key: string]: unknown } = {
    _type: "course",
    title: course.title,
    slug: { _type: "slug", current: course.slug },
    description: course.description,
    track: course.track,
    difficulty: course.difficulty,
    estimatedHours: course.estimatedHours,
    xpReward: course.xpReward,
    learningOutcomes: course.learningOutcomes,
    order: course.order,
    published: true,
    instructor: { _type: "reference", _ref: instructorId },
    modules: moduleIds.map((id) => ({
      _type: "reference",
      _ref: id,
      _key: id.slice(-8),
    })),
  };
  if (prerequisiteId) {
    doc.prerequisites = [
      {
        _type: "reference",
        _ref: prerequisiteId,
        _key: prerequisiteId.slice(-8),
      },
    ];
  }
  const created = await client.create(doc);
  console.log(
    `  ✓ ${course.title} (${course.modules.reduce((a, m) => a + m.lessons.length, 0)} lessons)`,
  );
  return created._id;
}

// ── Course Data ──────────────────────────────────────────────────────────────

const COURSES: (CourseDef & { prereqSlug?: string })[] = [
  // ─── Course 1: Introduction to Solana ──────────────────────────────────
  {
    title: "Introduction to Solana",
    slug: "introduction-to-solana",
    description:
      "Learn the fundamentals of the Solana blockchain. Understand accounts, transactions, programs, and the runtime. Deploy your first program to devnet.",
    track: "rust",
    difficulty: "beginner",
    estimatedHours: 4,
    xpReward: 500,
    order: 1,
    learningOutcomes: [
      "How Solana's account model differs from Ethereum's",
      "The structure of transactions and instructions",
      "What programs are and how they execute",
      "How to use the Solana CLI and web3.js",
      "How to deploy a program to devnet",
    ],
    modules: [
      {
        title: "Solana Architecture",
        description: "Understand accounts, programs, and the runtime.",
        order: 1,
        lessons: [
          {
            title: "What Makes Solana Different",
            slug: "what-makes-solana-different",
            type: "content",
            xpReward: 10,
            estimatedMinutes: 15,
            order: 1,
            markdownContent: `# What Makes Solana Different

Solana is a high-performance blockchain that processes thousands of transactions per second with sub-second finality. But the real difference isn't just speed — it's the programming model.

## The Account Model

Unlike Ethereum where smart contracts store their own data, Solana separates **code** from **data**. Programs are stateless — they read and write data to separate **accounts** passed into each transaction.

- **Ethereum:** A vending machine that holds both the logic AND the inventory
- **Solana:** A factory worker (program) that receives parts (accounts) and assembles them

This separation enables parallelism. The runtime knows which accounts each transaction touches and can execute non-overlapping transactions simultaneously.

## Key Concepts

Every account has:
- An **address** (32-byte public key)
- A **balance** (in lamports, 1 SOL = 1 billion lamports)
- An **owner** (the program that can modify this account's data)
- **Data** (an arbitrary byte array)

## Programs

Programs are stateless, upgradeable by default, written in Rust, compiled to BPF bytecode, and have a single entry point: \`process_instruction\`.

## Transactions

A transaction contains one or more instructions targeting specific programs. The entire transaction is atomic — if any instruction fails, all changes roll back.`,
          },
          {
            title: "Setting Up Your Environment",
            slug: "setting-up-your-environment",
            type: "content",
            xpReward: 15,
            estimatedMinutes: 20,
            order: 2,
            markdownContent: `# Setting Up Your Development Environment

## Install the Solana CLI

\`\`\`bash
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
solana --version
solana config set --url devnet
solana-keygen new --outfile ~/.config/solana/devnet.json
solana airdrop 2
\`\`\`

## Install Anchor

\`\`\`bash
cargo install --git https://github.com/coral-xyz/anchor avm --force
avm install latest
avm use latest
\`\`\`

## Your First Anchor Project

\`\`\`bash
anchor init my-first-project
cd my-first-project
anchor build
anchor test
\`\`\``,
          },
          {
            title: "Reading On-Chain Data",
            slug: "reading-on-chain-data",
            type: "challenge",
            xpReward: 25,
            estimatedMinutes: 25,
            order: 3,
            challenge: {
              prompt:
                "Write a TypeScript script using @solana/web3.js that connects to devnet, fetches account info for a public key, and displays the SOL balance.",
              language: "typescript",
              starterCode: `import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

const DEVNET_URL = "https://api.devnet.solana.com";

async function getAccountBalance(address: string): Promise<void> {
  // TODO: Create a connection to devnet
  // TODO: Convert address string to PublicKey
  // TODO: Fetch account info
  // TODO: Print balance in SOL
}

getAccountBalance("So11111111111111111111111111111111111111112");`,
              solutionCode: `import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

const DEVNET_URL = "https://api.devnet.solana.com";

async function getAccountBalance(address: string): Promise<void> {
  const connection = new Connection(DEVNET_URL, "confirmed");
  const publicKey = new PublicKey(address);
  const accountInfo = await connection.getAccountInfo(publicKey);
  if (accountInfo) {
    console.log(\`Balance: \${accountInfo.lamports / LAMPORTS_PER_SOL} SOL\`);
    console.log(\`Owner: \${accountInfo.owner.toBase58()}\`);
  } else {
    console.log("Account not found");
  }
}

getAccountBalance("So11111111111111111111111111111111111111112");`,
              testCases: [
                {
                  name: "Creates a Connection object",
                  input: "",
                  expectedOutput: "connection is defined",
                },
                {
                  name: "Converts string to PublicKey",
                  input: "",
                  expectedOutput: "publicKey is valid",
                },
                {
                  name: "Fetches account info",
                  input: "",
                  expectedOutput: "accountInfo is not null",
                },
                {
                  name: "Displays balance in SOL",
                  input: "",
                  expectedOutput: "output contains decimal SOL value",
                },
              ],
              hints: [
                "Use new Connection(url, 'confirmed') to create a connection",
                "Divide lamports by LAMPORTS_PER_SOL to get SOL",
              ],
            },
          },
        ],
      },
      {
        title: "Transactions Deep Dive",
        description: "Learn how transactions and instructions work.",
        order: 2,
        lessons: [
          {
            title: "Anatomy of a Transaction",
            slug: "anatomy-of-a-transaction",
            type: "content",
            xpReward: 15,
            estimatedMinutes: 20,
            order: 1,
            markdownContent: `# Anatomy of a Solana Transaction

A transaction has two parts: **signatures** and a **message**. The message contains account keys, a recent blockhash, and instructions.

## Building a Transfer

\`\`\`typescript
import { Connection, Keypair, SystemProgram, Transaction, sendAndConfirmTransaction, LAMPORTS_PER_SOL } from "@solana/web3.js";

const transaction = new Transaction().add(
  SystemProgram.transfer({
    fromPubkey: sender.publicKey,
    toPubkey: receiver.publicKey,
    lamports: 0.5 * LAMPORTS_PER_SOL,
  })
);

const signature = await sendAndConfirmTransaction(connection, transaction, [sender]);
\`\`\`

## Transaction Fees & Limits

- Base fee: 5,000 lamports per signature (0.000005 SOL)
- Max transaction size: 1,232 bytes
- Max compute units: 1,400,000 (default 200,000)`,
          },
          {
            title: "Instruction Data Encoding",
            slug: "instruction-data-encoding",
            type: "content",
            xpReward: 15,
            estimatedMinutes: 15,
            order: 2,
            markdownContent: `# Instruction Data Encoding

Programs receive raw bytes as instruction_data. Anchor uses an 8-byte discriminator from SHA256 of the function name. Without Anchor, use Borsh serialization.

\`\`\`rust
#[derive(BorshSerialize, BorshDeserialize)]
pub enum MyInstruction {
    Initialize { name: String, value: u64 },
    Update { new_value: u64 },
    Close,
}
\`\`\``,
          },
          {
            title: "Build a SOL Transfer",
            slug: "build-a-sol-transfer",
            type: "challenge",
            xpReward: 30,
            estimatedMinutes: 25,
            order: 3,
            challenge: {
              prompt:
                "Create a function that builds and sends a SOL transfer on devnet. Request an airdrop, transfer SOL, and return the transaction signature.",
              language: "typescript",
              starterCode: `import { Connection, Keypair, SystemProgram, Transaction, sendAndConfirmTransaction, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

async function transferSol(amountInSol: number, recipientAddress: string): Promise<string> {
  // TODO: Create connection, generate sender, airdrop, build tx, send
  return "";
}`,
              solutionCode: `import { Connection, Keypair, SystemProgram, Transaction, sendAndConfirmTransaction, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

async function transferSol(amountInSol: number, recipientAddress: string): Promise<string> {
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const sender = Keypair.generate();
  const airdropSig = await connection.requestAirdrop(sender.publicKey, 2 * LAMPORTS_PER_SOL);
  await connection.confirmTransaction(airdropSig);
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: sender.publicKey,
      toPubkey: new PublicKey(recipientAddress),
      lamports: amountInSol * LAMPORTS_PER_SOL,
    })
  );
  return await sendAndConfirmTransaction(connection, tx, [sender]);
}`,
              testCases: [
                {
                  name: "Creates connection to devnet",
                  input: "",
                  expectedOutput: "Connection targets devnet",
                },
                {
                  name: "Transfer sent",
                  input: "",
                  expectedOutput: "Valid signature returned",
                },
              ],
              hints: [
                "Multiply amountInSol by LAMPORTS_PER_SOL",
                "Await confirmTransaction after airdrop",
              ],
            },
          },
        ],
      },
      {
        title: "Program Derived Addresses",
        description: "Learn PDAs — the cornerstone of Solana state management.",
        order: 3,
        lessons: [
          {
            title: "Understanding PDAs",
            slug: "understanding-pdas",
            type: "content",
            xpReward: 20,
            estimatedMinutes: 20,
            order: 1,
            markdownContent: `# Program Derived Addresses (PDAs)

PDAs allow programs to "own" accounts deterministically — no private key needed. They are addresses that fall OFF the ed25519 curve.

\`\`\`rust
let (pda, bump) = Pubkey::find_program_address(
    &[b"user-profile", user_pubkey.as_ref()],
    &program_id,
);
\`\`\`

## Common Patterns

- **User Profile:** seeds = ["profile", user_wallet]
- **Global State:** seeds = ["global-state"]
- **Relationship:** seeds = ["enrollment", course_id, user_wallet]`,
          },
          {
            title: "PDAs in Anchor",
            slug: "pdas-in-anchor",
            type: "content",
            xpReward: 15,
            estimatedMinutes: 15,
            order: 2,
            markdownContent: `# PDAs in Anchor

\`\`\`rust
#[derive(Accounts)]
pub struct CreateProfile<'info> {
    #[account(init, payer = user, space = 8 + UserProfile::INIT_SPACE,
              seeds = [b"profile", user.key().as_ref()], bump)]
    pub profile: Account<'info, UserProfile>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}
\`\`\`

Client-side derivation:
\`\`\`typescript
const [profilePda] = PublicKey.findProgramAddressSync(
  [Buffer.from("profile"), wallet.publicKey.toBuffer()],
  programId
);
\`\`\``,
          },
          {
            title: "Create a PDA Counter",
            slug: "create-a-pda-counter",
            type: "challenge",
            xpReward: 35,
            estimatedMinutes: 30,
            order: 3,
            challenge: {
              prompt:
                "Using Anchor, write instructions to initialize a counter PDA (seeded by user wallet) with count: u64 and bump: u8, then increment it.",
              language: "rust",
              starterCode: `use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod counter {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        // TODO: Set count to 0, store bump
        Ok(())
    }
    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        // TODO: Increment count
        Ok(())
    }
}
// TODO: Define Counter, Initialize, Increment`,
              solutionCode: `use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod counter {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count = 0;
        counter.bump = ctx.bumps.counter;
        Ok(())
    }
    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        ctx.accounts.counter.count = ctx.accounts.counter.count.checked_add(1).unwrap();
        Ok(())
    }
}

#[account]
#[derive(InitSpace)]
pub struct Counter { pub count: u64, pub bump: u8 }

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + Counter::INIT_SPACE,
              seeds = [b"counter", user.key().as_ref()], bump)]
    pub counter: Account<'info, Counter>,
    #[account(mut)] pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(mut, seeds = [b"counter", user.key().as_ref()], bump = counter.bump)]
    pub counter: Account<'info, Counter>,
    pub user: Signer<'info>,
}`,
              testCases: [
                {
                  name: "Counter starts at 0",
                  input: "",
                  expectedOutput: "count equals 0",
                },
                { name: "Bump stored", input: "", expectedOutput: "valid u8" },
                {
                  name: "Increment works",
                  input: "",
                  expectedOutput: "count equals 1",
                },
              ],
              hints: [
                "Use #[derive(InitSpace)]",
                "Space = 8 + Counter::INIT_SPACE",
                "Use checked_add",
              ],
            },
          },
        ],
      },
    ],
  },

  // ─── Course 2: Anchor Development ──────────────────────────────────────
  {
    title: "Anchor Framework Development",
    slug: "anchor-development",
    description:
      "Build Solana programs with the Anchor framework. Learn account validation, instruction handlers, error handling, testing, and deployment.",
    track: "anchor",
    difficulty: "intermediate",
    estimatedHours: 6,
    xpReward: 800,
    order: 2,
    prereqSlug: "introduction-to-solana",
    learningOutcomes: [
      "Anchor project structure and build process",
      "Account validation and constraint macros",
      "Custom error handling and events",
      "Cross-Program Invocations (CPIs)",
      "Testing with Bankrun and integration tests",
    ],
    modules: [
      {
        title: "Anchor Fundamentals",
        description: "Core concepts of the Anchor framework.",
        order: 1,
        lessons: [
          {
            title: "What is Anchor?",
            slug: "what-is-anchor",
            type: "content",
            xpReward: 25,
            estimatedMinutes: 10,
            order: 1,
            markdownContent: `# What is Anchor?\n\nAnchor is the dominant framework for Solana programs. It provides account validation via constraints, automatic Borsh serialization, IDL generation, and testing utilities.\n\n\`\`\`rust\n#[program]\npub mod my_program {\n    pub fn initialize(ctx: Context<Initialize>, data: u64) -> Result<()> {\n        ctx.accounts.my_account.data = data;\n        Ok(())\n    }\n}\n\`\`\``,
          },
          {
            title: "Account Constraints",
            slug: "account-constraints",
            type: "content",
            xpReward: 30,
            estimatedMinutes: 15,
            order: 2,
            markdownContent: `# Account Constraints\n\nAnchor validates accounts declaratively:\n\n\`\`\`rust\n#[account(mut, seeds = [b"data", user.key().as_ref()], bump = data.bump, has_one = authority)]\npub data: Account<'info, MyData>,\n\`\`\`\n\nKey constraints: \`init\`, \`mut\`, \`seeds/bump\`, \`has_one\`, \`constraint\`, \`close\`, \`realloc\`.`,
          },
          {
            title: "Your First Anchor Program",
            slug: "first-anchor-program",
            type: "challenge",
            xpReward: 60,
            estimatedMinutes: 30,
            order: 3,
            challenge: {
              prompt:
                "Create an Anchor program that initializes a Greeting account with a message (max 280 chars) and the authority's public key.",
              language: "rust",
              starterCode: `use anchor_lang::prelude::*;\n\ndeclare_id!("11111111111111111111111111111111");\n\n#[program]\npub mod greeting {\n    use super::*;\n    pub fn initialize(ctx: Context<Initialize>, message: String) -> Result<()> {\n        // TODO\n        Ok(())\n    }\n}\n// TODO: Define Greeting account and Initialize struct`,
              solutionCode: `use anchor_lang::prelude::*;\n\ndeclare_id!("11111111111111111111111111111111");\n\n#[program]\npub mod greeting {\n    use super::*;\n    pub fn initialize(ctx: Context<Initialize>, message: String) -> Result<()> {\n        let g = &mut ctx.accounts.greeting;\n        g.authority = ctx.accounts.user.key();\n        g.message = message;\n        Ok(())\n    }\n}\n\n#[account]\n#[derive(InitSpace)]\npub struct Greeting {\n    pub authority: Pubkey,\n    #[max_len(280)]\n    pub message: String,\n}\n\n#[derive(Accounts)]\npub struct Initialize<'info> {\n    #[account(init, payer = user, space = 8 + Greeting::INIT_SPACE)]\n    pub greeting: Account<'info, Greeting>,\n    #[account(mut)] pub user: Signer<'info>,\n    pub system_program: Program<'info, System>,\n}`,
              testCases: [
                {
                  name: "Greeting account created",
                  input: "",
                  expectedOutput: "account exists",
                },
                {
                  name: "Message stored",
                  input: "",
                  expectedOutput: "matches input",
                },
              ],
              hints: [
                "Use #[max_len(280)] for String fields",
                "Space = 8 + Greeting::INIT_SPACE",
              ],
            },
          },
        ],
      },
      {
        title: "State Management & CPIs",
        description: "Advanced state patterns and cross-program invocations.",
        order: 2,
        lessons: [
          {
            title: "CPIs Explained",
            slug: "cpis-explained",
            type: "content",
            xpReward: 30,
            estimatedMinutes: 15,
            order: 1,
            markdownContent: `# Cross-Program Invocations\n\nCPIs let your program call other programs:\n\n\`\`\`rust\ntoken::mint_to(\n    CpiContext::new_with_signer(\n        ctx.accounts.token_program.to_account_info(),\n        MintTo { mint, to, authority },\n        signer_seeds,\n    ),\n    amount,\n)?;\n\`\`\`\n\nUse \`CpiContext::new\` for user signers, \`new_with_signer\` for PDA signers.`,
          },
          {
            title: "Build a Voting Program",
            slug: "build-voting-program",
            type: "challenge",
            xpReward: 100,
            estimatedMinutes: 45,
            order: 2,
            challenge: {
              prompt:
                "Build a voting program: create_poll (with options), cast_vote (one per user via PDA), and tally results. Include error handling.",
              language: "rust",
              starterCode: `use anchor_lang::prelude::*;\n\ndeclare_id!("11111111111111111111111111111111");\n\n#[program]\npub mod voting {\n    use super::*;\n    // TODO: create_poll, cast_vote\n}`,
              solutionCode: `use anchor_lang::prelude::*;\n\ndeclare_id!("11111111111111111111111111111111");\n\n#[program]\npub mod voting {\n    use super::*;\n    pub fn create_poll(ctx: Context<CreatePoll>, question: String, options: Vec<String>) -> Result<()> {\n        let poll = &mut ctx.accounts.poll;\n        poll.authority = ctx.accounts.creator.key();\n        poll.question = question;\n        poll.options = options;\n        poll.votes = vec![0; poll.options.len()];\n        poll.bump = ctx.bumps.poll;\n        Ok(())\n    }\n    pub fn cast_vote(ctx: Context<CastVote>, option_index: u8) -> Result<()> {\n        let poll = &mut ctx.accounts.poll;\n        require!((option_index as usize) < poll.options.len(), ErrorCode::InvalidOption);\n        poll.votes[option_index as usize] = poll.votes[option_index as usize].checked_add(1).unwrap();\n        let ballot = &mut ctx.accounts.ballot;\n        ballot.voter = ctx.accounts.voter.key();\n        ballot.option = option_index;\n        ballot.bump = ctx.bumps.ballot;\n        Ok(())\n    }\n}\n\n#[account]\npub struct Poll { pub authority: Pubkey, pub question: String, pub options: Vec<String>, pub votes: Vec<u64>, pub bump: u8 }\n#[account]\npub struct Ballot { pub voter: Pubkey, pub option: u8, pub bump: u8 }\n\n#[derive(Accounts)]\npub struct CreatePoll<'info> {\n    #[account(init, payer = creator, space = 8 + 32 + 4 + 280 + 4 + 400 + 4 + 80 + 1, seeds = [b"poll", creator.key().as_ref()], bump)]\n    pub poll: Account<'info, Poll>,\n    #[account(mut)] pub creator: Signer<'info>,\n    pub system_program: Program<'info, System>,\n}\n\n#[derive(Accounts)]\npub struct CastVote<'info> {\n    #[account(mut)] pub poll: Account<'info, Poll>,\n    #[account(init, payer = voter, space = 8 + 32 + 1 + 1, seeds = [b"ballot", poll.key().as_ref(), voter.key().as_ref()], bump)]\n    pub ballot: Account<'info, Ballot>,\n    #[account(mut)] pub voter: Signer<'info>,\n    pub system_program: Program<'info, System>,\n}\n\n#[error_code]\npub enum ErrorCode { #[msg("Invalid option index")] InvalidOption }`,
              testCases: [
                {
                  name: "Poll created",
                  input: "",
                  expectedOutput: "poll exists with options",
                },
                {
                  name: "Vote cast",
                  input: "",
                  expectedOutput: "vote count incremented",
                },
                {
                  name: "Double vote prevented",
                  input: "",
                  expectedOutput: "PDA collision error",
                },
              ],
              hints: [
                "Use PDA seeds [b'ballot', poll.key, voter.key] for one-vote-per-user",
              ],
            },
          },
        ],
      },
      {
        title: "Testing & Deployment",
        description: "Write tests and deploy to devnet.",
        order: 3,
        lessons: [
          {
            title: "Writing Anchor Tests",
            slug: "writing-anchor-tests",
            type: "content",
            xpReward: 30,
            estimatedMinutes: 15,
            order: 1,
            markdownContent: `# Writing Anchor Tests\n\n\`\`\`typescript\nimport * as anchor from '@coral-xyz/anchor';\n\ndescribe('counter', () => {\n  const provider = anchor.AnchorProvider.env();\n  anchor.setProvider(provider);\n  const program = anchor.workspace.counter;\n\n  it('Initializes the counter', async () => {\n    const [counterPda] = anchor.web3.PublicKey.findProgramAddressSync(\n      [Buffer.from('counter'), provider.wallet.publicKey.toBuffer()],\n      program.programId\n    );\n    await program.methods.initialize()\n      .accounts({ counter: counterPda, user: provider.wallet.publicKey })\n      .rpc();\n    const account = await program.account.counter.fetch(counterPda);\n    expect(account.count.toNumber()).to.equal(0);\n  });\n});\n\`\`\`\n\nRun with \`anchor test\`.`,
          },
          {
            title: "Deploy to Devnet",
            slug: "deploy-to-devnet",
            type: "content",
            xpReward: 50,
            estimatedMinutes: 20,
            order: 2,
            markdownContent: `# Deploy to Devnet\n\n\`\`\`bash\nsolana config set --url devnet\nsolana airdrop 4\nanchor build\nanchor deploy --provider.cluster devnet\nsolana program show <PROGRAM_ID>\n\`\`\``,
          },
        ],
      },
    ],
  },

  // ─── Course 3: Frontend with React ─────────────────────────────────────
  {
    title: "Solana Frontend with React",
    slug: "frontend-with-react",
    description:
      "Build dApp frontends that connect wallets, sign transactions, display token balances, and interact with on-chain programs.",
    track: "frontend",
    difficulty: "intermediate",
    estimatedHours: 5,
    xpReward: 650,
    order: 3,
    learningOutcomes: [
      "Set up Solana Wallet Adapter in React",
      "Build and send transactions from the browser",
      "Fetch and display token balances and NFTs",
      "Handle transaction confirmation UX",
    ],
    modules: [
      {
        title: "Wallet Integration",
        description: "Connect Solana wallets in React apps.",
        order: 1,
        lessons: [
          {
            title: "Wallet Adapter Setup",
            slug: "wallet-adapter-setup",
            type: "content",
            xpReward: 30,
            estimatedMinutes: 15,
            order: 1,
            markdownContent: `# Solana Wallet Adapter\n\n\`\`\`tsx\nimport { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';\nimport { WalletModalProvider } from '@solana/wallet-adapter-react-ui';\n\nfunction App({ children }) {\n  return (\n    <ConnectionProvider endpoint="https://api.mainnet-beta.solana.com">\n      <WalletProvider wallets={[]} autoConnect>\n        <WalletModalProvider>{children}</WalletModalProvider>\n      </WalletProvider>\n    </ConnectionProvider>\n  );\n}\n\`\`\`\n\nThe empty wallets array uses Wallet Standard for auto-detection.`,
          },
          {
            title: "Connect Button Component",
            slug: "connect-button-component",
            type: "challenge",
            xpReward: 55,
            estimatedMinutes: 25,
            order: 2,
            challenge: {
              prompt:
                "Build a custom wallet connect button showing truncated address, disconnect option, and loading state.",
              language: "typescript",
              starterCode: `import { useWallet } from '@solana/wallet-adapter-react';\n\nexport function ConnectButton() {\n  const { publicKey, disconnect, connecting } = useWallet();\n  // TODO\n  return <button>Connect</button>;\n}`,
              solutionCode: `import { useWallet } from '@solana/wallet-adapter-react';\nimport { useWalletModal } from '@solana/wallet-adapter-react-ui';\n\nexport function ConnectButton() {\n  const { publicKey, disconnect, connecting } = useWallet();\n  const { setVisible } = useWalletModal();\n  if (connecting) return <button disabled>Connecting...</button>;\n  if (publicKey) {\n    const addr = publicKey.toBase58();\n    return <div><span>{addr.slice(0,4)}...{addr.slice(-4)}</span><button onClick={disconnect}>Disconnect</button></div>;\n  }\n  return <button onClick={() => setVisible(true)}>Connect Wallet</button>;\n}`,
              testCases: [
                {
                  name: "Shows connect when disconnected",
                  input: "",
                  expectedOutput: "Connect Wallet button",
                },
              ],
              hints: ["Use useWalletModal for the connect dialog"],
            },
          },
        ],
      },
      {
        title: "Transactions & Tokens",
        description:
          "Send transactions and display token data from the browser.",
        order: 2,
        lessons: [
          {
            title: "Send SOL from Browser",
            slug: "send-sol-from-browser",
            type: "challenge",
            xpReward: 60,
            estimatedMinutes: 30,
            order: 1,
            challenge: {
              prompt:
                "Create a React component with inputs for recipient and amount, a send button, and transaction status display.",
              language: "typescript",
              starterCode: `import { useState } from 'react';\nimport { useConnection, useWallet } from '@solana/wallet-adapter-react';\n\nexport function SendSolForm() {\n  // TODO\n  return <div>TODO</div>;\n}`,
              solutionCode: `import { useState } from 'react';\nimport { useConnection, useWallet } from '@solana/wallet-adapter-react';\nimport { Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';\n\nexport function SendSolForm() {\n  const { connection } = useConnection();\n  const { publicKey, sendTransaction } = useWallet();\n  const [recipient, setRecipient] = useState('');\n  const [amount, setAmount] = useState('');\n  const [status, setStatus] = useState('');\n\n  const handleSend = async () => {\n    if (!publicKey) return setStatus('Connect wallet first');\n    try {\n      setStatus('Sending...');\n      const tx = new Transaction().add(\n        SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: new PublicKey(recipient), lamports: parseFloat(amount) * LAMPORTS_PER_SOL })\n      );\n      const sig = await sendTransaction(tx, connection);\n      await connection.confirmTransaction(sig, 'confirmed');\n      setStatus('Success! ' + sig.slice(0, 20) + '...');\n    } catch (e: any) { setStatus('Error: ' + e.message); }\n  };\n\n  return <div>\n    <input placeholder="Recipient" value={recipient} onChange={e => setRecipient(e.target.value)} />\n    <input placeholder="Amount (SOL)" value={amount} onChange={e => setAmount(e.target.value)} />\n    <button onClick={handleSend} disabled={!publicKey}>Send SOL</button>\n    <p>{status}</p>\n  </div>;\n}`,
              testCases: [
                {
                  name: "Form renders",
                  input: "",
                  expectedOutput: "inputs and button visible",
                },
              ],
              hints: [
                "Use sendTransaction from useWallet, not sendAndConfirmTransaction",
              ],
            },
          },
          {
            title: "Fetch Token Balances",
            slug: "fetch-token-balances",
            type: "challenge",
            xpReward: 55,
            estimatedMinutes: 25,
            order: 2,
            challenge: {
              prompt:
                "Write a React hook that fetches all SPL token balances for the connected wallet.",
              language: "typescript",
              starterCode: `import { useEffect, useState } from 'react';\nimport { useConnection, useWallet } from '@solana/wallet-adapter-react';\n\nexport function useTokenBalances() {\n  // TODO\n  return [];\n}`,
              solutionCode: `import { useEffect, useState } from 'react';\nimport { useConnection, useWallet } from '@solana/wallet-adapter-react';\nimport { TOKEN_PROGRAM_ID } from '@solana/spl-token';\n\nexport function useTokenBalances() {\n  const { connection } = useConnection();\n  const { publicKey } = useWallet();\n  const [tokens, setTokens] = useState<{mint:string;amount:number}[]>([]);\n  useEffect(() => {\n    if (!publicKey) return;\n    connection.getParsedTokenAccountsByOwner(publicKey, { programId: TOKEN_PROGRAM_ID })\n      .then(({ value }) => setTokens(value.map(({ account }) => ({\n        mint: account.data.parsed.info.mint,\n        amount: account.data.parsed.info.tokenAmount.uiAmount || 0,\n      }))));\n  }, [publicKey, connection]);\n  return tokens;\n}`,
              testCases: [
                {
                  name: "Returns array",
                  input: "",
                  expectedOutput: "array of tokens",
                },
              ],
              hints: [
                "Use getParsedTokenAccountsByOwner with TOKEN_PROGRAM_ID",
              ],
            },
          },
        ],
      },
    ],
  },

  // ─── Course 4: DeFi Fundamentals ───────────────────────────────────────
  {
    title: "DeFi Fundamentals on Solana",
    slug: "defi-fundamentals",
    description:
      "Understand AMMs, lending protocols, and yield strategies on Solana. Learn to interact with Jupiter, Raydium, and Marinade.",
    track: "defi",
    difficulty: "advanced",
    estimatedHours: 4,
    xpReward: 700,
    order: 4,
    prereqSlug: "introduction-to-solana",
    learningOutcomes: [
      "How constant product AMMs work",
      "Liquidity pools and impermanent loss",
      "Lending protocols and interest rate models",
      "Jupiter swap API integration",
    ],
    modules: [
      {
        title: "DeFi Primitives",
        description: "AMMs, liquidity pools, and token swaps.",
        order: 1,
        lessons: [
          {
            title: "AMMs Explained",
            slug: "amms-explained",
            type: "content",
            xpReward: 30,
            estimatedMinutes: 15,
            order: 1,
            markdownContent: `# Automated Market Makers\n\nAMMs use x * y = k. When you swap, you add to one reserve and remove from the other. Large swaps cause more slippage.\n\nOn Solana: Raydium (concentrated liquidity), Orca (Whirlpools), Meteora (DLMM).`,
          },
          {
            title: "Swap via Jupiter",
            slug: "swap-via-jupiter",
            type: "challenge",
            xpReward: 65,
            estimatedMinutes: 30,
            order: 2,
            challenge: {
              prompt:
                "Use the Jupiter API to get a swap quote for SOL to USDC and execute the swap.",
              language: "typescript",
              starterCode: `const JUPITER_API = 'https://quote-api.jup.ag/v6';\n\nasync function getSwapQuote(inputMint: string, outputMint: string, amount: number) {\n  // TODO\n}`,
              solutionCode: `const JUPITER_API = 'https://quote-api.jup.ag/v6';\n\nasync function getSwapQuote(inputMint: string, outputMint: string, amount: number) {\n  const params = new URLSearchParams({ inputMint, outputMint, amount: amount.toString(), slippageBps: '50' });\n  const res = await fetch(JUPITER_API + '/quote?' + params);\n  return res.json();\n}`,
              testCases: [
                {
                  name: "Gets quote",
                  input: "",
                  expectedOutput: "quote object returned",
                },
              ],
              hints: ["Use URLSearchParams for the query string"],
            },
          },
        ],
      },
      {
        title: "Lending & Yield",
        description: "How lending works and yield strategies.",
        order: 2,
        lessons: [
          {
            title: "How Lending Works",
            slug: "how-lending-works",
            type: "content",
            xpReward: 25,
            estimatedMinutes: 12,
            order: 1,
            markdownContent: `# DeFi Lending\n\nDeposit assets to earn yield. Borrow against collateral.\n\n- LTV: max borrow relative to collateral (e.g., 75%)\n- Liquidation: automatic close if collateral drops\n- Interest Rates: higher utilization = higher rates`,
          },
          {
            title: "Staking & LSTs",
            slug: "staking-lsts",
            type: "content",
            xpReward: 30,
            estimatedMinutes: 15,
            order: 2,
            markdownContent: `# Liquid Staking Tokens\n\nNative SOL staking yields ~7% APY. LSTs maintain liquidity:\n\n- **mSOL** (Marinade), **jitoSOL** (Jito MEV rewards), **bSOL** (BlazeStake)\n\nLSTs can be used in DeFi while earning staking rewards — yield composability.`,
          },
        ],
      },
    ],
  },

  // ─── Course 5: Security Essentials ─────────────────────────────────────
  {
    title: "Solana Security Essentials",
    slug: "solana-security",
    description:
      "Learn to audit Solana programs. Understand common vulnerabilities — missing signer checks, PDA seed collisions, arithmetic overflow — and write secure code.",
    track: "security",
    difficulty: "advanced",
    estimatedHours: 5,
    xpReward: 900,
    order: 5,
    prereqSlug: "anchor-development",
    learningOutcomes: [
      "Common Solana program vulnerabilities",
      "Arithmetic safety and checked math",
      "Reentrancy and CEI pattern",
      "Audit methodology and fuzz testing",
    ],
    modules: [
      {
        title: "Common Vulnerabilities",
        description: "Learn the most common attack vectors.",
        order: 1,
        lessons: [
          {
            title: "Account Validation Attacks",
            slug: "account-validation-attacks",
            type: "content",
            xpReward: 35,
            estimatedMinutes: 15,
            order: 1,
            markdownContent: `# Account Validation Attacks\n\nThe #1 vulnerability: missing account validation.\n\n\`\`\`rust\n// VULNERABLE: Anyone can pass any account\npub fn withdraw(ctx: Context<Withdraw>) -> Result<()> { ... }\n\n// FIXED: Use has_one\n#[account(has_one = authority)]\npub vault: Account<'info, Vault>,\n\`\`\``,
          },
          {
            title: "Arithmetic Overflows",
            slug: "arithmetic-overflows",
            type: "challenge",
            xpReward: 60,
            estimatedMinutes: 25,
            order: 2,
            challenge: {
              prompt:
                "Find and fix 3 arithmetic vulnerabilities in this staking program.",
              language: "rust",
              starterCode: `pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {\n    let pool = &mut ctx.accounts.pool;\n    pool.total_staked = pool.total_staked + amount;  // BUG 1\n    let reward = amount * pool.reward_rate * pool.elapsed_time;  // BUG 2\n    let share = amount / pool.total_staked;  // BUG 3\n    Ok(())\n}`,
              solutionCode: `pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {\n    let pool = &mut ctx.accounts.pool;\n    pool.total_staked = pool.total_staked.checked_add(amount).ok_or(ErrorCode::Overflow)?;\n    let reward = amount.checked_mul(pool.reward_rate).ok_or(ErrorCode::Overflow)?.checked_mul(pool.elapsed_time).ok_or(ErrorCode::Overflow)?;\n    require!(pool.total_staked > 0, ErrorCode::DivisionByZero);\n    let share = amount.checked_div(pool.total_staked).ok_or(ErrorCode::Overflow)?;\n    Ok(())\n}`,
              testCases: [
                {
                  name: "Uses checked_add",
                  input: "",
                  expectedOutput: "no overflow",
                },
                {
                  name: "Uses checked_mul chain",
                  input: "",
                  expectedOutput: "safe reward calc",
                },
                {
                  name: "Guards division by zero",
                  input: "",
                  expectedOutput: "require! guard",
                },
              ],
              hints: [
                "Use checked_add, checked_mul, checked_div",
                "require!(denominator > 0) before division",
              ],
            },
          },
        ],
      },
      {
        title: "Auditing",
        description: "Methodology and tools for auditing Solana programs.",
        order: 2,
        lessons: [
          {
            title: "Audit Methodology",
            slug: "audit-methodology",
            type: "content",
            xpReward: 35,
            estimatedMinutes: 15,
            order: 1,
            markdownContent: `# Audit Methodology\n\n1. Architecture Review\n2. Access Control checks\n3. Arithmetic Safety\n4. PDA Validation\n5. CPI Safety\n6. State Management (reentrancy, uninitialized accounts)\n7. Economic Analysis (share price manipulation, flash loans)\n\nTools: Soteria, Sec3 X-ray, Trident (fuzzing), cargo-audit`,
          },
          {
            title: "Security Audit Capstone",
            slug: "security-audit-capstone",
            type: "challenge",
            xpReward: 100,
            estimatedMinutes: 45,
            order: 2,
            challenge: {
              prompt:
                "Audit this token vault program. Identify at least 5 vulnerabilities with severity and fixes.",
              language: "typescript",
              starterCode: `// Audit this code:\n// pub fn deposit(ctx, amount) { transfer(amount)?; vault.total += amount; shares = amount * total_shares / total_deposited; }\n// pub fn withdraw(ctx, shares) { amount = shares * total_deposited / total_shares; total_shares -= shares; transfer(amount)?; }\n\n// YOUR AUDIT:\n// Finding 1: [Severity] ...`,
              solutionCode: `// Finding 1: [CRITICAL] Share Price Manipulation — first depositor inflates price\n// Finding 2: [CRITICAL] Unchecked Arithmetic — uses + - * /\n// Finding 3: [HIGH] Division Before Multiplication — precision loss\n// Finding 4: [HIGH] CEI Violation — transfer before state update\n// Finding 5: [MEDIUM] No Minimum Deposit — zero-amount edge case`,
              testCases: [
                {
                  name: "5+ findings",
                  input: "",
                  expectedOutput: "at least 5 vulnerabilities",
                },
                {
                  name: "Severity ratings",
                  input: "",
                  expectedOutput: "Critical/High/Medium",
                },
              ],
              hints: [
                "Check for share price manipulation via direct deposits",
                "Look for CEI violations",
              ],
            },
          },
        ],
      },
    ],
  },

  // ─── Course 6: Mobile dApps ────────────────────────────────────────────
  {
    title: "Mobile dApps with React Native",
    slug: "mobile-solana-react-native",
    description:
      "Build mobile-first Solana apps with React Native and Mobile Wallet Adapter. Ship native apps for iOS and Android.",
    track: "mobile",
    difficulty: "advanced",
    estimatedHours: 5,
    xpReward: 750,
    order: 6,
    prereqSlug: "frontend-with-react",
    learningOutcomes: [
      "React Native + Solana setup",
      "Mobile Wallet Adapter integration",
      "Transaction signing on mobile",
      "Performance optimization for mobile dApps",
    ],
    modules: [
      {
        title: "React Native + Solana",
        description: "Set up and connect to Solana from mobile.",
        order: 1,
        lessons: [
          {
            title: "Project Setup",
            slug: "rn-project-setup",
            type: "content",
            xpReward: 30,
            estimatedMinutes: 15,
            order: 1,
            markdownContent: `# React Native + Solana\n\n\`\`\`bash\nnpx react-native init SolanaMobile\ncd SolanaMobile\nnpm install @solana/web3.js @solana-mobile/mobile-wallet-adapter-protocol react-native-get-random-values\n\`\`\`\n\nAdd \`import 'react-native-get-random-values'\` before any Solana imports.\n\nMobile uses **Mobile Wallet Adapter (MWA)** instead of the browser wallet adapter.`,
          },
          {
            title: "Mobile Wallet Adapter",
            slug: "mobile-wallet-adapter",
            type: "content",
            xpReward: 30,
            estimatedMinutes: 15,
            order: 2,
            markdownContent: `# Mobile Wallet Adapter\n\n\`\`\`typescript\nimport { transact } from '@solana-mobile/mobile-wallet-adapter-protocol';\n\nasync function connect() {\n  const result = await transact(async (wallet) => {\n    return wallet.authorize({ cluster: 'devnet', identity: { name: 'Superteam Academy' } });\n  });\n  console.log('Connected:', result.accounts[0].address);\n}\n\`\`\`\n\nThe \`transact\` function opens a session with the wallet app. All signing happens within this session.`,
          },
          {
            title: "Connect to Phantom Mobile",
            slug: "connect-phantom-mobile",
            type: "challenge",
            xpReward: 65,
            estimatedMinutes: 30,
            order: 3,
            challenge: {
              prompt:
                "Build a React Native screen that connects to Phantom, shows address and SOL balance.",
              language: "typescript",
              starterCode: `import React, { useState } from 'react';\nimport { View, Text, Button } from 'react-native';\n\nexport function WalletScreen() {\n  // TODO\n  return <View><Text>Wallet Screen</Text></View>;\n}`,
              solutionCode: `import React, { useState } from 'react';\nimport { View, Text, Button, StyleSheet } from 'react-native';\nimport { transact } from '@solana-mobile/mobile-wallet-adapter-protocol';\nimport { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';\n\nconst connection = new Connection('https://api.devnet.solana.com');\n\nexport function WalletScreen() {\n  const [address, setAddress] = useState<string | null>(null);\n  const [balance, setBalance] = useState(0);\n  const connect = async () => {\n    const result = await transact(async (wallet) => wallet.authorize({ cluster: 'devnet', identity: { name: 'Superteam Academy' } }));\n    const addr = result.accounts[0].address;\n    setAddress(addr);\n    const bal = await connection.getBalance(new PublicKey(addr));\n    setBalance(bal / LAMPORTS_PER_SOL);\n  };\n  return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>\n    {address ? <><Text>{address.slice(0,4)}...{address.slice(-4)}</Text><Text>{balance} SOL</Text></> : <Button title="Connect Wallet" onPress={connect} />}\n  </View>;\n}`,
              testCases: [
                {
                  name: "Connect button renders",
                  input: "",
                  expectedOutput: "button visible",
                },
              ],
              hints: ["Use transact() for the wallet session"],
            },
          },
        ],
      },
      {
        title: "Ship to App Store",
        description: "Performance optimization and final project.",
        order: 2,
        lessons: [
          {
            title: "Performance Optimization",
            slug: "mobile-performance",
            type: "content",
            xpReward: 30,
            estimatedMinutes: 15,
            order: 1,
            markdownContent: `# Mobile Performance\n\n1. Minimize RPC calls — cache, use WebSocket subscriptions\n2. Use confirmed commitment\n3. Batch requests with getMultipleAccountsInfo\n4. Lazy load @solana/web3.js\n5. Use Hermes engine`,
          },
          {
            title: "Final Project: Token Tracker",
            slug: "token-tracker",
            type: "challenge",
            xpReward: 100,
            estimatedMinutes: 45,
            order: 2,
            challenge: {
              prompt:
                "Build a React Native token portfolio tracker: connect wallet, show SOL balance, list SPL tokens.",
              language: "typescript",
              starterCode: `import React from 'react';\nimport { View, Text, FlatList } from 'react-native';\n\nexport function PortfolioScreen() {\n  // TODO\n  return <View><Text>Portfolio</Text></View>;\n}`,
              solutionCode: `import React, { useEffect, useState } from 'react';\nimport { View, Text, FlatList, StyleSheet } from 'react-native';\nimport { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';\nimport { TOKEN_PROGRAM_ID } from '@solana/spl-token';\n\nconst connection = new Connection('https://api.devnet.solana.com');\n\nexport function PortfolioScreen({ walletAddress }: { walletAddress: string }) {\n  const [solBalance, setSolBalance] = useState(0);\n  const [tokens, setTokens] = useState<{mint:string;balance:number}[]>([]);\n  useEffect(() => {\n    const pk = new PublicKey(walletAddress);\n    connection.getBalance(pk).then(b => setSolBalance(b / LAMPORTS_PER_SOL));\n    connection.getParsedTokenAccountsByOwner(pk, { programId: TOKEN_PROGRAM_ID })\n      .then(({ value }) => setTokens(value.map(({ account }) => ({\n        mint: account.data.parsed.info.mint,\n        balance: account.data.parsed.info.tokenAmount.uiAmount || 0,\n      }))));\n  }, [walletAddress]);\n  return <View style={{flex:1,padding:16}}>\n    <Text style={{fontSize:24,fontWeight:'bold'}}>Portfolio</Text>\n    <Text style={{color:'#00FFA3',fontSize:20}}>{solBalance.toFixed(4)} SOL</Text>\n    <FlatList data={tokens} keyExtractor={t => t.mint}\n      renderItem={({item}) => <Text>{item.mint.slice(0,8)}... — {item.balance}</Text>} />\n  </View>;\n}`,
              testCases: [
                {
                  name: "SOL balance shown",
                  input: "",
                  expectedOutput: "SOL amount",
                },
              ],
              hints: ["Use getParsedTokenAccountsByOwner for SPL tokens"],
            },
          },
        ],
      },
    ],
  },
];

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Seeding Superteam Academy content into Sanity...\n");

  // 1. Create instructor
  console.log("Creating instructor...");
  const instructor = await client.create({
    _type: "instructor",
    name: "Superteam Brazil",
    bio: "The Solana-native developer community for Latin America. Building the next generation of Solana developers through education and collaboration.",
    twitter: "SuperteamBR",
    github: "solanabr",
  });
  console.log(`  ✓ Instructor: ${instructor._id}`);

  // 2. Create courses in order, tracking IDs for prerequisites
  const courseIdMap: Record<string, string> = {};

  for (const courseDef of COURSES) {
    const prereqId = courseDef.prereqSlug
      ? courseIdMap[courseDef.prereqSlug]
      : undefined;
    const courseId = await createCourse(courseDef, instructor._id, prereqId);
    courseIdMap[courseDef.slug] = courseId;
  }

  const totalLessons = COURSES.reduce(
    (a, c) => a + c.modules.reduce((b, m) => b + m.lessons.length, 0),
    0,
  );
  console.log(
    `\n✓ Seeding complete! ${COURSES.length} courses, ${totalLessons} lessons created.`,
  );
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
