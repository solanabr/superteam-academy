import { describe, it, expect } from "vitest";
import {
  rawOrNull,
  isManaged,
  selectBackfillDocs,
  toRow,
  buildRows,
  fieldsEqual,
  checkParity,
  parseDbRow,
  type ManagedDoc,
  type DeploymentRow,
} from "../backfill-onchain-deployments";

const syncedCourse: ManagedDoc = {
  _id: "course-anchor-framework",
  _type: "course",
  sync: { source: "courses-academy" },
  onChainStatus: {
    status: "synced",
    coursePda: "PDA_COURSE",
    txSignature: "SIG",
    trackCollectionAddress: "TRACK",
    lastSynced: "2026-07-11T14:37:59.626Z",
    // isActive intentionally absent -> null preserved
  },
};

const achievementWithPda: ManagedDoc = {
  _id: "achievement-first-steps",
  _type: "achievement",
  sync: { source: "courses-academy" },
  onChainStatus: {
    status: "synced",
    achievementPda: "PDA_ACH",
    collectionAddress: "COLL",
    lastSynced: "2026-03-01T19:57:17.617Z",
  },
};

describe("rawOrNull — preserves NULL vs explicit false", () => {
  it("maps undefined to null", () => {
    expect(rawOrNull(undefined)).toBeNull();
  });
  it("keeps explicit false", () => {
    expect(rawOrNull(false)).toBe(false);
  });
  it("keeps explicit null", () => {
    expect(rawOrNull(null)).toBeNull();
  });
  it("keeps a truthy value", () => {
    expect(rawOrNull("x")).toBe("x");
  });
});

describe("isManaged — prune.ts criterion", () => {
  it("accepts our marker, non-draft", () => {
    expect(isManaged(syncedCourse)).toBe(true);
  });
  it("rejects foreign source", () => {
    expect(isManaged({ ...syncedCourse, sync: { source: "other" } })).toBe(
      false
    );
  });
  it("rejects missing sync", () => {
    expect(isManaged({ ...syncedCourse, sync: null })).toBe(false);
  });
  it("rejects drafts", () => {
    expect(
      isManaged({ ...syncedCourse, _id: "drafts.course-anchor-framework" })
    ).toBe(false);
  });
});

describe("selectBackfillDocs — synced courses + PDA achievements only", () => {
  it("keeps synced course + PDA achievement", () => {
    const out = selectBackfillDocs([syncedCourse, achievementWithPda]);
    expect(out.map((d) => d._id)).toEqual([
      "course-anchor-framework",
      "achievement-first-steps",
    ]);
  });
  it("drops an unsynced course", () => {
    const draftStatus: ManagedDoc = {
      ...syncedCourse,
      _id: "course-wip",
      onChainStatus: { status: "pending" },
    };
    expect(selectBackfillDocs([draftStatus])).toEqual([]);
  });
  it("drops a PDA-less achievement", () => {
    const noPda: ManagedDoc = {
      _id: "achievement-nopda",
      _type: "achievement",
      sync: { source: "courses-academy" },
      onChainStatus: { status: "pending", achievementPda: null },
    };
    expect(selectBackfillDocs([noPda])).toEqual([]);
  });
  it("drops an unmanaged doc even if synced", () => {
    expect(
      selectBackfillDocs([{ ...syncedCourse, sync: { source: "hand" } }])
    ).toEqual([]);
  });
});

describe("toRow — faithful column projection", () => {
  it("projects a course, isActive absent -> null, achievement fields null", () => {
    expect(toRow(syncedCourse)).toEqual<DeploymentRow>({
      content_id: "course-anchor-framework",
      kind: "course",
      status: "synced",
      course_pda: "PDA_COURSE",
      tx_signature: "SIG",
      collection_address: null,
      track_collection_address: "TRACK",
      achievement_pda: null,
      is_active: null,
      last_synced: "2026-07-11T14:37:59.626Z",
    });
  });
  it("preserves an explicit is_active=false", () => {
    const deactivated: ManagedDoc = {
      ...syncedCourse,
      onChainStatus: { ...syncedCourse.onChainStatus, isActive: false },
    };
    expect(toRow(deactivated).is_active).toBe(false);
  });
  it("projects an achievement with pda + collection", () => {
    expect(toRow(achievementWithPda)).toEqual<DeploymentRow>({
      content_id: "achievement-first-steps",
      kind: "achievement",
      status: "synced",
      course_pda: null,
      tx_signature: null,
      collection_address: "COLL",
      track_collection_address: null,
      achievement_pda: "PDA_ACH",
      is_active: null,
      last_synced: "2026-03-01T19:57:17.617Z",
    });
  });
});

