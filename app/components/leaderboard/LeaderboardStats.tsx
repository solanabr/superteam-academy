/**
 * LeaderboardStats — 3 stat cards: Total Learners, Total XP, Courses Completed.
 * Uses Lucide icons instead of emojis. Fully Tailwind, no styled-jsx.
 * Includes skeleton loading for all data-dependent elements.
 */
'use client';

import { Users, Zap, GraduationCap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useLeaderboardStats } from '@/context/hooks/useLeaderboard';
import { useTranslations } from 'next-intl';

interface StatItem {
    label: string;
    value: number;
    Icon: LucideIcon;
    iconColor: string;
}

export function LeaderboardStats() {
    const t = useTranslations('leaderboard');
    const { data: stats, isLoading } = useLeaderboardStats();

    const cards: StatItem[] = [
        {
            label: t('totalLearners'),
            value: stats?.totalUsers ?? 0,
            Icon: Users,
            iconColor: 'text-blue-500 dark:text-blue-400',
        },
        {
            label: t('totalXp'),
            value: stats?.totalXp ?? 0,
            Icon: Zap,
            iconColor: 'text-amber-500 dark:text-amber-400',
        },
        {
            label: t('coursesCompleted'),
            value: stats?.totalCompletions ?? 0,
            Icon: GraduationCap,
            iconColor: 'text-emerald-500 dark:text-emerald-400',
        },
    ];

    return (
        <section
            className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6"
            aria-label="Leaderboard statistics"
        >
            {cards.map((card) => (
                <div
                    key={card.label}
                    className="flex items-center gap-3 rounded-2xl bg-card border border-border shadow-md ring-1 ring-black/[0.04] dark:ring-white/[0.04] px-4 py-3.5 transition-shadow hover:shadow-lg"
                >
                    <div className={`shrink-0 ${card.iconColor}`} aria-hidden="true">
                        <card.Icon className="w-6 h-6" strokeWidth={2} />
                    </div>
                    <div className="flex flex-col min-w-0">
                        {isLoading ? (
                            <div className="h-6 w-12 rounded bg-muted/40 animate-pulse" />
                        ) : (
                            <span className="text-xl font-bold font-array text-foreground tabular-nums">
                                {card.value.toLocaleString()}
                            </span>
                        )}
                        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider font-supreme">
                            {card.label}
                        </span>
                    </div>
                </div>
            ))}
        </section>
    );
}

/** Skeleton for LeaderboardStats — matches the 3-card grid. */
export function LeaderboardStatsSkeleton() {
    return (
        <section
            className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6"
            aria-busy="true"
            aria-label="Loading statistics"
        >
            {Array.from({ length: 3 }).map((_, i) => (
                <div
                    key={i}
                    className="flex items-center gap-3 rounded-2xl bg-card border border-border shadow-md ring-1 ring-black/[0.04] dark:ring-white/[0.04] px-4 py-3.5"
                >
                    <div className="w-6 h-6 rounded bg-muted/40 animate-pulse shrink-0" />
                    <div className="flex flex-col gap-1.5">
                        <div className="h-6 w-14 rounded bg-muted/40 animate-pulse" />
                        <div className="h-3 w-20 rounded bg-muted/30 animate-pulse" />
                    </div>
                </div>
            ))}
        </section>
    );
}
