"use client";

import { useMemo } from "react";

interface MiniBarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  showLabels?: boolean;
  showValues?: boolean;
}

export function MiniBarChart({
  data,
  height = 120,
  showLabels = true,
  showValues = true,
}: MiniBarChartProps) {
  const maxValue = useMemo(() => Math.max(...data.map((d) => d.value), 1), [data]);

  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((item, i) => {
        const barHeight = Math.max((item.value / maxValue) * (height - 30), 2);
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-0">
            {showValues && (
              <span className="text-[10px] text-muted-foreground font-medium">
                {item.value}
              </span>
            )}
            <div
              className={`w-full rounded-t-sm transition-all ${item.color ?? "bg-primary/80"}`}
              style={{ height: barHeight }}
              title={`${item.label}: ${item.value}`}
            />
            {showLabels && (
              <span className="text-[9px] text-muted-foreground truncate w-full text-center">
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface SparklineProps {
  data: { date: string; count: number }[];
  height?: number;
  color?: string;
  label?: string;
}

export function Sparkline({
  data,
  height = 60,
  color = "stroke-primary",
  label,
}: SparklineProps) {
  const points = useMemo(() => {
    if (data.length === 0) return "";
    const maxVal = Math.max(...data.map((d) => d.count), 1);
    const width = 100;
    const step = width / Math.max(data.length - 1, 1);

    return data
      .map((d, i) => {
        const x = i * step;
        const y = height - 4 - ((d.count / maxVal) * (height - 8));
        return `${x},${y}`;
      })
      .join(" ");
  }, [data, height]);

  const total = useMemo(() => data.reduce((s, d) => s + d.count, 0), [data]);

  return (
    <div className="space-y-1">
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className="text-xs font-medium">{total} total</span>
        </div>
      )}
      <svg
        viewBox={`0 0 100 ${height}`}
        className="w-full"
        style={{ height }}
        preserveAspectRatio="none"
      >
        <polyline
          points={points}
          fill="none"
          className={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  color?: string;
}

export function ProgressRing({
  value,
  max = 100,
  size = 80,
  strokeWidth = 6,
  label,
  color = "stroke-primary",
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percent = Math.min(value / max, 1);
  const offset = circumference - percent * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="stroke-muted"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="text-center">
        <p className="text-lg font-bold">{Math.round(percent * 100)}%</p>
        {label && <p className="text-[10px] text-muted-foreground">{label}</p>}
      </div>
    </div>
  );
}
