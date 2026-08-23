// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { AchievementPatch3D } from "../achievement-patch-3d";

/**
 * The slab's faces sit at `±var(--t)/2`, and `--t` changes per breakpoint.
 * Slice offsets must therefore be expressed against that same variable: when
 * they were absolute pixels, shrinking `--t` on mobile left the outermost
 * slices in FRONT of the faces, covering the glyph and the stitch and
 * rendering every badge as a blank coloured blob.
 */
describe("AchievementPatch3D — the edge band tracks the thickness", () => {
  const renderPatch = () =>
    render(
      <AchievementPatch3D
        id="achievement-first-steps"
        glyph="01"
        category="progress"
      />
    );

  it("positions every slice against --t, never in pixels", () => {
    const { container } = renderPatch();
    const slices = [
      ...container.querySelectorAll<HTMLElement>(".patch3d__slice"),
    ];

    expect(slices.length).toBeGreaterThan(0);
    for (const slice of slices) {
      expect(slice.style.transform).toContain("var(--t)");
      // A bare px offset is the bug this test exists to catch.
      expect(slice.style.transform).not.toMatch(/translateZ\(-?[\d.]+px\)/);
    }
  });

  it("keeps every slice strictly inside the faces", () => {
    const { container } = renderPatch();
    const slices = [
      ...container.querySelectorAll<HTMLElement>(".patch3d__slice"),
    ];

    // transform reads `translateZ(calc(var(--t) / 2 * <fraction>))`; the faces
    // are at a fraction of exactly 1, so every slice must be under it.
    for (const slice of slices) {
      const fraction = Number(
        /\*\s*(-?[\d.]+)\)/.exec(slice.style.transform)?.[1]
      );
      expect(Number.isNaN(fraction)).toBe(false);
      expect(Math.abs(fraction)).toBeLessThan(1);
    }
  });

  it("renders both faces, each carrying the glyph", () => {
    const { container } = renderPatch();
    expect(container.querySelectorAll(".patch3d__face")).toHaveLength(2);
    expect(container.querySelectorAll(".patch-text")).toHaveLength(2);
  });
});
