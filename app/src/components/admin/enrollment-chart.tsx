'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DataPoint {
  day: number;
  value: number;
  label: string;
}

function generateMockData(): DataPoint[] {
  const data: DataPoint[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const base = 40 + Math.sin(i * 0.3) * 15;
    const noise = Math.random() * 20 - 10;
    const trend = (30 - i) * 0.8;
    data.push({
      day: 30 - i,
      value: Math.max(5, Math.round(base + noise + trend)),
      label: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
    });
  }
  return data;
}

const MOCK_DATA = generateMockData();

const CHART_WIDTH = 800;
const CHART_HEIGHT = 300;
const PADDING = { top: 20, right: 20, bottom: 40, left: 50 };
const INNER_WIDTH = CHART_WIDTH - PADDING.left - PADDING.right;
const INNER_HEIGHT = CHART_HEIGHT - PADDING.top - PADDING.bottom;

export function EnrollmentChart() {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    data: DataPoint;
  } | null>(null);
  const [svgRect, setSvgRect] = useState<DOMRect | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    function updateRect() {
      if (svgRef.current) {
        setSvgRect(svgRef.current.getBoundingClientRect());
      }
    }
    updateRect();
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, []);

  const maxValue = Math.max(...MOCK_DATA.map((d) => d.value));
  const minValue = Math.min(...MOCK_DATA.map((d) => d.value));
  const niceMax = Math.ceil(maxValue / 10) * 10;
  const niceMin = Math.floor(minValue / 10) * 10;
  const niceRange = niceMax - niceMin || 1;

  const xScale = (index: number) =>
    PADDING.left + (index / (MOCK_DATA.length - 1)) * INNER_WIDTH;
  const yScale = (value: number) =>
    PADDING.top + (1 - (value - niceMin) / niceRange) * INNER_HEIGHT;

  const linePath = MOCK_DATA.map(
    (d, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScale(d.value)}`,
  ).join(' ');

  const areaPath = `${linePath} L${xScale(MOCK_DATA.length - 1)},${PADDING.top + INNER_HEIGHT} L${xScale(0)},${PADDING.top + INNER_HEIGHT} Z`;

  const yTicks = 5;
  const yTickValues = Array.from(
    { length: yTicks + 1 },
    (_, i) => niceMin + (niceRange / yTicks) * i,
  );

  const xTickIndices = [0, 6, 13, 20, 29].filter((i) => i < MOCK_DATA.length);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!svgRect) return;
      const mouseX =
        ((e.clientX - svgRect.left) / svgRect.width) * CHART_WIDTH;
      const index = Math.round(
        ((mouseX - PADDING.left) / INNER_WIDTH) * (MOCK_DATA.length - 1),
      );
      if (index >= 0 && index < MOCK_DATA.length) {
        const d = MOCK_DATA[index]!;
        setTooltip({ x: xScale(index), y: yScale(d.value), data: d });
      }
    },
    [svgRect],
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Enrollments (Last 30 Days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="w-full h-auto"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          role="img"
          aria-label="Enrollment chart showing daily enrollments over the last 30 days"
        >
          <defs>
            <linearGradient
              id="enrollment-gradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="oklch(0.541 0.267 293)"
                stopOpacity="0.3"
              />
              <stop
                offset="100%"
                stopColor="oklch(0.541 0.267 293)"
                stopOpacity="0.02"
              />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTickValues.map((tick) => (
            <line
              key={tick}
              x1={PADDING.left}
              y1={yScale(tick)}
              x2={PADDING.left + INNER_WIDTH}
              y2={yScale(tick)}
              className="stroke-border"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          ))}

          {/* Y-axis labels */}
          {yTickValues.map((tick) => (
            <text
              key={`label-${tick}`}
              x={PADDING.left - 10}
              y={yScale(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-muted-foreground text-[11px]"
            >
              {tick}
            </text>
          ))}

          {/* X-axis labels */}
          {xTickIndices.map((i) => (
            <text
              key={`x-${i}`}
              x={xScale(i)}
              y={PADDING.top + INNER_HEIGHT + 24}
              textAnchor="middle"
              className="fill-muted-foreground text-[11px]"
            >
              {MOCK_DATA[i]!.label}
            </text>
          ))}

          {/* Area fill */}
          <path d={areaPath} fill="url(#enrollment-gradient)" />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            className="stroke-primary"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {MOCK_DATA.map((d, i) => (
            <circle
              key={i}
              cx={xScale(i)}
              cy={yScale(d.value)}
              r={tooltip?.data.day === d.day ? 5 : 0}
              className="fill-primary stroke-background"
              strokeWidth="2"
            />
          ))}

          {/* Tooltip */}
          {tooltip && (
            <g>
              {/* Vertical line */}
              <line
                x1={tooltip.x}
                y1={PADDING.top}
                x2={tooltip.x}
                y2={PADDING.top + INNER_HEIGHT}
                className="stroke-muted-foreground/30"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              {/* Tooltip background */}
              <rect
                x={tooltip.x - 50}
                y={tooltip.y - 42}
                width="100"
                height="32"
                rx="6"
                className="fill-foreground"
              />
              {/* Tooltip text */}
              <text
                x={tooltip.x}
                y={tooltip.y - 28}
                textAnchor="middle"
                className="fill-background text-[11px] font-medium"
              >
                {tooltip.data.label}: {tooltip.data.value} enrollments
              </text>
            </g>
          )}
        </svg>
      </CardContent>
    </Card>
  );
}
