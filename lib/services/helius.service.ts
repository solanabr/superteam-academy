/**
 * Helius DAS API Service
 *
 * Queries Helius (via Solana's Data Availability Service) for:
 * - NFT/Token balances
 * - Leaderboard data (XP token holders)
 * - Token metadata
 *
 * Used by: Leaderboard page, useXPBalance() hook
 */

import { PublicKey } from '@solana/web3.js'

const HELIUS_API_BASE = 'https://api.helius.xyz/v0'

interface TokenHolder {
  owner: string
  amount: string
  decimals?: number
}

interface LeaderboardEntry {
  rank: number
  wallet: string
  xp: number
}

export class HeliusService {
  private apiKey: string

  constructor(apiKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY || '') {
    this.apiKey = apiKey
  }

  /**
   * Get all token holders for an XP mint
   * Used for: Real-time leaderboard
   *
   * @param mint - XP token mint address (string)
   * @param limit - Top N holders (default: 100)
   * @returns Array of leaderboard entries sorted by XP desc
   */
  async getLeaderboard(mint: string, limit = 100): Promise<LeaderboardEntry[]> {
    if (!mint || mint === '11111111111111111111111111111111') {
      console.warn('⚠️ XP Token mint not deployed yet')
      return []
    }

    if (!this.apiKey) {
      console.warn('⚠️ Helius API key not configured')
      return []
    }

    try {
      console.log('📊 Fetching leaderboard from Helius...')

      const response = await fetch(
        `${HELIUS_API_BASE}/token/holders?api_key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mint: mint,
            limit: limit,
          }),
        }
      )

      if (!response.ok) {
        throw new Error(
          `Helius API error: ${response.status} ${response.statusText}`
        )
      }

      const data = await response.json()

      if (!data.result || !Array.isArray(data.result)) {
        console.warn('⚠️ No token holders found')
        return []
      }

      // Transform to leaderboard format and sort by XP desc
      const leaderboard: LeaderboardEntry[] = data.result
        .sort((a: TokenHolder, b: TokenHolder) => {
          return BigInt(b.amount) - BigInt(a.amount)
        })
        .slice(0, limit)
        .map((holder: TokenHolder, index: number) => ({
          rank: index + 1,
          wallet: holder.owner,
          xp: parseInt(holder.amount) / 1e9, // 9 decimals for SOL-like units
        }))

      console.log(`✅ Fetched ${leaderboard.length} leaderboard entries`)
      return leaderboard
    } catch (error) {
      console.error('❌ Failed to fetch leaderboard:', error)
      return []
    }
  }

  /**
   * Get user's XP balance
   * Used for: User dashboard, profile
   *
   * @param mint - XP token mint
   * @param userWallet - User's wallet address
   * @returns User's XP balance
   */
  async getUserXPBalance(mint: string, userWallet: string): Promise<number> {
    if (!mint || !userWallet || !this.apiKey) return 0

    try {
      console.log(`🔍 Getting XP balance for ${userWallet}...`)

      const response = await fetch(
        `${HELIUS_API_BASE}/token/balance?api_key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mint: mint,
            owner: userWallet,
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      const xp = parseInt(data.amount) / 1e9

      console.log(`✅ User XP balance: ${xp}`)
      return xp
    } catch (error) {
      console.error('❌ Failed to get user XP balance:', error)
      return 0
    }
  }

  /**
   * Get user's rank in leaderboard
   *
   * @param mint - XP token mint
   * @param userWallet - User's wallet address
   * @returns User's rank and XP
   */
  async getUserRank(
    mint: string,
    userWallet: string
  ): Promise<{ rank: number; xp: number } | null> {
    try {
      // Fetch full leaderboard
      const leaderboard = await this.getLeaderboard(mint, 1000)

      // Find user's rank
      const userEntry = leaderboard.find((entry) => entry.wallet === userWallet)
      if (!userEntry) {
        console.log('❌ User not found in leaderboard')
        return null
      }

      console.log(`✅ User rank: #${userEntry.rank}, XP: ${userEntry.xp}`)
      return { rank: userEntry.rank, xp: userEntry.xp }
    } catch (error) {
      console.error('❌ Failed to get user rank:', error)
      return null
    }
  }
}

// Singleton instance
export const heliusService = new HeliusService()
