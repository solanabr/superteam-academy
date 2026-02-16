"use client"

import bs58 from "bs58"
import { useWallet } from "@solana/wallet-adapter-react"
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { sendInitLearner } from "@/lib/solana/init-learner"

type WalletSessionResponse = {
  authenticated: boolean
  user: {
    id: string
    walletAddress: string
    username: string
  } | null
}

type VerifyWalletResponse = {
  ok: boolean
  user: WalletSessionResponse["user"]
}

type WalletAuthContextValue = {
  isLoading: boolean
  isAuthenticated: boolean
  user: WalletSessionResponse["user"]
  authError: string | null
  loginWithWallet: () => Promise<void>
  logout: () => Promise<void>
}

const WalletAuthContext = createContext<WalletAuthContextValue | undefined>(undefined)

type WalletAuthProviderProps = {
  children: ReactNode
}

export function WalletAuthProvider({ children }: WalletAuthProviderProps) {
  const { publicKey, signMessage, sendTransaction, connected, disconnect } = useWallet()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<WalletSessionResponse["user"]>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const lastAutoAuthAddress = useRef<string | null>(null)
  const lastLearnerInitAttempt = useRef<string | null>(null)

  const syncSession = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/me", { method: "GET" })
      const data = (await response.json()) as WalletSessionResponse
      setIsAuthenticated(Boolean(data.authenticated))
      setUser(data.user ?? null)
      setAuthError(null)
    } catch {
      setIsAuthenticated(false)
      setUser(null)
      setAuthError("Unable to check wallet session.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void syncSession()
  }, [syncSession])

  const loginWithWallet = useCallback(async () => {
    if (!publicKey || !connected) {
      throw new Error("Connect a wallet before signing in.")
    }
    if (!signMessage) {
      throw new Error("This wallet does not support message signing.")
    }

    setIsLoading(true)
    setAuthError(null)
    try {
      const walletAddress = publicKey.toBase58()

      const nonceResponse = await fetch("/api/auth/wallet/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: walletAddress }),
      })
      if (!nonceResponse.ok) {
        throw new Error("Failed to generate wallet nonce.")
      }

      const { message } = (await nonceResponse.json()) as { message: string }
      const messageBytes = new TextEncoder().encode(message)
      const signedMessage = await signMessage(messageBytes)
      const signature = bs58.encode(signedMessage)

      const verifyResponse = await fetch("/api/auth/wallet/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: walletAddress,
          message,
          signature,
        }),
      })
      if (!verifyResponse.ok) {
        throw new Error("Wallet signature verification failed.")
      }

      const verifyData = (await verifyResponse.json()) as VerifyWalletResponse
      setIsAuthenticated(true)
      setUser(verifyData.user ?? null)
      setAuthError(null)
      lastAutoAuthAddress.current = walletAddress
    } catch (error) {
      setIsAuthenticated(false)
      setUser(null)
      setAuthError(error instanceof Error ? error.message : "Wallet authentication failed.")
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [connected, publicKey, signMessage])

  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      await fetch("/api/auth/wallet/logout", { method: "POST" })
      setIsAuthenticated(false)
      setUser(null)
      setAuthError(null)
      lastAutoAuthAddress.current = null
      lastLearnerInitAttempt.current = null
      if (connected) {
        await disconnect()
      }
    } finally {
      setIsLoading(false)
    }
  }, [connected, disconnect])

  useEffect(() => {
    if (!connected) {
      setIsAuthenticated(false)
      setUser(null)
      setAuthError(null)
      lastAutoAuthAddress.current = null
      lastLearnerInitAttempt.current = null
      return
    }

    const connectedAddress = publicKey?.toBase58() ?? null
    if (user?.walletAddress && connectedAddress && user.walletAddress !== connectedAddress) {
      setIsAuthenticated(false)
      setUser(null)
      setAuthError(null)
      lastAutoAuthAddress.current = null
      lastLearnerInitAttempt.current = null
    }
  }, [user, connected, publicKey])

  useEffect(() => {
    if (!connected || !publicKey) return
    if (isAuthenticated) return
    if (isLoading) return

    const connectedAddress = publicKey.toBase58()
    if (lastAutoAuthAddress.current === connectedAddress) return

    lastAutoAuthAddress.current = connectedAddress
    void loginWithWallet().catch(() => undefined)
  }, [connected, publicKey, isAuthenticated, isLoading, loginWithWallet])

  useEffect(() => {
    if (!connected || !publicKey || !sendTransaction) return
    if (!isAuthenticated || !user) return
    if (user.walletAddress !== publicKey.toBase58()) return
    if (lastLearnerInitAttempt.current === user.walletAddress) return

    let cancelled = false
    const run = async () => {
      try {
        const response = await fetch("/api/identity/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        })
        if (!response.ok) return
        const payload = (await response.json()) as {
          authenticated?: boolean
          snapshot?: { chain?: { hasLearnerProfile?: boolean } } | null
        }
        if (!payload.authenticated) return
        if (payload.snapshot?.chain?.hasLearnerProfile) {
          lastLearnerInitAttempt.current = user.walletAddress
          return
        }

        lastLearnerInitAttempt.current = user.walletAddress
        await sendInitLearner(sendTransaction, user.walletAddress)
        if (!cancelled) {
          setAuthError(null)
        }
      } catch (error) {
        if (!cancelled) {
          // Keep auth successful even if user rejected learner init signature.
          setAuthError(error instanceof Error ? error.message : "Learner profile initialization failed.")
        }
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [connected, publicKey, sendTransaction, isAuthenticated, user])

  const retryAuthentication = useCallback(() => {
    lastAutoAuthAddress.current = null
    return loginWithWallet()
  }, [loginWithWallet])

  const value = useMemo(
    () => ({
      isLoading,
      isAuthenticated,
      user,
      authError,
      loginWithWallet: retryAuthentication,
      logout,
    }),
    [user, authError, isAuthenticated, isLoading, retryAuthentication, logout],
  )

  return <WalletAuthContext.Provider value={value}>{children}</WalletAuthContext.Provider>
}

export function useWalletAuth(): WalletAuthContextValue {
  const context = useContext(WalletAuthContext)
  if (!context) {
    throw new Error("useWalletAuth must be used within WalletAuthProvider.")
  }
  return context
}
