'use client'

import { useCallback, useState, useEffect } from 'react'
import { HeliusService } from '@/lib/services/helius.service'

export interface LeaderboardEntry {
  rank: number
  wallet: string
  xp: number
}

/**
 * Hook to fetch and manage leaderboard data
 *
 * Uses Helius DAS API to fetch real XP token holders
 * Falls back to supabase leaderboard if Helius unavailable
 *
 * @param xpTokenMint - Token mint address
 * @param limit - Number of top entries to fetch
 * @returns Leaderboard data with refetch function
 */
export const useLeaderboard = (xpTokenMint: string | null, limit: number = 100) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const heliusService = new HeliusService()

  const fetchLeaderboard = useCallback(async () => {
    if (!xpTokenMint) {
      console.warn('⚠️ XP token mint not configured')
      setLeaderboard([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log('📊 Fetching leaderboard...')

      // Try Helius DAS API first (real on-chain data)
      const data = await heliusService.getLeaderboard(xpTokenMint, limit)

      if (data && data.length > 0) {
        console.log(`✅ Leaderboard loaded from Helius: ${data.length} entries`)
        setLeaderboard(data)
      } else {
        // Fallback to backend leaderboard
        console.log('⏳ Falling back to backend leaderboard...')
        const response = await fetch(`/api/leaderboard?limit=${limit}`)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const backendData = await response.json()
        console.log(`✅ Leaderboard loaded from backend: ${backendData.length || 0} entries`)
        setLeaderboard(backendData || [])
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      console.error('❌ Failed to fetch leaderboard:', message)
    } finally {
      setLoading(false)
    }
  }, [xpTokenMint, limit])

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

  return {
    leaderboard,
    loading,
    error,
    refetch: fetchLeaderboard,
  }
}
