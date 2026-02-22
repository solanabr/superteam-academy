/**
 * Seed Sanity CMS with course data
 *
 * Usage:
 *   cd app && pnpm seed-sanity
 *
 * Requires:
 *   NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN in app/.env.local
 */

import { createClient } from "@sanity/client";
import * as dotenv from "dotenv";
import * as path from "path";

// Load .env.local from app/ directory
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_API_TOKEN;

if (!projectId) {
  console.error("Missing NEXT_PUBLIC_SANITY_PROJECT_ID");
  process.exit(1);
}

if (!token) {
  console.error(
    "Missing SANITY_API_TOKEN — create one at https://www.sanity.io/manage"
  );
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2026-02-15",
  token,
  useCdn: false,
});

// Placeholder creator wallet for seed data.
// Replace with real creator wallet pubkeys when registering courses on-chain.
const PLACEHOLDER_CREATOR = "11111111111111111111111111111111";

const tracks = [
  { _id: "track-solana-core", _type: "track", name: "Solana Core", slug: { _type: "slug", current: "solana-core" }, description: "Core Solana development fundamentals", icon: "cpu", color: "#9945FF", trackId: 1, collectionAddress: "GyTUPBnidX3fWPwAJq7VpQRx5tMhQe3TXk5hbRo8wZS7" },
  { _id: "track-defi", _type: "track", name: "DeFi", slug: { _type: "slug", current: "defi" }, description: "Decentralized finance protocols", icon: "banknote", color: "#14F195", trackId: 2 },
  { _id: "track-nft", _type: "track", name: "NFTs", slug: { _type: "slug", current: "nft" }, description: "Non-fungible tokens and digital assets", icon: "image", color: "#ffd23f", trackId: 3 },
  { _id: "track-anchor", _type: "track", name: "Anchor", slug: { _type: "slug", current: "anchor" }, description: "Anchor framework for Solana programs", icon: "anchor", color: "#00D1FF", trackId: 4 },
  { _id: "track-web3", _type: "track", name: "Web3 Integration", slug: { _type: "slug", current: "web3" }, description: "Integrating Solana into web applications", icon: "globe", color: "#FF6B6B", trackId: 5 },
];

const instructors = [
  { _id: "instructor-ana", _type: "instructor", name: "Ana Rodrigues", bio: "Solana core contributor and educator. 5+ years in blockchain development.", twitter: "@ana_sol", github: "anarodrigues" },
  { _id: "instructor-carlos", _type: "instructor", name: "Carlos Mendes", bio: "DeFi researcher and Anchor framework expert.", twitter: "@carlos_defi", github: "carlosmendes" },
  { _id: "instructor-lucia", _type: "instructor", name: "Lucia Santos", bio: "NFT developer and digital art pioneer on Solana.", twitter: "@lucia_nft", github: "luciasantos" },
];

interface LessonDef {
  _id: string;
  _type: "lesson";
  title: string;
  slug: { _type: "slug"; current: string };
  type: "content" | "challenge";
  duration: number;
  order: number;
  markdownContent?: string;
  videoUrl?: string;
  challenge?: {
    prompt: string;
    language: string;
    starterCode: string;
    solution: string;
    testCases: { _type: "object"; input: string; expectedOutput: string; label: string; validator?: string; _key: string }[];
    hints: string[];
  };
}

interface ModuleDef {
  _id: string;
  _type: "module";
  title: string;
  description: string;
  order: number;
  lessons: { _type: "reference"; _ref: string; _key: string }[];
}

interface CourseDef {
  _id: string;
  _type: "course";
  title: string;
  courseId: { _type: "slug"; current: string };
  description: string;
  longDescription: string;
  difficulty: string;
  track: { _type: "reference"; _ref: string };
  instructor: { _type: "reference"; _ref: string };
  modules: { _type: "reference"; _ref: string; _key: string }[];
  // On-chain create_course parameters
  xpPerLesson: number;
  lessonCount: number;
  trackId: number;
  trackLevel: number;
  creator: string;
  creatorRewardXp: number;
  minCompletionsForReward: number;
  prerequisiteCourseId?: string;
  tags: string[];
  published: boolean;
}

