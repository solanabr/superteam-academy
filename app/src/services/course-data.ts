import type { Course, LearningPath } from "@/types";

function generateLessons(
  moduleId: string,
  count: number,
  startIndex: number,
  topics: string[]
) {
  return Array.from({ length: count }, (_, i) => ({
    id: startIndex + i,
    title: topics[i] || `Lesson ${i + 1}`,
    description: `Learn about ${topics[i] || `topic ${i + 1}`}`,
    type: i === count - 1 ? ("code-challenge" as const) : ("article" as const),
    content: getContentForLesson(moduleId, i),
    estimatedMinutes: 15 + Math.floor(Math.random() * 20),
    ...(i === count - 1
      ? {
          codeChallenge: {
            prompt: `Complete the coding challenge for ${topics[i] || `lesson ${i + 1}`}`,
            objectives: [
              "Implement the required function",
              "Pass all test cases",
              "Handle edge cases",
            ],
            starterCode: getStarterCode(moduleId),
            language: "rust",
            testCases: [
              {
                id: "test-1",
                description: "Basic functionality",
                input: "test_input",
                expectedOutput: "expected_output",
                hidden: false,
              },
              {
                id: "test-2",
                description: "Edge case handling",
                input: "edge_input",
                expectedOutput: "edge_output",
                hidden: false,
              },
              {
                id: "test-3",
                description: "Performance test",
                input: "perf_input",
                expectedOutput: "perf_output",
                hidden: true,
              },
            ],
            solution: "// Solution will be revealed after completion",
          },
        }
      : {}),
  }));
}

