"use client"

import { ReactNode, useEffect, useRef } from "react"
import { WalletError } from "@solana/wallet-adapter-base"
import { ConnectionProvider, WalletProvider, useWallet } from "@solana/wallet-adapter-react"
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui"
import { signOut, useSession } from "next-auth/react"
import { toast } from "sonner"
import bs58 from "bs58"
import "@solana/wallet-adapter-react-ui/styles.css"

const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com"

// Syncs the connected wallet address to the user's DB record
function WalletSyncInner() {
  const { publicKey, connected, signMessage, disconnect } = useWallet()
  const { data: session } = useSession()
  const savedRef = useRef<string | null>(null)
  const syncingRef = useRef<string | null>(null)
  const hadConnectedRef = useRef(false)

  useEffect(() => {
    if (!session?.user?.id) return

    if (connected) {
      hadConnectedRef.current = true
    }

    if (connected && publicKey && signMessage) {
      const address = publicKey.toBase58()
      if (savedRef.current === address) return
      if (syncingRef.current === address) return

      // If this wallet is already linked in the DB (stored in session JWT),
      // skip the nonce+sign flow — just mark it as saved.
      if (session.user.walletAddress === address) {
        savedRef.current = address
        return
      }

      syncingRef.current = address

      let ignore = false
      ;(async () => {
        try {
          const nonceRes = await fetch("/api/auth/wallet/nonce", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ walletAddress: address, purpose: "link" }),
          })
          if (!nonceRes.ok) {
            console.error("wallet sync: failed to get nonce", nonceRes.status)
            return
          }
          const { nonce } = (await nonceRes.json()) as { nonce: string }
          const message = new TextEncoder().encode(
            `Link wallet to Superteam Brazil Academy\n\nNonce: ${nonce}\n\nThis request will not trigger a blockchain transaction or cost any fees.`
          )
          const signatureBytes = await signMessage(message)
          const signature = bs58.encode(signatureBytes)

          if (ignore) return
          const saveRes = await fetch("/api/user/wallet", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ walletAddress: address, nonce, signature }),
          })
          if (!saveRes.ok) {
            const body = await saveRes.json().catch(() => ({}))
            console.error("wallet sync: failed to save wallet", saveRes.status, body)
            if (saveRes.status === 409) {
              toast.error("That wallet is already linked to another account. Connect a different wallet.")
              disconnect().catch(() => {})
            }
            return
          }
          savedRef.current = address
        } catch {
          console.error("wallet sync: unexpected error")
        } finally {
          if (syncingRef.current === address) {
            syncingRef.current = null
          }
        }
      })()

      return () => {
        ignore = true
      }
    } else if (!connected && savedRef.current !== null) {
      // Wallet disconnected — clear from DB
      savedRef.current = null
      syncingRef.current = null
      fetch("/api/user/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: null }),
      }).catch(() => {})
    }

    // Wallet-authenticated users should lose session when wallet disconnects.
    if (
      !connected &&
      hadConnectedRef.current &&
      session.user.authProvider === "wallet-signin"
    ) {
      hadConnectedRef.current = false
      signOut({ callbackUrl: "/sign-in" }).catch(() => {})
    }
  }, [connected, publicKey, signMessage, session?.user?.id, session?.user?.authProvider, session?.user?.walletAddress])

  return null
}

export function WalletProviders({ children }: { children: ReactNode }) {
  // Phantom, Solflare, Backpack etc. implement the Wallet Standard and
  // self-register — passing them manually as adapters causes a duplicate
  // registration conflict. Pass an empty array and let Wallet Standard handle discovery.
  return (
    <ConnectionProvider endpoint={SOLANA_RPC}>
      <WalletProvider
        wallets={[]}
        autoConnect={false}
        onError={(error: WalletError) => {
          console.error("wallet adapter error:", error)
        }}
      >
        <WalletModalProvider>
          <WalletSyncInner />
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
