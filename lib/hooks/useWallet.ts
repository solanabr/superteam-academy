'use client'

import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import {
  useWallet as useWalletAdapter,
  useConnection,
} from '@solana/wallet-adapter-react'
import { useCallback } from 'react'

/**
 * Custom hook to manage Solana wallet connection state
 * Wraps @solana/wallet-adapter-react useWallet()
 *
 * @returns Wallet context with connection state, signer, and TX submission
 */
export function useWallet() {
  const {
    wallet,
    publicKey,
    connected,
    connecting,
    disconnecting,
    connect,
    disconnect,
    sendTransaction,
  } = useWalletAdapter()

  const { connection } = useConnection()
  const { setVisible } = useWalletModal()

  const openWalletModal = useCallback(() => {
    setVisible(true)
  }, [setVisible])

  return {
    // Connection state
    wallet,
    publicKey,
    connected,
    connecting,
    disconnecting,

    // Actions
    openWalletModal,
    connect,
    disconnect,
    sendTransaction,
    connection,

    // Helpers
    walletAddress: publicKey?.toBase58() || null,
    isConnecting: connecting || disconnecting,
    isReady: () => connected && publicKey !== null,
    getPublicKeyString: () => publicKey?.toBase58() || null,
  }
}

export type UseWalletReturn = ReturnType<typeof useWallet>
