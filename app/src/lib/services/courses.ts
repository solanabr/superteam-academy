import type { Course, Achievement, Lesson, CodeChallenge, TestCase } from "./types";
import { sanityClient, isSanityConfigured } from "@/lib/sanity";
import { allCoursesQuery, courseBySlugQuery } from "@/lib/sanity";
import { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from "@/lib/env";

/**
 * Course catalog — static curriculum content.
 * In production, this will be fetched from Sanity CMS.
 */
export const courses: Course[] = [
  {
    id: "intro-solana",
    slug: "intro-to-solana",
    title: "Introduction to Solana",
    description:
      "Learn the fundamentals of the Solana blockchain. Understand accounts, transactions, programs, and the runtime environment that makes Solana the fastest blockchain.",
    track: "rust",
    difficulty: "beginner",
    lessonCount: 12,
    duration: "4 hours",
    xpReward: 500,
    creator: "SuperteamBR",
    modules: [
      {
        id: "mod-1",
        title: "Blockchain Basics",
        lessons: [
          {
            id: "l-1-1",
            title: "What is Solana?",
            type: "reading",
            duration: "10 min",
            xpReward: 25,
            content:
              "Solana is a high-performance Layer 1 blockchain designed for speed and scale. Unlike Ethereum's sequential execution model, Solana processes transactions in parallel using a runtime called Sealevel, achieving throughput of thousands of transactions per second with sub-second finality.\n\nAt the heart of Solana's speed is Proof of History (PoH) — a cryptographic clock that timestamps transactions before they enter consensus. This eliminates the need for validators to agree on time ordering, dramatically reducing communication overhead. Combined with Tower BFT (a PoH-optimized version of PBFT), Solana achieves consensus without the latency penalties of traditional blockchains.\n\nKey performance characteristics:\n• Block time: ~400 milliseconds\n• Throughput: 4,000+ TPS in practice (65,000 theoretical)\n• Finality: ~5 seconds for full confirmation\n• Transaction cost: ~$0.00025 per transaction\n\nSolana uses a single global state — there are no shards or Layer 2 rollups needed. Every validator sees the same state, which makes composability between programs seamless. A swap on Jupiter can atomically compose with a lending deposit on Marginfi in a single transaction.\n\nThe network runs on a leader-based rotation schedule. Every ~1.6 seconds, a new validator becomes the leader responsible for producing blocks. The leader schedule is derived from stake weight, making block production predictable and efficient.",
          },
          {
            id: "l-1-2",
            title: "Accounts & Programs",
            type: "video",
            duration: "15 min",
            xpReward: 30,
            content:
              "Everything on Solana is an account. There are no contracts in the Ethereum sense — instead, Solana separates code from data entirely.\n\nAn account is a buffer of bytes stored on-chain with the following fields:\n• lamports — the SOL balance (1 SOL = 1 billion lamports)\n• data — arbitrary byte array (up to 10MB, realloc-able)\n• owner — the program that controls this account\n• executable — whether this account contains program code\n• rent_epoch — when rent was last collected\n\nPrograms are special accounts marked as executable. They are stateless — they contain only compiled BPF bytecode and cannot store data themselves. When a program needs to persist state, it writes to separate data accounts that it owns.\n\nThis separation of code and data is fundamental to Solana's architecture. It enables parallel execution: two transactions can run the same program simultaneously as long as they touch different data accounts. The runtime detects conflicts at the account level and schedules non-conflicting transactions in parallel.\n\nAccount ownership rules are strict. Only the owning program can modify an account's data or debit its lamports. The System Program owns all wallet accounts. When you deploy a program, the BPF Loader becomes its owner. Your program then creates and owns its own data accounts.\n\nRent: Every account must maintain a minimum SOL balance proportional to its data size (~0.00089 SOL per byte per epoch). Accounts that fall below this threshold get garbage-collected. In practice, most accounts are rent-exempt by depositing 2 years' worth of rent upfront.",
          },
          {
            id: "l-1-3",
            title: "Transactions & Instructions",
            type: "reading",
            duration: "12 min",
            xpReward: 25,
            content:
              "A Solana transaction is a signed message containing one or more instructions. Each instruction targets a specific program and passes it a set of accounts and arbitrary data.\n\nTransaction structure:\n1. Signatures — Ed25519 signatures from required signers\n2. Message header — counts of signers, read-only signers, read-only non-signers\n3. Account addresses — all accounts the transaction will access\n4. Recent blockhash — prevents replay attacks (valid ~2 minutes)\n5. Instructions — the actual operations to execute\n\nEach instruction contains:\n• program_id — which program to invoke\n• accounts — list of AccountMeta (pubkey + is_signer + is_writable)\n• data — serialized instruction arguments\n\nCritical concept: Solana transactions are atomic. If any instruction fails, the entire transaction reverts. This enables safe composability — you can combine a token swap, a lending deposit, and a stake operation in one atomic transaction.\n\nTransactions have a size limit of 1,232 bytes and a compute budget of 200,000 compute units (expandable to 1.4M with a priority fee instruction). You must declare all accounts upfront — the runtime uses this list to detect conflicts and schedule parallel execution.\n\nThe lifecycle of a transaction:\n1. Client builds transaction with instructions and recent blockhash\n2. Required parties sign the transaction\n3. Client sends to an RPC node\n4. RPC forwards to the current leader validator\n5. Leader executes instructions sequentially within the transaction\n6. If all succeed, state changes are committed and the transaction is included in a block\n7. Other validators replay and confirm the block",
          },
        ],
      },
      {
        id: "mod-2",
        title: "Your First Transaction",
        lessons: [
          {
            id: "l-2-1",
            title: "Setting Up Your Environment",
            type: "reading",
            duration: "15 min",
            xpReward: 25,
            content:
              "Before writing any Solana code, you need three tools installed: Rust, the Solana CLI, and Node.js with a package manager.\n\nStep 1 — Install Rust:\ncurl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh\nRestart your terminal, then verify: rustc --version\n\nStep 2 — Install Solana CLI:\nsh -c \"$(curl -sSfL https://release.anza.xyz/stable/install)\"\nAdd to PATH, then verify: solana --version\nConfigure for devnet: solana config set --url devnet\nGenerate a keypair: solana-keygen new\nGet devnet SOL: solana airdrop 2\n\nStep 3 — Install Node.js (v20+) and pnpm:\nInstall Node via nvm or your system package manager.\nnpm install -g pnpm\n\nStep 4 — Install Anchor (optional for this course, required for the Anchor course):\ncargo install --git https://github.com/coral-xyz/anchor avm --force\navm install 0.31.0 && avm use 0.31.0\n\nVerify your setup by running:\nsolana balance\nThis should show your devnet SOL balance. If you see 0, run 'solana airdrop 2' to get free devnet tokens.\n\nDevelopment tools we recommend:\n• VS Code with the rust-analyzer extension\n• Solana Explorer (explorer.solana.com) — switch to devnet cluster\n• Helius RPC (helius.dev) — free tier gives 100k requests/month\n• Solana Playground (beta.solpg.io) — browser IDE for quick experiments",
          },
          {
            id: "l-2-2",
            title: "Create a Keypair",
            type: "challenge",
            duration: "20 min",
            xpReward: 50,
            challenge: {
              instructions:
                "Create a new Solana keypair and print the public key.",
              starterCode:
                "import { Keypair } from '@solana/web3.js';\n\n// Create a new keypair\n// Print the public key\n",
              solution:
                "import { Keypair } from '@solana/web3.js';\n\nconst keypair = Keypair.generate();\nconsole.log(keypair.publicKey.toBase58());",
              testCases: [
                {
                  name: "Outputs a valid public key",
                  input: "",
                  expectedOutput: "base58 string",
                },
              ],
              language: "typescript",
            },
          },
          {
            id: "l-2-3",
            title: "Send SOL Transfer",
            type: "challenge",
            duration: "25 min",
            xpReward: 60,
            challenge: {
              instructions:
                "Create a function that builds and sends a SOL transfer transaction. Your function should:\n\n1. Connect to the Solana devnet\n2. Create a transaction with a SystemProgram.transfer instruction\n3. Send 0.01 SOL (10,000,000 lamports) from the sender to the recipient\n4. Log the transaction signature\n\nUse the provided sender keypair and recipient public key.",
              starterCode:
                "import { Connection, Keypair, SystemProgram, Transaction, sendAndConfirmTransaction, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';\n\nconst connection = new Connection('https://api.devnet.solana.com', 'confirmed');\n\n// Sender keypair (pre-funded on devnet)\nconst sender = Keypair.generate();\nconst recipient = new PublicKey('11111111111111111111111111111112');\n\nasync function transferSOL() {\n  // TODO: Create a transfer instruction\n  // TODO: Build a transaction\n  // TODO: Send and confirm the transaction\n  // TODO: Log the signature\n}\n\ntransferSOL();",
              solution:
                "import { Connection, Keypair, SystemProgram, Transaction, sendAndConfirmTransaction, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';\n\nconst connection = new Connection('https://api.devnet.solana.com', 'confirmed');\n\nconst sender = Keypair.generate();\nconst recipient = new PublicKey('11111111111111111111111111111112');\n\nasync function transferSOL() {\n  const transaction = new Transaction().add(\n    SystemProgram.transfer({\n      fromPubkey: sender.publicKey,\n      toPubkey: recipient,\n      lamports: 0.01 * LAMPORTS_PER_SOL,\n    })\n  );\n\n  const signature = await sendAndConfirmTransaction(connection, transaction, [sender]);\n  console.log('Transaction signature:', signature);\n}\n\ntransferSOL();",
              testCases: [
                {
                  name: "Creates a SystemProgram.transfer instruction",
                  input: "",
                  expectedOutput: "transfer instruction",
                },
                {
                  name: "Sends 0.01 SOL (10,000,000 lamports)",
                  input: "",
                  expectedOutput: "correct amount",
                },
                {
                  name: "Logs the transaction signature",
                  input: "",
                  expectedOutput: "signature logged",
                },
              ],
              language: "typescript",
            },
          },
        ],
      },
      {
        id: "mod-3",
        title: "Understanding PDAs",
        lessons: [
          {
            id: "l-3-1",
            title: "Program Derived Addresses",
            type: "reading",
            duration: "15 min",
            xpReward: 30,
            content:
              "Program Derived Addresses (PDAs) are deterministic addresses that no private key can sign for. They are one of Solana's most powerful primitives, enabling programs to own accounts and sign transactions on their behalf.\n\nHow PDAs work:\nA PDA is derived from a combination of seeds (arbitrary bytes) and a program ID using the SHA-256 hash function. The derivation searches for an address that does NOT lie on the Ed25519 elliptic curve — meaning no private key exists for it. This is achieved by appending a 'bump' byte (starting at 255 and decrementing) until an off-curve point is found.\n\nPublicKey.findProgramAddressSync([seed1, seed2], programId)\n// Returns [pdaAddress, bumpSeed]\n\nWhy PDAs matter:\n1. Deterministic — given the same seeds and program, you always get the same address. No need to store addresses on-chain.\n2. Program-owned — only the deriving program can sign for a PDA via invoke_signed, making them perfect for escrow patterns.\n3. Structured data — seeds act like database keys. Example: ['user', walletPubkey] maps each wallet to exactly one user account.\n\nCommon PDA patterns:\n• Config accounts: seeds = ['config'] — singleton per program\n• User profiles: seeds = ['profile', user.key()] — one per user\n• Vaults: seeds = ['vault', pool_id] — program-controlled token accounts\n• Enrollment: seeds = ['enrollment', course_id, user.key()] — relational mapping\n\nThe canonical bump is the first valid bump found (starting from 255). Always store this bump in the account data to avoid recomputing it — recalculating costs ~3,000 compute units per bump value checked.",
          },
          {
            id: "l-3-2",
            title: "Finding PDAs",
            type: "challenge",
            duration: "20 min",
            xpReward: 50,
            challenge: {
              instructions:
                "Derive a Program Derived Address (PDA) using specific seeds. Your task:\n\n1. Define a program ID using the provided base58 string\n2. Create seeds: the string 'user-profile' and a wallet public key\n3. Use PublicKey.findProgramAddressSync to derive the PDA\n4. Log the PDA address and the bump seed\n\nThis pattern is used everywhere in Solana — mapping a user's wallet to their profile account.",
              starterCode:
                "import { PublicKey } from '@solana/web3.js';\n\nconst PROGRAM_ID = new PublicKey('11111111111111111111111111111111');\nconst walletAddress = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');\n\n// TODO: Define seeds array with 'user-profile' string and wallet address bytes\n// TODO: Derive PDA using PublicKey.findProgramAddressSync\n// TODO: Log the PDA address and bump\n",
              solution:
                "import { PublicKey } from '@solana/web3.js';\n\nconst PROGRAM_ID = new PublicKey('11111111111111111111111111111111');\nconst walletAddress = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');\n\nconst seeds = [\n  Buffer.from('user-profile'),\n  walletAddress.toBuffer(),\n];\n\nconst [pda, bump] = PublicKey.findProgramAddressSync(seeds, PROGRAM_ID);\n\nconsole.log('PDA:', pda.toBase58());\nconsole.log('Bump:', bump);",
              testCases: [
                {
                  name: "Uses correct seeds (string + wallet bytes)",
                  input: "",
                  expectedOutput: "seeds defined",
                },
                {
                  name: "Derives PDA with findProgramAddressSync",
                  input: "",
                  expectedOutput: "PDA derived",
                },
                {
                  name: "Logs both PDA address and bump",
                  input: "",
                  expectedOutput: "PDA and bump logged",
                },
              ],
              language: "typescript",
            },
          },
          {
            id: "l-3-3",
            title: "Quiz: Solana Fundamentals",
            type: "quiz",
            duration: "10 min",
            xpReward: 40,
            content:
              "Test your understanding of Solana fundamentals.\n\n1. What consensus mechanism does Solana use alongside Tower BFT?\n   a) Proof of Work  b) Proof of Stake  c) Proof of History  d) Proof of Authority\n   Answer: c) Proof of History — a cryptographic clock that timestamps transactions before consensus.\n\n2. What is the maximum size of a Solana transaction?\n   a) 256 bytes  b) 1,232 bytes  c) 10,000 bytes  d) 1 MB\n   Answer: b) 1,232 bytes — this limits the number of accounts and instructions per transaction.\n\n3. Who can modify an account's data on Solana?\n   a) Any program  b) The account holder  c) Only the owning program  d) Validators\n   Answer: c) Only the owning program — this is enforced by the Solana runtime.\n\n4. What makes a PDA different from a regular public key?\n   a) It is longer  b) It costs more rent  c) No private key exists for it  d) It can hold more data\n   Answer: c) No private key exists for it — PDAs are off-curve points that only programs can sign for.\n\n5. How much does a typical Solana transaction cost?\n   a) $0.01  b) $0.001  c) ~$0.00025  d) Free\n   Answer: c) ~$0.00025 — Solana transactions have a base fee of 5,000 lamports plus optional priority fees.\n\n6. What is the Solana runtime that enables parallel transaction processing?\n   a) EVM  b) Sealevel  c) Turbine  d) Gulf Stream\n   Answer: b) Sealevel — it detects non-conflicting transactions and executes them simultaneously across GPU cores.",
          },
        ],
      },
      {
        id: "mod-4",
        title: "Token Program",
        lessons: [
          {
            id: "l-4-1",
            title: "SPL Tokens Overview",
            type: "reading",
            duration: "12 min",
            xpReward: 25,
            content:
              "The SPL Token Program is Solana's standard for fungible and non-fungible tokens. Unlike ERC-20 on Ethereum where each token deploys a new contract, Solana uses a single shared program that manages all tokens through account relationships.\n\nCore concepts:\n\nMint Account — defines a token type. Contains:\n• supply — total tokens in circulation\n• decimals — divisibility (6 for USDC, 9 for SOL-wrapped tokens, 0 for NFTs)\n• mint_authority — who can create new tokens (nullable — set to null to cap supply)\n• freeze_authority — who can freeze token accounts (nullable)\n\nToken Account (ATA) — holds a user's balance of a specific token. Contains:\n• mint — which token this account holds\n• owner — the wallet that controls this account\n• amount — token balance\n• delegate / delegated_amount — optional spending approval\n• state — initialized, frozen, or uninitialized\n\nAssociated Token Account (ATA) — a deterministic token account derived from the wallet + mint. This is the standard pattern: seeds = [wallet, TOKEN_PROGRAM_ID, mint]. One ATA per wallet per token type.\n\nKey operations:\n• createMint — deploy a new token type\n• createAssociatedTokenAccount — create an ATA for a wallet\n• mintTo — mint new tokens (requires mint authority)\n• transfer — send tokens between accounts\n• burn — destroy tokens permanently\n• approve/revoke — delegate spending rights\n\nEverything on Solana is built on this foundation. USDC, wrapped SOL, governance tokens, NFTs, and soulbound tokens all use the SPL Token Program (or its successor, Token-2022).",
          },
          {
            id: "l-4-2",
            title: "Create a Token Mint",
            type: "challenge",
            duration: "25 min",
            xpReward: 60,
            challenge: {
              instructions:
                "Create a new SPL token mint on devnet. Your code should:\n\n1. Connect to Solana devnet\n2. Generate a payer keypair (or use a provided one)\n3. Create a new token mint with 6 decimals\n4. Set the payer as both mint authority and freeze authority\n5. Log the mint address\n\nUse the @solana/spl-token library's createMint helper function.",
              starterCode:
                "import { Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';\nimport { createMint } from '@solana/spl-token';\n\nconst connection = new Connection('https://api.devnet.solana.com', 'confirmed');\nconst payer = Keypair.generate();\n\nasync function createTokenMint() {\n  // TODO: Request airdrop for the payer\n  // TODO: Create a new mint with 6 decimals\n  // TODO: Log the mint address\n}\n\ncreateTokenMint();",
              solution:
                "import { Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';\nimport { createMint } from '@solana/spl-token';\n\nconst connection = new Connection('https://api.devnet.solana.com', 'confirmed');\nconst payer = Keypair.generate();\n\nasync function createTokenMint() {\n  // Fund the payer\n  const airdropSig = await connection.requestAirdrop(payer.publicKey, 2 * LAMPORTS_PER_SOL);\n  await connection.confirmTransaction(airdropSig);\n\n  // Create mint with 6 decimals\n  const mint = await createMint(\n    connection,\n    payer,           // payer\n    payer.publicKey,  // mint authority\n    payer.publicKey,  // freeze authority\n    6                 // decimals\n  );\n\n  console.log('Mint created:', mint.toBase58());\n}\n\ncreateTokenMint();",
              testCases: [
                {
                  name: "Creates a mint with 6 decimals",
                  input: "",
                  expectedOutput: "mint created",
                },
                {
                  name: "Sets mint authority to payer",
                  input: "",
                  expectedOutput: "authority set",
                },
                {
                  name: "Logs the mint address",
                  input: "",
                  expectedOutput: "address logged",
                },
              ],
              language: "typescript",
            },
          },
          {
            id: "l-4-3",
            title: "Token-2022 Extensions",
            type: "reading",
            duration: "15 min",
            xpReward: 30,
            content:
              "Token-2022 (also called Token Extensions) is the next-generation token program on Solana. It is backward-compatible with the original SPL Token Program but adds powerful extensions that enable new token behaviors without custom programs.\n\nKey extensions:\n\nTransfer Fee — automatically collect a percentage fee on every transfer. The fee stays in the recipient's token account and can be harvested by the fee authority. Used by: RWA tokens, revenue-sharing tokens.\n\nNon-Transferable — makes tokens soulbound. Once minted to a wallet, they cannot be transferred. The mint authority can still mint and burn, but holders cannot send. Used by: reputation tokens, XP tokens, access passes.\n\nPermanent Delegate — grants an authority permanent control to burn or transfer any holder's tokens. Combined with Non-Transferable, this lets a platform manage soulbound tokens without user action. Used by: revocable credentials, managed tokens.\n\nTransfer Hook — executes a custom program on every transfer. The hook program can enforce rules, update state, or emit events. Used by: compliance tokens, royalty-enforced tokens.\n\nMetadata Pointer + Token Metadata — stores metadata (name, symbol, URI, custom fields) directly on the mint account. No separate Metaplex metadata account needed. Reduces rent costs and simplifies queries.\n\nConfidential Transfers — uses zero-knowledge proofs to hide transfer amounts while keeping sender/recipient public. Balances are encrypted. Used by: privacy-preserving stablecoins.\n\nSuperteam Academy uses Token-2022 with Non-Transferable + Permanent Delegate for its XP token. This ensures XP is soulbound (cannot be traded) while the platform retains the ability to manage the token supply.",
          },
        ],
      },
    ],
    isActive: true,
    totalCompletions: 0,
    enrolledCount: 0,
  },
  {
    id: "anchor-dev",
    slug: "anchor-development",
    title: "Anchor Development",
    description:
      "Build Solana programs with the Anchor framework. Learn account validation, instruction handlers, error handling, and testing patterns.",
    track: "anchor",
    difficulty: "intermediate",
    lessonCount: 15,
    duration: "6 hours",
    xpReward: 800,
    creator: "SuperteamBR",
    prerequisiteId: "intro-solana",
    modules: [
      {
        id: "anc-1",
        title: "Anchor Fundamentals",
        lessons: [
          {
            id: "a-1-1",
            title: "What is Anchor?",
            type: "reading",
            duration: "10 min",
            xpReward: 25,
            content:
              "Anchor is a framework for building Solana programs in Rust. It abstracts away the boilerplate of raw Solana development — account deserialization, signer checks, PDA validation, error handling — letting you focus on business logic.\n\nWithout Anchor, a Solana program entrypoint receives raw bytes and you must manually:\n• Deserialize the instruction data\n• Iterate account infos and validate each one\n• Check signers, owners, and PDA derivations\n• Serialize state back into account data\n\nAnchor handles all of this declaratively. You define account structs with constraint attributes, and Anchor generates the validation code at compile time.\n\nKey features:\n• #[program] macro — defines your instruction handlers as regular Rust functions\n• #[derive(Accounts)] — declares and validates all accounts an instruction needs\n• #[account] — auto-implements serialization/deserialization using Borsh\n• Constraint attributes — #[account(init, payer, space, seeds, bump, has_one, constraint)]\n• IDL generation — produces a JSON interface definition for TypeScript clients\n• Built-in testing — anchor test runs a local validator and executes TypeScript tests\n\nAnchor programs compile to the same BPF bytecode as native Solana programs. The framework adds ~10-15% compute overhead compared to hand-optimized native code, but the developer experience improvement is enormous. Most production programs on Solana use Anchor.\n\nCurrent version: Anchor 0.31+ (supports Rust 1.82+)",
          },
          {
            id: "a-1-2",
            title: "Project Structure",
            type: "reading",
            duration: "12 min",
            xpReward: 25,
            content:
              'An Anchor project follows a standard directory layout. Running \'anchor init myproject\' creates:\n\nmyproject/\n├── Anchor.toml          — project configuration (cluster, program IDs, test command)\n├── Cargo.toml           — Rust workspace definition\n├── programs/\n│   └── myproject/\n│       ├── Cargo.toml   — program dependencies (anchor-lang, anchor-spl)\n│       └── src/\n│           └── lib.rs   — program entrypoint and instruction handlers\n├── tests/\n│   └── myproject.ts     — TypeScript integration tests\n├── app/                 — frontend (optional)\n└── migrations/\n    └── deploy.ts        — deployment script\n\nThe lib.rs file is where your program lives. A minimal Anchor program:\n\nuse anchor_lang::prelude::*;\n\ndeclare_id!("YourProgramIdHere...");\n\n#[program]\npub mod myproject {\n    use super::*;\n\n    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {\n        msg!("Program initialized!");\n        Ok(())\n    }\n}\n\n#[derive(Accounts)]\npub struct Initialize {}\n\nAnchor.toml is important — it maps program names to their deployed IDs and configures which cluster to target (localnet, devnet, mainnet). The [programs.devnet] section holds your program\'s public key after the first build.\n\nAs your program grows, split into modules:\nsrc/\n├── lib.rs              — entrypoint + declare_id\n├── state/              — account structs\n├── instructions/       — one file per instruction\n├── errors.rs           — custom error enum\n└── utils.rs            — shared helpers',
          },
          {
            id: "a-1-3",
            title: "Your First Program",
            type: "challenge",
            duration: "30 min",
            xpReward: 60,
            challenge: {
              instructions:
                "Write a basic Anchor program with an 'initialize' instruction that creates a greeting account and stores a message.\n\nYour program should:\n1. Define a GreetingAccount struct with a 'message' field (String, max 280 chars)\n2. Create an 'initialize' instruction that takes a message parameter\n3. The instruction should create the GreetingAccount PDA and store the message\n4. Add proper account constraints (init, payer, space, seeds)\n\nThe account seeds should be ['greeting', signer pubkey].",
              starterCode:
                "use anchor_lang::prelude::*;\n\ndeclare_id!(\"11111111111111111111111111111111\");\n\n#[program]\npub mod greeting {\n    use super::*;\n\n    pub fn initialize(ctx: Context<Initialize>, message: String) -> Result<()> {\n        // TODO: Store the message in the greeting account\n        Ok(())\n    }\n}\n\n#[derive(Accounts)]\n#[instruction(message: String)]\npub struct Initialize<'info> {\n    // TODO: Add account constraints\n    // - greeting: init PDA with seeds ['greeting', signer]\n    // - user: signer and payer\n    // - system_program: System Program\n}\n\n#[account]\npub struct GreetingAccount {\n    // TODO: Define the message field\n}",
              solution:
                "use anchor_lang::prelude::*;\n\ndeclare_id!(\"11111111111111111111111111111111\");\n\n#[program]\npub mod greeting {\n    use super::*;\n\n    pub fn initialize(ctx: Context<Initialize>, message: String) -> Result<()> {\n        let greeting = &mut ctx.accounts.greeting;\n        greeting.message = message;\n        Ok(())\n    }\n}\n\n#[derive(Accounts)]\n#[instruction(message: String)]\npub struct Initialize<'info> {\n    #[account(\n        init,\n        payer = user,\n        space = 8 + 4 + 280,\n        seeds = [b\"greeting\", user.key().as_ref()],\n        bump\n    )]\n    pub greeting: Account<'info, GreetingAccount>,\n    #[account(mut)]\n    pub user: Signer<'info>,\n    pub system_program: Program<'info, System>,\n}\n\n#[account]\npub struct GreetingAccount {\n    pub message: String,\n}",
              testCases: [
                {
                  name: "Defines GreetingAccount with message field",
                  input: "",
                  expectedOutput: "struct defined",
                },
                {
                  name: "Uses init constraint with correct seeds",
                  input: "",
                  expectedOutput: "PDA initialized",
                },
                {
                  name: "Stores the message in the account",
                  input: "",
                  expectedOutput: "message stored",
                },
              ],
              language: "rust",
            },
          },
          {
            id: "a-1-4",
            title: "Account Constraints",
            type: "reading",
            duration: "15 min",
            xpReward: 30,
            content:
              "Anchor's constraint system is where the framework shines. Constraints are attributes on account fields that generate validation code at compile time. If any constraint fails, the transaction reverts.\n\nEssential constraints:\n\n#[account(init, payer = x, space = n)] — creates a new account. The payer funds the rent. Space must include the 8-byte discriminator.\n\n#[account(mut)] — marks an account as writable. Required for any account whose data or lamports change.\n\n#[account(seeds = [...], bump)] — validates a PDA derivation. Anchor checks that the account's address matches the derived PDA. Use bump = account.bump to use a stored bump.\n\n#[account(has_one = field)] — verifies that account.field == another account's key. Example: has_one = authority ensures the stored authority matches the signer.\n\n#[account(constraint = expr)] — arbitrary boolean check. Example: constraint = amount > 0 @ CustomError::InvalidAmount.\n\n#[account(close = target)] — closes the account and sends lamports to target. The account is zeroed and marked for garbage collection.\n\n#[account(realloc = new_size, realloc::payer = x, realloc::zero = false)] — resizes an account's data allocation.\n\nAccount types:\n• Account<'info, T> — deserialized and owner-checked\n• Signer<'info> — must be a signer on the transaction\n• Program<'info, T> — must be a specific program\n• SystemAccount<'info> — any system-owned account\n• UncheckedAccount<'info> — no validation (use with /// CHECK: comment)\n\nSpace calculation: 8 (discriminator) + sum of field sizes. String = 4 + max_len. Vec<T> = 4 + (count * size_of::<T>()). PublicKey = 32. u64 = 8. bool = 1. Option<T> = 1 + size_of::<T>().",
          },
        ],
      },
      {
        id: "anc-2",
        title: "State Management",
        lessons: [
          {
            id: "a-2-1",
            title: "Account Structs",
            type: "reading",
            duration: "12 min",
            xpReward: 25,
            content:
              'Account structs define the shape of your on-chain data. Anchor uses the #[account] macro to auto-implement Borsh serialization and add an 8-byte discriminator for type safety.\n\n#[account]\npub struct UserProfile {\n    pub authority: Pubkey,      // 32 bytes\n    pub display_name: String,   // 4 + len bytes\n    pub xp: u64,                // 8 bytes\n    pub level: u8,              // 1 byte\n    pub achievements: u64,      // 8 bytes (bitmap)\n    pub created_at: i64,        // 8 bytes\n    pub bump: u8,               // 1 byte\n}\n\nThe 8-byte discriminator is a hash of the account type name. When Anchor deserializes an account, it first checks this discriminator to ensure the account is the correct type. This prevents account substitution attacks.\n\nDesign patterns for account structs:\n\n1. Store the canonical bump — saves compute on subsequent accesses:\n   seeds = [b"profile", user.key().as_ref()], bump = profile.bump\n\n2. Use bitmaps for boolean flags — a u64 stores 64 independent booleans:\n   pub fn has_achievement(&self, index: u8) -> bool {\n       self.achievements & (1 << index) != 0\n   }\n\n3. Fixed-size arrays over Vec — predictable space, no realloc:\n   pub scores: [u16; 10] instead of pub scores: Vec<u16>\n\n4. Timestamps as i64 — use Clock::get()?.unix_timestamp\n\n5. Reserved bytes for future fields:\n   pub _reserved: [u8; 64]\n   This avoids account migrations when adding fields later.\n\nSpace formula: 8 (discriminator) + 32 + (4 + 32) + 8 + 1 + 8 + 8 + 1 = 102 bytes for the UserProfile above.',
          },
          {
            id: "a-2-2",
            title: "PDAs in Anchor",
            type: "challenge",
            duration: "25 min",
            xpReward: 55,
            challenge: {
              instructions:
                "Create an Anchor program that uses PDAs to store per-user data. Your program should:\n\n1. Define a UserStats account with fields: authority (Pubkey), games_played (u64), high_score (u64), bump (u8)\n2. Create an 'init_stats' instruction that initializes the PDA\n3. Create an 'record_game' instruction that increments games_played and updates high_score if the new score is higher\n4. Use seeds ['stats', user pubkey] for the PDA",
              starterCode:
                'use anchor_lang::prelude::*;\n\ndeclare_id!("11111111111111111111111111111111");\n\n#[program]\npub mod game_stats {\n    use super::*;\n\n    pub fn init_stats(ctx: Context<InitStats>) -> Result<()> {\n        // TODO: Initialize UserStats with default values\n        Ok(())\n    }\n\n    pub fn record_game(ctx: Context<RecordGame>, score: u64) -> Result<()> {\n        // TODO: Increment games_played\n        // TODO: Update high_score if score > current high_score\n        Ok(())\n    }\n}\n\n// TODO: Define InitStats accounts struct\n// TODO: Define RecordGame accounts struct\n// TODO: Define UserStats account struct',
              solution:
                "use anchor_lang::prelude::*;\n\ndeclare_id!(\"11111111111111111111111111111111\");\n\n#[program]\npub mod game_stats {\n    use super::*;\n\n    pub fn init_stats(ctx: Context<InitStats>) -> Result<()> {\n        let stats = &mut ctx.accounts.stats;\n        stats.authority = ctx.accounts.user.key();\n        stats.games_played = 0;\n        stats.high_score = 0;\n        stats.bump = ctx.bumps.stats;\n        Ok(())\n    }\n\n    pub fn record_game(ctx: Context<RecordGame>, score: u64) -> Result<()> {\n        let stats = &mut ctx.accounts.stats;\n        stats.games_played = stats.games_played.checked_add(1).unwrap();\n        if score > stats.high_score {\n            stats.high_score = score;\n        }\n        Ok(())\n    }\n}\n\n#[derive(Accounts)]\npub struct InitStats<'info> {\n    #[account(\n        init,\n        payer = user,\n        space = 8 + 32 + 8 + 8 + 1,\n        seeds = [b\"stats\", user.key().as_ref()],\n        bump\n    )]\n    pub stats: Account<'info, UserStats>,\n    #[account(mut)]\n    pub user: Signer<'info>,\n    pub system_program: Program<'info, System>,\n}\n\n#[derive(Accounts)]\npub struct RecordGame<'info> {\n    #[account(\n        mut,\n        seeds = [b\"stats\", user.key().as_ref()],\n        bump = stats.bump,\n        has_one = authority @ ErrorCode::Unauthorized\n    )]\n    pub stats: Account<'info, UserStats>,\n    pub user: Signer<'info>,\n    /// CHECK: validated by has_one\n    pub authority: AccountInfo<'info>,\n}\n\n#[account]\npub struct UserStats {\n    pub authority: Pubkey,\n    pub games_played: u64,\n    pub high_score: u64,\n    pub bump: u8,\n}",
              testCases: [
                {
                  name: "Initializes UserStats PDA with correct seeds",
                  input: "",
                  expectedOutput: "PDA created",
                },
                {
                  name: "Increments games_played on record_game",
                  input: "",
                  expectedOutput: "counter incremented",
                },
                {
                  name: "Updates high_score only when new score is higher",
                  input: "",
                  expectedOutput: "high score updated",
                },
              ],
              language: "rust",
            },
          },
          {
            id: "a-2-3",
            title: "CPIs (Cross-Program Invocations)",
            type: "reading",
            duration: "15 min",
            xpReward: 30,
            content:
              "Cross-Program Invocations (CPIs) let your program call other programs on Solana. This is how composability works — your program can transfer SOL, mint tokens, or interact with any other deployed program.\n\nTwo forms of CPI:\n\n1. invoke — for regular accounts (signers present in the transaction)\n   invoke(&instruction, &[account_infos])\n\n2. invoke_signed — for PDA-signed accounts (your program signs as the PDA)\n   invoke_signed(&instruction, &[account_infos], &[&[seeds, &[bump]]])\n\nAnchor simplifies CPIs with typed CPI contexts:\n\n// Transfer SOL via System Program\nlet cpi_ctx = CpiContext::new(\n    ctx.accounts.system_program.to_account_info(),\n    anchor_lang::system_program::Transfer {\n        from: ctx.accounts.payer.to_account_info(),\n        to: ctx.accounts.recipient.to_account_info(),\n    },\n);\nanchor_lang::system_program::transfer(cpi_ctx, amount)?;\n\n// Mint tokens via Token Program\nlet cpi_ctx = CpiContext::new(\n    ctx.accounts.token_program.to_account_info(),\n    anchor_spl::token::MintTo {\n        mint: ctx.accounts.mint.to_account_info(),\n        to: ctx.accounts.token_account.to_account_info(),\n        authority: ctx.accounts.mint_authority.to_account_info(),\n    },\n);\nanchor_spl::token::mint_to(cpi_ctx, amount)?;\n\nFor PDA-signed CPIs, use CpiContext::new_with_signer and pass the seeds:\nlet seeds = &[b\"vault\", &[vault_bump]];\nlet signer_seeds = &[&seeds[..]];\nlet cpi_ctx = CpiContext::new_with_signer(program, accounts, signer_seeds);\n\nSecurity: Always validate the program you're invoking. Anchor's Program<'info, T> type ensures the program ID matches. For raw CPIs, manually check the program key. Never pass unchecked program accounts to invoke.",
          },
          {
            id: "a-2-4",
            title: "Build a Counter Program",
            type: "challenge",
            duration: "30 min",
            xpReward: 65,
            challenge: {
              instructions:
                "Build a complete counter program with three instructions:\n\n1. 'initialize' — creates a Counter account (PDA seeded by the authority) with count = 0\n2. 'increment' — adds 1 to the count (only the authority can call this)\n3. 'decrement' — subtracts 1 from the count (cannot go below 0)\n\nThe Counter account should store: authority (Pubkey), count (u64), bump (u8).\nUse checked arithmetic to prevent overflow/underflow.",
              starterCode:
                'use anchor_lang::prelude::*;\n\ndeclare_id!("11111111111111111111111111111111");\n\n#[program]\npub mod counter {\n    use super::*;\n\n    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {\n        // TODO\n        Ok(())\n    }\n\n    pub fn increment(ctx: Context<Update>) -> Result<()> {\n        // TODO\n        Ok(())\n    }\n\n    pub fn decrement(ctx: Context<Update>) -> Result<()> {\n        // TODO\n        Ok(())\n    }\n}\n\n// TODO: Define Initialize, Update accounts structs\n// TODO: Define Counter account struct\n// TODO: Define custom errors',
              solution:
                'use anchor_lang::prelude::*;\n\ndeclare_id!("11111111111111111111111111111111");\n\n#[program]\npub mod counter {\n    use super::*;\n\n    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {\n        let counter = &mut ctx.accounts.counter;\n        counter.authority = ctx.accounts.authority.key();\n        counter.count = 0;\n        counter.bump = ctx.bumps.counter;\n        Ok(())\n    }\n\n    pub fn increment(ctx: Context<Update>) -> Result<()> {\n        let counter = &mut ctx.accounts.counter;\n        counter.count = counter.count.checked_add(1).ok_or(CounterError::Overflow)?;\n        Ok(())\n    }\n\n    pub fn decrement(ctx: Context<Update>) -> Result<()> {\n        let counter = &mut ctx.accounts.counter;\n        counter.count = counter.count.checked_sub(1).ok_or(CounterError::Underflow)?;\n        Ok(())\n    }\n}\n\n#[derive(Accounts)]\npub struct Initialize<\'info> {\n    #[account(\n        init,\n        payer = authority,\n        space = 8 + 32 + 8 + 1,\n        seeds = [b"counter", authority.key().as_ref()],\n        bump\n    )]\n    pub counter: Account<\'info, Counter>,\n    #[account(mut)]\n    pub authority: Signer<\'info>,\n    pub system_program: Program<\'info, System>,\n}\n\n#[derive(Accounts)]\npub struct Update<\'info> {\n    #[account(\n        mut,\n        seeds = [b"counter", authority.key().as_ref()],\n        bump = counter.bump,\n        has_one = authority\n    )]\n    pub counter: Account<\'info, Counter>,\n    pub authority: Signer<\'info>,\n}\n\n#[account]\npub struct Counter {\n    pub authority: Pubkey,\n    pub count: u64,\n    pub bump: u8,\n}\n\n#[error_code]\npub enum CounterError {\n    #[msg("Counter overflow")]\n    Overflow,\n    #[msg("Counter underflow")]\n    Underflow,\n}',
              testCases: [
                {
                  name: "Initializes counter with count = 0",
                  input: "",
                  expectedOutput: "counter initialized",
                },
                {
                  name: "Increment increases count by 1",
                  input: "",
                  expectedOutput: "count incremented",
                },
                {
                  name: "Decrement fails when count is 0",
                  input: "",
                  expectedOutput: "underflow prevented",
                },
              ],
              language: "rust",
            },
          },
        ],
      },
      {
        id: "anc-3",
        title: "Testing & Deployment",
        lessons: [
          {
            id: "a-3-1",
            title: "Writing Tests",
            type: "reading",
            duration: "15 min",
            xpReward: 30,
            content:
              "Anchor provides a TypeScript testing framework that spins up a local Solana validator and runs your tests against it. Tests use Mocha syntax with the @coral-xyz/anchor library.\n\nTest setup in tests/myprogram.ts:\n\nimport * as anchor from '@coral-xyz/anchor';\nimport { Program } from '@coral-xyz/anchor';\nimport { Myprogram } from '../target/types/myprogram';\n\ndescribe('myprogram', () => {\n  const provider = anchor.AnchorProvider.env();\n  anchor.setProvider(provider);\n  const program = anchor.workspace.Myprogram as Program<Myprogram>;\n\n  it('initializes', async () => {\n    const tx = await program.methods\n      .initialize()\n      .accounts({ ... })\n      .rpc();\n    console.log('Transaction:', tx);\n  });\n});\n\nKey testing patterns:\n\n1. Use program.methods.instructionName(args).accounts({}).rpc() for sending transactions\n2. Use program.account.AccountType.fetch(pubkey) to read account data\n3. Test error cases with try/catch and check error codes:\n   try { await program.methods.bad().rpc(); assert.fail(); }\n   catch (e) { expect(e.error.errorCode.code).to.equal('Unauthorized'); }\n\n4. Generate PDAs in tests:\n   const [pda] = PublicKey.findProgramAddressSync(\n     [Buffer.from('seed'), wallet.toBuffer()],\n     program.programId\n   );\n\n5. Run tests: anchor test (builds + deploys + runs)\n   Run without rebuild: anchor test --skip-build\n   Run specific test: anchor test -- --grep 'test name'\n\nFor unit tests in Rust, use Mollusk or LiteSVM. These test the program logic without a full validator, running 10-100x faster than integration tests.",
          },
          {
            id: "a-3-2",
            title: "Test Your Counter",
            type: "challenge",
            duration: "25 min",
            xpReward: 55,
            challenge: {
              instructions:
                "Write TypeScript tests for the Counter program from the previous lesson. Your tests should:\n\n1. Test that 'initialize' creates a counter with count = 0\n2. Test that 'increment' increases count to 1\n3. Test that 'decrement' after increment returns count to 0\n4. Test that 'decrement' on a zero counter fails with an Underflow error\n\nUse the Anchor testing pattern with program.methods and program.account.",
              starterCode:
                "import * as anchor from '@coral-xyz/anchor';\nimport { Program } from '@coral-xyz/anchor';\nimport { PublicKey } from '@solana/web3.js';\nimport { expect } from 'chai';\n\ndescribe('counter', () => {\n  const provider = anchor.AnchorProvider.env();\n  anchor.setProvider(provider);\n  // const program = anchor.workspace.Counter;\n\n  const authority = provider.wallet;\n\n  // TODO: Derive the counter PDA\n\n  it('initializes the counter', async () => {\n    // TODO: Call initialize and verify count = 0\n  });\n\n  it('increments the counter', async () => {\n    // TODO: Call increment and verify count = 1\n  });\n\n  it('decrements the counter', async () => {\n    // TODO: Call decrement and verify count = 0\n  });\n\n  it('fails to decrement below zero', async () => {\n    // TODO: Call decrement on 0 and expect Underflow error\n  });\n});",
              solution:
                "import * as anchor from '@coral-xyz/anchor';\nimport { Program } from '@coral-xyz/anchor';\nimport { PublicKey } from '@solana/web3.js';\nimport { expect } from 'chai';\n\ndescribe('counter', () => {\n  const provider = anchor.AnchorProvider.env();\n  anchor.setProvider(provider);\n  const program = anchor.workspace.Counter;\n\n  const authority = provider.wallet;\n\n  const [counterPda] = PublicKey.findProgramAddressSync(\n    [Buffer.from('counter'), authority.publicKey.toBuffer()],\n    program.programId\n  );\n\n  it('initializes the counter', async () => {\n    await program.methods\n      .initialize()\n      .accounts({ counter: counterPda, authority: authority.publicKey })\n      .rpc();\n\n    const account = await program.account.counter.fetch(counterPda);\n    expect(account.count.toNumber()).to.equal(0);\n    expect(account.authority.toBase58()).to.equal(authority.publicKey.toBase58());\n  });\n\n  it('increments the counter', async () => {\n    await program.methods.increment().accounts({ counter: counterPda, authority: authority.publicKey }).rpc();\n    const account = await program.account.counter.fetch(counterPda);\n    expect(account.count.toNumber()).to.equal(1);\n  });\n\n  it('decrements the counter', async () => {\n    await program.methods.decrement().accounts({ counter: counterPda, authority: authority.publicKey }).rpc();\n    const account = await program.account.counter.fetch(counterPda);\n    expect(account.count.toNumber()).to.equal(0);\n  });\n\n  it('fails to decrement below zero', async () => {\n    try {\n      await program.methods.decrement().accounts({ counter: counterPda, authority: authority.publicKey }).rpc();\n      expect.fail('Should have thrown');\n    } catch (e) {\n      expect(e.error.errorCode.code).to.equal('Underflow');\n    }\n  });\n});",
              testCases: [
                {
                  name: "Verifies counter initializes with count = 0",
                  input: "",
                  expectedOutput: "initialization verified",
                },
                {
                  name: "Tests increment and decrement operations",
                  input: "",
                  expectedOutput: "operations verified",
                },
                {
                  name: "Verifies underflow protection",
                  input: "",
                  expectedOutput: "error caught",
                },
              ],
              language: "typescript",
            },
          },
          {
            id: "a-3-3",
            title: "Deploy to Devnet",
            type: "challenge",
            duration: "20 min",
            xpReward: 50,
            challenge: {
              instructions:
                "Deploy your counter program to Solana devnet. Follow these steps:\n\n1. Configure Solana CLI for devnet\n2. Fund your wallet with devnet SOL via airdrop\n3. Build the program with Anchor\n4. Deploy to devnet\n5. Log the deployed program ID\n\nWrite a deployment script that handles these steps.",
              starterCode:
                "// deployment-script.ts\nimport { execSync } from 'child_process';\n\nasync function deploy() {\n  console.log('Deploying to devnet...');\n\n  // TODO: Step 1 - Set Solana cluster to devnet\n  // TODO: Step 2 - Check balance and airdrop if needed\n  // TODO: Step 3 - Build the program\n  // TODO: Step 4 - Deploy\n  // TODO: Step 5 - Log the program ID\n}\n\ndeploy();",
              solution:
                "// deployment-script.ts\nimport { execSync } from 'child_process';\n\nasync function deploy() {\n  console.log('Deploying to devnet...');\n\n  // Step 1: Configure for devnet\n  execSync('solana config set --url devnet', { stdio: 'inherit' });\n\n  // Step 2: Check balance\n  const balance = execSync('solana balance').toString().trim();\n  console.log('Current balance:', balance);\n  if (parseFloat(balance) < 2) {\n    console.log('Requesting airdrop...');\n    execSync('solana airdrop 2', { stdio: 'inherit' });\n  }\n\n  // Step 3: Build\n  console.log('Building program...');\n  execSync('anchor build', { stdio: 'inherit' });\n\n  // Step 4: Deploy\n  console.log('Deploying...');\n  execSync('anchor deploy --provider.cluster devnet', { stdio: 'inherit' });\n\n  // Step 5: Get program ID\n  const programId = execSync('solana address -k target/deploy/counter-keypair.json').toString().trim();\n  console.log('Program deployed! ID:', programId);\n}\n\ndeploy();",
              testCases: [
                {
                  name: "Configures Solana for devnet",
                  input: "",
                  expectedOutput: "cluster configured",
                },
                {
                  name: "Builds and deploys the program",
                  input: "",
                  expectedOutput: "program deployed",
                },
                {
                  name: "Outputs the program ID",
                  input: "",
                  expectedOutput: "program ID logged",
                },
              ],
              language: "typescript",
            },
          },
        ],
      },
      {
        id: "anc-4",
        title: "Advanced Patterns",
        lessons: [
          {
            id: "a-4-1",
            title: "Error Handling",
            type: "reading",
            duration: "12 min",
            xpReward: 25,
            content:
              'Proper error handling is critical in Solana programs — an ambiguous error wastes hours of debugging time. Anchor provides a structured error system with the #[error_code] macro.\n\nDefining custom errors:\n\n#[error_code]\npub enum GameError {\n    #[msg("Player has insufficient funds to place this bet")]\n    InsufficientFunds,       // Error code: 6000\n    #[msg("The game has already ended")]\n    GameOver,                // Error code: 6001\n    #[msg("Not your turn")]\n    NotYourTurn,             // Error code: 6002\n    #[msg("Invalid move: position already occupied")]\n    InvalidMove,             // Error code: 6003\n}\n\nAnchor assigns error codes starting at 6000. Built-in Anchor errors (constraint violations, deserialization failures) use codes 100-300. Solana system errors use 0-99.\n\nUsing errors in instructions:\n\n// Simple return\nreturn Err(GameError::InsufficientFunds.into());\n\n// With require! macro (preferred)\nrequire!(player.balance >= bet_amount, GameError::InsufficientFunds);\n\n// With require_keys_eq!\nrequire_keys_eq!(ctx.accounts.player.key(), game.current_player, GameError::NotYourTurn);\n\n// In constraints\n#[account(constraint = game.is_active @ GameError::GameOver)]\n\nClient-side error handling:\ntry {\n  await program.methods.placeBet(amount).rpc();\n} catch (e) {\n  const anchorError = AnchorError.parse(e.logs);\n  if (anchorError?.error.errorCode.code === \'InsufficientFunds\') {\n    // Handle specific error\n  }\n}\n\nBest practices:\n• One error enum per program, organized by category\n• Descriptive #[msg] strings — they show up in explorer and logs\n• Use require! over manual if/return — shorter and more readable\n• Never use unwrap() in program code — always propagate errors with ?',
          },
          {
            id: "a-4-2",
            title: "Events & Logging",
            type: "reading",
            duration: "10 min",
            xpReward: 25,
            content:
              "Events let your program emit structured data that off-chain services can subscribe to. Anchor's #[event] macro generates the serialization code and a convenient emit! macro.\n\nDefining and emitting events:\n\n#[event]\npub struct GameStarted {\n    pub game_id: Pubkey,\n    pub player_one: Pubkey,\n    pub player_two: Pubkey,\n    pub timestamp: i64,\n}\n\n// In your instruction:\nemit!(GameStarted {\n    game_id: ctx.accounts.game.key(),\n    player_one: ctx.accounts.player.key(),\n    player_two: opponent,\n    timestamp: Clock::get()?.unix_timestamp,\n});\n\nEvents are stored in the transaction log as base64-encoded data prefixed with the event discriminator. The Anchor TypeScript client can parse them:\n\nconst listener = program.addEventListener('GameStarted', (event, slot) => {\n  console.log('Game started:', event.gameId.toBase58());\n});\n// Later: program.removeEventListener(listener);\n\nFor simple debugging, use msg! (Anchor's logging macro):\nmsg!(\"Player {} placed bet of {} lamports\", player.key(), amount);\n\nmsg! writes to the transaction log (visible in Solana Explorer). Each msg! call costs ~100 compute units. Logs have a total size limit of 10KB per transaction.\n\nWhen to use events vs msg!:\n• Events — structured data for indexers, analytics, and off-chain services\n• msg! — debugging and human-readable logs\n\nIn production, use events for anything an indexer (like Helius webhooks or Geyser plugins) needs to process. Use msg! sparingly — it's primarily for development.",
          },
          {
            id: "a-4-3",
            title: "Security Best Practices",
            type: "reading",
            duration: "15 min",
            xpReward: 30,
            content:
              "Security on Solana requires understanding the unique attack surface of the account model. Here are the most critical patterns to follow.\n\n1. ALWAYS validate account ownership\nAnchor's Account<'info, T> type checks that the account is owned by your program. But for accounts from other programs, verify explicitly:\n#[account(token::authority = user)] — checks token account authority\n#[account(owner = token_program.key())] — checks program ownership\n\n2. NEVER trust account data without owner checks\nAn attacker can create an account with any data layout. Without owner validation, they can forge accounts that your program misinterprets.\n\n3. Use checked arithmetic everywhere\nSolana's BPF runtime wraps on overflow by default. Always use:\nchecked_add(), checked_sub(), checked_mul(), checked_div()\nOr use the require! macro: require!(a + b <= MAX, Error::Overflow);\n\n4. Validate signers\nEvery account that should authorize an action must be a Signer<'info>. Never rely on account data alone — always verify the signature.\n\n5. Prevent reinitialization\nUse Anchor's init constraint (not init_if_needed unless necessary). If using init_if_needed, add a flag: require!(!account.is_initialized, Error::AlreadyInitialized);\n\n6. Close account properly\nUse Anchor's #[account(close = target)] constraint. It zeros the data, transfers lamports, and marks for garbage collection. Never just zero the data — the account could be resurrected within the same transaction.\n\n7. PDA bump validation\nStore the canonical bump on initialization: account.bump = ctx.bumps.account_name;\nOn subsequent accesses: seeds = [...], bump = account.bump\nNever recalculate bumps — it wastes compute and risks finding a different valid bump.\n\n8. CPI guard\nValidate the program ID for every CPI target. Anchor's Program<'info, T> type does this automatically. For raw invoke(), check the program key manually.\n\n9. Reload after CPI\nIf a CPI modifies an account you hold a reference to, reload it:\nctx.accounts.token_account.reload()?;\nStale data after CPI is a common source of bugs.\n\n10. Time-based logic\nUse Clock::get()?.unix_timestamp (not slot numbers). Slots are not constant duration.",
          },
          {
            id: "a-4-4",
            title: "Final Project: Voting Program",
            type: "challenge",
            duration: "45 min",
            xpReward: 100,
            challenge: {
              instructions:
                "Build a decentralized voting program. Requirements:\n\n1. A 'create_poll' instruction that creates a Poll account with:\n   - question (String, max 200 chars)\n   - options: two option labels (String, max 50 chars each)\n   - votes_option_a and votes_option_b (u64, both starting at 0)\n   - authority, created_at, bump\n\n2. A 'cast_vote' instruction that:\n   - Creates a VoterRecord PDA (seeds: ['voter', poll, voter]) to prevent double voting\n   - Increments the chosen option's vote count\n   - Takes a 'choice' parameter (0 for option A, 1 for option B)\n\n3. Proper error handling for: invalid choice, double voting attempt",
              starterCode:
                'use anchor_lang::prelude::*;\n\ndeclare_id!("11111111111111111111111111111111");\n\n#[program]\npub mod voting {\n    use super::*;\n\n    pub fn create_poll(\n        ctx: Context<CreatePoll>,\n        question: String,\n        option_a: String,\n        option_b: String,\n    ) -> Result<()> {\n        // TODO: Initialize poll\n        Ok(())\n    }\n\n    pub fn cast_vote(ctx: Context<CastVote>, choice: u8) -> Result<()> {\n        // TODO: Validate choice (0 or 1)\n        // TODO: Increment vote count\n        // TODO: Mark voter record\n        Ok(())\n    }\n}\n\n// TODO: Define CreatePoll, CastVote accounts\n// TODO: Define Poll, VoterRecord account structs\n// TODO: Define VotingError enum',
              solution:
                'use anchor_lang::prelude::*;\n\ndeclare_id!("11111111111111111111111111111111");\n\n#[program]\npub mod voting {\n    use super::*;\n\n    pub fn create_poll(\n        ctx: Context<CreatePoll>,\n        question: String,\n        option_a: String,\n        option_b: String,\n    ) -> Result<()> {\n        let poll = &mut ctx.accounts.poll;\n        poll.authority = ctx.accounts.authority.key();\n        poll.question = question;\n        poll.option_a = option_a;\n        poll.option_b = option_b;\n        poll.votes_a = 0;\n        poll.votes_b = 0;\n        poll.created_at = Clock::get()?.unix_timestamp;\n        poll.bump = ctx.bumps.poll;\n        Ok(())\n    }\n\n    pub fn cast_vote(ctx: Context<CastVote>, choice: u8) -> Result<()> {\n        require!(choice <= 1, VotingError::InvalidChoice);\n\n        let poll = &mut ctx.accounts.poll;\n        match choice {\n            0 => poll.votes_a = poll.votes_a.checked_add(1).ok_or(VotingError::Overflow)?,\n            1 => poll.votes_b = poll.votes_b.checked_add(1).ok_or(VotingError::Overflow)?,\n            _ => return Err(VotingError::InvalidChoice.into()),\n        }\n\n        let voter_record = &mut ctx.accounts.voter_record;\n        voter_record.poll = ctx.accounts.poll.key();\n        voter_record.voter = ctx.accounts.voter.key();\n        voter_record.choice = choice;\n        voter_record.bump = ctx.bumps.voter_record;\n\n        Ok(())\n    }\n}\n\n#[derive(Accounts)]\n#[instruction(question: String, option_a: String, option_b: String)]\npub struct CreatePoll<\'info> {\n    #[account(\n        init,\n        payer = authority,\n        space = 8 + 32 + (4+200) + (4+50) + (4+50) + 8 + 8 + 8 + 1,\n        seeds = [b"poll", authority.key().as_ref()],\n        bump\n    )]\n    pub poll: Account<\'info, Poll>,\n    #[account(mut)]\n    pub authority: Signer<\'info>,\n    pub system_program: Program<\'info, System>,\n}\n\n#[derive(Accounts)]\npub struct CastVote<\'info> {\n    #[account(mut)]\n    pub poll: Account<\'info, Poll>,\n    #[account(\n        init,\n        payer = voter,\n        space = 8 + 32 + 32 + 1 + 1,\n        seeds = [b"voter", poll.key().as_ref(), voter.key().as_ref()],\n        bump\n    )]\n    pub voter_record: Account<\'info, VoterRecord>,\n    #[account(mut)]\n    pub voter: Signer<\'info>,\n    pub system_program: Program<\'info, System>,\n}\n\n#[account]\npub struct Poll {\n    pub authority: Pubkey,\n    pub question: String,\n    pub option_a: String,\n    pub option_b: String,\n    pub votes_a: u64,\n    pub votes_b: u64,\n    pub created_at: i64,\n    pub bump: u8,\n}\n\n#[account]\npub struct VoterRecord {\n    pub poll: Pubkey,\n    pub voter: Pubkey,\n    pub choice: u8,\n    pub bump: u8,\n}\n\n#[error_code]\npub enum VotingError {\n    #[msg("Invalid choice: must be 0 or 1")]\n    InvalidChoice,\n    #[msg("Vote count overflow")]\n    Overflow,\n}',
              testCases: [
                {
                  name: "Creates poll with question and two options",
                  input: "",
                  expectedOutput: "poll created",
                },
                {
                  name: "Casts vote and increments correct counter",
                  input: "",
                  expectedOutput: "vote counted",
                },
                {
                  name: "Prevents double voting via VoterRecord PDA",
                  input: "",
                  expectedOutput: "double vote prevented",
                },
                {
                  name: "Rejects invalid choice values",
                  input: "",
                  expectedOutput: "invalid choice rejected",
                },
              ],
              language: "rust",
            },
          },
        ],
      },
    ],
    isActive: true,
    totalCompletions: 0,
    enrolledCount: 0,
  },
  {
    id: "frontend-solana",
    slug: "frontend-with-react",
    title: "Solana Frontend with React",
    description:
      "Build beautiful dApp frontends. Connect wallets, sign transactions, display token balances, and create seamless user experiences.",
    track: "frontend",
    difficulty: "intermediate",
    lessonCount: 10,
    duration: "5 hours",
    xpReward: 650,
    creator: "SuperteamBR",
    prerequisiteId: "intro-solana",
    modules: [
      {
        id: "fe-1",
        title: "Wallet Integration",
        lessons: [
          {
            id: "f-1-1",
            title: "Wallet Adapter Setup",
            type: "reading",
            duration: "15 min",
            xpReward: 30,
            content:
              "The Solana Wallet Adapter is the standard library for connecting wallets to web applications. It supports Phantom, Backpack, Solflare, and any wallet implementing the Wallet Standard.\n\nInstallation:\npnpm add @solana/wallet-adapter-react @solana/wallet-adapter-react-ui @solana/wallet-adapter-base @solana/wallet-adapter-wallets @solana/web3.js\n\nProvider setup in your app layout:\n\nimport { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';\nimport { WalletModalProvider } from '@solana/wallet-adapter-react-ui';\nimport '@solana/wallet-adapter-react-ui/styles.css';\n\nconst endpoint = 'https://api.devnet.solana.com';\n\nexport function Providers({ children }) {\n  return (\n    <ConnectionProvider endpoint={endpoint}>\n      <WalletProvider wallets={[]} autoConnect>\n        <WalletModalProvider>\n          {children}\n        </WalletModalProvider>\n      </WalletProvider>\n    </ConnectionProvider>\n  );\n}\n\nThe empty wallets array is correct for Wallet Standard v0.9+. The adapter auto-detects installed wallets via the Wallet Standard interface — no need to manually import wallet adapters.\n\nKey hooks:\n• useConnection() — returns the Connection object\n• useWallet() — returns wallet state (publicKey, connected, signTransaction, etc.)\n• useAnchorWallet() — returns an Anchor-compatible wallet for AnchorProvider\n\nThe WalletModalProvider adds a modal dialog that lists detected wallets. Users click to connect, and the wallet extension handles key management and signing.",
          },
          {
            id: "f-1-2",
            title: "Connect Button Component",
            type: "challenge",
            duration: "25 min",
            xpReward: 55,
            challenge: {
              instructions:
                "Build a custom wallet connect button component using the Solana Wallet Adapter hooks. Your component should:\n\n1. Show 'Connect Wallet' when disconnected\n2. Show the truncated wallet address when connected (e.g., 'Ab3f...x9Yz')\n3. Show a disconnect option when clicking the connected state\n4. Display the SOL balance next to the address\n\nUse useWallet() and useConnection() hooks. Do NOT use the default WalletMultiButton.",
              starterCode:
                "import { useWallet } from '@solana/wallet-adapter-react';\nimport { useConnection } from '@solana/wallet-adapter-react';\nimport { LAMPORTS_PER_SOL } from '@solana/web3.js';\nimport { useState, useEffect } from 'react';\n\nexport function ConnectButton() {\n  const { publicKey, connected, connect, disconnect, select, wallets } = useWallet();\n  const { connection } = useConnection();\n  const [balance, setBalance] = useState<number | null>(null);\n\n  // TODO: Fetch balance when connected\n  // TODO: Truncate the public key for display\n  // TODO: Render connect/disconnect states\n\n  return (\n    <button>\n      {/* TODO: Implement */}\n    </button>\n  );\n}",
              solution:
                "import { useWallet } from '@solana/wallet-adapter-react';\nimport { useConnection } from '@solana/wallet-adapter-react';\nimport { LAMPORTS_PER_SOL } from '@solana/web3.js';\nimport { useState, useEffect } from 'react';\n\nexport function ConnectButton() {\n  const { publicKey, connected, connect, disconnect, select, wallets } = useWallet();\n  const { connection } = useConnection();\n  const [balance, setBalance] = useState<number | null>(null);\n  const [showMenu, setShowMenu] = useState(false);\n\n  useEffect(() => {\n    if (!publicKey) { setBalance(null); return; }\n    connection.getBalance(publicKey).then((bal) => {\n      setBalance(bal / LAMPORTS_PER_SOL);\n    });\n  }, [publicKey, connection]);\n\n  const truncatedAddress = publicKey\n    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`\n    : '';\n\n  if (!connected) {\n    return (\n      <button onClick={() => { if (wallets[0]) { select(wallets[0].adapter.name); connect(); } }}>\n        Connect Wallet\n      </button>\n    );\n  }\n\n  return (\n    <div style={{ position: 'relative' }}>\n      <button onClick={() => setShowMenu(!showMenu)}>\n        {truncatedAddress} {balance !== null && `(${balance.toFixed(2)} SOL)`}\n      </button>\n      {showMenu && (\n        <button onClick={() => { disconnect(); setShowMenu(false); }}>\n          Disconnect\n        </button>\n      )}\n    </div>\n  );\n}",
              testCases: [
                {
                  name: "Shows 'Connect Wallet' when disconnected",
                  input: "",
                  expectedOutput: "connect button shown",
                },
                {
                  name: "Displays truncated address when connected",
                  input: "",
                  expectedOutput: "address displayed",
                },
                {
                  name: "Fetches and displays SOL balance",
                  input: "",
                  expectedOutput: "balance shown",
                },
              ],
              language: "typescript",
            },
          },
          {
            id: "f-1-3",
            title: "Handling Wallet State",
            type: "reading",
            duration: "12 min",
            xpReward: 25,
            content:
              "Managing wallet state in a React dApp requires handling several edge cases: disconnection, network changes, account switches, and transaction signing failures.\n\nThe useWallet() hook provides these key properties:\n• publicKey: PublicKey | null — the connected wallet's public key\n• connected: boolean — whether a wallet is currently connected\n• connecting: boolean — true during the connection process\n• disconnecting: boolean — true during disconnection\n• wallet: WalletAdapter | null — the selected wallet adapter\n• signTransaction: (tx) => Promise<Transaction> — sign without sending\n• signAllTransactions: (txs) => Promise<Transaction[]> — batch sign\n• sendTransaction: (tx, conn) => Promise<string> — sign and send\n\nCommon patterns:\n\n1. Guarding routes — redirect to connect page if wallet not connected:\nuseEffect(() => {\n  if (!connected && !connecting) router.push('/connect');\n}, [connected, connecting]);\n\n2. Watching for account changes:\nuseEffect(() => {\n  if (publicKey) {\n    // Refetch user data when wallet changes\n    loadUserProfile(publicKey.toBase58());\n  }\n}, [publicKey]);\n\n3. Handling transaction errors gracefully:\ntry {\n  const sig = await sendTransaction(tx, connection);\n  await connection.confirmTransaction(sig, 'confirmed');\n} catch (e) {\n  if (e.message.includes('User rejected')) {\n    // User cancelled in wallet\n  } else if (e.message.includes('insufficient funds')) {\n    // Not enough SOL\n  }\n}\n\n4. Auto-connect — the WalletProvider's autoConnect prop re-establishes the previous connection on page load. This uses localStorage under the hood.\n\n5. Multiple wallets — if the user has Phantom and Backpack installed, both appear in the wallet modal. The Wallet Standard handles detection automatically.",
          },
        ],
      },
      {
        id: "fe-2",
        title: "Transactions in the Browser",
        lessons: [
          {
            id: "f-2-1",
            title: "Building Transactions",
            type: "reading",
            duration: "15 min",
            xpReward: 30,
            content:
              "Building transactions in the browser follows the same pattern as server-side code, but with one key difference: the user's wallet signs instead of a local keypair.\n\nTransaction building pattern:\n\nimport { Transaction, SystemProgram, PublicKey } from '@solana/web3.js';\nimport { useConnection, useWallet } from '@solana/wallet-adapter-react';\n\nconst { connection } = useConnection();\nconst { publicKey, sendTransaction } = useWallet();\n\n// 1. Create instruction(s)\nconst instruction = SystemProgram.transfer({\n  fromPubkey: publicKey,\n  toPubkey: new PublicKey('recipient...'),\n  lamports: 100_000_000, // 0.1 SOL\n});\n\n// 2. Build transaction\nconst transaction = new Transaction().add(instruction);\n\n// 3. Get recent blockhash\nconst { blockhash } = await connection.getLatestBlockhash();\ntransaction.recentBlockhash = blockhash;\ntransaction.feePayer = publicKey;\n\n// 4. Send (wallet adapter handles signing)\nconst signature = await sendTransaction(transaction, connection);\n\nFor Anchor programs, use the Program class:\n\nconst provider = new AnchorProvider(connection, wallet, {});\nconst program = new Program(idl, programId, provider);\n\nawait program.methods\n  .myInstruction(arg1, arg2)\n  .accounts({ account1: pda, account2: publicKey })\n  .rpc(); // Signs and sends\n\nVersioned Transactions (v0) support Address Lookup Tables (ALTs) for more accounts per transaction:\n\nimport { VersionedTransaction, TransactionMessage } from '@solana/web3.js';\nconst messageV0 = new TransactionMessage({\n  payerKey: publicKey,\n  recentBlockhash: blockhash,\n  instructions: [instruction],\n}).compileToV0Message([lookupTable]);\nconst tx = new VersionedTransaction(messageV0);\n\nUse v0 transactions when you need more than ~35 accounts (common in DeFi).",
          },
          {
            id: "f-2-2",
            title: "Sign and Send",
            type: "challenge",
            duration: "30 min",
            xpReward: 60,
            challenge: {
              instructions:
                "Build a React component that lets users send SOL to any address. The component should:\n\n1. Have an input for the recipient address (validate it's a valid PublicKey)\n2. Have an input for the amount in SOL\n3. A 'Send' button that builds and sends the transaction\n4. Display the transaction signature on success\n5. Handle errors (invalid address, insufficient funds, user rejection)\n\nUse useWallet() and useConnection() hooks.",
              starterCode:
                "import { useState } from 'react';\nimport { useConnection, useWallet } from '@solana/wallet-adapter-react';\nimport { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';\n\nexport function SendSolForm() {\n  const { connection } = useConnection();\n  const { publicKey, sendTransaction } = useWallet();\n  const [recipient, setRecipient] = useState('');\n  const [amount, setAmount] = useState('');\n  const [signature, setSignature] = useState('');\n  const [error, setError] = useState('');\n\n  const handleSend = async () => {\n    setError('');\n    setSignature('');\n    // TODO: Validate inputs\n    // TODO: Build transaction\n    // TODO: Send and get signature\n    // TODO: Handle errors\n  };\n\n  return (\n    <div>\n      <input placeholder=\"Recipient address\" value={recipient} onChange={(e) => setRecipient(e.target.value)} />\n      <input placeholder=\"Amount (SOL)\" value={amount} onChange={(e) => setAmount(e.target.value)} />\n      <button onClick={handleSend}>Send SOL</button>\n      {signature && <p>Success: {signature}</p>}\n      {error && <p>Error: {error}</p>}\n    </div>\n  );\n}",
              solution:
                "import { useState } from 'react';\nimport { useConnection, useWallet } from '@solana/wallet-adapter-react';\nimport { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';\n\nexport function SendSolForm() {\n  const { connection } = useConnection();\n  const { publicKey, sendTransaction } = useWallet();\n  const [recipient, setRecipient] = useState('');\n  const [amount, setAmount] = useState('');\n  const [signature, setSignature] = useState('');\n  const [error, setError] = useState('');\n  const [loading, setLoading] = useState(false);\n\n  const handleSend = async () => {\n    setError('');\n    setSignature('');\n    if (!publicKey) { setError('Connect wallet first'); return; }\n\n    let recipientPk: PublicKey;\n    try {\n      recipientPk = new PublicKey(recipient);\n    } catch {\n      setError('Invalid recipient address');\n      return;\n    }\n\n    const solAmount = parseFloat(amount);\n    if (isNaN(solAmount) || solAmount <= 0) { setError('Invalid amount'); return; }\n\n    setLoading(true);\n    try {\n      const tx = new Transaction().add(\n        SystemProgram.transfer({\n          fromPubkey: publicKey,\n          toPubkey: recipientPk,\n          lamports: Math.round(solAmount * LAMPORTS_PER_SOL),\n        })\n      );\n\n      const sig = await sendTransaction(tx, connection);\n      await connection.confirmTransaction(sig, 'confirmed');\n      setSignature(sig);\n    } catch (e: any) {\n      if (e.message?.includes('User rejected')) setError('Transaction cancelled');\n      else if (e.message?.includes('insufficient')) setError('Insufficient funds');\n      else setError(e.message || 'Transaction failed');\n    } finally {\n      setLoading(false);\n    }\n  };\n\n  return (\n    <div>\n      <input placeholder=\"Recipient address\" value={recipient} onChange={(e) => setRecipient(e.target.value)} />\n      <input placeholder=\"Amount (SOL)\" value={amount} onChange={(e) => setAmount(e.target.value)} type=\"number\" step=\"0.01\" />\n      <button onClick={handleSend} disabled={loading}>{loading ? 'Sending...' : 'Send SOL'}</button>\n      {signature && <p>Success: {signature}</p>}\n      {error && <p>Error: {error}</p>}\n    </div>\n  );\n}",
              testCases: [
                {
                  name: "Validates recipient is a valid PublicKey",
                  input: "",
                  expectedOutput: "address validated",
                },
                {
                  name: "Builds and sends transfer transaction",
                  input: "",
                  expectedOutput: "transaction sent",
                },
                {
                  name: "Handles errors gracefully",
                  input: "",
                  expectedOutput: "errors handled",
                },
              ],
              language: "typescript",
            },
          },
          {
            id: "f-2-3",
            title: "Transaction Confirmation",
            type: "reading",
            duration: "10 min",
            xpReward: 25,
            content:
              "After sending a transaction, you need to confirm it was processed. Solana offers three commitment levels:\n\n• 'processed' — transaction has been received by the leader and included in a block, but may still be rolled back (~0.5s)\n• 'confirmed' — transaction has been confirmed by a supermajority of the cluster (~5s) — recommended for most uses\n• 'finalized' — transaction is in a rooted block, irreversible (~12s) — use for high-value operations\n\nConfirmation pattern:\n\nconst signature = await sendTransaction(transaction, connection);\n\n// Method 1: Simple confirmation\nawait connection.confirmTransaction(signature, 'confirmed');\n\n// Method 2: With timeout and blockhash strategy (recommended)\nconst { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();\nconst confirmation = await connection.confirmTransaction({\n  signature,\n  blockhash,\n  lastValidBlockHeight,\n}, 'confirmed');\n\nif (confirmation.value.err) {\n  throw new Error('Transaction failed');\n}\n\n// Method 3: Subscription-based (real-time)\nconnection.onSignature(signature, (result) => {\n  if (result.err) console.error('Failed:', result.err);\n  else console.log('Confirmed!');\n}, 'confirmed');\n\nTransaction expiry: A transaction is valid for about 150 blocks (~1-2 minutes) after its recent blockhash. If not included by then, it expires and must be rebuilt with a fresh blockhash. This is NOT the same as failure — the transaction was simply never processed.\n\nRetry strategy for dropped transactions:\n1. Send the transaction\n2. Poll getSignatureStatuses every 2 seconds\n3. If null after 30 seconds, resend with the same signature\n4. If blockhash expires, rebuild and resend\n\nNever assume a transaction succeeded without confirmation. Always confirm before updating the UI.",
          },
        ],
      },
      {
        id: "fe-3",
        title: "Token Display",
        lessons: [
          {
            id: "f-3-1",
            title: "Fetch Token Balances",
            type: "challenge",
            duration: "25 min",
            xpReward: 55,
            challenge: {
              instructions:
                "Build a React hook that fetches all SPL token balances for a connected wallet. Your hook should:\n\n1. Use getTokenAccountsByOwner to get all token accounts\n2. Parse each account to extract: mint address, balance, and decimals\n3. Return an array of token balances\n4. Refresh when the wallet changes\n\nReturn type: Array<{ mint: string, balance: number, decimals: number }>",
              starterCode:
                "import { useEffect, useState } from 'react';\nimport { useConnection, useWallet } from '@solana/wallet-adapter-react';\nimport { TOKEN_PROGRAM_ID } from '@solana/spl-token';\n\ninterface TokenBalance {\n  mint: string;\n  balance: number;\n  decimals: number;\n}\n\nexport function useTokenBalances() {\n  const { connection } = useConnection();\n  const { publicKey } = useWallet();\n  const [tokens, setTokens] = useState<TokenBalance[]>([]);\n  const [loading, setLoading] = useState(false);\n\n  useEffect(() => {\n    if (!publicKey) { setTokens([]); return; }\n    // TODO: Fetch token accounts\n    // TODO: Parse balances\n    // TODO: Set state\n  }, [publicKey, connection]);\n\n  return { tokens, loading };\n}",
              solution:
                "import { useEffect, useState } from 'react';\nimport { useConnection, useWallet } from '@solana/wallet-adapter-react';\nimport { TOKEN_PROGRAM_ID } from '@solana/spl-token';\n\ninterface TokenBalance {\n  mint: string;\n  balance: number;\n  decimals: number;\n}\n\nexport function useTokenBalances() {\n  const { connection } = useConnection();\n  const { publicKey } = useWallet();\n  const [tokens, setTokens] = useState<TokenBalance[]>([]);\n  const [loading, setLoading] = useState(false);\n\n  useEffect(() => {\n    if (!publicKey) { setTokens([]); return; }\n\n    setLoading(true);\n    connection.getParsedTokenAccountsByOwner(publicKey, { programId: TOKEN_PROGRAM_ID })\n      .then((result) => {\n        const balances: TokenBalance[] = result.value.map((item) => {\n          const parsed = item.account.data.parsed.info;\n          return {\n            mint: parsed.mint,\n            balance: parsed.tokenAmount.uiAmount ?? 0,\n            decimals: parsed.tokenAmount.decimals,\n          };\n        }).filter((t) => t.balance > 0);\n\n        setTokens(balances);\n      })\n      .catch(console.error)\n      .finally(() => setLoading(false));\n  }, [publicKey, connection]);\n\n  return { tokens, loading };\n}",
              testCases: [
                {
                  name: "Fetches token accounts for connected wallet",
                  input: "",
                  expectedOutput: "accounts fetched",
                },
                {
                  name: "Parses mint, balance, and decimals",
                  input: "",
                  expectedOutput: "data parsed",
                },
                {
                  name: "Filters out zero-balance tokens",
                  input: "",
                  expectedOutput: "filtered correctly",
                },
              ],
              language: "typescript",
            },
          },
          {
            id: "f-3-2",
            title: "NFT Gallery Component",
            type: "challenge",
            duration: "35 min",
            xpReward: 70,
            challenge: {
              instructions:
                "Build an NFT gallery component that displays a wallet's NFTs using the Helius DAS API. Your component should:\n\n1. Call the Helius DAS API (getAssetsByOwner) to fetch NFTs\n2. Display each NFT with its image, name, and collection name\n3. Show a loading skeleton while fetching\n4. Handle the empty state (no NFTs found)\n\nUse the Helius RPC endpoint with the DAS method.",
              starterCode:
                "import { useState, useEffect } from 'react';\nimport { useWallet } from '@solana/wallet-adapter-react';\n\nconst HELIUS_RPC = 'https://devnet.helius-rpc.com/?api-key=YOUR_KEY';\n\ninterface NFTAsset {\n  id: string;\n  name: string;\n  image: string;\n  collection?: string;\n}\n\nexport function NFTGallery() {\n  const { publicKey } = useWallet();\n  const [nfts, setNfts] = useState<NFTAsset[]>([]);\n  const [loading, setLoading] = useState(false);\n\n  // TODO: Fetch NFTs using DAS API\n  // TODO: Parse response into NFTAsset array\n  // TODO: Render gallery grid with loading/empty states\n\n  return <div>{/* TODO */}</div>;\n}",
              solution:
                "import { useState, useEffect } from 'react';\nimport { useWallet } from '@solana/wallet-adapter-react';\n\nconst HELIUS_RPC = 'https://devnet.helius-rpc.com/?api-key=YOUR_KEY';\n\ninterface NFTAsset {\n  id: string;\n  name: string;\n  image: string;\n  collection?: string;\n}\n\nexport function NFTGallery() {\n  const { publicKey } = useWallet();\n  const [nfts, setNfts] = useState<NFTAsset[]>([]);\n  const [loading, setLoading] = useState(false);\n\n  useEffect(() => {\n    if (!publicKey) { setNfts([]); return; }\n    setLoading(true);\n\n    fetch(HELIUS_RPC, {\n      method: 'POST',\n      headers: { 'Content-Type': 'application/json' },\n      body: JSON.stringify({\n        jsonrpc: '2.0',\n        id: 'nft-gallery',\n        method: 'getAssetsByOwner',\n        params: {\n          ownerAddress: publicKey.toBase58(),\n          page: 1,\n          limit: 50,\n          displayOptions: { showCollectionMetadata: true },\n        },\n      }),\n    })\n      .then((r) => r.json())\n      .then((data) => {\n        const assets: NFTAsset[] = (data.result?.items ?? []).map((item: any) => ({\n          id: item.id,\n          name: item.content?.metadata?.name ?? 'Unknown',\n          image: item.content?.links?.image ?? item.content?.files?.[0]?.uri ?? '',\n          collection: item.grouping?.find((g: any) => g.group_key === 'collection')?.group_value,\n        }));\n        setNfts(assets);\n      })\n      .catch(console.error)\n      .finally(() => setLoading(false));\n  }, [publicKey]);\n\n  if (loading) return <div className=\"grid grid-cols-3 gap-4\">{[1,2,3].map(i => <div key={i} className=\"h-48 bg-gray-800 animate-pulse rounded\" />)}</div>;\n  if (nfts.length === 0) return <p>No NFTs found. Connect a wallet with NFTs to see them here.</p>;\n\n  return (\n    <div className=\"grid grid-cols-3 gap-4\">\n      {nfts.map((nft) => (\n        <div key={nft.id} className=\"rounded border border-gray-700 overflow-hidden\">\n          <img src={nft.image} alt={nft.name} className=\"w-full h-48 object-cover\" />\n          <div className=\"p-3\">\n            <p className=\"font-semibold text-sm\">{nft.name}</p>\n            {nft.collection && <p className=\"text-xs text-gray-400\">{nft.collection}</p>}\n          </div>\n        </div>\n      ))}\n    </div>\n  );\n}",
              testCases: [
                {
                  name: "Calls Helius DAS getAssetsByOwner",
                  input: "",
                  expectedOutput: "API called",
                },
                {
                  name: "Renders NFT grid with images and names",
                  input: "",
                  expectedOutput: "gallery rendered",
                },
                {
                  name: "Shows loading and empty states",
                  input: "",
                  expectedOutput: "states handled",
                },
              ],
              language: "typescript",
            },
          },
          {
            id: "f-3-3",
            title: "Real-time Updates",
            type: "reading",
            duration: "15 min",
            xpReward: 30,
            content:
              "Solana provides WebSocket subscriptions for real-time state changes. Instead of polling the RPC, you can subscribe to account changes and transaction confirmations.\n\nAccount change subscription:\n\nconst subscriptionId = connection.onAccountChange(\n  accountPublicKey,\n  (accountInfo) => {\n    console.log('Account changed:', accountInfo.data);\n    // Parse the new data and update UI\n  },\n  'confirmed'\n);\n\n// Cleanup\nconnection.removeAccountChangeListener(subscriptionId);\n\nThis is perfect for watching token balances, program state, or any account data.\n\nLog subscription (events):\n\nconst logSubId = connection.onLogs(\n  programId,\n  (logs) => {\n    console.log('Program logs:', logs.logs);\n    // Parse Anchor events from logs\n  },\n  'confirmed'\n);\n\nReact pattern with useEffect cleanup:\n\nuseEffect(() => {\n  if (!publicKey) return;\n\n  const subId = connection.onAccountChange(\n    tokenAccount,\n    (info) => {\n      const parsed = AccountLayout.decode(info.data);\n      setBalance(Number(parsed.amount));\n    },\n    'confirmed'\n  );\n\n  return () => { connection.removeAccountChangeListener(subId); };\n}, [publicKey, connection]);\n\nPerformance considerations:\n• WebSocket connections are long-lived — clean up in useEffect return\n• Each subscription costs server resources — don't subscribe to hundreds of accounts\n• Use 'confirmed' commitment for subscriptions (not 'processed')\n• For high-frequency updates, debounce your state updates\n• Helius WebSocket URLs: wss://devnet.helius-rpc.com/?api-key=KEY (use ws:// prefix, not https://)\n\nFor complex use cases (indexing all program events), consider Helius Webhooks or a Geyser plugin instead of client-side subscriptions.",
          },
          {
            id: "f-3-4",
            title: "Quiz: Frontend Patterns",
            type: "quiz",
            duration: "10 min",
            xpReward: 40,
            content:
              "Test your understanding of Solana frontend development patterns.\n\n1. What hook provides the connected wallet's public key?\n   a) useConnection  b) useWallet  c) useAnchor  d) useSolana\n   Answer: b) useWallet — returns publicKey, connected, signTransaction, sendTransaction, and more.\n\n2. Why pass an empty array to WalletProvider's wallets prop?\n   a) No wallets are supported  b) Wallet Standard auto-detects installed wallets  c) It's a bug  d) Performance optimization\n   Answer: b) Wallet Standard v0.9+ auto-detects wallets via the browser's Wallet Standard interface.\n\n3. What commitment level should you typically use for transaction confirmation?\n   a) processed  b) confirmed  c) finalized  d) recent\n   Answer: b) confirmed — supermajority confirmation balances speed and safety for most operations.\n\n4. How long is a transaction valid after its recent blockhash?\n   a) 10 seconds  b) 30 seconds  c) ~1-2 minutes (150 blocks)  d) 10 minutes\n   Answer: c) ~1-2 minutes — if not included by then, you must rebuild with a fresh blockhash.\n\n5. What is the correct way to fetch all SPL token balances?\n   a) getBalance  b) getTokenAccountsByOwner  c) getParsedTokenAccountsByOwner  d) getTokenAccounts\n   Answer: c) getParsedTokenAccountsByOwner — returns pre-parsed account data including mint, balance, and decimals.",
          },
        ],
      },
    ],
    isActive: true,
    totalCompletions: 0,
    enrolledCount: 0,
  },
  {
    id: "defi-fundamentals",
    slug: "defi-fundamentals",
    title: "DeFi Fundamentals on Solana",
    description:
      "Understand AMMs, lending protocols, and yield strategies on Solana. Learn to interact with Jupiter, Raydium, and Marinade.",
    track: "defi",
    difficulty: "advanced",
    lessonCount: 8,
    duration: "4 hours",
    xpReward: 700,
    creator: "SuperteamBR",
    prerequisiteId: "anchor-dev",
    modules: [
      {
        id: "defi-1",
        title: "DeFi Primitives",
        lessons: [
          {
            id: "d-1-1",
            title: "AMMs Explained",
            type: "reading",
            duration: "15 min",
            xpReward: 30,
            content:
              "Automated Market Makers (AMMs) are the backbone of decentralized trading on Solana. Instead of matching buyers and sellers in an order book, AMMs use mathematical formulas and liquidity pools to enable instant swaps.\n\nThe constant product formula: x * y = k\nWhere x and y are the reserves of two tokens in a pool, and k is a constant. When you buy token A, you add token B to the pool and remove token A. The formula ensures the product stays constant, creating a price curve.\n\nExample: A pool has 1000 SOL and 100,000 USDC (k = 100,000,000).\nTo buy 10 SOL: new SOL reserve = 990, required USDC = 100,000,000 / 990 = 101,010.10\nCost = 101,010.10 - 100,000 = 1,010.10 USDC for 10 SOL = 101.01 USDC/SOL\nThe spot price was 100 USDC/SOL but you paid more due to price impact.\n\nSlippage: The difference between expected and actual execution price. Larger trades relative to pool size cause more slippage. This is why deep liquidity matters.\n\nConcentrated Liquidity (CLMM): Protocols like Orca Whirlpools let LPs concentrate their capital in specific price ranges. This provides deeper liquidity where it matters most, reducing slippage for traders while improving capital efficiency for LPs.\n\nSolana AMMs:\n• Orca — concentrated liquidity (Whirlpools), cleanest UX\n• Raydium — hybrid AMM + order book (OpenBook integration)\n• Meteora — dynamic fee pools, DLMM for stable pairs\n• Jupiter — aggregator that routes across all AMMs for best price\n\nWhy Solana for DeFi: Sub-second finality means trades confirm instantly. Low fees ($0.00025) make small trades viable. Parallel execution enables complex multi-hop swaps in single transactions.",
          },
          {
            id: "d-1-2",
            title: "Liquidity Pools",
            type: "reading",
            duration: "15 min",
            xpReward: 30,
            content:
              "Liquidity pools are token reserves that enable trading on AMMs. Anyone can deposit tokens into a pool and earn fees from every swap.\n\nHow it works:\n1. A liquidity provider (LP) deposits equal value of two tokens (e.g., 10 SOL + 1,000 USDC)\n2. They receive LP tokens representing their share of the pool\n3. Every swap pays a fee (typically 0.25-0.30%) that goes to the pool\n4. LPs can withdraw their share at any time by burning LP tokens\n\nImpermanent Loss (IL):\nThe biggest risk for LPs. When the price ratio of pooled tokens changes, LPs end up with less value than if they had simply held the tokens. Called 'impermanent' because it reverses if prices return to the original ratio.\n\nExample: You deposit 1 SOL ($100) + 100 USDC. SOL doubles to $200.\n• If you held: 1 SOL ($200) + 100 USDC = $300\n• In the pool: ~0.707 SOL ($141.42) + ~141.42 USDC = $282.84\n• IL = $300 - $282.84 = $17.16 (5.7% loss)\n\nThe pool rebalances because arbitrageurs buy the cheaper SOL from your pool until the price matches external markets. Your pool fee earnings must exceed IL to be profitable.\n\nConcentrated liquidity reduces IL risk by limiting your range. If you provide liquidity for SOL/USDC only between $80-$120, you earn more fees in that range but get 100% IL if price moves outside it.\n\nKey metrics for evaluating pools:\n• TVL (Total Value Locked) — deeper pools = less slippage\n• Volume/TVL ratio — higher = more fees relative to capital\n• Fee APR — annualized fee earnings (not including IL)\n• IL risk — higher for volatile pairs, lower for correlated assets (e.g., mSOL/SOL)",
          },
          {
            id: "d-1-3",
            title: "Swap via Jupiter",
            type: "challenge",
            duration: "30 min",
            xpReward: 65,
            challenge: {
              instructions:
                "Build a token swap function using the Jupiter Ultra API. Your code should:\n\n1. Get a swap order from the Jupiter Ultra API\n2. Parse the response to get the output amount and transaction\n3. Deserialize and sign the transaction\n4. Log the input/output amounts\n\nUse the Jupiter Ultra API v1:\n- Order: GET https://lite.jup.ag/ultra/v1/order\n- Execute: POST https://lite.jup.ag/ultra/v1/execute",
              starterCode:
                "import { PublicKey } from '@solana/web3.js';\n\nconst SOL_MINT = 'So11111111111111111111111111111111111111112';\nconst USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';\n\nasync function getSwapOrder(inputMint: string, outputMint: string, amount: number, taker: string) {\n  // TODO: Call Jupiter Ultra API (GET /ultra/v1/order)\n  // TODO: Parse and return the order with transaction\n}\n\nasync function executeOrder(signedTransaction: string, requestId: string) {\n  // TODO: Call Jupiter Ultra Execute API (POST /ultra/v1/execute)\n  // TODO: Return the transaction signature\n}\n\n// Get a swap order for 0.1 SOL to USDC\ngetSwapOrder(SOL_MINT, USDC_MINT, 100_000_000, 'YOUR_WALLET').then(console.log);",
              solution:
                "import { PublicKey } from '@solana/web3.js';\n\nconst SOL_MINT = 'So11111111111111111111111111111111111111112';\nconst USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';\n\nasync function getSwapOrder(inputMint: string, outputMint: string, amount: number, taker: string) {\n  const params = new URLSearchParams({\n    inputMint,\n    outputMint,\n    amount: amount.toString(),\n    taker,\n  });\n\n  const response = await fetch(`https://lite.jup.ag/ultra/v1/order?${params}`);\n  const order = await response.json();\n\n  console.log('Input:', order.inAmount, 'Output:', order.outAmount);\n  console.log('Transaction ready:', !!order.transaction);\n  console.log('Request ID:', order.requestId);\n\n  return order;\n}\n\nasync function executeOrder(signedTransaction: string, requestId: string) {\n  const response = await fetch('https://lite.jup.ag/ultra/v1/execute', {\n    method: 'POST',\n    headers: { 'Content-Type': 'application/json' },\n    body: JSON.stringify({\n      signedTransaction,\n      requestId,\n    }),\n  });\n\n  const result = await response.json();\n  console.log('Transaction signature:', result.signature);\n  return result.signature;\n}\n\ngetSwapOrder(SOL_MINT, USDC_MINT, 100_000_000, 'YOUR_WALLET').then(console.log);",
              testCases: [
                {
                  name: "Fetches order from Jupiter Ultra API",
                  input: "",
                  expectedOutput: "order received",
                },
                {
                  name: "Parses input/output amounts from response",
                  input: "",
                  expectedOutput: "amounts parsed",
                },
                {
                  name: "Executes order with signed transaction",
                  input: "",
                  expectedOutput: "swap executed",
                },
              ],
              language: "typescript",
            },
          },
        ],
      },
      {
        id: "defi-2",
        title: "Lending & Borrowing",
        lessons: [
          {
            id: "d-2-1",
            title: "How Lending Works",
            type: "reading",
            duration: "12 min",
            xpReward: 25,
            content:
              "DeFi lending protocols enable permissionless borrowing and lending of crypto assets. On Solana, protocols like Marginfi, Kamino, and Solend allow users to deposit collateral and borrow against it.\n\nThe lending loop:\n1. Lender deposits USDC into a lending pool → receives interest-bearing receipt tokens\n2. Borrower deposits SOL as collateral → borrows USDC from the pool\n3. Borrower pays interest on the USDC loan → interest goes to lenders\n4. If SOL price drops, the collateral is liquidated to repay lenders\n\nKey concepts:\n\nCollateral Factor: The percentage of collateral value you can borrow. If SOL has a 75% collateral factor and you deposit $100 of SOL, you can borrow up to $75.\n\nLoan-to-Value (LTV): Your current borrowed amount / collateral value. If LTV exceeds the liquidation threshold, your collateral is liquidated.\n\nLiquidation: When a position becomes undercollateralized, liquidators repay part of the debt and receive discounted collateral. This protects lenders from bad debt. Liquidation typically triggers at 80-85% LTV.\n\nUtilization Rate: borrowed / deposited. Higher utilization means more demand for borrowing, which drives interest rates up (incentivizing deposits and discouraging new borrows).\n\nOracle dependency: Lending protocols rely on price oracles (Pyth, Switchboard) for real-time asset prices. Oracle manipulation is a major attack vector — protocols use time-weighted average prices (TWAP) and multiple oracle sources for safety.\n\nSolana lending protocols:\n• Marginfi — risk-isolated pools, cleanest interface\n• Kamino — DeFi automation (lending + concentrated liquidity)\n• Solend — longest-running Solana lending protocol",
          },
          {
            id: "d-2-2",
            title: "Interest Rate Models",
            type: "reading",
            duration: "15 min",
            xpReward: 30,
            content:
              "Interest rate models determine how much borrowers pay and lenders earn. Most Solana lending protocols use a dual-slope (kinked) interest rate model.\n\nDual-slope model:\nBelow optimal utilization (e.g., 80%): Interest rate increases linearly with utilization at a gentle slope.\nAbove optimal utilization: Interest rate increases steeply, creating strong incentive to deposit more or repay loans.\n\nFormula:\nIf utilization <= optimal:\n  rate = base_rate + (utilization / optimal) * slope1\n\nIf utilization > optimal:\n  rate = base_rate + slope1 + ((utilization - optimal) / (1 - optimal)) * slope2\n\nTypical parameters:\n• Base rate: 0-2% APR\n• Optimal utilization: 80%\n• Slope 1: 4% (gentle, below optimal)\n• Slope 2: 200% (steep, above optimal)\n\nAt 50% utilization: ~2.5% borrow APR\nAt 80% utilization: ~6% borrow APR\nAt 95% utilization: ~75% borrow APR\n\nThe steep slope above optimal is critical — it prevents pools from being fully utilized (which would prevent lenders from withdrawing).\n\nSupply APY vs Borrow APR:\nSupply APY = Borrow APR * utilization * (1 - protocol_fee)\n\nIf borrowers pay 6% APR, utilization is 80%, and protocol takes 10%:\nSupply APY = 6% * 0.8 * 0.9 = 4.32%\n\nThis spread is how lending protocols earn revenue. Some protocols redistribute protocol fees to token stakers (e.g., Marginfi's MRGN token).\n\nCompounding: Interest accrues per slot (~400ms). The effective annual rate (APY) is higher than the stated APR due to compounding. APY = (1 + APR/slots_per_year)^slots_per_year - 1.",
          },
          {
            id: "d-2-3",
            title: "Build a Simple Vault",
            type: "challenge",
            duration: "40 min",
            xpReward: 80,
            challenge: {
              instructions:
                "Build a simple vault program in Anchor that allows users to deposit and withdraw SOL. The vault should:\n\n1. Initialize a vault PDA that holds deposited SOL\n2. Allow users to deposit SOL with a 'deposit' instruction\n3. Allow users to withdraw SOL with a 'withdraw' instruction (only their share)\n4. Track each user's deposit in a DepositRecord PDA\n\nUse CPI to SystemProgram for transfers. The vault PDA signs via invoke_signed for withdrawals.",
              starterCode:
                'use anchor_lang::prelude::*;\nuse anchor_lang::system_program;\n\ndeclare_id!("11111111111111111111111111111111");\n\n#[program]\npub mod simple_vault {\n    use super::*;\n\n    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {\n        // TODO: Initialize vault state\n        Ok(())\n    }\n\n    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {\n        // TODO: Transfer SOL from user to vault\n        // TODO: Update deposit record\n        Ok(())\n    }\n\n    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {\n        // TODO: Verify user has enough deposited\n        // TODO: Transfer SOL from vault to user (PDA signer)\n        // TODO: Update deposit record\n        Ok(())\n    }\n}\n\n// TODO: Define account structs and contexts',
              solution:
                'use anchor_lang::prelude::*;\nuse anchor_lang::system_program;\n\ndeclare_id!("11111111111111111111111111111111");\n\n#[program]\npub mod simple_vault {\n    use super::*;\n\n    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {\n        let vault = &mut ctx.accounts.vault;\n        vault.authority = ctx.accounts.authority.key();\n        vault.total_deposits = 0;\n        vault.bump = ctx.bumps.vault;\n        Ok(())\n    }\n\n    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {\n        system_program::transfer(\n            CpiContext::new(\n                ctx.accounts.system_program.to_account_info(),\n                system_program::Transfer {\n                    from: ctx.accounts.user.to_account_info(),\n                    to: ctx.accounts.vault.to_account_info(),\n                },\n            ),\n            amount,\n        )?;\n\n        let record = &mut ctx.accounts.deposit_record;\n        record.user = ctx.accounts.user.key();\n        record.amount = record.amount.checked_add(amount).unwrap();\n\n        let vault = &mut ctx.accounts.vault;\n        vault.total_deposits = vault.total_deposits.checked_add(amount).unwrap();\n        Ok(())\n    }\n\n    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {\n        let record = &mut ctx.accounts.deposit_record;\n        require!(record.amount >= amount, VaultError::InsufficientBalance);\n\n        let vault = &mut ctx.accounts.vault;\n        let bump = vault.bump;\n        let seeds = &[b"vault".as_ref(), &[bump]];\n\n        **vault.to_account_info().try_borrow_mut_lamports()? -= amount;\n        **ctx.accounts.user.to_account_info().try_borrow_mut_lamports()? += amount;\n\n        record.amount = record.amount.checked_sub(amount).unwrap();\n        vault.total_deposits = vault.total_deposits.checked_sub(amount).unwrap();\n        Ok(())\n    }\n}\n\n#[derive(Accounts)]\npub struct Initialize<\'info> {\n    #[account(init, payer = authority, space = 8 + 32 + 8 + 1, seeds = [b"vault"], bump)]\n    pub vault: Account<\'info, Vault>,\n    #[account(mut)]\n    pub authority: Signer<\'info>,\n    pub system_program: Program<\'info, System>,\n}\n\n#[derive(Accounts)]\npub struct Deposit<\'info> {\n    #[account(mut, seeds = [b"vault"], bump = vault.bump)]\n    pub vault: Account<\'info, Vault>,\n    #[account(init_if_needed, payer = user, space = 8 + 32 + 8, seeds = [b"deposit", user.key().as_ref()], bump)]\n    pub deposit_record: Account<\'info, DepositRecord>,\n    #[account(mut)]\n    pub user: Signer<\'info>,\n    pub system_program: Program<\'info, System>,\n}\n\n#[derive(Accounts)]\npub struct Withdraw<\'info> {\n    #[account(mut, seeds = [b"vault"], bump = vault.bump)]\n    pub vault: Account<\'info, Vault>,\n    #[account(mut, seeds = [b"deposit", user.key().as_ref()], bump, has_one = user)]\n    pub deposit_record: Account<\'info, DepositRecord>,\n    #[account(mut)]\n    pub user: Signer<\'info>,\n}\n\n#[account]\npub struct Vault { pub authority: Pubkey, pub total_deposits: u64, pub bump: u8 }\n#[account]\npub struct DepositRecord { pub user: Pubkey, pub amount: u64 }\n\n#[error_code]\npub enum VaultError {\n    #[msg("Insufficient balance")]\n    InsufficientBalance,\n}',
              testCases: [
                {
                  name: "Initializes vault PDA",
                  input: "",
                  expectedOutput: "vault created",
                },
                {
                  name: "Deposits SOL and tracks amount",
                  input: "",
                  expectedOutput: "deposit recorded",
                },
                {
                  name: "Withdraws SOL with balance check",
                  input: "",
                  expectedOutput: "withdrawal successful",
                },
                {
                  name: "Rejects withdrawal exceeding deposit",
                  input: "",
                  expectedOutput: "insufficient balance error",
                },
              ],
              language: "rust",
            },
          },
        ],
      },
      {
        id: "defi-3",
        title: "Yield Strategies",
        lessons: [
          {
            id: "d-3-1",
            title: "Staking & LSTs",
            type: "reading",
            duration: "15 min",
            xpReward: 30,
            content:
              "Staking is the foundation of Solana's Proof of Stake consensus. By staking SOL with a validator, you earn ~6-8% APY in staking rewards while securing the network.\n\nNative staking:\n• Create a stake account with SOL\n• Delegate to a validator of your choice\n• Earn rewards every epoch (~2 days)\n• Unstaking requires a cooldown period (~2-3 days)\n\nLiquid Staking Tokens (LSTs) solve the liquidity problem. Instead of locking SOL in a stake account, you deposit SOL into a liquid staking protocol and receive a token representing your staked position.\n\nMajor Solana LSTs:\n• mSOL (Marinade) — the original Solana LST, distributed across 450+ validators\n• jitoSOL (Jito) — includes MEV rewards, often higher yield\n• bSOL (BlazeStake) — community-driven, supports smaller validators\n• INF (Sanctum Infinity) — the LST of LSTs, backed by a pool of all LSTs\n\nLST mechanics:\nmSOL is a rebasing token — its price in SOL increases over time as staking rewards accrue. If you buy 1 mSOL at 1.05 SOL, and the rate increases to 1.06 SOL, your mSOL is now worth 1.06 SOL — a ~0.95% gain.\n\nLST-SOL pools:\nLSTs trade against SOL in concentrated liquidity pools (e.g., mSOL/SOL on Orca). The tight correlation means very low impermanent loss. These pools earn:\n• Swap fees from mSOL↔SOL trades\n• Staking yield from the mSOL side\n• Sometimes additional token incentives\n\nYield strategies:\n• Basic: Hold mSOL → ~7% APY from staking\n• Loop: Deposit mSOL as collateral → borrow SOL → stake for more mSOL → repeat (leveraged staking, 2-3x yield)\n• LP: mSOL/SOL concentrated pool → staking yield + swap fees (~10-15% APY)\n• JLP: Jupiter Liquidity Pool → earn from perps trading fees (~20-40% APY, higher risk)\n\nRisks: Smart contract risk, slashing risk (theoretical on Solana), depeg risk (LST trading below fair value), oracle risk for leveraged positions.",
          },
          {
            id: "d-3-2",
            title: "Quiz: DeFi Mastery",
            type: "quiz",
            duration: "10 min",
            xpReward: 40,
            content:
              "Test your understanding of DeFi concepts on Solana.\n\n1. What formula do constant-product AMMs use?\n   a) x + y = k  b) x * y = k  c) x ^ y = k  d) x / y = k\n   Answer: b) x * y = k — the constant product formula ensures the product of reserves remains constant after every swap.\n\n2. What happens when a borrower's LTV exceeds the liquidation threshold?\n   a) Their position is automatically closed  b) They receive a warning  c) Liquidators repay debt and take discounted collateral  d) Interest rate doubles\n   Answer: c) Liquidators repay debt and take discounted collateral — this incentivizes liquidators to maintain protocol solvency.\n\n3. What is impermanent loss?\n   a) Loss from protocol hacks  b) Reduced value vs holding tokens separately when prices diverge  c) Transaction fees  d) Slippage costs\n   Answer: b) Reduced value vs holding — LPs lose value when pool token prices diverge from the ratio at deposit time.\n\n4. Why does the interest rate spike above 80% utilization in the dual-slope model?\n   a) Protocol is greedy  b) To prevent full utilization and ensure lenders can withdraw  c) Bug in the code  d) Regulatory requirement\n   Answer: b) To prevent full utilization — if all funds are borrowed, lenders cannot withdraw, so high rates incentivize repayment.\n\n5. What advantage do Liquid Staking Tokens provide over native staking?\n   a) Higher yield  b) Liquidity — use staked SOL in DeFi while earning staking rewards  c) Lower risk  d) No fees\n   Answer: b) Liquidity — LSTs let you use your staked position as collateral, in LPs, or trade it without waiting for unstaking cooldown.",
          },
        ],
      },
    ],
    isActive: true,
    totalCompletions: 0,
    enrolledCount: 0,
  },
  {
    id: "solana-security",
    slug: "solana-security",
    title: "Solana Security Essentials",
    description:
      "Learn to audit Solana programs. Understand common vulnerabilities, attack vectors, and how to write secure on-chain code.",
    track: "security",
    difficulty: "advanced",
    lessonCount: 10,
    duration: "5 hours",
    xpReward: 900,
    creator: "SuperteamBR",
    prerequisiteId: "anchor-dev",
    modules: [
      {
        id: "sec-1",
        title: "Common Vulnerabilities",
        lessons: [
          {
            id: "s-1-1",
            title: "Account Validation Attacks",
            type: "reading",
            duration: "15 min",
            xpReward: 35,
            content:
              "Account validation is the most critical security concern in Solana programs. Since all accounts are passed as inputs to instructions, an attacker can substitute malicious accounts if your program doesn't validate them.\n\nAttack 1: Missing owner check\nVulnerable code:\nlet data = AccountData::try_from_slice(&account.data.borrow())?;\n// Uses data without checking who owns the account!\n\nAttack: Create an account with the same data layout but owned by a different program. Your program reads the fake data as legitimate.\n\nFix: Always verify account.owner == expected_program_id. Anchor's Account<'info, T> type does this automatically.\n\nAttack 2: Account substitution\nVulnerable code (vault withdrawal):\npub struct Withdraw<'info> {\n    pub vault: Account<'info, Vault>,\n    pub user_record: Account<'info, UserRecord>,  // Missing has_one!\n    pub user: Signer<'info>,\n}\n\nAttack: Pass someone else's UserRecord with a larger balance. Your program authorizes a larger withdrawal.\n\nFix: Add has_one = user or constraint = user_record.user == user.key().\n\nAttack 3: Fake program ID\nVulnerable CPI:\ninvoke(&instruction, &accounts)?; // Never checked which program we're calling!\n\nAttack: Pass a malicious program that mimics the expected one. It could steal tokens or manipulate state.\n\nFix: Use Anchor's Program<'info, T> type or manually verify: require_keys_eq!(token_program.key(), spl_token::ID).\n\nAttack 4: PDA seed manipulation\nVulnerable:\nseeds = [b\"vault\", &user_input] // User controls the seed!\n\nAttack: Craft input to derive a PDA that points to a different vault.\n\nFix: Use deterministic, non-user-controlled seeds: seeds = [b\"vault\", user.key().as_ref()]. Validate the PDA matches the expected derivation.\n\nAnchor protects against most of these by default — use typed accounts, constraints, and has_one checks everywhere.",
          },
          {
            id: "s-1-2",
            title: "Signer Authorization",
            type: "reading",
            duration: "12 min",
            xpReward: 30,
            content:
              "Signer authorization ensures that only authorized parties can perform privileged operations. Missing signer checks are the simplest and most devastating vulnerability.\n\nVulnerability: Missing signer check\n\npub struct AdminAction<'info> {\n    pub config: Account<'info, Config>,\n    /// CHECK: should be the admin but we don't check!\n    pub admin: AccountInfo<'info>,  // NOT a Signer!\n}\n\nAttack: Anyone can pass the admin's public key as the admin account without actually signing. The program processes the instruction as if the admin authorized it.\n\nFix: Use Signer<'info>:\npub admin: Signer<'info>,\n\nMulti-level authorization patterns:\n\n1. Owner-only: Simple ownership check\n   has_one = authority — checks that the account's stored authority matches the signer.\n\n2. Delegated authority: Backend signer pattern\n   pub struct CompletLesson<'info> {\n       pub learner: Account<'info, LearnerProfile>,\n       pub backend_signer: Signer<'info>,  // Server signs\n       pub config: Account<'info, Config>,\n   }\n   Constraint: require_keys_eq!(config.backend_signer, backend_signer.key())\n   This lets a trusted backend authorize actions without exposing the user's wallet.\n\n3. Multisig: Squads V4 integration\n   The authority is a Squads multisig. Transactions require M-of-N signers. Used for platform-level operations (creating courses, updating config).\n\nCommon mistakes:\n• Checking is_signer on the wrong account\n• Using AccountInfo instead of Signer (AccountInfo doesn't enforce signing)\n• Forgetting that PDA accounts can never be signers in the traditional sense — they sign via invoke_signed\n• Not distinguishing between payer and authority — the account paying for rent is not necessarily the admin",
          },
          {
            id: "s-1-3",
            title: "Arithmetic Overflows",
            type: "challenge",
            duration: "25 min",
            xpReward: 60,
            challenge: {
              instructions:
                "Find and fix arithmetic overflow vulnerabilities in this token staking program. The code has three bugs:\n\n1. An unchecked multiplication that can overflow\n2. An unchecked addition that can wrap around\n3. A division-before-multiplication precision loss\n\nFix all three bugs using checked arithmetic and proper ordering.",
              starterCode:
                "use anchor_lang::prelude::*;\n\n// VULNERABLE: Find and fix 3 arithmetic bugs\n\npub fn calculate_rewards(staked: u64, rate_bps: u64, duration_secs: u64) -> Result<u64> {\n    // Bug 1: multiplication can overflow\n    let reward = staked * rate_bps * duration_secs / 10_000 / 86_400;\n    Ok(reward)\n}\n\npub fn add_to_pool(pool_total: u64, deposit: u64) -> Result<u64> {\n    // Bug 2: addition can wrap around\n    let new_total = pool_total + deposit;\n    Ok(new_total)\n}\n\npub fn calculate_share(user_deposit: u64, total_deposits: u64, reward_pool: u64) -> Result<u64> {\n    // Bug 3: division before multiplication loses precision\n    let share = user_deposit / total_deposits * reward_pool;\n    Ok(share)\n}\n\n// Write fixed versions of all three functions",
              solution:
                'use anchor_lang::prelude::*;\n\npub fn calculate_rewards(staked: u64, rate_bps: u64, duration_secs: u64) -> Result<u64> {\n    // Fix 1: Use checked arithmetic and u128 for intermediate calculation\n    let numerator = (staked as u128)\n        .checked_mul(rate_bps as u128)\n        .ok_or(error!(ErrorCode::Overflow))?\n        .checked_mul(duration_secs as u128)\n        .ok_or(error!(ErrorCode::Overflow))?;\n    let denominator: u128 = 10_000 * 86_400;\n    let reward = numerator\n        .checked_div(denominator)\n        .ok_or(error!(ErrorCode::Overflow))?;\n    Ok(u64::try_from(reward).map_err(|_| error!(ErrorCode::Overflow))?)\n}\n\npub fn add_to_pool(pool_total: u64, deposit: u64) -> Result<u64> {\n    // Fix 2: Use checked_add\n    pool_total.checked_add(deposit).ok_or_else(|| error!(ErrorCode::Overflow))\n}\n\npub fn calculate_share(user_deposit: u64, total_deposits: u64, reward_pool: u64) -> Result<u64> {\n    // Fix 3: Multiply first (in u128), then divide — prevents precision loss\n    require!(total_deposits > 0, ErrorCode::DivisionByZero);\n    let share = (user_deposit as u128)\n        .checked_mul(reward_pool as u128)\n        .ok_or(error!(ErrorCode::Overflow))?\n        .checked_div(total_deposits as u128)\n        .ok_or(error!(ErrorCode::Overflow))?;\n    Ok(u64::try_from(share).map_err(|_| error!(ErrorCode::Overflow))?)\n}\n\n#[error_code]\npub enum ErrorCode {\n    #[msg("Arithmetic overflow")]\n    Overflow,\n    #[msg("Division by zero")]\n    DivisionByZero,\n}',
              testCases: [
                {
                  name: "Uses u128 intermediate for multiplication overflow",
                  input: "",
                  expectedOutput: "overflow prevented",
                },
                {
                  name: "Uses checked_add for pool total",
                  input: "",
                  expectedOutput: "addition safe",
                },
                {
                  name: "Multiplies before dividing to preserve precision",
                  input: "",
                  expectedOutput: "precision preserved",
                },
              ],
              language: "rust",
            },
          },
        ],
      },
      {
        id: "sec-2",
        title: "Advanced Attacks",
        lessons: [
          {
            id: "s-2-1",
            title: "Reentrancy in Solana",
            type: "reading",
            duration: "15 min",
            xpReward: 35,
            content:
              "Reentrancy on Solana is different from Ethereum, but still possible through CPIs. While Solana prevents a program from calling itself recursively (direct reentrancy), cross-program reentrancy remains a risk.\n\nHow cross-program reentrancy works:\n1. Your program invokes Program B via CPI\n2. Program B calls back into your program via another CPI\n3. Your program's state from step 1 hasn't been committed yet\n4. The reentrant call reads stale state\n\nExample attack on a lending protocol:\n1. User calls 'withdraw' on LendingProgram\n2. LendingProgram transfers tokens via CPI to TokenProgram\n3. TokenProgram has a transfer hook that calls LendingProgram.withdraw again\n4. Second withdraw reads the pre-withdrawal balance (stale!) and withdraws again\n\nSolana's runtime protections:\n• A program cannot call itself directly (no recursive CPI)\n• Account locking: if Program A has a mutable borrow on an account, Program B cannot also mutably borrow it\n• But: if the accounts in step 2 and step 4 are different, the lock doesn't help\n\nPrevention strategies:\n\n1. Checks-Effects-Interactions pattern (same as Ethereum)\n   - Check preconditions\n   - Update state (effects)\n   - Then make CPIs (interactions)\n   Always update balances BEFORE sending tokens.\n\n2. Reentrancy guards:\n   pub is_processing: bool,  // Set to true during critical sections\n   require!(!vault.is_processing, Error::Reentrancy);\n   vault.is_processing = true;\n   // ... CPIs ...\n   vault.is_processing = false;\n\n3. Reload after CPI:\n   ctx.accounts.vault.reload()?;\n   Always re-read account data after any CPI that might modify it.\n\nToken-2022 transfer hooks make this particularly relevant — any token transfer could trigger arbitrary program execution.",
          },
          {
            id: "s-2-2",
            title: "PDA Seed Collisions",
            type: "reading",
            duration: "12 min",
            xpReward: 30,
            content:
              "PDA seed collisions occur when different logical entities derive the same PDA address. This can lead to data corruption or unauthorized access.\n\nVulnerable pattern:\nseeds = [user.key().as_ref(), name.as_bytes()]\n\nAttack: If 'name' is user-controlled, an attacker could craft a name that, when concatenated with their public key bytes, matches a seed sequence that maps to another user's PDA.\n\nWhy this happens: Seeds are concatenated as raw bytes. If seed boundaries aren't clear, different combinations can produce the same byte sequence.\n\nExample:\nUser A seeds: [0x01, 0x02] + [0x03, 0x04]\nUser B seeds: [0x01] + [0x02, 0x03, 0x04]\nBoth concatenate to: [0x01, 0x02, 0x03, 0x04]\n\nPrevention strategies:\n\n1. Use fixed-size seeds:\n   seeds = [b\"profile\", user.key().as_ref()]\n   PublicKey is always 32 bytes — no ambiguity.\n\n2. Add a discriminator prefix:\n   seeds = [b\"enrollment\", course_id.as_bytes(), user.key().as_ref()]\n   The b\"enrollment\" prefix namespaces the PDA.\n\n3. Length-prefix variable-size seeds:\n   let name_bytes = name.as_bytes();\n   let name_len = (name_bytes.len() as u16).to_le_bytes();\n   seeds = [b\"profile\", &name_len, name_bytes]\n\n4. Validate seed inputs:\n   require!(name.len() <= 32, Error::NameTooLong);\n   require!(!name.contains('\\0'), Error::InvalidCharacter);\n\n5. Use separate PDA spaces:\n   Different instruction types should use different seed prefixes. Never reuse seed patterns across unrelated account types.\n\nAnchor's seeds constraint validates the derived address matches the account — but it doesn't prevent seed collisions from your own design. The seed schema is your responsibility.",
          },
          {
            id: "s-2-3",
            title: "Find the Bug Challenge",
            type: "challenge",
            duration: "35 min",
            xpReward: 80,
            challenge: {
              instructions:
                "This token vault program has 5 security vulnerabilities. Find and fix all of them.\n\nVulnerabilities to find:\n1. Missing signer check\n2. Missing owner validation\n3. Unchecked arithmetic\n4. State update after CPI (reentrancy risk)\n5. Missing PDA validation\n\nAdd comments explaining each vulnerability and its fix.",
              starterCode:
                "use anchor_lang::prelude::*;\n\ndeclare_id!(\"11111111111111111111111111111111\");\n\n#[program]\npub mod vulnerable_vault {\n    use super::*;\n\n    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {\n        let vault = &mut ctx.accounts.vault;\n\n        // Transfer tokens first\n        anchor_spl::token::transfer(\n            CpiContext::new(\n                ctx.accounts.token_program.to_account_info(),\n                anchor_spl::token::Transfer {\n                    from: ctx.accounts.vault_token.to_account_info(),\n                    to: ctx.accounts.user_token.to_account_info(),\n                    authority: ctx.accounts.vault.to_account_info(),\n                },\n            ),\n            amount,\n        )?;\n\n        // Update state after transfer\n        vault.total_deposits = vault.total_deposits - amount;\n\n        Ok(())\n    }\n}\n\n#[derive(Accounts)]\npub struct Withdraw<'info> {\n    #[account(mut)]\n    pub vault: Account<'info, Vault>,\n    /// CHECK: user account\n    pub admin: AccountInfo<'info>,\n    #[account(mut)]\n    pub vault_token: AccountInfo<'info>,\n    #[account(mut)]\n    pub user_token: AccountInfo<'info>,\n    pub token_program: AccountInfo<'info>,\n}\n\n#[account]\npub struct Vault {\n    pub authority: Pubkey,\n    pub total_deposits: u64,\n}",
              solution:
                'use anchor_lang::prelude::*;\nuse anchor_spl::token::{Token, TokenAccount};\n\ndeclare_id!("11111111111111111111111111111111");\n\n#[program]\npub mod secure_vault {\n    use super::*;\n\n    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {\n        let vault = &mut ctx.accounts.vault;\n\n        // FIX 3: Checked arithmetic (was: unchecked subtraction)\n        // FIX 4: Update state BEFORE CPI (was: after transfer = reentrancy risk)\n        vault.total_deposits = vault.total_deposits\n            .checked_sub(amount)\n            .ok_or(VaultError::InsufficientFunds)?;\n\n        // Transfer tokens after state update\n        let bump = vault.bump;\n        let seeds = &[b"vault".as_ref(), &[bump]];\n        let signer_seeds = &[&seeds[..]];\n\n        anchor_spl::token::transfer(\n            CpiContext::new_with_signer(\n                ctx.accounts.token_program.to_account_info(),\n                anchor_spl::token::Transfer {\n                    from: ctx.accounts.vault_token.to_account_info(),\n                    to: ctx.accounts.user_token.to_account_info(),\n                    authority: ctx.accounts.vault.to_account_info(),\n                },\n                signer_seeds,\n            ),\n            amount,\n        )?;\n\n        Ok(())\n    }\n}\n\n#[derive(Accounts)]\npub struct Withdraw<\'info> {\n    // FIX 5: Added PDA validation with seeds and bump\n    #[account(mut, seeds = [b"vault"], bump = vault.bump)]\n    pub vault: Account<\'info, Vault>,\n    // FIX 1: Changed from AccountInfo to Signer (was: missing signer check)\n    // FIX 1b: Added has_one to verify admin matches vault.authority\n    #[account(constraint = admin.key() == vault.authority @ VaultError::Unauthorized)]\n    pub admin: Signer<\'info>,\n    // FIX 2: Changed from AccountInfo to typed TokenAccount (was: missing owner validation)\n    #[account(mut, token::authority = vault)]\n    pub vault_token: Account<\'info, TokenAccount>,\n    #[account(mut)]\n    pub user_token: Account<\'info, TokenAccount>,\n    // FIX 2b: Changed to typed Program (was: AccountInfo, no program ID check)\n    pub token_program: Program<\'info, Token>,\n}\n\n#[account]\npub struct Vault {\n    pub authority: Pubkey,\n    pub total_deposits: u64,\n    pub bump: u8,\n}\n\n#[error_code]\npub enum VaultError {\n    #[msg("Unauthorized")]\n    Unauthorized,\n    #[msg("Insufficient funds")]\n    InsufficientFunds,\n}',
              testCases: [
                {
                  name: "Adds Signer type for admin authorization",
                  input: "",
                  expectedOutput: "signer check added",
                },
                {
                  name: "Uses typed TokenAccount for owner validation",
                  input: "",
                  expectedOutput: "owner validated",
                },
                {
                  name: "Moves state update before CPI",
                  input: "",
                  expectedOutput: "reentrancy fixed",
                },
                {
                  name: "Adds PDA seeds validation",
                  input: "",
                  expectedOutput: "PDA validated",
                },
                {
                  name: "Uses checked arithmetic",
                  input: "",
                  expectedOutput: "arithmetic safe",
                },
              ],
              language: "rust",
            },
          },
        ],
      },
      {
        id: "sec-3",
        title: "Auditing",
        lessons: [
          {
            id: "s-3-1",
            title: "Audit Methodology",
            type: "reading",
            duration: "15 min",
            xpReward: 35,
            content:
              "A systematic security audit of a Solana program follows a structured methodology. Whether you're auditing your own code or reviewing others', this process catches vulnerabilities that code review alone misses.\n\nPhase 1: Understanding (30% of audit time)\n• Read documentation, specifications, and architecture docs\n• Map all accounts, their relationships, and ownership rules\n• List all instructions and their authorization requirements\n• Identify external dependencies (CPIs, oracles, token programs)\n• Draw data flow diagrams for critical paths (deposits, withdrawals, state transitions)\n\nPhase 2: Access Control Review\n• For every instruction: who can call it? Verify signer checks.\n• For every account modification: who is authorized? Verify has_one / constraint.\n• Map the trust model: which accounts are trusted? Which are user-controlled?\n• Check PDA derivations: are seeds deterministic? Any collision risks?\n\nPhase 3: State Machine Analysis\n• List all possible states an account can be in\n• Verify all state transitions are valid (no skipping states)\n• Check for initialization safety (can accounts be reinitialized?)\n• Verify close/cleanup logic (can closed accounts be resurrected?)\n\nPhase 4: Arithmetic Review\n• Check every arithmetic operation for overflow/underflow\n• Verify division ordering (multiply before divide)\n• Check for precision loss in fee/reward calculations\n• Verify rounding direction favors the protocol (not the user)\n\nPhase 5: CPI Safety\n• Verify every CPI target program ID\n• Check for reentrancy vectors\n• Verify accounts are reloaded after CPIs that modify them\n• Check that PDA signers use correct seeds\n\nPhase 6: Economic Analysis\n• Can users extract more value than they deposit?\n• Are there flash loan attack vectors?\n• Can oracle manipulation affect the protocol?\n• Are there race conditions in multi-step operations?\n\nDeliverables: Categorize findings by severity (Critical, High, Medium, Low, Informational) with reproduction steps and fix recommendations.",
          },
          {
            id: "s-3-2",
            title: "Fuzz Testing",
            type: "challenge",
            duration: "30 min",
            xpReward: 70,
            challenge: {
              instructions:
                "Set up fuzz testing for a Solana program using the Trident framework. Your task:\n\n1. Write a fuzz test harness for the Counter program\n2. Define the fuzz instructions (initialize, increment, decrement)\n3. Set up invariant checks (count should never overflow, should never be negative)\n4. Configure the fuzzer to run for 1000 iterations\n\nTrident generates random instruction sequences to find edge cases.",
              starterCode:
                "// trident-tests/fuzz_tests/fuzz_0/fuzz_instructions.rs\n\nuse trident_client::fuzzing::*;\n\n// TODO: Define fuzz instruction types\n// TODO: Implement FuzzInstruction trait\n// TODO: Add invariant checks\n// TODO: Configure fuzz harness\n\npub struct CounterFuzzTest {\n    // TODO: Add state tracking\n}\n\nimpl CounterFuzzTest {\n    fn check_invariants(&self) {\n        // TODO: Verify counter state is consistent\n    }\n}",
              solution:
                "// trident-tests/fuzz_tests/fuzz_0/fuzz_instructions.rs\n\nuse trident_client::fuzzing::*;\n\n#[derive(Arbitrary, Debug)]\npub enum FuzzInstruction {\n    Initialize,\n    Increment,\n    Decrement,\n}\n\npub struct CounterFuzzTest {\n    expected_count: u64,\n    is_initialized: bool,\n}\n\nimpl CounterFuzzTest {\n    pub fn new() -> Self {\n        Self { expected_count: 0, is_initialized: false }\n    }\n\n    pub fn process_instruction(&mut self, ix: &FuzzInstruction) -> bool {\n        match ix {\n            FuzzInstruction::Initialize => {\n                if self.is_initialized { return false; } // Skip if already init\n                self.is_initialized = true;\n                self.expected_count = 0;\n                true\n            }\n            FuzzInstruction::Increment => {\n                if !self.is_initialized { return false; }\n                if let Some(new_count) = self.expected_count.checked_add(1) {\n                    self.expected_count = new_count;\n                    true\n                } else {\n                    false // Should fail with overflow\n                }\n            }\n            FuzzInstruction::Decrement => {\n                if !self.is_initialized { return false; }\n                if let Some(new_count) = self.expected_count.checked_sub(1) {\n                    self.expected_count = new_count;\n                    true\n                } else {\n                    false // Should fail with underflow\n                }\n            }\n        }\n    }\n\n    fn check_invariants(&self) {\n        // Invariant: expected count matches on-chain count\n        // Invariant: count >= 0 (always true for u64)\n        // Invariant: if not initialized, count == 0\n        if !self.is_initialized {\n            assert_eq!(self.expected_count, 0);\n        }\n    }\n}\n\n// Run with: trident fuzz run-hfuzz fuzz_0 -- -n 1000",
              testCases: [
                {
                  name: "Defines fuzz instruction variants",
                  input: "",
                  expectedOutput: "instructions defined",
                },
                {
                  name: "Tracks expected state for comparison",
                  input: "",
                  expectedOutput: "state tracked",
                },
                {
                  name: "Implements invariant checks",
                  input: "",
                  expectedOutput: "invariants checked",
                },
              ],
              language: "rust",
            },
          },
          {
            id: "s-3-3",
            title: "Formal Verification",
            type: "reading",
            duration: "15 min",
            xpReward: 35,
            content:
              "Formal verification uses mathematical proofs to guarantee program correctness. While full formal verification of Solana programs is still emerging, several tools and techniques can provide strong guarantees.\n\nProperty-based testing (practical formal methods):\nInstead of testing specific inputs, define properties that must ALWAYS hold, and let the testing framework generate inputs.\n\nExample properties for a token vault:\n• deposit(x) followed by withdraw(x) leaves balance unchanged\n• total_deposits == sum of all individual user deposits\n• withdraw(x) where x > user_balance always fails\n• No sequence of operations can make total_deposits negative\n\nTools for Solana:\n\n1. Trident (Anza) — fuzz testing framework for Anchor programs\n   • Generates random instruction sequences\n   • Checks invariants after each instruction\n   • Finds edge cases humans miss\n   • Run for hours/days in CI\n\n2. Mollusk — lightweight Solana program test harness\n   • Process individual instructions without a validator\n   • 100x faster than integration tests\n   • Great for unit-level property testing\n\n3. LiteSVM — in-process Solana virtual machine\n   • Full SVM without network overhead\n   • Process transactions in memory\n   • 10x faster than validator-based tests\n\n4. cargo-careful — runs Rust with extra UB checks enabled\n\nSymbolic execution (advanced):\nTools like KLEE or Manticore can symbolically execute programs to find all possible paths and identify unreachable states. While not directly supported for Solana BPF, you can use symbolic execution on the Rust source code before compilation.\n\nPractical approach for most teams:\n1. Property-based tests for core logic (deposit/withdraw/swap)\n2. Trident fuzz testing for instruction sequences (run in CI)\n3. Invariant checks in integration tests\n4. Manual audit for access control and CPI safety",
          },
          {
            id: "s-3-4",
            title: "Security Audit Capstone",
            type: "challenge",
            duration: "45 min",
            xpReward: 100,
            challenge: {
              instructions:
                "Perform a complete security audit of this NFT marketplace program. Identify ALL vulnerabilities, categorize them by severity, and provide fixes.\n\nThe program has:\n• list_nft — list an NFT for sale\n• buy_nft — purchase a listed NFT\n• cancel_listing — cancel a listing\n\nFind at least 5 vulnerabilities across categories: access control, arithmetic, CPI safety, and economic exploits.\n\nDocument each finding with: Severity, Description, Impact, and Fix.",
              starterCode:
                "use anchor_lang::prelude::*;\n\ndeclare_id!(\"11111111111111111111111111111111\");\n\n#[program]\npub mod marketplace {\n    use super::*;\n\n    pub fn list_nft(ctx: Context<ListNFT>, price: u64) -> Result<()> {\n        let listing = &mut ctx.accounts.listing;\n        listing.seller = ctx.accounts.seller.key();\n        listing.nft_mint = ctx.accounts.nft_mint.key();\n        listing.price = price;\n        listing.is_active = true;\n        // Transfer NFT to escrow\n        anchor_spl::token::transfer(\n            CpiContext::new(ctx.accounts.token_program.to_account_info(),\n                anchor_spl::token::Transfer {\n                    from: ctx.accounts.seller_nft.to_account_info(),\n                    to: ctx.accounts.escrow_nft.to_account_info(),\n                    authority: ctx.accounts.seller.to_account_info(),\n                }),\n            1,\n        )?;\n        Ok(())\n    }\n\n    pub fn buy_nft(ctx: Context<BuyNFT>) -> Result<()> {\n        let listing = &mut ctx.accounts.listing;\n        // Transfer SOL to seller\n        **ctx.accounts.buyer.to_account_info().try_borrow_mut_lamports()? -= listing.price;\n        **ctx.accounts.seller.to_account_info().try_borrow_mut_lamports()? += listing.price;\n        // Transfer NFT to buyer\n        // ... (CPI transfer from escrow)\n        listing.is_active = false;\n        Ok(())\n    }\n\n    pub fn cancel_listing(ctx: Context<CancelListing>) -> Result<()> {\n        let listing = &mut ctx.accounts.listing;\n        listing.is_active = false;\n        // Return NFT to seller\n        // ... (CPI transfer from escrow)\n        Ok(())\n    }\n}\n\n// AUDIT THESE ACCOUNT STRUCTS:\n#[derive(Accounts)]\npub struct ListNFT<'info> {\n    #[account(init, payer = seller, space = 200)]\n    pub listing: Account<'info, Listing>,\n    #[account(mut)]\n    pub seller: Signer<'info>,\n    pub nft_mint: AccountInfo<'info>,\n    #[account(mut)]\n    pub seller_nft: AccountInfo<'info>,\n    #[account(mut)]\n    pub escrow_nft: AccountInfo<'info>,\n    pub token_program: AccountInfo<'info>,\n    pub system_program: Program<'info, System>,\n}\n\n#[derive(Accounts)]\npub struct BuyNFT<'info> {\n    #[account(mut)]\n    pub listing: Account<'info, Listing>,\n    #[account(mut)]\n    pub buyer: Signer<'info>,\n    #[account(mut)]\n    pub seller: AccountInfo<'info>,\n}\n\n#[derive(Accounts)]\npub struct CancelListing<'info> {\n    #[account(mut)]\n    pub listing: Account<'info, Listing>,\n    pub seller: AccountInfo<'info>,\n}\n\n#[account]\npub struct Listing {\n    pub seller: Pubkey,\n    pub nft_mint: Pubkey,\n    pub price: u64,\n    pub is_active: bool,\n}",
              solution:
                "// SECURITY AUDIT FINDINGS:\n//\n// [CRITICAL] Finding 1: Missing signer check in cancel_listing\n//   Impact: Anyone can cancel any listing and steal the NFT\n//   Fix: Change seller to Signer<'info> and add has_one = seller\n//\n// [CRITICAL] Finding 2: Missing seller validation in buy_nft\n//   Impact: Buyer can set any address as seller, sending SOL to themselves\n//   Fix: Add has_one = seller constraint on listing\n//\n// [HIGH] Finding 3: Untyped token accounts in ListNFT\n//   Impact: Attacker can pass fake token accounts, bypass escrow\n//   Fix: Use Account<'info, TokenAccount> with token::mint and token::authority constraints\n//\n// [HIGH] Finding 4: Untyped token_program in ListNFT\n//   Impact: Attacker can pass a malicious program that pretends to transfer\n//   Fix: Use Program<'info, Token> instead of AccountInfo\n//\n// [MEDIUM] Finding 5: Price can be set to 0 in list_nft\n//   Impact: NFT can be listed for free\n//   Fix: require!(price > 0, MarketplaceError::InvalidPrice)\n//\n// [MEDIUM] Finding 6: No check that listing is_active in buy_nft\n//   Impact: Already-sold listings can be purchased again\n//   Fix: require!(listing.is_active, MarketplaceError::ListingInactive)\n//\n// [LOW] Finding 7: State update after CPI in buy_nft\n//   Impact: Potential reentrancy if token has transfer hook\n//   Fix: Set is_active = false BEFORE SOL transfer\n\nuse anchor_lang::prelude::*;\nuse anchor_spl::token::{Token, TokenAccount};\n\n#[derive(Accounts)]\npub struct BuyNFT<'info> {\n    #[account(mut, constraint = listing.is_active @ MarketplaceError::ListingInactive, has_one = seller)]\n    pub listing: Account<'info, Listing>,\n    #[account(mut)]\n    pub buyer: Signer<'info>,\n    #[account(mut)]\n    pub seller: SystemAccount<'info>,\n}\n\n#[derive(Accounts)]\npub struct CancelListing<'info> {\n    #[account(mut, has_one = seller)]\n    pub listing: Account<'info, Listing>,\n    pub seller: Signer<'info>, // FIXED: was AccountInfo\n}\n\n#[error_code]\npub enum MarketplaceError {\n    #[msg(\"Listing is not active\")]\n    ListingInactive,\n    #[msg(\"Price must be greater than zero\")]\n    InvalidPrice,\n    #[msg(\"Unauthorized\")]\n    Unauthorized,\n}",
              testCases: [
                {
                  name: "Identifies missing signer check in cancel_listing",
                  input: "",
                  expectedOutput: "finding documented",
                },
                {
                  name: "Identifies missing seller validation in buy_nft",
                  input: "",
                  expectedOutput: "finding documented",
                },
                {
                  name: "Identifies untyped token accounts",
                  input: "",
                  expectedOutput: "finding documented",
                },
                {
                  name: "Identifies untyped token_program",
                  input: "",
                  expectedOutput: "finding documented",
                },
                {
                  name: "Identifies missing is_active check",
                  input: "",
                  expectedOutput: "finding documented",
                },
              ],
              language: "rust",
            },
          },
        ],
      },
    ],
    isActive: true,
    totalCompletions: 0,
    enrolledCount: 0,
  },
  {
    id: "mobile-solana",
    slug: "mobile-solana-react-native",
    title: "Mobile dApps with React Native",
    description:
      "Build mobile-first Solana applications with React Native and Mobile Wallet Adapter. Ship native apps for iOS and Android.",
    track: "mobile",
    difficulty: "advanced",
    lessonCount: 8,
    duration: "5 hours",
    xpReward: 750,
    creator: "SuperteamBR",
    prerequisiteId: "frontend-solana",
    modules: [
      {
        id: "mob-1",
        title: "React Native + Solana",
        lessons: [
          {
            id: "m-1-1",
            title: "Project Setup",
            type: "reading",
            duration: "15 min",
            xpReward: 30,
            content:
              "Building Solana mobile dApps with React Native requires a specialized setup because the standard wallet adapter is browser-only. Mobile uses the Mobile Wallet Adapter (MWA) protocol instead.\n\nProject initialization:\nnpx react-native init SolanaMobile\ncd SolanaMobile\n\nInstall Solana mobile dependencies:\nnpm install @solana-mobile/mobile-wallet-adapter-protocol\nnpm install @solana-mobile/mobile-wallet-adapter-protocol-web3js\nnpm install @solana/web3.js\nnpm install react-native-get-random-values\nnpm install buffer\n\nCritical polyfills — React Native lacks Node.js builtins:\n// index.js (before any Solana imports)\nimport 'react-native-get-random-values';\nimport { Buffer } from 'buffer';\nglobal.Buffer = Buffer;\n\nAndroid setup:\nAdd to android/app/build.gradle:\nminSdkVersion: 23 (Android 6.0+)\n\nAdd to AndroidManifest.xml:\n<queries>\n  <intent>\n    <action android:name=\"solana-wallet://\" />\n  </intent>\n</queries>\n\niOS setup:\nAdd to Info.plist:\n<key>LSApplicationQueriesSchemes</key>\n<array>\n  <string>solana-wallet</string>\n</array>\n\nArchitecture differences from web:\n• No browser extension API — wallets communicate via Android intents or iOS deep links\n• Transactions are signed in the wallet app, then returned to your app\n• Session management is explicit — you authorize and get a session token\n• The wallet app handles key storage — your app never touches private keys\n• Works with Phantom, Solflare, and any MWA-compatible wallet\n\nFor Expo projects, use @solana-mobile/mobile-wallet-adapter-protocol-expo instead.",
          },
          {
            id: "m-1-2",
            title: "Mobile Wallet Adapter",
            type: "reading",
            duration: "15 min",
            xpReward: 30,
            content:
              "The Mobile Wallet Adapter (MWA) is an open protocol that enables mobile dApps to interact with wallet apps. It replaces the browser extension model with a session-based authorization flow.\n\nHow MWA works:\n1. Your app calls transact() — this opens the wallet app\n2. The wallet presents authorization UI to the user\n3. User approves — wallet returns an auth_token and public key\n4. Your app builds transactions and sends them to the wallet for signing\n5. Wallet signs and returns the signed transaction\n6. Your app sends the signed transaction to the RPC\n\nCore API:\n\nimport { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';\n\n// Authorize (connect)\nconst authResult = await transact(async (wallet) => {\n  const auth = await wallet.authorize({\n    identity: {\n      name: 'My dApp',\n      uri: 'https://mydapp.com',\n      icon: 'favicon.ico',\n    },\n    cluster: 'devnet',\n  });\n  return auth;\n});\n\n// The auth result contains:\n// - accounts: [{ address, label }] — the user's wallet(s)\n// - auth_token: string — reuse for subsequent sessions\n\n// Sign and send transaction\nawait transact(async (wallet) => {\n  await wallet.reauthorize({ auth_token: authResult.auth_token });\n  const signedTx = await wallet.signTransactions({\n    transactions: [serializedTransaction],\n  });\n  // Send signed transaction to RPC\n});\n\nSession lifecycle:\n• authorize() — first connection, user sees full approval screen\n• reauthorize() — subsequent connections, uses stored auth_token (faster)\n• deauthorize() — disconnect, invalidates the auth_token\n\nKey differences from web wallet adapter:\n• Each transact() call opens the wallet app (context switch)\n• Batch operations in a single transact() call to minimize app switches\n• Auth tokens persist — save them in AsyncStorage for session continuity\n• The wallet app can be a different process — don't assume instant responses\n• Always handle the case where the user has no MWA-compatible wallet installed",
          },
          {
            id: "m-1-3",
            title: "Connect to Phantom Mobile",
            type: "challenge",
            duration: "30 min",
            xpReward: 65,
            challenge: {
              instructions:
                "Build a React Native component that connects to Phantom Mobile using the Mobile Wallet Adapter. Your component should:\n\n1. Check if a compatible wallet is installed\n2. Authorize with the wallet on button press\n3. Display the connected wallet address\n4. Store the auth_token for session persistence\n5. Support disconnect (deauthorize)",
              starterCode:
                "import React, { useState, useCallback } from 'react';\nimport { View, Text, TouchableOpacity, Alert } from 'react-native';\nimport { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';\nimport AsyncStorage from '@react-native-async-storage/async-storage';\n\nexport function WalletConnect() {\n  const [address, setAddress] = useState<string | null>(null);\n  const [authToken, setAuthToken] = useState<string | null>(null);\n\n  const handleConnect = useCallback(async () => {\n    // TODO: Call transact() to authorize with wallet\n    // TODO: Save auth_token to AsyncStorage\n    // TODO: Update address state\n  }, []);\n\n  const handleDisconnect = useCallback(async () => {\n    // TODO: Deauthorize and clear state\n  }, [authToken]);\n\n  return (\n    <View>\n      {/* TODO: Render connect/disconnect UI */}\n    </View>\n  );\n}",
              solution:
                "import React, { useState, useCallback, useEffect } from 'react';\nimport { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';\nimport { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';\nimport AsyncStorage from '@react-native-async-storage/async-storage';\nimport { PublicKey } from '@solana/web3.js';\nimport base58 from 'bs58';\n\nconst APP_IDENTITY = {\n  name: 'Superteam Academy',\n  uri: 'https://academy.superteam.fun',\n  icon: 'favicon.ico',\n};\n\nexport function WalletConnect() {\n  const [address, setAddress] = useState<string | null>(null);\n  const [authToken, setAuthToken] = useState<string | null>(null);\n\n  useEffect(() => {\n    AsyncStorage.getItem('mwa_auth_token').then(setAuthToken);\n  }, []);\n\n  const handleConnect = useCallback(async () => {\n    try {\n      const result = await transact(async (wallet) => {\n        const auth = await wallet.authorize({\n          identity: APP_IDENTITY,\n          cluster: 'devnet',\n        });\n        return auth;\n      });\n\n      const pubkey = new PublicKey(result.accounts[0].address);\n      setAddress(pubkey.toBase58());\n      setAuthToken(result.auth_token);\n      await AsyncStorage.setItem('mwa_auth_token', result.auth_token);\n    } catch (e: any) {\n      Alert.alert('Connection Failed', e.message);\n    }\n  }, []);\n\n  const handleDisconnect = useCallback(async () => {\n    if (!authToken) return;\n    try {\n      await transact(async (wallet) => {\n        await wallet.deauthorize({ auth_token: authToken });\n      });\n    } catch {}\n    setAddress(null);\n    setAuthToken(null);\n    await AsyncStorage.removeItem('mwa_auth_token');\n  }, [authToken]);\n\n  const truncated = address ? `${address.slice(0, 4)}...${address.slice(-4)}` : '';\n\n  return (\n    <View style={styles.container}>\n      {address ? (\n        <View>\n          <Text style={styles.address}>{truncated}</Text>\n          <TouchableOpacity onPress={handleDisconnect} style={styles.button}>\n            <Text>Disconnect</Text>\n          </TouchableOpacity>\n        </View>\n      ) : (\n        <TouchableOpacity onPress={handleConnect} style={styles.button}>\n          <Text>Connect Wallet</Text>\n        </TouchableOpacity>\n      )}\n    </View>\n  );\n}\n\nconst styles = StyleSheet.create({\n  container: { padding: 16 },\n  address: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },\n  button: { padding: 12, backgroundColor: '#00FFA3', borderRadius: 8, alignItems: 'center' },\n});",
              testCases: [
                {
                  name: "Authorizes with Mobile Wallet Adapter",
                  input: "",
                  expectedOutput: "wallet connected",
                },
                {
                  name: "Displays truncated wallet address",
                  input: "",
                  expectedOutput: "address shown",
                },
                {
                  name: "Persists auth_token in AsyncStorage",
                  input: "",
                  expectedOutput: "token saved",
                },
                {
                  name: "Supports disconnect (deauthorize)",
                  input: "",
                  expectedOutput: "disconnected",
                },
              ],
              language: "typescript",
            },
          },
        ],
      },
      {
        id: "mob-2",
        title: "Native Transactions",
        lessons: [
          {
            id: "m-2-1",
            title: "Signing on Mobile",
            type: "reading",
            duration: "12 min",
            xpReward: 25,
            content:
              "Transaction signing on mobile is fundamentally different from web. The wallet app is a separate process, and all signing happens through the Mobile Wallet Adapter protocol.\n\nSigning flow:\n1. Your app builds the transaction (unsigned)\n2. Call transact() to open the wallet app\n3. Pass the serialized transaction to wallet.signTransactions()\n4. The wallet shows the transaction details to the user\n5. User approves → wallet returns the signed transaction\n6. Your app sends the signed transaction to the RPC\n\nCode pattern:\n\nimport { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';\nimport { Connection, Transaction, SystemProgram } from '@solana/web3.js';\n\nconst connection = new Connection('https://api.devnet.solana.com');\n\nasync function signAndSend(transaction: Transaction, authToken: string) {\n  const { blockhash } = await connection.getLatestBlockhash();\n  transaction.recentBlockhash = blockhash;\n\n  const signedTx = await transact(async (wallet) => {\n    await wallet.reauthorize({ auth_token: authToken });\n    const signed = await wallet.signTransactions({\n      transactions: [transaction.serialize({ requireAllSignatures: false })],\n    });\n    return Transaction.from(signed[0]);\n  });\n\n  const signature = await connection.sendRawTransaction(signedTx.serialize());\n  await connection.confirmTransaction(signature, 'confirmed');\n  return signature;\n}\n\nBatch signing:\nSign multiple transactions in a single wallet session to minimize app switches:\n\nconst signedTxs = await transact(async (wallet) => {\n  await wallet.reauthorize({ auth_token: authToken });\n  return wallet.signTransactions({\n    transactions: [tx1.serialize(), tx2.serialize(), tx3.serialize()],\n  });\n});\n\nSign messages (for authentication):\nawait transact(async (wallet) => {\n  const signed = await wallet.signMessages({\n    addresses: [walletAddress],\n    payloads: [new TextEncoder().encode('Sign in to Superteam Academy')],\n  });\n});\n\nPerformance tips:\n• Minimize transact() calls — each one opens the wallet app\n• Pre-fetch blockhash before opening the wallet\n• Use signAndSendTransactions() when available (wallet sends directly)\n• Handle timeout gracefully — users may take time to approve",
          },
          {
            id: "m-2-2",
            title: "Build a Mobile Swap UI",
            type: "challenge",
            duration: "40 min",
            xpReward: 80,
            challenge: {
              instructions:
                "Build a React Native token swap component using the Jupiter Ultra API. Your component should:\n\n1. Let users select input/output tokens (SOL, USDC)\n2. Input an amount to swap\n3. Fetch a quote from Jupiter Ultra API (https://lite.jup.ag/ultra/v1/order)\n4. Display the output amount and price impact\n5. Execute the swap by signing with Mobile Wallet Adapter\n\nUse the Jupiter Ultra API (v1) for quotes and order execution.",
              starterCode:
                "import React, { useState } from 'react';\nimport { View, Text, TextInput, TouchableOpacity } from 'react-native';\nimport { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';\nimport { Connection } from '@solana/web3.js';\n\nconst TOKENS = {\n  SOL: 'So11111111111111111111111111111111111111112',\n  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',\n};\n\nexport function SwapScreen() {\n  const [inputToken, setInputToken] = useState('SOL');\n  const [outputToken, setOutputToken] = useState('USDC');\n  const [amount, setAmount] = useState('');\n  const [quote, setQuote] = useState<any>(null);\n\n  // TODO: Fetch quote from Jupiter Ultra API\n  // TODO: Execute swap with MWA signing\n  // TODO: Display quote details\n\n  return <View>{/* TODO */}</View>;\n}",
              solution:
                "import React, { useState, useCallback } from 'react';\nimport { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';\nimport { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';\nimport { Connection, VersionedTransaction } from '@solana/web3.js';\n\nconst TOKENS: Record<string, string> = {\n  SOL: 'So11111111111111111111111111111111111111112',\n  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',\n};\n\nconst connection = new Connection('https://api.devnet.solana.com');\n\nexport function SwapScreen({ authToken, walletAddress }: { authToken: string; walletAddress: string }) {\n  const [inputToken, setInputToken] = useState('SOL');\n  const [outputToken, setOutputToken] = useState('USDC');\n  const [amount, setAmount] = useState('');\n  const [quote, setQuote] = useState<any>(null);\n  const [loading, setLoading] = useState(false);\n\n  const fetchQuote = useCallback(async () => {\n    if (!amount) return;\n    setLoading(true);\n    try {\n      const decimals = inputToken === 'SOL' ? 9 : 6;\n      const lamports = Math.round(parseFloat(amount) * 10 ** decimals);\n      const params = new URLSearchParams({\n        inputMint: TOKENS[inputToken],\n        outputMint: TOKENS[outputToken],\n        amount: lamports.toString(),\n        taker: walletAddress,\n      });\n      const res = await fetch(`https://lite.jup.ag/ultra/v1/order?${params}`);\n      const data = await res.json();\n      setQuote(data);\n    } catch (e: any) {\n      Alert.alert('Error', e.message);\n    } finally {\n      setLoading(false);\n    }\n  }, [amount, inputToken, outputToken, walletAddress]);\n\n  const executeSwap = useCallback(async () => {\n    if (!quote?.transaction) return;\n    try {\n      const txBuffer = Buffer.from(quote.transaction, 'base64');\n      const signedTx = await transact(async (wallet) => {\n        await wallet.reauthorize({ auth_token: authToken });\n        const signed = await wallet.signTransactions({ transactions: [txBuffer] });\n        return signed[0];\n      });\n      const sig = await connection.sendRawTransaction(signedTx);\n      Alert.alert('Success', `Swap complete: ${sig.slice(0, 8)}...`);\n    } catch (e: any) {\n      Alert.alert('Swap Failed', e.message);\n    }\n  }, [quote, authToken]);\n\n  const outDecimals = outputToken === 'SOL' ? 9 : 6;\n  const outputAmount = quote?.outAmount ? (Number(quote.outAmount) / 10 ** outDecimals).toFixed(4) : '--';\n\n  return (\n    <View style={styles.container}>\n      <Text style={styles.label}>From: {inputToken}</Text>\n      <TextInput style={styles.input} value={amount} onChangeText={setAmount} placeholder='Amount' keyboardType='numeric' />\n      <Text style={styles.label}>To: {outputToken} = {outputAmount}</Text>\n      <TouchableOpacity onPress={fetchQuote} style={styles.button}><Text>{loading ? 'Loading...' : 'Get Quote'}</Text></TouchableOpacity>\n      {quote && <TouchableOpacity onPress={executeSwap} style={styles.swapBtn}><Text style={{color:'#fff'}}>Swap</Text></TouchableOpacity>}\n    </View>\n  );\n}\n\nconst styles = StyleSheet.create({ container:{padding:16}, label:{fontSize:16,marginVertical:8}, input:{borderWidth:1,borderColor:'#ccc',padding:12,borderRadius:8}, button:{padding:12,backgroundColor:'#00FFA3',borderRadius:8,alignItems:'center',marginTop:8}, swapBtn:{padding:12,backgroundColor:'#9945FF',borderRadius:8,alignItems:'center',marginTop:8} });",
              testCases: [
                {
                  name: "Fetches quote from Jupiter Ultra API",
                  input: "",
                  expectedOutput: "quote fetched",
                },
                {
                  name: "Signs swap transaction via MWA",
                  input: "",
                  expectedOutput: "transaction signed",
                },
                {
                  name: "Displays output amount",
                  input: "",
                  expectedOutput: "amount shown",
                },
              ],
              language: "typescript",
            },
          },
          {
            id: "m-2-3",
            title: "Offline Signing",
            type: "reading",
            duration: "15 min",
            xpReward: 30,
            content:
              "Offline signing enables building transactions without a network connection — useful for mobile scenarios with intermittent connectivity. The transaction is signed offline, then broadcast when connectivity returns.\n\nDurable Nonces — the key to offline signing:\nNormal transactions use a recent blockhash that expires in ~2 minutes. Durable nonces replace this with a nonce value stored in a special on-chain account that never expires.\n\nSetup a nonce account:\nimport { SystemProgram, NonceAccount, NONCE_ACCOUNT_LENGTH } from '@solana/web3.js';\n\n// Create nonce account\nconst nonceKeypair = Keypair.generate();\nconst createTx = new Transaction().add(\n  SystemProgram.createAccount({\n    fromPubkey: payer.publicKey,\n    newAccountPubkey: nonceKeypair.publicKey,\n    lamports: await connection.getMinimumBalanceForRentExemption(NONCE_ACCOUNT_LENGTH),\n    space: NONCE_ACCOUNT_LENGTH,\n    programId: SystemProgram.programId,\n  }),\n  SystemProgram.nonceInitialize({\n    noncePubkey: nonceKeypair.publicKey,\n    authorizedPubkey: payer.publicKey,\n  })\n);\n\nBuild an offline transaction:\n// Fetch the nonce value\nconst nonceAccount = await connection.getAccountInfo(nonceKeypair.publicKey);\nconst nonce = NonceAccount.fromAccountData(nonceAccount.data);\n\n// Build transaction with nonce instead of blockhash\nconst tx = new Transaction();\ntx.add(SystemProgram.nonceAdvance({\n  noncePubkey: nonceKeypair.publicKey,\n  authorizedPubkey: payer.publicKey,\n}));\ntx.add(yourInstruction);\ntx.recentBlockhash = nonce.nonce; // Use nonce as blockhash\ntx.feePayer = payer.publicKey;\n\n// Sign offline\ntx.sign(payer);\n\n// Store serialized transaction\nconst serialized = tx.serialize();\n// Later, when online:\nconst sig = await connection.sendRawTransaction(serialized);\n\nMobile use cases:\n• Sign transactions on a subway, send when back online\n• Hardware wallet signing (Ledger) where the device isn't always connected\n• Multi-sig where signers are in different locations/times\n• Scheduled transactions — sign now, broadcast at a specific time\n\nImportant: Each nonce value can only be used once. After the transaction is broadcast, the nonce account advances to a new value automatically.",
          },
        ],
      },
      {
        id: "mob-3",
        title: "Ship to App Store",
        lessons: [
          {
            id: "m-3-1",
            title: "Performance Optimization",
            type: "reading",
            duration: "15 min",
            xpReward: 30,
            content:
              "Mobile dApps face unique performance challenges: limited memory, battery constraints, and variable network conditions. Here are the key optimizations for Solana mobile apps.\n\n1. Minimize RPC calls:\n• Batch requests using connection.getMultipleAccountsInfo() instead of multiple single calls\n• Cache responses in-memory or AsyncStorage with TTL\n• Use WebSocket subscriptions (onAccountChange) for live data instead of polling\n• Debounce balance refreshes — don't refetch on every UI interaction\n\n2. Transaction optimization:\n• Pre-fetch blockhash before opening the wallet app\n• Use getLatestBlockhash with 'confirmed' commitment (not 'finalized')\n• Combine multiple instructions into single transactions when possible\n• Set compute unit limits with ComputeBudgetProgram to avoid overpaying\n\n3. React Native performance:\n• Use React.memo for expensive components (token lists, NFT grids)\n• Virtualize long lists with FlatList (not ScrollView with map)\n• Move heavy computation to a background thread with react-native-worklets\n• Lazy load the Solana web3.js bundle — it's ~400KB\n\n4. Network resilience:\n• Implement request retry with exponential backoff\n• Queue failed transactions for retry when connectivity returns\n• Show optimistic UI updates, then confirm with RPC\n• Use a fallback RPC: try Helius first, fall back to public RPC\n\n5. Bundle size:\n• Tree-shake @solana/web3.js (import specific functions)\n• Use Hermes engine (default in modern RN) for faster JS execution\n• Lazy-load screens with React Navigation's lazy prop\n• Strip console.log in production builds\n\n6. Battery:\n• Close WebSocket subscriptions when app backgrounds\n• Use AppState listener to pause/resume network activity\n• Avoid continuous polling — subscribe to account changes instead\n• Cache aggressively to reduce network round-trips",
          },
          {
            id: "m-3-2",
            title: "Final Project: Token Tracker",
            type: "challenge",
            duration: "45 min",
            xpReward: 100,
            challenge: {
              instructions:
                "Build a complete mobile token tracker app with React Native. The app should:\n\n1. Connect to a Solana wallet via Mobile Wallet Adapter\n2. Display the SOL balance and all SPL token balances\n3. Show token metadata (name, symbol, logo) from on-chain data\n4. Auto-refresh balances every 30 seconds\n5. Pull-to-refresh for manual updates\n6. Persist the last known balances for offline viewing\n\nThis is your capstone project — combine everything you've learned.",
              starterCode:
                "import React, { useState, useEffect, useCallback } from 'react';\nimport { View, Text, FlatList, RefreshControl, StyleSheet } from 'react-native';\nimport { Connection } from '@solana/web3.js';\nimport AsyncStorage from '@react-native-async-storage/async-storage';\n\ninterface TokenInfo {\n  mint: string;\n  symbol: string;\n  name: string;\n  balance: number;\n  decimals: number;\n  logoUri?: string;\n}\n\nexport function TokenTracker({ walletAddress }: { walletAddress: string }) {\n  const [tokens, setTokens] = useState<TokenInfo[]>([]);\n  const [solBalance, setSolBalance] = useState(0);\n  const [refreshing, setRefreshing] = useState(false);\n\n  // TODO: Fetch SOL balance\n  // TODO: Fetch all SPL token balances\n  // TODO: Get token metadata (name, symbol, logo)\n  // TODO: Auto-refresh every 30 seconds\n  // TODO: Cache balances in AsyncStorage\n  // TODO: Pull-to-refresh\n  // TODO: Render token list\n\n  return <View>{/* TODO */}</View>;\n}",
              solution:
                "import React, { useState, useEffect, useCallback, useRef } from 'react';\nimport { View, Text, FlatList, RefreshControl, StyleSheet, Image } from 'react-native';\nimport { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';\nimport AsyncStorage from '@react-native-async-storage/async-storage';\n\nconst connection = new Connection('https://api.devnet.solana.com');\n\ninterface TokenInfo {\n  mint: string;\n  symbol: string;\n  name: string;\n  balance: number;\n  decimals: number;\n  logoUri?: string;\n}\n\nexport function TokenTracker({ walletAddress }: { walletAddress: string }) {\n  const [tokens, setTokens] = useState<TokenInfo[]>([]);\n  const [solBalance, setSolBalance] = useState(0);\n  const [refreshing, setRefreshing] = useState(false);\n  const intervalRef = useRef<ReturnType<typeof setInterval>>();\n\n  const fetchBalances = useCallback(async () => {\n    const pubkey = new PublicKey(walletAddress);\n\n    // Fetch SOL balance\n    const sol = await connection.getBalance(pubkey);\n    setSolBalance(sol / LAMPORTS_PER_SOL);\n\n    // Fetch SPL tokens\n    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(\n      pubkey, { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }\n    );\n\n    const tokenList: TokenInfo[] = tokenAccounts.value\n      .map((acc) => {\n        const info = acc.account.data.parsed.info;\n        return {\n          mint: info.mint,\n          symbol: info.mint.slice(0, 4).toUpperCase(),\n          name: info.mint.slice(0, 8) + '...',\n          balance: info.tokenAmount.uiAmount ?? 0,\n          decimals: info.tokenAmount.decimals,\n        };\n      })\n      .filter((t) => t.balance > 0);\n\n    setTokens(tokenList);\n\n    // Cache in AsyncStorage\n    await AsyncStorage.setItem('cached_balances', JSON.stringify({ sol, tokens: tokenList, timestamp: Date.now() }));\n  }, [walletAddress]);\n\n  // Load cached balances on mount\n  useEffect(() => {\n    AsyncStorage.getItem('cached_balances').then((cached) => {\n      if (cached) {\n        const data = JSON.parse(cached);\n        setSolBalance(data.sol / LAMPORTS_PER_SOL);\n        setTokens(data.tokens);\n      }\n    });\n    fetchBalances();\n  }, [fetchBalances]);\n\n  // Auto-refresh every 30 seconds\n  useEffect(() => {\n    intervalRef.current = setInterval(fetchBalances, 30_000);\n    return () => clearInterval(intervalRef.current);\n  }, [fetchBalances]);\n\n  const onRefresh = async () => {\n    setRefreshing(true);\n    await fetchBalances();\n    setRefreshing(false);\n  };\n\n  const renderToken = ({ item }: { item: TokenInfo }) => (\n    <View style={styles.tokenRow}>\n      <View style={styles.tokenIcon}>\n        {item.logoUri ? <Image source={{ uri: item.logoUri }} style={styles.logo} /> : <Text style={styles.iconText}>{item.symbol[0]}</Text>}\n      </View>\n      <View style={{ flex: 1 }}>\n        <Text style={styles.tokenName}>{item.name}</Text>\n        <Text style={styles.tokenMint}>{item.mint.slice(0, 8)}...</Text>\n      </View>\n      <Text style={styles.tokenBalance}>{item.balance.toLocaleString()}</Text>\n    </View>\n  );\n\n  return (\n    <View style={styles.container}>\n      <View style={styles.solCard}>\n        <Text style={styles.solLabel}>SOL Balance</Text>\n        <Text style={styles.solAmount}>{solBalance.toFixed(4)} SOL</Text>\n      </View>\n      <FlatList\n        data={tokens}\n        renderItem={renderToken}\n        keyExtractor={(item) => item.mint}\n        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor='#00FFA3' />}\n        ListEmptyComponent={<Text style={styles.empty}>No tokens found</Text>}\n      />\n    </View>\n  );\n}\n\nconst styles = StyleSheet.create({\n  container: { flex: 1, backgroundColor: '#0C0A09' },\n  solCard: { padding: 24, backgroundColor: '#1C1917', margin: 16, borderRadius: 12 },\n  solLabel: { color: '#A8A29E', fontSize: 14 },\n  solAmount: { color: '#00FFA3', fontSize: 32, fontWeight: 'bold', marginTop: 4 },\n  tokenRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#292524' },\n  tokenIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#292524', alignItems: 'center', justifyContent: 'center', marginRight: 12 },\n  iconText: { color: '#fff', fontWeight: 'bold' },\n  logo: { width: 40, height: 40, borderRadius: 20 },\n  tokenName: { color: '#fff', fontSize: 16, fontWeight: '600' },\n  tokenMint: { color: '#78716C', fontSize: 12, marginTop: 2 },\n  tokenBalance: { color: '#fff', fontSize: 16, fontWeight: '600' },\n  empty: { color: '#78716C', textAlign: 'center', marginTop: 40 },\n});",
              testCases: [
                {
                  name: "Fetches SOL and SPL token balances",
                  input: "",
                  expectedOutput: "balances fetched",
                },
                {
                  name: "Caches balances in AsyncStorage",
                  input: "",
                  expectedOutput: "cache works",
                },
                {
                  name: "Auto-refreshes every 30 seconds",
                  input: "",
                  expectedOutput: "auto-refresh active",
                },
                {
                  name: "Supports pull-to-refresh",
                  input: "",
                  expectedOutput: "pull refresh works",
                },
                {
                  name: "Renders token list with FlatList",
                  input: "",
                  expectedOutput: "list rendered",
                },
              ],
              language: "typescript",
            },
          },
        ],
      },
    ],
    isActive: true,
    totalCompletions: 0,
    enrolledCount: 0,
  },
];

/**
 * Achievement definitions — static badge catalog.
 * Unlock status comes from the user's on-chain profile.
 */
export const achievements: Achievement[] = [
  {
    id: "first-lesson",
    name: "First Steps",
    description: "Complete your first lesson",
    icon: "rocket",
    xpReward: 50,
    category: "learning",
  },
  {
    id: "first-course",
    name: "Course Complete",
    description: "Complete your first course",
    icon: "trophy",
    xpReward: 200,
    category: "learning",
  },
  {
    id: "streak-7",
    name: "Week Warrior",
    description: "Maintain a 7-day streak",
    icon: "flame",
    xpReward: 100,
    category: "streak",
  },
  {
    id: "streak-30",
    name: "Monthly Master",
    description: "Maintain a 30-day streak",
    icon: "fire",
    xpReward: 500,
    category: "streak",
  },
  {
    id: "all-tracks",
    name: "Renaissance Dev",
    description: "Complete a course in every track",
    icon: "star",
    xpReward: 1000,
    category: "learning",
  },
  {
    id: "code-10",
    name: "Code Machine",
    description: "Complete 10 coding challenges",
    icon: "code",
    xpReward: 150,
    category: "learning",
  },
  {
    id: "referral-5",
    name: "Community Builder",
    description: "Refer 5 friends",
    icon: "users",
    xpReward: 250,
    category: "social",
  },
  {
    id: "top-10",
    name: "Elite Learner",
    description: "Reach the top 10 on the leaderboard",
    icon: "crown",
    xpReward: 500,
    category: "special",
  },
  {
    id: "security-audit",
    name: "Bug Hunter",
    description: "Complete the security audit capstone",
    icon: "shield",
    xpReward: 300,
    category: "learning",
  },
  {
    id: "speed-run",
    name: "Speed Runner",
    description: "Complete a course in under 2 hours",
    icon: "zap",
    xpReward: 200,
    category: "special",
  },
];

export function getCourseBySlug(slug: string): Course | undefined {
  return courses.find((c) => c.slug === slug);
}

export function getCourseById(id: string): Course | undefined {
  return courses.find((c) => c.id === id);
}

/* ------------------------------------------------------------------ */
/*  Raw response shapes for Sanity and Supabase                       */
/* ------------------------------------------------------------------ */

interface SanityLessonRaw {
  _id?: string;
  slug?: string;
  title: string;
  type?: string;
  estimatedMinutes?: number;
  xpReward?: number;
}

interface SanityModuleRaw {
  _id: string;
  title: string;
  lessons?: SanityLessonRaw[];
}

interface SanityCourseRaw {
  _id: string;
  slug: string;
  title: string;
  description: string;
  track: string;
  difficulty: string;
  lessonCount?: number;
  estimatedHours?: number;
  xpReward?: number;
  instructor?: { name?: string };
  modules?: SanityModuleRaw[];
}

interface SupabaseCourseRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  track: string;
  difficulty: string;
  lesson_count: number;
  duration: string;
  xp_reward: number;
  creator: string;
  image_url?: string | null;
  prerequisite_id?: string | null;
  is_active: boolean;
  total_completions: number;
  enrolled_count: number;
}

