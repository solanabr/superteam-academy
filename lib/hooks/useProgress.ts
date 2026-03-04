import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api/api-client'
import { calculateLevel } from '@/lib/types'
import type { Achievement, LeaderboardEntry } from '@/lib/types'
import type { UserProgressResponse, UserRankResponse } from '@/lib/types/shared'

export interface Progress {
  totalXp: number
  level: number
  enrollments: UserProgressResponse['enrollments']
}

export type LeaderboardTimeframe = 'weekly' | 'monthly' | 'alltime'

export function useProgress(userId?: string) {
  const [progress, setProgress] = useState<Progress | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setError(null)
        const data = await apiClient.getProgress()
        setProgress(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch progress'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProgress()
  }, [userId])

  const completeLesson = async (courseId: string, lessonId: string, xpReward: number) => {
    try {
      const result = await apiClient.completeLesson(courseId, lessonId, xpReward)
      // Update progress with new totals from the completion response
      if (progress) {
        setProgress({
          ...progress,
          totalXp: result.newTotalXp,
          level: result.newLevel,
        })
      }
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to complete lesson'
      setError(message)
      throw err
    }
  }

  const refresh = async () => {
    if (!userId) return
    try {
      const data = await apiClient.getProgress()
      setProgress(data)
    } catch (err) {
      console.error('Failed to refresh progress:', err)
    }
  }

  return {
    progress,
    isLoading,
    error,
    completeLesson,
    refresh,
  }
}

export function useAchievements(userId?: string) {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        setError(null)
        const data = await apiClient.getAchievements()
        setAchievements(data ?? [])
        // unlocked achievements are filtered client-side
        setUnlockedAchievements((data ?? []).filter(a => a.unlockedAt != null))
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch achievements'
        setError(message)
        setAchievements([])
        setUnlockedAchievements([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchAchievements()
  }, [userId])

  return {
    achievements: achievements || [],
    unlockedAchievements: unlockedAchievements || [],
    isLoading,
    error,
  }
}

export function useLeaderboard(
  limit = 50,
  offset = 0,
  timeframe: LeaderboardTimeframe = 'alltime',
  courseId?: string
) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true)
        setError(null)
        const searchParams = new URLSearchParams({
          limit: String(limit),
          offset: String(offset),
          timeframe,
        })

        if (courseId) {
          searchParams.set('courseId', courseId)
        }

        const response = await fetch(`/api/leaderboard?${searchParams.toString()}`, {
          cache: 'no-store',
        })
        if (!response.ok) {
          throw new Error(`Leaderboard request failed: ${response.status}`)
        }

        const data = await response.json()
        if (!Array.isArray(data)) {
          setLeaderboard([])
          return
        }

        setLeaderboard(
          data.map((entry: Record<string, unknown>, idx: number) => {
            const totalXp = Number(entry.totalXP ?? entry.totalXp ?? entry.xp ?? 0)
            return {
              rank: (entry.rank as number) ?? offset + idx + 1,
              userId: (entry.userId as string) ?? (entry.wallet as string) ?? `user-${idx}`,
              wallet: (entry.wallet as string) ?? (entry.userId as string) ?? '',
              username: (entry.username as string) ?? 'Unknown',
              displayName: (entry.displayName as string) ?? (entry.username as string) ?? 'Unknown',
              totalXp,
              level: (entry.level as number) ?? calculateLevel(totalXp),
              currentStreak: Number(entry.currentStreak ?? 0),
              coursesCompleted: Number(entry.coursesCompleted ?? 0),
            }
          })
        )
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch leaderboard'
        setError(message)
        setLeaderboard([])
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [limit, offset, timeframe, courseId])

  return {
    leaderboard,
    loading,
    error,
  }
}

export function useUserRank(userId: string) {
  const [rank, setRank] = useState<UserRankResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const fetchRank = async () => {
      try {
        setError(null)
        const data = await apiClient.getUserRank(userId)
        setRank(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch rank'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchRank()
  }, [userId])

  return {
    rank,
    loading,
    error,
  }
}
