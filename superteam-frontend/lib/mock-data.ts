// ──────────────── Certificates ────────────────
export const mockCertificates = [
    {
        id: "cert-sol-001",
        recipient: {
            name: "Lucas Ferreira",
            username: "lucasdev",
        },
        course: {
            title: "Solana Fundamentals",
        },
        date: "2025-12-15",
        nft: {
            mintAddress: "7xKY...9fGh",
            metadata: "https://arweave.net/...",
            ownershipProof: "https://solscan.io/...",
        },
    },
    {
        id: "cert-rust-001",
        recipient: {
            name: "Lucas Ferreira",
            username: "lucasdev",
        },
        course: {
            title: "Rust for Blockchain Devs",
        },
        date: "2026-01-20",
        nft: {
            mintAddress: "3mNp...2qRs",
            metadata: "https://arweave.net/...",
            ownershipProof: "https://solscan.io/...",
        },
    },
];

// ──────────────── Courses ────────────────
export interface Course {
  slug: string
  title: string
  description: string
  instructor: string
  instructorAvatar: string
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  duration: string
  lessons: number
  modules: Module[]
  rating: number
  enrolled: number
  tags: string[]
  progress: number
  xp: number
  thumbnail: string
}

export interface Module {
  title: string
  lessons: Lesson[]
}

export interface Lesson {
  id: string
  title: string
  type: "video" | "reading" | "challenge"
  duration: string
  completed: boolean
}

