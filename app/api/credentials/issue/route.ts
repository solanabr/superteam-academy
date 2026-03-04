import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db'
import { PublicKey } from '@solana/web3.js'
import { BN } from '@coral-xyz/anchor'
import crypto from 'crypto'
import type { DbResult, EnrollmentCompletionRow, CredentialRow, UserXpRow } from '@/lib/types/db'
import { tryCreateBackendSigner, getXpMint } from '@/lib/services/onchain.service'
import { DEVNET } from '@/lib/anchor/constants'
import { syncCredential } from '@/lib/services/onchain-sync.service'

/* ─── Dev logger ─── */
const isDev = process.env.NODE_ENV !== 'production'
function devLog(tag: string, ...args: unknown[]) {
  if (isDev) console.log(`[api/credentials/issue:${tag}]`, ...args)
}

/**
 * POST /api/credentials/issue
 * Issue an on-chain credential (Metaplex Core NFT) for a completed course
 * Hybrid: on-chain first → DB always
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

    // ──────────────────────────────────────────────
    // ON-CHAIN: Issue a Metaplex Core credential NFT
    // ──────────────────────────────────────────────
    let onchainTxId: string | null = null
    let onchainAssetAddress: string | null = null
    let onchainError: string | null = null
    let assetId: string

    const signer = tryCreateBackendSigner()
    if (signer) {
      try {
        const learner = new PublicKey(walletAddress)
        const trackCollection = DEVNET.MOCK_TRACK_COLLECTION
        const metadataUri = `https://arweave.net/placeholder-${courseId}` // TODO: upload real metadata
        const credentialName = `${courseName} Certificate`

        devLog('onchain', '🔗 Calling issueCredential', {
          courseId,
          wallet: walletAddress,
          totalXp,
          collection: trackCollection.toBase58(),
        })

        const result = await signer.issueCredential(
          courseId,
          learner,
          trackCollection,
          credentialName,
          metadataUri,
          1, // coursesCompleted
          new BN(totalXp)
        )

        onchainTxId = result.txId
        onchainAssetAddress = result.assetAddress.toBase58()
        assetId = onchainAssetAddress // Use real on-chain asset address

        devLog('onchain', '✅ Credential issued on-chain!', {
          txId: onchainTxId,
          assetAddress: onchainAssetAddress,
        })
      } catch (err) {
        onchainError = err instanceof Error ? err.message : String(err)
        devLog('onchain', '⚠️ On-chain credential failed, falling back to mock:', onchainError)

        // Fallback: mock asset ID
        const credentialId = crypto.randomUUID()
        assetId = `cred-${credentialId.substring(0, 8).toUpperCase()}`
      }
    } else {
      devLog('onchain', '⏭️ Signer not configured — mock credential mode')
      const credentialId = crypto.randomUUID()
      assetId = `cred-${credentialId.substring(0, 8).toUpperCase()}`
    }

    // ──────────────────────────────────────────────
    // DB: Record credential (always runs)
    // ──────────────────────────────────────────────
    const dbCredentialId = crypto.randomUUID()

    // @ts-ignore - Supabase type generation issue
    const { error: insertError } = (await db.from('credentials').insert({
      id: dbCredentialId,
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

    // ──────────────────────────────────────────────
    // POST-TX SYNC: Verify credential on-chain → update DB
    // ──────────────────────────────────────────────
    let credentialSync = null
    if (onchainTxId && onchainAssetAddress) {
      try {
        credentialSync = await syncCredential(userId, walletAddress, courseId, onchainAssetAddress)
        devLog('sync', '✅ Post-credential sync:', credentialSync)
      } catch (err) {
        devLog('sync', '⚠️ Post-credential sync failed (non-fatal):', err)
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Credential issued successfully',
        credential: {
          id: dbCredentialId,
          assetId,
          name: courseName,
          level,
          totalXp,
          mintedAt: new Date().toISOString(),
        },
        onchain: {
          txId: onchainTxId,
          assetAddress: onchainAssetAddress,
          error: onchainError,
          mode: onchainTxId ? 'on-chain' : 'mock',
        },
        sync: credentialSync,
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
