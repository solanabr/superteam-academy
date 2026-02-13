'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { BlockchainService } from '@/lib/services/blockchain.service'
import { ShieldCheck, Wallet, Loader2, Award, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function OnChainStats() {
  const { publicKey, connected } = useWallet()
  const [onChainXP, setOnChainXP] = useState<number | null>(null)
  const [credentialCount, setCredentialCount] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const blockchainService = new BlockchainService()

  useEffect(() => {
    async function loadOnChainData() {
      if (!publicKey) return
      
      setIsLoading(true)
      try {
        const [xp, certs] = await Promise.all([
          blockchainService.getXPBalance(publicKey.toString()),
          blockchainService.getUserCredentials(publicKey.toString())
        ])
        setOnChainXP(xp)
        setCredentialCount(certs.length)
      } catch (error) {
        console.error('Error loading on-chain data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (connected && publicKey) {
      loadOnChainData()
    } else {
      setOnChainXP(null)
      setCredentialCount(null)
    }
  }, [connected, publicKey])

  if (!connected) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 border border-dashed border-border text-xs text-muted-foreground">
        <Wallet className="h-3.5 w-3.5" />
        Connect wallet to view on-chain progress
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground px-4 py-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Syncing with Devnet...
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20">
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1">
                <Zap className="h-2.5 w-2.5 fill-current" />
                On-Chain XP
              </span>
              <span className="text-lg font-black text-primary leading-tight">{onChainXP ?? 0}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-accent/10 border border-accent/20">
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-bold text-accent uppercase tracking-widest flex items-center gap-1">
                <ShieldCheck className="h-2.5 w-2.5" />
                Verified
              </span>
              <span className="text-lg font-black text-accent leading-tight">{credentialCount ?? 0}</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
