import type { StreakData } from "@/types";

export interface StreakService {
  getStreak(userId: string): Promise<StreakData>;
  recordActivity(userId: string): Promise<StreakData>;
  useFreeze(userId: string): Promise<StreakData>;
}
