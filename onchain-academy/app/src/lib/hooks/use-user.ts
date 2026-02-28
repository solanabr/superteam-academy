"use client";

import { useWallet, useConnection } from "@/lib/wallet/context";
import { useState, useEffect, useCallback, useRef } from "react";
import type {
  UserProfile,
  Credential,
  StreakData,
  Achievement,
} from "@/lib/services/types";
import {
  getCredentialsByOwner,
  getCredentialsFromEnrollments,
} from "@/lib/services/credentials";
import { getXPBalance } from "@/lib/services/xp";
import { calculateLevel } from "@/lib/constants";
import { learningService } from "@/lib/services/learning-progress";
import { achievements as achievementDefs, courses } from "@/lib/services/courses";
import { analytics } from "@/providers/analytics-provider";

const ACHIEVEMENT_STORAGE = "stacad:achievements:";
const REFERRAL_STORAGE = "stacad:referrals:";
const PROGRESS_STORAGE = "stacad:progress:";

const EMPTY_STREAK: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastActivityDate: "",
  freezesAvailable: 0,
  activityHistory: {},
};

const DEFAULT_PROFILE: UserProfile = {
  wallet: undefined,
  displayName: "Learner",
  xp: 0,
  level: 0,
  streak: EMPTY_STREAK,
  achievements: [],
  credentials: [],
  skills: { rust: 0, anchor: 0, frontend: 0, security: 0, defi: 0, mobile: 0 },
  joinedAt: new Date().toISOString(),
  isPublic: true,
};

function getUnlockTime(wallet: string, id: string): string | undefined {
  if (typeof window === "undefined") return undefined;
  const raw = localStorage.getItem(ACHIEVEMENT_STORAGE + wallet);
  if (!raw) return undefined;
  try {
    return (JSON.parse(raw) as Record<string, string>)[id];
  } catch (error) {
    console.error("[useUser] Failed to parse achievement data:", error);
    return undefined;
  }
}

function saveUnlock(wallet: string, id: string): string {
  if (typeof window === "undefined") return new Date().toISOString();
  const raw = localStorage.getItem(ACHIEVEMENT_STORAGE + wallet);
  const obj: Record<string, string> = raw ? JSON.parse(raw) : {};
  if (!obj[id]) obj[id] = new Date().toISOString();
  localStorage.setItem(ACHIEVEMENT_STORAGE + wallet, JSON.stringify(obj));
  return obj[id];
}

function getReferralCount(wallet: string): number {
  if (typeof window === "undefined") return 0;
  const raw = localStorage.getItem(REFERRAL_STORAGE + wallet);
  if (!raw) return 0;
  const parsed = parseInt(raw, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function hasSpeedRun(wallet: string): boolean {
  if (typeof window === "undefined") return false;
  const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(PROGRESS_STORAGE + wallet + ":")) continue;
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    try {
      const progress = JSON.parse(raw) as {
        startedAt?: string;
        completedAt?: string;
      };
      if (!progress.startedAt || !progress.completedAt) continue;
      const elapsed =
        new Date(progress.completedAt).getTime() -
        new Date(progress.startedAt).getTime();
      if (elapsed > 0 && elapsed < TWO_HOURS_MS) return true;
    } catch {
      continue;
    }
  }
  return false;
}

interface LearningStats {
  totalLessons: number;
  totalCourses: number;
  totalChallenges: number;
  tracksCompleted: Set<string>;
  completedCourseIds: Set<string>;
}

async function computeLearningStats(wallet: string): Promise<LearningStats> {
  const allProgress = await learningService.getAllProgress(wallet);
  let totalLessons = 0;
  let totalCourses = 0;
  let totalChallenges = 0;
  const tracksCompleted = new Set<string>();
  const completedCourseIds = new Set<string>();

  for (const p of allProgress) {
    totalLessons += p.completedLessons.length;
    if (p.percentage >= 100) {
      totalCourses += 1;
      completedCourseIds.add(p.courseId);
      const course = courses.find((c) => c.id === p.courseId);
      if (course) tracksCompleted.add(course.track);
    }
    const course = courses.find((c) => c.id === p.courseId);
    if (course) {
      const lessons = course.modules.flatMap((m) => m.lessons);
      for (const idx of p.completedLessons) {
        if (lessons[idx]?.type === "challenge") totalChallenges += 1;
      }
    }
  }

  return { totalLessons, totalCourses, totalChallenges, tracksCompleted, completedCourseIds };
}

