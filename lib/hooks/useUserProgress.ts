'use client'

import { useCallback, useState, useEffect } from 'react'

interface UserProgress {
  userId: string
  totalXP: number
  level: number
  currentStreak: number
  completedLessons: number
}

/**
 * Hook to fetch and track user learning progress from backend
 *
 * @param userId - User ID to fetch progress for
 * @returns Progress data with refetch function
 */
export const useUserProgress = (userId: string | null | undefined) => {
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProgress = useCallback(async () => {
    if (!userId) {
      setProgress(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log(`📋 Fetching progress for user: ${userId}`)
      const response = await fetch(`/api/users/${userId}/progress`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch progress`)
      }

      const data = await response.json()
      console.log('✅ Progress loaded:', data)
      setProgress(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      console.error('❌ Failed to fetch progress:', message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Fetch on mount and when userId changes
  useEffect(() => {
    fetchProgress()
  }, [fetchProgress])

  return {
    progress,
    loading,
    error,
    refetch: fetchProgress,
  }
}
