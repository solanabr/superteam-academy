export interface Lesson {
  id: string;
  title: string;
  description: string;
  language: 'rust' | 'typescript' | 'json';
  instructions: string;
  starterCode: string;
  solution: string;
  testKeyword: string;
  xpReward: number;
  estimatedMinutes?: number;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  overview: string;
  icon: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  xpReward: number;
  color: string;
  estimatedDuration: string;
  prerequisites: string[];
  learningObjectives: string[];
  lessons: Lesson[];
}

export const courses: Course[] = [
  {
    id: 'solana-101',
    slug: 'solana-101',
    title: 'Solana 101: Foundations',
    description: 'Learn the basics of the Solana blockchain — accounts, transactions, and the runtime model.',
    overview: 'Dive deep into the foundations of Solana blockchain development. This course covers the core concepts every Solana developer needs to understand — from the unique account model to transaction processing and the runtime environment. You will write real Solana programs using Rust and gain hands-on experience with the fundamental building blocks of the ecosystem.',
    icon: '🌅',
    level: 'beginner',
    xpReward: 500,
    color: 'from-green-500 to-emerald-600',
    estimatedDuration: '1.5 hours',
    prerequisites: [],
    learningObjectives: [
      'Understand the Solana account model and how state is stored',
      'Write your first on-chain program using the msg! macro',
      'Parse and handle instruction data in Solana programs',
      'Navigate the Solana runtime and transaction lifecycle',
    ],
    lessons: [
      {
        id: 'sol101-1',
        title: 'Hello Solana',
        description: 'Write your first Solana log message using msg! macro.',
        language: 'rust',
        instructions: 'Create a Solana program that logs "Hello, Solana!" using the `msg!` macro. This is the fundamental building block of every Solana program.\n\n**Task:** Complete the `process_instruction` function to log a greeting message.\n\n**Hint:** Use `msg!("Hello, Solana!");` inside the function body.',
        starterCode: `use solana_program::{
    account_info::AccountInfo,
    entrypoint,
    entrypoint::ProgramResult,
    pubkey::Pubkey,
    msg,
};

entrypoint!(process_instruction);

pub fn process_instruction(
    _program_id: &Pubkey,
    _accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    // TODO: Log "Hello, Solana!" here

    Ok(())
}`,
        solution: `msg!("Hello, Solana!");`,
        testKeyword: 'msg!',
        xpReward: 100,
        estimatedMinutes: 15,
      },
      {
        id: 'sol101-2',
        title: 'Account Model',
        description: 'Understand Solana accounts by reading account data.',
        language: 'rust',
        instructions: 'Solana uses an account model where all state is stored in accounts. Each account has an owner program, lamports balance, and data.\n\n**Task:** Iterate through accounts and log each account\'s key and lamport balance.\n\n**Hint:** Use `account.key` and `account.lamports()` in a for loop.',
        starterCode: `use solana_program::{
    account_info::AccountInfo,
    entrypoint,
    entrypoint::ProgramResult,
    pubkey::Pubkey,
    msg,
};

entrypoint!(process_instruction);

pub fn process_instruction(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    // TODO: Loop through accounts and log key + lamports
    for account in accounts.iter() {

    }
    Ok(())
}`,
        solution: `msg!("Account {} has {} lamports", account.key, account.lamports())`,
        testKeyword: 'lamports',
        xpReward: 100,
        estimatedMinutes: 20,
      },
      {
        id: 'sol101-3',
        title: 'Instruction Data',
        description: 'Parse instruction data in your Solana program.',
        language: 'rust',
        instructions: 'Programs receive raw bytes as instruction data. You need to parse this data to understand what action the user wants.\n\n**Task:** Parse the first byte of instruction data as a command variant and log it.\n\n**Hint:** Use `instruction_data[0]` and match on it.',
        starterCode: `use solana_program::{
    account_info::AccountInfo,
    entrypoint,
    entrypoint::ProgramResult,
    pubkey::Pubkey,
    msg,
};

entrypoint!(process_instruction);

pub fn process_instruction(
    _program_id: &Pubkey,
    _accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    // TODO: Parse instruction_data[0] and match
    // 0 => "Initialize", 1 => "Transfer", _ => "Unknown"

    Ok(())
}`,
        solution: `match instruction_data[0]`,
        testKeyword: 'match',
        xpReward: 100,
        estimatedMinutes: 25,
      },
    ],
  },
  {
    id: 'anchor-basics',
    slug: 'anchor-basics',
    title: 'Anchor Framework Essentials',
    description: 'Master the Anchor framework for building Solana programs with less boilerplate.',
    overview: 'Master the Anchor framework — the most popular toolkit for building Solana programs. Anchor abstracts away much of the boilerplate code required in native Solana development, letting you focus on business logic. Learn program structure, account validation with constraints, and custom error handling to build robust decentralized applications.',
    icon: '⚓',
    level: 'intermediate',
    xpReward: 750,
    color: 'from-emerald-500 to-teal-600',
    estimatedDuration: '2 hours',
    prerequisites: ['solana-101'],
    learningObjectives: [
      'Set up an Anchor project with declare_id! and #[program]',
      'Define account structs with validation constraints',
      'Implement custom error codes for better debugging',
      'Build a complete Anchor program from scratch',
    ],
    lessons: [
      {
        id: 'anchor-1',
        title: 'Anchor Program Structure',
        description: 'Create your first Anchor program with declare_id! and #[program].',
        language: 'rust',
        instructions: 'Anchor simplifies Solana development with macros and abstractions. Every Anchor program needs a `declare_id!` and a `#[program]` module.\n\n**Task:** Complete the Anchor program by adding an `initialize` instruction that logs "Initialized!".\n\n**Hint:** Add a public function inside the #[program] module.',
        starterCode: `use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod my_program {
    use super::*;

    // TODO: Add initialize function

}

#[derive(Accounts)]
pub struct Initialize {}`,
        solution: `pub fn initialize(ctx: Context<Initialize>) -> Result<()>`,
        testKeyword: 'initialize',
        xpReward: 150,
        estimatedMinutes: 25,
      },
      {
        id: 'anchor-2',
        title: 'Account Constraints',
        description: 'Use Anchor account constraints for validation.',
        language: 'rust',
        instructions: 'Anchor provides powerful account validation through constraints like `#[account(init)]`, `#[account(mut)]`, and `#[account(has_one)]`.\n\n**Task:** Define a `CreateNote` accounts struct that initializes a new Note account with a payer.\n\n**Hint:** Use `#[account(init, payer = user, space = 8 + 256)]`.',
        starterCode: `use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[account]
pub struct Note {
    pub content: String,
    pub author: Pubkey,
}

#[derive(Accounts)]
pub struct CreateNote<'info> {
    // TODO: Add account constraints

    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}`,
        solution: `#[account(init, payer = user`,
        testKeyword: '#[account(init',
        xpReward: 150,
        estimatedMinutes: 30,
      },
      {
        id: 'anchor-3',
        title: 'Error Handling',
        description: 'Implement custom errors in Anchor programs.',
        language: 'rust',
        instructions: 'Anchor allows you to define custom error codes using `#[error_code]` enum. This makes debugging much easier.\n\n**Task:** Define a custom error enum with at least two error variants.\n\n**Hint:** Use `#[error_code]` and `#[msg("...")]` annotations.',
        starterCode: `use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

// TODO: Define custom error enum

#[program]
pub mod my_program {
    use super::*;

    pub fn validate(ctx: Context<Validate>, value: u64) -> Result<()> {
        // TODO: Return error if value is 0

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Validate {}`,
        solution: `#[error_code]`,
        testKeyword: 'error_code',
        xpReward: 150,
        estimatedMinutes: 25,
      },
    ],
  },
  {
    id: 'solana-web3js',
    slug: 'solana-web3js',
    title: 'Solana Web3.js Client',
    description: 'Build frontend applications that interact with Solana using @solana/web3.js.',
    overview: 'Build powerful frontend applications that interact with the Solana blockchain using @solana/web3.js. This client-side course teaches you how to connect to Solana clusters, manage keypairs, request airdrops for testing, check balances, and send SOL transfer transactions — all essential skills for building Solana dApps.',
    icon: '🌐',
    level: 'beginner',
    xpReward: 500,
    color: 'from-orange-500 to-rose-600',
    estimatedDuration: '1.5 hours',
    prerequisites: [],
    learningObjectives: [
      'Establish connections to Solana devnet and other clusters',
      'Generate and manage cryptographic keypairs',
      'Request airdrops and check wallet balances',
      'Create and send SOL transfer transactions',
    ],
    lessons: [
      {
        id: 'web3-1',
        title: 'Connection & Keypairs',
        description: 'Connect to Solana devnet and generate keypairs.',
        language: 'typescript',
        instructions: 'The first step in any Solana client app is establishing a connection and creating keypairs.\n\n**Task:** Create a connection to Solana devnet and generate a new keypair.\n\n**Hint:** Use `new Connection(clusterApiUrl("devnet"))` and `Keypair.generate()`.',
        starterCode: `import {
  Connection,
  clusterApiUrl,
  Keypair,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

async function main() {
  // TODO: Create connection to devnet

  // TODO: Generate a new keypair

  // TODO: Log the public key
  console.log("Connected to Solana Devnet");
}

main();`,
        solution: `new Connection(clusterApiUrl("devnet"))`,
        testKeyword: 'Connection',
        xpReward: 100,
        estimatedMinutes: 15,
      },
      {
        id: 'web3-2',
        title: 'Airdrop & Balance',
        description: 'Request airdrops and check wallet balances.',
        language: 'typescript',
        instructions: 'On devnet, you can request free SOL using airdrops to test your programs.\n\n**Task:** Request an airdrop of 1 SOL and check the balance.\n\n**Hint:** Use `connection.requestAirdrop()` and `connection.getBalance()`.',
        starterCode: `import {
  Connection,
  clusterApiUrl,
  Keypair,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

async function main() {
  const connection = new Connection(clusterApiUrl("devnet"));
  const wallet = Keypair.generate();

  // TODO: Request airdrop of 1 SOL

  // TODO: Get and log balance

}

main();`,
        solution: `requestAirdrop`,
        testKeyword: 'requestAirdrop',
        xpReward: 100,
        estimatedMinutes: 20,
      },
      {
        id: 'web3-3',
        title: 'Send Transaction',
        description: 'Create and send a SOL transfer transaction.',
        language: 'typescript',
        instructions: 'Sending SOL between wallets requires creating a transaction with a transfer instruction.\n\n**Task:** Create a transfer transaction that sends 0.5 SOL to another wallet.\n\n**Hint:** Use `SystemProgram.transfer()` and `sendAndConfirmTransaction()`.',
        starterCode: `import {
  Connection,
  clusterApiUrl,
  Keypair,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

async function main() {
  const connection = new Connection(clusterApiUrl("devnet"));
  const sender = Keypair.generate();
  const receiver = Keypair.generate();

  // TODO: Create transfer instruction

  // TODO: Create transaction and add instruction

  // TODO: Send and confirm transaction

}

main();`,
        solution: `SystemProgram.transfer`,
        testKeyword: 'SystemProgram.transfer',
        xpReward: 100,
        estimatedMinutes: 25,
      },
    ],
  },
  {
    id: 'token-program',
    slug: 'token-program',
    title: 'SPL Token Mastery',
    description: 'Create and manage tokens on Solana using the SPL Token program.',
    overview: 'Unlock the power of fungible tokens on Solana with the SPL Token program. Learn how to create token mints, manage token accounts, mint new tokens, and transfer them between wallets. This course provides the foundation for building DeFi applications, governance tokens, and reward systems on Solana.',
    icon: '🪙',
    level: 'intermediate',
    xpReward: 750,
    color: 'from-yellow-500 to-amber-600',
    estimatedDuration: '2 hours',
    prerequisites: ['solana-web3js'],
    learningObjectives: [
      'Create and configure SPL Token mint accounts',
      'Manage associated token accounts for users',
      'Mint tokens with precise decimal control',
      'Transfer SPL tokens securely between wallets',
    ],
    lessons: [
      {
        id: 'token-1',
        title: 'Create a Token Mint',
        description: 'Initialize a new SPL Token mint account.',
        language: 'typescript',
        instructions: 'Creating a new token on Solana requires initializing a Mint account that defines the token\'s properties.\n\n**Task:** Create a new token mint with 9 decimals.\n\n**Hint:** Use `createMint()` from `@solana/spl-token`.',
        starterCode: `import { Connection, clusterApiUrl, Keypair } from "@solana/web3.js";
// import { createMint } from "@solana/spl-token";

async function main() {
  const connection = new Connection(clusterApiUrl("devnet"));
  const payer = Keypair.generate();

  // TODO: Create a new token mint with 9 decimals
  // const mint = await createMint(
  //   connection, payer, payer.publicKey, null, 9
  // );

  console.log("Token Mint created!");
}

main();`,
        solution: `createMint`,
        testKeyword: 'createMint',
        xpReward: 150,
        estimatedMinutes: 25,
      },
      {
        id: 'token-2',
        title: 'Mint Tokens',
        description: 'Mint tokens to a token account.',
        language: 'typescript',
        instructions: 'After creating a mint, you need to create token accounts and mint tokens to them.\n\n**Task:** Create a token account and mint 1000 tokens to it.\n\n**Hint:** Use `getOrCreateAssociatedTokenAccount()` and `mintTo()`.',
        starterCode: `import { Connection, clusterApiUrl, Keypair } from "@solana/web3.js";

async function main() {
  const connection = new Connection(clusterApiUrl("devnet"));
  const payer = Keypair.generate();

  // Assume mint already exists
  // const mint = ...;

  // TODO: Create associated token account
  // const tokenAccount = await getOrCreateAssociatedTokenAccount(...)

  // TODO: Mint 1000 tokens
  // await mintTo(...)

  console.log("Tokens minted!");
}

main();`,
        solution: `mintTo`,
        testKeyword: 'mintTo',
        xpReward: 150,
        estimatedMinutes: 25,
      },
      {
        id: 'token-3',
        title: 'Transfer Tokens',
        description: 'Transfer SPL tokens between wallets.',
        language: 'typescript',
        instructions: 'Transferring SPL tokens requires both source and destination token accounts.\n\n**Task:** Transfer 100 tokens from one wallet to another.\n\n**Hint:** Use `transfer()` from `@solana/spl-token`.',
        starterCode: `import { Connection, clusterApiUrl, Keypair } from "@solana/web3.js";

async function main() {
  const connection = new Connection(clusterApiUrl("devnet"));

  // TODO: Set up source and destination token accounts

  // TODO: Transfer 100 tokens
  // await transfer(connection, payer, sourceToken, destToken, owner, 100)

  console.log("Tokens transferred!");
}

main();`,
        solution: `transfer`,
        testKeyword: 'transfer',
        xpReward: 150,
        estimatedMinutes: 30,
      },
    ],
  },
  {
    id: 'nft-metaplex',
    slug: 'nft-metaplex',
    title: 'NFTs with Metaplex',
    description: 'Create, mint, and manage NFTs using Metaplex on Solana.',
    overview: 'Enter the world of NFTs on Solana with Metaplex — the leading NFT standard and toolkit. From setting up the Umi framework to minting both standard and compressed NFTs (cNFTs), this advanced course covers everything you need to build NFT-powered applications. Learn how Bubblegum and Merkle trees enable minting millions of NFTs at minimal cost.',
    icon: '🎨',
    level: 'advanced',
    xpReward: 1000,
    color: 'from-pink-500 to-violet-600',
    estimatedDuration: '2.5 hours',
    prerequisites: ['token-program'],
    learningObjectives: [
      'Initialize and configure the Metaplex Umi framework',
      'Mint NFTs with custom metadata on Solana',
      'Create Merkle trees for compressed NFT collections',
      'Understand the economics of standard vs compressed NFTs',
    ],
    lessons: [
      {
        id: 'nft-1',
        title: 'Metaplex Setup',
        description: 'Initialize Metaplex SDK and configure Umi.',
        language: 'typescript',
        instructions: 'Metaplex provides powerful tools for NFT creation on Solana. The new Umi framework simplifies interactions.\n\n**Task:** Set up Umi with a devnet connection and generate a signer.\n\n**Hint:** Use `createUmi()` and `generateSigner()`.',
        starterCode: `// import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
// import { generateSigner } from "@metaplex-foundation/umi";

async function main() {
  // TODO: Create Umi instance connected to devnet
  // const umi = createUmi("https://api.devnet.solana.com");

  // TODO: Generate a new signer
  // const signer = generateSigner(umi);

  console.log("Metaplex Umi initialized!");
}

main();`,
        solution: `createUmi`,
        testKeyword: 'createUmi',
        xpReward: 200,
        estimatedMinutes: 25,
      },
      {
        id: 'nft-2',
        title: 'Mint an NFT',
        description: 'Create and mint a new NFT with metadata.',
        language: 'typescript',
        instructions: 'Minting an NFT involves creating a mint account, metadata account, and master edition.\n\n**Task:** Mint a new NFT with name, symbol, and metadata URI.\n\n**Hint:** Use `createNft()` from the Metaplex SDK.',
        starterCode: `// import { createNft } from "@metaplex-foundation/mpl-token-metadata";

async function main() {
  // const umi = ... (already initialized)

  // TODO: Create NFT with metadata
  // await createNft(umi, {
  //   name: "Superteam Academy Certificate",
  //   symbol: "SFC",
  //   uri: "https://arweave.net/metadata.json",
  //   sellerFeeBasisPoints: 0,
  // }).sendAndConfirm(umi);

  console.log("NFT minted!");
}

main();`,
        solution: `createNft`,
        testKeyword: 'createNft',
        xpReward: 200,
        estimatedMinutes: 30,
      },
      {
        id: 'nft-3',
        title: 'Compressed NFTs',
        description: 'Create cost-efficient compressed NFTs with Bubblegum.',
        language: 'typescript',
        instructions: 'Compressed NFTs (cNFTs) using Bubblegum allow minting millions of NFTs at a fraction of the cost using Merkle trees.\n\n**Task:** Set up a Merkle tree and mint a compressed NFT.\n\n**Hint:** Use `createTree()` and `mintV1()` from Bubblegum.',
        starterCode: `// import { createTree, mintV1 } from "@metaplex-foundation/mpl-bubblegum";

async function main() {
  // const umi = ... (already initialized)

  // TODO: Create Merkle tree for cNFTs
  // await createTree(umi, {
  //   merkleTree: generateSigner(umi),
  //   maxDepth: 14,
  //   maxBufferSize: 64,
  // }).sendAndConfirm(umi);

  // TODO: Mint compressed NFT
  // await mintV1(umi, { ... }).sendAndConfirm(umi);

  console.log("cNFT minted!");
}

main();`,
        solution: `createTree`,
        testKeyword: 'createTree',
        xpReward: 200,
        estimatedMinutes: 35,
      },
    ],
  },
];

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: string;
}

