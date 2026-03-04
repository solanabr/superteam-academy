export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  shortDescription: string;
  thumbnail: string;
  creator: string;
  difficulty: 1 | 2 | 3;
  trackId: number;
  trackLevel: number;
  lessonCount: number;
  xpPerLesson: number;
  creatorRewardXp: number;
  isActive: boolean;
  totalCompletions: number;
  prerequisite: string | null;
  modules: Module[];
  estimatedHours: number;
  tags: string[];
}

export interface Module {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: number;
  title: string;
  description: string;
  type: "article" | "video" | "code-challenge" | "quiz";
  content: string;
  estimatedMinutes: number;
  codeChallenge?: CodeChallenge;
}

export interface CodeChallenge {
  prompt: string;
  objectives: string[];
  starterCode: string;
  language: string;
  testCases: TestCase[];
  solution: string;
}

export interface TestCase {
  id: string;
  description: string;
  input: string;
  expectedOutput: string;
  hidden: boolean;
}

export interface Progress {
  courseId: string;
  lessonFlags: bigint[];
  completedLessons: number[];
  completedAt: number | null;
  enrolledAt: number;
  credentialAsset: string | null;
  totalLessons: number;
  percentComplete: number;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  activityCalendar: Record<string, boolean>;
}

export interface LeaderboardEntry {
  rank: number;
  wallet: string;
  displayName: string;
  avatarUrl: string | null;
  xp: number;
  level: number;
  coursesCompleted: number;
  credentials: number;
}

export interface Credential {
  assetId: string;
  name: string;
  imageUri: string;
  trackId: number;
  trackLevel: number;
  coursesCompleted: number;
  totalXp: number;
  mintAddress: string;
  collection: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  iconUri: string;
  xpReward: number;
  unlockedAt: number | null;
}

export interface UserProfile {
  wallet: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  socialLinks: {
    twitter?: string;
    github?: string;
    website?: string;
  };
  xp: number;
  level: number;
  coursesCompleted: number;
  credentials: Credential[];
  achievements: Achievement[];
  joinedAt: number;
  skills: SkillScore[];
}

export interface SkillScore {
  skill: string;
  score: number;
  maxScore: number;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  courses: string[];
  difficulty: 1 | 2 | 3;
  estimatedHours: number;
  icon: string;
}
