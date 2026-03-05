// Stub implementations for development.
// These return mock data and will be replaced with on-chain reads.

import type {
  LearningProgressService,
  CourseService,
  LeaderboardService,
  EnrollmentAction,
  LessonAction,
  UserService,
  CredentialService,
  Course,
  Lesson,
  XpSummary,
  StreakData,
  Credential,
  Enrollment,
  LeaderboardEntry,
  UserProfile,
  ActivityEntry,
} from "./types";

// -- Mock data --

const MOCK_COURSES: Course[] = [
  {
    slug: "solana-fundamentals",
    title: "Solana Fundamentals",
    description:
      "Accounts, transactions, PDAs, and the Solana programming model from scratch.",
    lessonCount: 12,
    totalXp: 1200,
    level: "Beginner",
    creator: "Superteam Academy",
  },
  {
    slug: "anchor-development",
    title: "Anchor Development",
    description:
      "Build, test, and deploy Solana programs using the Anchor framework.",
    lessonCount: 16,
    totalXp: 2400,
    level: "Intermediate",
    creator: "Superteam Academy",
  },
  {
    slug: "token-engineering",
    title: "Token Engineering",
    description:
      "Token-2022 extensions, Metaplex Core, soulbound tokens, and token economics.",
    lessonCount: 10,
    totalXp: 2000,
    level: "Advanced",
    creator: "Superteam Academy",
  },
  {
    slug: "defi-composability",
    title: "DeFi Composability",
    description:
      "Cross-program invocations, AMM integrations, flash loans, and composable DeFi on Solana.",
    lessonCount: 14,
    totalXp: 2800,
    level: "Advanced",
    creator: "Superteam Academy",
  },
  {
    slug: "nft-marketplace",
    title: "NFT Marketplace",
    description:
      "Build an NFT marketplace from scratch using Metaplex, listing mechanics, and royalty enforcement.",
    lessonCount: 11,
    totalXp: 1800,
    level: "Intermediate",
    creator: "Superteam Academy",
  },
  {
    slug: "solana-mobile",
    title: "Solana Mobile",
    description:
      "Saga, Mobile Wallet Adapter, and building mobile-first dApps for the Solana ecosystem.",
    lessonCount: 8,
    totalXp: 1400,
    level: "Intermediate",
    creator: "Superteam Academy",
  },
];

