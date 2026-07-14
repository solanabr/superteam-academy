import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

// Capture what each writer upserts into `onchain_deployments`. `upsert` returns
// `{ error: null }` by default; a test can override `upsertError` to exercise
// the fail-loud path.
let lastTable: string | null = null;
let lastRow: Record<string, unknown> | null = null;
let lastOptions: Record<string, unknown> | null = null;
let upsertError: { message: string } | null = null;

// F2 (acquireCourseMaintenanceGate) mock controls. The conditional acquire
// issues an `UPDATE ... WHERE content_id = ? AND in_maintenance = false
// SELECT content_id` first, then falls back to a plain `INSERT` iff the
// UPDATE touched zero rows.
let updateResult: {
  data: Array<{ content_id: string }> | null;
  error: { message: string } | null;
} = { data: [{ content_id: "course-x" }], error: null };
let insertResult: { error: { message: string; code?: string } | null } = {
  error: null,
};
let lastUpdatePatch: Record<string, unknown> | null = null;
let lastUpdateFilters: Record<string, unknown> = {};
let lastInsertRow: Record<string, unknown> | null = null;

const upsert = vi.fn(
  (row: Record<string, unknown>, options: Record<string, unknown>) => {
    lastRow = row;
    lastOptions = options;
    return Promise.resolve({ error: upsertError });
  }
);

class UpdateChain {
  private filters: Record<string, unknown> = {};
  constructor(patch: Record<string, unknown>) {
    lastUpdatePatch = patch;
  }
  eq(column: string, value: unknown): this {
    this.filters[column] = value;
    lastUpdateFilters = this.filters;
    return this;
  }
  select(): Promise<typeof updateResult> {
    return Promise.resolve(updateResult);
  }
}

const update = vi.fn(
  (patch: Record<string, unknown>) => new UpdateChain(patch)
);
const insert = vi.fn((row: Record<string, unknown>) => {
  lastInsertRow = row;
  return Promise.resolve(insertResult);
});

const fromFn = vi.fn((table: string) => {
  lastTable = table;
  return { upsert, update, insert };
});

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ from: fromFn }),
}));

import {
  writeCourseOnChainStatus,
  writeCourseActive,
  writeCourseTrackCollection,
  writeAchievementOnChainStatus,
  writeCourseMaintenanceFlag,
  acquireCourseMaintenanceGate,
} from "../deployment-writes";

beforeEach(() => {
  lastTable = null;
  lastRow = null;
  lastOptions = null;
  upsertError = null;
  upsert.mockClear();
  fromFn.mockClear();

  updateResult = { data: [{ content_id: "course-x" }], error: null };
  insertResult = { error: null };
  lastUpdatePatch = null;
  lastUpdateFilters = {};
  lastInsertRow = null;
  update.mockClear();
  insert.mockClear();
});

