// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SegmentedControl } from "../segmented-control";

/**
 * One selected-state treatment for every "pick one of these" row (owner,
 * 22-08). Three surfaces had invented three different selected looks; they all
 * resolve to `.pressed-key` now, the same object a selected day key and a
 * primary button use.
 */

const SORT = [
  { value: "latest", label: "Latest" },
  { value: "top", label: "Top" },
  { value: "unanswered", label: "Unanswered" },
] as const;

describe("SegmentedControl", () => {
  it("marks only the selected segment as pressed", () => {
    render(
      <SegmentedControl
        options={SORT}
        value="top"
        onChange={vi.fn()}
        ariaLabel="Sort"
      />
    );

    expect(screen.getByRole("button", { name: "Top" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: "Latest" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });

  it("gives the selected segment the shared pressed-key treatment", () => {
    render(
      <SegmentedControl
        options={SORT}
        value="top"
        onChange={vi.fn()}
        ariaLabel="Sort"
      />
    );

    const on = screen.getByRole("button", { name: "Top" });
    const off = screen.getByRole("button", { name: "Latest" });

    expect(on.className).toContain("pressed-key");
    expect(off.className).not.toContain("pressed-key");
    // Both are still segments — only the state differs.
    expect(on.className).toContain("segctl-tab");
    expect(off.className).toContain("segctl-tab");
  });

  it("reports the picked value", () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl
        options={SORT}
        value="latest"
        onChange={onChange}
        ariaLabel="Sort"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Unanswered" }));
    expect(onChange).toHaveBeenCalledWith("unanswered");
  });

  it("names the group for assistive tech", () => {
    render(
      <SegmentedControl
        options={SORT}
        value="latest"
        onChange={vi.fn()}
        ariaLabel="Sort threads"
      />
    );

    expect(screen.getByRole("group", { name: "Sort threads" })).toBeDefined();
  });

  it("handles a null option — 'All' is a value, not a sentinel", () => {
    const onChange = vi.fn();
    const options = [
      { value: null, label: "All" },
      { value: "beginner", label: "Beginner" },
    ];

    render(
      <SegmentedControl
        options={options}
        value={null}
        onChange={onChange}
        ariaLabel="Difficulty"
      />
    );

    // null is selectable and selected, not treated as "nothing selected".
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );

    fireEvent.click(screen.getByRole("button", { name: "Beginner" }));
    expect(onChange).toHaveBeenCalledWith("beginner");
  });

  it("carries the track silhouette by default and pills on request", () => {
    const { container, rerender } = render(
      <SegmentedControl
        options={SORT}
        value="top"
        onChange={vi.fn()}
        ariaLabel="Sort"
      />
    );
    expect(container.querySelector(".segctl-track")).not.toBeNull();

    rerender(
      <SegmentedControl
        options={SORT}
        value="top"
        onChange={vi.fn()}
        ariaLabel="Sort"
        variant="pills"
      />
    );
    expect(container.querySelector(".segctl-pills")).not.toBeNull();
    expect(container.querySelector(".segctl-track")).toBeNull();
  });

  it("keeps every segment a real button (focusable, keyboard-operable)", () => {
    render(
      <SegmentedControl
        options={SORT}
        value="top"
        onChange={vi.fn()}
        ariaLabel="Sort"
      />
    );

    for (const name of ["Latest", "Top", "Unanswered"]) {
      const btn = screen.getByRole("button", { name });
      expect(btn.tagName).toBe("BUTTON");
      expect(btn).toHaveAttribute("type", "button");
    }
  });
});
