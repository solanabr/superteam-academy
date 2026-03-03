/**
 * Achievement hooks — React Query hooks for fetching achievements.
 */
'use client';

import { useQuery } from '@tanstack/react-query';
import type { Achievement } from '@/context/types/achievement';

async function fetchAchievements(): Promise<Achievement[]> {
    const res = await fetch('/api/achievements');
    if (!res.ok) throw new Error('Failed to fetch achievements');
    return res.json();
}

/** Fetch all achievements with unlock status for the current user */
export function useAchievements() {
    return useQuery<Achievement[]>({
        queryKey: ['achievements'],
        queryFn: fetchAchievements,
        staleTime: 60_000,
    });
}

/** Fetch a single achievement by ID */
export function useAchievement(achievementId: string) {
    const { data: achievements, ...rest } = useAchievements();
    const achievement = achievements?.find((a) => a.id === achievementId) ?? null;
    return { data: achievement, ...rest };
}
