/**
 * `completed_at` for a lesson whose on-chain bit is already set when the learner
 * completes it. Quests count today's dated rows, so the date decides whether this
 * earns quest XP.
 *
 * Usually this is a mirror the webhook missed, and today is right. But when the
 * enrollment is older than the account, the wallet earned that bit under an earlier
 * account: nothing new was done, so the row is left undated and counts for nothing.
 * Progress still shows the lesson as complete. If either time is unknown the row
 * keeps today's date, as it always has.
 */
export function recoveredCompletedAt(
  enrolledAtSeconds: unknown,
  accountCreatedAt: string | null | undefined,
  now: Date = new Date()
): string | null {
  // String() because the Anchor decoder hands back a BN.
  const enrolledAt =
    enrolledAtSeconds == null ? NaN : Number(String(enrolledAtSeconds)) * 1000;
  const createdAt = accountCreatedAt ? Date.parse(accountCreatedAt) : NaN;
  if (
    !Number.isNaN(enrolledAt) &&
    !Number.isNaN(createdAt) &&
    enrolledAt < createdAt
  ) {
    return null;
  }
  return now.toISOString();
}
