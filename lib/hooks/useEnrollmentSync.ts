'use client'

import { useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useWallet } from './useWallet'

interface SyncResult {
  synced: boolean
  enrollment: {
    courseId: string
    lessonsCompleted: number
    isComplete: boolean
    completedAt: number | null
  } | null
  message: string
}

/**
 * Hook to sync on-chain enrollment data to the DB.
 *
 * Should be called when:
 * - A user enrolls on-chain (after useEnrollCourse succeeds)
 * - A page loads and detects an on-chain enrollment
 * - After completing a lesson on-chain
 *
 * The sync is idempotent and safe to call multiple times.
 * It reads on-chain state and ensures the DB reflects that data.
 *
 * @example
 * const { syncEnrollment } = useEnrollmentSync()
 *
 * // After on-chain enrollment succeeds:
 * await syncEnrollment('course-1', 'solana-fundamentals')
 */
export function useEnrollmentSync() {
  const { data: session } = useSession()
  const { walletAddress } = useWallet()
  // Prevent duplicate sync calls for the same course
  const pendingSyncs = useRef<Set<string>>(new Set())

  const syncEnrollment = useCallback(
    async (courseId: string, onchainCourseId?: string): Promise<SyncResult | null> => {
      const userId =
        session?.user?.id ||
        session?.user?.email ||
        walletAddress ||
        null

      if (!userId || !walletAddress) return null

      // Deduplicate
      const key = `${courseId}:${walletAddress}`
      if (pendingSyncs.current.has(key)) return null
      pendingSyncs.current.add(key)

      try {
        const response = await fetch('/api/enrollments/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            walletAddress,
            courseId,
            onchainCourseId: onchainCourseId || undefined,
          }),
        })

        if (!response.ok) return null

        return (await response.json()) as SyncResult
      } catch {
        return null
      } finally {
        pendingSyncs.current.delete(key)
      }
    },
    [session, walletAddress]
  )

  /**
   * Sync all enrolled courses for the current user.
   * Accepts a list of courseIds and their on-chain counterparts.
   */
  const syncAllEnrollments = useCallback(
    async (courses: Array<{ courseId: string; onchainCourseId?: string }>) => {
      const results = await Promise.allSettled(
        courses.map((c) => syncEnrollment(c.courseId, c.onchainCourseId))
      )
      return results
        .filter((r): r is PromiseFulfilledResult<SyncResult | null> => r.status === 'fulfilled')
        .map((r) => r.value)
        .filter(Boolean) as SyncResult[]
    },
    [syncEnrollment]
  )

  return { syncEnrollment, syncAllEnrollments }
}
