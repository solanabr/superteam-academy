import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { pathsById } from "../store";

/**
 * Path visibility is a CONTENT decision, not a code one (#1138).
 *
 * `draft` and `retired` were defined in packages/content-schema/src/path.ts
 * and never read at runtime, so the only way to hide a path was to delete it
 * — which is why the Paths tab ended up held behind a hardcoded constant.
 * These pin the filter that replaced the constant: a path is hidden because
 * the content repo says so, and for no other reason.
 */

type Lifecycle = { _id: string; draft?: boolean; retired?: boolean };

/** Mirrors the predicate in getAllLearningPaths (lib/content/queries.ts). */
const visible = (p: Lifecycle) => !p.draft && !p.retired;

describe("path lifecycle flags gate visibility", () => {
  it("shows a live path", () => {
    expect(visible({ _id: "path-first-steps" })).toBe(true);
    expect(
      visible({ _id: "path-first-steps", draft: false, retired: false })
    ).toBe(true);
  });

  it("hides a draft path even when it has courses", () => {
    // The #627 leak: draft was announced-later, but nothing read the flag, so
    // a drafted path with courses rendered anyway.
    expect(visible({ _id: "path-x", draft: true })).toBe(false);
  });

  it("hides a retired path", () => {
    expect(visible({ _id: "path-y", retired: true })).toBe(false);
  });
});

describe("the committed bundle's shelves", () => {
  // The synthetic cases above pin the predicate; this pins what the predicate
  // actually selects out of the pinned content, which is the half that moves
  // on a lock bump.
  const order = (p: Lifecycle & { order?: unknown }) =>
    typeof p.order === "number" ? p.order : 999;
  const shelves = [...pathsById.values()]
    .filter(visible)
    .sort((a, b) => order(a) - order(b));

  it("is the three learner-ordered shelves, in order", () => {
    expect(shelves.map((p) => p._id)).toEqual([
      "path-comece-aqui",
      "path-hackathon",
      "path-construa-e-publique",
    ]);
    expect(shelves.map(order)).toEqual([1, 2, 3]);
  });

  it("keeps the retired First Steps shelf out of the listing", () => {
    // Retired in place rather than deleted (academy-courses#72), so the doc is
    // still in the bundle and `achievement-first-steps-path` keeps its id.
    expect(pathsById.get("path-first-steps")?.retired).toBe(true);
    expect(shelves.some((p) => p._id === "path-first-steps")).toBe(false);
  });
});
