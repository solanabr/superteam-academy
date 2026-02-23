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
  displayName: "Local Builder",
  bio: "Learning Solana end-to-end with Superteam Academy.",
  location: "Remote",
  avatar: "https://api.dicebear.com/9.x/glass/svg?seed=you",
  xp: 1320,
  level: levelFromXp(1320),
  enrolledCourseIds: ["course-solana-fundamentals", "course-anchor-101"],
  interests: ["Solana", "Anchor", "Security"],
  skills: {
    "Smart Contract Security": 31,
    Anchor: 48,
    DeFi: 36,
    "Token Engineering": 40,
    "Frontend dApps": 55,
  },
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: defaultProfile,
      locale: "en",
      theme: "dark",
      walletAddress: undefined,
      enrollments: defaultProfile.enrolledCourseIds,
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
