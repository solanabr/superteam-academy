/**
 * LeaderboardFilters — Timeframe toggle: All Time / This Month / This Week.
 * Tailwind pill-style buttons with accent highlight. No styled-jsx.
 * Keyboard accessible with proper ARIA attributes.
 */
'use client';

import { useTranslations } from 'next-intl';
import type { Timeframe } from '@/context/types/leaderboard';

interface LeaderboardFiltersProps {
    timeframe: Timeframe;
    onTimeframeChange: (tf: Timeframe) => void;
}

const FILTER_KEYS: { key: string; value: Timeframe }[] = [
    { key: 'allTime', value: 'all-time' },
    { key: 'monthly', value: 'monthly' },
    { key: 'weekly', value: 'weekly' },
];

export function LeaderboardFilters({
    timeframe,
    onTimeframeChange,
}: LeaderboardFiltersProps) {
    const t = useTranslations('leaderboard.filter');

    return (
        <div
            className="inline-flex gap-1 rounded-xl bg-muted/50 border border-border p-1"
            role="tablist"
            aria-label="Leaderboard time period"
        >
            {FILTER_KEYS.map((opt) => {
                const isActive = timeframe === opt.value;
                return (
                    <button
                        key={opt.value}
                        role="tab"
                        aria-selected={isActive}
                        className={`
                            px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium font-supreme
                            transition-all duration-200 cursor-pointer
                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1
                            ${isActive
                                ? 'bg-accent text-accent-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                            }
                        `}
                        onClick={() => onTimeframeChange(opt.value)}
                    >
                        {t(opt.key)}
                    </button>
                );
            })}
        </div>
    );
}
