"use client";

import { useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import type { StreakData } from "@/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STREAK_QUERY_KEY = ["streak"] as const;
const LOCAL_STORAGE_KEY = "academy_streak";
// CMS / Supabase data: 5 minute stale time
const SUPABASE_STALE_TIME = 5 * 60 * 1000;

// ---------------------------------------------------------------------------
// Local-storage helpers
// ---------------------------------------------------------------------------

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function readLocalStreak(userId: string): StreakData | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StreakData;
    // Discard cached data that belongs to a different user
    if (parsed.user_id !== userId) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeLocalStreak(streak: StreakData): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(streak));
  } catch {
    // Storage quota exceeded — non-fatal
  }
}

/**
 * Applies activity-recording logic to an existing streak record.
 * Returns the updated StreakData or null when no change was needed
 * (activity already recorded today).
 */
function applyActivity(current: StreakData): StreakData | null {
  const today = todayIso();
  if (current.last_activity_date === today) {
    return null; // already recorded today
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayIso = yesterday.toISOString().slice(0, 10);

  const isConsecutive = current.last_activity_date === yesterdayIso;
  const newStreak = isConsecutive ? current.current_streak + 1 : 1;

  return {
    ...current,
    current_streak: newStreak,
    longest_streak: Math.max(current.longest_streak, newStreak),
    last_activity_date: today,
    streak_start_date: isConsecutive ? current.streak_start_date : today,
  };
}

function buildInitialStreak(userId: string): StreakData {
  const today = todayIso();
  return {
    user_id: userId,
    current_streak: 1,
    longest_streak: 1,
    last_activity_date: today,
    streak_start_date: today,
  };
}

// ---------------------------------------------------------------------------
// Supabase helpers
// ---------------------------------------------------------------------------

async function fetchStreakFromSupabase(userId: string): Promise<StreakData | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("streaks")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  return data as StreakData;
}

async function upsertStreakToSupabase(streak: StreakData): Promise<void> {
  const supabase = createClient();
  await supabase.from("streaks").upsert(streak, { onConflict: "user_id" });
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseStreakResult {
  streak: StreakData | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  /** Records an activity event for today. Safe to call multiple times — idempotent within the same calendar day. */
  recordActivity: () => void;
}

/**
 * Returns the current streak for the authenticated user and a stable
 * recordActivity() callback that:
 * 1. Updates localStorage immediately (optimistic)
 * 2. Persists to Supabase in the background when authenticated
 *
 * When the user is not authenticated, streak data is read/written to
 * localStorage only and the query is disabled.
 */
export function useStreak(): UseStreakResult {
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const userId = user?.id ?? "";

  // Fetch from Supabase when authenticated, fall back to localStorage otherwise
  const query = useQuery<StreakData | null, Error>({
    queryKey: [...STREAK_QUERY_KEY, userId],
    queryFn: async () => {
      if (!userId) return null;

      const remote = await fetchStreakFromSupabase(userId);
      if (remote) {
        // Keep localStorage in sync with the authoritative remote value
        writeLocalStreak(remote);
        return remote;
      }

      // Fall through to local cache if Supabase returned nothing
      return readLocalStreak(userId);
    },
    staleTime: SUPABASE_STALE_TIME,
    enabled: isAuthenticated && userId.length > 0,
    // Seed from localStorage while the network request is in-flight
    initialData: () => (userId ? readLocalStreak(userId) : null),
    initialDataUpdatedAt: 0, // treat as stale so the real fetch still runs
  });

  // Sync localStorage into the query cache on first render for guest users
  // (no Supabase fetch, but we still want to show persisted data)
  useEffect(() => {
    if (isAuthenticated || !userId) return;
    const local = readLocalStreak(userId);
    if (local) {
      queryClient.setQueryData([...STREAK_QUERY_KEY, userId], local);
    }
  }, [userId, isAuthenticated, queryClient]);

  const persistMutation = useMutation<void, Error, StreakData>({
    mutationFn: upsertStreakToSupabase,
  });

  const recordActivity = useCallback(() => {
    if (!userId) return;

    const current =
      queryClient.getQueryData<StreakData | null>([...STREAK_QUERY_KEY, userId]) ??
      readLocalStreak(userId) ??
      buildInitialStreak(userId);

    const updated = applyActivity(current);
    if (!updated) return; // already recorded today — no-op

    // Optimistic update
    queryClient.setQueryData([...STREAK_QUERY_KEY, userId], updated);
    writeLocalStreak(updated);

    // Background persist to Supabase when authenticated
    if (isAuthenticated) {
      persistMutation.mutate(updated);
    }
  }, [userId, isAuthenticated, queryClient, persistMutation]);

  return {
    streak: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    recordActivity,
  };
}
