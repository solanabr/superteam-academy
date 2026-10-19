/* eslint-disable import/order -- vi.mock factories are hoisted above imports. */
import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

const compile = vi.hoisted(() => ({ compilePrPreview: vi.fn() }));
vi.mock("../preview-compile", () => compile);

import { getPreviewBundle, MAX_ENTRIES } from "../preview-store";

compile.compilePrPreview.mockImplementation((pr: number) =>
  Promise.resolve({
    head: { sha: String(pr).padStart(40, "0") },
    courses: [],
    lessonsByCourse: {},
    rawCourses: [],
    rawLessonsById: new Map(),
    l10n: {},
    xpPerLessonById: {},
    imagePaths: [`courses/c${pr}/assets/x.png`],
  })
);

describe("preview bundle cache", () => {
  it("holds at most three compiled PRs and drops the oldest", async () => {
    expect(MAX_ENTRIES).toBe(3);

    for (const pr of [1, 2, 3, 4]) await getPreviewBundle(pr);
    expect(compile.compilePrPreview).toHaveBeenCalledTimes(4);

    // 2, 3 and 4 are cached; 1 was evicted when 4 arrived.
    for (const pr of [2, 3, 4]) await getPreviewBundle(pr);
    expect(compile.compilePrPreview).toHaveBeenCalledTimes(4);
    await getPreviewBundle(1);
    expect(compile.compilePrPreview).toHaveBeenCalledTimes(5);
  });

  it("keeps the image paths as the asset route's lookup set", async () => {
    const bundle = await getPreviewBundle(9);
    expect(bundle.imagePaths.has("courses/c9/assets/x.png")).toBe(true);
  });
});
