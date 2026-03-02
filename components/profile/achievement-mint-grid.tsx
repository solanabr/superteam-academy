'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Lock, ShieldCheck } from 'lucide-react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Transaction } from '@solana/web3.js'

type AchievementItem = {
  id: string
  title: string
  icon?: string
  unlocked: boolean
}

export function AchievementMintGrid({
  achievements,
  initialMintedIds
}: {
  achievements: AchievementItem[]
  initialMintedIds: string[]
}) {
  const { connection } = useConnection()
  const { connected, publicKey, sendTransaction } = useWallet()
  const [mintedIds, setMintedIds] = useState<Set<string>>(new Set(initialMintedIds))
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const unlockedCount = achievements.filter((achievement) => achievement.unlocked).length

  const mintAchievement = async (achievement: AchievementItem) => {
    if (!achievement.unlocked || mintedIds.has(achievement.id) || loadingId) return
    if (!connected || !publicKey) {
      window.alert('Connect your wallet to mint achievements.')
      return
    }

    setLoadingId(achievement.id)
    try {
      const prepareRes = await fetch('/api/achievements/mint/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          achievementId: achievement.id,
          walletAddress: publicKey.toBase58()
        })
      })
      const preparePayload = await prepareRes.json().catch(() => ({}))
      if (!prepareRes.ok) {
        throw new Error(preparePayload?.error || 'Failed to prepare achievement mint')
      }

      if (preparePayload?.alreadyIssued) {
        setMintedIds((prev) => new Set(prev).add(achievement.id))
        window.alert('Achievement already minted.')
        return
      }

      const serialized = preparePayload?.serializedTransaction as string | undefined
      const mintAddress = preparePayload?.mintAddress as string | undefined
      if (!serialized || !mintAddress) {
        throw new Error('Invalid achievement transaction payload')
      }

      const txBytes = Uint8Array.from(atob(serialized), (value) => value.charCodeAt(0))
      const transaction = Transaction.from(txBytes)
      const signature = await sendTransaction(transaction, connection, {
        skipPreflight: false,
        preflightCommitment: 'confirmed'
      })
      await connection.confirmTransaction(signature, 'confirmed')

      const confirmRes = await fetch('/api/achievements/mint/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          achievementId: achievement.id,
          mintAddress,
          signature
        })
      })
      const confirmPayload = await confirmRes.json().catch(() => ({}))
      if (!confirmRes.ok) {
        throw new Error(confirmPayload?.error || 'Failed to save achievement mint')
      }

      setMintedIds((prev) => new Set(prev).add(achievement.id))
      window.alert('Achievement minted successfully.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to mint achievement'
      window.alert(message)
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <CardLike title="Achievements" subtitle={`${unlockedCount} unlocked`}>
      {achievements.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-4 text-xs text-muted-foreground">
          No achievements configured yet. Run your seed SQL or add achievements in the database.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {achievements.map((achievement) => {
            const minted = mintedIds.has(achievement.id)
            const isFallbackAchievement = achievement.id.startsWith('fallback-')
            return (
              <div
                key={achievement.id}
                className={`rounded-xl border p-3 ${
                  achievement.unlocked
                    ? 'border-white/10 bg-black/20'
                    : 'border-white/10 bg-black/10 opacity-60'
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xl">{achievement.icon || 'T'}</span>
                  {!achievement.unlocked && <Lock className="h-3.5 w-3.5 text-white/70" />}
                  {achievement.unlocked && minted && <ShieldCheck className="h-3.5 w-3.5 text-primary" />}
                </div>
                <p className="line-clamp-1 text-xs font-bold">{achievement.title}</p>
                <div className="mt-2">
                  {!achievement.unlocked ? (
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Locked</span>
                  ) : minted ? (
                    <span className="text-[10px] uppercase tracking-wider text-primary">Minted</span>
                  ) : isFallbackAchievement ? (
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Seed DB First</span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px] uppercase tracking-wider"
                      disabled={loadingId === achievement.id}
                      onClick={() => mintAchievement(achievement)}
                    >
                      {loadingId === achievement.id ? 'Minting...' : 'Mint'}
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </CardLike>
  )
}

function CardLike({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xl font-black">{title}</p>
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      </div>
      {children}
    </div>
  )
}
