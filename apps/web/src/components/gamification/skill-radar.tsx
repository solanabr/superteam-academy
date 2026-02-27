"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface SkillData {
  label: string;
  value: number; // 0-100 (normalized)
  lessonCount?: number;
}

interface SkillRadarProps {
  skills: SkillData[];
  /** Actual unique completed lesson count (avoids double-counting across tags) */
  totalLessons?: number;
  className?: string;
}

export function SkillRadar({
  skills,
  totalLessons: totalLessonsProp,
  className,
}: SkillRadarProps) {
  const t = useTranslations("profile");
  const tA11y = useTranslations("a11y");
  const [hovered, setHovered] = useState<number | null>(null);

  if (!skills.length) return null;

  // Chart geometry
  const size = 400;
  const pad = 90;
  const vb = size + pad * 2;
  const cx = vb / 2;
  const cy = vb / 2;
  const radius = size * 0.4;
  const rings = 4;
  const n = skills.length;
  const step = (2 * Math.PI) / n;

  function pt(i: number, pct: number) {
    const a = step * i - Math.PI / 2;
    const r = (pct / 100) * radius;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  }

  const dataPts = skills.map((s, i) => pt(i, s.value));
  const dataPath =
    dataPts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") +
    " Z";

  // Use the prop if provided (actual unique count), otherwise fall back to tag sum
  const totalLessons =
    totalLessonsProp ??
    skills.reduce((sum, s) => sum + (s.lessonCount ?? 0), 0);

  return (
    <div className={cn("skill-chart", className)}>
      <svg
        viewBox={`0 0 ${vb} ${vb}`}
        className="skill-chart-svg"
        role="img"
        aria-label={tA11y("skillRadarChart")}
        onMouseLeave={() => setHovered(null)}
      >
        <defs>
          <linearGradient id="radar-gfill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--accent)" />
          </linearGradient>
          <linearGradient
            id="radar-gstroke"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--accent)" />
          </linearGradient>
        </defs>

        {/* Concentric ring guides */}
        {Array.from({ length: rings }, (_, ri) => {
          const pct = ((ri + 1) / rings) * 100;
          const pts = skills.map((_, i) => pt(i, pct));
          const poly = pts.map((p) => `${p.x},${p.y}`).join(" ");
          return (
            <polygon
              key={ri}
              points={poly}
              fill="none"
              stroke="var(--border)"
              strokeWidth={ri === rings - 1 ? "1" : "0.5"}
              opacity={0.6}
            />
          );
        })}

        {/* Axis spokes */}
        {skills.map((_, i) => {
          const outer = pt(i, 100);
          const active = hovered === i;
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={outer.x}
              y2={outer.y}
              stroke={active ? "var(--primary)" : "var(--border)"}
              strokeWidth={active ? "1.5" : "0.5"}
              opacity={active ? 1 : 0.6}
              style={{ transition: "stroke 0.15s, stroke-width 0.15s" }}
            />
          );
        })}

        {/* Data polygon — filled shape */}
        <path
          d={dataPath}
          fill="url(#radar-gfill)"
          fillOpacity="0.18"
          stroke="url(#radar-gstroke)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Data dots — interactive */}
        {dataPts.map((p, i) => {
          const active = hovered === i;
          const outerPt = pt(i, 100);
          return (
            <g key={i}>
              {/* Fat invisible hit target */}
              <line
                x1={cx}
                y1={cy}
                x2={outerPt.x}
                y2={outerPt.y}
                stroke="transparent"
                strokeWidth="28"
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHovered(i)}
              />
              {/* Outer glow */}
              <circle
                cx={p.x}
                cy={p.y}
                r={active ? 12 : 5}
                fill="var(--primary)"
                fillOpacity={active ? 0.2 : 0.1}
                style={{ transition: "r 0.2s, fill-opacity 0.2s" }}
                pointerEvents="none"
              />
              {/* Dot */}
              <circle
                cx={p.x}
                cy={p.y}
                r={active ? 5 : 3.5}
                fill="var(--primary)"
                stroke="var(--card)"
                strokeWidth="2"
                style={{ transition: "r 0.2s" }}
                pointerEvents="none"
              />
            </g>
          );
        })}

        {/* Outer labels */}
        {skills.map((s, i) => {
          const labelR = radius + 44;
          const a = step * i - Math.PI / 2;
          const lx = cx + labelR * Math.cos(a);
          const ly = cx + labelR * Math.sin(a);
          const active = hovered === i;
          const dimmed = hovered !== null && !active;

          return (
            <g
              key={i}
              style={{
                opacity: dimmed ? 0.3 : 1,
                transition: "opacity 0.2s",
                cursor: "pointer",
              }}
              onMouseEnter={() => setHovered(i)}
            >
              <text
                x={lx}
                y={ly - 8}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: active ? 900 : 700,
                  fontSize: "15px",
                  fill: active ? "var(--primary)" : "var(--text)",
                  transition: "fill 0.15s",
                }}
              >
                {s.label}
              </text>
              <text
                x={lx}
                y={ly + 10}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                  fontSize: "12px",
                  fill: active ? "var(--primary)" : "var(--text-3)",
                  transition: "fill 0.15s",
                }}
              >
                {t("lessonsCount", { count: s.lessonCount ?? 0 })}
              </text>
            </g>
          );
        })}

        {/* Center — total lessons */}
        <circle cx={cx} cy={cy} r="34" fill="var(--card)" />
        <circle
          cx={cx}
          cy={cy}
          r="34"
          fill="none"
          stroke="var(--border)"
          strokeWidth="1.5"
        />
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 900,
            fontSize: "22px",
            fill: "var(--text)",
          }}
        >
          {totalLessons}
        </text>
        <text
          x={cx}
          y={cy + 13}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 600,
            fontSize: "9px",
            fill: "var(--text-3)",
            textTransform: "uppercase",
            letterSpacing: "0.6px",
          }}
        >
          {t("totalLabel")}
        </text>
      </svg>
    </div>
  );
}
