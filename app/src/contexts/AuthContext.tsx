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
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";
import { LocalUserService } from "@/services/local/userService";

// ===== Types =====

export type AuthProviderType = "phantom" | "solflare" | "google" | "github";

export interface UserProfile {
  id: string;
  displayName: string;
  avatar: string;
  email?: string;
  image?: string;
  walletAddress?: string;
  authProvider: AuthProviderType;
  xp: number;
  level: number;
  streak: number;
  streakDates: string[];
  enrolledCourses: string[];
  completedLessons: string[];
  completedCourses: string[];
  achievements: string[];
  nftCertificates: {
    courseId: string;
    mintAddress: string;
    mintedAt: string;
  }[];
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  walletConnected: boolean;
  loginWithWallet: () => void;
  loginWithSocial: (provider: "google" | "github") => void;
  logout: () => void;
  addXP: (amount: number) => void;
  enrollCourse: (courseId: string) => void;
  completeLesson: (lessonId: string) => void;
  completeCourse: (courseId: string) => void;
  addAchievement: (achievementId: string) => void;
  recordStreak: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ===== Helpers =====

function calcLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100));
}

/** XP required to reach a given level */
export function xpForLevel(level: number): number {
  return level * level * 100;
}

/** Progress percentage toward the next level (0-100) */
export function xpProgressPercent(xp: number): number {
  const currentLevel = calcLevel(xp);
  const currentLevelXP = xpForLevel(currentLevel);
  const nextLevelXP = xpForLevel(currentLevel + 1);
  const bandSize = nextLevelXP - currentLevelXP;
  if (bandSize <= 0) return 100;
  return ((xp - currentLevelXP) / bandSize) * 100;
}

/** XP remaining until next level */
export function xpToNextLevel(xp: number): { current: number; needed: number } {
  const currentLevel = calcLevel(xp);
  const currentLevelXP = xpForLevel(currentLevel);
  const nextLevelXP = xpForLevel(currentLevel + 1);
  return {
    current: xp - currentLevelXP,
    needed: nextLevelXP - currentLevelXP,
  };
}

function createDefaultProfile(
  overrides: Partial<UserProfile> & Pick<UserProfile, "id" | "displayName" | "avatar" | "authProvider">
): UserProfile {
  const today = new Date().toISOString().split("T")[0];
  return {
    xp: 0,
    level: 0,
    streak: 1,
    streakDates: [today],
    enrolledCourses: [],
    completedLessons: [],
    completedCourses: [],
    achievements: ["first_login"],
    nftCertificates: [],
    ...overrides,
  };
}

function detectWalletProvider(walletName: string | null): "phantom" | "solflare" {
  if (!walletName) return "phantom";
  const lower = walletName.toLowerCase();
  if (lower.includes("solflare")) return "solflare";
  return "phantom";
}