const MOCK_LESSONS: Record<string, Lesson[]> = {
  "solana-fundamentals": [
    { id: "1", courseSlug: "solana-fundamentals", title: "What is Solana?", order: 1, xpReward: 100, type: "reading" },
    { id: "2", courseSlug: "solana-fundamentals", title: "Accounts & Programs", order: 2, xpReward: 100, type: "reading" },
    { 
      id: "3", 
      courseSlug: "solana-fundamentals", 
      title: "Your First Transaction", 
      order: 3, 
      xpReward: 100, 
      type: "coding",
      starterCode: `// Write a function that creates a simple transfer instruction\nfunction createTransferInstruction(from, to, amount) {\n  // Your code here\n  return {\n    keys: [\n      { pubkey: from, isSigner: true, isWritable: true },\n      { pubkey: to, isSigner: false, isWritable: true },\n    ],\n    programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',\n    data: Buffer.from([2, 0, 0, 0, 0, 0, 0, 0])\n  };\n}\n\n// Test your function\nconsole.log(createTransferInstruction('sender', 'receiver', 1000));`,
      testCases: [
        { input: "N/A", expected: "object", description: "Returns a valid instruction object" }
      ]
    },
    { id: "4", courseSlug: "solana-fundamentals", title: "Program Derived Addresses", order: 4, xpReward: 100, type: "reading" },
    { 
      id: "5", 
      courseSlug: "solana-fundamentals", 
      title: "Build a Counter Program", 
      order: 5, 
      xpReward: 100, 
      type: "coding",
      starterCode: `// Create a simple counter using Solana's Anchor framework\n// Fill in the missing parts\n\n#[program]\npub mod counter {\n    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {\n        // Set counter to 0\n        ctx.accounts.counter.count = 0;\n        Ok(())\n    }\n\n    pub fn increment(ctx: Context<Increment>) -> Result<()> {\n        // Increment the counter\n        ctx.accounts.counter.count += 1;\n        Ok(())\n    }\n}\n\n// Simple test\nlet counter = { count: 0 };\ncounter.count += 1;\nconsole.log(counter.count === 1 ? "PASS" : "FAIL");`,
      testCases: [
        { input: "N/A", expected: "PASS", description: "Counter increments correctly" }
      ]
    },
    { id: "6", courseSlug: "solana-fundamentals", title: "Token Basics", order: 6, xpReward: 100, type: "reading" },
    { 
      id: "7", 
      courseSlug: "solana-fundamentals", 
      title: "SPL Token Transfers", 
      order: 7, 
      xpReward: 100, 
      type: "coding",
      starterCode: `// Create an SPL token transfer\nfunction createTokenTransferInstruction(source, destination, mint, authority, amount) {\n  // Return a valid transfer instruction\n  return {\n    programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',\n    keys: [\n      { pubkey: source, isSigner: false, isWritable: true },\n      { pubkey: mint, isSigner: false, isWritable: false },\n      { pubkey: destination, isSigner: false, isWritable: true },\n      { pubkey: authority, isSigner: true, isWritable: false },\n    ],\n    data: Buffer.from([3, 0, 0, 0, 0, 0, 0, 0])\n  };\n}\n\n// Test\nconst result = createTokenTransferInstruction('source', 'dest', 'mint', 'auth', 1000);\nconsole.log(result && result.programId ? "PASS" : "FAIL");`,
      testCases: [
        { input: "N/A", expected: "PASS", description: "Creates valid SPL transfer" }
      ]
    },
    { id: "8", courseSlug: "solana-fundamentals", title: "Error Handling", order: 8, xpReward: 100, type: "reading" },
    { id: "9", courseSlug: "solana-fundamentals", title: "Testing with Bankrun", order: 9, xpReward: 100, type: "coding" },
    { id: "10", courseSlug: "solana-fundamentals", title: "CPI Deep Dive", order: 10, xpReward: 100, type: "reading" },
    { id: "11", courseSlug: "solana-fundamentals", title: "Deploy to Devnet", order: 11, xpReward: 100, type: "coding" },
    { id: "12", courseSlug: "solana-fundamentals", title: "Final Quiz", order: 12, xpReward: 100, type: "quiz" },
  ],
  "anchor-development": [
    { id: "1", courseSlug: "anchor-development", title: "Why Anchor?", order: 1, xpReward: 150, type: "reading" },
    { 
      id: "2", 
      courseSlug: "anchor-development", 
      title: "Project Setup", 
      order: 2, 
      xpReward: 150, 
      type: "coding",
      starterCode: `// Initialize a new Anchor project\n// Fill in the missing parts\n\nconst anchor = require('@coral-xyz/anchor');\n\nconst provider = anchor.AnchorProvider.local();\nanchor.setProvider(provider);\n\n// Create a new program\nconst program = anchor.workspace.MyProgram;\n\nconsole.log("Program ID:", program.programId.toString());\nconsole.log(provider.wallet.publicKey.toString());`,
      testCases: [
        { input: "N/A", expected: "Program ID:", description: "Project initializes correctly" }
      ]
    },
    { id: "3", courseSlug: "anchor-development", title: "Account Macros", order: 3, xpReward: 150, type: "reading" },
    { 
      id: "4", 
      courseSlug: "anchor-development", 
      title: "Instructions & Context", 
      order: 4, 
      xpReward: 150, 
      type: "coding",
      starterCode: `// Define an Anchor instruction\n#[derive(Accounts)]\npub struct CreateUser<'info> {\n    #[account(\n        init,\n        payer = user,\n        space = 8 + User::INIT_SPACE\n    )]\n    pub user: Account<'info, User>,\n    #[account(mut)]\n    pub user: Signer<'info>,\n    pub system_program: Program<'info, System>,\n}\n\n// Implement the instruction\npub fn create_user(ctx: Context<CreateUser>, name: String) -> Result<()> {\n    ctx.accounts.user.name = name;\n    ctx.accounts.user.bump = ctx.bumps.user;\n    Ok(())\n}\n\n// Test: Simulate creating a user\nlet user = { name: "Alice", bump: 1 };\nconsole.log(user.name === "Alice" ? "PASS" : "FAIL");`,
      testCases: [
        { input: "N/A", expected: "PASS", description: "Creates user account correctly" }
      ]
    },
    { id: "5", courseSlug: "anchor-development", title: "Constraints & Validation", order: 5, xpReward: 150, type: "reading" },
    { id: "6", courseSlug: "anchor-development", title: "Build a Voting Program", order: 6, xpReward: 150, type: "coding" },
    { id: "7", courseSlug: "anchor-development", title: "Events & Logging", order: 7, xpReward: 150, type: "reading" },
    { id: "8", courseSlug: "anchor-development", title: "Testing with Anchor", order: 8, xpReward: 150, type: "coding" },
  ],
  "token-engineering": [
    { id: "1", courseSlug: "token-engineering", title: "Token-2022 Overview", order: 1, xpReward: 200, type: "reading" },
    { id: "2", courseSlug: "token-engineering", title: "Mint Extensions", order: 2, xpReward: 200, type: "reading" },
    { 
      id: "3", 
      courseSlug: "token-engineering", 
      title: "Build a Soulbound Token", 
      order: 3, 
      xpReward: 200, 
      type: "coding",
      starterCode: `// Create a soulbound token using Token-2022\n// Soulbound tokens cannot be transferred once minted\n\nconst { Keypair, Transaction, SystemProgram } = require('@solana/web3.js');\n\nfunction createSoulboundTokenMint() {\n  // Using Token-2022 with PermanentDelegate extension\n  const mintKeypair = Keypair.generate();\n  \n  const transaction = new Transaction();\n  \n  // Add create mint instruction\n  // Add PermanentDelegate extension (makes it soulbound)\n  \n  return {\n    mint: mintKeypair.publicKey,\n    transaction: transaction,\n    isSoulbound: true\n  };\n}\n\nconst result = createSoulboundTokenMint();\nconsole.log(result.isSoulbound ? "PASS" : "FAIL");`,
      testCases: [
        { input: "N/A", expected: "PASS", description: "Soulbound token created" }
      ]
    },
    { id: "4", courseSlug: "token-engineering", title: "Metaplex Core NFTs", order: 4, xpReward: 200, type: "reading" },
    { id: "5", courseSlug: "token-engineering", title: "Credential Issuance", order: 5, xpReward: 200, type: "coding" },
  ],
};

