// Chain-free selection + backoff policy for `pending_onchain_actions`.
//
// Outside lib/solana on purpose: the cron drain, the login drain, the
// chain-free quest sweep in lib/gamification (which an ESLint rule forbids from
// importing the Solana client graph) and the dry-run script all need the same
// "which rows are due" answer. This module imports nothing, so it is also
// unit-testable with a plain fake queue.
//
// WHY THIS EXISTS. Before #1247 the only selection was
// `.eq("user_id", …).is("resolved_at", null).lt("retry_count", 5)` with no
// ordering, no cap and no notion of "when was this last tried". Three
// consequences, all visible in prod on 21 Sep 2026:
//   • A row belonging to a learner who never signs in again is never selected
//     by anything (the drain ran only from the three login routes), which is
//     how 77 `quest_xp_mint` rows reached 29 days old with `last_error` NULL —
//     not failing, never attempted.
//   • Nothing recorded that an attempt happened, so `retry_count` stayed 0 on
//     all 461 rows and every `last_error` in the table had been written by the
//     PRODUCER (`queueFailedAction`) at enqueue time, never by a retry.
//   • With no ordering, an unbounded sweep either did everything or (on a
//     serverless kill) an arbitrary prefix, with no bias toward the oldest
//     debt.

// Attempt budget for a genuinely failing row, shared by every drain. A row at
// or above it is excluded from selection forever, so reaching it means
// abandonment — the drain logs when a row does. Deferrals (daily cap, course
// maintenance, capstone gate, mint cap, platform freeze) deliberately spend
// nothing from this budget.
//
// This is a FAILURE budget, not an attempt count: `attempt_count` /
// `last_attempt_at` are what every attempt writes, before it runs. Keeping them
// apart is what lets a deferral cost nothing while still being recorded.
//
// Lives here rather than in xp-queue-settlement so the selection policy and the
// budget cannot drift apart; that module re-exports it for its own callers.
export const MAX_RETRIES = 5;

/** Rows attempted per drain run. Sized for the 300s cron ceiling: each row is
 *  one or more RPC round-trips plus, for a send, a confirmation wait. */
export const DRAIN_LIMIT = 25;

/** Smallest backoff step, and therefore the coarse DB-side prefilter cutoff. */
export const BACKOFF_BASE_MS = 5 * 60 * 1000;

/** Ceiling on a single backoff step, so a row at the top of the budget still
 *  gets looked at within a few hours rather than never. */
export const BACKOFF_MAX_MS = 6 * 60 * 60 * 1000;

/**
 * Exponential backoff on FAILED attempts: 0 → due now, 1 → 5m, 2 → 20m,
 * 3 → 80m, 4 → 320m, capped at BACKOFF_MAX_MS.
 */
export function backoffMs(retryCount: number | null): number {
  const n = Math.max(0, retryCount ?? 0);
  if (n === 0) return 0;
  return Math.min(BACKOFF_BASE_MS * 4 ** (n - 1), BACKOFF_MAX_MS);
}

/**
 * Backoff floor keyed on attempts MADE, regardless of how they ended.
 *
 * GATE (deferral starvation). A deferral leaves `retry_count` at 0 by design,
 * so `backoffMs` alone returned 0 for a row that had been deferred a hundred
 * times — permanently due, permanently at the head of the queue. DRAIN_LIMIT
 * such rows (a capstone gate waiting on a deploy, a quest over the minter cap, a
 * course mid-recreate) monopolised every run and nothing behind them was ever
 * attempted again. A deferral is cheap but not free, and "this row said no last
 * time" is information: charge it a delay that grows with how often we have
 * asked, without touching the failure budget.
 */
export function attemptFloorMs(attemptCount: number | null): number {
  const n = Math.max(0, attemptCount ?? 0);
  if (n === 0) return 0;
  return Math.min(BACKOFF_BASE_MS * 2 ** (n - 1), BACKOFF_MAX_MS);
}

/**
 * How long this row must wait after its last attempt. The stricter of the two
 * curves: genuine failures back off fast (4x), and repeated deferrals still
 * back off (2x) instead of spinning.
 */