// ===== Provider Component =====

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Solana Wallet state
  const {
    publicKey,
    connected: walletConnected,
    wallet,
    disconnect: walletDisconnect,
    select,
    wallets,
  } = useWallet();

  // NextAuth session state
  const { data: session, status: sessionStatus } = useSession();

  // In NextAuth v5 beta, status can be "loading" | "authenticated" | "unauthenticated"
  // but TypeScript types may not include "loading" — we handle all cases safely
  const isLoading = (sessionStatus as string) === "loading";

  // ===== Sync Solana Wallet Connection → UserProfile =====
  useEffect(() => {
    if (walletConnected && publicKey && !user) {
      const provider = detectWalletProvider(wallet?.adapter.name ?? null);
      const address = publicKey.toBase58();
      const existingProfile = LocalUserService.getUserProfile(address);

      if (existingProfile) {
        setUser(existingProfile);
      } else {
        const newProfile = createDefaultProfile({
          id: address,
          displayName: `${provider === "solflare" ? "Solflare" : "Phantom"} Builder`,
          avatar: provider[0].toUpperCase(),
          walletAddress: address,
          authProvider: provider,
        });
        LocalUserService.saveUserProfile(newProfile);
        setUser(newProfile);
      }
    }

    // If wallet disconnects while wallet-auth user is active, logout
    if (!walletConnected && user?.authProvider && ["phantom", "solflare"].includes(user.authProvider)) {
      setUser(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletConnected, publicKey]);

  // ===== Sync NextAuth Session → UserProfile =====
  useEffect(() => {
    if (isLoading) return;

    if (session?.user && !user) {
      const provider = ((session.user as Record<string, unknown>).provider as string) || "google";
      const authProvider: AuthProviderType =
        provider === "github" ? "github" : "google";

      const userId = (session.user as Record<string, unknown>).id as string || crypto.randomUUID();
      const existingProfile = LocalUserService.getUserProfile(userId);

      if (existingProfile) {
        setUser(existingProfile);
      } else {
        const newProfile = createDefaultProfile({
          id: userId,
          displayName: session.user.name || `${authProvider === "github" ? "GitHub" : "Google"} Builder`,
          avatar: session.user.name?.[0]?.toUpperCase() || authProvider[0].toUpperCase(),
          email: session.user.email || undefined,
          image: session.user.image || undefined,
          authProvider,
        });
        LocalUserService.saveUserProfile(newProfile);
        setUser(newProfile);
      }
    }

    // If session ends while social-auth user is active, logout
    if (!session && user?.authProvider && ["google", "github"].includes(user.authProvider) && hasInitialized) {
      setUser(null);
    }

    if (!hasInitialized && !isLoading) {
      setHasInitialized(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, sessionStatus]);

  // ===== Login Methods =====

  const loginWithWallet = useCallback(() => {
    // This triggers the Solana wallet modal/popup
    // The wallet adapter handles the connection flow
    // After connecting, the useEffect above will create the user profile
    // If no wallet is connected, we try to open the first available wallet
    if (!walletConnected && wallets.length > 0) {
      // Select the first wallet (usually Phantom) to trigger connect
      select(wallets[0].adapter.name);
    }
  }, [walletConnected, wallets, select]);

  const loginWithSocial = useCallback(
    async (provider: "google" | "github") => {
      // NextAuth signIn is imported dynamically to avoid server issues
      const { signIn } = await import("next-auth/react");
      // OAuth providers need redirect to their login page
      await signIn(provider, { callbackUrl: window.location.href });
    },
    []
  );

  const logout = useCallback(async () => {
    const currentProvider = user?.authProvider;
    setUser(null);

    // Disconnect wallet if wallet-based auth
    if (currentProvider && ["phantom", "solflare"].includes(currentProvider)) {
      try {
        await walletDisconnect();
      } catch {
        // Wallet might already be disconnected
      }
    }

    // Sign out from NextAuth if social-based auth
    if (currentProvider && ["google", "github"].includes(currentProvider)) {
      try {
        await nextAuthSignOut({ redirect: false });
      } catch {
        // Session might already be expired
      }
    }
  }, [user, walletDisconnect]);

  // ===== Game State Methods (unchanged) =====

  const addXP = useCallback((amount: number) => {
    setUser((prev) => {
      if (!prev) return prev;
      const newXP = prev.xp + amount;
      const updatedUser = { ...prev, xp: newXP, level: calcLevel(newXP) };
      LocalUserService.saveUserProfile(updatedUser);
      return updatedUser;
    });
  }, []);

  const enrollCourse = useCallback((courseId: string) => {
    setUser((prev) => {
      if (!prev || prev.enrolledCourses.includes(courseId)) return prev;
      const updatedUser = { ...prev, enrolledCourses: [...prev.enrolledCourses, courseId] };
      LocalUserService.saveUserProfile(updatedUser);
      return updatedUser;
    });
  }, []);

  const completeLesson = useCallback((lessonId: string) => {
    setUser((prev) => {
      if (!prev || prev.completedLessons.includes(lessonId)) return prev;
      const updatedUser = {
        ...prev,
        completedLessons: [...prev.completedLessons, lessonId],
      };
      LocalUserService.saveUserProfile(updatedUser);
      return updatedUser;
    });
  }, []);

  const completeCourse = useCallback((courseId: string) => {
    setUser((prev) => {
      if (!prev || prev.completedCourses.includes(courseId)) return prev;
      const chars =
        "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789";
      let mintAddress = "";
      for (let i = 0; i < 44; i++)
        mintAddress += chars[Math.floor(Math.random() * chars.length)];
      const updatedUser = {
        ...prev,
        completedCourses: [...prev.completedCourses, courseId],
        nftCertificates: [
          ...prev.nftCertificates,
          { courseId, mintAddress, mintedAt: new Date().toISOString() },
        ],
      };
      LocalUserService.saveUserProfile(updatedUser);
      return updatedUser;
    });
  }, []);

  const addAchievement = useCallback((achievementId: string) => {
    setUser((prev) => {
      if (!prev || prev.achievements.includes(achievementId)) return prev;
      const updatedUser = {
        ...prev,
        achievements: [...prev.achievements, achievementId],
      };
      LocalUserService.saveUserProfile(updatedUser);
      return updatedUser;
    });
  }, []);

  const recordStreak = useCallback(() => {
    setUser((prev) => {
      if (!prev) return prev;
      const today = new Date().toISOString().split("T")[0];
      if (prev.streakDates.includes(today)) return prev;
      const yesterday = new Date(Date.now() - 86400000)
        .toISOString()
        .split("T")[0];
      const isConsecutive = prev.streakDates.includes(yesterday);
      const updatedUser = {
        ...prev,
        streakDates: [...prev.streakDates, today],
        streak: isConsecutive ? prev.streak + 1 : 1,
      };
      LocalUserService.saveUserProfile(updatedUser);
      return updatedUser;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        walletConnected,
        loginWithWallet,
        loginWithSocial,
        logout,
        addXP,
        enrollCourse,
        completeLesson,
        completeCourse,
        addAchievement,
        recordStreak,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be within AuthProvider");
  return ctx;
}
