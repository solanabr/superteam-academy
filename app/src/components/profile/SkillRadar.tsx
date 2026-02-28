"use client";

interface SkillRadarProps {
  skills?: Record<string, number>;
}

const DEFAULT_SKILLS: Record<string, number> = {
  Rust: 70,
  Anchor: 55,
  Frontend: 80,
  Security: 40,
  DeFi: 30,
  NFTs: 60,
};

const SKILL_ORDER = ["Rust", "Anchor", "Frontend", "Security", "DeFi", "NFTs"];

const SIZE = 280;
const CENTER = SIZE / 2;
const MAX_RADIUS = 100;
const RINGS = 5;
const ACCENT = "#14F195";
const FILL = "rgba(20, 241, 149, 0.2)";
const GRID_COLOR = "#1F1F1F";
const LABEL_COLOR = "#EDEDED";
const MUTED = "#666666";

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleRad: number
): [number, number] {
  return [cx + radius * Math.cos(angleRad), cy + radius * Math.sin(angleRad)];
}

function buildHexPoints(cx: number, cy: number, radius: number): string {
  const n = 6;
  const startAngle = -Math.PI / 2;
  const points: string[] = [];
  for (let i = 0; i < n; i++) {
    const angle = startAngle + (2 * Math.PI * i) / n;
    const [x, y] = polarToCartesian(cx, cy, radius, angle);
    points.push(`${x},${y}`);
  }
  return points.join(" ");
}

function buildSkillPolygon(
  cx: number,
  cy: number,
  values: number[],
  maxRadius: number
): string {
  const n = values.length;
  const startAngle = -Math.PI / 2;
  const points: string[] = [];
  for (let i = 0; i < n; i++) {
    const angle = startAngle + (2 * Math.PI * i) / n;
    const radius = (values[i] / 100) * maxRadius;
    const [x, y] = polarToCartesian(cx, cy, radius, angle);
    points.push(`${x},${y}`);
  }
  return points.join(" ");
}

export function SkillRadar({ skills }: SkillRadarProps) {
  const merged: Record<string, number> = { ...DEFAULT_SKILLS, ...skills };
  const values = SKILL_ORDER.map((s) => Math.min(100, Math.max(0, merged[s] ?? 0)));
  const n = SKILL_ORDER.length;
  const startAngle = -Math.PI / 2;

  return (
    <div
      className="bg-card border border-border rounded-lg p-5 flex flex-col items-center"
      style={{ width: "100%", maxWidth: SIZE + 40 }}
    >
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        aria-label="Skill radar chart"
        role="img"
      >
        {/* Hexagonal grid rings */}
        {Array.from({ length: RINGS }, (_, ri) => {
          const r = (MAX_RADIUS * (ri + 1)) / RINGS;
          return (
            <polygon
              key={ri}
              points={buildHexPoints(CENTER, CENTER, r)}
              fill="none"
              stroke={GRID_COLOR}
              strokeWidth={1}
            />
          );
        })}

        {/* Axis lines */}
        {SKILL_ORDER.map((_, i) => {
          const angle = startAngle + (2 * Math.PI * i) / n;
          const [x, y] = polarToCartesian(CENTER, CENTER, MAX_RADIUS, angle);
          return (
            <line
              key={i}
              x1={CENTER}
              y1={CENTER}
              x2={x}
              y2={y}
              stroke={GRID_COLOR}
              strokeWidth={1}
            />
          );
        })}

        {/* Ring value labels (20, 40, 60, 80, 100) */}
        {Array.from({ length: RINGS }, (_, ri) => {
          const r = (MAX_RADIUS * (ri + 1)) / RINGS;
          const val = ((ri + 1) * 100) / RINGS;
          const [lx, ly] = polarToCartesian(CENTER, CENTER, r, startAngle);
          return (
            <text
              key={ri}
              x={lx + 3}
              y={ly - 3}
              fontSize={7}
              fill={MUTED}
              fontFamily="'Geist Mono', monospace"
            >
              {val}
            </text>
          );
        })}

        {/* Skill polygon */}
        <polygon
          points={buildSkillPolygon(CENTER, CENTER, values, MAX_RADIUS)}
          fill={FILL}
          stroke={ACCENT}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />

        {/* Data point dots */}
        {values.map((val, i) => {
          const angle = startAngle + (2 * Math.PI * i) / n;
          const r = (val / 100) * MAX_RADIUS;
          const [px, py] = polarToCartesian(CENTER, CENTER, r, angle);
          return (
            <circle
              key={i}
              cx={px}
              cy={py}
              r={3}
              fill={ACCENT}
              stroke="#0A0A0A"
              strokeWidth={1}
            />
          );
        })}

        {/* Axis labels */}
        {SKILL_ORDER.map((label, i) => {
          const angle = startAngle + (2 * Math.PI * i) / n;
          const labelRadius = MAX_RADIUS + 18;
          const [lx, ly] = polarToCartesian(CENTER, CENTER, labelRadius, angle);

          // Adjust text anchor based on position
          let anchor: "start" | "middle" | "end" = "middle";
          const cosA = Math.cos(angle);
          if (cosA > 0.15) anchor = "start";
          else if (cosA < -0.15) anchor = "end";

          // Adjust dy for top/bottom labels
          const sinA = Math.sin(angle);
          let dy = "0.35em";
          if (sinA < -0.7) dy = "-0.1em";
          else if (sinA > 0.7) dy = "0.9em";

          return (
            <text
              key={label}
              x={lx}
              y={ly}
              dy={dy}
              textAnchor={anchor}
              fontSize={10}
              fontWeight={600}
              fontFamily="'Geist Mono', monospace"
              fill={LABEL_COLOR}
            >
              {label}
            </text>
          );
        })}

        {/* Value annotations on polygon vertices */}
        {values.map((val, i) => {
          const angle = startAngle + (2 * Math.PI * i) / n;
          const r = (val / 100) * MAX_RADIUS;
          const [px, py] = polarToCartesian(CENTER, CENTER, r, angle);

          const cosA = Math.cos(angle);
          const sinA = Math.sin(angle);
          const offset = 10;
          const vx = px + cosA * offset;
          const vy = py + sinA * offset;

          let anchor: "start" | "middle" | "end" = "middle";
          if (cosA > 0.15) anchor = "start";
          else if (cosA < -0.15) anchor = "end";

          return (
            <text
              key={i}
              x={vx}
              y={vy}
              textAnchor={anchor}
              dominantBaseline="middle"
              fontSize={8}
              fill={ACCENT}
              fontFamily="'Geist Mono', monospace"
            >
              {val}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
