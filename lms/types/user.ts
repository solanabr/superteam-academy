export interface UserProfile {
  wallet: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  joinedAt: string;
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: number;
  streakFreezes: number;
  achievementFlags: bigint[];
  referralCount: number;
  hasReferrer: boolean;
}

export interface Progress {
  courseId: string;
  enrolledAt: string;
  completedAt?: string;
  lessonsCompleted: number[];
  totalLessons: number;
  percentComplete: number;
}

export interface LeaderboardEntry {
  rank: number;
  wallet: string;
  displayName?: string;
  avatar?: string;
  xp: number;
  level: number;
  streak: number;
}

export interface StreakData {
  current: number;
  longest: number;
  lastActivityDate: number;
  freezesAvailable: number;
  history: StreakDay[];
}

export interface StreakDay {
  date: string;
  active: boolean;
  frozen: boolean;
}