function getContentForLesson(moduleId: string, lessonIndex: number): string {
  const contents: Record<string, string[]> = {
    "sol-fund-1": [
      `# Introduction to Solana\n\nSolana is a high-performance blockchain designed for decentralized applications and crypto-currencies. It uses a unique consensus mechanism combining Proof of History (PoH) with Proof of Stake (PoS).\n\n## Key Features\n\n- **High throughput**: Up to 65,000 transactions per second\n- **Low latency**: 400ms block times\n- **Low cost**: Average transaction fee of $0.00025\n- **Energy efficient**: Uses PoS consensus\n\n## Architecture Overview\n\nSolana's architecture is built around several key innovations:\n\n1. **Proof of History (PoH)** - A clock before consensus\n2. **Tower BFT** - PoH-optimized version of PBFT\n3. **Turbine** - Block propagation protocol\n4. **Gulf Stream** - Mempool-less transaction forwarding\n5. **Sealevel** - Parallel smart contract runtime\n6. **Pipelining** - Transaction processing unit\n7. **Cloudbreak** - Horizontally-scaled accounts database\n8. **Archivers** - Distributed ledger storage`,
      `# Solana Account Model\n\nUnlike Ethereum's contract-centric model, Solana separates code from data using an account-based model.\n\n## Account Types\n\n### Program Accounts\nContain executable code (similar to smart contracts). Programs are stateless - they don't store data themselves.\n\n### Data Accounts\nStore state and data. Created by programs to hold information.\n\n### Native Accounts\nSystem-level accounts like the System Program, Token Program, etc.\n\n## Key Concepts\n\n\`\`\`rust\npub struct AccountInfo {\n    pub key: Pubkey,\n    pub lamports: u64,\n    pub data: Vec<u8>,\n    pub owner: Pubkey,\n    pub executable: bool,\n}\n\`\`\`\n\nEvery account has:\n- A **public key** (address)\n- A **lamport balance** (SOL)\n- **Data** (arbitrary bytes)\n- An **owner** program\n- An **executable** flag`,
      `# Transactions and Instructions\n\n## Transaction Structure\n\nA Solana transaction contains:\n1. One or more **instructions**\n2. A list of **signatures**\n3. A **recent blockhash** (for replay protection)\n\n\`\`\`typescript\nconst transaction = new Transaction().add(\n  SystemProgram.transfer({\n    fromPubkey: sender.publicKey,\n    toPubkey: receiver,\n    lamports: LAMPORTS_PER_SOL,\n  })\n);\n\nawait sendAndConfirmTransaction(connection, transaction, [sender]);\n\`\`\`\n\n## Instruction Anatomy\n\nEach instruction specifies:\n- **Program ID**: Which program to invoke\n- **Accounts**: List of accounts the instruction reads/writes\n- **Data**: Serialized instruction parameters`,
    ],
    "sol-fund-2": [
      `# Token Program & Token-2022\n\nSolana has two token programs:\n\n## SPL Token Program\nThe original token standard. Supports fungible and non-fungible tokens.\n\n## Token-2022 (Token Extensions)\nNext-generation token program with extensions:\n- **Transfer fees**\n- **Non-transferable tokens** (soulbound)\n- **Permanent delegate**\n- **Confidential transfers**\n- **Interest-bearing tokens**\n\n\`\`\`typescript\nimport { createMint } from "@solana/spl-token";\n\nconst mint = await createMint(\n  connection,\n  payer,\n  mintAuthority,\n  freezeAuthority,\n  decimals,\n  undefined,\n  undefined,\n  TOKEN_2022_PROGRAM_ID\n);\n\`\`\``,
      `# Program Derived Addresses (PDAs)\n\nPDAs are deterministic addresses derived from a program ID and seeds.\n\n\`\`\`typescript\nconst [pda, bump] = PublicKey.findProgramAddressSync(\n  [Buffer.from("config")],\n  programId\n);\n\`\`\`\n\n## Why PDAs?\n\n1. **Deterministic**: Same seeds always produce same address\n2. **No private key**: Cannot be signed by any wallet\n3. **Program-controlled**: Only the deriving program can sign for them\n4. **Composable**: Other programs can derive the same PDA`,
      `# Solana Web3.js Basics\n\nThe \`@solana/web3.js\` library is the primary SDK for interacting with Solana.\n\n\`\`\`typescript\nimport { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";\n\nconst connection = new Connection(clusterApiUrl("devnet"));\n\n// Get account balance\nconst balance = await connection.getBalance(publicKey);\n\n// Get account info\nconst accountInfo = await connection.getAccountInfo(publicKey);\n\n// Subscribe to account changes\nconst subId = connection.onAccountChange(publicKey, (info) => {\n  console.log("Account changed:", info);\n});\n\`\`\``,
    ],
  };

  const moduleLessons = contents[moduleId];
  if (moduleLessons && moduleLessons[lessonIndex]) {
    return moduleLessons[lessonIndex];
  }

  return `# Lesson Content\n\nThis lesson covers important concepts in Solana development. The content will be expanded with detailed explanations, code examples, and practical exercises.\n\n## Key Takeaways\n\n- Understanding fundamental concepts\n- Practical application of knowledge\n- Building real-world projects\n\n## Further Reading\n\nRefer to the official Solana documentation for the latest updates and detailed API references.`;
}

function getStarterCode(moduleId: string): string {
  const starters: Record<string, string> = {
    "sol-fund-1": `use solana_program::{\n    account_info::AccountInfo,\n    entrypoint,\n    entrypoint::ProgramResult,\n    msg,\n    pubkey::Pubkey,\n};\n\nentrypoint!(process_instruction);\n\npub fn process_instruction(\n    program_id: &Pubkey,\n    accounts: &[AccountInfo],\n    instruction_data: &[u8],\n) -> ProgramResult {\n    // TODO: Implement your instruction handler\n    msg!("Hello, Solana!");\n    Ok(())\n}`,
    "sol-fund-2": `use anchor_lang::prelude::*;\n\ndeclare_id!("YOUR_PROGRAM_ID");\n\n#[program]\npub mod my_program {\n    use super::*;\n\n    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {\n        // TODO: Initialize your program state\n        Ok(())\n    }\n}\n\n#[derive(Accounts)]\npub struct Initialize<'info> {\n    #[account(init, payer = signer, space = 8 + 32)]\n    pub state: Account<'info, MyState>,\n    #[account(mut)]\n    pub signer: Signer<'info>,\n    pub system_program: Program<'info, System>,\n}\n\n#[account]\npub struct MyState {\n    pub authority: Pubkey,\n}`,
  };

  return (
    starters[moduleId] ||
    `// Write your solution here\nfn main() {\n    println!("Hello, Solana!");\n}`
  );
}

