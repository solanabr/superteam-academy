import type { Course, Achievement, LeaderboardEntry, UserProfile, ActivityItem, CourseProgress } from "@/types";

export const MOCK_COURSES: Course[] = [
    {
        id: "1",
        slug: "solana-fundamentals",
        courseId: "solana-fundamentals",
        title: "Solana Fundamentals",
        description: "Learn the basics of Solana blockchain, accounts, transactions, and the programming model.",
        longDescription: "This comprehensive course takes you through the fundamentals of Solana blockchain technology. You'll learn about Solana's unique architecture, how accounts and transactions work, and the programming model that makes Solana the fastest blockchain. By the end, you'll have a solid foundation to build upon.",
        thumbnail: "/images/courses/solana-fundamentals.jpg",
        difficulty: "beginner",
        duration: 480,
        lessonCount: 12,
        xpPerLesson: 25,
        xpReward: 800,
        track: "Solana Fundamentals",
        trackColor: "#9945ff",
        instructor: { name: "Maria Silva", avatar: "/images/avatars/maria.jpg", title: "Senior Solana Developer" },
        prerequisites: [],
        tags: ["solana", "blockchain", "web3", "fundamentals"],
        objectives: [
            "Understand Solana's architecture and consensus mechanism",
            "Work with accounts, transactions, and programs",
            "Set up a Solana development environment",
            "Deploy your first program on devnet"
        ],
        modules: [
            {
                id: "m1",
                title: "Introduction to Solana",
                description: "Understanding the Solana ecosystem",
                lessons: [
                    { id: "l1", title: "What is Solana?", description: "Overview of Solana blockchain", type: "content", duration: 20, xpReward: 25, order: 0, content: "# What is Solana?\n\nSolana is a high-performance blockchain platform designed for decentralized applications and crypto-currencies. It uses a unique combination of **Proof of History (PoH)** and **Proof of Stake (PoS)** to achieve high throughput.\n\n## Key Features\n\n- **65,000+ TPS** - Transactions per second\n- **400ms** block times\n- **$0.00025** average transaction cost\n- **Carbon neutral** since 2021\n\n## Architecture\n\nSolana uses 8 key innovations:\n\n1. **Proof of History** - A clock before consensus\n2. **Tower BFT** - PoH-optimized version of PBFT\n3. **Turbine** - Block propagation protocol\n4. **Gulf Stream** - Mempool-less transaction forwarding\n5. **Sealevel** - Parallel smart contract runtime\n6. **Pipelining** - Transaction processing optimization\n7. **Cloudbreak** - Horizontally-scaled accounts database\n8. **Archivers** - Distributed ledger storage" },
                    { id: "l2", title: "Accounts Model", description: "How Solana stores data", type: "content", duration: 30, xpReward: 25, order: 1, content: "# Solana Accounts Model\n\nEverything in Solana is an **account**. Accounts are the fundamental data unit.\n\n## Account Structure\n\n```rust\npub struct Account {\n    pub lamports: u64,        // Balance\n    pub data: Vec<u8>,        // Data stored\n    pub owner: Pubkey,        // Program that owns this account\n    pub executable: bool,     // Is this a program?\n    pub rent_epoch: u64,      // When rent was last paid\n}\n```\n\n## Key Concepts\n\n- Accounts can hold up to **10MB** of data\n- Accounts must maintain a **rent-exempt** balance\n- Only the **owner program** can modify account data\n- The **System Program** owns all wallet accounts" },
                    { id: "l3", title: "Your First Transaction", description: "Send your first Solana transaction", type: "challenge", duration: 45, xpReward: 50, order: 2, challenge: { prompt: "Create a function that transfers SOL from one account to another using @solana/web3.js", objectives: ["Import required modules", "Create a transfer instruction", "Sign and send the transaction"], starterCode: "import { Connection, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';\n\nasync function transferSOL(from: Keypair, to: PublicKey, amount: number) {\n  // TODO: Create connection to devnet\n  \n  // TODO: Create transfer instruction\n  \n  // TODO: Send and confirm transaction\n}", language: "typescript", testCases: [{ id: "t1", name: "Creates connection", input: "", expectedOutput: "Connection created", isHidden: false }, { id: "t2", name: "Creates transfer instruction", input: "", expectedOutput: "Instruction created", isHidden: false }, { id: "t3", name: "Sends transaction", input: "", expectedOutput: "Transaction sent", isHidden: false }], hints: ["Use new Connection('https://api.devnet.solana.com')", "Use SystemProgram.transfer() to create the instruction"], solution: "import { Connection, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';\n\nasync function transferSOL(from: Keypair, to: PublicKey, amount: number) {\n  const connection = new Connection('https://api.devnet.solana.com');\n  \n  const transaction = new Transaction().add(\n    SystemProgram.transfer({\n      fromPubkey: from.publicKey,\n      toPubkey: to,\n      lamports: amount * LAMPORTS_PER_SOL,\n    })\n  );\n  \n  const signature = await sendAndConfirmTransaction(connection, transaction, [from]);\n  return signature;\n}" } }
                ]
            },
            {
                id: "m2",
                title: "Development Environment",
                description: "Setting up your Solana dev tools",
                lessons: [
                    { id: "l4", title: "Installing Solana CLI", description: "Set up the Solana command line tools", type: "content", duration: 25, xpReward: 25, order: 3, content: "# Installing Solana CLI\n\n## macOS / Linux\n\n```bash\nsh -c \"$(curl -sSfL https://release.anza.xyz/stable/install)\"\n```\n\n## Verify Installation\n\n```bash\nsolana --version\nsolana-keygen --version\n```\n\n## Configuration\n\n```bash\n# Set to devnet\nsolana config set --url devnet\n\n# Create a new keypair\nsolana-keygen new\n\n# Airdrop SOL for testing\nsolana airdrop 2\n```" },
                    { id: "l5", title: "Anchor Framework Setup", description: "Install and configure Anchor", type: "content", duration: 30, xpReward: 25, order: 4, content: "# Anchor Framework\n\nAnchor is the most popular framework for Solana program development.\n\n## Install\n\n```bash\ncargo install --git https://github.com/coral-xyz/anchor avm --force\navm install latest\navm use latest\n```\n\n## Create a Project\n\n```bash\nanchor init my-project\ncd my-project\nanchor build\nanchor test\n```" },
                    { id: "l6", title: "Build a Counter Program", description: "Your first Anchor program", type: "challenge", duration: 60, xpReward: 75, order: 5, challenge: { prompt: "Build a simple counter program using Anchor that can increment and decrement a counter.", objectives: ["Define the Counter account struct", "Implement the increment instruction", "Implement the decrement instruction"], starterCode: "use anchor_lang::prelude::*;\n\ndeclare_id!(\"YOUR_PROGRAM_ID\");\n\n#[program]\npub mod counter {\n    use super::*;\n\n    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {\n        // TODO: Initialize counter to 0\n        Ok(())\n    }\n\n    pub fn increment(ctx: Context<Update>) -> Result<()> {\n        // TODO: Increment counter\n        Ok(())\n    }\n}\n\n#[derive(Accounts)]\npub struct Initialize<'info> {\n    // TODO: Define accounts\n}\n\n#[account]\npub struct Counter {\n    // TODO: Define counter field\n}", language: "rust", testCases: [{ id: "t1", name: "Counter initializes to 0", input: "", expectedOutput: "Counter: 0", isHidden: false }, { id: "t2", name: "Increment works", input: "", expectedOutput: "Counter: 1", isHidden: false }], hints: ["Use #[account(init, payer = user, space = 8 + 8)] for init", "counter.count += 1 for increment"], solution: "use anchor_lang::prelude::*;\n\ndeclare_id!(\"YOUR_PROGRAM_ID\");\n\n#[program]\npub mod counter {\n    use super::*;\n\n    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {\n        ctx.accounts.counter.count = 0;\n        Ok(())\n    }\n\n    pub fn increment(ctx: Context<Update>) -> Result<()> {\n        ctx.accounts.counter.count += 1;\n        Ok(())\n    }\n}\n\n#[derive(Accounts)]\npub struct Initialize<'info> {\n    #[account(init, payer = user, space = 8 + 8)]\n    pub counter: Account<'info, Counter>,\n    #[account(mut)]\n    pub user: Signer<'info>,\n    pub system_program: Program<'info, System>,\n}\n\n#[derive(Accounts)]\npub struct Update<'info> {\n    #[account(mut)]\n    pub counter: Account<'info, Counter>,\n}\n\n#[account]\npub struct Counter {\n    pub count: u64,\n}" } }
                ]
            },
            {
                id: "m3",
                title: "Programs & Instructions",
                description: "Deep dive into Solana programs",
                lessons: [
                    { id: "l7", title: "Program Architecture", description: "Understanding program structure", type: "content", duration: 35, xpReward: 30, order: 6 },
                    { id: "l8", title: "Cross-Program Invocation", description: "Calling programs from programs", type: "content", duration: 40, xpReward: 30, order: 7 },
                    { id: "l9", title: "PDAs and Seeds", description: "Program Derived Addresses", type: "challenge", duration: 50, xpReward: 75, order: 8, challenge: { prompt: "Create a PDA-based note storage program", objectives: ["Derive PDAs using seeds", "Store and retrieve notes"], starterCode: "// Write a program that stores notes using PDAs", language: "rust", testCases: [{ id: "t1", name: "PDA derived correctly", input: "", expectedOutput: "PDA matches", isHidden: false }], hints: ["Use seeds = [b\"note\", user.key().as_ref()]"], solution: "// Full solution for PDA note program" } }
                ]
            },
            {
                id: "m4",
                title: "Tokens & NFTs",
                description: "Working with SPL tokens and NFTs",
                lessons: [
                    { id: "l10", title: "SPL Token Program", description: "Creating and managing tokens", type: "content", duration: 30, xpReward: 30, order: 9 },
                    { id: "l11", title: "Token-2022 Extensions", description: "Advanced token features", type: "content", duration: 35, xpReward: 30, order: 10 },
                    { id: "l12", title: "Mint Your First NFT", description: "Create an NFT with Metaplex", type: "challenge", duration: 45, xpReward: 100, order: 11, challenge: { prompt: "Mint an NFT using Metaplex", objectives: ["Create collection", "Mint NFT", "Set metadata"], starterCode: "// Mint an NFT using Metaplex", language: "typescript", testCases: [{ id: "t1", name: "NFT minted", input: "", expectedOutput: "NFT created", isHidden: false }], hints: ["Use @metaplex-foundation/mpl-token-metadata"], solution: "// Full NFT minting solution" } }
                ]
            }
        ],
        enrolledCount: 1247,
        rating: 4.8,
        isActive: true,
        createdAt: "2025-01-15"
    },
    {
        id: "2",
        slug: "anchor-development",
        courseId: "anchor-development",
        title: "Anchor Development Mastery",
        description: "Master the Anchor framework for building production Solana programs.",
        longDescription: "Take your Solana development skills to the next level with Anchor. Learn advanced patterns, testing strategies, security best practices, and how to build production-ready programs.",
        thumbnail: "/images/courses/anchor-dev.jpg",
        difficulty: "intermediate",
        duration: 720,
        lessonCount: 16,
        xpPerLesson: 35,
        xpReward: 1500,
        track: "Anchor Development",
        trackColor: "#14f195",
        instructor: { name: "Carlos Ribeiro", avatar: "/images/avatars/carlos.jpg", title: "Anchor Core Contributor" },
        prerequisites: ["solana-fundamentals"],
        tags: ["anchor", "rust", "programs", "testing"],
        objectives: ["Build complex Anchor programs", "Write comprehensive tests", "Implement security best practices", "Deploy to mainnet"],
        modules: [
            {
                id: "m1", title: "Advanced Anchor Patterns", description: "Complex program architecture",
                lessons: [
                    { id: "l1", title: "Account Validation", description: "Advanced account constraints", type: "content", duration: 40, xpReward: 35, order: 0 },
                    { id: "l2", title: "Error Handling", description: "Custom errors and error propagation", type: "content", duration: 35, xpReward: 35, order: 1 },
                    { id: "l3", title: "Events & Logging", description: "Emitting and listening to events", type: "challenge", duration: 50, xpReward: 75, order: 2, challenge: { prompt: "Implement custom events in an Anchor program", objectives: ["Define event structs", "Emit events", "Listen from client"], starterCode: "// Implement events", language: "rust", testCases: [{ id: "t1", name: "Event emitted", input: "", expectedOutput: "Event logged", isHidden: false }], hints: ["Use #[event] attribute"], solution: "// Event solution" } },
                    { id: "l4", title: "Access Control", description: "Role-based access patterns", type: "content", duration: 45, xpReward: 35, order: 3 }
                ]
            },
            {
                id: "m2", title: "Testing Strategies", description: "Comprehensive testing",
                lessons: [
                    { id: "l5", title: "Unit Testing with Bankrun", description: "Fast local testing", type: "content", duration: 40, xpReward: 35, order: 4 },
                    { id: "l6", title: "Integration Tests", description: "End-to-end program testing", type: "challenge", duration: 60, xpReward: 100, order: 5, challenge: { prompt: "Write integration tests for a token program", objectives: ["Test happy paths", "Test error cases", "Test edge cases"], starterCode: "// Write tests", language: "typescript", testCases: [{ id: "t1", name: "Tests pass", input: "", expectedOutput: "All tests passed", isHidden: false }], hints: ["Use anchor.workspace"], solution: "// Test solution" } },
                    { id: "l7", title: "Security Auditing", description: "Common vulnerabilities", type: "content", duration: 50, xpReward: 40, order: 6 },
                    { id: "l8", title: "Fuzzing with Trident", description: "Automated security testing", type: "content", duration: 45, xpReward: 40, order: 7 }
                ]
            },
            {
                id: "m3", title: "Production Deployment", description: "Deploying to mainnet",
                lessons: [
                    { id: "l9", title: "Program Upgrades", description: "Upgrading deployed programs", type: "content", duration: 35, xpReward: 35, order: 8 },
                    { id: "l10", title: "Multisig Management", description: "Managing program authority", type: "content", duration: 40, xpReward: 35, order: 9 },
                    { id: "l11", title: "CU Optimization", description: "Compute unit optimization", type: "challenge", duration: 55, xpReward: 100, order: 10, challenge: { prompt: "Optimize a program's CU usage", objectives: ["Profile CU usage", "Optimize hot paths", "Reduce allocations"], starterCode: "// Optimize this program", language: "rust", testCases: [{ id: "t1", name: "CU reduced", input: "", expectedOutput: "< 50000 CU", isHidden: false }], hints: ["Use sol_log_compute_units!()"], solution: "// Optimized solution" } },
                    { id: "l12", title: "Monitoring & Indexing", description: "Tracking program activity", type: "content", duration: 40, xpReward: 35, order: 11 }
                ]
            },
            {
                id: "m4", title: "Advanced Topics", description: "Expert-level patterns",
                lessons: [
                    { id: "l13", title: "Token Extensions", description: "Token-2022 in Anchor", type: "content", duration: 45, xpReward: 40, order: 12 },
                    { id: "l14", title: "Metaplex Core", description: "NFT programs with Metaplex", type: "content", duration: 50, xpReward: 40, order: 13 },
                    { id: "l15", title: "ZK Compression", description: "Compressed state", type: "content", duration: 55, xpReward: 45, order: 14 },
                    { id: "l16", title: "Capstone Project", description: "Build a complete dApp", type: "challenge", duration: 120, xpReward: 200, order: 15, challenge: { prompt: "Build an escrow program with testing suite", objectives: ["Design accounts", "Implement instructions", "Write tests", "Deploy to devnet"], starterCode: "// Build escrow program", language: "rust", testCases: [{ id: "t1", name: "Escrow works", input: "", expectedOutput: "Escrow completed", isHidden: false }], hints: ["Use PDA for escrow vault"], solution: "// Full escrow solution" } }
                ]
            }
        ],
        enrolledCount: 834,
        rating: 4.9,
        isActive: true,
        createdAt: "2025-03-01"
    },
    {
        id: "3",
        slug: "defi-on-solana",
        courseId: "defi-on-solana",
        title: "DeFi on Solana",
        description: "Build decentralized finance protocols on Solana — AMMs, lending, and more.",
        longDescription: "Dive deep into DeFi on Solana. Learn how to build AMMs, lending protocols, and yield farming strategies. Understand the economics and security considerations of DeFi.",
        thumbnail: "/images/courses/defi-solana.jpg",
        difficulty: "advanced",
        duration: 960,
        lessonCount: 20,
        xpPerLesson: 50,
        xpReward: 2000,
        track: "DeFi Developer",
        trackColor: "#06b6d4",
        instructor: { name: "Ana Costa", avatar: "/images/avatars/ana.jpg", title: "DeFi Protocol Architect" },
        prerequisites: ["anchor-development"],
        tags: ["defi", "amm", "lending", "yield"],
        objectives: ["Build AMM programs", "Implement lending protocols", "Understand liquidation mechanics", "Design tokenomics"],
        modules: [
            {
                id: "m1", title: "DeFi Fundamentals", description: "Core DeFi concepts", lessons: [
                    { id: "l1", title: "DeFi Architecture", description: "How DeFi protocols work", type: "content", duration: 45, xpReward: 50, order: 0 },
                    { id: "l2", title: "Liquidity Pools", description: "Understanding AMMs", type: "content", duration: 50, xpReward: 50, order: 1 },
                    { id: "l3", title: "Oracle Integration", description: "Price feeds with Pyth/Switchboard", type: "content", duration: 40, xpReward: 50, order: 2 },
                    { id: "l4", title: "Build a Simple AMM", description: "Constant product AMM", type: "challenge", duration: 90, xpReward: 100, order: 3, challenge: { prompt: "Build a constant product AMM (x*y=k)", objectives: ["Create liquidity pool", "Implement swap", "Handle fees"], starterCode: "// Build AMM", language: "rust", testCases: [{ id: "t1", name: "Swap works", input: "", expectedOutput: "Swap completed", isHidden: false }], hints: ["x * y = k formula"], solution: "// AMM solution" } },
                    { id: "l5", title: "Lending Protocol Design", description: "Building lending/borrowing", type: "content", duration: 55, xpReward: 50, order: 4 }
                ]
            },
            {
                id: "m2", title: "Advanced DeFi", description: "Complex protocols", lessons: [
                    { id: "l6", title: "Flash Loans", description: "Atomic borrowing", type: "content", duration: 45, xpReward: 50, order: 5 },
                    { id: "l7", title: "Yield Strategies", description: "Auto-compounding vaults", type: "content", duration: 50, xpReward: 50, order: 6 },
                    { id: "l8", title: "MEV Protection", description: "Protecting against MEV", type: "content", duration: 40, xpReward: 50, order: 7 },
                    { id: "l9", title: "Build a Vault", description: "Yield vault program", type: "challenge", duration: 90, xpReward: 100, order: 8, challenge: { prompt: "Build a yield vault", objectives: ["Deposit/withdraw", "Track shares", "Auto-compound"], starterCode: "// Build vault", language: "rust", testCases: [{ id: "t1", name: "Vault works", input: "", expectedOutput: "Vault operational", isHidden: false }], hints: ["Use share tokens"], solution: "// Vault solution" } },
                    { id: "l10", title: "Governance", description: "On-chain governance", type: "content", duration: 45, xpReward: 50, order: 9 }
                ]
            },
            {
                id: "m3", title: "Security & Production", description: "DeFi security", lessons: [
                    { id: "l11", title: "Common DeFi Vulnerabilities", description: "Attack vectors", type: "content", duration: 60, xpReward: 50, order: 10 },
                    { id: "l12", title: "Formal Verification", description: "Mathematical proofs", type: "content", duration: 50, xpReward: 50, order: 11 },
                    { id: "l13", title: "Audit Preparation", description: "Pre-audit checklist", type: "content", duration: 40, xpReward: 50, order: 12 },
                    { id: "l14", title: "Mainnet Launch Playbook", description: "Going to production", type: "content", duration: 45, xpReward: 50, order: 13 },
                    { id: "l15", title: "Final Project", description: "Complete DeFi protocol", type: "challenge", duration: 120, xpReward: 200, order: 14, challenge: { prompt: "Build a complete lending protocol", objectives: ["Deposit collateral", "Borrow assets", "Liquidate positions"], starterCode: "// Build lending", language: "rust", testCases: [{ id: "t1", name: "Lending works", input: "", expectedOutput: "Protocol operational", isHidden: false }], hints: ["Track health factor"], solution: "// Lending solution" } }
                ]
            }
        ],
        enrolledCount: 456,
        rating: 4.7,
        isActive: true,
        createdAt: "2025-05-01"
    },
    {
        id: "4",
        slug: "solana-frontend",
        courseId: "solana-frontend",
        title: "Solana Frontend Development",
        description: "Build beautiful dApp frontends with React, Next.js, and Solana Wallet Adapter.",
        longDescription: "Learn to build production-ready dApp frontends. Master wallet integration, transaction management, real-time updates, and responsive design for web3 applications.",
        thumbnail: "/images/courses/solana-frontend.jpg",
        difficulty: "intermediate",
        duration: 600,
        lessonCount: 14,
        xpPerLesson: 30,
        xpReward: 1200,
        track: "Full Stack Solana",
        trackColor: "#8b5cf6",
        instructor: { name: "Lucas Oliveira", avatar: "/images/avatars/lucas.jpg", title: "Full Stack Web3 Developer" },
        prerequisites: ["solana-fundamentals"],
        tags: ["react", "nextjs", "frontend", "wallet-adapter"],
        objectives: ["Build responsive dApp UIs", "Integrate Solana wallets", "Handle transactions", "Real-time updates"],
        modules: [
            {
                id: "m1", title: "Web3 Frontend Basics", description: "Setting up the frontend", lessons: [
                    { id: "l1", title: "Next.js for dApps", description: "Project setup", type: "content", duration: 30, xpReward: 30, order: 0 },
                    { id: "l2", title: "Wallet Integration", description: "Multi-wallet adapter", type: "challenge", duration: 45, xpReward: 75, order: 1, challenge: { prompt: "Implement wallet connection", objectives: ["Set up providers", "Add connect button", "Show balance"], starterCode: "// Setup wallet adapter", language: "typescript", testCases: [{ id: "t1", name: "Wallet connects", input: "", expectedOutput: "Connected", isHidden: false }], hints: ["Use WalletProvider"], solution: "// Wallet solution" } },
                    { id: "l3", title: "Transaction Management", description: "Sending and confirming txs", type: "content", duration: 40, xpReward: 30, order: 2 }
                ]
            },
            {
                id: "m2", title: "Advanced Frontend", description: "Production patterns", lessons: [
                    { id: "l4", title: "Real-time Data", description: "WebSocket subscriptions", type: "content", duration: 35, xpReward: 30, order: 3 },
                    { id: "l5", title: "State Management", description: "Managing blockchain state", type: "content", duration: 40, xpReward: 30, order: 4 },
                    { id: "l6", title: "NFT Gallery", description: "Building NFT displays", type: "challenge", duration: 60, xpReward: 100, order: 5, challenge: { prompt: "Build an NFT gallery component", objectives: ["Fetch NFTs", "Display metadata", "Handle loading"], starterCode: "// Build NFT gallery", language: "typescript", testCases: [{ id: "t1", name: "Gallery renders", input: "", expectedOutput: "Gallery displayed", isHidden: false }], hints: ["Use Helius DAS API"], solution: "// Gallery solution" } },
                    { id: "l7", title: "Performance Optimization", description: "Optimizing web3 apps", type: "content", duration: 35, xpReward: 30, order: 6 }
                ]
            }
        ],
        enrolledCount: 678,
        rating: 4.6,
        isActive: true,
        createdAt: "2025-04-01"
    },
    {
        id: "5",
        slug: "nft-mastery",
        courseId: "nft-mastery",
        title: "NFT Mastery on Solana",
        description: "Create, manage, and trade NFTs and digital assets on Solana with Metaplex.",
        longDescription: "Everything you need to know about NFTs on Solana. From minting to marketplaces, compressed NFTs to dynamic metadata.",
        thumbnail: "/images/courses/nft-mastery.jpg",
        difficulty: "intermediate",
        duration: 540,
        lessonCount: 12,
        xpPerLesson: 35,
        xpReward: 1000,
        track: "NFT Creator",
        trackColor: "#f59e0b",
        instructor: { name: "Juliana Santos", avatar: "/images/avatars/juliana.jpg", title: "NFT Infrastructure Lead" },
        prerequisites: ["solana-fundamentals"],
        tags: ["nft", "metaplex", "compressed-nft", "marketplace"],
        objectives: ["Mint and manage NFTs", "Build collections", "Create marketplaces", "Use compressed NFTs"],
        modules: [
            {
                id: "m1", title: "NFT Basics", description: "Understanding Solana NFTs", lessons: [
                    { id: "l1", title: "Metaplex Core", description: "Modern NFT standard", type: "content", duration: 35, xpReward: 35, order: 0 },
                    { id: "l2", title: "Mint a Collection", description: "Create an NFT collection", type: "challenge", duration: 50, xpReward: 75, order: 1, challenge: { prompt: "Create an NFT collection", objectives: ["Create collection", "Mint NFTs", "Set attributes"], starterCode: "// Create collection", language: "typescript", testCases: [{ id: "t1", name: "Collection created", input: "", expectedOutput: "Collection minted", isHidden: false }], hints: ["Use mpl-core"], solution: "// Collection solution" } },
                    { id: "l3", title: "Metadata & Attributes", description: "NFT metadata standards", type: "content", duration: 30, xpReward: 35, order: 2 }
                ]
            }
        ],
        enrolledCount: 523,
        rating: 4.5,
        isActive: true,
        createdAt: "2025-06-01"
    },
    {
        id: "6",
        slug: "solana-security",
        courseId: "solana-security",
        title: "Solana Security & Auditing",
        description: "Learn to find and prevent vulnerabilities in Solana programs.",
        longDescription: "Become a Solana security expert. Learn common attack vectors, auditing methodologies, and how to write secure programs from the ground up.",
        thumbnail: "/images/courses/solana-security.jpg",
        difficulty: "advanced",
        duration: 840,
        lessonCount: 18,
        xpPerLesson: 45,
        xpReward: 1800,
        track: "Security Auditor",
        trackColor: "#ef4444",
        instructor: { name: "Pedro Mendes", avatar: "/images/avatars/pedro.jpg", title: "Security Researcher" },
        prerequisites: ["anchor-development"],
        tags: ["security", "audit", "vulnerabilities", "fuzzing"],
        objectives: ["Identify common vulnerabilities", "Conduct security audits", "Write secure programs", "Use fuzzing tools"],
        modules: [
            {
                id: "m1", title: "Vulnerability Patterns", description: "Common attack vectors", lessons: [
                    { id: "l1", title: "Missing Signer Checks", description: "Authorization vulnerabilities", type: "content", duration: 40, xpReward: 45, order: 0 },
                    { id: "l2", title: "Integer Overflow", description: "Arithmetic vulnerabilities", type: "content", duration: 35, xpReward: 45, order: 1 },
                    { id: "l3", title: "Find the Bug", description: "Spot vulnerabilities in code", type: "challenge", duration: 60, xpReward: 100, order: 2, challenge: { prompt: "Find and fix security bugs", objectives: ["Identify bugs", "Explain impact", "Fix code"], starterCode: "// Find the bugs", language: "rust", testCases: [{ id: "t1", name: "All bugs found", input: "", expectedOutput: "Secure", isHidden: false }], hints: ["Check all signer validations"], solution: "// Fixed code" } }
                ]
            }
        ],
        enrolledCount: 312,
        rating: 4.9,
        isActive: true,
        createdAt: "2025-07-01"
    }
];

