import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey } from '@solana/web3.js'
import { Program, AnchorProvider, type Idl } from '@coral-xyz/anchor'
import { randomUUID } from 'crypto'
import type { SupabaseClient } from '@/lib/types/db'
import { IDL, PROGRAM_ID, getEnrollmentPda, getCoursePda } from '@/lib/anchor'
import { countCompletedLessons, getCompletedLessonIndices, isCourseComplete } from '@/lib/anchor/types'
import type { Enrollment as OnChainEnrollment, Course as OnChainCourse } from '@/lib/anchor/types'

// Minimal read-only wallet for Anchor provider
const READ_ONLY_WALLET = {
  publicKey: PublicKey.default,
  signTransaction: async () => { throw new Error('Read-only') },
  signAllTransactions: async () => { throw new Error('Read-only') },
}

const PROGRAM_IDL = {
  ...(IDL as Record<string, unknown>),
  address: PROGRAM_ID.toBase58(),
}

async function getSupabaseClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null
  }
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function getConnection(): Connection {
  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com'
  return new Connection(rpcUrl, 'confirmed')
}

function getProgram(): Program {
  const connection = getConnection()
  const provider = new AnchorProvider(connection, READ_ONLY_WALLET as any, { commitment: 'confirmed' })
  return new Program(PROGRAM_IDL as Idl, provider)
}

async function resolveCanonicalUserId(supabase: SupabaseClient, rawUserId: string): Promise<string | null> {
  const candidates = Array.from(new Set([rawUserId, rawUserId.toLowerCase()]))
  for (const candidate of candidates) {
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .or(`id.eq.${candidate},email.eq.${candidate},wallet_address.eq.${candidate}`)
      .maybeSingle()
    if (user?.id) return user.id
  }
  return null
}

async function ensureCanonicalUserId(supabase: SupabaseClient, rawUserId: string, walletAddress?: string): Promise<string> {
  const existingId = await resolveCanonicalUserId(supabase, rawUserId)
  if (existingId) {
    // Also link wallet address to existing user if not already linked
    if (walletAddress) {
      await supabase.from('users').update({ wallet_address: walletAddress }).eq('id', existingId).is('wallet_address', null)
    }
    return existingId
  }

  const normalizedUserId = rawUserId.includes('@') ? rawUserId.toLowerCase() : rawUserId
  const walletLikeId = !normalizedUserId.includes('@')
  const { error: userInsertError } = await supabase.from('users').insert({
    id: normalizedUserId,
    email: walletLikeId ? null : normalizedUserId,
    wallet_address: walletAddress || (walletLikeId ? normalizedUserId : null),
    display_name: walletLikeId ? `${normalizedUserId.slice(0, 8)}...` : null,
    total_xp: 0,
    level: 0,
    current_streak: 0,
  })

  if (!userInsertError) return normalizedUserId

  const resolvedAfterInsert = await resolveCanonicalUserId(supabase, rawUserId)
  if (resolvedAfterInsert) return resolvedAfterInsert

  throw userInsertError
}

interface SyncRequest {
  userId: string
  walletAddress: string
  courseId: string
  /** Optional: on-chain course ID if different from DB courseId */
  onchainCourseId?: string
}

interface SyncResult {
  synced: boolean
  enrollment: {
    courseId: string
    lessonsCompleted: number
    isComplete: boolean
    completedAt: number | null
  } | null
  message: string
}

/**
 * POST /api/enrollments/sync
 *
 * Reads on-chain enrollment state and syncs it to the DB.
 * Creates DB enrollment if it doesn't exist but on-chain does.
 * Updates lesson count & completion status from on-chain data.
 */