export const COURSES: Course[] = [
  {
    id: "solana-fundamentals",
    slug: "solana-fundamentals",
    title: "Solana Fundamentals",
    description:
      "Master the core concepts of Solana blockchain development. Learn about the account model, transactions, programs, and how to interact with the network using TypeScript and Rust.",
    shortDescription:
      "Learn the core concepts of Solana blockchain development from scratch.",
    thumbnail: "/courses/solana-fundamentals.jpg",
    creator: "Superteam Academy",
    difficulty: 1,
    trackId: 1,
    trackLevel: 1,
    lessonCount: 20,
    xpPerLesson: 100,
    creatorRewardXp: 50,
    isActive: true,
    totalCompletions: 342,
    prerequisite: null,
    estimatedHours: 12,
    tags: ["solana", "blockchain", "web3", "typescript"],
    modules: [
      {
        id: "sol-fund-1",
        title: "Introduction to Solana",
        description:
          "Understand what makes Solana unique and how its architecture enables high-performance decentralized applications.",
        order: 0,
        lessons: generateLessons("sol-fund-1", 4, 0, [
          "What is Solana?",
          "Solana Account Model",
          "Transactions & Instructions",
          "Challenge: Your First Transaction",
        ]),
      },
      {
        id: "sol-fund-2",
        title: "Tokens & Programs",
        description:
          "Learn about SPL tokens, Token-2022, and how programs work on Solana.",
        order: 1,
        lessons: generateLessons("sol-fund-2", 4, 4, [
          "Token Program & Token-2022",
          "Program Derived Addresses",
          "Web3.js Basics",
          "Challenge: Create a Token",
        ]),
      },
      {
        id: "sol-fund-3",
        title: "Client Development",
        description:
          "Build frontend applications that interact with Solana programs.",
        order: 2,
        lessons: generateLessons("sol-fund-3", 4, 8, [
          "Setting Up a Project",
          "Wallet Integration",
          "Sending Transactions",
          "Challenge: Build a dApp",
        ]),
      },
      {
        id: "sol-fund-4",
        title: "Network & Deployment",
        description: "Deploy programs and understand Solana network operations.",
        order: 3,
        lessons: generateLessons("sol-fund-4", 4, 12, [
          "Devnet vs Mainnet",
          "Program Deployment",
          "RPC Providers",
          "Challenge: Deploy to Devnet",
        ]),
      },
      {
        id: "sol-fund-5",
        title: "Final Project",
        description:
          "Apply everything you have learned to build a complete Solana application.",
        order: 4,
        lessons: generateLessons("sol-fund-5", 4, 16, [
          "Project Planning",
          "Implementation",
          "Testing & Debugging",
          "Challenge: Final Submission",
        ]),
      },
    ],
  },
  {
    id: "rust-for-solana",
    slug: "rust-for-solana",
    title: "Rust for Solana",
    description:
      "Learn Rust programming language with a focus on Solana development. From ownership and borrowing to building efficient on-chain programs.",
    shortDescription:
      "Learn Rust programming tailored for Solana smart contract development.",
    thumbnail: "/courses/rust-solana.jpg",
    creator: "Superteam Academy",
    difficulty: 2,
    trackId: 2,
    trackLevel: 1,
    lessonCount: 24,
    xpPerLesson: 120,
    creatorRewardXp: 60,
    isActive: true,
    totalCompletions: 189,
    prerequisite: "solana-fundamentals",
    estimatedHours: 18,
    tags: ["rust", "programming", "solana", "systems"],
    modules: [
      {
        id: "rust-1",
        title: "Rust Basics",
        description:
          "Variables, types, functions, and control flow in Rust.",
        order: 0,
        lessons: generateLessons("rust-1", 5, 0, [
          "Variables & Mutability",
          "Data Types & Functions",
          "Control Flow",
          "Ownership & Borrowing",
          "Challenge: Rust Basics",
        ]),
      },
      {
        id: "rust-2",
        title: "Structs & Enums",
        description: "Custom data types, pattern matching, and methods.",
        order: 1,
        lessons: generateLessons("rust-2", 5, 5, [
          "Structs",
          "Enums & Pattern Matching",
          "Methods & Associated Functions",
          "Traits & Generics",
          "Challenge: Data Modeling",
        ]),
      },
      {
        id: "rust-3",
        title: "Error Handling & Collections",
        description:
          "Result types, error propagation, vectors, hashmaps.",
        order: 2,
        lessons: generateLessons("rust-3", 5, 10, [
          "Error Handling with Result",
          "Option Type",
          "Vectors & Iterators",
          "HashMaps & BTreeMaps",
          "Challenge: Collections",
        ]),
      },
      {
        id: "rust-4",
        title: "Serialization & Accounts",
        description: "Borsh serialization and Solana account structures.",
        order: 3,
        lessons: generateLessons("rust-4", 5, 15, [
          "Borsh Serialization",
          "Account Data Layout",
          "PDA Derivation in Rust",
          "Cross-Program Invocations",
          "Challenge: Account System",
        ]),
      },
      {
        id: "rust-5",
        title: "Advanced Patterns",
        description:
          "Optimization, testing, and production-ready Rust for Solana.",
        order: 4,
        lessons: generateLessons("rust-5", 4, 20, [
          "Zero-Copy Deserialization",
          "Compute Unit Optimization",
          "Testing Strategies",
          "Challenge: Optimize a Program",
        ]),
      },
    ],
  },
  {
    id: "anchor-deep-dive",
    slug: "anchor-deep-dive",
    title: "Anchor Framework Deep Dive",
    description:
      "Master the Anchor framework for building secure and efficient Solana programs. Learn advanced patterns, testing strategies, and production deployment.",
    shortDescription:
      "Deep dive into Anchor framework for professional Solana development.",
    thumbnail: "/courses/anchor-framework.jpg",
    creator: "Superteam Academy",
    difficulty: 2,
    trackId: 3,
    trackLevel: 1,
    lessonCount: 28,
    xpPerLesson: 150,
    creatorRewardXp: 75,
    isActive: true,
    totalCompletions: 156,
    prerequisite: "rust-for-solana",
    estimatedHours: 22,
    tags: ["anchor", "framework", "solana", "rust"],
    modules: [
      {
        id: "anchor-1",
        title: "Anchor Foundations",
        description:
          "Project setup, program structure, and account constraints.",
        order: 0,
        lessons: generateLessons("anchor-1", 5, 0, [
          "Anchor Project Setup",
          "Program Structure",
          "Account Constraints",
          "Instruction Handlers",
          "Challenge: Hello Anchor",
        ]),
      },
      {
        id: "anchor-2",
        title: "State Management",
        description: "PDAs, account initialization, and data modeling.",
        order: 1,
        lessons: generateLessons("anchor-2", 5, 5, [
          "PDA Patterns in Anchor",
          "Account Initialization",
          "Space Calculation",
          "Account Closing",
          "Challenge: State Machine",
        ]),
      },
      {
        id: "anchor-3",
        title: "Cross-Program Invocations",
        description: "CPIs, token operations, and composability.",
        order: 2,
        lessons: generateLessons("anchor-3", 4, 10, [
          "CPI Basics",
          "Token Program CPIs",
          "Metaplex Core CPIs",
          "Challenge: Token Vault",
        ]),
      },
      {
        id: "anchor-4",
        title: "Testing & Security",
        description:
          "Comprehensive testing, common vulnerabilities, and security patterns.",
        order: 3,
        lessons: generateLessons("anchor-4", 5, 14, [
          "TypeScript Integration Tests",
          "Rust Unit Tests",
          "Common Vulnerabilities",
          "Security Best Practices",
          "Challenge: Secure Program",
        ]),
      },
      {
        id: "anchor-5",
        title: "Production Deployment",
        description: "IDL generation, verifiable builds, and mainnet deployment.",
        order: 4,
        lessons: generateLessons("anchor-5", 5, 19, [
          "IDL Generation",
          "Verifiable Builds",
          "Devnet Testing",
          "Mainnet Deployment",
          "Challenge: Deploy & Verify",
        ]),
      },
      {
        id: "anchor-6",
        title: "Advanced Patterns",
        description:
          "Events, error handling, upgrades, and compute optimization.",
        order: 5,
        lessons: generateLessons("anchor-6", 4, 24, [
          "Events & Logging",
          "Custom Error Handling",
          "Program Upgrades",
          "Challenge: Full dApp",
        ]),
      },
    ],
  },
  {
    id: "defi-on-solana",
    slug: "defi-on-solana",
    title: "DeFi on Solana",
    description:
      "Build decentralized finance applications on Solana. Learn about AMMs, lending protocols, oracles, and yield farming mechanisms.",
    shortDescription:
      "Build DeFi protocols including AMMs, lending, and yield systems on Solana.",
    thumbnail: "/courses/defi-solana.jpg",
    creator: "Superteam Academy",
    difficulty: 3,
    trackId: 4,
    trackLevel: 1,
    lessonCount: 24,
    xpPerLesson: 200,
    creatorRewardXp: 100,
    isActive: true,
    totalCompletions: 87,
    prerequisite: "anchor-deep-dive",
    estimatedHours: 25,
    tags: ["defi", "amm", "lending", "solana"],
    modules: [
      {
        id: "defi-1",
        title: "DeFi Fundamentals",
        description:
          "Core DeFi concepts, token economics, and protocol design.",
        order: 0,
        lessons: generateLessons("defi-1", 4, 0, [
          "DeFi Overview on Solana",
          "Token Economics",
          "Protocol Design Patterns",
          "Challenge: Token Swap",
        ]),
      },
      {
        id: "defi-2",
        title: "Automated Market Makers",
        description:
          "Constant product formula, liquidity pools, and price impact.",
        order: 1,
        lessons: generateLessons("defi-2", 5, 4, [
          "AMM Mathematics",
          "Constant Product Formula",
          "Liquidity Pool Implementation",
          "Price Impact & Slippage",
          "Challenge: Build an AMM",
        ]),
      },
      {
        id: "defi-3",
        title: "Lending & Borrowing",
        description:
          "Interest rate models, collateralization, and liquidation.",
        order: 2,
        lessons: generateLessons("defi-3", 5, 9, [
          "Lending Protocol Design",
          "Interest Rate Models",
          "Collateral Management",
          "Liquidation Mechanisms",
          "Challenge: Lending Protocol",
        ]),
      },
      {
        id: "defi-4",
        title: "Oracles & Price Feeds",
        description:
          "Pyth, Switchboard, and building reliable price oracles.",
        order: 3,
        lessons: generateLessons("defi-4", 5, 14, [
          "Oracle Design",
          "Pyth Network Integration",
          "Switchboard Oracles",
          "Price Feed Reliability",
          "Challenge: Oracle Integration",
        ]),
      },
      {
        id: "defi-5",
        title: "Advanced DeFi",
        description:
          "Yield strategies, composability, and MEV protection.",
        order: 4,
        lessons: generateLessons("defi-5", 5, 19, [
          "Yield Farming Mechanics",
          "Protocol Composability",
          "MEV & Front-running Protection",
          "Flash Loans on Solana",
          "Challenge: DeFi Protocol",
        ]),
      },
    ],
  },
  {
    id: "nft-development",
    slug: "nft-development",
    title: "NFT Development",
    description:
      "Build NFT applications on Solana using Metaplex Core. Create collections, implement royalties, build marketplaces, and design dynamic NFTs.",
    shortDescription:
      "Create and manage NFT collections with Metaplex Core on Solana.",
    thumbnail: "/courses/nft-dev.jpg",
    creator: "Superteam Academy",
    difficulty: 2,
    trackId: 5,
    trackLevel: 1,
    lessonCount: 20,
    xpPerLesson: 130,
    creatorRewardXp: 65,
    isActive: true,
    totalCompletions: 134,
    prerequisite: "anchor-deep-dive",
    estimatedHours: 16,
    tags: ["nft", "metaplex", "solana", "digital-assets"],
    modules: [
      {
        id: "nft-1",
        title: "NFT Fundamentals",
        description: "NFT standards, Metaplex Core, and collection design.",
        order: 0,
        lessons: generateLessons("nft-1", 4, 0, [
          "NFT Standards on Solana",
          "Metaplex Core Overview",
          "Collection Architecture",
          "Challenge: Create an NFT",
        ]),
      },
      {
        id: "nft-2",
        title: "Minting & Collections",
        description:
          "Minting mechanics, candy machines, and collection management.",
        order: 1,
        lessons: generateLessons("nft-2", 4, 4, [
          "Minting with Metaplex Core",
          "Collection Management",
          "Candy Machine Setup",
          "Challenge: Launch Collection",
        ]),
      },
      {
        id: "nft-3",
        title: "Plugins & Extensions",
        description:
          "Freeze delegates, transfer guards, and custom plugins.",
        order: 2,
        lessons: generateLessons("nft-3", 4, 8, [
          "Plugin System Overview",
          "Freeze & Transfer Delegates",
          "Attribute Plugins",
          "Challenge: Soulbound NFT",
        ]),
      },
      {
        id: "nft-4",
        title: "Marketplace Development",
        description:
          "Building NFT marketplaces, listing, buying, and royalty enforcement.",
        order: 3,
        lessons: generateLessons("nft-4", 4, 12, [
          "Marketplace Architecture",
          "Listing & Buying",
          "Royalty Enforcement",
          "Challenge: NFT Marketplace",
        ]),
      },
      {
        id: "nft-5",
        title: "Dynamic NFTs",
        description:
          "Upgradeable metadata, on-chain attributes, and gaming integration.",
        order: 4,
        lessons: generateLessons("nft-5", 4, 16, [
          "Dynamic Metadata",
          "On-Chain Attributes",
          "Gaming Integration",
          "Challenge: Dynamic NFT",
        ]),
      },
    ],
  },
  {
    id: "security-auditing",
    slug: "security-auditing",
    title: "Security & Auditing",
    description:
      "Learn how to audit Solana programs for vulnerabilities. Cover common attack vectors, fuzzing, formal verification, and responsible disclosure.",
    shortDescription:
      "Master security auditing techniques for Solana smart contracts.",
    thumbnail: "/courses/security-audit.jpg",
    creator: "Superteam Academy",
    difficulty: 3,
    trackId: 6,
    trackLevel: 1,
    lessonCount: 24,
    xpPerLesson: 200,
    creatorRewardXp: 100,
    isActive: true,
    totalCompletions: 62,
    prerequisite: "anchor-deep-dive",
    estimatedHours: 20,
    tags: ["security", "auditing", "vulnerabilities", "solana"],
    modules: [
      {
        id: "sec-1",
        title: "Security Fundamentals",
        description:
          "Threat modeling, attack surfaces, and security mindset.",
        order: 0,
        lessons: generateLessons("sec-1", 4, 0, [
          "Solana Security Landscape",
          "Threat Modeling",
          "Attack Surface Analysis",
          "Challenge: Identify Vulnerabilities",
        ]),
      },
      {
        id: "sec-2",
        title: "Common Vulnerabilities",
        description:
          "Missing signer checks, PDA confusion, integer overflow, reentrancy.",
        order: 1,
        lessons: generateLessons("sec-2", 5, 4, [
          "Missing Signer Checks",
          "PDA Confusion Attacks",
          "Integer Overflow/Underflow",
          "Account Validation Flaws",
          "Challenge: Exploit & Fix",
        ]),
      },
      {
        id: "sec-3",
        title: "CPI & Token Attacks",
        description:
          "CPI reentrancy, token authority issues, and flash loan attacks.",
        order: 2,
        lessons: generateLessons("sec-3", 5, 9, [
          "CPI Reentrancy",
          "Token Authority Attacks",
          "Flash Loan Vectors",
          "Oracle Manipulation",
          "Challenge: CPI Security",
        ]),
      },
      {
        id: "sec-4",
        title: "Fuzzing & Testing",
        description:
          "Property-based testing, fuzzing tools, and coverage analysis.",
        order: 3,
        lessons: generateLessons("sec-4", 5, 14, [
          "Property-Based Testing",
          "Trident Fuzzing",
          "Coverage Analysis",
          "Invariant Testing",
          "Challenge: Fuzz a Program",
        ]),
      },
      {
        id: "sec-5",
        title: "Audit Process",
        description:
          "Professional audit workflow, reporting, and responsible disclosure.",
        order: 4,
        lessons: generateLessons("sec-5", 5, 19, [
          "Audit Methodology",
          "Report Writing",
          "Responsible Disclosure",
          "Remediation Verification",
          "Challenge: Full Audit",
        ]),
      },
    ],
  },
];

