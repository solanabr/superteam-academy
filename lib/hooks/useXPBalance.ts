import { useCallback, useEffect, useState } from 'react'
import { useConnection } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { TOKEN_2022_PROGRAM_ID } from '@/lib/anchor/constants'

/**
 * Fetch XP token balance for a learner from Token-2022 ATA
 * Used for: Live XP display, leaderboard
 *
 * @param learnerAddress - Wallet address to check
 * @param xpTokenMint - XP token mint public key
 * @returns Current XP balance + refetch function
 */
export function useXPBalance(learnerAddress?: PublicKey, xpTokenMint?: PublicKey) {
  const { connection } = useConnection()
  const [balance, setBalance] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchBalance = useCallback(async () => {
    if (!learnerAddress || !xpTokenMint) {
      setBalance(0)
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const parseAmount = (tokenBalance: { value: { amount: string; decimals: number; uiAmount: number | null; uiAmountString?: string } }): number => {
        const value = tokenBalance?.value
        if (!value) return 0

        if (typeof value.uiAmount === 'number' && Number.isFinite(value.uiAmount)) {
          return value.uiAmount
        }

        if (typeof value.uiAmountString === 'string') {
          const parsed = Number(value.uiAmountString)
          if (Number.isFinite(parsed)) {
            return parsed
          }
        }

        const rawAmount = Number(value.amount)
        const decimals = Number(value.decimals || 0)
        if (!Number.isFinite(rawAmount)) return 0

        return decimals > 0 ? rawAmount / 10 ** decimals : rawAmount
      }

      const readAtaBalance = async (programId: PublicKey): Promise<number | null> => {
        const ata = getAssociatedTokenAddressSync(
          xpTokenMint,
          learnerAddress,
          false,
          programId
        )

        try {
          const accountBalance = await connection.getTokenAccountBalance(ata, 'confirmed')
          return parseAmount(accountBalance)
        } catch (err) {
          const message = String(err instanceof Error ? err.message : err).toLowerCase()
          const accountMissing =
            message.includes('could not find account') ||
            message.includes('invalid param') ||
            message.includes('failed to find account')

          if (accountMissing) {
            return null
          }

          throw err
        }
      }

      // Try Token-2022 first, then standard SPL token program.
      for (const programId of [TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID]) {
        const amount = await readAtaBalance(programId)
        if (amount !== null) {
          setBalance(amount)
          return
        }
      }

      setBalance(0)
    } catch (err) {
      const message = String(err instanceof Error ? err.message : 'Failed to fetch balance').toLowerCase()
      const accountMissing =
        message.includes('could not find account') ||
        message.includes('invalid param') ||
        message.includes('failed to find account')

      if (accountMissing) {
        setBalance(0)
        setError(null)
      } else {
        setError(err instanceof Error ? err : new Error('Failed to fetch balance'))
      }
    } finally {
      setIsLoading(false)
    }
  }, [connection, learnerAddress, xpTokenMint])

  useEffect(() => {
    void fetchBalance()
  }, [fetchBalance])

  return {
    balance,
    isLoading,
    error,
    refetch: fetchBalance,
  }
}

export type UseXPBalanceReturn = ReturnType<typeof useXPBalance>
