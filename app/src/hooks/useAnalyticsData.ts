'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseAnalyticsDataProps {
  endpointPath: string;
  params?: Record<string, string | number>;
}

export function useAnalyticsData<T>({ endpointPath, params = {} }: UseAnalyticsDataProps) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryString = new URLSearchParams(
    Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .reduce(
        (acc, [key, value]) => {
          acc[key] = String(value);
          return acc;
        },
        {} as Record<string, string>
      )
  ).toString();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const url = `/api/admin/analytics/${endpointPath}${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch analytics data');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [endpointPath, queryString]);

  useEffect(() => {
    fetchData();

    // Set up auto-refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
