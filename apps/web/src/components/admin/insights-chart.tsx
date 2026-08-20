"use client";

/**
 * Hand-rolled viewBox SVG charts for the admin Insights panel (#1135).
 *
 * A 30-point time series rendered as table rows is the one shape that least
 * suits rows, but adding a charting library to pull two sparklines onto an
 * admin-only screen is not a trade this bundle should make. Same approach as
 * `components/gamification/skill-radar.tsx`: plain SVG, `viewBox` scaling, and
 * colours from CSS tokens so light/dark come for free.
 *
 * Accessibility: the SVG is `role="img"` with an `aria-label`, every mark
 * carries a `<title>` for pointer hover, and the same numbers are repeated in a
 * `sr-only` table — a screen reader reads the data, not "chart".
 */

export interface DayPoint {
  /** `YYYY-MM-DD`, ascending, one entry per day of the window. */
  day: string;
  value: number;
}

interface InsightsChartProps {
  variant: "bar" | "area";
  data: DayPoint[];
  /** Describes the whole chart (`aria-label`). */
  label: string;
  dayHeader: string;
  valueHeader: string;
  /** Renders a value for the `<title>` tooltips and the table. */
  format?: (value: number) => string;
  /**
   * A second series shown ONLY in tooltips and the table. Deliberately not a
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

const W = 320;
const H = 96;
const PAD_Y = 6;

const identity = (v: number): string => String(v);

export function InsightsChart({
  variant,
  data,
  label,
  dayHeader,
  valueHeader,
  format = identity,
  secondary,
  empty,
}: InsightsChartProps) {
  if (data.length === 0) {
    return <p className="p-4 text-sm text-text-3">{empty}</p>;
  }

  // A flat all-zero window would divide by zero; treat it as a full-height
  // scale of 1 so the baseline still renders instead of NaN coordinates.
  const max = Math.max(1, ...data.map((d) => d.value));
  const n = data.length;
  const plotH = H - PAD_Y * 2;
  const y = (value: number): number => PAD_Y + plotH * (1 - value / max);

  const slot = W / n;
  const barW = Math.max(1, slot * 0.68);

  const points = data.map((d, i) => ({
    x: slot * i + slot / 2,
    y: y(d.value),
  }));
  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(" ");
  const firstX = slot / 2;
  const lastX = slot * (n - 1) + slot / 2;
  const baseline = H - PAD_Y;
  const area = `${line} L${lastX.toFixed(2)},${baseline} L${firstX.toFixed(2)},${baseline} Z`;

  const tooltip = (d: DayPoint, i: number): string => {
    const head = `${d.day}: ${format(d.value)}`;
    if (!secondary) return head;
    const raw = secondary.values[i] ?? 0;
    return `${head} · ${secondary.header} ${(secondary.format ?? identity)(raw)}`;
  };

  return (
    <div className="px-4 py-3">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={label}
        className="h-24 w-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="insights-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        <line
          x1="0"
          y1={H - PAD_Y}
          x2={W}
          y2={H - PAD_Y}
          stroke="var(--border)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />

        {variant === "bar"
          ? data.map((d, i) => {
              const top = y(d.value);
              return (
                <rect
                  key={d.day}
                  x={slot * i + (slot - barW) / 2}
                  y={top}
                  width={barW}
                  // A zero day still gets a hairline so the window reads as
                  // continuous rather than as missing data.
                  height={Math.max(1, H - PAD_Y - top)}
                  rx="1"
                  fill="var(--primary)"
                  opacity={d.value === 0 ? 0.25 : 0.85}
                >
                  <title>{tooltip(d, i)}</title>
                </rect>
              );
            })
          : null}

        {variant === "area" ? (
          <>
            <path d={area} fill="url(#insights-area)" />
            <path
              d={line}
              fill="none"
              stroke="var(--primary)"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            {data.map((d, i) => (
              // Invisible hit target per day: the line itself is too thin to
              // hover, and a 2px dot per day would clutter 30 points.
              <rect
                key={d.day}
                x={slot * i}
                y="0"
                width={slot}
                height={H}
                fill="transparent"
              >
                <title>{tooltip(d, i)}</title>
              </rect>
            ))}
          </>
        ) : null}
      </svg>

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