const courseDefs: {
  courseId: string;
  title: string;
  description: string;
  longDescription: string;
  difficulty: string;
  trackRef: string;
  instructorRef: string;
  // On-chain parameters
  xpPerLesson: number;
  trackId: number;
  trackLevel: number;
  creatorRewardXp: number;
  minCompletionsForReward: number;
  tags: string[];
  modules: {
    title: string;
    description: string;
    lessons: {
      title: string;
      slug: string;
      type: "content" | "challenge";
      duration: number;
      videoUrl?: string;
      markdownContent?: string;
      challenge?: {
        prompt: string;
        language: string;
        starterCode: string;
        solution: string;
        testCases: { input: string; expectedOutput: string; label: string; validator?: string }[];
        hints: string[];
      };
    }[];
  }[];
}[] = [
  {
    courseId: "intro-to-solana",
    title: "Introduction to Solana",
    description: "Learn the fundamentals of Solana blockchain development from scratch.",
    longDescription: "This comprehensive course covers everything you need to know to start building on Solana. From understanding the architecture to writing your first program, you'll gain hands-on experience with the fastest blockchain in the world.",
    difficulty: "beginner",
    trackRef: "track-solana-core",
    instructorRef: "instructor-ana",
    // 10 lessons × 25 XP = 250 XP total; completion bonus = ~125 XP (50%)
    xpPerLesson: 25,
    trackId: 1,
    trackLevel: 1,
    creatorRewardXp: 50,
    minCompletionsForReward: 5,
    tags: ["solana", "blockchain", "beginner", "rust"],
    modules: [
      {
        title: "Getting Started with Solana",
        description: "Set up your development environment and understand Solana's architecture.",
        lessons: [
          { title: "What is Solana?", slug: "what-is-solana", type: "content", duration: 20, videoUrl: "https://www.youtube.com/embed/1jzROE6EhxM", markdownContent: "## Welcome to Solana\n\nSolana is a high-performance blockchain designed for mass adoption. It processes thousands of transactions per second at a fraction of a cent.\n\n### Why Solana?\n\n- **Speed**: ~400ms block time\n- **Low cost**: ~$0.00025 per transaction\n- **Scalable**: 65,000+ TPS\n- **Proof of History + Proof of Stake**" },
          { title: "Solana Architecture", slug: "solana-architecture", type: "content", duration: 30, markdownContent: "## Solana Architecture\n\nSolana's speed comes from several key innovations:\n\n1. **Proof of History (PoH)** — A cryptographic clock that orders transactions before consensus\n2. **Tower BFT** — PoH-optimized PBFT consensus\n3. **Gulf Stream** — Transaction forwarding without mempools\n4. **Turbine** — Block propagation protocol\n5. **Sealevel** — Parallel smart contract runtime" },
          { title: "Setting Up Your Environment", slug: "setting-up-environment", type: "content", duration: 25, markdownContent: "## Development Environment Setup\n\n### Install Rust\n```bash\ncurl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh\n```\n\n### Install Solana CLI\n```bash\nsh -c \"$(curl -sSfL https://release.anza.xyz/stable/install)\"\n```\n\n### Install Anchor\n```bash\ncargo install --git https://github.com/coral-xyz/anchor avm --locked\navm install latest\navm use latest\n```" },
        ],
      },
      {
        title: "Accounts and Programs",
        description: "Understand how accounts and programs work on Solana.",
        lessons: [
          { title: "Understanding Accounts", slug: "understanding-accounts", type: "content", duration: 25, markdownContent: "## Solana Accounts\n\nEverything on Solana is an account. Accounts store data and SOL.\n\n### Key Properties\n- **Lamports** — SOL balance (1 SOL = 1B lamports)\n- **Data** — Arbitrary byte array\n- **Owner** — Program that controls the account\n- **Executable** — Whether the account is a program\n- **Rent epoch** — When rent is next due" },
          { title: "Programs on Solana", slug: "programs-on-solana", type: "content", duration: 30, markdownContent: "## Programs\n\nPrograms are stateless executable code stored in accounts.\n\n### Key Concepts\n- Programs are **stateless** — they store no data themselves\n- Programs process **instructions** that reference accounts\n- Programs are **owned by the BPF Loader**\n- Programs can be **upgradeable** via upgrade authority" },
          { title: "Your First Transaction", slug: "first-transaction", type: "challenge", duration: 30, challenge: { prompt: "Write a function that creates a Solana keypair and returns the public key as a base58 string.", language: "typescript", starterCode: "import { Keypair } from '@solana/web3.js';\n\nfunction getNewPublicKey(): string {\n  // Your code here\n}", solution: "import { Keypair } from '@solana/web3.js';\n\nfunction getNewPublicKey(): string {\n  const keypair = Keypair.generate();\n  return keypair.publicKey.toBase58();\n}", testCases: [{ input: "", expectedOutput: "", validator: "output.length >= 32 && output.length <= 44", label: "Returns a valid base58 public key" }], hints: ["Use Keypair.generate() to create a new keypair", "Access the publicKey property and call toBase58()"] } },
        ],
      },
      {
        title: "PDAs and CPIs",
        description: "Learn about Program Derived Addresses and Cross-Program Invocations.",
        lessons: [
          { title: "Program Derived Addresses", slug: "program-derived-addresses", type: "content", duration: 35, markdownContent: "## PDAs\n\nProgram Derived Addresses (PDAs) are deterministic addresses derived from seeds and a program ID.\n\n### Key Properties\n- **Deterministic** — Same seeds always produce the same address\n- **Off-curve** — Not valid Ed25519 public keys (no private key exists)\n- **Signable by programs** — The program can sign on behalf of the PDA\n\n```typescript\nconst [pda, bump] = PublicKey.findProgramAddressSync(\n  [Buffer.from('seed'), userKey.toBuffer()],\n  programId\n);\n```" },
          { title: "Cross-Program Invocations", slug: "cross-program-invocations", type: "content", duration: 30, markdownContent: "## CPIs\n\nCross-Program Invocations allow programs to call other programs.\n\n### Two Types\n1. **invoke()** — For instructions that don't need PDA signers\n2. **invoke_signed()** — For instructions that need PDA signers\n\nCPIs pass the caller's privileges to the callee." },
          { title: "PDA Challenge", slug: "pda-challenge", type: "challenge", duration: 25, challenge: { prompt: "Derive a PDA using the seeds ['user', userKey] for a given program. The function receives two base58 public key strings and returns the derived PDA address as a base58 string.", language: "typescript", starterCode: "import { PublicKey } from '@solana/web3.js';\nimport { Buffer } from 'buffer';\n\nfunction deriveUserPDA(userKeyBase58: string, programIdBase58: string): string {\n  // Your code here\n}", solution: "import { PublicKey } from '@solana/web3.js';\nimport { Buffer } from 'buffer';\n\nfunction deriveUserPDA(userKeyBase58: string, programIdBase58: string): string {\n  const userKey = new PublicKey(userKeyBase58);\n  const programId = new PublicKey(programIdBase58);\n  const [pda] = PublicKey.findProgramAddressSync(\n    [Buffer.from('user'), userKey.toBuffer()],\n    programId\n  );\n  return pda.toBase58();\n}", testCases: [{ input: "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s, TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", expectedOutput: "", validator: "output.length >= 32 && output.length <= 44", label: "Returns a valid PDA address" }], hints: ["Use PublicKey.findProgramAddressSync", "Create PublicKey from each string: new PublicKey(userKeyBase58)", "Import Buffer: import { Buffer } from 'buffer'", "Seeds: [Buffer.from('user'), userKey.toBuffer()]"] } },
          { title: "Building a Token Program", slug: "building-token-program", type: "content", duration: 40, markdownContent: "## Token Programs on Solana\n\nSolana has two token programs:\n- **SPL Token** — The original token standard\n- **Token-2022** — Extended features (transfer fees, confidential transfers, non-transferable tokens)\n\n### Creating a Mint\n```rust\nlet cpi_accounts = MintTo {\n    mint: ctx.accounts.mint.to_account_info(),\n    to: ctx.accounts.token_account.to_account_info(),\n    authority: ctx.accounts.authority.to_account_info(),\n};\n```" },
        ],
      },
    ],
  },
  {
    courseId: "anchor-fundamentals",
    prerequisiteCourseId: "intro-to-solana",
    title: "Anchor Framework Fundamentals",
    description: "Master the Anchor framework for building Solana programs efficiently.",
    longDescription: "Dive deep into the Anchor framework, the most popular tool for Solana program development. Learn how to structure programs, define accounts, handle errors, and test your code.",
    difficulty: "intermediate",
    trackRef: "track-anchor",
    instructorRef: "instructor-carlos",
    // 8 lessons × 30 XP = 240 XP total; completion bonus = ~120 XP (50%)
    xpPerLesson: 30,
    trackId: 4,
    trackLevel: 1,
    creatorRewardXp: 75,
    minCompletionsForReward: 5,
    tags: ["anchor", "rust", "solana", "intermediate"],
    modules: [
      {
        title: "Anchor Basics",
        description: "Learn the fundamentals of the Anchor framework.",
        lessons: [
          { title: "What is Anchor?", slug: "what-is-anchor", type: "content", duration: 20, markdownContent: "## Anchor Framework\n\nAnchor is a framework for Solana program development that provides:\n- **IDL generation** — Automatic interface description\n- **Account validation** — Declarative account constraints\n- **Error handling** — Custom error types\n- **Testing** — TypeScript test framework\n- **Client generation** — Auto-generated TypeScript clients" },
          { title: "Project Structure", slug: "project-structure", type: "content", duration: 25, markdownContent: "## Anchor Project Structure\n\n```\nmy-project/\n├── Anchor.toml          # Project config\n├── Cargo.toml           # Workspace root\n├── programs/\n│   └── my-program/\n│       └── src/\n│           └── lib.rs   # Program entry\n├── tests/\n│   └── my-program.ts   # Integration tests\n└── app/                 # Frontend\n```" },
          { title: "Account Macros", slug: "account-macros", type: "content", duration: 35, markdownContent: "## Account Macros\n\n### #[account]\nDefines a program account with automatic serialization.\n\n```rust\n#[account]\npub struct UserProfile {\n    pub authority: Pubkey,\n    pub name: String,\n    pub xp: u64,\n    pub bump: u8,\n}\n```\n\n### #[derive(Accounts)]\nDefines the account validation struct.\n\n```rust\n#[derive(Accounts)]\npub struct Initialize<'info> {\n    #[account(init, payer = user, space = 8 + 32 + 32 + 8 + 1)]\n    pub profile: Account<'info, UserProfile>,\n    #[account(mut)]\n    pub user: Signer<'info>,\n    pub system_program: Program<'info, System>,\n}\n```" },
          { title: "Instructions", slug: "instructions", type: "content", duration: 30, markdownContent: "## Writing Instructions\n\n```rust\n#[program]\npub mod my_program {\n    use super::*;\n\n    pub fn initialize(ctx: Context<Initialize>, name: String) -> Result<()> {\n        let profile = &mut ctx.accounts.profile;\n        profile.authority = ctx.accounts.user.key();\n        profile.name = name;\n        profile.xp = 0;\n        Ok(())\n    }\n}\n```" },
        ],
      },
      {
        title: "Advanced Anchor",
        description: "Advanced Anchor patterns and best practices.",
        lessons: [
          { title: "PDA Constraints", slug: "pda-constraints", type: "content", duration: 30, markdownContent: "## PDA Constraints\n\n```rust\n#[derive(Accounts)]\n#[instruction(course_id: String)]\npub struct CreateCourse<'info> {\n    #[account(\n        init,\n        payer = authority,\n        space = 8 + Course::INIT_SPACE,\n        seeds = [b\"course\", course_id.as_bytes()],\n        bump\n    )]\n    pub course: Account<'info, Course>,\n    #[account(mut)]\n    pub authority: Signer<'info>,\n}\n```" },
          { title: "Error Handling", slug: "error-handling", type: "content", duration: 25, markdownContent: "## Custom Errors\n\n```rust\n#[error_code]\npub enum ErrorCode {\n    #[msg(\"Course is not active\")]\n    CourseNotActive,\n    #[msg(\"Already enrolled\")]\n    AlreadyEnrolled,\n    #[msg(\"Insufficient XP\")]\n    InsufficientXP,\n}\n```\n\nUse with: `require!(course.is_active, ErrorCode::CourseNotActive);`" },
          { title: "Testing with Anchor", slug: "testing-anchor", type: "content", duration: 35, markdownContent: "## Integration Tests\n\n```typescript\nimport * as anchor from '@coral-xyz/anchor';\nimport { Program } from '@coral-xyz/anchor';\nimport { MyProgram } from '../target/types/my_program';\n\ndescribe('my-program', () => {\n  const provider = anchor.AnchorProvider.env();\n  anchor.setProvider(provider);\n  const program = anchor.workspace.MyProgram as Program<MyProgram>;\n\n  it('initializes', async () => {\n    const tx = await program.methods\n      .initialize('test')\n      .rpc();\n    console.log('tx:', tx);\n  });\n});\n```" },
          { title: "Build Your First Program", slug: "build-first-program", type: "challenge", duration: 40, challenge: { prompt: "Create an Anchor instruction that initializes a counter account with a count of 0.", language: "rust", starterCode: "use anchor_lang::prelude::*;\n\n#[account]\npub struct Counter {\n    pub count: u64,\n    pub authority: Pubkey,\n}\n\n// Define the Initialize accounts struct and instruction", solution: "use anchor_lang::prelude::*;\n\n#[account]\npub struct Counter {\n    pub count: u64,\n    pub authority: Pubkey,\n}\n\n#[derive(Accounts)]\npub struct Initialize<'info> {\n    #[account(init, payer = user, space = 8 + 8 + 32)]\n    pub counter: Account<'info, Counter>,\n    #[account(mut)]\n    pub user: Signer<'info>,\n    pub system_program: Program<'info, System>,\n}\n\npub fn initialize(ctx: Context<Initialize>) -> Result<()> {\n    let counter = &mut ctx.accounts.counter;\n    counter.count = 0;\n    counter.authority = ctx.accounts.user.key();\n    Ok(())\n}", testCases: [{ input: "Initialize instruction", expectedOutput: "Counter with count=0", label: "Counter initialized to 0" }], hints: ["Use #[account(init, payer = user, space = ...)]", "Space = 8 (discriminator) + 8 (u64) + 32 (Pubkey)"] } },
        ],
      },
    ],
  },
  {
    courseId: "defi-on-solana",
    title: "DeFi on Solana",
    description: "Build decentralized finance protocols on Solana.",
    longDescription: "Learn how to build DeFi protocols on Solana, from token swaps to lending platforms. Understand AMMs, liquidity pools, and yield farming mechanisms.",
    difficulty: "advanced",
    trackRef: "track-defi",
    instructorRef: "instructor-carlos",
    // 6 lessons × 40 XP = 240 XP total; completion bonus = ~120 XP (50%)
    xpPerLesson: 40,
    trackId: 2,
    trackLevel: 2,
    creatorRewardXp: 100,
    minCompletionsForReward: 3,
    tags: ["defi", "solana", "advanced", "amm"],
    modules: [
      {
        title: "DeFi Fundamentals",
        description: "Understand core DeFi concepts on Solana.",
        lessons: [
          { title: "DeFi Overview", slug: "defi-overview", type: "content", duration: 25, markdownContent: "## DeFi on Solana\n\nSolana's high throughput and low fees make it ideal for DeFi:\n- **DEXs**: Jupiter, Raydium, Orca\n- **Lending**: Marginfi, Kamino\n- **Staking**: Marinade, Jito\n- **Stablecoins**: USDC, PYUSD" },
          { title: "Token Standards", slug: "token-standards", type: "content", duration: 30, markdownContent: "## SPL Token & Token-2022\n\n### SPL Token\nThe original token standard. Simple mints, transfers, burns.\n\n### Token-2022\nExtended features:\n- Transfer fees\n- Confidential transfers\n- Non-transferable (soulbound)\n- Permanent delegate\n- Interest-bearing\n- Transfer hooks" },
          { title: "AMM Design", slug: "amm-design", type: "content", duration: 40, markdownContent: "## Automated Market Makers\n\n### Constant Product Formula\n`x * y = k`\n\nWhere x and y are token reserves, and k is a constant.\n\n### Price Impact\nLarger trades cause more slippage:\n```\nnew_y = k / (x + dx)\ndy = y - new_y\nprice_impact = dy / y\n```" },
        ],
      },
      {
        title: "Building DeFi",
        description: "Hands-on DeFi protocol development.",
        lessons: [
          { title: "Swap Program", slug: "swap-program", type: "content", duration: 45, markdownContent: "## Building a Swap\n\nA basic swap program needs:\n1. **Pool account** — Stores token reserves and fee config\n2. **Token vaults** — Hold the actual tokens\n3. **LP mint** — Represents liquidity provider shares\n4. **Swap instruction** — Calculates output using AMM formula" },
          { title: "Liquidity Pools", slug: "liquidity-pools", type: "content", duration: 35, markdownContent: "## Liquidity Pools\n\n### Adding Liquidity\n1. Calculate the ratio of tokens to add\n2. Transfer tokens to pool vaults\n3. Mint LP tokens proportional to share\n\n### Removing Liquidity\n1. Burn LP tokens\n2. Calculate proportional share\n3. Transfer tokens back to user" },
          { title: "DeFi Challenge", slug: "defi-challenge", type: "challenge", duration: 35, challenge: { prompt: "Calculate the output amount for a constant-product AMM swap.", language: "typescript", starterCode: "function calculateSwapOutput(\n  inputAmount: number,\n  inputReserve: number,\n  outputReserve: number,\n  feeBps: number\n): number {\n  // Your code here\n}", solution: "function calculateSwapOutput(\n  inputAmount: number,\n  inputReserve: number,\n  outputReserve: number,\n  feeBps: number\n): number {\n  const feeMultiplier = (10000 - feeBps) / 10000;\n  const inputWithFee = inputAmount * feeMultiplier;\n  const numerator = inputWithFee * outputReserve;\n  const denominator = inputReserve + inputWithFee;\n  return numerator / denominator;\n}", testCases: [{ input: "1000, 10000, 10000, 30", expectedOutput: "", validator: "Math.abs(Number(output) - 906.61) < 0.1", label: "Calculates output with 0.3% fee (≈906.61)" }], hints: ["Apply the fee before calculation", "Use x*y=k: new_output = k / (input_reserve + input_with_fee)"] } },
        ],
      },
    ],
  },
  {
    courseId: "nft-development",
    title: "NFT Development on Solana",
    description: "Create and manage NFTs using Metaplex on Solana.",
    longDescription: "Master NFT development on Solana using Metaplex Core. Learn to create collections, mint NFTs, implement royalties, and build NFT-gated experiences.",
    difficulty: "intermediate",
    trackRef: "track-nft",
    instructorRef: "instructor-lucia",
    // 7 lessons × 30 XP = 210 XP total; completion bonus = ~105 XP (50%)
    xpPerLesson: 30,
    trackId: 3,
    trackLevel: 1,
    creatorRewardXp: 75,
    minCompletionsForReward: 5,
    tags: ["nft", "metaplex", "solana", "intermediate"],
    modules: [
      {
        title: "NFT Basics",
        description: "Understanding NFTs on Solana.",
        lessons: [
          { title: "NFTs on Solana", slug: "nfts-on-solana", type: "content", duration: 20, markdownContent: "## NFTs on Solana\n\nSolana NFTs use the **Metaplex** standard:\n- **Metaplex Core** — Latest standard, simpler account model\n- **Token Metadata** — Legacy standard using SPL Token + metadata accounts\n- **Bubblegum** — Compressed NFTs for large collections" },
          { title: "Metaplex Core", slug: "metaplex-core", type: "content", duration: 30, markdownContent: "## Metaplex Core\n\nMetaplex Core is the latest NFT standard:\n- **Single account** per asset (vs 3+ in Token Metadata)\n- **Plugin system** — Composable behaviors\n- **Lifecycle hooks** — Custom logic on create/transfer/burn\n- **Collections** — First-class collection support" },
          { title: "Creating a Collection", slug: "creating-collection", type: "content", duration: 35, markdownContent: "## Collections\n\n```typescript\nimport { createCollection } from '@metaplex-foundation/mpl-core';\n\nconst collection = generateSigner(umi);\nawait createCollection(umi, {\n  collection,\n  name: 'My Collection',\n  uri: 'https://arweave.net/...',\n}).sendAndConfirm(umi);\n```" },
        ],
      },
      {
        title: "Advanced NFTs",
        description: "Advanced NFT patterns and soulbound tokens.",
        lessons: [
          { title: "Minting NFTs", slug: "minting-nfts", type: "content", duration: 30, markdownContent: "## Minting with Metaplex Core\n\n```typescript\nimport { create } from '@metaplex-foundation/mpl-core';\n\nconst asset = generateSigner(umi);\nawait create(umi, {\n  asset,\n  collection: collectionAddress,\n  name: 'My NFT',\n  uri: 'https://arweave.net/...',\n  plugins: [],\n}).sendAndConfirm(umi);\n```" },
          { title: "Soulbound NFTs", slug: "soulbound-nfts", type: "content", duration: 25, markdownContent: "## Soulbound NFTs\n\nMake NFTs non-transferable using the PermanentFreezeDelegate plugin:\n\n```typescript\nawait create(umi, {\n  asset,\n  name: 'Credential',\n  plugins: [\n    {\n      type: 'PermanentFreezeDelegate',\n      frozen: true,\n      authority: { type: 'UpdateAuthority' },\n    },\n  ],\n}).sendAndConfirm(umi);\n```" },
          { title: "NFT Metadata", slug: "nft-metadata", type: "content", duration: 25, markdownContent: "## Metadata Standard\n\nNFT metadata follows the Metaplex standard:\n```json\n{\n  \"name\": \"Course Credential\",\n  \"symbol\": \"CRED\",\n  \"description\": \"Completed Introduction to Solana\",\n  \"image\": \"https://arweave.net/...\",\n  \"attributes\": [\n    { \"trait_type\": \"Course\", \"value\": \"Intro to Solana\" },\n    { \"trait_type\": \"Grade\", \"value\": \"Gold\" }\n  ]\n}\n```" },
          { title: "NFT Challenge", slug: "nft-challenge", type: "challenge", duration: 30, challenge: { prompt: "Write a function that constructs Metaplex NFT metadata as a JSON string. Include name, symbol ('CRED'), description, image, and an empty attributes array.", language: "typescript", starterCode: "function createMetadata(\n  name: string,\n  description: string,\n  imageUrl: string\n): string {\n  // Return JSON.stringify of the metadata object\n  // Must include: name, symbol ('CRED'), description, image, attributes ([])\n}", solution: "function createMetadata(\n  name: string,\n  description: string,\n  imageUrl: string\n): string {\n  return JSON.stringify({\n    name,\n    symbol: 'CRED',\n    description,\n    image: imageUrl,\n    attributes: [],\n  });\n}", testCases: [{ input: "Course Credential, Completed Intro to Solana, https://arweave.net/example", expectedOutput: "", validator: "(() => { try { const p = JSON.parse(output); return p.name === 'Course Credential' && p.symbol === 'CRED' && Array.isArray(p.attributes); } catch { return false; } })()", label: "Returns valid Metaplex metadata JSON" }], hints: ["Return JSON.stringify({...}), not an object", "symbol must be 'CRED'", "Include attributes as an empty array []"] } },
        ],
      },
    ],
  },
  {
    courseId: "web3-frontend",
    title: "Web3 Frontend Development",
    description: "Build modern Web3 frontends with Solana wallet integration.",
    longDescription: "Learn to build production-ready Web3 frontends using Next.js and Solana. Cover wallet adapters, transaction signing, account fetching, and real-time updates.",
    difficulty: "beginner",
    trackRef: "track-web3",
    instructorRef: "instructor-ana",
    // 8 lessons × 25 XP = 200 XP total; completion bonus = ~100 XP (50%)
    xpPerLesson: 25,
    trackId: 5,
    trackLevel: 1,
    creatorRewardXp: 50,
    minCompletionsForReward: 5,
    tags: ["web3", "nextjs", "react", "beginner"],
    modules: [
      {
        title: "Wallet Integration",
        description: "Connect wallets to your frontend.",
        lessons: [
          { title: "Wallet Adapters", slug: "wallet-adapters", type: "content", duration: 25, markdownContent: "## Solana Wallet Adapter\n\nThe Solana Wallet Adapter provides a standard way to connect wallets:\n\n```bash\nnpm install @solana/wallet-adapter-react @solana/wallet-adapter-wallets\n```\n\nSupported wallets: Phantom, Solflare, Backpack, and more." },
          { title: "Connection Provider", slug: "connection-provider", type: "content", duration: 20, markdownContent: "## Provider Setup\n\n```tsx\nimport { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';\n\nfunction App({ children }) {\n  const endpoint = 'https://api.devnet.solana.com';\n  const wallets = useMemo(() => [], []);\n  \n  return (\n    <ConnectionProvider endpoint={endpoint}>\n      <WalletProvider wallets={wallets} autoConnect>\n        {children}\n      </WalletProvider>\n    </ConnectionProvider>\n  );\n}\n```" },
          { title: "Connect Button", slug: "connect-button", type: "content", duration: 20, markdownContent: "## Wallet Connect Button\n\n```tsx\nimport { WalletMultiButton } from '@solana/wallet-adapter-react-ui';\n\nfunction Navbar() {\n  return (\n    <nav>\n      <WalletMultiButton />\n    </nav>\n  );\n}\n```" },
          { title: "Wallet Challenge", slug: "wallet-challenge", type: "challenge", duration: 25, challenge: { prompt: "Write a function that converts a lamports amount to SOL. On Solana, 1 SOL = 1,000,000,000 lamports (LAMPORTS_PER_SOL).", language: "typescript", starterCode: "function lamportsToSOL(lamports: number): number {\n  // 1 SOL = 1_000_000_000 lamports\n  // Your code here\n}", solution: "function lamportsToSOL(lamports: number): number {\n  const LAMPORTS_PER_SOL = 1_000_000_000;\n  return lamports / LAMPORTS_PER_SOL;\n}", testCases: [{ input: "2000000000", expectedOutput: "", validator: "Number(output) === 2", label: "Converts 2 SOL correctly (2000000000 lamports → 2)" }, { input: "500000000", expectedOutput: "", validator: "Number(output) === 0.5", label: "Converts 0.5 SOL correctly (500000000 lamports → 0.5)" }], hints: ["LAMPORTS_PER_SOL = 1_000_000_000", "Divide lamports by LAMPORTS_PER_SOL"] } },
        ],
      },
      {
        title: "On-Chain Data",
        description: "Fetch and display on-chain data.",
        lessons: [
          { title: "Fetching Accounts", slug: "fetching-accounts", type: "content", duration: 30, markdownContent: "## Account Fetching\n\n```typescript\nconst accountInfo = await connection.getAccountInfo(publicKey);\nif (accountInfo) {\n  const data = accountInfo.data;\n  // Deserialize using borsh or anchor\n}\n```\n\nWith Anchor:\n```typescript\nconst course = await program.account.course.fetch(coursePda);\nconsole.log(course.courseId, course.lessonCount);\n```" },
          { title: "Transaction Signing", slug: "transaction-signing", type: "content", duration: 35, markdownContent: "## Sending Transactions\n\n```typescript\nconst tx = await program.methods\n  .enroll()\n  .accounts({\n    enrollment: enrollmentPda,\n    course: coursePda,\n    learner: wallet.publicKey,\n  })\n  .rpc();\n\nconsole.log('Enrolled! Tx:', tx);\n```" },
          { title: "Real-Time Updates", slug: "real-time-updates", type: "content", duration: 25, markdownContent: "## WebSocket Subscriptions\n\n```typescript\nconst subscriptionId = connection.onAccountChange(\n  accountPubkey,\n  (accountInfo) => {\n    const data = deserialize(accountInfo.data);\n    setAccountData(data);\n  },\n  'confirmed'\n);\n\n// Cleanup\nreturn () => connection.removeAccountChangeListener(subscriptionId);\n```" },
          { title: "Frontend Challenge", slug: "frontend-challenge", type: "challenge", duration: 30, challenge: { prompt: "Write a function that maps an Anchor account result to a plain object. The function receives a publicKey string, courseId string, and lessonCount number, and returns a JSON string with those fields plus isEnrolled: false.", language: "typescript", starterCode: "function mapCourseAccount(\n  publicKey: string,\n  courseId: string,\n  lessonCount: number\n): string {\n  // Return JSON.stringify of the mapped object\n  // Include: publicKey, courseId, lessonCount, isEnrolled (false)\n}", solution: "function mapCourseAccount(\n  publicKey: string,\n  courseId: string,\n  lessonCount: number\n): string {\n  return JSON.stringify({\n    publicKey,\n    courseId,\n    lessonCount,\n    isEnrolled: false,\n  });\n}", testCases: [{ input: "abc123def456, intro-to-solana, 10", expectedOutput: "", validator: "(() => { try { const p = JSON.parse(output); return p.publicKey === 'abc123def456' && p.courseId === 'intro-to-solana' && p.lessonCount === 10 && p.isEnrolled === false; } catch { return false; } })()", label: "Maps course account to JSON object" }], hints: ["Return JSON.stringify({...})", "Include all four fields: publicKey, courseId, lessonCount, isEnrolled", "isEnrolled defaults to false"] } },
        ],
      },
    ],
  },
];

