'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────────────────────────
 * Shared types & constants
 * ───────────────────────────────────────────────────────────── */

// Shared chart rendering
const Y_AXIS_LABEL_OFFSET = 10;
const TICK_COUNT = 6;
const TICK_DIVISIONS = TICK_COUNT - 1;

const CHART_COLORS = [
  'oklch(0.541 0.267 293)',   // primary purple
  'oklch(0.592 0.176 152)',   // accent green
  'oklch(0.646 0.222 41.116)', // chart-1 orange
  'oklch(0.6 0.118 184.704)', // chart-2 teal
  'oklch(0.828 0.189 84.429)', // chart-4 yellow
  'oklch(0.769 0.188 70.08)', // chart-5 gold
  'oklch(0.398 0.07 227.392)', // chart-3 dark blue
];

const BG_COLORS = [
  'bg-primary',
  'bg-accent',
  'bg-chart-1',
  'bg-chart-2',
  'bg-chart-4',
  'bg-chart-5',
  'bg-chart-3',
];

/* ─────────────────────────────────────────────────────────────
 * LineChart — Daily Active Users (30 days)
 * ───────────────────────────────────────────────────────────── */

// DAU mock data generation
const DAU_DAYS = 30;
const DAU_BASE = 120;
const DAU_SIN_FREQUENCY = 0.4;
const DAU_AMPLITUDE = 30;
const DAU_WEEKEND_DIP = -25;
const DAU_NOISE_RANGE = 30;
const DAU_TREND_MULTIPLIER = 1.5;
const DAU_MIN_VALUE = 20;

// Line chart axis
const LC_Y_AXIS_ROUNDING = 20;
const LC_X_TICK_INDICES = [0, 7, 14, 21, 29];
const LC_X_AXIS_LABEL_Y_OFFSET = 24;

// Line chart tooltip
const LC_TOOLTIP_DOT_RADIUS = 5;
const LC_TOOLTIP_WIDTH = 110;
const LC_TOOLTIP_HALF_WIDTH = LC_TOOLTIP_WIDTH / 2;
const LC_TOOLTIP_HEIGHT = 28;
const LC_TOOLTIP_RX = 6;
const LC_TOOLTIP_Y_OFFSET = 40;
const LC_TOOLTIP_TEXT_Y_OFFSET = 22;

interface LineChartData {
  label: string;
  value: number;
}

function generateDAUData(): LineChartData[] {
  const data: LineChartData[] = [];
  const now = new Date();
  for (let i = DAU_DAYS - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const base = DAU_BASE + Math.sin(i * DAU_SIN_FREQUENCY) * DAU_AMPLITUDE;
    const weekday = date.getDay();
    const weekendDip = weekday === 0 || weekday === 6 ? DAU_WEEKEND_DIP : 0;
    const noise = Math.random() * DAU_NOISE_RANGE - DAU_NOISE_RANGE / 2;
    const trend = (DAU_DAYS - i) * DAU_TREND_MULTIPLIER;
    data.push({
      label: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      value: Math.max(DAU_MIN_VALUE, Math.round(base + weekendDip + noise + trend)),
    });
  }
  return data;
}

const DAU_DATA = generateDAUData();

const LC_WIDTH = 800;
const LC_HEIGHT = 280;
const LC_PAD = { top: 20, right: 20, bottom: 40, left: 50 };
const LC_INNER_W = LC_WIDTH - LC_PAD.left - LC_PAD.right;
const LC_INNER_H = LC_HEIGHT - LC_PAD.top - LC_PAD.bottom;

