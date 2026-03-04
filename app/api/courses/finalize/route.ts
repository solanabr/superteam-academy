import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db'
import { PublicKey } from '@solana/web3.js'
import type { DbResult, EnrollmentCompletionRow, CourseRow, UserXpRow } from '@/lib/types/db'
import { tryCreateBackendSigner, getXpMint } from '@/lib/services/onchain.service'
import { syncEnrollment, syncXpBalance } from '@/lib/services/onchain-sync.service'

/* ─── Dev logger ─── */
const isDev = process.env.NODE_ENV !== 'production'
function devLog(tag: string, ...args: unknown[]) {
  if (isDev) console.log(`[api/courses/finalize:${tag}]`, ...args)
}

/**
 * POST /api/courses/finalize
 * Finalize a course: on-chain first (bonus XP + bitmap), then DB fallback
 */
export async function POST(request: NextRequest) {
  try {
    const { courseId, userId, walletAddress } = await request.json()

    if (!courseId || !userId || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing courseId, userId, or walletAddress' },
        { status: 400 }
      )
    }

    // Validate wallet address
    try {
      new PublicKey(walletAddress)
    } catch {
      return NextResponse.json(
        { error: 'Invalid wallet address' },
        { status: 400 }
      )
    }

    const db = getDatabase()

    // Get enrollment
    const { data: enrollment, error: enrollmentError } = (await db
      .from('enrollments')
      .select('id, lessons_completed, completed_at')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle()) as DbResult<EnrollmentCompletionRow>

    if (enrollmentError || !enrollment) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      )
    }

    // Check if already finalized
    if (enrollment?.completed_at) {
      return NextResponse.json(
        {
          success: true,
          message: 'Course already finalized',
          alreadyFinalized: true,
        },
        { status: 200 }
      )
    }

    // Get course to verify lesson count
    const { data: course, error: courseError } = (await db
      .from('courses')
      .select('id, total_lessons, xp_reward, title')
      .eq('id', courseId)
      .maybeSingle()) as DbResult<CourseRow>

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    const lessonsCompleted = enrollment?.lessons_completed || 0
    const totalLessons = course?.total_lessons || 0

    // Check if all lesson are completed
    if (lessonsCompleted < totalLessons) {
      return NextResponse.json(
        {
          error: 'Not all lessons completed',
          lessonsCompleted,
          totalLessons,
        },
        { status: 400 }
      )
    }

    // ──────────────────────────────────────────────
    // ON-CHAIN: Finalize course (mints bonus XP on-chain)
    // ──────────────────────────────────────────────
    let onchainTxId: string | null = null
    let onchainError: string | null = null

    const signer = tryCreateBackendSigner()
    if (signer) {
      try {
        const xpMint = getXpMint()
        const learner = new PublicKey(walletAddress)

        devLog('onchain', '🔗 Calling finalizeCourse', { courseId, wallet: walletAddress })

        onchainTxId = await signer.finalizeCourse(courseId, learner, xpMint)

        devLog('onchain', '✅ Course finalized on-chain!', { txId: onchainTxId })
      } catch (err) {
        onchainError = err instanceof Error ? err.message : String(err)
        devLog('onchain', '⚠️ On-chain finalize failed, falling back to DB-only:', onchainError)
      }
    } else {
      devLog('onchain', '⏭️ Signer not configured — DB-only mode')
    }

    // ──────────────────────────────────────────────
    // DB: Mark course as completed (always runs)
    // ──────────────────────────────────────────────

    // Mark course as completed
    const completedAt = new Date().toISOString()
    // @ts-ignore
    const { error: updateError } = (await db
      .from('enrollments')
      // @ts-expect-error
      .update({ completed_at: completedAt })
      .eq('id', enrollment?.id)) as DbResult<null>

    if (updateError) {
      console.error('Failed to update enrollment:', updateError)
      return NextResponse.json(
        { error: 'Failed to finalize course' },
        { status: 500 }
      )
    }

    // Award completion bonus XP (50% of course XP)
    const bonusXp = Math.floor((course?.xp_reward || 0) * 0.5)

    if (bonusXp > 0) {
      // @ts-ignore
      await (db
        .from('user_xp_history')
        // @ts-expect-error
        .insert({
          user_id: userId,
          course_id: courseId,
          lesson_id: `completion-bonus-${courseId}`,
          xp_amount: bonusXp,
          reason: 'course_completion_bonus',
          created_at: new Date().toISOString(),
        }) as DbResult<null>)

      // Update user total XP
      const { data: currentXp } = (await db
        .from('users')
        .select('total_xp')
        .eq('id', userId)
        .maybeSingle()) as DbResult<UserXpRow>

      const newTotalXp = (currentXp?.total_xp || 0) + bonusXp

      // @ts-ignore - Supabase type generation issue
      await (db
        .from('users')
        // @ts-ignore
        .update({ total_xp: newTotalXp })
        .eq('id', userId)) as DbResult<null>
    }

    // ──────────────────────────────────────────────
    // POST-TX SYNC: Reconcile on-chain enrollment + XP → DB
    // ──────────────────────────────────────────────
    let enrollmentSync = null
    let xpSync = null
    if (onchainTxId) {
      try {
        enrollmentSync = await syncEnrollment(userId, walletAddress, courseId)
        xpSync = await syncXpBalance(userId, walletAddress)
        devLog('sync', '✅ Post-finalize sync:', { enrollmentSync, xpSync })
      } catch (err) {
        devLog('sync', '⚠️ Post-finalize sync failed (non-fatal):', err)
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Course finalized successfully',
        completedAt,
        bonusXp,
        courseTitle: course?.title,
        readyForCredential: true,
        onchain: {
          txId: onchainTxId,
          error: onchainError,
          mode: onchainTxId ? 'on-chain' : 'db-only',
        },
        sync: {
          enrollment: enrollmentSync,
          xp: xpSync ? { onchainXp: xpSync.onchainXp, resolvedXp: xpSync.resolvedXp } : null,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error finalizing course:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
