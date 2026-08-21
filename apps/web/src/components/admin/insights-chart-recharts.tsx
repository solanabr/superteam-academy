"use client";

/**
 * Recharts renderer for the admin Insights time series (#1148 follow-up to
 * #1135). Split into its own module so `next/dynamic` code-splits recharts (and
 * its d3 deps) off every non-admin route — nothing here is imported statically
 * by `insights-chart.tsx`, only through the dynamic import.
 *
 * Colours come from the app's CSS tokens (`var(--primary)` …) so light/dark
 * follow the theme with no JS. The visual is `aria-hidden`; the accessible copy
 * is the `sr-only` table rendered by the wrapper.
 */

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface RechartsInsightsChartProps {
  variant: "bar" | "area";
  /** One row per day, ascending; `secondary` is the raw parallel value. */
  data: { day: string; value: number; secondary?: number }[];
  /** Formats the primary value (tooltip + Y axis). */
  format: (value: number) => string;
  valueHeader: string;
  /** Secondary series shown only in the tooltip, never as a second axis. */
  secondary?: { header: string; format: (value: number) => string };
  /** BCP-47 tag for month/day tick labels. */
  locale: string;
}

const GRID = "var(--border)";
const AXIS = "var(--text-3)";
const SERIES = "var(--primary)";

interface TooltipPayloadEntry {
  payload: { day: string; value: number; secondary?: number };
}

function tickDay(iso: string, locale: string): string {
  const parsed = Date.parse(`${iso}T00:00:00Z`);
  if (Number.isNaN(parsed)) return iso;
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

export function InsightsChartTooltip({
  active,
  payload,
  format,
  valueHeader,
  secondary,
  locale,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  format: (value: number) => string;
  valueHeader: string;
  secondary?: { header: string; format: (value: number) => string };
  locale: string;
}) {
  const row = active ? payload?.[0]?.payload : undefined;
  if (!row) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-card">
      <p className="font-mono text-text-3">{tickDay(row.day, locale)}</p>
      <p className="mt-0.5 font-semibold tabular-nums text-text">
        {valueHeader}: {format(row.value)}
      </p>
      {secondary ? (
        <p className="tabular-nums text-text-3">
          {secondary.header}: {secondary.format(row.secondary ?? 0)}
        </p>
      ) : null}
    </div>
  );
}

export function RechartsInsightsChart({
  variant,
  data,
  format,
  valueHeader,
  secondary,
  locale,
}: RechartsInsightsChartProps) {
  const axis = { fill: AXIS, fontSize: 11 };
  const xAxis = (
    <XAxis
      dataKey="day"
      // ~30 daily ticks would overlap; show every 5th, formatted "Aug 14".
      interval={4}
      tickFormatter={(iso: string) => tickDay(iso, locale)}
      tick={axis}
      tickLine={false}
      axisLine={{ stroke: GRID }}
      minTickGap={8}
    />
  );
  const yAxis = (
    <YAxis
      tickFormatter={format}
      tick={axis}
      tickLine={false}
      axisLine={false}
      width={44}
      tickCount={4}
    />
  );
  const grid = (
    <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
  );
  const tooltip = (
    <Tooltip
      cursor={{ fill: "var(--primary-dim)", stroke: GRID }}
      content={
        <InsightsChartTooltip
          format={format}
          valueHeader={valueHeader}
          secondary={secondary}
          locale={locale}
        />
      }
    />
  );

  return (
    <div aria-hidden="true" className="px-2 py-3">
      <ResponsiveContainer width="100%" height={180}>
        {variant === "bar" ? (
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
          >
            {grid}
            {xAxis}
            {yAxis}
            {tooltip}
            {/* A zero day keeps a hairline (minPointSize) so an idle day reads
                as continuous rather than as missing data. */}
            <Bar
              dataKey="value"
              fill={SERIES}
              radius={[2, 2, 0, 0]}
              minPointSize={2}
              isAnimationActive={false}
            />
          </BarChart>
        ) : (
          <AreaChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
          >
            <defs>
              <linearGradient id="insights-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SERIES} stopOpacity={0.45} />
                <stop offset="100%" stopColor={SERIES} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            {grid}
            {xAxis}
            {yAxis}
            {tooltip}
            <Area
              dataKey="value"
              stroke={SERIES}
              strokeWidth={2}
              fill="url(#insights-area)"
              isAnimationActive={false}
            />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