export const MOCK_ACHIEVEMENTS: Achievement[] = [
    { id: "first-steps", name: "First Steps", description: "Complete your first lesson", icon: "👶", category: "progress", xpReward: 50, isUnlocked: true, unlockedAt: "2025-09-01" },
    { id: "course-completer", name: "Course Completer", description: "Complete your first course", icon: "🎓", category: "progress", xpReward: 200, isUnlocked: true, unlockedAt: "2025-10-15" },
    { id: "speed-runner", name: "Speed Runner", description: "Complete a course in under 7 days", icon: "⚡", category: "progress", xpReward: 300, isUnlocked: false },
    { id: "week-warrior", name: "Week Warrior", description: "Maintain a 7-day streak", icon: "🔥", category: "streak", xpReward: 100, isUnlocked: true, unlockedAt: "2025-09-08" },
    { id: "monthly-master", name: "Monthly Master", description: "Maintain a 30-day streak", icon: "💪", category: "streak", xpReward: 500, isUnlocked: false },
    { id: "consistency-king", name: "Consistency King", description: "Maintain a 100-day streak", icon: "👑", category: "streak", xpReward: 1000, isUnlocked: false },
    { id: "rust-rookie", name: "Rust Rookie", description: "Complete 5 Rust challenges", icon: "🦀", category: "skill", xpReward: 150, isUnlocked: true, unlockedAt: "2025-09-20" },
    { id: "anchor-expert", name: "Anchor Expert", description: "Complete the Anchor Mastery course", icon: "⚓", category: "skill", xpReward: 500, isUnlocked: false },
    { id: "full-stack", name: "Full Stack Solana", description: "Complete both frontend and backend tracks", icon: "🏗️", category: "skill", xpReward: 1000, isUnlocked: false },
    { id: "early-adopter", name: "Early Adopter", description: "Join during the beta period", icon: "🌟", category: "special", xpReward: 250, isUnlocked: true, unlockedAt: "2025-08-15" },
    { id: "bug-hunter", name: "Bug Hunter", description: "Report a platform bug", icon: "🐛", category: "special", xpReward: 200, isUnlocked: false },
    { id: "perfect-score", name: "Perfect Score", description: "Pass all challenges in a course on first try", icon: "💯", category: "special", xpReward: 500, isUnlocked: false },
    { id: "helper", name: "Helper", description: "Help 10 other learners in the forum", icon: "🤝", category: "community", xpReward: 200, isUnlocked: false },
    { id: "top-contributor", name: "Top Contributor", description: "Reach the top 10 on the leaderboard", icon: "🏆", category: "community", xpReward: 500, isUnlocked: false },
];

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
    { rank: 1, walletAddress: "7nYB...4kF2", username: "solana_chad", displayName: "SolanaChad", avatar: "", xp: 15420, level: 12, streak: 45, coursesCompleted: 5 },
    { rank: 2, walletAddress: "3mPQ...9xR7", username: "anchor_queen", displayName: "AnchorQueen", avatar: "", xp: 12800, level: 11, streak: 32, coursesCompleted: 4 },
    { rank: 3, walletAddress: "8kL5...2wN3", username: "defi_wizard", displayName: "DeFi Wizard", avatar: "", xp: 11250, level: 10, streak: 28, coursesCompleted: 4 },
    { rank: 4, walletAddress: "5jH9...6tM1", username: "rust_lord", displayName: "Rust Lord", avatar: "", xp: 9800, level: 9, streak: 21, coursesCompleted: 3 },
    { rank: 5, walletAddress: "2aB4...8pK6", username: "nft_master", displayName: "NFT Master", avatar: "", xp: 8500, level: 9, streak: 18, coursesCompleted: 3 },
    { rank: 6, walletAddress: "9cD7...1qL5", username: "web3_dev", displayName: "Web3 Dev", avatar: "", xp: 7200, level: 8, streak: 15, coursesCompleted: 2 },
    { rank: 7, walletAddress: "4eF2...3sN8", username: "crypto_coder", displayName: "Crypto Coder", avatar: "", xp: 6100, level: 7, streak: 12, coursesCompleted: 2 },
    { rank: 8, walletAddress: "6gH1...5uP4", username: "solana_builder", displayName: "Solana Builder", avatar: "", xp: 5400, level: 7, streak: 10, coursesCompleted: 2 },
    { rank: 9, walletAddress: "1iJ3...7wR2", username: "block_ninja", displayName: "Block Ninja", avatar: "", xp: 4800, level: 6, streak: 8, coursesCompleted: 1 },
    { rank: 10, walletAddress: "8kL9...4xT6", username: "chain_wizard", displayName: "Chain Wizard", avatar: "", xp: 4200, level: 6, streak: 7, coursesCompleted: 1 },
];

