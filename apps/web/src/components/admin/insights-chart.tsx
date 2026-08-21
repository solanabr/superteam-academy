"use client";

/**
 * Admin Insights time-series charts (#1148, rewritten from the hand-rolled SVG
 * of #1135 which had no axes and only a native-`title` tooltip).
 *
 * The visual is Recharts, loaded through `next/dynamic({ ssr: false })` so the
 * library — recharts + its d3 deps, ~50 kB gz — is code-split onto the
 * admin-only route and never ships in any other bundle. This module keeps only
 * the data prep (`fillDayWindow`), the `BarCell` table fill, and the wrapper
 * that pairs the lazy chart with an always-present `sr-only` table.
 *
 * Accessibility: the chart itself is `aria-hidden`; screen readers get the same
 * numbers from the `sr-only` table, so nobody hears "chart" with no data.
 */

import dynamic from "next/dynamic";

const RechartsInsightsChart = dynamic(
  () =>
    import("./insights-chart-recharts").then((mod) => ({
      default: mod.RechartsInsightsChart,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="px-2 py-3">
        <div className="bg-card-alt h-[180px] w-full animate-pulse rounded-lg" />
      </div>
    ),
  }
);

export interface DayPoint {
  /** `YYYY-MM-DD`, ascending, one entry per day of the window. */
  day: string;
  value: number;
}

interface InsightsChartProps {
  variant: "bar" | "area";
  data: DayPoint[];
  /** Describes the whole chart (table caption + tooltip context). */
  label: string;
  dayHeader: string;
  valueHeader: string;
  /** BCP-47 tag for localised month/day tick labels. */
  locale: string;
  /** Renders a value for the tooltip, Y axis, and the table. */
  format?: (value: number) => string;
  /**
   * A second series shown ONLY in the tooltip and the table. Deliberately not a
   * second axis: two y-scales on one plot invite reading a crossing as
   * meaningful when it is an artefact of the scaling.
   */
  secondary?: {
    header: string;
    values: number[];
    format?: (value: number) => string;
  };
  empty: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Number of daily buckets the two charts draw. */
export const CHART_WINDOW_DAYS = 30;

/**
 * Pads a sparse `{day, …}` series out to a continuous window ending on
 * `endDay`, inserting `zero` for days with no rows.
 *
 * `get_admin_insights()` already zero-fills in SQL, so on the RPC path this is
 * a no-op. It exists because the JS fallback does NOT — `aggregateInsights`
 * only emits days that have data — and a bar chart whose x-axis silently skips
 * idle days reads as continuous activity that never happened. Running both
 * paths through the same padding means the chart cannot tell them apart.
 */
export function fillDayWindow<T extends { day: string }>(
  series: readonly T[],
  endDay: string,
  zero: (day: string) => T,
  days: number = CHART_WINDOW_DAYS
): T[] {
  const byDay = new Map(series.map((entry) => [entry.day, entry]));
  const end = Date.parse(`${endDay}T00:00:00Z`);
  if (Number.isNaN(end)) return [...series];

  const out: T[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(end - i * DAY_MS).toISOString().slice(0, 10);
    out.push(byDay.get(day) ?? zero(day));
  }
  return out;
}

const identity = (v: number): string => String(v);

export function InsightsChart({
  variant,
  data,
  label,
  dayHeader,
  valueHeader,
  locale,
  format = identity,
  secondary,
  empty,
}: InsightsChartProps) {
  if (data.length === 0) {
    return <p className="p-4 text-sm text-text-3">{empty}</p>;
  }

  return (
    <div>
      <RechartsInsightsChart
        variant={variant}
        data={data.map((d, i) => ({
          day: d.day,
          value: d.value,
          secondary: secondary?.values[i] ?? 0,
        }))}
        format={format}
        valueHeader={valueHeader}
        secondary={
          secondary
            ? { header: secondary.header, format: secondary.format ?? identity }
            : undefined
        }
        locale={locale}
      />

      <table className="sr-only">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th scope="col">{dayHeader}</th>
            <th scope="col">{valueHeader}</th>
            {secondary ? <th scope="col">{secondary.header}</th> : null}
          </tr>
        </thead>
        <tbody>
          {data.map((d, i) => (
            <tr key={d.day}>
              <th scope="row">{d.day}</th>
              <td>{format(d.value)}</td>
              {secondary ? (
                <td>
                  {(secondary.format ?? identity)(secondary.values[i] ?? 0)}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Proportional fill behind a table cell — the row-level equivalent of the
 * charts above, for the per-course and per-lesson tables where the category
 * axis is a label, not a date.
 */
export function BarCell({
  value,
  max,
  format = identity,
}: {
  value: number;
  max: number;
  format?: (value: number) => string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="relative flex items-center">
      <span
        aria-hidden="true"
        className="bg-primary/20 absolute inset-y-0 left-0 rounded-sm"
        style={{ width: `${pct}%` }}
      />
      <span className="relative tabular-nums">{format(value)}</span>
    </div>
  );
}
