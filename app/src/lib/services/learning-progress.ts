/**
 * LearningProgressService — Hybrid local + on-chain.
 * Uses devnet XP and credentials when connection and env vars are available.
 */

import { PublicKey } from "@solana/web3.js";
import {
  Achievement,
  CourseProgress,
  Credential,
  Enrollment,
  LeaderboardEntry,
  LeaderboardTimeframe,
  LearningProgressService,
  Streak,
  XPBalance,
} from "@/types";
import { calculateXPBalance } from "@/lib/utils/xp";
import { setBit, countCompletedLessons } from "@/lib/utils/bitmap";
import {
  MOCK_ACHIEVEMENTS,
  MOCK_LEADERBOARD,
  MOCK_CREDENTIAL,
  MOCK_COURSES,
  TRACKS,
  generateMockStreak,
} from "@/lib/mock-data";
import { getSolanaContext } from "@/lib/solana/context";
import { fetchXpBalance, fetchCredentialsByOwner } from "@/lib/solana/xp";

const STORAGE_KEYS = {
  enrollments: "academy_enrollments",
  xp: "academy_xp",
  streak: "academy_streak",
  lastActivity: "academy_last_activity",
} as const;

function getStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

class LocalLearningProgressService implements LearningProgressService {
  async getProgress(userId: string, courseId: string): Promise<CourseProgress> {
    const enrollment = await this.getEnrollment(userId, courseId);
    const course = MOCK_COURSES.find((c) => c.id === courseId || c.slug === courseId);

    if (!enrollment || !course) {
      return {
        courseId,
        completedLessons: 0,
        totalLessons: course?.lessonCount ?? 0,
        percentage: 0,
        isCompleted: false,
        isEnrolled: false,
        xpEarned: 0,
      };
    }

    const completedLessons = countCompletedLessons(
      enrollment.lessonFlags,
      course.lessonCount
    );
    const percentage = Math.floor((completedLessons / course.lessonCount) * 100);

    return {
      courseId,
      completedLessons,
      totalLessons: course.lessonCount,
      percentage,
      isCompleted: enrollment.isFinalized,
      isEnrolled: true,
      xpEarned: completedLessons * (course.xpPerLesson ?? 75),
    };
  }

  async getEnrollment(userId: string, courseId: string): Promise<Enrollment | null> {
    const enrollments = getStorage<Record<string, Enrollment>>(
      STORAGE_KEYS.enrollments,
      {}
    );
    return enrollments[`${userId}:${courseId}`] ?? null;
  }

  async getAllEnrollments(userId: string): Promise<Enrollment[]> {
    const enrollments = getStorage<Record<string, Enrollment>>(
      STORAGE_KEYS.enrollments,
      {}
    );
    return Object.entries(enrollments)
      .filter(([key]) => key.startsWith(`${userId}:`))
      .map(([, value]) => value);
  }

  async enroll(userId: string, courseId: string): Promise<Enrollment> {
    const enrollments = getStorage<Record<string, Enrollment>>(
      STORAGE_KEYS.enrollments,
      {}
    );
    const course = MOCK_COURSES.find((c) => c.id === courseId || c.slug === courseId);

    const enrollment: Enrollment = {
      id: `${userId}:${courseId}`,
      courseId,
      userId,
      enrolledAt: new Date(),
      lessonFlags: new Array(Math.ceil((course?.lessonCount ?? 10) / 32)).fill(0),
      completedLessons: 0,
      isFinalized: false,
    };

    enrollments[`${userId}:${courseId}`] = enrollment;
    setStorage(STORAGE_KEYS.enrollments, enrollments);
    return enrollment;
  }

