'use server'

import { getPayloadClient } from '@/libs/payload'
import { getUserByBetterAuthId } from '@/services/users.service'

export interface AwardXPParams {
  betterAuthUserId: string
  amount: number
  source: string
}

/**
 * Awards XP to a user by their Better Auth ID
 *
 * @param params - Object containing betterAuthUserId, amount, and source
 * @returns Success status and optional error message
 */
export async function awardXP(params: AwardXPParams) {
  const { betterAuthUserId, amount, source } = params

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
        amount,
        source,
        timestamp: new Date().toISOString(),
      },
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to award XP:', error)
    return { success: false, error: 'Failed to award XP' }
  }
}
