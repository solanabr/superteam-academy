import type { SanityCourse } from "@/types";

export const MOCK_COURSES: SanityCourse[] = [
  {
    _id: "mock-1",
    title: "Solana Fundamentals",
    slug: "solana-fundamentals",
    description: "Master the core concepts of Solana: accounts, programs, transactions, and the runtime model. Learn how accounts store state, how programs process instructions, and why Solana is the fastest blockchain for developers.",
    longDescription: `## Welcome to Solana Fundamentals

This course takes you from zero to confident on Solana. You'll understand **why Solana is different** from other blockchains and how to build on it effectively.

### What You'll Learn

- How Solana's account model works and why it's powerful
- The role of programs, instructions, and transactions
- How to read and write on-chain data using TypeScript
- Setting up a local development environment

### Prerequisites

- Basic TypeScript/JavaScript knowledge
- Familiarity with command line tools`,
    difficulty: "beginner",
    durationHours: 4,
    xpReward: 500,
    trackId: 1,
    instructor: { _id: "i1", name: "Lucas Oliveira", bio: "Solana core contributor & educator with 4 years building on-chain.", twitterHandle: "lucasoldev" },
    tags: ["solana", "basics", "accounts", "transactions"],
    modules: [
      {
        _id: "m1", title: "Introduction to Solana", order: 1,
        description: "Understand what makes Solana unique and set up your development environment.",
        lessons: [
          { _id: "l1", title: "What is Solana?", type: "content", order: 1, xpReward: 25, estimatedMinutes: 10 },
          { _id: "l2", title: "Why Solana is Different", type: "content", order: 2, xpReward: 25, estimatedMinutes: 12 },
          { _id: "l3", title: "Setting Up Your Environment", type: "content", order: 3, xpReward: 50, estimatedMinutes: 20 },
        ],
      },
      {
        _id: "m2", title: "The Account Model", order: 2,
        description: "Everything on Solana is an account. Learn what that means and how to work with it.",
        lessons: [
          { _id: "l4", title: "Everything is an Account", type: "content", order: 1, xpReward: 50, estimatedMinutes: 15 },
          { _id: "l5", title: "System Program & Rent", type: "content", order: 2, xpReward: 50, estimatedMinutes: 12 },
          { _id: "l6", title: "Challenge: Read On-Chain Data", type: "challenge", order: 3, xpReward: 100, estimatedMinutes: 30 },
        ],
      },
      {
        _id: "m3", title: "Transactions & Instructions", order: 3,
        description: "Learn how transactions bundle instructions and how to send them on-chain.",
        lessons: [
          { _id: "l7", title: "Anatomy of a Transaction", type: "content", order: 1, xpReward: 50, estimatedMinutes: 15 },
          { _id: "l8", title: "Signing & Sending", type: "content", order: 2, xpReward: 50, estimatedMinutes: 15 },
          { _id: "l9", title: "Challenge: Build a Transfer Script", type: "challenge", order: 3, xpReward: 100, estimatedMinutes: 25 },
        ],
      },
    ],
  },
  {
    _id: "mock-2",
    title: "Anchor Framework Basics",
    slug: "anchor-basics",
    description: "Build production-grade Solana programs with Anchor. Learn PDAs, CPIs, account validation, and error handling. Go from zero to deploying your first program on Devnet.",
    longDescription: `## Build Real Solana Programs with Anchor

Anchor is the standard framework for writing Solana programs. It handles boilerplate, adds type safety, and generates IDLs automatically.

### What You'll Learn

- Writing programs with Anchor's \`#[program]\` macro
- Deriving and using Program Derived Addresses (PDAs)
- Cross-Program Invocations (CPIs) to compose with other programs
- Custom error types and account constraints

### Prerequisites

- Solana Fundamentals (or equivalent experience)
- Basic Rust knowledge`,
    difficulty: "intermediate",
    durationHours: 6,
    xpReward: 1200,
    trackId: 2,
    instructor: { _id: "i2", name: "Ana Lima", bio: "Anchor maintainer & DeFi protocol engineer. Built 3 production programs on mainnet.", twitterHandle: "anaanchor" },
    tags: ["anchor", "programs", "pda", "cpi", "rust"],
    modules: [
      {
        _id: "m4", title: "Anchor Fundamentals", order: 1,
        description: "Set up Anchor and write your first program from scratch.",
        lessons: [
          { _id: "l10", title: "What is Anchor?", type: "content", order: 1, xpReward: 25, estimatedMinutes: 10 },
          { _id: "l11", title: "Project Structure & Workspace", type: "content", order: 2, xpReward: 50, estimatedMinutes: 20 },
          { _id: "l12", title: "Challenge: Your First Anchor Program", type: "challenge", order: 3, xpReward: 100, estimatedMinutes: 40 },
        ],
      },
      {
        _id: "m5", title: "PDAs & Seeds", order: 2,
        description: "Master Program Derived Addresses — the backbone of Solana state design.",
        lessons: [
          { _id: "l13", title: "Program Derived Addresses", type: "content", order: 1, xpReward: 75, estimatedMinutes: 20 },
          { _id: "l14", title: "Bump Seeds & Canonical Bumps", type: "content", order: 2, xpReward: 75, estimatedMinutes: 18 },
          { _id: "l15", title: "Challenge: Counter with PDA", type: "challenge", order: 3, xpReward: 150, estimatedMinutes: 45 },
        ],
      },
      {
        _id: "m6", title: "CPIs & Composability", order: 3,
        description: "Call other programs from your program and build composable on-chain logic.",
        lessons: [
          { _id: "l16", title: "Cross-Program Invocations", type: "content", order: 1, xpReward: 75, estimatedMinutes: 20 },
          { _id: "l17", title: "CPI with Signer Seeds", type: "content", order: 2, xpReward: 75, estimatedMinutes: 18 },
          { _id: "l18", title: "Challenge: Build a Token Vault", type: "challenge", order: 3, xpReward: 200, estimatedMinutes: 60 },
        ],
      },
    ],
  },
  {
    _id: "mock-3",
    title: "Token-2022 & Extensions",
    slug: "token-2022",
    description: "Deep dive into Token-2022 — the next-generation SPL token standard. Master transfer hooks, confidential transfers, metadata pointers, non-transferable mints, and interest-bearing tokens.",
    longDescription: `## The Future of Solana Tokens

Token-2022 introduces a powerful extension system that enables new token behaviours impossible with the original SPL token program.

### What You'll Learn

- The architecture of Token-2022 and how extensions work
- Non-transferable (soulbound) token mints
- Transfer hooks for custom on-transfer logic
- Metadata pointers and on-chain token metadata
- Building the XP token system used by Superteam Academy

### Prerequisites

- Anchor Framework Basics (or equivalent)
- Understanding of SPL tokens`,
    difficulty: "advanced",
    durationHours: 5,
    xpReward: 2000,
    trackId: 4,
    instructor: { _id: "i3", name: "Pedro Carvalho", bio: "Token program specialist. Contributed to Token-2022 extensions spec at Solana Labs.", twitterHandle: "pedrotokens" },
    tags: ["token-2022", "extensions", "spl", "soulbound"],
    modules: [
      {
        _id: "m7", title: "Token-2022 Architecture", order: 1,
        description: "Understand how Token-2022 extends SPL Token with a flexible extension system.",
        lessons: [
          { _id: "l19", title: "From SPL Token to Token-2022", type: "content", order: 1, xpReward: 75, estimatedMinutes: 18 },
          { _id: "l20", title: "Extension System Deep Dive", type: "content", order: 2, xpReward: 75, estimatedMinutes: 20 },
          { _id: "l21", title: "Challenge: Non-Transferable Token", type: "challenge", order: 3, xpReward: 150, estimatedMinutes: 35 },
        ],
      },
      {
        _id: "m8", title: "Advanced Extensions", order: 2,
        description: "Build transfer hooks, attach metadata, and mint the soulbound XP token.",
        lessons: [
          { _id: "l22", title: "Transfer Hooks", type: "content", order: 1, xpReward: 100, estimatedMinutes: 25 },
          { _id: "l23", title: "Metadata Pointer & Token Metadata", type: "content", order: 2, xpReward: 100, estimatedMinutes: 25 },
          { _id: "l24", title: "Challenge: Build a Soulbound XP Token", type: "challenge", order: 3, xpReward: 250, estimatedMinutes: 60 },
        ],
      },
    ],
  },
  {
    _id: "mock-4",
    title: "DeFi on Solana: AMMs & DEXes",
    slug: "defi-amm",
    description: "Build a constant-product AMM from scratch. Understand liquidity pools, swap math, slippage, price impact, and flash loans. Learn how Raydium and Orca work under the hood.",
    longDescription: `## Build a Real AMM on Solana

Decentralized exchanges are the backbone of DeFi. This course teaches you to build one from first principles using Anchor.

### What You'll Learn

- The x·y=k constant product formula and its implications
- Liquidity pool design and LP token mechanics
- Swap instruction with slippage protection
- Flash loan attack vectors and defences
- Compute unit optimization for high-frequency programs

### Prerequisites

- Anchor Framework Basics
- Basic understanding of DeFi concepts`,
    difficulty: "advanced",
    durationHours: 8,
    xpReward: 2500,
    trackId: 3,
    instructor: { _id: "i4", name: "Rafael Souza", bio: "DeFi protocol engineer & MEV researcher. Previously at Orca and Meteora.", twitterHandle: "rafadefi" },
    tags: ["defi", "amm", "liquidity", "swap", "raydium"],
    modules: [
      {
        _id: "m9", title: "AMM Fundamentals", order: 1,
        description: "Learn the math behind automated market makers and liquidity pools.",
        lessons: [
          { _id: "l25", title: "Constant Product Formula (x·y=k)", type: "content", order: 1, xpReward: 75, estimatedMinutes: 20 },
          { _id: "l26", title: "Liquidity Providers & LP Tokens", type: "content", order: 2, xpReward: 75, estimatedMinutes: 20 },
          { _id: "l27", title: "Challenge: Swap Math", type: "challenge", order: 3, xpReward: 200, estimatedMinutes: 45 },
        ],
      },
      {
        _id: "m10", title: "Building the AMM Program", order: 2,
        description: "Implement initialize, add liquidity, and swap instructions in Anchor.",
        lessons: [
          { _id: "l28", title: "Pool Account Design", type: "content", order: 1, xpReward: 100, estimatedMinutes: 25 },
          { _id: "l29", title: "Challenge: Initialize & Add Liquidity", type: "challenge", order: 2, xpReward: 250, estimatedMinutes: 60 },
          { _id: "l30", title: "Challenge: Swap Instruction", type: "challenge", order: 3, xpReward: 300, estimatedMinutes: 90 },
        ],
      },
      {
        _id: "m11", title: "Security & Optimization", order: 3,
        description: "Protect against attacks and optimize compute units for production.",
        lessons: [
          { _id: "l31", title: "Slippage Protection & Price Oracles", type: "content", order: 1, xpReward: 100, estimatedMinutes: 20 },
          { _id: "l32", title: "Reentrancy & Flash Loan Attacks", type: "content", order: 2, xpReward: 100, estimatedMinutes: 20 },
          { _id: "l33", title: "Challenge: CU Optimization", type: "challenge", order: 3, xpReward: 200, estimatedMinutes: 40 },
        ],
      },
    ],
  },
  {
    _id: "mock-5",
    title: "Solana Program Security",
    slug: "program-security",
    description: "Learn to audit and secure Solana programs. Study real exploit patterns: missing signer checks, account confusion, integer overflows, PDA collisions, and reentrancy. Build an immune program.",
    longDescription: `## Become a Solana Security Expert

Security bugs in Solana programs have cost protocols hundreds of millions. This course teaches you to find and fix them before they're exploited.

### What You'll Learn

- The Solana attack surface and common vulnerability classes
- Missing owner/signer checks and account confusion exploits
- Integer overflow, underflow, and rounding errors in DeFi
- PDA substitution and collision attacks
- How to conduct a proper program audit

### Prerequisites

- Anchor Framework Basics
- Understanding of PDAs and CPIs`,
    difficulty: "advanced",
    durationHours: 7,
    xpReward: 2200,
    trackId: 5,
    instructor: { _id: "i5", name: "Gabriela Torres", bio: "Security researcher at Superteam & lead auditor. Found 12 critical bugs in production programs.", twitterHandle: "gabsec" },
    tags: ["security", "audit", "exploits", "rust"],
    modules: [
      {
        _id: "m12", title: "Attack Surface Overview", order: 1,
        description: "Survey the most common Solana vulnerability classes and how they arise.",
        lessons: [
          { _id: "l34", title: "Solana Security Model", type: "content", order: 1, xpReward: 75, estimatedMinutes: 20 },
          { _id: "l35", title: "Common Vulnerability Classes", type: "content", order: 2, xpReward: 75, estimatedMinutes: 25 },
          { _id: "l36", title: "Challenge: Find the Bug", type: "challenge", order: 3, xpReward: 200, estimatedMinutes: 40 },
        ],
      },
      {
        _id: "m13", title: "Account Validation Attacks", order: 2,
        description: "Deep dive into the most exploited class of Solana bugs.",
        lessons: [
          { _id: "l37", title: "Missing Owner Checks", type: "content", order: 1, xpReward: 100, estimatedMinutes: 20 },
          { _id: "l38", title: "Account Confusion & Type Confusion", type: "content", order: 2, xpReward: 100, estimatedMinutes: 20 },
          { _id: "l39", title: "Challenge: PDA Substitution — Fix It", type: "challenge", order: 3, xpReward: 250, estimatedMinutes: 50 },
        ],
      },
      {
        _id: "m14", title: "Arithmetic & Logic Bugs", order: 3,
        description: "Find and fix numeric bugs that drain DeFi protocols.",
        lessons: [
          { _id: "l40", title: "Integer Overflow & Underflow", type: "content", order: 1, xpReward: 100, estimatedMinutes: 18 },
          { _id: "l41", title: "Rounding Errors in DeFi", type: "content", order: 2, xpReward: 100, estimatedMinutes: 18 },
          { _id: "l42", title: "Challenge: Audit & Secure the Vault", type: "challenge", order: 3, xpReward: 300, estimatedMinutes: 60 },
        ],
      },
    ],
  },
];

export function getMockCourseBySlug(slug: string): SanityCourse | null {
  return MOCK_COURSES.find((c) => c.slug === slug) ?? null;
}
