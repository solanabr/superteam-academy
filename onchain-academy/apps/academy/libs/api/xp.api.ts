import type {
  LeaderboardEntry,
  LeaderboardResult,
  TimePeriod,
} from '@/services/leaderboard.service'
import { fetchAPI } from './index'

export interface LeaderboardParams {
  timePeriod?: TimePeriod
  limit?: number
  offset?: number
}

export interface AwardXPParams {
  user: string
  amount: number
  source: string
  timestamp?: string
}

export const xpAPI = {
  /**
   * Fetches leaderboard data with optional filtering and pagination
   *
   * @param params - Query parameters for time period and pagination
   * @returns Leaderboard entries with user data, XP, and streaks
   */
  getLeaderboard: (params: LeaderboardParams = {}) => {
    const { timePeriod = 'all-time', limit = 20, offset = 0 } = params
    const query = new URLSearchParams({
      timePeriod,
      limit: limit.toString(),
      offset: offset.toString(),
    })
    return fetchAPI<LeaderboardResult>(`/leaderboard?${query}`)
  },

  /**
   * Awards XP by creating an XP record via Payload REST API
   *
   * @param data - XP record data (user, amount, source, timestamp)
   * @returns Created XP record
   */
  awardXP: (data: AwardXPParams) =>
    fetchAPI<unknown>('/api/xp-records', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

export type { LeaderboardEntry, LeaderboardResult, TimePeriod }
