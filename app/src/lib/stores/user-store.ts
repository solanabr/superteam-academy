import { create } from 'zustand';
import type { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import type { Credential } from '@/lib/solana/credentials';
import { getCredentialsByOwner } from '@/lib/solana/credentials';
import { fetchUserEnrollments } from '@/lib/solana/accounts';
import { getConnection } from '@/lib/solana/program';
import { XP_MINT, TOKEN_2022_PROGRAM_ID } from '@/lib/solana/constants';
import { calculateLevel, getLevelTitle } from '@/lib/solana/xp';
import { countCompletedLessons, getProgressPercentage } from '@/lib/solana/bitmap';

interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
}

interface EnrollmentData {
  courseId: string;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
  isFinalized: boolean;
}

interface UserState {
  wallet: PublicKey | null;
  xpBalance: number;
  level: number;
  levelTitle: string;
  streak: StreakState;
  enrollments: Map<string, EnrollmentData>;
  credentials: Credential[];
  achievements: string[];
  isLoading: boolean;
  error: string | null;

  setWallet: (wallet: PublicKey | null) => void;
  fetchUserData: (wallet: PublicKey) => Promise<void>;
  updateXp: (newXp: number) => void;
  updateStreak: () => void;
  addEnrollment: (enrollment: EnrollmentData) => void;
  updateEnrollmentProgress: (courseId: string, completedLessons: number, totalLessons: number) => void;
  addCredential: (credential: Credential) => void;
  addAchievement: (achievementId: string) => void;
  reset: () => void;
}

export type { StreakState, EnrollmentData, UserState };

const STREAK_STORAGE_KEY = 'superteam-streak';

const initialStreak: StreakState = {
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: null,
};

const initialState = {
  wallet: null as PublicKey | null,
  xpBalance: 0,
  level: 0,
  levelTitle: 'Newcomer',
  streak: initialStreak,
  enrollments: new Map<string, EnrollmentData>(),
  credentials: [] as Credential[],
  achievements: [] as string[],
  isLoading: false,
  error: null as string | null,
};

function todayISO(): string {
  return new Date().toISOString().split('T')[0]!;
}

function yesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0]!;
}

function hasLocalStorage(): boolean {
  try {
    return typeof globalThis.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function loadPersistedStreak(): StreakState {
  if (!hasLocalStorage()) return initialStreak;
  try {
    const raw = localStorage.getItem(STREAK_STORAGE_KEY);
    if (!raw) return initialStreak;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed.currentStreak === 'number' &&
      typeof parsed.longestStreak === 'number' &&
      (parsed.lastActiveDate === null || typeof parsed.lastActiveDate === 'string')
    ) {
      return parsed as StreakState;
    }
    return initialStreak;
  } catch {
    return initialStreak;
  }
}

function persistStreak(streak: StreakState): void {
  if (!hasLocalStorage()) return;
  try {
    localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(streak));
  } catch {
    // localStorage quota exceeded or unavailable — non-critical
  }
}

export const useUserStore = create<UserState>((set, get) => ({
  ...initialState,
  streak: loadPersistedStreak(),

  setWallet: (wallet) => {
    if (wallet === null) {
      set({ wallet: null });
      return;
    }
    set({ wallet });
  },

  fetchUserData: async (wallet) => {
    set({ isLoading: true, error: null });

    try {
      const connection = getConnection();

      // Fetch XP token balance from Token-2022 ATA
      let xpBalance = 0;
      try {
        const ata = getAssociatedTokenAddressSync(
          XP_MINT,
          wallet,
          false,
          TOKEN_2022_PROGRAM_ID,
        );
        const tokenAccount = await connection.getTokenAccountBalance(ata);
        xpBalance = Number(tokenAccount.value.amount);
      } catch {
        // ATA doesn't exist yet — learner has zero XP, not an error
      }

      const level = calculateLevel(xpBalance);
      const levelTitle = getLevelTitle(level);

      // Fetch credentials via Helius DAS
      let credentials: Credential[] = [];
      try {
        credentials = await getCredentialsByOwner(wallet.toBase58());
      } catch {
        // DAS API failure is non-fatal — credentials section will be empty
      }

      // Fetch on-chain enrollments
      const enrollmentMap = new Map<string, EnrollmentData>();
      try {
        const rawEnrollments = await fetchUserEnrollments(connection, wallet);
        for (const enrollment of rawEnrollments) {
          const completed = countCompletedLessons(enrollment.lessonFlags);
          const total = enrollment.courseId ? enrollment.courseId.length : 0;
          const progressPercent = getProgressPercentage(enrollment.lessonFlags, total);
          enrollmentMap.set(enrollment.courseId, {
            courseId: enrollment.courseId,
            completedLessons: completed,
            totalLessons: total,
            progressPercent,
            isFinalized: enrollment.completedAt !== null,
          });
        }
      } catch {
        // Enrollment fetch failure is non-fatal — enrollments section will be empty
      }

      set({
        wallet,
        xpBalance,
        level,
        levelTitle,
        credentials,
        enrollments: enrollmentMap,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load user data';
      set({ isLoading: false, error: message });
    }
  },

  updateXp: (newXp) => {
    const level = calculateLevel(newXp);
    const levelTitle = getLevelTitle(level);
    set({ xpBalance: newXp, level, levelTitle });
  },

  updateStreak: () => {
    const { streak } = get();
    const today = todayISO();

    // Already active today — no-op
    if (streak.lastActiveDate === today) return;

    const yesterday = yesterdayISO();
    let newStreak: StreakState;

    if (streak.lastActiveDate === yesterday) {
      // Consecutive day
      const next = streak.currentStreak + 1;
      newStreak = {
        currentStreak: next,
        longestStreak: Math.max(streak.longestStreak, next),
        lastActiveDate: today,
      };
    } else {
      // First activity or gap — reset to 1
      newStreak = {
        currentStreak: 1,
        longestStreak: Math.max(streak.longestStreak, 1),
        lastActiveDate: today,
      };
    }

    persistStreak(newStreak);
    set({ streak: newStreak });
  },

  addEnrollment: (enrollment) => {
    set((state) => {
      const next = new Map(state.enrollments);
      next.set(enrollment.courseId, enrollment);
      return { enrollments: next };
    });
  },

  updateEnrollmentProgress: (courseId, completedLessons, totalLessons) => {
    set((state) => {
      const next = new Map(state.enrollments);
      const existing = next.get(courseId);
      if (!existing) return state;

      const progressPercent = totalLessons > 0
        ? (completedLessons / totalLessons) * 100
        : 0;

      next.set(courseId, {
        ...existing,
        completedLessons,
        totalLessons,
        progressPercent,
      });
      return { enrollments: next };
    });
  },

  addCredential: (credential) => {
    set((state) => ({
      credentials: [...state.credentials, credential],
    }));
  },

  addAchievement: (achievementId) => {
    set((state) => {
      if (state.achievements.includes(achievementId)) return state;
      return { achievements: [...state.achievements, achievementId] };
    });
  },

  reset: () => {
    set({ ...initialState, streak: initialStreak });
    persistStreak(initialStreak);
  },
}));