interface SupabaseModuleRow {
  id: string;
  course_id: string;
  title: string;
  order: number;
}

interface SupabaseLessonRow {
  id: string;
  module_id: string;
  title: string;
  type: string;
  duration: string;
  xp_reward: number;
  order: number;
  content?: string | null;
  challenge_instructions?: string | null;
  challenge_starter_code?: string;
  challenge_solution?: string;
  challenge_language?: string;
  challenge_test_cases?: TestCase[];
}

/* ------------------------------------------------------------------ */
/*  Sanity CMS integration — async fetchers with static-data fallback */
/* ------------------------------------------------------------------ */

function transformSanityCourse(raw: SanityCourseRaw): Course {
  return {
    id: raw._id,
    slug: raw.slug,
    title: raw.title,
    description: raw.description,
    track: raw.track as Course["track"],
    difficulty: raw.difficulty as Course["difficulty"],
    lessonCount: raw.lessonCount || 0,
    duration: raw.estimatedHours ? `${raw.estimatedHours} hours` : "0 hours",
    xpReward: raw.xpReward ?? 0,
    creator: raw.instructor?.name || "Superteam Academy",
    imageUrl: undefined,
    modules: (raw.modules || []).map((m) => ({
      id: m._id,
      title: m.title,
      lessons: (m.lessons || []).map((l) => ({
        id: l._id || l.slug || "",
        title: l.title,
        type:
          l.type === "challenge"
            ? "challenge"
            : l.type === "quiz"
              ? "quiz"
              : l.type === "video"
                ? "video"
                : "reading",
        duration: l.estimatedMinutes ? `${l.estimatedMinutes} min` : "10 min",
        xpReward: l.xpReward || 10,
      })),
    })),
    prerequisiteId: undefined,
    isActive: true,
    totalCompletions: 0,
    enrolledCount: 0,
  };
}

