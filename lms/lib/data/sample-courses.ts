import type { Course } from "@/types/course";

function buildCourse(
  base: Omit<
    Course,
    "lessonCount" | "challengeCount" | "totalCompletions" | "totalEnrollments"
  >,
): Course {
  let lessonCount = 0;
  let challengeCount = 0;
  for (const m of base.modules) {
    lessonCount += m.lessons.length;
    challengeCount += m.lessons.filter((l) => l.type === "challenge").length;
  }
  return {
    ...base,
    lessonCount,
    challengeCount,
    totalCompletions: 0,
    totalEnrollments: 0,
  };
}

export const SAMPLE_COURSES: Course[] = [
  buildCourse({
    id: "solana-fundamentals",
    slug: "solana-fundamentals",
    title: "Solana Fundamentals",
    description:
      "Master the core concepts of Solana blockchain development. Learn about accounts, transactions, programs, and the Solana runtime.",
    thumbnail: "/courses/solana-fundamentals.png",
    creator: "Superteam Academy",
    difficulty: "beginner",
    xpTotal: 500,
    trackId: 0,
    trackLevel: 1,
    duration: "6 hours",
    isActive: true,
    createdAt: "2025-01-15T00:00:00Z",
    modules: [
      {
        id: "m1",
        title: "Introduction to Solana",
        description: "Understanding the Solana ecosystem",
        order: 0,
        lessons: [
          {
            id: "l1",
            title: "What is Solana?",
            description: "An overview of Solana blockchain",
            order: 0,
            type: "content",
            xpReward: 25,
            duration: "15 min",
            content:
              "# What is Solana?\n\nSolana is a high-performance blockchain platform designed for decentralized applications and marketplaces.\n\n## Key Features\n\n- **High throughput**: Up to 65,000 TPS\n- **Low fees**: Fractions of a cent per transaction\n- **Fast finality**: ~400ms block times\n- **Proof of History**: Novel consensus mechanism\n\n## Why Solana?\n\nSolana was created to solve the blockchain trilemma — achieving scalability, security, and decentralization simultaneously. Unlike other chains that sacrifice one for the others, Solana uses innovative techniques like Proof of History (PoH) and Tower BFT to achieve all three.",
          },
          {
            id: "l2",
            title: "The Solana Account Model",
            description: "Understanding accounts, rent, and data storage",
            order: 1,
            type: "content",
            xpReward: 30,
            duration: "20 min",
            content:
              "# The Solana Account Model\n\nEverything on Solana is an account. Understanding the account model is fundamental to building on Solana.\n\n## Account Types\n\n1. **System Accounts** — Hold SOL, owned by the System Program\n2. **Program Accounts** — Contain executable code\n3. **Data Accounts** — Store state for programs\n4. **Token Accounts** — Hold SPL tokens\n\n## Key Concepts\n\n- Every account has an **owner** program\n- Only the owner can modify the account's data\n- Accounts must maintain a minimum **rent-exempt** balance\n- Accounts have a maximum size of 10MB",
          },
          {
            id: "l3",
            title: "Transactions & Instructions",
            description: "How transactions work on Solana",
            order: 2,
            type: "content",
            xpReward: 30,
            duration: "20 min",
            content:
              "# Transactions & Instructions\n\nTransactions are the fundamental unit of activity on Solana. Every interaction with the blockchain — transferring SOL, minting tokens, updating program state — happens through transactions.\n\n## Transaction Structure\n\nA Solana transaction consists of three parts:\n\n### 1. Signatures\nOne or more Ed25519 signatures from required signers. The first signer is always the **fee payer** who covers the transaction cost.\n\n### 2. Message\nContains the actual payload:\n- **Header**: Number of required signers, read-only signed/unsigned accounts\n- **Account addresses**: All accounts referenced by any instruction\n- **Recent blockhash**: A recent block hash (valid for ~60 seconds) that prevents replay attacks\n- **Instructions**: One or more instructions to execute\n\n### 3. Transaction Size Limit\nTransactions are capped at **1232 bytes** — this limits how many instructions and accounts you can include.\n\n## Instructions\n\nEach instruction tells a program what to do:\n\n```\nInstruction {\n  program_id: Pubkey,      // Which program to call\n  accounts: [AccountMeta],  // Accounts to pass (read/write, signer/non-signer)\n  data: Vec<u8>,            // Serialized arguments\n}\n```\n\n### AccountMeta\nEach account entry specifies permissions:\n```\nAccountMeta {\n  pubkey: Pubkey,\n  is_signer: bool,     // Must this account sign the transaction?\n  is_writable: bool,   // Will this instruction modify the account?\n}\n```\n\n## Multiple Instructions\n\nA single transaction can contain multiple instructions that execute **atomically** — all succeed or all fail:\n\n```\nTransaction [\n  Instruction 1: Create token account\n  Instruction 2: Mint tokens to account\n  Instruction 3: Update user profile\n]\n// If Instruction 3 fails, Instructions 1 and 2 are also rolled back\n```\n\n## Transaction Fees\n\nSolana fees are predictable and cheap:\n- **Base fee**: 5,000 lamports per signature (~$0.0005)\n- **Priority fee**: Optional, measured in micro-lamports per compute unit\n- Fee payer is always the first signer\n\n## Transaction Lifecycle\n\n1. **Build**: Create transaction with instructions\n2. **Sign**: All required signers add their signatures\n3. **Send**: Submit to an RPC node\n4. **Process**: Validators execute the instructions\n5. **Confirm**: Transaction is included in a block\n6. **Finalize**: Block reaches finality (~400ms)",
          },
        ],
      },
      {
        id: "m2",
        title: "Building on Solana",
        description: "Hands-on development basics",
        order: 1,
        lessons: [
          {
            id: "l4",
            title: "Setting Up Your Environment",
            description: "Install Solana CLI and tools",
            order: 3,
            type: "content",
            xpReward: 25,
            duration: "15 min",
            content:
              '# Setting Up Your Development Environment\n\n## Prerequisites\n\n- Node.js 18+\n- Rust (latest stable)\n\n## Install Solana CLI\n\n```bash\nsh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"\nsolana --version\n```\n\n## Configure for Devnet\n\n```bash\nsolana config set --url devnet\nsolana-keygen new\nsolana airdrop 2\n```',
          },
          {
            id: "l5",
            title: "Your First Transaction",
            description: "Send SOL on devnet",
            order: 4,
            type: "challenge",
            xpReward: 50,
            duration: "30 min",
            challenge: {
              language: "typescript",
              prompt:
                "Write a function that creates and sends a SOL transfer transaction on devnet.",
              starterCode:
                "import { Connection, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';\n\nasync function transferSOL(\n  connection: Connection,\n  from: Keypair,\n  to: PublicKey,\n  amount: number\n): Promise<string> {\n  // Your code here\n  // Create a transfer instruction\n  // Build and send the transaction\n  // Return the transaction signature\n}",
              solution:
                "import { Connection, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';\n\nasync function transferSOL(\n  connection: Connection,\n  from: Keypair,\n  to: PublicKey,\n  amount: number\n): Promise<string> {\n  const transaction = new Transaction().add(\n    SystemProgram.transfer({\n      fromPubkey: from.publicKey,\n      toPubkey: to,\n      lamports: amount * LAMPORTS_PER_SOL,\n    })\n  );\n  const signature = await sendAndConfirmTransaction(connection, transaction, [from]);\n  return signature;\n}",
              testCases: [
                {
                  id: "t1",
                  name: "Returns signature string",
                  input: "0.1 SOL transfer",
                  expectedOutput: "string",
                },
              ],
              hints: [
                "Use SystemProgram.transfer to create the instruction",
                "Use sendAndConfirmTransaction to send it",
              ],
            },
          },
          {
            id: "l6",
            title: "Working with Keypairs",
            description: "Generate and manage keypairs",
            order: 5,
            type: "challenge",
            xpReward: 50,
            duration: "25 min",
            challenge: {
              language: "typescript",
              prompt:
                "Write functions to generate a new keypair and derive a public key from a base58 string.",
              starterCode:
                "import { Keypair, PublicKey } from '@solana/web3.js';\n\nfunction generateKeypair(): { publicKey: string; secretKey: Uint8Array } {\n  // Generate a new keypair\n  // Return public key as base58 and secret key\n}\n\nfunction publicKeyFromString(address: string): PublicKey {\n  // Convert a base58 string to PublicKey\n}",
              solution:
                "import { Keypair, PublicKey } from '@solana/web3.js';\n\nfunction generateKeypair(): { publicKey: string; secretKey: Uint8Array } {\n  const keypair = Keypair.generate();\n  return {\n    publicKey: keypair.publicKey.toBase58(),\n    secretKey: keypair.secretKey,\n  };\n}\n\nfunction publicKeyFromString(address: string): PublicKey {\n  return new PublicKey(address);\n}",
              testCases: [
                {
                  id: "t1",
                  name: "Generates valid keypair",
                  input: "",
                  expectedOutput: "valid keypair",
                },
              ],
              hints: ["Use Keypair.generate()", "Use new PublicKey(string)"],
            },
          },
        ],
      },
      {
        id: "m3",
        title: "Programs & PDAs",
        description: "Program Derived Addresses and on-chain programs",
        order: 2,
        lessons: [
          {
            id: "l7",
            title: "Understanding Programs",
            description: "How Solana programs work",
            order: 6,
            type: "content",
            xpReward: 30,
            duration: "20 min",
            content:
              "# Understanding Solana Programs\n\nPrograms are the smart contracts of Solana. They are stateless — all state is stored in accounts.\n\n## Key Principles\n\n1. Programs are **stateless** — they read/write to accounts\n2. Programs are **deployed** as upgradeable by default\n3. Programs process **instructions** from transactions\n4. Programs can invoke other programs via **CPI** (Cross-Program Invocation)",
          },
          {
            id: "l8",
            title: "Program Derived Addresses",
            description: "PDAs and their importance",
            order: 7,
            type: "content",
            xpReward: 35,
            duration: "25 min",
            content:
              '# Program Derived Addresses (PDAs)\n\nPDAs are deterministic addresses derived from seeds and a program ID. They are essential for on-chain state management.\n\n## How PDAs Work\n\n```rust\nlet (pda, bump) = Pubkey::find_program_address(\n    &[b"seed", user.key().as_ref()],\n    program_id,\n);\n```\n\n## Key Properties\n\n- **Deterministic**: Same seeds always produce the same address\n- **Off-curve**: PDAs are NOT on the Ed25519 curve (no private key)\n- **Program-signable**: Only the owning program can sign for PDAs',
          },
          {
            id: "l9",
            title: "PDA Challenge",
            description: "Derive and use PDAs",
            order: 8,
            type: "challenge",
            xpReward: 75,
            duration: "35 min",
            challenge: {
              language: "typescript",
              prompt:
                "Write a function that derives a PDA for a user profile account.",
              starterCode:
                "import { PublicKey } from '@solana/web3.js';\n\nconst PROGRAM_ID = new PublicKey('11111111111111111111111111111111');\n\nfunction deriveProfilePDA(userWallet: PublicKey): [PublicKey, number] {\n  // Derive PDA with seeds: [\"profile\", userWallet]\n  // Return [pda, bump]\n}",
              solution:
                "import { PublicKey } from '@solana/web3.js';\n\nconst PROGRAM_ID = new PublicKey('11111111111111111111111111111111');\n\nfunction deriveProfilePDA(userWallet: PublicKey): [PublicKey, number] {\n  return PublicKey.findProgramAddressSync(\n    [Buffer.from('profile'), userWallet.toBuffer()],\n    PROGRAM_ID,\n  );\n}",
              testCases: [
                {
                  id: "t1",
                  name: "Returns PDA tuple",
                  input: "valid pubkey",
                  expectedOutput: "[PublicKey, number]",
                },
              ],
              hints: [
                "Use PublicKey.findProgramAddressSync",
                "Seeds should be Buffer arrays",
              ],
            },
          },
          {
            id: "l10",
            title: "Final Quiz",
            description: "Test your Solana knowledge",
            order: 9,
            type: "challenge",
            xpReward: 100,
            duration: "20 min",
            challenge: {
              language: "typescript",
              prompt:
                "Complete the quiz by implementing the missing functions.",
              starterCode:
                "// Q1: What is the maximum account size on Solana?\nfunction maxAccountSize(): number {\n  // Return the answer in bytes\n}\n\n// Q2: How many signatures can a transaction have?\nfunction maxSignatures(): number {\n  // Return the maximum\n}",
              solution:
                "function maxAccountSize(): number {\n  return 10_485_760; // 10MB\n}\n\nfunction maxSignatures(): number {\n  return 12; // Limited by packet size\n}",
              testCases: [
                {
                  id: "t1",
                  name: "Correct answers",
                  input: "",
                  expectedOutput: "10485760, 12",
                },
              ],
              hints: ["10MB in bytes", "Limited by transaction packet size"],
            },
          },
        ],
      },
      {
        id: "m4",
        title: "Tokens & NFTs on Solana",
        description: "Working with fungible tokens and NFTs",
        order: 3,
        lessons: [
          {
            id: "l11",
            title: "The SPL Token Program",
            description: "Understanding Solana's token standard",
            order: 10,
            type: "content",
            xpReward: 10,
            duration: "25 min",
            content:
              "# The SPL Token Program\n\nThe SPL Token Program is Solana's standard for creating and managing tokens.\n\n## Core Concepts\n\n### Mint Account\nA mint defines a token type. It stores:\n- **Supply**: Total tokens minted\n- **Decimals**: Precision (e.g., 9 for SOL-like, 6 for USDC-like, 0 for NFTs)\n- **Mint Authority**: Who can mint new tokens\n- **Freeze Authority**: Who can freeze token accounts\n\n### Token Account (ATA)\nHolds tokens for a specific owner:\n- **Mint**: Which token this account holds\n- **Owner**: Who controls this account\n- **Amount**: Token balance\n\n### Associated Token Account (ATA)\nA deterministic token account derived from wallet + mint:\n```\nATA = findProgramAddress(\n  [walletAddress, TOKEN_PROGRAM_ID, mintAddress],\n  ASSOCIATED_TOKEN_PROGRAM_ID\n)\n```\n\n## Token Program vs Token-2022\n\n| Feature | Token Program | Token-2022 |\n|---------|--------------|------------|\n| Transfer fees | No | Yes |\n| Non-transferable | No | Yes |\n| Confidential transfers | No | Yes |\n| Metadata pointer | No | Yes |\n| Permanent delegate | No | Yes |\n\nToken-2022 is the next generation and supports extensions that enable new use cases like soulbound tokens, transfer taxes, and on-chain metadata.",
          },
          {
            id: "l12",
            title: "Creating Tokens on Devnet",
            description: "Mint your first SPL token",
            order: 11,
            type: "content",
            xpReward: 10,
            duration: "30 min",
            content:
              "# Creating Tokens on Devnet\n\n## Step 1: Create a Mint\n\n```typescript\nimport { createMint } from '@solana/spl-token';\n\nconst mint = await createMint(\n  connection,\n  payer,           // Fee payer\n  mintAuthority,   // Mint authority\n  freezeAuthority, // Freeze authority (null if none)\n  9                // Decimals\n);\nconsole.log('Mint:', mint.toBase58());\n```\n\n## Step 2: Create a Token Account\n\n```typescript\nimport { getOrCreateAssociatedTokenAccount } from '@solana/spl-token';\n\nconst tokenAccount = await getOrCreateAssociatedTokenAccount(\n  connection,\n  payer,\n  mint,\n  owner.publicKey\n);\n```\n\n## Step 3: Mint Tokens\n\n```typescript\nimport { mintTo } from '@solana/spl-token';\n\nawait mintTo(\n  connection,\n  payer,\n  mint,\n  tokenAccount.address,\n  mintAuthority,\n  1_000_000_000 // 1 token (9 decimals)\n);\n```\n\n## Step 4: Transfer Tokens\n\n```typescript\nimport { transfer } from '@solana/spl-token';\n\nawait transfer(\n  connection,\n  payer,\n  sourceTokenAccount,\n  destinationTokenAccount,\n  owner,\n  500_000_000 // 0.5 tokens\n);\n```\n\n## Checking Balances\n\n```typescript\nimport { getAccount } from '@solana/spl-token';\n\nconst info = await getAccount(connection, tokenAccount.address);\nconsole.log('Balance:', Number(info.amount) / 10 ** 9);\n```",
          },
          {
            id: "l13",
            title: "NFTs on Solana",
            description: "Non-fungible tokens and Metaplex",
            order: 12,
            type: "content",
            xpReward: 10,
            duration: "25 min",
            content:
              '# NFTs on Solana\n\nNFTs on Solana are SPL tokens with **0 decimals** and a **supply of 1**.\n\n## What Makes an NFT?\n\n1. **Mint** with decimals = 0\n2. **Supply** of exactly 1\n3. **Metadata** describing the asset\n4. **Mint authority** set to null after minting (ensures no more can be minted)\n\n## Metaplex Standard\n\nMetaplex provides the metadata layer for NFTs:\n\n### Metadata Account\nStored as a PDA derived from the mint:\n```\nseeds = ["metadata", METADATA_PROGRAM_ID, mint]\n```\n\nContains:\n- **Name**: Display name\n- **Symbol**: Short identifier\n- **URI**: Link to off-chain JSON metadata\n- **Creators**: Array of creator addresses with share percentages\n- **Seller fee basis points**: Royalty percentage (e.g., 500 = 5%)\n\n### Off-Chain Metadata (JSON)\n```json\n{\n  "name": "Solana Academy Certificate #1",\n  "symbol": "CERT",\n  "description": "Course completion certificate",\n  "image": "https://arweave.net/...",\n  "attributes": [\n    { "trait_type": "Course", "value": "Solana Fundamentals" },\n    { "trait_type": "Grade", "value": "A" }\n  ]\n}\n```\n\n## Compressed NFTs (cNFTs)\n\nFor large collections, Solana supports **state compression**:\n- Store NFT data in a Merkle tree\n- ~100x cheaper than regular NFTs\n- Same ownership and transfer capabilities\n- Used by platforms like DRiP for mass distribution',
          },
          {
            id: "l14",
            title: "Token Operations Challenge",
            description: "Create and transfer SPL tokens",
            order: 13,
            type: "challenge",
            xpReward: 20,
            duration: "35 min",
            challenge: {
              language: "typescript",
              prompt:
                "Write functions to create a token mint, mint tokens to a wallet, and check the balance.",
              starterCode:
                "import { Connection, Keypair, PublicKey } from '@solana/web3.js';\nimport { createMint, getOrCreateAssociatedTokenAccount, mintTo, getAccount } from '@solana/spl-token';\nimport { TOKEN_PROGRAM_ID } from '@solana/spl-token';\n\nasync function createToken(\n  connection: Connection,\n  payer: Keypair,\n  decimals: number\n): Promise<PublicKey> {\n  // Create a new mint and return its public key\n}\n\nasync function mintTokens(\n  connection: Connection,\n  payer: Keypair,\n  mint: PublicKey,\n  recipient: PublicKey,\n  amount: number\n): Promise<string> {\n  // Get or create ATA for recipient\n  // Mint tokens to the ATA\n  // Return the ATA address as string\n}\n\nasync function getBalance(\n  connection: Connection,\n  tokenAccount: PublicKey\n): Promise<number> {\n  // Return the token balance as a number\n}",
              solution:
                "import { Connection, Keypair, PublicKey } from '@solana/web3.js';\nimport { createMint, getOrCreateAssociatedTokenAccount, mintTo, getAccount } from '@solana/spl-token';\nimport { TOKEN_PROGRAM_ID } from '@solana/spl-token';\n\nasync function createToken(\n  connection: Connection,\n  payer: Keypair,\n  decimals: number\n): Promise<PublicKey> {\n  const mint = await createMint(\n    connection,\n    payer,\n    payer.publicKey,\n    null,\n    decimals\n  );\n  return mint;\n}\n\nasync function mintTokens(\n  connection: Connection,\n  payer: Keypair,\n  mint: PublicKey,\n  recipient: PublicKey,\n  amount: number\n): Promise<string> {\n  const ata = await getOrCreateAssociatedTokenAccount(\n    connection,\n    payer,\n    mint,\n    recipient\n  );\n  await mintTo(\n    connection,\n    payer,\n    mint,\n    ata.address,\n    payer,\n    amount\n  );\n  return ata.address.toBase58();\n}\n\nasync function getBalance(\n  connection: Connection,\n  tokenAccount: PublicKey\n): Promise<number> {\n  const account = await getAccount(connection, tokenAccount);\n  return Number(account.amount);\n}",
              testCases: [
                {
                  id: "t1",
                  name: "Creates mint",
                  input: "decimals: 9",
                  expectedOutput: "PublicKey",
                },
                {
                  id: "t2",
                  name: "Mints tokens",
                  input: "amount: 1000000000",
                  expectedOutput: "ATA address",
                },
                {
                  id: "t3",
                  name: "Gets balance",
                  input: "token account",
                  expectedOutput: "1000000000",
                },
              ],
              hints: [
                "Use createMint with payer as both payer and mint authority",
                "Use getOrCreateAssociatedTokenAccount to get the ATA",
                "Cast account.amount to Number for the balance",
              ],
            },
          },
        ],
      },
    ],
  }),
  buildCourse({
    id: "anchor-beginner",
    slug: "anchor-beginner",
    title: "Anchor Framework: Getting Started",
    description:
      "Build your first Solana program using the Anchor framework. Learn about macros, account validation, and testing.",
    thumbnail: "/courses/anchor-beginner.png",
    creator: "Superteam Academy",
    difficulty: "beginner",
    xpTotal: 500,
    trackId: 1,
    trackLevel: 1,
    duration: "5 hours",
    isActive: true,
    createdAt: "2025-02-01T00:00:00Z",
    modules: [
      {
        id: "am1",
        title: "Anchor Basics",
        description: "Getting started with Anchor",
        order: 0,
        lessons: [
          {
            id: "al1",
            title: "What is Anchor?",
            description: "Introduction to the Anchor framework",
            order: 0,
            type: "content",
            xpReward: 30,
            duration: "15 min",
            content:
              "# What is Anchor?\n\nAnchor is a framework for building Solana programs that dramatically reduces boilerplate and catches bugs at compile time.\n\n## The Problem Anchor Solves\n\nWriting native Solana programs requires manual work for every instruction:\n- Deserialize account data from raw bytes\n- Validate every account (owner, signer, PDA derivation)\n- Serialize data back after modifications\n- Handle errors with numeric codes\n\nThis is error-prone — a missed validation check can lose user funds.\n\n## What Anchor Provides\n\n### 1. Account Validation Macros\nDeclare account requirements and Anchor validates them automatically:\n```rust\n#[derive(Accounts)]\npub struct Transfer<'info> {\n    #[account(mut, has_one = authority)]\n    pub vault: Account<'info, Vault>,\n    pub authority: Signer<'info>,\n}\n```\n\n### 2. IDL Generation\nAnchor generates an Interface Definition Language file describing your program's instructions and accounts. Clients use this to interact with your program type-safely:\n```typescript\n// Auto-generated from your Rust program\nawait program.methods.transfer(amount).accounts({...}).rpc();\n```\n\n### 3. TypeScript Testing Framework\nTest your programs with a clean API:\n```typescript\nit('transfers tokens', async () => {\n  await program.methods.transfer(new BN(100)).accounts({...}).rpc();\n  const vault = await program.account.vault.fetch(vaultPDA);\n  expect(vault.balance.toNumber()).to.equal(100);\n});\n```\n\n### 4. CLI Tools\n```bash\nanchor init my-project   # Create new project\nanchor build             # Compile program\nanchor test              # Build + deploy + run tests\nanchor deploy            # Deploy to cluster\n```\n\n## Anchor vs Native: Comparison\n\n| Aspect | Native | Anchor |\n|--------|--------|--------|\n| Account validation | Manual (50+ lines) | Declarative (5 lines) |\n| Serialization | Manual Borsh | Automatic |\n| Error handling | Numeric codes | Named errors with messages |\n| Client integration | Manual parsing | Auto-generated IDL |\n| Learning curve | Steep | Moderate |",
          },
          {
            id: "al2",
            title: "Project Structure",
            description: "Anchor project layout",
            order: 1,
            type: "content",
            xpReward: 30,
            duration: "15 min",
            content:
              '# Anchor Project Structure\n\nWhen you run `anchor init my-project`, Anchor scaffolds a complete project:\n\n```\nmy-project/\n├── programs/\n│   └── my-program/\n│       ├── Cargo.toml          # Rust dependencies\n│       └── src/\n│           └── lib.rs          # Program entrypoint + all logic\n├── tests/\n│   └── my-program.ts           # TypeScript integration tests\n├── migrations/\n│   └── deploy.ts               # Deployment scripts\n├── app/                        # Frontend (optional)\n├── Anchor.toml                 # Anchor configuration\n├── Cargo.toml                  # Workspace root\n├── package.json                # Node dependencies\n└── tsconfig.json               # TypeScript config\n```\n\n## Key Files Explained\n\n### Anchor.toml\nThe project configuration file:\n```toml\n[features]\nseeds = false\nskip-lint = false\n\n[programs.devnet]\nmy_program = "YOUR_PROGRAM_ID"\n\n[registry]\nurl = "https://api.apr.dev"\n\n[provider]\ncluster = "devnet"\nwallet = "~/.config/solana/id.json"\n\n[scripts]\ntest = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"\n```\n\n### lib.rs — The Program File\n```rust\nuse anchor_lang::prelude::*;\n\ndeclare_id!("YOUR_PROGRAM_ID"); // Unique program address\n\n#[program]\npub mod my_program {\n    use super::*;\n\n    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {\n        // Instruction logic here\n        Ok(())\n    }\n}\n\n#[derive(Accounts)]\npub struct Initialize<\'info> {\n    // Account validation here\n}\n\n#[account]\npub struct MyAccount {\n    // On-chain state here\n}\n```\n\n### Scaling to Multiple Files\nAs your program grows, split into modules:\n```\nsrc/\n├── lib.rs              # Entrypoint + program module\n├── state/\n│   ├── mod.rs          # Account structs\n│   └── config.rs\n├── instructions/\n│   ├── mod.rs          # One file per instruction\n│   ├── initialize.rs\n│   └── transfer.rs\n└── errors.rs           # Custom error codes\n```',
          },
          {
            id: "al3",
            title: "Your First Anchor Program",
            description: "Build a counter program",
            order: 2,
            type: "challenge",
            xpReward: 75,
            duration: "40 min",
            challenge: {
              language: "rust",
              prompt:
                "Create a simple counter program with initialize and increment instructions.",
              starterCode:
                'use anchor_lang::prelude::*;\n\ndeclare_id!("11111111111111111111111111111111");\n\n#[program]\npub mod counter {\n    use super::*;\n\n    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {\n        // Initialize the counter to 0\n        Ok(())\n    }\n\n    pub fn increment(ctx: Context<Increment>) -> Result<()> {\n        // Increment the counter by 1\n        Ok(())\n    }\n}\n\n#[derive(Accounts)]\npub struct Initialize {}\n\n#[derive(Accounts)]\npub struct Increment {}\n\n#[account]\npub struct Counter {\n    pub count: u64,\n}',
              solution:
                "use anchor_lang::prelude::*;\n\ndeclare_id!(\"11111111111111111111111111111111\");\n\n#[program]\npub mod counter {\n    use super::*;\n\n    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {\n        let counter = &mut ctx.accounts.counter;\n        counter.count = 0;\n        Ok(())\n    }\n\n    pub fn increment(ctx: Context<Increment>) -> Result<()> {\n        let counter = &mut ctx.accounts.counter;\n        counter.count += 1;\n        Ok(())\n    }\n}\n\n#[derive(Accounts)]\npub struct Initialize<'info> {\n    #[account(init, payer = user, space = 8 + 8)]\n    pub counter: Account<'info, Counter>,\n    #[account(mut)]\n    pub user: Signer<'info>,\n    pub system_program: Program<'info, System>,\n}\n\n#[derive(Accounts)]\npub struct Increment<'info> {\n    #[account(mut)]\n    pub counter: Account<'info, Counter>,\n}\n\n#[account]\npub struct Counter {\n    pub count: u64,\n}",
              testCases: [
                {
                  id: "t1",
                  name: "Counter initializes to 0",
                  input: "init",
                  expectedOutput: "count: 0",
                },
              ],
              hints: [
                "Add lifetime 'info to your account structs",
                "Use #[account(init, payer = user, space = 8 + 8)]",
              ],
            },
          },
        ],
      },
      {
        id: "am2",
        title: "Account Validation",
        description: "Anchor constraints and validation",
        order: 1,
        lessons: [
          {
            id: "al4",
            title: "Account Constraints",
            description: "Using Anchor constraints",
            order: 3,
            type: "content",
            xpReward: 35,
            duration: "25 min",
            content:
              "# Anchor Account Constraints\n\nConstraints are Anchor's declarative way to validate accounts. Instead of writing manual checks, you annotate accounts and Anchor generates the validation code.\n\n## Initialization Constraints\n\n### `init` — Create a New Account\n```rust\n#[account(\n    init,\n    payer = user,                         // Who pays rent\n    space = 8 + MyAccount::INIT_SPACE,    // Discriminator + data\n)]\npub my_account: Account<'info, MyAccount>,\n```\nRequires `payer`, `space`, and the System Program in accounts.\n\n### `init_if_needed` — Create Only If Missing\n```rust\n#[account(init_if_needed, payer = user, space = 8 + 32)]\npub profile: Account<'info, Profile>,\n```\nCreates the account on first call, does nothing on subsequent calls. Use with caution — adds a feature flag dependency.\n\n## Mutation Constraints\n\n### `mut` — Account Will Be Modified\n```rust\n#[account(mut)]\npub counter: Account<'info, Counter>,\n```\nRequired for any account whose data or lamports change.\n\n## Ownership & Authorization\n\n### `has_one` — Field Must Match Another Account\n```rust\n#[account(has_one = authority)] // vault.authority == authority.key()\npub vault: Account<'info, Vault>,\npub authority: Signer<'info>,\n```\nCompares a field in the account struct to another account's key.\n\n### `constraint` — Custom Boolean Check\n```rust\n#[account(constraint = clock.unix_timestamp > auction.end_time @ AuctionError::NotEnded)]\npub auction: Account<'info, Auction>,\n```\nThe `@` syntax specifies a custom error.\n\n## PDA Constraints\n\n### `seeds` + `bump` — PDA Verification\n```rust\n#[account(\n    seeds = [b\"vault\", user.key().as_ref()],\n    bump = vault.bump,   // Use stored bump (saves CU)\n)]\npub vault: Account<'info, Vault>,\n```\n\n### `seeds` + `init` — Create PDA Account\n```rust\n#[account(\n    init,\n    seeds = [b\"profile\", user.key().as_ref()],\n    bump,\n    payer = user,\n    space = 8 + Profile::INIT_SPACE,\n)]\npub profile: Account<'info, Profile>,\n```\n\n## Closing Accounts\n\n### `close` — Close and Reclaim Rent\n```rust\n#[account(mut, close = user)]  // Transfers lamports to user, zeros data\npub enrollment: Account<'info, Enrollment>,\n```\n\n## Account Types\n\n| Type | Validates |\n|------|----------|\n| `Account<'info, T>` | Owner + discriminator + deserializes |\n| `Signer<'info>` | Must be a transaction signer |\n| `Program<'info, T>` | Must be a specific program |\n| `SystemAccount<'info>` | Owned by System Program |\n| `UncheckedAccount<'info>` | No validation (use `/// CHECK:` comment) |",
          },
          {
            id: "al5",
            title: "PDAs in Anchor",
            description: "Program Derived Addresses with Anchor",
            order: 4,
            type: "content",
            xpReward: 35,
            duration: "25 min",
            content:
              '# PDAs in Anchor\n\nProgram Derived Addresses are deterministic addresses that only your program can sign for. Anchor makes creating and validating PDAs straightforward.\n\n## Creating a PDA Account\n\n```rust\n#[derive(Accounts)]\npub struct CreateProfile<\'info> {\n    #[account(\n        init,\n        seeds = [b"profile", user.key().as_ref()],\n        bump,\n        payer = user,\n        space = 8 + UserProfile::INIT_SPACE,\n    )]\n    pub profile: Account<\'info, UserProfile>,\n    #[account(mut)]\n    pub user: Signer<\'info>,\n    pub system_program: Program<\'info, System>,\n}\n```\n\n### What Happens During `init`\n1. Anchor calls `find_program_address` with your seeds\n2. Creates the account at the derived address via CPI to System Program\n3. Sets your program as the owner\n4. The `bump` is the canonical bump seed found during derivation\n\n## Storing the Bump\n\nAlways store the bump to avoid recalculating it:\n```rust\n#[account]\n#[derive(InitSpace)]\npub struct UserProfile {\n    pub authority: Pubkey,\n    pub xp: u64,\n    pub bump: u8,  // Store this!\n}\n\npub fn create_profile(ctx: Context<CreateProfile>) -> Result<()> {\n    let profile = &mut ctx.accounts.profile;\n    profile.authority = ctx.accounts.user.key();\n    profile.xp = 0;\n    profile.bump = ctx.bumps.profile; // Save the bump\n    Ok(())\n}\n```\n\n## Verifying an Existing PDA\n\n```rust\n#[derive(Accounts)]\npub struct UpdateProfile<\'info> {\n    #[account(\n        mut,\n        seeds = [b"profile", user.key().as_ref()],\n        bump = profile.bump,  // Use stored bump (saves ~1500 CU)\n        has_one = authority,\n    )]\n    pub profile: Account<\'info, UserProfile>,\n    pub authority: Signer<\'info>,\n}\n```\n\n## Multi-Seed PDAs\n\nUse multiple seeds for relationship-based accounts:\n```rust\n// Enrollment = unique per (course, user)\n#[account(\n    init,\n    seeds = [\n        b"enrollment",\n        course.key().as_ref(),\n        user.key().as_ref(),\n    ],\n    bump,\n    payer = user,\n    space = 8 + Enrollment::INIT_SPACE,\n)]\npub enrollment: Account<\'info, Enrollment>,\n```\n\n## PDA Signing for CPIs\n\nPDAs can sign CPIs using `CpiContext::new_with_signer`:\n```rust\nlet seeds = &[\n    b"vault".as_ref(),\n    &[vault.bump],\n];\nlet signer_seeds = &[&seeds[..]];\n\nlet cpi_ctx = CpiContext::new_with_signer(\n    ctx.accounts.token_program.to_account_info(),\n    Transfer {\n        from: ctx.accounts.vault_token.to_account_info(),\n        to: ctx.accounts.user_token.to_account_info(),\n        authority: ctx.accounts.vault.to_account_info(),\n    },\n    signer_seeds,\n);\ntoken::transfer(cpi_ctx, amount)?;\n```\n\n## Common PDA Patterns\n\n| Pattern | Seeds | Use Case |\n|---------|-------|----------|\n| Singleton | `[b"config"]` | Global program config |\n| Per-user | `[b"profile", user]` | User profiles |\n| Relationship | `[b"enrollment", course, user]` | Many-to-many |\n| Per-entity | `[b"course", course_id]` | Named entities |',
          },
          {
            id: "al6",
            title: "Build a Vault",
            description: "Create a SOL vault with PDA",
            order: 5,
            type: "challenge",
            xpReward: 80,
            duration: "45 min",
            challenge: {
              language: "rust",
              prompt:
                "Build a vault program that lets users deposit and withdraw SOL.",
              starterCode:
                'use anchor_lang::prelude::*;\n\ndeclare_id!("11111111111111111111111111111111");\n\n#[program]\npub mod vault {\n    use super::*;\n\n    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {\n        // Transfer SOL from user to vault PDA\n        Ok(())\n    }\n}\n\n#[derive(Accounts)]\npub struct Deposit {}',
              solution:
                "use anchor_lang::prelude::*;\nuse anchor_lang::system_program;\n\ndeclare_id!(\"11111111111111111111111111111111\");\n\n#[program]\npub mod vault {\n    use super::*;\n\n    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {\n        system_program::transfer(\n            CpiContext::new(\n                ctx.accounts.system_program.to_account_info(),\n                system_program::Transfer {\n                    from: ctx.accounts.user.to_account_info(),\n                    to: ctx.accounts.vault.to_account_info(),\n                },\n            ),\n            amount,\n        )?;\n        Ok(())\n    }\n}\n\n#[derive(Accounts)]\npub struct Deposit<'info> {\n    #[account(mut)]\n    pub user: Signer<'info>,\n    #[account(mut, seeds = [b\"vault\"], bump)]\n    pub vault: SystemAccount<'info>,\n    pub system_program: Program<'info, System>,\n}",
              testCases: [
                {
                  id: "t1",
                  name: "Deposits SOL",
                  input: "1 SOL",
                  expectedOutput: "success",
                },
              ],
              hints: [
                "Use system_program::transfer for CPI",
                'Vault PDA with seeds [b"vault"]',
              ],
            },
          },
        ],
      },
      {
        id: "am3",
        title: "Testing & Deployment",
        description: "Testing and deploying Anchor programs",
        order: 2,
        lessons: [
          {
            id: "al7",
            title: "Testing with Anchor",
            description: "Write tests for your programs",
            order: 6,
            type: "content",
            xpReward: 30,
            duration: "20 min",
            content:
              "# Testing with Anchor\n\nAnchor includes a TypeScript testing framework that deploys your program to a local validator and runs tests against it.\n\n## Test Setup\n\n```typescript\nimport * as anchor from '@coral-xyz/anchor';\nimport { Program } from '@coral-xyz/anchor';\nimport { MyProgram } from '../target/types/my_program';\nimport { expect } from 'chai';\n\ndescribe('my-program', () => {\n  const provider = anchor.AnchorProvider.env();\n  anchor.setProvider(provider);\n  const program = anchor.workspace.MyProgram as Program<MyProgram>;\n  const user = provider.wallet;\n});\n```\n\n## Writing Tests\n\n### Basic Instruction Test\n```typescript\nit('initializes the counter', async () => {\n  const counter = anchor.web3.Keypair.generate();\n\n  await program.methods\n    .initialize()\n    .accounts({\n      counter: counter.publicKey,\n      user: user.publicKey,\n      systemProgram: anchor.web3.SystemProgram.programId,\n    })\n    .signers([counter])\n    .rpc();\n\n  // Fetch account and assert state\n  const account = await program.account.counter.fetch(counter.publicKey);\n  expect(account.count.toNumber()).to.equal(0);\n});\n```\n\n### Testing State Changes\n```typescript\nit('increments the counter', async () => {\n  await program.methods\n    .increment()\n    .accounts({ counter: counterPDA })\n    .rpc();\n\n  const account = await program.account.counter.fetch(counterPDA);\n  expect(account.count.toNumber()).to.equal(1);\n});\n```\n\n### Testing Errors\n```typescript\nit('fails when unauthorized', async () => {\n  const attacker = anchor.web3.Keypair.generate();\n\n  try {\n    await program.methods\n      .withdraw(new anchor.BN(100))\n      .accounts({\n        vault: vaultPDA,\n        authority: attacker.publicKey,\n      })\n      .signers([attacker])\n      .rpc();\n    expect.fail('Should have thrown');\n  } catch (err) {\n    expect(err).to.be.instanceOf(anchor.AnchorError);\n    expect(err.error.errorCode.code).to.equal('Unauthorized');\n  }\n});\n```\n\n## Running Tests\n\n```bash\nanchor test                    # Build + deploy + test\nanchor test --skip-build       # Skip rebuild\nanchor test --skip-deploy      # Use already deployed program\n```\n\n## Test Helpers\n\n```typescript\n// Airdrop SOL to a test wallet\nasync function airdrop(connection, pubkey, amount = 2) {\n  const sig = await connection.requestAirdrop(pubkey, amount * anchor.web3.LAMPORTS_PER_SOL);\n  await connection.confirmTransaction(sig);\n}\n\n// Derive a PDA in tests\nconst [profilePDA] = anchor.web3.PublicKey.findProgramAddressSync(\n  [Buffer.from('profile'), user.publicKey.toBuffer()],\n  program.programId\n);\n```",
          },
          {
            id: "al8",
            title: "Deploy to Devnet",
            description: "Deploying your first program",
            order: 7,
            type: "challenge",
            xpReward: 85,
            duration: "30 min",
            challenge: {
              language: "typescript",
              prompt:
                "Write a test that initializes a counter and increments it twice.",
              starterCode:
                "import * as anchor from '@coral-xyz/anchor';\nimport { Program } from '@coral-xyz/anchor';\nimport { expect } from 'chai';\n\ndescribe('counter', () => {\n  const provider = anchor.AnchorProvider.env();\n  anchor.setProvider(provider);\n\n  it('initialize and increment twice', async () => {\n    // Write your test here\n  });\n});",
              solution:
                "import * as anchor from '@coral-xyz/anchor';\nimport { Program } from '@coral-xyz/anchor';\nimport { expect } from 'chai';\n\ndescribe('counter', () => {\n  const provider = anchor.AnchorProvider.env();\n  anchor.setProvider(provider);\n\n  it('initialize and increment twice', async () => {\n    const counter = anchor.web3.Keypair.generate();\n    // Initialize\n    await program.methods.initialize()\n      .accounts({ counter: counter.publicKey })\n      .signers([counter])\n      .rpc();\n    let account = await program.account.counter.fetch(counter.publicKey);\n    expect(account.count.toNumber()).to.equal(0);\n    // Increment twice\n    await program.methods.increment()\n      .accounts({ counter: counter.publicKey })\n      .rpc();\n    await program.methods.increment()\n      .accounts({ counter: counter.publicKey })\n      .rpc();\n    account = await program.account.counter.fetch(counter.publicKey);\n    expect(account.count.toNumber()).to.equal(2);\n  });\n});",
              testCases: [
                {
                  id: "t1",
                  name: "Counter reaches 2",
                  input: "init + 2 increments",
                  expectedOutput: "count: 2",
                },
              ],
              hints: [
                "Generate a new keypair for the counter",
                "Fetch the account to check state",
              ],
            },
          },
        ],
      },
      {
        id: "am4",
        title: "Error Handling & State Management",
        description: "Custom errors, state patterns, and integration testing",
        order: 3,
        lessons: [
          {
            id: "al9",
            title: "Custom Error Handling",
            description: "Defining and using custom errors in Anchor",
            order: 8,
            type: "content",
            xpReward: 30,
            duration: "20 min",
            content:
              '# Custom Error Handling in Anchor\n\nAnchor provides a clean way to define program-specific errors.\n\n## Defining Errors\n\n```rust\n#[error_code]\npub enum ErrorCode {\n    #[msg("Counter has reached its maximum value")]\n    MaxValueReached,\n    #[msg("Only the authority can perform this action")]\n    Unauthorized,\n    #[msg("The account has already been initialized")]\n    AlreadyInitialized,\n}\n```\n\n## Using Errors\n\n```rust\npub fn increment(ctx: Context<Increment>) -> Result<()> {\n    let counter = &mut ctx.accounts.counter;\n    require!(counter.count < u64::MAX, ErrorCode::MaxValueReached);\n    counter.count += 1;\n    Ok(())\n}\n```\n\n## Error Macros\n\n| Macro | Usage |\n|-------|-------|\n| `require!()` | Assert condition, return error if false |\n| `require_eq!()` | Assert two values are equal |\n| `require_keys_eq!()` | Assert two pubkeys are equal |\n| `require_gt!()` | Assert left > right |\n| `err!()` | Return an error directly |\n\n## Client-Side Error Handling\n\n```typescript\ntry {\n  await program.methods.increment().accounts({...}).rpc();\n} catch (err) {\n  if (err instanceof anchor.AnchorError) {\n    console.log(\'Error code:\', err.error.errorCode.code);\n    console.log(\'Error msg:\', err.error.errorMessage);\n  }\n}\n```',
          },
          {
            id: "al10",
            title: "State Management Patterns",
            description: "Common patterns for managing on-chain state",
            order: 9,
            type: "content",
            xpReward: 30,
            duration: "25 min",
            content:
              '# State Management Patterns\n\nEffective on-chain state design is critical for Solana programs.\n\n## Pattern 1: Single Account State\n\nSimplest pattern — one account stores all state:\n\n```rust\n#[account]\npub struct GameState {\n    pub authority: Pubkey,\n    pub score: u64,\n    pub level: u8,\n    pub is_active: bool,\n}\n```\n\n## Pattern 2: PDA-Based Lookup\n\nDerive accounts from meaningful seeds:\n\n```rust\n#[account(\n    init,\n    seeds = [b"player", game.key().as_ref(), user.key().as_ref()],\n    bump,\n    payer = user,\n    space = 8 + PlayerState::INIT_SPACE,\n)]\npub player: Account<\'info, PlayerState>,\n```\n\n## Pattern 3: Account Update with Validation\n\n```rust\npub fn update_score(ctx: Context<UpdateScore>, new_score: u64) -> Result<()> {\n    let state = &mut ctx.accounts.game_state;\n    require!(new_score > state.score, ErrorCode::ScoreMustIncrease);\n    state.score = new_score;\n    state.level = calculate_level(new_score);\n    Ok(())\n}\n```\n\n## Pattern 4: Space Calculation with INIT_SPACE\n\n```rust\n#[account]\n#[derive(InitSpace)]\npub struct UserProfile {\n    pub authority: Pubkey,    // 32 bytes\n    pub xp: u64,             // 8 bytes\n    #[max_len(32)]\n    pub username: String,    // 4 + 32 bytes\n    pub created_at: i64,     // 8 bytes\n}\n// Space = 8 (discriminator) + InitSpace\n```\n\n## Choosing the Right Pattern\n\n- **Global config** → Singleton PDA with `seeds = [b"config"]`\n- **Per-user data** → PDA with `seeds = [b"user", wallet.as_ref()]`\n- **Relationship data** → PDA with `seeds = [b"enrollment", course.as_ref(), user.as_ref()]`',
          },
          {
            id: "al11",
            title: "Full Integration Test",
            description:
              "Write a comprehensive test suite for an Anchor program",
            order: 10,
            type: "challenge",
            xpReward: 40,
            duration: "35 min",
            challenge: {
              language: "typescript",
              prompt:
                "Write a full integration test for a todo-list program with create, toggle, and delete instructions.",
              starterCode:
                "import * as anchor from '@coral-xyz/anchor';\nimport { Program } from '@coral-xyz/anchor';\nimport { PublicKey, Keypair, SystemProgram } from '@solana/web3.js';\nimport { expect } from 'chai';\n\n// Assume TodoList program with:\n// - create_task(title: string) -> creates Task PDA\n// - toggle_task() -> flips is_completed\n// - delete_task() -> closes Task account\n\ndescribe('todo-list', () => {\n  const provider = anchor.AnchorProvider.env();\n  anchor.setProvider(provider);\n  const user = provider.wallet;\n\n  function deriveTaskPDA(title: string): [PublicKey, number] {\n    // Derive PDA with seeds: [\"task\", user_wallet, title]\n  }\n\n  it('creates a task', async () => {\n    // Create a task with title \"Learn Anchor\"\n    // Verify title and is_completed = false\n  });\n\n  it('toggles task completion', async () => {\n    // Toggle the task created above\n    // Verify is_completed = true\n  });\n\n  it('fails to create duplicate task', async () => {\n    // Try creating same task again, expect error\n  });\n\n  it('deletes a task', async () => {\n    // Delete the task\n    // Verify account no longer exists\n  });\n});",
              solution:
                "import * as anchor from '@coral-xyz/anchor';\nimport { Program } from '@coral-xyz/anchor';\nimport { PublicKey, Keypair, SystemProgram } from '@solana/web3.js';\nimport { expect } from 'chai';\n\ndescribe('todo-list', () => {\n  const provider = anchor.AnchorProvider.env();\n  anchor.setProvider(provider);\n  const user = provider.wallet;\n\n  function deriveTaskPDA(title: string): [PublicKey, number] {\n    return PublicKey.findProgramAddressSync(\n      [Buffer.from('task'), user.publicKey.toBuffer(), Buffer.from(title)],\n      program.programId\n    );\n  }\n\n  const title = 'Learn Anchor';\n  let taskPDA: PublicKey;\n\n  before(() => {\n    [taskPDA] = deriveTaskPDA(title);\n  });\n\n  it('creates a task', async () => {\n    await program.methods\n      .createTask(title)\n      .accounts({\n        task: taskPDA,\n        user: user.publicKey,\n        systemProgram: SystemProgram.programId,\n      })\n      .rpc();\n    const task = await program.account.task.fetch(taskPDA);\n    expect(task.title).to.equal(title);\n    expect(task.isCompleted).to.be.false;\n  });\n\n  it('toggles task completion', async () => {\n    await program.methods\n      .toggleTask()\n      .accounts({ task: taskPDA, user: user.publicKey })\n      .rpc();\n    const task = await program.account.task.fetch(taskPDA);\n    expect(task.isCompleted).to.be.true;\n  });\n\n  it('fails to create duplicate task', async () => {\n    try {\n      await program.methods\n        .createTask(title)\n        .accounts({\n          task: taskPDA,\n          user: user.publicKey,\n          systemProgram: SystemProgram.programId,\n        })\n        .rpc();\n      expect.fail('Should have thrown');\n    } catch (err) {\n      expect(err).to.exist;\n    }\n  });\n\n  it('deletes a task', async () => {\n    await program.methods\n      .deleteTask()\n      .accounts({ task: taskPDA, user: user.publicKey })\n      .rpc();\n    const account = await provider.connection.getAccountInfo(taskPDA);\n    expect(account).to.be.null;\n  });\n});",
              testCases: [
                {
                  id: "t1",
                  name: "Creates task",
                  input: "title",
                  expectedOutput: "PDA created",
                },
                {
                  id: "t2",
                  name: "Toggles completion",
                  input: "toggle",
                  expectedOutput: "is_completed: true",
                },
                {
                  id: "t3",
                  name: "Prevents duplicates",
                  input: "same title",
                  expectedOutput: "error",
                },
                {
                  id: "t4",
                  name: "Deletes task",
                  input: "delete",
                  expectedOutput: "account null",
                },
              ],
              hints: [
                "Use PublicKey.findProgramAddressSync for PDA derivation",
                "Use program.account.task.fetch to read state",
                "Check account is null after deletion with getAccountInfo",
              ],
            },
          },
        ],
      },
    ],
  }),
  buildCourse({
    id: "rust-for-solana",
    slug: "rust-for-solana",
    title: "Rust for Solana Developers",
    description:
      "Learn Rust fundamentals tailored for Solana program development. Covers ownership, borrowing, structs, enums, and error handling.",
    thumbnail: "/courses/rust-for-solana.png",
    creator: "Superteam Academy",
    difficulty: "intermediate",
    xpTotal: 1000,
    trackId: 2,
    trackLevel: 1,
    duration: "8 hours",
    isActive: true,
    createdAt: "2025-03-01T00:00:00Z",
    modules: [
      {
        id: "rm1",
        title: "Rust Basics",
        description: "Core Rust concepts",
        order: 0,
        lessons: [
          {
            id: "rl1",
            title: "Variables & Types",
            description: "Rust type system basics",
            order: 0,
            type: "content",
            xpReward: 40,
            duration: "20 min",
            content:
              "# Variables & Types in Rust\n\n## Immutability by Default\n\n```rust\nlet x = 5; // immutable\nlet mut y = 10; // mutable\n```\n\n## Common Types\n\n- `u8`, `u16`, `u32`, `u64`, `u128` — unsigned integers\n- `i8`, `i16`, `i32`, `i64`, `i128` — signed integers\n- `bool`, `String`, `&str`, `Vec<T>`\n\n## Why This Matters for Solana\n\nSolana programs deal with specific byte sizes. Knowing `u64` vs `u32` matters for account space calculations.",
          },
          {
            id: "rl2",
            title: "Ownership & Borrowing",
            description: "Rust's memory model",
            order: 1,
            type: "content",
            xpReward: 50,
            duration: "30 min",
            content:
              '# Ownership & Borrowing\n\nOwnership is Rust\'s core mechanism for memory safety without a garbage collector. Understanding it is essential for writing Solana programs.\n\n## The Three Rules of Ownership\n\n1. **Each value has exactly one owner**\n2. **When the owner goes out of scope, the value is dropped**\n3. **You can have either one mutable reference OR any number of immutable references**\n\n## Ownership in Action\n\n```rust\nlet name = String::from("Alice"); // name owns the String\nlet greeting = name;               // ownership MOVES to greeting\n// println!("{}", name);           // ERROR: name no longer valid!\nprintln!("{}", greeting);          // OK: greeting owns the String\n```\n\nWhen `greeting` goes out of scope, the memory is freed. No garbage collector needed.\n\n## Move Semantics\n\nAssignment transfers ownership for heap-allocated types:\n```rust\nlet a = String::from("Solana");\nlet b = a;       // a is MOVED to b\n// a is now invalid — compile error if used\n```\n\nStack-allocated types (integers, booleans, fixed-size arrays) are **copied** instead:\n```rust\nlet x: u64 = 42;\nlet y = x;       // x is COPIED to y\nprintln!("{} {}", x, y); // Both valid!\n```\n\n## Borrowing: References Without Ownership\n\nBorrowing lets you use a value without taking ownership:\n\n### Immutable Borrow (`&T`)\n```rust\nfn print_balance(balance: &u64) {\n    println!("Balance: {}", balance);\n    // Cannot modify balance here\n}\n\nlet bal: u64 = 1000;\nprint_balance(&bal);      // Borrow bal\nprintln!("{}", bal);      // bal is still valid!\n```\n\nYou can have **many immutable borrows** at the same time:\n```rust\nlet data = vec![1, 2, 3];\nlet ref1 = &data;\nlet ref2 = &data;\nprintln!("{:?} {:?}", ref1, ref2); // OK: multiple readers\n```\n\n### Mutable Borrow (`&mut T`)\n```rust\nfn add_xp(profile_xp: &mut u64, amount: u64) {\n    *profile_xp += amount; // Dereference and modify\n}\n\nlet mut xp: u64 = 100;\nadd_xp(&mut xp, 50);\nprintln!("XP: {}", xp); // 150\n```\n\nYou can have **only one mutable borrow** at a time:\n```rust\nlet mut data = vec![1, 2, 3];\nlet ref1 = &mut data;\n// let ref2 = &mut data;  // ERROR: second mutable borrow!\nref1.push(4);             // OK: only one mutable ref\n```\n\n## Why This Matters for Solana\n\nIn Solana programs, account data follows borrowing rules:\n```rust\n// Borrow account data immutably to read\nlet data = account.try_borrow_data()?;\nlet balance = u64::from_le_bytes(data[0..8].try_into()?);\n\n// Borrow account data mutably to write\nlet mut data = account.try_borrow_mut_data()?;\ndata[0..8].copy_from_slice(&new_balance.to_le_bytes());\n```\n\nAnchor handles this automatically, but understanding the underlying borrowing system helps debug lifetime errors and write efficient program code.',
          },
          {
            id: "rl3",
            title: "Structs & Enums",
            description: "Custom data types",
            order: 2,
            type: "challenge",
            xpReward: 60,
            duration: "25 min",
            challenge: {
              language: "rust",
              prompt: "Define a Token struct and a TokenType enum.",
              starterCode:
                "// Define a TokenType enum with variants: Fungible, NonFungible, SemiFungible\n\n// Define a Token struct with fields: name (String), symbol (String), supply (u64), token_type (TokenType)\n",
              solution:
                "#[derive(Debug)]\nenum TokenType {\n    Fungible,\n    NonFungible,\n    SemiFungible,\n}\n\n#[derive(Debug)]\nstruct Token {\n    name: String,\n    symbol: String,\n    supply: u64,\n    token_type: TokenType,\n}",
              testCases: [
                {
                  id: "t1",
                  name: "Valid struct",
                  input: "",
                  expectedOutput: "compiles",
                },
              ],
              hints: [
                "Use #[derive(Debug)] for printing",
                "enum variants use PascalCase",
              ],
            },
          },
        ],
      },
      {
        id: "rm2",
        title: "Advanced Rust for Solana",
        description: "Patterns used in Solana programs",
        order: 1,
        lessons: [
          {
            id: "rl4",
            title: "Error Handling",
            description: "Result, Option, and custom errors",
            order: 3,
            type: "content",
            xpReward: 45,
            duration: "25 min",
            content:
              '# Error Handling in Rust\n\n## Result<T, E>\n\n```rust\nfn divide(a: u64, b: u64) -> Result<u64, &\'static str> {\n    if b == 0 {\n        return Err("division by zero");\n    }\n    Ok(a / b)\n}\n```\n\n## The ? Operator\n\nPropagates errors automatically:\n```rust\nlet result = divide(10, 2)?;\n```',
          },
          {
            id: "rl5",
            title: "Traits & Generics",
            description: "Polymorphism in Rust",
            order: 4,
            type: "content",
            xpReward: 45,
            duration: "25 min",
            content:
              "# Traits & Generics\n\nTraits define shared behavior. Generics write code that works with multiple types. Together they enable polymorphism in Rust.\n\n## Defining Traits\n\nA trait declares methods that types can implement:\n```rust\ntrait Validate {\n    fn is_valid(&self) -> bool;\n\n    // Default implementation (types can override)\n    fn status(&self) -> &str {\n        if self.is_valid() { \"active\" } else { \"invalid\" }\n    }\n}\n```\n\n## Implementing Traits\n\n```rust\nstruct Course {\n    lesson_count: u32,\n    is_active: bool,\n}\n\nimpl Validate for Course {\n    fn is_valid(&self) -> bool {\n        self.lesson_count > 0 && self.is_active\n    }\n}\n\nstruct LearnerProfile {\n    xp: u64,\n    wallet: [u8; 32],\n}\n\nimpl Validate for LearnerProfile {\n    fn is_valid(&self) -> bool {\n        self.xp > 0 && self.wallet != [0u8; 32]\n    }\n}\n```\n\n## Using Traits as Parameters\n\n```rust\n// Accept any type that implements Validate\nfn check_and_log(item: &impl Validate) {\n    if item.is_valid() {\n        println!(\"Status: {}\", item.status());\n    }\n}\n\n// Equivalent with trait bound syntax\nfn check_and_log<T: Validate>(item: &T) {\n    // Same as above\n}\n```\n\n## Generics\n\nWrite functions and structs that work with any type:\n\n```rust\n// Generic function\nfn largest<T: PartialOrd>(list: &[T]) -> &T {\n    let mut largest = &list[0];\n    for item in &list[1..] {\n        if item > largest {\n            largest = item;\n        }\n    }\n    largest\n}\n\nlet numbers = vec![34, 50, 25, 100, 65];\nlet result = largest(&numbers); // 100\n\nlet chars = vec!['y', 'm', 'a', 'q'];\nlet result = largest(&chars); // 'y'\n```\n\n## Generic Structs\n\n```rust\n// A pool that works with any token type\nstruct Pool<T> {\n    reserve_a: T,\n    reserve_b: T,\n    fee_rate: u16,\n}\n\nimpl<T: std::ops::Mul<Output = T> + Copy> Pool<T> {\n    fn invariant(&self) -> T {\n        self.reserve_a * self.reserve_b\n    }\n}\n```\n\n## Common Standard Traits\n\n| Trait | Purpose | Derive? |\n|-------|---------|--------|\n| `Debug` | Print with `{:?}` | Yes |\n| `Clone` | Create deep copies | Yes |\n| `Copy` | Implicit copy (stack types) | Yes |\n| `PartialEq` | Compare with `==` | Yes |\n| `Default` | Default values | Yes |\n| `Display` | Print with `{}` | No |\n| `From/Into` | Type conversion | No |\n\n```rust\n#[derive(Debug, Clone, PartialEq)]\nstruct Token {\n    symbol: String,\n    decimals: u8,\n}\n```\n\n## Solana Use Case: BorshSerialize + BorshDeserialize\n\n```rust\nuse borsh::{BorshSerialize, BorshDeserialize};\n\n#[derive(BorshSerialize, BorshDeserialize, Debug)]\npub struct Config {\n    pub authority: Pubkey,\n    pub season: u16,\n}\n// These traits enable serializing Config to/from account bytes\n```",
          },
          {
            id: "rl6",
            title: "Serialization",
            description: "Borsh serialization for Solana",
            order: 5,
            type: "challenge",
            xpReward: 70,
            duration: "30 min",
            challenge: {
              language: "rust",
              prompt: "Implement a serializable account struct.",
              starterCode:
                "use borsh::{BorshSerialize, BorshDeserialize};\n\n// Create a UserProfile struct with:\n// - authority: [u8; 32]\n// - xp: u64\n// - level: u8\n// - streak: u16\n// Derive BorshSerialize and BorshDeserialize\n",
              solution:
                "use borsh::{BorshSerialize, BorshDeserialize};\n\n#[derive(BorshSerialize, BorshDeserialize, Debug)]\npub struct UserProfile {\n    pub authority: [u8; 32],\n    pub xp: u64,\n    pub level: u8,\n    pub streak: u16,\n}",
              testCases: [
                {
                  id: "t1",
                  name: "Serializable",
                  input: "",
                  expectedOutput: "compiles with borsh",
                },
              ],
              hints: ["Derive both BorshSerialize and BorshDeserialize"],
            },
          },
        ],
      },
      {
        id: "rm3",
        title: "Collections & Pattern Matching",
        description: "Working with Rust's collection types and control flow",
        order: 2,
        lessons: [
          {
            id: "rl7",
            title: "Vectors & HashMaps",
            description: "Dynamic collections in Rust",
            order: 6,
            type: "content",
            xpReward: 45,
            duration: "25 min",
            content:
              '# Vectors & HashMaps\n\n## Vectors\n\nDynamic arrays that grow at runtime:\n\n```rust\nlet mut scores: Vec<u64> = Vec::new();\nscores.push(100);\nscores.push(200);\n\n// Initialize with values\nlet scores = vec![100, 200, 300];\n\n// Access elements\nlet first = scores[0];           // panics if out of bounds\nlet first = scores.get(0);       // returns Option<&u64>\n```\n\n## HashMaps\n\nKey-value storage:\n\n```rust\nuse std::collections::HashMap;\n\nlet mut balances: HashMap<String, u64> = HashMap::new();\nbalances.insert("alice".to_string(), 1000);\nbalances.insert("bob".to_string(), 500);\n\n// Get a value\nif let Some(balance) = balances.get("alice") {\n    println!("Alice has: {}", balance);\n}\n\n// Entry API — insert if missing\nbalances.entry("carol".to_string()).or_insert(0);\n```\n\n## Why This Matters for Solana\n\n- `Vec<u8>` is used everywhere for raw account data\n- Account data is a byte vector you deserialize into structs\n- HashMaps are useful off-chain but too expensive for on-chain storage (use PDAs instead)\n- `Vec` with known max length is common in account structs (e.g., list of creators)',
          },
          {
            id: "rl8",
            title: "Iterators & Closures",
            description: "Functional programming patterns in Rust",
            order: 7,
            type: "content",
            xpReward: 50,
            duration: "30 min",
            content:
              '# Iterators & Closures\n\n## Closures\n\nAnonymous functions that capture their environment:\n\n```rust\nlet threshold = 100u64;\nlet is_whale = |balance: u64| balance > threshold;\n\nassert!(is_whale(500));\nassert!(!is_whale(50));\n```\n\n## Iterator Methods\n\nRust iterators are lazy — they only compute values when consumed:\n\n```rust\nlet balances = vec![100, 200, 50, 300, 75];\n\n// Filter and collect\nlet whales: Vec<u64> = balances.iter()\n    .filter(|&&b| b > 100)\n    .copied()\n    .collect();\n// [200, 300]\n\n// Map and sum\nlet total: u64 = balances.iter().sum();\n// 725\n\n// Find first match\nlet first_whale = balances.iter().find(|&&b| b > 100);\n// Some(&200)\n\n// Check conditions\nlet all_positive = balances.iter().all(|&b| b > 0);\nlet any_whale = balances.iter().any(|&b| b > 100);\n```\n\n## Chaining Iterators\n\n```rust\nlet accounts = vec![\n    ("alice", 1000u64, true),\n    ("bob", 500, false),\n    ("carol", 2000, true),\n];\n\nlet active_total: u64 = accounts.iter()\n    .filter(|(_, _, active)| *active)\n    .map(|(_, balance, _)| balance)\n    .sum();\n// 3000\n```\n\n## Solana Use Case: Processing Account Data\n\n```rust\n// Count completed lessons from a bitmap\nlet completed_count = (0..total_lessons)\n    .filter(|i| bitmap & (1 << i) != 0)\n    .count();\n```',
          },
          {
            id: "rl9",
            title: "Pattern Matching",
            description: "Match expressions and destructuring",
            order: 8,
            type: "content",
            xpReward: 45,
            duration: "25 min",
            content:
              '# Pattern Matching\n\nRust\'s `match` is one of its most powerful features.\n\n## Basic Match\n\n```rust\nenum Track {\n    Anchor,\n    Rust,\n    DeFi,\n    Security,\n}\n\nfn track_color(track: &Track) -> &str {\n    match track {\n        Track::Anchor => "#008c4c",\n        Track::Rust => "#ffd23f",\n        Track::DeFi => "#2f6b3f",\n        Track::Security => "#1b231d",\n    }\n}\n```\n\n## Destructuring\n\n```rust\nstruct Enrollment {\n    course_id: String,\n    progress: u8,\n    completed: bool,\n}\n\nlet enrollment = Enrollment {\n    course_id: "rust-101".to_string(),\n    progress: 75,\n    completed: false,\n};\n\nmatch enrollment {\n    Enrollment { completed: true, .. } => println!("Completed!"),\n    Enrollment { progress, .. } if progress > 50 => println!("Over halfway!"),\n    _ => println!("Keep going!"),\n}\n```\n\n## Option & Result Matching\n\n```rust\nfn get_xp_reward(lesson_type: &str) -> Option<u64> {\n    match lesson_type {\n        "content" => Some(25),\n        "challenge" => Some(75),\n        "quiz" => Some(50),\n        _ => None,\n    }\n}\n\n// if let shorthand\nif let Some(xp) = get_xp_reward("challenge") {\n    println!("You earned {} XP", xp);\n}\n```\n\n## Guards & Bindings\n\n```rust\nmatch score {\n    0 => println!("No score"),\n    1..=50 => println!("Beginner"),\n    51..=100 => println!("Intermediate"),\n    n if n > 100 => println!("Advanced with {} points", n),\n    _ => unreachable!(),\n}\n```',
          },
          {
            id: "rl10",
            title: "Collections Challenge",
            description:
              "Implement utility functions using iterators and collections",
            order: 9,
            type: "challenge",
            xpReward: 75,
            duration: "35 min",
            challenge: {
              language: "rust",
              prompt:
                "Implement three functions that process learner data using iterators and collections.",
              starterCode:
                "use std::collections::HashMap;\n\nstruct Learner {\n    name: String,\n    xp: u64,\n    courses_completed: Vec<String>,\n}\n\n// 1. Return names of learners with XP above threshold, sorted alphabetically\nfn top_learners(learners: &[Learner], min_xp: u64) -> Vec<String> {\n    todo!()\n}\n\n// 2. Count how many learners completed each course\nfn course_popularity(learners: &[Learner]) -> HashMap<String, usize> {\n    todo!()\n}\n\n// 3. Find the learner with the highest XP, return None if empty\nfn highest_xp(learners: &[Learner]) -> Option<&str> {\n    todo!()\n}",
              solution:
                "use std::collections::HashMap;\n\nstruct Learner {\n    name: String,\n    xp: u64,\n    courses_completed: Vec<String>,\n}\n\nfn top_learners(learners: &[Learner], min_xp: u64) -> Vec<String> {\n    let mut names: Vec<String> = learners.iter()\n        .filter(|l| l.xp >= min_xp)\n        .map(|l| l.name.clone())\n        .collect();\n    names.sort();\n    names\n}\n\nfn course_popularity(learners: &[Learner]) -> HashMap<String, usize> {\n    let mut counts = HashMap::new();\n    for learner in learners {\n        for course in &learner.courses_completed {\n            *counts.entry(course.clone()).or_insert(0) += 1;\n        }\n    }\n    counts\n}\n\nfn highest_xp(learners: &[Learner]) -> Option<&str> {\n    learners.iter()\n        .max_by_key(|l| l.xp)\n        .map(|l| l.name.as_str())\n}",
              testCases: [
                {
                  id: "t1",
                  name: "Filters and sorts top learners",
                  input: "min_xp: 500",
                  expectedOutput: "sorted names",
                },
                {
                  id: "t2",
                  name: "Counts course completions",
                  input: "learners",
                  expectedOutput: "HashMap",
                },
                {
                  id: "t3",
                  name: "Finds max XP",
                  input: "learners",
                  expectedOutput: "Some(name)",
                },
              ],
              hints: [
                "Use .filter().map().collect() for top_learners",
                "Use HashMap entry API for counting",
                "Use .max_by_key() for finding the highest XP learner",
              ],
            },
          },
        ],
      },
      {
        id: "rm4",
        title: "Lifetimes & Memory",
        description: "Understanding Rust's lifetime system",
        order: 3,
        lessons: [
          {
            id: "rl11",
            title: "Lifetimes Explained",
            description: "How Rust tracks reference validity",
            order: 10,
            type: "content",
            xpReward: 55,
            duration: "30 min",
            content:
              "# Lifetimes Explained\n\nLifetimes are Rust's way of ensuring references are always valid.\n\n## The Problem\n\n```rust\n// This won't compile:\nfn longest(x: &str, y: &str) -> &str {\n    if x.len() > y.len() { x } else { y }\n}\n// Error: missing lifetime specifier\n```\n\nThe compiler can't tell whether the returned reference comes from `x` or `y`, so it doesn't know how long the result is valid.\n\n## Lifetime Annotations\n\n```rust\nfn longest<'a>(x: &'a str, y: &'a str) -> &'a str {\n    if x.len() > y.len() { x } else { y }\n}\n```\n\n`'a` tells Rust: the returned reference lives at least as long as the shorter of `x` and `y`.\n\n## Lifetime Rules (Elision)\n\nRust infers lifetimes in common cases:\n\n1. Each input reference gets its own lifetime\n2. If there's one input lifetime, it's applied to all outputs\n3. If `&self` is an input, its lifetime is applied to all outputs\n\n```rust\n// Rust infers these automatically:\nfn first_word(s: &str) -> &str { ... }       // Rule 2\nfn name(&self) -> &str { ... }                // Rule 3\n```\n\n## Struct Lifetimes\n\n```rust\nstruct AccountRef<'a> {\n    data: &'a [u8],\n    owner: &'a [u8; 32],\n}\n\nimpl<'a> AccountRef<'a> {\n    fn data_len(&self) -> usize {\n        self.data.len()\n    }\n}\n```\n\n## In Anchor Programs\n\nYou see lifetimes in account structs:\n```rust\n#[derive(Accounts)]\npub struct Initialize<'info> {\n    #[account(init, payer = user, space = 8 + 32)]\n    pub config: Account<'info, Config>,\n    #[account(mut)]\n    pub user: Signer<'info>,\n    pub system_program: Program<'info, System>,\n}\n```\n\nThe `'info` lifetime ensures all account references remain valid for the duration of instruction processing.",
          },
          {
            id: "rl12",
            title: "Box, Rc, and RefCell",
            description: "Smart pointers in Rust",
            order: 11,
            type: "content",
            xpReward: 50,
            duration: "25 min",
            content:
              '# Smart Pointers: Box, Rc, and RefCell\n\n## Box<T> — Heap Allocation\n\nPuts data on the heap instead of the stack:\n\n```rust\n// Recursive type needs Box\nenum Tree {\n    Leaf(u64),\n    Node(Box<Tree>, Box<Tree>),\n}\n\nlet tree = Tree::Node(\n    Box::new(Tree::Leaf(1)),\n    Box::new(Tree::Leaf(2)),\n);\n```\n\n**When to use:** Recursive types, large data, trait objects.\n\n## Rc<T> — Reference Counting\n\nMultiple owners of the same data:\n\n```rust\nuse std::rc::Rc;\n\nlet config = Rc::new(ProgramConfig { max_xp: 10000 });\nlet ref1 = Rc::clone(&config);\nlet ref2 = Rc::clone(&config);\n// All three point to the same data\n// Data is dropped when last Rc goes out of scope\n```\n\n**When to use:** Shared read-only data with multiple owners.\n\n## RefCell<T> — Interior Mutability\n\nAllows mutation through an immutable reference (checked at runtime):\n\n```rust\nuse std::cell::RefCell;\n\nlet data = RefCell::new(vec![1, 2, 3]);\n\n// Borrow mutably at runtime\ndata.borrow_mut().push(4);\n\n// Borrow immutably\nprintln!("{:?}", data.borrow());\n```\n\n## Combining: Rc<RefCell<T>>\n\n```rust\nuse std::rc::Rc;\nuse std::cell::RefCell;\n\nlet shared_state = Rc::new(RefCell::new(0u64));\nlet clone = Rc::clone(&shared_state);\n\n*clone.borrow_mut() += 100;\nassert_eq!(*shared_state.borrow(), 100);\n```\n\n## Solana Context\n\nOn-chain programs rarely use these directly — account data is managed by the runtime. But understanding them helps with:\n- Off-chain client code\n- Test harnesses\n- Complex instruction builders',
          },
          {
            id: "rl13",
            title: "Lifetime Annotations Challenge",
            description: "Apply lifetime annotations correctly",
            order: 12,
            type: "challenge",
            xpReward: 65,
            duration: "30 min",
            challenge: {
              language: "rust",
              prompt: "Fix the code by adding correct lifetime annotations.",
              starterCode:
                "// Fix 1: Add lifetime annotations so this compiles\nstruct CourseRef {\n    title: &str,\n    creator: &str,\n}\n\nimpl CourseRef {\n    fn display_name(&self) -> &str {\n        self.title\n    }\n}\n\n// Fix 2: Add lifetime annotations\nfn longer_title(a: &CourseRef, b: &CourseRef) -> &str {\n    if a.title.len() >= b.title.len() {\n        a.title\n    } else {\n        b.title\n    }\n}\n\n// Fix 3: This function should return a reference to the item\n//         with the highest XP from the slice\nfn highest_xp_item(items: &[(String, u64)]) -> Option<&str> {\n    items.iter()\n        .max_by_key(|(_, xp)| xp)\n        .map(|(name, _)| name.as_str())\n}",
              solution:
                "struct CourseRef<'a> {\n    title: &'a str,\n    creator: &'a str,\n}\n\nimpl<'a> CourseRef<'a> {\n    fn display_name(&self) -> &str {\n        self.title\n    }\n}\n\nfn longer_title<'a>(a: &'a CourseRef, b: &'a CourseRef) -> &'a str {\n    if a.title.len() >= b.title.len() {\n        a.title\n    } else {\n        b.title\n    }\n}\n\nfn highest_xp_item(items: &[(String, u64)]) -> Option<&str> {\n    items.iter()\n        .max_by_key(|(_, xp)| xp)\n        .map(|(name, _)| name.as_str())\n}",
              testCases: [
                {
                  id: "t1",
                  name: "Compiles with lifetimes",
                  input: "",
                  expectedOutput: "compiles",
                },
                {
                  id: "t2",
                  name: "longer_title works",
                  input: "two courses",
                  expectedOutput: "longer title",
                },
              ],
              hints: [
                "Struct fields with references need a lifetime parameter on the struct",
                "The impl block needs the same lifetime parameter",
                "longer_title needs a shared lifetime since the return could come from either input",
              ],
            },
          },
        ],
      },
      {
        id: "rm5",
        title: "Rust for On-Chain Programs",
        description: "Applying Rust to native Solana program development",
        order: 4,
        lessons: [
          {
            id: "rl14",
            title: "Program Entrypoints",
            description: "How Solana programs receive and process instructions",
            order: 13,
            type: "content",
            xpReward: 55,
            duration: "25 min",
            content:
              "# Program Entrypoints\n\nEvery Solana program has a single entrypoint function.\n\n## The Entrypoint Signature\n\n```rust\nuse solana_program::{\n    account_info::AccountInfo,\n    entrypoint,\n    entrypoint::ProgramResult,\n    pubkey::Pubkey,\n};\n\nentrypoint!(process_instruction);\n\nfn process_instruction(\n    program_id: &Pubkey,\n    accounts: &[AccountInfo],\n    instruction_data: &[u8],\n) -> ProgramResult {\n    // All instructions route through here\n    Ok(())\n}\n```\n\n## Parameters\n\n| Parameter | Type | Purpose |\n|-----------|------|--------|\n| `program_id` | `&Pubkey` | This program's address |\n| `accounts` | `&[AccountInfo]` | All accounts passed to the instruction |\n| `instruction_data` | `&[u8]` | Raw bytes — your instruction identifier + arguments |\n\n## Instruction Dispatch\n\n```rust\nfn process_instruction(\n    program_id: &Pubkey,\n    accounts: &[AccountInfo],\n    instruction_data: &[u8],\n) -> ProgramResult {\n    let (tag, rest) = instruction_data\n        .split_first()\n        .ok_or(ProgramError::InvalidInstructionData)?;\n\n    match tag {\n        0 => initialize(program_id, accounts, rest),\n        1 => increment(program_id, accounts, rest),\n        2 => decrement(program_id, accounts, rest),\n        _ => Err(ProgramError::InvalidInstructionData),\n    }\n}\n```\n\n## AccountInfo Fields\n\n```rust\npub struct AccountInfo<'a> {\n    pub key: &'a Pubkey,\n    pub is_signer: bool,\n    pub is_writable: bool,\n    pub lamports: Rc<RefCell<&'a mut u64>>,\n    pub data: Rc<RefCell<&'a mut [u8]>>,\n    pub owner: &'a Pubkey,\n    pub executable: bool,\n    pub rent_epoch: u64,\n}\n```",
          },
          {
            id: "rl15",
            title: "Account Serialization Patterns",
            description: "Reading and writing account data with Borsh",
            order: 14,
            type: "content",
            xpReward: 55,
            duration: "30 min",
            content:
              "# Account Serialization Patterns\n\nSolana accounts store raw bytes. You need to serialize/deserialize structs to/from these bytes.\n\n## Borsh: Binary Object Representation Serializer for Hashing\n\n```rust\nuse borsh::{BorshSerialize, BorshDeserialize};\n\n#[derive(BorshSerialize, BorshDeserialize, Debug)]\npub struct Counter {\n    pub authority: Pubkey,\n    pub count: u64,\n    pub bump: u8,\n}\n```\n\n## Reading Account Data\n\n```rust\nuse borsh::BorshDeserialize;\n\nfn read_counter(account: &AccountInfo) -> Result<Counter, ProgramError> {\n    let data = account.try_borrow_data()?;\n    Counter::try_from_slice(&data)\n        .map_err(|_| ProgramError::InvalidAccountData)\n}\n```\n\n## Writing Account Data\n\n```rust\nuse borsh::BorshSerialize;\n\nfn write_counter(account: &AccountInfo, counter: &Counter) -> ProgramResult {\n    let mut data = account.try_borrow_mut_data()?;\n    counter.serialize(&mut *data)\n        .map_err(|_| ProgramError::AccountDataTooSmall)?;\n    Ok(())\n}\n```\n\n## Space Calculation\n\nYou must know the exact byte size when creating accounts:\n\n```rust\nimpl Counter {\n    pub const SIZE: usize = 32  // authority: Pubkey\n        + 8                     // count: u64\n        + 1;                    // bump: u8\n}\n```\n\n## Discriminators\n\nAnchor uses an 8-byte discriminator (SHA256 hash prefix). For native programs, use your own:\n\n```rust\n#[derive(BorshSerialize, BorshDeserialize)]\npub struct Counter {\n    pub discriminator: [u8; 8],  // Custom tag to identify account type\n    pub authority: Pubkey,\n    pub count: u64,\n}\n\nconst COUNTER_DISCRIMINATOR: [u8; 8] = [0xC0, 0xA1, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01];\n```",
          },
          {
            id: "rl16",
            title: "Instruction Parsing",
            description: "Deserializing instruction data in native programs",
            order: 15,
            type: "content",
            xpReward: 50,
            duration: "25 min",
            content:
              "# Instruction Parsing\n\nIn native programs, you parse raw instruction bytes into structured data.\n\n## Instruction Data Layout\n\n```\n[tag: u8][...payload bytes...]\n```\n\n## Defining Instructions\n\n```rust\nuse borsh::{BorshSerialize, BorshDeserialize};\n\n#[derive(BorshSerialize, BorshDeserialize)]\npub enum Instruction {\n    /// Initialize the counter\n    /// Accounts: [counter (w, s), authority (s), system_program]\n    Initialize,\n\n    /// Increment by amount\n    /// Accounts: [counter (w), authority (s)]\n    Increment { amount: u64 },\n\n    /// Reset the counter\n    /// Accounts: [counter (w), authority (s)]\n    Reset,\n}\n```\n\n## Parsing with Borsh\n\n```rust\nfn process_instruction(\n    program_id: &Pubkey,\n    accounts: &[AccountInfo],\n    data: &[u8],\n) -> ProgramResult {\n    let instruction = Instruction::try_from_slice(data)\n        .map_err(|_| ProgramError::InvalidInstructionData)?;\n\n    match instruction {\n        Instruction::Initialize => process_initialize(program_id, accounts),\n        Instruction::Increment { amount } => process_increment(accounts, amount),\n        Instruction::Reset => process_reset(accounts),\n    }\n}\n```\n\n## Manual Parsing (Without Borsh)\n\n```rust\nfn parse_u64(data: &[u8], offset: usize) -> Result<u64, ProgramError> {\n    let bytes: [u8; 8] = data[offset..offset + 8]\n        .try_into()\n        .map_err(|_| ProgramError::InvalidInstructionData)?;\n    Ok(u64::from_le_bytes(bytes))\n}\n\nfn process_instruction(\n    _program_id: &Pubkey,\n    accounts: &[AccountInfo],\n    data: &[u8],\n) -> ProgramResult {\n    match data[0] {\n        0 => process_initialize(accounts),\n        1 => {\n            let amount = parse_u64(data, 1)?;\n            process_increment(accounts, amount)\n        },\n        _ => Err(ProgramError::InvalidInstructionData),\n    }\n}\n```",
          },
          {
            id: "rl17",
            title: "Build a Native Counter",
            description: "Build a counter program without Anchor",
            order: 16,
            type: "challenge",
            xpReward: 145,
            duration: "45 min",
            challenge: {
              language: "rust",
              prompt:
                "Build a native Solana counter program with initialize and increment instructions, without using Anchor.",
              starterCode:
                'use borsh::{BorshSerialize, BorshDeserialize};\nuse solana_program::{\n    account_info::{next_account_info, AccountInfo},\n    entrypoint,\n    entrypoint::ProgramResult,\n    msg,\n    program::invoke_signed,\n    program_error::ProgramError,\n    pubkey::Pubkey,\n    system_instruction,\n    sysvar::rent::Rent,\n    sysvar::Sysvar,\n};\n\n#[derive(BorshSerialize, BorshDeserialize, Debug)]\npub struct Counter {\n    pub authority: Pubkey,\n    pub count: u64,\n    pub bump: u8,\n}\n\nimpl Counter {\n    pub const SIZE: usize = 32 + 8 + 1;\n}\n\nentrypoint!(process_instruction);\n\nfn process_instruction(\n    program_id: &Pubkey,\n    accounts: &[AccountInfo],\n    data: &[u8],\n) -> ProgramResult {\n    // Dispatch based on first byte:\n    // 0 => initialize (create PDA with seeds [b"counter", authority])\n    // 1 => increment (add 1 to count, verify authority is signer)\n    todo!()\n}\n\nfn process_initialize(\n    program_id: &Pubkey,\n    accounts: &[AccountInfo],\n) -> ProgramResult {\n    // 1. Parse accounts: counter_pda, authority, system_program\n    // 2. Derive PDA and verify\n    // 3. Create account via invoke_signed\n    // 4. Serialize Counter { authority, count: 0, bump }\n    todo!()\n}\n\nfn process_increment(\n    accounts: &[AccountInfo],\n) -> ProgramResult {\n    // 1. Parse accounts: counter_pda, authority\n    // 2. Verify authority is signer\n    // 3. Deserialize, increment, serialize back\n    todo!()\n}',
              solution:
                'use borsh::{BorshSerialize, BorshDeserialize};\nuse solana_program::{\n    account_info::{next_account_info, AccountInfo},\n    entrypoint,\n    entrypoint::ProgramResult,\n    msg,\n    program::invoke_signed,\n    program_error::ProgramError,\n    pubkey::Pubkey,\n    system_instruction,\n    sysvar::rent::Rent,\n    sysvar::Sysvar,\n};\n\n#[derive(BorshSerialize, BorshDeserialize, Debug)]\npub struct Counter {\n    pub authority: Pubkey,\n    pub count: u64,\n    pub bump: u8,\n}\n\nimpl Counter {\n    pub const SIZE: usize = 32 + 8 + 1;\n}\n\nentrypoint!(process_instruction);\n\nfn process_instruction(\n    program_id: &Pubkey,\n    accounts: &[AccountInfo],\n    data: &[u8],\n) -> ProgramResult {\n    let tag = data.first().ok_or(ProgramError::InvalidInstructionData)?;\n    match tag {\n        0 => process_initialize(program_id, accounts),\n        1 => process_increment(accounts),\n        _ => Err(ProgramError::InvalidInstructionData),\n    }\n}\n\nfn process_initialize(\n    program_id: &Pubkey,\n    accounts: &[AccountInfo],\n) -> ProgramResult {\n    let iter = &mut accounts.iter();\n    let counter_pda = next_account_info(iter)?;\n    let authority = next_account_info(iter)?;\n    let system_program = next_account_info(iter)?;\n\n    let (expected_pda, bump) = Pubkey::find_program_address(\n        &[b"counter", authority.key.as_ref()],\n        program_id,\n    );\n    if *counter_pda.key != expected_pda {\n        return Err(ProgramError::InvalidSeeds);\n    }\n\n    let rent = Rent::get()?;\n    let lamports = rent.minimum_balance(Counter::SIZE);\n    let seeds = &[b"counter".as_ref(), authority.key.as_ref(), &[bump]];\n\n    invoke_signed(\n        &system_instruction::create_account(\n            authority.key,\n            counter_pda.key,\n            lamports,\n            Counter::SIZE as u64,\n            program_id,\n        ),\n        &[authority.clone(), counter_pda.clone(), system_program.clone()],\n        &[seeds],\n    )?;\n\n    let counter = Counter { authority: *authority.key, count: 0, bump };\n    counter.serialize(&mut *counter_pda.try_borrow_mut_data()?)?;\n    msg!("Counter initialized for {}", authority.key);\n    Ok(())\n}\n\nfn process_increment(\n    accounts: &[AccountInfo],\n) -> ProgramResult {\n    let iter = &mut accounts.iter();\n    let counter_pda = next_account_info(iter)?;\n    let authority = next_account_info(iter)?;\n\n    if !authority.is_signer {\n        return Err(ProgramError::MissingRequiredSignature);\n    }\n\n    let mut counter = Counter::try_from_slice(&counter_pda.try_borrow_data()?)?;\n    if counter.authority != *authority.key {\n        return Err(ProgramError::IllegalOwner);\n    }\n\n    counter.count = counter.count.checked_add(1)\n        .ok_or(ProgramError::ArithmeticOverflow)?;\n    counter.serialize(&mut *counter_pda.try_borrow_mut_data()?)?;\n    msg!("Counter incremented to {}", counter.count);\n    Ok(())\n}',
              testCases: [
                {
                  id: "t1",
                  name: "Initializes counter PDA",
                  input: "tag: 0",
                  expectedOutput: "count: 0",
                },
                {
                  id: "t2",
                  name: "Increments counter",
                  input: "tag: 1",
                  expectedOutput: "count: 1",
                },
                {
                  id: "t3",
                  name: "Rejects wrong authority",
                  input: "wrong signer",
                  expectedOutput: "error",
                },
              ],
              hints: [
                "Use Pubkey::find_program_address to derive the PDA and get the bump",
                "Use invoke_signed with the PDA seeds to create the account",
                "Always verify authority.is_signer and counter.authority == authority.key",
                "Use checked_add to prevent overflow",
              ],
            },
          },
        ],
      },
    ],
  }),
  buildCourse({
    id: "defi-basics",
    slug: "defi-basics",
    title: "DeFi on Solana",
    description:
      "Understand the fundamentals of decentralized finance on Solana. Learn about AMMs, lending protocols, and token economics.",
    thumbnail: "/courses/defi-basics.png",
    creator: "Superteam Academy",
    difficulty: "intermediate",
    xpTotal: 1000,
    trackId: 3,
    trackLevel: 1,
    duration: "6 hours",
    isActive: true,
    createdAt: "2025-04-01T00:00:00Z",
    modules: [
      {
        id: "dm1",
        title: "DeFi Foundations",
        description: "Core DeFi concepts on Solana",
        order: 0,
        lessons: [
          {
            id: "dl1",
            title: "What is DeFi?",
            description: "Decentralized Finance overview",
            order: 0,
            type: "content",
            xpReward: 40,
            duration: "20 min",
            content:
              "# DeFi on Solana\n\nDecentralized Finance (DeFi) replaces traditional financial intermediaries — banks, brokers, exchanges — with transparent, permissionless smart contracts.\n\n## What Makes DeFi Different?\n\n| Traditional Finance | DeFi |\n|-------------------|------|\n| Banks hold your money | You hold your keys |\n| Business hours only | 24/7/365 |\n| Application required | Open to anyone with a wallet |\n| Days for settlement | Seconds on Solana |\n| Opaque (hidden fees) | Transparent (code is public) |\n| Geographically restricted | Global access |\n\n## Core DeFi Primitives\n\n### 1. Decentralized Exchanges (DEXs)\nSwap tokens without a central authority. Instead of order books (buyer meets seller), most use **Automated Market Makers** (AMMs) — pools of tokens with algorithmic pricing.\n\n### 2. Lending & Borrowing\nLend your tokens to earn interest. Borrow against collateral without credit checks. All managed by smart contracts with automatic liquidation.\n\n### 3. Liquid Staking\nStake SOL and receive a liquid receipt token (mSOL, jitoSOL) that you can use in other DeFi protocols while still earning staking rewards.\n\n### 4. Perpetual Futures\nTrade with leverage (up to 100x) on decentralized platforms. No expiry dates, no counterparty risk.\n\n## Key Solana DeFi Protocols\n\n| Protocol | Category | TVL |\n|----------|----------|-----|\n| **Jupiter** | DEX Aggregator | Routes through all DEXs for best price |\n| **Raydium** | AMM | Concentrated liquidity + order book hybrid |\n| **Orca** | AMM | User-friendly concentrated liquidity |\n| **Kamino** | Lending | Automated lending and leverage strategies |\n| **Marinade** | Liquid Staking | Stake SOL → receive mSOL |\n| **Jito** | Liquid Staking | MEV-boosted staking yields |\n| **Drift** | Perpetuals | Decentralized perpetual futures |\n| **Meteora** | AMM | Dynamic liquidity market maker |\n\n## Why Solana for DeFi?\n\n- **400ms block times** — Near-instant trade execution\n- **Low fees** — Fractions of a cent per swap\n- **High throughput** — Handles thousands of trades per second\n- **Atomic composability** — Combine multiple DeFi actions in one transaction\n\n## The DeFi Stack\n\n```\n┌─────────────────────────────┐\n│  Aggregators (Jupiter)       │  Best route across DEXs\n├─────────────────────────────┤\n│  DEXs / Lending / Perps      │  Core financial primitives\n├─────────────────────────────┤\n│  Oracles (Pyth)              │  Off-chain price data\n├─────────────────────────────┤\n│  Token Standards (SPL/T22)   │  Fungible + non-fungible tokens\n├─────────────────────────────┤\n│  Solana Runtime              │  Execution layer\n└─────────────────────────────┘\n```",
          },
          {
            id: "dl2",
            title: "Token Standards",
            description: "SPL Token & Token-2022",
            order: 1,
            type: "content",
            xpReward: 50,
            duration: "30 min",
            content:
              "# Token Standards on Solana\n\nTokens are the building blocks of DeFi. Solana has two token programs, each serving different needs.\n\n## SPL Token Program (Original)\n\nThe original standard for creating fungible and non-fungible tokens on Solana.\n\n### Core Concepts\n\n**Mint Account** — Defines a token type:\n```\nMint {\n  supply: 1,000,000,        // Total tokens in existence\n  decimals: 6,               // USDC-like precision\n  mint_authority: Pubkey,    // Who can mint more\n  freeze_authority: Pubkey,  // Who can freeze accounts\n}\n```\n\n**Token Account** — Holds tokens for a specific owner:\n```\nTokenAccount {\n  mint: <USDC mint>,         // Which token\n  owner: <your wallet>,      // Who controls it\n  amount: 500_000_000,       // 500 USDC (6 decimals)\n}\n```\n\n**Associated Token Account (ATA)** — A deterministic token account address derived from your wallet + mint. This is the standard way to hold tokens.\n\n### Common Operations\n\n| Operation | Description |\n|-----------|-------------|\n| `createMint` | Create a new token type |\n| `mintTo` | Mint new tokens |\n| `transfer` | Send tokens between accounts |\n| `burn` | Destroy tokens permanently |\n| `approve` | Delegate spending authority |\n| `freeze` | Lock a token account |\n\n## Token-2022 (Token Extensions Program)\n\nThe next-generation token standard with built-in extensions:\n\n### Key Extensions\n\n| Extension | What It Does | DeFi Use Case |\n|-----------|-------------|---------------|\n| **Transfer Fee** | Automatic fee on every transfer | Royalties, protocol revenue |\n| **Non-Transferable** | Tokens cannot be sent | Soulbound credentials, XP tokens |\n| **Permanent Delegate** | Program can always transfer/burn | Platform-controlled assets |\n| **Transfer Hook** | Custom code runs on every transfer | KYC checks, transfer limits |\n| **Metadata Pointer** | On-chain metadata without Metaplex | Token info stored on mint |\n| **Confidential Transfer** | Zero-knowledge private balances | Private DeFi transactions |\n| **Interest Bearing** | Display accrued interest | Lending receipt tokens |\n| **Default Account State** | Accounts start frozen | Regulated tokens |\n| **Mint Close Authority** | Close empty mints | Reclaim rent from unused mints |\n\n### When to Use Which?\n\n```\nSimple fungible token (memecoin, utility) → SPL Token\nNFT collection                            → SPL Token + Metaplex\nSoulbound/non-transferable                → Token-2022 (NonTransferable)\nRoyalty-bearing token                     → Token-2022 (TransferFee)\nRegulated asset                           → Token-2022 (TransferHook)\nCredential/achievement                    → Token-2022 (NonTransferable + Metadata)\n```\n\n## Token Decimals in DeFi\n\nDecimals determine precision. All amounts are stored as integers:\n```\nSOL:  9 decimals → 1 SOL = 1,000,000,000 lamports\nUSDC: 6 decimals → 1 USDC = 1,000,000\nNFT:  0 decimals → 1 NFT = 1\n```\n\nWhen displaying to users, divide by `10^decimals`:\n```typescript\nconst displayAmount = rawAmount / Math.pow(10, decimals);\n```",
          },
        ],
      },
      {
        id: "dm2",
        title: "AMMs & Liquidity Pools",
        description: "How automated market makers work on Solana",
        order: 1,
        lessons: [
          {
            id: "dl3",
            title: "How AMMs Work",
            description: "Automated Market Makers explained",
            order: 2,
            type: "content",
            xpReward: 65,
            duration: "25 min",
            content:
              "# How AMMs Work\n\nAutomated Market Makers replace traditional order books with mathematical formulas.\n\n## The Problem with Order Books On-Chain\n\nTraditional exchanges match buyers and sellers. On-chain order books require many transactions to place/cancel orders, consuming compute and fees.\n\n## AMM Solution\n\nAMMs use **liquidity pools** — pairs of tokens locked in a smart contract. Prices are determined by the ratio of tokens in the pool.\n\n```\nPool: 1000 SOL / 100,000 USDC\nPrice: 100,000 / 1000 = 100 USDC per SOL\n```\n\n## How a Swap Works\n\n1. User sends Token A to the pool\n2. Pool calculates how much Token B to return (using its formula)\n3. User receives Token B\n4. Pool ratio changes → price updates\n\n## Solana AMMs\n\n| Protocol | Model | Specialty |\n|----------|-------|-----------|\n| **Raydium** | Constant Product + CLOB | Hybrid AMM + order book |\n| **Orca** | Concentrated Liquidity | Capital-efficient ranges |\n| **Meteora** | Dynamic | DLMM with variable fees |\n| **Lifinity** | Proactive | Oracle-based rebalancing |\n\n## Key Concepts\n\n- **Slippage**: Price moves against you during a trade\n- **Price Impact**: How much your trade moves the price\n- **TVL**: Total Value Locked — measure of pool size",
          },
          {
            id: "dl4",
            title: "Constant Product Formula",
            description: "The x * y = k math behind AMMs",
            order: 3,
            type: "content",
            xpReward: 70,
            duration: "30 min",
            content:
              "# Constant Product Formula: x * y = k\n\nThe most common AMM formula, used by Uniswap and Raydium.\n\n## The Formula\n\n```\nx * y = k (constant)\n\nx = reserve of Token A\ny = reserve of Token B\nk = invariant (stays constant through swaps)\n```\n\n## Example: SOL/USDC Pool\n\n```\nInitial: 100 SOL * 10,000 USDC = 1,000,000 (k)\nPrice: 10,000 / 100 = 100 USDC/SOL\n```\n\n**User swaps 10 SOL for USDC:**\n```\nNew SOL reserve: 100 + 10 = 110\nNew USDC reserve: k / new_x = 1,000,000 / 110 = 9,090.91\nUSDC out: 10,000 - 9,090.91 = 909.09\nEffective price: 909.09 / 10 = 90.91 USDC/SOL\n```\n\nThe user got less than the spot price (100) — this is **price impact**.\n\n## Price Impact Visualization\n\n```\nSmall trade (1 SOL):  ~99.01 USDC  (0.99% impact)\nMedium trade (10 SOL): ~909.09 USDC (9.09% impact)\nLarge trade (50 SOL):  ~3,333 USDC  (33.3% impact)\n```\n\nLarger pools have less price impact for the same trade size.\n\n## Fees\n\nMost AMMs charge 0.25-0.30% per swap:\n```\nactual_output = calculated_output * (1 - fee_rate)\n```\n\nFees go to liquidity providers as incentive.\n\n## Concentrated Liquidity\n\nModern AMMs (Orca Whirlpools) let LPs concentrate liquidity in price ranges, improving capital efficiency by 100-1000x.",
          },
          {
            id: "dl5",
            title: "Liquidity Provision & Impermanent Loss",
            description: "Risks and rewards of providing liquidity",
            order: 4,
            type: "content",
            xpReward: 65,
            duration: "25 min",
            content:
              "# Liquidity Provision & Impermanent Loss\n\n## Providing Liquidity\n\nLiquidity Providers (LPs) deposit equal value of two tokens into a pool.\n\n```\nDeposit: 10 SOL + 1,000 USDC (at SOL = $100)\nYou receive: LP tokens representing your share\n```\n\n## LP Rewards\n\n- **Trading fees**: Your share of all swap fees (typically 0.25-0.30%)\n- **Emissions**: Many protocols offer additional token rewards\n- **Yield farming**: LP tokens can be staked for extra rewards\n\n## Impermanent Loss (IL)\n\nThe risk of providing liquidity. It occurs when the price ratio of your deposited tokens changes.\n\n### Example\n\n```\nDeposit: 10 SOL + 1,000 USDC (SOL = $100)\nTotal value: $2,000\n\nSOL price doubles to $200:\n\nIf held (no LP): 10 SOL ($2,000) + 1,000 USDC = $3,000\nAs LP: ~7.07 SOL ($1,414) + 1,414 USDC = $2,828\n\nImpermanent Loss: $3,000 - $2,828 = $172 (5.7%)\n```\n\n### IL Table by Price Change\n\n| Price Change | IL |\n|-------------|----|\n| 1.25x | 0.6% |\n| 1.50x | 2.0% |\n| 2x | 5.7% |\n| 3x | 13.4% |\n| 5x | 25.5% |\n\n## Mitigating IL\n\n1. **Stablecoin pairs** — Low IL (USDC/USDT)\n2. **Correlated assets** — SOL/mSOL has minimal IL\n3. **High-fee pools** — Fees offset IL\n4. **Concentrated liquidity** — Higher fees but higher IL risk",
          },
          {
            id: "dl6",
            title: "AMM Price Calculation Challenge",
            description: "Implement constant product AMM math",
            order: 5,
            type: "challenge",
            xpReward: 85,
            duration: "35 min",
            challenge: {
              language: "typescript",
              prompt:
                "Implement the core math functions for a constant product AMM.",
              starterCode:
                "// Constant Product AMM: x * y = k\n\ninterface Pool {\n  reserveA: number;  // Token A reserve\n  reserveB: number;  // Token B reserve\n  feeRate: number;   // e.g., 0.003 for 0.3%\n}\n\n// Calculate how much Token B you get for swapping amountA of Token A\nfunction getAmountOut(pool: Pool, amountA: number): number {\n  // Apply fee to input amount\n  // Use x * y = k to calculate output\n  // Return the output amount\n}\n\n// Calculate the price impact of a swap as a percentage\nfunction getPriceImpact(pool: Pool, amountA: number): number {\n  // Spot price before swap\n  // Effective price of the swap\n  // Return impact as percentage (e.g., 5.0 for 5%)\n}\n\n// Calculate impermanent loss given a price change ratio\nfunction getImpermanentLoss(priceRatio: number): number {\n  // Formula: IL = 2 * sqrt(r) / (1 + r) - 1\n  // Return as positive percentage\n}",
              solution:
                "interface Pool {\n  reserveA: number;\n  reserveB: number;\n  feeRate: number;\n}\n\nfunction getAmountOut(pool: Pool, amountA: number): number {\n  const amountAWithFee = amountA * (1 - pool.feeRate);\n  const k = pool.reserveA * pool.reserveB;\n  const newReserveA = pool.reserveA + amountAWithFee;\n  const newReserveB = k / newReserveA;\n  return pool.reserveB - newReserveB;\n}\n\nfunction getPriceImpact(pool: Pool, amountA: number): number {\n  const spotPrice = pool.reserveB / pool.reserveA;\n  const amountOut = getAmountOut(pool, amountA);\n  const effectivePrice = amountOut / amountA;\n  return ((spotPrice - effectivePrice) / spotPrice) * 100;\n}\n\nfunction getImpermanentLoss(priceRatio: number): number {\n  const sqrtR = Math.sqrt(priceRatio);\n  const il = (2 * sqrtR) / (1 + priceRatio) - 1;\n  return Math.abs(il) * 100;\n}",
              testCases: [
                {
                  id: "t1",
                  name: "Swap calculation",
                  input: "pool: {1000, 100000, 0.003}, amountA: 10",
                  expectedOutput: "~906.6",
                },
                {
                  id: "t2",
                  name: "Price impact",
                  input: "pool: {1000, 100000, 0.003}, amountA: 10",
                  expectedOutput: "~9.3%",
                },
                {
                  id: "t3",
                  name: "IL at 2x",
                  input: "priceRatio: 2",
                  expectedOutput: "~5.7%",
                },
              ],
              hints: [
                "For getAmountOut: apply fee first, then use k = x * y",
                "For price impact: compare spot price vs effective price",
                "IL formula: 2 * sqrt(ratio) / (1 + ratio) - 1",
              ],
            },
          },
        ],
      },
      {
        id: "dm3",
        title: "Lending & Borrowing",
        description: "How lending protocols work on Solana",
        order: 2,
        lessons: [
          {
            id: "dl7",
            title: "Lending Protocol Architecture",
            description: "How on-chain lending works",
            order: 6,
            type: "content",
            xpReward: 65,
            duration: "25 min",
            content:
              "# Lending Protocol Architecture\n\nLending protocols allow users to lend assets to earn yield and borrow assets against collateral.\n\n## Core Components\n\n### 1. Lending Pool\nA pool of tokens supplied by lenders:\n```\nSOL Lending Pool:\n  Total Supplied: 10,000 SOL\n  Total Borrowed: 7,000 SOL\n  Available: 3,000 SOL\n  Utilization: 70%\n```\n\n### 2. Collateral\nBorrowers must deposit collateral worth more than their loan:\n```\nAlice deposits: 100 SOL ($10,000)\nLTV ratio: 75%\nMax borrow: $7,500 in USDC\n```\n\n### 3. Interest Rates\nDetermined by **utilization rate** — how much of the pool is borrowed:\n```\nLow utilization (20%):  Low rates (2% APY)\nMedium utilization (70%): Medium rates (8% APY)\nHigh utilization (90%+):  High rates (50%+ APY)\n```\n\n## Solana Lending Protocols\n\n| Protocol | Specialty |\n|----------|-----------|\n| **Kamino** | Automated lending & leverage |\n| **Marginfi** | Risk-tiered lending pools |\n| **Solend** | Original Solana lending |\n| **Save (Solend v2)** | Isolated pools |\n\n## The Lending Flow\n\n1. **Lender** deposits SOL → receives receipt tokens (cSOL)\n2. Receipt tokens appreciate over time as interest accrues\n3. **Borrower** deposits USDC collateral\n4. Borrower takes SOL loan, pays interest\n5. Lender redeems cSOL for SOL + earned interest",
          },
          {
            id: "dl8",
            title: "Collateral & Liquidation",
            description: "Managing risk in lending protocols",
            order: 7,
            type: "content",
            xpReward: 70,
            duration: "30 min",
            content:
              "# Collateral & Liquidation\n\n## Loan-to-Value (LTV)\n\nThe maximum you can borrow relative to your collateral:\n\n```\nCollateral: 100 SOL at $100 = $10,000\nLTV: 75%\nMax Borrow: $7,500\n```\n\nDifferent assets have different LTV ratios based on volatility:\n\n| Asset | Typical LTV |\n|-------|------------|\n| SOL | 70-80% |\n| USDC | 90-95% |\n| BTC | 75-85% |\n| Memecoins | 0-50% |\n\n## Health Factor\n\nMeasures how close you are to liquidation:\n\n```\nHealth Factor = (Collateral Value * Liquidation Threshold) / Borrow Value\n\nHF > 1.0: Safe\nHF = 1.0: Liquidation threshold\nHF < 1.0: Liquidatable\n```\n\n### Example\n```\nCollateral: 100 SOL * $100 = $10,000\nLiquidation Threshold: 85%\nBorrow: $7,000 USDC\n\nHF = ($10,000 * 0.85) / $7,000 = 1.21 (Safe)\n\nSOL drops to $85:\nHF = ($8,500 * 0.85) / $7,000 = 1.03 (Getting risky)\n\nSOL drops to $82:\nHF = ($8,200 * 0.85) / $7,000 = 0.995 (Liquidatable!)\n```\n\n## Liquidation Process\n\n1. Health factor drops below 1.0\n2. **Liquidator** repays part of the borrower's debt\n3. Liquidator receives collateral at a discount (typically 5-10%)\n4. Borrower's position is reduced\n\n```\nLiquidation Bonus: 5%\nLiquidator repays: $3,500 USDC\nLiquidator receives: $3,675 worth of SOL\nProfit: $175\n```\n\n## On-Chain Implementation\n\nLiquidation bots monitor health factors and execute liquidations atomically:\n- Read all positions via RPC\n- Calculate health factors off-chain\n- Submit liquidation transaction when HF < 1.0\n- Compete for MEV (Maximal Extractable Value)",
          },
          {
            id: "dl9",
            title: "Interest Rate Models",
            description: "How lending rates are calculated",
            order: 8,
            type: "content",
            xpReward: 60,
            duration: "20 min",
            content:
              "# Interest Rate Models\n\nLending protocols use mathematical models to set interest rates dynamically.\n\n## Utilization Rate\n\n```\nUtilization = Total Borrowed / Total Supplied\n```\n\n## Linear Rate Model\n\nThe simplest model — rates increase linearly with utilization:\n\n```\nBorrow Rate = Base Rate + (Utilization * Slope)\n\nExample: Base = 2%, Slope = 20%\nAt 50% utilization: 2% + (0.5 * 20%) = 12%\nAt 80% utilization: 2% + (0.8 * 20%) = 18%\n```\n\n## Kinked Rate Model (Most Common)\n\nTwo slopes with a **kink** at optimal utilization:\n\n```\nIf utilization <= optimal (e.g., 80%):\n  Rate = base + utilization * slope1\n\nIf utilization > optimal:\n  Rate = base + optimal * slope1 +\n         (utilization - optimal) * slope2\n\nslope2 >> slope1 (steep increase above kink)\n```\n\n### Example\n```\nBase: 2%, Optimal: 80%, Slope1: 10%, Slope2: 300%\n\nAt 50%: 2% + 0.5 * 10% = 7%\nAt 80%: 2% + 0.8 * 10% = 10%\nAt 90%: 10% + 0.1 * 300% = 40%\nAt 95%: 10% + 0.15 * 300% = 55%\n```\n\nThis creates urgency for borrowers to repay and lenders to supply when utilization is high.\n\n## Supply Rate\n\nLenders earn based on utilization and borrow rate:\n```\nSupply Rate = Borrow Rate * Utilization * (1 - Protocol Fee)\n```",
          },
        ],
      },
      {
        id: "dm4",
        title: "Oracles & Composability",
        description: "Price feeds and DeFi building blocks",
        order: 3,
        lessons: [
          {
            id: "dl10",
            title: "Oracle Integration",
            description: "Bringing off-chain data on-chain",
            order: 9,
            type: "content",
            xpReward: 65,
            duration: "25 min",
            content:
              "# Oracle Integration\n\nOracles bridge off-chain data (prices, randomness, events) to on-chain programs.\n\n## Why Oracles Matter\n\nDeFi protocols need accurate prices to:\n- Calculate collateral values for lending\n- Trigger liquidations at correct thresholds\n- Price assets in AMMs\n- Settle derivatives\n\n## Solana Oracles\n\n### Pyth Network\nThe dominant oracle on Solana:\n\n```rust\nuse pyth_solana_receiver_sdk::price_update::PriceUpdateV2;\n\n// Read SOL/USD price\nlet price_update = &ctx.accounts.price_feed;\nlet price = price_update.get_price_no_older_than(\n    &Clock::get()?,\n    60,  // max age in seconds\n    &sol_usd_feed_id,\n)?;\n\nlet sol_price_usd = price.price; // Fixed-point with exponent\nlet confidence = price.conf;      // Confidence interval\n```\n\n### Switchboard\nDecentralized oracle network:\n```rust\nlet feed = ctx.accounts.switchboard_feed.load()?;\nlet price = feed.get_result()?.try_into()?;\n```\n\n## Price Feed Safety\n\n1. **Staleness check**: Reject prices older than N seconds\n2. **Confidence interval**: Wide confidence = unreliable price\n3. **Multiple oracles**: Cross-reference for critical operations\n4. **Circuit breakers**: Halt if price moves >X% in one update\n\n```rust\n// Safety checks\nrequire!(price.publish_time > clock.unix_timestamp - 60,\n    ErrorCode::StalePriceFeed);\nrequire!(price.conf < price.price.unsigned_abs() / 20,\n    ErrorCode::PriceConfidenceTooWide);\n```",
          },
          {
            id: "dl11",
            title: "Token Distribution & Vesting",
            description: "On-chain vesting schedules and token launches",
            order: 10,
            type: "content",
            xpReward: 60,
            duration: "20 min",
            content:
              "# Token Distribution & Vesting\n\n## Token Distribution Models\n\n### Fair Launch\nAll tokens available from day one:\n- Community sale or airdrop\n- No team allocation vesting\n- Example: Bonk, many community tokens\n\n### Vesting Schedule\nTokens released over time:\n```\nTeam: 20% vesting over 3 years (1-year cliff)\nInvestors: 15% vesting over 2 years (6-month cliff)\nCommunity: 40% distributed via emissions\nTreasury: 25% controlled by DAO\n```\n\n## On-Chain Vesting\n\nVesting contracts lock tokens and release them on schedule:\n\n```rust\n#[account]\npub struct VestingSchedule {\n    pub beneficiary: Pubkey,\n    pub mint: Pubkey,\n    pub total_amount: u64,\n    pub released_amount: u64,\n    pub start_time: i64,\n    pub cliff_time: i64,\n    pub end_time: i64,\n}\n\npub fn claimable_amount(schedule: &VestingSchedule, now: i64) -> u64 {\n    if now < schedule.cliff_time {\n        return 0;\n    }\n    let elapsed = (now - schedule.start_time) as u64;\n    let duration = (schedule.end_time - schedule.start_time) as u64;\n    let vested = schedule.total_amount\n        .checked_mul(elapsed.min(duration)).unwrap()\n        .checked_div(duration).unwrap();\n    vested - schedule.released_amount\n}\n```\n\n## Solana Vesting Tools\n\n- **Streamflow**: Token vesting & payroll\n- **Bonfida Vesting**: Simple vesting contracts\n- **Realms (SPL Governance)**: DAO-controlled treasury vesting",
          },
          {
            id: "dl12",
            title: "Flash Loans & Composability",
            description: "Atomic composability in DeFi",
            order: 11,
            type: "content",
            xpReward: 60,
            duration: "20 min",
            content:
              "# Flash Loans & Composability\n\n## Flash Loans\n\nBorrow any amount with zero collateral — if you repay in the same transaction.\n\n### How It Works\n\n```\nSingle Transaction:\n1. Borrow 1,000,000 USDC (flash loan)\n2. Swap 500,000 USDC → SOL on Raydium\n3. Swap SOL → USDC on Orca (arbitrage)\n4. Repay 1,000,000 USDC + fee\n5. Keep the profit\n\nIf step 4 fails → entire transaction reverts\n```\n\n### Use Cases\n- **Arbitrage**: Exploit price differences between DEXes\n- **Liquidations**: Borrow to repay debt, receive collateral\n- **Collateral swaps**: Switch collateral type without closing position\n- **Self-liquidation**: Close your own underwater position\n\n## DeFi Composability\n\nSolana's atomic transactions enable complex multi-protocol interactions:\n\n```\nSingle Transaction:\n1. Deposit SOL into Marinade → receive mSOL\n2. Deposit mSOL as collateral on Kamino\n3. Borrow USDC against mSOL\n4. Add USDC to lending pool for yield\n```\n\n## CPI Chains on Solana\n\nPrograms call each other via Cross-Program Invocations:\n\n```rust\n// Program A calls Program B\nlet cpi_ctx = CpiContext::new(\n    program_b.to_account_info(),\n    ProgramBAccounts { ... },\n);\nprogram_b::deposit(cpi_ctx, amount)?;\n```\n\n## Risks of Composability\n\n- **Cascading failures**: Bug in one protocol affects all composing protocols\n- **Oracle manipulation**: Flash-loan funded price manipulation\n- **Re-entrancy**: Calling back into the calling program\n- **Account state**: Accounts may change between CPIs",
          },
        ],
      },
      {
        id: "dm5",
        title: "Building DeFi Programs",
        description: "Implementing DeFi primitives on Solana",
        order: 4,
        lessons: [
          {
            id: "dl13",
            title: "Token Swap Program Design",
            description: "Architecture of a swap program",
            order: 12,
            type: "content",
            xpReward: 70,
            duration: "25 min",
            content:
              "# Token Swap Program Design\n\nBuilding a simple AMM swap program on Solana.\n\n## Account Structure\n\n```rust\n#[account]\npub struct Pool {\n    pub authority: Pubkey,        // Pool authority (PDA)\n    pub token_a_mint: Pubkey,     // Mint for token A\n    pub token_b_mint: Pubkey,     // Mint for token B\n    pub token_a_vault: Pubkey,    // Pool's token A account\n    pub token_b_vault: Pubkey,    // Pool's token B account\n    pub lp_mint: Pubkey,          // LP token mint\n    pub fee_rate: u16,            // Fee in basis points (30 = 0.3%)\n    pub bump: u8,\n}\n```\n\n## Instructions\n\n### 1. Initialize Pool\n```rust\npub fn initialize_pool(\n    ctx: Context<InitializePool>,\n    fee_rate: u16,\n) -> Result<()> {\n    // Create pool PDA\n    // Create token vaults owned by pool PDA\n    // Create LP mint with pool PDA as authority\n}\n```\n\n### 2. Add Liquidity\n```rust\npub fn add_liquidity(\n    ctx: Context<AddLiquidity>,\n    amount_a: u64,\n    amount_b: u64,\n    min_lp_tokens: u64,\n) -> Result<()> {\n    // Transfer tokens A and B from user to pool vaults\n    // Calculate LP tokens to mint\n    // Mint LP tokens to user\n}\n```\n\n### 3. Swap\n```rust\npub fn swap(\n    ctx: Context<Swap>,\n    amount_in: u64,\n    min_amount_out: u64,  // Slippage protection\n) -> Result<()> {\n    // Calculate output using x * y = k\n    // Apply fee\n    // Check min_amount_out (slippage)\n    // Transfer tokens\n}\n```\n\n## LP Token Math\n\n```\nFirst deposit:\n  lp_tokens = sqrt(amount_a * amount_b)\n\nSubsequent deposits:\n  lp_tokens = min(\n    amount_a * total_lp / reserve_a,\n    amount_b * total_lp / reserve_b\n  )\n```",
          },
          {
            id: "dl14",
            title: "Vault Pattern Implementation",
            description: "Building secure token vaults",
            order: 13,
            type: "content",
            xpReward: 70,
            duration: "25 min",
            content:
              "# Vault Pattern Implementation\n\nVaults are a core DeFi primitive — secure containers for user deposits with controlled access.\n\n## Basic Vault Structure\n\n```rust\n#[account]\npub struct Vault {\n    pub authority: Pubkey,       // Who controls the vault\n    pub token_mint: Pubkey,      // What token it holds\n    pub token_account: Pubkey,   // ATA holding the tokens\n    pub total_deposited: u64,    // Total tokens deposited\n    pub share_mint: Pubkey,      // Receipt token mint\n    pub total_shares: u64,       // Total shares outstanding\n    pub bump: u8,\n}\n```\n\n## Share-Based Accounting\n\nUsers receive shares proportional to their deposit:\n\n```\nDeposit:\n  shares = (deposit_amount * total_shares) / total_deposited\n  If first deposit: shares = deposit_amount\n\nWithdraw:\n  amount = (user_shares * total_deposited) / total_shares\n```\n\nAs the vault earns yield, `total_deposited` grows → shares become worth more.\n\n## Security Considerations\n\n### 1. Rounding Direction\n```rust\n// Always round DOWN for deposits (fewer shares)\nlet shares = deposit_amount\n    .checked_mul(total_shares).unwrap()\n    .checked_div(total_deposited).unwrap();\n\n// Always round DOWN for withdrawals (less tokens)\nlet amount = user_shares\n    .checked_mul(total_deposited).unwrap()\n    .checked_div(total_shares).unwrap();\n```\n\n### 2. First Depositor Attack\nPrevent share price manipulation:\n```rust\n// Require minimum initial deposit\nrequire!(initial_deposit >= MINIMUM_DEPOSIT, ErrorCode::DepositTooSmall);\n\n// Or: mint dead shares on initialization\nlet dead_shares = 1000;\ntotal_shares = dead_shares;\n```\n\n### 3. Direct Deposit Protection\n```rust\n// Use internal accounting, not vault.amount\n// Someone could send tokens directly to inflate share price\nrequire!(\n    vault.token_account.amount >= vault.total_deposited,\n    ErrorCode::VaultUnderflow\n);\n```",
          },
          {
            id: "dl15",
            title: "Build a Simple Swap",
            description: "Implement core swap logic for an AMM",
            order: 14,
            type: "challenge",
            xpReward: 165,
            duration: "40 min",
            challenge: {
              language: "typescript",
              prompt:
                "Implement the core logic for a simple token swap AMM including liquidity management and swaps.",
              starterCode:
                "// Simple AMM Implementation\n\ninterface PoolState {\n  reserveA: bigint;\n  reserveB: bigint;\n  totalLpShares: bigint;\n  feeRateBps: number; // basis points (30 = 0.3%)\n}\n\ninterface UserPosition {\n  lpShares: bigint;\n}\n\n// Initialize a new pool with first liquidity deposit\nfunction initializePool(\n  amountA: bigint,\n  amountB: bigint,\n  feeRateBps: number\n): { pool: PoolState; lpShares: bigint } {\n  // Calculate initial LP shares as sqrt(amountA * amountB)\n  // Return pool state and LP shares minted\n}\n\n// Add liquidity proportionally to the pool\nfunction addLiquidity(\n  pool: PoolState,\n  amountA: bigint,\n  amountB: bigint\n): { newPool: PoolState; lpShares: bigint } {\n  // Calculate LP shares based on proportion\n  // Update reserves\n}\n\n// Swap token A for token B\nfunction swapAForB(\n  pool: PoolState,\n  amountIn: bigint,\n  minAmountOut: bigint\n): { newPool: PoolState; amountOut: bigint } {\n  // Apply fee\n  // Calculate output using constant product\n  // Check slippage\n  // Return updated pool and output amount\n}\n\n// Remove liquidity by burning LP shares\nfunction removeLiquidity(\n  pool: PoolState,\n  sharesToBurn: bigint\n): { newPool: PoolState; amountA: bigint; amountB: bigint } {\n  // Calculate proportional amounts\n  // Update reserves and total shares\n}",
              solution:
                "interface PoolState {\n  reserveA: bigint;\n  reserveB: bigint;\n  totalLpShares: bigint;\n  feeRateBps: number;\n}\n\ninterface UserPosition {\n  lpShares: bigint;\n}\n\nfunction sqrt(n: bigint): bigint {\n  if (n < 0n) throw new Error('negative');\n  if (n === 0n) return 0n;\n  let x = n;\n  let y = (x + 1n) / 2n;\n  while (y < x) {\n    x = y;\n    y = (x + n / x) / 2n;\n  }\n  return x;\n}\n\nfunction initializePool(\n  amountA: bigint,\n  amountB: bigint,\n  feeRateBps: number\n): { pool: PoolState; lpShares: bigint } {\n  const lpShares = sqrt(amountA * amountB);\n  return {\n    pool: {\n      reserveA: amountA,\n      reserveB: amountB,\n      totalLpShares: lpShares,\n      feeRateBps,\n    },\n    lpShares,\n  };\n}\n\nfunction addLiquidity(\n  pool: PoolState,\n  amountA: bigint,\n  amountB: bigint\n): { newPool: PoolState; lpShares: bigint } {\n  const sharesFromA = (amountA * pool.totalLpShares) / pool.reserveA;\n  const sharesFromB = (amountB * pool.totalLpShares) / pool.reserveB;\n  const lpShares = sharesFromA < sharesFromB ? sharesFromA : sharesFromB;\n  return {\n    newPool: {\n      ...pool,\n      reserveA: pool.reserveA + amountA,\n      reserveB: pool.reserveB + amountB,\n      totalLpShares: pool.totalLpShares + lpShares,\n    },\n    lpShares,\n  };\n}\n\nfunction swapAForB(\n  pool: PoolState,\n  amountIn: bigint,\n  minAmountOut: bigint\n): { newPool: PoolState; amountOut: bigint } {\n  const feeAmount = (amountIn * BigInt(pool.feeRateBps)) / 10000n;\n  const amountInAfterFee = amountIn - feeAmount;\n  const k = pool.reserveA * pool.reserveB;\n  const newReserveA = pool.reserveA + amountInAfterFee;\n  const newReserveB = k / newReserveA;\n  const amountOut = pool.reserveB - newReserveB;\n  if (amountOut < minAmountOut) throw new Error('Slippage exceeded');\n  return {\n    newPool: {\n      ...pool,\n      reserveA: pool.reserveA + amountIn,\n      reserveB: pool.reserveB - amountOut,\n    },\n    amountOut,\n  };\n}\n\nfunction removeLiquidity(\n  pool: PoolState,\n  sharesToBurn: bigint\n): { newPool: PoolState; amountA: bigint; amountB: bigint } {\n  const amountA = (sharesToBurn * pool.reserveA) / pool.totalLpShares;\n  const amountB = (sharesToBurn * pool.reserveB) / pool.totalLpShares;\n  return {\n    newPool: {\n      ...pool,\n      reserveA: pool.reserveA - amountA,\n      reserveB: pool.reserveB - amountB,\n      totalLpShares: pool.totalLpShares - sharesToBurn,\n    },\n    amountA,\n    amountB,\n  };\n}",
              testCases: [
                {
                  id: "t1",
                  name: "Initialize pool",
                  input: "1000n, 100000n",
                  expectedOutput: "sqrt(100000000) shares",
                },
                {
                  id: "t2",
                  name: "Swap with fee",
                  input: "10n into 1000/100000 pool",
                  expectedOutput: "~909 tokens",
                },
                {
                  id: "t3",
                  name: "Slippage protection",
                  input: "minAmountOut too high",
                  expectedOutput: "throws error",
                },
                {
                  id: "t4",
                  name: "Remove liquidity",
                  input: "10% of shares",
                  expectedOutput: "10% of reserves",
                },
              ],
              hints: [
                "Use bigint for all arithmetic to avoid floating-point issues",
                "Initial LP shares = sqrt(amountA * amountB)",
                "For swap: apply fee first, then use k = reserveA * reserveB",
                "For slippage: check amountOut >= minAmountOut before updating state",
              ],
            },
          },
        ],
      },
    ],
  }),
  buildCourse({
    id: "program-security",
    slug: "program-security",
    title: "Solana Program Security",
    description:
      "Learn to identify and prevent common vulnerabilities in Solana programs. Covers account validation, arithmetic safety, and re-entrancy.",
    thumbnail: "/courses/program-security.png",
    creator: "Superteam Academy",
    difficulty: "advanced",
    xpTotal: 2000,
    trackId: 4,
    trackLevel: 1,
    duration: "10 hours",
    prerequisiteId: "anchor-beginner",
    isActive: true,
    createdAt: "2025-05-01T00:00:00Z",
    modules: [
      {
        id: "sm1",
        title: "Common Vulnerabilities",
        description: "Top security issues",
        order: 0,
        lessons: [
          {
            id: "sl1",
            title: "Missing Account Validation",
            description: "The #1 vulnerability",
            order: 0,
            type: "content",
            xpReward: 60,
            duration: "30 min",
            content:
              "# Missing Account Validation\n\nMissing account validation is the #1 vulnerability in Solana programs. It allows attackers to pass arbitrary accounts and manipulate program behavior.\n\n## Why Accounts Must Be Validated\n\nSolana programs receive accounts as raw `AccountInfo` structs. The runtime does NOT verify that the accounts are the ones your program expects — that's your responsibility.\n\n## Attack Scenario\n\n```rust\n// VULNERABLE: No validation on withdraw\npub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {\n    let vault = &mut ctx.accounts.vault;\n    **vault.to_account_info().try_borrow_mut_lamports()? -= amount;\n    **ctx.accounts.recipient.try_borrow_mut_lamports()? += amount;\n    Ok(())\n}\n\n#[derive(Accounts)]\npub struct Withdraw<'info> {\n    #[account(mut)]\n    pub vault: Account<'info, Vault>,\n    /// CHECK: No validation!\n    pub authority: AccountInfo<'info>,\n    #[account(mut)]\n    pub recipient: SystemAccount<'info>,\n}\n```\n\n**Attack**: Anyone can call `withdraw` and pass their own wallet as `authority` — there's no check that `authority` is the vault's real owner or even a signer.\n\n## The Five Validation Checks\n\n### 1. Signer Check\nIs this account actually signing the transaction?\n```rust\n// BAD\n/// CHECK: unchecked\npub authority: AccountInfo<'info>,\n\n// GOOD\npub authority: Signer<'info>,\n```\n\n### 2. Owner Check\nIs this account owned by the expected program?\n```rust\n// BAD: Attacker creates fake account with matching data layout\n/// CHECK: unchecked\npub profile: AccountInfo<'info>,\n\n// GOOD: Account<T> checks owner == your program + discriminator\npub profile: Account<'info, LearnerProfile>,\n```\n\n### 3. PDA Derivation Check\nIs this the correct PDA for the given seeds?\n```rust\n// BAD: Could be ANY vault account\n#[account(mut)]\npub vault: Account<'info, Vault>,\n\n// GOOD: Must be the vault derived from these specific seeds\n#[account(mut, seeds = [b\"vault\", user.key().as_ref()], bump = vault.bump)]\npub vault: Account<'info, Vault>,\n```\n\n### 4. Relationship Check\nDo the accounts relate to each other correctly?\n```rust\n// BAD: vault.authority could be anyone\n#[account(mut)]\npub vault: Account<'info, Vault>,\n\n// GOOD: vault.authority must equal the authority account\n#[account(mut, has_one = authority)]\npub vault: Account<'info, Vault>,\npub authority: Signer<'info>,\n```\n\n### 5. Program Check\nIs the program account actually the program we expect?\n```rust\n// BAD: Could be a malicious program\n/// CHECK: token program\npub token_program: AccountInfo<'info>,\n\n// GOOD: Must be the real Token program\npub token_program: Program<'info, Token>,\n```\n\n## Complete Secure Example\n\n```rust\n#[derive(Accounts)]\npub struct Withdraw<'info> {\n    #[account(\n        mut,\n        seeds = [b\"vault\", authority.key().as_ref()],\n        bump = vault.bump,\n        has_one = authority,\n    )]\n    pub vault: Account<'info, Vault>,\n    pub authority: Signer<'info>,\n    #[account(mut)]\n    pub recipient: SystemAccount<'info>,\n}\n```\n\nThis validates: owner (Account<T>), PDA derivation (seeds+bump), relationship (has_one), and signer (Signer<T>).",
          },
          {
            id: "sl2",
            title: "Arithmetic Overflow",
            description: "Safe math practices",
            order: 1,
            type: "content",
            xpReward: 60,
            duration: "25 min",
            content:
              "# Arithmetic Safety\n\nInteger overflow and underflow are silent killers in Solana programs. Rust integers wrap on overflow in release mode, which can corrupt state and drain funds.\n\n## The Problem: Wrapping Behavior\n\nIn release builds (how programs run on-chain), Rust integers wrap:\n```rust\nlet a: u64 = u64::MAX;  // 18,446,744,073,709,551,615\nlet b: u64 = a + 1;     // Wraps to 0 in release mode!\n\nlet c: u64 = 0;\nlet d: u64 = c - 1;     // Wraps to u64::MAX!\n```\n\n## Real Attack Example\n\n```rust\n// VULNERABLE: Attacker can underflow balance\npub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {\n    let vault = &mut ctx.accounts.vault;\n    vault.balance -= amount;  // If amount > balance, wraps to huge number!\n    // Transfer amount SOL to user...\n    Ok(())\n}\n```\n\nIf `vault.balance = 100` and attacker passes `amount = 200`:\n- `100 - 200` wraps to `18,446,744,073,709,551,516`\n- Vault now thinks it has near-infinite balance\n\n## Checked Arithmetic Methods\n\nReturn `None` on overflow/underflow instead of wrapping:\n\n```rust\n// Addition\nlet total = amount_a.checked_add(amount_b)\n    .ok_or(ErrorCode::ArithmeticOverflow)?;\n\n// Subtraction\nlet remaining = balance.checked_sub(withdrawal)\n    .ok_or(ErrorCode::InsufficientBalance)?;\n\n// Multiplication\nlet cost = price.checked_mul(quantity)\n    .ok_or(ErrorCode::ArithmeticOverflow)?;\n\n// Division (returns None on divide by zero)\nlet share = total.checked_div(num_holders)\n    .ok_or(ErrorCode::DivisionByZero)?;\n```\n\n## All Checked Methods\n\n| Method | Operation | Fails When |\n|--------|-----------|------------|\n| `checked_add` | a + b | Result > MAX |\n| `checked_sub` | a - b | Result < 0 (unsigned) |\n| `checked_mul` | a * b | Result > MAX |\n| `checked_div` | a / b | b == 0 |\n| `checked_rem` | a % b | b == 0 |\n| `checked_pow` | a^b | Result > MAX |\n| `checked_shl` | a << b | b >= bit width |\n| `checked_shr` | a >> b | b >= bit width |\n\n## Saturating Arithmetic\n\nClamps to MIN/MAX instead of failing — useful for non-critical counters:\n```rust\nlet new_streak = streak.saturating_add(1);     // Caps at u16::MAX\nlet remaining = supply.saturating_sub(burned);  // Floors at 0\n```\n\n## Casting Safety\n\nCasting between integer sizes can also truncate silently:\n```rust\n// BAD: Truncates if value > 255\nlet small: u8 = large_number as u8;\n\n// GOOD: Returns error if value doesn't fit\nlet small: u8 = u8::try_from(large_number)\n    .map_err(|_| ErrorCode::CastOverflow)?;\n```\n\n## Rules for Solana Programs\n\n1. **Never use `+`, `-`, `*`, `/`** on user-influenced values\n2. **Always use `checked_*`** methods for financial calculations\n3. **Use `saturating_*`** only for non-critical values (counters, display)\n4. **Validate inputs** before arithmetic (reject 0 denominators early)\n5. **Use `u128`** for intermediate calculations that might overflow `u64`:\n```rust\nlet result = (amount as u128)\n    .checked_mul(price as u128).unwrap()\n    .checked_div(PRECISION as u128).unwrap() as u64;\n```",
          },
        ],
      },
      {
        id: "sm2",
        title: "Access Control",
        description: "Authorization and permission vulnerabilities",
        order: 1,
        lessons: [
          {
            id: "sl3",
            title: "Signer Verification",
            description: "Ensuring proper authorization",
            order: 2,
            type: "content",
            xpReward: 80,
            duration: "25 min",
            content:
              "# Signer Verification\n\nEvery state-changing instruction must verify that the right entity authorized it.\n\n## The Vulnerability\n\n```rust\n// BAD: No signer check\npub fn transfer_funds(ctx: Context<Transfer>, amount: u64) -> Result<()> {\n    let vault = &mut ctx.accounts.vault;\n    // Anyone can call this and drain the vault!\n    **vault.to_account_info().try_borrow_mut_lamports()? -= amount;\n    **ctx.accounts.recipient.try_borrow_mut_lamports()? += amount;\n    Ok(())\n}\n\n#[derive(Accounts)]\npub struct Transfer<'info> {\n    #[account(mut)]\n    pub vault: Account<'info, Vault>,\n    /// CHECK: Not validated!\n    pub authority: AccountInfo<'info>,\n    #[account(mut)]\n    pub recipient: SystemAccount<'info>,\n}\n```\n\n## The Fix\n\n```rust\n#[derive(Accounts)]\npub struct Transfer<'info> {\n    #[account(mut, has_one = authority)]\n    pub vault: Account<'info, Vault>,\n    pub authority: Signer<'info>,  // Must be a signer\n    #[account(mut)]\n    pub recipient: SystemAccount<'info>,\n}\n```\n\n## Multi-Signer Patterns\n\n```rust\n// Require both admin AND operator to sign\n#[derive(Accounts)]\npub struct CriticalOperation<'info> {\n    #[account(has_one = admin, has_one = operator)]\n    pub config: Account<'info, Config>,\n    pub admin: Signer<'info>,\n    pub operator: Signer<'info>,\n}\n```\n\n## Native Program Check\n\n```rust\n// Without Anchor:\nif !authority.is_signer {\n    return Err(ProgramError::MissingRequiredSignature);\n}\n```",
          },
          {
            id: "sl4",
            title: "Owner & PDA Validation",
            description: "Verifying account ownership and PDA derivation",
            order: 3,
            type: "content",
            xpReward: 90,
            duration: "30 min",
            content:
              "# Owner & PDA Validation\n\n## Owner Check\n\nEvery account on Solana has an owner program. Failing to verify ownership lets attackers pass fake accounts.\n\n### The Vulnerability\n\n```rust\n// BAD: No owner check\npub fn claim_reward(ctx: Context<Claim>) -> Result<()> {\n    // Attacker creates a fake account with matching data layout\n    // but owned by a different program\n    let profile = &ctx.accounts.profile;\n    let xp = profile.xp; // Reading attacker-controlled data!\n}\n\n#[derive(Accounts)]\npub struct Claim<'info> {\n    /// CHECK: Not validated — attacker can pass any account!\n    pub profile: AccountInfo<'info>,\n}\n```\n\n### The Fix\n\n```rust\n#[derive(Accounts)]\npub struct Claim<'info> {\n    // Account<'info, T> automatically verifies:\n    // 1. Owner is this program\n    // 2. Discriminator matches T\n    pub profile: Account<'info, LearnerProfile>,\n}\n```\n\n## PDA Validation\n\nPDAs must be verified to prevent substitution attacks.\n\n### The Vulnerability\n\n```rust\n// BAD: Not verifying PDA derivation\n#[derive(Accounts)]\npub struct Withdraw<'info> {\n    #[account(mut)]\n    pub vault: Account<'info, Vault>,\n    pub user: Signer<'info>,\n}\n// Attacker passes someone else's vault PDA!\n```\n\n### The Fix\n\n```rust\n#[derive(Accounts)]\npub struct Withdraw<'info> {\n    #[account(\n        mut,\n        seeds = [b\"vault\", user.key().as_ref()],\n        bump = vault.bump,\n    )]\n    pub vault: Account<'info, Vault>,\n    pub user: Signer<'info>,\n}\n```\n\n## Stored vs Recalculated Bumps\n\n```rust\n// GOOD: Use stored bump (faster, no recalculation)\n#[account(seeds = [...], bump = account.bump)]\n\n// BAD: Recalculate bump every time (wastes CU)\n#[account(seeds = [...], bump)]\n// This works but costs ~1500 CU extra per find_program_address\n```",
          },
          {
            id: "sl5",
            title: "Privilege Escalation",
            description: "Preventing unauthorized role upgrades",
            order: 4,
            type: "content",
            xpReward: 80,
            duration: "25 min",
            content:
              "# Privilege Escalation\n\nAttackers try to gain higher permissions than intended.\n\n## Config Authority Spoofing\n\n```rust\n// BAD: Only checks config exists, not who the authority is\npub fn admin_action(ctx: Context<AdminAction>) -> Result<()> {\n    // Attacker creates their own Config account\n    // with themselves as authority\n}\n\n#[derive(Accounts)]\npub struct AdminAction<'info> {\n    pub config: Account<'info, Config>,\n    pub authority: Signer<'info>,\n}\n```\n\n### Fix: Verify Config is the canonical PDA\n\n```rust\n#[derive(Accounts)]\npub struct AdminAction<'info> {\n    #[account(\n        seeds = [b\"config\"],\n        bump = config.bump,\n        has_one = authority,\n    )]\n    pub config: Account<'info, Config>,\n    pub authority: Signer<'info>,\n}\n```\n\n## Role-Based Access Patterns\n\n```rust\n#[account]\npub struct Config {\n    pub super_admin: Pubkey,     // Can change anything\n    pub backend_signer: Pubkey,  // Can verify completions\n    pub operator: Pubkey,        // Can create courses\n    pub bump: u8,\n}\n\n// Only super_admin can update roles\npub fn update_operator(\n    ctx: Context<UpdateOperator>,\n    new_operator: Pubkey,\n) -> Result<()> {\n    require_keys_eq!(\n        ctx.accounts.authority.key(),\n        ctx.accounts.config.super_admin,\n        ErrorCode::Unauthorized\n    );\n    ctx.accounts.config.operator = new_operator;\n    Ok(())\n}\n```\n\n## Key Rotation Safety\n\nWhen rotating keys, always verify the current authority:\n```rust\npub fn rotate_backend_signer(\n    ctx: Context<RotateKey>,\n    new_signer: Pubkey,\n) -> Result<()> {\n    let config = &mut ctx.accounts.config;\n    // Anchor's has_one already verified authority\n    config.backend_signer = new_signer;\n    emit!(BackendSignerRotated { new_signer });\n    Ok(())\n}\n```",
          },
          {
            id: "sl6",
            title: "Access Control Challenge",
            description: "Find and fix access control vulnerabilities",
            order: 5,
            type: "challenge",
            xpReward: 140,
            duration: "35 min",
            challenge: {
              language: "rust",
              prompt:
                "Find and fix all access control vulnerabilities in this vault program.",
              starterCode:
                "use anchor_lang::prelude::*;\n\ndeclare_id!(\"11111111111111111111111111111111\");\n\n#[program]\npub mod vulnerable_vault {\n    use super::*;\n\n    // BUG 1: Anyone can initialize and become authority\n    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {\n        let vault = &mut ctx.accounts.vault;\n        vault.authority = ctx.accounts.authority.key();\n        vault.balance = 0;\n        Ok(())\n    }\n\n    // BUG 2: Missing signer check on authority\n    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {\n        let vault = &mut ctx.accounts.vault;\n        vault.balance += amount;\n        Ok(())\n    }\n\n    // BUG 3: No authority verification\n    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {\n        let vault = &mut ctx.accounts.vault;\n        vault.balance -= amount;\n        Ok(())\n    }\n\n    // BUG 4: Authority can be changed by anyone\n    pub fn change_authority(ctx: Context<ChangeAuth>, new_auth: Pubkey) -> Result<()> {\n        let vault = &mut ctx.accounts.vault;\n        vault.authority = new_auth;\n        Ok(())\n    }\n}\n\n#[derive(Accounts)]\npub struct Initialize<'info> {\n    #[account(init, payer = authority, space = 8 + Vault::INIT_SPACE)]\n    pub vault: Account<'info, Vault>,\n    #[account(mut)]\n    pub authority: Signer<'info>,\n    pub system_program: Program<'info, System>,\n}\n\n#[derive(Accounts)]\npub struct Deposit<'info> {\n    #[account(mut)]\n    pub vault: Account<'info, Vault>,\n    /// CHECK: not validated\n    pub authority: AccountInfo<'info>,\n}\n\n#[derive(Accounts)]\npub struct Withdraw<'info> {\n    #[account(mut)]\n    pub vault: Account<'info, Vault>,\n    /// CHECK: not validated\n    pub authority: AccountInfo<'info>,\n}\n\n#[derive(Accounts)]\npub struct ChangeAuth<'info> {\n    #[account(mut)]\n    pub vault: Account<'info, Vault>,\n    /// CHECK: not validated\n    pub authority: AccountInfo<'info>,\n}\n\n#[account]\n#[derive(InitSpace)]\npub struct Vault {\n    pub authority: Pubkey,\n    pub balance: u64,\n    pub bump: u8,\n}",
              solution:
                "use anchor_lang::prelude::*;\n\ndeclare_id!(\"11111111111111111111111111111111\");\n\n#[program]\npub mod secure_vault {\n    use super::*;\n\n    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {\n        let vault = &mut ctx.accounts.vault;\n        vault.authority = ctx.accounts.authority.key();\n        vault.balance = 0;\n        vault.bump = ctx.bumps.vault;\n        Ok(())\n    }\n\n    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {\n        let vault = &mut ctx.accounts.vault;\n        vault.balance = vault.balance.checked_add(amount)\n            .ok_or(ErrorCode::ArithmeticOverflow)?;\n        Ok(())\n    }\n\n    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {\n        let vault = &mut ctx.accounts.vault;\n        require!(vault.balance >= amount, ErrorCode::InsufficientBalance);\n        vault.balance = vault.balance.checked_sub(amount)\n            .ok_or(ErrorCode::ArithmeticOverflow)?;\n        Ok(())\n    }\n\n    pub fn change_authority(ctx: Context<ChangeAuth>, new_auth: Pubkey) -> Result<()> {\n        let vault = &mut ctx.accounts.vault;\n        vault.authority = new_auth;\n        Ok(())\n    }\n}\n\n#[derive(Accounts)]\npub struct Initialize<'info> {\n    #[account(\n        init,\n        seeds = [b\"vault\", authority.key().as_ref()],\n        bump,\n        payer = authority,\n        space = 8 + Vault::INIT_SPACE,\n    )]\n    pub vault: Account<'info, Vault>,\n    #[account(mut)]\n    pub authority: Signer<'info>,\n    pub system_program: Program<'info, System>,\n}\n\n#[derive(Accounts)]\npub struct Deposit<'info> {\n    #[account(mut, has_one = authority)]\n    pub vault: Account<'info, Vault>,\n    pub authority: Signer<'info>,\n}\n\n#[derive(Accounts)]\npub struct Withdraw<'info> {\n    #[account(\n        mut,\n        has_one = authority,\n        seeds = [b\"vault\", authority.key().as_ref()],\n        bump = vault.bump,\n    )]\n    pub vault: Account<'info, Vault>,\n    pub authority: Signer<'info>,\n}\n\n#[derive(Accounts)]\npub struct ChangeAuth<'info> {\n    #[account(mut, has_one = authority)]\n    pub vault: Account<'info, Vault>,\n    pub authority: Signer<'info>,\n}\n\n#[account]\n#[derive(InitSpace)]\npub struct Vault {\n    pub authority: Pubkey,\n    pub balance: u64,\n    pub bump: u8,\n}\n\n#[error_code]\npub enum ErrorCode {\n    #[msg(\"Arithmetic overflow\")]\n    ArithmeticOverflow,\n    #[msg(\"Insufficient balance\")]\n    InsufficientBalance,\n}",
              testCases: [
                {
                  id: "t1",
                  name: "PDA-based vault",
                  input: "init",
                  expectedOutput: "uses seeds",
                },
                {
                  id: "t2",
                  name: "Signer checks on all ops",
                  input: "all instructions",
                  expectedOutput: "Signer type",
                },
                {
                  id: "t3",
                  name: "has_one constraint",
                  input: "all mutations",
                  expectedOutput: "has_one = authority",
                },
                {
                  id: "t4",
                  name: "Checked arithmetic",
                  input: "deposit/withdraw",
                  expectedOutput: "checked_add/sub",
                },
              ],
              hints: [
                'Make vault a PDA with seeds [b"vault", authority]',
                "Change AccountInfo to Signer for authority in all structs",
                "Add has_one = authority to verify ownership",
                "Use checked arithmetic for balance operations",
              ],
            },
          },
        ],
      },
      {
        id: "sm3",
        title: "CPI Safety",
        description: "Cross-Program Invocation vulnerabilities",
        order: 2,
        lessons: [
          {
            id: "sl7",
            title: "Re-entrancy Attacks",
            description: "When programs call back into themselves",
            order: 6,
            type: "content",
            xpReward: 90,
            duration: "30 min",
            content:
              "# Re-entrancy Attacks\n\nRe-entrancy occurs when a program's CPI allows the called program to call back into the original program before it finishes updating state.\n\n## The Classic Pattern\n\n```\n1. Program A: Read balance (1000)\n2. Program A: CPI to Program B (transfer 1000)\n3. Program B: Calls back into Program A\n4. Program A: Read balance (still 1000 — not yet updated!)\n5. Program A: CPI to Program B (transfer 1000 again)\n6. Program A: Update balance to 0\n```\n\nResult: 2000 transferred when only 1000 existed.\n\n## Solana's Built-in Protection\n\nSolana's runtime prevents direct re-entrancy:\n- A program **cannot CPI into itself**\n- Accounts locked for writing during CPI\n\nBut indirect re-entrancy is still possible:\n```\nProgram A → Program B → Program C → Program A (blocked)\nProgram A → Program B → reads stale state of A's accounts\n```\n\n## The Real Danger: Stale State After CPI\n\n```rust\n// BAD: Reading state before CPI, using it after\npub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {\n    let vault = &ctx.accounts.vault;\n    let balance_before = vault.balance; // Read BEFORE CPI\n\n    // CPI that might modify vault externally\n    transfer_cpi(ctx, amount)?;\n\n    // vault.balance might be stale now!\n    let vault = &mut ctx.accounts.vault;\n    vault.balance = balance_before - amount; // Using stale value!\n    Ok(())\n}\n```\n\n## The Fix: Check-Effects-Interactions\n\n```rust\npub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {\n    // 1. CHECK: Validate\n    let vault = &mut ctx.accounts.vault;\n    require!(vault.balance >= amount, ErrorCode::InsufficientBalance);\n\n    // 2. EFFECTS: Update state BEFORE CPI\n    vault.balance = vault.balance.checked_sub(amount).unwrap();\n\n    // 3. INTERACTIONS: CPI after state is updated\n    transfer_cpi(ctx, amount)?;\n    Ok(())\n}\n```",
          },
          {
            id: "sl8",
            title: "Reload After CPI",
            description: "Refreshing account state after cross-program calls",
            order: 7,
            type: "content",
            xpReward: 80,
            duration: "25 min",
            content:
              "# Reload After CPI\n\nAfter a CPI, account data in your local variables may be stale.\n\n## The Problem\n\n```rust\npub fn process(ctx: Context<Process>) -> Result<()> {\n    let token_account = &ctx.accounts.token_account;\n    let balance_before = token_account.amount; // Cached value\n\n    // CPI: Transfer tokens into this account\n    token::transfer(cpi_ctx, deposit_amount)?;\n\n    // token_account.amount is STALE — still shows old balance\n    let balance_after = token_account.amount;\n    // balance_after == balance_before (wrong!)\n}\n```\n\n## The Fix: Reload\n\n```rust\npub fn process(ctx: Context<Process>) -> Result<()> {\n    let token_account = &ctx.accounts.token_account;\n\n    // CPI: Transfer tokens\n    token::transfer(cpi_ctx, deposit_amount)?;\n\n    // Reload the account data from the runtime\n    ctx.accounts.token_account.reload()?;\n\n    // Now amount is accurate\n    let balance_after = ctx.accounts.token_account.amount;\n}\n```\n\n## When to Reload\n\n| Scenario | Need Reload? |\n|----------|--------------|\n| Read account, then CPI modifies it | Yes |\n| CPI doesn't touch the account | No |\n| Only reading after all CPIs | No |\n| Multiple CPIs modifying same account | Reload between each |\n\n## Lamport Balance Reload\n\nFor SOL balance changes:\n```rust\n// After CPI that transfers SOL\nlet updated_lamports = ctx.accounts.vault.to_account_info().lamports();\n```\n\nLamports are always fresh via `to_account_info().lamports()` since they're stored in the AccountInfo, not in the deserialized struct.",
          },
          {
            id: "sl9",
            title: "CPI Target Validation",
            description: "Verifying the program you're calling",
            order: 8,
            type: "content",
            xpReward: 80,
            duration: "25 min",
            content:
              "# CPI Target Validation\n\nAlways verify you're calling the correct program. An attacker could substitute a malicious program.\n\n## The Vulnerability\n\n```rust\n#[derive(Accounts)]\npub struct MintReward<'info> {\n    // BAD: No program ID check\n    /// CHECK: Token program\n    pub token_program: AccountInfo<'info>,\n    #[account(mut)]\n    pub mint: AccountInfo<'info>,\n    #[account(mut)]\n    pub recipient: AccountInfo<'info>,\n}\n\npub fn mint_reward(ctx: Context<MintReward>, amount: u64) -> Result<()> {\n    // Attacker passes their own program as token_program\n    // That program could do anything!\n    invoke(\n        &spl_token::instruction::mint_to(...),\n        &[...],\n    )?;\n    Ok(())\n}\n```\n\n## The Fix: Program Type Validation\n\n```rust\n#[derive(Accounts)]\npub struct MintReward<'info> {\n    // Anchor validates this IS the token program\n    pub token_program: Program<'info, Token>,\n    #[account(mut)]\n    pub mint: Account<'info, Mint>,\n    #[account(mut)]\n    pub recipient: Account<'info, TokenAccount>,\n}\n```\n\n## Native Program Verification\n\n```rust\n// Without Anchor — manually check program ID\nif *token_program.key != spl_token::ID {\n    return Err(ProgramError::IncorrectProgramId);\n}\n```\n\n## System Program Substitution\n\n```rust\n// BAD: Not verifying system program\npub system_program: AccountInfo<'info>,\n\n// GOOD: Typed validation\npub system_program: Program<'info, System>,\n```\n\n## Common CPI Targets to Validate\n\n| Program | Expected ID |\n|---------|------------|\n| System Program | `11111111111111111111111111111111` |\n| Token Program | `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA` |\n| Token-2022 | `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb` |\n| Associated Token | `ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL` |\n| Memo Program | `MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr` |",
          },
          {
            id: "sl10",
            title: "CPI Safety Challenge",
            description: "Identify and fix CPI vulnerabilities",
            order: 9,
            type: "challenge",
            xpReward: 140,
            duration: "35 min",
            challenge: {
              language: "rust",
              prompt: "Fix all CPI safety issues in this token reward program.",
              starterCode:
                "use anchor_lang::prelude::*;\nuse anchor_spl::token::{self, Token, Mint, TokenAccount, MintTo};\n\n#[program]\npub mod vulnerable_rewards {\n    use super::*;\n\n    pub fn claim_reward(ctx: Context<ClaimReward>, amount: u64) -> Result<()> {\n        // BUG 1: State not updated before CPI\n        let cpi_ctx = CpiContext::new_with_signer(\n            ctx.accounts.token_program.to_account_info(),\n            MintTo {\n                mint: ctx.accounts.reward_mint.to_account_info(),\n                to: ctx.accounts.user_token_account.to_account_info(),\n                authority: ctx.accounts.config.to_account_info(),\n            },\n            &[&[b\"config\", &[ctx.accounts.config.bump]]],\n        );\n        token::mint_to(cpi_ctx, amount)?;\n\n        // BUG 2: Using potentially stale data after CPI\n        let profile = &mut ctx.accounts.profile;\n        profile.total_claimed += amount;\n\n        // BUG 3: No cap check\n        Ok(())\n    }\n}\n\n#[derive(Accounts)]\npub struct ClaimReward<'info> {\n    #[account(seeds = [b\"config\"], bump = config.bump)]\n    pub config: Account<'info, Config>,\n    #[account(mut)]\n    pub profile: Account<'info, Profile>,\n    #[account(mut)]\n    pub reward_mint: Account<'info, Mint>,\n    #[account(mut)]\n    pub user_token_account: Account<'info, TokenAccount>,\n    pub user: Signer<'info>,\n    // BUG 4: Missing program validation\n    /// CHECK: token program\n    pub token_program: AccountInfo<'info>,\n}\n\n#[account]\npub struct Config {\n    pub authority: Pubkey,\n    pub reward_mint: Pubkey,\n    pub daily_cap: u64,\n    pub bump: u8,\n}\n\n#[account]\npub struct Profile {\n    pub user: Pubkey,\n    pub total_claimed: u64,\n    pub last_claim_day: u64,\n    pub daily_claimed: u64,\n}",
              solution:
                'use anchor_lang::prelude::*;\nuse anchor_spl::token::{self, Token, Mint, TokenAccount, MintTo};\n\n#[program]\npub mod secure_rewards {\n    use super::*;\n\n    pub fn claim_reward(ctx: Context<ClaimReward>, amount: u64) -> Result<()> {\n        let profile = &mut ctx.accounts.profile;\n        let config = &ctx.accounts.config;\n        let clock = Clock::get()?;\n        let current_day = (clock.unix_timestamp / 86400) as u64;\n\n        // Reset daily counter if new day\n        if current_day > profile.last_claim_day {\n            profile.daily_claimed = 0;\n            profile.last_claim_day = current_day;\n        }\n\n        // Check daily cap BEFORE CPI\n        let new_daily = profile.daily_claimed.checked_add(amount)\n            .ok_or(ErrorCode::ArithmeticOverflow)?;\n        require!(new_daily <= config.daily_cap, ErrorCode::DailyCapExceeded);\n\n        // Update state BEFORE CPI (Check-Effects-Interactions)\n        profile.daily_claimed = new_daily;\n        profile.total_claimed = profile.total_claimed.checked_add(amount)\n            .ok_or(ErrorCode::ArithmeticOverflow)?;\n\n        // CPI after state update\n        let cpi_ctx = CpiContext::new_with_signer(\n            ctx.accounts.token_program.to_account_info(),\n            MintTo {\n                mint: ctx.accounts.reward_mint.to_account_info(),\n                to: ctx.accounts.user_token_account.to_account_info(),\n                authority: ctx.accounts.config.to_account_info(),\n            },\n            &[&[b"config", &[config.bump]]],\n        );\n        token::mint_to(cpi_ctx, amount)?;\n\n        Ok(())\n    }\n}\n\n#[derive(Accounts)]\npub struct ClaimReward<\'info> {\n    #[account(\n        seeds = [b"config"],\n        bump = config.bump,\n        has_one = reward_mint,\n    )]\n    pub config: Account<\'info, Config>,\n    #[account(\n        mut,\n        seeds = [b"profile", user.key().as_ref()],\n        bump,\n        has_one = user,\n    )]\n    pub profile: Account<\'info, Profile>,\n    #[account(mut)]\n    pub reward_mint: Account<\'info, Mint>,\n    #[account(mut, token::mint = reward_mint, token::authority = user)]\n    pub user_token_account: Account<\'info, TokenAccount>,\n    pub user: Signer<\'info>,\n    pub token_program: Program<\'info, Token>,\n}\n\n#[account]\npub struct Config {\n    pub authority: Pubkey,\n    pub reward_mint: Pubkey,\n    pub daily_cap: u64,\n    pub bump: u8,\n}\n\n#[account]\npub struct Profile {\n    pub user: Pubkey,\n    pub total_claimed: u64,\n    pub last_claim_day: u64,\n    pub daily_claimed: u64,\n}\n\n#[error_code]\npub enum ErrorCode {\n    #[msg("Daily claim cap exceeded")]\n    DailyCapExceeded,\n    #[msg("Arithmetic overflow")]\n    ArithmeticOverflow,\n}',
              testCases: [
                {
                  id: "t1",
                  name: "Check-Effects-Interactions order",
                  input: "claim",
                  expectedOutput: "state updated before CPI",
                },
                {
                  id: "t2",
                  name: "Daily cap enforced",
                  input: "over cap",
                  expectedOutput: "DailyCapExceeded error",
                },
                {
                  id: "t3",
                  name: "Token program validated",
                  input: "accounts",
                  expectedOutput: "Program<Token>",
                },
                {
                  id: "t4",
                  name: "Profile PDA verified",
                  input: "accounts",
                  expectedOutput: "seeds + has_one",
                },
              ],
              hints: [
                "Move state updates before the CPI (Check-Effects-Interactions)",
                "Add daily cap check before allowing the claim",
                "Use Program<'info, Token> instead of AccountInfo",
                "Add PDA seeds and has_one constraints for profile",
              ],
            },
          },
        ],
      },
      {
        id: "sm4",
        title: "Economic Exploits",
        description: "Price manipulation and financial vulnerabilities",
        order: 3,
        lessons: [
          {
            id: "sl11",
            title: "Price Manipulation Attacks",
            description: "How attackers manipulate on-chain prices",
            order: 10,
            type: "content",
            xpReward: 90,
            duration: "30 min",
            content:
              "# Price Manipulation Attacks\n\nPrice manipulation is one of the most financially damaging attack vectors in DeFi.\n\n## On-Chain Price Sources\n\nPrograms get prices from:\n1. **AMM pool ratios** (manipulable via large swaps)\n2. **Oracle feeds** (Pyth, Switchboard)\n3. **TWAP** (Time-Weighted Average Price)\n\n## Attack: Pool Ratio Manipulation\n\n```\n1. Flash loan 10M USDC\n2. Swap into SOL/USDC pool → SOL price spikes on-chain\n3. Use inflated SOL price to borrow more USDC than collateral is worth\n4. Repay flash loan\n5. Profit from the excess borrow\n```\n\n## Why This Works\n\n```rust\n// VULNERABLE: Using spot pool price\nfn get_sol_price(pool: &Pool) -> u64 {\n    pool.usdc_reserve / pool.sol_reserve // Manipulable!\n}\n\n// Used in lending:\nlet collateral_value = sol_amount * get_sol_price(&pool);\nlet max_borrow = collateral_value * ltv_ratio;\n```\n\n## Defenses\n\n### 1. Use Oracle Prices (Not Pool Ratios)\n```rust\nlet price = pyth_feed.get_price_no_older_than(&clock, 60)?;\n```\n\n### 2. TWAP (Time-Weighted Average Price)\n```rust\n// Average price over a time window, resistant to flash manipulation\nlet twap = pool.cumulative_price_delta / time_elapsed;\n```\n\n### 3. Sanity Bounds\n```rust\nrequire!(\n    new_price > old_price * 90 / 100\n    && new_price < old_price * 110 / 100,\n    ErrorCode::PriceMovementTooLarge\n);\n```\n\n### 4. Multi-Oracle Cross-Reference\n```rust\nlet pyth_price = get_pyth_price()?;\nlet switchboard_price = get_switchboard_price()?;\nlet deviation = abs_diff(pyth_price, switchboard_price);\nrequire!(deviation < max_deviation, ErrorCode::OracleDeviation);\n```",
          },
          {
            id: "sl12",
            title: "Rounding Errors & Dust",
            description: "Integer math vulnerabilities",
            order: 11,
            type: "content",
            xpReward: 80,
            duration: "25 min",
            content:
              "# Rounding Errors & Dust\n\nSolana programs use integer arithmetic. Rounding decisions have financial implications.\n\n## The Rounding Problem\n\n```rust\n// User deposits 1 token into a vault with 1000 shares and 999 tokens\nlet shares = deposit_amount * total_shares / total_deposited;\nlet shares = 1 * 1000 / 999;\nlet shares = 1; // Rounds DOWN — user gets 1 share worth 0.999 tokens\n```\n\n## Rounding Direction Rules\n\n**Always round in favor of the protocol:**\n\n| Operation | Round Direction | Why |\n|-----------|----------------|-----|\n| Deposit → shares | DOWN | User gets fewer shares |\n| Withdraw → tokens | DOWN | User gets fewer tokens |\n| Fee calculation | UP | Protocol gets more fees |\n| Interest accrual | DOWN | Less interest paid out |\n\n```rust\n// Round down (default integer division)\nlet shares = amount * total_shares / total_deposited;\n\n// Round up\nlet fee = (amount * fee_rate + FEE_DENOMINATOR - 1) / FEE_DENOMINATOR;\n```\n\n## Dust Attacks\n\nAttackers exploit rounding to extract value:\n\n```\n1. Deposit 1 token → get 1 share (minimum)\n2. Donate 999 tokens directly to vault\n3. Now 1 share = 1000 tokens\n4. Another user deposits 999 tokens\n5. shares = 999 * 1 / 1000 = 0 (rounds to zero!)\n6. User got 0 shares for 999 tokens\n```\n\n## Defenses\n\n### Minimum Deposit\n```rust\nrequire!(deposit_amount >= MINIMUM_DEPOSIT, ErrorCode::DepositTooSmall);\nconst MINIMUM_DEPOSIT: u64 = 1_000; // Prevent dust deposits\n```\n\n### Dead Shares (Virtual Reserves)\n```rust\n// At initialization, create phantom shares\nconst INITIAL_SHARES: u64 = 1_000_000;\nvault.total_shares = INITIAL_SHARES;\nvault.total_deposited = INITIAL_SHARES;\n// Now manipulating 1 share requires matching 1M virtual reserves\n```\n\n### Zero-Share Check\n```rust\nlet shares = amount * total_shares / total_deposited;\nrequire!(shares > 0, ErrorCode::DepositTooSmall);\n```",
          },
          {
            id: "sl13",
            title: "Flash Loan Attacks",
            description: "Understanding flash loan attack vectors",
            order: 12,
            type: "content",
            xpReward: 80,
            duration: "25 min",
            content:
              "# Flash Loan Attacks\n\nFlash loans provide attackers with unlimited capital for a single transaction.\n\n## Attack Anatomy\n\n```\nAll in ONE transaction:\n1. Borrow $50M via flash loan (free capital)\n2. Manipulate a market/oracle\n3. Exploit the manipulated state\n4. Repay $50M + small fee\n5. Keep the profit\n\nIf any step fails → entire transaction reverts → attacker loses nothing (except tx fee)\n```\n\n## Real Attack Patterns\n\n### Pattern 1: Oracle Manipulation\n```\n1. Flash loan 10M USDC\n2. Swap all USDC → SOL on Pool A (SOL price spikes on Pool A)\n3. Lending protocol reads SOL price from Pool A\n4. Deposit 100 SOL as collateral (valued at inflated price)\n5. Borrow 50M USDC (more than collateral is worth)\n6. Swap SOL back → USDC on Pool A\n7. Repay flash loan\n8. Keep excess USDC\n```\n\n### Pattern 2: Governance Attack\n```\n1. Flash loan governance tokens\n2. Vote on malicious proposal (enough tokens to pass)\n3. Execute proposal (drain treasury)\n4. Return governance tokens\n```\n\n### Pattern 3: Vault Share Manipulation\n```\n1. Flash loan tokens\n2. Donate to vault (inflates share price)\n3. Another user's deposit gets 0 shares\n4. Withdraw donated tokens + victim's deposit\n```\n\n## Defenses\n\n### Use Oracle Prices (Not Spot)\n```rust\n// GOOD: Pyth with staleness check\nlet price = pyth_feed.get_price_no_older_than(&clock, 30)?;\n\n// BAD: AMM spot price\nlet price = pool.reserve_b / pool.reserve_a;\n```\n\n### Time-Delay for Sensitive Operations\n```rust\nrequire!(\n    clock.unix_timestamp > proposal.created_at + VOTING_DELAY,\n    ErrorCode::VotingNotStarted\n);\n```\n\n### Deposit-Withdraw Delay\n```rust\nrequire!(\n    clock.slot > user.last_deposit_slot + MIN_LOCK_SLOTS,\n    ErrorCode::WithdrawTooSoon\n);\n```",
          },
          {
            id: "sl14",
            title: "Spot the Vulnerability Challenge",
            description: "Identify economic exploits in DeFi code",
            order: 13,
            type: "challenge",
            xpReward: 150,
            duration: "40 min",
            challenge: {
              language: "rust",
              prompt:
                "Find and fix all economic vulnerabilities in this lending program.",
              starterCode:
                "use anchor_lang::prelude::*;\n\n#[account]\npub struct LendingPool {\n    pub token_mint: Pubkey,\n    pub total_deposited: u64,\n    pub total_borrowed: u64,\n    pub total_shares: u64,\n    pub bump: u8,\n}\n\n// BUG 1: First depositor attack possible\npub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {\n    let pool = &mut ctx.accounts.pool;\n    let shares = if pool.total_shares == 0 {\n        amount\n    } else {\n        amount * pool.total_shares / pool.total_deposited\n    };\n    pool.total_deposited += amount;\n    pool.total_shares += shares;\n    Ok(())\n}\n\n// BUG 2: Rounding favors user\npub fn withdraw(ctx: Context<Withdraw>, shares: u64) -> Result<()> {\n    let pool = &mut ctx.accounts.pool;\n    // Rounds UP — user gets more than they should\n    let amount = (shares * pool.total_deposited + pool.total_shares - 1)\n        / pool.total_shares;\n    pool.total_deposited -= amount;\n    pool.total_shares -= shares;\n    Ok(())\n}\n\n// BUG 3: Uses on-chain pool ratio for price\npub fn borrow(ctx: Context<Borrow>, amount: u64) -> Result<()> {\n    let pool = &mut ctx.accounts.pool;\n    let collateral = ctx.accounts.collateral_account.amount;\n    // BAD: Using pool ratio as price oracle\n    let collateral_value = collateral * pool.total_deposited / pool.total_shares;\n    let max_borrow = collateral_value * 75 / 100; // 75% LTV\n    require!(amount <= max_borrow, ErrorCode::InsufficientCollateral);\n    pool.total_borrowed += amount;\n    Ok(())\n}\n\n// BUG 4: No zero-share check\n// BUG 5: Unchecked arithmetic",
              solution:
                'use anchor_lang::prelude::*;\n\nconst MINIMUM_DEPOSIT: u64 = 10_000;\nconst INITIAL_VIRTUAL_SHARES: u64 = 1_000_000;\n\n#[account]\npub struct LendingPool {\n    pub token_mint: Pubkey,\n    pub total_deposited: u64,\n    pub total_borrowed: u64,\n    pub total_shares: u64,\n    pub bump: u8,\n}\n\npub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {\n    require!(amount >= MINIMUM_DEPOSIT, ErrorCode::DepositTooSmall);\n    let pool = &mut ctx.accounts.pool;\n    let shares = if pool.total_shares == 0 {\n        pool.total_shares = INITIAL_VIRTUAL_SHARES;\n        pool.total_deposited = INITIAL_VIRTUAL_SHARES;\n        amount\n    } else {\n        amount.checked_mul(pool.total_shares).unwrap()\n            .checked_div(pool.total_deposited).unwrap()\n    };\n    require!(shares > 0, ErrorCode::DepositTooSmall);\n    pool.total_deposited = pool.total_deposited.checked_add(amount)\n        .ok_or(ErrorCode::ArithmeticOverflow)?;\n    pool.total_shares = pool.total_shares.checked_add(shares)\n        .ok_or(ErrorCode::ArithmeticOverflow)?;\n    Ok(())\n}\n\npub fn withdraw(ctx: Context<Withdraw>, shares: u64) -> Result<()> {\n    let pool = &mut ctx.accounts.pool;\n    // Round DOWN — protocol keeps dust\n    let amount = shares.checked_mul(pool.total_deposited).unwrap()\n        .checked_div(pool.total_shares).unwrap();\n    require!(amount > 0, ErrorCode::WithdrawTooSmall);\n    pool.total_deposited = pool.total_deposited.checked_sub(amount)\n        .ok_or(ErrorCode::ArithmeticOverflow)?;\n    pool.total_shares = pool.total_shares.checked_sub(shares)\n        .ok_or(ErrorCode::ArithmeticOverflow)?;\n    Ok(())\n}\n\npub fn borrow(ctx: Context<Borrow>, amount: u64) -> Result<()> {\n    let pool = &mut ctx.accounts.pool;\n    let collateral = ctx.accounts.collateral_account.amount;\n    // Use oracle price instead of pool ratio\n    let oracle_price = ctx.accounts.price_feed.get_price()?;\n    let collateral_value = collateral.checked_mul(oracle_price).unwrap()\n        .checked_div(PRICE_PRECISION).unwrap();\n    let max_borrow = collateral_value.checked_mul(75).unwrap()\n        .checked_div(100).unwrap();\n    require!(amount <= max_borrow, ErrorCode::InsufficientCollateral);\n    pool.total_borrowed = pool.total_borrowed.checked_add(amount)\n        .ok_or(ErrorCode::ArithmeticOverflow)?;\n    Ok(())\n}\n\n#[error_code]\npub enum ErrorCode {\n    #[msg("Deposit below minimum")]\n    DepositTooSmall,\n    #[msg("Withdraw amount too small")]\n    WithdrawTooSmall,\n    #[msg("Insufficient collateral")]\n    InsufficientCollateral,\n    #[msg("Arithmetic overflow")]\n    ArithmeticOverflow,\n}',
              testCases: [
                {
                  id: "t1",
                  name: "Virtual shares prevent first depositor attack",
                  input: "first deposit",
                  expectedOutput: "INITIAL_VIRTUAL_SHARES",
                },
                {
                  id: "t2",
                  name: "Withdraw rounds down",
                  input: "withdraw",
                  expectedOutput: "no round-up",
                },
                {
                  id: "t3",
                  name: "Uses oracle not pool ratio",
                  input: "borrow",
                  expectedOutput: "oracle_price",
                },
                {
                  id: "t4",
                  name: "Zero-share check",
                  input: "tiny deposit",
                  expectedOutput: "DepositTooSmall",
                },
                {
                  id: "t5",
                  name: "Checked arithmetic",
                  input: "all ops",
                  expectedOutput: "checked_*",
                },
              ],
              hints: [
                "Add virtual/dead shares at initialization to prevent first depositor attack",
                "Round withdrawals DOWN (standard integer division, not ceiling)",
                "Use an oracle price feed instead of pool token ratios",
                "Add minimum deposit check and zero-share check",
                "Use checked arithmetic everywhere",
              ],
            },
          },
        ],
      },
      {
        id: "sm5",
        title: "Advanced Attacks",
        description: "Sophisticated vulnerability patterns",
        order: 4,
        lessons: [
          {
            id: "sl15",
            title: "Account Closing & Revival",
            description: "Vulnerabilities when closing accounts",
            order: 14,
            type: "content",
            xpReward: 80,
            duration: "25 min",
            content:
              "# Account Closing & Revival\n\nClosing accounts reclaims rent, but improper closing creates vulnerabilities.\n\n## The Close Flow\n\n```rust\n#[derive(Accounts)]\npub struct CloseAccount<'info> {\n    #[account(mut, close = recipient)]\n    pub account_to_close: Account<'info, MyData>,\n    #[account(mut)]\n    pub recipient: SystemAccount<'info>,\n}\n```\n\nAnchor's `close` constraint:\n1. Transfers all lamports to recipient\n2. Sets account data to zero\n3. Sets owner to System Program\n\n## The Revival Attack\n\nWithin the **same transaction**, after an account is closed:\n\n```\nInstruction 1: Close account A (lamports → recipient)\nInstruction 2: Transfer lamports back to account A\nInstruction 3: Account A still has zero'd data but is \"alive\"\nInstruction 4: Re-initialize account A with attacker-controlled data\n```\n\n## Why It Works\n\nSolana's runtime garbage-collects accounts at the **end** of a transaction. Within a transaction, a zeroed account can be revived by sending it lamports.\n\n## Defense: Check Account Discriminator\n\n```rust\n// Before operating on an account, verify it's properly initialized\nlet data = account.try_borrow_data()?;\nlet discriminator = &data[..8];\nrequire!(\n    discriminator != [0u8; 8],\n    ErrorCode::AccountNotInitialized\n);\n```\n\n## Defense: Force Close = Transfer to PDA\n\n```rust\n// Transfer lamports to a PDA that can't be manipulated\n#[account(mut, close = protocol_treasury)]\npub account_to_close: Account<'info, MyData>,\n#[account(mut, seeds = [b\"treasury\"], bump)]\npub protocol_treasury: SystemAccount<'info>,\n```\n\n## Anchor Protection\n\nAnchor v0.26+ writes a special closed-account discriminator:\n```rust\n// After close, data starts with:\n// [0x43, 0x4c, 0x4f, 0x53, 0x45, 0x44, 0x00, 0x00] = \"CLOSED\"\n// init constraint rejects accounts with this discriminator\n```",
          },
          {
            id: "sl16",
            title: "Initialization Front-Running",
            description: "Race conditions during account initialization",
            order: 15,
            type: "content",
            xpReward: 80,
            duration: "25 min",
            content:
              "# Initialization Front-Running\n\nAttackers can front-run initialization to set themselves as the authority.\n\n## The Attack\n\n```\n1. Protocol deploys program\n2. Protocol submits: initialize(authority = real_admin)\n3. Attacker sees pending tx, submits: initialize(authority = attacker)\n4. Attacker's tx lands first\n5. Attacker is now the authority\n```\n\n## Vulnerable Pattern\n\n```rust\npub fn initialize(ctx: Context<Initialize>, authority: Pubkey) -> Result<()> {\n    let config = &mut ctx.accounts.config;\n    config.authority = authority; // Whoever calls first wins!\n    Ok(())\n}\n\n#[derive(Accounts)]\npub struct Initialize<'info> {\n    #[account(init, seeds = [b\"config\"], bump, payer = payer, space = 8 + Config::INIT_SPACE)]\n    pub config: Account<'info, Config>,\n    #[account(mut)]\n    pub payer: Signer<'info>,\n    pub system_program: Program<'info, System>,\n}\n```\n\n## Defenses\n\n### 1. Deploy-Time Initialization\nInitialize in the same transaction as deployment:\n```bash\nanchor deploy --program-keypair ... --provider.cluster devnet\n# Immediately call initialize in the same script\n```\n\n### 2. Hardcoded Authority\n```rust\nconst ADMIN: Pubkey = pubkey!(\"Admin111111111111111111111111111111111111\");\n\npub fn initialize(ctx: Context<Initialize>) -> Result<()> {\n    let config = &mut ctx.accounts.config;\n    config.authority = ADMIN; // Can't be front-run\n    Ok(())\n}\n```\n\n### 3. Deployer = Authority\n```rust\npub fn initialize(ctx: Context<Initialize>) -> Result<()> {\n    let config = &mut ctx.accounts.config;\n    // Only the program upgrade authority can initialize\n    let program_data = &ctx.accounts.program_data;\n    require_keys_eq!(\n        program_data.upgrade_authority_address.unwrap(),\n        ctx.accounts.payer.key(),\n        ErrorCode::Unauthorized\n    );\n    config.authority = ctx.accounts.payer.key();\n    Ok(())\n}\n```\n\n### 4. Use Multisig for Critical Operations\nRequire Squads multisig for initialization:\n- Multiple team members must approve\n- Front-running requires compromising the multisig",
          },
          {
            id: "sl17",
            title: "Type Cosplay Attacks",
            description: "When account types are confused",
            order: 16,
            type: "content",
            xpReward: 80,
            duration: "25 min",
            content:
              "# Type Cosplay Attacks\n\nType cosplay exploits programs that don't properly distinguish between account types.\n\n## The Problem\n\nIf two account structs share the same data layout prefix, an attacker can pass one type where another is expected.\n\n```rust\n#[account]\npub struct Vault {\n    pub authority: Pubkey,  // 32 bytes\n    pub balance: u64,       // 8 bytes\n}\n\n#[account]\npub struct UserProfile {\n    pub authority: Pubkey,  // 32 bytes — same offset!\n    pub xp: u64,            // 8 bytes — same offset!\n}\n```\n\n## The Attack\n\nWithout proper discriminator validation:\n```\n1. Create a UserProfile with authority = attacker, xp = 1_000_000\n2. Pass this UserProfile where a Vault is expected\n3. Program reads vault.balance → gets 1_000_000 (actually xp)\n4. Withdraws 1_000_000 from the real vault\n```\n\n## Why Anchor Is Safe (Usually)\n\nAnchor adds an 8-byte **discriminator** (SHA256 prefix of the account name):\n```\nVault discriminator:       [0x5e, 0xa0, ...] \nUserProfile discriminator: [0x3a, 0x7f, ...]\n```\n\n`Account<'info, Vault>` checks the discriminator automatically. The attack fails because discriminators don't match.\n\n## When You're Still Vulnerable\n\n### 1. Using AccountInfo Instead of Account\n```rust\n// BAD: No discriminator check\n/// CHECK: trust me\npub vault: AccountInfo<'info>,\n\n// GOOD: Typed account\npub vault: Account<'info, Vault>,\n```\n\n### 2. Native Programs Without Discriminators\n```rust\n// Add your own type tag\n#[derive(BorshSerialize, BorshDeserialize)]\npub struct Vault {\n    pub account_type: u8,  // 1 = Vault, 2 = Profile\n    pub authority: Pubkey,\n    pub balance: u64,\n}\n\nconst VAULT_TYPE: u8 = 1;\n\n// Always check\nrequire!(account.account_type == VAULT_TYPE, ErrorCode::InvalidAccountType);\n```\n\n### 3. Cross-Program Account Confusion\nWhen receiving accounts from another program, verify the owner:\n```rust\nrequire!(\n    *account.owner == expected_program_id,\n    ErrorCode::InvalidAccountOwner\n);\n```",
          },
          {
            id: "sl18",
            title: "Advanced Vulnerabilities Challenge",
            description: "Fix complex security issues",
            order: 17,
            type: "challenge",
            xpReward: 120,
            duration: "35 min",
            challenge: {
              language: "rust",
              prompt:
                "Fix all advanced vulnerabilities in this staking program with account closing and re-initialization.",
              starterCode:
                "use anchor_lang::prelude::*;\n\n#[program]\npub mod vulnerable_staking {\n    use super::*;\n\n    // BUG 1: Anyone can initialize\n    pub fn initialize(ctx: Context<Initialize>, authority: Pubkey) -> Result<()> {\n        let config = &mut ctx.accounts.config;\n        config.authority = authority;\n        config.total_staked = 0;\n        config.bump = ctx.bumps.config;\n        Ok(())\n    }\n\n    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {\n        let user = &mut ctx.accounts.user_stake;\n        // BUG 2: No check if account was revived after close\n        user.amount += amount;\n        user.last_stake_time = Clock::get()?.unix_timestamp;\n        Ok(())\n    }\n\n    // BUG 3: Close doesn't verify unstake first\n    pub fn close_stake(ctx: Context<CloseStake>) -> Result<()> {\n        // Account closed via constraint\n        Ok(())\n    }\n\n    // BUG 4: Uses unchecked AccountInfo for reward calculation\n    pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {\n        let user_data = ctx.accounts.user_stake.try_borrow_data()?;\n        let amount = u64::from_le_bytes(user_data[40..48].try_into().unwrap());\n        let rewards = amount / 100; // 1% reward\n        Ok(())\n    }\n}\n\n#[derive(Accounts)]\npub struct Initialize<'info> {\n    #[account(init, seeds = [b\"config\"], bump, payer = payer, space = 8 + 32 + 8 + 1)]\n    pub config: Account<'info, Config>,\n    #[account(mut)]\n    pub payer: Signer<'info>,\n    pub system_program: Program<'info, System>,\n}\n\n#[derive(Accounts)]\npub struct Stake<'info> {\n    #[account(init_if_needed, seeds = [b\"stake\", user.key().as_ref()], bump, payer = user, space = 8 + UserStake::INIT_SPACE)]\n    pub user_stake: Account<'info, UserStake>,\n    #[account(mut)]\n    pub user: Signer<'info>,\n    pub system_program: Program<'info, System>,\n}\n\n#[derive(Accounts)]\npub struct CloseStake<'info> {\n    #[account(mut, close = user, seeds = [b\"stake\", user.key().as_ref()], bump)]\n    pub user_stake: Account<'info, UserStake>,\n    #[account(mut)]\n    pub user: Signer<'info>,\n}\n\n#[derive(Accounts)]\npub struct ClaimRewards<'info> {\n    /// CHECK: read manually\n    pub user_stake: AccountInfo<'info>,\n    pub user: Signer<'info>,\n}\n\n#[account]\n#[derive(InitSpace)]\npub struct Config {\n    pub authority: Pubkey,\n    pub total_staked: u64,\n    pub bump: u8,\n}\n\n#[account]\n#[derive(InitSpace)]\npub struct UserStake {\n    pub user: Pubkey,\n    pub amount: u64,\n    pub last_stake_time: i64,\n}",
              solution:
                "use anchor_lang::prelude::*;\n\nconst ADMIN: Pubkey = pubkey!(\"Admin111111111111111111111111111111111111111\");\n\n#[program]\npub mod secure_staking {\n    use super::*;\n\n    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {\n        let config = &mut ctx.accounts.config;\n        config.authority = ADMIN;\n        config.total_staked = 0;\n        config.bump = ctx.bumps.config;\n        Ok(())\n    }\n\n    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {\n        let user = &mut ctx.accounts.user_stake;\n        user.user = ctx.accounts.user.key();\n        user.amount = user.amount.checked_add(amount)\n            .ok_or(ErrorCode::ArithmeticOverflow)?;\n        user.last_stake_time = Clock::get()?.unix_timestamp;\n        let config = &mut ctx.accounts.config;\n        config.total_staked = config.total_staked.checked_add(amount)\n            .ok_or(ErrorCode::ArithmeticOverflow)?;\n        Ok(())\n    }\n\n    pub fn close_stake(ctx: Context<CloseStake>) -> Result<()> {\n        let user_stake = &ctx.accounts.user_stake;\n        require!(user_stake.amount == 0, ErrorCode::StakeNotEmpty);\n        let config = &mut ctx.accounts.config;\n        Ok(())\n    }\n\n    pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {\n        let user_stake = &ctx.accounts.user_stake;\n        let clock = Clock::get()?;\n        let elapsed = clock.unix_timestamp.checked_sub(user_stake.last_stake_time)\n            .ok_or(ErrorCode::ArithmeticOverflow)?;\n        let rewards = user_stake.amount\n            .checked_mul(elapsed as u64).unwrap()\n            .checked_div(86400 * 100).unwrap();\n        Ok(())\n    }\n}\n\n#[derive(Accounts)]\npub struct Initialize<'info> {\n    #[account(init, seeds = [b\"config\"], bump, payer = payer, space = 8 + 32 + 8 + 1)]\n    pub config: Account<'info, Config>,\n    #[account(mut, address = ADMIN)]\n    pub payer: Signer<'info>,\n    pub system_program: Program<'info, System>,\n}\n\n#[derive(Accounts)]\npub struct Stake<'info> {\n    #[account(init_if_needed, seeds = [b\"stake\", user.key().as_ref()], bump, payer = user, space = 8 + UserStake::INIT_SPACE)]\n    pub user_stake: Account<'info, UserStake>,\n    #[account(mut, seeds = [b\"config\"], bump = config.bump)]\n    pub config: Account<'info, Config>,\n    #[account(mut)]\n    pub user: Signer<'info>,\n    pub system_program: Program<'info, System>,\n}\n\n#[derive(Accounts)]\npub struct CloseStake<'info> {\n    #[account(mut, close = user, seeds = [b\"stake\", user.key().as_ref()], bump, has_one = user)]\n    pub user_stake: Account<'info, UserStake>,\n    #[account(mut, seeds = [b\"config\"], bump = config.bump)]\n    pub config: Account<'info, Config>,\n    #[account(mut)]\n    pub user: Signer<'info>,\n}\n\n#[derive(Accounts)]\npub struct ClaimRewards<'info> {\n    #[account(seeds = [b\"stake\", user.key().as_ref()], bump, has_one = user)]\n    pub user_stake: Account<'info, UserStake>,\n    pub user: Signer<'info>,\n}\n\n#[account]\n#[derive(InitSpace)]\npub struct Config {\n    pub authority: Pubkey,\n    pub total_staked: u64,\n    pub bump: u8,\n}\n\n#[account]\n#[derive(InitSpace)]\npub struct UserStake {\n    pub user: Pubkey,\n    pub amount: u64,\n    pub last_stake_time: i64,\n}\n\n#[error_code]\npub enum ErrorCode {\n    ArithmeticOverflow,\n    StakeNotEmpty,\n}",
              testCases: [
                {
                  id: "t1",
                  name: "Hardcoded admin",
                  input: "initialize",
                  expectedOutput: "ADMIN constant",
                },
                {
                  id: "t2",
                  name: "Typed account for rewards",
                  input: "claim_rewards",
                  expectedOutput: "Account<UserStake>",
                },
                {
                  id: "t3",
                  name: "Close requires zero balance",
                  input: "close_stake",
                  expectedOutput: "StakeNotEmpty check",
                },
                {
                  id: "t4",
                  name: "has_one constraints",
                  input: "all user ops",
                  expectedOutput: "has_one = user",
                },
              ],
              hints: [
                "Hardcode the admin pubkey or verify deployer authority",
                "Use Account<'info, UserStake> instead of AccountInfo for type safety",
                "Require amount == 0 before allowing close",
                "Add has_one = user to prevent operating on other users' stakes",
              ],
            },
          },
        ],
      },
      {
        id: "sm6",
        title: "Security in Practice",
        description: "Auditing tools and secure development workflow",
        order: 5,
        lessons: [
          {
            id: "sl19",
            title: "Security Tooling & Auditing",
            description: "Tools for finding vulnerabilities",
            order: 18,
            type: "content",
            xpReward: 80,
            duration: "25 min",
            content:
              "# Security Tooling & Auditing\n\n## Static Analysis\n\n### Clippy (Built-in)\n```bash\ncargo clippy -- -W clippy::all -W clippy::pedantic\n```\nCatches common Rust issues: unused variables, redundant clones, integer casting.\n\n### Soteria\nSolana-specific static analyzer:\n```bash\nsoteria -analyzeAll .\n```\nDetects: missing signer checks, unchecked arithmetic, missing owner validation.\n\n### Semgrep (Custom Rules)\n```yaml\nrules:\n  - id: unchecked-arithmetic\n    patterns:\n      - pattern: $X + $Y\n      - pattern-not: $X.checked_add($Y)\n    message: Use checked arithmetic\n```\n\n## Fuzz Testing\n\n### Trident (Anchor Fuzz Framework)\n```rust\n#[derive(Arbitrary)]\npub struct FuzzInstruction {\n    pub instruction: AcademyInstruction,\n    pub accounts: Vec<AccountId>,\n}\n\nfn fuzz_iteration(instructions: Vec<FuzzInstruction>) {\n    for ix in instructions {\n        // Execute random instruction sequences\n        // Check invariants after each\n    }\n}\n```\n\nRun for at least 10 minutes on critical code paths.\n\n## Audit Checklist\n\n### Account Validation\n- [ ] All accounts have proper owner checks\n- [ ] PDAs verified with correct seeds\n- [ ] Signers checked for all mutations\n- [ ] has_one constraints for authority fields\n\n### Arithmetic\n- [ ] All math uses checked operations\n- [ ] Rounding favors the protocol\n- [ ] No division by zero possible\n- [ ] Overflow impossible at max values\n\n### CPI Safety\n- [ ] Program IDs verified for all CPIs\n- [ ] State updated before CPIs\n- [ ] Accounts reloaded after CPIs if needed\n\n### Economic\n- [ ] Oracle prices used (not spot)\n- [ ] Staleness checks on price feeds\n- [ ] Minimum amounts enforced\n- [ ] Rate limiting on sensitive operations",
          },
          {
            id: "sl20",
            title: "Writing Secure Programs",
            description: "Best practices for secure Solana development",
            order: 19,
            type: "content",
            xpReward: 80,
            duration: "25 min",
            content:
              "# Writing Secure Programs\n\n## The Defense-in-Depth Approach\n\nDon't rely on a single security measure. Layer defenses:\n\n```\nLayer 1: Anchor constraints (compile-time)\nLayer 2: Runtime require!() checks\nLayer 3: Rate limiting (daily caps)\nLayer 4: Backend signature verification\nLayer 5: Monitoring & alerting\n```\n\n## Secure Coding Patterns\n\n### 1. Always Store Canonical Bumps\n```rust\n#[account]\npub struct Config {\n    pub bump: u8, // Store at initialization\n}\n\n// Use stored bump (saves ~1500 CU)\n#[account(seeds = [b\"config\"], bump = config.bump)]\npub config: Account<'info, Config>,\n```\n\n### 2. Authority Hierarchy\n```rust\npub struct Config {\n    pub super_admin: Pubkey,    // Multisig (Squads)\n    pub backend_signer: Pubkey, // Rotatable\n    pub operator: Pubkey,       // Limited permissions\n}\n```\n\n### 3. Rate Limiting\n```rust\npub fn complete_lesson(ctx: Context<Complete>) -> Result<()> {\n    let profile = &mut ctx.accounts.profile;\n    let clock = Clock::get()?;\n    let today = (clock.unix_timestamp / 86400) as u16;\n\n    if profile.last_xp_day != today {\n        profile.daily_xp_earned = 0;\n        profile.last_xp_day = today;\n    }\n\n    let new_daily = profile.daily_xp_earned.checked_add(xp_amount)\n        .ok_or(ErrorCode::Overflow)?;\n    require!(new_daily <= MAX_DAILY_XP, ErrorCode::DailyCapExceeded);\n    profile.daily_xp_earned = new_daily;\n    Ok(())\n}\n```\n\n### 4. Reserved Bytes for Future-Proofing\n```rust\n#[account]\npub struct Config {\n    pub authority: Pubkey,\n    pub season: u16,\n    pub bump: u8,\n    pub _reserved: [u8; 64], // Future fields without migration\n}\n```\n\n### 5. Event Emission for Monitoring\n```rust\n#[event]\npub struct LargeWithdrawal {\n    pub user: Pubkey,\n    pub amount: u64,\n    pub timestamp: i64,\n}\n\n// Emit events for monitoring systems\nif amount > LARGE_WITHDRAWAL_THRESHOLD {\n    emit!(LargeWithdrawal { user: ctx.accounts.user.key(), amount, timestamp: clock.unix_timestamp });\n}\n```\n\n## Pre-Deployment Checklist\n\n1. All tests pass (unit + integration + fuzz 10+ min)\n2. Clippy clean with pedantic warnings\n3. Manual code review by 2+ developers\n4. External audit for mainnet deployments\n5. Verifiable build (`anchor build --verifiable`)\n6. Devnet testing for multiple days\n7. Monitoring infrastructure ready",
          },
          {
            id: "sl21",
            title: "Final Security Audit Challenge",
            description: "Perform a comprehensive security audit",
            order: 20,
            type: "challenge",
            xpReward: 180,
            duration: "45 min",
            challenge: {
              language: "rust",
              prompt:
                "Perform a full security audit on this token sale program. Find and fix all vulnerabilities.",
              starterCode:
                "use anchor_lang::prelude::*;\nuse anchor_spl::token::{self, Token, Mint, TokenAccount, Transfer, MintTo};\n\n// AUDIT THIS PROGRAM — Find ALL vulnerabilities\n\n#[program]\npub mod token_sale {\n    use super::*;\n\n    pub fn initialize_sale(\n        ctx: Context<InitSale>,\n        price_per_token: u64,\n        max_supply: u64,\n    ) -> Result<()> {\n        let sale = &mut ctx.accounts.sale;\n        sale.authority = ctx.accounts.authority.key();\n        sale.token_mint = ctx.accounts.token_mint.key();\n        sale.price_per_token = price_per_token;\n        sale.max_supply = max_supply;\n        sale.total_sold = 0;\n        sale.bump = ctx.bumps.sale;\n        Ok(())\n    }\n\n    pub fn buy_tokens(\n        ctx: Context<BuyTokens>,\n        amount: u64,\n    ) -> Result<()> {\n        let sale = &mut ctx.accounts.sale;\n        let cost = amount * sale.price_per_token;\n\n        // Transfer SOL from buyer to sale vault\n        anchor_lang::system_program::transfer(\n            CpiContext::new(\n                ctx.accounts.system_program.to_account_info(),\n                anchor_lang::system_program::Transfer {\n                    from: ctx.accounts.buyer.to_account_info(),\n                    to: ctx.accounts.sol_vault.to_account_info(),\n                },\n            ),\n            cost,\n        )?;\n\n        // Mint tokens to buyer\n        let seeds = &[b\"sale\".as_ref(), &[sale.bump]];\n        token::mint_to(\n            CpiContext::new_with_signer(\n                ctx.accounts.token_program.to_account_info(),\n                MintTo {\n                    mint: ctx.accounts.token_mint.to_account_info(),\n                    to: ctx.accounts.buyer_token_account.to_account_info(),\n                    authority: sale.to_account_info(),\n                },\n                &[seeds],\n            ),\n            amount,\n        )?;\n\n        sale.total_sold += amount;\n        Ok(())\n    }\n\n    pub fn withdraw_funds(\n        ctx: Context<WithdrawFunds>,\n        amount: u64,\n    ) -> Result<()> {\n        **ctx.accounts.sol_vault.try_borrow_mut_lamports()? -= amount;\n        **ctx.accounts.authority.try_borrow_mut_lamports()? += amount;\n        Ok(())\n    }\n}\n\n#[derive(Accounts)]\npub struct InitSale<'info> {\n    #[account(init, seeds = [b\"sale\"], bump, payer = authority, space = 8 + Sale::INIT_SPACE)]\n    pub sale: Account<'info, Sale>,\n    pub token_mint: Account<'info, Mint>,\n    #[account(mut)]\n    pub authority: Signer<'info>,\n    pub system_program: Program<'info, System>,\n}\n\n#[derive(Accounts)]\npub struct BuyTokens<'info> {\n    #[account(mut, seeds = [b\"sale\"], bump = sale.bump)]\n    pub sale: Account<'info, Sale>,\n    #[account(mut)]\n    pub token_mint: Account<'info, Mint>,\n    #[account(mut)]\n    pub buyer_token_account: Account<'info, TokenAccount>,\n    /// CHECK: SOL vault\n    #[account(mut)]\n    pub sol_vault: AccountInfo<'info>,\n    #[account(mut)]\n    pub buyer: Signer<'info>,\n    pub token_program: Program<'info, Token>,\n    pub system_program: Program<'info, System>,\n}\n\n#[derive(Accounts)]\npub struct WithdrawFunds<'info> {\n    #[account(seeds = [b\"sale\"], bump = sale.bump)]\n    pub sale: Account<'info, Sale>,\n    /// CHECK: vault\n    #[account(mut)]\n    pub sol_vault: AccountInfo<'info>,\n    /// CHECK: authority\n    #[account(mut)]\n    pub authority: AccountInfo<'info>,\n}\n\n#[account]\n#[derive(InitSpace)]\npub struct Sale {\n    pub authority: Pubkey,\n    pub token_mint: Pubkey,\n    pub price_per_token: u64,\n    pub max_supply: u64,\n    pub total_sold: u64,\n    pub bump: u8,\n}",
              solution:
                "use anchor_lang::prelude::*;\nuse anchor_spl::token::{self, Token, Mint, TokenAccount, MintTo};\n\n#[program]\npub mod secure_token_sale {\n    use super::*;\n\n    pub fn initialize_sale(\n        ctx: Context<InitSale>,\n        price_per_token: u64,\n        max_supply: u64,\n    ) -> Result<()> {\n        require!(price_per_token > 0, ErrorCode::InvalidPrice);\n        require!(max_supply > 0, ErrorCode::InvalidSupply);\n        let sale = &mut ctx.accounts.sale;\n        sale.authority = ctx.accounts.authority.key();\n        sale.token_mint = ctx.accounts.token_mint.key();\n        sale.price_per_token = price_per_token;\n        sale.max_supply = max_supply;\n        sale.total_sold = 0;\n        sale.bump = ctx.bumps.sale;\n        Ok(())\n    }\n\n    pub fn buy_tokens(\n        ctx: Context<BuyTokens>,\n        amount: u64,\n    ) -> Result<()> {\n        require!(amount > 0, ErrorCode::ZeroAmount);\n        let sale = &mut ctx.accounts.sale;\n\n        // Check supply cap\n        let new_total = sale.total_sold.checked_add(amount)\n            .ok_or(ErrorCode::ArithmeticOverflow)?;\n        require!(new_total <= sale.max_supply, ErrorCode::SoldOut);\n\n        // Checked cost calculation\n        let cost = amount.checked_mul(sale.price_per_token)\n            .ok_or(ErrorCode::ArithmeticOverflow)?;\n\n        // Update state BEFORE CPIs\n        sale.total_sold = new_total;\n\n        // Transfer SOL\n        anchor_lang::system_program::transfer(\n            CpiContext::new(\n                ctx.accounts.system_program.to_account_info(),\n                anchor_lang::system_program::Transfer {\n                    from: ctx.accounts.buyer.to_account_info(),\n                    to: ctx.accounts.sol_vault.to_account_info(),\n                },\n            ),\n            cost,\n        )?;\n\n        // Mint tokens\n        let seeds = &[b\"sale\".as_ref(), &[sale.bump]];\n        token::mint_to(\n            CpiContext::new_with_signer(\n                ctx.accounts.token_program.to_account_info(),\n                MintTo {\n                    mint: ctx.accounts.token_mint.to_account_info(),\n                    to: ctx.accounts.buyer_token_account.to_account_info(),\n                    authority: sale.to_account_info(),\n                },\n                &[seeds],\n            ),\n            amount,\n        )?;\n\n        Ok(())\n    }\n\n    pub fn withdraw_funds(\n        ctx: Context<WithdrawFunds>,\n        amount: u64,\n    ) -> Result<()> {\n        let vault_balance = ctx.accounts.sol_vault.lamports();\n        let rent = Rent::get()?.minimum_balance(0);\n        require!(vault_balance.saturating_sub(rent) >= amount, ErrorCode::InsufficientFunds);\n\n        **ctx.accounts.sol_vault.try_borrow_mut_lamports()? -= amount;\n        **ctx.accounts.authority.to_account_info().try_borrow_mut_lamports()? += amount;\n        Ok(())\n    }\n}\n\n#[derive(Accounts)]\npub struct InitSale<'info> {\n    #[account(init, seeds = [b\"sale\"], bump, payer = authority, space = 8 + Sale::INIT_SPACE)]\n    pub sale: Account<'info, Sale>,\n    #[account(mint::authority = sale)]\n    pub token_mint: Account<'info, Mint>,\n    #[account(mut)]\n    pub authority: Signer<'info>,\n    pub system_program: Program<'info, System>,\n}\n\n#[derive(Accounts)]\npub struct BuyTokens<'info> {\n    #[account(mut, seeds = [b\"sale\"], bump = sale.bump, has_one = token_mint)]\n    pub sale: Account<'info, Sale>,\n    #[account(mut)]\n    pub token_mint: Account<'info, Mint>,\n    #[account(mut, token::mint = token_mint, token::authority = buyer)]\n    pub buyer_token_account: Account<'info, TokenAccount>,\n    #[account(mut, seeds = [b\"vault\"], bump)]\n    pub sol_vault: SystemAccount<'info>,\n    #[account(mut)]\n    pub buyer: Signer<'info>,\n    pub token_program: Program<'info, Token>,\n    pub system_program: Program<'info, System>,\n}\n\n#[derive(Accounts)]\npub struct WithdrawFunds<'info> {\n    #[account(seeds = [b\"sale\"], bump = sale.bump, has_one = authority)]\n    pub sale: Account<'info, Sale>,\n    #[account(mut, seeds = [b\"vault\"], bump)]\n    pub sol_vault: SystemAccount<'info>,\n    #[account(mut)]\n    pub authority: Signer<'info>,\n}\n\n#[account]\n#[derive(InitSpace)]\npub struct Sale {\n    pub authority: Pubkey,\n    pub token_mint: Pubkey,\n    pub price_per_token: u64,\n    pub max_supply: u64,\n    pub total_sold: u64,\n    pub bump: u8,\n}\n\n#[error_code]\npub enum ErrorCode {\n    InvalidPrice,\n    InvalidSupply,\n    ZeroAmount,\n    SoldOut,\n    ArithmeticOverflow,\n    InsufficientFunds,\n}",
              testCases: [
                {
                  id: "t1",
                  name: "Supply cap enforced",
                  input: "buy > max_supply",
                  expectedOutput: "SoldOut error",
                },
                {
                  id: "t2",
                  name: "Checked arithmetic",
                  input: "large amount * price",
                  expectedOutput: "no overflow",
                },
                {
                  id: "t3",
                  name: "Withdraw requires authority signer",
                  input: "wrong authority",
                  expectedOutput: "error",
                },
                {
                  id: "t4",
                  name: "SOL vault is PDA",
                  input: "accounts",
                  expectedOutput: "seeds + bump",
                },
                {
                  id: "t5",
                  name: "State before CPI",
                  input: "buy_tokens",
                  expectedOutput: "total_sold updated first",
                },
                {
                  id: "t6",
                  name: "Token account validated",
                  input: "buyer_token_account",
                  expectedOutput: "mint + authority check",
                },
              ],
              hints: [
                "Add max_supply check: total_sold + amount <= max_supply",
                "Use checked arithmetic for cost = amount * price",
                "Make authority a Signer with has_one in WithdrawFunds",
                "Make sol_vault a PDA (SystemAccount with seeds)",
                "Update total_sold before CPIs (Check-Effects-Interactions)",
                "Add token::mint and token::authority constraints on buyer_token_account",
              ],
            },
          },
        ],
      },
    ],
  }),
  buildCourse({
    id: "anchor-intermediate",
    slug: "anchor-intermediate",
    title: "Anchor Intermediate: Advanced Patterns",
    description:
      "Deep dive into Anchor patterns including CPIs, PDAs, Token operations, and complex account structures.",
    thumbnail: "/courses/anchor-intermediate.png",
    creator: "Superteam Academy",
    difficulty: "intermediate",
    xpTotal: 1000,
    trackId: 1,
    trackLevel: 2,
    duration: "8 hours",
    prerequisiteId: "anchor-beginner",
    isActive: true,
    createdAt: "2025-06-01T00:00:00Z",
    modules: [
      {
        id: "aim1",
        title: "Advanced Anchor",
        description: "CPIs and token operations",
        order: 0,
        lessons: [
          {
            id: "ail1",
            title: "Cross-Program Invocations",
            description: "Calling other programs",
            order: 0,
            type: "content",
            xpReward: 50,
            duration: "30 min",
            content:
              "# Cross-Program Invocations (CPI)\n\nCPIs allow programs to call other programs.\n\n```rust\nlet cpi_ctx = CpiContext::new_with_signer(\n    token_program.to_account_info(),\n    MintTo { mint, to, authority },\n    &[&seeds],\n);\ntoken::mint_to(cpi_ctx, amount)?;\n```",
          },
          {
            id: "ail2",
            title: "Token Operations",
            description: "SPL Token with Anchor",
            order: 1,
            type: "content",
            xpReward: 50,
            duration: "30 min",
            content:
              "# Token Operations with Anchor\n\n## Creating a Mint\n\n```rust\n#[account(\n    init,\n    payer = authority,\n    mint::decimals = 0,\n    mint::authority = config,\n)]\npub mint: Account<'info, Mint>,\n```",
          },
        ],
      },
      {
        id: "aim2",
        title: "Advanced Account Patterns",
        description: "Zero-copy, reallocation, and closing accounts",
        order: 1,
        lessons: [
          {
            id: "ail3",
            title: "Zero-Copy Accounts",
            description: "Handling large accounts efficiently",
            order: 2,
            type: "content",
            xpReward: 45,
            duration: "25 min",
            content:
              "# Zero-Copy Accounts\n\nFor accounts larger than 10KB, Anchor's default deserialization becomes expensive. Zero-copy accesses data in-place without copying.\n\n## Standard vs Zero-Copy\n\n```rust\n// Standard: Deserializes entire account into memory\n#[account]\npub struct SmallState {\n    pub authority: Pubkey,\n    pub count: u64,\n}\n\n// Zero-Copy: Access data directly from account buffer\n#[account(zero_copy)]\n#[repr(C)]\npub struct LargeState {\n    pub authority: Pubkey,\n    pub entries: [Entry; 1000], // Large fixed-size array\n}\n```\n\n## Using Zero-Copy\n\n```rust\n#[derive(Accounts)]\npub struct UpdateEntry<'info> {\n    #[account(mut)]\n    pub state: AccountLoader<'info, LargeState>, // Not Account<>\n}\n\npub fn update_entry(ctx: Context<UpdateEntry>, index: u32, value: u64) -> Result<()> {\n    let mut state = ctx.accounts.state.load_mut()?;\n    state.entries[index as usize].value = value;\n    Ok(())\n}\n```\n\n## Rules for Zero-Copy\n\n1. Must use `#[repr(C)]` for deterministic memory layout\n2. All fields must be `Copy` + `Pod` compatible\n3. No `String`, `Vec`, or `Option` — use fixed-size alternatives\n4. Use `AccountLoader` instead of `Account` in contexts\n5. Call `.load()` for read and `.load_mut()` for write\n\n## When to Use\n\n| Account Size | Approach |\n|-------------|----------|\n| < 1 KB | Standard `#[account]` |\n| 1-10 KB | Standard is fine |\n| > 10 KB | Consider zero-copy |\n| > 100 KB | Definitely zero-copy |",
          },
          {
            id: "ail4",
            title: "Account Reallocation",
            description: "Resizing accounts after creation",
            order: 3,
            type: "content",
            xpReward: 45,
            duration: "25 min",
            content:
              "# Account Reallocation\n\nSometimes accounts need more space after initialization (e.g., adding items to a list).\n\n## The realloc Constraint\n\n```rust\n#[derive(Accounts)]\npub struct AddItem<'info> {\n    #[account(\n        mut,\n        realloc = 8 + 32 + 4 + (items.len() + 1) * ItemEntry::SIZE,\n        realloc::payer = payer,\n        realloc::zero = false,\n    )]\n    pub list: Account<'info, ItemList>,\n    #[account(mut)]\n    pub payer: Signer<'info>,\n    pub system_program: Program<'info, System>,\n}\n```\n\n## Parameters\n\n| Parameter | Purpose |\n|-----------|--------|\n| `realloc = <size>` | New total size in bytes |\n| `realloc::payer` | Who pays for additional rent (or receives refund) |\n| `realloc::zero = false` | Whether to zero new bytes (false = faster) |\n\n## How It Works\n\n1. If new size > old size: transfer lamports from payer for additional rent\n2. If new size < old size: refund excess lamports to payer\n3. The runtime resizes the account data buffer\n\n## Practical Example\n\n```rust\n#[account]\npub struct TodoList {\n    pub authority: Pubkey,\n    pub items: Vec<TodoItem>,\n}\n\n#[derive(AnchorSerialize, AnchorDeserialize, Clone)]\npub struct TodoItem {\n    pub title: [u8; 32],\n    pub completed: bool,\n}\n\nimpl TodoItem {\n    pub const SIZE: usize = 32 + 1;\n}\n\npub fn add_todo(ctx: Context<AddTodo>, title: [u8; 32]) -> Result<()> {\n    let list = &mut ctx.accounts.todo_list;\n    require!(list.items.len() < 100, ErrorCode::ListFull);\n    list.items.push(TodoItem { title, completed: false });\n    Ok(())\n}\n```\n\n## Limits\n\n- Max account size: 10MB\n- Realloc can only increase by 10KB per instruction\n- For larger increases, call realloc across multiple instructions",
          },
          {
            id: "ail5",
            title: "Closing Accounts Safely",
            description: "Reclaiming rent and preventing exploits",
            order: 4,
            type: "content",
            xpReward: 45,
            duration: "25 min",
            content:
              "# Closing Accounts Safely\n\nClosing accounts reclaims rent-exempt SOL. But improper closing creates security risks.\n\n## The close Constraint\n\n```rust\n#[derive(Accounts)]\npub struct CloseEnrollment<'info> {\n    #[account(\n        mut,\n        close = user,\n        has_one = user,\n        seeds = [b\"enrollment\", course_id.as_bytes(), user.key().as_ref()],\n        bump = enrollment.bump,\n    )]\n    pub enrollment: Account<'info, Enrollment>,\n    #[account(mut)]\n    pub user: Signer<'info>,\n}\n```\n\n## What Anchor Does\n\n1. Transfers all lamports to the `close` recipient\n2. Zeros all account data\n3. Sets owner to System Program\n4. Writes `CLOSED` discriminator (prevents re-init)\n\n## Security Considerations\n\n### 1. Verify State Before Closing\n```rust\npub fn close_enrollment(ctx: Context<CloseEnrollment>) -> Result<()> {\n    // Only allow closing completed or abandoned enrollments\n    let enrollment = &ctx.accounts.enrollment;\n    require!(\n        enrollment.completed || !enrollment.is_active,\n        ErrorCode::EnrollmentStillActive\n    );\n    Ok(())\n}\n```\n\n### 2. Update Related State\n```rust\npub fn close_enrollment(ctx: Context<CloseEnrollment>) -> Result<()> {\n    // Decrement course enrollment count\n    let course = &mut ctx.accounts.course;\n    course.total_enrollments = course.total_enrollments\n        .checked_sub(1).unwrap();\n    // Account closed by constraint\n    Ok(())\n}\n```\n\n### 3. Prevent Revival\nAnchor v0.26+ handles this automatically with the `CLOSED` discriminator. For older versions:\n```rust\n// Manual close (native programs)\nlet dest_starting_lamports = dest.lamports();\n**dest.lamports.borrow_mut() = dest_starting_lamports\n    .checked_add(source.lamports()).unwrap();\n**source.lamports.borrow_mut() = 0;\nsource.data.borrow_mut().fill(0);\nsource.assign(&system_program::ID);\n```\n\n## Best Practice: Close to Protocol Treasury\n\nInstead of returning rent to users (who might replay the close):\n```rust\n#[account(mut, close = protocol_treasury)]\npub account: Account<'info, MyData>,\n#[account(mut, seeds = [b\"treasury\"], bump)]\npub protocol_treasury: SystemAccount<'info>,\n```",
          },
          {
            id: "ail6",
            title: "Account Patterns Challenge",
            description: "Implement advanced account management",
            order: 5,
            type: "challenge",
            xpReward: 80,
            duration: "35 min",
            challenge: {
              language: "rust",
              prompt:
                "Build a dynamic leaderboard using realloc and account closing.",
              starterCode:
                'use anchor_lang::prelude::*;\n\ndeclare_id!("11111111111111111111111111111111");\n\n#[program]\npub mod leaderboard {\n    use super::*;\n\n    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {\n        // Initialize empty leaderboard\n        todo!()\n    }\n\n    pub fn add_entry(\n        ctx: Context<AddEntry>,\n        player_name: [u8; 32],\n        score: u64,\n    ) -> Result<()> {\n        // Add player to leaderboard\n        // Keep entries sorted by score (descending)\n        // Max 50 entries\n        todo!()\n    }\n\n    pub fn remove_entry(\n        ctx: Context<RemoveEntry>,\n        player_name: [u8; 32],\n    ) -> Result<()> {\n        // Remove a player entry (authority only)\n        // Reallocate to shrink account\n        todo!()\n    }\n\n    pub fn close_leaderboard(ctx: Context<CloseLeaderboard>) -> Result<()> {\n        // Close leaderboard (authority only)\n        // Must be empty first\n        todo!()\n    }\n}\n\n#[account]\npub struct Leaderboard {\n    pub authority: Pubkey,\n    pub season: u16,\n    pub entries: Vec<LeaderEntry>,\n    pub bump: u8,\n}\n\n#[derive(AnchorSerialize, AnchorDeserialize, Clone)]\npub struct LeaderEntry {\n    pub player: [u8; 32],\n    pub score: u64,\n}\n\nimpl LeaderEntry {\n    pub const SIZE: usize = 32 + 8;\n}\n\n// Define all account contexts with proper constraints\n// Use realloc for add/remove\n// Use close for close_leaderboard',
              solution:
                'use anchor_lang::prelude::*;\n\ndeclare_id!("11111111111111111111111111111111");\n\nconst MAX_ENTRIES: usize = 50;\nconst BASE_SIZE: usize = 8 + 32 + 2 + 4 + 1; // discriminator + authority + season + vec_len + bump\n\n#[program]\npub mod leaderboard {\n    use super::*;\n\n    pub fn initialize(ctx: Context<Initialize>, season: u16) -> Result<()> {\n        let board = &mut ctx.accounts.leaderboard;\n        board.authority = ctx.accounts.authority.key();\n        board.season = season;\n        board.entries = Vec::new();\n        board.bump = ctx.bumps.leaderboard;\n        Ok(())\n    }\n\n    pub fn add_entry(\n        ctx: Context<AddEntry>,\n        player_name: [u8; 32],\n        score: u64,\n    ) -> Result<()> {\n        let board = &mut ctx.accounts.leaderboard;\n        require!(board.entries.len() < MAX_ENTRIES, ErrorCode::LeaderboardFull);\n\n        let entry = LeaderEntry { player: player_name, score };\n        let pos = board.entries.iter()\n            .position(|e| e.score < score)\n            .unwrap_or(board.entries.len());\n        board.entries.insert(pos, entry);\n        Ok(())\n    }\n\n    pub fn remove_entry(\n        ctx: Context<RemoveEntry>,\n        player_name: [u8; 32],\n    ) -> Result<()> {\n        let board = &mut ctx.accounts.leaderboard;\n        let pos = board.entries.iter()\n            .position(|e| e.player == player_name)\n            .ok_or(ErrorCode::EntryNotFound)?;\n        board.entries.remove(pos);\n        Ok(())\n    }\n\n    pub fn close_leaderboard(ctx: Context<CloseLeaderboard>) -> Result<()> {\n        let board = &ctx.accounts.leaderboard;\n        require!(board.entries.is_empty(), ErrorCode::LeaderboardNotEmpty);\n        Ok(())\n    }\n}\n\n#[derive(Accounts)]\npub struct Initialize<\'info> {\n    #[account(\n        init,\n        seeds = [b"leaderboard", authority.key().as_ref()],\n        bump,\n        payer = authority,\n        space = BASE_SIZE,\n    )]\n    pub leaderboard: Account<\'info, Leaderboard>,\n    #[account(mut)]\n    pub authority: Signer<\'info>,\n    pub system_program: Program<\'info, System>,\n}\n\n#[derive(Accounts)]\npub struct AddEntry<\'info> {\n    #[account(\n        mut,\n        realloc = BASE_SIZE + (leaderboard.entries.len() + 1) * LeaderEntry::SIZE,\n        realloc::payer = authority,\n        realloc::zero = false,\n        seeds = [b"leaderboard", authority.key().as_ref()],\n        bump = leaderboard.bump,\n        has_one = authority,\n    )]\n    pub leaderboard: Account<\'info, Leaderboard>,\n    #[account(mut)]\n    pub authority: Signer<\'info>,\n    pub system_program: Program<\'info, System>,\n}\n\n#[derive(Accounts)]\npub struct RemoveEntry<\'info> {\n    #[account(\n        mut,\n        realloc = BASE_SIZE + (leaderboard.entries.len() - 1) * LeaderEntry::SIZE,\n        realloc::payer = authority,\n        realloc::zero = false,\n        seeds = [b"leaderboard", authority.key().as_ref()],\n        bump = leaderboard.bump,\n        has_one = authority,\n    )]\n    pub leaderboard: Account<\'info, Leaderboard>,\n    #[account(mut)]\n    pub authority: Signer<\'info>,\n    pub system_program: Program<\'info, System>,\n}\n\n#[derive(Accounts)]\npub struct CloseLeaderboard<\'info> {\n    #[account(\n        mut,\n        close = authority,\n        seeds = [b"leaderboard", authority.key().as_ref()],\n        bump = leaderboard.bump,\n        has_one = authority,\n    )]\n    pub leaderboard: Account<\'info, Leaderboard>,\n    #[account(mut)]\n    pub authority: Signer<\'info>,\n}\n\n#[account]\npub struct Leaderboard {\n    pub authority: Pubkey,\n    pub season: u16,\n    pub entries: Vec<LeaderEntry>,\n    pub bump: u8,\n}\n\n#[derive(AnchorSerialize, AnchorDeserialize, Clone)]\npub struct LeaderEntry {\n    pub player: [u8; 32],\n    pub score: u64,\n}\n\nimpl LeaderEntry {\n    pub const SIZE: usize = 32 + 8;\n}\n\n#[error_code]\npub enum ErrorCode {\n    #[msg("Leaderboard is full")]\n    LeaderboardFull,\n    #[msg("Entry not found")]\n    EntryNotFound,\n    #[msg("Leaderboard must be empty to close")]\n    LeaderboardNotEmpty,\n}',
              testCases: [
                {
                  id: "t1",
                  name: "Initializes empty leaderboard",
                  input: "season: 1",
                  expectedOutput: "empty entries",
                },
                {
                  id: "t2",
                  name: "Adds entries sorted",
                  input: "score: 100, then 200",
                  expectedOutput: "[200, 100]",
                },
                {
                  id: "t3",
                  name: "Reallocates on add/remove",
                  input: "add entry",
                  expectedOutput: "realloc constraint",
                },
                {
                  id: "t4",
                  name: "Close requires empty",
                  input: "close with entries",
                  expectedOutput: "error",
                },
              ],
              hints: [
                "Use realloc with (entries.len() + 1) * SIZE for add",
                "Insert at the correct position to maintain descending sort",
                "Require entries.is_empty() before closing",
                "Use PDA seeds with authority for unique leaderboards",
              ],
            },
          },
        ],
      },
      {
        id: "aim3",
        title: "Events & Error Handling",
        description: "Custom errors, events, and program logging",
        order: 2,
        lessons: [
          {
            id: "ail7",
            title: "Advanced Error Handling",
            description: "Custom errors and client-side handling",
            order: 6,
            type: "content",
            xpReward: 40,
            duration: "20 min",
            content:
              "# Advanced Error Handling\n\n## Error Code Ranges\n\nAnchor errors have specific ranges:\n\n| Range | Source |\n|-------|--------|\n| 0-99 | Anchor framework errors |\n| 100-299 | Anchor account errors |\n| 300-4999 | Anchor constraint errors |\n| 6000+ | Your custom errors |\n\n## Defining Errors with Context\n\n```rust\n#[error_code]\npub enum AcademyError {\n    #[msg(\"Course {course_id} has reached maximum enrollments\")]\n    CourseFullyEnrolled,\n\n    #[msg(\"Lesson {lesson_id} has already been completed\")]\n    LessonAlreadyCompleted,\n\n    #[msg(\"Daily XP cap exceeded: {current}/{max}\")]\n    DailyXpCapExceeded,\n\n    #[msg(\"Streak expired: last activity was {days_ago} days ago\")]\n    StreakExpired,\n}\n```\n\n## Conditional Error Macros\n\n```rust\n// Simple condition\nrequire!(amount > 0, AcademyError::ZeroAmount);\n\n// Equality check\nrequire_eq!(profile.user, ctx.accounts.user.key(), AcademyError::Unauthorized);\n\n// Key comparison\nrequire_keys_eq!(config.authority, signer.key(), AcademyError::Unauthorized);\n\n// Greater than\nrequire_gt!(max_lessons, completed_count, AcademyError::AllLessonsComplete);\n```\n\n## Client-Side Error Parsing\n\n```typescript\nimport { AnchorError } from '@coral-xyz/anchor';\n\ntry {\n  await program.methods.enroll().accounts({...}).rpc();\n} catch (e) {\n  if (e instanceof AnchorError) {\n    switch (e.error.errorCode.code) {\n      case 'CourseFullyEnrolled':\n        showNotification('This course is full');\n        break;\n      case 'DailyXpCapExceeded':\n        showNotification('Come back tomorrow!');\n        break;\n      default:\n        showNotification(e.error.errorMessage);\n    }\n  }\n}\n```",
          },
          {
            id: "ail8",
            title: "Emitting & Subscribing to Events",
            description: "On-chain events and client subscriptions",
            order: 7,
            type: "content",
            xpReward: 40,
            duration: "20 min",
            content:
              "# Emitting & Subscribing to Events\n\nEvents allow programs to emit structured data that clients can listen for.\n\n## Defining Events\n\n```rust\n#[event]\npub struct CourseCompleted {\n    pub learner: Pubkey,\n    pub course_id: String,\n    pub xp_earned: u64,\n    pub timestamp: i64,\n}\n\n#[event]\npub struct StreakUpdated {\n    pub learner: Pubkey,\n    pub new_streak: u16,\n    pub is_record: bool,\n}\n\n#[event]\npub struct AchievementUnlocked {\n    pub learner: Pubkey,\n    pub achievement_id: u8,\n    pub xp_bonus: u64,\n}\n```\n\n## Emitting Events\n\n```rust\npub fn finalize_course(ctx: Context<Finalize>) -> Result<()> {\n    let profile = &mut ctx.accounts.profile;\n    let course = &ctx.accounts.course;\n    let clock = Clock::get()?;\n\n    // Update state...\n    profile.xp = profile.xp.checked_add(course.xp_reward).unwrap();\n\n    // Emit event\n    emit!(CourseCompleted {\n        learner: profile.user,\n        course_id: course.course_id.clone(),\n        xp_earned: course.xp_reward,\n        timestamp: clock.unix_timestamp,\n    });\n\n    Ok(())\n}\n```\n\n## Listening on the Client\n\n```typescript\n// Subscribe to events\nconst listener = program.addEventListener('CourseCompleted', (event) => {\n  console.log(`${event.learner} completed ${event.courseId}`);\n  console.log(`Earned ${event.xpEarned} XP`);\n  updateLeaderboard();\n});\n\n// Parse events from transaction logs\nconst tx = await connection.getTransaction(sig, { commitment: 'confirmed' });\nconst events = program.coder.events.decode(tx.meta.logMessages);\n```\n\n## Event Best Practices\n\n1. Emit events for all state changes (useful for indexing)\n2. Include enough data to reconstruct state without RPC calls\n3. Use events for analytics and monitoring\n4. Don't store large data in events — use Pubkeys to reference accounts",
          },
          {
            id: "ail9",
            title: "Events & Errors Challenge",
            description:
              "Build a program with comprehensive error handling and events",
            order: 8,
            type: "challenge",
            xpReward: 75,
            duration: "35 min",
            challenge: {
              language: "rust",
              prompt:
                "Add proper error handling and events to this course enrollment program.",
              starterCode:
                'use anchor_lang::prelude::*;\n\ndeclare_id!("11111111111111111111111111111111");\n\n#[program]\npub mod enrollment {\n    use super::*;\n\n    pub fn enroll(ctx: Context<Enroll>) -> Result<()> {\n        let course = &mut ctx.accounts.course;\n        let enrollment = &mut ctx.accounts.enrollment;\n\n        // TODO: Add checks with custom errors:\n        // 1. Course must be active\n        // 2. Course not at max capacity (100)\n        // 3. User not already enrolled (enrollment.is_active == false)\n\n        enrollment.user = ctx.accounts.user.key();\n        enrollment.course_id = course.course_id.clone();\n        enrollment.is_active = true;\n        enrollment.enrolled_at = Clock::get()?.unix_timestamp;\n        enrollment.lessons_completed = 0;\n\n        course.total_enrollments += 1;\n\n        // TODO: Emit EnrollmentCreated event\n\n        Ok(())\n    }\n\n    pub fn complete_lesson(ctx: Context<CompleteLesson>, lesson_index: u8) -> Result<()> {\n        let enrollment = &mut ctx.accounts.enrollment;\n        let course = &ctx.accounts.course;\n\n        // TODO: Add checks with custom errors:\n        // 1. Enrollment must be active\n        // 2. Lesson index must be valid (< course.total_lessons)\n        // 3. Lesson not already completed (check bitmap)\n\n        // Mark lesson in bitmap\n        enrollment.lesson_bitmap |= 1u64 << lesson_index;\n        enrollment.lessons_completed += 1;\n\n        // TODO: Emit LessonCompleted event\n        // TODO: If all lessons done, emit CourseCompleted event\n\n        Ok(())\n    }\n}\n\n// TODO: Define account contexts, state structs, events, and errors',
              solution:
                'use anchor_lang::prelude::*;\n\ndeclare_id!("11111111111111111111111111111111");\n\n#[program]\npub mod enrollment {\n    use super::*;\n\n    pub fn enroll(ctx: Context<Enroll>) -> Result<()> {\n        let course = &mut ctx.accounts.course;\n        let enrollment = &mut ctx.accounts.enrollment;\n\n        require!(course.is_active, EnrollmentError::CourseInactive);\n        require!(course.total_enrollments < 100, EnrollmentError::CourseFull);\n        require!(!enrollment.is_active, EnrollmentError::AlreadyEnrolled);\n\n        enrollment.user = ctx.accounts.user.key();\n        enrollment.course_id = course.course_id.clone();\n        enrollment.is_active = true;\n        enrollment.enrolled_at = Clock::get()?.unix_timestamp;\n        enrollment.lessons_completed = 0;\n        enrollment.lesson_bitmap = 0;\n        enrollment.bump = ctx.bumps.enrollment;\n\n        course.total_enrollments = course.total_enrollments.checked_add(1).unwrap();\n\n        emit!(EnrollmentCreated {\n            user: ctx.accounts.user.key(),\n            course_id: course.course_id.clone(),\n            timestamp: enrollment.enrolled_at,\n        });\n\n        Ok(())\n    }\n\n    pub fn complete_lesson(ctx: Context<CompleteLesson>, lesson_index: u8) -> Result<()> {\n        let enrollment = &mut ctx.accounts.enrollment;\n        let course = &ctx.accounts.course;\n        let clock = Clock::get()?;\n\n        require!(enrollment.is_active, EnrollmentError::NotEnrolled);\n        require!((lesson_index as u16) < course.total_lessons, EnrollmentError::InvalidLesson);\n        require!(\n            enrollment.lesson_bitmap & (1u64 << lesson_index) == 0,\n            EnrollmentError::LessonAlreadyCompleted\n        );\n\n        enrollment.lesson_bitmap |= 1u64 << lesson_index;\n        enrollment.lessons_completed = enrollment.lessons_completed.checked_add(1).unwrap();\n\n        emit!(LessonCompleted {\n            user: enrollment.user,\n            course_id: enrollment.course_id.clone(),\n            lesson_index,\n            total_completed: enrollment.lessons_completed,\n            timestamp: clock.unix_timestamp,\n        });\n\n        if enrollment.lessons_completed as u16 == course.total_lessons {\n            emit!(CourseCompleted {\n                user: enrollment.user,\n                course_id: enrollment.course_id.clone(),\n                timestamp: clock.unix_timestamp,\n            });\n        }\n\n        Ok(())\n    }\n}\n\n#[derive(Accounts)]\npub struct Enroll<\'info> {\n    #[account(\n        mut,\n        seeds = [b"course", course.course_id.as_bytes()],\n        bump = course.bump,\n    )]\n    pub course: Account<\'info, Course>,\n    #[account(\n        init,\n        seeds = [b"enrollment", course.course_id.as_bytes(), user.key().as_ref()],\n        bump,\n        payer = user,\n        space = 8 + Enrollment::INIT_SPACE,\n    )]\n    pub enrollment: Account<\'info, Enrollment>,\n    #[account(mut)]\n    pub user: Signer<\'info>,\n    pub system_program: Program<\'info, System>,\n}\n\n#[derive(Accounts)]\npub struct CompleteLesson<\'info> {\n    pub course: Account<\'info, Course>,\n    #[account(\n        mut,\n        seeds = [b"enrollment", course.course_id.as_bytes(), user.key().as_ref()],\n        bump = enrollment.bump,\n        has_one = user,\n    )]\n    pub enrollment: Account<\'info, Enrollment>,\n    pub user: Signer<\'info>,\n}\n\n#[account]\n#[derive(InitSpace)]\npub struct Course {\n    #[max_len(32)]\n    pub course_id: String,\n    pub is_active: bool,\n    pub total_lessons: u16,\n    pub total_enrollments: u16,\n    pub bump: u8,\n}\n\n#[account]\n#[derive(InitSpace)]\npub struct Enrollment {\n    pub user: Pubkey,\n    #[max_len(32)]\n    pub course_id: String,\n    pub is_active: bool,\n    pub enrolled_at: i64,\n    pub lessons_completed: u8,\n    pub lesson_bitmap: u64,\n    pub bump: u8,\n}\n\n#[event]\npub struct EnrollmentCreated {\n    pub user: Pubkey,\n    pub course_id: String,\n    pub timestamp: i64,\n}\n\n#[event]\npub struct LessonCompleted {\n    pub user: Pubkey,\n    pub course_id: String,\n    pub lesson_index: u8,\n    pub total_completed: u8,\n    pub timestamp: i64,\n}\n\n#[event]\npub struct CourseCompleted {\n    pub user: Pubkey,\n    pub course_id: String,\n    pub timestamp: i64,\n}\n\n#[error_code]\npub enum EnrollmentError {\n    #[msg("Course is not active")]\n    CourseInactive,\n    #[msg("Course is at maximum capacity")]\n    CourseFull,\n    #[msg("Already enrolled in this course")]\n    AlreadyEnrolled,\n    #[msg("Not enrolled in this course")]\n    NotEnrolled,\n    #[msg("Invalid lesson index")]\n    InvalidLesson,\n    #[msg("Lesson already completed")]\n    LessonAlreadyCompleted,\n}',
              testCases: [
                {
                  id: "t1",
                  name: "Enrollment checks",
                  input: "inactive course",
                  expectedOutput: "CourseInactive",
                },
                {
                  id: "t2",
                  name: "Lesson bitmap",
                  input: "complete lesson 0 twice",
                  expectedOutput: "LessonAlreadyCompleted",
                },
                {
                  id: "t3",
                  name: "Events emitted",
                  input: "enroll + complete",
                  expectedOutput: "emit! calls",
                },
                {
                  id: "t4",
                  name: "Course completion event",
                  input: "all lessons done",
                  expectedOutput: "CourseCompleted event",
                },
              ],
              hints: [
                "Use require!() with custom error variants for each check",
                "Check bitmap with: bitmap & (1 << index) == 0",
                "Emit events after state changes, not before",
                "Compare lessons_completed == total_lessons for course completion",
              ],
            },
          },
        ],
      },
      {
        id: "aim4",
        title: "Token-2022 Integration",
        description: "Working with Token-2022 extensions in Anchor",
        order: 3,
        lessons: [
          {
            id: "ail10",
            title: "Token-2022 Extensions Overview",
            description: "Understanding Token-2022 and its extensions",
            order: 9,
            type: "content",
            xpReward: 50,
            duration: "25 min",
            content:
              "# Token-2022 Extensions Overview\n\nToken-2022 (Token Extensions Program) extends the original SPL Token with powerful new features.\n\n## Why Token-2022?\n\nThe original Token Program is frozen — no new features. Token-2022 adds:\n\n| Extension | Use Case |\n|-----------|----------|\n| **NonTransferable** | Soulbound tokens, credentials |\n| **PermanentDelegate** | Platform-controlled burn/transfer |\n| **TransferFee** | Built-in royalties on transfers |\n| **MetadataPointer** | On-chain metadata without Metaplex |\n| **TokenMetadata** | Metadata stored in the mint account |\n| **ConfidentialTransfer** | Zero-knowledge private balances |\n| **TransferHook** | Custom logic on every transfer |\n| **MintCloseAuthority** | Close empty mints to reclaim rent |\n| **DefaultAccountState** | Accounts start frozen |\n| **InterestBearing** | Display accrued interest |\n\n## Superteam Academy Use Case\n\nXP tokens use Token-2022 with:\n- **NonTransferable** — XP can't be traded\n- **PermanentDelegate** — Platform can burn if needed\n- **MetadataPointer** — On-chain metadata for display\n\n```rust\n// XP token = soulbound, non-tradeable credential\nExtensions: [NonTransferable, PermanentDelegate, MetadataPointer]\n```\n\n## Token-2022 Program ID\n\n```rust\nuse anchor_spl::token_2022::Token2022;\n\n// Program ID: TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb\npub token_program: Program<'info, Token2022>,\n```\n\n## Extension Space Calculation\n\nEach extension adds bytes to the mint or token account:\n```rust\nlet space = ExtensionType::try_calculate_account_len::<Mint>(&[\n    ExtensionType::NonTransferable,\n    ExtensionType::PermanentDelegate,\n    ExtensionType::MetadataPointer,\n])?;\n```",
          },
          {
            id: "ail11",
            title: "Creating Mints with Extensions",
            description: "Initialize Token-2022 mints with extensions",
            order: 10,
            type: "content",
            xpReward: 55,
            duration: "30 min",
            content:
              '# Creating Mints with Extensions\n\nToken-2022 mints must be initialized with extensions before the mint itself.\n\n## The Initialization Order\n\n```\n1. Create account with extension space\n2. Initialize each extension\n3. Initialize the mint (must be LAST)\n```\n\n## Example: Soulbound XP Token\n\n```rust\nuse anchor_lang::prelude::*;\nuse anchor_spl::token_2022::{\n    self,\n    spl_token_2022::{\n        extension::{\n            non_transferable::NonTransferable,\n            permanent_delegate::PermanentDelegate,\n            metadata_pointer::MetadataPointer,\n            ExtensionType,\n        },\n        instruction as token_instruction,\n    },\n};\n\npub fn create_xp_mint(ctx: Context<CreateXpMint>) -> Result<()> {\n    let mint = &ctx.accounts.xp_mint;\n    let config = &ctx.accounts.config;\n\n    // 1. Initialize NonTransferable extension\n    invoke(\n        &token_instruction::initialize_non_transferable_mint(\n            &token_2022::ID,\n            &mint.key(),\n        )?,\n        &[mint.to_account_info()],\n    )?;\n\n    // 2. Initialize PermanentDelegate extension\n    invoke(\n        &token_instruction::initialize_permanent_delegate(\n            &token_2022::ID,\n            &mint.key(),\n            &config.key(), // Config PDA is permanent delegate\n        )?,\n        &[mint.to_account_info()],\n    )?;\n\n    // 3. Initialize MetadataPointer extension\n    invoke(\n        &token_instruction::initialize_metadata_pointer(\n            &token_2022::ID,\n            &mint.key(),\n            Some(config.key()),\n            Some(mint.key()), // Metadata stored on mint itself\n        )?,\n        &[mint.to_account_info()],\n    )?;\n\n    // 4. Initialize the mint LAST\n    invoke(\n        &token_instruction::initialize_mint2(\n            &token_2022::ID,\n            &mint.key(),\n            &config.key(), // Mint authority = Config PDA\n            None,          // No freeze authority\n            0,             // 0 decimals for XP\n        )?,\n        &[mint.to_account_info()],\n    )?;\n\n    Ok(())\n}\n```\n\n## Account Space\n\n```rust\nlet extensions = &[\n    ExtensionType::NonTransferable,\n    ExtensionType::PermanentDelegate,\n    ExtensionType::MetadataPointer,\n];\nlet space = ExtensionType::try_calculate_account_len::<Mint>(extensions)?;\nlet rent = Rent::get()?.minimum_balance(space);\n```\n\n## Minting Soulbound Tokens\n\n```rust\n// Mint XP to learner (only config PDA can mint)\nlet seeds = &[b"config", &[config.bump]];\ntoken_2022::mint_to(\n    CpiContext::new_with_signer(\n        ctx.accounts.token_program.to_account_info(),\n        token_2022::MintTo {\n            mint: ctx.accounts.xp_mint.to_account_info(),\n            to: ctx.accounts.learner_xp_account.to_account_info(),\n            authority: config.to_account_info(),\n        },\n        &[seeds],\n    ),\n    xp_amount,\n)?;\n```',
          },
          {
            id: "ail12",
            title: "Transfer Hooks & Fees",
            description: "Custom transfer logic and built-in fees",
            order: 11,
            type: "content",
            xpReward: 55,
            duration: "30 min",
            content:
              "# Transfer Hooks & Fees\n\n## Transfer Fee Extension\n\nCharge a fee on every token transfer, built into the token itself.\n\n```rust\n// Initialize transfer fee on mint creation\nlet fee_config = TransferFeeConfig {\n    transfer_fee_config_authority: Some(authority),\n    withdraw_withheld_authority: Some(authority),\n    older_transfer_fee: TransferFee {\n        epoch: 0,\n        maximum_fee: 1_000_000,     // Max fee per transfer\n        transfer_fee_basis_points: 250, // 2.5%\n    },\n    newer_transfer_fee: TransferFee {\n        epoch: 0,\n        maximum_fee: 1_000_000,\n        transfer_fee_basis_points: 250,\n    },\n};\n```\n\n### How Transfer Fees Work\n\n```\nUser sends 1000 tokens (2.5% fee):\n  Fee: 25 tokens (withheld in recipient's account)\n  Received: 975 tokens\n  Withheld fees can be harvested by the authority\n```\n\n### Harvesting Fees\n\n```typescript\n// Collect withheld fees from all token accounts\nawait harvestWithheldTokensToMint(connection, payer, mint, [tokenAccount1, tokenAccount2]);\n// Then withdraw from mint to treasury\nawait withdrawWithheldTokensFromMint(connection, payer, mint, treasury, authority);\n```\n\n## Transfer Hook Extension\n\nExecute custom program logic on every transfer.\n\n```rust\n// Transfer Hook program must implement:\n#[interface]\npub trait TransferHook {\n    fn execute(ctx: Context<Execute>, amount: u64) -> Result<()>;\n}\n\n// Example: KYC check on transfer\npub fn execute(ctx: Context<Execute>, amount: u64) -> Result<()> {\n    // Check if both sender and receiver are KYC'd\n    let sender_kyc = &ctx.accounts.sender_kyc;\n    let receiver_kyc = &ctx.accounts.receiver_kyc;\n    require!(sender_kyc.verified, ErrorCode::SenderNotKYC);\n    require!(receiver_kyc.verified, ErrorCode::ReceiverNotKYC);\n    Ok(())\n}\n```\n\n### Transfer Hook Use Cases\n\n| Use Case | Logic |\n|----------|-------|\n| KYC/AML | Verify both parties are approved |\n| Transfer limits | Cap daily/weekly transfer amounts |\n| Blacklist | Block sanctioned addresses |\n| Royalties | Route fees to creators |\n| Analytics | Log transfer metadata |",
          },
          {
            id: "ail13",
            title: "Token-2022 Challenge",
            description: "Create a soulbound token with extensions",
            order: 12,
            type: "challenge",
            xpReward: 90,
            duration: "40 min",
            challenge: {
              language: "typescript",
              prompt:
                "Write the client-side code to create a Token-2022 mint with NonTransferable and PermanentDelegate extensions, then mint tokens to a user.",
              starterCode:
                "import {\n  Connection, Keypair, SystemProgram, Transaction,\n  sendAndConfirmTransaction, PublicKey,\n} from '@solana/web3.js';\nimport {\n  ExtensionType, TOKEN_2022_PROGRAM_ID,\n  getMintLen, createInitializeMintInstruction,\n  createInitializeNonTransferableMintInstruction,\n  createInitializePermanentDelegateInstruction,\n  createMintToInstruction,\n  createAssociatedTokenAccountInstruction,\n  getAssociatedTokenAddressSync,\n  ASSOCIATED_TOKEN_PROGRAM_ID,\n} from '@solana/spl-token';\n\nasync function createSoulboundMint(\n  connection: Connection,\n  payer: Keypair,\n  authority: PublicKey,\n): Promise<{ mint: Keypair; signature: string }> {\n  // 1. Generate a new mint keypair\n  // 2. Calculate space for NonTransferable + PermanentDelegate extensions\n  // 3. Build transaction with:\n  //    a. createAccount (with correct space and rent)\n  //    b. initializeNonTransferableMint\n  //    c. initializePermanentDelegate (delegate = authority)\n  //    d. initializeMint (decimals=0, authority, no freeze)\n  // 4. Send and confirm\n  // Return { mint, signature }\n}\n\nasync function mintSoulboundTokens(\n  connection: Connection,\n  payer: Keypair,\n  mint: PublicKey,\n  authority: Keypair,\n  recipient: PublicKey,\n  amount: number,\n): Promise<string> {\n  // 1. Get or create ATA for recipient (using TOKEN_2022_PROGRAM_ID)\n  // 2. Mint tokens to the ATA\n  // 3. Return signature\n}",
              solution:
                "import {\n  Connection, Keypair, SystemProgram, Transaction,\n  sendAndConfirmTransaction, PublicKey,\n} from '@solana/web3.js';\nimport {\n  ExtensionType, TOKEN_2022_PROGRAM_ID,\n  getMintLen, createInitializeMintInstruction,\n  createInitializeNonTransferableMintInstruction,\n  createInitializePermanentDelegateInstruction,\n  createMintToInstruction,\n  createAssociatedTokenAccountInstruction,\n  getAssociatedTokenAddressSync,\n  ASSOCIATED_TOKEN_PROGRAM_ID,\n} from '@solana/spl-token';\n\nasync function createSoulboundMint(\n  connection: Connection,\n  payer: Keypair,\n  authority: PublicKey,\n): Promise<{ mint: Keypair; signature: string }> {\n  const mint = Keypair.generate();\n  const extensions = [ExtensionType.NonTransferable, ExtensionType.PermanentDelegate];\n  const mintLen = getMintLen(extensions);\n  const rent = await connection.getMinimumBalanceForRentExemption(mintLen);\n\n  const tx = new Transaction().add(\n    SystemProgram.createAccount({\n      fromPubkey: payer.publicKey,\n      newAccountPubkey: mint.publicKey,\n      space: mintLen,\n      lamports: rent,\n      programId: TOKEN_2022_PROGRAM_ID,\n    }),\n    createInitializeNonTransferableMintInstruction(\n      mint.publicKey,\n      TOKEN_2022_PROGRAM_ID,\n    ),\n    createInitializePermanentDelegateInstruction(\n      mint.publicKey,\n      authority,\n      TOKEN_2022_PROGRAM_ID,\n    ),\n    createInitializeMintInstruction(\n      mint.publicKey,\n      0,\n      authority,\n      null,\n      TOKEN_2022_PROGRAM_ID,\n    ),\n  );\n\n  const signature = await sendAndConfirmTransaction(connection, tx, [payer, mint]);\n  return { mint, signature };\n}\n\nasync function mintSoulboundTokens(\n  connection: Connection,\n  payer: Keypair,\n  mint: PublicKey,\n  authority: Keypair,\n  recipient: PublicKey,\n  amount: number,\n): Promise<string> {\n  const ata = getAssociatedTokenAddressSync(\n    mint,\n    recipient,\n    false,\n    TOKEN_2022_PROGRAM_ID,\n    ASSOCIATED_TOKEN_PROGRAM_ID,\n  );\n\n  const tx = new Transaction();\n\n  const ataInfo = await connection.getAccountInfo(ata);\n  if (!ataInfo) {\n    tx.add(\n      createAssociatedTokenAccountInstruction(\n        payer.publicKey,\n        ata,\n        recipient,\n        mint,\n        TOKEN_2022_PROGRAM_ID,\n        ASSOCIATED_TOKEN_PROGRAM_ID,\n      ),\n    );\n  }\n\n  tx.add(\n    createMintToInstruction(\n      mint,\n      ata,\n      authority.publicKey,\n      amount,\n      [],\n      TOKEN_2022_PROGRAM_ID,\n    ),\n  );\n\n  return sendAndConfirmTransaction(connection, tx, [payer, authority]);\n}",
              testCases: [
                {
                  id: "t1",
                  name: "Creates mint with extensions",
                  input: "NonTransferable + PermanentDelegate",
                  expectedOutput: "mint keypair",
                },
                {
                  id: "t2",
                  name: "Correct instruction order",
                  input: "extensions before mint init",
                  expectedOutput: "successful tx",
                },
                {
                  id: "t3",
                  name: "Mints to ATA",
                  input: "amount: 100",
                  expectedOutput: "signature",
                },
              ],
              hints: [
                "Extension instructions must come BEFORE initializeMint",
                "Use TOKEN_2022_PROGRAM_ID (not TOKEN_PROGRAM_ID) everywhere",
                "getMintLen(extensions) calculates the correct space",
                "getAssociatedTokenAddressSync needs TOKEN_2022_PROGRAM_ID as programId",
              ],
            },
          },
        ],
      },
      {
        id: "aim5",
        title: "Program Composability",
        description:
          "Building composable programs and multi-instruction patterns",
        order: 4,
        lessons: [
          {
            id: "ail14",
            title: "Multi-Instruction Transactions",
            description: "Composing multiple instructions atomically",
            order: 13,
            type: "content",
            xpReward: 45,
            duration: "25 min",
            content:
              "# Multi-Instruction Transactions\n\nSolana transactions can contain multiple instructions that execute atomically.\n\n## Why Multiple Instructions?\n\n```typescript\n// Single transaction, multiple operations:\nconst tx = new Transaction()\n  .add(createATAInstruction)     // 1. Create token account\n  .add(mintInstruction)           // 2. Mint tokens\n  .add(updateProfileInstruction); // 3. Update user profile\n\n// All succeed or all fail — no partial state\n```\n\n## Transaction Limits\n\n| Limit | Value |\n|-------|-------|\n| Max transaction size | 1232 bytes |\n| Max accounts per tx | 64 |\n| Max compute units | 1,400,000 (with budget) |\n| Default compute units | 200,000 |\n\n## Compute Budget\n\n```typescript\nimport { ComputeBudgetProgram } from '@solana/web3.js';\n\nconst tx = new Transaction()\n  .add(ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }))\n  .add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1000 }))\n  .add(yourInstruction);\n```\n\n## Practical Patterns\n\n### Pattern 1: Setup + Action\n```typescript\n// Init ATA if needed, then transfer\nconst ata = getAssociatedTokenAddressSync(mint, recipient);\nconst ataInfo = await connection.getAccountInfo(ata);\n\nconst tx = new Transaction();\nif (!ataInfo) {\n  tx.add(createAssociatedTokenAccountInstruction(payer, ata, recipient, mint));\n}\ntx.add(createTransferInstruction(source, ata, owner, amount));\n```\n\n### Pattern 2: Batch Operations\n```typescript\n// Complete multiple lessons at once\nfor (const lessonId of completedLessons) {\n  tx.add(\n    await program.methods.completeLesson(lessonId)\n      .accounts({ enrollment, learner, config })\n      .instruction()\n  );\n}\n```\n\n### Pattern 3: Cross-Program Composition\n```typescript\n// Stake + Lend in one tx\ntx.add(stakeProgram.methods.stake(amount).instruction());\ntx.add(lendingProgram.methods.depositCollateral(stakeReceipt).instruction());\n```",
          },
          {
            id: "ail15",
            title: "Remaining Accounts Pattern",
            description: "Dynamic account lists for flexible programs",
            order: 14,
            type: "content",
            xpReward: 45,
            duration: "25 min",
            content:
              "# Remaining Accounts Pattern\n\nSometimes you don't know the full account list at compile time. Remaining accounts handle this.\n\n## The Problem\n\n```rust\n// How do you process a variable number of items?\n// Can't have a variable number of #[account] fields\npub fn batch_reward(\n    ctx: Context<BatchReward>,\n    amounts: Vec<u64>,\n) -> Result<()> {\n    // Need to reward N users, but N varies\n}\n```\n\n## The Solution: ctx.remaining_accounts\n\n```rust\npub fn batch_reward(\n    ctx: Context<BatchReward>,\n    amounts: Vec<u64>,\n) -> Result<()> {\n    let remaining = &ctx.remaining_accounts;\n    require!(remaining.len() == amounts.len() * 2, ErrorCode::AccountMismatch);\n    // Accounts come in pairs: [profile1, tokenAccount1, profile2, tokenAccount2, ...]\n\n    for (i, amount) in amounts.iter().enumerate() {\n        let profile_info = &remaining[i * 2];\n        let token_info = &remaining[i * 2 + 1];\n\n        // Deserialize and validate manually\n        let mut profile: Account<LearnerProfile> =\n            Account::try_from(profile_info)?;\n        require!(profile.owner == *ctx.program_id, ErrorCode::InvalidOwner);\n\n        profile.xp = profile.xp.checked_add(*amount).unwrap();\n        profile.exit(ctx.program_id)?; // Serialize back\n    }\n    Ok(())\n}\n```\n\n## Client Side\n\n```typescript\nconst remainingAccounts = users.flatMap(user => [\n  { pubkey: user.profile, isSigner: false, isWritable: true },\n  { pubkey: user.tokenAccount, isSigner: false, isWritable: true },\n]);\n\nawait program.methods\n  .batchReward(amounts)\n  .accounts({ config, authority })\n  .remainingAccounts(remainingAccounts)\n  .rpc();\n```\n\n## Security Considerations\n\n1. **Always validate** remaining accounts manually\n2. Check **owner** is your program (or expected program)\n3. Check **is_writable** and **is_signer** as needed\n4. Verify **PDA derivation** if accounts should be PDAs\n\n```rust\n// Validate remaining account is a valid PDA\nlet (expected_pda, _) = Pubkey::find_program_address(\n    &[b\"profile\", user_key.as_ref()],\n    ctx.program_id,\n);\nrequire_keys_eq!(*profile_info.key, expected_pda, ErrorCode::InvalidPDA);\n```",
          },
          {
            id: "ail16",
            title: "Building Composable Programs",
            description: "Designing programs for cross-program integration",
            order: 15,
            type: "content",
            xpReward: 45,
            duration: "25 min",
            content:
              '# Building Composable Programs\n\nDesign programs so other programs can integrate with them.\n\n## CPI: Your Program as a Building Block\n\nWhen other programs call yours via CPI:\n\n```rust\n// Your program\'s instruction\npub fn award_xp(\n    ctx: Context<AwardXp>,\n    amount: u64,\n) -> Result<()> {\n    // Verify caller is authorized\n    // Award XP\n    Ok(())\n}\n```\n\n```rust\n// Another program calling yours\nlet cpi_program = ctx.accounts.academy_program.to_account_info();\nlet cpi_accounts = AwardXp {\n    config: ctx.accounts.academy_config.to_account_info(),\n    learner: ctx.accounts.learner_profile.to_account_info(),\n    authority: ctx.accounts.backend_signer.to_account_info(),\n};\nlet cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);\nacademy::cpi::award_xp(cpi_ctx, xp_amount)?;\n```\n\n## IDL: The Integration Contract\n\nAnchor generates an IDL (Interface Definition Language) that other programs use:\n\n```json\n{\n  "name": "award_xp",\n  "accounts": [\n    { "name": "config", "isMut": false },\n    { "name": "learner", "isMut": true },\n    { "name": "authority", "isSigner": true }\n  ],\n  "args": [{ "name": "amount", "type": "u64" }]\n}\n```\n\n## Design Principles\n\n### 1. Minimal Account Requirements\n```rust\n// GOOD: Few required accounts\npub struct AwardXp<\'info> {\n    pub config: Account<\'info, Config>,\n    pub learner: Account<\'info, LearnerProfile>,\n    pub authority: Signer<\'info>,\n}\n\n// BAD: Too many accounts for simple operations\n// Other programs won\'t want to pass 15 accounts\n```\n\n### 2. Validate CPI Callers\n```rust\npub fn award_xp(ctx: Context<AwardXp>, amount: u64) -> Result<()> {\n    let config = &ctx.accounts.config;\n    // Only authorized programs/signers can award XP\n    require_keys_eq!(\n        ctx.accounts.authority.key(),\n        config.backend_signer,\n        ErrorCode::Unauthorized\n    );\n    Ok(())\n}\n```\n\n### 3. Return Values via Events\n```rust\n// CPIs can\'t return values, so use events\nemit!(XpAwarded {\n    learner: ctx.accounts.learner.key(),\n    amount,\n    new_total: profile.xp,\n});\n```\n\n### 4. Keep Instructions Focused\n```rust\n// GOOD: One thing well\npub fn complete_lesson(...)\npub fn finalize_course(...)\npub fn issue_credential(...)\n\n// BAD: God instruction that does everything\npub fn do_everything_at_once(...)\n```',
          },
          {
            id: "ail17",
            title: "Composability Challenge",
            description: "Build a composable reward system",
            order: 16,
            type: "challenge",
            xpReward: 115,
            duration: "40 min",
            challenge: {
              language: "rust",
              prompt:
                "Build a composable quest system that integrates with an XP program via CPI and supports batch rewards through remaining accounts.",
              starterCode:
                'use anchor_lang::prelude::*;\n\ndeclare_id!("11111111111111111111111111111111");\n\n// Quest system that:\n// 1. Creates quests with multiple objectives\n// 2. Completes objectives (updates bitmap)\n// 3. When all objectives done, awards XP via CPI to XP program\n// 4. Supports batch completion via remaining_accounts\n\n#[program]\npub mod quest_system {\n    use super::*;\n\n    pub fn create_quest(\n        ctx: Context<CreateQuest>,\n        quest_id: String,\n        total_objectives: u8,\n        xp_reward: u64,\n    ) -> Result<()> {\n        // Initialize quest account\n        todo!()\n    }\n\n    pub fn complete_objective(\n        ctx: Context<CompleteObjective>,\n        objective_index: u8,\n    ) -> Result<()> {\n        // Mark objective in bitmap\n        // If all objectives complete, emit QuestCompleted event\n        todo!()\n    }\n\n    pub fn batch_complete(\n        ctx: Context<BatchComplete>,\n        objective_indices: Vec<u8>,\n    ) -> Result<()> {\n        // Complete multiple objectives at once\n        // remaining_accounts contains additional quest accounts\n        todo!()\n    }\n}\n\n// Define:\n// - Quest account (PDA with seeds ["quest", quest_id])\n// - QuestProgress account (PDA with seeds ["progress", quest_id, user])\n// - Events: ObjectiveCompleted, QuestCompleted\n// - Errors: QuestInactive, ObjectiveAlreadyDone, InvalidObjective\n// - All account contexts',
              solution:
                'use anchor_lang::prelude::*;\n\ndeclare_id!("11111111111111111111111111111111");\n\n#[program]\npub mod quest_system {\n    use super::*;\n\n    pub fn create_quest(\n        ctx: Context<CreateQuest>,\n        quest_id: String,\n        total_objectives: u8,\n        xp_reward: u64,\n    ) -> Result<()> {\n        require!(total_objectives > 0 && total_objectives <= 64, QuestError::InvalidObjectiveCount);\n        require!(xp_reward > 0, QuestError::InvalidReward);\n        let quest = &mut ctx.accounts.quest;\n        quest.quest_id = quest_id;\n        quest.authority = ctx.accounts.authority.key();\n        quest.total_objectives = total_objectives;\n        quest.xp_reward = xp_reward;\n        quest.is_active = true;\n        quest.bump = ctx.bumps.quest;\n        Ok(())\n    }\n\n    pub fn complete_objective(\n        ctx: Context<CompleteObjective>,\n        objective_index: u8,\n    ) -> Result<()> {\n        let quest = &ctx.accounts.quest;\n        let progress = &mut ctx.accounts.progress;\n\n        require!(quest.is_active, QuestError::QuestInactive);\n        require!(objective_index < quest.total_objectives, QuestError::InvalidObjective);\n        require!(\n            progress.objective_bitmap & (1u64 << objective_index) == 0,\n            QuestError::ObjectiveAlreadyDone\n        );\n\n        progress.objective_bitmap |= 1u64 << objective_index;\n        progress.completed_count = progress.completed_count.checked_add(1).unwrap();\n\n        let clock = Clock::get()?;\n        emit!(ObjectiveCompleted {\n            user: ctx.accounts.user.key(),\n            quest_id: quest.quest_id.clone(),\n            objective_index,\n            total_completed: progress.completed_count,\n            timestamp: clock.unix_timestamp,\n        });\n\n        if progress.completed_count == quest.total_objectives {\n            progress.is_complete = true;\n            emit!(QuestCompleted {\n                user: ctx.accounts.user.key(),\n                quest_id: quest.quest_id.clone(),\n                xp_reward: quest.xp_reward,\n                timestamp: clock.unix_timestamp,\n            });\n        }\n\n        Ok(())\n    }\n\n    pub fn batch_complete(\n        ctx: Context<BatchComplete>,\n        objective_indices: Vec<u8>,\n    ) -> Result<()> {\n        let quest = &ctx.accounts.quest;\n        let progress = &mut ctx.accounts.progress;\n        let clock = Clock::get()?;\n\n        require!(quest.is_active, QuestError::QuestInactive);\n        require!(!progress.is_complete, QuestError::QuestAlreadyComplete);\n\n        for &index in &objective_indices {\n            require!(index < quest.total_objectives, QuestError::InvalidObjective);\n            if progress.objective_bitmap & (1u64 << index) == 0 {\n                progress.objective_bitmap |= 1u64 << index;\n                progress.completed_count = progress.completed_count.checked_add(1).unwrap();\n\n                emit!(ObjectiveCompleted {\n                    user: ctx.accounts.user.key(),\n                    quest_id: quest.quest_id.clone(),\n                    objective_index: index,\n                    total_completed: progress.completed_count,\n                    timestamp: clock.unix_timestamp,\n                });\n            }\n        }\n\n        if progress.completed_count == quest.total_objectives {\n            progress.is_complete = true;\n            emit!(QuestCompleted {\n                user: ctx.accounts.user.key(),\n                quest_id: quest.quest_id.clone(),\n                xp_reward: quest.xp_reward,\n                timestamp: clock.unix_timestamp,\n            });\n        }\n\n        Ok(())\n    }\n}\n\n#[derive(Accounts)]\n#[instruction(quest_id: String)]\npub struct CreateQuest<\'info> {\n    #[account(\n        init,\n        seeds = [b"quest", quest_id.as_bytes()],\n        bump,\n        payer = authority,\n        space = 8 + Quest::INIT_SPACE,\n    )]\n    pub quest: Account<\'info, Quest>,\n    #[account(mut)]\n    pub authority: Signer<\'info>,\n    pub system_program: Program<\'info, System>,\n}\n\n#[derive(Accounts)]\npub struct CompleteObjective<\'info> {\n    #[account(seeds = [b"quest", quest.quest_id.as_bytes()], bump = quest.bump)]\n    pub quest: Account<\'info, Quest>,\n    #[account(\n        init_if_needed,\n        seeds = [b"progress", quest.quest_id.as_bytes(), user.key().as_ref()],\n        bump,\n        payer = user,\n        space = 8 + QuestProgress::INIT_SPACE,\n    )]\n    pub progress: Account<\'info, QuestProgress>,\n    #[account(mut)]\n    pub user: Signer<\'info>,\n    pub system_program: Program<\'info, System>,\n}\n\n#[derive(Accounts)]\npub struct BatchComplete<\'info> {\n    #[account(seeds = [b"quest", quest.quest_id.as_bytes()], bump = quest.bump)]\n    pub quest: Account<\'info, Quest>,\n    #[account(\n        mut,\n        seeds = [b"progress", quest.quest_id.as_bytes(), user.key().as_ref()],\n        bump,\n    )]\n    pub progress: Account<\'info, QuestProgress>,\n    #[account(mut)]\n    pub user: Signer<\'info>,\n}\n\n#[account]\n#[derive(InitSpace)]\npub struct Quest {\n    #[max_len(32)]\n    pub quest_id: String,\n    pub authority: Pubkey,\n    pub total_objectives: u8,\n    pub xp_reward: u64,\n    pub is_active: bool,\n    pub bump: u8,\n}\n\n#[account]\n#[derive(InitSpace)]\npub struct QuestProgress {\n    pub user: Pubkey,\n    pub objective_bitmap: u64,\n    pub completed_count: u8,\n    pub is_complete: bool,\n}\n\n#[event]\npub struct ObjectiveCompleted {\n    pub user: Pubkey,\n    pub quest_id: String,\n    pub objective_index: u8,\n    pub total_completed: u8,\n    pub timestamp: i64,\n}\n\n#[event]\npub struct QuestCompleted {\n    pub user: Pubkey,\n    pub quest_id: String,\n    pub xp_reward: u64,\n    pub timestamp: i64,\n}\n\n#[error_code]\npub enum QuestError {\n    #[msg("Quest is not active")]\n    QuestInactive,\n    #[msg("Objective already completed")]\n    ObjectiveAlreadyDone,\n    #[msg("Invalid objective index")]\n    InvalidObjective,\n    #[msg("Invalid objective count")]\n    InvalidObjectiveCount,\n    #[msg("Invalid reward amount")]\n    InvalidReward,\n    #[msg("Quest already completed")]\n    QuestAlreadyComplete,\n}',
              testCases: [
                {
                  id: "t1",
                  name: "Creates quest with PDA",
                  input: "quest_id, objectives, xp",
                  expectedOutput: "quest PDA",
                },
                {
                  id: "t2",
                  name: "Completes objective bitmap",
                  input: "index: 0",
                  expectedOutput: "bitmap: 1",
                },
                {
                  id: "t3",
                  name: "Prevents double completion",
                  input: "same index twice",
                  expectedOutput: "ObjectiveAlreadyDone",
                },
                {
                  id: "t4",
                  name: "Batch complete works",
                  input: "[0, 1, 2]",
                  expectedOutput: "3 completed",
                },
                {
                  id: "t5",
                  name: "Quest complete event",
                  input: "all objectives done",
                  expectedOutput: "QuestCompleted emitted",
                },
              ],
              hints: [
                "Use bitmap: progress.bitmap |= 1 << index to mark objectives",
                "Check bitmap & (1 << index) == 0 before completing",
                "Emit events for each objective and for quest completion",
                "Use init_if_needed for progress account (first objective creates it)",
              ],
            },
          },
        ],
      },
    ],
  }),
  buildCourse({
    id: "anchor-advanced",
    slug: "anchor-advanced",
    title: "Anchor Advanced: Production Patterns",
    description:
      "Master production-grade Solana development with Anchor. Learn security hardening, CU optimization, verifiable builds, and deployment strategies.",
    thumbnail: "/courses/anchor-advanced.png",
    creator: "Superteam Academy",
    difficulty: "advanced",
    xpTotal: 2000,
    trackId: 1,
    trackLevel: 3,
    duration: "7 hours",
    prerequisiteId: "anchor-intermediate",
    isActive: true,
    createdAt: "2025-07-01T00:00:00Z",
    modules: [
      {
        id: "aav1",
        title: "Security Hardening",
        description: "Securing Anchor programs for production",
        order: 0,
        lessons: [
          {
            id: "aal1",
            title: "Common Anchor Vulnerabilities",
            description: "Security pitfalls in Anchor programs",
            order: 0,
            type: "content",
            xpReward: 60,
            duration: "30 min",
            content:
              "# Common Anchor Vulnerabilities\n\nEven with Anchor's built-in validations, programs can have serious vulnerabilities.\n\n## 1. Missing Signer Checks\n\n```rust\n// VULNERABLE: No signer check on authority\n#[derive(Accounts)]\npub struct Withdraw<'info> {\n    #[account(mut, has_one = authority)]\n    pub vault: Account<'info, Vault>,\n    pub authority: AccountInfo<'info>, // Anyone can pass this!\n}\n\n// FIXED: Require signature\n#[derive(Accounts)]\npub struct Withdraw<'info> {\n    #[account(mut, has_one = authority)]\n    pub vault: Account<'info, Vault>,\n    pub authority: Signer<'info>, // Must sign the transaction\n}\n```\n\n## 2. Missing Owner Checks\n\n```rust\n// VULNERABLE: UncheckedAccount without owner validation\n/// CHECK: No validation\npub oracle: UncheckedAccount<'info>,\n\n// FIXED: Validate the owner\n/// CHECK: Validated in instruction\n#[account(owner = oracle_program::ID)]\npub oracle: UncheckedAccount<'info>,\n```\n\n## 3. PDA Substitution\n\n```rust\n// VULNERABLE: No seed verification\n#[account(mut)]\npub config: Account<'info, Config>,\n\n// FIXED: Verify PDA derivation\n#[account(mut, seeds = [b\"config\"], bump = config.bump)]\npub config: Account<'info, Config>,\n```\n\n## 4. Arithmetic Overflow\n\n```rust\n// VULNERABLE: Can overflow\nprofile.xp += reward;\n\n// FIXED: Checked arithmetic\nprofile.xp = profile.xp.checked_add(reward).ok_or(ErrorCode::Overflow)?;\n```\n\n## 5. Reinitialization Attacks\n\n```rust\n// VULNERABLE: init can be called again if account is closed and recreated\n#[account(init, payer = user, space = 8 + Config::INIT_SPACE)]\npub config: Account<'info, Config>,\n\n// FIXED: Use a flag or constraint\n#[account(\n    init,\n    seeds = [b\"config\"],\n    bump,\n    payer = user,\n    space = 8 + Config::INIT_SPACE,\n)]\npub config: Account<'info, Config>,\n// PDA seeds prevent reinitialization since the address is deterministic\n```\n\n## Security Checklist\n\n- [ ] All authorities use `Signer<'info>`\n- [ ] All PDAs verified with `seeds` + `bump`\n- [ ] All arithmetic uses checked operations\n- [ ] All `UncheckedAccount` has `/// CHECK:` with owner validation\n- [ ] No `close` without proper authorization\n- [ ] CPI targets validated against expected program IDs",
          },
          {
            id: "aal2",
            title: "Account Validation Patterns",
            description:
              "Advanced constraint patterns for bulletproof programs",
            order: 1,
            type: "content",
            xpReward: 60,
            duration: "30 min",
            content:
              "# Advanced Account Validation Patterns\n\n## Compound Constraints\n\nCombine multiple constraints for thorough validation:\n\n```rust\n#[derive(Accounts)]\npub struct CompleteLesson<'info> {\n    #[account(\n        mut,\n        seeds = [b\"enrollment\", course.key().as_ref(), learner.key().as_ref()],\n        bump = enrollment.bump,\n        has_one = learner,\n        constraint = enrollment.course == course.key() @ ErrorCode::CourseMismatch,\n        constraint = !enrollment.is_completed @ ErrorCode::AlreadyCompleted,\n    )]\n    pub enrollment: Account<'info, Enrollment>,\n    #[account(\n        seeds = [b\"course\", &course.course_id.to_le_bytes()],\n        bump = course.bump,\n        constraint = course.is_active @ ErrorCode::CourseInactive,\n    )]\n    pub course: Account<'info, Course>,\n    pub learner: Signer<'info>,\n}\n```\n\n## Temporal Constraints\n\nValidate time-based conditions:\n\n```rust\n#[account(\n    constraint = {\n        let clock = Clock::get()?;\n        clock.unix_timestamp >= enrollment.cooldown_until\n    } @ ErrorCode::CooldownActive,\n)]\npub enrollment: Account<'info, Enrollment>,\n```\n\n## Cross-Account Validation\n\n```rust\n#[derive(Accounts)]\npub struct Transfer<'info> {\n    #[account(\n        mut,\n        constraint = from_vault.authority == authority.key() @ ErrorCode::Unauthorized,\n        constraint = from_vault.balance >= amount @ ErrorCode::InsufficientFunds,\n    )]\n    pub from_vault: Account<'info, Vault>,\n    #[account(\n        mut,\n        constraint = to_vault.mint == from_vault.mint @ ErrorCode::MintMismatch,\n    )]\n    pub to_vault: Account<'info, Vault>,\n    pub authority: Signer<'info>,\n}\n```\n\n## The `realloc` Constraint\n\nDynamically resize accounts:\n\n```rust\n#[account(\n    mut,\n    realloc = 8 + Profile::INIT_SPACE + (profile.achievements.len() + 1) * 32,\n    realloc::payer = user,\n    realloc::zero = false,\n)]\npub profile: Account<'info, Profile>,\n```",
          },
          {
            id: "aal3",
            title: "Security Audit Challenge",
            description: "Find and fix vulnerabilities in an Anchor program",
            order: 2,
            type: "challenge",
            xpReward: 120,
            duration: "45 min",
            challenge: {
              language: "rust",
              prompt:
                "Review the following program and fix all security vulnerabilities. There are at least 5 issues.",
              starterCode:
                "use anchor_lang::prelude::*;\n\ndeclare_id!(\"11111111111111111111111111111111\");\n\n#[program]\npub mod vulnerable_vault {\n    use super::*;\n\n    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {\n        let vault = &mut ctx.accounts.vault;\n        vault.authority = ctx.accounts.authority.key();\n        vault.balance = 0;\n        Ok(())\n    }\n\n    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {\n        let vault = &mut ctx.accounts.vault;\n        vault.balance += amount;\n        // Transfer SOL from user to vault\n        anchor_lang::system_program::transfer(\n            CpiContext::new(\n                ctx.accounts.system_program.to_account_info(),\n                anchor_lang::system_program::Transfer {\n                    from: ctx.accounts.user.to_account_info(),\n                    to: ctx.accounts.vault.to_account_info(),\n                },\n            ),\n            amount,\n        )?;\n        Ok(())\n    }\n\n    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {\n        let vault = &mut ctx.accounts.vault;\n        vault.balance -= amount;\n        **vault.to_account_info().try_borrow_mut_lamports()? -= amount;\n        **ctx.accounts.authority.to_account_info().try_borrow_mut_lamports()? += amount;\n        Ok(())\n    }\n}\n\n#[derive(Accounts)]\npub struct Initialize<'info> {\n    #[account(init, payer = authority, space = 8 + 32 + 8)]\n    pub vault: Account<'info, Vault>,\n    #[account(mut)]\n    pub authority: Signer<'info>,\n    pub system_program: Program<'info, System>,\n}\n\n#[derive(Accounts)]\npub struct Deposit<'info> {\n    #[account(mut)]\n    pub vault: Account<'info, Vault>,\n    #[account(mut)]\n    pub user: Signer<'info>,\n    pub system_program: Program<'info, System>,\n}\n\n#[derive(Accounts)]\npub struct Withdraw<'info> {\n    #[account(mut)]\n    pub vault: Account<'info, Vault>,\n    pub authority: AccountInfo<'info>,\n}\n\n#[account]\npub struct Vault {\n    pub authority: Pubkey,\n    pub balance: u64,\n}",
              solution:
                'use anchor_lang::prelude::*;\n\ndeclare_id!("11111111111111111111111111111111");\n\n#[program]\npub mod secure_vault {\n    use super::*;\n\n    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {\n        let vault = &mut ctx.accounts.vault;\n        vault.authority = ctx.accounts.authority.key();\n        vault.balance = 0;\n        vault.bump = ctx.bumps.vault;\n        Ok(())\n    }\n\n    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {\n        require!(amount > 0, VaultError::InvalidAmount);\n        let vault = &mut ctx.accounts.vault;\n        vault.balance = vault.balance.checked_add(amount).ok_or(VaultError::Overflow)?;\n        anchor_lang::system_program::transfer(\n            CpiContext::new(\n                ctx.accounts.system_program.to_account_info(),\n                anchor_lang::system_program::Transfer {\n                    from: ctx.accounts.user.to_account_info(),\n                    to: vault.to_account_info(),\n                },\n            ),\n            amount,\n        )?;\n        Ok(())\n    }\n\n    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {\n        require!(amount > 0, VaultError::InvalidAmount);\n        let vault = &mut ctx.accounts.vault;\n        vault.balance = vault.balance.checked_sub(amount).ok_or(VaultError::InsufficientFunds)?;\n        **vault.to_account_info().try_borrow_mut_lamports()? -= amount;\n        **ctx.accounts.authority.to_account_info().try_borrow_mut_lamports()? += amount;\n        Ok(())\n    }\n}\n\n#[derive(Accounts)]\npub struct Initialize<\'info> {\n    #[account(\n        init,\n        seeds = [b"vault"],\n        bump,\n        payer = authority,\n        space = 8 + 32 + 8 + 1,\n    )]\n    pub vault: Account<\'info, Vault>,\n    #[account(mut)]\n    pub authority: Signer<\'info>,\n    pub system_program: Program<\'info, System>,\n}\n\n#[derive(Accounts)]\npub struct Deposit<\'info> {\n    #[account(mut, seeds = [b"vault"], bump = vault.bump)]\n    pub vault: Account<\'info, Vault>,\n    #[account(mut)]\n    pub user: Signer<\'info>,\n    pub system_program: Program<\'info, System>,\n}\n\n#[derive(Accounts)]\npub struct Withdraw<\'info> {\n    #[account(\n        mut,\n        seeds = [b"vault"],\n        bump = vault.bump,\n        has_one = authority,\n    )]\n    pub vault: Account<\'info, Vault>,\n    #[account(mut)]\n    pub authority: Signer<\'info>,\n}\n\n#[account]\npub struct Vault {\n    pub authority: Pubkey,\n    pub balance: u64,\n    pub bump: u8,\n}\n\n#[error_code]\npub enum VaultError {\n    #[msg("Invalid amount")]\n    InvalidAmount,\n    #[msg("Arithmetic overflow")]\n    Overflow,\n    #[msg("Insufficient funds")]\n    InsufficientFunds,\n}',
              testCases: [
                {
                  id: "t1",
                  name: "Authority is Signer",
                  input: "withdraw struct",
                  expectedOutput: "Signer<'info>",
                },
                {
                  id: "t2",
                  name: "PDA seeds on vault",
                  input: "all contexts",
                  expectedOutput: "seeds + bump",
                },
                {
                  id: "t3",
                  name: "Checked arithmetic",
                  input: "deposit/withdraw",
                  expectedOutput: "checked_add/checked_sub",
                },
                {
                  id: "t4",
                  name: "has_one constraint",
                  input: "withdraw",
                  expectedOutput: "has_one = authority",
                },
                {
                  id: "t5",
                  name: "Bump stored",
                  input: "Vault struct",
                  expectedOutput: "bump: u8",
                },
              ],
              hints: [
                "The Withdraw struct uses AccountInfo instead of Signer for authority",
                "The vault account has no PDA seeds — anyone could pass a fake vault",
                "Arithmetic operations can overflow — use checked_add/checked_sub",
                "The withdraw should verify has_one = authority",
                "Store the PDA bump in the account struct",
              ],
            },
          },
        ],
      },
      {
        id: "aav2",
        title: "Compute Unit Optimization",
        description: "Minimizing CU usage for efficient programs",
        order: 1,
        lessons: [
          {
            id: "aal4",
            title: "Understanding Compute Units",
            description: "How CU budgets work on Solana",
            order: 3,
            type: "content",
            xpReward: 50,
            duration: "25 min",
            content:
              "# Understanding Compute Units\n\nEvery instruction on Solana has a compute unit (CU) budget. Efficient programs cost less and fit more operations per transaction.\n\n## CU Basics\n\n| Metric | Value |\n|--------|-------|\n| Default per instruction | 200,000 CU |\n| Max per instruction | 1,400,000 CU |\n| Max per transaction | 1,400,000 CU |\n| Cost of CPI | ~1,000-5,000 CU base |\n| PDA derivation (find) | ~1,500 CU |\n| PDA verification (create) | ~1,500 CU |\n| SHA256 hash | ~100 CU per 32 bytes |\n| Logging (msg!) | ~100 CU per call |\n\n## Measuring CU Usage\n\n```typescript\n// In tests, check CU consumption\nconst tx = await program.methods.myInstruction()\n  .accounts({...})\n  .rpc({ commitment: 'confirmed' });\n\nconst txDetails = await connection.getTransaction(tx, {\n  commitment: 'confirmed',\n  maxSupportedTransactionVersion: 0,\n});\nconsole.log('CU used:', txDetails.meta.computeUnitsConsumed);\n```\n\n## Common CU Costs\n\n```rust\n// ~1,500 CU — AVOID in hot paths\nPubkey::find_program_address(&seeds, program_id);\n\n// ~100 CU — Use stored bump instead\nPubkey::create_program_address(&[...seeds, &[bump]], program_id);\n\n// The difference: find_program_address loops through bumps (255, 254, ...)\n// create_program_address just verifies the single bump you provide\n```\n\n## Setting Compute Budget\n\n```typescript\nimport { ComputeBudgetProgram } from '@solana/web3.js';\n\n// Request specific CU limit\ntx.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 }));\n\n// Set priority fee\ntx.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1_000 }));\n```",
          },
          {
            id: "aal5",
            title: "Optimization Techniques",
            description: "Practical CU reduction strategies",
            order: 4,
            type: "content",
            xpReward: 50,
            duration: "25 min",
            content:
              "# CU Optimization Techniques\n\n## 1. Store PDA Bumps\n\nThe single biggest optimization in most Anchor programs:\n\n```rust\n// EXPENSIVE: ~1,500 CU (loops through bump values)\n#[account(seeds = [b\"vault\", user.key().as_ref()], bump)]\npub vault: Account<'info, Vault>,\n\n// CHEAP: ~100 CU (uses stored bump directly)\n#[account(seeds = [b\"vault\", user.key().as_ref()], bump = vault.bump)]\npub vault: Account<'info, Vault>,\n```\n\n## 2. Minimize Logging\n\n```rust\n// EXPENSIVE in production\nmsg!(\"User {} deposited {} tokens at timestamp {}\", user, amount, clock.unix_timestamp);\n\n// Use events instead (indexed, cheaper)\nemit!(DepositEvent { user: user.key(), amount, timestamp: clock.unix_timestamp });\n```\n\n## 3. Pack Account Data\n\n```rust\n// WASTEFUL: 3 bools = 3 bytes, but could be 1 byte\npub is_active: bool,\npub is_completed: bool,\npub has_credential: bool,\n\n// EFFICIENT: Bitmap — 1 byte stores 8 flags\npub flags: u8,\n// bit 0: is_active, bit 1: is_completed, bit 2: has_credential\n\nimpl Enrollment {\n    pub fn is_active(&self) -> bool { self.flags & (1 << 0) != 0 }\n    pub fn set_active(&mut self, val: bool) {\n        if val { self.flags |= 1 << 0; } else { self.flags &= !(1 << 0); }\n    }\n}\n```\n\n## 4. Avoid Unnecessary Deserialization\n\n```rust\n// If you only need to check the key, don't deserialize\n/// CHECK: Only checking key matches config.authority\n#[account(address = config.authority @ ErrorCode::Unauthorized)]\npub authority: UncheckedAccount<'info>,\n```\n\n## 5. Use Zero-Copy for Large Accounts\n\n```rust\n// Normal: Deserializes entire account into memory\n#[account]\npub struct BigData { pub items: [u64; 1000] }\n\n// Zero-copy: Reads directly from memory-mapped account\n#[account(zero_copy)]\n#[repr(C)]\npub struct BigData { pub items: [u64; 1000] }\n\n// Access in instruction:\n#[derive(Accounts)]\npub struct UseData<'info> {\n    #[account(mut)]\n    pub data: AccountLoader<'info, BigData>,\n}\n\npub fn update(ctx: Context<UseData>, index: usize, value: u64) -> Result<()> {\n    let mut data = ctx.accounts.data.load_mut()?;\n    data.items[index] = value;\n    Ok(())\n}\n```",
          },
          {
            id: "aal6",
            title: "CU Optimization Challenge",
            description: "Optimize a program to use fewer compute units",
            order: 5,
            type: "challenge",
            xpReward: 100,
            duration: "35 min",
            challenge: {
              language: "rust",
              prompt:
                "Refactor this Anchor program to reduce compute unit usage. Target: reduce CU by at least 30%.",
              starterCode:
                'use anchor_lang::prelude::*;\n\ndeclare_id!("11111111111111111111111111111111");\n\n#[program]\npub mod unoptimized {\n    use super::*;\n\n    pub fn update_profile(\n        ctx: Context<UpdateProfile>,\n        new_username: String,\n    ) -> Result<()> {\n        let profile = &mut ctx.accounts.profile;\n        msg!("Updating profile for user: {}", ctx.accounts.user.key());\n        msg!("Old username: {}", profile.username);\n        msg!("New username: {}", new_username);\n        profile.username = new_username;\n        profile.update_count += 1;\n        msg!("Update count: {}", profile.update_count);\n        Ok(())\n    }\n}\n\n#[derive(Accounts)]\npub struct UpdateProfile<\'info> {\n    #[account(\n        mut,\n        seeds = [b"profile", user.key().as_ref()],\n        bump, // recalculates bump every time\n        has_one = user,\n    )]\n    pub profile: Account<\'info, Profile>,\n    pub user: Signer<\'info>,\n}\n\n#[account]\n#[derive(InitSpace)]\npub struct Profile {\n    pub user: Pubkey,\n    #[max_len(32)]\n    pub username: String,\n    pub update_count: u64,\n    pub is_active: bool,\n    pub is_verified: bool,\n    pub is_premium: bool,\n    pub bump: u8,\n}',
              solution:
                'use anchor_lang::prelude::*;\n\ndeclare_id!("11111111111111111111111111111111");\n\n#[program]\npub mod optimized {\n    use super::*;\n\n    pub fn update_profile(\n        ctx: Context<UpdateProfile>,\n        new_username: String,\n    ) -> Result<()> {\n        let profile = &mut ctx.accounts.profile;\n        profile.username = new_username;\n        profile.update_count = profile.update_count.checked_add(1).ok_or(ErrorCode::Overflow)?;\n\n        emit!(ProfileUpdated {\n            user: ctx.accounts.user.key(),\n            update_count: profile.update_count,\n        });\n        Ok(())\n    }\n}\n\n#[derive(Accounts)]\npub struct UpdateProfile<\'info> {\n    #[account(\n        mut,\n        seeds = [b"profile", user.key().as_ref()],\n        bump = profile.bump,\n        has_one = user,\n    )]\n    pub profile: Account<\'info, Profile>,\n    pub user: Signer<\'info>,\n}\n\n#[account]\n#[derive(InitSpace)]\npub struct Profile {\n    pub user: Pubkey,\n    #[max_len(32)]\n    pub username: String,\n    pub update_count: u64,\n    pub flags: u8,\n    pub bump: u8,\n}\n\n#[event]\npub struct ProfileUpdated {\n    pub user: Pubkey,\n    pub update_count: u64,\n}\n\n#[error_code]\npub enum ErrorCode {\n    #[msg("Arithmetic overflow")]\n    Overflow,\n}',
              testCases: [
                {
                  id: "t1",
                  name: "Uses stored bump",
                  input: "bump = profile.bump",
                  expectedOutput: "stored bump",
                },
                {
                  id: "t2",
                  name: "No msg! calls",
                  input: "program code",
                  expectedOutput: "no msg!",
                },
                {
                  id: "t3",
                  name: "Packed flags",
                  input: "Profile struct",
                  expectedOutput: "flags: u8",
                },
                {
                  id: "t4",
                  name: "Checked arithmetic",
                  input: "update_count",
                  expectedOutput: "checked_add",
                },
              ],
              hints: [
                "Replace bump with bump = profile.bump to use stored bump",
                "Replace msg! calls with a single emit! event",
                "Pack the 3 booleans into a single u8 flags field",
                "Use checked_add for the update_count increment",
              ],
            },
          },
        ],
      },
      {
        id: "aav3",
        title: "Production Deployment",
        description: "Deploying and managing programs in production",
        order: 2,
        lessons: [
          {
            id: "aal7",
            title: "Verifiable Builds",
            description: "Reproducible and verifiable program builds",
            order: 6,
            type: "content",
            xpReward: 50,
            duration: "25 min",
            content:
              '# Verifiable Builds\n\nVerifiable builds prove that deployed bytecode matches published source code.\n\n## Why Verifiable Builds?\n\nUsers trust programs they can verify. Without verifiable builds, you\'re asking users to trust that your deployed binary matches your open-source code.\n\n## Building Verifiable Programs\n\n```bash\n# Build with Anchor\'s verifiable flag\nanchor build --verifiable\n\n# This uses a Docker container to ensure reproducible builds\n# Output: target/verifiable/my_program.so\n```\n\n## Verification Process\n\n```bash\n# Anyone can verify a deployed program\nanchor verify <PROGRAM_ID> --provider.cluster mainnet\n\n# This:\n# 1. Fetches the on-chain binary\n# 2. Rebuilds from source in Docker\n# 3. Compares the hashes\n```\n\n## Anchor.toml Configuration\n\n```toml\n[programs.mainnet]\nmy_program = "YOUR_PROGRAM_ID"\n\n[registry]\nurl = "https://api.apr.dev"\n\n[provider]\ncluster = "mainnet"\nwallet = "wallets/signer.json"\n```\n\n## Publishing to Anchor Registry\n\n```bash\n# Publish verified build\nanchor publish my_program\n\n# Others can now:\nanchor verify <PROGRAM_ID>\n```',
          },
          {
            id: "aal8",
            title: "Upgrade Authority & Multisig",
            description: "Managing program upgrades safely",
            order: 7,
            type: "content",
            xpReward: 50,
            duration: "30 min",
            content:
              "# Upgrade Authority & Multisig\n\n## Program Upgrade Authority\n\nEvery upgradeable Solana program has an upgrade authority — the account that can deploy new bytecode.\n\n```bash\n# Check current upgrade authority\nsolana program show <PROGRAM_ID>\n\n# Transfer upgrade authority\nsolana program set-upgrade-authority <PROGRAM_ID> \\\n  --new-upgrade-authority <NEW_AUTHORITY>\n\n# Make program immutable (irreversible!)\nsolana program set-upgrade-authority <PROGRAM_ID> --final\n```\n\n## Multisig with Squads\n\nFor production programs, use a multisig as the upgrade authority:\n\n1. Create a Squads multisig (e.g., 2-of-3)\n2. Transfer upgrade authority to the multisig vault\n3. All upgrades require multiple signatures\n\n```bash\n# Transfer authority to Squads vault\nsolana program set-upgrade-authority <PROGRAM_ID> \\\n  --new-upgrade-authority <SQUADS_VAULT_ADDRESS>\n```\n\n## Upgrade Workflow\n\n```bash\n# 1. Build and test thoroughly\nanchor build --verifiable\nanchor test\n\n# 2. Deploy to devnet first\nanchor deploy --provider.cluster devnet\n\n# 3. Test on devnet for multiple days\n\n# 4. Write the upgrade buffer\nsolana program write-buffer target/verifiable/my_program.so\n\n# 5. Propose upgrade via multisig\n# (done through Squads UI or CLI)\n\n# 6. Collect required signatures\n\n# 7. Execute upgrade\nsolana program deploy --buffer <BUFFER_ADDRESS> \\\n  --program-id <PROGRAM_ID>\n```\n\n## Buffer Management\n\n```bash\n# List all buffers\nsolana program show --buffers\n\n# Close unused buffers (reclaim SOL)\nsolana program close --buffers\n```",
          },
          {
            id: "aal9",
            title: "Deployment Pipeline Challenge",
            description: "Set up a complete deployment workflow",
            order: 8,
            type: "challenge",
            xpReward: 100,
            duration: "40 min",
            challenge: {
              language: "typescript",
              prompt:
                "Write a deployment script that builds, verifies, deploys to devnet, runs smoke tests, and reports results.",
              starterCode:
                "import { Connection, Keypair, PublicKey } from '@solana/web3.js';\nimport * as anchor from '@coral-xyz/anchor';\n\ninterface DeployResult {\n  success: boolean;\n  programId: string;\n  txSignature?: string;\n  error?: string;\n  cuUsed?: number;\n}\n\nasync function deployAndVerify(\n  cluster: 'devnet' | 'mainnet-beta',\n  programKeypairPath: string,\n): Promise<DeployResult> {\n  // 1. Build the program with anchor build\n  // 2. Deploy to the specified cluster\n  // 3. Verify the deployment by fetching the program account\n  // 4. Run a smoke test (call initialize)\n  // 5. Return the result\n}",
              solution:
                "import { Connection, Keypair, PublicKey } from '@solana/web3.js';\nimport * as anchor from '@coral-xyz/anchor';\nimport { execSync } from 'child_process';\nimport * as fs from 'fs';\n\ninterface DeployResult {\n  success: boolean;\n  programId: string;\n  txSignature?: string;\n  error?: string;\n  cuUsed?: number;\n}\n\nasync function deployAndVerify(\n  cluster: 'devnet' | 'mainnet-beta',\n  programKeypairPath: string,\n): Promise<DeployResult> {\n  const keypairData = JSON.parse(fs.readFileSync(programKeypairPath, 'utf8'));\n  const programKeypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));\n  const programId = programKeypair.publicKey.toBase58();\n\n  try {\n    // 1. Build\n    execSync('anchor build --verifiable', { stdio: 'pipe' });\n\n    // 2. Deploy\n    const deployCmd = `anchor deploy --provider.cluster ${cluster} --program-keypair ${programKeypairPath}`;\n    execSync(deployCmd, { stdio: 'pipe' });\n\n    // 3. Verify deployment\n    const rpcUrl = cluster === 'devnet'\n      ? 'https://api.devnet.solana.com'\n      : 'https://api.mainnet-beta.solana.com';\n    const connection = new Connection(rpcUrl, 'confirmed');\n    const accountInfo = await connection.getAccountInfo(programKeypair.publicKey);\n\n    if (!accountInfo || !accountInfo.executable) {\n      return { success: false, programId, error: 'Program not found or not executable' };\n    }\n\n    // 4. Smoke test\n    const provider = new anchor.AnchorProvider(\n      connection,\n      anchor.Wallet.local(),\n      { commitment: 'confirmed' },\n    );\n    anchor.setProvider(provider);\n\n    return {\n      success: true,\n      programId,\n      txSignature: 'deployment-verified',\n    };\n  } catch (err) {\n    return {\n      success: false,\n      programId,\n      error: err instanceof Error ? err.message : String(err),\n    };\n  }\n}",
              testCases: [
                {
                  id: "t1",
                  name: "Returns DeployResult",
                  input: "devnet deploy",
                  expectedOutput: "{ success, programId }",
                },
                {
                  id: "t2",
                  name: "Verifies program account",
                  input: "after deploy",
                  expectedOutput: "executable: true",
                },
                {
                  id: "t3",
                  name: "Handles errors",
                  input: "invalid keypair",
                  expectedOutput: "{ success: false, error }",
                },
              ],
              hints: [
                "Use execSync to run anchor build and deploy",
                "Verify deployment by checking accountInfo.executable",
                "Wrap everything in try/catch for error handling",
              ],
            },
          },
        ],
      },
      {
        id: "aav4",
        title: "Program Migration & Upgrades",
        description: "Safely upgrading programs and migrating data",
        order: 3,
        lessons: [
          {
            id: "aal10",
            title: "Account Migration Strategies",
            description: "Handling account schema changes across upgrades",
            order: 9,
            type: "content",
            xpReward: 55,
            duration: "30 min",
            content:
              "# Account Migration Strategies\n\nWhen your program evolves, account schemas change. Planning for this is critical.\n\n## Strategy 1: Reserved Bytes\n\nPre-allocate space for future fields:\n\n```rust\n#[account]\npub struct Config {\n    pub authority: Pubkey,\n    pub backend_signer: Pubkey,\n    pub xp_mint: Pubkey,\n    pub course_count: u32,\n    pub bump: u8,\n    pub _reserved: [u8; 128], // Future fields go here\n}\n```\n\nWhen adding a new field, reduce `_reserved` size:\n\n```rust\n// V2: Added fee_bps\npub struct Config {\n    pub authority: Pubkey,\n    pub backend_signer: Pubkey,\n    pub xp_mint: Pubkey,\n    pub course_count: u32,\n    pub bump: u8,\n    pub fee_bps: u16,          // NEW: 2 bytes from reserved\n    pub _reserved: [u8; 126],  // 128 - 2 = 126\n}\n```\n\n## Strategy 2: Version Field\n\n```rust\n#[account]\npub struct Profile {\n    pub version: u8,\n    pub authority: Pubkey,\n    pub xp: u64,\n    // V2 fields\n    pub streak_count: u32,\n    pub last_activity: i64,\n}\n\npub fn migrate_profile(ctx: Context<MigrateProfile>) -> Result<()> {\n    let profile = &mut ctx.accounts.profile;\n    require!(profile.version < 2, ErrorCode::AlreadyMigrated);\n    profile.version = 2;\n    profile.streak_count = 0;\n    profile.last_activity = Clock::get()?.unix_timestamp;\n    Ok(())\n}\n```\n\n## Strategy 3: Realloc\n\nUse Anchor's `realloc` constraint to grow accounts:\n\n```rust\n#[derive(Accounts)]\npub struct MigrateProfile<'info> {\n    #[account(\n        mut,\n        realloc = 8 + ProfileV2::INIT_SPACE,\n        realloc::payer = payer,\n        realloc::zero = false,\n        seeds = [b\"profile\", profile.authority.as_ref()],\n        bump = profile.bump,\n    )]\n    pub profile: Account<'info, ProfileV2>,\n    #[account(mut)]\n    pub payer: Signer<'info>,\n    pub system_program: Program<'info, System>,\n}\n```\n\n## Best Practice: Plan for Change\n\n1. Always include `_reserved` bytes (64-256 bytes)\n2. Add a `version` field to all major accounts\n3. Keep old deserialization logic for migration periods\n4. Test migrations thoroughly on devnet",
          },
          {
            id: "aal11",
            title: "Monitoring & Observability",
            description: "Tracking program health in production",
            order: 10,
            type: "content",
            xpReward: 50,
            duration: "25 min",
            content:
              "# Monitoring & Observability\n\n## Event-Based Monitoring\n\nAnchor events are the primary way to track program activity:\n\n```rust\n#[event]\npub struct EnrollmentCreated {\n    pub learner: Pubkey,\n    pub course_id: u32,\n    pub timestamp: i64,\n}\n\n#[event]\npub struct LessonCompleted {\n    pub learner: Pubkey,\n    pub course_id: u32,\n    pub lesson_index: u16,\n    pub xp_earned: u64,\n    pub timestamp: i64,\n}\n```\n\n## Listening to Events\n\n```typescript\n// Subscribe to program events\nprogram.addEventListener('EnrollmentCreated', (event, slot) => {\n  console.log(`New enrollment: course ${event.courseId} by ${event.learner}`);\n  metrics.increment('enrollments.created');\n});\n\nprogram.addEventListener('LessonCompleted', (event, slot) => {\n  console.log(`Lesson ${event.lessonIndex} completed, ${event.xpEarned} XP`);\n  metrics.increment('lessons.completed');\n  metrics.gauge('xp.awarded', event.xpEarned);\n});\n```\n\n## Transaction Monitoring with Helius\n\n```typescript\n// Helius webhook for transaction monitoring\nconst webhook = await helius.createWebhook({\n  webhookURL: 'https://your-api.com/webhook',\n  accountAddresses: [programId],\n  transactionTypes: ['ANY'],\n});\n```\n\n## Health Checks\n\n```typescript\nasync function healthCheck(programId: PublicKey): Promise<boolean> {\n  const connection = new Connection(rpcUrl);\n  const info = await connection.getAccountInfo(programId);\n  if (!info || !info.executable) return false;\n\n  // Check config account is valid\n  const [configPDA] = PublicKey.findProgramAddressSync(\n    [Buffer.from('config')],\n    programId,\n  );\n  const config = await program.account.config.fetch(configPDA);\n  return config.authority !== null;\n}\n```",
          },
          {
            id: "aal12",
            title: "Production Readiness Challenge",
            description: "Prepare a program for mainnet deployment",
            order: 11,
            type: "challenge",
            xpReward: 120,
            duration: "45 min",
            challenge: {
              language: "rust",
              prompt:
                "Add production-ready features to this program: reserved bytes, version field, migration instruction, and monitoring events.",
              starterCode:
                "use anchor_lang::prelude::*;\n\ndeclare_id!(\"11111111111111111111111111111111\");\n\n#[program]\npub mod academy {\n    use super::*;\n\n    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {\n        let config = &mut ctx.accounts.config;\n        config.authority = ctx.accounts.authority.key();\n        config.course_count = 0;\n        Ok(())\n    }\n}\n\n#[derive(Accounts)]\npub struct Initialize<'info> {\n    #[account(init, payer = authority, space = 8 + 32 + 4)]\n    pub config: Account<'info, Config>,\n    #[account(mut)]\n    pub authority: Signer<'info>,\n    pub system_program: Program<'info, System>,\n}\n\n#[account]\npub struct Config {\n    pub authority: Pubkey,\n    pub course_count: u32,\n}",
              solution:
                'use anchor_lang::prelude::*;\n\ndeclare_id!("11111111111111111111111111111111");\n\n#[program]\npub mod academy {\n    use super::*;\n\n    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {\n        let config = &mut ctx.accounts.config;\n        config.version = 1;\n        config.authority = ctx.accounts.authority.key();\n        config.course_count = 0;\n        config.bump = ctx.bumps.config;\n        config._reserved = [0u8; 128];\n\n        emit!(ConfigInitialized {\n            authority: config.authority,\n            timestamp: Clock::get()?.unix_timestamp,\n        });\n        Ok(())\n    }\n\n    pub fn migrate_config(ctx: Context<MigrateConfig>) -> Result<()> {\n        let config = &mut ctx.accounts.config;\n        require!(config.version < 2, AcademyError::AlreadyMigrated);\n        config.version = 2;\n\n        emit!(ConfigMigrated {\n            authority: config.authority,\n            new_version: 2,\n            timestamp: Clock::get()?.unix_timestamp,\n        });\n        Ok(())\n    }\n}\n\n#[derive(Accounts)]\npub struct Initialize<\'info> {\n    #[account(\n        init,\n        seeds = [b"config"],\n        bump,\n        payer = authority,\n        space = 8 + Config::INIT_SPACE,\n    )]\n    pub config: Account<\'info, Config>,\n    #[account(mut)]\n    pub authority: Signer<\'info>,\n    pub system_program: Program<\'info, System>,\n}\n\n#[derive(Accounts)]\npub struct MigrateConfig<\'info> {\n    #[account(\n        mut,\n        seeds = [b"config"],\n        bump = config.bump,\n        has_one = authority,\n    )]\n    pub config: Account<\'info, Config>,\n    pub authority: Signer<\'info>,\n}\n\n#[account]\n#[derive(InitSpace)]\npub struct Config {\n    pub version: u8,\n    pub authority: Pubkey,\n    pub course_count: u32,\n    pub bump: u8,\n    #[max_len(128)]\n    pub _reserved: Vec<u8>,\n}\n\n#[event]\npub struct ConfigInitialized {\n    pub authority: Pubkey,\n    pub timestamp: i64,\n}\n\n#[event]\npub struct ConfigMigrated {\n    pub authority: Pubkey,\n    pub new_version: u8,\n    pub timestamp: i64,\n}\n\n#[error_code]\npub enum AcademyError {\n    #[msg("Config already migrated")]\n    AlreadyMigrated,\n}',
              testCases: [
                {
                  id: "t1",
                  name: "Version field exists",
                  input: "Config struct",
                  expectedOutput: "version: u8",
                },
                {
                  id: "t2",
                  name: "Reserved bytes",
                  input: "Config struct",
                  expectedOutput: "_reserved: [u8; 128]",
                },
                {
                  id: "t3",
                  name: "Migration instruction",
                  input: "program",
                  expectedOutput: "migrate_config",
                },
                {
                  id: "t4",
                  name: "Events emitted",
                  input: "both instructions",
                  expectedOutput: "ConfigInitialized, ConfigMigrated",
                },
                {
                  id: "t5",
                  name: "PDA with stored bump",
                  input: "config account",
                  expectedOutput: "seeds + bump",
                },
              ],
              hints: [
                "Add version: u8 as the first field in Config",
                "Add _reserved: [u8; 128] for future fields",
                "Create a migrate_config instruction that checks and updates version",
                "Add events for initialization and migration",
                "Use PDA seeds and store the bump",
              ],
            },
          },
        ],
      },
    ],
  }),
  buildCourse({
    id: "rust-advanced",
    slug: "rust-advanced",
    title: "Advanced Rust for Solana",
    description:
      "Deep dive into advanced Rust patterns used in production Solana programs. Covers macros, unsafe code, zero-copy deserialization, and performance tuning.",
    thumbnail: "/courses/rust-advanced.png",
    creator: "Superteam Academy",
    difficulty: "advanced",
    xpTotal: 1500,
    trackId: 2,
    trackLevel: 2,
    duration: "6 hours",
    prerequisiteId: "rust-for-solana",
    isActive: true,
    createdAt: "2025-08-01T00:00:00Z",
    modules: [
      {
        id: "rav1",
        title: "Advanced Type System",
        description: "Leveraging Rust's type system for safe programs",
        order: 0,
        lessons: [
          {
            id: "ral1",
            title: "Generics & Trait Bounds",
            description: "Generic programming in Rust",
            order: 0,
            type: "content",
            xpReward: 50,
            duration: "25 min",
            content:
              '# Generics & Trait Bounds\n\nGenerics let you write code that works with multiple types while maintaining type safety.\n\n## Basic Generics\n\n```rust\n// A function that works with any type implementing Display\nfn log_value<T: std::fmt::Display>(label: &str, value: T) {\n    msg!("{}: {}", label, value);\n}\n\nlog_value("balance", 1000u64);\nlog_value("name", "Alice");\n```\n\n## Trait Bounds in Solana\n\nAnchor uses traits extensively:\n\n```rust\n// AccountSerialize + AccountDeserialize are required for #[account]\npub trait AccountSerialize {\n    fn try_serialize<W: Write>(&self, writer: &mut W) -> Result<()>;\n}\n\npub trait AccountDeserialize {\n    fn try_deserialize(buf: &mut &[u8]) -> Result<Self>;\n}\n\n// Your #[account] struct auto-implements these via derive macros\n#[account]\npub struct MyData {\n    pub value: u64,\n}\n```\n\n## Where Clauses\n\n```rust\nfn process_accounts<T>(accounts: &[T]) -> Result<u64>\nwhere\n    T: AccountDeserialize + Owner,\n{\n    let mut total = 0u64;\n    for account in accounts {\n        total = total.checked_add(account.lamports()).ok_or(ErrorCode::Overflow)?;\n    }\n    Ok(total)\n}\n```\n\n## Associated Types\n\n```rust\ntrait Reward {\n    type Amount;\n    fn calculate_reward(&self) -> Self::Amount;\n}\n\nimpl Reward for CourseCompletion {\n    type Amount = u64;\n    fn calculate_reward(&self) -> u64 {\n        self.base_xp.checked_mul(self.multiplier).unwrap_or(self.base_xp)\n    }\n}\n```\n\n## Phantom Types for Safety\n\n```rust\nuse std::marker::PhantomData;\n\nstruct Token<State> {\n    amount: u64,\n    _state: PhantomData<State>,\n}\n\nstruct Locked;\nstruct Unlocked;\n\nimpl Token<Unlocked> {\n    fn transfer(self, to: Pubkey) -> Result<()> { Ok(()) }\n}\n\nimpl Token<Locked> {\n    fn unlock(self, authority: &Signer) -> Token<Unlocked> {\n        Token { amount: self.amount, _state: PhantomData }\n    }\n}\n\n// Compile-time guarantee: can\'t transfer locked tokens\n// let locked = Token::<Locked> { amount: 100, _state: PhantomData };\n// locked.transfer(pubkey); // ERROR: no method `transfer` for Token<Locked>\n```',
          },
          {
            id: "ral2",
            title: "Trait Objects & Dynamic Dispatch",
            description: "Runtime polymorphism in Rust",
            order: 1,
            type: "content",
            xpReward: 45,
            duration: "20 min",
            content:
              "# Trait Objects & Dynamic Dispatch\n\n## Static vs Dynamic Dispatch\n\n```rust\n// STATIC dispatch (monomorphization) — resolved at compile time\nfn process<T: Validator>(validator: &T, data: &[u8]) -> Result<()> {\n    validator.validate(data)\n}\n\n// DYNAMIC dispatch (trait object) — resolved at runtime\nfn process(validator: &dyn Validator, data: &[u8]) -> Result<()> {\n    validator.validate(data)\n}\n```\n\n## When to Use Each\n\n| Static (`impl Trait` / `<T: Trait>`) | Dynamic (`dyn Trait`) |\n|------|-----|\n| Known types at compile time | Unknown types at runtime |\n| Zero overhead | Small vtable overhead |\n| Larger binary (monomorphization) | Smaller binary |\n| Most Solana use cases | Plugin systems, heterogeneous collections |\n\n## Practical Example: Validation Pipeline\n\n```rust\ntrait AccountValidator {\n    fn validate(&self, account: &AccountInfo) -> Result<()>;\n}\n\nstruct OwnerCheck { expected: Pubkey }\nimpl AccountValidator for OwnerCheck {\n    fn validate(&self, account: &AccountInfo) -> Result<()> {\n        require_keys_eq!(*account.owner, self.expected, ErrorCode::InvalidOwner);\n        Ok(())\n    }\n}\n\nstruct SignerCheck;\nimpl AccountValidator for SignerCheck {\n    fn validate(&self, account: &AccountInfo) -> Result<()> {\n        require!(account.is_signer, ErrorCode::NotSigner);\n        Ok(())\n    }\n}\n\nfn validate_all(\n    validators: &[&dyn AccountValidator],\n    account: &AccountInfo,\n) -> Result<()> {\n    for v in validators {\n        v.validate(account)?;\n    }\n    Ok(())\n}\n```\n\n## Solana Consideration\n\nIn on-chain programs, prefer static dispatch for CU efficiency. Dynamic dispatch adds vtable lookups (~10-50 CU each). Use dynamic dispatch only when the flexibility is worth the cost.",
          },
          {
            id: "ral3",
            title: "Type System Challenge",
            description: "Build type-safe account wrappers",
            order: 2,
            type: "challenge",
            xpReward: 80,
            duration: "35 min",
            challenge: {
              language: "rust",
              prompt:
                "Create a type-safe state machine using Rust's type system to model course enrollment lifecycle.",
              starterCode:
                "// Model these states at the TYPE level:\n// Pending -> Active -> Completed -> Certified\n//                   -> Dropped\n//\n// Rules:\n// - Only Active enrollments can be completed or dropped\n// - Only Completed enrollments can be certified\n// - Transitions should be enforced at compile time\n\nstruct Enrollment<State> {\n    learner: [u8; 32], // Pubkey bytes\n    course_id: u32,\n    enrolled_at: i64,\n    // TODO: Add PhantomData\n}\n\n// TODO: Define state marker types\n// TODO: Implement transition methods on each state",
              solution:
                "use std::marker::PhantomData;\n\nstruct Pending;\nstruct Active;\nstruct Completed;\nstruct Dropped;\nstruct Certified;\n\nstruct Enrollment<State> {\n    learner: [u8; 32],\n    course_id: u32,\n    enrolled_at: i64,\n    _state: PhantomData<State>,\n}\n\nimpl Enrollment<Pending> {\n    fn new(learner: [u8; 32], course_id: u32, now: i64) -> Self {\n        Enrollment {\n            learner,\n            course_id,\n            enrolled_at: now,\n            _state: PhantomData,\n        }\n    }\n\n    fn activate(self) -> Enrollment<Active> {\n        Enrollment {\n            learner: self.learner,\n            course_id: self.course_id,\n            enrolled_at: self.enrolled_at,\n            _state: PhantomData,\n        }\n    }\n}\n\nimpl Enrollment<Active> {\n    fn complete(self) -> Enrollment<Completed> {\n        Enrollment {\n            learner: self.learner,\n            course_id: self.course_id,\n            enrolled_at: self.enrolled_at,\n            _state: PhantomData,\n        }\n    }\n\n    fn drop_enrollment(self) -> Enrollment<Dropped> {\n        Enrollment {\n            learner: self.learner,\n            course_id: self.course_id,\n            enrolled_at: self.enrolled_at,\n            _state: PhantomData,\n        }\n    }\n}\n\nimpl Enrollment<Completed> {\n    fn certify(self) -> Enrollment<Certified> {\n        Enrollment {\n            learner: self.learner,\n            course_id: self.course_id,\n            enrolled_at: self.enrolled_at,\n            _state: PhantomData,\n        }\n    }\n}\n\n// Usage:\n// let e = Enrollment::<Pending>::new([0u8; 32], 1, 0);\n// let e = e.activate();    // Pending -> Active\n// let e = e.complete();    // Active -> Completed\n// let e = e.certify();     // Completed -> Certified\n// e.drop_enrollment();     // ERROR: no method on Certified",
              testCases: [
                {
                  id: "t1",
                  name: "Pending -> Active compiles",
                  input: "activate()",
                  expectedOutput: "Enrollment<Active>",
                },
                {
                  id: "t2",
                  name: "Active -> Completed compiles",
                  input: "complete()",
                  expectedOutput: "Enrollment<Completed>",
                },
                {
                  id: "t3",
                  name: "Completed -> Certified compiles",
                  input: "certify()",
                  expectedOutput: "Enrollment<Certified>",
                },
                {
                  id: "t4",
                  name: "Invalid transitions don't compile",
                  input: "Pending::complete()",
                  expectedOutput: "compile error",
                },
              ],
              hints: [
                "Use PhantomData<State> to carry the state type",
                "Implement methods only on specific Enrollment<SpecificState>",
                "Each transition consumes self and returns Enrollment<NextState>",
                "Marker types are empty structs: struct Active;",
              ],
            },
          },
        ],
      },
      {
        id: "rav2",
        title: "Macros & Metaprogramming",
        description: "Writing and understanding Rust macros",
        order: 1,
        lessons: [
          {
            id: "ral4",
            title: "Declarative Macros",
            description: "macro_rules! patterns for Solana programs",
            order: 3,
            type: "content",
            xpReward: 55,
            duration: "30 min",
            content:
              '# Declarative Macros (macro_rules!)\n\nMacros generate code at compile time, reducing boilerplate.\n\n## Basic Syntax\n\n```rust\nmacro_rules! checked_add {\n    ($a:expr, $b:expr) => {\n        $a.checked_add($b).ok_or(ErrorCode::Overflow)?\n    };\n}\n\n// Usage:\nprofile.xp = checked_add!(profile.xp, reward);\n```\n\n## Pattern Matching in Macros\n\n```rust\nmacro_rules! require_authority {\n    ($config:expr, $signer:expr) => {\n        require_keys_eq!(\n            $signer.key(),\n            $config.authority,\n            ErrorCode::Unauthorized\n        );\n    };\n    ($config:expr, $signer:expr, $error:expr) => {\n        require_keys_eq!(\n            $signer.key(),\n            $config.authority,\n            $error\n        );\n    };\n}\n```\n\n## Repetition Patterns\n\n```rust\nmacro_rules! emit_events {\n    ($($event:expr),+ $(,)?) => {\n        $(\n            emit!($event);\n        )+\n    };\n}\n\n// Usage:\nemit_events!(\n    LessonCompleted { learner, lesson_id, xp: reward },\n    XpAwarded { learner, amount: reward },\n);\n```\n\n## Real Solana Example: Account Space Calculator\n\n```rust\nmacro_rules! account_space {\n    ($($field_type:ty),+ $(,)?) => {\n        8 // discriminator\n        $(\n            + std::mem::size_of::<$field_type>()\n        )+\n    };\n}\n\n// Usage:\nconst SPACE: usize = account_space!(Pubkey, u64, u8, bool);\n// = 8 + 32 + 8 + 1 + 1 = 50\n```\n\n## Understanding Anchor\'s Macros\n\nAnchor heavily uses macros:\n\n```rust\n// #[account] expands to:\n// - BorshSerialize / BorshDeserialize\n// - AccountSerialize / AccountDeserialize\n// - Owner trait (returns your program ID)\n// - 8-byte discriminator (SHA256 hash of "account:<Name>")\n\n// #[derive(Accounts)] expands to:\n// - Account validation logic\n// - Account deserialization\n// - Constraint checking\n// - Error propagation\n```',
          },
          {
            id: "ral5",
            title: "Procedural Macros",
            description: "Understanding derive and attribute macros",
            order: 4,
            type: "content",
            xpReward: 55,
            duration: "30 min",
            content:
              "# Procedural Macros\n\nProcedural macros are Rust functions that generate code from token streams. Anchor is built on them.\n\n## Types of Proc Macros\n\n### 1. Derive Macros\n```rust\n// You use these constantly in Anchor:\n#[derive(AnchorSerialize, AnchorDeserialize, Clone)]\npub struct TransferArgs {\n    pub amount: u64,\n    pub memo: String,\n}\n\n// The derive macro generates serialization code at compile time\n```\n\n### 2. Attribute Macros\n```rust\n// Anchor's #[program] is an attribute macro\n#[program]\npub mod my_program {\n    // This macro transforms your module into:\n    // - An entrypoint function\n    // - Instruction dispatch logic\n    // - Account deserialization per instruction\n}\n\n// #[account] is also an attribute macro\n#[account]\npub struct Config {\n    pub authority: Pubkey,\n}\n```\n\n### 3. Function-like Macros\n```rust\n// declare_id! is a function-like proc macro\ndeclare_id!(\"YourProgramId11111111111111111111\");\n// Expands to a constant Pubkey and ID() function\n```\n\n## How Anchor's #[derive(Accounts)] Works\n\n```rust\n#[derive(Accounts)]\npub struct Initialize<'info> {\n    #[account(init, payer = user, space = 8 + 40)]\n    pub config: Account<'info, Config>,\n    #[account(mut)]\n    pub user: Signer<'info>,\n    pub system_program: Program<'info, System>,\n}\n\n// The derive macro generates roughly:\nimpl<'info> Accounts<'info> for Initialize<'info> {\n    fn try_accounts(\n        program_id: &Pubkey,\n        accounts: &mut &[AccountInfo<'info>],\n        bumps: &mut BTreeMap<String, u8>,\n    ) -> Result<Self> {\n        // 1. Take config from accounts slice\n        // 2. Validate it doesn't exist yet (init)\n        // 3. Create via CPI to System Program\n        // 4. Set owner, discriminator\n        // 5. Take user, verify is_signer and is_writable\n        // 6. Take system_program, verify program ID\n        // 7. Return populated struct\n    }\n}\n```\n\n## Writing Custom Derive Macros\n\nCustom derive macros live in a separate crate:\n\n```rust\n// my-macros/src/lib.rs\nuse proc_macro::TokenStream;\nuse quote::quote;\nuse syn::{parse_macro_input, DeriveInput};\n\n#[proc_macro_derive(EventEmitter)]\npub fn event_emitter(input: TokenStream) -> TokenStream {\n    let input = parse_macro_input!(input as DeriveInput);\n    let name = &input.ident;\n\n    let expanded = quote! {\n        impl #name {\n            pub fn emit_event(&self) {\n                // Generated logging code\n                msg!(\"Event: {}\", stringify!(#name));\n            }\n        }\n    };\n\n    TokenStream::from(expanded)\n}\n```",
          },
          {
            id: "ral6",
            title: "Macro Challenge",
            description: "Write utility macros for Solana programs",
            order: 5,
            type: "challenge",
            xpReward: 90,
            duration: "35 min",
            challenge: {
              language: "rust",
              prompt:
                "Write three utility macros for Solana program development.",
              starterCode:
                '// Macro 1: safe_math!\n// Wraps checked arithmetic with automatic error propagation\n// Usage: safe_math!(a + b), safe_math!(a - b), safe_math!(a * b)\n\n// Macro 2: pda_seeds!\n// Generates PDA seed slices from a list of seed expressions\n// Usage: let seeds = pda_seeds!(b"prefix", user.key(), &course_id.to_le_bytes());\n\n// Macro 3: validate!\n// Chain multiple boolean validations with custom errors\n// Usage: validate!(\n//     amount > 0 => ErrorCode::InvalidAmount,\n//     balance >= amount => ErrorCode::InsufficientFunds,\n// );\n',
              solution:
                'macro_rules! safe_math {\n    ($a:expr + $b:expr) => {\n        $a.checked_add($b).ok_or(ErrorCode::MathOverflow)?\n    };\n    ($a:expr - $b:expr) => {\n        $a.checked_sub($b).ok_or(ErrorCode::MathOverflow)?\n    };\n    ($a:expr * $b:expr) => {\n        $a.checked_mul($b).ok_or(ErrorCode::MathOverflow)?\n    };\n}\n\nmacro_rules! pda_seeds {\n    ($($seed:expr),+ $(,)?) => {\n        &[\n            $(\n                $seed.as_ref(),\n            )+\n        ]\n    };\n}\n\nmacro_rules! validate {\n    ($($condition:expr => $error:expr),+ $(,)?) => {\n        $(\n            require!($condition, $error);\n        )+\n    };\n}\n\n// Usage examples:\n// let total = safe_math!(balance + deposit);\n// let remaining = safe_math!(balance - withdrawal);\n// let reward = safe_math!(base_xp * multiplier);\n//\n// let seeds = pda_seeds!(b"enrollment", course.key(), user.key());\n//\n// validate!(\n//     amount > 0 => ErrorCode::InvalidAmount,\n//     !enrollment.is_completed => ErrorCode::AlreadyCompleted,\n//     course.is_active => ErrorCode::CourseInactive,\n// );',
              testCases: [
                {
                  id: "t1",
                  name: "safe_math addition",
                  input: "safe_math!(1u64 + 2u64)",
                  expectedOutput: "3u64",
                },
                {
                  id: "t2",
                  name: "safe_math overflow",
                  input: "safe_math!(u64::MAX + 1)",
                  expectedOutput: "MathOverflow error",
                },
                {
                  id: "t3",
                  name: "pda_seeds generates slice",
                  input: 'pda_seeds!(b"test", key)',
                  expectedOutput: "&[&[u8]]",
                },
                {
                  id: "t4",
                  name: "validate checks all conditions",
                  input: "validate!(true => Err, false => Err)",
                  expectedOutput: "fails on second",
                },
              ],
              hints: [
                "Use checked_add/sub/mul with ok_or for safe_math",
                "Use .as_ref() to convert seeds to &[u8]",
                "Use require! inside validate for each condition",
                "Each macro arm matches a different operator pattern",
              ],
            },
          },
        ],
      },
      {
        id: "rav3",
        title: "Memory & Performance",
        description:
          "Memory layout and performance optimization for on-chain programs",
        order: 2,
        lessons: [
          {
            id: "ral7",
            title: "Memory Layout & Alignment",
            description: "How Rust structures data in memory",
            order: 6,
            type: "content",
            xpReward: 50,
            duration: "25 min",
            content:
              "# Memory Layout & Alignment\n\nUnderstanding memory layout is critical for efficient Solana account design.\n\n## Struct Layout\n\nBy default, Rust may reorder fields for optimal alignment:\n\n```rust\n// Rust default layout (may reorder)\nstruct Example {\n    a: u8,   // 1 byte\n    b: u64,  // 8 bytes\n    c: u8,   // 1 byte\n}\n// Rust may reorder to: b(8) + a(1) + c(1) + padding = 16 bytes\n\n// C layout (preserves order, adds padding)\n#[repr(C)]\nstruct Example {\n    a: u8,   // 1 byte + 7 padding\n    b: u64,  // 8 bytes\n    c: u8,   // 1 byte + 7 padding\n}\n// Size: 24 bytes (lots of padding!)\n\n// Packed layout (no padding, may be slow on some architectures)\n#[repr(C, packed)]\nstruct Example {\n    a: u8,   // 1 byte\n    b: u64,  // 8 bytes\n    c: u8,   // 1 byte\n}\n// Size: 10 bytes (minimal)\n```\n\n## Why This Matters for Solana\n\nAccount space costs rent. Smaller accounts = less SOL locked:\n\n```rust\n// WASTEFUL: 24 bytes due to padding\n#[repr(C)]\nstruct BadLayout {\n    pub flag: u8,      // 1 + 7 padding\n    pub balance: u64,  // 8\n    pub status: u8,    // 1 + 7 padding\n}\n\n// EFFICIENT: 10 bytes, fields ordered by alignment\nstruct GoodLayout {\n    pub balance: u64,  // 8 (largest first)\n    pub flag: u8,      // 1\n    pub status: u8,    // 1 (no padding needed)\n}\n```\n\n## Zero-Copy Accounts\n\n```rust\n// Zero-copy: data is NOT copied into memory\n// Instead, fields are read directly from the account buffer\n#[account(zero_copy)]\n#[repr(C)] // Required for zero-copy\npub struct LargeState {\n    pub data: [u64; 500],  // 4000 bytes\n    pub count: u64,\n}\n\n// Access via AccountLoader\n#[derive(Accounts)]\npub struct Update<'info> {\n    #[account(mut)]\n    pub state: AccountLoader<'info, LargeState>,\n}\n\npub fn update(ctx: Context<Update>, index: u32, value: u64) -> Result<()> {\n    let mut state = ctx.accounts.state.load_mut()?;\n    state.data[index as usize] = value;\n    state.count = state.count.checked_add(1).ok_or(ErrorCode::Overflow)?;\n    Ok(())\n}\n```\n\n## Size Calculation\n\n```rust\nuse std::mem::size_of;\n\nassert_eq!(size_of::<Pubkey>(), 32);\nassert_eq!(size_of::<u64>(), 8);\nassert_eq!(size_of::<u32>(), 4);\nassert_eq!(size_of::<u16>(), 2);\nassert_eq!(size_of::<u8>(), 1);\nassert_eq!(size_of::<bool>(), 1);\nassert_eq!(size_of::<i64>(), 8);\n// String: 4 bytes (length prefix) + content bytes\n// Vec<T>: 4 bytes (length prefix) + T * count\n```",
          },
          {
            id: "ral8",
            title: "Serialization Deep Dive",
            description: "Borsh serialization for Solana programs",
            order: 7,
            type: "content",
            xpReward: 50,
            duration: "25 min",
            content:
              '# Serialization Deep Dive\n\nSolana accounts store raw bytes. Serialization converts Rust structs to/from these bytes.\n\n## Borsh Serialization\n\nBorsh (Binary Object Representation Serializer for Hashing) is Solana\'s standard:\n\n```rust\nuse borsh::{BorshSerialize, BorshDeserialize};\n\n#[derive(BorshSerialize, BorshDeserialize)]\npub struct Transfer {\n    pub amount: u64,    // 8 bytes, little-endian\n    pub memo: String,   // 4 bytes length + UTF-8 bytes\n}\n\n// Serialized bytes for Transfer { amount: 100, memo: "hi" }:\n// [100, 0, 0, 0, 0, 0, 0, 0,  // amount: 100 as u64 LE\n//  2, 0, 0, 0,                  // memo length: 2 as u32 LE\n//  104, 105]                    // memo: "hi" as UTF-8\n```\n\n## Anchor\'s 8-Byte Discriminator\n\nAnchor prepends an 8-byte discriminator to every account:\n\n```rust\n// Discriminator = SHA256("account:Config")[..8]\n// This prevents account substitution attacks\n\n#[account]\npub struct Config {\n    pub authority: Pubkey, // starts at byte 8\n}\n// Layout: [disc: 8][authority: 32] = 40 bytes total\n```\n\n## Manual Deserialization\n\nSometimes you need to read accounts from other programs:\n\n```rust\nuse borsh::BorshDeserialize;\n\n#[derive(BorshDeserialize)]\npub struct ExternalTokenData {\n    pub mint: Pubkey,\n    pub owner: Pubkey,\n    pub amount: u64,\n}\n\nfn read_token_balance(account: &AccountInfo) -> Result<u64> {\n    let data = account.try_borrow_data()?;\n    // SPL Token accounts don\'t have an Anchor discriminator\n    let token_data = ExternalTokenData::try_from_slice(&data)?;\n    Ok(token_data.amount)\n}\n```\n\n## Performance Comparison\n\n| Method | CU Cost | Use Case |\n|--------|---------|----------|\n| Borsh (normal) | ~500-2000 | Most accounts |\n| Zero-copy | ~100-200 | Large accounts (>1KB) |\n| Manual byte parsing | ~50-100 | Hot paths, known layouts |\n\n## Manual Byte Parsing for Hot Paths\n\n```rust\n// Fastest: read specific bytes directly\nfn read_balance_fast(data: &[u8]) -> Result<u64> {\n    // Skip 8-byte discriminator + 32-byte authority\n    let offset = 8 + 32;\n    let bytes: [u8; 8] = data[offset..offset + 8]\n        .try_into()\n        .map_err(|_| ErrorCode::InvalidData)?;\n    Ok(u64::from_le_bytes(bytes))\n}\n```',
          },
          {
            id: "ral9",
            title: "Performance Challenge",
            description: "Optimize data structures for on-chain efficiency",
            order: 8,
            type: "challenge",
            xpReward: 100,
            duration: "40 min",
            challenge: {
              language: "rust",
              prompt:
                "Redesign this account structure for optimal memory layout, minimal rent, and efficient access patterns.",
              starterCode:
                "use anchor_lang::prelude::*;\n\n// CURRENT: Inefficient layout, high rent cost\n// Total space: 8 (disc) + ??? bytes\n#[account]\npub struct Leaderboard {\n    pub authority: Pubkey,      // 32\n    pub is_active: bool,        // 1 (+ padding?)\n    pub entry_count: u64,       // 8\n    pub is_frozen: bool,        // 1\n    pub max_entries: u64,       // 8\n    pub season: u8,             // 1\n    pub name: String,           // variable\n    pub bump: u8,               // 1\n    pub entries: Vec<LeaderboardEntry>, // variable\n}\n\n#[derive(AnchorSerialize, AnchorDeserialize, Clone)]\npub struct LeaderboardEntry {\n    pub player: Pubkey,         // 32\n    pub is_active: bool,        // 1\n    pub score: u64,             // 8\n    pub rank_change: i8,        // 1\n    pub games_played: u64,      // 8\n    pub is_verified: bool,      // 1\n    pub last_updated: i64,      // 8\n}\n\n// Optimize this for:\n// 1. Minimal account space\n// 2. Packed boolean flags\n// 3. Ordered fields by alignment\n// 4. Zero-copy for the entries array\n// 5. Reserved bytes for future fields",
              solution:
                "use anchor_lang::prelude::*;\n\n// OPTIMIZED: Efficient layout with packed flags\n// Fields ordered by alignment (largest first)\n#[account(zero_copy)]\n#[repr(C)]\npub struct Leaderboard {\n    pub authority: Pubkey,       // 32 bytes\n    pub entry_count: u64,        // 8 bytes\n    pub max_entries: u64,        // 8 bytes\n    pub flags: u8,               // 1 byte (bit 0: is_active, bit 1: is_frozen)\n    pub season: u8,              // 1 byte\n    pub bump: u8,                // 1 byte\n    pub name_len: u8,            // 1 byte\n    pub name: [u8; 32],          // 32 bytes (fixed-size, no length prefix overhead)\n    pub _reserved: [u8; 64],     // 64 bytes for future fields\n    pub entries: [LeaderboardEntry; 100], // Fixed array, zero-copy\n}\n\nimpl Leaderboard {\n    pub fn is_active(&self) -> bool { self.flags & (1 << 0) != 0 }\n    pub fn set_active(&mut self, val: bool) {\n        if val { self.flags |= 1 << 0; } else { self.flags &= !(1 << 0); }\n    }\n    pub fn is_frozen(&self) -> bool { self.flags & (1 << 1) != 0 }\n    pub fn set_frozen(&mut self, val: bool) {\n        if val { self.flags |= 1 << 1; } else { self.flags &= !(1 << 1); }\n    }\n    pub fn get_name(&self) -> &[u8] {\n        &self.name[..self.name_len as usize]\n    }\n}\n\n#[zero_copy]\n#[repr(C)]\npub struct LeaderboardEntry {\n    pub player: Pubkey,          // 32 bytes\n    pub score: u64,              // 8 bytes\n    pub games_played: u64,       // 8 bytes\n    pub last_updated: i64,       // 8 bytes\n    pub rank_change: i8,         // 1 byte\n    pub flags: u8,               // 1 byte (bit 0: is_active, bit 1: is_verified)\n    pub _padding: [u8; 6],       // 6 bytes alignment padding\n}\n\nimpl LeaderboardEntry {\n    pub fn is_active(&self) -> bool { self.flags & (1 << 0) != 0 }\n    pub fn is_verified(&self) -> bool { self.flags & (1 << 1) != 0 }\n}\n\n// Space comparison:\n// Original entry: 32 + 1 + 8 + 1 + 8 + 1 + 8 = 59 bytes\n// Optimized entry: 32 + 8 + 8 + 8 + 1 + 1 + 6 = 64 bytes (aligned, zero-copy)\n// But zero-copy saves ~500 CU per access!",
              testCases: [
                {
                  id: "t1",
                  name: "Flags pack booleans",
                  input: "is_active + is_frozen",
                  expectedOutput: "single u8 field",
                },
                {
                  id: "t2",
                  name: "Fields ordered by alignment",
                  input: "struct layout",
                  expectedOutput: "Pubkey > u64 > u8",
                },
                {
                  id: "t3",
                  name: "Zero-copy attribute",
                  input: "Leaderboard",
                  expectedOutput: "#[account(zero_copy)]",
                },
                {
                  id: "t4",
                  name: "Reserved bytes",
                  input: "struct",
                  expectedOutput: "_reserved: [u8; 64]",
                },
                {
                  id: "t5",
                  name: "Fixed-size name",
                  input: "name field",
                  expectedOutput: "[u8; 32] not String",
                },
              ],
              hints: [
                "Pack booleans into a u8 flags field with bitwise operations",
                "Order fields largest-to-smallest for alignment",
                "Use #[account(zero_copy)] with #[repr(C)] for large accounts",
                "Replace String with [u8; N] + len field for fixed-size names",
                "Add _reserved bytes for future upgrades",
              ],
            },
          },
        ],
      },
      {
        id: "rav4",
        title: "Async & Concurrency Patterns",
        description: "Async Rust for Solana clients and parallel processing",
        order: 3,
        lessons: [
          {
            id: "ral10",
            title: "Async Rust for Solana Clients",
            description:
              "Using async/await for RPC calls and transaction management",
            order: 9,
            type: "content",
            xpReward: 50,
            duration: "30 min",
            content:
              '# Async Rust for Solana Clients\n\nSolana client applications heavily use async Rust for RPC communication and transaction management.\n\n## Async Basics\n\n```rust\nuse solana_client::nonblocking::rpc_client::RpcClient;\nuse solana_sdk::commitment_config::CommitmentConfig;\n\nasync fn get_balance(rpc_url: &str, pubkey: &Pubkey) -> Result<u64> {\n    let client = RpcClient::new_with_commitment(\n        rpc_url.to_string(),\n        CommitmentConfig::confirmed(),\n    );\n    let balance = client.get_balance(pubkey).await?;\n    Ok(balance)\n}\n```\n\n## Tokio Runtime\n\nSolana clients typically use Tokio:\n\n```rust\n#[tokio::main]\nasync fn main() -> Result<()> {\n    let client = RpcClient::new("https://api.devnet.solana.com".to_string());\n    \n    // Concurrent RPC calls\n    let (balance, slot, blockhash) = tokio::try_join!(\n        client.get_balance(&pubkey),\n        client.get_slot(),\n        client.get_latest_blockhash(),\n    )?;\n    \n    println!("Balance: {}, Slot: {}, Blockhash: {}", balance, slot, blockhash);\n    Ok(())\n}\n```\n\n## Error Handling in Async\n\n```rust\nuse tokio::time::{timeout, Duration};\n\nasync fn send_with_retry(\n    client: &RpcClient,\n    tx: &Transaction,\n    max_retries: u32,\n) -> Result<Signature> {\n    let mut last_error = None;\n    \n    for attempt in 0..max_retries {\n        match timeout(\n            Duration::from_secs(30),\n            client.send_and_confirm_transaction(tx),\n        ).await {\n            Ok(Ok(sig)) => return Ok(sig),\n            Ok(Err(e)) => {\n                last_error = Some(e);\n                tokio::time::sleep(Duration::from_millis(500 * (attempt as u64 + 1))).await;\n            }\n            Err(_) => {\n                last_error = Some(anyhow::anyhow!("Transaction timed out"));\n            }\n        }\n    }\n    \n    Err(last_error.unwrap_or_else(|| anyhow::anyhow!("Max retries exceeded")))\n}\n```\n\n## Channels for Event Processing\n\n```rust\nuse tokio::sync::mpsc;\n\nasync fn process_events(program_id: Pubkey) {\n    let (tx, mut rx) = mpsc::channel::<ProgramEvent>(100);\n    \n    // Spawn listener\n    tokio::spawn(async move {\n        // Subscribe to program logs\n        // Parse events and send through channel\n    });\n    \n    // Process events\n    while let Some(event) = rx.recv().await {\n        match event {\n            ProgramEvent::Enrollment(data) => handle_enrollment(data).await,\n            ProgramEvent::Completion(data) => handle_completion(data).await,\n        }\n    }\n}\n```',
          },
          {
            id: "ral11",
            title: "Parallel Processing Patterns",
            description: "Concurrent account fetching and batch operations",
            order: 10,
            type: "content",
            xpReward: 50,
            duration: "30 min",
            content:
              '# Parallel Processing Patterns\n\n## Concurrent Account Fetching\n\n```rust\nuse futures::future::join_all;\n\nasync fn fetch_all_profiles(\n    client: &RpcClient,\n    addresses: &[Pubkey],\n) -> Result<Vec<Option<Account>>> {\n    // Fetch all accounts in parallel\n    let futures: Vec<_> = addresses\n        .iter()\n        .map(|addr| client.get_account(addr))\n        .collect();\n    \n    let results = join_all(futures).await;\n    \n    results\n        .into_iter()\n        .map(|r| match r {\n            Ok(account) => Ok(Some(account)),\n            Err(_) => Ok(None),\n        })\n        .collect()\n}\n```\n\n## Batch RPC with getMultipleAccounts\n\n```rust\nasync fn fetch_batch(\n    client: &RpcClient,\n    addresses: &[Pubkey],\n) -> Result<Vec<Option<Account>>> {\n    // More efficient: single RPC call for multiple accounts\n    let accounts = client.get_multiple_accounts(addresses).await?;\n    Ok(accounts)\n}\n```\n\n## Parallel Transaction Sending\n\n```rust\nasync fn send_batch_transactions(\n    client: &RpcClient,\n    transactions: Vec<Transaction>,\n) -> Vec<Result<Signature>> {\n    let semaphore = Arc::new(Semaphore::new(10)); // Max 10 concurrent\n    \n    let futures: Vec<_> = transactions\n        .into_iter()\n        .map(|tx| {\n            let client = client.clone();\n            let permit = semaphore.clone();\n            \n            async move {\n                let _permit = permit.acquire().await.unwrap();\n                client.send_and_confirm_transaction(&tx).await\n            }\n        })\n        .collect();\n    \n    join_all(futures).await\n        .into_iter()\n        .map(|r| r.map_err(Into::into))\n        .collect()\n}\n```\n\n## Rate Limiting\n\n```rust\nuse governor::{Quota, RateLimiter};\nuse std::num::NonZeroU32;\n\nfn create_rate_limiter() -> RateLimiter {\n    // 10 requests per second\n    RateLimiter::direct(\n        Quota::per_second(NonZeroU32::new(10).unwrap())\n    )\n}\n\nasync fn rate_limited_fetch(\n    client: &RpcClient,\n    limiter: &RateLimiter,\n    pubkey: &Pubkey,\n) -> Result<Account> {\n    limiter.until_ready().await;\n    client.get_account(pubkey).await.map_err(Into::into)\n}\n```\n\n## Stream Processing with WebSocket\n\n```rust\nuse solana_client::nonblocking::pubsub_client::PubsubClient;\n\nasync fn subscribe_to_program(program_id: &Pubkey) -> Result<()> {\n    let ws_url = "wss://api.devnet.solana.com";\n    let pubsub = PubsubClient::new(ws_url).await?;\n    \n    let (mut notifications, _unsubscribe) = pubsub\n        .logs_subscribe(\n            RpcTransactionLogsFilter::Mentions(vec![program_id.to_string()]),\n            RpcTransactionLogsConfig { commitment: Some(CommitmentConfig::confirmed()) },\n        )\n        .await?;\n    \n    while let Some(log) = notifications.next().await {\n        // Process program log\n        println!("Signature: {}", log.value.signature);\n        for line in &log.value.logs {\n            if line.contains("Program data:") {\n                // Decode Anchor event\n            }\n        }\n    }\n    Ok(())\n}\n```',
          },
          {
            id: "ral12",
            title: "Async Patterns Challenge",
            description: "Build an async Solana indexer",
            order: 11,
            type: "challenge",
            xpReward: 100,
            duration: "35 min",
            challenge: {
              language: "rust",
              prompt:
                "Build an async account indexer that watches a program, fetches updated accounts in parallel, deserializes them, and maintains an in-memory cache.",
              starterCode:
                "use std::collections::HashMap;\nuse std::sync::Arc;\nuse tokio::sync::RwLock;\n\n// Build an indexer that:\n// 1. Maintains a cache of deserialized accounts\n// 2. Fetches multiple accounts in parallel\n// 3. Updates cache atomically\n// 4. Provides concurrent read access\n\nstruct AccountCache<T> {\n    // TODO: Thread-safe cache\n}\n\nimpl<T: Clone + Send + Sync> AccountCache<T> {\n    fn new() -> Self { todo!() }\n    \n    async fn get(&self, key: &str) -> Option<T> { todo!() }\n    \n    async fn set(&self, key: String, value: T) { todo!() }\n    \n    async fn batch_update(&self, entries: Vec<(String, T)>) { todo!() }\n    \n    async fn get_all(&self) -> HashMap<String, T> { todo!() }\n}",
              solution:
                'use std::collections::HashMap;\nuse std::sync::Arc;\nuse tokio::sync::RwLock;\n\nstruct AccountCache<T> {\n    data: Arc<RwLock<HashMap<String, T>>>,\n}\n\nimpl<T: Clone + Send + Sync> AccountCache<T> {\n    fn new() -> Self {\n        AccountCache {\n            data: Arc::new(RwLock::new(HashMap::new())),\n        }\n    }\n    \n    async fn get(&self, key: &str) -> Option<T> {\n        let read = self.data.read().await;\n        read.get(key).cloned()\n    }\n    \n    async fn set(&self, key: String, value: T) {\n        let mut write = self.data.write().await;\n        write.insert(key, value);\n    }\n    \n    async fn batch_update(&self, entries: Vec<(String, T)>) {\n        let mut write = self.data.write().await;\n        for (key, value) in entries {\n            write.insert(key, value);\n        }\n    }\n    \n    async fn get_all(&self) -> HashMap<String, T> {\n        let read = self.data.read().await;\n        read.clone()\n    }\n    \n    async fn remove(&self, key: &str) -> Option<T> {\n        let mut write = self.data.write().await;\n        write.remove(key)\n    }\n    \n    async fn len(&self) -> usize {\n        let read = self.data.read().await;\n        read.len()\n    }\n}\n\n// Usage:\n// let cache = AccountCache::<ProfileData>::new();\n// cache.set("user1".into(), profile).await;\n// let profile = cache.get("user1").await;\n// cache.batch_update(vec![("user2".into(), p2), ("user3".into(), p3)]).await;',
              testCases: [
                {
                  id: "t1",
                  name: "Concurrent reads work",
                  input: "multiple get() calls",
                  expectedOutput: "all return correct data",
                },
                {
                  id: "t2",
                  name: "Batch update is atomic",
                  input: "batch_update with 3 entries",
                  expectedOutput: "all 3 visible after",
                },
                {
                  id: "t3",
                  name: "RwLock allows parallel reads",
                  input: "concurrent get_all()",
                  expectedOutput: "no deadlock",
                },
                {
                  id: "t4",
                  name: "Write blocks reads",
                  input: "set during get_all",
                  expectedOutput: "consistent state",
                },
              ],
              hints: [
                "Use Arc<RwLock<HashMap>> for thread-safe concurrent access",
                "RwLock allows multiple readers OR one writer",
                "Use .read().await for read access, .write().await for write access",
                "Clone data in get() to release the lock quickly",
              ],
            },
          },
        ],
      },
    ],
  }),
  buildCourse({
    id: "defi-advanced",
    slug: "defi-advanced",
    title: "Advanced DeFi: Protocol Development",
    description:
      "Build production DeFi protocols on Solana. Covers advanced AMM design, lending architecture, vault strategies, and DeFi-specific security patterns.",
    thumbnail: "/courses/defi-advanced.png",
    creator: "Superteam Academy",
    difficulty: "advanced",
    xpTotal: 1500,
    trackId: 3,
    trackLevel: 2,
    duration: "7 hours",
    prerequisiteId: "defi-basics",
    isActive: true,
    createdAt: "2025-09-01T00:00:00Z",
    modules: [
      {
        id: "dav1",
        title: "Advanced AMM Design",
        description: "Building automated market makers on Solana",
        order: 0,
        lessons: [
          {
            id: "dal1",
            title: "AMM Mathematics",
            description:
              "The math behind constant product and concentrated liquidity",
            order: 0,
            type: "content",
            xpReward: 55,
            duration: "30 min",
            content:
              "# AMM Mathematics\n\nAutomated Market Makers replace order books with mathematical formulas to determine prices.\n\n## Constant Product Formula (x * y = k)\n\nThe simplest and most common AMM model, used by Raydium's classic pools:\n\n```\nx * y = k\n\nWhere:\n  x = reserve of token A\n  y = reserve of token B\n  k = constant (invariant)\n```\n\n### Price Calculation\n\n```rust\n// Spot price of token A in terms of token B\nfn spot_price(reserve_a: u64, reserve_b: u64) -> f64 {\n    reserve_b as f64 / reserve_a as f64\n}\n\n// Amount out for a given input (with fee)\nfn get_amount_out(\n    amount_in: u64,\n    reserve_in: u64,\n    reserve_out: u64,\n    fee_bps: u16,\n) -> Result<u64> {\n    let fee_factor = 10_000u128 - fee_bps as u128;\n    let amount_in_with_fee = (amount_in as u128)\n        .checked_mul(fee_factor)\n        .ok_or(ErrorCode::Overflow)?;\n    let numerator = amount_in_with_fee\n        .checked_mul(reserve_out as u128)\n        .ok_or(ErrorCode::Overflow)?;\n    let denominator = (reserve_in as u128)\n        .checked_mul(10_000)\n        .ok_or(ErrorCode::Overflow)?\n        .checked_add(amount_in_with_fee)\n        .ok_or(ErrorCode::Overflow)?;\n    Ok((numerator / denominator) as u64)\n}\n```\n\n### Slippage & Price Impact\n\n```rust\nfn price_impact_bps(\n    amount_in: u64,\n    reserve_in: u64,\n    reserve_out: u64,\n) -> u64 {\n    let ideal_out = (amount_in as u128 * reserve_out as u128) / reserve_in as u128;\n    let actual_out = get_amount_out(amount_in, reserve_in, reserve_out, 0).unwrap();\n    let impact = ((ideal_out - actual_out as u128) * 10_000) / ideal_out;\n    impact as u64\n}\n```\n\n## Concentrated Liquidity\n\nUsed by Orca Whirlpools and Meteora DLMM:\n\n```\nLiquidity is concentrated in price ranges [p_lower, p_upper]\ninstead of spread across [0, infinity]\n```\n\n### Benefits\n- 10-100x capital efficiency vs constant product\n- LPs earn more fees per dollar of liquidity\n- Better prices for traders\n\n### Tick Math\n```rust\n// Price at a given tick\nfn price_at_tick(tick: i32) -> f64 {\n    1.0001_f64.powi(tick)\n}\n\n// Tick for a given price\nfn tick_at_price(price: f64) -> i32 {\n    (price.ln() / 1.0001_f64.ln()).floor() as i32\n}\n```\n\n## Stable Swap (Curve Formula)\n\nFor stablecoins and correlated assets:\n\n```\nA * n^n * sum(x_i) + D = A * D * n^n + D^(n+1) / (n^n * prod(x_i))\n```\n\nThis provides near-zero slippage for same-peg trades.",
          },
          {
            id: "dal2",
            title: "Building a Swap Program",
            description: "Implement a constant product AMM on Solana",
            order: 1,
            type: "content",
            xpReward: 55,
            duration: "35 min",
            content:
              '# Building a Swap Program on Solana\n\n## Pool Account Structure\n\n```rust\n#[account]\n#[derive(InitSpace)]\npub struct Pool {\n    pub authority: Pubkey,\n    pub token_a_mint: Pubkey,\n    pub token_b_mint: Pubkey,\n    pub token_a_vault: Pubkey,\n    pub token_b_vault: Pubkey,\n    pub lp_mint: Pubkey,\n    pub fee_bps: u16,\n    pub reserve_a: u64,\n    pub reserve_b: u64,\n    pub lp_supply: u64,\n    pub bump: u8,\n    pub _reserved: [u8; 64],\n}\n```\n\n## Initialize Pool\n\n```rust\npub fn initialize_pool(\n    ctx: Context<InitializePool>,\n    fee_bps: u16,\n) -> Result<()> {\n    require!(fee_bps <= 10_000, PoolError::InvalidFee);\n    let pool = &mut ctx.accounts.pool;\n    pool.authority = ctx.accounts.authority.key();\n    pool.token_a_mint = ctx.accounts.token_a_mint.key();\n    pool.token_b_mint = ctx.accounts.token_b_mint.key();\n    pool.token_a_vault = ctx.accounts.token_a_vault.key();\n    pool.token_b_vault = ctx.accounts.token_b_vault.key();\n    pool.lp_mint = ctx.accounts.lp_mint.key();\n    pool.fee_bps = fee_bps;\n    pool.reserve_a = 0;\n    pool.reserve_b = 0;\n    pool.lp_supply = 0;\n    pool.bump = ctx.bumps.pool;\n    Ok(())\n}\n```\n\n## Swap Instruction\n\n```rust\npub fn swap(\n    ctx: Context<Swap>,\n    amount_in: u64,\n    minimum_amount_out: u64,\n) -> Result<()> {\n    let pool = &mut ctx.accounts.pool;\n    require!(amount_in > 0, PoolError::ZeroAmount);\n    \n    // Determine direction\n    let (reserve_in, reserve_out) = if ctx.accounts.source_mint.key() == pool.token_a_mint {\n        (pool.reserve_a, pool.reserve_b)\n    } else {\n        (pool.reserve_b, pool.reserve_a)\n    };\n    \n    // Calculate output\n    let amount_out = get_amount_out(amount_in, reserve_in, reserve_out, pool.fee_bps)?;\n    require!(amount_out >= minimum_amount_out, PoolError::SlippageExceeded);\n    \n    // Transfer tokens in\n    token::transfer(\n        CpiContext::new(\n            ctx.accounts.token_program.to_account_info(),\n            Transfer {\n                from: ctx.accounts.user_source.to_account_info(),\n                to: ctx.accounts.vault_source.to_account_info(),\n                authority: ctx.accounts.user.to_account_info(),\n            },\n        ),\n        amount_in,\n    )?;\n    \n    // Transfer tokens out (PDA signs)\n    let seeds = &[b"pool".as_ref(), &[pool.bump]];\n    token::transfer(\n        CpiContext::new_with_signer(\n            ctx.accounts.token_program.to_account_info(),\n            Transfer {\n                from: ctx.accounts.vault_dest.to_account_info(),\n                to: ctx.accounts.user_dest.to_account_info(),\n                authority: pool.to_account_info(),\n            },\n            &[seeds],\n        ),\n        amount_out,\n    )?;\n    \n    // Update reserves\n    if ctx.accounts.source_mint.key() == pool.token_a_mint {\n        pool.reserve_a = pool.reserve_a.checked_add(amount_in).ok_or(PoolError::Overflow)?;\n        pool.reserve_b = pool.reserve_b.checked_sub(amount_out).ok_or(PoolError::Overflow)?;\n    } else {\n        pool.reserve_b = pool.reserve_b.checked_add(amount_in).ok_or(PoolError::Overflow)?;\n        pool.reserve_a = pool.reserve_a.checked_sub(amount_out).ok_or(PoolError::Overflow)?;\n    }\n    \n    emit!(SwapExecuted {\n        user: ctx.accounts.user.key(),\n        amount_in,\n        amount_out,\n        fee: amount_in.checked_mul(pool.fee_bps as u64).unwrap() / 10_000,\n    });\n    Ok(())\n}\n```\n\n## Add Liquidity\n\n```rust\npub fn add_liquidity(\n    ctx: Context<AddLiquidity>,\n    amount_a: u64,\n    amount_b: u64,\n    min_lp_tokens: u64,\n) -> Result<()> {\n    let pool = &mut ctx.accounts.pool;\n    \n    let lp_tokens = if pool.lp_supply == 0 {\n        // First deposit: LP tokens = sqrt(amount_a * amount_b)\n        let product = (amount_a as u128)\n            .checked_mul(amount_b as u128)\n            .ok_or(PoolError::Overflow)?;\n        integer_sqrt(product) as u64\n    } else {\n        // Proportional deposit\n        let lp_a = (amount_a as u128)\n            .checked_mul(pool.lp_supply as u128)\n            .ok_or(PoolError::Overflow)?\n            / pool.reserve_a as u128;\n        let lp_b = (amount_b as u128)\n            .checked_mul(pool.lp_supply as u128)\n            .ok_or(PoolError::Overflow)?\n            / pool.reserve_b as u128;\n        std::cmp::min(lp_a, lp_b) as u64\n    };\n    \n    require!(lp_tokens >= min_lp_tokens, PoolError::SlippageExceeded);\n    \n    // Transfer tokens and mint LP tokens...\n    pool.reserve_a = pool.reserve_a.checked_add(amount_a).ok_or(PoolError::Overflow)?;\n    pool.reserve_b = pool.reserve_b.checked_add(amount_b).ok_or(PoolError::Overflow)?;\n    pool.lp_supply = pool.lp_supply.checked_add(lp_tokens).ok_or(PoolError::Overflow)?;\n    \n    Ok(())\n}\n```',
          },
          {
            id: "dal3",
            title: "AMM Challenge",
            description:
              "Implement and test a swap function with fee calculation",
            order: 2,
            type: "challenge",
            xpReward: 80,
            duration: "40 min",
            challenge: {
              language: "rust",
              prompt:
                "Implement the core AMM math functions: get_amount_out with fees, add_liquidity LP calculation, and price_impact calculation. All using checked arithmetic.",
              starterCode:
                "// Implement these three functions with checked arithmetic.\n// No floating point — use u128 for intermediate calculations.\n\nfn get_amount_out(\n    amount_in: u64,\n    reserve_in: u64,\n    reserve_out: u64,\n    fee_bps: u16, // basis points, e.g., 30 = 0.3%\n) -> Option<u64> {\n    // 1. Apply fee: effective_in = amount_in * (10000 - fee_bps) / 10000\n    // 2. Constant product: amount_out = (effective_in * reserve_out) / (reserve_in + effective_in)\n    // 3. Return None on overflow\n    todo!()\n}\n\nfn calculate_lp_tokens(\n    amount_a: u64,\n    amount_b: u64,\n    reserve_a: u64,\n    reserve_b: u64,\n    lp_supply: u64,\n) -> Option<u64> {\n    // If lp_supply == 0: return sqrt(amount_a * amount_b)\n    // Otherwise: return min(amount_a * lp_supply / reserve_a, amount_b * lp_supply / reserve_b)\n    todo!()\n}\n\nfn price_impact_bps(\n    amount_in: u64,\n    reserve_in: u64,\n    reserve_out: u64,\n) -> Option<u64> {\n    // Calculate price impact in basis points\n    // ideal_out = amount_in * reserve_out / reserve_in\n    // actual_out = get_amount_out(amount_in, reserve_in, reserve_out, 0)\n    // impact = (ideal_out - actual_out) * 10000 / ideal_out\n    todo!()\n}\n\nfn integer_sqrt(n: u128) -> u64 {\n    // Newton's method for integer square root\n    todo!()\n}",
              solution:
                "fn get_amount_out(\n    amount_in: u64,\n    reserve_in: u64,\n    reserve_out: u64,\n    fee_bps: u16,\n) -> Option<u64> {\n    if amount_in == 0 || reserve_in == 0 || reserve_out == 0 {\n        return None;\n    }\n    let fee_factor = 10_000u128.checked_sub(fee_bps as u128)?;\n    let amount_in_with_fee = (amount_in as u128).checked_mul(fee_factor)?;\n    let numerator = amount_in_with_fee.checked_mul(reserve_out as u128)?;\n    let denominator = (reserve_in as u128)\n        .checked_mul(10_000)?\n        .checked_add(amount_in_with_fee)?;\n    Some((numerator / denominator) as u64)\n}\n\nfn calculate_lp_tokens(\n    amount_a: u64,\n    amount_b: u64,\n    reserve_a: u64,\n    reserve_b: u64,\n    lp_supply: u64,\n) -> Option<u64> {\n    if lp_supply == 0 {\n        let product = (amount_a as u128).checked_mul(amount_b as u128)?;\n        Some(integer_sqrt(product))\n    } else {\n        let lp_a = (amount_a as u128)\n            .checked_mul(lp_supply as u128)?\n            / reserve_a as u128;\n        let lp_b = (amount_b as u128)\n            .checked_mul(lp_supply as u128)?\n            / reserve_b as u128;\n        Some(std::cmp::min(lp_a, lp_b) as u64)\n    }\n}\n\nfn price_impact_bps(\n    amount_in: u64,\n    reserve_in: u64,\n    reserve_out: u64,\n) -> Option<u64> {\n    let ideal_out = (amount_in as u128)\n        .checked_mul(reserve_out as u128)?\n        / reserve_in as u128;\n    let actual_out = get_amount_out(amount_in, reserve_in, reserve_out, 0)? as u128;\n    if ideal_out == 0 { return Some(0); }\n    let impact = ideal_out.checked_sub(actual_out)?\n        .checked_mul(10_000)?\n        / ideal_out;\n    Some(impact as u64)\n}\n\nfn integer_sqrt(n: u128) -> u64 {\n    if n == 0 { return 0; }\n    let mut x = n;\n    let mut y = (x + 1) / 2;\n    while y < x {\n        x = y;\n        y = (x + n / x) / 2;\n    }\n    x as u64\n}",
              testCases: [
                {
                  id: "t1",
                  name: "Swap 100 with 0.3% fee",
                  input: "amount_in=100, reserves=1000/1000, fee=30",
                  expectedOutput: "~90 out",
                },
                {
                  id: "t2",
                  name: "First LP deposit",
                  input: "a=1000, b=4000, supply=0",
                  expectedOutput: "2000 LP",
                },
                {
                  id: "t3",
                  name: "Price impact increases with size",
                  input: "small vs large trade",
                  expectedOutput: "larger impact for larger trade",
                },
                {
                  id: "t4",
                  name: "Zero reserves returns None",
                  input: "reserve_in=0",
                  expectedOutput: "None",
                },
              ],
              hints: [
                "Use u128 for all intermediate calculations to avoid overflow",
                "Fee: multiply by (10000 - fee_bps), divide by 10000",
                "For LP: first deposit uses sqrt, subsequent use min of proportional amounts",
                "Newton's method: x = (x + n/x) / 2 until convergence",
              ],
            },
          },
        ],
      },
      {
        id: "dav2",
        title: "Lending Protocol Architecture",
        description: "Design and implement lending protocols on Solana",
        order: 1,
        lessons: [
          {
            id: "dal4",
            title: "Lending Protocol Design",
            description: "Architecture of on-chain lending protocols",
            order: 3,
            type: "content",
            xpReward: 55,
            duration: "35 min",
            content:
              "# Lending Protocol Design\n\nLending protocols are among the most complex DeFi primitives. Understanding their architecture is essential for building on Solana.\n\n## Core Concepts\n\n### Interest Rate Model\n\n```rust\n// Utilization-based interest rate\nfn calculate_borrow_rate(\n    total_deposits: u64,\n    total_borrows: u64,\n    optimal_utilization: u64, // basis points, e.g., 8000 = 80%\n    base_rate: u64,           // basis points\n    slope1: u64,              // rate increase up to optimal\n    slope2: u64,              // rate increase above optimal (much steeper)\n) -> Option<u64> {\n    if total_deposits == 0 { return Some(base_rate); }\n    \n    let utilization = (total_borrows as u128)\n        .checked_mul(10_000)?\n        / total_deposits as u128;\n    \n    if utilization <= optimal_utilization as u128 {\n        // Below optimal: gentle slope\n        let rate = base_rate as u128 + utilization\n            .checked_mul(slope1 as u128)?\n            / optimal_utilization as u128;\n        Some(rate as u64)\n    } else {\n        // Above optimal: steep slope to discourage over-borrowing\n        let excess = utilization - optimal_utilization as u128;\n        let max_excess = 10_000u128 - optimal_utilization as u128;\n        let rate = base_rate as u128 + slope1 as u128\n            + excess.checked_mul(slope2 as u128)? / max_excess;\n        Some(rate as u64)\n    }\n}\n```\n\n## Account Structure\n\n```rust\n#[account]\npub struct LendingMarket {\n    pub authority: Pubkey,\n    pub oracle: Pubkey,\n    pub reserve_count: u16,\n    pub bump: u8,\n    pub _reserved: [u8; 128],\n}\n\n#[account]\npub struct Reserve {\n    pub market: Pubkey,\n    pub mint: Pubkey,\n    pub vault: Pubkey,          // Token vault holding deposits\n    pub collateral_mint: Pubkey, // cToken mint (receipt token)\n    pub oracle_feed: Pubkey,\n    pub total_deposits: u64,\n    pub total_borrows: u64,\n    pub cumulative_borrow_rate: u128, // Compound interest accumulator\n    pub last_update_slot: u64,\n    pub config: ReserveConfig,\n    pub bump: u8,\n    pub _reserved: [u8; 64],\n}\n\n#[derive(AnchorSerialize, AnchorDeserialize, Clone)]\npub struct ReserveConfig {\n    pub optimal_utilization: u16,  // 8000 = 80%\n    pub loan_to_value: u16,        // 7500 = 75%\n    pub liquidation_threshold: u16, // 8500 = 85%\n    pub liquidation_bonus: u16,     // 500 = 5%\n    pub base_rate: u16,\n    pub slope1: u16,\n    pub slope2: u16,\n    pub protocol_fee_bps: u16,\n}\n\n#[account]\npub struct Obligation {\n    pub owner: Pubkey,\n    pub market: Pubkey,\n    pub deposits: Vec<ObligationCollateral>,\n    pub borrows: Vec<ObligationLiquidity>,\n    pub deposited_value_usd: u64,\n    pub borrowed_value_usd: u64,\n    pub bump: u8,\n}\n```\n\n## Key Operations\n\n| Operation | Description |\n|-----------|-------------|\n| Deposit | User deposits tokens, receives cTokens |\n| Withdraw | User burns cTokens, receives tokens + interest |\n| Borrow | User borrows against collateral |\n| Repay | User repays borrowed amount + interest |\n| Liquidate | Third party repays unhealthy debt at a discount |",
          },
          {
            id: "dal5",
            title: "Collateral & Liquidation",
            description: "Managing collateral health and liquidation mechanics",
            order: 4,
            type: "content",
            xpReward: 55,
            duration: "35 min",
            content:
              "# Collateral & Liquidation\n\n## Health Factor\n\nThe health factor determines if a position can be liquidated:\n\n```rust\nfn calculate_health_factor(\n    collateral_value_usd: u64,\n    loan_to_value: u16,\n    borrowed_value_usd: u64,\n) -> Option<u64> {\n    if borrowed_value_usd == 0 { return Some(u64::MAX); }\n    \n    let max_borrow = (collateral_value_usd as u128)\n        .checked_mul(loan_to_value as u128)?\n        / 10_000;\n    \n    // Health factor in basis points (10000 = healthy, <10000 = liquidatable)\n    let health = max_borrow\n        .checked_mul(10_000)?\n        / borrowed_value_usd as u128;\n    \n    Some(health as u64)\n}\n```\n\n## Oracle Integration\n\nDeFi protocols need reliable price feeds:\n\n```rust\nuse pyth_solana_receiver_sdk::price_update::PriceUpdateV2;\n\nfn get_price_from_oracle(\n    price_feed: &AccountInfo,\n    max_age_seconds: u64,\n) -> Result<(u64, i32)> {\n    let price_update = PriceUpdateV2::try_deserialize(\n        &mut &price_feed.data.borrow()[..]\n    )?;\n    \n    let clock = Clock::get()?;\n    let price = price_update.get_price_no_older_than(\n        &clock,\n        max_age_seconds,\n        &feed_id,\n    )?;\n    \n    // price.price is i64, price.exponent is i32\n    // e.g., price = 15000000000, exponent = -8 means $150.00\n    Ok((price.price as u64, price.exponent))\n}\n\n// Convert to USD with fixed precision\nfn token_amount_to_usd(\n    amount: u64,\n    token_decimals: u8,\n    price: u64,\n    price_exponent: i32,\n) -> Option<u64> {\n    let value = (amount as u128)\n        .checked_mul(price as u128)?;\n    \n    // Normalize to 6 decimal USD\n    let exp_adjustment = token_decimals as i32 + price_exponent.abs() - 6;\n    if exp_adjustment > 0 {\n        Some((value / 10u128.pow(exp_adjustment as u32)) as u64)\n    } else {\n        Some((value * 10u128.pow((-exp_adjustment) as u32)) as u64)\n    }\n}\n```\n\n## Liquidation Mechanism\n\n```rust\npub fn liquidate(\n    ctx: Context<Liquidate>,\n    repay_amount: u64,\n) -> Result<()> {\n    let obligation = &ctx.accounts.obligation;\n    let reserve = &ctx.accounts.reserve;\n    \n    // 1. Check if position is unhealthy\n    let health = calculate_health_factor(\n        obligation.deposited_value_usd,\n        reserve.config.liquidation_threshold,\n        obligation.borrowed_value_usd,\n    ).ok_or(LendingError::MathOverflow)?;\n    \n    require!(health < 10_000, LendingError::HealthyPosition);\n    \n    // 2. Cap repay at 50% of borrowed amount (partial liquidation)\n    let max_repay = obligation.borrowed_value_usd\n        .checked_div(2)\n        .ok_or(LendingError::MathOverflow)?;\n    let actual_repay = std::cmp::min(repay_amount, max_repay);\n    \n    // 3. Calculate collateral to seize (repay + bonus)\n    let bonus_factor = 10_000u64\n        .checked_add(reserve.config.liquidation_bonus as u64)\n        .ok_or(LendingError::MathOverflow)?;\n    let collateral_to_seize = (actual_repay as u128)\n        .checked_mul(bonus_factor as u128)\n        .ok_or(LendingError::MathOverflow)?\n        / 10_000;\n    \n    // 4. Transfer repayment from liquidator to reserve\n    // 5. Transfer collateral from obligation to liquidator\n    // 6. Update obligation state\n    \n    emit!(LiquidationExecuted {\n        liquidator: ctx.accounts.liquidator.key(),\n        borrower: obligation.owner,\n        repay_amount: actual_repay,\n        collateral_seized: collateral_to_seize as u64,\n    });\n    \n    Ok(())\n}\n```\n\n## Risk Parameters\n\n| Asset Type | LTV | Liquidation Threshold | Liquidation Bonus |\n|-----------|-----|----------------------|-------------------|\n| SOL | 75% | 85% | 5% |\n| USDC | 85% | 90% | 3% |\n| mSOL | 70% | 80% | 7% |\n| Volatile tokens | 50% | 65% | 10% |",
          },
          {
            id: "dal6",
            title: "Lending Challenge",
            description: "Implement interest accrual and health factor checks",
            order: 5,
            type: "challenge",
            xpReward: 80,
            duration: "40 min",
            challenge: {
              language: "rust",
              prompt:
                "Implement the core lending protocol math: compound interest accrual, health factor calculation, and liquidation eligibility check.",
              starterCode:
                "// All values use 6-decimal fixed point (1_000_000 = 1.0)\nconst PRECISION: u128 = 1_000_000;\n\nstruct Reserve {\n    total_deposits: u64,\n    total_borrows: u64,\n    cumulative_borrow_rate: u128, // starts at PRECISION\n    last_update_slot: u64,\n    base_rate_per_slot: u64,      // annualized rate / slots_per_year\n}\n\nstruct Obligation {\n    deposited_value: u64,    // USD value of collateral\n    borrowed_value: u64,     // USD value of debt\n    borrow_rate_snapshot: u128, // cumulative rate at time of borrow\n}\n\n// 1. Accrue interest: update cumulative_borrow_rate based on slots elapsed\nfn accrue_interest(reserve: &mut Reserve, current_slot: u64) -> Option<()> {\n    todo!()\n}\n\n// 2. Get current borrow balance including accrued interest\nfn get_current_borrow_balance(\n    obligation: &Obligation,\n    cumulative_rate: u128,\n) -> Option<u64> {\n    todo!()\n}\n\n// 3. Check if obligation is liquidatable\nfn is_liquidatable(\n    obligation: &Obligation,\n    liquidation_threshold_bps: u16, // e.g., 8500 = 85%\n) -> bool {\n    todo!()\n}\n\n// 4. Calculate liquidation amounts\nfn calculate_liquidation(\n    obligation: &Obligation,\n    repay_amount: u64,\n    liquidation_bonus_bps: u16,\n    max_close_factor_bps: u16, // e.g., 5000 = 50%\n) -> Option<(u64, u64)> { // (actual_repay, collateral_seized)\n    todo!()\n}",
              solution:
                "const PRECISION: u128 = 1_000_000;\n\nstruct Reserve {\n    total_deposits: u64,\n    total_borrows: u64,\n    cumulative_borrow_rate: u128,\n    last_update_slot: u64,\n    base_rate_per_slot: u64,\n}\n\nstruct Obligation {\n    deposited_value: u64,\n    borrowed_value: u64,\n    borrow_rate_snapshot: u128,\n}\n\nfn accrue_interest(reserve: &mut Reserve, current_slot: u64) -> Option<()> {\n    let slots_elapsed = current_slot.checked_sub(reserve.last_update_slot)?;\n    if slots_elapsed == 0 { return Some(()); }\n    \n    // Simple interest per slot (for demonstration)\n    let interest_factor = PRECISION\n        .checked_add(\n            (reserve.base_rate_per_slot as u128)\n                .checked_mul(slots_elapsed as u128)?\n        )?;\n    \n    reserve.cumulative_borrow_rate = reserve.cumulative_borrow_rate\n        .checked_mul(interest_factor)?\n        / PRECISION;\n    \n    // Update total borrows with accrued interest\n    let interest_earned = (reserve.total_borrows as u128)\n        .checked_mul(interest_factor)?\n        / PRECISION;\n    reserve.total_borrows = interest_earned as u64;\n    reserve.last_update_slot = current_slot;\n    Some(())\n}\n\nfn get_current_borrow_balance(\n    obligation: &Obligation,\n    cumulative_rate: u128,\n) -> Option<u64> {\n    if obligation.borrow_rate_snapshot == 0 { return Some(0); }\n    let balance = (obligation.borrowed_value as u128)\n        .checked_mul(cumulative_rate)?\n        / obligation.borrow_rate_snapshot;\n    Some(balance as u64)\n}\n\nfn is_liquidatable(\n    obligation: &Obligation,\n    liquidation_threshold_bps: u16,\n) -> bool {\n    if obligation.borrowed_value == 0 { return false; }\n    let max_borrow = (obligation.deposited_value as u128)\n        * (liquidation_threshold_bps as u128)\n        / 10_000;\n    obligation.borrowed_value as u128 > max_borrow\n}\n\nfn calculate_liquidation(\n    obligation: &Obligation,\n    repay_amount: u64,\n    liquidation_bonus_bps: u16,\n    max_close_factor_bps: u16,\n) -> Option<(u64, u64)> {\n    let max_repay = (obligation.borrowed_value as u128)\n        .checked_mul(max_close_factor_bps as u128)?\n        / 10_000;\n    let actual_repay = std::cmp::min(repay_amount as u128, max_repay);\n    \n    let bonus_factor = (10_000u128).checked_add(liquidation_bonus_bps as u128)?;\n    let collateral_seized = actual_repay\n        .checked_mul(bonus_factor)?\n        / 10_000;\n    \n    // Can't seize more than total collateral\n    let final_seized = std::cmp::min(collateral_seized, obligation.deposited_value as u128);\n    \n    Some((actual_repay as u64, final_seized as u64))\n}",
              testCases: [
                {
                  id: "t1",
                  name: "Interest accrues",
                  input: "100 slots, 1% rate",
                  expectedOutput: "increased borrows",
                },
                {
                  id: "t2",
                  name: "Borrow balance grows",
                  input: "rate doubled",
                  expectedOutput: "balance doubled",
                },
                {
                  id: "t3",
                  name: "Healthy position not liquidatable",
                  input: "50% utilized, 85% threshold",
                  expectedOutput: "false",
                },
                {
                  id: "t4",
                  name: "Liquidation capped at close factor",
                  input: "repay > 50%",
                  expectedOutput: "capped at 50%",
                },
              ],
              hints: [
                "Cumulative rate compounds: new_rate = old_rate * (1 + rate_per_slot * slots)",
                "Current balance = original_balance * current_cumulative_rate / snapshot_rate",
                "Liquidatable when borrowed_value > collateral_value * threshold / 10000",
                "Cap repay at borrowed_value * max_close_factor / 10000",
              ],
            },
          },
        ],
      },
      {
        id: "dav3",
        title: "Yield Strategies & Vaults",
        description: "Building yield-generating vault programs",
        order: 2,
        lessons: [
          {
            id: "dal7",
            title: "Vault Architecture",
            description: "Designing yield vaults on Solana",
            order: 6,
            type: "content",
            xpReward: 50,
            duration: "30 min",
            content:
              "# Vault Architecture\n\nYield vaults automate DeFi strategies, accepting deposits and deploying capital across protocols.\n\n## Vault Pattern\n\n```rust\n#[account]\n#[derive(InitSpace)]\npub struct Vault {\n    pub authority: Pubkey,\n    pub token_mint: Pubkey,       // Deposit token\n    pub vault_token: Pubkey,      // Vault's ATA\n    pub share_mint: Pubkey,       // Receipt token mint\n    pub total_deposits: u64,      // Total tokens deposited\n    pub total_shares: u64,        // Total receipt tokens minted\n    pub strategy: VaultStrategy,\n    pub performance_fee_bps: u16, // e.g., 1000 = 10%\n    pub last_harvest: i64,\n    pub bump: u8,\n    pub _reserved: [u8; 64],\n}\n\n#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]\npub enum VaultStrategy {\n    Lending { reserve: Pubkey },\n    Staking { stake_pool: Pubkey },\n    LiquidityProvision { pool: Pubkey },\n}\n```\n\n## Share Token Math\n\nShares represent proportional ownership of vault assets:\n\n```rust\n// Deposit: tokens → shares\nfn calculate_shares_for_deposit(\n    deposit_amount: u64,\n    total_deposits: u64,\n    total_shares: u64,\n) -> Option<u64> {\n    if total_shares == 0 || total_deposits == 0 {\n        // First depositor gets 1:1 shares\n        return Some(deposit_amount);\n    }\n    // shares = deposit_amount * total_shares / total_deposits\n    let shares = (deposit_amount as u128)\n        .checked_mul(total_shares as u128)?\n        / total_deposits as u128;\n    Some(shares as u64)\n}\n\n// Withdraw: shares → tokens\nfn calculate_tokens_for_withdrawal(\n    shares_amount: u64,\n    total_deposits: u64,\n    total_shares: u64,\n) -> Option<u64> {\n    if total_shares == 0 { return None; }\n    // tokens = shares_amount * total_deposits / total_shares\n    let tokens = (shares_amount as u128)\n        .checked_mul(total_deposits as u128)?\n        / total_shares as u128;\n    Some(tokens as u64)\n}\n\n// Price per share (for display)\nfn price_per_share(total_deposits: u64, total_shares: u64) -> Option<u64> {\n    if total_shares == 0 { return Some(1_000_000); } // 1.0 with 6 decimals\n    let price = (total_deposits as u128)\n        .checked_mul(1_000_000)?\n        / total_shares as u128;\n    Some(price as u64)\n}\n```\n\n## Deposit Flow\n\n```\nUser deposits 100 USDC\n  → Vault receives 100 USDC\n  → Vault mints 95 shares (if price_per_share > 1.0 due to yield)\n  → Vault deploys USDC to lending protocol\n  → Over time, lending earns interest\n  → price_per_share increases\n  → User's 95 shares now worth 105 USDC\n```\n\n## Harvest Flow\n\n```rust\npub fn harvest(ctx: Context<Harvest>) -> Result<()> {\n    let vault = &mut ctx.accounts.vault;\n    let clock = Clock::get()?;\n    \n    // 1. Collect yield from strategy\n    let yield_earned = collect_strategy_yield(ctx.accounts)?;\n    \n    // 2. Take performance fee\n    let fee = (yield_earned as u128)\n        .checked_mul(vault.performance_fee_bps as u128)\n        .ok_or(VaultError::Overflow)?\n        / 10_000;\n    \n    // 3. Mint fee shares to protocol treasury\n    let fee_shares = calculate_shares_for_deposit(\n        fee as u64,\n        vault.total_deposits,\n        vault.total_shares,\n    ).ok_or(VaultError::Overflow)?;\n    \n    // 4. Update vault state\n    vault.total_deposits = vault.total_deposits\n        .checked_add(yield_earned)\n        .ok_or(VaultError::Overflow)?;\n    vault.total_shares = vault.total_shares\n        .checked_add(fee_shares)\n        .ok_or(VaultError::Overflow)?;\n    vault.last_harvest = clock.unix_timestamp;\n    \n    emit!(HarvestCompleted {\n        vault: vault.key(),\n        yield_earned,\n        fee_taken: fee as u64,\n        new_price_per_share: price_per_share(vault.total_deposits, vault.total_shares)\n            .unwrap_or(1_000_000),\n    });\n    \n    Ok(())\n}\n```",
          },
          {
            id: "dal8",
            title: "Strategy Patterns",
            description: "Common yield strategy implementations",
            order: 7,
            type: "content",
            xpReward: 50,
            duration: "30 min",
            content:
              "# Strategy Patterns\n\n## Strategy 1: Lending Optimization\n\nAutomatically move deposits to the highest-yielding lending protocol:\n\n```rust\npub struct LendingStrategy {\n    pub primary_reserve: Pubkey,   // e.g., Solend\n    pub secondary_reserve: Pubkey, // e.g., Marginfi\n    pub rebalance_threshold: u16,  // bps difference to trigger rebalance\n}\n\npub fn rebalance(\n    ctx: Context<Rebalance>,\n) -> Result<()> {\n    let primary_rate = get_supply_rate(&ctx.accounts.primary_reserve)?;\n    let secondary_rate = get_supply_rate(&ctx.accounts.secondary_reserve)?;\n    \n    let diff = if secondary_rate > primary_rate {\n        secondary_rate.checked_sub(primary_rate).unwrap()\n    } else {\n        return Ok(()); // Primary is better, no rebalance needed\n    };\n    \n    let vault = &ctx.accounts.vault;\n    if diff > vault.strategy.rebalance_threshold as u64 {\n        // Withdraw from primary\n        withdraw_from_lending(&ctx, vault.total_deposits)?;\n        // Deposit to secondary\n        deposit_to_lending(&ctx, vault.total_deposits)?;\n    }\n    \n    Ok(())\n}\n```\n\n## Strategy 2: LP Farming\n\nDeposit into AMM pools and auto-compound trading fees:\n\n```\nDeposit flow:\n  User USDC → Vault\n  Vault splits: 50% USDC, 50% swap to SOL\n  Vault provides liquidity to SOL/USDC pool\n  Pool earns trading fees\n  Harvest: collect fees, add to LP position\n```\n\n```rust\npub fn auto_compound(ctx: Context<AutoCompound>) -> Result<()> {\n    // 1. Claim LP rewards (trading fees)\n    let fees_a = claim_fees_token_a(ctx.accounts)?;\n    let fees_b = claim_fees_token_b(ctx.accounts)?;\n    \n    // 2. Rebalance to 50/50\n    let (add_a, add_b) = rebalance_for_deposit(fees_a, fees_b, ctx.accounts)?;\n    \n    // 3. Add liquidity back to pool\n    add_liquidity(ctx.accounts, add_a, add_b)?;\n    \n    // 4. Update vault total_deposits based on new LP value\n    let vault = &mut ctx.accounts.vault;\n    let new_value = calculate_lp_value(ctx.accounts)?;\n    vault.total_deposits = new_value;\n    \n    Ok(())\n}\n```\n\n## Strategy 3: Liquid Staking Arbitrage\n\n```\nDeposit SOL → Stake with validator\nReceive mSOL (liquid staking token)\nmSOL trades at slight premium to SOL\nArbitrage the premium when it widens\n```\n\n## Risk Management\n\n```rust\n#[account]\npub struct VaultRiskParams {\n    pub max_single_deposit: u64,    // Cap per deposit\n    pub max_total_deposits: u64,    // Cap total TVL\n    pub withdrawal_cooldown: i64,   // Seconds between withdrawals\n    pub max_slippage_bps: u16,      // Max slippage on swaps\n    pub emergency_shutdown: bool,   // Pause deposits\n}\n\npub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {\n    let risk = &ctx.accounts.vault.risk_params;\n    require!(!risk.emergency_shutdown, VaultError::EmergencyShutdown);\n    require!(amount <= risk.max_single_deposit, VaultError::DepositTooLarge);\n    let new_total = ctx.accounts.vault.total_deposits\n        .checked_add(amount)\n        .ok_or(VaultError::Overflow)?;\n    require!(new_total <= risk.max_total_deposits, VaultError::VaultFull);\n    // ... proceed with deposit\n    Ok(())\n}\n```",
          },
          {
            id: "dal9",
            title: "Vault Challenge",
            description: "Build a complete vault with share token math",
            order: 8,
            type: "challenge",
            xpReward: 80,
            duration: "35 min",
            challenge: {
              language: "rust",
              prompt:
                "Implement a yield vault's core operations: deposit (tokens → shares), withdraw (shares → tokens), and harvest (accrue yield and take fees).",
              starterCode:
                "const SHARE_PRECISION: u128 = 1_000_000_000; // 9 decimals\n\nstruct Vault {\n    total_deposits: u64,\n    total_shares: u64,\n    performance_fee_bps: u16,\n    accumulated_fees: u64,\n}\n\nimpl Vault {\n    fn new(fee_bps: u16) -> Self {\n        Vault {\n            total_deposits: 0,\n            total_shares: 0,\n            performance_fee_bps: fee_bps,\n            accumulated_fees: 0,\n        }\n    }\n    \n    // Deposit tokens, return shares minted\n    fn deposit(&mut self, amount: u64) -> Option<u64> {\n        todo!()\n    }\n    \n    // Withdraw shares, return tokens received\n    fn withdraw(&mut self, shares: u64) -> Option<u64> {\n        todo!()\n    }\n    \n    // Harvest yield: increase total_deposits by yield, take fee\n    fn harvest(&mut self, yield_amount: u64) -> Option<u64> {\n        // Returns fee taken\n        todo!()\n    }\n    \n    // Price per share with SHARE_PRECISION\n    fn price_per_share(&self) -> u64 {\n        todo!()\n    }\n}",
              solution:
                "const SHARE_PRECISION: u128 = 1_000_000_000;\n\nstruct Vault {\n    total_deposits: u64,\n    total_shares: u64,\n    performance_fee_bps: u16,\n    accumulated_fees: u64,\n}\n\nimpl Vault {\n    fn new(fee_bps: u16) -> Self {\n        Vault {\n            total_deposits: 0,\n            total_shares: 0,\n            performance_fee_bps: fee_bps,\n            accumulated_fees: 0,\n        }\n    }\n    \n    fn deposit(&mut self, amount: u64) -> Option<u64> {\n        if amount == 0 { return None; }\n        \n        let shares = if self.total_shares == 0 || self.total_deposits == 0 {\n            amount\n        } else {\n            let s = (amount as u128)\n                .checked_mul(self.total_shares as u128)?\n                / self.total_deposits as u128;\n            s as u64\n        };\n        \n        if shares == 0 { return None; }\n        \n        self.total_deposits = self.total_deposits.checked_add(amount)?;\n        self.total_shares = self.total_shares.checked_add(shares)?;\n        Some(shares)\n    }\n    \n    fn withdraw(&mut self, shares: u64) -> Option<u64> {\n        if shares == 0 || shares > self.total_shares { return None; }\n        \n        let tokens = (shares as u128)\n            .checked_mul(self.total_deposits as u128)?\n            / self.total_shares as u128;\n        let tokens = tokens as u64;\n        \n        self.total_shares = self.total_shares.checked_sub(shares)?;\n        self.total_deposits = self.total_deposits.checked_sub(tokens)?;\n        Some(tokens)\n    }\n    \n    fn harvest(&mut self, yield_amount: u64) -> Option<u64> {\n        if yield_amount == 0 { return Some(0); }\n        \n        let fee = (yield_amount as u128)\n            .checked_mul(self.performance_fee_bps as u128)?\n            / 10_000;\n        let fee = fee as u64;\n        \n        let net_yield = yield_amount.checked_sub(fee)?;\n        self.total_deposits = self.total_deposits.checked_add(net_yield)?;\n        self.accumulated_fees = self.accumulated_fees.checked_add(fee)?;\n        Some(fee)\n    }\n    \n    fn price_per_share(&self) -> u64 {\n        if self.total_shares == 0 {\n            return SHARE_PRECISION as u64;\n        }\n        let price = (self.total_deposits as u128)\n            .checked_mul(SHARE_PRECISION)\n            .unwrap_or(SHARE_PRECISION)\n            / self.total_shares as u128;\n        price as u64\n    }\n}",
              testCases: [
                {
                  id: "t1",
                  name: "First deposit 1:1",
                  input: "deposit 1000",
                  expectedOutput: "1000 shares",
                },
                {
                  id: "t2",
                  name: "Price increases after yield",
                  input: "harvest 100",
                  expectedOutput: "price > 1.0",
                },
                {
                  id: "t3",
                  name: "Withdraw returns more after yield",
                  input: "withdraw all after yield",
                  expectedOutput: "more than deposited",
                },
                {
                  id: "t4",
                  name: "Fee taken on harvest",
                  input: "harvest 100 with 10% fee",
                  expectedOutput: "fee = 10",
                },
              ],
              hints: [
                "First depositor gets 1:1 shares (shares = amount)",
                "Subsequent depositors: shares = amount * total_shares / total_deposits",
                "Withdrawal: tokens = shares * total_deposits / total_shares",
                "Fee is taken from yield before adding to total_deposits",
              ],
            },
          },
        ],
      },
      {
        id: "dav4",
        title: "DeFi Security & MEV",
        description: "Security patterns and MEV protection for DeFi protocols",
        order: 3,
        lessons: [
          {
            id: "dal10",
            title: "DeFi-Specific Vulnerabilities",
            description: "Security issues unique to DeFi protocols",
            order: 9,
            type: "content",
            xpReward: 55,
            duration: "30 min",
            content:
              "# DeFi-Specific Vulnerabilities\n\n## 1. Oracle Manipulation\n\nAttackers manipulate price feeds to exploit lending/trading protocols:\n\n```rust\n// VULNERABLE: Using on-chain AMM price as oracle\nfn get_price(pool: &Pool) -> u64 {\n    pool.reserve_b / pool.reserve_a // Can be manipulated with flash loans!\n}\n\n// SAFE: Use TWAP or external oracles (Pyth, Switchboard)\nfn get_price_safe(\n    oracle: &PriceUpdateV2,\n    max_age: u64,\n) -> Result<u64> {\n    let price = oracle.get_price_no_older_than(\n        &Clock::get()?,\n        max_age,\n        &feed_id,\n    )?;\n    require!(price.price > 0, OracleError::InvalidPrice);\n    Ok(price.price as u64)\n}\n```\n\n## 2. Flash Loan Attacks\n\n```\nAttack pattern:\n1. Flash borrow large amount\n2. Manipulate AMM pool reserves (large swap)\n3. Exploit protocol using manipulated price\n4. Swap back to restore pool\n5. Repay flash loan + profit\n\nDefense:\n- Use TWAPs (Time-Weighted Average Prices)\n- Use external oracles (Pyth, Switchboard)\n- Add delay between price-dependent operations\n```\n\n## 3. Reentrancy via CPI\n\n```rust\n// VULNERABLE: State updated after CPI\npub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {\n    // CPI transfer (could trigger callback)\n    token::transfer(cpi_ctx, amount)?;\n    \n    // State updated AFTER CPI — reentrancy risk!\n    let vault = &mut ctx.accounts.vault;\n    vault.balance -= amount;\n    Ok(())\n}\n\n// SAFE: Checks-Effects-Interactions pattern\npub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {\n    // 1. CHECKS\n    let vault = &mut ctx.accounts.vault;\n    require!(vault.balance >= amount, VaultError::Insufficient);\n    \n    // 2. EFFECTS (update state first)\n    vault.balance = vault.balance.checked_sub(amount)\n        .ok_or(VaultError::Overflow)?;\n    \n    // 3. INTERACTIONS (CPI last)\n    token::transfer(cpi_ctx, amount)?;\n    Ok(())\n}\n```\n\n## 4. Rounding Exploits\n\n```rust\n// VULNERABLE: Rounding down allows dust attacks\nfn calculate_shares(amount: u64, total: u64, shares: u64) -> u64 {\n    amount * shares / total // Rounds down — attacker can deposit dust to dilute\n}\n\n// SAFE: Minimum amounts and rounding protection\nfn calculate_shares_safe(amount: u64, total: u64, shares: u64) -> Result<u64> {\n    require!(amount >= MIN_DEPOSIT, Error::TooSmall);\n    let result = (amount as u128)\n        .checked_mul(shares as u128)\n        .ok_or(Error::Overflow)?\n        / total as u128;\n    require!(result > 0, Error::ZeroShares);\n    Ok(result as u64)\n}\n```\n\n## 5. Sandwich Attacks\n\n```\nAttack on pending swap:\n1. Attacker sees user's swap tx in mempool\n2. Attacker front-runs: buys token (price goes up)\n3. User's swap executes at worse price\n4. Attacker back-runs: sells token at higher price\n\nDefense:\n- Slippage protection (minimum_amount_out)\n- Use Jito bundles for MEV protection\n- Private mempools\n```",
          },
          {
            id: "dal11",
            title: "MEV & Transaction Ordering",
            description: "Understanding and protecting against MEV on Solana",
            order: 10,
            type: "content",
            xpReward: 55,
            duration: "30 min",
            content:
              "# MEV & Transaction Ordering\n\nMaximal Extractable Value (MEV) is profit validators can extract by reordering, inserting, or censoring transactions.\n\n## MEV on Solana vs Ethereum\n\n| Aspect | Ethereum | Solana |\n|--------|----------|--------|\n| Block time | 12 seconds | 400ms |\n| Mempool | Public | Semi-private |\n| MEV extraction | Flashbots, MEV-Boost | Jito |\n| Sandwich attacks | Common | Less common (faster blocks) |\n| Arbitrage | Widespread | Very fast, competitive |\n\n## Common MEV Types\n\n### Arbitrage\n```\nPool A: SOL/USDC = $150\nPool B: SOL/USDC = $151\n\nArbitrageur:\n1. Buy SOL on Pool A at $150\n2. Sell SOL on Pool B at $151\n3. Profit: $1 per SOL (minus fees)\n```\n\n### Liquidation\n```\nBorrower health factor drops below 1.0\n\nLiquidator:\n1. Monitor all obligations\n2. First to call liquidate()\n3. Receives collateral at discount (liquidation bonus)\n```\n\n## Jito: Solana's MEV Infrastructure\n\n```typescript\nimport { SearcherClient } from 'jito-ts/dist/sdk/block-engine/searcher';\n\n// Submit transaction bundle via Jito\nconst bundle = [\n    frontrunTx,   // Your arbitrage setup\n    targetTx,      // The tx you're targeting\n    backrunTx,     // Your arbitrage completion\n];\n\nawait searcherClient.sendBundle(bundle);\n// Bundle is atomic: all execute or none\n```\n\n## Protecting Against MEV\n\n### 1. Slippage Protection\n```rust\n#[derive(Accounts)]\npub struct Swap<'info> {\n    // ...\n}\n\npub fn swap(\n    ctx: Context<Swap>,\n    amount_in: u64,\n    minimum_amount_out: u64, // User sets this\n) -> Result<()> {\n    let amount_out = calculate_output(amount_in, reserves)?;\n    require!(\n        amount_out >= minimum_amount_out,\n        SwapError::SlippageExceeded\n    );\n    // ...\n    Ok(())\n}\n```\n\n### 2. Commit-Reveal Scheme\n```rust\n// Phase 1: User commits hash of their order\npub fn commit_order(\n    ctx: Context<CommitOrder>,\n    order_hash: [u8; 32],\n) -> Result<()> {\n    let order = &mut ctx.accounts.order;\n    order.hash = order_hash;\n    order.committed_at = Clock::get()?.slot;\n    Ok(())\n}\n\n// Phase 2: User reveals actual order (after N slots)\npub fn reveal_order(\n    ctx: Context<RevealOrder>,\n    amount: u64,\n    price: u64,\n    nonce: u64,\n) -> Result<()> {\n    let order = &ctx.accounts.order;\n    let current_slot = Clock::get()?.slot;\n    require!(\n        current_slot >= order.committed_at + REVEAL_DELAY,\n        OrderError::TooEarly\n    );\n    \n    // Verify hash matches\n    let computed_hash = hash(&[&amount.to_le_bytes(), &price.to_le_bytes(), &nonce.to_le_bytes()]);\n    require!(computed_hash == order.hash, OrderError::HashMismatch);\n    \n    // Execute order\n    Ok(())\n}\n```\n\n### 3. Deadline Protection\n```rust\npub fn swap_with_deadline(\n    ctx: Context<Swap>,\n    amount_in: u64,\n    min_out: u64,\n    deadline: i64,\n) -> Result<()> {\n    let clock = Clock::get()?;\n    require!(clock.unix_timestamp <= deadline, SwapError::Expired);\n    // ...\n    Ok(())\n}\n```",
          },
          {
            id: "dal12",
            title: "DeFi Security Challenge",
            description: "Identify and fix vulnerabilities in a DeFi protocol",
            order: 11,
            type: "challenge",
            xpReward: 100,
            duration: "40 min",
            challenge: {
              language: "rust",
              prompt:
                "Review this DeFi vault program and fix all security vulnerabilities. There are at least 6 issues including oracle manipulation, rounding attacks, reentrancy, missing slippage protection, arithmetic overflow, and missing access control.",
              starterCode:
                'use anchor_lang::prelude::*;\n\ndeclare_id!("11111111111111111111111111111111");\n\n#[program]\npub mod vulnerable_defi {\n    use super::*;\n\n    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {\n        let vault = &mut ctx.accounts.vault;\n        // Calculate shares\n        let shares = if vault.total_shares == 0 {\n            amount\n        } else {\n            amount * vault.total_shares / vault.total_deposits\n        };\n        vault.total_deposits += amount;\n        vault.total_shares += shares;\n        // Transfer tokens\n        token::transfer(ctx.accounts.transfer_ctx(), amount)?;\n        Ok(())\n    }\n\n    pub fn withdraw(ctx: Context<Withdraw>, shares: u64) -> Result<()> {\n        let vault = &mut ctx.accounts.vault;\n        let tokens = shares * vault.total_deposits / vault.total_shares;\n        // Transfer first, update state after\n        token::transfer(ctx.accounts.transfer_ctx(), tokens)?;\n        vault.total_deposits -= tokens;\n        vault.total_shares -= shares;\n        Ok(())\n    }\n\n    pub fn swap(ctx: Context<SwapCtx>, amount_in: u64) -> Result<()> {\n        let pool = &ctx.accounts.pool;\n        let price = pool.reserve_b / pool.reserve_a;\n        let amount_out = amount_in * price;\n        // Execute swap...\n        Ok(())\n    }\n\n    pub fn harvest(ctx: Context<Harvest>) -> Result<()> {\n        let vault = &mut ctx.accounts.vault;\n        let yield_amount = calculate_yield()?;\n        vault.total_deposits += yield_amount;\n        Ok(())\n    }\n}\n\n#[account]\npub struct Vault {\n    pub total_deposits: u64,\n    pub total_shares: u64,\n}',
              solution:
                'use anchor_lang::prelude::*;\n\ndeclare_id!("11111111111111111111111111111111");\n\nconst MIN_DEPOSIT: u64 = 1_000; // Minimum deposit to prevent dust attacks\n\n#[program]\npub mod secure_defi {\n    use super::*;\n\n    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {\n        // Fix 1: Input validation\n        require!(amount >= MIN_DEPOSIT, VaultError::DepositTooSmall);\n        \n        let vault = &mut ctx.accounts.vault;\n        \n        // Fix 2: Checked arithmetic + overflow protection\n        let shares = if vault.total_shares == 0 || vault.total_deposits == 0 {\n            amount\n        } else {\n            let s = (amount as u128)\n                .checked_mul(vault.total_shares as u128)\n                .ok_or(VaultError::Overflow)?\n                / vault.total_deposits as u128;\n            require!(s > 0, VaultError::ZeroShares); // Fix 3: Rounding protection\n            s as u64\n        };\n        \n        // Fix 4: Update state BEFORE CPI (checks-effects-interactions)\n        vault.total_deposits = vault.total_deposits\n            .checked_add(amount).ok_or(VaultError::Overflow)?;\n        vault.total_shares = vault.total_shares\n            .checked_add(shares).ok_or(VaultError::Overflow)?;\n        \n        // Transfer tokens (CPI last)\n        token::transfer(ctx.accounts.transfer_ctx(), amount)?;\n        Ok(())\n    }\n\n    pub fn withdraw(ctx: Context<Withdraw>, shares: u64, min_tokens_out: u64) -> Result<()> {\n        require!(shares > 0, VaultError::ZeroAmount);\n        let vault = &mut ctx.accounts.vault;\n        require!(shares <= vault.total_shares, VaultError::InsufficientShares);\n        \n        let tokens = (shares as u128)\n            .checked_mul(vault.total_deposits as u128)\n            .ok_or(VaultError::Overflow)?\n            / vault.total_shares as u128;\n        let tokens = tokens as u64;\n        \n        // Fix 5: Slippage protection on withdrawal\n        require!(tokens >= min_tokens_out, VaultError::SlippageExceeded);\n        \n        // Fix 4: Update state BEFORE CPI\n        vault.total_shares = vault.total_shares\n            .checked_sub(shares).ok_or(VaultError::Overflow)?;\n        vault.total_deposits = vault.total_deposits\n            .checked_sub(tokens).ok_or(VaultError::Overflow)?;\n        \n        token::transfer(ctx.accounts.transfer_ctx(), tokens)?;\n        Ok(())\n    }\n\n    pub fn swap(\n        ctx: Context<SwapCtx>,\n        amount_in: u64,\n        minimum_amount_out: u64, // Fix 6: Slippage protection\n        deadline: i64,            // Fix 7: Deadline protection\n    ) -> Result<()> {\n        let clock = Clock::get()?;\n        require!(clock.unix_timestamp <= deadline, VaultError::Expired);\n        \n        // Fix 8: Use external oracle, not AMM spot price\n        let price = get_oracle_price(&ctx.accounts.oracle)?;\n        let amount_out = (amount_in as u128)\n            .checked_mul(price as u128)\n            .ok_or(VaultError::Overflow)?\n            / PRICE_PRECISION;\n        let amount_out = amount_out as u64;\n        \n        require!(amount_out >= minimum_amount_out, VaultError::SlippageExceeded);\n        Ok(())\n    }\n\n    pub fn harvest(ctx: Context<Harvest>) -> Result<()> {\n        // Fix 9: Access control\n        let vault = &mut ctx.accounts.vault;\n        require_keys_eq!(\n            ctx.accounts.authority.key(),\n            vault.authority,\n            VaultError::Unauthorized\n        );\n        \n        let yield_amount = calculate_yield()?;\n        \n        // Fix 10: Take fee with checked math\n        let fee = (yield_amount as u128)\n            .checked_mul(vault.fee_bps as u128)\n            .ok_or(VaultError::Overflow)?\n            / 10_000;\n        let net = yield_amount.checked_sub(fee as u64).ok_or(VaultError::Overflow)?;\n        vault.total_deposits = vault.total_deposits\n            .checked_add(net).ok_or(VaultError::Overflow)?;\n        \n        Ok(())\n    }\n}\n\n#[account]\npub struct Vault {\n    pub authority: Pubkey,\n    pub total_deposits: u64,\n    pub total_shares: u64,\n    pub fee_bps: u16,\n    pub bump: u8,\n    pub _reserved: [u8; 64],\n}\n\n#[error_code]\npub enum VaultError {\n    #[msg("Arithmetic overflow")]\n    Overflow,\n    #[msg("Deposit too small")]\n    DepositTooSmall,\n    #[msg("Zero shares minted")]\n    ZeroShares,\n    #[msg("Zero amount")]\n    ZeroAmount,\n    #[msg("Insufficient shares")]\n    InsufficientShares,\n    #[msg("Slippage exceeded")]\n    SlippageExceeded,\n    #[msg("Transaction expired")]\n    Expired,\n    #[msg("Unauthorized")]\n    Unauthorized,\n}',
              testCases: [
                {
                  id: "t1",
                  name: "Checks-effects-interactions",
                  input: "deposit/withdraw",
                  expectedOutput: "state updated before CPI",
                },
                {
                  id: "t2",
                  name: "Checked arithmetic",
                  input: "all operations",
                  expectedOutput: "no unchecked math",
                },
                {
                  id: "t3",
                  name: "Oracle not AMM price",
                  input: "swap",
                  expectedOutput: "external oracle",
                },
                {
                  id: "t4",
                  name: "Slippage protection",
                  input: "swap + withdraw",
                  expectedOutput: "minimum_amount_out",
                },
                {
                  id: "t5",
                  name: "Access control on harvest",
                  input: "harvest",
                  expectedOutput: "authority check",
                },
                {
                  id: "t6",
                  name: "Rounding protection",
                  input: "deposit small amount",
                  expectedOutput: "require shares > 0",
                },
              ],
              hints: [
                "State must be updated BEFORE any CPI calls (checks-effects-interactions)",
                "Use u128 for intermediate calculations to prevent overflow",
                "Never use AMM spot price as oracle — use Pyth/Switchboard",
                "Add minimum_amount_out parameter to swap and withdraw",
                "Harvest should check authority — anyone could call it otherwise",
                "Require shares > 0 after calculation to prevent rounding dust attacks",
              ],
            },
          },
        ],
      },
    ],
  }),
];
