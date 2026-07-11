import { describe, it, expect } from "vitest";
import {
  selectChangedDocs,
  selectPrunable,
  assertBlastRadius,
  prunableQuery,
} from "../prune";
import { BlastRadiusError, type BundleDoc } from "../types";

const doc = (id: string, extra: Partial<BundleDoc> = {}): BundleDoc => ({
  _id: id,
  _type: "lesson",
  ...extra,
});
const marked = (id: string, rev: string): BundleDoc =>
  doc(id, { sync: { source: "courses-academy", rev } });

describe("selectPrunable", () => {
  it("selects marked docs absent from the projected tree (by id, not rev)", () => {
    // `b` is in the new tree so it is kept even though its rev is stale; `a` is
    // ours and gone from the tree → pruned; `c` is unmarked → untouchable.
    const existing = [marked("a", "old"), marked("b", "old"), doc("c")];
    const prunable = selectPrunable(existing, new Set(["b"]));
    expect(prunable.map((d) => d._id)).toEqual(["a"]);
  });

  it("keeps a marked doc present in the tree even at a stale rev", () => {
    // The read-your-writes race: a just-written doc may still read at its OLD
    // rev, but as long as its id is in the projected set it must never prune.
    const existing = [marked("a", "old"), marked("b", "old")];
    expect(selectPrunable(existing, new Set(["a", "b"]))).toEqual([]);
  });

  it("NEVER selects an unmarked doc (no sync marker)", () => {
    const existing = [
      doc("imageAsset"),
      doc("handCreated"),
      marked("x", "old"),
    ];
    const prunable = selectPrunable(existing, new Set());
    expect(prunable.map((d) => d._id)).toEqual(["x"]);
    expect(prunable.some((d) => d._id === "imageAsset")).toBe(false);
  });

  it("never selects a doc from a different source", () => {
    const foreign = doc("f", { sync: { source: "other-repo", rev: "old" } });
    expect(selectPrunable([foreign], new Set())).toEqual([]);
  });
});

describe("assertBlastRadius", () => {
  it("aborts when the prune set exceeds 20% of managed docs", () => {
    expect(() => assertBlastRadius(25, 100)).toThrow(BlastRadiusError);
  });

  it("allows a prune at exactly the 20% line", () => {
    expect(() => assertBlastRadius(20, 100)).not.toThrow();
  });
});

describe("selectChangedDocs (idempotency)", () => {
  it("returns nothing when projected deep-equals existing (same sha re-run)", () => {
    const existing = [marked("a", "s1"), marked("b", "s1")];
    const projected = [marked("a", "s1"), marked("b", "s1")];
    expect(selectChangedDocs(existing, projected)).toEqual([]);
  });

  it("returns only the docs whose projected value changed", () => {
    const existing = [
      marked("a", "s1"),
      doc("b", {
        title: "old",
        sync: { source: "courses-academy", rev: "s1" },
      }),
    ];
    const projected = [
      marked("a", "s1"),
      doc("b", {
        title: "new",
        sync: { source: "courses-academy", rev: "s2" },
      }),
    ];
    expect(selectChangedDocs(existing, projected).map((d) => d._id)).toEqual([
      "b",
    ]);
  });

  it("preserves PRESERVE fields in the comparison (onChainStatus difference is ignored)", () => {
    const existing = [
      doc("a", {
        _type: "course",
        onChainStatus: { pda: "X" },
        sync: { source: "courses-academy", rev: "s1" },
      }),
    ];
    const projected = [
      doc("a", {
        _type: "course",
        onChainStatus: { pda: "X" },
        sync: { source: "courses-academy", rev: "s1" },
      }),
    ];
    expect(selectChangedDocs(existing, projected)).toEqual([]);
  });
});

describe("prunableQuery", () => {
  it("is marker-scoped and sha-parameterised", () => {
    expect(prunableQuery()).toBe(
      '*[sync.source == "courses-academy" && sync.rev != $sha]._id'
    );
  });
});
