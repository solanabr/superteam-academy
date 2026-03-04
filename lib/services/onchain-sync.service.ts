import { Connection, PublicKey } from '@solana/web3.js'
import { getAssociatedTokenAddressSync } from '@solana/spl-token'
import { TOKEN_2022_PROGRAM_ID } from '@/lib/anchor/constants'
import {
  getEnrollmentPda,
  getCoursePda,
} from '@/lib/anchor/pda'
import {
  countCompletedLessons,
  isCourseComplete,
  getCompletedLessonIndices,
} from '@/lib/anchor/types'
import type { Enrollment as OnChainEnrollment, Course as OnChainCourse } from '@/lib/anchor/types'
import { getServerConnection, getXpMint } from './onchain.service'
import { XpService } from './xp.service'

/* ─── Dev logger ─── */
const isDev = process.env.NODE_ENV !== 'production'
function syncLog(tag: string, ...args: unknown[]) {
  if (isDev) console.log(`[onchain-sync:${tag}]`, ...args)
}

/* ─── Helper: get Supabase admin client ─── */
async function getSupabase() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null
  }
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/* ─── Helper: get read-only Anchor program ─── */
async function getReadOnlyProgram() {
  const { Program, AnchorProvider } = await import('@coral-xyz/anchor')
  const { IDL, PROGRAM_ID } = await import('@/lib/anchor')
  const { READ_ONLY_WALLET } = await import('@/lib/types/shared')
  const connection = getServerConnection()
  const provider = new AnchorProvider(connection, READ_ONLY_WALLET as any, { commitment: 'confirmed' })
  const idl = { ...(IDL as Record<string, unknown>), address: PROGRAM_ID.toBase58() }
  return new Program(idl as any, provider)
}

// ═══════════════════════════════════════════════════════════════
// 1. Sync XP balance: read Token-2022 ATA → update users.total_xp
// ═══════════════════════════════════════════════════════════════

export interface XpSyncResult {
  onchainXp: number
  dbXp: number
  synced: boolean
  /** The authoritative total_xp written to DB (max of both) */
  resolvedXp: number
}

/**
 * Read on-chain XP token balance and reconcile with DB.
 * Uses max(on-chain, DB) so neither source loses data.
 */
export async function syncXpBalance(
  userId: string,
  walletAddress: string
): Promise<XpSyncResult> {
  syncLog('xp', `Syncing XP for user=${userId}, wallet=${walletAddress}`)

  const supabase = await getSupabase()
  if (!supabase) {
    syncLog('xp', '⏭️ Supabase not configured')
    return { onchainXp: 0, dbXp: 0, synced: false, resolvedXp: 0 }
  }

  // Read on-chain XP
  const connection = getServerConnection()
  const xpMint = getXpMint()
  const xpService = new XpService(connection)
  let onchainXp = 0
  try {
    onchainXp = await xpService.getXpBalance(new PublicKey(walletAddress), xpMint)
    syncLog('xp', `On-chain XP balance: ${onchainXp}`)
  } catch (err) {
    syncLog('xp', '⚠️ Failed to read on-chain XP:', err)
  }

  // Read DB XP
  const { data: user } = await supabase
    .from('users')
    .select('total_xp, level')
    .eq('id', userId)
    .maybeSingle()

  const dbXp = user?.total_xp || 0
  syncLog('xp', `DB XP: ${dbXp}`)

  // Reconcile: use the higher of the two
  const resolvedXp = Math.max(onchainXp, dbXp)
  const level = Math.floor(Math.sqrt(resolvedXp / 100))

  if (resolvedXp !== dbXp) {
    syncLog('xp', `Updating DB: ${dbXp} → ${resolvedXp} (level ${level})`)
    await supabase
      .from('users')
      .update({ total_xp: resolvedXp, level })
      .eq('id', userId)
  }

  syncLog('xp', '✅ XP sync complete', { onchainXp, dbXp, resolvedXp })
  return { onchainXp, dbXp, synced: true, resolvedXp }
}