async function main() {
  console.log("Seeding Sanity CMS...\n");

  let tx = client.transaction();

  // 1. Create tracks
  console.log("Creating tracks...");
  for (const t of tracks) {
    tx = tx.createOrReplace(t);
  }

  // 2. Create instructors
  console.log("Creating instructors...");
  for (const i of instructors) {
    tx = tx.createOrReplace(i);
  }

  // 3. Create lessons, modules, and courses
  for (const courseDef of courseDefs) {
    console.log(`\nProcessing course: ${courseDef.courseId}`);
    const moduleRefs: { _type: "reference"; _ref: string; _key: string }[] = [];
    let lessonIndex = 0;

    for (let mi = 0; mi < courseDef.modules.length; mi++) {
      const mod = courseDef.modules[mi];
      const moduleId = `module-${courseDef.courseId}-${mi}`;
      const lessonRefs: { _type: "reference"; _ref: string; _key: string }[] = [];

      for (let li = 0; li < mod.lessons.length; li++) {
        const les = mod.lessons[li];
        const lessonId = `lesson-${les.slug}`;

        const lessonDoc: LessonDef = {
          _id: lessonId,
          _type: "lesson",
          title: les.title,
          slug: { _type: "slug", current: les.slug },
          type: les.type,
          duration: les.duration,
          order: lessonIndex,
        };

        if (les.videoUrl) lessonDoc.videoUrl = les.videoUrl;
        if (les.markdownContent) lessonDoc.markdownContent = les.markdownContent;
        if (les.challenge) {
          lessonDoc.challenge = {
            prompt: les.challenge.prompt,
            language: les.challenge.language,
            starterCode: les.challenge.starterCode,
            solution: les.challenge.solution,
            testCases: les.challenge.testCases.map((tc, tci) => ({
              _type: "object" as const,
              _key: `tc-${tci}`,
              input: tc.input,
              expectedOutput: tc.expectedOutput,
              label: tc.label,
              ...(tc.validator ? { validator: tc.validator } : {}),
            })),
            hints: les.challenge.hints,
          };
        }

        tx = tx.createOrReplace(lessonDoc);
        lessonRefs.push({ _type: "reference", _ref: lessonId, _key: `lr-${li}` });
        lessonIndex++;
      }

      const moduleDoc: ModuleDef = {
        _id: moduleId,
        _type: "module",
        title: mod.title,
        description: mod.description,
        order: mi,
        lessons: lessonRefs,
      };

      tx = tx.createOrReplace(moduleDoc);
      moduleRefs.push({ _type: "reference", _ref: moduleId, _key: `mr-${mi}` });
    }

    const courseDoc: CourseDef = {
      _id: `course-${courseDef.courseId}`,
      _type: "course",
      title: courseDef.title,
      courseId: { _type: "slug", current: courseDef.courseId },
      description: courseDef.description,
      longDescription: courseDef.longDescription,
      difficulty: courseDef.difficulty,
      track: { _type: "reference", _ref: courseDef.trackRef },
      instructor: { _type: "reference", _ref: courseDef.instructorRef },
      modules: moduleRefs,
      xpPerLesson: courseDef.xpPerLesson,
      lessonCount: lessonIndex,
      trackId: courseDef.trackId,
      trackLevel: courseDef.trackLevel,
      creator: PLACEHOLDER_CREATOR,
      creatorRewardXp: courseDef.creatorRewardXp,
      minCompletionsForReward: courseDef.minCompletionsForReward,
      ...(courseDef.prerequisiteCourseId ? { prerequisiteCourseId: courseDef.prerequisiteCourseId } : {}),
      tags: courseDef.tags,
      published: true,
    };

    tx = tx.createOrReplace(courseDoc);
    console.log(`  ${courseDef.courseId}: ${lessonIndex} lessons, ${courseDef.modules.length} modules, ${courseDef.xpPerLesson} XP/lesson`);
  }

  // Commit everything
  console.log("\nCommitting to Sanity...");
  const result = await tx.commit();
  console.log(`Done! Created/updated ${result.results.length} documents.`);
}

main().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
