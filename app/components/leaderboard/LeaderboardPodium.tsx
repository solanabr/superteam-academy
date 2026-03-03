/**
 * LeaderboardPodium — Top 3 users displayed as dashboard-style pastel cards.
 * Solid plain colors, rounded-3xl, font-supreme — matches dashboard card pattern.
 * Rank badge sits INSIDE the card (top-right corner).
 */
'use client';

import type { LeaderboardEntry } from '@/context/types/leaderboard';
import { UserCell } from './UserCell';
import { RankBadge } from './RankBadge';
import { XpCoinIcon } from './XpCoinIcon';

interface LeaderboardPodiumProps {
    entries: LeaderboardEntry[];
}

/**
 * Solid pastel card colors — lavender / peach / periwinkle.
 * Mirrors the dashboard cards (ActiveCourses, CommunityFeed, Credentials).
 * Dark mode uses deep saturated tones. All solid hex — no opacity.
 */
const CARD_STYLES: Record<number, {
    bg: string;
    innerBg: string;
}> = {
    1: {
        bg: '#DCC8FF',
        innerBg: '#C9AEFC',
    },
    2: {
        bg: '#FFD0B8',
        innerBg: '#FFB898',
    },
    3: {
        bg: '#C0D0F0',
        innerBg: '#A8BDE6',
    },
};

export function LeaderboardPodium({ entries }: LeaderboardPodiumProps) {
    const top3 = entries.slice(0, 3);

    if (top3.length === 0) return null;

    return (
        <section
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6"
            aria-label="Top 3 learners"
        >
            {top3.map((entry) => {
                const style = CARD_STYLES[entry.rank] ?? CARD_STYLES[1];

                return (
                    <article
                        key={entry.userId || entry.wallet}
                        className="rounded-3xl p-5 font-supreme shadow-sm flex flex-col gap-4"
                        style={{
                            backgroundColor: style.bg,
                            color: '#1b231d',
                        }}
                    >
                        {/* Header row: user + rank badge */}
                        <div className="flex items-start justify-between gap-2">
                            <UserCell entry={entry} large podium />
                            <div className="shrink-0" aria-hidden="true">
                                <RankBadge rank={entry.rank} size={44} />
                            </div>
                        </div>

                        {/* Stats grid */}
                        <div className="grid grid-cols-2 gap-2">
                            <StatCell label="ON-CHAIN" value={entry.onchainXp} innerBg={style.innerBg} />
                            <StatCell label="OFF-CHAIN" value={entry.offchainXp} innerBg={style.innerBg} />
                            <div
                                className="col-span-2 flex items-center justify-between rounded-2xl px-4 py-3"
                                style={{ backgroundColor: style.innerBg }}
                            >
                                <span className="text-xs font-semibold" style={{ color: '#1b231d' }}>
                                    Total XP
                                </span>
                                <span className="inline-flex items-center gap-1 text-base font-bold tabular-nums font-array" style={{ color: '#1b231d' }}>
                                    <XpCoinIcon size={16} />
                                    {entry.totalXp.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* Level */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold" style={{ color: '#1b231d' }}>
                                Level
                            </span>
                            <span
                                className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold font-array"
                                style={{ backgroundColor: '#008c4c', color: '#ffffff' }}
                            >
                                {entry.level}
                            </span>
                        </div>
                    </article>
                );
            })}
        </section>
    );
}

/** Skeleton for the podium cards. */
export function LeaderboardPodiumSkeleton() {
    return (
        <section
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6"
            aria-busy="true"
            aria-label="Loading top learners"
        >
            {Array.from({ length: 3 }).map((_, i) => (
                <div
                    key={i}
                    className="rounded-3xl p-5 flex flex-col gap-4"
                    style={{ backgroundColor: i === 0 ? '#E8DAFE' : i === 1 ? '#FDDACE' : '#CEDAEF' }}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full animate-pulse" style={{ backgroundColor: 'rgba(0,0,0,0.08)' }} />
                        <div className="flex flex-col gap-1.5 flex-1">
                            <div className="h-4 w-3/4 rounded animate-pulse" style={{ backgroundColor: 'rgba(0,0,0,0.08)' }} />
                            <div className="h-3 w-1/2 rounded animate-pulse" style={{ backgroundColor: 'rgba(0,0,0,0.08)' }} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="h-14 rounded-2xl animate-pulse" style={{ backgroundColor: 'rgba(0,0,0,0.06)' }} />
                        <div className="h-14 rounded-2xl animate-pulse" style={{ backgroundColor: 'rgba(0,0,0,0.06)' }} />
                        <div className="col-span-2 h-12 rounded-2xl animate-pulse" style={{ backgroundColor: 'rgba(0,0,0,0.06)' }} />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="h-3 w-10 rounded animate-pulse" style={{ backgroundColor: 'rgba(0,0,0,0.06)' }} />
                        <div className="w-7 h-7 rounded-full animate-pulse" style={{ backgroundColor: 'rgba(0,0,0,0.08)' }} />
                    </div>
                </div>
            ))}
        </section>
    );
}

/** Small stat cell used inside podium cards — solid inner color, rounded-2xl. */
function StatCell({ label, value, innerBg }: { label: string; value: number; innerBg: string }) {
    return (
        <div
            className="flex flex-col items-start rounded-2xl px-4 py-3"
            style={{ backgroundColor: innerBg }}
        >
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#1b231d' }}>
                {label}
            </span>
            <span className="text-lg font-bold tabular-nums font-array" style={{ color: '#1b231d' }}>
                {value.toLocaleString()}
            </span>
        </div>
    );
}
