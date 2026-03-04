import { LeaderboardWindow } from "@/services/contracts";

export type EnrollmentRecord = {
  learnerId: string;
  courseId: string;
  signature?: string;
  source?: string;
  enrolledAt?: string;
};

export type ProgressRecord = {
  learnerId: string;
  courseId: string;
  lessonId: string;
  totalLessons: number;
  completionSignature?: string;
  completionNftId?: string;
};

export type ProgressSummary = {
  courseId: string;
  completedLessonIds: string[];
  percentComplete: number;
  updatedAt: string;
};

export type ActivityItem = {
  id: string;
  eventType: string;
  courseId?: string;
  lessonId?: string;
  createdAt: string;
};

export type StreakSummary = {
  current: number;
  longest: number;
  activeDays: string[];
};

export type LeaderboardQuery = {
  window: LeaderboardWindow;
};

export type ProfileRecord = {
  learnerId: string;
  displayName: string;
  email: string | null;
  walletAddress: string | null;
  username: string;
  avatarUrl: string;
  bio: string;
  country: string;
  role: string;
  isComplete: boolean;
  updatedAt: string;
};

export type ProfileVisibilityRecord = {
  learnerId: string;
  isPublic: boolean;
  updatedAt: string;
};
