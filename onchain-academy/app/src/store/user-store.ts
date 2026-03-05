import { create } from "zustand";
import { learningProgressService } from "@/services/learning-progress-service";
import type { StreakData, StreakDay } from "@/types/domain";

function generateEmptyCalendar(days: number): StreakDay[] {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000);
    return {
      date: date.toISOString().slice(0, 10),
      active: false,
      bonusApplied: false,
    };
  });
}

interface UserState {
  walletAddress: string | null;
  xp: number;
  level: number;
  streakDays: number;
  longestStreakDays: number;
  streakCalendar: StreakDay[];
  isLoading: boolean;
  setWalletAddress: (address: string | null) => void;
  fetchUserData: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  walletAddress: null,
  xp: 0,
  level: 1,
  streakDays: 0,
  longestStreakDays: 0,
  streakCalendar: generateEmptyCalendar(35),
  isLoading: false,

  setWalletAddress: (address) => {
    set({ walletAddress: address });
    if (address) {
      get().fetchUserData();
    } else {
      set({
        xp: 0,
        level: 1,
        streakDays: 0,
        longestStreakDays: 0,
        streakCalendar: generateEmptyCalendar(35),
      });
    }
  },

  fetchUserData: async () => {
    const { walletAddress } = get();
    if (!walletAddress) return;

    set({ isLoading: true });
    try {
      const xpData = await learningProgressService.getXpBalance(walletAddress);

      let streakData: StreakData = {
        currentDays: 0,
        longestDays: 0,
        freezesLeft: 0,
        calendar: [],
      };

      // Backend streak endpoint currently expects a backend user id, not wallet.
      // Keep XP on-chain fetch active and degrade streak gracefully when unavailable.
      try {
        streakData = await learningProgressService.getStreak(walletAddress);
      } catch {
        streakData = {
          currentDays: 0,
          longestDays: 0,
          freezesLeft: 0,
          calendar: [],
        };
      }

      set({
        xp: xpData.xp,
        level: Math.max(1, xpData.level),
        streakDays: streakData.currentDays,
        longestStreakDays: streakData.longestDays,
        streakCalendar:
          streakData.calendar.length > 0
            ? streakData.calendar
            : generateEmptyCalendar(35),
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      set({ isLoading: false });
    }
  },
}));
