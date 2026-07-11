import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

// Capture what each writer upserts into `onchain_deployments`. `upsert` returns
// `{ error: null }` by default; a test can override `upsertError` to exercise
// the fail-loud path.
let lastTable: string | null = null;
let lastRow: Record<string, unknown> | null = null;
let lastOptions: Record<string, unknown> | null = null;
let upsertError: { message: string } | null = null;

const upsert = vi.fn((row: Record<string, unknown>, options: Record<string, unknown>) => {
  lastRow = row;
  lastOptions = options;
  return Promise.resolve({ error: upsertError });
});
const fromFn = vi.fn((table: string) => {
  lastTable = table;
  return { upsert };
});

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ from: fromFn }),
}));

import {
  writeCourseOnChainStatus,
  writeCourseActive,
  writeCourseTrackCollection,
  writeAchievementOnChainStatus,
} from "../deployment-writes";

beforeEach(() => {
  lastTable = null;
  lastRow = null;
  lastOptions = null;
  upsertError = null;
  upsert.mockClear();
  fromFn.mockClear();
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

  it("throws when the upsert fails (fail-loud, so callers' best-effort catch fires)", async () => {
    upsertError = { message: "boom" };
    await expect(
      writeCourseOnChainStatus("course-x", "synced", "PDA_X", "SIG_X")
    ).rejects.toThrow(/onchain_deployments upsert failed for course-x: boom/);
  });
});
