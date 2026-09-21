import { describe, it, expect } from "vitest";
import {
  BACKOFF_BASE_MS,
  BACKOFF_MAX_MS,
  DRAIN_LIMIT,
  MAX_RETRIES,
  backoffMs,
  compareOldestFirst,
  groupByUser,
  isDueForRetry,
  selectDueRows,
  type DrainableRow,
} from "../selection";

// ---------------------------------------------------------------------------
// The selection policy behind every drain of `pending_onchain_actions`.
//
// Written against the 21 Sep 2026 prod shape: 91 unresolved rows spread over 29
// days and 34 learners, 77 of them `quest_xp_mint` that no drain had ever
// selected because selection was `.eq("user_id", <whoever just logged in>)`
// with no ordering and no cap.
// ---------------------------------------------------------------------------

const NOW = Date.parse("2026-09-21T12:00:00.000Z");

function row(overrides: Partial<DrainableRow> & { id: string }): DrainableRow {
  return {
    user_id: "u1",
    action_type: "quest_xp_mint",
    reference_id: `ref-${overrides.id}`,
    payload: { xpAmount: 10 },
    retry_count: 0,
    attempt_count: 0,
    failed_at: "2026-09-01T00:00:00.000Z",
    last_attempt_at: null,
    last_error: null,
    resolved_at: null,
    ...overrides,
  };
}

const minutesAgo = (n: number) => new Date(NOW - n * 60_000).toISOString();

describe("backoffMs", () => {
  it("makes a never-failed row due immediately and grows 4x per failure", () => {
    expect(backoffMs(0)).toBe(0);
    expect(backoffMs(1)).toBe(BACKOFF_BASE_MS);
    expect(backoffMs(2)).toBe(BACKOFF_BASE_MS * 4);
    expect(backoffMs(3)).toBe(BACKOFF_BASE_MS * 16);
  });

  it("caps the step so a row near the budget is still looked at", () => {
    expect(backoffMs(MAX_RETRIES)).toBeLessThanOrEqual(BACKOFF_MAX_MS);
    expect(backoffMs(99)).toBe(BACKOFF_MAX_MS);
  });

  it("treats a null count as zero", () => {
    expect(backoffMs(null)).toBe(0);
  });
});

describe("isDueForRetry", () => {
  it("is always due when nothing has ever been attempted", () => {
    expect(isDueForRetry({ retry_count: 4, last_attempt_at: null }, NOW)).toBe(
      true
    );
  });

  it("holds a just-attempted failing row back, and releases it after backoff", () => {
    const justTried = { retry_count: 1, last_attempt_at: minutesAgo(1) };
    expect(isDueForRetry(justTried, NOW)).toBe(false);
    expect(
      isDueForRetry({ retry_count: 1, last_attempt_at: minutesAgo(6) }, NOW)
    ).toBe(true);
  });

  it("holds a row attempted this second even with no failures recorded", () => {
    // A deferral stamps last_attempt_at without spending the budget; backoff(0)
    // is 0, so it is due again on the next run but never twice in one run.
    const deferred = { retry_count: 0, last_attempt_at: minutesAgo(0) };
    expect(isDueForRetry(deferred, NOW)).toBe(true);
  });

  it("does not pin a row out of the queue on an unparseable stamp", () => {
    expect(
      isDueForRetry({ retry_count: 2, last_attempt_at: "not a date" }, NOW)
    ).toBe(true);
  });
});

describe("selectDueRows", () => {
  it("returns the oldest debt first, across users", () => {
    const selected = selectDueRows(
      [
        row({ id: "newest", user_id: "u3", failed_at: "2026-09-19T00:00:00Z" }),
        row({ id: "oldest", user_id: "u2", failed_at: "2026-08-22T00:00:00Z" }),
        row({ id: "middle", user_id: "u1", failed_at: "2026-09-02T00:00:00Z" }),
      ],
      { now: NOW }
    );
    expect(selected.map((r) => r.id)).toEqual(["oldest", "middle", "newest"]);
  });

  it("drops resolved rows and rows at the retry budget", () => {
    const selected = selectDueRows(
      [
        row({ id: "ok" }),
        row({ id: "done", resolved_at: "2026-09-20T00:00:00Z" }),
        row({ id: "spent", retry_count: MAX_RETRIES }),
        row({ id: "last-chance", retry_count: MAX_RETRIES - 1 }),
      ],
      { now: NOW }
    );
    expect(selected.map((r) => r.id).sort()).toEqual(["last-chance", "ok"]);
  });

  it("drops rows whose backoff has not elapsed", () => {
    const selected = selectDueRows(
      [
        row({ id: "cooling", retry_count: 2, last_attempt_at: minutesAgo(5) }),
        row({ id: "ready", retry_count: 2, last_attempt_at: minutesAgo(25) }),
      ],
      { now: NOW }
    );
    expect(selected.map((r) => r.id)).toEqual(["ready"]);
  });

  it("caps the run, keeping the oldest — a long backlog drains over ticks", () => {
    const candidates = Array.from({ length: DRAIN_LIMIT + 10 }, (_, i) =>
      row({
        id: `r${String(i).padStart(2, "0")}`,
        failed_at: new Date(
          Date.parse("2026-08-01T00:00:00Z") + i * 86_400_000
        ).toISOString(),
      })
    );
    const selected = selectDueRows(candidates, { now: NOW });
    expect(selected).toHaveLength(DRAIN_LIMIT);
    expect(selected[0]?.id).toBe("r00");
    expect(selected.at(-1)?.id).toBe(
      `r${String(DRAIN_LIMIT - 1).padStart(2, "0")}`
    );
  });

  it("orders a NULL failed_at first — it can only be the oldest row there is", () => {
    const selected = selectDueRows(
      [row({ id: "dated" }), row({ id: "undated", failed_at: null })],
      { now: NOW }
    );
    expect(selected.map((r) => r.id)).toEqual(["undated", "dated"]);
  });
});

describe("groupByUser", () => {
  it("groups by owner, placing each user by their oldest row", () => {
    const groups = groupByUser(
      selectDueRows(
        [
          row({ id: "b1", user_id: "ub", failed_at: "2026-09-05T00:00:00Z" }),
          row({ id: "a1", user_id: "ua", failed_at: "2026-08-22T00:00:00Z" }),
          row({ id: "a2", user_id: "ua", failed_at: "2026-09-10T00:00:00Z" }),
        ],
        { now: NOW }
      )
    );
    expect(groups.map((g) => g.userId)).toEqual(["ua", "ub"]);
    expect(groups[0]?.rows.map((r) => r.id)).toEqual(["a1", "a2"]);
  });

  it("skips an ownerless row rather than inventing a user", () => {
    expect(groupByUser([row({ id: "orphan", user_id: null })])).toEqual([]);
  });
});

describe("compareOldestFirst", () => {
  it("breaks a tie on id, so a run is deterministic", () => {
    const a = row({ id: "a", failed_at: "2026-09-01T00:00:00Z" });
    const b = row({ id: "b", failed_at: "2026-09-01T00:00:00Z" });
    expect(compareOldestFirst(a, b)).toBeLessThan(0);
    expect(compareOldestFirst(b, a)).toBeGreaterThan(0);
    expect(compareOldestFirst(a, a)).toBe(0);
  });
});
