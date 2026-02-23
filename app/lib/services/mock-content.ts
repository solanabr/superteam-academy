export interface MockCourse {
    id: string;
    slug: string;
    title: string;
    description: string;
    difficulty: "beginner" | "intermediate" | "advanced";
    lessonCount: number;
    xpPerLesson: number;
    duration: string;
    tags: string[];
    modules: MockModule[];
}

export interface MockModule {
    title: string;
    lessons: MockLesson[];
}

export interface MockLesson {
    id: string;
    title: string;
    type: "content" | "challenge";
    duration: string;
    content: string;
    challengeCode?: string;
    challengeTests?: string;
}

export const MOCK_COURSES: MockCourse[] = [
    {
        id: "solana-fundamentals",
        slug: "solana-fundamentals",
        title: "Solana Fundamentals",
        description:
            "Learn the core concepts of Solana: accounts, transactions, programs, and the runtime model. Build a mental model of how Solana processes transactions at scale.",
        difficulty: "beginner",
        lessonCount: 5,
        xpPerLesson: 100,
        duration: "3 hours",
        tags: ["solana", "blockchain", "fundamentals"],
        modules: [
            {
                title: "Introduction to Solana",
                lessons: [
                    {
                        id: "sol-fund-1",
                        title: "What is Solana?",
                        type: "content",
                        duration: "15 min",
                        content:
                            "Solana is a high-performance blockchain supporting thousands of transactions per second. It uses a unique combination of Proof of History (PoH) and Proof of Stake (PoS) to achieve consensus.",
                    },
                    {
                        id: "sol-fund-2",
                        title: "Accounts and Programs",
                        type: "content",
                        duration: "20 min",
                        content:
                            "Everything on Solana is an account. Programs are stateless executable accounts. Data accounts store state. This model enables parallel processing of non-overlapping transactions.",
                    },
                ],
            },
            {
                title: "Transactions Deep Dive",
                lessons: [
                    {
                        id: "sol-fund-3",
                        title: "Transaction Anatomy",
                        type: "content",
                        duration: "20 min",
                        content:
                            "A Solana transaction contains a message with instructions, recent blockhash, and signatures. Each instruction references a program, accounts, and data.",
                    },
                    {
                        id: "sol-fund-4",
                        title: "Build Your First Transaction",
                        type: "challenge",
                        duration: "30 min",
                        content:
                            "Create a SOL transfer transaction using @solana/web3.js. You'll construct the transaction, add a transfer instruction, and sign it.",
                        challengeCode:
                            'const { Connection, PublicKey, Transaction, SystemProgram, Keypair } = require("@solana/web3.js");\n\n// TODO: Create a transfer instruction and add it to a transaction\nconst connection = new Connection("https://api.devnet.solana.com");\n',
                        challengeTests:
                            "// Test: transaction should contain a SystemProgram.transfer instruction",
                    },
                    {
                        id: "sol-fund-5",
                        title: "Versioned Transactions",
                        type: "content",
                        duration: "15 min",
                        content:
                            "Solana v0 transactions support Address Lookup Tables (ALTs), enabling more accounts per transaction. Most modern dApps use versioned transactions for efficiency.",
                    },
                ],
            },
        ],
    },
    {
        id: "anchor-development",
        slug: "anchor-development",
        title: "Anchor Program Development",
        description:
            "Build Solana programs with the Anchor framework. Learn IDL generation, account validation, error handling, and testing patterns.",
        difficulty: "intermediate",
        lessonCount: 8,
        xpPerLesson: 150,
        duration: "6 hours",
        tags: ["anchor", "rust", "programs"],
        modules: [
            {
                title: "Getting Started with Anchor",
                lessons: [
                    {
                        id: "anchor-1",
                        title: "Anchor Project Setup",
                        type: "content",
                        duration: "15 min",
                        content:
                            "Anchor provides a framework for building Solana programs in Rust with automatic IDL generation, account serialization, and test scaffolding.",
                    },
                    {
                        id: "anchor-2",
                        title: "Your First Program",
                        type: "challenge",
                        duration: "45 min",
                        content: "Create a simple counter program with Anchor.",
                        challengeCode:
                            'use anchor_lang::prelude::*;\n\n#[program]\npub mod counter {\n    use super::*;\n    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {\n        // TODO: Initialize counter to 0\n        Ok(())\n    }\n}',
                        challengeTests:
                            "// Test: counter account should be initialized with value 0",
                    },
                ],
            },
            {
                title: "Account Validation & Constraints",
                lessons: [
                    {
                        id: "anchor-3",
                        title: "Account Constraints",
                        type: "content",
                        duration: "20 min",
                        content:
                            "Anchor provides declarative constraints: #[account(init)], #[account(mut)], has_one, seeds/bump for PDA validation.",
                    },
                    {
                        id: "anchor-4",
                        title: "PDA-Based Programs",
                        type: "challenge",
                        duration: "45 min",
                        content: "Build a program that uses PDAs for deterministic account addresses.",
                        challengeCode:
                            'use anchor_lang::prelude::*;\n\n#[account]\npub struct UserProfile {\n    pub authority: Pubkey,\n    pub name: String,\n    pub bump: u8,\n}',
                        challengeTests: "// Test: PDA derivation should match expected address",
                    },
                    {
                        id: "anchor-5",
                        title: "Error Handling",
                        type: "content",
                        duration: "15 min",
                        content:
                            "Define custom error enums with #[error_code]. Anchor maps these to numbered error codes for client-side decoding.",
                    },
                    {
                        id: "anchor-6",
                        title: "Events and Logging",
                        type: "content",
                        duration: "15 min",
                        content:
                            "Emit structured events with emit!(MyEvent { ... }). Clients can listen for events to react to on-chain state changes.",
                    },
                ],
            },
            {
                title: "Testing and Deployment",
                lessons: [
                    {
                        id: "anchor-7",
                        title: "Writing Integration Tests",
                        type: "challenge",
                        duration: "30 min",
                        content: "Write TypeScript integration tests for your Anchor program.",
                        challengeCode:
                            'import * as anchor from "@coral-xyz/anchor";\n\ndescribe("counter", () => {\n  // TODO: Write test for initialize instruction\n});',
                        challengeTests: "// Test: all tests should pass",
                    },
                    {
                        id: "anchor-8",
                        title: "Deploying to Devnet",
                        type: "content",
                        duration: "15 min",
                        content:
                            "Deploy with `anchor deploy --provider.cluster devnet`. Verify your program with `anchor verify`. Always test on devnet before mainnet.",
                    },
                ],
            },
        ],
    },
    {
        id: "token-extensions",
        slug: "token-extensions",
        title: "Token Extensions (Token-2022)",
        description:
            "Master Solana Token Extensions: transfer fees, non-transferable tokens, confidential transfers, and more. Build token-gated experiences.",
        difficulty: "advanced",
        lessonCount: 6,
        xpPerLesson: 200,
        duration: "5 hours",
        tags: ["token-2022", "spl", "defi"],
        modules: [
            {
                title: "Token Extensions Overview",
                lessons: [
                    {
                        id: "tok-ext-1",
                        title: "What are Token Extensions?",
                        type: "content",
                        duration: "15 min",
                        content:
                            "Token-2022 extends SPL Token with built-in extensions: transfer fees, non-transferable, permanent delegate, confidential transfers, metadata, and more.",
                    },
                    {
                        id: "tok-ext-2",
                        title: "Non-Transferable & Permanent Delegate",
                        type: "content",
                        duration: "20 min",
                        content:
                            "NonTransferable makes tokens soulbound — they can't be moved once minted. PermanentDelegate lets a program authority burn or transfer tokens regardless of holder.",
                    },
                ],
            },
            {
                title: "Building with Token Extensions",
                lessons: [
                    {
                        id: "tok-ext-3",
                        title: "Mint with Extensions",
                        type: "challenge",
                        duration: "45 min",
                        content: "Create a Token-2022 mint with transfer fee and metadata extensions.",
                        challengeCode:
                            'import { createMint, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";\n\n// TODO: Create mint with TransferFee extension',
                        challengeTests: "// Test: mint should have TransferFee extension enabled",
                    },
                    {
                        id: "tok-ext-4",
                        title: "Transfer Hooks",
                        type: "content",
                        duration: "25 min",
                        content:
                            "TransferHook extension calls a user-defined program on every transfer, enabling custom logic like KYC, allowlisting, or royalty enforcement.",
                    },
                    {
                        id: "tok-ext-5",
                        title: "Confidential Transfers",
                        type: "content",
                        duration: "30 min",
                        content:
                            "Confidential transfers use El-Gamal encryption and Bulletproofs to hide transfer amounts while keeping balances publicly verifiable.",
                    },
                    {
                        id: "tok-ext-6",
                        title: "Token-Gated Access",
                        type: "challenge",
                        duration: "40 min",
                        content: "Build a frontend that gates content based on Token-2022 token ownership.",
                        challengeCode:
                            '// TODO: Check if connected wallet holds any tokens from a specific Token-2022 mint',
                        challengeTests: "// Test: gated content should only show for token holders",
                    },
                ],
            },
        ],
    },
    {
        id: "metaplex-core",
        slug: "metaplex-core",
        title: "Metaplex Core NFTs",
        description:
            "Learn Metaplex Core: create collections, mint NFTs with plugins, manage delegates, and build credential systems on Solana.",
        difficulty: "intermediate",
        lessonCount: 5,
        xpPerLesson: 150,
        duration: "4 hours",
        tags: ["metaplex", "nft", "credentials"],
        modules: [
            {
                title: "Core Concepts",
                lessons: [
                    {
                        id: "mpx-1",
                        title: "Metaplex Core vs Token Metadata",
                        type: "content",
                        duration: "15 min",
                        content:
                            "Metaplex Core is a next-gen NFT standard. Single-account design reduces cost and complexity vs legacy Token Metadata. Native plugins replace external programs.",
                    },
                    {
                        id: "mpx-2",
                        title: "Collections and Assets",
                        type: "content",
                        duration: "20 min",
                        content:
                            "Collections group related assets. Assets are individual NFTs within a collection. Both support plugins like FreezeDelegate, TransferDelegate, and Attributes.",
                    },
                ],
            },
            {
                title: "Building with Core",
                lessons: [
                    {
                        id: "mpx-3",
                        title: "Create a Collection",
                        type: "challenge",
                        duration: "30 min",
                        content: "Create a Metaplex Core collection with the FreezeDelegate plugin for soulbound NFTs.",
                        challengeCode:
                            '// TODO: Use @metaplex-foundation/mpl-core to create a collection',
                        challengeTests: "// Test: collection should have FreezeDelegate plugin",
                    },
                    {
                        id: "mpx-4",
                        title: "Mint Soulbound Credentials",
                        type: "challenge",
                        duration: "40 min",
                        content: "Mint a soulbound credential NFT with frozen transfer and updatable attributes.",
                        challengeCode:
                            '// TODO: Mint asset with PermanentFreezeDelegate and Attributes plugin',
                        challengeTests:
                            "// Test: asset should be frozen and have correct attributes",
                    },
                    {
                        id: "mpx-5",
                        title: "Querying with DAS API",
                        type: "content",
                        duration: "20 min",
                        content:
                            "Use Helius DAS API to query assets by owner, collection, or attributes. Efficient for building credential displays and leaderboards.",
                    },
                ],
            },
        ],
    },
];

export function getCourseBySlug(slug: string): MockCourse | undefined {
    return MOCK_COURSES.find((c) => c.slug === slug);
}

export function getLessonById(
    courseSlug: string,
    lessonId: string
): { course: MockCourse; lesson: MockLesson; moduleTitle: string; lessonIndex: number } | undefined {
    const course = getCourseBySlug(courseSlug);
    if (!course) return undefined;

    let idx = 0;
    for (const mod of course.modules) {
        for (const lesson of mod.lessons) {
            if (lesson.id === lessonId) {
                return { course, lesson, moduleTitle: mod.title, lessonIndex: idx };
            }
            idx++;
        }
    }
    return undefined;
}

export function getAllLessonsFlat(course: MockCourse): MockLesson[] {
    return course.modules.flatMap((m) => m.lessons);
}