export const courses: Course[] = [
  {
    slug: "solana-fundamentals",
    title: "Solana Fundamentals",
    description: "Master the basics of Solana blockchain development. Learn about accounts, transactions, programs, and the Solana runtime from scratch.",
    instructor: "Ana Silva",
    instructorAvatar: "AS",
    difficulty: "Beginner",
    duration: "12h 30m",
    lessons: 42,
    rating: 4.9,
    enrolled: 3420,
    tags: ["Solana", "Blockchain", "Rust"],
    progress: 68,
    xp: 2400,
    thumbnail: "/solana.jpg",
    modules: [
      {
        title: "Introduction to Solana",
        lessons: [
          { id: "1-1", title: "What is Solana?", type: "reading", duration: "8m", completed: true },
          { id: "1-2", title: "Architecture Overview", type: "video", duration: "15m", completed: true },
          { id: "1-3", title: "Setting Up Your Environment", type: "challenge", duration: "20m", completed: true },
        ],
      },
      {
        title: "Accounts & Data",
        lessons: [
          { id: "2-1", title: "Account Model Deep Dive", type: "reading", duration: "12m", completed: true },
          { id: "2-2", title: "Creating Accounts", type: "challenge", duration: "25m", completed: true },
          { id: "2-3", title: "Program Derived Addresses", type: "video", duration: "18m", completed: false },
        ],
      },
      {
        title: "Transactions & Instructions",
        lessons: [
          { id: "3-1", title: "Transaction Anatomy", type: "reading", duration: "10m", completed: false },
          { id: "3-2", title: "Building Transactions", type: "challenge", duration: "30m", completed: false },
          { id: "3-3", title: "Error Handling", type: "video", duration: "14m", completed: false },
        ],
      },
      {
        title: "Building Your First Program",
        lessons: [
          { id: "4-1", title: "Hello World Program", type: "challenge", duration: "35m", completed: false },
          { id: "4-2", title: "Testing Programs", type: "reading", duration: "15m", completed: false },
          { id: "4-3", title: "Deploying to Devnet", type: "challenge", duration: "20m", completed: false },
        ],
      },
    ],
  },
  {
    slug: "anchor-framework",
    title: "Anchor Framework Mastery",
    description: "Build production-ready Solana programs with Anchor. Cover PDAs, CPIs, token management, and security patterns.",
    instructor: "Carlos Mendes",
    instructorAvatar: "CM",
    difficulty: "Intermediate",
    duration: "18h 45m",
    lessons: 56,
    rating: 4.8,
    enrolled: 2150,
    tags: ["Anchor", "Solana", "Rust"],
    progress: 32,
    xp: 3600,
    thumbnail: "/anchor.jpg",
    modules: [
      {
        title: "Getting Started with Anchor",
        lessons: [
          { id: "a-1-1", title: "Why Anchor?", type: "reading", duration: "10m", completed: true },
          { id: "a-1-2", title: "Project Setup", type: "challenge", duration: "20m", completed: true },
          { id: "a-1-3", title: "Anchor Account Types", type: "video", duration: "22m", completed: true },
        ],
      },
      {
        title: "Advanced Account Management",
        lessons: [
          { id: "a-2-1", title: "PDAs in Anchor", type: "reading", duration: "15m", completed: false },
          { id: "a-2-2", title: "Account Constraints", type: "challenge", duration: "30m", completed: false },
          { id: "a-2-3", title: "Cross-Program Invocations", type: "video", duration: "25m", completed: false },
        ],
      },
    ],
  },
  {
    slug: "defi-development",
    title: "DeFi Protocol Development",
    description: "Design and implement decentralized finance protocols. AMMs, lending platforms, yield aggregators, and oracle integration.",
    instructor: "Lucia Oliveira",
    instructorAvatar: "LO",
    difficulty: "Advanced",
    duration: "24h 10m",
    lessons: 64,
    rating: 4.7,
    enrolled: 980,
    tags: ["DeFi", "Solana", "Smart Contracts"],
    progress: 0,
    xp: 5200,
    thumbnail: "/defi.jpg",
    modules: [
      {
        title: "DeFi Fundamentals",
        lessons: [
          { id: "d-1-1", title: "What is DeFi?", type: "reading", duration: "12m", completed: false },
          { id: "d-1-2", title: "AMM Mathematics", type: "video", duration: "30m", completed: false },
          { id: "d-1-3", title: "Liquidity Pools", type: "challenge", duration: "40m", completed: false },
        ],
      },
    ],
  },
  {
    slug: "nft-marketplace",
    title: "NFT Marketplace Builder",
    description: "Build a full-featured NFT marketplace on Solana. Minting, listing, bidding, and collection management with Metaplex.",
    instructor: "Rafael Costa",
    instructorAvatar: "RC",
    difficulty: "Intermediate",
    duration: "16h 20m",
    lessons: 48,
    rating: 4.6,
    enrolled: 1850,
    tags: ["NFT", "Metaplex", "Solana"],
    progress: 15,
    xp: 3200,
    thumbnail: "/nft.jpg",
    modules: [
      {
        title: "NFT Standards on Solana",
        lessons: [
          { id: "n-1-1", title: "Token Metadata Program", type: "reading", duration: "15m", completed: true },
          { id: "n-1-2", title: "Minting NFTs", type: "challenge", duration: "25m", completed: false },
        ],
      },
    ],
  },
  {
    slug: "web3-security",
    title: "Web3 Security Auditing",
    description: "Learn to identify and prevent vulnerabilities in smart contracts. Reentrancy, overflow, access control, and formal verification.",
    instructor: "Mariana Santos",
    instructorAvatar: "MS",
    difficulty: "Advanced",
    duration: "20h 15m",
    lessons: 52,
    rating: 4.9,
    enrolled: 720,
    tags: ["Security", "Auditing", "Smart Contracts"],
    progress: 0,
    xp: 4800,
    thumbnail: "/security.jpg",
    modules: [
      {
        title: "Common Vulnerabilities",
        lessons: [
          { id: "s-1-1", title: "Reentrancy Attacks", type: "reading", duration: "20m", completed: false },
          { id: "s-1-2", title: "Integer Overflow", type: "challenge", duration: "30m", completed: false },
        ],
      },
    ],
  },
  {
    slug: "rust-for-blockchain",
    title: "Rust for Blockchain Devs",
    description: "Learn Rust programming language specifically tailored for blockchain development. Ownership, lifetimes, and async patterns.",
    instructor: "Pedro Almeida",
    instructorAvatar: "PA",
    difficulty: "Beginner",
    duration: "15h 40m",
    lessons: 50,
    rating: 4.8,
    enrolled: 4100,
    tags: ["Rust", "Programming", "Blockchain"],
    progress: 45,
    xp: 2800,
    thumbnail: "/rust.jpg",
    modules: [
      {
        title: "Rust Basics",
        lessons: [
          { id: "r-1-1", title: "Variables and Types", type: "reading", duration: "10m", completed: true },
          { id: "r-1-2", title: "Ownership & Borrowing", type: "video", duration: "25m", completed: true },
          { id: "r-1-3", title: "Structs & Enums", type: "challenge", duration: "20m", completed: false },
        ],
      },
    ],
  },
]

