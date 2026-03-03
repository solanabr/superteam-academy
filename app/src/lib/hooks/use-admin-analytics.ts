import { useState, useEffect, useCallback } from "react";
import type { AdminAnalyticsData } from "@/lib/admin-analytics";

type Range = "7d" | "30d" | "90d" | "all";

interface UseAdminAnalyticsReturn {
  data: AdminAnalyticsData | null;
  isLoading: boolean;
  error: string | null;
  range: Range;
  setRange: (range: Range) => void;
}

export function useAdminAnalytics(): UseAdminAnalyticsReturn {
  const [data, setData] = useState<AdminAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<Range>("30d");

  const fetchAnalytics = useCallback(async (r: Range) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/analytics?range=${r}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(range);
  }, [range, fetchAnalytics]);

  return { data, isLoading, error, range, setRange };
}