export const LEARNING_PATHS: LearningPath[] = [
  {
    id: "solana-developer",
    title: "Solana Developer",
    description:
      "Go from zero to building production Solana programs. Start with fundamentals, learn Rust, then master Anchor.",
    courses: ["solana-fundamentals", "rust-for-solana", "anchor-deep-dive"],
    difficulty: 1,
    estimatedHours: 52,
    icon: "rocket",
  },
  {
    id: "defi-builder",
    title: "DeFi Builder",
    description:
      "Build decentralized finance protocols on Solana. Covers AMMs, lending, oracles, and yield strategies.",
    courses: [
      "solana-fundamentals",
      "rust-for-solana",
      "anchor-deep-dive",
      "defi-on-solana",
    ],
    difficulty: 2,
    estimatedHours: 77,
    icon: "trending-up",
  },
  {
    id: "nft-creator",
    title: "NFT Creator",
    description:
      "Design and build NFT applications with Metaplex Core. From collections to dynamic NFTs and marketplaces.",
    courses: [
      "solana-fundamentals",
      "rust-for-solana",
      "anchor-deep-dive",
      "nft-development",
    ],
    difficulty: 2,
    estimatedHours: 68,
    icon: "palette",
  },
  {
    id: "security-expert",
    title: "Security Expert",
    description:
      "Master Solana security auditing. Find vulnerabilities, write fuzz tests, and perform professional audits.",
    courses: [
      "solana-fundamentals",
      "rust-for-solana",
      "anchor-deep-dive",
      "security-auditing",
    ],
    difficulty: 3,
    estimatedHours: 72,
    icon: "shield",
  },
];

