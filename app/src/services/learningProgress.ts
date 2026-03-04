/**
 * LearningProgressService — Clean service interface for learning progress.
 * Designed to allow future swap of local DB calls with on-chain Solana program calls.
 *
 * See docs/INTEGRATION.md for on-chain account structures and instruction parameters.
 */

import { db } from "@/drizzle/db"
import {
  UserTable,
  UserCourseAccessTable,
  UserLessonCompleteTable,
  CourseTable,
  CourseSectionTable,
  LessonTable,
} from "@/drizzle/schema"
import { eq, and, countDistinct } from "drizzle-orm"
import { getLevel, getLevelProgress, getLeaderboard, LeaderboardEntry } from "./xp"
import type { CourseTrack } from "@/drizzle/schema"
import { getCredentialsByOwner, readXpBalanceFromChain } from "./onchain"

export interface CourseProgress {
  courseId: string
  courseName: string
  totalLessons: number
  completedLessons: number
  progressPercent: number
  isEnrolled: boolean
}

export interface StreakData {
  currentStreak: number
  lastActiveDate: string | null
  longestStreak: number
}

export interface XPData {
  total: number
  level: number
  levelProgress: number
  nextLevelXp: number
}

export interface Credential {
  id: string
  courseId: string
  courseName: string
  track: CourseTrack
  level: number
  completedAt: Date
  nftMintAddress: string | null
  verificationUrl: string | null
}

export const LearningProgressService = {
  /**
   * Get progress for a user on a specific course
   */
  async getProgress(userId: string, courseId: string): Promise<CourseProgress | null> {
    const enrollment = await db.query.UserCourseAccessTable.findFirst({
      where: and(
        eq(UserCourseAccessTable.userId, userId),
        eq(UserCourseAccessTable.courseId, courseId)
      ),
    })

    const course = await db.query.CourseTable.findFirst({
      where: eq(CourseTable.id, courseId),
      columns: { id: true, name: true },
    })

    if (!course) return null

    if (!enrollment) {
      return {
        courseId,
        courseName: course.name,
        totalLessons: 0,
        completedLessons: 0,
        progressPercent: 0,
        isEnrolled: false,
      }
    }

    const [totals] = await db
      .select({
        total: countDistinct(LessonTable.id),
        completed: countDistinct(UserLessonCompleteTable.lessonId),
      })
      .from(CourseSectionTable)
      .leftJoin(LessonTable, eq(LessonTable.sectionId, CourseSectionTable.id))
      .leftJoin(
        UserLessonCompleteTable,
        and(
          eq(UserLessonCompleteTable.lessonId, LessonTable.id),
          eq(UserLessonCompleteTable.userId, userId)
        )
      )
      .where(eq(CourseSectionTable.courseId, courseId))

    const total = totals?.total ?? 0
    const completed = totals?.completed ?? 0

    return {
      courseId,
      courseName: course.name,
      totalLessons: total,
      completedLessons: completed,
      progressPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
      isEnrolled: true,
    }
  },

  /**
   * Mark a lesson as complete (stub: on-chain via backend-signed TX later)
   */
  async completeLesson(userId: string, lessonId: string): Promise<void> {
    // STUB: In production, this triggers a backend-signed Solana transaction
    // to update the on-chain Enrollment PDA lesson bitmap
    await db
      .insert(UserLessonCompleteTable)
      .values({ userId, lessonId })
      .onConflictDoNothing()
  },

  /**
   * Get XP balance — reads from local DB. In production, reads Token-2022 token account.
   */
  async getXPBalance(userId: string, walletAddress?: string): Promise<XPData> {
    const xpMintAddress = process.env.NEXT_PUBLIC_SOLANA_XP_MINT ?? process.env.SOLANA_XP_MINT
    if (walletAddress && xpMintAddress) {
      const xp = await readXpBalanceFromChain({ walletAddress, xpMintAddress }).catch(() => 0)
      const level = getLevel(xp)
      const levelProgress = getLevelProgress(xp)
      const nextLevelXp = (level + 1) * (level + 1) * 100
      return { total: xp, level, levelProgress, nextLevelXp }
    }

    // Fallback local DB until wallet/mint are configured.
    const user = await db.query.UserTable.findFirst({
      where: eq(UserTable.id, userId),
      columns: { xp: true },
    })

    const xp = user?.xp ?? 0
    const level = getLevel(xp)
    const levelProgress = getLevelProgress(xp)
    const nextLevelXp = (level + 1) * (level + 1) * 100

    return { total: xp, level, levelProgress, nextLevelXp }
  },

  /**
   * Get streak data for a user
   */
  async getStreakData(userId: string): Promise<StreakData> {
    const user = await db.query.UserTable.findFirst({
      where: eq(UserTable.id, userId),
      columns: { streak: true, lastActiveDate: true },
    })

    return {
      currentStreak: user?.streak ?? 0,
      lastActiveDate: user?.lastActiveDate ?? null,
      longestStreak: user?.streak ?? 0, // Simplified — could track separately
    }
  },

  /**
   * Get leaderboard entries
   */
  async getLeaderboard(
    timeframe: "week" | "month" | "all" = "all",
    limit = 50
  ): Promise<LeaderboardEntry[]> {
    return getLeaderboard(timeframe, limit)
  },

  /**
   * Get credentials (NFTs) for a wallet — reads Metaplex Core NFTs.
   */
  async getCredentials(walletAddress: string): Promise<Credential[]> {
    const credentials = await getCredentialsByOwner(walletAddress)
    return credentials.map((c) => ({
      id: c.id,
      courseId: String(c.attributes.course_id ?? ""),
      courseName: c.name,
      track: String(c.attributes.track ?? c.attributes.track_id ?? "fundamentals") as CourseTrack,
      level: Number(c.attributes.level ?? 0),
      completedAt: new Date(),
      nftMintAddress: c.id,
      verificationUrl: c.explorerUrl,
    }))
  },
}
