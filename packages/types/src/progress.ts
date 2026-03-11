export interface Progress {
  userId: string;
  courseId: string;
  completedLessons: string[];
  totalLessons: number;
  percentComplete: number;
  lastAccessedAt: Date;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  streakHistory: Record<string, number>;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatarUrl: string;
  totalXp: number;
  level: number;
  rank: number;
  walletAddress?: string;
}

export interface XpTransaction {
  userId: string;
  amount: number;
  reason: string;
  createdAt: Date;
}

export interface Credential {
  trackId: string;
  trackName: string;
  currentLevel: number;
  coursesCompleted: number;
  totalXpEarned: number;
  firstEarnedAt: Date;
  lastUpdatedAt: Date;
  mintAddress?: string;
  metadataUri?: string;
}

export interface DailyQuest {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  targetValue: number;
  currentValue: number;
  completed: boolean;
  resetType: "daily" | "multi_day";
}

export interface LearningProgressService {
  // Layer 1: Direct reads
  getProgress(userId: string, courseId: string): Promise<Progress>;
  getXP(userId: string): Promise<number>;
  getStreak(userId: string): Promise<StreakData>;

  // Layer 2: Indexed queries (on-chain via Helius DAS API when available)
  getLeaderboard(
    timeframe: "weekly" | "monthly" | "alltime"
  ): Promise<LeaderboardEntry[]>;
  getCredentials(walletAddress: string): Promise<Credential[]>;
  getCredentialByTrack(
    walletAddress: string,
    trackId: string
  ): Promise<Credential | null>;

  // Layer 3: Transaction builders (write path stays in API routes;
  // on-chain: would build tx calling program's complete_lesson instruction
  // via backend_signer from Config PDA)
  completeLesson(
    userId: string,
    courseId: string,
    lessonIndex: number
  ): Promise<{ xpEarned: number; newAchievements: string[] }>;
}
