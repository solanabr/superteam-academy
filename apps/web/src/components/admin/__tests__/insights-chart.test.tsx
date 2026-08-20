// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { InsightsChart, BarCell, fillDayWindow } from "../insights-chart";

const series = (values: number[]): { day: string; value: number }[] =>
  values.map((value, i) => ({
    day: `2026-08-${String(i + 1).padStart(2, "0")}`,
    value,
  }));

describe("fillDayWindow", () => {
  it("pads a sparse series to a continuous window ending on endDay", () => {
    const filled = fillDayWindow(
      [{ day: "2026-08-18", count: 4 }],
      "2026-08-20",
      (day) => ({ day, count: 0 }),
      3
    );

    expect(filled).toEqual([
      { day: "2026-08-18", count: 4 },
      { day: "2026-08-19", count: 0 },
      { day: "2026-08-20", count: 0 },
    ]);
  });

  it("drops days that fall outside the window", () => {
    const filled = fillDayWindow(
      [
        { day: "2026-07-01", count: 99 },
        { day: "2026-08-20", count: 1 },
      ],
      "2026-08-20",
      (day) => ({ day, count: 0 }),
      2
    );

    expect(filled.map((d) => d.day)).toEqual(["2026-08-19", "2026-08-20"]);
    expect(filled.map((d) => d.count)).toEqual([0, 1]);
  });

  it("is a no-op on an already-continuous series (the SQL zero-fill path)", () => {
    const continuous = [
      { day: "2026-08-19", count: 0 },
      { day: "2026-08-20", count: 7 },
    ];
    expect(
      fillDayWindow(continuous, "2026-08-20", (day) => ({ day, count: 0 }), 2)
    ).toEqual(continuous);
  });
});

describe("InsightsChart", () => {
  it("draws one bar per day, zero days included", () => {
    const { container } = render(
      <InsightsChart
        variant="bar"
        data={series([3, 0, 5])}
        label="Lessons completed per day"
        dayHeader="Day"
        valueHeader="Lessons"
        empty="No data yet."
      />
    );

    const bars = container.querySelectorAll("svg rect");
    expect(bars).toHaveLength(3);
    // The tallest day reaches the top of the plot; the zero day still gets a
    // hairline so the window reads as continuous rather than as a gap.
    const heights = [...bars].map((b) => Number(b.getAttribute("height")));
    expect(heights[2] ?? 0).toBeGreaterThan(heights[0] ?? 0);
    expect(heights[1]).toBe(1);
  });

  it("labels every mark with its day and value", () => {
    const { container } = render(
      <InsightsChart
        variant="bar"
        data={series([3, 0, 5])}
        label="Lessons completed per day"
        dayHeader="Day"
        valueHeader="Lessons"
        empty="No data yet."
      />
    );

    const titles = [...container.querySelectorAll("svg title")].map(
      (t) => t.textContent
    );
    expect(titles).toEqual(["2026-08-01: 3", "2026-08-02: 0", "2026-08-03: 5"]);
  });

  it("repeats the data in a screen-reader table", () => {
    render(
      <InsightsChart
        variant="bar"
        data={series([3, 0, 5])}
        label="Lessons completed per day"
        dayHeader="Day"
        valueHeader="Lessons"
        empty="No data yet."
      />
    );

    expect(
      screen.getByRole("img", { name: "Lessons completed per day" })
    ).toBeTruthy();
    const table = screen.getByRole("table", {
      name: "Lessons completed per day",
    });
    expect(table.querySelectorAll("tbody tr")).toHaveLength(3);
    expect(screen.getByRole("rowheader", { name: "2026-08-02" })).toBeTruthy();
  });

  it("carries the secondary series in tooltips and the table, not a second axis", () => {
    const { container } = render(
      <InsightsChart
        variant="area"
        data={series([0.5, 1.25])}
        label="Daily AI spend"
        dayHeader="Day"
        valueHeader="USD"
        format={(v) => `$${v.toFixed(2)}`}
        secondary={{ header: "Requests", values: [2, 9] }}
        empty="No data yet."
      />
    );

    const titles = [...container.querySelectorAll("svg title")].map(
      (t) => t.textContent
    );
    expect(titles).toEqual([
      "2026-08-01: $0.50 · Requests 2",
      "2026-08-02: $1.25 · Requests 9",
    ]);
    // One line path plus one area path — never a second scaled series.
    expect(container.querySelectorAll("svg path")).toHaveLength(2);
    expect(screen.getByRole("columnheader", { name: "Requests" })).toBeTruthy();
  });

  it("renders an all-zero window instead of NaN coordinates", () => {
    const { container } = render(
      <InsightsChart
        variant="area"
        data={series([0, 0, 0])}
        label="Daily AI spend"
        dayHeader="Day"
        valueHeader="USD"
        empty="No data yet."
      />
    );

    for (const path of container.querySelectorAll("svg path")) {
      expect(path.getAttribute("d")).not.toContain("NaN");
    }
  });

  it("shows the empty message rather than an axis with nothing on it", () => {
    render(
      <InsightsChart
        variant="bar"
        data={[]}
        label="Lessons completed per day"
        dayHeader="Day"
        valueHeader="Lessons"
        empty="No data yet."
      />
    );
    expect(screen.getByText("No data yet.")).toBeTruthy();
  });
});

describe("BarCell", () => {
  it("fills proportionally to the row's share of the max", () => {
    const { container } = render(<BarCell value={5} max={20} />);
    const fill = container.querySelector("span[aria-hidden]") as HTMLElement;
    expect(fill.style.width).toBe("25%");
    expect(container.textContent).toBe("5");
  });

  it("does not divide by zero when every row is zero", () => {
    const { container } = render(<BarCell value={0} max={0} />);
    const fill = container.querySelector("span[aria-hidden]") as HTMLElement;
    expect(fill.style.width).toBe("0%");
  });
});
