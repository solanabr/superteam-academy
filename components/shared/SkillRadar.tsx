type SkillRadarProps = {
  values: {
    label: string;
    value: number;
  }[];
};

export function SkillRadar({ values }: SkillRadarProps): JSX.Element {
  const size = 280;
  const center = size / 2;
  const radius = 100;
  const safeValues = values.slice(0, 6);
  const rings = [0.25, 0.5, 0.75, 1];

  const getPoint = (index: number, dist: number) => {
    const angle = (Math.PI * 2 * index) / safeValues.length - Math.PI / 2;
    const x = center + Math.cos(angle) * dist;
    const y = center + Math.sin(angle) * dist;
    return { x, y };
  };

  const dataPoints = safeValues.map((item, index) => {
    const distance = (Math.max(0, Math.min(100, item.value)) / 100) * radius;
    return getPoint(index, distance);
  });

  const axisPoints = safeValues.map((_, index) => getPoint(index, radius));
  const labelPoints = safeValues.map((_, index) => getPoint(index, radius + 20));

  return (
    <div className="space-y-4">
      <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto h-64 w-64">
        {/* Grid rings */}
        {rings.map((scale) => {
          const ringPoints = safeValues
            .map((_, i) => {
              const p = getPoint(i, radius * scale);
              return `${p.x},${p.y}`;
            })
            .join(" ");
          return (
            <polygon
              key={scale}
              points={ringPoints}
              className="fill-none stroke-border"
              strokeWidth={0.5}
              strokeDasharray={scale < 1 ? "3,3" : undefined}
            />
          );
        })}
        {/* Axis lines */}
        {axisPoints.map((p, i) => (
          <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} className="stroke-border" strokeWidth={0.5} />
        ))}
        {/* Data fill */}
        <polygon
          points={dataPoints.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="url(#radarGradient)"
          className="stroke-solana-purple"
          strokeWidth={2}
          opacity={0.9}
        />
        {/* Data points */}
        {dataPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3.5} className="fill-solana-purple stroke-background" strokeWidth={2} />
        ))}
        {/* Labels */}
        {labelPoints.map((p, i) => (
          <text
            key={i}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-muted-foreground text-[10px]"
          >
            {safeValues[i].label}
          </text>
        ))}
        <defs>
          <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9945FF" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#14F195" stopOpacity={0.15} />
          </linearGradient>
        </defs>
      </svg>
      {/* Legend */}
      <div className="grid grid-cols-3 gap-x-4 gap-y-1.5 px-2">
        {safeValues.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">{item.label}</span>
            <span className="text-xs font-semibold tabular-nums">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
