"use client";

type Skill = { label: string; value: number };

// Draw polygon points for a radar chart given N axes and a radius
function polygonPoints(values: number[], maxR: number, cx: number, cy: number) {
    const n = values.length;
    return values
        .map((v, i) => {
            const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
            const r = (v / 100) * maxR;
            return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
        })
        .join(" ");
}

function gridPoints(pct: number, n: number, maxR: number, cx: number, cy: number) {
    const r = pct * maxR;
    return Array.from({ length: n }, (_, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    }).join(" ");
}

type Props = {
    skills: Skill[];
    size?: number;
};

export function SkillRadar({ skills, size = 220 }: Props) {
    if (skills.length < 3) return null;
    const cx = size / 2;
    const cy = size / 2;
    const maxR = size / 2 - 28; // leave room for labels
    const n = skills.length;
    const gridLevels = [0.25, 0.5, 0.75, 1];

    return (
        <div className="flex flex-col items-center gap-3">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
                {/* Grid rings */}
                {gridLevels.map((pct) => (
                    <polygon
                        key={pct}
                        points={gridPoints(pct, n, maxR, cx, cy)}
                        fill="none"
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth={1}
                    />
                ))}
                {/* Axis lines */}
                {skills.map((_, i) => {
                    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
                    return (
                        <line
                            key={i}
                            x1={cx}
                            y1={cy}
                            x2={cx + maxR * Math.cos(angle)}
                            y2={cy + maxR * Math.sin(angle)}
                            stroke="rgba(255,255,255,0.08)"
                            strokeWidth={1}
                        />
                    );
                })}

                {/* Data polygon */}
                <polygon
                    points={polygonPoints(skills.map((s) => s.value), maxR, cx, cy)}
                    fill="rgba(20,241,149,0.15)"
                    stroke="#14F195"
                    strokeWidth={1.5}
                    strokeLinejoin="round"
                />

                {/* Data point dots */}
                {skills.map((s, i) => {
                    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
                    const r = (s.value / 100) * maxR;
                    return (
                        <circle
                            key={i}
                            cx={cx + r * Math.cos(angle)}
                            cy={cy + r * Math.sin(angle)}
                            r={3}
                            fill="#14F195"
                            stroke="rgba(10,10,11,0.8)"
                            strokeWidth={1.5}
                        />
                    );
                })}

                {/* Axis labels */}
                {skills.map((s, i) => {
                    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
                    const labelR = maxR + 20;
                    const x = cx + labelR * Math.cos(angle);
                    const y = cy + labelR * Math.sin(angle);
                    const textAnchor =
                        Math.abs(Math.cos(angle)) < 0.1
                            ? "middle"
                            : Math.cos(angle) > 0
                                ? "start"
                                : "end";
                    return (
                        <text
                            key={i}
                            x={x}
                            y={y}
                            textAnchor={textAnchor}
                            dominantBaseline="central"
                            fontSize={10}
                            fontFamily="JetBrains Mono, monospace"
                            fontWeight={600}
                            fill="rgba(255,255,255,0.7)"
                            className="uppercase tracking-widest"
                        >
                            {s.label}
                        </text>
                    );
                })}
            </svg>

            {/* Legend */}
            <div className="grid grid-cols-3 gap-x-4 gap-y-1.5 mt-1">
                {skills.map((s) => (
                    <div key={s.label} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-solana/60 flex-shrink-0" />
                        <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest truncate">
                            {s.label}
                        </span>
                        <span className="text-[10px] font-mono text-solana font-bold ml-auto">
                            {s.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
