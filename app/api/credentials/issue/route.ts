import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/backend/src/db'
import { PublicKey } from '@solana/web3.js'
import crypto from 'crypto'
import type { DbResult, EnrollmentCompletionRow, CredentialRow, UserXpRow } from '@/lib/types/db'

/**
 * POST /api/credentials/issue
 * Issue an on-chain credential (cNFT) for a completed course
 */
export async function POST(request: NextRequest) {
  try {
    const { courseId, userId, courseName, walletAddress } = await request.json()

    if (!courseId || !userId || !courseName || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Check if course is finalized
    const { data: enrollment, error: enrollmentError } = (await db
      .from('enrollments')
      .select('id, completed_at, lessons_completed')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle()) as DbResult<EnrollmentCompletionRow>

    if (enrollmentError || !enrollment) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      )
    }

    if (!enrollment?.completed_at) {
      return NextResponse.json(
        { error: 'Course not finalized. Please finalize the course first.' },
        { status: 400 }
      )
    }

    // Check if credential already issued
    const { data: existingCredential } = (await db
      .from('credentials')
      .select('id, asset_id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle()) as DbResult<CredentialRow>

    if (existingCredential) {
      return NextResponse.json(
        {
          success: true,
          message: 'Credential already issued',
          assetId: existingCredential?.asset_id,
          alreadyIssued: true,
        },
        { status: 200 }
      )
    }

    // Get user total XP and level
    const { data: user } = (await db
      .from('users')
      .select('total_xp, level')
      .eq('id', userId)
      .maybeSingle()) as DbResult<UserXpRow>

    const totalXp = user?.total_xp || 0
    const level = user?.level || 1

    // Create mock credential metadata
    // In production, this would mint an actual cNFT on-chain
    const credentialId = crypto.randomUUID()
    const assetId = `cred-${credentialId.substring(0, 8).toUpperCase()}`

    // @ts-ignore - Supabase type generation issue
    const { error: insertError } = (await db.from('credentials').insert({
      id: credentialId,
      user_id: userId,
      course_id: courseId,
      asset_id: assetId,
      name: courseName,
      level: level,
      courses_completed: 1,
      total_xp: totalXp,
      track_id: 'course-completion',
      minted_at: new Date().toISOString(),
    })) as DbResult<null>

    if (insertError) {
      console.error('Failed to create credential record:', insertError)
      return NextResponse.json(
        { error: 'Failed to issue credential' },
        { status: 500 }
      )
    }

    // Award credential achievement badge if applicable
    // This would trigger achievement checks
    await awardCredentialAchievement(db, userId, courseId)

    return NextResponse.json(
      {
        success: true,
        message: 'Credential issued successfully',
        credential: {
          id: credentialId,
          assetId,
          name: courseName,
          level,
          totalXp,
          mintedAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error issuing credential:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Helper: Award credential-related achievements
 */
async function awardCredentialAchievement(db: ReturnType<typeof getDatabase>, userId: string, courseId: string) {
  try {
    // Count total credentials for this user
    const { data: credentials } = await db
      .from('credentials')
      .select('id')
      .eq('user_id', userId)

    const credentialCount = credentials?.length || 0

    // Award achievements based on credential count
    if (credentialCount === 1) {
      // First credential
      await recordAchievement(db, userId, 'first_credential', 50)
    } else if (credentialCount === 5) {
      // 5 credentials
      await recordAchievement(db, userId, 'credential_collector', 250)
    }
  } catch (error) {
    console.warn('Failed to award credential achievement:', error)
  }
}

/**
 * Helper: Record achievement unlock
 */
async function recordAchievement(
  db: ReturnType<typeof getDatabase>,
  userId: string,
  achievementId: string,
  xpBonus: number
) {
  try {
    const { error } = await (db.from('achievement_progress') as ReturnType<typeof db.from>).insert({
      user_id: userId,
      achievement_id: achievementId,
      unlocked_at: new Date().toISOString(),
    })

    if (!error && xpBonus) {
      // Award XP for achievement
      const { data: user } = await db
        .from('users')
        .select('total_xp')
        .eq('id', userId)
        .maybeSingle() as { data: { total_xp: number } | null; error: unknown }

      const newXp = (user?.total_xp || 0) + xpBonus

      await (db
        .from('users') as ReturnType<typeof db.from>)
        .update({ total_xp: newXp })
        .eq('id', userId)
    }
  } catch (error) {
    console.warn('Failed to record achievement:', error)
  }
}
