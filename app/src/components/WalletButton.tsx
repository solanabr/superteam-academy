"use client"

import { useWallet } from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Wallet, Copy, LogOut, ChevronDown, CheckCheck } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

function truncateAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

interface WalletButtonProps {
  className?: string
  variant?: "sidebar" | "inline"
}

export function WalletButton({ className, variant = "sidebar" }: WalletButtonProps) {
  const { wallet, connecting, connected, publicKey, connect, disconnect } = useWallet()
  const { visible, setVisible } = useWalletModal()
  const [copied, setCopied] = useState(false)
  const connectAttemptedRef = useRef(false)

  const copyAddress = () => {
    if (!publicKey) return
    navigator.clipboard.writeText(publicKey.toBase58())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    if (!wallet || connected || connecting || connectAttemptedRef.current) return
    connectAttemptedRef.current = true
    connect().catch((err) => {
      const msg = err instanceof Error ? err.message : ""
      if (msg.toLowerCase().includes("reject") || msg.toLowerCase().includes("cancel")) {
        toast.error("Wallet connection was cancelled.")
      } else {
        toast.error("Could not connect to wallet. Unlock your wallet and try again.")
      }
      connectAttemptedRef.current = false
    })
  }, [wallet, connected, connecting, connect])

  useEffect(() => {
    if (!visible && !connected) {
      connectAttemptedRef.current = false
    }
  }, [visible, connected])

  const handleConnect = () => {
    if (connected || connecting) return
    if (!wallet) {
      connectAttemptedRef.current = false
      setVisible(true)
      return
    }
    connectAttemptedRef.current = true
    connect().catch((err) => {
      const msg = err instanceof Error ? err.message : ""
      if (msg.toLowerCase().includes("reject") || msg.toLowerCase().includes("cancel")) {
        toast.error("Wallet connection was cancelled.")
      } else {
        toast.error("Could not connect to wallet. Unlock your wallet and try again.")
      }
      connectAttemptedRef.current = false
    })
  }

  if (!connected || !publicKey) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={`w-full gap-2 border-primary/40 text-primary hover:bg-primary/10 hover:border-primary/60 font-medium ${className ?? ""}`}
        onClick={handleConnect}
      >
        <Wallet className="w-4 h-4" />
        Connect Wallet
      </Button>
    )
  }

  const address = publicKey.toBase58()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`w-full gap-2 border-primary/40 text-primary hover:bg-primary/10 hover:border-primary/60 font-medium ${className ?? ""}`}
        >
          <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
          {truncateAddress(address)}
          <ChevronDown className="w-3 h-3 ml-auto opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side={variant === "sidebar" ? "top" : "bottom"} className="w-52">
        <div className="px-2 py-1.5">
          <p className="text-xs text-muted-foreground font-medium">Connected wallet</p>
          <p className="text-xs font-mono text-foreground mt-0.5 truncate">{address}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={copyAddress}>
          {copied ? (
            <CheckCheck className="w-4 h-4 mr-2 text-green-500" />
          ) : (
            <Copy className="w-4 h-4 mr-2" />
          )}
          {copied ? "Copied!" : "Copy address"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => disconnect()}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
