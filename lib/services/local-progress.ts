import type {
  Credential,
  LeaderboardEntry,
  LearningProgressService,
  Progress,
  StreakData
} from "@/lib/services/types";

type LocalUserState = {
  xp: number;
  streak: StreakData;
  progressByCourse: Record<string, Progress>;
};

const STORAGE_KEY = "superteam-academy-progress";

function getDefaultStreak(): StreakData {
  return {
    current: 0,
    longest: 0,
    lastActivityDate: new Date(0),
    history: []
  };
}

function getInitialState(): Record<string, LocalUserState> {
  if (typeof window === "undefined") {
    return {};
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as Record<string, LocalUserState>;
  } catch {
    return {};
  }
}

function persistState(state: Record<string, LocalUserState>): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getUserState(state: Record<string, LocalUserState>, userId: string): LocalUserState {
  if (!state[userId]) {
    state[userId] = {
      xp: 0,
      streak: getDefaultStreak(),
      progressByCourse: {}
    };
  }

  return state[userId];
}

export class LocalProgressService implements LearningProgressService {
  async getProgress(userId: string, courseId: string): Promise<Progress> {
    const state = getInitialState();
    const userState = getUserState(state, userId);
    const current = userState.progressByCourse[courseId];
    if (current) {
      return current;
    }

    const fallback: Progress = {
      courseId,
      completedLessons: [],
      totalLessons: 0,
      percentComplete: 0,
      xpEarned: 0,
      startedAt: new Date()
    };
    userState.progressByCourse[courseId] = fallback;
    persistState(state);
    return fallback;
  }

  async completeLesson(userId: string, courseId: string, lessonIndex: number): Promise<void> {
    const state = getInitialState();
    const userState = getUserState(state, userId);
    const progress = await this.getProgress(userId, courseId);

    if (!progress.completedLessons.includes(lessonIndex)) {
      progress.completedLessons = [...progress.completedLessons, lessonIndex].sort((a, b) => a - b);
      progress.percentComplete =
        progress.totalLessons > 0 ? Math.floor((progress.completedLessons.length / progress.totalLessons) * 100) : 0;
      progress.xpEarned += 25;
      userState.xp += 25;
    }

    userState.progressByCourse[courseId] = progress;
    persistState(state);
  }

  async getXP(userId: string): Promise<number> {
    const state = getInitialState();
    const userState = getUserState(state, userId);
    return userState.xp;
  }

  async getStreak(userId: string): Promise<StreakData> {
    const state = getInitialState();
    const userState = getUserState(state, userId);
    return userState.streak;
  }

  async getLeaderboard(_timeframe: "weekly" | "monthly" | "alltime"): Promise<LeaderboardEntry[]> {
    return [];
  }

  async getCredentials(_wallet: string): Promise<Credential[]> {
    return [];
  }
}
