import { courses } from "./courses";
import { userStats, achievements, type Achievement } from "./dashboard";

/* ── Types ── */

export interface UserProfile {
  name: string;
  username: string;
  bio: string;
  initials: string;
  joinDate: string;
  socialLinks: {
    github?: string;
    twitter?: string;
    website?: string;
  };
  isPublic: boolean;
}

export interface SkillScore {
  name: string;
  value: number; // 0-100
}

export interface Credential {
  id: string;
  track: string;
  level: string;
  accent: string;
  mintAddress: string;
  earnedAt: string;
}

/* ── Mock Data ── */

export const userProfile: UserProfile = {
  name: "Learner",
  username: "solana_learner",
  bio: "Building on Solana. Learning Rust, Anchor, and DeFi protocols. Hackathon enthusiast.",
  initials: "SL",
  joinDate: "January 2026",
  socialLinks: {
    github: "https://github.com/solana-learner",
    twitter: "https://twitter.com/solana_learner",
    website: "https://solana-learner.dev",
  },
  isPublic: true,
};

export const skillScores: SkillScore[] = [
  { name: "Rust", value: 72 },
  { name: "Anchor", value: 58 },
  { name: "Frontend", value: 85 },
  { name: "Security", value: 40 },
  { name: "Testing", value: 65 },
  { name: "DeFi", value: 30 },
];

export const credentials: Credential[] = [
  {
    id: "cred1",
    track: "Solana Core",
    level: "Intermediate",
    accent: "#34d399",
    mintAddress: "AcAd7xR2qHjV9bFmT4kPcE8Yjw3NpQs6D1fG5hK7mL8",
    earnedAt: "Feb 2026",
  },
  {
    id: "cred2",
    track: "Anchor Framework",
    level: "Beginner",
    accent: "#eab308",
    mintAddress: "XpMt9bK3rDwE5fHj2NcS4pQ8vT1yL6mA7gU0iR3oW5x",
    earnedAt: "Mar 2026",
  },
  {
    id: "cred3",
    track: "Program Security",
    level: "Beginner",
    accent: "#ef4444",
    mintAddress: "ShLd4mN8pQr2tV6wX9yA1bC3dE5fG7hJ0kL2oP4sU6x",
    earnedAt: "Mar 2026",
  },
];

/* ── Re-exports ── */

export { userStats, achievements };
export type { Achievement };

/* ── Helpers ── */

export function getCredentialById(id: string) {
  return credentials.find((c) => c.id === id);
}

export function getCompletedCourses() {
  // Simulate: first 3 courses have progress
  return courses.slice(0, 3).map((c, i) => ({
    ...c,
    completed: i === 0 ? 24 : i === 1 ? 8 : 3,
    completedAt:
      i === 0 ? "Feb 15, 2026" : i === 1 ? "In progress" : "In progress",
    xpEarned: i === 0 ? 2400 : i === 1 ? 800 : 300,
  }));
}
