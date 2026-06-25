/**
 * Daily-quest reset timing (pure — safe to unit test).
 */

/**
 * ISO timestamp of the next UTC midnight after `now` — when daily quests reset.
 * Defaults to the current time; injectable for tests.
 */
export function nextMidnightUtc(now: Date = new Date()): string {
  const next = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0,
      0
    )
  );
  return next.toISOString();
}
