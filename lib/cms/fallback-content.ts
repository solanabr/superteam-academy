import type { CmsCourse } from "@/lib/cms/types";

export const fallbackCourses: CmsCourse[] = [
  {
    _id: "course-solana-foundations",
    slug: "solana-foundations",
    title: "Solana Foundations",
    description: "Core blockchain concepts, wallets, accounts, and transactions.",
    topic: "Core",
    difficulty: "beginner",
    durationHours: 8,
    xpReward: 300,
    modules: [
      {
        _id: "module-solana-basics",
        title: "Solana Basics",
        order: 1,
        lessons: [
          {
            _id: "lesson-1",
            title: "Accounts and PDAs",
            order: 1,
            content: "Learn account ownership, rent, and deterministic address derivation.",
            challengePrompt: "Implement PDA derivation and a transaction helper."
          }
        ]
      }
    ]
  },
  {
    _id: "course-anchor-programs",
    slug: "anchor-programs",
    title: "Anchor Programs",
    description: "Build and test secure Solana programs using Anchor.",
    topic: "Programs",
    difficulty: "intermediate",
    durationHours: 12,
    xpReward: 450,
    modules: [
      {
        _id: "module-anchor-architecture",
        title: "Program Architecture",
        order: 1,
        lessons: [
          {
            _id: "lesson-2",
            title: "Instruction Design",
            order: 1,
            content: "Structure instructions and account constraints with Anchor.",
            challengePrompt: "Write a basic instruction with account validation."
          }
        ]
      }
    ]
  },
  {
    _id: "course-fullstack-dapps",
    slug: "fullstack-dapps",
    title: "Fullstack dApps",
    description: "Connect modern web apps to on-chain programs with confidence.",
    topic: "Frontend",
    difficulty: "advanced",
    durationHours: 14,
    xpReward: 600,
    modules: [
      {
        _id: "module-wallet-ux",
        title: "Wallet UX",
        order: 1,
        lessons: [
          {
            _id: "lesson-3",
            title: "Wallet State and Session",
            order: 1,
            content: "Manage wallet auth and signing flows in production-grade UI.",
            challengePrompt: "Implement wallet connect guards for protected actions."
          }
        ]
      }
    ]
  }
];
