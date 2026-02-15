export interface Track {
  id: number;
  name: string;
  display: string;
  icon: string;
  color: string;
}

export interface Course {
  slug: string;
  title: string;
  description: string;
  trackId: number;
  trackLevel: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  lessonCount: number;
  xpTotal: number;
  creator: string;
  creatorAddress: string;
  totalEnrollments: number;
  totalCompletions: number;
  isActive: boolean;
  thumbnailGradient: string;
  lessons: Lesson[];
}

export interface Lesson {
  index: number;
  title: string;
  description: string;
  type: "reading" | "challenge" | "quiz" | "code";
  xpReward: number;
  estimatedMinutes: number;
}

export interface LearnerProfile {
  address: string;
  displayName: string;
  xp: number;
  currentStreak: number;
  longestStreak: number;
  streakFreezes: number;
  coursesCompleted: number;
  lessonsCompleted: number;
  achievements: number[];
  joinedAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  address: string;
  displayName: string;
  xp: number;
  level: number;
  streak: number;
  coursesCompleted: number;
}

export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  category: "learning" | "streak" | "social" | "special";
}

export const TRACKS: Track[] = [
  { id: 0, name: "standalone", display: "Standalone", icon: "Box", color: "text-gray-400" },
  { id: 1, name: "anchor", display: "Anchor Framework", icon: "Anchor", color: "text-solana-purple" },
  { id: 2, name: "rust", display: "Rust for Solana", icon: "Cog", color: "text-orange-500" },
  { id: 3, name: "defi", display: "DeFi Development", icon: "TrendingUp", color: "text-solana-green" },
  { id: 4, name: "security", display: "Program Security", icon: "Shield", color: "text-red-500" },
  { id: 5, name: "frontend", display: "Frontend & dApps", icon: "Layout", color: "text-solana-blue" },
  { id: 6, name: "compression", display: "ZK Compression", icon: "Layers", color: "text-indigo-400" },
];