const today = new Date();
const streakHistory: Record<string, boolean> = {};
for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    streakHistory[key] = i < 12 || (i > 14 && i < 25);
}

export const MOCK_USER: UserProfile = {
    id: "user-1",
    username: "solana_learner",
    displayName: "Solana Learner",
    bio: "Learning Solana development one lesson at a time. Building the future of web3.",
    avatar: "",
    walletAddress: "7nYB...4kF2",
    email: "learner@example.com",
    socialLinks: { twitter: "@solana_learner", github: "solana-learner", discord: "learner#1234" },
    xp: 3250,
    level: 5,
    rank: 42,
    streak: { current: 12, longest: 24, lastActivityDate: today.toISOString(), history: streakHistory, freezesAvailable: 2 },
    achievements: MOCK_ACHIEVEMENTS.filter(a => a.isUnlocked),
    completedCourses: ["solana-fundamentals"],
    enrolledCourses: ["anchor-development", "solana-frontend"],
    credentials: [
        {
            id: "cred-1",
            trackId: "solana-fundamentals",
            trackName: "Solana Fundamentals",
            name: "Solana Fundamentals Certificate",
            metadataUri: "https://arweave.net/cert-1",
            coursesCompleted: 1,
            totalXP: 800,
            mintAddress: "CRD1...xyz",
            owner: "7nYB...4kF2",
            issuedAt: "2025-10-15",
            level: 1,
            imageUrl: "/images/certs/solana-fundamentals.png"
        }
    ],
    skills: [
        { name: "Rust", level: 4, maxLevel: 10, color: "#dea584" },
        { name: "Anchor", level: 3, maxLevel: 10, color: "#14f195" },
        { name: "Frontend", level: 5, maxLevel: 10, color: "#8b5cf6" },
        { name: "Security", level: 2, maxLevel: 10, color: "#ef4444" },
        { name: "DeFi", level: 1, maxLevel: 10, color: "#06b6d4" },
        { name: "NFTs", level: 3, maxLevel: 10, color: "#f59e0b" },
    ],
    joinedAt: "2025-08-15",
    isPublic: true,
    preferredLanguage: "en",
    theme: "dark"
};

