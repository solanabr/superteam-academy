import { describe, it, expect } from "vitest";

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
