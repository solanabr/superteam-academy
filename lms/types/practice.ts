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

export const PRACTICE_CATEGORIES: Record<PracticeCategory, { label: string; color: string }> = {
  accounts: { label: "Accounts", color: "#008c4c" },
  transactions: { label: "Transactions", color: "#2f6b3f" },
  pdas: { label: "PDAs", color: "#ffd23f" },
  tokens: { label: "Tokens", color: "#ffd23f" },
  cpi: { label: "CPI", color: "#2f6b3f" },
  serialization: { label: "Serialization", color: "#008c4c" },
  security: { label: "Security", color: "#1b231d" },
  anchor: { label: "Anchor", color: "#008c4c" },
  defi: { label: "DeFi", color: "#2f6b3f" },
  advanced: { label: "Advanced", color: "#1b231d" },
};

export const PRACTICE_DIFFICULTY_CONFIG: Record<PracticeDifficulty, { label: string; color: string; xp: number }> = {
  easy: { label: "Easy", color: "#008c4c", xp: 10 },
  medium: { label: "Medium", color: "#ffd23f", xp: 25 },
  hard: { label: "Hard", color: "#2f6b3f", xp: 50 },
};

export const PRACTICE_MILESTONES = [15, 30, 50, 75] as const;

export const MILESTONE_LEVELS: Record<number, { name: string; color: string; solReward: number }> = {
  15: { name: "Bronze", color: "#2f6b3f", solReward: 0.05 },
  30: { name: "Silver", color: "#8a9a8e", solReward: 0.1 },
  50: { name: "Gold", color: "#ffd23f", solReward: 0.25 },
  75: { name: "Diamond", color: "#008c4c", solReward: 0.5 },
};
