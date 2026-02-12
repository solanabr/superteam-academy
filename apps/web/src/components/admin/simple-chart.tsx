'use client';

interface ChartDataPoint {
  label: string;
  value: number;
}

interface SimpleBarChartProps {
  data: ChartDataPoint[];
  title: string;
  color?: string;
  height?: number;
}

export function SimpleBarChart({ data, title, color = 'hsl(142, 76%, 36%)', height = 200 }: SimpleBarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const padding = 40;
  const chartWidth = 400;
  const chartHeight = height;

  return (
    <div className="rounded-xl border bg-card p-6">
      <h3 className="mb-4 text-sm font-semibold">{title}</h3>
      <svg
        viewBox={`0 0 ${chartWidth + padding * 2} ${chartHeight + padding * 2}`}
        className="w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Y axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const y = padding + chartHeight * (1 - frac);
          const val = Math.round(maxValue * frac);
          return (
            <g key={frac}>
              <line
                x1={padding}
                y1={y}
                x2={padding + chartWidth}
                y2={y}
                stroke="currentColor"
                strokeOpacity={0.1}
                strokeWidth={1}
              />
              <text
                x={padding - 5}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-current"
                fontSize={10}
                opacity={0.5}
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const barH = (d.value / maxValue) * chartHeight;
          const x = padding + (i * chartWidth) / data.length + chartWidth / data.length * 0.15;
          const w = (chartWidth / data.length) * 0.7;
          const y = padding + chartHeight - barH;
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={w}
                height={barH}
                fill={color}
                rx={3}
                opacity={0.8}
              />
              <text
                x={x + w / 2}
                y={padding + chartHeight + 15}
                textAnchor="middle"
                className="fill-current"
                fontSize={10}
                opacity={0.5}
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
