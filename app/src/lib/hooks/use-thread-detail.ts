"use client";

import { useState, useEffect, useCallback } from "react";
import type { Thread, Reply } from "@/lib/supabase/types";

export function useThreadDetail(threadId: string) {
  const [thread, setThread] = useState<Thread | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!threadId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/community/threads/${threadId}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to fetch thread");
      }

      const data = await res.json();
      setThread(data.thread);
      setReplies(data.replies || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch thread");
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const refresh = useCallback(() => {
    fetchDetail();
  }, [fetchDetail]);

  return { thread, replies, loading, error, refresh };
}
