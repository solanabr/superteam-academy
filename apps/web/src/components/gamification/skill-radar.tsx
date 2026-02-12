"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface SkillData {
  label: string;
  value: number; // 0-100
}

interface SkillRadarProps {
  skills: SkillData[];
  size?: number;
  className?: string;
}

const DEFAULT_SKILLS: SkillData[] = [
  { label: "Rust", value: 0 },
  { label: "Anchor", value: 0 },
  { label: "Frontend", value: 0 },
  { label: "Security", value: 0 },
  { label: "DeFi", value: 0 },
  { label: "Testing", value: 0 },
];

export function SkillRadar({
  skills = DEFAULT_SKILLS,
  size = 200,
  className,
}: SkillRadarProps) {
  const tA11y = useTranslations("a11y");
  const center = size / 2;
  const radius = size * 0.35;
  const rings = 4;
  const n = skills.length;
  const angleStep = (2 * Math.PI) / n;

  function getPoint(index: number, value: number): { x: number; y: number } {
    const angle = angleStep * index - Math.PI / 2;
    const r = (value / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  }

  // Data polygon points
  const dataPoints = skills.map((s, i) => getPoint(i, s.value));
  const dataPath =
    dataPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") +
    " Z";

  return (
    <div className={cn("inline-block", className)}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        role="img"
        aria-label={tA11y("skillRadarChart")}
      >
        {/* Background rings */}
        {Array.from({ length: rings }, (_, ringIdx) => {
          const ringValue = ((ringIdx + 1) / rings) * 100;
          const points = skills
            .map((_, i) => {
              const p = getPoint(i, ringValue);
              return `${p.x},${p.y}`;
            })
            .join(" ");
          return (
            <polygon
              key={ringIdx}
              points={points}
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-border"
            />
          );
        })}

        {/* Axis lines */}
        {skills.map((_, i) => {
          const p = getPoint(i, 100);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={p.x}
              y2={p.y}
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-border"
            />
          );
        })}

        {/* Data area */}
        <path
          d={dataPath}
          fill="url(#radar-gradient)"
          fillOpacity="0.3"
          stroke="url(#radar-gradient-stroke)"
          strokeWidth="2"
        />

        {/* Data points */}
        {dataPoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3"
            fill="var(--primary)"
            stroke="var(--accent)"
            strokeWidth="1"
          />
        ))}

        {/* Labels */}
        {skills.map((s, i) => {
          const labelOffset = radius + 24;
          const angle = angleStep * i - Math.PI / 2;
          const lx = center + labelOffset * Math.cos(angle);
          const ly = center + labelOffset * Math.sin(angle);
          return (
            <text
              key={i}
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-text font-body text-[10px]"
            >
              {s.label}
            </text>
          );
        })}

        {/* Gradient defs */}
        <defs>
          <linearGradient
            id="radar-gradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--accent)" />
          </linearGradient>
          <linearGradient
            id="radar-gradient-stroke"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--accent)" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
