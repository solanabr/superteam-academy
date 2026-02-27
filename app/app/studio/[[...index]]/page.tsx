'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { NextStudio } from 'next-sanity/studio'
import config from '@/sanity.config'
import { useIsAdmin } from '@/hooks'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletConnectButton } from '@/components/wallet/WalletConnectButton'

export default function StudioPage() {
  const { publicKey } = useWallet()
  const { isAdmin, isLoading } = useIsAdmin()
  const router = useRouter()

  // Only redirect when wallet is connected and we've confirmed they're not admin
  useEffect(() => {
    if (publicKey && !isLoading && !isAdmin) {
      router.replace('/dashboard')
    }
  }, [publicKey, isAdmin, isLoading, router])

  // Wallet not connected: prompt to connect instead of redirecting
  if (!publicKey) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-900 px-4">
        <p className="text-center text-muted-foreground">
          Connect your wallet to access Sanity Studio. Only authority or backend signer can access.
        </p>
        <WalletConnectButton />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-900">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return <NextStudio config={config} />
}
