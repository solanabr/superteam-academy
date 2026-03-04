import { mockCredentials, mockLeaderboard } from "@/domain/mock-data";
import { mockCourses } from "@/domain/mock-data";
import { LearningProgress } from "@/domain/models";
import { LearningProgressService, LeaderboardWindow, UserStreak } from "./contracts";
import { backendClient } from "@/lib/backend/client";

export const localLearningProgressService: LearningProgressService = {
  async getProgress(wallet, courseId) {
    try {
      const remote = await backendClient.getProgress(wallet, courseId);
      if (remote) {
        return remote;
      }
    } catch {
      // Backend unavailable: keep this learner with no progress instead of seeded demo stats.
    }
    void courseId;
    return null;
  },
  async completeLesson(wallet, courseId, lessonId, metadata) {
    const course = mockCourses.find((item) => item.id === courseId);
    const totalLessons = Math.max(1, course?.lessons.length ?? 1);
    const current = (await this.getProgress(wallet, courseId)) ?? {
      courseId,
      completedLessonIds: [],
      percentComplete: 0,
      updatedAt: new Date().toISOString(),
    };

    const completedLessonIds = Array.from(new Set([...current.completedLessonIds, lessonId]));
    const progress: LearningProgress = {
      ...current,
      completedLessonIds,
      percentComplete: Math.min(100, Math.round((completedLessonIds.length / totalLessons) * 100)),
      updatedAt: new Date().toISOString(),
    };

    try {
      const remote = await backendClient.completeLesson({
        learnerId: wallet,
        courseId,
        lessonId,
        totalLessons,
        completionSignature: metadata?.completionSignature,
        completionNftId: metadata?.completionNftId,
      });
      if (remote) {
        return remote;
      }
    } catch {
      // Keep optimistic response when backend is unavailable.
    }
    return progress;
  },
  async getXPBalance() {
    return 1450;
  },
  async getStreakData(wallet) {
    try {
      const remote = await backendClient.getStreak(wallet);
      if (remote) {
        return remote;
      }
    } catch {
      // Backend unavailable: return empty streak for real-user consistency.
    }
    const streak: UserStreak = {
      current: 0,
      longest: 0,
      activeDays: [],
    };
    return streak;
  },
  async getLeaderboardEntries(window: LeaderboardWindow) {
    try {
      const remote = await backendClient.getLeaderboard(window);
      if (remote) {
        return remote;
      }
    } catch {
      // Fallback to static seeded leaderboard.
    }
    return mockLeaderboard;
  },
  async getCredentials() {
    return mockCredentials;
  },
};
