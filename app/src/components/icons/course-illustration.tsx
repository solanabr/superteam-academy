import type { SVGProps } from "react";

interface CourseIllustrationProps extends SVGProps<SVGSVGElement> {
  /** Track color — used as the primary accent for the illustration */
  trackColor?: string;
  /** Numeric seed (0-5) to pick a unique geometric pattern per course */
  variant?: number;
}

/**
 * Decorative SVG illustration for course card thumbnails.
 * Each variant produces a distinct geometric pattern using the track's accent color.
 */
export function CourseIllustration({
  trackColor = "#4a8c5c",
  variant = 0,
  ...props
}: CourseIllustrationProps) {
  const safeVariant = Math.abs(variant) % 6;
  return (
    <svg
      viewBox="0 0 320 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      {...props}
    >
      <defs>
        <linearGradient
          id={`cg-${safeVariant}`}
          x1="0"
          y1="0"
          x2="320"
          y2="160"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={trackColor} stopOpacity="0.15" />
          <stop offset="1" stopColor={trackColor} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <rect width="320" height="160" fill={`url(#cg-${safeVariant})`} />
      {safeVariant === 0 && <PatternCircuits color={trackColor} />}
      {safeVariant === 1 && <PatternHexGrid color={trackColor} />}
      {safeVariant === 2 && <PatternWaves color={trackColor} />}
      {safeVariant === 3 && <PatternDots color={trackColor} />}
      {safeVariant === 4 && <PatternBlocks color={trackColor} />}
      {safeVariant === 5 && <PatternDiamonds color={trackColor} />}
    </svg>
  );
}

/** Circuit-board-style lines and nodes */
function PatternCircuits({ color }: { color: string }) {
  return (
    <g opacity="0.5">
      {/* Horizontal lines */}
      <line x1="40" y1="40" x2="120" y2="40" stroke={color} strokeWidth="2" />
      <line x1="140" y1="40" x2="200" y2="40" stroke={color} strokeWidth="2" />
      <line x1="60" y1="80" x2="180" y2="80" stroke={color} strokeWidth="2" />
      <line x1="200" y1="80" x2="280" y2="80" stroke={color} strokeWidth="2" />
      <line x1="80" y1="120" x2="240" y2="120" stroke={color} strokeWidth="2" />
      {/* Vertical connectors */}
      <line x1="120" y1="40" x2="120" y2="80" stroke={color} strokeWidth="2" />
      <line x1="200" y1="40" x2="200" y2="80" stroke={color} strokeWidth="2" />
      <line x1="180" y1="80" x2="180" y2="120" stroke={color} strokeWidth="2" />
      {/* Nodes */}
      <circle cx="40" cy="40" r="4" fill={color} />
      <circle cx="120" cy="40" r="4" fill={color} />
      <circle cx="200" cy="40" r="4" fill={color} />
      <circle cx="60" cy="80" r="4" fill={color} />
      <circle cx="180" cy="80" r="4" fill={color} />
      <circle cx="280" cy="80" r="4" fill={color} />
      <circle cx="80" cy="120" r="4" fill={color} />
      <circle cx="240" cy="120" r="4" fill={color} />
      {/* Central icon — code brackets */}
      <text
        x="160"
        y="85"
        textAnchor="middle"
        fontSize="28"
        fill={color}
        opacity="0.6"
        fontFamily="monospace"
      >
        {"</>"}
      </text>
    </g>
  );
}

