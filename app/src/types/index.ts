// Re-exports
export * from './certificate';

// User types
export interface User {
  id: string;
  walletAddress?: string;
  email?: string;
  googleId?: string;
  githubId?: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  language: 'pt-br' | 'es' | 'en';
  theme: 'light' | 'dark';
  createdAt: Date;
}

// Course types
export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnail: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  xpReward: number;
  track?: string;
  modules: Module[];
  enrollmentCount?: number;
  rating?: number;
  instructor?: Instructor;
}

export interface Module {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  slug: string;
  title: string;
  type: 'content' | 'challenge' | 'video' | 'reading' | 'quiz';
  content?: string; // Markdown content
  videoUrl?: string;
  videoProvider?: 'youtube' | 'vimeo' | 'facebook' | 'direct';
  videoDurationSeconds?: number; // Video duration in seconds for auto-completion
  challenge?: Challenge;
  xpReward: number;
  hints?: string[];
  duration?: number;
}

export interface Challenge {
  id: string;
  prompt: string;
  starterCode: string;
  solution: string;
  testCases: TestCase[];
  language: 'rust' | 'typescript' | 'json';
}

export interface TestCase {
  id: string;
  description: string;
  input?: string;
  expectedOutput: string;
  hidden?: boolean;
}

export interface Instructor {
  id: string;
  name: string;
  avatar: string;
  bio: string;
}

// Progress types
export interface UserProgress {
  userId: string;
  courseId: string;
  completedLessons: string[];
  currentLesson?: string;
  startedAt: Date;
  completedAt?: Date;
  xpEarned: number;
}

export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  completedAt?: Date;
  xpEarned: number;
}

// Gamification types
export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;
  streakHistory: StreakDay[];
}

export interface StreakDay {
  date: string;
  active: boolean;
}

export interface Achievement {
  id: string;
  type: AchievementType;
  name: string;
  description: string;
  imageUrl: string;
  xpReward: number;
  unlockedAt?: Date;
}

export type AchievementType = 'progress' | 'streak' | 'skill' | 'community' | 'special';

export interface LeaderboardEntry {
  rank: number;
  walletAddress: string;
  displayName: string;
  avatarUrl?: string;
  xp: number;
  level: number;
  streak?: number;
}

// Credential types
export interface Credential {
  id: string;
  mintAddress: string;
  track: string;
  level: number;
  coursesCompleted: number;
  totalXp: number;
  imageUrl: string;
  metadataUri: string;
  issuedAt: Date;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
