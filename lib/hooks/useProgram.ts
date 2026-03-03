import { useConnection } from '@solana/wallet-adapter-react'
import { AnchorProvider, Wallet } from '@coral-xyz/anchor'
import { useMemo } from 'react'
import { Transaction, VersionedTransaction } from '@solana/web3.js'
import { useWallet } from './useWallet'
import { getProgram } from '@/lib/anchor'

/**
 * Hook for interacting with Anchor program
 * Requires wallet to be connected
 *
 * @example
 * const program = useProgram()
 * if (program) {
 *   const tx = await program.methods.completeLesson(...)
 * }
 */
export const useProgram = () => {
  const { connection } = useConnection()
  const wallet = useWallet()
  const { publicKey } = wallet

  return useMemo(() => {
    if (!publicKey) {
      return null
    }

    try {
      const walletAdapter = wallet as unknown as {
        signTransaction?: <T extends Transaction | VersionedTransaction>(tx: T) => Promise<T>
      }
      const walletObj = {
        publicKey,
        signTransaction: walletAdapter.signTransaction,
        signAllTransactions: async <T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> => {
          return Promise.all(txs.map((tx) => walletAdapter.signTransaction?.(tx) ?? Promise.resolve(tx))) as Promise<T[]>
        },
      } as Wallet

      const provider = new AnchorProvider(connection, walletObj, {
        commitment: 'confirmed',
      })

      return getProgram(provider)
    } catch (error) {
      console.error('Failed to initialize program:', error)
      return null
    }
  }, [connection, publicKey, wallet])
}

export type UseProgram = ReturnType<typeof useProgram>