/** Hexagonal grid pattern */
function PatternHexGrid({ color }: { color: string }) {
  const hexPath = (cx: number, cy: number, r: number) => {
    const pts = Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
    });
    return `M${pts.join("L")}Z`;
  };
  return (
    <g opacity="0.4">
      {/* Grid of hexagons */}
      {[
        [80, 40],
        [140, 40],
        [200, 40],
        [260, 40],
        [50, 80],
        [110, 80],
        [170, 80],
        [230, 80],
        [290, 80],
        [80, 120],
        [140, 120],
        [200, 120],
        [260, 120],
      ].map(([x, y], i) => (
        <path
          key={i}
          d={hexPath(x, y, 22)}
          stroke={color}
          strokeWidth="1.5"
          fill={i % 3 === 0 ? `${color}15` : "none"}
        />
      ))}
      {/* Accent filled hex */}
      <path
        d={hexPath(170, 80, 22)}
        fill={`${color}25`}
        stroke={color}
        strokeWidth="2"
      />
      <text
        x="170"
        y="86"
        textAnchor="middle"
        fontSize="18"
        fill={color}
        opacity="0.7"
        fontFamily="monospace"
      >
        {"{ }"}
      </text>
    </g>
  );
}

/** Flowing wave pattern */
function PatternWaves({ color }: { color: string }) {
  return (
    <g opacity="0.4">
      <path
        d="M0 60 Q40 30 80 60 T160 60 T240 60 T320 60"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M0 80 Q40 50 80 80 T160 80 T240 80 T320 80"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M0 100 Q40 70 80 100 T160 100 T240 100 T320 100"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M0 120 Q40 90 80 120 T160 120 T240 120 T320 120"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M0 40 Q40 10 80 40 T160 40 T240 40 T320 40"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
        opacity="0.5"
      />
      {/* Central shield/credential icon */}
      <path
        d="M150 65L160 60L170 65V78C170 82 160 87 160 87C160 87 150 82 150 78V65Z"
        fill={`${color}30`}
        stroke={color}
        strokeWidth="1.5"
      />
      <path
        d="M156 74L159 77L165 71"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

/** Scattered dot constellation */
function PatternDots({ color }: { color: string }) {
  const dots = [
    [30, 25, 3],
    [60, 50, 2],
    [90, 30, 4],
    [120, 70, 3],
    [150, 20, 2],
    [180, 55, 5],
    [210, 35, 3],
    [240, 65, 2],
    [270, 25, 4],
    [300, 50, 3],
    [45, 100, 2],
    [75, 130, 3],
    [105, 110, 4],
    [135, 140, 2],
    [165, 105, 3],
    [195, 135, 2],
    [225, 115, 5],
    [255, 140, 3],
    [285, 105, 2],
  ];
  const lines: [number, number, number, number][] = [
    [30, 25, 60, 50],
    [60, 50, 90, 30],
    [90, 30, 120, 70],
    [150, 20, 180, 55],
    [180, 55, 210, 35],
    [210, 35, 240, 65],
    [270, 25, 300, 50],
    [45, 100, 75, 130],
    [105, 110, 135, 140],
    [165, 105, 195, 135],
    [195, 135, 225, 115],
  ];
  return (
    <g opacity="0.45">
      {lines.map(([x1, y1, x2, y2], i) => (
        <line
          key={`l-${i}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={color}
          strokeWidth="1"
          opacity="0.4"
        />
      ))}
      {dots.map(([cx, cy, r], i) => (
        <circle
          key={`d-${i}`}
          cx={cx}
          cy={cy}
          r={r}
          fill={color}
          opacity={r > 3 ? 0.6 : 0.35}
        />
      ))}
      {/* Central rocket icon */}
      <path d="M155 90L160 70L165 90L160 85Z" fill={color} opacity="0.6" />
      <circle
        cx="160"
        cy="68"
        r="5"
        fill={`${color}30`}
        stroke={color}
        strokeWidth="1.5"
      />
    </g>
  );
}

/** Stacked block / brick pattern */
function PatternBlocks({ color }: { color: string }) {
  return (
    <g opacity="0.35">
      {/* Row 1 */}
      <rect
        x="20"
        y="20"
        width="60"
        height="30"
        rx="4"
        stroke={color}
        strokeWidth="1.5"
        fill={`${color}10`}
      />
      <rect
        x="90"
        y="20"
        width="90"
        height="30"
        rx="4"
        stroke={color}
        strokeWidth="1.5"
        fill={`${color}08`}
      />
      <rect
        x="190"
        y="20"
        width="50"
        height="30"
        rx="4"
        stroke={color}
        strokeWidth="1.5"
        fill={`${color}15`}
      />
      <rect
        x="250"
        y="20"
        width="50"
        height="30"
        rx="4"
        stroke={color}
        strokeWidth="1.5"
        fill={`${color}08`}
      />
      {/* Row 2 */}
      <rect
        x="20"
        y="60"
        width="40"
        height="30"
        rx="4"
        stroke={color}
        strokeWidth="1.5"
        fill={`${color}08`}
      />
      <rect
        x="70"
        y="60"
        width="80"
        height="30"
        rx="4"
        stroke={color}
        strokeWidth="1.5"
        fill={`${color}20`}
      />
      <rect
        x="160"
        y="60"
        width="60"
        height="30"
        rx="4"
        stroke={color}
        strokeWidth="1.5"
        fill={`${color}08`}
      />
      <rect
        x="230"
        y="60"
        width="70"
        height="30"
        rx="4"
        stroke={color}
        strokeWidth="1.5"
        fill={`${color}12`}
      />
      {/* Row 3 */}
      <rect
        x="20"
        y="100"
        width="70"
        height="30"
        rx="4"
        stroke={color}
        strokeWidth="1.5"
        fill={`${color}12`}
      />
      <rect
        x="100"
        y="100"
        width="50"
        height="30"
        rx="4"
        stroke={color}
        strokeWidth="1.5"
        fill={`${color}08`}
      />
      <rect
        x="160"
        y="100"
        width="80"
        height="30"
        rx="4"
        stroke={color}
        strokeWidth="1.5"
        fill={`${color}15`}
      />
      <rect
        x="250"
        y="100"
        width="50"
        height="30"
        rx="4"
        stroke={color}
        strokeWidth="1.5"
        fill={`${color}08`}
      />
      {/* Central layer icon */}
      <rect
        x="140"
        y="62"
        width="40"
        height="26"
        rx="3"
        fill={color}
        opacity="0.3"
      />
      <path
        d="M150 72H170M150 78H164"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </g>
  );
}

/** Diamond / gem pattern */
function PatternDiamonds({ color }: { color: string }) {
  return (
    <g opacity="0.4">
      {/* Large diamonds */}
      <path
        d="M80 80L110 50L140 80L110 110Z"
        stroke={color}
        strokeWidth="1.5"
        fill={`${color}10`}
      />
      <path
        d="M180 80L210 50L240 80L210 110Z"
        stroke={color}
        strokeWidth="1.5"
        fill={`${color}10`}
      />
      {/* Small diamonds */}
      <path
        d="M30 50L45 35L60 50L45 65Z"
        stroke={color}
        strokeWidth="1"
        fill={`${color}08`}
      />
      <path
        d="M260 50L275 35L290 50L275 65Z"
        stroke={color}
        strokeWidth="1"
        fill={`${color}08`}
      />
      <path
        d="M130 30L145 15L160 30L145 45Z"
        stroke={color}
        strokeWidth="1"
        fill={`${color}08`}
      />
      <path
        d="M130 130L145 115L160 130L145 145Z"
        stroke={color}
        strokeWidth="1"
        fill={`${color}08`}
      />
      {/* Connecting lines */}
      <line
        x1="60"
        y1="50"
        x2="80"
        y2="80"
        stroke={color}
        strokeWidth="1"
        opacity="0.3"
      />
      <line
        x1="140"
        y1="80"
        x2="180"
        y2="80"
        stroke={color}
        strokeWidth="1"
        opacity="0.3"
      />
      <line
        x1="240"
        y1="80"
        x2="260"
        y2="50"
        stroke={color}
        strokeWidth="1"
        opacity="0.3"
      />
      {/* Central gem */}
      <path d="M155 70L160 60L165 70L160 85Z" fill={color} opacity="0.5" />
      <path d="M155 70L160 60L165 70" fill={`${color}`} opacity="0.3" />
    </g>
  );
}