/* ------------------------------------------------------------------ */
/*  Supabase integration — reads from DB with static-data fallback      */
/* ------------------------------------------------------------------ */

function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function transformSupabaseCourse(
  row: SupabaseCourseRow,
  modules: SupabaseModuleRow[],
  lessons: SupabaseLessonRow[],
): Course {
  const courseModules = modules
    .filter((m) => m.course_id === row.id)
    .sort((a, b) => a.order - b.order);

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    track: row.track as Course["track"],
    difficulty: row.difficulty as Course["difficulty"],
    lessonCount: row.lesson_count,
    duration: row.duration,
    xpReward: row.xp_reward,
    creator: row.creator,
    imageUrl: row.image_url ?? undefined,
    modules: courseModules.map((m) => ({
      id: m.id,
      title: m.title,
      lessons: lessons
        .filter((l) => l.module_id === m.id)
        .sort((a, b) => a.order - b.order)
        .map((l) => ({
          id: l.id,
          title: l.title,
          type: l.type as Lesson["type"],
          duration: l.duration,
          xpReward: l.xp_reward,
          content: l.content ?? undefined,
          challenge: l.challenge_instructions
            ? {
                instructions: l.challenge_instructions,
                starterCode: l.challenge_starter_code ?? "",
                solution: l.challenge_solution ?? "",
                language: (l.challenge_language ?? "typescript") as CodeChallenge["language"],
                testCases: l.challenge_test_cases ?? [],
              }
            : undefined,
        })),
    })),
    prerequisiteId: row.prerequisite_id ?? undefined,
    isActive: row.is_active,
    totalCompletions: row.total_completions,
    enrolledCount: row.enrolled_count,
  };
}

