import { create } from "zustand";
import { persist } from "zustand/middleware";
import logger from "@/lib/logger";
import { useNotificationStore } from "@/stores/notification-store";

interface ProgressState {
  completedLessons: Record<string, Set<number>>; // courseId -> set of lessonIndices
  xp: number;
  streakDays: number;
  lastActivityDate: string | null;
  activityDates: string[]; // Unique ISO date strings (YYYY-MM-DD) when any activity occurred
  streakMilestonesReached: number[]; // milestones achieved (7, 30, 100)
  streakFreezeCount: number;     // How many freezes the user has
  streakFreezeActive: boolean;   // Whether a freeze was used today
  streakFreezeUsedDates: string[]; // Dates when freezes were used (ISO date strings)

  markLessonComplete: (courseId: string, lessonIndex: number, xpEarned: number) => void;
  revertLessonComplete: (courseId: string, lessonIndex: number, xpEarned: number) => void;
  isLessonComplete: (courseId: string, lessonIndex: number) => boolean;
  getCourseProgress: (courseId: string, totalLessons: number) => number;
  recordActivity: () => void;
  setXp: (xp: number) => void;
  addBonusXp: (amount: number, reason: string) => void;
  useStreakFreeze: () => boolean;
  addStreakFreeze: (count?: number) => void;
  /**
   * Optional callback invoked when a streak milestone is newly reached.
   * Set by useAchievementTrigger to fire achievement checks without
   * introducing a circular dependency between the store and the service.
   * Not persisted.
   */
  onStreakMilestone?: (streakDays: number) => void;
  setOnStreakMilestone: (cb: ((streakDays: number) => void) | undefined) => void;
}