export const COURSES: Course[] = [
  {
    slug: "anchor-beginner",
    title: "Anchor Framework: Getting Started",
    description: "Build your first Solana program with Anchor. Learn PDAs, CPIs, and the Anchor account validation system from scratch.",
    trackId: 1,
    trackLevel: 1,
    difficulty: "beginner",
    lessonCount: 8,
    xpTotal: 500,
    creator: "SolDev",
    creatorAddress: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    totalEnrollments: 2847,
    totalCompletions: 1923,
    isActive: true,
    thumbnailGradient: "from-solana-purple to-indigo-600",
    lessons: [
      { index: 0, title: "What is Anchor?", description: "Overview of the Anchor framework and why it matters for Solana development.", type: "reading", xpReward: 50, estimatedMinutes: 10 },
      { index: 1, title: "Setting Up Your Environment", description: "Install Rust, Solana CLI, and Anchor. Configure your development environment.", type: "reading", xpReward: 50, estimatedMinutes: 15 },
      { index: 2, title: "Your First Program", description: "Write and deploy a Hello World program using Anchor.", type: "code", xpReward: 75, estimatedMinutes: 25 },
      { index: 3, title: "Understanding PDAs", description: "Program Derived Addresses: deterministic account creation without private keys.", type: "reading", xpReward: 50, estimatedMinutes: 20 },
      { index: 4, title: "PDA Challenge", description: "Create a counter program that stores state in a PDA.", type: "challenge", xpReward: 100, estimatedMinutes: 30 },
      { index: 5, title: "Account Constraints", description: "Learn init, mut, has_one, seeds, and other Anchor constraints.", type: "reading", xpReward: 50, estimatedMinutes: 15 },
      { index: 6, title: "Error Handling", description: "Custom error codes and proper error propagation in Anchor programs.", type: "reading", xpReward: 50, estimatedMinutes: 15 },
      { index: 7, title: "Final Project: Todo App", description: "Build a complete on-chain Todo application with CRUD operations.", type: "challenge", xpReward: 75, estimatedMinutes: 45 },
    ],
  },
  {
    slug: "anchor-intermediate",
    title: "Anchor Framework: Advanced Patterns",
    description: "Master CPIs, Token-2022 integration, and advanced account patterns. Build production-ready Solana programs.",
    trackId: 1,
    trackLevel: 2,
    difficulty: "intermediate",
    lessonCount: 10,
    xpTotal: 1000,
    creator: "SolDev",
    creatorAddress: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    totalEnrollments: 1245,
    totalCompletions: 678,
    isActive: true,
    thumbnailGradient: "from-indigo-600 to-purple-700",
    lessons: [
      { index: 0, title: "Cross-Program Invocations", description: "Call other programs from your Anchor program.", type: "reading", xpReward: 75, estimatedMinutes: 20 },
      { index: 1, title: "CPI Challenge: Token Minting", description: "Build a program that mints SPL tokens via CPI.", type: "challenge", xpReward: 150, estimatedMinutes: 35 },
      { index: 2, title: "Token-2022 Extensions", description: "NonTransferable, PermanentDelegate, and MetadataPointer.", type: "reading", xpReward: 75, estimatedMinutes: 25 },
      { index: 3, title: "Soulbound Tokens", description: "Create non-transferable achievement tokens.", type: "code", xpReward: 100, estimatedMinutes: 30 },
      { index: 4, title: "Account Closing & Rent", description: "Properly close accounts and reclaim rent.", type: "reading", xpReward: 75, estimatedMinutes: 15 },
      { index: 5, title: "Event Emission", description: "Emit and index events for off-chain consumption.", type: "reading", xpReward: 50, estimatedMinutes: 15 },
      { index: 6, title: "Init-If-Needed Pattern", description: "Idempotent account initialization patterns.", type: "reading", xpReward: 75, estimatedMinutes: 15 },
      { index: 7, title: "Rate Limiting On-Chain", description: "Implement daily caps and cooldowns in your program.", type: "code", xpReward: 100, estimatedMinutes: 25 },
      { index: 8, title: "Testing with Bankrun", description: "Fast local testing with LiteSVM/Bankrun.", type: "reading", xpReward: 75, estimatedMinutes: 20 },
      { index: 9, title: "Final: Escrow Program", description: "Build a full escrow system with Token-2022.", type: "challenge", xpReward: 225, estimatedMinutes: 60 },
    ],
  },
  {
    slug: "rust-solana-basics",
    title: "Rust for Solana Developers",
    description: "Learn Rust fundamentals tailored for Solana program development. Ownership, borrowing, traits, and error handling.",
    trackId: 2,
    trackLevel: 1,
    difficulty: "beginner",
    lessonCount: 12,
    xpTotal: 600,
    creator: "RustMaster",
    creatorAddress: "3QWfNtERZr7ACJGx9iy6pDcUEaEbSCZVhHh4j9CYZwNF",
    totalEnrollments: 3102,
    totalCompletions: 2341,
    isActive: true,
    thumbnailGradient: "from-orange-500 to-red-600",
    lessons: [
      { index: 0, title: "Why Rust for Solana?", description: "Understanding why Solana chose Rust and what it means for developers.", type: "reading", xpReward: 25, estimatedMinutes: 8 },
      { index: 1, title: "Variables & Types", description: "Rust's type system, mutability, and basic data types.", type: "reading", xpReward: 50, estimatedMinutes: 12 },
      { index: 2, title: "Ownership & Borrowing", description: "The core concept that makes Rust unique.", type: "reading", xpReward: 75, estimatedMinutes: 20 },
      { index: 3, title: "Ownership Challenge", description: "Fix compiler errors related to ownership.", type: "challenge", xpReward: 75, estimatedMinutes: 20 },
      { index: 4, title: "Structs & Enums", description: "Custom data types for on-chain state.", type: "reading", xpReward: 50, estimatedMinutes: 15 },
      { index: 5, title: "Pattern Matching", description: "Match expressions and Option/Result handling.", type: "reading", xpReward: 50, estimatedMinutes: 12 },
      { index: 6, title: "Error Handling", description: "Result, Option, and custom error types.", type: "reading", xpReward: 50, estimatedMinutes: 15 },
      { index: 7, title: "Traits & Generics", description: "Polymorphism and code reuse in Rust.", type: "reading", xpReward: 50, estimatedMinutes: 18 },
      { index: 8, title: "Collections", description: "Vec, HashMap, and iterators.", type: "reading", xpReward: 25, estimatedMinutes: 10 },
      { index: 9, title: "Serialization", description: "Borsh serialization for on-chain data.", type: "code", xpReward: 50, estimatedMinutes: 20 },
      { index: 10, title: "Testing in Rust", description: "Unit tests, integration tests, and test organization.", type: "reading", xpReward: 25, estimatedMinutes: 10 },
      { index: 11, title: "Final: Build a Library", description: "Create a Rust library for Solana account parsing.", type: "challenge", xpReward: 75, estimatedMinutes: 30 },
    ],
  },
  {
    slug: "defi-fundamentals",
    title: "DeFi on Solana: Fundamentals",
    description: "Understand AMMs, lending protocols, and yield optimization on Solana. Build your own basic swap program.",
    trackId: 3,
    trackLevel: 1,
    difficulty: "intermediate",
    lessonCount: 8,
    xpTotal: 1000,
    creator: "DeFiDegen",
    creatorAddress: "5ZLkBDnPHEaUYPCM3Aq7wMRr2JfqFNS1vS7coKjEYms",
    totalEnrollments: 1834,
    totalCompletions: 892,
    isActive: true,
    thumbnailGradient: "from-solana-green to-emerald-600",
    lessons: [
      { index: 0, title: "DeFi Overview", description: "What is DeFi and how does Solana enable it?", type: "reading", xpReward: 75, estimatedMinutes: 12 },
      { index: 1, title: "Token Accounts Deep Dive", description: "SPL Token accounts, ATAs, and delegation.", type: "reading", xpReward: 100, estimatedMinutes: 20 },
      { index: 2, title: "AMM Mathematics", description: "Constant product formula and slippage.", type: "reading", xpReward: 125, estimatedMinutes: 25 },
      { index: 3, title: "Build a Swap Pool", description: "Implement a basic x*y=k AMM.", type: "code", xpReward: 200, estimatedMinutes: 45 },
      { index: 4, title: "Oracles & Price Feeds", description: "Pyth, Switchboard, and price data on-chain.", type: "reading", xpReward: 100, estimatedMinutes: 15 },
      { index: 5, title: "Lending Protocols", description: "How lending and borrowing works on Solana.", type: "reading", xpReward: 100, estimatedMinutes: 20 },
      { index: 6, title: "Vault Patterns", description: "ERC-4626 style vaults on Solana.", type: "reading", xpReward: 100, estimatedMinutes: 20 },
      { index: 7, title: "Final: Yield Aggregator", description: "Design and implement a basic yield aggregator.", type: "challenge", xpReward: 200, estimatedMinutes: 60 },
    ],
  },
  {
    slug: "program-security",
    title: "Solana Program Security",
    description: "Learn common vulnerabilities, attack vectors, and security best practices for Solana programs.",
    trackId: 4,
    trackLevel: 1,
    difficulty: "advanced",
    lessonCount: 10,
    xpTotal: 2000,
    creator: "AuditGod",
    creatorAddress: "9XvtAezbRKa5dUx2h8YhkMvjFELvhP2CaBKkS5LFZy1z",
    totalEnrollments: 987,
    totalCompletions: 342,
    isActive: true,
    thumbnailGradient: "from-red-500 to-rose-700",
    lessons: [
      { index: 0, title: "Security Mindset", description: "Think like an attacker. Common vulnerability categories.", type: "reading", xpReward: 100, estimatedMinutes: 15 },
      { index: 1, title: "Account Validation", description: "Owner checks, signer checks, PDA validation.", type: "reading", xpReward: 150, estimatedMinutes: 20 },
      { index: 2, title: "Arithmetic Overflows", description: "Checked math and the dangers of unchecked operations.", type: "reading", xpReward: 150, estimatedMinutes: 15 },
      { index: 3, title: "Reentrancy on Solana", description: "How CPI-based reentrancy works and how to prevent it.", type: "reading", xpReward: 200, estimatedMinutes: 25 },
      { index: 4, title: "CTF: Hack the Bank", description: "Find and exploit vulnerabilities in a mock lending protocol.", type: "challenge", xpReward: 300, estimatedMinutes: 45 },
      { index: 5, title: "PDA Squatting", description: "Seed collision attacks and mitigation strategies.", type: "reading", xpReward: 150, estimatedMinutes: 20 },
      { index: 6, title: "Oracle Manipulation", description: "Price feed attacks and TWAP protections.", type: "reading", xpReward: 200, estimatedMinutes: 20 },
      { index: 7, title: "Closing Account Attacks", description: "Force-close and revival attacks on closeable accounts.", type: "reading", xpReward: 150, estimatedMinutes: 15 },
      { index: 8, title: "Fuzz Testing", description: "Using Trident for fuzzing Solana programs.", type: "code", xpReward: 200, estimatedMinutes: 30 },
      { index: 9, title: "Final: Full Audit", description: "Audit a complete DeFi protocol and write a report.", type: "challenge", xpReward: 400, estimatedMinutes: 90 },
    ],
  },
  {
    slug: "frontend-dapps",
    title: "Building Solana dApps with Next.js",
    description: "Connect wallets, read on-chain data, send transactions, and build production-ready frontend applications.",
    trackId: 5,
    trackLevel: 1,
    difficulty: "beginner",
    lessonCount: 8,
    xpTotal: 500,
    creator: "WebDev3",
    creatorAddress: "AzWz5oKaLMvqgjD9rrGPBE3HVn5vwzEUPNhkX1cL5UkR",
    totalEnrollments: 2156,
    totalCompletions: 1567,
    isActive: true,
    thumbnailGradient: "from-solana-blue to-cyan-600",
    lessons: [
      { index: 0, title: "Wallet Adapters", description: "Connect Phantom, Backpack, and other wallets.", type: "reading", xpReward: 50, estimatedMinutes: 12 },
      { index: 1, title: "Reading On-Chain Data", description: "Fetch accounts, deserialize, and display.", type: "code", xpReward: 75, estimatedMinutes: 20 },
      { index: 2, title: "Sending Transactions", description: "Build, sign, and confirm transactions.", type: "code", xpReward: 75, estimatedMinutes: 25 },
      { index: 3, title: "Anchor Client", description: "Using @coral-xyz/anchor in the browser.", type: "reading", xpReward: 50, estimatedMinutes: 15 },
      { index: 4, title: "Real-time Updates", description: "WebSocket subscriptions and account change listeners.", type: "reading", xpReward: 50, estimatedMinutes: 15 },
      { index: 5, title: "Token Display", description: "Show balances, NFTs, and token metadata.", type: "code", xpReward: 75, estimatedMinutes: 20 },
      { index: 6, title: "Error Handling & UX", description: "Transaction errors, loading states, and user feedback.", type: "reading", xpReward: 50, estimatedMinutes: 15 },
      { index: 7, title: "Final: Portfolio Dashboard", description: "Build a full portfolio dashboard with real-time data.", type: "challenge", xpReward: 75, estimatedMinutes: 45 },
    ],
  },
];

