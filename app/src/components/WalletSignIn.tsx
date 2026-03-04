"use client"

import { useWallet } from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import bs58 from "bs58"

const AUTH_MESSAGE = (nonce: string) =>
  `Sign in to Superteam Brazil Academy\n\nNonce: ${nonce}\n\nThis request will not trigger a blockchain transaction or cost any fees.`

type Status = "idle" | "connecting" | "signing" | "authenticating" | "error"

interface WalletSignInProps {
  callbackUrl?: string
  /** If true, show "Create account with wallet" copy instead of "Sign in" */
  isSignUp?: boolean
}

export function WalletSignIn({ callbackUrl = "/dashboard", isSignUp = false }: WalletSignInProps) {
  const { wallet, connecting, connected, publicKey, connect, signMessage, disconnect } = useWallet()
  const { visible, setVisible } = useWalletModal()
  const router = useRouter()

  const [status, setStatus] = useState<Status>("idle")
  const [error, setError] = useState("")
  // Prevent double-triggering the auth flow
  const isAuthenticating = useRef(false)
  const hasOpenedModalRef = useRef(false)
  const hasAttemptedConnectRef = useRef(false)

  const handleWalletAuth = useCallback(async () => {
    if (!connected || !publicKey) {
      setStatus("idle")
      return
    }
    if (!signMessage) {
      setError("This wallet does not support message signing. Try Phantom or Solflare.")
      setStatus("error")
      disconnect().catch(() => {})
      return
    }
    if (isAuthenticating.current) return
    isAuthenticating.current = true

    setStatus("signing")
    setError("")

    try {
      // 1. Request a nonce from the server
      const nonceRes = await fetch("/api/auth/wallet/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: publicKey.toBase58() }),
      })

      if (!nonceRes.ok) throw new Error("Failed to request nonce")
      const { nonce } = await nonceRes.json()

      // 2. Ask the wallet to sign the challenge message
      const message = new TextEncoder().encode(AUTH_MESSAGE(nonce))
      const signatureBytes = await signMessage(message)
      const signature = bs58.encode(signatureBytes)

      // 3. Authenticate with NextAuth
      setStatus("authenticating")
      const result = await signIn("wallet-signin", {
        walletAddress: publicKey.toBase58(),
        signature,
        nonce,
        redirect: false,
      })

      if (result?.error) {
        throw new Error("Server rejected the signature")
      }

      router.replace(result?.url ?? callbackUrl)
    } catch (err) {
      const msg = err instanceof Error ? err.message : ""
      if (msg.toLowerCase().includes("reject") || msg.toLowerCase().includes("cancel")) {
        setError("You cancelled the signing request.")
      } else if (msg.includes("Server rejected")) {
        setError("Signature verification failed. Please try again.")
      } else {
        setError("Wallet authentication failed. Please try again.")
      }
      setStatus("error")
      disconnect().catch(() => {})
    } finally {
      isAuthenticating.current = false
    }
  }, [connected, publicKey, signMessage, disconnect, router, callbackUrl])

  // After wallet selection, explicitly trigger adapter connect.
  useEffect(() => {
    if (status !== "connecting") return
    if (connected && publicKey) {
      handleWalletAuth()
      return
    }
    if (!wallet || connecting || hasAttemptedConnectRef.current) return

    hasAttemptedConnectRef.current = true
    connect().catch((err) => {
      const msg = err instanceof Error ? err.message : ""
      if (msg.toLowerCase().includes("reject") || msg.toLowerCase().includes("cancel")) {
        setError("Wallet connection was cancelled.")
      } else {
        setError("Could not connect to wallet. Unlock wallet and try again.")
      }
      setStatus("idle")
      hasAttemptedConnectRef.current = false
    })
  }, [status, wallet, connecting, connected, publicKey, connect, handleWalletAuth])

  // If user closes wallet modal without connecting, stop the spinner.
  useEffect(() => {
    if (status !== "connecting") return
    if (visible) {
      hasOpenedModalRef.current = true
      return
    }
    if (connected && publicKey) return
    if (hasOpenedModalRef.current) {
      const timer = setTimeout(() => {
        if (!wallet && !connecting && !connected) {
          setError("Wallet connection was cancelled.")
          setStatus("idle")
          hasOpenedModalRef.current = false
          hasAttemptedConnectRef.current = false
        }
      }, 250)
      return () => clearTimeout(timer)
    }
  }, [status, visible, wallet, connecting, connected, publicKey])

  // Guard against adapter/popup failures that never resolve.
  useEffect(() => {
    if (status !== "connecting") return
    const timeout = setTimeout(() => {
      if (!connected) {
        setError("Could not open your wallet. Ensure the extension is installed, unlocked, and popups are allowed.")
        setStatus("idle")
      }
    }, 15000)
    return () => clearTimeout(timeout)
  }, [status, connected])

  const handleClick = () => {
    if (status === "signing" || status === "authenticating") return
    setError("")
    if (!connected) {
      hasOpenedModalRef.current = false
      hasAttemptedConnectRef.current = false
      setStatus("connecting")
      setVisible(true)
    } else {
      setStatus("signing")
      handleWalletAuth()
    }
  }

  const isLoading = status === "connecting" || status === "signing" || status === "authenticating"

  const label = (() => {
    if (status === "connecting") return "Connecting wallet…"
    if (status === "signing") return "Waiting for signature…"
    if (status === "authenticating") return "Authenticating…"
    return isSignUp ? "Continue with Wallet" : "Sign in with Wallet"
  })()

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="w-full h-12 gap-3 border-border hover:bg-muted font-medium text-sm"
        onClick={handleClick}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          /* Solana gradient icon */
          <svg width="18" height="18" viewBox="0 0 397.7 311.7" fill="none">
            <linearGradient id="wsg" x1="360.9" y1="351.5" x2="141.2" y2="-69.2" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#9945FF" />
              <stop offset="1" stopColor="#14F195" />
            </linearGradient>
            <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7zm0-164.5c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7zm317.4-72.7c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 4.5C67 2.1 70.3.7 73.8.7h308.2z" fill="url(#wsg)" />
          </svg>
        )}
        {label}
      </Button>
      {error && (
        <p className="text-xs text-destructive text-center">{error}</p>
      )}
    </div>
  )
}
