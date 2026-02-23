export type Locale = "en" | "pt-BR" | "es";

export type Difficulty = "beginner" | "intermediate" | "advanced";
export type LessonKind = "content" | "challenge";

export interface Lesson {
  id: string;
  title: string;
  kind: LessonKind;
  durationMinutes: number;
  objective: string;
  markdown: string;
  starterCode?: string;
  expectedOutput?: string;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  instructor: string;
  difficulty: Difficulty;
  durationHours: number;
  enrolledCount: number;
  tags: string[];
  modules: Module[];
  prerequisites: string[];
  outcomes: string[];
  gradient: string;
}

export interface CourseProgress {
  userId: string;
  courseId: string;
  completedLessonIds: string[];
  completionRate: number;
  updatedAt: string;
}

export interface StreakDay {
  date: string;
  active: boolean;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  days: StreakDay[];
}

export interface Credential {
  id: string;
  courseId: string;
  title: string;
  issuedAt: string;
  issuer: string;
  imageUri: string;
  txSignature?: string;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar: string;
  country: string;
  xp: number;
  level: number;
  weeklyGain: number;
  badges: string[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  rarity: "common" | "rare" | "epic";
  unlocked: boolean;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  location: string;
  avatar: string;
  walletAddress?: string;
  xp: number;
  level: number;
  enrolledCourseIds: string[];
  interests: string[];
  skills: Record<string, number>;
}

export type LeaderboardTimeframe = "weekly" | "monthly" | "all-time";