// -- Stubs --

export const learningProgressService: LearningProgressService = {
  async getXpSummary(): Promise<XpSummary> {
    return { total: 2700, level: 5 };
  },

  async getStreak(): Promise<StreakData> {
    return {
      current: 5,
      longest: 12,
      lastActiveDate: new Date().toISOString().split("T")[0],
    };
  },

  async getCredentials(): Promise<Credential[]> {
    return [
      {
        id: "cred-1",
        track: "Solana Fundamentals",
        level: 1,
        issuedAt: "2026-02-15",
      },
      {
        id: "cred-2",
        track: "Anchor Development",
        level: 2,
        issuedAt: "2026-02-22",
      },
    ];
  },

  async getEnrollments(): Promise<Enrollment[]> {
    return [
      {
        courseSlug: "solana-fundamentals",
        enrolledAt: "2026-02-10",
        completedLessons: 12,
        totalLessons: 12,
        isCompleted: true,
      },
      {
        courseSlug: "anchor-development",
        enrolledAt: "2026-02-16",
        completedLessons: 5,
        totalLessons: 16,
        isCompleted: false,
      },
      {
        courseSlug: "token-engineering",
        enrolledAt: "2026-02-25",
        completedLessons: 1,
        totalLessons: 10,
        isCompleted: false,
      },
    ];
  },
};

export const courseService: CourseService = {
  async getCourses(): Promise<Course[]> {
    return MOCK_COURSES;
  },

  async getCourse(slug: string): Promise<Course | null> {
    return MOCK_COURSES.find((c) => c.slug === slug) ?? null;
  },

  async getLessons(courseSlug: string): Promise<Lesson[]> {
    return MOCK_LESSONS[courseSlug] ?? [];
  },

  async getLesson(
    courseSlug: string,
    lessonId: string
  ): Promise<Lesson | null> {
    const lessons = MOCK_LESSONS[courseSlug] ?? [];
    return lessons.find((l) => l.id === lessonId) ?? null;
  },
};

const MOCK_WALLETS = [
  "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  "3Kh9sFe4G8XTdEq3X9AwCPYz8qW7GzD5Rp4tN2kVL8mQ",
  "5ygM2xNDfQvVGnR7D1fCqXrU3NbWEKz9TqkL6RyJ2tPw",
  "4FbQnDR8yJ7pGkW6T2xEMvL9dZ3CsN5HqA7uXjKf8mRe",
  "8rJ6YkQz2TpWxN4C3mDfR7gL5vHsB9E1aKuXwZj6tMn3",
  "2mXfH5vNqB8dK3LwJ6rGcT9Y7sZpE4A1hWxUkQ5jRt8n",
  "6tR9CpWmX3kG7vN8dL2qHjY5sZxE1bA4fKuJwQ6nMr3T",
  "1nK8JhWx5tR4cP9mQ3dG7vL6bZ2sY8eA5fXuNrTj4Mq7",
  "BvR3Kp8mN6dW2tJ5xQ9gH7cL4sZ1yE8aF3uXwMj6Tr5n",
];

export const leaderboardService: LeaderboardService = {
  async getLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
    return MOCK_WALLETS.slice(0, Math.min(limit, 10)).map((wallet, i) => ({
      rank: i + 1,
      wallet,
      username: i < 3 ? ["solanabr.sol", "drexalpha.sol", "turbine_dev"][i] : undefined,
      xp: 8500 - i * 720,
      level: Math.floor(Math.sqrt((8500 - i * 720) / 100)),
      credentialCount: Math.max(1, 6 - i),
    }));
  },
};

