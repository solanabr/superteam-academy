import { describe, it, expect } from "vitest";
import { applyEdits } from "../apply-edits";

describe("applyEdits", () => {
  it("applies a single search/replace to the buffer", () => {
    const r = applyEdits("let x = 1;", [
      { search: "let x = 1;", replace: "let x = 2;" },
    ]);
    expect(r).toEqual({ ok: true, proposed: "let x = 2;" });
  });

  it("applies multiple edits in order, each against the running buffer", () => {
    const r = applyEdits("a\nb\nc", [
      { search: "a", replace: "A" },
      { search: "c", replace: "C" },
    ]);
    expect(r).toEqual({ ok: true, proposed: "A\nb\nC" });
  });

  it("replaces only the FIRST occurrence of a search snippet", () => {
    const r = applyEdits("x x x", [{ search: "x", replace: "y" }]);
    expect(r).toEqual({ ok: true, proposed: "y x x" });
  });

  it("treats an empty replace as a deletion", () => {
    const r = applyEdits("keep\ndrop\n", [{ search: "drop\n", replace: "" }]);
    expect(r).toEqual({ ok: true, proposed: "keep\n" });
  });

  it("supports insertion by anchoring on an existing line", () => {
    const r = applyEdits("fn main() {}", [
      { search: "fn main() {}", replace: "// added\nfn main() {}" },
    ]);
    expect(r).toEqual({ ok: true, proposed: "// added\nfn main() {}" });
  });

  it("fails when a search snippet is not found in the buffer", () => {
    const r = applyEdits("let x = 1;", [
      { search: "let y = 9;", replace: "let y = 8;" },
    ]);
    expect(r).toEqual({ ok: false });
  });

  it("fails if any edit in the sequence misses (never partially applies)", () => {
    const r = applyEdits("a\nb", [
      { search: "a", replace: "A" },
      { search: "zzz", replace: "Z" },
    ]);
    // The first edit matched, but the whole apply fails closed — the caller must
    // not write a half-applied buffer.
    expect(r).toEqual({ ok: false });
  });

  it("fails on an empty search snippet (unlocatable)", () => {
    const r = applyEdits("anything", [{ search: "", replace: "x" }]);
    expect(r).toEqual({ ok: false });
  });

  it("fails on an empty or non-array edit list", () => {
    expect(applyEdits("code", [])).toEqual({ ok: false });
    expect(applyEdits("code", undefined as never)).toEqual({ ok: false });
  });
});
