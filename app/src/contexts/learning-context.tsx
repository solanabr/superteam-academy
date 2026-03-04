"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import type { Progress, StreakData, Credential } from "@/types";
import { learningProgressService } from "@/services/learning-progress";

interface LearningContextValue {
  xp: number;
  progress: Map<string, Progress>;
  streak: StreakData;
  credentials: Credential[];
  isLoading: boolean;
  enrollInCourse: (courseId: string) => Promise<void>;
  completeLesson: (courseId: string, lessonId: number) => Promise<void>;
  getProgress: (courseId: string) => Progress | null;
  refreshData: () => Promise<void>;
  recordActivity: () => void;
}

const defaultStreak: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastActivityDate: "",
  activityCalendar: {},
};

const LearningContext = createContext<LearningContextValue>({
  xp: 0,
  progress: new Map(),
  streak: defaultStreak,
  credentials: [],
  isLoading: false,
  enrollInCourse: async () => {},
  completeLesson: async () => {},
  getProgress: () => null,
  refreshData: async () => {},
  recordActivity: () => {},
});

export function LearningProvider({ children }: { children: ReactNode }) {
  const { publicKey } = useWallet();
  const [xp, setXp] = useState(0);
  const [progress, setProgress] = useState<Map<string, Progress>>(new Map());
  const [streak, setStreak] = useState<StreakData>(defaultStreak);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const userId = publicKey?.toBase58() ?? "";

  const refreshData = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const [xpBalance, allProgress, streakData, creds] = await Promise.all([
        learningProgressService.getXPBalance(userId),
        learningProgressService.getAllProgress(userId),
        learningProgressService.getStreakData(userId),
        learningProgressService.getCredentials(userId),
      ]);

      setXp(xpBalance);
      const progressMap = new Map<string, Progress>();
      allProgress.forEach((p) => progressMap.set(p.courseId, p));
      setProgress(progressMap);
      setStreak(streakData);
      setCredentials(creds);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const enrollInCourse = useCallback(
    async (courseId: string) => {
      if (!userId) return;
      await learningProgressService.enrollInCourse(userId, courseId);
      await refreshData();
    },
    [userId, refreshData]
  );

  const completeLesson = useCallback(
    async (courseId: string, lessonId: number) => {
      if (!userId) return;
      await learningProgressService.completeLesson(userId, courseId, lessonId);
      recordActivity();
      await refreshData();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, refreshData]
  );

  const getProgress = useCallback(
    (courseId: string): Progress | null => {
      return progress.get(courseId) ?? null;
    },
    [progress]
  );

  const recordActivity = useCallback(() => {
    if (!userId) return;
    const today = new Date().toISOString().split("T")[0];
    const storedRaw = localStorage.getItem(`streak:${userId}`);
    const stored: StreakData = storedRaw
      ? JSON.parse(storedRaw)
      : defaultStreak;

    if (stored.lastActivityDate === today) return;

    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .split("T")[0];
    const newStreak =
      stored.lastActivityDate === yesterday ? stored.currentStreak + 1 : 1;

    const updated: StreakData = {
      currentStreak: newStreak,
      longestStreak: Math.max(stored.longestStreak, newStreak),
      lastActivityDate: today,
      activityCalendar: { ...stored.activityCalendar, [today]: true },
    };

    localStorage.setItem(`streak:${userId}`, JSON.stringify(updated));
    setStreak(updated);
  }, [userId]);

  return (
    <LearningContext.Provider
      value={{
        xp,
        progress,
        streak,
        credentials,
        isLoading,
        enrollInCourse,
        completeLesson,
        getProgress,
        refreshData,
        recordActivity,
      }}
    >
      {children}
    </LearningContext.Provider>
  );
}

export function useLearning() {
  return useContext(LearningContext);
}
