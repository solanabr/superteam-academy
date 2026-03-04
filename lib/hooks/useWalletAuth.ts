'use client'

import { useCallback, useState } from 'react'
import { useWallet as useWalletAdapter } from '@solana/wallet-adapter-react'
import { signIn, useSession } from 'next-auth/react'
import bs58 from 'bs58'

/**
 * Hook that orchestrates Sign-In With Solana (SIWS).
 *
 * Flow:
 *  1. Wallet connects via the adapter
 *  2. Client fetches a nonce from GET /api/auth/wallet?walletAddress=…
 *  3. Wallet signs the SIWS message
 *  4. Client calls NextAuth signIn('solana', { … })
 *  5. Server verifies the ed25519 signature
 *  6. Session is created with walletAddress attached
 *
 * @returns { signInWithWallet, isAuthenticating, error, isWalletLinked }
 */
export function useWalletAuth() {
  const { publicKey, signMessage, connected } = useWalletAdapter()
  const { data: session, update: updateSession } = useSession()
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isWalletLinked = Boolean(session?.user?.walletAddress)

  const signInWithWallet = useCallback(async () => {
    setError(null)

    if (!publicKey) {
      setError('Please connect your wallet first.')
      return false
    }

    if (!signMessage) {
      setError('Your wallet does not support message signing.')
      return false
    }

    setIsAuthenticating(true)

    try {
      const walletAddress = publicKey.toBase58()

      // 1. Fetch nonce + SIWS message from server
      const nonceRes = await fetch(`/api/auth/wallet?walletAddress=${walletAddress}`)
      if (!nonceRes.ok) {
        throw new Error('Failed to get sign-in message from server.')
      }

      const { message, nonce, issuedAt } = await nonceRes.json()

      // 2. Sign the message with the wallet
      const messageBytes = new TextEncoder().encode(message)
      const signatureBytes = await signMessage(messageBytes)
      const signature = bs58.encode(signatureBytes)

      // 3. Authenticate via NextAuth CredentialsProvider
      const result = await signIn('solana', {
        walletAddress,
        signature,
        nonce,
        issuedAt,
        redirect: false,
      })

      if (result?.error) {
        throw new Error('Signature verification failed. Please try again.')
      }

      // 4. If user already had an OAuth session, merge walletAddress into it
      if (session?.user && !session.user.walletAddress) {
        await updateSession({ walletAddress })
      }

      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Wallet sign-in failed.'
      setError(msg)
      return false
    } finally {
      setIsAuthenticating(false)
    }
  }, [publicKey, signMessage, session, updateSession])

  /**
   * Link a connected wallet to an existing OAuth session.
   * Same as signInWithWallet but specifically for OAuth users
   * who want to add their wallet address.
   */
  const linkWallet = useCallback(async () => {
    if (!session?.user) {
      setError('You must be signed in to link a wallet.')
      return false
    }
    return signInWithWallet()
  }, [session, signInWithWallet])

  return {
    signInWithWallet,
    linkWallet,
    isAuthenticating,
    error,
    isWalletLinked,
    connected,
    walletAddress: publicKey?.toBase58() ?? null,
  }
}
