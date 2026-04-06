export type WalletAddress = string;
export type CourseId = string;
export type LessonId = string;

export type LeaderboardTimeframe = "weekly" | "monthly" | "all";

export type Difficulty = 1 | 2 | 3;

export type TrackId = number;

export interface XpSummary {
  totalXp: number;
  level: number;
}

export interface CourseProgress {
  courseId: CourseId;
  completedLessons: number[];
  totalLessons: number;
  xpEarned: number;
  lastActivityAt: string | null;
  isCompleted: boolean;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  streakCalendar: string[];
}

export interface LeaderboardEntry {
  wallet: WalletAddress;
  displayName: string;
  avatarUrl?: string;
  xp: number;
  level: number;
  rank: number;
  currentStreak: number;
}

export interface CredentialSummary {
  assetId: string;
  trackId: TrackId;
  level: number;
  coursesCompleted: number;
  totalXp: number;
  mint: string;
  explorerUrl: string;
}

export interface AchievementTypeSummary {
  id: string;
  name: string;
  category: "progress" | "streak" | "skills" | "community" | "special";
  description: string;
}

export interface AchievementReceiptSummary {
  id: string;
  typeId: string;
  awardedAt: string;
}

