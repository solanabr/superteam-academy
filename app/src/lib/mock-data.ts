import {
  Course,
  Module,
  Track,
  Instructor,
  Achievement,
  LeaderboardEntry,
  Credential,
  Streak,
  StreakDay,
} from "@/types";

export const TRACKS: Track[] = [
  {
    id: 1,
    name: "Solana Fundamentals",
    slug: "solana-fundamentals",
    description: "Master the foundations of Solana development",
    color: "#9945FF",
    icon: "⚡",
    courses: [],
  },
  {
    id: 2,
    name: "Anchor Development",
    slug: "anchor-development",
    description: "Build on-chain programs with Anchor framework",
    color: "#14F195",
    icon: "⚓",
    courses: [],
  },
  {
    id: 3,
    name: "DeFi Development",
    slug: "defi-development",
    description: "Create decentralized finance protocols",
    color: "#00C2FF",
    icon: "💱",
    courses: [],
  },
  {
    id: 4,
    name: "NFT & Tokens",
    slug: "nft-tokens",
    description: "Token-2022, Metaplex, and digital assets",
    color: "#FF6B6B",
    icon: "🎨",
    courses: [],
  },
];

export const INSTRUCTORS: Instructor[] = [
  {
    id: "1",
    name: "Lucas Martins",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=lucas",
    bio: "Solana core contributor and educator with 5+ years in blockchain development.",
    twitter: "lucasmartins_sol",
    github: "lucasmartins",
  },
  {
    id: "2",
    name: "Ana Beatriz",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ana",
    bio: "DeFi architect and founder of multiple successful Solana protocols.",
    twitter: "anabeatriz_sol",
    github: "anabeatriz",
  },
];