// ──────────────── User ────────────────
export const currentUser = {
  name: "Lucas Ferreira",
  username: "lucasdev",
  email: "lucas@example.com",
  avatar: "LF",
  bio: "Full-stack developer diving deep into Solana. Building the future of decentralized finance.",
  joinDate: "Sep 2025",
  level: 12,
  xp: 8450,
  xpToNext: 10000,
  streak: 14,
  rank: 42,
  totalCompleted: 6,
  socialLinks: {
    github: "lucasdev",
        twitter: "lucasdev_sol",
        website: "lucasdev.io",
        linkedin: "lucas-ferreira-dev",
  },
  skills: [
    { name: "Rust", value: 72 },
    { name: "Anchor", value: 55 },
    { name: "Frontend", value: 88 },
    { name: "Security", value: 30 },
    { name: "DeFi", value: 45 },
    { name: "Testing", value: 62 },
  ],
  badges: [
    { name: "First Steps", description: "Complete your first lesson", icon: "footprints", earned: true },
    { name: "Code Warrior", description: "Complete 10 challenges", icon: "swords", earned: true },
    { name: "Streak Master", description: "Maintain 7-day streak", icon: "flame", earned: true },
    { name: "Top 100", description: "Reach top 100 globally", icon: "trophy", earned: true },
    { name: "Bug Hunter", description: "Find 5 vulnerabilities", icon: "bug", earned: false },
    { name: "DeFi Builder", description: "Complete DeFi track", icon: "building", earned: false },
    { name: "Anchor Pro", description: "Master all Anchor modules", icon: "anchor", earned: false },
    { name: "Speed Demon", description: "Complete 5 challenges under time", icon: "zap", earned: false },
  ],
  completedCourses: ["solana-fundamentals", "rust-for-blockchain"],
  certificates: [
    { id: "cert-sol-001", course: "Solana Fundamentals", date: "2025-12-15", mintAddress: "7xKY...9fGh" },
    { id: "cert-rust-001", course: "Rust for Blockchain Devs", date: "2026-01-20", mintAddress: "3mNp...2qRs" },
  ],
}

// ──────────────── Leaderboard ────────────────
export const leaderboardUsers = [
  { rank: 1, name: "Sofia Martinez", username: "sofi_dev", xp: 24500, level: 28, streak: 45, avatar: "SM" },
  { rank: 2, name: "Diego Nakamura", username: "diego_nk", xp: 22100, level: 26, streak: 38, avatar: "DN" },
  { rank: 3, name: "Isabela Chen", username: "isa_codes", xp: 20800, level: 25, streak: 52, avatar: "IC" },
  { rank: 4, name: "Thiago Park", username: "thiago_p", xp: 19200, level: 24, streak: 21, avatar: "TP" },
  { rank: 5, name: "Valentina Rossi", username: "val_sol", xp: 18700, level: 23, streak: 33, avatar: "VR" },
  { rank: 6, name: "Matheus Kim", username: "mat_k", xp: 17300, level: 22, streak: 19, avatar: "MK" },
  { rank: 7, name: "Camila Novak", username: "cami_n", xp: 16100, level: 21, streak: 27, avatar: "CN" },
  { rank: 8, name: "Gabriel Tanaka", username: "gab_t", xp: 15500, level: 20, streak: 16, avatar: "GT" },
  { rank: 9, name: "Laura Andrade", username: "laura_a", xp: 14200, level: 19, streak: 42, avatar: "LA" },
  { rank: 10, name: "Bruno Sato", username: "bruno_s", xp: 13800, level: 18, streak: 11, avatar: "BS" },
  { rank: 11, name: "Fernanda Li", username: "fer_li", xp: 12400, level: 17, streak: 24, avatar: "FL" },
  { rank: 12, name: "Hugo Pereira", username: "hugo_p", xp: 11900, level: 16, streak: 9, avatar: "HP" },
  { rank: 13, name: "Julia Wang", username: "julia_w", xp: 10500, level: 15, streak: 30, avatar: "JW" },
  { rank: 14, name: "Andre Muller", username: "andre_m", xp: 9800, level: 14, streak: 7, avatar: "AM" },
  { rank: 15, name: "Beatriz Yamada", username: "bea_y", xp: 9200, level: 13, streak: 15, avatar: "BY" },
]

