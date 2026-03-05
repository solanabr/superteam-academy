import type {
  ChallengeExecutionResult,
  CourseDetail,
  CourseSummary,
  Credential,
  LeaderboardEntry,
  StreakData,
  Timeframe,
  UserCourseProgress,
  UserProgressSummary,
} from "@/types/domain";

export type LessonCompletionInput = {
  courseId: string;
  lessonId: string;
  xpReward?: number;
};

export type ChallengeRunInput = {
  challengeId: string;
  courseId: string;
  lessonId: string;
  code: string;
  language: "rust" | "typescript" | "json";
};

export interface ContentService {
  getCourses(filters?: {
    search?: string;
    difficulty?: "beginner" | "intermediate" | "advanced";
    topic?: string;
    duration?: "short" | "medium" | "long";
  }): Promise<CourseSummary[]>;
  getCourseBySlug(slug: string): Promise<CourseDetail | null>;
}

export interface LearningProgressService {
  getProgress(userId: string, courseId: string): Promise<UserCourseProgress>;
  completeLesson(
    input: LessonCompletionInput,
    token?: string,
  ): Promise<{
    status: "accepted";
    pendingBackendSigner: true;
    requestId: string;
  }>;
  finalizeCourse(
    input: { courseId: string },
    token?: string,
  ): Promise<{
    status: "accepted";
    pendingBackendSigner: true;
    requestId: string;
  }>;
  claimAchievement(
    input: {
      achievementTypeId: string;
    },
    token?: string,
  ): Promise<{
    status: "accepted";
    pendingBackendSigner: true;
    requestId: string;
  }>;
  getXpBalance(walletAddress: string): Promise<{ xp: number; level: number }>;
  getStreak(userId: string): Promise<StreakData>;
  getLeaderboard(
    timeframe: Timeframe,
    courseId?: string,
  ): Promise<LeaderboardEntry[]>;
  getCredentials(walletAddress: string): Promise<Credential[]>;
  getUserAllProgress(userId: string): Promise<UserProgressSummary[]>;
}

export interface ChallengeExecutionService {
  runChallenge(
    input: ChallengeRunInput,
    token?: string,
  ): Promise<ChallengeExecutionResult>;
}