describe("buildRows — sorted, filtered", () => {
  it("sorts by content_id", () => {
    const rows = buildRows([achievementWithPda, syncedCourse]);
    expect(rows.map((r) => r.content_id)).toEqual([
      "achievement-first-steps",
      "course-anchor-framework",
    ]);
  });
});

describe("fieldsEqual", () => {
  it("distinguishes null from false for is_active", () => {
    expect(fieldsEqual("is_active", null, false)).toBe(false);
    expect(fieldsEqual("is_active", null, null)).toBe(true);
    expect(fieldsEqual("is_active", false, false)).toBe(true);
  });
  it("treats equal instants in different notation as equal for last_synced", () => {
    expect(
      fieldsEqual(
        "last_synced",
        "2026-07-11T14:37:59.626Z",
        "2026-07-11T14:37:59.626+00:00"
      )
    ).toBe(true);
  });
  it("flags differing instants", () => {
    expect(
      fieldsEqual(
        "last_synced",
        "2026-07-11T14:37:59.626Z",
        "2026-07-11T14:38:00Z"
      )
    ).toBe(false);
  });
});

describe("checkParity — fail-closed", () => {
  const rows = buildRows([syncedCourse, achievementWithPda]);
  it("passes on identical row sets", () => {
    const p = checkParity(
      rows,
      rows.map((r) => ({ ...r }))
    );
    expect(p.ok).toBe(true);
    expect(p.expectedCount).toBe(2);
  });
  it("fails on count mismatch (missing row)", () => {
    const p = checkParity(rows, [rows[0]]);
    expect(p.ok).toBe(false);
    expect(p.countMatch).toBe(false);
    expect(p.missing).toContain("course-anchor-framework");
  });
  it("fails on an extra DB row", () => {
    const extra: DeploymentRow = { ...rows[0], content_id: "course-ghost" };
    const p = checkParity(rows, [...rows, extra]);
    expect(p.ok).toBe(false);
    expect(p.extra).toContain("course-ghost");
  });
  it("fails on a field divergence", () => {
    const mutated = rows.map((r) => ({ ...r }));
    mutated[0] = { ...mutated[0], course_pda: "WRONG" };
    const p = checkParity(rows, mutated);
    expect(p.ok).toBe(false);
    expect(p.fieldDiffs).toHaveLength(1);
    expect(p.fieldDiffs[0].field).toBe("course_pda");
  });
  it("passes when DB returns last_synced in Postgres notation", () => {
    const dbShape = rows.map((r) => ({
      ...r,
      last_synced: r.last_synced?.replace("Z", "+00:00") ?? null,
    }));
    expect(checkParity(rows, dbShape).ok).toBe(true);
  });
});

describe("parseDbRow — PostgREST JSON -> DeploymentRow", () => {
  it("coerces types and preserves null is_active", () => {
    const row = parseDbRow({
      content_id: "course-anchor-framework",
      kind: "course",
      status: "synced",
      course_pda: "PDA_COURSE",
      tx_signature: "SIG",
      collection_address: null,
      track_collection_address: "TRACK",
      achievement_pda: null,
      is_active: null,
      last_synced: "2026-07-11T14:37:59.626+00:00",
    });
    expect(row.is_active).toBeNull();
    expect(row.kind).toBe("course");
    expect(row.content_id).toBe("course-anchor-framework");
  });
  it("keeps a boolean is_active", () => {
    expect(
      parseDbRow({ content_id: "c", kind: "course", is_active: false })
        .is_active
    ).toBe(false);
  });
});
