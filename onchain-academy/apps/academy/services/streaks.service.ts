import { getPayloadClient } from '@/libs/payload'

/**
 * Lazy streak evaluation — no cron job needed.
 * Call recordActivity() whenever the user completes a lesson or logs in.
 * The service checks the last activity date and increments/resets the streak.
 */

export async function getOrCreateStreak(userId: number) {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'streaks',
    where: { user: { equals: userId } },
    limit: 1,
  })

  if (docs[0]) return docs[0]

  return payload.create({
    collection: 'streaks',
    data: {
      user: userId,
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
      history: [],
    },
  })
}

export async function recordActivity(userId: number) {
  const streak = await getOrCreateStreak(userId)
  const today = new Date().toISOString().split('T')[0]
  const lastDate = streak.lastActivityDate
    ? new Date(streak.lastActivityDate).toISOString().split('T')[0]
    : null

  // Already recorded today
  if (lastDate === today) return streak

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  let newStreak = streak.currentStreak ?? 0

  if (lastDate === yesterdayStr) {
    // Consecutive day — increment
    newStreak += 1
  } else {
    // Streak broken — reset to 1
    newStreak = 1
  }

  const longestStreak = Math.max(streak.longestStreak ?? 0, newStreak)

  // Append to history (keep last 90 days)
  const history = Array.isArray(streak.history) ? [...streak.history] : []
  history.push({ date: today, active: true })
  if (history.length > 90) history.splice(0, history.length - 90)

  const payload = await getPayloadClient()
  return payload.update({
    collection: 'streaks',
    id: streak.id,
    data: {
      currentStreak: newStreak,
      longestStreak,
      lastActivityDate: new Date().toISOString(),
      history,
    },
  })
}
