"use client";

import { levelFromXp } from "@/lib/solana/constants";
import type { Locale, UserProfile } from "@/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserState {
  profile: UserProfile;
  locale: Locale;
  theme: "dark" | "light" | "system";
  walletAddress?: string;
  enrollments: string[];
  completedLessons: Record<string, string[]>;
  setLocale: (locale: Locale) => void;
  setTheme: (theme: "dark" | "light" | "system") => void;
  setWalletAddress: (walletAddress?: string) => void;
  enroll: (courseId: string) => void;
  completeLesson: (courseId: string, lessonId: string) => void;
  addXp: (amount: number) => void;
}

const defaultProfile: UserProfile = {
  id: "u-local",
  username: "you",
  displayName: "Learner",
  bio: "",
  location: "",
  avatar: "https://api.dicebear.com/9.x/glass/svg?seed=you",
  xp: 0,
  level: 0,
  enrolledCourseIds: [],
  interests: [],
  skills: {},
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: defaultProfile,
      locale: "en",
      theme: "dark",
      walletAddress: undefined,
      enrollments: [],
      completedLessons: {},
      setLocale: (locale) => set({ locale }),
      setTheme: (theme) => set({ theme }),
      setWalletAddress: (walletAddress) => set({ walletAddress }),
      enroll: (courseId) =>
        set((state) => ({
          enrollments: state.enrollments.includes(courseId)
            ? state.enrollments
            : [...state.enrollments, courseId],
        })),
      completeLesson: (courseId, lessonId) =>
        set((state) => ({
          completedLessons: {
            ...state.completedLessons,
            [courseId]: state.completedLessons[courseId]?.includes(lessonId)
              ? state.completedLessons[courseId]
              : [...(state.completedLessons[courseId] ?? []), lessonId],
          },
        })),
      addXp: (amount) =>
        set((state) => {
          const xp = state.profile.xp + amount;
          return {
            profile: {
              ...state.profile,
              xp,
              level: levelFromXp(xp),
            },
          };
        }),
    }),
    {
      name: "academy-user-state-v1",
      partialize: (state) => ({
        profile: state.profile,
        locale: state.locale,
        theme: state.theme,
        walletAddress: state.walletAddress,
        enrollments: state.enrollments,
        completedLessons: state.completedLessons,
      }),
    },
  ),
);
