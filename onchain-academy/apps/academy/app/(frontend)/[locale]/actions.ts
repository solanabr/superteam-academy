'use server'

import { awardXP } from '@/actions/xp.actions'

/**
 * Awards signup XP to a user
 * Wrapper around the universal awardXP action
 */
export async function awardSignupXP(betterAuthUserId: string) {
  return awardXP({
    betterAuthUserId,
    amount: 100,
    source: 'account-setup',
  })
}
