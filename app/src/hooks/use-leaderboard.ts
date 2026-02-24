"use client";

import { useState, useEffect, useCallback } from "react";
import type { LeaderboardEntry } from "@/types/gamification";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

type Timeframe = "weekly" | "monthly" | "alltime";

export function useLeaderboard(params: {
  timeframe?: Timeframe;
  courseId?: string;
} = {}) {
  const { timeframe = "alltime", courseId } = params;
  const { data: session } = useSession();
  const t = useTranslations("leaderboard");

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState(-1);
  const [userEntry, setUserEntry] = useState<LeaderboardEntry | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL("/api/leaderboard", window.location.origin);
      url.searchParams.set("timeframe", timeframe);
      if (courseId) url.searchParams.set("courseId", courseId);
      if (session?.user?.id) url.searchParams.set("userId", session.user.id);

      const res = await fetch(url.toString());
      const data = await res.json();

      setEntries(data.entries || []);
      setUserRank(data.userRank ?? -1);
      setUserEntry(data.userEntry || null);
      setLastSyncedAt(data.lastSyncedAt || null);
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setLoading(false);
    }
  }, [timeframe, courseId, session?.user?.id]);

  const refreshAction = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/leaderboard/sync", { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        if (data.processed > 0) {
          toast.success("Leaderboard synced with on-chain data!");
          fetchLeaderboard();
        } else {
          toast.info(t("nothingToRefresh"));
        }
      } else {
        toast.error(data.error || "Failed to sync leaderboard");
      }
    } catch (error) {
      toast.error("Network error while syncing");
    } finally {
      setRefreshing(false);
    }
  }, [fetchLeaderboard]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    entries,
    userRank,
    userEntry,
    lastSyncedAt,
    loading,
    refreshing,
    refresh: refreshAction
  };
}
