'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

export interface SkillAxis {
  track: string;
  value: number;
  max: number;
}

interface SkillRadarProps {
  skills: SkillAxis[];
  className?: string;
}

// Responsive SVG dimensions; viewBox-based so it scales
const SIZE = 300;
const CENTER = SIZE / 2;
const RADIUS = 110;
const RING_COUNT = 4;

const SKILL_COLORS = {
  fill: 'rgba(139, 92, 246, 0.25)',
  stroke: 'rgba(139, 92, 246, 0.8)',
  fillDark: 'rgba(167, 139, 250, 0.2)',
  strokeDark: 'rgba(167, 139, 250, 0.75)',
};

/**
 * Compute (x, y) on the radar for a given axis index
 * at a given normalized fraction (0..1) of the max radius.
 */
function polarToCartesian(
  axisIndex: number,
  totalAxes: number,
  fraction: number,
): [number, number] {
  // Start from top (-PI/2) and go clockwise
  const angle = (2 * Math.PI * axisIndex) / totalAxes - Math.PI / 2;
  const r = RADIUS * fraction;
  return [CENTER + r * Math.cos(angle), CENTER + r * Math.sin(angle)];
}

function buildPolygonPoints(
  fractions: number[],
  totalAxes: number,
): string {
  return fractions
    .map((f, i) => {
      const [x, y] = polarToCartesian(i, totalAxes, f);
      return `${x},${y}`;
    })
    .join(' ');
}

export function SkillRadar({ skills, className }: SkillRadarProps) {
  const n = skills.length;

  // Normalize each skill value to 0..1
  const fractions = useMemo(
    () => skills.map((s) => (s.max > 0 ? Math.min(s.value / s.max, 1) : 0)),
    [skills],
  );

  // Build concentric ring polygons
  const rings = useMemo(() => {
    return Array.from({ length: RING_COUNT }, (_, ringIdx) => {
      const ringFraction = (ringIdx + 1) / RING_COUNT;
      const points = Array.from({ length: n }, (_, axisIdx) => {
        const [x, y] = polarToCartesian(axisIdx, n, ringFraction);
        return `${x},${y}`;
      }).join(' ');
      return points;
    });
  }, [n]);

  // Build axis lines
  const axisLines = useMemo(() => {
    return skills.map((_, i) => {
      const [x, y] = polarToCartesian(i, n, 1);
      return { x1: CENTER, y1: CENTER, x2: x, y2: y };
    });
  }, [skills, n]);

  // Build label positions (slightly outside the outermost ring)
  const labelPositions = useMemo(() => {
    return skills.map((s, i) => {
      const [x, y] = polarToCartesian(i, n, 1.18);
      return { x, y, label: s.track };
    });
  }, [skills, n]);

  // Data polygon
  const dataPolygon = useMemo(
    () => buildPolygonPoints(fractions, n),
    [fractions, n],
  );

  if (n < 3) {
    return (
      <div className={cn('flex items-center justify-center rounded-lg border border-dashed py-12 text-center', className)}>
        <p className="text-sm text-muted-foreground">
          Complete courses in at least 3 tracks to see your skill radar
        </p>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full max-w-[320px]"
        role="img"
        aria-label="Skill distribution radar chart"
      >
        {/* Concentric ring polygons */}
        {rings.map((points, i) => (
          <polygon
            key={`ring-${i}`}
            points={points}
            className="fill-none stroke-border"
            strokeWidth={i === RING_COUNT - 1 ? 1.5 : 0.75}
            strokeDasharray={i < RING_COUNT - 1 ? '3 3' : undefined}
          />
        ))}

        {/* Axis lines from center to outer ring */}
        {axisLines.map((line, i) => (
          <line
            key={`axis-${i}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            className="stroke-border"
            strokeWidth={0.75}
          />
        ))}

        {/* Data polygon - light mode */}
        <polygon
          points={dataPolygon}
          fill={SKILL_COLORS.fill}
          stroke={SKILL_COLORS.stroke}
          strokeWidth={2}
          strokeLinejoin="round"
          className="dark:hidden transition-all duration-500"
        />

        {/* Data polygon - dark mode */}
        <polygon
          points={dataPolygon}
          fill={SKILL_COLORS.fillDark}
          stroke={SKILL_COLORS.strokeDark}
          strokeWidth={2}
          strokeLinejoin="round"
          className="hidden dark:block transition-all duration-500"
        />

        {/* Data point dots */}
        {fractions.map((f, i) => {
          const [cx, cy] = polarToCartesian(i, n, f);
          return (
            <circle
              key={`dot-${i}`}
              cx={cx}
              cy={cy}
              r={3.5}
              className="fill-violet-500 dark:fill-violet-400 stroke-background"
              strokeWidth={2}
            />
          );
        })}

        {/* Labels */}
        {labelPositions.map((pos, i) => (
          <text
            key={`label-${i}`}
            x={pos.x}
            y={pos.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-foreground text-[11px] font-medium"
          >
            {pos.label}
          </text>
        ))}
      </svg>
    </div>
  );
}
