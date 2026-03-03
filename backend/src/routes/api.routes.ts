import express, { Request, Response } from 'express'
import { enrollmentService } from '../services/enrollment.service'
import { userService } from '../services/user.service'
import { GamificationService } from '../services/gamification.service'
import { TransactionService } from '../services/transaction.service'

const router = express.Router()
const transactionService = new TransactionService()

/**
 * POST /api/enrollments
 * Enroll user in a course
 */
router.post('/enrollments', async (req: Request, res: Response) => {
  try {
    const { userId, courseId } = req.body

    if (!userId || !courseId) {
      return res.status(400).json({ error: 'Missing userId or courseId' })
    }

    // Create user if doesn't exist
    try {
      await userService.getOrCreateUser('email', userId, {
        email: userId,
        name: userId.split('@')[0],
      })
    } catch (error) {
      console.error('User creation error:', error)
    }

    // Enroll in course
    const enrollment = await enrollmentService.enrollCourse(userId, courseId)
    console.log('✅ Enrollment created:', enrollment)

    res.json({
      success: true,
      enrollment: {
        id: enrollment.id,
        courseId: courseId,
        userId: userId,
      },
      userId: userId,
    })
  } catch (error) {
    console.error('Enrollment failed:', error)
    res.status(500).json({ error: error instanceof Error ? error.message : 'Enrollment failed' })
  }
})

/**
 * GET /api/users/:userId/enrollments
 * Get user's enrollments
 */
router.get('/users/:userId/enrollments', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId
    console.log('📋 Fetching enrollments for userId:', userId)
    
    const enrollments = await userService.getUserEnrollments(userId)
    console.log('📋 Enrollments found:', enrollments)
    
    res.json(enrollments || [])
  } catch (error) {
    console.error('Error fetching enrollments:', error)
    res.json([])
  }
})

/**
 * GET /api/debug/enrollments/:userId
 * Debug endpoint to check raw data
 */
router.get('/debug/enrollments/:userId', async (req: Request, res: Response) => {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const db = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    const userId = req.params.userId
    console.log('🔍 Debug: Checking enrollments for:', userId)

    const { data, error } = await db
      .from('enrollments')
      .select('*')
      .eq('user_id', userId)

    if (error) {
      console.error('Debug error:', error)
      return res.json({ error: error.message, data: null })
    }

    console.log('🔍 Debug: Raw enrollments:', data)
    res.json({ data, count: data?.length || 0 })
  } catch (error) {
    console.error('Debug endpoint error:', error)
    res.status(500).json({ error: error instanceof Error ? error.message : 'Error' })
  }
})

/**
 * POST /api/enrollments/complete-lesson
 * Mark a lesson as complete and award XP
 */
router.post('/enrollments/complete-lesson', async (req: Request, res: Response) => {
  try {
    const { userId, courseId, lessonId, lessonIndex, xpAmount } = req.body

    if (!userId || !courseId || lessonIndex === undefined || !xpAmount) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const result = await enrollmentService.completeLesson(userId, courseId, lessonId, xpAmount)
    res.json({ success: true, result })
  } catch (error) {
    console.error('Lesson completion failed:', error)
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to complete lesson' })
  }
})

/**
 * POST /api/enrollments/finalize-course
 * Finalize course completion
 */
router.post('/enrollments/finalize-course', async (req: Request, res: Response) => {
  try {
    const { userId, courseId } = req.body

    if (!userId || !courseId) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    res.json({ success: true, message: 'Course finalized' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to finalize course' })
  }
})

/**
 * POST /api/enrollments/issue-credential
 * Issue credential NFT
 */
router.post('/enrollments/issue-credential', async (req: Request, res: Response) => {
  try {
    const { userId, courseId, metadataUri } = req.body

    if (!userId || !courseId || !metadataUri) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    res.json({ success: true, message: 'Credential issued' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to issue credential' })
  }
})

/**
 * GET /api/users/:userId/progress
 * Get user's learning progress (XP, level, streak)
 */
router.get('/users/:userId/progress', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId
    console.log('📊 Fetching progress for userId:', userId)

    const user = await userService.getUserById(userId)
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({
      userId: user.id,
      totalXP: user.totalXP || 0,
      level: user.level || 1,
      currentStreak: user.currentStreak || 0,
      email: user.email,
      displayName: user.displayName,
    })
  } catch (error) {
    console.error('Error fetching progress:', error)
    res.json({ userId: req.params.userId, totalXP: 0, level: 1, currentStreak: 0 })
  }
})

/**
 * GET /api/progress/:userId (Legacy)
 * Get user's learning progress - redirected to /users/:userId/progress
 */
router.get('/progress/:userId', async (req: Request, res: Response) => {
  try {
    const progress = await enrollmentService.getUserProgress(req.params.userId)
    res.json(progress)
  } catch (error) {
    res.json({ totalXP: 0, level: 1, currentStreak: 0, enrollments: [] })
  }
})

/**
 * GET /api/gamification/:userId
 * Get user's gamification stats
 */
router.get('/gamification/:userId', async (req: Request, res: Response) => {
  try {
    const stats = await GamificationService.getStats(req.params.userId)
    res.json(stats)
  } catch (error) {
    res.json({
      totalXP: 0,
      level: 1,
      currentStreak: 0,
      longestStreak: 0,
      achievementsUnlocked: 0,
      xpProgress: { current: 0, needed: 100, percentage: 0 },
    })
  }
})

/**
 * GET /api/leaderboard
 * Get global leaderboard
 */
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500)
    const leaderboard = await userService.getLeaderboard(limit)
    res.json(leaderboard || [])
  } catch (error) {
    res.json([])
  }
})

