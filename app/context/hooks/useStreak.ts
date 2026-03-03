/**
 * useStreak — React Query hook for streak data.
 */
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { StreakData } from '@/context/types/streak';

async function fetchStreak(): Promise<StreakData> {
    const res = await fetch('/api/streak');
    if (!res.ok) throw new Error('Failed to fetch streak');
    return res.json();
}

async function recordActivity(data: {
    xpEarned?: number;
    lessonsCompleted?: number;
    coursesCompleted?: number;
}) {
    const res = await fetch('/api/streak/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to record activity');
    return res.json();
}

async function claimMilestoneApi({ days, learnerWallet }: { days: number; learnerWallet: string }) {
    const res = await fetch('/api/streak/milestone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days, learnerWallet }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to claim milestone');
    }
    return res.json();
}

export function useStreak(enabled = true) {
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery<StreakData>({
        queryKey: ['streak'],
        queryFn: fetchStreak,
        enabled,
        staleTime: 30_000, // 30s
    });

    const recordActivityMutation = useMutation({
        mutationFn: recordActivity,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['streak'] });
        },
    });

    const claimMilestoneMutation = useMutation({
        mutationFn: claimMilestoneApi,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['streak'] });
        },
    });

    return {
        streak: data?.streak,
        activity: data?.activity ?? [],
        milestones: data?.milestones ?? [],
        isLoading,
        error,
        recordActivity: recordActivityMutation,
        claimMilestone: claimMilestoneMutation,
    };
}
