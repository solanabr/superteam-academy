// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressBar, SEGMENT_CAP } from "../progress-bar";

describe("ProgressBar — segment math", () => {
  it("renders one cell per lesson and lights the completed ones", () => {
    const { container } = render(<ProgressBar value={9} max={15} segmented />);

    expect(container.querySelectorAll(".seg-cell")).toHaveLength(15);
    expect(container.querySelectorAll(".seg-cell--on")).toHaveLength(9);
    expect(container.querySelector(".seg-fill")).toBeNull();
  });

  it("keeps segments at the cap and falls back to a smooth fill past it", () => {
    const { container: atCap } = render(
      <ProgressBar value={1} max={SEGMENT_CAP} segmented />
    );
    expect(atCap.querySelectorAll(".seg-cell")).toHaveLength(SEGMENT_CAP);

    const { container: overCap } = render(
      <ProgressBar value={20} max={SEGMENT_CAP + 1} segmented />
    );
    expect(overCap.querySelectorAll(".seg-cell")).toHaveLength(0);
    expect(overCap.querySelector<HTMLElement>(".seg-fill")!.style.width).toBe(
      `${(20 / 25) * 100}%`
    );
  });

  it("lights one cell for an endowed fill with nothing completed", () => {
    const { container } = render(
      <ProgressBar value={0} max={8} displayFraction={0.06} segmented />
    );

    expect(container.querySelectorAll(".seg-cell--on")).toHaveLength(1);
  });

  it("leaves the bar empty when there is no progress and no endowment", () => {
    const { container } = render(<ProgressBar value={0} max={8} segmented />);

    expect(container.querySelectorAll(".seg-cell--on")).toHaveLength(0);
  });

  it("reports the honest count to assistive tech, not the endowed fill", () => {
    render(
      <ProgressBar
        value={0}
        max={8}
        displayFraction={0.06}
        segmented
        aria-label="0 of 8 lessons completed"
      />
    );

    const bar = screen.getByRole("progressbar", {
      name: "0 of 8 lessons completed",
    });
    expect(bar).toHaveAttribute("aria-valuenow", "0");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "8");
  });

  it("clamps a count above the total", () => {
    const { container } = render(<ProgressBar value={99} max={5} segmented />);

    expect(container.querySelectorAll(".seg-cell--on")).toHaveLength(5);
  });

  it("carries the size variant class", () => {
    const { container } = render(
      <ProgressBar value={1} max={4} segmented size="micro" />
    );

    expect(container.querySelector(".seg-track--micro")).not.toBeNull();
  });
});
