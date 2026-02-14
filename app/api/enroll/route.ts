import { NextResponse } from 'next/server'
import { courseService } from '@/lib/services/course.service'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  console.log('[API] POST /api/enroll');
  try {
    const { courseId } = await req.json()
    console.log('[API] courseId:', courseId);
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    console.log('[API] user:', user?.id);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const enrollment = await courseService.enrollUser(user.id, courseId)
    console.log('[API] enrollment:', enrollment?.id);
    return NextResponse.json({ enrollment })
  } catch (error) {
    console.error('[API] Enrollment error:', error);
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 })
  }
}
