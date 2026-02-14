import { client } from '@/lib/sanity/client';
import { coursesQuery, courseBySlugQuery, lessonByIdQuery } from '@/lib/sanity/queries';
import type { Course, Lesson } from '@/lib/sanity/types';

// Check if Sanity is configured
const isSanityConfigured = () => {
  return process.env.NEXT_PUBLIC_SANITY_PROJECT_ID &&
         process.env.NEXT_PUBLIC_SANITY_PROJECT_ID !== 'demo';
};

// Mock course data - fallback when Sanity is not configured
export const mockCourses = [
  {
    _id: "solana-101",
    slug: { current: "solana-101" },
    title: "Solana 101: Getting Started",
    description: "Your first steps into Solana development. Learn the basics of accounts, transactions, and the Solana runtime.",
    level: "beginner" as const,
    duration: "4 hours",
    lessonsCount: 12,
    studentsCount: 1250,
    rating: 4.8,
    xpReward: 500,
    tags: ["fundamentals", "wallets", "transactions"],
    instructor: "Superteam Brazil",
    featured: true,
    prerequisites: ["Basic programming knowledge", "Familiarity with blockchain concepts"],
    whatYouWillLearn: [
      "Understand Solana's account model",
      "Create and manage wallets",
      "Build and send transactions",
      "Interact with Solana programs"
    ],
    lessons: [
      { _id: "lesson-1", slug: { current: "intro-to-solana" }, title: "Introduction to Solana", order: 1 },
      { _id: "lesson-2", slug: { current: "accounts-model" }, title: "Understanding Accounts", order: 2 },
      { _id: "lesson-3", slug: { current: "transactions" }, title: "Transactions Deep Dive", order: 3 },
      { _id: "lesson-4", slug: { current: "wallets" }, title: "Working with Wallets", order: 4 },
    ]
  },
  {
    _id: "anchor-basics",
    slug: { current: "anchor-basics" },
    title: "Anchor Framework Fundamentals",
    description: "Master the Anchor framework for building Solana programs. PDAs, instructions, and account validation.",
    level: "intermediate" as const,
    duration: "8 hours",
    lessonsCount: 20,
    studentsCount: 890,
    rating: 4.9,
    xpReward: 1200,
    tags: ["anchor", "rust", "programs"],
    instructor: "Superteam Brazil",
    featured: true,
    prerequisites: ["Solana 101", "Basic Rust knowledge"],
    whatYouWillLearn: [
      "Set up Anchor development environment",
      "Write and deploy Solana programs",
      "Use PDAs for state management",
      "Implement secure account validation"
    ],
    lessons: [
      { _id: "anchor-1", slug: { current: "anchor-setup" }, title: "Setting Up Anchor", order: 1 },
      { _id: "anchor-2", slug: { current: "first-program" }, title: "Your First Program", order: 2 },
      { _id: "anchor-3", slug: { current: "pdas" }, title: "Program Derived Addresses", order: 3 },
    ]
  },
  {
    _id: "token-2022",
    slug: { current: "token-2022" },
    title: "Token-2022 Extensions Deep Dive",
    description: "Explore advanced token features: transfer fees, interest-bearing tokens, permanent delegates, and more.",
    level: "advanced" as const,
    duration: "6 hours",
    lessonsCount: 15,
    studentsCount: 420,
    rating: 4.7,
    xpReward: 1500,
    tags: ["tokens", "SPL", "extensions"],
    instructor: "Superteam Brazil",
    featured: false,
    prerequisites: ["Anchor Framework Fundamentals", "Understanding of SPL tokens"],
    whatYouWillLearn: [
      "Create tokens with transfer fees",
      "Build interest-bearing tokens",
      "Implement confidential transfers",
      "Use permanent delegates"
    ],
    lessons: [
      { _id: "token22-1", slug: { current: "token22-intro" }, title: "Token-2022 Overview", order: 1 },
      { _id: "token22-2", slug: { current: "transfer-fees" }, title: "Transfer Fee Extension", order: 2 },
    ]
  },
  {
    _id: "wallet-integration",
    slug: { current: "wallet-integration" },
    title: "Wallet Integration with React",
    description: "Build seamless wallet connections in your dApps. Support Phantom, Solflare, Backpack, and more.",
    level: "beginner" as const,
    duration: "3 hours",
    lessonsCount: 8,
    studentsCount: 1100,
    rating: 4.6,
    xpReward: 400,
    tags: ["react", "wallets", "frontend"],
    instructor: "Superteam Brazil",
    featured: false,
    prerequisites: ["React basics", "TypeScript fundamentals"],
    whatYouWillLearn: [
      "Set up Solana wallet adapter",
      "Handle wallet connection states",
      "Sign messages and transactions",
      "Support multiple wallet providers"
    ],
    lessons: [
      { _id: "wallet-1", slug: { current: "wallet-adapter" }, title: "Wallet Adapter Setup", order: 1 },
      { _id: "wallet-2", slug: { current: "connection-ui" }, title: "Connection UI", order: 2 },
    ]
  },
  {
    _id: "defi-fundamentals",
    slug: { current: "defi-fundamentals" },
    title: "DeFi on Solana: AMMs & Liquidity",
    description: "Understand decentralized finance primitives. Build your own AMM and liquidity pool from scratch.",
    level: "advanced" as const,
    duration: "10 hours",
    lessonsCount: 25,
    studentsCount: 380,
    rating: 4.9,
    xpReward: 2000,
    tags: ["defi", "amm", "liquidity"],
    instructor: "Superteam Brazil",
    featured: true,
    prerequisites: ["Anchor Framework Fundamentals", "Token-2022 Extensions"],
    whatYouWillLearn: [
      "Build constant product AMMs",
      "Implement liquidity pools",
      "Handle slippage and fees",
      "Create flash loan functionality"
    ],
    lessons: [
      { _id: "defi-1", slug: { current: "defi-intro" }, title: "DeFi Primitives", order: 1 },
      { _id: "defi-2", slug: { current: "amm-math" }, title: "AMM Mathematics", order: 2 },
    ]
  },
  {
    _id: "compressed-nfts",
    slug: { current: "compressed-nfts" },
    title: "Compressed NFTs & State Compression",
    description: "Scale your NFT collections with Bubblegum. Learn state compression and merkle trees.",
    level: "intermediate" as const,
    duration: "5 hours",
    lessonsCount: 12,
    studentsCount: 560,
    rating: 4.8,
    xpReward: 1000,
    tags: ["nfts", "compression", "metaplex"],
    instructor: "Superteam Brazil",
    featured: false,
    prerequisites: ["Solana 101", "Basic Metaplex knowledge"],
    whatYouWillLearn: [
      "Understand state compression",
      "Use Bubblegum for minting",
      "Query compressed NFTs",
      "Build scalable collections"
    ],
    lessons: [
      { _id: "cnft-1", slug: { current: "compression-intro" }, title: "State Compression Basics", order: 1 },
      { _id: "cnft-2", slug: { current: "bubblegum" }, title: "Minting with Bubblegum", order: 2 },
    ]
  }
];