export function AnalyticsLineChart() {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    data: LineChartData;
  } | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    function update() {
      if (svgRef.current) setRect(svgRef.current.getBoundingClientRect());
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const maxVal = Math.ceil(Math.max(...DAU_DATA.map((d) => d.value)) / LC_Y_AXIS_ROUNDING) * LC_Y_AXIS_ROUNDING;
  const minVal = Math.floor(Math.min(...DAU_DATA.map((d) => d.value)) / LC_Y_AXIS_ROUNDING) * LC_Y_AXIS_ROUNDING;
  const range = maxVal - minVal || 1;

  const xScale = (i: number) =>
    LC_PAD.left + (i / (DAU_DATA.length - 1)) * LC_INNER_W;
  const yScale = (v: number) =>
    LC_PAD.top + (1 - (v - minVal) / range) * LC_INNER_H;

  const linePath = DAU_DATA.map(
    (d, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScale(d.value)}`,
  ).join(' ');

  const areaPath = `${linePath} L${xScale(DAU_DATA.length - 1)},${LC_PAD.top + LC_INNER_H} L${xScale(0)},${LC_PAD.top + LC_INNER_H} Z`;

  const yTicks = Array.from(
    { length: TICK_COUNT },
    (_, i) => minVal + (range / TICK_DIVISIONS) * i,
  );
  const xTickIndices = LC_X_TICK_INDICES.filter(
    (i) => i < DAU_DATA.length,
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!rect) return;
      const mouseX = ((e.clientX - rect.left) / rect.width) * LC_WIDTH;
      const idx = Math.round(
        ((mouseX - LC_PAD.left) / LC_INNER_W) * (DAU_DATA.length - 1),
      );
      if (idx >= 0 && idx < DAU_DATA.length) {
        const d = DAU_DATA[idx]!;
        setTooltip({ x: xScale(idx), y: yScale(d.value), data: d });
      }
    },
    [rect],
  );

  return (
    <div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${LC_WIDTH} ${LC_HEIGHT}`}
        className="w-full h-auto"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
        role="img"
        aria-label="Line chart of daily active users over 30 days"
      >
        <defs>
          <linearGradient id="dau-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS[0]} stopOpacity="0.25" />
            <stop
              offset="100%"
              stopColor={CHART_COLORS[0]}
              stopOpacity="0.02"
            />
          </linearGradient>
        </defs>

        {yTicks.map((t) => (
          <g key={t}>
            <line
              x1={LC_PAD.left}
              y1={yScale(t)}
              x2={LC_PAD.left + LC_INNER_W}
              y2={yScale(t)}
              className="stroke-border"
              strokeDasharray="4 4"
            />
            <text
              x={LC_PAD.left - Y_AXIS_LABEL_OFFSET}
              y={yScale(t)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-muted-foreground text-[11px]"
            >
              {Math.round(t)}
            </text>
          </g>
        ))}

        {xTickIndices.map((i) => (
          <text
            key={i}
            x={xScale(i)}
            y={LC_PAD.top + LC_INNER_H + LC_X_AXIS_LABEL_Y_OFFSET}
            textAnchor="middle"
            className="fill-muted-foreground text-[11px]"
          >
            {DAU_DATA[i]!.label}
          </text>
        ))}

        <path d={areaPath} fill="url(#dau-grad)" />
        <path
          d={linePath}
          fill="none"
          stroke={CHART_COLORS[0]}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {tooltip && (
          <g>
            <line
              x1={tooltip.x}
              y1={LC_PAD.top}
              x2={tooltip.x}
              y2={LC_PAD.top + LC_INNER_H}
              className="stroke-muted-foreground/30"
              strokeDasharray="4 4"
            />
            <circle
              cx={tooltip.x}
              cy={tooltip.y}
              r={LC_TOOLTIP_DOT_RADIUS}
              fill={CHART_COLORS[0]}
              className="stroke-background"
              strokeWidth="2"
            />
            <rect
              x={tooltip.x - LC_TOOLTIP_HALF_WIDTH}
              y={tooltip.y - LC_TOOLTIP_Y_OFFSET}
              width={LC_TOOLTIP_WIDTH}
              height={LC_TOOLTIP_HEIGHT}
              rx={LC_TOOLTIP_RX}
              className="fill-foreground"
            />
            <text
              x={tooltip.x}
              y={tooltip.y - LC_TOOLTIP_TEXT_Y_OFFSET}
              textAnchor="middle"
              className="fill-background text-[11px] font-medium"
            >
              {tooltip.data.label}: {tooltip.data.value} users
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
 * BarChart — Enrollments per Course
 * ───────────────────────────────────────────────────────────── */

// Bar chart data & rendering
const BC_Y_AXIS_ROUNDING = 100;
const BC_BAR_PADDING_RATIO = 0.2;
const BC_DEFAULT_OPACITY = 0.85;
const BC_X_AXIS_LABEL_Y_OFFSET = 18;
const BC_LABEL_ROTATION = -20;

// Bar chart tooltip
const BC_TOOLTIP_WIDTH = 50;
const BC_TOOLTIP_HALF_WIDTH = BC_TOOLTIP_WIDTH / 2;
const BC_TOOLTIP_HEIGHT = 22;
const BC_TOOLTIP_RX = 4;
const BC_TOOLTIP_Y_OFFSET = 28;
const BC_TOOLTIP_TEXT_Y_OFFSET = 14;

interface BarChartData {
  label: string;
  value: number;
}

const ENROLLMENT_DATA: BarChartData[] = [
  { label: 'Solana Fund.', value: 847 },
  { label: 'Anchor', value: 632 },
  { label: 'Token Ext.', value: 421 },
  { label: 'NFT Mint', value: 389 },
  { label: 'DeFi', value: 276 },
  { label: 'Blinks', value: 198 },
  { label: 'Security', value: 164 },
  { label: 'CPI', value: 112 },
];

const BC_WIDTH = 800;
const BC_HEIGHT = 280;
const BC_PAD = { top: 20, right: 20, bottom: 60, left: 50 };
const BC_INNER_W = BC_WIDTH - BC_PAD.left - BC_PAD.right;
const BC_INNER_H = BC_HEIGHT - BC_PAD.top - BC_PAD.bottom;

export function AnalyticsBarChart() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxVal =
    Math.ceil(Math.max(...ENROLLMENT_DATA.map((d) => d.value)) / BC_Y_AXIS_ROUNDING) * BC_Y_AXIS_ROUNDING;
  const barWidth = BC_INNER_W / ENROLLMENT_DATA.length;
  const barPadding = barWidth * BC_BAR_PADDING_RATIO;
  const actualBarWidth = barWidth - barPadding * 2;

  const yScale = (v: number) =>
    BC_PAD.top + (1 - v / maxVal) * BC_INNER_H;

  const yTicks = Array.from({ length: TICK_COUNT }, (_, i) => (maxVal / TICK_DIVISIONS) * i);

  return (
    <div>
      <svg
        viewBox={`0 0 ${BC_WIDTH} ${BC_HEIGHT}`}
        className="w-full h-auto"
        role="img"
        aria-label="Bar chart of enrollments per course"
      >
        {yTicks.map((t) => (
          <g key={t}>
            <line
              x1={BC_PAD.left}
              y1={yScale(t)}
              x2={BC_PAD.left + BC_INNER_W}
              y2={yScale(t)}
              className="stroke-border"
              strokeDasharray="4 4"
            />
            <text
              x={BC_PAD.left - Y_AXIS_LABEL_OFFSET}
              y={yScale(t)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-muted-foreground text-[11px]"
            >
              {t}
            </text>
          </g>
        ))}

        {ENROLLMENT_DATA.map((d, i) => {
          const x = BC_PAD.left + i * barWidth + barPadding;
          const barH = (d.value / maxVal) * BC_INNER_H;
          const y = BC_PAD.top + BC_INNER_H - barH;
          const isHovered = hoveredIndex === i;

          return (
            <g
              key={d.label}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="cursor-pointer"
            >
              <rect
                x={x}
                y={y}
                width={actualBarWidth}
                height={barH}
                rx="4"
                fill={CHART_COLORS[i % CHART_COLORS.length]}
                opacity={isHovered ? 1 : BC_DEFAULT_OPACITY}
                className="transition-opacity"
              />

              {/* X-axis label */}
              <text
                x={x + actualBarWidth / 2}
                y={BC_PAD.top + BC_INNER_H + BC_X_AXIS_LABEL_Y_OFFSET}
                textAnchor="middle"
                className="fill-muted-foreground text-[10px]"
                transform={`rotate(${BC_LABEL_ROTATION}, ${x + actualBarWidth / 2}, ${BC_PAD.top + BC_INNER_H + BC_X_AXIS_LABEL_Y_OFFSET})`}
              >
                {d.label}
              </text>

              {/* Value label on hover */}
              {isHovered && (
                <g>
                  <rect
                    x={x + actualBarWidth / 2 - BC_TOOLTIP_HALF_WIDTH}
                    y={y - BC_TOOLTIP_Y_OFFSET}
                    width={BC_TOOLTIP_WIDTH}
                    height={BC_TOOLTIP_HEIGHT}
                    rx={BC_TOOLTIP_RX}
                    className="fill-foreground"
                  />
                  <text
                    x={x + actualBarWidth / 2}
                    y={y - BC_TOOLTIP_TEXT_Y_OFFSET}
                    textAnchor="middle"
                    className="fill-background text-[11px] font-medium"
                  >
                    {d.value}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
 * PieChart — Users by Track
 * ───────────────────────────────────────────────────────────── */

// Pie chart rendering
const PIE_LABEL_OFFSET = 24;
const PIE_HOVER_EXPAND = 6;
const PIE_HOVER_INNER_SHRINK = 2;
const PIE_UNHOVERED_OPACITY = 0.5;
const PIE_CENTER_TEXT_Y_UP = 6;
const PIE_CENTER_TEXT_Y_DOWN = 14;

interface PieSlice {
  label: string;
  value: number;
}

const TRACK_DATA: PieSlice[] = [
  { label: 'DeFi', value: 820 },
  { label: 'NFTs', value: 540 },
  { label: 'Infrastructure', value: 430 },
  { label: 'Gaming', value: 310 },
  { label: 'DAOs', value: 250 },
  { label: 'Security', value: 197 },
];

const PIE_SIZE = 300;
const PIE_CX = PIE_SIZE / 2;
const PIE_CY = PIE_SIZE / 2;
const PIE_RADIUS = 110;
const PIE_INNER_RADIUS = 60;

function describeArc(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number,
): string {
  const startOuter = polarToCartesian(cx, cy, outerR, endAngle);
  const endOuter = polarToCartesian(cx, cy, outerR, startAngle);
  const startInner = polarToCartesian(cx, cy, innerR, startAngle);
  const endInner = polarToCartesian(cx, cy, innerR, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 0 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 1 ${endInner.x} ${endInner.y}`,
    'Z',
  ].join(' ');
}

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleInDegrees: number,
) {
  const rad = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

export function AnalyticsPieChart() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const total = TRACK_DATA.reduce((sum, d) => sum + d.value, 0);

  let currentAngle = 0;
  const slices = TRACK_DATA.map((d, i) => {
    const angle = (d.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const midAngle = startAngle + angle / 2;
    const labelPos = polarToCartesian(PIE_CX, PIE_CY, PIE_RADIUS + PIE_LABEL_OFFSET, midAngle);

    return {
      ...d,
      startAngle,
      endAngle,
      midAngle,
      labelPos,
      percentage: ((d.value / total) * 100).toFixed(1),
      color: CHART_COLORS[i % CHART_COLORS.length],
      index: i,
    };
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <svg
          viewBox={`0 0 ${PIE_SIZE} ${PIE_SIZE}`}
          className="w-full max-w-[260px] h-auto"
          role="img"
          aria-label="Donut chart showing user distribution by track"
        >
          {slices.map((slice) => {
            const isHovered = hoveredIndex === slice.index;
            return (
              <g
                key={slice.label}
                onMouseEnter={() => setHoveredIndex(slice.index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              >
                <path
                  d={describeArc(
                    PIE_CX,
                    PIE_CY,
                    isHovered ? PIE_RADIUS + PIE_HOVER_EXPAND : PIE_RADIUS,
                    isHovered ? PIE_INNER_RADIUS - PIE_HOVER_INNER_SHRINK : PIE_INNER_RADIUS,
                    slice.startAngle,
                    slice.endAngle,
                  )}
                  fill={slice.color}
                  opacity={
                    hoveredIndex === null || isHovered ? 1 : PIE_UNHOVERED_OPACITY
                  }
                  strokeWidth="2"
                  className="stroke-background transition-all duration-200"
                />
              </g>
            );
          })}

          {/* Center label */}
          <text
            x={PIE_CX}
            y={PIE_CY - PIE_CENTER_TEXT_Y_UP}
            textAnchor="middle"
            className="fill-foreground text-[22px] font-bold"
          >
            {total.toLocaleString()}
          </text>
          <text
            x={PIE_CX}
            y={PIE_CY + PIE_CENTER_TEXT_Y_DOWN}
            textAnchor="middle"
            className="fill-muted-foreground text-[11px]"
          >
            total users
          </text>
        </svg>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          {slices.map((slice) => (
            <div
              key={slice.label}
              className="flex items-center gap-2"
              onMouseEnter={() => setHoveredIndex(slice.index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <span
                className={cn(
                  'size-3 rounded-sm shrink-0',
                  BG_COLORS[slice.index % BG_COLORS.length],
                )}
              />
              <span className="text-sm text-muted-foreground">
                {slice.label}
              </span>
              <span className="text-sm font-medium ml-auto">
                {slice.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
