/**
 * LeaderboardTable — Ranked user list with podium + card rows.
 * Uses XpCoinIcon SVG (no broken images, no emojis).
 * Supports search filtering across all user params.
 * Skeleton loading, current-user highlight, "your rank" bar.
 * Semantic HTML with ARIA attributes and keyboard accessibility.
 */
'use client';

import { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useLeaderboard, useUserRank } from '@/context/hooks/useLeaderboard';
import { LeaderboardFilters } from './LeaderboardFilters';
import { LeaderboardPodium, LeaderboardPodiumSkeleton } from './LeaderboardPodium';
import { RankBadge } from './RankBadge';
import { UserCell } from './UserCell';
import { XpCoinIcon } from './XpCoinIcon';
import type { LeaderboardEntry, Timeframe } from '@/context/types/leaderboard';

interface LeaderboardTableProps {
    searchQuery?: string;
}

function matchesSearch(entry: LeaderboardEntry, query: string): boolean {
    if (!query) return true;
    const q = query.toLowerCase();
    const name = (entry.name || '').toLowerCase();
    const username = (entry.username || '').toLowerCase();
    const wallet = (entry.wallet || '').toLowerCase();
    const rank = String(entry.rank);
    const totalXp = String(entry.totalXp);
    const level = String(entry.level);

    return name.includes(q) || username.includes(q) || wallet.includes(q) || rank === q || totalXp.includes(q) || level === q;
}

