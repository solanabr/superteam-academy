/**
 * XpCoinIcon — Reusable SVG coin icon for XP display.
 * Teal ring with gold centre and "XP" text.
 * Used across leaderboard and dashboard components.
 */
interface XpCoinIconProps {
    /** Icon size in pixels */
    size?: number;
    className?: string;
}

export function XpCoinIcon({ size = 14, className = '' }: XpCoinIconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 40 40"
            fill="none"
            role="img"
            aria-label="XP"
            className={className}
        >
            <circle cx="20" cy="20" r="18" fill="#9FD5D1" stroke="#76BFB8" strokeWidth="2" />
            <circle cx="20" cy="20" r="13" fill="#F5D76E" stroke="#E8C84A" strokeWidth="1.5" />
            <text
                x="20"
                y="25"
                textAnchor="middle"
                fontFamily="sans-serif"
                fontWeight="800"
                fontSize="14"
                fill="#333"
            >
                XP
            </text>
        </svg>
    );
}
