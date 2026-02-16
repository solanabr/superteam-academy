import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserPreferences, GamificationProfile, StreakData } from '@/types';
import { MOCK_GAMIFICATION_PROFILE } from '@/services/mock-data';

interface UserState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Gamification
  profile: GamificationProfile | null;
  xp: number;
  level: number;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  updateXP: (amount: number) => void;
  setProfile: (profile: GamificationProfile) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  signOut: () => void;

  // Demo mode
  initDemoUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      profile: null,
      xp: 0,
      level: 0,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      updateXP: (amount) => {
        const newXP = get().xp + amount;
        const newLevel = Math.floor(Math.sqrt(newXP / 100));
        set({ xp: newXP, level: newLevel });

        // Update profile if exists
        const profile = get().profile;
        if (profile) {
          set({
            profile: { ...profile, xp: newXP, level: newLevel },
          });
        }
      },

      setProfile: (profile) =>
        set({
          profile,
          xp: profile.xp,
          level: profile.level,
        }),

      updatePreferences: (preferences) => {
        const user = get().user;
        if (user) {
          set({
            user: {
              ...user,
              preferences: { ...user.preferences, ...preferences },
            },
          });
        }
      },

      signOut: () =>
        set({
          user: null,
          isAuthenticated: false,
          profile: null,
          xp: 0,
          level: 0,
        }),

      initDemoUser: () => {
        const demoUser: User = {
          id: 'demo-user',
          username: 'quest_hero',
          displayName: 'Quest Hero',
          email: 'hero@solanaquest.dev',
          avatar: '',
          bio: 'A brave developer on the path to Solana mastery.',
          walletAddress: undefined,
          joinedAt: '2026-01-01',
          socialLinks: {},
          preferences: {
            language: 'en',
            theme: 'dark',
            notifications: true,
          },
          isPublic: true,
        };

        set({
          user: demoUser,
          isAuthenticated: true,
          profile: MOCK_GAMIFICATION_PROFILE,
          xp: MOCK_GAMIFICATION_PROFILE.xp,
          level: MOCK_GAMIFICATION_PROFILE.level,
        });
      },
    }),
    {
      name: 'solana-quest-user',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        profile: state.profile,
        xp: state.xp,
        level: state.level,
      }),
    }
  )
);