export function LeaderboardTable({ searchQuery = '' }: LeaderboardTableProps) {
    const t = useTranslations('leaderboard');
    const { data: session } = useSession();
    const [timeframe, setTimeframe] = useState<Timeframe>('all-time');

    const { data: leaderboard, isLoading } = useLeaderboard(timeframe);
    const { data: userRank } = useUserRank(timeframe);

    const currentWallet = (session?.user as Record<string, unknown> | undefined)?.walletAddress as string | undefined;

    const filteredEntries = useMemo(() => {
        if (!leaderboard) return [];
        if (!searchQuery.trim()) return leaderboard;
        return leaderboard.filter((entry) => matchesSearch(entry, searchQuery.trim()));
    }, [leaderboard, searchQuery]);

    const top3 = filteredEntries.slice(0, 3);
    const rest = filteredEntries.slice(3);

    return (
        <div className="space-y-4">
            {/* Section header with filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-lg font-bold font-supreme text-foreground">
                    {t('rankings')}
                </h2>
                <LeaderboardFilters
                    timeframe={timeframe}
                    onTimeframeChange={setTimeframe}
                />
            </div>

            {/* Top 3 Podium */}
            {isLoading ? (
                <LeaderboardPodiumSkeleton />
            ) : (
                <LeaderboardPodium entries={top3} />
            )}

            {/* Ranked list (4+) */}
            <section
                className="rounded-2xl bg-card border border-border shadow-md ring-1 ring-black/[0.04] dark:ring-white/[0.04] overflow-hidden"
                aria-label="Full rankings"
            >
                {/* Column headers */}
                <div
                    className="hidden sm:grid sm:grid-cols-[60px_1fr_100px_100px_120px_60px] gap-2 px-4 py-3 bg-muted/30 border-b border-border"
                    role="row"
                    aria-hidden="true"
                >
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-supreme text-center">
                        {t('rank')}
                    </span>
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-supreme">
                        {t('user')}
                    </span>
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-supreme text-right">
                        On-Chain
                    </span>
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-supreme text-right">
                        Off-Chain
                    </span>
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-supreme text-right">
                        Total XP
                    </span>
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-supreme text-center">
                        {t('level')}
                    </span>
                </div>

                {/* Rows */}
                <div className="divide-y divide-border" role="list">
                    {isLoading ? (
                        /* Skeleton rows */
                        Array.from({ length: 7 }).map((_, i) => (
                            <div
                                key={i}
                                className="grid grid-cols-[60px_1fr_100px_100px_120px_60px] gap-2 px-4 py-3 items-center"
                                role="listitem"
                            >
                                <div className="h-4 w-8 mx-auto rounded bg-muted/40 animate-pulse" />
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-muted/40 animate-pulse shrink-0" />
                                    <div className="flex flex-col gap-1 flex-1">
                                        <div className="h-4 w-24 rounded bg-muted/40 animate-pulse" />
                                        <div className="h-3 w-16 rounded bg-muted/30 animate-pulse" />
                                    </div>
                                </div>
                                <div className="h-4 w-12 ml-auto rounded bg-muted/30 animate-pulse" />
                                <div className="h-4 w-12 ml-auto rounded bg-muted/30 animate-pulse" />
                                <div className="h-4 w-16 ml-auto rounded bg-muted/30 animate-pulse" />
                                <div className="h-6 w-6 mx-auto rounded-full bg-muted/40 animate-pulse" />
                            </div>
                        ))
                    ) : rest.length > 0 ? (
                        rest.map((entry) => {
                            const isCurrentUser = entry.wallet === currentWallet;

                            return (
                                <div
                                    key={entry.userId || entry.wallet}
                                    className={`
                                        grid grid-cols-1 sm:grid-cols-[60px_1fr_100px_100px_120px_60px] gap-2 px-4 py-3 items-center
                                        transition-colors duration-150
                                        ${isCurrentUser
                                            ? 'bg-accent/10 border-l-3 border-l-accent'
                                            : 'hover:bg-muted/30'
                                        }
                                    `}
                                    role="listitem"
                                    aria-label={`Rank ${entry.rank}`}
                                >
                                    {/* Rank */}
                                    <div className="flex items-center sm:justify-center gap-2 sm:gap-0">
                                        <RankBadge rank={entry.rank} size={28} />
                                        {/* Mobile-only: user info inline */}
                                        <div className="sm:hidden flex-1 min-w-0">
                                            <UserCell entry={entry} />
                                        </div>
                                    </div>

                                    {/* User — desktop only */}
                                    <div className="hidden sm:block">
                                        <UserCell entry={entry} />
                                    </div>

                                    {/* XP columns */}
                                    <div className="flex justify-between sm:justify-end gap-2">
                                        <span className="text-xs text-muted-foreground sm:hidden font-supreme">On-Chain</span>
                                        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums font-array">
                                            {entry.onchainXp.toLocaleString()}
                                        </span>
                                    </div>

                                    <div className="flex justify-between sm:justify-end gap-2">
                                        <span className="text-xs text-muted-foreground sm:hidden font-supreme">Off-Chain</span>
                                        <span className="text-sm font-semibold text-amber-600 dark:text-amber-400 tabular-nums font-array">
                                            {entry.offchainXp.toLocaleString()}
                                        </span>
                                    </div>

                                    <div className="flex justify-between sm:justify-end items-center gap-1">
                                        <span className="text-xs text-muted-foreground sm:hidden font-supreme">Total XP</span>
                                        <span className="inline-flex items-center gap-1 text-sm font-bold text-foreground tabular-nums font-array">
                                            <XpCoinIcon size={14} />
                                            {entry.totalXp.toLocaleString()}
                                        </span>
                                    </div>

                                    {/* Level */}
                                    <div className="flex justify-between sm:justify-center items-center">
                                        <span className="text-xs text-muted-foreground sm:hidden font-supreme">Level</span>
                                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-muted/60 text-xs font-bold text-foreground font-array">
                                            {entry.level}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    ) : !isLoading && (
                        <div className="px-4 py-12 text-center text-muted-foreground text-sm font-supreme" role="listitem">
                            {t('empty')}
                        </div>
                    )}
                </div>
            </section>

            {/* Your rank bar (when user isn't in visible list) */}
            {userRank && userRank.rank > 10 && (
                <div
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 rounded-2xl bg-accent/10 border border-accent/30 px-4 py-3"
                    role="status"
                    aria-label="Your current ranking"
                >
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-supreme">
                        {t('you')}
                    </span>
                    <span className="text-xl font-bold text-accent-foreground tabular-nums font-array">
                        #{userRank.rank}
                    </span>
                    <div className="flex items-center gap-2 sm:ml-auto">
                        <span className="inline-flex items-center gap-1 text-sm font-bold text-foreground tabular-nums font-array">
                            <XpCoinIcon size={14} />
                            {userRank.totalXp.toLocaleString()} XP
                        </span>
                        <span className="text-xs text-muted-foreground font-supreme">
                            ({userRank.onchainXp.toLocaleString()} on-chain + {userRank.offchainXp.toLocaleString()} off-chain)
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