/**
 * Fetch all courses. Priority: Supabase > Sanity CMS > static data.
 */
export async function fetchCourses(): Promise<Course[]> {
  // Try Supabase first
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        NEXT_PUBLIC_SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY,
      );
      const { data: dbCourses } = await supabase
        .from("courses")
        .select("*")
        .eq("published", true)
        .eq("is_active", true)
        .order("title");

      if (dbCourses && dbCourses.length > 0) {
        const { data: dbModules } = await supabase
          .from("modules")
          .select("*")
          .order("order");
        const { data: dbLessons } = await supabase
          .from("lessons")
          .select("*")
          .order("order");

        return (dbCourses as SupabaseCourseRow[]).map((row) =>
          transformSupabaseCourse(
            row,
            (dbModules ?? []) as SupabaseModuleRow[],
            (dbLessons ?? []) as SupabaseLessonRow[],
          ),
        );
      }
    } catch (error) {
      console.error("[courses] Supabase fetch failed, falling through:", error);
    }
  }

  // Try Sanity CMS
  if (isSanityConfigured()) {
    try {
      const raw = await sanityClient.fetch(allCoursesQuery);
      if (raw && raw.length > 0) return raw.map(transformSanityCourse);
    } catch (error) {
      console.error("[courses] Sanity fetch failed, falling through:", error);
    }
  }

  return courses;
}