// ──────────────── Testimonials ────────────────
export const testimonials = [
  {
    name: "Fernanda Li",
    role: "Solana Developer at Phantom",
    text: "This platform transformed my understanding of Solana development. The interactive challenges are incredible.",
    avatar: "FL",
  },
  {
    name: "Diego Nakamura",
    role: "DeFi Protocol Engineer",
    text: "The gamification keeps me coming back every day. I've learned more in 3 months here than in a year of self-study.",
    avatar: "DN",
  },
  {
    name: "Sofia Martinez",
    role: "Smart Contract Auditor",
    text: "The security course helped me transition into auditing. The hands-on challenges simulate real-world scenarios perfectly.",
    avatar: "SM",
  },
]

// ──────────────── Stats ────────────────
export const platformStats = {
  developers: "12,500+",
  coursesCompleted: "45,000+",
  challengesSolved: "280,000+",
  xpAwarded: "8.2M+",
}

// ──────────────── Learning Paths ────────────────
export const learningPaths = [
  {
    title: "Solana Developer",
    description: "Go from zero to building production dApps on Solana",
    courses: ["rust-for-blockchain", "solana-fundamentals", "anchor-framework"],
    totalDuration: "46h",
    difficulty: "Beginner to Intermediate" as const,
  },
  {
    title: "DeFi Engineer",
    description: "Master decentralized finance protocol development",
    courses: ["solana-fundamentals", "anchor-framework", "defi-development"],
    totalDuration: "55h",
    difficulty: "Intermediate to Advanced" as const,
  },
  {
    title: "Security Specialist",
    description: "Become a blockchain security auditor and bug bounty hunter",
    courses: ["solana-fundamentals", "web3-security"],
    totalDuration: "32h",
    difficulty: "Advanced" as const,
  },
]

// ──────────────── Activity Feed ────────────────
export const recentActivity = [
  { type: "lesson", text: "Completed 'Account Model Deep Dive'", course: "Solana Fundamentals", time: "2h ago", xp: 50 },
  { type: "challenge", text: "Solved 'Creating Accounts' challenge", course: "Solana Fundamentals", time: "3h ago", xp: 120 },
  { type: "streak", text: "14-day streak maintained!", course: "", time: "1d ago", xp: 25 },
  { type: "badge", text: "Earned 'Streak Master' badge", course: "", time: "1d ago", xp: 200 },
  { type: "lesson", text: "Completed 'Anchor Account Types'", course: "Anchor Framework", time: "2d ago", xp: 50 },
  { type: "challenge", text: "Solved 'Project Setup' challenge", course: "Anchor Framework", time: "3d ago", xp: 100 },
]

// ──────────────── Streak Calendar ────────────────
function hashCode(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export function getStreakDays(daysBack = 365) {
  const days = []
  const today = new Date()

  for (let i = daysBack - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateKey = date.toISOString().split("T")[0]

    // Preserve a guaranteed active current streak from latest N days.
    const forcedStreak = i < currentUser.streak
    const entropy = hashCode(dateKey)
    const active = forcedStreak || entropy % 100 < 46

    // Use deterministic intensity distribution (0..4) for stable UI.
    const intensity = active ? (entropy % 4) + 1 : 0

    days.push({
      date: dateKey,
      active,
      intensity,
      month: date.getMonth(),
      weekday: date.getDay(),
      year: date.getFullYear(),
    })
  }

  return days
}