// Mock lesson data
export const mockLessons: Record<string, Lesson> = {
  "lesson-1": {
    _id: "lesson-1",
    slug: { current: "intro-to-solana" },
    title: "Introduction to Solana",
    description: "Learn about Solana's architecture and what makes it unique.",
    content: null,
    codeTemplate: `// Welcome to Solana!
// Let's explore the basics of Solana development.

// First, we'll learn about accounts, transactions, and programs.
// Solana uses an account model where all state is stored in accounts.

console.log("Hello, Solana!");
`,
    solution: `// Welcome to Solana!
// Let's explore the basics of Solana development.

// First, we'll learn about accounts, transactions, and programs.
// Solana uses an account model where all state is stored in accounts.

console.log("Hello, Solana!");
console.log("Accounts store state, programs are stateless!");
`,
    testCases: [
      {
        input: "",
        expectedOutput: "Hello, Solana!",
        description: "Should print greeting"
      }
    ],
    xpReward: 50,
    duration: "15 minutes",
    hints: [
      "Use console.log to print messages",
      "Remember: Solana programs are stateless"
    ],
    course: {
      _id: "solana-101",
      slug: { current: "solana-101" },
      title: "Solana 101: Getting Started",
      lessons: mockCourses[0].lessons!
    }
  }
};

// Fetch all courses
export async function getCourses(): Promise<Course[]> {
  if (!isSanityConfigured()) {
    return mockCourses;
  }

  try {
    const courses = await client.fetch<Course[]>(coursesQuery);
    return courses.length > 0 ? courses : mockCourses;
  } catch (error) {
    console.error('Error fetching courses from Sanity:', error);
    return mockCourses;
  }
}

// Fetch single course by slug
export async function getCourseBySlug(slug: string): Promise<Course | null> {
  if (!isSanityConfigured()) {
    return mockCourses.find(c => c.slug.current === slug) || null;
  }

  try {
    const course = await client.fetch<Course>(courseBySlugQuery, { slug });
    return course || mockCourses.find(c => c.slug.current === slug) || null;
  } catch (error) {
    console.error('Error fetching course from Sanity:', error);
    return mockCourses.find(c => c.slug.current === slug) || null;
  }
}

// Fetch single lesson by ID
export async function getLessonById(lessonId: string): Promise<Lesson | null> {
  if (!isSanityConfigured()) {
    return mockLessons[lessonId] || null;
  }

  try {
    const lesson = await client.fetch<Lesson>(lessonByIdQuery, { lessonId });
    return lesson || mockLessons[lessonId] || null;
  } catch (error) {
    console.error('Error fetching lesson from Sanity:', error);
    return mockLessons[lessonId] || null;
  }
}

// Get course slugs for static generation
export async function getAllCourseSlugs(): Promise<string[]> {
  const courses = await getCourses();
  return courses.map(c => typeof c.slug === 'string' ? c.slug : c.slug.current);
}
