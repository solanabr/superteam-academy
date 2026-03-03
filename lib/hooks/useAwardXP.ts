'use client'

import { useCallback, useState } from 'react'
import { useSession } from 'next-auth/react'

export interface XPAwardResult {
  success: boolean
  xpAwarded: number
  totalXp: number
  level: number
  message: string
}

export interface XPAwardParams {
  courseId: string
  lessonId: string
  xpAmount: number
}

/**
 * Hook to award real XP to a learner when they complete a lesson
 * 
 * Features:
 * - Credits XP to user account
 * - Updates enrollment XP earned
 * - Records lesson completion
 * - Calculates new level
 * - Prevents duplicate XP awards
 * 
 * @returns Object with awardXP function and loading/error state
 * 
 * @example
 * const { awardXP, isAwarding, error } = useAwardXP()
 * 
 * const handleClaimRewards = async () => {
 *   const result = await awardXP({
 *     courseId: 'course-1',
 *     lessonId: 'lesson-1',
 *     xpAmount: 100
 *   })
 *   
 *   if (result.success) {
 *     console.log(`Earned ${result.xpAwarded} XP! Total: ${result.totalXp}`)
 *   }
 * }
 */
export function useAwardXP() {
  const { data: session } = useSession()
  const [isAwarding, setIsAwarding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const awardXP = useCallback(
    async (params: XPAwardParams): Promise<XPAwardResult> => {
      // Validate session
      if (!session?.user) {
        const msg = 'User not authenticated'
        setError(msg)
        return {
          success: false,
          xpAwarded: 0,
          totalXp: 0,
          level: 0,
          message: msg,
        }
      }

      const userId = session.user.id || session.user.email
      if (!userId) {
        const msg = 'Unable to get user ID'
        setError(msg)
        return {
          success: false,
          xpAwarded: 0,
          totalXp: 0,
          level: 0,
          message: msg,
        }
      }

      setIsAwarding(true)
      setError(null)

      try {
        // Call XP award API
        const apiBase = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')
        const xpAwardEndpoint = apiBase
          ? `${apiBase.endsWith('/api') ? apiBase : `${apiBase}/api`}/xp/award`
          : '/api/xp/award'
        const response = await fetch(xpAwardEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            courseId: params.courseId,
            lessonId: params.lessonId,
            xpAmount: params.xpAmount,
          }),
        })

        const data = await response.json()

        if (response.ok) {
          const result: XPAwardResult = {
            success: true,
            xpAwarded: data.xpAwarded,
            totalXp: data.totalXp,
            level: data.level,
            message: data.message || 'XP awarded successfully',
          }
          return result
        } else if (response.status === 400 && data.error === 'Lesson already completed') {
          // Treat already-completed as success — user already earned this XP
          return {
            success: true,
            xpAwarded: 0,
            totalXp: 0,
            level: 0,
            message: 'Lesson already completed',
          }
        } else {
          const msg = data.error || 'Failed to award XP'
          setError(msg)
          return {
            success: false,
            xpAwarded: 0,
            totalXp: 0,
            level: 0,
            message: msg,
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to award XP'
        setError(msg)
        return {
          success: false,
          xpAwarded: 0,
          totalXp: 0,
          level: 0,
          message: msg,
        }
      } finally {
        setIsAwarding(false)
      }
    },
    [session?.user]
  )

  return {
    awardXP,
    isAwarding,
    error,
    isAuthenticated: !!session?.user,
  }
}
