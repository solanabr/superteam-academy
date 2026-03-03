/**
 * RankBadge — Medal/ribbon badges for top 3, styled number for 4+.
 * Circle on top with rank number, ribbon tail below.
 * Solid plain colors — no transparency.
 */

interface RankBadgeProps {
    rank: number;
    /** Size of the badge in pixels */
    size?: number;
}

const MEDAL_STYLES: Record<number, {
    circleBg: string;
    circleBorder: string;
    ribbonBg: string;
    textColor: string;
}> = {
    1: {
        circleBg: '#FFD700',
        circleBorder: '#DAA520',
        ribbonBg: '#FFF8E7',
        textColor: '#7A5C00',
    },
    2: {
        circleBg: '#E0E0E0',
        circleBorder: '#B0B0B0',
        ribbonBg: '#F0F4F8',
        textColor: '#555555',
    },
    3: {
        circleBg: '#F4A460',
        circleBorder: '#CD7F32',
        ribbonBg: '#FFF3EC',
        textColor: '#6B3A1F',
    },
};

export function RankBadge({ rank, size = 32 }: RankBadgeProps) {
    const medal = MEDAL_STYLES[rank];

    if (!medal) {
        return (
            <span
                className="inline-flex items-center justify-center text-sm font-bold text-muted-foreground tabular-nums"
                style={{ width: size, height: size }}
                aria-label={`Rank ${rank}`}
            >
                #{rank}
            </span>
        );
    }

    // Dimensions
    const circleR = size * 0.42;
    const cx = size / 2;
    const cy = circleR + 2;
    const ribbonW = size * 0.55;
    const ribbonH = size * 0.75; // taller ribbons
    const ribbonTop = cy + circleR * 0.35;
    const totalH = ribbonTop + ribbonH + 2;

    return (
        <svg
            width={size}
            height={totalH}
            viewBox={`0 0 ${size} ${totalH}`}
            fill="none"
            role="img"
            aria-label={`Rank ${rank}`}
        >
            {/* Ribbon tail with V-notch */}
            <path
                d={`
                    M${(size - ribbonW) / 2},${ribbonTop}
                    L${(size + ribbonW) / 2},${ribbonTop}
                    L${(size + ribbonW) / 2},${ribbonTop + ribbonH}
                    L${size / 2},${ribbonTop + ribbonH * 0.78}
                    L${(size - ribbonW) / 2},${ribbonTop + ribbonH}
                    Z
                `}
                fill={medal.ribbonBg}
                stroke={medal.circleBorder}
                strokeWidth="1"
            />
            {/* Rank number on ribbon */}
            <text
                x={cx}
                y={ribbonTop + ribbonH * 0.52}
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="'Array', sans-serif"
                fontWeight="800"
                fontSize={ribbonH * 0.32}
                fill={medal.textColor}
            >
                {rank}
            </text>

            {/* White outer ring */}
            <circle cx={cx} cy={cy} r={circleR + 2.5} fill="white" />
            {/* Colored circle */}
            <circle cx={cx} cy={cy} r={circleR} fill={medal.circleBg} stroke={medal.circleBorder} strokeWidth="1.5" />
            {/* Rank number in circle */}
            <text
                x={cx}
                y={cy}
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily="'Array', sans-serif"
                fontWeight="800"
                fontSize={circleR * 0.95}
                fill={medal.textColor}
            >
                {rank}
            </text>
        </svg>
    );
}
