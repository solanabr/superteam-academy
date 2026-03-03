import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'

export interface GamificationStats {
  totalXP: number
  level: number
  currentStreak: number
  longestStreak: number
  achievementsUnlocked: number
  lessonsCompleted?: number
  lessonsCompletedToday?: number
  xpProgress: {
    current: number
    needed: number
    percentage: number
  }
}

export function useGamification(
  refreshTrigger?: number,
  options?: { userId?: string | null }
) {
  const { data: session } = useSession()
  const [stats, setStats] = useState<GamificationStats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`/api/gamification/${encodeURIComponent(userId)}?t=${Date.now()}`, {
        cache: 'no-store',
      })
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        setStats({
          totalXP: 0,
          level: 1,
          currentStreak: 0,
          longestStreak: 0,
          achievementsUnlocked: 0,
          lessonsCompleted: 0,
          lessonsCompletedToday: 0,
          xpProgress: {
            current: 0,
            needed: 100,
            percentage: 0,
          },
        })
      }
    } catch (error) {
      console.error('Failed to fetch gamification stats:', error)
      setStats({
        totalXP: 0,
        level: 1,
        currentStreak: 0,
        longestStreak: 0,
        achievementsUnlocked: 0,
        lessonsCompleted: 0,
        lessonsCompletedToday: 0,
        xpProgress: {
          current: 0,
          needed: 100,
          percentage: 0,
        },
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const userId =
      options?.userId ||
      session?.user?.id ||
      session?.user?.email
    if (!userId) {
      setLoading(false)
      return
    }

    void fetchStats(userId)

    const refresh = () => {
      void fetchStats(userId)
    }

    const intervalId = window.setInterval(refresh, 15000)
    window.addEventListener('focus', refresh)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('focus', refresh)
    }
  }, [session?.user?.id, session?.user?.email, fetchStats, refreshTrigger, options?.userId])

  return { stats, loading, refetch: fetchStats }
}