export const MOCK_COURSES: Course[] = [
  {
    id: "1",
    slug: "solana-fundamentals",
    courseId: "solana-101",
    title: "Solana Fundamentals",
    description:
      "A complete introduction to Solana development. Learn accounts, transactions, programs, and the Solana programming model from first principles.",
    shortDescription: "Master Solana from zero to deploying your first program.",
    thumbnail: "https://images.unsplash.com/photo-1639762681057-408e52192e55?w=800",
    instructor: INSTRUCTORS[0],
    difficulty: "beginner",
    duration: 480,
    lessonCount: 12,
    track: TRACKS[0],
    trackId: 1,
    trackLevel: 1,
    xpReward: 1200,
    xpPerLesson: 75,
    tags: ["solana", "web3", "blockchain", "fundamentals"],
    language: "en",
    isActive: true,
    enrolledCount: 1247,
    rating: 4.9,
    reviewCount: 243,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-06-01"),
  },
  {
    id: "2",
    slug: "anchor-development",
    courseId: "anchor-101",
    title: "Anchor Framework Deep Dive",
    description:
      "Build production-ready Solana programs with Anchor. PDAs, CPIs, Token-2022 integration, and security best practices.",
    shortDescription: "Build production on-chain programs with Anchor.",
    thumbnail: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800",
    instructor: INSTRUCTORS[0],
    difficulty: "intermediate",
    duration: 720,
    lessonCount: 16,
    track: TRACKS[1],
    trackId: 2,
    trackLevel: 1,
    xpReward: 2000,
    xpPerLesson: 100,
    tags: ["anchor", "rust", "solana", "programs"],
    language: "en",
    isActive: true,
    prerequisiteId: "1",
    enrolledCount: 876,
    rating: 4.8,
    reviewCount: 187,
    createdAt: new Date("2024-02-20"),
    updatedAt: new Date("2024-06-15"),
  },
  {
    id: "3",
    slug: "defi-protocols",
    courseId: "defi-101",
    title: "DeFi Protocol Development",
    description:
      "Design and implement DeFi protocols on Solana. AMMs, lending, yield farming, and composable finance primitives.",
    shortDescription: "Build AMMs, lending, and DeFi primitives on Solana.",
    thumbnail: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800",
    instructor: INSTRUCTORS[1],
    difficulty: "advanced",
    duration: 960,
    lessonCount: 20,
    track: TRACKS[2],
    trackId: 3,
    trackLevel: 1,
    xpReward: 3000,
    xpPerLesson: 125,
    tags: ["defi", "amm", "lending", "solana"],
    language: "en",
    isActive: true,
    prerequisiteId: "2",
    enrolledCount: 432,
    rating: 4.7,
    reviewCount: 98,
    createdAt: new Date("2024-03-10"),
    updatedAt: new Date("2024-06-20"),
  },
  {
    id: "4",
    slug: "token-2022-metaplex",
    courseId: "tokens-101",
    title: "Token-2022 & Metaplex Core",
    description:
      "Master the new token standard with extensions and build soulbound NFTs with Metaplex Core.",
    shortDescription: "Token extensions, soulbound NFTs, and digital credentials.",
    thumbnail: "https://images.unsplash.com/photo-1642104704074-907c0698cbd9?w=800",
    instructor: INSTRUCTORS[0],
    difficulty: "intermediate",
    duration: 600,
    lessonCount: 14,
    track: TRACKS[3],
    trackId: 4,
    trackLevel: 1,
    xpReward: 1800,
    xpPerLesson: 100,
    tags: ["token-2022", "metaplex", "nft", "soulbound"],
    language: "en",
    isActive: true,
    enrolledCount: 654,
    rating: 4.9,
    reviewCount: 134,
    createdAt: new Date("2024-04-01"),
    updatedAt: new Date("2024-06-25"),
  },
  {
    id: "5",
    slug: "solana-frontend",
    courseId: "frontend-101",
    title: "Solana Frontend Development",
    description:
      "Build modern Web3 frontends with Next.js, Wallet Adapter, and Solana's client libraries.",
    shortDescription: "Modern dApp frontends with Next.js and Wallet Adapter.",
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800",
    instructor: INSTRUCTORS[1],
    difficulty: "beginner",
    duration: 540,
    lessonCount: 10,
    track: TRACKS[0],
    trackId: 1,
    trackLevel: 2,
    xpReward: 1000,
    xpPerLesson: 75,
    tags: ["nextjs", "react", "frontend", "web3"],
    language: "en",
    isActive: true,
    enrolledCount: 1453,
    rating: 4.8,
    reviewCount: 312,
    createdAt: new Date("2024-05-01"),
    updatedAt: new Date("2024-07-01"),
  },
  {
    id: "6",
    slug: "solana-security",
    courseId: "security-101",
    title: "Solana Program Security",
    description:
      "Audit and secure Solana programs. Learn common attack vectors, security patterns, and formal verification.",
    shortDescription: "Audit, secure, and verify Solana programs.",
    thumbnail: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800",
    instructor: INSTRUCTORS[1],
    difficulty: "expert",
    duration: 1080,
    lessonCount: 18,
    track: TRACKS[1],
    trackId: 2,
    trackLevel: 2,
    xpReward: 4000,
    xpPerLesson: 175,
    tags: ["security", "audit", "solana", "advanced"],
    language: "en",
    isActive: true,
    prerequisiteId: "2",
    enrolledCount: 213,
    rating: 5.0,
    reviewCount: 67,
    createdAt: new Date("2024-05-15"),
    updatedAt: new Date("2024-07-05"),
  },
];