export const ACHIEVEMENTS: Achievement[] = [
  { id: 0, name: "First Steps", description: "Complete your first lesson", icon: "Footprints", xpReward: 50, category: "learning" },
  { id: 1, name: "Course Graduate", description: "Complete your first course", icon: "GraduationCap", xpReward: 100, category: "learning" },
  { id: 2, name: "Track Master", description: "Complete all courses in a track", icon: "Trophy", xpReward: 500, category: "learning" },
  { id: 3, name: "Week Warrior", description: "7-day learning streak", icon: "Flame", xpReward: 100, category: "streak" },
  { id: 4, name: "Monthly Machine", description: "30-day learning streak", icon: "Zap", xpReward: 300, category: "streak" },
  { id: 5, name: "Century Club", description: "100-day learning streak", icon: "Star", xpReward: 1000, category: "streak" },
  { id: 6, name: "Ambassador", description: "Refer 5 learners", icon: "Users", xpReward: 200, category: "social" },
  { id: 7, name: "Bug Hunter", description: "Report a verified bug", icon: "Bug", xpReward: 500, category: "special" },
  { id: 8, name: "Speed Runner", description: "Complete a course in under 24 hours", icon: "Timer", xpReward: 200, category: "special" },
  { id: 9, name: "Polyglot", description: "Complete courses in 3 different tracks", icon: "Globe", xpReward: 300, category: "learning" },
];

