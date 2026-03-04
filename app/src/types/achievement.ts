import type { PublicKey } from "@solana/web3.js"

export type AchievementType =
  | "FIRST_LESSON"
  | "FIVE_LESSONS"
  | "FIRST_COURSE"
  | "SEVEN_DAY_STREAK"
  | "XP_1000"

export interface Achievement {
  type: AchievementType
  unlockedAt: number
}