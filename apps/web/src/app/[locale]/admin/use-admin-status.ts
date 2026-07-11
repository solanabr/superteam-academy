"use client";

import { useState, useEffect, useCallback } from "react";
import type { AdminStatus } from "./admin-status-types";

/** Which failure the last fetch hit — mapped to a translated string by the UI. */
export type AdminStatusError = "fetch" | "network";

export interface UseAdminStatus {
  status: AdminStatus | null;
  loading: boolean;
  /** Non-null while the last fetch failed; cleared on the next attempt. */
  error: AdminStatusError | null;
  /** Re-runs the fetch, resetting loading/error. */
  refetch: () => void;
}

/**
 * Shared data layer for the `/admin/deploy` and `/admin/status` screens: a
 * single `GET /api/admin/status` fetch (authorized via the httpOnly
 * `admin_session` cookie) with loading/error state and a `refetch`. Extracted
 * from the two clients, which held byte-identical copies of this block before
 * the SP3-A route split. Behavior is unchanged (same states, same refetch);
 * the failure is surfaced as a kind so each screen can localize the copy.
 */
export function useAdminStatus(): UseAdminStatus {
  const [status, setStatus] = useState<AdminStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminStatusError | null>(null);

  const refetch = useCallback((): void => {
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const res = await fetch("/api/admin/status");
        if (!res.ok) {
          setError("fetch");
          return;
        }
        const data = (await res.json()) as AdminStatus;
        setStatus(data);
      } catch {
        setError("network");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { status, loading, error, refetch };
}