export const enrollmentAction: EnrollmentAction = {
  async enroll() {
    // Stub: will be wallet-signed on devnet
    return { success: true, txHash: "stub-tx-hash" };
  },

  async closeEnrollment() {
    return { success: true, txHash: "stub-tx-hash" };
  },
};

export const lessonAction: LessonAction = {
  async completeLesson() {
    // Stub: will be backend-signed
    return { success: true, xpAwarded: 100 };
  },
};

// -- User profile stubs --

const MOCK_CREDENTIALS: Credential[] = [
  {
    id: "cred-1",
    track: "Solana Fundamentals",
    level: 1,
    mintAddress: "CrED1soLFundAmentALs111111111111111111111111",
    issuedAt: "2026-02-15",
  },
  {
    id: "cred-2",
    track: "Anchor Development",
    level: 2,
    mintAddress: "CrED2AnchorDev222222222222222222222222222222",
    issuedAt: "2026-02-22",
  },
];

export const userService: UserService = {
  async getProfile(): Promise<UserProfile> {
    return {
      wallet: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      username: "solanabr.sol",
      joinedAt: "2026-01-15",
      xp: { total: 2700, level: 5 },
      streak: {
        current: 5,
        longest: 12,
        lastActiveDate: new Date().toISOString().split("T")[0],
      },
      credentials: MOCK_CREDENTIALS,
      enrollments: [
        {
          courseSlug: "solana-fundamentals",
          enrolledAt: "2026-02-10",
          completedLessons: 12,
          totalLessons: 12,
          isCompleted: true,
        },
        {
          courseSlug: "anchor-development",
          enrolledAt: "2026-02-16",
          completedLessons: 5,
          totalLessons: 16,
          isCompleted: false,
        },
        {
          courseSlug: "token-engineering",
          enrolledAt: "2026-02-25",
          completedLessons: 1,
          totalLessons: 10,
          isCompleted: false,
        },
      ],
    };
  },

  async getPublicProfile(username: string): Promise<UserProfile | null> {
    const profiles: Record<string, UserProfile> = {
      "solanabr.sol": {
        wallet: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
        username: "solanabr.sol",
        joinedAt: "2026-01-15",
        xp: { total: 2700, level: 5 },
        streak: { current: 5, longest: 12, lastActiveDate: "2026-03-01" },
        credentials: MOCK_CREDENTIALS,
        enrollments: [
          { courseSlug: "solana-fundamentals", enrolledAt: "2026-02-10", completedLessons: 12, totalLessons: 12, isCompleted: true },
          { courseSlug: "anchor-development", enrolledAt: "2026-02-16", completedLessons: 5, totalLessons: 16, isCompleted: false },
        ],
      },
      "drexalpha.sol": {
        wallet: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
        username: "drexalpha.sol",
        joinedAt: "2026-01-20",
        xp: { total: 1800, level: 4 },
        streak: { current: 3, longest: 8, lastActiveDate: "2026-03-01" },
        credentials: [MOCK_CREDENTIALS[0]],
        enrollments: [
          { courseSlug: "solana-fundamentals", enrolledAt: "2026-02-12", completedLessons: 12, totalLessons: 12, isCompleted: true },
        ],
      },
    };
    return profiles[username] ?? null;
  },

  async getActivity(): Promise<ActivityEntry[]> {
    return [
      {
        id: "act-1",
        type: "lesson_completed",
        label: "Completed lesson",
        detail: "Build a Soulbound Token",
        date: "2026-03-01",
      },
      {
        id: "act-2",
        type: "credential_earned",
        label: "Earned credential",
        detail: "Solana Fundamentals",
        date: "2026-02-22",
      },
      {
        id: "act-3",
        type: "enrolled",
        label: "Enrolled in",
        detail: "Token Engineering",
        date: "2026-02-25",
      },
      {
        id: "act-4",
        type: "lesson_completed",
        label: "Completed lesson",
        detail: "Deploy to Devnet",
        date: "2026-02-20",
      },
      {
        id: "act-5",
        type: "lesson_completed",
        label: "Completed lesson",
        detail: "Build a Voting Program",
        date: "2026-02-19",
      },
    ];
  },
};

export const credentialService: CredentialService = {
  async getCredential(id: string): Promise<Credential | null> {
    return MOCK_CREDENTIALS.find((c) => c.id === id) ?? null;
  },
  async getCredentials(): Promise<Credential[]> {
    return MOCK_CREDENTIALS;
  },
};