// ═══════════════════════════════════════════════════════════════
// 2. Sync Enrollment: read on-chain enrollment → update DB
// ═══════════════════════════════════════════════════════════════

export interface EnrollmentSyncResult {
  synced: boolean
  lessonsCompleted: number
  isComplete: boolean
  completedAt: number | null
}

/**
 * Read on-chain enrollment PDA and reconcile with DB enrollment.
 * On-chain is authoritative for lesson bitmap and completion timestamp.
 */
export async function syncEnrollment(
  userId: string,
  walletAddress: string,
  courseId: string
): Promise<EnrollmentSyncResult> {
  syncLog('enrollment', `Syncing enrollment user=${userId}, course=${courseId}`)

  const supabase = await getSupabase()
  if (!supabase) {
    return { synced: false, lessonsCompleted: 0, isComplete: false, completedAt: null }
  }

  let onchainEnrollment: OnChainEnrollment | null = null
  let onchainCourse: OnChainCourse | null = null

  try {
    const program = await getReadOnlyProgram()
    const learner = new PublicKey(walletAddress)
    const [enrollmentPda] = getEnrollmentPda(courseId, learner)
    const [coursePda] = getCoursePda(courseId)

    onchainEnrollment = await (program.account as any).enrollment.fetchNullable(enrollmentPda) as OnChainEnrollment | null
    if (onchainEnrollment) {
      onchainCourse = await (program.account as any).course.fetchNullable(coursePda) as OnChainCourse | null
    }
  } catch (err) {
    syncLog('enrollment', '⚠️ Failed to read on-chain enrollment:', err)
  }

  if (!onchainEnrollment || !onchainCourse) {
    syncLog('enrollment', '⏭️ No on-chain enrollment found')
    return { synced: false, lessonsCompleted: 0, isComplete: false, completedAt: null }
  }

  const completedCount = countCompletedLessons(onchainEnrollment.lessonFlags)
  const isComplete = isCourseComplete(onchainEnrollment.lessonFlags, onchainCourse.lessonCount)
  const completedAt = onchainEnrollment.completedAt ?? null

  syncLog('enrollment', `On-chain: ${completedCount} lessons, complete=${isComplete}`)

  // Find DB enrollment
  const { data: dbEnrollment } = await supabase
    .from('enrollments')
    .select('id, lessons_completed, completed_at')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle()

  if (dbEnrollment) {
    // Update DB if on-chain has more progress
    const updates: Record<string, unknown> = {}
    if (completedCount > (dbEnrollment.lessons_completed || 0)) {
      updates.lessons_completed = completedCount
    }
    if (isComplete && completedAt && !dbEnrollment.completed_at) {
      updates.completed_at = new Date(completedAt * 1000).toISOString()
    }
    if (Object.keys(updates).length > 0) {
      syncLog('enrollment', 'Updating DB enrollment:', updates)
      await supabase
        .from('enrollments')
        .update(updates)
        .eq('id', dbEnrollment.id)
    }

    // Sync individual lesson_progress rows from on-chain bitmap
    const completedIndices = getCompletedLessonIndices(onchainEnrollment.lessonFlags, onchainCourse.lessonCount)
    for (const idx of completedIndices) {
      const lessonId = `lesson-${idx}`
      await supabase
        .from('lesson_progress')
        .upsert(
          {
            id: crypto.randomUUID(),
            user_id: userId,
            course_id: courseId,
            lesson_id: lessonId,
            completed: 1,
            xp_earned: 0,
            completed_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,course_id,lesson_id', ignoreDuplicates: true }
        )
    }
  }

  syncLog('enrollment', '✅ Enrollment sync complete')
  return { synced: true, lessonsCompleted: completedCount, isComplete, completedAt }
}

// ═══════════════════════════════════════════════════════════════
// 3. Sync Credential: verify on-chain asset → update DB
// ═══════════════════════════════════════════════════════════════

export interface CredentialSyncResult {
  synced: boolean
  assetVerified: boolean
  assetAddress: string | null
}

/**
 * After credential issuance, verify the on-chain enrollment now has
 * credentialAsset set, and update the DB record accordingly.
 */
export async function syncCredential(
  userId: string,
  walletAddress: string,
  courseId: string,
  expectedAssetAddress?: string
): Promise<CredentialSyncResult> {
  syncLog('credential', `Syncing credential user=${userId}, course=${courseId}`)

  const supabase = await getSupabase()
  if (!supabase) {
    return { synced: false, assetVerified: false, assetAddress: null }
  }

  let onchainAssetAddress: string | null = null

  try {
    const program = await getReadOnlyProgram()
    const learner = new PublicKey(walletAddress)
    const [enrollmentPda] = getEnrollmentPda(courseId, learner)

    const enrollment = await (program.account as any).enrollment.fetchNullable(enrollmentPda) as OnChainEnrollment | null
    if (enrollment?.credentialAsset) {
      onchainAssetAddress = enrollment.credentialAsset.toBase58()
      // PublicKey.default (all zeros) means no credential
      if (onchainAssetAddress === PublicKey.default.toBase58()) {
        onchainAssetAddress = null
      }
    }
  } catch (err) {
    syncLog('credential', '⚠️ Failed to read on-chain enrollment for credential:', err)
  }

  // Use expected asset address from TX result if on-chain read hasn't propagated
  const resolvedAssetAddress = onchainAssetAddress || expectedAssetAddress || null

  if (!resolvedAssetAddress) {
    syncLog('credential', '⏭️ No credential asset found on-chain')
    return { synced: false, assetVerified: false, assetAddress: null }
  }

  // Update DB credential record with verified on-chain asset_id
  const { data: credential } = await supabase
    .from('credentials')
    .select('id, asset_id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle()

  if (credential && credential.asset_id !== resolvedAssetAddress) {
    syncLog('credential', `Updating DB asset_id: ${credential.asset_id} → ${resolvedAssetAddress}`)
    await supabase
      .from('credentials')
      .update({ asset_id: resolvedAssetAddress })
      .eq('id', credential.id)
  }

  const verified = onchainAssetAddress === resolvedAssetAddress
  syncLog('credential', '✅ Credential sync complete', {
    assetAddress: resolvedAssetAddress,
    verified,
  })

  return {
    synced: true,
    assetVerified: verified,
    assetAddress: resolvedAssetAddress,
  }
}

// ═══════════════════════════════════════════════════════════════
// 4. Full sync: runs all three for a user+course
// ═══════════════════════════════════════════════════════════════

export interface FullSyncResult {
  xp: XpSyncResult
  enrollment: EnrollmentSyncResult
  credential: CredentialSyncResult
}

/**
 * Run a full on-chain ↔ DB sync for a user and course.
 * Useful as a periodic reconciliation or after any on-chain operation.
 */
export async function fullSync(
  userId: string,
  walletAddress: string,
  courseId: string
): Promise<FullSyncResult> {
  syncLog('full', `Full sync: user=${userId}, wallet=${walletAddress}, course=${courseId}`)

  const [xp, enrollment, credential] = await Promise.all([
    syncXpBalance(userId, walletAddress),
    syncEnrollment(userId, walletAddress, courseId),
    syncCredential(userId, walletAddress, courseId),
  ])

  syncLog('full', '✅ Full sync complete', {
    xp: { onchain: xp.onchainXp, db: xp.dbXp, resolved: xp.resolvedXp },
    enrollment: { lessons: enrollment.lessonsCompleted, complete: enrollment.isComplete },
    credential: { asset: credential.assetAddress, verified: credential.assetVerified },
  })

  return { xp, enrollment, credential }
}
