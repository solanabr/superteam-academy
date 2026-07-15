import { describe, it, expect } from "vitest";
import { resolveRefs } from "../resolve-refs";

interface Doc {
  _id: string;
  title: string;
}

const byId = new Map<string, Doc>([
  ["course-a", { _id: "course-a", title: "Course A" }],
  ["course-b", { _id: "course-b", title: "Course B" }],
]);

describe("resolveRefs", () => {
  it("resolves every id that matches the map", () => {
    const { resolved, dangling } = resolveRefs(["course-a", "course-b"], byId);
    expect(resolved).toEqual([
      { _id: "course-a", title: "Course A" },
      { _id: "course-b", title: "Course B" },
    ]);
    expect(dangling).toEqual([]);
  });

  it("flags an id with no match as dangling instead of silently dropping it", () => {
    const { resolved, dangling } = resolveRefs(
      ["course-a", "course-ghost"],
      byId
    );
    expect(resolved).toEqual([{ _id: "course-a", title: "Course A" }]);
    expect(dangling).toEqual(["course-ghost"]);
  });

  it("handles an all-dangling list without throwing", () => {
    const { resolved, dangling } = resolveRefs(["nope", "also-nope"], byId);
    expect(resolved).toEqual([]);
    expect(dangling).toEqual(["nope", "also-nope"]);
  });

  it("returns empty arrays for an empty input", () => {
    expect(resolveRefs([], byId)).toEqual({ resolved: [], dangling: [] });
  });

  it("preserves input order for both resolved and dangling ids", () => {
    const { resolved, dangling } = resolveRefs(
      ["course-b", "ghost-1", "course-a", "ghost-2"],
      byId
    );
    expect(resolved.map((d) => d._id)).toEqual(["course-b", "course-a"]);
    expect(dangling).toEqual(["ghost-1", "ghost-2"]);
  });
});
