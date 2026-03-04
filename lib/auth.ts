import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'
import { createClient } from '@supabase/supabase-js'
import { verifySIWSSignature, isNonceValid } from '@/lib/siws'
import '@/lib/types/next-auth.d'

async function userExistsByEmail(email?: string | null): Promise<boolean> {
  if (!email) return false

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return false
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (error) return false
    return !!data
  } catch {
    return false
  }
}

/**
 * Find or create a user by wallet address.
 * Returns the user row or null on failure.
 */
async function upsertWalletUser(walletAddress: string) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Try to find existing user by wallet_address
  const { data: existing } = await supabase
    .from('users')
    .select('id, email, display_name, avatar_url, wallet_address')
    .eq('wallet_address', walletAddress)
    .maybeSingle()

  if (existing) return existing

  // Also check if wallet was used as id (wallet-based accounts use wallet as id)
  const { data: byId } = await supabase
    .from('users')
    .select('id, email, display_name, avatar_url, wallet_address')
    .eq('id', walletAddress)
    .maybeSingle()

  if (byId) return byId

  // Create a new user with wallet address as the id
  const shortAddr = `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
  const { error: insertError } = await supabase.from('users').insert({
    id: walletAddress,
    email: `${walletAddress}@wallet.solana`,
    display_name: shortAddr,
    wallet_address: walletAddress,
    total_xp: 0,
    level: 1,
    current_streak: 0,
  })

  if (insertError) {
    console.error('Failed to create wallet user:', insertError.message)
    return null
  }

  const { data: created } = await supabase
    .from('users')
    .select('id, email, display_name, avatar_url, wallet_address')
    .eq('id', walletAddress)
    .maybeSingle()

  return created
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    }),

    /**
     * SIWS (Sign-In With Solana) — wallet-based authentication.
     *
     * The client:
     *  1. Fetches a nonce from GET /api/auth/wallet?walletAddress=…
     *  2. Signs the SIWS message with the wallet
     *  3. Calls signIn('solana', { walletAddress, signature, nonce, issuedAt })
     *
     * This provider verifies the ed25519 signature server-side and
     * upserts a user row keyed by the wallet address.
     */
    CredentialsProvider({
      id: 'solana',
      name: 'Solana Wallet',
      credentials: {
        walletAddress: { label: 'Wallet Address', type: 'text' },
        signature: { label: 'Signature', type: 'text' },
        nonce: { label: 'Nonce', type: 'text' },
        issuedAt: { label: 'Issued At', type: 'text' },
      },
      async authorize(credentials) {
        if (
          !credentials?.walletAddress ||
          !credentials?.signature ||
          !credentials?.nonce ||
          !credentials?.issuedAt
        ) {
          return null
        }

        const { walletAddress, signature, nonce, issuedAt } = credentials

        // 1. Verify the nonce hasn't expired (5-min window)
        if (!isNonceValid(issuedAt)) {
          console.warn('SIWS: nonce expired for', walletAddress)
          return null
        }

        // 2. Verify the ed25519 signature
        const valid = verifySIWSSignature(walletAddress, nonce, issuedAt, signature)
        if (!valid) {
          console.warn('SIWS: invalid signature for', walletAddress)
          return null
        }

        // 3. Find or create the user in Supabase
        const user = await upsertWalletUser(walletAddress)
        if (!user) {
          console.error('SIWS: failed to upsert user for', walletAddress)
          return null
        }

        return {
          id: user.id,
          name: user.display_name,
          email: user.email,
          image: user.avatar_url ?? null,
          provider: 'solana',
          walletAddress,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async signIn({ user, account }) {
      // Store provider info in user object for later use
      if (user) {
        user.provider = account?.provider
      }
      return true
    },
    async jwt({ token, user, account, trigger, session }) {
      if (trigger === 'update' && session) {
        if (typeof session.needsProfile === 'boolean') {
          token.needsProfile = session.needsProfile
        }
        if (typeof session.walletAddress === 'string') {
          token.walletAddress = session.walletAddress
        }
      }

      if (user) {
        const isWallet = user.provider === 'solana'
        const userId = isWallet ? user.id : (user.email || user.id)
        const exists = isWallet ? true : await userExistsByEmail(user.email)

        Object.assign(token, {
          id: userId,
          name: user.name,
          email: user.email,
          image: user.image,
          provider: isWallet ? 'solana' : account?.provider,
          needsProfile: !exists,
          walletAddress: user.walletAddress ?? token.walletAddress ?? null,
        })
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? ''
        session.user.provider = token.provider
        session.user.needsProfile = Boolean(token.needsProfile)
        session.user.walletAddress = token.walletAddress ?? null
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`
      if (url.startsWith(baseUrl)) return url
      return baseUrl
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