export const MOCK_MODULES: Record<string, Module[]> = {
  "solana-fundamentals": [
    {
      id: "m1",
      courseId: "1",
      title: "Introduction to Solana",
      description: "Understanding the Solana ecosystem",
      order: 1,
      lessons: [
        {
          id: "l1",
          moduleId: "m1",
          courseId: "1",
          title: "What is Solana?",
          type: "content",
          duration: 15,
          order: 1,
          index: 0,
          xpReward: 75,
        },
        {
          id: "l2",
          moduleId: "m1",
          courseId: "1",
          title: "Proof of History Explained",
          type: "content",
          duration: 20,
          order: 2,
          index: 1,
          xpReward: 75,
        },
        {
          id: "l3",
          moduleId: "m1",
          courseId: "1",
          title: "Accounts Model Deep Dive",
          type: "challenge",
          duration: 30,
          order: 3,
          index: 2,
          xpReward: 100,
          challenge: {
            id: "c1",
            prompt: "Derive the correct Program Derived Address (PDA) for a given set of seeds and program ID.",
            starterCode: `import { PublicKey } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf");

// TODO: Derive the PDA for seeds ["config"]
// and return [pda, bump]
export function deriveConfigPda(): [PublicKey, number] {
  // Your code here
}`,
            solution: `import { PublicKey } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf");

export function deriveConfigPda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    PROGRAM_ID
  );
}`,
            language: "typescript",
            testCases: [
              {
                id: "tc1",
                description: "Should return a valid PDA",
                expectedOutput: "Valid PublicKey with bump",
                isHidden: false,
              },
            ],
            hints: [
              "Use PublicKey.findProgramAddressSync",
              "Seeds are UTF-8 encoded strings",
            ],
          },
        },
      ],
    },
    {
      id: "m2",
      courseId: "1",
      title: "Transactions & Instructions",
      description: "How Solana processes transactions",
      order: 2,
      lessons: [
        {
          id: "l4",
          moduleId: "m2",
          courseId: "1",
          title: "Transaction Anatomy",
          type: "content",
          duration: 20,
          order: 1,
          index: 3,
          xpReward: 75,
        },
        {
          id: "l5",
          moduleId: "m2",
          courseId: "1",
          title: "Building Your First Transaction",
          type: "challenge",
          duration: 35,
          order: 2,
          index: 4,
          xpReward: 100,
          challenge: {
            id: "c2",
            prompt:
              "Build a transaction that transfers 0.01 SOL from one wallet to another.",
            starterCode: `import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

export async function buildTransferTransaction(
  from: PublicKey,
  to: PublicKey,
  connection: Connection
): Promise<Transaction> {
  // TODO: Build a transaction that transfers 0.01 SOL
}`,
            solution: `import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

export async function buildTransferTransaction(
  from: PublicKey,
  to: PublicKey,
  connection: Connection
): Promise<Transaction> {
  const transaction = new Transaction();
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: from,
      toPubkey: to,
      lamports: 0.01 * LAMPORTS_PER_SOL,
    })
  );
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = from;
  return transaction;
}`,
            language: "typescript",
            testCases: [
              {
                id: "tc2",
                description: "Transaction should have 1 instruction",
                expectedOutput: "1",
                isHidden: false,
              },
              {
                id: "tc3",
                description: "Transfer amount should be 0.01 SOL",
                expectedOutput: "10000000 lamports",
                isHidden: false,
              },
            ],
            hints: [
              "Use SystemProgram.transfer instruction",
              "1 SOL = 1,000,000,000 lamports",
            ],
          },
        },
      ],
    },
  ],
};

