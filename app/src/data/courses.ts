import { Course } from "@/types";

export const COURSES: Course[] = [
  {
    id: "anchor-fundamentals",
    title: "Anchor Fundamentals",
    description: "Build secure Solana programs with the industry-standard framework. From PDA basics to complex instruction flows.",
    lessons: 12,
    xp: 1200,
    difficulty: "Beginner",
    track: "Development",
    duration: "6 hours",
    badge: "Anchor Beginner",
    prerequisites: [],
    rewards: ["Anchor Beginner Badge", "500 XP Bonus"],
    milestones: [
      { lesson: 4, name: "PDA Master", xp: 100 },
      { lesson: 8, name: "Instruction Expert", xp: 150 },
      { lesson: 12, name: "Anchor Graduate", xp: 250 },
    ],
    modules: [
      {
        title: "Getting Started",
        lessons: [
          { id: "1", title: "Introduction to Anchor", duration: "15 min", type: "video" },
          { id: "2", title: "Setting Up Your Environment", duration: "20 min", type: "video" },
          { id: "3", title: "Your First Program", duration: "30 min", type: "challenge" },
        ],
      },
      {
        title: "PDAs and Accounts",
        lessons: [
          { id: "4", title: "Understanding PDAs", duration: "25 min", type: "video" },
          { id: "5", title: "Account Validation", duration: "30 min", type: "video" },
          { id: "6", title: "PDA Challenge", duration: "45 min", type: "challenge" },
        ],
      },
      {
        title: "Instructions and CPI",
        lessons: [
          { id: "7", title: "Writing Instructions", duration: "30 min", type: "video" },
          { id: "8", title: "Cross-Program Invocations", duration: "35 min", type: "video" },
          { id: "9", title: "CPI Practice", duration: "45 min", type: "challenge" },
        ],
      },
      {
        title: "Advanced Topics",
        lessons: [
          { id: "10", title: "Events and Logging", duration: "20 min", type: "video" },
          { id: "11", title: "Error Handling", duration: "25 min", type: "video" },
          { id: "12", title: "Final Project", duration: "60 min", type: "challenge" },
        ],
      },
    ],
  },
  {
    id: "token-2022-mastery",
    title: "Token-2022 Mastery",
    description: "Master SPL Token-2022 extensions. Non-transferable tokens, metadata pointers, and permanent delegates.",
    lessons: 8,
    xp: 1500,
    difficulty: "Intermediate",
    track: "Advanced",
    duration: "4 hours",
    badge: "Token Architect",
    prerequisites: ["anchor-fundamentals"],
    rewards: ["Token Architect Badge", "750 XP Bonus"],
    milestones: [
      { lesson: 3, name: "Extension Explorer", xp: 150 },
      { lesson: 6, name: "Metadata Guru", xp: 200 },
      { lesson: 8, name: "Token Master", xp: 350 },
    ],
    modules: [
      {
        title: "Token-2022 Basics",
        lessons: [
          { id: "1", title: "Introduction to Token-2022", duration: "20 min", type: "video" },
          { id: "2", title: "Creating a Token Mint", duration: "25 min", type: "video" },
        ],
      },
      {
        title: "Extensions",
        lessons: [
          { id: "3", title: "NonTransferable Extension", duration: "30 min", type: "video" },
          { id: "4", title: "Metadata Pointer", duration: "25 min", type: "video" },
          { id: "5", title: "Permanent Delegate", duration: "20 min", type: "video" },
        ],
      },
      {
        title: "Advanced Extensions",
        lessons: [
          { id: "6", title: "Transfer Hooks", duration: "35 min", type: "video" },
          { id: "7", title: "Confidential Transfers", duration: "40 min", type: "video" },
          { id: "8", title: "Token-2022 Challenge", duration: "45 min", type: "challenge" },
        ],
      },
    ],
  },
  {
    id: "zk-compression",
    title: "ZK Compression",
    description: "Scale with Light Protocol. Compressed accounts, state proofs, and cost-optimized architectures.",
    lessons: 10,
    xp: 2000,
    difficulty: "Advanced",
    track: "Infrastructure",
    duration: "8 hours",
    badge: "Compression Expert",
    prerequisites: ["anchor-fundamentals", "token-2022-mastery"],
    rewards: ["Compression Expert Badge", "1000 XP Bonus"],
    milestones: [
      { lesson: 4, name: "State Prover", xp: 200 },
      { lesson: 7, name: "Light Protocol Pro", xp: 300 },
      { lesson: 10, name: "ZK Wizard", xp: 500 },
    ],
    modules: [
      {
        title: "Introduction to ZK",
        lessons: [
          { id: "1", title: "What is ZK Compression", duration: "25 min", type: "video" },
          { id: "2", title: "Setting Up Light Protocol", duration: "30 min", type: "video" },
          { id: "3", title: "Your First Compressed Account", duration: "45 min", type: "challenge" },
        ],
      },
      {
        title: "State Management",
        lessons: [
          { id: "4", title: "Understanding State Trees", duration: "35 min", type: "video" },
          { id: "5", title: "Creating Proofs", duration: "40 min", type: "video" },
          { id: "6", title: "Proof Challenge", duration: "50 min", type: "challenge" },
        ],
      },
      {
        title: "Advanced Topics",
        lessons: [
          { id: "7", title: "Batch Operations", duration: "35 min", type: "video" },
          { id: "8", title: "Cost Optimization", duration: "30 min", type: "video" },
          { id: "9", title: "Security Considerations", duration: "25 min", type: "video" },
          { id: "10", title: "Final Project", duration: "90 min", type: "challenge" },
        ],
      },
    ],
  },
  {
    id: "security-auditing",
    title: "Security Auditing",
    description: "Identify and prevent vulnerabilities. Write bulletproof programs that pass professional audits.",
    lessons: 15,
    xp: 2500,
    difficulty: "Advanced",
    track: "Security",
    duration: "10 hours",
    badge: "Security Guardian",
    prerequisites: ["anchor-fundamentals"],
    rewards: ["Security Guardian Badge", "1250 XP Bonus"],
    milestones: [
      { lesson: 5, name: "Vulnerability Hunter", xp: 250 },
      { lesson: 10, name: "Audit Ready", xp: 400 },
      { lesson: 15, name: "Security Champion", xp: 600 },
    ],
    modules: [
      {
        title: "Common Vulnerabilities",
        lessons: [
          { id: "1", title: "Introduction to Solana Security", duration: "20 min", type: "video" },
          { id: "2", title: "Account Validation Issues", duration: "35 min", type: "video" },
          { id: "3", title: "Arithmetic Vulnerabilities", duration: "30 min", type: "video" },
          { id: "4", title: "Reentrancy Attacks", duration: "40 min", type: "video" },
          { id: "5", title: "Vulnerability Lab", duration: "45 min", type: "challenge" },
        ],
      },
      {
        title: "Advanced Exploits",
        lessons: [
          { id: "6", title: "PDA Hijacking", duration: "35 min", type: "video" },
          { id: "7", title: "Signer Authorization", duration: "30 min", type: "video" },
          { id: "8", title: "CPI Attacks", duration: "40 min", type: "video" },
          { id: "9", title: "Bump Seed Manipulation", duration: "25 min", type: "video" },
          { id: "10", title: "Exploit Lab", duration: "60 min", type: "challenge" },
        ],
      },
      {
        title: "Audit Methodology",
        lessons: [
          { id: "11", title: "Reading Audit Reports", duration: "25 min", type: "video" },
          { id: "12", title: "Static Analysis Tools", duration: "30 min", type: "video" },
          { id: "13", title: "Manual Review Techniques", duration: "35 min", type: "video" },
          { id: "14", title: "Writing Findings", duration: "25 min", type: "video" },
          { id: "15", title: "Full Audit Challenge", duration: "90 min", type: "challenge" },
        ],
      },
    ],
  },
  {
    id: "defi-primitives",
    title: "DeFi Primitives",
    description: "Build decentralized finance protocols. AMMs, lending, vaults, and yield strategies.",
    lessons: 14,
    xp: 2200,
    difficulty: "Intermediate",
    track: "DeFi",
    duration: "9 hours",
    badge: "DeFi Architect",
    prerequisites: ["anchor-fundamentals", "token-2022-mastery"],
    rewards: ["DeFi Architect Badge", "1100 XP Bonus"],
    milestones: [
      { lesson: 5, name: "AMM Builder", xp: 200 },
      { lesson: 9, name: "Lending Expert", xp: 350 },
      { lesson: 14, name: "DeFi Master", xp: 550 },
    ],
    modules: [
      {
        title: "AMM Fundamentals",
        lessons: [
          { id: "1", title: "Introduction to DeFi", duration: "20 min", type: "video" },
          { id: "2", title: "Constant Product AMM", duration: "35 min", type: "video" },
          { id: "3", title: "Liquidity Pools", duration: "30 min", type: "video" },
          { id: "4", title: "Swap Implementation", duration: "45 min", type: "video" },
          { id: "5", title: "Build Your First AMM", duration: "60 min", type: "challenge" },
        ],
      },
      {
        title: "Lending Protocols",
        lessons: [
          { id: "6", title: "Collateralization Models", duration: "30 min", type: "video" },
          { id: "7", title: "Interest Rate Mechanisms", duration: "35 min", type: "video" },
          { id: "8", title: "Liquidation Systems", duration: "40 min", type: "video" },
          { id: "9", title: "Lending Protocol Challenge", duration: "75 min", type: "challenge" },
        ],
      },
      {
        title: "Advanced DeFi",
        lessons: [
          { id: "10", title: "Yield Aggregators", duration: "30 min", type: "video" },
          { id: "11", title: "Flash Loans", duration: "35 min", type: "video" },
          { id: "12", title: "Oracle Integration", duration: "40 min", type: "video" },
          { id: "13", title: "MEV Protection", duration: "25 min", type: "video" },
          { id: "14", title: "Full DeFi Protocol", duration: "90 min", type: "challenge" },
        ],
      },
    ],
  },
  {
    id: "nft-infrastructure",
    title: "NFT Infrastructure",
    description: "Create NFT marketplaces, launchpads, and collection tools. Metadata, royalties, and cNFTs.",
    lessons: 11,
    xp: 1800,
    difficulty: "Intermediate",
    track: "NFTs",
    duration: "7 hours",
    badge: "NFT Builder",
    prerequisites: ["anchor-fundamentals"],
    rewards: ["NFT Builder Badge", "900 XP Bonus"],
    milestones: [
      { lesson: 4, name: "Metadata Designer", xp: 150 },
      { lesson: 7, name: "Marketplace Dev", xp: 250 },
      { lesson: 11, name: "NFT Expert", xp: 400 },
    ],
    modules: [
      {
        title: "NFT Basics",
        lessons: [
          { id: "1", title: "Understanding NFTs on Solana", duration: "20 min", type: "video" },
          { id: "2", title: "Metaplex Standards", duration: "30 min", type: "video" },
          { id: "3", title: "Metadata and JSON", duration: "25 min", type: "video" },
          { id: "4", title: "Create Your First NFT", duration: "45 min", type: "challenge" },
        ],
      },
      {
        title: "Marketplace Development",
        lessons: [
          { id: "5", title: "Listing and Delisting", duration: "30 min", type: "video" },
          { id: "6", title: "Auction Mechanisms", duration: "35 min", type: "video" },
          { id: "7", title: "Build a Marketplace", duration: "60 min", type: "challenge" },
        ],
      },
      {
        title: "Advanced NFTs",
        lessons: [
          { id: "8", title: "Compressed NFTs", duration: "35 min", type: "video" },
          { id: "9", title: "Royalty Enforcement", duration: "30 min", type: "video" },
          { id: "10", title: "Soulbound Tokens", duration: "25 min", type: "video" },
          { id: "11", title: "NFT Launchpad Challenge", duration: "75 min", type: "challenge" },
        ],
      },
    ],
  },
];

// Helper function to get course by ID
export function getCourseById(id: string): Course | undefined {
  return COURSES.find((course) => course.id === id);
}

// Helper function to get course by slug
export function getCourseBySlug(slug: string): Course | undefined {
  return COURSES.find((course) => course.id === slug);
}

// Helper function to get lesson by course ID and lesson ID
export function getLesson(courseId: string, lessonId: string) {
  const course = getCourseById(courseId);
  if (!course) return null;

  for (const mod of course.modules) {
    const lesson = mod.lessons.find((l) => l.id === lessonId);
    if (lesson) return lesson;
  }
  return null;
}

// Helper function to get all lessons for a course
export function getAllLessons(courseId: string) {
  const course = getCourseById(courseId);
  if (!course) return [];

  return course.modules.flatMap((module) => module.lessons);
}
