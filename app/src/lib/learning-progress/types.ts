/** Per-user progress (XP, streaks, achievements). Aligns with docs/SPEC. */
export interface Progress {
  userId: string;
  xp: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date | null;
  achievementFlags: Uint8Array;
}

/** Streak summary for UI. */
export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date | null;
}

/** Leaderboard row. */
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  walletAddress: string;
  xp: number;
  level: number;
  currentStreak: number;
}

/** Credential (track completion). Stub aligns with on-chain Credential. */
export interface Credential {
  id: string;
  userId: string;
  trackId: string;
  trackName: string;
  level: number;
  coursesCompleted: number;
  totalXpEarned: number;
  earnedAt: Date;
  metadataUrl: string | null;
}

/** Enrollment with lesson bitmap. */
export interface EnrollmentProgress {
  courseId: string;
  lessonFlags: Uint8Array;
  completedAt: Date | null;
  completedCount: number;
  totalLessons: number;
}

export function getLevelFromXp(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100));
}
