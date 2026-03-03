'use client'

import React from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Button } from '@/components/ui/Button'
import dynamic from 'next/dynamic'

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
)

/**
 * Wallet connection button for Header
 *
 * Shows:
 * - "Connect Wallet" → opens modal if disconnected
 * - Shortened address + dropdown menu if connected
 *
 * Add to Header.tsx: <WalletConnect />
 */
export function WalletConnect() {
  const { wallet, connected, publicKey } = useWallet()

  // If SSR, don't render (wallet adapter requires client)
  if (!wallet) {
    return (
      <Button variant="secondary" disabled>
        Loading Wallet...
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {/* This component handles all wallet logic automatically */}
      <WalletMultiButton className="!bg-blue-600 hover:!bg-blue-700" />

      {/* Optional: Custom UI if you want to replace WalletMultiButton */}
      {connected && publicKey && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
        </div>
      )}
    </div>
  )
}
