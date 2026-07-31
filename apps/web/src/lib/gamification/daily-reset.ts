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

/**
 * The quest PERIOD (`YYYY-MM-DD`) a reward belongs to — the same calendar day
 * `get_daily_quest_state` stamps into `user_daily_quests.period_start` and into
 * the queue row's `reference_id` (`<questId>:<period>`).
 *
 * DAY SEMANTICS ARE UTC AND MUST NOT SHIFT. The SQL function keys every quest
 * on `CURRENT_DATE`, which on Supabase is the UTC date, and `nextMidnightUtc`
 * above already tells the learner the reset lands at UTC midnight. This helper
 * exists so the SERVER (never the browser's clock) names that day for the
 * client's toast dedupe — a learner in São Paulo (UTC-3) between 21:00 and
 * midnight local is already on the NEXT UTC day, so a client-derived local date
 * would name a different period than the row the server just wrote and the two
 * toast channels would stop deduping against each other.
 */
export function questPeriodUtc(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}
