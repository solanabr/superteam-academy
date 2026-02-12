export interface Progress {
  courseId: string;
  completedLessons: number[];
  totalLessons: number;
  percentComplete: number;
  xpEarned: number;
  startedAt: Date;
  completedAt?: Date;
}

export interface StreakData {
  current: number;
  longest: number;
  lastActivityDate: Date;
  history: { date: string; lessonsCompleted: number; xpEarned: number }[];
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl?: string;
  xp: number;
  level: number;
  streak: number;
}

export interface Credential {
  mint: string;
  track: string;
  level: number;
  issuedAt: Date;
  metadataUri: string;
  explorerUrl: string;
}

export interface LearningProgressService {
  getProgress(userId: string, courseId: string): Promise<Progress>;
  completeLesson(userId: string, courseId: string, lessonIndex: number): Promise<void>;
  getXP(userId: string): Promise<number>;
  getStreak(userId: string): Promise<StreakData>;
  getLeaderboard(timeframe: "weekly" | "monthly" | "alltime"): Promise<LeaderboardEntry[]>;
  getCredentials(wallet: string): Promise<Credential[]>;
}
