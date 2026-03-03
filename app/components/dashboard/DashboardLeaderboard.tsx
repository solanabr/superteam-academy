/**
 * DashboardLeaderboard — List-style leaderboard widget for dashboard.
 */
'use client';

import { useLeaderboard } from '@/context/hooks/useLeaderboard';
import { Link } from '@/context/i18n/navigation';
import type { LeaderboardEntry } from '@/context/types/leaderboard';

/** Coin-style XP icon — teal ring with gold centre. */
function XpCoinIcon({ size = 14 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" role="img" aria-label="XP">
            <circle cx="20" cy="20" r="18" fill="#9FD5D1" stroke="#76BFB8" strokeWidth="2" />
            <circle cx="20" cy="20" r="13" fill="#F5D76E" stroke="#E8C84A" strokeWidth="1.5" />
            <text x="20" y="25" textAnchor="middle" fontFamily="sans-serif" fontWeight="800" fontSize="14" fill="#333">XP</text>
        </svg>
    );
}

/* ── Helpers ── */
function getDisplayName(entry: LeaderboardEntry) {
    return entry.name ||
        (entry.wallet ? `${entry.wallet.slice(0, 4)}...${entry.wallet.slice(-4)}` : 'Anon');
}

function getInitials(entry: LeaderboardEntry) {
    return (entry.name || entry.wallet || 'A').slice(0, 2).toUpperCase();
}

function Avatar({ entry, size }: { entry: LeaderboardEntry; size: number }) {
    const sizeClass = size === 48 ? 'w-12 h-12' : size === 40 ? 'w-10 h-10' : 'w-8 h-8';
    const textSize = size >= 40 ? 'text-sm' : 'text-xs';

    if (entry.avatar) {
        return (
            <img
                src={entry.avatar}
                alt={getDisplayName(entry)}
                width={size}
                height={size}
                className={`${sizeClass} rounded-full object-cover border-2 border-white shadow-sm`}
            />
        );
    }
    return (
        <div className={`${sizeClass} rounded-full bg-secondary flex items-center justify-center ${textSize} font-bold text-secondary-foreground border-2 border-white shadow-sm`}>
            {getInitials(entry)}
        </div>
    );
}

/* ── Main Component ── */
export function DashboardLeaderboard() {
    const { data: leaderboard, isLoading } = useLeaderboard('all-time', 10);

    if (isLoading) {
        return (
            <div className="rounded-3xl p-5 font-supreme shadow-sm" style={{ backgroundColor: 'var(--dash-card-mauve)' }}>
                {/* Header skeleton */}
                <div className="flex items-center justify-between mb-5">
                    <div className="h-5 w-28 rounded animate-pulse" style={{ backgroundColor: 'rgba(0,0,0,0.08)' }} />
                    <div className="h-3 w-14 rounded animate-pulse" style={{ backgroundColor: 'rgba(0,0,0,0.08)' }} />
                </div>
                {/* List rows skeleton */}
                <div className="space-y-1 overflow-hidden" style={{ height: 156 }}>
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 py-2 px-2 -mx-2">
                            <div className="w-6 h-4 rounded animate-pulse" style={{ backgroundColor: 'rgba(0,0,0,0.08)' }} />
                            <div className="w-8 h-8 rounded-full animate-pulse" style={{ backgroundColor: 'rgba(0,0,0,0.08)' }} />
                            <div className="flex-1 space-y-1">
                                <div className="h-4 w-3/4 rounded animate-pulse" style={{ backgroundColor: 'rgba(0,0,0,0.08)' }} />
                                <div className="h-3 w-12 rounded animate-pulse" style={{ backgroundColor: 'rgba(0,0,0,0.08)' }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const entries = leaderboard?.slice(0, 10) ?? [];

    return (
        <div className="rounded-3xl p-5 font-supreme shadow-sm" style={{ backgroundColor: 'var(--dash-card-mauve)', color: '#1b231d' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold font-display" style={{ color: '#1b231d' }}>
                    Leaderboard
                </h2>
                <Link
                    href="/leaderboard"
                    className="text-xs font-semibold hover:underline"
                    style={{ color: '#9b2d86' }}
                >
                    View all
                </Link>
            </div>

            {/* Ranked list — 3 visible, rest scrollable */}
            {entries.length > 0 && (
                <div className="overflow-y-auto hide-scrollbar" style={{ height: 156 }}>
                    <div className="space-y-1">
                        {entries.map((entry, i) => {
                            const rank = i + 1;
                            return (
                                <div
                                    key={entry.userId || rank}
                                    className="flex items-center gap-3 py-2 px-3 rounded-xl transition-colors"
                                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.35)')}
                                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                >
                                    {/* Rank */}
                                    <span className="text-sm font-bold w-6 tabular-nums shrink-0" style={{ color: '#6b3870' }}>
                                        #{rank}
                                    </span>

                                    {/* Avatar */}
                                    <div className="shrink-0">
                                        <Avatar entry={entry} size={32} />
                                    </div>

                                    {/* Name */}
                                    <span className="text-sm font-semibold truncate min-w-0" style={{ color: '#1b231d' }}>
                                        {getDisplayName(entry)}
                                    </span>

                                    {/* XP — pushed to far right */}
                                    <div className="flex items-center gap-1 ml-auto shrink-0">
                                        <XpCoinIcon size={14} />
                                        <span className="text-xs font-bold tabular-nums" style={{ color: '#6b3870' }}>
                                            {(entry.totalXp ?? 0).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {(!leaderboard || leaderboard.length === 0) && !isLoading && (
                <div className="flex items-center justify-center text-sm" style={{ color: '#6b3870', height: 156 }}>
                    No users yet
                </div>
            )}
        </div>
    );
}
