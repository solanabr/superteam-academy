import { APIError, createAuthEndpoint } from 'better-auth/api'
import { setSessionCookie } from 'better-auth/cookies'
import bs58 from 'bs58'
import crypto from 'crypto'
import nacl from 'tweetnacl'
import { z } from 'zod'

/**
 * Better Auth plugin for Solana wallet authentication.
 *
 * Modeled after Better Auth's official SIWE (Ethereum) plugin.
 * Uses createAuthEndpoint + setSessionCookie to properly set
 * cookies through Better Auth's framework (same mechanism as OAuth).
 */
export const solanaAuth = () => ({
  id: 'solana-auth',
  endpoints: {
    solanaGetNonce: createAuthEndpoint(
      '/solana/nonce',
      {
        method: 'POST',
        body: z.object({
          walletAddress: z.string().min(32).max(44),
        }),
      },
      async (ctx) => {
        const { walletAddress } = ctx.body
        const nonce = crypto.randomUUID()

        // Store nonce in Better Auth's verification table (same as SIWE)
        await ctx.context.internalAdapter.createVerificationValue({
          identifier: `solana:${walletAddress}`,
          value: nonce,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min
        })

        return ctx.json({ nonce })
      },
    ),

    solanaVerify: createAuthEndpoint(
      '/solana/verify',
      {
        method: 'POST',
        body: z.object({
          message: z.string().min(1),
          signature: z.string().min(1),
          walletAddress: z.string().min(32).max(44),
        }),
        requireRequest: true,
      },
      async (ctx) => {
        const { message, signature, walletAddress } = ctx.body

        try {
          // 1. Verify nonce from verification table
          const verification =
            await ctx.context.internalAdapter.findVerificationValue(
              `solana:${walletAddress}`,
            )
          if (!verification || new Date() > verification.expiresAt) {
            throw APIError.fromStatus('UNAUTHORIZED', {
              message: 'Invalid or expired nonce',
              status: 401,
            })
          }

          // 2. Verify the ed25519 signature
          const messageBytes = new TextEncoder().encode(message)
          const signatureBytes = bs58.decode(signature)
          const pubKeyBytes = bs58.decode(walletAddress)

          const isValid = nacl.sign.detached.verify(
            messageBytes,
            signatureBytes,
            pubKeyBytes,
          )

          if (!isValid) {
            throw APIError.fromStatus('UNAUTHORIZED', {
              message: 'Invalid signature',
              status: 401,
            })
          }

          // 3. Clean up used nonce
          await ctx.context.internalAdapter.deleteVerificationByIdentifier(
            `solana:${walletAddress}`,
          )

          // 4. Find or create user (same pattern as SIWE plugin)
          let user = null

          // Check if user exists by email
          const walletEmail = `${walletAddress.slice(0, 8)}@wallet.superteam.local`
          const existingUser = await ctx.context.internalAdapter
            .findUserByEmail(walletEmail)
            .catch(() => null)

          if (existingUser?.user) {
            user = existingUser.user
          } else {
            // Create new user
            user = await ctx.context.internalAdapter.createUser({
              name: `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`,
              email: walletEmail,
              emailVerified: true,
              image: '',
              walletAddress,
              role: 'learner',
              onboardingComplete: false,
            })

            // Create account record (required by Better Auth)
            await ctx.context.internalAdapter.createAccount({
              userId: user.id,
              providerId: 'solana',
              accountId: walletAddress,
            })
          }

          // 5. Create session
          const session = await ctx.context.internalAdapter.createSession(
            user.id,
          )
          if (!session) {
            throw APIError.fromStatus('INTERNAL_SERVER_ERROR', {
              message: 'Failed to create session',
              status: 500,
            })
          }

          // 6. Set session cookie via Better Auth's internal mechanism
          // This is the KEY — same as SIWE line 176
          await setSessionCookie(ctx, { session, user })

          // 7. Return success
          return ctx.json({
            success: true,
            token: session.token,
            user: {
              id: user.id,
              walletAddress,
            },
          })
        } catch (error) {
          if (error instanceof APIError) throw error
          console.error('[solana-auth] Error:', error)
          throw APIError.fromStatus('UNAUTHORIZED', {
            message: 'Authentication failed',
            status: 401,
          })
        }
      },
    ),
  },
})
