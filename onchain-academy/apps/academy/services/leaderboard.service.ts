/**
 * Leaderboard Service
 *
 * Provides leaderboard data aggregation and ranking functionality.
 * Aggregates XP records per user with time-period filtering and pagination support.
 */

import { getPayloadClient } from '@/libs/payload'
import { calculateLevel } from '@/libs/utils/xp'

export type TimePeriod = 'weekly' | 'monthly' | 'all-time'

export interface LeaderboardEntry {
  rank: number
  user: {
    id: number
    displayName: string
    username: string
    avatar?: string
  }
  totalXP: number
  level: number
  streak: {
    current: number
    longest: number
  }
}

export interface LeaderboardResult {
  entries: LeaderboardEntry[]
  hasMore: boolean
  total: number
}

/**
 * Fetches leaderboard data with time filtering and pagination
 *
 * @param timePeriod - Filter by time range ('weekly', 'monthly', 'all-time')
 * @param limit - Number of entries to return (default: 20)
 * @param offset - Number of entries to skip for pagination (default: 0)
 * @returns Ranked leaderboard entries with user data
 */
export async function getLeaderboard(
  timePeriod: TimePeriod = 'all-time',
  limit: number = 20,
  offset: number = 0,
): Promise<LeaderboardResult> {
  try {
    // Validate time period parameter
    const validTimePeriods: TimePeriod[] = ['weekly', 'monthly', 'all-time']
    if (!validTimePeriods.includes(timePeriod)) {
      console.error(
        `[LeaderboardService.getLeaderboard] Invalid time period: ${timePeriod}`,
      )
      throw new Error('Invalid time period')
    }

    // Validate pagination parameters
    if (limit < 1 || limit > 100) {
      console.error(
        `[LeaderboardService.getLeaderboard] Invalid limit: ${limit}`,
      )
      throw new Error(
        'Invalid pagination parameters: limit must be between 1 and 100',
      )
    }

    if (offset < 0) {
      console.error(
        `[LeaderboardService.getLeaderboard] Invalid offset: ${offset}`,
      )
      throw new Error(
        'Invalid pagination parameters: offset must be non-negative',
      )
    }

    const payload = await getPayloadClient()

    // Calculate date range based on time period
    let timestampFilter: { greater_than_equal?: string } | undefined
    if (timePeriod === 'weekly') {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      timestampFilter = { greater_than_equal: weekAgo.toISOString() }
    } else if (timePeriod === 'monthly') {
      const monthAgo = new Date()
      monthAgo.setDate(monthAgo.getDate() - 30)
      timestampFilter = { greater_than_equal: monthAgo.toISOString() }
    }

    // Query xp-records collection with time filter
    const xpRecordsQuery = await payload.find({
      collection: 'xp-records',
      where: timestampFilter ? { timestamp: timestampFilter } : undefined,
      limit: 10000, // Fetch all records for aggregation
      depth: 0, // Don't populate relationships yet
    })

    // Aggregate XP per user (group by user, sum amounts)
    const userXPMap = new Map<number, number>()
    for (const record of xpRecordsQuery.docs) {
      const userId =
        typeof record.user === 'number' ? record.user : record.user.id
      const currentXP = userXPMap.get(userId) || 0
      userXPMap.set(userId, currentXP + record.amount)
    }

    // Convert to array and sort by total XP descending
    const sortedUsers = Array.from(userXPMap.entries())
      .map(([userId, totalXP]) => ({ userId, totalXP }))
      .sort((a, b) => b.totalXP - a.totalXP)

    // Calculate total count
    const total = sortedUsers.length

    // Apply pagination
    const paginatedUsers = sortedUsers.slice(offset, offset + limit)

    // Batch fetch user data for all paginated users with select fields
    const userIds = paginatedUsers.map((u) => u.userId)
    const usersResult = await payload.find({
      collection: 'users',
      where: {
        id: {
          in: userIds,
        },
      },
      limit: userIds.length,
      depth: 1, // Limit relationship population depth
    })

    // Create user map for quick lookup
    const userMap = new Map(usersResult.docs.map((user) => [user.id, user]))

    // Batch fetch streak data for all paginated users with select fields
    const streaksResult = await payload.find({
      collection: 'streaks',
      where: {
        user: {
          in: userIds,
        },
      },
      limit: userIds.length,
      depth: 0, // Don't populate user relationship
    })

    // Create streak map for quick lookup
    const streakMap = new Map(
      streaksResult.docs.map((streak) => [
        typeof streak.user === 'number' ? streak.user : streak.user.id,
        streak,
      ]),
    )

    // Build leaderboard entries
    const entries: LeaderboardEntry[] = paginatedUsers.map(
      ({ userId, totalXP }, i) => {
        const userResult = userMap.get(userId)
        const streak = streakMap.get(userId) || {
          currentStreak: 0,
          longestStreak: 0,
        }

        // Calculate rank based on position (1-indexed)
        const rank = offset + i + 1

        // Calculate level from total XP
        const level = calculateLevel(totalXP)

        return {
          rank,
          user: {
            id: userResult?.id || userId,
            displayName:
              userResult?.displayName || userResult?.username || 'Unknown',
            username: userResult?.username || 'unknown',
            avatar:
              typeof userResult?.avatar === 'object' && userResult?.avatar?.url
                ? userResult.avatar.url
                : undefined,
          },
          totalXP,
          level,
          streak: {
            current: streak.currentStreak || 0,
            longest: streak.longestStreak || 0,
          },
        }
      },
    )

    // Calculate hasMore
    const hasMore = offset + limit < total

    return {
      entries,
      hasMore,
      total,
    }
  } catch (error) {
    console.error('[LeaderboardService.getLeaderboard] Error:', {
      timePeriod,
      limit,
      offset,
      error: error instanceof Error ? error.message : String(error),
    })
    throw new Error('Failed to fetch leaderboard data')
  }
}