export async function POST(request: NextRequest): Promise<NextResponse<SyncResult | { error: string }>> {
  try {
    const body: SyncRequest = await request.json()
    const { userId, walletAddress, courseId, onchainCourseId } = body

    if (!userId || !walletAddress || !courseId) {
      return NextResponse.json({ error: 'Missing userId, walletAddress, or courseId' }, { status: 400 })
    }

    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ synced: false, enrollment: null, message: 'Supabase not configured' }, { status: 200 })
    }

    // 1. Read on-chain enrollment
    let onchainEnrollment: OnChainEnrollment | null = null
    let onchainCourse: OnChainCourse | null = null
    const lookupCourseId = onchainCourseId || courseId

    try {
      const program = getProgram()
      const learnerPubkey = new PublicKey(walletAddress)
      const [enrollmentPda] = getEnrollmentPda(lookupCourseId, learnerPubkey)

      onchainEnrollment = await (program.account as any).enrollment.fetchNullable(enrollmentPda) as OnChainEnrollment | null

      if (onchainEnrollment) {
        const [coursePda] = getCoursePda(lookupCourseId)
        onchainCourse = await (program.account as any).course.fetchNullable(coursePda) as OnChainCourse | null
      }
    } catch {
      // On-chain read failed — program may not be deployed. Continue with DB-only.
    }

    // 2. Resolve user in DB
    const canonicalUserId = await ensureCanonicalUserId(supabase, userId, walletAddress)

    // 3. Check existing DB enrollment
    const candidateUserIds = Array.from(
      new Set([canonicalUserId, userId, userId.toLowerCase()].filter(Boolean))
    )

    let dbEnrollment: { id: string; lessons_completed: number; completed_at: string | null } | null = null
    for (const uid of candidateUserIds) {
      const { data } = await supabase
        .from('enrollments')
        .select('id, lessons_completed, completed_at')
        .eq('user_id', uid)
        .eq('course_id', courseId)
        .maybeSingle()
      if (data) {
        dbEnrollment = data
        break
      }
    }

    // 4. If on-chain enrollment exists but DB doesn't → create it
    if (onchainEnrollment && !dbEnrollment) {
      const completedCount = onchainCourse
        ? countCompletedLessons(onchainEnrollment.lessonFlags)
        : 0
      const isComplete = onchainCourse
        ? isCourseComplete(onchainEnrollment.lessonFlags, onchainCourse.lessonCount)
        : false

      const { data: newRow, error: insertError } = await supabase
        .from('enrollments')
        .insert({
          id: randomUUID(),
          user_id: canonicalUserId,
          course_id: courseId,
          enrolled_at: new Date(onchainEnrollment.enrolledAt * 1000).toISOString(),
          lessons_completed: completedCount,
          total_xp_earned: 0,
          completed_at: isComplete && onchainEnrollment.completedAt
            ? new Date(onchainEnrollment.completedAt * 1000).toISOString()
            : null,
        })
        .select('id, lessons_completed, completed_at')
        .single()

      if (insertError) {
        console.error('Failed to create DB enrollment from on-chain data:', insertError)
      } else {
        dbEnrollment = newRow
      }
    }

    // 5. If both exist → sync on-chain progress to DB (on-chain is authoritative for progress)
    if (onchainEnrollment && onchainCourse && dbEnrollment) {
      const completedCount = countCompletedLessons(onchainEnrollment.lessonFlags)
      const isComplete = isCourseComplete(onchainEnrollment.lessonFlags, onchainCourse.lessonCount)

      // Only update DB if on-chain has more progress
      if (completedCount > (dbEnrollment.lessons_completed || 0)) {
        const updates: Record<string, unknown> = {
          lessons_completed: completedCount,
        }

        if (isComplete && onchainEnrollment.completedAt && !dbEnrollment.completed_at) {
          updates.completed_at = new Date(onchainEnrollment.completedAt * 1000).toISOString()
        }

        await supabase
          .from('enrollments')
          .update(updates)
          .eq('id', dbEnrollment.id)

        dbEnrollment.lessons_completed = completedCount
      }

      // Sync individual lesson_progress rows from on-chain bitmap
      const completedIndices = getCompletedLessonIndices(onchainEnrollment.lessonFlags, onchainCourse.lessonCount)
      for (const idx of completedIndices) {
        const lessonId = `lesson-${idx}`
        // Upsert — don't fail on conflict
        await supabase
          .from('lesson_progress')
          .upsert(
            {
              id: randomUUID(),
              user_id: canonicalUserId,
              course_id: courseId,
              lesson_id: lessonId,
              completed: 1,
              xp_earned: 0,
              completed_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,course_id,lesson_id' }
          )
      }
    }

    // 6. Return sync result
    const finalCompleted = dbEnrollment?.lessons_completed ?? 0
    const finalIsComplete = onchainEnrollment && onchainCourse
      ? isCourseComplete(onchainEnrollment.lessonFlags, onchainCourse.lessonCount)
      : !!dbEnrollment?.completed_at

    return NextResponse.json({
      synced: true,
      enrollment: {
        courseId,
        lessonsCompleted: finalCompleted,
        isComplete: finalIsComplete,
        completedAt: onchainEnrollment?.completedAt ?? null,
      },
      message: onchainEnrollment
        ? 'On-chain enrollment synced to DB'
        : dbEnrollment
          ? 'DB enrollment exists (no on-chain enrollment found)'
          : 'No enrollment found on-chain or in DB',
    }, { status: 200 })
  } catch (error) {
    console.error('Enrollment sync error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    )
  }
}
