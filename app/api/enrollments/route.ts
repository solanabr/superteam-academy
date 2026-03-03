import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import type { SupabaseClient } from '@/lib/types/db'

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
): Promise<{ id: string; course_id: string } | null> {
  for (const candidateUserId of userIds) {
    const { data: enrollment, error } = await supabase
      .from('enrollments')
      .select('id, course_id')
      .eq('user_id', candidateUserId)
      .eq('course_id', courseId)
      .maybeSingle()

    if (error) throw error
    if (enrollment) return enrollment
  }

  return null
}

export async function POST(request: NextRequest) {
  try {
    const { userId, courseId } = await request.json()

    if (!userId || !courseId) {
      return NextResponse.json({ error: 'Missing userId or courseId' }, { status: 400 })
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

    // Check if already enrolled
    const existing = await findEnrollment(supabase, candidateUserIds, String(courseId))

    if (existing) {
      return NextResponse.json(existing, { status: 200 })
    }

    // Create enrollment
    const { data: enrollment, error: enrollError } = await supabase
      .from('enrollments')
      .insert({
        id: randomUUID(),
        user_id: canonicalUserId,
        course_id: courseId,
        enrolled_at: new Date().toISOString(),
        lessons_completed: 0,
        total_xp_earned: 0,
      })
      .select()
      .single()

    if (enrollError) throw enrollError

    return NextResponse.json(enrollment, { status: 201 })
  } catch (error) {
    console.error('Enrollment error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Enrollment failed' },
      { status: 500 }
    )
  }
}