function evaluateAchievements(
  wallet: string,
  stats: LearningStats,
  streak: StreakData,
  leaderboardRank: number | null,
): Achievement[] {
  const referralCount = getReferralCount(wallet);

  const rustTrackCourseIds = courses.filter((c) => c.track === "rust").map((c) => c.id);

  const checks: Record<string, boolean> = {
    "first-lesson": stats.totalLessons >= 1,
    "first-course": stats.totalCourses >= 1,
    "streak-7": streak.longestStreak >= 7,
    "streak-30": streak.longestStreak >= 30,
    "streak-100": streak.longestStreak >= 100,
    "all-tracks": stats.tracksCompleted.size >= 6,
    "code-10": stats.totalChallenges >= 10,
    "referral-5": referralCount >= 5,
    "top-10": (leaderboardRank ?? Infinity) <= 10,
    "security-audit": stats.tracksCompleted.has("security"),
    "speed-run": hasSpeedRun(wallet),
    "rust-rookie": rustTrackCourseIds.some((id) => stats.completedCourseIds.has(id)),
    "anchor-expert": stats.completedCourseIds.has("anchor-dev"),
    "full-stack-solana": stats.tracksCompleted.has("rust") && stats.tracksCompleted.has("frontend") && stats.tracksCompleted.has("defi"),
  };

  return achievementDefs.map((def) => {
    const earned = checks[def.id] ?? false;
    let unlockedAt = getUnlockTime(wallet, def.id);

    if (earned && !unlockedAt) {
      unlockedAt = saveUnlock(wallet, def.id);
      analytics.achievementUnlocked(def.id);
    }

    return { ...def, unlockedAt: earned ? unlockedAt : undefined };
  });
}

export function useUser() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [user, setUser] = useState<UserProfile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(!!publicKey);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const previousAchievementIds = useRef<Set<string>>(new Set());

  const fetchUserData = useCallback(async () => {
    if (!publicKey) {
      setUser(DEFAULT_PROFILE);
      return;
    }

    setLoading(true);
    const walletAddress = publicKey.toBase58();
    const shortWallet = `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;

    let credentials: Credential[] = [];
    let xp = 0;

    const [dasResult, enrollmentResult, xpResult] = await Promise.allSettled([
      getCredentialsByOwner(walletAddress),
      getCredentialsFromEnrollments(publicKey, connection),
      getXPBalance(walletAddress),
    ]);

    if (xpResult.status === "fulfilled") xp = xpResult.value;

    const dasCredentials =
      dasResult.status === "fulfilled" ? dasResult.value : [];
    const enrollmentCredentials =
      enrollmentResult.status === "fulfilled" ? enrollmentResult.value : [];

    const dasIds = new Set(dasCredentials.map((c) => c.id));
    credentials = [
      ...dasCredentials,
      ...enrollmentCredentials.filter((c) => !dasIds.has(c.id)),
    ];

    // Cache on-chain XP locally; only fall back to local cache if on-chain fetch failed
    if (xp > 0) {
      try { localStorage.setItem(`stacad:xp:${walletAddress}`, String(xp)); } catch {}
    } else if (xpResult.status === "rejected") {
      try {
        const cached = localStorage.getItem(`stacad:xp:${walletAddress}`);
        if (cached) xp = Number(cached) || 0;
      } catch {}
    }

    const level = calculateLevel(xp);

    const skills: Record<string, number> = {
      rust: 0,
      anchor: 0,
      frontend: 0,
      security: 0,
      defi: 0,
      mobile: 0,
    };
    for (const cred of credentials) {
      skills[cred.track] = Math.min(
        100,
        cred.level * 25 + cred.coursesCompleted * 15,
      );
    }

    const streak = await learningService.getStreak(walletAddress);
    const stats = await computeLearningStats(walletAddress);
    const achievements = evaluateAchievements(walletAddress, stats, streak, null);

    // Detect newly unlocked achievements
    const prevIds = previousAchievementIds.current;
    const justUnlocked = achievements.filter(
      (a) => a.unlockedAt && !prevIds.has(a.id),
    );
    if (justUnlocked.length > 0) {
      setNewAchievements(justUnlocked);
    }
    previousAchievementIds.current = new Set(
      achievements.filter((a) => a.unlockedAt).map((a) => a.id),
    );

    setUser({
      wallet: shortWallet,
      displayName: shortWallet,
      xp,
      level,
      streak,
      achievements,
      credentials,
      skills: skills as UserProfile["skills"],
      joinedAt: new Date().toISOString(),
      isPublic: true,
    });

    setLoading(false);
  }, [publicKey, connection]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const clearNewAchievements = useCallback(() => {
    setNewAchievements([]);
  }, []);

  return {
    user,
    loading,
    connected,
    walletAddress: publicKey?.toBase58() ?? null,
    refresh: fetchUserData,
    newAchievements,
    clearNewAchievements,
  };
}
