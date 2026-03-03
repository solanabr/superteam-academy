import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/backend/src/db'
import { PublicKey } from '@solana/web3.js'
import type { DbResult, EnrollmentCompletionRow, CourseRow, UserXpRow } from '@/lib/types/db'

/**
 * POST /api/courses/finalize
 * Finalize a course and prepare for credential issuance
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

    return NextResponse.json(
      {
        success: true,
        message: 'Course finalized successfully',
        completedAt,
        bonusXp,
        courseTitle: course?.title,
        readyForCredential: true,
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
