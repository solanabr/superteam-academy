/* eslint-disable import/order -- vi.mock('server-only') must be hoisted above
   the module import so the `server-only` graph loads under vitest. */
import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getCapstoneFunnel } from "../capstone-funnel";
import { CAPSTONE_CREDENTIAL } from "../capstone-gate";

type CountResponse = {
  count: number | null;
  error: { message: string } | null;
};

// A head+count query builder mock: every chainable method returns the same
// thenable, which resolves to the response configured for its table. Records
// the eq()/is()/like() filters so tests can assert each count is scoped
// correctly (a funnel that counts the wrong rows is worse than none).
function adminClientWith(responses: Record<string, CountResponse>) {
  const filters: Record<string, Array<[string, unknown]>> = {};

  function builderFor(table: string) {
    const bucket: Array<[string, unknown]> = [];
    filters[table] = bucket;
    const response = responses[table] ?? { count: 0, error: null };
    const record =
      (op: string) =>
      (col: string, val: unknown = undefined) => {
        bucket.push([`${op}:${col}`, val]);
        return chain;
      };
    const chain = {
      select: () => chain,
      eq: record("eq"),
      is: record("is"),
      like: record("like"),
      then: (resolve: (r: CountResponse) => unknown) => resolve(response),
    };
    return chain;
  }

  const from = vi.fn((table: string) => builderFor(table));
  return { client: { from } as never, from, filters };
}

const { courseId, deployLessonId } = CAPSTONE_CREDENTIAL;

describe("getCapstoneFunnel — counters and scoping", () => {
  it("scopes each count to the capstone course + deploy lesson", async () => {
    const { client, filters, from } = adminClientWith({
      user_progress: { count: 3, error: null },
      deployed_programs: { count: 2, error: null },
      pending_onchain_actions: { count: 0, error: null },
      certificates: { count: 1, error: null },
    });

    const funnel = await getCapstoneFunnel(client);

    expect(funnel.completions).toBe(3);
    expect(funnel.deploys).toBe(2);
    expect(funnel.deferrals).toBe(0);
    expect(funnel.certificates).toBe(1);

    expect(from).toHaveBeenCalledWith("user_progress");
    expect(filters.user_progress).toEqual([
      ["eq:course_id", courseId],
      ["eq:lesson_id", deployLessonId],
      ["eq:completed", true],
    ]);
    expect(filters.deployed_programs).toEqual([
      ["eq:course_id", courseId],
      ["eq:lesson_id", deployLessonId],
    ]);
    // Deferrals: unresolved certificate queue rows parked by the capstone gate.
    expect(filters.pending_onchain_actions).toEqual([
      ["eq:action_type", "certificate"],
      ["is:resolved_at", null],
      ["like:last_error", `capstone-gate-%:${courseId}`],
    ]);
    expect(filters.certificates).toEqual([["eq:course_id", courseId]]);
  });
});

describe("getCapstoneFunnel — verdict", () => {
  async function verdictFor(counts: {
    completions: number;
    deploys: number;
    deferrals: number;
  }) {
    const { client } = adminClientWith({
      user_progress: { count: counts.completions, error: null },
      deployed_programs: { count: counts.deploys, error: null },
      pending_onchain_actions: { count: counts.deferrals, error: null },
      certificates: { count: 0, error: null },
    });
    return (await getCapstoneFunnel(client)).verdict;
  }

  it("is idle when nobody has reached the deploy lesson", async () => {
    expect(await verdictFor({ completions: 0, deploys: 0, deferrals: 0 })).toBe(
      "idle"
    );
  });

  it("is healthy the moment any deploy row lands", async () => {
    expect(await verdictFor({ completions: 5, deploys: 1, deferrals: 3 })).toBe(
      "healthy"
    );
  });

  it("flags write_path_suspect: completions + deferrals but zero deploys", async () => {
    expect(await verdictFor({ completions: 4, deploys: 0, deferrals: 2 })).toBe(
      "write_path_suspect"
    );
  });

  it("is watch when completions exist but nothing is deferred yet", async () => {
    expect(await verdictFor({ completions: 2, deploys: 0, deferrals: 0 })).toBe(
      "watch"
    );
  });

  it("is unavailable (never healthy) when any count read errors", async () => {
    const { client } = adminClientWith({
      user_progress: { count: 3, error: null },
      deployed_programs: { count: null, error: { message: "db down" } },
      pending_onchain_actions: { count: 0, error: null },
      certificates: { count: 0, error: null },
    });
    const funnel = await getCapstoneFunnel(client);
    expect(funnel.verdict).toBe("unavailable");
    // A failed read reports 0, not a stale/guessed number.
    expect(funnel.deploys).toBe(0);
  });
});
