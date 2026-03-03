/**
 * Leaderboard hooks — React Query wrappers for leaderboard data.
 */
'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import type {
    LeaderboardEntry,
    LeaderboardStats,
    Timeframe,
    UserRank,
} from '@/context/types/leaderboard';

export function useLeaderboard(timeframe: Timeframe = 'all-time', limit = 100) {
    return useQuery<LeaderboardEntry[]>({
        queryKey: ['leaderboard', timeframe, limit],
        queryFn: async () => {
            const params = new URLSearchParams({
                timeframe,
                limit: String(limit),
            });
            const res = await fetch(`/api/leaderboard?${params}`);
            if (!res.ok) throw new Error('Failed to fetch leaderboard');
            return res.json();
        },
        staleTime: 60_000, // 1 minute
    });
}

export function useUserRank(timeframe: Timeframe = 'all-time') {
    const { data: session } = useSession();

    return useQuery<UserRank>({
        queryKey: ['userRank', session?.user?.id, timeframe],
        queryFn: async () => {
            const res = await fetch(`/api/leaderboard/rank?timeframe=${timeframe}`);
            if (!res.ok) throw new Error('Failed to fetch user rank');
            return res.json();
        },
        enabled: !!session?.user?.id,
        staleTime: 60_000,
    });
}

export function useLeaderboardStats() {
    return useQuery<LeaderboardStats>({
        queryKey: ['leaderboard-stats'],
        queryFn: async () => {
            const res = await fetch('/api/leaderboard/stats');
            if (!res.ok) throw new Error('Failed to fetch stats');
            return res.json();
        },
        staleTime: 60_000,
    });
}
