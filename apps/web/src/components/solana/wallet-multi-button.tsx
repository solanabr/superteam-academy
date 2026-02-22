"use client"

import * as React from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wallet } from "lucide-react"

export function WalletMultiButton() {
  const { wallet, disconnect, connected, publicKey } = useWallet()
  const { setVisible } = useWalletModal()

  const truncatedAddress = React.useMemo(() => {
    if (!publicKey) return ""
    const base58 = publicKey.toBase58()
    return `${base58.slice(0, 4)}...${base58.slice(-4)}`
  }, [publicKey])

  if (connected && publicKey) {
    return (
      <div className="flex items-center gap-2 neo-brutal-border neo-brutal-shadow bg-background p-2 pr-4 relative">
        <div className="absolute -top-3 -right-3 z-10">
          <Badge variant="warning" className="text-[10px] px-2 py-0 border-2">Devnet</Badge>
        </div>
        <div className="flex items-center justify-center h-10 w-10 neo-brutal-border bg-primary text-primary-foreground shrink-0">
          {wallet?.adapter.icon ? (
            <img src={wallet.adapter.icon} alt={`${wallet.adapter.name} icon`} className="h-6 w-6" />
          ) : (
            <Wallet className="h-5 w-5" strokeWidth={3} />
          )}
        </div>
        <div className="flex flex-col mr-2">
          <span className="text-xs font-black uppercase tracking-wider">{wallet?.adapter.name || "Wallet"}</span>
          <span className="text-sm font-bold opacity-70 font-mono">{truncatedAddress}</span>
        </div>
        <Button variant="destructive" size="sm" className="ml-2 h-8 px-2" onClick={() => disconnect()}>
          <span className="sr-only">Disconnect</span>
          X
        </Button>
      </div>
    )
  }

  return (
    <Button 
      size="lg" 
      onClick={() => setVisible(true)}
      className="gap-3"
    >
      <Wallet className="h-5 w-5" strokeWidth={3} />
      <span>Connect Wallet</span>
    </Button>
  )
}
