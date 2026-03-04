/**
 * 12 seed users with archetypes for realistic platform activity.
 * Stable IDs so seed.ts can reference them directly.
 */
export interface SeedUser {
  id: string;
  displayName: string;
  wallet: string;
  bio: string;
  isPublic: boolean;
  onboardingCompleted: boolean;
  skillLevel: string;
  socialLinks?: { twitter?: string; github?: string; discord?: string };
  archetype: "power" | "active" | "casual" | "new" | "discussion" | "lurker";
}

export function getUsers(): SeedUser[] {
  return [
    // ── Power users (high XP, many completions) ───────────────────────
    {
      id: "seed_user_01",
      displayName: "Alex Solana",
      wallet: "ALEXso1ana111111111111111111111111111111111",
      bio: "Full-stack Solana dev. Anchor maximalist.",
      isPublic: true,
      onboardingCompleted: true,
      skillLevel: "advanced",
      socialLinks: {
        twitter: "alexsolana",
        github: "alexsol",
        discord: "alex#0001",
      },
      archetype: "power",
    },
    {
      id: "seed_user_02",
      displayName: "Priya Rust",
      wallet: "PRIYArust222222222222222222222222222222222",
      bio: "Rust systems engineer transitioning to Solana.",
      isPublic: true,
      onboardingCompleted: true,
      skillLevel: "advanced",
      socialLinks: { twitter: "priyarust", github: "priya-rs" },
      archetype: "power",
    },

    // ── Active users (moderate engagement) ────────────────────────────
    {
      id: "seed_user_03",
      displayName: "Marcus DeFi",
      wallet: "MARCUdefi33333333333333333333333333333333",
      bio: "DeFi degen turned builder. Learning Anchor.",
      isPublic: true,
      onboardingCompleted: true,
      skillLevel: "intermediate",
      socialLinks: { twitter: "marcusdefi", github: "marcus-defi" },
      archetype: "active",
    },
    {
      id: "seed_user_04",
      displayName: "Suki Token",
      wallet: "SUKItoken4444444444444444444444444444444444",
      bio: "Token economics researcher @ Superteam.",
      isPublic: true,
      onboardingCompleted: true,
      skillLevel: "intermediate",
      socialLinks: { github: "sukitoken" },
      archetype: "active",
    },
    {
      id: "seed_user_05",
      displayName: "Jordan Web3",
      wallet: "JORDNweb35555555555555555555555555555555555",
      bio: "Web2 → Web3. Next.js + Solana.",
      isPublic: true,
      onboardingCompleted: true,
      skillLevel: "intermediate",
      socialLinks: { twitter: "jordanweb3" },
      archetype: "active",
    },

    // ── Casual users (few courses, low activity) ──────────────────────
    {
      id: "seed_user_06",
      displayName: "Casey Learner",
      wallet: "CASEYlearn66666666666666666666666666666666",
      bio: "Just getting started with blockchain.",
      isPublic: true,
      onboardingCompleted: true,
      skillLevel: "beginner",
      archetype: "casual",
    },
    {
      id: "seed_user_07",
      displayName: "DevRaj",
      wallet: "DEVRAj0007777777777777777777777777777777777",
      bio: "CS student exploring Solana.",
      isPublic: true,
      onboardingCompleted: true,
      skillLevel: "beginner",
      socialLinks: { github: "devraj07" },
      archetype: "casual",
    },

    // ── New users (just joined, minimal activity) ─────────────────────
    {
      id: "seed_user_08",
      displayName: "Nova Chain",
      wallet: "NOVAchain8888888888888888888888888888888888",
      bio: "Excited to learn Solana!",
      isPublic: true,
      onboardingCompleted: false,
      skillLevel: "beginner",
      archetype: "new",
    },
    {
      id: "seed_user_09",
      displayName: "Fresh Start",
      wallet: "FRESHstart999999999999999999999999999999999",
      bio: "",
      isPublic: true,
      onboardingCompleted: false,
      skillLevel: "beginner",
      archetype: "new",
    },

    // ── Discussion-focused users ──────────────────────────────────────
    {
      id: "seed_user_10",
      displayName: "Debbie Discuss",
      wallet: "DEBBIdiscAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      bio: "I love helping people learn. Ask me anything!",
      isPublic: true,
      onboardingCompleted: true,
      skillLevel: "intermediate",
      socialLinks: { discord: "debbie#1234" },
      archetype: "discussion",
    },
    {
      id: "seed_user_11",
      displayName: "Thread King",
      wallet: "THREADkingBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
      bio: "Community builder. Anchor & Rust mentor.",
      isPublic: true,
      onboardingCompleted: true,
      skillLevel: "advanced",
      socialLinks: {
        twitter: "threadking",
        github: "threadking",
        discord: "tking#5678",
      },
      archetype: "discussion",
    },

    // ── Lurker (enrolled but rarely active) ───────────────────────────
    {
      id: "seed_user_12",
      displayName: "Silent Sam",
      wallet: "SILENTsamCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC",
      bio: "Prefer to read.",
      isPublic: false,
      onboardingCompleted: true,
      skillLevel: "beginner",
      archetype: "lurker",
    },
  ];
}
