"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useAdminStats } from "@/lib/hooks/use-admin-stats";
import { TRACK_COLORS, TRACK_LABELS, type TrackType } from "@/lib/constants";

const CHART_COLORS = [
  "#00FFA3",
  "#03E1FF",
  "#CA9FF5",
  "#F48252",
  "#EF4444",
  "#EC4899",
  "#FFC526",
  "#6693F7",
];

function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div
      className="animate-pulse rounded bg-[var(--c-border-subtle)]/30"
      style={{ height }}
    />
  );
}

export function AnalyticsCharts() {
  const { stats, loading } = useAdminStats();

  // Enrollment line chart data (last 30 days, show last 14 for readability)
  const enrollmentData = (stats?.enrollmentsByDay ?? []).slice(-14).map((d) => ({
    date: d.date.slice(5), // "MM-DD"
    enrollments: d.count,
  }));

  // XP by track bar chart data
  const xpByTrackData = (stats?.xpByTrack ?? []).map((t) => ({
    track: TRACK_LABELS[t.track as TrackType] ?? t.track,
    xp: t.xp,
    fill: TRACK_COLORS[t.track as TrackType] ?? "#888",
  }));

  // Completion rate pie chart data
  const completionRate = stats?.completionRate ?? 0;
  const pieData = [
    { name: "Completed", value: completionRate },
    { name: "In Progress", value: 100 - completionRate },
  ];

  // Custom tooltip
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ value: number; name: string }>;
    label?: string;
  }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] px-3 py-2 shadow-lg">
        {label && (
          <p className="text-[10px] text-[var(--c-text-2)] mb-1">{label}</p>
        )}
        {payload.map((entry, i) => (
          <p
            key={i}
            className="text-xs font-mono text-[var(--c-text)]"
          >
            {entry.name}: {entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Enrollment Trend */}
      <div className="rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] p-4">
        <h4 className="text-xs font-medium text-[var(--c-text-2)] uppercase tracking-wider mb-4">
          Enrollments (Last 14 Days)
        </h4>
        {loading ? (
          <ChartSkeleton height={220} />
        ) : enrollmentData.length === 0 ? (
          <div className="flex items-center justify-center h-[220px] text-sm text-[var(--c-text-2)]">
            No enrollment data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={enrollmentData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--c-border-subtle)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fill: "var(--c-text-2)", fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: "var(--c-border-subtle)" }}
              />
              <YAxis
                tick={{ fill: "var(--c-text-2)", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={35}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="enrollments"
                name="Enrollments"
                stroke="#00FFA3"
                strokeWidth={2}
                dot={{ r: 3, fill: "#00FFA3", strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#00FFA3", strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* XP by Track and Completion Rate side by side */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* XP Distribution by Track */}
        <div className="rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] p-4">
          <h4 className="text-xs font-medium text-[var(--c-text-2)] uppercase tracking-wider mb-4">
            XP by Track
          </h4>
          {loading ? (
            <ChartSkeleton height={200} />
          ) : xpByTrackData.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-sm text-[var(--c-text-2)]">
              No XP data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={xpByTrackData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--c-border-subtle)"
                  vertical={false}
                />
                <XAxis
                  dataKey="track"
                  tick={{ fill: "var(--c-text-2)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: "var(--c-border-subtle)" }}
                />
                <YAxis
                  tick={{ fill: "var(--c-text-2)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="xp" name="XP" radius={[2, 2, 0, 0]}>
                  {xpByTrackData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.fill}
                      fillOpacity={0.8}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Completion Rate */}
        <div className="rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] p-4">
          <h4 className="text-xs font-medium text-[var(--c-text-2)] uppercase tracking-wider mb-4">
            Completion Rate
          </h4>
          {loading ? (
            <ChartSkeleton height={200} />
          ) : (
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    <Cell fill="#00FFA3" />
                    <Cell fill="var(--c-border-subtle)" />
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  {/* Center label */}
                  <text
                    x="50%"
                    y="48%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="var(--c-text)"
                    fontFamily="monospace"
                    fontSize={28}
                    fontWeight={700}
                  >
                    {completionRate}%
                  </text>
                  <text
                    x="50%"
                    y="62%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="var(--c-text-2)"
                    fontSize={10}
                  >
                    completion
                  </text>
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-[1px] bg-[#00FFA3]" />
              <span className="text-[10px] text-[var(--c-text-2)]">
                Completed
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-[1px] bg-[var(--c-border-subtle)]" />
              <span className="text-[10px] text-[var(--c-text-2)]">
                In Progress
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Track breakdown summary */}
      {stats && stats.courseBreakdown.byTrack && (
        <div className="rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] p-4">
          <h4 className="text-xs font-medium text-[var(--c-text-2)] uppercase tracking-wider mb-3">
            Courses by Track
          </h4>
          <div className="flex flex-wrap gap-3">
            {Object.entries(stats.courseBreakdown.byTrack).map(
              ([track, count]) => (
                <div
                  key={track}
                  className="flex items-center gap-2 rounded-[2px] border border-[var(--c-border-subtle)] px-3 py-2"
                >
                  <div
                    className="w-2 h-2 rounded-[1px]"
                    style={{
                      backgroundColor:
                        TRACK_COLORS[track as TrackType] ?? "#888",
                    }}
                  />
                  <span className="text-xs text-[var(--c-text)]">
                    {TRACK_LABELS[track as TrackType] ?? track}
                  </span>
                  <span className="font-mono text-xs text-[var(--c-text-2)]">
                    {count}
                  </span>
                </div>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}
