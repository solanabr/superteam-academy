export type Locale = 'pt-BR' | 'es' | 'en';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export type Timeframe = 'weekly' | 'monthly' | 'alltime';

export type LessonType = 'content' | 'challenge';

export interface CourseSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  durationMinutes: number;
  topic: string;
  thumbnail: string;
  xpTotal: number;
  instructor: string;
  path: string;
}

export interface ChallengeTestCase {
  id: string;
  label: string;
  passed: boolean;
  expected: string;
}

export interface Lesson {
  id: string;
  title: string;
  moduleId: string;
  moduleTitle: string;
  type: LessonType;
  markdown: string;
  xpReward: number;
  starterCode?: string;
  language?: 'rust' | 'typescript' | 'json';
  testCases?: ChallengeTestCase[];
}

export interface CourseModule {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface CourseDetail extends CourseSummary {
  modules: CourseModule[];
  learningOutcomes: string[];
}

export interface Progress {
  userId: string;
  courseId: string;
  completedLessonIndexes: number[];
  percentage: number;
  xpEarned: number;
  lastLessonId?: string;
}

export interface StreakData {
  current: number;
  longest: number;
  lastActiveDate: string;
  activeDates: string[];
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string;
  xp: number;
  level: number;
  streak: number;
}

export interface Credential {
  id: string;
  walletAddress: string;
  track: string;
  level: number;
  status: 'in_progress' | 'completed';
  mintAddress: string;
  explorerUrl: string;
  issuedAt: string;
  metadataUri: string;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  joinedAt: string;
  walletAddress?: string;
  social: {
    github?: string;
    twitter?: string;
    website?: string;
  };
  skills: Array<{
    name: string;
    value: number;
  }>;
  badges: string[];
  completedCourseIds: string[];
  publicProfile: boolean;
}
