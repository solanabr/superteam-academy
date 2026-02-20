"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserProfile, StreakData, ActivityItem, CourseProgress } from "@/types";

interface AppState {
  // User
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;

  // Theme
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;

  // Streak
  streak: StreakData;
  updateStreak: () => void;
  resetStreak: () => void;

  // Activity
  activities: ActivityItem[];
  addActivity: (activity: ActivityItem) => void;

  // Progress (stubbed — local storage until on-chain)
  courseProgress: Record<string, CourseProgress>;
  setCourseProgress: (courseId: string, progress: CourseProgress) => void;
  completeLesson: (courseId: string, lessonIndex: number, xp: number) => void;
}

const initialStreak: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastActivityDate: null,
  streakHistory: {},
  hasFreezeAvailable: false,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // User
      user: null,
      setUser: (user) => set({ user }),

      // Theme
      theme: "light",
      setTheme: (theme) => set({ theme }),

      // Streak
      streak: initialStreak,
      updateStreak: () => {
        const today = new Date().toISOString().split("T")[0];
        const { streak } = get();
        const yesterday = new Date(Date.now() - 86400000)
          .toISOString()
          .split("T")[0];

        const isConsecutive = streak.lastActivityDate === yesterday;
        const isToday = streak.lastActivityDate === today;

        if (isToday) return;

        const newStreak = isConsecutive ? streak.currentStreak + 1 : 1;
        const longestStreak = Math.max(newStreak, streak.longestStreak);

        set({
          streak: {
            ...streak,
            currentStreak: newStreak,
            longestStreak,
            lastActivityDate: today,
            streakHistory: { ...streak.streakHistory, [today]: true },
          },
        });
      },
      resetStreak: () => set({ streak: initialStreak }),

      // Activity
      activities: [],
      addActivity: (activity) =>
        set((state) => ({
          activities: [activity, ...state.activities].slice(0, 50),
        })),

      // Progress
      courseProgress: {},
      setCourseProgress: (courseId, progress) =>
        set((state) => ({
          courseProgress: { ...state.courseProgress, [courseId]: progress },
        })),
      completeLesson: (courseId, lessonIndex, xp) =>
        set((state) => {
          const existing = state.courseProgress[courseId];
          if (!existing) return state;

          const completedLessons = existing.completedLessons.includes(lessonIndex)
            ? existing.completedLessons
            : [...existing.completedLessons, lessonIndex];

          const completionPercentage =
            (completedLessons.length / existing.totalLessons) * 100;

          return {
            courseProgress: {
              ...state.courseProgress,
              [courseId]: {
                ...existing,
                completedLessons,
                completionPercentage,
                isCompleted: completedLessons.length === existing.totalLessons,
                xpEarned: existing.xpEarned + xp,
              },
            },
          };
        }),
    }),
    {
      name: "superteam-academy-store",
      partialize: (state) => ({
        theme: state.theme,
        streak: state.streak,
        activities: state.activities,
        courseProgress: state.courseProgress,
      }),
    }
  )
);
