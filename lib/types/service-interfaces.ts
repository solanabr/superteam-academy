/**
 * Service Interfaces
 *
 * Contracts for all core services, enabling dependency injection and testability.
 * Classes implement these interfaces; consumers depend on them, not on concrete classes.
 */
import type { PublicKey } from '@solana/web3.js'
import type { AchievementWithCriteria } from '@/lib/services/achievement.service'
import type { ExecutionOutput } from '@/lib/services/code-execution.service'
import type { TestCase, TestResult, TestRunnerResult } from '@/lib/services/test-runner.service'
import type { Credential } from '@/lib/services/credential.service'

// ─── XP Service ───────────────────────────────────────────────────

export interface IXpService {
  getXpBalance(walletAddress: PublicKey, xpMint: PublicKey): Promise<number>
  getXpBalances(
    walletAddresses: PublicKey[],
    xpMint: PublicKey
  ): Promise<Map<string, number>>
  ensureXpAccountExists(
    walletAddress: PublicKey,
    xpMint: PublicKey
  ): Promise<boolean>
}

// ─── Achievement Service ──────────────────────────────────────────

export interface AchievementCheckStats {
  totalXp: number
  totalLessonsCompleted: number
  totalCoursesCompleted: number
  currentStreak: number
  lessonsCompletedToday: number
}

export interface IAchievementService {
  getAllAchievements(): AchievementWithCriteria[]
  getUserAchievements(userId: string): AchievementWithCriteria[]
  getUnlockedAchievements(userId: string): AchievementWithCriteria[]
  checkAndUnlockAchievements(
    userId: string,
    stats: AchievementCheckStats
  ): AchievementWithCriteria[]
  resetUserAchievements(userId: string): void
}

// ─── Credential Service ───────────────────────────────────────────

export interface ICredentialService {
  getCredentials(
    walletAddress: PublicKey,
    trackCollectionAddress?: PublicKey
  ): Promise<Credential[]>
  getCredentialByTrack(
    walletAddress: PublicKey,
    trackId: string,
    trackCollectionAddress: PublicKey
  ): Promise<Credential | null>
}

// ─── Code Execution Service ───────────────────────────────────────

export interface ICodeExecutionService {
  executeJavaScript(code: string, timeout?: number): Promise<ExecutionOutput>
  executeTypeScript(code: string, timeout?: number): Promise<ExecutionOutput>
}

// ─── Test Runner Service ──────────────────────────────────────────

export interface ITestRunnerService {
  runTests(
    userCode: string,
    testCases: TestCase[],
    timeout?: number
  ): Promise<TestRunnerResult>
}
