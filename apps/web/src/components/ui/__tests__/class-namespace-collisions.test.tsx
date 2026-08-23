// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { ProgressBar } from "@/components/course/progress-bar";
import { SegmentedControl } from "../segmented-control";

/**
 * Regression guard for a live bug: the segmented control shipped as `.seg`,
 * `.seg-track` and `.seg-pills`, which collided head-on with the progress
 * bar's own `.seg-track` / `.seg-cell` / `.seg-fill` family.
 *
 * The collision was not merely "two rules, later wins". The progress bar's
 * rules are UNLAYERED while the control's live in `@layer base`, and unlayered
 * CSS beats layered CSS outright regardless of order or specificity — so the
 * progress bar won every time and the community filter groups rendered as
 * 13px-tall clipped capsules.
 *
 * jsdom applies no stylesheet, so height cannot be asserted here. What CAN be
 * asserted is the thing that actually went wrong: the two components emitted
 * overlapping class names. This renders both and diffs the sets.
 */

function classesOf(el: HTMLElement): Set<string> {
  const found = new Set<string>();
  for (const node of [el, ...el.querySelectorAll<HTMLElement>("*")]) {
    for (const c of node.classList) found.add(c);
  }
  return found;
}

function segmentedClasses(): Set<string> {
  const { container } = render(
    <SegmentedControl
      options={[
        { value: "a", label: "A" },
        { value: "b", label: "B" },
      ]}
      value="a"
      onChange={vi.fn()}
      ariaLabel="Group"
    />
  );
  const track = classesOf(container.firstChild as HTMLElement);

  const { container: pillBox } = render(
    <SegmentedControl
      options={[
        { value: "a", label: "A" },
        { value: "b", label: "B" },
      ]}
      value="b"
      onChange={vi.fn()}
      ariaLabel="Group"
      variant="pills"
    />
  );
  for (const c of classesOf(pillBox.firstChild as HTMLElement)) track.add(c);
  return track;
}

function progressBarClasses(): Set<string> {
  const all = new Set<string>();
  for (const size of ["card", "slim", "micro"] as const) {
    for (const segmented of [true, false]) {
      const { container } = render(
        <ProgressBar value={3} max={8} size={size} segmented={segmented} />
      );
      for (const c of classesOf(container.firstChild as HTMLElement))
        all.add(c);
    }
  }
  return all;
}

describe("class namespaces — SegmentedControl vs ProgressBar", () => {
  it("emit disjoint class names", () => {
    const seg = segmentedClasses();
    const bar = progressBarClasses();

    const shared = [...seg].filter((c) => bar.has(c));
    expect(shared).toEqual([]);
  });

  it("the segmented control owns only its segctl- namespace", () => {
    for (const c of segmentedClasses()) {
      // `pressed-key` is shared BY DESIGN with day keys and is not a container
      // class; everything else this component emits must be namespaced.
      if (c === "pressed-key") continue;
      expect(c).toMatch(/^segctl-/);
    }
  });

  it("the progress bar keeps the seg- names it shipped with", () => {
    const bar = progressBarClasses();

    expect(bar.has("seg-track")).toBe(true);
    // …and the control must claim none of them.
    for (const c of bar) {
      expect(c.startsWith("segctl-")).toBe(false);
    }
  });
});
