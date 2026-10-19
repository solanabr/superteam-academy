import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

/**
 * Path visibility is a CONTENT decision, not a code one (#1138).
 *
 * `draft` and `retired` were defined in packages/content-schema/src/path.ts
 * and never read at runtime, so the only way to hide a path was to delete it
 * — which is why the Paths tab ended up held behind a hardcoded constant.
 * These pin the filter that replaced the constant: a path is hidden because
 * the content says so, and for no other reason. Runs the real
 * `getAllLearningPaths` over a fixture store with every course synced.
 */
vi.mock("../store", () => {
  const ref = (id: string) => ({ _ref: id, _type: "reference", _weak: true });
  const course = {
    _id: "course-a",
    _type: "course",
    slug: { _type: "slug", current: "a" },
    title: "A",
    modules: [],
  };
  const path = (id: string, fields: Record<string, unknown>) => ({
    _id: id,
    _type: "learningPath",
    title: id,
    courses: [ref("course-a")],
    ...fields,
  });
  const paths = [
    path("path-third", { order: 3 }),
    // The #627 leak: a drafted path with courses rendered anyway.
    path("path-draft", { order: 1, draft: true }),
    // Retired in place rather than deleted, like path-first-steps.
    path("path-retired", { order: 0, retired: true }),
    path("path-first", { order: 1, draft: false, retired: false }),
    path("path-unordered", {}),
  ];
  return {
    coursesById: new Map([[course._id, course]]),
    lessonsById: new Map(),
    l10nByCourseId: new Map(),
    pathsById: new Map(paths.map((p) => [p._id, p])),
  };
});

vi.mock("../deployments", () => ({
  isSynced: () => true,
  getActiveDeployments: vi.fn(async () => new Map()),
}));

import { getAllLearningPaths } from "../queries";

describe("path lifecycle flags gate visibility", () => {
  it("lists live paths in order and leaves draft and retired ones out", async () => {
    const paths = await getAllLearningPaths();
    expect(paths.map((p) => p._id)).toEqual([
      "path-first",
      "path-third",
      "path-unordered",
    ]);
  });
});
