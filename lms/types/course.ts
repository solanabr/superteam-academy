export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnail?: string;
  creator: string;
  difficulty: Difficulty;
  lessonCount: number;
  challengeCount: number;
  xpTotal: number;
  trackId: number;
  trackLevel: number;
  duration: string;
  prerequisiteId?: string;
  isActive: boolean;
  totalCompletions: number;
  totalEnrollments: number;
  modules: Module[];
  createdAt: string;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  order: number;
  type: "content" | "challenge";
  content?: string;
  challenge?: Challenge;
  xpReward: number;
  duration: string;
}

export interface Challenge {
  language: "rust" | "typescript" | "json";
  prompt: string;
  starterCode: string;
  solution: string;
  testCases: TestCase[];
  hints: string[];
}

export interface TestCase {
  id: string;
  name: string;
  input: string;
  expectedOutput: string;
}

export const TRACKS: Record<number, { name: string; display: string; color: string }> = {
  0: { name: "standalone", display: "Standalone", color: "#71717a" },
  1: { name: "anchor", display: "Anchor Framework", color: "#9945FF" },
  2: { name: "rust", display: "Rust for Solana", color: "#FF6B35" },
  3: { name: "defi", display: "DeFi Development", color: "#14F195" },
  4: { name: "security", display: "Program Security", color: "#ef4444" },
};

export const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; color: string; xp: number }> = {
  beginner: { label: "Beginner", color: "#14F195", xp: 500 },
  intermediate: { label: "Intermediate", color: "#FFD700", xp: 1000 },
  advanced: { label: "Advanced", color: "#FF6B35", xp: 2000 },
};
