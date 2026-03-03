import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js'

/**
 * Read-only wallet placeholder for AnchorProvider
 * Used when only reading on-chain data (no signing needed)
 */
export const READ_ONLY_WALLET = {
  publicKey: PublicKey.default,
  signTransaction: async <T extends Transaction | VersionedTransaction>(tx: T): Promise<T> => tx,
  signAllTransactions: async <T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> => txs,
} as const

export type ReadOnlyWallet = typeof READ_ONLY_WALLET

/**
 * Backend signer wallet interface
 * Used for server-side transaction signing
 */
export interface BackendSignerWallet {
  publicKey: PublicKey
  signTransaction: <T extends Transaction | VersionedTransaction>(tx: T) => Promise<T>
  signAllTransactions: <T extends Transaction | VersionedTransaction>(txs: T[]) => Promise<T[]>
}

/**
 * Supabase query result wrapper
 * Avoids `as any` casts on Supabase `.maybeSingle()` / `.single()` calls
 */
export interface SupabaseResult<T> {
  data: T | null
  error: { message: string; code?: string } | null
}

/**
 * Supabase list query result
 */
export interface SupabaseListResult<T> {
  data: T[] | null
  error: { message: string; code?: string } | null
}

/**
 * Generic Anchor account access helper
 * Type for `program.account` when IDL types aren't generated
 */
export interface UntypedAccountAccess {
  [accountName: string]: {
    fetch: (address: PublicKey) => Promise<Record<string, unknown>>
    fetchNullable: (address: PublicKey) => Promise<Record<string, unknown> | null>
    all: (filters?: unknown[]) => Promise<Array<{ publicKey: PublicKey; account: Record<string, unknown> }>>
  }
}

/**
 * On-chain account wrapper from `program.account.*.all()`
 */
export interface AccountWrapper<T = Record<string, unknown>> {
  publicKey: PublicKey
  account: T
}

/**
 * Token balance response from getTokenAccountBalance RPC call
 */
export interface TokenBalanceResponse {
  value: {
    amount: string
    decimals: number
    uiAmount: number | null
    uiAmountString?: string
  }
}

/**
 * Gamification API response types
 */
export interface GamificationStats {
  totalXP: number
  level: number
  currentStreak: number
  longestStreak: number
  lessonsCompleted: number
  coursesCompleted: number
  lessonsCompletedToday: number
  xpProgress: {
    current: number
    needed: number
    percentage: number
  }
}

/**
 * Auth signup/login API response
 */
export interface AuthResponse {
  user: {
    id: string
    email: string
    displayName: string
    avatarUrl?: string
  }
  token: string
}

/**
 * User profile API response
 */
export interface UserProfileResponse {
  id: string
  email?: string
  displayName: string
  bio?: string
  avatarUrl?: string
  walletAddress?: string
  totalXp: number
  level: number
  linkedAccounts?: {
    google?: string
    github?: string
    wallet?: string
  }
}

/**
 * Lesson completion API response
 */
export interface LessonCompletionResponse {
  success: boolean
  xpAwarded: number
  newTotalXp: number
  newLevel: number
  achievements?: string[]
}

/**
 * User progress API response
 */
export interface UserProgressResponse {
  enrollments: Array<{
    courseId: string
    completionPercentage: number
    lessonsCompleted: number
    totalLessons: number
    enrolledAt: string
    completedAt?: string
  }>
  totalXp: number
  level: number
}

/**
 * User rank API response
 */
export interface UserRankResponse {
  rank: number
  totalXp: number
  level: number
  percentile: number
}

/**
 * Code execution output
 */
export interface CodeExecutionOutput {
  success: boolean
  output: string
  error?: string
  executionTime: number
}
