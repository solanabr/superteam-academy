import type { Challenge } from "./course";

export type PracticeDifficulty = "easy" | "medium" | "hard";

export type PracticeCategory =
  | "accounts"
  | "transactions"
  | "pdas"
  | "tokens"
  | "cpi"
  | "serialization"
  | "security"
  | "anchor"
  | "defi"
  | "advanced";

export interface PracticeChallenge {
  id: string;
  title: string;
  description: string;
  difficulty: PracticeDifficulty;
  category: PracticeCategory;
  language: "rust" | "typescript";
  xpReward: number;
  challenge: Challenge;
  tags: string[];
}

export const PRACTICE_CATEGORIES: Record<
  PracticeCategory,
  { label: string; color: string }
> = {
  accounts: { label: "Accounts", color: "#34d399" },
  transactions: { label: "Transactions", color: "#60a5fa" },
  pdas: { label: "PDAs", color: "#fbbf24" },
  tokens: { label: "Tokens", color: "#a78bfa" },
  cpi: { label: "CPI", color: "#f472b6" },
  serialization: { label: "Serialization", color: "#2dd4bf" },
  security: { label: "Security", color: "#fb923c" },
  anchor: { label: "Anchor", color: "#34d399" },
  defi: { label: "DeFi", color: "#4ade80" },
  advanced: { label: "Advanced", color: "#f87171" },
};

export const PRACTICE_DIFFICULTY_CONFIG: Record<
  PracticeDifficulty,
  { label: string; color: string; xp: number }
> = {
  easy: { label: "Easy", color: "#34d399", xp: 10 },
  medium: { label: "Medium", color: "#fbbf24", xp: 25 },
  hard: { label: "Hard", color: "#f87171", xp: 50 },
};

export interface DailyChallenge {
  date: string;
  title: string;
  description: string;
  difficulty: PracticeDifficulty;
  category: PracticeCategory;
  language: "rust" | "typescript";
  xpReward: number;
  starterCode: string;
  solution: string;
  testCases: { id: string; name: string; input: string; expected: string }[];
  hints: string[];
  completed?: boolean;
  txHash?: string | null;
}

export interface DailyStreakData {
  current: number;
  longest: number;
  lastDay: string;
  completedDates: string[];
}

export const DAILY_STREAK_MILESTONES = [7, 30, 100] as const;

export const DAILY_XP_REWARDS: Record<PracticeDifficulty, number> = {
  easy: 15,
  medium: 30,
  hard: 60,
};

export const PRACTICE_MILESTONES = [15, 30, 50, 75] as const;

export const MILESTONE_LEVELS: Record<
  number,
  { name: string; color: string; solReward: number }
> = {
  15: { name: "Bronze", color: "#cd7f32", solReward: 0.05 },
  30: { name: "Silver", color: "#a8b2c1", solReward: 0.1 },
  50: { name: "Gold", color: "#fbbf24", solReward: 0.25 },
  75: { name: "Diamond", color: "#22d3ee", solReward: 0.5 },
};
