import { Connection, PublicKey } from '@solana/web3.js'
import {
  Progress,
  UserStats,
  Streak,
  LeaderboardEntry,
  ChallengeResult,
} from '../types'
import { OnchainCourseService, CourseProgress } from './onchain-course.service'
import { XpService } from './xp.service'
import { CredentialService } from './credential.service'
import type { Credential as CredentialType } from '../types'
import { getConfigPda, getProgram } from '@/lib/anchor'
import { Program, AnchorProvider } from '@coral-xyz/anchor'
import { READ_ONLY_WALLET, type UntypedAccountAccess } from '@/lib/types/shared'

/**
 * Learning Progress Service
 * Clean interface for managing learning progress and gamification
 * Future: Can be swapped for on-chain calls to the Anchor program
 */
export interface LearningProgressService {
  // Progress Tracking
  getProgress(userId: string, courseId: string): Promise<Progress>
  completeLesson(
    userId: string,
    courseId: string,
    lessonIndex: number
  ): Promise<void>
  getCourseCompletion(userId: string, courseId: string): Promise<number>

  // XP & Leveling
  getXP(userId: string): Promise<number>
  getLevel(userId: string): Promise<number>
  getUserStats(userId: string): Promise<UserStats>

  // Streaks
  getStreak(userId: string): Promise<Streak>
  getStreakHistory(userId: string, days?: number): Promise<Record<string, boolean>>

  // Leaderboard
  getLeaderboard(
    timeframe: 'weekly' | 'monthly' | 'alltime',
    limit?: number
  ): Promise<LeaderboardEntry[]>
  getLeaderboardByTrack(
    track: string,
    timeframe: 'weekly' | 'monthly' | 'alltime',
    limit?: number
  ): Promise<LeaderboardEntry[]>
  getUserRank(userId: string, timeframe: 'weekly' | 'monthly' | 'alltime'): Promise<number>

  // Credentials (cNFTs)
  getCredentials(wallet: PublicKey): Promise<CredentialType[]>
  getCredentialByTrack(wallet: PublicKey, track: string): Promise<CredentialType | null>

  // Achievements
  getAchievements(userId: string): Promise<string[]>
  checkAchievementProgress(userId: string): Promise<void>

  // Challenge Execution (stubbed for now)
  executeChallenge(
    code: string,
    testCases: Array<{ input: string; expectedOutput: string }>
  ): Promise<ChallengeResult>
}

/**
 * Local implementation with on-chain integration
 * Uses Anchor program for course progress and XP, mocks for streaks/leaderboard
 */
export class LocalLearningProgressService implements LearningProgressService {
  // Mock data storage (local-only)
  private progressMap = new Map<string, Progress>()
  private streakMap = new Map<string, Streak>()
  private leaderboardCache: LeaderboardEntry[] = []

  // On-chain services (initialized on-demand)
  private onchainCourseService: OnchainCourseService | null = null
  private xpService: XpService | null = null
  private credentialService: CredentialService | null = null
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
  
  // Cached config values
  private cachedXpMint: PublicKey | null = null
  private connection: Connection | null = null
  private program: Program | null = null

  constructor() {
    // Initialize on-chain services on client side
    if (typeof window !== 'undefined') {
      try {
        const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com'
        this.connection = new Connection(rpcUrl, 'confirmed')
        this.onchainCourseService = new OnchainCourseService(this.connection)
        this.xpService = new XpService(this.connection)
        const heliusRpc = process.env.NEXT_PUBLIC_HELIUS_RPC_URL || rpcUrl
        this.credentialService = new CredentialService(heliusRpc)
        // Initialize program for config fetching
        const provider = new AnchorProvider(this.connection, READ_ONLY_WALLET, { commitment: 'confirmed' })
        this.program = getProgram(provider)
      } catch (error) {
        console.warn('Could not initialize on-chain services:', error)
      }
    }
  }