/**
 * Fetch a single course by slug. Priority: Supabase > Sanity CMS > static data.
 */
export async function fetchCourseBySlug(
  slug: string,
): Promise<Course | undefined> {
  // Try Supabase first
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        NEXT_PUBLIC_SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY,
      );
      const { data: row } = await supabase
        .from("courses")
        .select("*")
        .eq("slug", slug)
        .single();

      if (row) {
        const { data: dbModules } = await supabase
          .from("modules")
          .select("*")
          .eq("course_id", row.id)
          .order("order");
        const moduleIds = ((dbModules ?? []) as SupabaseModuleRow[]).map((m) => m.id);
        const { data: dbLessons } = await supabase
          .from("lessons")
          .select("*")
          .in("module_id", moduleIds.length > 0 ? moduleIds : ["__none__"])
          .order("order");

        return transformSupabaseCourse(
          row as SupabaseCourseRow,
          (dbModules ?? []) as SupabaseModuleRow[],
          (dbLessons ?? []) as SupabaseLessonRow[],
        );
      }
    } catch (error) {
      console.error("[courses] Supabase slug fetch failed, falling through:", error);
    }
  }

  // Try Sanity CMS
  if (isSanityConfigured()) {
    try {
      const raw = await sanityClient.fetch(courseBySlugQuery, { slug });
      if (raw) return transformSanityCourse(raw);
    } catch (error) {
      console.error("[courses] Sanity slug fetch failed, falling through:", error);
    }
  }

  return getCourseBySlug(slug);
}
