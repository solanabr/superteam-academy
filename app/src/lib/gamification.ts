export type Achievement = {
  id: string;
  title: string;
  description: string;
  condition: (state: ProgressState) => boolean;
};

export type ProgressState = {
  completedLessons: number;
  streakDays: number;
  totalXp: number;
  achievements: string[];
  lastActiveDay?: string;
};

export const LEVEL_THRESHOLDS = [0, 100, 250, 500, 900, 1400, 2000, 2800, 3800];

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-lesson",
    title: "First Lesson",
    description: "Complete your first lesson",
    condition: (s) => s.completedLessons >= 1,
  },
  {
    id: "streak-3",
    title: "3-Day Streak",
    description: "Stay active for 3 days",
    condition: (s) => s.streakDays >= 3,
  },
  {
    id: "xp-1000",
    title: "XP 1000",
    description: "Reach 1000 XP",
    condition: (s) => s.totalXp >= 1000,
  },
];

export function xpForLesson(minutes: number) {
  return Math.max(25, minutes * 8);
}

export function levelFromXp(xp: number) {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i += 1) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  return level;
}

export function updateStreak(state: ProgressState, todayISO: string): ProgressState {
  const next = { ...state };
  if (!state.lastActiveDay) {
    next.streakDays = 1;
  } else {
    const prev = new Date(state.lastActiveDay);
    const current = new Date(todayISO);
    const diff = Math.floor((current.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    next.streakDays = diff === 1 ? state.streakDays + 1 : diff === 0 ? state.streakDays : 1;
  }
  next.lastActiveDay = todayISO;
  return next;
}

export function unlockAchievements(state: ProgressState) {
  const unlocked = ACHIEVEMENTS.filter((a) => a.condition(state)).map((a) => a.id);
  return { ...state, achievements: Array.from(new Set([...state.achievements, ...unlocked])) };
}

export const defaultProgress: ProgressState = {
  completedLessons: 2,
  streakDays: 1,
  totalXp: 250,
  achievements: [],
};
