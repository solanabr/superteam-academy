import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { PublicKey } from '@solana/web3.js'
import type { SupabaseClient, EnrollmentRow } from '@/lib/types/db'
import { tryCreateBackendSigner, getXpMint } from '@/lib/services/onchain.service'
import { syncXpBalance } from '@/lib/services/onchain-sync.service'

/* ─── Dev logger ─── */
const isDev = process.env.NODE_ENV !== 'production'
function devLog(tag: string, ...args: unknown[]) {
  if (isDev) console.log(`[api/xp/award:${tag}]`, ...args)
}

function normalizeUserId(rawUserId: string): string {
  return rawUserId.includes('@') ? rawUserId.toLowerCase() : rawUserId
}

function userIdCandidates(rawUserId: string): string[] {
  const normalized = normalizeUserId(rawUserId)
  return Array.from(new Set([normalized, rawUserId, rawUserId.toLowerCase()]))
}

async function resolveCanonicalUserId(supabase: SupabaseClient, rawUserId: string): Promise<string | null> {
  for (const candidate of userIdCandidates(rawUserId)) {
    let { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('id', candidate)
      .maybeSingle()

    if (!user) {
      const byEmail = await supabase
        .from('users')
        .select('id')
        .eq('email', candidate)
        .maybeSingle()
      user = byEmail.data
    }

    if (!user) {
      const byWallet = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', candidate)
        .maybeSingle()
      user = byWallet.data
    }

    if (user?.id) {
      return user.id
    }
  }

  return null
}

async function ensureCanonicalUserId(supabase: SupabaseClient, rawUserId: string): Promise<string> {
  const existingId = await resolveCanonicalUserId(supabase, rawUserId)
  if (existingId) return existingId

  const normalizedUserId = normalizeUserId(rawUserId)
  const walletLikeId = !normalizedUserId.includes('@')
  const { error: userInsertError } = await supabase.from('users').insert({
    id: normalizedUserId,
    email: walletLikeId ? null : normalizedUserId,
    display_name: walletLikeId ? `${String(normalizedUserId).slice(0, 8)}...` : null,
    total_xp: 0,
    level: 0,
    current_streak: 0,
  })

  if (!userInsertError) return normalizedUserId

  const resolvedAfterInsert = await resolveCanonicalUserId(supabase, rawUserId)
  if (resolvedAfterInsert) return resolvedAfterInsert

  throw userInsertError
}

async function findEnrollment(
  supabase: SupabaseClient,
  userIds: string[],
  courseId: string
): Promise<EnrollmentRow | null> {
  for (const candidateUserId of userIds) {
    const { data: enrollment, error } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', candidateUserId)
      .eq('course_id', courseId)
      .maybeSingle()

    if (error) throw error
    if (enrollment) return enrollment
  }

  return null
}

/**
 * Resolve a wallet address for a user.
 * Returns the wallet_address from the users table, or the userId itself if it looks like a pubkey.
 */
async function resolveWalletAddress(
  supabase: SupabaseClient,
  canonicalUserId: string,
  rawUserId: string
): Promise<string | null> {
  // If the raw userId looks like a Solana pubkey (base58, 32-44 chars), use it directly
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(rawUserId)) {
    try {
      new PublicKey(rawUserId)
      return rawUserId
    } catch { /* not a valid pubkey */ }
  }

  // Look up wallet_address from users table
  const { data: user } = await supabase
    .from('users')
    .select('wallet_address')
    .eq('id', canonicalUserId)
    .maybeSingle()

  return user?.wallet_address || null
}

