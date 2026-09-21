import { describe, it, expect } from "vitest";
import {
  BACKOFF_BASE_MS,
  DRAIN_LIMIT,
  selectDueRows,
  type DrainableRow,
} from "../selection";

// ---------------------------------------------------------------------------
// GATE FINDING 1 (#1255) — deferral starvation, and the fix.
//
// A DEFERRED row never bumps `retry_count` (by design: the budget is for
// genuine failures), so with backoff keyed on `retry_count` alone its delay was
// `backoffMs(0)` = 0 — permanently due. Combined with oldest-`failed_at`-first
// ordering, DRAIN_LIMIT such rows (a capstone gate waiting on a deploy, a quest
// over the minter cap, a course mid-recreate) won every single run and nothing
// behind them was ever attempted again.
//
// Two changes close it, and this suite pins both: a backoff floor keyed on
// `attempt_count`, and ordering on COALESCE(last_attempt_at, failed_at) so
// being looked at costs a row its place in the queue.
// ---------------------------------------------------------------------------

const TICK_MS = 15 * 60_000;

function r(
  id: string,
  failedAt: string,
  over: Partial<DrainableRow> = {}
): DrainableRow {
  return {
    id,
    user_id: "u1",
    action_type: "certificate",
    reference_id: id,
    payload: {},
    retry_count: 0,
    attempt_count: 40,
    failed_at: failedAt,
    last_attempt_at: null,
    last_error: null,
    resolved_at: null,
    ...over,
  };
}

describe("deferral starvation", () => {
  it("a permanently-gated row does not hold the cap against a newer owed row", () => {
    const now = Date.parse("2026-09-21T12:00:00Z");
    // DRAIN_LIMIT capstone-gate deferrals, each attempted on the last cron tick
    // and each with a `failed_at` far older than the row they used to starve.
    const gated = Array.from({ length: DRAIN_LIMIT }, (_, i) =>
      r(`gated${i}`, `2026-08-0${(i % 9) + 1}T00:00:00Z`, {
        last_attempt_at: new Date(now - TICK_MS).toISOString(),
        last_error: "capstone-gate-deploy_required:course-x",
      })
    );
    const owed = r("owed", "2026-09-01T00:00:00Z", { attempt_count: 0 });

    const selected = selectDueRows([...gated, owed], { now });

    // The never-attempted row goes FIRST — its COALESCE key is its failed_at,
    // which predates every gated row's last attempt.
    expect(selected[0]?.id).toBe("owed");
    // And the gated rows are not even due: 40 attempts floors them at the cap.
    expect(selected).toHaveLength(1);
  });

  it("the owed row is drained on the very next run, not after 100 of them", () => {
    const now = Date.parse("2026-09-21T12:00:00Z");
    // Same shape, but the gated rows are only lightly deferred (1 attempt), so
    // they ARE due again — the starvation question is purely about ordering.
    const gated = Array.from({ length: DRAIN_LIMIT }, (_, i) =>
      r(`gated${i}`, "2026-08-01T00:00:00Z", {
        attempt_count: 1,
        last_attempt_at: new Date(now - TICK_MS).toISOString(),
        last_error: "capstone-gate-deploy_required:course-x",
      })
    );
    const owed = r("owed", "2026-09-01T00:00:00Z", { attempt_count: 0 });

    const selected = selectDueRows([...gated, owed], { now });

    expect(selected).toHaveLength(DRAIN_LIMIT);
    expect(selected.map((s) => s.id)).toContain("owed");
    expect(selected[0]?.id).toBe("owed");
  });

  it("a just-deferred row earns a real delay instead of spinning", () => {
    const now = Date.parse("2026-09-21T12:00:00Z");
    const justDeferred = r("d", "2026-08-01T00:00:00Z", {
      attempt_count: 1,
      last_attempt_at: new Date(now - 1000).toISOString(),
      last_error: "daily-cap-deferred",
    });

    expect(selectDueRows([justDeferred], { now })).toHaveLength(0);
    // …and is picked up once the floor has elapsed.
    expect(
      selectDueRows([justDeferred], { now: now + BACKOFF_BASE_MS + 1000 })
    ).toHaveLength(1);
  });

  it("round-robins: a row attempted this run yields to one attempted last run", () => {
    const now = Date.parse("2026-09-21T12:00:00Z");
    const justAttempted = r("recent", "2026-01-01T00:00:00Z", {
      attempt_count: 1,
      last_attempt_at: new Date(now - BACKOFF_BASE_MS * 2).toISOString(),
    });
    const attemptedLongAgo = r("stale", "2026-09-20T00:00:00Z", {
      attempt_count: 1,
      last_attempt_at: new Date(now - BACKOFF_BASE_MS * 20).toISOString(),
    });

    const selected = selectDueRows([justAttempted, attemptedLongAgo], { now });

    // `recent` has the far older failed_at and would have won under
    // oldest-debt ordering; least-recently-attempted puts `stale` first.
    expect(selected.map((s) => s.id)).toEqual(["stale", "recent"]);
  });
});
