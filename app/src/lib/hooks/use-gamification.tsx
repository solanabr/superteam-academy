"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useLearningProgress } from "./use-learning-progress";
import {
  generateDailyQuests,
  type Quest,
  type DailyQuests,
} from "./gamification-quests";

// ── Types ──

interface DailyGoal {
  target: number;
  xpToday: number;
  date: string;
}

interface ComboState {
  count: number;
  multiplier: number;
  lastCompletionTime: number;
}

interface GamificationContextValue {
  dailyGoal: DailyGoal;
  setDailyGoalTarget: (target: number) => void;
  addDailyXP: (amount: number) => void;
  dailyQuests: Quest[];
  completeQuestProgress: (type: Quest["type"], amount?: number) => void;
  combo: ComboState;
  recordCombo: () => number;
  streakInDanger: boolean;
  showCelebration: boolean;
  celebrationData: CelebrationData | null;
  triggerCelebration: (data: CelebrationData) => void;
  dismissCelebration: () => void;
}

export interface CelebrationData {
  lessonTitle: string;
  xpEarned: number;
  bonusXP: number;
  comboCount: number;
  comboMultiplier: number;
  isLevelUp: boolean;
  newLevel: number;
  isChallenge: boolean;
  dailyGoalProgress: number;
  dailyGoalTarget: number;
}

const GamificationContext = createContext<GamificationContextValue | null>(
  null,
);

// ── Helpers ──

function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

function getStorageKey(prefix: string, userId: string): string {
  return `sta_${prefix}:${userId}`;
}

function getComboMultiplier(count: number): number {
  if (count >= 5) return 2;
  if (count >= 3) return 1.5;
  if (count >= 2) return 1.25;
  return 1;
}

const COMBO_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

// ── localStorage loaders (sync, safe to call during render) ──

function loadDailyGoal(uid: string, today: string): DailyGoal {
  const fallback: DailyGoal = { target: 50, xpToday: 0, date: today };
  if (typeof window === "undefined") return fallback;
  try {
    const stored = localStorage.getItem(getStorageKey("daily_goal", uid));
    if (!stored) return fallback;
    const parsed = JSON.parse(stored) as DailyGoal;
    if (parsed.date === today) return parsed;
    const fresh = { target: parsed.target, xpToday: 0, date: today };
    localStorage.setItem(
      getStorageKey("daily_goal", uid),
      JSON.stringify(fresh),
    );
    return fresh;
  } catch {
    return fallback;
  }
}

function loadDailyQuests(uid: string, today: string): DailyQuests {
  const fallback: DailyQuests = {
    date: today,
    quests: generateDailyQuests(today),
  };
  if (typeof window === "undefined") return fallback;
  try {
    const stored = localStorage.getItem(getStorageKey("daily_quests", uid));
    if (!stored) {
      localStorage.setItem(
        getStorageKey("daily_quests", uid),
        JSON.stringify(fallback),
      );
      return fallback;
    }
    const parsed = JSON.parse(stored) as DailyQuests;
    if (parsed.date === today) return parsed;
    localStorage.setItem(
      getStorageKey("daily_quests", uid),
      JSON.stringify(fallback),
    );
    return fallback;
  } catch {
    return fallback;
  }
}

function loadCombo(uid: string): ComboState {
  const fallback: ComboState = {
    count: 0,
    multiplier: 1,
    lastCompletionTime: 0,
  };
  if (typeof window === "undefined") return fallback;
  try {
    const stored = localStorage.getItem(getStorageKey("combo", uid));
    if (!stored) return fallback;
    const parsed = JSON.parse(stored) as ComboState;
    if (Date.now() - parsed.lastCompletionTime > COMBO_TIMEOUT_MS)
      return fallback;
    return parsed;
  } catch {
    return fallback;
  }
}

// ── Provider ──

