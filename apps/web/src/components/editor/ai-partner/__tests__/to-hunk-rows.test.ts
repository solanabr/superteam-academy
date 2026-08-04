import { describe, it, expect } from "vitest";
import { toHunkRows } from "../diff-card";

type L = { kind: "unchanged" | "added" | "removed"; text: string };
const u = (n: number): L[] =>
  Array.from({ length: n }, (_, i) => ({ kind: "unchanged", text: `u${i}` }));
const add = (text: string): L => ({ kind: "added", text });

describe("toHunkRows (propose-diff hunk collapsing)", () => {
  it("collapses long unchanged runs to gaps around a middle change", () => {
    const rows = toHunkRows([...u(10), add("x"), ...u(10)]);
    // 10 leading unchanged → 8 collapsed + 2 context; same on the right.
    expect(rows[0]).toEqual({ kind: "gap", count: 8 });
    expect(rows.slice(1, 3).every((r) => r.kind === "unchanged")).toBe(true);
    expect(rows[3]).toEqual({ kind: "added", text: "x" });
    expect(rows.slice(4, 6).every((r) => r.kind === "unchanged")).toBe(true);
    expect(rows[6]).toEqual({ kind: "gap", count: 8 });
    expect(rows).toHaveLength(7);
  });

  it("merges overlapping context windows into one run (no zero gaps)", () => {
    const rows = toHunkRows([add("a"), ...u(3), add("b")]);
    // ±2 windows overlap across the 3 unchanged lines — everything kept.
    expect(rows).toHaveLength(5);
    expect(rows.some((r) => r.kind === "gap")).toBe(false);
  });

  it("clamps context at both buffer edges", () => {
    const rows = toHunkRows([add("first"), ...u(6), add("last")]);
    expect(rows[0]).toEqual({ kind: "added", text: "first" });
    expect(rows.at(-1)).toEqual({ kind: "added", text: "last" });
    expect(rows.filter((r) => r.kind === "gap")).toEqual([
      { kind: "gap", count: 2 },
    ]);
  });

  it("renders an all-unchanged input as a single gap", () => {
    expect(toHunkRows(u(5))).toEqual([{ kind: "gap", count: 5 }]);
  });
});
