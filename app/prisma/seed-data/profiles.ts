import type { SkillDataPoint } from "../../src/components/profile/skill-chart";
import type { Achievement } from "../../src/types";

export interface MockProfile {
  displayName: string;
  bio: string;
  joinedAt: string;
  socialLinks: { twitter?: string; github?: string; discord?: string };
  xp: number;
  coursesCompleted: string[];
  achievements: Achievement[];
  skillData: SkillDataPoint[];
}

/**
 * Demo public profiles — shown for known demo usernames when no DB record exists.
 * Canonical data for these users; remove entries as real DB records are created.
 */
export const MOCK_PUBLIC_PROFILES: Record<string, MockProfile> = {
  "soldev-eth": {
    displayName: "SolDev.eth",
    bio: "Full-stack Solana builder. Learning Anchor, building DeFi, and shipping dApps. Superteam Brazil contributor.",
    joinedAt: "2025-11-15T00:00:00Z",
    socialLinks: { twitter: "SolDevEth", github: "soldev-eth" },
    xp: 1750,
    coursesCompleted: ["intro-to-solana", "anchor-fundamentals", "nextjs-solana-dapps"],
    achievements: [
      { id: 1, name: "First Steps", description: "Complete your first lesson", icon: "footprints", category: "progress", xpReward: 50, claimed: true, claimedAt: "2025-12-01T00:00:00Z" },
      { id: 2, name: "Fast Learner", description: "Complete 5 lessons in one day", icon: "zap", category: "progress", xpReward: 100, claimed: true, claimedAt: "2025-12-10T00:00:00Z" },
      { id: 5, name: "Course Master", description: "Complete an entire course", icon: "graduation-cap", category: "progress", xpReward: 200, claimed: true, claimedAt: "2026-01-10T00:00:00Z" },
      { id: 6, name: "Streak Starter", description: "Maintain a 7-day streak", icon: "flame", category: "streaks", xpReward: 75, claimed: true, claimedAt: "2025-12-20T00:00:00Z" },
      { id: 11, name: "Code Warrior", description: "Complete 10 coding challenges", icon: "code", category: "skills", xpReward: 100, claimed: true, claimedAt: "2026-01-15T00:00:00Z" },
      { id: 16, name: "Early Adopter", description: "Join the platform in its first month", icon: "rocket", category: "special", xpReward: 150, claimed: true, claimedAt: "2025-11-15T00:00:00Z" },
    ],
    skillData: [
      { skill: "Anchor Framework", value: 70 },
      { skill: "Standalone", value: 85 },
      { skill: "Frontend & dApps", value: 60 },
      { skill: "DeFi Development", value: 20 },
      { skill: "Program Security", value: 10 },
    ],
  },
  "anchor-pro": {
    displayName: "AnchorPro",
    bio: "Anchor framework specialist. Building on-chain programs for Superteam ecosystem. Security enthusiast.",
    joinedAt: "2025-12-01T00:00:00Z",
    socialLinks: { twitter: "AnchorPro", github: "anchor-pro", discord: "anchorpro" },
    xp: 3200,
    coursesCompleted: ["intro-to-solana", "anchor-fundamentals", "token-engineering", "solana-security", "defi-fundamentals"],
    achievements: [
      { id: 1, name: "First Steps", description: "Complete your first lesson", icon: "footprints", category: "progress", xpReward: 50, claimed: true, claimedAt: "2025-12-05T00:00:00Z" },
      { id: 5, name: "Course Master", description: "Complete an entire course", icon: "graduation-cap", category: "progress", xpReward: 200, claimed: true, claimedAt: "2025-12-15T00:00:00Z" },
      { id: 12, name: "Security Expert", description: "Complete the Security track", icon: "shield", category: "skills", xpReward: 200, claimed: true, claimedAt: "2026-02-01T00:00:00Z" },
    ],
    skillData: [
      { skill: "Anchor Framework", value: 95 },
      { skill: "Standalone", value: 80 },
      { skill: "Token Engineering", value: 75 },
      { skill: "Program Security", value: 90 },
    ],
  },
};
