// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { InsightsChart, BarCell, fillDayWindow } from "../insights-chart";

// ResponsiveContainer measures 0×0 in jsdom (no ResizeObserver layout), so
// recharts would render an empty chart. Give the chart child fixed dimensions
// instead, and drop the ResizeObserver dependency entirely.
vi.mock("recharts", async () => {
  const actual = await vi.importActual<typeof import("recharts")>("recharts");
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactElement }) =>
      React.cloneElement(children, { width: 480, height: 180 }),
  };
});

// Import AFTER the mock so the chart picks up the patched ResponsiveContainer.
const { RechartsInsightsChart, InsightsChartTooltip } =
  await import("../insights-chart-recharts");

const series = (values: number[]): { day: string; value: number }[] =>
  values.map((value, i) => ({
    day: `2026-08-${String(i + 1).padStart(2, "0")}`,
    value,
  }));

const usd = (v: number): string => `$${v.toFixed(2)}`;

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

describe("RechartsInsightsChart", () => {
  const rechartsData = (values: number[], secondary?: number[]) =>
    values.map((value, i) => ({
      day: `2026-08-${String(i + 1).padStart(2, "0")}`,
      value,
      secondary: secondary?.[i] ?? 0,
    }));

  it("draws one bar per day, zero days included", () => {
    const { container } = render(
      <RechartsInsightsChart
        variant="bar"
        data={rechartsData([3, 0, 5])}
        format={String}
        valueHeader="Lessons"
        locale="en"
      />
    );
    expect(container.querySelectorAll(".recharts-bar-rectangle")).toHaveLength(
      3
    );
  });

  it("renders an area path and axes for the spend series", () => {
    const { container } = render(
      <RechartsInsightsChart
        variant="area"
        data={rechartsData([0.5, 1.25, 0.75])}
        format={usd}
        valueHeader="USD"
        locale="en"
      />
    );
    expect(container.querySelector(".recharts-area-area")).toBeTruthy();
    // The complaint that started #1148: no axes. Both must now render.
    expect(container.querySelector(".recharts-xAxis")).toBeTruthy();
    expect(container.querySelector(".recharts-yAxis")).toBeTruthy();
  });

  it("thins the 30 daily x ticks to a readable subset, formatted like Aug 14", () => {
    const days = Array.from({ length: 30 }, (_, i) => ({
      day: `2026-08-${String(i + 1).padStart(2, "0")}`,
      value: i,
    }));
    const { container } = render(
      <RechartsInsightsChart
        variant="bar"
        data={days}
        format={String}
        valueHeader="Lessons"
        locale="en"
      />
    );
    const dayTicks = [
      ...container.querySelectorAll(".recharts-cartesian-axis-tick-value"),
    ]
      .map((t) => t.textContent ?? "")
      .filter((t) => t.startsWith("Aug"));
    // interval=4 keeps every 5th of 30 daily ticks — far fewer than 30, not zero.
    expect(dayTicks.length).toBeGreaterThan(0);
    expect(dayTicks.length).toBeLessThan(15);
    expect(dayTicks).toContain("Aug 1");
  });
});

describe("InsightsChartTooltip", () => {
  it("shows the date and value, with the secondary series as a second line", () => {
    render(
      <InsightsChartTooltip
        active
        payload={[
          { payload: { day: "2026-08-14", value: 1.25, secondary: 9 } },
        ]}
        format={usd}
        valueHeader="USD"
        secondary={{ header: "Requests", format: String }}
        locale="en"
      />
    );
    expect(screen.getByText("Aug 14")).toBeTruthy();
    expect(screen.getByText("USD: $1.25")).toBeTruthy();
    expect(screen.getByText("Requests: 9")).toBeTruthy();
  });

  it("renders nothing when inactive", () => {
    const { container } = render(
      <InsightsChartTooltip
        active={false}
        payload={[{ payload: { day: "2026-08-14", value: 1 } }]}
        format={String}
        valueHeader="Lessons"
        locale="en"
      />
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe("InsightsChart wrapper", () => {
  it("repeats every day in a screen-reader table", () => {
    render(
      <InsightsChart
        variant="bar"
        data={series([3, 0, 5])}
        label="Lessons completed per day"
        dayHeader="Day"
        valueHeader="Lessons"
        locale="en"
        empty="No data yet."
      />
    );

    const table = screen.getByRole("table", {
      name: "Lessons completed per day",
    });
    expect(table.querySelectorAll("tbody tr")).toHaveLength(3);
    expect(screen.getByRole("rowheader", { name: "2026-08-02" })).toBeTruthy();
  });

  it("carries the secondary series in the table as a column, not a second axis", () => {
    render(
      <InsightsChart
        variant="area"
        data={series([0.5, 1.25])}
        label="Daily AI spend"
        dayHeader="Day"
        valueHeader="USD"
        locale="en"
        format={usd}
        secondary={{ header: "Requests", values: [2, 9] }}
        empty="No data yet."
      />
    );

    expect(screen.getByRole("columnheader", { name: "Requests" })).toBeTruthy();
    expect(screen.getByRole("cell", { name: "$1.25" })).toBeTruthy();
    expect(screen.getByRole("cell", { name: "9" })).toBeTruthy();
  });

  it("shows the empty message rather than an axis with nothing on it", () => {
    render(
      <InsightsChart
        variant="bar"
        data={[]}
        label="Lessons completed per day"
        dayHeader="Day"
        valueHeader="Lessons"
        locale="en"
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
