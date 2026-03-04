"use client";

import { useEffect, useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { fetchEnrollment } from "@/lib/solana/queries";
import logger from "@/lib/logger";
import type { EnrollmentAccount } from "@/types/program";

export function useEnrollment(courseId: string) {
  const { publicKey } = useWallet();
  const [enrollment, setEnrollment] = useState<EnrollmentAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey || !courseId) return;
    let cancelled = false;

    const loadEnrollment = async () => {
      setError(null);
      setLoading(true);
      try {
        const data = await fetchEnrollment(courseId, publicKey);
        if (!cancelled) setEnrollment(data);
      } catch (err) {
        if (!cancelled) {
          logger.error("[useEnrollment] Failed to load enrollment:", err);
          setError("Failed to load enrollment");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadEnrollment();
    return () => { cancelled = true; };
  }, [publicKey, courseId]);

  const refetch = useCallback(async () => {
    if (!publicKey) return;
    setError(null);
    setLoading(true);
    try {
      const data = await fetchEnrollment(courseId, publicKey);
      setEnrollment(data);
    } catch (err) {
      logger.error("[useEnrollment] Failed to refetch enrollment:", err);
      setError("Failed to load enrollment");
    } finally {
      setLoading(false);
    }
  }, [publicKey, courseId]);

  return { enrollment, loading, error, refetch };
}
