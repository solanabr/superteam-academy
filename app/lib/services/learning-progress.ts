export interface EnrollmentProgress {
  courseId: string;
  learner: string;
  completedLessons: number;
  totalLessons: number;
  completedAt: number | null;
  credentialAsset: string | null;
}

export interface LeaderboardEntry {
  rank: number;
  wallet: string;
  xp: number;
}

export type LeaderboardTimeframe = "weekly" | "monthly" | "all-time";

export interface CredentialInfo {
  asset: string;
  trackId: number;
  level: number;
  coursesCompleted: number;
  totalXp: number;
  /** Resolved image URL from DAS content.links.image or metadata */
  imageUrl?: string | null;
  /** Credential name from DAS content.metadata.name */
  name?: string | null;
  /** On-chain metadata JSON URI */
  metadataUri?: string | null;
}

export interface LearningProgressService {
  getProgress(courseId: string, learner: string): Promise<EnrollmentProgress | null>;
  completeLesson(
    courseId: string,
    learner: string,
    lessonIndex: number
  ): Promise<{ tx?: string; error?: string }>;
  getXpBalance(learner: string): Promise<number>;
  getStreakData(learner: string): Promise<{ current: number; history: number[] }>;
  getLeaderboardEntries(
    timeframe: LeaderboardTimeframe
  ): Promise<LeaderboardEntry[]>;
  getCredentials(wallet: string): Promise<CredentialInfo[]>;
}
