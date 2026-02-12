export type CourseDifficulty = "beginner" | "intermediate" | "advanced";

export type Course = {
  slug: string;
  title: string;
  description: string;
  topic: string;
  difficulty: CourseDifficulty;
  durationHours: number;
  totalLessons: number;
  xpReward: number;
  modules: { title: string; lessons: number }[];
};

export const mockCourses: Course[] = [
  {
    slug: "solana-foundations",
    title: "Solana Foundations",
    description: "Core blockchain concepts, wallets, accounts, and transactions.",
    topic: "Core",
    difficulty: "beginner",
    durationHours: 8,
    totalLessons: 12,
    xpReward: 300,
    modules: [
      { title: "Solana Basics", lessons: 4 },
      { title: "Transactions", lessons: 4 },
      { title: "RPC and Tooling", lessons: 4 }
    ]
  },
  {
    slug: "anchor-programs",
    title: "Anchor Programs",
    description: "Build and test secure Solana programs using Anchor.",
    topic: "Programs",
    difficulty: "intermediate",
    durationHours: 12,
    totalLessons: 16,
    xpReward: 450,
    modules: [
      { title: "Program Architecture", lessons: 5 },
      { title: "State and Instructions", lessons: 6 },
      { title: "Testing and Deployment", lessons: 5 }
    ]
  },
  {
    slug: "fullstack-dapps",
    title: "Fullstack dApps",
    description: "Connect modern web apps to on-chain programs with confidence.",
    topic: "Frontend",
    difficulty: "advanced",
    durationHours: 14,
    totalLessons: 18,
    xpReward: 600,
    modules: [
      { title: "Wallet UX", lessons: 6 },
      { title: "Program Integration", lessons: 6 },
      { title: "Production Patterns", lessons: 6 }
    ]
  }
];
