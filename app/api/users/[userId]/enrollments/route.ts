import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@/lib/types/db'

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

async function resolveCanonicalUserId(supabase: SupabaseClient, rawUserId: string): Promise<string | null> {
  const candidates = Array.from(new Set([rawUserId, rawUserId.toLowerCase()]))

  for (const candidate of candidates) {
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .or(`id.eq.${candidate},email.eq.${candidate},wallet_address.eq.${candidate}`)
      .maybeSingle()

    if (user?.id) {
      return user.id
    }
  }

  return null
}

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = decodeURIComponent(params.userId || '')

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const canonicalUserId = await resolveCanonicalUserId(supabase, userId)
    const candidateUserIds = Array.from(
      new Set([canonicalUserId, userId, userId.toLowerCase()].filter(Boolean))
    ) as string[]

    const { data: enrollments, error } = await supabase
      .from('enrollments')
      .select('id, course_id, total_xp_earned, lessons_completed, enrolled_at, completed_at')
      .in('user_id', candidateUserIds)

    if (error) throw error

    return NextResponse.json(
      enrollments?.map(e => ({
        id: e.id,
        courseId: e.course_id,
        totalXPEarned: e.total_xp_earned,
        lessonsCompleted: e.lessons_completed,
        enrolledAt: e.enrolled_at,
        completedAt: e.completed_at,
      })) || [],
      { status: 200 }
    )
  } catch (error) {
    console.error('Enrollments fetch error:', error)
    return NextResponse.json([], { status: 200 })
  }
}
