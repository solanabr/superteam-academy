export type UserRole = 'admin' | 'professor' | 'student';

export interface User {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  role: UserRole;
  walletAddress: string | null;
  xp: number;
  level: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  xp: number;
  thumbnailUrl: string | null;
  instructorId: string;
  status: 'draft' | 'published' | 'archived';
  prerequisites: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Module {
  id: string;
  title: string;
  order: number;
  courseId: string;
  createdAt: Date;
}

export type LessonType = 'content' | 'challenge' | 'quiz' | 'video';

export interface Lesson {
  id: string;
  title: string;
  type: LessonType;
  content: string;
  order: number;
  moduleId: string;
  xp: number;
  createdAt: Date;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: Date;
  completedAt: Date | null;
}

export interface Progress {
  userId: string;
  courseId: string;
  lessonId: string;
  completed: boolean;
  completedAt: Date | null;
  score: number | null;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  streakDates: string[];
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  image: string | null;
  xp: number;
  rank: number;
  level: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  unlockedAt: Date | null;
}

export interface Credential {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  mintAddress: string;
  courseId: string;
  issuedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'achievement';
  read: boolean;
  createdAt: Date;
}

export interface Comment {
  id: string;
  userId: string;
  lessonId: string;
  content: string;
  parentId: string | null;
  upvotes: number;
  createdAt: Date;
}