// Custom storage serializer for Set<number>
const storage = {
  getItem: (name: string) => {
    if (typeof window === 'undefined') return null;
    try {
      const str = localStorage.getItem(name);
      if (!str) return null;
      const parsed = JSON.parse(str);
      // Convert arrays back to Sets
      if (parsed?.state?.completedLessons) {
        const converted: Record<string, Set<number>> = {};
        for (const [key, value] of Object.entries(parsed.state.completedLessons)) {
          converted[key] = new Set(value as number[]);
        }
        parsed.state.completedLessons = converted;
      }
      return parsed;
    } catch {
      logger.error("[progress-store] Failed to parse stored state, resetting");
      localStorage.removeItem(name);
      return null;
    }
  },
  setItem: (name: string, value: unknown) => {
    if (typeof window === 'undefined') return;
    const toStore = JSON.parse(JSON.stringify(value, (_, v) =>
      v instanceof Set ? [...v] : v
    ));
    try {
      localStorage.setItem(name, JSON.stringify(toStore));
    } catch {
      // QuotaExceededError — storage full, silently skip persistence
    }
  },
  removeItem: (name: string) => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(name);
  },
};

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      completedLessons: {},
      xp: 0,
      streakDays: 0,
      lastActivityDate: null,
      activityDates: [],
      streakMilestonesReached: [],
      streakFreezeCount: 0,
      streakFreezeActive: false,
      streakFreezeUsedDates: [],
      onStreakMilestone: undefined,
      setOnStreakMilestone: (cb) => set({ onStreakMilestone: cb }),

      markLessonComplete: (courseId, lessonIndex, xpEarned) => {
        set((state) => {
          const courseSet = new Set(state.completedLessons[courseId] ?? []);
          courseSet.add(lessonIndex);
          return {
            completedLessons: { ...state.completedLessons, [courseId]: courseSet },
            xp: state.xp + xpEarned,
          };
        });
        get().recordActivity();
      },

      revertLessonComplete: (courseId, lessonIndex, xpEarned) => {
        set((state) => {
          const courseSet = new Set(state.completedLessons[courseId] ?? []);
          courseSet.delete(lessonIndex);
          return {
            completedLessons: { ...state.completedLessons, [courseId]: courseSet },
            xp: Math.max(0, state.xp - xpEarned),
          };
        });
      },

      isLessonComplete: (courseId, lessonIndex) => {
        return get().completedLessons[courseId]?.has(lessonIndex) ?? false;
      },

      getCourseProgress: (courseId, totalLessons) => {
        const completed = get().completedLessons[courseId]?.size ?? 0;
        return totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;
      },

      recordActivity: () => {
        const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local TZ
        const newlyReached: number[] = [];
        let freezeAwards: number[] = [];
        set((state) => {
          const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("en-CA");
          const isNewDay = state.lastActivityDate !== today;

          // Determine if a freeze should be auto-applied
          const missedExactlyOneDay =
            state.lastActivityDate !== null &&
            state.lastActivityDate !== today &&
            state.lastActivityDate !== yesterday;

          // Check if the gap is exactly 1 day (missed yesterday, active day before yesterday)
          let usedFreeze = false;
          let newFreezeCount = state.streakFreezeCount;
          const newFreezeUsedDates = [...state.streakFreezeUsedDates];
          let freezeActive = state.streakFreezeActive;

          if (missedExactlyOneDay && state.streakFreezeCount > 0) {
            // Verify gap is exactly 1 day (lastActivity was 2 days ago)
            const lastDate = new Date(state.lastActivityDate + "T00:00:00");
            const todayDate = new Date(today + "T00:00:00");
            const diffDays = Math.round((todayDate.getTime() - lastDate.getTime()) / 86400000);
            if (diffDays === 2) {
              usedFreeze = true;
              newFreezeCount = state.streakFreezeCount - 1;
              newFreezeUsedDates.push(yesterday);
              freezeActive = true;
            }
          } else if (isNewDay) {
            // Reset freeze-active flag when they log in normally on a new day
            freezeActive = false;
          }

          // Compute new streak
          const newStreak = usedFreeze
            ? state.streakDays + 1 // freeze used: streak kept + today's count
            : state.lastActivityDate === yesterday
              ? state.streakDays + 1
              : state.lastActivityDate === today
                ? state.streakDays
                : 1;

          // Daily bonuses: 25 XP for first activity of the day, +10 XP for continuing a streak
          const dailyBonus = isNewDay ? 25 : 0;
          const streakBonus = (isNewDay && (state.lastActivityDate === yesterday || usedFreeze)) ? 10 : 0;

          // Track streak milestones (7, 30, 100 days per bounty spec)
          const milestones = [...state.streakMilestonesReached];
          for (const m of [7, 30, 100]) {
            if (newStreak >= m && !milestones.includes(m)) {
              milestones.push(m);
              newlyReached.push(m);
              // Award freezes at milestones
              if (m === 7) freezeAwards.push(1);
              else if (m === 30) freezeAwards.push(2);
              else if (m === 100) freezeAwards.push(3);
            }
          }

          const totalFreezeAward = freezeAwards.reduce((a, b) => a + b, 0);

          const newActivityDates =
            isNewDay && !state.activityDates.includes(today)
              ? [...state.activityDates, today]
              : state.activityDates;

          return {
            lastActivityDate: today,
            activityDates: newActivityDates,
            streakDays: newStreak,
            streakMilestonesReached: milestones,
            xp: state.xp + dailyBonus + streakBonus,
            streakFreezeCount: newFreezeCount + totalFreezeAward,
            streakFreezeActive: freezeActive,
            streakFreezeUsedDates: newFreezeUsedDates,
          };
        });

        // Reset freezeAwards reference for closure capture
        const capturedFreezeAwards = freezeAwards;
        freezeAwards = [];

        // Fire notifications for newly reached milestones
        const { addNotification } = useNotificationStore.getState();
        if (newlyReached.length > 0) {
          for (const m of newlyReached) {
            addNotification({
              type: "streak_milestone",
              title: "Streak Milestone!",
              message: `You've maintained a ${m}-day learning streak. Keep it up!`,
            });
          }
          // Notify achievement trigger (registered via setOnStreakMilestone)
          const onStreakMilestone = get().onStreakMilestone;
          if (onStreakMilestone) {
            const currentStreak = get().streakDays;
            for (let i = 0; i < newlyReached.length; i++) {
              onStreakMilestone(currentStreak);
            }
          }
        }
        if (capturedFreezeAwards.length > 0) {
          const total = capturedFreezeAwards.reduce((a, b) => a + b, 0);
          addNotification({
            type: "xp_earned",
            title: "Streak Freeze Earned!",
            message: `You earned ${total} streak freeze${total > 1 ? "s" : ""} for reaching a milestone.`,
          });
        }
      },

      useStreakFreeze: () => {
        const state = get();
        if (state.streakFreezeCount <= 0) return false;
        const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("en-CA");
        set((s) => ({
          streakFreezeCount: s.streakFreezeCount - 1,
          streakFreezeActive: true,
          streakFreezeUsedDates: [...s.streakFreezeUsedDates, yesterday],
        }));
        return true;
      },

      addStreakFreeze: (count = 1) => {
        set((s) => ({ streakFreezeCount: s.streakFreezeCount + count }));
      },

      setXp: (xp) => set({ xp }),

      addBonusXp: (amount, reason) => {
        logger.info(`[progress-store] addBonusXp: +${amount} XP (${reason})`);
        set((state) => ({ xp: state.xp + amount }));
      },
    }),
    {
      name: "superteam-progress",
      storage,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      partialize: ({ onStreakMilestone, setOnStreakMilestone, ...rest }) => rest,
    }
  )
);
