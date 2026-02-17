export interface Course {
  slug: string;
  title: string;
  description: string;
  instructor: string;
  instructorAvatar: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  lessons: number;
  modules: Module[];
  rating: number;
  enrolled: number;
  tags: string[];
  progress: number;
  xp: number;
  thumbnail: string;
}

export interface Module {
  title: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  type: "video" | "reading" | "challenge";
  duration: string;
  completed: boolean;
}

export const courses: Course[] = [
  {
    slug: "solana-fundamentals",
    title: "Solana Fundamentals",
    description:
      "Master the basics of Solana blockchain development. Learn about accounts, transactions, programs, and the Solana runtime from scratch.",
    instructor: "Ana Silva",
    instructorAvatar: "AS",
    difficulty: "Beginner",
    duration: "12h 30m",
    lessons: 42,
    rating: 4.9,
    enrolled: 0,
    tags: ["Solana", "Blockchain", "Rust"],
    progress: 0,
    xp: 2400,
    thumbnail: "/solana.jpg",
    modules: [
      {
        title: "Introduction to Solana",
        lessons: [
          {
            id: "1-1",
            title: "What is Solana?",
            type: "reading",
            duration: "8m",
            completed: false,
          },
          {
            id: "1-2",
            title: "Architecture Overview",
            type: "video",
            duration: "15m",
            completed: false,
          },
          {
            id: "1-3",
            title: "Setting Up Your Environment",
            type: "challenge",
            duration: "20m",
            completed: false,
          },
        ],
      },
      {
        title: "Accounts & Data",
        lessons: [
          {
            id: "2-1",
            title: "Account Model Deep Dive",
            type: "reading",
            duration: "12m",
            completed: false,
          },
          {
            id: "2-2",
            title: "Creating Accounts",
            type: "challenge",
            duration: "25m",
            completed: false,
          },
          {
            id: "2-3",
            title: "Program Derived Addresses",
            type: "video",
            duration: "18m",
            completed: false,
          },
        ],
      },
      {
        title: "Transactions & Instructions",
        lessons: [
          {
            id: "3-1",
            title: "Transaction Anatomy",
            type: "reading",
            duration: "10m",
            completed: false,
          },
          {
            id: "3-2",
            title: "Building Transactions",
            type: "challenge",
            duration: "30m",
            completed: false,
          },
          {
            id: "3-3",
            title: "Error Handling",
            type: "video",
            duration: "14m",
            completed: false,
          },
        ],
      },
      {
        title: "Building Your First Program",
        lessons: [
          {
            id: "4-1",
            title: "Hello World Program",
            type: "challenge",
            duration: "35m",
            completed: false,
          },
          {
            id: "4-2",
            title: "Testing Programs",
            type: "reading",
            duration: "15m",
            completed: false,
          },
          {
            id: "4-3",
            title: "Deploying to Devnet",
            type: "challenge",
            duration: "20m",
            completed: false,
          },
        ],
      },
    ],
  },
  {
    slug: "anchor-framework",
    title: "Anchor Framework Mastery",
    description:
      "Build production-ready Solana programs with Anchor. Cover PDAs, CPIs, token management, and security patterns.",
    instructor: "Carlos Mendes",
    instructorAvatar: "CM",
    difficulty: "Intermediate",
    duration: "18h 45m",
    lessons: 56,
    rating: 4.8,
    enrolled: 0,
    tags: ["Anchor", "Solana", "Rust"],
    progress: 0,
    xp: 3600,
    thumbnail: "/anchor.jpg",
    modules: [
      {
        title: "Getting Started with Anchor",
        lessons: [
          {
            id: "a-1-1",
            title: "Why Anchor?",
            type: "reading",
            duration: "10m",
            completed: false,
          },
          {
            id: "a-1-2",
            title: "Project Setup",
            type: "challenge",
            duration: "20m",
            completed: false,
          },
          {
            id: "a-1-3",
            title: "Anchor Account Types",
            type: "video",
            duration: "22m",
            completed: false,
          },
        ],
      },
      {
        title: "Advanced Account Management",
        lessons: [
          {
            id: "a-2-1",
            title: "PDAs in Anchor",
            type: "reading",
            duration: "15m",
            completed: false,
          },
          {
            id: "a-2-2",
            title: "Account Constraints",
            type: "challenge",
            duration: "30m",
            completed: false,
          },
          {
            id: "a-2-3",
            title: "Cross-Program Invocations",
            type: "video",
            duration: "25m",
            completed: false,
          },
        ],
      },
    ],
  },
  {
    slug: "defi-development",
    title: "DeFi Protocol Development",
    description:
      "Design and implement decentralized finance protocols. AMMs, lending platforms, yield aggregators, and oracle integration.",
    instructor: "Lucia Oliveira",
    instructorAvatar: "LO",
    difficulty: "Advanced",
    duration: "24h 10m",
    lessons: 64,
    rating: 4.7,
    enrolled: 0,
    tags: ["DeFi", "Solana", "Smart Contracts"],
    progress: 0,
    xp: 5200,
    thumbnail: "/defi.jpg",
    modules: [
      {
        title: "DeFi Fundamentals",
        lessons: [
          {
            id: "d-1-1",
            title: "What is DeFi?",
            type: "reading",
            duration: "12m",
            completed: false,
          },
          {
            id: "d-1-2",
            title: "AMM Mathematics",
            type: "video",
            duration: "30m",
            completed: false,
          },
          {
            id: "d-1-3",
            title: "Liquidity Pools",
            type: "challenge",
            duration: "40m",
            completed: false,
          },
        ],
      },
    ],
  },
  {
    slug: "nft-marketplace",
    title: "NFT Marketplace Builder",
    description:
      "Build a full-featured NFT marketplace on Solana. Minting, listing, bidding, and collection management with Metaplex.",
    instructor: "Rafael Costa",
    instructorAvatar: "RC",
    difficulty: "Intermediate",
    duration: "16h 20m",
    lessons: 48,
    rating: 4.6,
    enrolled: 0,
    tags: ["NFT", "Metaplex", "Solana"],
    progress: 0,
    xp: 3200,
    thumbnail: "/nft.jpg",
    modules: [
      {
        title: "NFT Standards on Solana",
        lessons: [
          {
            id: "n-1-1",
            title: "Token Metadata Program",
            type: "reading",
            duration: "15m",
            completed: false,
          },
          {
            id: "n-1-2",
            title: "Minting NFTs",
            type: "challenge",
            duration: "25m",
            completed: false,
          },
        ],
      },
    ],
  },
  {
    slug: "web3-security",
    title: "Web3 Security Auditing",
    description:
      "Learn to identify and prevent vulnerabilities in smart contracts. Reentrancy, overflow, access control, and formal verification.",
    instructor: "Mariana Santos",
    instructorAvatar: "MS",
    difficulty: "Advanced",
    duration: "20h 15m",
    lessons: 52,
    rating: 4.9,
    enrolled: 0,
    tags: ["Security", "Auditing", "Smart Contracts"],
    progress: 0,
    xp: 4800,
    thumbnail: "/security.jpg",
    modules: [
      {
        title: "Common Vulnerabilities",
        lessons: [
          {
            id: "s-1-1",
            title: "Reentrancy Attacks",
            type: "reading",
            duration: "20m",
            completed: false,
          },
          {
            id: "s-1-2",
            title: "Integer Overflow",
            type: "challenge",
            duration: "30m",
            completed: false,
          },
        ],
      },
    ],
  },
  {
    slug: "rust-for-blockchain",
    title: "Rust for Blockchain Devs",
    description:
      "Learn Rust programming language specifically tailored for blockchain development. Ownership, lifetimes, and async patterns.",
    instructor: "Pedro Almeida",
    instructorAvatar: "PA",
    difficulty: "Beginner",
    duration: "15h 40m",
    lessons: 50,
    rating: 4.8,
    enrolled: 0,
    tags: ["Rust", "Programming", "Blockchain"],
    progress: 0,
    xp: 2800,
    thumbnail: "/rust.jpg",
    modules: [
      {
        title: "Rust Basics",
        lessons: [
          {
            id: "r-1-1",
            title: "Variables and Types",
            type: "reading",
            duration: "10m",
            completed: false,
          },
          {
            id: "r-1-2",
            title: "Ownership & Borrowing",
            type: "video",
            duration: "25m",
            completed: false,
          },
          {
            id: "r-1-3",
            title: "Structs & Enums",
            type: "challenge",
            duration: "20m",
            completed: false,
          },
        ],
      },
    ],
  },
];