export const MOCK_ACHIEVEMENTS: Achievement[] = [
  {
    id: "ach1",
    achievementId: "first-steps",
    name: "First Steps",
    description: "Complete your first lesson",
    imageUri: "https://api.dicebear.com/7.x/shapes/svg?seed=first-steps",
    category: "progress",
    xpReward: 50,
    rarity: "common",
    isUnlocked: true,
    unlockedAt: new Date("2024-01-20"),
  },
  {
    id: "ach2",
    achievementId: "course-completer",
    name: "Course Completer",
    description: "Complete your first course",
    imageUri: "https://api.dicebear.com/7.x/shapes/svg?seed=course-completer",
    category: "progress",
    xpReward: 200,
    rarity: "rare",
    isUnlocked: true,
    unlockedAt: new Date("2024-02-15"),
  },
  {
    id: "ach3",
    achievementId: "week-warrior",
    name: "Week Warrior",
    description: "Maintain a 7-day streak",
    imageUri: "https://api.dicebear.com/7.x/shapes/svg?seed=week-warrior",
    category: "streak",
    xpReward: 100,
    rarity: "rare",
    isUnlocked: true,
    unlockedAt: new Date("2024-02-01"),
  },
  {
    id: "ach4",
    achievementId: "rust-rookie",
    name: "Rust Rookie",
    description: "Complete your first Rust challenge",
    imageUri: "https://api.dicebear.com/7.x/shapes/svg?seed=rust-rookie",
    category: "skill",
    xpReward: 150,
    rarity: "common",
    isUnlocked: false,
  },
  {
    id: "ach5",
    achievementId: "anchor-expert",
    name: "Anchor Expert",
    description: "Complete the Anchor framework course",
    imageUri: "https://api.dicebear.com/7.x/shapes/svg?seed=anchor-expert",
    category: "skill",
    xpReward: 500,
    rarity: "epic",
    isUnlocked: false,
  },
  {
    id: "ach6",
    achievementId: "early-adopter",
    name: "Early Adopter",
    description: "Join Superteam Academy in its first month",
    imageUri: "https://api.dicebear.com/7.x/shapes/svg?seed=early-adopter",
    category: "special",
    xpReward: 1000,
    rarity: "legendary",
    isUnlocked: true,
    unlockedAt: new Date("2024-01-15"),
  },
  {
    id: "ach7",
    achievementId: "monthly-master",
    name: "Monthly Master",
    description: "Maintain a 30-day streak",
    imageUri: "https://api.dicebear.com/7.x/shapes/svg?seed=monthly-master",
    category: "streak",
    xpReward: 500,
    rarity: "epic",
    isUnlocked: false,
  },
  {
    id: "ach8",
    achievementId: "speed-runner",
    name: "Speed Runner",
    description: "Complete a course in under 24 hours",
    imageUri: "https://api.dicebear.com/7.x/shapes/svg?seed=speed-runner",
    category: "progress",
    xpReward: 300,
    rarity: "rare",
    isUnlocked: false,
  },
];

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    userId: "user1",
    username: "solana_wizard",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=wizard",
    walletAddress: "7Vx...K3mN",
    xp: 48750,
    level: 22,
    streak: 87,
    coursesCompleted: 6,
  },
  {
    rank: 2,
    userId: "user2",
    username: "defi_builder",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=builder",
    walletAddress: "3Qr...P9sL",
    xp: 42100,
    level: 20,
    streak: 45,
    coursesCompleted: 5,
  },
  {
    rank: 3,
    userId: "user3",
    username: "anchor_dev",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=anchor",
    walletAddress: "9Hn...W2dV",
    xp: 38900,
    level: 19,
    streak: 120,
    coursesCompleted: 4,
  },
  {
    rank: 4,
    userId: "user4",
    username: "cryptobuilder_br",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=crypto",
    walletAddress: "5Fm...T7xA",
    xp: 31200,
    level: 17,
    streak: 33,
    coursesCompleted: 4,
  },
  {
    rank: 5,
    userId: "user5",
    username: "rust_rustler",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=rustler",
    walletAddress: "2Kp...R4bC",
    xp: 28600,
    level: 16,
    streak: 15,
    coursesCompleted: 3,
  },
  {
    rank: 6,
    userId: "user6",
    username: "sol_sensei",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sensei",
    walletAddress: "8Lz...Q6eD",
    xp: 25400,
    level: 15,
    streak: 67,
    coursesCompleted: 3,
  },
  {
    rank: 7,
    userId: "user7",
    username: "web3_pioneer",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=pioneer",
    walletAddress: "6Tb...Y5wH",
    xp: 22100,
    level: 14,
    streak: 28,
    coursesCompleted: 3,
  },
  {
    rank: 8,
    userId: "user8",
    username: "blockchain_br",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=blockchain",
    walletAddress: "4Md...N8vI",
    xp: 19800,
    level: 14,
    streak: 12,
    coursesCompleted: 2,
  },
  {
    rank: 9,
    userId: "user9",
    username: "nft_ninja",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ninja",
    walletAddress: "1Pq...J3kF",
    xp: 17200,
    level: 13,
    streak: 9,
    coursesCompleted: 2,
  },
  {
    rank: 10,
    userId: "user10",
    username: "token_master",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=token",
    walletAddress: "0Wr...S1mG",
    xp: 15100,
    level: 12,
    streak: 41,
    coursesCompleted: 2,
  },
];

