'use server'

import { getPayloadClient } from '@/libs/payload'
import { getUserByBetterAuthId } from '@/services/users.service'

export async function awardSignupXP(betterAuthUserId: string) {
  try {
    // Get Payload user ID from Better Auth ID
    const payloadUser = await getUserByBetterAuthId(betterAuthUserId)

    if (!payloadUser) {
      console.error(
        'Payload user not found for Better Auth ID:',
        betterAuthUserId,
      )
      return { success: false, error: 'User not found' }
    }

    // Award XP via Payload
    const payload = await getPayloadClient()
    await payload.create({
      collection: 'xp-records',
      data: {
        user: payloadUser.id,
        amount: 100,
        source: 'account-setup',
        timestamp: new Date().toISOString(),
      },
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to award signup XP:', error)
    return { success: false, error: 'Failed to award XP' }
  }
}