export const MOCK_COURSE_PROGRESS: CourseProgress[] = [
    {
        courseId: "anchor-development",
        courseSlug: "anchor-development",
        courseTitle: "Anchor Development Mastery",
        courseThumbnail: "/images/courses/anchor-dev.jpg",
        completedLessons: 7,
        totalLessons: 16,
        progress: 43.75,
        xpEarned: 315,
        nextLessonId: "l8",
        nextLessonTitle: "Fuzzing with Trident"
    },
    {
        courseId: "solana-frontend",
        courseSlug: "solana-frontend",
        courseTitle: "Solana Frontend Development",
        courseThumbnail: "/images/courses/solana-frontend.jpg",
        completedLessons: 3,
        totalLessons: 14,
        progress: 21.4,
        xpEarned: 135,
        nextLessonId: "l4",
        nextLessonTitle: "Real-time Data"
    }
];

export const MOCK_ACTIVITY: ActivityItem[] = [
    { id: "a1", type: "lesson_complete", title: "Completed: Fuzzing with Trident", description: "Anchor Development Mastery", xpEarned: 40, timestamp: new Date(Date.now() - 3600000).toISOString(), courseId: "anchor-development", courseName: "Anchor Development Mastery", icon: "✅" },
    { id: "a2", type: "streak", title: "12-Day Streak!", description: "Keep going, you're on fire!", xpEarned: 10, timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), icon: "🔥" },
    { id: "a3", type: "lesson_complete", title: "Completed: Security Auditing", description: "Anchor Development Mastery", xpEarned: 40, timestamp: new Date(Date.now() - 86400000).toISOString(), courseId: "anchor-development", courseName: "Anchor Development Mastery", icon: "✅" },
    { id: "a4", type: "achievement", title: "Achievement: Week Warrior", description: "Maintained a 7-day streak", xpEarned: 100, timestamp: new Date(Date.now() - 86400000 * 5).toISOString(), icon: "🏅" },
    { id: "a5", type: "enrollment", title: "Enrolled: Solana Frontend Development", description: "Started a new course", xpEarned: 0, timestamp: new Date(Date.now() - 86400000 * 7).toISOString(), courseId: "solana-frontend", courseName: "Solana Frontend Development", icon: "📚" },
    { id: "a6", type: "course_complete", title: "Completed: Solana Fundamentals", description: "Your first course completed!", xpEarned: 800, timestamp: new Date(Date.now() - 86400000 * 15).toISOString(), courseId: "solana-fundamentals", courseName: "Solana Fundamentals", icon: "🎓" },
    { id: "a7", type: "level_up", title: "Level Up! Level 5", description: "Great progress!", xpEarned: 0, timestamp: new Date(Date.now() - 86400000 * 15).toISOString(), icon: "⬆️" },
];