export const MOCK_CREDENTIAL: Credential = {
  id: "cred1",
  mintAddress: "AcADx...mint",
  walletAddress: "7Vx...K3mN",
  track: TRACKS[0],
  level: 1,
  coursesCompleted: 1,
  totalXp: 1200,
  issuedAt: new Date("2024-02-20"),
  name: "Solana Fundamentals — Level 1",
  imageUri: "https://api.dicebear.com/7.x/shapes/svg?seed=credential1",
  metadataUri: "https://arweave.net/example-metadata",
  collection: "SolanaFundamentalsCollection",
};

// Community / Forum
export const MOCK_DISCUSSION_THREADS = [
  {
    id: "t1",
    title: "How do I derive a PDA for my program?",
    category: "Q&A",
    author: "solana_newbie",
    avatar: "SN",
    replies: 12,
    views: 340,
    lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isPinned: true,
    isResolved: true,
  },
  {
    id: "t2",
    title: "Anchor vs native Solana: which to choose?",
    category: "Discussion",
    author: "defi_builder",
    avatar: "DB",
    replies: 24,
    views: 890,
    lastActivity: new Date(Date.now() - 5 * 60 * 60 * 1000),
    isPinned: true,
    isResolved: false,
  },
  {
    id: "t3",
    title: "Token-2022 Transfer Hook implementation tips",
    category: "Q&A",
    author: "token_master",
    avatar: "TM",
    replies: 8,
    views: 156,
    lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    isPinned: false,
    isResolved: true,
  },
  {
    id: "t4",
    title: "Share your first dApp deployed on Devnet!",
    category: "Showcase",
    author: "rust_rustler",
    avatar: "RR",
    replies: 45,
    views: 1200,
    lastActivity: new Date(Date.now() - 30 * 60 * 1000),
    isPinned: false,
    isResolved: false,
  },
  {
    id: "t5",
    title: "CPI from Anchor program to System Program",
    category: "Q&A",
    author: "anchor_dev",
    avatar: "AD",
    replies: 5,
    views: 98,
    lastActivity: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    isPinned: false,
    isResolved: false,
  },
];

// Daily Challenges & Seasonal Events
export const MOCK_DAILY_CHALLENGE = {
  id: "dc1",
  title: "Complete any 2 lessons today",
  description: "Finish 2 lessons from any course to earn bonus XP",
  xpReward: 50,
  progress: 1,
  target: 2,
  expiresAt: new Date(new Date().setHours(23, 59, 59)),
};

export const MOCK_SEASONAL_EVENTS = [
  {
    id: "ev1",
    name: "Solana Winter Build 2025",
    description: "Complete 5 courses and mint a special achievement NFT",
    startsAt: new Date("2025-01-01"),
    endsAt: new Date("2025-03-31"),
    reward: "Limited edition Winter Builder NFT",
    participants: 1240,
  },
  {
    id: "ev2",
    name: "LATAM Developer Sprint",
    description: "Earn 5,000 XP in 30 days — top 50 get bonus credentials",
    startsAt: new Date("2025-02-01"),
    endsAt: new Date("2025-02-28"),
    reward: "Exclusive LATAM Sprint credential",
    participants: 890,
  },
];

export function generateMockStreak(): Streak {
  const history: StreakDay[] = [];
  const today = new Date();

  for (let i = 89; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const isActive = i > 7 ? Math.random() > 0.35 : i < 5 ? !isWeekend : Math.random() > 0.2;
    history.push({
      date: date.toISOString().split("T")[0],
      isActive,
      xpEarned: isActive ? Math.floor(Math.random() * 200) + 50 : 0,
    });
  }

  return {
    currentStreak: 12,
    longestStreak: 34,
    lastActivityDate: new Date(),
    history,
    totalActiveDays: history.filter((d) => d.isActive).length,
    isFrozen: false,
  };
}
