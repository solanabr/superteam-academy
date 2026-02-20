import type { CourseService } from "../course-service";
import type { Course } from "@/types";

const MOCK_COURSES: Course[] = [
  {
    id: "intro-solana",
    courseId: "intro-solana",
    title: "Introduction to Solana",
    slug: "intro-to-solana",
    description:
      "Learn the fundamentals of Solana blockchain — accounts, transactions, programs, and the runtime model that makes Solana the fastest L1.",
    difficulty: 1,
    lessonCount: 8,
    xpPerLesson: 25,
    trackId: 1,
    trackLevel: 1,
    isActive: true,
    prerequisite: null,
    totalCompletions: 342,
    creatorRewardXp: 200,
    duration: "3 hours",
    thumbnailUrl: "",
    creator: "Superteam Academy",
    modules: [
      {
        id: "mod-1",
        title: "Solana Fundamentals",
        description: "Core concepts of the Solana blockchain",
        order: 0,
        lessons: [
          {
            id: "lesson-1-1",
            title: "What is Solana?",
            description: "Overview of Solana's architecture and key innovations",
            type: "content",
            order: 0,
            xp: 25,
            duration: "15 min",
            content:
              "<h2>Welcome to Solana</h2><p>Solana is a high-performance blockchain supporting thousands of transactions per second with sub-second finality.</p><h3>Key Innovations</h3><ul><li><strong>Proof of History</strong> — cryptographic timestamps for ordering transactions</li><li><strong>Tower BFT</strong> — PoH-optimized consensus</li><li><strong>Gulf Stream</strong> — mempool-less transaction forwarding</li><li><strong>Sealevel</strong> — parallel smart contract runtime</li><li><strong>Turbine</strong> — block propagation protocol</li></ul><p>By the end of this course, you'll understand how these innovations work together to create the fastest blockchain.</p>",
          },
          {
            id: "lesson-1-2",
            title: "Accounts Model",
            description: "Understanding Solana's account-based data model",
            type: "content",
            order: 1,
            xp: 25,
            duration: "20 min",
            content:
              "<h2>The Account Model</h2><p>On Solana, everything is an account. Programs, wallets, tokens, and application state all live in accounts.</p><h3>Account Structure</h3><pre><code>AccountInfo {\n  lamports: u64,    // Balance in lamports\n  data: Vec&lt;u8&gt;,    // Raw data bytes\n  owner: Pubkey,    // Program that owns this account\n  executable: bool, // Is this a program?\n  rent_epoch: u64,  // Rent epoch\n}</code></pre><p>Key takeaway: accounts are <strong>owned by programs</strong>, and only the owning program can modify an account's data.</p>",
          },
          {
            id: "lesson-1-3",
            title: "Transactions & Instructions",
            description: "How transactions are structured and processed",
            type: "content",
            order: 2,
            xp: 25,
            duration: "20 min",
            content:
              "<h2>Transactions</h2><p>A Solana transaction contains one or more <strong>instructions</strong>. Each instruction targets a specific program and includes the necessary accounts and data.</p><h3>Transaction Anatomy</h3><ul><li><strong>Signatures</strong> — one or more ed25519 signatures</li><li><strong>Message</strong> — header, account keys, recent blockhash, instructions</li></ul><h3>Instruction Structure</h3><pre><code>Instruction {\n  program_id: Pubkey,\n  accounts: Vec&lt;AccountMeta&gt;,\n  data: Vec&lt;u8&gt;,\n}</code></pre>",
          },
          {
            id: "lesson-1-4",
            title: "Your First Transaction",
            description: "Send a SOL transfer programmatically",
            type: "challenge",
            order: 3,
            xp: 25,
            duration: "25 min",
            challenge: {
              prompt:
                "Write a function that creates and sends a SOL transfer transaction.",
              objectives: [
                "Create a transfer instruction using SystemProgram",
                "Build and sign the transaction",
                "Send and confirm the transaction",
              ],
              starterCode:
                'import { Connection, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction, Keypair } from "@solana/web3.js";\n\nasync function transferSOL(\n  connection: Connection,\n  from: Keypair,\n  to: PublicKey,\n  lamports: number\n): Promise<string> {\n  // TODO: Create transfer instruction\n  // TODO: Build transaction\n  // TODO: Send and confirm\n  return "";\n}',
              language: "typescript",
              solution:
                'import { Connection, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction, Keypair } from "@solana/web3.js";\n\nasync function transferSOL(\n  connection: Connection,\n  from: Keypair,\n  to: PublicKey,\n  lamports: number\n): Promise<string> {\n  const instruction = SystemProgram.transfer({\n    fromPubkey: from.publicKey,\n    toPubkey: to,\n    lamports,\n  });\n  const tx = new Transaction().add(instruction);\n  const sig = await sendAndConfirmTransaction(connection, tx, [from]);\n  return sig;\n}',
              hints: [
                "Use SystemProgram.transfer() to create the instruction",
                "Add the instruction to a new Transaction()",
                "Use sendAndConfirmTransaction to send it",
              ],
              testCases: [
                {
                  id: "tc-1",
                  name: "Creates transfer instruction",
                  input: "",
                  expectedOutput: "SystemProgram.transfer",
                  hidden: false,
                },
                {
                  id: "tc-2",
                  name: "Returns transaction signature",
                  input: "",
                  expectedOutput: "sendAndConfirmTransaction",
                  hidden: false,
                },
              ],
            },
          },
        ],
      },
      {
        id: "mod-2",
        title: "Programs & PDAs",
        description: "Understanding on-chain programs and derived addresses",
        order: 1,
        lessons: [
          {
            id: "lesson-2-1",
            title: "Program Derived Addresses",
            description: "How PDAs work and why they matter",
            type: "content",
            order: 0,
            xp: 25,
            duration: "20 min",
            content:
              '<h2>Program Derived Addresses (PDAs)</h2><p>PDAs are deterministic addresses that fall <strong>off the ed25519 curve</strong>, meaning no private key exists for them. Only the deriving program can sign on their behalf.</p><h3>Deriving a PDA</h3><pre><code>const [pda, bump] = PublicKey.findProgramAddressSync(\n  [Buffer.from("seed"), userKey.toBuffer()],\n  programId\n);</code></pre><h3>Why PDAs?</h3><ul><li>Deterministic — same seeds always produce the same address</li><li>Program-controlled — only the owning program can sign CPIs</li><li>Data storage — commonly used for account initialization</li></ul>',
          },
          {
            id: "lesson-2-2",
            title: "Cross-Program Invocations",
            description: "Calling programs from other programs",
            type: "content",
            order: 1,
            xp: 25,
            duration: "20 min",
            content:
              "<h2>Cross-Program Invocations (CPIs)</h2><p>Programs can call other programs using <code>invoke</code> or <code>invoke_signed</code> (for PDA signers).</p><h3>CPI Example</h3><pre><code>invoke_signed(\n  &transfer_ix,\n  &[from_account, to_account, system_program],\n  &[&[b\"vault\", &[bump]]],  // PDA signer seeds\n)?;</code></pre><p>CPIs enable composability — the key feature that makes Solana programs interoperable.</p>",
          },
          {
            id: "lesson-2-3",
            title: "Build a Counter Program",
            description: "Write a simple counter using PDAs",
            type: "challenge",
            order: 2,
            xp: 25,
            duration: "30 min",
            challenge: {
              prompt: "Complete the increment function for a Solana counter program using Anchor.",
              objectives: [
                "Access the counter account data",
                "Increment the count field",
                "Emit a log message with the new value",
              ],
              starterCode:
                'use anchor_lang::prelude::*;\n\n#[program]\nmod counter {\n    use super::*;\n\n    pub fn increment(ctx: Context<Increment>) -> Result<()> {\n        // TODO: Increment the counter\n        // TODO: Log the new value\n        Ok(())\n    }\n}\n\n#[derive(Accounts)]\npub struct Increment<\'info> {\n    #[account(mut)]\n    pub counter: Account<\'info, Counter>,\n}\n\n#[account]\npub struct Counter {\n    pub count: u64,\n}',
              language: "rust",
              solution:
                'use anchor_lang::prelude::*;\n\n#[program]\nmod counter {\n    use super::*;\n\n    pub fn increment(ctx: Context<Increment>) -> Result<()> {\n        let counter = &mut ctx.accounts.counter;\n        counter.count = counter.count.checked_add(1).unwrap();\n        msg!("Counter incremented to {}", counter.count);\n        Ok(())\n    }\n}\n\n#[derive(Accounts)]\npub struct Increment<\'info> {\n    #[account(mut)]\n    pub counter: Account<\'info, Counter>,\n}\n\n#[account]\npub struct Counter {\n    pub count: u64,\n}',
              hints: [
                "Access the counter with ctx.accounts.counter",
                "Use checked_add(1) for safe arithmetic",
                "Use msg!() macro to log the value",
              ],
              testCases: [
                {
                  id: "tc-1",
                  name: "Increments counter",
                  input: "",
                  expectedOutput: "checked_add",
                  hidden: false,
                },
              ],
            },
          },
          {
            id: "lesson-2-4",
            title: "Token Program Basics",
            description: "Understanding SPL tokens on Solana",
            type: "content",
            order: 3,
            xp: 25,
            duration: "15 min",
            content:
              "<h2>SPL Token Program</h2><p>The SPL Token program is the standard for fungible and non-fungible tokens on Solana.</p><h3>Key Concepts</h3><ul><li><strong>Mint</strong> — defines a token type (supply, decimals, mint authority)</li><li><strong>Token Account (ATA)</strong> — holds tokens for a specific wallet + mint pair</li><li><strong>Token-2022</strong> — extension-based token program with features like non-transferable tokens, permanent delegate, and transfer hooks</li></ul><p>Superteam Academy uses <strong>Token-2022</strong> for XP tokens (NonTransferable + PermanentDelegate) to create soulbound XP.</p>",
          },
        ],
      },
    ],
    whatYouLearn: [
      "Solana's account model and transaction structure",
      "Program Derived Addresses and their use cases",
      "Cross-Program Invocations for composability",
      "SPL Token program and Token-2022 extensions",
    ],
    instructor: {
      name: "Superteam Academy",
      bio: "Official Solana education platform",
    },
  },
  {
    id: "anchor-fundamentals",
    courseId: "anchor-fundamentals",
    title: "Anchor Framework Fundamentals",
    slug: "anchor-fundamentals",
    description:
      "Master the Anchor framework for building Solana programs. Learn account validation, error handling, events, and testing patterns.",
    difficulty: 2,
    lessonCount: 10,
    xpPerLesson: 30,
    trackId: 1,
    trackLevel: 2,
    isActive: true,
    prerequisite: null,
    totalCompletions: 187,
    creatorRewardXp: 300,
    duration: "5 hours",
    thumbnailUrl: "",
    creator: "Superteam Academy",
    modules: [
      {
        id: "anc-mod-1",
        title: "Getting Started with Anchor",
        description: "Setup, project structure, and your first program",
        order: 0,
        lessons: [
          {
            id: "anc-1-1",
            title: "Setting Up Anchor",
            description: "Install Anchor CLI and create your first project",
            type: "content",
            order: 0,
            xp: 30,
            duration: "15 min",
            content:
              "<h2>Anchor Setup</h2><p>Anchor is the most popular framework for building Solana programs. It provides account validation macros, IDL generation, and a TypeScript client.</p><h3>Installation</h3><pre><code>cargo install --git https://github.com/coral-xyz/anchor avm --force\navm install latest\navm use latest\n\n# Verify\nanchor --version</code></pre><h3>New Project</h3><pre><code>anchor init my-program\ncd my-program\nanchor build\nanchor test</code></pre>",
          },
          {
            id: "anc-1-2",
            title: "Account Validation",
            description: "Using #[derive(Accounts)] and constraint macros",
            type: "content",
            order: 1,
            xp: 30,
            duration: "25 min",
            content:
              '<h2>Account Validation in Anchor</h2><p>Anchor\'s <code>#[derive(Accounts)]</code> macro generates account validation code at compile time.</p><h3>Common Constraints</h3><pre><code>#[derive(Accounts)]\npub struct Initialize&lt;\'info&gt; {\n    #[account(\n        init,\n        payer = authority,\n        space = 8 + Config::INIT_SPACE,\n        seeds = [b"config"],\n        bump,\n    )]\n    pub config: Account&lt;\'info, Config&gt;,\n\n    #[account(mut)]\n    pub authority: Signer&lt;\'info&gt;,\n\n    pub system_program: Program&lt;\'info, System&gt;,\n}</code></pre><h3>Key Macros</h3><ul><li><code>init</code> — create + allocate account</li><li><code>seeds</code> + <code>bump</code> — PDA validation</li><li><code>has_one</code> — enforce account relationship</li><li><code>constraint</code> — custom boolean checks</li></ul>',
          },
          {
            id: "anc-1-3",
            title: "Error Handling",
            description: "Custom errors with #[error_code]",
            type: "content",
            order: 2,
            xp: 30,
            duration: "15 min",
            content:
              '<h2>Error Handling</h2><p>Anchor provides the <code>#[error_code]</code> macro for defining custom program errors.</p><pre><code>#[error_code]\npub enum AcademyError {\n    #[msg("Course is not active")]\n    CourseNotActive,\n\n    #[msg("Learner already enrolled")]\n    AlreadyEnrolled,\n\n    #[msg("Lesson already completed")]\n    LessonAlreadyCompleted,\n}</code></pre><p>Use <code>require!</code> for clean validation:</p><pre><code>require!(course.is_active, AcademyError::CourseNotActive);\nrequire!(!enrollment.is_completed, AcademyError::AlreadyCompleted);</code></pre>',
          },
          {
            id: "anc-1-4",
            title: "Events & Logging",
            description: "Emitting events for off-chain indexing",
            type: "content",
            order: 3,
            xp: 30,
            duration: "15 min",
            content:
              '<h2>Events in Anchor</h2><p>Events allow off-chain services to react to program state changes.</p><pre><code>#[event]\npub struct LessonCompleted {\n    pub enrollment: Pubkey,\n    pub lesson_index: u8,\n    pub xp_awarded: u64,\n    pub timestamp: i64,\n}</code></pre><p>Emit events in instruction handlers:</p><pre><code>emit!(LessonCompleted {\n    enrollment: ctx.accounts.enrollment.key(),\n    lesson_index,\n    xp_awarded: course.xp_per_lesson,\n    timestamp: Clock::get()?.unix_timestamp,\n});</code></pre>',
          },
          {
            id: "anc-1-5",
            title: "Write a Vault Program",
            description: "Build a SOL vault with deposit and withdraw",
            type: "challenge",
            order: 4,
            xp: 30,
            duration: "30 min",
            challenge: {
              prompt: "Complete the deposit instruction for a SOL vault program.",
              objectives: [
                "Transfer SOL from user to vault PDA",
                "Update the vault balance tracker",
                "Emit a DepositEvent",
              ],
              starterCode:
                'use anchor_lang::prelude::*;\nuse anchor_lang::system_program;\n\n#[program]\nmod vault {\n    use super::*;\n\n    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {\n        // TODO: Transfer SOL to vault\n        // TODO: Update vault.total_deposited\n        // TODO: Emit event\n        Ok(())\n    }\n}\n\n#[derive(Accounts)]\npub struct Deposit<\'info> {\n    #[account(mut)]\n    pub user: Signer<\'info>,\n    \n    #[account(mut, seeds = [b"vault"], bump)]\n    pub vault: Account<\'info, Vault>,\n    \n    pub system_program: Program<\'info, System>,\n}\n\n#[account]\npub struct Vault {\n    pub total_deposited: u64,\n    pub bump: u8,\n}',
              language: "rust",
              solution:
                'use anchor_lang::prelude::*;\nuse anchor_lang::system_program;\n\n#[program]\nmod vault {\n    use super::*;\n\n    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {\n        system_program::transfer(\n            CpiContext::new(\n                ctx.accounts.system_program.to_account_info(),\n                system_program::Transfer {\n                    from: ctx.accounts.user.to_account_info(),\n                    to: ctx.accounts.vault.to_account_info(),\n                },\n            ),\n            amount,\n        )?;\n\n        let vault = &mut ctx.accounts.vault;\n        vault.total_deposited = vault.total_deposited.checked_add(amount).unwrap();\n\n        emit!(DepositEvent {\n            user: ctx.accounts.user.key(),\n            amount,\n            total: vault.total_deposited,\n        });\n\n        Ok(())\n    }\n}',
              hints: [
                "Use system_program::transfer with CpiContext::new",
                "Always use checked_add for arithmetic safety",
                "Define a DepositEvent with #[event]",
              ],
              testCases: [
                {
                  id: "tc-1",
                  name: "Transfers SOL",
                  input: "",
                  expectedOutput: "system_program::transfer",
                  hidden: false,
                },
                {
                  id: "tc-2",
                  name: "Updates balance",
                  input: "",
                  expectedOutput: "checked_add",
                  hidden: false,
                },
              ],
            },
          },
        ],
      },
      {
        id: "anc-mod-2",
        title: "Testing & Deployment",
        description: "TypeScript testing and devnet deployment",
        order: 1,
        lessons: [
          {
            id: "anc-2-1",
            title: "TypeScript Test Setup",
            description: "Writing integration tests with Anchor",
            type: "content",
            order: 0,
            xp: 30,
            duration: "20 min",
            content:
              '<h2>Testing with Anchor</h2><p>Anchor generates a TypeScript client from your IDL automatically.</p><pre><code>import * as anchor from "@coral-xyz/anchor";\nimport { Program } from "@coral-xyz/anchor";\nimport { MyProgram } from "../target/types/my_program";\n\ndescribe("my-program", () =&gt; {\n  const provider = anchor.AnchorProvider.env();\n  anchor.setProvider(provider);\n  const program = anchor.workspace.myProgram as Program&lt;MyProgram&gt;;\n\n  it("initializes correctly", async () =&gt; {\n    const tx = await program.methods\n      .initialize()\n      .accounts({ ... })\n      .rpc();\n    console.log("tx:", tx);\n  });\n});</code></pre>',
          },
          {
            id: "anc-2-2",
            title: "Rust Unit Tests",
            description: "Testing with Mollusk and LiteSVM",
            type: "content",
            order: 1,
            xp: 30,
            duration: "20 min",
            content:
              '<h2>Rust Unit Testing</h2><p>Use <strong>Mollusk</strong> for instruction-level testing and <strong>LiteSVM</strong> for full integration tests.</p><h3>Mollusk Example</h3><pre><code>use mollusk_svm::Mollusk;\n\n#[test]\nfn test_initialize() {\n    let mollusk = Mollusk::new(&program_id, "onchain_academy");\n    let result = mollusk.process_instruction(\n        &instruction,\n        &accounts,\n    );\n    assert!(result.is_ok());\n}</code></pre>',
          },
          {
            id: "anc-2-3",
            title: "Devnet Deployment",
            description: "Deploy your program to Solana devnet",
            type: "content",
            order: 2,
            xp: 30,
            duration: "15 min",
            content:
              "<h2>Deploying to Devnet</h2><pre><code># Configure for devnet\nsolana config set --url devnet\n\n# Airdrop SOL for deployment\nsolana airdrop 2\n\n# Build verifiably\nanchor build --verifiable\n\n# Deploy\nanchor deploy --provider.cluster devnet</code></pre><h3>Verify Deployment</h3><pre><code># Check program\nsolana program show &lt;PROGRAM_ID&gt;\n\n# View on explorer\n# https://explorer.solana.com/address/&lt;PROGRAM_ID&gt;?cluster=devnet</code></pre>",
          },
          {
            id: "anc-2-4",
            title: "Write Integration Tests",
            description: "Complete an Anchor integration test",
            type: "challenge",
            order: 3,
            xp: 30,
            duration: "25 min",
            challenge: {
              prompt:
                "Write an integration test for the initialize instruction.",
              objectives: [
                "Derive the config PDA correctly",
                "Call the initialize method",
                "Assert the config account state",
              ],
              starterCode:
                'import * as anchor from "@coral-xyz/anchor";\nimport { expect } from "chai";\n\ndescribe("initialize", () => {\n  const provider = anchor.AnchorProvider.env();\n  anchor.setProvider(provider);\n\n  it("initializes the config account", async () => {\n    // TODO: Derive config PDA\n    // TODO: Call initialize\n    // TODO: Fetch and assert config state\n  });\n});',
              language: "typescript",
              solution:
                'import * as anchor from "@coral-xyz/anchor";\nimport { expect } from "chai";\n\ndescribe("initialize", () => {\n  const provider = anchor.AnchorProvider.env();\n  anchor.setProvider(provider);\n  const program = anchor.workspace.myProgram;\n\n  it("initializes the config account", async () => {\n    const [configPda] = anchor.web3.PublicKey.findProgramAddressSync(\n      [Buffer.from("config")],\n      program.programId\n    );\n\n    await program.methods\n      .initialize()\n      .accounts({\n        config: configPda,\n        authority: provider.wallet.publicKey,\n        systemProgram: anchor.web3.SystemProgram.programId,\n      })\n      .rpc();\n\n    const config = await program.account.config.fetch(configPda);\n    expect(config.authority.toString()).to.equal(\n      provider.wallet.publicKey.toString()\n    );\n  });\n});',
              hints: [
                "Use PublicKey.findProgramAddressSync with [Buffer.from('config')]",
                "Call program.methods.initialize().accounts({...}).rpc()",
                "Fetch account with program.account.config.fetch(pda)",
              ],
              testCases: [
                {
                  id: "tc-1",
                  name: "Derives PDA",
                  input: "",
                  expectedOutput: "findProgramAddressSync",
                  hidden: false,
                },
                {
                  id: "tc-2",
                  name: "Fetches and asserts state",
                  input: "",
                  expectedOutput: "fetch",
                  hidden: false,
                },
              ],
            },
          },
          {
            id: "anc-2-5",
            title: "Security Best Practices",
            description: "Common vulnerabilities and how to prevent them",
            type: "content",
            order: 4,
            xp: 30,
            duration: "20 min",
            content:
              "<h2>Security Checklist</h2><ul><li><strong>Signer checks</strong> — always validate Signer constraint</li><li><strong>Owner checks</strong> — verify account owners match expected programs</li><li><strong>PDA bumps</strong> — store canonical bump, never recalculate</li><li><strong>Arithmetic</strong> — use checked_add/sub/mul, never raw +/-</li><li><strong>CPI targets</strong> — validate program_id before CPI</li><li><strong>Reinitialization</strong> — prevent re-init of existing accounts</li><li><strong>Account closing</strong> — zero data before closing to prevent revival</li></ul><p>Follow the <a href='https://github.com/coral-xyz/sealevel-attacks'>Sealevel Attacks</a> repo for a comprehensive list.</p>",
          },
        ],
      },
    ],
    whatYouLearn: [
      "Anchor framework setup and project structure",
      "Account validation with derive macros",
      "Custom errors and events",
      "Testing with TypeScript and Rust",
      "Devnet deployment workflow",
    ],
    instructor: {
      name: "Superteam Academy",
      bio: "Official Solana education platform",
    },
  },
  {
    id: "token-extensions",
    courseId: "token-extensions",
    title: "Token-2022 & Extensions",
    slug: "token-extensions",
    description:
      "Deep dive into Token-2022 extensions: NonTransferable, PermanentDelegate, TransferFee, TransferHook, and more.",
    difficulty: 2,
    lessonCount: 6,
    xpPerLesson: 35,
    trackId: 2,
    trackLevel: 1,
    isActive: true,
    prerequisite: null,
    totalCompletions: 94,
    creatorRewardXp: 210,
    duration: "3 hours",
    thumbnailUrl: "",
    creator: "Superteam Academy",
    modules: [
      {
        id: "tok-mod-1",
        title: "Token-2022 Overview",
        description: "Understanding the extension model",
        order: 0,
        lessons: [
          {
            id: "tok-1-1",
            title: "Why Token-2022?",
            description: "Motivation and architecture of the extension-based token program",
            type: "content",
            order: 0,
            xp: 35,
            duration: "15 min",
            content:
              "<h2>Token-2022</h2><p>Token-2022 (Token Extensions) is Solana's next-gen token standard. It supports <strong>extensions</strong> that add features directly to mint and token accounts.</p><h3>Key Extensions</h3><ul><li><strong>NonTransferable</strong> — soulbound tokens (XP, badges)</li><li><strong>PermanentDelegate</strong> — authority that can always burn/transfer</li><li><strong>TransferFee</strong> — protocol-level fees on transfers</li><li><strong>TransferHook</strong> — custom logic on every transfer</li><li><strong>MetadataPointer</strong> — on-chain metadata without Metaplex</li></ul>",
          },
          {
            id: "tok-1-2",
            title: "Creating Soulbound Tokens",
            description: "NonTransferable + PermanentDelegate for XP",
            type: "content",
            order: 1,
            xp: 35,
            duration: "25 min",
            content:
              "<h2>Soulbound XP Tokens</h2><p>Superteam Academy uses Token-2022 with two extensions to create soulbound XP:</p><h3>Extension Setup</h3><pre><code>// 1. Calculate space for extensions\nlet extensions = [\n    ExtensionType::NonTransferable,\n    ExtensionType::PermanentDelegate,\n];\nlet space = ExtensionType::try_calculate_account_len::&lt;Mint&gt;(&extensions)?;\n\n// 2. Initialize extensions BEFORE InitializeMint\n// NonTransferable — no extra data needed\n// PermanentDelegate — set delegate to config PDA\ninitialize_permanent_delegate(\n    &token_2022_program.key(),\n    &xp_mint.key(),\n    &config.key(),  // config PDA is permanent delegate\n)?;</code></pre>",
          },
          {
            id: "tok-1-3",
            title: "Minting XP Tokens",
            description: "CPI to Token-2022 for minting",
            type: "challenge",
            order: 2,
            xp: 35,
            duration: "25 min",
            challenge: {
              prompt: "Complete the mint_xp helper function that mints XP tokens via CPI.",
              objectives: [
                "Create CPI context with signer seeds",
                "Call mint_to on Token-2022",
                "Handle the PDA signer correctly",
              ],
              starterCode:
                "use anchor_lang::prelude::*;\nuse anchor_spl::token_2022;\n\npub fn mint_xp<'info>(\n    token_program: &AccountInfo<'info>,\n    mint: &AccountInfo<'info>,\n    to: &AccountInfo<'info>,\n    authority: &AccountInfo<'info>,\n    amount: u64,\n    signer_seeds: &[&[&[u8]]],\n) -> Result<()> {\n    // TODO: Create CPI context with signer\n    // TODO: Call token_2022::mint_to\n    Ok(())\n}",
              language: "rust",
              solution:
                "use anchor_lang::prelude::*;\nuse anchor_spl::token_2022;\n\npub fn mint_xp<'info>(\n    token_program: &AccountInfo<'info>,\n    mint: &AccountInfo<'info>,\n    to: &AccountInfo<'info>,\n    authority: &AccountInfo<'info>,\n    amount: u64,\n    signer_seeds: &[&[&[u8]]],\n) -> Result<()> {\n    let cpi_accounts = token_2022::MintTo {\n        mint: mint.to_account_info(),\n        to: to.to_account_info(),\n        authority: authority.to_account_info(),\n    };\n    let cpi_ctx = CpiContext::new_with_signer(\n        token_program.to_account_info(),\n        cpi_accounts,\n        signer_seeds,\n    );\n    token_2022::mint_to(cpi_ctx, amount)\n}",
              hints: [
                "Use token_2022::MintTo struct for CPI accounts",
                "Use CpiContext::new_with_signer for PDA authority",
                "Call token_2022::mint_to(ctx, amount)",
              ],
              testCases: [
                {
                  id: "tc-1",
                  name: "Creates signer context",
                  input: "",
                  expectedOutput: "new_with_signer",
                  hidden: false,
                },
              ],
            },
          },
        ],
      },
      {
        id: "tok-mod-2",
        title: "Advanced Extensions",
        description: "TransferFee, TransferHook, and metadata",
        order: 1,
        lessons: [
          {
            id: "tok-2-1",
            title: "Transfer Fees",
            description: "Implementing protocol-level transfer fees",
            type: "content",
            order: 0,
            xp: 35,
            duration: "20 min",
            content:
              "<h2>Transfer Fee Extension</h2><p>Charge a fee on every token transfer, collected in each recipient's token account.</p><pre><code>initialize_transfer_fee_config(\n    &token_2022_program.key(),\n    &mint.key(),\n    Some(&fee_authority.key()),   // can update config\n    Some(&withdraw_authority.key()), // can withdraw fees  \n    250,  // 2.5% (basis points)\n    1_000_000, // max fee\n)?;</code></pre>",
          },
          {
            id: "tok-2-2",
            title: "Transfer Hooks",
            description: "Custom logic executed on every transfer",
            type: "content",
            order: 1,
            xp: 35,
            duration: "25 min",
            content:
              "<h2>Transfer Hook Extension</h2><p>Execute a custom program on every token transfer — powerful for compliance, royalties, and game logic.</p><h3>How It Works</h3><ol><li>Create a program that implements the Transfer Hook interface</li><li>Attach the hook program to the mint</li><li>Every transfer CPI includes extra accounts for the hook</li></ol>",
          },
          {
            id: "tok-2-3",
            title: "Metadata Pointer",
            description: "On-chain metadata without Metaplex",
            type: "content",
            order: 2,
            xp: 35,
            duration: "15 min",
            content:
              "<h2>MetadataPointer Extension</h2><p>Token-2022 can store metadata directly on the mint account, removing the need for a separate Metaplex metadata account.</p><pre><code>// Point metadata to the mint itself\ninitialize_metadata_pointer(\n    &token_2022_program.key(),\n    &mint.key(),\n    None,           // no external authority\n    Some(mint.key()), // metadata lives on the mint\n)?;</code></pre><p>Then initialize the Token Metadata with name, symbol, and URI.</p>",
          },
        ],
      },
    ],
    whatYouLearn: [
      "Token-2022 architecture and extension model",
      "Building soulbound tokens with NonTransferable",
      "Transfer fees and hooks for DeFi protocols",
      "On-chain metadata without Metaplex",
    ],
    instructor: {
      name: "Superteam Academy",
      bio: "Official Solana education platform",
    },
  },
  {
    id: "metaplex-core",
    courseId: "metaplex-core",
    title: "Metaplex Core NFTs",
    slug: "metaplex-core-nfts",
    description:
      "Build with Metaplex Core — the next-gen NFT standard. Create collections, mint NFTs, add plugins for soulbound credentials.",
    difficulty: 2,
    lessonCount: 5,
    xpPerLesson: 35,
    trackId: 2,
    trackLevel: 2,
    isActive: true,
    prerequisite: null,
    totalCompletions: 68,
    creatorRewardXp: 175,
    duration: "2.5 hours",
    thumbnailUrl: "",
    creator: "Superteam Academy",
    modules: [
      {
        id: "mpx-mod-1",
        title: "Metaplex Core Fundamentals",
        description: "Collections, assets, and plugins",
        order: 0,
        lessons: [
          {
            id: "mpx-1-1",
            title: "Metaplex Core Overview",
            description: "Architecture of the Core NFT standard",
            type: "content",
            order: 0,
            xp: 35,
            duration: "15 min",
            content:
              "<h2>Metaplex Core</h2><p>Core is Metaplex's newest NFT standard — simpler, cheaper, and more flexible than Token Metadata.</p><h3>Key Features</h3><ul><li><strong>Single account</strong> — asset data lives in one account (not 3+)</li><li><strong>Plugin system</strong> — composable behaviors (freeze, royalties, attributes)</li><li><strong>~0.0014 SOL</strong> mint cost (vs 0.012 SOL for Token Metadata)</li><li><strong>Collection-level plugins</strong> — apply rules to all assets in a collection</li></ul>",
          },
          {
            id: "mpx-1-2",
            title: "Creating Collections",
            description: "Set up a credential collection",
            type: "content",
            order: 1,
            xp: 35,
            duration: "20 min",
            content:
              '<h2>Creating a Collection</h2><pre><code>use mpl_core::instructions::CreateCollectionV2Builder;\n\nCreateCollectionV2Builder::new()\n    .collection(collection.key())\n    .payer(payer.key())\n    .name("Superteam Credentials".to_string())\n    .uri(metadata_uri.to_string())\n    .plugins(vec![\n        PluginAuthorityPair {\n            plugin: Plugin::PermanentFreezeDelegate(\n                PermanentFreezeDelegate { frozen: true }\n            ),\n            authority: Some(PluginAuthority::UpdateAuthority),\n        },\n    ])\n    .invoke()?;</code></pre>',
          },
          {
            id: "mpx-1-3",
            title: "Minting Soulbound Credentials",
            description: "Create frozen NFTs as course credentials",
            type: "challenge",
            order: 2,
            xp: 35,
            duration: "30 min",
            challenge: {
              prompt: "Complete the credential minting function using Metaplex Core CPI.",
              objectives: [
                "Build the CreateV2 instruction",
                "Add PermanentFreezeDelegate plugin",
                "Set the credential attributes",
              ],
              starterCode:
                "// Complete the mint_credential function\npub fn mint_credential(\n    // accounts...\n    name: String,\n    uri: String,\n    track_id: u8,\n    total_xp: u64,\n) -> Result<()> {\n    // TODO: Build CreateV2 CPI\n    // TODO: Add PermanentFreezeDelegate\n    // TODO: Add Attributes plugin with track data\n    Ok(())\n}",
              language: "rust",
              solution:
                "// Mint credential with Metaplex Core\npub fn mint_credential(\n    // accounts...\n    name: String,\n    uri: String,\n    track_id: u8,\n    total_xp: u64,\n) -> Result<()> {\n    let create_ix = CreateV2Builder::new()\n        .asset(asset.key())\n        .collection(Some(collection.key()))\n        .payer(payer.key())\n        .owner(Some(learner.key()))\n        .name(name)\n        .uri(uri)\n        .plugins(vec![\n            PluginAuthorityPair {\n                plugin: Plugin::PermanentFreezeDelegate(\n                    PermanentFreezeDelegate { frozen: true }\n                ),\n                authority: Some(PluginAuthority::UpdateAuthority),\n            },\n            PluginAuthorityPair {\n                plugin: Plugin::Attributes(Attributes {\n                    attribute_list: vec![\n                        Attribute { key: \"track\".to_string(), value: track_id.to_string() },\n                        Attribute { key: \"xp\".to_string(), value: total_xp.to_string() },\n                    ],\n                }),\n                authority: Some(PluginAuthority::UpdateAuthority),\n            },\n        ])\n        .invoke()?;\n    Ok(())\n}",
              hints: [
                "Use CreateV2Builder from mpl_core",
                "PermanentFreezeDelegate with frozen: true makes it soulbound",
                "Attributes plugin stores key-value metadata",
              ],
              testCases: [
                {
                  id: "tc-1",
                  name: "Creates with freeze delegate",
                  input: "",
                  expectedOutput: "PermanentFreezeDelegate",
                  hidden: false,
                },
              ],
            },
          },
        ],
      },
      {
        id: "mpx-mod-2",
        title: "Credential Upgrades",
        description: "Updating attributes on existing credentials",
        order: 1,
        lessons: [
          {
            id: "mpx-2-1",
            title: "Updating Attributes",
            description: "Upgrade credential level when learner progresses",
            type: "content",
            order: 0,
            xp: 35,
            duration: "15 min",
            content:
              "<h2>Upgrading Credentials</h2><p>When a learner completes more courses in a track, their credential NFT can be upgraded via the <code>UpdatePluginV2</code> instruction.</p><pre><code>UpdatePluginV2Builder::new()\n    .asset(asset.key())\n    .collection(Some(collection.key()))\n    .payer(payer.key())\n    .plugin(Plugin::Attributes(Attributes {\n        attribute_list: vec![\n            Attribute { key: \"level\".to_string(), value: new_level.to_string() },\n            Attribute { key: \"xp\".to_string(), value: new_xp.to_string() },\n        ],\n    }))\n    .invoke()?;</code></pre>",
          },
          {
            id: "mpx-2-2",
            title: "Querying with DAS API",
            description: "Use Helius DAS to query NFT collections",
            type: "content",
            order: 1,
            xp: 35,
            duration: "15 min",
            content:
              '<h2>DAS API (Digital Asset Standard)</h2><p>Helius provides the DAS API for efficient NFT queries — much faster than iterating on-chain accounts.</p><pre><code>const response = await fetch(heliusUrl, {\n  method: "POST",\n  body: JSON.stringify({\n    jsonrpc: "2.0",\n    id: "1",\n    method: "getAssetsByOwner",\n    params: {\n      ownerAddress: wallet.publicKey.toBase58(),\n      page: 1,\n      limit: 100,\n    },\n  }),\n});\n\nconst assets = result.items.filter(\n  (a) => a.grouping?.[0]?.group_value === collectionAddress\n);</code></pre>',
          },
        ],
      },
    ],
    whatYouLearn: [
      "Metaplex Core architecture and plugin system",
      "Creating collections with permanent freeze",
      "Minting soulbound credential NFTs",
      "Upgrading credentials via attribute updates",
      "Querying collections with Helius DAS API",
    ],
    instructor: {
      name: "Superteam Academy",
      bio: "Official Solana education platform",
    },
  },
  {
    id: "defi-on-solana",
    courseId: "defi-on-solana",
    title: "DeFi on Solana",
    slug: "defi-on-solana",
    description:
      "Build DeFi protocols on Solana — AMMs, lending, oracles, and liquidation engines.",
    difficulty: 3,
    lessonCount: 8,
    xpPerLesson: 40,
    trackId: 3,
    trackLevel: 1,
    isActive: true,
    prerequisite: null,
    totalCompletions: 45,
    creatorRewardXp: 320,
    duration: "6 hours",
    thumbnailUrl: "",
    creator: "Superteam Academy",
    modules: [
      {
        id: "defi-mod-1",
        title: "DeFi Primitives",
        description: "Core building blocks of DeFi on Solana",
        order: 0,
        lessons: [
          {
            id: "defi-1-1",
            title: "AMM Design Patterns",
            description: "Constant product, concentrated liquidity",
            type: "content",
            order: 0,
            xp: 40,
            duration: "25 min",
            content:
              "<h2>AMM Design on Solana</h2><p>Automated Market Makers are the backbone of on-chain trading.</p><h3>Constant Product Formula</h3><p>$$x \\cdot y = k$$</p><p>Where $x$ and $y$ are token reserves and $k$ remains constant after swaps.</p><h3>Solana Advantages</h3><ul><li>Sub-second finality for real-time trading</li><li>Low fees (~$0.00025) make small swaps viable</li><li>Parallel execution for multiple pools</li></ul>",
          },
          {
            id: "defi-1-2",
            title: "Oracle Integration",
            description: "Using Pyth and Switchboard for price feeds",
            type: "content",
            order: 1,
            xp: 40,
            duration: "20 min",
            content:
              '<h2>Oracle Integration</h2><p>Price oracles provide external data to on-chain programs.</p><h3>Pyth Network</h3><pre><code>use pyth_sdk_solana::load_price_feed_from_account_info;\n\nlet price_feed = load_price_feed_from_account_info(\n    &ctx.accounts.pyth_price_account\n)?;\nlet price = price_feed\n    .get_price_no_older_than(clock.unix_timestamp, 60)\n    .ok_or(ErrorCode::StalePriceFeed)?;</code></pre>',
          },
        ],
      },
    ],
    whatYouLearn: [
      "AMM design patterns on Solana",
      "Oracle integration with Pyth",
      "Lending protocol architecture",
      "Liquidation engine design",
    ],
    instructor: {
      name: "Superteam Academy",
      bio: "Official Solana education platform",
    },
  },
  {
    id: "solana-mobile",
    courseId: "solana-mobile",
    title: "Solana Mobile (dApp Store)",
    slug: "solana-mobile",
    description:
      "Build mobile-first dApps using Solana Mobile Stack, Mobile Wallet Adapter, and publish to the Solana dApp Store.",
    difficulty: 2,
    lessonCount: 6,
    xpPerLesson: 30,
    trackId: 4,
    trackLevel: 1,
    isActive: true,
    prerequisite: null,
    totalCompletions: 31,
    creatorRewardXp: 180,
    duration: "4 hours",
    thumbnailUrl: "",
    creator: "Superteam Academy",
    modules: [
      {
        id: "mob-mod-1",
        title: "Solana Mobile Stack",
        description: "Mobile Wallet Adapter and SDK",
        order: 0,
        lessons: [
          {
            id: "mob-1-1",
            title: "Mobile Wallet Adapter",
            description: "Connect mobile wallets to your dApp",
            type: "content",
            order: 0,
            xp: 30,
            duration: "20 min",
            content:
              "<h2>Mobile Wallet Adapter (MWA)</h2><p>MWA is the standard protocol for connecting Solana wallets on mobile devices.</p><h3>How It Works</h3><ol><li>Your app broadcasts an association request</li><li>Compatible wallets respond via local socket</li><li>User approves the connection in their wallet</li><li>Your app receives signing capabilities</li></ol>",
          },
        ],
      },
    ],
    whatYouLearn: [
      "Solana Mobile Stack architecture",
      "Mobile Wallet Adapter integration",
      "dApp Store publishing process",
    ],
    instructor: {
      name: "Superteam Academy",
      bio: "Official Solana education platform",
    },
  },
];

export const mockCourseService: CourseService = {
  async getCourses(params) {
    let courses = [...MOCK_COURSES];

    if (params?.difficulty) {
      courses = courses.filter(
        (c) => c.difficulty === Number(params.difficulty)
      );
    }
    if (params?.track) {
      courses = courses.filter((c) => c.trackId === Number(params.track));
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      courses = courses.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
      );
    }

    return courses;
  },

  async getCourseBySlug(slug) {
    return MOCK_COURSES.find((c) => c.slug === slug) ?? null;
  },

  async getCourseById(courseId) {
    return MOCK_COURSES.find((c) => c.courseId === courseId) ?? null;
  },

  async getFeaturedCourses() {
    return MOCK_COURSES.slice(0, 4);
  },

  async getCoursesByTrack(trackId) {
    return MOCK_COURSES.filter((c) => c.trackId === trackId);
  },

  async searchCourses(query) {
    const q = query.toLowerCase();
    return MOCK_COURSES.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    );
  },

  async getTotalCourseCount() {
    return MOCK_COURSES.length;
  },
};