  private async getXpMint(): Promise<PublicKey | null> {
    // Return cached value if available
    if (this.cachedXpMint) {
      return this.cachedXpMint
    }

    // Fetch XP mint from config
    if (this.program) {
      try {
        const [configPda] = getConfigPda()
        const config = await (this.program.account as unknown as UntypedAccountAccess).config.fetch(configPda)
        this.cachedXpMint = (config.xpMint as PublicKey) ?? null
        return this.cachedXpMint
      } catch (error) {
        console.error('Failed to fetch XP mint from config:', error)
      }
    }

    return null
  }

  async getProgress(userId: string, courseId: string): Promise<Progress> {
    // Try to fetch from on-chain first
    if (this.onchainCourseService) {
      try {
        const walletPubkey = new PublicKey(userId)
        const courseProgress = await this.onchainCourseService.getCourseProgress(
          courseId,
          walletPubkey
        )

        if (courseProgress) {
          return {
            userId,
            courseId,
            enrolledAt: new Date(courseProgress.enrolledAt * 1000),
            completedLessons: courseProgress.completedLessonIndices,
            completionPercentage: courseProgress.progress,
            completedAt: courseProgress.completedAt ? new Date(courseProgress.completedAt * 1000) : undefined,
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch on-chain progress for ${courseId}:`, error)
      }
    }

    // Fallback to local storage
    const key = `${userId}:${courseId}`
    return (
      this.progressMap.get(key) || {
        userId,
        courseId,
        enrolledAt: new Date(),
        completedLessons: [],
        completionPercentage: 0,
      }
    )
  }

  async completeLesson(
    userId: string,
    courseId: string,
    lessonIndex: number
  ): Promise<void> {
    // Call backend signer API to complete lesson on-chain
    try {
      const response = await fetch(`${this.baseUrl}/onchain/complete-lesson`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Authorization header should be added by the caller
        },
        body: JSON.stringify({
          courseId,
          lessonIndex,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to complete lesson: ${response.statusText}`)
      }

      const result = await response.json()
      console.log(`✅ Lesson ${lessonIndex} completed on-chain: ${result.txId}`)

      // Update local streak
      await this.updateStreak(userId)
    } catch (error) {
      console.error('Error completing lesson:', error)
      throw error
    }
  }

  async getCourseCompletion(userId: string, courseId: string): Promise<number> {
    const progress = await this.getProgress(userId, courseId)
    return progress.completionPercentage
  }

  async getXP(userId: string): Promise<number> {
    // Fetch from on-chain if available (userId is wallet address)
    if (this.xpService) {
      try {
        const walletPubkey = new PublicKey(userId)
        const xpMint = await this.getXpMint()
        if (!xpMint) {
          console.warn('Could not fetch XP mint address')
          return 0
        }
        const xpBalances = await this.xpService.getXpBalances([walletPubkey], xpMint)
        return xpBalances.get(userId) || 0
      } catch (error) {
        console.warn('Failed to fetch on-chain XP:', error)
      }
    }

    // Fallback to computed value
    return 0
  }

  async getLevel(userId: string): Promise<number> {
    const xp = await this.getXP(userId)
    // Level calculation: each level requires ~100 * level XP
    return XpService.calculateLevel(xp)
  }

  async getUserStats(userId: string): Promise<UserStats> {
    const totalXp = await this.getXP(userId)
    const level = await this.getLevel(userId)
    const streak = await this.getStreak(userId)

    return {
      userId,
      totalXp,
      level,
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      totalLessonsCompleted: 0, // Would need to sum across all courses
      totalCoursesCompleted: 0, // Would need to query on-chain
      joinDate: new Date(),
    }
  }

  async getStreak(userId: string): Promise<Streak> {
    return (
      this.streakMap.get(userId) || {
        userId,
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: new Date(),
        streakHistory: {},
      }
    )
  }

  private async updateStreak(userId: string): Promise<void> {
    const streak = await this.getStreak(userId)
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    const lastActivity = streak.streakHistory[yesterday]
    const hadActivityYesterday = lastActivity === true

    if (hadActivityYesterday) {
      streak.currentStreak += 1
    } else {
      streak.currentStreak = 1
    }

    if (streak.currentStreak > streak.longestStreak) {
      streak.longestStreak = streak.currentStreak
    }

    streak.streakHistory[today] = true
    streak.lastActivityDate = new Date()

    this.streakMap.set(userId, streak)
  }

  async getStreakHistory(userId: string, days: number = 30): Promise<Record<string, boolean>> {
    const streak = await this.getStreak(userId)
    return streak.streakHistory
  }

  async getLeaderboard(
    timeframe: 'weekly' | 'monthly' | 'alltime',
    limit: number = 100
  ): Promise<LeaderboardEntry[]> {
    // Return cached leaderboard (in production, would fetch from on-chain or indexer)
    return this.leaderboardCache.slice(0, limit)
  }

  async getLeaderboardByTrack(
    track: string,
    timeframe: 'weekly' | 'monthly' | 'alltime',
    limit: number = 100
  ): Promise<LeaderboardEntry[]> {
    return this.getLeaderboard(timeframe, limit)
  }

  async getUserRank(
    userId: string,
    timeframe: 'weekly' | 'monthly' | 'alltime'
  ): Promise<number> {
    const leaderboard = await this.getLeaderboard(timeframe)
    return leaderboard.find((e) => e.userId === userId)?.rank || 0
  }

  async getCredentials(wallet: PublicKey): Promise<CredentialType[]> {
    // Fetch from on-chain via Helius DAS API
    if (this.credentialService) {
      try {
        const onChainCredentials = await this.credentialService.getCredentials(wallet)
        // Map on-chain credentials to frontend Credential type
        return onChainCredentials.map(cred => ({
          id: cred.assetId,
          type: 'cNFT' as const,
          track: cred.trackId,
          level: cred.level,
          mintAddress: cred.assetId,
          metadata: {
            name: cred.name,
            symbol: 'CRED',
            uri: '', // Would need to fetch from on-chain
          },
          issuedAt: new Date(cred.mintedAt),
          issuedToWallet: wallet.toString(),
          verificationUrl: `https://explorer.solana.com/address/${cred.assetId}`,
        }))
      } catch (error) {
        console.warn('Failed to fetch on-chain credentials:', error)
      }
    }
    // Fallback: empty array
    return []
  }

  async getCredentialByTrack(
    wallet: PublicKey,
    track: string
  ): Promise<CredentialType | null> {
    // Fetch specific credential by track from on-chain
    if (this.credentialService) {
      try {
        const onChainCredentials = await this.credentialService.getCredentials(wallet)
        const matching = onChainCredentials.find(c => c.trackId === track)
        if (matching) {
          return {
            id: matching.assetId,
            type: 'cNFT' as const,
            track: matching.trackId,
            level: matching.level,
            mintAddress: matching.assetId,
            metadata: {
              name: matching.name,
              symbol: 'CRED',
              uri: '',
            },
            issuedAt: new Date(matching.mintedAt),
            issuedToWallet: wallet.toString(),
            verificationUrl: `https://explorer.solana.com/address/${matching.assetId}`,
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch credential for track ${track}:`, error)
      }
    }
    // Fallback: null
    return null
  }

  async getAchievements(_userId: string): Promise<string[]> {
    // Stub: Would read bitmap from on-chain
    return []
  }

  async checkAchievementProgress(_userId: string): Promise<void> {
    // Stub: Check and update achievements
  }

  async executeChallenge(
    _code: string,
    _testCases: Array<{ input: string; expectedOutput: string }>
  ): Promise<ChallengeResult> {
    // Stub: Execute code and check test cases
    return {
      passed: false,
      output: '',
      executionTime: 0,
      testsPassed: 0,
      totalTests: _testCases.length,
    }
  }
}
