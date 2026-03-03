'use client'

import { useState, useCallback } from 'react'
import { LearningProgressService } from '../services'

export function useLearningProgress(service: LearningProgressService) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const completeLesson = useCallback(
    async (userId: string, courseId: string, lessonIndex: number) => {
      setLoading(true)
      setError(null)
      try {
        await service.completeLesson(userId, courseId, lessonIndex)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to complete lesson')
      } finally {
        setLoading(false)
      }
    },
    [service]
  )

  const getUserStats = useCallback(
    async (userId: string) => {
      setLoading(true)
      try {
        return await service.getUserStats(userId)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch user stats')
        return null
      } finally {
        setLoading(false)
      }
    },
    [service]
  )

  return { completeLesson, getUserStats, loading, error }
}