export async function POST(request: NextRequest) {
  try {
    const { userId, courseId, lessonId, xpAmount } = await request.json()

    if (!userId || !courseId || !lessonId || xpAmount === undefined || xpAmount <= 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local' },
        { status: 500 }
      )
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const canonicalUserId = await ensureCanonicalUserId(supabase, String(userId))
    const candidateUserIds = Array.from(
      new Set([canonicalUserId, ...userIdCandidates(String(userId))])
    )

    // Get enrollment
    const enrollment = await findEnrollment(supabase, candidateUserIds, String(courseId))
    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    // Check if lesson already completed
    const { data: existing, error: existingError } = await supabase
      .from('lesson_progress')
      .select('id')
      .in('user_id', candidateUserIds)
      .eq('course_id', courseId)
      .eq('lesson_id', lessonId)
      .limit(1)

    if (existingError) throw existingError

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'Lesson already completed' }, { status: 400 })
    }

    // ──────────────────────────────────────────────
    // ON-CHAIN: Mint XP tokens via reward_xp
    // ──────────────────────────────────────────────
    let onchainTxId: string | null = null
    let onchainError: string | null = null

    // Determine wallet address — userId may be a wallet pubkey or an email/uuid
    const walletAddress = await resolveWalletAddress(supabase, canonicalUserId, String(userId))

    if (walletAddress) {
      const signer = tryCreateBackendSigner()
      if (signer) {
        try {
          const xpMint = getXpMint()
          const recipient = new PublicKey(walletAddress)
          const reason = lessonId.startsWith('enroll-')
            ? `enrollment-bonus:${courseId}`
            : `lesson:${courseId}:${lessonId}`

          devLog('onchain', '🔗 Calling reward_xp', { recipient: walletAddress, amount: xpAmount, reason })

          onchainTxId = await signer.rewardXp(recipient, xpMint, xpAmount, reason)

          devLog('onchain', '✅ On-chain XP minted!', { txId: onchainTxId })
        } catch (err) {
          onchainError = err instanceof Error ? err.message : String(err)
          devLog('onchain', '⚠️ On-chain XP failed, falling back to DB-only:', onchainError)
        }
      } else {
        devLog('onchain', '⏭️ Signer not configured — DB-only mode')
      }
    } else {
      devLog('onchain', '⏭️ No wallet address for user — DB-only mode')
    }

    // ──────────────────────────────────────────────
    // DB: Record lesson completion + XP (always runs)
    // ──────────────────────────────────────────────

    // Record lesson completion
    const { error: lessonInsertError } = await supabase.from('lesson_progress').insert({
      id: randomUUID(),
      user_id: canonicalUserId,
      lesson_id: lessonId,
      course_id: courseId,
      completed: 1,
      xp_earned: xpAmount,
      completed_at: new Date().toISOString(),
    })
    if (lessonInsertError) throw lessonInsertError

    // Update enrollment XP
    const hasTotalXPEarned = Object.prototype.hasOwnProperty.call(enrollment, 'total_xp_earned')
    const hasLegacyXpEarned = Object.prototype.hasOwnProperty.call(enrollment, 'xp_earned')
    const currentEnrollmentXp = hasTotalXPEarned
      ? enrollment.total_xp_earned || 0
      : enrollment.xp_earned || 0
    const newXpEarned = currentEnrollmentXp + xpAmount

    const enrollmentUpdates: Record<string, number> = {}
    if (hasTotalXPEarned || !hasLegacyXpEarned) {
      enrollmentUpdates.total_xp_earned = newXpEarned
    }
    if (hasLegacyXpEarned) {
      enrollmentUpdates.xp_earned = newXpEarned
    }

    const { error: updateEnrollmentError } = await supabase
      .from('enrollments')
      .update(enrollmentUpdates)
      .eq('id', enrollment.id)
    if (updateEnrollmentError) throw updateEnrollmentError

    // Record XP transaction
    const { error: txInsertError } = await supabase.from('xp_transactions').insert({
      id: randomUUID(),
      user_id: canonicalUserId,
      amount: xpAmount,
      reason: lessonId.startsWith('enroll-')
        ? `Enrollment bonus for course: ${courseId}`
        : `Completed lesson: ${lessonId}`,
      course_id: courseId,
      lesson_id: lessonId,
      created_at: new Date().toISOString(),
    })
    if (txInsertError) throw txInsertError

    // Update user total XP
    const { data: user } = await supabase
      .from('users')
      .select('total_xp')
      .eq('id', canonicalUserId)
      .maybeSingle()

    const totalXp = (user?.total_xp || 0) + xpAmount
    const level = Math.floor(Math.sqrt(totalXp / 100))

    const { error: updateUserError } = await supabase
      .from('users')
      .update({ total_xp: totalXp, level })
      .eq('id', canonicalUserId)
    if (updateUserError) throw updateUserError

    // ──────────────────────────────────────────────
    // POST-TX SYNC: Reconcile on-chain XP → DB
    // ──────────────────────────────────────────────
    let syncResult = null
    if (onchainTxId && walletAddress) {
      try {
        syncResult = await syncXpBalance(canonicalUserId, walletAddress)
        devLog('sync', '✅ Post-TX XP sync:', syncResult)
      } catch (err) {
        devLog('sync', '⚠️ Post-TX sync failed (non-fatal):', err)
      }
    }

    return NextResponse.json(
      {
        xpAwarded: xpAmount,
        totalXp,
        level,
        message: 'XP awarded successfully',
        onchain: {
          txId: onchainTxId,
          error: onchainError,
          mode: onchainTxId ? 'on-chain' : 'db-only',
        },
        sync: syncResult ? {
          onchainXp: syncResult.onchainXp,
          dbXp: syncResult.resolvedXp,
          synced: syncResult.synced,
        } : null,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('XP award error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to award XP' },
      { status: 500 }
    )
  }
}