export function getCourseBySlug(slug: string): Course | undefined {
  return COURSES.find((c) => c.slug === slug);
}

export function getCourseById(id: string): Course | undefined {
  return COURSES.find((c) => c.id === id);
}

export function getCoursesByDifficulty(difficulty: 1 | 2 | 3): Course[] {
  return COURSES.filter((c) => c.difficulty === difficulty && c.isActive);
}

export function getCoursesByTrack(trackId: number): Course[] {
  return COURSES.filter((c) => c.trackId === trackId && c.isActive);
}

export function searchCourses(query: string): Course[] {
  const lower = query.toLowerCase();
  return COURSES.filter(
    (c) =>
      c.isActive &&
      (c.title.toLowerCase().includes(lower) ||
        c.description.toLowerCase().includes(lower) ||
        c.tags.some((t) => t.includes(lower)))
  );
}

export function getLessonById(
  course: Course,
  lessonId: number
): { lesson: typeof course.modules[0]["lessons"][0]; module: typeof course.modules[0] } | undefined {
  for (const mod of course.modules) {
    const lesson = mod.lessons.find((l) => l.id === lessonId);
    if (lesson) return { lesson, module: mod };
  }
  return undefined;
}

export function getNextLesson(
  course: Course,
  currentLessonId: number
): number | null {
  const allLessons = course.modules.flatMap((m) => m.lessons);
  const currentIndex = allLessons.findIndex((l) => l.id === currentLessonId);
  if (currentIndex === -1 || currentIndex === allLessons.length - 1) return null;
  return allLessons[currentIndex + 1].id;
}

export function getPreviousLesson(
  course: Course,
  currentLessonId: number
): number | null {
  const allLessons = course.modules.flatMap((m) => m.lessons);
  const currentIndex = allLessons.findIndex((l) => l.id === currentLessonId);
  if (currentIndex <= 0) return null;
  return allLessons[currentIndex - 1].id;
}
