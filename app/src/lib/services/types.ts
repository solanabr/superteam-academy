export type Track =
  | "rust"
  | "anchor"
  | "frontend"
  | "security"
  | "defi"
  | "mobile";
export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  track: Track;
  difficulty: Difficulty;
  lessonCount: number;
  duration: string;
  xpReward: number;
  creator: string;
  imageUrl?: string;
  modules: Module[];
  prerequisiteId?: string;
  isActive: boolean;
  totalCompletions: number;
  enrolledCount: number;
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  type: "video" | "reading" | "challenge" | "quiz";
  duration: string;
  xpReward: number;
  content?: string;
  challenge?: CodeChallenge;
}

export interface CodeChallenge {
  instructions: string;
  starterCode: string;
  solution: string;
  testCases: TestCase[];
  language: "rust" | "typescript" | "javascript";
}

export interface TestCase {
  name: string;
  input: string;
  expectedOutput: string;
}

export interface Progress {
  courseId: string;
  completedLessons: number[];
  totalLessons: number;
  percentage: number;
  startedAt: string;
  completedAt?: string;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  freezesAvailable: number;
  activityHistory: Record<string, number>;
}

export interface LeaderboardEntry {
  rank: number;
  wallet: string;
  displayName?: string;
  avatarUrl?: string;
  xp: number;
  level: number;
  streak: number;
}

export interface Credential {
  id: string;
  mint: string;
  track: Track;
  level: number;
  coursesCompleted: number;
  xpEarned: number;
  imageUrl: string;
  metadataUri: string;
  issuedAt: string;
  explorerUrl: string;
  credentialAddress?: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  unlockedAt?: string;
  category: "learning" | "streak" | "social" | "special";
}

export interface UserProfile {
  wallet?: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  xp: number;
  level: number;
  streak: StreakData;
  achievements: Achievement[];
  credentials: Credential[];
  skills: Record<Track, number>;
  joinedAt: string;
  isPublic: boolean;
}

export interface LearningProgressService {
  getProgress(userId: string, courseId: string): Promise<Progress>;
  getAllProgress(userId: string): Promise<Progress[]>;
  completeLesson(
    userId: string,
    courseId: string,
    lessonIndex: number,
  ): Promise<void>;
  enrollInCourse(userId: string, courseId: string): Promise<void>;
  unenrollFromCourse(userId: string, courseId: string): Promise<void>;
  getXP(userId: string): Promise<number>;
  getStreak(userId: string): Promise<StreakData>;
  getLeaderboard(
    timeframe: "weekly" | "monthly" | "alltime",
  ): Promise<LeaderboardEntry[]>;
  getCredentials(walletAddress: string): Promise<Credential[]>;
  finalizeCourse(
    userId: string,
    courseId: string,
  ): Promise<{ xpAwarded: number; credentialIssued: boolean }>;
}
