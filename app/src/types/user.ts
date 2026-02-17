export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  email: string;
  bio: string;
  avatarUrl: string;
  socialLinks: SocialLinks;
  walletAddress?: string;
  isPublic: boolean;
  emailNotifications: boolean;
  preferredLanguage: string;
  preferredTheme: string;
  createdAt: string;
  updatedAt: string;
}

export interface SocialLinks {
  twitter?: string;
  github?: string;
  discord?: string;
  website?: string;
}

export interface UserStats {
  userId: string;
  totalXP: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  streakFreezes: number;
  coursesCompleted: number;
  lessonsCompleted: number;
  challengesCompleted: number;
  achievementFlags: number[];
  updatedAt: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: string;
  completedAt: string | null;
  progressPct: number;
  lessonFlags: number[];
}

export interface ProfileUpdateData {
  username?: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  socialLinks?: SocialLinks;
  isPublic?: boolean;
  emailNotifications?: boolean;
  preferredLanguage?: string;
  preferredTheme?: string;
}
