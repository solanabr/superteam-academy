'use client'

import { useWallet } from './useWallet'
import { useCallback, useState } from 'react'
import { Transaction } from '@solana/web3.js'

interface CompleteLessonParams {
  userId: string
  courseId: string
  lessonIndex: number
  xpAmount: number
}

interface CompleteLessonResult {
  success: boolean
  signature?: string
  error?: string
}

/**
 * Hook to handle lesson completion and on-chain XP awarding
 *
 * @returns Object with completeLesson function and loading/error state
 */
export const useCompleteLesson = () => {
  const { publicKey, sendTransaction, connection, connected } = useWallet()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const completeLesson = useCallback(
    async (params: CompleteLessonParams): Promise<CompleteLessonResult> => {
      // Check wallet connection
      if (!connected || !publicKey) {
        const msg = 'Wallet not connected'
        setError(msg)
        return { success: false, error: msg }
      }

      setLoading(true)
      setError(null)

      try {
        // Step 1: Request signed transaction from backend
        console.log('📤 Building transaction from backend...')
        const apiBase =
          process.env.NEXT_PUBLIC_TX_API_URL ||
          process.env.NEXT_PUBLIC_BACKEND_API_URL ||
          'http://localhost:3001/api'
        const txEndpoint = `${apiBase.replace(/\/$/, '')}/transaction/complete-lesson`
        const txResponse = await fetch(txEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: publicKey.toBase58(),
            courseId: params.courseId,
            lessonIndex: params.lessonIndex,
            xpAmount: params.xpAmount,
          }),
        })

        if (!txResponse.ok) {
          const errorData = await txResponse.json()
          throw new Error(
            errorData.error || `HTTP ${txResponse.status}: Failed to build transaction`
          )
        }

        const { signedTx } = await txResponse.json()
        console.log('✅ Transaction built by backend')

        // Step 2: Convert base64 string back to Transaction
        console.log('🔄 Deserializing transaction...')
        const txBuffer = Buffer.from(signedTx, 'base64')
        const tx = Transaction.from(txBuffer)

        // Step 3: Send via wallet (user approves)
        console.log('👛 Sending transaction via wallet...')
        const signature = await sendTransaction(tx, connection)
        console.log('✅ Transaction signed and sent:', signature)

        // Step 4: Wait for confirmation
        console.log('⏳ Waiting for confirmation...')
        const confirmation = await connection.confirmTransaction(
          signature,
          'confirmed'
        )

        if (confirmation.value.err) {
          throw new Error(
            `Transaction failed: ${JSON.stringify(confirmation.value.err)}`
          )
        }

        console.log('✅ Transaction confirmed! Lesson completed.')
        return { success: true, signature }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        setError(message)
        console.error('❌ Lesson completion failed:', message)
        return { success: false, error: message }
      } finally {
        setLoading(false)
      }
    },
    [publicKey, sendTransaction, connection, connected]
  )

  return {
    completeLesson,
    loading,
    error,
    connected,
  }
}