export const MOCK_LEARNER: LearnerProfile = {
  address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  displayName: "eltociear.sol",
  xp: 2450,
  currentStreak: 12,
  longestStreak: 34,
  streakFreezes: 2,
  coursesCompleted: 3,
  lessonsCompleted: 28,
  achievements: [0, 1, 3],
  joinedAt: "2025-12-15T00:00:00Z",
};

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, address: "HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH", displayName: "solana_chad.sol", xp: 15200, level: 12, streak: 89, coursesCompleted: 12 },
  { rank: 2, address: "5QPJK8FdE4GMfSRX5L7bPr6dYFr5CjWRLcqoP9ZLqgCA", displayName: "anchor_maxi", xp: 12800, level: 11, streak: 67, coursesCompleted: 10 },
  { rank: 3, address: "9u6u7JhQTRUbqS1x4rYsZBD5v4jKzYRzD3UEHXawPkjK", displayName: "rust_enjoyer", xp: 11500, level: 10, streak: 45, coursesCompleted: 9 },
  { rank: 4, address: "2ZZ3FbA4RG8RnQEFzfcN8LpVYEh5kZfLvqgGHiRPNFB4", displayName: "defi_wizard.sol", xp: 9800, level: 9, streak: 33, coursesCompleted: 8 },
  { rank: 5, address: "6YGwTQ8xyAmvZSKWBkuEjTYBriPLGKP5Rz7TBrY6LvCt", displayName: "security_guru", xp: 8200, level: 9, streak: 28, coursesCompleted: 7 },
  { rank: 6, address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU", displayName: "eltociear.sol", xp: 2450, level: 4, streak: 12, coursesCompleted: 3 },
  { rank: 7, address: "4pGkBYviVxW2mS3PJzKxqAWz8BnPv3W3HQhdJJKNLLB7", displayName: "newbie_dev", xp: 1800, level: 4, streak: 5, coursesCompleted: 2 },
  { rank: 8, address: "8RrH2gpAr4bkvLMFJ3UUxrFfHxB6H7fMb7m3VdNiGbR6", displayName: "hackathon_hero", xp: 1200, level: 3, streak: 8, coursesCompleted: 1 },
  { rank: 9, address: "3JQ8idGz7Y5EqA5kRKu6xBkfkMThHxFW2P9nAeRG7VwH", displayName: "crypto_student", xp: 800, level: 2, streak: 3, coursesCompleted: 1 },
  { rank: 10, address: "Bnk5idXnRWCfGKZ1dR5Tmqfs2uX8hk9d7q6YVShRYwrX", displayName: "fresh_learner", xp: 350, level: 1, streak: 1, coursesCompleted: 0 },
];
