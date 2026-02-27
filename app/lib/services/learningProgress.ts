/**
 * Learning progress service interface.
 * Swap this implementation for on-chain / backend when integrating with
 * github.com/solanabr/superteam-academy (Anchor program, Helius DAS, etc.).
 *
 * On-chain mapping:
 * - XP = Token-2022 soulbound (NonTransferable), balance = XP
 * - Level = floor(sqrt(xp / 100))
 * - Credentials = Metaplex Core NFTs (PermanentFreezeDelegate), one per track
 * - Enrollments = PDAs per learner, lesson progress = 256-bit bitmap
 * - Leaderboard = off-chain index of XP token balances (Helius DAS or custom)
 * - Streaks = frontend-only (this stub)
 * - Achievements = stub; on-chain = AchievementReceipt soulbound Core NFTs
 */

import type {
  LeaderboardEntry,
  LeaderboardTimeframe,
  CredentialSummary,
  AchievementSummary,
  StreakData,
  LearningProgressState,
} from './types';

/** Internal streak shape used by this stub (differs from StreakData in types). */
type LocalStreak = LearningProgressState['streak'];

/** Return type for getProgressForCourse in this stub (subset of CourseProgress). */
interface CourseProgressStub {
  courseId: string;
  completedLessonIds: string[];
  enrolledAt: number;
}

const STORAGE_KEY = 'superearn_learning_progress';
const LEVEL_FORMULA = (xp: number) => Math.floor(Math.sqrt(xp / 100));

export function levelFromXp(xp: number): number {
  return LEVEL_FORMULA(xp);
}

export interface ILearningProgressService {
  getProgress(wallet: string): Promise<LearningProgressState>;
  getProgressForCourse(wallet: string, courseId: string): Promise<CourseProgressStub | null>;
  completeLesson(wallet: string, courseId: string, lessonId: string): Promise<void>;
  getXp(wallet: string): Promise<number>;
  getStreak(wallet: string): Promise<StreakData>;
  getLeaderboard(timeframe: LeaderboardTimeframe): Promise<LeaderboardEntry[]>;
  getCredentials(wallet: string): Promise<CredentialSummary[]>;
  getAchievements(wallet: string): Promise<AchievementSummary[]>;
  enroll(wallet: string, courseId: string): Promise<void>;
  isEnrolled(wallet: string, courseId: string): Promise<boolean>;
}

function loadState(wallet: string): LearningProgressState {
  if (typeof window === 'undefined') {
    return getDefaultState();
  }
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${wallet}`);
    if (!raw) return getDefaultState();
    const parsed = JSON.parse(raw) as LearningProgressState;
    return {
      completedLessons: parsed.completedLessons ?? {},
      enrollments: parsed.enrollments ?? [],
      xp: typeof parsed.xp === 'number' ? parsed.xp : 0,
      streak: parsed.streak ?? { current: 0, longest: 0, lastActivityDate: null, history: [] },
      credentials: Array.isArray(parsed.credentials) ? parsed.credentials : [],
      achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
    };
  } catch {
    return getDefaultState();
  }
}

function saveState(wallet: string, state: LearningProgressState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_KEY}_${wallet}`, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function getDefaultState(): LearningProgressState {
  return {
    completedLessons: {},
    enrollments: [],
    xp: 0,
    streak: { current: 0, longest: 0, lastActivityDate: null, history: [] },
    credentials: [],
    achievements: [],
  };
}

function updateStreak(streak: LocalStreak): LocalStreak {
  const today = new Date().toISOString().slice(0, 10);
  let { current, longest, lastActivityDate, history } = streak;
  if (lastActivityDate === today) return streak;
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  if (lastActivityDate === yesterday) {
    current += 1;
  } else {
    current = 1;
  }
  if (current > longest) longest = current;
  const newHistory = [...history.filter((h) => h.date !== today), { date: today, count: 1 }].sort(
    (a, b) => b.date.localeCompare(a.date)
  ).slice(0, 30);
  return { current, longest, lastActivityDate: today, history: newHistory };
}

/** Stub leaderboard data (replace with indexer/Helius DAS in production) */
const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, wallet: 'mock1', displayName: 'Builder_42', xp: 650, level: 7 },
  { rank: 2, wallet: 'mock2', displayName: 'SolanaDev', xp: 520, level: 6 },
  { rank: 3, wallet: 'mock3', displayName: 'AnchorFan', xp: 400, level: 5 },
  { rank: 4, wallet: 'mock4', displayName: 'Web3BR', xp: 280, level: 4 },
  { rank: 5, wallet: 'mock5', displayName: 'RustLearner', xp: 150, level: 2 },
];

const XP_PER_LESSON = 25;

export const learningProgressService: ILearningProgressService = {
  async getProgress(wallet: string): Promise<LearningProgressState> {
    return loadState(wallet);
  },

  async getProgressForCourse(wallet: string, courseId: string): Promise<CourseProgressStub | null> {
    const state = loadState(wallet);
    if (!state.enrollments.includes(courseId)) return null;
    return {
      courseId,
      completedLessonIds: state.completedLessons[courseId] ?? [],
      enrolledAt: Date.now(),
    };
  },

  async completeLesson(wallet: string, courseId: string, lessonId: string): Promise<void> {
    const state = loadState(wallet);
    const list = state.completedLessons[courseId] ?? [];
    if (list.includes(lessonId)) return;
    state.completedLessons[courseId] = [...list, lessonId];
    state.xp += XP_PER_LESSON;
    state.streak = updateStreak(state.streak);
    saveState(wallet, state);
  },

  async getXp(wallet: string): Promise<number> {
    return loadState(wallet).xp;
  },

  async getStreak(wallet: string): Promise<StreakData> {
    const s = loadState(wallet).streak;
    return {
      wallet,
      currentStreak: s.current,
      longestStreak: s.longest,
      lastActivityDate: s.lastActivityDate,
      history: s.history.map(({ date, count }) => ({ date, completed: count })),
    };
  },

  async getLeaderboard(timeframe: LeaderboardTimeframe): Promise<LeaderboardEntry[]> {
    // Stub: same list for all timeframes. Production: query indexer/API by timeframe.
    return Promise.resolve(MOCK_LEADERBOARD);
  },

  async getCredentials(wallet: string): Promise<CredentialSummary[]> {
    const state = loadState(wallet);
    return state.credentials;
  },

  async getAchievements(wallet: string): Promise<AchievementSummary[]> {
    const state = loadState(wallet);
    return state.achievements;
  },

  async enroll(wallet: string, courseId: string): Promise<void> {
    const state = loadState(wallet);
    if (state.enrollments.includes(courseId)) return;
    state.enrollments = [...state.enrollments, courseId];
    saveState(wallet, state);
  },

  async isEnrolled(wallet: string, courseId: string): Promise<boolean> {
    return loadState(wallet).enrollments.includes(courseId);
  },
};
