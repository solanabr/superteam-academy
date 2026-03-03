/**
 * Transaction Service
 * Handles communication with backend to get signed transactions
 * for on-chain operations (complete lesson, enroll, finalize course)
 */

export interface SignedTxResponse {
  signedTx: string // Base64-encoded signed transaction
  blockhash: string
  backendSignature: string
}

export interface CompleteLessonRequest {
  userId: string
  courseId: string
  lessonIndex: number
  xpAmount: number
}

export class TransactionService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

  /**
   * Get signed transaction for completing a lesson
   */
  async completeLessonTX(req: CompleteLessonRequest): Promise<SignedTxResponse> {
    const response = await fetch(`${this.baseUrl}/transaction/complete-lesson`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to get signed transaction: ${error}`)
    }

    return response.json()
  }

  /**
   * Get signed transaction for enrolling in a course
   */
  async enrollTX(userId: string, courseId: string): Promise<SignedTxResponse> {
    const response = await fetch(`${this.baseUrl}/transaction/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, courseId }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to get enroll transaction: ${error}`)
    }

    return response.json()
  }

  /**
   * Get signed transaction for finalizing a course
   */
  async finalizeCourseT(userId: string, courseId: string): Promise<SignedTxResponse> {
    const response = await fetch(`${this.baseUrl}/transaction/finalize-course`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, courseId }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to get finalize transaction: ${error}`)
    }

    return response.json()
  }
}

export const transactionService = new TransactionService()
