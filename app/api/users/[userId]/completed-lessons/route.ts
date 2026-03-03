import { NextRequest, NextResponse } from 'next/server'

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

async function resolveCanonicalUserId(
  supabase: NonNullable<Awaited<ReturnType<typeof getSupabaseClient>>>,
  rawUserId: string
): Promise<string | null> {
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

/**
 * GET /api/users/[userId]/completed-lessons?courseId=xxx
 * Returns array of completed lesson IDs for a user in a specific course
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = decodeURIComponent(params.userId || '')
    const courseId = request.nextUrl.searchParams.get('courseId')

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json([], { status: 200 })
    }

    const canonicalUserId = await resolveCanonicalUserId(supabase, userId)
    const candidateUserIds = Array.from(
      new Set([canonicalUserId, userId, userId.toLowerCase()].filter(Boolean))
    ) as string[]

    let query = supabase
      .from('lesson_progress')
      .select('lesson_id')
      .in('user_id', candidateUserIds)

    if (courseId) {
      query = query.eq('course_id', courseId)
    }

    const { data, error } = await query

    if (error) throw error

    const lessonIds = (data || []).map((row: { lesson_id: string }) => row.lesson_id)
    return NextResponse.json(lessonIds, { status: 200 })
  } catch (error) {
    console.error('Error fetching completed lessons:', error)
    return NextResponse.json([], { status: 200 })
  }
}
