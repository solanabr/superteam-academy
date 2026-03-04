import { db } from "@/drizzle/db"
import { UserTable, XpEventTable } from "@/drizzle/schema"
import { eq, desc, sql } from "drizzle-orm"
import { revalidateTag } from "next/cache"

export function getLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100))
}

export function getLevelProgress(xp: number): number {
  const level = getLevel(xp)
  const currentLevelXp = level * level * 100
  const nextLevelXp = (level + 1) * (level + 1) * 100
  const range = nextLevelXp - currentLevelXp
  return range > 0 ? ((xp - currentLevelXp) / range) * 100 : 0
}

export function getXpForNextLevel(xp: number): number {
  const level = getLevel(xp)
  return (level + 1) * (level + 1) * 100
}

export async function getXPBalance(userId: string): Promise<number> {
  const [user, eventSum] = await Promise.all([
    db.query.UserTable.findFirst({
      where: eq(UserTable.id, userId),
      columns: { xp: true },
    }),
    db
      .select({ total: sql<number>`cast(coalesce(sum(${XpEventTable.amount}), 0) as int)` })
      .from(XpEventTable)
      .where(eq(XpEventTable.userId, userId))
      .then(([r]) => r?.total ?? 0),
  ])

  // Prefer live event sum; fall back to cached UserTable.xp for users with no events
  return eventSum > 0 ? eventSum : (user?.xp ?? 0)
}

export async function awardXP(
  userId: string,
  amount: number,
  reason: string,
  courseId?: string,
  lessonId?: string,
  assignmentId?: string
): Promise<void> {
  if (amount <= 0) return

  await updateStreak(userId)

  // Insert XP event record
  await db.insert(XpEventTable).values({
    userId,
    amount,
    reason,
    courseId: courseId ?? null,
    lessonId: lessonId ?? null,
    assignmentId: assignmentId ?? null,
  })

  // Update user's total XP
  await db
    .update(UserTable)
    .set({
      xp: sql`${UserTable.xp} + ${amount}`,
    })
    .where(eq(UserTable.id, userId))

  revalidateTag(`user-xp-${userId}`)
}

export interface LeaderboardEntry {
  userId: string
  walletAddress?: string | null
  name: string | null
  image: string | null
  username: string | null
  xp: number
  level: number
  streak: number
  rank: number
}

export async function getLeaderboard(
  timeframe: "week" | "month" | "all" = "all",
  limit = 50
): Promise<LeaderboardEntry[]> {
  // Week / Month: LEFT JOIN all users, conditionally sum only events in the window
  // so every user appears (0 XP for the period if they had no activity)
  if (timeframe === "week" || timeframe === "month") {
    const days = timeframe === "week" ? 7 : 30
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const periodRows = await db
      .select({
        userId: UserTable.id,
        name: UserTable.name,
        image: UserTable.image,
        username: UserTable.username,
        walletAddress: UserTable.walletAddress,
        streak: UserTable.streak,
        totalXp: sql<number>`cast(coalesce(sum(case when ${XpEventTable.createdAt} >= ${since} then ${XpEventTable.amount} else 0 end), 0) as int)`,
      })
      .from(UserTable)
      .leftJoin(XpEventTable, eq(XpEventTable.userId, UserTable.id))
      .groupBy(
        UserTable.id,
        UserTable.name,
        UserTable.image,
        UserTable.username,
        UserTable.walletAddress,
        UserTable.streak,
      )
      .orderBy(desc(sql`coalesce(sum(case when ${XpEventTable.createdAt} >= ${since} then ${XpEventTable.amount} else 0 end), 0)`))
      .limit(limit)

    if (periodRows.length === 0) return []

    return periodRows.map((row, index) => ({
      userId: row.userId,
      walletAddress: row.walletAddress,
      name: row.name,
      image: row.image,
      username: row.username,
      xp: row.totalXp,
      level: getLevel(row.totalXp),
      streak: row.streak,
      rank: index + 1,
    }))
  }

  // All-time: LEFT JOIN so every user with xp > 0 appears.
  // Uses event sum when events exist, falls back to UserTable.xp for users
  // whose XP was set before the events table existed.
  const allTimeRows = await db
    .select({
      userId: UserTable.id,
      name: UserTable.name,
      image: UserTable.image,
      username: UserTable.username,
      walletAddress: UserTable.walletAddress,
      streak: UserTable.streak,
      totalXp: sql<number>`cast(coalesce(sum(${XpEventTable.amount}), ${UserTable.xp}) as int)`,
    })
    .from(UserTable)
    .leftJoin(XpEventTable, eq(XpEventTable.userId, UserTable.id))
    .groupBy(
      UserTable.id,
      UserTable.name,
      UserTable.image,
      UserTable.username,
      UserTable.walletAddress,
      UserTable.streak,
      UserTable.xp,
    )
    .orderBy(desc(sql`coalesce(sum(${XpEventTable.amount}), ${UserTable.xp})`))
    .limit(limit)

  if (allTimeRows.length === 0) return []

  return allTimeRows.map((row, index) => ({
    userId: row.userId,
    walletAddress: row.walletAddress,
    name: row.name,
    image: row.image,
    username: row.username,
    xp: row.totalXp,
    level: getLevel(row.totalXp),
    streak: row.streak,
    rank: index + 1,
  }))
}

export async function updateStreak(userId: string): Promise<void> {
  const user = await db.query.UserTable.findFirst({
    where: eq(UserTable.id, userId),
    columns: { lastActiveDate: true, streak: true },
  })

  if (!user) return

  const today = new Date().toISOString().split("T")[0]
  const lastActive = user.lastActiveDate

  if (lastActive === today) return // Already updated today

  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]
  const newStreak = lastActive === yesterday ? (user.streak ?? 0) + 1 : 1

  await db
    .update(UserTable)
    .set({
      lastActiveDate: today,
      streak: newStreak,
    })
    .where(eq(UserTable.id, userId))

  // Award streak milestone XP
  if (newStreak === 7) await awardXP(userId, 100, "streak_7_days")
  if (newStreak === 30) await awardXP(userId, 500, "streak_30_days")
  if (newStreak === 100) await awardXP(userId, 2000, "streak_100_days")

  revalidateTag(`user-streak-${userId}`)
}

// XP rewards constants
export const XP_REWARDS = {
  LESSON_COMPLETE: 25,
  CHALLENGE_COMPLETE: 50,
  COURSE_COMPLETE: 500,
  DAILY_STREAK: 10,
  FIRST_DAILY: 25,
  ASSIGNMENT_SUBMIT: 15,
} as const
