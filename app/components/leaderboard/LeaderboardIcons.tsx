/**
 * LeaderboardIcons — Custom SVG icons for the leaderboard page.
 * No emojis, no external images — pure inline SVG.
 */

/** Trophy icon — custom SVG matching the leaderboard theme. */
export function TrophyIcon({ size = 28, className = '' }: { size?: number; className?: string }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 40 40"
            fill="none"
            className={className}
            role="img"
            aria-hidden="true"
        >
            {/* Cup body */}
            <path
                d="M12 8h16v10c0 4.418-3.582 8-8 8s-8-3.582-8-8V8z"
                fill="#F5D76E"
                stroke="#E8C84A"
                strokeWidth="1.5"
            />
            {/* Left handle */}
            <path
                d="M12 12H8c-1.1 0-2 .9-2 2v2c0 2.2 1.8 4 4 4h2"
                stroke="#E8C84A"
                strokeWidth="1.5"
                fill="none"
            />
            {/* Right handle */}
            <path
                d="M28 12h4c1.1 0 2 .9 2 2v2c0 2.2-1.8 4-4 4h-2"
                stroke="#E8C84A"
                strokeWidth="1.5"
                fill="none"
            />
            {/* Star */}
            <path
                d="M20 13l1.5 3 3.5.5-2.5 2.5.5 3.5L20 21l-3 1.5.5-3.5-2.5-2.5 3.5-.5z"
                fill="#D4A017"
            />
            {/* Stem */}
            <rect x="18" y="26" width="4" height="4" rx="1" fill="#E8C84A" />
            {/* Base */}
            <rect x="14" y="30" width="12" height="3" rx="1.5" fill="#E8C84A" />
        </svg>
    );
}