export const achievements: Achievement[] = [
  { id: 'first_login', title: 'Welcome Builder', description: 'Connected to Superteam Academy', icon: '👋', condition: 'Login for the first time' },
  { id: 'first_lesson', title: 'First Steps', description: 'Completed your first lesson', icon: '🐣', condition: 'Complete 1 lesson' },
  { id: 'five_lessons', title: 'Getting Serious', description: 'Completed 5 lessons', icon: '📚', condition: 'Complete 5 lessons' },
  { id: 'first_course', title: 'Course Graduate', description: 'Completed your first course', icon: '🎓', condition: 'Complete 1 course' },
  { id: 'streak_3', title: 'On Fire', description: '3-day learning streak', icon: '🔥', condition: '3-day streak' },
  { id: 'streak_7', title: 'Week Warrior', description: '7-day learning streak', icon: '⚡', condition: '7-day streak' },
  { id: 'xp_1000', title: 'XP Hunter', description: 'Earned 1000 XP', icon: '💎', condition: 'Earn 1000 XP' },
  { id: 'all_beginner', title: 'Foundation Builder', description: 'Completed all beginner courses', icon: '🏗️', condition: 'Complete all beginner courses' },
  { id: 'nft_minter', title: 'NFT Collector', description: 'Minted your first certificate', icon: '🏆', condition: 'Mint first cNFT certificate' },
  { id: 'rust_master', title: 'Rustacean', description: 'Completed all Rust lessons', icon: '🦀', condition: 'Complete all Rust lessons' },
];

