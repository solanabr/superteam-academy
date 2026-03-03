'use client'

import { useCallback, useState, useEffect } from 'react'
import { useWallet } from './useWallet'
import { PublicKey } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'

export interface CompletionStatus {
  isCourseComplete: boolean
  lessonsCompleted: number
  totalLessons: number
  completionPercentage: number
  courseFinalized: boolean
  credentialMinted: boolean
}

/**
 * Hook to check course completion status and certificate eligibility
 */
export function useCourseCompletion(courseId?: string, userId?: string) {
  const { publicKey } = useWallet()

  return useQuery({
    queryKey: ['course:completion', courseId, userId],
    queryFn: async () => {
      if (!courseId || !userId) {
        return {
          isCourseComplete: false,
          lessonsCompleted: 0,
          totalLessons: 0,
          completionPercentage: 0,
          courseFinalized: false,
          credentialMinted: false,
        } as CompletionStatus
      }

      const defaultStatus: CompletionStatus = {
        isCourseComplete: false,
        lessonsCompleted: 0,
        totalLessons: 0,
        completionPercentage: 0,
        courseFinalized: false,
        credentialMinted: false,
      }

      try {
        const response = await fetch(
          `/api/enrollments/${encodeURIComponent(userId)}/completion?courseId=${encodeURIComponent(courseId)}`
        )

        if (!response.ok) {
          return defaultStatus
        }

        const data = await response.json()
        return data as CompletionStatus
      } catch {
        return defaultStatus
      }
    },
    enabled: !!courseId && !!userId,
    staleTime: 5 * 1000, // 5 seconds
  })
}

/**
 * Hook to finalize a course and trigger certificate issuance
 */
export function useFinalizeCourse() {
  const { publicKey } = useWallet()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const finalizeCourse = useCallback(
    async (courseId: string, userId: string) => {
      if (!publicKey) {
        setError('Wallet not connected')
        return { success: false, error: 'Wallet not connected' }
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/courses/finalize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId,
            userId,
            walletAddress: publicKey.toString(),
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to finalize course: ${response.status}`)
        }

        const data = await response.json()
        return { success: true, data }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        setIsLoading(false)
      }
    },
    [publicKey]
  )

  return { finalizeCourse, isLoading, error }
}

/**
 * Hook to issue a credential for a completed course
 */
export function useIssueCredential() {
  const { publicKey } = useWallet()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const issueCredential = useCallback(
    async (courseId: string, userId: string, courseName: string) => {
      if (!publicKey) {
        setError('Wallet not connected')
        return { success: false, error: 'Wallet not connected' }
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/credentials/issue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId,
            userId,
            courseName,
            walletAddress: publicKey.toString(),
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to issue credential: ${response.status}`)
        }

        const data = await response.json()
        return { success: true, data }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        setIsLoading(false)
      }
    },
    [publicKey]
  )

  return { issueCredential, isLoading, error }
}
