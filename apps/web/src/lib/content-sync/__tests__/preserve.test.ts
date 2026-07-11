import { describe, it, expect } from "vitest";
import {
  PRESERVE,
  PROJECTED_FIELDS,
  reattachPreserved,
  assertSchemaFieldsCovered,
} from "../preserve";
import type { BundleDoc } from "@/lib/content/compile/types";

describe("reattachPreserved", () => {
  it("carries onChainStatus from the existing course onto the projected one", () => {
    const projected: BundleDoc = {
      _id: "course-x",
      _type: "course",
      title: "X",
      sync: { source: "courses-academy", rev: "s" },
    };
    const existing: BundleDoc = {
      _id: "course-x",
      _type: "course",
      title: "OLD",
      onChainStatus: { coursePda: "PDA", isActive: true },
    };
    const merged = reattachPreserved(projected, existing);
    expect(merged.onChainStatus).toEqual({ coursePda: "PDA", isActive: true });
    expect(merged.title).toBe("X"); // repo wins for projected fields
  });

  it("is a no-op when there is no existing doc", () => {
    const projected: BundleDoc = {
      _id: "course-x",
      _type: "course",
      title: "X",
    };
    expect(
      reattachPreserved(projected, undefined).onChainStatus
    ).toBeUndefined();
  });

  it("does not preserve onChainStatus for a lesson (not in PRESERVE)", () => {
    const projected: BundleDoc = { _id: "lesson-x", _type: "lesson" };
    const existing: BundleDoc = {
      _id: "lesson-x",
      _type: "lesson",
      onChainStatus: { foo: 1 },
    };
    expect(
      reattachPreserved(projected, existing).onChainStatus
    ).toBeUndefined();
  });
});

describe("assertSchemaFieldsCovered", () => {
  it("passes when sanity fields == projected ∪ PRESERVE ∪ sync", () => {
    const fields = [...PROJECTED_FIELDS.course, ...PRESERVE.course, "sync"];
    expect(() => assertSchemaFieldsCovered("course", fields)).not.toThrow();
  });

  it("throws when Sanity has an unregistered field (would be wiped on sync)", () => {
    const fields = [
      ...PROJECTED_FIELDS.course,
      ...PRESERVE.course,
      "sync",
      "editorNote",
    ];
    expect(() => assertSchemaFieldsCovered("course", fields)).toThrow(
      /editorNote/
    );
  });
});
