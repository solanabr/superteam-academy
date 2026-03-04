'use client'

import React, { useEffect, useRef } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useSession } from 'next-auth/react'
import { useWalletAuth } from '@/lib/hooks/useWalletAuth'
import dynamic from 'next/dynamic'

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
)

/**
 * Wallet connection button with SIWS (Sign-In With Solana) integration.
 *
 * Behaviour:
 * - If the user is NOT signed in, connecting a wallet triggers SIWS
 *   to create a session with walletAddress.
 * - If the user IS signed in via OAuth but no wallet linked,
 *   connecting a wallet auto-links it to the session.
 * - Shows a status badge (linked / unlinked) next to the button.
 */
export function WalletConnect() {
  const { connected, publicKey } = useWallet()
  const { data: session } = useSession()
  const { signInWithWallet, isAuthenticating, error, isWalletLinked } = useWalletAuth()

  // Track whether we've already attempted SIWS for this connection
  const hasAttemptedRef = useRef(false)

  // Auto-trigger SIWS when wallet connects and user isn't authenticated
  useEffect(() => {
    if (!connected || !publicKey) {
      hasAttemptedRef.current = false
      return
    }

    // Already signed in with this wallet linked → nothing to do
    if (isWalletLinked) {
      hasAttemptedRef.current = false
      return
    }

    // Skip if we already attempted for this connection
    if (hasAttemptedRef.current) return

    // Wallet just connected — trigger SIWS
    hasAttemptedRef.current = true
    signInWithWallet()
  }, [connected, publicKey, isWalletLinked, signInWithWallet])

  return (
    <div className="flex items-center gap-2">
      <WalletMultiButton className="!bg-blue-600 hover:!bg-blue-700" />

      {isAuthenticating && (
        <span className="text-xs text-yellow-500 animate-pulse">Signing…</span>
      )}

      {error && (
        <span className="text-xs text-red-500 max-w-[140px] truncate" title={error}>
          {error}
        </span>
      )}

      {connected && publicKey && !isAuthenticating && !error && (
        <span
          className={`text-xs px-1.5 py-0.5 rounded ${
            isWalletLinked
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
          }`}
        >
          {isWalletLinked ? '✓ Linked' : 'Not linked'}
        </span>
      )}
    </div>
  )
}