export function GamificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, streak } = useLearningProgress();
  const today = getTodayString();

  // Lazy initial state from localStorage
  const [dailyGoal, setDailyGoal] = useState<DailyGoal>(() =>
    loadDailyGoal(userId, today),
  );
  const [dailyQuests, setDailyQuests] = useState<DailyQuests>(() =>
    loadDailyQuests(userId, today),
  );
  const [combo, setCombo] = useState<ComboState>(() => loadCombo(userId));

  // Celebration
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] =
    useState<CelebrationData | null>(null);

  // Re-initialize when userId changes (React docs: "storing information from previous renders")
  const [prevUserId, setPrevUserId] = useState(userId);
  if (prevUserId !== userId) {
    setPrevUserId(userId);
    setDailyGoal(loadDailyGoal(userId, today));
    setDailyQuests(loadDailyQuests(userId, today));
    setCombo(loadCombo(userId));
  }

  // Persist helpers
  const persistDailyGoal = useCallback(
    (goal: DailyGoal) => {
      setDailyGoal(goal);
      localStorage.setItem(
        getStorageKey("daily_goal", userId),
        JSON.stringify(goal),
      );
    },
    [userId],
  );

  const persistDailyQuests = useCallback(
    (quests: DailyQuests) => {
      setDailyQuests(quests);
      localStorage.setItem(
        getStorageKey("daily_quests", userId),
        JSON.stringify(quests),
      );
    },
    [userId],
  );

  const persistCombo = useCallback(
    (c: ComboState) => {
      setCombo(c);
      localStorage.setItem(getStorageKey("combo", userId), JSON.stringify(c));
    },
    [userId],
  );

  // Actions
  const setDailyGoalTarget = useCallback(
    (target: number) => {
      const updated = { ...dailyGoal, target, date: today };
      persistDailyGoal(updated);
    },
    [dailyGoal, today, persistDailyGoal],
  );

  const addDailyXP = useCallback(
    (amount: number) => {
      const updated = {
        ...dailyGoal,
        xpToday: dailyGoal.xpToday + amount,
        date: today,
      };
      persistDailyGoal(updated);
    },
    [dailyGoal, today, persistDailyGoal],
  );

  const completeQuestProgress = useCallback(
    (type: Quest["type"], amount: number = 1) => {
      const updatedQuests = dailyQuests.quests.map((q) => {
        if (q.type === type && !q.completed) {
          const newProgress = Math.min(q.progress + amount, q.target);
          return {
            ...q,
            progress: newProgress,
            completed: newProgress >= q.target,
          };
        }
        return q;
      });
      persistDailyQuests({ date: today, quests: updatedQuests });
    },
    [dailyQuests, today, persistDailyQuests],
  );

  const recordCombo = useCallback((): number => {
    const now = Date.now();
    let newCount: number;

    if (
      combo.lastCompletionTime === 0 ||
      now - combo.lastCompletionTime > COMBO_TIMEOUT_MS
    ) {
      newCount = 1;
    } else {
      newCount = combo.count + 1;
    }

    const multiplier = getComboMultiplier(newCount);
    persistCombo({ count: newCount, multiplier, lastCompletionTime: now });
    return multiplier;
  }, [combo, persistCombo]);

  // Streak danger detection
  const streakInDanger = useMemo(() => {
    if (streak.currentStreak === 0) return false;
    const lastActivity = streak.lastActivityDate;
    if (!lastActivity) return false;
    return lastActivity !== today;
  }, [streak, today]);

  const triggerCelebration = useCallback((data: CelebrationData) => {
    setCelebrationData(data);
    setShowCelebration(true);
  }, []);

  const dismissCelebration = useCallback(() => {
    setShowCelebration(false);
    setCelebrationData(null);
  }, []);

  const ctx = useMemo<GamificationContextValue>(
    () => ({
      dailyGoal,
      setDailyGoalTarget,
      addDailyXP,
      dailyQuests: dailyQuests.quests,
      completeQuestProgress,
      combo,
      recordCombo,
      streakInDanger,
      showCelebration,
      celebrationData,
      triggerCelebration,
      dismissCelebration,
    }),
    [
      dailyGoal,
      setDailyGoalTarget,
      addDailyXP,
      dailyQuests.quests,
      completeQuestProgress,
      combo,
      recordCombo,
      streakInDanger,
      showCelebration,
      celebrationData,
      triggerCelebration,
      dismissCelebration,
    ],
  );

  return (
    <GamificationContext.Provider value={ctx}>
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification(): GamificationContextValue {
  const ctx = useContext(GamificationContext);
  if (!ctx) {
    throw new Error("useGamification must be used within GamificationProvider");
  }
  return ctx;
}