  async completeLesson(
    userId: string,
    courseId: string,
    lessonIndex: number
  ): Promise<void> {
    const enrollments = getStorage<Record<string, Enrollment>>(
      STORAGE_KEYS.enrollments,
      {}
    );
    const key = `${userId}:${courseId}`;
    const enrollment = enrollments[key];
    if (!enrollment) return;

    enrollment.lessonFlags = setBit(enrollment.lessonFlags, lessonIndex);
    enrollments[key] = enrollment;
    setStorage(STORAGE_KEYS.enrollments, enrollments);

    // Award XP
    const course = MOCK_COURSES.find((c) => c.id === courseId || c.slug === courseId);
    const xpReward = course?.xpPerLesson ?? 75;
    await this.addXp(userId, xpReward);

    // Track activity for streak
    this.recordActivity(userId);
  }

  async getXpBalance(walletAddress: string): Promise<XPBalance> {
    const ctx = getSolanaContext();
    if (
      ctx.connection &&
      ctx.xpMint &&
      walletAddress &&
      walletAddress.length >= 32 &&
      walletAddress.length <= 44
    ) {
      try {
        const pubkey = new PublicKey(walletAddress);
        return await fetchXpBalance(ctx.connection, pubkey, ctx.xpMint);
      } catch {
        /* fall through to localStorage */
      }
    }
    const defaultXp = walletAddress === "demo" ? 4200 : 0;
    const xp = getStorage<number>(`${STORAGE_KEYS.xp}:${walletAddress}`, defaultXp);
    return calculateXPBalance(xp);
  }

  async addXp(userId: string, amount: number): Promise<void> {
    const current = getStorage<number>(`${STORAGE_KEYS.xp}:${userId}`, 0);
    setStorage(`${STORAGE_KEYS.xp}:${userId}`, current + amount);
  }

  async getStreakData(userId: string): Promise<Streak> {
    return generateMockStreak();
  }

  private recordActivity(userId: string): void {
    const today = new Date().toISOString().split("T")[0];
    setStorage(`${STORAGE_KEYS.lastActivity}:${userId}`, today);
  }

  async getLeaderboard(
    timeframe: LeaderboardTimeframe,
    limit = 50
  ): Promise<LeaderboardEntry[]> {
    await new Promise((r) => setTimeout(r, 300));
    return MOCK_LEADERBOARD.slice(0, limit);
  }

  async getCredentials(walletAddress: string): Promise<Credential[]> {
    if (!walletAddress) return [];
    const ctx = getSolanaContext();
    if (
      ctx.heliusUrl &&
      walletAddress.length >= 32 &&
      walletAddress.length <= 44
    ) {
      try {
        const items = await fetchCredentialsByOwner(ctx.heliusUrl, walletAddress);
        return items.map(
          (item: {
            mintAddress: string;
            name: string;
            imageUri: string;
            metadataUri: string;
            attributes?: Array<{ trait_type: string; value: string }>;
            collection?: string;
          }): Credential => {
            const level =
              Number(
                item.attributes?.find((a) => a.trait_type === "level")?.value
              ) || 1;
            const coursesCompleted =
              Number(
                item.attributes?.find((a) => a.trait_type === "coursesCompleted")
                  ?.value
              ) || 0;
            const totalXp =
              Number(
                item.attributes?.find((a) => a.trait_type === "totalXp")?.value
              ) || 0;
            return {
              id: item.mintAddress,
              mintAddress: item.mintAddress,
              walletAddress,
              track: TRACKS[0] ?? {
                id: 1,
                name: "Solana Academy",
                slug: "academy",
                description: "",
                color: "#9945FF",
                icon: "⚡",
                courses: [],
              },
              level,
              coursesCompleted,
              totalXp,
              issuedAt: new Date(),
              name: item.name,
              imageUri: item.imageUri,
              metadataUri: item.metadataUri,
              collection: item.collection ?? "",
            };
          }
        );
      } catch {
        /* fall through */
      }
    }
    return [MOCK_CREDENTIAL];
  }

  async getAchievements(userId: string): Promise<Achievement[]> {
    return MOCK_ACHIEVEMENTS;
  }
}

export const learningProgressService = new LocalLearningProgressService();