describe("deployment-writes (SP2-B on-chain status → Supabase)", () => {
  it("writeCourseOnChainStatus upserts course status columns keyed on content_id", async () => {
    await writeCourseOnChainStatus("course-x", "synced", "PDA_X", "SIG_X");

    expect(fromFn).toHaveBeenCalledWith("onchain_deployments");
    expect(lastTable).toBe("onchain_deployments");
    expect(lastOptions).toEqual({ onConflict: "content_id" });
    expect(lastRow).toMatchObject({
      content_id: "course-x",
      kind: "course",
      status: "synced",
      course_pda: "PDA_X",
      tx_signature: "SIG_X",
    });
    expect(typeof lastRow?.last_synced).toBe("string");
    expect(typeof lastRow?.updated_at).toBe("string");
    // No Sanity patch fields leak through.
    expect(lastRow).not.toHaveProperty("onChainStatus.status");
  });

  it("writeCourseActive upserts only the is_active flag (+ id/kind)", async () => {
    await writeCourseActive("course-x", false);

    expect(lastRow).toMatchObject({
      content_id: "course-x",
      kind: "course",
      is_active: false,
    });
    // Only the owned column is set — no status/pda churn on (re)activation.
    expect(lastRow).not.toHaveProperty("status");
    expect(lastRow).not.toHaveProperty("course_pda");
  });

  it("writeCourseTrackCollection upserts only the track collection address", async () => {
    await writeCourseTrackCollection("course-x", "TRACK_COLL_X");

    expect(lastRow).toMatchObject({
      content_id: "course-x",
      kind: "course",
      track_collection_address: "TRACK_COLL_X",
    });
    expect(lastRow).not.toHaveProperty("status");
  });

  it("writeAchievementOnChainStatus upserts achievement columns with kind=achievement", async () => {
    await writeAchievementOnChainStatus("achievement-x", "ACH_PDA", "ACH_COLL");

    expect(lastRow).toMatchObject({
      content_id: "achievement-x",
      kind: "achievement",
      status: "synced",
      achievement_pda: "ACH_PDA",
      collection_address: "ACH_COLL",
    });
    expect(typeof lastRow?.last_synced).toBe("string");
  });

  it("writeCourseMaintenanceFlag upserts only the in_maintenance flag (WS-2 #453 rail 3)", async () => {
    await writeCourseMaintenanceFlag("course-x", true);

    expect(lastRow).toMatchObject({
      content_id: "course-x",
      kind: "course",
      in_maintenance: true,
    });
    expect(lastRow).not.toHaveProperty("status");
    expect(lastRow).not.toHaveProperty("course_pda");
  });

  it("writeCourseMaintenanceFlag(false) clears the flag", async () => {
    await writeCourseMaintenanceFlag("course-x", false);
    expect(lastRow).toMatchObject({ in_maintenance: false });
  });

  it("throws when the upsert fails (fail-loud, so callers' best-effort catch fires)", async () => {
    upsertError = { message: "boom" };
    await expect(
      writeCourseOnChainStatus("course-x", "synced", "PDA_X", "SIG_X")
    ).rejects.toThrow(/onchain_deployments upsert failed for course-x: boom/);
  });

  // F1(a) — a transition to "synced" is, by definition, not mid-recreate, so
  // it must ALWAYS clear the maintenance gate in the same upsert. This is the
  // reachable recovery path for a gate stuck open by a failed/interrupted
  // recreate: re-running the ordinary Deploy/sync path on a stuck
  // `not_deployed` course clears the gate once the deploy lands.
  it('F1(a): writeCourseOnChainStatus(..., "synced", ...) clears in_maintenance in the SAME upsert', async () => {
    await writeCourseOnChainStatus("course-x", "synced", "PDA_X", "SIG_X");
    expect(lastRow).toMatchObject({
      status: "synced",
      in_maintenance: false,
    });
  });

  it("a transition to a NON-synced status (e.g. not_deployed) leaves in_maintenance untouched", async () => {
    await writeCourseOnChainStatus(
      "course-x",
      "not_deployed",
      "PDA_X",
      "SIG_X"
    );
    expect(lastRow).not.toHaveProperty("in_maintenance");
  });
});

// ---------------------------------------------------------------------------
// F2 — acquireCourseMaintenanceGate: conditional acquire (mutual exclusion).
// ---------------------------------------------------------------------------
describe("acquireCourseMaintenanceGate (F2 mutual exclusion)", () => {
  it("acquires by flipping an EXISTING unlocked row (UPDATE ... WHERE content_id = ? AND in_maintenance = false)", async () => {
    updateResult = { data: [{ content_id: "course-x" }], error: null };

    const acquired = await acquireCourseMaintenanceGate("course-x");

    expect(acquired).toBe(true);
    expect(lastUpdatePatch).toMatchObject({ in_maintenance: true });
    expect(lastUpdateFilters).toMatchObject({
      content_id: "course-x",
      in_maintenance: false,
    });
    // The UPDATE alone touched a row — never falls through to the INSERT path.
    expect(lastInsertRow).toBeNull();
  });

  it("acquires via INSERT when no row exists yet for this course (UPDATE touches zero rows, INSERT succeeds)", async () => {
    updateResult = { data: [], error: null };
    insertResult = { error: null };

    const acquired = await acquireCourseMaintenanceGate("course-new");

    expect(acquired).toBe(true);
    expect(lastInsertRow).toMatchObject({
      content_id: "course-new",
      kind: "course",
      in_maintenance: true,
    });
  });

  it("does NOT acquire when the UPDATE touches zero rows and the INSERT PK-conflicts (row already locked by someone else)", async () => {
    updateResult = { data: [], error: null };
    insertResult = {
      error: {
        message: "duplicate key value violates unique constraint",
        code: "23505",
      },
    };

    const acquired = await acquireCourseMaintenanceGate("course-x");

    expect(acquired).toBe(false);
  });

  it("throws on a genuine UPDATE error (not a lock-contention signal)", async () => {
    updateResult = { data: null, error: { message: "connection reset" } };

    await expect(acquireCourseMaintenanceGate("course-x")).rejects.toThrow(
      /maintenance gate acquire \(update\) failed for course-x: connection reset/
    );
  });

  it("throws on a genuine INSERT error that is NOT a PK conflict", async () => {
    updateResult = { data: [], error: null };
    insertResult = { error: { message: "not-null violation", code: "23502" } };

    await expect(acquireCourseMaintenanceGate("course-x")).rejects.toThrow(
      /maintenance gate acquire \(insert\) failed for course-x: not-null violation/
    );
  });
});