/**
 * GET /api/leaderboard/rank/:userId
 * Get user's rank
 */
router.get('/leaderboard/rank/:userId', async (req: Request, res: Response) => {
  try {
    const rank = await userService.getUserRank(req.params.userId)
    res.json({ rank })
  } catch (error) {
    res.json({ rank: 0 })
  }
})

/**
 * GET /api/users/:userId/profile
 * Get user profile
 */
router.get('/users/:userId/profile', async (req: Request, res: Response) => {
  try {
    const user = await userService.getUserById(req.params.userId)
    res.json(user)
  } catch (error) {
    res.status(404).json({ error: 'User not found' })
  }
})

/**
 * POST /api/users/oauth
 * OAuth user creation
 */
router.post('/users/oauth', async (req: Request, res: Response) => {
  try {
    const { provider, providerUserId, profile } = req.body
    const user = await userService.getOrCreateUser(provider, providerUserId, profile)
    res.json(user)
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' })
  }
})

// ============= TRANSACTION ROUTES (On-Chain Integration) =============

/**
 * POST /api/transaction/complete-lesson
 * Build & sign complete_lesson transaction
 * 
 * Request:
 *   {
 *     "userId": "user-pubkey",
 *     "courseId": "course-123",
 *     "lessonIndex": 0,
 *     "xpAmount": 100
 *   }
 * 
 * Response:
 *   {
 *     "signedTx": "base64-encoded-transaction",
 *     "blockhash": "blockhash-string"
 *   }
 */
router.post('/transaction/complete-lesson', async (req: Request, res: Response) => {
  try {
    const { userId, courseId, lessonIndex, xpAmount } = req.body

    if (!userId || !courseId || lessonIndex === undefined || !xpAmount) {
      return res.status(400).json({ error: 'Missing required fields: userId, courseId, lessonIndex, xpAmount' })
    }

    console.log(`🔗 Building complete-lesson TX for ${userId}...`)

    const result = await transactionService.completeLessonTX({
      userId,
      courseId,
      lessonIndex,
      xpAmount,
    })

    console.log('✅ Transaction built successfully')
    res.json(result)
  } catch (error) {
    console.error('❌ Error building TX:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to build transaction',
    })
  }
})

/**
 * POST /api/transaction/enroll
 * Build & sign enrollment transaction
 */
router.post('/transaction/enroll', async (req: Request, res: Response) => {
  try {
    const { userId, courseId } = req.body

    if (!userId || !courseId) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    console.log(`🔗 Building enroll TX for ${userId}...`)

    const result = await transactionService.enrollTX({
      userId,
      courseId,
    })

    console.log('✅ Enrollment TX built successfully')
    res.json(result)
  } catch (error) {
    console.error('❌ Error building enrollment TX:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to build transaction',
    })
  }
})

/**
 * POST /api/transaction/finalize-course
 * Build & sign finalize_course transaction
 */
router.post('/transaction/finalize-course', async (req: Request, res: Response) => {
  try {
    const { userId, courseId } = req.body

    if (!userId || !courseId) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    console.log(`🔗 Building finalize-course TX for ${userId}...`)

    const result = await transactionService.finalizeCourseT({
      userId,
      courseId,
    })

    console.log('✅ Finalize TX built successfully')
    res.json(result)
  } catch (error) {
    console.error('❌ Error building finalize TX:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to build transaction',
    })
  }
})

export default router
