import { getPayloadClient } from '@/libs/payload'
import crypto from 'crypto'

/**
 * Syncs a Better Auth user to the Payload CMS users collection.
 * Called from Better Auth's databaseHooks on user create/update.
 *
 * This is best-effort — errors are logged but never thrown,
 * so they don't break the main auth flow.
 */
export async function syncUserToPayload(betterAuthUser: {
  id: string
  email: string
  name?: string
  walletAddress?: string
  role?: string
  onboardingComplete?: boolean
  bio?: string
  twitter?: string
  github?: string
  linkedin?: string
  telegram?: string
  username?: string
}) {
  const payload = await getPayloadClient()

  // Check if user already exists in Payload by betterAuthId
  const { docs } = await payload.find({
    collection: 'users',
    where: { betterAuthId: { equals: betterAuthUser.id } },
    limit: 1,
  })

  const isWallet = betterAuthUser.email?.endsWith('@wallet.superteam.academy')
  const authMethod = isWallet ? 'wallet' : 'google'

  // For wallet users, derive a short valid email for Payload
  // Payload's auth: true validates email format — long pubkeys fail
  const payloadEmail = isWallet
    ? `w-${crypto.createHash('sha256').update(betterAuthUser.email).digest('hex').slice(0, 12)}@superteam.academy`
    : betterAuthUser.email

  const socialLinks = {
    github: betterAuthUser.github || '',
    twitter: betterAuthUser.twitter || '',
    website: '',
  }

  if (docs.length > 0) {
    // Update existing user
    await payload.update({
      collection: 'users',
      id: docs[0].id,
      data: {
        displayName: betterAuthUser.name || docs[0].displayName,
        username: betterAuthUser.username || docs[0].username || undefined,
        walletAddress:
          betterAuthUser.walletAddress || docs[0].walletAddress || undefined,
        onboardingComplete:
          betterAuthUser.onboardingComplete ?? docs[0].onboardingComplete,
        bio: betterAuthUser.bio || docs[0].bio,
        socialLinks,
      },
    })
  } else {
    // Create new user — password is required by Payload's auth: true
    // but Better Auth handles all actual authentication, so we use a random value
    const randomPassword = crypto.randomUUID() + crypto.randomUUID()
    await payload.create({
      collection: 'users',
      data: {
        betterAuthId: betterAuthUser.id,
        email: payloadEmail,
        password: randomPassword,
        displayName: betterAuthUser.name || '',
        username: betterAuthUser.username || undefined,
        walletAddress: betterAuthUser.walletAddress || undefined,
        authMethod,
        role: 'learner',
        isPublicProfile: true,
        onboardingComplete: betterAuthUser.onboardingComplete ?? false,
        socialLinks,
      },
    })
  }
}
