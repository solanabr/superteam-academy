'use client';

import type { SkillData } from '@/lib/mock-data';

interface RadarChartProps {
  skills: SkillData;
  size?: number;
}

const LABELS: (keyof SkillData)[] = ['rust', 'anchor', 'frontend', 'security', 'defi', 'tooling'];
const DISPLAY_LABELS: Record<keyof SkillData, string> = {
  rust: 'Rust',
  anchor: 'Anchor',
  frontend: 'Frontend',
  security: 'Security',
  defi: 'DeFi',
  tooling: 'Tooling',
};

export function RadarChart({ skills, size = 250 }: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.35;
  const levels = 5;
  const angleStep = (Math.PI * 2) / LABELS.length;

  function getPoint(index: number, value: number): { x: number; y: number } {
    const angle = angleStep * index - Math.PI / 2;
    const r = (value / 100) * radius;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  }

  // Build polygon points for data
  const dataPoints = LABELS.map((label, i) => getPoint(i, skills[label]));
  const dataPath = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      {/* Grid levels */}
      {Array.from({ length: levels }, (_, li) => {
        const levelValue = ((li + 1) / levels) * 100;
        const points = LABELS.map((_, i) => getPoint(i, levelValue));
        const path = points.map((p) => `${p.x},${p.y}`).join(' ');
        return (
          <polygon
            key={li}
            points={path}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.15}
            strokeWidth={1}
          />
        );
      })}

      {/* Axis lines */}
      {LABELS.map((_, i) => {
        const p = getPoint(i, 100);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke="currentColor"
            strokeOpacity={0.15}
            strokeWidth={1}
          />
        );
      })}

      {/* Data polygon */}
      <polygon
        points={dataPath}
        fill="hsl(142, 76%, 36%)"
        fillOpacity={0.25}
        stroke="hsl(142, 76%, 36%)"
        strokeWidth={2}
      />

      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill="hsl(142, 76%, 36%)" />
      ))}

      {/* Labels */}
      {LABELS.map((label, i) => {
        const p = getPoint(i, 120);
        return (
          <text
            key={label}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-current text-xs"
            fontSize={11}
          >
            {DISPLAY_LABELS[label]}
          </text>
        );
      })}
    </svg>
  );
}