export function requiredDelayMs(
  row: Pick<DrainableRow, "retry_count" | "attempt_count">
): number {
  return Math.max(
    backoffMs(row.retry_count),
    attemptFloorMs(row.attempt_count)
  );
}

export interface DrainableRow {
  id: string;
  user_id: string | null;
  action_type: string;
  reference_id: string;
  payload: unknown;
  retry_count: number | null;
  attempt_count: number | null;
  failed_at: string | null;
  last_attempt_at: string | null;
  last_error: string | null;
  resolved_at: string | null;
}

/**
 * Is this row due for another attempt at `now`? A row never attempted is always
 * due; otherwise its last attempt must be at least `requiredDelayMs` old.
 *
 * `last_attempt_at` is stamped on EVERY attempt, including the ones that end in
 * a deferral (maintenance, capstone gate, mint cap, platform freeze, daily cap)
 * and the ones skipped for a missing wallet — a row the drain looked at and
 * declined must not stay at the head of the queue.
 */
export function isDueForRetry(
  row: Pick<DrainableRow, "retry_count" | "attempt_count" | "last_attempt_at">,
  now: number
): boolean {
  if (!row.last_attempt_at) return true;
  const last = Date.parse(row.last_attempt_at);
  // An unparseable stamp must not pin a row out of the queue forever.
  if (Number.isNaN(last)) return true;
  return now - last >= requiredDelayMs(row);
}

/**
 * Least-recently-attempted first, keyed on `COALESCE(last_attempt_at,
 * failed_at)`. A row never attempted sorts by how long it has been owed, so the
 * oldest debt still goes first; once attempted, a row goes to the back.
 *
 * GATE (deferral starvation, second half). Ordering on `failed_at` alone was
 * order-by-age-of-debt, which a permanently-gated old row wins on every single
 * run no matter how many times it has already been asked. Ordering on last
 * attempt makes the queue round-robin: being looked at costs you your place.
 */
export function attemptPriorityKey(row: DrainableRow): number {
  const stamp = row.last_attempt_at ?? row.failed_at;
  if (!stamp) return 0;
  const parsed = Date.parse(stamp);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function compareLeastRecentlyAttempted(
  a: DrainableRow,
  b: DrainableRow
): number {
  const at = attemptPriorityKey(a);
  const bt = attemptPriorityKey(b);
  if (at !== bt) return at - bt;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * The drain's row set: unresolved, inside the retry budget, due under backoff,
 * least-recently-attempted first, capped. `candidates` is whatever the coarse DB
 * query returned —
 * this function is the authority on the precise policy, so the same rules apply
 * to the cron drain, the login drain and the read-only dry run.
 */
export function selectDueRows(
  candidates: DrainableRow[],
  options: { now: number; limit?: number; maxRetries?: number }
): DrainableRow[] {
  const limit = options.limit ?? DRAIN_LIMIT;
  const maxRetries = options.maxRetries ?? MAX_RETRIES;
  return candidates
    .filter(
      (row) =>
        !row.resolved_at &&
        (row.retry_count ?? 0) < maxRetries &&
        isDueForRetry(row, options.now)
    )
    .sort(compareLeastRecentlyAttempted)
    .slice(0, limit);
}

/**
 * Group selected rows by owner, preserving the selection order both between
 * users (a user is placed by their first selected row) and within a user. The per-user
 * pipeline needs the grouping — one freeze check, one profile read, one Pass-1
 * quest-credit sweep per learner — and the ordering is what makes the global
 * cap fair: the 25 longest-unattended rows get the run, whoever owns them.
 */
export function groupByUser(
  rows: DrainableRow[]
): { userId: string; rows: DrainableRow[] }[] {
  const groups = new Map<string, DrainableRow[]>();
  for (const row of rows) {
    if (!row.user_id) continue;
    const existing = groups.get(row.user_id);
    if (existing) existing.push(row);
    else groups.set(row.user_id, [row]);
  }
  return [...groups].map(([userId, userRows]) => ({ userId, rows: userRows }));
}
