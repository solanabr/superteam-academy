"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface CommunityStats {
  totalThreads: number;
  totalAnswers: number;
  acceptedAnswers: number;
  totalCommunityXp: number;
}

interface UseCommunityStatsReturn {
  stats: CommunityStats | null;
  isLoading: boolean;
}

export function useCommunityStats(
  userId: string | undefined
): UseCommunityStatsReturn {
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    async function fetchStats() {
      setIsLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("community_stats")
        .select("*")
        .eq("user_id", userId!)
        .single();

      if (data) {
        setStats({
          totalThreads: data.total_threads ?? 0,
          totalAnswers: data.total_answers ?? 0,
          acceptedAnswers: data.accepted_answers ?? 0,
          totalCommunityXp: data.total_community_xp ?? 0,
        });
      } else {
        setStats({
          totalThreads: 0,
          totalAnswers: 0,
          acceptedAnswers: 0,
          totalCommunityXp: 0,
        });
      }
      setIsLoading(false);
    }

    fetchStats();
  }, [userId]);

  return { stats, isLoading };
}
