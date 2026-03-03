/**
 * XpBadge — Displays combined on-chain + off-chain XP in the topbar.
 * Uses the lightweight /api/xp endpoint instead of the full leaderboard rank API.
 */
'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

/** Coin-style XP icon — teal ring with gold centre. */
function XpCoinIcon({ size = 20 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="XP">
            {/* Outer ring */}
            <circle cx="20" cy="20" r="18" fill="#9FD5D1" stroke="#76BFB8" strokeWidth="2" />
            {/* Inner gold disc */}
            <circle cx="20" cy="20" r="13" fill="#F5D76E" stroke="#E8C84A" strokeWidth="1.5" />
            {/* "XP" text */}
            <text x="20" y="25" textAnchor="middle" fontFamily="sans-serif" fontWeight="800" fontSize="14" fill="#333">
                XP
            </text>
        </svg>
    );
}

/** Lightweight hook — only fetches current user's XP, not the full leaderboard. */
function useXp() {
    const { data: session } = useSession();
    return useQuery<{ totalXp: number; onchainXp: number; offchainXp: number }>({
        queryKey: ['user-xp', session?.user?.id],
        queryFn: async () => {
            const res = await fetch('/api/xp');
            if (!res.ok) throw new Error('Failed to fetch XP');
            return res.json();
        },
        enabled: !!session?.user?.id,
        staleTime: 30_000, // 30 seconds
    });
}

export function XpBadge() {
    const { data, isLoading } = useXp();

    const loading = isLoading || !data;
    const xp = data?.totalXp ?? 0;

    return (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border" role="status" aria-label={`Experience points: ${loading ? 'loading' : xp}`}>
            <XpCoinIcon size={20} />
            <span className="text-sm font-semibold text-foreground font-supreme tabular-nums">
                {loading ? (
                    <span className="inline-block w-8 h-4 rounded bg-muted animate-pulse" />
                ) : (
                    xp.toLocaleString()
                )}
            </span>
        </div>
    );
}

