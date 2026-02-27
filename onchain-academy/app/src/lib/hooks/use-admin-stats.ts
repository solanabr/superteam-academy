"use client";

import { useState, useEffect, useCallback } from "react";
import { useAdmin } from "./use-admin";
import type { AdminStats } from "@/app/api/admin/stats/route";

export type { AdminStats };

export function useAdminStats() {
  const { isAdmin } = useAdmin();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isAdmin) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const data: AdminStats = await res.json();
      setStats(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch stats";
      setError(message);
    }

    setLoading(false);
  }, [isAdmin]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { stats, loading, error, refresh };
}
