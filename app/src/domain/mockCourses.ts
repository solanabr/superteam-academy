import { CourseDefinition } from "./courses"

export const mockCourses: CourseDefinition[] = [
  {
    id: "solana-fundamentals",
    title: "courses.solanaFundamentals.title",
    description: "courses.solanaFundamentals.description",
    difficulty: "Beginner",
    lessonCount: 6,
    xpPerLesson: 30,
    trackId: "core",
    trackLevel: 1,
    lessons: [
      {
        id: 0,
        title: "lessons.solanaFundamentals.architecture.title",
        type: "content",
        xpReward: 30,
        content: "lessons.solanaFundamentals.architecture.content",
      },
      {
        id: 1,
        title: "lessons.solanaFundamentals.accounts.title",
        type: "content",
        xpReward: 30,
        content: "lessons.solanaFundamentals.accounts.content",
      },
      {
        id: 2,
        title: "lessons.solanaFundamentals.transactions.title",
        type: "content",
        xpReward: 30,
        content: "lessons.solanaFundamentals.transactions.content",
      },
      {
        id: 3,
        title: "lessons.solanaFundamentals.pda.title",
        type: "content",
        xpReward: 30,
        content: "lessons.solanaFundamentals.pda.content",
      },
      {
        id: 4,
        title: "lessons.solanaFundamentals.helloChallenge.title",
        type: "challenge",
        xpReward: 40,
        content: "lessons.solanaFundamentals.helloChallenge.content",
        starterCode: `function greet() {
  // return "Hello Solana"
}`,
        challenge: {
          functionName: "greet",
          expectedReturn: "Hello Solana",
        },
      },
      {
        id: 5,
        title: "lessons.solanaFundamentals.deployChallenge.title",
        type: "challenge",
        xpReward: 40,
        content: "lessons.solanaFundamentals.deployChallenge.content",
        starterCode: `function deploy() {
  // return true
}`,
        challenge: {
          functionName: "deploy",
          expectedReturn: true,
        },
      },
    ],
  },

  {
    id: "anchor-mastery",
    title: "courses.anchorMastery.title",
    description: "courses.anchorMastery.description",
    difficulty: "Intermediate",
    lessonCount: 6,
    xpPerLesson: 45,
    trackId: "core",
    trackLevel: 2,
    lessons: [
      {
        id: 0,
        title: "lessons.anchor.architecture.title",
        type: "content",
        xpReward: 45,
        content: "lessons.anchor.architecture.content",
      },
      {
        id: 1,
        title: "lessons.anchor.constraints.title",
        type: "content",
        xpReward: 45,
        content: "lessons.anchor.constraints.content",
      },
      {
        id: 2,
        title: "lessons.anchor.cpi.title",
        type: "content",
        xpReward: 45,
        content: "lessons.anchor.cpi.content",
      },
      {
        id: 3,
        title: "lessons.anchor.token2022.title",
        type: "challenge",
        xpReward: 60,
        content: "lessons.anchor.token2022.content",
        starterCode: `function createMint() {
  // return "token-2022"
}`,
        challenge: {
          functionName: "createMint",
          expectedReturn: "token-2022",
        },
      },
      {
        id: 4,
        title: "lessons.anchor.cpiChallenge.title",
        type: "challenge",
        xpReward: 60,
        content: "lessons.anchor.cpiChallenge.content",
        starterCode: `function cpi() {
  // return "cpi-success"
}`,
        challenge: {
          functionName: "cpi",
          expectedReturn: "cpi-success",
        },
      },
      {
        id: 5,
        title: "lessons.anchor.testing.title",
        type: "challenge",
        xpReward: 60,
        content: "lessons.anchor.testing.content",
        starterCode: `function runTests() {
  // return true
}`,
        challenge: {
          functionName: "runTests",
          expectedReturn: true,
        },
      },
    ],
  },

  {
    id: "solana-protocol-engineering",
    title: "courses.protocolEngineering.title",
    description: "courses.protocolEngineering.description",
    difficulty: "Advanced",
    lessonCount: 6,
    xpPerLesson: 70,
    trackId: "core",
    trackLevel: 3,
    lessons: [
      {
        id: 0,
        title: "lessons.protocol.compression.title",
        type: "content",
        xpReward: 70,
        content: "lessons.protocol.compression.content",
      },
      {
        id: 1,
        title: "lessons.protocol.compute.title",
        type: "content",
        xpReward: 70,
        content: "lessons.protocol.compute.content",
      },
      {
        id: 2,
        title: "lessons.protocol.security.title",
        type: "content",
        xpReward: 70,
        content: "lessons.protocol.security.content",
      },
      {
        id: 3,
        title: "lessons.protocol.vault.title",
        type: "challenge",
        xpReward: 100,
        content: "lessons.protocol.vault.content",
        starterCode: `function createVault() {
  // return "vault-secured"
}`,
        challenge: {
          functionName: "createVault",
          expectedReturn: "vault-secured",
        },
      },
      {
        id: 4,
        title: "lessons.protocol.upgrade.title",
        type: "challenge",
        xpReward: 100,
        content: "lessons.protocol.upgrade.content",
        starterCode: `function upgradeProtocol() {
  // return true
}`,
        challenge: {
          functionName: "upgradeProtocol",
          expectedReturn: true,
        },
      },
      {
        id: 5,
        title: "lessons.protocol.production.title",
        type: "challenge",
        xpReward: 100,
        content: "lessons.protocol.production.content",
        starterCode: `function audit() {
  // return "production-ready"
}`,
        challenge: {
          functionName: "audit",
          expectedReturn: "production-ready",
        },
      },
    ],
  },
]