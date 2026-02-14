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
  accounts: { label: "Accounts", color: "#14F195" },
  transactions: { label: "Transactions", color: "#9945FF" },
  pdas: { label: "PDAs", color: "#FF6B35" },
  tokens: { label: "Tokens", color: "#FFD700" },
  cpi: { label: "CPI", color: "#00D1FF" },
  serialization: { label: "Serialization", color: "#FF69B4" },
  security: { label: "Security", color: "#ef4444" },
  anchor: { label: "Anchor", color: "#9945FF" },
  defi: { label: "DeFi", color: "#14F195" },
  advanced: { label: "Advanced", color: "#FF6B35" },
};

export const PRACTICE_DIFFICULTY_CONFIG: Record<PracticeDifficulty, { label: string; color: string; xp: number }> = {
  easy: { label: "Easy", color: "#14F195", xp: 10 },
  medium: { label: "Medium", color: "#FFD700", xp: 25 },
  hard: { label: "Hard", color: "#FF6B35", xp: 50 },
};

export const PRACTICE_MILESTONES = [15, 30, 50, 75] as const;

export const MILESTONE_LEVELS: Record<number, { name: string; color: string }> = {
  15: { name: "Bronze", color: "#CD7F32" },
  30: { name: "Silver", color: "#C0C0C0" },
  50: { name: "Gold", color: "#FFD700" },
  75: { name: "Diamond", color: "#B9F2FF" },
};
