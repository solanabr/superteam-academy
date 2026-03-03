/**
 * API Route: POST /api/transaction/complete-lesson
 *
 * Builds and signs a complete_lesson transaction
 * Frontend submits the signed TX to Solana after user wallet signs
 *
 * Request:
 *   {
 *     "courseId": "math-101",
 *     "lessonIndex": 2,
 *     "xpAmount": 100
 *   }
 *
 * Response:
 *   {
 *     "signedTx": "...(base64)...",
 *     "blockhash": "...",
 *     "signature": "backend_pubkey..."
 *   }
 */

import { Request, Response } from 'express'
import { transactionService } from '@/services/transaction.service'

// Expect auth middleware to have added userId to request
interface AuthRequest extends Request {
  userId?: string
}

export async function POST(req: AuthRequest, res: Response) {
  try {
    const { courseId, lessonIndex, xpAmount } = req.body

    // Validate inputs
    if (!courseId || lessonIndex === undefined || !xpAmount) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    if (!req.userId) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    // Build + sign TX
    const signedTx = await transactionService.completeLessonTX({
      userId: req.userId,
      courseId,
      lessonIndex,
      xpAmount,
    })

    res.json(signedTx)
  } catch (error) {
    console.error('Error building TX:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to build transaction',
    })
  }
}
